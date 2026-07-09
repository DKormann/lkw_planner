import { type Request, type Schedule, type ScheduleItem, type ScheduleStep, type UUID } from "./types";
import { RSIZE, type RoadMap } from "./randomMap";

const DECKCAPACITY = 3;
const UNLOADCOST = 10
const PICKUPCOST = 5
const COST_PER_H = 20;
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
let costMatrixReady = false;

export function configurePlanner(context: PlannerContext) {
  plannerContext = context;
  CostMatrix.fill(0);
  costMatrixReady = false;
  buildCostMatrix();
}

function getPlannerContext(): PlannerContext {
  if (!plannerContext) {
    throw new Error("Planner context is not configured");
  }
  return plannerContext;
}

export const CostMatrix = new Uint32Array(RSIZE);

export function buildCostMatrix(): void {
  const { roadMap } = getPlannerContext();
  const pointCount = roadMap.points.length;
  const INF = 0xffff;

  CostMatrix.fill(INF);

  for (let start = 0; start < pointCount; start++) {
    const dist = new Uint32Array(pointCount);
    const visited = new Uint8Array(pointCount);
    dist.fill(INF);
    dist[start] = 0;

    for (let step = 0; step < pointCount; step++) {
      let current = -1;
      let best = INF;

      for (let node = 0; node < pointCount; node++) {
        if (visited[node] === 0 && dist[node]! < best) {
          best = dist[node]!;
          current = node;
        }
      }

      if (current === -1) break;
      visited[current] = 1;

      for (let next = 0; next < pointCount; next++) {
        if (next === current) continue;
        const road = roadMap.getroad(current, next);
        if (road === 0) continue;
        const nextCost = dist[current]! + road;
        if (nextCost < dist[next]!) {
          dist[next] = nextCost;
        }
      }
    }

    for (let end = 0; end < pointCount; end++) {
      if (end === start) continue;
      const idx = roadMap.roadIDX(start, end);
      CostMatrix[idx] = Math.min(dist[end]!, INF);
    }
  }

  costMatrixReady = true;
}

function ensureCostMatrix(): void {
  if (!costMatrixReady) {
    buildCostMatrix();
  }
}

export function findPath(start: number, end: number):number[] {
  const { roadMap } = getPlannerContext();
  ensureCostMatrix();
  let path : number[] = [start]
  let cost = CostMatrix[roadMap.roadIDX(start,end)]
  while (start != end){
    for (let x = 0; x < roadMap.points.length; x++){
      if (x == start) continue
      let road = roadMap.getroad(start,x)
      if (road == 0) continue
      let restcost = CostMatrix[roadMap.roadIDX(x,end)]!
      if (road+ restcost == cost){
        cost = restcost
        start = x
        path.push(x)
        break
      }
    }
  }
  return path
}

export function getCostN(...points: number[]): number {
  const { roadMap } = getPlannerContext();
  ensureCostMatrix();
  let cost = 0;
  for (let i = 0; i < points.length - 1; i++) {
    cost += CostMatrix[roadMap.roadIDX(points[i]!, points[i + 1]!)]!;
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

  let reward_eur = 0
  let duration_sec = 0
  let decks: [UUID[], UUID[]] = [[], []];

  function unload(reqId: UUID, deck: 0 | 1): boolean {
    const idx = decks[deck].indexOf(reqId);
    if (idx === -1) {
      return false;
    }
    const after = decks[deck].slice(idx + 1);
    decks[deck] = decks[deck].slice(0, idx).concat(after);
    reward_eur -= UNLOADCOST + (UNLOADCOST + PICKUPCOST) * after.length;

    return true;
  }

  for (let i = 1; i < item.steps.length; i++) {
    const prev = item.steps[i - 1]!;
    const step = item.steps[i]!;

    duration_sec+=  getCostN(prev.val.pos, step.val.pos);

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
      if (duration_sec <= req.deadline_km) {
        reward_eur+ req.value_eur;
      }
      continue;
    }

    return -Infinity;
  }

  return reward_eur - duration_sec * COST_PER_SECOND;
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
    const directTravel = getCostN(request.startPoint, request.endPoint) * COST_PER_SECOND;
    return request.value_eur - directTravel - PICKUPCOST - UNLOADCOST;
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

function improveByRenumber(schedule: Schedule, requestsById: Map<UUID, Request>): Schedule {
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

  current = improveByRenumber(current, requestsById);
  current = improveByRenumber(current, requestsById);

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
