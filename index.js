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
    annealer = annealingSession.iterateForMs(500);
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
function mkWindow(tab = 0) {
  let tabFields = [
    ["map", mapView(module)],
    ["planner", plannerView(module)]
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
contentSpace.replaceChildren(mkWindow(1), mkWindow());
export {
  module,
  hightLights,
  LKW_COUNT
};

//# debugId=EF1A46607DF954E764756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5jb25zdCBJTkYgPSAxIDw8IDMwO1xuXG5leHBvcnQgdHlwZSBQYWlySW5mbyA9IHtcbiAgcmVxOiBudW1iZXI7XG4gIGZpcnN0OiBudW1iZXI7XG4gIHNlY29uZDogbnVtYmVyO1xuICBkZWNrOiAwIHwgMTtcbn07XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1N0YXRlID0ge1xuICBtb2Q6IE1vZHVsZTtcbiAgTlJFUVM6IG51bWJlcjtcbiAgTlRSQU5TOiBudW1iZXI7XG4gIFRTSVpFOiBudW1iZXI7XG4gIHJlcVBpY2t1cExvY2F0aW9uczogVWludDE2QXJyYXk7XG4gIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVhZGxpbmVzOiBVaW50MzJBcnJheTtcbiAgcmVxVmFsdWVzOiBVaW50MzJBcnJheTtcbiAgdW5hc3NpZ25lZDogSW50OEFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2FkKHg6IG51bWJlcikge1xuICByZXR1cm4geCAmIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNrKHg6IG51bWJlcikge1xuICByZXR1cm4gKCh4ICYgMikgPj4gMSkgYXMgMCB8IDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXEoeDogbnVtYmVyKSB7XG4gIHJldHVybiAoeCAmIDB4ZmZmZikgPj4gMjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvcyh4OiBudW1iZXIpIHtcbiAgcmV0dXJuIHggPj4gMTY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QW5uZWFsaW5nU3RhdGUobW9kOiBNb2R1bGUsIHNlZWQ/OiBBbm5lYWxpbmdSZXN1bHQpOiBBbm5lYWxpbmdTdGF0ZSB7XG4gIGNvbnN0IHsgTlJFUVMsIHJlcXVlc3RzLCBzdGFydHBvc2l0aW9ucywgTlRSQU5TIH0gPSBtb2Q7XG4gIGNvbnN0IFRTSVpFID0gTWF0aC5mbG9vcihOUkVRUyAqIDIuNSArIDEwKTtcblxuICByZXR1cm4ge1xuICAgIG1vZCxcbiAgICBOUkVRUyxcbiAgICBOVFJBTlMsXG4gICAgVFNJWkUsXG4gICAgcmVxUGlja3VwTG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLnN0YXJ0UG9pbnQpKSxcbiAgICByZXFEZWxpdmVyeUxvY2F0aW9uczogbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5lbmRQb2ludCkpLFxuICAgIHJlcURlYWRsaW5lczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci5kZWFkbGluZV9oICogQVZHX1NQRUVEX0tNSCkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gci52YWx1ZV9ldXIgLyBLTV9DT1NUKSksXG4gICAgdW5hc3NpZ25lZDogc2VlZCA/IG5ldyBJbnQ4QXJyYXkoc2VlZC51bmFzc2lnbmVkKSA6IG5ldyBJbnQ4QXJyYXkocmVxdWVzdHMubWFwKCgpID0+IDEpKSxcbiAgICB0cmFuU3RhcnQ6IG5ldyBVaW50MTZBcnJheShzdGFydHBvc2l0aW9ucyksXG4gICAgc2NoZWR1bGU6IHNlZWQgPyBuZXcgVWludDMyQXJyYXkoc2VlZC5zY2hlZHVsZSkgOiBuZXcgVWludDMyQXJyYXkoVFNJWkUgKiBOVFJBTlMpLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHNlZWQgPyBuZXcgVWludDE2QXJyYXkoc2VlZC5zY2hlZHVsZVNpemVzKSA6IG5ldyBVaW50MTZBcnJheShOVFJBTlMpLFxuICAgIHNjaGVkdWxlUmF0aW5nczogc2VlZCA/IG5ldyBJbnQzMkFycmF5KHNlZWQuc2NoZWR1bGVSYXRpbmdzKSA6IG5ldyBJbnQzMkFycmF5KE5UUkFOUyksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZU9mZnNldChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICByZXR1cm4gdHJhbiAqIHN0YXRlLlRTSVpFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBpZHg6IG51bWJlciwgaXNMb2FkQml0OiAxIHwgMCwgZGVjazogMCB8IDEsIHJlcTogbnVtYmVyLCBwb3M6IG51bWJlcikge1xuICBzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdID0gKGlzTG9hZEJpdCA8PCAwKSB8IChkZWNrIDw8IDEpIHwgKHJlcSA8PCAyKSB8IChwb3MgPDwgMTYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvcmVSb3V0ZShzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlcikge1xuICBsZXQgcmV3YXJkID0gMDtcbiAgbGV0IGR1cmF0aW9uID0gMDtcbiAgY29uc3QgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV07XG4gIGxldCBwb3MgPSBzdGF0ZS50cmFuU3RhcnRbdHJhbl0hO1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKTtcbiAgICBjb25zdCBuZXh0UG9zID0gZ2V0UG9zKHN0ZXApO1xuICAgIGR1cmF0aW9uICs9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgZHVyYXRpb24gKz0gKGRlY2subGVuZ3RoIC0gaWR4IC0gMSkgKiBSRU9SR19DT1NUX0VVUiAvIEtNX0NPU1Q7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGR1cmF0aW9uIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gZHVyYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoQWxsUmF0aW5ncyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUpIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIG1heExvc3MgPSAyNDApIHtcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGlmIChzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dICE9PSAwKSBjb250aW51ZTtcblxuICAgIGxldCBiZXN0UmVxID0gLTE7XG4gICAgbGV0IGJlc3RTY29yZSA9IC1JTkY7XG5cbiAgICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICAgIGlmICghc3RhdGUudW5hc3NpZ25lZFtyZXFdKSBjb250aW51ZTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCAwLCAwLCAwLCByZXEpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCAwLCAxKTtcbiAgICAgIGlmIChzY29yZSA+IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdFJlcSA9IHJlcTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYmVzdFJlcSA9PT0gLTEgfHwgYmVzdFNjb3JlIDwgLW1heExvc3MpIGNvbnRpbnVlO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIGJlc3RSZXEpO1xuICAgIHN0YXRlLnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IGJlc3RTY29yZTtcbiAgICBzdGF0ZS51bmFzc2lnbmVkW2Jlc3RSZXFdID0gMDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0U3RvcHMoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBlbmQgKyAyLCBvZmZzZXQgKyBlbmQsIG9mZnNldCArIHNpemUpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIGVuZCArIDEpO1xuICBzZXRSZXEoc3RhdGUsIHRyYW4sIHN0YXJ0LCAxLCBkZWNrLCByZXEsIHN0YXRlLnJlcVBpY2t1cExvY2F0aW9uc1tyZXFdISk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgZW5kICsgMSwgMCwgZGVjaywgcmVxLCBzdGF0ZS5yZXFEZWxpdmVyeUxvY2F0aW9uc1tyZXFdISk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMjtcbiAgc3RhdGUuc2NoZWR1bGUuY29weVdpdGhpbihvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBlbmQpO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCAtIDEsIG9mZnNldCArIGVuZCArIDEsIG9mZnNldCArIHNpemUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhaXJJblJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCByZXE6IG51bWJlcik6IFBhaXJJbmZvIHwgbnVsbCB7XG4gIGNvbnN0IG9mZnNldCA9IHJvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKTtcbiAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICBsZXQgZmlyc3QgPSAtMTtcbiAgbGV0IHNlY29uZCA9IC0xO1xuICBsZXQgZGVjazogMCB8IDEgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgY29uc3Qgc3RlcCA9IHN0YXRlLnNjaGVkdWxlW29mZnNldCArIGldITtcbiAgICBpZiAoZ2V0UmVxKHN0ZXApICE9PSByZXEpIGNvbnRpbnVlO1xuICAgIGlmIChmaXJzdCA9PT0gLTEpIHtcbiAgICAgIGZpcnN0ID0gaTtcbiAgICAgIGRlY2sgPSBnZXREZWNrKHN0ZXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWNvbmQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZpcnN0ID09PSAtMSB8fCBzZWNvbmQgPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHsgcmVxLCBmaXJzdCwgc2Vjb25kLCBkZWNrIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVVbmFzc2lnbmVkUmVxKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IG51bWJlciB8IG51bGwge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1heEF0dGVtcHRzOyBpKyspIHtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIHN0YXRlLk5SRVFTKTtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgZm9yIChsZXQgcmVxID0gMDsgcmVxIDwgc3RhdGUuTlJFUVM7IHJlcSsrKSB7XG4gICAgaWYgKHN0YXRlLnVuYXNzaWduZWRbcmVxXSkgcmV0dXJuIHJlcTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4QXR0ZW1wdHMgPSAyNCk6IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbyB9IHwgbnVsbCB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgbWF4QXR0ZW1wdHM7IGF0dGVtcHQrKykge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIHN0YXRlLk5UUkFOUyk7XG4gICAgY29uc3Qgc2l6ZSA9IHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGlmIChzaXplIDwgMikgY29udGludWU7XG4gICAgY29uc3QgaWR4ID0gcmFuZEludCgwLCBzaXplKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pICsgaWR4XSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgc3RhdGUuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RhdGUuc2NoZWR1bGVbcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pXSEpO1xuICAgIGNvbnN0IHBhaXIgPSBmaW5kUGFpckluUm91dGUoc3RhdGUsIHRyYW4sIHJlcSk7XG4gICAgaWYgKHBhaXIpIHJldHVybiB7IHRyYW4sIHBhaXIgfTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWNjZXB0QW5uZWFsKHByZXZTY29yZTogbnVtYmVyLCBuZXh0U2NvcmU6IG51bWJlciwgdGVtcDogbnVtYmVyKSB7XG4gIGlmIChuZXh0U2NvcmUgPj0gcHJldlNjb3JlKSByZXR1cm4gdHJ1ZTtcbiAgY29uc3QgZGVsdGEgPSBwcmV2U2NvcmUgLSBuZXh0U2NvcmU7XG4gIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKC1kZWx0YSAvIE1hdGgubWF4KHRlbXAsIDAuMDAxKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIGVsYXBzZWRNczogbnVtYmVyKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZTogc3RhdGUuc2NoZWR1bGUsXG4gICAgc2NoZWR1bGVTaXplczogc3RhdGUuc2NoZWR1bGVTaXplcyxcbiAgICB0cmFuU3RhcnQ6IHN0YXRlLnRyYW5TdGFydCxcbiAgICBUU0laRTogc3RhdGUuVFNJWkUsXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MsXG4gICAgdW5hc3NpZ25lZDogc3RhdGUudW5hc3NpZ25lZCxcbiAgICBlbGFwc2VkTXMsXG4gICAgdG90YWxTY29yZTogc3RhdGUuc2NoZWR1bGVSYXRpbmdzLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApLFxuICB9O1xufVxuIiwKICAgICJpbXBvcnQgeyByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGdldERlY2ssXG4gIGdldFJlcSxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCB0eXBlIEFubmVhbGluZ1Jlc3VsdCA9IHtcbiAgc2NoZWR1bGU6IFVpbnQzMkFycmF5O1xuICBzY2hlZHVsZVNpemVzOiBVaW50MTZBcnJheTtcbiAgdHJhblN0YXJ0OiBVaW50MTZBcnJheTtcbiAgVFNJWkU6IG51bWJlcjtcbiAgc2NoZWR1bGVSYXRpbmdzOiBJbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIGVsYXBzZWRNczogbnVtYmVyO1xuICB0b3RhbFNjb3JlOiBudW1iZXI7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYmFzZWxpbmVBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMV82MDBfMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kKTtcbiAgY29uc3QgeyBOUkVRUywgTlRSQU5TLCBUU0laRSwgc2NoZWR1bGUsIHNjaGVkdWxlU2l6ZXMsIHNjaGVkdWxlUmF0aW5ncywgdW5hc3NpZ25lZCB9ID0gc3RhdGU7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEwMDtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2UmF0aW5nOiBudW1iZXIsIG5leHRSYXRpbmc6IG51bWJlcikge1xuICAgIGlmIChuZXh0UmF0aW5nID49IHByZXZSYXRpbmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0UmF0aW5nIC0gcHJldlJhdGluZykgLyBNYXRoLm1heCh0ZW1wLCAwLjAwMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2NoZWRTaXplICsgMSk7XG4gICAgY29uc3QgYiA9IE1hdGgubWluKHNjaGVkU2l6ZSwgcmFuZEludCgwLCA0KSArIGEpO1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpO1xuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAwLjUgPyAxIDogMCwgcmVxKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICBjb25zdCBzY2hlZFNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2NoZWRTaXplIDwgMikgcmV0dXJuO1xuICAgIGNvbnN0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRTaXplKTtcbiAgICBjb25zdCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSE7XG4gICAgY29uc3QgcmVxID0gZ2V0UmVxKGl0ZW0pO1xuXG4gICAgY29uc3QgYWI6IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZFNpemU7IGkrKykge1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09PSByZXEpIGFiLnB1c2goaSk7XG4gICAgfVxuICAgIGlmIChhYi5sZW5ndGggIT09IDIpIHJldHVybjtcblxuICAgIGNvbnN0IFthLCBiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl07XG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIpO1xuICAgIGNvbnN0IG5ld1JhdGluZyA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgIGlmIChhY2NlcHQoc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgbmV3UmF0aW5nKSkge1xuICAgICAgc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gbmV3UmF0aW5nO1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgLSAxLCBnZXREZWNrKGl0ZW0pIGFzIDAgfCAxLCByZXEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwczsgaSsrKSB7XG4gICAgdGVtcCA9ICgxIC0gaSAvIHN0ZXBzKSAqIHN0YXJ0VGVtcDtcbiAgICB0cnlVbmFzc2lnbigpO1xuICAgIHRyeUFzc2lnbigpO1xuICB9XG5cbiAgcmV0dXJuIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlLCBEYXRlLm5vdygpIC0gc3RhcnRlZEF0KTtcbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBiYXNlbGluZUFubmVhbGluZyB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHtcbiAgYWNjZXB0QW5uZWFsLFxuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgaW5pdEFubmVhbGluZ1N0YXRlLFxuICBpbnNlcnRTdG9wcyxcbiAgdHlwZSBQYWlySW5mbyxcbiAgcmVtb3ZlU3RvcHMsXG4gIHNhbXBsZUFzc2lnbmVkUGFpcixcbiAgc2FtcGxlVW5hc3NpZ25lZFJlcSxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxudHlwZSBJbXByb3ZlZE9wdGlvbnMgPVxuICB8IHsgc3RlcHM6IG51bWJlcjsgYnVkZ2V0TXM/OiBuZXZlciB9XG4gIHwgeyBidWRnZXRNczogbnVtYmVyOyBzdGVwcz86IG5ldmVyIH07XG5cbmV4cG9ydCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiA9IHtcbiAgaXRlcmF0ZVN0ZXBzOiAoc3RlcHM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBpdGVyYXRlRm9yTXM6IChidWRnZXRNczogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG4gIGdldFJlc3VsdDogKCkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICByZWhlYXQ6IChmYWN0b3I/OiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kOiBNb2R1bGUsIHRhcmdldFN0ZXBzID0gMTUwMDAwKTogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHtcbiAgY29uc3Qgd2FybXVwU3RlcHMgPSBNYXRoLm1pbihNYXRoLm1heCgyMDAwMCwgTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMikpLCA1MDAwMCk7XG4gIGNvbnN0IHdhcm11cCA9IGJhc2VsaW5lQW5uZWFsaW5nKG1vZCwgd2FybXVwU3RlcHMpO1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QsIHdhcm11cCk7XG4gIGNvbnN0IHsgTlRSQU5TLCBzY2hlZHVsZVNpemVzLCBzY2hlZHVsZVJhdGluZ3MsIHVuYXNzaWduZWQgfSA9IHN0YXRlO1xuICBib290c3RyYXBFbXB0eVJvdXRlcyhzdGF0ZSk7XG5cbiAgbGV0IHN0YXJ0VGVtcCA9IDEyMDtcbiAgbGV0IGVuZFRlbXAgPSAwLjU7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyByZXE6IG51bWJlcjsgYTogbnVtYmVyOyBiOiBudW1iZXI7IGRlY2s6IDAgfCAxOyBzY29yZTogbnVtYmVyIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IHJlcSA9IHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGUpO1xuICAgICAgaWYgKHJlcSA9PSBudWxsKSBicmVhaztcblxuICAgICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBjb25zdCBkZWNrID0gKHJhbmRvbSgpID4gMC41ID8gMSA6IDApIGFzIDAgfCAxO1xuXG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgZGVjaywgcmVxKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHJlcSwgYSwgYiwgZGVjaywgc2NvcmU6IG5ld1Njb3JlIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LmEsIGJlc3QuYiwgYmVzdC5kZWNrLCBiZXN0LnJlcSk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucmVxXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iICsgMSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ25TYW1wbGVkKHNhbXBsZXMgPSA2KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7IHRyYW46IG51bWJlcjsgcGFpcjogUGFpckluZm87IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcbiAgICAgIGNvbnN0IG5ld1Njb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IG5ld1Njb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0geyB0cmFuLCBwYWlyLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCk7XG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgICB1bmFzc2lnbmVkW2Jlc3QucGFpci5yZXFdID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlbG9jYXRlU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgc3JjOiBudW1iZXI7XG4gICAgICBkc3Q6IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICAgIG9sZFNjb3JlOiBudW1iZXI7XG4gICAgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgY2hvc2VuID0gc2FtcGxlQXNzaWduZWRQYWlyKHN0YXRlKTtcbiAgICAgIGlmICghY2hvc2VuKSBicmVhaztcblxuICAgICAgY29uc3QgeyB0cmFuOiBzcmMsIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIGNvbnN0IGRzdCA9IHJhbmRJbnQoMCwgTlRSQU5TKTtcbiAgICAgIGNvbnN0IG9sZFNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY2hlZHVsZVJhdGluZ3Nbc3JjXSFcbiAgICAgICAgOiBzY2hlZHVsZVJhdGluZ3Nbc3JjXSEgKyBzY2hlZHVsZVJhdGluZ3NbZHN0XSE7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3QgZHN0U2l6ZSA9IHNjaGVkdWxlU2l6ZXNbZHN0XSE7XG4gICAgICBjb25zdCBhID0gcmFuZEludCgwLCBkc3RTaXplICsgMSk7XG4gICAgICBjb25zdCBiID0gTWF0aC5taW4oZHN0U2l6ZSwgYSArIHJhbmRJbnQoMCwgTWF0aC5taW4oNiwgZHN0U2l6ZSAtIGEgKyAxKSkpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIGRzdCwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc3JjID09PSBkc3RcbiAgICAgICAgPyBzY29yZVJvdXRlKHN0YXRlLCBzcmMpXG4gICAgICAgIDogc2NvcmVSb3V0ZShzdGF0ZSwgc3JjKSArIHNjb3JlUm91dGUoc3RhdGUsIGRzdCk7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBkc3QsIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBzcmMsIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kIC0gMSwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBjYW5kaWRhdGVTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICBzcmMsXG4gICAgICAgICAgZHN0LFxuICAgICAgICAgIHBhaXIsXG4gICAgICAgICAgaW5zZXJ0QTogYSxcbiAgICAgICAgICBpbnNlcnRCOiBiLFxuICAgICAgICAgIHNjb3JlOiBjYW5kaWRhdGVTY29yZSxcbiAgICAgICAgICBvbGRTY29yZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKGJlc3Qub2xkU2NvcmUsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBpZiAoYmVzdC5zcmMgPT09IGJlc3QuZHN0KSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5zcmNdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5zcmMpO1xuICAgICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC5kc3RdID0gc2NvcmVSb3V0ZShzdGF0ZSwgYmVzdC5kc3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC5kc3QsIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC5zcmMsIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlSZWluc2VydFNhbXBsZWQoc2FtcGxlcyA9IDgpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHtcbiAgICAgIHRyYW46IG51bWJlcjtcbiAgICAgIHBhaXI6IFBhaXJJbmZvO1xuICAgICAgaW5zZXJ0QTogbnVtYmVyO1xuICAgICAgaW5zZXJ0QjogbnVtYmVyO1xuICAgICAgc2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW4sIHBhaXIgfSA9IGNob3NlbjtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCk7XG5cbiAgICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBzaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiwgcGFpci5kZWNrLCBwYWlyLnJlcSk7XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVNjb3JlID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG5cbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHRyYW4sXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0Lmluc2VydEEsIGJlc3QuaW5zZXJ0QiwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuXG4gICAgaWYgKGFjY2VwdEFubmVhbChzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSEsIGJlc3Quc2NvcmUsIHRlbXApKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbYmVzdC50cmFuXSA9IGJlc3Quc2NvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCICsgMSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2Vzc2lvblN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGxldCBpID0gMDtcbiAgY29uc3QgdGVtcEZsb29yID0gMztcbiAgY29uc3QgcmVoZWF0VGVtcCA9IDQ1O1xuXG4gIGZ1bmN0aW9uIHJ1bkl0ZXJhdGlvbnMoaXRlcmF0aW9uQnVkZ2V0OiBudW1iZXIsIGRlYWRsaW5lID0gSW5maW5pdHkpIHtcbiAgICBjb25zdCBlbmRJdGVyYXRpb24gPSBNYXRoLm1pbih0YXJnZXRTdGVwcywgaSArIGl0ZXJhdGlvbkJ1ZGdldCk7XG4gICAgd2hpbGUgKGkgPCBlbmRJdGVyYXRpb24pIHtcbiAgICAgIGlmICgoaSAmIDIwNDcpID09PSAwICYmIERhdGUubm93KCkgPj0gZGVhZGxpbmUpIGJyZWFrO1xuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBpIC8gdGFyZ2V0U3RlcHM7XG4gICAgICB0ZW1wID0gc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgcHJvZ3Jlc3MpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBydW5UaW1lZENodW5rKGJ1ZGdldE1zOiBudW1iZXIpIHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBidWRnZXRNcztcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXBGbG9vciwgc3RhcnRUZW1wICogTWF0aC5wb3coZW5kVGVtcCAvIHN0YXJ0VGVtcCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKSk7XG5cbiAgICAgIGNvbnN0IHIgPSByYW5kb20oKTtcbiAgICAgIGlmIChyIDwgMC40KSB0cnlBc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC41NSkgdHJ5VW5hc3NpZ25TYW1wbGVkKCk7XG4gICAgICBlbHNlIGlmIChyIDwgMC44NSkgdHJ5UmVpbnNlcnRTYW1wbGVkKCk7XG4gICAgICBlbHNlIHRyeVJlbG9jYXRlU2FtcGxlZCgpO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgd2FybXVwLmVsYXBzZWRNcyArIChEYXRlLm5vdygpIC0gc2Vzc2lvblN0YXJ0ZWRBdCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpdGVyYXRlU3RlcHMoc3RlcHMpIHtcbiAgICAgIHJ1bkl0ZXJhdGlvbnMoc3RlcHMpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gICAgaXRlcmF0ZUZvck1zKGJ1ZGdldE1zKSB7XG4gICAgICBydW5UaW1lZENodW5rKGJ1ZGdldE1zKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGdldFJlc3VsdCxcbiAgICByZWhlYXQoZmFjdG9yID0gMSkge1xuICAgICAgdGVtcCA9IE1hdGgubWF4KHRlbXAsIHJlaGVhdFRlbXAgKiBmYWN0b3IpO1xuICAgICAgLy8gUHVsbCB0aGUgc2VhcmNoIHNsaWdodGx5IGJhY2sgZnJvbSB0aGUgY29sZCBlbmQgb2YgdGhlIHNjaGVkdWxlLlxuICAgICAgaSA9IE1hdGgubWF4KDAsIGkgLSBNYXRoLmZsb29yKHRhcmdldFN0ZXBzICogMC4wOCAqIGZhY3RvcikpO1xuICAgICAgcmV0dXJuIGdldFJlc3VsdCgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2Q6IE1vZHVsZSwgb3B0aW9uczogSW1wcm92ZWRPcHRpb25zKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgY29uc3QgdGFyZ2V0U3RlcHMgPSBcInN0ZXBzXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RlcHMgOiBNYXRoLm1heCgxNTAwMDAsIE1hdGguZmxvb3Iob3B0aW9ucy5idWRnZXRNcyAqIDE5MCkpO1xuICBjb25zdCBzZXNzaW9uID0gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZCwgdGFyZ2V0U3RlcHMpO1xuICBpZiAoXCJzdGVwc1wiIGluIG9wdGlvbnMpIHJldHVybiBzZXNzaW9uLml0ZXJhdGVTdGVwcyhvcHRpb25zLnN0ZXBzKTtcbiAgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZUZvck1zKG9wdGlvbnMuYnVkZ2V0TXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wcm92ZWRBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMTUwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgc3RlcHMgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ1RpbWVkKG1vZDogTW9kdWxlLCBidWRnZXRNcyA9IDEwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgYnVkZ2V0TXMgfSk7XG59XG4iLAogICAgImltcG9ydCB7IGJ1dHRvbiwgY29sb3IsIGRpdiwgcCwgcG9wdXAsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRoLCB0ciB9IGZyb20gXCIuLi92aWV3L2h0bWxcIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuLi92aWV3L21haW5cIjtcbmltcG9ydCB7IGJhc2VsaW5lQW5uZWFsaW5nLCB0eXBlIEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHsgY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uLCBpbXByb3ZlZEFubmVhbGluZywgdHlwZSBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gfSBmcm9tIFwiLi9hbm5lYWxpbmdfaW1wcm92ZWRcIjtcbmltcG9ydCB7IGdldERlY2ssIGdldFJlcSwgaXNMb2FkIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3NoYXJlZFwiO1xuXG50eXBlIFNvbHZlciA9IChtb2Q6IE1vZHVsZSkgPT4gQW5uZWFsaW5nUmVzdWx0O1xuXG5jb25zdCBBQ1RJVkVfU09MVkVSX05BTUUgPSBcImltcHJvdmVkXCI7XG5jb25zdCBLTV9DT1NUID0gMC41O1xuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDYwO1xuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDA7XG5cbmxldCBhbm5lYWxlcjogQW5uZWFsaW5nUmVzdWx0IHwgbnVsbCA9IG51bGw7XG5sZXQgYW5uZWFsaW5nU2Vzc2lvbjogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG5sZXQgYW5uZWFsaW5nVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xubGV0IGxpdmVSZW5kZXI6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gcGxhbm5lclZpZXcobW9kOiBNb2R1bGUpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IG91dGVyQm9yZGVyID0gXCIxcHggc29saWQgXCIgKyBjb2xvci5ncmF5O1xuICBjb25zdCBpbm5lckJvcmRlciA9IFwiMXB4IHNvbGlkIFwiICsgY29sb3IubGlnaHRncmF5O1xuICBjb25zdCBjZWxsUGFkZGluZyA9IFwiLjM1ZW0gLjVlbVwiO1xuICBjb25zdCBzY2hlZHVsZUNlbGxNaW5IZWlnaHQgPSBcIjIuMWVtXCI7XG5cbiAgaWYgKGFubmVhbGluZ1Nlc3Npb24gPT0gbnVsbCkge1xuICAgIGFubmVhbGluZ1Nlc3Npb24gPSBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kLCAxXzkwMF8wMDApO1xuICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoNTAwKTtcbiAgfSBlbHNlIGlmIChhbm5lYWxlciA9PSBudWxsKSB7XG4gICAgYW5uZWFsZXIgPSBhbm5lYWxpbmdTZXNzaW9uLmdldFJlc3VsdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXRlbUJ1dHRvbihpdGVtOiBudW1iZXIsIGxvYWQ/OiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVxID0gbW9kLnJlcXVlc3RzW2l0ZW1dITtcbiAgICBjb25zdCBzcCA9IHNwYW4oXG4gICAgICBpdGVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMywgXCIgXCIpLFxuICAgICAgc3R5bGUoe1xuICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICBib3JkZXI6IFwiMnB4IHNvbGlkIHRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuMmVtXCIsXG4gICAgICAgIHdoaXRlU3BhY2U6IFwicHJlXCIsXG4gICAgICAgIGZvbnRGYW1pbHk6IFwibW9ub3NwYWNlXCIsXG4gICAgICB9KSxcbiAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9wdXAoXG4gICAgICAgICAgcChcIml0ZW0gXCIsIGl0ZW0pLFxuICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgdHIoY2VsbChcInN0YXR1c1wiKSwgY2VsbChsb2FkID8gXCJsb2FkXCIgOiBsb2FkID09PSBmYWxzZSA/IFwidW5sb2FkXCIgOiBcInVuYXNzaWduZWRcIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcInZhbHVlXCIpLCBjZWxsKHJlcS52YWx1ZV9ldXIgKyBcIuKCrFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGlzdFwiKSwgY2VsbChtb2Qucm9hZG1hcC5nZXRDb3N0TihyZXEuc3RhcnRQb2ludCwgcmVxLmVuZFBvaW50KSArIFwia21cIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcImRlYWRsaW5lXCIpLCBjZWxsKHJlcS5kZWFkbGluZV9oLnRvRml4ZWQoMikgKyBcImhcIikpLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICk7XG5cbiAgICBsZXQgcG9pbnRzID0gW1xuICAgICAgeyBudW1iZXI6IHJlcS5zdGFydFBvaW50LCBsb2dvOiBcIvCfk6ZcIiB9LFxuICAgICAgeyBudW1iZXI6IHJlcS5lbmRQb2ludCwgbG9nbzogXCLwn4+gXCIgfSxcbiAgICBdO1xuXG4gICAgaWYgKGxvYWQgPT09IHRydWUpIHBvaW50cyA9IFtwb2ludHNbMF0hXTtcbiAgICBpZiAobG9hZCA9PT0gZmFsc2UpIHBvaW50cyA9IFtwb2ludHNbMV0hXTtcblxuICAgIHNwLm9ubW91c2VlbnRlciA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gY29sb3IuZ3JlZW47XG4gICAgICBoaWdodExpZ2h0cy5zZXQoW3sgcG9pbnRzIH1dKTtcbiAgICB9O1xuICAgIHNwLm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gXCJ0cmFuc3BhcmVudFwiO1xuICAgIH07XG4gICAgcmV0dXJuIHNwO1xuICB9XG5cbiAgY29uc3QgY2VsbDogdHlwZW9mIHRkID0gKC4uLngpID0+IHRkKHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksIC4uLngpO1xuICBjb25zdCBjb250cm9scyA9IGRpdihzdHlsZSh7IGRpc3BsYXk6IFwiZmxleFwiLCBnYXA6IFwiLjVlbVwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBmbGV4V3JhcDogXCJ3cmFwXCIgfSkpO1xuICBjb25zdCBzY29yZUxpbmUgPSBwKCk7XG4gIGNvbnN0IHRpbWVMaW5lID0gcCgpO1xuICBjb25zdCBzb2x2ZXJMaW5lID0gcChcInNvbHZlcjogXCIsIEFDVElWRV9TT0xWRVJfTkFNRSk7XG4gIGNvbnN0IHVuYXNzaWduZWRMaW5lID0gcCgpO1xuICBjb25zdCBkZXRhaWxXcmFwID0gZGl2KCk7XG4gIGNvbnN0IHRhYmxlV3JhcCA9IGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBvdmVyZmxvd1g6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dZOiBcImhpZGRlblwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgIH0pLFxuICApO1xuXG4gIGNvbnN0IHJ1bkJ1dHRvbiA9IGJ1dHRvbihcInN0YXJ0XCIpO1xuICBjb25zdCBoZWF0QnV0dG9uID0gYnV0dG9uKFwiaGVhdCB1cFwiKTtcbiAgbGV0IHJlbmRlckNvdW50ZXIgPSAwO1xuXG4gIGZ1bmN0aW9uIHN0b3BTZWFyY2goKSB7XG4gICAgaWYgKGFubmVhbGluZ1RpbWVyICE9IG51bGwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoYW5uZWFsaW5nVGltZXIpO1xuICAgICAgYW5uZWFsaW5nVGltZXIgPSBudWxsO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0YXJ0XCI7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJUYWJsZSgpIHtcbiAgICBjb25zdCB0YWIgPSB0YWJsZShcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgfSksXG4gICAgICB0cihcbiAgICAgICAgdGgoXCJ0cmFuc3BvcnRlclwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJ2YWx1ZVwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJzdGVwc1wiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICksXG4gICAgICBtb2Quc3RhcnRwb3NpdGlvbnMubWFwKChzdGFydCwgdHJhbikgPT5cbiAgICAgICAgdHIoXG4gICAgICAgICAgdGQoXG4gICAgICAgICAgICB0cmFuLFxuICAgICAgICAgICAgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcG9wdXAoXG4gICAgICAgICAgICAgICAgcChcInRyYW5zcG9ydGVyOiBcIiwgdHJhbiksXG4gICAgICAgICAgICAgICAgcChcInN0YXJ0OiBcIiwgc3RhcnQpLFxuICAgICAgICAgICAgICAgIHAoXCJzY29yZTogXCIsIGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hKSxcbiAgICAgICAgICAgICAgICBwKFwic3RlcHM6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVTaXplc1t0cmFuXSEpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb25tb3VzZWVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50czogW3sgbnVtYmVyOiBzdGFydCwgbG9nbzogXCLwn5qbXCIgfV0gfV0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBvbm1vdXNlbGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW10pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHRkKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiIH0pKSxcbiAgICAgICAgICB0ZChcbiAgICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgIFswLCAxXS5tYXAoKGRlY2spID0+XG4gICAgICAgICAgICAgICAgdHIoXG4gICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHsgbGVuZ3RoOiBhbm5lYWxlciEuc2NoZWR1bGVTaXplc1t0cmFuXSEgfSwgKF8sIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IGFubmVhbGVyPy5zY2hlZHVsZVt0cmFuICogYW5uZWFsZXIuVFNJWkUgKyBpXSE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYWQgPSBpc0xvYWQoc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZChcbiAgICAgICAgICAgICAgICAgICAgICBnZXREZWNrKHN0ZXApID09PSBkZWNrID8gaXRlbUJ1dHRvbihnZXRSZXEoc3RlcCksICEhbG9hZCkgOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBsb2FkID8gY29sb3IuYmx1ZSA6IGNvbG9yLmdyZWVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBpbm5lckJvcmRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjJlbSAuM2VtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogXCIyLjZlbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzY2hlZHVsZUNlbGxNaW5IZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgIGJvcmRlcjogb3V0ZXJCb3JkZXIsXG4gICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjI1ZW1cIixcbiAgICAgICAgICAgICAgdmVydGljYWxBbGlnbjogXCJ0b3BcIixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgICksXG4gICAgICApLFxuICAgICk7XG5cbiAgICB0YWJsZVdyYXAucmVwbGFjZUNoaWxkcmVuKHRhYik7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJTdGF0dXMoKSB7XG4gICAgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gYHNjb3JlOiAke2FubmVhbGVyPy50b3RhbFNjb3JlID8/IDB9YDtcbiAgICB0aW1lTGluZS50ZXh0Q29udGVudCA9IGBzZWFyY2ggdGltZTogJHsoYW5uZWFsZXIhLmVsYXBzZWRNcy8xMDAwKS50b0ZpeGVkKDIpfSBzYDtcbiAgICB1bmFzc2lnbmVkTGluZS5yZXBsYWNlQ2hpbGRyZW4oXG4gICAgICBcInVuYXNzaWduZWQ6IFwiLFxuICAgICAgLi4uQXJyYXkuZnJvbShhbm5lYWxlciEudW5hc3NpZ25lZClcbiAgICAgICAgLm1hcCgoeCwgaSkgPT4gKHsgeCwgaSB9KSlcbiAgICAgICAgLmZpbHRlcigoeCkgPT4geC54KVxuICAgICAgICAuZmxhdE1hcCgoeCkgPT4gW3NwYW4oXCIgXCIpLCBpdGVtQnV0dG9uKHguaSldKSxcbiAgICApO1xuXG4gICAgZGV0YWlsV3JhcC5yZXBsYWNlQ2hpbGRyZW4oXG4gICAgICBkaXYoXG4gICAgICAgIHAoXCJkZXRhaWxzXCIpLFxuICAgICAgICB0YWJsZShcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRyKGNlbGwoXCJ1bmFzc2lnbmVkIHJlcXVlc3RzXCIpLCBjZWxsKEFycmF5LmZyb20oYW5uZWFsZXIhLnVuYXNzaWduZWQpLm1hcCgoeCwgaSkgPT4gKHsgeCwgaSB9KSkuZmlsdGVyKCh4KSA9PiB4LngpLmZsYXRNYXAoKHgpID0+IFtzcGFuKFwiIFwiKSwgaXRlbUJ1dHRvbih4LmkpXSkpKSxcbiAgICAgICAgICB0cihjZWxsKFwic2VhcmNoIHRpbWVcIiksIGNlbGwoYCR7YW5uZWFsZXI/LmVsYXBzZWRNcyA/PyAwfW1zYCkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJzY29yZVwiKSwgY2VsbChhbm5lYWxlcj8udG90YWxTY29yZSA/PyAwKSksXG4gICAgICAgICAgdHIoY2VsbChcInRyYW5zcG9ydGVyIGNvdW50XCIpLCBjZWxsKG1vZC5OVFJBTlMpKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVxdWVzdCBjb3VudFwiKSwgY2VsbChtb2QuTlJFUVMpKSxcbiAgICAgICAgICB0cihjZWxsKFwiY29zdCBwZXIga21cIiksIGNlbGwoYCR7S01fQ09TVH3igqxgKSksXG4gICAgICAgICAgdHIoY2VsbChcImF2ZXJhZ2Ugc3BlZWRcIiksIGNlbGwoYCR7QVZHX1NQRUVEX0tNSH1rbS9oYCkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJyZW9yZ2FuaXphdGlvbiBjb3N0XCIpLCBjZWxsKGAke1JFT1JHX0NPU1RfRVVSfeKCrGApKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcihmb3JjZVRhYmxlID0gZmFsc2UpIHtcbiAgICByZW5kZXJTdGF0dXMoKTtcbiAgICBpZiAoZm9yY2VUYWJsZSB8fCAocmVuZGVyQ291bnRlcisrICUgNCA9PT0gMCkpIHJlbmRlclRhYmxlKCk7XG4gIH1cblxuICBydW5CdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBpZiAoYW5uZWFsaW5nVGltZXIgIT0gbnVsbCkge1xuICAgICAgc3RvcFNlYXJjaCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0b3BcIjtcbiAgICBhbm5lYWxpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTIwKTtcbiAgICAgIHJlbmRlcigpO1xuICAgIH0sIDE1MCk7XG4gIH07XG5cbiAgaGVhdEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGlmICghYW5uZWFsaW5nU2Vzc2lvbikgcmV0dXJuO1xuICAgIGFubmVhbGVyID0gYW5uZWFsaW5nU2Vzc2lvbi5yZWhlYXQoKTtcbiAgICByZW5kZXIodHJ1ZSk7XG4gIH07XG5cbiAgbGl2ZVJlbmRlciA9ICgpID0+IHJlbmRlcih0cnVlKTtcbiAgcmVuZGVyKHRydWUpO1xuICBjb250cm9scy5yZXBsYWNlQ2hpbGRyZW4ocnVuQnV0dG9uLCBoZWF0QnV0dG9uKTtcblxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgICBvdmVyZmxvd1k6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dYOiBcImhpZGRlblwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgIH0pLFxuICAgIGNvbnRyb2xzLFxuICAgIHNvbHZlckxpbmUsXG4gICAgc2NvcmVMaW5lLFxuICAgIHRpbWVMaW5lLFxuICAgIHRhYmxlV3JhcCxcbiAgICBkZXRhaWxXcmFwLFxuICAgIHVuYXNzaWduZWRMaW5lLFxuICApO1xufVxuXG5leHBvcnQgY29uc3QgYXZhaWxhYmxlU29sdmVycyA9IHtcbiAgYmFzZWxpbmU6IGJhc2VsaW5lQW5uZWFsaW5nLFxuICBpbXByb3ZlZDogaW1wcm92ZWRBbm5lYWxpbmcsXG59IGFzIGNvbnN0O1xuIiwKICAgICJpbXBvcnQgeyBoYXNoIH0gZnJvbSBcIi4uL2hhc2hcIjtcbmltcG9ydCB7IGJvZHksIGJ1dHRvbiwgY29sb3IsIGRpdiwgZXJyb3Jwb3B1cCwgaDEsIGgyLCBoMywgaW5wdXQsIG1hcmdpbiwgcCwgcGFkZGluZywgcG9wdXAsIHByZSwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB3aWR0aCwgdGV4dGFyZWEsIGEsIGJvcmRlciwgaHRtbCwgdGgsIHRyLCB0ZCwgYm9yZGVyUmFkaXVzLCBwYW5lbExpc3QsIGRpc3BsYXksIGJhY2tncm91bmQgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBtYXBWaWV3IH0gZnJvbSBcIi4vbWFwVmlld1wiO1xuaW1wb3J0IHsgcmFuZG9tTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IHJhbmRvbU1vZHVsZSwgcmFuZG9tVVVJRCwgUmVxdWVzdCwgU2NoZWR1bGUsIFVVSUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IG1rU3RvcmVkLCBta1dyaXRhYmxlLCB0eXBlIFdyaXRhYmxlIH0gZnJvbSBcIi4uL3dyaXRlYWJsZVwiO1xuaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZG9tLCBzZXRSYW5kU2VlZCB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB7IG51bWJlciB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmltcG9ydCB7IHBsYW5uZXJWaWV3IH0gZnJvbSBcIi4uL3BsYW5uZXJzL2FubmVhbGluZ1wiO1xuXG5cbmV4cG9ydCBsZXQgTEtXX0NPVU5UID0gbWtTdG9yZWQoXCJMS1dfQ09VTlRcIiwgbnVtYmVyLCAgNSlcbmxldCBSRVFVRVNUX0NPVU5UID0gbWtTdG9yZWQoXCJSRVFVRVNUX0NPVU5UXCIsICBudW1iZXIsIDIwKVxuXG5ib2R5LnN0eWxlLm1hcmdpbiA9IFwiMFwiXG5cbmxldCBoZWFkZXIgPSBoMShcInJvdXRlIHBsYW5uZXJcIiwgc3R5bGUoe2JhY2tncm91bmQ6IGNvbG9yLmJsdWUsIGNvbG9yOiBjb2xvci5iYWNrZ3JvdW5kLCBtYXJnaW46IFwiMFwiLCBwYWRkaW5nOiBcIi42ZW1cIn0pKVxuXG5sZXQgY29udGVudFNwYWNlID0gZGl2KHN0eWxlKHtcbiAgZGlzcGxheTpcImZsZXhcIixcbiAgZmxleERpcmVjdGlvbjpcInJvd1wiLFxuICB3aWR0aDogXCIxMDAlXCIsXG4gIGhlaWdodDogXCJjYWxjKDEwMCUgLSAyLjVlbSlcIixcbiAgbWluV2lkdGg6IFwiMFwiLFxufSkpXG5cbmxldCBwYWdlID0gZGl2KFxuICBzdHlsZSh7ZGlzcGxheTpcImZsZXhcIiwgZmxleERpcmVjdGlvbjpcImNvbHVtblwiLCBoZWlnaHQ6IFwiMTAwJVwifSksXG4gIGhlYWRlcixcbiAgY29udGVudFNwYWNlXG4pXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKHBhZ2UpXG5cbnNldFJhbmRTZWVkKDI0KVxuXG5leHBvcnQgbGV0IG1vZHVsZSA9IHJhbmRvbU1vZHVsZSgpXG5cbmV4cG9ydCB0eXBlIEhpZ2hMaWdodCA9IHtcbiAgcG9pbnRzOiB7XG4gICAgbnVtYmVyOiBudW1iZXIsXG4gICAgbG9nbz8gOiBzdHJpbmcsXG4gIH1bXSxcbiAgY29sb3I/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGxldCBoaWdodExpZ2h0cyA9IG1rV3JpdGFibGUgPEhpZ2hMaWdodFtdPiggW10gKVxuXG5cbmZ1bmN0aW9uIHNldHRlciAoc3RvcmU6IFdyaXRhYmxlPG51bWJlcj4gKXtcbiAgbGV0IGlucCA9IGlucHV0KClcbiAgaW5wLnR5cGUgPSBcIm51bWJlclwiXG4gIGlucC5vbmNoYW5nZSA9ICgpPT57XG4gICAgbGV0IHZhbCA9IHBhcnNlSW50KGlucC52YWx1ZSlcbiAgICBpZiAoaXNOYU4odmFsKSkgcmV0dXJuXG4gICAgc3RvcmUuc2V0KHZhbClcbiAgfVxuICBzdG9yZS5vbnVwZGF0ZSh2YWw9PmlucC52YWx1ZSA9IHZhbC50b1N0cmluZygpKVxuXG4gIHJldHVybiBpbnBcbn1cblxuXG5mdW5jdGlvbiBta1dpbmRvdyAodGFiOiBudW1iZXIgPSAwICkge1xuXG4gIGxldCB0YWJGaWVsZHMgPSBbXG4gICAgWydtYXAnLCBtYXBWaWV3KG1vZHVsZSldLFxuICAgIC8vIFsncmVxdWVzdHMnLCByZXF1ZXN0Vmlldyhtb2R1bGUucmVxdWVzdHMpXSxcbiAgICAvLyBbJ3NjaGVkdWxlJywgc2NoZWR1bGVWaWV3KCkgXSxcbiAgICBbJ3BsYW5uZXInLCBwbGFubmVyVmlldyhtb2R1bGUpXSxcbiAgICAvLyBbJ3NldHRpbmdzJywgZGl2KFxuICAgIC8vICAgc3R5bGUoe1xuICAgIC8vICAgICBwYWRkaW5nOiBcIjFlbVwiLFxuICAgIC8vICAgfSksXG4gICAgLy8gICBoMihcInNldHRpbmdzXCIpLFxuXG5cbiAgICAvLyAgIHRhYmxlKFxuICAgIC8vICAgICB0cihcbiAgICAvLyAgICAgICB0ZChcIkxLVyBjb3VudFwiKSxcbiAgICAvLyAgICAgICB0ZChzZXR0ZXIoTEtXX0NPVU5UKSlcbiAgICAvLyAgICAgKSxcbiAgICAvLyAgICAgdHIoXG4gICAgLy8gICAgICAgdGQoXCJSZXF1ZXN0IGNvdW50XCIpLFxuICAgIC8vICAgICAgIHRkKHNldHRlcihSRVFVRVNUX0NPVU5UKSlcbiAgICAvLyAgICAgKSxcbiAgICAvLyAgICAgdHIoYnV0dG9uKFwiZ2VuZXJhdGVcIiwgKCk9PntcbiAgICAvLyAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKClcbiAgICAvLyAgICAgfSkpXG4gICAgLy8gICApXG5cbiAgICAvLyApXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gIH0pKVxuXG4gIGZ1bmN0aW9uIG9wZW5UYWIodGFiOiB0eXBlb2YgdGFiRmllbGRzW251bWJlcl1bMF0pIHtcbiAgICBjb25zdCB0YWJzID0gcChcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgbWFyZ2luOiBcIjBcIixcbiAgICAgICAgcGFkZGluZzogXCIuNGVtXCIsXG4gICAgICAgIGZsZXg6IFwiMCAwIGF1dG9cIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLm1hcCgoW24sZV0pPT5cbiAgICAgICAgc3BhbiggbixcbiAgICAgICAgICAoKT0+b3BlblRhYihuKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIuM2VtXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIisgKG49PXRhYiA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSksXG4gICAgICAgICAgICBjb2xvcjogKG49PXRhYikgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBkaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGZsZXg6IFwiMSAxIGF1dG9cIixcbiAgICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMuZmluZCgoW24sXSk9Pm49PXRhYikhWzFdXG4gICAgKVxuXG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgdGFicyxcbiAgICAgIGNvbnRlbnRcbiAgICApXG4gIH1cblxuXG4gIG9wZW5UYWIodGFiRmllbGRzW3RhYl0hWzBdKVxuXG4gIHJldHVybiBlbFxufVxuXG5jb250ZW50U3BhY2UucmVwbGFjZUNoaWxkcmVuKG1rV2luZG93KDEgKSwgbWtXaW5kb3coKSlcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFFTyxJQUFNLE9BQU8sU0FBUztBQUU3QixJQUFNLGVBQWU7QUFBQSxFQUNuQixP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QUFBQSxJQUNqRCxNQUFNLE9BQU8sRUFDWCxNQUFNO0FBQUEsTUFDSixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsTUFDVCxNQUFNO0FBQUEsSUFDUixDQUFDLEdBQ0QsVUFBVSxJQUFJLEVBQUUsR0FBRSxPQUNoQixLQUFNLEdBQ0osTUFBSSxRQUFRLENBQUMsR0FDYixNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixRQUFRLGdCQUFlLEtBQUcsT0FBTSxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ3BELE9BQVEsS0FBRyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQUEsSUFDeEMsQ0FBQyxDQUNILENBQ0YsQ0FDRjtBQUFBLElBRUEsTUFBTSxVQUFVLElBQ2QsTUFBTTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sV0FBVztBQUFBLE1BQ1gsVUFBVTtBQUFBLElBQ1osQ0FBQyxHQUNELFVBQVUsS0FBSyxFQUFFLE9BQU0sS0FBRyxJQUFHLEVBQUcsRUFDbEM7QUFBQSxJQUVBLEdBQUcsZ0JBQ0QsTUFDQSxPQUNGO0FBQUE7QUFBQSxFQUlGLFFBQVEsVUFBVSxLQUFNLEVBQUU7QUFBQSxFQUUxQixPQUFPO0FBQUE7QUFHVCxhQUFhLGdCQUFnQixTQUFTLENBQUUsR0FBRyxTQUFTLENBQUM7IiwKICAiZGVidWdJZCI6ICJFRjFBNDY2MDdERjk1NEU3NjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
