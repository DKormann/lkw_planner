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

// src/planners/annealing.ts
var ACTIVE_SOLVER_NAME = "improved";
var KM_COST2 = 0.5;
var AVG_SPEED_KMH2 = 60;
var REORG_COST_EUR2 = 100;
var annealer = null;
var annealingSession = null;
var annealingTimer = null;
var liveRender = null;
function plannerView(mod) {
  const outerBorder = "1px solid " + color.gray;
  const innerBorder = "1px solid " + color.lightgray;
  const cellPadding = ".35em .5em";
  const scheduleCellMinHeight = "2.1em";
  if (annealingSession == null) {
    annealingSession = createImprovedAnnealingSession(mod, 1900000);
    annealer = annealingSession.iterateForMs(10);
  } else if (annealer == null) {
    annealer = annealingSession.getResult();
  }
  function itemButton(item, load) {
    const req = mod.requests[item];
    const sp = span(item.toString().padStart(3, " "), style({
      cursor: "pointer",
      border: "2px solid transparent",
      borderRadius: ".2em",
      whiteSpace: "pre",
      fontFamily: "monospace"
    }), function() {
      popup(p("item ", item), table(tr(cell("status"), cell(load ? "load" : load === false ? "unload" : "unassigned")), tr(cell("value"), cell(req.value_eur + "€")), tr(cell("dist"), cell(mod.roadmap.getCostN(req.startPoint, req.endPoint) + "km")), tr(cell("deadline"), cell(req.deadline_h.toFixed(2) + "h"))));
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
    }), tr(th("transporter", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("value", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("steps", style({ border: outerBorder, padding: cellPadding, textAlign: "left" }))), mod.startpositions.map((start, tran) => tr(td(tran, style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), function() {
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
    }), tr(cell("unassigned requests"), cell(Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]))), tr(cell("search time"), cell(`${annealer?.elapsedMs ?? 0}ms`)), tr(cell("score"), cell(annealer?.totalScore ?? 0)), tr(cell("transporter count"), cell(mod.NTRANS)), tr(cell("request count"), cell(mod.NREQS)), tr(cell("cost per km"), cell(`${KM_COST2}€`)), tr(cell("average speed"), cell(`${AVG_SPEED_KMH2}km/h`)), tr(cell("reorganization cost"), cell(`${REORG_COST_EUR2}€`)))));
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

// src/wasm.ts
var magic = [0, 97, 115, 109, 1, 0, 0, 0];
var numTypes = ["i32", "i64", "f32", "f64", "u16", "u8"];
var binOps = ["add", "sub", "mul", "div"];
var cmpOps = ["eq", "lt", "gt"];
var codes = {
  type: { i32: 127, i64: 126, f32: 125, f64: 124, u16: 127, u8: 127 },
  bin: {
    add: { i32: 106, i64: 124, f32: 146, f64: 160, u16: 106, u8: 106 },
    sub: { i32: 107, i64: 125, f32: 147, f64: 161, u16: 107, u8: 107 },
    mul: { i32: 108, i64: 126, f32: 148, f64: 162, u16: 108, u8: 108 },
    div: { i32: 109, i64: 127, f32: 149, f64: 163, u16: 110, u8: 110 }
  },
  cmp: {
    eq: { i32: 70, i64: 81, f32: 91, f64: 97, u16: 70, u8: 70 },
    lt: { i32: 72, i64: 83, f32: 93, f64: 99, u16: 73, u8: 73 },
    gt: { i32: 74, i64: 85, f32: 94, f64: 100, u16: 75, u8: 75 }
  },
  load: { i32: 40, i64: 41, f32: 42, f64: 43, u16: 47, u8: 45 },
  store: { i32: 54, i64: 55, f32: 56, f64: 57, u16: 59, u8: 58 },
  bit: {
    and: { i32: 113, i64: 131, u16: 113, u8: 113 },
    or: { i32: 114, i64: 132, u16: 114, u8: 114 },
    xor: { i32: 115, i64: 133, u16: 115, u8: 115 },
    shl: { i32: 116, i64: 134, u16: 116, u8: 116 },
    shr: { i32: 118, i64: 136, u16: 118, u8: 118 }
  },
  remainder: {
    mod: { i32: 111, i64: 129, u16: 112, u8: 112 },
    umod: { i32: 112, i64: 130, u16: 112, u8: 112 }
  },
  bytes: { i32: 4, i64: 8, f32: 4, f64: 8, u16: 2, u8: 1 },
  align: { i32: 2, i64: 3, f32: 2, f64: 3, u16: 1, u8: 0 },
  zero: { i32: [65, 0], i64: [66, 0], f32: [67, 0, 0, 0, 0], f64: [68, 0, 0, 0, 0, 0, 0, 0, 0], u16: [65, 0], u8: [65, 0] },
  convert: { f32: { i32: 178, u32: 179, i64: 180, u64: 181 }, f64: { i32: 183, u32: 184, i64: 185, u64: 186 } }
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
var sN = (value, bits) => {
  const out = [];
  let n = bits === 32 ? BigInt(value | 0) : BigInt.asIntN(64, value);
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
var die = (x) => {
  throw new Error(`Unexpected value: ${String(x)}`);
};
var nextFuncId = 0;
var nextLocalId = 0;
var nextArrayId = 0;
var nextControlId = 0;
var arrayRegistry = new Map;
var functionRegistry = new Map;
var inferType = (value) => typeof value === "object" && value !== null && ("type" in value) ? value.type : "i32";
var addExprOps = (e) => {
  for (const op of binOps)
    e[op] = (r) => bin(op, e, r);
  for (const op of cmpOps)
    e[op] = (r) => cmp(op, e, r);
  return e;
};
var expr = (node) => {
  return addExprOps(node);
};
var lit = (type, value) => {
  if (typeof value === "object" && value !== null) {
    if ("kind" in value)
      return value;
  }
  return expr({ kind: "const", type, value });
};
var isStmt = (x) => !!x && typeof x === "object" && ("kind" in x) && (x.kind === "local.set" || x.kind === "array.store" || x.kind === "array.move" || x.kind === "block" || x.kind === "loop" || x.kind === "break" || x.kind === "continue" || x.kind === "return" || x.kind === "expr" || x.kind === "if" && Array.isArray(x.then));
var stmtList = (body2) => Array.isArray(body2) ? body2.flatMap(stmtList) : [body2];
var asStmts = (body2) => isStmt(body2) ? [body2] : Array.isArray(body2) ? stmtList(body2) : null;
var bindStmts = (body2, br, loop) => stmtList(body2).map((s) => bindStmt(s, br, loop));
var bindStmt = (s, br, loop) => {
  switch (s.kind) {
    case "if":
      return { ...s, then: bindStmts(s.then, br, loop), else: bindStmts(s.else, br, loop) };
    case "break":
      return { ...s, target: s.target ?? br };
    case "continue":
      if (s.target != null)
        return s;
      if (loop == null)
        throw new Error("continueTo() used outside a loop");
      return { ...s, target: loop };
    default:
      return s;
  }
};
var controlBody = (self, body2) => bindStmts(typeof body2 === "function" ? body2(self) : body2, self.id, self.kind === "loop" ? self.id : null);
var bin = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var bit = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var remainder = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var cmp = (op, left, right) => expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) });
var localExpr = (type, local) => expr({ kind: "local.get", type, local });
var mkLocal = (type) => {
  const id = nextLocalId++;
  const set = (value2) => ({ kind: "local.set", local: id, type, value: lit(type, value2) });
  const value = localExpr(type, id);
  return Object.assign(value, {
    set,
    iadd: (right) => set(value.add(right)),
    isub: (right) => set(value.sub(right)),
    imul: (right) => set(value.mul(right)),
    idiv: (right) => set(value.div(right)),
    iand: (right) => set(bit("and", value, right)),
    ior: (right) => set(bit("or", value, right)),
    ixor: (right) => set(bit("xor", value, right))
  });
};
var mkHandle = (params, result, build) => {
  const id = nextFuncId++;
  const handle = {
    kind: "func",
    id,
    params,
    result,
    build,
    call: (...args) => expr({
      kind: "call",
      type: result,
      target: id,
      args: params.map((type, i) => lit(type, args[i]))
    })
  };
  functionRegistry.set(id, handle);
  return handle;
};
var mkArray = (type, length) => {
  if (!Number.isInteger(length) || length <= 0)
    throw new Error(`Invalid array length ${length}`);
  const id = nextArrayId++;
  const handle = {
    kind: "array",
    id,
    type,
    length,
    load: (index) => expr({ kind: "load", type, array: id, index: lit("i32", index) }),
    store: (index, value) => ({ kind: "array.store", array: id, type, index: lit("i32", index), value: lit(type, value) }),
    move: (target, source, count) => ({ kind: "array.move", array: id, target: lit("i32", target), source: lit("i32", source), count: lit("i32", count) })
  };
  arrayRegistry.set(id, handle);
  return handle;
};
var xor = (left, right) => bit("xor", left, right);
var shl = (left, right) => bit("shl", left, right);
var shr = (left, right) => bit("shr", left, right);
var umod = (left, right) => remainder("umod", left, right);
var func = (params, result, build) => mkHandle(params, result, build);
var array2 = (type, length) => mkArray(type, length);
var local = Object.fromEntries(numTypes.map((type) => [type, () => mkLocal(type)]));
var ret = (value) => ({
  kind: "return",
  value: lit(inferType(value), value)
});
var loop = (cond, body2) => {
  const self = { kind: "loop", id: nextControlId++ };
  return { kind: "loop", control: self.id, cond, body: controlBody(self, body2) };
};
var breakTo = (target) => ({ kind: "break", target: target?.id ?? null });
var walkExpr = (e, fns) => {
  switch (e.kind) {
    case "const":
      return;
    case "local.get":
      fns.local?.(e.local, e.type);
      return;
    case "bin":
    case "cmp":
      walkExpr(e.left, fns);
      walkExpr(e.right, fns);
      return;
    case "call":
      fns.func?.(e.target);
      e.args.forEach((arg) => walkExpr(arg, fns));
      return;
    case "convert":
      walkExpr(e.value, fns);
      return;
    case "int.convert":
      walkExpr(e.value, fns);
      return;
    case "if":
      walkExpr(e.cond, fns);
      walkExpr(e.then, fns);
      walkExpr(e.else, fns);
      return;
    case "load":
      fns.array?.(e.array);
      walkExpr(e.index, fns);
      return;
    default:
      die(e);
  }
};
var walkStmt = (s, fns) => {
  switch (s.kind) {
    case "local.set":
      fns.local?.(s.local, s.type);
      walkExpr(s.value, fns);
      return;
    case "array.store":
      fns.array?.(s.array);
      walkExpr(s.index, fns);
      walkExpr(s.value, fns);
      return;
    case "array.move":
      fns.array?.(s.array);
      walkExpr(s.target, fns);
      walkExpr(s.source, fns);
      walkExpr(s.count, fns);
      return;
    case "if":
      walkExpr(s.cond, fns);
      s.then.forEach((x) => walkStmt(x, fns));
      s.else.forEach((x) => walkStmt(x, fns));
      return;
    case "block":
      s.body.forEach((x) => walkStmt(x, fns));
      return;
    case "loop":
      walkExpr(s.cond, fns);
      s.body.forEach((x) => walkStmt(x, fns));
      return;
    case "break":
    case "continue":
      return;
    case "return":
      walkExpr(s.value, fns);
      return;
    case "expr":
      walkExpr(s.expr, fns);
      return;
    default:
      die(s);
  }
};
var addr = (layout, index) => index.mul(codes.bytes[layout.type]).add(layout.offset);
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
var runtimeBoundsGuard = (index, length, fix, lix, arrays, options) => options.runtimeBoundsChecks ? [
  ...compileExpr(index, fix, lix, arrays, options),
  65,
  0,
  72,
  ...compileExpr(index, fix, lix, arrays, options),
  65,
  ...sN(length, 32),
  79,
  114,
  4,
  64,
  0,
  11
] : [];
var runtimeMoveBoundsGuard = (layout, target, source, count, fix, lix, arrays, options) => {
  if (!options.runtimeBoundsChecks)
    return [];
  const code = (value) => compileExpr(value, fix, lix, arrays, options);
  const trapIf = (condition) => [...condition, 4, 64, 0, 11];
  const negative = (value) => trapIf([...code(value), 65, 0, 72]);
  const countPastEnd = trapIf([...code(count), 65, ...sN(layout.length, 32), 75]);
  const pastEnd = (start) => trapIf([...code(start), 65, ...sN(layout.length, 32), ...code(count), 107, 75]);
  return [...negative(target), ...negative(source), ...negative(count), ...countPastEnd, ...pastEnd(target), ...pastEnd(source)];
};
var compileExpr = (e, fix, lix, arrays, options) => {
  switch (e.kind) {
    case "const":
      if (e.type === "i32")
        return [65, ...sN(e.value, 32)];
      if (e.type === "u16" || e.type === "u8")
        return [65, ...sN(e.value, 32)];
      if (e.type === "i64")
        return [66, ...sN(e.value, 64)];
      if (e.type === "f32")
        return [67, ...fN(e.value, 4)];
      if (e.type === "f64")
        return [68, ...fN(e.value, 8)];
      return die(e);
    case "local.get":
      return [32, ...u32(lix[e.local])];
    case "bin": {
      const opcode = e.op in codes.bit ? codes.bit[e.op][e.type] : (e.op in codes.remainder) ? codes.remainder[e.op][e.type] : codes.bin[e.op][e.type];
      return [...compileExpr(e.left, fix, lix, arrays, options), ...compileExpr(e.right, fix, lix, arrays, options), opcode];
    }
    case "cmp":
      return [...compileExpr(e.left, fix, lix, arrays, options), ...compileExpr(e.right, fix, lix, arrays, options), codes.cmp[e.op][e.inputType]];
    case "call":
      if (fix[e.target] == null)
        throw new Error(`Unknown function ${e.target}`);
      return [...flatMap(e.args, (arg) => compileExpr(arg, fix, lix, arrays, options)), 16, ...u32(fix[e.target])];
    case "convert": {
      const input = e.inputType === "i64" ? e.unsigned ? "u64" : "i64" : e.unsigned ? "u32" : "i32";
      return [...compileExpr(e.value, fix, lix, arrays, options), codes.convert[e.type][input]];
    }
    case "int.convert":
      return [...compileExpr(e.value, fix, lix, arrays, options), ...e.type === "u16" ? [65, ...sN(65535, 32), 113] : []];
    case "if":
      return [...compileExpr(e.cond, fix, lix, arrays, options), 4, codes.type[e.type], ...compileExpr(e.then, fix, lix, arrays, options), 5, ...compileExpr(e.else, fix, lix, arrays, options), 11];
    case "load": {
      const layout = arrays[e.array];
      if (!layout)
        throw new Error(`Unknown array ${e.array}`);
      checkArrayBounds(layout, e.index);
      return [...runtimeBoundsGuard(e.index, layout.length, fix, lix, arrays, options), ...compileExpr(addr(layout, e.index), fix, lix, arrays, options), codes.load[e.type], ...memarg(e.type)];
    }
    default:
      return die(e);
  }
};
var depth = (stack, control, kind) => {
  const i = stack.findIndex((x) => x.control === control && x.kind === kind);
  if (i < 0)
    throw new Error(`Unknown ${kind} target ${control}`);
  return i;
};
var compileStmt = (s, fix, lix, arrays, options, stack = []) => {
  switch (s.kind) {
    case "local.set":
      return [...compileExpr(s.value, fix, lix, arrays, options), 33, ...u32(lix[s.local])];
    case "array.store": {
      const layout = arrays[s.array];
      if (!layout)
        throw new Error(`Unknown array ${s.array}`);
      checkArrayBounds(layout, s.index);
      return [...runtimeBoundsGuard(s.index, layout.length, fix, lix, arrays, options), ...compileExpr(addr(layout, s.index), fix, lix, arrays, options), ...compileExpr(s.value, fix, lix, arrays, options), codes.store[s.type], ...memarg(s.type)];
    }
    case "array.move": {
      const layout = arrays[s.array];
      if (!layout)
        throw new Error(`Unknown array ${s.array}`);
      checkMoveBounds(layout, s.target, s.source, s.count);
      return [
        ...runtimeMoveBoundsGuard(layout, s.target, s.source, s.count, fix, lix, arrays, options),
        ...compileExpr(addr(layout, s.target), fix, lix, arrays, options),
        ...compileExpr(addr(layout, s.source), fix, lix, arrays, options),
        ...compileExpr(s.count.mul(codes.bytes[layout.type]), fix, lix, arrays, options),
        252,
        10,
        0,
        0
      ];
    }
    case "if":
      return [...compileExpr(s.cond, fix, lix, arrays, options), 4, 64, ...flatMap(s.then, (x) => compileStmt(x, fix, lix, arrays, options, [{}, ...stack])), ...s.else.length ? [5, ...flatMap(s.else, (x) => compileStmt(x, fix, lix, arrays, options, [{}, ...stack]))] : [], 11];
    case "block":
      return [2, 64, ...flatMap(s.body, (x) => compileStmt(x, fix, lix, arrays, options, [{ control: s.control, kind: "break" }, ...stack])), 11];
    case "loop":
      return [2, 64, 3, 64, ...compileExpr(s.cond, fix, lix, arrays, options), 69, 13, ...u32(1), ...flatMap(s.body, (x) => compileStmt(x, fix, lix, arrays, options, [{ control: s.control, kind: "continue" }, { control: s.control, kind: "break" }, ...stack])), 12, ...u32(0), 11, 11];
    case "break":
      if (s.target == null)
        throw new Error("breakTo() used outside a block or loop");
      return [12, ...u32(depth(stack, s.target, "break"))];
    case "continue":
      if (s.target == null)
        throw new Error("continueTo() used outside a loop");
      return [12, ...u32(depth(stack, s.target, "continue"))];
    case "return":
      return [...compileExpr(s.value, fix, lix, arrays, options), 15];
    case "expr":
      return [...compileExpr(s.expr, fix, lix, arrays, options), 26];
    default:
      return die(s);
  }
};
var arrayLayouts = (defs) => {
  let offset = 0;
  const entries = Object.entries(defs);
  const out = {};
  for (const [, arr] of entries) {
    out[arr.id] = { type: arr.type, length: arr.length, offset };
    offset += arr.length * codes.bytes[arr.type];
  }
  return { layouts: out, bytes: offset, entries };
};
var moduleFuncs = (mod) => Object.fromEntries(Object.entries(mod).filter(([, v]) => v.kind === "func"));
var moduleArrays = (mod) => Object.fromEntries(Object.entries(mod).filter(([, v]) => v.kind === "array"));
var buildFunc = (func2) => {
  const params = func2.params.map((type) => localExpr(type, nextLocalId++));
  return {
    func: func2,
    paramIds: params.map((p3) => p3.kind === "local.get" ? p3.local : -1),
    built: func2.build?.(...params) ?? die(`Function ${func2.id} has no implementation`)
  };
};
var buildReferencedFunctions = (roots) => {
  const built = new Map;
  const visit = (func2) => {
    if (built.has(func2.id))
      return;
    const entry = buildFunc(func2);
    built.set(func2.id, entry);
    const find = (id) => {
      const referenced = functionRegistry.get(id);
      if (!referenced)
        throw new Error(`Unknown function ${id}`);
      visit(referenced);
    };
    const stmts = asStmts(entry.built);
    stmts ? stmts.forEach((stmt) => walkStmt(stmt, { func: find })) : walkExpr(entry.built, { func: find });
  };
  roots.forEach(visit);
  return [...built.values()];
};
var discoveredArrays = (builtFuncs) => {
  const used = new Set;
  for (const { built } of builtFuncs) {
    const body2 = asStmts(built);
    body2 ? body2.forEach((s) => walkStmt(s, { array: (id) => used.add(id) })) : walkExpr(built, { array: (id) => used.add(id) });
  }
  return Object.fromEntries([...used].map((id) => {
    const arr = arrayRegistry.get(id);
    if (!arr)
      throw new Error(`Unknown array ${id}`);
    return [String(id), arr];
  }));
};
var analyzeModule = (mod) => {
  const funcs = moduleFuncs(mod);
  const arrays = moduleArrays(mod);
  const fEntries = Object.entries(funcs);
  const builtFuncs = buildReferencedFunctions(fEntries.map(([, func2]) => func2));
  const fix = Object.fromEntries(builtFuncs.map(({ func: func2 }, i) => [func2.id, i]));
  const touchedArrays = discoveredArrays(builtFuncs);
  const allArrays = { ...touchedArrays, ...arrays };
  const { layouts, bytes } = arrayLayouts(allArrays);
  return { funcs, arrays, fEntries, builtFuncs, fix, layouts, pages: Math.max(1, Math.ceil(bytes / 65536)) };
};
var emitModule = ({ fEntries, builtFuncs, fix, layouts, pages }, options = {}) => {
  const functionSection = builtFuncs.flatMap((_, i) => u32(i));
  const exportSection = fEntries.flatMap(([name, func2]) => [...str(name), 0, ...u32(fix[func2.id])]);
  return new Uint8Array([
    ...magic,
    ...section(1, [...u32(builtFuncs.length), ...flatMap(builtFuncs, ({ func: func2 }) => [96, ...u32(func2.params.length), ...func2.params.map((t) => codes.type[t]), 1, codes.type[func2.result]])]),
    ...section(2, [
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
      ...flatMap(builtFuncs, ({ func: func2, paramIds, built }) => {
        const locals = new Map;
        const stmts = asStmts(built);
        stmts ? stmts.forEach((s) => walkStmt(s, { local: (id, type) => locals.set(id, type) })) : walkExpr(built, { local: (id, type) => locals.set(id, type) });
        paramIds.forEach((id) => locals.delete(id));
        const localEntries = [...locals.entries()];
        const lix = Object.fromEntries([...paramIds.map((id, i) => [id, i]), ...localEntries.map(([id], i) => [id, func2.params.length + i])]);
        const decls = [...u32(localEntries.length), ...flatMap(localEntries, ([, type]) => [...u32(1), codes.type[type]])];
        const code = stmts ? [...flatMap(stmts, (s) => compileStmt(s, fix, lix, layouts, options)), ...codes.zero[func2.result]] : compileExpr(built, fix, lix, layouts, options);
        const body2 = [...decls, ...code, 11];
        return [...u32(body2.length), ...body2];
      })
    ])
  ]);
};
var typedArrayCtor = (type) => {
  switch (type) {
    case "u8":
      return Uint8Array;
    case "u16":
      return Uint16Array;
    case "i32":
      return Int32Array;
    case "i64":
      return BigInt64Array;
    case "f32":
      return Float32Array;
    case "f64":
      return Float64Array;
    default:
      return die(type);
  }
};
var compile = async (mod, options = {}) => {
  const analysis = analyzeModule(mod);
  const { funcs, arrays, layouts } = analysis;
  const memory = new WebAssembly.Memory({ initial: analysis.pages, maximum: analysis.pages, shared: true });
  let compiled = await WebAssembly.compile(emitModule(analysis, options).buffer);
  const wasm = await WebAssembly.instantiate(compiled, { env: { memory } });
  const exports = wasm.exports;
  const jsFuncs = Object.fromEntries(Object.keys(funcs).map((name) => [name, exports[name]]));
  const jsArrays = Object.entries(arrays).map(([name, arr]) => {
    const layout = layouts[arr.id];
    const Ctor = typedArrayCtor(arr.type);
    return [name, new Ctor(memory.buffer, layout.offset, arr.length)];
  });
  return Object.fromEntries([
    ...Object.entries(jsFuncs),
    ...jsArrays,
    ["mod", compiled],
    ["memory", memory]
  ]);
};

