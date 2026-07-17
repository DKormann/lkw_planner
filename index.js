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
var INF2 = 1 << 30;
var REORG_COST = 200;
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
  arr.at = (index) => at(checkIdx.call(index, 1));
  arr.move = (target, source, count) => move(checkIdx.call(target, count), checkIdx.call(source, count), count);
  return arr;
}
function forN(n, body2) {
  const i = local("i32");
  return loop(i.lt(n), [body2(i), i.set(i.add(1))]);
}
async function annealingWasm(planner) {
  const TSIZE = Math.floor(planner.NREQS / planner.NTRANS * 2.5 * 2 + 10);
  const NPOINTS = planner.roadmap.points.length;
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
  const roadCost = func(["i32", "i32"], "i32", (from, to) => {
    const a2 = local("i32"), b = local("i32"), tmp = local("i32"), index = local("i32");
    return [
      a2.set(from),
      b.set(to),
      ifElse(a2.lt(b), [tmp.set(a2), a2.set(b), b.set(tmp)]),
      index.set(a2.add(b.mul(NPOINTS))),
      ifElse(index.gt(planner.RSIZE), index.set(i32(NPOINTS ** 2).sub(index))),
      ret(dists.at(index))
    ];
  });
  const tryAssign = func([], "void", () => {
    const tran = local("i32");
    const req_id = local("i32");
    const A = local("i32");
    const B = local("i32");
    const tmp = local("i32");
    const tsize = local("i32");
    const toffset = local("i32");
    const previousScore = local("i32");
    const nextScore = local("i32");
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    return [
      tran.set(randint.call(0, planner.NTRANS)),
      req_id.set(randint.call(0, planner.NREQS)),
      ifElse(assigned.at(req_id).eq(1), ret()),
      toffset.set(tran.mul(TSIZE)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.gt(TSIZE - 2), trap("schedule capacity exceeded")),
      previousScore.set(rateTran.call(tran)),
      A.set(randint.call(0, tsize.add(1))),
      B.set(randint.call(0, tsize.add(1))),
      ifElse(A.gt(B), [tmp.set(A), A.set(B), B.set(tmp)]),
      schedView.move(B.add(2), B, tsize.sub(B)),
      schedView.move(A.add(1), A, B.sub(A)),
      tmp.set(randint.call(0, 2)),
      schedView.at(A).set({ req_id, is_load: 1, deck: tmp }),
      schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp }),
      sched_size.at(tran).set(tsize.add(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(nextScore.gt(previousScore), assigned.at(req_id).set(1), [
        schedView.move(A, A.add(1), B.sub(A)),
        schedView.move(B, B.add(2), tsize.sub(B)),
        sched_size.at(tran).set(tsize)
      ])
    ];
  });
  const rateTran = func(["i32"], "i32", (tran) => {
    const reward = local("i32"), duration = local("i32"), pos = local("i32");
    const offset = local("i32"), size = local("i32"), i = local("i32");
    const deck0 = local("i32"), deck1 = local("i32"), deckSize0 = local("i32"), deckSize1 = local("i32");
    const deck = local("i32"), deckSize = local("i32"), req = local("i32"), nextPos = local("i32");
    const found = local("i32"), shift = local("i32"), lowerMask = local("i32");
    const step = local(STOP), request = local(REQ);
    return [
      pos.set(tran_positions.at(tran)),
      offset.set(tran.mul(TSIZE)),
      size.set(sched_size.at(tran)),
      loop(i.lt(size), [
        step.set(schedule.at(offset.add(i))),
        req.set(step.req_id),
        request.set(requests.at(req)),
        nextPos.set(ifElse(step.is_load, request.start, request.end)),
        duration.iadd(roadCost.call(pos, nextPos)),
        pos.set(nextPos),
        deck.set(ifElse(step.deck, deck1, deck0)),
        deckSize.set(ifElse(step.deck, deckSize1, deckSize0)),
        ifElse(step.is_load, [
          ifElse(deckSize.gt(2), ret(-INF2)),
          deck.set(deck.or(req.shl(deckSize.mul(10)))),
          deckSize.iadd(1)
        ], [
          found.set(-1),
          ifElse(deckSize.gt(0).and(deck.and(1023).eq(req)), found.set(0)),
          ifElse(found.eq(-1).and(deckSize.gt(1)).and(deck.shr(10).and(1023).eq(req)), found.set(1)),
          ifElse(found.eq(-1).and(deckSize.gt(2)).and(deck.shr(20).and(1023).eq(req)), found.set(2)),
          ifElse(found.eq(-1), ret(-INF2)),
          duration.iadd(deckSize.sub(found).sub(1).mul(REORG_COST)),
          shift.set(found.mul(10)),
          lowerMask.set(i32(1).shl(shift).sub(1)),
          deck.set(deck.and(lowerMask).or(deck.shr(shift.add(10)).shl(shift))),
          deckSize.isub(1),
          ifElse(duration.gt(request.deadline), [], reward.iadd(request.value))
        ]),
        ifElse(step.deck, [deck1.set(deck), deckSize1.set(deckSize)], [deck0.set(deck), deckSize0.set(deckSize)]),
        i.iadd(1)
      ]),
      ret(reward.sub(duration))
    ];
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
    rateTran,
    randState,
    schedule,
    search,
    sched_size,
    tran_positions
  });
  wasm.dists.set(planner.roadmap.CostMatrix);
  wasm.randState.set(Array.from({ length: NWORKERS * 2 }, (_, i) => i + 1));
  wasm.tran_positions.set(planner.startpositions);
  planner.requests.forEach((request, i) => wasm.addRequest(i, request.startPoint, request.endPoint, Math.trunc(request.value_eur / 0.5), Math.trunc(request.deadline_h * 60)));
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
  const scheduleRatings = new Int32Array(Array.from({ length: planner.NTRANS }, (_, tran) => wasm.rateTran(tran)));
  return {
    schedule: resultSchedule,
    scheduleSizes: new Uint16Array(wasm.sched_size),
    tranStart: new Uint16Array(planner.startpositions),
    TSIZE,
    scheduleRatings,
    unassigned,
    elapsedMs,
    totalScore: scheduleRatings.reduce((sum, score) => sum + score, 0)
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
  }), controls, solverLine, scoreLine, timeLine, tableWrap, detailWrap);
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

