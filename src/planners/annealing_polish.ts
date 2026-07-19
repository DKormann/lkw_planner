import type { Module } from "../types";
import { improvedAnnealing } from "./annealing_improved";
import {
  findPairInRoute,
  initAnnealingState,
  insertStops,
  removeStops,
  scoreRoute,
  toAnnealingResult,
} from "./annealing_shared";

export function polishedAnnealing(mod: Module, steps = 150000) {
  const coreSteps = Math.max(80000, Math.floor(steps * 0.75));
  const base = improvedAnnealing(mod, coreSteps);
  const state = initAnnealingState(mod, base);
  const startedAt = Date.now();

  function polishRoute(tran: number) {
    let improved = false;
    const size = state.scheduleSizes[tran]!;
    const originalScore = state.scheduleRatings[tran]!;

    for (let idx = 0; idx < size; idx++) {
      const req = ((state.schedule[tran * state.TSIZE + idx]! & 0xffff) >> 2);
      const pair = findPairInRoute(state, tran, req);
      if (!pair) continue;

      removeStops(state, tran, pair.first, pair.second);
      const reducedSize = state.scheduleSizes[tran]!;
      let bestScore = -Infinity;
      let bestA = pair.first;
      let bestB = pair.second - 1;

      const windowStart = Math.max(0, pair.first - 4);
      const windowEnd = Math.min(reducedSize, pair.first + 4);

      for (let a = windowStart; a <= windowEnd; a++) {
        const maxGap = Math.min(6, reducedSize - a + 1);
        for (let delta = 0; delta < maxGap; delta++) {
          const b = Math.min(reducedSize, a + delta);
          insertStops(state, tran, a, b, pair.deck, pair.req);
          const score = scoreRoute(state, tran);
          removeStops(state, tran, a, b + 1);
          if (score > bestScore) {
            bestScore = score;
            bestA = a;
            bestB = b;
          }
        }
      }

      insertStops(state, tran, bestA, bestB, pair.deck, pair.req);
      state.scheduleRatings[tran] = scoreRoute(state, tran);
      if (state.scheduleRatings[tran]! > originalScore) improved = true;
    }

    return improved;
  }

  for (let round = 0; round < 2; round++) {
    let any = false;
    for (let tran = 0; tran < state.NTRANS; tran++) {
      if (polishRoute(tran)) any = true;
    }
    if (!any) break;
  }

  return toAnnealingResult(state, base.elapsedMs + (Date.now() - startedAt));
}