// src/view/wasmview.ts
var wasmModule = null;
async function setUpWasm(planner) {
  wasmModule = await mkWasm(planner);
}
function forLoop(n, body2) {
  let i = local.i32();
  return loop(i.lt(n), [
    body2(i),
    i.iadd(1)
  ]);
}
var NWORKERS = 4;
async function mkWasm(planner) {
  const RANDSTRIDE = 16;
  const randState = array2("i32", NWORKERS * RANDSTRIDE);
  let randNext = func(["i32"], "i32", (gid) => {
    let a2 = local.i32();
    return [
      a2.set(randState.load(gid.mul(RANDSTRIDE))),
      a2.set(xor(a2, shl(a2, 13))),
      a2.set(xor(a2, shr(a2, 17))),
      a2.set(xor(a2, shl(a2, 5))),
      randState.store(gid.mul(RANDSTRIDE), a2),
      ret(a2)
    ];
  });
  let randint = func(["i32", "i32"], "i32", (gid, max) => umod(randNext.call(gid), max));
  const dists = array2("i32", planner.RSIZE);
  const reqpick = array2("u16", planner.NREQS);
  const reqdrop = array2("u16", planner.NREQS);
  const reqvalue = array2("u16", planner.NREQS);
  const reqdeadline = array2("u16", planner.NREQS);
  const TSIZE = Math.floor(planner.NREQS / planner.NTRANS * 2.5 * 2 + 10);
  const scheduleItem = "u16";
  const schedule = array2(scheduleItem, TSIZE * planner.NTRANS);
  const schedscore = array2("u16", TSIZE);
  const schedSize = array2("u16", TSIZE);
  const unassigned = array2(scheduleItem, planner.NREQS);
  const isLoad2 = (i) => i.and(1);
  const getDeck2 = (i) => i.shr(1).and(1);
  const getReq2 = (i) => i.shr(2);
  const score = func(["i32"], "u16", (tid) => {
    return forLoop(schedSize.load(tid), (i) => [
      breakTo()
    ]);
  });
  let mod = await compile({
    dists,
    randState
  }, { runtimeBoundsChecks: true });
  mod.dists.set(planner.roadmap.CostMatrix);
  mod.randState.set(Array.from({ length: NWORKERS * 2 }, (_, i) => i + 1));
  return mod;
}
function wasmView(planner) {
  if (wasmModule === null)
    throw new Error("wasm module not set up yet. call setUpWasm first");
  return div(style({ padding: "1em" }), h2("wasm view"));
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

//# debugId=DD0DE760951036E364756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvd2FzbS50cyIsICJzcmMvdmlldy93YXNtdmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5jb25zdCBJTkYgPSAxIDw8IDMwO1xuXG5leHBvcnQgdHlwZSBQYWlySW5mbyA9IHtcbiAgcmVxOiBudW1iZXI7XG4gIGZpcnN0OiBudW1iZXI7XG4gIHNlY29uZDogbnVtYmVyO1xuICBkZWNrOiAwIHwgMTtcbn07XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1N0YXRlID0ge1xuICBtb2Q6IE1vZHVsZTtcbiAgTlJFUVM6IG51bWJlcjtcbiAgTlRSQU5TOiBudW1iZXI7XG4gIFRTSVpFOiBudW1iZXI7XG4gIHJlcVBpY2t1cExvY2F0aW9uczogVWludDE2QXJyYXk7XG4gIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVhZGxpbmVzOiBVaW50MzJBcnJheTtcbiAgcmVxVmFsdWVzOiBVaW50MzJBcnJheTtcbiAgdW5hc3NpZ25lZDogSW50OEFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2FkKHg6IG51bWJlcikge1xuICByZXR1cm4geCAmIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNrKHg6IG51bWJlcikge1xuICByZXR1cm4gKCh4ICYgMikgPj4gMSkgYXMgMCB8IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXEoeDogbnVtYmVyKSB7XG4gIHJldHVybiAoeCAmIDB4ZmZmZikgPj4gMjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvcyh4OiBudW1iZXIpIHtcbiAgcmV0dXJuIHggPj4gMTY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QW5uZWFsaW5nU3RhdGUobW9kOiBNb2R1bGUsIHNlZWQ/OiBBbm5lYWxpbmdSZXN1bHQpOiBBbm5lYWxpbmdTdGF0ZSB7XG4gIGNvbnN0IHsgTlJFUVMsIHJlcXVlc3RzLCBzdGFydHBvc2l0aW9ucywgTlRSQU5TIH0gPSBtb2Q7XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihOUkVRUyAqIDIuNSArIDEwKTtcblxuICByZXR1cm4ge1xuICAgIG1vZCxcbiAgICBOUkVRUyxcbiAgICBOVFJBTlMsXG4gICAgVFNJWkUsXG4gICAgcmVxUGlja3VwTG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLnN0YXJ0UG9pbnQpKSxcbiAgICByZXFEZWxpdmVyeUxvY2F0aW9uczogbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5lbmRQb2ludCkpLFxuICAgIHJlcURlYWRsaW5lczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5kZWFkbGluZV9oICogQVZHX1NQRUVEX0tNSCkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci52YWx1ZV9ldXIgLyBLTV9DT1NUKSksXG4gICAgdW5hc3NpZ25lZDogc2VlZCA/IG5ldyBJbnQ4QXJyYXkoc2VlZC51bmFzc2lnbmVkKSA6IG5ldyBJbnQ4QXJyYXkocmVxdWVzdHMubWFwKCgpID0+IDEpKSxcbiAgICB0cmFuU3RhcnQ6IG5ldyBVaW50MTZBcnJheShzdGFydHBvc2l0aW9ucyksXG4gICAgc2NoZWR1bGU6IHNlZWQgPyBuZXcgVWludDMyQXJyYXkoc2VlZC5zY2hlZHVsZSkgOiBuZXcgVWludDMyQXJyYXkoVFNJWkUgKiBOVFJBTlMpLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHNlZWQgPyBuZXcgVWludDE2QXJyYXkoc2VlZC5zY2hlZHVsZVNpemVzKSA6IG5ldyBVaW50MTZBcnJheShOVFJBTlMpLFxuICAgIHNjaGVkdWxlUmF0aW5nczogc2VlZCA/IG5ldyBJbnQzMkFycmF5KHNlZWQuc2NoZWR1bGVSYXRpbmdzKSA6IG5ldyBJbnQzMkFycmF5KE5UUkFOUyksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZU9mZnNldChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICByZXR1cm4gdHJhbiAqIHN0YXRlLlRTSVpFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBpZHg6IG51bWJlciwgaXNMb2FkQml0OiAxIHwgMCwgZGVjazogMCB8IDEsIHJlcTogbnVtYmVyLCBwb3M6IG51bWJlcikge1xuICBzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdID0gKGlzTG9hZEJpdCA8PCAwKSB8IChkZWNrIDw8IDEpIHwgKHJlcSA8PCAyKSB8IChwb3MgPDwgMTYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVSb3V0ZShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICBsZXQgcmV3YXJkID0gMDtcbiAgbGV0IGR1cmF0aW9uID0gMDtcbiAgY29uc3QgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV07XG4gIGxldCBwb3MgPSBzdGF0ZS50cmFuU3RhcnRbdHJhbl0hO1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKTtcbiAgICBjb25zdCBuZXh0UG9zID0gZ2V0UG9zKHN0ZXApO1xuICAgIGR1cmF0aW9uICs9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgZHVyYXRpb24gKz0gKGRlY2subGVuZ3RoIC0gaWR4IC0gMSkgKiBSRU9SR19DT1NUX0VVUiAvIEtNX0NPU1Q7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGR1cmF0aW9uIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gZHVyYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoQWxsUmF0aW5ncyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUpIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heExvc3MgPSAyNDApIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGlmIChzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dICE9PSAwKSBjb250aW51ZTtcblxuICAgIGxldCBiZXN0UmVxID0gLTE7XG4gICAgbGV0IGJlc3RTY29yZSA9IC1JTkY7XG5cbiAgICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICAgIGlmICghc3RhdGUudW5hc3NpZ25lZFtyZXFdKSBjb250aW51ZTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCAwLCAwLCAwLCByZXEpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCAwLCAxKTtcbiAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdFJlcSA9IHJlcTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYmVzdFJlcSA9PT0gLTEgfHwgYmVzdFNjb3JlIDwgLW1heExvc3MpIGNvbnRpbnVlO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIGJlc3RSZXEpO1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IGJlc3RTY29yZTtcbiAgICBzdGF0ZS51bmFzc2lnbmVkW2Jlc3RSZXFdID0gMDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0U3RvcHMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBlbmQgKyAyLCBvZmZzZXQgKyBlbmQsIG9mZnNldCArIHNpemUpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIGVuZCArIDEpO1xuICBzZXRSZXEoc3RhdGUsIHRyYW4sIHN0YXJ0LCAxLCBkZWNrLCByZXEsIHN0YXRlLnJlcVBpY2t1cExvY2F0aW9uc1tyZXFdISk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgZW5kICsgMSwgMCwgZGVjaywgcmVxLCBzdGF0ZS5yZXFEZWxpdmVyeUxvY2F0aW9uc1tyZXFdISk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBlbmQpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCAtIDEsIG9mZnNldCArIGVuZCArIDEsIG9mZnNldCArIHNpemUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhaXJJblJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCByZXE6IG51bWJlcik6IFBhaXJJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBsZXQgZmlyc3QgPSAtMTtcbiAgbGV0IHNlY29uZCA9IC0xO1xuICBsZXQgZGVjazogMCB8IDEgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBpZiAoZ2V0UmVxKHN0ZXApICE9PSByZXEpIGNvbnRpbnVlO1xuICAgIGlmIChmaXJzdCA9PT0gLTEpIHtcbiAgICAgIGZpcnN0ID0gaTtcbiAgICAgIGRlY2sgPSBnZXREZWNrKHN0ZXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWNvbmQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZpcnN0ID09PSAtMSB8fCBzZWNvbmQgPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgcmVxLCBmaXJzdCwgc2Vjb25kLCBkZWNrIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVVbmFzc2lnbmVkUmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IG51bWJlciB8IG51bGwge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1heEF0dGVtcHRzOyBpKyspIHtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIHN0YXRlLk5SRVFTKTtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgZm9yIChsZXQgcmVxID0gMDsgcmVxIDwgc3RhdGUuTlJFUVM7IHJlcSsrKSB7XG4gICAgaWYgKHN0YXRlLnVuYXNzaWduZWRbcmVxXSkgcmV0dXJuIHJlcTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbyB9IHwgbnVsbCB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgbWF4QXR0ZW1wdHM7IGF0dGVtcHQrKykge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIHN0YXRlLk5UUkFOUyk7XG4gICAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGlmIChzaXplIDwgMikgY29udGludWU7XG4gICAgY29uc3QgaWR4ID0gcmFuZEludCgwLCBzaXplKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pICsgaWR4XSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pXSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0QW5uZWFsKHByZXZTY29yZTogbnVtYmVyLCBuZXh0U2NvcmU6IG51bWJlciwgdGVtcDogbnVtYmVyKSB7XG4gIGlmIChuZXh0U2NvcmUgPj0gcHJldlNjb3JlKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgZGVsdGEgPSBwcmV2U2NvcmUgLSBuZXh0U2NvcmU7XG4gIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KHRlbXAsIDAuMDAxKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIGVsYXBzZWRNczogbnVtYmVyKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogc3RhdGUuc2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogc3RhdGUuc2NoZWR1bGVTaXplcyxcbiAgICB0cmFuU3RhcnQ6IHN0YXRlLnRyYW5TdGFydCxcbiAgICBUU0laRTogc3RhdGUuVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MsXG4gICAgdW5hc3NpZ25lZDogc3RhdGUudW5hc3NpZ25lZCxcbiAgICBlbGFwc2VkTXMsXG4gICAgdG90YWxTY29yZTogc3RhdGUuc2NoZWR1bGVSYXRpbmdzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApLFxuICB9O1xufVxuIiwKICAgICJpbXBvcnQgeyByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGdldERlY2ssXG4gIGdldFJlcSxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1Jlc3VsdCA9IHtcbiAgc2NoZWR1bGU6IFVpbnQzMkFycmF5O1xuICBzY2hlZHVsZVNpemVzOiBVaW50MTZBcnJheTtcbiAgdHJhblN0YXJ0OiBVaW50MTZBcnJheTtcbiAgVFNJWkU6IG51bWJlcjtcbiAgc2NoZWR1bGVSYXRpbmdzOiBJbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIGVsYXBzZWRNczogbnVtYmVyO1xuICB0b3RhbFNjb3JlOiBudW1iZXI7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYmFzZWxpbmVBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMV82MDBfMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kKTtcbiAgY29uc3QgeyBOUkVRUywgTlRSQU5TLCBUU0laRSwgc2NoZWR1bGUsIHNjaGVkdWxlU2l6ZXMsIHNjaGVkdWxlUmF0aW5ncywgdW5hc3NpZ25lZCB9ID0gc3RhdGU7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEwMDtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2UmF0aW5nOiBudW1iZXIsIG5leHRSYXRpbmc6IG51bWJlcikge1xuICAgIGlmIChuZXh0UmF0aW5nID49IHByZXZSYXRpbmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0UmF0aW5nIC0gcHJldlJhdGluZykgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2NoZWRTaXplICsgMSk7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKHNjaGVkU2l6ZSwgcmFuZEludCgwLCA0KSArIGEpO1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpO1xuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAwLjUgPyAxIDogMCwgcmVxKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICBjb25zdCBzY2hlZFNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2NoZWRTaXplIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRTaXplKTtcbiAgICBjb25zdCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSE7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKGl0ZW0pO1xuXG4gICAgY29uc3QgYWI6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZFNpemU7IGkrKykge1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09PSByZXEpIGFiLnB1c2goaSk7XG4gICAgfVxuICAgIGlmIChhYi5sZW5ndGggIT09IDIpIHJldHVybjtcblxuICAgIGNvbnN0IFthLCBiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl07XG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIpO1xuICAgIGNvbnN0IG5ld1JhdGluZyA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgIGlmIChhY2NlcHQoc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgbmV3UmF0aW5nKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gbmV3UmF0aW5nO1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgLSAxLCBnZXREZWNrKGl0ZW0pIGFzIDAgfCAxLCByZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG4gICAgdGVtcCA9ICgxIC0gaSAvIHN0ZXBzKSAqIHN0YXJ0VGVtcDtcbiAgICB0cnlVbmFzc2lnbigpO1xuICAgIHRyeUFzc2lnbigpO1xuICB9XG5cbiAgcmV0dXJuIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlLCBEYXRlLm5vdygpIC0gc3RhcnRlZEF0KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZyB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHtcbiAgYWNjZXB0QW5uZWFsLFxuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgdHlwZSBQYWlySW5mbyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNhbXBsZUFzc2lnbmVkUGFpcixcbiAgc2FtcGxlVW5hc3NpZ25lZFJlcSxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBJbXByb3ZlZE9wdGlvbnMgPVxuICB8IHsgc3RlcHM6IG51bWJlcjsgYnVkZ2V0TXM/OiBuZXZlciB9XG4gIHwgeyBidWRnZXRNczogbnVtYmVyOyBzdGVwcz86IG5ldmVyIH07XG5cbmV4cG9ydCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiA9IHtcbiAgaXRlcmF0ZVN0ZXBzOiAoc3RlcHM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBpdGVyYXRlRm9yTXM6IChidWRnZXRNczogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG4gIGdldFJlc3VsdDogKCkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICByZWhlYXQ6IChmYWN0b3I/OiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kOiBNb2R1bGUsIHRhcmdldFN0ZXBzID0gMTUwMDAwKTogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHtcbiAgY29uc3Qgd2FybXVwU3RlcHMgPSBNYXRoLm1pbihNYXRoLm1heCgyMDAwMCwgTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMikpLCA1MDAwMCk7XG4gIGNvbnN0IHdhcm11cCA9IGJhc2VsaW5lQW5uZWFsaW5nKG1vZCwgd2FybXVwU3RlcHMpO1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QsIHdhcm11cCk7XG4gIGNvbnN0IHsgTlRSQU5TLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuICBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZSk7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEyMDtcbiAgbGV0IGVuZFRlbXAgPSAwLjU7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyByZXE6IG51bWJlcjsgYTogbnVtYmVyOyBiOiBudW1iZXI7IGRlY2s6IDAgfCAxOyBzY29yZTogbnVtYmVyIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IHJlcSA9IHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGUpO1xuICAgICAgaWYgKHJlcSA9PSBudWxsKSBicmVhaztcblxuICAgICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBjb25zdCBkZWNrID0gKHJhbmRvbSgpID4gMC41ID8gMSA6IDApIGFzIDAgfCAxO1xuXG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgZGVjaywgcmVxKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHJlcSwgYSwgYiwgZGVjaywgc2NvcmU6IG5ld1Njb3JlIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LmEsIGJlc3QuYiwgYmVzdC5kZWNrLCBiZXN0LnJlcSk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ25TYW1wbGVkKHNhbXBsZXMgPSA2KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7IHRyYW46IG51bWJlcjsgcGFpcjogUGFpckluZm87IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IG5ld1Njb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0geyB0cmFuLCBwYWlyLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucGFpci5yZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlbG9jYXRlU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgc3JjOiBudW1iZXI7XG4gICAgICBkc3Q6IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICAgIG9sZFNjb3JlOiBudW1iZXI7XG4gICAgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcblxuICAgICAgY29uc3QgeyB0cmFuOiBzcmMsIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIGNvbnN0IGRzdCA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IG9sZFNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY2hlZHVsZVJhdGluZ3Nbc3JjXSFcbiAgICAgICAgOiBzY2hlZHVsZVJhdGluZ3Nbc3JjXSEgKyBzY2hlZHVsZVJhdGluZ3NbZHN0XSE7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3QgZHN0U2l6ZSA9IHNjaGVkdWxlU2l6ZXNbZHN0XSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBkc3RTaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oZHN0U2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgZHN0U2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGRzdCwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY29yZVJvdXRlKHN0YXRlLCBzcmMpXG4gICAgICAgIDogc2NvcmVSb3V0ZShzdGF0ZSwgc3JjKSArIHNjb3JlUm91dGUoc3RhdGUsIGRzdCk7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBkc3QsIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBjYW5kaWRhdGVTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICBzcmMsXG4gICAgICAgICAgZHN0LFxuICAgICAgICAgIHBhaXIsXG4gICAgICAgICAgaW5zZXJ0QTogYSxcbiAgICAgICAgICBpbnNlcnRCOiBiLFxuICAgICAgICAgIHNjb3JlOiBjYW5kaWRhdGVTY29yZSxcbiAgICAgICAgICBvbGRTY29yZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKGJlc3Qub2xkU2NvcmUsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBpZiAoYmVzdC5zcmMgPT09IGJlc3QuZHN0KSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5zcmNdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5zcmMpO1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5kc3RdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5kc3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5zcmMsIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlSZWluc2VydFNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHtcbiAgICAgIHRyYW46IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW4sIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG5cbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHRyYW4sXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuXG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2Vzc2lvblN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGxldCBpID0gMDtcbiAgY29uc3QgdGVtcEZsb29yID0gMztcbiAgY29uc3QgcmVoZWF0VGVtcCA9IDQ1O1xuXG4gIGZ1bmN0aW9uIHJ1bkl0ZXJhdGlvbnMoaXRlcmF0aW9uQnVkZ2V0OiBudW1iZXIsIGRlYWRsaW5lID0gSW5maW5pdHkpIHtcbiAgICBjb25zdCBlbmRJdGVyYXRpb24gPSBNYXRoLm1pbih0YXJnZXRTdGVwcywgaSArIGl0ZXJhdGlvbkJ1ZGdldCk7XG4gICAgd2hpbGUgKGkgPCBlbmRJdGVyYXRpb24pIHtcbiAgICAgIGlmICgoaSAmIDIwNDcpID09PSAwICYmIERhdGUubm93KCkgPj0gZGVhZGxpbmUpIGJyZWFrO1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBpIC8gdGFyZ2V0U3RlcHM7XG4gICAgICB0ZW1wID0gc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgcHJvZ3Jlc3MpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBydW5UaW1lZENodW5rKGJ1ZGdldE1zOiBudW1iZXIpIHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBidWRnZXRNcztcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXBGbG9vciwgc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKSk7XG5cbiAgICAgIGNvbnN0IHIgPSByYW5kb20oKTtcbiAgICAgIGlmIChyIDwgMC40KSB0cnlBc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC41NSkgdHJ5VW5hc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC44NSkgdHJ5UmVpbnNlcnRTYW1wbGVkKCk7XG4gICAgICBlbHNlIHRyeVJlbG9jYXRlU2FtcGxlZCgpO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgd2FybXVwLmVsYXBzZWRNcyArIChEYXRlLm5vdygpIC0gc2Vzc2lvblN0YXJ0ZWRBdCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpdGVyYXRlU3RlcHMoc3RlcHMpIHtcbiAgICAgIHJ1bkl0ZXJhdGlvbnMoc3RlcHMpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gICAgaXRlcmF0ZUZvck1zKGJ1ZGdldE1zKSB7XG4gICAgICBydW5UaW1lZENodW5rKGJ1ZGdldE1zKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCxcbiAgICByZWhlYXQoZmFjdG9yID0gMSkge1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXAsIHJlaGVhdFRlbXAgKiBmYWN0b3IpO1xuICAgICAgLy8gUHVsbCB0aGUgc2VhcmNoIHNsaWdodGx5IGJhY2sgZnJvbSB0aGUgY29sZCBlbmQgb2YgdGhlIHNjaGVkdWxlLlxuICAgICAgaSA9IE1hdGgubWF4KDAsIGkgLSBNYXRoLmZsb29yKHRhcmdldFN0ZXBzICogMC4wOCAqIGZhY3RvcikpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2Q6IE1vZHVsZSwgb3B0aW9uczogSW1wcm92ZWRPcHRpb25zKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3QgdGFyZ2V0U3RlcHMgPSBcInN0ZXBzXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RlcHMgOiBNYXRoLm1heCgxNTAwMDAsIE1hdGguZmxvb3Iob3B0aW9ucy5idWRnZXRNcyAqIDE5MCkpO1xuICBjb25zdCBzZXNzaW9uID0gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZCwgdGFyZ2V0U3RlcHMpO1xuICBpZiAoXCJzdGVwc1wiIGluIG9wdGlvbnMpIHJldHVybiBzZXNzaW9uLml0ZXJhdGVTdGVwcyhvcHRpb25zLnN0ZXBzKTtcbiAgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZUZvck1zKG9wdGlvbnMuYnVkZ2V0TXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wcm92ZWRBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMTUwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgc3RlcHMgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ1RpbWVkKG1vZDogTW9kdWxlLCBidWRnZXRNcyA9IDEwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgYnVkZ2V0TXMgfSk7XG59XG4iLAogICAgImltcG9ydCB7IGJ1dHRvbiwgY29sb3IsIGRpdiwgcCwgcG9wdXAsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRoLCB0ciB9IGZyb20gXCIuLi92aWV3L2h0bWxcIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuLi92aWV3L21haW5cIjtcbmltcG9ydCB7IGJhc2VsaW5lQW5uZWFsaW5nLCB0eXBlIEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHsgY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uLCBpbXByb3ZlZEFubmVhbGluZywgdHlwZSBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gfSBmcm9tIFwiLi9hbm5lYWxpbmdfaW1wcm92ZWRcIjtcbmltcG9ydCB7IGdldERlY2ssIGdldFJlcSwgaXNMb2FkIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3NoYXJlZFwiO1xuXG50eXBlIFNvbHZlciA9IChtb2Q6IE1vZHVsZSkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuXG5jb25zdCBBQ1RJVkVfU09MVkVSX05BTUUgPSBcImltcHJvdmVkXCI7XG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5cbmxldCBhbm5lYWxlcjogQW5uZWFsaW5nUmVzdWx0IHwgbnVsbCA9IG51bGw7XG5sZXQgYW5uZWFsaW5nU2Vzc2lvbjogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG5sZXQgYW5uZWFsaW5nVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xubGV0IGxpdmVSZW5kZXI6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gcGxhbm5lclZpZXcobW9kOiBNb2R1bGUpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IG91dGVyQm9yZGVyID0gXCIxcHggc29saWQgXCIgKyBjb2xvci5ncmF5O1xuICBjb25zdCBpbm5lckJvcmRlciA9IFwiMXB4IHNvbGlkIFwiICsgY29sb3IubGlnaHRncmF5O1xuICBjb25zdCBjZWxsUGFkZGluZyA9IFwiLjM1ZW0gLjVlbVwiO1xuICBjb25zdCBzY2hlZHVsZUNlbGxNaW5IZWlnaHQgPSBcIjIuMWVtXCI7XG5cbiAgaWYgKGFubmVhbGluZ1Nlc3Npb24gPT0gbnVsbCkge1xuICAgIGFubmVhbGluZ1Nlc3Npb24gPSBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kLCAxXzkwMF8wMDApO1xuICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTApO1xuICB9IGVsc2UgaWYgKGFubmVhbGVyID09IG51bGwpIHtcbiAgICBhbm5lYWxlciA9IGFubmVhbGluZ1Nlc3Npb24uZ2V0UmVzdWx0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBpdGVtQnV0dG9uKGl0ZW06IG51bWJlciwgbG9hZD86IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZXEgPSBtb2QucmVxdWVzdHNbaXRlbV0hO1xuICAgIGNvbnN0IHNwID0gc3BhbihcbiAgICAgIGl0ZW0udG9TdHJpbmcoKS5wYWRTdGFydCgzLCBcIiBcIiksXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIGJvcmRlcjogXCIycHggc29saWQgdHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi4yZW1cIixcbiAgICAgICAgd2hpdGVTcGFjZTogXCJwcmVcIixcbiAgICAgICAgZm9udEZhbWlseTogXCJtb25vc3BhY2VcIixcbiAgICAgIH0pLFxuICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICBwb3B1cChcbiAgICAgICAgICBwKFwiaXRlbSBcIiwgaXRlbSksXG4gICAgICAgICAgdGFibGUoXG4gICAgICAgICAgICB0cihjZWxsKFwic3RhdHVzXCIpLCBjZWxsKGxvYWQgPyBcImxvYWRcIiA6IGxvYWQgPT09IGZhbHNlID8gXCJ1bmxvYWRcIiA6IFwidW5hc3NpZ25lZFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwidmFsdWVcIiksIGNlbGwocmVxLnZhbHVlX2V1ciArIFwi4oKsXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJkaXN0XCIpLCBjZWxsKG1vZC5yb2FkbWFwLmdldENvc3ROKHJlcS5zdGFydFBvaW50LCByZXEuZW5kUG9pbnQpICsgXCJrbVwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGVhZGxpbmVcIiksIGNlbGwocmVxLmRlYWRsaW5lX2gudG9GaXhlZCgyKSArIFwiaFwiKSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGxldCBwb2ludHMgPSBbXG4gICAgICB7IG51bWJlcjogcmVxLnN0YXJ0UG9pbnQsIGxvZ286IFwi8J+TplwiIH0sXG4gICAgICB7IG51bWJlcjogcmVxLmVuZFBvaW50LCBsb2dvOiBcIvCfj6BcIiB9LFxuICAgIF07XG5cbiAgICBpZiAobG9hZCA9PT0gdHJ1ZSkgcG9pbnRzID0gW3BvaW50c1swXSFdO1xuICAgIGlmIChsb2FkID09PSBmYWxzZSkgcG9pbnRzID0gW3BvaW50c1sxXSFdO1xuXG4gICAgc3Aub25tb3VzZWVudGVyID0gKCkgPT4ge1xuICAgICAgc3Auc3R5bGUuYm9yZGVyQ29sb3IgPSBjb2xvci5ncmVlbjtcbiAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHMgfV0pO1xuICAgIH07XG4gICAgc3Aub25tb3VzZWxlYXZlID0gKCkgPT4ge1xuICAgICAgc3Auc3R5bGUuYm9yZGVyQ29sb3IgPSBcInRyYW5zcGFyZW50XCI7XG4gICAgfTtcbiAgICByZXR1cm4gc3A7XG4gIH1cblxuICBjb25zdCBjZWxsOiB0eXBlb2YgdGQgPSAoLi4ueCkgPT4gdGQoc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSwgLi4ueCk7XG4gIGNvbnN0IGNvbnRyb2xzID0gZGl2KHN0eWxlKHsgZGlzcGxheTogXCJmbGV4XCIsIGdhcDogXCIuNWVtXCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGZsZXhXcmFwOiBcIndyYXBcIiB9KSk7XG4gIGNvbnN0IHNjb3JlTGluZSA9IHAoKTtcbiAgY29uc3QgdGltZUxpbmUgPSBwKCk7XG4gIGNvbnN0IHNvbHZlckxpbmUgPSBwKFwic29sdmVyOiBcIiwgQUNUSVZFX1NPTFZFUl9OQU1FKTtcbiAgY29uc3QgdW5hc3NpZ25lZExpbmUgPSBwKCk7XG4gIGNvbnN0IGRldGFpbFdyYXAgPSBkaXYoKTtcbiAgY29uc3QgdGFibGVXcmFwID0gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIG92ZXJmbG93WDogXCJhdXRvXCIsXG4gICAgICBvdmVyZmxvd1k6IFwiaGlkZGVuXCIsXG4gICAgICBtYXhXaWR0aDogXCIxMDAlXCIsXG4gICAgfSksXG4gICk7XG5cbiAgY29uc3QgcnVuQnV0dG9uID0gYnV0dG9uKFwic3RhcnRcIik7XG4gIGNvbnN0IGhlYXRCdXR0b24gPSBidXR0b24oXCJoZWF0IHVwXCIpO1xuICBsZXQgcmVuZGVyQ291bnRlciA9IDA7XG5cbiAgZnVuY3Rpb24gc3RvcFNlYXJjaCgpIHtcbiAgICBpZiAoYW5uZWFsaW5nVGltZXIgIT0gbnVsbCkge1xuICAgICAgY2xlYXJJbnRlcnZhbChhbm5lYWxpbmdUaW1lcik7XG4gICAgICBhbm5lYWxpbmdUaW1lciA9IG51bGw7XG4gICAgfVxuICAgIHJ1bkJ1dHRvbi50ZXh0Q29udGVudCA9IFwic3RhcnRcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclRhYmxlKCkge1xuICAgIGNvbnN0IHRhYiA9IHRhYmxlKFxuICAgICAgc3R5bGUoe1xuICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICB9KSxcbiAgICAgIHRyKFxuICAgICAgICB0aChcInRyYW5zcG9ydGVyXCIsIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHRleHRBbGlnbjogXCJsZWZ0XCIgfSkpLFxuICAgICAgICB0aChcInZhbHVlXCIsIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHRleHRBbGlnbjogXCJsZWZ0XCIgfSkpLFxuICAgICAgICB0aChcInN0ZXBzXCIsIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHRleHRBbGlnbjogXCJsZWZ0XCIgfSkpLFxuICAgICAgKSxcbiAgICAgIG1vZC5zdGFydHBvc2l0aW9ucy5tYXAoKHN0YXJ0LCB0cmFuKSA9PlxuICAgICAgICB0cihcbiAgICAgICAgICB0ZChcbiAgICAgICAgICAgIHRyYW4sXG4gICAgICAgICAgICBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiIH0pLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBwb3B1cChcbiAgICAgICAgICAgICAgICBwKFwidHJhbnNwb3J0ZXI6IFwiLCB0cmFuKSxcbiAgICAgICAgICAgICAgICBwKFwic3RhcnQ6IFwiLCBzdGFydCksXG4gICAgICAgICAgICAgICAgcChcInNjb3JlOiBcIiwgYW5uZWFsZXI/LnNjaGVkdWxlUmF0aW5nc1t0cmFuXSEpLFxuICAgICAgICAgICAgICAgIHAoXCJzdGVwczogXCIsIGFubmVhbGVyPy5zY2hlZHVsZVNpemVzW3RyYW5dISksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvbm1vdXNlZW50ZXI6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW3sgcG9pbnRzOiBbeyBudW1iZXI6IHN0YXJ0LCBsb2dvOiBcIvCfmptcIiB9XSB9XSk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG9ubW91c2VsZWF2ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGhpZ2h0TGlnaHRzLnNldChbXSk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICksXG4gICAgICAgICAgdGQoYW5uZWFsZXI/LnNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSkpLFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgdGFibGUoXG4gICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgWzAsIDFdLm1hcCgoZGVjaykgPT5cbiAgICAgICAgICAgICAgICB0cihcbiAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oeyBsZW5ndGg6IGFubmVhbGVyIS5zY2hlZHVsZVNpemVzW3RyYW5dISB9LCAoXywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGVwID0gYW5uZWFsZXI/LnNjaGVkdWxlW3RyYW4gKiBhbm5lYWxlci5UU0laRSArIGldITtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZCA9IGlzTG9hZChzdGVwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRkKFxuICAgICAgICAgICAgICAgICAgICAgIGdldERlY2soc3RlcCkgPT09IGRlY2sgPyBpdGVtQnV0dG9uKGdldFJlcShzdGVwKSwgISFsb2FkKSA6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGxvYWQgPyBjb2xvci5ibHVlIDogY29sb3IuZ3JlZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGlubmVyQm9yZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogXCIuMmVtIC4zZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiBcIjIuNmVtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgYm9yZGVyOiBvdXRlckJvcmRlcixcbiAgICAgICAgICAgICAgcGFkZGluZzogXCIuMjVlbVwiLFxuICAgICAgICAgICAgICB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcblxuICAgIHRhYmxlV3JhcC5yZXBsYWNlQ2hpbGRyZW4odGFiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclN0YXR1cygpIHtcbiAgICBzY29yZUxpbmUudGV4dENvbnRlbnQgPSBgc2NvcmU6ICR7YW5uZWFsZXI/LnRvdGFsU2NvcmUgPz8gMH1gO1xuICAgIHRpbWVMaW5lLnRleHRDb250ZW50ID0gYHNlYXJjaCB0aW1lOiAkeyhhbm5lYWxlciEuZWxhcHNlZE1zLzEwMDApLnRvRml4ZWQoMil9IHNgO1xuICAgIHVuYXNzaWduZWRMaW5lLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIFwidW5hc3NpZ25lZDogXCIsXG4gICAgICAuLi5BcnJheS5mcm9tKGFubmVhbGVyIS51bmFzc2lnbmVkKVxuICAgICAgICAubWFwKCh4LCBpKSA9PiAoeyB4LCBpIH0pKVxuICAgICAgICAuZmlsdGVyKCh4KSA9PiB4LngpXG4gICAgICAgIC5mbGF0TWFwKCh4KSA9PiBbc3BhbihcIiBcIiksIGl0ZW1CdXR0b24oeC5pKV0pLFxuICAgICk7XG5cbiAgICBkZXRhaWxXcmFwLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIGRpdihcbiAgICAgICAgcChcImRldGFpbHNcIiksXG4gICAgICAgIHRhYmxlKFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdHIoY2VsbChcInVuYXNzaWduZWQgcmVxdWVzdHNcIiksIGNlbGwoQXJyYXkuZnJvbShhbm5lYWxlciEudW5hc3NpZ25lZCkubWFwKCh4LCBpKSA9PiAoeyB4LCBpIH0pKS5maWx0ZXIoKHgpID0+IHgueCkuZmxhdE1hcCgoeCkgPT4gW3NwYW4oXCIgXCIpLCBpdGVtQnV0dG9uKHguaSldKSkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJzZWFyY2ggdGltZVwiKSwgY2VsbChgJHthbm5lYWxlcj8uZWxhcHNlZE1zID8/IDB9bXNgKSksXG4gICAgICAgICAgdHIoY2VsbChcInNjb3JlXCIpLCBjZWxsKGFubmVhbGVyPy50b3RhbFNjb3JlID8/IDApKSxcbiAgICAgICAgICB0cihjZWxsKFwidHJhbnNwb3J0ZXIgY291bnRcIiksIGNlbGwobW9kLk5UUkFOUykpLFxuICAgICAgICAgIHRyKGNlbGwoXCJyZXF1ZXN0IGNvdW50XCIpLCBjZWxsKG1vZC5OUkVRUykpLFxuICAgICAgICAgIHRyKGNlbGwoXCJjb3N0IHBlciBrbVwiKSwgY2VsbChgJHtLTV9DT1NUfeKCrGApKSxcbiAgICAgICAgICB0cihjZWxsKFwiYXZlcmFnZSBzcGVlZFwiKSwgY2VsbChgJHtBVkdfU1BFRURfS01IfWttL2hgKSksXG4gICAgICAgICAgdHIoY2VsbChcInJlb3JnYW5pemF0aW9uIGNvc3RcIiksIGNlbGwoYCR7UkVPUkdfQ09TVF9FVVJ94oKsYCkpLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGZvcmNlVGFibGUgPSBmYWxzZSkge1xuICAgIHJlbmRlclN0YXR1cygpO1xuICAgIGlmIChmb3JjZVRhYmxlIHx8IChyZW5kZXJDb3VudGVyKysgJSA0ID09PSAwKSkgcmVuZGVyVGFibGUoKTtcbiAgfVxuXG4gIHJ1bkJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGlmIChhbm5lYWxpbmdUaW1lciAhPSBudWxsKSB7XG4gICAgICBzdG9wU2VhcmNoKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJ1bkJ1dHRvbi50ZXh0Q29udGVudCA9IFwic3RvcFwiO1xuICAgIGFubmVhbGluZ1RpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICghYW5uZWFsaW5nU2Vzc2lvbikgcmV0dXJuO1xuICAgICAgYW5uZWFsZXIgPSBhbm5lYWxpbmdTZXNzaW9uLml0ZXJhdGVGb3JNcygxMjApO1xuICAgICAgcmVuZGVyKCk7XG4gICAgfSwgMTUwKTtcbiAgfTtcblxuICBoZWF0QnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgaWYgKCFhbm5lYWxpbmdTZXNzaW9uKSByZXR1cm47XG4gICAgYW5uZWFsZXIgPSBhbm5lYWxpbmdTZXNzaW9uLnJlaGVhdCgpO1xuICAgIHJlbmRlcih0cnVlKTtcbiAgfTtcblxuICBsaXZlUmVuZGVyID0gKCkgPT4gcmVuZGVyKHRydWUpO1xuICByZW5kZXIodHJ1ZSk7XG4gIGNvbnRyb2xzLnJlcGxhY2VDaGlsZHJlbihydW5CdXR0b24sIGhlYXRCdXR0b24pO1xuXG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgcGFkZGluZzogXCIxZW1cIixcbiAgICAgIG92ZXJmbG93WTogXCJhdXRvXCIsXG4gICAgICBvdmVyZmxvd1g6IFwiaGlkZGVuXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcbiAgICAgIG1pbkhlaWdodDogXCIwXCIsXG4gICAgfSksXG4gICAgY29udHJvbHMsXG4gICAgc29sdmVyTGluZSxcbiAgICBzY29yZUxpbmUsXG4gICAgdGltZUxpbmUsXG4gICAgdGFibGVXcmFwLFxuICAgIGRldGFpbFdyYXAsXG4gICAgdW5hc3NpZ25lZExpbmUsXG4gICk7XG59XG5cbmV4cG9ydCBjb25zdCBhdmFpbGFibGVTb2x2ZXJzID0ge1xuICBiYXNlbGluZTogYmFzZWxpbmVBbm5lYWxpbmcsXG4gIGltcHJvdmVkOiBpbXByb3ZlZEFubmVhbGluZyxcbn0gYXMgY29uc3Q7XG4iLAogICAgImNvbnN0IG1hZ2ljID0gWzB4MDAsIDB4NjEsIDB4NzMsIDB4NmQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4MDBdXG5jb25zdCBudW1UeXBlcyA9IFtcImkzMlwiLCBcImk2NFwiLCBcImYzMlwiLCBcImY2NFwiLCBcInUxNlwiLCBcInU4XCJdIGFzIGNvbnN0XG5jb25zdCBiaW5PcHMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0gYXMgY29uc3RcbmNvbnN0IGNtcE9wcyA9IFtcImVxXCIsIFwibHRcIiwgXCJndFwiXSBhcyBjb25zdFxuXG5leHBvcnQgdHlwZSBOdW1UeXBlID0gXCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIiB8IFwidTE2XCIgfCBcInU4XCJcbmV4cG9ydCB0eXBlIEludFR5cGUgPSBcImkzMlwiIHwgXCJpNjRcIiB8IFwidTE2XCIgfCBcInU4XCJcbmV4cG9ydCB0eXBlIEFyaXRobWV0aWNPcCA9IFwiYWRkXCIgfCBcInN1YlwiIHwgXCJtdWxcIiB8IFwiZGl2XCJcbmV4cG9ydCB0eXBlIEJpdE9wID0gXCJ4b3JcIiB8IFwic2hsXCIgfCBcInNoclwiIHwgXCJhbmRcIiB8IFwib3JcIlxuZXhwb3J0IHR5cGUgUmVtYWluZGVyT3AgPSBcIm1vZFwiIHwgXCJ1bW9kXCJcbmV4cG9ydCB0eXBlIEJpbk9wID0gQXJpdGhtZXRpY09wIHwgQml0T3AgfCBSZW1haW5kZXJPcFxuZXhwb3J0IHR5cGUgQ21wT3AgPSBcImVxXCIgfCBcImx0XCIgfCBcImd0XCJcbmV4cG9ydCB0eXBlIFZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IFQgZXh0ZW5kcyBcImk2NFwiID8gYmlnaW50IDogbnVtYmVyXG50eXBlIFR5cGVkQXJyYXlGb3I8VCBleHRlbmRzIE51bVR5cGU+ID1cbiAgVCBleHRlbmRzIFwidTE2XCIgPyBVaW50MTZBcnJheSA6XG4gIFQgZXh0ZW5kcyBcInU4XCIgPyBVaW50OEFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTMyXCIgPyBJbnQzMkFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTY0XCIgPyBCaWdJbnQ2NEFycmF5IDpcbiAgVCBleHRlbmRzIFwiZjMyXCIgPyBGbG9hdDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmNjRcIiA/IEZsb2F0NjRBcnJheSA6IG5ldmVyXG5cbmV4cG9ydCB0eXBlIEZ1bmNTaWc8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUmV0IGV4dGVuZHMgTnVtVHlwZT4gPSB7IHBhcmFtczogQXJncywgcmVzdWx0OiBSZXQgfVxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPjogbmV2ZXIgfVxudHlwZSBBcmdzTGlrZTxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwckxpa2U8QXJnc1tLXT46IG5ldmVyIH1cbmV4cG9ydCB0eXBlIEFyZ3NWYWw8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBWYWx1ZTxBcmdzW0tdPiA6IG5ldmVyIH1cblxudHlwZSBDb3JlRXhwcjxUIGV4dGVuZHMgTnVtVHlwZT4gPVxuICB8IHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBULCB2YWx1ZTogVmFsdWU8VD4gfVxuICB8IHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZTogVCwgbG9jYWw6IG51bWJlciB9XG4gIHwgeyBraW5kOiBcImJpblwiLCB0eXBlOiBULCBvcDogQmluT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwiY2FsbFwiLCB0eXBlOiBULCB0YXJnZXQ6IG51bWJlciwgYXJnczogRXhwcjxOdW1UeXBlPltdIH1cbiAgfCAoVCBleHRlbmRzIFwiZjMyXCIgfCBcImY2NFwiID8geyBraW5kOiBcImNvbnZlcnRcIiwgdHlwZTogVCwgaW5wdXRUeXBlOiBJbnRUeXBlLCB1bnNpZ25lZDogYm9vbGVhbiwgdmFsdWU6IEV4cHI8SW50VHlwZT4gfSA6IG5ldmVyKVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiB8IFwidTE2XCIgPyB7IGtpbmQ6IFwiaW50LmNvbnZlcnRcIiwgdHlwZTogVCwgaW5wdXRUeXBlOiBcImkzMlwiIHwgXCJ1MTZcIiwgdmFsdWU6IEV4cHI8XCJpMzJcIiB8IFwidTE2XCI+IH0gOiBuZXZlcilcbiAgfCB7IGtpbmQ6IFwiaWZcIiwgdHlwZTogVCwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZTogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImxvYWRcIiwgdHlwZTogVCwgYXJyYXk6IG51bWJlciwgaW5kZXg6IEV4cHI8XCJpMzJcIj4gfVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiA/IHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBOdW1UeXBlLCBvcDogQ21wT3AsIGxlZnQ6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByPE51bVR5cGU+IH0gOiBuZXZlcilcblxuZXhwb3J0IHR5cGUgRXhwcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSBDb3JlRXhwcjxUPiAmIHtcbiAgYWRkKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD5cbiAgc3ViKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD5cbiAgbXVsKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD5cbiAgZGl2KHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD5cbiAgZXEocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxuICBsdChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG4gIGd0KHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbiAgYW5kKHJpZ2h0OiBFeHByTGlrZTxJbnRUeXBlPik6IEV4cHI8VD5cbiAgb3IocmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KTogRXhwcjxUPlxuICBzaHIocmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KTogRXhwcjxUPlxuICBzaGwocmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KTogRXhwcjxUPlxufVxuXG5cblxuZXhwb3J0IHR5cGUgU3RtdCA9XG4gIHwgeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbDogbnVtYmVyLCB0eXBlOiBOdW1UeXBlLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImFycmF5LnN0b3JlXCIsIGFycmF5OiBudW1iZXIsIHR5cGU6IE51bVR5cGUsIGluZGV4OiBFeHByPFwiaTMyXCI+LCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImFycmF5Lm1vdmVcIiwgYXJyYXk6IG51bWJlciwgdGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+IH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdFtdLCBlbHNlOiBTdG10W10gfVxuICB8IHsga2luZDogXCJibG9ja1wiLCBjb250cm9sOiBudW1iZXIsIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogbnVtYmVyLCBjb25kOiBFeHByPFwiaTMyXCI+LCBib2R5OiBTdG10W10gfVxuICB8IHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJleHByXCIsIGV4cHI6IEV4cHI8TnVtVHlwZT4gfVxuXG5leHBvcnQgdHlwZSBCbG9ja0hhbmRsZSA9IHsga2luZDogXCJibG9ja1wiLCBpZDogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbnVtYmVyIH1cbnR5cGUgQ29udHJvbEhhbmRsZSA9IEJsb2NrSGFuZGxlIHwgTG9vcEhhbmRsZVxuXG5leHBvcnQgdHlwZSBMb2NhbFZhcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+ICYge1xuICBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdFxuICBpYWRkKHJpZ2h0OiBFeHByTGlrZTxUPik6IFN0bXRcbiAgaXN1YihyaWdodDogRXhwckxpa2U8VD4pOiBTdG10XG4gIGltdWwocmlnaHQ6IEV4cHJMaWtlPFQ+KTogU3RtdFxuICBpZGl2KHJpZ2h0OiBFeHByTGlrZTxUPik6IFN0bXRcbn0gJiAoVCBleHRlbmRzIEludFR5cGUgPyB7IGl4b3IocmlnaHQ6IEV4cHJMaWtlPFQ+KTogU3RtdCB9IDoge30pXG5cbmV4cG9ydCB0eXBlIEFycmF5SGFuZGxlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIGlkOiBudW1iZXJcbiAgdHlwZTogVFxuICBsZW5ndGg6IG51bWJlclxuICBsb2FkKGluZGV4OiBFeHByTGlrZTxcImkzMlwiPik6IEV4cHI8VD5cbiAgc3RvcmUoaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCB2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG50eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPlxuZXhwb3J0IHR5cGUgU3RtdEJvZHkgPSBTdG10IHwgU3RtdEJvZHlbXVxudHlwZSBDb250cm9sQm9keTxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4gPSBTdG10Qm9keSB8ICgoc2VsZjogSCkgPT4gU3RtdEJvZHkpXG50eXBlIEZ1bmNCb2R5PFIgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8Uj4gfCBTdG10Qm9keVxuXG5leHBvcnQgdHlwZSBGdW5jSGFuZGxlPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBOdW1UeXBlPiA9IEZ1bmNTaWc8QSwgUj4gJiB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIGlkOiBudW1iZXJcbiAgYnVpbGQ/OiAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPlxuICBjYWxsOiAoLi4uYXJnczogQXJnc0xpa2U8QT4pID0+IEV4cHI8Uj5cbn1cblxuZXhwb3J0IHR5cGUgQW55RnVuYyA9IHtcbiAga2luZDogXCJmdW5jXCJcbiAgaWQ6IG51bWJlclxuICBwYXJhbXM6IHJlYWRvbmx5IE51bVR5cGVbXVxuICByZXN1bHQ6IE51bVR5cGVcbiAgYnVpbGQ/OiAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxOdW1UeXBlPlxuICBjYWxsOiAoLi4uYXJnczogYW55W10pID0+IEV4cHI8TnVtVHlwZT5cbn1cblxudHlwZSBBbnlBcnJheSA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIGlkOiBudW1iZXJcbiAgdHlwZTogTnVtVHlwZVxuICBsZW5ndGg6IG51bWJlclxuICBsb2FkKGluZGV4OiBFeHByTGlrZTxcImkzMlwiPik6IEV4cHI8TnVtVHlwZT5cbiAgc3RvcmUoaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCB2YWx1ZTogRXhwckxpa2U8TnVtVHlwZT4pOiBTdG10XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBNb2R1bGVEZWYgPSBSZWNvcmQ8c3RyaW5nLCBBbnlGdW5jIHwgQW55QXJyYXk+XG50eXBlIEZ1bmNEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlGdW5jPiB9XG50eXBlIEFycmF5RGVmczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHsgW0sgaW4ga2V5b2YgVCBhcyBUW0tdIGV4dGVuZHMgQW55QXJyYXkgPyBLIDogbmV2ZXJdOiBFeHRyYWN0PFRbS10sIEFueUFycmF5PiB9XG5leHBvcnQgdHlwZSBDb21waWxlUmVzdWx0PFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBbSyBpbiBrZXlvZiBUXTpcbiAgICBUW0tdIGV4dGVuZHMgQW55RnVuYyA/ICguLi5hcmdzOiBBcmdzVmFsPFRbS11bXCJwYXJhbXNcIl0+KSA9PiBWYWx1ZTxUW0tdW1wicmVzdWx0XCJdPlxuICAgIDogVFtLXSBleHRlbmRzIEFueUFycmF5ID8gVHlwZWRBcnJheUZvcjxUW0tdW1widHlwZVwiXT5cbiAgICA6IG5ldmVyXG59ICYge1xuICBtb2Q6IFdlYkFzc2VtYmx5Lk1vZHVsZVxuICBtZW1vcnk6IFdlYkFzc2VtYmx5Lk1lbW9yeVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MsIHUxNjogMHg3ZiwgdTg6IDB4N2YgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgYmluOiB7XG4gICAgYWRkOiB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCwgdTE2OiAweDZhLCB1ODogMHg2YSB9LFxuICAgIHN1YjogeyBpMzI6IDB4NmIsIGk2NDogMHg3ZCwgZjMyOiAweDkzLCBmNjQ6IDB4YTEsIHUxNjogMHg2YiwgdTg6IDB4NmIgfSxcbiAgICBtdWw6IHsgaTMyOiAweDZjLCBpNjQ6IDB4N2UsIGYzMjogMHg5NCwgZjY0OiAweGEyLCB1MTY6IDB4NmMsIHU4OiAweDZjIH0sXG4gICAgZGl2OiB7IGkzMjogMHg2ZCwgaTY0OiAweDdmLCBmMzI6IDB4OTUsIGY2NDogMHhhMywgdTE2OiAweDZlLCB1ODogMHg2ZSB9LFxuICB9IGFzIFJlY29yZDxBcml0aG1ldGljT3AsIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+PixcbiAgY21wOiB7XG4gICAgZXE6IHsgaTMyOiAweDQ2LCBpNjQ6IDB4NTEsIGYzMjogMHg1YiwgZjY0OiAweDYxLCB1MTY6IDB4NDYsIHU4OiAweDQ2IH0sXG4gICAgbHQ6IHsgaTMyOiAweDQ4LCBpNjQ6IDB4NTMsIGYzMjogMHg1ZCwgZjY0OiAweDYzLCB1MTY6IDB4NDksIHU4OiAweDQ5IH0sXG4gICAgZ3Q6IHsgaTMyOiAweDRhLCBpNjQ6IDB4NTUsIGYzMjogMHg1ZSwgZjY0OiAweDY0LCB1MTY6IDB4NGIsIHU4OiAweDRiIH0sXG4gIH0gYXMgUmVjb3JkPENtcE9wLCBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPj4sXG4gIGxvYWQ6IHsgaTMyOiAweDI4LCBpNjQ6IDB4MjksIGYzMjogMHgyYSwgZjY0OiAweDJiLCB1MTY6IDB4MmYsIHU4OiAweDJkIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4sXG4gIHN0b3JlOiB7IGkzMjogMHgzNiwgaTY0OiAweDM3LCBmMzI6IDB4MzgsIGY2NDogMHgzOSwgdTE2OiAweDNiLCB1ODogMHgzYSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICBiaXQ6IHtcbiAgICBhbmQ6IHsgaTMyOiAweDcxLCBpNjQ6IDB4ODMsIHUxNjogMHg3MSwgdTg6IDB4NzEgfSxcbiAgICBvcjogeyBpMzI6IDB4NzIsIGk2NDogMHg4NCwgdTE2OiAweDcyLCB1ODogMHg3MiB9LFxuICAgIHhvcjogeyBpMzI6IDB4NzMsIGk2NDogMHg4NSwgdTE2OiAweDczLCB1ODogMHg3MyB9LFxuICAgIHNobDogeyBpMzI6IDB4NzQsIGk2NDogMHg4NiwgdTE2OiAweDc0LCB1ODogMHg3NCB9LFxuICAgIHNocjogeyBpMzI6IDB4NzYsIGk2NDogMHg4OCwgdTE2OiAweDc2LCB1ODogMHg3NiB9LFxuXG4gIH0gYXMgUmVjb3JkPEJpdE9wLCBSZWNvcmQ8SW50VHlwZSwgbnVtYmVyPj4sXG4gIHJlbWFpbmRlcjoge1xuICAgIG1vZDogeyBpMzI6IDB4NmYsIGk2NDogMHg4MSwgdTE2OiAweDcwLCB1ODogMHg3MCB9LFxuICAgIHVtb2Q6IHsgaTMyOiAweDcwLCBpNjQ6IDB4ODIsIHUxNjogMHg3MCwgdTg6IDB4NzAgfSxcbiAgfSBhcyBSZWNvcmQ8UmVtYWluZGVyT3AsIFJlY29yZDxJbnRUeXBlLCBudW1iZXI+PixcbiAgYnl0ZXM6IHsgaTMyOiA0LCBpNjQ6IDgsIGYzMjogNCwgZjY0OiA4LCB1MTY6IDIsIHU4OiAxIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4sXG4gIGFsaWduOiB7IGkzMjogMiwgaTY0OiAzLCBmMzI6IDIsIGY2NDogMywgdTE2OiAxLCB1ODogMCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICB6ZXJvOiB7IGkzMjogWzB4NDEsIDBdLCBpNjQ6IFsweDQyLCAwXSwgZjMyOiBbMHg0MywgMCwgMCwgMCwgMF0sIGY2NDogWzB4NDQsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLCB1MTY6IFsweDQxLCAwXSwgdTg6IFsweDQxLCAwXSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXJbXT4sXG4gIGNvbnZlcnQ6IHsgZjMyOiB7IGkzMjogMHhiMiwgdTMyOiAweGIzLCBpNjQ6IDB4YjQsIHU2NDogMHhiNSB9LCBmNjQ6IHsgaTMyOiAweGI3LCB1MzI6IDB4YjgsIGk2NDogMHhiOSwgdTY0OiAweGJhIH0gfSxcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5sZXQgbmV4dEZ1bmNJZCA9IDBcbmxldCBuZXh0TG9jYWxJZCA9IDBcbmxldCBuZXh0QXJyYXlJZCA9IDBcbmxldCBuZXh0Q29udHJvbElkID0gMFxuY29uc3QgYXJyYXlSZWdpc3RyeSA9IG5ldyBNYXA8bnVtYmVyLCBBbnlBcnJheT4oKVxuY29uc3QgZnVuY3Rpb25SZWdpc3RyeSA9IG5ldyBNYXA8bnVtYmVyLCBBbnlGdW5jPigpXG5cbmNvbnN0IGluZmVyVHlwZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHJMaWtlPFQ+KSA9PlxuICAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIFwidHlwZVwiIGluIHZhbHVlID8gdmFsdWUudHlwZSA6IFwiaTMyXCIpIGFzIFRcblxuY29uc3QgYWRkRXhwck9wcyA9IDxUIGV4dGVuZHMgTnVtVHlwZT4oZTogRXhwcjxUPikgPT4ge1xuICBmb3IgKGNvbnN0IG9wIG9mIGJpbk9wcykgZVtvcF0gPSByID0+IGJpbihvcCwgZSwgcikgYXMgRXhwcjxUPlxuICBmb3IgKGNvbnN0IG9wIG9mIGNtcE9wcykgZVtvcF0gPSByID0+IGNtcChvcCwgZSwgcikgYXMgRXhwcjxcImkzMlwiPlxuICByZXR1cm4gZVxufVxuXG5jb25zdCBleHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPik6IEV4cHI8VD4gPT4ge1xuICByZXR1cm4gYWRkRXhwck9wcyhub2RlIGFzIEV4cHI8VD4pXG59XG5cbmNvbnN0IGxpdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PiB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXCJraW5kXCIgaW4gdmFsdWUpIHJldHVybiB2YWx1ZSBhcyBFeHByPFQ+XG4gIH1cbiAgcmV0dXJuIGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBWYWx1ZTxUPiB9KVxufVxuXG5jb25zdCBpc1N0bXQgPSAoeDogdW5rbm93bik6IHggaXMgU3RtdCA9PlxuICAhIXggJiYgdHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgXCJraW5kXCIgaW4geCAmJiAoXG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJsb2NhbC5zZXRcIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiYXJyYXkuc3RvcmVcIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiYXJyYXkubW92ZVwiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJibG9ja1wiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJsb29wXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImJyZWFrXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImNvbnRpbnVlXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcInJldHVyblwiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJleHByXCIgfHxcbiAgICAoKHggYXMgU3RtdCkua2luZCA9PT0gXCJpZlwiICYmIEFycmF5LmlzQXJyYXkoKHggYXMgeyB0aGVuPzogdW5rbm93biB9KS50aGVuKSlcbiAgKVxuXG5jb25zdCBzdG10TGlzdCA9IChib2R5OiBTdG10Qm9keSk6IFN0bXRbXSA9PiBBcnJheS5pc0FycmF5KGJvZHkpID8gYm9keS5mbGF0TWFwKHN0bXRMaXN0KSA6IFtib2R5XVxuY29uc3QgYXNTdG10cyA9IDxSIGV4dGVuZHMgTnVtVHlwZT4oYm9keTogRnVuY0JvZHk8Uj4pID0+IGlzU3RtdChib2R5KSA/IFtib2R5XSA6IEFycmF5LmlzQXJyYXkoYm9keSkgPyBzdG10TGlzdChib2R5KSA6IG51bGxcbmNvbnN0IGJpbmRTdG10cyA9IChib2R5OiBTdG10Qm9keSwgYnI6IG51bWJlciwgbG9vcDogbnVtYmVyIHwgbnVsbCk6IFN0bXRbXSA9PlxuICBzdG10TGlzdChib2R5KS5tYXAocyA9PiBiaW5kU3RtdChzLCBiciwgbG9vcCkpXG5cbmNvbnN0IGJpbmRTdG10ID0gKHM6IFN0bXQsIGJyOiBudW1iZXIsIGxvb3A6IG51bWJlciB8IG51bGwpOiBTdG10ID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIHsgLi4ucywgdGhlbjogYmluZFN0bXRzKHMudGhlbiwgYnIsIGxvb3ApLCBlbHNlOiBiaW5kU3RtdHMocy5lbHNlLCBiciwgbG9vcCkgfVxuICAgIGNhc2UgXCJicmVha1wiOiByZXR1cm4geyAuLi5zLCB0YXJnZXQ6IHMudGFyZ2V0ID8/IGJyIH1cbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIGlmIChzLnRhcmdldCAhPSBudWxsKSByZXR1cm4gc1xuICAgICAgaWYgKGxvb3AgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiB7IC4uLnMsIHRhcmdldDogbG9vcCB9XG4gICAgZGVmYXVsdDogcmV0dXJuIHNcbiAgfVxufVxuXG5jb25zdCBjb250cm9sQm9keSA9IDxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4oc2VsZjogSCwgYm9keTogQ29udHJvbEJvZHk8SD4pID0+XG4gIGJpbmRTdG10cyh0eXBlb2YgYm9keSA9PT0gXCJmdW5jdGlvblwiID8gYm9keShzZWxmKSA6IGJvZHksIHNlbGYuaWQsIHNlbGYua2luZCA9PT0gXCJsb29wXCIgPyBzZWxmLmlkIDogbnVsbClcblxuY29uc3QgYmluID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQXJpdGhtZXRpY09wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHIoeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0KGxlZnQudHlwZSwgcmlnaHQpIH0pXG5cbmNvbnN0IGJpdCA9IDxUIGV4dGVuZHMgSW50VHlwZT4ob3A6IEJpdE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHIoeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0KGxlZnQudHlwZSwgcmlnaHQpIH0pXG5cbmNvbnN0IHJlbWFpbmRlciA9IDxUIGV4dGVuZHMgSW50VHlwZT4ob3A6IFJlbWFpbmRlck9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHIoeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0KGxlZnQudHlwZSwgcmlnaHQpIH0pXG5cbmNvbnN0IGNtcCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4ob3A6IENtcE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHIoeyBraW5kOiBcImNtcFwiLCB0eXBlOiBcImkzMlwiLCBpbnB1dFR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQobGVmdC50eXBlLCByaWdodCkgfSlcblxuY29uc3QgbG9jYWxFeHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCBsb2NhbDogbnVtYmVyKSA9PiBleHByKHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZSwgbG9jYWwgfSlcblxuY29uc3QgbWtMb2NhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IExvY2FsVmFyPFQ+ID0+IHtcbiAgY29uc3QgaWQgPSBuZXh0TG9jYWxJZCsrXG4gIGNvbnN0IHNldCA9ICh2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10ID0+ICh7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBpZCwgdHlwZSwgdmFsdWU6IGxpdCh0eXBlLCB2YWx1ZSkgYXMgRXhwcjxOdW1UeXBlPiB9KVxuICBjb25zdCB2YWx1ZSA9IGxvY2FsRXhwcih0eXBlLCBpZClcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24odmFsdWUsIHtcbiAgICBzZXQsXG4gICAgaWFkZDogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gc2V0KHZhbHVlLmFkZChyaWdodCkpLFxuICAgIGlzdWI6IChyaWdodDogRXhwckxpa2U8VD4pID0+IHNldCh2YWx1ZS5zdWIocmlnaHQpKSxcbiAgICBpbXVsOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBzZXQodmFsdWUubXVsKHJpZ2h0KSksXG4gICAgaWRpdjogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gc2V0KHZhbHVlLmRpdihyaWdodCkpLFxuXG4gICAgaWFuZDogKHJpZ2h0OiBFeHByTGlrZTxJbnRUeXBlPikgPT4gc2V0KGJpdChcImFuZFwiLCB2YWx1ZSBhcyBFeHByPEludFR5cGU+LCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+KSxcbiAgICBpb3I6IChyaWdodDogRXhwckxpa2U8SW50VHlwZT4pID0+IHNldChiaXQoXCJvclwiLCB2YWx1ZSBhcyBFeHByPEludFR5cGU+LCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+KSxcbiAgICBpeG9yOiAocmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KSA9PiBzZXQoYml0KFwieG9yXCIsIHZhbHVlIGFzIEV4cHI8SW50VHlwZT4sIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8VD4pLFxuICB9KSBhcyBMb2NhbFZhcjxUPlxufVxuXG5jb25zdCBta0hhbmRsZSA9IDxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4oXG4gIHBhcmFtczogQSxcbiAgcmVzdWx0OiBSLFxuICBidWlsZD86ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+LFxuKTogRnVuY0hhbmRsZTxBLCBSPiA9PiB7XG4gIGNvbnN0IGlkID0gbmV4dEZ1bmNJZCsrXG4gIGNvbnN0IGhhbmRsZTogRnVuY0hhbmRsZTxBLCBSPiA9IHtcbiAgICBraW5kOiBcImZ1bmNcIixcbiAgICBpZCwgcGFyYW1zLCByZXN1bHQsIGJ1aWxkLFxuICAgIGNhbGw6ICguLi5hcmdzOiBBcmdzTGlrZTxBPikgPT4gZXhwcih7XG4gICAgICBraW5kOiBcImNhbGxcIixcbiAgICAgIHR5cGU6IHJlc3VsdCxcbiAgICAgIHRhcmdldDogaWQsXG4gICAgICBhcmdzOiBwYXJhbXMubWFwKCh0eXBlLCBpKSA9PiBsaXQodHlwZSwgYXJnc1tpXSBhcyBFeHByTGlrZTx0eXBlb2YgdHlwZT4pKSBhcyBFeHByPE51bVR5cGU+W10sXG4gICAgfSkgYXMgRXhwcjxSPixcbiAgfVxuICBmdW5jdGlvblJlZ2lzdHJ5LnNldChpZCwgaGFuZGxlIGFzIEFueUZ1bmMpXG4gIHJldHVybiBoYW5kbGVcbn1cblxuY29uc3QgbWtBcnJheSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgbGVuZ3RoOiBudW1iZXIpOiBBcnJheUhhbmRsZTxUPiA9PiB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihsZW5ndGgpIHx8IGxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXJyYXkgbGVuZ3RoICR7bGVuZ3RofWApXG4gIGNvbnN0IGlkID0gbmV4dEFycmF5SWQrK1xuICBjb25zdCBoYW5kbGU6IEFycmF5SGFuZGxlPFQ+ID0ge1xuICAgIGtpbmQ6IFwiYXJyYXlcIixcbiAgICBpZCwgdHlwZSwgbGVuZ3RoLFxuICAgIGxvYWQ6IGluZGV4ID0+IGV4cHIoeyBraW5kOiBcImxvYWRcIiwgdHlwZSwgYXJyYXk6IGlkLCBpbmRleDogbGl0KFwiaTMyXCIsIGluZGV4KSB9KSxcbiAgICBzdG9yZTogKGluZGV4LCB2YWx1ZSkgPT4gKHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheTogaWQsIHR5cGUsIGluZGV4OiBsaXQoXCJpMzJcIiwgaW5kZXgpLCB2YWx1ZTogbGl0KHR5cGUsIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+IH0pLFxuICAgIG1vdmU6ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+ICh7IGtpbmQ6IFwiYXJyYXkubW92ZVwiLCBhcnJheTogaWQsIHRhcmdldDogbGl0KFwiaTMyXCIsIHRhcmdldCksIHNvdXJjZTogbGl0KFwiaTMyXCIsIHNvdXJjZSksIGNvdW50OiBsaXQoXCJpMzJcIiwgY291bnQpIH0pLFxuICB9XG4gIGFycmF5UmVnaXN0cnkuc2V0KGlkLCBoYW5kbGUgYXMgdW5rbm93biBhcyBBbnlBcnJheSlcbiAgcmV0dXJuIGhhbmRsZVxufVxuXG5leHBvcnQgY29uc3QgaTMyID0gKG46IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJpMzJcIiwgdmFsdWU6IG4gfSlcbmV4cG9ydCBjb25zdCBpNjQgPSAobjogYmlnaW50KSA9PiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBcImk2NFwiLCB2YWx1ZTogbiB9KVxuZXhwb3J0IGNvbnN0IGYzMiA9IChuOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFwiZjMyXCIsIHZhbHVlOiBuIH0pXG5leHBvcnQgY29uc3QgZjY0ID0gKG46IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJmNjRcIiwgdmFsdWU6IG4gfSlcbmV4cG9ydCBjb25zdCB1MTYgPSAobjogbnVtYmVyKSA9PiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBcInUxNlwiLCB2YWx1ZTogbiAmIDB4ZmZmZiB9KVxuZXhwb3J0IGNvbnN0IHU4ID0gKG46IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJ1OFwiLCB2YWx1ZTogbiAmIDB4ZmYgfSlcblxuZXhwb3J0IGNvbnN0IGlmRWxzZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4oY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZV86IEV4cHI8VD4pID0+XG4gIGV4cHIoeyBraW5kOiBcImlmXCIsIHR5cGU6IHRoZW4udHlwZSwgY29uZCwgdGhlbiwgZWxzZTogZWxzZV8gfSlcblxuZXhwb3J0IGNvbnN0IGFkZCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4oXCJhZGRcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3Qgc3ViID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihcInN1YlwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBtdWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKFwibXVsXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IGRpdiA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4oXCJkaXZcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3QgYW5kID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpdChcImFuZFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBvciA9IDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaXQoXCJvclwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCB4b3IgPSA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYml0KFwieG9yXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IHNobCA9IDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaXQoXCJzaGxcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3Qgc2hyID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpdChcInNoclwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBtb2QgPSA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gcmVtYWluZGVyKFwibW9kXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IHVtb2QgPSA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gcmVtYWluZGVyKFwidW1vZFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBlcSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJlcVwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBsdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJsdFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBndCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJndFwiLCBsZWZ0LCByaWdodClcbmNvbnN0IGNvbnZlcnQgPSA8VCBleHRlbmRzIFwiZjMyXCIgfCBcImY2NFwiLCBJIGV4dGVuZHMgSW50VHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHI8ST4sIHVuc2lnbmVkID0gdmFsdWUudHlwZSA9PT0gXCJ1OFwiIHx8IHZhbHVlLnR5cGUgPT09IFwidTE2XCIpID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImNvbnZlcnRcIiwgdHlwZSwgaW5wdXRUeXBlOiB2YWx1ZS50eXBlLCB1bnNpZ25lZCwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8SW50VHlwZT4gfSBhcyBDb3JlRXhwcjxUPilcbmV4cG9ydCBjb25zdCB0b0YzMiA9IDxUIGV4dGVuZHMgSW50VHlwZT4odmFsdWU6IEV4cHI8VD4pID0+IGNvbnZlcnQoXCJmMzJcIiwgdmFsdWUpXG5leHBvcnQgY29uc3QgdG9GNjQgPSA8VCBleHRlbmRzIEludFR5cGU+KHZhbHVlOiBFeHByPFQ+KSA9PiBjb252ZXJ0KFwiZjY0XCIsIHZhbHVlKVxuZXhwb3J0IGNvbnN0IHUzMlRvRjMyID0gKHZhbHVlOiBFeHByPFwiaTMyXCI+KSA9PiBjb252ZXJ0KFwiZjMyXCIsIHZhbHVlLCB0cnVlKVxuZXhwb3J0IGNvbnN0IHUzMlRvRjY0ID0gKHZhbHVlOiBFeHByPFwiaTMyXCI+KSA9PiBjb252ZXJ0KFwiZjY0XCIsIHZhbHVlLCB0cnVlKVxuZXhwb3J0IGNvbnN0IHRvVTE2ID0gKHZhbHVlOiBFeHByPFwiaTMyXCI+KSA9PlxuICBleHByPFwidTE2XCI+KHsga2luZDogXCJpbnQuY29udmVydFwiLCB0eXBlOiBcInUxNlwiLCBpbnB1dFR5cGU6IFwiaTMyXCIsIHZhbHVlIH0gYXMgQ29yZUV4cHI8XCJ1MTZcIj4pXG5leHBvcnQgY29uc3QgdG9JMzIgPSAodmFsdWU6IEV4cHI8XCJ1MTZcIj4pID0+XG4gIGV4cHI8XCJpMzJcIj4oeyBraW5kOiBcImludC5jb252ZXJ0XCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogXCJ1MTZcIiwgdmFsdWUgfSBhcyBDb3JlRXhwcjxcImkzMlwiPilcblxuZXhwb3J0IGNvbnN0IGRlY2xhcmUgPSA8Y29uc3QgQSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIE51bVR5cGU+KHBhcmFtczogQSwgcmVzdWx0OiBSKSA9PiBta0hhbmRsZShwYXJhbXMsIHJlc3VsdClcbmV4cG9ydCBjb25zdCBmdW5jID0gPGNvbnN0IEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBOdW1UeXBlPihwYXJhbXM6IEEsIHJlc3VsdDogUiwgYnVpbGQ6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gRnVuY0JvZHk8Uj4pID0+XG4gIG1rSGFuZGxlKHBhcmFtcywgcmVzdWx0LCBidWlsZCBhcyAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPilcbmV4cG9ydCBjb25zdCBhcnJheSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgbGVuZ3RoOiBudW1iZXIpID0+IG1rQXJyYXkodHlwZSwgbGVuZ3RoKVxuXG5leHBvcnQgY29uc3QgbG9jYWwgPSBPYmplY3QuZnJvbUVudHJpZXMobnVtVHlwZXMubWFwKHR5cGUgPT4gW3R5cGUsICgpID0+IG1rTG9jYWwodHlwZSldKSkgYXMgdW5rbm93biBhcyB7IFtUIGluIE51bVR5cGVdOiAoKSA9PiBMb2NhbFZhcjxUPiB9XG5cbmV4cG9ydCBjb25zdCByZXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXQgPT4gKHtcbiAga2luZDogXCJyZXR1cm5cIixcbiAgdmFsdWU6IGxpdChpbmZlclR5cGUodmFsdWUpLCB2YWx1ZSkgYXMgRXhwcjxOdW1UeXBlPixcbn0pXG5leHBvcnQgY29uc3QgaWZTdG10ID0gKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IFN0bXRbXSwgZWxzZV86IFN0bXRbXSA9IFtdKTogU3RtdCA9PiAoeyBraW5kOiBcImlmXCIsIGNvbmQsIHRoZW4sIGVsc2U6IGVsc2VfIH0pXG5leHBvcnQgY29uc3QgYmxvY2sgPSAoYm9keTogQ29udHJvbEJvZHk8QmxvY2tIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cbmV4cG9ydCBjb25zdCBsb29wID0gKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IENvbnRyb2xCb2R5PExvb3BIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbmV4dENvbnRyb2xJZCsrIH1cbiAgcmV0dXJuIHsga2luZDogXCJsb29wXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGNvbmQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cblxuZXhwb3J0IGNvbnN0IGJyZWFrVG8gPSAodGFyZ2V0PzogQ29udHJvbEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGNvbnRpbnVlVG8gPSAodGFyZ2V0PzogTG9vcEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGV4cHJTdG10ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IFN0bXQgPT4gKHsga2luZDogXCJleHByXCIsIGV4cHI6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSlcblxudHlwZSBBcnJheUxheW91dCA9IHsgdHlwZTogTnVtVHlwZSwgbGVuZ3RoOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIENvbXBpbGVPcHRpb25zID0ge1xuICBydW50aW1lQm91bmRzQ2hlY2tzPzogYm9vbGVhblxufVxudHlwZSBNb2R1bGVBbmFseXNpczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgZnVuY3M6IEZ1bmNEZWZzPFQ+XG4gIGFycmF5czogQXJyYXlEZWZzPFQ+XG4gIGZFbnRyaWVzOiBba2V5b2YgRnVuY0RlZnM8VD4gJiBzdHJpbmcsIEZ1bmNEZWZzPFQ+W2tleW9mIEZ1bmNEZWZzPFQ+XV1bXVxuICBidWlsdEZ1bmNzOiBCdWlsdEZ1bmNbXVxuICBmaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj5cbiAgbGF5b3V0czogUmVjb3JkPG51bWJlciwgQXJyYXlMYXlvdXQ+XG4gIHBhZ2VzOiBudW1iZXJcbn1cblxuY29uc3Qgd2Fsa0V4cHIgPSAoZTogRXhwcjxOdW1UeXBlPiwgZm5zOiB7XG4gIGxvY2FsPzogKGlkOiBudW1iZXIsIHR5cGU6IE51bVR5cGUpID0+IHZvaWRcbiAgYXJyYXk/OiAoaWQ6IG51bWJlcikgPT4gdm9pZFxuICBmdW5jPzogKGlkOiBudW1iZXIpID0+IHZvaWRcbn0pID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjogcmV0dXJuXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOiBmbnMubG9jYWw/LihlLmxvY2FsLCBlLnR5cGUpOyByZXR1cm5cbiAgICBjYXNlIFwiYmluXCI6XG4gICAgY2FzZSBcImNtcFwiOlxuICAgICAgd2Fsa0V4cHIoZS5sZWZ0LCBmbnMpOyB3YWxrRXhwcihlLnJpZ2h0LCBmbnMpOyByZXR1cm5cbiAgICBjYXNlIFwiY2FsbFwiOlxuICAgICAgZm5zLmZ1bmM/LihlLnRhcmdldClcbiAgICAgIGUuYXJncy5mb3JFYWNoKGFyZyA9PiB3YWxrRXhwcihhcmcsIGZucykpOyByZXR1cm5cbiAgICBjYXNlIFwiY29udmVydFwiOlxuICAgICAgd2Fsa0V4cHIoZS52YWx1ZSwgZm5zKTsgcmV0dXJuXG4gICAgY2FzZSBcImludC5jb252ZXJ0XCI6XG4gICAgICB3YWxrRXhwcihlLnZhbHVlLCBmbnMpOyByZXR1cm5cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHdhbGtFeHByKGUuY29uZCwgZm5zKTsgd2Fsa0V4cHIoZS50aGVuLCBmbnMpOyB3YWxrRXhwcihlLmVsc2UsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJsb2FkXCI6XG4gICAgICBmbnMuYXJyYXk/LihlLmFycmF5KTsgd2Fsa0V4cHIoZS5pbmRleCwgZm5zKTsgcmV0dXJuXG4gICAgZGVmYXVsdDogZGllKGUpXG4gIH1cbn1cblxuY29uc3Qgd2Fsa1N0bXQgPSAoczogU3RtdCwgZm5zOiB7XG4gIGxvY2FsPzogKGlkOiBudW1iZXIsIHR5cGU6IE51bVR5cGUpID0+IHZvaWRcbiAgYXJyYXk/OiAoaWQ6IG51bWJlcikgPT4gdm9pZFxuICBmdW5jPzogKGlkOiBudW1iZXIpID0+IHZvaWRcbn0pID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6IGZucy5sb2NhbD8uKHMubG9jYWwsIHMudHlwZSk7IHdhbGtFeHByKHMudmFsdWUsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiBmbnMuYXJyYXk/LihzLmFycmF5KTsgd2Fsa0V4cHIocy5pbmRleCwgZm5zKTsgd2Fsa0V4cHIocy52YWx1ZSwgZm5zKTsgcmV0dXJuXG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjogZm5zLmFycmF5Py4ocy5hcnJheSk7IHdhbGtFeHByKHMudGFyZ2V0LCBmbnMpOyB3YWxrRXhwcihzLnNvdXJjZSwgZm5zKTsgd2Fsa0V4cHIocy5jb3VudCwgZm5zKTsgcmV0dXJuXG4gICAgY2FzZSBcImlmXCI6IHdhbGtFeHByKHMuY29uZCwgZm5zKTsgcy50aGVuLmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcy5lbHNlLmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImJsb2NrXCI6IHMuYm9keS5mb3JFYWNoKHggPT4gd2Fsa1N0bXQoeCwgZm5zKSk7IHJldHVyblxuICAgIGNhc2UgXCJsb29wXCI6IHdhbGtFeHByKHMuY29uZCwgZm5zKTsgcy5ib2R5LmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwicmV0dXJuXCI6IHdhbGtFeHByKHMudmFsdWUsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJleHByXCI6IHdhbGtFeHByKHMuZXhwciwgZm5zKTsgcmV0dXJuXG4gICAgZGVmYXVsdDogZGllKHMpXG4gIH1cbn1cblxuY29uc3QgYWRkciA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPikgPT4gaW5kZXgubXVsKGNvZGVzLmJ5dGVzW2xheW91dC50eXBlXSkuYWRkKGxheW91dC5vZmZzZXQpXG5jb25zdCBtZW1hcmcgPSAodHlwZTogTnVtVHlwZSwgb2Zmc2V0ID0gMCkgPT4gWy4uLnUzMihjb2Rlcy5hbGlnblt0eXBlXSksIC4uLnUzMihvZmZzZXQpXVxuY29uc3QgY29uc3RJMzIgPSAoZTogRXhwcjxcImkzMlwiPikgPT4gZS5raW5kID09PSBcImNvbnN0XCIgPyBlLnZhbHVlIDogbnVsbFxuY29uc3QgY2hlY2tBcnJheUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPikgPT4ge1xuICBjb25zdCBuID0gY29uc3RJMzIoaW5kZXgpXG4gIGlmIChuID09IG51bGwpIHJldHVyblxuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDAgfHwgbiA+PSBsYXlvdXQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IGluZGV4ICR7bn0gb3V0IG9mIGJvdW5kcyBmb3IgbGVuZ3RoICR7bGF5b3V0Lmxlbmd0aH1gKVxufVxuY29uc3QgY2hlY2tNb3ZlQm91bmRzID0gKGxheW91dDogQXJyYXlMYXlvdXQsIHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPikgPT4ge1xuICBjb25zdCB2YWx1ZXMgPSBbY29uc3RJMzIodGFyZ2V0KSwgY29uc3RJMzIoc291cmNlKSwgY29uc3RJMzIoY291bnQpXVxuICBpZiAodmFsdWVzLnNvbWUodmFsdWUgPT4gdmFsdWUgPT0gbnVsbCkpIHJldHVyblxuICBjb25zdCBbdG8sIGZyb20sIHNpemVdID0gdmFsdWVzIGFzIG51bWJlcltdXG4gIGlmICh0byEgPCAwIHx8IGZyb20hIDwgMCB8fCBzaXplISA8IDAgfHwgdG8hICsgc2l6ZSEgPiBsYXlvdXQubGVuZ3RoIHx8IGZyb20hICsgc2l6ZSEgPiBsYXlvdXQubGVuZ3RoKVxuICAgIHRocm93IG5ldyBFcnJvcihgQXJyYXkgbW92ZSAoJHt0b30sICR7ZnJvbX0sICR7c2l6ZX0pIG91dCBvZiBib3VuZHMgZm9yIGxlbmd0aCAke2xheW91dC5sZW5ndGh9YClcbn1cblxuY29uc3QgcnVudGltZUJvdW5kc0d1YXJkID0gKFxuICBpbmRleDogRXhwcjxcImkzMlwiPixcbiAgbGVuZ3RoOiBudW1iZXIsXG4gIGZpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPixcbiAgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LFxuICBhcnJheXM6IFJlY29yZDxudW1iZXIsIEFycmF5TGF5b3V0PixcbiAgb3B0aW9uczogQ29tcGlsZU9wdGlvbnMsXG4pID0+IG9wdGlvbnMucnVudGltZUJvdW5kc0NoZWNrcyA/IFtcbiAgLi4uY29tcGlsZUV4cHIoaW5kZXgsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCAweDQxLCAweDAwLCAweDQ4LFxuICAuLi5jb21waWxlRXhwcihpbmRleCwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucyksIDB4NDEsIC4uLnNOKGxlbmd0aCwgMzIpLCAweDRmLFxuICAweDcyLCAweDA0LCAweDQwLCAweDAwLCAweDBiLFxuXSA6IFtdXG5cbmNvbnN0IHJ1bnRpbWVNb3ZlQm91bmRzR3VhcmQgPSAoXG4gIGxheW91dDogQXJyYXlMYXlvdXQsXG4gIHRhcmdldDogRXhwcjxcImkzMlwiPixcbiAgc291cmNlOiBFeHByPFwiaTMyXCI+LFxuICBjb3VudDogRXhwcjxcImkzMlwiPixcbiAgZml4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LFxuICBsaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj4sXG4gIGFycmF5czogUmVjb3JkPG51bWJlciwgQXJyYXlMYXlvdXQ+LFxuICBvcHRpb25zOiBDb21waWxlT3B0aW9ucyxcbikgPT4ge1xuICBpZiAoIW9wdGlvbnMucnVudGltZUJvdW5kc0NoZWNrcykgcmV0dXJuIFtdXG4gIGNvbnN0IGNvZGUgPSAodmFsdWU6IEV4cHI8XCJpMzJcIj4pID0+IGNvbXBpbGVFeHByKHZhbHVlLCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zKVxuICBjb25zdCB0cmFwSWYgPSAoY29uZGl0aW9uOiBudW1iZXJbXSkgPT4gWy4uLmNvbmRpdGlvbiwgMHgwNCwgMHg0MCwgMHgwMCwgMHgwYl1cbiAgY29uc3QgbmVnYXRpdmUgPSAodmFsdWU6IEV4cHI8XCJpMzJcIj4pID0+IHRyYXBJZihbLi4uY29kZSh2YWx1ZSksIDB4NDEsIDB4MDAsIDB4NDhdKVxuICBjb25zdCBjb3VudFBhc3RFbmQgPSB0cmFwSWYoWy4uLmNvZGUoY291bnQpLCAweDQxLCAuLi5zTihsYXlvdXQubGVuZ3RoLCAzMiksIDB4NGJdKVxuICBjb25zdCBwYXN0RW5kID0gKHN0YXJ0OiBFeHByPFwiaTMyXCI+KSA9PiB0cmFwSWYoWy4uLmNvZGUoc3RhcnQpLCAweDQxLCAuLi5zTihsYXlvdXQubGVuZ3RoLCAzMiksIC4uLmNvZGUoY291bnQpLCAweDZiLCAweDRiXSlcbiAgcmV0dXJuIFsuLi5uZWdhdGl2ZSh0YXJnZXQpLCAuLi5uZWdhdGl2ZShzb3VyY2UpLCAuLi5uZWdhdGl2ZShjb3VudCksIC4uLmNvdW50UGFzdEVuZCwgLi4ucGFzdEVuZCh0YXJnZXQpLCAuLi5wYXN0RW5kKHNvdXJjZSldXG59XG5cbmNvbnN0IGNvbXBpbGVFeHByID0gKGU6IEV4cHI8TnVtVHlwZT4sIGZpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPiwgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LCBhcnJheXM6IFJlY29yZDxudW1iZXIsIEFycmF5TGF5b3V0Piwgb3B0aW9uczogQ29tcGlsZU9wdGlvbnMpOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAoZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6XG4gICAgICBpZiAoZS50eXBlID09PSBcImkzMlwiKSByZXR1cm4gWzB4NDEsIC4uLnNOKGUudmFsdWUgYXMgbnVtYmVyLCAzMildXG4gICAgICBpZiAoZS50eXBlID09PSBcInUxNlwiIHx8IGUudHlwZSA9PT0gXCJ1OFwiKSByZXR1cm4gWzB4NDEsIC4uLnNOKGUudmFsdWUgYXMgbnVtYmVyLCAzMildXG4gICAgICBpZiAoZS50eXBlID09PSBcImk2NFwiKSByZXR1cm4gWzB4NDIsIC4uLnNOKGUudmFsdWUsIDY0KV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZjMyXCIpIHJldHVybiBbMHg0MywgLi4uZk4oZS52YWx1ZSBhcyBudW1iZXIsIDQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmNjRcIikgcmV0dXJuIFsweDQ0LCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgOCldXG4gICAgICByZXR1cm4gZGllKGUpXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIwLCAuLi51MzIobGl4W2UubG9jYWxdISldXG4gICAgY2FzZSBcImJpblwiOiB7XG4gICAgICBjb25zdCBvcGNvZGUgPSBlLm9wIGluIGNvZGVzLmJpdFxuICAgICAgICA/IGNvZGVzLmJpdFtlLm9wIGFzIEJpdE9wXVtlLnR5cGUgYXMgSW50VHlwZV1cbiAgICAgICAgOiBlLm9wIGluIGNvZGVzLnJlbWFpbmRlclxuICAgICAgICA/IGNvZGVzLnJlbWFpbmRlcltlLm9wIGFzIFJlbWFpbmRlck9wXVtlLnR5cGUgYXMgSW50VHlwZV1cbiAgICAgICAgOiBjb2Rlcy5iaW5bZS5vcCBhcyBBcml0aG1ldGljT3BdW2UudHlwZV1cbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0LCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zKSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucyksIG9wY29kZV1cbiAgICB9XG4gICAgY2FzZSBcImNtcFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0LCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zKSwgY29kZXMuY21wW2Uub3BdW2UuaW5wdXRUeXBlXV1cbiAgICBjYXNlIFwiY2FsbFwiOlxuICAgICAgaWYgKGZpeFtlLnRhcmdldF0gPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGZ1bmN0aW9uICR7ZS50YXJnZXR9YClcbiAgICAgIHJldHVybiBbLi4uZmxhdE1hcChlLmFyZ3MsIGFyZyA9PiBjb21waWxlRXhwcihhcmcsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpKSwgMHgxMCwgLi4udTMyKGZpeFtlLnRhcmdldF0hKV1cbiAgICBjYXNlIFwiY29udmVydFwiOiB7XG4gICAgICBjb25zdCBpbnB1dCA9IGUuaW5wdXRUeXBlID09PSBcImk2NFwiID8gKGUudW5zaWduZWQgPyBcInU2NFwiIDogXCJpNjRcIikgOiAoZS51bnNpZ25lZCA/IFwidTMyXCIgOiBcImkzMlwiKVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLnZhbHVlLCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zKSwgY29kZXMuY29udmVydFtlLnR5cGVdW2lucHV0XV1cbiAgICB9XG4gICAgY2FzZSBcImludC5jb252ZXJ0XCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUudmFsdWUsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCAuLi4oZS50eXBlID09PSBcInUxNlwiID8gWzB4NDEsIC4uLnNOKDB4ZmZmZiwgMzIpLCAweDcxXSA6IFtdKV1cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5jb25kLCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zKSwgMHgwNCwgY29kZXMudHlwZVtlLnR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4sIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5c1tlLmFycmF5XVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke2UuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBlLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5ydW50aW1lQm91bmRzR3VhcmQoZS5pbmRleCwgbGF5b3V0Lmxlbmd0aCwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucyksIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBlLmluZGV4KSwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucyksIGNvZGVzLmxvYWRbZS50eXBlXSwgLi4ubWVtYXJnKGUudHlwZSldXG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKGUpXG4gIH1cbn1cblxudHlwZSBMYWJlbEZyYW1lID0geyBjb250cm9sPzogbnVtYmVyLCBraW5kPzogXCJicmVha1wiIHwgXCJjb250aW51ZVwiIH1cbmNvbnN0IGRlcHRoID0gKHN0YWNrOiBMYWJlbEZyYW1lW10sIGNvbnRyb2w6IG51bWJlciwga2luZDogTm9uTnVsbGFibGU8TGFiZWxGcmFtZVtcImtpbmRcIl0+KSA9PiB7XG4gIGNvbnN0IGkgPSBzdGFjay5maW5kSW5kZXgoeCA9PiB4LmNvbnRyb2wgPT09IGNvbnRyb2wgJiYgeC5raW5kID09PSBraW5kKVxuICBpZiAoaSA8IDApIHRocm93IG5ldyBFcnJvcihgVW5rbm93biAke2tpbmR9IHRhcmdldCAke2NvbnRyb2x9YClcbiAgcmV0dXJuIGlcbn1cblxuY29uc3QgY29tcGlsZVN0bXQgPSAoXG4gIHM6IFN0bXQsXG4gIGZpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPixcbiAgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LFxuICBhcnJheXM6IFJlY29yZDxudW1iZXIsIEFycmF5TGF5b3V0PixcbiAgb3B0aW9uczogQ29tcGlsZU9wdGlvbnMsXG4gIHN0YWNrOiBMYWJlbEZyYW1lW10gPSBbXSxcbik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMudmFsdWUsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCAweDIxLCAuLi51MzIobGl4W3MubG9jYWxdISldXG4gICAgY2FzZSBcImFycmF5LnN0b3JlXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5c1tzLmFycmF5XVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBzLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5ydW50aW1lQm91bmRzR3VhcmQocy5pbmRleCwgbGF5b3V0Lmxlbmd0aCwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucyksIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLmluZGV4KSwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucyksIC4uLmNvbXBpbGVFeHByKHMudmFsdWUsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCBjb2Rlcy5zdG9yZVtzLnR5cGVdLCAuLi5tZW1hcmcocy50eXBlKV1cbiAgICB9XG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzW3MuYXJyYXldXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tNb3ZlQm91bmRzKGxheW91dCwgcy50YXJnZXQsIHMuc291cmNlLCBzLmNvdW50KVxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgLi4ucnVudGltZU1vdmVCb3VuZHNHdWFyZChsYXlvdXQsIHMudGFyZ2V0LCBzLnNvdXJjZSwgcy5jb3VudCwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucyksXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLnRhcmdldCksIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLFxuICAgICAgICAuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5zb3VyY2UpLCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zKSxcbiAgICAgICAgLi4uY29tcGlsZUV4cHIocy5jb3VudC5tdWwoY29kZXMuYnl0ZXNbbGF5b3V0LnR5cGVdKSwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucyksXG4gICAgICAgIDB4ZmMsIDB4MGEsIDB4MDAsIDB4MDAsXG4gICAgICBdXG4gICAgfVxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmNvbmQsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCAweDA0LCAweDQwLCAuLi5mbGF0TWFwKHMudGhlbiwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zLCBbe30sIC4uLnN0YWNrXSkpLCAuLi4ocy5lbHNlLmxlbmd0aCA/IFsweDA1LCAuLi5mbGF0TWFwKHMuZWxzZSwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zLCBbe30sIC4uLnN0YWNrXSkpXSA6IFtdKSwgMHgwYl1cbiAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgLi4uZmxhdE1hcChzLmJvZHksIHggPT4gY29tcGlsZVN0bXQoeCwgZml4LCBsaXgsIGFycmF5cywgb3B0aW9ucywgW3sgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGJdXG4gICAgY2FzZSBcImxvb3BcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgMHgwMywgMHg0MCwgLi4uY29tcGlsZUV4cHIocy5jb25kLCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zKSwgMHg0NSwgMHgwZCwgLi4udTMyKDEpLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zLCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiY29udGludWVcIiB9LCB7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJicmVha1wiIH0sIC4uLnN0YWNrXSkpLCAweDBjLCAuLi51MzIoMCksIDB4MGIsIDB4MGJdXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiYnJlYWtUbygpIHVzZWQgb3V0c2lkZSBhIGJsb2NrIG9yIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJicmVha1wiKSldXG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJjb250aW51ZVwiKSldXG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlLCBmaXgsIGxpeCwgYXJyYXlzLCBvcHRpb25zKSwgMHgwZl1cbiAgICBjYXNlIFwiZXhwclwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmV4cHIsIGZpeCwgbGl4LCBhcnJheXMsIG9wdGlvbnMpLCAweDFhXVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKHMpXG4gIH1cbn1cblxuY29uc3QgYXJyYXlMYXlvdXRzID0gKGRlZnM6IFJlY29yZDxzdHJpbmcsIEFueUFycmF5PikgPT4ge1xuICBsZXQgb2Zmc2V0ID0gMFxuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZGVmcykgYXMgW3N0cmluZywgQW55QXJyYXldW11cbiAgY29uc3Qgb3V0OiBSZWNvcmQ8bnVtYmVyLCBBcnJheUxheW91dD4gPSB7fVxuICBmb3IgKGNvbnN0IFssIGFycl0gb2YgZW50cmllcykge1xuICAgIG91dFthcnIuaWRdID0geyB0eXBlOiBhcnIudHlwZSwgbGVuZ3RoOiBhcnIubGVuZ3RoLCBvZmZzZXQgfVxuICAgIG9mZnNldCArPSBhcnIubGVuZ3RoICogY29kZXMuYnl0ZXNbYXJyLnR5cGVdXG4gIH1cbiAgcmV0dXJuIHsgbGF5b3V0czogb3V0LCBieXRlczogb2Zmc2V0LCBlbnRyaWVzIH1cbn1cblxuY29uc3QgbW9kdWxlRnVuY3MgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PlxuICBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMobW9kKS5maWx0ZXIoKFssIHZdKSA9PiB2LmtpbmQgPT09IFwiZnVuY1wiKSkgYXMgRnVuY0RlZnM8VD5cblxuY29uc3QgbW9kdWxlQXJyYXlzID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KG1vZDogVCkgPT5cbiAgT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKG1vZCkuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImFycmF5XCIpKSBhcyBBcnJheURlZnM8VD5cblxudHlwZSBCdWlsdEZ1bmMgPSB7XG4gIGZ1bmM6IEFueUZ1bmNcbiAgcGFyYW1JZHM6IG51bWJlcltdXG4gIGJ1aWx0OiBGdW5jQm9keTxOdW1UeXBlPlxufVxuXG5jb25zdCBidWlsZEZ1bmMgPSAoZnVuYzogQW55RnVuYyk6IEJ1aWx0RnVuYyA9PiB7XG4gIGNvbnN0IHBhcmFtcyA9IGZ1bmMucGFyYW1zLm1hcCh0eXBlID0+IGxvY2FsRXhwcih0eXBlLCBuZXh0TG9jYWxJZCsrKSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gIHJldHVybiB7XG4gICAgZnVuYyxcbiAgICBwYXJhbUlkczogcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSksXG4gICAgYnVpbHQ6IGZ1bmMuYnVpbGQ/LiguLi5wYXJhbXMpID8/IGRpZShgRnVuY3Rpb24gJHtmdW5jLmlkfSBoYXMgbm8gaW1wbGVtZW50YXRpb25gKSxcbiAgfVxufVxuXG5jb25zdCBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMgPSAocm9vdHM6IEFueUZ1bmNbXSkgPT4ge1xuICBjb25zdCBidWlsdCA9IG5ldyBNYXA8bnVtYmVyLCBCdWlsdEZ1bmM+KClcbiAgY29uc3QgdmlzaXQgPSAoZnVuYzogQW55RnVuYykgPT4ge1xuICAgIGlmIChidWlsdC5oYXMoZnVuYy5pZCkpIHJldHVyblxuICAgIGNvbnN0IGVudHJ5ID0gYnVpbGRGdW5jKGZ1bmMpXG4gICAgYnVpbHQuc2V0KGZ1bmMuaWQsIGVudHJ5KVxuICAgIGNvbnN0IGZpbmQgPSAoaWQ6IG51bWJlcikgPT4ge1xuICAgICAgY29uc3QgcmVmZXJlbmNlZCA9IGZ1bmN0aW9uUmVnaXN0cnkuZ2V0KGlkKVxuICAgICAgaWYgKCFyZWZlcmVuY2VkKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gZnVuY3Rpb24gJHtpZH1gKVxuICAgICAgdmlzaXQocmVmZXJlbmNlZClcbiAgICB9XG4gICAgY29uc3Qgc3RtdHMgPSBhc1N0bXRzKGVudHJ5LmJ1aWx0KVxuICAgIHN0bXRzID8gc3RtdHMuZm9yRWFjaChzdG10ID0+IHdhbGtTdG10KHN0bXQsIHsgZnVuYzogZmluZCB9KSkgOiB3YWxrRXhwcihlbnRyeS5idWlsdCBhcyBFeHByPE51bVR5cGU+LCB7IGZ1bmM6IGZpbmQgfSlcbiAgfVxuICByb290cy5mb3JFYWNoKHZpc2l0KVxuICByZXR1cm4gWy4uLmJ1aWx0LnZhbHVlcygpXVxufVxuXG5jb25zdCBkaXNjb3ZlcmVkQXJyYXlzID0gKGJ1aWx0RnVuY3M6IEJ1aWx0RnVuY1tdKSA9PiB7XG4gIGNvbnN0IHVzZWQgPSBuZXcgU2V0PG51bWJlcj4oKVxuICBmb3IgKGNvbnN0IHsgYnVpbHQgfSBvZiBidWlsdEZ1bmNzKSB7XG4gICAgY29uc3QgYm9keSA9IGFzU3RtdHMoYnVpbHQpXG4gICAgYm9keSA/IGJvZHkuZm9yRWFjaChzID0+IHdhbGtTdG10KHMsIHsgYXJyYXk6IGlkID0+IHVzZWQuYWRkKGlkKSB9KSkgOiB3YWxrRXhwcihidWlsdCBhcyBFeHByPE51bVR5cGU+LCB7IGFycmF5OiBpZCA9PiB1c2VkLmFkZChpZCkgfSlcbiAgfVxuICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKFsuLi51c2VkXS5tYXAoaWQgPT4ge1xuICAgIGNvbnN0IGFyciA9IGFycmF5UmVnaXN0cnkuZ2V0KGlkKVxuICAgIGlmICghYXJyKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtpZH1gKVxuICAgIHJldHVybiBbU3RyaW5nKGlkKSwgYXJyXVxuICB9KSkgYXMgUmVjb3JkPHN0cmluZywgQW55QXJyYXk+XG59XG5cbmNvbnN0IGFuYWx5emVNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PiB7XG4gIGNvbnN0IGZ1bmNzID0gbW9kdWxlRnVuY3MobW9kKVxuICBjb25zdCBhcnJheXMgPSBtb2R1bGVBcnJheXMobW9kKVxuICBjb25zdCBmRW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGZ1bmNzKSBhcyBba2V5b2YgRnVuY0RlZnM8VD4gJiBzdHJpbmcsIEZ1bmNEZWZzPFQ+W2tleW9mIEZ1bmNEZWZzPFQ+XV1bXVxuICBjb25zdCBidWlsdEZ1bmNzID0gYnVpbGRSZWZlcmVuY2VkRnVuY3Rpb25zKGZFbnRyaWVzLm1hcCgoWywgZnVuY10pID0+IGZ1bmMpKVxuICBjb25zdCBmaXggPSBPYmplY3QuZnJvbUVudHJpZXMoYnVpbHRGdW5jcy5tYXAoKHsgZnVuYyB9LCBpKSA9PiBbZnVuYy5pZCwgaV0pKSBhcyBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+XG4gIGNvbnN0IHRvdWNoZWRBcnJheXMgPSBkaXNjb3ZlcmVkQXJyYXlzKGJ1aWx0RnVuY3MpXG4gIGNvbnN0IGFsbEFycmF5cyA9IHsgLi4udG91Y2hlZEFycmF5cywgLi4uYXJyYXlzIH0gYXMgUmVjb3JkPHN0cmluZywgQW55QXJyYXk+XG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIHJldHVybiB7IGZ1bmNzLCBhcnJheXMsIGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIHBhZ2VzOiBNYXRoLm1heCgxLCBNYXRoLmNlaWwoYnl0ZXMgLyA2NTUzNikpIH0gYXMgTW9kdWxlQW5hbHlzaXM8VD5cbn1cblxuY29uc3QgZW1pdE1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPih7IGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIHBhZ2VzIH06IE1vZHVsZUFuYWx5c2lzPFQ+LCBvcHRpb25zOiBDb21waWxlT3B0aW9ucyA9IHt9KSA9PiB7XG4gIGNvbnN0IGZ1bmN0aW9uU2VjdGlvbiA9IGJ1aWx0RnVuY3MuZmxhdE1hcCgoXywgaSkgPT4gdTMyKGkpKVxuICBjb25zdCBleHBvcnRTZWN0aW9uID0gZkVudHJpZXMuZmxhdE1hcCgoW25hbWUsIGZ1bmNdKSA9PiBbLi4uc3RyKG5hbWUpLCAweDAwLCAuLi51MzIoZml4W2Z1bmMuaWRdISldKVxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW1xuICAgIC4uLm1hZ2ljLFxuICAgIC4uLnNlY3Rpb24oMHgwMSwgWy4uLnUzMihidWlsdEZ1bmNzLmxlbmd0aCksIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYyB9KSA9PiBbMHg2MCwgLi4udTMyKGZ1bmMucGFyYW1zLmxlbmd0aCksIC4uLmZ1bmMucGFyYW1zLm1hcCh0ID0+IGNvZGVzLnR5cGVbdF0pLCAweDAxLCBjb2Rlcy50eXBlW2Z1bmMucmVzdWx0XV0pXSksXG4gICAgLi4uc2VjdGlvbigweDAyLCBbXG4gICAgICAweDAxLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwibWVtb3J5XCIpLFxuICAgICAgMHgwMixcbiAgICAgIDB4MDMsXG4gICAgICAuLi51MzIocGFnZXMpLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICBdKSxcbiAgICAuLi5zZWN0aW9uKDB4MDMsIFsuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGgpLCAuLi5mdW5jdGlvblNlY3Rpb25dKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZXhwb3J0U2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgcGFyYW1JZHMsIGJ1aWx0IH0pID0+IHtcbiAgICAgICAgY29uc3QgbG9jYWxzID0gbmV3IE1hcDxudW1iZXIsIE51bVR5cGU+KClcbiAgICAgICAgY29uc3Qgc3RtdHMgPSBhc1N0bXRzKGJ1aWx0KVxuICAgICAgICBzdG10cyA/IHN0bXRzLmZvckVhY2gocyA9PiB3YWxrU3RtdChzLCB7IGxvY2FsOiAoaWQsIHR5cGUpID0+IGxvY2Fscy5zZXQoaWQsIHR5cGUpIH0pKSA6IHdhbGtFeHByKGJ1aWx0IGFzIEV4cHI8TnVtVHlwZT4sIHsgbG9jYWw6IChpZCwgdHlwZSkgPT4gbG9jYWxzLnNldChpZCwgdHlwZSkgfSlcbiAgICAgICAgcGFyYW1JZHMuZm9yRWFjaChpZCA9PiBsb2NhbHMuZGVsZXRlKGlkKSlcbiAgICAgICAgY29uc3QgbG9jYWxFbnRyaWVzID0gWy4uLmxvY2Fscy5lbnRyaWVzKCldXG4gICAgICAgIGNvbnN0IGxpeCA9IE9iamVjdC5mcm9tRW50cmllcyhbLi4ucGFyYW1JZHMubWFwKChpZCwgaSkgPT4gW2lkLCBpXSksIC4uLmxvY2FsRW50cmllcy5tYXAoKFtpZF0sIGkpID0+IFtpZCwgZnVuYy5wYXJhbXMubGVuZ3RoICsgaV0pXSkgYXMgUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICAgICAgICBjb25zdCBkZWNscyA9IFsuLi51MzIobG9jYWxFbnRyaWVzLmxlbmd0aCksIC4uLmZsYXRNYXAobG9jYWxFbnRyaWVzLCAoWywgdHlwZV0pID0+IFsuLi51MzIoMSksIGNvZGVzLnR5cGVbdHlwZV1dKV1cbiAgICAgICAgY29uc3QgY29kZSA9IHN0bXRzID8gWy4uLmZsYXRNYXAoc3RtdHMsIHMgPT4gY29tcGlsZVN0bXQocywgZml4LCBsaXgsIGxheW91dHMsIG9wdGlvbnMpKSwgLi4uY29kZXMuemVyb1tmdW5jLnJlc3VsdF1dIDogY29tcGlsZUV4cHIoYnVpbHQgYXMgRXhwcjxOdW1UeXBlPiwgZml4LCBsaXgsIGxheW91dHMsIG9wdGlvbnMpXG4gICAgICAgIGNvbnN0IGJvZHkgPSBbLi4uZGVjbHMsIC4uLmNvZGUsIDB4MGJdXG4gICAgICAgIHJldHVybiBbLi4udTMyKGJvZHkubGVuZ3RoKSwgLi4uYm9keV1cbiAgICAgIH0pLFxuICAgIF0pLFxuICBdKVxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZU1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQsIG9wdGlvbnM6IENvbXBpbGVPcHRpb25zID0ge30pID0+IGVtaXRNb2R1bGUoYW5hbHl6ZU1vZHVsZShtb2QpLCBvcHRpb25zKVxuXG5jb25zdCB0eXBlZEFycmF5Q3RvciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IHsgbmV3KGJ1ZmZlcjogQXJyYXlCdWZmZXJMaWtlLCBieXRlT2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKTogVHlwZWRBcnJheUZvcjxUPiB9ID0+IHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBcInU4XCI6IHJldHVybiBVaW50OEFycmF5IGFzIGFueVxuICAgIGNhc2UgXCJ1MTZcIjogcmV0dXJuIFVpbnQxNkFycmF5IGFzIGFueVxuICAgIGNhc2UgXCJpMzJcIjogcmV0dXJuIEludDMyQXJyYXkgYXMgYW55XG4gICAgY2FzZSBcImk2NFwiOiByZXR1cm4gQmlnSW50NjRBcnJheSBhcyBhbnlcbiAgICBjYXNlIFwiZjMyXCI6IHJldHVybiBGbG9hdDMyQXJyYXkgYXMgYW55XG4gICAgY2FzZSBcImY2NFwiOiByZXR1cm4gRmxvYXQ2NEFycmF5IGFzIGFueVxuICAgIGRlZmF1bHQ6IHJldHVybiBkaWUodHlwZSlcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQsIG9wdGlvbnM6IENvbXBpbGVPcHRpb25zID0ge30pOiBQcm9taXNlPENvbXBpbGVSZXN1bHQ8VD4+ID0+IHtcbiAgY29uc3QgYW5hbHlzaXMgPSBhbmFseXplTW9kdWxlKG1vZClcbiAgY29uc3QgeyBmdW5jcywgYXJyYXlzLCBsYXlvdXRzIH0gPSBhbmFseXNpc1xuICBjb25zdCBtZW1vcnkgPSBuZXcgV2ViQXNzZW1ibHkuTWVtb3J5KHsgaW5pdGlhbDogYW5hbHlzaXMucGFnZXMsIG1heGltdW06IGFuYWx5c2lzLnBhZ2VzLCBzaGFyZWQ6dHJ1ZSB9KVxuICBsZXQgY29tcGlsZWQgPSBhd2FpdCBXZWJBc3NlbWJseS5jb21waWxlKGVtaXRNb2R1bGUoYW5hbHlzaXMsIG9wdGlvbnMpLmJ1ZmZlcilcbiAgY29uc3Qgd2FzbSA9IGF3YWl0IFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlKGNvbXBpbGVkLCB7IGVudjogeyBtZW1vcnkgfSB9KVxuICBjb25zdCBleHBvcnRzID0gd2FzbS5leHBvcnRzIGFzIFdlYkFzc2VtYmx5LkV4cG9ydHNcbiAgY29uc3QganNGdW5jcyA9IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3Qua2V5cyhmdW5jcykubWFwKG5hbWUgPT4gW25hbWUsIGV4cG9ydHNbbmFtZV1dKSlcbiAgY29uc3QganNBcnJheXMgPSAoT2JqZWN0LmVudHJpZXMoYXJyYXlzKSBhcyBbc3RyaW5nLCBBbnlBcnJheV1bXSkubWFwKChbbmFtZSwgYXJyXSkgPT4ge1xuICAgIGNvbnN0IGxheW91dCA9IGxheW91dHNbYXJyLmlkXSFcbiAgICBjb25zdCBDdG9yID0gdHlwZWRBcnJheUN0b3IoYXJyLnR5cGUpXG4gICAgcmV0dXJuIFtuYW1lLCBuZXcgQ3RvcihtZW1vcnkuYnVmZmVyLCBsYXlvdXQub2Zmc2V0LCBhcnIubGVuZ3RoKV0gYXMgY29uc3RcbiAgfSlcbiAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhbXG4gICAgLi4uT2JqZWN0LmVudHJpZXMoanNGdW5jcyksXG4gICAgLi4uanNBcnJheXMsXG4gICAgW1wibW9kXCIsIGNvbXBpbGVkXSxcbiAgICBbXCJtZW1vcnlcIiwgbWVtb3J5XSxcbiAgXSkgYXMgQ29tcGlsZVJlc3VsdDxUPlxufVxuIiwKICAgICJpbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgYXJyYXksIGJyZWFrVG8sIGNvbXBpbGUsIGZ1bmMsIGxvY2FsLCBsb29wLCByZXQsIHNobCwgc2hyLCB0b0YzMiwgdW1vZCwgeG9yLCB0eXBlIEV4cHIsIHR5cGUgTG9jYWxWYXIsIHR5cGUgU3RtdEJvZHkgfSBmcm9tIFwiLi4vd2FzbVwiO1xuaW1wb3J0IHsgZGl2LCBoMiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5cblxubGV0IHdhc21Nb2R1bGUgPSBudWxsIGFzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbWtXYXNtPj4gfCBudWxsO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0VXBXYXNtKHBsYW5uZXI6IE1vZHVsZSkge1xuICB3YXNtTW9kdWxlID0gYXdhaXQgbWtXYXNtKHBsYW5uZXIpXG59XG5cbmZ1bmN0aW9uIGZvckxvb3AobjogbnVtYmVyfCBFeHByPFwiaTMyXCI+LCBib2R5OiAoaTogRXhwcjxcImkzMlwiPikgPT4gU3RtdEJvZHkpe1xuICBsZXQgaSA9IGxvY2FsLmkzMigpXG4gIHJldHVybiBsb29wKGkubHQobiksIFtcbiAgICBib2R5KGkpLFxuICAgIGkuaWFkZCgxKSxcbiAgXSlcbn1cblxuY29uc3QgTldPUktFUlMgPSA0XG5cbmFzeW5jIGZ1bmN0aW9uIG1rV2FzbShwbGFubmVyOiBNb2R1bGUpe1xuXG4gIGNvbnN0IFJBTkRTVFJJREUgPSAxNlxuICBjb25zdCByYW5kU3RhdGUgPSBhcnJheShcImkzMlwiLCBOV09SS0VSUypSQU5EU1RSSURFKVxuXG4gIGxldCByYW5kTmV4dCA9IGZ1bmMoW1wiaTMyXCJdLCBcImkzMlwiLCAoZ2lkKT0+e1xuICAgIGxldCBhID0gbG9jYWwuaTMyKClcbiAgICByZXR1cm4gW1xuICAgICAgYS5zZXQocmFuZFN0YXRlLmxvYWQoZ2lkLm11bChSQU5EU1RSSURFKSkpLFxuICAgICAgYS5zZXQoeG9yKGEsIHNobChhLCAxMykpKSxcbiAgICAgIGEuc2V0KHhvcihhLCBzaHIoYSwgMTcpKSksXG4gICAgICBhLnNldCh4b3IoYSwgc2hsKGEsIDUpKSksXG4gICAgICByYW5kU3RhdGUuc3RvcmUoZ2lkLm11bChSQU5EU1RSSURFKSwgYSksXG4gICAgICByZXQoYSlcbiAgICBdXG4gIH0pXG5cbiAgbGV0IHJhbmRpbnQgPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiXSwgXCJpMzJcIiwgKGdpZCwgbWF4KT0+IHVtb2QocmFuZE5leHQuY2FsbChnaWQpLCBtYXgpKVxuXG4gIGNvbnN0IGRpc3RzID0gYXJyYXkoXCJpMzJcIiwgcGxhbm5lci5SU0laRSlcblxuICBjb25zdCByZXFwaWNrID0gYXJyYXkoXCJ1MTZcIiwgcGxhbm5lci5OUkVRUylcbiAgY29uc3QgcmVxZHJvcCA9IGFycmF5KFwidTE2XCIsIHBsYW5uZXIuTlJFUVMpXG4gIGNvbnN0IHJlcXZhbHVlID0gYXJyYXkoXCJ1MTZcIiwgcGxhbm5lci5OUkVRUylcbiAgY29uc3QgcmVxZGVhZGxpbmUgPSBhcnJheShcInUxNlwiLCBwbGFubmVyLk5SRVFTKVxuXG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihwbGFubmVyLk5SRVFTIC8gcGxhbm5lci5OVFJBTlMgKiAyLjUgKiAyICsgMTApXG5cblxuICBjb25zdCBzY2hlZHVsZUl0ZW0gPSBcInUxNlwiIGFzIGNvbnN0XG5cbiAgY29uc3Qgc2NoZWR1bGUgPSBhcnJheShzY2hlZHVsZUl0ZW0sIFRTSVpFICogcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHNjaGVkc2NvcmUgPSBhcnJheShcInUxNlwiLCBUU0laRSlcbiAgY29uc3Qgc2NoZWRTaXplID0gYXJyYXkoXCJ1MTZcIiwgVFNJWkUpXG4gIGNvbnN0IHVuYXNzaWduZWQgPSBhcnJheShzY2hlZHVsZUl0ZW0sIHBsYW5uZXIuTlJFUVMpXG5cbiAgY29uc3QgaXNMb2FkID0gKGk6IEV4cHI8XCJpMzJcIj4pID0+IGkuYW5kKDEpXG4gIGNvbnN0IGdldERlY2sgPSAoaTogRXhwcjxcImkzMlwiPikgPT4gaS5zaHIoMSkuYW5kKDEpXG4gIGNvbnN0IGdldFJlcSA9IChpOiBFeHByPFwiaTMyXCI+KSA9PiBpLnNocigyKVxuXG5cbiAgY29uc3Qgc2NvcmUgPSBmdW5jKFtcImkzMlwiXSwgXCJ1MTZcIiwgKHRpZCk9PntcblxuICAgIHJldHVybiBmb3JMb29wKHNjaGVkU2l6ZS5sb2FkKHRpZCksIGk9PltcbiAgICAgIGJyZWFrVG8oKVxuICAgIF0pXG5cbiAgfSlcblxuXG4gIGxldCBtb2QgPSBhd2FpdCBjb21waWxlKHtcbiAgICBkaXN0cyxcbiAgICByYW5kU3RhdGUsXG5cblxuXG4gIH0sIHsgcnVudGltZUJvdW5kc0NoZWNrczogdHJ1ZSB9KVxuICBtb2QuZGlzdHMuc2V0KHBsYW5uZXIucm9hZG1hcC5Db3N0TWF0cml4KVxuICBtb2QucmFuZFN0YXRlLnNldChBcnJheS5mcm9tKHtsZW5ndGg6IE5XT1JLRVJTKjJ9LCAoXyxpKT0+aSsxKSlcblxuICByZXR1cm4gbW9kXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHdhc21WaWV3KHBsYW5uZXI6IE1vZHVsZSkge1xuXG4gIGlmICh3YXNtTW9kdWxlID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJ3YXNtIG1vZHVsZSBub3Qgc2V0IHVwIHlldC4gY2FsbCBzZXRVcFdhc20gZmlyc3RcIilcbiAgXG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe3BhZGRpbmc6IFwiMWVtXCJ9KSxcbiAgICBoMihcIndhc20gdmlld1wiKSxcblxuICApXG59XG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcm9hZG1hcFwiO1xuaW1wb3J0IHsgcmFuZG9tTW9kdWxlLCByYW5kb21VVUlELCBSZXF1ZXN0LCBTY2hlZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgbWtTdG9yZWQsIG1rV3JpdGFibGUsIHR5cGUgV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kb20sIHNldFJhbmRTZWVkIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHsgbnVtYmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgcGxhbm5lclZpZXcgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nXCI7XG5pbXBvcnQgeyBzZXRVcFdhc20sIHdhc21WaWV3IH0gZnJvbSBcIi4vd2FzbXZpZXdcIjtcblxuXG5leHBvcnQgbGV0IExLV19DT1VOVCA9IG1rU3RvcmVkKFwiTEtXX0NPVU5UXCIsIG51bWJlciwgIDUpXG5sZXQgUkVRVUVTVF9DT1VOVCA9IG1rU3RvcmVkKFwiUkVRVUVTVF9DT1VOVFwiLCAgbnVtYmVyLCAyMClcblxuYm9keS5zdHlsZS5tYXJnaW4gPSBcIjBcIlxuXG5sZXQgaGVhZGVyID0gaDEoXCJyb3V0ZSBwbGFubmVyXCIsIHN0eWxlKHtiYWNrZ3JvdW5kOiBjb2xvci5ibHVlLCBjb2xvcjogY29sb3IuYmFja2dyb3VuZCwgbWFyZ2luOiBcIjBcIiwgcGFkZGluZzogXCIuNmVtXCJ9KSlcblxubGV0IGNvbnRlbnRTcGFjZSA9IGRpdihzdHlsZSh7XG4gIGRpc3BsYXk6XCJmbGV4XCIsXG4gIGZsZXhEaXJlY3Rpb246XCJyb3dcIixcbiAgd2lkdGg6IFwiMTAwJVwiLFxuICBoZWlnaHQ6IFwiY2FsYygxMDAlIC0gMi41ZW0pXCIsXG4gIG1pbldpZHRoOiBcIjBcIixcbn0pKVxuXG5sZXQgcGFnZSA9IGRpdihcbiAgc3R5bGUoe2Rpc3BsYXk6XCJmbGV4XCIsIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIiwgaGVpZ2h0OiBcIjEwMCVcIn0pLFxuICBoZWFkZXIsXG4gIGNvbnRlbnRTcGFjZVxuKVxuXG5ib2R5LnJlcGxhY2VDaGlsZHJlbihwYWdlKVxuXG5zZXRSYW5kU2VlZCgyNClcblxuZXhwb3J0IGxldCBtb2R1bGUgPSByYW5kb21Nb2R1bGUoKVxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIG51bWJlcjogbnVtYmVyLFxuICAgIGxvZ28/IDogc3RyaW5nLFxuICB9W10sXG4gIGNvbG9yPzogc3RyaW5nXG59XG5cbmV4cG9ydCBsZXQgaGlnaHRMaWdodHMgPSBta1dyaXRhYmxlIDxIaWdoTGlnaHRbXT4oIFtdIClcblxuXG5mdW5jdGlvbiBzZXR0ZXIgKHN0b3JlOiBXcml0YWJsZTxudW1iZXI+ICl7XG4gIGxldCBpbnAgPSBpbnB1dCgpXG4gIGlucC50eXBlID0gXCJudW1iZXJcIlxuICBpbnAub25jaGFuZ2UgPSAoKT0+e1xuICAgIGxldCB2YWwgPSBwYXJzZUludChpbnAudmFsdWUpXG4gICAgaWYgKGlzTmFOKHZhbCkpIHJldHVyblxuICAgIHN0b3JlLnNldCh2YWwpXG4gIH1cbiAgc3RvcmUub251cGRhdGUodmFsPT5pbnAudmFsdWUgPSB2YWwudG9TdHJpbmcoKSlcblxuICByZXR1cm4gaW5wXG59XG5cblxuYXdhaXQgc2V0VXBXYXNtKG1vZHVsZSlcblxuZnVuY3Rpb24gbWtXaW5kb3cgKHRhYjogbnVtYmVyID0gMCApIHtcblxuICBsZXQgdGFiRmllbGRzID0gW1xuICAgIFsnbWFwJywgbWFwVmlldyhtb2R1bGUpXSxcbiAgICBbJ3BsYW5uZXInLCBwbGFubmVyVmlldyhtb2R1bGUpXSxcbiAgICBbJ3dhc20nLCB3YXNtVmlldyhtb2R1bGUpXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gIH0pKVxuXG4gIGZ1bmN0aW9uIG9wZW5UYWIodGFiOiB0eXBlb2YgdGFiRmllbGRzW251bWJlcl1bMF0pIHtcbiAgICBjb25zdCB0YWJzID0gcChcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgbWFyZ2luOiBcIjBcIixcbiAgICAgICAgcGFkZGluZzogXCIuNGVtXCIsXG4gICAgICAgIGZsZXg6IFwiMCAwIGF1dG9cIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLm1hcCgoW24sZV0pPT5cbiAgICAgICAgc3BhbiggbixcbiAgICAgICAgICAoKT0+b3BlblRhYihuKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIuM2VtXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIisgKG49PXRhYiA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSksXG4gICAgICAgICAgICBjb2xvcjogKG49PXRhYikgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBkaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGZsZXg6IFwiMSAxIGF1dG9cIixcbiAgICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMuZmluZCgoW24sXSk9Pm49PXRhYikhWzFdXG4gICAgKVxuXG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgdGFicyxcbiAgICAgIGNvbnRlbnRcbiAgICApXG4gIH1cblxuICBvcGVuVGFiKHRhYkZpZWxkc1t0YWJdIVswXSlcblxuICByZXR1cm4gZWxcbn1cblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbihta1dpbmRvdygyICksIG1rV2luZG93KCkpXG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBRU8sSUFBTSxPQUFPLFNBQVM7QUFFN0IsSUFBTSxlQUFlO0FBQUEsRUFD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QSxLQUFLLGdCQUFnQixJQUFJO0FBRXpCLFlBQVksRUFBRTtBQUVQLElBQUksU0FBUyxhQUFhO0FBVTFCLElBQUksY0FBYyxXQUEwQixDQUFDLENBQUU7QUFpQnRELE1BQU0sVUFBVSxNQUFNO0FBRXRCLFNBQVMsUUFBUyxDQUFDLE1BQWMsR0FBSTtBQUFBLEVBRW5DLElBQUksWUFBWTtBQUFBLElBQ2QsQ0FBQyxPQUFPLFFBQVEsTUFBTSxDQUFDO0FBQUEsSUFDdkIsQ0FBQyxXQUFXLFlBQVksTUFBTSxDQUFDO0FBQUEsSUFDL0IsQ0FBQyxRQUFRLFNBQVMsTUFBTSxDQUFDO0FBQUEsRUFDM0I7QUFBQSxFQUVBLE1BQU0sS0FBSyxJQUFJLE1BQU07QUFBQSxJQUNuQixNQUFNO0FBQUEsSUFDTixVQUFVO0FBQUEsSUFDVixRQUFRO0FBQUEsSUFDUixRQUFRLGVBQWEsTUFBTTtBQUFBLElBQzNCLFVBQVU7QUFBQSxJQUNWLFNBQVM7QUFBQSxJQUNULGVBQWU7QUFBQSxFQUNqQixDQUFDLENBQUM7QUFBQSxFQUVGLFNBQVMsT0FBTyxDQUFDLE1BQWtDO0FBQUEsSUFDakQsTUFBTSxPQUFPLEVBQ1gsTUFBTTtBQUFBLE1BQ0osUUFBUTtBQUFBLE1BQ1IsU0FBUztBQUFBLE1BQ1QsTUFBTTtBQUFBLElBQ1IsQ0FBQyxHQUNELFVBQVUsSUFBSSxFQUFFLEdBQUUsT0FDaEIsS0FBTSxHQUNKLE1BQUksUUFBUSxDQUFDLEdBQ2IsTUFBTTtBQUFBLE1BQ0osU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLE1BQ1IsUUFBUSxnQkFBZSxLQUFHLE9BQU0sTUFBTSxRQUFRLE1BQU07QUFBQSxNQUNwRCxPQUFRLEtBQUcsT0FBTyxNQUFNLFFBQVEsTUFBTTtBQUFBLElBQ3hDLENBQUMsQ0FDSCxDQUNGLENBQ0Y7QUFBQSxJQUVBLE1BQU0sVUFBVSxJQUNkLE1BQU07QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFdBQVc7QUFBQSxNQUNYLFVBQVU7QUFBQSxJQUNaLENBQUMsR0FDRCxVQUFVLEtBQUssRUFBRSxPQUFNLEtBQUcsSUFBRyxFQUFHLEVBQ2xDO0FBQUEsSUFFQSxHQUFHLGdCQUNELE1BQ0EsT0FDRjtBQUFBO0FBQUEsRUFHRixRQUFRLFVBQVUsS0FBTSxFQUFFO0FBQUEsRUFFMUIsT0FBTztBQUFBO0FBR1QsYUFBYSxnQkFBZ0IsU0FBUyxDQUFFLEdBQUcsU0FBUyxDQUFDOyIsCiAgImRlYnVnSWQiOiAiREQwREU3NjA5NTEwMzZFMzY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
