import { randInt, random } from "../random";
import type { Module } from "../types";

function isLoad(x: number) {
  return x & 1;
}

function getDeck(x: number) {
  return (x & 2) >> 1;
}

function getReq(x: number) {
  return (x & 0xffff) >> 2;
}

function getPos(x: number) {
  return x >> 16;
}

const KM_COST = 0.5;
const AVG_SPEED_KMH = 60;
const REORG_COST_EUR = 100;

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

export function baselineAnnealing(mod: Module, steps = 400000): AnnealingResult {
  const { NREQS, requests, startpositions, NTRANS, roadmap } = mod;
  const TSIZE = Math.floor(NREQS * 2.5 + 10);

  const reqPickupLocations = new Uint16Array(requests.map((r) => r.startPoint));
  const reqDeliveryLocations = new Uint16Array(requests.map((r) => r.endPoint));
  const reqDeadlines = new Uint32Array(requests.map((r) => r.deadline_h * AVG_SPEED_KMH));
  const reqValues = new Uint32Array(requests.map((r) => r.value_eur / KM_COST));
  const unassigned = new Int8Array(requests.map(() => 1));

  const tranStart = new Uint16Array(startpositions);
  const schedule = new Uint32Array(TSIZE * NTRANS);
  const scheduleSizes = new Uint16Array(NTRANS);
  const INF = 1 << 30;

  function score(tran: number) {
    let reward = 0;
    let duration = 0;
    const decks: [number[], number[]] = [[], []];
    let pos = tranStart[tran]!;

    for (let i = 0; i < scheduleSizes[tran]!; i++) {
      const step = schedule[tran * TSIZE + i]!;
      const load = isLoad(step);
      const req = getReq(step);
      const nextPos = getPos(step);
      duration += roadmap.getCostN(pos, nextPos);
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
        if (duration <= reqDeadlines[req]!) reward += reqValues[req]!;
      }
    }

    return reward - duration;
  }

  const scheduleRatings = Int32Array.from({ length: NTRANS }, (_, i) => score(i));

  function setReq(tran: number, idx: number, isLoadBit: 1 | 0, deck: 1 | 0, req: number, pos: number) {
    schedule[tran * TSIZE + idx] = (isLoadBit << 0) | (deck << 1) | (req << 2) | (pos << 16);
  }

  function insertStops(tran: number, start: number, end: number, deck: 0 | 1, req: number) {
    const offset = tran * TSIZE;
    const size = scheduleSizes[tran]!;
    scheduleSizes[tran] = size + 2;
    schedule.copyWithin(offset + end + 2, offset + end, offset + size);
    schedule.copyWithin(offset + start + 1, offset + start, offset + end + 1);
    setReq(tran, start, 1, deck, req, reqPickupLocations[req]!);
    setReq(tran, end + 1, 0, deck, req, reqDeliveryLocations[req]!);
  }

  function removeStops(tran: number, start: number, end: number) {
    const offset = tran * TSIZE;
    const size = scheduleSizes[tran]!;
    scheduleSizes[tran] = size - 2;
    schedule.copyWithin(offset + start, offset + start + 1, offset + end);
    schedule.copyWithin(offset + end - 1, offset + end + 1, offset + size);
  }

  let startTemp = 100;
  let temp = startTemp;

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

    insertStops(tran, a, b, random() > 0.5 ? 1 : 0, req);
    const newRating = score(tran);
    if (accept(scheduleRatings[tran]!, newRating)) {
      scheduleRatings[tran] = newRating;
      unassigned[req] = 0;
    } else {
      removeStops(tran, a, b + 1);
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
    removeStops(tran, a, b);
    const newRating = score(tran);
    if (accept(scheduleRatings[tran]!, newRating)) {
      scheduleRatings[tran] = newRating;
      unassigned[req] = 1;
    } else {
      insertStops(tran, a, b - 1, getDeck(item) as 0 | 1, req);
    }
  }

  const startedAt = Date.now();

  for (let i = 0; i < steps; i++) {
    temp = (1 - i / steps) * startTemp;
    tryUnassign();
    tryAssign();
  }

  const elapsedMs = Date.now() - startedAt;
  const totalScore = scheduleRatings.reduce((sum, value) => sum + value, 0);

  return {
    schedule,
    scheduleSizes,
    tranStart,
    TSIZE,
    scheduleRatings,
    unassigned,
    elapsedMs,
    totalScore,
  };
}
