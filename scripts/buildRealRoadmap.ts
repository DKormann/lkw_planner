import { mkdir, readFile, writeFile } from "fs/promises";
import {
  REAL_ROADMAP_VERSION,
  packedRoadIndex,
  realRoadMapFromCache,
  realRoadMapSourceHash,
  type DealerSite,
  type RealRoadMapCache,
} from "../src/real_roadmap";
import germanyOutline from "../src/view/germany_outline.json";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type MatrixResponse = {
  distances?: (number | null)[][];
  durations?: (number | null)[][];
};

const DISCOVERY_BOXES = [
  [47.2, 5.5, 55.1, 15.5], // Germany; node-only lookup is small enough for one query
] as const;

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const approximate = args.has("--approximate");
const resample = args.has("--resample");
const symmetric = args.has("--symmetric");
const countArg = process.argv.find(arg => arg.startsWith("--count="));
const targetCount = Number(countArg?.split("=")[1] ?? "300");
const cacheDir = process.env["REAL_ROADMAP_CACHE_DIR"] ?? "data/real-roadmap";
const outputPath = `${cacheDir}/germany-car-dealers-${targetCount}.json`;
const latestPath = `${cacheDir}/germany-car-dealers-latest.json`;
const discoveryPath = `${cacheDir}/overpass-car-dealers-v2.json`;
const overpassUrl = process.env["OVERPASS_URL"] ?? "https://overpass-api.de/api/interpreter";
const orsBaseUrl = (process.env["ORS_URL"] ?? "http://localhost:8080/ors").replace(/\/$/, "");
const orsApiKey = process.env["ORS_API_KEY"];

if (!Number.isInteger(targetCount) || targetCount < 2 || targetCount > 1000 || targetCount % 2 !== 0) {
  throw new Error("--count must be an even integer from 2 to 1000");
}

await mkdir(cacheDir, { recursive: true });

if (!force && !resample && await exists(outputPath)) {
  const cached = JSON.parse(await readFile(outputPath, "utf8")) as RealRoadMapCache;
  realRoadMapFromCache(cached);
  await writeFile(latestPath, JSON.stringify(cached));
  console.log(`Using cached roadmap ${outputPath} (${cached.sites.length} dealer sites)`);
  process.exit(0);
}

const candidates = !force && await exists(discoveryPath)
  ? JSON.parse(await readFile(discoveryPath, "utf8")) as DealerSite[]
  : await discoverDealers();

if (!await exists(discoveryPath) || force) {
  await writeFile(discoveryPath, JSON.stringify(candidates, null, 2));
}

const sites = sampleAcrossGermany(candidates, targetCount);
if (sites.length < targetCount) {
  throw new Error(`Only found ${sites.length} usable car dealers; requested ${targetCount}`);
}

const packedSize = sites.length * sites.length / 2;
const distancesKm = new Array<number>(packedSize).fill(0);
const durationsMinutes = new Array<number>(packedSize).fill(0);

if (approximate) {
  console.log("Building approximate symmetric road matrix from dealer coordinates");
  fillApproximateMatrix(sites, distancesKm, durationsMinutes);
} else {
  const matrixUrl = `${orsBaseUrl}/v2/matrix/driving-hgv`;
  if (symmetric) {
    await fillSymmetricMatrixBlocks(matrixUrl, sites, distancesKm, durationsMinutes);
  } else {
    const matrices = await fetchMatrixBatches(matrixUrl, sites);
    for (let a = 0; a < sites.length; a++) {
      for (let b = 0; b < a; b++) {
        const distance = symmetricValue(matrices.distances, a, b, "distance");
        const duration = symmetricValue(matrices.durations, a, b, "duration");
        const index = packedRoadIndex(sites.length, a, b);
        distancesKm[index] = Math.max(1, Math.round(distance / 1000));
        durationsMinutes[index] = Math.max(1, Math.round(duration / 60));
      }
    }
  }
}

const cache: RealRoadMapCache = {
  version: REAL_ROADMAP_VERSION,
  generatedAt: new Date().toISOString(),
  routingProfile: "driving-hgv",
  routingSource: approximate ? "approximate" : "openrouteservice",
  sourceHash: realRoadMapSourceHash(sites),
  sites,
  distancesKm,
  durationsMinutes,
};
realRoadMapFromCache(cache);
await writeFile(outputPath, JSON.stringify(cache));
await writeFile(latestPath, JSON.stringify(cache));
console.log(`Wrote ${outputPath} with ${sites.length} dealer sites and ${packedSize} cached legs`);

