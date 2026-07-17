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
function improvedAnnealingCore(mod, options) {
  const targetSteps = options.steps !== undefined ? options.steps : Math.max(150000, Math.floor(options.budgetMs * 190));
  const session = createImprovedAnnealingSession(mod, targetSteps);
  if (options.steps !== undefined)
    return session.iterateSteps(options.steps);
  return session.iterateForMs(options.budgetMs);
}
function improvedAnnealing(mod, steps = 150000) {
  return improvedAnnealingCore(mod, { steps });
}

// src/wasm/ast.ts
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
var nextControlId = 0;
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
  const struct2 = typeof type === "object" ? type : null;
  const storage = struct2 ? struct2.storage : type;
  const elementSize = struct2 ? struct2.size : storageSize[storage];
  let handle;
  handle = {
    kind: "array",
    type,
    length,
    elementSize,
    at: (index) => {
      const value = memoryValue(handle, index, storage, elementSize);
      return struct2 ? structValue(struct2, value) : value;
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
var loop = (cond, body2) => {
  const self = { kind: "loop", id: nextControlId++ };
  return { kind: "loop", control: self.id, cond, body: controlBody(self, body2) };
};
// src/wasm/analyze.ts
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
// src/wasm/codegen.ts
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

// src/wasm/index.ts
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
var DEBUG = true;
function debug(tag, value) {
  if (!DEBUG)
    return [];
  return [log(tag, value)];
}
function checkedArray(type, length) {
  const arr = array2(type, length);
  if (!DEBUG)
    return arr;
  const { at, move } = arr;
  const checkIdx = func(["i32", "i32"], "i32", (i, n) => ifElse(i.lt(0).or(n.lt(0)).or(n.add(i).gt(arr.length)), trap("array bounds exceeded"), ret(i)));
  arr.at = (index) => at(checkIdx.call(index, 0));
  arr.move = (target, source, count) => move(checkIdx.call(target, count), checkIdx.call(source, count), count);
  return arr;
}
function forN(n, body2) {
  const i = local("i32");
  return loop(i.lt(n), [body2(i), i.set(i.add(1))]);
}
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
  const randState = checkedArray("i32", NWORKERS * RANDSTRIDE);
  const dists = checkedArray("i32", planner.RSIZE);
  const requests = checkedArray(REQ, planner.NREQS);
  const assigned = checkedArray("u8", planner.NREQS);
  const schedule = checkedArray(STOP, planner.NTRANS * TSIZE);
  const sched_size = checkedArray("i16", planner.NTRANS);
  const tran_positions = checkedArray("i16", planner.NTRANS);
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
  const rateTran = func(["i32"], "i32", (tran) => {
    return [];
  });
  const addRequest = func(["i32", "i32", "i32", "i32", "i32"], "void", (reqn, start, end, value, deadline) => requests.at(reqn).set({ start, end, value, deadline }));
  const search = func([], "void", () => [
    debug("debugger on.", 0),
    forN(100, (i) => tryAssign.call())
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
var availableSolvers = {
  baseline: baselineAnnealing,
  improved: improvedAnnealing,
  wasm: annealingWasm
};
var INITIAL_SOLVER = "wasm";
var KM_COST2 = 0.5;
var AVG_SPEED_KMH2 = 60;
var REORG_COST_EUR2 = 100;
async function plannerView(mod2) {
  const outerBorder = "1px solid " + color.gray;
  const innerBorder = "1px solid " + color.lightgray;
  const cellPadding = ".35em .5em";
  const scheduleCellMinHeight = "2.1em";
  let annealer = null;
  let annealingSession = null;
  let annealingTimer = null;
  let runId = 0;
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
  const solverSelect = document.createElement("select");
  for (const name of Object.keys(availableSolvers))
    solverSelect.add(new Option(name, name));
  solverSelect.value = INITIAL_SOLVER;
  const solverLine = p("solver: ", solverSelect);
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
    if (!annealer)
      return;
    scoreLine.textContent = `score: ${annealer?.totalScore ?? 0}`;
    timeLine.textContent = `search time: ${(annealer.elapsedMs / 1000).toFixed(2)} s`;
    unassignedLine.replaceChildren("unassigned: ", ...Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]));
    detailWrap.replaceChildren(div(p("details"), table(style({
      borderCollapse: "collapse"
    }), tr(cell("unassigned requests"), cell(Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]))), tr(cell("search time"), cell(`${annealer?.elapsedMs ?? 0}ms`)), tr(cell("score"), cell(annealer?.totalScore ?? 0)), tr(cell("transporter count"), cell(mod2.NTRANS)), tr(cell("request count"), cell(mod2.NREQS)), tr(cell("cost per km"), cell(`${KM_COST2}€`)), tr(cell("average speed"), cell(`${AVG_SPEED_KMH2}km/h`)), tr(cell("reorganization cost"), cell(`${REORG_COST_EUR2}€`)))));
  }
  function render(forceTable = false) {
    if (!annealer)
      return;
    renderStatus();
    if (forceTable || renderCounter++ % 4 === 0)
      renderTable();
  }
  async function runSolver(name) {
    stopSearch();
    const id = ++runId;
    annealingSession = null;
    annealer = null;
    runButton.disabled = true;
    scoreLine.textContent = "running…";
    tableWrap.replaceChildren();
    try {
      if (name === "improved") {
        annealingSession = createImprovedAnnealingSession(mod2, 1900000);
        annealer = annealingSession.iterateForMs(10);
      } else {
        annealer = await availableSolvers[name](mod2);
      }
      if (id === runId)
        render(true);
    } catch (error) {
      if (id === runId)
        scoreLine.textContent = `solver failed: ${String(error)}`;
    } finally {
      if (id === runId) {
        runButton.disabled = false;
        runButton.textContent = name === "improved" ? "start" : "run";
        heatButton.hidden = name !== "improved";
      }
    }
  }
  runButton.onclick = () => {
    const name = solverSelect.value;
    if (name !== "improved") {
      runSolver(name);
      return;
    }
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
  solverSelect.onchange = () => void runSolver(solverSelect.value);
  controls.replaceChildren(runButton, heatButton);
  await runSolver(INITIAL_SOLVER);
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
var result;
async function setUpWasm(planner) {
  result = await annealingWasm(planner);
}
function wasmView(_planner) {
  if (!result)
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
async function mkWindow(tab = 0) {
  let tabFields = [
    ["map", mapView(module)],
    ["planner", await plannerView(module)],
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
contentSpace.replaceChildren(...await Promise.all([mkWindow(1), mkWindow()]));
export {
  module,
  hightLights,
  LKW_COUNT
};

//# debugId=C9E8DC01C1CD768564756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc20vYXN0LnRzIiwgInNyYy93YXNtL2FuYWx5emUudHMiLCAic3JjL3dhc20vY29kZWdlbi50cyIsICJzcmMvd2FzbS9pbmRleC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvdmlldy93YXNtdmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5jb25zdCBJTkYgPSAxIDw8IDMwO1xuXG5leHBvcnQgdHlwZSBQYWlySW5mbyA9IHtcbiAgcmVxOiBudW1iZXI7XG4gIGZpcnN0OiBudW1iZXI7XG4gIHNlY29uZDogbnVtYmVyO1xuICBkZWNrOiAwIHwgMTtcbn07XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1N0YXRlID0ge1xuICBtb2Q6IE1vZHVsZTtcbiAgTlJFUVM6IG51bWJlcjtcbiAgTlRSQU5TOiBudW1iZXI7XG4gIFRTSVpFOiBudW1iZXI7XG4gIHJlcVBpY2t1cExvY2F0aW9uczogVWludDE2QXJyYXk7XG4gIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVhZGxpbmVzOiBVaW50MzJBcnJheTtcbiAgcmVxVmFsdWVzOiBVaW50MzJBcnJheTtcbiAgdW5hc3NpZ25lZDogSW50OEFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2FkKHg6IG51bWJlcikge1xuICByZXR1cm4geCAmIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNrKHg6IG51bWJlcikge1xuICByZXR1cm4gKCh4ICYgMikgPj4gMSkgYXMgMCB8IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXEoeDogbnVtYmVyKSB7XG4gIHJldHVybiAoeCAmIDB4ZmZmZikgPj4gMjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvcyh4OiBudW1iZXIpIHtcbiAgcmV0dXJuIHggPj4gMTY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QW5uZWFsaW5nU3RhdGUobW9kOiBNb2R1bGUsIHNlZWQ/OiBBbm5lYWxpbmdSZXN1bHQpOiBBbm5lYWxpbmdTdGF0ZSB7XG4gIGNvbnN0IHsgTlJFUVMsIHJlcXVlc3RzLCBzdGFydHBvc2l0aW9ucywgTlRSQU5TIH0gPSBtb2Q7XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihOUkVRUyAqIDIuNSArIDEwKTtcblxuICByZXR1cm4ge1xuICAgIG1vZCxcbiAgICBOUkVRUyxcbiAgICBOVFJBTlMsXG4gICAgVFNJWkUsXG4gICAgcmVxUGlja3VwTG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLnN0YXJ0UG9pbnQpKSxcbiAgICByZXFEZWxpdmVyeUxvY2F0aW9uczogbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5lbmRQb2ludCkpLFxuICAgIHJlcURlYWRsaW5lczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5kZWFkbGluZV9oICogQVZHX1NQRUVEX0tNSCkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci52YWx1ZV9ldXIgLyBLTV9DT1NUKSksXG4gICAgdW5hc3NpZ25lZDogc2VlZCA/IG5ldyBJbnQ4QXJyYXkoc2VlZC51bmFzc2lnbmVkKSA6IG5ldyBJbnQ4QXJyYXkocmVxdWVzdHMubWFwKCgpID0+IDEpKSxcbiAgICB0cmFuU3RhcnQ6IG5ldyBVaW50MTZBcnJheShzdGFydHBvc2l0aW9ucyksXG4gICAgc2NoZWR1bGU6IHNlZWQgPyBuZXcgVWludDMyQXJyYXkoc2VlZC5zY2hlZHVsZSkgOiBuZXcgVWludDMyQXJyYXkoVFNJWkUgKiBOVFJBTlMpLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHNlZWQgPyBuZXcgVWludDE2QXJyYXkoc2VlZC5zY2hlZHVsZVNpemVzKSA6IG5ldyBVaW50MTZBcnJheShOVFJBTlMpLFxuICAgIHNjaGVkdWxlUmF0aW5nczogc2VlZCA/IG5ldyBJbnQzMkFycmF5KHNlZWQuc2NoZWR1bGVSYXRpbmdzKSA6IG5ldyBJbnQzMkFycmF5KE5UUkFOUyksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZU9mZnNldChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICByZXR1cm4gdHJhbiAqIHN0YXRlLlRTSVpFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBpZHg6IG51bWJlciwgaXNMb2FkQml0OiAxIHwgMCwgZGVjazogMCB8IDEsIHJlcTogbnVtYmVyLCBwb3M6IG51bWJlcikge1xuICBzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdID0gKGlzTG9hZEJpdCA8PCAwKSB8IChkZWNrIDw8IDEpIHwgKHJlcSA8PCAyKSB8IChwb3MgPDwgMTYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVSb3V0ZShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICBsZXQgcmV3YXJkID0gMDtcbiAgbGV0IGR1cmF0aW9uID0gMDtcbiAgY29uc3QgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV07XG4gIGxldCBwb3MgPSBzdGF0ZS50cmFuU3RhcnRbdHJhbl0hO1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKTtcbiAgICBjb25zdCBuZXh0UG9zID0gZ2V0UG9zKHN0ZXApO1xuICAgIGR1cmF0aW9uICs9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgZHVyYXRpb24gKz0gKGRlY2subGVuZ3RoIC0gaWR4IC0gMSkgKiBSRU9SR19DT1NUX0VVUiAvIEtNX0NPU1Q7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGR1cmF0aW9uIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gZHVyYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoQWxsUmF0aW5ncyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUpIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heExvc3MgPSAyNDApIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGlmIChzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dICE9PSAwKSBjb250aW51ZTtcblxuICAgIGxldCBiZXN0UmVxID0gLTE7XG4gICAgbGV0IGJlc3RTY29yZSA9IC1JTkY7XG5cbiAgICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICAgIGlmICghc3RhdGUudW5hc3NpZ25lZFtyZXFdKSBjb250aW51ZTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCAwLCAwLCAwLCByZXEpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCAwLCAxKTtcbiAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdFJlcSA9IHJlcTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYmVzdFJlcSA9PT0gLTEgfHwgYmVzdFNjb3JlIDwgLW1heExvc3MpIGNvbnRpbnVlO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIGJlc3RSZXEpO1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IGJlc3RTY29yZTtcbiAgICBzdGF0ZS51bmFzc2lnbmVkW2Jlc3RSZXFdID0gMDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0U3RvcHMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBlbmQgKyAyLCBvZmZzZXQgKyBlbmQsIG9mZnNldCArIHNpemUpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIGVuZCArIDEpO1xuICBzZXRSZXEoc3RhdGUsIHRyYW4sIHN0YXJ0LCAxLCBkZWNrLCByZXEsIHN0YXRlLnJlcVBpY2t1cExvY2F0aW9uc1tyZXFdISk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgZW5kICsgMSwgMCwgZGVjaywgcmVxLCBzdGF0ZS5yZXFEZWxpdmVyeUxvY2F0aW9uc1tyZXFdISk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBlbmQpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCAtIDEsIG9mZnNldCArIGVuZCArIDEsIG9mZnNldCArIHNpemUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhaXJJblJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCByZXE6IG51bWJlcik6IFBhaXJJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBsZXQgZmlyc3QgPSAtMTtcbiAgbGV0IHNlY29uZCA9IC0xO1xuICBsZXQgZGVjazogMCB8IDEgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBpZiAoZ2V0UmVxKHN0ZXApICE9PSByZXEpIGNvbnRpbnVlO1xuICAgIGlmIChmaXJzdCA9PT0gLTEpIHtcbiAgICAgIGZpcnN0ID0gaTtcbiAgICAgIGRlY2sgPSBnZXREZWNrKHN0ZXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWNvbmQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZpcnN0ID09PSAtMSB8fCBzZWNvbmQgPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgcmVxLCBmaXJzdCwgc2Vjb25kLCBkZWNrIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVVbmFzc2lnbmVkUmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IG51bWJlciB8IG51bGwge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1heEF0dGVtcHRzOyBpKyspIHtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIHN0YXRlLk5SRVFTKTtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgZm9yIChsZXQgcmVxID0gMDsgcmVxIDwgc3RhdGUuTlJFUVM7IHJlcSsrKSB7XG4gICAgaWYgKHN0YXRlLnVuYXNzaWduZWRbcmVxXSkgcmV0dXJuIHJlcTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbyB9IHwgbnVsbCB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgbWF4QXR0ZW1wdHM7IGF0dGVtcHQrKykge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIHN0YXRlLk5UUkFOUyk7XG4gICAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGlmIChzaXplIDwgMikgY29udGludWU7XG4gICAgY29uc3QgaWR4ID0gcmFuZEludCgwLCBzaXplKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pICsgaWR4XSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pXSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0QW5uZWFsKHByZXZTY29yZTogbnVtYmVyLCBuZXh0U2NvcmU6IG51bWJlciwgdGVtcDogbnVtYmVyKSB7XG4gIGlmIChuZXh0U2NvcmUgPj0gcHJldlNjb3JlKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgZGVsdGEgPSBwcmV2U2NvcmUgLSBuZXh0U2NvcmU7XG4gIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KHRlbXAsIDAuMDAxKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIGVsYXBzZWRNczogbnVtYmVyKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogc3RhdGUuc2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogc3RhdGUuc2NoZWR1bGVTaXplcyxcbiAgICB0cmFuU3RhcnQ6IHN0YXRlLnRyYW5TdGFydCxcbiAgICBUU0laRTogc3RhdGUuVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MsXG4gICAgdW5hc3NpZ25lZDogc3RhdGUudW5hc3NpZ25lZCxcbiAgICBlbGFwc2VkTXMsXG4gICAgdG90YWxTY29yZTogc3RhdGUuc2NoZWR1bGVSYXRpbmdzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApLFxuICB9O1xufVxuIiwKICAgICJpbXBvcnQgeyByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGdldERlY2ssXG4gIGdldFJlcSxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1Jlc3VsdCA9IHtcbiAgc2NoZWR1bGU6IFVpbnQzMkFycmF5O1xuICBzY2hlZHVsZVNpemVzOiBVaW50MTZBcnJheTtcbiAgdHJhblN0YXJ0OiBVaW50MTZBcnJheTtcbiAgVFNJWkU6IG51bWJlcjtcbiAgc2NoZWR1bGVSYXRpbmdzOiBJbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIGVsYXBzZWRNczogbnVtYmVyO1xuICB0b3RhbFNjb3JlOiBudW1iZXI7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYmFzZWxpbmVBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMV82MDBfMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kKTtcbiAgY29uc3QgeyBOUkVRUywgTlRSQU5TLCBUU0laRSwgc2NoZWR1bGUsIHNjaGVkdWxlU2l6ZXMsIHNjaGVkdWxlUmF0aW5ncywgdW5hc3NpZ25lZCB9ID0gc3RhdGU7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEwMDtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2UmF0aW5nOiBudW1iZXIsIG5leHRSYXRpbmc6IG51bWJlcikge1xuICAgIGlmIChuZXh0UmF0aW5nID49IHByZXZSYXRpbmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0UmF0aW5nIC0gcHJldlJhdGluZykgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2NoZWRTaXplICsgMSk7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKHNjaGVkU2l6ZSwgcmFuZEludCgwLCA0KSArIGEpO1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpO1xuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAwLjUgPyAxIDogMCwgcmVxKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICBjb25zdCBzY2hlZFNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2NoZWRTaXplIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRTaXplKTtcbiAgICBjb25zdCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSE7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKGl0ZW0pO1xuXG4gICAgY29uc3QgYWI6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZFNpemU7IGkrKykge1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09PSByZXEpIGFiLnB1c2goaSk7XG4gICAgfVxuICAgIGlmIChhYi5sZW5ndGggIT09IDIpIHJldHVybjtcblxuICAgIGNvbnN0IFthLCBiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl07XG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIpO1xuICAgIGNvbnN0IG5ld1JhdGluZyA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgIGlmIChhY2NlcHQoc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgbmV3UmF0aW5nKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gbmV3UmF0aW5nO1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgLSAxLCBnZXREZWNrKGl0ZW0pIGFzIDAgfCAxLCByZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG4gICAgdGVtcCA9ICgxIC0gaSAvIHN0ZXBzKSAqIHN0YXJ0VGVtcDtcbiAgICB0cnlVbmFzc2lnbigpO1xuICAgIHRyeUFzc2lnbigpO1xuICB9XG5cbiAgcmV0dXJuIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlLCBEYXRlLm5vdygpIC0gc3RhcnRlZEF0KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZyB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHtcbiAgYWNjZXB0QW5uZWFsLFxuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgdHlwZSBQYWlySW5mbyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNhbXBsZUFzc2lnbmVkUGFpcixcbiAgc2FtcGxlVW5hc3NpZ25lZFJlcSxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBJbXByb3ZlZE9wdGlvbnMgPVxuICB8IHsgc3RlcHM6IG51bWJlcjsgYnVkZ2V0TXM/OiBuZXZlciB9XG4gIHwgeyBidWRnZXRNczogbnVtYmVyOyBzdGVwcz86IG5ldmVyIH07XG5cbmV4cG9ydCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiA9IHtcbiAgaXRlcmF0ZVN0ZXBzOiAoc3RlcHM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBpdGVyYXRlRm9yTXM6IChidWRnZXRNczogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG4gIGdldFJlc3VsdDogKCkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICByZWhlYXQ6IChmYWN0b3I/OiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kOiBNb2R1bGUsIHRhcmdldFN0ZXBzID0gMTUwMDAwKTogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHtcbiAgY29uc3Qgd2FybXVwU3RlcHMgPSBNYXRoLm1pbihNYXRoLm1heCgyMDAwMCwgTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMikpLCA1MDAwMCk7XG4gIGNvbnN0IHdhcm11cCA9IGJhc2VsaW5lQW5uZWFsaW5nKG1vZCwgd2FybXVwU3RlcHMpO1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QsIHdhcm11cCk7XG4gIGNvbnN0IHsgTlRSQU5TLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuICBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZSk7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEyMDtcbiAgbGV0IGVuZFRlbXAgPSAwLjU7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyByZXE6IG51bWJlcjsgYTogbnVtYmVyOyBiOiBudW1iZXI7IGRlY2s6IDAgfCAxOyBzY29yZTogbnVtYmVyIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IHJlcSA9IHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGUpO1xuICAgICAgaWYgKHJlcSA9PSBudWxsKSBicmVhaztcblxuICAgICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBjb25zdCBkZWNrID0gKHJhbmRvbSgpID4gMC41ID8gMSA6IDApIGFzIDAgfCAxO1xuXG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgZGVjaywgcmVxKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHJlcSwgYSwgYiwgZGVjaywgc2NvcmU6IG5ld1Njb3JlIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LmEsIGJlc3QuYiwgYmVzdC5kZWNrLCBiZXN0LnJlcSk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ25TYW1wbGVkKHNhbXBsZXMgPSA2KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7IHRyYW46IG51bWJlcjsgcGFpcjogUGFpckluZm87IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IG5ld1Njb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0geyB0cmFuLCBwYWlyLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucGFpci5yZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlbG9jYXRlU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgc3JjOiBudW1iZXI7XG4gICAgICBkc3Q6IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICAgIG9sZFNjb3JlOiBudW1iZXI7XG4gICAgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcblxuICAgICAgY29uc3QgeyB0cmFuOiBzcmMsIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIGNvbnN0IGRzdCA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IG9sZFNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY2hlZHVsZVJhdGluZ3Nbc3JjXSFcbiAgICAgICAgOiBzY2hlZHVsZVJhdGluZ3Nbc3JjXSEgKyBzY2hlZHVsZVJhdGluZ3NbZHN0XSE7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3QgZHN0U2l6ZSA9IHNjaGVkdWxlU2l6ZXNbZHN0XSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBkc3RTaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oZHN0U2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgZHN0U2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGRzdCwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY29yZVJvdXRlKHN0YXRlLCBzcmMpXG4gICAgICAgIDogc2NvcmVSb3V0ZShzdGF0ZSwgc3JjKSArIHNjb3JlUm91dGUoc3RhdGUsIGRzdCk7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBkc3QsIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBjYW5kaWRhdGVTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICBzcmMsXG4gICAgICAgICAgZHN0LFxuICAgICAgICAgIHBhaXIsXG4gICAgICAgICAgaW5zZXJ0QTogYSxcbiAgICAgICAgICBpbnNlcnRCOiBiLFxuICAgICAgICAgIHNjb3JlOiBjYW5kaWRhdGVTY29yZSxcbiAgICAgICAgICBvbGRTY29yZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKGJlc3Qub2xkU2NvcmUsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBpZiAoYmVzdC5zcmMgPT09IGJlc3QuZHN0KSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5zcmNdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5zcmMpO1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5kc3RdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5kc3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5zcmMsIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlSZWluc2VydFNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHtcbiAgICAgIHRyYW46IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW4sIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG5cbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHRyYW4sXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuXG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2Vzc2lvblN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGxldCBpID0gMDtcbiAgY29uc3QgdGVtcEZsb29yID0gMztcbiAgY29uc3QgcmVoZWF0VGVtcCA9IDQ1O1xuXG4gIGZ1bmN0aW9uIHJ1bkl0ZXJhdGlvbnMoaXRlcmF0aW9uQnVkZ2V0OiBudW1iZXIsIGRlYWRsaW5lID0gSW5maW5pdHkpIHtcbiAgICBjb25zdCBlbmRJdGVyYXRpb24gPSBNYXRoLm1pbih0YXJnZXRTdGVwcywgaSArIGl0ZXJhdGlvbkJ1ZGdldCk7XG4gICAgd2hpbGUgKGkgPCBlbmRJdGVyYXRpb24pIHtcbiAgICAgIGlmICgoaSAmIDIwNDcpID09PSAwICYmIERhdGUubm93KCkgPj0gZGVhZGxpbmUpIGJyZWFrO1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBpIC8gdGFyZ2V0U3RlcHM7XG4gICAgICB0ZW1wID0gc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgcHJvZ3Jlc3MpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBydW5UaW1lZENodW5rKGJ1ZGdldE1zOiBudW1iZXIpIHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBidWRnZXRNcztcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXBGbG9vciwgc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKSk7XG5cbiAgICAgIGNvbnN0IHIgPSByYW5kb20oKTtcbiAgICAgIGlmIChyIDwgMC40KSB0cnlBc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC41NSkgdHJ5VW5hc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC44NSkgdHJ5UmVpbnNlcnRTYW1wbGVkKCk7XG4gICAgICBlbHNlIHRyeVJlbG9jYXRlU2FtcGxlZCgpO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgd2FybXVwLmVsYXBzZWRNcyArIChEYXRlLm5vdygpIC0gc2Vzc2lvblN0YXJ0ZWRBdCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpdGVyYXRlU3RlcHMoc3RlcHMpIHtcbiAgICAgIHJ1bkl0ZXJhdGlvbnMoc3RlcHMpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gICAgaXRlcmF0ZUZvck1zKGJ1ZGdldE1zKSB7XG4gICAgICBydW5UaW1lZENodW5rKGJ1ZGdldE1zKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCxcbiAgICByZWhlYXQoZmFjdG9yID0gMSkge1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXAsIHJlaGVhdFRlbXAgKiBmYWN0b3IpO1xuICAgICAgLy8gUHVsbCB0aGUgc2VhcmNoIHNsaWdodGx5IGJhY2sgZnJvbSB0aGUgY29sZCBlbmQgb2YgdGhlIHNjaGVkdWxlLlxuICAgICAgaSA9IE1hdGgubWF4KDAsIGkgLSBNYXRoLmZsb29yKHRhcmdldFN0ZXBzICogMC4wOCAqIGZhY3RvcikpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2Q6IE1vZHVsZSwgb3B0aW9uczogSW1wcm92ZWRPcHRpb25zKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3QgdGFyZ2V0U3RlcHMgPSBvcHRpb25zLnN0ZXBzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLnN0ZXBzIDogTWF0aC5tYXgoMTUwMDAwLCBNYXRoLmZsb29yKG9wdGlvbnMuYnVkZ2V0TXMgKiAxOTApKTtcbiAgY29uc3Qgc2Vzc2lvbiA9IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbihtb2QsIHRhcmdldFN0ZXBzKTtcbiAgaWYgKG9wdGlvbnMuc3RlcHMgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZVN0ZXBzKG9wdGlvbnMuc3RlcHMpO1xuICByZXR1cm4gc2Vzc2lvbi5pdGVyYXRlRm9yTXMob3B0aW9ucy5idWRnZXRNcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZyhtb2Q6IE1vZHVsZSwgc3RlcHMgPSAxNTAwMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4gaW1wcm92ZWRBbm5lYWxpbmdDb3JlKG1vZCwgeyBzdGVwcyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nVGltZWQobW9kOiBNb2R1bGUsIGJ1ZGdldE1zID0gMTAwMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4gaW1wcm92ZWRBbm5lYWxpbmdDb3JlKG1vZCwgeyBidWRnZXRNcyB9KTtcbn1cbiIsCiAgICAiXG5leHBvcnQgdHlwZSBOdW1UeXBlID0gXCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIlxuZXhwb3J0IHR5cGUgUmVzdWx0VHlwZSA9IE51bVR5cGUgfCBcInZvaWRcIiB8IFN0cnVjdFR5cGU8YW55PlxuZXhwb3J0IHR5cGUgSW50VHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiXG5leHBvcnQgdHlwZSBQYWNrZWRUeXBlID0gXCJpOFwiIHwgXCJ1OFwiIHwgXCJpMTZcIiB8IFwidTE2XCJcbmV4cG9ydCB0eXBlIE1lbW9yeVR5cGUgPSBOdW1UeXBlIHwgUGFja2VkVHlwZVxuZXhwb3J0IHR5cGUgRFR5cGUgPSBNZW1vcnlUeXBlIHwgU3RydWN0VHlwZTxhbnk+XG5leHBvcnQgdHlwZSBMb2FkZWRUeXBlPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPiA9IFQgZXh0ZW5kcyBQYWNrZWRUeXBlID8gXCJpMzJcIiA6IFRcbmV4cG9ydCB0eXBlIEFyaXRobWV0aWNPcCA9IFwiYWRkXCIgfCBcInN1YlwiIHwgXCJtdWxcIiB8IFwiZGl2XCJcbmV4cG9ydCB0eXBlIEJpdE9wID0gXCJ4b3JcIiB8IFwic2hsXCIgfCBcInNoclwiIHwgXCJhbmRcIiB8IFwib3JcIlxuZXhwb3J0IHR5cGUgUmVtYWluZGVyT3AgPSBcIm1vZFwiIHwgXCJ1bW9kXCJcbmV4cG9ydCB0eXBlIEJpbk9wID0gQXJpdGhtZXRpY09wIHwgQml0T3AgfCBSZW1haW5kZXJPcFxuZXhwb3J0IHR5cGUgQ21wT3AgPSBcImVxXCIgfCBcImx0XCIgfCBcImd0XCJcbmNvbnN0IGFyaXRobWV0aWNPcHMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0gYXMgY29uc3RcbmNvbnN0IGJpdE9wcyA9IFtcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwic2hyXCJdIGFzIGNvbnN0XG5jb25zdCByZW1haW5kZXJPcHMgPSBbXCJtb2RcIiwgXCJ1bW9kXCJdIGFzIGNvbnN0XG5jb25zdCBjbXBPcHMgPSBbXCJlcVwiLCBcImx0XCIsIFwiZ3RcIl0gYXMgY29uc3RcbmV4cG9ydCB0eXBlIFZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IFQgZXh0ZW5kcyBcImk2NFwiID8gYmlnaW50IDogbnVtYmVyXG5leHBvcnQgdHlwZSBUeXBlZEFycmF5Rm9yPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPiA9XG4gIFQgZXh0ZW5kcyBcImk4XCIgPyBJbnQ4QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJ1MTZcIiA/IFVpbnQxNkFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTE2XCIgPyBJbnQxNkFycmF5IDpcbiAgVCBleHRlbmRzIFwidThcIiA/IFVpbnQ4QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpMzJcIiA/IEludDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpNjRcIiA/IEJpZ0ludDY0QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmMzJcIiA/IEZsb2F0MzJBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImY2NFwiID8gRmxvYXQ2NEFycmF5IDogbmV2ZXJcblxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPjogbmV2ZXIgfVxudHlwZSBBcmdzTGlrZTxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwckxpa2U8QXJnc1tLXT46IG5ldmVyIH1cbmV4cG9ydCB0eXBlIEFyZ3NWYWw8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBWYWx1ZTxBcmdzW0tdPiA6IG5ldmVyIH1cblxudHlwZSBMb2NhbE5vZGU8VCBleHRlbmRzIE51bVR5cGU+ID0geyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlOiBULCBsb2NhbDogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIENvcmVFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9XG4gIHwgeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFQsIHZhbHVlOiBWYWx1ZTxUPiB9XG4gIHwgTG9jYWxOb2RlPFQ+XG4gIHwgeyBraW5kOiBcImJpblwiLCB0eXBlOiBULCBvcDogQmluT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwiY2FsbFwiLCB0eXBlOiBULCB0YXJnZXQ6IEFueUZ1bmMsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcImNhc3RcIiwgdHlwZTogVCwgaW5wdXRUeXBlOiBOdW1UeXBlLCB1bnNpZ25lZDogYm9vbGVhbiwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJpZlwiLCB0eXBlOiBULCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlOiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwibG9hZFwiLCB0eXBlOiBULCBhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByPFwiaTMyXCI+LCBzdG9yYWdlOiBNZW1vcnlUeXBlLCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiA/IHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBOdW1UeXBlLCBvcDogQ21wT3AsIGxlZnQ6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByPE51bVR5cGU+IH0gOiBuZXZlcilcblxuY2xhc3MgRXhwck1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IHt9XG50eXBlIEFyaXRobWV0aWNNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsgW09wIGluIEFyaXRobWV0aWNPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxudHlwZSBDb21wYXJlTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBDbXBPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxudHlwZSBJbnRlZ2VyTWV0aG9kczxUIGV4dGVuZHMgSW50VHlwZT4gPSB7IFtPcCBpbiBCaXRPcCB8IFJlbWFpbmRlck9wXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5leHBvcnQgdHlwZSBFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IENvcmVFeHByPFQ+ICYgRXhwck1ldGhvZHM8VD4gJiBBcml0aG1ldGljTWV0aG9kczxUPiAmIENvbXBhcmVNZXRob2RzPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gSW50ZWdlck1ldGhvZHM8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIEFueUV4cHIgPSBhbnlcblxuXG5leHBvcnQgdHlwZSBTdG10ID1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBudW1iZXIsIHR5cGU6IE51bVR5cGUsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXk6IEFueUFycmF5LCB0eXBlOiBNZW1vcnlUeXBlLCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RyaWRlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImFycmF5Lm1vdmVcIiwgYXJyYXk6IEFueUFycmF5LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4gfVxuICB8IHsga2luZDogXCJpZlwiLCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10W10sIGVsc2U6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IG51bWJlciwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwibG9vcFwiLCBjb250cm9sOiBudW1iZXIsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZT86IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBBbnlGdW5jLCBhcmdzOiBFeHByPE51bVR5cGU+W10gfVxuICB8IHsga2luZDogXCJ0cmFwXCIsIG1lc3NhZ2U6IHN0cmluZyB9XG4gIHwgeyBraW5kOiBcImxvZ1wiLCBtZXNzYWdlOiBzdHJpbmcsIHZhbHVlOiBFeHByPFwiaTMyXCI+IH1cbiAgfCB7IGtpbmQ6IFwiZXhwclwiLCBleHByOiBFeHByPE51bVR5cGU+IH1cblxuZXhwb3J0IHR5cGUgQmxvY2tIYW5kbGUgPSB7IGtpbmQ6IFwiYmxvY2tcIiwgaWQ6IG51bWJlciB9XG5leHBvcnQgdHlwZSBMb29wSGFuZGxlID0geyBraW5kOiBcImxvb3BcIiwgaWQ6IG51bWJlciB9XG50eXBlIENvbnRyb2xIYW5kbGUgPSBCbG9ja0hhbmRsZSB8IExvb3BIYW5kbGVcblxuY2xhc3MgTXV0YWJsZU1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IGV4dGVuZHMgRXhwck1ldGhvZHM8VD4ge1xuICBkZWNsYXJlIHR5cGU6IFRcbiAgZGVjbGFyZSB3cml0ZTogKHZhbHVlOiBFeHByPFQ+KSA9PiBTdG10XG4gIHNldCh2YWx1ZTogRXhwckxpa2U8VD4pIHsgcmV0dXJuIHRoaXMud3JpdGUobGl0KHRoaXMudHlwZSwgdmFsdWUpKSB9XG59XG50eXBlIE11dGFibGVBcml0aG1ldGljPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsgW09wIGluIEFyaXRobWV0aWNPcCBhcyBgaSR7T3B9YF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IFN0bXQgfVxudHlwZSBNdXRhYmxlSW50ZWdlcjxUIGV4dGVuZHMgSW50VHlwZT4gPSB7IFtPcCBpbiBcImFuZFwiIHwgXCJvclwiIHwgXCJ4b3JcIiBhcyBgaSR7T3B9YF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IFN0bXQgfVxuZXhwb3J0IHR5cGUgTXV0YWJsZVZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gJiB7IHNldCh2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10IH0gJiBNdXRhYmxlQXJpdGhtZXRpYzxUPiAmIChUIGV4dGVuZHMgSW50VHlwZSA/IE11dGFibGVJbnRlZ2VyPFQ+IDoge30pXG5leHBvcnQgdHlwZSBMb2NhbFZhcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSBNdXRhYmxlVmFsdWU8VD4gJiBMb2NhbE5vZGU8VD5cblxuZXhwb3J0IHR5cGUgQXJyYXlWYWx1ZTxUIGV4dGVuZHMgRFR5cGU+ID1cbiAgVCBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBNdXRhYmxlU3RydWN0PEY+IDpcbiAgVCBleHRlbmRzIE1lbW9yeVR5cGUgPyBNdXRhYmxlVmFsdWU8TG9hZGVkVHlwZTxUPj4gOiBuZXZlclxuZXhwb3J0IHR5cGUgQXJyYXlIYW5kbGU8VCBleHRlbmRzIERUeXBlPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IFRcbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBBcnJheVZhbHVlPFQ+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBCaXRTdG9yYWdlVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiIHwgXCJpMzJcIlxuZXhwb3J0IHR5cGUgQml0RmllbGQgPSByZWFkb25seSBbQml0U3RvcmFnZVR5cGUsIG51bWJlcl1cbmV4cG9ydCB0eXBlIFN0cnVjdFN0b3JhZ2VUeXBlID0gUGFja2VkVHlwZSB8IEludFR5cGVcbmV4cG9ydCB0eXBlIEZpZWxkVHlwZSA9IFN0cnVjdFN0b3JhZ2VUeXBlIHwgQml0RmllbGRcbmV4cG9ydCB0eXBlIFN0cnVjdEZpZWxkcyA9IFJlY29yZDxzdHJpbmcsIEZpZWxkVHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkU3RvcmFnZTxUIGV4dGVuZHMgRmllbGRUeXBlPiA9IFQgZXh0ZW5kcyByZWFkb25seSBbaW5mZXIgUyBleHRlbmRzIEJpdFN0b3JhZ2VUeXBlLCBudW1iZXJdID8gUyA6IEV4dHJhY3Q8VCwgTWVtb3J5VHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkVmFsdWU8VCBleHRlbmRzIEZpZWxkVHlwZT4gPSBMb2FkZWRUeXBlPEZpZWxkU3RvcmFnZTxUPj5cbmV4cG9ydCB0eXBlIEZpZWxkTGF5b3V0ID0geyBzdG9yYWdlOiBTdHJ1Y3RTdG9yYWdlVHlwZSwgYml0T2Zmc2V0OiBudW1iZXIsIGJpdHM6IG51bWJlciB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RUeXBlPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBraW5kOiBcInN0cnVjdFwiXG4gIGZpZWxkczogRlxuICBsYXlvdXQ6IHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH1cbiAgc2l6ZTogbnVtYmVyXG4gIHN0b3JhZ2U6IFwidThcIiB8IFwidTE2XCIgfCBJbnRUeXBlXG59XG50eXBlIFN0cnVjdE1lbWJlcnM8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7XG4gIFtLIGluIGtleW9mIEZdOiBFeHByPEZpZWxkVmFsdWU8RltLXT4+XG59XG50eXBlIE11dGFibGVTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogTXV0YWJsZVZhbHVlPEZpZWxkVmFsdWU8RltLXT4+XG59XG5leHBvcnQgdHlwZSBTdHJ1Y3RJbml0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogRXhwckxpa2U8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgSlNTdHJ1Y3Q8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7IFtLIGluIGtleW9mIEZdOiBWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PiB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RWYWx1ZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdE1lbWJlcnM8Rj4gJiB7IHBhY2tlZDogQW55RXhwciB9XG5leHBvcnQgdHlwZSBNdXRhYmxlU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gU3RydWN0VmFsdWU8Rj4gJiBNdXRhYmxlU3RydWN0TWVtYmVyczxGPiAmIHtcbiAgc2V0KHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPik6IFN0bXRcbn1cbmV4cG9ydCB0eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPlxuZXhwb3J0IHR5cGUgU3RtdEJvZHkgPSBTdG10IHwgU3RtdEJvZHlbXVxudHlwZSBDb250cm9sQm9keTxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4gPSBTdG10Qm9keSB8ICgoc2VsZjogSCkgPT4gU3RtdEJvZHkpXG5leHBvcnQgdHlwZSBGdW5jQm9keTxSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPVxuICBSIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8Uj4gfCBTdG10Qm9keSA6XG4gIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gfCBTdG10Qm9keSA6XG4gIFN0bXRCb2R5XG5leHBvcnQgdHlwZSBGdW5jSGFuZGxlPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPiA9IHtcbiAga2luZDogXCJmdW5jXCJcbiAgcGFyYW1zOiBBXG4gIHJlc3VsdDogUlxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj5cbiAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NMaWtlPEE+KSA9PlxuICAgIFIgZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxSPiA6XG4gICAgUiBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBTdHJ1Y3RWYWx1ZTxGPiA6XG4gICAgU3RtdFxufVxuXG5leHBvcnQgdHlwZSBBbnlGdW5jID0ge1xuICBraW5kOiBcImZ1bmNcIlxuICBwYXJhbXM6IHJlYWRvbmx5IE51bVR5cGVbXVxuICByZXN1bHQ6IFJlc3VsdFR5cGVcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBBbnlFeHByW10pID0+IGFueVxuICBjYWxsOiAoLi4uYXJnczogYW55W10pID0+IEFueUV4cHJcbn1cblxuZXhwb3J0IHR5cGUgQW55QXJyYXkgPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICB0eXBlOiBEVHlwZVxuICBsZW5ndGg6IG51bWJlclxuICBlbGVtZW50U2l6ZTogbnVtYmVyXG4gIGF0KC4uLmFyZ3M6IGFueVtdKTogYW55XG4gIG1vdmUoLi4uYXJnczogYW55W10pOiBTdG10XG59XG5cbmV4cG9ydCB0eXBlIE1vZHVsZURlZiA9IFJlY29yZDxzdHJpbmcsIEFueUZ1bmMgfCBBbnlBcnJheT5cbmV4cG9ydCB0eXBlIEZ1bmNEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlGdW5jPiB9XG5leHBvcnQgdHlwZSBBcnJheURlZnM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7IFtLIGluIGtleW9mIFQgYXMgVFtLXSBleHRlbmRzIEFueUFycmF5ID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlBcnJheT4gfVxuZXhwb3J0IHR5cGUgQ29tcGlsZVJlc3VsdDxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgW0sgaW4ga2V5b2YgVF06XG4gICAgVFtLXSBleHRlbmRzIEFueUZ1bmMgPyAoLi4uYXJnczogQXJnc1ZhbDxUW0tdW1wicGFyYW1zXCJdPikgPT5cbiAgICAgIFRbS11bXCJyZXN1bHRcIl0gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8VFtLXVtcInJlc3VsdFwiXT4gOlxuICAgICAgVFtLXVtcInJlc3VsdFwiXSBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBKU1N0cnVjdDxGPiA6XG4gICAgICB2b2lkXG4gICAgOiBUW0tdIGV4dGVuZHMgQXJyYXlIYW5kbGU8aW5mZXIgRD4gP1xuICAgICAgRCBleHRlbmRzIE1lbW9yeVR5cGUgPyBUeXBlZEFycmF5Rm9yPEQ+IDogVWludDhBcnJheSB8IFVpbnQxNkFycmF5IHwgVWludDMyQXJyYXkgfCBCaWdVaW50NjRBcnJheVxuICAgIDogbmV2ZXJcbn0gJiB7XG4gIG1vZDogV2ViQXNzZW1ibHkuTW9kdWxlXG4gIG1lbW9yeTogV2ViQXNzZW1ibHkuTWVtb3J5XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHJlc3VsdFN0cnVjdHM6IFJlY29yZDxzdHJpbmcsIFN0cnVjdFR5cGU8YW55Pj5cbn1cblxuXG5sZXQgbmV4dExvY2FsSWQgPSAwXG5sZXQgbmV4dENvbnRyb2xJZCA9IDBcblxuY29uc3QgaW5mZXJUeXBlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pID0+XG4gICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgXCJ0eXBlXCIgaW4gdmFsdWUgPyB2YWx1ZS50eXBlIDogXCJpMzJcIikgYXMgVFxuXG5jb25zdCBleHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPik6IEV4cHI8VD4gPT4ge1xuICByZXR1cm4gT2JqZWN0LnNldFByb3RvdHlwZU9mKG5vZGUsIEV4cHJNZXRob2RzLnByb3RvdHlwZSkgYXMgRXhwcjxUPlxufVxuXG5leHBvcnQgY29uc3QgbGl0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+IHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChcImtpbmRcIiBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlIGFzIEV4cHI8VD5cbiAgfVxuICByZXR1cm4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIFZhbHVlPFQ+IH0pXG59XG5jb25zdCBtdXRhYmxlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPiwgd3JpdGU6ICh2YWx1ZTogRXhwcjxUPikgPT4gU3RtdCkgPT5cbiAgT2JqZWN0LmFzc2lnbihPYmplY3Quc2V0UHJvdG90eXBlT2Yobm9kZSwgTXV0YWJsZU1ldGhvZHMucHJvdG90eXBlKSwgeyB3cml0ZSB9KSBhcyBNdXRhYmxlVmFsdWU8VD5cblxuY29uc3QgaXNTdG10ID0gKHg6IHVua25vd24pOiB4IGlzIFN0bXQgPT5cbiAgISF4ICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIFwia2luZFwiIGluIHggJiYgKFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiaWZcIiA/IEFycmF5LmlzQXJyYXkoKHggYXMgeyB0aGVuPzogdW5rbm93biB9KS50aGVuKSA6XG4gICAgIVtcImNvbnN0XCIsIFwibG9jYWwuZ2V0XCIsIFwiYmluXCIsIFwiY2FsbFwiLCBcImNhc3RcIiwgXCJsb2FkXCIsIFwiY21wXCJdLmluY2x1ZGVzKCh4IGFzIHsga2luZDogc3RyaW5nIH0pLmtpbmQpXG4gIClcblxuY29uc3Qgc3RtdExpc3QgPSAoYm9keTogU3RtdEJvZHkpOiBTdG10W10gPT4gQXJyYXkuaXNBcnJheShib2R5KSA/IGJvZHkuZmxhdE1hcChzdG10TGlzdCkgOiBbYm9keV1cbmV4cG9ydCBjb25zdCBhc1N0bXRzID0gPFIgZXh0ZW5kcyBSZXN1bHRUeXBlPihib2R5OiBGdW5jQm9keTxSPikgPT4gaXNTdG10KGJvZHkpID8gW2JvZHldIDogQXJyYXkuaXNBcnJheShib2R5KSA/IHN0bXRMaXN0KGJvZHkpIDogbnVsbFxuY29uc3QgYmluZFN0bXRzID0gKGJvZHk6IFN0bXRCb2R5LCBicjogbnVtYmVyLCBsb29wOiBudW1iZXIgfCBudWxsKTogU3RtdFtdID0+XG4gIHN0bXRMaXN0KGJvZHkpLm1hcChzID0+IGJpbmRTdG10KHMsIGJyLCBsb29wKSlcblxuY29uc3QgYmluZFN0bXQgPSAoczogU3RtdCwgYnI6IG51bWJlciwgbG9vcDogbnVtYmVyIHwgbnVsbCk6IFN0bXQgPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4geyAuLi5zLCB0aGVuOiBiaW5kU3RtdHMocy50aGVuLCBiciwgbG9vcCksIGVsc2U6IGJpbmRTdG10cyhzLmVsc2UsIGJyLCBsb29wKSB9XG4gICAgY2FzZSBcImJyZWFrXCI6IHJldHVybiB7IC4uLnMsIHRhcmdldDogcy50YXJnZXQgPz8gYnIgfVxuICAgIGNhc2UgXCJjb250aW51ZVwiOlxuICAgICAgaWYgKHMudGFyZ2V0ICE9IG51bGwpIHJldHVybiBzXG4gICAgICBpZiAobG9vcCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJjb250aW51ZVRvKCkgdXNlZCBvdXRzaWRlIGEgbG9vcFwiKVxuICAgICAgcmV0dXJuIHsgLi4ucywgdGFyZ2V0OiBsb29wIH1cbiAgICBkZWZhdWx0OiByZXR1cm4gc1xuICB9XG59XG5cbmNvbnN0IGNvbnRyb2xCb2R5ID0gPEggZXh0ZW5kcyBDb250cm9sSGFuZGxlPihzZWxmOiBILCBib2R5OiBDb250cm9sQm9keTxIPikgPT5cbiAgYmluZFN0bXRzKHR5cGVvZiBib2R5ID09PSBcImZ1bmN0aW9uXCIgPyBib2R5KHNlbGYpIDogYm9keSwgc2VsZi5pZCwgc2VsZi5raW5kID09PSBcImxvb3BcIiA/IHNlbGYuaWQgOiBudWxsKVxuXG5jb25zdCBiaW4gPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBBcml0aG1ldGljT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgZXhwcjxUPih7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQ8VD4obGVmdC50eXBlIGFzIFQsIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8VD4gfSBhcyBDb3JlRXhwcjxUPilcblxuY29uc3QgYml0ID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihvcDogQml0T3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgZXhwcjxUPih7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQ8VD4obGVmdC50eXBlIGFzIFQsIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8VD4gfSBhcyBDb3JlRXhwcjxUPilcblxuY29uc3QgcmVtYWluZGVyID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihvcDogUmVtYWluZGVyT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT5cbiAgZXhwcjxUPih7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQ8VD4obGVmdC50eXBlIGFzIFQsIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8VD4gfSBhcyBDb3JlRXhwcjxUPilcblxuY29uc3QgY21wID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQ21wT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj4gPT5cbiAgZXhwcjxcImkzMlwiPih7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdDogbGVmdCBhcyB1bmtub3duIGFzIEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBsaXQ8VD4obGVmdC50eXBlIGFzIFQsIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8TnVtVHlwZT4gfSBhcyBDb3JlRXhwcjxcImkzMlwiPilcblxuZXhwb3J0IGNvbnN0IGFsbG9jYXRlTG9jYWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpID0+IGV4cHIoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbDogbmV4dExvY2FsSWQrKyB9KVxuXG5jb25zdCBta0xvY2FsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKTogTG9jYWxWYXI8VD4gPT4ge1xuICBjb25zdCBsb2NhbCA9IG5leHRMb2NhbElkKytcbiAgcmV0dXJuIG11dGFibGUoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbCB9LCB2YWx1ZSA9PiAoeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbCwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSkpIGFzIExvY2FsVmFyPFQ+XG59XG5cbmNvbnN0IG1rSGFuZGxlID0gPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPihcbiAgcGFyYW1zOiBBLFxuICByZXN1bHQ6IFIsXG4gIGJ1aWxkOiAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPixcbik6IEZ1bmNIYW5kbGU8QSwgUj4gPT4ge1xuICBsZXQgaGFuZGxlITogRnVuY0hhbmRsZTxBLCBSPlxuICBoYW5kbGUgPSB7XG4gICAga2luZDogXCJmdW5jXCIsXG4gICAgcGFyYW1zLCByZXN1bHQsIGJ1aWxkLFxuICAgIGNhbGw6ICguLi5hcmdzOiBBcmdzTGlrZTxBPikgPT4ge1xuICAgICAgY29uc3QgY2FsbEFyZ3MgPSBwYXJhbXMubWFwKCh0eXBlLCBpKSA9PiBsaXQodHlwZSwgYXJnc1tpXSBhcyBFeHByTGlrZTx0eXBlb2YgdHlwZT4pKSBhcyBFeHByPE51bVR5cGU+W11cbiAgICAgIGlmIChyZXN1bHQgPT09IFwidm9pZFwiKSByZXR1cm4geyBraW5kOiBcImNhbGwudm9pZFwiLCB0YXJnZXQ6IGhhbmRsZSwgYXJnczogY2FsbEFyZ3MgfVxuICAgICAgY29uc3QgdHlwZSA9ICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiID8gcmVzdWx0IDogcmVzdWx0LnN0b3JhZ2UgPT09IFwiaTY0XCIgPyBcImk2NFwiIDogXCJpMzJcIikgYXMgTnVtVHlwZVxuICAgICAgY29uc3QgY2FsbCA9IGV4cHIoeyBraW5kOiBcImNhbGxcIiwgdHlwZSwgdGFyZ2V0OiBoYW5kbGUsIGFyZ3M6IGNhbGxBcmdzIH0pXG4gICAgICByZXR1cm4gdHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIiA/IGNhbGwgOiByZWFkU3RydWN0KHJlc3VsdCwgY2FsbClcbiAgICB9LFxuICB9IGFzIEZ1bmNIYW5kbGU8QSwgUj5cbiAgcmV0dXJuIGhhbmRsZVxufVxuXG5jb25zdCBsb2FkZWRUeXBlID0gPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPih0eXBlOiBUKSA9PlxuICAodHlwZSA9PT0gXCJpOFwiIHx8IHR5cGUgPT09IFwidThcIiB8fCB0eXBlID09PSBcImkxNlwiIHx8IHR5cGUgPT09IFwidTE2XCIgPyBcImkzMlwiIDogdHlwZSkgYXMgTG9hZGVkVHlwZTxUPlxuXG5jb25zdCBzdG9yYWdlU2l6ZTogUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4gPSB7IGk4OiAxLCB1ODogMSwgaTE2OiAyLCB1MTY6IDIsIGkzMjogNCwgZjMyOiA0LCBpNjQ6IDgsIGY2NDogOCB9XG5jb25zdCBtZW1vcnlWYWx1ZSA9IDxUIGV4dGVuZHMgTWVtb3J5VHlwZT4oYXJyYXk6IEFueUFycmF5LCBpbmRleDogRXhwckxpa2U8XCJpMzJcIj4sIHN0b3JhZ2U6IFQsIHN0cmlkZTogbnVtYmVyLCBvZmZzZXQgPSAwKSA9PiB7XG4gIGNvbnN0IGF0ID0gbGl0KFwiaTMyXCIsIGluZGV4KVxuICByZXR1cm4gbXV0YWJsZSh7IGtpbmQ6IFwibG9hZFwiLCB0eXBlOiBsb2FkZWRUeXBlKHN0b3JhZ2UpLCBhcnJheSwgaW5kZXg6IGF0LCBzdG9yYWdlLCBzdHJpZGUsIG9mZnNldCB9LCB2YWx1ZSA9PlxuICAgICh7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXksIHR5cGU6IHN0b3JhZ2UsIGluZGV4OiBhdCwgc3RyaWRlLCBvZmZzZXQsIHZhbHVlOiB2YWx1ZSBhcyBFeHByPE51bVR5cGU+IH0pKVxufVxuXG50eXBlIFN0cnVjdEJhY2tpbmcgPSBhbnlcbnR5cGUgSW50ZXJuYWxTdHJ1Y3Q8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSBNdXRhYmxlU3RydWN0PEY+ICYgeyBwYWNrZWQ6IFN0cnVjdEJhY2tpbmcgfVxuXG5jb25zdCByZWFkRmllbGQgPSAoYmFja2luZzogQW55RXhwciwgZmllbGQ6IEZpZWxkTGF5b3V0KSA9PiB7XG4gIGNvbnN0IHsgYml0cyB9ID0gZmllbGRcbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBiYWNraW5nXG4gIGlmIChiYWNraW5nLnR5cGUgPT09IFwiaTY0XCIpIHtcbiAgICBjb25zdCBiaXRPZmZzZXQgPSBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSwgbWFzayA9ICgxbiA8PCBCaWdJbnQoYml0cykpIC0gMW5cbiAgICBjb25zdCByYXcgPSBpMzIoYmFja2luZy5zaHIoYml0T2Zmc2V0KS5hbmQobWFzaykpXG4gICAgcmV0dXJuIGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgYml0cyA8IDMyXG4gICAgICA/IGlmRWxzZShyYXcuYW5kKDIgKiogKGJpdHMgLSAxKSksIHJhdy5zdWIoMiAqKiBiaXRzKSwgcmF3KVxuICAgICAgOiByYXdcbiAgfVxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpMzJcIiAmJiBmaWVsZC5iaXRPZmZzZXQgPT09IDApIHJldHVybiBiYWNraW5nXG4gIGNvbnN0IG1hc2sgPSAyICoqIGJpdHMgLSAxXG4gIGNvbnN0IHJhdyA9IGJhY2tpbmcuc2hyKGZpZWxkLmJpdE9mZnNldCkuYW5kKG1hc2spXG4gIHJldHVybiBmaWVsZC5zdG9yYWdlLnN0YXJ0c1dpdGgoXCJpXCIpICYmIGJpdHMgPCAzMlxuICAgID8gaWZFbHNlKHJhdy5hbmQoMiAqKiAoYml0cyAtIDEpKSwgcmF3LnN1YigyICoqIGJpdHMpLCByYXcpXG4gICAgOiByYXdcbn1cblxuY29uc3QgcGFja2VkRmllbGRWYWx1ZSA9IChiYWNraW5nOiBTdHJ1Y3RCYWNraW5nLCBmaWVsZDogRmllbGRMYXlvdXQpID0+IHtcbiAgY29uc3QgdmFsdWUgPSByZWFkRmllbGQoYmFja2luZywgZmllbGQpXG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiKSByZXR1cm4gYmFja2luZ1xuICBpZiAoYmFja2luZy50eXBlID09PSBcImk2NFwiKSB7XG4gICAgY29uc3QgYml0T2Zmc2V0ID0gQmlnSW50KGZpZWxkLmJpdE9mZnNldCksIG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgY29uc3QgZmllbGRNYXNrID0gbWFzayA8PCBiaXRPZmZzZXRcbiAgICByZXR1cm4gbXV0YWJsZTxcImkzMlwiPih2YWx1ZSBhcyBFeHByPFwiaTMyXCI+LCBpbnB1dCA9PiBiYWNraW5nLnNldChiYWNraW5nLmFuZCh+ZmllbGRNYXNrKS5vcihpNjR1KGlucHV0KS5hbmQobWFzaykuc2hsKGJpdE9mZnNldCkpKSlcbiAgfVxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpMzJcIiAmJiBmaWVsZC5iaXRPZmZzZXQgPT09IDApIHJldHVybiBiYWNraW5nXG4gIGNvbnN0IG1hc2sgPSAyICoqIGZpZWxkLmJpdHMgLSAxLCBmaWVsZE1hc2sgPSBtYXNrIDw8IGZpZWxkLmJpdE9mZnNldFxuICByZXR1cm4gbXV0YWJsZTxcImkzMlwiPih2YWx1ZSwgaW5wdXQgPT4gYmFja2luZy5zZXQoYmFja2luZy5hbmQofmZpZWxkTWFzaykub3IoaW5wdXQuYW5kKG1hc2spLnNobChmaWVsZC5iaXRPZmZzZXQpKSkpXG59XG5cbmNvbnN0IHJlYWRTdHJ1Y3QgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgcGFja2VkOiBBbnlFeHByKTogU3RydWN0VmFsdWU8Rj4gPT5cbiAgT2JqZWN0LmFzc2lnbihPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmtleXModHlwZS5maWVsZHMpLm1hcChuYW1lID0+IFtuYW1lLCByZWFkRmllbGQocGFja2VkLCB0eXBlLmxheW91dFtuYW1lXSEpXSkpLCB7IHBhY2tlZCB9KSBhcyBTdHJ1Y3RWYWx1ZTxGPlxuXG5jb25zdCBzdHJ1Y3RWYWx1ZSA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCBwYWNrZWQ6IFN0cnVjdEJhY2tpbmcpOiBNdXRhYmxlU3RydWN0PEY+ID0+IHtcbiAgY29uc3QgZmllbGRzID0gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5tYXAobmFtZSA9PiBbbmFtZSwgcGFja2VkRmllbGRWYWx1ZShwYWNrZWQsIHR5cGUubGF5b3V0W25hbWVdISldKSlcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oZmllbGRzLCB7IHBhY2tlZCwgc2V0OiAodmFsdWU6IE11dGFibGVTdHJ1Y3Q8Rj4gfCBTdHJ1Y3RJbml0PEY+KSA9PlxuICAgIHBhY2tlZC5zZXQoXCJwYWNrZWRcIiBpbiB2YWx1ZSA/ICh2YWx1ZSBhcyBJbnRlcm5hbFN0cnVjdDxGPikucGFja2VkIDogcGFja1N0cnVjdCh0eXBlLCB2YWx1ZSkpIH0pIGFzIEludGVybmFsU3RydWN0PEY+XG59XG5cbmNvbnN0IHBhY2tTdHJ1Y3QgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgdmFsdWVzOiBTdHJ1Y3RJbml0PEY+KTogQW55RXhwciA9PiB7XG4gIGlmICh0eXBlLnN0b3JhZ2UgIT09IFwiaTY0XCIpIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykucmVkdWNlKChwYWNrZWQsIG5hbWUpID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IHR5cGUubGF5b3V0W25hbWVdISwgdmFsdWUgPSB2YWx1ZXNbbmFtZV0hXG4gICAgY29uc3QgbWFzayA9IDIgKiogZmllbGQuYml0cyAtIDFcbiAgICByZXR1cm4gcGFja2VkLm9yKGxpdChcImkzMlwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImkzMlwiPikuYW5kKG1hc2spLnNobChmaWVsZC5iaXRPZmZzZXQpKVxuICB9LCBpMzIoMCkpXG4gIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykucmVkdWNlKChwYWNrZWQsIG5hbWUpID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IHR5cGUubGF5b3V0W25hbWVdISwgdmFsdWUgPSB2YWx1ZXNbbmFtZV0hXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBsaXQoXCJpNjRcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpNjRcIj4pXG4gICAgY29uc3QgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICByZXR1cm4gcGFja2VkLm9yKGk2NHUobGl0KFwiaTMyXCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTMyXCI+KSkuYW5kKG1hc2spLnNobChCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkpXG4gIH0sIGk2NCgwbikpXG59XG5cbmV4cG9ydCBjb25zdCBzdHJ1Y3QgPSA8Y29uc3QgRiBleHRlbmRzIFN0cnVjdEZpZWxkcz4oZmllbGRzOiBGKTogU3RydWN0VHlwZTxGPiA9PiB7XG4gIGlmIChcInNldFwiIGluIGZpZWxkcyB8fCBcInBhY2tlZFwiIGluIGZpZWxkcykgdGhyb3cgbmV3IEVycm9yKFwiU3RydWN0IGZpZWxkcyBjYW5ub3QgYmUgbmFtZWQgc2V0IG9yIHBhY2tlZFwiKVxuICBsZXQgdXNlZCA9IDBcbiAgY29uc3QgbGF5b3V0OiBQYXJ0aWFsPFJlY29yZDxrZXlvZiBGLCBGaWVsZExheW91dD4+ID0ge31cbiAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKGZpZWxkcykgYXMgKGtleW9mIEYpW10pIHtcbiAgICBjb25zdCBmaWVsZCA9IGZpZWxkc1tuYW1lXSFcbiAgICBjb25zdCBzdG9yYWdlID0gKEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGRbMF0gOiBmaWVsZCkgYXMgU3RydWN0U3RvcmFnZVR5cGVcbiAgICBjb25zdCBiaXRzID0gQXJyYXkuaXNBcnJheShmaWVsZCkgPyBmaWVsZFsxXSA6IHN0b3JhZ2VTaXplW3N0b3JhZ2VdICogOFxuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihiaXRzKSB8fCBiaXRzIDwgMSB8fCBiaXRzID4gc3RvcmFnZVNpemVbc3RvcmFnZV0gKiA4KSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgJHtzdG9yYWdlfSBiaXQtZmllbGQgd2lkdGggJHtiaXRzfWApXG4gICAgaWYgKHVzZWQgKyBiaXRzID4gNjQpIHRocm93IG5ldyBFcnJvcihgU3RydWN0IHJlcXVpcmVzICR7dXNlZCArIGJpdHN9IGJpdHM7IG1heGltdW0gaXMgNjRgKVxuICAgIGxheW91dFtuYW1lXSA9IHsgc3RvcmFnZSwgYml0T2Zmc2V0OiB1c2VkLCBiaXRzIH1cbiAgICB1c2VkICs9IGJpdHNcbiAgfVxuICBjb25zdCBzdG9yYWdlID0gdXNlZCA8PSA4ID8gXCJ1OFwiIDogdXNlZCA8PSAxNiA/IFwidTE2XCIgOiB1c2VkIDw9IDMyID8gXCJpMzJcIiA6IFwiaTY0XCJcbiAgcmV0dXJuIHsga2luZDogXCJzdHJ1Y3RcIiwgZmllbGRzLCBsYXlvdXQ6IGxheW91dCBhcyB7IFtLIGluIGtleW9mIEZdOiBGaWVsZExheW91dCB9LCBzdG9yYWdlLCBzaXplOiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSB9XG59XG5cbmNvbnN0IGNhc3QgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiBFeHByPE51bVR5cGU+LCB1bnNpZ25lZCA9IGZhbHNlKTogRXhwcjxUPiA9PlxuICB2YWx1ZS50eXBlID09PSB0eXBlID8gdmFsdWUgYXMgdW5rbm93biBhcyBFeHByPFQ+IDogZXhwcjxUPih7IGtpbmQ6IFwiY2FzdFwiLCB0eXBlLCBpbnB1dFR5cGU6IHZhbHVlLnR5cGUsIHVuc2lnbmVkLCB2YWx1ZSB9IGFzIENvcmVFeHByPFQ+KVxuY29uc3QgbnVtYmVyID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogdW5rbm93bik6IEV4cHI8VD4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSAodHlwZSA9PT0gXCJpNjRcIiA/IFwiYmlnaW50XCIgOiBcIm51bWJlclwiKVxuICAgID8gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZSwgdmFsdWUgfSBhcyBDb3JlRXhwcjxUPilcbiAgICA6IGNhc3QodHlwZSwgdmFsdWUgYXMgRXhwcjxOdW1UeXBlPilcblxuZXhwb3J0IGZ1bmN0aW9uIGkzMih2YWx1ZTogbnVtYmVyKTogRXhwcjxcImkzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGkzMjxUIGV4dGVuZHMgSW50VHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiaTMyXCI+XG5leHBvcnQgZnVuY3Rpb24gaTMyKHZhbHVlOiB1bmtub3duKSB7IHJldHVybiBudW1iZXIoXCJpMzJcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGk2NCh2YWx1ZTogYmlnaW50KTogRXhwcjxcImk2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGk2NDxUIGV4dGVuZHMgSW50VHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiaTY0XCI+XG5leHBvcnQgZnVuY3Rpb24gaTY0KHZhbHVlOiB1bmtub3duKSB7IHJldHVybiBudW1iZXIoXCJpNjRcIiwgdmFsdWUpIH1cbmV4cG9ydCBjb25zdCBpNjR1ID0gKHZhbHVlOiBFeHByPFwiaTMyXCI+KSA9PiBjYXN0KFwiaTY0XCIsIHZhbHVlIGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiwgdHJ1ZSlcblxudHlwZSBGMzJJbnB1dCA9IG51bWJlciB8IEV4cHI8XCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzIodmFsdWU6IG51bWJlcik6IEV4cHI8XCJmMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzI8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImYzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMih2YWx1ZTogRjMySW5wdXQpIHsgcmV0dXJuIG51bWJlcihcImYzMlwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgZnVuY3Rpb24gZjY0KHZhbHVlOiBudW1iZXIpOiBFeHByPFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjY0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmNjQodmFsdWU6IEYzMklucHV0KSB7IHJldHVybiBudW1iZXIoXCJmNjRcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGlmRWxzZTxUIGV4dGVuZHMgTnVtVHlwZT4oY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZV86IEV4cHI8VD4pOiBFeHByPFQ+XG5leHBvcnQgZnVuY3Rpb24gaWZFbHNlKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IFN0bXRCb2R5LCBlbHNlXz86IFN0bXRCb2R5KTogU3RtdFxuZXhwb3J0IGZ1bmN0aW9uIGlmRWxzZTxUIGV4dGVuZHMgTnVtVHlwZT4oY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiB8IFN0bXRCb2R5LCBlbHNlXz86IEV4cHI8VD4gfCBTdG10Qm9keSk6IEV4cHI8VD4gfCBTdG10IHtcbiAgcmV0dXJuIGlzU3RtdCh0aGVuKSB8fCBBcnJheS5pc0FycmF5KHRoZW4pXG4gICAgPyB7IGtpbmQ6IFwiaWZcIiwgY29uZCwgdGhlbjogc3RtdExpc3QodGhlbiBhcyBTdG10Qm9keSksIGVsc2U6IGVsc2VfID09PSB1bmRlZmluZWQgPyBbXSA6IHN0bXRMaXN0KGVsc2VfIGFzIFN0bXRCb2R5KSB9XG4gICAgOiBleHByPFQ+KHsga2luZDogXCJpZlwiLCB0eXBlOiB0aGVuLnR5cGUsIGNvbmQsIHRoZW4sIGVsc2U6IGVsc2VfIGFzIEV4cHI8VD4gfSBhcyBDb3JlRXhwcjxUPilcbn1cblxuY29uc3QgYXJpdGhtZXRpYyA9IE9iamVjdC5mcm9tRW50cmllcyhhcml0aG1ldGljT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4ob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBBcml0aG1ldGljT3BdOiA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCBiaXRzID0gT2JqZWN0LmZyb21FbnRyaWVzKGJpdE9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYml0KG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQml0T3BdOiA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCByZW1haW5kZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKHJlbWFpbmRlck9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gcmVtYWluZGVyKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gUmVtYWluZGVyT3BdOiA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCBjb21wYXJpc29ucyA9IE9iamVjdC5mcm9tRW50cmllcyhjbXBPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIENtcE9wXTogPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxuXG5mb3IgKGNvbnN0IG9wIG9mIGFyaXRobWV0aWNPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxOdW1UeXBlPikgeyByZXR1cm4gYXJpdGhtZXRpY1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBiaXRPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8SW50VHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxJbnRUeXBlPikgeyByZXR1cm4gYml0c1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiByZW1haW5kZXJPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8SW50VHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxJbnRUeXBlPikgeyByZXR1cm4gcmVtYWluZGVyc1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBjbXBPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxOdW1UeXBlPikgeyByZXR1cm4gY29tcGFyaXNvbnNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgWy4uLmFyaXRobWV0aWNPcHMsIFwiYW5kXCIsIFwib3JcIiwgXCJ4b3JcIl0gYXMgY29uc3QpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNdXRhYmxlTWV0aG9kcy5wcm90b3R5cGUsIGBpJHtvcH1gLCB7XG4gIHZhbHVlKHRoaXM6IE11dGFibGVWYWx1ZTxhbnk+LCByaWdodDogYW55KSB7IHJldHVybiB0aGlzLnNldCgodGhpcyBhcyBhbnkpW29wXShyaWdodCkpIH0sXG59KVxuXG5leHBvcnQgY29uc3QgeyBhZGQsIHN1YiwgbXVsLCBkaXYgfSA9IGFyaXRobWV0aWNcbmV4cG9ydCBjb25zdCB7IGFuZCwgb3IsIHhvciwgc2hsLCBzaHIgfSA9IGJpdHNcbmV4cG9ydCBjb25zdCB7IG1vZCwgdW1vZCB9ID0gcmVtYWluZGVyc1xuZXhwb3J0IGNvbnN0IHsgZXEsIGx0LCBndCB9ID0gY29tcGFyaXNvbnNcblxuZXhwb3J0IGNvbnN0IGZ1bmMgPSA8Y29uc3QgQSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIFJlc3VsdFR5cGU+KHBhcmFtczogQSwgcmVzdWx0OiBSLCBidWlsZDogKC4uLmFyZ3M6IEFyZ3NFeHByPEE+KSA9PiBGdW5jQm9keTxSPikgPT5cbiAgbWtIYW5kbGUocGFyYW1zLCByZXN1bHQsIGJ1aWxkIGFzICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+KVxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5PFQgZXh0ZW5kcyBEVHlwZT4odHlwZTogVCwgbGVuZ3RoOiBudW1iZXIpOiBBcnJheUhhbmRsZTxUPiB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihsZW5ndGgpIHx8IGxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXJyYXkgbGVuZ3RoICR7bGVuZ3RofWApXG4gIGNvbnN0IHN0cnVjdCA9IHR5cGVvZiB0eXBlID09PSBcIm9iamVjdFwiID8gdHlwZSA6IG51bGxcbiAgY29uc3Qgc3RvcmFnZTogTWVtb3J5VHlwZSA9IHN0cnVjdCA/IHN0cnVjdC5zdG9yYWdlIDogdHlwZSBhcyBNZW1vcnlUeXBlXG4gIGNvbnN0IGVsZW1lbnRTaXplID0gc3RydWN0ID8gc3RydWN0LnNpemUgOiBzdG9yYWdlU2l6ZVtzdG9yYWdlXVxuICBsZXQgaGFuZGxlOiBBbnlBcnJheVxuICBoYW5kbGUgPSB7XG4gICAga2luZDogXCJhcnJheVwiLCB0eXBlLCBsZW5ndGgsIGVsZW1lbnRTaXplLFxuICAgIGF0OiBpbmRleCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG1lbW9yeVZhbHVlKGhhbmRsZSwgaW5kZXgsIHN0b3JhZ2UsIGVsZW1lbnRTaXplKVxuICAgICAgcmV0dXJuIHN0cnVjdCA/IHN0cnVjdFZhbHVlKHN0cnVjdCwgdmFsdWUpIDogdmFsdWVcbiAgICB9LFxuICAgIG1vdmU6ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+ICh7IGtpbmQ6IFwiYXJyYXkubW92ZVwiLCBhcnJheTogaGFuZGxlLCB0YXJnZXQ6IGxpdChcImkzMlwiLCB0YXJnZXQpLCBzb3VyY2U6IGxpdChcImkzMlwiLCBzb3VyY2UpLCBjb3VudDogbGl0KFwiaTMyXCIsIGNvdW50KSB9KSxcbiAgfVxuICByZXR1cm4gaGFuZGxlIGFzIEFycmF5SGFuZGxlPFQ+XG59XG5cbmNvbnN0IG1rU3RydWN0TG9jYWwgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPikgPT5cbiAgc3RydWN0VmFsdWUodHlwZSwgbWtMb2NhbCh0eXBlLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyBcImk2NFwiIDogXCJpMzJcIikpXG5cbnR5cGUgTG9jYWxGYWN0b3J5ID0ge1xuICA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiBMb2NhbFZhcjxUPlxuICA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPik6IE11dGFibGVTdHJ1Y3Q8Rj5cbn1cblxuZXhwb3J0IGNvbnN0IGxvY2FsID0gKDxUIGV4dGVuZHMgTnVtVHlwZSwgRiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogVCB8IFN0cnVjdFR5cGU8Rj4pID0+XG4gIHR5cGVvZiB0eXBlID09PSBcInN0cmluZ1wiID8gbWtMb2NhbCh0eXBlKSA6IG1rU3RydWN0TG9jYWwodHlwZSkpIGFzIExvY2FsRmFjdG9yeVxuXG5leHBvcnQgZnVuY3Rpb24gcmV0KCk6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiByZXQ8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiByZXQodmFsdWU6IHsgcGFja2VkOiBBbnlFeHByIH0pOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZT86IEV4cHJMaWtlPFQ+IHwgeyBwYWNrZWQ6IEFueUV4cHIgfSk6IFN0bXQge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHsga2luZDogXCJyZXR1cm5cIiB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgXCJwYWNrZWRcIiBpbiB2YWx1ZSkgcmV0dXJuIHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU6IHZhbHVlLnBhY2tlZCB9XG4gIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiBsaXQoaW5mZXJUeXBlKHZhbHVlKSwgdmFsdWUpIGFzIEV4cHI8TnVtVHlwZT4gfVxufVxuZXhwb3J0IGNvbnN0IHRyYXAgPSAobWVzc2FnZTogc3RyaW5nKTogU3RtdCA9PiAoeyBraW5kOiBcInRyYXBcIiwgbWVzc2FnZSB9KVxuZXhwb3J0IGNvbnN0IGJvdW5kc0NoZWNrID0gKGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCBjb3VudDogRXhwckxpa2U8XCJpMzJcIj4gPSAxKTogU3RtdCA9PiB7XG4gIGNvbnN0IGkgPSBsaXQoXCJpMzJcIiwgaW5kZXgpLCBuID0gbGl0KFwiaTMyXCIsIGNvdW50KVxuICByZXR1cm4gaWZFbHNlKGkubHQoMCkub3Iobi5sdCgwKSkub3Iobi5ndChhcnJheS5sZW5ndGgpKS5vcihpLmd0KGkzMihhcnJheS5sZW5ndGgpLnN1YihuKSkpLCB0cmFwKFwiYXJyYXkgYm91bmRzIGV4Y2VlZGVkXCIpKVxufVxuZXhwb3J0IGNvbnN0IGxvZyA9IChtZXNzYWdlOiBzdHJpbmcsIHZhbHVlOiBFeHByTGlrZTxcImkzMlwiPik6IFN0bXQgPT4gKHsga2luZDogXCJsb2dcIiwgbWVzc2FnZSwgdmFsdWU6IGxpdChcImkzMlwiLCB2YWx1ZSkgfSlcbmV4cG9ydCBjb25zdCBibG9jayA9IChib2R5OiBDb250cm9sQm9keTxCbG9ja0hhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogQmxvY2tIYW5kbGUgPSB7IGtpbmQ6IFwiYmxvY2tcIiwgaWQ6IG5leHRDb250cm9sSWQrKyB9XG4gIHJldHVybiB7IGtpbmQ6IFwiYmxvY2tcIiwgY29udHJvbDogc2VsZi5pZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuZXhwb3J0IGNvbnN0IGxvb3AgPSAoY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogQ29udHJvbEJvZHk8TG9vcEhhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogc2VsZi5pZCwgY29uZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuXG5leHBvcnQgY29uc3QgYnJlYWtUbyA9ICh0YXJnZXQ/OiBDb250cm9sSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgY29udGludWVUbyA9ICh0YXJnZXQ/OiBMb29wSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgZXhwclN0bXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogU3RtdCA9PiAoeyBraW5kOiBcImV4cHJcIiwgZXhwcjogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KVxuIiwKICAgICJpbXBvcnQge1xuICBhbGxvY2F0ZUxvY2FsLCBhc1N0bXRzLFxuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUZ1bmMsIHR5cGUgQXJyYXlEZWZzLCB0eXBlIEV4cHIsXG4gIHR5cGUgRnVuY0JvZHksIHR5cGUgRnVuY0RlZnMsIHR5cGUgTW9kdWxlRGVmLCB0eXBlIE51bVR5cGUsIHR5cGUgUmVzdWx0VHlwZSxcbn0gZnJvbSBcIi4vYXN0XCJcblxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuZXhwb3J0IHR5cGUgQXJyYXlMYXlvdXQgPSB7IGxlbmd0aDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgZWxlbWVudFNpemU6IG51bWJlciB9XG5leHBvcnQgdHlwZSBNb2R1bGVBbmFseXNpczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgZnVuY3M6IEZ1bmNEZWZzPFQ+XG4gIGFycmF5czogQXJyYXlEZWZzPFQ+XG4gIGZFbnRyaWVzOiBba2V5b2YgRnVuY0RlZnM8VD4gJiBzdHJpbmcsIEZ1bmNEZWZzPFQ+W2tleW9mIEZ1bmNEZWZzPFQ+XV1bXVxuICBidWlsdEZ1bmNzOiBCdWlsdEZ1bmNbXVxuICBmaXg6IE1hcDxBbnlGdW5jLCBudW1iZXI+XG4gIGxheW91dHM6IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHBhZ2VzOiBudW1iZXJcbn1cblxudHlwZSBWaXNpdG9ycyA9IHtcbiAgbG9jYWw/OiAoaWQ6IG51bWJlciwgdHlwZTogTnVtVHlwZSkgPT4gdm9pZFxuICBhcnJheT86IChhcnJheTogQW55QXJyYXkpID0+IHZvaWRcbiAgZnVuYz86IChmdW5jOiBBbnlGdW5jKSA9PiB2b2lkXG4gIHRyYXA/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG4gIGxvZz86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbn1cbmNvbnN0IHdhbGsgPSAobm9kZTogYW55LCBmbnM6IFZpc2l0b3JzKTogdm9pZCA9PiB7XG4gIGlmIChub2RlID09IG51bGwpIHJldHVyblxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkgcmV0dXJuIG5vZGUuZm9yRWFjaCh4ID0+IHdhbGsoeCwgZm5zKSlcbiAgY29uc3QgY2hpbGRyZW4gPSAoLi4udmFsdWVzOiBhbnlbXSkgPT4gdmFsdWVzLmZvckVhY2goeCA9PiB3YWxrKHgsIGZucykpXG4gIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6IGNhc2UgXCJicmVha1wiOiBjYXNlIFwiY29udGludWVcIjogcmV0dXJuXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOiBmbnMubG9jYWw/Lihub2RlLmxvY2FsLCBub2RlLnR5cGUpOyByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6IGZucy5sb2NhbD8uKG5vZGUubG9jYWwsIG5vZGUudHlwZSk7IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiYmluXCI6IGNhc2UgXCJjbXBcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUubGVmdCwgbm9kZS5yaWdodClcbiAgICBjYXNlIFwiY2FsbFwiOiBjYXNlIFwiY2FsbC52b2lkXCI6IGZucy5mdW5jPy4obm9kZS50YXJnZXQpOyByZXR1cm4gd2Fsayhub2RlLmFyZ3MsIGZucylcbiAgICBjYXNlIFwiY2FzdFwiOiBjYXNlIFwicmV0dXJuXCI6IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUuY29uZCwgbm9kZS50aGVuLCBub2RlLmVsc2UpXG4gICAgY2FzZSBcImxvYWRcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiB3YWxrKG5vZGUuaW5kZXgsIGZucylcbiAgICBjYXNlIFwiYXJyYXkuc3RvcmVcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiBjaGlsZHJlbihub2RlLmluZGV4LCBub2RlLnZhbHVlKVxuICAgIGNhc2UgXCJhcnJheS5tb3ZlXCI6IGZucy5hcnJheT8uKG5vZGUuYXJyYXkpOyByZXR1cm4gY2hpbGRyZW4obm9kZS50YXJnZXQsIG5vZGUuc291cmNlLCBub2RlLmNvdW50KVxuICAgIGNhc2UgXCJibG9ja1wiOiByZXR1cm4gd2Fsayhub2RlLmJvZHksIGZucylcbiAgICBjYXNlIFwibG9vcFwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5jb25kLCBub2RlLmJvZHkpXG4gICAgY2FzZSBcInRyYXBcIjogZm5zLnRyYXA/Lihub2RlLm1lc3NhZ2UpOyByZXR1cm5cbiAgICBjYXNlIFwibG9nXCI6IGZucy5sb2c/Lihub2RlLm1lc3NhZ2UpOyByZXR1cm4gd2Fsayhub2RlLnZhbHVlLCBmbnMpXG4gICAgY2FzZSBcImV4cHJcIjogcmV0dXJuIHdhbGsobm9kZS5leHByLCBmbnMpXG4gICAgZGVmYXVsdDogZGllKG5vZGUpXG4gIH1cbn1cblxuXG5jb25zdCBhcnJheUxheW91dHMgPSAoYXJyYXlzOiBBbnlBcnJheVtdKSA9PiB7XG4gIGxldCBvZmZzZXQgPSAwXG4gIGNvbnN0IGxheW91dHMgPSBuZXcgTWFwPEFueUFycmF5LCBBcnJheUxheW91dD4oKVxuICBmb3IgKGNvbnN0IGFyciBvZiBhcnJheXMpIHtcbiAgICBjb25zdCBhbGlnbiA9IE1hdGgubWluKGFyci5lbGVtZW50U2l6ZSwgOClcbiAgICBvZmZzZXQgPSBNYXRoLmNlaWwob2Zmc2V0IC8gYWxpZ24pICogYWxpZ25cbiAgICBsYXlvdXRzLnNldChhcnIsIHsgbGVuZ3RoOiBhcnIubGVuZ3RoLCBvZmZzZXQsIGVsZW1lbnRTaXplOiBhcnIuZWxlbWVudFNpemUgfSlcbiAgICBvZmZzZXQgKz0gYXJyLmxlbmd0aCAqIGFyci5lbGVtZW50U2l6ZVxuICB9XG4gIHJldHVybiB7IGxheW91dHMsIGJ5dGVzOiBvZmZzZXQgfVxufVxuXG5leHBvcnQgdHlwZSBCdWlsdEZ1bmMgPSB7XG4gIGZ1bmM6IEFueUZ1bmNcbiAgYnVpbHQ6IEZ1bmNCb2R5PFJlc3VsdFR5cGU+XG4gIGxvY2FsczogW251bWJlciwgTnVtVHlwZV1bXVxuICBsb2NhbEluZGV4ZXM6IFJlY29yZDxudW1iZXIsIG51bWJlcj5cbiAgZnVuY3Rpb25zOiBBbnlGdW5jW11cbiAgYXJyYXlzOiBBbnlBcnJheVtdXG4gIHRyYXBzOiBzdHJpbmdbXVxuICBsb2dzOiBzdHJpbmdbXVxufVxuXG5jb25zdCBidWlsZEZ1bmMgPSAoZnVuYzogQW55RnVuYyk6IEJ1aWx0RnVuYyA9PiB7XG4gIGNvbnN0IHBhcmFtcyA9IGZ1bmMucGFyYW1zLm1hcCh0eXBlID0+IGFsbG9jYXRlTG9jYWwodHlwZSkpIGFzIEV4cHI8TnVtVHlwZT5bXVxuICBjb25zdCBwYXJhbUlkcyA9IHBhcmFtcy5tYXAocCA9PiBwLmtpbmQgPT09IFwibG9jYWwuZ2V0XCIgPyBwLmxvY2FsIDogLTEpXG4gIGNvbnN0IHJlc3VsdCA9IGZ1bmMuYnVpbGQoLi4ucGFyYW1zKVxuICBjb25zdCBidWlsdCA9IHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIiAmJiAhYXNTdG10cyhyZXN1bHQpID8gcmVzdWx0LnBhY2tlZCA6IHJlc3VsdFxuICBjb25zdCBmb3VuZCA9IG5ldyBNYXA8bnVtYmVyLCBOdW1UeXBlPigpXG4gIGNvbnN0IGZ1bmN0aW9ucyA9IG5ldyBTZXQ8QW55RnVuYz4oKSwgYXJyYXlzID0gbmV3IFNldDxBbnlBcnJheT4oKSwgdHJhcHMgPSBuZXcgU2V0PHN0cmluZz4oKSwgbG9ncyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gIHdhbGsoYnVpbHQsIHtcbiAgICBsb2NhbDogKGlkLCB0eXBlKSA9PiBmb3VuZC5zZXQoaWQsIHR5cGUpLCBmdW5jOiBmID0+IGZ1bmN0aW9ucy5hZGQoZiksIGFycmF5OiBhID0+IGFycmF5cy5hZGQoYSksXG4gICAgdHJhcDogbWVzc2FnZSA9PiB0cmFwcy5hZGQobWVzc2FnZSksIGxvZzogbWVzc2FnZSA9PiBsb2dzLmFkZChtZXNzYWdlKSxcbiAgfSlcbiAgcGFyYW1JZHMuZm9yRWFjaChpZCA9PiBmb3VuZC5kZWxldGUoaWQpKVxuICBjb25zdCBsb2NhbHMgPSBbLi4uZm91bmQuZW50cmllcygpXVxuICBjb25zdCBsb2NhbEluZGV4ZXMgPSBPYmplY3QuZnJvbUVudHJpZXMoW1xuICAgIC4uLnBhcmFtSWRzLm1hcCgoaWQsIGkpID0+IFtpZCwgaV0pLFxuICAgIC4uLmxvY2Fscy5tYXAoKFtpZF0sIGkpID0+IFtpZCwgZnVuYy5wYXJhbXMubGVuZ3RoICsgaV0pLFxuICBdKVxuICByZXR1cm4geyBmdW5jLCBidWlsdCwgbG9jYWxzLCBsb2NhbEluZGV4ZXMsIGZ1bmN0aW9uczogWy4uLmZ1bmN0aW9uc10sIGFycmF5czogWy4uLmFycmF5c10sIHRyYXBzOiBbLi4udHJhcHNdLCBsb2dzOiBbLi4ubG9nc10gfVxufVxuXG5jb25zdCBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMgPSAocm9vdHM6IEFueUZ1bmNbXSkgPT4ge1xuICBjb25zdCBidWlsdCA9IG5ldyBNYXA8QW55RnVuYywgQnVpbHRGdW5jPigpXG4gIGNvbnN0IHZpc2l0ID0gKGZ1bmM6IEFueUZ1bmMpID0+IHtcbiAgICBpZiAoYnVpbHQuaGFzKGZ1bmMpKSByZXR1cm5cbiAgICBjb25zdCBlbnRyeSA9IGJ1aWxkRnVuYyhmdW5jKVxuICAgIGJ1aWx0LnNldChmdW5jLCBlbnRyeSlcbiAgICBlbnRyeS5mdW5jdGlvbnMuZm9yRWFjaCh2aXNpdClcbiAgfVxuICByb290cy5mb3JFYWNoKHZpc2l0KVxuICByZXR1cm4gWy4uLmJ1aWx0LnZhbHVlcygpXVxufVxuXG5leHBvcnQgY29uc3QgYW5hbHl6ZU1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQpID0+IHtcbiAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKG1vZClcbiAgY29uc3QgZnVuY3MgPSBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5maWx0ZXIoKFssIHZdKSA9PiB2LmtpbmQgPT09IFwiZnVuY1wiKSkgYXMgRnVuY0RlZnM8VD5cbiAgY29uc3QgYXJyYXlzID0gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImFycmF5XCIpKSBhcyBBcnJheURlZnM8VD5cbiAgY29uc3QgZkVudHJpZXMgPSBPYmplY3QuZW50cmllcyhmdW5jcykgYXMgW2tleW9mIEZ1bmNEZWZzPFQ+ICYgc3RyaW5nLCBGdW5jRGVmczxUPltrZXlvZiBGdW5jRGVmczxUPl1dW11cbiAgY29uc3QgYnVpbHRGdW5jcyA9IGJ1aWxkUmVmZXJlbmNlZEZ1bmN0aW9ucyhmRW50cmllcy5tYXAoKFssIGZ1bmNdKSA9PiBmdW5jKSlcbiAgY29uc3QgZml4ID0gbmV3IE1hcChidWlsdEZ1bmNzLm1hcCgoeyBmdW5jIH0sIGkpID0+IFtmdW5jLCBpXSkpXG4gIGNvbnN0IGFsbEFycmF5cyA9IFsuLi5uZXcgU2V0KFsuLi5idWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmFycmF5cyksIC4uLk9iamVjdC52YWx1ZXMoYXJyYXlzKSBhcyBBbnlBcnJheVtdXSldXG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIGNvbnN0IHRyYXBNZXNzYWdlcyA9IFsuLi5uZXcgU2V0KGJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMudHJhcHMpKV1cbiAgY29uc3QgbG9nTWVzc2FnZXMgPSBbLi4ubmV3IFNldChidWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmxvZ3MpKV1cbiAgcmV0dXJuIHsgZnVuY3MsIGFycmF5cywgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXM6IE1hdGgubWF4KDEsIE1hdGguY2VpbChieXRlcyAvIDY1NTM2KSkgfSBhcyBNb2R1bGVBbmFseXNpczxUPlxufVxuIiwKICAgICJpbXBvcnQge1xuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUV4cHIsIHR5cGUgQW55RnVuYywgdHlwZSBBcml0aG1ldGljT3AsIHR5cGUgQml0T3AsIHR5cGUgQ21wT3AsIHR5cGUgRXhwcixcbiAgdHlwZSBNZW1vcnlUeXBlLCB0eXBlIE1vZHVsZURlZiwgdHlwZSBOdW1UeXBlLCB0eXBlIFJlbWFpbmRlck9wLCB0eXBlIFN0bXQsIGFzU3RtdHMsXG59IGZyb20gXCIuL2FzdFwiXG5pbXBvcnQgeyB0eXBlIEFycmF5TGF5b3V0LCB0eXBlIE1vZHVsZUFuYWx5c2lzIH0gZnJvbSBcIi4vYW5hbHl6ZVwiXG5cbmNvbnN0IG1hZ2ljID0gWzB4MDAsIDB4NjEsIDB4NzMsIDB4NmQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4MDBdXG5jb25zdCByZXN1bHRUeXBlID0gKHJlc3VsdDogQW55RnVuY1tcInJlc3VsdFwiXSkgPT5cbiAgdHlwZW9mIHJlc3VsdCA9PT0gXCJvYmplY3RcIiA/IHJlc3VsdC5zdG9yYWdlID09PSBcImk2NFwiID8gXCJpNjRcIiA6IFwiaTMyXCIgOiByZXN1bHRcblxuY29uc3QgbnVtYmVyQmFzZSA9IHsgaTMyOiAweDZhLCBpNjQ6IDB4N2MsIGYzMjogMHg5MiwgZjY0OiAweGEwIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj5cbmNvbnN0IG9wY29kZSA9IChvcDogQXJpdGhtZXRpY09wIHwgQml0T3AgfCBSZW1haW5kZXJPcCB8IENtcE9wLCB0eXBlOiBOdW1UeXBlKSA9PiB7XG4gIGNvbnN0IGFyaXRobWV0aWMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0uaW5kZXhPZihvcClcbiAgaWYgKGFyaXRobWV0aWMgPj0gMCkgcmV0dXJuIG51bWJlckJhc2VbdHlwZV0gKyBhcml0aG1ldGljXG4gIGNvbnN0IGludGVnZXIgPSBbXCJtb2RcIiwgXCJ1bW9kXCIsIFwiYW5kXCIsIFwib3JcIiwgXCJ4b3JcIiwgXCJzaGxcIiwgXCJcIiwgXCJzaHJcIl0uaW5kZXhPZihvcClcbiAgaWYgKGludGVnZXIgPj0gMCkgcmV0dXJuIG51bWJlckJhc2VbdHlwZV0gKyA1ICsgaW50ZWdlclxuICByZXR1cm4gKHsgaTMyOiAweDQ2LCBpNjQ6IDB4NTEsIGYzMjogMHg1YiwgZjY0OiAweDYxIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4pW3R5cGVdXG4gICAgKyAob3AgPT09IFwiZXFcIiA/IDAgOiBvcCA9PT0gXCJsdFwiID8gMiA6IHR5cGVbMF0gPT09IFwiaVwiID8gNCA6IDMpXG59XG5cbmNvbnN0IGNvZGVzID0ge1xuICB0eXBlOiB7IGkzMjogMHg3ZiwgaTY0OiAweDdlLCBmMzI6IDB4N2QsIGY2NDogMHg3YyB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICBsb2FkOiB7IGkzMjogMHgyOCwgaTY0OiAweDI5LCBmMzI6IDB4MmEsIGY2NDogMHgyYiwgaTg6IDB4MmMsIHU4OiAweDJkLCBpMTY6IDB4MmUsIHUxNjogMHgyZiB9IGFzIFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+LFxuICBzdG9yZTogeyBpMzI6IDB4MzYsIGk2NDogMHgzNywgZjMyOiAweDM4LCBmNjQ6IDB4MzksIGk4OiAweDNhLCB1ODogMHgzYSwgaTE2OiAweDNiLCB1MTY6IDB4M2IgfSBhcyBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPixcbiAgYWxpZ246IHsgaTg6IDAsIHU4OiAwLCBpMTY6IDEsIHUxNjogMSwgaTMyOiAyLCBmMzI6IDIsIGk2NDogMywgZjY0OiAzIH0gYXMgUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4sXG4gIHplcm86IHsgaTMyOiBbMHg0MSwgMF0sIGk2NDogWzB4NDIsIDBdLCBmMzI6IFsweDQzLCAwLCAwLCAwLCAwXSwgZjY0OiBbMHg0NCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0gfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyW10+LFxufVxuXG5jb25zdCB1MzIgPSAobjogbnVtYmVyKSA9PiB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCB1bnNpZ25lZCBpbnRlZ2VyLCBnb3QgJHtufWApXG4gIGNvbnN0IG91dDogbnVtYmVyW10gPSBbXVxuICBkbyB7XG4gICAgbGV0IGJ5dGUgPSBuICYgMHg3ZlxuICAgIG4gPj4+PSA3XG4gICAgaWYgKG4pIGJ5dGUgfD0gMHg4MFxuICAgIG91dC5wdXNoKGJ5dGUpXG4gIH0gd2hpbGUgKG4pXG4gIHJldHVybiBvdXRcbn1cblxuY29uc3Qgc04gPSAodmFsdWU6IG51bWJlciB8IGJpZ2ludCwgYml0czogMzIgfCA2NCkgPT4ge1xuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgbGV0IG4gPSBiaXRzID09PSAzMiA/IEJpZ0ludCgodmFsdWUgYXMgbnVtYmVyKSB8IDApIDogQmlnSW50LmFzSW50Tig2NCwgdmFsdWUgYXMgYmlnaW50KVxuICBmb3IgKDs7KSB7XG4gICAgbGV0IGJ5dGUgPSBOdW1iZXIobiAmIDB4N2ZuKVxuICAgIG4gPj49IDduXG4gICAgY29uc3QgZG9uZSA9IChuID09PSAwbiAmJiAoYnl0ZSAmIDB4NDApID09PSAwKSB8fCAobiA9PT0gLTFuICYmIChieXRlICYgMHg0MCkgIT09IDApXG4gICAgaWYgKCFkb25lKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICAgIGlmIChkb25lKSByZXR1cm4gb3V0XG4gIH1cbn1cblxuY29uc3QgZk4gPSAodmFsdWU6IG51bWJlciwgYnl0ZXM6IDQgfCA4KSA9PiB7XG4gIGNvbnN0IG91dCA9IG5ldyBVaW50OEFycmF5KGJ5dGVzKVxuICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KG91dC5idWZmZXIpXG4gIGJ5dGVzID09PSA0ID8gdmlldy5zZXRGbG9hdDMyKDAsIHZhbHVlLCB0cnVlKSA6IHZpZXcuc2V0RmxvYXQ2NCgwLCB2YWx1ZSwgdHJ1ZSlcbiAgcmV0dXJuIFsuLi5vdXRdXG59XG5cbmNvbnN0IHN0ciA9IChzOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUocylcbiAgcmV0dXJuIFsuLi51MzIoYnl0ZXMubGVuZ3RoKSwgLi4uYnl0ZXNdXG59XG5cbmNvbnN0IHNlY3Rpb24gPSAoaWQ6IG51bWJlciwgcGF5bG9hZDogbnVtYmVyW10pID0+IFtpZCwgLi4udTMyKHBheWxvYWQubGVuZ3RoKSwgLi4ucGF5bG9hZF1cbmNvbnN0IGZsYXRNYXAgPSA8VCwgUj4oeHM6IFRbXSwgZm46ICh4OiBUKSA9PiBSW10pID0+IHhzLmZsYXRNYXAoZm4pXG5jb25zdCBkaWUgPSAoeDogdW5rbm93bik6IG5ldmVyID0+IHsgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHZhbHVlOiAke1N0cmluZyh4KX1gKSB9XG5cblxuY29uc3QgYWRkciA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RyaWRlID0gbGF5b3V0LmVsZW1lbnRTaXplLCBmaWVsZE9mZnNldCA9IDApID0+XG4gIGluZGV4Lm11bChzdHJpZGUpLmFkZChsYXlvdXQub2Zmc2V0ICsgZmllbGRPZmZzZXQpXG5jb25zdCBtZW1hcmcgPSAodHlwZTogTWVtb3J5VHlwZSwgb2Zmc2V0ID0gMCkgPT4gWy4uLnUzMihjb2Rlcy5hbGlnblt0eXBlXSksIC4uLnUzMihvZmZzZXQpXVxuY29uc3QgY29uc3RJMzIgPSAoZTogRXhwcjxcImkzMlwiPikgPT4gZS5raW5kID09PSBcImNvbnN0XCIgPyBlLnZhbHVlIDogbnVsbFxuY29uc3QgY2hlY2tBcnJheUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPikgPT4ge1xuICBjb25zdCBuID0gY29uc3RJMzIoaW5kZXgpXG4gIGlmIChuID09IG51bGwpIHJldHVyblxuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDAgfHwgbiA+PSBsYXlvdXQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IGluZGV4ICR7bn0gb3V0IG9mIGJvdW5kcyBmb3IgbGVuZ3RoICR7bGF5b3V0Lmxlbmd0aH1gKVxufVxuY29uc3QgY2hlY2tNb3ZlQm91bmRzID0gKGxheW91dDogQXJyYXlMYXlvdXQsIHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPikgPT4ge1xuICBjb25zdCB2YWx1ZXMgPSBbY29uc3RJMzIodGFyZ2V0KSwgY29uc3RJMzIoc291cmNlKSwgY29uc3RJMzIoY291bnQpXVxuICBpZiAodmFsdWVzLnNvbWUodmFsdWUgPT4gdmFsdWUgPT0gbnVsbCkpIHJldHVyblxuICBjb25zdCBbdG8sIGZyb20sIHNpemVdID0gdmFsdWVzIGFzIG51bWJlcltdXG4gIGlmICh0byEgPCAwIHx8IGZyb20hIDwgMCB8fCBzaXplISA8IDAgfHwgdG8hICsgc2l6ZSEgPiBsYXlvdXQubGVuZ3RoIHx8IGZyb20hICsgc2l6ZSEgPiBsYXlvdXQubGVuZ3RoKVxuICAgIHRocm93IG5ldyBFcnJvcihgQXJyYXkgbW92ZSAoJHt0b30sICR7ZnJvbX0sICR7c2l6ZX0pIG91dCBvZiBib3VuZHMgZm9yIGxlbmd0aCAke2xheW91dC5sZW5ndGh9YClcbn1cblxuY29uc3QgbWFrZUNvbXBpbGVyID0gKFxuICBmaXg6IE1hcDxBbnlGdW5jLCBudW1iZXI+LCBsaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj4sIGFycmF5czogTWFwPEFueUFycmF5LCBBcnJheUxheW91dD4sXG4gIHRyYXBzOiBNYXA8c3RyaW5nLCBudW1iZXI+LCBsb2dzOiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuKSA9PiB7XG5jb25zdCBjb21waWxlRXhwciA9IChlOiBBbnlFeHByKTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKGUua2luZCkge1xuICAgIGNhc2UgXCJjb25zdFwiOlxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJpMzJcIikgcmV0dXJuIFsweDQxLCAuLi5zTihlLnZhbHVlIGFzIG51bWJlciwgMzIpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJpNjRcIikgcmV0dXJuIFsweDQyLCAuLi5zTihlLnZhbHVlLCA2NCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImYzMlwiKSByZXR1cm4gWzB4NDMsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA0KV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZjY0XCIpIHJldHVybiBbMHg0NCwgLi4uZk4oZS52YWx1ZSBhcyBudW1iZXIsIDgpXVxuICAgICAgcmV0dXJuIGRpZShlKVxuICAgIGNhc2UgXCJsb2NhbC5nZXRcIjpcbiAgICAgIHJldHVybiBbMHgyMCwgLi4udTMyKGxpeFtlLmxvY2FsXSEpXVxuICAgIGNhc2UgXCJiaW5cIjoge1xuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0KSwgb3Bjb2RlKGUub3AsIGUudHlwZSldXG4gICAgfVxuICAgIGNhc2UgXCJjbXBcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0KSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCksIG9wY29kZShlLm9wLCBlLmlucHV0VHlwZSldXG4gICAgY2FzZSBcImNhbGxcIjpcbiAgICAgIHJldHVybiBbLi4uZmxhdE1hcChlLmFyZ3MsIGNvbXBpbGVFeHByKSwgMHgxMCwgLi4udTMyKGZpeC5nZXQoZS50YXJnZXQpISArIDIpXVxuICAgIGNhc2UgXCJjYXN0XCI6IHtcbiAgICAgIGNvbnN0IGZyb20gPSBlLmlucHV0VHlwZSBhcyBOdW1UeXBlXG4gICAgICBjb25zdCB0byA9IGUudHlwZSBhcyBOdW1UeXBlXG4gICAgICBsZXQgb3Bjb2RlOiBudW1iZXIgfCB1bmRlZmluZWRcbiAgICAgIGlmICh0byA9PT0gXCJpMzJcIiAmJiBmcm9tID09PSBcImk2NFwiKSBvcGNvZGUgPSAweGE3XG4gICAgICBpZiAodG8gPT09IFwiaTY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gZS51bnNpZ25lZCA/IDB4YWQgOiAweGFjXG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiMlxuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjRcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGI2XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiN1xuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjlcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImYzMlwiKSBvcGNvZGUgPSAweGJiXG4gICAgICBpZiAob3Bjb2RlID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY2FzdCAke2Zyb219IC0+ICR7dG99YClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS52YWx1ZSksIG9wY29kZV1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUuY29uZCksIDB4MDQsIGNvZGVzLnR5cGVbZS50eXBlIGFzIE51bVR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4pLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQoZS5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtlLmFycmF5fWApXG4gICAgICBjaGVja0FycmF5Qm91bmRzKGxheW91dCwgZS5pbmRleClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIGUuaW5kZXgsIGUuc3RyaWRlLCBlLm9mZnNldCkpLCBjb2Rlcy5sb2FkW2Uuc3RvcmFnZSBhcyBNZW1vcnlUeXBlXSwgLi4ubWVtYXJnKGUuc3RvcmFnZSBhcyBNZW1vcnlUeXBlKV1cbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUoZSlcbiAgfVxufVxuXG50eXBlIExhYmVsRnJhbWUgPSB7IGNvbnRyb2w/OiBudW1iZXIsIGtpbmQ/OiBcImJyZWFrXCIgfCBcImNvbnRpbnVlXCIgfVxuY29uc3QgZGVwdGggPSAoc3RhY2s6IExhYmVsRnJhbWVbXSwgY29udHJvbDogbnVtYmVyLCBraW5kOiBOb25OdWxsYWJsZTxMYWJlbEZyYW1lW1wia2luZFwiXT4pID0+IHtcbiAgY29uc3QgaSA9IHN0YWNrLmZpbmRJbmRleCh4ID0+IHguY29udHJvbCA9PT0gY29udHJvbCAmJiB4LmtpbmQgPT09IGtpbmQpXG4gIGlmIChpIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duICR7a2luZH0gdGFyZ2V0ICR7Y29udHJvbH1gKVxuICByZXR1cm4gaVxufVxuXG5jb25zdCBjb21waWxlU3RtdCA9IChzOiBTdG10LCBzdGFjazogTGFiZWxGcmFtZVtdID0gW10pOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAocy5raW5kKSB7XG4gICAgY2FzZSBcImxvY2FsLnNldFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgMHgyMSwgLi4udTMyKGxpeFtzLmxvY2FsXSEpXVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KHMuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tBcnJheUJvdW5kcyhsYXlvdXQsIHMuaW5kZXgpXG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLmluZGV4LCBzLnN0cmlkZSwgcy5vZmZzZXQpKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIGNvZGVzLnN0b3JlW3MudHlwZV0sIC4uLm1lbWFyZyhzLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiYXJyYXkubW92ZVwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KHMuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tNb3ZlQm91bmRzKGxheW91dCwgcy50YXJnZXQsIHMuc291cmNlLCBzLmNvdW50KVxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIHMudGFyZ2V0KSksXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLnNvdXJjZSkpLFxuICAgICAgICAuLi5jb21waWxlRXhwcihzLmNvdW50Lm11bChsYXlvdXQuZWxlbWVudFNpemUpKSxcbiAgICAgICAgMHhmYywgMHgwYSwgMHgwMCwgMHgwMCxcbiAgICAgIF1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMuY29uZCksIDB4MDQsIDB4NDAsIC4uLmZsYXRNYXAocy50aGVuLCB4ID0+IGNvbXBpbGVTdG10KHgsIFt7fSwgLi4uc3RhY2tdKSksIC4uLihzLmVsc2UubGVuZ3RoID8gWzB4MDUsIC4uLmZsYXRNYXAocy5lbHNlLCB4ID0+IGNvbXBpbGVTdG10KHgsIFt7fSwgLi4uc3RhY2tdKSldIDogW10pLCAweDBiXVxuICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgcmV0dXJuIFsweDAyLCAweDQwLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiYnJlYWtcIiB9LCAuLi5zdGFja10pKSwgMHgwYl1cbiAgICBjYXNlIFwibG9vcFwiOlxuICAgICAgcmV0dXJuIFsweDAyLCAweDQwLCAweDAzLCAweDQwLCAuLi5jb21waWxlRXhwcihzLmNvbmQpLCAweDQ1LCAweDBkLCAuLi51MzIoMSksIC4uLmZsYXRNYXAocy5ib2R5LCB4ID0+IGNvbXBpbGVTdG10KHgsIFt7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJjb250aW51ZVwiIH0sIHsgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGMsIC4uLnUzMigwKSwgMHgwYiwgMHgwYl1cbiAgICBjYXNlIFwiYnJlYWtcIjpcbiAgICAgIGlmIChzLnRhcmdldCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJicmVha1RvKCkgdXNlZCBvdXRzaWRlIGEgYmxvY2sgb3IgbG9vcFwiKVxuICAgICAgcmV0dXJuIFsweDBjLCAuLi51MzIoZGVwdGgoc3RhY2ssIHMudGFyZ2V0LCBcImJyZWFrXCIpKV1cbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIGlmIChzLnRhcmdldCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJjb250aW51ZVRvKCkgdXNlZCBvdXRzaWRlIGEgbG9vcFwiKVxuICAgICAgcmV0dXJuIFsweDBjLCAuLi51MzIoZGVwdGgoc3RhY2ssIHMudGFyZ2V0LCBcImNvbnRpbnVlXCIpKV1cbiAgICBjYXNlIFwicmV0dXJuXCI6XG4gICAgICByZXR1cm4gWy4uLihzLnZhbHVlID8gY29tcGlsZUV4cHIocy52YWx1ZSkgOiBbXSksIDB4MGZdXG4gICAgY2FzZSBcInRyYXBcIjpcbiAgICAgIHJldHVybiBbMHg0MSwgLi4uc04odHJhcHMuZ2V0KHMubWVzc2FnZSkhLCAzMiksIDB4MTAsIDB4MDBdXG4gICAgY2FzZSBcImxvZ1wiOlxuICAgICAgcmV0dXJuIFsweDQxLCAuLi5zTihsb2dzLmdldChzLm1lc3NhZ2UpISwgMzIpLCAuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgMHgxMCwgMHgwMV1cbiAgICBjYXNlIFwiY2FsbC52b2lkXCI6XG4gICAgICByZXR1cm4gWy4uLmZsYXRNYXAocy5hcmdzLCBjb21waWxlRXhwciksIDB4MTAsIC4uLnUzMihmaXguZ2V0KHMudGFyZ2V0KSEgKyAyKV1cbiAgICBjYXNlIFwiZXhwclwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmV4cHIpLCAweDFhXVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKHMpXG4gIH1cbn1cbnJldHVybiB7IGV4cHI6IGNvbXBpbGVFeHByLCBzdG10OiBjb21waWxlU3RtdCB9XG59XG5cblxuZXhwb3J0IGNvbnN0IGVtaXRNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4oeyBmRW50cmllcywgYnVpbHRGdW5jcywgZml4LCBsYXlvdXRzLCB0cmFwTWVzc2FnZXMsIGxvZ01lc3NhZ2VzLCBwYWdlcyB9OiBNb2R1bGVBbmFseXNpczxUPikgPT4ge1xuICBjb25zdCB0cmFwcyA9IG5ldyBNYXAodHJhcE1lc3NhZ2VzLm1hcCgobWVzc2FnZSwgaWQpID0+IFttZXNzYWdlLCBpZF0pKVxuICBjb25zdCBsb2dzID0gbmV3IE1hcChsb2dNZXNzYWdlcy5tYXAoKG1lc3NhZ2UsIGlkKSA9PiBbbWVzc2FnZSwgaWRdKSlcbiAgY29uc3QgZnVuY3Rpb25TZWN0aW9uID0gYnVpbHRGdW5jcy5mbGF0TWFwKChfLCBpKSA9PiB1MzIoaSArIDIpKVxuICBjb25zdCBleHBvcnRTZWN0aW9uID0gZkVudHJpZXMuZmxhdE1hcCgoW25hbWUsIGZ1bmNdKSA9PiBbLi4uc3RyKG5hbWUpLCAweDAwLCAuLi51MzIoZml4LmdldChmdW5jKSEgKyAyKV0pXG4gIHJldHVybiBuZXcgVWludDhBcnJheShbXG4gICAgLi4ubWFnaWMsXG4gICAgLi4uc2VjdGlvbigweDAxLCBbLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoICsgMiksXG4gICAgICAweDYwLCAweDAxLCBjb2Rlcy50eXBlLmkzMiwgMHgwMCxcbiAgICAgIDB4NjAsIDB4MDIsIGNvZGVzLnR5cGUuaTMyLCBjb2Rlcy50eXBlLmkzMiwgMHgwMCxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYyB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlc3VsdFR5cGUoZnVuYy5yZXN1bHQpXG4gICAgICAgIHJldHVybiBbMHg2MCwgLi4udTMyKGZ1bmMucGFyYW1zLmxlbmd0aCksIC4uLmZ1bmMucGFyYW1zLm1hcCh0ID0+IGNvZGVzLnR5cGVbdF0pLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFsweDAwXSA6IFsweDAxLCBjb2Rlcy50eXBlW3Jlc3VsdF1dKV1cbiAgICAgIH0pXSksXG4gICAgLi4uc2VjdGlvbigweDAyLCBbXG4gICAgICAweDAzLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwidHJhcFwiKSxcbiAgICAgIDB4MDAsXG4gICAgICAweDAwLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwibG9nXCIpLFxuICAgICAgMHgwMCxcbiAgICAgIDB4MDEsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJtZW1vcnlcIiksXG4gICAgICAweDAyLFxuICAgICAgMHgwMyxcbiAgICAgIC4uLnUzMihwYWdlcyksXG4gICAgICAuLi51MzIocGFnZXMpLFxuICAgIF0pLFxuICAgIC4uLnNlY3Rpb24oMHgwMywgWy4uLnUzMihidWlsdEZ1bmNzLmxlbmd0aCksIC4uLmZ1bmN0aW9uU2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwNywgWy4uLnUzMihmRW50cmllcy5sZW5ndGgpLCAuLi5leHBvcnRTZWN0aW9uXSksXG4gICAgLi4uc2VjdGlvbigweDBhLCBbXG4gICAgICAuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGgpLFxuICAgICAgLi4uZmxhdE1hcChidWlsdEZ1bmNzLCAoeyBmdW5jLCBidWlsdCwgbG9jYWxzLCBsb2NhbEluZGV4ZXMgfSkgPT4ge1xuICAgICAgICBjb25zdCBjb21waWxlciA9IG1ha2VDb21waWxlcihmaXgsIGxvY2FsSW5kZXhlcywgbGF5b3V0cywgdHJhcHMsIGxvZ3MpXG4gICAgICAgIGNvbnN0IHN0bXRzID0gYXNTdG10cyhidWlsdClcbiAgICAgICAgY29uc3QgZGVjbHMgPSBbLi4udTMyKGxvY2Fscy5sZW5ndGgpLCAuLi5mbGF0TWFwKGxvY2FscywgKFssIHR5cGVdKSA9PiBbLi4udTMyKDEpLCBjb2Rlcy50eXBlW3R5cGVdXSldXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlc3VsdFR5cGUoZnVuYy5yZXN1bHQpXG4gICAgICAgIGNvbnN0IGNvZGUgPSBzdG10c1xuICAgICAgICAgID8gWy4uLmZsYXRNYXAoc3RtdHMsIHMgPT4gY29tcGlsZXIuc3RtdChzKSksIC4uLihyZXN1bHQgPT09IFwidm9pZFwiID8gW10gOiBjb2Rlcy56ZXJvW3Jlc3VsdF0pXVxuICAgICAgICAgIDogY29tcGlsZXIuZXhwcihidWlsdCBhcyBBbnlFeHByKVxuICAgICAgICBjb25zdCBib2R5ID0gWy4uLmRlY2xzLCAuLi5jb2RlLCAweDBiXVxuICAgICAgICByZXR1cm4gWy4uLnUzMihib2R5Lmxlbmd0aCksIC4uLmJvZHldXG4gICAgICB9KSxcbiAgICBdKSxcbiAgXSlcbn1cbiIsCiAgICAiZXhwb3J0ICogZnJvbSBcIi4vYXN0XCJcbmV4cG9ydCB7IGZvcm1hdE1vZHVsZSB9IGZyb20gXCIuL2Zvcm1hdFwiXG5cbmltcG9ydCB7IGFuYWx5emVNb2R1bGUgfSBmcm9tIFwiLi9hbmFseXplXCJcbmltcG9ydCB7IGVtaXRNb2R1bGUgfSBmcm9tIFwiLi9jb2RlZ2VuXCJcbmltcG9ydCB0eXBlIHtcbiAgQW55QXJyYXksIEFueUZ1bmMsIENvbXBpbGVSZXN1bHQsIEpTU3RydWN0LCBNb2R1bGVEZWYsIFN0cnVjdEZpZWxkcywgU3RydWN0VHlwZSxcbn0gZnJvbSBcIi4vYXN0XCJcblxuY29uc3QgYXJyYXlDdG9ycyA9IHtcbiAgaTg6IEludDhBcnJheSwgdTg6IFVpbnQ4QXJyYXksIGkxNjogSW50MTZBcnJheSwgdTE2OiBVaW50MTZBcnJheSxcbiAgaTMyOiBJbnQzMkFycmF5LCBpNjQ6IEJpZ0ludDY0QXJyYXksIGYzMjogRmxvYXQzMkFycmF5LCBmNjQ6IEZsb2F0NjRBcnJheSxcbiAgc3U4OiBVaW50OEFycmF5LCBzdTE2OiBVaW50MTZBcnJheSwgc2kzMjogVWludDMyQXJyYXksIHNpNjQ6IEJpZ1VpbnQ2NEFycmF5LFxufVxuXG5leHBvcnQgY29uc3QgZGVjb2RlU3RydWN0ID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHJhdzogbnVtYmVyIHwgYmlnaW50KTogSlNTdHJ1Y3Q8Rj4gPT4ge1xuICBjb25zdCBwYWNrZWQgPSBCaWdJbnQuYXNVaW50Tih0eXBlLnNpemUgKiA4LCBCaWdJbnQocmF3KSlcbiAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyh0eXBlLmxheW91dCkubWFwKChbbmFtZSwgZmllbGRdKSA9PiB7XG4gICAgY29uc3QgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICBsZXQgdmFsdWUgPSAocGFja2VkID4+IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpKSAmIG1hc2tcbiAgICBpZiAoZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiB2YWx1ZSAmICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cyAtIDEpKSlcbiAgICAgIHZhbHVlIC09IDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzKVxuICAgIHJldHVybiBbbmFtZSwgZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IHZhbHVlIDogTnVtYmVyKHZhbHVlKV1cbiAgfSkpIGFzIEpTU3RydWN0PEY+XG59XG5cbmV4cG9ydCBjb25zdCBjb21waWxlID0gYXN5bmMgPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KFxuICBtb2Q6IFQsXG4pOiBQcm9taXNlPENvbXBpbGVSZXN1bHQ8VD4+ID0+IHtcbiAgY29uc3QgYW5hbHlzaXMgPSBhbmFseXplTW9kdWxlKG1vZClcbiAgY29uc3QgbWVtb3J5ID0gbmV3IFdlYkFzc2VtYmx5Lk1lbW9yeSh7XG4gICAgaW5pdGlhbDogYW5hbHlzaXMucGFnZXMsXG4gICAgbWF4aW11bTogYW5hbHlzaXMucGFnZXMsXG4gICAgc2hhcmVkOiB0cnVlLFxuICB9KVxuICBjb25zdCBjb21waWxlZCA9IGF3YWl0IFdlYkFzc2VtYmx5LmNvbXBpbGUoZW1pdE1vZHVsZShhbmFseXNpcykuYnVmZmVyKVxuICBjb25zdCB0cmFwID0gKGlkOiBudW1iZXIpOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihhbmFseXNpcy50cmFwTWVzc2FnZXNbaWRdID8/IGBVbmtub3duIFdBU00gdHJhcCAke2lkfWApIH1cbiAgY29uc3QgbG9nID0gKGlkOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IGNvbnNvbGUubG9nKGFuYWx5c2lzLmxvZ01lc3NhZ2VzW2lkXSA/PyBgV0FTTSBsb2cgJHtpZH1gLCB2YWx1ZSlcbiAgY29uc3QgaW5zdGFuY2UgPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShjb21waWxlZCwgeyBlbnY6IHsgbWVtb3J5LCB0cmFwLCBsb2cgfSB9KVxuICBjb25zdCBmdW5jRW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGFuYWx5c2lzLmZ1bmNzKSBhcyBbc3RyaW5nLCBBbnlGdW5jXVtdXG4gIGNvbnN0IGpzRnVuY3M6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge30sIHJlc3VsdFN0cnVjdHM6IFJlY29yZDxzdHJpbmcsIFN0cnVjdFR5cGU8YW55Pj4gPSB7fVxuICBmb3IgKGNvbnN0IFtuYW1lLCBmdW5jXSBvZiBmdW5jRW50cmllcykge1xuICAgIGNvbnN0IHdhc21GdW5jID0gaW5zdGFuY2UuZXhwb3J0c1tuYW1lXSBhcyAoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIgfCBiaWdpbnRcbiAgICBqc0Z1bmNzW25hbWVdID0gd2FzbUZ1bmNcbiAgICBpZiAodHlwZW9mIGZ1bmMucmVzdWx0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICByZXN1bHRTdHJ1Y3RzW25hbWVdID0gZnVuYy5yZXN1bHRcbiAgICAgIGpzRnVuY3NbbmFtZV0gPSAoLi4uYXJnczogdW5rbm93bltdKSA9PiBkZWNvZGVTdHJ1Y3QoZnVuYy5yZXN1bHQgYXMgU3RydWN0VHlwZTxhbnk+LCB3YXNtRnVuYyguLi5hcmdzKSlcbiAgICB9XG4gIH1cbiAgY29uc3QganNBcnJheXMgPSAoT2JqZWN0LmVudHJpZXMoYW5hbHlzaXMuYXJyYXlzKSBhcyBbc3RyaW5nLCBBbnlBcnJheV1bXSkubWFwKChbbmFtZSwgYXJyXSkgPT4ge1xuICAgIGNvbnN0IGxheW91dCA9IGFuYWx5c2lzLmxheW91dHMuZ2V0KGFycikhXG4gICAgY29uc3Qga2V5ID0gdHlwZW9mIGFyci50eXBlID09PSBcInN0cmluZ1wiID8gYXJyLnR5cGUgOiBgcyR7YXJyLnR5cGUuc3RvcmFnZX1gXG4gICAgY29uc3QgQ3RvciA9IGFycmF5Q3RvcnNba2V5IGFzIGtleW9mIHR5cGVvZiBhcnJheUN0b3JzXVxuICAgIHJldHVybiBbbmFtZSwgbmV3IEN0b3IobWVtb3J5LmJ1ZmZlciwgbGF5b3V0Lm9mZnNldCwgYXJyLmxlbmd0aCldIGFzIGNvbnN0XG4gIH0pXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGpzRnVuY3MsIE9iamVjdC5mcm9tRW50cmllcyhqc0FycmF5cyksIHtcbiAgICBtb2Q6IGNvbXBpbGVkLCBtZW1vcnksIHJlc3VsdFN0cnVjdHMsXG4gICAgdHJhcE1lc3NhZ2VzOiBhbmFseXNpcy50cmFwTWVzc2FnZXMsIGxvZ01lc3NhZ2VzOiBhbmFseXNpcy5sb2dNZXNzYWdlcyxcbiAgfSkgYXMgQ29tcGlsZVJlc3VsdDxUPlxufVxuIiwKICAgICJpbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgeyBhcnJheSwgY29tcGlsZSwgZnVuYywgaTMyLCBpZkVsc2UsIGxpdCwgbG9jYWwsIGxvZywgbG9vcCwgcmV0LCBzdHJ1Y3QsIHRyYXAsIHVtb2QsIHR5cGUgQW55QXJyYXksIHR5cGUgQXJyYXlIYW5kbGUsIHR5cGUgRFR5cGUsIHR5cGUgRXhwciwgdHlwZSBFeHByTGlrZSwgdHlwZSBTdG10LCB0eXBlIFN0bXRCb2R5IH0gZnJvbSBcIi4uL3dhc21cIlxuaW1wb3J0IHR5cGUgeyBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIlxuXG5jb25zdCBOV09SS0VSUyA9IDRcbmNvbnN0IFJBTkRTVFJJREUgPSAxNlxuXG5sZXQgREVCVUcgPSB0cnVlXG5cbmZ1bmN0aW9uIGRlYnVnICh0YWc6IHN0cmluZywgdmFsdWU6IEV4cHJMaWtlPFwiaTMyXCI+KXtcbiAgaWYgKCFERUJVRykgcmV0dXJuIFtdXG4gIHJldHVybiBbIGxvZyh0YWcsIHZhbHVlKSBdXG59XG5cbmZ1bmN0aW9uIGNoZWNrZWRBcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBjb25zdCBhcnIgPSBhcnJheSh0eXBlLCBsZW5ndGgpIGFzIEFueUFycmF5XG4gIGlmICghREVCVUcpIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cblxuICBjb25zdCB7YXQsIG1vdmV9ID0gYXJyXG4gIGNvbnN0IGNoZWNrSWR4ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChpLG4pPT4gaWZFbHNlKFxuICAgICAgaS5sdCgwKS5vcihuLmx0KDApKS5vciAobi5hZGQoaSkuZ3QoYXJyLmxlbmd0aCkpLFxuICAgICAgdHJhcCggXCJhcnJheSBib3VuZHMgZXhjZWVkZWRcIiksXG4gICAgICByZXQoaSlcbiAgICApXG4gICk7XG4gIGFyci5hdCA9IGluZGV4ID0+IGF0KGNoZWNrSWR4LmNhbGwoaW5kZXgsIDApKVxuICBhcnIubW92ZSA9ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+IG1vdmUoXG4gICAgY2hlY2tJZHguY2FsbCh0YXJnZXQsIGNvdW50KSxcbiAgICBjaGVja0lkeC5jYWxsKHNvdXJjZSwgY291bnQpLFxuICAgIGNvdW50LFxuICApXG4gIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cbn1cblxuZnVuY3Rpb24gZm9yTihuOiBudW1iZXIsIGJvZHk6IChpOiBFeHByPFwiaTMyXCI+KSA9PiBTdG10Qm9keSk6IFN0bXRCb2R5IHtcbiAgY29uc3QgaSA9IGxvY2FsKFwiaTMyXCIpXG4gIHJldHVybiBsb29wKCBpLmx0KG4pLFtib2R5KGkpLCBpLnNldChpLmFkZCgxKSldLClcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFubmVhbGluZ1dhc20ocGxhbm5lcjogTW9kdWxlKTogUHJvbWlzZTxBbm5lYWxpbmdSZXN1bHQ+IHtcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKHBsYW5uZXIuTlJFUVMgLyBwbGFubmVyLk5UUkFOUyAqIDIuNSAqIDIgKyAxMClcbiAgY29uc3QgU1RPUCA9IHN0cnVjdCh7XG4gICAgcmVxX2lkOiBbXCJ1MTZcIiwgMTBdLFxuICAgIGlzX2xvYWQ6IFtcInU4XCIsIDFdLFxuICAgIGRlY2s6IFtcInU4XCIsIDFdLFxuICB9KVxuICBjb25zdCBSRVEgPSBzdHJ1Y3Qoe1xuICAgIHN0YXJ0OiBcInUxNlwiLFxuICAgIGVuZDogXCJ1MTZcIixcbiAgICB2YWx1ZTogXCJ1MTZcIixcbiAgICBkZWFkbGluZTogXCJ1MTZcIixcbiAgfSlcblxuICBjb25zdCByYW5kU3RhdGUgICAgICA9IGNoZWNrZWRBcnJheShcImkzMlwiLCBOV09SS0VSUyAqIFJBTkRTVFJJREUpXG4gIGNvbnN0IGRpc3RzICAgICAgICAgID0gY2hlY2tlZEFycmF5KFwiaTMyXCIsIHBsYW5uZXIuUlNJWkUpXG4gIGNvbnN0IHJlcXVlc3RzICAgICAgID0gY2hlY2tlZEFycmF5KFJFUSwgcGxhbm5lci5OUkVRUylcbiAgY29uc3QgYXNzaWduZWQgICAgICAgPSBjaGVja2VkQXJyYXkoXCJ1OFwiLCBwbGFubmVyLk5SRVFTKVxuICBjb25zdCBzY2hlZHVsZSAgICAgICA9IGNoZWNrZWRBcnJheShTVE9QLCBwbGFubmVyLk5UUkFOUyAqIFRTSVpFKVxuICBjb25zdCBzY2hlZF9zaXplICAgICA9IGNoZWNrZWRBcnJheShcImkxNlwiLCBwbGFubmVyLk5UUkFOUylcbiAgY29uc3QgdHJhbl9wb3NpdGlvbnMgPSBjaGVja2VkQXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG5cbiAgY29uc3QgcmFuZE5leHQgPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgZ2lkID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgcmV0dXJuIFtcbiAgICAgIHZhbHVlLnNldChyYW5kU3RhdGUuYXQoZ2lkLm11bChSQU5EU1RSSURFKSkpLFxuICAgICAgdmFsdWUuc2V0KHZhbHVlLnhvcih2YWx1ZS5zaGwoMTMpKSksXG4gICAgICB2YWx1ZS5zZXQodmFsdWUueG9yKHZhbHVlLnNocigxNykpKSxcbiAgICAgIHZhbHVlLnNldCh2YWx1ZS54b3IodmFsdWUuc2hsKDUpKSksXG4gICAgICByYW5kU3RhdGUuYXQoZ2lkLm11bChSQU5EU1RSSURFKSkuc2V0KHZhbHVlKSxcbiAgICAgIHJldCh2YWx1ZSksXG4gICAgXVxuICB9KVxuICBjb25zdCByYW5kaW50ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChnaWQsIG1heCkgPT4gdW1vZChyYW5kTmV4dC5jYWxsKGdpZCksIG1heCkpXG5cbiAgY29uc3QgdHJ5QXNzaWduID0gZnVuYyhbXSwgXCJ2b2lkXCIsICgpID0+IHtcbiAgICBjb25zdCB0cmFuID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCByZXFfaWQgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IEEgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IEIgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHRtcCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdHNpemUgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHRvZmZzZXQgPSBsb2NhbChcImkzMlwiKVxuXG4gICAgY29uc3Qgc2NoZWRWaWV3ID0ge1xuICAgICAgbW92ZTogKHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPik6IFN0bXRCb2R5ID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUodG9mZnNldC5hZGQodGFyZ2V0KSwgdG9mZnNldC5hZGQoc291cmNlKSwgY291bnQpLFxuICAgICAgYXQ6IChpbmRleDogRXhwcjxcImkzMlwiPikgPT4gc2NoZWR1bGUuYXQodG9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgdHJhbi5zZXQocmFuZGludC5jYWxsKDAsIHBsYW5uZXIuTlRSQU5TKSksXG4gICAgICByZXFfaWQuc2V0KHJhbmRpbnQuY2FsbCgwLCBwbGFubmVyLk5SRVFTKSksXG4gICAgICBpZkVsc2UoYXNzaWduZWQuYXQocmVxX2lkKS5lcSgxKSwgcmV0KCksIGFzc2lnbmVkLmF0KHJlcV9pZCkuc2V0KDEpKSxcbiAgICAgIHRvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICB0c2l6ZS5zZXQoc2NoZWRfc2l6ZS5hdCh0cmFuKSksXG4gICAgICBpZkVsc2UodHNpemUuZ3QoVFNJWkUgLSAyKSwgdHJhcChcInNjaGVkdWxlIGNhcGFjaXR5IGV4Y2VlZGVkXCIpKSxcbiAgICAgIEEuc2V0KHJhbmRpbnQuY2FsbCgwLCB0c2l6ZS5hZGQoMSkpKSxcbiAgICAgIEIuc2V0KHJhbmRpbnQuY2FsbCgwLCB0c2l6ZS5hZGQoMSkpKSxcbiAgICAgIGlmRWxzZShBLmd0KEIpLCBbdG1wLnNldChBKSwgQS5zZXQoQiksIEIuc2V0KHRtcCldKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIuYWRkKDIpLCBCLCB0c2l6ZS5zdWIoQikpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQS5hZGQoMSksIEEsIEIuc3ViKEEpKSxcbiAgICAgIHRtcC5zZXQocmFuZGludC5jYWxsKDAsIDIpKSxcbiAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQsIGlzX2xvYWQ6IDEsIGRlY2s6IHRtcCB9KSxcbiAgICAgIHNjaGVkVmlldy5hdChCLmFkZCgxKSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAwLCBkZWNrOiB0bXAgfSksXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5hZGQoMikpLFxuICAgIF1cbiAgfSlcblxuICBjb25zdCByYXRlVHJhbiA9IGZ1bmMoW1wiaTMyXCJdLCBcImkzMlwiLCB0cmFuID0+IHtcblxuICAgIFxuXG4gICAgcmV0dXJuIFtcblxuICAgIF1cblxuICB9KVxuXG5cblxuICBjb25zdCBhZGRSZXF1ZXN0ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIiwgXCJpMzJcIiwgXCJpMzJcIiwgXCJpMzJcIl0sIFwidm9pZFwiLFxuICAgIChyZXFuLCBzdGFydCwgZW5kLCB2YWx1ZSwgZGVhZGxpbmUpID0+XG4gICAgICByZXF1ZXN0cy5hdChyZXFuKS5zZXQoeyBzdGFydCwgZW5kLCB2YWx1ZSwgZGVhZGxpbmUgfSksXG4gIClcblxuICBjb25zdCBzZWFyY2ggPSBmdW5jKFtdLCBcInZvaWRcIiwgKCkgPT4gW1xuICAgIGRlYnVnKFwiZGVidWdnZXIgb24uXCIsIDApLFxuICAgIGZvck4oMTAwLCBpPT4gdHJ5QXNzaWduLmNhbGwoKSlcbiAgXSlcbiAgY29uc3QgZ2V0U3RvcCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBTVE9QLFxuICAgICh0cmFuLCBpbmRleCkgPT4gc2NoZWR1bGUuYXQodHJhbi5tdWwoVFNJWkUpLmFkZChpbmRleCkpLFxuICApXG5cbiAgY29uc3Qgd2FzbSA9IGF3YWl0IGNvbXBpbGUoe1xuICAgIGFkZFJlcXVlc3QsXG4gICAgYXNzaWduZWQsXG4gICAgZGlzdHMsXG4gICAgZ2V0U3RvcCxcbiAgICByYW5kU3RhdGUsXG4gICAgc2NoZWR1bGUsXG4gICAgc2VhcmNoLFxuICAgIHNjaGVkX3NpemUsXG4gICAgdHJhbl9wb3NpdGlvbnMsXG4gIH0pXG5cbiAgd2FzbS5kaXN0cy5zZXQocGxhbm5lci5yb2FkbWFwLkNvc3RNYXRyaXgpXG4gIHdhc20ucmFuZFN0YXRlLnNldChBcnJheS5mcm9tKHsgbGVuZ3RoOiBOV09SS0VSUyAqIDIgfSwgKF8sIGkpID0+IGkgKyAxKSlcbiAgd2FzbS50cmFuX3Bvc2l0aW9ucy5zZXQocGxhbm5lci5zdGFydHBvc2l0aW9ucylcbiAgcGxhbm5lci5yZXF1ZXN0cy5mb3JFYWNoKChyZXF1ZXN0LCBpKSA9PlxuICAgIHdhc20uYWRkUmVxdWVzdChpLCByZXF1ZXN0LnN0YXJ0UG9pbnQsIHJlcXVlc3QuZW5kUG9pbnQsIHJlcXVlc3QudmFsdWVfZXVyLCByZXF1ZXN0LmRlYWRsaW5lX2gpLFxuICApXG5cbiAgY29uc3Qgc3RhcnRlZEF0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgd2FzbS5zZWFyY2goKVxuICBjb25zdCBlbGFwc2VkTXMgPSBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0ZWRBdFxuICBjb25zdCByZXN1bHRTY2hlZHVsZSA9IG5ldyBVaW50MzJBcnJheShwbGFubmVyLk5UUkFOUyAqIFRTSVpFKVxuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHBsYW5uZXIuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdhc20uc2NoZWRfc2l6ZVt0cmFuXSE7IGkrKykge1xuICAgICAgY29uc3Qgc3RvcCA9IHdhc20uZ2V0U3RvcCh0cmFuLCBpKVxuICAgICAgcmVzdWx0U2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaV0gPSBzdG9wLmlzX2xvYWQgfCBzdG9wLmRlY2sgPDwgMSB8IHN0b3AucmVxX2lkIDw8IDJcbiAgICB9XG4gIH1cbiAgY29uc3QgdW5hc3NpZ25lZCA9IG5ldyBJbnQ4QXJyYXkocGxhbm5lci5OUkVRUylcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmFzc2lnbmVkLmxlbmd0aDsgaSsrKSB1bmFzc2lnbmVkW2ldID0gd2FzbS5hc3NpZ25lZFtpXSA/IDAgOiAxXG4gIGNvbnN0IHNjaGVkdWxlUmF0aW5ncyA9IG5ldyBJbnQzMkFycmF5KHBsYW5uZXIuTlRSQU5TKVxuXG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHJlc3VsdFNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IG5ldyBVaW50MTZBcnJheSh3YXNtLnNjaGVkX3NpemUpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpLFxuICAgIFRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiAwLFxuICB9XG59XG4iLAogICAgImltcG9ydCB7IGJ1dHRvbiwgY29sb3IsIGRpdiwgcCwgcG9wdXAsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRoLCB0ciB9IGZyb20gXCIuLi92aWV3L2h0bWxcIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuLi92aWV3L21haW5cIjtcbmltcG9ydCB7IGJhc2VsaW5lQW5uZWFsaW5nLCB0eXBlIEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHsgY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uLCBpbXByb3ZlZEFubmVhbGluZywgdHlwZSBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gfSBmcm9tIFwiLi9hbm5lYWxpbmdfaW1wcm92ZWRcIjtcbmltcG9ydCB7IGFubmVhbGluZ1dhc20gfSBmcm9tIFwiLi9hbm5lYWxpbmdfd2FzbVwiO1xuaW1wb3J0IHsgZ2V0RGVjaywgZ2V0UmVxLCBpc0xvYWQgfSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCBjb25zdCBhdmFpbGFibGVTb2x2ZXJzID0ge1xuICBiYXNlbGluZTogYmFzZWxpbmVBbm5lYWxpbmcsXG4gIGltcHJvdmVkOiBpbXByb3ZlZEFubmVhbGluZyxcbiAgd2FzbTogYW5uZWFsaW5nV2FzbSxcbn0gYXMgY29uc3Q7XG50eXBlIFNvbHZlck5hbWUgPSBrZXlvZiB0eXBlb2YgYXZhaWxhYmxlU29sdmVycztcblxuY29uc3QgSU5JVElBTF9TT0xWRVI6IFNvbHZlck5hbWUgPSBcIndhc21cIjtcbmNvbnN0IEtNX0NPU1QgPSAwLjU7XG5jb25zdCBBVkdfU1BFRURfS01IID0gNjA7XG5jb25zdCBSRU9SR19DT1NUX0VVUiA9IDEwMDtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBsYW5uZXJWaWV3KG1vZDogTW9kdWxlKTogUHJvbWlzZTxIVE1MRWxlbWVudD4ge1xuICBjb25zdCBvdXRlckJvcmRlciA9IFwiMXB4IHNvbGlkIFwiICsgY29sb3IuZ3JheTtcbiAgY29uc3QgaW5uZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmxpZ2h0Z3JheTtcbiAgY29uc3QgY2VsbFBhZGRpbmcgPSBcIi4zNWVtIC41ZW1cIjtcbiAgY29uc3Qgc2NoZWR1bGVDZWxsTWluSGVpZ2h0ID0gXCIyLjFlbVwiO1xuXG4gIGxldCBhbm5lYWxlcjogQW5uZWFsaW5nUmVzdWx0IHwgbnVsbCA9IG51bGw7XG4gIGxldCBhbm5lYWxpbmdTZXNzaW9uOiBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gfCBudWxsID0gbnVsbDtcbiAgbGV0IGFubmVhbGluZ1RpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgbGV0IHJ1bklkID0gMDtcblxuICBmdW5jdGlvbiBpdGVtQnV0dG9uKGl0ZW06IG51bWJlciwgbG9hZD86IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZXEgPSBtb2QucmVxdWVzdHNbaXRlbV0hO1xuICAgIGNvbnN0IHNwID0gc3BhbihcbiAgICAgIGl0ZW0udG9TdHJpbmcoKS5wYWRTdGFydCgzLCBcIiBcIiksXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIGJvcmRlcjogXCIycHggc29saWQgdHJhbnNwYXJlbnRcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi4yZW1cIixcbiAgICAgICAgd2hpdGVTcGFjZTogXCJwcmVcIixcbiAgICAgICAgZm9udEZhbWlseTogXCJtb25vc3BhY2VcIixcbiAgICAgIH0pLFxuICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICBwb3B1cChcbiAgICAgICAgICBwKFwiaXRlbSBcIiwgaXRlbSksXG4gICAgICAgICAgdGFibGUoXG4gICAgICAgICAgICB0cihjZWxsKFwic3RhdHVzXCIpLCBjZWxsKGxvYWQgPyBcImxvYWRcIiA6IGxvYWQgPT09IGZhbHNlID8gXCJ1bmxvYWRcIiA6IFwidW5hc3NpZ25lZFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwidmFsdWVcIiksIGNlbGwocmVxLnZhbHVlX2V1ciArIFwi4oKsXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJkaXN0XCIpLCBjZWxsKG1vZC5yb2FkbWFwLmdldENvc3ROKHJlcS5zdGFydFBvaW50LCByZXEuZW5kUG9pbnQpICsgXCJrbVwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGVhZGxpbmVcIiksIGNlbGwocmVxLmRlYWRsaW5lX2gudG9GaXhlZCgyKSArIFwiaFwiKSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGxldCBwb2ludHMgPSBbXG4gICAgICB7IG51bWJlcjogcmVxLnN0YXJ0UG9pbnQsIGxvZ286IFwi8J+TplwiIH0sXG4gICAgICB7IG51bWJlcjogcmVxLmVuZFBvaW50LCBsb2dvOiBcIvCfj6BcIiB9LFxuICAgIF07XG5cbiAgICBpZiAobG9hZCA9PT0gdHJ1ZSkgcG9pbnRzID0gW3BvaW50c1swXSFdO1xuICAgIGlmIChsb2FkID09PSBmYWxzZSkgcG9pbnRzID0gW3BvaW50c1sxXSFdO1xuXG4gICAgc3Aub25tb3VzZWVudGVyID0gKCkgPT4ge1xuICAgICAgc3Auc3R5bGUuYm9yZGVyQ29sb3IgPSBjb2xvci5ncmVlbjtcbiAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHMgfV0pO1xuICAgIH07XG4gICAgc3Aub25tb3VzZWxlYXZlID0gKCkgPT4ge1xuICAgICAgc3Auc3R5bGUuYm9yZGVyQ29sb3IgPSBcInRyYW5zcGFyZW50XCI7XG4gICAgfTtcbiAgICByZXR1cm4gc3A7XG4gIH1cblxuICBjb25zdCBjZWxsOiB0eXBlb2YgdGQgPSAoLi4ueCkgPT4gdGQoc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSwgLi4ueCk7XG4gIGNvbnN0IGNvbnRyb2xzID0gZGl2KHN0eWxlKHsgZGlzcGxheTogXCJmbGV4XCIsIGdhcDogXCIuNWVtXCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIGZsZXhXcmFwOiBcIndyYXBcIiB9KSk7XG4gIGNvbnN0IHNjb3JlTGluZSA9IHAoKTtcbiAgY29uc3QgdGltZUxpbmUgPSBwKCk7XG4gIGNvbnN0IHNvbHZlclNlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIik7XG4gIGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyhhdmFpbGFibGVTb2x2ZXJzKSBhcyBTb2x2ZXJOYW1lW10pIHNvbHZlclNlbGVjdC5hZGQobmV3IE9wdGlvbihuYW1lLCBuYW1lKSk7XG4gIHNvbHZlclNlbGVjdC52YWx1ZSA9IElOSVRJQUxfU09MVkVSO1xuICBjb25zdCBzb2x2ZXJMaW5lID0gcChcInNvbHZlcjogXCIsIHNvbHZlclNlbGVjdCk7XG4gIGNvbnN0IHVuYXNzaWduZWRMaW5lID0gcCgpO1xuICBjb25zdCBkZXRhaWxXcmFwID0gZGl2KCk7XG4gIGNvbnN0IHRhYmxlV3JhcCA9IGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBvdmVyZmxvd1g6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dZOiBcImhpZGRlblwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgIH0pLFxuICApO1xuXG4gIGNvbnN0IHJ1bkJ1dHRvbiA9IGJ1dHRvbihcInN0YXJ0XCIpO1xuICBjb25zdCBoZWF0QnV0dG9uID0gYnV0dG9uKFwiaGVhdCB1cFwiKTtcbiAgbGV0IHJlbmRlckNvdW50ZXIgPSAwO1xuXG4gIGZ1bmN0aW9uIHN0b3BTZWFyY2goKSB7XG4gICAgaWYgKGFubmVhbGluZ1RpbWVyICE9IG51bGwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoYW5uZWFsaW5nVGltZXIpO1xuICAgICAgYW5uZWFsaW5nVGltZXIgPSBudWxsO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0YXJ0XCI7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJUYWJsZSgpIHtcbiAgICBjb25zdCB0YWIgPSB0YWJsZShcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgfSksXG4gICAgICB0cihcbiAgICAgICAgdGgoXCJ0cmFuc3BvcnRlclwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJ2YWx1ZVwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJzdGVwc1wiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICksXG4gICAgICBtb2Quc3RhcnRwb3NpdGlvbnMubWFwKChzdGFydCwgdHJhbikgPT5cbiAgICAgICAgdHIoXG4gICAgICAgICAgdGQoXG4gICAgICAgICAgICB0cmFuLFxuICAgICAgICAgICAgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcG9wdXAoXG4gICAgICAgICAgICAgICAgcChcInRyYW5zcG9ydGVyOiBcIiwgdHJhbiksXG4gICAgICAgICAgICAgICAgcChcInN0YXJ0OiBcIiwgc3RhcnQpLFxuICAgICAgICAgICAgICAgIHAoXCJzY29yZTogXCIsIGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hKSxcbiAgICAgICAgICAgICAgICBwKFwic3RlcHM6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVTaXplc1t0cmFuXSEpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb25tb3VzZWVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50czogW3sgbnVtYmVyOiBzdGFydCwgbG9nbzogXCLwn5qbXCIgfV0gfV0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBvbm1vdXNlbGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW10pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHRkKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiIH0pKSxcbiAgICAgICAgICB0ZChcbiAgICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIFswLCAxXS5tYXAoKGRlY2spID0+XG4gICAgICAgICAgICAgICAgdHIoXG4gICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHsgbGVuZ3RoOiBhbm5lYWxlciEuc2NoZWR1bGVTaXplc1t0cmFuXSEgfSwgKF8sIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IGFubmVhbGVyPy5zY2hlZHVsZVt0cmFuICogYW5uZWFsZXIuVFNJWkUgKyBpXSE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYWQgPSBpc0xvYWQoc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZChcbiAgICAgICAgICAgICAgICAgICAgICBnZXREZWNrKHN0ZXApID09PSBkZWNrID8gaXRlbUJ1dHRvbihnZXRSZXEoc3RlcCksICEhbG9hZCkgOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBsb2FkID8gY29sb3IuYmx1ZSA6IGNvbG9yLmdyZWVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBpbm5lckJvcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjJlbSAuM2VtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogXCIyLjZlbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzY2hlZHVsZUNlbGxNaW5IZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgIGJvcmRlcjogb3V0ZXJCb3JkZXIsXG4gICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjI1ZW1cIixcbiAgICAgICAgICAgICAgdmVydGljYWxBbGlnbjogXCJ0b3BcIixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgICksXG4gICAgICApLFxuICAgICk7XG5cbiAgICB0YWJsZVdyYXAucmVwbGFjZUNoaWxkcmVuKHRhYik7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJTdGF0dXMoKSB7XG4gICAgaWYgKCFhbm5lYWxlcikgcmV0dXJuO1xuICAgIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IGBzY29yZTogJHthbm5lYWxlcj8udG90YWxTY29yZSA/PyAwfWA7XG4gICAgdGltZUxpbmUudGV4dENvbnRlbnQgPSBgc2VhcmNoIHRpbWU6ICR7KGFubmVhbGVyIS5lbGFwc2VkTXMvMTAwMCkudG9GaXhlZCgyKX0gc2A7XG4gICAgdW5hc3NpZ25lZExpbmUucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgXCJ1bmFzc2lnbmVkOiBcIixcbiAgICAgIC4uLkFycmF5LmZyb20oYW5uZWFsZXIhLnVuYXNzaWduZWQpXG4gICAgICAgIC5tYXAoKHgsIGkpID0+ICh7IHgsIGkgfSkpXG4gICAgICAgIC5maWx0ZXIoKHgpID0+IHgueClcbiAgICAgICAgLmZsYXRNYXAoKHgpID0+IFtzcGFuKFwiIFwiKSwgaXRlbUJ1dHRvbih4LmkpXSksXG4gICAgKTtcblxuICAgIGRldGFpbFdyYXAucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgZGl2KFxuICAgICAgICBwKFwiZGV0YWlsc1wiKSxcbiAgICAgICAgdGFibGUoXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0cihjZWxsKFwidW5hc3NpZ25lZCByZXF1ZXN0c1wiKSwgY2VsbChBcnJheS5mcm9tKGFubmVhbGVyIS51bmFzc2lnbmVkKS5tYXAoKHgsIGkpID0+ICh7IHgsIGkgfSkpLmZpbHRlcigoeCkgPT4geC54KS5mbGF0TWFwKCh4KSA9PiBbc3BhbihcIiBcIiksIGl0ZW1CdXR0b24oeC5pKV0pKSksXG4gICAgICAgICAgdHIoY2VsbChcInNlYXJjaCB0aW1lXCIpLCBjZWxsKGAke2FubmVhbGVyPy5lbGFwc2VkTXMgPz8gMH1tc2ApKSxcbiAgICAgICAgICB0cihjZWxsKFwic2NvcmVcIiksIGNlbGwoYW5uZWFsZXI/LnRvdGFsU2NvcmUgPz8gMCkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJ0cmFuc3BvcnRlciBjb3VudFwiKSwgY2VsbChtb2QuTlRSQU5TKSksXG4gICAgICAgICAgdHIoY2VsbChcInJlcXVlc3QgY291bnRcIiksIGNlbGwobW9kLk5SRVFTKSksXG4gICAgICAgICAgdHIoY2VsbChcImNvc3QgcGVyIGttXCIpLCBjZWxsKGAke0tNX0NPU1R94oKsYCkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJhdmVyYWdlIHNwZWVkXCIpLCBjZWxsKGAke0FWR19TUEVFRF9LTUh9a20vaGApKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVvcmdhbml6YXRpb24gY29zdFwiKSwgY2VsbChgJHtSRU9SR19DT1NUX0VVUn3igqxgKSksXG4gICAgICAgICksXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXIoZm9yY2VUYWJsZSA9IGZhbHNlKSB7XG4gICAgaWYgKCFhbm5lYWxlcikgcmV0dXJuO1xuICAgIHJlbmRlclN0YXR1cygpO1xuICAgIGlmIChmb3JjZVRhYmxlIHx8IChyZW5kZXJDb3VudGVyKysgJSA0ID09PSAwKSkgcmVuZGVyVGFibGUoKTtcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHJ1blNvbHZlcihuYW1lOiBTb2x2ZXJOYW1lKSB7XG4gICAgc3RvcFNlYXJjaCgpO1xuICAgIGNvbnN0IGlkID0gKytydW5JZDtcbiAgICBhbm5lYWxpbmdTZXNzaW9uID0gbnVsbDtcbiAgICBhbm5lYWxlciA9IG51bGw7XG4gICAgcnVuQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcbiAgICBzY29yZUxpbmUudGV4dENvbnRlbnQgPSBcInJ1bm5pbmfigKZcIjtcbiAgICB0YWJsZVdyYXAucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChuYW1lID09PSBcImltcHJvdmVkXCIpIHtcbiAgICAgICAgYW5uZWFsaW5nU2Vzc2lvbiA9IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbihtb2QsIDFfOTAwXzAwMCk7XG4gICAgICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYW5uZWFsZXIgPSBhd2FpdCBhdmFpbGFibGVTb2x2ZXJzW25hbWVdKG1vZCk7XG4gICAgICB9XG4gICAgICBpZiAoaWQgPT09IHJ1bklkKSByZW5kZXIodHJ1ZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChpZCA9PT0gcnVuSWQpIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IGBzb2x2ZXIgZmFpbGVkOiAke1N0cmluZyhlcnJvcil9YDtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGlkID09PSBydW5JZCkge1xuICAgICAgICBydW5CdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gbmFtZSA9PT0gXCJpbXByb3ZlZFwiID8gXCJzdGFydFwiIDogXCJydW5cIjtcbiAgICAgICAgaGVhdEJ1dHRvbi5oaWRkZW4gPSBuYW1lICE9PSBcImltcHJvdmVkXCI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcnVuQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgbmFtZSA9IHNvbHZlclNlbGVjdC52YWx1ZSBhcyBTb2x2ZXJOYW1lO1xuICAgIGlmIChuYW1lICE9PSBcImltcHJvdmVkXCIpIHtcbiAgICAgIHZvaWQgcnVuU29sdmVyKG5hbWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoYW5uZWFsaW5nVGltZXIgIT0gbnVsbCkge1xuICAgICAgc3RvcFNlYXJjaCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0b3BcIjtcbiAgICBhbm5lYWxpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTIwKTtcbiAgICAgIHJlbmRlcigpO1xuICAgIH0sIDE1MCk7XG4gIH07XG5cbiAgaGVhdEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGlmICghYW5uZWFsaW5nU2Vzc2lvbikgcmV0dXJuO1xuICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5yZWhlYXQoKTtcbiAgICByZW5kZXIodHJ1ZSk7XG4gIH07XG5cbiAgc29sdmVyU2VsZWN0Lm9uY2hhbmdlID0gKCkgPT4gdm9pZCBydW5Tb2x2ZXIoc29sdmVyU2VsZWN0LnZhbHVlIGFzIFNvbHZlck5hbWUpO1xuICBjb250cm9scy5yZXBsYWNlQ2hpbGRyZW4ocnVuQnV0dG9uLCBoZWF0QnV0dG9uKTtcbiAgYXdhaXQgcnVuU29sdmVyKElOSVRJQUxfU09MVkVSKTtcblxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgICBvdmVyZmxvd1k6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dYOiBcImhpZGRlblwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgIH0pLFxuICAgIGNvbnRyb2xzLFxuICAgIHNvbHZlckxpbmUsXG4gICAgc2NvcmVMaW5lLFxuICAgIHRpbWVMaW5lLFxuICAgIHRhYmxlV3JhcCxcbiAgICBkZXRhaWxXcmFwLFxuICAgIHVuYXNzaWduZWRMaW5lLFxuICApO1xufVxuIiwKICAgICJpbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdfYmFzZWxpbmVcIlxuaW1wb3J0IHsgYW5uZWFsaW5nV2FzbSB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdfd2FzbVwiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgeyBkaXYsIGgyLCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIlxuXG5sZXQgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHRcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFVwV2FzbShwbGFubmVyOiBNb2R1bGUpIHtcbiAgcmVzdWx0ID0gYXdhaXQgYW5uZWFsaW5nV2FzbShwbGFubmVyKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd2FzbVZpZXcoX3BsYW5uZXI6IE1vZHVsZSkge1xuICBpZiAoIXJlc3VsdCApIHRocm93IG5ldyBFcnJvcihcIldBU00gcGxhbm5lciBpcyBub3Qgc2V0IHVwXCIpXG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoeyBwYWRkaW5nOiBcIjFlbVwiIH0pLFxuICAgIGgyKFwiV0FTTSBwbGFubmVyXCIpLFxuICAgIHAoXCJhc3NpZ25lZDogXCIsIHJlc3VsdC51bmFzc2lnbmVkLmxlbmd0aCAtIHJlc3VsdC51bmFzc2lnbmVkLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApKSxcbiAgICBwKFwic2NoZWR1bGUgc3RlcHM6IFwiLCByZXN1bHQuc2NoZWR1bGVTaXplcy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSksXG4gICAgcChcInNlYXJjaCB0aW1lOiBcIiwgcmVzdWx0LmVsYXBzZWRNcy50b0ZpeGVkKDIpLCBcIm1zXCIpLFxuICApXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgaGFzaCB9IGZyb20gXCIuLi9oYXNoXCI7XG5pbXBvcnQgeyBib2R5LCBidXR0b24sIGNvbG9yLCBkaXYsIGVycm9ycG9wdXAsIGgxLCBoMiwgaDMsIGlucHV0LCBtYXJnaW4sIHAsIHBhZGRpbmcsIHBvcHVwLCBwcmUsIHNwYW4sIHN0eWxlLCB0YWJsZSwgd2lkdGgsIHRleHRhcmVhLCBhLCBib3JkZXIsIGh0bWwsIHRoLCB0ciwgdGQsIGJvcmRlclJhZGl1cywgcGFuZWxMaXN0LCBkaXNwbGF5LCBiYWNrZ3JvdW5kIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgbWFwVmlldyB9IGZyb20gXCIuL21hcFZpZXdcIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyByYW5kb21Nb2R1bGUsIHJhbmRvbVVVSUQsIFJlcXVlc3QsIFNjaGVkdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBta1N0b3JlZCwgbWtXcml0YWJsZSwgdHlwZSBXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IHNldFJhbmRTZWVkIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHsgbnVtYmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgcGxhbm5lclZpZXcgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nXCI7XG5pbXBvcnQgeyBzZXRVcFdhc20sIHdhc21WaWV3IH0gZnJvbSBcIi4vd2FzbXZpZXdcIjtcblxuXG5leHBvcnQgbGV0IExLV19DT1VOVCA9IG1rU3RvcmVkKFwiTEtXX0NPVU5UXCIsIG51bWJlciwgIDUpXG5sZXQgUkVRVUVTVF9DT1VOVCA9IG1rU3RvcmVkKFwiUkVRVUVTVF9DT1VOVFwiLCAgbnVtYmVyLCAyMClcblxuYm9keS5zdHlsZS5tYXJnaW4gPSBcIjBcIlxuXG5sZXQgaGVhZGVyID0gaDEoXCJyb3V0ZSBwbGFubmVyXCIsIHN0eWxlKHtiYWNrZ3JvdW5kOiBjb2xvci5ibHVlLCBjb2xvcjogY29sb3IuYmFja2dyb3VuZCwgbWFyZ2luOiBcIjBcIiwgcGFkZGluZzogXCIuNmVtXCJ9KSlcblxubGV0IGNvbnRlbnRTcGFjZSA9IGRpdihzdHlsZSh7XG4gIGRpc3BsYXk6XCJmbGV4XCIsXG4gIGZsZXhEaXJlY3Rpb246XCJyb3dcIixcbiAgd2lkdGg6IFwiMTAwJVwiLFxuICBoZWlnaHQ6IFwiY2FsYygxMDAlIC0gMi41ZW0pXCIsXG4gIG1pbldpZHRoOiBcIjBcIixcbn0pKVxuXG5sZXQgcGFnZSA9IGRpdihcbiAgc3R5bGUoe2Rpc3BsYXk6XCJmbGV4XCIsIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIiwgaGVpZ2h0OiBcIjEwMCVcIn0pLFxuICBoZWFkZXIsXG4gIGNvbnRlbnRTcGFjZVxuKVxuXG5ib2R5LnJlcGxhY2VDaGlsZHJlbihwYWdlKVxuXG5zZXRSYW5kU2VlZCgyNClcblxuZXhwb3J0IGxldCBtb2R1bGUgPSByYW5kb21Nb2R1bGUoKVxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIG51bWJlcjogbnVtYmVyLFxuICAgIGxvZ28/IDogc3RyaW5nLFxuICB9W10sXG4gIGNvbG9yPzogc3RyaW5nXG59XG5cbmV4cG9ydCBsZXQgaGlnaHRMaWdodHMgPSBta1dyaXRhYmxlIDxIaWdoTGlnaHRbXT4oIFtdIClcblxuXG5mdW5jdGlvbiBzZXR0ZXIgKHN0b3JlOiBXcml0YWJsZTxudW1iZXI+ICl7XG4gIGxldCBpbnAgPSBpbnB1dCgpXG4gIGlucC50eXBlID0gXCJudW1iZXJcIlxuICBpbnAub25jaGFuZ2UgPSAoKT0+e1xuICAgIGxldCB2YWwgPSBwYXJzZUludChpbnAudmFsdWUpXG4gICAgaWYgKGlzTmFOKHZhbCkpIHJldHVyblxuICAgIHN0b3JlLnNldCh2YWwpXG4gIH1cbiAgc3RvcmUub251cGRhdGUodmFsPT5pbnAudmFsdWUgPSB2YWwudG9TdHJpbmcoKSlcblxuICByZXR1cm4gaW5wXG59XG5cblxuYXdhaXQgc2V0VXBXYXNtKG1vZHVsZSlcblxuYXN5bmMgZnVuY3Rpb24gbWtXaW5kb3cgKHRhYjogbnVtYmVyID0gMCApIHtcblxuICBsZXQgdGFiRmllbGRzID0gW1xuICAgIFsnbWFwJywgbWFwVmlldyhtb2R1bGUpXSxcbiAgICBbJ3BsYW5uZXInLCBhd2FpdCBwbGFubmVyVmlldyhtb2R1bGUpXSxcbiAgICBbJ3dhc20nLCB3YXNtVmlldyhtb2R1bGUpXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gIH0pKVxuXG4gIGZ1bmN0aW9uIG9wZW5UYWIodGFiOiB0eXBlb2YgdGFiRmllbGRzW251bWJlcl1bMF0pIHtcbiAgICBjb25zdCB0YWJzID0gcChcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgbWFyZ2luOiBcIjBcIixcbiAgICAgICAgcGFkZGluZzogXCIuNGVtXCIsXG4gICAgICAgIGZsZXg6IFwiMCAwIGF1dG9cIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLm1hcCgoW24sZV0pPT5cbiAgICAgICAgc3BhbiggbixcbiAgICAgICAgICAoKT0+b3BlblRhYihuKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIuM2VtXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIisgKG49PXRhYiA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSksXG4gICAgICAgICAgICBjb2xvcjogKG49PXRhYikgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBkaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGZsZXg6IFwiMSAxIGF1dG9cIixcbiAgICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMuZmluZCgoW24sXSk9Pm49PXRhYikhWzFdXG4gICAgKVxuXG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgdGFicyxcbiAgICAgIGNvbnRlbnRcbiAgICApXG4gIH1cblxuICBvcGVuVGFiKHRhYkZpZWxkc1t0YWJdIVswXSlcblxuICByZXR1cm4gZWxcbn1cblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbiguLi5hd2FpdCBQcm9taXNlLmFsbChbbWtXaW5kb3coMSksIG1rV2luZG93KCldKSlcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFFTyxJQUFNLE9BQU8sU0FBUztBQUU3QixJQUFNLGVBQWU7QUFBQSxFQUNuQixPQUFNO0FBQUEsSUFDSixPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsRUFDckI7QUFBQSxFQUNBLE1BQUs7QUFBQSxJQUNILE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNuQixLQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxFQUNyQjtBQUNGO0FBRU8sSUFBTSxRQUFRO0FBQUEsRUFDbkIsT0FBTztBQUFBLEVBQ1As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QUMsQ0FBQztBQUVGLElBQUksT0FBTyxJQUNULE1BQU0sRUFBQyxTQUFRLFFBQVEsZUFBYyxVQUFVLFFBQVEsT0FBTSxDQUFDLEdBQzlELFFBQ0EsWUFDRjtBQUVBLEtBQUssZ0JBQWdCLElBQUk7QUFFekIsWUFBWSxFQUFFO0FBRVAsSUFBSSxTQUFTLGFBQWE7QUFVMUIsSUFBSSxjQUFjLFdBQTBCLENBQUMsQ0FBRTtBQWlCdEQsTUFBTSxVQUFVLE1BQU07QUFFdEIsZUFBZSxRQUFTLENBQUMsTUFBYyxHQUFJO0FBQUEsRUFFekMsSUFBSSxZQUFZO0FBQUEsSUFDZCxDQUFDLE9BQU8sUUFBUSxNQUFNLENBQUM7QUFBQSxJQUN2QixDQUFDLFdBQVcsTUFBTSxZQUFZLE1BQU0sQ0FBQztBQUFBLElBQ3JDLENBQUMsUUFBUSxTQUFTLE1BQU0sQ0FBQztBQUFBLEVBQzNCO0FBQUEsRUFFQSxNQUFNLEtBQUssSUFBSSxNQUFNO0FBQUEsSUFDbkIsTUFBTTtBQUFBLElBQ04sVUFBVTtBQUFBLElBQ1YsUUFBUTtBQUFBLElBQ1IsUUFBUSxlQUFhLE1BQU07QUFBQSxJQUMzQixVQUFVO0FBQUEsSUFDVixTQUFTO0FBQUEsSUFDVCxlQUFlO0FBQUEsRUFDakIsQ0FBQyxDQUFDO0FBQUEsRUFFRixTQUFTLE9BQU8sQ0FBQyxNQUFrQztBQUFBLElBQ2pELE1BQU0sT0FBTyxFQUNYLE1BQU07QUFBQSxNQUNKLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxNQUNULE1BQU07QUFBQSxJQUNSLENBQUMsR0FDRCxVQUFVLElBQUksRUFBRSxHQUFFLE9BQ2hCLEtBQU0sR0FDSixNQUFJLFFBQVEsQ0FBQyxHQUNiLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFFBQVEsZ0JBQWUsS0FBRyxPQUFNLE1BQU0sUUFBUSxNQUFNO0FBQUEsTUFDcEQsT0FBUSxLQUFHLE9BQU8sTUFBTSxRQUFRLE1BQU07QUFBQSxJQUN4QyxDQUFDLENBQ0gsQ0FDRixDQUNGO0FBQUEsSUFFQSxNQUFNLFVBQVUsSUFDZCxNQUFNO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixXQUFXO0FBQUEsTUFDWCxVQUFVO0FBQUEsSUFDWixDQUFDLEdBQ0QsVUFBVSxLQUFLLEVBQUUsT0FBTSxLQUFHLElBQUcsRUFBRyxFQUNsQztBQUFBLElBRUEsR0FBRyxnQkFDRCxNQUNBLE9BQ0Y7QUFBQTtBQUFBLEVBR0YsUUFBUSxVQUFVLEtBQU0sRUFBRTtBQUFBLEVBRTFCLE9BQU87QUFBQTtBQUdULGFBQWEsZ0JBQWdCLEdBQUcsTUFBTSxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDOyIsCiAgImRlYnVnSWQiOiAiQzlFOERDMDFDMUNENzY4NTY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
