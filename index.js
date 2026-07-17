// src/view/html.ts
var body = document.body;
var colorPalette = {
  light: {
    color: "#000",
    background: "#fff",
    red: "rgb(242, 55, 55)",
    green: "rgb(57, 214, 39)",
    blue: "rgb(5, 28, 141)",
    lightblue: "rgb(21, 137, 239)",
    gray: "#888",
    lightgray: "#e5e5e5"
  },
  dark: {
    color: "#fff",
    background: "#222",
    red: "rgb(198, 20, 0)",
    blue: "rgb(95, 159, 255)",
    lightblue: "rgb(95, 100, 255)",
    green: "rgb(0, 185, 19)",
    gray: "#565656",
    lightgray: "#414141"
  }
};
var color = {
  color: "var(--color)",
  background: "var(--background)",
  blue: "var(--blue)",
  lightBlue: "var(--lightblue)",
  red: "var(--red)",
  green: "var(--green)",
  gray: "var(--gray)",
  lightgray: "var(--lightgray)"
};
var styl = document.createElement("style");
styl.innerHTML = `
:root {
  --color: ${colorPalette.dark.color};
  --background: ${colorPalette.dark.background};
  --red: ${colorPalette.dark.red};
  --green: ${colorPalette.dark.green};
  --blue: ${colorPalette.dark.blue};
  --gray: ${colorPalette.dark.gray};
  --lightgray: ${colorPalette.dark.lightgray};
  color: var(--color);
  background: var(--background);
  font-family: sans-serif;
}
@media (prefers-color-scheme: light) {
  :root {
    --color: ${colorPalette.light.color};
    --background: ${colorPalette.light.background};
    --red: ${colorPalette.light.red};
    --green: ${colorPalette.light.green};
    --blue: ${colorPalette.light.blue};
    --gray: ${colorPalette.light.gray};
    --lightgray: ${colorPalette.light.lightgray};
  }
}
`;
document.head.appendChild(styl);
var htmlElement = (tag, text, args) => {
  const _element = document.createElement(tag);
  _element.textContent = text;
  let st = _element.style;
  if (tag == "button") {
    _element.innerText = text;
    st.color = color.color;
    st.backgroundColor = color.lightgray;
    st.border = "1px solid " + color.gray;
    st.borderRadius = ".2em";
    st.padding = ".1em .4em";
    st.margin = ".2em";
  }
  if (args)
    Object.entries(args).forEach(([key, value]) => {
      if (key === "parent") {
        value.appendChild(_element);
      }
      if (key === "children") {
        value.forEach((c) => _element.appendChild(c));
      } else if (key === "eventListeners") {
        Object.entries(value).forEach(([event, listener]) => {
          _element.addEventListener(event, listener);
        });
      } else if (key === "style") {
        Object.assign(_element.style, value);
      } else {
        _element[key] = value;
      }
    });
  return _element;
};
var html = (tag, ...cs) => {
  let children = [];
  let args = {};
  const add_arg = (arg) => {
    if (typeof arg === "string")
      children.push(htmlElement("span", arg));
    else if (typeof arg === "number")
      children.push(htmlElement("span", arg.toString()));
    else if (arg instanceof Promise) {
      const el = span("...");
      arg.then((value) => {
        el.innerHTML = "";
        el.appendChild(span(value));
      });
      children.push(el);
    } else if (arg instanceof HTMLElement)
      children.push(arg);
    else if (Array.isArray(arg))
      arg.forEach((x) => add_arg(x));
    else if (typeof arg == "function") {
      if (arg.name == "oninput")
        args.oninput = arg;
      else if (arg.name == "onclick" || arg.length < 2)
        args.onclick = arg;
      else
        console.warn("Function argument without name or with more than one parameter is ignored in html generator");
    } else
      args = { ...args, ...arg };
  };
  cs.forEach(add_arg);
  return htmlElement(tag, "", { ...args, children });
};
var newHtmlGenerator = (tag) => (...cs) => html(tag, ...cs);
var p = newHtmlGenerator("p");
var a = newHtmlGenerator("a");
var h1 = newHtmlGenerator("h1");
var h2 = newHtmlGenerator("h2");
var h3 = newHtmlGenerator("h3");
var h4 = newHtmlGenerator("h4");
var div = newHtmlGenerator("div");
var pre = newHtmlGenerator("pre");
var span = newHtmlGenerator("span");
var textarea = newHtmlGenerator("textarea");
var button = newHtmlGenerator("button");
var table = newHtmlGenerator("table");
var tr = newHtmlGenerator("tr");
var td = newHtmlGenerator("td");
var th = newHtmlGenerator("th");
var canvas = newHtmlGenerator("canvas");
var style = (...rules) => ({ style: Object.assign({}, ...rules) });
var popup = (...cs) => {
  const dialogfield = div({
    style: {
      background: color.background,
      color: color.color,
      padding: "1em 4em",
      paddingBottom: "2em",
      borderRadius: "1em",
      zIndex: "2000",
      overflowY: "scroll",
      minWidth: "20vw",
      maxHeight: "80vh"
    }
  }, ...cs);
  const popupbackground = div({ style: {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "rgba(166, 166, 166, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "2000"
  } });
  popupbackground.appendChild(dialogfield);
  document.body.appendChild(popupbackground);
  popupbackground.onclick = () => {
    popupbackground.remove();
  };
  dialogfield.onclick = (e) => e.stopPropagation();
  return popupbackground;
};

// src/view/mapView.ts
function mkSvg(tag, x1, y1, x2, y2) {
  let el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (tag == "circle") {
    el.setAttribute("cx", x1.toString());
    el.setAttribute("cy", y1.toString());
    el.setAttribute("r", "0.01");
    el.setAttribute("fill", "gray");
    return {
      el,
      setColor: (color2) => {
        el.setAttribute("fill", color2);
      }
    };
  } else if (tag == "line") {
    el.setAttribute("x1", x1.toString());
    el.setAttribute("y1", y1.toString());
    el.setAttribute("x2", x2.toString());
    el.setAttribute("y2", y2.toString());
    el.setAttribute("stroke", "gray");
    el.setAttribute("stroke-width", "0.005");
    return {
      el,
      setColor: (color2) => {
        el.setAttribute("stroke", color2);
      }
    };
  } else if (tag == "text") {
    el.setAttribute("x", x1.toString());
    el.setAttribute("y", y1.toString());
    el.setAttribute("text-anchor", "middle");
    el.setAttribute("dominant-baseline", "middle");
    el.textContent = String(x2);
    el.setAttribute("font-size", ".07");
    el.setAttribute("fill", "gray");
    return { el, setColor: (color2) => {
      el.setAttribute("fill", color2);
    } };
  }
  throw new Error("Invalid tag");
}
function mapView(mod) {
  let { roadmap, MAPSIZE } = mod;
  let element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  element.setAttribute("width", "80%");
  element.setAttribute("height", "80%");
  element.setAttribute("viewBox", "0 0 1 1");
  let elements = new Map;
  let sources = new Map;
  for (let x = 0;x < roadmap.points.length; x++) {
    for (let y = 0;y < roadmap.points.length; y++) {
      if (x == y)
        continue;
      let len = roadmap.getroad(x, y);
      if (len == 0 || len == undefined)
        continue;
      let a2 = roadmap.points[x];
      let b = roadmap.points[y];
      let line = mkSvg("line", a2.x / MAPSIZE, a2.y / MAPSIZE, b.x / MAPSIZE, b.y / MAPSIZE).el;
      let id = "road" + roadmap.roadIDX(x, y);
      elements.set(id, line);
      sources.set(line, id);
      element.appendChild(line);
    }
  }
  for (let x = 0;x < roadmap.points.length; x++) {
    let loc = roadmap.points[x];
    let circle = mkSvg("circle", loc.x / MAPSIZE, loc.y / MAPSIZE).el;
    elements.set(x, circle);
    sources.set(circle, x);
    element.appendChild(circle);
  }
  let hints = [];
  hightLights.onupdate((nH, o) => {
    hints.forEach((el) => el.remove());
    for (let n of nH) {
      let last = null;
      for (let p3 of n.points) {
        let next = p3.number;
        if (last !== null) {}
        last = next;
      }
      for (let p3 of n.points) {
        if (p3.logo) {
          let pos = roadmap.points[p3.number];
          let el = mkSvg("text", pos.x / MAPSIZE, pos.y / MAPSIZE, p3.logo);
          el.el.setAttribute("z-index", "1000");
          element.appendChild(el.el);
          hints.push(el.el);
        }
      }
    }
  });
  let dv = div(style({ width: "100%", display: "flex", justifyContent: "center", padding: "1em" }));
  dv.append(element);
  return dv;
}

// src/random.ts
var RANDSEED = 0;
function setRandSeed(seed) {
  RANDSEED = seed;
  RANDSEED = randInt(0, 1e4);
}
function random() {
  let x = Math.sin(RANDSEED++) * 1e4;
  return x - Math.floor(x);
}
function randInt(min, max) {
  return Math.floor(random() * (max - min)) + min;
}
function randChoice(arr) {
  return arr[randInt(0, arr.length)];
}

// src/roadmap.ts
function randomMap(NPOINTS, MAPSIZE) {
  let HPOINT = NPOINTS / 2;
  let RSIZE = NPOINTS * HPOINT;
  let roads = new Uint16Array(RSIZE);
  function roadIDX(a2, b) {
    if (a2 < b)
      [a2, b] = [b, a2];
    let idx = a2 + NPOINTS * b;
    if (idx > RSIZE)
      idx = NPOINTS ** 2 - idx;
    return idx;
  }
  function getroad(a2, b) {
    if (a2 == b)
      throw new Error("Cannot get road from a point to itself");
    return roads[roadIDX(a2, b)];
  }
  function setroad(a2, b, dist) {
    if (a2 == b)
      throw new Error("Cannot set road from a point to itself");
    roads[roadIDX(a2, b)] = dist;
  }
  let range = Array.from({ length: NPOINTS }, (_, i) => i);
  let points = range.map(() => ({ x: randInt(0, MAPSIZE), y: randInt(0, MAPSIZE) }));
  let neighs = points.map((ps, i) => points.map((p22, i2) => ({ d: Math.floor(Math.hypot(ps.x - p22.x, ps.y - p22.y)), i: i2 })).filter((x) => x.i != i).sort((a2, b) => a2.d - b.d));
  function connect(a2, b, dist) {
    if (a2 === b)
      return;
    if (getroad(a2, b) !== 0)
      return;
    setroad(a2, b, dist);
  }
  const connected = new Set([0]);
  while (connected.size < NPOINTS) {
    let bestA = -1;
    let bestB = -1;
    let bestD = Infinity;
    for (const a2 of connected) {
      for (const nei of neighs[a2] ?? []) {
        if (connected.has(nei.i))
          continue;
        if (nei.d < bestD) {
          bestA = a2;
          bestB = nei.i;
          bestD = nei.d;
        }
      }
    }
    if (bestA === -1 || bestB === -1)
      throw new Error("Failed to connect random map");
    connect(bestA, bestB, bestD);
    connected.add(bestB);
  }
  for (let x = 0;x < NPOINTS; x++) {
    const extraEdges = 2 + randInt(0, 3);
    for (let i = 0;i < extraEdges; i++) {
      const nx = neighs[x]?.[i];
      if (!nx)
        continue;
      connect(x, nx.i, nx.d);
    }
  }
  const CostMatrix = new Uint32Array(RSIZE);
  {
    const pointCount = points.length;
    const INF = 65535;
    CostMatrix.fill(INF);
    for (let start = 0;start < pointCount; start++) {
      const dist = new Uint32Array(pointCount);
      const visited = new Uint8Array(pointCount);
      dist.fill(INF);
      dist[start] = 0;
      for (let step = 0;step < pointCount; step++) {
        let current = -1;
        let best = INF;
        for (let node = 0;node < pointCount; node++) {
          if (visited[node] === 0 && dist[node] < best) {
            best = dist[node];
            current = node;
          }
        }
        if (current === -1)
          break;
        visited[current] = 1;
        for (let next = 0;next < pointCount; next++) {
          if (next === current)
            continue;
          const road = getroad(current, next);
          if (road === 0)
            continue;
          const nextCost = dist[current] + road;
          if (nextCost < dist[next]) {
            dist[next] = nextCost;
          }
        }
      }
      for (let end = 0;end < pointCount; end++) {
        if (end === start)
          continue;
        const idx = roadIDX(start, end);
        CostMatrix[idx] = Math.min(dist[end], INF);
      }
    }
  }
  function findPath(start, end) {
    let path = [start];
    let cost = CostMatrix[roadIDX(start, end)];
    while (start != end) {
      for (let x = 0;x < points.length; x++) {
        if (x == start)
          continue;
        let road = getroad(start, x);
        if (road == 0)
          continue;
        let restcost = CostMatrix[roadIDX(x, end)];
        if (road + restcost == cost) {
          cost = restcost;
          start = x;
          path.push(x);
          break;
        }
      }
    }
    return path;
  }
  function getCostN(...points2) {
    let cost = 0;
    for (let i = 0;i < points2.length - 1; i++) {
      cost += CostMatrix[roadIDX(points2[i], points2[i + 1])];
    }
    return cost;
  }
  return { getroad, roadIDX, points, range, CostMatrix, findPath, getCostN };
}

// src/jsonschema.ts
var typeName = (value) => {
  if (value === null)
    return "null";
  if (Array.isArray(value))
    return "array";
  return typeof value;
};
var pathLabel = (path) => path || "$";
var fail = (path, message) => {
  throw new Error(`Validation error at ${pathLabel(path)}: ${message}`);
};
var isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var deepEqual = (left, right) => {
  if (Object.is(left, right))
    return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => deepEqual(value, right[index]));
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length && leftKeys.every((key) => (key in right) && deepEqual(left[key], right[key]));
  }
  return false;
};
var appendPath = (path, part) => path ? `${path}${part}` : `$${part}`;
var validateObject = (schema, value, path) => {
  if (!isPlainObject(value))
    fail(path, `expected object, got ${typeName(value)}`);
  const objectValue = value;
  const properties = isPlainObject(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const key of required) {
    if (typeof key !== "string")
      continue;
    if (!(key in objectValue))
      fail(appendPath(path, `.${key}`), "is required");
  }
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (!(key in objectValue))
      continue;
    if (!isPlainObject(propertySchema))
      continue;
    validateJsonSchema(propertySchema, objectValue[key], appendPath(path, `.${key}`));
  }
  const extraKeys = Object.keys(objectValue).filter((key) => !(key in properties));
  const additional = schema.additionalProperties;
  if (additional === false) {
    if (extraKeys.length > 0)
      fail(appendPath(path, `.${extraKeys[0]}`), "additional properties are not allowed");
    return;
  }
  if (isPlainObject(additional)) {
    for (const key of extraKeys) {
      validateJsonSchema(additional, objectValue[key], appendPath(path, `.${key}`));
    }
  }
};
var validateArray = (schema, value, path) => {
  if (!Array.isArray(value))
    fail(path, `expected array, got ${typeName(value)}`);
  const arrayValue = value;
  if (!isPlainObject(schema.items))
    return;
  arrayValue.forEach((item, index) => validateJsonSchema(schema.items, item, appendPath(path, `[${index}]`)));
};
var validateByType = (schema, value, path) => {
  switch (schema.type) {
    case "string":
      if (typeof value !== "string")
        fail(path, `expected string, got ${typeName(value)}`);
      return;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value))
        fail(path, `expected number, got ${typeName(value)}`);
      return;
    case "boolean":
      if (typeof value !== "boolean")
        fail(path, `expected boolean, got ${typeName(value)}`);
      return;
    case "null":
      if (value !== null)
        fail(path, `expected null, got ${typeName(value)}`);
      return;
    case "array":
      validateArray(schema, value, path);
      return;
    case "object":
      validateObject(schema, value, path);
      return;
    case undefined:
      return;
    default:
      fail(path, `unsupported schema type ${JSON.stringify(schema.type)}`);
  }
};
var validateJsonSchema = (schema, value, path = "") => {
  if ("const" in schema && !deepEqual(value, schema.const)) {
    fail(path, `expected constant ${JSON.stringify(schema.const)}`);
  }
  if (Array.isArray(schema.anyOf)) {
    const errors = [];
    for (const option of schema.anyOf) {
      if (!isPlainObject(option))
        continue;
      try {
        return validateJsonSchema(option, value, path);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    fail(path, errors[0] ?? "did not match any allowed schema");
  }
  if (Array.isArray(schema.allOf)) {
    for (const option of schema.allOf) {
      if (!isPlainObject(option))
        continue;
      validateJsonSchema(option, value, path);
    }
  }
  validateByType(schema, value, path);
  return value;
};

// src/schema.ts
var validate = (schema, data) => {
  return validateJsonSchema(schema.json, data);
};
var fromJsonSchema = (json) => ({ json });
var string = fromJsonSchema({ type: "string" });
var number = fromJsonSchema({ type: "number" });
var boolean = fromJsonSchema({ type: "boolean" });
var nullSchema = fromJsonSchema({ type: "null" });
var any = fromJsonSchema({});
var array = (itemSchema) => fromJsonSchema({ type: "array", items: itemSchema.json });
var constant = (value) => fromJsonSchema({ const: value });
var object = (shape) => fromJsonSchema({
  type: "object",
  properties: Object.fromEntries(Object.entries(shape).map(([key, field]) => [key, field.json])),
  required: Object.keys(shape)
});
var record = (valueSchema) => fromJsonSchema({ type: "object", additionalProperties: valueSchema.json });
var schemaSchema = record(any);
var union = (...schemas) => fromJsonSchema({ anyOf: schemas.map((s) => s.json) });
function tagged(fields) {
  return union(...Object.entries(fields).map(([$, val]) => object({ $: constant($), val })));
}

// src/types.ts
var UUID = string;
function randomUUID() {
  return "u" + random().toString(16).slice(2, 10) + "-" + random().toString(16).slice(2, 10);
}
var Request = object({
  id: UUID,
  startPoint: number,
  endPoint: number,
  value_eur: number,
  deadline_h: number
});
var Transporter = object({ id: UUID, position: UUID });
var ScheduleStep = tagged({
  pickup: object({ request: UUID, pos: number, deck: union(constant(0), constant(1)) }),
  deliver: object({ request: UUID, pos: number }),
  start: object({ pos: number })
});
var ScheduleItem = object({
  transporter: UUID,
  steps: array(ScheduleStep)
});
var Schedule = array(ScheduleItem);
function randomModule(NREQS = 200, NTRANS = 40, NPOINTS = 100, MAPSIZE = 400, seed = 22) {
  const roadmap = randomMap(NPOINTS, MAPSIZE);
  return {
    NTRANS,
    NREQS,
    MAPSIZE,
    RSIZE: NPOINTS * NPOINTS / 2,
    roadmap,
    requests: Array.from({ length: NREQS }, (_, i) => ({
      id: randomUUID(),
      deadline_h: (1 + random()) * 40,
      startPoint: randChoice(roadmap.range),
      endPoint: randChoice(roadmap.range),
      value_eur: randInt(100, 400)
    })),
    startpositions: Array.from({ length: NTRANS }, (_, i) => randChoice(roadmap.range))
  };
}

// src/writeable.ts
function mkWritable(value) {
  let listeners = [];
  let rep = JSON.stringify(value);
  let res = {
    get: () => value,
    set: (newValue) => {
      let newRep = JSON.stringify(newValue);
      if (newRep === rep)
        return;
      rep = newRep;
      listeners.forEach((listener) => listener(newValue, value));
      value = newValue;
    },
    onupdate: (listener, deferred = false) => {
      if (!deferred)
        listener(value, value);
      listeners.push(listener);
    },
    update: (callback) => {
      let newValue = callback(value) ?? value;
      res.set(newValue);
    }
  };
  return res;
}
function mkStored(key, schema, defaultValue) {
  let val = defaultValue;
  try {
    val = validate(schema, JSON.parse(localStorage.getItem(key)));
  } catch {}
  let res = mkWritable(val);
  res.onupdate((newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  });
  return res;
}

// src/planners/annealing_shared.ts
var KM_COST = 0.5;
var AVG_SPEED_KMH = 60;
var REORG_COST_EUR = 100;
var INF = 1 << 30;
function isLoad(x) {
  return x & 1;
}
function getDeck(x) {
  return (x & 2) >> 1;
}
function getReq(x) {
  return (x & 65535) >> 2;
}
function getPos(x) {
  return x >> 16;
}
function initAnnealingState(mod, seed) {
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
    scheduleRatings: seed ? new Int32Array(seed.scheduleRatings) : new Int32Array(NTRANS)
  };
}
function routeOffset(state, tran) {
  return tran * state.TSIZE;
}
function setReq(state, tran, idx, isLoadBit, deck, req, pos) {
  state.schedule[routeOffset(state, tran) + idx] = isLoadBit << 0 | deck << 1 | req << 2 | pos << 16;
}
function scoreRoute(state, tran) {
  let reward = 0;
  let duration = 0;
  const decks = [[], []];
  let pos = state.tranStart[tran];
  const offset = routeOffset(state, tran);
  for (let i = 0;i < state.scheduleSizes[tran]; i++) {
    const step = state.schedule[offset + i];
    const load = isLoad(step);
    const req = getReq(step);
    const nextPos = getPos(step);
    duration += state.mod.roadmap.getCostN(pos, nextPos);
    pos = nextPos;
    if (load) {
      const deck = decks[getDeck(step)];
      deck.push(req);
      if (deck.length > 3)
        return -INF;
    } else {
      const deck = decks[getDeck(step)];
      const idx = deck.indexOf(req);
      if (idx === -1)
        return -INF;
      duration += (deck.length - idx - 1) * REORG_COST_EUR / KM_COST;
      deck.splice(idx, 1);
      if (duration <= state.reqDeadlines[req])
        reward += state.reqValues[req];
    }
  }
  return reward - duration;
}
function bootstrapEmptyRoutes(state, maxLoss = 240) {
  for (let tran = 0;tran < state.NTRANS; tran++) {
    if (state.scheduleSizes[tran] !== 0)
      continue;
    let bestReq = -1;
    let bestScore = -INF;
    for (let req = 0;req < state.NREQS; req++) {
      if (!state.unassigned[req])
        continue;
      insertStops(state, tran, 0, 0, 0, req);
      const score = scoreRoute(state, tran);
      removeStops(state, tran, 0, 1);
      if (score > bestScore) {
        bestScore = score;
        bestReq = req;
      }
    }
    if (bestReq === -1 || bestScore < -maxLoss)
      continue;
    insertStops(state, tran, 0, 0, 0, bestReq);
    state.scheduleRatings[tran] = bestScore;
    state.unassigned[bestReq] = 0;
  }
}
function insertStops(state, tran, start, end, deck, req) {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran];
  state.scheduleSizes[tran] = size + 2;
  state.schedule.copyWithin(offset + end + 2, offset + end, offset + size);
  state.schedule.copyWithin(offset + start + 1, offset + start, offset + end + 1);
  setReq(state, tran, start, 1, deck, req, state.reqPickupLocations[req]);
  setReq(state, tran, end + 1, 0, deck, req, state.reqDeliveryLocations[req]);
}
function removeStops(state, tran, start, end) {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran];
  state.scheduleSizes[tran] = size - 2;
  state.schedule.copyWithin(offset + start, offset + start + 1, offset + end);
  state.schedule.copyWithin(offset + end - 1, offset + end + 1, offset + size);
}
function findPairInRoute(state, tran, req) {
  const offset = routeOffset(state, tran);
  const size = state.scheduleSizes[tran];
  let first = -1;
  let second = -1;
  let deck = 0;
  for (let i = 0;i < size; i++) {
    const step = state.schedule[offset + i];
    if (getReq(step) !== req)
      continue;
    if (first === -1) {
      first = i;
      deck = getDeck(step);
    } else {
      second = i;
      break;
    }
  }
  if (first === -1 || second === -1)
    return null;
  return { req, first, second, deck };
}
function sampleUnassignedReq(state, maxAttempts = 24) {
  for (let i = 0;i < maxAttempts; i++) {
    const req = randInt(0, state.NREQS);
    if (state.unassigned[req])
      return req;
  }
  for (let req = 0;req < state.NREQS; req++) {
    if (state.unassigned[req])
      return req;
  }
  return null;
}
function sampleAssignedPair(state, maxAttempts = 24) {
  for (let attempt = 0;attempt < maxAttempts; attempt++) {
    const tran = randInt(0, state.NTRANS);
    const size = state.scheduleSizes[tran];
    if (size < 2)
      continue;
    const idx = randInt(0, size);
    const req = getReq(state.schedule[routeOffset(state, tran) + idx]);
    const pair = findPairInRoute(state, tran, req);
    if (pair)
      return { tran, pair };
  }
  for (let tran = 0;tran < state.NTRANS; tran++) {
    const size = state.scheduleSizes[tran];
    if (size < 2)
      continue;
    const req = getReq(state.schedule[routeOffset(state, tran)]);
    const pair = findPairInRoute(state, tran, req);
    if (pair)
      return { tran, pair };
  }
  return null;
}
function acceptAnneal(prevScore, nextScore, temp) {
  if (nextScore >= prevScore)
    return true;
  const delta = prevScore - nextScore;
  return random() < Math.exp(-delta / Math.max(temp, 0.001));
}
function toAnnealingResult(state, elapsedMs) {
  return {
    schedule: state.schedule,
    scheduleSizes: state.scheduleSizes,
    tranStart: state.tranStart,
    TSIZE: state.TSIZE,
    scheduleRatings: state.scheduleRatings,
    unassigned: state.unassigned,
    elapsedMs,
    totalScore: state.scheduleRatings.reduce((sum, value) => sum + value, 0)
  };
}

// src/planners/annealing_baseline.ts
function baselineAnnealing(mod, steps = 1600000) {
  const state = initAnnealingState(mod);
  const { NREQS, NTRANS, TSIZE, schedule, scheduleSizes, scheduleRatings, unassigned } = state;
  let startTemp = 100;
  let temp = startTemp;
  bootstrapEmptyRoutes(state);
  function accept(prevRating, nextRating) {
    if (nextRating >= prevRating)
      return true;
    return random() < Math.exp((nextRating - prevRating) / Math.max(temp, 0.001));
  }
  function tryAssign() {
    const tran = randInt(0, NTRANS);
    const schedSize = scheduleSizes[tran];
    const a2 = randInt(0, schedSize + 1);
    const b = Math.min(schedSize, randInt(0, 4) + a2);
    const req = randInt(0, NREQS);
    if (!unassigned[req])
      return;
    insertStops(state, tran, a2, b, random() > 0.5 ? 1 : 0, req);
    const newRating = scoreRoute(state, tran);
    if (accept(scheduleRatings[tran], newRating)) {
      scheduleRatings[tran] = newRating;
      unassigned[req] = 0;
    } else {
      removeStops(state, tran, a2, b + 1);
    }
  }
  function tryUnassign() {
    const tran = randInt(0, NTRANS);
    const schedSize = scheduleSizes[tran];
    if (schedSize < 2)
      return;
    const idx = randInt(0, schedSize);
    const item = schedule[tran * TSIZE + idx];
    const req = getReq(item);
    const ab = [];
    for (let i = 0;i < schedSize; i++) {
      if (getReq(schedule[tran * TSIZE + i]) === req)
        ab.push(i);
    }
    if (ab.length !== 2)
      return;
    const [a2, b] = ab;
    removeStops(state, tran, a2, b);
    const newRating = scoreRoute(state, tran);
    if (accept(scheduleRatings[tran], newRating)) {
      scheduleRatings[tran] = newRating;
      unassigned[req] = 1;
    } else {
      insertStops(state, tran, a2, b - 1, getDeck(item), req);
    }
  }
  const startedAt = Date.now();
  for (let i = 0;i < steps; i++) {
    temp = (1 - i / steps) * startTemp;
    tryUnassign();
    tryAssign();
  }
  return toAnnealingResult(state, Date.now() - startedAt);
}

