import { randInt, random } from "../random";
import type { Module } from "../types";
import {
  bootstrapEmptyRoutes,
  getDeck,
  getReq,
  initAnnealingState,
  insertStops,
  removeStops,
  scoreRoute,
  toAnnealingResult,
} from "./annealing_shared";

export type AnnealingResult = {
  schedule: Uint32Array;
  scheduleSizes: Uint16Array;
  tranStart: Uint16Array;
  TSIZE: number;
  scheduleRatings: Int32Array;
  unassigned: Int8Array;
  elapsedMs: number;
  totalScore: number;
};

export function baselineAnnealing(mod: Module, steps = 1_600_000): AnnealingResult {
  const state = initAnnealingState(mod);
  const { NREQS, NTRANS, TSIZE, schedule, scheduleSizes, scheduleRatings, unassigned } = state;

  let startTemp = 5_000;
  let temp = startTemp;

  bootstrapEmptyRoutes(state);

  function accept(prevRating: number, nextRating: number) {
    if (nextRating >= prevRating) return true;
    return random() < Math.exp((nextRating - prevRating) / Math.max(temp, 0.001));
  }

  function tryAssign() {
    const tran = randInt(0, NTRANS);
    const schedSize = scheduleSizes[tran]!;
    const a = randInt(0, schedSize + 1);
    const b = Math.min(schedSize, randInt(0, 4) + a);
    const req = randInt(0, NREQS);
    if (!unassigned[req]) return;

    insertStops(state, tran, a, b, random() > 0.5 ? 1 : 0, req);
    const newRating = scoreRoute(state, tran);
    if (accept(scheduleRatings[tran]!, newRating)) {
      scheduleRatings[tran] = newRating;
      unassigned[req] = 0;
    } else {
      removeStops(state, tran, a, b + 1);
    }
  }

  function tryUnassign() {
    const tran = randInt(0, NTRANS);
    const schedSize = scheduleSizes[tran]!;
    if (schedSize < 2) return;
    const idx = randInt(0, schedSize);
    const item = schedule[tran * TSIZE + idx]!;
    const req = getReq(item);

    const ab: number[] = [];
    for (let i = 0; i < schedSize; i++) {
      if (getReq(schedule[tran * TSIZE + i]!) === req) ab.push(i);
    }
    if (ab.length !== 2) return;

    const [a, b] = ab as [number, number];
    removeStops(state, tran, a, b);
    const newRating = scoreRoute(state, tran);
    if (accept(scheduleRatings[tran]!, newRating)) {
      scheduleRatings[tran] = newRating;
      unassigned[req] = 1;
    } else {
      insertStops(state, tran, a, b - 1, getDeck(item) as 0 | 1, req);
    }
  }

  const startedAt = Date.now();

  for (let i = 0; i < steps; i++) {
    temp = (1 - i / steps) * startTemp;
    tryUnassign();
    tryAssign();
  }

  return toAnnealingResult(state, Date.now() - startedAt);
}
