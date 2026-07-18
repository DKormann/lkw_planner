import { packedRoadIndex, realModule, realRoadMapFromCache, type RealRoadMapCache } from "../src/real_roadmap";
import { assert, runTests } from "./tests";

const cache: RealRoadMapCache = {
  version: 1,
  generatedAt: "2026-01-01T00:00:00.000Z",
  routingProfile: "driving-hgv",
  sourceHash: "test",
  sites: [
    { id: "node/1", name: "Berlin Cars", lon: 13.4, lat: 52.5, source: "openstreetmap" },
    { id: "node/2", name: "Hamburg Cars", lon: 10.0, lat: 53.5, source: "openstreetmap" },
    { id: "node/3", name: "Munich Cars", lon: 11.6, lat: 48.1, source: "openstreetmap" },
    { id: "node/4", name: "Cologne Cars", lon: 6.96, lat: 50.94, source: "openstreetmap" },
  ],
  distancesKm: [0, 290, 580, 775, 0, 0, 500, 425],
  durationsMinutes: [0, 210, 360, 480, 0, 0, 330, 290],
};

await runTests(
  function realRoadmapPackedMatrix() {
    const roadmap = realRoadMapFromCache(cache);
    assert(packedRoadIndex(4, 0, 1) === packedRoadIndex(4, 1, 0), "packed matrix should be symmetric");
    assert(roadmap.getCostN(0, 1, 2) === 290 + 500, "multi-leg distances should add");
    assert(roadmap.getDurationMinutesN(0, 2) === 360, "duration matrix should be available");
  },

  function deterministicRealModule() {
    const roadmap = realRoadMapFromCache(cache);
    const a = realModule(roadmap, 10, 2, 42);
    const b = realModule(roadmap, 10, 2, 42);
    assert(JSON.stringify(a.requests) === JSON.stringify(b.requests), "request sampling should be deterministic");
    assert(a.RSIZE === cache.distancesKm.length, "module should expose the packed matrix size");
    for (const request of a.requests) {
      assert(request.startPoint !== request.endPoint, "requests should move between different dealers");
      assert(
        request.deadline_h * 60 > roadmap.getDurationMinutesN(request.startPoint, request.endPoint),
        "deadlines should exceed direct routed time",
      );
    }
  },
);