// src/planners/annealing_improved.ts
function createImprovedAnnealingSession(mod, targetSteps = 150000) {
  const warmupSteps = Math.min(Math.max(20000, Math.floor(targetSteps * 0.2)), 50000);
  const warmup = baselineAnnealing(mod, warmupSteps);
  const state = initAnnealingState(mod, warmup);
  const { NTRANS, scheduleSizes, scheduleRatings, unassigned } = state;
  bootstrapEmptyRoutes(state);
  let startTemp = 120;
  let endTemp = 0.5;
  let temp = startTemp;
  function tryAssignSampled(samples = 8) {
    let best = null;
    for (let sample = 0;sample < samples; sample++) {
      const req = sampleUnassignedReq(state);
      if (req == null)
        break;
      const tran = randInt(0, NTRANS);
      const size = scheduleSizes[tran];
      const a2 = randInt(0, size + 1);
      const b = Math.min(size, a2 + randInt(0, Math.min(6, size - a2 + 1)));
      const deck = random() > 0.5 ? 1 : 0;
      insertStops(state, tran, a2, b, deck, req);
      const newScore = scoreRoute(state, tran);
      removeStops(state, tran, a2, b + 1);
      if (!best || newScore > best.score) {
        best = { tran, req, a: a2, b, deck, score: newScore };
      }
    }
    if (!best)
      return;
    insertStops(state, best.tran, best.a, best.b, best.deck, best.req);
    if (acceptAnneal(scheduleRatings[best.tran], best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
      unassigned[best.req] = 0;
    } else {
      removeStops(state, best.tran, best.a, best.b + 1);
    }
  }
  function tryUnassignSampled(samples = 6) {
    let best = null;
    for (let sample = 0;sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen)
        break;
      const { tran, pair } = chosen;
      removeStops(state, tran, pair.first, pair.second);
      const newScore = scoreRoute(state, tran);
      insertStops(state, tran, pair.first, pair.second - 1, pair.deck, pair.req);
      if (!best || newScore > best.score) {
        best = { tran, pair, score: newScore };
      }
    }
    if (!best)
      return;
    removeStops(state, best.tran, best.pair.first, best.pair.second);
    if (acceptAnneal(scheduleRatings[best.tran], best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
      unassigned[best.pair.req] = 1;
    } else {
      insertStops(state, best.tran, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }
  function tryRelocateSampled(samples = 8) {
    let best = null;
    for (let sample = 0;sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen)
        break;
      const { tran: src, pair } = chosen;
      const dst = randInt(0, NTRANS);
      const oldScore = src === dst ? scheduleRatings[src] : scheduleRatings[src] + scheduleRatings[dst];
      removeStops(state, src, pair.first, pair.second);
      const dstSize = scheduleSizes[dst];
      const a2 = randInt(0, dstSize + 1);
      const b = Math.min(dstSize, a2 + randInt(0, Math.min(6, dstSize - a2 + 1)));
      insertStops(state, dst, a2, b, pair.deck, pair.req);
      const candidateScore = src === dst ? scoreRoute(state, src) : scoreRoute(state, src) + scoreRoute(state, dst);
      removeStops(state, dst, a2, b + 1);
      insertStops(state, src, pair.first, pair.second - 1, pair.deck, pair.req);
      if (!best || candidateScore > best.score) {
        best = {
          src,
          dst,
          pair,
          insertA: a2,
          insertB: b,
          score: candidateScore,
          oldScore
        };
      }
    }
    if (!best)
      return;
    removeStops(state, best.src, best.pair.first, best.pair.second);
    insertStops(state, best.dst, best.insertA, best.insertB, best.pair.deck, best.pair.req);
    if (acceptAnneal(best.oldScore, best.score, temp)) {
      if (best.src === best.dst) {
        scheduleRatings[best.src] = scoreRoute(state, best.src);
      } else {
        scheduleRatings[best.src] = scoreRoute(state, best.src);
        scheduleRatings[best.dst] = scoreRoute(state, best.dst);
      }
    } else {
      removeStops(state, best.dst, best.insertA, best.insertB + 1);
      insertStops(state, best.src, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }
  function tryReinsertSampled(samples = 8) {
    let best = null;
    for (let sample = 0;sample < samples; sample++) {
      const chosen = sampleAssignedPair(state);
      if (!chosen)
        break;
      const { tran, pair } = chosen;
      removeStops(state, tran, pair.first, pair.second);
      const size = scheduleSizes[tran];
      const a2 = randInt(0, size + 1);
      const b = Math.min(size, a2 + randInt(0, Math.min(6, size - a2 + 1)));
      insertStops(state, tran, a2, b, pair.deck, pair.req);
      const candidateScore = scoreRoute(state, tran);
      removeStops(state, tran, a2, b + 1);
      insertStops(state, tran, pair.first, pair.second - 1, pair.deck, pair.req);
      if (!best || candidateScore > best.score) {
        best = {
          tran,
          pair,
          insertA: a2,
          insertB: b,
          score: candidateScore
        };
      }
    }
    if (!best)
      return;
    removeStops(state, best.tran, best.pair.first, best.pair.second);
    insertStops(state, best.tran, best.insertA, best.insertB, best.pair.deck, best.pair.req);
    if (acceptAnneal(scheduleRatings[best.tran], best.score, temp)) {
      scheduleRatings[best.tran] = best.score;
    } else {
      removeStops(state, best.tran, best.insertA, best.insertB + 1);
      insertStops(state, best.tran, best.pair.first, best.pair.second - 1, best.pair.deck, best.pair.req);
    }
  }
  const sessionStartedAt = Date.now();
  let i = 0;
  const tempFloor = 3;
  const reheatTemp = 45;
  function runIterations(iterationBudget, deadline = Infinity) {
    const endIteration = Math.min(targetSteps, i + iterationBudget);
    while (i < endIteration) {
      if ((i & 2047) === 0 && Date.now() >= deadline)
        break;
      const progress = i / targetSteps;
      temp = startTemp * Math.pow(endTemp / startTemp, progress);
      const r = random();
      if (r < 0.4)
        tryAssignSampled();
      else if (r < 0.55)
        tryUnassignSampled();
      else if (r < 0.85)
        tryReinsertSampled();
      else
        tryRelocateSampled();
      i++;
    }
  }
  function runTimedChunk(budgetMs) {
    const deadline = Date.now() + budgetMs;
    while (Date.now() < deadline) {
      const progress = i / targetSteps;
      temp = Math.max(tempFloor, startTemp * Math.pow(endTemp / startTemp, Math.min(1, progress)));
      const r = random();
      if (r < 0.4)
        tryAssignSampled();
      else if (r < 0.55)
        tryUnassignSampled();
      else if (r < 0.85)
        tryReinsertSampled();
      else
        tryRelocateSampled();
      i++;
    }
  }
  function getResult() {
    return toAnnealingResult(state, warmup.elapsedMs + (Date.now() - sessionStartedAt));
  }
  return {
    iterateSteps(steps) {
      runIterations(steps);
      return getResult();
    },
    iterateForMs(budgetMs) {
      runTimedChunk(budgetMs);
      return getResult();
    },
    getResult,
    reheat(factor = 1) {
      temp = Math.max(temp, reheatTemp * factor);
      i = Math.max(0, i - Math.floor(targetSteps * 0.08 * factor));
      return getResult();
    }
  };
}

// src/wasm_ast.ts
var arithmeticOps = ["add", "sub", "mul", "div"];
var bitOps = ["and", "or", "xor", "shl", "shr"];
var remainderOps = ["mod", "umod"];
var cmpOps = ["eq", "lt", "gt"];

class ExprMethods {
}

class MutableMethods extends ExprMethods {
  set(value) {
    return this.write(lit(this.type, value));
  }
}
var nextLocalId = 0;
var inferType = (value) => typeof value === "object" && value !== null && ("type" in value) ? value.type : "i32";
var expr = (node) => {
  return Object.setPrototypeOf(node, ExprMethods.prototype);
};
var lit = (type, value) => {
  if (typeof value === "object" && value !== null) {
    if ("kind" in value)
      return value;
  }
  return expr({ kind: "const", type, value });
};
var mutable = (node, write) => Object.assign(Object.setPrototypeOf(node, MutableMethods.prototype), { write });
var isStmt = (x) => !!x && typeof x === "object" && ("kind" in x) && (x.kind === "if" ? Array.isArray(x.then) : !["const", "local.get", "bin", "call", "cast", "load", "cmp"].includes(x.kind));
var stmtList = (body2) => Array.isArray(body2) ? body2.flatMap(stmtList) : [body2];
var asStmts = (body2) => isStmt(body2) ? [body2] : Array.isArray(body2) ? stmtList(body2) : null;
var bin = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var bit = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var remainder = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var cmp = (op, left, right) => expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) });
var allocateLocal = (type) => expr({ kind: "local.get", type, local: nextLocalId++ });
var mkLocal = (type) => {
  const local = nextLocalId++;
  return mutable({ kind: "local.get", type, local }, (value) => ({ kind: "local.set", local, type, value }));
};
var mkHandle = (params, result, build) => {
  let handle;
  handle = {
    kind: "func",
    params,
    result,
    build,
    call: (...args) => {
      const callArgs = params.map((type2, i) => lit(type2, args[i]));
      if (result === "void")
        return { kind: "call.void", target: handle, args: callArgs };
      const type = typeof result === "string" ? result : result.storage === "i64" ? "i64" : "i32";
      const call = expr({ kind: "call", type, target: handle, args: callArgs });
      return typeof result === "string" ? call : readStruct(result, call);
    }
  };
  return handle;
};
var loadedType = (type) => type === "i8" || type === "u8" || type === "i16" || type === "u16" ? "i32" : type;
var storageSize = { i8: 1, u8: 1, i16: 2, u16: 2, i32: 4, f32: 4, i64: 8, f64: 8 };
var memoryValue = (array2, index, storage, stride, offset = 0) => {
  const at = lit("i32", index);
  return mutable({ kind: "load", type: loadedType(storage), array: array2, index: at, storage, stride, offset }, (value) => ({ kind: "array.store", array: array2, type: storage, index: at, stride, offset, value }));
};
var readField = (backing, field) => {
  const { bits } = field;
  if (field.storage === "i64")
    return backing;
  if (backing.type === "i64") {
    const bitOffset = BigInt(field.bitOffset), mask2 = (1n << BigInt(bits)) - 1n;
    const raw2 = i32(backing.shr(bitOffset).and(mask2));
    return field.storage.startsWith("i") && bits < 32 ? ifElse(raw2.and(2 ** (bits - 1)), raw2.sub(2 ** bits), raw2) : raw2;
  }
  if (field.storage === "i32" && field.bitOffset === 0)
    return backing;
  const mask = 2 ** bits - 1;
  const raw = backing.shr(field.bitOffset).and(mask);
  return field.storage.startsWith("i") && bits < 32 ? ifElse(raw.and(2 ** (bits - 1)), raw.sub(2 ** bits), raw) : raw;
};
var packedFieldValue = (backing, field) => {
  const value = readField(backing, field);
  if (field.storage === "i64")
    return backing;
  if (backing.type === "i64") {
    const bitOffset = BigInt(field.bitOffset), mask2 = (1n << BigInt(field.bits)) - 1n;
    const fieldMask2 = mask2 << bitOffset;
    return mutable(value, (input) => backing.set(backing.and(~fieldMask2).or(i64u(input).and(mask2).shl(bitOffset))));
  }
  if (field.storage === "i32" && field.bitOffset === 0)
    return backing;
  const mask = 2 ** field.bits - 1, fieldMask = mask << field.bitOffset;
  return mutable(value, (input) => backing.set(backing.and(~fieldMask).or(input.and(mask).shl(field.bitOffset))));
};
var readStruct = (type, packed) => Object.assign(Object.fromEntries(Object.keys(type.fields).map((name) => [name, readField(packed, type.layout[name])])), { packed });
var structValue = (type, packed) => {
  const fields = Object.fromEntries(Object.keys(type.fields).map((name) => [name, packedFieldValue(packed, type.layout[name])]));
  return Object.assign(fields, { packed, set: (value) => packed.set("packed" in value ? value.packed : packStruct(type, value)) });
};
var packStruct = (type, values) => {
  if (type.storage !== "i64")
    return Object.keys(type.fields).reduce((packed, name) => {
      const field = type.layout[name], value = values[name];
      const mask = 2 ** field.bits - 1;
      return packed.or(lit("i32", value).and(mask).shl(field.bitOffset));
    }, i32(0));
  return Object.keys(type.fields).reduce((packed, name) => {
    const field = type.layout[name], value = values[name];
    if (field.storage === "i64")
      return lit("i64", value);
    const mask = (1n << BigInt(field.bits)) - 1n;
    return packed.or(i64u(lit("i32", value)).and(mask).shl(BigInt(field.bitOffset)));
  }, i64(0n));
};
var struct = (fields) => {
  if ("set" in fields || "packed" in fields)
    throw new Error("Struct fields cannot be named set or packed");
  let used = 0;
  const layout = {};
  for (const name of Object.keys(fields)) {
    const field = fields[name];
    const storage2 = Array.isArray(field) ? field[0] : field;
    const bits = Array.isArray(field) ? field[1] : storageSize[storage2] * 8;
    if (!Number.isInteger(bits) || bits < 1 || bits > storageSize[storage2] * 8)
      throw new Error(`Invalid ${storage2} bit-field width ${bits}`);
    if (used + bits > 64)
      throw new Error(`Struct requires ${used + bits} bits; maximum is 64`);
    layout[name] = { storage: storage2, bitOffset: used, bits };
    used += bits;
  }
  const storage = used <= 8 ? "u8" : used <= 16 ? "u16" : used <= 32 ? "i32" : "i64";
  return { kind: "struct", fields, layout, storage, size: storageSize[storage] };
};
var cast = (type, value, unsigned = false) => value.type === type ? value : expr({ kind: "cast", type, inputType: value.type, unsigned, value });
var number2 = (type, value) => typeof value === (type === "i64" ? "bigint" : "number") ? expr({ kind: "const", type, value }) : cast(type, value);
function i32(value) {
  return number2("i32", value);
}
function i64(value) {
  return number2("i64", value);
}
var i64u = (value) => cast("i64", value, true);
function ifElse(cond, then, else_) {
  return isStmt(then) || Array.isArray(then) ? { kind: "if", cond, then: stmtList(then), else: else_ === undefined ? [] : stmtList(else_) } : expr({ kind: "if", type: then.type, cond, then, else: else_ });
}
var arithmetic = Object.fromEntries(arithmeticOps.map((op) => [
  op,
  (left, right) => bin(op, left, right)
]));
var bits = Object.fromEntries(bitOps.map((op) => [
  op,
  (left, right) => bit(op, left, right)
]));
var remainders = Object.fromEntries(remainderOps.map((op) => [
  op,
  (left, right) => remainder(op, left, right)
]));
var comparisons = Object.fromEntries(cmpOps.map((op) => [
  op,
  (left, right) => cmp(op, left, right)
]));
for (const op of arithmeticOps)
  Object.defineProperty(ExprMethods.prototype, op, {
    value(right) {
      return arithmetic[op](this, right);
    }
  });
for (const op of bitOps)
  Object.defineProperty(ExprMethods.prototype, op, {
    value(right) {
      return bits[op](this, right);
    }
  });
for (const op of remainderOps)
  Object.defineProperty(ExprMethods.prototype, op, {
    value(right) {
      return remainders[op](this, right);
    }
  });
for (const op of cmpOps)
  Object.defineProperty(ExprMethods.prototype, op, {
    value(right) {
      return comparisons[op](this, right);
    }
  });
for (const op of [...arithmeticOps, "and", "or", "xor"])
  Object.defineProperty(MutableMethods.prototype, `i${op}`, {
    value(right) {
      return this.set(this[op](right));
    }
  });
var { mod, umod } = remainders;
var func = (params, result, build) => mkHandle(params, result, build);
function array2(type, length) {
  if (!Number.isInteger(length) || length <= 0)
    throw new Error(`Invalid array length ${length}`);
  const storage = typeof type === "string" ? type : type.storage;
  const elementSize = typeof type === "string" ? storageSize[type] : type.size;
  let handle;
  handle = {
    kind: "array",
    type,
    length,
    elementSize,
    at: (index) => {
      const value = memoryValue(handle, index, storage, elementSize);
      return typeof type === "string" ? value : structValue(type, value);
    },
    move: (target, source, count) => ({ kind: "array.move", array: handle, target: lit("i32", target), source: lit("i32", source), count: lit("i32", count) })
  };
  return handle;
}
var mkStructLocal = (type) => structValue(type, mkLocal(type.storage === "i64" ? "i64" : "i32"));
var local = (type) => typeof type === "string" ? mkLocal(type) : mkStructLocal(type);
function ret(value) {
  if (value === undefined)
    return { kind: "return" };
  if (typeof value === "object" && "packed" in value)
    return { kind: "return", value: value.packed };
  return { kind: "return", value: lit(inferType(value), value) };
}
var trap = (message) => ({ kind: "trap", message });
var log = (message, value) => ({ kind: "log", message, value: lit("i32", value) });
// src/wasm_analyze.ts
var die = (x) => {
  throw new Error(`Unexpected value: ${String(x)}`);
};
var walk = (node, fns) => {
  if (node == null)
    return;
  if (Array.isArray(node))
    return node.forEach((x) => walk(x, fns));
  const children = (...values) => values.forEach((x) => walk(x, fns));
  switch (node.kind) {
    case "const":
    case "break":
    case "continue":
      return;
    case "local.get":
      fns.local?.(node.local, node.type);
      return;
    case "local.set":
      fns.local?.(node.local, node.type);
      return walk(node.value, fns);
    case "bin":
    case "cmp":
      return children(node.left, node.right);
    case "call":
    case "call.void":
      fns.func?.(node.target);
      return walk(node.args, fns);
    case "cast":
    case "return":
      return walk(node.value, fns);
    case "if":
      return children(node.cond, node.then, node.else);
    case "load":
      fns.array?.(node.array);
      return walk(node.index, fns);
    case "array.store":
      fns.array?.(node.array);
      return children(node.index, node.value);
    case "array.move":
      fns.array?.(node.array);
      return children(node.target, node.source, node.count);
    case "block":
      return walk(node.body, fns);
    case "loop":
      return children(node.cond, node.body);
    case "trap":
      fns.trap?.(node.message);
      return;
    case "log":
      fns.log?.(node.message);
      return walk(node.value, fns);
    case "expr":
      return walk(node.expr, fns);
    default:
      die(node);
  }
};
var arrayLayouts = (arrays) => {
  let offset = 0;
  const layouts = new Map;
  for (const arr of arrays) {
    const align = Math.min(arr.elementSize, 8);
    offset = Math.ceil(offset / align) * align;
    layouts.set(arr, { length: arr.length, offset, elementSize: arr.elementSize });
    offset += arr.length * arr.elementSize;
  }
  return { layouts, bytes: offset };
};
var buildFunc = (func2) => {
  const params = func2.params.map((type) => allocateLocal(type));
  const paramIds = params.map((p3) => p3.kind === "local.get" ? p3.local : -1);
  const result = func2.build(...params);
  const built = typeof func2.result === "object" && !asStmts(result) ? result.packed : result;
  const found = new Map;
  const functions = new Set, arrays = new Set, traps = new Set, logs = new Set;
  walk(built, {
    local: (id, type) => found.set(id, type),
    func: (f) => functions.add(f),
    array: (a2) => arrays.add(a2),
    trap: (message) => traps.add(message),
    log: (message) => logs.add(message)
  });
  paramIds.forEach((id) => found.delete(id));
  const locals = [...found.entries()];
  const localIndexes = Object.fromEntries([
    ...paramIds.map((id, i) => [id, i]),
    ...locals.map(([id], i) => [id, func2.params.length + i])
  ]);
  return { func: func2, built, locals, localIndexes, functions: [...functions], arrays: [...arrays], traps: [...traps], logs: [...logs] };
};
var buildReferencedFunctions = (roots) => {
  const built = new Map;
  const visit = (func2) => {
    if (built.has(func2))
      return;
    const entry = buildFunc(func2);
    built.set(func2, entry);
    entry.functions.forEach(visit);
  };
  roots.forEach(visit);
  return [...built.values()];
};
var analyzeModule = (mod2) => {
  const entries = Object.entries(mod2);
  const funcs = Object.fromEntries(entries.filter(([, v]) => v.kind === "func"));
  const arrays = Object.fromEntries(entries.filter(([, v]) => v.kind === "array"));
  const fEntries = Object.entries(funcs);
  const builtFuncs = buildReferencedFunctions(fEntries.map(([, func2]) => func2));
  const fix = new Map(builtFuncs.map(({ func: func2 }, i) => [func2, i]));
  const allArrays = [...new Set([...builtFuncs.flatMap((func2) => func2.arrays), ...Object.values(arrays)])];
  const { layouts, bytes } = arrayLayouts(allArrays);
  const trapMessages = [...new Set(builtFuncs.flatMap((func2) => func2.traps))];
  const logMessages = [...new Set(builtFuncs.flatMap((func2) => func2.logs))];
  return { funcs, arrays, fEntries, builtFuncs, fix, layouts, trapMessages, logMessages, pages: Math.max(1, Math.ceil(bytes / 65536)) };
};
// src/wasm_codegen.ts
var magic = [0, 97, 115, 109, 1, 0, 0, 0];
var resultType = (result) => typeof result === "object" ? result.storage === "i64" ? "i64" : "i32" : result;
var numberBase = { i32: 106, i64: 124, f32: 146, f64: 160 };
var opcode = (op, type) => {
  const arithmetic2 = ["add", "sub", "mul", "div"].indexOf(op);
  if (arithmetic2 >= 0)
    return numberBase[type] + arithmetic2;
  const integer = ["mod", "umod", "and", "or", "xor", "shl", "", "shr"].indexOf(op);
  if (integer >= 0)
    return numberBase[type] + 5 + integer;
  return { i32: 70, i64: 81, f32: 91, f64: 97 }[type] + (op === "eq" ? 0 : op === "lt" ? 2 : type[0] === "i" ? 4 : 3);
};
var codes = {
  type: { i32: 127, i64: 126, f32: 125, f64: 124 },
  load: { i32: 40, i64: 41, f32: 42, f64: 43, i8: 44, u8: 45, i16: 46, u16: 47 },
  store: { i32: 54, i64: 55, f32: 56, f64: 57, i8: 58, u8: 58, i16: 59, u16: 59 },
  align: { i8: 0, u8: 0, i16: 1, u16: 1, i32: 2, f32: 2, i64: 3, f64: 3 },
  zero: { i32: [65, 0], i64: [66, 0], f32: [67, 0, 0, 0, 0], f64: [68, 0, 0, 0, 0, 0, 0, 0, 0] }
};
var u32 = (n) => {
  if (!Number.isInteger(n) || n < 0)
    throw new Error(`Expected unsigned integer, got ${n}`);
  const out = [];
  do {
    let byte = n & 127;
    n >>>= 7;
    if (n)
      byte |= 128;
    out.push(byte);
  } while (n);
  return out;
};
var sN = (value, bits2) => {
  const out = [];
  let n = bits2 === 32 ? BigInt(value | 0) : BigInt.asIntN(64, value);
  for (;; ) {
    let byte = Number(n & 0x7fn);
    n >>= 7n;
    const done = n === 0n && (byte & 64) === 0 || n === -1n && (byte & 64) !== 0;
    if (!done)
      byte |= 128;
    out.push(byte);
    if (done)
      return out;
  }
};
var fN = (value, bytes) => {
  const out = new Uint8Array(bytes);
  const view = new DataView(out.buffer);
  bytes === 4 ? view.setFloat32(0, value, true) : view.setFloat64(0, value, true);
  return [...out];
};
var str = (s) => {
  const bytes = new TextEncoder().encode(s);
  return [...u32(bytes.length), ...bytes];
};
var section = (id, payload) => [id, ...u32(payload.length), ...payload];
var flatMap = (xs, fn) => xs.flatMap(fn);
var die2 = (x) => {
  throw new Error(`Unexpected value: ${String(x)}`);
};
var addr = (layout, index, stride = layout.elementSize, fieldOffset = 0) => index.mul(stride).add(layout.offset + fieldOffset);
var memarg = (type, offset = 0) => [...u32(codes.align[type]), ...u32(offset)];
var constI32 = (e) => e.kind === "const" ? e.value : null;
var checkArrayBounds = (layout, index) => {
  const n = constI32(index);
  if (n == null)
    return;
  if (!Number.isInteger(n) || n < 0 || n >= layout.length)
    throw new Error(`Array index ${n} out of bounds for length ${layout.length}`);
};
var checkMoveBounds = (layout, target, source, count) => {
  const values = [constI32(target), constI32(source), constI32(count)];
  if (values.some((value) => value == null))
    return;
  const [to, from, size] = values;
  if (to < 0 || from < 0 || size < 0 || to + size > layout.length || from + size > layout.length)
    throw new Error(`Array move (${to}, ${from}, ${size}) out of bounds for length ${layout.length}`);
};
var makeCompiler = (fix, lix, arrays, traps, logs) => {
  const compileExpr = (e) => {
    switch (e.kind) {
      case "const":
        if (e.type === "i32")
          return [65, ...sN(e.value, 32)];
        if (e.type === "i64")
          return [66, ...sN(e.value, 64)];
        if (e.type === "f32")
          return [67, ...fN(e.value, 4)];
        if (e.type === "f64")
          return [68, ...fN(e.value, 8)];
        return die2(e);
      case "local.get":
        return [32, ...u32(lix[e.local])];
      case "bin": {
        return [...compileExpr(e.left), ...compileExpr(e.right), opcode(e.op, e.type)];
      }
      case "cmp":
        return [...compileExpr(e.left), ...compileExpr(e.right), opcode(e.op, e.inputType)];
      case "call":
        return [...flatMap(e.args, compileExpr), 16, ...u32(fix.get(e.target) + 2)];
      case "cast": {
        const from = e.inputType;
        const to = e.type;
        let opcode2;
        if (to === "i32" && from === "i64")
          opcode2 = 167;
        if (to === "i64" && from === "i32")
          opcode2 = e.unsigned ? 173 : 172;
        if (to === "f32" && from === "i32")
          opcode2 = 178;
        if (to === "f32" && from === "i64")
          opcode2 = 180;
        if (to === "f32" && from === "f64")
          opcode2 = 182;
        if (to === "f64" && from === "i32")
          opcode2 = 183;
        if (to === "f64" && from === "i64")
          opcode2 = 185;
        if (to === "f64" && from === "f32")
          opcode2 = 187;
        if (opcode2 == null)
          throw new Error(`Unsupported cast ${from} -> ${to}`);
        return [...compileExpr(e.value), opcode2];
      }
      case "if":
        return [...compileExpr(e.cond), 4, codes.type[e.type], ...compileExpr(e.then), 5, ...compileExpr(e.else), 11];
      case "load": {
        const layout = arrays.get(e.array);
        if (!layout)
          throw new Error(`Unknown array ${e.array}`);
        checkArrayBounds(layout, e.index);
        return [...compileExpr(addr(layout, e.index, e.stride, e.offset)), codes.load[e.storage], ...memarg(e.storage)];
      }
      default:
        return die2(e);
    }
  };
  const depth = (stack, control, kind) => {
    const i = stack.findIndex((x) => x.control === control && x.kind === kind);
    if (i < 0)
      throw new Error(`Unknown ${kind} target ${control}`);
    return i;
  };
  const compileStmt = (s, stack = []) => {
    switch (s.kind) {
      case "local.set":
        return [...compileExpr(s.value), 33, ...u32(lix[s.local])];
      case "array.store": {
        const layout = arrays.get(s.array);
        if (!layout)
          throw new Error(`Unknown array ${s.array}`);
        checkArrayBounds(layout, s.index);
        return [...compileExpr(addr(layout, s.index, s.stride, s.offset)), ...compileExpr(s.value), codes.store[s.type], ...memarg(s.type)];
      }
      case "array.move": {
        const layout = arrays.get(s.array);
        if (!layout)
          throw new Error(`Unknown array ${s.array}`);
        checkMoveBounds(layout, s.target, s.source, s.count);
        return [
          ...compileExpr(addr(layout, s.target)),
          ...compileExpr(addr(layout, s.source)),
          ...compileExpr(s.count.mul(layout.elementSize)),
          252,
          10,
          0,
          0
        ];
      }
      case "if":
        return [...compileExpr(s.cond), 4, 64, ...flatMap(s.then, (x) => compileStmt(x, [{}, ...stack])), ...s.else.length ? [5, ...flatMap(s.else, (x) => compileStmt(x, [{}, ...stack]))] : [], 11];
      case "block":
        return [2, 64, ...flatMap(s.body, (x) => compileStmt(x, [{ control: s.control, kind: "break" }, ...stack])), 11];
      case "loop":
        return [2, 64, 3, 64, ...compileExpr(s.cond), 69, 13, ...u32(1), ...flatMap(s.body, (x) => compileStmt(x, [{ control: s.control, kind: "continue" }, { control: s.control, kind: "break" }, ...stack])), 12, ...u32(0), 11, 11];
      case "break":
        if (s.target == null)
          throw new Error("breakTo() used outside a block or loop");
        return [12, ...u32(depth(stack, s.target, "break"))];
      case "continue":
        if (s.target == null)
          throw new Error("continueTo() used outside a loop");
        return [12, ...u32(depth(stack, s.target, "continue"))];
      case "return":
        return [...s.value ? compileExpr(s.value) : [], 15];
      case "trap":
        return [65, ...sN(traps.get(s.message), 32), 16, 0];
      case "log":
        return [65, ...sN(logs.get(s.message), 32), ...compileExpr(s.value), 16, 1];
      case "call.void":
        return [...flatMap(s.args, compileExpr), 16, ...u32(fix.get(s.target) + 2)];
      case "expr":
        return [...compileExpr(s.expr), 26];
      default:
        return die2(s);
    }
  };
  return { expr: compileExpr, stmt: compileStmt };
};
var emitModule = ({ fEntries, builtFuncs, fix, layouts, trapMessages, logMessages, pages }) => {
  const traps = new Map(trapMessages.map((message, id) => [message, id]));
  const logs = new Map(logMessages.map((message, id) => [message, id]));
  const functionSection = builtFuncs.flatMap((_, i) => u32(i + 2));
  const exportSection = fEntries.flatMap(([name, func2]) => [...str(name), 0, ...u32(fix.get(func2) + 2)]);
  return new Uint8Array([
    ...magic,
    ...section(1, [
      ...u32(builtFuncs.length + 2),
      96,
      1,
      codes.type.i32,
      0,
      96,
      2,
      codes.type.i32,
      codes.type.i32,
      0,
      ...flatMap(builtFuncs, ({ func: func2 }) => {
        const result = resultType(func2.result);
        return [96, ...u32(func2.params.length), ...func2.params.map((t) => codes.type[t]), ...result === "void" ? [0] : [1, codes.type[result]]];
      })
    ]),
    ...section(2, [
      3,
      ...str("env"),
      ...str("trap"),
      0,
      0,
      ...str("env"),
      ...str("log"),
      0,
      1,
      ...str("env"),
      ...str("memory"),
      2,
      3,
      ...u32(pages),
      ...u32(pages)
    ]),
    ...section(3, [...u32(builtFuncs.length), ...functionSection]),
    ...section(7, [...u32(fEntries.length), ...exportSection]),
    ...section(10, [
      ...u32(builtFuncs.length),
      ...flatMap(builtFuncs, ({ func: func2, built, locals, localIndexes }) => {
        const compiler = makeCompiler(fix, localIndexes, layouts, traps, logs);
        const stmts = asStmts(built);
        const decls = [...u32(locals.length), ...flatMap(locals, ([, type]) => [...u32(1), codes.type[type]])];
        const result = resultType(func2.result);
        const code = stmts ? [...flatMap(stmts, (s) => compiler.stmt(s)), ...result === "void" ? [] : codes.zero[result]] : compiler.expr(built);
        const body2 = [...decls, ...code, 11];
        return [...u32(body2.length), ...body2];
      })
    ])
  ]);
};

// src/wasm.ts
var arrayCtors = {
  i8: Int8Array,
  u8: Uint8Array,
  i16: Int16Array,
  u16: Uint16Array,
  i32: Int32Array,
  i64: BigInt64Array,
  f32: Float32Array,
  f64: Float64Array,
  su8: Uint8Array,
  su16: Uint16Array,
  si32: Uint32Array,
  si64: BigUint64Array
};
var decodeStruct = (type, raw) => {
  const packed = BigInt.asUintN(type.size * 8, BigInt(raw));
  return Object.fromEntries(Object.entries(type.layout).map(([name, field]) => {
    const mask = (1n << BigInt(field.bits)) - 1n;
    let value = packed >> BigInt(field.bitOffset) & mask;
    if (field.storage.startsWith("i") && value & 1n << BigInt(field.bits - 1))
      value -= 1n << BigInt(field.bits);
    return [name, field.storage === "i64" ? value : Number(value)];
  }));
};
var compile = async (mod2) => {
  const analysis = analyzeModule(mod2);
  const memory = new WebAssembly.Memory({
    initial: analysis.pages,
    maximum: analysis.pages,
    shared: true
  });
  const compiled = await WebAssembly.compile(emitModule(analysis).buffer);
  const trap2 = (id) => {
    throw new Error(analysis.trapMessages[id] ?? `Unknown WASM trap ${id}`);
  };
  const log2 = (id, value) => console.log(analysis.logMessages[id] ?? `WASM log ${id}`, value);
  const instance = await WebAssembly.instantiate(compiled, { env: { memory, trap: trap2, log: log2 } });
  const funcEntries = Object.entries(analysis.funcs);
  const jsFuncs = {}, resultStructs = {};
  for (const [name, func2] of funcEntries) {
    const wasmFunc = instance.exports[name];
    jsFuncs[name] = wasmFunc;
    if (typeof func2.result === "object") {
      resultStructs[name] = func2.result;
      jsFuncs[name] = (...args) => decodeStruct(func2.result, wasmFunc(...args));
    }
  }
  const jsArrays = Object.entries(analysis.arrays).map(([name, arr]) => {
    const layout = analysis.layouts.get(arr);
    const key = typeof arr.type === "string" ? arr.type : `s${arr.type.storage}`;
    const Ctor = arrayCtors[key];
    return [name, new Ctor(memory.buffer, layout.offset, arr.length)];
  });
  return Object.assign(jsFuncs, Object.fromEntries(jsArrays), {
    mod: compiled,
    memory,
    resultStructs,
    trapMessages: analysis.trapMessages,
    logMessages: analysis.logMessages
  });
};

// src/planners/annealing_wasm.ts
var NWORKERS = 4;
var RANDSTRIDE = 16;
async function annealingWasm(planner) {
  const TSIZE = Math.floor(planner.NREQS / planner.NTRANS * 2.5 * 2 + 10);
  const STOP = struct({
    req_id: ["u16", 10],
    is_load: ["u8", 1],
    deck: ["u8", 1]
  });
  const REQ = struct({
    start: "u16",
    end: "u16",
    value: "u16",
    deadline: "u16"
  });
  const randState = array2("i32", NWORKERS * RANDSTRIDE);
  const dists = array2("i32", planner.RSIZE);
  const requests = array2(REQ, planner.NREQS);
  const assigned = array2("u8", planner.NREQS);
  const schedule = array2(STOP, planner.NTRANS * TSIZE);
  const sched_size = array2("i16", planner.NTRANS);
  const tran_positions = array2("i16", planner.NTRANS);
  const randNext = func(["i32"], "i32", (gid) => {
    const value = local("i32");
    return [
      value.set(randState.at(gid.mul(RANDSTRIDE))),
      value.set(value.xor(value.shl(13))),
      value.set(value.xor(value.shr(17))),
      value.set(value.xor(value.shl(5))),
      randState.at(gid.mul(RANDSTRIDE)).set(value),
      ret(value)
    ];
  });
  const randint = func(["i32", "i32"], "i32", (gid, max) => umod(randNext.call(gid), max));
  let DEBUG = true;
  function debug(tag, value) {
    if (!DEBUG)
      return [];
    return [
      log(tag, value)
    ];
  }
  const boundsCheck = (array3, index, count = 1) => {
    const i = lit("i32", index), n = lit("i32", count);
    return ifElse(i.lt(0).or(n.lt(0)).or(n.gt(array3.length)).or(i.gt(i32(array3.length).sub(n))), trap("array bounds exceeded"));
  };
  const tryAssign = func([], "void", () => {
    const tran = local("i32");
    const req_id = local("i32");
    const A = local("i32");
    const B = local("i32");
    const tmp = local("i32");
    const tsize = local("i32");
    const toffset = local("i32");
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    return [
      tran.set(randint.call(0, planner.NTRANS)),
      req_id.set(randint.call(0, planner.NREQS)),
      ifElse(assigned.at(req_id).eq(1), ret(), assigned.at(req_id).set(1)),
      toffset.set(tran.mul(TSIZE)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.gt(TSIZE - 2), trap("schedule capacity exceeded")),
      A.set(randint.call(0, tsize.add(1))),
      B.set(randint.call(0, tsize.add(1))),
      ifElse(A.gt(B), [tmp.set(A), A.set(B), B.set(tmp)]),
      schedView.move(B.add(2), B, tsize.sub(B)),
      schedView.move(A.add(1), A, B.sub(A)),
      tmp.set(randint.call(0, 2)),
      schedView.at(A).set({ req_id, is_load: 1, deck: tmp }),
      schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp }),
      sched_size.at(tran).set(tsize.add(2))
    ];
  });
  const addRequest = func(["i32", "i32", "i32", "i32", "i32"], "void", (reqn, start, end, value, deadline) => requests.at(reqn).set({ start, end, value, deadline }));
  const search = func([], "void", () => [
    debug("debugger on.", 0),
    tryAssign.call(),
    tryAssign.call(),
    tryAssign.call()
  ]);
  const getStop = func(["i32", "i32"], STOP, (tran, index) => schedule.at(tran.mul(TSIZE).add(index)));
  const wasm = await compile({
    addRequest,
    assigned,
    dists,
    getStop,
    randState,
    schedule,
    search,
    sched_size,
    tran_positions
  });
  wasm.dists.set(planner.roadmap.CostMatrix);
  wasm.randState.set(Array.from({ length: NWORKERS * 2 }, (_, i) => i + 1));
  wasm.tran_positions.set(planner.startpositions);
  planner.requests.forEach((request, i) => wasm.addRequest(i, request.startPoint, request.endPoint, request.value_eur, request.deadline_h));
  const startedAt = performance.now();
  wasm.search();
  const elapsedMs = performance.now() - startedAt;
  const resultSchedule = new Uint32Array(planner.NTRANS * TSIZE);
  for (let tran = 0;tran < planner.NTRANS; tran++) {
    for (let i = 0;i < wasm.sched_size[tran]; i++) {
      const stop = wasm.getStop(tran, i);
      resultSchedule[tran * TSIZE + i] = stop.is_load | stop.deck << 1 | stop.req_id << 2;
    }
  }
  const unassigned = new Int8Array(planner.NREQS);
  for (let i = 0;i < unassigned.length; i++)
    unassigned[i] = wasm.assigned[i] ? 0 : 1;
  const scheduleRatings = new Int32Array(planner.NTRANS);
  return {
    schedule: resultSchedule,
    scheduleSizes: new Uint16Array(wasm.sched_size),
    tranStart: new Uint16Array(planner.startpositions),
    TSIZE,
    scheduleRatings,
    unassigned,
    elapsedMs,
    totalScore: 0
  };
}

