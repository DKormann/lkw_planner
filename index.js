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
var KM_COST_CENTS = 50;
var AVG_SPEED_KMH = 60;
var REORG_COST_CENTS = 1e4;
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
    reqDeadlines: new Uint32Array(requests.map((r) => Math.floor(r.deadline_h * 60))),
    reqValues: new Uint32Array(requests.map((r) => Math.round(r.value_eur * 100))),
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
  let cost = 0;
  let elapsedMinutes = 0;
  const decks = [[], []];
  let pos = state.tranStart[tran];
  const offset = routeOffset(state, tran);
  for (let i = 0;i < state.scheduleSizes[tran]; i++) {
    const step = state.schedule[offset + i];
    const load = isLoad(step);
    const req = getReq(step);
    const nextPos = getPos(step);
    const distance = state.mod.roadmap.getCostN(pos, nextPos);
    cost += distance * KM_COST_CENTS;
    elapsedMinutes += distance * 60 / AVG_SPEED_KMH;
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
      cost += (deck.length - idx - 1) * REORG_COST_CENTS;
      deck.splice(idx, 1);
      if (elapsedMinutes <= state.reqDeadlines[req])
        reward += state.reqValues[req];
    }
  }
  return reward - cost;
}
function bootstrapEmptyRoutes(state, maxLoss = 12000) {
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
  let startTemp = 5000;
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
  let startTemp = 6000;
  let endTemp = 25;
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
  const tempFloor = 150;
  const reheatTemp = 2250;
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
var isStmt = (x) => !!x && typeof x === "object" && ("kind" in x) && (x.kind === "if" ? Array.isArray(x.then) : !["const", "local.get", "global.get", "bin", "call", "cast", "load", "cmp"].includes(x.kind));
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
function f32(value) {
  return number2("f32", value);
}
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
var expImpl = func(["f32"], "f32", (x) => {
  const y = local("f32");
  return [
    y.set(ifElse(x.lt(-16), f32(-16), ifElse(x.gt(16), f32(16), x)).div(2048).add(1)),
    ...Array.from({ length: 11 }, () => y.imul(y)),
    ret(y)
  ];
});
var exp = (value) => expImpl.call(value);
var global = (type, initial) => {
  let value;
  value = mutable({ kind: "global.get", type, initial }, (input) => ({ kind: "global.set", global: value, value: input }));
  return value;
};
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
    case "global.get":
      fns.global?.(node);
      return;
    case "global.set":
      fns.global?.(node.global);
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
  const functions = new Set, arrays = new Set, globals = new Set, traps = new Set, logs = new Set;
  walk(built, {
    local: (id, type) => found.set(id, type),
    func: (f) => functions.add(f),
    array: (a2) => arrays.add(a2),
    global: (value) => globals.add(value),
    trap: (message) => traps.add(message),
    log: (message) => logs.add(message)
  });
  paramIds.forEach((id) => found.delete(id));
  const locals = [...found.entries()];
  const localIndexes = Object.fromEntries([
    ...paramIds.map((id, i) => [id, i]),
    ...locals.map(([id], i) => [id, func2.params.length + i])
  ]);
  return { func: func2, built, locals, localIndexes, functions: [...functions], arrays: [...arrays], globals: [...globals], traps: [...traps], logs: [...logs] };
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
var analyzeModule = (mod) => {
  const entries = Object.entries(mod);
  const funcs = Object.fromEntries(entries.filter(([, v]) => v.kind === "func"));
  const arrays = Object.fromEntries(entries.filter(([, v]) => v.kind === "array"));
  const fEntries = Object.entries(funcs);
  const builtFuncs = buildReferencedFunctions(fEntries.map(([, func2]) => func2));
  const fix = new Map(builtFuncs.map(({ func: func2 }, i) => [func2, i]));
  const allArrays = [...new Set([...builtFuncs.flatMap((func2) => func2.arrays), ...Object.values(arrays)])];
  const allGlobals = [...new Set([...builtFuncs.flatMap((func2) => func2.globals), ...entries.filter(([, v]) => v.kind === "global.get").map(([, v]) => v)])];
  const globals = new Map(allGlobals.map((value, i) => [value, i]));
  const { layouts, bytes } = arrayLayouts(allArrays);
  const trapMessages = [...new Set(builtFuncs.flatMap((func2) => func2.traps))];
  const logMessages = [...new Set(builtFuncs.flatMap((func2) => func2.logs))];
  return { funcs, arrays, fEntries, builtFuncs, fix, layouts, globals, trapMessages, logMessages, pages: Math.max(1, Math.ceil(bytes / 65536)) };
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
var globalInit = (value) => value.type === "i32" ? [65, ...sN(value.initial, 32)] : value.type === "i64" ? [66, ...sN(value.initial, 64)] : value.type === "f32" ? [67, ...fN(value.initial, 4)] : [68, ...fN(value.initial, 8)];
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
var makeCompiler = (fix, lix, arrays, traps, logs, globals) => {
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
      case "global.get":
        return [35, ...u32(globals.get(e))];
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
        if (to === "i32" && from === "f32")
          opcode2 = 168;
        if (to === "i32" && from === "f64")
          opcode2 = 170;
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
      case "global.set":
        return [...compileExpr(s.value), 36, ...u32(globals.get(s.global))];
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
var emitModule = ({ fEntries, builtFuncs, fix, layouts, globals, trapMessages, logMessages, pages }) => {
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
    ...globals.size ? section(6, [...u32(globals.size), ...[...globals].flatMap(([value]) => [codes.type[value.type], 1, ...globalInit(value), 11])]) : [],
    ...section(7, [...u32(fEntries.length), ...exportSection]),
    ...section(10, [
      ...u32(builtFuncs.length),
      ...flatMap(builtFuncs, ({ func: func2, built, locals, localIndexes }) => {
        const compiler = makeCompiler(fix, localIndexes, layouts, traps, logs, globals);
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
var compile = async (mod) => {
  const analysis = analyzeModule(mod);
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
var SEARCH_STEPS = 1600000;
var TEMP_PHASES = 1000;
var STEPS_PER_PHASE = Math.floor(SEARCH_STEPS / TEMP_PHASES);
var START_TEMP_CENTS = 5000;
var END_TEMP_CENTS = 0;
var DEBUG = false;
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
  return [i.set(0), loop(i.lt(n), [body2(i), i.iadd(1)])];
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
  const randState = global("i32", 1);
  const dists = checkedArray("i32", planner.RSIZE);
  const requests = checkedArray(REQ, planner.NREQS);
  const assigned = checkedArray("u8", planner.NREQS);
  const schedule = checkedArray(STOP, planner.NTRANS * TSIZE);
  const sched_size = checkedArray("i16", planner.NTRANS);
  const ratings = checkedArray("i32", planner.NTRANS);
  const tran_positions = checkedArray("i16", planner.NTRANS);
  const randNext = func([], "i32", () => {
    return [
      randState.set(randState.xor(randState.shl(13))),
      randState.set(randState.xor(randState.shr(17))),
      randState.set(randState.xor(randState.shl(5))),
      ret(randState)
    ];
  });
  const randint = func(["i32"], "i32", (max) => i32(i64u(randNext.call()).mul(i64u(max)).shr(32n)));
  const acceptAnneal2 = func(["i32", "i32", "i32"], "i32", (previous, next, temperature) => [
    ifElse(previous.gt(next), ret(randint.call(1e6).lt(i32(exp(f32(next.sub(previous)).div(f32(temperature))).mul(1e6)))), ret(1))
  ]);
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
  const tryAssign = func(["i32"], "void", (temperature) => {
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
      tran.set(randint.call(planner.NTRANS)),
      req_id.set(randint.call(planner.NREQS)),
      ifElse(assigned.at(req_id).eq(1), ret()),
      toffset.set(tran.mul(TSIZE)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.gt(TSIZE - 2), ret()),
      previousScore.set(ratings.at(tran)),
      A.set(randint.call(tsize.add(1))),
      B.set(A.add(randint.call(4))),
      ifElse(B.gt(tsize), B.set(tsize)),
      schedView.move(B.add(2), B, tsize.sub(B)),
      schedView.move(A.add(1), A, B.sub(A)),
      tmp.set(randint.call(2)),
      schedView.at(A).set({ req_id, is_load: 1, deck: tmp }),
      schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp }),
      sched_size.at(tran).set(tsize.add(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), [assigned.at(req_id).set(1), ratings.at(tran).set(nextScore)], [
        schedView.move(A, A.add(1), B.sub(A)),
        schedView.move(B, B.add(2), tsize.sub(B)),
        sched_size.at(tran).set(tsize)
      ])
    ];
  });
  const rateTran = func(["i32"], "i32", (tran) => {
    const reward = local("i32"), cost = local("i32"), elapsedMinutes = local("i32"), distance = local("i32"), pos = local("i32");
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
        distance.set(roadCost.call(pos, nextPos)),
        cost.iadd(distance.mul(KM_COST_CENTS)),
        elapsedMinutes.iadd(distance.mul(60).div(AVG_SPEED_KMH)),
        pos.set(nextPos),
        deck.set(ifElse(step.deck, deck1, deck0)),
        deckSize.set(ifElse(step.deck, deckSize1, deckSize0)),
        ifElse(step.is_load, [
          ifElse(deckSize.gt(2), ret(-INF)),
          deck.set(deck.or(req.shl(deckSize.mul(10)))),
          deckSize.iadd(1)
        ], [
          found.set(-1),
          ifElse(deckSize.gt(0).and(deck.and(1023).eq(req)), found.set(0)),
          ifElse(found.eq(-1).and(deckSize.gt(1)).and(deck.shr(10).and(1023).eq(req)), found.set(1)),
          ifElse(found.eq(-1).and(deckSize.gt(2)).and(deck.shr(20).and(1023).eq(req)), found.set(2)),
          ifElse(found.eq(-1), ret(-INF)),
          cost.iadd(deckSize.sub(found).sub(1).mul(REORG_COST_CENTS)),
          shift.set(found.mul(10)),
          lowerMask.set(i32(1).shl(shift).sub(1)),
          deck.set(deck.and(lowerMask).or(deck.shr(shift.add(10)).shl(shift))),
          deckSize.isub(1),
          ifElse(elapsedMinutes.gt(request.deadline), [], reward.iadd(request.value))
        ]),
        ifElse(step.deck, [deck1.set(deck), deckSize1.set(deckSize)], [deck0.set(deck), deckSize0.set(deckSize)]),
        i.iadd(1)
      ]),
      ret(reward.sub(cost))
    ];
  });
  const tryUnassign = func(["i32"], "void", (temperature) => {
    const tran = local("i32"), req = local("i32"), deck = local("i32");
    const A = local("i32"), B = local("i32"), i = local("i32");
    const tsize = local("i32"), toffset = local("i32");
    const previousScore = local("i32"), nextScore = local("i32");
    const step = local(STOP);
    const schedView = {
      move: (target, source, count) => schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index) => schedule.at(toffset.add(index))
    };
    return [
      tran.set(randint.call(planner.NTRANS)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.lt(2), ret()),
      toffset.set(tran.mul(TSIZE)),
      step.set(schedView.at(randint.call(tsize))),
      req.set(step.req_id),
      deck.set(step.deck),
      A.set(-1),
      B.set(-1),
      loop(i.lt(tsize), [
        step.set(schedView.at(i)),
        ifElse(step.req_id.eq(req), ifElse(A.eq(-1), A.set(i), B.set(i))),
        i.iadd(1)
      ]),
      ifElse(A.eq(-1).or(B.eq(-1)), ret()),
      previousScore.set(ratings.at(tran)),
      schedView.move(A, A.add(1), B.sub(A).sub(1)),
      schedView.move(B.sub(1), B.add(1), tsize.sub(B).sub(1)),
      sched_size.at(tran).set(tsize.sub(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), [assigned.at(req).set(0), ratings.at(tran).set(nextScore)], [
        schedView.move(B.add(1), B.sub(1), tsize.sub(B).sub(1)),
        schedView.move(A.add(1), A, B.sub(A).sub(1)),
        schedView.at(A).set({ req_id: req, is_load: 1, deck }),
        schedView.at(B).set({ req_id: req, is_load: 0, deck }),
        sched_size.at(tran).set(tsize)
      ])
    ];
  });
  const addRequest = func(["i32", "i32", "i32", "i32", "i32"], "void", (reqn, start, end, value, deadline) => requests.at(reqn).set({ start, end, value, deadline }));
  const bootstrap = func([], "void", () => {
    const tran = local("i32"), req = local("i32"), bestReq = local("i32");
    const offset = local("i32"), score = local("i32"), bestScore = local("i32");
    return forN(planner.NTRANS, (t) => [
      tran.set(t),
      offset.set(tran.mul(TSIZE)),
      bestReq.set(-1),
      bestScore.set(-INF),
      forN(planner.NREQS, (r) => [
        req.set(r),
        ifElse(assigned.at(req).eq(0), [
          schedule.at(offset).set({ req_id: req, is_load: 1, deck: 0 }),
          schedule.at(offset.add(1)).set({ req_id: req, is_load: 0, deck: 0 }),
          sched_size.at(tran).set(2),
          score.set(rateTran.call(tran)),
          ifElse(score.gt(bestScore), [bestScore.set(score), bestReq.set(req)]),
          sched_size.at(tran).set(0)
        ])
      ]),
      ifElse(bestReq.gt(-1).and(bestScore.gt(-12001)), [
        schedule.at(offset).set({ req_id: bestReq, is_load: 1, deck: 0 }),
        schedule.at(offset.add(1)).set({ req_id: bestReq, is_load: 0, deck: 0 }),
        sched_size.at(tran).set(2),
        assigned.at(bestReq).set(1),
        ratings.at(tran).set(bestScore)
      ])
    ]);
  });
  const search = func([], "void", () => {
    const temperature = local("i32");
    return [
      debug("debugger on.", 0),
      forN(TEMP_PHASES, (phase) => [
        temperature.set(i32(START_TEMP_CENTS).sub(phase.mul(START_TEMP_CENTS - END_TEMP_CENTS).div(TEMP_PHASES - 1))),
        forN(STEPS_PER_PHASE, () => [tryUnassign.call(temperature), tryAssign.call(temperature)])
      ])
    ];
  });
  const getStop = func(["i32", "i32"], STOP, (tran, index) => schedule.at(tran.mul(TSIZE).add(index)));
  const wasm = await compile({
    addRequest,
    assigned,
    bootstrap,
    dists,
    getStop,
    rateTran,
    ratings,
    schedule,
    search,
    sched_size,
    tran_positions
  });
  wasm.dists.set(planner.roadmap.CostMatrix);
  wasm.tran_positions.set(planner.startpositions);
  planner.requests.forEach((request, i) => wasm.addRequest(i, request.startPoint, request.endPoint, Math.round(request.value_eur * 100), Math.floor(request.deadline_h * 60)));
  wasm.bootstrap();
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
  const scheduleRatings = new Int32Array(wasm.ratings);
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
var euros = (cents) => `${(cents / 100).toFixed(2)}€`;

class ScoreMismatchError extends Error {
}
function canonicalSchedule(mod, result) {
  const schedule = new Uint32Array(result.schedule);
  for (let tran = 0;tran < mod.NTRANS; tran++) {
    const size = result.scheduleSizes[tran];
    if (size < 0 || size > result.TSIZE)
      throw new ScoreMismatchError(`Transporter ${tran} has invalid schedule size ${size}`);
    for (let i = 0;i < size; i++) {
      const at = tran * result.TSIZE + i;
      const step = schedule[at];
      if (step === undefined)
        throw new ScoreMismatchError(`Transporter ${tran} schedule is truncated at ${i}`);
      const req = getReq(step), request = mod.requests[req];
      if (!request)
        throw new ScoreMismatchError(`Transporter ${tran} references unknown request ${req}`);
      const pos = isLoad(step) ? request.startPoint : request.endPoint;
      schedule[at] = step & 65535 | pos << 16;
    }
  }
  return schedule;
}
function checkedResult(mod, result) {
  if (result.scheduleSizes.length !== mod.NTRANS || result.scheduleRatings.length !== mod.NTRANS)
    throw new ScoreMismatchError("Solver returned incorrectly sized transporter arrays");
  const schedule = canonicalSchedule(mod, result);
  const state = initAnnealingState(mod);
  Object.assign(state, {
    TSIZE: result.TSIZE,
    schedule,
    scheduleSizes: result.scheduleSizes,
    scheduleRatings: result.scheduleRatings,
    tranStart: result.tranStart,
    unassigned: result.unassigned
  });
  let total = 0;
  for (let tran = 0;tran < mod.NTRANS; tran++) {
    const expected = scoreRoute(state, tran), reported = result.scheduleRatings[tran];
    if (reported !== expected)
      throw new ScoreMismatchError(`Transporter ${tran} score mismatch: reported ${reported}, JS ${expected}`);
    total += expected;
  }
  if (result.totalScore !== total)
    throw new ScoreMismatchError(`Total score mismatch: reported ${result.totalScore}, JS ${total}`);
  return result;
}
async function plannerView(mod) {
  const outerBorder = "1px solid " + color.gray;
  const innerBorder = "1px solid " + color.lightgray;
  const cellPadding = ".35em .5em";
  const scheduleCellMinHeight = "2.1em";
  let annealer = null;
  let annealingSession = null;
  let annealingTimer = null;
  let runId = 0;
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
    }), tr(th("transporter", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("value", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("steps", style({ border: outerBorder, padding: cellPadding, textAlign: "left" }))), mod.startpositions.map((start, tran) => tr(td(tran, style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), function() {
      popup(p("transporter: ", tran), p("start: ", start), p("score: ", euros(annealer?.scheduleRatings[tran] ?? 0)), p("steps: ", annealer?.scheduleSizes[tran]));
    }, {
      onmouseenter: () => {
        hightLights.set([{ points: [{ number: start, logo: "\uD83D\uDE9B" }] }]);
      },
      onmouseleave: () => {
        hightLights.set([]);
      }
    }), td(euros(annealer?.scheduleRatings[tran] ?? 0), style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })), td(table(style({
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
    scoreLine.textContent = `score: ${euros(annealer.totalScore)}`;
    timeLine.textContent = `search time: ${(annealer.elapsedMs / 1000).toFixed(2)} s`;
    detailWrap.replaceChildren(div(p("details"), table(style({
      borderCollapse: "collapse"
    }), tr(cell("unassigned requests"), cell(Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]))), tr(cell("search time"), cell(`${annealer?.elapsedMs ?? 0}ms`)), tr(cell("score"), cell(euros(annealer.totalScore))), tr(cell("transporter count"), cell(mod.NTRANS)), tr(cell("request count"), cell(mod.NREQS)), tr(cell("cost per km"), cell(euros(KM_COST_CENTS))), tr(cell("average speed"), cell(`${AVG_SPEED_KMH}km/h`)), tr(cell("reorganization cost"), cell(euros(REORG_COST_CENTS))))));
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
    let result = null;
    try {
      if (name === "improved") {
        annealingSession = createImprovedAnnealingSession(mod, 1900000);
        result = annealingSession.iterateForMs(10);
      } else {
        result = await availableSolvers[name](mod);
      }
      annealer = checkedResult(mod, result);
      if (id === runId) {
        render(true);
      }
    } catch (error) {
      if (error instanceof ScoreMismatchError)
        throw error;
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
      annealer = checkedResult(mod, annealingSession.iterateForMs(120));
      render();
    }, 150);
  };
  heatButton.onclick = () => {
    if (!annealingSession)
      return;
    annealer = checkedResult(mod, annealingSession.reheat());
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

//# debugId=1BABC800FCFA14C864756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc20vYXN0LnRzIiwgInNyYy93YXNtL2FuYWx5emUudHMiLCAic3JjL3dhc20vY29kZWdlbi50cyIsICJzcmMvd2FzbS9pbmRleC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvdmlldy93YXNtdmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5leHBvcnQgY29uc3QgS01fQ09TVF9DRU5UUyA9IDUwO1xuZXhwb3J0IGNvbnN0IEFWR19TUEVFRF9LTUggPSA2MDtcbmV4cG9ydCBjb25zdCBSRU9SR19DT1NUX0NFTlRTID0gMTBfMDAwO1xuZXhwb3J0IGNvbnN0IElORiA9IDEgPDwgMzA7XG5cbmV4cG9ydCB0eXBlIFBhaXJJbmZvID0ge1xuICByZXE6IG51bWJlcjtcbiAgZmlyc3Q6IG51bWJlcjtcbiAgc2Vjb25kOiBudW1iZXI7XG4gIGRlY2s6IDAgfCAxO1xufTtcblxuZXhwb3J0IHR5cGUgQW5uZWFsaW5nU3RhdGUgPSB7XG4gIG1vZDogTW9kdWxlO1xuICBOUkVRUzogbnVtYmVyO1xuICBOVFJBTlM6IG51bWJlcjtcbiAgVFNJWkU6IG51bWJlcjtcbiAgcmVxUGlja3VwTG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVsaXZlcnlMb2NhdGlvbnM6IFVpbnQxNkFycmF5O1xuICByZXFEZWFkbGluZXM6IFVpbnQzMkFycmF5O1xuICByZXFWYWx1ZXM6IFVpbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIHRyYW5TdGFydDogVWludDE2QXJyYXk7XG4gIHNjaGVkdWxlOiBVaW50MzJBcnJheTtcbiAgc2NoZWR1bGVTaXplczogVWludDE2QXJyYXk7XG4gIHNjaGVkdWxlUmF0aW5nczogSW50MzJBcnJheTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xvYWQoeDogbnVtYmVyKSB7XG4gIHJldHVybiB4ICYgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlY2soeDogbnVtYmVyKSB7XG4gIHJldHVybiAoKHggJiAyKSA+PiAxKSBhcyAwIHwgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlcSh4OiBudW1iZXIpIHtcbiAgcmV0dXJuICh4ICYgMHhmZmZmKSA+PiAyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9zKHg6IG51bWJlcikge1xuICByZXR1cm4geCA+PiAxNjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRBbm5lYWxpbmdTdGF0ZShtb2Q6IE1vZHVsZSwgc2VlZD86IEFubmVhbGluZ1Jlc3VsdCk6IEFubmVhbGluZ1N0YXRlIHtcbiAgY29uc3QgeyBOUkVRUywgcmVxdWVzdHMsIHN0YXJ0cG9zaXRpb25zLCBOVFJBTlMgfSA9IG1vZDtcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKE5SRVFTICogMi41ICsgMTApO1xuXG4gIHJldHVybiB7XG4gICAgbW9kLFxuICAgIE5SRVFTLFxuICAgIE5UUkFOUyxcbiAgICBUU0laRSxcbiAgICByZXFQaWNrdXBMb2NhdGlvbnM6IG5ldyBVaW50MTZBcnJheShyZXF1ZXN0cy5tYXAoKHIpID0+IHIuc3RhcnRQb2ludCkpLFxuICAgIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLmVuZFBvaW50KSksXG4gICAgcmVxRGVhZGxpbmVzOiBuZXcgVWludDMyQXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiBNYXRoLmZsb29yKHIuZGVhZGxpbmVfaCAqIDYwKSkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gTWF0aC5yb3VuZChyLnZhbHVlX2V1ciAqIDEwMCkpKSxcbiAgICB1bmFzc2lnbmVkOiBzZWVkID8gbmV3IEludDhBcnJheShzZWVkLnVuYXNzaWduZWQpIDogbmV3IEludDhBcnJheShyZXF1ZXN0cy5tYXAoKCkgPT4gMSkpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHN0YXJ0cG9zaXRpb25zKSxcbiAgICBzY2hlZHVsZTogc2VlZCA/IG5ldyBVaW50MzJBcnJheShzZWVkLnNjaGVkdWxlKSA6IG5ldyBVaW50MzJBcnJheShUU0laRSAqIE5UUkFOUyksXG4gICAgc2NoZWR1bGVTaXplczogc2VlZCA/IG5ldyBVaW50MTZBcnJheShzZWVkLnNjaGVkdWxlU2l6ZXMpIDogbmV3IFVpbnQxNkFycmF5KE5UUkFOUyksXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzZWVkID8gbmV3IEludDMyQXJyYXkoc2VlZC5zY2hlZHVsZVJhdGluZ3MpIDogbmV3IEludDMyQXJyYXkoTlRSQU5TKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlT2Zmc2V0KHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyKSB7XG4gIHJldHVybiB0cmFuICogc3RhdGUuVFNJWkU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRSZXEoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIGlkeDogbnVtYmVyLCBpc0xvYWRCaXQ6IDEgfCAwLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIsIHBvczogbnVtYmVyKSB7XG4gIHN0YXRlLnNjaGVkdWxlW3JvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKSArIGlkeF0gPSAoaXNMb2FkQml0IDw8IDApIHwgKGRlY2sgPDwgMSkgfCAocmVxIDw8IDIpIHwgKHBvcyA8PCAxNik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzY29yZVJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyKSB7XG4gIGxldCByZXdhcmQgPSAwO1xuICBsZXQgY29zdCA9IDA7XG4gIGxldCBlbGFwc2VkTWludXRlcyA9IDA7XG4gIGNvbnN0IGRlY2tzOiBbbnVtYmVyW10sIG51bWJlcltdXSA9IFtbXSwgW11dO1xuICBsZXQgcG9zID0gc3RhdGUudHJhblN0YXJ0W3RyYW5dITtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7IGkrKykge1xuICAgIGNvbnN0IHN0ZXAgPSBzdGF0ZS5zY2hlZHVsZVtvZmZzZXQgKyBpXSE7XG4gICAgY29uc3QgbG9hZCA9IGlzTG9hZChzdGVwKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RlcCk7XG4gICAgY29uc3QgbmV4dFBvcyA9IGdldFBvcyhzdGVwKTtcbiAgICBjb25zdCBkaXN0YW5jZSA9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgY29zdCArPSBkaXN0YW5jZSAqIEtNX0NPU1RfQ0VOVFM7XG4gICAgZWxhcHNlZE1pbnV0ZXMgKz0gZGlzdGFuY2UgKiA2MCAvIEFWR19TUEVFRF9LTUg7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgY29zdCArPSAoZGVjay5sZW5ndGggLSBpZHggLSAxKSAqIFJFT1JHX0NPU1RfQ0VOVFM7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGVsYXBzZWRNaW51dGVzIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gY29zdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hBbGxSYXRpbmdzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSkge1xuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHN0YXRlLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgc3RhdGUuc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJvb3RzdHJhcEVtcHR5Um91dGVzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4TG9zcyA9IDEyXzAwMCkge1xuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHN0YXRlLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgaWYgKHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gIT09IDApIGNvbnRpbnVlO1xuXG4gICAgbGV0IGJlc3RSZXEgPSAtMTtcbiAgICBsZXQgYmVzdFNjb3JlID0gLUlORjtcblxuICAgIGZvciAobGV0IHJlcSA9IDA7IHJlcSA8IHN0YXRlLk5SRVFTOyByZXErKykge1xuICAgICAgaWYgKCFzdGF0ZS51bmFzc2lnbmVkW3JlcV0pIGNvbnRpbnVlO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIHJlcSk7XG4gICAgICBjb25zdCBzY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIDAsIDEpO1xuICAgICAgaWYgKHNjb3JlID4gYmVzdFNjb3JlKSB7XG4gICAgICAgIGJlc3RTY29yZSA9IHNjb3JlO1xuICAgICAgICBiZXN0UmVxID0gcmVxO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChiZXN0UmVxID09PSAtMSB8fCBiZXN0U2NvcmUgPCAtbWF4TG9zcykgY29udGludWU7XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgMCwgMCwgMCwgYmVzdFJlcSk7XG4gICAgc3RhdGUuc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gYmVzdFNjb3JlO1xuICAgIHN0YXRlLnVuYXNzaWduZWRbYmVzdFJlcV0gPSAwO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIsIGRlY2s6IDAgfCAxLCByZXE6IG51bWJlcikge1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG4gIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSA9IHNpemUgKyAyO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCArIDIsIG9mZnNldCArIGVuZCwgb2Zmc2V0ICsgc2l6ZSk7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgZW5kICsgMSk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgc3RhcnQsIDEsIGRlY2ssIHJlcSwgc3RhdGUucmVxUGlja3VwTG9jYXRpb25zW3JlcV0hKTtcbiAgc2V0UmVxKHN0YXRlLCB0cmFuLCBlbmQgKyAxLCAwLCBkZWNrLCByZXEsIHN0YXRlLnJlcURlbGl2ZXJ5TG9jYXRpb25zW3JlcV0hKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVN0b3BzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG4gIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSA9IHNpemUgLSAyO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0LCBvZmZzZXQgKyBzdGFydCArIDEsIG9mZnNldCArIGVuZCk7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kIC0gMSwgb2Zmc2V0ICsgZW5kICsgMSwgb2Zmc2V0ICsgc2l6ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUGFpckluUm91dGUoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHJlcTogbnVtYmVyKTogUGFpckluZm8gfCBudWxsIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIGxldCBmaXJzdCA9IC0xO1xuICBsZXQgc2Vjb25kID0gLTE7XG4gIGxldCBkZWNrOiAwIHwgMSA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICBjb25zdCBzdGVwID0gc3RhdGUuc2NoZWR1bGVbb2Zmc2V0ICsgaV0hO1xuICAgIGlmIChnZXRSZXEoc3RlcCkgIT09IHJlcSkgY29udGludWU7XG4gICAgaWYgKGZpcnN0ID09PSAtMSkge1xuICAgICAgZmlyc3QgPSBpO1xuICAgICAgZGVjayA9IGdldERlY2soc3RlcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlY29uZCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoZmlyc3QgPT09IC0xIHx8IHNlY29uZCA9PT0gLTEpIHJldHVybiBudWxsO1xuICByZXR1cm4geyByZXEsIGZpcnN0LCBzZWNvbmQsIGRlY2sgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBtYXhBdHRlbXB0cyA9IDI0KTogbnVtYmVyIHwgbnVsbCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgc3RhdGUuTlJFUVMpO1xuICAgIGlmIChzdGF0ZS51bmFzc2lnbmVkW3JlcV0pIHJldHVybiByZXE7XG4gIH1cblxuICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBtYXhBdHRlbXB0cyA9IDI0KTogeyB0cmFuOiBudW1iZXI7IHBhaXI6IFBhaXJJbmZvIH0gfCBudWxsIHtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCBtYXhBdHRlbXB0czsgYXR0ZW1wdCsrKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgc3RhdGUuTlRSQU5TKTtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCBpZHggPSByYW5kSW50KDAsIHNpemUpO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdISk7XG4gICAgY29uc3QgcGFpciA9IGZpbmRQYWlySW5Sb3V0ZShzdGF0ZSwgdHJhbiwgcmVxKTtcbiAgICBpZiAocGFpcikgcmV0dXJuIHsgdHJhbiwgcGFpciB9O1xuICB9XG5cbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2l6ZSA8IDIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbildISk7XG4gICAgY29uc3QgcGFpciA9IGZpbmRQYWlySW5Sb3V0ZShzdGF0ZSwgdHJhbiwgcmVxKTtcbiAgICBpZiAocGFpcikgcmV0dXJuIHsgdHJhbiwgcGFpciB9O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhY2NlcHRBbm5lYWwocHJldlNjb3JlOiBudW1iZXIsIG5leHRTY29yZTogbnVtYmVyLCB0ZW1wOiBudW1iZXIpIHtcbiAgaWYgKG5leHRTY29yZSA+PSBwcmV2U2NvcmUpIHJldHVybiB0cnVlO1xuICBjb25zdCBkZWx0YSA9IHByZXZTY29yZSAtIG5leHRTY29yZTtcbiAgcmV0dXJuIHJhbmRvbSgpIDwgTWF0aC5leHAoLWRlbHRhIC8gTWF0aC5tYXgodGVtcCwgMC4wMDEpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgZWxhcHNlZE1zOiBudW1iZXIpOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4ge1xuICAgIHNjaGVkdWxlOiBzdGF0ZS5zY2hlZHVsZSxcbiAgICBzY2hlZHVsZVNpemVzOiBzdGF0ZS5zY2hlZHVsZVNpemVzLFxuICAgIHRyYW5TdGFydDogc3RhdGUudHJhblN0YXJ0LFxuICAgIFRTSVpFOiBzdGF0ZS5UU0laRSxcbiAgICBzY2hlZHVsZVJhdGluZ3M6IHN0YXRlLnNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkOiBzdGF0ZS51bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCksXG4gIH07XG59XG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQge1xuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgZ2V0RGVjayxcbiAgZ2V0UmVxLFxuICBpbml0QW5uZWFsaW5nU3RhdGUsXG4gIGluc2VydFN0b3BzLFxuICByZW1vdmVTdG9wcyxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxuZXhwb3J0IHR5cGUgQW5uZWFsaW5nUmVzdWx0ID0ge1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBUU0laRTogbnVtYmVyO1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG4gIHVuYXNzaWduZWQ6IEludDhBcnJheTtcbiAgZWxhcHNlZE1zOiBudW1iZXI7XG4gIHRvdGFsU2NvcmU6IG51bWJlcjtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlbGluZUFubmVhbGluZyhtb2Q6IE1vZHVsZSwgc3RlcHMgPSAxXzYwMF8wMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QpO1xuICBjb25zdCB7IE5SRVFTLCBOVFJBTlMsIFRTSVpFLCBzY2hlZHVsZSwgc2NoZWR1bGVTaXplcywgc2NoZWR1bGVSYXRpbmdzLCB1bmFzc2lnbmVkIH0gPSBzdGF0ZTtcblxuICBsZXQgc3RhcnRUZW1wID0gNV8wMDA7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGJvb3RzdHJhcEVtcHR5Um91dGVzKHN0YXRlKTtcblxuICBmdW5jdGlvbiBhY2NlcHQocHJldlJhdGluZzogbnVtYmVyLCBuZXh0UmF0aW5nOiBudW1iZXIpIHtcbiAgICBpZiAobmV4dFJhdGluZyA+PSBwcmV2UmF0aW5nKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gcmFuZG9tKCkgPCBNYXRoLmV4cCgobmV4dFJhdGluZyAtIHByZXZSYXRpbmcpIC8gTWF0aC5tYXgodGVtcCwgMC4wMDEpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnbigpIHtcbiAgICBjb25zdCB0cmFuID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgIGNvbnN0IHNjaGVkU2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNjaGVkU2l6ZSArIDEpO1xuICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzY2hlZFNpemUsIHJhbmRJbnQoMCwgNCkgKyBhKTtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIE5SRVFTKTtcbiAgICBpZiAoIXVuYXNzaWduZWRbcmVxXSkgcmV0dXJuO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIsIHJhbmRvbSgpID4gMC41ID8gMSA6IDAsIHJlcSk7XG4gICAgY29uc3QgbmV3UmF0aW5nID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgaWYgKGFjY2VwdChzY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBuZXdSYXRpbmcpKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbdHJhbl0gPSBuZXdSYXRpbmc7XG4gICAgICB1bmFzc2lnbmVkW3JlcV0gPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVVuYXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNjaGVkU2l6ZSA8IDIpIHJldHVybjtcbiAgICBjb25zdCBpZHggPSByYW5kSW50KDAsIHNjaGVkU2l6ZSk7XG4gICAgY29uc3QgaXRlbSA9IHNjaGVkdWxlW3RyYW4gKiBUU0laRSArIGlkeF0hO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShpdGVtKTtcblxuICAgIGNvbnN0IGFiOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZWRTaXplOyBpKyspIHtcbiAgICAgIGlmIChnZXRSZXEoc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaV0hKSA9PT0gcmVxKSBhYi5wdXNoKGkpO1xuICAgIH1cbiAgICBpZiAoYWIubGVuZ3RoICE9PSAyKSByZXR1cm47XG5cbiAgICBjb25zdCBbYSwgYl0gPSBhYiBhcyBbbnVtYmVyLCBudW1iZXJdO1xuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiIC0gMSwgZ2V0RGVjayhpdGVtKSBhcyAwIHwgMSwgcmVxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RlcHM7IGkrKykge1xuICAgIHRlbXAgPSAoMSAtIGkgLyBzdGVwcykgKiBzdGFydFRlbXA7XG4gICAgdHJ5VW5hc3NpZ24oKTtcbiAgICB0cnlBc3NpZ24oKTtcbiAgfVxuXG4gIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgRGF0ZS5ub3coKSAtIHN0YXJ0ZWRBdCk7XG59XG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHsgYmFzZWxpbmVBbm5lYWxpbmcgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIjtcbmltcG9ydCB7XG4gIGFjY2VwdEFubmVhbCxcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGluaXRBbm5lYWxpbmdTdGF0ZSxcbiAgaW5zZXJ0U3RvcHMsXG4gIHR5cGUgUGFpckluZm8sXG4gIHJlbW92ZVN0b3BzLFxuICBzYW1wbGVBc3NpZ25lZFBhaXIsXG4gIHNhbXBsZVVuYXNzaWduZWRSZXEsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbnR5cGUgSW1wcm92ZWRPcHRpb25zID1cbiAgfCB7IHN0ZXBzOiBudW1iZXI7IGJ1ZGdldE1zPzogbmV2ZXIgfVxuICB8IHsgYnVkZ2V0TXM6IG51bWJlcjsgc3RlcHM/OiBuZXZlciB9O1xuXG5leHBvcnQgdHlwZSBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gPSB7XG4gIGl0ZXJhdGVTdGVwczogKHN0ZXBzOiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbiAgaXRlcmF0ZUZvck1zOiAoYnVkZ2V0TXM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBnZXRSZXN1bHQ6ICgpID0+IEFubmVhbGluZ1Jlc3VsdDtcbiAgcmVoZWF0OiAoZmFjdG9yPzogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZDogTW9kdWxlLCB0YXJnZXRTdGVwcyA9IDE1MDAwMCk6IEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB7XG4gIGNvbnN0IHdhcm11cFN0ZXBzID0gTWF0aC5taW4oTWF0aC5tYXgoMjAwMDAsIE1hdGguZmxvb3IodGFyZ2V0U3RlcHMgKiAwLjIpKSwgNTAwMDApO1xuICBjb25zdCB3YXJtdXAgPSBiYXNlbGluZUFubmVhbGluZyhtb2QsIHdhcm11cFN0ZXBzKTtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kLCB3YXJtdXApO1xuICBjb25zdCB7IE5UUkFOUywgc2NoZWR1bGVTaXplcywgc2NoZWR1bGVSYXRpbmdzLCB1bmFzc2lnbmVkIH0gPSBzdGF0ZTtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGxldCBzdGFydFRlbXAgPSA2XzAwMDtcbiAgbGV0IGVuZFRlbXAgPSAyNTtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwgeyB0cmFuOiBudW1iZXI7IHJlcTogbnVtYmVyOyBhOiBudW1iZXI7IGI6IG51bWJlcjsgZGVjazogMCB8IDE7IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgcmVxID0gc2FtcGxlVW5hc3NpZ25lZFJlcShzdGF0ZSk7XG4gICAgICBpZiAocmVxID09IG51bGwpIGJyZWFrO1xuXG4gICAgICBjb25zdCB0cmFuID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgICAgY29uc3Qgc2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2l6ZSArIDEpO1xuICAgICAgY29uc3QgYiA9IE1hdGgubWluKHNpemUsIGEgKyByYW5kSW50KDAsIE1hdGgubWluKDYsIHNpemUgLSBhICsgMSkpKTtcbiAgICAgIGNvbnN0IGRlY2sgPSAocmFuZG9tKCkgPiAwLjUgPyAxIDogMCkgYXMgMCB8IDE7XG5cbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiLCBkZWNrLCByZXEpO1xuICAgICAgY29uc3QgbmV3U2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBuZXdTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHsgdHJhbiwgcmVxLCBhLCBiLCBkZWNrLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iLCBiZXN0LmRlY2ssIGJlc3QucmVxKTtcbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICAgIHVuYXNzaWduZWRbYmVzdC5yZXFdID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5hLCBiZXN0LmIgKyAxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlVbmFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDYpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbzsgc2NvcmU6IG51bWJlciB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuICAgICAgY29uc3QgeyB0cmFuLCBwYWlyIH0gPSBjaG9zZW47XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQpO1xuICAgICAgY29uc3QgbmV3U2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCAtIDEsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHBhaXIsIHNjb3JlOiBuZXdTY29yZSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICAgIHVuYXNzaWduZWRbYmVzdC5wYWlyLnJlcV0gPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5UmVsb2NhdGVTYW1wbGVkKHNhbXBsZXMgPSA4KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7XG4gICAgICBzcmM6IG51bWJlcjtcbiAgICAgIGRzdDogbnVtYmVyO1xuICAgICAgcGFpcjogUGFpckluZm87XG4gICAgICBpbnNlcnRBOiBudW1iZXI7XG4gICAgICBpbnNlcnRCOiBudW1iZXI7XG4gICAgICBzY29yZTogbnVtYmVyO1xuICAgICAgb2xkU2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW46IHNyYywgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgY29uc3QgZHN0ID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgICAgY29uc3Qgb2xkU2NvcmUgPSBzcmMgPT09IGRzdFxuICAgICAgICA/IHNjaGVkdWxlUmF0aW5nc1tzcmNdIVxuICAgICAgICA6IHNjaGVkdWxlUmF0aW5nc1tzcmNdISArIHNjaGVkdWxlUmF0aW5nc1tkc3RdITtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHNyYywgcGFpci5maXJzdCwgcGFpci5zZWNvbmQpO1xuXG4gICAgICBjb25zdCBkc3RTaXplID0gc2NoZWR1bGVTaXplc1tkc3RdITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIGRzdFNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihkc3RTaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBkc3RTaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgZHN0LCBhLCBiLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgY29uc3QgY2FuZGlkYXRlU2NvcmUgPSBzcmMgPT09IGRzdFxuICAgICAgICA/IHNjb3JlUm91dGUoc3RhdGUsIHNyYylcbiAgICAgICAgOiBzY29yZVJvdXRlKHN0YXRlLCBzcmMpICsgc2NvcmVSb3V0ZShzdGF0ZSwgZHN0KTtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGRzdCwgYSwgYiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHNyYywgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHNyYyxcbiAgICAgICAgICBkc3QsXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICAgIG9sZFNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3Quc3JjLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQpO1xuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LmRzdCwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcblxuICAgIGlmIChhY2NlcHRBbm5lYWwoYmVzdC5vbGRTY29yZSwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIGlmIChiZXN0LnNyYyA9PT0gYmVzdC5kc3QpIHtcbiAgICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3Quc3JjXSA9IHNjb3JlUm91dGUoc3RhdGUsIGJlc3Quc3JjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LmRzdF0gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LmRzdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LmRzdCwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlaW5zZXJ0U2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgdHJhbjogbnVtYmVyO1xuICAgICAgcGFpcjogUGFpckluZm87XG4gICAgICBpbnNlcnRBOiBudW1iZXI7XG4gICAgICBpbnNlcnRCOiBudW1iZXI7XG4gICAgICBzY29yZTogbnVtYmVyO1xuICAgIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IGNob3NlbiA9IHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZSk7XG4gICAgICBpZiAoIWNob3NlbikgYnJlYWs7XG5cbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3Qgc2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2l6ZSArIDEpO1xuICAgICAgY29uc3QgYiA9IE1hdGgubWluKHNpemUsIGEgKyByYW5kSW50KDAsIE1hdGgubWluKDYsIHNpemUgLSBhICsgMSkpKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgY29uc3QgY2FuZGlkYXRlU2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCAtIDEsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgY2FuZGlkYXRlU2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7XG4gICAgICAgICAgdHJhbixcbiAgICAgICAgICBwYWlyLFxuICAgICAgICAgIGluc2VydEE6IGEsXG4gICAgICAgICAgaW5zZXJ0QjogYixcbiAgICAgICAgICBzY29yZTogY2FuZGlkYXRlU2NvcmUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQpO1xuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzZXNzaW9uU3RhcnRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgbGV0IGkgPSAwO1xuICBjb25zdCB0ZW1wRmxvb3IgPSAxNTA7XG4gIGNvbnN0IHJlaGVhdFRlbXAgPSAyXzI1MDtcblxuICBmdW5jdGlvbiBydW5JdGVyYXRpb25zKGl0ZXJhdGlvbkJ1ZGdldDogbnVtYmVyLCBkZWFkbGluZSA9IEluZmluaXR5KSB7XG4gICAgY29uc3QgZW5kSXRlcmF0aW9uID0gTWF0aC5taW4odGFyZ2V0U3RlcHMsIGkgKyBpdGVyYXRpb25CdWRnZXQpO1xuICAgIHdoaWxlIChpIDwgZW5kSXRlcmF0aW9uKSB7XG4gICAgICBpZiAoKGkgJiAyMDQ3KSA9PT0gMCAmJiBEYXRlLm5vdygpID49IGRlYWRsaW5lKSBicmVhaztcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IHN0YXJ0VGVtcCAqIE1hdGgucG93KGVuZFRlbXAgLyBzdGFydFRlbXAsIHByb2dyZXNzKTtcblxuICAgICAgY29uc3QgciA9IHJhbmRvbSgpO1xuICAgICAgaWYgKHIgPCAwLjQpIHRyeUFzc2lnblNhbXBsZWQoKTtcbiAgICAgIGVsc2UgaWYgKHIgPCAwLjU1KSB0cnlVbmFzc2lnblNhbXBsZWQoKTtcbiAgICAgIGVsc2UgaWYgKHIgPCAwLjg1KSB0cnlSZWluc2VydFNhbXBsZWQoKTtcbiAgICAgIGVsc2UgdHJ5UmVsb2NhdGVTYW1wbGVkKCk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcnVuVGltZWRDaHVuayhidWRnZXRNczogbnVtYmVyKSB7XG4gICAgY29uc3QgZGVhZGxpbmUgPSBEYXRlLm5vdygpICsgYnVkZ2V0TXM7XG5cbiAgICB3aGlsZSAoRGF0ZS5ub3coKSA8IGRlYWRsaW5lKSB7XG4gICAgICBjb25zdCBwcm9ncmVzcyA9IGkgLyB0YXJnZXRTdGVwcztcbiAgICAgIHRlbXAgPSBNYXRoLm1heCh0ZW1wRmxvb3IsIHN0YXJ0VGVtcCAqIE1hdGgucG93KGVuZFRlbXAgLyBzdGFydFRlbXAsIE1hdGgubWluKDEsIHByb2dyZXNzKSkpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcblxuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlc3VsdCgpIHtcbiAgICByZXR1cm4gdG9Bbm5lYWxpbmdSZXN1bHQoc3RhdGUsIHdhcm11cC5lbGFwc2VkTXMgKyAoRGF0ZS5ub3coKSAtIHNlc3Npb25TdGFydGVkQXQpKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaXRlcmF0ZVN0ZXBzKHN0ZXBzKSB7XG4gICAgICBydW5JdGVyYXRpb25zKHN0ZXBzKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGl0ZXJhdGVGb3JNcyhidWRnZXRNcykge1xuICAgICAgcnVuVGltZWRDaHVuayhidWRnZXRNcyk7XG4gICAgICByZXR1cm4gZ2V0UmVzdWx0KCk7XG4gICAgfSxcbiAgICBnZXRSZXN1bHQsXG4gICAgcmVoZWF0KGZhY3RvciA9IDEpIHtcbiAgICAgIHRlbXAgPSBNYXRoLm1heCh0ZW1wLCByZWhlYXRUZW1wICogZmFjdG9yKTtcbiAgICAgIC8vIFB1bGwgdGhlIHNlYXJjaCBzbGlnaHRseSBiYWNrIGZyb20gdGhlIGNvbGQgZW5kIG9mIHRoZSBzY2hlZHVsZS5cbiAgICAgIGkgPSBNYXRoLm1heCgwLCBpIC0gTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMDggKiBmYWN0b3IpKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ0NvcmUobW9kOiBNb2R1bGUsIG9wdGlvbnM6IEltcHJvdmVkT3B0aW9ucyk6IEFubmVhbGluZ1Jlc3VsdCB7XG4gIGNvbnN0IHRhcmdldFN0ZXBzID0gb3B0aW9ucy5zdGVwcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5zdGVwcyA6IE1hdGgubWF4KDE1MDAwMCwgTWF0aC5mbG9vcihvcHRpb25zLmJ1ZGdldE1zICogMTkwKSk7XG4gIGNvbnN0IHNlc3Npb24gPSBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kLCB0YXJnZXRTdGVwcyk7XG4gIGlmIChvcHRpb25zLnN0ZXBzICE9PSB1bmRlZmluZWQpIHJldHVybiBzZXNzaW9uLml0ZXJhdGVTdGVwcyhvcHRpb25zLnN0ZXBzKTtcbiAgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZUZvck1zKG9wdGlvbnMuYnVkZ2V0TXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wcm92ZWRBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMTUwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgc3RlcHMgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ1RpbWVkKG1vZDogTW9kdWxlLCBidWRnZXRNcyA9IDEwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgYnVkZ2V0TXMgfSk7XG59XG4iLAogICAgIlxuZXhwb3J0IHR5cGUgTnVtVHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCJcbmV4cG9ydCB0eXBlIFJlc3VsdFR5cGUgPSBOdW1UeXBlIHwgXCJ2b2lkXCIgfCBTdHJ1Y3RUeXBlPGFueT5cbmV4cG9ydCB0eXBlIEludFR5cGUgPSBcImkzMlwiIHwgXCJpNjRcIlxuZXhwb3J0IHR5cGUgUGFja2VkVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiXG5leHBvcnQgdHlwZSBNZW1vcnlUeXBlID0gTnVtVHlwZSB8IFBhY2tlZFR5cGVcbmV4cG9ydCB0eXBlIERUeXBlID0gTWVtb3J5VHlwZSB8IFN0cnVjdFR5cGU8YW55PlxuZXhwb3J0IHR5cGUgTG9hZGVkVHlwZTxUIGV4dGVuZHMgTWVtb3J5VHlwZT4gPSBUIGV4dGVuZHMgUGFja2VkVHlwZSA/IFwiaTMyXCIgOiBUXG5leHBvcnQgdHlwZSBBcml0aG1ldGljT3AgPSBcImFkZFwiIHwgXCJzdWJcIiB8IFwibXVsXCIgfCBcImRpdlwiXG5leHBvcnQgdHlwZSBCaXRPcCA9IFwieG9yXCIgfCBcInNobFwiIHwgXCJzaHJcIiB8IFwiYW5kXCIgfCBcIm9yXCJcbmV4cG9ydCB0eXBlIFJlbWFpbmRlck9wID0gXCJtb2RcIiB8IFwidW1vZFwiXG5leHBvcnQgdHlwZSBCaW5PcCA9IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3BcbmV4cG9ydCB0eXBlIENtcE9wID0gXCJlcVwiIHwgXCJsdFwiIHwgXCJndFwiXG5jb25zdCBhcml0aG1ldGljT3BzID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdIGFzIGNvbnN0XG5jb25zdCBiaXRPcHMgPSBbXCJhbmRcIiwgXCJvclwiLCBcInhvclwiLCBcInNobFwiLCBcInNoclwiXSBhcyBjb25zdFxuY29uc3QgcmVtYWluZGVyT3BzID0gW1wibW9kXCIsIFwidW1vZFwiXSBhcyBjb25zdFxuY29uc3QgY21wT3BzID0gW1wiZXFcIiwgXCJsdFwiLCBcImd0XCJdIGFzIGNvbnN0XG5leHBvcnQgdHlwZSBWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBUIGV4dGVuZHMgXCJpNjRcIiA/IGJpZ2ludCA6IG51bWJlclxuZXhwb3J0IHR5cGUgVHlwZWRBcnJheUZvcjxUIGV4dGVuZHMgTWVtb3J5VHlwZT4gPVxuICBUIGV4dGVuZHMgXCJpOFwiID8gSW50OEFycmF5IDpcbiAgVCBleHRlbmRzIFwidTE2XCIgPyBVaW50MTZBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImkxNlwiID8gSW50MTZBcnJheSA6XG4gIFQgZXh0ZW5kcyBcInU4XCIgPyBVaW50OEFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTMyXCIgPyBJbnQzMkFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTY0XCIgPyBCaWdJbnQ2NEFycmF5IDpcbiAgVCBleHRlbmRzIFwiZjMyXCIgPyBGbG9hdDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmNjRcIiA/IEZsb2F0NjRBcnJheSA6IG5ldmVyXG5cbnR5cGUgQXJnc0V4cHI8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8QXJnc1tLXT46IG5ldmVyIH1cbnR5cGUgQXJnc0xpa2U8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHJMaWtlPEFyZ3NbS10+OiBuZXZlciB9XG5leHBvcnQgdHlwZSBBcmdzVmFsPEFyZ3MgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10+ICA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8QXJnc1tLXT4gOiBuZXZlciB9XG5cbnR5cGUgTG9jYWxOb2RlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZTogVCwgbG9jYWw6IG51bWJlciB9XG50eXBlIEdsb2JhbE5vZGU8VCBleHRlbmRzIE51bVR5cGU+ID0geyBraW5kOiBcImdsb2JhbC5nZXRcIiwgdHlwZTogVCwgaW5pdGlhbDogVmFsdWU8VD4gfVxuZXhwb3J0IHR5cGUgQ29yZUV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID1cbiAgfCB7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogVCwgdmFsdWU6IFZhbHVlPFQ+IH1cbiAgfCBMb2NhbE5vZGU8VD5cbiAgfCBHbG9iYWxOb2RlPFQ+XG4gIHwgeyBraW5kOiBcImJpblwiLCB0eXBlOiBULCBvcDogQmluT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwiY2FsbFwiLCB0eXBlOiBULCB0YXJnZXQ6IEFueUZ1bmMsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcImNhc3RcIiwgdHlwZTogVCwgaW5wdXRUeXBlOiBOdW1UeXBlLCB1bnNpZ25lZDogYm9vbGVhbiwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJpZlwiLCB0eXBlOiBULCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlOiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwibG9hZFwiLCB0eXBlOiBULCBhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByPFwiaTMyXCI+LCBzdG9yYWdlOiBNZW1vcnlUeXBlLCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiA/IHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBOdW1UeXBlLCBvcDogQ21wT3AsIGxlZnQ6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByPE51bVR5cGU+IH0gOiBuZXZlcilcblxuY2xhc3MgRXhwck1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+IHt9XG50eXBlIEFyaXRobWV0aWNNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsgW09wIGluIEFyaXRobWV0aWNPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxudHlwZSBDb21wYXJlTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBDbXBPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8XCJpMzJcIj4gfVxudHlwZSBJbnRlZ2VyTWV0aG9kczxUIGV4dGVuZHMgSW50VHlwZT4gPSB7IFtPcCBpbiBCaXRPcCB8IFJlbWFpbmRlck9wXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gRXhwcjxUPiB9XG5leHBvcnQgdHlwZSBFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IENvcmVFeHByPFQ+ICYgRXhwck1ldGhvZHM8VD4gJiBBcml0aG1ldGljTWV0aG9kczxUPiAmIENvbXBhcmVNZXRob2RzPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gSW50ZWdlck1ldGhvZHM8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIEFueUV4cHIgPSBhbnlcblxuXG5leHBvcnQgdHlwZSBTdG10ID1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBudW1iZXIsIHR5cGU6IE51bVR5cGUsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiZ2xvYmFsLnNldFwiLCBnbG9iYWw6IEFueUdsb2JhbCwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheTogQW55QXJyYXksIHR5cGU6IE1lbW9yeVR5cGUsIGluZGV4OiBFeHByPFwiaTMyXCI+LCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkubW92ZVwiLCBhcnJheTogQW55QXJyYXksIHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPiB9XG4gIHwgeyBraW5kOiBcImlmXCIsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IFN0bXRbXSwgZWxzZTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwiYmxvY2tcIiwgY29udHJvbDogbnVtYmVyLCBib2R5OiBTdG10W10gfVxuICB8IHsga2luZDogXCJsb29wXCIsIGNvbnRyb2w6IG51bWJlciwgY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwiYnJlYWtcIiwgdGFyZ2V0OiBudW1iZXIgfCBudWxsIH1cbiAgfCB7IGtpbmQ6IFwiY29udGludWVcIiwgdGFyZ2V0OiBudW1iZXIgfCBudWxsIH1cbiAgfCB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlPzogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImNhbGwudm9pZFwiLCB0YXJnZXQ6IEFueUZ1bmMsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcInRyYXBcIiwgbWVzc2FnZTogc3RyaW5nIH1cbiAgfCB7IGtpbmQ6IFwibG9nXCIsIG1lc3NhZ2U6IHN0cmluZywgdmFsdWU6IEV4cHI8XCJpMzJcIj4gfVxuICB8IHsga2luZDogXCJleHByXCIsIGV4cHI6IEV4cHI8TnVtVHlwZT4gfVxuXG5leHBvcnQgdHlwZSBCbG9ja0hhbmRsZSA9IHsga2luZDogXCJibG9ja1wiLCBpZDogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbnVtYmVyIH1cbnR5cGUgQ29udHJvbEhhbmRsZSA9IEJsb2NrSGFuZGxlIHwgTG9vcEhhbmRsZVxuXG5jbGFzcyBNdXRhYmxlTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gZXh0ZW5kcyBFeHByTWV0aG9kczxUPiB7XG4gIGRlY2xhcmUgdHlwZTogVFxuICBkZWNsYXJlIHdyaXRlOiAodmFsdWU6IEV4cHI8VD4pID0+IFN0bXRcbiAgc2V0KHZhbHVlOiBFeHByTGlrZTxUPikgeyByZXR1cm4gdGhpcy53cml0ZShsaXQodGhpcy50eXBlLCB2YWx1ZSkpIH1cbn1cbnR5cGUgTXV0YWJsZUFyaXRobWV0aWM8VCBleHRlbmRzIE51bVR5cGU+ID0geyBbT3AgaW4gQXJpdGhtZXRpY09wIGFzIGBpJHtPcH1gXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gU3RtdCB9XG50eXBlIE11dGFibGVJbnRlZ2VyPFQgZXh0ZW5kcyBJbnRUeXBlPiA9IHsgW09wIGluIFwiYW5kXCIgfCBcIm9yXCIgfCBcInhvclwiIGFzIGBpJHtPcH1gXTogKHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gU3RtdCB9XG5leHBvcnQgdHlwZSBNdXRhYmxlVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gRXhwcjxUPiAmIHsgc2V0KHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXQgfSAmIE11dGFibGVBcml0aG1ldGljPFQ+ICYgKFQgZXh0ZW5kcyBJbnRUeXBlID8gTXV0YWJsZUludGVnZXI8VD4gOiB7fSlcbmV4cG9ydCB0eXBlIExvY2FsVmFyPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IE11dGFibGVWYWx1ZTxUPiAmIExvY2FsTm9kZTxUPlxuZXhwb3J0IHR5cGUgR2xvYmFsVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gTXV0YWJsZVZhbHVlPFQ+ICYgR2xvYmFsTm9kZTxUPlxuZXhwb3J0IHR5cGUgQW55R2xvYmFsID0gR2xvYmFsVmFsdWU8TnVtVHlwZT5cblxuZXhwb3J0IHR5cGUgQXJyYXlWYWx1ZTxUIGV4dGVuZHMgRFR5cGU+ID1cbiAgVCBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBNdXRhYmxlU3RydWN0PEY+IDpcbiAgVCBleHRlbmRzIE1lbW9yeVR5cGUgPyBNdXRhYmxlVmFsdWU8TG9hZGVkVHlwZTxUPj4gOiBuZXZlclxuZXhwb3J0IHR5cGUgQXJyYXlIYW5kbGU8VCBleHRlbmRzIERUeXBlPiA9IHtcbiAga2luZDogXCJhcnJheVwiXG4gIHR5cGU6IFRcbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBBcnJheVZhbHVlPFQ+XG4gIG1vdmUodGFyZ2V0OiBFeHByTGlrZTxcImkzMlwiPiwgc291cmNlOiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBCaXRTdG9yYWdlVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiIHwgXCJpMzJcIlxuZXhwb3J0IHR5cGUgQml0RmllbGQgPSByZWFkb25seSBbQml0U3RvcmFnZVR5cGUsIG51bWJlcl1cbmV4cG9ydCB0eXBlIFN0cnVjdFN0b3JhZ2VUeXBlID0gUGFja2VkVHlwZSB8IEludFR5cGVcbmV4cG9ydCB0eXBlIEZpZWxkVHlwZSA9IFN0cnVjdFN0b3JhZ2VUeXBlIHwgQml0RmllbGRcbmV4cG9ydCB0eXBlIFN0cnVjdEZpZWxkcyA9IFJlY29yZDxzdHJpbmcsIEZpZWxkVHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkU3RvcmFnZTxUIGV4dGVuZHMgRmllbGRUeXBlPiA9IFQgZXh0ZW5kcyByZWFkb25seSBbaW5mZXIgUyBleHRlbmRzIEJpdFN0b3JhZ2VUeXBlLCBudW1iZXJdID8gUyA6IEV4dHJhY3Q8VCwgTWVtb3J5VHlwZT5cbmV4cG9ydCB0eXBlIEZpZWxkVmFsdWU8VCBleHRlbmRzIEZpZWxkVHlwZT4gPSBMb2FkZWRUeXBlPEZpZWxkU3RvcmFnZTxUPj5cbmV4cG9ydCB0eXBlIEZpZWxkTGF5b3V0ID0geyBzdG9yYWdlOiBTdHJ1Y3RTdG9yYWdlVHlwZSwgYml0T2Zmc2V0OiBudW1iZXIsIGJpdHM6IG51bWJlciB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RUeXBlPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBraW5kOiBcInN0cnVjdFwiXG4gIGZpZWxkczogRlxuICBsYXlvdXQ6IHsgW0sgaW4ga2V5b2YgRl06IEZpZWxkTGF5b3V0IH1cbiAgc2l6ZTogbnVtYmVyXG4gIHN0b3JhZ2U6IFwidThcIiB8IFwidTE2XCIgfCBJbnRUeXBlXG59XG50eXBlIFN0cnVjdE1lbWJlcnM8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7XG4gIFtLIGluIGtleW9mIEZdOiBFeHByPEZpZWxkVmFsdWU8RltLXT4+XG59XG50eXBlIE11dGFibGVTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogTXV0YWJsZVZhbHVlPEZpZWxkVmFsdWU8RltLXT4+XG59XG5leHBvcnQgdHlwZSBTdHJ1Y3RJbml0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogRXhwckxpa2U8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgSlNTdHJ1Y3Q8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSB7IFtLIGluIGtleW9mIEZdOiBWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PiB9XG5leHBvcnQgdHlwZSBTdHJ1Y3RWYWx1ZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdE1lbWJlcnM8Rj4gJiB7IHBhY2tlZDogQW55RXhwciB9XG5leHBvcnQgdHlwZSBNdXRhYmxlU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gU3RydWN0VmFsdWU8Rj4gJiBNdXRhYmxlU3RydWN0TWVtYmVyczxGPiAmIHtcbiAgc2V0KHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPik6IFN0bXRcbn1cbmV4cG9ydCB0eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPlxuZXhwb3J0IHR5cGUgU3RtdEJvZHkgPSBTdG10IHwgU3RtdEJvZHlbXVxudHlwZSBDb250cm9sQm9keTxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4gPSBTdG10Qm9keSB8ICgoc2VsZjogSCkgPT4gU3RtdEJvZHkpXG5leHBvcnQgdHlwZSBGdW5jQm9keTxSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPVxuICBSIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8Uj4gfCBTdG10Qm9keSA6XG4gIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gfCBTdG10Qm9keSA6XG4gIFN0bXRCb2R5XG5leHBvcnQgdHlwZSBGdW5jSGFuZGxlPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPiA9IHtcbiAga2luZDogXCJmdW5jXCJcbiAgcGFyYW1zOiBBXG4gIHJlc3VsdDogUlxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj5cbiAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NMaWtlPEE+KSA9PlxuICAgIFIgZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxSPiA6XG4gICAgUiBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBTdHJ1Y3RWYWx1ZTxGPiA6XG4gICAgU3RtdFxufVxuXG5leHBvcnQgdHlwZSBBbnlGdW5jID0ge1xuICBraW5kOiBcImZ1bmNcIlxuICBwYXJhbXM6IHJlYWRvbmx5IE51bVR5cGVbXVxuICByZXN1bHQ6IFJlc3VsdFR5cGVcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBBbnlFeHByW10pID0+IGFueVxuICBjYWxsOiAoLi4uYXJnczogYW55W10pID0+IEFueUV4cHJcbn1cblxuZXhwb3J0IHR5cGUgQW55QXJyYXkgPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICB0eXBlOiBEVHlwZVxuICBsZW5ndGg6IG51bWJlclxuICBlbGVtZW50U2l6ZTogbnVtYmVyXG4gIGF0KC4uLmFyZ3M6IGFueVtdKTogYW55XG4gIG1vdmUoLi4uYXJnczogYW55W10pOiBTdG10XG59XG5cbmV4cG9ydCB0eXBlIE1vZHVsZURlZiA9IFJlY29yZDxzdHJpbmcsIEFueUZ1bmMgfCBBbnlBcnJheSB8IEFueUdsb2JhbD5cbmV4cG9ydCB0eXBlIEZ1bmNEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlGdW5jPiB9XG5leHBvcnQgdHlwZSBBcnJheURlZnM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7IFtLIGluIGtleW9mIFQgYXMgVFtLXSBleHRlbmRzIEFueUFycmF5ID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlBcnJheT4gfVxuZXhwb3J0IHR5cGUgQ29tcGlsZVJlc3VsdDxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgW0sgaW4ga2V5b2YgVF06XG4gICAgVFtLXSBleHRlbmRzIEFueUZ1bmMgPyAoLi4uYXJnczogQXJnc1ZhbDxUW0tdW1wicGFyYW1zXCJdPikgPT5cbiAgICAgIFRbS11bXCJyZXN1bHRcIl0gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8VFtLXVtcInJlc3VsdFwiXT4gOlxuICAgICAgVFtLXVtcInJlc3VsdFwiXSBleHRlbmRzIFN0cnVjdFR5cGU8aW5mZXIgRj4gPyBKU1N0cnVjdDxGPiA6XG4gICAgICB2b2lkXG4gICAgOiBUW0tdIGV4dGVuZHMgQXJyYXlIYW5kbGU8aW5mZXIgRD4gP1xuICAgICAgRCBleHRlbmRzIE1lbW9yeVR5cGUgPyBUeXBlZEFycmF5Rm9yPEQ+IDogVWludDhBcnJheSB8IFVpbnQxNkFycmF5IHwgVWludDMyQXJyYXkgfCBCaWdVaW50NjRBcnJheVxuICAgIDogbmV2ZXJcbn0gJiB7XG4gIG1vZDogV2ViQXNzZW1ibHkuTW9kdWxlXG4gIG1lbW9yeTogV2ViQXNzZW1ibHkuTWVtb3J5XG4gIHRyYXBNZXNzYWdlczogc3RyaW5nW11cbiAgbG9nTWVzc2FnZXM6IHN0cmluZ1tdXG4gIHJlc3VsdFN0cnVjdHM6IFJlY29yZDxzdHJpbmcsIFN0cnVjdFR5cGU8YW55Pj5cbn1cblxuXG5sZXQgbmV4dExvY2FsSWQgPSAwXG5sZXQgbmV4dENvbnRyb2xJZCA9IDBcblxuY29uc3QgaW5mZXJUeXBlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pID0+XG4gICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgXCJ0eXBlXCIgaW4gdmFsdWUgPyB2YWx1ZS50eXBlIDogXCJpMzJcIikgYXMgVFxuXG5jb25zdCBleHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPik6IEV4cHI8VD4gPT4ge1xuICByZXR1cm4gT2JqZWN0LnNldFByb3RvdHlwZU9mKG5vZGUsIEV4cHJNZXRob2RzLnByb3RvdHlwZSkgYXMgRXhwcjxUPlxufVxuXG5leHBvcnQgY29uc3QgbGl0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+IHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChcImtpbmRcIiBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlIGFzIEV4cHI8VD5cbiAgfVxuICByZXR1cm4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIFZhbHVlPFQ+IH0pXG59XG5jb25zdCBtdXRhYmxlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPiwgd3JpdGU6ICh2YWx1ZTogRXhwcjxUPikgPT4gU3RtdCkgPT5cbiAgT2JqZWN0LmFzc2lnbihPYmplY3Quc2V0UHJvdG90eXBlT2Yobm9kZSwgTXV0YWJsZU1ldGhvZHMucHJvdG90eXBlKSwgeyB3cml0ZSB9KSBhcyBNdXRhYmxlVmFsdWU8VD5cblxuY29uc3QgaXNTdG10ID0gKHg6IHVua25vd24pOiB4IGlzIFN0bXQgPT5cbiAgISF4ICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIFwia2luZFwiIGluIHggJiYgKFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiaWZcIiA/IEFycmF5LmlzQXJyYXkoKHggYXMgeyB0aGVuPzogdW5rbm93biB9KS50aGVuKSA6XG4gICAgIVtcImNvbnN0XCIsIFwibG9jYWwuZ2V0XCIsIFwiZ2xvYmFsLmdldFwiLCBcImJpblwiLCBcImNhbGxcIiwgXCJjYXN0XCIsIFwibG9hZFwiLCBcImNtcFwiXS5pbmNsdWRlcygoeCBhcyB7IGtpbmQ6IHN0cmluZyB9KS5raW5kKVxuICApXG5cbmNvbnN0IHN0bXRMaXN0ID0gKGJvZHk6IFN0bXRCb2R5KTogU3RtdFtdID0+IEFycmF5LmlzQXJyYXkoYm9keSkgPyBib2R5LmZsYXRNYXAoc3RtdExpc3QpIDogW2JvZHldXG5leHBvcnQgY29uc3QgYXNTdG10cyA9IDxSIGV4dGVuZHMgUmVzdWx0VHlwZT4oYm9keTogRnVuY0JvZHk8Uj4pID0+IGlzU3RtdChib2R5KSA/IFtib2R5XSA6IEFycmF5LmlzQXJyYXkoYm9keSkgPyBzdG10TGlzdChib2R5KSA6IG51bGxcbmNvbnN0IGJpbmRTdG10cyA9IChib2R5OiBTdG10Qm9keSwgYnI6IG51bWJlciwgbG9vcDogbnVtYmVyIHwgbnVsbCk6IFN0bXRbXSA9PlxuICBzdG10TGlzdChib2R5KS5tYXAocyA9PiBiaW5kU3RtdChzLCBiciwgbG9vcCkpXG5cbmNvbnN0IGJpbmRTdG10ID0gKHM6IFN0bXQsIGJyOiBudW1iZXIsIGxvb3A6IG51bWJlciB8IG51bGwpOiBTdG10ID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIHsgLi4ucywgdGhlbjogYmluZFN0bXRzKHMudGhlbiwgYnIsIGxvb3ApLCBlbHNlOiBiaW5kU3RtdHMocy5lbHNlLCBiciwgbG9vcCkgfVxuICAgIGNhc2UgXCJicmVha1wiOiByZXR1cm4geyAuLi5zLCB0YXJnZXQ6IHMudGFyZ2V0ID8/IGJyIH1cbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIGlmIChzLnRhcmdldCAhPSBudWxsKSByZXR1cm4gc1xuICAgICAgaWYgKGxvb3AgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiB7IC4uLnMsIHRhcmdldDogbG9vcCB9XG4gICAgZGVmYXVsdDogcmV0dXJuIHNcbiAgfVxufVxuXG5jb25zdCBjb250cm9sQm9keSA9IDxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4oc2VsZjogSCwgYm9keTogQ29udHJvbEJvZHk8SD4pID0+XG4gIGJpbmRTdG10cyh0eXBlb2YgYm9keSA9PT0gXCJmdW5jdGlvblwiID8gYm9keShzZWxmKSA6IGJvZHksIHNlbGYuaWQsIHNlbGYua2luZCA9PT0gXCJsb29wXCIgPyBzZWxmLmlkIDogbnVsbClcblxuY29uc3QgYmluID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQXJpdGhtZXRpY09wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IGJpdCA9IDxUIGV4dGVuZHMgSW50VHlwZT4ob3A6IEJpdE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IHJlbWFpbmRlciA9IDxUIGV4dGVuZHMgSW50VHlwZT4ob3A6IFJlbWFpbmRlck9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IGNtcCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4ob3A6IENtcE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+ID0+XG4gIGV4cHI8XCJpMzJcIj4oeyBraW5kOiBcImNtcFwiLCB0eXBlOiBcImkzMlwiLCBpbnB1dFR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQ6IGxlZnQgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+IH0gYXMgQ29yZUV4cHI8XCJpMzJcIj4pXG5cbmV4cG9ydCBjb25zdCBhbGxvY2F0ZUxvY2FsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKSA9PiBleHByKHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZSwgbG9jYWw6IG5leHRMb2NhbElkKysgfSlcblxuY29uc3QgbWtMb2NhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IExvY2FsVmFyPFQ+ID0+IHtcbiAgY29uc3QgbG9jYWwgPSBuZXh0TG9jYWxJZCsrXG4gIHJldHVybiBtdXRhYmxlKHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZSwgbG9jYWwgfSwgdmFsdWUgPT4gKHsga2luZDogXCJsb2NhbC5zZXRcIiwgbG9jYWwsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBFeHByPE51bVR5cGU+IH0pKSBhcyBMb2NhbFZhcjxUPlxufVxuXG5jb25zdCBta0hhbmRsZSA9IDxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4oXG4gIHBhcmFtczogQSxcbiAgcmVzdWx0OiBSLFxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj4sXG4pOiBGdW5jSGFuZGxlPEEsIFI+ID0+IHtcbiAgbGV0IGhhbmRsZSE6IEZ1bmNIYW5kbGU8QSwgUj5cbiAgaGFuZGxlID0ge1xuICAgIGtpbmQ6IFwiZnVuY1wiLFxuICAgIHBhcmFtcywgcmVzdWx0LCBidWlsZCxcbiAgICBjYWxsOiAoLi4uYXJnczogQXJnc0xpa2U8QT4pID0+IHtcbiAgICAgIGNvbnN0IGNhbGxBcmdzID0gcGFyYW1zLm1hcCgodHlwZSwgaSkgPT4gbGl0KHR5cGUsIGFyZ3NbaV0gYXMgRXhwckxpa2U8dHlwZW9mIHR5cGU+KSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gICAgICBpZiAocmVzdWx0ID09PSBcInZvaWRcIikgcmV0dXJuIHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBoYW5kbGUsIGFyZ3M6IGNhbGxBcmdzIH1cbiAgICAgIGNvbnN0IHR5cGUgPSAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIiA/IHJlc3VsdCA6IHJlc3VsdC5zdG9yYWdlID09PSBcImk2NFwiID8gXCJpNjRcIiA6IFwiaTMyXCIpIGFzIE51bVR5cGVcbiAgICAgIGNvbnN0IGNhbGwgPSBleHByKHsga2luZDogXCJjYWxsXCIsIHR5cGUsIHRhcmdldDogaGFuZGxlLCBhcmdzOiBjYWxsQXJncyB9KVxuICAgICAgcmV0dXJuIHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyBjYWxsIDogcmVhZFN0cnVjdChyZXN1bHQsIGNhbGwpXG4gICAgfSxcbiAgfSBhcyBGdW5jSGFuZGxlPEEsIFI+XG4gIHJldHVybiBoYW5kbGVcbn1cblxuY29uc3QgbG9hZGVkVHlwZSA9IDxUIGV4dGVuZHMgTWVtb3J5VHlwZT4odHlwZTogVCkgPT5cbiAgKHR5cGUgPT09IFwiaThcIiB8fCB0eXBlID09PSBcInU4XCIgfHwgdHlwZSA9PT0gXCJpMTZcIiB8fCB0eXBlID09PSBcInUxNlwiID8gXCJpMzJcIiA6IHR5cGUpIGFzIExvYWRlZFR5cGU8VD5cblxuY29uc3Qgc3RvcmFnZVNpemU6IFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+ID0geyBpODogMSwgdTg6IDEsIGkxNjogMiwgdTE2OiAyLCBpMzI6IDQsIGYzMjogNCwgaTY0OiA4LCBmNjQ6IDggfVxuY29uc3QgbWVtb3J5VmFsdWUgPSA8VCBleHRlbmRzIE1lbW9yeVR5cGU+KGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCBzdG9yYWdlOiBULCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0ID0gMCkgPT4ge1xuICBjb25zdCBhdCA9IGxpdChcImkzMlwiLCBpbmRleClcbiAgcmV0dXJuIG11dGFibGUoeyBraW5kOiBcImxvYWRcIiwgdHlwZTogbG9hZGVkVHlwZShzdG9yYWdlKSwgYXJyYXksIGluZGV4OiBhdCwgc3RvcmFnZSwgc3RyaWRlLCBvZmZzZXQgfSwgdmFsdWUgPT5cbiAgICAoeyBraW5kOiBcImFycmF5LnN0b3JlXCIsIGFycmF5LCB0eXBlOiBzdG9yYWdlLCBpbmRleDogYXQsIHN0cmlkZSwgb2Zmc2V0LCB2YWx1ZTogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KSlcbn1cblxudHlwZSBTdHJ1Y3RCYWNraW5nID0gYW55XG50eXBlIEludGVybmFsU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gTXV0YWJsZVN0cnVjdDxGPiAmIHsgcGFja2VkOiBTdHJ1Y3RCYWNraW5nIH1cblxuY29uc3QgcmVhZEZpZWxkID0gKGJhY2tpbmc6IEFueUV4cHIsIGZpZWxkOiBGaWVsZExheW91dCkgPT4ge1xuICBjb25zdCB7IGJpdHMgfSA9IGZpZWxkXG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiKSByZXR1cm4gYmFja2luZ1xuICBpZiAoYmFja2luZy50eXBlID09PSBcImk2NFwiKSB7XG4gICAgY29uc3QgYml0T2Zmc2V0ID0gQmlnSW50KGZpZWxkLmJpdE9mZnNldCksIG1hc2sgPSAoMW4gPDwgQmlnSW50KGJpdHMpKSAtIDFuXG4gICAgY29uc3QgcmF3ID0gaTMyKGJhY2tpbmcuc2hyKGJpdE9mZnNldCkuYW5kKG1hc2spKVxuICAgIHJldHVybiBmaWVsZC5zdG9yYWdlLnN0YXJ0c1dpdGgoXCJpXCIpICYmIGJpdHMgPCAzMlxuICAgICAgPyBpZkVsc2UocmF3LmFuZCgyICoqIChiaXRzIC0gMSkpLCByYXcuc3ViKDIgKiogYml0cyksIHJhdylcbiAgICAgIDogcmF3XG4gIH1cbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTMyXCIgJiYgZmllbGQuYml0T2Zmc2V0ID09PSAwKSByZXR1cm4gYmFja2luZ1xuICBjb25zdCBtYXNrID0gMiAqKiBiaXRzIC0gMVxuICBjb25zdCByYXcgPSBiYWNraW5nLnNocihmaWVsZC5iaXRPZmZzZXQpLmFuZChtYXNrKVxuICByZXR1cm4gZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiBiaXRzIDwgMzJcbiAgICA/IGlmRWxzZShyYXcuYW5kKDIgKiogKGJpdHMgLSAxKSksIHJhdy5zdWIoMiAqKiBiaXRzKSwgcmF3KVxuICAgIDogcmF3XG59XG5cbmNvbnN0IHBhY2tlZEZpZWxkVmFsdWUgPSAoYmFja2luZzogU3RydWN0QmFja2luZywgZmllbGQ6IEZpZWxkTGF5b3V0KSA9PiB7XG4gIGNvbnN0IHZhbHVlID0gcmVhZEZpZWxkKGJhY2tpbmcsIGZpZWxkKVxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGJhY2tpbmdcbiAgaWYgKGJhY2tpbmcudHlwZSA9PT0gXCJpNjRcIikge1xuICAgIGNvbnN0IGJpdE9mZnNldCA9IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpLCBtYXNrID0gKDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzKSkgLSAxblxuICAgIGNvbnN0IGZpZWxkTWFzayA9IG1hc2sgPDwgYml0T2Zmc2V0XG4gICAgcmV0dXJuIG11dGFibGU8XCJpMzJcIj4odmFsdWUgYXMgRXhwcjxcImkzMlwiPiwgaW5wdXQgPT4gYmFja2luZy5zZXQoYmFja2luZy5hbmQofmZpZWxkTWFzaykub3IoaTY0dShpbnB1dCkuYW5kKG1hc2spLnNobChiaXRPZmZzZXQpKSkpXG4gIH1cbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTMyXCIgJiYgZmllbGQuYml0T2Zmc2V0ID09PSAwKSByZXR1cm4gYmFja2luZ1xuICBjb25zdCBtYXNrID0gMiAqKiBmaWVsZC5iaXRzIC0gMSwgZmllbGRNYXNrID0gbWFzayA8PCBmaWVsZC5iaXRPZmZzZXRcbiAgcmV0dXJuIG11dGFibGU8XCJpMzJcIj4odmFsdWUsIGlucHV0ID0+IGJhY2tpbmcuc2V0KGJhY2tpbmcuYW5kKH5maWVsZE1hc2spLm9yKGlucHV0LmFuZChtYXNrKS5zaGwoZmllbGQuYml0T2Zmc2V0KSkpKVxufVxuXG5jb25zdCByZWFkU3RydWN0ID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHBhY2tlZDogQW55RXhwcik6IFN0cnVjdFZhbHVlPEY+ID0+XG4gIE9iamVjdC5hc3NpZ24oT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5tYXAobmFtZSA9PiBbbmFtZSwgcmVhZEZpZWxkKHBhY2tlZCwgdHlwZS5sYXlvdXRbbmFtZV0hKV0pKSwgeyBwYWNrZWQgfSkgYXMgU3RydWN0VmFsdWU8Rj5cblxuY29uc3Qgc3RydWN0VmFsdWUgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgcGFja2VkOiBTdHJ1Y3RCYWNraW5nKTogTXV0YWJsZVN0cnVjdDxGPiA9PiB7XG4gIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykubWFwKG5hbWUgPT4gW25hbWUsIHBhY2tlZEZpZWxkVmFsdWUocGFja2VkLCB0eXBlLmxheW91dFtuYW1lXSEpXSkpXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGZpZWxkcywgeyBwYWNrZWQsIHNldDogKHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPikgPT5cbiAgICBwYWNrZWQuc2V0KFwicGFja2VkXCIgaW4gdmFsdWUgPyAodmFsdWUgYXMgSW50ZXJuYWxTdHJ1Y3Q8Rj4pLnBhY2tlZCA6IHBhY2tTdHJ1Y3QodHlwZSwgdmFsdWUpKSB9KSBhcyBJbnRlcm5hbFN0cnVjdDxGPlxufVxuXG5jb25zdCBwYWNrU3RydWN0ID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHZhbHVlczogU3RydWN0SW5pdDxGPik6IEFueUV4cHIgPT4ge1xuICBpZiAodHlwZS5zdG9yYWdlICE9PSBcImk2NFwiKSByZXR1cm4gT2JqZWN0LmtleXModHlwZS5maWVsZHMpLnJlZHVjZSgocGFja2VkLCBuYW1lKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSB0eXBlLmxheW91dFtuYW1lXSEsIHZhbHVlID0gdmFsdWVzW25hbWVdIVxuICAgIGNvbnN0IG1hc2sgPSAyICoqIGZpZWxkLmJpdHMgLSAxXG4gICAgcmV0dXJuIHBhY2tlZC5vcihsaXQoXCJpMzJcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpMzJcIj4pLmFuZChtYXNrKS5zaGwoZmllbGQuYml0T2Zmc2V0KSlcbiAgfSwgaTMyKDApKVxuICByZXR1cm4gT2JqZWN0LmtleXModHlwZS5maWVsZHMpLnJlZHVjZSgocGFja2VkLCBuYW1lKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSB0eXBlLmxheW91dFtuYW1lXSEsIHZhbHVlID0gdmFsdWVzW25hbWVdIVxuICAgIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiKSByZXR1cm4gbGl0KFwiaTY0XCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTY0XCI+KVxuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgcmV0dXJuIHBhY2tlZC5vcihpNjR1KGxpdChcImkzMlwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImkzMlwiPikpLmFuZChtYXNrKS5zaGwoQmlnSW50KGZpZWxkLmJpdE9mZnNldCkpKVxuICB9LCBpNjQoMG4pKVxufVxuXG5leHBvcnQgY29uc3Qgc3RydWN0ID0gPGNvbnN0IEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KGZpZWxkczogRik6IFN0cnVjdFR5cGU8Rj4gPT4ge1xuICBpZiAoXCJzZXRcIiBpbiBmaWVsZHMgfHwgXCJwYWNrZWRcIiBpbiBmaWVsZHMpIHRocm93IG5ldyBFcnJvcihcIlN0cnVjdCBmaWVsZHMgY2Fubm90IGJlIG5hbWVkIHNldCBvciBwYWNrZWRcIilcbiAgbGV0IHVzZWQgPSAwXG4gIGNvbnN0IGxheW91dDogUGFydGlhbDxSZWNvcmQ8a2V5b2YgRiwgRmllbGRMYXlvdXQ+PiA9IHt9XG4gIGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyhmaWVsZHMpIGFzIChrZXlvZiBGKVtdKSB7XG4gICAgY29uc3QgZmllbGQgPSBmaWVsZHNbbmFtZV0hXG4gICAgY29uc3Qgc3RvcmFnZSA9IChBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkWzBdIDogZmllbGQpIGFzIFN0cnVjdFN0b3JhZ2VUeXBlXG4gICAgY29uc3QgYml0cyA9IEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGRbMV0gOiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSAqIDhcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoYml0cykgfHwgYml0cyA8IDEgfHwgYml0cyA+IHN0b3JhZ2VTaXplW3N0b3JhZ2VdICogOCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkICR7c3RvcmFnZX0gYml0LWZpZWxkIHdpZHRoICR7Yml0c31gKVxuICAgIGlmICh1c2VkICsgYml0cyA+IDY0KSB0aHJvdyBuZXcgRXJyb3IoYFN0cnVjdCByZXF1aXJlcyAke3VzZWQgKyBiaXRzfSBiaXRzOyBtYXhpbXVtIGlzIDY0YClcbiAgICBsYXlvdXRbbmFtZV0gPSB7IHN0b3JhZ2UsIGJpdE9mZnNldDogdXNlZCwgYml0cyB9XG4gICAgdXNlZCArPSBiaXRzXG4gIH1cbiAgY29uc3Qgc3RvcmFnZSA9IHVzZWQgPD0gOCA/IFwidThcIiA6IHVzZWQgPD0gMTYgPyBcInUxNlwiIDogdXNlZCA8PSAzMiA/IFwiaTMyXCIgOiBcImk2NFwiXG4gIHJldHVybiB7IGtpbmQ6IFwic3RydWN0XCIsIGZpZWxkcywgbGF5b3V0OiBsYXlvdXQgYXMgeyBbSyBpbiBrZXlvZiBGXTogRmllbGRMYXlvdXQgfSwgc3RvcmFnZSwgc2l6ZTogc3RvcmFnZVNpemVbc3RvcmFnZV0gfVxufVxuXG5jb25zdCBjYXN0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwcjxOdW1UeXBlPiwgdW5zaWduZWQgPSBmYWxzZSk6IEV4cHI8VD4gPT5cbiAgdmFsdWUudHlwZSA9PT0gdHlwZSA/IHZhbHVlIGFzIHVua25vd24gYXMgRXhwcjxUPiA6IGV4cHI8VD4oeyBraW5kOiBcImNhc3RcIiwgdHlwZSwgaW5wdXRUeXBlOiB2YWx1ZS50eXBlLCB1bnNpZ25lZCwgdmFsdWUgfSBhcyBDb3JlRXhwcjxUPilcbmNvbnN0IG51bWJlciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IHVua25vd24pOiBFeHByPFQ+ID0+XG4gIHR5cGVvZiB2YWx1ZSA9PT0gKHR5cGUgPT09IFwiaTY0XCIgPyBcImJpZ2ludFwiIDogXCJudW1iZXJcIilcbiAgICA/IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlIH0gYXMgQ29yZUV4cHI8VD4pXG4gICAgOiBjYXN0KHR5cGUsIHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4pXG5cbmV4cG9ydCBmdW5jdGlvbiBpMzIodmFsdWU6IG51bWJlcik6IEV4cHI8XCJpMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBpMzI8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImkzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGkzMih2YWx1ZTogdW5rbm93bikgeyByZXR1cm4gbnVtYmVyKFwiaTMyXCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBpNjQodmFsdWU6IGJpZ2ludCk6IEV4cHI8XCJpNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBpNjQ8VCBleHRlbmRzIEludFR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImk2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGk2NCh2YWx1ZTogdW5rbm93bikgeyByZXR1cm4gbnVtYmVyKFwiaTY0XCIsIHZhbHVlKSB9XG5leHBvcnQgY29uc3QgaTY0dSA9ICh2YWx1ZTogRXhwcjxcImkzMlwiPikgPT4gY2FzdChcImk2NFwiLCB2YWx1ZSBhcyB1bmtub3duIGFzIEV4cHI8TnVtVHlwZT4sIHRydWUpXG5cbnR5cGUgRjMySW5wdXQgPSBudW1iZXIgfCBFeHByPFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyKHZhbHVlOiBudW1iZXIpOiBFeHByPFwiZjMyXCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJmMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzIodmFsdWU6IEYzMklucHV0KSB7IHJldHVybiBudW1iZXIoXCJmMzJcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGY2NCh2YWx1ZTogbnVtYmVyKTogRXhwcjxcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGY2NDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjY0KHZhbHVlOiBGMzJJbnB1dCkgeyByZXR1cm4gbnVtYmVyKFwiZjY0XCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBpZkVsc2U8VCBleHRlbmRzIE51bVR5cGU+KGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2VfOiBFeHByPFQ+KTogRXhwcjxUPlxuZXhwb3J0IGZ1bmN0aW9uIGlmRWxzZShjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10Qm9keSwgZWxzZV8/OiBTdG10Qm9keSk6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiBpZkVsc2U8VCBleHRlbmRzIE51bVR5cGU+KGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4gfCBTdG10Qm9keSwgZWxzZV8/OiBFeHByPFQ+IHwgU3RtdEJvZHkpOiBFeHByPFQ+IHwgU3RtdCB7XG4gIHJldHVybiBpc1N0bXQodGhlbikgfHwgQXJyYXkuaXNBcnJheSh0aGVuKVxuICAgID8geyBraW5kOiBcImlmXCIsIGNvbmQsIHRoZW46IHN0bXRMaXN0KHRoZW4gYXMgU3RtdEJvZHkpLCBlbHNlOiBlbHNlXyA9PT0gdW5kZWZpbmVkID8gW10gOiBzdG10TGlzdChlbHNlXyBhcyBTdG10Qm9keSkgfVxuICAgIDogZXhwcjxUPih7IGtpbmQ6IFwiaWZcIiwgdHlwZTogdGhlbi50eXBlLCBjb25kLCB0aGVuLCBlbHNlOiBlbHNlXyBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG59XG5cbmNvbnN0IGFyaXRobWV0aWMgPSBPYmplY3QuZnJvbUVudHJpZXMoYXJpdGhtZXRpY09wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQXJpdGhtZXRpY09wXTogPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgYml0cyA9IE9iamVjdC5mcm9tRW50cmllcyhiaXRPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpdChvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIEJpdE9wXTogPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgcmVtYWluZGVycyA9IE9iamVjdC5mcm9tRW50cmllcyhyZW1haW5kZXJPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IHJlbWFpbmRlcihvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIFJlbWFpbmRlck9wXTogPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgY29tcGFyaXNvbnMgPSBPYmplY3QuZnJvbUVudHJpZXMoY21wT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBDbXBPcF06IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFwiaTMyXCI+IH1cblxuZm9yIChjb25zdCBvcCBvZiBhcml0aG1ldGljT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwckxpa2U8TnVtVHlwZT4pIHsgcmV0dXJuIGFyaXRobWV0aWNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgYml0T3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPEludFR5cGU+LCByaWdodDogRXhwckxpa2U8SW50VHlwZT4pIHsgcmV0dXJuIGJpdHNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgcmVtYWluZGVyT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPEludFR5cGU+LCByaWdodDogRXhwckxpa2U8SW50VHlwZT4pIHsgcmV0dXJuIHJlbWFpbmRlcnNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgY21wT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwckxpa2U8TnVtVHlwZT4pIHsgcmV0dXJuIGNvbXBhcmlzb25zW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIFsuLi5hcml0aG1ldGljT3BzLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCJdIGFzIGNvbnN0KSBPYmplY3QuZGVmaW5lUHJvcGVydHkoTXV0YWJsZU1ldGhvZHMucHJvdG90eXBlLCBgaSR7b3B9YCwge1xuICB2YWx1ZSh0aGlzOiBNdXRhYmxlVmFsdWU8YW55PiwgcmlnaHQ6IGFueSkgeyByZXR1cm4gdGhpcy5zZXQoKHRoaXMgYXMgYW55KVtvcF0ocmlnaHQpKSB9LFxufSlcblxuZXhwb3J0IGNvbnN0IHsgYWRkLCBzdWIsIG11bCwgZGl2IH0gPSBhcml0aG1ldGljXG5leHBvcnQgY29uc3QgeyBhbmQsIG9yLCB4b3IsIHNobCwgc2hyIH0gPSBiaXRzXG5leHBvcnQgY29uc3QgeyBtb2QsIHVtb2QgfSA9IHJlbWFpbmRlcnNcbmV4cG9ydCBjb25zdCB7IGVxLCBsdCwgZ3QgfSA9IGNvbXBhcmlzb25zXG5cbmV4cG9ydCBjb25zdCBmdW5jID0gPGNvbnN0IEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPihwYXJhbXM6IEEsIHJlc3VsdDogUiwgYnVpbGQ6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gRnVuY0JvZHk8Uj4pID0+XG4gIG1rSGFuZGxlKHBhcmFtcywgcmVzdWx0LCBidWlsZCBhcyAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPilcbmV4cG9ydCBmdW5jdGlvbiBhcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGVuZ3RoKSB8fCBsZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFycmF5IGxlbmd0aCAke2xlbmd0aH1gKVxuICBjb25zdCBzdHJ1Y3QgPSB0eXBlb2YgdHlwZSA9PT0gXCJvYmplY3RcIiA/IHR5cGUgOiBudWxsXG4gIGNvbnN0IHN0b3JhZ2U6IE1lbW9yeVR5cGUgPSBzdHJ1Y3QgPyBzdHJ1Y3Quc3RvcmFnZSA6IHR5cGUgYXMgTWVtb3J5VHlwZVxuICBjb25zdCBlbGVtZW50U2l6ZSA9IHN0cnVjdCA/IHN0cnVjdC5zaXplIDogc3RvcmFnZVNpemVbc3RvcmFnZV1cbiAgbGV0IGhhbmRsZTogQW55QXJyYXlcbiAgaGFuZGxlID0ge1xuICAgIGtpbmQ6IFwiYXJyYXlcIiwgdHlwZSwgbGVuZ3RoLCBlbGVtZW50U2l6ZSxcbiAgICBhdDogaW5kZXggPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBtZW1vcnlWYWx1ZShoYW5kbGUsIGluZGV4LCBzdG9yYWdlLCBlbGVtZW50U2l6ZSlcbiAgICAgIHJldHVybiBzdHJ1Y3QgPyBzdHJ1Y3RWYWx1ZShzdHJ1Y3QsIHZhbHVlKSA6IHZhbHVlXG4gICAgfSxcbiAgICBtb3ZlOiAodGFyZ2V0LCBzb3VyY2UsIGNvdW50KSA9PiAoeyBraW5kOiBcImFycmF5Lm1vdmVcIiwgYXJyYXk6IGhhbmRsZSwgdGFyZ2V0OiBsaXQoXCJpMzJcIiwgdGFyZ2V0KSwgc291cmNlOiBsaXQoXCJpMzJcIiwgc291cmNlKSwgY291bnQ6IGxpdChcImkzMlwiLCBjb3VudCkgfSksXG4gIH1cbiAgcmV0dXJuIGhhbmRsZSBhcyBBcnJheUhhbmRsZTxUPlxufVxuXG5jb25zdCBta1N0cnVjdExvY2FsID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4pID0+XG4gIHN0cnVjdFZhbHVlKHR5cGUsIG1rTG9jYWwodHlwZS5zdG9yYWdlID09PSBcImk2NFwiID8gXCJpNjRcIiA6IFwiaTMyXCIpKVxuXG50eXBlIExvY2FsRmFjdG9yeSA9IHtcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKTogTG9jYWxWYXI8VD5cbiAgPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4pOiBNdXRhYmxlU3RydWN0PEY+XG59XG5cbmV4cG9ydCBjb25zdCBsb2NhbCA9ICg8VCBleHRlbmRzIE51bVR5cGUsIEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFQgfCBTdHJ1Y3RUeXBlPEY+KSA9PlxuICB0eXBlb2YgdHlwZSA9PT0gXCJzdHJpbmdcIiA/IG1rTG9jYWwodHlwZSkgOiBta1N0cnVjdExvY2FsKHR5cGUpKSBhcyBMb2NhbEZhY3RvcnlcblxuY29uc3QgZXhwSW1wbCA9IGZ1bmMoW1wiZjMyXCJdLCBcImYzMlwiLCB4ID0+IHtcbiAgY29uc3QgeSA9IGxvY2FsKFwiZjMyXCIpXG4gIHJldHVybiBbXG4gICAgeS5zZXQoaWZFbHNlKHgubHQoLTE2KSwgZjMyKC0xNiksIGlmRWxzZSh4Lmd0KDE2KSwgZjMyKDE2KSwgeCkpLmRpdigyMDQ4KS5hZGQoMSkpLFxuICAgIC4uLkFycmF5LmZyb20oeyBsZW5ndGg6IDExIH0sICgpID0+IHkuaW11bCh5KSksXG4gICAgcmV0KHkpLFxuICBdXG59KVxuZXhwb3J0IGNvbnN0IGV4cCA9ICh2YWx1ZTogRXhwckxpa2U8XCJmMzJcIj4pID0+IGV4cEltcGwuY2FsbCh2YWx1ZSlcblxuZXhwb3J0IGNvbnN0IGdsb2JhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgaW5pdGlhbDogVmFsdWU8VD4pOiBHbG9iYWxWYWx1ZTxUPiA9PiB7XG4gIGxldCB2YWx1ZSE6IEdsb2JhbFZhbHVlPFQ+XG4gIHZhbHVlID0gbXV0YWJsZSh7IGtpbmQ6IFwiZ2xvYmFsLmdldFwiLCB0eXBlLCBpbml0aWFsIH0sIGlucHV0ID0+XG4gICAgKHsga2luZDogXCJnbG9iYWwuc2V0XCIsIGdsb2JhbDogdmFsdWUgYXMgdW5rbm93biBhcyBBbnlHbG9iYWwsIHZhbHVlOiBpbnB1dCBhcyBFeHByPE51bVR5cGU+IH0pKSBhcyBHbG9iYWxWYWx1ZTxUPlxuICByZXR1cm4gdmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJldCgpOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0KHZhbHVlOiB7IHBhY2tlZDogQW55RXhwciB9KTogU3RtdFxuZXhwb3J0IGZ1bmN0aW9uIHJldDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU/OiBFeHByTGlrZTxUPiB8IHsgcGFja2VkOiBBbnlFeHByIH0pOiBTdG10IHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIFwicGFja2VkXCIgaW4gdmFsdWUpIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiB2YWx1ZS5wYWNrZWQgfVxuICByZXR1cm4geyBraW5kOiBcInJldHVyblwiLCB2YWx1ZTogbGl0KGluZmVyVHlwZSh2YWx1ZSksIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+IH1cbn1cbmV4cG9ydCBjb25zdCB0cmFwID0gKG1lc3NhZ2U6IHN0cmluZyk6IFN0bXQgPT4gKHsga2luZDogXCJ0cmFwXCIsIG1lc3NhZ2UgfSlcbmV4cG9ydCBjb25zdCBib3VuZHNDaGVjayA9IChhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+ID0gMSk6IFN0bXQgPT4ge1xuICBjb25zdCBpID0gbGl0KFwiaTMyXCIsIGluZGV4KSwgbiA9IGxpdChcImkzMlwiLCBjb3VudClcbiAgcmV0dXJuIGlmRWxzZShpLmx0KDApLm9yKG4ubHQoMCkpLm9yKG4uZ3QoYXJyYXkubGVuZ3RoKSkub3IoaS5ndChpMzIoYXJyYXkubGVuZ3RoKS5zdWIobikpKSwgdHJhcChcImFycmF5IGJvdW5kcyBleGNlZWRlZFwiKSlcbn1cbmV4cG9ydCBjb25zdCBsb2cgPSAobWVzc2FnZTogc3RyaW5nLCB2YWx1ZTogRXhwckxpa2U8XCJpMzJcIj4pOiBTdG10ID0+ICh7IGtpbmQ6IFwibG9nXCIsIG1lc3NhZ2UsIHZhbHVlOiBsaXQoXCJpMzJcIiwgdmFsdWUpIH0pXG5leHBvcnQgY29uc3QgYmxvY2sgPSAoYm9keTogQ29udHJvbEJvZHk8QmxvY2tIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cbmV4cG9ydCBjb25zdCBsb29wID0gKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IENvbnRyb2xCb2R5PExvb3BIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbmV4dENvbnRyb2xJZCsrIH1cbiAgcmV0dXJuIHsga2luZDogXCJsb29wXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGNvbmQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cblxuZXhwb3J0IGNvbnN0IGJyZWFrVG8gPSAodGFyZ2V0PzogQ29udHJvbEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGNvbnRpbnVlVG8gPSAodGFyZ2V0PzogTG9vcEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGV4cHJTdG10ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IFN0bXQgPT4gKHsga2luZDogXCJleHByXCIsIGV4cHI6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSlcbiIsCiAgICAiaW1wb3J0IHtcbiAgYWxsb2NhdGVMb2NhbCwgYXNTdG10cyxcbiAgdHlwZSBBbnlBcnJheSwgdHlwZSBBbnlGdW5jLCB0eXBlIEFueUdsb2JhbCwgdHlwZSBBcnJheURlZnMsIHR5cGUgRXhwcixcbiAgdHlwZSBGdW5jQm9keSwgdHlwZSBGdW5jRGVmcywgdHlwZSBNb2R1bGVEZWYsIHR5cGUgTnVtVHlwZSwgdHlwZSBSZXN1bHRUeXBlLFxufSBmcm9tIFwiLi9hc3RcIlxuXG5jb25zdCBkaWUgPSAoeDogdW5rbm93bik6IG5ldmVyID0+IHsgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHZhbHVlOiAke1N0cmluZyh4KX1gKSB9XG5leHBvcnQgdHlwZSBBcnJheUxheW91dCA9IHsgbGVuZ3RoOiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCBlbGVtZW50U2l6ZTogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIE1vZHVsZUFuYWx5c2lzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBmdW5jczogRnVuY0RlZnM8VD5cbiAgYXJyYXlzOiBBcnJheURlZnM8VD5cbiAgZkVudHJpZXM6IFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGJ1aWx0RnVuY3M6IEJ1aWx0RnVuY1tdXG4gIGZpeDogTWFwPEFueUZ1bmMsIG51bWJlcj5cbiAgbGF5b3V0czogTWFwPEFueUFycmF5LCBBcnJheUxheW91dD5cbiAgZ2xvYmFsczogTWFwPEFueUdsb2JhbCwgbnVtYmVyPlxuICB0cmFwTWVzc2FnZXM6IHN0cmluZ1tdXG4gIGxvZ01lc3NhZ2VzOiBzdHJpbmdbXVxuICBwYWdlczogbnVtYmVyXG59XG5cbnR5cGUgVmlzaXRvcnMgPSB7XG4gIGxvY2FsPzogKGlkOiBudW1iZXIsIHR5cGU6IE51bVR5cGUpID0+IHZvaWRcbiAgYXJyYXk/OiAoYXJyYXk6IEFueUFycmF5KSA9PiB2b2lkXG4gIGZ1bmM/OiAoZnVuYzogQW55RnVuYykgPT4gdm9pZFxuICBnbG9iYWw/OiAoZ2xvYmFsOiBBbnlHbG9iYWwpID0+IHZvaWRcbiAgdHJhcD86IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbiAgbG9nPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxufVxuY29uc3Qgd2FsayA9IChub2RlOiBhbnksIGZuczogVmlzaXRvcnMpOiB2b2lkID0+IHtcbiAgaWYgKG5vZGUgPT0gbnVsbCkgcmV0dXJuXG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSByZXR1cm4gbm9kZS5mb3JFYWNoKHggPT4gd2Fsayh4LCBmbnMpKVxuICBjb25zdCBjaGlsZHJlbiA9ICguLi52YWx1ZXM6IGFueVtdKSA9PiB2YWx1ZXMuZm9yRWFjaCh4ID0+IHdhbGsoeCwgZm5zKSlcbiAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjogY2FzZSBcImJyZWFrXCI6IGNhc2UgXCJjb250aW51ZVwiOiByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6IGZucy5sb2NhbD8uKG5vZGUubG9jYWwsIG5vZGUudHlwZSk7IHJldHVyblxuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjogZm5zLmxvY2FsPy4obm9kZS5sb2NhbCwgbm9kZS50eXBlKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJnbG9iYWwuZ2V0XCI6IGZucy5nbG9iYWw/Lihub2RlKTsgcmV0dXJuXG4gICAgY2FzZSBcImdsb2JhbC5zZXRcIjogZm5zLmdsb2JhbD8uKG5vZGUuZ2xvYmFsKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJiaW5cIjogY2FzZSBcImNtcFwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5sZWZ0LCBub2RlLnJpZ2h0KVxuICAgIGNhc2UgXCJjYWxsXCI6IGNhc2UgXCJjYWxsLnZvaWRcIjogZm5zLmZ1bmM/Lihub2RlLnRhcmdldCk7IHJldHVybiB3YWxrKG5vZGUuYXJncywgZm5zKVxuICAgIGNhc2UgXCJjYXN0XCI6IGNhc2UgXCJyZXR1cm5cIjogcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4gY2hpbGRyZW4obm9kZS5jb25kLCBub2RlLnRoZW4sIG5vZGUuZWxzZSlcbiAgICBjYXNlIFwibG9hZFwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIHdhbGsobm9kZS5pbmRleCwgZm5zKVxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIGNoaWxkcmVuKG5vZGUuaW5kZXgsIG5vZGUudmFsdWUpXG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjogZm5zLmFycmF5Py4obm9kZS5hcnJheSk7IHJldHVybiBjaGlsZHJlbihub2RlLnRhcmdldCwgbm9kZS5zb3VyY2UsIG5vZGUuY291bnQpXG4gICAgY2FzZSBcImJsb2NrXCI6IHJldHVybiB3YWxrKG5vZGUuYm9keSwgZm5zKVxuICAgIGNhc2UgXCJsb29wXCI6IHJldHVybiBjaGlsZHJlbihub2RlLmNvbmQsIG5vZGUuYm9keSlcbiAgICBjYXNlIFwidHJhcFwiOiBmbnMudHJhcD8uKG5vZGUubWVzc2FnZSk7IHJldHVyblxuICAgIGNhc2UgXCJsb2dcIjogZm5zLmxvZz8uKG5vZGUubWVzc2FnZSk7IHJldHVybiB3YWxrKG5vZGUudmFsdWUsIGZucylcbiAgICBjYXNlIFwiZXhwclwiOiByZXR1cm4gd2Fsayhub2RlLmV4cHIsIGZucylcbiAgICBkZWZhdWx0OiBkaWUobm9kZSlcbiAgfVxufVxuXG5cbmNvbnN0IGFycmF5TGF5b3V0cyA9IChhcnJheXM6IEFueUFycmF5W10pID0+IHtcbiAgbGV0IG9mZnNldCA9IDBcbiAgY29uc3QgbGF5b3V0cyA9IG5ldyBNYXA8QW55QXJyYXksIEFycmF5TGF5b3V0PigpXG4gIGZvciAoY29uc3QgYXJyIG9mIGFycmF5cykge1xuICAgIGNvbnN0IGFsaWduID0gTWF0aC5taW4oYXJyLmVsZW1lbnRTaXplLCA4KVxuICAgIG9mZnNldCA9IE1hdGguY2VpbChvZmZzZXQgLyBhbGlnbikgKiBhbGlnblxuICAgIGxheW91dHMuc2V0KGFyciwgeyBsZW5ndGg6IGFyci5sZW5ndGgsIG9mZnNldCwgZWxlbWVudFNpemU6IGFyci5lbGVtZW50U2l6ZSB9KVxuICAgIG9mZnNldCArPSBhcnIubGVuZ3RoICogYXJyLmVsZW1lbnRTaXplXG4gIH1cbiAgcmV0dXJuIHsgbGF5b3V0cywgYnl0ZXM6IG9mZnNldCB9XG59XG5cbmV4cG9ydCB0eXBlIEJ1aWx0RnVuYyA9IHtcbiAgZnVuYzogQW55RnVuY1xuICBidWlsdDogRnVuY0JvZHk8UmVzdWx0VHlwZT5cbiAgbG9jYWxzOiBbbnVtYmVyLCBOdW1UeXBlXVtdXG4gIGxvY2FsSW5kZXhlczogUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICBmdW5jdGlvbnM6IEFueUZ1bmNbXVxuICBhcnJheXM6IEFueUFycmF5W11cbiAgdHJhcHM6IHN0cmluZ1tdXG4gIGxvZ3M6IHN0cmluZ1tdXG4gIGdsb2JhbHM6IEFueUdsb2JhbFtdXG59XG5cbmNvbnN0IGJ1aWxkRnVuYyA9IChmdW5jOiBBbnlGdW5jKTogQnVpbHRGdW5jID0+IHtcbiAgY29uc3QgcGFyYW1zID0gZnVuYy5wYXJhbXMubWFwKHR5cGUgPT4gYWxsb2NhdGVMb2NhbCh0eXBlKSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gIGNvbnN0IHBhcmFtSWRzID0gcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSlcbiAgY29uc3QgcmVzdWx0ID0gZnVuYy5idWlsZCguLi5wYXJhbXMpXG4gIGNvbnN0IGJ1aWx0ID0gdHlwZW9mIGZ1bmMucmVzdWx0ID09PSBcIm9iamVjdFwiICYmICFhc1N0bXRzKHJlc3VsdCkgPyByZXN1bHQucGFja2VkIDogcmVzdWx0XG4gIGNvbnN0IGZvdW5kID0gbmV3IE1hcDxudW1iZXIsIE51bVR5cGU+KClcbiAgY29uc3QgZnVuY3Rpb25zID0gbmV3IFNldDxBbnlGdW5jPigpLCBhcnJheXMgPSBuZXcgU2V0PEFueUFycmF5PigpLCBnbG9iYWxzID0gbmV3IFNldDxBbnlHbG9iYWw+KCksIHRyYXBzID0gbmV3IFNldDxzdHJpbmc+KCksIGxvZ3MgPSBuZXcgU2V0PHN0cmluZz4oKVxuICB3YWxrKGJ1aWx0LCB7XG4gICAgbG9jYWw6IChpZCwgdHlwZSkgPT4gZm91bmQuc2V0KGlkLCB0eXBlKSwgZnVuYzogZiA9PiBmdW5jdGlvbnMuYWRkKGYpLCBhcnJheTogYSA9PiBhcnJheXMuYWRkKGEpLFxuICAgIGdsb2JhbDogdmFsdWUgPT4gZ2xvYmFscy5hZGQodmFsdWUpLCB0cmFwOiBtZXNzYWdlID0+IHRyYXBzLmFkZChtZXNzYWdlKSwgbG9nOiBtZXNzYWdlID0+IGxvZ3MuYWRkKG1lc3NhZ2UpLFxuICB9KVxuICBwYXJhbUlkcy5mb3JFYWNoKGlkID0+IGZvdW5kLmRlbGV0ZShpZCkpXG4gIGNvbnN0IGxvY2FscyA9IFsuLi5mb3VuZC5lbnRyaWVzKCldXG4gIGNvbnN0IGxvY2FsSW5kZXhlcyA9IE9iamVjdC5mcm9tRW50cmllcyhbXG4gICAgLi4ucGFyYW1JZHMubWFwKChpZCwgaSkgPT4gW2lkLCBpXSksXG4gICAgLi4ubG9jYWxzLm1hcCgoW2lkXSwgaSkgPT4gW2lkLCBmdW5jLnBhcmFtcy5sZW5ndGggKyBpXSksXG4gIF0pXG4gIHJldHVybiB7IGZ1bmMsIGJ1aWx0LCBsb2NhbHMsIGxvY2FsSW5kZXhlcywgZnVuY3Rpb25zOiBbLi4uZnVuY3Rpb25zXSwgYXJyYXlzOiBbLi4uYXJyYXlzXSwgZ2xvYmFsczogWy4uLmdsb2JhbHNdLCB0cmFwczogWy4uLnRyYXBzXSwgbG9nczogWy4uLmxvZ3NdIH1cbn1cblxuY29uc3QgYnVpbGRSZWZlcmVuY2VkRnVuY3Rpb25zID0gKHJvb3RzOiBBbnlGdW5jW10pID0+IHtcbiAgY29uc3QgYnVpbHQgPSBuZXcgTWFwPEFueUZ1bmMsIEJ1aWx0RnVuYz4oKVxuICBjb25zdCB2aXNpdCA9IChmdW5jOiBBbnlGdW5jKSA9PiB7XG4gICAgaWYgKGJ1aWx0LmhhcyhmdW5jKSkgcmV0dXJuXG4gICAgY29uc3QgZW50cnkgPSBidWlsZEZ1bmMoZnVuYylcbiAgICBidWlsdC5zZXQoZnVuYywgZW50cnkpXG4gICAgZW50cnkuZnVuY3Rpb25zLmZvckVhY2godmlzaXQpXG4gIH1cbiAgcm9vdHMuZm9yRWFjaCh2aXNpdClcbiAgcmV0dXJuIFsuLi5idWlsdC52YWx1ZXMoKV1cbn1cblxuZXhwb3J0IGNvbnN0IGFuYWx5emVNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PiB7XG4gIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhtb2QpXG4gIGNvbnN0IGZ1bmNzID0gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImZ1bmNcIikpIGFzIEZ1bmNEZWZzPFQ+XG4gIGNvbnN0IGFycmF5cyA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLmZpbHRlcigoWywgdl0pID0+IHYua2luZCA9PT0gXCJhcnJheVwiKSkgYXMgQXJyYXlEZWZzPFQ+XG4gIGNvbnN0IGZFbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZnVuY3MpIGFzIFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGNvbnN0IGJ1aWx0RnVuY3MgPSBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMoZkVudHJpZXMubWFwKChbLCBmdW5jXSkgPT4gZnVuYykpXG4gIGNvbnN0IGZpeCA9IG5ldyBNYXAoYnVpbHRGdW5jcy5tYXAoKHsgZnVuYyB9LCBpKSA9PiBbZnVuYywgaV0pKVxuICBjb25zdCBhbGxBcnJheXMgPSBbLi4ubmV3IFNldChbLi4uYnVpbHRGdW5jcy5mbGF0TWFwKGZ1bmMgPT4gZnVuYy5hcnJheXMpLCAuLi5PYmplY3QudmFsdWVzKGFycmF5cykgYXMgQW55QXJyYXlbXV0pXVxuICBjb25zdCBhbGxHbG9iYWxzID0gWy4uLm5ldyBTZXQoWy4uLmJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMuZ2xvYmFscyksIC4uLmVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImdsb2JhbC5nZXRcIikubWFwKChbLCB2XSkgPT4gdiBhcyBBbnlHbG9iYWwpXSldXG4gIGNvbnN0IGdsb2JhbHMgPSBuZXcgTWFwKGFsbEdsb2JhbHMubWFwKCh2YWx1ZSwgaSkgPT4gW3ZhbHVlLCBpXSkpXG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIGNvbnN0IHRyYXBNZXNzYWdlcyA9IFsuLi5uZXcgU2V0KGJ1aWx0RnVuY3MuZmxhdE1hcChmdW5jID0+IGZ1bmMudHJhcHMpKV1cbiAgY29uc3QgbG9nTWVzc2FnZXMgPSBbLi4ubmV3IFNldChidWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLmxvZ3MpKV1cbiAgcmV0dXJuIHsgZnVuY3MsIGFycmF5cywgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgZ2xvYmFscywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXM6IE1hdGgubWF4KDEsIE1hdGguY2VpbChieXRlcyAvIDY1NTM2KSkgfSBhcyBNb2R1bGVBbmFseXNpczxUPlxufVxuIiwKICAgICJpbXBvcnQge1xuICB0eXBlIEFueUFycmF5LCB0eXBlIEFueUV4cHIsIHR5cGUgQW55RnVuYywgdHlwZSBBbnlHbG9iYWwsIHR5cGUgQXJpdGhtZXRpY09wLCB0eXBlIEJpdE9wLCB0eXBlIENtcE9wLCB0eXBlIEV4cHIsXG4gIHR5cGUgTWVtb3J5VHlwZSwgdHlwZSBNb2R1bGVEZWYsIHR5cGUgTnVtVHlwZSwgdHlwZSBSZW1haW5kZXJPcCwgdHlwZSBTdG10LCBhc1N0bXRzLFxufSBmcm9tIFwiLi9hc3RcIlxuaW1wb3J0IHsgdHlwZSBBcnJheUxheW91dCwgdHlwZSBNb2R1bGVBbmFseXNpcyB9IGZyb20gXCIuL2FuYWx5emVcIlxuXG5jb25zdCBtYWdpYyA9IFsweDAwLCAweDYxLCAweDczLCAweDZkLCAweDAxLCAweDAwLCAweDAwLCAweDAwXVxuY29uc3QgcmVzdWx0VHlwZSA9IChyZXN1bHQ6IEFueUZ1bmNbXCJyZXN1bHRcIl0pID0+XG4gIHR5cGVvZiByZXN1bHQgPT09IFwib2JqZWN0XCIgPyByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiIDogcmVzdWx0XG5cbmNvbnN0IG51bWJlckJhc2UgPSB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+XG5jb25zdCBvcGNvZGUgPSAob3A6IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3AgfCBDbXBPcCwgdHlwZTogTnVtVHlwZSkgPT4ge1xuICBjb25zdCBhcml0aG1ldGljID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdLmluZGV4T2Yob3ApXG4gIGlmIChhcml0aG1ldGljID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgYXJpdGhtZXRpY1xuICBjb25zdCBpbnRlZ2VyID0gW1wibW9kXCIsIFwidW1vZFwiLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwiXCIsIFwic2hyXCJdLmluZGV4T2Yob3ApXG4gIGlmIChpbnRlZ2VyID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgNSArIGludGVnZXJcbiAgcmV0dXJuICh7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+KVt0eXBlXVxuICAgICsgKG9wID09PSBcImVxXCIgPyAwIDogb3AgPT09IFwibHRcIiA/IDIgOiB0eXBlWzBdID09PSBcImlcIiA/IDQgOiAzKVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgbG9hZDogeyBpMzI6IDB4MjgsIGk2NDogMHgyOSwgZjMyOiAweDJhLCBmNjQ6IDB4MmIsIGk4OiAweDJjLCB1ODogMHgyZCwgaTE2OiAweDJlLCB1MTY6IDB4MmYgfSBhcyBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPixcbiAgc3RvcmU6IHsgaTMyOiAweDM2LCBpNjQ6IDB4MzcsIGYzMjogMHgzOCwgZjY0OiAweDM5LCBpODogMHgzYSwgdTg6IDB4M2EsIGkxNjogMHgzYiwgdTE2OiAweDNiIH0gYXMgUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4sXG4gIGFsaWduOiB7IGk4OiAwLCB1ODogMCwgaTE2OiAxLCB1MTY6IDEsIGkzMjogMiwgZjMyOiAyLCBpNjQ6IDMsIGY2NDogMyB9IGFzIFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+LFxuICB6ZXJvOiB7IGkzMjogWzB4NDEsIDBdLCBpNjQ6IFsweDQyLCAwXSwgZjMyOiBbMHg0MywgMCwgMCwgMCwgMF0sIGY2NDogWzB4NDQsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcltdPixcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBnbG9iYWxJbml0ID0gKHZhbHVlOiBBbnlHbG9iYWwpID0+XG4gIHZhbHVlLnR5cGUgPT09IFwiaTMyXCIgPyBbMHg0MSwgLi4uc04odmFsdWUuaW5pdGlhbCBhcyBudW1iZXIsIDMyKV0gOlxuICB2YWx1ZS50eXBlID09PSBcImk2NFwiID8gWzB4NDIsIC4uLnNOKHZhbHVlLmluaXRpYWwsIDY0KV0gOlxuICB2YWx1ZS50eXBlID09PSBcImYzMlwiID8gWzB4NDMsIC4uLmZOKHZhbHVlLmluaXRpYWwgYXMgbnVtYmVyLCA0KV0gOlxuICBbMHg0NCwgLi4uZk4odmFsdWUuaW5pdGlhbCBhcyBudW1iZXIsIDgpXVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5cbmNvbnN0IGFkZHIgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZSA9IGxheW91dC5lbGVtZW50U2l6ZSwgZmllbGRPZmZzZXQgPSAwKSA9PlxuICBpbmRleC5tdWwoc3RyaWRlKS5hZGQobGF5b3V0Lm9mZnNldCArIGZpZWxkT2Zmc2V0KVxuY29uc3QgbWVtYXJnID0gKHR5cGU6IE1lbW9yeVR5cGUsIG9mZnNldCA9IDApID0+IFsuLi51MzIoY29kZXMuYWxpZ25bdHlwZV0pLCAuLi51MzIob2Zmc2V0KV1cbmNvbnN0IGNvbnN0STMyID0gKGU6IEV4cHI8XCJpMzJcIj4pID0+IGUua2luZCA9PT0gXCJjb25zdFwiID8gZS52YWx1ZSA6IG51bGxcbmNvbnN0IGNoZWNrQXJyYXlCb3VuZHMgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgbiA9IGNvbnN0STMyKGluZGV4KVxuICBpZiAobiA9PSBudWxsKSByZXR1cm5cbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pIHx8IG4gPCAwIHx8IG4gPj0gbGF5b3V0Lmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBBcnJheSBpbmRleCAke259IG91dCBvZiBib3VuZHMgZm9yIGxlbmd0aCAke2xheW91dC5sZW5ndGh9YClcbn1cbmNvbnN0IGNoZWNrTW92ZUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgdmFsdWVzID0gW2NvbnN0STMyKHRhcmdldCksIGNvbnN0STMyKHNvdXJjZSksIGNvbnN0STMyKGNvdW50KV1cbiAgaWYgKHZhbHVlcy5zb21lKHZhbHVlID0+IHZhbHVlID09IG51bGwpKSByZXR1cm5cbiAgY29uc3QgW3RvLCBmcm9tLCBzaXplXSA9IHZhbHVlcyBhcyBudW1iZXJbXVxuICBpZiAodG8hIDwgMCB8fCBmcm9tISA8IDAgfHwgc2l6ZSEgPCAwIHx8IHRvISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aCB8fCBmcm9tISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IG1vdmUgKCR7dG99LCAke2Zyb219LCAke3NpemV9KSBvdXQgb2YgYm91bmRzIGZvciBsZW5ndGggJHtsYXlvdXQubGVuZ3RofWApXG59XG5cbmNvbnN0IG1ha2VDb21waWxlciA9IChcbiAgZml4OiBNYXA8QW55RnVuYywgbnVtYmVyPiwgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LCBhcnJheXM6IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+LFxuICB0cmFwczogTWFwPHN0cmluZywgbnVtYmVyPiwgbG9nczogTWFwPHN0cmluZywgbnVtYmVyPiwgZ2xvYmFsczogTWFwPEFueUdsb2JhbCwgbnVtYmVyPixcbikgPT4ge1xuY29uc3QgY29tcGlsZUV4cHIgPSAoZTogQW55RXhwcik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjpcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTMyXCIpIHJldHVybiBbMHg0MSwgLi4uc04oZS52YWx1ZSBhcyBudW1iZXIsIDMyKV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTY0XCIpIHJldHVybiBbMHg0MiwgLi4uc04oZS52YWx1ZSwgNjQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmMzJcIikgcmV0dXJuIFsweDQzLCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgNCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImY2NFwiKSByZXR1cm4gWzB4NDQsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA4KV1cbiAgICAgIHJldHVybiBkaWUoZSlcbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6XG4gICAgICByZXR1cm4gWzB4MjAsIC4uLnUzMihsaXhbZS5sb2NhbF0hKV1cbiAgICBjYXNlIFwiZ2xvYmFsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIzLCAuLi51MzIoZ2xvYmFscy5nZXQoZSkhKV1cbiAgICBjYXNlIFwiYmluXCI6IHtcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0KSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCksIG9wY29kZShlLm9wLCBlLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQpLCBvcGNvZGUoZS5vcCwgZS5pbnB1dFR5cGUpXVxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICByZXR1cm4gWy4uLmZsYXRNYXAoZS5hcmdzLCBjb21waWxlRXhwciksIDB4MTAsIC4uLnUzMihmaXguZ2V0KGUudGFyZ2V0KSEgKyAyKV1cbiAgICBjYXNlIFwiY2FzdFwiOiB7XG4gICAgICBjb25zdCBmcm9tID0gZS5pbnB1dFR5cGUgYXMgTnVtVHlwZVxuICAgICAgY29uc3QgdG8gPSBlLnR5cGUgYXMgTnVtVHlwZVxuICAgICAgbGV0IG9wY29kZTogbnVtYmVyIHwgdW5kZWZpbmVkXG4gICAgICBpZiAodG8gPT09IFwiaTMyXCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhhN1xuICAgICAgaWYgKHRvID09PSBcImkzMlwiICYmIGZyb20gPT09IFwiZjMyXCIpIG9wY29kZSA9IDB4YThcbiAgICAgIGlmICh0byA9PT0gXCJpMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGFhXG4gICAgICBpZiAodG8gPT09IFwiaTY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gZS51bnNpZ25lZCA/IDB4YWQgOiAweGFjXG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiMlxuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjRcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImY2NFwiKSBvcGNvZGUgPSAweGI2XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJpMzJcIikgb3Bjb2RlID0gMHhiN1xuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiaTY0XCIpIG9wY29kZSA9IDB4YjlcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImYzMlwiKSBvcGNvZGUgPSAweGJiXG4gICAgICBpZiAob3Bjb2RlID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgY2FzdCAke2Zyb219IC0+ICR7dG99YClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS52YWx1ZSksIG9wY29kZV1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUuY29uZCksIDB4MDQsIGNvZGVzLnR5cGVbZS50eXBlIGFzIE51bVR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4pLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQoZS5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtlLmFycmF5fWApXG4gICAgICBjaGVja0FycmF5Qm91bmRzKGxheW91dCwgZS5pbmRleClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIGUuaW5kZXgsIGUuc3RyaWRlLCBlLm9mZnNldCkpLCBjb2Rlcy5sb2FkW2Uuc3RvcmFnZSBhcyBNZW1vcnlUeXBlXSwgLi4ubWVtYXJnKGUuc3RvcmFnZSBhcyBNZW1vcnlUeXBlKV1cbiAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUoZSlcbiAgfVxufVxuXG50eXBlIExhYmVsRnJhbWUgPSB7IGNvbnRyb2w/OiBudW1iZXIsIGtpbmQ/OiBcImJyZWFrXCIgfCBcImNvbnRpbnVlXCIgfVxuY29uc3QgZGVwdGggPSAoc3RhY2s6IExhYmVsRnJhbWVbXSwgY29udHJvbDogbnVtYmVyLCBraW5kOiBOb25OdWxsYWJsZTxMYWJlbEZyYW1lW1wia2luZFwiXT4pID0+IHtcbiAgY29uc3QgaSA9IHN0YWNrLmZpbmRJbmRleCh4ID0+IHguY29udHJvbCA9PT0gY29udHJvbCAmJiB4LmtpbmQgPT09IGtpbmQpXG4gIGlmIChpIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duICR7a2luZH0gdGFyZ2V0ICR7Y29udHJvbH1gKVxuICByZXR1cm4gaVxufVxuXG5jb25zdCBjb21waWxlU3RtdCA9IChzOiBTdG10LCBzdGFjazogTGFiZWxGcmFtZVtdID0gW10pOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAocy5raW5kKSB7XG4gICAgY2FzZSBcImxvY2FsLnNldFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgMHgyMSwgLi4udTMyKGxpeFtzLmxvY2FsXSEpXVxuICAgIGNhc2UgXCJnbG9iYWwuc2V0XCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMudmFsdWUpLCAweDI0LCAuLi51MzIoZ2xvYmFscy5nZXQocy5nbG9iYWwpISldXG4gICAgY2FzZSBcImFycmF5LnN0b3JlXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQocy5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtzLmFycmF5fWApXG4gICAgICBjaGVja0FycmF5Qm91bmRzKGxheW91dCwgcy5pbmRleClcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIHMuaW5kZXgsIHMuc3RyaWRlLCBzLm9mZnNldCkpLCAuLi5jb21waWxlRXhwcihzLnZhbHVlKSwgY29kZXMuc3RvcmVbcy50eXBlXSwgLi4ubWVtYXJnKHMudHlwZSldXG4gICAgfVxuICAgIGNhc2UgXCJhcnJheS5tb3ZlXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5cy5nZXQocy5hcnJheSlcbiAgICAgIGlmICghbGF5b3V0KSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXJyYXkgJHtzLmFycmF5fWApXG4gICAgICBjaGVja01vdmVCb3VuZHMobGF5b3V0LCBzLnRhcmdldCwgcy5zb3VyY2UsIHMuY291bnQpXG4gICAgICByZXR1cm4gW1xuICAgICAgICAuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy50YXJnZXQpKSxcbiAgICAgICAgLi4uY29tcGlsZUV4cHIoYWRkcihsYXlvdXQsIHMuc291cmNlKSksXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKHMuY291bnQubXVsKGxheW91dC5lbGVtZW50U2l6ZSkpLFxuICAgICAgICAweGZjLCAweDBhLCAweDAwLCAweDAwLFxuICAgICAgXVxuICAgIH1cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy5jb25kKSwgMHgwNCwgMHg0MCwgLi4uZmxhdE1hcChzLnRoZW4sIHggPT4gY29tcGlsZVN0bXQoeCwgW3t9LCAuLi5zdGFja10pKSwgLi4uKHMuZWxzZS5sZW5ndGggPyBbMHgwNSwgLi4uZmxhdE1hcChzLmVsc2UsIHggPT4gY29tcGlsZVN0bXQoeCwgW3t9LCAuLi5zdGFja10pKV0gOiBbXSksIDB4MGJdXG4gICAgY2FzZSBcImJsb2NrXCI6XG4gICAgICByZXR1cm4gWzB4MDIsIDB4NDAsIC4uLmZsYXRNYXAocy5ib2R5LCB4ID0+IGNvbXBpbGVTdG10KHgsIFt7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJicmVha1wiIH0sIC4uLnN0YWNrXSkpLCAweDBiXVxuICAgIGNhc2UgXCJsb29wXCI6XG4gICAgICByZXR1cm4gWzB4MDIsIDB4NDAsIDB4MDMsIDB4NDAsIC4uLmNvbXBpbGVFeHByKHMuY29uZCksIDB4NDUsIDB4MGQsIC4uLnUzMigxKSwgLi4uZmxhdE1hcChzLmJvZHksIHggPT4gY29tcGlsZVN0bXQoeCwgW3sgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImNvbnRpbnVlXCIgfSwgeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiYnJlYWtcIiB9LCAuLi5zdGFja10pKSwgMHgwYywgLi4udTMyKDApLCAweDBiLCAweDBiXVxuICAgIGNhc2UgXCJicmVha1wiOlxuICAgICAgaWYgKHMudGFyZ2V0ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcImJyZWFrVG8oKSB1c2VkIG91dHNpZGUgYSBibG9jayBvciBsb29wXCIpXG4gICAgICByZXR1cm4gWzB4MGMsIC4uLnUzMihkZXB0aChzdGFjaywgcy50YXJnZXQsIFwiYnJlYWtcIikpXVxuICAgIGNhc2UgXCJjb250aW51ZVwiOlxuICAgICAgaWYgKHMudGFyZ2V0ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcImNvbnRpbnVlVG8oKSB1c2VkIG91dHNpZGUgYSBsb29wXCIpXG4gICAgICByZXR1cm4gWzB4MGMsIC4uLnUzMihkZXB0aChzdGFjaywgcy50YXJnZXQsIFwiY29udGludWVcIikpXVxuICAgIGNhc2UgXCJyZXR1cm5cIjpcbiAgICAgIHJldHVybiBbLi4uKHMudmFsdWUgPyBjb21waWxlRXhwcihzLnZhbHVlKSA6IFtdKSwgMHgwZl1cbiAgICBjYXNlIFwidHJhcFwiOlxuICAgICAgcmV0dXJuIFsweDQxLCAuLi5zTih0cmFwcy5nZXQocy5tZXNzYWdlKSEsIDMyKSwgMHgxMCwgMHgwMF1cbiAgICBjYXNlIFwibG9nXCI6XG4gICAgICByZXR1cm4gWzB4NDEsIC4uLnNOKGxvZ3MuZ2V0KHMubWVzc2FnZSkhLCAzMiksIC4uLmNvbXBpbGVFeHByKHMudmFsdWUpLCAweDEwLCAweDAxXVxuICAgIGNhc2UgXCJjYWxsLnZvaWRcIjpcbiAgICAgIHJldHVybiBbLi4uZmxhdE1hcChzLmFyZ3MsIGNvbXBpbGVFeHByKSwgMHgxMCwgLi4udTMyKGZpeC5nZXQocy50YXJnZXQpISArIDIpXVxuICAgIGNhc2UgXCJleHByXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMuZXhwciksIDB4MWFdXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUocylcbiAgfVxufVxucmV0dXJuIHsgZXhwcjogY29tcGlsZUV4cHIsIHN0bXQ6IGNvbXBpbGVTdG10IH1cbn1cblxuXG5leHBvcnQgY29uc3QgZW1pdE1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPih7IGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIGdsb2JhbHMsIHRyYXBNZXNzYWdlcywgbG9nTWVzc2FnZXMsIHBhZ2VzIH06IE1vZHVsZUFuYWx5c2lzPFQ+KSA9PiB7XG4gIGNvbnN0IHRyYXBzID0gbmV3IE1hcCh0cmFwTWVzc2FnZXMubWFwKChtZXNzYWdlLCBpZCkgPT4gW21lc3NhZ2UsIGlkXSkpXG4gIGNvbnN0IGxvZ3MgPSBuZXcgTWFwKGxvZ01lc3NhZ2VzLm1hcCgobWVzc2FnZSwgaWQpID0+IFttZXNzYWdlLCBpZF0pKVxuICBjb25zdCBmdW5jdGlvblNlY3Rpb24gPSBidWlsdEZ1bmNzLmZsYXRNYXAoKF8sIGkpID0+IHUzMihpICsgMikpXG4gIGNvbnN0IGV4cG9ydFNlY3Rpb24gPSBmRW50cmllcy5mbGF0TWFwKChbbmFtZSwgZnVuY10pID0+IFsuLi5zdHIobmFtZSksIDB4MDAsIC4uLnUzMihmaXguZ2V0KGZ1bmMpISArIDIpXSlcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFtcbiAgICAuLi5tYWdpYyxcbiAgICAuLi5zZWN0aW9uKDB4MDEsIFsuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGggKyAyKSxcbiAgICAgIDB4NjAsIDB4MDEsIGNvZGVzLnR5cGUuaTMyLCAweDAwLFxuICAgICAgMHg2MCwgMHgwMiwgY29kZXMudHlwZS5pMzIsIGNvZGVzLnR5cGUuaTMyLCAweDAwLFxuICAgICAgLi4uZmxhdE1hcChidWlsdEZ1bmNzLCAoeyBmdW5jIH0pID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzdWx0VHlwZShmdW5jLnJlc3VsdClcbiAgICAgICAgcmV0dXJuIFsweDYwLCAuLi51MzIoZnVuYy5wYXJhbXMubGVuZ3RoKSwgLi4uZnVuYy5wYXJhbXMubWFwKHQgPT4gY29kZXMudHlwZVt0XSksIC4uLihyZXN1bHQgPT09IFwidm9pZFwiID8gWzB4MDBdIDogWzB4MDEsIGNvZGVzLnR5cGVbcmVzdWx0XV0pXVxuICAgICAgfSldKSxcbiAgICAuLi5zZWN0aW9uKDB4MDIsIFtcbiAgICAgIDB4MDMsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJ0cmFwXCIpLFxuICAgICAgMHgwMCxcbiAgICAgIDB4MDAsXG4gICAgICAuLi5zdHIoXCJlbnZcIiksXG4gICAgICAuLi5zdHIoXCJsb2dcIiksXG4gICAgICAweDAwLFxuICAgICAgMHgwMSxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcIm1lbW9yeVwiKSxcbiAgICAgIDB4MDIsXG4gICAgICAweDAzLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICAgIC4uLnUzMihwYWdlcyksXG4gICAgXSksXG4gICAgLi4uc2VjdGlvbigweDAzLCBbLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSwgLi4uZnVuY3Rpb25TZWN0aW9uXSksXG4gICAgLi4uKGdsb2JhbHMuc2l6ZSA/IHNlY3Rpb24oMHgwNiwgWy4uLnUzMihnbG9iYWxzLnNpemUpLCAuLi5bLi4uZ2xvYmFsc10uZmxhdE1hcCgoW3ZhbHVlXSkgPT4gW2NvZGVzLnR5cGVbdmFsdWUudHlwZV0sIDB4MDEsIC4uLmdsb2JhbEluaXQodmFsdWUpLCAweDBiXSldKSA6IFtdKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZXhwb3J0U2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgYnVpbHQsIGxvY2FscywgbG9jYWxJbmRleGVzIH0pID0+IHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBtYWtlQ29tcGlsZXIoZml4LCBsb2NhbEluZGV4ZXMsIGxheW91dHMsIHRyYXBzLCBsb2dzLCBnbG9iYWxzKVxuICAgICAgICBjb25zdCBzdG10cyA9IGFzU3RtdHMoYnVpbHQpXG4gICAgICAgIGNvbnN0IGRlY2xzID0gWy4uLnUzMihsb2NhbHMubGVuZ3RoKSwgLi4uZmxhdE1hcChsb2NhbHMsIChbLCB0eXBlXSkgPT4gWy4uLnUzMigxKSwgY29kZXMudHlwZVt0eXBlXV0pXVxuICAgICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRUeXBlKGZ1bmMucmVzdWx0KVxuICAgICAgICBjb25zdCBjb2RlID0gc3RtdHNcbiAgICAgICAgICA/IFsuLi5mbGF0TWFwKHN0bXRzLCBzID0+IGNvbXBpbGVyLnN0bXQocykpLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFtdIDogY29kZXMuemVyb1tyZXN1bHRdKV1cbiAgICAgICAgICA6IGNvbXBpbGVyLmV4cHIoYnVpbHQgYXMgQW55RXhwcilcbiAgICAgICAgY29uc3QgYm9keSA9IFsuLi5kZWNscywgLi4uY29kZSwgMHgwYl1cbiAgICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgICAgfSksXG4gICAgXSksXG4gIF0pXG59XG4iLAogICAgImV4cG9ydCAqIGZyb20gXCIuL2FzdFwiXG5leHBvcnQgeyBmb3JtYXRNb2R1bGUgfSBmcm9tIFwiLi9mb3JtYXRcIlxuXG5pbXBvcnQgeyBhbmFseXplTW9kdWxlIH0gZnJvbSBcIi4vYW5hbHl6ZVwiXG5pbXBvcnQgeyBlbWl0TW9kdWxlIH0gZnJvbSBcIi4vY29kZWdlblwiXG5pbXBvcnQgdHlwZSB7XG4gIEFueUFycmF5LCBBbnlGdW5jLCBDb21waWxlUmVzdWx0LCBKU1N0cnVjdCwgTW9kdWxlRGVmLCBTdHJ1Y3RGaWVsZHMsIFN0cnVjdFR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGFycmF5Q3RvcnMgPSB7XG4gIGk4OiBJbnQ4QXJyYXksIHU4OiBVaW50OEFycmF5LCBpMTY6IEludDE2QXJyYXksIHUxNjogVWludDE2QXJyYXksXG4gIGkzMjogSW50MzJBcnJheSwgaTY0OiBCaWdJbnQ2NEFycmF5LCBmMzI6IEZsb2F0MzJBcnJheSwgZjY0OiBGbG9hdDY0QXJyYXksXG4gIHN1ODogVWludDhBcnJheSwgc3UxNjogVWludDE2QXJyYXksIHNpMzI6IFVpbnQzMkFycmF5LCBzaTY0OiBCaWdVaW50NjRBcnJheSxcbn1cblxuZXhwb3J0IGNvbnN0IGRlY29kZVN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCByYXc6IG51bWJlciB8IGJpZ2ludCk6IEpTU3RydWN0PEY+ID0+IHtcbiAgY29uc3QgcGFja2VkID0gQmlnSW50LmFzVWludE4odHlwZS5zaXplICogOCwgQmlnSW50KHJhdykpXG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXModHlwZS5sYXlvdXQpLm1hcCgoW25hbWUsIGZpZWxkXSkgPT4ge1xuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgbGV0IHZhbHVlID0gKHBhY2tlZCA+PiBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkgJiBtYXNrXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgdmFsdWUgJiAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMgLSAxKSkpXG4gICAgICB2YWx1ZSAtPSAxbiA8PCBCaWdJbnQoZmllbGQuYml0cylcbiAgICByZXR1cm4gW25hbWUsIGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSldXG4gIH0pKSBhcyBKU1N0cnVjdDxGPlxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihcbiAgbW9kOiBULFxuKTogUHJvbWlzZTxDb21waWxlUmVzdWx0PFQ+PiA9PiB7XG4gIGNvbnN0IGFuYWx5c2lzID0gYW5hbHl6ZU1vZHVsZShtb2QpXG4gIGNvbnN0IG1lbW9yeSA9IG5ldyBXZWJBc3NlbWJseS5NZW1vcnkoe1xuICAgIGluaXRpYWw6IGFuYWx5c2lzLnBhZ2VzLFxuICAgIG1heGltdW06IGFuYWx5c2lzLnBhZ2VzLFxuICAgIHNoYXJlZDogdHJ1ZSxcbiAgfSlcbiAgY29uc3QgY29tcGlsZWQgPSBhd2FpdCBXZWJBc3NlbWJseS5jb21waWxlKGVtaXRNb2R1bGUoYW5hbHlzaXMpLmJ1ZmZlcilcbiAgY29uc3QgdHJhcCA9IChpZDogbnVtYmVyKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYW5hbHlzaXMudHJhcE1lc3NhZ2VzW2lkXSA/PyBgVW5rbm93biBXQVNNIHRyYXAgJHtpZH1gKSB9XG4gIGNvbnN0IGxvZyA9IChpZDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBjb25zb2xlLmxvZyhhbmFseXNpcy5sb2dNZXNzYWdlc1tpZF0gPz8gYFdBU00gbG9nICR7aWR9YCwgdmFsdWUpXG4gIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoY29tcGlsZWQsIHsgZW52OiB7IG1lbW9yeSwgdHJhcCwgbG9nIH0gfSlcbiAgY29uc3QgZnVuY0VudHJpZXMgPSBPYmplY3QuZW50cmllcyhhbmFseXNpcy5mdW5jcykgYXMgW3N0cmluZywgQW55RnVuY11bXVxuICBjb25zdCBqc0Z1bmNzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LCByZXN1bHRTdHJ1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBTdHJ1Y3RUeXBlPGFueT4+ID0ge31cbiAgZm9yIChjb25zdCBbbmFtZSwgZnVuY10gb2YgZnVuY0VudHJpZXMpIHtcbiAgICBjb25zdCB3YXNtRnVuYyA9IGluc3RhbmNlLmV4cG9ydHNbbmFtZV0gYXMgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gbnVtYmVyIHwgYmlnaW50XG4gICAganNGdW5jc1tuYW1lXSA9IHdhc21GdW5jXG4gICAgaWYgKHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmVzdWx0U3RydWN0c1tuYW1lXSA9IGZ1bmMucmVzdWx0XG4gICAgICBqc0Z1bmNzW25hbWVdID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gZGVjb2RlU3RydWN0KGZ1bmMucmVzdWx0IGFzIFN0cnVjdFR5cGU8YW55Piwgd2FzbUZ1bmMoLi4uYXJncykpXG4gICAgfVxuICB9XG4gIGNvbnN0IGpzQXJyYXlzID0gKE9iamVjdC5lbnRyaWVzKGFuYWx5c2lzLmFycmF5cykgYXMgW3N0cmluZywgQW55QXJyYXldW10pLm1hcCgoW25hbWUsIGFycl0pID0+IHtcbiAgICBjb25zdCBsYXlvdXQgPSBhbmFseXNpcy5sYXlvdXRzLmdldChhcnIpIVxuICAgIGNvbnN0IGtleSA9IHR5cGVvZiBhcnIudHlwZSA9PT0gXCJzdHJpbmdcIiA/IGFyci50eXBlIDogYHMke2Fyci50eXBlLnN0b3JhZ2V9YFxuICAgIGNvbnN0IEN0b3IgPSBhcnJheUN0b3JzW2tleSBhcyBrZXlvZiB0eXBlb2YgYXJyYXlDdG9yc11cbiAgICByZXR1cm4gW25hbWUsIG5ldyBDdG9yKG1lbW9yeS5idWZmZXIsIGxheW91dC5vZmZzZXQsIGFyci5sZW5ndGgpXSBhcyBjb25zdFxuICB9KVxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihqc0Z1bmNzLCBPYmplY3QuZnJvbUVudHJpZXMoanNBcnJheXMpLCB7XG4gICAgbW9kOiBjb21waWxlZCwgbWVtb3J5LCByZXN1bHRTdHJ1Y3RzLFxuICAgIHRyYXBNZXNzYWdlczogYW5hbHlzaXMudHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlczogYW5hbHlzaXMubG9nTWVzc2FnZXMsXG4gIH0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgYXJyYXksIGNvbXBpbGUsIGV4cCwgZjMyLCBmdW5jLCBnbG9iYWwsIGkzMiwgaTY0dSwgaWZFbHNlLCBsaXQsIGxvY2FsLCBsb2csIGxvb3AsIHJldCwgc3RydWN0LCB0cmFwLCB0eXBlIEFueUFycmF5LCB0eXBlIEFycmF5SGFuZGxlLCB0eXBlIERUeXBlLCB0eXBlIEV4cHIsIHR5cGUgRXhwckxpa2UsIHR5cGUgU3RtdCwgdHlwZSBTdG10Qm9keSB9IGZyb20gXCIuLi93YXNtXCJcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCJcbmltcG9ydCB7IEFWR19TUEVFRF9LTUgsIElORiwgS01fQ09TVF9DRU5UUywgUkVPUkdfQ09TVF9DRU5UUyB9IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIlxuXG5jb25zdCBTRUFSQ0hfU1RFUFMgPSAxXzYwMF8wMDBcbmNvbnN0IFRFTVBfUEhBU0VTID0gMV8wMDBcbmNvbnN0IFNURVBTX1BFUl9QSEFTRSA9IE1hdGguZmxvb3IoU0VBUkNIX1NURVBTIC8gVEVNUF9QSEFTRVMpXG5jb25zdCBTVEFSVF9URU1QX0NFTlRTID0gNV8wMDBcbmNvbnN0IEVORF9URU1QX0NFTlRTID0gMFxuXG5jb25zdCBERUJVRyA9IGZhbHNlXG5cbmZ1bmN0aW9uIGRlYnVnICh0YWc6IHN0cmluZywgdmFsdWU6IEV4cHJMaWtlPFwiaTMyXCI+KXtcbiAgaWYgKCFERUJVRykgcmV0dXJuIFtdXG4gIHJldHVybiBbIGxvZyh0YWcsIHZhbHVlKSBdXG59XG5cbmZ1bmN0aW9uIGNoZWNrZWRBcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBjb25zdCBhcnIgPSBhcnJheSh0eXBlLCBsZW5ndGgpIGFzIEFueUFycmF5XG4gIGlmICghREVCVUcpIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cblxuICBjb25zdCB7YXQsIG1vdmV9ID0gYXJyXG4gIGNvbnN0IGNoZWNrSWR4ID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFwiaTMyXCIsIChpLG4pPT4gaWZFbHNlKFxuICAgICAgaS5sdCgwKS5vcihuLmx0KDApKS5vciAobi5hZGQoaSkuZ3QoYXJyLmxlbmd0aCkpLFxuICAgICAgdHJhcCggXCJhcnJheSBib3VuZHMgZXhjZWVkZWRcIiksXG4gICAgICByZXQoaSlcbiAgICApXG4gICk7XG4gIGFyci5hdCA9IGluZGV4ID0+IGF0KGNoZWNrSWR4LmNhbGwoaW5kZXgsIDEpKVxuICBhcnIubW92ZSA9ICh0YXJnZXQsIHNvdXJjZSwgY291bnQpID0+IG1vdmUoXG4gICAgY2hlY2tJZHguY2FsbCh0YXJnZXQsIGNvdW50KSxcbiAgICBjaGVja0lkeC5jYWxsKHNvdXJjZSwgY291bnQpLFxuICAgIGNvdW50LFxuICApXG4gIHJldHVybiBhcnIgYXMgQXJyYXlIYW5kbGU8VD5cbn1cblxuZnVuY3Rpb24gZm9yTihuOiBudW1iZXIsIGJvZHk6IChpOiBFeHByPFwiaTMyXCI+KSA9PiBTdG10Qm9keSk6IFN0bXRCb2R5IHtcbiAgY29uc3QgaSA9IGxvY2FsKFwiaTMyXCIpXG4gIHJldHVybiBbaS5zZXQoMCksIGxvb3AoaS5sdChuKSwgW2JvZHkoaSksIGkuaWFkZCgxKV0pXVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYW5uZWFsaW5nV2FzbShwbGFubmVyOiBNb2R1bGUpOiBQcm9taXNlPEFubmVhbGluZ1Jlc3VsdD4ge1xuICBjb25zdCBUU0laRSA9IE1hdGguZmxvb3IocGxhbm5lci5OUkVRUyAvIHBsYW5uZXIuTlRSQU5TICogMi41ICogMiArIDEwKVxuICBjb25zdCBOUE9JTlRTID0gcGxhbm5lci5yb2FkbWFwLnBvaW50cy5sZW5ndGhcbiAgY29uc3QgU1RPUCA9IHN0cnVjdCh7XG4gICAgcmVxX2lkOiBbXCJ1MTZcIiwgMTBdLFxuICAgIGlzX2xvYWQ6IFtcInU4XCIsIDFdLFxuICAgIGRlY2s6IFtcInU4XCIsIDFdLFxuICB9KVxuICBjb25zdCBSRVEgPSBzdHJ1Y3Qoe1xuICAgIHN0YXJ0OiBcInUxNlwiLFxuICAgIGVuZDogXCJ1MTZcIixcbiAgICB2YWx1ZTogXCJ1MTZcIixcbiAgICBkZWFkbGluZTogXCJ1MTZcIixcbiAgfSlcblxuICBjb25zdCByYW5kU3RhdGUgICAgICA9IGdsb2JhbChcImkzMlwiLCAxKVxuICBjb25zdCBkaXN0cyAgICAgICAgICA9IGNoZWNrZWRBcnJheShcImkzMlwiLCBwbGFubmVyLlJTSVpFKVxuICBjb25zdCByZXF1ZXN0cyAgICAgICA9IGNoZWNrZWRBcnJheShSRVEsIHBsYW5uZXIuTlJFUVMpXG4gIGNvbnN0IGFzc2lnbmVkICAgICAgID0gY2hlY2tlZEFycmF5KFwidThcIiwgcGxhbm5lci5OUkVRUylcbiAgY29uc3Qgc2NoZWR1bGUgICAgICAgPSBjaGVja2VkQXJyYXkoU1RPUCwgcGxhbm5lci5OVFJBTlMgKiBUU0laRSlcbiAgY29uc3Qgc2NoZWRfc2l6ZSAgICAgPSBjaGVja2VkQXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHJhdGluZ3MgICAgICAgID0gY2hlY2tlZEFycmF5KFwiaTMyXCIsIHBsYW5uZXIuTlRSQU5TKVxuICBjb25zdCB0cmFuX3Bvc2l0aW9ucyA9IGNoZWNrZWRBcnJheShcImkxNlwiLCBwbGFubmVyLk5UUkFOUylcblxuICBjb25zdCByYW5kTmV4dCA9IGZ1bmMoW10sIFwiaTMyXCIsICgpID0+IHtcbiAgICByZXR1cm4gW1xuICAgICAgcmFuZFN0YXRlLnNldChyYW5kU3RhdGUueG9yKHJhbmRTdGF0ZS5zaGwoMTMpKSksXG4gICAgICByYW5kU3RhdGUuc2V0KHJhbmRTdGF0ZS54b3IocmFuZFN0YXRlLnNocigxNykpKSxcbiAgICAgIHJhbmRTdGF0ZS5zZXQocmFuZFN0YXRlLnhvcihyYW5kU3RhdGUuc2hsKDUpKSksXG4gICAgICByZXQocmFuZFN0YXRlKSxcbiAgICBdXG4gIH0pXG4gIGNvbnN0IHJhbmRpbnQgPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgbWF4ID0+XG4gICAgaTMyKGk2NHUocmFuZE5leHQuY2FsbCgpKS5tdWwoaTY0dShtYXgpKS5zaHIoMzJuKSkpXG4gIGNvbnN0IGFjY2VwdEFubmVhbCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAocHJldmlvdXMsIG5leHQsIHRlbXBlcmF0dXJlKSA9PiBbXG4gICAgaWZFbHNlKHByZXZpb3VzLmd0KG5leHQpLFxuICAgICAgcmV0KHJhbmRpbnQuY2FsbCgxXzAwMF8wMDApLmx0KGkzMihleHAoXG4gICAgICAgIGYzMihuZXh0LnN1YihwcmV2aW91cykpLmRpdihmMzIodGVtcGVyYXR1cmUpKSxcbiAgICAgICkubXVsKDFfMDAwXzAwMCkpKSksXG4gICAgICByZXQoMSksXG4gICAgKSxcbiAgXSlcblxuICBjb25zdCByb2FkQ29zdCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoZnJvbSwgdG8pID0+IHtcbiAgICBjb25zdCBhID0gbG9jYWwoXCJpMzJcIiksIGIgPSBsb2NhbChcImkzMlwiKSwgdG1wID0gbG9jYWwoXCJpMzJcIiksIGluZGV4ID0gbG9jYWwoXCJpMzJcIilcbiAgICByZXR1cm4gW1xuICAgICAgYS5zZXQoZnJvbSksIGIuc2V0KHRvKSxcbiAgICAgIGlmRWxzZShhLmx0KGIpLCBbdG1wLnNldChhKSwgYS5zZXQoYiksIGIuc2V0KHRtcCldKSxcbiAgICAgIGluZGV4LnNldChhLmFkZChiLm11bChOUE9JTlRTKSkpLFxuICAgICAgaWZFbHNlKGluZGV4Lmd0KHBsYW5uZXIuUlNJWkUpLCBpbmRleC5zZXQoaTMyKE5QT0lOVFMgKiogMikuc3ViKGluZGV4KSkpLFxuICAgICAgcmV0KGRpc3RzLmF0KGluZGV4KSksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IHRyeUFzc2lnbiA9IGZ1bmMoW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHJlcV9pZCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQiA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG1wID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0c2l6ZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG9mZnNldCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgcHJldmlvdXNTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgbmV4dFNjb3JlID0gbG9jYWwoXCJpMzJcIilcblxuICAgIGNvbnN0IHNjaGVkVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pOiBTdG10Qm9keSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHRvZmZzZXQuYWRkKHRhcmdldCksIHRvZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHRvZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHRyYW4uc2V0KHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUykpLFxuICAgICAgcmVxX2lkLnNldChyYW5kaW50LmNhbGwocGxhbm5lci5OUkVRUykpLFxuICAgICAgaWZFbHNlKGFzc2lnbmVkLmF0KHJlcV9pZCkuZXEoMSksIHJldCgpKSxcbiAgICAgIHRvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICB0c2l6ZS5zZXQoc2NoZWRfc2l6ZS5hdCh0cmFuKSksXG4gICAgICBpZkVsc2UodHNpemUuZ3QoVFNJWkUgLSAyKSwgcmV0KCkpLFxuICAgICAgcHJldmlvdXNTY29yZS5zZXQocmF0aW5ncy5hdCh0cmFuKSksXG4gICAgICBBLnNldChyYW5kaW50LmNhbGwodHNpemUuYWRkKDEpKSksXG4gICAgICBCLnNldChBLmFkZChyYW5kaW50LmNhbGwoNCkpKSxcbiAgICAgIGlmRWxzZShCLmd0KHRzaXplKSwgQi5zZXQodHNpemUpKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIuYWRkKDIpLCBCLCB0c2l6ZS5zdWIoQikpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQS5hZGQoMSksIEEsIEIuc3ViKEEpKSxcbiAgICAgIHRtcC5zZXQocmFuZGludC5jYWxsKDIpKSxcbiAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQsIGlzX2xvYWQ6IDEsIGRlY2s6IHRtcCB9KSxcbiAgICAgIHNjaGVkVmlldy5hdChCLmFkZCgxKSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAwLCBkZWNrOiB0bXAgfSksXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5hZGQoMikpLFxuICAgICAgbmV4dFNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgIGlmRWxzZShhY2NlcHRBbm5lYWwuY2FsbChwcmV2aW91c1Njb3JlLCBuZXh0U2NvcmUsIHRlbXBlcmF0dXJlKSxcbiAgICAgICAgW2Fzc2lnbmVkLmF0KHJlcV9pZCkuc2V0KDEpLCByYXRpbmdzLmF0KHRyYW4pLnNldChuZXh0U2NvcmUpXSxcbiAgICAgICAgW1xuICAgICAgICAgIHNjaGVkVmlldy5tb3ZlKEEsIEEuYWRkKDEpLCBCLnN1YihBKSksXG4gICAgICAgICAgc2NoZWRWaWV3Lm1vdmUoQiwgQi5hZGQoMiksIHRzaXplLnN1YihCKSksXG4gICAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQodHNpemUpLFxuICAgICAgICBdLFxuICAgICAgKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgcmF0ZVRyYW4gPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgdHJhbiA9PiB7XG4gICAgY29uc3QgcmV3YXJkID0gbG9jYWwoXCJpMzJcIiksIGNvc3QgPSBsb2NhbChcImkzMlwiKSwgZWxhcHNlZE1pbnV0ZXMgPSBsb2NhbChcImkzMlwiKSwgZGlzdGFuY2UgPSBsb2NhbChcImkzMlwiKSwgcG9zID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBvZmZzZXQgPSBsb2NhbChcImkzMlwiKSwgc2l6ZSA9IGxvY2FsKFwiaTMyXCIpLCBpID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBkZWNrMCA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrMSA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrU2l6ZTAgPSBsb2NhbChcImkzMlwiKSwgZGVja1NpemUxID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBkZWNrID0gbG9jYWwoXCJpMzJcIiksIGRlY2tTaXplID0gbG9jYWwoXCJpMzJcIiksIHJlcSA9IGxvY2FsKFwiaTMyXCIpLCBuZXh0UG9zID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBmb3VuZCA9IGxvY2FsKFwiaTMyXCIpLCBzaGlmdCA9IGxvY2FsKFwiaTMyXCIpLCBsb3dlck1hc2sgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHN0ZXAgPSBsb2NhbChTVE9QKSwgcmVxdWVzdCA9IGxvY2FsKFJFUSlcbiAgICByZXR1cm4gW1xuICAgICAgcG9zLnNldCh0cmFuX3Bvc2l0aW9ucy5hdCh0cmFuKSksXG4gICAgICBvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICBzaXplLnNldChzY2hlZF9zaXplLmF0KHRyYW4pKSxcbiAgICAgIGxvb3AoaS5sdChzaXplKSwgW1xuICAgICAgICBzdGVwLnNldChzY2hlZHVsZS5hdChvZmZzZXQuYWRkKGkpKSksXG4gICAgICAgIHJlcS5zZXQoc3RlcC5yZXFfaWQpLFxuICAgICAgICByZXF1ZXN0LnNldChyZXF1ZXN0cy5hdChyZXEpKSxcbiAgICAgICAgbmV4dFBvcy5zZXQoaWZFbHNlKHN0ZXAuaXNfbG9hZCwgcmVxdWVzdC5zdGFydCwgcmVxdWVzdC5lbmQpKSxcbiAgICAgICAgZGlzdGFuY2Uuc2V0KHJvYWRDb3N0LmNhbGwocG9zLCBuZXh0UG9zKSksXG4gICAgICAgIGNvc3QuaWFkZChkaXN0YW5jZS5tdWwoS01fQ09TVF9DRU5UUykpLFxuICAgICAgICBlbGFwc2VkTWludXRlcy5pYWRkKGRpc3RhbmNlLm11bCg2MCkuZGl2KEFWR19TUEVFRF9LTUgpKSxcbiAgICAgICAgcG9zLnNldChuZXh0UG9zKSxcbiAgICAgICAgZGVjay5zZXQoaWZFbHNlKHN0ZXAuZGVjaywgZGVjazEsIGRlY2swKSksXG4gICAgICAgIGRlY2tTaXplLnNldChpZkVsc2Uoc3RlcC5kZWNrLCBkZWNrU2l6ZTEsIGRlY2tTaXplMCkpLFxuICAgICAgICBpZkVsc2Uoc3RlcC5pc19sb2FkLCBbXG4gICAgICAgICAgaWZFbHNlKGRlY2tTaXplLmd0KDIpLCByZXQoLUlORikpLFxuICAgICAgICAgIGRlY2suc2V0KGRlY2sub3IocmVxLnNobChkZWNrU2l6ZS5tdWwoMTApKSkpLFxuICAgICAgICAgIGRlY2tTaXplLmlhZGQoMSksXG4gICAgICAgIF0sIFtcbiAgICAgICAgICBmb3VuZC5zZXQoLTEpLFxuICAgICAgICAgIGlmRWxzZShkZWNrU2l6ZS5ndCgwKS5hbmQoZGVjay5hbmQoMTAyMykuZXEocmVxKSksIGZvdW5kLnNldCgwKSksXG4gICAgICAgICAgaWZFbHNlKGZvdW5kLmVxKC0xKS5hbmQoZGVja1NpemUuZ3QoMSkpLmFuZChkZWNrLnNocigxMCkuYW5kKDEwMjMpLmVxKHJlcSkpLCBmb3VuZC5zZXQoMSkpLFxuICAgICAgICAgIGlmRWxzZShmb3VuZC5lcSgtMSkuYW5kKGRlY2tTaXplLmd0KDIpKS5hbmQoZGVjay5zaHIoMjApLmFuZCgxMDIzKS5lcShyZXEpKSwgZm91bmQuc2V0KDIpKSxcbiAgICAgICAgICBpZkVsc2UoZm91bmQuZXEoLTEpLCByZXQoLUlORikpLFxuICAgICAgICAgIGNvc3QuaWFkZChkZWNrU2l6ZS5zdWIoZm91bmQpLnN1YigxKS5tdWwoUkVPUkdfQ09TVF9DRU5UUykpLFxuICAgICAgICAgIHNoaWZ0LnNldChmb3VuZC5tdWwoMTApKSxcbiAgICAgICAgICBsb3dlck1hc2suc2V0KGkzMigxKS5zaGwoc2hpZnQpLnN1YigxKSksXG4gICAgICAgICAgZGVjay5zZXQoZGVjay5hbmQobG93ZXJNYXNrKS5vcihkZWNrLnNocihzaGlmdC5hZGQoMTApKS5zaGwoc2hpZnQpKSksXG4gICAgICAgICAgZGVja1NpemUuaXN1YigxKSxcbiAgICAgICAgICBpZkVsc2UoZWxhcHNlZE1pbnV0ZXMuZ3QocmVxdWVzdC5kZWFkbGluZSksIFtdLCByZXdhcmQuaWFkZChyZXF1ZXN0LnZhbHVlKSksXG4gICAgICAgIF0pLFxuICAgICAgICBpZkVsc2Uoc3RlcC5kZWNrLFxuICAgICAgICAgIFtkZWNrMS5zZXQoZGVjayksIGRlY2tTaXplMS5zZXQoZGVja1NpemUpXSxcbiAgICAgICAgICBbZGVjazAuc2V0KGRlY2spLCBkZWNrU2l6ZTAuc2V0KGRlY2tTaXplKV0sXG4gICAgICAgICksXG4gICAgICAgIGkuaWFkZCgxKSxcbiAgICAgIF0pLFxuICAgICAgcmV0KHJld2FyZC5zdWIoY29zdCkpLFxuICAgIF1cbiAgfSlcblxuICBjb25zdCB0cnlVbmFzc2lnbiA9IGZ1bmMoW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSBsb2NhbChcImkzMlwiKSwgcmVxID0gbG9jYWwoXCJpMzJcIiksIGRlY2sgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IEEgPSBsb2NhbChcImkzMlwiKSwgQiA9IGxvY2FsKFwiaTMyXCIpLCBpID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0c2l6ZSA9IGxvY2FsKFwiaTMyXCIpLCB0b2Zmc2V0ID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBwcmV2aW91c1Njb3JlID0gbG9jYWwoXCJpMzJcIiksIG5leHRTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3Qgc3RlcCA9IGxvY2FsKFNUT1ApXG4gICAgY29uc3Qgc2NoZWRWaWV3ID0ge1xuICAgICAgbW92ZTogKHRhcmdldDogRXhwcjxcImkzMlwiPiwgc291cmNlOiBFeHByPFwiaTMyXCI+LCBjb3VudDogRXhwcjxcImkzMlwiPik6IFN0bXRCb2R5ID0+XG4gICAgICAgIHNjaGVkdWxlLm1vdmUodG9mZnNldC5hZGQodGFyZ2V0KSwgdG9mZnNldC5hZGQoc291cmNlKSwgY291bnQpLFxuICAgICAgYXQ6IChpbmRleDogRXhwcjxcImkzMlwiPikgPT4gc2NoZWR1bGUuYXQodG9mZnNldC5hZGQoaW5kZXgpKSxcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgIHRyYW4uc2V0KHJhbmRpbnQuY2FsbChwbGFubmVyLk5UUkFOUykpLFxuICAgICAgdHNpemUuc2V0KHNjaGVkX3NpemUuYXQodHJhbikpLFxuICAgICAgaWZFbHNlKHRzaXplLmx0KDIpLCByZXQoKSksXG4gICAgICB0b2Zmc2V0LnNldCh0cmFuLm11bChUU0laRSkpLFxuICAgICAgc3RlcC5zZXQoc2NoZWRWaWV3LmF0KHJhbmRpbnQuY2FsbCh0c2l6ZSkpKSxcbiAgICAgIHJlcS5zZXQoc3RlcC5yZXFfaWQpLFxuICAgICAgZGVjay5zZXQoc3RlcC5kZWNrKSxcbiAgICAgIEEuc2V0KC0xKSwgQi5zZXQoLTEpLFxuICAgICAgbG9vcChpLmx0KHRzaXplKSwgW1xuICAgICAgICBzdGVwLnNldChzY2hlZFZpZXcuYXQoaSkpLFxuICAgICAgICBpZkVsc2Uoc3RlcC5yZXFfaWQuZXEocmVxKSwgaWZFbHNlKEEuZXEoLTEpLCBBLnNldChpKSwgQi5zZXQoaSkpKSxcbiAgICAgICAgaS5pYWRkKDEpLFxuICAgICAgXSksXG4gICAgICBpZkVsc2UoQS5lcSgtMSkub3IoQi5lcSgtMSkpLCByZXQoKSksXG4gICAgICBwcmV2aW91c1Njb3JlLnNldChyYXRpbmdzLmF0KHRyYW4pKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEEsIEEuYWRkKDEpLCBCLnN1YihBKS5zdWIoMSkpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5zdWIoMSksIEIuYWRkKDEpLCB0c2l6ZS5zdWIoQikuc3ViKDEpKSxcbiAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KHRzaXplLnN1YigyKSksXG4gICAgICBuZXh0U2NvcmUuc2V0KHJhdGVUcmFuLmNhbGwodHJhbikpLFxuICAgICAgaWZFbHNlKGFjY2VwdEFubmVhbC5jYWxsKHByZXZpb3VzU2NvcmUsIG5leHRTY29yZSwgdGVtcGVyYXR1cmUpLFxuICAgICAgICBbYXNzaWduZWQuYXQocmVxKS5zZXQoMCksIHJhdGluZ3MuYXQodHJhbikuc2V0KG5leHRTY29yZSldLFxuICAgICAgICBbXG4gICAgICAgICAgc2NoZWRWaWV3Lm1vdmUoQi5hZGQoMSksIEIuc3ViKDEpLCB0c2l6ZS5zdWIoQikuc3ViKDEpKSxcbiAgICAgICAgICBzY2hlZFZpZXcubW92ZShBLmFkZCgxKSwgQSwgQi5zdWIoQSkuc3ViKDEpKSxcbiAgICAgICAgICBzY2hlZFZpZXcuYXQoQSkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2sgfSksXG4gICAgICAgICAgc2NoZWRWaWV3LmF0KEIpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAwLCBkZWNrIH0pLFxuICAgICAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KHRzaXplKSxcbiAgICAgICAgXSxcbiAgICAgICksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IGFkZFJlcXVlc3QgPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiXSwgXCJ2b2lkXCIsXG4gICAgKHJlcW4sIHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSkgPT5cbiAgICAgIHJlcXVlc3RzLmF0KHJlcW4pLnNldCh7IHN0YXJ0LCBlbmQsIHZhbHVlLCBkZWFkbGluZSB9KSxcbiAgKVxuXG4gIGNvbnN0IGJvb3RzdHJhcCA9IGZ1bmMoW10sIFwidm9pZFwiLCAoKSA9PiB7XG4gICAgY29uc3QgdHJhbiA9IGxvY2FsKFwiaTMyXCIpLCByZXEgPSBsb2NhbChcImkzMlwiKSwgYmVzdFJlcSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3Qgb2Zmc2V0ID0gbG9jYWwoXCJpMzJcIiksIHNjb3JlID0gbG9jYWwoXCJpMzJcIiksIGJlc3RTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgcmV0dXJuIGZvck4ocGxhbm5lci5OVFJBTlMsIHQgPT4gW1xuICAgICAgdHJhbi5zZXQodCksIG9mZnNldC5zZXQodHJhbi5tdWwoVFNJWkUpKSwgYmVzdFJlcS5zZXQoLTEpLCBiZXN0U2NvcmUuc2V0KC1JTkYpLFxuICAgICAgZm9yTihwbGFubmVyLk5SRVFTLCByID0+IFtcbiAgICAgICAgcmVxLnNldChyKSxcbiAgICAgICAgaWZFbHNlKGFzc2lnbmVkLmF0KHJlcSkuZXEoMCksIFtcbiAgICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAxLCBkZWNrOiAwIH0pLFxuICAgICAgICAgIHNjaGVkdWxlLmF0KG9mZnNldC5hZGQoMSkpLnNldCh7IHJlcV9pZDogcmVxLCBpc19sb2FkOiAwLCBkZWNrOiAwIH0pLFxuICAgICAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KDIpLFxuICAgICAgICAgIHNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgICAgICBpZkVsc2Uoc2NvcmUuZ3QoYmVzdFNjb3JlKSwgW2Jlc3RTY29yZS5zZXQoc2NvcmUpLCBiZXN0UmVxLnNldChyZXEpXSksXG4gICAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQoMCksXG4gICAgICAgIF0pLFxuICAgICAgXSksXG4gICAgICBpZkVsc2UoYmVzdFJlcS5ndCgtMSkuYW5kKGJlc3RTY29yZS5ndCgtMTJfMDAxKSksIFtcbiAgICAgICAgc2NoZWR1bGUuYXQob2Zmc2V0KS5zZXQoeyByZXFfaWQ6IGJlc3RSZXEsIGlzX2xvYWQ6IDEsIGRlY2s6IDAgfSksXG4gICAgICAgIHNjaGVkdWxlLmF0KG9mZnNldC5hZGQoMSkpLnNldCh7IHJlcV9pZDogYmVzdFJlcSwgaXNfbG9hZDogMCwgZGVjazogMCB9KSxcbiAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQoMiksXG4gICAgICAgIGFzc2lnbmVkLmF0KGJlc3RSZXEpLnNldCgxKSxcbiAgICAgICAgcmF0aW5ncy5hdCh0cmFuKS5zZXQoYmVzdFNjb3JlKSxcbiAgICAgIF0pLFxuICAgIF0pXG4gIH0pXG5cbiAgY29uc3Qgc2VhcmNoID0gZnVuYyhbXSwgXCJ2b2lkXCIsICgpID0+IHtcbiAgICBjb25zdCB0ZW1wZXJhdHVyZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgcmV0dXJuIFtcbiAgICAgIGRlYnVnKFwiZGVidWdnZXIgb24uXCIsIDApLFxuICAgICAgZm9yTihURU1QX1BIQVNFUywgcGhhc2UgPT4gW1xuICAgICAgICB0ZW1wZXJhdHVyZS5zZXQoaTMyKFNUQVJUX1RFTVBfQ0VOVFMpLnN1YihcbiAgICAgICAgICBwaGFzZS5tdWwoU1RBUlRfVEVNUF9DRU5UUyAtIEVORF9URU1QX0NFTlRTKS5kaXYoVEVNUF9QSEFTRVMgLSAxKSxcbiAgICAgICAgKSksXG4gICAgICAgIGZvck4oU1RFUFNfUEVSX1BIQVNFLCAoKSA9PiBbdHJ5VW5hc3NpZ24uY2FsbCh0ZW1wZXJhdHVyZSksIHRyeUFzc2lnbi5jYWxsKHRlbXBlcmF0dXJlKV0pLFxuICAgICAgXSksXG4gICAgXVxuICB9KVxuICBjb25zdCBnZXRTdG9wID0gZnVuYyhbXCJpMzJcIiwgXCJpMzJcIl0sIFNUT1AsXG4gICAgKHRyYW4sIGluZGV4KSA9PiBzY2hlZHVsZS5hdCh0cmFuLm11bChUU0laRSkuYWRkKGluZGV4KSksXG4gIClcblxuICBjb25zdCB3YXNtID0gYXdhaXQgY29tcGlsZSh7XG4gICAgYWRkUmVxdWVzdCxcbiAgICBhc3NpZ25lZCxcbiAgICBib290c3RyYXAsXG4gICAgZGlzdHMsXG4gICAgZ2V0U3RvcCxcbiAgICByYXRlVHJhbixcbiAgICByYXRpbmdzLFxuICAgIHNjaGVkdWxlLFxuICAgIHNlYXJjaCxcbiAgICBzY2hlZF9zaXplLFxuICAgIHRyYW5fcG9zaXRpb25zLFxuICB9KVxuXG4gIHdhc20uZGlzdHMuc2V0KHBsYW5uZXIucm9hZG1hcC5Db3N0TWF0cml4KVxuICB3YXNtLnRyYW5fcG9zaXRpb25zLnNldChwbGFubmVyLnN0YXJ0cG9zaXRpb25zKVxuICBwbGFubmVyLnJlcXVlc3RzLmZvckVhY2goKHJlcXVlc3QsIGkpID0+XG4gICAgd2FzbS5hZGRSZXF1ZXN0KGksIHJlcXVlc3Quc3RhcnRQb2ludCwgcmVxdWVzdC5lbmRQb2ludCwgTWF0aC5yb3VuZChyZXF1ZXN0LnZhbHVlX2V1ciAqIDEwMCksIE1hdGguZmxvb3IocmVxdWVzdC5kZWFkbGluZV9oICogNjApKSxcbiAgKVxuXG4gIHdhc20uYm9vdHN0cmFwKClcblxuICBjb25zdCBzdGFydGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICB3YXNtLnNlYXJjaCgpXG4gIGNvbnN0IGVsYXBzZWRNcyA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZEF0XG4gIGNvbnN0IHJlc3VsdFNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KHBsYW5uZXIuTlRSQU5TICogVFNJWkUpXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgcGxhbm5lci5OVFJBTlM7IHRyYW4rKykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2FzbS5zY2hlZF9zaXplW3RyYW5dITsgaSsrKSB7XG4gICAgICBjb25zdCBzdG9wID0gd2FzbS5nZXRTdG9wKHRyYW4sIGkpXG4gICAgICByZXN1bHRTY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSA9IHN0b3AuaXNfbG9hZCB8IHN0b3AuZGVjayA8PCAxIHwgc3RvcC5yZXFfaWQgPDwgMlxuICAgIH1cbiAgfVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShwbGFubmVyLk5SRVFTKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHVuYXNzaWduZWQubGVuZ3RoOyBpKyspIHVuYXNzaWduZWRbaV0gPSB3YXNtLmFzc2lnbmVkW2ldID8gMCA6IDFcbiAgY29uc3Qgc2NoZWR1bGVSYXRpbmdzID0gbmV3IEludDMyQXJyYXkod2FzbS5yYXRpbmdzKVxuXG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHJlc3VsdFNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IG5ldyBVaW50MTZBcnJheSh3YXNtLnNjaGVkX3NpemUpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpLFxuICAgIFRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiBzY2hlZHVsZVJhdGluZ3MucmVkdWNlKChzdW0sIHNjb3JlKSA9PiBzdW0gKyBzY29yZSwgMCksXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgYnV0dG9uLCBjb2xvciwgZGl2LCBwLCBwb3B1cCwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdGgsIHRyIH0gZnJvbSBcIi4uL3ZpZXcvaHRtbFwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzIH0gZnJvbSBcIi4uL3ZpZXcvbWFpblwiO1xuaW1wb3J0IHsgYmFzZWxpbmVBbm5lYWxpbmcsIHR5cGUgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24sIGltcHJvdmVkQW5uZWFsaW5nLCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB9IGZyb20gXCIuL2FubmVhbGluZ19pbXByb3ZlZFwiO1xuaW1wb3J0IHsgYW5uZWFsaW5nV2FzbSB9IGZyb20gXCIuL2FubmVhbGluZ193YXNtXCI7XG5pbXBvcnQgeyBBVkdfU1BFRURfS01ILCBnZXREZWNrLCBnZXRSZXEsIGluaXRBbm5lYWxpbmdTdGF0ZSwgaXNMb2FkLCBLTV9DT1NUX0NFTlRTLCBSRU9SR19DT1NUX0NFTlRTLCBzY29yZVJvdXRlIH0gZnJvbSBcIi4vYW5uZWFsaW5nX3NoYXJlZFwiO1xuXG5leHBvcnQgY29uc3QgYXZhaWxhYmxlU29sdmVycyA9IHtcbiAgYmFzZWxpbmU6IGJhc2VsaW5lQW5uZWFsaW5nLFxuICBpbXByb3ZlZDogaW1wcm92ZWRBbm5lYWxpbmcsXG4gIHdhc206IGFubmVhbGluZ1dhc20sXG59IGFzIGNvbnN0O1xudHlwZSBTb2x2ZXJOYW1lID0ga2V5b2YgdHlwZW9mIGF2YWlsYWJsZVNvbHZlcnM7XG5cbmNvbnN0IElOSVRJQUxfU09MVkVSOiBTb2x2ZXJOYW1lID0gXCJ3YXNtXCI7XG5jb25zdCBldXJvcyA9IChjZW50czogbnVtYmVyKSA9PiBgJHsoY2VudHMgLyAxMDApLnRvRml4ZWQoMil94oKsYDtcblxuY2xhc3MgU2NvcmVNaXNtYXRjaEVycm9yIGV4dGVuZHMgRXJyb3Ige31cblxuZnVuY3Rpb24gY2Fub25pY2FsU2NoZWR1bGUobW9kOiBNb2R1bGUsIHJlc3VsdDogQW5uZWFsaW5nUmVzdWx0KSB7XG4gIGNvbnN0IHNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KHJlc3VsdC5zY2hlZHVsZSlcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBtb2QuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBzaXplID0gcmVzdWx0LnNjaGVkdWxlU2l6ZXNbdHJhbl0hXG4gICAgaWYgKHNpemUgPCAwIHx8IHNpemUgPiByZXN1bHQuVFNJWkUpIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRyYW5zcG9ydGVyICR7dHJhbn0gaGFzIGludmFsaWQgc2NoZWR1bGUgc2l6ZSAke3NpemV9YClcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgY29uc3QgYXQgPSB0cmFuICogcmVzdWx0LlRTSVpFICsgaVxuICAgICAgY29uc3Qgc3RlcCA9IHNjaGVkdWxlW2F0XVxuICAgICAgaWYgKHN0ZXAgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IFNjb3JlTWlzbWF0Y2hFcnJvcihgVHJhbnNwb3J0ZXIgJHt0cmFufSBzY2hlZHVsZSBpcyB0cnVuY2F0ZWQgYXQgJHtpfWApXG4gICAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RlcCksIHJlcXVlc3QgPSBtb2QucmVxdWVzdHNbcmVxXVxuICAgICAgaWYgKCFyZXF1ZXN0KSB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUcmFuc3BvcnRlciAke3RyYW59IHJlZmVyZW5jZXMgdW5rbm93biByZXF1ZXN0ICR7cmVxfWApXG4gICAgICBjb25zdCBwb3MgPSBpc0xvYWQoc3RlcCkgPyByZXF1ZXN0LnN0YXJ0UG9pbnQgOiByZXF1ZXN0LmVuZFBvaW50XG4gICAgICBzY2hlZHVsZVthdF0gPSAoc3RlcCAmIDB4ZmZmZikgfCBwb3MgPDwgMTZcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNjaGVkdWxlXG59XG5cbmZ1bmN0aW9uIGNoZWNrZWRSZXN1bHQobW9kOiBNb2R1bGUsIHJlc3VsdDogQW5uZWFsaW5nUmVzdWx0KSB7XG4gIGlmIChyZXN1bHQuc2NoZWR1bGVTaXplcy5sZW5ndGggIT09IG1vZC5OVFJBTlMgfHwgcmVzdWx0LnNjaGVkdWxlUmF0aW5ncy5sZW5ndGggIT09IG1vZC5OVFJBTlMpXG4gICAgdGhyb3cgbmV3IFNjb3JlTWlzbWF0Y2hFcnJvcihcIlNvbHZlciByZXR1cm5lZCBpbmNvcnJlY3RseSBzaXplZCB0cmFuc3BvcnRlciBhcnJheXNcIilcbiAgY29uc3Qgc2NoZWR1bGUgPSBjYW5vbmljYWxTY2hlZHVsZShtb2QsIHJlc3VsdClcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kKVxuICBPYmplY3QuYXNzaWduKHN0YXRlLCB7XG4gICAgVFNJWkU6IHJlc3VsdC5UU0laRSxcbiAgICBzY2hlZHVsZSxcbiAgICBzY2hlZHVsZVNpemVzOiByZXN1bHQuc2NoZWR1bGVTaXplcyxcbiAgICBzY2hlZHVsZVJhdGluZ3M6IHJlc3VsdC5zY2hlZHVsZVJhdGluZ3MsXG4gICAgdHJhblN0YXJ0OiByZXN1bHQudHJhblN0YXJ0LFxuICAgIHVuYXNzaWduZWQ6IHJlc3VsdC51bmFzc2lnbmVkLFxuICB9KVxuICBsZXQgdG90YWwgPSAwXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgbW9kLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgY29uc3QgZXhwZWN0ZWQgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKSwgcmVwb3J0ZWQgPSByZXN1bHQuc2NoZWR1bGVSYXRpbmdzW3RyYW5dIVxuICAgIGlmIChyZXBvcnRlZCAhPT0gZXhwZWN0ZWQpXG4gICAgICB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUcmFuc3BvcnRlciAke3RyYW59IHNjb3JlIG1pc21hdGNoOiByZXBvcnRlZCAke3JlcG9ydGVkfSwgSlMgJHtleHBlY3RlZH1gKVxuICAgIHRvdGFsICs9IGV4cGVjdGVkXG4gIH1cbiAgaWYgKHJlc3VsdC50b3RhbFNjb3JlICE9PSB0b3RhbClcbiAgICB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUb3RhbCBzY29yZSBtaXNtYXRjaDogcmVwb3J0ZWQgJHtyZXN1bHQudG90YWxTY29yZX0sIEpTICR7dG90YWx9YClcbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGxhbm5lclZpZXcobW9kOiBNb2R1bGUpOiBQcm9taXNlPEhUTUxFbGVtZW50PiB7XG4gIGNvbnN0IG91dGVyQm9yZGVyID0gXCIxcHggc29saWQgXCIgKyBjb2xvci5ncmF5O1xuICBjb25zdCBpbm5lckJvcmRlciA9IFwiMXB4IHNvbGlkIFwiICsgY29sb3IubGlnaHRncmF5O1xuICBjb25zdCBjZWxsUGFkZGluZyA9IFwiLjM1ZW0gLjVlbVwiO1xuICBjb25zdCBzY2hlZHVsZUNlbGxNaW5IZWlnaHQgPSBcIjIuMWVtXCI7XG5cbiAgbGV0IGFubmVhbGVyOiBBbm5lYWxpbmdSZXN1bHQgfCBudWxsID0gbnVsbDtcbiAgbGV0IGFubmVhbGluZ1Nlc3Npb246IEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB8IG51bGwgPSBudWxsO1xuICBsZXQgYW5uZWFsaW5nVGltZXI6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBsZXQgcnVuSWQgPSAwO1xuXG4gIGZ1bmN0aW9uIGl0ZW1CdXR0b24oaXRlbTogbnVtYmVyLCBsb2FkPzogYm9vbGVhbikge1xuICAgIGNvbnN0IHJlcSA9IG1vZC5yZXF1ZXN0c1tpdGVtXSE7XG4gICAgY29uc3Qgc3AgPSBzcGFuKFxuICAgICAgaXRlbS50b1N0cmluZygpLnBhZFN0YXJ0KDMsIFwiIFwiKSxcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgYm9yZGVyOiBcIjJweCBzb2xpZCB0cmFuc3BhcmVudFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjJlbVwiLFxuICAgICAgICB3aGl0ZVNwYWNlOiBcInByZVwiLFxuICAgICAgICBmb250RmFtaWx5OiBcIm1vbm9zcGFjZVwiLFxuICAgICAgfSksXG4gICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBvcHVwKFxuICAgICAgICAgIHAoXCJpdGVtIFwiLCBpdGVtKSxcbiAgICAgICAgICB0YWJsZShcbiAgICAgICAgICAgIHRyKGNlbGwoXCJzdGF0dXNcIiksIGNlbGwobG9hZCA/IFwibG9hZFwiIDogbG9hZCA9PT0gZmFsc2UgPyBcInVubG9hZFwiIDogXCJ1bmFzc2lnbmVkXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJ2YWx1ZVwiKSwgY2VsbChyZXEudmFsdWVfZXVyICsgXCLigqxcIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcImRpc3RcIiksIGNlbGwobW9kLnJvYWRtYXAuZ2V0Q29zdE4ocmVxLnN0YXJ0UG9pbnQsIHJlcS5lbmRQb2ludCkgKyBcImttXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJkZWFkbGluZVwiKSwgY2VsbChyZXEuZGVhZGxpbmVfaC50b0ZpeGVkKDIpICsgXCJoXCIpKSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICApO1xuXG4gICAgbGV0IHBvaW50cyA9IFtcbiAgICAgIHsgbnVtYmVyOiByZXEuc3RhcnRQb2ludCwgbG9nbzogXCLwn5OmXCIgfSxcbiAgICAgIHsgbnVtYmVyOiByZXEuZW5kUG9pbnQsIGxvZ286IFwi8J+PoFwiIH0sXG4gICAgXTtcblxuICAgIGlmIChsb2FkID09PSB0cnVlKSBwb2ludHMgPSBbcG9pbnRzWzBdIV07XG4gICAgaWYgKGxvYWQgPT09IGZhbHNlKSBwb2ludHMgPSBbcG9pbnRzWzFdIV07XG5cbiAgICBzcC5vbm1vdXNlZW50ZXIgPSAoKSA9PiB7XG4gICAgICBzcC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbG9yLmdyZWVuO1xuICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50cyB9XSk7XG4gICAgfTtcbiAgICBzcC5vbm1vdXNlbGVhdmUgPSAoKSA9PiB7XG4gICAgICBzcC5zdHlsZS5ib3JkZXJDb2xvciA9IFwidHJhbnNwYXJlbnRcIjtcbiAgICB9O1xuICAgIHJldHVybiBzcDtcbiAgfVxuXG4gIGNvbnN0IGNlbGw6IHR5cGVvZiB0ZCA9ICguLi54KSA9PiB0ZChzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiIH0pLCAuLi54KTtcbiAgY29uc3QgY29udHJvbHMgPSBkaXYoc3R5bGUoeyBkaXNwbGF5OiBcImZsZXhcIiwgZ2FwOiBcIi41ZW1cIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZmxleFdyYXA6IFwid3JhcFwiIH0pKTtcbiAgY29uc3Qgc2NvcmVMaW5lID0gcCgpO1xuICBjb25zdCB0aW1lTGluZSA9IHAoKTtcbiAgY29uc3Qgc29sdmVyU2VsZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKTtcbiAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKGF2YWlsYWJsZVNvbHZlcnMpIGFzIFNvbHZlck5hbWVbXSkgc29sdmVyU2VsZWN0LmFkZChuZXcgT3B0aW9uKG5hbWUsIG5hbWUpKTtcbiAgc29sdmVyU2VsZWN0LnZhbHVlID0gSU5JVElBTF9TT0xWRVI7XG4gIGNvbnN0IHNvbHZlckxpbmUgPSBwKFwic29sdmVyOiBcIiwgc29sdmVyU2VsZWN0KTtcbiAgY29uc3QgZGV0YWlsV3JhcCA9IGRpdigpO1xuICBjb25zdCB0YWJsZVdyYXAgPSBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgb3ZlcmZsb3dYOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WTogXCJoaWRkZW5cIixcbiAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICB9KSxcbiAgKTtcblxuICBjb25zdCBydW5CdXR0b24gPSBidXR0b24oXCJzdGFydFwiKTtcbiAgY29uc3QgaGVhdEJ1dHRvbiA9IGJ1dHRvbihcImhlYXQgdXBcIik7XG4gIGxldCByZW5kZXJDb3VudGVyID0gMDtcblxuICBmdW5jdGlvbiBzdG9wU2VhcmNoKCkge1xuICAgIGlmIChhbm5lYWxpbmdUaW1lciAhPSBudWxsKSB7XG4gICAgICBjbGVhckludGVydmFsKGFubmVhbGluZ1RpbWVyKTtcbiAgICAgIGFubmVhbGluZ1RpbWVyID0gbnVsbDtcbiAgICB9XG4gICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gXCJzdGFydFwiO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyVGFibGUoKSB7XG4gICAgY29uc3QgdGFiID0gdGFibGUoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIH0pLFxuICAgICAgdHIoXG4gICAgICAgIHRoKFwidHJhbnNwb3J0ZXJcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICAgIHRoKFwidmFsdWVcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICAgIHRoKFwic3RlcHNcIiwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIiB9KSksXG4gICAgICApLFxuICAgICAgbW9kLnN0YXJ0cG9zaXRpb25zLm1hcCgoc3RhcnQsIHRyYW4pID0+XG4gICAgICAgIHRyKFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgdHJhbixcbiAgICAgICAgICAgIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHBvcHVwKFxuICAgICAgICAgICAgICAgIHAoXCJ0cmFuc3BvcnRlcjogXCIsIHRyYW4pLFxuICAgICAgICAgICAgICAgIHAoXCJzdGFydDogXCIsIHN0YXJ0KSxcbiAgICAgICAgICAgICAgICBwKFwic2NvcmU6IFwiLCBldXJvcyhhbm5lYWxlcj8uc2NoZWR1bGVSYXRpbmdzW3RyYW5dID8/IDApKSxcbiAgICAgICAgICAgICAgICBwKFwic3RlcHM6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVTaXplc1t0cmFuXSEpLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb25tb3VzZWVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50czogW3sgbnVtYmVyOiBzdGFydCwgbG9nbzogXCLwn5qbXCIgfV0gfV0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBvbm1vdXNlbGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW10pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICAgIHRkKGV1cm9zKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPz8gMCksIHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSkpLFxuICAgICAgICAgIHRkKFxuICAgICAgICAgICAgdGFibGUoXG4gICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgWzAsIDFdLm1hcCgoZGVjaykgPT5cbiAgICAgICAgICAgICAgICB0cihcbiAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oeyBsZW5ndGg6IGFubmVhbGVyIS5zY2hlZHVsZVNpemVzW3RyYW5dISB9LCAoXywgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGVwID0gYW5uZWFsZXI/LnNjaGVkdWxlW3RyYW4gKiBhbm5lYWxlci5UU0laRSArIGldITtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZCA9IGlzTG9hZChzdGVwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRkKFxuICAgICAgICAgICAgICAgICAgICAgIGdldERlY2soc3RlcCkgPT09IGRlY2sgPyBpdGVtQnV0dG9uKGdldFJlcShzdGVwKSwgISFsb2FkKSA6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGxvYWQgPyBjb2xvci5ibHVlIDogY29sb3IuZ3JlZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGlubmVyQm9yZGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogXCIuMmVtIC4zZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiBcIjIuNmVtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgYm9yZGVyOiBvdXRlckJvcmRlcixcbiAgICAgICAgICAgICAgcGFkZGluZzogXCIuMjVlbVwiLFxuICAgICAgICAgICAgICB2ZXJ0aWNhbEFsaWduOiBcInRvcFwiLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcblxuICAgIHRhYmxlV3JhcC5yZXBsYWNlQ2hpbGRyZW4odGFiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclN0YXR1cygpIHtcbiAgICBpZiAoIWFubmVhbGVyKSByZXR1cm47XG4gICAgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gYHNjb3JlOiAke2V1cm9zKGFubmVhbGVyLnRvdGFsU2NvcmUpfWA7XG4gICAgdGltZUxpbmUudGV4dENvbnRlbnQgPSBgc2VhcmNoIHRpbWU6ICR7KGFubmVhbGVyIS5lbGFwc2VkTXMvMTAwMCkudG9GaXhlZCgyKX0gc2A7XG5cbiAgICBkZXRhaWxXcmFwLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIGRpdihcbiAgICAgICAgcChcImRldGFpbHNcIiksXG4gICAgICAgIHRhYmxlKFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdHIoY2VsbChcInVuYXNzaWduZWQgcmVxdWVzdHNcIiksIGNlbGwoQXJyYXkuZnJvbShhbm5lYWxlciEudW5hc3NpZ25lZCkubWFwKCh4LCBpKSA9PiAoeyB4LCBpIH0pKS5maWx0ZXIoKHgpID0+IHgueCkuZmxhdE1hcCgoeCkgPT4gW3NwYW4oXCIgXCIpLCBpdGVtQnV0dG9uKHguaSldKSkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJzZWFyY2ggdGltZVwiKSwgY2VsbChgJHthbm5lYWxlcj8uZWxhcHNlZE1zID8/IDB9bXNgKSksXG4gICAgICAgICAgdHIoY2VsbChcInNjb3JlXCIpLCBjZWxsKGV1cm9zKGFubmVhbGVyLnRvdGFsU2NvcmUpKSksXG4gICAgICAgICAgdHIoY2VsbChcInRyYW5zcG9ydGVyIGNvdW50XCIpLCBjZWxsKG1vZC5OVFJBTlMpKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVxdWVzdCBjb3VudFwiKSwgY2VsbChtb2QuTlJFUVMpKSxcbiAgICAgICAgICB0cihjZWxsKFwiY29zdCBwZXIga21cIiksIGNlbGwoZXVyb3MoS01fQ09TVF9DRU5UUykpKSxcbiAgICAgICAgICB0cihjZWxsKFwiYXZlcmFnZSBzcGVlZFwiKSwgY2VsbChgJHtBVkdfU1BFRURfS01IfWttL2hgKSksXG4gICAgICAgICAgdHIoY2VsbChcInJlb3JnYW5pemF0aW9uIGNvc3RcIiksIGNlbGwoZXVyb3MoUkVPUkdfQ09TVF9DRU5UUykpKSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcihmb3JjZVRhYmxlID0gZmFsc2UpIHtcbiAgICBpZiAoIWFubmVhbGVyKSByZXR1cm47XG4gICAgcmVuZGVyU3RhdHVzKCk7XG4gICAgaWYgKGZvcmNlVGFibGUgfHwgKHJlbmRlckNvdW50ZXIrKyAlIDQgPT09IDApKSByZW5kZXJUYWJsZSgpO1xuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gcnVuU29sdmVyKG5hbWU6IFNvbHZlck5hbWUpIHtcbiAgICBzdG9wU2VhcmNoKCk7XG4gICAgY29uc3QgaWQgPSArK3J1bklkO1xuICAgIGFubmVhbGluZ1Nlc3Npb24gPSBudWxsO1xuICAgIGFubmVhbGVyID0gbnVsbDtcbiAgICBydW5CdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IFwicnVubmluZ+KAplwiO1xuICAgIHRhYmxlV3JhcC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBsZXQgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQgfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgaWYgKG5hbWUgPT09IFwiaW1wcm92ZWRcIikge1xuICAgICAgICBhbm5lYWxpbmdTZXNzaW9uID0gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZCwgMV85MDBfMDAwKTtcbiAgICAgICAgcmVzdWx0ID0gYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgYXZhaWxhYmxlU29sdmVyc1tuYW1lXShtb2QpO1xuICAgICAgfVxuICAgICAgYW5uZWFsZXIgPSBjaGVja2VkUmVzdWx0KG1vZCwgcmVzdWx0KTtcbiAgICAgIGlmIChpZCA9PT0gcnVuSWQpIHtcbiAgICAgICAgcmVuZGVyKHRydWUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBTY29yZU1pc21hdGNoRXJyb3IpIHRocm93IGVycm9yO1xuICAgICAgaWYgKGlkID09PSBydW5JZCkgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gYHNvbHZlciBmYWlsZWQ6ICR7U3RyaW5nKGVycm9yKX1gO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoaWQgPT09IHJ1bklkKSB7XG4gICAgICAgIHJ1bkJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBuYW1lID09PSBcImltcHJvdmVkXCIgPyBcInN0YXJ0XCIgOiBcInJ1blwiO1xuICAgICAgICBoZWF0QnV0dG9uLmhpZGRlbiA9IG5hbWUgIT09IFwiaW1wcm92ZWRcIjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBydW5CdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBjb25zdCBuYW1lID0gc29sdmVyU2VsZWN0LnZhbHVlIGFzIFNvbHZlck5hbWU7XG4gICAgaWYgKG5hbWUgIT09IFwiaW1wcm92ZWRcIikge1xuICAgICAgdm9pZCBydW5Tb2x2ZXIobmFtZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChhbm5lYWxpbmdUaW1lciAhPSBudWxsKSB7XG4gICAgICBzdG9wU2VhcmNoKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJ1bkJ1dHRvbi50ZXh0Q29udGVudCA9IFwic3RvcFwiO1xuICAgIGFubmVhbGluZ1RpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICghYW5uZWFsaW5nU2Vzc2lvbikgcmV0dXJuO1xuICAgICAgYW5uZWFsZXIgPSBjaGVja2VkUmVzdWx0KG1vZCwgYW5uZWFsaW5nU2Vzc2lvbi5pdGVyYXRlRm9yTXMoMTIwKSk7XG4gICAgICByZW5kZXIoKTtcbiAgICB9LCAxNTApO1xuICB9O1xuXG4gIGhlYXRCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICBhbm5lYWxlciA9IGNoZWNrZWRSZXN1bHQobW9kLCBhbm5lYWxpbmdTZXNzaW9uLnJlaGVhdCgpKTtcbiAgICByZW5kZXIodHJ1ZSk7XG4gIH07XG5cbiAgc29sdmVyU2VsZWN0Lm9uY2hhbmdlID0gKCkgPT4gdm9pZCBydW5Tb2x2ZXIoc29sdmVyU2VsZWN0LnZhbHVlIGFzIFNvbHZlck5hbWUpO1xuICBjb250cm9scy5yZXBsYWNlQ2hpbGRyZW4ocnVuQnV0dG9uLCBoZWF0QnV0dG9uKTtcbiAgYXdhaXQgcnVuU29sdmVyKElOSVRJQUxfU09MVkVSKTtcblxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgICBvdmVyZmxvd1k6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dYOiBcImhpZGRlblwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgIH0pLFxuICAgIGNvbnRyb2xzLFxuICAgIHNvbHZlckxpbmUsXG4gICAgc2NvcmVMaW5lLFxuICAgIHRpbWVMaW5lLFxuICAgIHRhYmxlV3JhcCxcbiAgICBkZXRhaWxXcmFwLFxuICApO1xufVxuIiwKICAgICJpbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdfYmFzZWxpbmVcIlxuaW1wb3J0IHsgYW5uZWFsaW5nV2FzbSB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdfd2FzbVwiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgeyBkaXYsIGgyLCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIlxuXG5sZXQgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHRcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFVwV2FzbShwbGFubmVyOiBNb2R1bGUpIHtcbiAgcmVzdWx0ID0gYXdhaXQgYW5uZWFsaW5nV2FzbShwbGFubmVyKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd2FzbVZpZXcoX3BsYW5uZXI6IE1vZHVsZSkge1xuICBpZiAoIXJlc3VsdCApIHRocm93IG5ldyBFcnJvcihcIldBU00gcGxhbm5lciBpcyBub3Qgc2V0IHVwXCIpXG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoeyBwYWRkaW5nOiBcIjFlbVwiIH0pLFxuICAgIGgyKFwiV0FTTSBwbGFubmVyXCIpLFxuICAgIHAoXCJhc3NpZ25lZDogXCIsIHJlc3VsdC51bmFzc2lnbmVkLmxlbmd0aCAtIHJlc3VsdC51bmFzc2lnbmVkLnJlZHVjZSgoc3VtLCB2YWx1ZSkgPT4gc3VtICsgdmFsdWUsIDApKSxcbiAgICBwKFwic2NoZWR1bGUgc3RlcHM6IFwiLCByZXN1bHQuc2NoZWR1bGVTaXplcy5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSksXG4gICAgcChcInNlYXJjaCB0aW1lOiBcIiwgcmVzdWx0LmVsYXBzZWRNcy50b0ZpeGVkKDIpLCBcIm1zXCIpLFxuICApXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgaGFzaCB9IGZyb20gXCIuLi9oYXNoXCI7XG5pbXBvcnQgeyBib2R5LCBidXR0b24sIGNvbG9yLCBkaXYsIGVycm9ycG9wdXAsIGgxLCBoMiwgaDMsIGlucHV0LCBtYXJnaW4sIHAsIHBhZGRpbmcsIHBvcHVwLCBwcmUsIHNwYW4sIHN0eWxlLCB0YWJsZSwgd2lkdGgsIHRleHRhcmVhLCBhLCBib3JkZXIsIGh0bWwsIHRoLCB0ciwgdGQsIGJvcmRlclJhZGl1cywgcGFuZWxMaXN0LCBkaXNwbGF5LCBiYWNrZ3JvdW5kIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgbWFwVmlldyB9IGZyb20gXCIuL21hcFZpZXdcIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyByYW5kb21Nb2R1bGUsIHJhbmRvbVVVSUQsIFJlcXVlc3QsIFNjaGVkdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBta1N0b3JlZCwgbWtXcml0YWJsZSwgdHlwZSBXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IHNldFJhbmRTZWVkIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHsgbnVtYmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgcGxhbm5lclZpZXcgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nXCI7XG5pbXBvcnQgeyBzZXRVcFdhc20sIHdhc21WaWV3IH0gZnJvbSBcIi4vd2FzbXZpZXdcIjtcblxuXG5leHBvcnQgbGV0IExLV19DT1VOVCA9IG1rU3RvcmVkKFwiTEtXX0NPVU5UXCIsIG51bWJlciwgIDUpXG5sZXQgUkVRVUVTVF9DT1VOVCA9IG1rU3RvcmVkKFwiUkVRVUVTVF9DT1VOVFwiLCAgbnVtYmVyLCAyMClcblxuYm9keS5zdHlsZS5tYXJnaW4gPSBcIjBcIlxuXG5sZXQgaGVhZGVyID0gaDEoXCJyb3V0ZSBwbGFubmVyXCIsIHN0eWxlKHtiYWNrZ3JvdW5kOiBjb2xvci5ibHVlLCBjb2xvcjogY29sb3IuYmFja2dyb3VuZCwgbWFyZ2luOiBcIjBcIiwgcGFkZGluZzogXCIuNmVtXCJ9KSlcblxubGV0IGNvbnRlbnRTcGFjZSA9IGRpdihzdHlsZSh7XG4gIGRpc3BsYXk6XCJmbGV4XCIsXG4gIGZsZXhEaXJlY3Rpb246XCJyb3dcIixcbiAgd2lkdGg6IFwiMTAwJVwiLFxuICBoZWlnaHQ6IFwiY2FsYygxMDAlIC0gMi41ZW0pXCIsXG4gIG1pbldpZHRoOiBcIjBcIixcbn0pKVxuXG5sZXQgcGFnZSA9IGRpdihcbiAgc3R5bGUoe2Rpc3BsYXk6XCJmbGV4XCIsIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIiwgaGVpZ2h0OiBcIjEwMCVcIn0pLFxuICBoZWFkZXIsXG4gIGNvbnRlbnRTcGFjZVxuKVxuXG5ib2R5LnJlcGxhY2VDaGlsZHJlbihwYWdlKVxuXG5zZXRSYW5kU2VlZCgyNClcblxuZXhwb3J0IGxldCBtb2R1bGUgPSByYW5kb21Nb2R1bGUoKVxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIG51bWJlcjogbnVtYmVyLFxuICAgIGxvZ28/IDogc3RyaW5nLFxuICB9W10sXG4gIGNvbG9yPzogc3RyaW5nXG59XG5cbmV4cG9ydCBsZXQgaGlnaHRMaWdodHMgPSBta1dyaXRhYmxlIDxIaWdoTGlnaHRbXT4oIFtdIClcblxuXG5mdW5jdGlvbiBzZXR0ZXIgKHN0b3JlOiBXcml0YWJsZTxudW1iZXI+ICl7XG4gIGxldCBpbnAgPSBpbnB1dCgpXG4gIGlucC50eXBlID0gXCJudW1iZXJcIlxuICBpbnAub25jaGFuZ2UgPSAoKT0+e1xuICAgIGxldCB2YWwgPSBwYXJzZUludChpbnAudmFsdWUpXG4gICAgaWYgKGlzTmFOKHZhbCkpIHJldHVyblxuICAgIHN0b3JlLnNldCh2YWwpXG4gIH1cbiAgc3RvcmUub251cGRhdGUodmFsPT5pbnAudmFsdWUgPSB2YWwudG9TdHJpbmcoKSlcblxuICByZXR1cm4gaW5wXG59XG5cblxuYXdhaXQgc2V0VXBXYXNtKG1vZHVsZSlcblxuYXN5bmMgZnVuY3Rpb24gbWtXaW5kb3cgKHRhYjogbnVtYmVyID0gMCApIHtcblxuICBsZXQgdGFiRmllbGRzID0gW1xuICAgIFsnbWFwJywgbWFwVmlldyhtb2R1bGUpXSxcbiAgICBbJ3BsYW5uZXInLCBhd2FpdCBwbGFubmVyVmlldyhtb2R1bGUpXSxcbiAgICBbJ3dhc20nLCB3YXNtVmlldyhtb2R1bGUpXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gIH0pKVxuXG4gIGZ1bmN0aW9uIG9wZW5UYWIodGFiOiB0eXBlb2YgdGFiRmllbGRzW251bWJlcl1bMF0pIHtcbiAgICBjb25zdCB0YWJzID0gcChcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgbWFyZ2luOiBcIjBcIixcbiAgICAgICAgcGFkZGluZzogXCIuNGVtXCIsXG4gICAgICAgIGZsZXg6IFwiMCAwIGF1dG9cIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLm1hcCgoW24sZV0pPT5cbiAgICAgICAgc3BhbiggbixcbiAgICAgICAgICAoKT0+b3BlblRhYihuKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIuM2VtXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIisgKG49PXRhYiA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSksXG4gICAgICAgICAgICBjb2xvcjogKG49PXRhYikgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBkaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGZsZXg6IFwiMSAxIGF1dG9cIixcbiAgICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMuZmluZCgoW24sXSk9Pm49PXRhYikhWzFdXG4gICAgKVxuXG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgdGFicyxcbiAgICAgIGNvbnRlbnRcbiAgICApXG4gIH1cblxuICBvcGVuVGFiKHRhYkZpZWxkc1t0YWJdIVswXSlcblxuICByZXR1cm4gZWxcbn1cblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbiguLi5hd2FpdCBQcm9taXNlLmFsbChbbWtXaW5kb3coMSksIG1rV2luZG93KCldKSlcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFFTyxJQUFNLE9BQU8sU0FBUztBQUU3QixJQUFNLGVBQWU7QUFBQSxFQUNuQixPQUFNO0FBQUEsSUFDSixPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsRUFDckI7QUFBQSxFQUNBLE1BQUs7QUFBQSxJQUNILE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNuQixLQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25C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
