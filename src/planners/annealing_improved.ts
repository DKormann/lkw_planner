import { randInt, random } from "../random";
import type { Module } from "../types";
import type { AnnealingResult } from "./annealing_baseline";
import { baselineAnnealing } from "./annealing_baseline";

function isLoad(x: number) {
  return x & 1;
}

function getDeck(x: number) {
  return ((x & 2) >> 1) as 0 | 1;
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
const INF = 1 << 30;

type PairInfo = {
  req: number;
  first: number;
  second: number;
  deck: 0 | 1;
};

export function improvedAnnealing(mod: Module, steps = 150000): AnnealingResult {
  const { NREQS, requests, startpositions, NTRANS, roadmap } = mod;
  const TSIZE = Math.floor(NREQS * 2.5 + 10);

  const reqPickupLocations = new Uint16Array(requests.map((r) => r.startPoint));
  const reqDeliveryLocations = new Uint16Array(requests.map((r) => r.endPoint));
  const reqDeadlines = new Uint32Array(requests.map((r) => r.deadline_h * AVG_SPEED_KMH));
  const reqValues = new Uint32Array(requests.map((r) => r.value_eur / KM_COST));

  const warmupSteps = Math.min(Math.max(20000, Math.floor(steps * 0.2)), 50000);
  const warmup = baselineAnnealing(mod, warmupSteps);

  const unassigned = new Int8Array(warmup.unassigned);
  const tranStart = new Uint16Array(startpositions);
  const schedule = new Uint32Array(warmup.schedule);
  const scheduleSizes = new Uint16Array(warmup.scheduleSizes);
  const scheduleRatings = new Int32Array(warmup.scheduleRatings);

  function routeOffset(tran: number) {
    return tran * TSIZE;
  }

  function setReq(tran: number, idx: number, isLoadBit: 1 | 0, deck: 0 | 1, req: number, pos: number) {
    schedule[routeOffset(tran) + idx] = (isLoadBit << 0) | (deck << 1) | (req << 2) | (pos << 16);
  }

  function score(tran: number) {
    let reward = 0;
    let duration = 0;
    const decks: [number[], number[]] = [[], []];
    let pos = tranStart[tran]!;
    const offset = routeOffset(tran);

    for (let i = 0; i < scheduleSizes[tran]!; i++) {
      const step = schedule[offset + i]!;
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

  function insertStops(tran: number, start: number, end: number, deck: 0 | 1, req: number) {
    const offset = routeOffset(tran);
    const size = scheduleSizes[tran]!;
    scheduleSizes[tran] = size + 2;
    schedule.copyWithin(offset + end + 2, offset + end, offset + size);
    schedule.copyWithin(offset + start + 1, offset + start, offset + end + 1);
    setReq(tran, start, 1, deck, req, reqPickupLocations[req]!);
    setReq(tran, end + 1, 0, deck, req, reqDeliveryLocations[req]!);
  }

  function removeStops(tran: number, start: number, end: number) {
    const offset = routeOffset(tran);
    const size = scheduleSizes[tran]!;
    scheduleSizes[tran] = size - 2;
    schedule.copyWithin(offset + start, offset + start + 1, offset + end);
    schedule.copyWithin(offset + end - 1, offset + end + 1, offset + size);
  }

  function findPairInRoute(tran: number, req: number): PairInfo | null {
    const offset = routeOffset(tran);
    const size = scheduleSizes[tran]!;
    let first = -1;
    let second = -1;
    let deck: 0 | 1 = 0;

    for (let i = 0; i < size; i++) {
      const step = schedule[offset + i]!;
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

  function sampleUnassignedReq(maxAttempts = 24): number | null {
    for (let i = 0; i < maxAttempts; i++) {
      const req = randInt(0, NREQS);
      if (unassigned[req]) return req;
    }

    for (let req = 0; req < NREQS; req++) {
      if (unassigned[req]) return req;
    }

    return null;
  }

  function sampleAssignedPair(maxAttempts = 24): { tran: number; pair: PairInfo } | null {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const tran = randInt(0, NTRANS);
      const size = scheduleSizes[tran]!;
      if (size < 2) continue;
      const idx = randInt(0, size);
      const req = getReq(schedule[routeOffset(tran) + idx]!);
      const pair = findPairInRoute(tran, req);
      if (pair) return { tran, pair };
    }

    for (let tran = 0; tran < NTRANS; tran++) {
      const size = scheduleSizes[tran]!;
      if (size < 2) continue;
      const req = getReq(schedule[routeOffset(tran)]!);
      const pair = findPairInRoute(tran, req);
      if (pair) return { tran, pair };
    }

    return null;
  }

  for (let tran = 0; tran < NTRANS; tran++) {
    scheduleRatings[tran] = score(tran);
  }

  let startTemp = 120;
  let endTemp = 0.5;
  let temp = startTemp;

  function accept(prevScore: number, nextScore: number) {
    if (nextScore >= prevScore) return true;
    const delta = prevScore - nextScore;
    return random() < Math.exp(-delta / Math.max(temp, 0.001));
  }

  function tryAssignSampled(samples = 8) {
    let best: null | { tran: number; req: number; a: number; b: number; deck: 0 | 1; score: number } = null;

    for (let sample = 0; sample < samples; sample++) {
      const req = sampleUnassignedReq();
      if (req == null) break;

      const tran = randInt(0, NTRANS);
      const size = scheduleSizes[tran]!;
      const a = randInt(0, size + 1);
      const b = Math.min(size, a + randInt(0, Math.min(6, size - a + 1)));
      const deck = (random() > 0.5 ? 1 : 0) as 0 | 1;

      insertStops(tran, a, b, deck, req);
      const newScore = score(tran);
      removeStops(tran, a, b + 1);

      if (!best || newScore > best.score) {
        best = { tran, req, a, b, deck, score: newScore };
      }
    }

    if (!best) return;

    insertStops(best.tran, best.a, best.b, best.deck, best.req);
    if (accept(scheduleRatings[best.tran]!, best.score)) {
      scheduleRatings[best.tran] = best.score;
      unassigned[best.req] = 0;
    } else {
      removeStops(best.tran, best.a, best.b + 1);
    }
  }

  function tryUnassignSampled(samples = 6) {
    let best: null | { tran: number; pair: PairInfo; score: number } = null;

    for (let sample = 0; sample < samples; sample++) {
      const chosen = sampleAssignedPair();
      if (!chosen) break;
      const { tran, pair } = chosen;
      removeStops(tran, pair.first, pair.second);
      const newScore = score(tran);
      insertStops(tran, pair.first, pair.second - 1, pair.deck, pair.req);

      if (!best || newScore > best.score) {
        best = { tran, pair, score: newScore };
      }
    }

    if (!best) return;

    removeStops(best.tran, best.pair.first, best.pair.second);
    if (accept(scheduleRatings[best.tran]!, best.score)) {
      scheduleRatings[best.tran] = best.score;
      unassigned[best.pair.req] = 1;
    } else {
      insertStops(best.tran, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
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
      const chosen = sampleAssignedPair();
      if (!chosen) break;

      const { tran: src, pair } = chosen;
      const dst = randInt(0, NTRANS);
      const oldScore = src === dst
        ? scheduleRatings[src]!
        : scheduleRatings[src]! + scheduleRatings[dst]!;

      removeStops(src, pair.first, pair.second);

      const dstSize = scheduleSizes[dst]!;
      const a = randInt(0, dstSize + 1);
      const b = Math.min(dstSize, a + randInt(0, Math.min(6, dstSize - a + 1)));
      insertStops(dst, a, b, pair.deck, pair.req);

      const candidateScore = src === dst
        ? score(src)
        : score(src) + score(dst);

      removeStops(dst, a, b + 1);
      insertStops(src, pair.first, pair.second - 1, pair.deck, pair.req);

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

    removeStops(best.src, best.pair.first, best.pair.second);
    insertStops(best.dst, best.insertA, best.insertB, best.pair.deck, best.pair.req);

    if (accept(best.oldScore, best.score)) {
      if (best.src === best.dst) {
        scheduleRatings[best.src] = score(best.src);
      } else {
        scheduleRatings[best.src] = score(best.src);
        scheduleRatings[best.dst] = score(best.dst);
      }
    } else {
      removeStops(best.dst, best.insertA, best.insertB + 1);
      insertStops(best.src, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
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
      const chosen = sampleAssignedPair();
      if (!chosen) break;

      const { tran, pair } = chosen;
      removeStops(tran, pair.first, pair.second);

      const size = scheduleSizes[tran]!;
      const a = randInt(0, size + 1);
      const b = Math.min(size, a + randInt(0, Math.min(6, size - a + 1)));
      insertStops(tran, a, b, pair.deck, pair.req);

      const candidateScore = score(tran);

      removeStops(tran, a, b + 1);
      insertStops(tran, pair.first, pair.second - 1, pair.deck, pair.req);

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

    removeStops(best.tran, best.pair.first, best.pair.second);
    insertStops(best.tran, best.insertA, best.insertB, best.pair.deck, best.pair.req);

    if (accept(scheduleRatings[best.tran]!, best.score)) {
      scheduleRatings[best.tran] = best.score;
    } else {
      removeStops(best.tran, best.insertA, best.insertB + 1);
      insertStops(best.tran, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }

  const startedAt = Date.now();

  for (let i = 0; i < steps; i++) {
    const progress = i / steps;
    temp = startTemp * Math.pow(endTemp / startTemp, progress);

    const r = random();
    if (r < 0.4) tryAssignSampled();
    else if (r < 0.55) tryUnassignSampled();
    else if (r < 0.85) tryReinsertSampled();
    else tryRelocateSampled();
  }

  const elapsedMs = warmup.elapsedMs + (Date.now() - startedAt);
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