// src/planners/annealing.ts
var ACTIVE_SOLVER_NAME = "improved";
var KM_COST2 = 0.5;
var AVG_SPEED_KMH2 = 60;
var REORG_COST_EUR2 = 100;
var annealer = null;
var annealingSession = null;
var annealingTimer = null;
var liveRender = null;
function plannerView(mod2) {
  const outerBorder = "1px solid " + color.gray;
  const innerBorder = "1px solid " + color.lightgray;
  const cellPadding = ".35em .5em";
  const scheduleCellMinHeight = "2.1em";
  if (annealingSession == null) {
    annealingSession = createImprovedAnnealingSession(mod2, 1900000);
    annealer = annealingSession.iterateForMs(10);
  } else if (annealer == null) {
    annealer = annealingSession.getResult();
  }
  function itemButton(item, load) {
    const req = mod2.requests[item];
    const sp = span(item.toString().padStart(3, " "), style({
      cursor: "pointer",
      border: "2px solid transparent",
      borderRadius: ".2em",
      whiteSpace: "pre",
      fontFamily: "monospace"
    }), function() {
      popup(p("item ", item), table(tr(cell("status"), cell(load ? "load" : load === false ? "unload" : "unassigned")), tr(cell("value"), cell(req.value_eur + "€")), tr(cell("dist"), cell(mod2.roadmap.getCostN(req.startPoint, req.endPoint) + "km")), tr(cell("deadline"), cell(req.deadline_h.toFixed(2) + "h"))));
    });
    let points = [
      { number: req.startPoint, logo: "\uD83D\uDCE6" },
      { number: req.endPoint, logo: "\uD83C\uDFE0" }
    ];
    if (load === true)
      points = [points[0]];
    if (load === false)
      points = [points[1]];
    sp.onmouseenter = () => {
      sp.style.borderColor = color.green;
      hightLights.set([{ points }]);
    };
    sp.onmouseleave = () => {
      sp.style.borderColor = "transparent";
    };
    return sp;
  }
  const cell = (...x) => td(style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), ...x);
  const controls = div(style({ display: "flex", gap: ".5em", alignItems: "center", flexWrap: "wrap" }));
  const scoreLine = p();
  const timeLine = p();
  const solverLine = p("solver: ", ACTIVE_SOLVER_NAME);
  const unassignedLine = p();
  const detailWrap = div();
  const tableWrap = div(style({
    overflowX: "auto",
    overflowY: "hidden",
    maxWidth: "100%"
  }));
  const runButton = button("start");
  const heatButton = button("heat up");
  let renderCounter = 0;
  function stopSearch() {
    if (annealingTimer != null) {
      clearInterval(annealingTimer);
      annealingTimer = null;
    }
    runButton.textContent = "start";
  }
  function renderTable() {
    const tab = table(style({
      borderCollapse: "collapse",
      width: "100%"
    }), tr(th("transporter", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("value", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("steps", style({ border: outerBorder, padding: cellPadding, textAlign: "left" }))), mod2.startpositions.map((start, tran) => tr(td(tran, style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), function() {
      popup(p("transporter: ", tran), p("start: ", start), p("score: ", annealer?.scheduleRatings[tran]), p("steps: ", annealer?.scheduleSizes[tran]));
    }, {
      onmouseenter: () => {
        hightLights.set([{ points: [{ number: start, logo: "\uD83D\uDE9B" }] }]);
      },
      onmouseleave: () => {
        hightLights.set([]);
      }
    }), td(annealer?.scheduleRatings[tran], style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })), td(table(style({
      borderCollapse: "collapse"
    }), [0, 1].map((deck) => tr(Array.from({ length: annealer.scheduleSizes[tran] }, (_, i) => {
      const step = annealer?.schedule[tran * annealer.TSIZE + i];
      const load = isLoad(step);
      return td(getDeck(step) === deck ? itemButton(getReq(step), !!load) : "", style({
        color: load ? color.blue : color.green,
        border: innerBorder,
        padding: ".2em .3em",
        minWidth: "2.6em",
        height: scheduleCellMinHeight,
        boxSizing: "border-box"
      }));
    })))), style({
      border: outerBorder,
      padding: ".25em",
      verticalAlign: "top"
    })))));
    tableWrap.replaceChildren(tab);
  }
  function renderStatus() {
    scoreLine.textContent = `score: ${annealer?.totalScore ?? 0}`;
    timeLine.textContent = `search time: ${(annealer.elapsedMs / 1000).toFixed(2)} s`;
    unassignedLine.replaceChildren("unassigned: ", ...Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]));
    detailWrap.replaceChildren(div(p("details"), table(style({
      borderCollapse: "collapse"
    }), tr(cell("unassigned requests"), cell(Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]))), tr(cell("search time"), cell(`${annealer?.elapsedMs ?? 0}ms`)), tr(cell("score"), cell(annealer?.totalScore ?? 0)), tr(cell("transporter count"), cell(mod2.NTRANS)), tr(cell("request count"), cell(mod2.NREQS)), tr(cell("cost per km"), cell(`${KM_COST2}€`)), tr(cell("average speed"), cell(`${AVG_SPEED_KMH2}km/h`)), tr(cell("reorganization cost"), cell(`${REORG_COST_EUR2}€`)))));
  }
  function render(forceTable = false) {
    renderStatus();
    if (forceTable || renderCounter++ % 4 === 0)
      renderTable();
  }
  runButton.onclick = () => {
    if (annealingTimer != null) {
      stopSearch();
      return;
    }
    runButton.textContent = "stop";
    annealingTimer = window.setInterval(() => {
      if (!annealingSession)
        return;
      annealer = annealingSession.iterateForMs(120);
      render();
    }, 150);
  };
  heatButton.onclick = () => {
    if (!annealingSession)
      return;
    annealer = annealingSession.reheat();
    render(true);
  };
  liveRender = () => render(true);
  render(true);
  controls.replaceChildren(runButton, heatButton);
  return div(style({
    padding: "1em",
    overflowY: "auto",
    overflowX: "hidden",
    height: "100%",
    boxSizing: "border-box",
    minHeight: "0"
  }), controls, solverLine, scoreLine, timeLine, tableWrap, detailWrap, unassignedLine);
}

// src/view/wasmview.ts
var result = null;
async function setUpWasm(planner) {
  result = await annealingWasm(planner);
}
function wasmView(_planner) {
  if (result === null)
    throw new Error("WASM planner is not set up");
  return div(style({ padding: "1em" }), h2("WASM planner"), p("assigned: ", result.unassigned.length - result.unassigned.reduce((sum, value) => sum + value, 0)), p("schedule steps: ", result.scheduleSizes.reduce((sum, value) => sum + value, 0)), p("search time: ", result.elapsedMs.toFixed(2), "ms"));
}

// src/view/main.ts
var LKW_COUNT = mkStored("LKW_COUNT", number, 5);
var REQUEST_COUNT = mkStored("REQUEST_COUNT", number, 20);
body.style.margin = "0";
var header = h1("route planner", style({ background: color.blue, color: color.background, margin: "0", padding: ".6em" }));
var contentSpace = div(style({
  display: "flex",
  flexDirection: "row",
  width: "100%",
  height: "calc(100% - 2.5em)",
  minWidth: "0"
}));
var page = div(style({ display: "flex", flexDirection: "column", height: "100%" }), header, contentSpace);
body.replaceChildren(page);
setRandSeed(24);
var module = randomModule();
var hightLights = mkWritable([]);
await setUpWasm(module);
function mkWindow(tab = 0) {
  let tabFields = [
    ["map", mapView(module)],
    ["planner", plannerView(module)],
    ["wasm", wasmView(module)]
  ];
  const el = div(style({
    flex: "1 1 0",
    minWidth: "0",
    height: "calc(100vh - 1em)",
    border: "1px solid " + color.gray,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  }));
  function openTab(tab2) {
    const tabs = p(style({
      margin: "0",
      padding: ".4em",
      flex: "0 0 auto"
    }), tabFields.map(([n, e]) => span(n, () => openTab(n), style({
      padding: ".3em",
      margin: ".3em",
      cursor: "pointer",
      border: "1px solid " + (n == tab2 ? color.color : color.gray),
      color: n == tab2 ? color.color : color.gray
    }))));
    const content = div(style({
      flex: "1 1 auto",
      minHeight: "0",
      minWidth: "0"
    }), tabFields.find(([n]) => n == tab2)[1]);
    el.replaceChildren(tabs, content);
  }
  openTab(tabFields[tab][0]);
  return el;
}
contentSpace.replaceChildren(mkWindow(2), mkWindow());
export {
  module,
  hightLights,
  LKW_COUNT
};

