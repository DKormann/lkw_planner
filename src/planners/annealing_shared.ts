import { randInt, random } from "../random";
import type { Module } from "../types";
import type { AnnealingResult } from "./annealing_baseline";

const KM_COST = 0.5;
const AVG_SPEED_KMH = 60;
const REORG_COST_EUR = 100;
const INF = 1 << 30;

export type PairInfo = {
  req: number;
  first: number;
  second: number;
  deck: 0 | 1;
};

export type AnnealingState = {
  mod: Module;
  NREQS: number;
  NTRANS: number;
  TSIZE: number;
  reqPickupLocations: Uint16Array;
  reqDeliveryLocations: Uint16Array;
  reqDeadlines: Uint32Array;
  reqValues: Uint32Array;
  unassigned: Int8Array;
  tranStart: Uint16Array;
  schedule: Uint32Array;
  scheduleSizes: Uint16Array;
  scheduleRatings: Int32Array;
};

export function isLoad(x: number) {
  return x & 1;
}

export function getDeck(x: number) {
  return ((x & 2) >> 1) as 0 | 1;
}

export function getReq(x: number) {
  return (x & 0xffff) >> 2;
}

export function getPos(x: number) {
  return x >> 16;
}

export function initAnnealingState(mod: Module, seed?: AnnealingResult): AnnealingState {
  const { NREQS, requests, startpositions, NTRANS } = mod;
  const TSIZE = Math.floor(NREQS * 2.5 + 10);

  return {
    mod,
    NREQS,
    NTRANS,
    TSIZE,
    reqPickupLocations: new Uint16Array(requests.map((r) => r.startPoint)),
    reqDeliveryLocations: new Uint16Array(requests.map((r) => r.endPoint)),
    reqDeadlines: new Uint32Array(requests.map((r) => r.deadline_h * AVG_SPEED_KMH)),
    reqValues: new Uint32Array(requests.map((r) => r.value_eur / KM_COST)),
    unassigned: seed ? new Int8Array(seed.unassigned) : new Int8Array(requests.map(() => 1)),
    tranStart: new Uint16Array(startpositions),
    schedule: seed ? new Uint32Array(seed.schedule) : new Uint32Array(TSIZE * NTRANS),
    scheduleSizes: seed ? new Uint16Array(seed.scheduleSizes) : new Uint16Array(NTRANS),
    scheduleRatings: seed ? new Int32Array(seed.scheduleRatings) : new Int32Array(NTRANS),
  };
}

export function routeOffset(state: AnnealingState, tran: number) {
  return tran * state.TSIZE;
}

export function setReq(state: AnnealingState, tran: number, idx: number, isLoadBit: 1 | 0, deck: 0 | 1, req: number, pos: number) {
  state.schedule[routeOffset(state, tran) + idx] = (isLoadBit << 0) | (deck << 1) | (req << 2) | (pos << 16);
}

export function scoreRoute(state: AnnealingState, tran: number) {
  let reward = 0;
  let duration = 0;
  const decks: [number[], number[]] = [[], []];
  let pos = state.tranStart[tran]!;
  const offset = routeOffset(state, tran);

  for (let i = 0; i < state.scheduleSizes[tran]!; i++) {
    const step = state.schedule[offset + i]!;
    const load = isLoad(step);
    const req = getReq(step);
    const nextPos = getPos(step);
    duration += state.mod.roadmap.getCostN(pos, nextPos);
    pos = nextPos;

    if (load) {
      const deck = decks[getDeck(step)]!;
      deck.push(req);
      if (deck.length > 3) return -INF;
    } else {
      const deck = decks[getDeck(step)]!;
      const idx = deck.indexOf(req);
      if (idx === -1) return -INF;
      duration += (deck.length - idx - 1) * REORG_COST_EUR / KM_COST;
      deck.splice(idx, 1);
      if (duration <= state.reqDeadlines[req]!) reward += state.reqValues[req]!;
    }
  }

  return reward - duration;
}

export function refreshAllRatings(state: AnnealingState) {
  for (let tran = 0; tran < state.NTRANS; tran++) {
    state.scheduleRatings[tran] = scoreRoute(state, tran);
  }
}

export function insertStops(state: AnnealingState, tran: number, start: number, end: number, deck: 0 | 1, req: number) {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran]!;
  state.scheduleSizes[tran] = size + 2;
  state.schedule.copyWithin(offset + end + 2, offset + end, offset + size);
  state.schedule.copyWithin(offset + start + 1, offset + start, offset + end + 1);
  setReq(state, tran, start, 1, deck, req, state.reqPickupLocations[req]!);
  setReq(state, tran, end + 1, 0, deck, req, state.reqDeliveryLocations[req]!);
}

export function removeStops(state: AnnealingState, tran: number, start: number, end: number) {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran]!;
  state.scheduleSizes[tran] = size - 2;
  state.schedule.copyWithin(offset + start, offset + start + 1, offset + end);
  state.schedule.copyWithin(offset + end - 1, offset + end + 1, offset + size);
}

export function findPairInRoute(state: AnnealingState, tran: number, req: number): PairInfo | null {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran]!;
  let first = -1;
  let second = -1;
  let deck: 0 | 1 = 0;

  for (let i = 0; i < size; i++) {
    const step = state.schedule[offset + i]!;
    if (getReq(step) !== req) continue;
    if (first === -1) {
      first = i;
      deck = getDeck(step);
    } else {
      second = i;
      break;
    }
  }

  if (first === -1 || second === -1) return null;
  return { req, first, second, deck };
}

export function sampleUnassignedReq(state: AnnealingState, maxAttempts = 24): number | null {
  for (let i = 0; i < maxAttempts; i++) {
    const req = randInt(0, state.NREQS);
    if (state.unassigned[req]) return req;
  }

  for (let req = 0; req < state.NREQS; req++) {
    if (state.unassigned[req]) return req;
  }

  return null;
}

export function sampleAssignedPair(state: AnnealingState, maxAttempts = 24): { tran: number; pair: PairInfo } | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tran = randInt(0, state.NTRANS);
    const size = state.scheduleSizes[tran]!;
    if (size < 2) continue;
    const idx = randInt(0, size);
    const req = getReq(state.schedule[routeOffset(state, tran) + idx]!);
    const pair = findPairInRoute(state, tran, req);
    if (pair) return { tran, pair };
  }

  for (let tran = 0; tran < state.NTRANS; tran++) {
    const size = state.scheduleSizes[tran]!;
    if (size < 2) continue;
    const req = getReq(state.schedule[routeOffset(state, tran)]!);
    const pair = findPairInRoute(state, tran, req);
    if (pair) return { tran, pair };
  }

  return null;
}

export function acceptAnneal(prevScore: number, nextScore: number, temp: number) {
  if (nextScore >= prevScore) return true;
  const delta = prevScore - nextScore;
  return random() < Math.exp(-delta / Math.max(temp, 0.001));
}

export function toAnnealingResult(state: AnnealingState, elapsedMs: number): AnnealingResult {
  return {
    schedule: state.schedule,
    scheduleSizes: state.scheduleSizes,
    tranStart: state.tranStart,
    TSIZE: state.TSIZE,
    scheduleRatings: state.scheduleRatings,
    unassigned: state.unassigned,
    elapsedMs,
    totalScore: state.scheduleRatings.reduce((sum, value) => sum + value, 0),
  };
}
