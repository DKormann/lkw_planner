import { randInt, random } from "../random";
import type { Module } from "../types";
import type { AnnealingResult } from "./annealing_baseline";
import { baselineAnnealing } from "./annealing_baseline";
import {
  acceptAnneal,
  bootstrapEmptyRoutes,
  initAnnealingState,
  insertStops,
  type PairInfo,
  removeStops,
  sampleAssignedPair,
  sampleUnassignedReq,
  scoreRoute,
  toAnnealingResult,
} from "./annealing_shared";

type ImprovedOptions =
  | { steps: number; budgetMs?: never }
  | { budgetMs: number; steps?: never };

export type ImprovedAnnealingSession = {
  iterateSteps: (steps: number) => AnnealingResult;
  iterateForMs: (budgetMs: number) => AnnealingResult;
  getResult: () => AnnealingResult;
  reheat: (factor?: number) => AnnealingResult;
};

export function createImprovedAnnealingSession(mod: Module, targetSteps = 150000): ImprovedAnnealingSession {
  const warmupSteps = Math.min(Math.max(20000, Math.floor(targetSteps * 0.2)), 50000);
  const warmup = baselineAnnealing(mod, warmupSteps);
  const state = initAnnealingState(mod, warmup);
  const { NTRANS, scheduleSizes, scheduleRatings, unassigned } = state;
  bootstrapEmptyRoutes(state);

  let startTemp = 120;
  let endTemp = 0.5;
  let temp = startTemp;

  function tryAssignSampled(samples = 8) {
    let best: null | { tran: number; req: number; a: number; b: number; deck: 0 | 1; score: number } = null;

    for (let sample = 0; sample < samples; sample++) {
      const req = sampleUnassignedReq(state);
      if (req == null) break;

      const tran = randInt(0, NTRANS);
      const size = scheduleSizes[tran]!;
      const a = randInt(0, size + 1);
      const b = Math.min(size, a + randInt(0, Math.min(6, size - a + 1)));
      const deck = (random() > 0.5 ? 1 : 0) as 0 | 1;

      insertStops(state, tran, a, b, deck, req);
      const newScore = scoreRoute(state, tran);
      removeStops(state, tran, a, b + 1);

      if (!best || newScore > best.score) {
        best = { tran, req, a, b, deck, score: newScore };
      }
    }

    if (!best) return;

    insertStops(state, best.tran, best.a, best.b, best.deck, best.req);
    if (acceptAnneal(scheduleRatings[best.tran]!, best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
      unassigned[best.req] = 0;
    } else {
      removeStops(state, best.tran, best.a, best.b + 1);
    }
  }

  function tryUnassignSampled(samples = 6) {
    let best: null | { tran: number; pair: PairInfo; score: number } = null;

    for (let sample = 0; sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen) break;
      const { tran, pair } = chosen;
      removeStops(state, tran, pair.first, pair.second);
      const newScore = scoreRoute(state, tran);
      insertStops(state, tran, pair.first, pair.second - 1, pair.deck, pair.req);

      if (!best || newScore > best.score) {
        best = { tran, pair, score: newScore };
      }
    }

    if (!best) return;

    removeStops(state, best.tran, best.pair.first, best.pair.second);
    if (acceptAnneal(scheduleRatings[best.tran]!, best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
      unassigned[best.pair.req] = 1;
    } else {
      insertStops(state, best.tran, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }

  function tryRelocateSampled(samples = 8) {
    let best: null | {
      src: number;
      dst: number;
      pair: PairInfo;
      insertA: number;
      insertB: number;
      score: number;
      oldScore: number;
    } = null;

    for (let sample = 0; sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen) break;

      const { tran: src, pair } = chosen;
      const dst = randInt(0, NTRANS);
      const oldScore = src === dst
        ? scheduleRatings[src]!
        : scheduleRatings[src]! + scheduleRatings[dst]!;

      removeStops(state, src, pair.first, pair.second);

      const dstSize = scheduleSizes[dst]!;
      const a = randInt(0, dstSize + 1);
      const b = Math.min(dstSize, a + randInt(0, Math.min(6, dstSize - a + 1)));
      insertStops(state, dst, a, b, pair.deck, pair.req);

      const candidateScore = src === dst
        ? scoreRoute(state, src)
        : scoreRoute(state, src) + scoreRoute(state, dst);

      removeStops(state, dst, a, b + 1);
      insertStops(state, src, pair.first, pair.second - 1, pair.deck, pair.req);

      if (!best || candidateScore > best.score) {
        best = {
          src,
          dst,
          pair,
          insertA: a,
          insertB: b,
          score: candidateScore,
          oldScore,
        };
      }
    }

    if (!best) return;

    removeStops(state, best.src, best.pair.first, best.pair.second);
    insertStops(state, best.dst, best.insertA, best.insertB, best.pair.deck, best.pair.req);

    if (acceptAnneal(best.oldScore, best.score, temp)) {
      if (best.src === best.dst) {
        scheduleRatings[best.src] = scoreRoute(state, best.src);
      } else {
        scheduleRatings[best.src] = scoreRoute(state, best.src);
        scheduleRatings[best.dst] = scoreRoute(state, best.dst);
      }
    } else {
      removeStops(state, best.dst, best.insertA, best.insertB + 1);
      insertStops(state, best.src, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }

  function tryReinsertSampled(samples = 8) {
    let best: null | {
      tran: number;
      pair: PairInfo;
      insertA: number;
      insertB: number;
      score: number;
    } = null;

    for (let sample = 0; sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen) break;

      const { tran, pair } = chosen;
      removeStops(state, tran, pair.first, pair.second);

      const size = scheduleSizes[tran]!;
      const a = randInt(0, size + 1);
      const b = Math.min(size, a + randInt(0, Math.min(6, size - a + 1)));
      insertStops(state, tran, a, b, pair.deck, pair.req);

      const candidateScore = scoreRoute(state, tran);

      removeStops(state, tran, a, b + 1);
      insertStops(state, tran, pair.first, pair.second - 1, pair.deck, pair.req);

      if (!best || candidateScore > best.score) {
        best = {
          tran,
          pair,
          insertA: a,
          insertB: b,
          score: candidateScore,
        };
      }
    }

    if (!best) return;

    removeStops(state, best.tran, best.pair.first, best.pair.second);
    insertStops(state, best.tran, best.insertA, best.insertB, best.pair.deck, best.pair.req);

    if (acceptAnneal(scheduleRatings[best.tran]!, best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
    } else {
      removeStops(state, best.tran, best.insertA, best.insertB + 1);
      insertStops(state, best.tran, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }

  const sessionStartedAt = Date.now();
  let i = 0;
  const tempFloor = 3;
  const reheatTemp = 45;

  function runIterations(iterationBudget: number, deadline = Infinity) {
    const endIteration = Math.min(targetSteps, i + iterationBudget);
    while (i < endIteration) {
      if ((i & 2047) === 0 && Date.now() >= deadline) break;
      const progress = i / targetSteps;
      temp = startTemp * Math.pow(endTemp / startTemp, progress);

      const r = random();
      if (r < 0.4) tryAssignSampled();
      else if (r < 0.55) tryUnassignSampled();
      else if (r < 0.85) tryReinsertSampled();
      else tryRelocateSampled();
      i++;
    }
  }

  function runTimedChunk(budgetMs: number) {
    const deadline = Date.now() + budgetMs;

    while (Date.now() < deadline) {
      const progress = i / targetSteps;
      temp = Math.max(tempFloor, startTemp * Math.pow(endTemp / startTemp, Math.min(1, progress)));

      const r = random();
      if (r < 0.4) tryAssignSampled();
      else if (r < 0.55) tryUnassignSampled();
      else if (r < 0.85) tryReinsertSampled();
      else tryRelocateSampled();

      i++;
    }
  }

  function getResult() {
    return toAnnealingResult(state, warmup.elapsedMs + (Date.now() - sessionStartedAt));
  }

  return {
    iterateSteps(steps) {
      runIterations(steps);
      return getResult();
    },
    iterateForMs(budgetMs) {
      runTimedChunk(budgetMs);
      return getResult();
    },
    getResult,
    reheat(factor = 1) {
      temp = Math.max(temp, reheatTemp * factor);
      // Pull the search slightly back from the cold end of the schedule.
      i = Math.max(0, i - Math.floor(targetSteps * 0.08 * factor));
      return getResult();
    },
  };
}

function improvedAnnealingCore(mod: Module, options: ImprovedOptions): AnnealingResult {
  const targetSteps = options.steps !== undefined ? options.steps : Math.max(150000, Math.floor(options.budgetMs * 190));
  const session = createImprovedAnnealingSession(mod, targetSteps);
  if (options.steps !== undefined) return session.iterateSteps(options.steps);
  return session.iterateForMs(options.budgetMs);
}

export function improvedAnnealing(mod: Module, steps = 150000): AnnealingResult {
  return improvedAnnealingCore(mod, { steps });
}

export function improvedAnnealingTimed(mod: Module, budgetMs = 10000): AnnealingResult {
  return improvedAnnealingCore(mod, { budgetMs });
}
