import { button, color, div, p, popup, span, style, table, td, th, tr } from "../view/html";
import type { Module } from "../types";
import { hightLights } from "../view/main";
import { baselineAnnealing, type AnnealingResult } from "./annealing_baseline";
import { createImprovedAnnealingSession, improvedAnnealing, type ImprovedAnnealingSession } from "./annealing_improved";
import { annealingWasm } from "./annealing_wasm";
import { annealingWasmImproved } from "./annealing_wasm_improved";
import { AVG_SPEED_KMH, getDeck, getReq, initAnnealingState, isLoad, KM_COST_CENTS, REORG_COST_CENTS, scoreRoute } from "./annealing_shared";

export const availableSolvers = {
  baseline: baselineAnnealing,
  improved: improvedAnnealing,
  wasm: annealingWasm,
  wasmImproved: annealingWasmImproved,
} as const;
type SolverName = keyof typeof availableSolvers;

const INITIAL_SOLVER: SolverName = "wasmImproved";
const euros = (cents: number) => `${(cents / 100).toFixed(2)}€`;

class ScoreMismatchError extends Error {}

function canonicalSchedule(mod: Module, result: AnnealingResult) {
  const schedule = new Uint32Array(result.schedule)
  for (let tran = 0; tran < mod.NTRANS; tran++) {
    const size = result.scheduleSizes[tran]!
    if (size < 0 || size > result.TSIZE) throw new ScoreMismatchError(`Transporter ${tran} has invalid schedule size ${size}`)
    for (let i = 0; i < size; i++) {
      const at = tran * result.TSIZE + i
      const step = schedule[at]
      if (step === undefined) throw new ScoreMismatchError(`Transporter ${tran} schedule is truncated at ${i}`)
      const req = getReq(step), request = mod.requests[req]
      if (!request) throw new ScoreMismatchError(`Transporter ${tran} references unknown request ${req}`)
      const pos = isLoad(step) ? request.startPoint : request.endPoint
      schedule[at] = (step & 0xffff) | pos << 16
    }
  }
  return schedule
}

function checkedResult(mod: Module, result: AnnealingResult) {
  if (result.scheduleSizes.length !== mod.NTRANS || result.scheduleRatings.length !== mod.NTRANS)
    throw new ScoreMismatchError("Solver returned incorrectly sized transporter arrays")
  const schedule = canonicalSchedule(mod, result)
  const state = initAnnealingState(mod)
  Object.assign(state, {
    TSIZE: result.TSIZE,
    schedule,
    scheduleSizes: result.scheduleSizes,
    scheduleRatings: result.scheduleRatings,
    tranStart: result.tranStart,
    unassigned: result.unassigned,
  })
  let total = 0
  for (let tran = 0; tran < mod.NTRANS; tran++) {
    const expected = scoreRoute(state, tran), reported = result.scheduleRatings[tran]!
    if (reported !== expected)
      throw new ScoreMismatchError(`Transporter ${tran} score mismatch: reported ${reported}, JS ${expected}`)
    total += expected
  }
  if (result.totalScore !== total)
    throw new ScoreMismatchError(`Total score mismatch: reported ${result.totalScore}, JS ${total}`)
  return result
}

