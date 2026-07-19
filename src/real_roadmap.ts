import { hash } from "./hash";
import { randChoice, randInt, random, setRandSeed } from "./random";
import { randomUUID, type Module, type Request } from "./types";

export const REAL_ROADMAP_VERSION = 1;

export type DealerSite = {
  id: string;
  name: string;
  lon: number;
  lat: number;
  source: "openstreetmap";
};

export type RealRoadMapCache = {
  version: typeof REAL_ROADMAP_VERSION;
  generatedAt: string;
  routingProfile: "driving-hgv";
  routingSource?: "openrouteservice" | "approximate";
  sourceHash: string;
  sites: DealerSite[];
  /** Symmetric, packed, integer kilometres; compatible with the existing WASM solver. */
  distancesKm: number[];
  /** Symmetric, packed travel minutes. Kept for realistic deadlines and future scoring. */
  durationsMinutes: number[];
};

export type RealPos = {
  x: number;
  y: number;
  lon: number;
  lat: number;
  id: string;
  name: string;
};

export function packedRoadIndex(pointCount: number, from: number, to: number): number {
  if (from === to) throw new Error("Cannot get a road from a point to itself");
  let a = from;
  let b = to;
  if (a < b) [a, b] = [b, a];
  let index = a + pointCount * b;
  const packedSize = pointCount * pointCount / 2;
  if (index > packedSize) index = pointCount ** 2 - index;
  return index;
}

export function realRoadMapFromCache(cache: RealRoadMapCache) {
  if (cache.version !== REAL_ROADMAP_VERSION) {
    throw new Error(`Unsupported real-roadmap cache version ${cache.version}`);
  }

  const pointCount = cache.sites.length;
  if (pointCount % 2 !== 0) {
    throw new Error("The existing packed WASM matrix layout requires an even number of sites");
  }
  const matrixSize = pointCount * pointCount / 2;
  if (cache.distancesKm.length !== matrixSize || cache.durationsMinutes.length !== matrixSize) {
    throw new Error(`Invalid real-roadmap matrix size for ${pointCount} sites`);
  }

  const CostMatrix = Uint32Array.from(cache.distancesKm);
  const DurationMatrix = Uint32Array.from(cache.durationsMinutes);
  const points: RealPos[] = cache.sites.map(site => ({
    x: site.lon,
    y: site.lat,
    lon: site.lon,
    lat: site.lat,
    id: site.id,
    name: site.name,
  }));
  const range = Array.from({ length: pointCount }, (_, index) => index);
  const roadIDX = (from: number, to: number) => packedRoadIndex(pointCount, from, to);
  const getroad = (from: number, to: number) => CostMatrix[roadIDX(from, to)]!;
  const findPath = (from: number, to: number) => from === to ? [from] : [from, to];
  const getCostN = (...stops: number[]) => sumLegs(CostMatrix, roadIDX, stops);
  const getDurationMinutesN = (...stops: number[]) => sumLegs(DurationMatrix, roadIDX, stops);

  return {
    points,
    range,
    CostMatrix,
    DurationMatrix,
    roadIDX,
    getroad,
    findPath,
    getCostN,
    getDurationMinutesN,
    cache,
  };
}

function sumLegs(matrix: Uint32Array, index: (a: number, b: number) => number, stops: number[]) {
  let total = 0;
  for (let i = 0; i + 1 < stops.length; i++) {
    if (stops[i] !== stops[i + 1]) total += matrix[index(stops[i]!, stops[i + 1]!)]!;
  }
  return total;
}

/** Creates normal planner input from a cached real map without changing the synthetic generator. */
export function realModule(
  roadmap: ReturnType<typeof realRoadMapFromCache>,
  NREQS = 200,
  NTRANS = 40,
  seed = 22,
): Module {
  if (roadmap.points.length < 2) throw new Error("A real roadmap needs at least two dealer sites");
  setRandSeed(seed);

  const differentPoint = (from: number) => {
    let to = randChoice(roadmap.range);
    while (to === from) to = randChoice(roadmap.range);
    return to;
  };

  const requests = Array.from({ length: NREQS }, () => {
    const startPoint = randChoice(roadmap.range);
    const endPoint = differentPoint(startPoint);
    const directMinutes = roadmap.getDurationMinutesN(startPoint, endPoint);
    return {
      id: randomUUID(),
      startPoint,
      endPoint,
      value_eur: randInt(150, 600),
      deadline_h: (directMinutes + 4 * 60 + random() * 36 * 60) / 60,
    } satisfies Request;
  });

  return {
    NTRANS,
    NREQS,
    MAPSIZE: 1,
    RSIZE: roadmap.CostMatrix.length,
    roadmap,
    requests,
    startpositions: Array.from({ length: NTRANS }, () => randChoice(roadmap.range)),
  };
}

export function realRoadMapSourceHash(sites: DealerSite[], routingProfile = "driving-hgv") {
  return hash(JSON.stringify({ version: REAL_ROADMAP_VERSION, routingProfile, sites }));
}
