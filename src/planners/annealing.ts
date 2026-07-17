import { button, color, div, p, popup, span, style, table, td, th, tr } from "../view/html";
import type { Module } from "../types";
import { hightLights } from "../view/main";
import { baselineAnnealing, type AnnealingResult } from "./annealing_baseline";
import { createImprovedAnnealingSession, improvedAnnealing, type ImprovedAnnealingSession } from "./annealing_improved";
import { annealingWasm } from "./annealing_wasm";
import { getDeck, getReq, isLoad } from "./annealing_shared";

export const availableSolvers = {
  baseline: baselineAnnealing,
  improved: improvedAnnealing,
  wasm: annealingWasm,
} as const;
type SolverName = keyof typeof availableSolvers;

const INITIAL_SOLVER: SolverName = "wasm";
const KM_COST = 0.5;
const AVG_SPEED_KMH = 60;
const REORG_COST_EUR = 100;

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
  const unassignedLine = p();
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
                p("score: ", annealer?.scheduleRatings[tran]!),
                p("steps: ", annealer?.scheduleSizes[tran]!),
              );
            },
            {
              onmouseenter: () => {
                hightLights.set([{ points: [{ number: start, logo: "🚛" }] }]);
              },
              onmouseleave: () => {
                hightLights.set([]);
              },
            },
          ),
          td(annealer?.scheduleRatings[tran]!, style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })),
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
    scoreLine.textContent = `score: ${annealer?.totalScore ?? 0}`;
    timeLine.textContent = `search time: ${(annealer!.elapsedMs/1000).toFixed(2)} s`;
    unassignedLine.replaceChildren(
      "unassigned: ",
      ...Array.from(annealer!.unassigned)
        .map((x, i) => ({ x, i }))
        .filter((x) => x.x)
        .flatMap((x) => [span(" "), itemButton(x.i)]),
    );

    detailWrap.replaceChildren(
      div(
        p("details"),
        table(
          style({
            borderCollapse: "collapse",
          }),
          tr(cell("unassigned requests"), cell(Array.from(annealer!.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]))),
          tr(cell("search time"), cell(`${annealer?.elapsedMs ?? 0}ms`)),
          tr(cell("score"), cell(annealer?.totalScore ?? 0)),
          tr(cell("transporter count"), cell(mod.NTRANS)),
          tr(cell("request count"), cell(mod.NREQS)),
          tr(cell("cost per km"), cell(`${KM_COST}€`)),
          tr(cell("average speed"), cell(`${AVG_SPEED_KMH}km/h`)),
          tr(cell("reorganization cost"), cell(`${REORG_COST_EUR}€`)),
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
    try {
      if (name === "improved") {
        annealingSession = createImprovedAnnealingSession(mod, 1_900_000);
        annealer = annealingSession.iterateForMs(10);
      } else {
        annealer = await availableSolvers[name](mod);
      }
      if (id === runId) render(true);
    } catch (error) {
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
      annealer = annealingSession.iterateForMs(120);
      render();
    }, 150);
  };

  heatButton.onclick = () => {
    if (!annealingSession) return;
    annealer = annealingSession.reheat();
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
    unassignedLine,
  );
}
