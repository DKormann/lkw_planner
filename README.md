# LKW Planner

An experimental truck-transport scheduling planner. It assigns pickup and delivery
requests to transporters, then uses simulated annealing to improve each route.
Route value and travel costs are represented as integer euro cents; time is kept
in minutes.

The project includes a browser UI and several solver variants. The canonical
schedule representation and JavaScript scoring model live in
`src/planners/annealing_shared.ts`; `annealing_baseline.ts` is the reference
solver, while `annealing_wasm.ts` moves the hot search loop into WebAssembly.

## Cached real-Germany roadmap

`src/real_roadmap.ts` is an optional roadmap implementation built from real car
dealers and HGV road times. It deliberately lives beside the synthetic roadmap:
the latter remains useful for small deterministic solver tests.

The builder discovers `shop=car` locations from OpenStreetMap around a spread of
German cities, chooses a deterministic geographic sample, and requests one HGV
distance/time matrix from openrouteservice. Both the raw dealer discovery and
the completed roadmap are cached under `data/real-roadmap/` (and git-ignored).

```sh
# ORS defaults to a self-hosted instance at http://localhost:8080/ors.
bun scripts/buildRealRoadmap.ts --count=300

# Build immediately without ORS, using symmetric geographic road estimates.
bun scripts/buildRealRoadmap.ts --count=300 --approximate

# Re-sample from cached dealers and rebuild without another Overpass query.
bun scripts/buildRealRoadmap.ts --count=300 --approximate --resample

# Re-query dealers and rebuild the route matrix.
bun scripts/buildRealRoadmap.ts --count=300 --force

# Optional endpoint overrides:
ORS_URL=http://localhost:8080/ors \
OVERPASS_URL=https://overpass-api.de/api/interpreter \
bun scripts/buildRealRoadmap.ts --count=300

# Hosted ORS: keep the key in the shell environment, never in source control.
ORS_URL=https://api.openrouteservice.org \
ORS_API_KEY="$ORS_API_KEY" \
bun scripts/buildRealRoadmap.ts --count=300 --resample --symmetric
```

For self-hosting, use the release Docker Compose setup from the
[openrouteservice documentation](https://giscience.github.io/openrouteservice/run-instance/running-with-docker),
replace its Heidelberg example PBF with a Germany (or selected-state) Geofabrik
extract, and enable the `driving-hgv` profile. A complete Germany graph is a
substantial local build; using only the states covered by a scenario is much
lighter. The dealer lookup uses public Overpass only while building and its
result is cached; it can also point at a self-hosted Overpass endpoint.

The initial cache averages the two route directions into the symmetric packed
matrix expected by the existing WASM solver and rounds distances to kilometres.
This is an explicit approximation. `DurationMatrix` retains routed travel time
for scenario deadlines and a future directed/time-aware scoring model.

The default is 300 dealer sites. Matrix rows are split into requests below ORS's
default 2,500-route limit and cached separately, so larger builds can resume
after interruption. Even sample counts up to 1,000 are accepted.

After a successful build, the builder also updates
`data/real-roadmap/germany-car-dealers-latest.json`. The development server
exposes that cache as `/real-roadmap.json`; the browser automatically uses it
for requests, transporter starts, WASM distance lookup, and map points. If the
cache is absent or invalid, startup falls back to the existing synthetic map.

The real-roadmap view includes a locally bundled, simplified Germany boundary
behind the dealer points. It is derived from Natural Earth's public-domain
Admin-0 country data; no map request is made when the browser renders it.

On a real roadmap, highlighted request and transporter legs are upgraded from
straight lines to ORS HGV road geometry. The browser calls the local server, so
the API key never leaves the backend. Each symmetric dealer-pair geometry is
cached under `data/real-roadmap/routes/`; subsequent highlights are offline.

## Run and check

This repository uses [Bun](https://bun.sh/).

```sh
# Rebuild the browser bundle when source files change, then serve on :3030
bun src/start_server.ts dev

# Exercise the WASM DSL and verify its planner score against JavaScript
bun test tests/wasm.test.ts

# Type-check (the view has known unrelated unresolved globals)
bun x tsc --noEmit
```

## Mini WASM DSL example

`src/wasm/` is a small typed TypeScript DSL that compiles module definitions to
WebAssembly. Arrays become shared WASM memory views after compilation.

```ts
import { array, compile, func, ret } from "./src/wasm"

const values = array("i32", 2)
const addAt = func(["i32", "i32"], "i32", (a, b) => [
  values.at(0).set(a),
  values.at(1).set(b),
  ret(values.at(0).add(values.at(1))),
])

const wasm = await compile({ addAt, values })
console.log(wasm.addAt(20, 22)) // 42
console.log(wasm.values)        // Int32Array [20, 22]
```

The DSL supports locals, globals, loops, conditionals, calls, packed structs,
and optional user-level bounds checks. See `tests/wasm.test.ts` for focused
examples and `src/planners/annealing_wasm.ts` for the full planner use case.
