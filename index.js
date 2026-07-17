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
  return [
    log(tag, value)
  ];
}
var boundsCheck = (array3, index, count = 1) => {
  const i = lit("i32", index), n = lit("i32", count);
  return ifElse(i.lt(0).or(n.lt(0)).or(n.gt(array3.length)).or(i.gt(i32(array3.length).sub(n))), trap("array bounds exceeded"));
};
function checkedArray(type, length) {
  const arr = array2(type, length);
  const { at, move } = arr;
  const checkedIndex = func(["i32", "i32"], "i32", (index, count) => [
    boundsCheck(arr, index, count),
    ret(index)
  ]);
  arr.at = (index) => at(checkedIndex.call(index, 1));
  arr.move = (target, source, count) => move(checkedIndex.call(target, count), checkedIndex.call(source, count), count);
  return arr;
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

//# debugId=735E53CE90F79DEA64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc20vYXN0LnRzIiwgInNyYy93YXNtL2FuYWx5emUudHMiLCAic3JjL3dhc20vY29kZWdlbi50cyIsICJzcmMvd2FzbS9pbmRleC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvdmlldy93YXNtdmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5jb25zdCBJTkYgPSAxIDw8IDMwO1xuXG5leHBvcnQgdHlwZSBQYWlySW5mbyA9IHtcbiAgcmVxOiBudW1iZXI7XG4gIGZpcnN0OiBudW1iZXI7XG4gIHNlY29uZDogbnVtYmVyO1xuICBkZWNrOiAwIHwgMTtcbn07XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1N0YXRlID0ge1xuICBtb2Q6IE1vZHVsZTtcbiAgTlJFUVM6IG51bWJlcjtcbiAgTlRSQU5TOiBudW1iZXI7XG4gIFRTSVpFOiBudW1iZXI7XG4gIHJlcVBpY2t1cExvY2F0aW9uczogVWludDE2QXJyYXk7XG4gIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVhZGxpbmVzOiBVaW50MzJBcnJheTtcbiAgcmVxVmFsdWVzOiBVaW50MzJBcnJheTtcbiAgdW5hc3NpZ25lZDogSW50OEFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2FkKHg6IG51bWJlcikge1xuICByZXR1cm4geCAmIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNrKHg6IG51bWJlcikge1xuICByZXR1cm4gKCh4ICYgMikgPj4gMSkgYXMgMCB8IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXEoeDogbnVtYmVyKSB7XG4gIHJldHVybiAoeCAmIDB4ZmZmZikgPj4gMjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvcyh4OiBudW1iZXIpIHtcbiAgcmV0dXJuIHggPj4gMTY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QW5uZWFsaW5nU3RhdGUobW9kOiBNb2R1bGUsIHNlZWQ/OiBBbm5lYWxpbmdSZXN1bHQpOiBBbm5lYWxpbmdTdGF0ZSB7XG4gIGNvbnN0IHsgTlJFUVMsIHJlcXVlc3RzLCBzdGFydHBvc2l0aW9ucywgTlRSQU5TIH0gPSBtb2Q7XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihOUkVRUyAqIDIuNSArIDEwKTtcblxuICByZXR1cm4ge1xuICAgIG1vZCxcbiAgICBOUkVRUyxcbiAgICBOVFJBTlMsXG4gICAgVFNJWkUsXG4gICAgcmVxUGlja3VwTG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLnN0YXJ0UG9pbnQpKSxcbiAgICByZXFEZWxpdmVyeUxvY2F0aW9uczogbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5lbmRQb2ludCkpLFxuICAgIHJlcURlYWRsaW5lczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5kZWFkbGluZV9oICogQVZHX1NQRUVEX0tNSCkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci52YWx1ZV9ldXIgLyBLTV9DT1NUKSksXG4gICAgdW5hc3NpZ25lZDogc2VlZCA/IG5ldyBJbnQ4QXJyYXkoc2VlZC51bmFzc2lnbmVkKSA6IG5ldyBJbnQ4QXJyYXkocmVxdWVzdHMubWFwKCgpID0+IDEpKSxcbiAgICB0cmFuU3RhcnQ6IG5ldyBVaW50MTZBcnJheShzdGFydHBvc2l0aW9ucyksXG4gICAgc2NoZWR1bGU6IHNlZWQgPyBuZXcgVWludDMyQXJyYXkoc2VlZC5zY2hlZHVsZSkgOiBuZXcgVWludDMyQXJyYXkoVFNJWkUgKiBOVFJBTlMpLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHNlZWQgPyBuZXcgVWludDE2QXJyYXkoc2VlZC5zY2hlZHVsZVNpemVzKSA6IG5ldyBVaW50MTZBcnJheShOVFJBTlMpLFxuICAgIHNjaGVkdWxlUmF0aW5nczogc2VlZCA/IG5ldyBJbnQzMkFycmF5KHNlZWQuc2NoZWR1bGVSYXRpbmdzKSA6IG5ldyBJbnQzMkFycmF5KE5UUkFOUyksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZU9mZnNldChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICByZXR1cm4gdHJhbiAqIHN0YXRlLlRTSVpFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBpZHg6IG51bWJlciwgaXNMb2FkQml0OiAxIHwgMCwgZGVjazogMCB8IDEsIHJlcTogbnVtYmVyLCBwb3M6IG51bWJlcikge1xuICBzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdID0gKGlzTG9hZEJpdCA8PCAwKSB8IChkZWNrIDw8IDEpIHwgKHJlcSA8PCAyKSB8IChwb3MgPDwgMTYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVSb3V0ZShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICBsZXQgcmV3YXJkID0gMDtcbiAgbGV0IGR1cmF0aW9uID0gMDtcbiAgY29uc3QgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV07XG4gIGxldCBwb3MgPSBzdGF0ZS50cmFuU3RhcnRbdHJhbl0hO1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKTtcbiAgICBjb25zdCBuZXh0UG9zID0gZ2V0UG9zKHN0ZXApO1xuICAgIGR1cmF0aW9uICs9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgZHVyYXRpb24gKz0gKGRlY2subGVuZ3RoIC0gaWR4IC0gMSkgKiBSRU9SR19DT1NUX0VVUiAvIEtNX0NPU1Q7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGR1cmF0aW9uIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gZHVyYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoQWxsUmF0aW5ncyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUpIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heExvc3MgPSAyNDApIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGlmIChzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dICE9PSAwKSBjb250aW51ZTtcblxuICAgIGxldCBiZXN0UmVxID0gLTE7XG4gICAgbGV0IGJlc3RTY29yZSA9IC1JTkY7XG5cbiAgICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICAgIGlmICghc3RhdGUudW5hc3NpZ25lZFtyZXFdKSBjb250aW51ZTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCAwLCAwLCAwLCByZXEpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCAwLCAxKTtcbiAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdFJlcSA9IHJlcTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYmVzdFJlcSA9PT0gLTEgfHwgYmVzdFNjb3JlIDwgLW1heExvc3MpIGNvbnRpbnVlO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIGJlc3RSZXEpO1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IGJlc3RTY29yZTtcbiAgICBzdGF0ZS51bmFzc2lnbmVkW2Jlc3RSZXFdID0gMDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0U3RvcHMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBlbmQgKyAyLCBvZmZzZXQgKyBlbmQsIG9mZnNldCArIHNpemUpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIGVuZCArIDEpO1xuICBzZXRSZXEoc3RhdGUsIHRyYW4sIHN0YXJ0LCAxLCBkZWNrLCByZXEsIHN0YXRlLnJlcVBpY2t1cExvY2F0aW9uc1tyZXFdISk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgZW5kICsgMSwgMCwgZGVjaywgcmVxLCBzdGF0ZS5yZXFEZWxpdmVyeUxvY2F0aW9uc1tyZXFdISk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBlbmQpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCAtIDEsIG9mZnNldCArIGVuZCArIDEsIG9mZnNldCArIHNpemUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhaXJJblJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCByZXE6IG51bWJlcik6IFBhaXJJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBsZXQgZmlyc3QgPSAtMTtcbiAgbGV0IHNlY29uZCA9IC0xO1xuICBsZXQgZGVjazogMCB8IDEgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBpZiAoZ2V0UmVxKHN0ZXApICE9PSByZXEpIGNvbnRpbnVlO1xuICAgIGlmIChmaXJzdCA9PT0gLTEpIHtcbiAgICAgIGZpcnN0ID0gaTtcbiAgICAgIGRlY2sgPSBnZXREZWNrKHN0ZXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWNvbmQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZpcnN0ID09PSAtMSB8fCBzZWNvbmQgPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgcmVxLCBmaXJzdCwgc2Vjb25kLCBkZWNrIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVVbmFzc2lnbmVkUmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IG51bWJlciB8IG51bGwge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1heEF0dGVtcHRzOyBpKyspIHtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIHN0YXRlLk5SRVFTKTtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgZm9yIChsZXQgcmVxID0gMDsgcmVxIDwgc3RhdGUuTlJFUVM7IHJlcSsrKSB7XG4gICAgaWYgKHN0YXRlLnVuYXNzaWduZWRbcmVxXSkgcmV0dXJuIHJlcTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbyB9IHwgbnVsbCB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgbWF4QXR0ZW1wdHM7IGF0dGVtcHQrKykge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIHN0YXRlLk5UUkFOUyk7XG4gICAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGlmIChzaXplIDwgMikgY29udGludWU7XG4gICAgY29uc3QgaWR4ID0gcmFuZEludCgwLCBzaXplKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pICsgaWR4XSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pXSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0QW5uZWFsKHByZXZTY29yZTogbnVtYmVyLCBuZXh0U2NvcmU6IG51bWJlciwgdGVtcDogbnVtYmVyKSB7XG4gIGlmIChuZXh0U2NvcmUgPj0gcHJldlNjb3JlKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgZGVsdGEgPSBwcmV2U2NvcmUgLSBuZXh0U2NvcmU7XG4gIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KHRlbXAsIDAuMDAxKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIGVsYXBzZWRNczogbnVtYmVyKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogc3RhdGUuc2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogc3RhdGUuc2NoZWR1bGVTaXplcyxcbiAgICB0cmFuU3RhcnQ6IHN0YXRlLnRyYW5TdGFydCxcbiAgICBUU0laRTogc3RhdGUuVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MsXG4gICAgdW5hc3NpZ25lZDogc3RhdGUudW5hc3NpZ25lZCxcbiAgICBlbGFwc2VkTXMsXG4gICAgdG90YWxTY29yZTogc3RhdGUuc2NoZWR1bGVSYXRpbmdzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApLFxuICB9O1xufVxuIiwKICAgICJpbXBvcnQgeyByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGdldERlY2ssXG4gIGdldFJlcSxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1Jlc3VsdCA9IHtcbiAgc2NoZWR1bGU6IFVpbnQzMkFycmF5O1xuICBzY2hlZHVsZVNpemVzOiBVaW50MTZBcnJheTtcbiAgdHJhblN0YXJ0OiBVaW50MTZBcnJheTtcbiAgVFNJWkU6IG51bWJlcjtcbiAgc2NoZWR1bGVSYXRpbmdzOiBJbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIGVsYXBzZWRNczogbnVtYmVyO1xuICB0b3RhbFNjb3JlOiBudW1iZXI7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYmFzZWxpbmVBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMV82MDBfMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kKTtcbiAgY29uc3QgeyBOUkVRUywgTlRSQU5TLCBUU0laRSwgc2NoZWR1bGUsIHNjaGVkdWxlU2l6ZXMsIHNjaGVkdWxlUmF0aW5ncywgdW5hc3NpZ25lZCB9ID0gc3RhdGU7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEwMDtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2UmF0aW5nOiBudW1iZXIsIG5leHRSYXRpbmc6IG51bWJlcikge1xuICAgIGlmIChuZXh0UmF0aW5nID49IHByZXZSYXRpbmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0UmF0aW5nIC0gcHJldlJhdGluZykgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2NoZWRTaXplICsgMSk7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKHNjaGVkU2l6ZSwgcmFuZEludCgwLCA0KSArIGEpO1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpO1xuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAwLjUgPyAxIDogMCwgcmVxKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICBjb25zdCBzY2hlZFNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2NoZWRTaXplIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRTaXplKTtcbiAgICBjb25zdCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSE7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKGl0ZW0pO1xuXG4gICAgY29uc3QgYWI6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZFNpemU7IGkrKykge1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09PSByZXEpIGFiLnB1c2goaSk7XG4gICAgfVxuICAgIGlmIChhYi5sZW5ndGggIT09IDIpIHJldHVybjtcblxuICAgIGNvbnN0IFthLCBiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl07XG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIpO1xuICAgIGNvbnN0IG5ld1JhdGluZyA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgIGlmIChhY2NlcHQoc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgbmV3UmF0aW5nKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gbmV3UmF0aW5nO1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgLSAxLCBnZXREZWNrKGl0ZW0pIGFzIDAgfCAxLCByZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG4gICAgdGVtcCA9ICgxIC0gaSAvIHN0ZXBzKSAqIHN0YXJ0VGVtcDtcbiAgICB0cnlVbmFzc2lnbigpO1xuICAgIHRyeUFzc2lnbigpO1xuICB9XG5cbiAgcmV0dXJuIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlLCBEYXRlLm5vdygpIC0gc3RhcnRlZEF0KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZyB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHtcbiAgYWNjZXB0QW5uZWFsLFxuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgdHlwZSBQYWlySW5mbyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNhbXBsZUFzc2lnbmVkUGFpcixcbiAgc2FtcGxlVW5hc3NpZ25lZFJlcSxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBJbXByb3ZlZE9wdGlvbnMgPVxuICB8IHsgc3RlcHM6IG51bWJlcjsgYnVkZ2V0TXM/OiBuZXZlciB9XG4gIHwgeyBidWRnZXRNczogbnVtYmVyOyBzdGVwcz86IG5ldmVyIH07XG5cbmV4cG9ydCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiA9IHtcbiAgaXRlcmF0ZVN0ZXBzOiAoc3RlcHM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBpdGVyYXRlRm9yTXM6IChidWRnZXRNczogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG4gIGdldFJlc3VsdDogKCkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICByZWhlYXQ6IChmYWN0b3I/OiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kOiBNb2R1bGUsIHRhcmdldFN0ZXBzID0gMTUwMDAwKTogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHtcbiAgY29uc3Qgd2FybXVwU3RlcHMgPSBNYXRoLm1pbihNYXRoLm1heCgyMDAwMCwgTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMikpLCA1MDAwMCk7XG4gIGNvbnN0IHdhcm11cCA9IGJhc2VsaW5lQW5uZWFsaW5nKG1vZCwgd2FybXVwU3RlcHMpO1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QsIHdhcm11cCk7XG4gIGNvbnN0IHsgTlRSQU5TLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuICBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZSk7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEyMDtcbiAgbGV0IGVuZFRlbXAgPSAwLjU7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyByZXE6IG51bWJlcjsgYTogbnVtYmVyOyBiOiBudW1iZXI7IGRlY2s6IDAgfCAxOyBzY29yZTogbnVtYmVyIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IHJlcSA9IHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGUpO1xuICAgICAgaWYgKHJlcSA9PSBudWxsKSBicmVhaztcblxuICAgICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBjb25zdCBkZWNrID0gKHJhbmRvbSgpID4gMC41ID8gMSA6IDApIGFzIDAgfCAxO1xuXG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgZGVjaywgcmVxKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHJlcSwgYSwgYiwgZGVjaywgc2NvcmU6IG5ld1Njb3JlIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LmEsIGJlc3QuYiwgYmVzdC5kZWNrLCBiZXN0LnJlcSk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ25TYW1wbGVkKHNhbXBsZXMgPSA2KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7IHRyYW46IG51bWJlcjsgcGFpcjogUGFpckluZm87IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IG5ld1Njb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0geyB0cmFuLCBwYWlyLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucGFpci5yZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlbG9jYXRlU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgc3JjOiBudW1iZXI7XG4gICAgICBkc3Q6IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICAgIG9sZFNjb3JlOiBudW1iZXI7XG4gICAgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcblxuICAgICAgY29uc3QgeyB0cmFuOiBzcmMsIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIGNvbnN0IGRzdCA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IG9sZFNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY2hlZHVsZVJhdGluZ3Nbc3JjXSFcbiAgICAgICAgOiBzY2hlZHVsZVJhdGluZ3Nbc3JjXSEgKyBzY2hlZHVsZVJhdGluZ3NbZHN0XSE7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3QgZHN0U2l6ZSA9IHNjaGVkdWxlU2l6ZXNbZHN0XSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBkc3RTaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oZHN0U2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgZHN0U2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGRzdCwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY29yZVJvdXRlKHN0YXRlLCBzcmMpXG4gICAgICAgIDogc2NvcmVSb3V0ZShzdGF0ZSwgc3JjKSArIHNjb3JlUm91dGUoc3RhdGUsIGRzdCk7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBkc3QsIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBjYW5kaWRhdGVTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICBzcmMsXG4gICAgICAgICAgZHN0LFxuICAgICAgICAgIHBhaXIsXG4gICAgICAgICAgaW5zZXJ0QTogYSxcbiAgICAgICAgICBpbnNlcnRCOiBiLFxuICAgICAgICAgIHNjb3JlOiBjYW5kaWRhdGVTY29yZSxcbiAgICAgICAgICBvbGRTY29yZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKGJlc3Qub2xkU2NvcmUsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBpZiAoYmVzdC5zcmMgPT09IGJlc3QuZHN0KSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5zcmNdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5zcmMpO1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5kc3RdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5kc3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5zcmMsIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlSZWluc2VydFNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHtcbiAgICAgIHRyYW46IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW4sIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG5cbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHRyYW4sXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuXG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2Vzc2lvblN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGxldCBpID0gMDtcbiAgY29uc3QgdGVtcEZsb29yID0gMztcbiAgY29uc3QgcmVoZWF0VGVtcCA9IDQ1O1xuXG4gIGZ1bmN0aW9uIHJ1bkl0ZXJhdGlvbnMoaXRlcmF0aW9uQnVkZ2V0OiBudW1iZXIsIGRlYWRsaW5lID0gSW5maW5pdHkpIHtcbiAgICBjb25zdCBlbmRJdGVyYXRpb24gPSBNYXRoLm1pbih0YXJnZXRTdGVwcywgaSArIGl0ZXJhdGlvbkJ1ZGdldCk7XG4gICAgd2hpbGUgKGkgPCBlbmRJdGVyYXRpb24pIHtcbiAgICAgIGlmICgoaSAmIDIwNDcpID09PSAwICYmIERhdGUubm93KCkgPj0gZGVhZGxpbmUpIGJyZWFrO1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBpIC8gdGFyZ2V0U3RlcHM7XG4gICAgICB0ZW1wID0gc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgcHJvZ3Jlc3MpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBydW5UaW1lZENodW5rKGJ1ZGdldE1zOiBudW1iZXIpIHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBidWRnZXRNcztcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXBGbG9vciwgc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKSk7XG5cbiAgICAgIGNvbnN0IHIgPSByYW5kb20oKTtcbiAgICAgIGlmIChyIDwgMC40KSB0cnlBc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC41NSkgdHJ5VW5hc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC44NSkgdHJ5UmVpbnNlcnRTYW1wbGVkKCk7XG4gICAgICBlbHNlIHRyeVJlbG9jYXRlU2FtcGxlZCgpO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgd2FybXVwLmVsYXBzZWRNcyArIChEYXRlLm5vdygpIC0gc2Vzc2lvblN0YXJ0ZWRBdCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpdGVyYXRlU3RlcHMoc3RlcHMpIHtcbiAgICAgIHJ1bkl0ZXJhdGlvbnMoc3RlcHMpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gICAgaXRlcmF0ZUZvck1zKGJ1ZGdldE1zKSB7XG4gICAgICBydW5UaW1lZENodW5rKGJ1ZGdldE1zKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCxcbiAgICByZWhlYXQoZmFjdG9yID0gMSkge1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXAsIHJlaGVhdFRlbXAgKiBmYWN0b3IpO1xuICAgICAgLy8gUHVsbCB0aGUgc2VhcmNoIHNsaWdodGx5IGJhY2sgZnJvbSB0aGUgY29sZCBlbmQgb2YgdGhlIHNjaGVkdWxlLlxuICAgICAgaSA9IE1hdGgubWF4KDAsIGkgLSBNYXRoLmZsb29yKHRhcmdldFN0ZXBzICogMC4wOCAqIGZhY3RvcikpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2Q6IE1vZHVsZSwgb3B0aW9uczogSW1wcm92ZWRPcHRpb25zKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3QgdGFyZ2V0U3RlcHMgPSBcInN0ZXBzXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RlcHMgOiBNYXRoLm1heCgxNTAwMDAsIE1hdGguZmxvb3Iob3B0aW9ucy5idWRnZXRNcyAqIDE5MCkpO1xuICBjb25zdCBzZXNzaW9uID0gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZCwgdGFyZ2V0U3RlcHMpO1xuICBpZiAoXCJzdGVwc1wiIGluIG9wdGlvbnMpIHJldHVybiBzZXNzaW9uLml0ZXJhdGVTdGVwcyhvcHRpb25zLnN0ZXBzKTtcbiAgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZUZvck1zKG9wdGlvbnMuYnVkZ2V0TXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wcm92ZWRBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMTUwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgc3RlcHMgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ1RpbWVkKG1vZDogTW9kdWxlLCBidWRnZXRNcyA9IDEwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgYnVkZ2V0TXMgfSk7XG59XG4iLAogICAgIlxuZXhwb3J0IHR5cGUgTnVtVHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCJcbmV4cG9ydCB0eXBlIFJlc3VsdFR5cGUgPSBOdW1UeXBlIHwgXCJ2b2lkXCIgfCBTdHJ1Y3RUeXBlPGFueT5cbmV4cG9ydCB0eXBlIEludFR5cGUgPSBcImkzMlwiIHwgXCJpNjRcIlxuZXhwb3J0IHR5cGUgUGFja2VkVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiXG5leHBvcnQgdHlwZSBTdG9yYWdlVHlwZSA9IE51bVR5cGUgfCBQYWNrZWRUeXBlXG5leHBvcnQgdHlwZSBMb2FkZWRUeXBlPFQgZXh0ZW5kcyBTdG9yYWdlVHlwZT4gPSBUIGV4dGVuZHMgUGFja2VkVHlwZSA/IFwiaTMyXCIgOiBUXG5leHBvcnQgdHlwZSBBcml0aG1ldGljT3AgPSBcImFkZFwiIHwgXCJzdWJcIiB8IFwibXVsXCIgfCBcImRpdlwiXG5leHBvcnQgdHlwZSBCaXRPcCA9IFwieG9yXCIgfCBcInNobFwiIHwgXCJzaHJcIiB8IFwiYW5kXCIgfCBcIm9yXCJcbmV4cG9ydCB0eXBlIFJlbWFpbmRlck9wID0gXCJtb2RcIiB8IFwidW1vZFwiXG5leHBvcnQgdHlwZSBCaW5PcCA9IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3BcbmV4cG9ydCB0eXBlIENtcE9wID0gXCJlcVwiIHwgXCJsdFwiIHwgXCJndFwiXG5jb25zdCBhcml0aG1ldGljT3BzID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdIGFzIGNvbnN0XG5jb25zdCBiaXRPcHMgPSBbXCJhbmRcIiwgXCJvclwiLCBcInhvclwiLCBcInNobFwiLCBcInNoclwiXSBhcyBjb25zdFxuY29uc3QgcmVtYWluZGVyT3BzID0gW1wibW9kXCIsIFwidW1vZFwiXSBhcyBjb25zdFxuY29uc3QgY21wT3BzID0gW1wiZXFcIiwgXCJsdFwiLCBcImd0XCJdIGFzIGNvbnN0XG5leHBvcnQgdHlwZSBWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBUIGV4dGVuZHMgXCJpNjRcIiA/IGJpZ2ludCA6IG51bWJlclxuZXhwb3J0IHR5cGUgVHlwZWRBcnJheUZvcjxUIGV4dGVuZHMgU3RvcmFnZVR5cGU+ID1cbiAgVCBleHRlbmRzIFwiaThcIiA/IEludDhBcnJheSA6XG4gIFQgZXh0ZW5kcyBcInUxNlwiID8gVWludDE2QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpMTZcIiA/IEludDE2QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJ1OFwiID8gVWludDhBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImkzMlwiID8gSW50MzJBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImk2NFwiID8gQmlnSW50NjRBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImYzMlwiID8gRmxvYXQzMkFycmF5IDpcbiAgVCBleHRlbmRzIFwiZjY0XCIgPyBGbG9hdDY0QXJyYXkgOiBuZXZlclxuXG50eXBlIEFyZ3NFeHByPEFyZ3MgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10+ID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBFeHByPEFyZ3NbS10+OiBuZXZlciB9XG50eXBlIEFyZ3NMaWtlPEFyZ3MgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10+ID0geyBbSyBpbiBrZXlvZiBBcmdzXTogQXJnc1tLXSBleHRlbmRzIE51bVR5cGUgPyBFeHByTGlrZTxBcmdzW0tdPjogbmV2ZXIgfVxuZXhwb3J0IHR5cGUgQXJnc1ZhbDxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiAgPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IFZhbHVlPEFyZ3NbS10+IDogbmV2ZXIgfVxuXG50eXBlIExvY2FsTm9kZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGU6IFQsIGxvY2FsOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgQ29yZUV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID1cbiAgfCB7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogVCwgdmFsdWU6IFZhbHVlPFQ+IH1cbiAgfCBMb2NhbE5vZGU8VD5cbiAgfCB7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IFQsIG9wOiBCaW5PcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHI8VD4gfVxuICB8IHsga2luZDogXCJjYWxsXCIsIHR5cGU6IFQsIHRhcmdldDogQW55RnVuYywgYXJnczogRXhwcjxOdW1UeXBlPltdIH1cbiAgfCB7IGtpbmQ6IFwiY2FzdFwiLCB0eXBlOiBULCBpbnB1dFR5cGU6IE51bVR5cGUsIHVuc2lnbmVkOiBib29sZWFuLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImlmXCIsIHR5cGU6IFQsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2U6IEV4cHI8VD4gfVxuICB8IHsga2luZDogXCJsb2FkXCIsIHR5cGU6IFQsIGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0b3JhZ2U6IFN0b3JhZ2VUeXBlLCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiA/IHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBOdW1UeXBlLCBvcDogQ21wT3AsIGxlZnQ6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByPE51bVR5cGU+IH0gOiBuZXZlcilcblxuY2xhc3MgRXhwck1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IHt9XG50eXBlIEFyaXRobWV0aWNNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsgW09wIGluIEFyaXRobWV0aWNPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxudHlwZSBDb21wYXJlTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBDbXBPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxudHlwZSBJbnRlZ2VyTWV0aG9kczxUIGV4dGVuZHMgSW50VHlwZT4gPSB7IFtPcCBpbiBCaXRPcCB8IFJlbWFpbmRlck9wXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5leHBvcnQgdHlwZSBFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IENvcmVFeHByPFQ+ICYgRXhwck1ldGhvZHM8VD4gJiBBcml0aG1ldGljTWV0aG9kczxUPiAmIENvbXBhcmVNZXRob2RzPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gSW50ZWdlck1ldGhvZHM8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIEFueUV4cHIgPSBhbnlcblxuXG5leHBvcnQgdHlwZSBTdG10ID1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBudW1iZXIsIHR5cGU6IE51bVR5cGUsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXk6IEFueUFycmF5LCB0eXBlOiBTdG9yYWdlVHlwZSwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZTogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJhcnJheS5tb3ZlXCIsIGFycmF5OiBBbnlBcnJheSwgdGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+IH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdFtdLCBlbHNlOiBTdG10W10gfVxuICB8IHsga2luZDogXCJibG9ja1wiLCBjb250cm9sOiBudW1iZXIsIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogbnVtYmVyLCBjb25kOiBFeHByPFwiaTMyXCI+LCBib2R5OiBTdG10W10gfVxuICB8IHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU/OiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiY2FsbC52b2lkXCIsIHRhcmdldDogQW55RnVuYywgYXJnczogRXhwcjxOdW1UeXBlPltdIH1cbiAgfCB7IGtpbmQ6IFwidHJhcFwiLCBtZXNzYWdlOiBzdHJpbmcgfVxuICB8IHsga2luZDogXCJsb2dcIiwgbWVzc2FnZTogc3RyaW5nLCB2YWx1ZTogRXhwcjxcImkzMlwiPiB9XG4gIHwgeyBraW5kOiBcImV4cHJcIiwgZXhwcjogRXhwcjxOdW1UeXBlPiB9XG5cbmV4cG9ydCB0eXBlIEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBudW1iZXIgfVxudHlwZSBDb250cm9sSGFuZGxlID0gQmxvY2tIYW5kbGUgfCBMb29wSGFuZGxlXG5cbmNsYXNzIE11dGFibGVNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiBleHRlbmRzIEV4cHJNZXRob2RzPFQ+IHtcbiAgZGVjbGFyZSB0eXBlOiBUXG4gIGRlY2xhcmUgd3JpdGU6ICh2YWx1ZTogRXhwcjxUPikgPT4gU3RtdFxuICBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KSB7IHJldHVybiB0aGlzLndyaXRlKGxpdCh0aGlzLnR5cGUsIHZhbHVlKSkgfVxufVxudHlwZSBNdXRhYmxlQXJpdGhtZXRpYzxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBBcml0aG1ldGljT3AgYXMgYGkke09wfWBdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBTdG10IH1cbnR5cGUgTXV0YWJsZUludGVnZXI8VCBleHRlbmRzIEludFR5cGU+ID0geyBbT3AgaW4gXCJhbmRcIiB8IFwib3JcIiB8IFwieG9yXCIgYXMgYGkke09wfWBdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBTdG10IH1cbmV4cG9ydCB0eXBlIE11dGFibGVWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+ICYgeyBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdCB9ICYgTXV0YWJsZUFyaXRobWV0aWM8VD4gJiAoVCBleHRlbmRzIEludFR5cGUgPyBNdXRhYmxlSW50ZWdlcjxUPiA6IHt9KVxuZXhwb3J0IHR5cGUgTG9jYWxWYXI8VCBleHRlbmRzIE51bVR5cGU+ID0gTXV0YWJsZVZhbHVlPFQ+ICYgTG9jYWxOb2RlPFQ+XG5cbmV4cG9ydCB0eXBlIEFycmF5SGFuZGxlPFQgZXh0ZW5kcyBTdG9yYWdlVHlwZT4gPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICB0eXBlOiBUXG4gIGxlbmd0aDogbnVtYmVyXG4gIGVsZW1lbnRTaXplOiBudW1iZXJcbiAgYXQoaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+KTogTXV0YWJsZVZhbHVlPExvYWRlZFR5cGU8VD4+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBCaXRTdG9yYWdlVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiIHwgXCJpMzJcIlxuZXhwb3J0IHR5cGUgQml0RmllbGQgPSByZWFkb25seSBbQml0U3RvcmFnZVR5cGUsIG51bWJlcl1cbmV4cG9ydCB0eXBlIFN0cnVjdFN0b3JhZ2VUeXBlID0gUGFja2VkVHlwZSB8IEludFR5cGVcbmV4cG9ydCB0eXBlIEZpZWxkVHlwZSA9IFN0cnVjdFN0b3JhZ2VUeXBlIHwgQml0RmllbGRcbmV4cG9ydCB0eXBlIFN0cnVjdEZpZWxkcyA9IFJlY29yZDxzdHJpbmcsIEZpZWxkVHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkU3RvcmFnZTxUIGV4dGVuZHMgRmllbGRUeXBlPiA9IFQgZXh0ZW5kcyByZWFkb25seSBbaW5mZXIgUyBleHRlbmRzIEJpdFN0b3JhZ2VUeXBlLCBudW1iZXJdID8gUyA6IEV4dHJhY3Q8VCwgU3RvcmFnZVR5cGU+XG5leHBvcnQgdHlwZSBGaWVsZFZhbHVlPFQgZXh0ZW5kcyBGaWVsZFR5cGU+ID0gTG9hZGVkVHlwZTxGaWVsZFN0b3JhZ2U8VD4+XG5leHBvcnQgdHlwZSBGaWVsZExheW91dCA9IHsgc3RvcmFnZTogU3RydWN0U3RvcmFnZVR5cGUsIGJpdE9mZnNldDogbnVtYmVyLCBiaXRzOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgU3RydWN0VHlwZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHtcbiAga2luZDogXCJzdHJ1Y3RcIlxuICBmaWVsZHM6IEZcbiAgbGF5b3V0OiB7IFtLIGluIGtleW9mIEZdOiBGaWVsZExheW91dCB9XG4gIHNpemU6IG51bWJlclxuICBzdG9yYWdlOiBcInU4XCIgfCBcInUxNlwiIHwgSW50VHlwZVxufVxudHlwZSBTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogRXhwcjxGaWVsZFZhbHVlPEZbS10+PlxufVxudHlwZSBNdXRhYmxlU3RydWN0TWVtYmVyczxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHtcbiAgW0sgaW4ga2V5b2YgRl06IE11dGFibGVWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PlxufVxuZXhwb3J0IHR5cGUgU3RydWN0SW5pdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHsgW0sgaW4ga2V5b2YgRl06IEV4cHJMaWtlPEZpZWxkVmFsdWU8RltLXT4+IH1cbmV4cG9ydCB0eXBlIEpTU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogVmFsdWU8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgU3RydWN0VmFsdWU8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSBTdHJ1Y3RNZW1iZXJzPEY+ICYgeyBwYWNrZWQ6IEFueUV4cHIgfVxuZXhwb3J0IHR5cGUgTXV0YWJsZVN0cnVjdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdFZhbHVlPEY+ICYgTXV0YWJsZVN0cnVjdE1lbWJlcnM8Rj4gJiB7XG4gIHNldCh2YWx1ZTogTXV0YWJsZVN0cnVjdDxGPiB8IFN0cnVjdEluaXQ8Rj4pOiBTdG10XG59XG5leHBvcnQgdHlwZSBTdHJ1Y3RBcnJheUhhbmRsZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IFN0cnVjdFR5cGU8Rj5cbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBNdXRhYmxlU3RydWN0PEY+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBFeHByTGlrZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+IHwgVmFsdWU8VD5cbmV4cG9ydCB0eXBlIFN0bXRCb2R5ID0gU3RtdCB8IFN0bXRCb2R5W11cbnR5cGUgQ29udHJvbEJvZHk8SCBleHRlbmRzIENvbnRyb2xIYW5kbGU+ID0gU3RtdEJvZHkgfCAoKHNlbGY6IEgpID0+IFN0bXRCb2R5KVxuZXhwb3J0IHR5cGUgRnVuY0JvZHk8UiBleHRlbmRzIFJlc3VsdFR5cGU+ID1cbiAgUiBleHRlbmRzIE51bVR5cGUgPyBFeHByPFI+IHwgU3RtdEJvZHkgOlxuICBSIGV4dGVuZHMgU3RydWN0VHlwZTxpbmZlciBGPiA/IFN0cnVjdFZhbHVlPEY+IHwgU3RtdEJvZHkgOlxuICBTdG10Qm9keVxuZXhwb3J0IHR5cGUgRnVuY0hhbmRsZTxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIHBhcmFtczogQVxuICByZXN1bHQ6IFJcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+XG4gIGNhbGw6ICguLi5hcmdzOiBBcmdzTGlrZTxBPikgPT5cbiAgICBSIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8Uj4gOlxuICAgIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gOlxuICAgIFN0bXRcbn1cblxuZXhwb3J0IHR5cGUgQW55RnVuYyA9IHtcbiAga2luZDogXCJmdW5jXCJcbiAgcGFyYW1zOiByZWFkb25seSBOdW1UeXBlW11cbiAgcmVzdWx0OiBSZXN1bHRUeXBlXG4gIGJ1aWxkOiAoLi4uYXJnczogcmVhZG9ubHkgQW55RXhwcltdKSA9PiBhbnlcbiAgY2FsbDogKC4uLmFyZ3M6IGFueVtdKSA9PiBBbnlFeHByXG59XG5cbmV4cG9ydCB0eXBlIEFueUFycmF5ID0ge1xuICBraW5kOiBcImFycmF5XCJcbiAgdHlwZTogU3RvcmFnZVR5cGUgfCBTdHJ1Y3RUeXBlPGFueT5cbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdCguLi5hcmdzOiBhbnlbXSk6IGFueVxuICBtb3ZlKC4uLmFyZ3M6IGFueVtdKTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBNb2R1bGVEZWYgPSBSZWNvcmQ8c3RyaW5nLCBBbnlGdW5jIHwgQW55QXJyYXk+XG5leHBvcnQgdHlwZSBGdW5jRGVmczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHsgW0sgaW4ga2V5b2YgVCBhcyBUW0tdIGV4dGVuZHMgQW55RnVuYyA/IEsgOiBuZXZlcl06IEV4dHJhY3Q8VFtLXSwgQW55RnVuYz4gfVxuZXhwb3J0IHR5cGUgQXJyYXlEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlBcnJheSA/IEsgOiBuZXZlcl06IEV4dHJhY3Q8VFtLXSwgQW55QXJyYXk+IH1cbmV4cG9ydCB0eXBlIENvbXBpbGVSZXN1bHQ8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7XG4gIFtLIGluIGtleW9mIFRdOlxuICAgIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gKC4uLmFyZ3M6IEFyZ3NWYWw8VFtLXVtcInBhcmFtc1wiXT4pID0+XG4gICAgICBUW0tdW1wicmVzdWx0XCJdIGV4dGVuZHMgTnVtVHlwZSA/IFZhbHVlPFRbS11bXCJyZXN1bHRcIl0+IDpcbiAgICAgIFRbS11bXCJyZXN1bHRcIl0gZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gSlNTdHJ1Y3Q8Rj4gOlxuICAgICAgdm9pZFxuICAgIDogVFtLXSBleHRlbmRzIEFycmF5SGFuZGxlPGluZmVyIFM+ID8gVHlwZWRBcnJheUZvcjxTPlxuICAgIDogVFtLXSBleHRlbmRzIFN0cnVjdEFycmF5SGFuZGxlPGFueT4gPyBVaW50OEFycmF5IHwgVWludDE2QXJyYXkgfCBVaW50MzJBcnJheSB8IEJpZ1VpbnQ2NEFycmF5XG4gICAgOiBuZXZlclxufSAmIHtcbiAgbW9kOiBXZWJBc3NlbWJseS5Nb2R1bGVcbiAgbWVtb3J5OiBXZWJBc3NlbWJseS5NZW1vcnlcbiAgdHJhcE1lc3NhZ2VzOiBzdHJpbmdbXVxuICBsb2dNZXNzYWdlczogc3RyaW5nW11cbiAgcmVzdWx0U3RydWN0czogUmVjb3JkPHN0cmluZywgU3RydWN0VHlwZTxhbnk+PlxufVxuXG5cbmxldCBuZXh0TG9jYWxJZCA9IDBcbmxldCBuZXh0Q29udHJvbElkID0gMFxuXG5jb25zdCBpbmZlclR5cGUgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPikgPT5cbiAgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiBcInR5cGVcIiBpbiB2YWx1ZSA/IHZhbHVlLnR5cGUgOiBcImkzMlwiKSBhcyBUXG5cbmNvbnN0IGV4cHIgPSA8VCBleHRlbmRzIE51bVR5cGU+KG5vZGU6IENvcmVFeHByPFQ+KTogRXhwcjxUPiA9PiB7XG4gIHJldHVybiBPYmplY3Quc2V0UHJvdG90eXBlT2Yobm9kZSwgRXhwck1ldGhvZHMucHJvdG90eXBlKSBhcyBFeHByPFQ+XG59XG5cbmV4cG9ydCBjb25zdCBsaXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT4ge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKFwia2luZFwiIGluIHZhbHVlKSByZXR1cm4gdmFsdWUgYXMgRXhwcjxUPlxuICB9XG4gIHJldHVybiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlLCB2YWx1ZTogdmFsdWUgYXMgVmFsdWU8VD4gfSlcbn1cbmNvbnN0IG11dGFibGUgPSA8VCBleHRlbmRzIE51bVR5cGU+KG5vZGU6IENvcmVFeHByPFQ+LCB3cml0ZTogKHZhbHVlOiBFeHByPFQ+KSA9PiBTdG10KSA9PlxuICBPYmplY3QuYXNzaWduKE9iamVjdC5zZXRQcm90b3R5cGVPZihub2RlLCBNdXRhYmxlTWV0aG9kcy5wcm90b3R5cGUpLCB7IHdyaXRlIH0pIGFzIE11dGFibGVWYWx1ZTxUPlxuXG5jb25zdCBpc1N0bXQgPSAoeDogdW5rbm93bik6IHggaXMgU3RtdCA9PlxuICAhIXggJiYgdHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgXCJraW5kXCIgaW4geCAmJiAoXG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJpZlwiID8gQXJyYXkuaXNBcnJheSgoeCBhcyB7IHRoZW4/OiB1bmtub3duIH0pLnRoZW4pIDpcbiAgICAhW1wiY29uc3RcIiwgXCJsb2NhbC5nZXRcIiwgXCJiaW5cIiwgXCJjYWxsXCIsIFwiY2FzdFwiLCBcImxvYWRcIiwgXCJjbXBcIl0uaW5jbHVkZXMoKHggYXMgeyBraW5kOiBzdHJpbmcgfSkua2luZClcbiAgKVxuXG5jb25zdCBzdG10TGlzdCA9IChib2R5OiBTdG10Qm9keSk6IFN0bXRbXSA9PiBBcnJheS5pc0FycmF5KGJvZHkpID8gYm9keS5mbGF0TWFwKHN0bXRMaXN0KSA6IFtib2R5XVxuZXhwb3J0IGNvbnN0IGFzU3RtdHMgPSA8UiBleHRlbmRzIFJlc3VsdFR5cGU+KGJvZHk6IEZ1bmNCb2R5PFI+KSA9PiBpc1N0bXQoYm9keSkgPyBbYm9keV0gOiBBcnJheS5pc0FycmF5KGJvZHkpID8gc3RtdExpc3QoYm9keSkgOiBudWxsXG5jb25zdCBiaW5kU3RtdHMgPSAoYm9keTogU3RtdEJvZHksIGJyOiBudW1iZXIsIGxvb3A6IG51bWJlciB8IG51bGwpOiBTdG10W10gPT5cbiAgc3RtdExpc3QoYm9keSkubWFwKHMgPT4gYmluZFN0bXQocywgYnIsIGxvb3ApKVxuXG5jb25zdCBiaW5kU3RtdCA9IChzOiBTdG10LCBicjogbnVtYmVyLCBsb29wOiBudW1iZXIgfCBudWxsKTogU3RtdCA9PiB7XG4gIHN3aXRjaCAocy5raW5kKSB7XG4gICAgY2FzZSBcImlmXCI6IHJldHVybiB7IC4uLnMsIHRoZW46IGJpbmRTdG10cyhzLnRoZW4sIGJyLCBsb29wKSwgZWxzZTogYmluZFN0bXRzKHMuZWxzZSwgYnIsIGxvb3ApIH1cbiAgICBjYXNlIFwiYnJlYWtcIjogcmV0dXJuIHsgLi4ucywgdGFyZ2V0OiBzLnRhcmdldCA/PyBiciB9XG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgIT0gbnVsbCkgcmV0dXJuIHNcbiAgICAgIGlmIChsb29wID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcImNvbnRpbnVlVG8oKSB1c2VkIG91dHNpZGUgYSBsb29wXCIpXG4gICAgICByZXR1cm4geyAuLi5zLCB0YXJnZXQ6IGxvb3AgfVxuICAgIGRlZmF1bHQ6IHJldHVybiBzXG4gIH1cbn1cblxuY29uc3QgY29udHJvbEJvZHkgPSA8SCBleHRlbmRzIENvbnRyb2xIYW5kbGU+KHNlbGY6IEgsIGJvZHk6IENvbnRyb2xCb2R5PEg+KSA9PlxuICBiaW5kU3RtdHModHlwZW9mIGJvZHkgPT09IFwiZnVuY3Rpb25cIiA/IGJvZHkoc2VsZikgOiBib2R5LCBzZWxmLmlkLCBzZWxmLmtpbmQgPT09IFwibG9vcFwiID8gc2VsZi5pZCA6IG51bGwpXG5cbmNvbnN0IGJpbiA9IDxUIGV4dGVuZHMgTnVtVHlwZT4ob3A6IEFyaXRobWV0aWNPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PlxuICBleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KVxuXG5jb25zdCBiaXQgPSA8VCBleHRlbmRzIEludFR5cGU+KG9wOiBCaXRPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PlxuICBleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KVxuXG5jb25zdCByZW1haW5kZXIgPSA8VCBleHRlbmRzIEludFR5cGU+KG9wOiBSZW1haW5kZXJPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PlxuICBleHByPFQ+KHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KVxuXG5jb25zdCBjbXAgPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBDbXBPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPiA9PlxuICBleHByPFwiaTMyXCI+KHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0OiBsZWZ0IGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IGxpdDxUPihsZWZ0LnR5cGUgYXMgVCwgcmlnaHQpIGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPiB9IGFzIENvcmVFeHByPFwiaTMyXCI+KVxuXG5leHBvcnQgY29uc3QgYWxsb2NhdGVMb2NhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCkgPT4gZXhwcih7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGUsIGxvY2FsOiBuZXh0TG9jYWxJZCsrIH0pXG5cbmNvbnN0IG1rTG9jYWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiBMb2NhbFZhcjxUPiA9PiB7XG4gIGNvbnN0IGxvY2FsID0gbmV4dExvY2FsSWQrK1xuICByZXR1cm4gbXV0YWJsZSh7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGUsIGxvY2FsIH0sIHZhbHVlID0+ICh7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsLCB0eXBlLCB2YWx1ZTogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KSkgYXMgTG9jYWxWYXI8VD5cbn1cblxuY29uc3QgbWtIYW5kbGUgPSA8QSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIFJlc3VsdFR5cGU+KFxuICBwYXJhbXM6IEEsXG4gIHJlc3VsdDogUixcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+LFxuKTogRnVuY0hhbmRsZTxBLCBSPiA9PiB7XG4gIGxldCBoYW5kbGUhOiBGdW5jSGFuZGxlPEEsIFI+XG4gIGhhbmRsZSA9IHtcbiAgICBraW5kOiBcImZ1bmNcIixcbiAgICBwYXJhbXMsIHJlc3VsdCwgYnVpbGQsXG4gICAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NMaWtlPEE+KSA9PiB7XG4gICAgICBjb25zdCBjYWxsQXJncyA9IHBhcmFtcy5tYXAoKHR5cGUsIGkpID0+IGxpdCh0eXBlLCBhcmdzW2ldIGFzIEV4cHJMaWtlPHR5cGVvZiB0eXBlPikpIGFzIEV4cHI8TnVtVHlwZT5bXVxuICAgICAgaWYgKHJlc3VsdCA9PT0gXCJ2b2lkXCIpIHJldHVybiB7IGtpbmQ6IFwiY2FsbC52b2lkXCIsIHRhcmdldDogaGFuZGxlLCBhcmdzOiBjYWxsQXJncyB9XG4gICAgICBjb25zdCB0eXBlID0gKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyByZXN1bHQgOiByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiKSBhcyBOdW1UeXBlXG4gICAgICBjb25zdCBjYWxsID0gZXhwcih7IGtpbmQ6IFwiY2FsbFwiLCB0eXBlLCB0YXJnZXQ6IGhhbmRsZSwgYXJnczogY2FsbEFyZ3MgfSlcbiAgICAgIHJldHVybiB0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiID8gY2FsbCA6IHJlYWRTdHJ1Y3QocmVzdWx0LCBjYWxsKVxuICAgIH0sXG4gIH0gYXMgRnVuY0hhbmRsZTxBLCBSPlxuICByZXR1cm4gaGFuZGxlXG59XG5cbmNvbnN0IGxvYWRlZFR5cGUgPSA8VCBleHRlbmRzIFN0b3JhZ2VUeXBlPih0eXBlOiBUKSA9PlxuICAodHlwZSA9PT0gXCJpOFwiIHx8IHR5cGUgPT09IFwidThcIiB8fCB0eXBlID09PSBcImkxNlwiIHx8IHR5cGUgPT09IFwidTE2XCIgPyBcImkzMlwiIDogdHlwZSkgYXMgTG9hZGVkVHlwZTxUPlxuXG5jb25zdCBzdG9yYWdlU2l6ZTogUmVjb3JkPFN0b3JhZ2VUeXBlLCBudW1iZXI+ID0geyBpODogMSwgdTg6IDEsIGkxNjogMiwgdTE2OiAyLCBpMzI6IDQsIGYzMjogNCwgaTY0OiA4LCBmNjQ6IDggfVxuY29uc3QgbWVtb3J5VmFsdWUgPSA8VCBleHRlbmRzIFN0b3JhZ2VUeXBlPihhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgc3RvcmFnZTogVCwgc3RyaWRlOiBudW1iZXIsIG9mZnNldCA9IDApID0+IHtcbiAgY29uc3QgYXQgPSBsaXQoXCJpMzJcIiwgaW5kZXgpXG4gIHJldHVybiBtdXRhYmxlKHsga2luZDogXCJsb2FkXCIsIHR5cGU6IGxvYWRlZFR5cGUoc3RvcmFnZSksIGFycmF5LCBpbmRleDogYXQsIHN0b3JhZ2UsIHN0cmlkZSwgb2Zmc2V0IH0sIHZhbHVlID0+XG4gICAgKHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheSwgdHlwZTogc3RvcmFnZSwgaW5kZXg6IGF0LCBzdHJpZGUsIG9mZnNldCwgdmFsdWU6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSkpXG59XG5cbnR5cGUgU3RydWN0QmFja2luZyA9IGFueVxudHlwZSBJbnRlcm5hbFN0cnVjdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IE11dGFibGVTdHJ1Y3Q8Rj4gJiB7IHBhY2tlZDogU3RydWN0QmFja2luZyB9XG5cbmNvbnN0IHJlYWRGaWVsZCA9IChiYWNraW5nOiBBbnlFeHByLCBmaWVsZDogRmllbGRMYXlvdXQpID0+IHtcbiAgY29uc3QgeyBiaXRzIH0gPSBmaWVsZFxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGJhY2tpbmdcbiAgaWYgKGJhY2tpbmcudHlwZSA9PT0gXCJpNjRcIikge1xuICAgIGNvbnN0IGJpdE9mZnNldCA9IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpLCBtYXNrID0gKDFuIDw8IEJpZ0ludChiaXRzKSkgLSAxblxuICAgIGNvbnN0IHJhdyA9IGkzMihiYWNraW5nLnNocihiaXRPZmZzZXQpLmFuZChtYXNrKSlcbiAgICByZXR1cm4gZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiBiaXRzIDwgMzJcbiAgICAgID8gaWZFbHNlKHJhdy5hbmQoMiAqKiAoYml0cyAtIDEpKSwgcmF3LnN1YigyICoqIGJpdHMpLCByYXcpXG4gICAgICA6IHJhd1xuICB9XG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImkzMlwiICYmIGZpZWxkLmJpdE9mZnNldCA9PT0gMCkgcmV0dXJuIGJhY2tpbmdcbiAgY29uc3QgbWFzayA9IDIgKiogYml0cyAtIDFcbiAgY29uc3QgcmF3ID0gYmFja2luZy5zaHIoZmllbGQuYml0T2Zmc2V0KS5hbmQobWFzaylcbiAgcmV0dXJuIGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgYml0cyA8IDMyXG4gICAgPyBpZkVsc2UocmF3LmFuZCgyICoqIChiaXRzIC0gMSkpLCByYXcuc3ViKDIgKiogYml0cyksIHJhdylcbiAgICA6IHJhd1xufVxuXG5jb25zdCBwYWNrZWRGaWVsZFZhbHVlID0gKGJhY2tpbmc6IFN0cnVjdEJhY2tpbmcsIGZpZWxkOiBGaWVsZExheW91dCkgPT4ge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRGaWVsZChiYWNraW5nLCBmaWVsZClcbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIpIHJldHVybiBiYWNraW5nXG4gIGlmIChiYWNraW5nLnR5cGUgPT09IFwiaTY0XCIpIHtcbiAgICBjb25zdCBiaXRPZmZzZXQgPSBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSwgbWFzayA9ICgxbiA8PCBCaWdJbnQoZmllbGQuYml0cykpIC0gMW5cbiAgICBjb25zdCBmaWVsZE1hc2sgPSBtYXNrIDw8IGJpdE9mZnNldFxuICAgIHJldHVybiBtdXRhYmxlPFwiaTMyXCI+KHZhbHVlIGFzIEV4cHI8XCJpMzJcIj4sIGlucHV0ID0+IGJhY2tpbmcuc2V0KGJhY2tpbmcuYW5kKH5maWVsZE1hc2spLm9yKGk2NHUoaW5wdXQpLmFuZChtYXNrKS5zaGwoYml0T2Zmc2V0KSkpKVxuICB9XG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImkzMlwiICYmIGZpZWxkLmJpdE9mZnNldCA9PT0gMCkgcmV0dXJuIGJhY2tpbmdcbiAgY29uc3QgbWFzayA9IDIgKiogZmllbGQuYml0cyAtIDEsIGZpZWxkTWFzayA9IG1hc2sgPDwgZmllbGQuYml0T2Zmc2V0XG4gIHJldHVybiBtdXRhYmxlPFwiaTMyXCI+KHZhbHVlLCBpbnB1dCA9PiBiYWNraW5nLnNldChiYWNraW5nLmFuZCh+ZmllbGRNYXNrKS5vcihpbnB1dC5hbmQobWFzaykuc2hsKGZpZWxkLmJpdE9mZnNldCkpKSlcbn1cblxuY29uc3QgcmVhZFN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCBwYWNrZWQ6IEFueUV4cHIpOiBTdHJ1Y3RWYWx1ZTxGPiA9PlxuICBPYmplY3QuYXNzaWduKE9iamVjdC5mcm9tRW50cmllcyhPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykubWFwKG5hbWUgPT4gW25hbWUsIHJlYWRGaWVsZChwYWNrZWQsIHR5cGUubGF5b3V0W25hbWVdISldKSksIHsgcGFja2VkIH0pIGFzIFN0cnVjdFZhbHVlPEY+XG5cbmNvbnN0IHN0cnVjdFZhbHVlID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHBhY2tlZDogU3RydWN0QmFja2luZyk6IE11dGFibGVTdHJ1Y3Q8Rj4gPT4ge1xuICBjb25zdCBmaWVsZHMgPSBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmtleXModHlwZS5maWVsZHMpLm1hcChuYW1lID0+IFtuYW1lLCBwYWNrZWRGaWVsZFZhbHVlKHBhY2tlZCwgdHlwZS5sYXlvdXRbbmFtZV0hKV0pKVxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihmaWVsZHMsIHsgcGFja2VkLCBzZXQ6ICh2YWx1ZTogTXV0YWJsZVN0cnVjdDxGPiB8IFN0cnVjdEluaXQ8Rj4pID0+XG4gICAgcGFja2VkLnNldChcInBhY2tlZFwiIGluIHZhbHVlID8gKHZhbHVlIGFzIEludGVybmFsU3RydWN0PEY+KS5wYWNrZWQgOiBwYWNrU3RydWN0KHR5cGUsIHZhbHVlKSkgfSkgYXMgSW50ZXJuYWxTdHJ1Y3Q8Rj5cbn1cblxuY29uc3QgcGFja1N0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCB2YWx1ZXM6IFN0cnVjdEluaXQ8Rj4pOiBBbnlFeHByID0+IHtcbiAgaWYgKHR5cGUuc3RvcmFnZSAhPT0gXCJpNjRcIikgcmV0dXJuIE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5yZWR1Y2UoKHBhY2tlZCwgbmFtZSkgPT4ge1xuICAgIGNvbnN0IGZpZWxkID0gdHlwZS5sYXlvdXRbbmFtZV0hLCB2YWx1ZSA9IHZhbHVlc1tuYW1lXSFcbiAgICBjb25zdCBtYXNrID0gMiAqKiBmaWVsZC5iaXRzIC0gMVxuICAgIHJldHVybiBwYWNrZWQub3IobGl0KFwiaTMyXCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTMyXCI+KS5hbmQobWFzaykuc2hsKGZpZWxkLmJpdE9mZnNldCkpXG4gIH0sIGkzMigwKSlcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5yZWR1Y2UoKHBhY2tlZCwgbmFtZSkgPT4ge1xuICAgIGNvbnN0IGZpZWxkID0gdHlwZS5sYXlvdXRbbmFtZV0hLCB2YWx1ZSA9IHZhbHVlc1tuYW1lXSFcbiAgICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGxpdChcImk2NFwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImk2NFwiPilcbiAgICBjb25zdCBtYXNrID0gKDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzKSkgLSAxblxuICAgIHJldHVybiBwYWNrZWQub3IoaTY0dShsaXQoXCJpMzJcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpMzJcIj4pKS5hbmQobWFzaykuc2hsKEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpKSlcbiAgfSwgaTY0KDBuKSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cnVjdCA9IDxjb25zdCBGIGV4dGVuZHMgU3RydWN0RmllbGRzPihmaWVsZHM6IEYpOiBTdHJ1Y3RUeXBlPEY+ID0+IHtcbiAgaWYgKFwic2V0XCIgaW4gZmllbGRzIHx8IFwicGFja2VkXCIgaW4gZmllbGRzKSB0aHJvdyBuZXcgRXJyb3IoXCJTdHJ1Y3QgZmllbGRzIGNhbm5vdCBiZSBuYW1lZCBzZXQgb3IgcGFja2VkXCIpXG4gIGxldCB1c2VkID0gMFxuICBjb25zdCBsYXlvdXQ6IFBhcnRpYWw8UmVjb3JkPGtleW9mIEYsIEZpZWxkTGF5b3V0Pj4gPSB7fVxuICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMoZmllbGRzKSBhcyAoa2V5b2YgRilbXSkge1xuICAgIGNvbnN0IGZpZWxkID0gZmllbGRzW25hbWVdIVxuICAgIGNvbnN0IHN0b3JhZ2UgPSAoQXJyYXkuaXNBcnJheShmaWVsZCkgPyBmaWVsZFswXSA6IGZpZWxkKSBhcyBTdHJ1Y3RTdG9yYWdlVHlwZVxuICAgIGNvbnN0IGJpdHMgPSBBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkWzFdIDogc3RvcmFnZVNpemVbc3RvcmFnZV0gKiA4XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGJpdHMpIHx8IGJpdHMgPCAxIHx8IGJpdHMgPiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSAqIDgpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCAke3N0b3JhZ2V9IGJpdC1maWVsZCB3aWR0aCAke2JpdHN9YClcbiAgICBpZiAodXNlZCArIGJpdHMgPiA2NCkgdGhyb3cgbmV3IEVycm9yKGBTdHJ1Y3QgcmVxdWlyZXMgJHt1c2VkICsgYml0c30gYml0czsgbWF4aW11bSBpcyA2NGApXG4gICAgbGF5b3V0W25hbWVdID0geyBzdG9yYWdlLCBiaXRPZmZzZXQ6IHVzZWQsIGJpdHMgfVxuICAgIHVzZWQgKz0gYml0c1xuICB9XG4gIGNvbnN0IHN0b3JhZ2UgPSB1c2VkIDw9IDggPyBcInU4XCIgOiB1c2VkIDw9IDE2ID8gXCJ1MTZcIiA6IHVzZWQgPD0gMzIgPyBcImkzMlwiIDogXCJpNjRcIlxuICByZXR1cm4geyBraW5kOiBcInN0cnVjdFwiLCBmaWVsZHMsIGxheW91dDogbGF5b3V0IGFzIHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH0sIHN0b3JhZ2UsIHNpemU6IHN0b3JhZ2VTaXplW3N0b3JhZ2VdIH1cbn1cblxuY29uc3QgY2FzdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHI8TnVtVHlwZT4sIHVuc2lnbmVkID0gZmFsc2UpOiBFeHByPFQ+ID0+XG4gIHZhbHVlLnR5cGUgPT09IHR5cGUgPyB2YWx1ZSBhcyB1bmtub3duIGFzIEV4cHI8VD4gOiBleHByPFQ+KHsga2luZDogXCJjYXN0XCIsIHR5cGUsIGlucHV0VHlwZTogdmFsdWUudHlwZSwgdW5zaWduZWQsIHZhbHVlIH0gYXMgQ29yZUV4cHI8VD4pXG5jb25zdCBudW1iZXIgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiB1bmtub3duKTogRXhwcjxUPiA9PlxuICB0eXBlb2YgdmFsdWUgPT09ICh0eXBlID09PSBcImk2NFwiID8gXCJiaWdpbnRcIiA6IFwibnVtYmVyXCIpXG4gICAgPyBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlLCB2YWx1ZSB9IGFzIENvcmVFeHByPFQ+KVxuICAgIDogY2FzdCh0eXBlLCB2YWx1ZSBhcyBFeHByPE51bVR5cGU+KVxuXG5leHBvcnQgZnVuY3Rpb24gaTMyKHZhbHVlOiBudW1iZXIpOiBFeHByPFwiaTMyXCI+XG5leHBvcnQgZnVuY3Rpb24gaTMyPFQgZXh0ZW5kcyBJbnRUeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJpMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBpMzIodmFsdWU6IHVua25vd24pIHsgcmV0dXJuIG51bWJlcihcImkzMlwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgZnVuY3Rpb24gaTY0KHZhbHVlOiBiaWdpbnQpOiBFeHByPFwiaTY0XCI+XG5leHBvcnQgZnVuY3Rpb24gaTY0PFQgZXh0ZW5kcyBJbnRUeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJpNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBpNjQodmFsdWU6IHVua25vd24pIHsgcmV0dXJuIG51bWJlcihcImk2NFwiLCB2YWx1ZSkgfVxuZXhwb3J0IGNvbnN0IGk2NHUgPSAodmFsdWU6IEV4cHI8XCJpMzJcIj4pID0+IGNhc3QoXCJpNjRcIiwgdmFsdWUgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+LCB0cnVlKVxuXG50eXBlIEYzMklucHV0ID0gbnVtYmVyIHwgRXhwcjxcImkzMlwiIHwgXCJpNjRcIiB8IFwiZjMyXCIgfCBcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMih2YWx1ZTogbnVtYmVyKTogRXhwcjxcImYzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGYzMjxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiZjMyXCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyKHZhbHVlOiBGMzJJbnB1dCkgeyByZXR1cm4gbnVtYmVyKFwiZjMyXCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBmNjQodmFsdWU6IG51bWJlcik6IEV4cHI8XCJmNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBmNjQ8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGY2NCh2YWx1ZTogRjMySW5wdXQpIHsgcmV0dXJuIG51bWJlcihcImY2NFwiLCB2YWx1ZSkgfVxuXG5leHBvcnQgZnVuY3Rpb24gaWZFbHNlPFQgZXh0ZW5kcyBOdW1UeXBlPihjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlXzogRXhwcjxUPik6IEV4cHI8VD5cbmV4cG9ydCBmdW5jdGlvbiBpZkVsc2UoY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdEJvZHksIGVsc2VfPzogU3RtdEJvZHkpOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gaWZFbHNlPFQgZXh0ZW5kcyBOdW1UeXBlPihjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+IHwgU3RtdEJvZHksIGVsc2VfPzogRXhwcjxUPiB8IFN0bXRCb2R5KTogRXhwcjxUPiB8IFN0bXQge1xuICByZXR1cm4gaXNTdG10KHRoZW4pIHx8IEFycmF5LmlzQXJyYXkodGhlbilcbiAgICA/IHsga2luZDogXCJpZlwiLCBjb25kLCB0aGVuOiBzdG10TGlzdCh0aGVuIGFzIFN0bXRCb2R5KSwgZWxzZTogZWxzZV8gPT09IHVuZGVmaW5lZCA/IFtdIDogc3RtdExpc3QoZWxzZV8gYXMgU3RtdEJvZHkpIH1cbiAgICA6IGV4cHI8VD4oeyBraW5kOiBcImlmXCIsIHR5cGU6IHRoZW4udHlwZSwgY29uZCwgdGhlbiwgZWxzZTogZWxzZV8gYXMgRXhwcjxUPiB9IGFzIENvcmVFeHByPFQ+KVxufVxuXG5jb25zdCBhcml0aG1ldGljID0gT2JqZWN0LmZyb21FbnRyaWVzKGFyaXRobWV0aWNPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIEFyaXRobWV0aWNPcF06IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IGJpdHMgPSBPYmplY3QuZnJvbUVudHJpZXMoYml0T3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaXQob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBCaXRPcF06IDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IHJlbWFpbmRlcnMgPSBPYmplY3QuZnJvbUVudHJpZXMocmVtYWluZGVyT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiByZW1haW5kZXIob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBSZW1haW5kZXJPcF06IDxUIGV4dGVuZHMgSW50VHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbmNvbnN0IGNvbXBhcmlzb25zID0gT2JqZWN0LmZyb21FbnRyaWVzKGNtcE9wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gY21wKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQ21wT3BdOiA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxcImkzMlwiPiB9XG5cbmZvciAoY29uc3Qgb3Agb2YgYXJpdGhtZXRpY09wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPE51bVR5cGU+KSB7IHJldHVybiBhcml0aG1ldGljW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIGJpdE9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxJbnRUeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KSB7IHJldHVybiBiaXRzW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIHJlbWFpbmRlck9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxJbnRUeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPEludFR5cGU+KSB7IHJldHVybiByZW1haW5kZXJzW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIGNtcE9wcykgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4cHJNZXRob2RzLnByb3RvdHlwZSwgb3AsIHtcbiAgdmFsdWUodGhpczogRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IEV4cHJMaWtlPE51bVR5cGU+KSB7IHJldHVybiBjb21wYXJpc29uc1tvcF0odGhpcywgcmlnaHQpIH0sXG59KVxuZm9yIChjb25zdCBvcCBvZiBbLi4uYXJpdGhtZXRpY09wcywgXCJhbmRcIiwgXCJvclwiLCBcInhvclwiXSBhcyBjb25zdCkgT2JqZWN0LmRlZmluZVByb3BlcnR5KE11dGFibGVNZXRob2RzLnByb3RvdHlwZSwgYGkke29wfWAsIHtcbiAgdmFsdWUodGhpczogTXV0YWJsZVZhbHVlPGFueT4sIHJpZ2h0OiBhbnkpIHsgcmV0dXJuIHRoaXMuc2V0KCh0aGlzIGFzIGFueSlbb3BdKHJpZ2h0KSkgfSxcbn0pXG5cbmV4cG9ydCBjb25zdCB7IGFkZCwgc3ViLCBtdWwsIGRpdiB9ID0gYXJpdGhtZXRpY1xuZXhwb3J0IGNvbnN0IHsgYW5kLCBvciwgeG9yLCBzaGwsIHNociB9ID0gYml0c1xuZXhwb3J0IGNvbnN0IHsgbW9kLCB1bW9kIH0gPSByZW1haW5kZXJzXG5leHBvcnQgY29uc3QgeyBlcSwgbHQsIGd0IH0gPSBjb21wYXJpc29uc1xuXG5leHBvcnQgY29uc3QgZnVuYyA9IDxjb25zdCBBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4ocGFyYW1zOiBBLCByZXN1bHQ6IFIsIGJ1aWxkOiAoLi4uYXJnczogQXJnc0V4cHI8QT4pID0+IEZ1bmNCb2R5PFI+KSA9PlxuICBta0hhbmRsZShwYXJhbXMsIHJlc3VsdCwgYnVpbGQgYXMgKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj4pXG5leHBvcnQgZnVuY3Rpb24gYXJyYXk8VCBleHRlbmRzIFN0b3JhZ2VUeXBlPih0eXBlOiBULCBsZW5ndGg6IG51bWJlcik6IEFycmF5SGFuZGxlPFQ+XG5leHBvcnQgZnVuY3Rpb24gYXJyYXk8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgbGVuZ3RoOiBudW1iZXIpOiBTdHJ1Y3RBcnJheUhhbmRsZTxGPlxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KHR5cGU6IFN0b3JhZ2VUeXBlIHwgU3RydWN0VHlwZTxhbnk+LCBsZW5ndGg6IG51bWJlcikge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGVuZ3RoKSB8fCBsZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFycmF5IGxlbmd0aCAke2xlbmd0aH1gKVxuICBjb25zdCBzdG9yYWdlID0gdHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCIgPyB0eXBlIDogdHlwZS5zdG9yYWdlXG4gIGNvbnN0IGVsZW1lbnRTaXplID0gdHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCIgPyBzdG9yYWdlU2l6ZVt0eXBlXSA6IHR5cGUuc2l6ZVxuICBsZXQgaGFuZGxlOiBBbnlBcnJheVxuICBoYW5kbGUgPSB7XG4gICAga2luZDogXCJhcnJheVwiLCB0eXBlLCBsZW5ndGgsIGVsZW1lbnRTaXplLFxuICAgIGF0OiBpbmRleCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG1lbW9yeVZhbHVlKGhhbmRsZSwgaW5kZXgsIHN0b3JhZ2UsIGVsZW1lbnRTaXplKVxuICAgICAgcmV0dXJuIHR5cGVvZiB0eXBlID09PSBcInN0cmluZ1wiID8gdmFsdWUgOiBzdHJ1Y3RWYWx1ZSh0eXBlLCB2YWx1ZSlcbiAgICB9LFxuICAgIG1vdmU6ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+ICh7IGtpbmQ6IFwiYXJyYXkubW92ZVwiLCBhcnJheTogaGFuZGxlLCB0YXJnZXQ6IGxpdChcImkzMlwiLCB0YXJnZXQpLCBzb3VyY2U6IGxpdChcImkzMlwiLCBzb3VyY2UpLCBjb3VudDogbGl0KFwiaTMyXCIsIGNvdW50KSB9KSxcbiAgfVxuICByZXR1cm4gaGFuZGxlXG59XG5cbmNvbnN0IG1rU3RydWN0TG9jYWwgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPikgPT5cbiAgc3RydWN0VmFsdWUodHlwZSwgbWtMb2NhbCh0eXBlLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyBcImk2NFwiIDogXCJpMzJcIikpXG5cbnR5cGUgTG9jYWxGYWN0b3J5ID0ge1xuICA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiBMb2NhbFZhcjxUPlxuICA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPik6IE11dGFibGVTdHJ1Y3Q8Rj5cbn1cblxuZXhwb3J0IGNvbnN0IGxvY2FsID0gKDxUIGV4dGVuZHMgTnVtVHlwZSwgRiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogVCB8IFN0cnVjdFR5cGU8Rj4pID0+XG4gIHR5cGVvZiB0eXBlID09PSBcInN0cmluZ1wiID8gbWtMb2NhbCh0eXBlKSA6IG1rU3RydWN0TG9jYWwodHlwZSkpIGFzIExvY2FsRmFjdG9yeVxuXG5leHBvcnQgZnVuY3Rpb24gcmV0KCk6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiByZXQ8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiByZXQodmFsdWU6IHsgcGFja2VkOiBBbnlFeHByIH0pOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZT86IEV4cHJMaWtlPFQ+IHwgeyBwYWNrZWQ6IEFueUV4cHIgfSk6IFN0bXQge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHsga2luZDogXCJyZXR1cm5cIiB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgXCJwYWNrZWRcIiBpbiB2YWx1ZSkgcmV0dXJuIHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU6IHZhbHVlLnBhY2tlZCB9XG4gIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiBsaXQoaW5mZXJUeXBlKHZhbHVlKSwgdmFsdWUpIGFzIEV4cHI8TnVtVHlwZT4gfVxufVxuZXhwb3J0IGNvbnN0IHRyYXAgPSAobWVzc2FnZTogc3RyaW5nKTogU3RtdCA9PiAoeyBraW5kOiBcInRyYXBcIiwgbWVzc2FnZSB9KVxuZXhwb3J0IGNvbnN0IGJvdW5kc0NoZWNrID0gKGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCBjb3VudDogRXhwckxpa2U8XCJpMzJcIj4gPSAxKTogU3RtdCA9PiB7XG4gIGNvbnN0IGkgPSBsaXQoXCJpMzJcIiwgaW5kZXgpLCBuID0gbGl0KFwiaTMyXCIsIGNvdW50KVxuICByZXR1cm4gaWZFbHNlKGkubHQoMCkub3Iobi5sdCgwKSkub3Iobi5ndChhcnJheS5sZW5ndGgpKS5vcihpLmd0KGkzMihhcnJheS5sZW5ndGgpLnN1YihuKSkpLCB0cmFwKFwiYXJyYXkgYm91bmRzIGV4Y2VlZGVkXCIpKVxufVxuZXhwb3J0IGNvbnN0IGxvZyA9IChtZXNzYWdlOiBzdHJpbmcsIHZhbHVlOiBFeHByTGlrZTxcImkzMlwiPik6IFN0bXQgPT4gKHsga2luZDogXCJsb2dcIiwgbWVzc2FnZSwgdmFsdWU6IGxpdChcImkzMlwiLCB2YWx1ZSkgfSlcbmV4cG9ydCBjb25zdCBibG9jayA9IChib2R5OiBDb250cm9sQm9keTxCbG9ja0hhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogQmxvY2tIYW5kbGUgPSB7IGtpbmQ6IFwiYmxvY2tcIiwgaWQ6IG5leHRDb250cm9sSWQrKyB9XG4gIHJldHVybiB7IGtpbmQ6IFwiYmxvY2tcIiwgY29udHJvbDogc2VsZi5pZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuZXhwb3J0IGNvbnN0IGxvb3AgPSAoY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogQ29udHJvbEJvZHk8TG9vcEhhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogc2VsZi5pZCwgY29uZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuXG5leHBvcnQgY29uc3QgYnJlYWtUbyA9ICh0YXJnZXQ/OiBDb250cm9sSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgY29udGludWVUbyA9ICh0YXJnZXQ/OiBMb29wSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgZXhwclN0bXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogU3RtdCA9PiAoeyBraW5kOiBcImV4cHJcIiwgZXhwcjogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KVxuIiwKICAgICJpbXBvcnQge1xuICBhbGxvY2F0ZUxvY2FsLCBhc1N0bXRzLFxuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUZ1bmMsIHR5cGUgQXJyYXlEZWZzLCB0eXBlIEV4cHIsXG4gIHR5cGUgRnVuY0JvZHksIHR5cGUgRnVuY0RlZnMsIHR5cGUgTW9kdWxlRGVmLCB0eXBlIE51bVR5cGUsIHR5cGUgUmVzdWx0VHlwZSxcbn0gZnJvbSBcIi4vYXN0XCJcblxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuZXhwb3J0IHR5cGUgQXJyYXlMYXlvdXQgPSB7IGxlbmd0aDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgZWxlbWVudFNpemU6IG51bWJlciB9XG5leHBvcnQgdHlwZSBNb2R1bGVBbmFseXNpczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgZnVuY3M6IEZ1bmNEZWZzPFQ+XG4gIGFycmF5czogQXJyYXlEZWZzPFQ+XG4gIGZFbnRyaWVzOiBba2V5b2YgRnVuY0RlZnM8VD4gJiBzdHJpbmcsIEZ1bmNEZWZzPFQ+W2tleW9mIEZ1bmNEZWZzPFQ+XV1bXVxuICBidWlsdEZ1bmNzOiBCdWlsdEZ1bmNbXVxuICBmaXg6IE1hcDxBbnlGdW5jLCBudW1iZXI+XG4gIGxheW91dHM6IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHBhZ2VzOiBudW1iZXJcbn1cblxudHlwZSBWaXNpdG9ycyA9IHtcbiAgbG9jYWw/OiAoaWQ6IG51bWJlciwgdHlwZTogTnVtVHlwZSkgPT4gdm9pZFxuICBhcnJheT86IChhcnJheTogQW55QXJyYXkpID0+IHZvaWRcbiAgZnVuYz86IChmdW5jOiBBbnlGdW5jKSA9PiB2b2lkXG4gIHRyYXA/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG4gIGxvZz86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbn1cbmNvbnN0IHdhbGsgPSAobm9kZTogYW55LCBmbnM6IFZpc2l0b3JzKTogdm9pZCA9PiB7XG4gIGlmIChub2RlID09IG51bGwpIHJldHVyblxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkgcmV0dXJuIG5vZGUuZm9yRWFjaCh4ID0+IHdhbGsoeCwgZm5zKSlcbiAgY29uc3QgY2hpbGRyZW4gPSAoLi4udmFsdWVzOiBhbnlbXSkgPT4gdmFsdWVzLmZvckVhY2goeCA9PiB3YWxrKHgsIGZucykpXG4gIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6IGNhc2UgXCJicmVha1wiOiBjYXNlIFwiY29udGludWVcIjogcmV0dXJuXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOiBmbnMubG9jYWw/Lihub2RlLmxvY2FsLCBub2RlLnR5cGUpOyByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6IGZucy5sb2NhbD8uKG5vZGUubG9jYWwsIG5vZGUudHlwZSk7IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiYmluXCI6IGNhc2UgXCJjbXBcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUubGVmdCwgbm9kZS5yaWdodClcbiAgICBjYXNlIFwiY2FsbFwiOiBjYXNlIFwiY2FsbC52b2lkXCI6IGZucy5mdW5jPy4obm9kZS50YXJnZXQpOyByZXR1cm4gd2Fsayhub2RlLmFyZ3MsIGZucylcbiAgICBjYXNlIFwiY2FzdFwiOiBjYXNlIFwicmV0dXJuXCI6IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUuY29uZCwgbm9kZS50aGVuLCBub2RlLmVsc2UpXG4gICAgY2FzZSBcImxvYWRcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiB3YWxrKG5vZGUuaW5kZXgsIGZucylcbiAgICBjYXNlIFwiYXJyYXkuc3RvcmVcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiBjaGlsZHJlbihub2RlLmluZGV4LCBub2RlLnZhbHVlKVxuICAgIGNhc2UgXCJhcnJheS5tb3ZlXCI6IGZucy5hcnJheT8uKG5vZGUuYXJyYXkpOyByZXR1cm4gY2hpbGRyZW4obm9kZS50YXJnZXQsIG5vZGUuc291cmNlLCBub2RlLmNvdW50KVxuICAgIGNhc2UgXCJibG9ja1wiOiByZXR1cm4gd2Fsayhub2RlLmJvZHksIGZucylcbiAgICBjYXNlIFwibG9vcFwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5jb25kLCBub2RlLmJvZHkpXG4gICAgY2FzZSBcInRyYXBcIjogZm5zLnRyYXA/Lihub2RlLm1lc3NhZ2UpOyByZXR1cm5cbiAgICBjYXNlIFwibG9nXCI6IGZucy5sb2c/Lihub2RlLm1lc3NhZ2UpOyByZXR1cm4gd2Fsayhub2RlLnZhbHVlLCBmbnMpXG4gICAgY2FzZSBcImV4cHJcIjogcmV0dXJuIHdhbGsobm9kZS5leHByLCBmbnMpXG4gICAgZGVmYXVsdDogZGllKG5vZGUpXG4gIH1cbn1cblxuXG5jb25zdCBhcnJheUxheW91dHMgPSAoYXJyYXlzOiBBbnlBcnJheVtdKSA9PiB7XG4gIGxldCBvZmZzZXQgPSAwXG4gIGNvbnN0IGxheW91dHMgPSBuZXcgTWFwPEFueUFycmF5LCBBcnJheUxheW91dD4oKVxuICBmb3IgKGNvbnN0IGFyciBvZiBhcnJheXMpIHtcbiAgICBjb25zdCBhbGlnbiA9IE1hdGgubWluKGFyci5lbGVtZW50U2l6ZSwgOClcbiAgICBvZmZzZXQgPSBNYXRoLmNlaWwob2Zmc2V0IC8gYWxpZ24pICogYWxpZ25cbiAgICBsYXlvdXRzLnNldChhcnIsIHsgbGVuZ3RoOiBhcnIubGVuZ3RoLCBvZmZzZXQsIGVsZW1lbnRTaXplOiBhcnIuZWxlbWVudFNpemUgfSlcbiAgICBvZmZzZXQgKz0gYXJyLmxlbmd0aCAqIGFyci5lbGVtZW50U2l6ZVxuICB9XG4gIHJldHVybiB7IGxheW91dHMsIGJ5dGVzOiBvZmZzZXQgfVxufVxuXG5leHBvcnQgdHlwZSBCdWlsdEZ1bmMgPSB7XG4gIGZ1bmM6IEFueUZ1bmNcbiAgYnVpbHQ6IEZ1bmNCb2R5PFJlc3VsdFR5cGU+XG4gIGxvY2FsczogW251bWJlciwgTnVtVHlwZV1bXVxuICBsb2NhbEluZGV4ZXM6IFJlY29yZDxudW1iZXIsIG51bWJlcj5cbiAgZnVuY3Rpb25zOiBBbnlGdW5jW11cbiAgYXJyYXlzOiBBbnlBcnJheVtdXG4gIHRyYXBzOiBzdHJpbmdbXVxuICBsb2dzOiBzdHJpbmdbXVxufVxuXG5jb25zdCBidWlsZEZ1bmMgPSAoZnVuYzogQW55RnVuYyk6IEJ1aWx0RnVuYyA9PiB7XG4gIGNvbnN0IHBhcmFtcyA9IGZ1bmMucGFyYW1zLm1hcCh0eXBlID0+IGFsbG9jYXRlTG9jYWwodHlwZSkpIGFzIEV4cHI8TnVtVHlwZT5bXVxuICBjb25zdCBwYXJhbUlkcyA9IHBhcmFtcy5tYXAocCA9PiBwLmtpbmQgPT09IFwibG9jYWwuZ2V0XCIgPyBwLmxvY2FsIDogLTEpXG4gIGNvbnN0IHJlc3VsdCA9IGZ1bmMuYnVpbGQoLi4ucGFyYW1zKVxuICBjb25zdCBidWlsdCA9IHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIiAmJiAhYXNTdG10cyhyZXN1bHQpID8gcmVzdWx0LnBhY2tlZCA6IHJlc3VsdFxuICBjb25zdCBmb3VuZCA9IG5ldyBNYXA8bnVtYmVyLCBOdW1UeXBlPigpXG4gIGNvbnN0IGZ1bmN0aW9ucyA9IG5ldyBTZXQ8QW55RnVuYz4oKSwgYXJyYXlzID0gbmV3IFNldDxBbnlBcnJheT4oKSwgdHJhcHMgPSBuZXcgU2V0PHN0cmluZz4oKSwgbG9ncyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gIHdhbGsoYnVpbHQsIHtcbiAgICBsb2NhbDogKGlkLCB0eXBlKSA9PiBmb3VuZC5zZXQoaWQsIHR5cGUpLCBmdW5jOiBmID0+IGZ1bmN0aW9ucy5hZGQoZiksIGFycmF5OiBhID0+IGFycmF5cy5hZGQoYSksXG4gICAgdHJhcDogbWVzc2FnZSA9PiB0cmFwcy5hZGQobWVzc2FnZSksIGxvZzogbWVzc2FnZSA9PiBsb2dzLmFkZChtZXNzYWdlKSxcbiAgfSlcbiAgcGFyYW1JZHMuZm9yRWFjaChpZCA9PiBmb3VuZC5kZWxldGUoaWQpKVxuICBjb25zdCBsb2NhbHMgPSBbLi4uZm91bmQuZW50cmllcygpXVxuICBjb25zdCBsb2NhbEluZGV4ZXMgPSBPYmplY3QuZnJvbUVudHJpZXMoW1xuICAgIC4uLnBhcmFtSWRzLm1hcCgoaWQsIGkpID0+IFtpZCwgaV0pLFxuICAgIC4uLmxvY2Fscy5tYXAoKFtpZF0sIGkpID0+IFtpZCwgZnVuYy5wYXJhbXMubGVuZ3RoICsgaV0pLFxuICBdKVxuICByZXR1cm4geyBmdW5jLCBidWlsdCwgbG9jYWxzLCBsb2NhbEluZGV4ZXMsIGZ1bmN0aW9uczogWy4uLmZ1bmN0aW9uc10sIGFycmF5czogWy4uLmFycmF5c10sIHRyYXBzOiBbLi4udHJhcHNdLCBsb2dzOiBbLi4ubG9nc10gfVxufVxuXG5jb25zdCBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMgPSAocm9vdHM6IEFueUZ1bmNbXSkgPT4ge1xuICBjb25zdCBidWlsdCA9IG5ldyBNYXA8QW55RnVuYywgQnVpbHRGdW5jPigpXG4gIGNvbnN0IHZpc2l0ID0gKGZ1bmM6IEFueUZ1bmMpID0+IHtcbiAgICBpZiAoYnVpbHQuaGFzKGZ1bmMpKSByZXR1cm5cbiAgICBjb25zdCBlbnRyeSA9IGJ1aWxkRnVuYyhmdW5jKVxuICAgIGJ1aWx0LnNldChmdW5jLCBlbnRyeSlcbiAgICBlbnRyeS5mdW5jdGlvbnMuZm9yRWFjaCh2aXNpdClcbiAgfVxuICByb290cy5mb3JFYWNoKHZpc2l0KVxuICByZXR1cm4gWy4uLmJ1aWx0LnZhbHVlcygpXVxufVxuXG5leHBvcnQgY29uc3QgYW5hbHl6ZU1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQpID0+IHtcbiAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKG1vZClcbiAgY29uc3QgZnVuY3MgPSBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5maWx0ZXIoKFssIHZdKSA9PiB2LmtpbmQgPT09IFwiZnVuY1wiKSkgYXMgRnVuY0RlZnM8VD5cbiAgY29uc3QgYXJyYXlzID0gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImFycmF5XCIpKSBhcyBBcnJheURlZnM8VD5cbiAgY29uc3QgZkVudHJpZXMgPSBPYmplY3QuZW50cmllcyhmdW5jcykgYXMgW2tleW9mIEZ1bmNEZWZzPFQ+ICYgc3RyaW5nLCBGdW5jRGVmczxUPltrZXlvZiBGdW5jRGVmczxUPl1dW11cbiAgY29uc3QgYnVpbHRGdW5jcyA9IGJ1aWxkUmVmZXJlbmNlZEZ1bmN0aW9ucyhmRW50cmllcy5tYXAoKFssIGZ1bmNdKSA9PiBmdW5jKSlcbiAgY29uc3QgZml4ID0gbmV3IE1hcChidWlsdEZ1bmNzLm1hcCgoeyBmdW5jIH0sIGkpID0+IFtmdW5jLCBpXSkpXG4gIGNvbnN0IGFsbEFycmF5cyA9IFsuLi5uZXcgU2V0KFsuLi5idWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmFycmF5cyksIC4uLk9iamVjdC52YWx1ZXMoYXJyYXlzKSBhcyBBbnlBcnJheVtdXSldXG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIGNvbnN0IHRyYXBNZXNzYWdlcyA9IFsuLi5uZXcgU2V0KGJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMudHJhcHMpKV1cbiAgY29uc3QgbG9nTWVzc2FnZXMgPSBbLi4ubmV3IFNldChidWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmxvZ3MpKV1cbiAgcmV0dXJuIHsgZnVuY3MsIGFycmF5cywgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXM6IE1hdGgubWF4KDEsIE1hdGguY2VpbChieXRlcyAvIDY1NTM2KSkgfSBhcyBNb2R1bGVBbmFseXNpczxUPlxufVxuIiwKICAgICJpbXBvcnQge1xuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUV4cHIsIHR5cGUgQW55RnVuYywgdHlwZSBBcml0aG1ldGljT3AsIHR5cGUgQml0T3AsIHR5cGUgQ21wT3AsIHR5cGUgRXhwcixcbiAgdHlwZSBNb2R1bGVEZWYsIHR5cGUgTnVtVHlwZSwgdHlwZSBSZW1haW5kZXJPcCwgdHlwZSBTdG10LCB0eXBlIFN0b3JhZ2VUeXBlLCBhc1N0bXRzLFxufSBmcm9tIFwiLi9hc3RcIlxuaW1wb3J0IHsgdHlwZSBBcnJheUxheW91dCwgdHlwZSBNb2R1bGVBbmFseXNpcyB9IGZyb20gXCIuL2FuYWx5emVcIlxuXG5jb25zdCBtYWdpYyA9IFsweDAwLCAweDYxLCAweDczLCAweDZkLCAweDAxLCAweDAwLCAweDAwLCAweDAwXVxuY29uc3QgcmVzdWx0VHlwZSA9IChyZXN1bHQ6IEFueUZ1bmNbXCJyZXN1bHRcIl0pID0+XG4gIHR5cGVvZiByZXN1bHQgPT09IFwib2JqZWN0XCIgPyByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiIDogcmVzdWx0XG5cbmNvbnN0IG51bWJlckJhc2UgPSB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+XG5jb25zdCBvcGNvZGUgPSAob3A6IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3AgfCBDbXBPcCwgdHlwZTogTnVtVHlwZSkgPT4ge1xuICBjb25zdCBhcml0aG1ldGljID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdLmluZGV4T2Yob3ApXG4gIGlmIChhcml0aG1ldGljID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgYXJpdGhtZXRpY1xuICBjb25zdCBpbnRlZ2VyID0gW1wibW9kXCIsIFwidW1vZFwiLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwiXCIsIFwic2hyXCJdLmluZGV4T2Yob3ApXG4gIGlmIChpbnRlZ2VyID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgNSArIGludGVnZXJcbiAgcmV0dXJuICh7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+KVt0eXBlXVxuICAgICsgKG9wID09PSBcImVxXCIgPyAwIDogb3AgPT09IFwibHRcIiA/IDIgOiB0eXBlWzBdID09PSBcImlcIiA/IDQgOiAzKVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgbG9hZDogeyBpMzI6IDB4MjgsIGk2NDogMHgyOSwgZjMyOiAweDJhLCBmNjQ6IDB4MmIsIGk4OiAweDJjLCB1ODogMHgyZCwgaTE2OiAweDJlLCB1MTY6IDB4MmYgfSBhcyBSZWNvcmQ8U3RvcmFnZVR5cGUsIG51bWJlcj4sXG4gIHN0b3JlOiB7IGkzMjogMHgzNiwgaTY0OiAweDM3LCBmMzI6IDB4MzgsIGY2NDogMHgzOSwgaTg6IDB4M2EsIHU4OiAweDNhLCBpMTY6IDB4M2IsIHUxNjogMHgzYiB9IGFzIFJlY29yZDxTdG9yYWdlVHlwZSwgbnVtYmVyPixcbiAgYWxpZ246IHsgaTg6IDAsIHU4OiAwLCBpMTY6IDEsIHUxNjogMSwgaTMyOiAyLCBmMzI6IDIsIGk2NDogMywgZjY0OiAzIH0gYXMgUmVjb3JkPFN0b3JhZ2VUeXBlLCBudW1iZXI+LFxuICB6ZXJvOiB7IGkzMjogWzB4NDEsIDBdLCBpNjQ6IFsweDQyLCAwXSwgZjMyOiBbMHg0MywgMCwgMCwgMCwgMF0sIGY2NDogWzB4NDQsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcltdPixcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5cbmNvbnN0IGFkZHIgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZSA9IGxheW91dC5lbGVtZW50U2l6ZSwgZmllbGRPZmZzZXQgPSAwKSA9PlxuICBpbmRleC5tdWwoc3RyaWRlKS5hZGQobGF5b3V0Lm9mZnNldCArIGZpZWxkT2Zmc2V0KVxuY29uc3QgbWVtYXJnID0gKHR5cGU6IFN0b3JhZ2VUeXBlLCBvZmZzZXQgPSAwKSA9PiBbLi4udTMyKGNvZGVzLmFsaWduW3R5cGVdKSwgLi4udTMyKG9mZnNldCldXG5jb25zdCBjb25zdEkzMiA9IChlOiBFeHByPFwiaTMyXCI+KSA9PiBlLmtpbmQgPT09IFwiY29uc3RcIiA/IGUudmFsdWUgOiBudWxsXG5jb25zdCBjaGVja0FycmF5Qm91bmRzID0gKGxheW91dDogQXJyYXlMYXlvdXQsIGluZGV4OiBFeHByPFwiaTMyXCI+KSA9PiB7XG4gIGNvbnN0IG4gPSBjb25zdEkzMihpbmRleClcbiAgaWYgKG4gPT0gbnVsbCkgcmV0dXJuXG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCB8fCBuID49IGxheW91dC5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihgQXJyYXkgaW5kZXggJHtufSBvdXQgb2YgYm91bmRzIGZvciBsZW5ndGggJHtsYXlvdXQubGVuZ3RofWApXG59XG5jb25zdCBjaGVja01vdmVCb3VuZHMgPSAobGF5b3V0OiBBcnJheUxheW91dCwgdGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+KSA9PiB7XG4gIGNvbnN0IHZhbHVlcyA9IFtjb25zdEkzMih0YXJnZXQpLCBjb25zdEkzMihzb3VyY2UpLCBjb25zdEkzMihjb3VudCldXG4gIGlmICh2YWx1ZXMuc29tZSh2YWx1ZSA9PiB2YWx1ZSA9PSBudWxsKSkgcmV0dXJuXG4gIGNvbnN0IFt0bywgZnJvbSwgc2l6ZV0gPSB2YWx1ZXMgYXMgbnVtYmVyW11cbiAgaWYgKHRvISA8IDAgfHwgZnJvbSEgPCAwIHx8IHNpemUhIDwgMCB8fCB0byEgKyBzaXplISA+IGxheW91dC5sZW5ndGggfHwgZnJvbSEgKyBzaXplISA+IGxheW91dC5sZW5ndGgpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBBcnJheSBtb3ZlICgke3RvfSwgJHtmcm9tfSwgJHtzaXplfSkgb3V0IG9mIGJvdW5kcyBmb3IgbGVuZ3RoICR7bGF5b3V0Lmxlbmd0aH1gKVxufVxuXG5jb25zdCBtYWtlQ29tcGlsZXIgPSAoXG4gIGZpeDogTWFwPEFueUZ1bmMsIG51bWJlcj4sIGxpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPiwgYXJyYXlzOiBNYXA8QW55QXJyYXksIEFycmF5TGF5b3V0PixcbiAgdHJhcHM6IE1hcDxzdHJpbmcsIG51bWJlcj4sIGxvZ3M6IE1hcDxzdHJpbmcsIG51bWJlcj4sXG4pID0+IHtcbmNvbnN0IGNvbXBpbGVFeHByID0gKGU6IEFueUV4cHIpOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAoZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6XG4gICAgICBpZiAoZS50eXBlID09PSBcImkzMlwiKSByZXR1cm4gWzB4NDEsIC4uLnNOKGUudmFsdWUgYXMgbnVtYmVyLCAzMildXG4gICAgICBpZiAoZS50eXBlID09PSBcImk2NFwiKSByZXR1cm4gWzB4NDIsIC4uLnNOKGUudmFsdWUsIDY0KV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZjMyXCIpIHJldHVybiBbMHg0MywgLi4uZk4oZS52YWx1ZSBhcyBudW1iZXIsIDQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmNjRcIikgcmV0dXJuIFsweDQ0LCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgOCldXG4gICAgICByZXR1cm4gZGllKGUpXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIwLCAuLi51MzIobGl4W2UubG9jYWxdISldXG4gICAgY2FzZSBcImJpblwiOiB7XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQpLCBvcGNvZGUoZS5vcCwgZS50eXBlKV1cbiAgICB9XG4gICAgY2FzZSBcImNtcFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0KSwgb3Bjb2RlKGUub3AsIGUuaW5wdXRUeXBlKV1cbiAgICBjYXNlIFwiY2FsbFwiOlxuICAgICAgcmV0dXJuIFsuLi5mbGF0TWFwKGUuYXJncywgY29tcGlsZUV4cHIpLCAweDEwLCAuLi51MzIoZml4LmdldChlLnRhcmdldCkhICsgMildXG4gICAgY2FzZSBcImNhc3RcIjoge1xuICAgICAgY29uc3QgZnJvbSA9IGUuaW5wdXRUeXBlIGFzIE51bVR5cGVcbiAgICAgIGNvbnN0IHRvID0gZS50eXBlIGFzIE51bVR5cGVcbiAgICAgIGxldCBvcGNvZGU6IG51bWJlciB8IHVuZGVmaW5lZFxuICAgICAgaWYgKHRvID09PSBcImkzMlwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YTdcbiAgICAgIGlmICh0byA9PT0gXCJpNjRcIiAmJiBmcm9tID09PSBcImkzMlwiKSBvcGNvZGUgPSBlLnVuc2lnbmVkID8gMHhhZCA6IDB4YWNcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImkzMlwiKSBvcGNvZGUgPSAweGIyXG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhiNFxuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiZjY0XCIpIG9wY29kZSA9IDB4YjZcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImkzMlwiKSBvcGNvZGUgPSAweGI3XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhiOVxuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiZjMyXCIpIG9wY29kZSA9IDB4YmJcbiAgICAgIGlmIChvcGNvZGUgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBjYXN0ICR7ZnJvbX0gLT4gJHt0b31gKVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLnZhbHVlKSwgb3Bjb2RlXVxuICAgIH1cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5jb25kKSwgMHgwNCwgY29kZXMudHlwZVtlLnR5cGUgYXMgTnVtVHlwZV0sIC4uLmNvbXBpbGVFeHByKGUudGhlbiksIDB4MDUsIC4uLmNvbXBpbGVFeHByKGUuZWxzZSksIDB4MGJdXG4gICAgY2FzZSBcImxvYWRcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzLmdldChlLmFycmF5KVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke2UuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBlLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgZS5pbmRleCwgZS5zdHJpZGUsIGUub2Zmc2V0KSksIGNvZGVzLmxvYWRbZS5zdG9yYWdlIGFzIFN0b3JhZ2VUeXBlXSwgLi4ubWVtYXJnKGUuc3RvcmFnZSBhcyBTdG9yYWdlVHlwZSldXG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKGUpXG4gIH1cbn1cblxudHlwZSBMYWJlbEZyYW1lID0geyBjb250cm9sPzogbnVtYmVyLCBraW5kPzogXCJicmVha1wiIHwgXCJjb250aW51ZVwiIH1cbmNvbnN0IGRlcHRoID0gKHN0YWNrOiBMYWJlbEZyYW1lW10sIGNvbnRyb2w6IG51bWJlciwga2luZDogTm9uTnVsbGFibGU8TGFiZWxGcmFtZVtcImtpbmRcIl0+KSA9PiB7XG4gIGNvbnN0IGkgPSBzdGFjay5maW5kSW5kZXgoeCA9PiB4LmNvbnRyb2wgPT09IGNvbnRyb2wgJiYgeC5raW5kID09PSBraW5kKVxuICBpZiAoaSA8IDApIHRocm93IG5ldyBFcnJvcihgVW5rbm93biAke2tpbmR9IHRhcmdldCAke2NvbnRyb2x9YClcbiAgcmV0dXJuIGlcbn1cblxuY29uc3QgY29tcGlsZVN0bXQgPSAoczogU3RtdCwgc3RhY2s6IExhYmVsRnJhbWVbXSA9IFtdKTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MjEsIC4uLnUzMihsaXhbcy5sb2NhbF0hKV1cbiAgICBjYXNlIFwiYXJyYXkuc3RvcmVcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzLmdldChzLmFycmF5KVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBzLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5pbmRleCwgcy5zdHJpZGUsIHMub2Zmc2V0KSksIC4uLmNvbXBpbGVFeHByKHMudmFsdWUpLCBjb2Rlcy5zdG9yZVtzLnR5cGVdLCAuLi5tZW1hcmcocy50eXBlKV1cbiAgICB9XG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzLmdldChzLmFycmF5KVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrTW92ZUJvdW5kcyhsYXlvdXQsIHMudGFyZ2V0LCBzLnNvdXJjZSwgcy5jb3VudClcbiAgICAgIHJldHVybiBbXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLnRhcmdldCkpLFxuICAgICAgICAuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5zb3VyY2UpKSxcbiAgICAgICAgLi4uY29tcGlsZUV4cHIocy5jb3VudC5tdWwobGF5b3V0LmVsZW1lbnRTaXplKSksXG4gICAgICAgIDB4ZmMsIDB4MGEsIDB4MDAsIDB4MDAsXG4gICAgICBdXG4gICAgfVxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmNvbmQpLCAweDA0LCAweDQwLCAuLi5mbGF0TWFwKHMudGhlbiwgeCA9PiBjb21waWxlU3RtdCh4LCBbe30sIC4uLnN0YWNrXSkpLCAuLi4ocy5lbHNlLmxlbmd0aCA/IFsweDA1LCAuLi5mbGF0TWFwKHMuZWxzZSwgeCA9PiBjb21waWxlU3RtdCh4LCBbe30sIC4uLnN0YWNrXSkpXSA6IFtdKSwgMHgwYl1cbiAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgLi4uZmxhdE1hcChzLmJvZHksIHggPT4gY29tcGlsZVN0bXQoeCwgW3sgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGJdXG4gICAgY2FzZSBcImxvb3BcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgMHgwMywgMHg0MCwgLi4uY29tcGlsZUV4cHIocy5jb25kKSwgMHg0NSwgMHgwZCwgLi4udTMyKDEpLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiY29udGludWVcIiB9LCB7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJicmVha1wiIH0sIC4uLnN0YWNrXSkpLCAweDBjLCAuLi51MzIoMCksIDB4MGIsIDB4MGJdXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiYnJlYWtUbygpIHVzZWQgb3V0c2lkZSBhIGJsb2NrIG9yIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJicmVha1wiKSldXG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJjb250aW51ZVwiKSldXG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi4ocy52YWx1ZSA/IGNvbXBpbGVFeHByKHMudmFsdWUpIDogW10pLCAweDBmXVxuICAgIGNhc2UgXCJ0cmFwXCI6XG4gICAgICByZXR1cm4gWzB4NDEsIC4uLnNOKHRyYXBzLmdldChzLm1lc3NhZ2UpISwgMzIpLCAweDEwLCAweDAwXVxuICAgIGNhc2UgXCJsb2dcIjpcbiAgICAgIHJldHVybiBbMHg0MSwgLi4uc04obG9ncy5nZXQocy5tZXNzYWdlKSEsIDMyKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MTAsIDB4MDFdXG4gICAgY2FzZSBcImNhbGwudm9pZFwiOlxuICAgICAgcmV0dXJuIFsuLi5mbGF0TWFwKHMuYXJncywgY29tcGlsZUV4cHIpLCAweDEwLCAuLi51MzIoZml4LmdldChzLnRhcmdldCkhICsgMildXG4gICAgY2FzZSBcImV4cHJcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy5leHByKSwgMHgxYV1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGRpZShzKVxuICB9XG59XG5yZXR1cm4geyBleHByOiBjb21waWxlRXhwciwgc3RtdDogY29tcGlsZVN0bXQgfVxufVxuXG5cbmV4cG9ydCBjb25zdCBlbWl0TW9kdWxlID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KHsgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXMgfTogTW9kdWxlQW5hbHlzaXM8VD4pID0+IHtcbiAgY29uc3QgdHJhcHMgPSBuZXcgTWFwKHRyYXBNZXNzYWdlcy5tYXAoKG1lc3NhZ2UsIGlkKSA9PiBbbWVzc2FnZSwgaWRdKSlcbiAgY29uc3QgbG9ncyA9IG5ldyBNYXAobG9nTWVzc2FnZXMubWFwKChtZXNzYWdlLCBpZCkgPT4gW21lc3NhZ2UsIGlkXSkpXG4gIGNvbnN0IGZ1bmN0aW9uU2VjdGlvbiA9IGJ1aWx0RnVuY3MuZmxhdE1hcCgoXywgaSkgPT4gdTMyKGkgKyAyKSlcbiAgY29uc3QgZXhwb3J0U2VjdGlvbiA9IGZFbnRyaWVzLmZsYXRNYXAoKFtuYW1lLCBmdW5jXSkgPT4gWy4uLnN0cihuYW1lKSwgMHgwMCwgLi4udTMyKGZpeC5nZXQoZnVuYykhICsgMildKVxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW1xuICAgIC4uLm1hZ2ljLFxuICAgIC4uLnNlY3Rpb24oMHgwMSwgWy4uLnUzMihidWlsdEZ1bmNzLmxlbmd0aCArIDIpLFxuICAgICAgMHg2MCwgMHgwMSwgY29kZXMudHlwZS5pMzIsIDB4MDAsXG4gICAgICAweDYwLCAweDAyLCBjb2Rlcy50eXBlLmkzMiwgY29kZXMudHlwZS5pMzIsIDB4MDAsXG4gICAgICAuLi5mbGF0TWFwKGJ1aWx0RnVuY3MsICh7IGZ1bmMgfSkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRUeXBlKGZ1bmMucmVzdWx0KVxuICAgICAgICByZXR1cm4gWzB4NjAsIC4uLnUzMihmdW5jLnBhcmFtcy5sZW5ndGgpLCAuLi5mdW5jLnBhcmFtcy5tYXAodCA9PiBjb2Rlcy50eXBlW3RdKSwgLi4uKHJlc3VsdCA9PT0gXCJ2b2lkXCIgPyBbMHgwMF0gOiBbMHgwMSwgY29kZXMudHlwZVtyZXN1bHRdXSldXG4gICAgICB9KV0pLFxuICAgIC4uLnNlY3Rpb24oMHgwMiwgW1xuICAgICAgMHgwMyxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcInRyYXBcIiksXG4gICAgICAweDAwLFxuICAgICAgMHgwMCxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcImxvZ1wiKSxcbiAgICAgIDB4MDAsXG4gICAgICAweDAxLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwibWVtb3J5XCIpLFxuICAgICAgMHgwMixcbiAgICAgIDB4MDMsXG4gICAgICAuLi51MzIocGFnZXMpLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICBdKSxcbiAgICAuLi5zZWN0aW9uKDB4MDMsIFsuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGgpLCAuLi5mdW5jdGlvblNlY3Rpb25dKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZXhwb3J0U2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgYnVpbHQsIGxvY2FscywgbG9jYWxJbmRleGVzIH0pID0+IHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBtYWtlQ29tcGlsZXIoZml4LCBsb2NhbEluZGV4ZXMsIGxheW91dHMsIHRyYXBzLCBsb2dzKVxuICAgICAgICBjb25zdCBzdG10cyA9IGFzU3RtdHMoYnVpbHQpXG4gICAgICAgIGNvbnN0IGRlY2xzID0gWy4uLnUzMihsb2NhbHMubGVuZ3RoKSwgLi4uZmxhdE1hcChsb2NhbHMsIChbLCB0eXBlXSkgPT4gWy4uLnUzMigxKSwgY29kZXMudHlwZVt0eXBlXV0pXVxuICAgICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRUeXBlKGZ1bmMucmVzdWx0KVxuICAgICAgICBjb25zdCBjb2RlID0gc3RtdHNcbiAgICAgICAgICA/IFsuLi5mbGF0TWFwKHN0bXRzLCBzID0+IGNvbXBpbGVyLnN0bXQocykpLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFtdIDogY29kZXMuemVyb1tyZXN1bHRdKV1cbiAgICAgICAgICA6IGNvbXBpbGVyLmV4cHIoYnVpbHQgYXMgQW55RXhwcilcbiAgICAgICAgY29uc3QgYm9keSA9IFsuLi5kZWNscywgLi4uY29kZSwgMHgwYl1cbiAgICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgICAgfSksXG4gICAgXSksXG4gIF0pXG59XG4iLAogICAgImV4cG9ydCAqIGZyb20gXCIuL2FzdFwiXG5leHBvcnQgeyBmb3JtYXRNb2R1bGUgfSBmcm9tIFwiLi9mb3JtYXRcIlxuXG5pbXBvcnQgeyBhbmFseXplTW9kdWxlIH0gZnJvbSBcIi4vYW5hbHl6ZVwiXG5pbXBvcnQgeyBlbWl0TW9kdWxlIH0gZnJvbSBcIi4vY29kZWdlblwiXG5pbXBvcnQgdHlwZSB7XG4gIEFueUFycmF5LCBBbnlGdW5jLCBDb21waWxlUmVzdWx0LCBKU1N0cnVjdCwgTW9kdWxlRGVmLCBTdHJ1Y3RGaWVsZHMsIFN0cnVjdFR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGFycmF5Q3RvcnMgPSB7XG4gIGk4OiBJbnQ4QXJyYXksIHU4OiBVaW50OEFycmF5LCBpMTY6IEludDE2QXJyYXksIHUxNjogVWludDE2QXJyYXksXG4gIGkzMjogSW50MzJBcnJheSwgaTY0OiBCaWdJbnQ2NEFycmF5LCBmMzI6IEZsb2F0MzJBcnJheSwgZjY0OiBGbG9hdDY0QXJyYXksXG4gIHN1ODogVWludDhBcnJheSwgc3UxNjogVWludDE2QXJyYXksIHNpMzI6IFVpbnQzMkFycmF5LCBzaTY0OiBCaWdVaW50NjRBcnJheSxcbn1cblxuZXhwb3J0IGNvbnN0IGRlY29kZVN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCByYXc6IG51bWJlciB8IGJpZ2ludCk6IEpTU3RydWN0PEY+ID0+IHtcbiAgY29uc3QgcGFja2VkID0gQmlnSW50LmFzVWludE4odHlwZS5zaXplICogOCwgQmlnSW50KHJhdykpXG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXModHlwZS5sYXlvdXQpLm1hcCgoW25hbWUsIGZpZWxkXSkgPT4ge1xuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgbGV0IHZhbHVlID0gKHBhY2tlZCA+PiBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkgJiBtYXNrXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgdmFsdWUgJiAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMgLSAxKSkpXG4gICAgICB2YWx1ZSAtPSAxbiA8PCBCaWdJbnQoZmllbGQuYml0cylcbiAgICByZXR1cm4gW25hbWUsIGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSldXG4gIH0pKSBhcyBKU1N0cnVjdDxGPlxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihcbiAgbW9kOiBULFxuKTogUHJvbWlzZTxDb21waWxlUmVzdWx0PFQ+PiA9PiB7XG4gIGNvbnN0IGFuYWx5c2lzID0gYW5hbHl6ZU1vZHVsZShtb2QpXG4gIGNvbnN0IG1lbW9yeSA9IG5ldyBXZWJBc3NlbWJseS5NZW1vcnkoe1xuICAgIGluaXRpYWw6IGFuYWx5c2lzLnBhZ2VzLFxuICAgIG1heGltdW06IGFuYWx5c2lzLnBhZ2VzLFxuICAgIHNoYXJlZDogdHJ1ZSxcbiAgfSlcbiAgY29uc3QgY29tcGlsZWQgPSBhd2FpdCBXZWJBc3NlbWJseS5jb21waWxlKGVtaXRNb2R1bGUoYW5hbHlzaXMpLmJ1ZmZlcilcbiAgY29uc3QgdHJhcCA9IChpZDogbnVtYmVyKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYW5hbHlzaXMudHJhcE1lc3NhZ2VzW2lkXSA/PyBgVW5rbm93biBXQVNNIHRyYXAgJHtpZH1gKSB9XG4gIGNvbnN0IGxvZyA9IChpZDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBjb25zb2xlLmxvZyhhbmFseXNpcy5sb2dNZXNzYWdlc1tpZF0gPz8gYFdBU00gbG9nICR7aWR9YCwgdmFsdWUpXG4gIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoY29tcGlsZWQsIHsgZW52OiB7IG1lbW9yeSwgdHJhcCwgbG9nIH0gfSlcbiAgY29uc3QgZnVuY0VudHJpZXMgPSBPYmplY3QuZW50cmllcyhhbmFseXNpcy5mdW5jcykgYXMgW3N0cmluZywgQW55RnVuY11bXVxuICBjb25zdCBqc0Z1bmNzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LCByZXN1bHRTdHJ1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBTdHJ1Y3RUeXBlPGFueT4+ID0ge31cbiAgZm9yIChjb25zdCBbbmFtZSwgZnVuY10gb2YgZnVuY0VudHJpZXMpIHtcbiAgICBjb25zdCB3YXNtRnVuYyA9IGluc3RhbmNlLmV4cG9ydHNbbmFtZV0gYXMgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gbnVtYmVyIHwgYmlnaW50XG4gICAganNGdW5jc1tuYW1lXSA9IHdhc21GdW5jXG4gICAgaWYgKHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmVzdWx0U3RydWN0c1tuYW1lXSA9IGZ1bmMucmVzdWx0XG4gICAgICBqc0Z1bmNzW25hbWVdID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gZGVjb2RlU3RydWN0KGZ1bmMucmVzdWx0IGFzIFN0cnVjdFR5cGU8YW55Piwgd2FzbUZ1bmMoLi4uYXJncykpXG4gICAgfVxuICB9XG4gIGNvbnN0IGpzQXJyYXlzID0gKE9iamVjdC5lbnRyaWVzKGFuYWx5c2lzLmFycmF5cykgYXMgW3N0cmluZywgQW55QXJyYXldW10pLm1hcCgoW25hbWUsIGFycl0pID0+IHtcbiAgICBjb25zdCBsYXlvdXQgPSBhbmFseXNpcy5sYXlvdXRzLmdldChhcnIpIVxuICAgIGNvbnN0IGtleSA9IHR5cGVvZiBhcnIudHlwZSA9PT0gXCJzdHJpbmdcIiA/IGFyci50eXBlIDogYHMke2Fyci50eXBlLnN0b3JhZ2V9YFxuICAgIGNvbnN0IEN0b3IgPSBhcnJheUN0b3JzW2tleSBhcyBrZXlvZiB0eXBlb2YgYXJyYXlDdG9yc11cbiAgICByZXR1cm4gW25hbWUsIG5ldyBDdG9yKG1lbW9yeS5idWZmZXIsIGxheW91dC5vZmZzZXQsIGFyci5sZW5ndGgpXSBhcyBjb25zdFxuICB9KVxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihqc0Z1bmNzLCBPYmplY3QuZnJvbUVudHJpZXMoanNBcnJheXMpLCB7XG4gICAgbW9kOiBjb21waWxlZCwgbWVtb3J5LCByZXN1bHRTdHJ1Y3RzLFxuICAgIHRyYXBNZXNzYWdlczogYW5hbHlzaXMudHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlczogYW5hbHlzaXMubG9nTWVzc2FnZXMsXG4gIH0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgYXJyYXksIGNvbXBpbGUsIGZ1bmMsIGkzMiwgaWZFbHNlLCBsaXQsIGxvY2FsLCBsb2csIHJldCwgc3RydWN0LCB0cmFwLCB1bW9kLCB0eXBlIEFueUFycmF5LCB0eXBlIEFycmF5SGFuZGxlLCB0eXBlIEV4cHIsIHR5cGUgRXhwckxpa2UsIHR5cGUgU3RtdCwgdHlwZSBTdG10Qm9keSwgdHlwZSBTdG9yYWdlVHlwZSwgdHlwZSBTdHJ1Y3RBcnJheUhhbmRsZSwgdHlwZSBTdHJ1Y3RGaWVsZHMsIHR5cGUgU3RydWN0VHlwZSB9IGZyb20gXCIuLi93YXNtXCJcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCJcblxuY29uc3QgTldPUktFUlMgPSA0XG5jb25zdCBSQU5EU1RSSURFID0gMTZcblxuXG5cbmxldCBERUJVRyA9IHRydWVcblxuZnVuY3Rpb24gZGVidWcgKHRhZzogc3RyaW5nLCB2YWx1ZTogRXhwckxpa2U8XCJpMzJcIj4pe1xuICBpZiAoIURFQlVHKSByZXR1cm4gW11cbiAgcmV0dXJuIFtcbiAgICBsb2codGFnLCB2YWx1ZSlcbiAgXVxufVxuXG5cblxuY29uc3QgYm91bmRzQ2hlY2sgPSAoYXJyYXk6IEFueUFycmF5LCBpbmRleDogRXhwckxpa2U8XCJpMzJcIj4sIGNvdW50OiBFeHByTGlrZTxcImkzMlwiPiA9IDEpOiBTdG10ID0+IHtcbiAgY29uc3QgaSA9IGxpdChcImkzMlwiLCBpbmRleCksIG4gPSBsaXQoXCJpMzJcIiwgY291bnQpXG4gIHJldHVybiBpZkVsc2UoaS5sdCgwKS5vcihuLmx0KDApKS5vcihuLmd0KGFycmF5Lmxlbmd0aCkpLm9yKGkuZ3QoaTMyKGFycmF5Lmxlbmd0aCkuc3ViKG4pKSksIHRyYXAoXCJhcnJheSBib3VuZHMgZXhjZWVkZWRcIikpXG59XG5cblxuZnVuY3Rpb24gY2hlY2tlZEFycmF5PFQgZXh0ZW5kcyBTdG9yYWdlVHlwZT4odHlwZTogVCwgbGVuZ3RoOiBudW1iZXIpOiBBcnJheUhhbmRsZTxUPlxuZnVuY3Rpb24gY2hlY2tlZEFycmF5PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIGxlbmd0aDogbnVtYmVyKTogU3RydWN0QXJyYXlIYW5kbGU8Rj5cbmZ1bmN0aW9uIGNoZWNrZWRBcnJheSh0eXBlOiBTdG9yYWdlVHlwZSB8IFN0cnVjdFR5cGU8YW55PiwgbGVuZ3RoOiBudW1iZXIpIHtcbiAgY29uc3QgYXJyID0gYXJyYXkodHlwZSBhcyBTdG9yYWdlVHlwZSwgbGVuZ3RoKSBhcyBBbnlBcnJheVxuICBjb25zdCBhdCA9IGFyci5hdCwgbW92ZSA9IGFyci5tb3ZlXG4gIGNvbnN0IGNoZWNrZWRJbmRleCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoaW5kZXgsIGNvdW50KSA9PiBbXG4gICAgYm91bmRzQ2hlY2soYXJyLCBpbmRleCwgY291bnQpLFxuICAgIHJldChpbmRleCksXG4gIF0pXG4gIGFyci5hdCA9IGluZGV4ID0+IGF0KGNoZWNrZWRJbmRleC5jYWxsKGluZGV4LCAxKSlcbiAgYXJyLm1vdmUgPSAodGFyZ2V0LCBzb3VyY2UsIGNvdW50KSA9PiBtb3ZlKFxuICAgIGNoZWNrZWRJbmRleC5jYWxsKHRhcmdldCwgY291bnQpLFxuICAgIGNoZWNrZWRJbmRleC5jYWxsKHNvdXJjZSwgY291bnQpLFxuICAgIGNvdW50LFxuICApXG4gIHJldHVybiBhcnJcbn1cblxuXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhbm5lYWxpbmdXYXNtKHBsYW5uZXI6IE1vZHVsZSk6IFByb21pc2U8QW5uZWFsaW5nUmVzdWx0PiB7XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihwbGFubmVyLk5SRVFTIC8gcGxhbm5lci5OVFJBTlMgKiAyLjUgKiAyICsgMTApXG4gIGNvbnN0IFNUT1AgPSBzdHJ1Y3Qoe1xuICAgIHJlcV9pZDogW1widTE2XCIsIDEwXSxcbiAgICBpc19sb2FkOiBbXCJ1OFwiLCAxXSxcbiAgICBkZWNrOiBbXCJ1OFwiLCAxXSxcbiAgfSlcbiAgY29uc3QgUkVRID0gc3RydWN0KHtcbiAgICBzdGFydDogXCJ1MTZcIixcbiAgICBlbmQ6IFwidTE2XCIsXG4gICAgdmFsdWU6IFwidTE2XCIsXG4gICAgZGVhZGxpbmU6IFwidTE2XCIsXG4gIH0pXG5cbiAgY29uc3QgcmFuZFN0YXRlICAgICAgPSBjaGVja2VkQXJyYXkoXCJpMzJcIiwgTldPUktFUlMgKiBSQU5EU1RSSURFKVxuICBjb25zdCBkaXN0cyAgICAgICAgICA9IGNoZWNrZWRBcnJheShcImkzMlwiLCBwbGFubmVyLlJTSVpFKVxuICBjb25zdCByZXF1ZXN0cyAgICAgICA9IGNoZWNrZWRBcnJheShSRVEsIHBsYW5uZXIuTlJFUVMpXG4gIGNvbnN0IGFzc2lnbmVkICAgICAgID0gY2hlY2tlZEFycmF5KFwidThcIiwgcGxhbm5lci5OUkVRUylcbiAgY29uc3Qgc2NoZWR1bGUgICAgICAgPSBjaGVja2VkQXJyYXkoU1RPUCwgcGxhbm5lci5OVFJBTlMgKiBUU0laRSlcbiAgY29uc3Qgc2NoZWRfc2l6ZSAgICAgPSBjaGVja2VkQXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHRyYW5fcG9zaXRpb25zID0gY2hlY2tlZEFycmF5KFwiaTE2XCIsIHBsYW5uZXIuTlRSQU5TKVxuXG4gIGNvbnN0IHJhbmROZXh0ID0gZnVuYyhbXCJpMzJcIl0sIFwiaTMyXCIsIGdpZCA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBsb2NhbChcImkzMlwiKVxuICAgIHJldHVybiBbXG4gICAgICB2YWx1ZS5zZXQocmFuZFN0YXRlLmF0KGdpZC5tdWwoUkFORFNUUklERSkpKSxcbiAgICAgIHZhbHVlLnNldCh2YWx1ZS54b3IodmFsdWUuc2hsKDEzKSkpLFxuICAgICAgdmFsdWUuc2V0KHZhbHVlLnhvcih2YWx1ZS5zaHIoMTcpKSksXG4gICAgICB2YWx1ZS5zZXQodmFsdWUueG9yKHZhbHVlLnNobCg1KSkpLFxuICAgICAgcmFuZFN0YXRlLmF0KGdpZC5tdWwoUkFORFNUUklERSkpLnNldCh2YWx1ZSksXG4gICAgICByZXQodmFsdWUpLFxuICAgIF1cbiAgfSlcbiAgY29uc3QgcmFuZGludCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoZ2lkLCBtYXgpID0+IHVtb2QocmFuZE5leHQuY2FsbChnaWQpLCBtYXgpKVxuXG5cblxuICBjb25zdCB0cnlBc3NpZ24gPSBmdW5jKFtdLCBcInZvaWRcIiwgKCkgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHJlcV9pZCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQiA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG1wID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0c2l6ZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG9mZnNldCA9IGxvY2FsKFwiaTMyXCIpXG5cblxuICAgIGNvbnN0IHNjaGVkVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pOiBTdG10Qm9keSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHRvZmZzZXQuYWRkKHRhcmdldCksIHRvZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHRvZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuXG4gICAgcmV0dXJuIFtcblxuXG4gICAgICB0cmFuLnNldChyYW5kaW50LmNhbGwoMCwgcGxhbm5lci5OVFJBTlMpKSxcbiAgICAgIHJlcV9pZC5zZXQocmFuZGludC5jYWxsKDAsIHBsYW5uZXIuTlJFUVMpKSxcbiAgICAgIGlmRWxzZShhc3NpZ25lZC5hdChyZXFfaWQpLmVxKDEpLCByZXQoKSwgYXNzaWduZWQuYXQocmVxX2lkKS5zZXQoMSkpLFxuICAgICAgdG9mZnNldC5zZXQodHJhbi5tdWwoVFNJWkUpKSxcbiAgICAgIHRzaXplLnNldChzY2hlZF9zaXplLmF0KHRyYW4pKSxcbiAgICAgIGlmRWxzZSh0c2l6ZS5ndChUU0laRSAtIDIpLCB0cmFwKFwic2NoZWR1bGUgY2FwYWNpdHkgZXhjZWVkZWRcIikpLFxuICAgICAgQS5zZXQocmFuZGludC5jYWxsKDAsIHRzaXplLmFkZCgxKSkpLFxuICAgICAgQi5zZXQocmFuZGludC5jYWxsKDAsIHRzaXplLmFkZCgxKSkpLFxuICAgICAgaWZFbHNlKEEuZ3QoQiksIFt0bXAuc2V0KEEpLCBBLnNldChCKSwgQi5zZXQodG1wKV0pLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5hZGQoMiksIEIsIHRzaXplLnN1YihCKSksXG4gICAgICBzY2hlZFZpZXcubW92ZShBLmFkZCgxKSwgQSwgQi5zdWIoQSkpLFxuICAgICAgdG1wLnNldChyYW5kaW50LmNhbGwoMCwgMikpLFxuICAgICAgc2NoZWRWaWV3LmF0KEEpLnNldCh7IHJlcV9pZCwgaXNfbG9hZDogMSwgZGVjazogdG1wIH0pLFxuICAgICAgc2NoZWRWaWV3LmF0KEIuYWRkKDEpKS5zZXQoeyByZXFfaWQsIGlzX2xvYWQ6IDAsIGRlY2s6IHRtcCB9KSxcbiAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KHRzaXplLmFkZCgyKSksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IGFkZFJlcXVlc3QgPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiXSwgXCJ2b2lkXCIsXG4gICAgKHJlcW4sIHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSkgPT5cbiAgICAgIHJlcXVlc3RzLmF0KHJlcW4pLnNldCh7IHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSB9KSxcbiAgKVxuICBjb25zdCBzZWFyY2ggPSBmdW5jKFtdLCBcInZvaWRcIiwgKCkgPT4gW1xuXG4gICAgZGVidWcoXCJkZWJ1Z2dlciBvbi5cIiwgMCksXG5cbiAgICB0cnlBc3NpZ24uY2FsbCgpLFxuICAgIHRyeUFzc2lnbi5jYWxsKCksXG4gICAgdHJ5QXNzaWduLmNhbGwoKSxcbiAgXSlcbiAgY29uc3QgZ2V0U3RvcCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBTVE9QLFxuICAgICh0cmFuLCBpbmRleCkgPT4gc2NoZWR1bGUuYXQodHJhbi5tdWwoVFNJWkUpLmFkZChpbmRleCkpLFxuICApXG5cbiAgY29uc3Qgd2FzbSA9IGF3YWl0IGNvbXBpbGUoe1xuICAgIGFkZFJlcXVlc3QsXG4gICAgYXNzaWduZWQsXG4gICAgZGlzdHMsXG4gICAgZ2V0U3RvcCxcbiAgICByYW5kU3RhdGUsXG4gICAgc2NoZWR1bGUsXG4gICAgc2VhcmNoLFxuICAgIHNjaGVkX3NpemUsXG4gICAgdHJhbl9wb3NpdGlvbnMsXG4gIH0pXG5cbiAgd2FzbS5kaXN0cy5zZXQocGxhbm5lci5yb2FkbWFwLkNvc3RNYXRyaXgpXG4gIHdhc20ucmFuZFN0YXRlLnNldChBcnJheS5mcm9tKHsgbGVuZ3RoOiBOV09SS0VSUyAqIDIgfSwgKF8sIGkpID0+IGkgKyAxKSlcbiAgd2FzbS50cmFuX3Bvc2l0aW9ucy5zZXQocGxhbm5lci5zdGFydHBvc2l0aW9ucylcbiAgcGxhbm5lci5yZXF1ZXN0cy5mb3JFYWNoKChyZXF1ZXN0LCBpKSA9PlxuICAgIHdhc20uYWRkUmVxdWVzdChpLCByZXF1ZXN0LnN0YXJ0UG9pbnQsIHJlcXVlc3QuZW5kUG9pbnQsIHJlcXVlc3QudmFsdWVfZXVyLCByZXF1ZXN0LmRlYWRsaW5lX2gpLFxuICApXG5cbiAgY29uc3Qgc3RhcnRlZEF0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgd2FzbS5zZWFyY2goKVxuICBjb25zdCBlbGFwc2VkTXMgPSBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0ZWRBdFxuICBjb25zdCByZXN1bHRTY2hlZHVsZSA9IG5ldyBVaW50MzJBcnJheShwbGFubmVyLk5UUkFOUyAqIFRTSVpFKVxuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHBsYW5uZXIuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdhc20uc2NoZWRfc2l6ZVt0cmFuXSE7IGkrKykge1xuICAgICAgY29uc3Qgc3RvcCA9IHdhc20uZ2V0U3RvcCh0cmFuLCBpKVxuICAgICAgcmVzdWx0U2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaV0gPSBzdG9wLmlzX2xvYWQgfCBzdG9wLmRlY2sgPDwgMSB8IHN0b3AucmVxX2lkIDw8IDJcbiAgICB9XG4gIH1cbiAgY29uc3QgdW5hc3NpZ25lZCA9IG5ldyBJbnQ4QXJyYXkocGxhbm5lci5OUkVRUylcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmFzc2lnbmVkLmxlbmd0aDsgaSsrKSB1bmFzc2lnbmVkW2ldID0gd2FzbS5hc3NpZ25lZFtpXSA/IDAgOiAxXG4gIGNvbnN0IHNjaGVkdWxlUmF0aW5ncyA9IG5ldyBJbnQzMkFycmF5KHBsYW5uZXIuTlRSQU5TKVxuXG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHJlc3VsdFNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IG5ldyBVaW50MTZBcnJheSh3YXNtLnNjaGVkX3NpemUpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpLFxuICAgIFRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiAwLFxuICB9XG59XG4iLAogICAgImltcG9ydCB7IGJ1dHRvbiwgY29sb3IsIGRpdiwgcCwgcG9wdXAsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRoLCB0ciB9IGZyb20gXCIuLi92aWV3L2h0bWxcIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuLi92aWV3L21haW5cIjtcbmltcG9ydCB7IGJhc2VsaW5lQW5uZWFsaW5nLCB0eXBlIEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHsgY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uLCBpbXByb3ZlZEFubmVhbGluZywgdHlwZSBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gfSBmcm9tIFwiLi9hbm5lYWxpbmdfaW1wcm92ZWRcIjtcbmltcG9ydCB7IGFubmVhbGluZ1dhc20gfSBmcm9tIFwiLi9hbm5lYWxpbmdfd2FzbVwiO1xuaW1wb3J0IHsgZ2V0RGVjaywgZ2V0UmVxLCBpc0xvYWQgfSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbnR5cGUgU29sdmVyID0gKG1vZDogTW9kdWxlKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG5cbmNvbnN0IEFDVElWRV9TT0xWRVJfTkFNRSA9IFwiaW1wcm92ZWRcIjtcbmNvbnN0IEtNX0NPU1QgPSAwLjU7XG5jb25zdCBBVkdfU1BFRURfS01IID0gNjA7XG5jb25zdCBSRU9SR19DT1NUX0VVUiA9IDEwMDtcblxubGV0IGFubmVhbGVyOiBBbm5lYWxpbmdSZXN1bHQgfCBudWxsID0gbnVsbDtcbmxldCBhbm5lYWxpbmdTZXNzaW9uOiBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gfCBudWxsID0gbnVsbDtcbmxldCBhbm5lYWxpbmdUaW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5sZXQgbGl2ZVJlbmRlcjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBwbGFubmVyVmlldyhtb2Q6IE1vZHVsZSk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgb3V0ZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmdyYXk7XG4gIGNvbnN0IGlubmVyQm9yZGVyID0gXCIxcHggc29saWQgXCIgKyBjb2xvci5saWdodGdyYXk7XG4gIGNvbnN0IGNlbGxQYWRkaW5nID0gXCIuMzVlbSAuNWVtXCI7XG4gIGNvbnN0IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCA9IFwiMi4xZW1cIjtcblxuICBpZiAoYW5uZWFsaW5nU2Vzc2lvbiA9PSBudWxsKSB7XG4gICAgYW5uZWFsaW5nU2Vzc2lvbiA9IGNyZWF0ZUltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbihtb2QsIDFfOTAwXzAwMCk7XG4gICAgYW5uZWFsZXIgPSBhbm5lYWxpbmdTZXNzaW9uLml0ZXJhdGVGb3JNcygxMCk7XG4gIH0gZWxzZSBpZiAoYW5uZWFsZXIgPT0gbnVsbCkge1xuICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5nZXRSZXN1bHQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGl0ZW1CdXR0b24oaXRlbTogbnVtYmVyLCBsb2FkPzogYm9vbGVhbikge1xuICAgIGNvbnN0IHJlcSA9IG1vZC5yZXF1ZXN0c1tpdGVtXSE7XG4gICAgY29uc3Qgc3AgPSBzcGFuKFxuICAgICAgaXRlbS50b1N0cmluZygpLnBhZFN0YXJ0KDMsIFwiIFwiKSxcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgYm9yZGVyOiBcIjJweCBzb2xpZCB0cmFuc3BhcmVudFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjJlbVwiLFxuICAgICAgICB3aGl0ZVNwYWNlOiBcInByZVwiLFxuICAgICAgICBmb250RmFtaWx5OiBcIm1vbm9zcGFjZVwiLFxuICAgICAgfSksXG4gICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBvcHVwKFxuICAgICAgICAgIHAoXCJpdGVtIFwiLCBpdGVtKSxcbiAgICAgICAgICB0YWJsZShcbiAgICAgICAgICAgIHRyKGNlbGwoXCJzdGF0dXNcIiksIGNlbGwobG9hZCA/IFwibG9hZFwiIDogbG9hZCA9PT0gZmFsc2UgPyBcInVubG9hZFwiIDogXCJ1bmFzc2lnbmVkXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJ2YWx1ZVwiKSwgY2VsbChyZXEudmFsdWVfZXVyICsgXCLigqxcIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcImRpc3RcIiksIGNlbGwobW9kLnJvYWRtYXAuZ2V0Q29zdE4ocmVxLnN0YXJ0UG9pbnQsIHJlcS5lbmRQb2ludCkgKyBcImttXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJkZWFkbGluZVwiKSwgY2VsbChyZXEuZGVhZGxpbmVfaC50b0ZpeGVkKDIpICsgXCJoXCIpKSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICApO1xuXG4gICAgbGV0IHBvaW50cyA9IFtcbiAgICAgIHsgbnVtYmVyOiByZXEuc3RhcnRQb2ludCwgbG9nbzogXCLwn5OmXCIgfSxcbiAgICAgIHsgbnVtYmVyOiByZXEuZW5kUG9pbnQsIGxvZ286IFwi8J+PoFwiIH0sXG4gICAgXTtcblxuICAgIGlmIChsb2FkID09PSB0cnVlKSBwb2ludHMgPSBbcG9pbnRzWzBdIV07XG4gICAgaWYgKGxvYWQgPT09IGZhbHNlKSBwb2ludHMgPSBbcG9pbnRzWzFdIV07XG5cbiAgICBzcC5vbm1vdXNlZW50ZXIgPSAoKSA9PiB7XG4gICAgICBzcC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbG9yLmdyZWVuO1xuICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50cyB9XSk7XG4gICAgfTtcbiAgICBzcC5vbm1vdXNlbGVhdmUgPSAoKSA9PiB7XG4gICAgICBzcC5zdHlsZS5ib3JkZXJDb2xvciA9IFwidHJhbnNwYXJlbnRcIjtcbiAgICB9O1xuICAgIHJldHVybiBzcDtcbiAgfVxuXG4gIGNvbnN0IGNlbGw6IHR5cGVvZiB0ZCA9ICguLi54KSA9PiB0ZChzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiIH0pLCAuLi54KTtcbiAgY29uc3QgY29udHJvbHMgPSBkaXYoc3R5bGUoeyBkaXNwbGF5OiBcImZsZXhcIiwgZ2FwOiBcIi41ZW1cIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZmxleFdyYXA6IFwid3JhcFwiIH0pKTtcbiAgY29uc3Qgc2NvcmVMaW5lID0gcCgpO1xuICBjb25zdCB0aW1lTGluZSA9IHAoKTtcbiAgY29uc3Qgc29sdmVyTGluZSA9IHAoXCJzb2x2ZXI6IFwiLCBBQ1RJVkVfU09MVkVSX05BTUUpO1xuICBjb25zdCB1bmFzc2lnbmVkTGluZSA9IHAoKTtcbiAgY29uc3QgZGV0YWlsV3JhcCA9IGRpdigpO1xuICBjb25zdCB0YWJsZVdyYXAgPSBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgb3ZlcmZsb3dYOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WTogXCJoaWRkZW5cIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICB9KSxcbiAgKTtcblxuICBjb25zdCBydW5CdXR0b24gPSBidXR0b24oXCJzdGFydFwiKTtcbiAgY29uc3QgaGVhdEJ1dHRvbiA9IGJ1dHRvbihcImhlYXQgdXBcIik7XG4gIGxldCByZW5kZXJDb3VudGVyID0gMDtcblxuICBmdW5jdGlvbiBzdG9wU2VhcmNoKCkge1xuICAgIGlmIChhbm5lYWxpbmdUaW1lciAhPSBudWxsKSB7XG4gICAgICBjbGVhckludGVydmFsKGFubmVhbGluZ1RpbWVyKTtcbiAgICAgIGFubmVhbGluZ1RpbWVyID0gbnVsbDtcbiAgICB9XG4gICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gXCJzdGFydFwiO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyVGFibGUoKSB7XG4gICAgY29uc3QgdGFiID0gdGFibGUoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIH0pLFxuICAgICAgdHIoXG4gICAgICAgIHRoKFwidHJhbnNwb3J0ZXJcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICAgIHRoKFwidmFsdWVcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICAgIHRoKFwic3RlcHNcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICApLFxuICAgICAgbW9kLnN0YXJ0cG9zaXRpb25zLm1hcCgoc3RhcnQsIHRyYW4pID0+XG4gICAgICAgIHRyKFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgdHJhbixcbiAgICAgICAgICAgIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHBvcHVwKFxuICAgICAgICAgICAgICAgIHAoXCJ0cmFuc3BvcnRlcjogXCIsIHRyYW4pLFxuICAgICAgICAgICAgICAgIHAoXCJzdGFydDogXCIsIHN0YXJ0KSxcbiAgICAgICAgICAgICAgICBwKFwic2NvcmU6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVSYXRpbmdzW3RyYW5dISksXG4gICAgICAgICAgICAgICAgcChcInN0ZXBzOiBcIiwgYW5uZWFsZXI/LnNjaGVkdWxlU2l6ZXNbdHJhbl0hKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG9ubW91c2VlbnRlcjogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHM6IFt7IG51bWJlcjogc3RhcnQsIGxvZ286IFwi8J+am1wiIH1dIH1dKTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgb25tb3VzZWxlYXZlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaGlnaHRMaWdodHMuc2V0KFtdKTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0ZChhbm5lYWxlcj8uc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSksXG4gICAgICAgICAgdGQoXG4gICAgICAgICAgICB0YWJsZShcbiAgICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBbMCwgMV0ubWFwKChkZWNrKSA9PlxuICAgICAgICAgICAgICAgIHRyKFxuICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbSh7IGxlbmd0aDogYW5uZWFsZXIhLnNjaGVkdWxlU2l6ZXNbdHJhbl0hIH0sIChfLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0ZXAgPSBhbm5lYWxlcj8uc2NoZWR1bGVbdHJhbiAqIGFubmVhbGVyLlRTSVpFICsgaV0hO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGQoXG4gICAgICAgICAgICAgICAgICAgICAgZ2V0RGVjayhzdGVwKSA9PT0gZGVjayA/IGl0ZW1CdXR0b24oZ2V0UmVxKHN0ZXApLCAhIWxvYWQpIDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogbG9hZCA/IGNvbG9yLmJsdWUgOiBjb2xvci5ncmVlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogaW5uZXJCb3JkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBcIi4yZW0gLjNlbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IFwiMi42ZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2NoZWR1bGVDZWxsTWluSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgYm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcbiAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICBib3JkZXI6IG91dGVyQm9yZGVyLFxuICAgICAgICAgICAgICBwYWRkaW5nOiBcIi4yNWVtXCIsXG4gICAgICAgICAgICAgIHZlcnRpY2FsQWxpZ246IFwidG9wXCIsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICApO1xuXG4gICAgdGFibGVXcmFwLnJlcGxhY2VDaGlsZHJlbih0YWIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyU3RhdHVzKCkge1xuICAgIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IGBzY29yZTogJHthbm5lYWxlcj8udG90YWxTY29yZSA/PyAwfWA7XG4gICAgdGltZUxpbmUudGV4dENvbnRlbnQgPSBgc2VhcmNoIHRpbWU6ICR7KGFubmVhbGVyIS5lbGFwc2VkTXMvMTAwMCkudG9GaXhlZCgyKX0gc2A7XG4gICAgdW5hc3NpZ25lZExpbmUucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgXCJ1bmFzc2lnbmVkOiBcIixcbiAgICAgIC4uLkFycmF5LmZyb20oYW5uZWFsZXIhLnVuYXNzaWduZWQpXG4gICAgICAgIC5tYXAoKHgsIGkpID0+ICh7IHgsIGkgfSkpXG4gICAgICAgIC5maWx0ZXIoKHgpID0+IHgueClcbiAgICAgICAgLmZsYXRNYXAoKHgpID0+IFtzcGFuKFwiIFwiKSwgaXRlbUJ1dHRvbih4LmkpXSksXG4gICAgKTtcblxuICAgIGRldGFpbFdyYXAucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgZGl2KFxuICAgICAgICBwKFwiZGV0YWlsc1wiKSxcbiAgICAgICAgdGFibGUoXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0cihjZWxsKFwidW5hc3NpZ25lZCByZXF1ZXN0c1wiKSwgY2VsbChBcnJheS5mcm9tKGFubmVhbGVyIS51bmFzc2lnbmVkKS5tYXAoKHgsIGkpID0+ICh7IHgsIGkgfSkpLmZpbHRlcigoeCkgPT4geC54KS5mbGF0TWFwKCh4KSA9PiBbc3BhbihcIiBcIiksIGl0ZW1CdXR0b24oeC5pKV0pKSksXG4gICAgICAgICAgdHIoY2VsbChcInNlYXJjaCB0aW1lXCIpLCBjZWxsKGAke2FubmVhbGVyPy5lbGFwc2VkTXMgPz8gMH1tc2ApKSxcbiAgICAgICAgICB0cihjZWxsKFwic2NvcmVcIiksIGNlbGwoYW5uZWFsZXI/LnRvdGFsU2NvcmUgPz8gMCkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJ0cmFuc3BvcnRlciBjb3VudFwiKSwgY2VsbChtb2QuTlRSQU5TKSksXG4gICAgICAgICAgdHIoY2VsbChcInJlcXVlc3QgY291bnRcIiksIGNlbGwobW9kLk5SRVFTKSksXG4gICAgICAgICAgdHIoY2VsbChcImNvc3QgcGVyIGttXCIpLCBjZWxsKGAke0tNX0NPU1R94oKsYCkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJhdmVyYWdlIHNwZWVkXCIpLCBjZWxsKGAke0FWR19TUEVFRF9LTUh9a20vaGApKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVvcmdhbml6YXRpb24gY29zdFwiKSwgY2VsbChgJHtSRU9SR19DT1NUX0VVUn3igqxgKSksXG4gICAgICAgICksXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXIoZm9yY2VUYWJsZSA9IGZhbHNlKSB7XG4gICAgcmVuZGVyU3RhdHVzKCk7XG4gICAgaWYgKGZvcmNlVGFibGUgfHwgKHJlbmRlckNvdW50ZXIrKyAlIDQgPT09IDApKSByZW5kZXJUYWJsZSgpO1xuICB9XG5cbiAgcnVuQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgaWYgKGFubmVhbGluZ1RpbWVyICE9IG51bGwpIHtcbiAgICAgIHN0b3BTZWFyY2goKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gXCJzdG9wXCI7XG4gICAgYW5uZWFsaW5nVGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKCFhbm5lYWxpbmdTZXNzaW9uKSByZXR1cm47XG4gICAgICBhbm5lYWxlciA9IGFubmVhbGluZ1Nlc3Npb24uaXRlcmF0ZUZvck1zKDEyMCk7XG4gICAgICByZW5kZXIoKTtcbiAgICB9LCAxNTApO1xuICB9O1xuXG4gIGhlYXRCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICBhbm5lYWxlciA9IGFubmVhbGluZ1Nlc3Npb24ucmVoZWF0KCk7XG4gICAgcmVuZGVyKHRydWUpO1xuICB9O1xuXG4gIGxpdmVSZW5kZXIgPSAoKSA9PiByZW5kZXIodHJ1ZSk7XG4gIHJlbmRlcih0cnVlKTtcbiAgY29udHJvbHMucmVwbGFjZUNoaWxkcmVuKHJ1bkJ1dHRvbiwgaGVhdEJ1dHRvbik7XG5cbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBwYWRkaW5nOiBcIjFlbVwiLFxuICAgICAgb3ZlcmZsb3dZOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WDogXCJoaWRkZW5cIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICB9KSxcbiAgICBjb250cm9scyxcbiAgICBzb2x2ZXJMaW5lLFxuICAgIHNjb3JlTGluZSxcbiAgICB0aW1lTGluZSxcbiAgICB0YWJsZVdyYXAsXG4gICAgZGV0YWlsV3JhcCxcbiAgICB1bmFzc2lnbmVkTGluZSxcbiAgKTtcbn1cblxuZXhwb3J0IGNvbnN0IGF2YWlsYWJsZVNvbHZlcnMgPSB7XG4gIGJhc2VsaW5lOiBiYXNlbGluZUFubmVhbGluZyxcbiAgaW1wcm92ZWQ6IGltcHJvdmVkQW5uZWFsaW5nLFxuICB3YXNtOiBhbm5lYWxpbmdXYXNtLFxufSBhcyBjb25zdDtcbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lXCJcbmltcG9ydCB7IGFubmVhbGluZ1dhc20gfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nX3dhc21cIlxuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgZGl2LCBoMiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCJcblxubGV0IHJlc3VsdDogQW5uZWFsaW5nUmVzdWx0IHwgbnVsbCA9IG51bGxcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFVwV2FzbShwbGFubmVyOiBNb2R1bGUpIHtcbiAgcmVzdWx0ID0gYXdhaXQgYW5uZWFsaW5nV2FzbShwbGFubmVyKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd2FzbVZpZXcoX3BsYW5uZXI6IE1vZHVsZSkge1xuICBpZiAocmVzdWx0ID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJXQVNNIHBsYW5uZXIgaXMgbm90IHNldCB1cFwiKVxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHsgcGFkZGluZzogXCIxZW1cIiB9KSxcbiAgICBoMihcIldBU00gcGxhbm5lclwiKSxcbiAgICBwKFwiYXNzaWduZWQ6IFwiLCByZXN1bHQudW5hc3NpZ25lZC5sZW5ndGggLSByZXN1bHQudW5hc3NpZ25lZC5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSksXG4gICAgcChcInNjaGVkdWxlIHN0ZXBzOiBcIiwgcmVzdWx0LnNjaGVkdWxlU2l6ZXMucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkpLFxuICAgIHAoXCJzZWFyY2ggdGltZTogXCIsIHJlc3VsdC5lbGFwc2VkTXMudG9GaXhlZCgyKSwgXCJtc1wiKSxcbiAgKVxufVxuXG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcm9hZG1hcFwiO1xuaW1wb3J0IHsgcmFuZG9tTW9kdWxlLCByYW5kb21VVUlELCBSZXF1ZXN0LCBTY2hlZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgbWtTdG9yZWQsIG1rV3JpdGFibGUsIHR5cGUgV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kb20sIHNldFJhbmRTZWVkIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHsgbnVtYmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgcGxhbm5lclZpZXcgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nXCI7XG5pbXBvcnQgeyBzZXRVcFdhc20sIHdhc21WaWV3IH0gZnJvbSBcIi4vd2FzbXZpZXdcIjtcblxuXG5leHBvcnQgbGV0IExLV19DT1VOVCA9IG1rU3RvcmVkKFwiTEtXX0NPVU5UXCIsIG51bWJlciwgIDUpXG5sZXQgUkVRVUVTVF9DT1VOVCA9IG1rU3RvcmVkKFwiUkVRVUVTVF9DT1VOVFwiLCAgbnVtYmVyLCAyMClcblxuYm9keS5zdHlsZS5tYXJnaW4gPSBcIjBcIlxuXG5sZXQgaGVhZGVyID0gaDEoXCJyb3V0ZSBwbGFubmVyXCIsIHN0eWxlKHtiYWNrZ3JvdW5kOiBjb2xvci5ibHVlLCBjb2xvcjogY29sb3IuYmFja2dyb3VuZCwgbWFyZ2luOiBcIjBcIiwgcGFkZGluZzogXCIuNmVtXCJ9KSlcblxubGV0IGNvbnRlbnRTcGFjZSA9IGRpdihzdHlsZSh7XG4gIGRpc3BsYXk6XCJmbGV4XCIsXG4gIGZsZXhEaXJlY3Rpb246XCJyb3dcIixcbiAgd2lkdGg6IFwiMTAwJVwiLFxuICBoZWlnaHQ6IFwiY2FsYygxMDAlIC0gMi41ZW0pXCIsXG4gIG1pbldpZHRoOiBcIjBcIixcbn0pKVxuXG5sZXQgcGFnZSA9IGRpdihcbiAgc3R5bGUoe2Rpc3BsYXk6XCJmbGV4XCIsIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIiwgaGVpZ2h0OiBcIjEwMCVcIn0pLFxuICBoZWFkZXIsXG4gIGNvbnRlbnRTcGFjZVxuKVxuXG5ib2R5LnJlcGxhY2VDaGlsZHJlbihwYWdlKVxuXG5zZXRSYW5kU2VlZCgyNClcblxuZXhwb3J0IGxldCBtb2R1bGUgPSByYW5kb21Nb2R1bGUoKVxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIG51bWJlcjogbnVtYmVyLFxuICAgIGxvZ28/IDogc3RyaW5nLFxuICB9W10sXG4gIGNvbG9yPzogc3RyaW5nXG59XG5cbmV4cG9ydCBsZXQgaGlnaHRMaWdodHMgPSBta1dyaXRhYmxlIDxIaWdoTGlnaHRbXT4oIFtdIClcblxuXG5mdW5jdGlvbiBzZXR0ZXIgKHN0b3JlOiBXcml0YWJsZTxudW1iZXI+ICl7XG4gIGxldCBpbnAgPSBpbnB1dCgpXG4gIGlucC50eXBlID0gXCJudW1iZXJcIlxuICBpbnAub25jaGFuZ2UgPSAoKT0+e1xuICAgIGxldCB2YWwgPSBwYXJzZUludChpbnAudmFsdWUpXG4gICAgaWYgKGlzTmFOKHZhbCkpIHJldHVyblxuICAgIHN0b3JlLnNldCh2YWwpXG4gIH1cbiAgc3RvcmUub251cGRhdGUodmFsPT5pbnAudmFsdWUgPSB2YWwudG9TdHJpbmcoKSlcblxuICByZXR1cm4gaW5wXG59XG5cblxuYXdhaXQgc2V0VXBXYXNtKG1vZHVsZSlcblxuZnVuY3Rpb24gbWtXaW5kb3cgKHRhYjogbnVtYmVyID0gMCApIHtcblxuICBsZXQgdGFiRmllbGRzID0gW1xuICAgIFsnbWFwJywgbWFwVmlldyhtb2R1bGUpXSxcbiAgICBbJ3BsYW5uZXInLCBwbGFubmVyVmlldyhtb2R1bGUpXSxcbiAgICBbJ3dhc20nLCB3YXNtVmlldyhtb2R1bGUpXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gIH0pKVxuXG4gIGZ1bmN0aW9uIG9wZW5UYWIodGFiOiB0eXBlb2YgdGFiRmllbGRzW251bWJlcl1bMF0pIHtcbiAgICBjb25zdCB0YWJzID0gcChcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgbWFyZ2luOiBcIjBcIixcbiAgICAgICAgcGFkZGluZzogXCIuNGVtXCIsXG4gICAgICAgIGZsZXg6IFwiMCAwIGF1dG9cIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLm1hcCgoW24sZV0pPT5cbiAgICAgICAgc3BhbiggbixcbiAgICAgICAgICAoKT0+b3BlblRhYihuKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIuM2VtXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIisgKG49PXRhYiA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSksXG4gICAgICAgICAgICBjb2xvcjogKG49PXRhYikgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBkaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGZsZXg6IFwiMSAxIGF1dG9cIixcbiAgICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMuZmluZCgoW24sXSk9Pm49PXRhYikhWzFdXG4gICAgKVxuXG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgdGFicyxcbiAgICAgIGNvbnRlbnRcbiAgICApXG4gIH1cblxuICBvcGVuVGFiKHRhYkZpZWxkc1t0YWJdIVswXSlcblxuICByZXR1cm4gZWxcbn1cblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbihta1dpbmRvdygyICksIG1rV2luZG93KCkpXG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBRU8sSUFBTSxPQUFPLFNBQVM7QUFFN0IsSUFBTSxlQUFlO0FBQUEsRUFDbkIsT0FBTTtBQUFBLElBQ0osT0FB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QUEsTUFDUixRQUFRO0FBQUEsTUFDUixRQUFRLGdCQUFlLEtBQUcsT0FBTSxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ3BELE9BQVEsS0FBRyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQUEsSUFDeEMsQ0FBQyxDQUNILENBQ0YsQ0FDRjtBQUFBLElBRUEsTUFBTSxVQUFVLElBQ2QsTUFBTTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sV0FBVztBQUFBLE1BQ1gsVUFBVTtBQUFBLElBQ1osQ0FBQyxHQUNELFVBQVUsS0FBSyxFQUFFLE9BQU0sS0FBRyxJQUFHLEVBQUcsRUFDbEM7QUFBQSxJQUVBLEdBQUcsZ0JBQ0QsTUFDQSxPQUNGO0FBQUE7QUFBQSxFQUdGLFFBQVEsVUFBVSxLQUFNLEVBQUU7QUFBQSxFQUUxQixPQUFPO0FBQUE7QUFHVCxhQUFhLGdCQUFnQixTQUFTLENBQUUsR0FBRyxTQUFTLENBQUM7IiwKICAiZGVidWdJZCI6ICI3MzVFNTNDRTkwRjc5REVBNjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