async function discoverDealers(): Promise<DealerSite[]> {
  const byId = new Map<string, DealerSite>();
  for (let i = 0; i < DISCOVERY_BOXES.length; i++) {
    const regionPath = `${cacheDir}/overpass-car-dealers-v2-region-${i}.json`;
    if (!force && await exists(regionPath)) {
      const cachedRegion = JSON.parse(await readFile(regionPath, "utf8")) as DealerSite[];
      for (const site of cachedRegion) byId.set(site.id, site);
      console.log(`Using cached dealer region ${i + 1}/${DISCOVERY_BOXES.length}`);
      continue;
    }
    const bbox = DISCOVERY_BOXES[i]!.join(",");
    const query = `[out:json][timeout:90];node["shop"="car"](${bbox});out body;`;
    console.log(`Discovering car dealers in region ${i + 1}/${DISCOVERY_BOXES.length}`);
    const queryUrl = `${overpassUrl}?data=${encodeURIComponent(query)}`;
    const data = await fetchJson<{ elements: OverpassElement[] }>(queryUrl, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "user-agent": "lkw-planner-roadmap-builder/1.0 (local development)",
      },
    });
    const region: DealerSite[] = [];
    for (const element of data.elements) {
      const lon = element.lon ?? element.center?.lon;
      const lat = element.lat ?? element.center?.lat;
      if (lon === undefined || lat === undefined) continue;
      const id = `${element.type}/${element.id}`;
      const site: DealerSite = {
        id,
        name: element.tags?.["name"] ?? element.tags?.["brand"] ?? `Car dealer ${id}`,
        lon,
        lat,
        source: "openstreetmap",
      };
      region.push(site);
      byId.set(id, site);
    }
    await writeFile(regionPath, JSON.stringify(region));
    await Bun.sleep(3000);
  }
  return [...byId.values()];
}

function fillApproximateMatrix(sites: DealerSite[], distancesKm: number[], durationsMinutes: number[]) {
  for (let a = 0; a < sites.length; a++) {
    for (let b = 0; b < a; b++) {
      const { roadKm, minutes } = approximateLeg(sites[a]!, sites[b]!);
      const index = packedRoadIndex(sites.length, a, b);
      distancesKm[index] = roadKm;
      durationsMinutes[index] = minutes;
    }
  }
}

function approximateLeg(a: DealerSite, b: DealerSite) {
  const straightKm = haversineKm(a, b);
  // Local trips meander more than motorway-scale trips. This is deliberately simple,
  // symmetric, deterministic, and substantially more realistic than Euclidean map units.
  const detourFactor = 1.18 + 0.12 * Math.exp(-straightKm / 80);
  const roadKm = Math.max(1, Math.round(straightKm * detourFactor));
  const minutes = Math.max(1, Math.round(roadKm / 72 * 60 + Math.min(18, roadKm * .12)));
  return { roadKm, minutes };
}

function haversineKm(a: DealerSite, b: DealerSite) {
  const radians = Math.PI / 180;
  const latA = a.lat * radians;
  const latB = b.lat * radians;
  const deltaLat = (b.lat - a.lat) * radians;
  const deltaLon = (b.lon - a.lon) * radians;
  const h = Math.sin(deltaLat / 2) ** 2
    + Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLon / 2) ** 2;
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function fetchMatrixBatches(matrixUrl: string, sites: DealerSite[]) {
  // ORS defaults to at most 2,500 source/destination pairs per matrix call.
  // Sending all destinations and a small source slice keeps every request under that limit.
  const sourceBatchSize = Math.max(1, Math.floor(2500 / sites.length));
  const distances = Array.from({ length: sites.length }, () => [] as (number | null)[]);
  const durations = Array.from({ length: sites.length }, () => [] as (number | null)[]);
  const matrixKey = realRoadMapSourceHash(sites);

  for (let start = 0; start < sites.length; start += sourceBatchSize) {
    const end = Math.min(sites.length, start + sourceBatchSize);
    const batchPath = `${cacheDir}/matrix-${matrixKey}-${start}-${end}.json`;
    let response: MatrixResponse;
    if (!force && await exists(batchPath)) {
      response = JSON.parse(await readFile(batchPath, "utf8")) as MatrixResponse;
      console.log(`Using cached matrix rows ${start}-${end - 1}`);
    } else {
      console.log(`Routing matrix rows ${start}-${end - 1} of ${sites.length - 1}`);
      response = await fetchJson<MatrixResponse>(matrixUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(orsApiKey ? { "authorization": orsApiKey } : {}),
        },
        body: JSON.stringify({
          locations: sites.map(site => [site.lon, site.lat]),
          sources: Array.from({ length: end - start }, (_, offset) => String(start + offset)),
          metrics: ["distance", "duration"],
        }),
      });
      await writeFile(batchPath, JSON.stringify(response));
    }
    if (!response.distances || !response.durations || response.distances.length !== end - start) {
      throw new Error(`ORS returned an invalid matrix batch for rows ${start}-${end - 1}`);
    }
    for (let row = start; row < end; row++) {
      distances[row] = response.distances[row - start]!;
      durations[row] = response.durations[row - start]!;
    }
  }
  return { distances, durations };
}

