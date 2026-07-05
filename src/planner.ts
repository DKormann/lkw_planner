import { Time, add, iadd, isub, mul, uconst, type Location, type Request, type Schedule, type ScheduleItem, type ScheduleStep, type UUID } from "./types";
import type { RoadMap } from "./randomMap";

const DECKCAPACITY = 3;
const UNLOADCOST = uconst(10, "eur");
const PICKUPCOST = uconst(5, "eur");
const COST_PER_H = 5;
const COST_PER_SECOND = COST_PER_H / 3600;

type PlannerContext = {
  requests: Request[];
  roadMap: RoadMap;
};

type InsertionCandidate = {
  itemIndex: number;
  pickIndex: number;
  dropIndex: number;
  deck: 0 | 1;
  scoreDelta: number;
};

let plannerContext: PlannerContext | null = null;

export function configurePlanner(context: PlannerContext) {
  plannerContext = context;
  CostMatrix.clear();
}

function getPlannerContext(): PlannerContext {
  if (!plannerContext) {
    throw new Error("Planner context is not configured");
  }
  return plannerContext;
}

export function pairId(a: string, b: string): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

const CostMatrix = new Map<string, Time>();

export function findPath(start: Location, end: Location): { path: Location[]; dist: Time } {
  const { roadMap } = getPlannerContext();
  const id = pairId(start, end);

  if (start === end) {
    const dist = uconst(0, "seconds");
    CostMatrix.set(id, dist);
    return { path: [start], dist };
  }

  const dist = new Map<Location, Time>();
  const prev = new Map<Location, Location | null>();
  const unvisited = new Set<Location>(roadMap.points);

  for (const point of roadMap.points) {
    dist.set(point, uconst(Infinity, "seconds"));
    prev.set(point, null);
  }

  dist.set(start, uconst(0, "seconds"));

  while (unvisited.size > 0) {
    let current: Location | null = null;
    let currentDist = Infinity;

    for (const point of unvisited) {
      const pointDist = dist.get(point)!.value;
      if (pointDist < currentDist) {
        current = point;
        currentDist = pointDist;
      }
    }

    if (current == null || currentDist === Infinity) {
      break;
    }

    unvisited.delete(current);

    if (current === end) {
      break;
    }

    for (const [next, segment] of roadMap.roads.get(current) ?? []) {
      if (!unvisited.has(next)) {
        continue;
      }
      const candidate = add(dist.get(current)!, segment);
      if (candidate.value < dist.get(next)!.value) {
        dist.set(next, candidate);
        prev.set(next, current);
      }
    }
  }

  const totalDist = dist.get(end);
  if (!totalDist || totalDist.value === Infinity) {
    throw new Error(`No path found from ${start} to ${end}`);
  }

  const path: Location[] = [];
  let cursor: Location | null = end;
  while (cursor != null) {
    path.push(cursor);
    cursor = prev.get(cursor) ?? null;
  }
  path.reverse();

  CostMatrix.set(id, totalDist);
  return { path, dist: totalDist };
}

export function getCost(start: Location, end: Location): Time {
  const id = pairId(start, end);
  if (!CostMatrix.has(id)) {
    findPath(start, end);
  }
  return CostMatrix.get(id)!;
}

export function getCostN(...points: Location[]): Time {
  const cost = uconst(0, "seconds");
  for (let i = 0; i < points.length - 1; i++) {
    iadd(cost, getCost(points[i]!, points[i + 1]!));
  }
  return cost;
}

export let optDur = 0;

function requestMap(requests: Request[]): Map<UUID, Request> {
  return new Map(requests.map((request) => [request.id, request]));
}

function routeScore(item: ScheduleItem, requestsById: Map<UUID, Request>): number {
  if (item.steps[0]?.$ !== "start") {
    return -Infinity;
  }

  const reward = uconst(0, "eur");
  const duration = uconst(0, "seconds");
  const decks: [UUID[], UUID[]] = [[], []];

  function unload(reqId: UUID, deck: 0 | 1): boolean {
    const idx = decks[deck].indexOf(reqId);
    if (idx === -1) {
      return false;
    }
    const after = decks[deck].slice(idx + 1);
    decks[deck] = decks[deck].slice(0, idx).concat(after);
    isub(reward, UNLOADCOST);
    isub(reward, mul(add(UNLOADCOST, PICKUPCOST), after.length));
    return true;
  }

  for (let i = 1; i < item.steps.length; i++) {
    const prev = item.steps[i - 1]!;
    const step = item.steps[i]!;

    iadd(duration, getCost(prev.val.pos, step.val.pos));

    if (step.$ === "pickup") {
      decks[step.val.deck].push(step.val.request);
      if (decks[step.val.deck].length > DECKCAPACITY) {
        return -Infinity;
      }
      continue;
    }

    if (step.$ === "deliver") {
      const req = requestsById.get(step.val.request);
      if (!req) {
        throw new Error(`not found request: ${step.val.request}`);
      }
      if (!unload(step.val.request, 0) && !unload(step.val.request, 1)) {
        return -Infinity;
      }
      if (duration.value <= req.deadline.value) {
        iadd(reward, req.value);
      }
      continue;
    }

    return -Infinity;
  }

  return reward.value - duration.value * COST_PER_SECOND;
}