export async function plannerView(mod: Module): Promise<HTMLElement> {
  const outerBorder = "1px solid " + color.gray;
  const innerBorder = "1px solid " + color.lightgray;
  const cellPadding = ".35em .5em";
  const scheduleCellMinHeight = "2.1em";

  let annealer: AnnealingResult | null = null;
  let annealingSession: ImprovedAnnealingSession | null = null;
  let annealingTimer: number | null = null;
  let runId = 0;

  function itemButton(item: number, load?: boolean) {
    const req = mod.requests[item]!;
    const sp = span(
      item.toString().padStart(3, " "),
      style({
        cursor: "pointer",
        border: "2px solid transparent",
        borderRadius: ".2em",
        whiteSpace: "pre",
        fontFamily: "monospace",
      }),
      function () {
        popup(
          p("item ", item),
          table(
            tr(cell("status"), cell(load ? "load" : load === false ? "unload" : "unassigned")),
            tr(cell("value"), cell(req.value_eur + "€")),
            tr(cell("dist"), cell(mod.roadmap.getCostN(req.startPoint, req.endPoint) + "km")),
            tr(cell("deadline"), cell(req.deadline_h.toFixed(2) + "h")),
          ),
        );
      },
    );

    let points = [
      { number: req.startPoint, logo: "📦" },
      { number: req.endPoint, logo: "🏠" },
    ];

    if (load === true) points = [points[0]!];
    if (load === false) points = [points[1]!];

    sp.onmouseenter = () => {
      sp.style.borderColor = color.green;
      hightLights.set([{ points }]);
    };
    sp.onmouseleave = () => {
      sp.style.borderColor = "transparent";
    };
    return sp;
  }

  const cell: typeof td = (...x) => td(style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), ...x);
  const controls = div(style({ display: "flex", gap: ".5em", alignItems: "center", flexWrap: "wrap" }));
  const scoreLine = p();
  const timeLine = p();
  const solverSelect = document.createElement("select");
  for (const name of Object.keys(availableSolvers) as SolverName[]) solverSelect.add(new Option(name, name));
  solverSelect.value = INITIAL_SOLVER;
  const solverLine = p("solver: ", solverSelect);
  const detailWrap = div();
  const tableWrap = div(
    style({
      overflowX: "auto",
      overflowY: "hidden",
      maxWidth: "100%",
    }),
  );

  const runButton = button("start");
  const heatButton = button("heat up");
  let renderCounter = 0;

  function stopSearch() {
    if (annealingTimer != null) {
      clearInterval(annealingTimer);
      annealingTimer = null;
    }
    runButton.textContent = "start";
  }

  function renderTable() {
    const tab = table(
      style({
        borderCollapse: "collapse",
        width: "100%",
      }),
      tr(
        th("transporter", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })),
        th("value", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })),
        th("steps", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })),
      ),
      mod.startpositions.map((start, tran) =>
        tr(
          td(
            tran,
            style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }),
            function () {
              popup(
                p("transporter: ", tran),
                p("start: ", start),
                p("score: ", euros(annealer?.scheduleRatings[tran] ?? 0)),
                p("steps: ", annealer?.scheduleSizes[tran]!),
              );
            },
            {
              onmouseenter: () => {
                const points = [{ number: start, logo: "🚛" }];
                if (annealer) {
                  for (let i = 0; i < annealer.scheduleSizes[tran]!; i++) {
                    const step = annealer.schedule[tran * annealer.TSIZE + i]!;
                    const request = mod.requests[getReq(step)]!;
                    points.push({ number: isLoad(step) ? request.startPoint : request.endPoint, logo: "" });
                  }
                }
                hightLights.set([{ points }]);
              },
              onmouseleave: () => {
                hightLights.set([]);
              },
            },
          ),
          td(euros(annealer?.scheduleRatings[tran] ?? 0), style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })),
          td(
            table(
              style({
                borderCollapse: "collapse",
              }),
              [0, 1].map((deck) =>
                tr(
                  Array.from({ length: annealer!.scheduleSizes[tran]! }, (_, i) => {
                    const step = annealer?.schedule[tran * annealer.TSIZE + i]!;
                    const load = isLoad(step);
                    return td(
                      getDeck(step) === deck ? itemButton(getReq(step), !!load) : "",
                      style({
                        color: load ? color.blue : color.green,
                        border: innerBorder,
                        padding: ".2em .3em",
                        minWidth: "2.6em",
                        height: scheduleCellMinHeight,
                        boxSizing: "border-box",
                      }),
                    );
                  }),
                ),
              ),
            ),
            style({
              border: outerBorder,
              padding: ".25em",
              verticalAlign: "top",
            }),
          ),
        ),
      ),
    );

    tableWrap.replaceChildren(tab);
  }

  function renderStatus() {
    if (!annealer) return;
    scoreLine.textContent = `score: ${euros(annealer.totalScore)}`;
    timeLine.textContent = `search time: ${(annealer!.elapsedMs/1000).toFixed(2)} s`;

    detailWrap.replaceChildren(
      div(
        p("details"),
        table(
          style({
            borderCollapse: "collapse",
          }),
          tr(cell("unassigned requests"), cell(Array.from(annealer!.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]))),
          tr(cell("search time"), cell(`${annealer?.elapsedMs ?? 0}ms`)),
          tr(cell("score"), cell(euros(annealer.totalScore))),
          tr(cell("transporter count"), cell(mod.NTRANS)),
          tr(cell("request count"), cell(mod.NREQS)),
          tr(cell("cost per km"), cell(euros(KM_COST_CENTS))),
          tr(cell("average speed"), cell(`${AVG_SPEED_KMH}km/h`)),
          tr(cell("reorganization cost"), cell(euros(REORG_COST_CENTS))),
        ),
      ),
    );
  }

  function render(forceTable = false) {
    if (!annealer) return;
    renderStatus();
    if (forceTable || (renderCounter++ % 4 === 0)) renderTable();
  }

  async function runSolver(name: SolverName) {
    stopSearch();
    const id = ++runId;
    annealingSession = null;
    annealer = null;
    runButton.disabled = true;
    scoreLine.textContent = "running…";
    tableWrap.replaceChildren();
    let result: AnnealingResult | null = null;
    try {
      if (name === "improved") {
        annealingSession = createImprovedAnnealingSession(mod, 1_900_000);
        result = annealingSession.iterateForMs(10);
      } else {
        result = await availableSolvers[name](mod);
      }
      annealer = checkedResult(mod, result);
      if (id === runId) {
        render(true);
      }
    } catch (error) {
      if (error instanceof ScoreMismatchError) throw error;
      if (id === runId) scoreLine.textContent = `solver failed: ${String(error)}`;
    } finally {
      if (id === runId) {
        runButton.disabled = false;
        runButton.textContent = name === "improved" ? "start" : "run";
        heatButton.hidden = name !== "improved";
      }
    }
  }

  runButton.onclick = () => {
    const name = solverSelect.value as SolverName;
    if (name !== "improved") {
      void runSolver(name);
      return;
    }
    if (annealingTimer != null) {
      stopSearch();
      return;
    }
    runButton.textContent = "stop";
    annealingTimer = window.setInterval(() => {
      if (!annealingSession) return;
      annealer = checkedResult(mod, annealingSession.iterateForMs(120));
      render();
    }, 150);
  };

  heatButton.onclick = () => {
    if (!annealingSession) return;
    annealer = checkedResult(mod, annealingSession.reheat());
    render(true);
  };

  solverSelect.onchange = () => void runSolver(solverSelect.value as SolverName);
  controls.replaceChildren(runButton, heatButton);
  await runSolver(INITIAL_SOLVER);

  return div(
    style({
      padding: "1em",
      overflowY: "auto",
      overflowX: "hidden",
      height: "100%",
      boxSizing: "border-box",
      minHeight: "0",
    }),
    controls,
    solverLine,
    scoreLine,
    timeLine,
    tableWrap,
    detailWrap,
  );
}
