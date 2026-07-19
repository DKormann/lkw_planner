import { baselineAnnealing } from "./annealing_baseline";
import {
  acceptAnneal,
  initAnnealingState,
  insertStops,
  refreshAllRatings,
  removeStops,
  sampleAssignedPair,
  sampleUnassignedReq,
  scoreRoute,
  toAnnealingResult,
} from "./annealing_shared";
import type { Module } from "../types";

export function constructiveAnnealing(mod: Module, steps = 150000) {
  const warmupSteps = Math.min(Math.max(10000, Math.floor(steps * 0.15)), 25000);
  const warmup = baselineAnnealing(mod, warmupSteps);
  const state = initAnnealingState(mod, warmup);
  const startedAt = Date.now();

  let temp0 = 4_500;
  let temp1 = 15;
  let temp = temp0;

  function tryGreedyAssign(samples = 12) {
    let best: null | { tran: number; req: number; a: number; b: number; deck: 0 | 1; score: number } = null;

    for (let i = 0; i < samples; i++) {
      const req = sampleUnassignedReq(state, 8);
      if (req == null) break;

      for (let j = 0; j < 3; j++) {
        const tran = (req + i + j) % state.NTRANS;
        const size = state.scheduleSizes[tran]!;
        const a = Math.min(size, (j * 2 + i) % (size + 1));
        const b = Math.min(size, a + ((req + j) % Math.min(6, size - a + 1)));
        const deck = ((req + j) & 1) as 0 | 1;
        insertStops(state, tran, a, b, deck, req);
        const score = scoreRoute(state, tran);
        removeStops(state, tran, a, b + 1);
        if (!best || score > best.score) best = { tran, req, a, b, deck, score };
      }
    }

    if (!best) return;
    insertStops(state, best.tran, best.a, best.b, best.deck, best.req);
    if (acceptAnneal(state.scheduleRatings[best.tran]!, best.score, temp)) {
      state.scheduleRatings[best.tran] = best.score;
      state.unassigned[best.req] = 0;
    } else {
      removeStops(state, best.tran, best.a, best.b + 1);
    }
  }

  function tryLocalReinsert(samples = 10) {
    let best: null | { tran: number; first: number; second: number; deck: 0 | 1; req: number; a: number; b: number; score: number } = null;

    for (let i = 0; i < samples; i++) {
      const chosen = sampleAssignedPair(state, 8);
      if (!chosen) break;
      const { tran, pair } = chosen;
      removeStops(state, tran, pair.first, pair.second);
      const size = state.scheduleSizes[tran]!;

      for (let j = 0; j < 3; j++) {
        const a = Math.min(size, (pair.first + j) % (size + 1));
        const b = Math.min(size, a + ((pair.req + j) % Math.min(6, size - a + 1)));
        insertStops(state, tran, a, b, pair.deck, pair.req);
        const score = scoreRoute(state, tran);
        removeStops(state, tran, a, b + 1);
        if (!best || score > best.score) {
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

  refreshAllRatings(state);

  for (let i = 0; i < steps; i++) {
    temp = temp0 * Math.pow(temp1 / temp0, i / steps);
    if (state.unassigned.some((x) => x !== 0) && i < steps * 0.65) {
      tryGreedyAssign();
    } else {
      tryLocalReinsert();
    }
  }

  return toAnnealingResult(state, warmup.elapsedMs + (Date.now() - startedAt));
}