function safeRouteScore(item: ScheduleItem, requestsById: Map<UUID, Request>): number {
  try {
    return routeScore(item, requestsById);
  } catch {
    return -Infinity;
  }
}

function insertRequestIntoItem(
  item: ScheduleItem,
  request: Request,
  pickIndex: number,
  dropIndex: number,
  deck: 0 | 1,
): ScheduleItem {
  const pickup: ScheduleStep = {
    $: "pickup",
    val: { request: request.id, pos: request.startPoint, deck },
  };
  const deliver: ScheduleStep = {
    $: "deliver",
    val: { request: request.id, pos: request.endPoint },
  };

  const steps = [...item.steps];
  steps.splice(pickIndex, 0, pickup);
  steps.splice(dropIndex, 0, deliver);
  return { ...item, steps };
}

function removeRequestFromSchedule(schedule: Schedule, requestId: UUID): Schedule {
  return schedule.map((item) => ({
    ...item,
    steps: item.steps.filter((step) => step.$ === "start" || step.val.request !== requestId),
  }));
}

function assignedRequestIds(schedule: Schedule): Set<UUID> {
  const ids = new Set<UUID>();
  for (const item of schedule) {
    for (const step of item.steps) {
      if (step.$ === "pickup") {
        ids.add(step.val.request);
      }
    }
  }
  return ids;
}

function requestPriority(request: Request): number {
  try {
    const directTravel = getCost(request.startPoint, request.endPoint).value * COST_PER_SECOND;
    return request.value.value - directTravel - PICKUPCOST.value - UNLOADCOST.value;
  } catch {
    return -Infinity;
  }
}

function bestInsertion(schedule: Schedule, request: Request, requestsById: Map<UUID, Request>): InsertionCandidate | null {
  let best: InsertionCandidate | null = null;

  for (let itemIndex = 0; itemIndex < schedule.length; itemIndex++) {
    const item = schedule[itemIndex]!;
    const currentScore = safeRouteScore(item, requestsById);

    for (const deck of [0, 1] as const) {
      for (let pickIndex = 1; pickIndex <= item.steps.length; pickIndex++) {
        for (let dropIndex = pickIndex + 1; dropIndex <= item.steps.length + 1; dropIndex++) {
          const candidate = insertRequestIntoItem(item, request, pickIndex, dropIndex, deck);
          const candidateScore = safeRouteScore(candidate, requestsById);
          if (!Number.isFinite(candidateScore)) {
            continue;
          }

          const scoreDelta = candidateScore - currentScore;
          if (
            !best ||
            scoreDelta > best.scoreDelta ||
            (scoreDelta === best.scoreDelta && itemIndex < best.itemIndex)
          ) {
            best = { itemIndex, pickIndex, dropIndex, deck, scoreDelta };
          }
        }
      }
    }
  }

  return best;
}

function applyInsertion(schedule: Schedule, request: Request, candidate: InsertionCandidate): Schedule {
  return schedule.map((item, itemIndex) =>
    itemIndex === candidate.itemIndex
      ? insertRequestIntoItem(item, request, candidate.pickIndex, candidate.dropIndex, candidate.deck)
      : item,
  );
}

function improveByRelocation(schedule: Schedule, requestsById: Map<UUID, Request>): Schedule {
  let current = schedule;
  let currentScore = rateSchedule(current);
  const assigned = Array.from(assignedRequestIds(current));

  for (const requestId of assigned) {
    const request = requestsById.get(requestId);
    if (!request) {
      continue;
    }

    const reduced = removeRequestFromSchedule(current, requestId);
    const candidate = bestInsertion(reduced, request, requestsById);
    if (!candidate || candidate.scoreDelta <= 0) {
      continue;
    }

    const next = applyInsertion(reduced, request, candidate);
    const nextScore = rateSchedule(next);
    if (nextScore > currentScore) {
      current = next;
      currentScore = nextScore;
    }
  }

  return current;
}

export function optimizeSchedule(requests: Request[], schedule: Schedule): Schedule {
  const startedAt = Date.now();
  const requestsById = requestMap(requests);
  const assigned = assignedRequestIds(schedule);

  let current = schedule.map((item) => ({ ...item, steps: [...item.steps] }));

  const freeRequests = requests
    .filter((request) => !assigned.has(request.id))
    .sort((a, b) => requestPriority(b) - requestPriority(a));

  for (const request of freeRequests) {
    const candidate = bestInsertion(current, request, requestsById);
    if (candidate && candidate.scoreDelta > 0) {
      current = applyInsertion(current, request, candidate);
    }
  }

  current = improveByRelocation(current, requestsById);
  current = improveByRelocation(current, requestsById);

  optDur = Date.now() - startedAt;
  return current;
}

export function rateSchedule(schedule: Schedule): number {
  const { requests } = getPlannerContext();
  const requestsById = requestMap(requests);

  let total = 0;
  for (const item of schedule) {
    const itemScore = safeRouteScore(item, requestsById);
    if (!Number.isFinite(itemScore)) {
      return -Infinity;
    }
    total += itemScore;
  }
  return total;
}
