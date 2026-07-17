import { baselineAnnealing } from "./annealing_baseline";
import {
  acceptAnneal,
  initAnnealingState,
  insertStops,
  refreshAllRatings,
  removeStops,
  sampleAssignedPair,
  scoreRoute,
  toAnnealingResult,
} from "./annealing_shared";
import type { Module } from "../types";

export function localAnnealing(mod: Module, steps = 150000) {
  const warmupSteps = Math.min(Math.max(25000, Math.floor(steps * 0.25)), 40000);
  const warmup = baselineAnnealing(mod, warmupSteps);
  const state = initAnnealingState(mod, warmup);
  const startedAt = Date.now();

  let temp0 = 3_000;
  let temp1 = 10;
  let temp = temp0;

  function tryReinsertTight(samples = 12) {
    let best: null | {
      tran: number;
      first: number;
      second: number;
      deck: 0 | 1;
      req: number;
      a: number;
      b: number;
      score: number;
    } = null;

    for (let i = 0; i < samples; i++) {
      const chosen = sampleAssignedPair(state, 8);
      if (!chosen) break;
      const { tran, pair } = chosen;
      const oldScore = state.scheduleRatings[tran]!;
      removeStops(state, tran, pair.first, pair.second);
      const size = state.scheduleSizes[tran]!;
      const windowStart = Math.max(0, pair.first - 3);
      const windowEnd = Math.min(size, pair.first + 3);

      for (let a = windowStart; a <= windowEnd; a++) {
        const b = Math.min(size, a + ((pair.second - pair.first - 1 + i) % Math.min(5, size - a + 1)));
        insertStops(state, tran, a, b, pair.deck, pair.req);
        const score = scoreRoute(state, tran);
        removeStops(state, tran, a, b + 1);
        if (score > oldScore && (!best || score > best.score)) {
          best = { tran, first: pair.first, second: pair.second, deck: pair.deck, req: pair.req, a, b, score };
        }
      }

      insertStops(state, tran, pair.first, pair.second - 1, pair.deck, pair.req);
    }

    if (!best) return;
    removeStops(state, best.tran, best.first, best.second);
    insertStops(state, best.tran, best.a, best.b, best.deck, best.req);
    if (acceptAnneal(state.scheduleRatings[best.tran]!, best.score, temp)) {
      state.scheduleRatings[best.tran] = best.score;
    } else {
      removeStops(state, best.tran, best.a, best.b + 1);
      insertStops(state, best.tran, best.first, best.second - 1, best.deck, best.req);
    }
  }

  function tryRelocateFocused(samples = 6) {
    let best: null | {
      src: number;
      dst: number;
      first: number;
      second: number;
      deck: 0 | 1;
      req: number;
      a: number;
      b: number;
      score: number;
      oldScore: number;
    } = null;

    for (let i = 0; i < samples; i++) {
      const chosen = sampleAssignedPair(state, 8);
      if (!chosen) break;
      const { tran: src, pair } = chosen;
      const dst = (src + 1 + (pair.req % Math.max(1, state.NTRANS - 1))) % state.NTRANS;
      const oldScore = state.scheduleRatings[src]! + state.scheduleRatings[dst]!;
      removeStops(state, src, pair.first, pair.second);
      const dstSize = state.scheduleSizes[dst]!;

      for (let j = 0; j < 3; j++) {
        const a = Math.min(dstSize, (j + pair.req) % (dstSize + 1));
        const b = Math.min(dstSize, a + ((pair.req + j) % Math.min(5, dstSize - a + 1)));
        insertStops(state, dst, a, b, pair.deck, pair.req);
        const score = scoreRoute(state, src) + scoreRoute(state, dst);
        removeStops(state, dst, a, b + 1);
        if (!best || score > best.score) {
          best = { src, dst, first: pair.first, second: pair.second, deck: pair.deck, req: pair.req, a, b, score, oldScore };
        }
      }

      insertStops(state, src, pair.first, pair.second - 1, pair.deck, pair.req);
    }

    if (!best) return;
    removeStops(state, best.src, best.first, best.second);
    insertStops(state, best.dst, best.a, best.b, best.deck, best.req);
    if (acceptAnneal(best.oldScore, best.score, temp)) {
      state.scheduleRatings[best.src] = scoreRoute(state, best.src);
      state.scheduleRatings[best.dst] = scoreRoute(state, best.dst);
    } else {
      removeStops(state, best.dst, best.a, best.b + 1);
      insertStops(state, best.src, best.first, best.second - 1, best.deck, best.req);
    }
  }

  refreshAllRatings(state);

  for (let i = 0; i < steps; i++) {
    temp = temp0 * Math.pow(temp1 / temp0, i / steps);
    if ((i & 3) === 0) tryRelocateFocused();
    else tryReinsertTight();
  }

  return toAnnealingResult(state, warmup.elapsedMs + (Date.now() - startedAt));
}