//# debugId=8D6E45CDD9790D8764756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc21fYXN0LnRzIiwgInNyYy93YXNtX2FuYWx5emUudHMiLCAic3JjL3dhc21fY29kZWdlbi50cyIsICJzcmMvd2FzbS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvdmlldy93YXNtdmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5jb25zdCBJTkYgPSAxIDw8IDMwO1xuXG5leHBvcnQgdHlwZSBQYWlySW5mbyA9IHtcbiAgcmVxOiBudW1iZXI7XG4gIGZpcnN0OiBudW1iZXI7XG4gIHNlY29uZDogbnVtYmVyO1xuICBkZWNrOiAwIHwgMTtcbn07XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1N0YXRlID0ge1xuICBtb2Q6IE1vZHVsZTtcbiAgTlJFUVM6IG51bWJlcjtcbiAgTlRSQU5TOiBudW1iZXI7XG4gIFRTSVpFOiBudW1iZXI7XG4gIHJlcVBpY2t1cExvY2F0aW9uczogVWludDE2QXJyYXk7XG4gIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVhZGxpbmVzOiBVaW50MzJBcnJheTtcbiAgcmVxVmFsdWVzOiBVaW50MzJBcnJheTtcbiAgdW5hc3NpZ25lZDogSW50OEFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2FkKHg6IG51bWJlcikge1xuICByZXR1cm4geCAmIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNrKHg6IG51bWJlcikge1xuICByZXR1cm4gKCh4ICYgMikgPj4gMSkgYXMgMCB8IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXEoeDogbnVtYmVyKSB7XG4gIHJldHVybiAoeCAmIDB4ZmZmZikgPj4gMjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvcyh4OiBudW1iZXIpIHtcbiAgcmV0dXJuIHggPj4gMTY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QW5uZWFsaW5nU3RhdGUobW9kOiBNb2R1bGUsIHNlZWQ/OiBBbm5lYWxpbmdSZXN1bHQpOiBBbm5lYWxpbmdTdGF0ZSB7XG4gIGNvbnN0IHsgTlJFUVMsIHJlcXVlc3RzLCBzdGFydHBvc2l0aW9ucywgTlRSQU5TIH0gPSBtb2Q7XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihOUkVRUyAqIDIuNSArIDEwKTtcblxuICByZXR1cm4ge1xuICAgIG1vZCxcbiAgICBOUkVRUyxcbiAgICBOVFJBTlMsXG4gICAgVFNJWkUsXG4gICAgcmVxUGlja3VwTG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLnN0YXJ0UG9pbnQpKSxcbiAgICByZXFEZWxpdmVyeUxvY2F0aW9uczogbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5lbmRQb2ludCkpLFxuICAgIHJlcURlYWRsaW5lczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5kZWFkbGluZV9oICogQVZHX1NQRUVEX0tNSCkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci52YWx1ZV9ldXIgLyBLTV9DT1NUKSksXG4gICAgdW5hc3NpZ25lZDogc2VlZCA/IG5ldyBJbnQ4QXJyYXkoc2VlZC51bmFzc2lnbmVkKSA6IG5ldyBJbnQ4QXJyYXkocmVxdWVzdHMubWFwKCgpID0+IDEpKSxcbiAgICB0cmFuU3RhcnQ6IG5ldyBVaW50MTZBcnJheShzdGFydHBvc2l0aW9ucyksXG4gICAgc2NoZWR1bGU6IHNlZWQgPyBuZXcgVWludDMyQXJyYXkoc2VlZC5zY2hlZHVsZSkgOiBuZXcgVWludDMyQXJyYXkoVFNJWkUgKiBOVFJBTlMpLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHNlZWQgPyBuZXcgVWludDE2QXJyYXkoc2VlZC5zY2hlZHVsZVNpemVzKSA6IG5ldyBVaW50MTZBcnJheShOVFJBTlMpLFxuICAgIHNjaGVkdWxlUmF0aW5nczogc2VlZCA/IG5ldyBJbnQzMkFycmF5KHNlZWQuc2NoZWR1bGVSYXRpbmdzKSA6IG5ldyBJbnQzMkFycmF5KE5UUkFOUyksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZU9mZnNldChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICByZXR1cm4gdHJhbiAqIHN0YXRlLlRTSVpFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBpZHg6IG51bWJlciwgaXNMb2FkQml0OiAxIHwgMCwgZGVjazogMCB8IDEsIHJlcTogbnVtYmVyLCBwb3M6IG51bWJlcikge1xuICBzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdID0gKGlzTG9hZEJpdCA8PCAwKSB8IChkZWNrIDw8IDEpIHwgKHJlcSA8PCAyKSB8IChwb3MgPDwgMTYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVSb3V0ZShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICBsZXQgcmV3YXJkID0gMDtcbiAgbGV0IGR1cmF0aW9uID0gMDtcbiAgY29uc3QgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV07XG4gIGxldCBwb3MgPSBzdGF0ZS50cmFuU3RhcnRbdHJhbl0hO1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKTtcbiAgICBjb25zdCBuZXh0UG9zID0gZ2V0UG9zKHN0ZXApO1xuICAgIGR1cmF0aW9uICs9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgZHVyYXRpb24gKz0gKGRlY2subGVuZ3RoIC0gaWR4IC0gMSkgKiBSRU9SR19DT1NUX0VVUiAvIEtNX0NPU1Q7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGR1cmF0aW9uIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gZHVyYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoQWxsUmF0aW5ncyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUpIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heExvc3MgPSAyNDApIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGlmIChzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dICE9PSAwKSBjb250aW51ZTtcblxuICAgIGxldCBiZXN0UmVxID0gLTE7XG4gICAgbGV0IGJlc3RTY29yZSA9IC1JTkY7XG5cbiAgICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICAgIGlmICghc3RhdGUudW5hc3NpZ25lZFtyZXFdKSBjb250aW51ZTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCAwLCAwLCAwLCByZXEpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCAwLCAxKTtcbiAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdFJlcSA9IHJlcTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYmVzdFJlcSA9PT0gLTEgfHwgYmVzdFNjb3JlIDwgLW1heExvc3MpIGNvbnRpbnVlO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIGJlc3RSZXEpO1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IGJlc3RTY29yZTtcbiAgICBzdGF0ZS51bmFzc2lnbmVkW2Jlc3RSZXFdID0gMDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0U3RvcHMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBlbmQgKyAyLCBvZmZzZXQgKyBlbmQsIG9mZnNldCArIHNpemUpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIGVuZCArIDEpO1xuICBzZXRSZXEoc3RhdGUsIHRyYW4sIHN0YXJ0LCAxLCBkZWNrLCByZXEsIHN0YXRlLnJlcVBpY2t1cExvY2F0aW9uc1tyZXFdISk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgZW5kICsgMSwgMCwgZGVjaywgcmVxLCBzdGF0ZS5yZXFEZWxpdmVyeUxvY2F0aW9uc1tyZXFdISk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBlbmQpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCAtIDEsIG9mZnNldCArIGVuZCArIDEsIG9mZnNldCArIHNpemUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhaXJJblJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCByZXE6IG51bWJlcik6IFBhaXJJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBsZXQgZmlyc3QgPSAtMTtcbiAgbGV0IHNlY29uZCA9IC0xO1xuICBsZXQgZGVjazogMCB8IDEgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBpZiAoZ2V0UmVxKHN0ZXApICE9PSByZXEpIGNvbnRpbnVlO1xuICAgIGlmIChmaXJzdCA9PT0gLTEpIHtcbiAgICAgIGZpcnN0ID0gaTtcbiAgICAgIGRlY2sgPSBnZXREZWNrKHN0ZXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWNvbmQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZpcnN0ID09PSAtMSB8fCBzZWNvbmQgPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgcmVxLCBmaXJzdCwgc2Vjb25kLCBkZWNrIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVVbmFzc2lnbmVkUmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IG51bWJlciB8IG51bGwge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1heEF0dGVtcHRzOyBpKyspIHtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIHN0YXRlLk5SRVFTKTtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgZm9yIChsZXQgcmVxID0gMDsgcmVxIDwgc3RhdGUuTlJFUVM7IHJlcSsrKSB7XG4gICAgaWYgKHN0YXRlLnVuYXNzaWduZWRbcmVxXSkgcmV0dXJuIHJlcTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbyB9IHwgbnVsbCB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgbWF4QXR0ZW1wdHM7IGF0dGVtcHQrKykge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIHN0YXRlLk5UUkFOUyk7XG4gICAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGlmIChzaXplIDwgMikgY29udGludWU7XG4gICAgY29uc3QgaWR4ID0gcmFuZEludCgwLCBzaXplKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pICsgaWR4XSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pXSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0QW5uZWFsKHByZXZTY29yZTogbnVtYmVyLCBuZXh0U2NvcmU6IG51bWJlciwgdGVtcDogbnVtYmVyKSB7XG4gIGlmIChuZXh0U2NvcmUgPj0gcHJldlNjb3JlKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgZGVsdGEgPSBwcmV2U2NvcmUgLSBuZXh0U2NvcmU7XG4gIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KHRlbXAsIDAuMDAxKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIGVsYXBzZWRNczogbnVtYmVyKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogc3RhdGUuc2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogc3RhdGUuc2NoZWR1bGVTaXplcyxcbiAgICB0cmFuU3RhcnQ6IHN0YXRlLnRyYW5TdGFydCxcbiAgICBUU0laRTogc3RhdGUuVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MsXG4gICAgdW5hc3NpZ25lZDogc3RhdGUudW5hc3NpZ25lZCxcbiAgICBlbGFwc2VkTXMsXG4gICAgdG90YWxTY29yZTogc3RhdGUuc2NoZWR1bGVSYXRpbmdzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApLFxuICB9O1xufVxuIiwKICAgICJpbXBvcnQgeyByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGdldERlY2ssXG4gIGdldFJlcSxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1Jlc3VsdCA9IHtcbiAgc2NoZWR1bGU6IFVpbnQzMkFycmF5O1xuICBzY2hlZHVsZVNpemVzOiBVaW50MTZBcnJheTtcbiAgdHJhblN0YXJ0OiBVaW50MTZBcnJheTtcbiAgVFNJWkU6IG51bWJlcjtcbiAgc2NoZWR1bGVSYXRpbmdzOiBJbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIGVsYXBzZWRNczogbnVtYmVyO1xuICB0b3RhbFNjb3JlOiBudW1iZXI7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYmFzZWxpbmVBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMV82MDBfMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kKTtcbiAgY29uc3QgeyBOUkVRUywgTlRSQU5TLCBUU0laRSwgc2NoZWR1bGUsIHNjaGVkdWxlU2l6ZXMsIHNjaGVkdWxlUmF0aW5ncywgdW5hc3NpZ25lZCB9ID0gc3RhdGU7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEwMDtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2UmF0aW5nOiBudW1iZXIsIG5leHRSYXRpbmc6IG51bWJlcikge1xuICAgIGlmIChuZXh0UmF0aW5nID49IHByZXZSYXRpbmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0UmF0aW5nIC0gcHJldlJhdGluZykgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2NoZWRTaXplICsgMSk7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKHNjaGVkU2l6ZSwgcmFuZEludCgwLCA0KSArIGEpO1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpO1xuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAwLjUgPyAxIDogMCwgcmVxKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICBjb25zdCBzY2hlZFNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2NoZWRTaXplIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRTaXplKTtcbiAgICBjb25zdCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSE7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKGl0ZW0pO1xuXG4gICAgY29uc3QgYWI6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZFNpemU7IGkrKykge1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09PSByZXEpIGFiLnB1c2goaSk7XG4gICAgfVxuICAgIGlmIChhYi5sZW5ndGggIT09IDIpIHJldHVybjtcblxuICAgIGNvbnN0IFthLCBiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl07XG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIpO1xuICAgIGNvbnN0IG5ld1JhdGluZyA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgIGlmIChhY2NlcHQoc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgbmV3UmF0aW5nKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gbmV3UmF0aW5nO1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgLSAxLCBnZXREZWNrKGl0ZW0pIGFzIDAgfCAxLCByZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG4gICAgdGVtcCA9ICgxIC0gaSAvIHN0ZXBzKSAqIHN0YXJ0VGVtcDtcbiAgICB0cnlVbmFzc2lnbigpO1xuICAgIHRyeUFzc2lnbigpO1xuICB9XG5cbiAgcmV0dXJuIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlLCBEYXRlLm5vdygpIC0gc3RhcnRlZEF0KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZyB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHtcbiAgYWNjZXB0QW5uZWFsLFxuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgdHlwZSBQYWlySW5mbyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNhbXBsZUFzc2lnbmVkUGFpcixcbiAgc2FtcGxlVW5hc3NpZ25lZFJlcSxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBJbXByb3ZlZE9wdGlvbnMgPVxuICB8IHsgc3RlcHM6IG51bWJlcjsgYnVkZ2V0TXM/OiBuZXZlciB9XG4gIHwgeyBidWRnZXRNczogbnVtYmVyOyBzdGVwcz86IG5ldmVyIH07XG5cbmV4cG9ydCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiA9IHtcbiAgaXRlcmF0ZVN0ZXBzOiAoc3RlcHM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBpdGVyYXRlRm9yTXM6IChidWRnZXRNczogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG4gIGdldFJlc3VsdDogKCkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICByZWhlYXQ6IChmYWN0b3I/OiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kOiBNb2R1bGUsIHRhcmdldFN0ZXBzID0gMTUwMDAwKTogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHtcbiAgY29uc3Qgd2FybXVwU3RlcHMgPSBNYXRoLm1pbihNYXRoLm1heCgyMDAwMCwgTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMikpLCA1MDAwMCk7XG4gIGNvbnN0IHdhcm11cCA9IGJhc2VsaW5lQW5uZWFsaW5nKG1vZCwgd2FybXVwU3RlcHMpO1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QsIHdhcm11cCk7XG4gIGNvbnN0IHsgTlRSQU5TLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuICBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZSk7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEyMDtcbiAgbGV0IGVuZFRlbXAgPSAwLjU7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyByZXE6IG51bWJlcjsgYTogbnVtYmVyOyBiOiBudW1iZXI7IGRlY2s6IDAgfCAxOyBzY29yZTogbnVtYmVyIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IHJlcSA9IHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGUpO1xuICAgICAgaWYgKHJlcSA9PSBudWxsKSBicmVhaztcblxuICAgICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBjb25zdCBkZWNrID0gKHJhbmRvbSgpID4gMC41ID8gMSA6IDApIGFzIDAgfCAxO1xuXG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgZGVjaywgcmVxKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHJlcSwgYSwgYiwgZGVjaywgc2NvcmU6IG5ld1Njb3JlIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LmEsIGJlc3QuYiwgYmVzdC5kZWNrLCBiZXN0LnJlcSk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ25TYW1wbGVkKHNhbXBsZXMgPSA2KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7IHRyYW46IG51bWJlcjsgcGFpcjogUGFpckluZm87IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IG5ld1Njb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0geyB0cmFuLCBwYWlyLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucGFpci5yZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlbG9jYXRlU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgc3JjOiBudW1iZXI7XG4gICAgICBkc3Q6IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICAgIG9sZFNjb3JlOiBudW1iZXI7XG4gICAgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcblxuICAgICAgY29uc3QgeyB0cmFuOiBzcmMsIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIGNvbnN0IGRzdCA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IG9sZFNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY2hlZHVsZVJhdGluZ3Nbc3JjXSFcbiAgICAgICAgOiBzY2hlZHVsZVJhdGluZ3Nbc3JjXSEgKyBzY2hlZHVsZVJhdGluZ3NbZHN0XSE7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3QgZHN0U2l6ZSA9IHNjaGVkdWxlU2l6ZXNbZHN0XSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBkc3RTaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oZHN0U2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgZHN0U2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGRzdCwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY29yZVJvdXRlKHN0YXRlLCBzcmMpXG4gICAgICAgIDogc2NvcmVSb3V0ZShzdGF0ZSwgc3JjKSArIHNjb3JlUm91dGUoc3RhdGUsIGRzdCk7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBkc3QsIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBjYW5kaWRhdGVTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICBzcmMsXG4gICAgICAgICAgZHN0LFxuICAgICAgICAgIHBhaXIsXG4gICAgICAgICAgaW5zZXJ0QTogYSxcbiAgICAgICAgICBpbnNlcnRCOiBiLFxuICAgICAgICAgIHNjb3JlOiBjYW5kaWRhdGVTY29yZSxcbiAgICAgICAgICBvbGRTY29yZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKGJlc3Qub2xkU2NvcmUsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBpZiAoYmVzdC5zcmMgPT09IGJlc3QuZHN0KSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5zcmNdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5zcmMpO1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5kc3RdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5kc3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5zcmMsIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlSZWluc2VydFNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHtcbiAgICAgIHRyYW46IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW4sIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG5cbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHRyYW4sXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuXG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2Vzc2lvblN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGxldCBpID0gMDtcbiAgY29uc3QgdGVtcEZsb29yID0gMztcbiAgY29uc3QgcmVoZWF0VGVtcCA9IDQ1O1xuXG4gIGZ1bmN0aW9uIHJ1bkl0ZXJhdGlvbnMoaXRlcmF0aW9uQnVkZ2V0OiBudW1iZXIsIGRlYWRsaW5lID0gSW5maW5pdHkpIHtcbiAgICBjb25zdCBlbmRJdGVyYXRpb24gPSBNYXRoLm1pbih0YXJnZXRTdGVwcywgaSArIGl0ZXJhdGlvbkJ1ZGdldCk7XG4gICAgd2hpbGUgKGkgPCBlbmRJdGVyYXRpb24pIHtcbiAgICAgIGlmICgoaSAmIDIwNDcpID09PSAwICYmIERhdGUubm93KCkgPj0gZGVhZGxpbmUpIGJyZWFrO1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBpIC8gdGFyZ2V0U3RlcHM7XG4gICAgICB0ZW1wID0gc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgcHJvZ3Jlc3MpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBydW5UaW1lZENodW5rKGJ1ZGdldE1zOiBudW1iZXIpIHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBidWRnZXRNcztcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXBGbG9vciwgc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKSk7XG5cbiAgICAgIGNvbnN0IHIgPSByYW5kb20oKTtcbiAgICAgIGlmIChyIDwgMC40KSB0cnlBc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC41NSkgdHJ5VW5hc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC44NSkgdHJ5UmVpbnNlcnRTYW1wbGVkKCk7XG4gICAgICBlbHNlIHRyeVJlbG9jYXRlU2FtcGxlZCgpO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgd2FybXVwLmVsYXBzZWRNcyArIChEYXRlLm5vdygpIC0gc2Vzc2lvblN0YXJ0ZWRBdCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpdGVyYXRlU3RlcHMoc3RlcHMpIHtcbiAgICAgIHJ1bkl0ZXJhdGlvbnMoc3RlcHMpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gICAgaXRlcmF0ZUZvck1zKGJ1ZGdldE1zKSB7XG4gICAgICBydW5UaW1lZENodW5rKGJ1ZGdldE1zKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCxcbiAgICByZWhlYXQoZmFjdG9yID0gMSkge1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXAsIHJlaGVhdFRlbXAgKiBmYWN0b3IpO1xuICAgICAgLy8gUHVsbCB0aGUgc2VhcmNoIHNsaWdodGx5IGJhY2sgZnJvbSB0aGUgY29sZCBlbmQgb2YgdGhlIHNjaGVkdWxlLlxuICAgICAgaSA9IE1hdGgubWF4KDAsIGkgLSBNYXRoLmZsb29yKHRhcmdldFN0ZXBzICogMC4wOCAqIGZhY3RvcikpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2Q6IE1vZHVsZSwgb3B0aW9uczogSW1wcm92ZWRPcHRpb25zKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3QgdGFyZ2V0U3RlcHMgPSBcInN0ZXBzXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RlcHMgOiBNYXRoLm1heCgxNTAwMDAsIE1hdGguZmxvb3Iob3B0aW9ucy5idWRnZXRNcyAqIDE5MCkpO1xuICBjb25zdCBzZXNzaW9uID0gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZCwgdGFyZ2V0U3RlcHMpO1xuICBpZiAoXCJzdGVwc1wiIGluIG9wdGlvbnMpIHJldHVybiBzZXNzaW9uLml0ZXJhdGVTdGVwcyhvcHRpb25zLnN0ZXBzKTtcbiAgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZUZvck1zKG9wdGlvbnMuYnVkZ2V0TXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wcm92ZWRBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMTUwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgc3RlcHMgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ1RpbWVkKG1vZDogTW9kdWxlLCBidWRnZXRNcyA9IDEwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgYnVkZ2V0TXMgfSk7XG59XG4iLAogICAgIlxuZXhwb3J0IHR5cGUgTnVtVHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCJcbmV4cG9ydCB0eXBlIFJlc3VsdFR5cGUgPSBOdW1UeXBlIHwgXCJ2b2lkXCIgfCBTdHJ1Y3RUeXBlPGFueT5cbmV4cG9ydCB0eXBlIEludFR5cGUgPSBcImkzMlwiIHwgXCJpNjRcIlxuZXhwb3J0IHR5cGUgUGFja2VkVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiXG5leHBvcnQgdHlwZSBTdG9yYWdlVHlwZSA9IE51bVR5cGUgfCBQYWNrZWRUeXBlXG5leHBvcnQgdHlwZSBMb2FkZWRUeXBlPFQgZXh0ZW5kcyBTdG9yYWdlVHlwZT4gPSBUIGV4dGVuZHMgUGFja2VkVHlwZSA/IFwiaTMyXCIgOiBUXG5leHBvcnQgdHlwZSBBcml0aG1ldGljT3AgPSBcImFkZFwiIHwgXCJzdWJcIiB8IFwibXVsXCIgfCBcImRpdlwiXG5leHBvcnQgdHlwZSBCaXRPcCA9IFwieG9yXCIgfCBcInNobFwiIHwgXCJzaHJcIiB8IFwiYW5kXCIgfCBcIm9yXCJcbmV4cG9ydCB0eXBlIFJlbWFpbmRlck9wID0gXCJtb2RcIiB8IFwidW1vZFwiXG5leHBvcnQgdHlwZSBCaW5PcCA9IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3BcbmV4cG9ydCB0eXBlIENtcE9wID0gXCJlcVwiIHwgXCJsdFwiIHwgXCJndFwiXG5jb25zdCBhcml0aG1ldGljT3BzID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdIGFzIGNvbnN0XG5jb25zdCBiaXRPcHMgPSBbXCJhbmRcIiwgXCJvclwiLCBcInhvclwiLCBcInNobFwiLCBcInNoclwiXSBhcyBjb25zdFxuY29uc3QgcmVtYWluZGVyT3BzID0gW1wibW9kXCIsIFwidW1vZFwiXSBhcyBjb25zdFxuY29uc3QgY21wT3BzID0gW1wiZXFcIiwgXCJsdFwiLCBcImd0XCJdIGFzIGNvbnN0XG5leHBvcnQgdHlwZSBWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBUIGV4dGVuZHMgXCJpNjRcIiA/IGJpZ2ludCA6IG51bWJlclxuZXhwb3J0IHR5cGUgVHlwZWRBcnJheUZvcjxUIGV4dGVuZHMgU3RvcmFnZVR5cGU+ID1cbiAgVCBleHRlbmRzIFwiaThcIiA/IEludDhBcnJheSA6XG4gIFQgZXh0ZW5kcyBcInUxNlwiID8gVWludDE2QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpMTZcIiA/IEludDE2QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJ1OFwiID8gVWludDhBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImkzMlwiID8gSW50MzJBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImk2NFwiID8gQmlnSW50NjRBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImYzMlwiID8gRmxvYXQzMkFycmF5IDpcbiAgVCBleHRlbmRzIFwiZjY0XCIgPyBGbG9hdDY0QXJyYXkgOiBuZXZlclxuXG50eXBlIEFyZ3NFeHByPEFyZ3MgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10+ID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBFeHByPEFyZ3NbS10+OiBuZXZlciB9XG50eXBlIEFyZ3NMaWtlPEFyZ3MgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10+ID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBFeHByTGlrZTxBcmdzW0tdPjogbmV2ZXIgfVxuZXhwb3J0IHR5cGUgQXJnc1ZhbDxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiAgPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IFZhbHVlPEFyZ3NbS10+IDogbmV2ZXIgfVxuXG50eXBlIExvY2FsTm9kZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGU6IFQsIGxvY2FsOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgQ29yZUV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID1cbiAgfCB7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogVCwgdmFsdWU6IFZhbHVlPFQ+IH1cbiAgfCBMb2NhbE5vZGU8VD5cbiAgfCB7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IFQsIG9wOiBCaW5PcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHI8VD4gfVxuICB8IHsga2luZDogXCJjYWxsXCIsIHR5cGU6IFQsIHRhcmdldDogQW55RnVuYywgYXJnczogRXhwcjxOdW1UeXBlPltdIH1cbiAgfCB7IGtpbmQ6IFwiY2FzdFwiLCB0eXBlOiBULCBpbnB1dFR5cGU6IE51bVR5cGUsIHVuc2lnbmVkOiBib29sZWFuLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImlmXCIsIHR5cGU6IFQsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2U6IEV4cHI8VD4gfVxuICB8IHsga2luZDogXCJsb2FkXCIsIHR5cGU6IFQsIGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0b3JhZ2U6IFN0b3JhZ2VUeXBlLCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiA/IHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBOdW1UeXBlLCBvcDogQ21wT3AsIGxlZnQ6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByPE51bVR5cGU+IH0gOiBuZXZlcilcblxuY2xhc3MgRXhwck1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IHt9XG50eXBlIEFyaXRobWV0aWNNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsgW09wIGluIEFyaXRobWV0aWNPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxudHlwZSBDb21wYXJlTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBDbXBPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxudHlwZSBJbnRlZ2VyTWV0aG9kczxUIGV4dGVuZHMgSW50VHlwZT4gPSB7IFtPcCBpbiBCaXRPcCB8IFJlbWFpbmRlck9wXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5leHBvcnQgdHlwZSBFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IENvcmVFeHByPFQ+ICYgRXhwck1ldGhvZHM8VD4gJiBBcml0aG1ldGljTWV0aG9kczxUPiAmIENvbXBhcmVNZXRob2RzPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gSW50ZWdlck1ldGhvZHM8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIEFueUV4cHIgPSBhbnlcblxuXG5leHBvcnQgdHlwZSBTdG10ID1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBudW1iZXIsIHR5cGU6IE51bVR5cGUsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXk6IEFueUFycmF5LCB0eXBlOiBTdG9yYWdlVHlwZSwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZTogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJhcnJheS5tb3ZlXCIsIGFycmF5OiBBbnlBcnJheSwgdGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+IH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdFtdLCBlbHNlOiBTdG10W10gfVxuICB8IHsga2luZDogXCJibG9ja1wiLCBjb250cm9sOiBudW1iZXIsIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogbnVtYmVyLCBjb25kOiBFeHByPFwiaTMyXCI+LCBib2R5OiBTdG10W10gfVxuICB8IHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU/OiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiY2FsbC52b2lkXCIsIHRhcmdldDogQW55RnVuYywgYXJnczogRXhwcjxOdW1UeXBlPltdIH1cbiAgfCB7IGtpbmQ6IFwidHJhcFwiLCBtZXNzYWdlOiBzdHJpbmcgfVxuICB8IHsga2luZDogXCJsb2dcIiwgbWVzc2FnZTogc3RyaW5nLCB2YWx1ZTogRXhwcjxcImkzMlwiPiB9XG4gIHwgeyBraW5kOiBcImV4cHJcIiwgZXhwcjogRXhwcjxOdW1UeXBlPiB9XG5cbmV4cG9ydCB0eXBlIEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBudW1iZXIgfVxudHlwZSBDb250cm9sSGFuZGxlID0gQmxvY2tIYW5kbGUgfCBMb29wSGFuZGxlXG5cbmNsYXNzIE11dGFibGVNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiBleHRlbmRzIEV4cHJNZXRob2RzPFQ+IHtcbiAgZGVjbGFyZSB0eXBlOiBUXG4gIGRlY2xhcmUgd3JpdGU6ICh2YWx1ZTogRXhwcjxUPikgPT4gU3RtdFxuICBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KSB7IHJldHVybiB0aGlzLndyaXRlKGxpdCh0aGlzLnR5cGUsIHZhbHVlKSkgfVxufVxudHlwZSBNdXRhYmxlQXJpdGhtZXRpYzxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBBcml0aG1ldGljT3AgYXMgYGkke09wfWBdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBTdG10IH1cbnR5cGUgTXV0YWJsZUludGVnZXI8VCBleHRlbmRzIEludFR5cGU+ID0geyBbT3AgaW4gXCJhbmRcIiB8IFwib3JcIiB8IFwieG9yXCIgYXMgYGkke09wfWBdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBTdG10IH1cbmV4cG9ydCB0eXBlIE11dGFibGVWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+ICYgeyBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdCB9ICYgTXV0YWJsZUFyaXRobWV0aWM8VD4gJiAoVCBleHRlbmRzIEludFR5cGUgPyBNdXRhYmxlSW50ZWdlcjxUPiA6IHt9KVxuZXhwb3J0IHR5cGUgTG9jYWxWYXI8VCBleHRlbmRzIE51bVR5cGU+ID0gTXV0YWJsZVZhbHVlPFQ+ICYgTG9jYWxOb2RlPFQ+XG5cbmV4cG9ydCB0eXBlIEFycmF5SGFuZGxlPFQgZXh0ZW5kcyBTdG9yYWdlVHlwZT4gPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICB0eXBlOiBUXG4gIGxlbmd0aDogbnVtYmVyXG4gIGVsZW1lbnRTaXplOiBudW1iZXJcbiAgYXQoaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+KTogTXV0YWJsZVZhbHVlPExvYWRlZFR5cGU8VD4+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBCaXRTdG9yYWdlVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiIHwgXCJpMzJcIlxuZXhwb3J0IHR5cGUgQml0RmllbGQgPSByZWFkb25seSBbQml0U3RvcmFnZVR5cGUsIG51bWJlcl1cbmV4cG9ydCB0eXBlIFN0cnVjdFN0b3JhZ2VUeXBlID0gUGFja2VkVHlwZSB8IEludFR5cGVcbmV4cG9ydCB0eXBlIEZpZWxkVHlwZSA9IFN0cnVjdFN0b3JhZ2VUeXBlIHwgQml0RmllbGRcbmV4cG9ydCB0eXBlIFN0cnVjdEZpZWxkcyA9IFJlY29yZDxzdHJpbmcsIEZpZWxkVHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkU3RvcmFnZTxUIGV4dGVuZHMgRmllbGRUeXBlPiA9IFQgZXh0ZW5kcyByZWFkb25seSBbaW5mZXIgUyBleHRlbmRzIEJpdFN0b3JhZ2VUeXBlLCBudW1iZXJdID8gUyA6IEV4dHJhY3Q8VCwgU3RvcmFnZVR5cGU+XG5leHBvcnQgdHlwZSBGaWVsZFZhbHVlPFQgZXh0ZW5kcyBGaWVsZFR5cGU+ID0gTG9hZGVkVHlwZTxGaWVsZFN0b3JhZ2U8VD4+XG5leHBvcnQgdHlwZSBGaWVsZExheW91dCA9IHsgc3RvcmFnZTogU3RydWN0U3RvcmFnZVR5cGUsIGJpdE9mZnNldDogbnVtYmVyLCBiaXRzOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgU3RydWN0VHlwZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHtcbiAga2luZDogXCJzdHJ1Y3RcIlxuICBmaWVsZHM6IEZcbiAgbGF5b3V0OiB7IFtLIGluIGtleW9mIEZdOiBGaWVsZExheW91dCB9XG4gIHNpemU6IG51bWJlclxuICBzdG9yYWdlOiBcInU4XCIgfCBcInUxNlwiIHwgSW50VHlwZVxufVxudHlwZSBTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogRXhwcjxGaWVsZFZhbHVlPEZbS10+PlxufVxudHlwZSBNdXRhYmxlU3RydWN0TWVtYmVyczxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHtcbiAgW0sgaW4ga2V5b2YgRl06IE11dGFibGVWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PlxufVxuZXhwb3J0IHR5cGUgU3RydWN0SW5pdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHsgW0sgaW4ga2V5b2YgRl06IEV4cHJMaWtlPEZpZWxkVmFsdWU8RltLXT4+IH1cbmV4cG9ydCB0eXBlIEpTU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogVmFsdWU8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgU3RydWN0VmFsdWU8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSBTdHJ1Y3RNZW1iZXJzPEY+ICYgeyBwYWNrZWQ6IEFueUV4cHIgfVxuZXhwb3J0IHR5cGUgTXV0YWJsZVN0cnVjdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdFZhbHVlPEY+ICYgTXV0YWJsZVN0cnVjdE1lbWJlcnM8Rj4gJiB7XG4gIHNldCh2YWx1ZTogTXV0YWJsZVN0cnVjdDxGPiB8IFN0cnVjdEluaXQ8Rj4pOiBTdG10XG59XG5leHBvcnQgdHlwZSBTdHJ1Y3RBcnJheUhhbmRsZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IFN0cnVjdFR5cGU8Rj5cbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBNdXRhYmxlU3RydWN0PEY+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBFeHByTGlrZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+IHwgVmFsdWU8VD5cbmV4cG9ydCB0eXBlIFN0bXRCb2R5ID0gU3RtdCB8IFN0bXRCb2R5W11cbnR5cGUgQ29udHJvbEJvZHk8SCBleHRlbmRzIENvbnRyb2xIYW5kbGU+ID0gU3RtdEJvZHkgfCAoKHNlbGY6IEgpID0+IFN0bXRCb2R5KVxuZXhwb3J0IHR5cGUgRnVuY0JvZHk8UiBleHRlbmRzIFJlc3VsdFR5cGU+ID1cbiAgUiBleHRlbmRzIE51bVR5cGUgPyBFeHByPFI+IHwgU3RtdEJvZHkgOlxuICBSIGV4dGVuZHMgU3RydWN0VHlwZTxpbmZlciBGPiA/IFN0cnVjdFZhbHVlPEY+IHwgU3RtdEJvZHkgOlxuICBTdG10Qm9keVxuZXhwb3J0IHR5cGUgRnVuY0hhbmRsZTxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIHBhcmFtczogQVxuICByZXN1bHQ6IFJcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+XG4gIGNhbGw6ICguLi5hcmdzOiBBcmdzTGlrZTxBPikgPT5cbiAgICBSIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8Uj4gOlxuICAgIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gOlxuICAgIFN0bXRcbn1cblxuZXhwb3J0IHR5cGUgQW55RnVuYyA9IHtcbiAga2luZDogXCJmdW5jXCJcbiAgcGFyYW1zOiByZWFkb25seSBOdW1UeXBlW11cbiAgcmVzdWx0OiBSZXN1bHRUeXBlXG4gIGJ1aWxkOiAoLi4uYXJnczogcmVhZG9ubHkgQW55RXhwcltdKSA9PiBhbnlcbiAgY2FsbDogKC4uLmFyZ3M6IGFueVtdKSA9PiBBbnlFeHByXG59XG5cbmV4cG9ydCB0eXBlIEFueUFycmF5ID0ge1xuICBraW5kOiBcImFycmF5XCJcbiAgdHlwZTogU3RvcmFnZVR5cGUgfCBTdHJ1Y3RUeXBlPGFueT5cbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdCguLi5hcmdzOiBhbnlbXSk6IGFueVxuICBtb3ZlKC4uLmFyZ3M6IGFueVtdKTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBNb2R1bGVEZWYgPSBSZWNvcmQ8c3RyaW5nLCBBbnlGdW5jIHwgQW55QXJyYXk+XG5leHBvcnQgdHlwZSBGdW5jRGVmczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHsgW0sgaW4ga2V5b2YgVCBhcyBUW0tdIGV4dGVuZHMgQW55RnVuYyA/IEsgOiBuZXZlcl06IEV4dHJhY3Q8VFtLXSwgQW55RnVuYz4gfVxuZXhwb3J0IHR5cGUgQXJyYXlEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlBcnJheSA/IEsgOiBuZXZlcl06IEV4dHJhY3Q8VFtLXSwgQW55QXJyYXk+IH1cbmV4cG9ydCB0eXBlIENvbXBpbGVSZXN1bHQ8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7XG4gIFtLIGluIGtleW9mIFRdOlxuICAgIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gKC4uLmFyZ3M6IEFyZ3NWYWw8VFtLXVtcInBhcmFtc1wiXT4pID0+XG4gICAgICBUW0tdW1wicmVzdWx0XCJdIGV4dGVuZHMgTnVtVHlwZSA/IFZhbHVlPFRbS11bXCJyZXN1bHRcIl0+IDpcbiAgICAgIFRbS11bXCJyZXN1bHRcIl0gZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gSlNTdHJ1Y3Q8Rj4gOlxuICAgICAgdm9pZFxuICAgIDogVFtLXSBleHRlbmRzIEFycmF5SGFuZGxlPGluZmVyIFM+ID8gVHlwZWRBcnJheUZvcjxTPlxuICAgIDogVFtLXSBleHRlbmRzIFN0cnVjdEFycmF5SGFuZGxlPGFueT4gPyBVaW50OEFycmF5IHwgVWludDE2QXJyYXkgfCBVaW50MzJBcnJheSB8IEJpZ1VpbnQ2NEFycmF5XG4gICAgOiBuZXZlclxufSAmIHtcbiAgbW9kOiBXZWJBc3NlbWJseS5Nb2R1bGVcbiAgbWVtb3J5OiBXZWJBc3NlbWJseS5NZW1vcnlcbiAgdHJhcE1lc3NhZ2VzOiBzdHJpbmdbXVxuICBsb2dNZXNzYWdlczogc3RyaW5nW11cbiAgcmVzdWx0U3RydWN0czogUmVjb3JkPHN0cmluZywgU3RydWN0VHlwZTxhbnk+PlxufVxuXG5cbmxldCBuZXh0TG9jYWxJZCA9IDBcbmxldCBuZXh0Q29udHJvbElkID0gMFxuXG5jb25zdCBpbmZlclR5cGUgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPikgPT5cbiAgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiBcInR5cGVcIiBpbiB2YWx1ZSA/IHZhbHVlLnR5cGUgOiBcImkzMlwiKSBhcyBUXG5cbmNvbnN0IGV4cHIgPSA8VCBleHRlbmRzIE51bVR5cGU+KG5vZGU6IENvcmVFeHByPFQ+KTogRXhwcjxUPiA9PiB7XG4gIHJldHVybiBPYmplY3Quc2V0UHJvdG90eXBlT2Yobm9kZSwgRXhwck1ldGhvZHMucHJvdG90eXBlKSBhcyBFeHByPFQ+XG59XG5cbmV4cG9ydCBjb25zdCBsaXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT4ge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKFwia2luZFwiIGluIHZhbHVlKSByZXR1cm4gdmFsdWUgYXMgRXhwcjxUPlxuICB9XG4gIHJldHVybiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlLCB2YWx1ZTogdmFsdWUgYXMgVmFsdWU8VD4gfSlcbn1cbmNvbnN0IG11dGFibGUgPSA8VCBleHRlbmRzIE51bVR5cGU+KG5vZGU6IENvcmVFeHByPFQ+LCB3cml0ZTogKHZhbHVlOiBFeHByPFQ+KSA9PiBTdG10KSA9PlxuICBPYmplY3QuYXNzaWduKE9iamVjdC5zZXRQcm90b3R5cGVPZihub2RlLCBNdXRhYmxlTWV0aG9kcy5wcm90b3R5cGUpLCB7IHdyaXRlIH0pIGFzIE11dGFibGVWYWx1ZTxUPlxuXG5jb25zdCBpc1N0bXQgPSAoeDogdW5rbm93bik6IHggaXMgU3RtdCA9PlxuICAhIXggJiYgdHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgXCJraW5kXCIgaW4geCAmJiAoXG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJpZlwiID8gQXJyYXkuaXNBcnJheSgoeCBhcyB7IHRoZW4/OiB1bmtub3duIH0pLnRoZW4pIDpcbiAgICAhW1wiY29uc3RcIiwgXCJsb2NhbC5nZXRcIiwgXCJiaW5cIiwgXCJjYWxsXCIsIFwiY2FzdFwiLCBcImxvYWRcIiwgXCJjbXBcIl0uaW5jbHVkZXMoKHggYXMgeyBraW5kOiBzdHJpbmcgfSkua2luZClcbiAgKVxuXG5jb25zdCBzdG10TGlzdCA9IChib2R5OiBTdG10Qm9keSk6IFN0bXRbXSA9PiBBcnJheS5pc0FycmF5KGJvZHkpID8gYm9keS5mbGF0TWFwKHN0bXRMaXN0KSA6IFtib2R5XVxuZXhwb3J0IGNvbnN0IGFzU3RtdHMgPSA8UiBleHRlbmRzIFJlc3VsdFR5cGU+KGJvZHk6IEZ1bmNCb2R5PFI+KSA9PiBpc1N0bXQoYm9keSkgPyBbYm9keV0gOiBBcnJheS5pc0FycmF5KGJvZHkpID8gc3RtdExpc3QoYm9keSkgOiBudWxsXG5jb25zdCBiaW5kU3RtdHMgPSAoYm9keTogU3RtdEJvZHksIGJyOiBudW1iZXIsIGxvb3A6IG51bWJlciB8IG51bGwpOiBTdG10W10gPT5cbiAgc3RtdExpc3QoYm9keSkubWFwKHMgPT4gYmluZFN0bXQocywgYnIsIGxvb3ApKVxuXG5jb25zdCBiaW5kU3RtdCA9IChzOiBTdG10LCBicjogbnVtYmVyLCBsb29wOiBudW1iZXIgfCBudWxsKTogU3RtdCA9PiB7XG4gIHN3aXRjaCAocy5raW5kKSB7XG4gICAgY2FzZSBcImlmXCI6IHJldHVybiB7IC4uLnMsIHRoZW46IGJpbmRTdG10cyhzLnRoZW4sIGJyLCBsb29wKSwgZWxzZTogYmluZFN0bXRzKHMuZWxzZSwgYnIsIGxvb3ApIH1cbiAgICBjYXNlIFwiYnJlYWtcIjogcmV0dXJuIHsgLi4ucywgdGFyZ2V0OiBzLnRhcmdldCA/PyBiciB9XG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgIT0gbnVsbCkgcmV0dXJuIHNcbiAgICAgIGlmIChsb29wID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcImNvbnRpbnVlVG8oKSB1c2VkIG91dHNpZGUgYSBsb29wXCIpXG4gICAgICByZXR1cm4geyAuLi5zLCB0YXJnZXQ6IGxvb3AgfVxuICAgIGRlZmF1bHQ6IHJldHVybiBzXG4gIH1cbn1cblxuY29uc3QgY29udHJvbEJvZHkgPSA8SCBleHRlbmRzIENvbnRyb2xIYW5kbGU+KHNlbGY6IEgsIGJvZHk6IENvbnRyb2xCb2R5PEg+KSA9PlxuICBiaW5kU3RtdHModHlwZW9mIGJvZHkgPT09IFwiZnVuY3Rpb25cIiA/IGJvZHkoc2VsZikgOiBib2R5LCBzZWxmLmlkLCBzZWxmLmtpbmQgPT09IFwibG9vcFwiID8gc2VsZi5pZCA6IG51bGwpXG5cbmNvbnN0IGJpbiA9IDxUIGV4dGVuZHMgTnVtVHlwZT4ob3A6IEFyaXRobWV0aWNPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PlxuICBleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KVxuXG5jb25zdCBiaXQgPSA8VCBleHRlbmRzIEludFR5cGU+KG9wOiBCaXRPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PlxuICBleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KVxuXG5jb25zdCByZW1haW5kZXIgPSA8VCBleHRlbmRzIEludFR5cGU+KG9wOiBSZW1haW5kZXJPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PlxuICBleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KVxuXG5jb25zdCBjbXAgPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBDbXBPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPiA9PlxuICBleHByPFwiaTMyXCI+KHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0OiBsZWZ0IGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiB9IGFzIENvcmVFeHByPFwiaTMyXCI+KVxuXG5leHBvcnQgY29uc3QgYWxsb2NhdGVMb2NhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCkgPT4gZXhwcih7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGUsIGxvY2FsOiBuZXh0TG9jYWxJZCsrIH0pXG5cbmNvbnN0IG1rTG9jYWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiBMb2NhbFZhcjxUPiA9PiB7XG4gIGNvbnN0IGxvY2FsID0gbmV4dExvY2FsSWQrK1xuICByZXR1cm4gbXV0YWJsZSh7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGUsIGxvY2FsIH0sIHZhbHVlID0+ICh7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsLCB0eXBlLCB2YWx1ZTogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KSkgYXMgTG9jYWxWYXI8VD5cbn1cblxuY29uc3QgbWtIYW5kbGUgPSA8QSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIFJlc3VsdFR5cGU+KFxuICBwYXJhbXM6IEEsXG4gIHJlc3VsdDogUixcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+LFxuKTogRnVuY0hhbmRsZTxBLCBSPiA9PiB7XG4gIGxldCBoYW5kbGUhOiBGdW5jSGFuZGxlPEEsIFI+XG4gIGhhbmRsZSA9IHtcbiAgICBraW5kOiBcImZ1bmNcIixcbiAgICBwYXJhbXMsIHJlc3VsdCwgYnVpbGQsXG4gICAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NMaWtlPEE+KSA9PiB7XG4gICAgICBjb25zdCBjYWxsQXJncyA9IHBhcmFtcy5tYXAoKHR5cGUsIGkpID0+IGxpdCh0eXBlLCBhcmdzW2ldIGFzIEV4cHJMaWtlPHR5cGVvZiB0eXBlPikpIGFzIEV4cHI8TnVtVHlwZT5bXVxuICAgICAgaWYgKHJlc3VsdCA9PT0gXCJ2b2lkXCIpIHJldHVybiB7IGtpbmQ6IFwiY2FsbC52b2lkXCIsIHRhcmdldDogaGFuZGxlLCBhcmdzOiBjYWxsQXJncyB9XG4gICAgICBjb25zdCB0eXBlID0gKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyByZXN1bHQgOiByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiKSBhcyBOdW1UeXBlXG4gICAgICBjb25zdCBjYWxsID0gZXhwcih7IGtpbmQ6IFwiY2FsbFwiLCB0eXBlLCB0YXJnZXQ6IGhhbmRsZSwgYXJnczogY2FsbEFyZ3MgfSlcbiAgICAgIHJldHVybiB0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiID8gY2FsbCA6IHJlYWRTdHJ1Y3QocmVzdWx0LCBjYWxsKVxuICAgIH0sXG4gIH0gYXMgRnVuY0hhbmRsZTxBLCBSPlxuICByZXR1cm4gaGFuZGxlXG59XG5cbmNvbnN0IGxvYWRlZFR5cGUgPSA8VCBleHRlbmRzIFN0b3JhZ2VUeXBlPih0eXBlOiBUKSA9PlxuICAodHlwZSA9PT0gXCJpOFwiIHx8IHR5cGUgPT09IFwidThcIiB8fCB0eXBlID09PSBcImkxNlwiIHx8IHR5cGUgPT09IFwidTE2XCIgPyBcImkzMlwiIDogdHlwZSkgYXMgTG9hZGVkVHlwZTxUPlxuXG5jb25zdCBzdG9yYWdlU2l6ZTogUmVjb3JkPFN0b3JhZ2VUeXBlLCBudW1iZXI+ID0geyBpODogMSwgdTg6IDEsIGkxNjogMiwgdTE2OiAyLCBpMzI6IDQsIGYzMjogNCwgaTY0OiA4LCBmNjQ6IDggfVxuY29uc3QgbWVtb3J5VmFsdWUgPSA8VCBleHRlbmRzIFN0b3JhZ2VUeXBlPihhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgc3RvcmFnZTogVCwgc3RyaWRlOiBudW1iZXIsIG9mZnNldCA9IDApID0+IHtcbiAgY29uc3QgYXQgPSBsaXQoXCJpMzJcIiwgaW5kZXgpXG4gIHJldHVybiBtdXRhYmxlKHsga2luZDogXCJsb2FkXCIsIHR5cGU6IGxvYWRlZFR5cGUoc3RvcmFnZSksIGFycmF5LCBpbmRleDogYXQsIHN0b3JhZ2UsIHN0cmlkZSwgb2Zmc2V0IH0sIHZhbHVlID0+XG4gICAgKHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheSwgdHlwZTogc3RvcmFnZSwgaW5kZXg6IGF0LCBzdHJpZGUsIG9mZnNldCwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSkpXG59XG5cbnR5cGUgU3RydWN0QmFja2luZyA9IGFueVxudHlwZSBJbnRlcm5hbFN0cnVjdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IE11dGFibGVTdHJ1Y3Q8Rj4gJiB7IHBhY2tlZDogU3RydWN0QmFja2luZyB9XG5cbmNvbnN0IHJlYWRGaWVsZCA9IChiYWNraW5nOiBBbnlFeHByLCBmaWVsZDogRmllbGRMYXlvdXQpID0+IHtcbiAgY29uc3QgeyBiaXRzIH0gPSBmaWVsZFxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGJhY2tpbmdcbiAgaWYgKGJhY2tpbmcudHlwZSA9PT0gXCJpNjRcIikge1xuICAgIGNvbnN0IGJpdE9mZnNldCA9IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpLCBtYXNrID0gKDFuIDw8IEJpZ0ludChiaXRzKSkgLSAxblxuICAgIGNvbnN0IHJhdyA9IGkzMihiYWNraW5nLnNocihiaXRPZmZzZXQpLmFuZChtYXNrKSlcbiAgICByZXR1cm4gZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiBiaXRzIDwgMzJcbiAgICAgID8gaWZFbHNlKHJhdy5hbmQoMiAqKiAoYml0cyAtIDEpKSwgcmF3LnN1YigyICoqIGJpdHMpLCByYXcpXG4gICAgICA6IHJhd1xuICB9XG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImkzMlwiICYmIGZpZWxkLmJpdE9mZnNldCA9PT0gMCkgcmV0dXJuIGJhY2tpbmdcbiAgY29uc3QgbWFzayA9IDIgKiogYml0cyAtIDFcbiAgY29uc3QgcmF3ID0gYmFja2luZy5zaHIoZmllbGQuYml0T2Zmc2V0KS5hbmQobWFzaylcbiAgcmV0dXJuIGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgYml0cyA8IDMyXG4gICAgPyBpZkVsc2UocmF3LmFuZCgyICoqIChiaXRzIC0gMSkpLCByYXcuc3ViKDIgKiogYml0cyksIHJhdylcbiAgICA6IHJhd1xufVxuXG5jb25zdCBwYWNrZWRGaWVsZFZhbHVlID0gKGJhY2tpbmc6IFN0cnVjdEJhY2tpbmcsIGZpZWxkOiBGaWVsZExheW91dCkgPT4ge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRGaWVsZChiYWNraW5nLCBmaWVsZClcbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBiYWNraW5nXG4gIGlmIChiYWNraW5nLnR5cGUgPT09IFwiaTY0XCIpIHtcbiAgICBjb25zdCBiaXRPZmZzZXQgPSBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSwgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICBjb25zdCBmaWVsZE1hc2sgPSBtYXNrIDw8IGJpdE9mZnNldFxuICAgIHJldHVybiBtdXRhYmxlPFwiaTMyXCI+KHZhbHVlIGFzIEV4cHI8XCJpMzJcIj4sIGlucHV0ID0+IGJhY2tpbmcuc2V0KGJhY2tpbmcuYW5kKH5maWVsZE1hc2spLm9yKGk2NHUoaW5wdXQpLmFuZChtYXNrKS5zaGwoYml0T2Zmc2V0KSkpKVxuICB9XG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImkzMlwiICYmIGZpZWxkLmJpdE9mZnNldCA9PT0gMCkgcmV0dXJuIGJhY2tpbmdcbiAgY29uc3QgbWFzayA9IDIgKiogZmllbGQuYml0cyAtIDEsIGZpZWxkTWFzayA9IG1hc2sgPDwgZmllbGQuYml0T2Zmc2V0XG4gIHJldHVybiBtdXRhYmxlPFwiaTMyXCI+KHZhbHVlLCBpbnB1dCA9PiBiYWNraW5nLnNldChiYWNraW5nLmFuZCh+ZmllbGRNYXNrKS5vcihpbnB1dC5hbmQobWFzaykuc2hsKGZpZWxkLmJpdE9mZnNldCkpKSlcbn1cblxuY29uc3QgcmVhZFN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCBwYWNrZWQ6IEFueUV4cHIpOiBTdHJ1Y3RWYWx1ZTxGPiA9PlxuICBPYmplY3QuYXNzaWduKE9iamVjdC5mcm9tRW50cmllcyhPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykubWFwKG5hbWUgPT4gW25hbWUsIHJlYWRGaWVsZChwYWNrZWQsIHR5cGUubGF5b3V0W25hbWVdISldKSksIHsgcGFja2VkIH0pIGFzIFN0cnVjdFZhbHVlPEY+XG5cbmNvbnN0IHN0cnVjdFZhbHVlID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHBhY2tlZDogU3RydWN0QmFja2luZyk6IE11dGFibGVTdHJ1Y3Q8Rj4gPT4ge1xuICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmtleXModHlwZS5maWVsZHMpLm1hcChuYW1lID0+IFtuYW1lLCBwYWNrZWRGaWVsZFZhbHVlKHBhY2tlZCwgdHlwZS5sYXlvdXRbbmFtZV0hKV0pKVxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihmaWVsZHMsIHsgcGFja2VkLCBzZXQ6ICh2YWx1ZTogTXV0YWJsZVN0cnVjdDxGPiB8IFN0cnVjdEluaXQ8Rj4pID0+XG4gICAgcGFja2VkLnNldChcInBhY2tlZFwiIGluIHZhbHVlID8gKHZhbHVlIGFzIEludGVybmFsU3RydWN0PEY+KS5wYWNrZWQgOiBwYWNrU3RydWN0KHR5cGUsIHZhbHVlKSkgfSkgYXMgSW50ZXJuYWxTdHJ1Y3Q8Rj5cbn1cblxuY29uc3QgcGFja1N0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCB2YWx1ZXM6IFN0cnVjdEluaXQ8Rj4pOiBBbnlFeHByID0+IHtcbiAgaWYgKHR5cGUuc3RvcmFnZSAhPT0gXCJpNjRcIikgcmV0dXJuIE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5yZWR1Y2UoKHBhY2tlZCwgbmFtZSkgPT4ge1xuICAgIGNvbnN0IGZpZWxkID0gdHlwZS5sYXlvdXRbbmFtZV0hLCB2YWx1ZSA9IHZhbHVlc1tuYW1lXSFcbiAgICBjb25zdCBtYXNrID0gMiAqKiBmaWVsZC5iaXRzIC0gMVxuICAgIHJldHVybiBwYWNrZWQub3IobGl0KFwiaTMyXCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTMyXCI+KS5hbmQobWFzaykuc2hsKGZpZWxkLmJpdE9mZnNldCkpXG4gIH0sIGkzMigwKSlcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5yZWR1Y2UoKHBhY2tlZCwgbmFtZSkgPT4ge1xuICAgIGNvbnN0IGZpZWxkID0gdHlwZS5sYXlvdXRbbmFtZV0hLCB2YWx1ZSA9IHZhbHVlc1tuYW1lXSFcbiAgICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGxpdChcImk2NFwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImk2NFwiPilcbiAgICBjb25zdCBtYXNrID0gKDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzKSkgLSAxblxuICAgIHJldHVybiBwYWNrZWQub3IoaTY0dShsaXQoXCJpMzJcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpMzJcIj4pKS5hbmQobWFzaykuc2hsKEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpKSlcbiAgfSwgaTY0KDBuKSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cnVjdCA9IDxjb25zdCBGIGV4dGVuZHMgU3RydWN0RmllbGRzPihmaWVsZHM6IEYpOiBTdHJ1Y3RUeXBlPEY+ID0+IHtcbiAgaWYgKFwic2V0XCIgaW4gZmllbGRzIHx8IFwicGFja2VkXCIgaW4gZmllbGRzKSB0aHJvdyBuZXcgRXJyb3IoXCJTdHJ1Y3QgZmllbGRzIGNhbm5vdCBiZSBuYW1lZCBzZXQgb3IgcGFja2VkXCIpXG4gIGxldCB1c2VkID0gMFxuICBjb25zdCBsYXlvdXQ6IFBhcnRpYWw8UmVjb3JkPGtleW9mIEYsIEZpZWxkTGF5b3V0Pj4gPSB7fVxuICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMoZmllbGRzKSBhcyAoa2V5b2YgRilbXSkge1xuICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW25hbWVdIVxuICAgIGNvbnN0IHN0b3JhZ2UgPSAoQXJyYXkuaXNBcnJheShmaWVsZCkgPyBmaWVsZFswXSA6IGZpZWxkKSBhcyBTdHJ1Y3RTdG9yYWdlVHlwZVxuICAgIGNvbnN0IGJpdHMgPSBBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkWzFdIDogc3RvcmFnZVNpemVbc3RvcmFnZV0gKiA4XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGJpdHMpIHx8IGJpdHMgPCAxIHx8IGJpdHMgPiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSAqIDgpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCAke3N0b3JhZ2V9IGJpdC1maWVsZCB3aWR0aCAke2JpdHN9YClcbiAgICBpZiAodXNlZCArIGJpdHMgPiA2NCkgdGhyb3cgbmV3IEVycm9yKGBTdHJ1Y3QgcmVxdWlyZXMgJHt1c2VkICsgYml0c30gYml0czsgbWF4aW11bSBpcyA2NGApXG4gICAgbGF5b3V0W25hbWVdID0geyBzdG9yYWdlLCBiaXRPZmZzZXQ6IHVzZWQsIGJpdHMgfVxuICAgIHVzZWQgKz0gYml0c1xuICB9XG4gIGNvbnN0IHN0b3JhZ2UgPSB1c2VkIDw9IDggPyBcInU4XCIgOiB1c2VkIDw9IDE2ID8gXCJ1MTZcIiA6IHVzZWQgPD0gMzIgPyBcImkzMlwiIDogXCJpNjRcIlxuICByZXR1cm4geyBraW5kOiBcInN0cnVjdFwiLCBmaWVsZHMsIGxheW91dDogbGF5b3V0IGFzIHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH0sIHN0b3JhZ2UsIHNpemU6IHN0b3JhZ2VTaXplW3N0b3JhZ2VdIH1cbn1cblxuY29uc3QgY2FzdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHI8TnVtVHlwZT4sIHVuc2lnbmVkID0gZmFsc2UpOiBFeHByPFQ+ID0+XG4gIHZhbHVlLnR5cGUgPT09IHR5cGUgPyB2YWx1ZSBhcyB1bmtub3duIGFzIEV4cHI8VD4gOiBleHByPFQ+KHsga2luZDogXCJjYXN0XCIsIHR5cGUsIGlucHV0VHlwZTogdmFsdWUudHlwZSwgdW5zaWduZWQsIHZhbHVlIH0gYXMgQ29yZUV4cHI8VD4pXG5jb25zdCBudW1iZXIgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiB1bmtub3duKTogRXhwcjxUPiA9PlxuICB0eXBlb2YgdmFsdWUgPT09ICh0eXBlID09PSBcImk2NFwiID8gXCJiaWdpbnRcIiA6IFwibnVtYmVyXCIpXG4gICAgPyBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlLCB2YWx1ZSB9IGFzIENvcmVFeHByPFQ+KVxuICAgIDogY2FzdCh0eXBlLCB2YWx1ZSBhcyBFeHByPE51bVR5cGU+KVxuXG5leHBvcnQgZnVuY3Rpb24gaTMyKHZhbHVlOiBudW1iZXIpOiBFeHByPFwiaTMyXCI+XG5leHBvcnQgZnVuY3Rpb24gaTMyPFQgZXh0ZW5kcyBJbnRUeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJpMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBpMzIodmFsdWU6IHVua25vd24pIHsgcmV0dXJuIG51bWJlcihcImkzMlwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgZnVuY3Rpb24gaTY0KHZhbHVlOiBiaWdpbnQpOiBFeHByPFwiaTY0XCI+XG5leHBvcnQgZnVuY3Rpb24gaTY0PFQgZXh0ZW5kcyBJbnRUeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJpNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBpNjQodmFsdWU6IHVua25vd24pIHsgcmV0dXJuIG51bWJlcihcImk2NFwiLCB2YWx1ZSkgfVxuZXhwb3J0IGNvbnN0IGk2NHUgPSAodmFsdWU6IEV4cHI8XCJpMzJcIj4pID0+IGNhc3QoXCJpNjRcIiwgdmFsdWUgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+LCB0cnVlKVxuXG50eXBlIEYzMklucHV0ID0gbnVtYmVyIHwgRXhwcjxcImkzMlwiIHwgXCJpNjRcIiB8IFwiZjMyXCIgfCBcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMih2YWx1ZTogbnVtYmVyKTogRXhwcjxcImYzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMjxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiZjMyXCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyKHZhbHVlOiBGMzJJbnB1dCkgeyByZXR1cm4gbnVtYmVyKFwiZjMyXCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBmNjQodmFsdWU6IG51bWJlcik6IEV4cHI8XCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmNjQ8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGY2NCh2YWx1ZTogRjMySW5wdXQpIHsgcmV0dXJuIG51bWJlcihcImY2NFwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgZnVuY3Rpb24gaWZFbHNlPFQgZXh0ZW5kcyBOdW1UeXBlPihjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlXzogRXhwcjxUPik6IEV4cHI8VD5cbmV4cG9ydCBmdW5jdGlvbiBpZkVsc2UoY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdEJvZHksIGVsc2VfPzogU3RtdEJvZHkpOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gaWZFbHNlPFQgZXh0ZW5kcyBOdW1UeXBlPihjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+IHwgU3RtdEJvZHksIGVsc2VfPzogRXhwcjxUPiB8IFN0bXRCb2R5KTogRXhwcjxUPiB8IFN0bXQge1xuICByZXR1cm4gaXNTdG10KHRoZW4pIHx8IEFycmF5LmlzQXJyYXkodGhlbilcbiAgICA/IHsga2luZDogXCJpZlwiLCBjb25kLCB0aGVuOiBzdG10TGlzdCh0aGVuIGFzIFN0bXRCb2R5KSwgZWxzZTogZWxzZV8gPT09IHVuZGVmaW5lZCA/IFtdIDogc3RtdExpc3QoZWxzZV8gYXMgU3RtdEJvZHkpIH1cbiAgICA6IGV4cHI8VD4oeyBraW5kOiBcImlmXCIsIHR5cGU6IHRoZW4udHlwZSwgY29uZCwgdGhlbiwgZWxzZTogZWxzZV8gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KVxufVxuXG5jb25zdCBhcml0aG1ldGljID0gT2JqZWN0LmZyb21FbnRyaWVzKGFyaXRobWV0aWNPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIEFyaXRobWV0aWNPcF06IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IGJpdHMgPSBPYmplY3QuZnJvbUVudHJpZXMoYml0T3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaXQob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBCaXRPcF06IDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IHJlbWFpbmRlcnMgPSBPYmplY3QuZnJvbUVudHJpZXMocmVtYWluZGVyT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiByZW1haW5kZXIob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBSZW1haW5kZXJPcF06IDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IGNvbXBhcmlzb25zID0gT2JqZWN0LmZyb21FbnRyaWVzKGNtcE9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gY21wKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQ21wT3BdOiA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxcImkzMlwiPiB9XG5cbmZvciAoY29uc3Qgb3Agb2YgYXJpdGhtZXRpY09wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPE51bVR5cGU+KSB7IHJldHVybiBhcml0aG1ldGljW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIGJpdE9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxJbnRUeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KSB7IHJldHVybiBiaXRzW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIHJlbWFpbmRlck9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxJbnRUeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KSB7IHJldHVybiByZW1haW5kZXJzW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIGNtcE9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPE51bVR5cGU+KSB7IHJldHVybiBjb21wYXJpc29uc1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBbLi4uYXJpdGhtZXRpY09wcywgXCJhbmRcIiwgXCJvclwiLCBcInhvclwiXSBhcyBjb25zdCkgT2JqZWN0LmRlZmluZVByb3BlcnR5KE11dGFibGVNZXRob2RzLnByb3RvdHlwZSwgYGkke29wfWAsIHtcbiAgdmFsdWUodGhpczogTXV0YWJsZVZhbHVlPGFueT4sIHJpZ2h0OiBhbnkpIHsgcmV0dXJuIHRoaXMuc2V0KCh0aGlzIGFzIGFueSlbb3BdKHJpZ2h0KSkgfSxcbn0pXG5cbmV4cG9ydCBjb25zdCB7IGFkZCwgc3ViLCBtdWwsIGRpdiB9ID0gYXJpdGhtZXRpY1xuZXhwb3J0IGNvbnN0IHsgYW5kLCBvciwgeG9yLCBzaGwsIHNociB9ID0gYml0c1xuZXhwb3J0IGNvbnN0IHsgbW9kLCB1bW9kIH0gPSByZW1haW5kZXJzXG5leHBvcnQgY29uc3QgeyBlcSwgbHQsIGd0IH0gPSBjb21wYXJpc29uc1xuXG5leHBvcnQgY29uc3QgZnVuYyA9IDxjb25zdCBBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4ocGFyYW1zOiBBLCByZXN1bHQ6IFIsIGJ1aWxkOiAoLi4uYXJnczogQXJnc0V4cHI8QT4pID0+IEZ1bmNCb2R5PFI+KSA9PlxuICBta0hhbmRsZShwYXJhbXMsIHJlc3VsdCwgYnVpbGQgYXMgKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj4pXG5leHBvcnQgZnVuY3Rpb24gYXJyYXk8VCBleHRlbmRzIFN0b3JhZ2VUeXBlPih0eXBlOiBULCBsZW5ndGg6IG51bWJlcik6IEFycmF5SGFuZGxlPFQ+XG5leHBvcnQgZnVuY3Rpb24gYXJyYXk8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgbGVuZ3RoOiBudW1iZXIpOiBTdHJ1Y3RBcnJheUhhbmRsZTxGPlxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KHR5cGU6IFN0b3JhZ2VUeXBlIHwgU3RydWN0VHlwZTxhbnk+LCBsZW5ndGg6IG51bWJlcikge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGVuZ3RoKSB8fCBsZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFycmF5IGxlbmd0aCAke2xlbmd0aH1gKVxuICBjb25zdCBzdG9yYWdlID0gdHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCIgPyB0eXBlIDogdHlwZS5zdG9yYWdlXG4gIGNvbnN0IGVsZW1lbnRTaXplID0gdHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCIgPyBzdG9yYWdlU2l6ZVt0eXBlXSA6IHR5cGUuc2l6ZVxuICBsZXQgaGFuZGxlOiBBbnlBcnJheVxuICBoYW5kbGUgPSB7XG4gICAga2luZDogXCJhcnJheVwiLCB0eXBlLCBsZW5ndGgsIGVsZW1lbnRTaXplLFxuICAgIGF0OiBpbmRleCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG1lbW9yeVZhbHVlKGhhbmRsZSwgaW5kZXgsIHN0b3JhZ2UsIGVsZW1lbnRTaXplKVxuICAgICAgcmV0dXJuIHR5cGVvZiB0eXBlID09PSBcInN0cmluZ1wiID8gdmFsdWUgOiBzdHJ1Y3RWYWx1ZSh0eXBlLCB2YWx1ZSlcbiAgICB9LFxuICAgIG1vdmU6ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+ICh7IGtpbmQ6IFwiYXJyYXkubW92ZVwiLCBhcnJheTogaGFuZGxlLCB0YXJnZXQ6IGxpdChcImkzMlwiLCB0YXJnZXQpLCBzb3VyY2U6IGxpdChcImkzMlwiLCBzb3VyY2UpLCBjb3VudDogbGl0KFwiaTMyXCIsIGNvdW50KSB9KSxcbiAgfVxuICByZXR1cm4gaGFuZGxlXG59XG5cbmNvbnN0IG1rU3RydWN0TG9jYWwgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPikgPT5cbiAgc3RydWN0VmFsdWUodHlwZSwgbWtMb2NhbCh0eXBlLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyBcImk2NFwiIDogXCJpMzJcIikpXG5cbnR5cGUgTG9jYWxGYWN0b3J5ID0ge1xuICA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiBMb2NhbFZhcjxUPlxuICA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPik6IE11dGFibGVTdHJ1Y3Q8Rj5cbn1cblxuZXhwb3J0IGNvbnN0IGxvY2FsID0gKDxUIGV4dGVuZHMgTnVtVHlwZSwgRiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogVCB8IFN0cnVjdFR5cGU8Rj4pID0+XG4gIHR5cGVvZiB0eXBlID09PSBcInN0cmluZ1wiID8gbWtMb2NhbCh0eXBlKSA6IG1rU3RydWN0TG9jYWwodHlwZSkpIGFzIExvY2FsRmFjdG9yeVxuXG5leHBvcnQgZnVuY3Rpb24gcmV0KCk6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiByZXQ8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiByZXQodmFsdWU6IHsgcGFja2VkOiBBbnlFeHByIH0pOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZT86IEV4cHJMaWtlPFQ+IHwgeyBwYWNrZWQ6IEFueUV4cHIgfSk6IFN0bXQge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHsga2luZDogXCJyZXR1cm5cIiB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgXCJwYWNrZWRcIiBpbiB2YWx1ZSkgcmV0dXJuIHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU6IHZhbHVlLnBhY2tlZCB9XG4gIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiBsaXQoaW5mZXJUeXBlKHZhbHVlKSwgdmFsdWUpIGFzIEV4cHI8TnVtVHlwZT4gfVxufVxuZXhwb3J0IGNvbnN0IHRyYXAgPSAobWVzc2FnZTogc3RyaW5nKTogU3RtdCA9PiAoeyBraW5kOiBcInRyYXBcIiwgbWVzc2FnZSB9KVxuZXhwb3J0IGNvbnN0IGJvdW5kc0NoZWNrID0gKGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCBjb3VudDogRXhwckxpa2U8XCJpMzJcIj4gPSAxKTogU3RtdCA9PiB7XG4gIGNvbnN0IGkgPSBsaXQoXCJpMzJcIiwgaW5kZXgpLCBuID0gbGl0KFwiaTMyXCIsIGNvdW50KVxuICByZXR1cm4gaWZFbHNlKGkubHQoMCkub3Iobi5sdCgwKSkub3Iobi5ndChhcnJheS5sZW5ndGgpKS5vcihpLmd0KGkzMihhcnJheS5sZW5ndGgpLnN1YihuKSkpLCB0cmFwKFwiYXJyYXkgYm91bmRzIGV4Y2VlZGVkXCIpKVxufVxuZXhwb3J0IGNvbnN0IGxvZyA9IChtZXNzYWdlOiBzdHJpbmcsIHZhbHVlOiBFeHByTGlrZTxcImkzMlwiPik6IFN0bXQgPT4gKHsga2luZDogXCJsb2dcIiwgbWVzc2FnZSwgdmFsdWU6IGxpdChcImkzMlwiLCB2YWx1ZSkgfSlcbmV4cG9ydCBjb25zdCBibG9jayA9IChib2R5OiBDb250cm9sQm9keTxCbG9ja0hhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogQmxvY2tIYW5kbGUgPSB7IGtpbmQ6IFwiYmxvY2tcIiwgaWQ6IG5leHRDb250cm9sSWQrKyB9XG4gIHJldHVybiB7IGtpbmQ6IFwiYmxvY2tcIiwgY29udHJvbDogc2VsZi5pZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuZXhwb3J0IGNvbnN0IGxvb3AgPSAoY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogQ29udHJvbEJvZHk8TG9vcEhhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogc2VsZi5pZCwgY29uZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuXG5leHBvcnQgY29uc3QgYnJlYWtUbyA9ICh0YXJnZXQ/OiBDb250cm9sSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgY29udGludWVUbyA9ICh0YXJnZXQ/OiBMb29wSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgZXhwclN0bXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogU3RtdCA9PiAoeyBraW5kOiBcImV4cHJcIiwgZXhwcjogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KVxuIiwKICAgICJpbXBvcnQge1xuICBhbGxvY2F0ZUxvY2FsLCBhc1N0bXRzLFxuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUZ1bmMsIHR5cGUgQXJyYXlEZWZzLCB0eXBlIEV4cHIsXG4gIHR5cGUgRnVuY0JvZHksIHR5cGUgRnVuY0RlZnMsIHR5cGUgTW9kdWxlRGVmLCB0eXBlIE51bVR5cGUsIHR5cGUgUmVzdWx0VHlwZSxcbn0gZnJvbSBcIi4vd2FzbV9hc3RcIlxuXG5jb25zdCBkaWUgPSAoeDogdW5rbm93bik6IG5ldmVyID0+IHsgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHZhbHVlOiAke1N0cmluZyh4KX1gKSB9XG5leHBvcnQgdHlwZSBBcnJheUxheW91dCA9IHsgbGVuZ3RoOiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCBlbGVtZW50U2l6ZTogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIE1vZHVsZUFuYWx5c2lzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBmdW5jczogRnVuY0RlZnM8VD5cbiAgYXJyYXlzOiBBcnJheURlZnM8VD5cbiAgZkVudHJpZXM6IFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGJ1aWx0RnVuY3M6IEJ1aWx0RnVuY1tdXG4gIGZpeDogTWFwPEFueUZ1bmMsIG51bWJlcj5cbiAgbGF5b3V0czogTWFwPEFueUFycmF5LCBBcnJheUxheW91dD5cbiAgdHJhcE1lc3NhZ2VzOiBzdHJpbmdbXVxuICBsb2dNZXNzYWdlczogc3RyaW5nW11cbiAgcGFnZXM6IG51bWJlclxufVxuXG50eXBlIFZpc2l0b3JzID0ge1xuICBsb2NhbD86IChpZDogbnVtYmVyLCB0eXBlOiBOdW1UeXBlKSA9PiB2b2lkXG4gIGFycmF5PzogKGFycmF5OiBBbnlBcnJheSkgPT4gdm9pZFxuICBmdW5jPzogKGZ1bmM6IEFueUZ1bmMpID0+IHZvaWRcbiAgdHJhcD86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbiAgbG9nPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxufVxuY29uc3Qgd2FsayA9IChub2RlOiBhbnksIGZuczogVmlzaXRvcnMpOiB2b2lkID0+IHtcbiAgaWYgKG5vZGUgPT0gbnVsbCkgcmV0dXJuXG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSByZXR1cm4gbm9kZS5mb3JFYWNoKHggPT4gd2Fsayh4LCBmbnMpKVxuICBjb25zdCBjaGlsZHJlbiA9ICguLi52YWx1ZXM6IGFueVtdKSA9PiB2YWx1ZXMuZm9yRWFjaCh4ID0+IHdhbGsoeCwgZm5zKSlcbiAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjogY2FzZSBcImJyZWFrXCI6IGNhc2UgXCJjb250aW51ZVwiOiByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6IGZucy5sb2NhbD8uKG5vZGUubG9jYWwsIG5vZGUudHlwZSk7IHJldHVyblxuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjogZm5zLmxvY2FsPy4obm9kZS5sb2NhbCwgbm9kZS50eXBlKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJiaW5cIjogY2FzZSBcImNtcFwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5sZWZ0LCBub2RlLnJpZ2h0KVxuICAgIGNhc2UgXCJjYWxsXCI6IGNhc2UgXCJjYWxsLnZvaWRcIjogZm5zLmZ1bmM/Lihub2RlLnRhcmdldCk7IHJldHVybiB3YWxrKG5vZGUuYXJncywgZm5zKVxuICAgIGNhc2UgXCJjYXN0XCI6IGNhc2UgXCJyZXR1cm5cIjogcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5jb25kLCBub2RlLnRoZW4sIG5vZGUuZWxzZSlcbiAgICBjYXNlIFwibG9hZFwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIHdhbGsobm9kZS5pbmRleCwgZm5zKVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIGNoaWxkcmVuKG5vZGUuaW5kZXgsIG5vZGUudmFsdWUpXG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiBjaGlsZHJlbihub2RlLnRhcmdldCwgbm9kZS5zb3VyY2UsIG5vZGUuY291bnQpXG4gICAgY2FzZSBcImJsb2NrXCI6IHJldHVybiB3YWxrKG5vZGUuYm9keSwgZm5zKVxuICAgIGNhc2UgXCJsb29wXCI6IHJldHVybiBjaGlsZHJlbihub2RlLmNvbmQsIG5vZGUuYm9keSlcbiAgICBjYXNlIFwidHJhcFwiOiBmbnMudHJhcD8uKG5vZGUubWVzc2FnZSk7IHJldHVyblxuICAgIGNhc2UgXCJsb2dcIjogZm5zLmxvZz8uKG5vZGUubWVzc2FnZSk7IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiZXhwclwiOiByZXR1cm4gd2Fsayhub2RlLmV4cHIsIGZucylcbiAgICBkZWZhdWx0OiBkaWUobm9kZSlcbiAgfVxufVxuXG5cbmNvbnN0IGFycmF5TGF5b3V0cyA9IChhcnJheXM6IEFueUFycmF5W10pID0+IHtcbiAgbGV0IG9mZnNldCA9IDBcbiAgY29uc3QgbGF5b3V0cyA9IG5ldyBNYXA8QW55QXJyYXksIEFycmF5TGF5b3V0PigpXG4gIGZvciAoY29uc3QgYXJyIG9mIGFycmF5cykge1xuICAgIGNvbnN0IGFsaWduID0gTWF0aC5taW4oYXJyLmVsZW1lbnRTaXplLCA4KVxuICAgIG9mZnNldCA9IE1hdGguY2VpbChvZmZzZXQgLyBhbGlnbikgKiBhbGlnblxuICAgIGxheW91dHMuc2V0KGFyciwgeyBsZW5ndGg6IGFyci5sZW5ndGgsIG9mZnNldCwgZWxlbWVudFNpemU6IGFyci5lbGVtZW50U2l6ZSB9KVxuICAgIG9mZnNldCArPSBhcnIubGVuZ3RoICogYXJyLmVsZW1lbnRTaXplXG4gIH1cbiAgcmV0dXJuIHsgbGF5b3V0cywgYnl0ZXM6IG9mZnNldCB9XG59XG5cbmV4cG9ydCB0eXBlIEJ1aWx0RnVuYyA9IHtcbiAgZnVuYzogQW55RnVuY1xuICBidWlsdDogRnVuY0JvZHk8UmVzdWx0VHlwZT5cbiAgbG9jYWxzOiBbbnVtYmVyLCBOdW1UeXBlXVtdXG4gIGxvY2FsSW5kZXhlczogUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICBmdW5jdGlvbnM6IEFueUZ1bmNbXVxuICBhcnJheXM6IEFueUFycmF5W11cbiAgdHJhcHM6IHN0cmluZ1tdXG4gIGxvZ3M6IHN0cmluZ1tdXG59XG5cbmNvbnN0IGJ1aWxkRnVuYyA9IChmdW5jOiBBbnlGdW5jKTogQnVpbHRGdW5jID0+IHtcbiAgY29uc3QgcGFyYW1zID0gZnVuYy5wYXJhbXMubWFwKHR5cGUgPT4gYWxsb2NhdGVMb2NhbCh0eXBlKSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gIGNvbnN0IHBhcmFtSWRzID0gcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSlcbiAgY29uc3QgcmVzdWx0ID0gZnVuYy5idWlsZCguLi5wYXJhbXMpXG4gIGNvbnN0IGJ1aWx0ID0gdHlwZW9mIGZ1bmMucmVzdWx0ID09PSBcIm9iamVjdFwiICYmICFhc1N0bXRzKHJlc3VsdCkgPyByZXN1bHQucGFja2VkIDogcmVzdWx0XG4gIGNvbnN0IGZvdW5kID0gbmV3IE1hcDxudW1iZXIsIE51bVR5cGU+KClcbiAgY29uc3QgZnVuY3Rpb25zID0gbmV3IFNldDxBbnlGdW5jPigpLCBhcnJheXMgPSBuZXcgU2V0PEFueUFycmF5PigpLCB0cmFwcyA9IG5ldyBTZXQ8c3RyaW5nPigpLCBsb2dzID0gbmV3IFNldDxzdHJpbmc+KClcbiAgd2FsayhidWlsdCwge1xuICAgIGxvY2FsOiAoaWQsIHR5cGUpID0+IGZvdW5kLnNldChpZCwgdHlwZSksIGZ1bmM6IGYgPT4gZnVuY3Rpb25zLmFkZChmKSwgYXJyYXk6IGEgPT4gYXJyYXlzLmFkZChhKSxcbiAgICB0cmFwOiBtZXNzYWdlID0+IHRyYXBzLmFkZChtZXNzYWdlKSwgbG9nOiBtZXNzYWdlID0+IGxvZ3MuYWRkKG1lc3NhZ2UpLFxuICB9KVxuICBwYXJhbUlkcy5mb3JFYWNoKGlkID0+IGZvdW5kLmRlbGV0ZShpZCkpXG4gIGNvbnN0IGxvY2FscyA9IFsuLi5mb3VuZC5lbnRyaWVzKCldXG4gIGNvbnN0IGxvY2FsSW5kZXhlcyA9IE9iamVjdC5mcm9tRW50cmllcyhbXG4gICAgLi4ucGFyYW1JZHMubWFwKChpZCwgaSkgPT4gW2lkLCBpXSksXG4gICAgLi4ubG9jYWxzLm1hcCgoW2lkXSwgaSkgPT4gW2lkLCBmdW5jLnBhcmFtcy5sZW5ndGggKyBpXSksXG4gIF0pXG4gIHJldHVybiB7IGZ1bmMsIGJ1aWx0LCBsb2NhbHMsIGxvY2FsSW5kZXhlcywgZnVuY3Rpb25zOiBbLi4uZnVuY3Rpb25zXSwgYXJyYXlzOiBbLi4uYXJyYXlzXSwgdHJhcHM6IFsuLi50cmFwc10sIGxvZ3M6IFsuLi5sb2dzXSB9XG59XG5cbmNvbnN0IGJ1aWxkUmVmZXJlbmNlZEZ1bmN0aW9ucyA9IChyb290czogQW55RnVuY1tdKSA9PiB7XG4gIGNvbnN0IGJ1aWx0ID0gbmV3IE1hcDxBbnlGdW5jLCBCdWlsdEZ1bmM+KClcbiAgY29uc3QgdmlzaXQgPSAoZnVuYzogQW55RnVuYykgPT4ge1xuICAgIGlmIChidWlsdC5oYXMoZnVuYykpIHJldHVyblxuICAgIGNvbnN0IGVudHJ5ID0gYnVpbGRGdW5jKGZ1bmMpXG4gICAgYnVpbHQuc2V0KGZ1bmMsIGVudHJ5KVxuICAgIGVudHJ5LmZ1bmN0aW9ucy5mb3JFYWNoKHZpc2l0KVxuICB9XG4gIHJvb3RzLmZvckVhY2godmlzaXQpXG4gIHJldHVybiBbLi4uYnVpbHQudmFsdWVzKCldXG59XG5cbmV4cG9ydCBjb25zdCBhbmFseXplTW9kdWxlID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KG1vZDogVCkgPT4ge1xuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMobW9kKVxuICBjb25zdCBmdW5jcyA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLmZpbHRlcigoWywgdl0pID0+IHYua2luZCA9PT0gXCJmdW5jXCIpKSBhcyBGdW5jRGVmczxUPlxuICBjb25zdCBhcnJheXMgPSBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5maWx0ZXIoKFssIHZdKSA9PiB2LmtpbmQgPT09IFwiYXJyYXlcIikpIGFzIEFycmF5RGVmczxUPlxuICBjb25zdCBmRW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGZ1bmNzKSBhcyBba2V5b2YgRnVuY0RlZnM8VD4gJiBzdHJpbmcsIEZ1bmNEZWZzPFQ+W2tleW9mIEZ1bmNEZWZzPFQ+XV1bXVxuICBjb25zdCBidWlsdEZ1bmNzID0gYnVpbGRSZWZlcmVuY2VkRnVuY3Rpb25zKGZFbnRyaWVzLm1hcCgoWywgZnVuY10pID0+IGZ1bmMpKVxuICBjb25zdCBmaXggPSBuZXcgTWFwKGJ1aWx0RnVuY3MubWFwKCh7IGZ1bmMgfSwgaSkgPT4gW2Z1bmMsIGldKSlcbiAgY29uc3QgYWxsQXJyYXlzID0gWy4uLm5ldyBTZXQoWy4uLmJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMuYXJyYXlzKSwgLi4uT2JqZWN0LnZhbHVlcyhhcnJheXMpIGFzIEFueUFycmF5W11dKV1cbiAgY29uc3QgeyBsYXlvdXRzLCBieXRlcyB9ID0gYXJyYXlMYXlvdXRzKGFsbEFycmF5cylcbiAgY29uc3QgdHJhcE1lc3NhZ2VzID0gWy4uLm5ldyBTZXQoYnVpbHRGdW5jcy5mbGF0TWFwKGZ1bmMgPT4gZnVuYy50cmFwcykpXVxuICBjb25zdCBsb2dNZXNzYWdlcyA9IFsuLi5uZXcgU2V0KGJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMubG9ncykpXVxuICByZXR1cm4geyBmdW5jcywgYXJyYXlzLCBmRW50cmllcywgYnVpbHRGdW5jcywgZml4LCBsYXlvdXRzLCB0cmFwTWVzc2FnZXMsIGxvZ01lc3NhZ2VzLCBwYWdlczogTWF0aC5tYXgoMSwgTWF0aC5jZWlsKGJ5dGVzIC8gNjU1MzYpKSB9IGFzIE1vZHVsZUFuYWx5c2lzPFQ+XG59XG4iLAogICAgImltcG9ydCB7XG4gIHR5cGUgQW55QXJyYXksIHR5cGUgQW55RXhwciwgdHlwZSBBbnlGdW5jLCB0eXBlIEFyaXRobWV0aWNPcCwgdHlwZSBCaXRPcCwgdHlwZSBDbXBPcCwgdHlwZSBFeHByLFxuICB0eXBlIE1vZHVsZURlZiwgdHlwZSBOdW1UeXBlLCB0eXBlIFJlbWFpbmRlck9wLCB0eXBlIFN0bXQsIHR5cGUgU3RvcmFnZVR5cGUsIGFzU3RtdHMsXG59IGZyb20gXCIuL3dhc21fYXN0XCJcbmltcG9ydCB7IHR5cGUgQXJyYXlMYXlvdXQsIHR5cGUgTW9kdWxlQW5hbHlzaXMgfSBmcm9tIFwiLi93YXNtX2FuYWx5emVcIlxuXG5jb25zdCBtYWdpYyA9IFsweDAwLCAweDYxLCAweDczLCAweDZkLCAweDAxLCAweDAwLCAweDAwLCAweDAwXVxuY29uc3QgcmVzdWx0VHlwZSA9IChyZXN1bHQ6IEFueUZ1bmNbXCJyZXN1bHRcIl0pID0+XG4gIHR5cGVvZiByZXN1bHQgPT09IFwib2JqZWN0XCIgPyByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiIDogcmVzdWx0XG5cbmNvbnN0IG51bWJlckJhc2UgPSB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+XG5jb25zdCBvcGNvZGUgPSAob3A6IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3AgfCBDbXBPcCwgdHlwZTogTnVtVHlwZSkgPT4ge1xuICBjb25zdCBhcml0aG1ldGljID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdLmluZGV4T2Yob3ApXG4gIGlmIChhcml0aG1ldGljID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgYXJpdGhtZXRpY1xuICBjb25zdCBpbnRlZ2VyID0gW1wibW9kXCIsIFwidW1vZFwiLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwiXCIsIFwic2hyXCJdLmluZGV4T2Yob3ApXG4gIGlmIChpbnRlZ2VyID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgNSArIGludGVnZXJcbiAgcmV0dXJuICh7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+KVt0eXBlXVxuICAgICsgKG9wID09PSBcImVxXCIgPyAwIDogb3AgPT09IFwibHRcIiA/IDIgOiB0eXBlWzBdID09PSBcImlcIiA/IDQgOiAzKVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgbG9hZDogeyBpMzI6IDB4MjgsIGk2NDogMHgyOSwgZjMyOiAweDJhLCBmNjQ6IDB4MmIsIGk4OiAweDJjLCB1ODogMHgyZCwgaTE2OiAweDJlLCB1MTY6IDB4MmYgfSBhcyBSZWNvcmQ8U3RvcmFnZVR5cGUsIG51bWJlcj4sXG4gIHN0b3JlOiB7IGkzMjogMHgzNiwgaTY0OiAweDM3LCBmMzI6IDB4MzgsIGY2NDogMHgzOSwgaTg6IDB4M2EsIHU4OiAweDNhLCBpMTY6IDB4M2IsIHUxNjogMHgzYiB9IGFzIFJlY29yZDxTdG9yYWdlVHlwZSwgbnVtYmVyPixcbiAgYWxpZ246IHsgaTg6IDAsIHU4OiAwLCBpMTY6IDEsIHUxNjogMSwgaTMyOiAyLCBmMzI6IDIsIGk2NDogMywgZjY0OiAzIH0gYXMgUmVjb3JkPFN0b3JhZ2VUeXBlLCBudW1iZXI+LFxuICB6ZXJvOiB7IGkzMjogWzB4NDEsIDBdLCBpNjQ6IFsweDQyLCAwXSwgZjMyOiBbMHg0MywgMCwgMCwgMCwgMF0sIGY2NDogWzB4NDQsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcltdPixcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5cbmNvbnN0IGFkZHIgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZSA9IGxheW91dC5lbGVtZW50U2l6ZSwgZmllbGRPZmZzZXQgPSAwKSA9PlxuICBpbmRleC5tdWwoc3RyaWRlKS5hZGQobGF5b3V0Lm9mZnNldCArIGZpZWxkT2Zmc2V0KVxuY29uc3QgbWVtYXJnID0gKHR5cGU6IFN0b3JhZ2VUeXBlLCBvZmZzZXQgPSAwKSA9PiBbLi4udTMyKGNvZGVzLmFsaWduW3R5cGVdKSwgLi4udTMyKG9mZnNldCldXG5jb25zdCBjb25zdEkzMiA9IChlOiBFeHByPFwiaTMyXCI+KSA9PiBlLmtpbmQgPT09IFwiY29uc3RcIiA/IGUudmFsdWUgOiBudWxsXG5jb25zdCBjaGVja0FycmF5Qm91bmRzID0gKGxheW91dDogQXJyYXlMYXlvdXQsIGluZGV4OiBFeHByPFwiaTMyXCI+KSA9PiB7XG4gIGNvbnN0IG4gPSBjb25zdEkzMihpbmRleClcbiAgaWYgKG4gPT0gbnVsbCkgcmV0dXJuXG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCB8fCBuID49IGxheW91dC5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihgQXJyYXkgaW5kZXggJHtufSBvdXQgb2YgYm91bmRzIGZvciBsZW5ndGggJHtsYXlvdXQubGVuZ3RofWApXG59XG5jb25zdCBjaGVja01vdmVCb3VuZHMgPSAobGF5b3V0OiBBcnJheUxheW91dCwgdGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+KSA9PiB7XG4gIGNvbnN0IHZhbHVlcyA9IFtjb25zdEkzMih0YXJnZXQpLCBjb25zdEkzMihzb3VyY2UpLCBjb25zdEkzMihjb3VudCldXG4gIGlmICh2YWx1ZXMuc29tZSh2YWx1ZSA9PiB2YWx1ZSA9PSBudWxsKSkgcmV0dXJuXG4gIGNvbnN0IFt0bywgZnJvbSwgc2l6ZV0gPSB2YWx1ZXMgYXMgbnVtYmVyW11cbiAgaWYgKHRvISA8IDAgfHwgZnJvbSEgPCAwIHx8IHNpemUhIDwgMCB8fCB0byEgKyBzaXplISA+IGxheW91dC5sZW5ndGggfHwgZnJvbSEgKyBzaXplISA+IGxheW91dC5sZW5ndGgpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBBcnJheSBtb3ZlICgke3RvfSwgJHtmcm9tfSwgJHtzaXplfSkgb3V0IG9mIGJvdW5kcyBmb3IgbGVuZ3RoICR7bGF5b3V0Lmxlbmd0aH1gKVxufVxuXG5jb25zdCBtYWtlQ29tcGlsZXIgPSAoXG4gIGZpeDogTWFwPEFueUZ1bmMsIG51bWJlcj4sIGxpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPiwgYXJyYXlzOiBNYXA8QW55QXJyYXksIEFycmF5TGF5b3V0PixcbiAgdHJhcHM6IE1hcDxzdHJpbmcsIG51bWJlcj4sIGxvZ3M6IE1hcDxzdHJpbmcsIG51bWJlcj4sXG4pID0+IHtcbmNvbnN0IGNvbXBpbGVFeHByID0gKGU6IEFueUV4cHIpOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAoZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6XG4gICAgICBpZiAoZS50eXBlID09PSBcImkzMlwiKSByZXR1cm4gWzB4NDEsIC4uLnNOKGUudmFsdWUgYXMgbnVtYmVyLCAzMildXG4gICAgICBpZiAoZS50eXBlID09PSBcImk2NFwiKSByZXR1cm4gWzB4NDIsIC4uLnNOKGUudmFsdWUsIDY0KV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZjMyXCIpIHJldHVybiBbMHg0MywgLi4uZk4oZS52YWx1ZSBhcyBudW1iZXIsIDQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmNjRcIikgcmV0dXJuIFsweDQ0LCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgOCldXG4gICAgICByZXR1cm4gZGllKGUpXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIwLCAuLi51MzIobGl4W2UubG9jYWxdISldXG4gICAgY2FzZSBcImJpblwiOiB7XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQpLCBvcGNvZGUoZS5vcCwgZS50eXBlKV1cbiAgICB9XG4gICAgY2FzZSBcImNtcFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0KSwgb3Bjb2RlKGUub3AsIGUuaW5wdXRUeXBlKV1cbiAgICBjYXNlIFwiY2FsbFwiOlxuICAgICAgcmV0dXJuIFsuLi5mbGF0TWFwKGUuYXJncywgY29tcGlsZUV4cHIpLCAweDEwLCAuLi51MzIoZml4LmdldChlLnRhcmdldCkhICsgMildXG4gICAgY2FzZSBcImNhc3RcIjoge1xuICAgICAgY29uc3QgZnJvbSA9IGUuaW5wdXRUeXBlIGFzIE51bVR5cGVcbiAgICAgIGNvbnN0IHRvID0gZS50eXBlIGFzIE51bVR5cGVcbiAgICAgIGxldCBvcGNvZGU6IG51bWJlciB8IHVuZGVmaW5lZFxuICAgICAgaWYgKHRvID09PSBcImkzMlwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YTdcbiAgICAgIGlmICh0byA9PT0gXCJpNjRcIiAmJiBmcm9tID09PSBcImkzMlwiKSBvcGNvZGUgPSBlLnVuc2lnbmVkID8gMHhhZCA6IDB4YWNcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImkzMlwiKSBvcGNvZGUgPSAweGIyXG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhiNFxuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiZjY0XCIpIG9wY29kZSA9IDB4YjZcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImkzMlwiKSBvcGNvZGUgPSAweGI3XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhiOVxuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiZjMyXCIpIG9wY29kZSA9IDB4YmJcbiAgICAgIGlmIChvcGNvZGUgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjYXN0ICR7ZnJvbX0gLT4gJHt0b31gKVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLnZhbHVlKSwgb3Bjb2RlXVxuICAgIH1cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5jb25kKSwgMHgwNCwgY29kZXMudHlwZVtlLnR5cGUgYXMgTnVtVHlwZV0sIC4uLmNvbXBpbGVFeHByKGUudGhlbiksIDB4MDUsIC4uLmNvbXBpbGVFeHByKGUuZWxzZSksIDB4MGJdXG4gICAgY2FzZSBcImxvYWRcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzLmdldChlLmFycmF5KVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke2UuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBlLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgZS5pbmRleCwgZS5zdHJpZGUsIGUub2Zmc2V0KSksIGNvZGVzLmxvYWRbZS5zdG9yYWdlIGFzIFN0b3JhZ2VUeXBlXSwgLi4ubWVtYXJnKGUuc3RvcmFnZSBhcyBTdG9yYWdlVHlwZSldXG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKGUpXG4gIH1cbn1cblxudHlwZSBMYWJlbEZyYW1lID0geyBjb250cm9sPzogbnVtYmVyLCBraW5kPzogXCJicmVha1wiIHwgXCJjb250aW51ZVwiIH1cbmNvbnN0IGRlcHRoID0gKHN0YWNrOiBMYWJlbEZyYW1lW10sIGNvbnRyb2w6IG51bWJlciwga2luZDogTm9uTnVsbGFibGU8TGFiZWxGcmFtZVtcImtpbmRcIl0+KSA9PiB7XG4gIGNvbnN0IGkgPSBzdGFjay5maW5kSW5kZXgoeCA9PiB4LmNvbnRyb2wgPT09IGNvbnRyb2wgJiYgeC5raW5kID09PSBraW5kKVxuICBpZiAoaSA8IDApIHRocm93IG5ldyBFcnJvcihgVW5rbm93biAke2tpbmR9IHRhcmdldCAke2NvbnRyb2x9YClcbiAgcmV0dXJuIGlcbn1cblxuY29uc3QgY29tcGlsZVN0bXQgPSAoczogU3RtdCwgc3RhY2s6IExhYmVsRnJhbWVbXSA9IFtdKTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MjEsIC4uLnUzMihsaXhbcy5sb2NhbF0hKV1cbiAgICBjYXNlIFwiYXJyYXkuc3RvcmVcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzLmdldChzLmFycmF5KVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBzLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5pbmRleCwgcy5zdHJpZGUsIHMub2Zmc2V0KSksIC4uLmNvbXBpbGVFeHByKHMudmFsdWUpLCBjb2Rlcy5zdG9yZVtzLnR5cGVdLCAuLi5tZW1hcmcocy50eXBlKV1cbiAgICB9XG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzLmdldChzLmFycmF5KVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrTW92ZUJvdW5kcyhsYXlvdXQsIHMudGFyZ2V0LCBzLnNvdXJjZSwgcy5jb3VudClcbiAgICAgIHJldHVybiBbXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLnRhcmdldCkpLFxuICAgICAgICAuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5zb3VyY2UpKSxcbiAgICAgICAgLi4uY29tcGlsZUV4cHIocy5jb3VudC5tdWwobGF5b3V0LmVsZW1lbnRTaXplKSksXG4gICAgICAgIDB4ZmMsIDB4MGEsIDB4MDAsIDB4MDAsXG4gICAgICBdXG4gICAgfVxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmNvbmQpLCAweDA0LCAweDQwLCAuLi5mbGF0TWFwKHMudGhlbiwgeCA9PiBjb21waWxlU3RtdCh4LCBbe30sIC4uLnN0YWNrXSkpLCAuLi4ocy5lbHNlLmxlbmd0aCA/IFsweDA1LCAuLi5mbGF0TWFwKHMuZWxzZSwgeCA9PiBjb21waWxlU3RtdCh4LCBbe30sIC4uLnN0YWNrXSkpXSA6IFtdKSwgMHgwYl1cbiAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgLi4uZmxhdE1hcChzLmJvZHksIHggPT4gY29tcGlsZVN0bXQoeCwgW3sgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGJdXG4gICAgY2FzZSBcImxvb3BcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgMHgwMywgMHg0MCwgLi4uY29tcGlsZUV4cHIocy5jb25kKSwgMHg0NSwgMHgwZCwgLi4udTMyKDEpLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiY29udGludWVcIiB9LCB7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJicmVha1wiIH0sIC4uLnN0YWNrXSkpLCAweDBjLCAuLi51MzIoMCksIDB4MGIsIDB4MGJdXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiYnJlYWtUbygpIHVzZWQgb3V0c2lkZSBhIGJsb2NrIG9yIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJicmVha1wiKSldXG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJjb250aW51ZVwiKSldXG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi4ocy52YWx1ZSA/IGNvbXBpbGVFeHByKHMudmFsdWUpIDogW10pLCAweDBmXVxuICAgIGNhc2UgXCJ0cmFwXCI6XG4gICAgICByZXR1cm4gWzB4NDEsIC4uLnNOKHRyYXBzLmdldChzLm1lc3NhZ2UpISwgMzIpLCAweDEwLCAweDAwXVxuICAgIGNhc2UgXCJsb2dcIjpcbiAgICAgIHJldHVybiBbMHg0MSwgLi4uc04obG9ncy5nZXQocy5tZXNzYWdlKSEsIDMyKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MTAsIDB4MDFdXG4gICAgY2FzZSBcImNhbGwudm9pZFwiOlxuICAgICAgcmV0dXJuIFsuLi5mbGF0TWFwKHMuYXJncywgY29tcGlsZUV4cHIpLCAweDEwLCAuLi51MzIoZml4LmdldChzLnRhcmdldCkhICsgMildXG4gICAgY2FzZSBcImV4cHJcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy5leHByKSwgMHgxYV1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGRpZShzKVxuICB9XG59XG5yZXR1cm4geyBleHByOiBjb21waWxlRXhwciwgc3RtdDogY29tcGlsZVN0bXQgfVxufVxuXG5cbmV4cG9ydCBjb25zdCBlbWl0TW9kdWxlID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KHsgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXMgfTogTW9kdWxlQW5hbHlzaXM8VD4pID0+IHtcbiAgY29uc3QgdHJhcHMgPSBuZXcgTWFwKHRyYXBNZXNzYWdlcy5tYXAoKG1lc3NhZ2UsIGlkKSA9PiBbbWVzc2FnZSwgaWRdKSlcbiAgY29uc3QgbG9ncyA9IG5ldyBNYXAobG9nTWVzc2FnZXMubWFwKChtZXNzYWdlLCBpZCkgPT4gW21lc3NhZ2UsIGlkXSkpXG4gIGNvbnN0IGZ1bmN0aW9uU2VjdGlvbiA9IGJ1aWx0RnVuY3MuZmxhdE1hcCgoXywgaSkgPT4gdTMyKGkgKyAyKSlcbiAgY29uc3QgZXhwb3J0U2VjdGlvbiA9IGZFbnRyaWVzLmZsYXRNYXAoKFtuYW1lLCBmdW5jXSkgPT4gWy4uLnN0cihuYW1lKSwgMHgwMCwgLi4udTMyKGZpeC5nZXQoZnVuYykhICsgMildKVxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW1xuICAgIC4uLm1hZ2ljLFxuICAgIC4uLnNlY3Rpb24oMHgwMSwgWy4uLnUzMihidWlsdEZ1bmNzLmxlbmd0aCArIDIpLFxuICAgICAgMHg2MCwgMHgwMSwgY29kZXMudHlwZS5pMzIsIDB4MDAsXG4gICAgICAweDYwLCAweDAyLCBjb2Rlcy50eXBlLmkzMiwgY29kZXMudHlwZS5pMzIsIDB4MDAsXG4gICAgICAuLi5mbGF0TWFwKGJ1aWx0RnVuY3MsICh7IGZ1bmMgfSkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRUeXBlKGZ1bmMucmVzdWx0KVxuICAgICAgICByZXR1cm4gWzB4NjAsIC4uLnUzMihmdW5jLnBhcmFtcy5sZW5ndGgpLCAuLi5mdW5jLnBhcmFtcy5tYXAodCA9PiBjb2Rlcy50eXBlW3RdKSwgLi4uKHJlc3VsdCA9PT0gXCJ2b2lkXCIgPyBbMHgwMF0gOiBbMHgwMSwgY29kZXMudHlwZVtyZXN1bHRdXSldXG4gICAgICB9KV0pLFxuICAgIC4uLnNlY3Rpb24oMHgwMiwgW1xuICAgICAgMHgwMyxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcInRyYXBcIiksXG4gICAgICAweDAwLFxuICAgICAgMHgwMCxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcImxvZ1wiKSxcbiAgICAgIDB4MDAsXG4gICAgICAweDAxLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwibWVtb3J5XCIpLFxuICAgICAgMHgwMixcbiAgICAgIDB4MDMsXG4gICAgICAuLi51MzIocGFnZXMpLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICBdKSxcbiAgICAuLi5zZWN0aW9uKDB4MDMsIFsuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGgpLCAuLi5mdW5jdGlvblNlY3Rpb25dKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZXhwb3J0U2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgYnVpbHQsIGxvY2FscywgbG9jYWxJbmRleGVzIH0pID0+IHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBtYWtlQ29tcGlsZXIoZml4LCBsb2NhbEluZGV4ZXMsIGxheW91dHMsIHRyYXBzLCBsb2dzKVxuICAgICAgICBjb25zdCBzdG10cyA9IGFzU3RtdHMoYnVpbHQpXG4gICAgICAgIGNvbnN0IGRlY2xzID0gWy4uLnUzMihsb2NhbHMubGVuZ3RoKSwgLi4uZmxhdE1hcChsb2NhbHMsIChbLCB0eXBlXSkgPT4gWy4uLnUzMigxKSwgY29kZXMudHlwZVt0eXBlXV0pXVxuICAgICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRUeXBlKGZ1bmMucmVzdWx0KVxuICAgICAgICBjb25zdCBjb2RlID0gc3RtdHNcbiAgICAgICAgICA/IFsuLi5mbGF0TWFwKHN0bXRzLCBzID0+IGNvbXBpbGVyLnN0bXQocykpLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFtdIDogY29kZXMuemVyb1tyZXN1bHRdKV1cbiAgICAgICAgICA6IGNvbXBpbGVyLmV4cHIoYnVpbHQgYXMgQW55RXhwcilcbiAgICAgICAgY29uc3QgYm9keSA9IFsuLi5kZWNscywgLi4uY29kZSwgMHgwYl1cbiAgICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgICAgfSksXG4gICAgXSksXG4gIF0pXG59XG4iLAogICAgImV4cG9ydCAqIGZyb20gXCIuL3dhc21fYXN0XCJcbmV4cG9ydCB7IGZvcm1hdE1vZHVsZSB9IGZyb20gXCIuL3dhc21fZm9ybWF0XCJcblxuaW1wb3J0IHsgYW5hbHl6ZU1vZHVsZSB9IGZyb20gXCIuL3dhc21fYW5hbHl6ZVwiXG5pbXBvcnQgeyBlbWl0TW9kdWxlIH0gZnJvbSBcIi4vd2FzbV9jb2RlZ2VuXCJcbmltcG9ydCB0eXBlIHtcbiAgQW55QXJyYXksIEFueUZ1bmMsIENvbXBpbGVSZXN1bHQsIEpTU3RydWN0LCBNb2R1bGVEZWYsIFN0cnVjdEZpZWxkcywgU3RydWN0VHlwZSxcbn0gZnJvbSBcIi4vd2FzbV9hc3RcIlxuXG5jb25zdCBhcnJheUN0b3JzID0ge1xuICBpODogSW50OEFycmF5LCB1ODogVWludDhBcnJheSwgaTE2OiBJbnQxNkFycmF5LCB1MTY6IFVpbnQxNkFycmF5LFxuICBpMzI6IEludDMyQXJyYXksIGk2NDogQmlnSW50NjRBcnJheSwgZjMyOiBGbG9hdDMyQXJyYXksIGY2NDogRmxvYXQ2NEFycmF5LFxuICBzdTg6IFVpbnQ4QXJyYXksIHN1MTY6IFVpbnQxNkFycmF5LCBzaTMyOiBVaW50MzJBcnJheSwgc2k2NDogQmlnVWludDY0QXJyYXksXG59XG5cbmV4cG9ydCBjb25zdCBkZWNvZGVTdHJ1Y3QgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgcmF3OiBudW1iZXIgfCBiaWdpbnQpOiBKU1N0cnVjdDxGPiA9PiB7XG4gIGNvbnN0IHBhY2tlZCA9IEJpZ0ludC5hc1VpbnROKHR5cGUuc2l6ZSAqIDgsIEJpZ0ludChyYXcpKVxuICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHR5cGUubGF5b3V0KS5tYXAoKFtuYW1lLCBmaWVsZF0pID0+IHtcbiAgICBjb25zdCBtYXNrID0gKDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzKSkgLSAxblxuICAgIGxldCB2YWx1ZSA9IChwYWNrZWQgPj4gQmlnSW50KGZpZWxkLmJpdE9mZnNldCkpICYgbWFza1xuICAgIGlmIChmaWVsZC5zdG9yYWdlLnN0YXJ0c1dpdGgoXCJpXCIpICYmIHZhbHVlICYgKDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzIC0gMSkpKVxuICAgICAgdmFsdWUgLT0gMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpXG4gICAgcmV0dXJuIFtuYW1lLCBmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiID8gdmFsdWUgOiBOdW1iZXIodmFsdWUpXVxuICB9KSkgYXMgSlNTdHJ1Y3Q8Rj5cbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBpbGUgPSBhc3luYyA8VCBleHRlbmRzIE1vZHVsZURlZj4oXG4gIG1vZDogVCxcbik6IFByb21pc2U8Q29tcGlsZVJlc3VsdDxUPj4gPT4ge1xuICBjb25zdCBhbmFseXNpcyA9IGFuYWx5emVNb2R1bGUobW9kKVxuICBjb25zdCBtZW1vcnkgPSBuZXcgV2ViQXNzZW1ibHkuTWVtb3J5KHtcbiAgICBpbml0aWFsOiBhbmFseXNpcy5wYWdlcyxcbiAgICBtYXhpbXVtOiBhbmFseXNpcy5wYWdlcyxcbiAgICBzaGFyZWQ6IHRydWUsXG4gIH0pXG4gIGNvbnN0IGNvbXBpbGVkID0gYXdhaXQgV2ViQXNzZW1ibHkuY29tcGlsZShlbWl0TW9kdWxlKGFuYWx5c2lzKS5idWZmZXIpXG4gIGNvbnN0IHRyYXAgPSAoaWQ6IG51bWJlcik6IG5ldmVyID0+IHsgdGhyb3cgbmV3IEVycm9yKGFuYWx5c2lzLnRyYXBNZXNzYWdlc1tpZF0gPz8gYFVua25vd24gV0FTTSB0cmFwICR7aWR9YCkgfVxuICBjb25zdCBsb2cgPSAoaWQ6IG51bWJlciwgdmFsdWU6IG51bWJlcikgPT4gY29uc29sZS5sb2coYW5hbHlzaXMubG9nTWVzc2FnZXNbaWRdID8/IGBXQVNNIGxvZyAke2lkfWAsIHZhbHVlKVxuICBjb25zdCBpbnN0YW5jZSA9IGF3YWl0IFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlKGNvbXBpbGVkLCB7IGVudjogeyBtZW1vcnksIHRyYXAsIGxvZyB9IH0pXG4gIGNvbnN0IGZ1bmNFbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoYW5hbHlzaXMuZnVuY3MpIGFzIFtzdHJpbmcsIEFueUZ1bmNdW11cbiAgY29uc3QganNGdW5jczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fSwgcmVzdWx0U3RydWN0czogUmVjb3JkPHN0cmluZywgU3RydWN0VHlwZTxhbnk+PiA9IHt9XG4gIGZvciAoY29uc3QgW25hbWUsIGZ1bmNdIG9mIGZ1bmNFbnRyaWVzKSB7XG4gICAgY29uc3Qgd2FzbUZ1bmMgPSBpbnN0YW5jZS5leHBvcnRzW25hbWVdIGFzICguLi5hcmdzOiB1bmtub3duW10pID0+IG51bWJlciB8IGJpZ2ludFxuICAgIGpzRnVuY3NbbmFtZV0gPSB3YXNtRnVuY1xuICAgIGlmICh0eXBlb2YgZnVuYy5yZXN1bHQgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJlc3VsdFN0cnVjdHNbbmFtZV0gPSBmdW5jLnJlc3VsdFxuICAgICAganNGdW5jc1tuYW1lXSA9ICguLi5hcmdzOiB1bmtub3duW10pID0+IGRlY29kZVN0cnVjdChmdW5jLnJlc3VsdCBhcyBTdHJ1Y3RUeXBlPGFueT4sIHdhc21GdW5jKC4uLmFyZ3MpKVxuICAgIH1cbiAgfVxuICBjb25zdCBqc0FycmF5cyA9IChPYmplY3QuZW50cmllcyhhbmFseXNpcy5hcnJheXMpIGFzIFtzdHJpbmcsIEFueUFycmF5XVtdKS5tYXAoKFtuYW1lLCBhcnJdKSA9PiB7XG4gICAgY29uc3QgbGF5b3V0ID0gYW5hbHlzaXMubGF5b3V0cy5nZXQoYXJyKSFcbiAgICBjb25zdCBrZXkgPSB0eXBlb2YgYXJyLnR5cGUgPT09IFwic3RyaW5nXCIgPyBhcnIudHlwZSA6IGBzJHthcnIudHlwZS5zdG9yYWdlfWBcbiAgICBjb25zdCBDdG9yID0gYXJyYXlDdG9yc1trZXkgYXMga2V5b2YgdHlwZW9mIGFycmF5Q3RvcnNdXG4gICAgcmV0dXJuIFtuYW1lLCBuZXcgQ3RvcihtZW1vcnkuYnVmZmVyLCBsYXlvdXQub2Zmc2V0LCBhcnIubGVuZ3RoKV0gYXMgY29uc3RcbiAgfSlcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oanNGdW5jcywgT2JqZWN0LmZyb21FbnRyaWVzKGpzQXJyYXlzKSwge1xuICAgIG1vZDogY29tcGlsZWQsIG1lbW9yeSwgcmVzdWx0U3RydWN0cyxcbiAgICB0cmFwTWVzc2FnZXM6IGFuYWx5c2lzLnRyYXBNZXNzYWdlcywgbG9nTWVzc2FnZXM6IGFuYWx5c2lzLmxvZ01lc3NhZ2VzLFxuICB9KSBhcyBDb21waWxlUmVzdWx0PFQ+XG59XG4iLAogICAgImltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCJcbmltcG9ydCB7IGFycmF5LCBjb21waWxlLCBmdW5jLCBpMzIsIGlmRWxzZSwgbGl0LCBsb2NhbCwgbG9nLCByZXQsIHN0cnVjdCwgdHJhcCwgdW1vZCwgdHlwZSBBbnlBcnJheSwgdHlwZSBFeHByLCB0eXBlIEV4cHJMaWtlLCB0eXBlIFN0bXQsIHR5cGUgU3RtdEJvZHkgfSBmcm9tIFwiLi4vd2FzbVwiXG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiXG5cbmNvbnN0IE5XT1JLRVJTID0gNFxuY29uc3QgUkFORFNUUklERSA9IDE2XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhbm5lYWxpbmdXYXNtKHBsYW5uZXI6IE1vZHVsZSk6IFByb21pc2U8QW5uZWFsaW5nUmVzdWx0PiB7XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihwbGFubmVyLk5SRVFTIC8gcGxhbm5lci5OVFJBTlMgKiAyLjUgKiAyICsgMTApXG4gIGNvbnN0IFNUT1AgPSBzdHJ1Y3Qoe1xuICAgIHJlcV9pZDogW1widTE2XCIsIDEwXSxcbiAgICBpc19sb2FkOiBbXCJ1OFwiLCAxXSxcbiAgICBkZWNrOiBbXCJ1OFwiLCAxXSxcbiAgfSlcbiAgY29uc3QgUkVRID0gc3RydWN0KHtcbiAgICBzdGFydDogXCJ1MTZcIixcbiAgICBlbmQ6IFwidTE2XCIsXG4gICAgdmFsdWU6IFwidTE2XCIsXG4gICAgZGVhZGxpbmU6IFwidTE2XCIsXG4gIH0pXG5cbiAgY29uc3QgcmFuZFN0YXRlID0gYXJyYXkoXCJpMzJcIiwgTldPUktFUlMgKiBSQU5EU1RSSURFKVxuICBjb25zdCBkaXN0cyA9IGFycmF5KFwiaTMyXCIsIHBsYW5uZXIuUlNJWkUpXG4gIGNvbnN0IHJlcXVlc3RzID0gYXJyYXkoUkVRLCBwbGFubmVyLk5SRVFTKVxuICBjb25zdCBhc3NpZ25lZCA9IGFycmF5KFwidThcIiwgcGxhbm5lci5OUkVRUylcbiAgY29uc3Qgc2NoZWR1bGUgPSBhcnJheShTVE9QLCBwbGFubmVyLk5UUkFOUyAqIFRTSVpFKVxuICBjb25zdCBzY2hlZF9zaXplID0gYXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHRyYW5fcG9zaXRpb25zID0gYXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG5cbiAgY29uc3QgcmFuZE5leHQgPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgZ2lkID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgcmV0dXJuIFtcbiAgICAgIHZhbHVlLnNldChyYW5kU3RhdGUuYXQoZ2lkLm11bChSQU5EU1RSSURFKSkpLFxuICAgICAgdmFsdWUuc2V0KHZhbHVlLnhvcih2YWx1ZS5zaGwoMTMpKSksXG4gICAgICB2YWx1ZS5zZXQodmFsdWUueG9yKHZhbHVlLnNocigxNykpKSxcbiAgICAgIHZhbHVlLnNldCh2YWx1ZS54b3IodmFsdWUuc2hsKDUpKSksXG4gICAgICByYW5kU3RhdGUuYXQoZ2lkLm11bChSQU5EU1RSSURFKSkuc2V0KHZhbHVlKSxcbiAgICAgIHJldCh2YWx1ZSksXG4gICAgXVxuICB9KVxuICBjb25zdCByYW5kaW50ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChnaWQsIG1heCkgPT4gdW1vZChyYW5kTmV4dC5jYWxsKGdpZCksIG1heCkpXG5cbiAgbGV0IERFQlVHID0gdHJ1ZVxuXG4gIGZ1bmN0aW9uIGRlYnVnICh0YWc6IHN0cmluZywgdmFsdWU6IEV4cHJMaWtlPFwiaTMyXCI+KXtcbiAgICBpZiAoIURFQlVHKSByZXR1cm4gW11cbiAgICByZXR1cm4gW1xuICAgICAgbG9nKHRhZywgdmFsdWUpXG4gICAgXVxuICB9XG5cblxuICBjb25zdCBib3VuZHNDaGVjayA9IChhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+ID0gMSk6IFN0bXQgPT4ge1xuICAgIGNvbnN0IGkgPSBsaXQoXCJpMzJcIiwgaW5kZXgpLCBuID0gbGl0KFwiaTMyXCIsIGNvdW50KVxuICAgIHJldHVybiBpZkVsc2UoaS5sdCgwKS5vcihuLmx0KDApKS5vcihuLmd0KGFycmF5Lmxlbmd0aCkpLm9yKGkuZ3QoaTMyKGFycmF5Lmxlbmd0aCkuc3ViKG4pKSksIHRyYXAoXCJhcnJheSBib3VuZHMgZXhjZWVkZWRcIikpXG4gIH1cblxuXG4gIGNvbnN0IHRyeUFzc2lnbiA9IGZ1bmMoW10sIFwidm9pZFwiLCAoKSA9PiB7XG4gICAgY29uc3QgdHJhbiA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgcmVxX2lkID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBBID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBCID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0bXAgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHRzaXplID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0b2Zmc2V0ID0gbG9jYWwoXCJpMzJcIilcblxuXG4gICAgY29uc3Qgc2NoZWRWaWV3ID0ge1xuICAgICAgbW92ZTogKHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPik6IFN0bXRCb2R5ID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUodG9mZnNldC5hZGQodGFyZ2V0KSwgdG9mZnNldC5hZGQoc291cmNlKSwgY291bnQpLFxuICAgICAgYXQ6IChpbmRleDogRXhwcjxcImkzMlwiPikgPT4gc2NoZWR1bGUuYXQodG9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuXG5cbiAgICAgIHRyYW4uc2V0KHJhbmRpbnQuY2FsbCgwLCBwbGFubmVyLk5UUkFOUykpLFxuICAgICAgcmVxX2lkLnNldChyYW5kaW50LmNhbGwoMCwgcGxhbm5lci5OUkVRUykpLFxuICAgICAgaWZFbHNlKGFzc2lnbmVkLmF0KHJlcV9pZCkuZXEoMSksIHJldCgpLCBhc3NpZ25lZC5hdChyZXFfaWQpLnNldCgxKSksXG4gICAgICB0b2Zmc2V0LnNldCh0cmFuLm11bChUU0laRSkpLFxuICAgICAgdHNpemUuc2V0KHNjaGVkX3NpemUuYXQodHJhbikpLFxuICAgICAgaWZFbHNlKHRzaXplLmd0KFRTSVpFIC0gMiksIHRyYXAoXCJzY2hlZHVsZSBjYXBhY2l0eSBleGNlZWRlZFwiKSksXG4gICAgICBBLnNldChyYW5kaW50LmNhbGwoMCwgdHNpemUuYWRkKDEpKSksXG4gICAgICBCLnNldChyYW5kaW50LmNhbGwoMCwgdHNpemUuYWRkKDEpKSksXG4gICAgICBpZkVsc2UoQS5ndChCKSwgW3RtcC5zZXQoQSksIEEuc2V0KEIpLCBCLnNldCh0bXApXSksXG4gICAgICBzY2hlZFZpZXcubW92ZShCLmFkZCgyKSwgQiwgdHNpemUuc3ViKEIpKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEEuYWRkKDEpLCBBLCBCLnN1YihBKSksXG4gICAgICB0bXAuc2V0KHJhbmRpbnQuY2FsbCgwLCAyKSksXG4gICAgICBzY2hlZFZpZXcuYXQoQSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAxLCBkZWNrOiB0bXAgfSksXG4gICAgICBzY2hlZFZpZXcuYXQoQi5hZGQoMSkpLnNldCh7IHJlcV9pZCwgaXNfbG9hZDogMCwgZGVjazogdG1wIH0pLFxuICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQodHNpemUuYWRkKDIpKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgYWRkUmVxdWVzdCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLCBcInZvaWRcIixcbiAgICAocmVxbiwgc3RhcnQsIGVuZCwgdmFsdWUsIGRlYWRsaW5lKSA9PlxuICAgICAgcmVxdWVzdHMuYXQocmVxbikuc2V0KHsgc3RhcnQsIGVuZCwgdmFsdWUsIGRlYWRsaW5lIH0pLFxuICApXG4gIGNvbnN0IHNlYXJjaCA9IGZ1bmMoW10sIFwidm9pZFwiLCAoKSA9PiBbXG5cbiAgICBkZWJ1ZyhcImRlYnVnZ2VyIG9uLlwiLCAwKSxcblxuICAgIHRyeUFzc2lnbi5jYWxsKCksXG4gICAgdHJ5QXNzaWduLmNhbGwoKSxcbiAgICB0cnlBc3NpZ24uY2FsbCgpLFxuICBdKVxuICBjb25zdCBnZXRTdG9wID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFNUT1AsXG4gICAgKHRyYW4sIGluZGV4KSA9PiBzY2hlZHVsZS5hdCh0cmFuLm11bChUU0laRSkuYWRkKGluZGV4KSksXG4gIClcblxuICBjb25zdCB3YXNtID0gYXdhaXQgY29tcGlsZSh7XG4gICAgYWRkUmVxdWVzdCxcbiAgICBhc3NpZ25lZCxcbiAgICBkaXN0cyxcbiAgICBnZXRTdG9wLFxuICAgIHJhbmRTdGF0ZSxcbiAgICBzY2hlZHVsZSxcbiAgICBzZWFyY2gsXG4gICAgc2NoZWRfc2l6ZSxcbiAgICB0cmFuX3Bvc2l0aW9ucyxcbiAgfSlcblxuICB3YXNtLmRpc3RzLnNldChwbGFubmVyLnJvYWRtYXAuQ29zdE1hdHJpeClcbiAgd2FzbS5yYW5kU3RhdGUuc2V0KEFycmF5LmZyb20oeyBsZW5ndGg6IE5XT1JLRVJTICogMiB9LCAoXywgaSkgPT4gaSArIDEpKVxuICB3YXNtLnRyYW5fcG9zaXRpb25zLnNldChwbGFubmVyLnN0YXJ0cG9zaXRpb25zKVxuICBwbGFubmVyLnJlcXVlc3RzLmZvckVhY2goKHJlcXVlc3QsIGkpID0+XG4gICAgd2FzbS5hZGRSZXF1ZXN0KGksIHJlcXVlc3Quc3RhcnRQb2ludCwgcmVxdWVzdC5lbmRQb2ludCwgcmVxdWVzdC52YWx1ZV9ldXIsIHJlcXVlc3QuZGVhZGxpbmVfaCksXG4gIClcblxuICBjb25zdCBzdGFydGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICB3YXNtLnNlYXJjaCgpXG4gIGNvbnN0IGVsYXBzZWRNcyA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZEF0XG4gIGNvbnN0IHJlc3VsdFNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KHBsYW5uZXIuTlRSQU5TICogVFNJWkUpXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgcGxhbm5lci5OVFJBTlM7IHRyYW4rKykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2FzbS5zY2hlZF9zaXplW3RyYW5dITsgaSsrKSB7XG4gICAgICBjb25zdCBzdG9wID0gd2FzbS5nZXRTdG9wKHRyYW4sIGkpXG4gICAgICByZXN1bHRTY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSA9IHN0b3AuaXNfbG9hZCB8IHN0b3AuZGVjayA8PCAxIHwgc3RvcC5yZXFfaWQgPDwgMlxuICAgIH1cbiAgfVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShwbGFubmVyLk5SRVFTKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHVuYXNzaWduZWQubGVuZ3RoOyBpKyspIHVuYXNzaWduZWRbaV0gPSB3YXNtLmFzc2lnbmVkW2ldID8gMCA6IDFcbiAgY29uc3Qgc2NoZWR1bGVSYXRpbmdzID0gbmV3IEludDMyQXJyYXkocGxhbm5lci5OVFJBTlMpXG5cbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogcmVzdWx0U2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogbmV3IFVpbnQxNkFycmF5KHdhc20uc2NoZWRfc2l6ZSksXG4gICAgdHJhblN0YXJ0OiBuZXcgVWludDE2QXJyYXkocGxhbm5lci5zdGFydHBvc2l0aW9ucyksXG4gICAgVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzLFxuICAgIHVuYXNzaWduZWQsXG4gICAgZWxhcHNlZE1zLFxuICAgIHRvdGFsU2NvcmU6IDAsXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgYnV0dG9uLCBjb2xvciwgZGl2LCBwLCBwb3B1cCwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdGgsIHRyIH0gZnJvbSBcIi4uL3ZpZXcvaHRtbFwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzIH0gZnJvbSBcIi4uL3ZpZXcvbWFpblwiO1xuaW1wb3J0IHsgYmFzZWxpbmVBbm5lYWxpbmcsIHR5cGUgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24sIGltcHJvdmVkQW5uZWFsaW5nLCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB9IGZyb20gXCIuL2FubmVhbGluZ19pbXByb3ZlZFwiO1xuaW1wb3J0IHsgYW5uZWFsaW5nV2FzbSB9IGZyb20gXCIuL2FubmVhbGluZ193YXNtXCI7XG5pbXBvcnQgeyBnZXREZWNrLCBnZXRSZXEsIGlzTG9hZCB9IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBTb2x2ZXIgPSAobW9kOiBNb2R1bGUpID0+IEFubmVhbGluZ1Jlc3VsdDtcblxuY29uc3QgQUNUSVZFX1NPTFZFUl9OQU1FID0gXCJpbXByb3ZlZFwiO1xuY29uc3QgS01fQ09TVCA9IDAuNTtcbmNvbnN0IEFWR19TUEVFRF9LTUggPSA2MDtcbmNvbnN0IFJFT1JHX0NPU1RfRVVSID0gMTAwO1xuXG5sZXQgYW5uZWFsZXI6IEFubmVhbGluZ1Jlc3VsdCB8IG51bGwgPSBudWxsO1xubGV0IGFubmVhbGluZ1Nlc3Npb246IEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB8IG51bGwgPSBudWxsO1xubGV0IGFubmVhbGluZ1RpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbmxldCBsaXZlUmVuZGVyOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIHBsYW5uZXJWaWV3KG1vZDogTW9kdWxlKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBvdXRlckJvcmRlciA9IFwiMXB4IHNvbGlkIFwiICsgY29sb3IuZ3JheTtcbiAgY29uc3QgaW5uZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmxpZ2h0Z3JheTtcbiAgY29uc3QgY2VsbFBhZGRpbmcgPSBcIi4zNWVtIC41ZW1cIjtcbiAgY29uc3Qgc2NoZWR1bGVDZWxsTWluSGVpZ2h0ID0gXCIyLjFlbVwiO1xuXG4gIGlmIChhbm5lYWxpbmdTZXNzaW9uID09IG51bGwpIHtcbiAgICBhbm5lYWxpbmdTZXNzaW9uID0gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZCwgMV85MDBfMDAwKTtcbiAgICBhbm5lYWxlciA9IGFubmVhbGluZ1Nlc3Npb24uaXRlcmF0ZUZvck1zKDEwKTtcbiAgfSBlbHNlIGlmIChhbm5lYWxlciA9PSBudWxsKSB7XG4gICAgYW5uZWFsZXIgPSBhbm5lYWxpbmdTZXNzaW9uLmdldFJlc3VsdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXRlbUJ1dHRvbihpdGVtOiBudW1iZXIsIGxvYWQ/OiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVxID0gbW9kLnJlcXVlc3RzW2l0ZW1dITtcbiAgICBjb25zdCBzcCA9IHNwYW4oXG4gICAgICBpdGVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMywgXCIgXCIpLFxuICAgICAgc3R5bGUoe1xuICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICBib3JkZXI6IFwiMnB4IHNvbGlkIHRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuMmVtXCIsXG4gICAgICAgIHdoaXRlU3BhY2U6IFwicHJlXCIsXG4gICAgICAgIGZvbnRGYW1pbHk6IFwibW9ub3NwYWNlXCIsXG4gICAgICB9KSxcbiAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9wdXAoXG4gICAgICAgICAgcChcIml0ZW0gXCIsIGl0ZW0pLFxuICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgdHIoY2VsbChcInN0YXR1c1wiKSwgY2VsbChsb2FkID8gXCJsb2FkXCIgOiBsb2FkID09PSBmYWxzZSA/IFwidW5sb2FkXCIgOiBcInVuYXNzaWduZWRcIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcInZhbHVlXCIpLCBjZWxsKHJlcS52YWx1ZV9ldXIgKyBcIuKCrFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGlzdFwiKSwgY2VsbChtb2Qucm9hZG1hcC5nZXRDb3N0TihyZXEuc3RhcnRQb2ludCwgcmVxLmVuZFBvaW50KSArIFwia21cIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcImRlYWRsaW5lXCIpLCBjZWxsKHJlcS5kZWFkbGluZV9oLnRvRml4ZWQoMikgKyBcImhcIikpLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICk7XG5cbiAgICBsZXQgcG9pbnRzID0gW1xuICAgICAgeyBudW1iZXI6IHJlcS5zdGFydFBvaW50LCBsb2dvOiBcIvCfk6ZcIiB9LFxuICAgICAgeyBudW1iZXI6IHJlcS5lbmRQb2ludCwgbG9nbzogXCLwn4+gXCIgfSxcbiAgICBdO1xuXG4gICAgaWYgKGxvYWQgPT09IHRydWUpIHBvaW50cyA9IFtwb2ludHNbMF0hXTtcbiAgICBpZiAobG9hZCA9PT0gZmFsc2UpIHBvaW50cyA9IFtwb2ludHNbMV0hXTtcblxuICAgIHNwLm9ubW91c2VlbnRlciA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gY29sb3IuZ3JlZW47XG4gICAgICBoaWdodExpZ2h0cy5zZXQoW3sgcG9pbnRzIH1dKTtcbiAgICB9O1xuICAgIHNwLm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gXCJ0cmFuc3BhcmVudFwiO1xuICAgIH07XG4gICAgcmV0dXJuIHNwO1xuICB9XG5cbiAgY29uc3QgY2VsbDogdHlwZW9mIHRkID0gKC4uLngpID0+IHRkKHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksIC4uLngpO1xuICBjb25zdCBjb250cm9scyA9IGRpdihzdHlsZSh7IGRpc3BsYXk6IFwiZmxleFwiLCBnYXA6IFwiLjVlbVwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBmbGV4V3JhcDogXCJ3cmFwXCIgfSkpO1xuICBjb25zdCBzY29yZUxpbmUgPSBwKCk7XG4gIGNvbnN0IHRpbWVMaW5lID0gcCgpO1xuICBjb25zdCBzb2x2ZXJMaW5lID0gcChcInNvbHZlcjogXCIsIEFDVElWRV9TT0xWRVJfTkFNRSk7XG4gIGNvbnN0IHVuYXNzaWduZWRMaW5lID0gcCgpO1xuICBjb25zdCBkZXRhaWxXcmFwID0gZGl2KCk7XG4gIGNvbnN0IHRhYmxlV3JhcCA9IGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBvdmVyZmxvd1g6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dZOiBcImhpZGRlblwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgIH0pLFxuICApO1xuXG4gIGNvbnN0IHJ1bkJ1dHRvbiA9IGJ1dHRvbihcInN0YXJ0XCIpO1xuICBjb25zdCBoZWF0QnV0dG9uID0gYnV0dG9uKFwiaGVhdCB1cFwiKTtcbiAgbGV0IHJlbmRlckNvdW50ZXIgPSAwO1xuXG4gIGZ1bmN0aW9uIHN0b3BTZWFyY2goKSB7XG4gICAgaWYgKGFubmVhbGluZ1RpbWVyICE9IG51bGwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoYW5uZWFsaW5nVGltZXIpO1xuICAgICAgYW5uZWFsaW5nVGltZXIgPSBudWxsO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0YXJ0XCI7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJUYWJsZSgpIHtcbiAgICBjb25zdCB0YWIgPSB0YWJsZShcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgfSksXG4gICAgICB0cihcbiAgICAgICAgdGgoXCJ0cmFuc3BvcnRlclwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJ2YWx1ZVwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJzdGVwc1wiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICksXG4gICAgICBtb2Quc3RhcnRwb3NpdGlvbnMubWFwKChzdGFydCwgdHJhbikgPT5cbiAgICAgICAgdHIoXG4gICAgICAgICAgdGQoXG4gICAgICAgICAgICB0cmFuLFxuICAgICAgICAgICAgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcG9wdXAoXG4gICAgICAgICAgICAgICAgcChcInRyYW5zcG9ydGVyOiBcIiwgdHJhbiksXG4gICAgICAgICAgICAgICAgcChcInN0YXJ0OiBcIiwgc3RhcnQpLFxuICAgICAgICAgICAgICAgIHAoXCJzY29yZTogXCIsIGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hKSxcbiAgICAgICAgICAgICAgICBwKFwic3RlcHM6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVTaXplc1t0cmFuXSEpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb25tb3VzZWVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50czogW3sgbnVtYmVyOiBzdGFydCwgbG9nbzogXCLwn5qbXCIgfV0gfV0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBvbm1vdXNlbGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW10pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHRkKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiIH0pKSxcbiAgICAgICAgICB0ZChcbiAgICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIFswLCAxXS5tYXAoKGRlY2spID0+XG4gICAgICAgICAgICAgICAgdHIoXG4gICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHsgbGVuZ3RoOiBhbm5lYWxlciEuc2NoZWR1bGVTaXplc1t0cmFuXSEgfSwgKF8sIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IGFubmVhbGVyPy5zY2hlZHVsZVt0cmFuICogYW5uZWFsZXIuVFNJWkUgKyBpXSE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYWQgPSBpc0xvYWQoc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZChcbiAgICAgICAgICAgICAgICAgICAgICBnZXREZWNrKHN0ZXApID09PSBkZWNrID8gaXRlbUJ1dHRvbihnZXRSZXEoc3RlcCksICEhbG9hZCkgOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBsb2FkID8gY29sb3IuYmx1ZSA6IGNvbG9yLmdyZWVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBpbm5lckJvcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjJlbSAuM2VtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogXCIyLjZlbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzY2hlZHVsZUNlbGxNaW5IZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgIGJvcmRlcjogb3V0ZXJCb3JkZXIsXG4gICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjI1ZW1cIixcbiAgICAgICAgICAgICAgdmVydGljYWxBbGlnbjogXCJ0b3BcIixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgICksXG4gICAgICApLFxuICAgICk7XG5cbiAgICB0YWJsZVdyYXAucmVwbGFjZUNoaWxkcmVuKHRhYik7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJTdGF0dXMoKSB7XG4gICAgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gYHNjb3JlOiAke2FubmVhbGVyPy50b3RhbFNjb3JlID8/IDB9YDtcbiAgICB0aW1lTGluZS50ZXh0Q29udGVudCA9IGBzZWFyY2ggdGltZTogJHsoYW5uZWFsZXIhLmVsYXBzZWRNcy8xMDAwKS50b0ZpeGVkKDIpfSBzYDtcbiAgICB1bmFzc2lnbmVkTGluZS5yZXBsYWNlQ2hpbGRyZW4oXG4gICAgICBcInVuYXNzaWduZWQ6IFwiLFxuICAgICAgLi4uQXJyYXkuZnJvbShhbm5lYWxlciEudW5hc3NpZ25lZClcbiAgICAgICAgLm1hcCgoeCwgaSkgPT4gKHsgeCwgaSB9KSlcbiAgICAgICAgLmZpbHRlcigoeCkgPT4geC54KVxuICAgICAgICAuZmxhdE1hcCgoeCkgPT4gW3NwYW4oXCIgXCIpLCBpdGVtQnV0dG9uKHguaSldKSxcbiAgICApO1xuXG4gICAgZGV0YWlsV3JhcC5yZXBsYWNlQ2hpbGRyZW4oXG4gICAgICBkaXYoXG4gICAgICAgIHAoXCJkZXRhaWxzXCIpLFxuICAgICAgICB0YWJsZShcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRyKGNlbGwoXCJ1bmFzc2lnbmVkIHJlcXVlc3RzXCIpLCBjZWxsKEFycmF5LmZyb20oYW5uZWFsZXIhLnVuYXNzaWduZWQpLm1hcCgoeCwgaSkgPT4gKHsgeCwgaSB9KSkuZmlsdGVyKCh4KSA9PiB4LngpLmZsYXRNYXAoKHgpID0+IFtzcGFuKFwiIFwiKSwgaXRlbUJ1dHRvbih4LmkpXSkpKSxcbiAgICAgICAgICB0cihjZWxsKFwic2VhcmNoIHRpbWVcIiksIGNlbGwoYCR7YW5uZWFsZXI/LmVsYXBzZWRNcyA/PyAwfW1zYCkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJzY29yZVwiKSwgY2VsbChhbm5lYWxlcj8udG90YWxTY29yZSA/PyAwKSksXG4gICAgICAgICAgdHIoY2VsbChcInRyYW5zcG9ydGVyIGNvdW50XCIpLCBjZWxsKG1vZC5OVFJBTlMpKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVxdWVzdCBjb3VudFwiKSwgY2VsbChtb2QuTlJFUVMpKSxcbiAgICAgICAgICB0cihjZWxsKFwiY29zdCBwZXIga21cIiksIGNlbGwoYCR7S01fQ09TVH3igqxgKSksXG4gICAgICAgICAgdHIoY2VsbChcImF2ZXJhZ2Ugc3BlZWRcIiksIGNlbGwoYCR7QVZHX1NQRUVEX0tNSH1rbS9oYCkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJyZW9yZ2FuaXphdGlvbiBjb3N0XCIpLCBjZWxsKGAke1JFT1JHX0NPU1RfRVVSfeKCrGApKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcihmb3JjZVRhYmxlID0gZmFsc2UpIHtcbiAgICByZW5kZXJTdGF0dXMoKTtcbiAgICBpZiAoZm9yY2VUYWJsZSB8fCAocmVuZGVyQ291bnRlcisrICUgNCA9PT0gMCkpIHJlbmRlclRhYmxlKCk7XG4gIH1cblxuICBydW5CdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBpZiAoYW5uZWFsaW5nVGltZXIgIT0gbnVsbCkge1xuICAgICAgc3RvcFNlYXJjaCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0b3BcIjtcbiAgICBhbm5lYWxpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTIwKTtcbiAgICAgIHJlbmRlcigpO1xuICAgIH0sIDE1MCk7XG4gIH07XG5cbiAgaGVhdEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGlmICghYW5uZWFsaW5nU2Vzc2lvbikgcmV0dXJuO1xuICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5yZWhlYXQoKTtcbiAgICByZW5kZXIodHJ1ZSk7XG4gIH07XG5cbiAgbGl2ZVJlbmRlciA9ICgpID0+IHJlbmRlcih0cnVlKTtcbiAgcmVuZGVyKHRydWUpO1xuICBjb250cm9scy5yZXBsYWNlQ2hpbGRyZW4ocnVuQnV0dG9uLCBoZWF0QnV0dG9uKTtcblxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgICBvdmVyZmxvd1k6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dYOiBcImhpZGRlblwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgIH0pLFxuICAgIGNvbnRyb2xzLFxuICAgIHNvbHZlckxpbmUsXG4gICAgc2NvcmVMaW5lLFxuICAgIHRpbWVMaW5lLFxuICAgIHRhYmxlV3JhcCxcbiAgICBkZXRhaWxXcmFwLFxuICAgIHVuYXNzaWduZWRMaW5lLFxuICApO1xufVxuXG5leHBvcnQgY29uc3QgYXZhaWxhYmxlU29sdmVycyA9IHtcbiAgYmFzZWxpbmU6IGJhc2VsaW5lQW5uZWFsaW5nLFxuICBpbXByb3ZlZDogaW1wcm92ZWRBbm5lYWxpbmcsXG4gIHdhc206IGFubmVhbGluZ1dhc20sXG59IGFzIGNvbnN0O1xuIiwKICAgICJpbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdfYmFzZWxpbmVcIlxuaW1wb3J0IHsgYW5uZWFsaW5nV2FzbSB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdfd2FzbVwiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgeyBkaXYsIGgyLCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIlxuXG5sZXQgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQgfCBudWxsID0gbnVsbFxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0VXBXYXNtKHBsYW5uZXI6IE1vZHVsZSkge1xuICByZXN1bHQgPSBhd2FpdCBhbm5lYWxpbmdXYXNtKHBsYW5uZXIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3YXNtVmlldyhfcGxhbm5lcjogTW9kdWxlKSB7XG4gIGlmIChyZXN1bHQgPT09IG51bGwpIHRocm93IG5ldyBFcnJvcihcIldBU00gcGxhbm5lciBpcyBub3Qgc2V0IHVwXCIpXG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoeyBwYWRkaW5nOiBcIjFlbVwiIH0pLFxuICAgIGgyKFwiV0FTTSBwbGFubmVyXCIpLFxuICAgIHAoXCJhc3NpZ25lZDogXCIsIHJlc3VsdC51bmFzc2lnbmVkLmxlbmd0aCAtIHJlc3VsdC51bmFzc2lnbmVkLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApKSxcbiAgICBwKFwic2NoZWR1bGUgc3RlcHM6IFwiLCByZXN1bHQuc2NoZWR1bGVTaXplcy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSksXG4gICAgcChcInNlYXJjaCB0aW1lOiBcIiwgcmVzdWx0LmVsYXBzZWRNcy50b0ZpeGVkKDIpLCBcIm1zXCIpLFxuICApXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgaGFzaCB9IGZyb20gXCIuLi9oYXNoXCI7XG5pbXBvcnQgeyBib2R5LCBidXR0b24sIGNvbG9yLCBkaXYsIGVycm9ycG9wdXAsIGgxLCBoMiwgaDMsIGlucHV0LCBtYXJnaW4sIHAsIHBhZGRpbmcsIHBvcHVwLCBwcmUsIHNwYW4sIHN0eWxlLCB0YWJsZSwgd2lkdGgsIHRleHRhcmVhLCBhLCBib3JkZXIsIGh0bWwsIHRoLCB0ciwgdGQsIGJvcmRlclJhZGl1cywgcGFuZWxMaXN0LCBkaXNwbGF5LCBiYWNrZ3JvdW5kIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgbWFwVmlldyB9IGZyb20gXCIuL21hcFZpZXdcIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyByYW5kb21Nb2R1bGUsIHJhbmRvbVVVSUQsIFJlcXVlc3QsIFNjaGVkdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBta1N0b3JlZCwgbWtXcml0YWJsZSwgdHlwZSBXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRvbSwgc2V0UmFuZFNlZWQgfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBudW1iZXIgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5pbXBvcnQgeyBwbGFubmVyVmlldyB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdcIjtcbmltcG9ydCB7IHNldFVwV2FzbSwgd2FzbVZpZXcgfSBmcm9tIFwiLi93YXNtdmlld1wiO1xuXG5cbmV4cG9ydCBsZXQgTEtXX0NPVU5UID0gbWtTdG9yZWQoXCJMS1dfQ09VTlRcIiwgbnVtYmVyLCAgNSlcbmxldCBSRVFVRVNUX0NPVU5UID0gbWtTdG9yZWQoXCJSRVFVRVNUX0NPVU5UXCIsICBudW1iZXIsIDIwKVxuXG5ib2R5LnN0eWxlLm1hcmdpbiA9IFwiMFwiXG5cbmxldCBoZWFkZXIgPSBoMShcInJvdXRlIHBsYW5uZXJcIiwgc3R5bGUoe2JhY2tncm91bmQ6IGNvbG9yLmJsdWUsIGNvbG9yOiBjb2xvci5iYWNrZ3JvdW5kLCBtYXJnaW46IFwiMFwiLCBwYWRkaW5nOiBcIi42ZW1cIn0pKVxuXG5sZXQgY29udGVudFNwYWNlID0gZGl2KHN0eWxlKHtcbiAgZGlzcGxheTpcImZsZXhcIixcbiAgZmxleERpcmVjdGlvbjpcInJvd1wiLFxuICB3aWR0aDogXCIxMDAlXCIsXG4gIGhlaWdodDogXCJjYWxjKDEwMCUgLSAyLjVlbSlcIixcbiAgbWluV2lkdGg6IFwiMFwiLFxufSkpXG5cbmxldCBwYWdlID0gZGl2KFxuICBzdHlsZSh7ZGlzcGxheTpcImZsZXhcIiwgZmxleERpcmVjdGlvbjpcImNvbHVtblwiLCBoZWlnaHQ6IFwiMTAwJVwifSksXG4gIGhlYWRlcixcbiAgY29udGVudFNwYWNlXG4pXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKHBhZ2UpXG5cbnNldFJhbmRTZWVkKDI0KVxuXG5leHBvcnQgbGV0IG1vZHVsZSA9IHJhbmRvbU1vZHVsZSgpXG5cbmV4cG9ydCB0eXBlIEhpZ2hMaWdodCA9IHtcbiAgcG9pbnRzOiB7XG4gICAgbnVtYmVyOiBudW1iZXIsXG4gICAgbG9nbz8gOiBzdHJpbmcsXG4gIH1bXSxcbiAgY29sb3I/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGxldCBoaWdodExpZ2h0cyA9IG1rV3JpdGFibGUgPEhpZ2hMaWdodFtdPiggW10gKVxuXG5cbmZ1bmN0aW9uIHNldHRlciAoc3RvcmU6IFdyaXRhYmxlPG51bWJlcj4gKXtcbiAgbGV0IGlucCA9IGlucHV0KClcbiAgaW5wLnR5cGUgPSBcIm51bWJlclwiXG4gIGlucC5vbmNoYW5nZSA9ICgpPT57XG4gICAgbGV0IHZhbCA9IHBhcnNlSW50KGlucC52YWx1ZSlcbiAgICBpZiAoaXNOYU4odmFsKSkgcmV0dXJuXG4gICAgc3RvcmUuc2V0KHZhbClcbiAgfVxuICBzdG9yZS5vbnVwZGF0ZSh2YWw9PmlucC52YWx1ZSA9IHZhbC50b1N0cmluZygpKVxuXG4gIHJldHVybiBpbnBcbn1cblxuXG5hd2FpdCBzZXRVcFdhc20obW9kdWxlKVxuXG5mdW5jdGlvbiBta1dpbmRvdyAodGFiOiBudW1iZXIgPSAwICkge1xuXG4gIGxldCB0YWJGaWVsZHMgPSBbXG4gICAgWydtYXAnLCBtYXBWaWV3KG1vZHVsZSldLFxuICAgIFsncGxhbm5lcicsIHBsYW5uZXJWaWV3KG1vZHVsZSldLFxuICAgIFsnd2FzbScsIHdhc21WaWV3KG1vZHVsZSldXG4gIF0gYXMgY29uc3RcblxuICBjb25zdCBlbCA9IGRpdihzdHlsZSh7XG4gICAgZmxleDogXCIxIDEgMFwiLFxuICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICBoZWlnaHQ6IFwiY2FsYygxMDB2aCAtIDFlbSlcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgfSkpXG5cbiAgZnVuY3Rpb24gb3BlblRhYih0YWI6IHR5cGVvZiB0YWJGaWVsZHNbbnVtYmVyXVswXSkge1xuICAgIGNvbnN0IHRhYnMgPSBwKFxuICAgICAgc3R5bGUoe1xuICAgICAgICBtYXJnaW46IFwiMFwiLFxuICAgICAgICBwYWRkaW5nOiBcIi40ZW1cIixcbiAgICAgICAgZmxleDogXCIwIDAgYXV0b1wiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMubWFwKChbbixlXSk9PlxuICAgICAgICBzcGFuKCBuLFxuICAgICAgICAgICgpPT5vcGVuVGFiKG4pLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjNlbVwiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIi4zZW1cIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiKyAobj09dGFiID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5KSxcbiAgICAgICAgICAgIGNvbG9yOiAobj09dGFiKSA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuXG4gICAgY29uc3QgY29udGVudCA9IGRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgZmxleDogXCIxIDEgYXV0b1wiLFxuICAgICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgICAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgICB9KSxcbiAgICAgIHRhYkZpZWxkcy5maW5kKChbbixdKT0+bj09dGFiKSFbMV1cbiAgICApXG5cbiAgICBlbC5yZXBsYWNlQ2hpbGRyZW4oXG4gICAgICB0YWJzLFxuICAgICAgY29udGVudFxuICAgIClcbiAgfVxuXG4gIG9wZW5UYWIodGFiRmllbGRzW3RhYl0hWzBdKVxuXG4gIHJldHVybiBlbFxufVxuXG5jb250ZW50U3BhY2UucmVwbGFjZUNoaWxkcmVuKG1rV2luZG93KDIgKSwgbWtXaW5kb3coKSlcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFFTyxJQUFNLE9BQU8sU0FBUztBQUU3QixJ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
