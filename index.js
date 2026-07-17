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
  const acceptAnneal2 = func(["i32", "i32", "i32"], "i32", (previous, next, temperature) => [
    ifElse(previous.gt(next), ret(randint.call(0, temperature.add(previous.sub(next))).lt(temperature).and(randint.call(0, temperature.add(previous.sub(next))).lt(temperature))), ret(1))
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
      tran.set(randint.call(0, planner.NTRANS)),
      req_id.set(randint.call(0, planner.NREQS)),
      ifElse(assigned.at(req_id).eq(1), ret()),
      toffset.set(tran.mul(TSIZE)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.gt(TSIZE - 2), ret()),
      previousScore.set(rateTran.call(tran)),
      A.set(randint.call(0, tsize.add(1))),
      B.set(A.add(randint.call(0, 4))),
      ifElse(B.gt(tsize), B.set(tsize)),
      schedView.move(B.add(2), B, tsize.sub(B)),
      schedView.move(A.add(1), A, B.sub(A)),
      tmp.set(randint.call(0, 2)),
      schedView.at(A).set({ req_id, is_load: 1, deck: tmp }),
      schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp }),
      sched_size.at(tran).set(tsize.add(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), assigned.at(req_id).set(1), [
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
      tran.set(randint.call(0, planner.NTRANS)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.lt(2), ret()),
      toffset.set(tran.mul(TSIZE)),
      step.set(schedView.at(randint.call(0, tsize))),
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
      previousScore.set(rateTran.call(tran)),
      schedView.move(A, A.add(1), B.sub(A).sub(1)),
      schedView.move(B.sub(1), B.add(1), tsize.sub(B).sub(1)),
      sched_size.at(tran).set(tsize.sub(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(acceptAnneal2.call(previousScore, nextScore, temperature), assigned.at(req).set(0), [
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
        assigned.at(bestReq).set(1)
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
    randState,
    schedule,
    search,
    sched_size,
    tran_positions
  });
  wasm.dists.set(planner.roadmap.CostMatrix);
  wasm.randState.set(Array.from({ length: NWORKERS * 2 }, (_, i) => i + 1));
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
var euros = (cents) => `${(cents / 100).toFixed(2)}€`;

class ScoreMismatchError extends Error {
}
function canonicalSchedule(mod2, result) {
  const schedule = new Uint32Array(result.schedule);
  for (let tran = 0;tran < mod2.NTRANS; tran++) {
    const size = result.scheduleSizes[tran];
    if (size < 0 || size > result.TSIZE)
      throw new ScoreMismatchError(`Transporter ${tran} has invalid schedule size ${size}`);
    for (let i = 0;i < size; i++) {
      const at = tran * result.TSIZE + i;
      const step = schedule[at];
      if (step === undefined)
        throw new ScoreMismatchError(`Transporter ${tran} schedule is truncated at ${i}`);
      const req = getReq(step), request = mod2.requests[req];
      if (!request)
        throw new ScoreMismatchError(`Transporter ${tran} references unknown request ${req}`);
      const pos = isLoad(step) ? request.startPoint : request.endPoint;
      schedule[at] = step & 65535 | pos << 16;
    }
  }
  return schedule;
}
function checkedResult(mod2, result) {
  if (result.scheduleSizes.length !== mod2.NTRANS || result.scheduleRatings.length !== mod2.NTRANS)
    throw new ScoreMismatchError("Solver returned incorrectly sized transporter arrays");
  const schedule = canonicalSchedule(mod2, result);
  const state = initAnnealingState(mod2);
  Object.assign(state, {
    TSIZE: result.TSIZE,
    schedule,
    scheduleSizes: result.scheduleSizes,
    scheduleRatings: result.scheduleRatings,
    tranStart: result.tranStart,
    unassigned: result.unassigned
  });
  let total = 0;
  for (let tran = 0;tran < mod2.NTRANS; tran++) {
    const expected = scoreRoute(state, tran), reported = result.scheduleRatings[tran];
    if (reported !== expected)
      throw new ScoreMismatchError(`Transporter ${tran} score mismatch: reported ${reported}, JS ${expected}`);
    total += expected;
  }
  if (result.totalScore !== total)
    throw new ScoreMismatchError(`Total score mismatch: reported ${result.totalScore}, JS ${total}`);
  return result;
}
function makeReport(mod2, solver, result) {
  const schedule = canonicalSchedule(mod2, result);
  const routes = Array.from({ length: mod2.NTRANS }, (_, tran) => {
    const decks = [[], []];
    const steps = [];
    let pos = result.tranStart[tran], elapsedMinutes = 0, rewardCents = 0, costCents = 0;
    let invalid = null;
    for (let i = 0;i < result.scheduleSizes[tran]; i++) {
      const packed = schedule[tran * result.TSIZE + i], load = !!isLoad(packed);
      const req = getReq(packed), deckNumber = getDeck(packed), request = mod2.requests[req];
      const nextPos = load ? request.startPoint : request.endPoint;
      const distanceKm = mod2.roadmap.getCostN(pos, nextPos);
      const travelCostCents = distanceKm * KM_COST_CENTS;
      elapsedMinutes += distanceKm * 60 / AVG_SPEED_KMH;
      costCents += travelCostCents;
      let reorgItems = 0, rewardAddedCents = 0;
      const deck = decks[deckNumber];
      if (load) {
        deck.push(req);
        if (deck.length > 3)
          invalid = `deck ${deckNumber} exceeds capacity`;
      } else {
        const index = deck.indexOf(req);
        if (index < 0)
          invalid = `request ${req} is not on deck ${deckNumber}`;
        else {
          reorgItems = deck.length - index - 1;
          costCents += reorgItems * REORG_COST_CENTS;
          deck.splice(index, 1);
          if (elapsedMinutes <= Math.floor(request.deadline_h * 60)) {
            rewardAddedCents = Math.round(request.value_eur * 100);
            rewardCents += rewardAddedCents;
          }
        }
      }
      steps.push({
        index: i,
        req,
        action: load ? "load" : "unload",
        deck: deckNumber,
        from: pos,
        to: nextPos,
        distanceKm,
        elapsedMinutes,
        deadlineMinutes: Math.floor(request.deadline_h * 60),
        travelCostCents,
        reorgItems,
        reorgCostCents: reorgItems * REORG_COST_CENTS,
        rewardAddedCents,
        rewardCents,
        costCents,
        scoreCents: rewardCents - costCents,
        decks: decks.map((items) => [...items]),
        invalid
      });
      pos = nextPos;
      if (invalid)
        break;
    }
    return {
      tran,
      start: result.tranStart[tran],
      size: result.scheduleSizes[tran],
      reportedScoreCents: result.scheduleRatings[tran],
      jsScoreCents: invalid ? -INF : rewardCents - costCents,
      invalid,
      steps
    };
  });
  return {
    createdAt: new Date().toISOString(),
    solver,
    constants: { KM_COST_CENTS, AVG_SPEED_KMH, REORG_COST_CENTS },
    module: {
      NREQS: mod2.NREQS,
      NTRANS: mod2.NTRANS,
      MAPSIZE: mod2.MAPSIZE,
      RSIZE: mod2.RSIZE,
      startpositions: mod2.startpositions,
      requests: mod2.requests,
      points: mod2.roadmap.points,
      costMatrix: Array.from(mod2.roadmap.CostMatrix)
    },
    result: {
      TSIZE: result.TSIZE,
      elapsedMs: result.elapsedMs,
      totalScore: result.totalScore,
      schedule: Array.from(result.schedule),
      scheduleSizes: Array.from(result.scheduleSizes),
      scheduleRatings: Array.from(result.scheduleRatings),
      unassigned: Array.from(result.unassigned)
    },
    routes
  };
}
async function saveReport(mod2, solver, result) {
  const response = await fetch("/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(makeReport(mod2, solver, result))
  });
  if (!response.ok)
    throw new Error(`Report endpoint returned ${response.status}`);
  console.info("Annealing report saved", await response.json());
}
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
    }), tr(cell("unassigned requests"), cell(Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).flatMap((x) => [span(" "), itemButton(x.i)]))), tr(cell("search time"), cell(`${annealer?.elapsedMs ?? 0}ms`)), tr(cell("score"), cell(euros(annealer.totalScore))), tr(cell("transporter count"), cell(mod2.NTRANS)), tr(cell("request count"), cell(mod2.NREQS)), tr(cell("cost per km"), cell(euros(KM_COST_CENTS))), tr(cell("average speed"), cell(`${AVG_SPEED_KMH}km/h`)), tr(cell("reorganization cost"), cell(euros(REORG_COST_CENTS))))));
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
        annealingSession = createImprovedAnnealingSession(mod2, 1900000);
        result = annealingSession.iterateForMs(10);
      } else {
        result = await availableSolvers[name](mod2);
      }
      annealer = checkedResult(mod2, result);
      if (id === runId) {
        render(true);
        saveReport(mod2, name, annealer).catch((error) => console.warn("Could not save annealing report", error));
      }
    } catch (error) {
      if (error instanceof ScoreMismatchError) {
        if (result)
          try {
            await saveReport(mod2, name, result);
          } catch (reportError) {
            console.warn("Could not save mismatch report", reportError);
          }
        throw error;
      }
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
      annealer = checkedResult(mod2, annealingSession.iterateForMs(120));
      render();
    }, 150);
  };
  heatButton.onclick = () => {
    if (!annealingSession)
      return;
    annealer = checkedResult(mod2, annealingSession.reheat());
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

//# debugId=32C1A45DAF82CC7464756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JvYWRtYXAudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3NoYXJlZC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmdfaW1wcm92ZWQudHMiLCAic3JjL3dhc20vYXN0LnRzIiwgInNyYy93YXNtL2FuYWx5emUudHMiLCAic3JjL3dhc20vY29kZWdlbi50cyIsICJzcmMvd2FzbS9pbmRleC50cyIsICJzcmMvcGxhbm5lcnMvYW5uZWFsaW5nX3dhc20udHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvdmlldy93YXNtdmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgTW9kdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG4vLyBpbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JvYWRtYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuICBmdW5jdGlvbiBjb25uZWN0KGE6IG51bWJlciwgYjogbnVtYmVyLCBkaXN0OiBudW1iZXIpe1xuICAgIGlmIChhID09PSBiKSByZXR1cm5cbiAgICBpZiAoZ2V0cm9hZChhLCBiKSAhPT0gMCkgcmV0dXJuXG4gICAgc2V0cm9hZChhLCBiLCBkaXN0KVxuICB9XG5cbiAgLy8gQnVpbGQgYSBjb25uZWN0ZWQgYmFja2JvbmUgYnkgcmVwZWF0ZWRseSBhdHRhY2hpbmcgdGhlIG5lYXJlc3QgdW5jb25uZWN0ZWQgcG9pbnQuXG4gIGNvbnN0IGNvbm5lY3RlZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIHdoaWxlIChjb25uZWN0ZWQuc2l6ZSA8IE5QT0lOVFMpe1xuICAgIGxldCBiZXN0QSA9IC0xXG4gICAgbGV0IGJlc3RCID0gLTFcbiAgICBsZXQgYmVzdEQgPSBJbmZpbml0eVxuXG4gICAgZm9yIChjb25zdCBhIG9mIGNvbm5lY3RlZCl7XG4gICAgICBmb3IgKGNvbnN0IG5laSBvZiBuZWlnaHNbYV0gPz8gW10pe1xuICAgICAgICBpZiAoY29ubmVjdGVkLmhhcyhuZWkuaSkpIGNvbnRpbnVlXG4gICAgICAgIGlmIChuZWkuZCA8IGJlc3REKXtcbiAgICAgICAgICBiZXN0QSA9IGFcbiAgICAgICAgICBiZXN0QiA9IG5laS5pXG4gICAgICAgICAgYmVzdEQgPSBuZWkuZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJlc3RBID09PSAtMSB8fCBiZXN0QiA9PT0gLTEpIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHJhbmRvbSBtYXBcIilcbiAgICBjb25uZWN0KGJlc3RBLCBiZXN0QiwgYmVzdEQpXG4gICAgY29ubmVjdGVkLmFkZChiZXN0QilcbiAgfVxuXG4gIC8vIEFkZCBhIGZldyBleHRyYSBsb2NhbCByb2FkcyBzbyB0aGUgbWFwIGlzIG5vdCBqdXN0IGEgdHJlZS5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGNvbnN0IGV4dHJhRWRnZXMgPSAyICsgcmFuZEludCgwLCAzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXh0cmFFZGdlczsgaSsrKXtcbiAgICAgIGNvbnN0IG54ID0gbmVpZ2hzW3hdPy5baV1cbiAgICAgIGlmICghbngpIGNvbnRpbnVlXG4gICAgICBjb25uZWN0KHgsIG54LmksIG54LmQpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi9yb2FkbWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuXG5leHBvcnQgY29uc3QgS01fQ09TVF9DRU5UUyA9IDUwO1xuZXhwb3J0IGNvbnN0IEFWR19TUEVFRF9LTUggPSA2MDtcbmV4cG9ydCBjb25zdCBSRU9SR19DT1NUX0NFTlRTID0gMTBfMDAwO1xuZXhwb3J0IGNvbnN0IElORiA9IDEgPDwgMzA7XG5cbmV4cG9ydCB0eXBlIFBhaXJJbmZvID0ge1xuICByZXE6IG51bWJlcjtcbiAgZmlyc3Q6IG51bWJlcjtcbiAgc2Vjb25kOiBudW1iZXI7XG4gIGRlY2s6IDAgfCAxO1xufTtcblxuZXhwb3J0IHR5cGUgQW5uZWFsaW5nU3RhdGUgPSB7XG4gIG1vZDogTW9kdWxlO1xuICBOUkVRUzogbnVtYmVyO1xuICBOVFJBTlM6IG51bWJlcjtcbiAgVFNJWkU6IG51bWJlcjtcbiAgcmVxUGlja3VwTG9jYXRpb25zOiBVaW50MTZBcnJheTtcbiAgcmVxRGVsaXZlcnlMb2NhdGlvbnM6IFVpbnQxNkFycmF5O1xuICByZXFEZWFkbGluZXM6IFVpbnQzMkFycmF5O1xuICByZXFWYWx1ZXM6IFVpbnQzMkFycmF5O1xuICB1bmFzc2lnbmVkOiBJbnQ4QXJyYXk7XG4gIHRyYW5TdGFydDogVWludDE2QXJyYXk7XG4gIHNjaGVkdWxlOiBVaW50MzJBcnJheTtcbiAgc2NoZWR1bGVTaXplczogVWludDE2QXJyYXk7XG4gIHNjaGVkdWxlUmF0aW5nczogSW50MzJBcnJheTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xvYWQoeDogbnVtYmVyKSB7XG4gIHJldHVybiB4ICYgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlY2soeDogbnVtYmVyKSB7XG4gIHJldHVybiAoKHggJiAyKSA+PiAxKSBhcyAwIHwgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlcSh4OiBudW1iZXIpIHtcbiAgcmV0dXJuICh4ICYgMHhmZmZmKSA+PiAyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9zKHg6IG51bWJlcikge1xuICByZXR1cm4geCA+PiAxNjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRBbm5lYWxpbmdTdGF0ZShtb2Q6IE1vZHVsZSwgc2VlZD86IEFubmVhbGluZ1Jlc3VsdCk6IEFubmVhbGluZ1N0YXRlIHtcbiAgY29uc3QgeyBOUkVRUywgcmVxdWVzdHMsIHN0YXJ0cG9zaXRpb25zLCBOVFJBTlMgfSA9IG1vZDtcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKE5SRVFTICogMi41ICsgMTApO1xuXG4gIHJldHVybiB7XG4gICAgbW9kLFxuICAgIE5SRVFTLFxuICAgIE5UUkFOUyxcbiAgICBUU0laRSxcbiAgICByZXFQaWNrdXBMb2NhdGlvbnM6IG5ldyBVaW50MTZBcnJheShyZXF1ZXN0cy5tYXAoKHIpID0+IHIuc3RhcnRQb2ludCkpLFxuICAgIHJlcURlbGl2ZXJ5TG9jYXRpb25zOiBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiByLmVuZFBvaW50KSksXG4gICAgcmVxRGVhZGxpbmVzOiBuZXcgVWludDMyQXJyYXkocmVxdWVzdHMubWFwKChyKSA9PiBNYXRoLmZsb29yKHIuZGVhZGxpbmVfaCAqIDYwKSkpLFxuICAgIHJlcVZhbHVlczogbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcCgocikgPT4gTWF0aC5yb3VuZChyLnZhbHVlX2V1ciAqIDEwMCkpKSxcbiAgICB1bmFzc2lnbmVkOiBzZWVkID8gbmV3IEludDhBcnJheShzZWVkLnVuYXNzaWduZWQpIDogbmV3IEludDhBcnJheShyZXF1ZXN0cy5tYXAoKCkgPT4gMSkpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHN0YXJ0cG9zaXRpb25zKSxcbiAgICBzY2hlZHVsZTogc2VlZCA/IG5ldyBVaW50MzJBcnJheShzZWVkLnNjaGVkdWxlKSA6IG5ldyBVaW50MzJBcnJheShUU0laRSAqIE5UUkFOUyksXG4gICAgc2NoZWR1bGVTaXplczogc2VlZCA/IG5ldyBVaW50MTZBcnJheShzZWVkLnNjaGVkdWxlU2l6ZXMpIDogbmV3IFVpbnQxNkFycmF5KE5UUkFOUyksXG4gICAgc2NoZWR1bGVSYXRpbmdzOiBzZWVkID8gbmV3IEludDMyQXJyYXkoc2VlZC5zY2hlZHVsZVJhdGluZ3MpIDogbmV3IEludDMyQXJyYXkoTlRSQU5TKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlT2Zmc2V0KHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyKSB7XG4gIHJldHVybiB0cmFuICogc3RhdGUuVFNJWkU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRSZXEoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIGlkeDogbnVtYmVyLCBpc0xvYWRCaXQ6IDEgfCAwLCBkZWNrOiAwIHwgMSwgcmVxOiBudW1iZXIsIHBvczogbnVtYmVyKSB7XG4gIHN0YXRlLnNjaGVkdWxlW3JvdXRlT2Zmc2V0KHN0YXRlLCB0cmFuKSArIGlkeF0gPSAoaXNMb2FkQml0IDw8IDApIHwgKGRlY2sgPDwgMSkgfCAocmVxIDw8IDIpIHwgKHBvcyA8PCAxNik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzY29yZVJvdXRlKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyKSB7XG4gIGxldCByZXdhcmQgPSAwO1xuICBsZXQgY29zdCA9IDA7XG4gIGxldCBlbGFwc2VkTWludXRlcyA9IDA7XG4gIGNvbnN0IGRlY2tzOiBbbnVtYmVyW10sIG51bWJlcltdXSA9IFtbXSwgW11dO1xuICBsZXQgcG9zID0gc3RhdGUudHJhblN0YXJ0W3RyYW5dITtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7IGkrKykge1xuICAgIGNvbnN0IHN0ZXAgPSBzdGF0ZS5zY2hlZHVsZVtvZmZzZXQgKyBpXSE7XG4gICAgY29uc3QgbG9hZCA9IGlzTG9hZChzdGVwKTtcbiAgICBjb25zdCByZXEgPSBnZXRSZXEoc3RlcCk7XG4gICAgY29uc3QgbmV4dFBvcyA9IGdldFBvcyhzdGVwKTtcbiAgICBjb25zdCBkaXN0YW5jZSA9IHN0YXRlLm1vZC5yb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dFBvcyk7XG4gICAgY29zdCArPSBkaXN0YW5jZSAqIEtNX0NPU1RfQ0VOVFM7XG4gICAgZWxhcHNlZE1pbnV0ZXMgKz0gZGlzdGFuY2UgKiA2MCAvIEFWR19TUEVFRF9LTUg7XG4gICAgcG9zID0gbmV4dFBvcztcblxuICAgIGlmIChsb2FkKSB7XG4gICAgICBjb25zdCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hO1xuICAgICAgZGVjay5wdXNoKHJlcSk7XG4gICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSByZXR1cm4gLUlORjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2dldERlY2soc3RlcCldITtcbiAgICAgIGNvbnN0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpO1xuICAgICAgaWYgKGlkeCA9PT0gLTEpIHJldHVybiAtSU5GO1xuICAgICAgY29zdCArPSAoZGVjay5sZW5ndGggLSBpZHggLSAxKSAqIFJFT1JHX0NPU1RfQ0VOVFM7XG4gICAgICBkZWNrLnNwbGljZShpZHgsIDEpO1xuICAgICAgaWYgKGVsYXBzZWRNaW51dGVzIDw9IHN0YXRlLnJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHN0YXRlLnJlcVZhbHVlc1tyZXFdITtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV3YXJkIC0gY29zdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hBbGxSYXRpbmdzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSkge1xuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHN0YXRlLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgc3RhdGUuc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJvb3RzdHJhcEVtcHR5Um91dGVzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgbWF4TG9zcyA9IDEyXzAwMCkge1xuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IHN0YXRlLk5UUkFOUzsgdHJhbisrKSB7XG4gICAgaWYgKHN0YXRlLnNjaGVkdWxlU2l6ZXNbdHJhbl0gIT09IDApIGNvbnRpbnVlO1xuXG4gICAgbGV0IGJlc3RSZXEgPSAtMTtcbiAgICBsZXQgYmVzdFNjb3JlID0gLUlORjtcblxuICAgIGZvciAobGV0IHJlcSA9IDA7IHJlcSA8IHN0YXRlLk5SRVFTOyByZXErKykge1xuICAgICAgaWYgKCFzdGF0ZS51bmFzc2lnbmVkW3JlcV0pIGNvbnRpbnVlO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIDAsIDAsIDAsIHJlcSk7XG4gICAgICBjb25zdCBzY29yZSA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIDAsIDEpO1xuICAgICAgaWYgKHNjb3JlID4gYmVzdFNjb3JlKSB7XG4gICAgICAgIGJlc3RTY29yZSA9IHNjb3JlO1xuICAgICAgICBiZXN0UmVxID0gcmVxO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChiZXN0UmVxID09PSAtMSB8fCBiZXN0U2NvcmUgPCAtbWF4TG9zcykgY29udGludWU7XG5cbiAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgdHJhbiwgMCwgMCwgMCwgYmVzdFJlcSk7XG4gICAgc3RhdGUuc2NoZWR1bGVSYXRpbmdzW3RyYW5dID0gYmVzdFNjb3JlO1xuICAgIHN0YXRlLnVuYXNzaWduZWRbYmVzdFJlcV0gPSAwO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRTdG9wcyhzdGF0ZTogQW5uZWFsaW5nU3RhdGUsIHRyYW46IG51bWJlciwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIsIGRlY2s6IDAgfCAxLCByZXE6IG51bWJlcikge1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG4gIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSA9IHNpemUgKyAyO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIGVuZCArIDIsIG9mZnNldCArIGVuZCwgb2Zmc2V0ICsgc2l6ZSk7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgZW5kICsgMSk7XG4gIHNldFJlcShzdGF0ZSwgdHJhbiwgc3RhcnQsIDEsIGRlY2ssIHJlcSwgc3RhdGUucmVxUGlja3VwTG9jYXRpb25zW3JlcV0hKTtcbiAgc2V0UmVxKHN0YXRlLCB0cmFuLCBlbmQgKyAxLCAwLCBkZWNrLCByZXEsIHN0YXRlLnJlcURlbGl2ZXJ5TG9jYXRpb25zW3JlcV0hKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVN0b3BzKHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgdHJhbjogbnVtYmVyLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBjb25zdCBvZmZzZXQgPSByb3V0ZU9mZnNldChzdGF0ZSwgdHJhbik7XG4gIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSA9IHNpemUgLSAyO1xuICBzdGF0ZS5zY2hlZHVsZS5jb3B5V2l0aGluKG9mZnNldCArIHN0YXJ0LCBvZmZzZXQgKyBzdGFydCArIDEsIG9mZnNldCArIGVuZCk7XG4gIHN0YXRlLnNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kIC0gMSwgb2Zmc2V0ICsgZW5kICsgMSwgb2Zmc2V0ICsgc2l6ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUGFpckluUm91dGUoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCB0cmFuOiBudW1iZXIsIHJlcTogbnVtYmVyKTogUGFpckluZm8gfCBudWxsIHtcbiAgY29uc3Qgb2Zmc2V0ID0gcm91dGVPZmZzZXQoc3RhdGUsIHRyYW4pO1xuICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gIGxldCBmaXJzdCA9IC0xO1xuICBsZXQgc2Vjb25kID0gLTE7XG4gIGxldCBkZWNrOiAwIHwgMSA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICBjb25zdCBzdGVwID0gc3RhdGUuc2NoZWR1bGVbb2Zmc2V0ICsgaV0hO1xuICAgIGlmIChnZXRSZXEoc3RlcCkgIT09IHJlcSkgY29udGludWU7XG4gICAgaWYgKGZpcnN0ID09PSAtMSkge1xuICAgICAgZmlyc3QgPSBpO1xuICAgICAgZGVjayA9IGdldERlY2soc3RlcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlY29uZCA9IGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoZmlyc3QgPT09IC0xIHx8IHNlY29uZCA9PT0gLTEpIHJldHVybiBudWxsO1xuICByZXR1cm4geyByZXEsIGZpcnN0LCBzZWNvbmQsIGRlY2sgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhbXBsZVVuYXNzaWduZWRSZXEoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBtYXhBdHRlbXB0cyA9IDI0KTogbnVtYmVyIHwgbnVsbCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4QXR0ZW1wdHM7IGkrKykge1xuICAgIGNvbnN0IHJlcSA9IHJhbmRJbnQoMCwgc3RhdGUuTlJFUVMpO1xuICAgIGlmIChzdGF0ZS51bmFzc2lnbmVkW3JlcV0pIHJldHVybiByZXE7XG4gIH1cblxuICBmb3IgKGxldCByZXEgPSAwOyByZXEgPCBzdGF0ZS5OUkVRUzsgcmVxKyspIHtcbiAgICBpZiAoc3RhdGUudW5hc3NpZ25lZFtyZXFdKSByZXR1cm4gcmVxO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGU6IEFubmVhbGluZ1N0YXRlLCBtYXhBdHRlbXB0cyA9IDI0KTogeyB0cmFuOiBudW1iZXI7IHBhaXI6IFBhaXJJbmZvIH0gfCBudWxsIHtcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCBtYXhBdHRlbXB0czsgYXR0ZW1wdCsrKSB7XG4gICAgY29uc3QgdHJhbiA9IHJhbmRJbnQoMCwgc3RhdGUuTlRSQU5TKTtcbiAgICBjb25zdCBzaXplID0gc3RhdGUuc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNpemUgPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCBpZHggPSByYW5kSW50KDAsIHNpemUpO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbikgKyBpZHhdISk7XG4gICAgY29uc3QgcGFpciA9IGZpbmRQYWlySW5Sb3V0ZShzdGF0ZSwgdHJhbiwgcmVxKTtcbiAgICBpZiAocGFpcikgcmV0dXJuIHsgdHJhbiwgcGFpciB9O1xuICB9XG5cbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBzdGF0ZS5OVFJBTlM7IHRyYW4rKykge1xuICAgIGNvbnN0IHNpemUgPSBzdGF0ZS5zY2hlZHVsZVNpemVzW3RyYW5dITtcbiAgICBpZiAoc2l6ZSA8IDIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGF0ZS5zY2hlZHVsZVtyb3V0ZU9mZnNldChzdGF0ZSwgdHJhbildISk7XG4gICAgY29uc3QgcGFpciA9IGZpbmRQYWlySW5Sb3V0ZShzdGF0ZSwgdHJhbiwgcmVxKTtcbiAgICBpZiAocGFpcikgcmV0dXJuIHsgdHJhbiwgcGFpciB9O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhY2NlcHRBbm5lYWwocHJldlNjb3JlOiBudW1iZXIsIG5leHRTY29yZTogbnVtYmVyLCB0ZW1wOiBudW1iZXIpIHtcbiAgaWYgKG5leHRTY29yZSA+PSBwcmV2U2NvcmUpIHJldHVybiB0cnVlO1xuICBjb25zdCBkZWx0YSA9IHByZXZTY29yZSAtIG5leHRTY29yZTtcbiAgcmV0dXJuIHJhbmRvbSgpIDwgTWF0aC5leHAoLWRlbHRhIC8gTWF0aC5tYXgodGVtcCwgMC4wMDEpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvQW5uZWFsaW5nUmVzdWx0KHN0YXRlOiBBbm5lYWxpbmdTdGF0ZSwgZWxhcHNlZE1zOiBudW1iZXIpOiBBbm5lYWxpbmdSZXN1bHQge1xuICByZXR1cm4ge1xuICAgIHNjaGVkdWxlOiBzdGF0ZS5zY2hlZHVsZSxcbiAgICBzY2hlZHVsZVNpemVzOiBzdGF0ZS5zY2hlZHVsZVNpemVzLFxuICAgIHRyYW5TdGFydDogc3RhdGUudHJhblN0YXJ0LFxuICAgIFRTSVpFOiBzdGF0ZS5UU0laRSxcbiAgICBzY2hlZHVsZVJhdGluZ3M6IHN0YXRlLnNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkOiBzdGF0ZS51bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiBzdGF0ZS5zY2hlZHVsZVJhdGluZ3MucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCksXG4gIH07XG59XG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQge1xuICBib290c3RyYXBFbXB0eVJvdXRlcyxcbiAgZ2V0RGVjayxcbiAgZ2V0UmVxLFxuICBpbml0QW5uZWFsaW5nU3RhdGUsXG4gIGluc2VydFN0b3BzLFxuICByZW1vdmVTdG9wcyxcbiAgc2NvcmVSb3V0ZSxcbiAgdG9Bbm5lYWxpbmdSZXN1bHQsXG59IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIjtcblxuZXhwb3J0IHR5cGUgQW5uZWFsaW5nUmVzdWx0ID0ge1xuICBzY2hlZHVsZTogVWludDMyQXJyYXk7XG4gIHNjaGVkdWxlU2l6ZXM6IFVpbnQxNkFycmF5O1xuICB0cmFuU3RhcnQ6IFVpbnQxNkFycmF5O1xuICBUU0laRTogbnVtYmVyO1xuICBzY2hlZHVsZVJhdGluZ3M6IEludDMyQXJyYXk7XG4gIHVuYXNzaWduZWQ6IEludDhBcnJheTtcbiAgZWxhcHNlZE1zOiBudW1iZXI7XG4gIHRvdGFsU2NvcmU6IG51bWJlcjtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlbGluZUFubmVhbGluZyhtb2Q6IE1vZHVsZSwgc3RlcHMgPSAxXzYwMF8wMDApOiBBbm5lYWxpbmdSZXN1bHQge1xuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QpO1xuICBjb25zdCB7IE5SRVFTLCBOVFJBTlMsIFRTSVpFLCBzY2hlZHVsZSwgc2NoZWR1bGVTaXplcywgc2NoZWR1bGVSYXRpbmdzLCB1bmFzc2lnbmVkIH0gPSBzdGF0ZTtcblxuICBsZXQgc3RhcnRUZW1wID0gNV8wMDA7XG4gIGxldCB0ZW1wID0gc3RhcnRUZW1wO1xuXG4gIGJvb3RzdHJhcEVtcHR5Um91dGVzKHN0YXRlKTtcblxuICBmdW5jdGlvbiBhY2NlcHQocHJldlJhdGluZzogbnVtYmVyLCBuZXh0UmF0aW5nOiBudW1iZXIpIHtcbiAgICBpZiAobmV4dFJhdGluZyA+PSBwcmV2UmF0aW5nKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gcmFuZG9tKCkgPCBNYXRoLmV4cCgobmV4dFJhdGluZyAtIHByZXZSYXRpbmcpIC8gTWF0aC5tYXgodGVtcCwgMC4wMDEpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnbigpIHtcbiAgICBjb25zdCB0cmFuID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgIGNvbnN0IHNjaGVkU2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIHNjaGVkU2l6ZSArIDEpO1xuICAgIGNvbnN0IGIgPSBNYXRoLm1pbihzY2hlZFNpemUsIHJhbmRJbnQoMCwgNCkgKyBhKTtcbiAgICBjb25zdCByZXEgPSByYW5kSW50KDAsIE5SRVFTKTtcbiAgICBpZiAoIXVuYXNzaWduZWRbcmVxXSkgcmV0dXJuO1xuXG4gICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIsIHJhbmRvbSgpID4gMC41ID8gMSA6IDAsIHJlcSk7XG4gICAgY29uc3QgbmV3UmF0aW5nID0gc2NvcmVSb3V0ZShzdGF0ZSwgdHJhbik7XG4gICAgaWYgKGFjY2VwdChzY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBuZXdSYXRpbmcpKSB7XG4gICAgICBzY2hlZHVsZVJhdGluZ3NbdHJhbl0gPSBuZXdSYXRpbmc7XG4gICAgICB1bmFzc2lnbmVkW3JlcV0gPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgYSwgYiArIDEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVVuYXNzaWduKCkge1xuICAgIGNvbnN0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUyk7XG4gICAgY29uc3Qgc2NoZWRTaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSE7XG4gICAgaWYgKHNjaGVkU2l6ZSA8IDIpIHJldHVybjtcbiAgICBjb25zdCBpZHggPSByYW5kSW50KDAsIHNjaGVkU2l6ZSk7XG4gICAgY29uc3QgaXRlbSA9IHNjaGVkdWxlW3RyYW4gKiBUU0laRSArIGlkeF0hO1xuICAgIGNvbnN0IHJlcSA9IGdldFJlcShpdGVtKTtcblxuICAgIGNvbnN0IGFiOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZWRTaXplOyBpKyspIHtcbiAgICAgIGlmIChnZXRSZXEoc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaV0hKSA9PT0gcmVxKSBhYi5wdXNoKGkpO1xuICAgIH1cbiAgICBpZiAoYWIubGVuZ3RoICE9PSAyKSByZXR1cm47XG5cbiAgICBjb25zdCBbYSwgYl0gPSBhYiBhcyBbbnVtYmVyLCBudW1iZXJdO1xuICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiKTtcbiAgICBjb25zdCBuZXdSYXRpbmcgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICBpZiAoYWNjZXB0KHNjaGVkdWxlUmF0aW5nc1t0cmFuXSEsIG5ld1JhdGluZykpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld1JhdGluZztcbiAgICAgIHVuYXNzaWduZWRbcmVxXSA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiIC0gMSwgZ2V0RGVjayhpdGVtKSBhcyAwIHwgMSwgcmVxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RlcHM7IGkrKykge1xuICAgIHRlbXAgPSAoMSAtIGkgLyBzdGVwcykgKiBzdGFydFRlbXA7XG4gICAgdHJ5VW5hc3NpZ24oKTtcbiAgICB0cnlBc3NpZ24oKTtcbiAgfVxuXG4gIHJldHVybiB0b0FubmVhbGluZ1Jlc3VsdChzdGF0ZSwgRGF0ZS5ub3coKSAtIHN0YXJ0ZWRBdCk7XG59XG4iLAogICAgImltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFubmVhbGluZ1Jlc3VsdCB9IGZyb20gXCIuL2FubmVhbGluZ19iYXNlbGluZVwiO1xuaW1wb3J0IHsgYmFzZWxpbmVBbm5lYWxpbmcgfSBmcm9tIFwiLi9hbm5lYWxpbmdfYmFzZWxpbmVcIjtcbmltcG9ydCB7XG4gIGFjY2VwdEFubmVhbCxcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMsXG4gIGluaXRBbm5lYWxpbmdTdGF0ZSxcbiAgaW5zZXJ0U3RvcHMsXG4gIHR5cGUgUGFpckluZm8sXG4gIHJlbW92ZVN0b3BzLFxuICBzYW1wbGVBc3NpZ25lZFBhaXIsXG4gIHNhbXBsZVVuYXNzaWduZWRSZXEsXG4gIHNjb3JlUm91dGUsXG4gIHRvQW5uZWFsaW5nUmVzdWx0LFxufSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbnR5cGUgSW1wcm92ZWRPcHRpb25zID1cbiAgfCB7IHN0ZXBzOiBudW1iZXI7IGJ1ZGdldE1zPzogbmV2ZXIgfVxuICB8IHsgYnVkZ2V0TXM6IG51bWJlcjsgc3RlcHM/OiBuZXZlciB9O1xuXG5leHBvcnQgdHlwZSBJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24gPSB7XG4gIGl0ZXJhdGVTdGVwczogKHN0ZXBzOiBudW1iZXIpID0+IEFubmVhbGluZ1Jlc3VsdDtcbiAgaXRlcmF0ZUZvck1zOiAoYnVkZ2V0TXM6IG51bWJlcikgPT4gQW5uZWFsaW5nUmVzdWx0O1xuICBnZXRSZXN1bHQ6ICgpID0+IEFubmVhbGluZ1Jlc3VsdDtcbiAgcmVoZWF0OiAoZmFjdG9yPzogbnVtYmVyKSA9PiBBbm5lYWxpbmdSZXN1bHQ7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uKG1vZDogTW9kdWxlLCB0YXJnZXRTdGVwcyA9IDE1MDAwMCk6IEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB7XG4gIGNvbnN0IHdhcm11cFN0ZXBzID0gTWF0aC5taW4oTWF0aC5tYXgoMjAwMDAsIE1hdGguZmxvb3IodGFyZ2V0U3RlcHMgKiAwLjIpKSwgNTAwMDApO1xuICBjb25zdCB3YXJtdXAgPSBiYXNlbGluZUFubmVhbGluZyhtb2QsIHdhcm11cFN0ZXBzKTtcbiAgY29uc3Qgc3RhdGUgPSBpbml0QW5uZWFsaW5nU3RhdGUobW9kLCB3YXJtdXApO1xuICBjb25zdCB7IE5UUkFOUywgc2NoZWR1bGVTaXplcywgc2NoZWR1bGVSYXRpbmdzLCB1bmFzc2lnbmVkIH0gPSBzdGF0ZTtcbiAgYm9vdHN0cmFwRW1wdHlSb3V0ZXMoc3RhdGUpO1xuXG4gIGxldCBzdGFydFRlbXAgPSA2XzAwMDtcbiAgbGV0IGVuZFRlbXAgPSAyNTtcbiAgbGV0IHRlbXAgPSBzdGFydFRlbXA7XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduU2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwgeyB0cmFuOiBudW1iZXI7IHJlcTogbnVtYmVyOyBhOiBudW1iZXI7IGI6IG51bWJlcjsgZGVjazogMCB8IDE7IHNjb3JlOiBudW1iZXIgfSA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBzYW1wbGUgPSAwOyBzYW1wbGUgPCBzYW1wbGVzOyBzYW1wbGUrKykge1xuICAgICAgY29uc3QgcmVxID0gc2FtcGxlVW5hc3NpZ25lZFJlcShzdGF0ZSk7XG4gICAgICBpZiAocmVxID09IG51bGwpIGJyZWFrO1xuXG4gICAgICBjb25zdCB0cmFuID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgICAgY29uc3Qgc2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2l6ZSArIDEpO1xuICAgICAgY29uc3QgYiA9IE1hdGgubWluKHNpemUsIGEgKyByYW5kSW50KDAsIE1hdGgubWluKDYsIHNpemUgLSBhICsgMSkpKTtcbiAgICAgIGNvbnN0IGRlY2sgPSAocmFuZG9tKCkgPiAwLjUgPyAxIDogMCkgYXMgMCB8IDE7XG5cbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiLCBkZWNrLCByZXEpO1xuICAgICAgY29uc3QgbmV3U2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiICsgMSk7XG5cbiAgICAgIGlmICghYmVzdCB8fCBuZXdTY29yZSA+IGJlc3Quc2NvcmUpIHtcbiAgICAgICAgYmVzdCA9IHsgdHJhbiwgcmVxLCBhLCBiLCBkZWNrLCBzY29yZTogbmV3U2NvcmUgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWJlc3QpIHJldHVybjtcblxuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuYSwgYmVzdC5iLCBiZXN0LmRlY2ssIGJlc3QucmVxKTtcbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICAgIHVuYXNzaWduZWRbYmVzdC5yZXFdID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5hLCBiZXN0LmIgKyAxKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlVbmFzc2lnblNhbXBsZWQoc2FtcGxlcyA9IDYpIHtcbiAgICBsZXQgYmVzdDogbnVsbCB8IHsgdHJhbjogbnVtYmVyOyBwYWlyOiBQYWlySW5mbzsgc2NvcmU6IG51bWJlciB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuICAgICAgY29uc3QgeyB0cmFuLCBwYWlyIH0gPSBjaG9zZW47XG4gICAgICByZW1vdmVTdG9wcyhzdGF0ZSwgdHJhbiwgcGFpci5maXJzdCwgcGFpci5zZWNvbmQpO1xuICAgICAgY29uc3QgbmV3U2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCAtIDEsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgbmV3U2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7IHRyYW4sIHBhaXIsIHNjb3JlOiBuZXdTY29yZSB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kKTtcbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICAgIHVuYXNzaWduZWRbYmVzdC5wYWlyLnJlcV0gPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQgLSAxLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5UmVsb2NhdGVTYW1wbGVkKHNhbXBsZXMgPSA4KSB7XG4gICAgbGV0IGJlc3Q6IG51bGwgfCB7XG4gICAgICBzcmM6IG51bWJlcjtcbiAgICAgIGRzdDogbnVtYmVyO1xuICAgICAgcGFpcjogUGFpckluZm87XG4gICAgICBpbnNlcnRBOiBudW1iZXI7XG4gICAgICBpbnNlcnRCOiBudW1iZXI7XG4gICAgICBzY29yZTogbnVtYmVyO1xuICAgICAgb2xkU2NvcmU6IG51bWJlcjtcbiAgICB9ID0gbnVsbDtcblxuICAgIGZvciAobGV0IHNhbXBsZSA9IDA7IHNhbXBsZSA8IHNhbXBsZXM7IHNhbXBsZSsrKSB7XG4gICAgICBjb25zdCBjaG9zZW4gPSBzYW1wbGVBc3NpZ25lZFBhaXIoc3RhdGUpO1xuICAgICAgaWYgKCFjaG9zZW4pIGJyZWFrO1xuXG4gICAgICBjb25zdCB7IHRyYW46IHNyYywgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgY29uc3QgZHN0ID0gcmFuZEludCgwLCBOVFJBTlMpO1xuICAgICAgY29uc3Qgb2xkU2NvcmUgPSBzcmMgPT09IGRzdFxuICAgICAgICA/IHNjaGVkdWxlUmF0aW5nc1tzcmNdIVxuICAgICAgICA6IHNjaGVkdWxlUmF0aW5nc1tzcmNdISArIHNjaGVkdWxlUmF0aW5nc1tkc3RdITtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHNyYywgcGFpci5maXJzdCwgcGFpci5zZWNvbmQpO1xuXG4gICAgICBjb25zdCBkc3RTaXplID0gc2NoZWR1bGVTaXplc1tkc3RdITtcbiAgICAgIGNvbnN0IGEgPSByYW5kSW50KDAsIGRzdFNpemUgKyAxKTtcbiAgICAgIGNvbnN0IGIgPSBNYXRoLm1pbihkc3RTaXplLCBhICsgcmFuZEludCgwLCBNYXRoLm1pbig2LCBkc3RTaXplIC0gYSArIDEpKSk7XG4gICAgICBpbnNlcnRTdG9wcyhzdGF0ZSwgZHN0LCBhLCBiLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgY29uc3QgY2FuZGlkYXRlU2NvcmUgPSBzcmMgPT09IGRzdFxuICAgICAgICA/IHNjb3JlUm91dGUoc3RhdGUsIHNyYylcbiAgICAgICAgOiBzY29yZVJvdXRlKHN0YXRlLCBzcmMpICsgc2NvcmVSb3V0ZShzdGF0ZSwgZHN0KTtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGRzdCwgYSwgYiArIDEpO1xuICAgICAgaW5zZXJ0U3RvcHMoc3RhdGUsIHNyYywgcGFpci5maXJzdCwgcGFpci5zZWNvbmQgLSAxLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgaWYgKCFiZXN0IHx8IGNhbmRpZGF0ZVNjb3JlID4gYmVzdC5zY29yZSkge1xuICAgICAgICBiZXN0ID0ge1xuICAgICAgICAgIHNyYyxcbiAgICAgICAgICBkc3QsXG4gICAgICAgICAgcGFpcixcbiAgICAgICAgICBpbnNlcnRBOiBhLFxuICAgICAgICAgIGluc2VydEI6IGIsXG4gICAgICAgICAgc2NvcmU6IGNhbmRpZGF0ZVNjb3JlLFxuICAgICAgICAgIG9sZFNjb3JlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYmVzdCkgcmV0dXJuO1xuXG4gICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3Quc3JjLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQpO1xuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LmRzdCwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcblxuICAgIGlmIChhY2NlcHRBbm5lYWwoYmVzdC5vbGRTY29yZSwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIGlmIChiZXN0LnNyYyA9PT0gYmVzdC5kc3QpIHtcbiAgICAgICAgc2NoZWR1bGVSYXRpbmdzW2Jlc3Quc3JjXSA9IHNjb3JlUm91dGUoc3RhdGUsIGJlc3Quc3JjKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnNyY10gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LnNyYyk7XG4gICAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LmRzdF0gPSBzY29yZVJvdXRlKHN0YXRlLCBiZXN0LmRzdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbW92ZVN0b3BzKHN0YXRlLCBiZXN0LmRzdCwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnNyYywgYmVzdC5wYWlyLmZpcnN0LCBiZXN0LnBhaXIuc2Vjb25kIC0gMSwgYmVzdC5wYWlyLmRlY2ssIGJlc3QucGFpci5yZXEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVJlaW5zZXJ0U2FtcGxlZChzYW1wbGVzID0gOCkge1xuICAgIGxldCBiZXN0OiBudWxsIHwge1xuICAgICAgdHJhbjogbnVtYmVyO1xuICAgICAgcGFpcjogUGFpckluZm87XG4gICAgICBpbnNlcnRBOiBudW1iZXI7XG4gICAgICBpbnNlcnRCOiBudW1iZXI7XG4gICAgICBzY29yZTogbnVtYmVyO1xuICAgIH0gPSBudWxsO1xuXG4gICAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgc2FtcGxlczsgc2FtcGxlKyspIHtcbiAgICAgIGNvbnN0IGNob3NlbiA9IHNhbXBsZUFzc2lnbmVkUGFpcihzdGF0ZSk7XG4gICAgICBpZiAoIWNob3NlbikgYnJlYWs7XG5cbiAgICAgIGNvbnN0IHsgdHJhbiwgcGFpciB9ID0gY2hvc2VuO1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIHBhaXIuZmlyc3QsIHBhaXIuc2Vjb25kKTtcblxuICAgICAgY29uc3Qgc2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hO1xuICAgICAgY29uc3QgYSA9IHJhbmRJbnQoMCwgc2l6ZSArIDEpO1xuICAgICAgY29uc3QgYiA9IE1hdGgubWluKHNpemUsIGEgKyByYW5kSW50KDAsIE1hdGgubWluKDYsIHNpemUgLSBhICsgMSkpKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBhLCBiLCBwYWlyLmRlY2ssIHBhaXIucmVxKTtcblxuICAgICAgY29uc3QgY2FuZGlkYXRlU2NvcmUgPSBzY29yZVJvdXRlKHN0YXRlLCB0cmFuKTtcblxuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIHRyYW4sIGEsIGIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCB0cmFuLCBwYWlyLmZpcnN0LCBwYWlyLnNlY29uZCAtIDEsIHBhaXIuZGVjaywgcGFpci5yZXEpO1xuXG4gICAgICBpZiAoIWJlc3QgfHwgY2FuZGlkYXRlU2NvcmUgPiBiZXN0LnNjb3JlKSB7XG4gICAgICAgIGJlc3QgPSB7XG4gICAgICAgICAgdHJhbixcbiAgICAgICAgICBwYWlyLFxuICAgICAgICAgIGluc2VydEE6IGEsXG4gICAgICAgICAgaW5zZXJ0QjogYixcbiAgICAgICAgICBzY29yZTogY2FuZGlkYXRlU2NvcmUsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFiZXN0KSByZXR1cm47XG5cbiAgICByZW1vdmVTdG9wcyhzdGF0ZSwgYmVzdC50cmFuLCBiZXN0LnBhaXIuZmlyc3QsIGJlc3QucGFpci5zZWNvbmQpO1xuICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QuaW5zZXJ0QSwgYmVzdC5pbnNlcnRCLCBiZXN0LnBhaXIuZGVjaywgYmVzdC5wYWlyLnJlcSk7XG5cbiAgICBpZiAoYWNjZXB0QW5uZWFsKHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dISwgYmVzdC5zY29yZSwgdGVtcCkpIHtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1tiZXN0LnRyYW5dID0gYmVzdC5zY29yZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVtb3ZlU3RvcHMoc3RhdGUsIGJlc3QudHJhbiwgYmVzdC5pbnNlcnRBLCBiZXN0Lmluc2VydEIgKyAxKTtcbiAgICAgIGluc2VydFN0b3BzKHN0YXRlLCBiZXN0LnRyYW4sIGJlc3QucGFpci5maXJzdCwgYmVzdC5wYWlyLnNlY29uZCAtIDEsIGJlc3QucGFpci5kZWNrLCBiZXN0LnBhaXIucmVxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzZXNzaW9uU3RhcnRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgbGV0IGkgPSAwO1xuICBjb25zdCB0ZW1wRmxvb3IgPSAxNTA7XG4gIGNvbnN0IHJlaGVhdFRlbXAgPSAyXzI1MDtcblxuICBmdW5jdGlvbiBydW5JdGVyYXRpb25zKGl0ZXJhdGlvbkJ1ZGdldDogbnVtYmVyLCBkZWFkbGluZSA9IEluZmluaXR5KSB7XG4gICAgY29uc3QgZW5kSXRlcmF0aW9uID0gTWF0aC5taW4odGFyZ2V0U3RlcHMsIGkgKyBpdGVyYXRpb25CdWRnZXQpO1xuICAgIHdoaWxlIChpIDwgZW5kSXRlcmF0aW9uKSB7XG4gICAgICBpZiAoKGkgJiAyMDQ3KSA9PT0gMCAmJiBEYXRlLm5vdygpID49IGRlYWRsaW5lKSBicmVhaztcbiAgICAgIGNvbnN0IHByb2dyZXNzID0gaSAvIHRhcmdldFN0ZXBzO1xuICAgICAgdGVtcCA9IHN0YXJ0VGVtcCAqIE1hdGgucG93KGVuZFRlbXAgLyBzdGFydFRlbXAsIHByb2dyZXNzKTtcblxuICAgICAgY29uc3QgciA9IHJhbmRvbSgpO1xuICAgICAgaWYgKHIgPCAwLjQpIHRyeUFzc2lnblNhbXBsZWQoKTtcbiAgICAgIGVsc2UgaWYgKHIgPCAwLjU1KSB0cnlVbmFzc2lnblNhbXBsZWQoKTtcbiAgICAgIGVsc2UgaWYgKHIgPCAwLjg1KSB0cnlSZWluc2VydFNhbXBsZWQoKTtcbiAgICAgIGVsc2UgdHJ5UmVsb2NhdGVTYW1wbGVkKCk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcnVuVGltZWRDaHVuayhidWRnZXRNczogbnVtYmVyKSB7XG4gICAgY29uc3QgZGVhZGxpbmUgPSBEYXRlLm5vdygpICsgYnVkZ2V0TXM7XG5cbiAgICB3aGlsZSAoRGF0ZS5ub3coKSA8IGRlYWRsaW5lKSB7XG4gICAgICBjb25zdCBwcm9ncmVzcyA9IGkgLyB0YXJnZXRTdGVwcztcbiAgICAgIHRlbXAgPSBNYXRoLm1heCh0ZW1wRmxvb3IsIHN0YXJ0VGVtcCAqIE1hdGgucG93KGVuZFRlbXAgLyBzdGFydFRlbXAsIE1hdGgubWluKDEsIHByb2dyZXNzKSkpO1xuXG4gICAgICBjb25zdCByID0gcmFuZG9tKCk7XG4gICAgICBpZiAociA8IDAuNCkgdHJ5QXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuNTUpIHRyeVVuYXNzaWduU2FtcGxlZCgpO1xuICAgICAgZWxzZSBpZiAociA8IDAuODUpIHRyeVJlaW5zZXJ0U2FtcGxlZCgpO1xuICAgICAgZWxzZSB0cnlSZWxvY2F0ZVNhbXBsZWQoKTtcblxuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlc3VsdCgpIHtcbiAgICByZXR1cm4gdG9Bbm5lYWxpbmdSZXN1bHQoc3RhdGUsIHdhcm11cC5lbGFwc2VkTXMgKyAoRGF0ZS5ub3coKSAtIHNlc3Npb25TdGFydGVkQXQpKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaXRlcmF0ZVN0ZXBzKHN0ZXBzKSB7XG4gICAgICBydW5JdGVyYXRpb25zKHN0ZXBzKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICAgIGl0ZXJhdGVGb3JNcyhidWRnZXRNcykge1xuICAgICAgcnVuVGltZWRDaHVuayhidWRnZXRNcyk7XG4gICAgICByZXR1cm4gZ2V0UmVzdWx0KCk7XG4gICAgfSxcbiAgICBnZXRSZXN1bHQsXG4gICAgcmVoZWF0KGZhY3RvciA9IDEpIHtcbiAgICAgIHRlbXAgPSBNYXRoLm1heCh0ZW1wLCByZWhlYXRUZW1wICogZmFjdG9yKTtcbiAgICAgIC8vIFB1bGwgdGhlIHNlYXJjaCBzbGlnaHRseSBiYWNrIGZyb20gdGhlIGNvbGQgZW5kIG9mIHRoZSBzY2hlZHVsZS5cbiAgICAgIGkgPSBNYXRoLm1heCgwLCBpIC0gTWF0aC5mbG9vcih0YXJnZXRTdGVwcyAqIDAuMDggKiBmYWN0b3IpKTtcbiAgICAgIHJldHVybiBnZXRSZXN1bHQoKTtcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ0NvcmUobW9kOiBNb2R1bGUsIG9wdGlvbnM6IEltcHJvdmVkT3B0aW9ucyk6IEFubmVhbGluZ1Jlc3VsdCB7XG4gIGNvbnN0IHRhcmdldFN0ZXBzID0gb3B0aW9ucy5zdGVwcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5zdGVwcyA6IE1hdGgubWF4KDE1MDAwMCwgTWF0aC5mbG9vcihvcHRpb25zLmJ1ZGdldE1zICogMTkwKSk7XG4gIGNvbnN0IHNlc3Npb24gPSBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kLCB0YXJnZXRTdGVwcyk7XG4gIGlmIChvcHRpb25zLnN0ZXBzICE9PSB1bmRlZmluZWQpIHJldHVybiBzZXNzaW9uLml0ZXJhdGVTdGVwcyhvcHRpb25zLnN0ZXBzKTtcbiAgcmV0dXJuIHNlc3Npb24uaXRlcmF0ZUZvck1zKG9wdGlvbnMuYnVkZ2V0TXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wcm92ZWRBbm5lYWxpbmcobW9kOiBNb2R1bGUsIHN0ZXBzID0gMTUwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgc3RlcHMgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXByb3ZlZEFubmVhbGluZ1RpbWVkKG1vZDogTW9kdWxlLCBidWRnZXRNcyA9IDEwMDAwKTogQW5uZWFsaW5nUmVzdWx0IHtcbiAgcmV0dXJuIGltcHJvdmVkQW5uZWFsaW5nQ29yZShtb2QsIHsgYnVkZ2V0TXMgfSk7XG59XG4iLAogICAgIlxuZXhwb3J0IHR5cGUgTnVtVHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCJcbmV4cG9ydCB0eXBlIFJlc3VsdFR5cGUgPSBOdW1UeXBlIHwgXCJ2b2lkXCIgfCBTdHJ1Y3RUeXBlPGFueT5cbmV4cG9ydCB0eXBlIEludFR5cGUgPSBcImkzMlwiIHwgXCJpNjRcIlxuZXhwb3J0IHR5cGUgUGFja2VkVHlwZSA9IFwiaThcIiB8IFwidThcIiB8IFwiaTE2XCIgfCBcInUxNlwiXG5leHBvcnQgdHlwZSBNZW1vcnlUeXBlID0gTnVtVHlwZSB8IFBhY2tlZFR5cGVcbmV4cG9ydCB0eXBlIERUeXBlID0gTWVtb3J5VHlwZSB8IFN0cnVjdFR5cGU8YW55PlxuZXhwb3J0IHR5cGUgTG9hZGVkVHlwZTxUIGV4dGVuZHMgTWVtb3J5VHlwZT4gPSBUIGV4dGVuZHMgUGFja2VkVHlwZSA/IFwiaTMyXCIgOiBUXG5leHBvcnQgdHlwZSBBcml0aG1ldGljT3AgPSBcImFkZFwiIHwgXCJzdWJcIiB8IFwibXVsXCIgfCBcImRpdlwiXG5leHBvcnQgdHlwZSBCaXRPcCA9IFwieG9yXCIgfCBcInNobFwiIHwgXCJzaHJcIiB8IFwiYW5kXCIgfCBcIm9yXCJcbmV4cG9ydCB0eXBlIFJlbWFpbmRlck9wID0gXCJtb2RcIiB8IFwidW1vZFwiXG5leHBvcnQgdHlwZSBCaW5PcCA9IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3BcbmV4cG9ydCB0eXBlIENtcE9wID0gXCJlcVwiIHwgXCJsdFwiIHwgXCJndFwiXG5jb25zdCBhcml0aG1ldGljT3BzID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdIGFzIGNvbnN0XG5jb25zdCBiaXRPcHMgPSBbXCJhbmRcIiwgXCJvclwiLCBcInhvclwiLCBcInNobFwiLCBcInNoclwiXSBhcyBjb25zdFxuY29uc3QgcmVtYWluZGVyT3BzID0gW1wibW9kXCIsIFwidW1vZFwiXSBhcyBjb25zdFxuY29uc3QgY21wT3BzID0gW1wiZXFcIiwgXCJsdFwiLCBcImd0XCJdIGFzIGNvbnN0XG5leHBvcnQgdHlwZSBWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBUIGV4dGVuZHMgXCJpNjRcIiA/IGJpZ2ludCA6IG51bWJlclxuZXhwb3J0IHR5cGUgVHlwZWRBcnJheUZvcjxUIGV4dGVuZHMgTWVtb3J5VHlwZT4gPVxuICBUIGV4dGVuZHMgXCJpOFwiID8gSW50OEFycmF5IDpcbiAgVCBleHRlbmRzIFwidTE2XCIgPyBVaW50MTZBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImkxNlwiID8gSW50MTZBcnJheSA6XG4gIFQgZXh0ZW5kcyBcInU4XCIgPyBVaW50OEFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTMyXCIgPyBJbnQzMkFycmF5IDpcbiAgVCBleHRlbmRzIFwiaTY0XCIgPyBCaWdJbnQ2NEFycmF5IDpcbiAgVCBleHRlbmRzIFwiZjMyXCIgPyBGbG9hdDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmNjRcIiA/IEZsb2F0NjRBcnJheSA6IG5ldmVyXG5cbnR5cGUgQXJnc0V4cHI8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8QXJnc1tLXT46IG5ldmVyIH1cbnR5cGUgQXJnc0xpa2U8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHJMaWtlPEFyZ3NbS10+OiBuZXZlciB9XG5leHBvcnQgdHlwZSBBcmdzVmFsPEFyZ3MgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10+ICA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8QXJnc1tLXT4gOiBuZXZlciB9XG5cbnR5cGUgTG9jYWxOb2RlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZTogVCwgbG9jYWw6IG51bWJlciB9XG5leHBvcnQgdHlwZSBDb3JlRXhwcjxUIGV4dGVuZHMgTnVtVHlwZT4gPVxuICB8IHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBULCB2YWx1ZTogVmFsdWU8VD4gfVxuICB8IExvY2FsTm9kZTxUPlxuICB8IHsga2luZDogXCJiaW5cIiwgdHlwZTogVCwgb3A6IEJpbk9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImNhbGxcIiwgdHlwZTogVCwgdGFyZ2V0OiBBbnlGdW5jLCBhcmdzOiBFeHByPE51bVR5cGU+W10gfVxuICB8IHsga2luZDogXCJjYXN0XCIsIHR5cGU6IFQsIGlucHV0VHlwZTogTnVtVHlwZSwgdW5zaWduZWQ6IGJvb2xlYW4sIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgdHlwZTogVCwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZTogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImxvYWRcIiwgdHlwZTogVCwgYXJyYXk6IEFueUFycmF5LCBpbmRleDogRXhwcjxcImkzMlwiPiwgc3RvcmFnZTogTWVtb3J5VHlwZSwgc3RyaWRlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cbiAgfCAoVCBleHRlbmRzIFwiaTMyXCIgPyB7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogTnVtVHlwZSwgb3A6IENtcE9wLCBsZWZ0OiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwcjxOdW1UeXBlPiB9IDogbmV2ZXIpXG5cbmNsYXNzIEV4cHJNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiB7fVxudHlwZSBBcml0aG1ldGljTWV0aG9kczxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBBcml0aG1ldGljT3BdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFQ+IH1cbnR5cGUgQ29tcGFyZU1ldGhvZHM8VCBleHRlbmRzIE51bVR5cGU+ID0geyBbT3AgaW4gQ21wT3BdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFwiaTMyXCI+IH1cbnR5cGUgSW50ZWdlck1ldGhvZHM8VCBleHRlbmRzIEludFR5cGU+ID0geyBbT3AgaW4gQml0T3AgfCBSZW1haW5kZXJPcF06IChyaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuZXhwb3J0IHR5cGUgRXhwcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSBDb3JlRXhwcjxUPiAmIEV4cHJNZXRob2RzPFQ+ICYgQXJpdGhtZXRpY01ldGhvZHM8VD4gJiBDb21wYXJlTWV0aG9kczxUPiAmIChUIGV4dGVuZHMgSW50VHlwZSA/IEludGVnZXJNZXRob2RzPFQ+IDoge30pXG5leHBvcnQgdHlwZSBBbnlFeHByID0gYW55XG5cblxuZXhwb3J0IHR5cGUgU3RtdCA9XG4gIHwgeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbDogbnVtYmVyLCB0eXBlOiBOdW1UeXBlLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImFycmF5LnN0b3JlXCIsIGFycmF5OiBBbnlBcnJheSwgdHlwZTogTWVtb3J5VHlwZSwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZTogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJhcnJheS5tb3ZlXCIsIGFycmF5OiBBbnlBcnJheSwgdGFyZ2V0OiBFeHByPFwiaTMyXCI+LCBzb3VyY2U6IEV4cHI8XCJpMzJcIj4sIGNvdW50OiBFeHByPFwiaTMyXCI+IH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdFtdLCBlbHNlOiBTdG10W10gfVxuICB8IHsga2luZDogXCJibG9ja1wiLCBjb250cm9sOiBudW1iZXIsIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogbnVtYmVyLCBjb25kOiBFeHByPFwiaTMyXCI+LCBib2R5OiBTdG10W10gfVxuICB8IHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU/OiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiY2FsbC52b2lkXCIsIHRhcmdldDogQW55RnVuYywgYXJnczogRXhwcjxOdW1UeXBlPltdIH1cbiAgfCB7IGtpbmQ6IFwidHJhcFwiLCBtZXNzYWdlOiBzdHJpbmcgfVxuICB8IHsga2luZDogXCJsb2dcIiwgbWVzc2FnZTogc3RyaW5nLCB2YWx1ZTogRXhwcjxcImkzMlwiPiB9XG4gIHwgeyBraW5kOiBcImV4cHJcIiwgZXhwcjogRXhwcjxOdW1UeXBlPiB9XG5cbmV4cG9ydCB0eXBlIEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBudW1iZXIgfVxudHlwZSBDb250cm9sSGFuZGxlID0gQmxvY2tIYW5kbGUgfCBMb29wSGFuZGxlXG5cbmNsYXNzIE11dGFibGVNZXRob2RzPFQgZXh0ZW5kcyBOdW1UeXBlPiBleHRlbmRzIEV4cHJNZXRob2RzPFQ+IHtcbiAgZGVjbGFyZSB0eXBlOiBUXG4gIGRlY2xhcmUgd3JpdGU6ICh2YWx1ZTogRXhwcjxUPikgPT4gU3RtdFxuICBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KSB7IHJldHVybiB0aGlzLndyaXRlKGxpdCh0aGlzLnR5cGUsIHZhbHVlKSkgfVxufVxudHlwZSBNdXRhYmxlQXJpdGhtZXRpYzxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7IFtPcCBpbiBBcml0aG1ldGljT3AgYXMgYGkke09wfWBdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBTdG10IH1cbnR5cGUgTXV0YWJsZUludGVnZXI8VCBleHRlbmRzIEludFR5cGU+ID0geyBbT3AgaW4gXCJhbmRcIiB8IFwib3JcIiB8IFwieG9yXCIgYXMgYGkke09wfWBdOiAocmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBTdG10IH1cbmV4cG9ydCB0eXBlIE11dGFibGVWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+ICYgeyBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdCB9ICYgTXV0YWJsZUFyaXRobWV0aWM8VD4gJiAoVCBleHRlbmRzIEludFR5cGUgPyBNdXRhYmxlSW50ZWdlcjxUPiA6IHt9KVxuZXhwb3J0IHR5cGUgTG9jYWxWYXI8VCBleHRlbmRzIE51bVR5cGU+ID0gTXV0YWJsZVZhbHVlPFQ+ICYgTG9jYWxOb2RlPFQ+XG5cbmV4cG9ydCB0eXBlIEFycmF5VmFsdWU8VCBleHRlbmRzIERUeXBlPiA9XG4gIFQgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gTXV0YWJsZVN0cnVjdDxGPiA6XG4gIFQgZXh0ZW5kcyBNZW1vcnlUeXBlID8gTXV0YWJsZVZhbHVlPExvYWRlZFR5cGU8VD4+IDogbmV2ZXJcbmV4cG9ydCB0eXBlIEFycmF5SGFuZGxlPFQgZXh0ZW5kcyBEVHlwZT4gPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICB0eXBlOiBUXG4gIGxlbmd0aDogbnVtYmVyXG4gIGVsZW1lbnRTaXplOiBudW1iZXJcbiAgYXQoaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+KTogQXJyYXlWYWx1ZTxUPlxuICBtb3ZlKHRhcmdldDogRXhwckxpa2U8XCJpMzJcIj4sIHNvdXJjZTogRXhwckxpa2U8XCJpMzJcIj4sIGNvdW50OiBFeHByTGlrZTxcImkzMlwiPik6IFN0bXRcbn1cblxuZXhwb3J0IHR5cGUgQml0U3RvcmFnZVR5cGUgPSBcImk4XCIgfCBcInU4XCIgfCBcImkxNlwiIHwgXCJ1MTZcIiB8IFwiaTMyXCJcbmV4cG9ydCB0eXBlIEJpdEZpZWxkID0gcmVhZG9ubHkgW0JpdFN0b3JhZ2VUeXBlLCBudW1iZXJdXG5leHBvcnQgdHlwZSBTdHJ1Y3RTdG9yYWdlVHlwZSA9IFBhY2tlZFR5cGUgfCBJbnRUeXBlXG5leHBvcnQgdHlwZSBGaWVsZFR5cGUgPSBTdHJ1Y3RTdG9yYWdlVHlwZSB8IEJpdEZpZWxkXG5leHBvcnQgdHlwZSBTdHJ1Y3RGaWVsZHMgPSBSZWNvcmQ8c3RyaW5nLCBGaWVsZFR5cGU+XG5leHBvcnQgdHlwZSBGaWVsZFN0b3JhZ2U8VCBleHRlbmRzIEZpZWxkVHlwZT4gPSBUIGV4dGVuZHMgcmVhZG9ubHkgW2luZmVyIFMgZXh0ZW5kcyBCaXRTdG9yYWdlVHlwZSwgbnVtYmVyXSA/IFMgOiBFeHRyYWN0PFQsIE1lbW9yeVR5cGU+XG5leHBvcnQgdHlwZSBGaWVsZFZhbHVlPFQgZXh0ZW5kcyBGaWVsZFR5cGU+ID0gTG9hZGVkVHlwZTxGaWVsZFN0b3JhZ2U8VD4+XG5leHBvcnQgdHlwZSBGaWVsZExheW91dCA9IHsgc3RvcmFnZTogU3RydWN0U3RvcmFnZVR5cGUsIGJpdE9mZnNldDogbnVtYmVyLCBiaXRzOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgU3RydWN0VHlwZTxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHtcbiAga2luZDogXCJzdHJ1Y3RcIlxuICBmaWVsZHM6IEZcbiAgbGF5b3V0OiB7IFtLIGluIGtleW9mIEZdOiBGaWVsZExheW91dCB9XG4gIHNpemU6IG51bWJlclxuICBzdG9yYWdlOiBcInU4XCIgfCBcInUxNlwiIHwgSW50VHlwZVxufVxudHlwZSBTdHJ1Y3RNZW1iZXJzPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0ge1xuICBbSyBpbiBrZXlvZiBGXTogRXhwcjxGaWVsZFZhbHVlPEZbS10+PlxufVxudHlwZSBNdXRhYmxlU3RydWN0TWVtYmVyczxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHtcbiAgW0sgaW4ga2V5b2YgRl06IE11dGFibGVWYWx1ZTxGaWVsZFZhbHVlPEZbS10+PlxufVxuZXhwb3J0IHR5cGUgU3RydWN0SW5pdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IHsgW0sgaW4ga2V5b2YgRl06IEV4cHJMaWtlPEZpZWxkVmFsdWU8RltLXT4+IH1cbmV4cG9ydCB0eXBlIEpTU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0geyBbSyBpbiBrZXlvZiBGXTogVmFsdWU8RmllbGRWYWx1ZTxGW0tdPj4gfVxuZXhwb3J0IHR5cGUgU3RydWN0VmFsdWU8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4gPSBTdHJ1Y3RNZW1iZXJzPEY+ICYgeyBwYWNrZWQ6IEFueUV4cHIgfVxuZXhwb3J0IHR5cGUgTXV0YWJsZVN0cnVjdDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPiA9IFN0cnVjdFZhbHVlPEY+ICYgTXV0YWJsZVN0cnVjdE1lbWJlcnM8Rj4gJiB7XG4gIHNldCh2YWx1ZTogTXV0YWJsZVN0cnVjdDxGPiB8IFN0cnVjdEluaXQ8Rj4pOiBTdG10XG59XG5leHBvcnQgdHlwZSBFeHByTGlrZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+IHwgVmFsdWU8VD5cbmV4cG9ydCB0eXBlIFN0bXRCb2R5ID0gU3RtdCB8IFN0bXRCb2R5W11cbnR5cGUgQ29udHJvbEJvZHk8SCBleHRlbmRzIENvbnRyb2xIYW5kbGU+ID0gU3RtdEJvZHkgfCAoKHNlbGY6IEgpID0+IFN0bXRCb2R5KVxuZXhwb3J0IHR5cGUgRnVuY0JvZHk8UiBleHRlbmRzIFJlc3VsdFR5cGU+ID1cbiAgUiBleHRlbmRzIE51bVR5cGUgPyBFeHByPFI+IHwgU3RtdEJvZHkgOlxuICBSIGV4dGVuZHMgU3RydWN0VHlwZTxpbmZlciBGPiA/IFN0cnVjdFZhbHVlPEY+IHwgU3RtdEJvZHkgOlxuICBTdG10Qm9keVxuZXhwb3J0IHR5cGUgRnVuY0hhbmRsZTxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4gPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIHBhcmFtczogQVxuICByZXN1bHQ6IFJcbiAgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+XG4gIGNhbGw6ICguLi5hcmdzOiBBcmdzTGlrZTxBPikgPT5cbiAgICBSIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8Uj4gOlxuICAgIFIgZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gU3RydWN0VmFsdWU8Rj4gOlxuICAgIFN0bXRcbn1cblxuZXhwb3J0IHR5cGUgQW55RnVuYyA9IHtcbiAga2luZDogXCJmdW5jXCJcbiAgcGFyYW1zOiByZWFkb25seSBOdW1UeXBlW11cbiAgcmVzdWx0OiBSZXN1bHRUeXBlXG4gIGJ1aWxkOiAoLi4uYXJnczogcmVhZG9ubHkgQW55RXhwcltdKSA9PiBhbnlcbiAgY2FsbDogKC4uLmFyZ3M6IGFueVtdKSA9PiBBbnlFeHByXG59XG5cbmV4cG9ydCB0eXBlIEFueUFycmF5ID0ge1xuICBraW5kOiBcImFycmF5XCJcbiAgdHlwZTogRFR5cGVcbiAgbGVuZ3RoOiBudW1iZXJcbiAgZWxlbWVudFNpemU6IG51bWJlclxuICBhdCguLi5hcmdzOiBhbnlbXSk6IGFueVxuICBtb3ZlKC4uLmFyZ3M6IGFueVtdKTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBNb2R1bGVEZWYgPSBSZWNvcmQ8c3RyaW5nLCBBbnlGdW5jIHwgQW55QXJyYXk+XG5leHBvcnQgdHlwZSBGdW5jRGVmczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHsgW0sgaW4ga2V5b2YgVCBhcyBUW0tdIGV4dGVuZHMgQW55RnVuYyA/IEsgOiBuZXZlcl06IEV4dHJhY3Q8VFtLXSwgQW55RnVuYz4gfVxuZXhwb3J0IHR5cGUgQXJyYXlEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlBcnJheSA/IEsgOiBuZXZlcl06IEV4dHJhY3Q8VFtLXSwgQW55QXJyYXk+IH1cbmV4cG9ydCB0eXBlIENvbXBpbGVSZXN1bHQ8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7XG4gIFtLIGluIGtleW9mIFRdOlxuICAgIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gKC4uLmFyZ3M6IEFyZ3NWYWw8VFtLXVtcInBhcmFtc1wiXT4pID0+XG4gICAgICBUW0tdW1wicmVzdWx0XCJdIGV4dGVuZHMgTnVtVHlwZSA/IFZhbHVlPFRbS11bXCJyZXN1bHRcIl0+IDpcbiAgICAgIFRbS11bXCJyZXN1bHRcIl0gZXh0ZW5kcyBTdHJ1Y3RUeXBlPGluZmVyIEY+ID8gSlNTdHJ1Y3Q8Rj4gOlxuICAgICAgdm9pZFxuICAgIDogVFtLXSBleHRlbmRzIEFycmF5SGFuZGxlPGluZmVyIEQ+ID9cbiAgICAgIEQgZXh0ZW5kcyBNZW1vcnlUeXBlID8gVHlwZWRBcnJheUZvcjxEPiA6IFVpbnQ4QXJyYXkgfCBVaW50MTZBcnJheSB8IFVpbnQzMkFycmF5IHwgQmlnVWludDY0QXJyYXlcbiAgICA6IG5ldmVyXG59ICYge1xuICBtb2Q6IFdlYkFzc2VtYmx5Lk1vZHVsZVxuICBtZW1vcnk6IFdlYkFzc2VtYmx5Lk1lbW9yeVxuICB0cmFwTWVzc2FnZXM6IHN0cmluZ1tdXG4gIGxvZ01lc3NhZ2VzOiBzdHJpbmdbXVxuICByZXN1bHRTdHJ1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBTdHJ1Y3RUeXBlPGFueT4+XG59XG5cblxubGV0IG5leHRMb2NhbElkID0gMFxubGV0IG5leHRDb250cm9sSWQgPSAwXG5cbmNvbnN0IGluZmVyVHlwZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHJMaWtlPFQ+KSA9PlxuICAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIFwidHlwZVwiIGluIHZhbHVlID8gdmFsdWUudHlwZSA6IFwiaTMyXCIpIGFzIFRcblxuY29uc3QgZXhwciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obm9kZTogQ29yZUV4cHI8VD4pOiBFeHByPFQ+ID0+IHtcbiAgcmV0dXJuIE9iamVjdC5zZXRQcm90b3R5cGVPZihub2RlLCBFeHByTWV0aG9kcy5wcm90b3R5cGUpIGFzIEV4cHI8VD5cbn1cblxuZXhwb3J0IGNvbnN0IGxpdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PiB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXCJraW5kXCIgaW4gdmFsdWUpIHJldHVybiB2YWx1ZSBhcyBFeHByPFQ+XG4gIH1cbiAgcmV0dXJuIGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBWYWx1ZTxUPiB9KVxufVxuY29uc3QgbXV0YWJsZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obm9kZTogQ29yZUV4cHI8VD4sIHdyaXRlOiAodmFsdWU6IEV4cHI8VD4pID0+IFN0bXQpID0+XG4gIE9iamVjdC5hc3NpZ24oT2JqZWN0LnNldFByb3RvdHlwZU9mKG5vZGUsIE11dGFibGVNZXRob2RzLnByb3RvdHlwZSksIHsgd3JpdGUgfSkgYXMgTXV0YWJsZVZhbHVlPFQ+XG5cbmNvbnN0IGlzU3RtdCA9ICh4OiB1bmtub3duKTogeCBpcyBTdG10ID0+XG4gICEheCAmJiB0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiAmJiBcImtpbmRcIiBpbiB4ICYmIChcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImlmXCIgPyBBcnJheS5pc0FycmF5KCh4IGFzIHsgdGhlbj86IHVua25vd24gfSkudGhlbikgOlxuICAgICFbXCJjb25zdFwiLCBcImxvY2FsLmdldFwiLCBcImJpblwiLCBcImNhbGxcIiwgXCJjYXN0XCIsIFwibG9hZFwiLCBcImNtcFwiXS5pbmNsdWRlcygoeCBhcyB7IGtpbmQ6IHN0cmluZyB9KS5raW5kKVxuICApXG5cbmNvbnN0IHN0bXRMaXN0ID0gKGJvZHk6IFN0bXRCb2R5KTogU3RtdFtdID0+IEFycmF5LmlzQXJyYXkoYm9keSkgPyBib2R5LmZsYXRNYXAoc3RtdExpc3QpIDogW2JvZHldXG5leHBvcnQgY29uc3QgYXNTdG10cyA9IDxSIGV4dGVuZHMgUmVzdWx0VHlwZT4oYm9keTogRnVuY0JvZHk8Uj4pID0+IGlzU3RtdChib2R5KSA/IFtib2R5XSA6IEFycmF5LmlzQXJyYXkoYm9keSkgPyBzdG10TGlzdChib2R5KSA6IG51bGxcbmNvbnN0IGJpbmRTdG10cyA9IChib2R5OiBTdG10Qm9keSwgYnI6IG51bWJlciwgbG9vcDogbnVtYmVyIHwgbnVsbCk6IFN0bXRbXSA9PlxuICBzdG10TGlzdChib2R5KS5tYXAocyA9PiBiaW5kU3RtdChzLCBiciwgbG9vcCkpXG5cbmNvbnN0IGJpbmRTdG10ID0gKHM6IFN0bXQsIGJyOiBudW1iZXIsIGxvb3A6IG51bWJlciB8IG51bGwpOiBTdG10ID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIHsgLi4ucywgdGhlbjogYmluZFN0bXRzKHMudGhlbiwgYnIsIGxvb3ApLCBlbHNlOiBiaW5kU3RtdHMocy5lbHNlLCBiciwgbG9vcCkgfVxuICAgIGNhc2UgXCJicmVha1wiOiByZXR1cm4geyAuLi5zLCB0YXJnZXQ6IHMudGFyZ2V0ID8/IGJyIH1cbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIGlmIChzLnRhcmdldCAhPSBudWxsKSByZXR1cm4gc1xuICAgICAgaWYgKGxvb3AgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiB7IC4uLnMsIHRhcmdldDogbG9vcCB9XG4gICAgZGVmYXVsdDogcmV0dXJuIHNcbiAgfVxufVxuXG5jb25zdCBjb250cm9sQm9keSA9IDxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4oc2VsZjogSCwgYm9keTogQ29udHJvbEJvZHk8SD4pID0+XG4gIGJpbmRTdG10cyh0eXBlb2YgYm9keSA9PT0gXCJmdW5jdGlvblwiID8gYm9keShzZWxmKSA6IGJvZHksIHNlbGYuaWQsIHNlbGYua2luZCA9PT0gXCJsb29wXCIgPyBzZWxmLmlkIDogbnVsbClcblxuY29uc3QgYmluID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQXJpdGhtZXRpY09wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IGJpdCA9IDxUIGV4dGVuZHMgSW50VHlwZT4ob3A6IEJpdE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IHJlbWFpbmRlciA9IDxUIGV4dGVuZHMgSW50VHlwZT4ob3A6IFJlbWFpbmRlck9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHI8VD4oeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG5cbmNvbnN0IGNtcCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4ob3A6IENtcE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+ID0+XG4gIGV4cHI8XCJpMzJcIj4oeyBraW5kOiBcImNtcFwiLCB0eXBlOiBcImkzMlwiLCBpbnB1dFR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQ6IGxlZnQgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+LCByaWdodDogbGl0PFQ+KGxlZnQudHlwZSBhcyBULCByaWdodCkgYXMgdW5rbm93biBhcyBFeHByPE51bVR5cGU+IH0gYXMgQ29yZUV4cHI8XCJpMzJcIj4pXG5cbmV4cG9ydCBjb25zdCBhbGxvY2F0ZUxvY2FsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKSA9PiBleHByKHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZSwgbG9jYWw6IG5leHRMb2NhbElkKysgfSlcblxuY29uc3QgbWtMb2NhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IExvY2FsVmFyPFQ+ID0+IHtcbiAgY29uc3QgbG9jYWwgPSBuZXh0TG9jYWxJZCsrXG4gIHJldHVybiBtdXRhYmxlKHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZSwgbG9jYWwgfSwgdmFsdWUgPT4gKHsga2luZDogXCJsb2NhbC5zZXRcIiwgbG9jYWwsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBFeHByPE51bVR5cGU+IH0pKSBhcyBMb2NhbFZhcjxUPlxufVxuXG5jb25zdCBta0hhbmRsZSA9IDxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgUmVzdWx0VHlwZT4oXG4gIHBhcmFtczogQSxcbiAgcmVzdWx0OiBSLFxuICBidWlsZDogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj4sXG4pOiBGdW5jSGFuZGxlPEEsIFI+ID0+IHtcbiAgbGV0IGhhbmRsZSE6IEZ1bmNIYW5kbGU8QSwgUj5cbiAgaGFuZGxlID0ge1xuICAgIGtpbmQ6IFwiZnVuY1wiLFxuICAgIHBhcmFtcywgcmVzdWx0LCBidWlsZCxcbiAgICBjYWxsOiAoLi4uYXJnczogQXJnc0xpa2U8QT4pID0+IHtcbiAgICAgIGNvbnN0IGNhbGxBcmdzID0gcGFyYW1zLm1hcCgodHlwZSwgaSkgPT4gbGl0KHR5cGUsIGFyZ3NbaV0gYXMgRXhwckxpa2U8dHlwZW9mIHR5cGU+KSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gICAgICBpZiAocmVzdWx0ID09PSBcInZvaWRcIikgcmV0dXJuIHsga2luZDogXCJjYWxsLnZvaWRcIiwgdGFyZ2V0OiBoYW5kbGUsIGFyZ3M6IGNhbGxBcmdzIH1cbiAgICAgIGNvbnN0IHR5cGUgPSAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIiA/IHJlc3VsdCA6IHJlc3VsdC5zdG9yYWdlID09PSBcImk2NFwiID8gXCJpNjRcIiA6IFwiaTMyXCIpIGFzIE51bVR5cGVcbiAgICAgIGNvbnN0IGNhbGwgPSBleHByKHsga2luZDogXCJjYWxsXCIsIHR5cGUsIHRhcmdldDogaGFuZGxlLCBhcmdzOiBjYWxsQXJncyB9KVxuICAgICAgcmV0dXJuIHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyBjYWxsIDogcmVhZFN0cnVjdChyZXN1bHQsIGNhbGwpXG4gICAgfSxcbiAgfSBhcyBGdW5jSGFuZGxlPEEsIFI+XG4gIHJldHVybiBoYW5kbGVcbn1cblxuY29uc3QgbG9hZGVkVHlwZSA9IDxUIGV4dGVuZHMgTWVtb3J5VHlwZT4odHlwZTogVCkgPT5cbiAgKHR5cGUgPT09IFwiaThcIiB8fCB0eXBlID09PSBcInU4XCIgfHwgdHlwZSA9PT0gXCJpMTZcIiB8fCB0eXBlID09PSBcInUxNlwiID8gXCJpMzJcIiA6IHR5cGUpIGFzIExvYWRlZFR5cGU8VD5cblxuY29uc3Qgc3RvcmFnZVNpemU6IFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+ID0geyBpODogMSwgdTg6IDEsIGkxNjogMiwgdTE2OiAyLCBpMzI6IDQsIGYzMjogNCwgaTY0OiA4LCBmNjQ6IDggfVxuY29uc3QgbWVtb3J5VmFsdWUgPSA8VCBleHRlbmRzIE1lbW9yeVR5cGU+KGFycmF5OiBBbnlBcnJheSwgaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+LCBzdG9yYWdlOiBULCBzdHJpZGU6IG51bWJlciwgb2Zmc2V0ID0gMCkgPT4ge1xuICBjb25zdCBhdCA9IGxpdChcImkzMlwiLCBpbmRleClcbiAgcmV0dXJuIG11dGFibGUoeyBraW5kOiBcImxvYWRcIiwgdHlwZTogbG9hZGVkVHlwZShzdG9yYWdlKSwgYXJyYXksIGluZGV4OiBhdCwgc3RvcmFnZSwgc3RyaWRlLCBvZmZzZXQgfSwgdmFsdWUgPT5cbiAgICAoeyBraW5kOiBcImFycmF5LnN0b3JlXCIsIGFycmF5LCB0eXBlOiBzdG9yYWdlLCBpbmRleDogYXQsIHN0cmlkZSwgb2Zmc2V0LCB2YWx1ZTogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KSlcbn1cblxudHlwZSBTdHJ1Y3RCYWNraW5nID0gYW55XG50eXBlIEludGVybmFsU3RydWN0PEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+ID0gTXV0YWJsZVN0cnVjdDxGPiAmIHsgcGFja2VkOiBTdHJ1Y3RCYWNraW5nIH1cblxuY29uc3QgcmVhZEZpZWxkID0gKGJhY2tpbmc6IEFueUV4cHIsIGZpZWxkOiBGaWVsZExheW91dCkgPT4ge1xuICBjb25zdCB7IGJpdHMgfSA9IGZpZWxkXG4gIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiKSByZXR1cm4gYmFja2luZ1xuICBpZiAoYmFja2luZy50eXBlID09PSBcImk2NFwiKSB7XG4gICAgY29uc3QgYml0T2Zmc2V0ID0gQmlnSW50KGZpZWxkLmJpdE9mZnNldCksIG1hc2sgPSAoMW4gPDwgQmlnSW50KGJpdHMpKSAtIDFuXG4gICAgY29uc3QgcmF3ID0gaTMyKGJhY2tpbmcuc2hyKGJpdE9mZnNldCkuYW5kKG1hc2spKVxuICAgIHJldHVybiBmaWVsZC5zdG9yYWdlLnN0YXJ0c1dpdGgoXCJpXCIpICYmIGJpdHMgPCAzMlxuICAgICAgPyBpZkVsc2UocmF3LmFuZCgyICoqIChiaXRzIC0gMSkpLCByYXcuc3ViKDIgKiogYml0cyksIHJhdylcbiAgICAgIDogcmF3XG4gIH1cbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTMyXCIgJiYgZmllbGQuYml0T2Zmc2V0ID09PSAwKSByZXR1cm4gYmFja2luZ1xuICBjb25zdCBtYXNrID0gMiAqKiBiaXRzIC0gMVxuICBjb25zdCByYXcgPSBiYWNraW5nLnNocihmaWVsZC5iaXRPZmZzZXQpLmFuZChtYXNrKVxuICByZXR1cm4gZmllbGQuc3RvcmFnZS5zdGFydHNXaXRoKFwiaVwiKSAmJiBiaXRzIDwgMzJcbiAgICA/IGlmRWxzZShyYXcuYW5kKDIgKiogKGJpdHMgLSAxKSksIHJhdy5zdWIoMiAqKiBiaXRzKSwgcmF3KVxuICAgIDogcmF3XG59XG5cbmNvbnN0IHBhY2tlZEZpZWxkVmFsdWUgPSAoYmFja2luZzogU3RydWN0QmFja2luZywgZmllbGQ6IEZpZWxkTGF5b3V0KSA9PiB7XG4gIGNvbnN0IHZhbHVlID0gcmVhZEZpZWxkKGJhY2tpbmcsIGZpZWxkKVxuICBpZiAoZmllbGQuc3RvcmFnZSA9PT0gXCJpNjRcIikgcmV0dXJuIGJhY2tpbmdcbiAgaWYgKGJhY2tpbmcudHlwZSA9PT0gXCJpNjRcIikge1xuICAgIGNvbnN0IGJpdE9mZnNldCA9IEJpZ0ludChmaWVsZC5iaXRPZmZzZXQpLCBtYXNrID0gKDFuIDw8IEJpZ0ludChmaWVsZC5iaXRzKSkgLSAxblxuICAgIGNvbnN0IGZpZWxkTWFzayA9IG1hc2sgPDwgYml0T2Zmc2V0XG4gICAgcmV0dXJuIG11dGFibGU8XCJpMzJcIj4odmFsdWUgYXMgRXhwcjxcImkzMlwiPiwgaW5wdXQgPT4gYmFja2luZy5zZXQoYmFja2luZy5hbmQofmZpZWxkTWFzaykub3IoaTY0dShpbnB1dCkuYW5kKG1hc2spLnNobChiaXRPZmZzZXQpKSkpXG4gIH1cbiAgaWYgKGZpZWxkLnN0b3JhZ2UgPT09IFwiaTMyXCIgJiYgZmllbGQuYml0T2Zmc2V0ID09PSAwKSByZXR1cm4gYmFja2luZ1xuICBjb25zdCBtYXNrID0gMiAqKiBmaWVsZC5iaXRzIC0gMSwgZmllbGRNYXNrID0gbWFzayA8PCBmaWVsZC5iaXRPZmZzZXRcbiAgcmV0dXJuIG11dGFibGU8XCJpMzJcIj4odmFsdWUsIGlucHV0ID0+IGJhY2tpbmcuc2V0KGJhY2tpbmcuYW5kKH5maWVsZE1hc2spLm9yKGlucHV0LmFuZChtYXNrKS5zaGwoZmllbGQuYml0T2Zmc2V0KSkpKVxufVxuXG5jb25zdCByZWFkU3RydWN0ID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHBhY2tlZDogQW55RXhwcik6IFN0cnVjdFZhbHVlPEY+ID0+XG4gIE9iamVjdC5hc3NpZ24oT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5rZXlzKHR5cGUuZmllbGRzKS5tYXAobmFtZSA9PiBbbmFtZSwgcmVhZEZpZWxkKHBhY2tlZCwgdHlwZS5sYXlvdXRbbmFtZV0hKV0pKSwgeyBwYWNrZWQgfSkgYXMgU3RydWN0VmFsdWU8Rj5cblxuY29uc3Qgc3RydWN0VmFsdWUgPSA8RiBleHRlbmRzIFN0cnVjdEZpZWxkcz4odHlwZTogU3RydWN0VHlwZTxGPiwgcGFja2VkOiBTdHJ1Y3RCYWNraW5nKTogTXV0YWJsZVN0cnVjdDxGPiA9PiB7XG4gIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3Qua2V5cyh0eXBlLmZpZWxkcykubWFwKG5hbWUgPT4gW25hbWUsIHBhY2tlZEZpZWxkVmFsdWUocGFja2VkLCB0eXBlLmxheW91dFtuYW1lXSEpXSkpXG4gIHJldHVybiBPYmplY3QuYXNzaWduKGZpZWxkcywgeyBwYWNrZWQsIHNldDogKHZhbHVlOiBNdXRhYmxlU3RydWN0PEY+IHwgU3RydWN0SW5pdDxGPikgPT5cbiAgICBwYWNrZWQuc2V0KFwicGFja2VkXCIgaW4gdmFsdWUgPyAodmFsdWUgYXMgSW50ZXJuYWxTdHJ1Y3Q8Rj4pLnBhY2tlZCA6IHBhY2tTdHJ1Y3QodHlwZSwgdmFsdWUpKSB9KSBhcyBJbnRlcm5hbFN0cnVjdDxGPlxufVxuXG5jb25zdCBwYWNrU3RydWN0ID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4sIHZhbHVlczogU3RydWN0SW5pdDxGPik6IEFueUV4cHIgPT4ge1xuICBpZiAodHlwZS5zdG9yYWdlICE9PSBcImk2NFwiKSByZXR1cm4gT2JqZWN0LmtleXModHlwZS5maWVsZHMpLnJlZHVjZSgocGFja2VkLCBuYW1lKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSB0eXBlLmxheW91dFtuYW1lXSEsIHZhbHVlID0gdmFsdWVzW25hbWVdIVxuICAgIGNvbnN0IG1hc2sgPSAyICoqIGZpZWxkLmJpdHMgLSAxXG4gICAgcmV0dXJuIHBhY2tlZC5vcihsaXQoXCJpMzJcIiwgdmFsdWUgYXMgRXhwckxpa2U8XCJpMzJcIj4pLmFuZChtYXNrKS5zaGwoZmllbGQuYml0T2Zmc2V0KSlcbiAgfSwgaTMyKDApKVxuICByZXR1cm4gT2JqZWN0LmtleXModHlwZS5maWVsZHMpLnJlZHVjZSgocGFja2VkLCBuYW1lKSA9PiB7XG4gICAgY29uc3QgZmllbGQgPSB0eXBlLmxheW91dFtuYW1lXSEsIHZhbHVlID0gdmFsdWVzW25hbWVdIVxuICAgIGlmIChmaWVsZC5zdG9yYWdlID09PSBcImk2NFwiKSByZXR1cm4gbGl0KFwiaTY0XCIsIHZhbHVlIGFzIEV4cHJMaWtlPFwiaTY0XCI+KVxuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgcmV0dXJuIHBhY2tlZC5vcihpNjR1KGxpdChcImkzMlwiLCB2YWx1ZSBhcyBFeHByTGlrZTxcImkzMlwiPikpLmFuZChtYXNrKS5zaGwoQmlnSW50KGZpZWxkLmJpdE9mZnNldCkpKVxuICB9LCBpNjQoMG4pKVxufVxuXG5leHBvcnQgY29uc3Qgc3RydWN0ID0gPGNvbnN0IEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KGZpZWxkczogRik6IFN0cnVjdFR5cGU8Rj4gPT4ge1xuICBpZiAoXCJzZXRcIiBpbiBmaWVsZHMgfHwgXCJwYWNrZWRcIiBpbiBmaWVsZHMpIHRocm93IG5ldyBFcnJvcihcIlN0cnVjdCBmaWVsZHMgY2Fubm90IGJlIG5hbWVkIHNldCBvciBwYWNrZWRcIilcbiAgbGV0IHVzZWQgPSAwXG4gIGNvbnN0IGxheW91dDogUGFydGlhbDxSZWNvcmQ8a2V5b2YgRiwgRmllbGRMYXlvdXQ+PiA9IHt9XG4gIGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyhmaWVsZHMpIGFzIChrZXlvZiBGKVtdKSB7XG4gICAgY29uc3QgZmllbGQgPSBmaWVsZHNbbmFtZV0hXG4gICAgY29uc3Qgc3RvcmFnZSA9IChBcnJheS5pc0FycmF5KGZpZWxkKSA/IGZpZWxkWzBdIDogZmllbGQpIGFzIFN0cnVjdFN0b3JhZ2VUeXBlXG4gICAgY29uc3QgYml0cyA9IEFycmF5LmlzQXJyYXkoZmllbGQpID8gZmllbGRbMV0gOiBzdG9yYWdlU2l6ZVtzdG9yYWdlXSAqIDhcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoYml0cykgfHwgYml0cyA8IDEgfHwgYml0cyA+IHN0b3JhZ2VTaXplW3N0b3JhZ2VdICogOCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkICR7c3RvcmFnZX0gYml0LWZpZWxkIHdpZHRoICR7Yml0c31gKVxuICAgIGlmICh1c2VkICsgYml0cyA+IDY0KSB0aHJvdyBuZXcgRXJyb3IoYFN0cnVjdCByZXF1aXJlcyAke3VzZWQgKyBiaXRzfSBiaXRzOyBtYXhpbXVtIGlzIDY0YClcbiAgICBsYXlvdXRbbmFtZV0gPSB7IHN0b3JhZ2UsIGJpdE9mZnNldDogdXNlZCwgYml0cyB9XG4gICAgdXNlZCArPSBiaXRzXG4gIH1cbiAgY29uc3Qgc3RvcmFnZSA9IHVzZWQgPD0gOCA/IFwidThcIiA6IHVzZWQgPD0gMTYgPyBcInUxNlwiIDogdXNlZCA8PSAzMiA/IFwiaTMyXCIgOiBcImk2NFwiXG4gIHJldHVybiB7IGtpbmQ6IFwic3RydWN0XCIsIGZpZWxkcywgbGF5b3V0OiBsYXlvdXQgYXMgeyBbSyBpbiBrZXlvZiBGXTogRmllbGRMYXlvdXQgfSwgc3RvcmFnZSwgc2l6ZTogc3RvcmFnZVNpemVbc3RvcmFnZV0gfVxufVxuXG5jb25zdCBjYXN0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwcjxOdW1UeXBlPiwgdW5zaWduZWQgPSBmYWxzZSk6IEV4cHI8VD4gPT5cbiAgdmFsdWUudHlwZSA9PT0gdHlwZSA/IHZhbHVlIGFzIHVua25vd24gYXMgRXhwcjxUPiA6IGV4cHI8VD4oeyBraW5kOiBcImNhc3RcIiwgdHlwZSwgaW5wdXRUeXBlOiB2YWx1ZS50eXBlLCB1bnNpZ25lZCwgdmFsdWUgfSBhcyBDb3JlRXhwcjxUPilcbmNvbnN0IG51bWJlciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IHVua25vd24pOiBFeHByPFQ+ID0+XG4gIHR5cGVvZiB2YWx1ZSA9PT0gKHR5cGUgPT09IFwiaTY0XCIgPyBcImJpZ2ludFwiIDogXCJudW1iZXJcIilcbiAgICA/IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlIH0gYXMgQ29yZUV4cHI8VD4pXG4gICAgOiBjYXN0KHR5cGUsIHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4pXG5cbmV4cG9ydCBmdW5jdGlvbiBpMzIodmFsdWU6IG51bWJlcik6IEV4cHI8XCJpMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBpMzI8VCBleHRlbmRzIEludFR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImkzMlwiPlxuZXhwb3J0IGZ1bmN0aW9uIGkzMih2YWx1ZTogdW5rbm93bikgeyByZXR1cm4gbnVtYmVyKFwiaTMyXCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBpNjQodmFsdWU6IGJpZ2ludCk6IEV4cHI8XCJpNjRcIj5cbmV4cG9ydCBmdW5jdGlvbiBpNjQ8VCBleHRlbmRzIEludFR5cGU+KHZhbHVlOiBFeHByPFQ+KTogRXhwcjxcImk2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGk2NCh2YWx1ZTogdW5rbm93bikgeyByZXR1cm4gbnVtYmVyKFwiaTY0XCIsIHZhbHVlKSB9XG5leHBvcnQgY29uc3QgaTY0dSA9ICh2YWx1ZTogRXhwcjxcImkzMlwiPikgPT4gY2FzdChcImk2NFwiLCB2YWx1ZSBhcyB1bmtub3duIGFzIEV4cHI8TnVtVHlwZT4sIHRydWUpXG5cbnR5cGUgRjMySW5wdXQgPSBudW1iZXIgfCBFeHByPFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyKHZhbHVlOiBudW1iZXIpOiBFeHByPFwiZjMyXCI+XG5leHBvcnQgZnVuY3Rpb24gZjMyPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IEV4cHI8XCJmMzJcIj5cbmV4cG9ydCBmdW5jdGlvbiBmMzIodmFsdWU6IEYzMklucHV0KSB7IHJldHVybiBudW1iZXIoXCJmMzJcIiwgdmFsdWUpIH1cblxuZXhwb3J0IGZ1bmN0aW9uIGY2NCh2YWx1ZTogbnVtYmVyKTogRXhwcjxcImY2NFwiPlxuZXhwb3J0IGZ1bmN0aW9uIGY2NDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBFeHByPFwiZjY0XCI+XG5leHBvcnQgZnVuY3Rpb24gZjY0KHZhbHVlOiBGMzJJbnB1dCkgeyByZXR1cm4gbnVtYmVyKFwiZjY0XCIsIHZhbHVlKSB9XG5cbmV4cG9ydCBmdW5jdGlvbiBpZkVsc2U8VCBleHRlbmRzIE51bVR5cGU+KGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2VfOiBFeHByPFQ+KTogRXhwcjxUPlxuZXhwb3J0IGZ1bmN0aW9uIGlmRWxzZShjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10Qm9keSwgZWxzZV8/OiBTdG10Qm9keSk6IFN0bXRcbmV4cG9ydCBmdW5jdGlvbiBpZkVsc2U8VCBleHRlbmRzIE51bVR5cGU+KGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4gfCBTdG10Qm9keSwgZWxzZV8/OiBFeHByPFQ+IHwgU3RtdEJvZHkpOiBFeHByPFQ+IHwgU3RtdCB7XG4gIHJldHVybiBpc1N0bXQodGhlbikgfHwgQXJyYXkuaXNBcnJheSh0aGVuKVxuICAgID8geyBraW5kOiBcImlmXCIsIGNvbmQsIHRoZW46IHN0bXRMaXN0KHRoZW4gYXMgU3RtdEJvZHkpLCBlbHNlOiBlbHNlXyA9PT0gdW5kZWZpbmVkID8gW10gOiBzdG10TGlzdChlbHNlXyBhcyBTdG10Qm9keSkgfVxuICAgIDogZXhwcjxUPih7IGtpbmQ6IFwiaWZcIiwgdHlwZTogdGhlbi50eXBlLCBjb25kLCB0aGVuLCBlbHNlOiBlbHNlXyBhcyBFeHByPFQ+IH0gYXMgQ29yZUV4cHI8VD4pXG59XG5cbmNvbnN0IGFyaXRobWV0aWMgPSBPYmplY3QuZnJvbUVudHJpZXMoYXJpdGhtZXRpY09wcy5tYXAob3AgPT4gW29wLFxuICA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKG9wLCBsZWZ0LCByaWdodCksXG5dKSkgYXMgeyBbT3AgaW4gQXJpdGhtZXRpY09wXTogPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgYml0cyA9IE9iamVjdC5mcm9tRW50cmllcyhiaXRPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpdChvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIEJpdE9wXTogPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgcmVtYWluZGVycyA9IE9iamVjdC5mcm9tRW50cmllcyhyZW1haW5kZXJPcHMubWFwKG9wID0+IFtvcCxcbiAgPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IHJlbWFpbmRlcihvcCwgbGVmdCwgcmlnaHQpLFxuXSkpIGFzIHsgW09wIGluIFJlbWFpbmRlck9wXTogPFQgZXh0ZW5kcyBJbnRUeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IEV4cHI8VD4gfVxuY29uc3QgY29tcGFyaXNvbnMgPSBPYmplY3QuZnJvbUVudHJpZXMoY21wT3BzLm1hcChvcCA9PiBbb3AsXG4gIDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAob3AsIGxlZnQsIHJpZ2h0KSxcbl0pKSBhcyB7IFtPcCBpbiBDbXBPcF06IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBFeHByPFwiaTMyXCI+IH1cblxuZm9yIChjb25zdCBvcCBvZiBhcml0aG1ldGljT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwckxpa2U8TnVtVHlwZT4pIHsgcmV0dXJuIGFyaXRobWV0aWNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgYml0T3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPEludFR5cGU+LCByaWdodDogRXhwckxpa2U8SW50VHlwZT4pIHsgcmV0dXJuIGJpdHNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgcmVtYWluZGVyT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPEludFR5cGU+LCByaWdodDogRXhwckxpa2U8SW50VHlwZT4pIHsgcmV0dXJuIHJlbWFpbmRlcnNbb3BdKHRoaXMsIHJpZ2h0KSB9LFxufSlcbmZvciAoY29uc3Qgb3Agb2YgY21wT3BzKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhwck1ldGhvZHMucHJvdG90eXBlLCBvcCwge1xuICB2YWx1ZSh0aGlzOiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwckxpa2U8TnVtVHlwZT4pIHsgcmV0dXJuIGNvbXBhcmlzb25zW29wXSh0aGlzLCByaWdodCkgfSxcbn0pXG5mb3IgKGNvbnN0IG9wIG9mIFsuLi5hcml0aG1ldGljT3BzLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCJdIGFzIGNvbnN0KSBPYmplY3QuZGVmaW5lUHJvcGVydHkoTXV0YWJsZU1ldGhvZHMucHJvdG90eXBlLCBgaSR7b3B9YCwge1xuICB2YWx1ZSh0aGlzOiBNdXRhYmxlVmFsdWU8YW55PiwgcmlnaHQ6IGFueSkgeyByZXR1cm4gdGhpcy5zZXQoKHRoaXMgYXMgYW55KVtvcF0ocmlnaHQpKSB9LFxufSlcblxuZXhwb3J0IGNvbnN0IHsgYWRkLCBzdWIsIG11bCwgZGl2IH0gPSBhcml0aG1ldGljXG5leHBvcnQgY29uc3QgeyBhbmQsIG9yLCB4b3IsIHNobCwgc2hyIH0gPSBiaXRzXG5leHBvcnQgY29uc3QgeyBtb2QsIHVtb2QgfSA9IHJlbWFpbmRlcnNcbmV4cG9ydCBjb25zdCB7IGVxLCBsdCwgZ3QgfSA9IGNvbXBhcmlzb25zXG5cbmV4cG9ydCBjb25zdCBmdW5jID0gPGNvbnN0IEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBSZXN1bHRUeXBlPihwYXJhbXM6IEEsIHJlc3VsdDogUiwgYnVpbGQ6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gRnVuY0JvZHk8Uj4pID0+XG4gIG1rSGFuZGxlKHBhcmFtcywgcmVzdWx0LCBidWlsZCBhcyAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPilcbmV4cG9ydCBmdW5jdGlvbiBhcnJheTxUIGV4dGVuZHMgRFR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGVuZ3RoKSB8fCBsZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFycmF5IGxlbmd0aCAke2xlbmd0aH1gKVxuICBjb25zdCBzdHJ1Y3QgPSB0eXBlb2YgdHlwZSA9PT0gXCJvYmplY3RcIiA/IHR5cGUgOiBudWxsXG4gIGNvbnN0IHN0b3JhZ2U6IE1lbW9yeVR5cGUgPSBzdHJ1Y3QgPyBzdHJ1Y3Quc3RvcmFnZSA6IHR5cGUgYXMgTWVtb3J5VHlwZVxuICBjb25zdCBlbGVtZW50U2l6ZSA9IHN0cnVjdCA/IHN0cnVjdC5zaXplIDogc3RvcmFnZVNpemVbc3RvcmFnZV1cbiAgbGV0IGhhbmRsZTogQW55QXJyYXlcbiAgaGFuZGxlID0ge1xuICAgIGtpbmQ6IFwiYXJyYXlcIiwgdHlwZSwgbGVuZ3RoLCBlbGVtZW50U2l6ZSxcbiAgICBhdDogaW5kZXggPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBtZW1vcnlWYWx1ZShoYW5kbGUsIGluZGV4LCBzdG9yYWdlLCBlbGVtZW50U2l6ZSlcbiAgICAgIHJldHVybiBzdHJ1Y3QgPyBzdHJ1Y3RWYWx1ZShzdHJ1Y3QsIHZhbHVlKSA6IHZhbHVlXG4gICAgfSxcbiAgICBtb3ZlOiAodGFyZ2V0LCBzb3VyY2UsIGNvdW50KSA9PiAoeyBraW5kOiBcImFycmF5Lm1vdmVcIiwgYXJyYXk6IGhhbmRsZSwgdGFyZ2V0OiBsaXQoXCJpMzJcIiwgdGFyZ2V0KSwgc291cmNlOiBsaXQoXCJpMzJcIiwgc291cmNlKSwgY291bnQ6IGxpdChcImkzMlwiLCBjb3VudCkgfSksXG4gIH1cbiAgcmV0dXJuIGhhbmRsZSBhcyBBcnJheUhhbmRsZTxUPlxufVxuXG5jb25zdCBta1N0cnVjdExvY2FsID0gPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4pID0+XG4gIHN0cnVjdFZhbHVlKHR5cGUsIG1rTG9jYWwodHlwZS5zdG9yYWdlID09PSBcImk2NFwiID8gXCJpNjRcIiA6IFwiaTMyXCIpKVxuXG50eXBlIExvY2FsRmFjdG9yeSA9IHtcbiAgPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKTogTG9jYWxWYXI8VD5cbiAgPEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFN0cnVjdFR5cGU8Rj4pOiBNdXRhYmxlU3RydWN0PEY+XG59XG5cbmV4cG9ydCBjb25zdCBsb2NhbCA9ICg8VCBleHRlbmRzIE51bVR5cGUsIEYgZXh0ZW5kcyBTdHJ1Y3RGaWVsZHM+KHR5cGU6IFQgfCBTdHJ1Y3RUeXBlPEY+KSA9PlxuICB0eXBlb2YgdHlwZSA9PT0gXCJzdHJpbmdcIiA/IG1rTG9jYWwodHlwZSkgOiBta1N0cnVjdExvY2FsKHR5cGUpKSBhcyBMb2NhbEZhY3RvcnlcblxuZXhwb3J0IGZ1bmN0aW9uIHJldCgpOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0PFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10XG5leHBvcnQgZnVuY3Rpb24gcmV0KHZhbHVlOiB7IHBhY2tlZDogQW55RXhwciB9KTogU3RtdFxuZXhwb3J0IGZ1bmN0aW9uIHJldDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU/OiBFeHByTGlrZTxUPiB8IHsgcGFja2VkOiBBbnlFeHByIH0pOiBTdG10IHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIFwicGFja2VkXCIgaW4gdmFsdWUpIHJldHVybiB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiB2YWx1ZS5wYWNrZWQgfVxuICByZXR1cm4geyBraW5kOiBcInJldHVyblwiLCB2YWx1ZTogbGl0KGluZmVyVHlwZSh2YWx1ZSksIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+IH1cbn1cbmV4cG9ydCBjb25zdCB0cmFwID0gKG1lc3NhZ2U6IHN0cmluZyk6IFN0bXQgPT4gKHsga2luZDogXCJ0cmFwXCIsIG1lc3NhZ2UgfSlcbmV4cG9ydCBjb25zdCBib3VuZHNDaGVjayA9IChhcnJheTogQW55QXJyYXksIGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgY291bnQ6IEV4cHJMaWtlPFwiaTMyXCI+ID0gMSk6IFN0bXQgPT4ge1xuICBjb25zdCBpID0gbGl0KFwiaTMyXCIsIGluZGV4KSwgbiA9IGxpdChcImkzMlwiLCBjb3VudClcbiAgcmV0dXJuIGlmRWxzZShpLmx0KDApLm9yKG4ubHQoMCkpLm9yKG4uZ3QoYXJyYXkubGVuZ3RoKSkub3IoaS5ndChpMzIoYXJyYXkubGVuZ3RoKS5zdWIobikpKSwgdHJhcChcImFycmF5IGJvdW5kcyBleGNlZWRlZFwiKSlcbn1cbmV4cG9ydCBjb25zdCBsb2cgPSAobWVzc2FnZTogc3RyaW5nLCB2YWx1ZTogRXhwckxpa2U8XCJpMzJcIj4pOiBTdG10ID0+ICh7IGtpbmQ6IFwibG9nXCIsIG1lc3NhZ2UsIHZhbHVlOiBsaXQoXCJpMzJcIiwgdmFsdWUpIH0pXG5leHBvcnQgY29uc3QgYmxvY2sgPSAoYm9keTogQ29udHJvbEJvZHk8QmxvY2tIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cbmV4cG9ydCBjb25zdCBsb29wID0gKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IENvbnRyb2xCb2R5PExvb3BIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbmV4dENvbnRyb2xJZCsrIH1cbiAgcmV0dXJuIHsga2luZDogXCJsb29wXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGNvbmQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cblxuZXhwb3J0IGNvbnN0IGJyZWFrVG8gPSAodGFyZ2V0PzogQ29udHJvbEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGNvbnRpbnVlVG8gPSAodGFyZ2V0PzogTG9vcEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGV4cHJTdG10ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IFN0bXQgPT4gKHsga2luZDogXCJleHByXCIsIGV4cHI6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSlcbiIsCiAgICAiaW1wb3J0IHtcbiAgYWxsb2NhdGVMb2NhbCwgYXNTdG10cyxcbiAgdHlwZSBBbnlBcnJheSwgdHlwZSBBbnlGdW5jLCB0eXBlIEFycmF5RGVmcywgdHlwZSBFeHByLFxuICB0eXBlIEZ1bmNCb2R5LCB0eXBlIEZ1bmNEZWZzLCB0eXBlIE1vZHVsZURlZiwgdHlwZSBOdW1UeXBlLCB0eXBlIFJlc3VsdFR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGRpZSA9ICh4OiB1bmtub3duKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdmFsdWU6ICR7U3RyaW5nKHgpfWApIH1cbmV4cG9ydCB0eXBlIEFycmF5TGF5b3V0ID0geyBsZW5ndGg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIsIGVsZW1lbnRTaXplOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgTW9kdWxlQW5hbHlzaXM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7XG4gIGZ1bmNzOiBGdW5jRGVmczxUPlxuICBhcnJheXM6IEFycmF5RGVmczxUPlxuICBmRW50cmllczogW2tleW9mIEZ1bmNEZWZzPFQ+ICYgc3RyaW5nLCBGdW5jRGVmczxUPltrZXlvZiBGdW5jRGVmczxUPl1dW11cbiAgYnVpbHRGdW5jczogQnVpbHRGdW5jW11cbiAgZml4OiBNYXA8QW55RnVuYywgbnVtYmVyPlxuICBsYXlvdXRzOiBNYXA8QW55QXJyYXksIEFycmF5TGF5b3V0PlxuICB0cmFwTWVzc2FnZXM6IHN0cmluZ1tdXG4gIGxvZ01lc3NhZ2VzOiBzdHJpbmdbXVxuICBwYWdlczogbnVtYmVyXG59XG5cbnR5cGUgVmlzaXRvcnMgPSB7XG4gIGxvY2FsPzogKGlkOiBudW1iZXIsIHR5cGU6IE51bVR5cGUpID0+IHZvaWRcbiAgYXJyYXk/OiAoYXJyYXk6IEFueUFycmF5KSA9PiB2b2lkXG4gIGZ1bmM/OiAoZnVuYzogQW55RnVuYykgPT4gdm9pZFxuICB0cmFwPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZFxuICBsb2c/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkXG59XG5jb25zdCB3YWxrID0gKG5vZGU6IGFueSwgZm5zOiBWaXNpdG9ycyk6IHZvaWQgPT4ge1xuICBpZiAobm9kZSA9PSBudWxsKSByZXR1cm5cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZSkpIHJldHVybiBub2RlLmZvckVhY2goeCA9PiB3YWxrKHgsIGZucykpXG4gIGNvbnN0IGNoaWxkcmVuID0gKC4uLnZhbHVlczogYW55W10pID0+IHZhbHVlcy5mb3JFYWNoKHggPT4gd2Fsayh4LCBmbnMpKVxuICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgIGNhc2UgXCJjb25zdFwiOiBjYXNlIFwiYnJlYWtcIjogY2FzZSBcImNvbnRpbnVlXCI6IHJldHVyblxuICAgIGNhc2UgXCJsb2NhbC5nZXRcIjogZm5zLmxvY2FsPy4obm9kZS5sb2NhbCwgbm9kZS50eXBlKTsgcmV0dXJuXG4gICAgY2FzZSBcImxvY2FsLnNldFwiOiBmbnMubG9jYWw/Lihub2RlLmxvY2FsLCBub2RlLnR5cGUpOyByZXR1cm4gd2Fsayhub2RlLnZhbHVlLCBmbnMpXG4gICAgY2FzZSBcImJpblwiOiBjYXNlIFwiY21wXCI6IHJldHVybiBjaGlsZHJlbihub2RlLmxlZnQsIG5vZGUucmlnaHQpXG4gICAgY2FzZSBcImNhbGxcIjogY2FzZSBcImNhbGwudm9pZFwiOiBmbnMuZnVuYz8uKG5vZGUudGFyZ2V0KTsgcmV0dXJuIHdhbGsobm9kZS5hcmdzLCBmbnMpXG4gICAgY2FzZSBcImNhc3RcIjogY2FzZSBcInJldHVyblwiOiByZXR1cm4gd2Fsayhub2RlLnZhbHVlLCBmbnMpXG4gICAgY2FzZSBcImlmXCI6IHJldHVybiBjaGlsZHJlbihub2RlLmNvbmQsIG5vZGUudGhlbiwgbm9kZS5lbHNlKVxuICAgIGNhc2UgXCJsb2FkXCI6IGZucy5hcnJheT8uKG5vZGUuYXJyYXkpOyByZXR1cm4gd2Fsayhub2RlLmluZGV4LCBmbnMpXG4gICAgY2FzZSBcImFycmF5LnN0b3JlXCI6IGZucy5hcnJheT8uKG5vZGUuYXJyYXkpOyByZXR1cm4gY2hpbGRyZW4obm9kZS5pbmRleCwgbm9kZS52YWx1ZSlcbiAgICBjYXNlIFwiYXJyYXkubW92ZVwiOiBmbnMuYXJyYXk/Lihub2RlLmFycmF5KTsgcmV0dXJuIGNoaWxkcmVuKG5vZGUudGFyZ2V0LCBub2RlLnNvdXJjZSwgbm9kZS5jb3VudClcbiAgICBjYXNlIFwiYmxvY2tcIjogcmV0dXJuIHdhbGsobm9kZS5ib2R5LCBmbnMpXG4gICAgY2FzZSBcImxvb3BcIjogcmV0dXJuIGNoaWxkcmVuKG5vZGUuY29uZCwgbm9kZS5ib2R5KVxuICAgIGNhc2UgXCJ0cmFwXCI6IGZucy50cmFwPy4obm9kZS5tZXNzYWdlKTsgcmV0dXJuXG4gICAgY2FzZSBcImxvZ1wiOiBmbnMubG9nPy4obm9kZS5tZXNzYWdlKTsgcmV0dXJuIHdhbGsobm9kZS52YWx1ZSwgZm5zKVxuICAgIGNhc2UgXCJleHByXCI6IHJldHVybiB3YWxrKG5vZGUuZXhwciwgZm5zKVxuICAgIGRlZmF1bHQ6IGRpZShub2RlKVxuICB9XG59XG5cblxuY29uc3QgYXJyYXlMYXlvdXRzID0gKGFycmF5czogQW55QXJyYXlbXSkgPT4ge1xuICBsZXQgb2Zmc2V0ID0gMFxuICBjb25zdCBsYXlvdXRzID0gbmV3IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+KClcbiAgZm9yIChjb25zdCBhcnIgb2YgYXJyYXlzKSB7XG4gICAgY29uc3QgYWxpZ24gPSBNYXRoLm1pbihhcnIuZWxlbWVudFNpemUsIDgpXG4gICAgb2Zmc2V0ID0gTWF0aC5jZWlsKG9mZnNldCAvIGFsaWduKSAqIGFsaWduXG4gICAgbGF5b3V0cy5zZXQoYXJyLCB7IGxlbmd0aDogYXJyLmxlbmd0aCwgb2Zmc2V0LCBlbGVtZW50U2l6ZTogYXJyLmVsZW1lbnRTaXplIH0pXG4gICAgb2Zmc2V0ICs9IGFyci5sZW5ndGggKiBhcnIuZWxlbWVudFNpemVcbiAgfVxuICByZXR1cm4geyBsYXlvdXRzLCBieXRlczogb2Zmc2V0IH1cbn1cblxuZXhwb3J0IHR5cGUgQnVpbHRGdW5jID0ge1xuICBmdW5jOiBBbnlGdW5jXG4gIGJ1aWx0OiBGdW5jQm9keTxSZXN1bHRUeXBlPlxuICBsb2NhbHM6IFtudW1iZXIsIE51bVR5cGVdW11cbiAgbG9jYWxJbmRleGVzOiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+XG4gIGZ1bmN0aW9uczogQW55RnVuY1tdXG4gIGFycmF5czogQW55QXJyYXlbXVxuICB0cmFwczogc3RyaW5nW11cbiAgbG9nczogc3RyaW5nW11cbn1cblxuY29uc3QgYnVpbGRGdW5jID0gKGZ1bmM6IEFueUZ1bmMpOiBCdWlsdEZ1bmMgPT4ge1xuICBjb25zdCBwYXJhbXMgPSBmdW5jLnBhcmFtcy5tYXAodHlwZSA9PiBhbGxvY2F0ZUxvY2FsKHR5cGUpKSBhcyBFeHByPE51bVR5cGU+W11cbiAgY29uc3QgcGFyYW1JZHMgPSBwYXJhbXMubWFwKHAgPT4gcC5raW5kID09PSBcImxvY2FsLmdldFwiID8gcC5sb2NhbCA6IC0xKVxuICBjb25zdCByZXN1bHQgPSBmdW5jLmJ1aWxkKC4uLnBhcmFtcylcbiAgY29uc3QgYnVpbHQgPSB0eXBlb2YgZnVuYy5yZXN1bHQgPT09IFwib2JqZWN0XCIgJiYgIWFzU3RtdHMocmVzdWx0KSA/IHJlc3VsdC5wYWNrZWQgOiByZXN1bHRcbiAgY29uc3QgZm91bmQgPSBuZXcgTWFwPG51bWJlciwgTnVtVHlwZT4oKVxuICBjb25zdCBmdW5jdGlvbnMgPSBuZXcgU2V0PEFueUZ1bmM+KCksIGFycmF5cyA9IG5ldyBTZXQ8QW55QXJyYXk+KCksIHRyYXBzID0gbmV3IFNldDxzdHJpbmc+KCksIGxvZ3MgPSBuZXcgU2V0PHN0cmluZz4oKVxuICB3YWxrKGJ1aWx0LCB7XG4gICAgbG9jYWw6IChpZCwgdHlwZSkgPT4gZm91bmQuc2V0KGlkLCB0eXBlKSwgZnVuYzogZiA9PiBmdW5jdGlvbnMuYWRkKGYpLCBhcnJheTogYSA9PiBhcnJheXMuYWRkKGEpLFxuICAgIHRyYXA6IG1lc3NhZ2UgPT4gdHJhcHMuYWRkKG1lc3NhZ2UpLCBsb2c6IG1lc3NhZ2UgPT4gbG9ncy5hZGQobWVzc2FnZSksXG4gIH0pXG4gIHBhcmFtSWRzLmZvckVhY2goaWQgPT4gZm91bmQuZGVsZXRlKGlkKSlcbiAgY29uc3QgbG9jYWxzID0gWy4uLmZvdW5kLmVudHJpZXMoKV1cbiAgY29uc3QgbG9jYWxJbmRleGVzID0gT2JqZWN0LmZyb21FbnRyaWVzKFtcbiAgICAuLi5wYXJhbUlkcy5tYXAoKGlkLCBpKSA9PiBbaWQsIGldKSxcbiAgICAuLi5sb2NhbHMubWFwKChbaWRdLCBpKSA9PiBbaWQsIGZ1bmMucGFyYW1zLmxlbmd0aCArIGldKSxcbiAgXSlcbiAgcmV0dXJuIHsgZnVuYywgYnVpbHQsIGxvY2FscywgbG9jYWxJbmRleGVzLCBmdW5jdGlvbnM6IFsuLi5mdW5jdGlvbnNdLCBhcnJheXM6IFsuLi5hcnJheXNdLCB0cmFwczogWy4uLnRyYXBzXSwgbG9nczogWy4uLmxvZ3NdIH1cbn1cblxuY29uc3QgYnVpbGRSZWZlcmVuY2VkRnVuY3Rpb25zID0gKHJvb3RzOiBBbnlGdW5jW10pID0+IHtcbiAgY29uc3QgYnVpbHQgPSBuZXcgTWFwPEFueUZ1bmMsIEJ1aWx0RnVuYz4oKVxuICBjb25zdCB2aXNpdCA9IChmdW5jOiBBbnlGdW5jKSA9PiB7XG4gICAgaWYgKGJ1aWx0LmhhcyhmdW5jKSkgcmV0dXJuXG4gICAgY29uc3QgZW50cnkgPSBidWlsZEZ1bmMoZnVuYylcbiAgICBidWlsdC5zZXQoZnVuYywgZW50cnkpXG4gICAgZW50cnkuZnVuY3Rpb25zLmZvckVhY2godmlzaXQpXG4gIH1cbiAgcm9vdHMuZm9yRWFjaCh2aXNpdClcbiAgcmV0dXJuIFsuLi5idWlsdC52YWx1ZXMoKV1cbn1cblxuZXhwb3J0IGNvbnN0IGFuYWx5emVNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PiB7XG4gIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhtb2QpXG4gIGNvbnN0IGZ1bmNzID0gT2JqZWN0LmZyb21FbnRyaWVzKGVudHJpZXMuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImZ1bmNcIikpIGFzIEZ1bmNEZWZzPFQ+XG4gIGNvbnN0IGFycmF5cyA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLmZpbHRlcigoWywgdl0pID0+IHYua2luZCA9PT0gXCJhcnJheVwiKSkgYXMgQXJyYXlEZWZzPFQ+XG4gIGNvbnN0IGZFbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZnVuY3MpIGFzIFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGNvbnN0IGJ1aWx0RnVuY3MgPSBidWlsZFJlZmVyZW5jZWRGdW5jdGlvbnMoZkVudHJpZXMubWFwKChbLCBmdW5jXSkgPT4gZnVuYykpXG4gIGNvbnN0IGZpeCA9IG5ldyBNYXAoYnVpbHRGdW5jcy5tYXAoKHsgZnVuYyB9LCBpKSA9PiBbZnVuYywgaV0pKVxuICBjb25zdCBhbGxBcnJheXMgPSBbLi4ubmV3IFNldChbLi4uYnVpbHRGdW5jcy5mbGF0TWFwKGZ1bmMgPT4gZnVuYy5hcnJheXMpLCAuLi5PYmplY3QudmFsdWVzKGFycmF5cykgYXMgQW55QXJyYXlbXV0pXVxuICBjb25zdCB7IGxheW91dHMsIGJ5dGVzIH0gPSBhcnJheUxheW91dHMoYWxsQXJyYXlzKVxuICBjb25zdCB0cmFwTWVzc2FnZXMgPSBbLi4ubmV3IFNldChidWlsdEZ1bmNzLmZsYXRNYXAoZnVuYyA9PiBmdW5jLnRyYXBzKSldXG4gIGNvbnN0IGxvZ01lc3NhZ2VzID0gWy4uLm5ldyBTZXQoYnVpbHRGdW5jcy5mbGF0TWFwKGZ1bmMgPT4gZnVuYy5sb2dzKSldXG4gIHJldHVybiB7IGZ1bmNzLCBhcnJheXMsIGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIHRyYXBNZXNzYWdlcywgbG9nTWVzc2FnZXMsIHBhZ2VzOiBNYXRoLm1heCgxLCBNYXRoLmNlaWwoYnl0ZXMgLyA2NTUzNikpIH0gYXMgTW9kdWxlQW5hbHlzaXM8VD5cbn1cbiIsCiAgICAiaW1wb3J0IHtcbiAgdHlwZSBBbnlBcnJheSwgdHlwZSBBbnlFeHByLCB0eXBlIEFueUZ1bmMsIHR5cGUgQXJpdGhtZXRpY09wLCB0eXBlIEJpdE9wLCB0eXBlIENtcE9wLCB0eXBlIEV4cHIsXG4gIHR5cGUgTWVtb3J5VHlwZSwgdHlwZSBNb2R1bGVEZWYsIHR5cGUgTnVtVHlwZSwgdHlwZSBSZW1haW5kZXJPcCwgdHlwZSBTdG10LCBhc1N0bXRzLFxufSBmcm9tIFwiLi9hc3RcIlxuaW1wb3J0IHsgdHlwZSBBcnJheUxheW91dCwgdHlwZSBNb2R1bGVBbmFseXNpcyB9IGZyb20gXCIuL2FuYWx5emVcIlxuXG5jb25zdCBtYWdpYyA9IFsweDAwLCAweDYxLCAweDczLCAweDZkLCAweDAxLCAweDAwLCAweDAwLCAweDAwXVxuY29uc3QgcmVzdWx0VHlwZSA9IChyZXN1bHQ6IEFueUZ1bmNbXCJyZXN1bHRcIl0pID0+XG4gIHR5cGVvZiByZXN1bHQgPT09IFwib2JqZWN0XCIgPyByZXN1bHQuc3RvcmFnZSA9PT0gXCJpNjRcIiA/IFwiaTY0XCIgOiBcImkzMlwiIDogcmVzdWx0XG5cbmNvbnN0IG51bWJlckJhc2UgPSB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+XG5jb25zdCBvcGNvZGUgPSAob3A6IEFyaXRobWV0aWNPcCB8IEJpdE9wIHwgUmVtYWluZGVyT3AgfCBDbXBPcCwgdHlwZTogTnVtVHlwZSkgPT4ge1xuICBjb25zdCBhcml0aG1ldGljID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdLmluZGV4T2Yob3ApXG4gIGlmIChhcml0aG1ldGljID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgYXJpdGhtZXRpY1xuICBjb25zdCBpbnRlZ2VyID0gW1wibW9kXCIsIFwidW1vZFwiLCBcImFuZFwiLCBcIm9yXCIsIFwieG9yXCIsIFwic2hsXCIsIFwiXCIsIFwic2hyXCJdLmluZGV4T2Yob3ApXG4gIGlmIChpbnRlZ2VyID49IDApIHJldHVybiBudW1iZXJCYXNlW3R5cGVdICsgNSArIGludGVnZXJcbiAgcmV0dXJuICh7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+KVt0eXBlXVxuICAgICsgKG9wID09PSBcImVxXCIgPyAwIDogb3AgPT09IFwibHRcIiA/IDIgOiB0eXBlWzBdID09PSBcImlcIiA/IDQgOiAzKVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgbG9hZDogeyBpMzI6IDB4MjgsIGk2NDogMHgyOSwgZjMyOiAweDJhLCBmNjQ6IDB4MmIsIGk4OiAweDJjLCB1ODogMHgyZCwgaTE2OiAweDJlLCB1MTY6IDB4MmYgfSBhcyBSZWNvcmQ8TWVtb3J5VHlwZSwgbnVtYmVyPixcbiAgc3RvcmU6IHsgaTMyOiAweDM2LCBpNjQ6IDB4MzcsIGYzMjogMHgzOCwgZjY0OiAweDM5LCBpODogMHgzYSwgdTg6IDB4M2EsIGkxNjogMHgzYiwgdTE2OiAweDNiIH0gYXMgUmVjb3JkPE1lbW9yeVR5cGUsIG51bWJlcj4sXG4gIGFsaWduOiB7IGk4OiAwLCB1ODogMCwgaTE2OiAxLCB1MTY6IDEsIGkzMjogMiwgZjMyOiAyLCBpNjQ6IDMsIGY2NDogMyB9IGFzIFJlY29yZDxNZW1vcnlUeXBlLCBudW1iZXI+LFxuICB6ZXJvOiB7IGkzMjogWzB4NDEsIDBdLCBpNjQ6IFsweDQyLCAwXSwgZjMyOiBbMHg0MywgMCwgMCwgMCwgMF0sIGY2NDogWzB4NDQsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcltdPixcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5cbmNvbnN0IGFkZHIgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHN0cmlkZSA9IGxheW91dC5lbGVtZW50U2l6ZSwgZmllbGRPZmZzZXQgPSAwKSA9PlxuICBpbmRleC5tdWwoc3RyaWRlKS5hZGQobGF5b3V0Lm9mZnNldCArIGZpZWxkT2Zmc2V0KVxuY29uc3QgbWVtYXJnID0gKHR5cGU6IE1lbW9yeVR5cGUsIG9mZnNldCA9IDApID0+IFsuLi51MzIoY29kZXMuYWxpZ25bdHlwZV0pLCAuLi51MzIob2Zmc2V0KV1cbmNvbnN0IGNvbnN0STMyID0gKGU6IEV4cHI8XCJpMzJcIj4pID0+IGUua2luZCA9PT0gXCJjb25zdFwiID8gZS52YWx1ZSA6IG51bGxcbmNvbnN0IGNoZWNrQXJyYXlCb3VuZHMgPSAobGF5b3V0OiBBcnJheUxheW91dCwgaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgbiA9IGNvbnN0STMyKGluZGV4KVxuICBpZiAobiA9PSBudWxsKSByZXR1cm5cbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pIHx8IG4gPCAwIHx8IG4gPj0gbGF5b3V0Lmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKGBBcnJheSBpbmRleCAke259IG91dCBvZiBib3VuZHMgZm9yIGxlbmd0aCAke2xheW91dC5sZW5ndGh9YClcbn1cbmNvbnN0IGNoZWNrTW92ZUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCB0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pID0+IHtcbiAgY29uc3QgdmFsdWVzID0gW2NvbnN0STMyKHRhcmdldCksIGNvbnN0STMyKHNvdXJjZSksIGNvbnN0STMyKGNvdW50KV1cbiAgaWYgKHZhbHVlcy5zb21lKHZhbHVlID0+IHZhbHVlID09IG51bGwpKSByZXR1cm5cbiAgY29uc3QgW3RvLCBmcm9tLCBzaXplXSA9IHZhbHVlcyBhcyBudW1iZXJbXVxuICBpZiAodG8hIDwgMCB8fCBmcm9tISA8IDAgfHwgc2l6ZSEgPCAwIHx8IHRvISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aCB8fCBmcm9tISArIHNpemUhID4gbGF5b3V0Lmxlbmd0aClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IG1vdmUgKCR7dG99LCAke2Zyb219LCAke3NpemV9KSBvdXQgb2YgYm91bmRzIGZvciBsZW5ndGggJHtsYXlvdXQubGVuZ3RofWApXG59XG5cbmNvbnN0IG1ha2VDb21waWxlciA9IChcbiAgZml4OiBNYXA8QW55RnVuYywgbnVtYmVyPiwgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LCBhcnJheXM6IE1hcDxBbnlBcnJheSwgQXJyYXlMYXlvdXQ+LFxuICB0cmFwczogTWFwPHN0cmluZywgbnVtYmVyPiwgbG9nczogTWFwPHN0cmluZywgbnVtYmVyPixcbikgPT4ge1xuY29uc3QgY29tcGlsZUV4cHIgPSAoZTogQW55RXhwcik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjpcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTMyXCIpIHJldHVybiBbMHg0MSwgLi4uc04oZS52YWx1ZSBhcyBudW1iZXIsIDMyKV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTY0XCIpIHJldHVybiBbMHg0MiwgLi4uc04oZS52YWx1ZSwgNjQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmMzJcIikgcmV0dXJuIFsweDQzLCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgNCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImY2NFwiKSByZXR1cm4gWzB4NDQsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA4KV1cbiAgICAgIHJldHVybiBkaWUoZSlcbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6XG4gICAgICByZXR1cm4gWzB4MjAsIC4uLnUzMihsaXhbZS5sb2NhbF0hKV1cbiAgICBjYXNlIFwiYmluXCI6IHtcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0KSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCksIG9wY29kZShlLm9wLCBlLnR5cGUpXVxuICAgIH1cbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQpLCBvcGNvZGUoZS5vcCwgZS5pbnB1dFR5cGUpXVxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICByZXR1cm4gWy4uLmZsYXRNYXAoZS5hcmdzLCBjb21waWxlRXhwciksIDB4MTAsIC4uLnUzMihmaXguZ2V0KGUudGFyZ2V0KSEgKyAyKV1cbiAgICBjYXNlIFwiY2FzdFwiOiB7XG4gICAgICBjb25zdCBmcm9tID0gZS5pbnB1dFR5cGUgYXMgTnVtVHlwZVxuICAgICAgY29uc3QgdG8gPSBlLnR5cGUgYXMgTnVtVHlwZVxuICAgICAgbGV0IG9wY29kZTogbnVtYmVyIHwgdW5kZWZpbmVkXG4gICAgICBpZiAodG8gPT09IFwiaTMyXCIgJiYgZnJvbSA9PT0gXCJpNjRcIikgb3Bjb2RlID0gMHhhN1xuICAgICAgaWYgKHRvID09PSBcImk2NFwiICYmIGZyb20gPT09IFwiaTMyXCIpIG9wY29kZSA9IGUudW5zaWduZWQgPyAweGFkIDogMHhhY1xuICAgICAgaWYgKHRvID09PSBcImYzMlwiICYmIGZyb20gPT09IFwiaTMyXCIpIG9wY29kZSA9IDB4YjJcbiAgICAgIGlmICh0byA9PT0gXCJmMzJcIiAmJiBmcm9tID09PSBcImk2NFwiKSBvcGNvZGUgPSAweGI0XG4gICAgICBpZiAodG8gPT09IFwiZjMyXCIgJiYgZnJvbSA9PT0gXCJmNjRcIikgb3Bjb2RlID0gMHhiNlxuICAgICAgaWYgKHRvID09PSBcImY2NFwiICYmIGZyb20gPT09IFwiaTMyXCIpIG9wY29kZSA9IDB4YjdcbiAgICAgIGlmICh0byA9PT0gXCJmNjRcIiAmJiBmcm9tID09PSBcImk2NFwiKSBvcGNvZGUgPSAweGI5XG4gICAgICBpZiAodG8gPT09IFwiZjY0XCIgJiYgZnJvbSA9PT0gXCJmMzJcIikgb3Bjb2RlID0gMHhiYlxuICAgICAgaWYgKG9wY29kZSA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGNhc3QgJHtmcm9tfSAtPiAke3RvfWApXG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUudmFsdWUpLCBvcGNvZGVdXG4gICAgfVxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmNvbmQpLCAweDA0LCBjb2Rlcy50eXBlW2UudHlwZSBhcyBOdW1UeXBlXSwgLi4uY29tcGlsZUV4cHIoZS50aGVuKSwgMHgwNSwgLi4uY29tcGlsZUV4cHIoZS5lbHNlKSwgMHgwYl1cbiAgICBjYXNlIFwibG9hZFwiOiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBhcnJheXMuZ2V0KGUuYXJyYXkpXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7ZS5hcnJheX1gKVxuICAgICAgY2hlY2tBcnJheUJvdW5kcyhsYXlvdXQsIGUuaW5kZXgpXG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBlLmluZGV4LCBlLnN0cmlkZSwgZS5vZmZzZXQpKSwgY29kZXMubG9hZFtlLnN0b3JhZ2UgYXMgTWVtb3J5VHlwZV0sIC4uLm1lbWFyZyhlLnN0b3JhZ2UgYXMgTWVtb3J5VHlwZSldXG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKGUpXG4gIH1cbn1cblxudHlwZSBMYWJlbEZyYW1lID0geyBjb250cm9sPzogbnVtYmVyLCBraW5kPzogXCJicmVha1wiIHwgXCJjb250aW51ZVwiIH1cbmNvbnN0IGRlcHRoID0gKHN0YWNrOiBMYWJlbEZyYW1lW10sIGNvbnRyb2w6IG51bWJlciwga2luZDogTm9uTnVsbGFibGU8TGFiZWxGcmFtZVtcImtpbmRcIl0+KSA9PiB7XG4gIGNvbnN0IGkgPSBzdGFjay5maW5kSW5kZXgoeCA9PiB4LmNvbnRyb2wgPT09IGNvbnRyb2wgJiYgeC5raW5kID09PSBraW5kKVxuICBpZiAoaSA8IDApIHRocm93IG5ldyBFcnJvcihgVW5rbm93biAke2tpbmR9IHRhcmdldCAke2NvbnRyb2x9YClcbiAgcmV0dXJuIGlcbn1cblxuY29uc3QgY29tcGlsZVN0bXQgPSAoczogU3RtdCwgc3RhY2s6IExhYmVsRnJhbWVbXSA9IFtdKTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MjEsIC4uLnUzMihsaXhbcy5sb2NhbF0hKV1cbiAgICBjYXNlIFwiYXJyYXkuc3RvcmVcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzLmdldChzLmFycmF5KVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBzLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5pbmRleCwgcy5zdHJpZGUsIHMub2Zmc2V0KSksIC4uLmNvbXBpbGVFeHByKHMudmFsdWUpLCBjb2Rlcy5zdG9yZVtzLnR5cGVdLCAuLi5tZW1hcmcocy50eXBlKV1cbiAgICB9XG4gICAgY2FzZSBcImFycmF5Lm1vdmVcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzLmdldChzLmFycmF5KVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrTW92ZUJvdW5kcyhsYXlvdXQsIHMudGFyZ2V0LCBzLnNvdXJjZSwgcy5jb3VudClcbiAgICAgIHJldHVybiBbXG4gICAgICAgIC4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLnRhcmdldCkpLFxuICAgICAgICAuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5zb3VyY2UpKSxcbiAgICAgICAgLi4uY29tcGlsZUV4cHIocy5jb3VudC5tdWwobGF5b3V0LmVsZW1lbnRTaXplKSksXG4gICAgICAgIDB4ZmMsIDB4MGEsIDB4MDAsIDB4MDAsXG4gICAgICBdXG4gICAgfVxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmNvbmQpLCAweDA0LCAweDQwLCAuLi5mbGF0TWFwKHMudGhlbiwgeCA9PiBjb21waWxlU3RtdCh4LCBbe30sIC4uLnN0YWNrXSkpLCAuLi4ocy5lbHNlLmxlbmd0aCA/IFsweDA1LCAuLi5mbGF0TWFwKHMuZWxzZSwgeCA9PiBjb21waWxlU3RtdCh4LCBbe30sIC4uLnN0YWNrXSkpXSA6IFtdKSwgMHgwYl1cbiAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgLi4uZmxhdE1hcChzLmJvZHksIHggPT4gY29tcGlsZVN0bXQoeCwgW3sgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGJdXG4gICAgY2FzZSBcImxvb3BcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgMHgwMywgMHg0MCwgLi4uY29tcGlsZUV4cHIocy5jb25kKSwgMHg0NSwgMHgwZCwgLi4udTMyKDEpLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiY29udGludWVcIiB9LCB7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJicmVha1wiIH0sIC4uLnN0YWNrXSkpLCAweDBjLCAuLi51MzIoMCksIDB4MGIsIDB4MGJdXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiYnJlYWtUbygpIHVzZWQgb3V0c2lkZSBhIGJsb2NrIG9yIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJicmVha1wiKSldXG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJjb250aW51ZVwiKSldXG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi4ocy52YWx1ZSA/IGNvbXBpbGVFeHByKHMudmFsdWUpIDogW10pLCAweDBmXVxuICAgIGNhc2UgXCJ0cmFwXCI6XG4gICAgICByZXR1cm4gWzB4NDEsIC4uLnNOKHRyYXBzLmdldChzLm1lc3NhZ2UpISwgMzIpLCAweDEwLCAweDAwXVxuICAgIGNhc2UgXCJsb2dcIjpcbiAgICAgIHJldHVybiBbMHg0MSwgLi4uc04obG9ncy5nZXQocy5tZXNzYWdlKSEsIDMyKSwgLi4uY29tcGlsZUV4cHIocy52YWx1ZSksIDB4MTAsIDB4MDFdXG4gICAgY2FzZSBcImNhbGwudm9pZFwiOlxuICAgICAgcmV0dXJuIFsuLi5mbGF0TWFwKHMuYXJncywgY29tcGlsZUV4cHIpLCAweDEwLCAuLi51MzIoZml4LmdldChzLnRhcmdldCkhICsgMildXG4gICAgY2FzZSBcImV4cHJcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy5leHByKSwgMHgxYV1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGRpZShzKVxuICB9XG59XG5yZXR1cm4geyBleHByOiBjb21waWxlRXhwciwgc3RtdDogY29tcGlsZVN0bXQgfVxufVxuXG5cbmV4cG9ydCBjb25zdCBlbWl0TW9kdWxlID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KHsgZkVudHJpZXMsIGJ1aWx0RnVuY3MsIGZpeCwgbGF5b3V0cywgdHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlcywgcGFnZXMgfTogTW9kdWxlQW5hbHlzaXM8VD4pID0+IHtcbiAgY29uc3QgdHJhcHMgPSBuZXcgTWFwKHRyYXBNZXNzYWdlcy5tYXAoKG1lc3NhZ2UsIGlkKSA9PiBbbWVzc2FnZSwgaWRdKSlcbiAgY29uc3QgbG9ncyA9IG5ldyBNYXAobG9nTWVzc2FnZXMubWFwKChtZXNzYWdlLCBpZCkgPT4gW21lc3NhZ2UsIGlkXSkpXG4gIGNvbnN0IGZ1bmN0aW9uU2VjdGlvbiA9IGJ1aWx0RnVuY3MuZmxhdE1hcCgoXywgaSkgPT4gdTMyKGkgKyAyKSlcbiAgY29uc3QgZXhwb3J0U2VjdGlvbiA9IGZFbnRyaWVzLmZsYXRNYXAoKFtuYW1lLCBmdW5jXSkgPT4gWy4uLnN0cihuYW1lKSwgMHgwMCwgLi4udTMyKGZpeC5nZXQoZnVuYykhICsgMildKVxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW1xuICAgIC4uLm1hZ2ljLFxuICAgIC4uLnNlY3Rpb24oMHgwMSwgWy4uLnUzMihidWlsdEZ1bmNzLmxlbmd0aCArIDIpLFxuICAgICAgMHg2MCwgMHgwMSwgY29kZXMudHlwZS5pMzIsIDB4MDAsXG4gICAgICAweDYwLCAweDAyLCBjb2Rlcy50eXBlLmkzMiwgY29kZXMudHlwZS5pMzIsIDB4MDAsXG4gICAgICAuLi5mbGF0TWFwKGJ1aWx0RnVuY3MsICh7IGZ1bmMgfSkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRUeXBlKGZ1bmMucmVzdWx0KVxuICAgICAgICByZXR1cm4gWzB4NjAsIC4uLnUzMihmdW5jLnBhcmFtcy5sZW5ndGgpLCAuLi5mdW5jLnBhcmFtcy5tYXAodCA9PiBjb2Rlcy50eXBlW3RdKSwgLi4uKHJlc3VsdCA9PT0gXCJ2b2lkXCIgPyBbMHgwMF0gOiBbMHgwMSwgY29kZXMudHlwZVtyZXN1bHRdXSldXG4gICAgICB9KV0pLFxuICAgIC4uLnNlY3Rpb24oMHgwMiwgW1xuICAgICAgMHgwMyxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcInRyYXBcIiksXG4gICAgICAweDAwLFxuICAgICAgMHgwMCxcbiAgICAgIC4uLnN0cihcImVudlwiKSxcbiAgICAgIC4uLnN0cihcImxvZ1wiKSxcbiAgICAgIDB4MDAsXG4gICAgICAweDAxLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwibWVtb3J5XCIpLFxuICAgICAgMHgwMixcbiAgICAgIDB4MDMsXG4gICAgICAuLi51MzIocGFnZXMpLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICBdKSxcbiAgICAuLi5zZWN0aW9uKDB4MDMsIFsuLi51MzIoYnVpbHRGdW5jcy5sZW5ndGgpLCAuLi5mdW5jdGlvblNlY3Rpb25dKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZXhwb3J0U2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGJ1aWx0RnVuY3MubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgYnVpbHQsIGxvY2FscywgbG9jYWxJbmRleGVzIH0pID0+IHtcbiAgICAgICAgY29uc3QgY29tcGlsZXIgPSBtYWtlQ29tcGlsZXIoZml4LCBsb2NhbEluZGV4ZXMsIGxheW91dHMsIHRyYXBzLCBsb2dzKVxuICAgICAgICBjb25zdCBzdG10cyA9IGFzU3RtdHMoYnVpbHQpXG4gICAgICAgIGNvbnN0IGRlY2xzID0gWy4uLnUzMihsb2NhbHMubGVuZ3RoKSwgLi4uZmxhdE1hcChsb2NhbHMsIChbLCB0eXBlXSkgPT4gWy4uLnUzMigxKSwgY29kZXMudHlwZVt0eXBlXV0pXVxuICAgICAgICBjb25zdCByZXN1bHQgPSByZXN1bHRUeXBlKGZ1bmMucmVzdWx0KVxuICAgICAgICBjb25zdCBjb2RlID0gc3RtdHNcbiAgICAgICAgICA/IFsuLi5mbGF0TWFwKHN0bXRzLCBzID0+IGNvbXBpbGVyLnN0bXQocykpLCAuLi4ocmVzdWx0ID09PSBcInZvaWRcIiA/IFtdIDogY29kZXMuemVyb1tyZXN1bHRdKV1cbiAgICAgICAgICA6IGNvbXBpbGVyLmV4cHIoYnVpbHQgYXMgQW55RXhwcilcbiAgICAgICAgY29uc3QgYm9keSA9IFsuLi5kZWNscywgLi4uY29kZSwgMHgwYl1cbiAgICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgICAgfSksXG4gICAgXSksXG4gIF0pXG59XG4iLAogICAgImV4cG9ydCAqIGZyb20gXCIuL2FzdFwiXG5leHBvcnQgeyBmb3JtYXRNb2R1bGUgfSBmcm9tIFwiLi9mb3JtYXRcIlxuXG5pbXBvcnQgeyBhbmFseXplTW9kdWxlIH0gZnJvbSBcIi4vYW5hbHl6ZVwiXG5pbXBvcnQgeyBlbWl0TW9kdWxlIH0gZnJvbSBcIi4vY29kZWdlblwiXG5pbXBvcnQgdHlwZSB7XG4gIEFueUFycmF5LCBBbnlGdW5jLCBDb21waWxlUmVzdWx0LCBKU1N0cnVjdCwgTW9kdWxlRGVmLCBTdHJ1Y3RGaWVsZHMsIFN0cnVjdFR5cGUsXG59IGZyb20gXCIuL2FzdFwiXG5cbmNvbnN0IGFycmF5Q3RvcnMgPSB7XG4gIGk4OiBJbnQ4QXJyYXksIHU4OiBVaW50OEFycmF5LCBpMTY6IEludDE2QXJyYXksIHUxNjogVWludDE2QXJyYXksXG4gIGkzMjogSW50MzJBcnJheSwgaTY0OiBCaWdJbnQ2NEFycmF5LCBmMzI6IEZsb2F0MzJBcnJheSwgZjY0OiBGbG9hdDY0QXJyYXksXG4gIHN1ODogVWludDhBcnJheSwgc3UxNjogVWludDE2QXJyYXksIHNpMzI6IFVpbnQzMkFycmF5LCBzaTY0OiBCaWdVaW50NjRBcnJheSxcbn1cblxuZXhwb3J0IGNvbnN0IGRlY29kZVN0cnVjdCA9IDxGIGV4dGVuZHMgU3RydWN0RmllbGRzPih0eXBlOiBTdHJ1Y3RUeXBlPEY+LCByYXc6IG51bWJlciB8IGJpZ2ludCk6IEpTU3RydWN0PEY+ID0+IHtcbiAgY29uc3QgcGFja2VkID0gQmlnSW50LmFzVWludE4odHlwZS5zaXplICogOCwgQmlnSW50KHJhdykpXG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXModHlwZS5sYXlvdXQpLm1hcCgoW25hbWUsIGZpZWxkXSkgPT4ge1xuICAgIGNvbnN0IG1hc2sgPSAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMpKSAtIDFuXG4gICAgbGV0IHZhbHVlID0gKHBhY2tlZCA+PiBCaWdJbnQoZmllbGQuYml0T2Zmc2V0KSkgJiBtYXNrXG4gICAgaWYgKGZpZWxkLnN0b3JhZ2Uuc3RhcnRzV2l0aChcImlcIikgJiYgdmFsdWUgJiAoMW4gPDwgQmlnSW50KGZpZWxkLmJpdHMgLSAxKSkpXG4gICAgICB2YWx1ZSAtPSAxbiA8PCBCaWdJbnQoZmllbGQuYml0cylcbiAgICByZXR1cm4gW25hbWUsIGZpZWxkLnN0b3JhZ2UgPT09IFwiaTY0XCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSldXG4gIH0pKSBhcyBKU1N0cnVjdDxGPlxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihcbiAgbW9kOiBULFxuKTogUHJvbWlzZTxDb21waWxlUmVzdWx0PFQ+PiA9PiB7XG4gIGNvbnN0IGFuYWx5c2lzID0gYW5hbHl6ZU1vZHVsZShtb2QpXG4gIGNvbnN0IG1lbW9yeSA9IG5ldyBXZWJBc3NlbWJseS5NZW1vcnkoe1xuICAgIGluaXRpYWw6IGFuYWx5c2lzLnBhZ2VzLFxuICAgIG1heGltdW06IGFuYWx5c2lzLnBhZ2VzLFxuICAgIHNoYXJlZDogdHJ1ZSxcbiAgfSlcbiAgY29uc3QgY29tcGlsZWQgPSBhd2FpdCBXZWJBc3NlbWJseS5jb21waWxlKGVtaXRNb2R1bGUoYW5hbHlzaXMpLmJ1ZmZlcilcbiAgY29uc3QgdHJhcCA9IChpZDogbnVtYmVyKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYW5hbHlzaXMudHJhcE1lc3NhZ2VzW2lkXSA/PyBgVW5rbm93biBXQVNNIHRyYXAgJHtpZH1gKSB9XG4gIGNvbnN0IGxvZyA9IChpZDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiBjb25zb2xlLmxvZyhhbmFseXNpcy5sb2dNZXNzYWdlc1tpZF0gPz8gYFdBU00gbG9nICR7aWR9YCwgdmFsdWUpXG4gIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoY29tcGlsZWQsIHsgZW52OiB7IG1lbW9yeSwgdHJhcCwgbG9nIH0gfSlcbiAgY29uc3QgZnVuY0VudHJpZXMgPSBPYmplY3QuZW50cmllcyhhbmFseXNpcy5mdW5jcykgYXMgW3N0cmluZywgQW55RnVuY11bXVxuICBjb25zdCBqc0Z1bmNzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9LCByZXN1bHRTdHJ1Y3RzOiBSZWNvcmQ8c3RyaW5nLCBTdHJ1Y3RUeXBlPGFueT4+ID0ge31cbiAgZm9yIChjb25zdCBbbmFtZSwgZnVuY10gb2YgZnVuY0VudHJpZXMpIHtcbiAgICBjb25zdCB3YXNtRnVuYyA9IGluc3RhbmNlLmV4cG9ydHNbbmFtZV0gYXMgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gbnVtYmVyIHwgYmlnaW50XG4gICAganNGdW5jc1tuYW1lXSA9IHdhc21GdW5jXG4gICAgaWYgKHR5cGVvZiBmdW5jLnJlc3VsdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgcmVzdWx0U3RydWN0c1tuYW1lXSA9IGZ1bmMucmVzdWx0XG4gICAgICBqc0Z1bmNzW25hbWVdID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gZGVjb2RlU3RydWN0KGZ1bmMucmVzdWx0IGFzIFN0cnVjdFR5cGU8YW55Piwgd2FzbUZ1bmMoLi4uYXJncykpXG4gICAgfVxuICB9XG4gIGNvbnN0IGpzQXJyYXlzID0gKE9iamVjdC5lbnRyaWVzKGFuYWx5c2lzLmFycmF5cykgYXMgW3N0cmluZywgQW55QXJyYXldW10pLm1hcCgoW25hbWUsIGFycl0pID0+IHtcbiAgICBjb25zdCBsYXlvdXQgPSBhbmFseXNpcy5sYXlvdXRzLmdldChhcnIpIVxuICAgIGNvbnN0IGtleSA9IHR5cGVvZiBhcnIudHlwZSA9PT0gXCJzdHJpbmdcIiA/IGFyci50eXBlIDogYHMke2Fyci50eXBlLnN0b3JhZ2V9YFxuICAgIGNvbnN0IEN0b3IgPSBhcnJheUN0b3JzW2tleSBhcyBrZXlvZiB0eXBlb2YgYXJyYXlDdG9yc11cbiAgICByZXR1cm4gW25hbWUsIG5ldyBDdG9yKG1lbW9yeS5idWZmZXIsIGxheW91dC5vZmZzZXQsIGFyci5sZW5ndGgpXSBhcyBjb25zdFxuICB9KVxuICByZXR1cm4gT2JqZWN0LmFzc2lnbihqc0Z1bmNzLCBPYmplY3QuZnJvbUVudHJpZXMoanNBcnJheXMpLCB7XG4gICAgbW9kOiBjb21waWxlZCwgbWVtb3J5LCByZXN1bHRTdHJ1Y3RzLFxuICAgIHRyYXBNZXNzYWdlczogYW5hbHlzaXMudHJhcE1lc3NhZ2VzLCBsb2dNZXNzYWdlczogYW5hbHlzaXMubG9nTWVzc2FnZXMsXG4gIH0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgYXJyYXksIGNvbXBpbGUsIGZ1bmMsIGkzMiwgaWZFbHNlLCBsaXQsIGxvY2FsLCBsb2csIGxvb3AsIHJldCwgc3RydWN0LCB0cmFwLCB1bW9kLCB0eXBlIEFueUFycmF5LCB0eXBlIEFycmF5SGFuZGxlLCB0eXBlIERUeXBlLCB0eXBlIEV4cHIsIHR5cGUgRXhwckxpa2UsIHR5cGUgU3RtdCwgdHlwZSBTdG10Qm9keSB9IGZyb20gXCIuLi93YXNtXCJcbmltcG9ydCB0eXBlIHsgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCJcbmltcG9ydCB7IEFWR19TUEVFRF9LTUgsIElORiwgS01fQ09TVF9DRU5UUywgUkVPUkdfQ09TVF9DRU5UUyB9IGZyb20gXCIuL2FubmVhbGluZ19zaGFyZWRcIlxuXG5jb25zdCBOV09SS0VSUyA9IDRcbmNvbnN0IFJBTkRTVFJJREUgPSAxNlxuY29uc3QgU0VBUkNIX1NURVBTID0gMV82MDBfMDAwXG5jb25zdCBURU1QX1BIQVNFUyA9IDFfMDAwXG5jb25zdCBTVEVQU19QRVJfUEhBU0UgPSBNYXRoLmZsb29yKFNFQVJDSF9TVEVQUyAvIFRFTVBfUEhBU0VTKVxuY29uc3QgU1RBUlRfVEVNUF9DRU5UUyA9IDVfMDAwXG5jb25zdCBFTkRfVEVNUF9DRU5UUyA9IDBcblxuY29uc3QgREVCVUcgPSBmYWxzZVxuXG5mdW5jdGlvbiBkZWJ1ZyAodGFnOiBzdHJpbmcsIHZhbHVlOiBFeHByTGlrZTxcImkzMlwiPil7XG4gIGlmICghREVCVUcpIHJldHVybiBbXVxuICByZXR1cm4gWyBsb2codGFnLCB2YWx1ZSkgXVxufVxuXG5mdW5jdGlvbiBjaGVja2VkQXJyYXk8VCBleHRlbmRzIERUeXBlPih0eXBlOiBULCBsZW5ndGg6IG51bWJlcik6IEFycmF5SGFuZGxlPFQ+IHtcbiAgY29uc3QgYXJyID0gYXJyYXkodHlwZSwgbGVuZ3RoKSBhcyBBbnlBcnJheVxuICBpZiAoIURFQlVHKSByZXR1cm4gYXJyIGFzIEFycmF5SGFuZGxlPFQ+XG5cbiAgY29uc3Qge2F0LCBtb3ZlfSA9IGFyclxuICBjb25zdCBjaGVja0lkeCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoaSxuKT0+IGlmRWxzZShcbiAgICAgIGkubHQoMCkub3Iobi5sdCgwKSkub3IgKG4uYWRkKGkpLmd0KGFyci5sZW5ndGgpKSxcbiAgICAgIHRyYXAoIFwiYXJyYXkgYm91bmRzIGV4Y2VlZGVkXCIpLFxuICAgICAgcmV0KGkpXG4gICAgKVxuICApO1xuICBhcnIuYXQgPSBpbmRleCA9PiBhdChjaGVja0lkeC5jYWxsKGluZGV4LCAxKSlcbiAgYXJyLm1vdmUgPSAodGFyZ2V0LCBzb3VyY2UsIGNvdW50KSA9PiBtb3ZlKFxuICAgIGNoZWNrSWR4LmNhbGwodGFyZ2V0LCBjb3VudCksXG4gICAgY2hlY2tJZHguY2FsbChzb3VyY2UsIGNvdW50KSxcbiAgICBjb3VudCxcbiAgKVxuICByZXR1cm4gYXJyIGFzIEFycmF5SGFuZGxlPFQ+XG59XG5cbmZ1bmN0aW9uIGZvck4objogbnVtYmVyLCBib2R5OiAoaTogRXhwcjxcImkzMlwiPikgPT4gU3RtdEJvZHkpOiBTdG10Qm9keSB7XG4gIGNvbnN0IGkgPSBsb2NhbChcImkzMlwiKVxuICByZXR1cm4gW2kuc2V0KDApLCBsb29wKGkubHQobiksIFtib2R5KGkpLCBpLmlhZGQoMSldKV1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFubmVhbGluZ1dhc20ocGxhbm5lcjogTW9kdWxlKTogUHJvbWlzZTxBbm5lYWxpbmdSZXN1bHQ+IHtcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKHBsYW5uZXIuTlJFUVMgLyBwbGFubmVyLk5UUkFOUyAqIDIuNSAqIDIgKyAxMClcbiAgY29uc3QgTlBPSU5UUyA9IHBsYW5uZXIucm9hZG1hcC5wb2ludHMubGVuZ3RoXG4gIGNvbnN0IFNUT1AgPSBzdHJ1Y3Qoe1xuICAgIHJlcV9pZDogW1widTE2XCIsIDEwXSxcbiAgICBpc19sb2FkOiBbXCJ1OFwiLCAxXSxcbiAgICBkZWNrOiBbXCJ1OFwiLCAxXSxcbiAgfSlcbiAgY29uc3QgUkVRID0gc3RydWN0KHtcbiAgICBzdGFydDogXCJ1MTZcIixcbiAgICBlbmQ6IFwidTE2XCIsXG4gICAgdmFsdWU6IFwidTE2XCIsXG4gICAgZGVhZGxpbmU6IFwidTE2XCIsXG4gIH0pXG5cbiAgY29uc3QgcmFuZFN0YXRlICAgICAgPSBjaGVja2VkQXJyYXkoXCJpMzJcIiwgTldPUktFUlMgKiBSQU5EU1RSSURFKVxuICBjb25zdCBkaXN0cyAgICAgICAgICA9IGNoZWNrZWRBcnJheShcImkzMlwiLCBwbGFubmVyLlJTSVpFKVxuICBjb25zdCByZXF1ZXN0cyAgICAgICA9IGNoZWNrZWRBcnJheShSRVEsIHBsYW5uZXIuTlJFUVMpXG4gIGNvbnN0IGFzc2lnbmVkICAgICAgID0gY2hlY2tlZEFycmF5KFwidThcIiwgcGxhbm5lci5OUkVRUylcbiAgY29uc3Qgc2NoZWR1bGUgICAgICAgPSBjaGVja2VkQXJyYXkoU1RPUCwgcGxhbm5lci5OVFJBTlMgKiBUU0laRSlcbiAgY29uc3Qgc2NoZWRfc2l6ZSAgICAgPSBjaGVja2VkQXJyYXkoXCJpMTZcIiwgcGxhbm5lci5OVFJBTlMpXG4gIGNvbnN0IHRyYW5fcG9zaXRpb25zID0gY2hlY2tlZEFycmF5KFwiaTE2XCIsIHBsYW5uZXIuTlRSQU5TKVxuXG4gIGNvbnN0IHJhbmROZXh0ID0gZnVuYyhbXCJpMzJcIl0sIFwiaTMyXCIsIGdpZCA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBsb2NhbChcImkzMlwiKVxuICAgIHJldHVybiBbXG4gICAgICB2YWx1ZS5zZXQocmFuZFN0YXRlLmF0KGdpZC5tdWwoUkFORFNUUklERSkpKSxcbiAgICAgIHZhbHVlLnNldCh2YWx1ZS54b3IodmFsdWUuc2hsKDEzKSkpLFxuICAgICAgdmFsdWUuc2V0KHZhbHVlLnhvcih2YWx1ZS5zaHIoMTcpKSksXG4gICAgICB2YWx1ZS5zZXQodmFsdWUueG9yKHZhbHVlLnNobCg1KSkpLFxuICAgICAgcmFuZFN0YXRlLmF0KGdpZC5tdWwoUkFORFNUUklERSkpLnNldCh2YWx1ZSksXG4gICAgICByZXQodmFsdWUpLFxuICAgIF1cbiAgfSlcbiAgY29uc3QgcmFuZGludCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoZ2lkLCBtYXgpID0+IHVtb2QocmFuZE5leHQuY2FsbChnaWQpLCBtYXgpKVxuICBjb25zdCBhY2NlcHRBbm5lYWwgPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiLCBcImkzMlwiXSwgXCJpMzJcIiwgKHByZXZpb3VzLCBuZXh0LCB0ZW1wZXJhdHVyZSkgPT4gW1xuICAgIGlmRWxzZShwcmV2aW91cy5ndChuZXh0KSxcbiAgICAgIHJldChyYW5kaW50LmNhbGwoMCwgdGVtcGVyYXR1cmUuYWRkKHByZXZpb3VzLnN1YihuZXh0KSkpLmx0KHRlbXBlcmF0dXJlKVxuICAgICAgICAuYW5kKHJhbmRpbnQuY2FsbCgwLCB0ZW1wZXJhdHVyZS5hZGQocHJldmlvdXMuc3ViKG5leHQpKSkubHQodGVtcGVyYXR1cmUpKSksXG4gICAgICByZXQoMSksXG4gICAgKSxcbiAgXSlcblxuICBjb25zdCByb2FkQ29zdCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCJdLCBcImkzMlwiLCAoZnJvbSwgdG8pID0+IHtcbiAgICBjb25zdCBhID0gbG9jYWwoXCJpMzJcIiksIGIgPSBsb2NhbChcImkzMlwiKSwgdG1wID0gbG9jYWwoXCJpMzJcIiksIGluZGV4ID0gbG9jYWwoXCJpMzJcIilcbiAgICByZXR1cm4gW1xuICAgICAgYS5zZXQoZnJvbSksIGIuc2V0KHRvKSxcbiAgICAgIGlmRWxzZShhLmx0KGIpLCBbdG1wLnNldChhKSwgYS5zZXQoYiksIGIuc2V0KHRtcCldKSxcbiAgICAgIGluZGV4LnNldChhLmFkZChiLm11bChOUE9JTlRTKSkpLFxuICAgICAgaWZFbHNlKGluZGV4Lmd0KHBsYW5uZXIuUlNJWkUpLCBpbmRleC5zZXQoaTMyKE5QT0lOVFMgKiogMikuc3ViKGluZGV4KSkpLFxuICAgICAgcmV0KGRpc3RzLmF0KGluZGV4KSksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IHRyeUFzc2lnbiA9IGZ1bmMoW1wiaTMyXCJdLCBcInZvaWRcIiwgdGVtcGVyYXR1cmUgPT4ge1xuICAgIGNvbnN0IHRyYW4gPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHJlcV9pZCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgQiA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG1wID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCB0c2l6ZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdG9mZnNldCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgcHJldmlvdXNTY29yZSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgbmV4dFNjb3JlID0gbG9jYWwoXCJpMzJcIilcblxuICAgIGNvbnN0IHNjaGVkVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pOiBTdG10Qm9keSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHRvZmZzZXQuYWRkKHRhcmdldCksIHRvZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHRvZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHRyYW4uc2V0KHJhbmRpbnQuY2FsbCgwLCBwbGFubmVyLk5UUkFOUykpLFxuICAgICAgcmVxX2lkLnNldChyYW5kaW50LmNhbGwoMCwgcGxhbm5lci5OUkVRUykpLFxuICAgICAgaWZFbHNlKGFzc2lnbmVkLmF0KHJlcV9pZCkuZXEoMSksIHJldCgpKSxcbiAgICAgIHRvZmZzZXQuc2V0KHRyYW4ubXVsKFRTSVpFKSksXG4gICAgICB0c2l6ZS5zZXQoc2NoZWRfc2l6ZS5hdCh0cmFuKSksXG4gICAgICBpZkVsc2UodHNpemUuZ3QoVFNJWkUgLSAyKSwgcmV0KCkpLFxuICAgICAgcHJldmlvdXNTY29yZS5zZXQocmF0ZVRyYW4uY2FsbCh0cmFuKSksXG4gICAgICBBLnNldChyYW5kaW50LmNhbGwoMCwgdHNpemUuYWRkKDEpKSksXG4gICAgICBCLnNldChBLmFkZChyYW5kaW50LmNhbGwoMCwgNCkpKSxcbiAgICAgIGlmRWxzZShCLmd0KHRzaXplKSwgQi5zZXQodHNpemUpKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIuYWRkKDIpLCBCLCB0c2l6ZS5zdWIoQikpLFxuICAgICAgc2NoZWRWaWV3Lm1vdmUoQS5hZGQoMSksIEEsIEIuc3ViKEEpKSxcbiAgICAgIHRtcC5zZXQocmFuZGludC5jYWxsKDAsIDIpKSxcbiAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQsIGlzX2xvYWQ6IDEsIGRlY2s6IHRtcCB9KSxcbiAgICAgIHNjaGVkVmlldy5hdChCLmFkZCgxKSkuc2V0KHsgcmVxX2lkLCBpc19sb2FkOiAwLCBkZWNrOiB0bXAgfSksXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5hZGQoMikpLFxuICAgICAgbmV4dFNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgIGlmRWxzZShhY2NlcHRBbm5lYWwuY2FsbChwcmV2aW91c1Njb3JlLCBuZXh0U2NvcmUsIHRlbXBlcmF0dXJlKSxcbiAgICAgICAgYXNzaWduZWQuYXQocmVxX2lkKS5zZXQoMSksXG4gICAgICAgIFtcbiAgICAgICAgICBzY2hlZFZpZXcubW92ZShBLCBBLmFkZCgxKSwgQi5zdWIoQSkpLFxuICAgICAgICAgIHNjaGVkVmlldy5tb3ZlKEIsIEIuYWRkKDIpLCB0c2l6ZS5zdWIoQikpLFxuICAgICAgICAgIHNjaGVkX3NpemUuYXQodHJhbikuc2V0KHRzaXplKSxcbiAgICAgICAgXSxcbiAgICAgICksXG4gICAgXVxuICB9KVxuXG4gIGNvbnN0IHJhdGVUcmFuID0gZnVuYyhbXCJpMzJcIl0sIFwiaTMyXCIsIHRyYW4gPT4ge1xuICAgIGNvbnN0IHJld2FyZCA9IGxvY2FsKFwiaTMyXCIpLCBjb3N0ID0gbG9jYWwoXCJpMzJcIiksIGVsYXBzZWRNaW51dGVzID0gbG9jYWwoXCJpMzJcIiksIGRpc3RhbmNlID0gbG9jYWwoXCJpMzJcIiksIHBvcyA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3Qgb2Zmc2V0ID0gbG9jYWwoXCJpMzJcIiksIHNpemUgPSBsb2NhbChcImkzMlwiKSwgaSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgZGVjazAgPSBsb2NhbChcImkzMlwiKSwgZGVjazEgPSBsb2NhbChcImkzMlwiKSwgZGVja1NpemUwID0gbG9jYWwoXCJpMzJcIiksIGRlY2tTaXplMSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgZGVjayA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrU2l6ZSA9IGxvY2FsKFwiaTMyXCIpLCByZXEgPSBsb2NhbChcImkzMlwiKSwgbmV4dFBvcyA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgZm91bmQgPSBsb2NhbChcImkzMlwiKSwgc2hpZnQgPSBsb2NhbChcImkzMlwiKSwgbG93ZXJNYXNrID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBzdGVwID0gbG9jYWwoU1RPUCksIHJlcXVlc3QgPSBsb2NhbChSRVEpXG4gICAgcmV0dXJuIFtcbiAgICAgIHBvcy5zZXQodHJhbl9wb3NpdGlvbnMuYXQodHJhbikpLFxuICAgICAgb2Zmc2V0LnNldCh0cmFuLm11bChUU0laRSkpLFxuICAgICAgc2l6ZS5zZXQoc2NoZWRfc2l6ZS5hdCh0cmFuKSksXG4gICAgICBsb29wKGkubHQoc2l6ZSksIFtcbiAgICAgICAgc3RlcC5zZXQoc2NoZWR1bGUuYXQob2Zmc2V0LmFkZChpKSkpLFxuICAgICAgICByZXEuc2V0KHN0ZXAucmVxX2lkKSxcbiAgICAgICAgcmVxdWVzdC5zZXQocmVxdWVzdHMuYXQocmVxKSksXG4gICAgICAgIG5leHRQb3Muc2V0KGlmRWxzZShzdGVwLmlzX2xvYWQsIHJlcXVlc3Quc3RhcnQsIHJlcXVlc3QuZW5kKSksXG4gICAgICAgIGRpc3RhbmNlLnNldChyb2FkQ29zdC5jYWxsKHBvcywgbmV4dFBvcykpLFxuICAgICAgICBjb3N0LmlhZGQoZGlzdGFuY2UubXVsKEtNX0NPU1RfQ0VOVFMpKSxcbiAgICAgICAgZWxhcHNlZE1pbnV0ZXMuaWFkZChkaXN0YW5jZS5tdWwoNjApLmRpdihBVkdfU1BFRURfS01IKSksXG4gICAgICAgIHBvcy5zZXQobmV4dFBvcyksXG4gICAgICAgIGRlY2suc2V0KGlmRWxzZShzdGVwLmRlY2ssIGRlY2sxLCBkZWNrMCkpLFxuICAgICAgICBkZWNrU2l6ZS5zZXQoaWZFbHNlKHN0ZXAuZGVjaywgZGVja1NpemUxLCBkZWNrU2l6ZTApKSxcbiAgICAgICAgaWZFbHNlKHN0ZXAuaXNfbG9hZCwgW1xuICAgICAgICAgIGlmRWxzZShkZWNrU2l6ZS5ndCgyKSwgcmV0KC1JTkYpKSxcbiAgICAgICAgICBkZWNrLnNldChkZWNrLm9yKHJlcS5zaGwoZGVja1NpemUubXVsKDEwKSkpKSxcbiAgICAgICAgICBkZWNrU2l6ZS5pYWRkKDEpLFxuICAgICAgICBdLCBbXG4gICAgICAgICAgZm91bmQuc2V0KC0xKSxcbiAgICAgICAgICBpZkVsc2UoZGVja1NpemUuZ3QoMCkuYW5kKGRlY2suYW5kKDEwMjMpLmVxKHJlcSkpLCBmb3VuZC5zZXQoMCkpLFxuICAgICAgICAgIGlmRWxzZShmb3VuZC5lcSgtMSkuYW5kKGRlY2tTaXplLmd0KDEpKS5hbmQoZGVjay5zaHIoMTApLmFuZCgxMDIzKS5lcShyZXEpKSwgZm91bmQuc2V0KDEpKSxcbiAgICAgICAgICBpZkVsc2UoZm91bmQuZXEoLTEpLmFuZChkZWNrU2l6ZS5ndCgyKSkuYW5kKGRlY2suc2hyKDIwKS5hbmQoMTAyMykuZXEocmVxKSksIGZvdW5kLnNldCgyKSksXG4gICAgICAgICAgaWZFbHNlKGZvdW5kLmVxKC0xKSwgcmV0KC1JTkYpKSxcbiAgICAgICAgICBjb3N0LmlhZGQoZGVja1NpemUuc3ViKGZvdW5kKS5zdWIoMSkubXVsKFJFT1JHX0NPU1RfQ0VOVFMpKSxcbiAgICAgICAgICBzaGlmdC5zZXQoZm91bmQubXVsKDEwKSksXG4gICAgICAgICAgbG93ZXJNYXNrLnNldChpMzIoMSkuc2hsKHNoaWZ0KS5zdWIoMSkpLFxuICAgICAgICAgIGRlY2suc2V0KGRlY2suYW5kKGxvd2VyTWFzaykub3IoZGVjay5zaHIoc2hpZnQuYWRkKDEwKSkuc2hsKHNoaWZ0KSkpLFxuICAgICAgICAgIGRlY2tTaXplLmlzdWIoMSksXG4gICAgICAgICAgaWZFbHNlKGVsYXBzZWRNaW51dGVzLmd0KHJlcXVlc3QuZGVhZGxpbmUpLCBbXSwgcmV3YXJkLmlhZGQocmVxdWVzdC52YWx1ZSkpLFxuICAgICAgICBdKSxcbiAgICAgICAgaWZFbHNlKHN0ZXAuZGVjayxcbiAgICAgICAgICBbZGVjazEuc2V0KGRlY2spLCBkZWNrU2l6ZTEuc2V0KGRlY2tTaXplKV0sXG4gICAgICAgICAgW2RlY2swLnNldChkZWNrKSwgZGVja1NpemUwLnNldChkZWNrU2l6ZSldLFxuICAgICAgICApLFxuICAgICAgICBpLmlhZGQoMSksXG4gICAgICBdKSxcbiAgICAgIHJldChyZXdhcmQuc3ViKGNvc3QpKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgdHJ5VW5hc3NpZ24gPSBmdW5jKFtcImkzMlwiXSwgXCJ2b2lkXCIsIHRlbXBlcmF0dXJlID0+IHtcbiAgICBjb25zdCB0cmFuID0gbG9jYWwoXCJpMzJcIiksIHJlcSA9IGxvY2FsKFwiaTMyXCIpLCBkZWNrID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBBID0gbG9jYWwoXCJpMzJcIiksIEIgPSBsb2NhbChcImkzMlwiKSwgaSA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgdHNpemUgPSBsb2NhbChcImkzMlwiKSwgdG9mZnNldCA9IGxvY2FsKFwiaTMyXCIpXG4gICAgY29uc3QgcHJldmlvdXNTY29yZSA9IGxvY2FsKFwiaTMyXCIpLCBuZXh0U2NvcmUgPSBsb2NhbChcImkzMlwiKVxuICAgIGNvbnN0IHN0ZXAgPSBsb2NhbChTVE9QKVxuICAgIGNvbnN0IHNjaGVkVmlldyA9IHtcbiAgICAgIG1vdmU6ICh0YXJnZXQ6IEV4cHI8XCJpMzJcIj4sIHNvdXJjZTogRXhwcjxcImkzMlwiPiwgY291bnQ6IEV4cHI8XCJpMzJcIj4pOiBTdG10Qm9keSA9PlxuICAgICAgICBzY2hlZHVsZS5tb3ZlKHRvZmZzZXQuYWRkKHRhcmdldCksIHRvZmZzZXQuYWRkKHNvdXJjZSksIGNvdW50KSxcbiAgICAgIGF0OiAoaW5kZXg6IEV4cHI8XCJpMzJcIj4pID0+IHNjaGVkdWxlLmF0KHRvZmZzZXQuYWRkKGluZGV4KSksXG4gICAgfVxuICAgIHJldHVybiBbXG4gICAgICB0cmFuLnNldChyYW5kaW50LmNhbGwoMCwgcGxhbm5lci5OVFJBTlMpKSxcbiAgICAgIHRzaXplLnNldChzY2hlZF9zaXplLmF0KHRyYW4pKSxcbiAgICAgIGlmRWxzZSh0c2l6ZS5sdCgyKSwgcmV0KCkpLFxuICAgICAgdG9mZnNldC5zZXQodHJhbi5tdWwoVFNJWkUpKSxcbiAgICAgIHN0ZXAuc2V0KHNjaGVkVmlldy5hdChyYW5kaW50LmNhbGwoMCwgdHNpemUpKSksXG4gICAgICByZXEuc2V0KHN0ZXAucmVxX2lkKSxcbiAgICAgIGRlY2suc2V0KHN0ZXAuZGVjayksXG4gICAgICBBLnNldCgtMSksIEIuc2V0KC0xKSxcbiAgICAgIGxvb3AoaS5sdCh0c2l6ZSksIFtcbiAgICAgICAgc3RlcC5zZXQoc2NoZWRWaWV3LmF0KGkpKSxcbiAgICAgICAgaWZFbHNlKHN0ZXAucmVxX2lkLmVxKHJlcSksIGlmRWxzZShBLmVxKC0xKSwgQS5zZXQoaSksIEIuc2V0KGkpKSksXG4gICAgICAgIGkuaWFkZCgxKSxcbiAgICAgIF0pLFxuICAgICAgaWZFbHNlKEEuZXEoLTEpLm9yKEIuZXEoLTEpKSwgcmV0KCkpLFxuICAgICAgcHJldmlvdXNTY29yZS5zZXQocmF0ZVRyYW4uY2FsbCh0cmFuKSksXG4gICAgICBzY2hlZFZpZXcubW92ZShBLCBBLmFkZCgxKSwgQi5zdWIoQSkuc3ViKDEpKSxcbiAgICAgIHNjaGVkVmlldy5tb3ZlKEIuc3ViKDEpLCBCLmFkZCgxKSwgdHNpemUuc3ViKEIpLnN1YigxKSksXG4gICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCh0c2l6ZS5zdWIoMikpLFxuICAgICAgbmV4dFNjb3JlLnNldChyYXRlVHJhbi5jYWxsKHRyYW4pKSxcbiAgICAgIGlmRWxzZShhY2NlcHRBbm5lYWwuY2FsbChwcmV2aW91c1Njb3JlLCBuZXh0U2NvcmUsIHRlbXBlcmF0dXJlKSxcbiAgICAgICAgYXNzaWduZWQuYXQocmVxKS5zZXQoMCksXG4gICAgICAgIFtcbiAgICAgICAgICBzY2hlZFZpZXcubW92ZShCLmFkZCgxKSwgQi5zdWIoMSksIHRzaXplLnN1YihCKS5zdWIoMSkpLFxuICAgICAgICAgIHNjaGVkVmlldy5tb3ZlKEEuYWRkKDEpLCBBLCBCLnN1YihBKS5zdWIoMSkpLFxuICAgICAgICAgIHNjaGVkVmlldy5hdChBKS5zZXQoeyByZXFfaWQ6IHJlcSwgaXNfbG9hZDogMSwgZGVjayB9KSxcbiAgICAgICAgICBzY2hlZFZpZXcuYXQoQikuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDAsIGRlY2sgfSksXG4gICAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQodHNpemUpLFxuICAgICAgICBdLFxuICAgICAgKSxcbiAgICBdXG4gIH0pXG5cbiAgY29uc3QgYWRkUmVxdWVzdCA9IGZ1bmMoW1wiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCIsIFwiaTMyXCJdLCBcInZvaWRcIixcbiAgICAocmVxbiwgc3RhcnQsIGVuZCwgdmFsdWUsIGRlYWRsaW5lKSA9PlxuICAgICAgcmVxdWVzdHMuYXQocmVxbikuc2V0KHsgc3RhcnQsIGVuZCwgdmFsdWUsIGRlYWRsaW5lIH0pLFxuICApXG5cbiAgY29uc3QgYm9vdHN0cmFwID0gZnVuYyhbXSwgXCJ2b2lkXCIsICgpID0+IHtcbiAgICBjb25zdCB0cmFuID0gbG9jYWwoXCJpMzJcIiksIHJlcSA9IGxvY2FsKFwiaTMyXCIpLCBiZXN0UmVxID0gbG9jYWwoXCJpMzJcIilcbiAgICBjb25zdCBvZmZzZXQgPSBsb2NhbChcImkzMlwiKSwgc2NvcmUgPSBsb2NhbChcImkzMlwiKSwgYmVzdFNjb3JlID0gbG9jYWwoXCJpMzJcIilcbiAgICByZXR1cm4gZm9yTihwbGFubmVyLk5UUkFOUywgdCA9PiBbXG4gICAgICB0cmFuLnNldCh0KSwgb2Zmc2V0LnNldCh0cmFuLm11bChUU0laRSkpLCBiZXN0UmVxLnNldCgtMSksIGJlc3RTY29yZS5zZXQoLUlORiksXG4gICAgICBmb3JOKHBsYW5uZXIuTlJFUVMsIHIgPT4gW1xuICAgICAgICByZXEuc2V0KHIpLFxuICAgICAgICBpZkVsc2UoYXNzaWduZWQuYXQocmVxKS5lcSgwKSwgW1xuICAgICAgICAgIHNjaGVkdWxlLmF0KG9mZnNldCkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDEsIGRlY2s6IDAgfSksXG4gICAgICAgICAgc2NoZWR1bGUuYXQob2Zmc2V0LmFkZCgxKSkuc2V0KHsgcmVxX2lkOiByZXEsIGlzX2xvYWQ6IDAsIGRlY2s6IDAgfSksXG4gICAgICAgICAgc2NoZWRfc2l6ZS5hdCh0cmFuKS5zZXQoMiksXG4gICAgICAgICAgc2NvcmUuc2V0KHJhdGVUcmFuLmNhbGwodHJhbikpLFxuICAgICAgICAgIGlmRWxzZShzY29yZS5ndChiZXN0U2NvcmUpLCBbYmVzdFNjb3JlLnNldChzY29yZSksIGJlc3RSZXEuc2V0KHJlcSldKSxcbiAgICAgICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCgwKSxcbiAgICAgICAgXSksXG4gICAgICBdKSxcbiAgICAgIGlmRWxzZShiZXN0UmVxLmd0KC0xKS5hbmQoYmVzdFNjb3JlLmd0KC0xMl8wMDEpKSwgW1xuICAgICAgICBzY2hlZHVsZS5hdChvZmZzZXQpLnNldCh7IHJlcV9pZDogYmVzdFJlcSwgaXNfbG9hZDogMSwgZGVjazogMCB9KSxcbiAgICAgICAgc2NoZWR1bGUuYXQob2Zmc2V0LmFkZCgxKSkuc2V0KHsgcmVxX2lkOiBiZXN0UmVxLCBpc19sb2FkOiAwLCBkZWNrOiAwIH0pLFxuICAgICAgICBzY2hlZF9zaXplLmF0KHRyYW4pLnNldCgyKSxcbiAgICAgICAgYXNzaWduZWQuYXQoYmVzdFJlcSkuc2V0KDEpLFxuICAgICAgXSksXG4gICAgXSlcbiAgfSlcblxuICBjb25zdCBzZWFyY2ggPSBmdW5jKFtdLCBcInZvaWRcIiwgKCkgPT4ge1xuICAgIGNvbnN0IHRlbXBlcmF0dXJlID0gbG9jYWwoXCJpMzJcIilcbiAgICByZXR1cm4gW1xuICAgICAgZGVidWcoXCJkZWJ1Z2dlciBvbi5cIiwgMCksXG4gICAgICBmb3JOKFRFTVBfUEhBU0VTLCBwaGFzZSA9PiBbXG4gICAgICAgIHRlbXBlcmF0dXJlLnNldChpMzIoU1RBUlRfVEVNUF9DRU5UUykuc3ViKFxuICAgICAgICAgIHBoYXNlLm11bChTVEFSVF9URU1QX0NFTlRTIC0gRU5EX1RFTVBfQ0VOVFMpLmRpdihURU1QX1BIQVNFUyAtIDEpLFxuICAgICAgICApKSxcbiAgICAgICAgZm9yTihTVEVQU19QRVJfUEhBU0UsICgpID0+IFt0cnlVbmFzc2lnbi5jYWxsKHRlbXBlcmF0dXJlKSwgdHJ5QXNzaWduLmNhbGwodGVtcGVyYXR1cmUpXSksXG4gICAgICBdKSxcbiAgICBdXG4gIH0pXG4gIGNvbnN0IGdldFN0b3AgPSBmdW5jKFtcImkzMlwiLCBcImkzMlwiXSwgU1RPUCxcbiAgICAodHJhbiwgaW5kZXgpID0+IHNjaGVkdWxlLmF0KHRyYW4ubXVsKFRTSVpFKS5hZGQoaW5kZXgpKSxcbiAgKVxuXG4gIGNvbnN0IHdhc20gPSBhd2FpdCBjb21waWxlKHtcbiAgICBhZGRSZXF1ZXN0LFxuICAgIGFzc2lnbmVkLFxuICAgIGJvb3RzdHJhcCxcbiAgICBkaXN0cyxcbiAgICBnZXRTdG9wLFxuICAgIHJhdGVUcmFuLFxuICAgIHJhbmRTdGF0ZSxcbiAgICBzY2hlZHVsZSxcbiAgICBzZWFyY2gsXG4gICAgc2NoZWRfc2l6ZSxcbiAgICB0cmFuX3Bvc2l0aW9ucyxcbiAgfSlcblxuICB3YXNtLmRpc3RzLnNldChwbGFubmVyLnJvYWRtYXAuQ29zdE1hdHJpeClcbiAgd2FzbS5yYW5kU3RhdGUuc2V0KEFycmF5LmZyb20oeyBsZW5ndGg6IE5XT1JLRVJTICogMiB9LCAoXywgaSkgPT4gaSArIDEpKVxuICB3YXNtLnRyYW5fcG9zaXRpb25zLnNldChwbGFubmVyLnN0YXJ0cG9zaXRpb25zKVxuICBwbGFubmVyLnJlcXVlc3RzLmZvckVhY2goKHJlcXVlc3QsIGkpID0+XG4gICAgd2FzbS5hZGRSZXF1ZXN0KGksIHJlcXVlc3Quc3RhcnRQb2ludCwgcmVxdWVzdC5lbmRQb2ludCwgTWF0aC5yb3VuZChyZXF1ZXN0LnZhbHVlX2V1ciAqIDEwMCksIE1hdGguZmxvb3IocmVxdWVzdC5kZWFkbGluZV9oICogNjApKSxcbiAgKVxuXG4gIHdhc20uYm9vdHN0cmFwKClcblxuICBjb25zdCBzdGFydGVkQXQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICB3YXNtLnNlYXJjaCgpXG4gIGNvbnN0IGVsYXBzZWRNcyA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRlZEF0XG4gIGNvbnN0IHJlc3VsdFNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KHBsYW5uZXIuTlRSQU5TICogVFNJWkUpXG4gIGZvciAobGV0IHRyYW4gPSAwOyB0cmFuIDwgcGxhbm5lci5OVFJBTlM7IHRyYW4rKykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd2FzbS5zY2hlZF9zaXplW3RyYW5dITsgaSsrKSB7XG4gICAgICBjb25zdCBzdG9wID0gd2FzbS5nZXRTdG9wKHRyYW4sIGkpXG4gICAgICByZXN1bHRTY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSA9IHN0b3AuaXNfbG9hZCB8IHN0b3AuZGVjayA8PCAxIHwgc3RvcC5yZXFfaWQgPDwgMlxuICAgIH1cbiAgfVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShwbGFubmVyLk5SRVFTKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHVuYXNzaWduZWQubGVuZ3RoOyBpKyspIHVuYXNzaWduZWRbaV0gPSB3YXNtLmFzc2lnbmVkW2ldID8gMCA6IDFcbiAgY29uc3Qgc2NoZWR1bGVSYXRpbmdzID0gbmV3IEludDMyQXJyYXkoQXJyYXkuZnJvbSh7IGxlbmd0aDogcGxhbm5lci5OVFJBTlMgfSwgKF8sIHRyYW4pID0+IHdhc20ucmF0ZVRyYW4odHJhbikpKVxuXG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGU6IHJlc3VsdFNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IG5ldyBVaW50MTZBcnJheSh3YXNtLnNjaGVkX3NpemUpLFxuICAgIHRyYW5TdGFydDogbmV3IFVpbnQxNkFycmF5KHBsYW5uZXIuc3RhcnRwb3NpdGlvbnMpLFxuICAgIFRTSVpFLFxuICAgIHNjaGVkdWxlUmF0aW5ncyxcbiAgICB1bmFzc2lnbmVkLFxuICAgIGVsYXBzZWRNcyxcbiAgICB0b3RhbFNjb3JlOiBzY2hlZHVsZVJhdGluZ3MucmVkdWNlKChzdW0sIHNjb3JlKSA9PiBzdW0gKyBzY29yZSwgMCksXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgYnV0dG9uLCBjb2xvciwgZGl2LCBwLCBwb3B1cCwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdGgsIHRyIH0gZnJvbSBcIi4uL3ZpZXcvaHRtbFwiO1xuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzIH0gZnJvbSBcIi4uL3ZpZXcvbWFpblwiO1xuaW1wb3J0IHsgYmFzZWxpbmVBbm5lYWxpbmcsIHR5cGUgQW5uZWFsaW5nUmVzdWx0IH0gZnJvbSBcIi4vYW5uZWFsaW5nX2Jhc2VsaW5lXCI7XG5pbXBvcnQgeyBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24sIGltcHJvdmVkQW5uZWFsaW5nLCB0eXBlIEltcHJvdmVkQW5uZWFsaW5nU2Vzc2lvbiB9IGZyb20gXCIuL2FubmVhbGluZ19pbXByb3ZlZFwiO1xuaW1wb3J0IHsgYW5uZWFsaW5nV2FzbSB9IGZyb20gXCIuL2FubmVhbGluZ193YXNtXCI7XG5pbXBvcnQgeyBBVkdfU1BFRURfS01ILCBnZXREZWNrLCBnZXRSZXEsIElORiwgaW5pdEFubmVhbGluZ1N0YXRlLCBpc0xvYWQsIEtNX0NPU1RfQ0VOVFMsIFJFT1JHX0NPU1RfQ0VOVFMsIHNjb3JlUm91dGUgfSBmcm9tIFwiLi9hbm5lYWxpbmdfc2hhcmVkXCI7XG5cbmV4cG9ydCBjb25zdCBhdmFpbGFibGVTb2x2ZXJzID0ge1xuICBiYXNlbGluZTogYmFzZWxpbmVBbm5lYWxpbmcsXG4gIGltcHJvdmVkOiBpbXByb3ZlZEFubmVhbGluZyxcbiAgd2FzbTogYW5uZWFsaW5nV2FzbSxcbn0gYXMgY29uc3Q7XG50eXBlIFNvbHZlck5hbWUgPSBrZXlvZiB0eXBlb2YgYXZhaWxhYmxlU29sdmVycztcblxuY29uc3QgSU5JVElBTF9TT0xWRVI6IFNvbHZlck5hbWUgPSBcIndhc21cIjtcbmNvbnN0IGV1cm9zID0gKGNlbnRzOiBudW1iZXIpID0+IGAkeyhjZW50cyAvIDEwMCkudG9GaXhlZCgyKX3igqxgO1xuXG5jbGFzcyBTY29yZU1pc21hdGNoRXJyb3IgZXh0ZW5kcyBFcnJvciB7fVxuXG5mdW5jdGlvbiBjYW5vbmljYWxTY2hlZHVsZShtb2Q6IE1vZHVsZSwgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQpIHtcbiAgY29uc3Qgc2NoZWR1bGUgPSBuZXcgVWludDMyQXJyYXkocmVzdWx0LnNjaGVkdWxlKVxuICBmb3IgKGxldCB0cmFuID0gMDsgdHJhbiA8IG1vZC5OVFJBTlM7IHRyYW4rKykge1xuICAgIGNvbnN0IHNpemUgPSByZXN1bHQuc2NoZWR1bGVTaXplc1t0cmFuXSFcbiAgICBpZiAoc2l6ZSA8IDAgfHwgc2l6ZSA+IHJlc3VsdC5UU0laRSkgdGhyb3cgbmV3IFNjb3JlTWlzbWF0Y2hFcnJvcihgVHJhbnNwb3J0ZXIgJHt0cmFufSBoYXMgaW52YWxpZCBzY2hlZHVsZSBzaXplICR7c2l6ZX1gKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICBjb25zdCBhdCA9IHRyYW4gKiByZXN1bHQuVFNJWkUgKyBpXG4gICAgICBjb25zdCBzdGVwID0gc2NoZWR1bGVbYXRdXG4gICAgICBpZiAoc3RlcCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKGBUcmFuc3BvcnRlciAke3RyYW59IHNjaGVkdWxlIGlzIHRydW5jYXRlZCBhdCAke2l9YClcbiAgICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKSwgcmVxdWVzdCA9IG1vZC5yZXF1ZXN0c1tyZXFdXG4gICAgICBpZiAoIXJlcXVlc3QpIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRyYW5zcG9ydGVyICR7dHJhbn0gcmVmZXJlbmNlcyB1bmtub3duIHJlcXVlc3QgJHtyZXF9YClcbiAgICAgIGNvbnN0IHBvcyA9IGlzTG9hZChzdGVwKSA/IHJlcXVlc3Quc3RhcnRQb2ludCA6IHJlcXVlc3QuZW5kUG9pbnRcbiAgICAgIHNjaGVkdWxlW2F0XSA9IChzdGVwICYgMHhmZmZmKSB8IHBvcyA8PCAxNlxuICAgIH1cbiAgfVxuICByZXR1cm4gc2NoZWR1bGVcbn1cblxuZnVuY3Rpb24gY2hlY2tlZFJlc3VsdChtb2Q6IE1vZHVsZSwgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQpIHtcbiAgaWYgKHJlc3VsdC5zY2hlZHVsZVNpemVzLmxlbmd0aCAhPT0gbW9kLk5UUkFOUyB8fCByZXN1bHQuc2NoZWR1bGVSYXRpbmdzLmxlbmd0aCAhPT0gbW9kLk5UUkFOUylcbiAgICB0aHJvdyBuZXcgU2NvcmVNaXNtYXRjaEVycm9yKFwiU29sdmVyIHJldHVybmVkIGluY29ycmVjdGx5IHNpemVkIHRyYW5zcG9ydGVyIGFycmF5c1wiKVxuICBjb25zdCBzY2hlZHVsZSA9IGNhbm9uaWNhbFNjaGVkdWxlKG1vZCwgcmVzdWx0KVxuICBjb25zdCBzdGF0ZSA9IGluaXRBbm5lYWxpbmdTdGF0ZShtb2QpXG4gIE9iamVjdC5hc3NpZ24oc3RhdGUsIHtcbiAgICBUU0laRTogcmVzdWx0LlRTSVpFLFxuICAgIHNjaGVkdWxlLFxuICAgIHNjaGVkdWxlU2l6ZXM6IHJlc3VsdC5zY2hlZHVsZVNpemVzLFxuICAgIHNjaGVkdWxlUmF0aW5nczogcmVzdWx0LnNjaGVkdWxlUmF0aW5ncyxcbiAgICB0cmFuU3RhcnQ6IHJlc3VsdC50cmFuU3RhcnQsXG4gICAgdW5hc3NpZ25lZDogcmVzdWx0LnVuYXNzaWduZWQsXG4gIH0pXG4gIGxldCB0b3RhbCA9IDBcbiAgZm9yIChsZXQgdHJhbiA9IDA7IHRyYW4gPCBtb2QuTlRSQU5TOyB0cmFuKyspIHtcbiAgICBjb25zdCBleHBlY3RlZCA9IHNjb3JlUm91dGUoc3RhdGUsIHRyYW4pLCByZXBvcnRlZCA9IHJlc3VsdC5zY2hlZHVsZVJhdGluZ3NbdHJhbl0hXG4gICAgaWYgKHJlcG9ydGVkICE9PSBleHBlY3RlZClcbiAgICAgIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRyYW5zcG9ydGVyICR7dHJhbn0gc2NvcmUgbWlzbWF0Y2g6IHJlcG9ydGVkICR7cmVwb3J0ZWR9LCBKUyAke2V4cGVjdGVkfWApXG4gICAgdG90YWwgKz0gZXhwZWN0ZWRcbiAgfVxuICBpZiAocmVzdWx0LnRvdGFsU2NvcmUgIT09IHRvdGFsKVxuICAgIHRocm93IG5ldyBTY29yZU1pc21hdGNoRXJyb3IoYFRvdGFsIHNjb3JlIG1pc21hdGNoOiByZXBvcnRlZCAke3Jlc3VsdC50b3RhbFNjb3JlfSwgSlMgJHt0b3RhbH1gKVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIG1ha2VSZXBvcnQobW9kOiBNb2R1bGUsIHNvbHZlcjogU29sdmVyTmFtZSwgcmVzdWx0OiBBbm5lYWxpbmdSZXN1bHQpIHtcbiAgY29uc3Qgc2NoZWR1bGUgPSBjYW5vbmljYWxTY2hlZHVsZShtb2QsIHJlc3VsdClcbiAgY29uc3Qgcm91dGVzID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBtb2QuTlRSQU5TfSwgKF8sIHRyYW4pID0+IHtcbiAgICBjb25zdCBkZWNrczogW251bWJlcltdLCBudW1iZXJbXV0gPSBbW10sIFtdXVxuICAgIGNvbnN0IHN0ZXBzID0gW11cbiAgICBsZXQgcG9zID0gcmVzdWx0LnRyYW5TdGFydFt0cmFuXSEsIGVsYXBzZWRNaW51dGVzID0gMCwgcmV3YXJkQ2VudHMgPSAwLCBjb3N0Q2VudHMgPSAwXG4gICAgbGV0IGludmFsaWQ6IHN0cmluZyB8IG51bGwgPSBudWxsXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN1bHQuc2NoZWR1bGVTaXplc1t0cmFuXSE7IGkrKykge1xuICAgICAgY29uc3QgcGFja2VkID0gc2NoZWR1bGVbdHJhbiAqIHJlc3VsdC5UU0laRSArIGldISwgbG9hZCA9ICEhaXNMb2FkKHBhY2tlZClcbiAgICAgIGNvbnN0IHJlcSA9IGdldFJlcShwYWNrZWQpLCBkZWNrTnVtYmVyID0gZ2V0RGVjayhwYWNrZWQpLCByZXF1ZXN0ID0gbW9kLnJlcXVlc3RzW3JlcV0hXG4gICAgICBjb25zdCBuZXh0UG9zID0gbG9hZCA/IHJlcXVlc3Quc3RhcnRQb2ludCA6IHJlcXVlc3QuZW5kUG9pbnRcbiAgICAgIGNvbnN0IGRpc3RhbmNlS20gPSBtb2Qucm9hZG1hcC5nZXRDb3N0Tihwb3MsIG5leHRQb3MpXG4gICAgICBjb25zdCB0cmF2ZWxDb3N0Q2VudHMgPSBkaXN0YW5jZUttICogS01fQ09TVF9DRU5UU1xuICAgICAgZWxhcHNlZE1pbnV0ZXMgKz0gZGlzdGFuY2VLbSAqIDYwIC8gQVZHX1NQRUVEX0tNSFxuICAgICAgY29zdENlbnRzICs9IHRyYXZlbENvc3RDZW50c1xuICAgICAgbGV0IHJlb3JnSXRlbXMgPSAwLCByZXdhcmRBZGRlZENlbnRzID0gMFxuICAgICAgY29uc3QgZGVjayA9IGRlY2tzW2RlY2tOdW1iZXJdXG4gICAgICBpZiAobG9hZCkge1xuICAgICAgICBkZWNrLnB1c2gocmVxKVxuICAgICAgICBpZiAoZGVjay5sZW5ndGggPiAzKSBpbnZhbGlkID0gYGRlY2sgJHtkZWNrTnVtYmVyfSBleGNlZWRzIGNhcGFjaXR5YFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBkZWNrLmluZGV4T2YocmVxKVxuICAgICAgICBpZiAoaW5kZXggPCAwKSBpbnZhbGlkID0gYHJlcXVlc3QgJHtyZXF9IGlzIG5vdCBvbiBkZWNrICR7ZGVja051bWJlcn1gXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJlb3JnSXRlbXMgPSBkZWNrLmxlbmd0aCAtIGluZGV4IC0gMVxuICAgICAgICAgIGNvc3RDZW50cyArPSByZW9yZ0l0ZW1zICogUkVPUkdfQ09TVF9DRU5UU1xuICAgICAgICAgIGRlY2suc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICAgIGlmIChlbGFwc2VkTWludXRlcyA8PSBNYXRoLmZsb29yKHJlcXVlc3QuZGVhZGxpbmVfaCAqIDYwKSkge1xuICAgICAgICAgICAgcmV3YXJkQWRkZWRDZW50cyA9IE1hdGgucm91bmQocmVxdWVzdC52YWx1ZV9ldXIgKiAxMDApXG4gICAgICAgICAgICByZXdhcmRDZW50cyArPSByZXdhcmRBZGRlZENlbnRzXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGVwcy5wdXNoKHtcbiAgICAgICAgaW5kZXg6IGksIHJlcSwgYWN0aW9uOiBsb2FkID8gXCJsb2FkXCIgOiBcInVubG9hZFwiLCBkZWNrOiBkZWNrTnVtYmVyLCBmcm9tOiBwb3MsIHRvOiBuZXh0UG9zLFxuICAgICAgICBkaXN0YW5jZUttLCBlbGFwc2VkTWludXRlcywgZGVhZGxpbmVNaW51dGVzOiBNYXRoLmZsb29yKHJlcXVlc3QuZGVhZGxpbmVfaCAqIDYwKSxcbiAgICAgICAgdHJhdmVsQ29zdENlbnRzLCByZW9yZ0l0ZW1zLCByZW9yZ0Nvc3RDZW50czogcmVvcmdJdGVtcyAqIFJFT1JHX0NPU1RfQ0VOVFMsXG4gICAgICAgIHJld2FyZEFkZGVkQ2VudHMsIHJld2FyZENlbnRzLCBjb3N0Q2VudHMsIHNjb3JlQ2VudHM6IHJld2FyZENlbnRzIC0gY29zdENlbnRzLFxuICAgICAgICBkZWNrczogZGVja3MubWFwKGl0ZW1zID0+IFsuLi5pdGVtc10pLCBpbnZhbGlkLFxuICAgICAgfSlcbiAgICAgIHBvcyA9IG5leHRQb3NcbiAgICAgIGlmIChpbnZhbGlkKSBicmVha1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdHJhbiwgc3RhcnQ6IHJlc3VsdC50cmFuU3RhcnRbdHJhbl0sIHNpemU6IHJlc3VsdC5zY2hlZHVsZVNpemVzW3RyYW5dLFxuICAgICAgcmVwb3J0ZWRTY29yZUNlbnRzOiByZXN1bHQuc2NoZWR1bGVSYXRpbmdzW3RyYW5dLCBqc1Njb3JlQ2VudHM6IGludmFsaWQgPyAtSU5GIDogcmV3YXJkQ2VudHMgLSBjb3N0Q2VudHMsXG4gICAgICBpbnZhbGlkLCBzdGVwcyxcbiAgICB9XG4gIH0pXG4gIHJldHVybiB7XG4gICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksIHNvbHZlcixcbiAgICBjb25zdGFudHM6IHtLTV9DT1NUX0NFTlRTLCBBVkdfU1BFRURfS01ILCBSRU9SR19DT1NUX0NFTlRTfSxcbiAgICBtb2R1bGU6IHtcbiAgICAgIE5SRVFTOiBtb2QuTlJFUVMsIE5UUkFOUzogbW9kLk5UUkFOUywgTUFQU0laRTogbW9kLk1BUFNJWkUsIFJTSVpFOiBtb2QuUlNJWkUsXG4gICAgICBzdGFydHBvc2l0aW9uczogbW9kLnN0YXJ0cG9zaXRpb25zLCByZXF1ZXN0czogbW9kLnJlcXVlc3RzLCBwb2ludHM6IG1vZC5yb2FkbWFwLnBvaW50cyxcbiAgICAgIGNvc3RNYXRyaXg6IEFycmF5LmZyb20obW9kLnJvYWRtYXAuQ29zdE1hdHJpeCksXG4gICAgfSxcbiAgICByZXN1bHQ6IHtcbiAgICAgIFRTSVpFOiByZXN1bHQuVFNJWkUsIGVsYXBzZWRNczogcmVzdWx0LmVsYXBzZWRNcywgdG90YWxTY29yZTogcmVzdWx0LnRvdGFsU2NvcmUsXG4gICAgICBzY2hlZHVsZTogQXJyYXkuZnJvbShyZXN1bHQuc2NoZWR1bGUpLCBzY2hlZHVsZVNpemVzOiBBcnJheS5mcm9tKHJlc3VsdC5zY2hlZHVsZVNpemVzKSxcbiAgICAgIHNjaGVkdWxlUmF0aW5nczogQXJyYXkuZnJvbShyZXN1bHQuc2NoZWR1bGVSYXRpbmdzKSwgdW5hc3NpZ25lZDogQXJyYXkuZnJvbShyZXN1bHQudW5hc3NpZ25lZCksXG4gICAgfSxcbiAgICByb3V0ZXMsXG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc2F2ZVJlcG9ydChtb2Q6IE1vZHVsZSwgc29sdmVyOiBTb2x2ZXJOYW1lLCByZXN1bHQ6IEFubmVhbGluZ1Jlc3VsdCkge1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiL3JlcG9ydFwiLCB7XG4gICAgbWV0aG9kOiBcIlBPU1RcIiwgaGVhZGVyczoge1wiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwifSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShtYWtlUmVwb3J0KG1vZCwgc29sdmVyLCByZXN1bHQpKSxcbiAgfSlcbiAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKGBSZXBvcnQgZW5kcG9pbnQgcmV0dXJuZWQgJHtyZXNwb25zZS5zdGF0dXN9YClcbiAgY29uc29sZS5pbmZvKFwiQW5uZWFsaW5nIHJlcG9ydCBzYXZlZFwiLCBhd2FpdCByZXNwb25zZS5qc29uKCkpXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwbGFubmVyVmlldyhtb2Q6IE1vZHVsZSk6IFByb21pc2U8SFRNTEVsZW1lbnQ+IHtcbiAgY29uc3Qgb3V0ZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmdyYXk7XG4gIGNvbnN0IGlubmVyQm9yZGVyID0gXCIxcHggc29saWQgXCIgKyBjb2xvci5saWdodGdyYXk7XG4gIGNvbnN0IGNlbGxQYWRkaW5nID0gXCIuMzVlbSAuNWVtXCI7XG4gIGNvbnN0IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCA9IFwiMi4xZW1cIjtcblxuICBsZXQgYW5uZWFsZXI6IEFubmVhbGluZ1Jlc3VsdCB8IG51bGwgPSBudWxsO1xuICBsZXQgYW5uZWFsaW5nU2Vzc2lvbjogSW1wcm92ZWRBbm5lYWxpbmdTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG4gIGxldCBhbm5lYWxpbmdUaW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGxldCBydW5JZCA9IDA7XG5cbiAgZnVuY3Rpb24gaXRlbUJ1dHRvbihpdGVtOiBudW1iZXIsIGxvYWQ/OiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVxID0gbW9kLnJlcXVlc3RzW2l0ZW1dITtcbiAgICBjb25zdCBzcCA9IHNwYW4oXG4gICAgICBpdGVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMywgXCIgXCIpLFxuICAgICAgc3R5bGUoe1xuICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICBib3JkZXI6IFwiMnB4IHNvbGlkIHRyYW5zcGFyZW50XCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuMmVtXCIsXG4gICAgICAgIHdoaXRlU3BhY2U6IFwicHJlXCIsXG4gICAgICAgIGZvbnRGYW1pbHk6IFwibW9ub3NwYWNlXCIsXG4gICAgICB9KSxcbiAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9wdXAoXG4gICAgICAgICAgcChcIml0ZW0gXCIsIGl0ZW0pLFxuICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgdHIoY2VsbChcInN0YXR1c1wiKSwgY2VsbChsb2FkID8gXCJsb2FkXCIgOiBsb2FkID09PSBmYWxzZSA/IFwidW5sb2FkXCIgOiBcInVuYXNzaWduZWRcIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcInZhbHVlXCIpLCBjZWxsKHJlcS52YWx1ZV9ldXIgKyBcIuKCrFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGlzdFwiKSwgY2VsbChtb2Qucm9hZG1hcC5nZXRDb3N0TihyZXEuc3RhcnRQb2ludCwgcmVxLmVuZFBvaW50KSArIFwia21cIikpLFxuICAgICAgICAgICAgdHIoY2VsbChcImRlYWRsaW5lXCIpLCBjZWxsKHJlcS5kZWFkbGluZV9oLnRvRml4ZWQoMikgKyBcImhcIikpLFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICk7XG5cbiAgICBsZXQgcG9pbnRzID0gW1xuICAgICAgeyBudW1iZXI6IHJlcS5zdGFydFBvaW50LCBsb2dvOiBcIvCfk6ZcIiB9LFxuICAgICAgeyBudW1iZXI6IHJlcS5lbmRQb2ludCwgbG9nbzogXCLwn4+gXCIgfSxcbiAgICBdO1xuXG4gICAgaWYgKGxvYWQgPT09IHRydWUpIHBvaW50cyA9IFtwb2ludHNbMF0hXTtcbiAgICBpZiAobG9hZCA9PT0gZmFsc2UpIHBvaW50cyA9IFtwb2ludHNbMV0hXTtcblxuICAgIHNwLm9ubW91c2VlbnRlciA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gY29sb3IuZ3JlZW47XG4gICAgICBoaWdodExpZ2h0cy5zZXQoW3sgcG9pbnRzIH1dKTtcbiAgICB9O1xuICAgIHNwLm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcbiAgICAgIHNwLnN0eWxlLmJvcmRlckNvbG9yID0gXCJ0cmFuc3BhcmVudFwiO1xuICAgIH07XG4gICAgcmV0dXJuIHNwO1xuICB9XG5cbiAgY29uc3QgY2VsbDogdHlwZW9mIHRkID0gKC4uLngpID0+IHRkKHN0eWxlKHsgYm9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHZlcnRpY2FsQWxpZ246IFwidG9wXCIgfSksIC4uLngpO1xuICBjb25zdCBjb250cm9scyA9IGRpdihzdHlsZSh7IGRpc3BsYXk6IFwiZmxleFwiLCBnYXA6IFwiLjVlbVwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBmbGV4V3JhcDogXCJ3cmFwXCIgfSkpO1xuICBjb25zdCBzY29yZUxpbmUgPSBwKCk7XG4gIGNvbnN0IHRpbWVMaW5lID0gcCgpO1xuICBjb25zdCBzb2x2ZXJTZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VsZWN0XCIpO1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMoYXZhaWxhYmxlU29sdmVycykgYXMgU29sdmVyTmFtZVtdKSBzb2x2ZXJTZWxlY3QuYWRkKG5ldyBPcHRpb24obmFtZSwgbmFtZSkpO1xuICBzb2x2ZXJTZWxlY3QudmFsdWUgPSBJTklUSUFMX1NPTFZFUjtcbiAgY29uc3Qgc29sdmVyTGluZSA9IHAoXCJzb2x2ZXI6IFwiLCBzb2x2ZXJTZWxlY3QpO1xuICBjb25zdCBkZXRhaWxXcmFwID0gZGl2KCk7XG4gIGNvbnN0IHRhYmxlV3JhcCA9IGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBvdmVyZmxvd1g6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dZOiBcImhpZGRlblwiLFxuICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLFxuICAgIH0pLFxuICApO1xuXG4gIGNvbnN0IHJ1bkJ1dHRvbiA9IGJ1dHRvbihcInN0YXJ0XCIpO1xuICBjb25zdCBoZWF0QnV0dG9uID0gYnV0dG9uKFwiaGVhdCB1cFwiKTtcbiAgbGV0IHJlbmRlckNvdW50ZXIgPSAwO1xuXG4gIGZ1bmN0aW9uIHN0b3BTZWFyY2goKSB7XG4gICAgaWYgKGFubmVhbGluZ1RpbWVyICE9IG51bGwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoYW5uZWFsaW5nVGltZXIpO1xuICAgICAgYW5uZWFsaW5nVGltZXIgPSBudWxsO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0YXJ0XCI7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJUYWJsZSgpIHtcbiAgICBjb25zdCB0YWIgPSB0YWJsZShcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgfSksXG4gICAgICB0cihcbiAgICAgICAgdGgoXCJ0cmFuc3BvcnRlclwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJ2YWx1ZVwiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICAgdGgoXCJzdGVwc1wiLCBzdHlsZSh7IGJvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwiIH0pKSxcbiAgICAgICksXG4gICAgICBtb2Quc3RhcnRwb3NpdGlvbnMubWFwKChzdGFydCwgdHJhbikgPT5cbiAgICAgICAgdHIoXG4gICAgICAgICAgdGQoXG4gICAgICAgICAgICB0cmFuLFxuICAgICAgICAgICAgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcG9wdXAoXG4gICAgICAgICAgICAgICAgcChcInRyYW5zcG9ydGVyOiBcIiwgdHJhbiksXG4gICAgICAgICAgICAgICAgcChcInN0YXJ0OiBcIiwgc3RhcnQpLFxuICAgICAgICAgICAgICAgIHAoXCJzY29yZTogXCIsIGV1cm9zKGFubmVhbGVyPy5zY2hlZHVsZVJhdGluZ3NbdHJhbl0gPz8gMCkpLFxuICAgICAgICAgICAgICAgIHAoXCJzdGVwczogXCIsIGFubmVhbGVyPy5zY2hlZHVsZVNpemVzW3RyYW5dISksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvbm1vdXNlZW50ZXI6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWdodExpZ2h0cy5zZXQoW3sgcG9pbnRzOiBbeyBudW1iZXI6IHN0YXJ0LCBsb2dvOiBcIvCfmptcIiB9XSB9XSk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIG9ubW91c2VsZWF2ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGhpZ2h0TGlnaHRzLnNldChbXSk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICksXG4gICAgICAgICAgdGQoZXVyb3MoYW5uZWFsZXI/LnNjaGVkdWxlUmF0aW5nc1t0cmFuXSA/PyAwKSwgc3R5bGUoeyBib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIiB9KSksXG4gICAgICAgICAgdGQoXG4gICAgICAgICAgICB0YWJsZShcbiAgICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBbMCwgMV0ubWFwKChkZWNrKSA9PlxuICAgICAgICAgICAgICAgIHRyKFxuICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbSh7IGxlbmd0aDogYW5uZWFsZXIhLnNjaGVkdWxlU2l6ZXNbdHJhbl0hIH0sIChfLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0ZXAgPSBhbm5lYWxlcj8uc2NoZWR1bGVbdHJhbiAqIGFubmVhbGVyLlRTSVpFICsgaV0hO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2FkID0gaXNMb2FkKHN0ZXApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGQoXG4gICAgICAgICAgICAgICAgICAgICAgZ2V0RGVjayhzdGVwKSA9PT0gZGVjayA/IGl0ZW1CdXR0b24oZ2V0UmVxKHN0ZXApLCAhIWxvYWQpIDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogbG9hZCA/IGNvbG9yLmJsdWUgOiBjb2xvci5ncmVlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogaW5uZXJCb3JkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBcIi4yZW0gLjNlbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6IFwiMi42ZW1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2NoZWR1bGVDZWxsTWluSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgYm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcbiAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgICBib3JkZXI6IG91dGVyQm9yZGVyLFxuICAgICAgICAgICAgICBwYWRkaW5nOiBcIi4yNWVtXCIsXG4gICAgICAgICAgICAgIHZlcnRpY2FsQWxpZ246IFwidG9wXCIsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICApO1xuXG4gICAgdGFibGVXcmFwLnJlcGxhY2VDaGlsZHJlbih0YWIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyU3RhdHVzKCkge1xuICAgIGlmICghYW5uZWFsZXIpIHJldHVybjtcbiAgICBzY29yZUxpbmUudGV4dENvbnRlbnQgPSBgc2NvcmU6ICR7ZXVyb3MoYW5uZWFsZXIudG90YWxTY29yZSl9YDtcbiAgICB0aW1lTGluZS50ZXh0Q29udGVudCA9IGBzZWFyY2ggdGltZTogJHsoYW5uZWFsZXIhLmVsYXBzZWRNcy8xMDAwKS50b0ZpeGVkKDIpfSBzYDtcblxuICAgIGRldGFpbFdyYXAucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgZGl2KFxuICAgICAgICBwKFwiZGV0YWlsc1wiKSxcbiAgICAgICAgdGFibGUoXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIixcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0cihjZWxsKFwidW5hc3NpZ25lZCByZXF1ZXN0c1wiKSwgY2VsbChBcnJheS5mcm9tKGFubmVhbGVyIS51bmFzc2lnbmVkKS5tYXAoKHgsIGkpID0+ICh7IHgsIGkgfSkpLmZpbHRlcigoeCkgPT4geC54KS5mbGF0TWFwKCh4KSA9PiBbc3BhbihcIiBcIiksIGl0ZW1CdXR0b24oeC5pKV0pKSksXG4gICAgICAgICAgdHIoY2VsbChcInNlYXJjaCB0aW1lXCIpLCBjZWxsKGAke2FubmVhbGVyPy5lbGFwc2VkTXMgPz8gMH1tc2ApKSxcbiAgICAgICAgICB0cihjZWxsKFwic2NvcmVcIiksIGNlbGwoZXVyb3MoYW5uZWFsZXIudG90YWxTY29yZSkpKSxcbiAgICAgICAgICB0cihjZWxsKFwidHJhbnNwb3J0ZXIgY291bnRcIiksIGNlbGwobW9kLk5UUkFOUykpLFxuICAgICAgICAgIHRyKGNlbGwoXCJyZXF1ZXN0IGNvdW50XCIpLCBjZWxsKG1vZC5OUkVRUykpLFxuICAgICAgICAgIHRyKGNlbGwoXCJjb3N0IHBlciBrbVwiKSwgY2VsbChldXJvcyhLTV9DT1NUX0NFTlRTKSkpLFxuICAgICAgICAgIHRyKGNlbGwoXCJhdmVyYWdlIHNwZWVkXCIpLCBjZWxsKGAke0FWR19TUEVFRF9LTUh9a20vaGApKSxcbiAgICAgICAgICB0cihjZWxsKFwicmVvcmdhbml6YXRpb24gY29zdFwiKSwgY2VsbChldXJvcyhSRU9SR19DT1NUX0NFTlRTKSkpLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyKGZvcmNlVGFibGUgPSBmYWxzZSkge1xuICAgIGlmICghYW5uZWFsZXIpIHJldHVybjtcbiAgICByZW5kZXJTdGF0dXMoKTtcbiAgICBpZiAoZm9yY2VUYWJsZSB8fCAocmVuZGVyQ291bnRlcisrICUgNCA9PT0gMCkpIHJlbmRlclRhYmxlKCk7XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBydW5Tb2x2ZXIobmFtZTogU29sdmVyTmFtZSkge1xuICAgIHN0b3BTZWFyY2goKTtcbiAgICBjb25zdCBpZCA9ICsrcnVuSWQ7XG4gICAgYW5uZWFsaW5nU2Vzc2lvbiA9IG51bGw7XG4gICAgYW5uZWFsZXIgPSBudWxsO1xuICAgIHJ1bkJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgc2NvcmVMaW5lLnRleHRDb250ZW50ID0gXCJydW5uaW5n4oCmXCI7XG4gICAgdGFibGVXcmFwLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgIGxldCByZXN1bHQ6IEFubmVhbGluZ1Jlc3VsdCB8IG51bGwgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBpZiAobmFtZSA9PT0gXCJpbXByb3ZlZFwiKSB7XG4gICAgICAgIGFubmVhbGluZ1Nlc3Npb24gPSBjcmVhdGVJbXByb3ZlZEFubmVhbGluZ1Nlc3Npb24obW9kLCAxXzkwMF8wMDApO1xuICAgICAgICByZXN1bHQgPSBhbm5lYWxpbmdTZXNzaW9uLml0ZXJhdGVGb3JNcygxMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBhd2FpdCBhdmFpbGFibGVTb2x2ZXJzW25hbWVdKG1vZCk7XG4gICAgICB9XG4gICAgICBhbm5lYWxlciA9IGNoZWNrZWRSZXN1bHQobW9kLCByZXN1bHQpO1xuICAgICAgaWYgKGlkID09PSBydW5JZCkge1xuICAgICAgICByZW5kZXIodHJ1ZSk7XG4gICAgICAgIHZvaWQgc2F2ZVJlcG9ydChtb2QsIG5hbWUsIGFubmVhbGVyKS5jYXRjaChlcnJvciA9PiBjb25zb2xlLndhcm4oXCJDb3VsZCBub3Qgc2F2ZSBhbm5lYWxpbmcgcmVwb3J0XCIsIGVycm9yKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIFNjb3JlTWlzbWF0Y2hFcnJvcikge1xuICAgICAgICBpZiAocmVzdWx0KSB0cnkgeyBhd2FpdCBzYXZlUmVwb3J0KG1vZCwgbmFtZSwgcmVzdWx0KTsgfVxuICAgICAgICBjYXRjaCAocmVwb3J0RXJyb3IpIHsgY29uc29sZS53YXJuKFwiQ291bGQgbm90IHNhdmUgbWlzbWF0Y2ggcmVwb3J0XCIsIHJlcG9ydEVycm9yKTsgfVxuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICAgIGlmIChpZCA9PT0gcnVuSWQpIHNjb3JlTGluZS50ZXh0Q29udGVudCA9IGBzb2x2ZXIgZmFpbGVkOiAke1N0cmluZyhlcnJvcil9YDtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGlkID09PSBydW5JZCkge1xuICAgICAgICBydW5CdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgcnVuQnV0dG9uLnRleHRDb250ZW50ID0gbmFtZSA9PT0gXCJpbXByb3ZlZFwiID8gXCJzdGFydFwiIDogXCJydW5cIjtcbiAgICAgICAgaGVhdEJ1dHRvbi5oaWRkZW4gPSBuYW1lICE9PSBcImltcHJvdmVkXCI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcnVuQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgbmFtZSA9IHNvbHZlclNlbGVjdC52YWx1ZSBhcyBTb2x2ZXJOYW1lO1xuICAgIGlmIChuYW1lICE9PSBcImltcHJvdmVkXCIpIHtcbiAgICAgIHZvaWQgcnVuU29sdmVyKG5hbWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoYW5uZWFsaW5nVGltZXIgIT0gbnVsbCkge1xuICAgICAgc3RvcFNlYXJjaCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBydW5CdXR0b24udGV4dENvbnRlbnQgPSBcInN0b3BcIjtcbiAgICBhbm5lYWxpbmdUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoIWFubmVhbGluZ1Nlc3Npb24pIHJldHVybjtcbiAgICAgIGFubmVhbGVyID0gY2hlY2tlZFJlc3VsdChtb2QsIGFubmVhbGluZ1Nlc3Npb24uaXRlcmF0ZUZvck1zKDEyMCkpO1xuICAgICAgcmVuZGVyKCk7XG4gICAgfSwgMTUwKTtcbiAgfTtcblxuICBoZWF0QnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgaWYgKCFhbm5lYWxpbmdTZXNzaW9uKSByZXR1cm47XG4gICAgYW5uZWFsZXIgPSBjaGVja2VkUmVzdWx0KG1vZCwgYW5uZWFsaW5nU2Vzc2lvbi5yZWhlYXQoKSk7XG4gICAgcmVuZGVyKHRydWUpO1xuICB9O1xuXG4gIHNvbHZlclNlbGVjdC5vbmNoYW5nZSA9ICgpID0+IHZvaWQgcnVuU29sdmVyKHNvbHZlclNlbGVjdC52YWx1ZSBhcyBTb2x2ZXJOYW1lKTtcbiAgY29udHJvbHMucmVwbGFjZUNoaWxkcmVuKHJ1bkJ1dHRvbiwgaGVhdEJ1dHRvbik7XG4gIGF3YWl0IHJ1blNvbHZlcihJTklUSUFMX1NPTFZFUik7XG5cbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBwYWRkaW5nOiBcIjFlbVwiLFxuICAgICAgb3ZlcmZsb3dZOiBcImF1dG9cIixcbiAgICAgIG92ZXJmbG93WDogXCJoaWRkZW5cIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjBcIixcbiAgICB9KSxcbiAgICBjb250cm9scyxcbiAgICBzb2x2ZXJMaW5lLFxuICAgIHNjb3JlTGluZSxcbiAgICB0aW1lTGluZSxcbiAgICB0YWJsZVdyYXAsXG4gICAgZGV0YWlsV3JhcCxcbiAgKTtcbn1cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBBbm5lYWxpbmdSZXN1bHQgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nX2Jhc2VsaW5lXCJcbmltcG9ydCB7IGFubmVhbGluZ1dhc20gfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nX3dhc21cIlxuaW1wb3J0IHR5cGUgeyBNb2R1bGUgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgZGl2LCBoMiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCJcblxubGV0IHJlc3VsdDogQW5uZWFsaW5nUmVzdWx0XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRVcFdhc20ocGxhbm5lcjogTW9kdWxlKSB7XG4gIHJlc3VsdCA9IGF3YWl0IGFubmVhbGluZ1dhc20ocGxhbm5lcilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhc21WaWV3KF9wbGFubmVyOiBNb2R1bGUpIHtcbiAgaWYgKCFyZXN1bHQgKSB0aHJvdyBuZXcgRXJyb3IoXCJXQVNNIHBsYW5uZXIgaXMgbm90IHNldCB1cFwiKVxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHsgcGFkZGluZzogXCIxZW1cIiB9KSxcbiAgICBoMihcIldBU00gcGxhbm5lclwiKSxcbiAgICBwKFwiYXNzaWduZWQ6IFwiLCByZXN1bHQudW5hc3NpZ25lZC5sZW5ndGggLSByZXN1bHQudW5hc3NpZ25lZC5yZWR1Y2UoKHN1bSwgdmFsdWUpID0+IHN1bSArIHZhbHVlLCAwKSksXG4gICAgcChcInNjaGVkdWxlIHN0ZXBzOiBcIiwgcmVzdWx0LnNjaGVkdWxlU2l6ZXMucmVkdWNlKChzdW0sIHZhbHVlKSA9PiBzdW0gKyB2YWx1ZSwgMCkpLFxuICAgIHAoXCJzZWFyY2ggdGltZTogXCIsIHJlc3VsdC5lbGFwc2VkTXMudG9GaXhlZCgyKSwgXCJtc1wiKSxcbiAgKVxufVxuXG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcm9hZG1hcFwiO1xuaW1wb3J0IHsgcmFuZG9tTW9kdWxlLCByYW5kb21VVUlELCBSZXF1ZXN0LCBTY2hlZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgbWtTdG9yZWQsIG1rV3JpdGFibGUsIHR5cGUgV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyBzZXRSYW5kU2VlZCB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB7IG51bWJlciB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmltcG9ydCB7IHBsYW5uZXJWaWV3IH0gZnJvbSBcIi4uL3BsYW5uZXJzL2FubmVhbGluZ1wiO1xuaW1wb3J0IHsgc2V0VXBXYXNtLCB3YXNtVmlldyB9IGZyb20gXCIuL3dhc212aWV3XCI7XG5cblxuZXhwb3J0IGxldCBMS1dfQ09VTlQgPSBta1N0b3JlZChcIkxLV19DT1VOVFwiLCBudW1iZXIsICA1KVxubGV0IFJFUVVFU1RfQ09VTlQgPSBta1N0b3JlZChcIlJFUVVFU1RfQ09VTlRcIiwgIG51bWJlciwgMjApXG5cbmJvZHkuc3R5bGUubWFyZ2luID0gXCIwXCJcblxubGV0IGhlYWRlciA9IGgxKFwicm91dGUgcGxhbm5lclwiLCBzdHlsZSh7YmFja2dyb3VuZDogY29sb3IuYmx1ZSwgY29sb3I6IGNvbG9yLmJhY2tncm91bmQsIG1hcmdpbjogXCIwXCIsIHBhZGRpbmc6IFwiLjZlbVwifSkpXG5cbmxldCBjb250ZW50U3BhY2UgPSBkaXYoc3R5bGUoe1xuICBkaXNwbGF5OlwiZmxleFwiLFxuICBmbGV4RGlyZWN0aW9uOlwicm93XCIsXG4gIHdpZHRoOiBcIjEwMCVcIixcbiAgaGVpZ2h0OiBcImNhbGMoMTAwJSAtIDIuNWVtKVwiLFxuICBtaW5XaWR0aDogXCIwXCIsXG59KSlcblxubGV0IHBhZ2UgPSBkaXYoXG4gIHN0eWxlKHtkaXNwbGF5OlwiZmxleFwiLCBmbGV4RGlyZWN0aW9uOlwiY29sdW1uXCIsIGhlaWdodDogXCIxMDAlXCJ9KSxcbiAgaGVhZGVyLFxuICBjb250ZW50U3BhY2VcbilcblxuYm9keS5yZXBsYWNlQ2hpbGRyZW4ocGFnZSlcblxuc2V0UmFuZFNlZWQoMjQpXG5cbmV4cG9ydCBsZXQgbW9kdWxlID0gcmFuZG9tTW9kdWxlKClcblxuZXhwb3J0IHR5cGUgSGlnaExpZ2h0ID0ge1xuICBwb2ludHM6IHtcbiAgICBudW1iZXI6IG51bWJlcixcbiAgICBsb2dvPyA6IHN0cmluZyxcbiAgfVtdLFxuICBjb2xvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgbGV0IGhpZ2h0TGlnaHRzID0gbWtXcml0YWJsZSA8SGlnaExpZ2h0W10+KCBbXSApXG5cblxuZnVuY3Rpb24gc2V0dGVyIChzdG9yZTogV3JpdGFibGU8bnVtYmVyPiApe1xuICBsZXQgaW5wID0gaW5wdXQoKVxuICBpbnAudHlwZSA9IFwibnVtYmVyXCJcbiAgaW5wLm9uY2hhbmdlID0gKCk9PntcbiAgICBsZXQgdmFsID0gcGFyc2VJbnQoaW5wLnZhbHVlKVxuICAgIGlmIChpc05hTih2YWwpKSByZXR1cm5cbiAgICBzdG9yZS5zZXQodmFsKVxuICB9XG4gIHN0b3JlLm9udXBkYXRlKHZhbD0+aW5wLnZhbHVlID0gdmFsLnRvU3RyaW5nKCkpXG5cbiAgcmV0dXJuIGlucFxufVxuXG5cbmF3YWl0IHNldFVwV2FzbShtb2R1bGUpXG5cbmFzeW5jIGZ1bmN0aW9uIG1rV2luZG93ICh0YWI6IG51bWJlciA9IDAgKSB7XG5cbiAgbGV0IHRhYkZpZWxkcyA9IFtcbiAgICBbJ21hcCcsIG1hcFZpZXcobW9kdWxlKV0sXG4gICAgWydwbGFubmVyJywgYXdhaXQgcGxhbm5lclZpZXcobW9kdWxlKV0sXG4gICAgWyd3YXNtJywgd2FzbVZpZXcobW9kdWxlKV1cbiAgXSBhcyBjb25zdFxuXG4gIGNvbnN0IGVsID0gZGl2KHN0eWxlKHtcbiAgICBmbGV4OiBcIjEgMSAwXCIsXG4gICAgbWluV2lkdGg6IFwiMFwiLFxuICAgIGhlaWdodDogXCJjYWxjKDEwMHZoIC0gMWVtKVwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICBvdmVyZmxvdzogXCJoaWRkZW5cIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgY29uc3QgdGFicyA9IHAoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIG1hcmdpbjogXCIwXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjRlbVwiLFxuICAgICAgICBmbGV4OiBcIjAgMCBhdXRvXCIsXG4gICAgICB9KSxcbiAgICAgIHRhYkZpZWxkcy5tYXAoKFtuLGVdKT0+XG4gICAgICAgIHNwYW4oIG4sXG4gICAgICAgICAgKCk9Pm9wZW5UYWIobiksXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgcGFkZGluZzogXCIuM2VtXCIsXG4gICAgICAgICAgICBtYXJnaW46IFwiLjNlbVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrIChuPT10YWIgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXkpLFxuICAgICAgICAgICAgY29sb3I6IChuPT10YWIpID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5LFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG5cbiAgICBjb25zdCBjb250ZW50ID0gZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBmbGV4OiBcIjEgMSBhdXRvXCIsXG4gICAgICAgIG1pbkhlaWdodDogXCIwXCIsXG4gICAgICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLmZpbmQoKFtuLF0pPT5uPT10YWIpIVsxXVxuICAgIClcblxuICAgIGVsLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIHRhYnMsXG4gICAgICBjb250ZW50XG4gICAgKVxuICB9XG5cbiAgb3BlblRhYih0YWJGaWVsZHNbdGFiXSFbMF0pXG5cbiAgcmV0dXJuIGVsXG59XG5cbmNvbnRlbnRTcGFjZS5yZXBsYWNlQ2hpbGRyZW4oLi4uYXdhaXQgUHJvbWlzZS5hbGwoW21rV2luZG93KDEpLCBta1dpbmRvdygpXSkpXG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBRU8sSUFBTSxPQUFPLFNBQVM7QUFFN0IsSUFBTSxlQUFlO0FBQUEsRUFDbkIsT0FBTTtBQUFBLElBQ0osT0FBbUI7QUFBQSxJQUNuQixZQUFtQjtBQUFBLElBQ25CLEtBQW1CO0FBQUEsSUFDbkIsT0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFDQSxNQUFLO0FBQUEsSUFDSCxPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsSUFDbkIsT0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsRUFDckI7QUFDRjtBQUVPLElBQU0sUUFBUTtBQUFBLEVBQ25CLE9BQU87QUFBQSxFQUNQLFlBQVk7QUFBQSxFQUNaLE1BQU07QUFBQSxFQUNOLFdBQVc7QUFBQSxFQUNYLEtBQUs7QUFBQSxFQUNMLE9BQU87QUFBQSxFQUNQLE1BQU07QUFBQSxFQUNOLFdBQVc7QUFDYjtBQUdBLElBQUksT0FBTyxTQUFT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