async function fillSymmetricMatrixBlocks(
  matrixUrl: string,
  sites: DealerSite[],
  distancesKm: number[],
  durationsMinutes: number[],
) {
  const blockSize = 25;
  const matrixKey = realRoadMapSourceHash(sites);
  const blockCount = Math.ceil(sites.length / blockSize);

  for (let sourceBlock = 0; sourceBlock < blockCount; sourceBlock++) {
    const sourceStart = sourceBlock * blockSize;
    const sourceEnd = Math.min(sites.length, sourceStart + blockSize);
    for (let destinationBlock = sourceBlock; destinationBlock < blockCount; destinationBlock++) {
      const destinationStart = destinationBlock * blockSize;
      const destinationEnd = Math.min(sites.length, destinationStart + blockSize);
      const diagonal = sourceBlock === destinationBlock;
      const sourceSites = sites.slice(sourceStart, sourceEnd);
      const destinationSites = diagonal ? sourceSites : sites.slice(destinationStart, destinationEnd);
      const locations = diagonal ? sourceSites : [...sourceSites, ...destinationSites];
      const sources = Array.from({ length: sourceSites.length }, (_, index) => String(index));
      const destinations = diagonal
        ? sources
        : Array.from({ length: destinationSites.length }, (_, index) => String(sourceSites.length + index));
      const batchPath = `${cacheDir}/matrix-symmetric-${matrixKey}-${sourceBlock}-${destinationBlock}.json`;

      let response: MatrixResponse;
      if (!force && await exists(batchPath)) {
        response = JSON.parse(await readFile(batchPath, "utf8")) as MatrixResponse;
        console.log(`Using cached symmetric matrix block ${sourceBlock + 1},${destinationBlock + 1}/${blockCount}`);
      } else {
        console.log(`Routing symmetric matrix block ${sourceBlock + 1},${destinationBlock + 1}/${blockCount}`);
        response = await fetchJson<MatrixResponse>(matrixUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(orsApiKey ? { "authorization": orsApiKey } : {}),
          },
          body: JSON.stringify({
            locations: locations.map(site => [site.lon, site.lat]),
            sources,
            destinations,
            metrics: ["distance", "duration"],
          }),
        });
        await writeFile(batchPath, JSON.stringify(response));
      }

      if (!response.distances || !response.durations) {
        throw new Error(`ORS omitted matrix data for symmetric block ${sourceBlock},${destinationBlock}`);
      }
      for (let source = 0; source < sourceSites.length; source++) {
        for (let destination = 0; destination < destinationSites.length; destination++) {
          if (diagonal && destination <= source) continue;
          const a = sourceStart + source;
          const b = destinationStart + destination;
          const distance = response.distances[source]?.[destination];
          const duration = response.durations[source]?.[destination];
          const index = packedRoadIndex(sites.length, a, b);
          if (distance == null || duration == null) {
            const fallback = approximateLeg(sites[a]!, sites[b]!);
            distancesKm[index] = fallback.roadKm;
            durationsMinutes[index] = fallback.minutes;
          } else {
            distancesKm[index] = Math.max(1, Math.round(distance / 1000));
            durationsMinutes[index] = Math.max(1, Math.round(duration / 60));
          }
        }
      }
    }
  }
}

function sampleAcrossGermany(candidates: DealerSite[], count: number): DealerSite[] {
  // OSM's dealer population already contains the useful geographic weighting: cities with
  // more dealers should produce more sample points. A stable pseudo-random rank avoids bias
  // from Overpass/OSM ordering without creating artificial latitude or longitude bands.
  return candidates
    .filter(site => pointInGermany(site.lon, site.lat))
    .sort((a, b) => stableRank(a.id) - stableRank(b.id) || a.id.localeCompare(b.id))
    .slice(0, count);
}

function pointInGermany(lon: number, lat: number) {
  return germanyOutline.some(polygon =>
    pointInRing(lon, lat, polygon[0]!)
      && !polygon.slice(1).some(hole => pointInRing(lon, lat, hole)),
  );
}

function pointInRing(lon: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, previous = ring.length - 1; i < ring.length; previous = i++) {
    const a = ring[i]!;
    const b = ring[previous]!;
    if ((a[1]! > lat) !== (b[1]! > lat)
      && lon < (b[0]! - a[0]!) * (lat - a[1]!) / (b[1]! - a[1]!) + a[0]!) {
      inside = !inside;
    }
  }
  return inside;
}

function stableRank(value: string) {
  let result = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}

function symmetricValue(matrix: (number | null)[][], a: number, b: number, label: string) {
  const forward = matrix[a]?.[b];
  const reverse = matrix[b]?.[a];
  if (forward == null && reverse == null) throw new Error(`No ${label} route between sites ${a} and ${b}`);
  if (forward == null) return reverse!;
  if (reverse == null) return forward;
  return (forward + reverse) / 2;
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, init);
    if (response.ok) return await response.json() as T;
    const body = await response.text();
    if ((response.status === 429 || response.status === 504) && attempt < 4) {
      const waitSeconds = 15 * (attempt + 1);
      console.log(`${response.status} from endpoint; retrying in ${waitSeconds}s`);
      await Bun.sleep(waitSeconds * 1000);
      continue;
    }
    throw new Error(`${response.status} ${response.statusText} from ${url}: ${body}`);
  }
  throw new Error(`Request retry loop exhausted for ${url}`);
}

async function exists(path: string) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}