//# debugId=E6E2FBF5C4A2429A64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc20vYXN0LnRzIiwgInNyYy93YXNtL2FuYWx5emUudHMiLCAic3JjL3dhc20vY29kZWdlbi50cyIsICJzcmMvd2FzbS9pbmRleC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvdmlldy93YXNtdmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5jb25zdCBJTkYgPSAxIDw8IDMwO1xuXG5leHBvcnQgdHlwZSBQYWlySW5mbyA9IHtcbiAgcmVxOiBudW1iZXI7XG4gIGZpcnN0OiBudW1iZXI7XG4gIHNlY29uZDogbnVtYmVyO1xuICBkZWNrOiAwIHwgMTtcbn07XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1N0YXRlID0ge1xuICBtb2Q6IE1vZHVsZTtcbiAgTlJFUVM6IG51bWJlcjtcbiAgTlRSQU5TOiBudW1iZXI7XG4gIFRTSVpFOiBudW1iZXI7XG4gIHJlcVBpY2t1cExvY2F0aW9uczogVWludDE2QXJyYXk7XG4gIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVhZGxpbmVzOiBVaW50MzJBcnJheTtcbiAgcmVxVmFsdWVzOiBVaW50MzJBcnJheTtcbiAgdW5hc3NpZ25lZDogSW50OEFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2FkKHg6IG51bWJlcikge1xuICByZXR1cm4geCAmIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNrKHg6IG51bWJlcikge1xuICByZXR1cm4gKCh4ICYgMikgPj4gMSkgYXMgMCB8IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXEoeDogbnVtYmVyKSB7XG4gIHJldHVybiAoeCAmIDB4ZmZmZikgPj4gMjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvcyh4OiBudW1iZXIpIHtcbiAgcmV0dXJuIHggPj4gMTY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QW5uZWFsaW5nU3RhdGUobW9kOiBNb2R1bGUsIHNlZWQ/OiBBbm5lYWxpbmdSZXN1bHQpOiBBbm5lYWxpbmdTdGF0ZSB7XG4gIGNvbnN0IHsgTlJFUVMsIHJlcXVlc3RzLCBzdGFydHBvc2l0aW9ucywgTlRSQU5TIH0gPSBtb2Q7XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihOUkVRUyAqIDIuNSArIDEwKTtcblxuICByZXR1cm4ge1xuICAgIG1vZCxcbiAgICBOUkVRUyxcbiAgICBOVFJBTlMsXG4gICAgVFNJWkUsXG4gICAgcmVxUGlja3VwTG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLnN0YXJ0UG9pbnQpKSxcbiAgICByZXFEZWxpdmVyeUxvY2F0aW9uczogbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5lbmRQb2ludCkpLFxuICAgIHJlcURlYWRsaW5lczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5kZWFkbGluZV9oICogQVZHX1NQRUVEX0tNSCkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci52YWx1ZV9ldXIgLyBLTV9DT1NUKSksXG4gICAgdW5hc3NpZ25lZDogc2VlZCA/IG5ldyBJbnQ4QXJyYXkoc2VlZC51bmFzc2lnbmVkKSA6IG5ldyBJbnQ4QXJyYXkocmVxdWVzdHMubWFwKCgpID0+IDEpKSxcbiAgICB0cmFuU3RhcnQ6IG5ldyBVaW50MTZBcnJheShzdGFydHBvc2l0aW9ucyksXG4gICAgc2NoZWR1bGU6IHNlZWQgPyBuZXcgVWludDMyQXJyYXkoc2VlZC5zY2hlZHVsZSkgOiBuZXcgVWludDMyQXJyYXkoVFNJWkUgKiBOVFJBTlMpLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHNlZWQgPyBuZXcgVWludDE2QXJyYXkoc2VlZC5zY2hlZHVsZVNpemVzKSA6IG5ldyBVaW50MTZBcnJheShOVFJBTlMpLFxuICAgIHNjaGVkdWxlUmF0aW5nczogc2VlZCA/IG5ldyBJbnQzMkFycmF5KHNlZWQuc2NoZWR1bGVSYXRpbmdzKSA6IG5ldyBJbnQzMkFycmF5KE5UUkFOUyksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZU9mZnNldChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICByZXR1cm4gdHJhbiAqIHN0YXRlLlRTSVpFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBpZHg6IG51bWJlciwgaXNMb2FkQml0OiAxIHwgMCwgZGVjazogMCB8IDEsIHJlcTogbnVtYmVyLCBwb3M6IG51bWJlcikge1xuICBzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdID0gKGlzTG9hZEJpdCA8PCAwKSB8IChkZWNrIDw8IDEpIHwgKHJlcSA8PCAyKSB8IChwb3MgPDwgMTYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVSb3V0ZShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICBsZXQgcmV3YXJkID0gMDtcbiAgbGV0IGR1cmF0aW9uID0gMDtcbiAgY29uc3QgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV07XG4gIGxldCBwb3MgPSBzdGF0ZS50cmFuU3RhcnRbdHJhbl0hO1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKTtcbiAgICBjb25zdCBuZXh0UG9zID0gZ2V0UG9zKHN0ZXApO1xuICAgIGR1cmF0aW9uICs9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgZHVyYXRpb24gKz0gKGRlY2subGVuZ3RoIC0gaWR4IC0gMSkgKiBSRU9SR19DT1NUX0VVUiAvIEtNX0NPU1Q7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGR1cmF0aW9uIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gZHVyYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoQWxsUmF0aW5ncyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUpIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heExvc3MgPSAyNDApIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGlmIChzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dICE9PSAwKSBjb250aW51ZTtcblxuICAgIGxldCBiZXN0UmVxID0gLTE7XG4gICAgbGV0IGJlc3RTY29yZSA9IC1JTkY7XG5cbiAgICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICAgIGlmICghc3RhdGUudW5hc3NpZ25lZFtyZXFdKSBjb250aW51ZTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCAwLCAwLCAwLCByZXEpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCAwLCAxKTtcbiAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdFJlcSA9IHJlcTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYmVzdFJlcSA9PT0gLTEgfHwgYmVzdFNjb3JlIDwgLW1heExvc3MpIGNvbnRpbnVlO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIGJlc3RSZXEpO1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IGJlc3RTY29yZTtcbiAgICBzdGF0ZS51bmFzc2lnbmVkW2Jlc3RSZXFdID0gMDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0U3RvcHMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBlbmQgKyAyLCBvZmZzZXQgKyBlbmQsIG9mZnNldCArIHNpemUpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIGVuZCArIDEpO1xuICBzZXRSZXEoc3RhdGUsIHRyYW4sIHN0YXJ0LCAxLCBkZWNrLCByZXEsIHN0YXRlLnJlcVBpY2t1cExvY2F0aW9uc1tyZXFdISk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgZW5kICsgMSwgMCwgZGVjaywgcmVxLCBzdGF0ZS5yZXFEZWxpdmVyeUxvY2F0aW9uc1tyZXFdISk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBlbmQpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCAtIDEsIG9mZnNldCArIGVuZCArIDEsIG9mZnNldCArIHNpemUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhaXJJblJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCByZXE6IG51bWJlcik6IFBhaXJJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBsZXQgZmlyc3QgPSAtMTtcbiAgbGV0IHNlY29uZCA9IC0xO1xuICBsZXQgZGVjazogMCB8IDEgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBpZiAoZ2V0UmVxKHN0ZXApICE9PSByZXEpIGNvbnRpbnVlO1xuICAgIGlmIChmaXJzdCA9PT0gLTEpIHtcbiAgICAgIGZpcnN0ID0gaTtcbiAgICAgIGRlY2sgPSBnZXREZWNrKHN0ZXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWNvbmQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZpcnN0ID09PSAtMSB8fCBzZWNvbmQgPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgcmVxLCBmaXJzdCwgc2Vjb25kLCBkZWNrIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVVbmFzc2lnbmVkUmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IG51bWJlciB8IG51bGwge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1heEF0dGVtcHRzOyBpKyspIHtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIHN0YXRlLk5SRVFTKTtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgZm9yIChsZXQgcmVxID0gMDsgcmVxIDwgc3RhdGUuTlJFUVM7IHJlcSsrKSB7XG4gICAgaWYgKHN0YXRlLnVuYXNzaWduZWRbcmVxXSkgcmV0dXJuIHJlcTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbyB9IHwgbnVsbCB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgbWF4QXR0ZW1wdHM7IGF0dGVtcHQrKykge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIHN0YXRlLk5UUkFOUyk7XG4gICAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGlmIChzaXplIDwgMikgY29udGludWU7XG4gICAgY29uc3QgaWR4ID0gcmFuZEludCgwLCBzaXplKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pICsgaWR4XSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pXSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0QW5uZWFsKHByZXZTY29yZTogbnVtYmVyLCBuZXh0U2NvcmU6IG51bWJlciwgdGVtcDogbnVtYmVyKSB7XG4gIGlmIChuZXh0U2NvcmUgPj0gcHJldlNjb3JlKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgZGVsdGEgPSBwcmV2U2NvcmUgLSBuZXh0U2NvcmU7XG4gIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KHRlbXAsIDAuMDAxKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIGVsYXBzZWRNczogbnVtYmVyKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogc3RhdGUuc2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogc3RhdGUuc2NoZWR1bGVTaXplcyxcbiAgICB0cmFuU3RhcnQ6IHN0YXRlLnRyYW5TdGFydCxcbiAgICBUU0laRTogc3RhdGUuVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MsXG4gICAgdW5hc3NpZ25lZDogc3RhdGUudW5hc3NpZ25lZCxcbiAgICBlbGFwc2VkTXMsXG4gICAgdG90YWxTY29yZTogc3RhdGUuc2NoZWR1bGVSYXRpbmdzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApLFxuICB9O1xufVxuIiwKICAgICJpbXBvcnQgeyByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGdldERlY2ssXG4gIGdldFJlcSxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1Jlc3VsdCA9IHtcbiAgc2NoZWR1bGU6IFVpbnQzMkFycmF5O1xuICBzY2hlZHVsZVNpemVzOiBVaW50MTZBcnJheTtcbiAgdHJhblN0YXJ0OiBVaW50MTZBcnJheTtcbiAgVFNJWkU6IG51bWJlcjtcbiAgc2NoZWR1bGVSYXRpbmdzOiBJbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIGVsYXBzZWRNczogbnVtYmVyO1xuICB0b3RhbFNjb3JlOiBudW1iZXI7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYmFzZWxpbmVBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMV82MDBfMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kKTtcbiAgY29uc3QgeyBOUkVRUywgTlRSQU5TLCBUU0laRSwgc2NoZWR1bGUsIHNjaGVkdWxlU2l6ZXMsIHNjaGVkdWxlUmF0aW5ncywgdW5hc3NpZ25lZCB9ID0gc3RhdGU7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEwMDtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2UmF0aW5nOiBudW1iZXIsIG5leHRSYXRpbmc6IG51bWJlcikge1xuICAgIGlmIChuZXh0UmF0aW5nID49IHByZXZSYXRpbmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0UmF0aW5nIC0gcHJldlJhdGluZykgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2NoZWRTaXplICsgMSk7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKHNjaGVkU2l6ZSwgcmFuZEludCgwLCA0KSArIGEpO1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpO1xuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAwLjUgPyAxIDogMCwgcmVxKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICBjb25zdCBzY2hlZFNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2NoZWRTaXplIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRTaXplKTtcbiAgICBjb25zdCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSE7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKGl0ZW0pO1xuXG4gICAgY29uc3QgYWI6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZFNpemU7IGkrKykge1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09PSByZXEpIGFiLnB1c2goaSk7XG4gICAgfVxuICAgIGlmIChhYi5sZW5ndGggIT09IDIpIHJldHVybjtcblxuICAgIGNvbnN0IFthLCBiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl07XG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIpO1xuICAgIGNvbnN0IG5ld1JhdGluZyA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgIGlmIChhY2NlcHQoc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgbmV3UmF0aW5nKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gbmV3UmF0aW5nO1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgLSAxLCBnZXREZWNrKGl0ZW0pIGFzIDAgfCAxLCByZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG4gICAgdGVtcCA9ICgxIC0gaSAvIHN0ZXBzKSAqIHN0YXJ0VGVtcDtcbiAgICB0cnlVbmFzc2lnbigpO1xuICAgIHRyeUFzc2lnbigpO1xuICB9XG5cbiAgcmV0dXJuIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlLCBEYXRlLm5vdygpIC0gc3RhcnRlZEF0KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZyB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHtcbiAgYWNjZXB0QW5uZWFsLFxuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgdHlwZSBQYWlySW5mbyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNhbXBsZUFzc2lnbmVkUGFpcixcbiAgc2FtcGxlVW5hc3NpZ25lZFJlcSxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBJbXByb3ZlZE9wdGlvbnMgPVxuICB8IHsgc3RlcHM6IG51bWJlcjsgYnVkZ2V0TXM/OiBuZXZlciB9XG4gIHwgeyBidWRnZXRNczogbnVtYmVyOyBzdGVwcz86IG5ldmVyIH07XG5cbmV4cG9ydCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiA9IHtcbiAgaXRlcmF0ZVN0ZXBzOiAoc3RlcHM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBpdGVyYXRlRm9yTXM6IChidWRnZXRNczogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG4gIGdldFJlc3VsdDogKCkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICByZWhlYXQ6IChmYWN0b3I/OiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kOiBNb2R1bGUsIHRhcmdldFN0ZXBzID0gMTUwMDAwKTogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHtcbiAgY29uc3Qgd2FybXVwU3RlcHMgPSBNYXRoLm1pbihNYXRoLm1heCgyMDAwMCwgTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMikpLCA1MDAwMCk7XG4gIGNvbnN0IHdhcm11cCA9IGJhc2VsaW5lQW5uZWFsaW5nKG1vZCwgd2FybXVwU3RlcHMpO1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QsIHdhcm11cCk7XG4gIGNvbnN0IHsgTlRSQU5TLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuICBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZSk7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEyMDtcbiAgbGV0IGVuZFRlbXAgPSAwLjU7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyByZXE6IG51bWJlcjsgYTogbnVtYmVyOyBiOiBudW1iZXI7IGRlY2s6IDAgfCAxOyBzY29yZTogbnVtYmVyIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IHJlcSA9IHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGUpO1xuICAgICAgaWYgKHJlcSA9PSBudWxsKSBicmVhaztcblxuICAgICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBjb25zdCBkZWNrID0gKHJhbmRvbSgpID4gMC41ID8gMSA6IDApIGFzIDAgfCAxO1xuXG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgZGVjaywgcmVxKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHJlcSwgYSwgYiwgZGVjaywgc2NvcmU6IG5ld1Njb3JlIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LmEsIGJlc3QuYiwgYmVzdC5kZWNrLCBiZXN0LnJlcSk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ25TYW1wbGVkKHNhbXBsZXMgPSA2KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7IHRyYW46IG51bWJlcjsgcGFpcjogUGFpckluZm87IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IG5ld1Njb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0geyB0cmFuLCBwYWlyLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucGFpci5yZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlbG9jYXRlU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgc3JjOiBudW1iZXI7XG4gICAgICBkc3Q6IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICAgIG9sZFNjb3JlOiBudW1iZXI7XG4gICAgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcblxuICAgICAgY29uc3QgeyB0cmFuOiBzcmMsIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIGNvbnN0IGRzdCA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IG9sZFNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY2hlZHVsZVJhdGluZ3Nbc3JjXSFcbiAgICAgICAgOiBzY2hlZHVsZVJhdGluZ3Nbc3JjXSEgKyBzY2hlZHVsZVJhdGluZ3NbZHN0XSE7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3QgZHN0U2l6ZSA9IHNjaGVkdWxlU2l6ZXNbZHN0XSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBkc3RTaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oZHN0U2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgZHN0U2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGRzdCwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY29yZVJvdXRlKHN0YXRlLCBzcmMpXG4gICAgICAgIDogc2NvcmVSb3V0ZShzdGF0ZSwgc3JjKSArIHNjb3JlUm91dGUoc3RhdGUsIGRzdCk7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBkc3QsIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBjYW5kaWRhdGVTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICBzcmMsXG4gICAgICAgICAgZHN0LFxuICAgICAgICAgIHBhaXIsXG4gICAgICAgICAgaW5zZXJ0QTogYSxcbiAgICAgICAgICBpbnNlcnRCOiBiLFxuICAgICAgICAgIHNjb3JlOiBjYW5kaWRhdGVTY29yZSxcbiAgICAgICAgICBvbGRTY29yZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKGJlc3Qub2xkU2NvcmUsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBpZiAoYmVzdC5zcmMgPT09IGJlc3QuZHN0KSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5zcmNdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5zcmMpO1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5kc3RdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5kc3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5zcmMsIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlSZWluc2VydFNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHtcbiAgICAgIHRyYW46IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW4sIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG5cbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHRyYW4sXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuXG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2Vzc2lvblN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGxldCBpID0gMDtcbiAgY29uc3QgdGVtcEZsb29yID0gMztcbiAgY29uc3QgcmVoZWF0VGVtcCA9IDQ1O1xuXG4gIGZ1bmN0aW9uIHJ1bkl0ZXJhdGlvbnMoaXRlcmF0aW9uQnVkZ2V0OiBudW1iZXIsIGRlYWRsaW5lID0gSW5maW5pdHkpIHtcbiAgICBjb25zdCBlbmRJdGVyYXRpb24gPSBNYXRoLm1pbih0YXJnZXRTdGVwcywgaSArIGl0ZXJhdGlvbkJ1ZGdldCk7XG4gICAgd2hpbGUgKGkgPCBlbmRJdGVyYXRpb24pIHtcbiAgICAgIGlmICgoaSAmIDIwNDcpID09PSAwICYmIERhdGUubm93KCkgPj0gZGVhZGxpbmUpIGJyZWFrO1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBpIC8gdGFyZ2V0U3RlcHM7XG4gICAgICB0ZW1wID0gc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgcHJvZ3Jlc3MpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBydW5UaW1lZENodW5rKGJ1ZGdldE1zOiBudW1iZXIpIHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBidWRnZXRNcztcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXBGbG9vciwgc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKSk7XG5cbiAgICAgIGNvbnN0IHIgPSByYW5kb20oKTtcbiAgICAgIGlmIChyIDwgMC40KSB0cnlBc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC41NSkgdHJ5VW5hc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC44NSkgdHJ5UmVpbnNlcnRTYW1wbGVkKCk7XG4gICAgICBlbHNlIHRyeVJlbG9jYXRlU2FtcGxlZCgpO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgd2FybXVwLmVsYXBzZWRNcyArIChEYXRlLm5vdygpIC0gc2Vzc2lvblN0YXJ0ZWRBdCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpdGVyYXRlU3RlcHMoc3RlcHMpIHtcbiAgICAgIHJ1bkl0ZXJhdGlvbnMoc3RlcHMpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gICAgaXRlcmF0ZUZvck1zKGJ1ZGdldE1zKSB7XG4gICAgICBydW5UaW1lZENodW5rKGJ1ZGdldE1zKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCxcbiAgICByZWhlYXQoZmFjdG9yID0gMSkge1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXAsIHJlaGVhdFRlbXAgKiBmYWN0b3IpO1xuICAgICAgLy8gUHVsbCB0aGUgc2VhcmNoIHNsaWdodGx5IGJhY2sgZnJvbSB0aGUgY29sZCBlbmQgb2YgdGhlIHNjaGVkdWxlLlxuICAgICAgaSA9IE1hdGgubWF4KDAsIGkgLSBNYXRoLmZsb29yKHRhcmdldFN0ZXBzICogMC4wOCAqIGZhY3RvcikpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2Q6IE1vZHVsZSwgb3B0aW9uczogSW1wcm92ZWRPcHRpb25zKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3QgdGFyZ2V0U3RlcHMgPSBvcHRpb25zLnN0ZXBzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLnN0ZXBzIDogTWF0aC5tYXgoMTUwMDAwLCBNYXRoLmZsb29yKG9wdGlvbnMuYnVkZ2V0TXMgKiAxOTApKTtcbiAgY29uc3Qgc2Vzc2lvbiA9IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbihtb2QsIHRhcmdldFN0ZXBzKTtcbiAgaWYgKG9wdGlvbnMuc3RlcHMgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZVN0ZXBzKG9wdGlvbnMuc3RlcHMpO1xuICByZXR1cm4gc2Vzc2lvbi5pdGVyYXRlRm9yTXMob3B0aW9ucy5idWRnZXRNcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZyhtb2Q6IE1vZHVsZSwgc3RlcHMgPSAxNTAwMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4gaW1wcm92ZWRBbm5lYWxpbmdDb3JlKG1vZCwgeyBzdGVwcyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nVGltZWQobW9kOiBNb2R1bGUsIGJ1ZGdldE1zID0gMTAwMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4gaW1wcm92ZWRBbm5lYWxpbmdDb3JlKG1vZCwgeyBidWRnZXRNcyB9KTtcbn1cbiIsCiAgICAiXG5leHBvcnQgdHlwZSBOdW1UeXBlID0gXCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIlxuZXhwb3J0IHR5cGUgUmVzdWx0VHlwZSA9IE51bVR5cGUgfCBcInZvaWRcIiB8IFN0cnVjdFR5cGU8YW55PlxuZXhwb3J0IHR5cGUgSW50VHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiXG5leHBvcnQgdHlwZSBQYWNrZWRUeXBlID0gXCJpOFwiIHwgXCJ1OFwiIHwgXCJpMTZcIiB8IFwidTE2XCJcbmV4cG9ydCB0eXBlIE1lbW9yeVR5cGUgPSBOdW1UeXBlIHwgUGFja2VkVHlwZVxuZXhwb3J0IHR5cGUgRFR5cGUgPSBNZW1vcnlUeXBlIHwgU3RydWN0VHlwZTxhbnk+XG5leHBvcnQgdHlwZSBMb2FkZWRUeXBlPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPiA9IFQgZXh0ZW5kcyBQYWNrZWRUeXBlID8gXCJpMzJcIiA6IFRcbmV4cG9ydCB0eXBlIEFyaXRobWV0aWNPcCA9IFwiYWRkXCIgfCBcInN1YlwiIHwgXCJtdWxcIiB8IFwiZGl2XCJcbmV4cG9ydCB0eXBlIEJpdE9wID0gXCJ4b3JcIiB8IFwic2hsXCIgfCBcInNoclwiIHwgXCJhbmRcIiB8IFwib3JcIlxuZXhwb3J0IHR5cGUgUmVtYWluZGVyT3AgPSBcIm1vZFwiIHwgXCJ1bW9kXCJcbmV4cG9ydCB0eXBlIEJpbk9wID0gQXJpdGhtZXRpY09wIHwgQml0T3AgfCBSZW1haW5kZXJPcFxuZXhwb3J0IHR5cGUgQ21wT3AgPSBcImVxXCIgfCBcImx0XCIgfCBcImd0XCJcbmNvbnN0IGFyaXRobWV0aWNPcHMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0gYXMgY29uc3RcbmNvbnN0IGJpdE9wcyA9IFtcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwic2hyXCJdIGFzIGNvbnN0XG5jb25zdCByZW1haW5kZXJPcHMgPSBbXCJtb2RcIiwgXCJ1bW9kXCJdIGFzIGNvbnN0XG5jb25zdCBjbXBPcHMgPSBbXCJlcVwiLCBcImx0XCIsIFwiZ3RcIl0gYXMgY29uc3RcbmV4cG9ydCB0eXBlIFZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IFQgZXh0ZW5kcyBcImk2NFwiID8gYmlnaW50IDogbnVtYmVyXG5leHBvcnQgdHlwZSBUeXBlZEFycmF5Rm9yPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPiA9XG4gIFQgZXh0ZW5kcyBcImk4XCIgPyBJbnQ4QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJ1MTZcIiA/IFVpbnQxNkFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTE2XCIgPyBJbnQxNkFycmF5IDpcbiAgVCBleHRlbmRzIFwidThcIiA/IFVpbnQ4QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpMzJcIiA/IEludDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpNjRcIiA/IEJpZ0ludDY0QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmMzJcIiA/IEZsb2F0MzJBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImY2NFwiID8gRmxvYXQ2NEFycmF5IDogbmV2ZXJcblxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPjogbmV2ZXIgfVxudHlwZSBBcmdzTGlrZTxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwckxpa2U8QXJnc1tLXT46IG5ldmVyIH1cbmV4cG9ydCB0eXBlIEFyZ3NWYWw8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBWYWx1ZTxBcmdzW0tdPiA6IG5ldmVyIH1cblxudHlwZSBMb2NhbE5vZGU8VCBleHRlbmRzIE51bVR5cGU+ID0geyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlOiBULCBsb2NhbDogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIENvcmVFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9XG4gIHwgeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFQsIHZhbHVlOiBWYWx1ZTxUPiB9XG4gIHwgTG9jYWxOb2RlPFQ+XG4gIHwgeyBraW5kOiBcImJpblwiLCB0eXBlOiBULCBvcDogQmluT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwiY2FsbFwiLCB0eXBlOiBULCB0YXJnZXQ6IEFueUZ1bmMsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcImNhc3RcIiwgdHlwZTogVCwgaW5wdXRUeXBlOiBOdW1UeXBlLCB1bnNpZ25lZDogYm9vbGVhbiwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJpZlwiLCB0eXBlOiBULCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlOiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwibG9hZFwiLCB0eXBlOiBULCBhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByPFwiaTMyXCI+LCBzdG9yYWdlOiBNZW1vcnlUeXBlLCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiA/IHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBOdW1UeXBlLCBvcDogQ21wT3AsIGxlZnQ6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByPE51bVR5cGU+IH0gOiBuZXZlcilcblxuY2xhc3MgRXhwck1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IHt9XG50eXBlIEFyaXRobWV0aWNNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsgW09wIGluIEFyaXRobWV0aWNPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxudHlwZSBDb21wYXJlTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBDbXBPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxudHlwZSBJbnRlZ2VyTWV0aG9kczxUIGV4dGVuZHMgSW50VHlwZT4gPSB7IFtPcCBpbiBCaXRPcCB8IFJlbWFpbmRlck9wXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5leHBvcnQgdHlwZSBFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IENvcmVFeHByPFQ+ICYgRXhwck1ldGhvZHM8VD4gJiBBcml0aG1ldGljTWV0aG9kczxUPiAmIENvbXBhcmVNZXRob2RzPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gSW50ZWdlck1ldGhvZHM8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIEFueUV4cHIgPSBhbnlcblxuXG5leHBvcnQgdHlwZSBTdG10ID1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBudW1iZXIsIHR5cGU6IE51bVR5cGUsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXk6IEFueUFycmF5LCB0eXBlOiBNZW1vcnlUeXBlLCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RyaWRlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImFycmF5Lm1vdmVcIiwgYXJyYXk6IEFueUFycmF5LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4gfVxuICB8IHsga2luZDogXCJpZlwiLCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10W10sIGVsc2U6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IG51bWJlciwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwibG9vcFwiLCBjb250cm9sOiBudW1iZXIsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZT86IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBBbnlGdW5jLCBhcmdzOiBFeHByPE51bVR5cGU+W10gfVxuICB8IHsga2luZDogXCJ0cmFwXCIsIG1lc3NhZ2U6IHN0cmluZyB9XG4gIHwgeyBraW5kOiBcImxvZ1wiLCBtZXNzYWdlOiBzdHJpbmcsIHZhbHVlOiBFeHByPFwiaTMyXCI+IH1cbiAgfCB7IGtpbmQ6IFwiZXhwclwiLCBleHByOiBFeHByPE51bVR5cGU+IH1cblxuZXhwb3J0IHR5cGUgQmxvY2tIYW5kbGUgPSB7IGtpbmQ6IFwiYmxvY2tcIiwgaWQ6IG51bWJlciB9XG5leHBvcnQgdHlwZSBMb29wSGFuZGxlID0geyBraW5kOiBcImxvb3BcIiwgaWQ6IG51bWJlciB9XG50eXBlIENvbnRyb2xIYW5kbGUgPSBCbG9ja0hhbmRsZSB8IExvb3BIYW5kbGVcblxuY2xhc3MgTXV0YWJsZU1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IGV4dGVuZHMgRXhwck1ldGhvZHM8VD4ge1xuICBkZWNsYXJlIHR5cGU6IFRcbiAgZGVjbGFyZSB3cml0ZTogKHZhbHVlOiBFeHByPFQ+KSA9PiBTdG10XG4gIHNldCh2YWx1ZTogRXhwckxpa2U8VD4pIHsgcmV0dXJuIHRoaXMud3JpdGUobGl0KHRoaXMudHlwZSwgdmFsdWUpKSB9XG59XG50eXBlIE11dGFibGVBcml0aG1ldGljPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsgW09wIGluIEFyaXRobWV0aWNPcCBhcyBgaSR7T3B9YF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IFN0bXQgfVxudHlwZSBNdXRhYmxlSW50ZWdlcjxUIGV4dGVuZHMgSW50VHlwZT4gPSB7IFtPcCBpbiBcImFuZFwiIHwgXCJvclwiIHwgXCJ4b3JcIiBhcyBgaSR7T3B9YF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IFN0bXQgfVxuZXhwb3J0IHR5cGUgTXV0YWJsZVZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gJiB7IHNldCh2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10IH0gJiBNdXRhYmxlQXJpdGhtZXRpYzxUPiAmIChUIGV4dGVuZHMgSW50VHlwZSA/IE11dGFibGVJbnRlZ2VyPFQ+IDoge30pXG5leHBvcnQgdHlwZSBMb2NhbFZhcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSBNdXRhYmxlVmFsdWU8VD4gJiBMb2NhbE5vZGU8VD5cblxuZXhwb3J0IHR5cGUgQXJyYXlWYWx1ZTxUIGV4dGVuZHMgRFR5cGU+ID1cbiAgVCBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBNdXRhYmxlU3RydWN0PEY+IDpcbiAgVCBleHRlbmRzIE1lbW9yeVR5cGUgPyBNdXRhYmxlVmFsdWU8TG9hZGVkVHlwZTxUPj4gOiBuZXZlclxuZXhwb3J0IHR5cGUgQXJyYXlIYW5kbGU8VCBleHRlbmRzIERUeXBlPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IFRcbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBBcnJheVZhbHVlPFQ+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBCaXRTdG9yYWdlVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiIHwgXCJpMzJcIlxuZXhwb3J0IHR5cGUgQml0RmllbGQgPSByZWFkb25seSBbQml0U3RvcmFnZVR5cGUsIG51bWJlcl1cbmV4cG9ydCB0eXBlIFN0cnVjdFN0b3JhZ2VUeXBlID0gUGFja2VkVHlwZSB8IEludFR5cGVcbmV4cG9ydCB0eXBlIEZpZWxkVHlwZSA9IFN0cnVjdFN0b3JhZ2VUeXBlIHwgQml0RmllbGRcbmV4cG9ydCB0eXBlIFN0cnVjdEZpZWxkcyA9IFJlY29yZDxzdHJpbmcsIEZpZWxkVHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkU3RvcmFnZTxUIGV4dGVuZHMgRmllbGRUeXBlPiA9IFQgZXh0ZW5kcyByZWFkb25seSBbaW5mZXIgUyBleHRlbmRzIEJpdFN0b3JhZ2VUeXBlLCBudW1iZXJdID8gUyA6IEV4dHJhY3Q8VCwgTWVtb3J5VHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkVmFsdWU8VCBleHRlbmRzIEZpZWxkVHlwZT4gPSBMb2FkZWRUeXBlPEZpZWxkU3RvcmFnZTxUPj5cbmV4cG9ydCB0eXBlIEZpZWxkTGF5b3V0ID0geyBzdG9yYWdlOiBTdHJ1Y3RTdG9yYWdlVHlwZSwgYml0T2Zmc2V0OiBudW1iZXIsIGJpdHM6IG51bWJlciB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RUeXBlPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBraW5kOiBcInN0cnVjdFwiXG4gIGZpZWxkczogRlxuICBsYXlvdXQ6IHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH1cbiAgc2l6ZTogbnVtYmVyXG4gIHN0b3JhZ2U6IFwidThcIiB8IFwidTE2XCIgfCBJbnRUeXBlXG59XG50eXBlIFN0cnVjdE1lbWJlcnM8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7XG4gIFtLIGluIGtleW9mIEZdOiBFeHByPEZpZWxkVmFsdWU8RltLXT4+XG59XG50eXBlIE11dGFibGVTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogTXV0YWJsZVZhbHVlPEZpZWxkVmFsdWU8RltLXT4+XG59XG5leHBvcnQgdHlwZSBTdHJ1Y3RJbml0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogRXhwckxpa2U8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgSlNTdHJ1Y3Q8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7IFtLIGluIGtleW9mIEZdOiBWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PiB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RWYWx1ZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdE1lbWJlcnM8Rj4gJiB7IHBhY2tlZDogQW55RXhwciB9XG5leHBvcnQgdHlwZSBNdXRhYmxlU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gU3RydWN0VmFsdWU8Rj4gJiBNdXRhYmxlU3RydWN0TWVtYmVyczxGPiAmIHtcbiAgc2V0KHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPik6IFN0bXRcbn1cbmV4cG9ydCB0eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPlxuZXhwb3J0IHR5cGUgU3RtdEJvZHkgPSBTdG10IHwgU3RtdEJvZHlbXVxudHlwZSBDb250cm9sQm9keTxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4gPSBTdG10Qm9keSB8ICgoc2VsZjogSCkgPT4gU3RtdEJvZHkpXG5leHBvcnQgdHlwZSBGdW5jQm9keTxSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPVxuICBSIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8Uj4gfCBTdG10Qm9keSA6XG4gIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gfCBTdG10Qm9keSA6XG4gIFN0bXRCb2R5XG5leHBvcnQgdHlwZSBGdW5jSGFuZGxlPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPiA9IHtcbiAga2luZDogXCJmdW5jXCJcbiAgcGFyYW1zOiBBXG4gIHJlc3VsdDogUlxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj5cbiAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NMaWtlPEE+KSA9PlxuICAgIFIgZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxSPiA6XG4gICAgUiBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBTdHJ1Y3RWYWx1ZTxGPiA6XG4gICAgU3RtdFxufVxuXG5leHBvcnQgdHlwZSBBbnlGdW5jID0ge1xuICBraW5kOiBcImZ1bmNcIlxuICBwYXJhbXM6IHJlYWRvbmx5IE51bVR5cGVbXVxuICByZXN1bHQ6IFJlc3VsdFR5cGVcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBBbnlFeHByW10pID0+IGFueVxuICBjYWxsOiAoLi4uYXJnczogYW55W10pID0+IEFueUV4cHJcbn1cblxuZXhwb3J0IHR5cGUgQW55QXJyYXkgPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICB0eXBlOiBEVHlwZVxuICBsZW5ndGg6IG51bWJlclxuICBlbGVtZW50U2l6ZTogbnVtYmVyXG4gIGF0KC4uLmFyZ3M6IGFueVtdKTogYW55XG4gIG1vdmUoLi4uYXJnczogYW55W10pOiBTdG10XG59XG5cbmV4cG9ydCB0eXBlIE1vZHVsZURlZiA9IFJlY29yZDxzdHJpbmcsIEFueUZ1bmMgfCBBbnlBcnJheT5cbmV4cG9ydCB0eXBlIEZ1bmNEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlGdW5jPiB9XG5leHBvcnQgdHlwZSBBcnJheURlZnM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7IFtLIGluIGtleW9mIFQgYXMgVFtLXSBleHRlbmRzIEFueUFycmF5ID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlBcnJheT4gfVxuZXhwb3J0IHR5cGUgQ29tcGlsZVJlc3VsdDxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgW0sgaW4ga2V5b2YgVF06XG4gICAgVFtLXSBleHRlbmRzIEFueUZ1bmMgPyAoLi4uYXJnczogQXJnc1ZhbDxUW0tdW1wicGFyYW1zXCJdPikgPT5cbiAgICAgIFRbS11bXCJyZXN1bHRcIl0gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8VFtLXVtcInJlc3VsdFwiXT4gOlxuICAgICAgVFtLXVtcInJlc3VsdFwiXSBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBKU1N0cnVjdDxGPiA6XG4gICAgICB2b2lkXG4gICAgOiBUW0tdIGV4dGVuZHMgQXJyYXlIYW5kbGU8aW5mZXIgRD4gP1xuICAgICAgRCBleHRlbmRzIE1lbW9yeVR5cGUgPyBUeXBlZEFycmF5Rm9yPEQ+IDogVWludDhBcnJheSB8IFVpbnQxNkFycmF5IHwgVWludDMyQXJyYXkgfCBCaWdVaW50NjRBcnJheVxuICAgIDogbmV2ZXJcbn0gJiB7XG4gIG1vZDogV2ViQXNzZW1ibHkuTW9kdWxlXG4gIG1lbW9yeTogV2ViQXNzZW1ibHkuTWVtb3J5XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHJlc3VsdFN0cnVjdHM6IFJlY29yZDxzdHJpbmcsIFN0cnVjdFR5cGU8YW55Pj5cbn1cblxuXG5sZXQgbmV4dExvY2FsSWQgPSAwXG5sZXQgbmV4dENvbnRyb2xJZCA9IDBcblxuY29uc3QgaW5mZXJUeXBlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pID0+XG4gICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgXCJ0eXBlXCIgaW4gdmFsdWUgPyB2YWx1ZS50eXBlIDogXCJpMzJcIikgYXMgVFxuXG5jb25zdCBleHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPik6IEV4cHI8VD4gPT4ge1xuICByZXR1cm4gT2JqZWN0LnNldFByb3RvdHlwZU9mKG5vZGUsIEV4cHJNZXRob2RzLnByb3RvdHlwZSkgYXMgRXhwcjxUPlxufVxuXG5leHBvcnQgY29uc3QgbGl0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+IHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChcImtpbmRcIiBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlIGFzIEV4cHI8VD5cbiAgfVxuICByZXR1cm4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIFZhbHVlPFQ+IH0pXG59XG5jb25zdCBtdXRhYmxlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPiwgd3JpdGU6ICh2YWx1ZTogRXhwcjxUPikgPT4gU3RtdCkgPT5cbiAgT2JqZWN0LmFzc2lnbihPYmplY3Quc2V0UHJvdG90eXBlT2Yobm9kZSwgTXV0YWJsZU1ldGhvZHMucHJvdG90eXBlKSwgeyB3cml0ZSB9KSBhcyBNdXRhYmxlVmFsdWU8VD5cblxuY29uc3QgaXNTdG10ID0gKHg6IHVua25vd24pOiB4IGlzIFN0bXQgPT5cbiAgISF4ICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIFwia2luZFwiIGluIHggJiYgKFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiaWZcIiA/IEFycmF5LmlzQXJyYXkoKHggYXMgeyB0aGVuPzogdW5rbm93biB9KS50aGVuKSA6XG4gICAgIVtcImNvbnN0XCIsIFwibG9jYWwuZ2V0XCIsIFwiYmluXCIsIFwiY2FsbFwiLCBcImNhc3RcIiwgXCJsb2FkXCIsIFwiY21wXCJdLmluY2x1ZGVzKCh4IGFzIHsga2luZDogc3RyaW5nIH0pLmtpbmQpXG4gIClcblxuY29uc3Qgc3RtdExpc3QgPSAoYm9keTogU3RtdEJvZHkpOiBTdG10W10gPT4gQXJyYXkuaXNBcnJheShib2R5KSA/IGJvZHkuZmxhdE1hcChzdG10TGlzdCkgOiBbYm9keV1cbmV4cG9ydCBjb25zdCBhc1N0bXRzID0gPFIgZXh0ZW5kcyBSZXN1bHRUeXBlPihib2R5OiBGdW5jQm9keTxSPikgPT4gaXNTdG10KGJvZHkpID8gW2JvZHldIDogQXJyYXkuaXNBcnJheShib2R5KSA/IHN0bXRMaXN0KGJvZHkpIDogbnVsbFxuY29uc3QgYmluZFN0bXRzID0gKGJvZHk6IFN0bXRCb2R5LCBicjogbnVtYmVyLCBsb29wOiBudW1iZXIgfCBudWxsKTogU3RtdFtdID0+XG4gIHN0bXRMaXN0KGJvZHkpLm1hcChzID0+IGJpbmRTdG10KHMsIGJyLCBsb29wKSlcblxuY29uc3QgYmluZFN0bXQgPSAoczogU3RtdCwgYnI6IG51bWJlciwgbG9vcDogbnVtYmVyIHwgbnVsbCk6IFN0bXQgPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4geyAuLi5zLCB0aGVuOiBiaW5kU3RtdHMocy50aGVuLCBiciwgbG9vcCksIGVsc2U6IGJpbmRTdG10cyhzLmVsc2UsIGJyLCBsb29wKSB9XG4gICAgY2FzZSBcImJyZWFrXCI6IHJldHVybiB7IC4uLnMsIHRhcmdldDogcy50YXJnZXQgPz8gYnIgfVxuICAgIGNhc2UgXCJjb250aW51ZVwiOlxuICAgICAgaWYgKHMudGFyZ2V0ICE9IG51bGwpIHJldHVybiBzXG4gICAgICBpZiAobG9vcCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJjb250aW51ZVRvKCkgdXNlZCBvdXRzaWRlIGEgbG9vcFwiKVxuICAgICAgcmV0dXJuIHsgLi4ucywgdGFyZ2V0OiBsb29wIH1cbiAgICBkZWZhdWx0OiByZXR1cm4gc1xuICB9XG59XG5cbmNvbnN0IGNvbnRyb2xCb2R5ID0gPEggZXh0ZW5kcyBDb250cm9sSGFuZGxlPihzZWxmOiBILCBib2R5OiBDb250cm9sQm9keTxIPikgPT5cbiAgYmluZFN0bXRzKHR5cGVvZiBib2R5ID09PSBcImZ1bmN0aW9uXCIgPyBib2R5KHNlbGYpIDogYm9keSwgc2VsZi5pZCwgc2VsZi5raW5kID09PSBcImxvb3BcIiA/IHNlbGYuaWQgOiBudWxsKVxuXG5jb25zdCBiaW4gPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBBcml0aG1ldGljT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgZXhwcjxUPih7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQ8VD4obGVmdC50eXBlIGFzIFQsIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8VD4gfSBhcyBDb3JlRXhwcjxUPilcblxuY29uc3QgYml0ID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihvcDogQml0T3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgZXhwcjxUPih7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQ8VD4obGVmdC50eXBlIGFzIFQsIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8VD4gfSBhcyBDb3JlRXhwcjxUPilcblxuY29uc3QgcmVtYWluZGVyID0gPFQgZXh0ZW5kcyBJbnRUeXBlPihvcDogUmVtYWluZGVyT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT5cbiAgZXhwcjxUPih7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQ8VD4obGVmdC50eXBlIGFzIFQsIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8VD4gfSBhcyBDb3JlRXhwcjxUPilcblxuY29uc3QgY21wID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQ21wT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj4gPT5cbiAgZXhwcjxcImkzMlwiPih7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdDogbGVmdCBhcyB1bmtub3duIGFzIEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBsaXQ8VD4obGVmdC50eXBlIGFzIFQsIHJpZ2h0KSBhcyB1bmtub3duIGFzIEV4cHI8TnVtVHlwZT4gfSBhcyBDb3JlRXhwcjxcImkzMlwiPilcblxuZXhwb3J0IGNvbnN0IGFsbG9jYXRlTG9jYWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpID0+IGV4cHIoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbDogbmV4dExvY2FsSWQrKyB9KVxuXG5jb25zdCBta0xvY2FsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKTogTG9jYWxWYXI8VD4gPT4ge1xuICBjb25zdCBsb2NhbCA9IG5leHRMb2NhbElkKytcbiAgcmV0dXJuIG11dGFibGUoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbCB9LCB2YWx1ZSA9PiAoeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbCwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSkpIGFzIExvY2FsVmFyPFQ+XG59XG5cbmNvbnN0IG1rSGFuZGxlID0gPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPihcbiAgcGFyYW1zOiBBLFxuICByZXN1bHQ6IFIsXG4gIGJ1aWxkOiAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPixcbik6IEZ1bmNIYW5kbGU8QSwgUj4gPT4ge1xuICBsZXQgaGFuZGxlITogRnVuY0hhbmRsZTxBLCBSPlxuICBoYW5kbGUgPSB7XG4gICAga2luZDogXCJmdW5jXCIsXG4gICAgcGFyYW1zLCByZXN1bHQsIGJ1aWxkLFxuICAgIGNhbGw6ICguLi5hcmdzOiBBcmdzTGlrZTxBPikgPT4ge1xuICAgICAgY29uc3QgY2FsbEFyZ3MgPSBwYXJhbXMubWFwKCh0eXBlLCBpKSA9PiBsaXQodHlwZSwgYXJnc1tpXSBhcyBFeHByTGlrZTx0eXBlb2YgdHlwZT4pKSBhcyBFeHByPE51bVR5cGU+W11cbiAgICAgIGlmIChyZXN1bHQgPT09IFwidm9pZFwiKSByZXR1cm4geyBraW5kOiBcImNhbGwudm9pZFwiLCB0YXJnZXQ6IGhhbmRsZSwgYXJnczogY2FsbEFyZ3MgfVxuICAgICAgY29uc3QgdHlwZSA9ICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiID8gcmVzdWx0IDogcmVzdWx0LnN0b3JhZ2UgPT09IFwiaTY0XCIgPyBcImk2NFwiIDogXCJpMzJcIikgYXMgTnVtVHlwZVxuICAgICAgY29uc3QgY2FsbCA9IGV4cHIoeyBraW5kOiBcImNhbGxcIiwgdHlwZSwgdGFyZ2V0OiBoYW5kbGUsIGFyZ3M6IGNhbGxBcmdzIH0pXG4gICAgICByZXR1cm4gdHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIiA/IGNhbGwgOiByZWFkU3RydWN0KHJlc3VsdCwgY2FsbClcbiAgICB9LFxuICB9IGFzIEZ1bmNIYW5kbGU8QSwgUj5cbiAgcmV0dXJuIGhhbmRsZVxufVxuXG5jb25zdCBsb2FkZWRUeXBlID0gPFQgZXh0ZW5kcyBNZW1vcnlUeXBlPih0eXBlOiBUKSA9PlxuICAodHlwZSA9PT0gXCJpOFwiIHx8IHR5cGUgPT09IFwidThcIiB8fCB0eXBlID09PSBcImkxNlwiIHx8IHR5cGUgPT09IFwidTE2XCIgPyBcImkzMlwiIDogdHlwZSkgYXMgTG9hZGVkVHlwZTxUPlxuXG5jb25zdCBzdG9yYWdlU2l6ZTogUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4gPSB7IGk4OiAxLCB1ODogMSwgaTE2OiAyLCB1MTY6IDIsIGkzMjogNCwgZjMyOiA0LCBpNjQ6IDgsIGY2NDogOCB9XG5jb25zdCBtZW1vcnlWYWx1ZSA9IDxUIGV4dGVuZHMgTWVtb3J5VHlwZT4oYXJyYXk6IEFueUFycmF5LCBpbmRleDogRXhwckxpa2U8XCJpMzJcIj4sIHN0b3JhZ2U6IFQsIHN0cmlkZTogbnVtYmVyLCBvZmZzZXQgPSAwKSA9PiB7XG4gIGNvbnN0IGF0ID0gbGl0KFwiaTMyXCIsIGluZGV4KVxuICByZXR1cm4gbXV0YWJsZSh7IGtpbmQ6IFwibG9hZFwiLCB0eXBlOiBsb2FkZWRUeXBlKHN0b3JhZ2UpLCBhcnJheSwgaW5kZXg6IGF0LCBzdG9yYWdlLCBzdHJpZGUsIG9mZnNldCB9LCB2YWx1ZSA9PlxuICAgICh7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXksIHR5cGU6IHN0b3JhZ2UsIGluZGV4OiBhdCwgc3RyaWRlLCBvZmZzZXQsIHZhbHVlOiB2YWx1ZSBhcyBFeHByPE51bVR5cGU+IH0pKVxufVxuXG50eXBlIFN0cnVjdEJhY2tpbmcgPSBhbnlcbnR5cGUgSW50ZXJuYWxTdHJ1Y3Q8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSBNdXRhYmxlU3RydWN0PEY+ICYgeyBwYWNrZWQ6IFN0cnVjdEJhY2tpbmcgfVxuXG5jb25zdCByZWFkRmllbGQgPSAoYmFja2luZzogQW55RXhwciwgZmllbGQ6IEZpZWxkTGF5b3V0KSA9PiB7XG4gIGNvbnN0IHsgYml0cyB9ID0gZmllbGRcbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBiYWNraW5nXG4gIGlmIChiYWNraW5nLnR5cGUgPT09IFwiaTY0XCIpIHtcbiAgICBjb25zdCBiaXRPZmZzZXQgPSBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSwgbWFzayA9ICgxbiA8PCBCaWdJbnQoYml0cykpIC0gMW5cbiAgICBjb25zdCByYXcgPSBpMzIoYmFja2luZy5zaHIoYml0T2Zmc2V0KS5hbmQobWFzaykpXG4gICAgcmV0dXJuIGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgYml0cyA8IDMyXG4gICAgICA/IGlmRWxzZShyYXcuYW5kKDIgKiogKGJpdHMgLSAxKSksIHJhdy5zdWIoMiAqKiBiaXRzKSwgcmF3KVxuICAgICAgOiByYXdcbiAgfVxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpMzJcIiAmJiBmaWVsZC5iaXRPZmZzZXQgPT09IDApIHJldHVybiBiYWNraW5nXG4gIGNvbnN0IG1hc2sgPSAyICoqIGJpdHMgLSAxXG4gIGNvbnN0IHJhdyA9IGJhY2tpbmcuc2hyKGZpZWxkLmJpdE9mZnNldCkuYW5kKG1hc2spXG4gIHJldHVybiBmaWVsZC5zdG9yYWdlLnN0YXJ0c1dpdGgoXCJpXCIpICYmIGJpdHMgPCAzMlxuICAgID8gaWZFbHNlKHJhdy5hbmQoMiAqKiAoYml0cyAtIDEpKSwgcmF3LnN1YigyICoqIGJpdHMpLCByYXcpXG4gICAgOiByYXdcbn1cblxuY29uc3QgcGFja2VkRmllbGRWYWx1ZSA9IChiYWNraW5nOiBTdHJ1Y3RCYWNraW5nLCBmaWVsZDogRmllbGRMYXlvdXQpID0+IHtcbiAgY29uc3QgdmFsdWUgPSByZWFkRmllbGQoYmFja2luZywgZmllbGQpXG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiKSByZXR1cm4gYmFja2luZ1xuICBpZiAoYmFja2luZy50eXBlID09PSBcImk2NFwiKSB7XG4gICAgY29uc3QgYml0T2Zmc2V0ID0gQmlnSW50KGZpZWxkLmJpdE9mZnNldCksIG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgY29uc3QgZmllbGRNYXNrID0gbWFzayA8PCBiaXRPZmZzZXRcbiAgICByZXR1cm4gbXV0YWJsZTxcImkzMlwiPih2YWx1ZSBhcyBFeHByPFwiaTMyXCI+LCBpbnB1dCA9PiBiYWNraW5nLnNldChiYWNraW5nLmFuZCh+ZmllbGRNYXNrKS5vcihpNjR1KGlucHV0KS5hbmQobWFzaykuc2hsKGJpdE9mZnNldCkpKSlcbiAgfVxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpMzJcIiAmJiBmaWVsZC5iaXRPZmZzZXQgPT09IDApIHJldHVybiBiYWNraW5nXG4gIGNvbnN0IG1hc2sgPSAyICoqIGZpZWxkLmJpdHMgLSAxLCBmaWVsZE1hc2sgPSBtYXNrIDw8IGZpZWxkLmJpdE9mZnNldFxuICByZXR1cm4gbXV0YWJsZTxcImkzMlwiPih2YWx1ZSwgaW5wdXQgPT4gYmFja2luZy5zZXQoYmFja2luZy5hbmQofmZpZWxkTWFzaykub3IoaW5wdXQuYW5kKG1hc2spLnNobChmaWVsZC5iaXRPZmZzZXQpKSkpXG59XG5cbmNvbnN0IHJlYWRTdHJ1Y3QgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgcGFja2VkOiBBbnlFeHByKTogU3RydWN0VmFsdWU8Rj4gPT5cbiAgT2JqZWN0LmFzc2lnbihPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmtleXModHlwZS5maWVsZHMpLm1hcChuYW1lID0+IFtuYW1lLCByZWFkRmllbGQocGFja2VkLCB0eXBlLmxheW91dFtuYW1lXSEpXSkpLCB7IHBhY2tlZCB9KSBhcyBTdHJ1Y3RWYWx1ZTxGPlxuXG5jb25zdCBzdHJ1Y3RWYWx1ZSA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCBwYWNrZWQ6IFN0cnVjdEJhY2tpbmcpOiBNdXRhYmxlU3RydWN0PEY+ID0+IHtcbiAgY29uc3QgZmllbGRzID0gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5tYXAobmFtZSA9PiBbbmFtZSwgcGFja2VkRmllbGRWYWx1ZShwYWNrZWQsIHR5cGUubGF5b3V0W25hbWVdISldKSlcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oZmllbGRzLCB7IHBhY2tlZCwgc2V0OiAodmFsdWU6IE11dGFibGVTdHJ1Y3Q8Rj4gfCBTdHJ1Y3RJbml0PEY+KSA9PlxuICAgIHBhY2tlZC5zZXQoXCJwYWNrZWRcIiBpbiB2YWx1ZSA/ICh2YWx1ZSBhcyBJbnRlcm5hbFN0cnVjdDxGPikucGFja2VkIDogcGFja1N0cnVjdCh0eXBlLCB2YWx1ZSkpIH0pIGFzIEludGVybmFsU3RydWN0PEY+XG59XG5cbmNvbnN0IHBhY2tTdHJ1Y3QgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgdmFsdWVzOiBTdHJ1Y3RJbml0PEY+KTogQW55RXhwciA9PiB7XG4gIGlmICh0eXBlLnN0b3JhZ2UgIT09IFwiaTY0XCIpIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykucmVkdWNlKChwYWNrZWQsIG5hbWUpID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IHR5cGUubGF5b3V0W25hbWVdISwgdmFsdWUgPSB2YWx1ZXNbbmFtZV0hXG4gICAgY29uc3QgbWFzayA9IDIgKiogZmllbGQuYml0cyAtIDFcbiAgICByZXR1cm4gcGFja2VkLm9yKGxpdChcImkzMlwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImkzMlwiPikuYW5kKG1hc2spLnNobChmaWVsZC5iaXRPZmZzZXQpKVxuICB9LCBpMzIoMCkpXG4gIHJldHVybiBPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykucmVkdWNlKChwYWNrZWQsIG5hbWUpID0+IHtcbiAgICBjb25zdCBmaWVsZCA9IHR5cGUubGF5b3V0W25hbWVdISwgdmFsdWUgPSB2YWx1ZXNbbmFtZV0hXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBsaXQoXCJpNjRcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpNjRcIj4pXG4gICAgY29uc3QgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICByZXR1cm4gcGFja2VkLm9yKGk2NHUobGl0KFwiaTMyXCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTMyXCI+KSkuYW5kKG1hc2spLnNobChCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkpXG4gIH0sIGk2NCgwbikpXG59XG5cbmV4cG9ydCBjb25zdCBzdHJ1Y3QgPSA8Y29uc3QgRiBleHRlbmRzIFN0cnVjdEZpZWxkcz4oZmllbGRzOiBGKTogU3RydWN0VHlwZTxGPiA9PiB7XG4gIGlmIChcInNldFwiIGluIGZpZWxkcyB8fCBcInBhY2tlZFwiIGluIGZpZWxkcykgdGhyb3cgbmV3IEVycm9yKFwiU3RydWN0IGZpZWxkcyBjYW5ub3QgYmUgbmFtZWQgc2V0IG9yIHBhY2tlZFwiKVxuICBsZXQgdXNlZCA9IDBcbiAgY29uc3QgbGF5b3V0OiBQYXJ0aWFsPFJlY29yZDxrZXlvZiBGLCBGaWVsZExheW91dD4+ID0ge31cbiAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKGZpZWxkcykgYXMgKGtleW9mIEYpW10pIHtcbiAgICBjb25zdCBmaWVsZCA9IGZpZWxkc1tuYW1lXSFcbiAgICBjb25zdCBzdG9yYWdlID0gKEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGRbMF0gOiBmaWVsZCkgYXMgU3RydWN0U3RvcmFnZVR5cGVcbiAgICBjb25zdCBiaXRzID0gQXJyYXkuaXNBcnJheShmaWVsZCkgPyBmaWVsZFsxXSA6IHN0b3JhZ2VTaXplW3N0b3JhZ2VdICogOFxuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihiaXRzKSB8fCBiaXRzIDwgMSB8fCBiaXRzID4gc3RvcmFnZVNpemVbc3RvcmFnZV0gKiA4KSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgJHtzdG9yYWdlfSBiaXQtZmllbGQgd2lkdGggJHtiaXRzfWApXG4gICAgaWYgKHVzZWQgKyBiaXRzID4gNjQpIHRocm93IG5ldyBFcnJvcihgU3RydWN0IHJlcXVpcmVzICR7dXNlZCArIGJpdHN9IGJpdHM7IG1heGltdW0gaXMgNjRgKVxuICAgIGxheW91dFtuYW1lXSA9IHsgc3RvcmFnZSwgYml0T2Zmc2V0OiB1c2VkLCBiaXRzIH1cbiAgICB1c2VkICs9IGJpdHNcbiAgfVxuICBjb25zdCBzdG9yYWdlID0gdXNlZCA8PSA4ID8gXCJ1OFwiIDogdXNlZCA8PSAxNiA/IFwidTE2XCIgOiB1c2VkIDw9IDMyID8gXCJpMzJcIiA6IFwiaTY0XCJcbiAgcmV0dXJuIHsga2luZDogXCJzdHJ1Y3RcIiwgZmllbGRzLCBsYXlvdXQ6IGxheW91dCBhcyB7IFtLIGluIGtleW9mIEZdOiBGaWVsZExheW91dCB9LCBzdG9yYWdlLCBzaXplOiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSB9XG59XG5cbmNvbnN0IGNhc3QgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiBFeHByPE51bVR5cGU+LCB1bnNpZ25lZCA9IGZhbHNlKTogRXhwcjxUPiA9PlxuICB2YWx1ZS50eXBlID09PSB0eXBlID8gdmFsdWUgYXMgdW5rbm93biBhcyBFeHByPFQ+IDogZXhwcjxUPih7IGtpbmQ6IFwiY2FzdFwiLCB0eXBlLCBpbnB1dFR5cGU6IHZhbHVlLnR5cGUsIHVuc2lnbmVkLCB2YWx1ZSB9IGFzIENvcmVFeHByPFQ+KVxuY29uc3QgbnVtYmVyID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogdW5rbm93bik6IEV4cHI8VD4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSAodHlwZSA9PT0gXCJpNjRcIiA/IFwiYmlnaW50XCIgOiBcIm51bWJlclwiKVxuICAgID8gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZSwgdmFsdWUgfSBhcyBDb3JlRXhwcjxUPilcbiAgICA6IGNhc3QodHlwZSwgdmFsdWUgYXMgRXhwcjxOdW1UeXBlPilcblxuZXhwb3J0IGZ1bmN0aW9uIGkzMih2YWx1ZTogbnVtYmVyKTogRXhwcjxcImkzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGkzMjxUIGV4dGVuZHMgSW50VHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiaTMyXCI+XG5leHBvcnQgZnVuY3Rpb24gaTMyKHZhbHVlOiB1bmtub3duKSB7IHJldHVybiBudW1iZXIoXCJpMzJcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGk2NCh2YWx1ZTogYmlnaW50KTogRXhwcjxcImk2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGk2NDxUIGV4dGVuZHMgSW50VHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiaTY0XCI+XG5leHBvcnQgZnVuY3Rpb24gaTY0KHZhbHVlOiB1bmtub3duKSB7IHJldHVybiBudW1iZXIoXCJpNjRcIiwgdmFsdWUpIH1cbmV4cG9ydCBjb25zdCBpNjR1ID0gKHZhbHVlOiBFeHByPFwiaTMyXCI+KSA9PiBjYXN0KFwiaTY0XCIsIHZhbHVlIGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiwgdHJ1ZSlcblxudHlwZSBGMzJJbnB1dCA9IG51bWJlciB8IEV4cHI8XCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzIodmFsdWU6IG51bWJlcik6IEV4cHI8XCJmMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzI8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImYzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMih2YWx1ZTogRjMySW5wdXQpIHsgcmV0dXJuIG51bWJlcihcImYzMlwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgZnVuY3Rpb24gZjY0KHZhbHVlOiBudW1iZXIpOiBFeHByPFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjY0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmNjQodmFsdWU6IEYzMklucHV0KSB7IHJldHVybiBudW1iZXIoXCJmNjRcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGlmRWxzZTxUIGV4dGVuZHMgTnVtVHlwZT4oY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZV86IEV4cHI8VD4pOiBFeHByPFQ+XG5leHBvcnQgZnVuY3Rpb24gaWZFbHNlKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IFN0bXRCb2R5LCBlbHNlXz86IFN0bXRCb2R5KTogU3RtdFxuZXhwb3J0IGZ1bmN0aW9uIGlmRWxzZTxUIGV4dGVuZHMgTnVtVHlwZT4oY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiB8IFN0bXRCb2R5LCBlbHNlXz86IEV4cHI8VD4gfCBTdG10Qm9keSk6IEV4cHI8VD4gfCBTdG10IHtcbiAgcmV0dXJuIGlzU3RtdCh0aGVuKSB8fCBBcnJheS5pc0FycmF5KHRoZW4pXG4gICAgPyB7IGtpbmQ6IFwiaWZcIiwgY29uZCwgdGhlbjogc3RtdExpc3QodGhlbiBhcyBTdG10Qm9keSksIGVsc2U6IGVsc2VfID09PSB1bmRlZmluZWQgPyBbXSA6IHN0bXRMaXN0KGVsc2VfIGFzIFN0bXRCb2R5KSB9XG4gICAgOiBleHByPFQ+KHsga2luZDogXCJpZlwiLCB0eXBlOiB0aGVuLnR5cGUsIGNvbmQsIHRoZW4sIGVsc2U6IGVsc2VfIGFzIEV4cHI8VD4gfSBhcyBDb3JlRXhwcjxUPilcbn1cblxuY29uc3QgYXJpdGhtZXRpYyA9IE9iamVjdC5mcm9tRW50cmllcyhhcml0aG1ldGljT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4ob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBBcml0aG1ldGljT3BdOiA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCBiaXRzID0gT2JqZWN0LmZyb21FbnRyaWVzKGJpdE9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYml0KG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQml0T3BdOiA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCByZW1haW5kZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKHJlbWFpbmRlck9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gcmVtYWluZGVyKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gUmVtYWluZGVyT3BdOiA8VCBleHRlbmRzIEludFR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5jb25zdCBjb21wYXJpc29ucyA9IE9iamVjdC5mcm9tRW50cmllcyhjbXBPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIENtcE9wXTogPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxuXG5mb3IgKGNvbnN0IG9wIG9mIGFyaXRobWV0aWNPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxOdW1UeXBlPikgeyByZXR1cm4gYXJpdGhtZXRpY1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBiaXRPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8SW50VHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxJbnRUeXBlPikgeyByZXR1cm4gYml0c1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiByZW1haW5kZXJPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8SW50VHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxJbnRUeXBlPikgeyByZXR1cm4gcmVtYWluZGVyc1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBjbXBPcHMpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeHByTWV0aG9kcy5wcm90b3R5cGUsIG9wLCB7XG4gIHZhbHVlKHRoaXM6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByTGlrZTxOdW1UeXBlPikgeyByZXR1cm4gY29tcGFyaXNvbnNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgWy4uLmFyaXRobWV0aWNPcHMsIFwiYW5kXCIsIFwib3JcIiwgXCJ4b3JcIl0gYXMgY29uc3QpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNdXRhYmxlTWV0aG9kcy5wcm90b3R5cGUsIGBpJHtvcH1gLCB7XG4gIHZhbHVlKHRoaXM6IE11dGFibGVWYWx1ZTxhbnk+LCByaWdodDogYW55KSB7IHJldHVybiB0aGlzLnNldCgodGhpcyBhcyBhbnkpW29wXShyaWdodCkpIH0sXG59KVxuXG5leHBvcnQgY29uc3QgeyBhZGQsIHN1YiwgbXVsLCBkaXYgfSA9IGFyaXRobWV0aWNcbmV4cG9ydCBjb25zdCB7IGFuZCwgb3IsIHhvciwgc2hsLCBzaHIgfSA9IGJpdHNcbmV4cG9ydCBjb25zdCB7IG1vZCwgdW1vZCB9ID0gcmVtYWluZGVyc1xuZXhwb3J0IGNvbnN0IHsgZXEsIGx0LCBndCB9ID0gY29tcGFyaXNvbnNcblxuZXhwb3J0IGNvbnN0IGZ1bmMgPSA8Y29uc3QgQSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIFJlc3VsdFR5cGU+KHBhcmFtczogQSwgcmVzdWx0OiBSLCBidWlsZDogKC4uLmFyZ3M6IEFyZ3NFeHByPEE+KSA9PiBGdW5jQm9keTxSPikgPT5cbiAgbWtIYW5kbGUocGFyYW1zLCByZXN1bHQsIGJ1aWxkIGFzICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+KVxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5PFQgZXh0ZW5kcyBEVHlwZT4odHlwZTogVCwgbGVuZ3RoOiBudW1iZXIpOiBBcnJheUhhbmRsZTxUPiB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihsZW5ndGgpIHx8IGxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXJyYXkgbGVuZ3RoICR7bGVuZ3RofWApXG4gIGNvbnN0IHN0cnVjdCA9IHR5cGVvZiB0eXBlID09PSBcIm9iamVjdFwiID8gdHlwZSA6IG51bGxcbiAgY29uc3Qgc3RvcmFnZTogTWVtb3J5VHlwZSA9IHN0cnVjdCA/IHN0cnVjdC5zdG9yYWdlIDogdHlwZSBhcyBNZW1vcnlUeXBlXG4gIGNvbnN0IGVsZW1lbnRTaXplID0gc3RydWN0ID8gc3RydWN0LnNpemUgOiBzdG9yYWdlU2l6ZVtzdG9yYWdlXVxuICBsZXQgaGFuZGxlOiBBbnlBcnJheVxuICBoYW5kbGUgPSB7XG4gICAga2luZDogXCJhcnJheVwiLCB0eXBlLCBsZW5ndGgsIGVsZW1lbnRTaXplLFxuICAgIGF0OiBpbmRleCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG1lbW9yeVZhbHVlKGhhbmRsZSwgaW5kZXgsIHN0b3JhZ2UsIGVsZW1lbnRTaXplKVxuICAgICAgcmV0dXJuIHN0cnVjdCA/IHN0cnVjdFZhbHVlKHN0cnVjdCwgdmFsdWUpIDogdmFsdWVcbiAgICB9LFxuICAgIG1vdmU6ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+ICh7IGtpbmQ6IFwiYXJyYXkubW92ZVwiLCBhcnJheTogaGFuZGxlLCB0YXJnZXQ6IGxpdChcImkzMlwiLCB0YXJnZXQpLCBzb3VyY2U6IGxpdChcImkzMlwiLCBzb3VyY2UpLCBjb3VudDogbGl0KFwiaTMyXCIsIGNvdW50KSB9KSxcbiAgfVxuICByZXR1cm4gaGFuZGxlIGFzIEFycmF5SGFuZGxlPFQ+XG59XG5cbmNvbnN0IG1rU3RydWN0TG9jYWwgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPikgPT5cbiAgc3RydWN0VmFsdWUodHlwZSwgbWtMb2NhbCh0eXBlLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyBcImk2NFwiIDogXCJpMzJcIikpXG5cbnR5cGUgTG9jYWxGYWN0b3J5ID0ge1xuICA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiBMb2NhbFZhcjxUPlxuICA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPik6IE11dGFibGVTdHJ1Y3Q8Rj5cbn1cblxuZXhwb3J0IGNvbnN0IGxvY2FsID0gKDxUIGV4dGVuZHMgTnVtVHlwZSwgRiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogVCB8IFN0cnVjdFR5cGU8Rj4pID0+XG4gIHR5cGVvZiB0eXBlID09PSBcInN0cmluZ1wiID8gbWtMb2NhbCh0eXBlKSA6IG1rU3RydWN0TG9jYWwodHlwZSkpIGFzIExvY2FsRmFjdG9yeVxuXG5leHBvcnQgZnVuY3Rpb24gcmV0KCk6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiByZXQ8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiByZXQodmFsdWU6IHsgcGFja2VkOiBBbnlFeHByIH0pOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZT86IEV4cHJMaWtlPFQ+IHwgeyBwYWNrZWQ6IEFueUV4cHIgfSk6IFN0bXQge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHsga2luZDogXCJyZXR1cm5cIiB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgXCJwYWNrZWRcIiBpbiB2YWx1ZSkgcmV0dXJuIHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU6IHZhbHVlLnBhY2tlZCB9XG4gIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiBsaXQoaW5mZXJUeXBlKHZhbHVlKSwgdmFsdWUpIGFzIEV4cHI8TnVtVHlwZT4gfVxufVxuZXhwb3J0IGNvbnN0IHRyYXAgPSAobWVzc2FnZTogc3RyaW5nKTogU3RtdCA9PiAoeyBraW5kOiBcInRyYXBcIiwgbWVzc2FnZSB9KVxuZXhwb3J0IGNvbnN0IGJvdW5kc0NoZWNrID0gKGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCBjb3VudDogRXhwckxpa2U8XCJpMzJcIj4gPSAxKTogU3RtdCA9PiB7XG4gIGNvbnN0IGkgPSBsaXQoXCJpMzJcIiwgaW5kZXgpLCBuID0gbGl0KFwiaTMyXCIsIGNvdW50KVxuICByZXR1cm4gaWZFbHNlKGkubHQoMCkub3Iobi5sdCgwKSkub3Iobi5ndChhcnJheS5sZW5ndGgpKS5vcihpLmd0KGkzMihhcnJheS5sZW5ndGgpLnN1YihuKSkpLCB0cmFwKFwiYXJyYXkgYm91bmRzIGV4Y2VlZGVkXCIpKVxufVxuZXhwb3J0IGNvbnN0IGxvZyA9IChtZXNzYWdlOiBzdHJpbmcsIHZhbHVlOiBFeHByTGlrZTxcImkzMlwiPik6IFN0bXQgPT4gKHsga2luZDogXCJsb2dcIiwgbWVzc2FnZSwgdmFsdWU6IGxpdChcImkzMlwiLCB2YWx1ZSkgfSlcbmV4cG9ydCBjb25zdCBibG9jayA9IChib2R5OiBDb250cm9sQm9keTxCbG9ja0hhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogQmxvY2tIYW5kbGUgPSB7IGtpbmQ6IFwiYmxvY2tcIiwgaWQ6IG5leHRDb250cm9sSWQrKyB9XG4gIHJldHVybiB7IGtpbmQ6IFwiYmxvY2tcIiwgY29udHJvbDogc2VsZi5pZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuZXhwb3J0IGNvbnN0IGxvb3AgPSAoY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogQ29udHJvbEJvZHk8TG9vcEhhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogc2VsZi5pZCwgY29uZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuXG5leHBvcnQgY29uc3QgYnJlYWtUbyA9ICh0YXJnZXQ/OiBDb250cm9sSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgY29udGludWVUbyA9ICh0YXJnZXQ/OiBMb29wSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgZXhwclN0bXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogU3RtdCA9PiAoeyBraW5kOiBcImV4cHJcIiwgZXhwcjogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KVxuIiwKICAgICJpbXBvcnQge1xuICBhbGxvY2F0ZUxvY2FsLCBhc1N0bXRzLFxuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUZ1bmMsIHR5cGUgQXJyYXlEZWZzLCB0eXBlIEV4cHIsXG4gIHR5cGUgRnVuY0JvZHksIHR5cGUgRnVuY0RlZnMsIHR5cGUgTW9kdWxlRGVmLCB0eXBlIE51bVR5cGUsIHR5cGUgUmVzdWx0VHlwZSxcbn0gZnJvbSBcIi4vYXN0XCJcblxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuZXhwb3J0IHR5cGUgQXJyYXlMYXlvdXQgPSB7IGxlbmd0aDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgZWxlbWVudFNpemU6IG51bWJlciB9XG5leHBvcnQgdHlwZSBNb2R1bGVBbmFseXNpczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgZnVuY3M6IEZ1bmNEZWZzPFQ+XG4gIGFycmF5czogQXJyYXlEZWZzPFQ+XG4gIGZFbnRyaWVzOiBba2V5b2YgRnVuY0RlZnM8VD4gJiBzdHJpbmcsIEZ1bmNEZWZzPFQ+W2tleW9mIEZ1bmNEZWZzPFQ+XV1bXVxuICBidWlsdEZ1bmNzOiBCdWlsdEZ1bmNbXVxuICBmaXg6IE1hcDxBbnlGdW5jLCBudW1iZXI+XG4gIGxheW91dHM6IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHBhZ2VzOiBudW1iZXJcbn1cblxudHlwZSBWaXNpdG9ycyA9IHtcbiAgbG9jYWw/OiAoaWQ6IG51bWJlciwgdHlwZTogTnVtVHlwZSkgPT4gdm9pZFxuICBhcnJheT86IChhcnJheTogQW55QXJyYXkpID0+IHZvaWRcbiAgZnVuYz86IChmdW5jOiBBbnlGdW5jKSA9PiB2b2lkXG4gIHRyYXA/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG4gIGxvZz86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbn1cbmNvbnN0IHdhbGsgPSAobm9kZTogYW55LCBmbnM6IFZpc2l0b3JzKTogdm9pZCA9PiB7XG4gIGlmIChub2RlID09IG51bGwpIHJldHVyblxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkgcmV0dXJuIG5vZGUuZm9yRWFjaCh4ID0+IHdhbGsoeCwgZm5zKSlcbiAgY29uc3QgY2hpbGRyZW4gPSAoLi4udmFsdWVzOiBhbnlbXSkgPT4gdmFsdWVzLmZvckVhY2goeCA9PiB3YWxrKHgsIGZucykpXG4gIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6IGNhc2UgXCJicmVha1wiOiBjYXNlIFwiY29udGludWVcIjogcmV0dXJuXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOiBmbnMubG9jYWw/Lihub2RlLmxvY2FsLCBub2RlLnR5cGUpOyByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6IGZucy5sb2NhbD8uKG5vZGUubG9jYWwsIG5vZGUudHlwZSk7IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiYmluXCI6IGNhc2UgXCJjbXBcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUubGVmdCwgbm9kZS5yaWdodClcbiAgICBjYXNlIFwiY2FsbFwiOiBjYXNlIFwiY2FsbC52b2lkXCI6IGZucy5mdW5jPy4obm9kZS50YXJnZXQpOyByZXR1cm4gd2Fsayhub2RlLmFyZ3MsIGZucylcbiAgICBjYXNlIFwiY2FzdFwiOiBjYXNlIFwicmV0dXJuXCI6IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUuY29uZCwgbm9kZS50aGVuLCBub2RlLmVsc2UpXG4gICAgY2FzZSBcImxvYWRcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiB3YWxrKG5vZGUuaW5kZXgsIGZucylcbiAgICBjYXNlIFwiYXJyYXkuc3RvcmVcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiBjaGlsZHJlbihub2RlLmluZGV4LCBub2RlLnZhbHVlKVxuICAgIGNhc2UgXCJhcnJheS5tb3ZlXCI6IGZucy5hcnJheT8uKG5vZGUuYXJyYXkpOyByZXR1cm4gY2hpbGRyZW4obm9kZS50YXJnZXQsIG5vZGUuc291cmNlLCBub2RlLmNvdW50KVxuICAgIGNhc2UgXCJibG9ja1wiOiByZXR1cm4gd2Fsayhub2RlLmJvZHksIGZucylcbiAgICBjYXNlIFwibG9vcFwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5jb25kLCBub2RlLmJvZHkpXG4gICAgY2FzZSBcInRyYXBcIjogZm5zLnRyYXA/Lihub2RlLm1lc3NhZ2UpOyByZXR1cm5cbiAgICBjYXNlIFwibG9nXCI6IGZucy5sb2c/Lihub2RlLm1lc3NhZ2UpOyByZXR1cm4gd2Fsayhub2RlLnZhbHVlLCBmbnMpXG4gICAgY2FzZSBcImV4cHJcIjogcmV0dXJuIHdhbGsobm9kZS5leHByLCBmbnMpXG4gICAgZGVmYXVsdDogZGllKG5vZGUpXG4gIH1cbn1cblxuXG5jb25zdCBhcnJheUxheW91dHMgPSAoYXJyYXlzOiBBbnlBcnJheVtdKSA9PiB7XG4gIGxldCBvZmZzZXQgPSAwXG4gIGNvbnN0IGxheW91dHMgPSBuZXcgTWFwPEFueUFycmF5LCBBcnJheUxheW91dD4oKVxuICBmb3IgKGNvbnN0IGFyciBvZiBhcnJheXMpIHtcbiAgICBjb25zdCBhbGlnbiA9IE1hdGgubWluKGFyci5lbGVtZW50U2l6ZSwgOClcbiAgICBvZmZzZXQgPSBNYXRoLmNlaWwob2Zmc2V0IC8gYWxpZ24pICogYWxpZ25cbiAgICBsYXlvdXRzLnNldChhcnIsIHsgbGVuZ3RoOiBhcnIubGVuZ3RoLCBvZmZzZXQsIGVsZW1lbnRTaXplOiBhcnIuZWxlbWVudFNpemUgfSlcbiAgICBvZmZzZXQgKz0gYXJyLmxlbmd0aCAqIGFyci5lbGVtZW50U2l6ZVxuICB9XG4gIHJldHVybiB7IGxheW91dHMsIGJ5dGVzOiBvZmZzZXQgfVxufVxuXG5leHBvcnQgdHlwZSBCdWlsdEZ1bmMgPSB7XG4gIGZ1bmM6IEFueUZ1bmNcbiAgYnVpbHQ6IEZ1bmNCb2R5PFJlc3VsdFR5cGU+XG4gIGxvY2FsczogW251bWJlciwgTnVtVHlwZV1bXVxuICBsb2NhbEluZGV4ZXM6IFJlY29yZDxudW1iZXIsIG51bWJlcj5cbiAgZnVuY3Rpb25zOiBBbnlGdW5jW11cbiAgYXJyYXlzOiBBbnlBcnJheVtdXG4gIHRyYXBzOiBzdHJpbmdbXVxuICBsb2dzOiBzdHJpbmdbXVxufVxuXG5jb25zdCBidWlsZEZ1bmMgPSAoZnVuYzogQW55RnVuYyk6IEJ1aWx0RnVuYyA9PiB7XG4gIGNvbnN0IHBhcmFtcyA9IGZ1bmMucGFyYW1zLm1hcCh0eXBlID0+IGFsbG9jYXRlTG9jYWwodHlwZSkpIGFzIEV4cHI8TnVtVHlwZT5bXVxuICBjb25zdCBwYXJhbUlkcyA9IHBhcmFtcy5tYXAocCA9PiBwLmtpbmQgPT09IFwibG9jYWwuZ2V0XCIgPyBwLmxvY2FsIDogLTEpXG4gIGNvbnN0IHJlc3VsdCA9IGZ1bmMuYnVpbGQoLi4ucGFyYW1zKVxuICBjb25zdCBidWlsdCA9IHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIiAmJiAhYXNTdG10cyhyZXN1bHQpID8gcmVzdWx0LnBhY2tlZCA6IHJlc3VsdFxuICBjb25zdCBmb3VuZCA9IG5ldyBNYXA8bnVtYmVyLCBOdW1UeXBlPigpXG4gIGNvbnN0IGZ1bmN0aW9ucyA9IG5ldyBTZXQ8QW55RnVuYz4oKSwgYXJyYXlzID0gbmV3IFNldDxBbnlBcnJheT4oKSwgdHJhcHMgPSBuZXcgU2V0PHN0cmluZz4oKSwgbG9ncyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gIHdhbGsoYnVpbHQsIHtcbiAgICBsb2NhbDogKGlkLCB0eXBlKSA9PiBmb3VuZC5zZXQoaWQsIHR5cGUpLCBmdW5jOiBmID0+IGZ1bmN0aW9ucy5hZGQoZiksIGFycmF5OiBhID0+IGFycmF5cy5hZGQoYSksXG4gICAgdHJhcDogbWVzc2FnZSA9PiB0cmFwcy5hZGQobWVzc2FnZSksIGxvZzogbWVzc2FnZSA9PiBsb2dzLmFkZChtZXNzYWdlKSxcbiAgfSlcbiAgcGFyYW1JZHMuZm9yRWFjaChpZCA9PiBmb3VuZC5kZWxldGUoaWQpKVxuICBjb25zdCBsb2NhbHMgPSBbLi4uZm91bmQuZW50cmllcygpXVxuICBjb25zdCBsb2NhbEluZGV4ZXMgPSBPYmplY3QuZnJvbUVudHJpZXMoW1xuICAgIC4uLnBhcmFtSWRzLm1hcCgoaWQsIGkpID0+IFtpZCwgaV0pLFxuICAgIC4uLmxvY2Fscy5tYXAoKFtpZF0sIGkpID0+IFtpZCwgZnVuYy5wYXJhbXMubGVuZ3RoICsgaV0pLFxuICBdKVxuICByZXR1cm4geyBmdW5jLCBidWlsdCwgbG9jYWxzLCBsb2NhbEluZGV4ZXMsIGZ1bmN0aW9uczogWy4uLmZ1bmN0aW9uc10sIGFycmF5czogWy4uLmFycmF5c10sIHRyYXBzOiBbLi4udHJhcHNdLCBsb2dzOiBbLi4ubG9nc10gfVxufVxuXG5jb25zdCBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMgPSAocm9vdHM6IEFueUZ1bmNbXSkgPT4ge1xuICBjb25zdCBidWlsdCA9IG5ldyBNYXA8QW55RnVuYywgQnVpbHRGdW5jPigpXG4gIGNvbnN0IHZpc2l0ID0gKGZ1bmM6IEFueUZ1bmMpID0+IHtcbiAgICBpZiAoYnVpbHQuaGFzKGZ1bmMpKSByZXR1cm5cbiAgICBjb25zdCBlbnRyeSA9IGJ1aWxkRnVuYyhmdW5jKVxuICAgIGJ1aWx0LnNldChmdW5jLCBlbnRyeSlcbiAgICBlbnRyeS5mdW5jdGlvbnMuZm9yRWFjaCh2aXNpdClcbiAgfVxuICByb290cy5mb3JFYWNoKHZpc2l0KVxuICByZXR1cm4gWy4uLmJ1aWx0LnZhbHVlcygpXVxufVxuXG5leHBvcnQgY29uc3QgYW5hbHl6ZU1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQpID0+IHtcbiAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKG1vZClcbiAgY29uc3QgZnVuY3MgPSBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5maWx0ZXIoKFssIHZdKSA9PiB2LmtpbmQgPT09IFwiZnVuY1wiKSkgYXMgRnVuY0RlZnM8VD5cbiAgY29uc3QgYXJyYXlzID0gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImFycmF5XCIpKSBhcyBBcnJheURlZnM8VD5cbiAgY29uc3QgZkVudHJpZXMgPSBPYmplY3QuZW50cmllcyhmdW5jcykgYXMgW2tleW9mIEZ1bmNEZWZzPFQ+ICYgc3RyaW5nLCBGdW5jRGVmczxUPltrZXlvZiBGdW5jRGVmczxUPl1dW11cbiAgY29uc3QgYnVpbHRGdW5jcyA9IGJ1aWxkUmVmZXJlbmNlZEZ1bmN0aW9ucyhmRW50cmllcy5tYXAoKFssIGZ1bmNdKSA9PiBmdW5jKSlcbiAgY29uc3QgZml4ID0gbmV3IE1hcChidWlsdEZ1bmNzLm1hcCgoeyBmdW5jIH0sIGkpID0+IFtmdW5jLCBpXSkpXG4gIGNvbnN0IGFsbEFycmF5cyA9IFsuLi5uZXcgU2V0KFsuLi5idWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmFycmF5cyksIC4uLk9iamVjdC52YWx1ZXMoYXJyYXlzKSBhcyBBbnlBcnJheVtdXSldXG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIGNvbnN0IHRyYXBNZXNzYWdlcyA9IFsuLi5uZXcgU2V0KGJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMudHJhcHMpKV1cbiAgY29uc3QgbG9nTWVzc2FnZXMgPSBbLi4ubmV3IFNldChidWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmxvZ3MpKV1cbiAgcmV0dXJuIHsgZnVuY3MsIGFycmF5cywgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXM6IE1hdGgubWF4KDEsIE1hdGguY2VpbChieXRlcyAvIDY1NTM2KSkgfSBhcyBNb2R1bGVBbmFseXNpczxUPlxufVxuIiwKICAgICJpbXBvcnQge1xuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUV4cHIsIHR5cGUgQW55RnVuYywgdHlwZSBBcml0aG1ldGljT3AsIHR5cGUgQml0T3AsIHR5cGUgQ21wT3AsIHR5cGUgRXhwcixcbiAgdHlwZSBNZW1vcnlUeXBlLCB0eXBlIE1vZHVsZURlZiwgdHlwZSBOdW1UeXBlLCB0eXBlIFJlbWFpbmRlck9wLCB0eXBlIFN0bXQsIGFzU3RtdHMsXG59IGZyb20gXCIuL2FzdFwiXG5pbXBvcnQgeyB0eXBlIEFycmF5TGF5b3V0LCB0eXBlIE1vZHVsZUFuYWx5c2lzIH0gZnJvbSBcIi4vYW5hbHl6ZVwiXG5cbmNvbnN0IG1hZ2ljID0gWzB4MDAsIDB4NjEsIDB4NzMsIDB4NmQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4MDBdXG5jb25zdCByZXN1bHRUeXBlID0gKHJlc3VsdDogQW55RnVuY1tcInJlc3VsdFwiXSkgPT5cbiAgdHlwZW9mIHJlc3VsdCA9PT0gXCJvYmplY3RcIiA/IHJlc3VsdC5zdG9yYWdlID09PSBcImk2NFwiID8gXCJpNjRcIiA6IFwiaTMyXCIgOiByZXN1bHRcblxuY29uc3QgbnVtYmVyQmFzZSA9IHsgaTMyOiAweDZhLCBpNjQ6IDB4N2MsIGYzMjogMHg5MiwgZjY0OiAweGEwIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj5cbmNvbnN0IG9wY29kZSA9IChvcDogQXJpdGhtZXRpY09wIHwgQml0T3AgfCBSZW1haW5kZXJPcCB8IENtcE9wLCB0eXBlOiBOdW1UeXBlKSA9PiB7XG4gIGNvbnN0IGFyaXRobWV0aWMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0uaW5kZXhPZihvcClcbiAgaWYgKGFyaXRobWV0aWMgPj0gMCkgcmV0dXJuIG51bWJlckJhc2VbdHlwZV0gKyBhcml0aG1ldGljXG4gIGNvbnN0IGludGVnZXIgPSBbXCJtb2RcIiwgXCJ1bW9kXCIsIFwiYW5kXCIsIFwib3JcIiwgXCJ4b3JcIiwgXCJzaGxcIiwgXCJcIiwgXCJzaHJcIl0uaW5kZXhPZihvcClcbiAgaWYgKGludGVnZXIgPj0gMCkgcmV0dXJuIG51bWJlckJhc2VbdHlwZV0gKyA1ICsgaW50ZWdlclxuICByZXR1cm4gKHsgaTMyOiAweDQ2LCBpNjQ6IDB4NTEsIGYzMjogMHg1YiwgZjY0OiAweDYxIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4pW3R5cGVdXG4gICAgKyAob3AgPT09IFwiZXFcIiA/IDAgOiBvcCA9PT0gXCJsdFwiID8gMiA6IHR5cGVbMF0gPT09IFwiaVwiID8gNCA6IDMpXG59XG5cbmNvbnN0IGNvZGVzID0ge1xuICB0eXBlOiB7IGkzMjogMHg3ZiwgaTY0OiAweDdlLCBmMzI6IDB4N2QsIGY2NDogMHg3YyB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICBsb2FkOiB7IGkzMjogMHgyOCwgaTY0OiAweDI5LCBmMzI6IDB4MmEsIGY2NDogMHgyYiwgaTg6IDB4MmMsIHU4OiAweDJkLCBpMTY6IDB4MmUsIHUxNjogMHgyZiB9IGFzIFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+LFxuICBzdG9yZTogeyBpMzI6IDB4MzYsIGk2NDogMHgzNywgZjMyOiAweDM4LCBmNjQ6IDB4MzksIGk4OiAweDNhLCB1ODogMHgzYSwgaTE2OiAweDNiLCB1MTY6IDB4M2IgfSBhcyBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPixcbiAgYWxpZ246IHsgaTg6IDAsIHU4OiAwLCBpMTY6IDEsIHUxNjogMSwgaTMyOiAyLCBmMzI6IDIsIGk2NDogMywgZjY0OiAzIH0gYXMgUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4sXG4gIHplcm86IHsgaTMyOiBbMHg0MSwgMF0sIGk2NDogWzB4NDIsIDBdLCBmMzI6IFsweDQzLCAwLCAwLCAwLCAwXSwgZjY0OiBbMHg0NCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0gfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyW10+LFxufVxuXG5jb25zdCB1MzIgPSAobjogbnVtYmVyKSA9PiB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCB1bnNpZ25lZCBpbnRlZ2VyLCBnb3QgJHtufWApXG4gIGNvbnN0IG91dDogbnVtYmVyW10gPSBbXVxuICBkbyB7XG4gICAgbGV0IGJ5dGUgPSBuICYgMHg3ZlxuICAgIG4gPj4+PSA3XG4gICAgaWYgKG4pIGJ5dGUgfD0gMHg4MFxuICAgIG91dC5wdXNoKGJ5dGUpXG4gIH0gd2hpbGUgKG4pXG4gIHJldHVybiBvdXRcbn1cblxuY29uc3Qgc04gPSAodmFsdWU6IG51bWJlciB8IGJpZ2ludCwgYml0czogMzIgfCA2NCkgPT4ge1xuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgbGV0IG4gPSBiaXRzID09PSAzMiA/IEJpZ0ludCgodmFsdWUgYXMgbnVtYmVyKSB8IDApIDogQmlnSW50LmFzSW50Tig2NCwgdmFsdWUgYXMgYmlnaW50KVxuICBmb3IgKDs7KSB7XG4gICAgbGV0IGJ5dGUgPSBOdW1iZXIobiAmIDB4N2ZuKVxuICAgIG4gPj49IDduXG4gICAgY29uc3QgZG9uZSA9IChuID09PSAwbiAmJiAoYnl0ZSAmIDB4NDApID09PSAwKSB8fCAobiA9PT0gLTFuICYmIChieXRlICYgMHg0MCkgIT09IDApXG4gICAgaWYgKCFkb25lKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICAgIGlmIChkb25lKSByZXR1cm4gb3V0XG4gIH1cbn1cblxuY29uc3QgZk4gPSAodmFsdWU6IG51bWJlciwgYnl0ZXM6IDQgfCA4KSA9PiB7XG4gIGNvbnN0IG91dCA9IG5ldyBVaW50OEFycmF5KGJ5dGVzKVxuICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KG91dC5idWZmZXIpXG4gIGJ5dGVzID09PSA0ID8gdmlldy5zZXRGbG9hdDMyKDAsIHZhbHVlLCB0cnVlKSA6IHZpZXcuc2V0RmxvYXQ2NCgwLCB2YWx1ZSwgdHJ1ZSlcbiAgcmV0dXJuIFsuLi5vdXRdXG59XG5cbmNvbnN0IHN0ciA9IChzOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUocylcbiAgcmV0dXJuIFsuLi51MzIoYnl0ZXMubGVuZ3RoKSwgLi4uYnl0ZXNdXG59XG5cbmNvbnN0IHNlY3Rpb24gPSAoaWQ6IG51bWJlciwgcGF5bG9hZDogbnVtYmVyW10pID0+IFtpZCwgLi4udTMyKHBheWxvYWQubGVuZ3RoKSwgLi4ucGF5bG9hZF1cbmNvbnN0IGZsYXRNYXAgPSA8VCwgUj4oeHM6IFRbXSwgZm46ICh4OiBUKSA9PiBSW10pID0+IHhzLmZsYXRNYXAoZm4pXG5jb25zdCBkaWUgPSAoeDogdW5rbm93bik6IG5ldmVyID0+IHsgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHZhbHVlOiAke1N0cmluZyh4KX1gKSB9XG5cblxuY29uc3QgYWRkciA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RyaWRlID0gbGF5b3V0LmVsZW1lbnRTaXplLCBmaWVsZE9mZnNldCA9IDApID0+XG4gIGluZGV4Lm11bChzdHJpZGUpLmFkZChsYXlvdXQub2Zmc2V0ICsgZmllbGRPZmZzZXQpXG5jb25zdCBtZW1hcmcgPSAodHlwZTogTWVtb3J5VHlwZSwgb2Zmc2V0ID0gMCkgPT4gWy4uLnUzMihjb2Rlcy5hbGlnblt0eXBlXSksIC4uLnUzMihvZmZzZXQpXVxuY29uc3QgY29uc3RJMzIgPSAoZTogRXhwcjxcImkzMlwiPikgPT4gZS5raW5kID09PSBcImNvbnN0XCIgPyBlLnZhbHVlIDogbnVsbFxuY29uc3QgY2hlY2tBcnJheUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPikgPT4ge1xuICBjb25zdCBuID0gY29uc3RJMzIoaW5kZXgpXG4gIGlmIChuID09IG51bGwpIHJldHVyblxuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDAgfHwgbiA+PSBsYXlvdXQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IGluZGV4ICR7bn0gb3V0IG9mIGJvdW5kcyBmb3IgbGVuZ3RoICR7bGF5b3V0Lmxlbmd0aH1gKVxufVxuY29uc3QgY2hlY2tNb3ZlQm91bmRzID0gKGxheW91dDogQXJyYXlMYXlvdXQsIHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPikgPT4ge1xuICBjb25zdCB2YWx1ZXMgPSBbY29uc3RJMzIodGFyZ2V0KSwgY29uc3RJMzIoc291cmNlKSwgY29uc3RJMzIoY291bnQpXVxuICBpZiAodmFsdWVzLnNvbWUodmFsdWUgPT4gdmFsdWUgPT0gbnVsbCkpIHJldHVyblxuICBjb25zdCBbdG8sIGZyb20sIHNpemVdID0gdmFsdWVzIGFzIG51bWJlcltdXG4gIGlmICh0byEgPCAwIHx8IGZyb20hIDwgMCB8fCBzaXplISA8IDAgfHwgdG8hICsgc2l6ZSEgPiBsYXlvdXQubGVuZ3RoIHx8IGZyb20hICsgc2l6ZSEgPiBsYXlvdXQubGVuZ3RoKVxuICAgIHRocm93IG5ldyBFcnJvcihgQXJyYXkgbW92ZSAoJHt0b30sICR7ZnJvbX0sICR7c2l6ZX0pIG91dCBvZiBib3VuZHMgZm9yIGxlbmd0aCAke2xheW91dC5sZW5ndGh9YClcbn1cblxuY29uc3QgbWFrZUNvbXBpbGVyID0gKFxuICBmaXg6IE1hcDxBbnlGdW5jLCBudW1iZXI+LCBsaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj4sIGFycmF5czogTWFwPEFueUFycmF5LCBBcnJheUxheW91dD4sXG4gIHRyYXBzOiBNYXA8c3RyaW5nLCBudW1iZXI+LCBsb2dzOiBNYXA8c3RyaW5nLCBudW1iZXI+LFxuKSA9PiB7XG5jb25zdCBjb21waWxlRXhwciA9IChlOiBBbnlFeHByKTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKGUua2luZCkge1xuICAgIGNhc2UgXCJjb25zdFwiOlxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJpMzJcIikgcmV0dXJuIFsweDQxLCAuLi5zTihlLnZhbHVlIGFzIG51bWJlciwgMzIpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJpNjRcIikgcmV0dXJuIFsweDQyLCAuLi5zTihlLnZhbHVlLCA2NCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImYzMlwiKSByZXR1cm4gWzB4NDMsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA0KV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZjY0XCIpIHJldHVybiBbMHg0NCwgLi4uZk4oZS52YWx1ZSBhcyBudW1iZXIsIDgpXVxuICAgICAgcmV0dXJuIGRpZShlKVxuICAgIGNhc2UgXCJsb2NhbC5nZXRcIjpcbiAgICAgIHJldHVybiBbMHgyMCwgLi4udTMyKGxpeFtlLmxvY2FsXSEpXVxuICAgIGNhc2UgXCJiaW5cIjoge1xuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0KSwgb3Bjb2RlKGUub3AsIGUudHlwZSldXG4gICAgfVxuICAgIGNhc2UgXCJjbXBcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0KSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCksIG9wY29kZShlLm9wLCBlLmlucHV0VHlwZSldXG4gICAgY2FzZSBcImNhbGxcIjpcbiAgICAgIHJldHVybiBbLi4uZmxhdE1hcChlLmFyZ3MsIGNvbXBpbGVFeHByKSwgMHgxMCwgLi4udTMyKGZpeC5nZXQoZS50YXJnZXQpISArIDIpXVxuICAgIGNhc2UgXCJjYXN0XCI6IHtcbiAgICAgIGNvbnN0IGZyb20gPSBlLmlucHV0VHlwZSBhcyBOdW1UeXBlXG4gICAgICBjb25zdCB0byA9IGUudHlwZSBhcyBOdW1UeXBlXG4gICAgICBsZXQgb3Bjb2RlOiBudW1iZXIgfCB1bmRlZmluZWRcbiAgICAgIGlmICh0byA9PT0gXCJpMzJcIiAmJiBmcm9tID09PSBcImk2NFwiKSBvcGNvZGUgPSAweGE3XG4gICAgICBpZiAodG8gPT09IFwiaTY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gZS51bnNpZ25lZCA/IDB4YWQgOiAweGFjXG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiMlxuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjRcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGI2XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiN1xuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjlcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImYzMlwiKSBvcGNvZGUgPSAweGJiXG4gICAgICBpZiAob3Bjb2RlID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY2FzdCAke2Zyb219IC0+ICR7dG99YClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS52YWx1ZSksIG9wY29kZV1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUuY29uZCksIDB4MDQsIGNvZGVzLnR5cGVbZS50eXBlIGFzIE51bVR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4pLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQoZS5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtlLmFycmF5fWApXG4gICAgICBjaGVja0FycmF5Qm91bmRzKGxheW91dCwgZS5pbmRleClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIGUuaW5kZXgsIGUuc3RyaWRlLCBlLm9mZnNldCkpLCBjb2Rlcy5sb2FkW2Uuc3RvcmFnZSBhcyBNZW1vcnlUeXBlXSwgLi4ubWVtYXJnKGUuc3RvcmFnZSBhcyBNZW1vcnlUeXBlKV1cbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUoZSlcbiAgfVxufVxuXG50eXBlIExhYmVsRnJhbWUgPSB7IGNvbnRyb2w/OiBudW1iZXIsIGtpbmQ/OiBcImJyZWFrXCIgfCBcImNvbnRpbnVlXCIgfVxuY29uc3QgZGVwdGggPSAoc3RhY2s6IExhYmVsRnJhbWVbXSwgY29udHJvbDogbnVtYmVyLCBraW5kOiBOb25OdWxsYWJsZTxMYWJlbEZyYW1lW1wia2luZFwiXT4pID0+IHtcbiAgY29uc3QgaSA9IHN0YWNrLmZpbmRJbmRleCh4ID0+IHguY29udHJvbCA9PT0gY29udHJvbCAmJiB4LmtpbmQgPT09IGtpbmQpXG4gIGlmIChpIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duICR7a2luZH0gdGFyZ2V0ICR7Y29udHJvbH1gKVxuICByZXR1cm4gaVxufVxuXG5jb25zdCBjb21waWxlU3RtdCA9IChzOiBTdG10LCBzdGFjazogTGFiZWxGcmFtZVtdID0gW10pOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAocy5raW5kKSB7XG4gICAgY2FzZSBcImxvY2FsLnNldFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgMHgyMSwgLi4udTMyKGxpeFtzLmxvY2FsXSEpXVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KHMuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tBcnJheUJvdW5kcyhsYXlvdXQsIHMuaW5kZXgpXG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLmluZGV4LCBzLnN0cmlkZSwgcy5vZmZzZXQpKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIGNvZGVzLnN0b3JlW3MudHlwZV0sIC4uLm1lbWFyZyhzLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiYXJyYXkubW92ZVwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KHMuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tNb3ZlQm91bmRzKGxheW91dCwgcy50YXJnZXQsIHMuc291cmNlLCBzLmNvdW50KVxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIHMudGFyZ2V0KSksXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLnNvdXJjZSkpLFxuICAgICAgICAuLi5jb21waWxlRXhwcihzLmNvdW50Lm11bChsYXlvdXQuZWxlbWVudFNpemUpKSxcbiAgICAgICAgMHhmYywgMHgwYSwgMHgwMCwgMHgwMCxcbiAgICAgIF1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMuY29uZCksIDB4MDQsIDB4NDAsIC4uLmZsYXRNYXAocy50aGVuLCB4ID0+IGNvbXBpbGVTdG10KHgsIFt7fSwgLi4uc3RhY2tdKSksIC4uLihzLmVsc2UubGVuZ3RoID8gWzB4MDUsIC4uLmZsYXRNYXAocy5lbHNlLCB4ID0+IGNvbXBpbGVTdG10KHgsIFt7fSwgLi4uc3RhY2tdKSldIDogW10pLCAweDBiXVxuICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgcmV0dXJuIFsweDAyLCAweDQwLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiYnJlYWtcIiB9LCAuLi5zdGFja10pKSwgMHgwYl1cbiAgICBjYXNlIFwibG9vcFwiOlxuICAgICAgcmV0dXJuIFsweDAyLCAweDQwLCAweDAzLCAweDQwLCAuLi5jb21waWxlRXhwcihzLmNvbmQpLCAweDQ1LCAweDBkLCAuLi51MzIoMSksIC4uLmZsYXRNYXAocy5ib2R5LCB4ID0+IGNvbXBpbGVTdG10KHgsIFt7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJjb250aW51ZVwiIH0sIHsgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGMsIC4uLnUzMigwKSwgMHgwYiwgMHgwYl1cbiAgICBjYXNlIFwiYnJlYWtcIjpcbiAgICAgIGlmIChzLnRhcmdldCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJicmVha1RvKCkgdXNlZCBvdXRzaWRlIGEgYmxvY2sgb3IgbG9vcFwiKVxuICAgICAgcmV0dXJuIFsweDBjLCAuLi51MzIoZGVwdGgoc3RhY2ssIHMudGFyZ2V0LCBcImJyZWFrXCIpKV1cbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIGlmIChzLnRhcmdldCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJjb250aW51ZVRvKCkgdXNlZCBvdXRzaWRlIGEgbG9vcFwiKVxuICAgICAgcmV0dXJuIFsweDBjLCAuLi51MzIoZGVwdGgoc3RhY2ssIHMudGFyZ2V0LCBcImNvbnRpbnVlXCIpKV1cbiAgICBjYXNlIFwicmV0dXJuXCI6XG4gICAgICByZXR1cm4gWy4uLihzLnZhbHVlID8gY29tcGlsZUV4cHIocy52YWx1ZSkgOiBbXSksIDB4MGZdXG4gICAgY2FzZSBcInRyYXBcIjpcbiAgICAgIHJldHVybiBbMHg0MSwgLi4uc04odHJhcHMuZ2V0KHMubWVzc2FnZSkhLCAzMiksIDB4MTAsIDB4MDBdXG4gICAgY2FzZSBcImxvZ1wiOlxuICAgICAgcmV0dXJuIFsweDQxLCAuLi5zTihsb2dzLmdldChzLm1lc3NhZ2UpISwgMzIpLCAuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgMHgxMCwgMHgwMV1cbiAgICBjYXNlIFwiY2FsbC52b2lkXCI6XG4gICAgICByZXR1cm4gWy4uLmZsYXRNYXAocy5hcmdzLCBjb21waWxlRXhwciksIDB4MTAsIC4uLnUzMihmaXguZ2V0KHMudGFyZ2V0KSEgKyAyKV1cbiAgICBjYXNlIFwiZXhwclwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmV4cHIpLCAweDFhXVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKHMpXG4gIH1cbn1cbnJldHVybiB7IGV4cHI6IGNvbXBpbGVFeHByLCBzdG10OiBjb21waWxlU3RtdCB9XG59XG5cblxuZXhwb3J0IGNvbnN0IGVtaXRNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4oeyBmRW50cmllcywgYnVpbHRGdW5jcywgZml4LCBsYXlvdXRzLCB0cmFwTWVzc2FnZXMsIGxvZ01lc3NhZ2VzLCBwYWdlcyB9OiBNb2R1bGVBbmFseXNpczxUPikgPT4ge1xuICBjb25zdCB0cmFwcyA9IG5ldyBNYXAodHJhcE1lc3NhZ2VzLm1hcCgobWVzc2FnZSwgaWQpID0+IFttZXNzYWdlLCBpZF0pKVxuICBjb25zdCBsb2dzID0gbmV3IE1hcChsb2dNZXNzYWdlcy5tYXAoKG1lc3NhZ2UsIGlkKSA9PiBbbWVzc2FnZSwgaWRdKSlcbiAgY29uc3QgZnVuY3Rpb25TZWN0aW9uID0gYnVpbHRGdW5jcy5mbGF0TWFwKChfLCBpKSA9PiB1MzIoaSArIDIpKVxuICBjb25zdCBleHBvcnRTZWN0aW9uID0gZkVudHJpZXMuZmxhdE1hcCgoW25hbWUsIGZ1bmNdKSA9PiBbLi4uc3RyKG5hbWUpLCAweDAwLCAuLi51MzIoZml4LmdldChmdW5jKSEgKyAyKV0pXG4gIHJldHVybiBuZXcgVWludDhBcnJheShbXG4gICAgLi4ubWFnaWMsXG4gICAgLi4uc2VjdGlvbigweDAxLCBbLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoICsgMiksXG4gICAgICAweDYwLCAweDAxLCBjb2Rlcy50eXBlLmkzMiwgMHgwMCxcbiAgICAgIDB4NjAsIDB4MDIsIGNvZGVzLnR5cGUuaTMyLCBjb2Rlcy50eXBlLmkzMiwgMHgwMCxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYyB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlc3VsdFR5cGUoZnVuYy5yZXN1bHQpXG4gICAgICAgIHJldHVybiBbMHg2MCwgLi4udTMyKGZ1bmMucGFyYW1zLmxlbmd0aCksIC4uLmZ1bmMucGFyYW1zLm1hcCh0ID0+IGNvZGVzLnR5cGVbdF0pLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFsweDAwXSA6IFsweDAxLCBjb2Rlcy50eXBlW3Jlc3VsdF1dKV1cbiAgICAgIH0pXSksXG4gICAgLi4uc2VjdGlvbigweDAyLCBbXG4gICAgICAweDAzLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwidHJhcFwiKSxcbiAgICAgIDB4MDAsXG4gICAgICAweDAwLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwibG9nXCIpLFxuICAgICAgMHgwMCxcbiAgICAgIDB4MDEsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJtZW1vcnlcIiksXG4gICAgICAweDAyLFxuICAgICAgMHgwMyxcbiAgICAgIC4uLnUzMihwYWdlcyksXG4gICAgICAuLi51MzIocGFnZXMpLFxuICAgIF0pLFxuICAgIC4uLnNlY3Rpb24oMHgwMywgWy4uLnUzMihidWlsdEZ1bmNzLmxlbmd0aCksIC4uLmZ1bmN0aW9uU2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwNywgWy4uLnUzMihmRW50cmllcy5sZW5ndGgpLCAuLi5leHBvcnRTZWN0aW9uXSksXG4gICAgLi4uc2VjdGlvbigweDBhLCBbXG4gICAgICAuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGgpLFxuICAgICAgLi4uZmxhdE1hcChidWlsdEZ1bmNzLCAoeyBmdW5jLCBidWlsdCwgbG9jYWxzLCBsb2NhbEluZGV4ZXMgfSkgPT4ge1xuICAgICAgICBjb25zdCBjb21waWxlciA9IG1ha2VDb21waWxlcihmaXgsIGxvY2FsSW5kZXhlcywgbGF5b3V0cywgdHJhcHMsIGxvZ3MpXG4gICAgICAgIGNvbnN0IHN0bXRzID0gYXNTdG10cyhidWlsdClcbiAgICAgICAgY29uc3QgZGVjbHMgPSBbLi4udTMyKGxvY2Fscy5sZW5ndGgpLCAuLi5mbGF0TWFwKGxvY2FscywgKFssIHR5cGVdKSA9PiBbLi4udTMyKDEpLCBjb2Rlcy50eXBlW3R5cGVdXSldXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlc3VsdFR5cGUoZnVuYy5yZXN1bHQpXG4gICAgICAgIGNvbnN0IGNvZGUgPSBzdG10c1xuICAgICAgICAgID8gWy4uLmZsYXRNYXAoc3RtdHMsIHMgPT4gY29tcGlsZXIuc3RtdChzKSksIC4uLihyZXN1bHQgPT09IFwidm9pZFwiID8gW10gOiBjb2Rlcy56ZXJvW3Jlc3VsdF0pXVxuICAgICAgICAgIDogY29tcGlsZXIuZXhwcihidWlsdCBhcyBBbnlFeHByKVxuICAgICAgICBjb25zdCBib2R5ID0gWy4uLmRlY2xzLCAuLi5jb2RlLCAweDBiXVxuICAgICAgICByZXR1cm4gWy4uLnUzMihib2R5Lmxlbmd0aCksIC4uLmJvZHldXG4gICAgICB9KSxcbiAgICBdKSxcbiAgXSlcbn1cbiIsCiAgICAiZXhwb3J0ICogZnJvbSBcIi4vYXN0XCJcbmV4cG9ydCB7IGZvcm1hdE1vZHVsZSB9IGZyb20gXCIuL2Zvcm1hdFwiXG5cbmltcG9ydCB7IGFuYWx5emVNb2R1bGUgfSBmcm9tIFwiLi9hbmFseXplXCJcbmltcG9ydCB7IGVtaXRNb2R1bGUgfSBmcm9tIFwiLi9jb2RlZ2VuXCJcbmltcG9ydCB0eXBlIHtcbiAgQW55QXJyYXksIEFueUZ1bmMsIENvbXBpbGVSZXN1bHQsIEpTU3RydWN0LCBNb2R1bGVEZWYsIFN0cnVjdEZpZWxkcywgU3RydWN0VHlwZSxcbn0gZnJvbSBcIi4vYXN0XCJcblxuY29uc3QgYXJyYXlDdG9ycyA9IHtcbiAgaTg6IEludDhBcnJheSwgdTg6IFVpbnQ4QXJyYXksIGkxNjogSW50MTZBcnJheSwgdTE2OiBVaW50MTZBcnJheSxcbiAgaTMyOiBJbnQzMkFycmF5LCBpNjQ6IEJpZ0ludDY0QXJyYXksIGYzMjogRmxvYXQzMkFycmF5LCBmNjQ6IEZsb2F0NjRBcnJheSxcbiAgc3U4OiBVaW50OEFycmF5LCBzdTE2OiBVaW50MTZBcnJheSwgc2kzMjogVWludDMyQXJyYXksIHNpNjQ6IEJpZ1VpbnQ2NEFycmF5LFxufVxuXG5leHBvcnQgY29uc3QgZGVjb2RlU3RydWN0ID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHJhdzogbnVtYmVyIHwgYmlnaW50KTogSlNTdHJ1Y3Q8Rj4gPT4ge1xuICBjb25zdCBwYWNrZWQgPSBCaWdJbnQuYXNVaW50Tih0eXBlLnNpemUgKiA4LCBCaWdJbnQocmF3KSlcbiAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyh0eXBlLmxheW91dCkubWFwKChbbmFtZSwgZmllbGRdKSA9PiB7XG4gICAgY29uc3QgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICBsZXQgdmFsdWUgPSAocGFja2VkID4+IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpKSAmIG1hc2tcbiAgICBpZiAoZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiB2YWx1ZSAmICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cyAtIDEpKSlcbiAgICAgIHZhbHVlIC09IDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzKVxuICAgIHJldHVybiBbbmFtZSwgZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IHZhbHVlIDogTnVtYmVyKHZhbHVlKV1cbiAgfSkpIGFzIEpTU3RydWN0PEY+XG59XG5cbmV4cG9ydCBjb25zdCBjb21waWxlID0gYXN5bmMgPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KFxuICBtb2Q6IFQsXG4pOiBQcm9taXNlPENvbXBpbGVSZXN1bHQ8VD4+ID0+IHtcbiAgY29uc3QgYW5hbHlzaXMgPSBhbmFseXplTW9kdWxlKG1vZClcbiAgY29uc3QgbWVtb3J5ID0gbmV3IFdlYkFzc2VtYmx5Lk1lbW9yeSh7XG4gICAgaW5pdGlhbDogYW5hbHlzaXMucGFnZXMsXG4gICAgbWF4aW11bTogYW5hbHlzaXMucGFnZXMsXG4gICAgc2hhcmVkOiB0cnVlLFxuICB9KVxuICBjb25zdCBjb21waWxlZCA9IGF3YWl0IFdlYkFzc2VtYmx5LmNvbXBpbGUoZW1pdE1vZHVsZShhbmFseXNpcykuYnVmZmVyKVxuICBjb25zdCB0cmFwID0gKGlkOiBudW1iZXIpOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihhbmFseXNpcy50cmFwTWVzc2FnZXNbaWRdID8/IGBVbmtub3duIFdBU00gdHJhcCAke2lkfWApIH1cbiAgY29uc3QgbG9nID0gKGlkOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IGNvbnNvbGUubG9nKGFuYWx5c2lzLmxvZ01lc3NhZ2VzW2lkXSA/PyBgV0FTTSBsb2cgJHtpZH1gLCB2YWx1ZSlcbiAgY29uc3QgaW5zdGFuY2UgPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShjb21waWxlZCwgeyBlbnY6IHsgbWVtb3J5LCB0cmFwLCBsb2cgfSB9KVxuICBjb25zdCBmdW5jRW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGFuYWx5c2lzLmZ1bmNzKSBhcyBbc3RyaW5nLCBBbnlGdW5jXVtdXG4gIGNvbnN0IGpzRnVuY3M6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge30sIHJlc3VsdFN0cnVjdHM6IFJlY29yZDxzdHJpbmcsIFN0cnVjdFR5cGU8YW55Pj4gPSB7fVxuICBmb3IgKGNvbnN0IFtuYW1lLCBmdW5jXSBvZiBmdW5jRW50cmllcykge1xuICAgIGNvbnN0IHdhc21GdW5jID0gaW5zdGFuY2UuZXhwb3J0c1tuYW1lXSBhcyAoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIgfCBiaWdpbnRcbiAgICBqc0Z1bmNzW25hbWVdID0gd2FzbUZ1bmNcbiAgICBpZiAodHlwZW9mIGZ1bmMucmVzdWx0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICByZXN1bHRTdHJ1Y3RzW25hbWVdID0gZnVuYy5yZXN1bHRcbiAgICAgIGpzRnVuY3NbbmFtZV0gPSAoLi4uYXJnczogdW5rbm93bltdKSA9PiBkZWNvZGVTdHJ1Y3QoZnVuYy5yZXN1bHQgYXMgU3RydWN0VHlwZTxhbnk+LCB3YXNtRnVuYyguLi5hcmdzKSlcbiAgICB9XG4gIH1cbiAgY29uc3QganNBcnJheXMgPSAoT2JqZWN0LmVudHJpZXMoYW5hbHlzaXMuYXJyYXlzKSBhcyBbc3RyaW5nLCBBbnlBcnJheV1bXSkubWFwKChbbmFtZSwgYXJyXSkgPT4ge1xuICAgIGNvbnN0IGxheW91dCA9IGFuYWx5c2lzLmxheW91dHMuZ2V0KGFycikhXG4gICAgY29uc3Qga2V5ID0gdHlwZW9mIGFyci50eXBlID09PSBcInN0cmluZ1wiID8gYXJyLnR5cGUgOiBgcyR7YXJyLnR5cGUuc3RvcmFnZX1gXG4gICAgY29uc3QgQ3RvciA9IGFycmF5Q3RvcnNba2V5IGFzIGtleW9mIHR5cGVvZiBhcnJheUN0b3JzXVxuICAgIHJldHVybiBbbmFtZSwgbmV3IEN0b3IobWVtb3J5LmJ1ZmZlciwgbGF5b3V0Lm9mZnNldCwgYXJyLmxlbmd0aCldIGFzIGNvbnN0XG4gIH0pXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGpzRnVuY3MsIE9iamVjdC5mcm9tRW50cmllcyhqc0FycmF5cyksIHtcbiAgICBtb2Q6IGNvbXBpbGVkLCBtZW1vcnksIHJlc3VsdFN0cnVjdHMsXG4gICAgdHJhcE1lc3NhZ2VzOiBhbmFseXNpcy50cmFwTWVzc2FnZXMsIGxvZ01lc3NhZ2VzOiBhbmFseXNpcy5sb2dNZXNzYWdlcyxcbiAgfSkgYXMgQ29tcGlsZVJlc3VsdDxUPlxufVxuIiwKICAgICJpbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgeyBhcnJheSwgY29tcGlsZSwgZnVuYywgaTMyLCBpZkVsc2UsIGxpdCwgbG9jYWwsIGxvZywgbG9vcCwgcmV0LCBzdHJ1Y3QsIHRyYXAsIHVtb2QsIHR5cGUgQW55QXJyYXksIHR5cGUgQXJyYXlIYW5kbGUsIHR5cGUgRFR5cGUsIHR5cGUgRXhwciwgdHlwZSBFeHByTGlrZSwgdHlwZSBTdG10LCB0eXBlIFN0bXRCb2R5IH0gZnJvbSBcIi4uL3dhc21cIlxuaW1wb3J0IHR5cGUgeyBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIlxuXG5jb25zdCBOV09SS0VSUyA9IDRcbmNvbnN0IFJBTkRTVFJJREUgPSAxNlxuY29uc3QgSU5GID0gMSA8PCAzMFxuY29uc3QgUkVPUkdfQ09TVCA9IDIwMFxuXG5sZXQgREVCVUcgPSB0cnVlXG5cbmZ1bmN0aW9uIGRlYnVnICh0YWc6IHN0cmluZywgdmFsdWU6IEV4cHJMaWtlPFwiaTMyXCI+KXtcbiAgaWYgKCFERUJVRykgcmV0dXJuIFtdXG4gIHJldHVybiBbIGxvZyh0YWcsIHZhbHVlKSBdXG59XG5cbmZ1bmN0aW9uIGNoZWNrZWRBcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBjb25zdCBhcnIgPSBhcnJheSh0eXBlLCBsZW5ndGgpIGFzIEFueUFycmF5XG4gIGlmICghREVCVUcpIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cblxuICBjb25zdCB7YXQsIG1vdmV9ID0gYXJyXG4gIGNvbnN0IGNoZWNrSWR4ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChpLG4pPT4gaWZFbHNlKFxuICAgICAgaS5sdCgwKS5vcihuLmx0KDApKS5vciAobi5hZGQoaSkuZ3QoYXJyLmxlbmd0aCkpLFxuICAgICAgdHJhcCggXCJhcnJheSBib3VuZHMgZXhjZWVkZWRcIiksXG4gICAgICByZXQoaSlcbiAgICApXG4gICk7XG4gIGFyci5hdCA9IGluZGV4ID0+IGF0KGNoZWNrSWR4LmNhbGwoaW5kZXgsIDEpKVxuICBhcnIubW92ZSA9ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+IG1vdmUoXG4gICAgY2hlY2tJZHguY2FsbCh0YXJnZXQsIGNvdW50KSxcbiAgICBjaGVja0lkeC5jYWxsKHNvdXJjZSwgY291bnQpLFxuICAgIGNvdW50LFxuICApXG4gIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cbn1cblxuZnVuY3Rpb24gZm9yTihuOiBudW1iZXIsIGJvZHk6IChpOiBFeHByPFwiaTMyXCI+KSA9PiBTdG10Qm9keSk6IFN0bXRCb2R5IHtcbiAgY29uc3QgaSA9IGxvY2FsKFwiaTMyXCIpXG4gIHJldHVybiBsb29wKCBpLmx0KG4pLFtib2R5KGkpLCBpLnNldChpLmFkZCgxKSldLClcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFubmVhbGluZ1dhc20ocGxhbm5lcjogTW9kdWxlKTogUHJvbWlzZTxBbm5lYWxpbmdSZXN1bHQ+IHtcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKHBsYW5uZXIuTlJFUVMgLyBwbGFubmVyLk5UUkFOUyAqIDIuNSAqIDIgKyAxMClcbiAgY29uc3QgTlBPSU5UUyA9IHBsYW5uZXIucm9hZG1hcC5wb2ludHMubGVuZ3RoXG4gIGNvbnN0IFNUT1AgPSBzdHJ1Y3Qoe1xuICAgIHJlcV9pZDogW1widTE2XCIsIDEwXSxcbiAgICBpc19sb2FkOiBbXCJ1OFwiLCAxXSxcbiAgICBkZWNrOiBbXCJ1OFwiLCAxXSxcbiAgfSlcbiAgY29uc3QgUkVRID0gc3RydWN0KHtcbiAgICBzdGFydDogXCJ1MTZcIixcbiAgICBlbmQ6IFwidTE2XCIsXG4gICAgdmFsdWU6IFwidTE2XCIsXG4gICAgZGVhZGxpbmU6IFwidTE2XCIsXG4gIH0pXG5cbiAgY29uc3QgcmFuZFN0YXRlICAgICAgPSBjaGVja2VkQXJyYXkoXCJpMzJcIiwgTldPUktFUlMgKiBSQU5EU1RSSURFKVxuICBjb25zdCBkaXN0cyAgICAgICAgICA9IGNoZWNrZWRBcnJheShcImkzMlwiLCBwbGFubmVyLlJTSVpFKVxuICBjb25zdCByZXF1ZXN0cyAgICAgICA9IGNoZWNrZWRBcnJheShSRVEsIHBsYW5uZXIuTlJFUVMpXG4gIGNvbnN0IGFzc2lnbmVkICAgICAgID0gY2hlY2tlZEFycmF5KFwidThcIiwgcGxhbm5lci5OUkVRUylcbiAgY29uc3Qgc2NoZWR1bGUgICAgICAgPSBjaGVja2VkQXJyYXkoU1RPUCwgcGxhbm5lci5OVFJBTlMgKiBUU0laRSlcbiAgY29uc3Qgc2NoZWRfc2l6ZSAgICAgPSBjaGVja2VkQXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHRyYW5fcG9zaXRpb25zID0gY2hlY2tlZEFycmF5KFwiaTE2XCIsIHBsYW5uZXIuTlRSQU5TKVxuXG4gIGNvbnN0IHJhbmROZXh0ID0gZnVuYyhbXCJpMzJcIl0sIFwiaTMyXCIsIGdpZCA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBsb2NhbChcImkzMlwiKVxuICAgIHJldHVybiBbXG4gICAgICB2YWx1ZS5zZXQocmFuZFN0YXRlLmF0KGdpZC5tdWwoUkFORFNUUklERSkpKSxcbiAgICAgIHZhbHVlLnNldCh2YWx1ZS54b3IodmFsdWUuc2hsKDEzKSkpLFxuICAgICAgdmFsdWUuc2V0KHZhbHVlLnhvcih2YWx1ZS5zaHIoMTcpKSksXG4gICAgICB2YWx1ZS5zZXQodmFsdWUueG9yKHZhbHVlLnNobCg1KSkpLFxuICAgICAgcmFuZFN0YXRlLmF0KGdpZC5tdWwoUkFORFNUUklERSkpLnNldCh2YWx1ZSksXG4gICAgICByZXQodmFsdWUpLFxuICAgIF1cbiAgfSlcbiAgY29uc3QgcmFuZGludCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoZ2lkLCBtYXgpID0+IHVtb2QocmFuZE5leHQuY2FsbChnaWQpLCBtYXgpKVxuXG4gIGNvbnN0IHJvYWRDb3N0ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChmcm9tLCB0bykgPT4ge1xuICAgIGNvbnN0IGEgPSBsb2NhbChcImkzMlwiKSwgYiA9IGxvY2FsKFwiaTMyXCIpLCB0bXAgPSBsb2NhbChcImkzMlwiKSwgaW5kZXggPSBsb2NhbChcImkzMlwiKVxuICAgIHJldHVybiBbXG4gICAgICBhLnNldChmcm9tKSwgYi5zZXQodG8pLFxuICAgICAgaWZFbHNlKGEubHQoYiksIFt0bXAuc2V0KGEpLCBhLnNldChiKSwgYi5zZXQodG1wKV0pLFxuICAgICAgaW5kZXguc2V0KGEuYWRkKGIubXVsKE5QT0lOVFMpKSksXG4gICAgICBpZkVsc2UoaW5kZXguZ3QocGxhbm5lci5SU0laRSksIGluZGV4LnNldChpMzIoTlBPSU5UUyAqKiAyKS5zdWIoaW5kZXgpKSksXG4gICAgICByZXQoZGlzdHMuYXQoaW5kZXgpKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgdHJ5QXNzaWduID0gZnVuYyhbXSwgXCJ2b2lkXCIsICgpID0+IHtcbiAgICBjb25zdCB0cmFuID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCByZXFfaWQgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IEEgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IEIgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHRtcCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdHNpemUgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHRvZmZzZXQgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHByZXZpb3VzU2NvcmUgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IG5leHRTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG5cbiAgICBjb25zdCBzY2hlZFZpZXcgPSB7XG4gICAgICBtb3ZlOiAodGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+KTogU3RtdEJvZHkgPT5cbiAgICAgICAgc2NoZWR1bGUubW92ZSh0b2Zmc2V0LmFkZCh0YXJnZXQpLCB0b2Zmc2V0LmFkZChzb3VyY2UpLCBjb3VudCksXG4gICAgICBhdDogKGluZGV4OiBFeHByPFwiaTMyXCI+KSA9PiBzY2hlZHVsZS5hdCh0b2Zmc2V0LmFkZChpbmRleCkpLFxuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICB0cmFuLnNldChyYW5kaW50LmNhbGwoMCwgcGxhbm5lci5OVFJBTlMpKSxcbiAgICAgIHJlcV9pZC5zZXQocmFuZGludC5jYWxsKDAsIHBsYW5uZXIuTlJFUVMpKSxcbiAgICAgIGlmRWxzZShhc3NpZ25lZC5hdChyZXFfaWQpLmVxKDEpLCByZXQoKSksXG4gICAgICB0b2Zmc2V0LnNldCh0cmFuLm11bChUU0laRSkpLFxuICAgICAgdHNpemUuc2V0KHNjaGVkX3NpemUuYXQodHJhbikpLFxuICAgICAgaWZFbHNlKHRzaXplLmd0KFRTSVpFIC0gMiksIHRyYXAoXCJzY2hlZHVsZSBjYXBhY2l0eSBleGNlZWRlZFwiKSksXG4gICAgICBwcmV2aW91c1Njb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgIEEuc2V0KHJhbmRpbnQuY2FsbCgwLCB0c2l6ZS5hZGQoMSkpKSxcbiAgICAgIEIuc2V0KHJhbmRpbnQuY2FsbCgwLCB0c2l6ZS5hZGQoMSkpKSxcbiAgICAgIGlmRWxzZShBLmd0KEIpLCBbdG1wLnNldChBKSwgQS5zZXQoQiksIEIuc2V0KHRtcCldKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIuYWRkKDIpLCBCLCB0c2l6ZS5zdWIoQikpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQS5hZGQoMSksIEEsIEIuc3ViKEEpKSxcbiAgICAgIHRtcC5zZXQocmFuZGludC5jYWxsKDAsIDIpKSxcbiAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQsIGlzX2xvYWQ6IDEsIGRlY2s6IHRtcCB9KSxcbiAgICAgIHNjaGVkVmlldy5hdChCLmFkZCgxKSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAwLCBkZWNrOiB0bXAgfSksXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5hZGQoMikpLFxuICAgICAgbmV4dFNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgIGlmRWxzZShuZXh0U2NvcmUuZ3QocHJldmlvdXNTY29yZSksXG4gICAgICAgIGFzc2lnbmVkLmF0KHJlcV9pZCkuc2V0KDEpLFxuICAgICAgICBbXG4gICAgICAgICAgc2NoZWRWaWV3Lm1vdmUoQSwgQS5hZGQoMSksIEIuc3ViKEEpKSxcbiAgICAgICAgICBzY2hlZFZpZXcubW92ZShCLCBCLmFkZCgyKSwgdHNpemUuc3ViKEIpKSxcbiAgICAgICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZSksXG4gICAgICAgIF0sXG4gICAgICApLFxuICAgIF1cbiAgfSlcblxuICBjb25zdCByYXRlVHJhbiA9IGZ1bmMoW1wiaTMyXCJdLCBcImkzMlwiLCB0cmFuID0+IHtcbiAgICBjb25zdCByZXdhcmQgPSBsb2NhbChcImkzMlwiKSwgZHVyYXRpb24gPSBsb2NhbChcImkzMlwiKSwgcG9zID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBvZmZzZXQgPSBsb2NhbChcImkzMlwiKSwgc2l6ZSA9IGxvY2FsKFwiaTMyXCIpLCBpID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBkZWNrMCA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrMSA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrU2l6ZTAgPSBsb2NhbChcImkzMlwiKSwgZGVja1NpemUxID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBkZWNrID0gbG9jYWwoXCJpMzJcIiksIGRlY2tTaXplID0gbG9jYWwoXCJpMzJcIiksIHJlcSA9IGxvY2FsKFwiaTMyXCIpLCBuZXh0UG9zID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBmb3VuZCA9IGxvY2FsKFwiaTMyXCIpLCBzaGlmdCA9IGxvY2FsKFwiaTMyXCIpLCBsb3dlck1hc2sgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHN0ZXAgPSBsb2NhbChTVE9QKSwgcmVxdWVzdCA9IGxvY2FsKFJFUSlcbiAgICByZXR1cm4gW1xuICAgICAgcG9zLnNldCh0cmFuX3Bvc2l0aW9ucy5hdCh0cmFuKSksXG4gICAgICBvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICBzaXplLnNldChzY2hlZF9zaXplLmF0KHRyYW4pKSxcbiAgICAgIGxvb3AoaS5sdChzaXplKSwgW1xuICAgICAgICBzdGVwLnNldChzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGkpKSksXG4gICAgICAgIHJlcS5zZXQoc3RlcC5yZXFfaWQpLFxuICAgICAgICByZXF1ZXN0LnNldChyZXF1ZXN0cy5hdChyZXEpKSxcbiAgICAgICAgbmV4dFBvcy5zZXQoaWZFbHNlKHN0ZXAuaXNfbG9hZCwgcmVxdWVzdC5zdGFydCwgcmVxdWVzdC5lbmQpKSxcbiAgICAgICAgZHVyYXRpb24uaWFkZChyb2FkQ29zdC5jYWxsKHBvcywgbmV4dFBvcykpLFxuICAgICAgICBwb3Muc2V0KG5leHRQb3MpLFxuICAgICAgICBkZWNrLnNldChpZkVsc2Uoc3RlcC5kZWNrLCBkZWNrMSwgZGVjazApKSxcbiAgICAgICAgZGVja1NpemUuc2V0KGlmRWxzZShzdGVwLmRlY2ssIGRlY2tTaXplMSwgZGVja1NpemUwKSksXG4gICAgICAgIGlmRWxzZShzdGVwLmlzX2xvYWQsIFtcbiAgICAgICAgICBpZkVsc2UoZGVja1NpemUuZ3QoMiksIHJldCgtSU5GKSksXG4gICAgICAgICAgZGVjay5zZXQoZGVjay5vcihyZXEuc2hsKGRlY2tTaXplLm11bCgxMCkpKSksXG4gICAgICAgICAgZGVja1NpemUuaWFkZCgxKSxcbiAgICAgICAgXSwgW1xuICAgICAgICAgIGZvdW5kLnNldCgtMSksXG4gICAgICAgICAgaWZFbHNlKGRlY2tTaXplLmd0KDApLmFuZChkZWNrLmFuZCgxMDIzKS5lcShyZXEpKSwgZm91bmQuc2V0KDApKSxcbiAgICAgICAgICBpZkVsc2UoZm91bmQuZXEoLTEpLmFuZChkZWNrU2l6ZS5ndCgxKSkuYW5kKGRlY2suc2hyKDEwKS5hbmQoMTAyMykuZXEocmVxKSksIGZvdW5kLnNldCgxKSksXG4gICAgICAgICAgaWZFbHNlKGZvdW5kLmVxKC0xKS5hbmQoZGVja1NpemUuZ3QoMikpLmFuZChkZWNrLnNocigyMCkuYW5kKDEwMjMpLmVxKHJlcSkpLCBmb3VuZC5zZXQoMikpLFxuICAgICAgICAgIGlmRWxzZShmb3VuZC5lcSgtMSksIHJldCgtSU5GKSksXG4gICAgICAgICAgZHVyYXRpb24uaWFkZChkZWNrU2l6ZS5zdWIoZm91bmQpLnN1YigxKS5tdWwoUkVPUkdfQ09TVCkpLFxuICAgICAgICAgIHNoaWZ0LnNldChmb3VuZC5tdWwoMTApKSxcbiAgICAgICAgICBsb3dlck1hc2suc2V0KGkzMigxKS5zaGwoc2hpZnQpLnN1YigxKSksXG4gICAgICAgICAgZGVjay5zZXQoZGVjay5hbmQobG93ZXJNYXNrKS5vcihkZWNrLnNocihzaGlmdC5hZGQoMTApKS5zaGwoc2hpZnQpKSksXG4gICAgICAgICAgZGVja1NpemUuaXN1YigxKSxcbiAgICAgICAgICBpZkVsc2UoZHVyYXRpb24uZ3QocmVxdWVzdC5kZWFkbGluZSksIFtdLCByZXdhcmQuaWFkZChyZXF1ZXN0LnZhbHVlKSksXG4gICAgICAgIF0pLFxuICAgICAgICBpZkVsc2Uoc3RlcC5kZWNrLFxuICAgICAgICAgIFtkZWNrMS5zZXQoZGVjayksIGRlY2tTaXplMS5zZXQoZGVja1NpemUpXSxcbiAgICAgICAgICBbZGVjazAuc2V0KGRlY2spLCBkZWNrU2l6ZTAuc2V0KGRlY2tTaXplKV0sXG4gICAgICAgICksXG4gICAgICAgIGkuaWFkZCgxKSxcbiAgICAgIF0pLFxuICAgICAgcmV0KHJld2FyZC5zdWIoZHVyYXRpb24pKSxcbiAgICBdXG4gIH0pXG5cblxuXG4gIGNvbnN0IGFkZFJlcXVlc3QgPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiXSwgXCJ2b2lkXCIsXG4gICAgKHJlcW4sIHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSkgPT5cbiAgICAgIHJlcXVlc3RzLmF0KHJlcW4pLnNldCh7IHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSB9KSxcbiAgKVxuXG4gIGNvbnN0IHNlYXJjaCA9IGZ1bmMoW10sIFwidm9pZFwiLCAoKSA9PiBbXG4gICAgZGVidWcoXCJkZWJ1Z2dlciBvbi5cIiwgMCksXG4gICAgZm9yTigxMDAsIGk9PiB0cnlBc3NpZ24uY2FsbCgpKVxuICBdKVxuICBjb25zdCBnZXRTdG9wID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFNUT1AsXG4gICAgKHRyYW4sIGluZGV4KSA9PiBzY2hlZHVsZS5hdCh0cmFuLm11bChUU0laRSkuYWRkKGluZGV4KSksXG4gIClcblxuICBjb25zdCB3YXNtID0gYXdhaXQgY29tcGlsZSh7XG4gICAgYWRkUmVxdWVzdCxcbiAgICBhc3NpZ25lZCxcbiAgICBkaXN0cyxcbiAgICBnZXRTdG9wLFxuICAgIHJhdGVUcmFuLFxuICAgIHJhbmRTdGF0ZSxcbiAgICBzY2hlZHVsZSxcbiAgICBzZWFyY2gsXG4gICAgc2NoZWRfc2l6ZSxcbiAgICB0cmFuX3Bvc2l0aW9ucyxcbiAgfSlcblxuICB3YXNtLmRpc3RzLnNldChwbGFubmVyLnJvYWRtYXAuQ29zdE1hdHJpeClcbiAgd2FzbS5yYW5kU3RhdGUuc2V0KEFycmF5LmZyb20oeyBsZW5ndGg6IE5XT1JLRVJTICogMiB9LCAoXywgaSkgPT4gaSArIDEpKVxuICB3YXNtLnRyYW5fcG9zaXRpb25zLnNldChwbGFubmVyLnN0YXJ0cG9zaXRpb25zKVxuICBwbGFubmVyLnJlcXVlc3RzLmZvckVhY2goKHJlcXVlc3QsIGkpID0+XG4gICAgd2FzbS5hZGRSZXF1ZXN0KGksIHJlcXVlc3Quc3RhcnRQb2ludCwgcmVxdWVzdC5lbmRQb2ludCwgTWF0aC50cnVuYyhyZXF1ZXN0LnZhbHVlX2V1ciAvIDAuNSksIE1hdGgudHJ1bmMocmVxdWVzdC5kZWFkbGluZV9oICogNjApKSxcbiAgKVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gIHdhc20uc2VhcmNoKClcbiAgY29uc3QgZWxhcHNlZE1zID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydGVkQXRcbiAgY29uc3QgcmVzdWx0U2NoZWR1bGUgPSBuZXcgVWludDMyQXJyYXkocGxhbm5lci5OVFJBTlMgKiBUU0laRSlcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBwbGFubmVyLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3YXNtLnNjaGVkX3NpemVbdHJhbl0hOyBpKyspIHtcbiAgICAgIGNvbnN0IHN0b3AgPSB3YXNtLmdldFN0b3AodHJhbiwgaSlcbiAgICAgIHJlc3VsdFNjaGVkdWxlW3RyYW4gKiBUU0laRSArIGldID0gc3RvcC5pc19sb2FkIHwgc3RvcC5kZWNrIDw8IDEgfCBzdG9wLnJlcV9pZCA8PCAyXG4gICAgfVxuICB9XG4gIGNvbnN0IHVuYXNzaWduZWQgPSBuZXcgSW50OEFycmF5KHBsYW5uZXIuTlJFUVMpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdW5hc3NpZ25lZC5sZW5ndGg7IGkrKykgdW5hc3NpZ25lZFtpXSA9IHdhc20uYXNzaWduZWRbaV0gPyAwIDogMVxuICBjb25zdCBzY2hlZHVsZVJhdGluZ3MgPSBuZXcgSW50MzJBcnJheShBcnJheS5mcm9tKHsgbGVuZ3RoOiBwbGFubmVyLk5UUkFOUyB9LCAoXywgdHJhbikgPT4gd2FzbS5yYXRlVHJhbih0cmFuKSkpXG5cbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogcmVzdWx0U2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogbmV3IFVpbnQxNkFycmF5KHdhc20uc2NoZWRfc2l6ZSksXG4gICAgdHJhblN0YXJ0OiBuZXcgVWludDE2QXJyYXkocGxhbm5lci5zdGFydHBvc2l0aW9ucyksXG4gICAgVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzLFxuICAgIHVuYXNzaWduZWQsXG4gICAgZWxhcHNlZE1zLFxuICAgIHRvdGFsU2NvcmU6IHNjaGVkdWxlUmF0aW5ncy5yZWR1Y2UoKHN1bSwgc2NvcmUpID0+IHN1bSArIHNjb3JlLCAwKSxcbiAgfVxufVxuIiwKICAgICJpbXBvcnQgeyBidXR0b24sIGNvbG9yLCBkaXYsIHAsIHBvcHVwLCBzcGFuLCBzdHlsZSwgdGFibGUsIHRkLCB0aCwgdHIgfSBmcm9tIFwiLi4vdmlldy9odG1sXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMgfSBmcm9tIFwiLi4vdmlldy9tYWluXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZywgdHlwZSBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIjtcbmltcG9ydCB7IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiwgaW1wcm92ZWRBbm5lYWxpbmcsIHR5cGUgSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIH0gZnJvbSBcIi4vYW5uZWFsaW5nX2ltcHJvdmVkXCI7XG5pbXBvcnQgeyBhbm5lYWxpbmdXYXNtIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3dhc21cIjtcbmltcG9ydCB7IGdldERlY2ssIGdldFJlcSwgaXNMb2FkIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3NoYXJlZFwiO1xuXG5leHBvcnQgY29uc3QgYXZhaWxhYmxlU29sdmVycyA9IHtcbiAgYmFzZWxpbmU6IGJhc2VsaW5lQW5uZWFsaW5nLFxuICBpbXByb3ZlZDogaW1wcm92ZWRBbm5lYWxpbmcsXG4gIHdhc206IGFubmVhbGluZ1dhc20sXG59IGFzIGNvbnN0O1xudHlwZSBTb2x2ZXJOYW1lID0ga2V5b2YgdHlwZW9mIGF2YWlsYWJsZVNvbHZlcnM7XG5cbmNvbnN0IElOSVRJQUxfU09MVkVSOiBTb2x2ZXJOYW1lID0gXCJ3YXNtXCI7XG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwbGFubmVyVmlldyhtb2Q6IE1vZHVsZSk6IFByb21pc2U8SFRNTEVsZW1lbnQ+IHtcbiAgY29uc3Qgb3V0ZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmdyYXk7XG4gIGNvbnN0IGlubmVyQm9yZGVyID0gXCIxcHggc29saWQgXCIgKyBjb2xvci5saWdodGdyYXk7XG4gIGNvbnN0IGNlbGxQYWRkaW5nID0gXCIuMzVlbSAuNWVtXCI7XG4gIGNvbnN0IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCA9IFwiMi4xZW1cIjtcblxuICBsZXQgYW5uZWFsZXI6IEFubmVhbGluZ1Jlc3VsdCB8IG51bGwgPSBudWxsO1xuICBsZXQgYW5uZWFsaW5nU2Vzc2lvbjogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG4gIGxldCBhbm5lYWxpbmdUaW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGxldCBydW5JZCA9IDA7XG5cbiAgZnVuY3Rpb24gaXRlbUJ1dHRvbihpdGVtOiBudW1iZXIsIGxvYWQ/OiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVxID0gbW9kLnJlcXVlc3RzW2l0ZW1dITtcbiAgICBjb25zdCBzcCA9IHNwYW4oXG4gICAgICBpdGVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMywgXCIgXCIpLFxuICAgICAgc3R5bGUoe1xuICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICBib3JkZXI6IFwiMnB4IHNvbGlkIHRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuMmVtXCIsXG4gICAgICAgIHdoaXRlU3BhY2U6IFwicHJlXCIsXG4gICAgICAgIGZvbnRGYW1pbHk6IFwibW9ub3NwYWNlXCIsXG4gICAgICB9KSxcbiAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9wdXAoXG4gICAgICAgICAgcChcIml0ZW0gXCIsIGl0ZW0pLFxuICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgdHIoY2VsbChcInN0YXR1c1wiKSwgY2VsbChsb2FkID8gXCJsb2FkXCIgOiBsb2FkID09PSBmYWxzZSA/IFwidW5sb2FkXCIgOiBcInVuYXNzaWduZWRcIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcInZhbHVlXCIpLCBjZWxsKHJlcS52YWx1ZV9ldXIgKyBcIuKCrFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGlzdFwiKSwgY2VsbChtb2Qucm9hZG1hcC5nZXRDb3N0TihyZXEuc3RhcnRQb2ludCwgcmVxLmVuZFBvaW50KSArIFwia21cIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcImRlYWRsaW5lXCIpLCBjZWxsKHJlcS5kZWFkbGluZV9oLnRvRml4ZWQoMikgKyBcImhcIikpLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICk7XG5cbiAgICBsZXQgcG9pbnRzID0gW1xuICAgICAgeyBudW1iZXI6IHJlcS5zdGFydFBvaW50LCBsb2dvOiBcIvCfk6ZcIiB9LFxuICAgICAgeyBudW1iZXI6IHJlcS5lbmRQb2ludCwgbG9nbzogXCLwn4+gXCIgfSxcbiAgICBdO1xuXG4gICAgaWYgKGxvYWQgPT09IHRydWUpIHBvaW50cyA9IFtwb2ludHNbMF0hXTtcbiAgICBpZiAobG9hZCA9PT0gZmFsc2UpIHBvaW50cyA9IFtwb2ludHNbMV0hXTtcblxuICAgIHNwLm9ubW91c2VlbnRlciA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gY29sb3IuZ3JlZW47XG4gICAgICBoaWdodExpZ2h0cy5zZXQoW3sgcG9pbnRzIH1dKTtcbiAgICB9O1xuICAgIHNwLm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gXCJ0cmFuc3BhcmVudFwiO1xuICAgIH07XG4gICAgcmV0dXJuIHNwO1xuICB9XG5cbiAgY29uc3QgY2VsbDogdHlwZW9mIHRkID0gKC4uLngpID0+IHRkKHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksIC4uLngpO1xuICBjb25zdCBjb250cm9scyA9IGRpdihzdHlsZSh7IGRpc3BsYXk6IFwiZmxleFwiLCBnYXA6IFwiLjVlbVwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBmbGV4V3JhcDogXCJ3cmFwXCIgfSkpO1xuICBjb25zdCBzY29yZUxpbmUgPSBwKCk7XG4gIGNvbnN0IHRpbWVMaW5lID0gcCgpO1xuICBjb25zdCBzb2x2ZXJTZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VsZWN0XCIpO1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMoYXZhaWxhYmxlU29sdmVycykgYXMgU29sdmVyTmFtZVtdKSBzb2x2ZXJTZWxlY3QuYWRkKG5ldyBPcHRpb24obmFtZSwgbmFtZSkpO1xuICBzb2x2ZXJTZWxlY3QudmFsdWUgPSBJTklUSUFMX1NPTFZFUjtcbiAgY29uc3Qgc29sdmVyTGluZSA9IHAoXCJzb2x2ZXI6IFwiLCBzb2x2ZXJTZWxlY3QpO1xuICBjb25zdCBkZXRhaWxXcmFwID0gZGl2KCk7XG4gIGNvbnN0IHRhYmxlV3JhcCA9IGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBvdmVyZmxvd1g6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dZOiBcImhpZGRlblwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgIH0pLFxuICApO1xuXG4gIGNvbnN0IHJ1bkJ1dHRvbiA9IGJ1dHRvbihcInN0YXJ0XCIpO1xuICBjb25zdCBoZWF0QnV0dG9uID0gYnV0dG9uKFwiaGVhdCB1cFwiKTtcbiAgbGV0IHJlbmRlckNvdW50ZXIgPSAwO1xuXG4gIGZ1bmN0aW9uIHN0b3BTZWFyY2goKSB7XG4gICAgaWYgKGFubmVhbGluZ1RpbWVyICE9IG51bGwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoYW5uZWFsaW5nVGltZXIpO1xuICAgICAgYW5uZWFsaW5nVGltZXIgPSBudWxsO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0YXJ0XCI7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJUYWJsZSgpIHtcbiAgICBjb25zdCB0YWIgPSB0YWJsZShcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgfSksXG4gICAgICB0cihcbiAgICAgICAgdGgoXCJ0cmFuc3BvcnRlclwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJ2YWx1ZVwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJzdGVwc1wiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICksXG4gICAgICBtb2Quc3RhcnRwb3NpdGlvbnMubWFwKChzdGFydCwgdHJhbikgPT5cbiAgICAgICAgdHIoXG4gICAgICAgICAgdGQoXG4gICAgICAgICAgICB0cmFuLFxuICAgICAgICAgICAgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcG9wdXAoXG4gICAgICAgICAgICAgICAgcChcInRyYW5zcG9ydGVyOiBcIiwgdHJhbiksXG4gICAgICAgICAgICAgICAgcChcInN0YXJ0OiBcIiwgc3RhcnQpLFxuICAgICAgICAgICAgICAgIHAoXCJzY29yZTogXCIsIGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hKSxcbiAgICAgICAgICAgICAgICBwKFwic3RlcHM6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVTaXplc1t0cmFuXSEpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb25tb3VzZWVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50czogW3sgbnVtYmVyOiBzdGFydCwgbG9nbzogXCLwn5qbXCIgfV0gfV0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBvbm1vdXNlbGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW10pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHRkKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiIH0pKSxcbiAgICAgICAgICB0ZChcbiAgICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIFswLCAxXS5tYXAoKGRlY2spID0+XG4gICAgICAgICAgICAgICAgdHIoXG4gICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHsgbGVuZ3RoOiBhbm5lYWxlciEuc2NoZWR1bGVTaXplc1t0cmFuXSEgfSwgKF8sIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IGFubmVhbGVyPy5zY2hlZHVsZVt0cmFuICogYW5uZWFsZXIuVFNJWkUgKyBpXSE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYWQgPSBpc0xvYWQoc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZChcbiAgICAgICAgICAgICAgICAgICAgICBnZXREZWNrKHN0ZXApID09PSBkZWNrID8gaXRlbUJ1dHRvbihnZXRSZXEoc3RlcCksICEhbG9hZCkgOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBsb2FkID8gY29sb3IuYmx1ZSA6IGNvbG9yLmdyZWVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBpbm5lckJvcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjJlbSAuM2VtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogXCIyLjZlbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzY2hlZHVsZUNlbGxNaW5IZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgIGJvcmRlcjogb3V0ZXJCb3JkZXIsXG4gICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjI1ZW1cIixcbiAgICAgICAgICAgICAgdmVydGljYWxBbGlnbjogXCJ0b3BcIixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgICksXG4gICAgICApLFxuICAgICk7XG5cbiAgICB0YWJsZVdyYXAucmVwbGFjZUNoaWxkcmVuKHRhYik7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJTdGF0dXMoKSB7XG4gICAgaWYgKCFhbm5lYWxlcikgcmV0dXJuO1xuICAgIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IGBzY29yZTogJHthbm5lYWxlcj8udG90YWxTY29yZSA/PyAwfWA7XG4gICAgdGltZUxpbmUudGV4dENvbnRlbnQgPSBgc2VhcmNoIHRpbWU6ICR7KGFubmVhbGVyIS5lbGFwc2VkTXMvMTAwMCkudG9GaXhlZCgyKX0gc2A7XG5cbiAgICBkZXRhaWxXcmFwLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIGRpdihcbiAgICAgICAgcChcImRldGFpbHNcIiksXG4gICAgICAgIHRhYmxlKFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdHIoY2VsbChcInVuYXNzaWduZWQgcmVxdWVzdHNcIiksIGNlbGwoQXJyYXkuZnJvbShhbm5lYWxlciEudW5hc3NpZ25lZCkubWFwKCh4LCBpKSA9PiAoeyB4LCBpIH0pKS5maWx0ZXIoKHgpID0+IHgueCkuZmxhdE1hcCgoeCkgPT4gW3NwYW4oXCIgXCIpLCBpdGVtQnV0dG9uKHguaSldKSkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJzZWFyY2ggdGltZVwiKSwgY2VsbChgJHthbm5lYWxlcj8uZWxhcHNlZE1zID8/IDB9bXNgKSksXG4gICAgICAgICAgdHIoY2VsbChcInNjb3JlXCIpLCBjZWxsKGFubmVhbGVyPy50b3RhbFNjb3JlID8/IDApKSxcbiAgICAgICAgICB0cihjZWxsKFwidHJhbnNwb3J0ZXIgY291bnRcIiksIGNlbGwobW9kLk5UUkFOUykpLFxuICAgICAgICAgIHRyKGNlbGwoXCJyZXF1ZXN0IGNvdW50XCIpLCBjZWxsKG1vZC5OUkVRUykpLFxuICAgICAgICAgIHRyKGNlbGwoXCJjb3N0IHBlciBrbVwiKSwgY2VsbChgJHtLTV9DT1NUfeKCrGApKSxcbiAgICAgICAgICB0cihjZWxsKFwiYXZlcmFnZSBzcGVlZFwiKSwgY2VsbChgJHtBVkdfU1BFRURfS01IfWttL2hgKSksXG4gICAgICAgICAgdHIoY2VsbChcInJlb3JnYW5pemF0aW9uIGNvc3RcIiksIGNlbGwoYCR7UkVPUkdfQ09TVF9FVVJ94oKsYCkpLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGZvcmNlVGFibGUgPSBmYWxzZSkge1xuICAgIGlmICghYW5uZWFsZXIpIHJldHVybjtcbiAgICByZW5kZXJTdGF0dXMoKTtcbiAgICBpZiAoZm9yY2VUYWJsZSB8fCAocmVuZGVyQ291bnRlcisrICUgNCA9PT0gMCkpIHJlbmRlclRhYmxlKCk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBydW5Tb2x2ZXIobmFtZTogU29sdmVyTmFtZSkge1xuICAgIHN0b3BTZWFyY2goKTtcbiAgICBjb25zdCBpZCA9ICsrcnVuSWQ7XG4gICAgYW5uZWFsaW5nU2Vzc2lvbiA9IG51bGw7XG4gICAgYW5uZWFsZXIgPSBudWxsO1xuICAgIHJ1bkJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gXCJydW5uaW5n4oCmXCI7XG4gICAgdGFibGVXcmFwLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgIHRyeSB7XG4gICAgICBpZiAobmFtZSA9PT0gXCJpbXByb3ZlZFwiKSB7XG4gICAgICAgIGFubmVhbGluZ1Nlc3Npb24gPSBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kLCAxXzkwMF8wMDApO1xuICAgICAgICBhbm5lYWxlciA9IGFubmVhbGluZ1Nlc3Npb24uaXRlcmF0ZUZvck1zKDEwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFubmVhbGVyID0gYXdhaXQgYXZhaWxhYmxlU29sdmVyc1tuYW1lXShtb2QpO1xuICAgICAgfVxuICAgICAgaWYgKGlkID09PSBydW5JZCkgcmVuZGVyKHRydWUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoaWQgPT09IHJ1bklkKSBzY29yZUxpbmUudGV4dENvbnRlbnQgPSBgc29sdmVyIGZhaWxlZDogJHtTdHJpbmcoZXJyb3IpfWA7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChpZCA9PT0gcnVuSWQpIHtcbiAgICAgICAgcnVuQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIHJ1bkJ1dHRvbi50ZXh0Q29udGVudCA9IG5hbWUgPT09IFwiaW1wcm92ZWRcIiA/IFwic3RhcnRcIiA6IFwicnVuXCI7XG4gICAgICAgIGhlYXRCdXR0b24uaGlkZGVuID0gbmFtZSAhPT0gXCJpbXByb3ZlZFwiO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJ1bkJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGNvbnN0IG5hbWUgPSBzb2x2ZXJTZWxlY3QudmFsdWUgYXMgU29sdmVyTmFtZTtcbiAgICBpZiAobmFtZSAhPT0gXCJpbXByb3ZlZFwiKSB7XG4gICAgICB2b2lkIHJ1blNvbHZlcihuYW1lKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGFubmVhbGluZ1RpbWVyICE9IG51bGwpIHtcbiAgICAgIHN0b3BTZWFyY2goKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gXCJzdG9wXCI7XG4gICAgYW5uZWFsaW5nVGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKCFhbm5lYWxpbmdTZXNzaW9uKSByZXR1cm47XG4gICAgICBhbm5lYWxlciA9IGFubmVhbGluZ1Nlc3Npb24uaXRlcmF0ZUZvck1zKDEyMCk7XG4gICAgICByZW5kZXIoKTtcbiAgICB9LCAxNTApO1xuICB9O1xuXG4gIGhlYXRCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICBhbm5lYWxlciA9IGFubmVhbGluZ1Nlc3Npb24ucmVoZWF0KCk7XG4gICAgcmVuZGVyKHRydWUpO1xuICB9O1xuXG4gIHNvbHZlclNlbGVjdC5vbmNoYW5nZSA9ICgpID0+IHZvaWQgcnVuU29sdmVyKHNvbHZlclNlbGVjdC52YWx1ZSBhcyBTb2x2ZXJOYW1lKTtcbiAgY29udHJvbHMucmVwbGFjZUNoaWxkcmVuKHJ1bkJ1dHRvbiwgaGVhdEJ1dHRvbik7XG4gIGF3YWl0IHJ1blNvbHZlcihJTklUSUFMX1NPTFZFUik7XG5cbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBwYWRkaW5nOiBcIjFlbVwiLFxuICAgICAgb3ZlcmZsb3dZOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WDogXCJoaWRkZW5cIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICB9KSxcbiAgICBjb250cm9scyxcbiAgICBzb2x2ZXJMaW5lLFxuICAgIHNjb3JlTGluZSxcbiAgICB0aW1lTGluZSxcbiAgICB0YWJsZVdyYXAsXG4gICAgZGV0YWlsV3JhcCxcbiAgKTtcbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lXCJcbmltcG9ydCB7IGFubmVhbGluZ1dhc20gfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nX3dhc21cIlxuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgZGl2LCBoMiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCJcblxubGV0IHJlc3VsdDogQW5uZWFsaW5nUmVzdWx0XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRVcFdhc20ocGxhbm5lcjogTW9kdWxlKSB7XG4gIHJlc3VsdCA9IGF3YWl0IGFubmVhbGluZ1dhc20ocGxhbm5lcilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhc21WaWV3KF9wbGFubmVyOiBNb2R1bGUpIHtcbiAgaWYgKCFyZXN1bHQgKSB0aHJvdyBuZXcgRXJyb3IoXCJXQVNNIHBsYW5uZXIgaXMgbm90IHNldCB1cFwiKVxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHsgcGFkZGluZzogXCIxZW1cIiB9KSxcbiAgICBoMihcIldBU00gcGxhbm5lclwiKSxcbiAgICBwKFwiYXNzaWduZWQ6IFwiLCByZXN1bHQudW5hc3NpZ25lZC5sZW5ndGggLSByZXN1bHQudW5hc3NpZ25lZC5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSksXG4gICAgcChcInNjaGVkdWxlIHN0ZXBzOiBcIiwgcmVzdWx0LnNjaGVkdWxlU2l6ZXMucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkpLFxuICAgIHAoXCJzZWFyY2ggdGltZTogXCIsIHJlc3VsdC5lbGFwc2VkTXMudG9GaXhlZCgyKSwgXCJtc1wiKSxcbiAgKVxufVxuXG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcm9hZG1hcFwiO1xuaW1wb3J0IHsgcmFuZG9tTW9kdWxlLCByYW5kb21VVUlELCBSZXF1ZXN0LCBTY2hlZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgbWtTdG9yZWQsIG1rV3JpdGFibGUsIHR5cGUgV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyBzZXRSYW5kU2VlZCB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB7IG51bWJlciB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmltcG9ydCB7IHBsYW5uZXJWaWV3IH0gZnJvbSBcIi4uL3BsYW5uZXJzL2FubmVhbGluZ1wiO1xuaW1wb3J0IHsgc2V0VXBXYXNtLCB3YXNtVmlldyB9IGZyb20gXCIuL3dhc212aWV3XCI7XG5cblxuZXhwb3J0IGxldCBMS1dfQ09VTlQgPSBta1N0b3JlZChcIkxLV19DT1VOVFwiLCBudW1iZXIsICA1KVxubGV0IFJFUVVFU1RfQ09VTlQgPSBta1N0b3JlZChcIlJFUVVFU1RfQ09VTlRcIiwgIG51bWJlciwgMjApXG5cbmJvZHkuc3R5bGUubWFyZ2luID0gXCIwXCJcblxubGV0IGhlYWRlciA9IGgxKFwicm91dGUgcGxhbm5lclwiLCBzdHlsZSh7YmFja2dyb3VuZDogY29sb3IuYmx1ZSwgY29sb3I6IGNvbG9yLmJhY2tncm91bmQsIG1hcmdpbjogXCIwXCIsIHBhZGRpbmc6IFwiLjZlbVwifSkpXG5cbmxldCBjb250ZW50U3BhY2UgPSBkaXYoc3R5bGUoe1xuICBkaXNwbGF5OlwiZmxleFwiLFxuICBmbGV4RGlyZWN0aW9uOlwicm93XCIsXG4gIHdpZHRoOiBcIjEwMCVcIixcbiAgaGVpZ2h0OiBcImNhbGMoMTAwJSAtIDIuNWVtKVwiLFxuICBtaW5XaWR0aDogXCIwXCIsXG59KSlcblxubGV0IHBhZ2UgPSBkaXYoXG4gIHN0eWxlKHtkaXNwbGF5OlwiZmxleFwiLCBmbGV4RGlyZWN0aW9uOlwiY29sdW1uXCIsIGhlaWdodDogXCIxMDAlXCJ9KSxcbiAgaGVhZGVyLFxuICBjb250ZW50U3BhY2VcbilcblxuYm9keS5yZXBsYWNlQ2hpbGRyZW4ocGFnZSlcblxuc2V0UmFuZFNlZWQoMjQpXG5cbmV4cG9ydCBsZXQgbW9kdWxlID0gcmFuZG9tTW9kdWxlKClcblxuZXhwb3J0IHR5cGUgSGlnaExpZ2h0ID0ge1xuICBwb2ludHM6IHtcbiAgICBudW1iZXI6IG51bWJlcixcbiAgICBsb2dvPyA6IHN0cmluZyxcbiAgfVtdLFxuICBjb2xvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgbGV0IGhpZ2h0TGlnaHRzID0gbWtXcml0YWJsZSA8SGlnaExpZ2h0W10+KCBbXSApXG5cblxuZnVuY3Rpb24gc2V0dGVyIChzdG9yZTogV3JpdGFibGU8bnVtYmVyPiApe1xuICBsZXQgaW5wID0gaW5wdXQoKVxuICBpbnAudHlwZSA9IFwibnVtYmVyXCJcbiAgaW5wLm9uY2hhbmdlID0gKCk9PntcbiAgICBsZXQgdmFsID0gcGFyc2VJbnQoaW5wLnZhbHVlKVxuICAgIGlmIChpc05hTih2YWwpKSByZXR1cm5cbiAgICBzdG9yZS5zZXQodmFsKVxuICB9XG4gIHN0b3JlLm9udXBkYXRlKHZhbD0+aW5wLnZhbHVlID0gdmFsLnRvU3RyaW5nKCkpXG5cbiAgcmV0dXJuIGlucFxufVxuXG5cbmF3YWl0IHNldFVwV2FzbShtb2R1bGUpXG5cbmFzeW5jIGZ1bmN0aW9uIG1rV2luZG93ICh0YWI6IG51bWJlciA9IDAgKSB7XG5cbiAgbGV0IHRhYkZpZWxkcyA9IFtcbiAgICBbJ21hcCcsIG1hcFZpZXcobW9kdWxlKV0sXG4gICAgWydwbGFubmVyJywgYXdhaXQgcGxhbm5lclZpZXcobW9kdWxlKV0sXG4gICAgWyd3YXNtJywgd2FzbVZpZXcobW9kdWxlKV1cbiAgXSBhcyBjb25zdFxuXG4gIGNvbnN0IGVsID0gZGl2KHN0eWxlKHtcbiAgICBmbGV4OiBcIjEgMSAwXCIsXG4gICAgbWluV2lkdGg6IFwiMFwiLFxuICAgIGhlaWdodDogXCJjYWxjKDEwMHZoIC0gMWVtKVwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICBvdmVyZmxvdzogXCJoaWRkZW5cIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgY29uc3QgdGFicyA9IHAoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIG1hcmdpbjogXCIwXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjRlbVwiLFxuICAgICAgICBmbGV4OiBcIjAgMCBhdXRvXCIsXG4gICAgICB9KSxcbiAgICAgIHRhYkZpZWxkcy5tYXAoKFtuLGVdKT0+XG4gICAgICAgIHNwYW4oIG4sXG4gICAgICAgICAgKCk9Pm9wZW5UYWIobiksXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgcGFkZGluZzogXCIuM2VtXCIsXG4gICAgICAgICAgICBtYXJnaW46IFwiLjNlbVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrIChuPT10YWIgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXkpLFxuICAgICAgICAgICAgY29sb3I6IChuPT10YWIpID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5LFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG5cbiAgICBjb25zdCBjb250ZW50ID0gZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBmbGV4OiBcIjEgMSBhdXRvXCIsXG4gICAgICAgIG1pbkhlaWdodDogXCIwXCIsXG4gICAgICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLmZpbmQoKFtuLF0pPT5uPT10YWIpIVsxXVxuICAgIClcblxuICAgIGVsLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIHRhYnMsXG4gICAgICBjb250ZW50XG4gICAgKVxuICB9XG5cbiAgb3BlblRhYih0YWJGaWVsZHNbdGFiXSFbMF0pXG5cbiAgcmV0dXJuIGVsXG59XG5cbmNvbnRlbnRTcGFjZS5yZXBsYWNlQ2hpbGRyZW4oLi4uYXdhaXQgUHJvbWlzZS5hbGwoW21rV2luZG93KDEpLCBta1dpbmRvdygpXSkpXG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBRU8sSUFBTSxPQUFPLFNBQVM7QUFFN0IsSUFBTSxlQUFlO0FBQUEsRUFDbkIsT0FBTTtBQUFBLElBQ0osT0FBbUI7QUFBQSxJQUNuQixZQUFtQjtBQUFBLElBQ25CLEtBQW1CO0FBQUEsSUFDbkIsT0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FB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
