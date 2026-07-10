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

// src/randomMap.ts
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

// src/planners/annealing.ts
function isload(x) {
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
var KM_COST = 0.5;
var AVG_SPEED_KMH = 60;
var REORG_COST_EUR = 100;
function simpleAnnealing(mod) {
  const { NREQS, requests, startpositions, NTRANS, roadmap } = mod;
  const TSIZE = Math.floor(NREQS * 2.5 + 10);
  const reqPickupLocations = new Uint16Array(requests.map((r) => r.startPoint));
  const reqDeliveryLocations = new Uint16Array(requests.map((r) => r.endPoint));
  const reqDeadlines = new Uint32Array(requests.map((r) => r.deadline_h * AVG_SPEED_KMH));
  const reqValues = new Uint32Array(requests.map((r) => r.value_eur / KM_COST));
  const unassigned = new Int8Array(requests.map((r) => 1));
  const tranStart = new Uint16Array(startpositions);
  const schedule = new Uint32Array(TSIZE * NTRANS);
  const scheduleSizes = new Uint16Array(NTRANS);
  let INF = 1 << 15;
  function score(tran) {
    let reward = 0;
    let duration = 0;
    let decks = [[], []];
    let pos = tranStart[tran];
    for (let i = 0;i < scheduleSizes[tran]; i++) {
      let step = schedule[tran * TSIZE + i];
      const load = isload(step);
      const req = getReq(step);
      const nextpos = getPos(step);
      duration += roadmap.getCostN(pos, nextpos);
      pos = nextpos;
      if (load) {
        let deck = decks[getDeck(step)];
        deck.push(req);
        if (deck.length > 3)
          return -INF;
      } else {
        let deck = decks[getDeck(step)];
        let idx = deck.indexOf(req);
        if (idx == -1)
          throw new Error("car not found");
        duration += (deck.length - idx - 1) * REORG_COST_EUR / KM_COST;
        deck.splice(idx, 1);
        if (duration <= reqDeadlines[req])
          reward += reqValues[req];
      }
    }
    return reward - duration;
  }
  const scheduleRatings = Int32Array.from({ length: NTRANS }, (_, i) => score(i));
  function setReq(tran, idx, isload2, deck, req, pos) {
    schedule[tran * TSIZE + idx] = isload2 << 0 | deck << 1 | req << 2 | pos << 16;
  }
  function insertStops(tran, start, end, deck, req) {
    const offset = tran * TSIZE;
    const size = scheduleSizes[tran];
    scheduleSizes[tran] = size + 2;
    schedule.copyWithin(offset + end + 2, offset + end, offset + size);
    schedule.copyWithin(offset + start + 1, offset + start, offset + end + 1);
    setReq(tran, start, 1, deck, req, reqPickupLocations[req]);
    setReq(tran, end + 1, 0, deck, req, reqDeliveryLocations[req]);
  }
  function removeStops(tran, start, end) {
    const offset = tran * TSIZE;
    const size = scheduleSizes[tran];
    scheduleSizes[tran] = size - 2;
    schedule.copyWithin(offset + start, offset + start + 1, offset + end);
    schedule.copyWithin(offset + end - 1, offset + end + 1, offset + size);
  }
  let start_temp = 100;
  let temp = start_temp;
  function accept(prev_rating, next_rating) {
    return random() < Math.exp((next_rating - prev_rating) / temp);
  }
  function tryAssign() {
    let tran = randInt(0, NTRANS);
    let schedsize = scheduleSizes[tran];
    let a2 = randInt(0, schedsize + 1);
    let b = Math.min(schedsize, randInt(0, 4) + a2);
    let req = randInt(0, NREQS);
    if (!unassigned[req])
      return;
    insertStops(tran, a2, b, random() > 0.5 ? 1 : 0, req);
    let newrating = score(tran);
    if (accept(scheduleRatings[tran], newrating)) {
      scheduleRatings[tran] = newrating;
      unassigned[req] = 0;
    } else {
      removeStops(tran, a2, b + 1);
    }
  }
  function tryUnassign() {
    let tran = randInt(0, NTRANS);
    let schedsize = scheduleSizes[tran];
    if (schedsize < 2)
      return;
    let idx = randInt(0, schedsize);
    let item = schedule[tran * TSIZE + idx];
    let req = getReq(item);
    let ab = [];
    for (let i = 0;i < schedsize; i++) {
      if (getReq(schedule[tran * TSIZE + i]) == req)
        ab.push(i);
    }
    let [a2, b] = ab;
    removeStops(tran, a2, b);
    let newrating = score(tran);
    if (accept(scheduleRatings[tran], newrating)) {
      scheduleRatings[tran] = newrating;
      unassigned[req] = 1;
    } else {
      insertStops(tran, a2, b - 1, getDeck(item), req);
    }
  }
  let st = Date.now();
  let NSTEPS = 400000;
  for (let i = 0;i < NSTEPS; i++) {
    temp = (1 - i / NSTEPS) * start_temp;
    tryUnassign();
    tryAssign();
  }
  time = Date.now() - st;
  return {
    schedule,
    scheduleSizes,
    tranStart,
    TSIZE,
    scheduleRatings,
    unassigned
  };
}
var time = 0;
var annealer = null;
function plannerView(mod) {
  const outerBorder = "1px solid " + color.gray;
  const innerBorder = "1px solid " + color.lightgray;
  const cellPadding = ".35em .5em";
  const scheduleCellMinHeight = "2.1em";
  if (annealer == null)
    annealer = simpleAnnealing(mod);
  function itemButton(item, load) {
    let req = mod.requests[item];
    let sp = span(item.toString().padStart(3, " "), style({ cursor: "pointer", border: "2px solid transparent", borderRadius: ".2em", whiteSpace: "pre", fontFamily: "monospace" }), function() {
      popup(p("item ", item), table(tr(cell("status"), cell(load ? "load" : load == false ? "unload" : "unassigned")), tr(cell("value"), cell(req.value_eur + "€")), tr(cell("dist"), cell(mod.roadmap.getCostN(req.startPoint, req.endPoint) + "km")), tr(cell("deadline"), cell(req.deadline_h.toFixed(2) + "h"))));
    });
    let points = [{
      number: req.startPoint,
      logo: "\uD83D\uDCE6"
    }, {
      number: req.endPoint,
      logo: "\uD83C\uDFE0"
    }];
    if (load == true)
      points = [points[0]];
    if (load == false)
      points = [points[1]];
    sp.onmouseenter = (e) => {
      sp.style.borderColor = color.green;
      hightLights.set([{ points }]);
    };
    sp.onmouseleave = (e) => {
      sp.style.borderColor = "transparent";
    };
    return sp;
  }
  const cell = (...x) => td(style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), ...x);
  let tab = table(style({
    borderCollapse: "collapse",
    width: "100%"
  }), tr(th("transporter", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("value", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("steps", style({ border: outerBorder, padding: cellPadding, textAlign: "left" }))), mod.startpositions.map((start, tran) => {
    return tr(td(tran, style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" }), function() {
      popup(p("transporter: ", tran), p("start: ", start), p("score: ", annealer?.scheduleRatings[tran]), p("steps: ", annealer?.scheduleSizes[tran]));
    }, {
      onmouseenter: (e) => {
        console.log(tran);
        hightLights.set([{ points: [{ number: start, logo: "\uD83D\uDE9A" }] }]);
      }
    }), td(annealer?.scheduleRatings[tran], style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })), table(style({
      borderCollapse: "collapse"
    }), [0, 1].map((deck) => tr(Array.from({ length: annealer.scheduleSizes[tran] }, (_, i) => {
      let step = annealer?.schedule[tran * annealer.TSIZE + i];
      return td(getDeck(step) == deck ? itemButton(getReq(step), isload(step) ? true : false) : "", style({
        color: isload(step) ? color.blue : color.green,
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
    }));
  }));
  return div(style({
    padding: "1em",
    overflowY: "auto",
    overflowX: "hidden",
    height: "100%",
    boxSizing: "border-box",
    minHeight: "0"
  }), div(style({
    overflowX: "auto",
    overflowY: "hidden",
    maxWidth: "100%"
  }), tab), div(h3("parameters"), table(style({
    borderCollapse: "collapse"
  }), tr(cell("unassigned requests"), cell(Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).map((x) => span(" ", itemButton(x.i))))), tr(cell("search time"), cell(time + "ms")), tr(cell("score"), cell(annealer.scheduleRatings.reduce((x, y) => x + y, 0))), tr(cell("transporter count"), cell(mod.NTRANS)), tr(cell("request count"), cell(mod.NREQS)), tr(cell("cost per km"), cell(KM_COST + "€")), tr(cell("average speed"), cell(AVG_SPEED_KMH + "km/h")), tr(cell("reorganization cost"), cell(REORG_COST_EUR + "€")))));
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

//# debugId=00814F34BC7DC4A464756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JhbmRvbU1hcC50cyIsICJzcmMvanNvbnNjaGVtYS50cyIsICJzcmMvc2NoZW1hLnRzIiwgInNyYy90eXBlcy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmcudHMiLCAic3JjL3ZpZXcvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsKICAgICJcbmltcG9ydCB0eXBlIHsgSnNvbkRhdGEgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5leHBvcnQgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbmNvbnN0IGNvbG9yUGFsZXR0ZSA9IHtcbiAgbGlnaHQ6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiMwMDBcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjZmZmXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDI0MiwgNTUsIDU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYig1NywgMjE0LCAzOSlcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoNSwgMjgsIDE0MSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoMjEsIDEzNywgMjM5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM4ODhcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjZTVlNWU1XCIsXG4gIH0sXG4gIGRhcms6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiNmZmZcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjMjIyXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDE5OCwgMjAsIDApXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDk1LCAxNTksIDI1NSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoOTUsIDEwMCwgMjU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYigwLCAxODUsIDE5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM1NjU2NTZcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjNDE0MTQxXCIsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbG9yID0ge1xuICBjb2xvcjogXCJ2YXIoLS1jb2xvcilcIixcbiAgYmFja2dyb3VuZDogXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiLFxuICBibHVlOiBcInZhcigtLWJsdWUpXCIsXG4gIGxpZ2h0Qmx1ZTogXCJ2YXIoLS1saWdodGJsdWUpXCIsXG4gIHJlZDogXCJ2YXIoLS1yZWQpXCIsXG4gIGdyZWVuOiBcInZhcigtLWdyZWVuKVwiLFxuICBncmF5OiBcInZhcigtLWdyYXkpXCIsXG4gIGxpZ2h0Z3JheTogXCJ2YXIoLS1saWdodGdyYXkpXCJcbn1cblxuXG5sZXQgc3R5bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKVxuc3R5bC5pbm5lckhUTUwgPSBgXG46cm9vdCB7XG4gIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmRhcmsuY29sb3J9O1xuICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmFja2dyb3VuZH07XG4gIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5kYXJrLnJlZH07XG4gIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JlZW59O1xuICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmx1ZX07XG4gIC0tZ3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5ncmF5fTtcbiAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsubGlnaHRncmF5fTtcbiAgY29sb3I6IHZhcigtLWNvbG9yKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZCk7XG4gIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgOnJvb3Qge1xuICAgIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmNvbG9yfTtcbiAgICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJhY2tncm91bmR9O1xuICAgIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5saWdodC5yZWR9O1xuICAgIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyZWVufTtcbiAgICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJsdWV9O1xuICAgIC0tZ3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JheX07XG4gICAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmxpZ2h0Z3JheX07XG4gIH1cbn1cbmBcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bClcblxuZXhwb3J0IHR5cGUgaHRtbEtleSA9ICdpbm5lclRleHQnfCdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdvbmtleWRvd24nIHwgJ29ubW91c2VlbnRlcicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuLy8gaW1wb3J0IHsgZmluZFBhdGggfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgIHR5cGUgUm9hZE1hcCB9IGZyb20gXCIuLi9yYW5kb21NYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLHgxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDdcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICAvLyBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAvLyAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgIC8vICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueC9NQVBTSVpFLCBBLnkvTUFQU0laRSwgQi54L01BUFNJWkUsIEIueS9NQVBTSVpFKVxuICAgICAgICAgIC8vICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgLy8gICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAvLyAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAvLyAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIC8vIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLnBvaW50c1twLm51bWJlcl0hXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LyBNQVBTSVpFLCBwb3MueS9NQVBTSVpFLCBwLmxvZ28pXG4gICAgICAgICAgZWwuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMDBcIilcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsLmVsKVxuICAgICAgICAgIGhpbnRzLnB1c2goZWwuZWwpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgbGV0IGR2ID0gZGl2KHN0eWxlKHt3aWR0aDpcIjEwMCVcIiwgZGlzcGxheTpcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6XCJjZW50ZXJcIiwgcGFkZGluZzogXCIxZW1cIn0pKVxuICBkdi5hcHBlbmQoZWxlbWVudClcblxuXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cblxuZXhwb3J0IHR5cGUgUG9zID0ge3g6bnVtYmVyLCB5OiBudW1iZXJ9XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbU1hcCAoTlBPSU5UUzpudW1iZXIsIE1BUFNJWkU6bnVtYmVyKXtcblxuICBsZXQgSFBPSU5UID0gTlBPSU5UUy8yXG4gIGxldCBSU0laRSA9IE5QT0lOVFMgKiBIUE9JTlRcblxuXG4gIGxldCByb2FkcyA9IG5ldyBVaW50MTZBcnJheShSU0laRSlcblxuICBmdW5jdGlvbiByb2FkSURYICAoYTpudW1iZXIsIGI6bnVtYmVyKXtcbiAgICBpZiAoYTxiKSBbYSxiXSA9IFtiLGFdXG4gICAgbGV0IGlkeCA9IGEgKyBOUE9JTlRTICogYlxuICAgIGlmIChpZHg+UlNJWkUpIGlkeCA9IE5QT0lOVFMqKjIgLSBpZHhcblxuICAgIHJldHVybiBpZHggXG4gIH1cblxuICBmdW5jdGlvbiBnZXRyb2FkIChhOiBudW1iZXIsIGI6IG51bWJlcikge1xuICAgIGlmIChhPT1iKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZ2V0IHJvYWQgZnJvbSBhIHBvaW50IHRvIGl0c2VsZlwiKVxuICAgIHJldHVybiByb2Fkc1tyb2FkSURYKGEsYildIVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIsIGRpc3Q6IG51bWJlcikge1xuICAgIGlmIChhPT1iKSB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3Qgc2V0IHJvYWQgZnJvbSBhIHBvaW50IHRvIGl0c2VsZlwiKVxuICAgIHJvYWRzW3JvYWRJRFgoYSxiKV0gPSBkaXN0XG4gIH1cblxuICBsZXQgcmFuZ2UgPSBBcnJheS5mcm9tKHtsZW5ndGg6IE5QT0lOVFN9LCAoXyxpKT0+IGkpXG4gIGxldCBwb2ludHMgOiBQb3NbXSA9IHJhbmdlLm1hcCgoKT0+KHt4OiByYW5kSW50KDAsTUFQU0laRSksIHk6IHJhbmRJbnQoMCxNQVBTSVpFKX0pKVxuICBsZXQgbmVpZ2hzID0gcG9pbnRzLm1hcCgocHMsaSk9PlxuICAgIHBvaW50cy5tYXAoKHAyLCBpMik9PiAgKHtkOiBNYXRoLmZsb29yKE1hdGguaHlwb3QocHMueCAtIHAyLngsIHBzLnkgLSBwMi55KSksIGk6IGkyfSkpXG4gICAgLmZpbHRlcih4ID0+IHguaSAhPSBpKSAuc29ydCgoYSxiKT0+IGEuZCAtIGIuZCkgKVxuXG4gIGZ1bmN0aW9uIGNvbm5lY3QoYTogbnVtYmVyLCBiOiBudW1iZXIsIGRpc3Q6IG51bWJlcil7XG4gICAgaWYgKGEgPT09IGIpIHJldHVyblxuICAgIGlmIChnZXRyb2FkKGEsIGIpICE9PSAwKSByZXR1cm5cbiAgICBzZXRyb2FkKGEsIGIsIGRpc3QpXG4gIH1cblxuICAvLyBCdWlsZCBhIGNvbm5lY3RlZCBiYWNrYm9uZSBieSByZXBlYXRlZGx5IGF0dGFjaGluZyB0aGUgbmVhcmVzdCB1bmNvbm5lY3RlZCBwb2ludC5cbiAgY29uc3QgY29ubmVjdGVkID0gbmV3IFNldDxudW1iZXI+KFswXSlcbiAgd2hpbGUgKGNvbm5lY3RlZC5zaXplIDwgTlBPSU5UUyl7XG4gICAgbGV0IGJlc3RBID0gLTFcbiAgICBsZXQgYmVzdEIgPSAtMVxuICAgIGxldCBiZXN0RCA9IEluZmluaXR5XG5cbiAgICBmb3IgKGNvbnN0IGEgb2YgY29ubmVjdGVkKXtcbiAgICAgIGZvciAoY29uc3QgbmVpIG9mIG5laWdoc1thXSA/PyBbXSl7XG4gICAgICAgIGlmIChjb25uZWN0ZWQuaGFzKG5laS5pKSkgY29udGludWVcbiAgICAgICAgaWYgKG5laS5kIDwgYmVzdEQpe1xuICAgICAgICAgIGJlc3RBID0gYVxuICAgICAgICAgIGJlc3RCID0gbmVpLmlcbiAgICAgICAgICBiZXN0RCA9IG5laS5kXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYmVzdEEgPT09IC0xIHx8IGJlc3RCID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGNvbm5lY3QgcmFuZG9tIG1hcFwiKVxuICAgIGNvbm5lY3QoYmVzdEEsIGJlc3RCLCBiZXN0RClcbiAgICBjb25uZWN0ZWQuYWRkKGJlc3RCKVxuICB9XG5cbiAgLy8gQWRkIGEgZmV3IGV4dHJhIGxvY2FsIHJvYWRzIHNvIHRoZSBtYXAgaXMgbm90IGp1c3QgYSB0cmVlLlxuICBmb3IgKGxldCB4ID0gMDsgeCA8IE5QT0lOVFM7IHgrKyl7XG4gICAgY29uc3QgZXh0cmFFZGdlcyA9IDIgKyByYW5kSW50KDAsIDMpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBleHRyYUVkZ2VzOyBpKyspe1xuICAgICAgY29uc3QgbnggPSBuZWlnaHNbeF0/LltpXVxuICAgICAgaWYgKCFueCkgY29udGludWVcbiAgICAgIGNvbm5lY3QoeCwgbnguaSwgbnguZClcbiAgICB9XG4gIH1cblxuXG5cblxuICBjb25zdCBDb3N0TWF0cml4ID0gbmV3IFVpbnQzMkFycmF5KFJTSVpFKTtcblxuICB7XG4gIFxuICAgIGNvbnN0IHBvaW50Q291bnQgPSBwb2ludHMubGVuZ3RoO1xuICAgIGNvbnN0IElORiA9IDB4ZmZmZjtcbiAgXG4gICAgQ29zdE1hdHJpeC5maWxsKElORik7XG4gIFxuICAgIGZvciAobGV0IHN0YXJ0ID0gMDsgc3RhcnQgPCBwb2ludENvdW50OyBzdGFydCsrKSB7XG4gICAgICBjb25zdCBkaXN0ID0gbmV3IFVpbnQzMkFycmF5KHBvaW50Q291bnQpO1xuICAgICAgY29uc3QgdmlzaXRlZCA9IG5ldyBVaW50OEFycmF5KHBvaW50Q291bnQpO1xuICAgICAgZGlzdC5maWxsKElORik7XG4gICAgICBkaXN0W3N0YXJ0XSA9IDA7XG4gIFxuICAgICAgZm9yIChsZXQgc3RlcCA9IDA7IHN0ZXAgPCBwb2ludENvdW50OyBzdGVwKyspIHtcbiAgICAgICAgbGV0IGN1cnJlbnQgPSAtMTtcbiAgICAgICAgbGV0IGJlc3QgPSBJTkY7XG4gIFxuICAgICAgICBmb3IgKGxldCBub2RlID0gMDsgbm9kZSA8IHBvaW50Q291bnQ7IG5vZGUrKykge1xuICAgICAgICAgIGlmICh2aXNpdGVkW25vZGVdID09PSAwICYmIGRpc3Rbbm9kZV0hIDwgYmVzdCkge1xuICAgICAgICAgICAgYmVzdCA9IGRpc3Rbbm9kZV0hO1xuICAgICAgICAgICAgY3VycmVudCA9IG5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gIFxuICAgICAgICBpZiAoY3VycmVudCA9PT0gLTEpIGJyZWFrO1xuICAgICAgICB2aXNpdGVkW2N1cnJlbnRdID0gMTtcbiAgXG4gICAgICAgIGZvciAobGV0IG5leHQgPSAwOyBuZXh0IDwgcG9pbnRDb3VudDsgbmV4dCsrKSB7XG4gICAgICAgICAgaWYgKG5leHQgPT09IGN1cnJlbnQpIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IHJvYWQgPSBnZXRyb2FkKGN1cnJlbnQsIG5leHQpO1xuICAgICAgICAgIGlmIChyb2FkID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCBuZXh0Q29zdCA9IGRpc3RbY3VycmVudF0hICsgcm9hZDtcbiAgICAgICAgICBpZiAobmV4dENvc3QgPCBkaXN0W25leHRdISkge1xuICAgICAgICAgICAgZGlzdFtuZXh0XSA9IG5leHRDb3N0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICBcbiAgICAgIGZvciAobGV0IGVuZCA9IDA7IGVuZCA8IHBvaW50Q291bnQ7IGVuZCsrKSB7XG4gICAgICAgIGlmIChlbmQgPT09IHN0YXJ0KSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgaWR4ID0gcm9hZElEWChzdGFydCwgZW5kKTtcbiAgICAgICAgQ29zdE1hdHJpeFtpZHhdID0gTWF0aC5taW4oZGlzdFtlbmRdISwgSU5GKTtcbiAgICAgIH1cbiAgICB9XG4gIFxuICB9XG5cblxuXG4gIGZ1bmN0aW9uIGZpbmRQYXRoKHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTpudW1iZXJbXSB7XG5cbiAgICBsZXQgcGF0aCA6IG51bWJlcltdID0gW3N0YXJ0XVxuICAgIGxldCBjb3N0ID0gQ29zdE1hdHJpeFtyb2FkSURYKHN0YXJ0LGVuZCldXG4gICAgd2hpbGUgKHN0YXJ0ICE9IGVuZCl7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgICAgIGlmICh4ID09IHN0YXJ0KSBjb250aW51ZVxuICAgICAgICBsZXQgcm9hZCA9IGdldHJvYWQoc3RhcnQseClcbiAgICAgICAgaWYgKHJvYWQgPT0gMCkgY29udGludWVcbiAgICAgICAgbGV0IHJlc3Rjb3N0ID0gQ29zdE1hdHJpeFtyb2FkSURYKHgsZW5kKV0hXG4gICAgICAgIGlmIChyb2FkKyByZXN0Y29zdCA9PSBjb3N0KXtcbiAgICAgICAgICBjb3N0ID0gcmVzdGNvc3RcbiAgICAgICAgICBzdGFydCA9IHhcbiAgICAgICAgICBwYXRoLnB1c2goeClcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXRoXG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGdldENvc3ROKC4uLnBvaW50czogbnVtYmVyW10pOiBudW1iZXIge1xuICBcbiAgICBsZXQgY29zdCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICBjb3N0ICs9IENvc3RNYXRyaXhbcm9hZElEWChwb2ludHNbaV0hLCBwb2ludHNbaSArIDFdISldITtcbiAgICB9XG4gICAgcmV0dXJuIGNvc3Q7XG4gIH1cblxuXG4gIHJldHVybiB7IGdldHJvYWQsIHJvYWRJRFgsIHBvaW50cywgcmFuZ2UsIENvc3RNYXRyaXgsIGZpbmRQYXRoLCBnZXRDb3N0Tn1cbn1cblxuXG5leHBvcnQgdHlwZSBSb2FkTWFwID0gdHlwZW9mIHJhbmRvbU1hcCBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAidHlwZSBKc29uVmFsdWUgPVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCBudWxsXG4gIHwgeyBba2V5OiBzdHJpbmddOiBKc29uVmFsdWUgfVxuICB8IEpzb25WYWx1ZVtdXG5cbnR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cblxuY29uc3QgdHlwZU5hbWUgPSAodmFsdWU6IHVua25vd24pOiBzdHJpbmcgPT4ge1xuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBcIm51bGxcIlxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiBcImFycmF5XCJcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZVxufVxuXG5jb25zdCBwYXRoTGFiZWwgPSAocGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHBhdGggfHwgXCIkXCJcblxuY29uc3QgZmFpbCA9IChwYXRoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyID0+IHtcbiAgdGhyb3cgbmV3IEVycm9yKGBWYWxpZGF0aW9uIGVycm9yIGF0ICR7cGF0aExhYmVsKHBhdGgpfTogJHttZXNzYWdlfWApXG59XG5cbmNvbnN0IGlzUGxhaW5PYmplY3QgPSAodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9PlxuICB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpXG5cbmNvbnN0IGRlZXBFcXVhbCA9IChsZWZ0OiB1bmtub3duLCByaWdodDogdW5rbm93bik6IGJvb2xlYW4gPT4ge1xuICBpZiAoT2JqZWN0LmlzKGxlZnQsIHJpZ2h0KSkgcmV0dXJuIHRydWVcbiAgaWYgKEFycmF5LmlzQXJyYXkobGVmdCkgJiYgQXJyYXkuaXNBcnJheShyaWdodCkpIHtcbiAgICByZXR1cm4gbGVmdC5sZW5ndGggPT09IHJpZ2h0Lmxlbmd0aCAmJiBsZWZ0LmV2ZXJ5KCh2YWx1ZSwgaW5kZXgpID0+IGRlZXBFcXVhbCh2YWx1ZSwgcmlnaHRbaW5kZXhdKSlcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdChsZWZ0KSAmJiBpc1BsYWluT2JqZWN0KHJpZ2h0KSkge1xuICAgIGNvbnN0IGxlZnRLZXlzID0gT2JqZWN0LmtleXMobGVmdClcbiAgICBjb25zdCByaWdodEtleXMgPSBPYmplY3Qua2V5cyhyaWdodClcbiAgICByZXR1cm4gbGVmdEtleXMubGVuZ3RoID09PSByaWdodEtleXMubGVuZ3RoXG4gICAgICAmJiBsZWZ0S2V5cy5ldmVyeShrZXkgPT4ga2V5IGluIHJpZ2h0ICYmIGRlZXBFcXVhbChsZWZ0W2tleV0sIHJpZ2h0W2tleV0pKVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5jb25zdCBhcHBlbmRQYXRoID0gKHBhdGg6IHN0cmluZywgcGFydDogc3RyaW5nKTogc3RyaW5nID0+XG4gIHBhdGggPyBgJHtwYXRofSR7cGFydH1gIDogYCQke3BhcnR9YFxuXG5jb25zdCB2YWxpZGF0ZU9iamVjdCA9IChzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgb2JqZWN0LCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgY29uc3Qgb2JqZWN0VmFsdWUgPSB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuXG4gIGNvbnN0IHByb3BlcnRpZXMgPSBpc1BsYWluT2JqZWN0KHNjaGVtYS5wcm9wZXJ0aWVzKSA/IHNjaGVtYS5wcm9wZXJ0aWVzIDoge31cbiAgY29uc3QgcmVxdWlyZWQgPSBBcnJheS5pc0FycmF5KHNjaGVtYS5yZXF1aXJlZCkgPyBzY2hlbWEucmVxdWlyZWQgOiBbXVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIHJlcXVpcmVkKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgIT09IFwic3RyaW5nXCIpIGNvbnRpbnVlXG4gICAgaWYgKCEoa2V5IGluIG9iamVjdFZhbHVlKSkgZmFpbChhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCksIFwiaXMgcmVxdWlyZWRcIilcbiAgfVxuXG4gIGZvciAoY29uc3QgW2tleSwgcHJvcGVydHlTY2hlbWFdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BlcnRpZXMpKSB7XG4gICAgaWYgKCEoa2V5IGluIG9iamVjdFZhbHVlKSkgY29udGludWVcbiAgICBpZiAoIWlzUGxhaW5PYmplY3QocHJvcGVydHlTY2hlbWEpKSBjb250aW51ZVxuICAgIHZhbGlkYXRlSnNvblNjaGVtYShwcm9wZXJ0eVNjaGVtYSBhcyBKU09OU2NoZW1hLCBvYmplY3RWYWx1ZVtrZXldLCBhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCkpXG4gIH1cblxuICBjb25zdCBleHRyYUtleXMgPSBPYmplY3Qua2V5cyhvYmplY3RWYWx1ZSkuZmlsdGVyKGtleSA9PiAhKGtleSBpbiBwcm9wZXJ0aWVzKSlcbiAgY29uc3QgYWRkaXRpb25hbCA9IHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllc1xuICBpZiAoYWRkaXRpb25hbCA9PT0gZmFsc2UpIHtcbiAgICBpZiAoZXh0cmFLZXlzLmxlbmd0aCA+IDApIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7ZXh0cmFLZXlzWzBdfWApLCBcImFkZGl0aW9uYWwgcHJvcGVydGllcyBhcmUgbm90IGFsbG93ZWRcIilcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmIChpc1BsYWluT2JqZWN0KGFkZGl0aW9uYWwpKSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgZXh0cmFLZXlzKSB7XG4gICAgICB2YWxpZGF0ZUpzb25TY2hlbWEoYWRkaXRpb25hbCBhcyBKU09OU2NoZW1hLCBvYmplY3RWYWx1ZVtrZXldLCBhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCkpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IHZhbGlkYXRlQXJyYXkgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIGFycmF5LCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgY29uc3QgYXJyYXlWYWx1ZSA9IHZhbHVlIGFzIHVua25vd25bXVxuICBpZiAoIWlzUGxhaW5PYmplY3Qoc2NoZW1hLml0ZW1zKSkgcmV0dXJuXG4gIGFycmF5VmFsdWUuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHZhbGlkYXRlSnNvblNjaGVtYShzY2hlbWEuaXRlbXMgYXMgSlNPTlNjaGVtYSwgaXRlbSwgYXBwZW5kUGF0aChwYXRoLCBgWyR7aW5kZXh9XWApKSlcbn1cblxuY29uc3QgdmFsaWRhdGVCeVR5cGUgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIHN3aXRjaCAoc2NoZW1hLnR5cGUpIHtcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBzdHJpbmcsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIiB8fCBOdW1iZXIuaXNOYU4odmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudW1iZXIsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwiYm9vbGVhblwiKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBib29sZWFuLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudWxsXCI6XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG51bGwsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImFycmF5XCI6XG4gICAgICB2YWxpZGF0ZUFycmF5KHNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICB2YWxpZGF0ZU9iamVjdChzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICByZXR1cm5cbiAgICBkZWZhdWx0OlxuICAgICAgZmFpbChwYXRoLCBgdW5zdXBwb3J0ZWQgc2NoZW1hIHR5cGUgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEudHlwZSl9YClcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGVKc29uU2NoZW1hID0gPFQ+KHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGggPSBcIlwiKTogVCA9PiB7XG4gIGlmIChcImNvbnN0XCIgaW4gc2NoZW1hICYmICFkZWVwRXF1YWwodmFsdWUsIHNjaGVtYS5jb25zdCkpIHtcbiAgICBmYWlsKHBhdGgsIGBleHBlY3RlZCBjb25zdGFudCAke0pTT04uc3RyaW5naWZ5KHNjaGVtYS5jb25zdCl9YClcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW11cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzY2hlbWEuYW55T2YpIHtcbiAgICAgIGlmICghaXNQbGFpbk9iamVjdChvcHRpb24pKSBjb250aW51ZVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICAgIGZhaWwocGF0aCwgZXJyb3JzWzBdID8/IFwiZGlkIG5vdCBtYXRjaCBhbnkgYWxsb3dlZCBzY2hlbWFcIilcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbGxPZikpIHtcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzY2hlbWEuYWxsT2YpIHtcbiAgICAgIGlmICghaXNQbGFpbk9iamVjdChvcHRpb24pKSBjb250aW51ZVxuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKG9wdGlvbiBhcyBKU09OU2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICB9XG4gIH1cblxuICB2YWxpZGF0ZUJ5VHlwZShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICByZXR1cm4gdmFsdWUgYXMgVFxufVxuIiwKICAgICJpbXBvcnQgeyB2YWxpZGF0ZUpzb25TY2hlbWEgfSBmcm9tIFwiLi9qc29uc2NoZW1hXCJcblxuXG5leHBvcnQgdHlwZSBKU09OU2NoZW1hID0geyBba2V5OiBzdHJpbmddOiBKc29uRGF0YSB9XG5cblxuZXhwb3J0IHR5cGUgSnNvbkRhdGEgPSBzdHJpbmcgfCBudWxsIHwgbnVtYmVyIHwgYm9vbGVhbiB8IHsgW2tleSBpbiBzdHJpbmddOiBKc29uRGF0YSB9IHwgSnNvbkRhdGFbXVxuXG5leHBvcnQgdHlwZSBTY2hlbWE8VD4gPSB7IGpzb246IEpTT05TY2hlbWEgfVxuXG5leHBvcnQgdHlwZSBJbmZlcjxTPiA9IFMgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVD4gPyBUIDogbmV2ZXJcblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlID0gPFQ+IChzY2hlbWE6IFNjaGVtYTxUPiwgZGF0YTp1bmtub3duKSA6IFQgPT4ge1xuICByZXR1cm4gdmFsaWRhdGVKc29uU2NoZW1hPFQ+KHNjaGVtYS5qc29uLCBkYXRhKVxufVxuXG5leHBvcnQgY29uc3Qgc3RyaW5naWZ5ID0gKGRhdGE6IEpzb25EYXRhKTogc3RyaW5nID0+IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpXG5cblxuZXhwb3J0IGNvbnN0IGZpbGxTY2hlbWEgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogVCA9PntcbiAgbGV0IGpzb24gPSBzY2hlbWEuanNvblxuICBpZiAoanNvbi50eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBcIlwiIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm51bWJlclwiKSByZXR1cm4gMCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBmYWxzZSBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudWxsXCIpIHJldHVybiBudWxsIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcImFycmF5XCIpIHJldHVybiBbXSBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBqc29uLnByb3BlcnRpZXMpe1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge31cbiAgICBsZXQgcmVxdWlyZWQgPSBBcnJheS5pc0FycmF5KGpzb24ucmVxdWlyZWQpID8ganNvbi5yZXF1aXJlZCBhcyBzdHJpbmdbXSA6IFtdXG4gICAgZm9yIChsZXQgcmVxIG9mIHJlcXVpcmVkKVxuICAgICAgcmVzdWx0W3JlcV0gPSBmaWxsU2NoZW1hKHtqc29uOiAoanNvbi5wcm9wZXJ0aWVzIGFzIGFueSlbcmVxXX0pXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGlmIChcImNvbnN0XCIgaW4ganNvbikgcmV0dXJuIGpzb24uY29uc3QgYXMgVFxuICBpZiAoXCJhbnlPZlwiIGluIGpzb24gJiYgQXJyYXkuaXNBcnJheShqc29uLmFueU9mKSkgcmV0dXJuIGZpbGxTY2hlbWEoe2pzb246IGpzb24uYW55T2ZbMF0gYXMgSlNPTlNjaGVtYX0pIGFzIFRcbiAgcmV0dXJuIG51bGwgYXMgVFxufVxuXG5leHBvcnQgY29uc3QgZnJvbUpzb25TY2hlbWEgPSA8VD4gKGpzb246IEpTT05TY2hlbWEpOiBTY2hlbWE8VD4gPT4gKHtqc29ufSlcblxuZXhwb3J0IGNvbnN0IHN0cmluZzogU2NoZW1hPHN0cmluZz4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJzdHJpbmdcIn0pXG5leHBvcnQgY29uc3QgbnVtYmVyOiBTY2hlbWE8bnVtYmVyPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm51bWJlclwifSlcbmV4cG9ydCBjb25zdCBib29sZWFuOiBTY2hlbWE8Ym9vbGVhbj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJib29sZWFuXCJ9KVxuZXhwb3J0IGNvbnN0IG51bGxTY2hlbWEgOiBTY2hlbWE8bnVsbD4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudWxsXCJ9KVxuZXhwb3J0IGNvbnN0IGFueTogU2NoZW1hPGFueT4gPSBmcm9tSnNvblNjaGVtYSh7fSlcbmV4cG9ydCBjb25zdCBvcHRpb25hbCA9IDxUPihzY2hlbWE6IFNjaGVtYTxUPikgOiBTY2hlbWE8VCB8IG51bGw+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogW3t0eXBlOiBcIm51bGxcIn0sIHNjaGVtYS5qc29uXX0pXG5leHBvcnQgY29uc3QgYXJyYXkgPSA8VD4oaXRlbVNjaGVtYTogU2NoZW1hPFQ+KTogU2NoZW1hPFRbXT4gPT4gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYXJyYXlcIiwgaXRlbXM6IGl0ZW1TY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3QgY29uc3RhbnQgPSA8VCBleHRlbmRzIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+KHZhbHVlOiBUKTogU2NoZW1hPFQ+ID0+IGZyb21Kc29uU2NoZW1hKHtjb25zdDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3Qgb2JqZWN0ID0gPFMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBTY2hlbWE8YW55Pj4+IChzaGFwZTogUyk6IFNjaGVtYTx7W0sgaW4ga2V5b2YgU106IEluZmVyPFNbS10+fT4gPT4gZnJvbUpzb25TY2hlbWEoe1xuICB0eXBlOiBcIm9iamVjdFwiLFxuICBwcm9wZXJ0aWVzOiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMoc2hhcGUpLm1hcCgoW2tleSwgZmllbGRdKT0+IFtrZXksIGZpZWxkLmpzb25dKSksXG4gIHJlcXVpcmVkOiBPYmplY3Qua2V5cyhzaGFwZSlcbn0pXG5cbmV4cG9ydCBjb25zdCByZWNvcmQgPSA8VD4odmFsdWVTY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxSZWNvcmQ8c3RyaW5nLCBUPj4gPT4gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwib2JqZWN0XCIsIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB2YWx1ZVNjaGVtYS5qc29ufSlcbmV4cG9ydCBjb25zdCBzY2hlbWFTY2hlbWEgOiBTY2hlbWE8SlNPTlNjaGVtYT4gPSByZWNvcmQoYW55KVxuXG5leHBvcnQgY29uc3QgdW5pb24gPSA8UyBleHRlbmRzIFNjaGVtYTxhbnk+W10+KC4uLnNjaGVtYXM6IFMpOiBTY2hlbWE8SW5mZXI8U1tudW1iZXJdPj4gPT4gZnJvbUpzb25TY2hlbWEoe2FueU9mOiBzY2hlbWFzLm1hcChzPT4gcy5qc29uKX0pXG5cbmV4cG9ydCBmdW5jdGlvbiB0YWdnZWQgPFMgZXh0ZW5kcyB7W2tleSA6IHN0cmluZ106IFNjaGVtYTxhbnk+fT4gKGZpZWxkczogUykgOiBTY2hlbWE8e1trZXkgaW4ga2V5b2YgU106IHskOiBrZXksIHZhbDpJbmZlcjxTW2tleV0+fSB9W2tleW9mIFNdPiB7XG4gIHJldHVybiB1bmlvbiguLi5PYmplY3QuZW50cmllcyhmaWVsZHMpLm1hcCgoWyQsdmFsXSk9Pm9iamVjdCh7JDpjb25zdGFudCgkKSx2YWx9KSkpXG59XG5cblxuXG5cbmV4cG9ydCBjb25zdCBpbnRlcnNlY3Rpb24gPSA8UyBleHRlbmRzIFNjaGVtYTxhbnk+W10+KC4uLnNjaGVtYXM6IFMpOiBTY2hlbWE8SW5mZXI8U1tudW1iZXJdPj4gPT4gZnJvbUpzb25TY2hlbWEoe2FsbE9mOiBzY2hlbWFzLm1hcChzPT4gcy5qc29uKX0pXG5cbmV4cG9ydCBjb25zdCBhc1R5cGVWaWV3ID0gKHNjaGVtYTogU2NoZW1hPGFueT4pOiBzdHJpbmcgPT4ge1xuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJzdHJpbmdcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bWJlclwiKSByZXR1cm4gXCJudW1iZXJcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcImJvb2xlYW5cIikgcmV0dXJuIFwiYm9vbGVhblwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJhcnJheVwiICYmIHNjaGVtYS5qc29uLml0ZW1zKSByZXR1cm4gYCR7YXNUeXBlVmlldyh7anNvbjogc2NoZW1hLmpzb24uaXRlbXMgYXMgSlNPTlNjaGVtYX0pfVtdYFxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm9iamVjdFwiICYmIHNjaGVtYS5qc29uLnByb3BlcnRpZXMpe1xuICAgIGxldCBwcm9wcyA9IE9iamVjdC5lbnRyaWVzKHNjaGVtYS5qc29uLnByb3BlcnRpZXMpLm1hcCgoW2tleSwgcHJvcF0pPT4gYCR7a2V5fTogJHthc1R5cGVWaWV3KHtqc29uOiBwcm9wIGFzIEpTT05TY2hlbWF9KX1gKVxuICAgIHJldHVybiBge1xcbiAgJHtwcm9wcy5qb2luKFwiLFxcblwiKS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiXFxuICBcIil9XFxufWBcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYS5qc29uKSByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc2NoZW1hLmpzb24uY29uc3QpXG4gIGlmIChcImFueU9mXCIgaW4gc2NoZW1hLmpzb24gJiYgQXJyYXkuaXNBcnJheShzY2hlbWEuanNvbi5hbnlPZikpIHJldHVybiBzY2hlbWEuanNvbi5hbnlPZi5tYXAocz0+IGFzVHlwZVZpZXcoe2pzb246IHMgYXMgSlNPTlNjaGVtYX0pKS5qb2luKFwiIHwgXCIpXG4gIHJldHVybiBcImFueVwiXG59XG5cblxuIiwKICAgICJpbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgYXJyYXksIGJvb2xlYW4sIGNvbnN0YW50LCBudW1iZXIsIG9iamVjdCwgc3RyaW5nLCB0YWdnZWQsIHVuaW9uLCB0eXBlIEluZmVyLCB0eXBlIFNjaGVtYSB9IGZyb20gXCIuL3NjaGVtYVwiO1xuXG5leHBvcnQgdHlwZSBVVUlEID0gYHUke3N0cmluZ30tJHtzdHJpbmd9YFxuZXhwb3J0IGNvbnN0IFVVSUQgOiBTY2hlbWE8VVVJRD4gPSBzdHJpbmdcblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbVVVSUQoKSB7cmV0dXJuIFwidVwiICsgcmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIsMTApICsgXCItXCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgYXMgVVVJRH1cblxuXG5leHBvcnQgY29uc3QgUmVxdWVzdCA9IG9iamVjdCh7XG4gIGlkOiBVVUlELFxuICBzdGFydFBvaW50OiBudW1iZXIsXG4gIGVuZFBvaW50OiBudW1iZXIsXG4gIHZhbHVlX2V1cjogbnVtYmVyLFxuICBkZWFkbGluZV9oOiBudW1iZXIsXG59KVxuXG5leHBvcnQgY29uc3QgVHJhbnNwb3J0ZXIgPSBvYmplY3QoeyBpZDogVVVJRCwgcG9zaXRpb246IFVVSUQsIH0pXG5cbmV4cG9ydCBjb25zdCBTY2hlZHVsZVN0ZXAgPSB0YWdnZWQoe1xuICBwaWNrdXA6IG9iamVjdCh7cmVxdWVzdDogVVVJRCwgcG9zOiBudW1iZXIsIGRlY2s6IHVuaW9uKGNvbnN0YW50KDApLCBjb25zdGFudCgxKSl9KSxcbiAgZGVsaXZlcjogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlcn0pLFxuICBzdGFydDogb2JqZWN0KHtwb3M6IG51bWJlcn0pLFxufSlcbmV4cG9ydCBjb25zdCBTY2hlZHVsZUl0ZW0gPSBvYmplY3Qoe1xuICB0cmFuc3BvcnRlcjogVVVJRCxcbiAgc3RlcHM6IGFycmF5KFNjaGVkdWxlU3RlcCksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlID0gYXJyYXkoU2NoZWR1bGVJdGVtKVxuXG5cbmV4cG9ydCB0eXBlIFJlcXVlc3QgPSBJbmZlcjx0eXBlb2YgUmVxdWVzdD5cbmV4cG9ydCB0eXBlIFRyYW5zcG9ydGVyID0gSW5mZXI8dHlwZW9mIFRyYW5zcG9ydGVyPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVTdGVwID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlU3RlcD5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlSXRlbSA9IEluZmVyPHR5cGVvZiBTY2hlZHVsZUl0ZW0+XG5leHBvcnQgdHlwZSBTY2hlZHVsZSA9IEluZmVyPHR5cGVvZiBTY2hlZHVsZT5cblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tTW9kdWxlIChcbiAgTlJFUVMgPSAyMDAsXG4gIE5UUkFOUyA9IDQwLFxuICBOUE9JTlRTID0gMTAwLFxuICBNQVBTSVpFID0gNDAwLFxuICBzZWVkID0gMjIsXG4pe1xuXG4gIGNvbnN0IHJvYWRtYXAgPSByYW5kb21NYXAoTlBPSU5UUywgTUFQU0laRSlcblxuICByZXR1cm4ge1xuICAgIE5UUkFOUyxcbiAgICBOUkVRUyxcbiAgICBNQVBTSVpFLFxuICAgIFJTSVpFOiBOUE9JTlRTICogTlBPSU5UUyAvIDIsXG4gICAgcm9hZG1hcCxcbiAgICByZXF1ZXN0czogQXJyYXkuZnJvbSh7bGVuZ3RoOk5SRVFTfSwgKF8saSk9PiAoe1xuICAgICAgaWQ6IHJhbmRvbVVVSUQoKSxcbiAgICAgIGRlYWRsaW5lX2g6ICgxK3JhbmRvbSgpKSAqIDQwLFxuICAgICAgc3RhcnRQb2ludDogcmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIsXG4gICAgICBlbmRQb2ludDogcmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIsXG4gICAgICB2YWx1ZV9ldXI6IHJhbmRJbnQoMTAwLCA0MDApLFxuICAgIH0pIGFzIFJlcXVlc3QpLFxuICAgIHN0YXJ0cG9zaXRpb25zOiBBcnJheS5mcm9tKHtsZW5ndGg6TlRSQU5TfSwgKF8saSk9PnJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSkgYXMgbnVtYmVyKSxcbiAgfVxufVxuXG5cbmV4cG9ydCB0eXBlIE1vZHVsZSA9IHR5cGVvZiByYW5kb21Nb2R1bGUgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgImltcG9ydCB7IHZhbGlkYXRlLCB0eXBlIEpzb25EYXRhLCB0eXBlIFNjaGVtYSB9IGZyb20gXCIuL3NjaGVtYVwiXG5cblxuXG5leHBvcnQgZnVuY3Rpb24gbWtXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ICh2YWx1ZTogVCkge1xuXG4gIGxldCBsaXN0ZW5lcnM6ICgobmV3VmFsdWU6IFQsIG9sZFZhbHVlOiBUKT0+dm9pZClbXSA9IFtdXG4gIGxldCByZXAgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcblxuICBsZXQgcmVzID0ge1xuICAgIGdldDogKCkgPT4gdmFsdWUsXG4gICAgc2V0OiAobmV3VmFsdWU6IFQpID0+IHtcbiAgICAgIGxldCBuZXdSZXAgPSBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSlcbiAgICAgIGlmIChuZXdSZXAgPT09IHJlcCkgcmV0dXJuXG4gICAgICByZXAgPSBuZXdSZXBcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIobmV3VmFsdWUsIHZhbHVlKSlcbiAgICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICB9LFxuICAgIG9udXBkYXRlOiAobGlzdGVuZXI6IChuZXdWYWx1ZTogVCwgb2xkVmFsdWUgOlQpPT52b2lkLCBkZWZlcnJlZCA9IGZhbHNlKSA9PiB7XG4gICAgICBpZiAoIWRlZmVycmVkKSBsaXN0ZW5lcih2YWx1ZSwgdmFsdWUpXG4gICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcilcbiAgICB9LFxuICAgIHVwZGF0ZTogKGNhbGxiYWNrOiAob2xkVmFsdWU6IFQpPT5UIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgICBsZXQgbmV3VmFsdWUgPSBjYWxsYmFjayh2YWx1ZSkgPz8gdmFsdWVcbiAgICAgIHJlcy5zZXQobmV3VmFsdWUpXG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gcmVzXG5cbn1cblxuZXhwb3J0IHR5cGUgV3JpdGFibGU8VCBleHRlbmRzIEpzb25EYXRhPiA9IFJldHVyblR5cGU8dHlwZW9mIG1rV3JpdGFibGU8VD4+XG5cbmV4cG9ydCBmdW5jdGlvbiBta1N0b3JlZCA8VCBleHRlbmRzIEpzb25EYXRhPiAoa2V5OiBzdHJpbmcsIHNjaGVtYTogU2NoZW1hPFQ+LCBkZWZhdWx0VmFsdWU6IFQpIHtcbiAgbGV0IHZhbCA9IGRlZmF1bHRWYWx1ZVxuICB0cnl7XG4gICAgdmFsID0gdmFsaWRhdGUoc2NoZW1hLCBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkhKSlcbiAgfWNhdGNoe31cblxuICBsZXQgcmVzID0gbWtXcml0YWJsZTxUPih2YWwpXG4gIFxuICByZXMub251cGRhdGUoKG5ld1ZhbHVlKT0+e1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkobmV3VmFsdWUpKVxuICB9KVxuXG4gIHJldHVybiByZXNcbn1cblxuIiwKICAgICJcblxuaW1wb3J0IHsgcmFuZEludCwgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbVwiXG5pbXBvcnQgeyBib3JkZXJSYWRpdXMsIGNvbG9yLCBkaXNwbGF5LCBkaXYsIGgyLCBoMywgcCwgcGFkZGluZywgcG9wdXAsIHByZSwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdGgsIHRyIH0gZnJvbSBcIi4uL3ZpZXcvaHRtbFwiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuLi92aWV3L21haW5cIlxuXG5cbmZ1bmN0aW9uIGlzbG9hZCh4Om51bWJlcil7XG4gIHJldHVybiB4ICYgMVxufVxuXG5mdW5jdGlvbiBnZXREZWNrKHg6bnVtYmVyKXtcbiAgcmV0dXJuICh4ICYgMikgPj4gMVxufVxuXG5mdW5jdGlvbiBnZXRSZXEoeDpudW1iZXIpe1xuICByZXR1cm4gKHggJiAweEZGRkYpID4+IDJcbn1cblxuZnVuY3Rpb24gZ2V0UG9zKHg6bnVtYmVyKXtcbiAgcmV0dXJuIHg+PjE2XG59XG5cblxuXG5jb25zdCBLTV9DT1NUID0gLjVcbmNvbnN0IEFWR19TUEVFRF9LTUggPSA2MFxuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDBcblxuZXhwb3J0IGZ1bmN0aW9uIHNpbXBsZUFubmVhbGluZyhtb2Q6IE1vZHVsZSl7XG5cbiAgY29uc3Qge05SRVFTLCByZXF1ZXN0cywgc3RhcnRwb3NpdGlvbnMsIE5UUkFOUywgcm9hZG1hcH0gPSBtb2RcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKE5SRVFTICogMi41ICsgMTApXG5cbiAgY29uc3QgcmVxUGlja3VwTG9jYXRpb25zICAgPSBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKHI9PnIuc3RhcnRQb2ludCkpXG4gIGNvbnN0IHJlcURlbGl2ZXJ5TG9jYXRpb25zID0gbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcChyPT5yLmVuZFBvaW50KSlcbiAgY29uc3QgcmVxRGVhZGxpbmVzID0gICAgICAgICBuZXcgVWludDMyQXJyYXkocmVxdWVzdHMubWFwKHI9PnIuZGVhZGxpbmVfaCAqIEFWR19TUEVFRF9LTUgpKSAvLyBkZWFkbGluZSBpbiBrbVxuICBjb25zdCByZXFWYWx1ZXMgPSAgICAgICAgICAgIG5ldyBVaW50MzJBcnJheShyZXF1ZXN0cy5tYXAocj0+ci52YWx1ZV9ldXIvIEtNX0NPU1QpKSAvLyB2YWx1ZSBpbiBrbVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShyZXF1ZXN0cy5tYXAocj0+MSkpXG5cbiAgY29uc3QgdHJhblN0YXJ0ID0gbmV3IFVpbnQxNkFycmF5KHN0YXJ0cG9zaXRpb25zKVxuICBjb25zdCBzY2hlZHVsZSA9IG5ldyBVaW50MzJBcnJheShUU0laRSAqIE5UUkFOUylcbiAgY29uc3Qgc2NoZWR1bGVTaXplcyA9IG5ldyBVaW50MTZBcnJheShOVFJBTlMpXG5cblxuICBsZXQgSU5GID0gMTw8MTVcblxuICBmdW5jdGlvbiBzY29yZSh0cmFuOm51bWJlcil7XG4gICAgbGV0IHJld2FyZCA9IDBcbiAgICBsZXQgZHVyYXRpb24gPSAwXG4gICAgbGV0IGRlY2tzOiBbbnVtYmVyW10sIG51bWJlcltdXSA9IFtbXSwgW11dXG4gICAgbGV0IHBvcyA9IHRyYW5TdGFydFt0cmFuXSFcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaGVkdWxlU2l6ZXNbdHJhbl0hOyBpKyspe1xuICAgICAgbGV0IHN0ZXAgPSBzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSFcbiAgICAgIGNvbnN0IGxvYWQgPSBpc2xvYWQoc3RlcClcbiAgICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKVxuICAgICAgY29uc3QgbmV4dHBvcyA9IGdldFBvcyhzdGVwKVxuICAgICAgZHVyYXRpb24gKz0gcm9hZG1hcC5nZXRDb3N0Tihwb3MsIG5leHRwb3MpXG4gICAgICBwb3MgPSBuZXh0cG9zXG4gICAgICBpZiAobG9hZCl7XG4gICAgICAgIGxldCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hXG4gICAgICAgIGRlY2sucHVzaChyZXEpXG4gICAgICAgIGlmIChkZWNrLmxlbmd0aCA+IDMpIHJldHVybiAtSU5GXG4gICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGRlY2sgPSBkZWNrc1tnZXREZWNrKHN0ZXApXSFcbiAgICAgICAgbGV0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpXG4gICAgICAgIGlmIChpZHggPT0gLTEpIHRocm93IG5ldyBFcnJvcihcImNhciBub3QgZm91bmRcIilcbiAgICAgICAgZHVyYXRpb24gKz0gKGRlY2subGVuZ3RoLWlkeC0xKSAqIFJFT1JHX0NPU1RfRVVSIC8gS01fQ09TVFxuICAgICAgICBkZWNrLnNwbGljZShpZHgsIDEpXG5cbiAgICAgICAgaWYgKGR1cmF0aW9uIDw9IHJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHJlcVZhbHVlc1tyZXFdIVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXdhcmQgLSBkdXJhdGlvblxuICB9XG5cbiAgY29uc3Qgc2NoZWR1bGVSYXRpbmdzID0gSW50MzJBcnJheS5mcm9tKHtsZW5ndGg6IE5UUkFOU30sIChfLCBpKT0+c2NvcmUoaSkpXG5cbiAgZnVuY3Rpb24gc2V0UmVxKHRyYW46IG51bWJlciwgaWR4OiBudW1iZXIsIGlzbG9hZDogMXwwLCBkZWNrOiAxfDAsIHJlcTogbnVtYmVyLCBwb3M6bnVtYmVyKXtcbiAgICBzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpZHhdID0gKGlzbG9hZCA8PCAwKSB8IChkZWNrIDw8IDEpIHwgKHJlcSA8PCAyKSB8IChwb3MgPDwgMTYpXG4gIH1cblxuICBmdW5jdGlvbiBpbnNlcnRTdG9wcyh0cmFuOm51bWJlciwgc3RhcnQ6bnVtYmVyLCBlbmQ6IG51bWJlciwgZGVjazogMHwxLCByZXE6bnVtYmVyKXtcblxuICAgIGNvbnN0IG9mZnNldCA9IHRyYW4gKiBUU0laRVxuICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dIVxuICAgIHNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMlxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kICsgMiwgb2Zmc2V0ICsgZW5kLCBvZmZzZXQgKyBzaXplKVxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgZW5kICsgMSlcbiAgICBzZXRSZXEodHJhbiwgc3RhcnQsIDEsIGRlY2ssIHJlcSwgcmVxUGlja3VwTG9jYXRpb25zW3JlcV0hKVxuICAgIHNldFJlcSh0cmFuLCBlbmQgKyAxLCAwLCBkZWNrLCByZXEsIHJlcURlbGl2ZXJ5TG9jYXRpb25zW3JlcV0hKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlU3RvcHModHJhbjpudW1iZXIsIHN0YXJ0Om51bWJlciwgZW5kOiBudW1iZXIpe1xuICAgIGNvbnN0IG9mZnNldCA9IHRyYW4gKiBUU0laRVxuICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dIVxuICAgIHNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMlxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgZW5kKVxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kIC0gMSwgb2Zmc2V0ICsgZW5kICsgMSwgb2Zmc2V0ICsgc2l6ZSlcbiAgfVxuXG4gIGxldCBzdGFydF90ZW1wID0gMTAwXG4gIGxldCB0ZW1wID0gc3RhcnRfdGVtcFxuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2X3JhdGluZzpudW1iZXIsIG5leHRfcmF0aW5nOiBudW1iZXIpe1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0X3JhdGluZy1wcmV2X3JhdGluZykgLyB0ZW1wKVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCl7XG4gICAgbGV0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUylcbiAgICBsZXQgc2NoZWRzaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSFcblxuICAgIGxldCBhID0gcmFuZEludCgwLHNjaGVkc2l6ZSsxKVxuICAgIGxldCBiID0gTWF0aC5taW4oc2NoZWRzaXplLCByYW5kSW50KDAsNCkgKyBhKVxuXG4gICAgbGV0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpXG4gICAgaWYgKCF1bmFzc2lnbmVkW3JlcV0pIHJldHVyblxuICBcbiAgICBpbnNlcnRTdG9wcyh0cmFuLCBhLCBiLCByYW5kb20oKSA+IC41ID8gMSA6IDAgLCByZXEpXG4gICAgbGV0IG5ld3JhdGluZyA9IHNjb3JlKHRyYW4pXG4gICAgaWYgKGFjY2VwdChzY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBuZXdyYXRpbmcpKXtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9bmV3cmF0aW5nXG4gICAgICB1bmFzc2lnbmVkW3JlcV0gPSAwXG4gICAgfWVsc2V7XG4gICAgICByZW1vdmVTdG9wcyh0cmFuLCBhLCBiKzEpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKXtcbiAgICBsZXQgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKVxuICAgIGxldCBzY2hlZHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dIVxuICAgIGlmIChzY2hlZHNpemUgPCAyKSByZXR1cm5cbiAgICBsZXQgaWR4ID0gcmFuZEludCgwLCBzY2hlZHNpemUpXG4gICAgbGV0IGl0ZW0gPSBzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpZHhdIVxuICAgIGxldCByZXEgPSBnZXRSZXEoaXRlbSlcblxuICAgIGxldCBhYiA6bnVtYmVyW10gPSBbXVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZHNpemU7IGkrKyl7XG4gICAgICBpZiAoZ2V0UmVxKHNjaGVkdWxlW3RyYW4gKiBUU0laRSArIGldISkgPT0gcmVxKSBhYi5wdXNoKGkpXG4gICAgfVxuXG4gICAgbGV0IFthLGJdID0gYWIgYXMgW251bWJlciwgbnVtYmVyXVxuICAgIHJlbW92ZVN0b3BzKHRyYW4sIGEsYilcbiAgICBsZXQgbmV3cmF0aW5nID0gc2NvcmUodHJhbikgXG4gICAgaWYgKGFjY2VwdChzY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBuZXdyYXRpbmcpKXtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld3JhdGluZ1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMVxuICAgIH1lbHNle1xuICAgICAgaW5zZXJ0U3RvcHModHJhbixhLGItMSwgZ2V0RGVjayhpdGVtKSBhcyAwfDEsIHJlcSlcbiAgICB9XG5cbiAgfVxuXG4gIGxldCBzdCA9IERhdGUubm93KClcblxuICBsZXQgTlNURVBTID0gNDAwMDAwXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBOU1RFUFM7IGkrKyl7XG4gICAgdGVtcCA9ICgxLSgoaSkvTlNURVBTKSkgKiBzdGFydF90ZW1wXG4gICAgdHJ5VW5hc3NpZ24oKVxuICAgIHRyeUFzc2lnbigpXG4gIH1cblxuICB0aW1lID0gRGF0ZS5ub3coKSAtIHN0XG5cbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZSwgc2NoZWR1bGVTaXplcywgdHJhblN0YXJ0LCBUU0laRSwgc2NoZWR1bGVSYXRpbmdzLCB1bmFzc2lnbmVkXG4gIH1cblxufVxuXG5cbmxldCB0aW1lID0gMFxuXG5sZXQgYW5uZWFsZXIgOiBSZXR1cm5UeXBlPHR5cGVvZiBzaW1wbGVBbm5lYWxpbmc+IHwgbnVsbCA9IG51bGxcblxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHBsYW5uZXJWaWV3KG1vZDogTW9kdWxlKTpIVE1MRWxlbWVudHtcbiAgY29uc3Qgb3V0ZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmdyYXlcbiAgY29uc3QgaW5uZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmxpZ2h0Z3JheVxuICBjb25zdCBjZWxsUGFkZGluZyA9IFwiLjM1ZW0gLjVlbVwiXG4gIGNvbnN0IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCA9IFwiMi4xZW1cIlxuXG4gIGlmIChhbm5lYWxlciA9PSBudWxsKSBhbm5lYWxlciA9IHNpbXBsZUFubmVhbGluZyhtb2QpXG5cblxuICBmdW5jdGlvbiBpdGVtQnV0dG9uIChpdGVtOm51bWJlciwgbG9hZD86IGJvb2xlYW4pe1xuICAgIGxldCByZXEgPSBtb2QucmVxdWVzdHNbaXRlbV0hXG4gICAgbGV0IHNwID0gc3BhbihpdGVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMywnICcpLFxuICAgICAgc3R5bGUoe2N1cnNvcjpcInBvaW50ZXJcIiwgYm9yZGVyOiBcIjJweCBzb2xpZCB0cmFuc3BhcmVudFwiLCBib3JkZXJSYWRpdXM6XCIuMmVtXCIsIHdoaXRlU3BhY2U6IFwicHJlXCIsIGZvbnRGYW1pbHk6XCJtb25vc3BhY2VcIn0pLFxuICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgcG9wdXAoXG4gICAgICAgICAgcChcIml0ZW0gXCIsIGl0ZW0pLFxuICAgICAgICAgIHRhYmxlKFxuICAgICAgICAgICAgdHIoY2VsbChcInN0YXR1c1wiKSwgY2VsbChsb2FkID8gXCJsb2FkXCIgOiBsb2FkID09IGZhbHNlID8gXCJ1bmxvYWRcIiA6IFwidW5hc3NpZ25lZFwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwidmFsdWVcIiksIGNlbGwocmVxLnZhbHVlX2V1ciArIFwi4oKsXCIpKSxcbiAgICAgICAgICAgIHRyKGNlbGwoXCJkaXN0XCIpLCBjZWxsKG1vZC5yb2FkbWFwLmdldENvc3ROKHJlcS5zdGFydFBvaW50LCByZXEuZW5kUG9pbnQpICsgXCJrbVwiKSksXG4gICAgICAgICAgICB0cihjZWxsKFwiZGVhZGxpbmVcIiksIGNlbGwocmVxLmRlYWRsaW5lX2gudG9GaXhlZCgyKSArIFwiaFwiKSlcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICB9KVxuXG4gICAgbGV0IHBvaW50cyA9W3tcbiAgICAgICAgbnVtYmVyOiByZXEuc3RhcnRQb2ludCxcbiAgICAgICAgbG9nbzogXCLwn5OmXCJcbiAgICAgIH0sIHtcbiAgICAgICAgbnVtYmVyOiByZXEuZW5kUG9pbnQsXG4gICAgICAgIGxvZ286IFwi8J+PoFwiXG4gICAgICB9XVxuXG5cbiAgICBpZiAobG9hZCA9PSB0cnVlKSBwb2ludHMgPSBbcG9pbnRzWzBdIV1cbiAgICBpZiAobG9hZCA9PSBmYWxzZSkgcG9pbnRzID0gW3BvaW50c1sxXSFdXG5cbiAgICBzcC5vbm1vdXNlZW50ZXIgPSBlPT57XG4gICAgICBzcC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbG9yLmdyZWVuXG4gICAgICBoaWdodExpZ2h0cy5zZXQoW3twb2ludHN9XSlcbiAgICB9XG5cbiAgICBzcC5vbm1vdXNlbGVhdmUgPSBlPT4ge3NwLnN0eWxlLmJvcmRlckNvbG9yID0gXCJ0cmFuc3BhcmVudFwifVxuICAgIHJldHVybiBzcFxuICB9XG5cblxuICBjb25zdCBjZWxsIDogdHlwZW9mIHRkID0gKC4uLngpID0+IHRkKHN0eWxlKHtib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdmVydGljYWxBbGlnbjogXCJ0b3BcIn0pLCAuLi54KVxuXG4gIGxldCB0YWIgPSB0YWJsZShcbiAgICBzdHlsZSh7XG4gICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIH0pLFxuXG4gICAgdHIoXG4gICAgICB0aChcInRyYW5zcG9ydGVyXCIsIHN0eWxlKHtib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIn0pKSxcbiAgICAgIHRoKFwidmFsdWVcIiwgc3R5bGUoe2JvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwifSkpLFxuICAgICAgdGgoXCJzdGVwc1wiLCBzdHlsZSh7Ym9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHRleHRBbGlnbjogXCJsZWZ0XCJ9KSlcbiAgICApLFxuICAgIG1vZC5zdGFydHBvc2l0aW9ucy5tYXAoKHN0YXJ0LCB0cmFuKT0+e1xuICAgICAgcmV0dXJuIHRyKFxuXG4gICAgICAgIHRkKFxuICAgICAgICAgIHRyYW4sXG4gICAgICAgICAgc3R5bGUoe2JvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwifSksXG4gICAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHBvcHVwKFxuICAgICAgICAgICAgICBwKFwidHJhbnNwb3J0ZXI6IFwiLCB0cmFuKSxcbiAgICAgICAgICAgICAgcChcInN0YXJ0OiBcIiwgc3RhcnQpLFxuICAgICAgICAgICAgICBwKFwic2NvcmU6IFwiLCBhbm5lYWxlcj8uc2NoZWR1bGVSYXRpbmdzW3RyYW5dISksXG4gICAgICAgICAgICAgIHAoXCJzdGVwczogXCIsIGFubmVhbGVyPy5zY2hlZHVsZVNpemVzW3RyYW5dISlcblxuICAgICAgICAgICAgKVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgb25tb3VzZWVudGVyOiBlPT57XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRyYW4pXG4gICAgICAgICAgICAgIGhpZ2h0TGlnaHRzLnNldChbe3BvaW50czpbe251bWJlcjpzdGFydCwgbG9nbzpcIvCfmppcIn1dfV0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApLFxuICAgICAgICB0ZChhbm5lYWxlcj8uc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgc3R5bGUoe2JvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwifSkpLFxuICAgICAgICB0YWJsZShcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICAgIH0pLFxuXG4gICAgICAgICAgWzAsMV0ubWFwKGRlY2s9PnRyKFxuICAgICAgICAgICAgQXJyYXkuZnJvbSh7bGVuZ3RoOiBhbm5lYWxlciEuc2NoZWR1bGVTaXplc1t0cmFuXSF9LCAoXyxpKT0+e1xuICAgICAgICAgICAgICBsZXQgc3RlcCA9IGFubmVhbGVyPy5zY2hlZHVsZVt0cmFuKiBhbm5lYWxlci5UU0laRSArIGldIVxuICAgICAgICAgICAgICByZXR1cm4gdGQoXG4gICAgICAgICAgICAgICAgKGdldERlY2soc3RlcCkgPT0gZGVjaykgPyBpdGVtQnV0dG9uKGdldFJlcShzdGVwKSAsIGlzbG9hZChzdGVwKSA/IHRydWUgOiBmYWxzZSApIDogXCJcIixcbiAgICAgICAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICAgICAgICBjb2xvcjogaXNsb2FkKHN0ZXApID8gY29sb3IuYmx1ZSA6IGNvbG9yLmdyZWVuLFxuICAgICAgICAgICAgICAgICAgYm9yZGVyOiBpbm5lckJvcmRlcixcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6IFwiLjJlbSAuM2VtXCIsXG4gICAgICAgICAgICAgICAgICBtaW5XaWR0aDogXCIyLjZlbVwiLFxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzY2hlZHVsZUNlbGxNaW5IZWlnaHQsXG4gICAgICAgICAgICAgICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKSlcbiAgICAgICAgKSxcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGJvcmRlcjogb3V0ZXJCb3JkZXIsXG4gICAgICAgICAgcGFkZGluZzogXCIuMjVlbVwiLFxuICAgICAgICAgIHZlcnRpY2FsQWxpZ246IFwidG9wXCIsXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgfSlcbiAgKVxuXG5cblxuICBcbiAgcmV0dXJuIGRpdihcblxuICAgIHN0eWxlKHtcbiAgICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgICBvdmVyZmxvd1k6IFwiYXV0b1wiLFxuICAgICAgb3ZlcmZsb3dYOiBcImhpZGRlblwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgIH0pLFxuICAgIGRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgb3ZlcmZsb3dYOiBcImF1dG9cIixcbiAgICAgICAgb3ZlcmZsb3dZOiBcImhpZGRlblwiLFxuICAgICAgICBtYXhXaWR0aDogXCIxMDAlXCIsXG4gICAgICB9KSxcbiAgICAgIHRhYlxuICAgICksXG5cbiAgICBkaXYoXG4gICAgICBoMyhcInBhcmFtZXRlcnNcIiksXG4gICAgICB0YWJsZShcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICAgIH0pLFxuICAgICAgICB0cihcbiAgICAgICAgICBjZWxsKFwidW5hc3NpZ25lZCByZXF1ZXN0c1wiKSxcbiAgICAgICAgICBjZWxsKEFycmF5LmZyb20oYW5uZWFsZXIudW5hc3NpZ25lZCkubWFwKCh4LGkpPT4oe3gsaX0pKS5maWx0ZXIoeD0+eC54KS5tYXAoeD0+c3BhbihcIiBcIiwgaXRlbUJ1dHRvbih4LmkpKSkpLFxuICAgICAgICApLFxuICAgICAgICB0cihcbiAgICAgICAgICBjZWxsKFwic2VhcmNoIHRpbWVcIiksXG4gICAgICAgICAgY2VsbCh0aW1lICsgXCJtc1wiKVxuICAgICAgICApLFxuICAgICAgICB0cihcbiAgICAgICAgICBjZWxsKFwic2NvcmVcIiksXG4gICAgICAgICAgY2VsbChhbm5lYWxlci5zY2hlZHVsZVJhdGluZ3MucmVkdWNlKCh4LHkpPT54K3ksIDApKVxuICAgICAgICApLFxuICAgICAgICB0cihcbiAgICAgICAgICBjZWxsKFwidHJhbnNwb3J0ZXIgY291bnRcIiksXG4gICAgICAgICAgY2VsbChtb2QuTlRSQU5TKVxuICAgICAgICApLFxuICAgICAgICB0cihcbiAgICAgICAgICBjZWxsKFwicmVxdWVzdCBjb3VudFwiKSxcbiAgICAgICAgICBjZWxsKG1vZC5OUkVRUylcbiAgICAgICAgKSxcbiAgICAgICAgdHIoXG4gICAgICAgICAgY2VsbChcImNvc3QgcGVyIGttXCIpLFxuICAgICAgICAgIGNlbGwoS01fQ09TVCArIFwi4oKsXCIpXG4gICAgICAgICksXG4gICAgICAgIHRyKFxuICAgICAgICAgIGNlbGwoXCJhdmVyYWdlIHNwZWVkXCIpLFxuICAgICAgICAgIGNlbGwoQVZHX1NQRUVEX0tNSCArIFwia20vaFwiKVxuICAgICAgICApLFxuICAgICAgICB0cihcbiAgICAgICAgICBjZWxsKFwicmVvcmdhbml6YXRpb24gY29zdFwiKSxcbiAgICAgICAgICBjZWxsKFJFT1JHX0NPU1RfRVVSICsgXCLigqxcIilcbiAgICAgICAgKVxuICAgICAgKVxuICAgICksXG5cbiAgKVxufVxuIiwKICAgICJpbXBvcnQgeyBoYXNoIH0gZnJvbSBcIi4uL2hhc2hcIjtcbmltcG9ydCB7IGJvZHksIGJ1dHRvbiwgY29sb3IsIGRpdiwgZXJyb3Jwb3B1cCwgaDEsIGgyLCBoMywgaW5wdXQsIG1hcmdpbiwgcCwgcGFkZGluZywgcG9wdXAsIHByZSwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB3aWR0aCwgdGV4dGFyZWEsIGEsIGJvcmRlciwgaHRtbCwgdGgsIHRyLCB0ZCwgYm9yZGVyUmFkaXVzLCBwYW5lbExpc3QsIGRpc3BsYXksIGJhY2tncm91bmQgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBtYXBWaWV3IH0gZnJvbSBcIi4vbWFwVmlld1wiO1xuaW1wb3J0IHsgcmFuZG9tTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgcmFuZG9tTW9kdWxlLCByYW5kb21VVUlELCBSZXF1ZXN0LCBTY2hlZHVsZSwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgbWtTdG9yZWQsIG1rV3JpdGFibGUsIHR5cGUgV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kb20sIHNldFJhbmRTZWVkIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuaW1wb3J0IHsgbnVtYmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgcGxhbm5lclZpZXcgfSBmcm9tIFwiLi4vcGxhbm5lcnMvYW5uZWFsaW5nXCI7XG5cblxuZXhwb3J0IGxldCBMS1dfQ09VTlQgPSBta1N0b3JlZChcIkxLV19DT1VOVFwiLCBudW1iZXIsICA1KVxubGV0IFJFUVVFU1RfQ09VTlQgPSBta1N0b3JlZChcIlJFUVVFU1RfQ09VTlRcIiwgIG51bWJlciwgMjApXG5cbmJvZHkuc3R5bGUubWFyZ2luID0gXCIwXCJcblxubGV0IGhlYWRlciA9IGgxKFwicm91dGUgcGxhbm5lclwiLCBzdHlsZSh7YmFja2dyb3VuZDogY29sb3IuYmx1ZSwgY29sb3I6IGNvbG9yLmJhY2tncm91bmQsIG1hcmdpbjogXCIwXCIsIHBhZGRpbmc6IFwiLjZlbVwifSkpXG5cbmxldCBjb250ZW50U3BhY2UgPSBkaXYoc3R5bGUoe1xuICBkaXNwbGF5OlwiZmxleFwiLFxuICBmbGV4RGlyZWN0aW9uOlwicm93XCIsXG4gIHdpZHRoOiBcIjEwMCVcIixcbiAgaGVpZ2h0OiBcImNhbGMoMTAwJSAtIDIuNWVtKVwiLFxuICBtaW5XaWR0aDogXCIwXCIsXG59KSlcblxubGV0IHBhZ2UgPSBkaXYoXG4gIHN0eWxlKHtkaXNwbGF5OlwiZmxleFwiLCBmbGV4RGlyZWN0aW9uOlwiY29sdW1uXCIsIGhlaWdodDogXCIxMDAlXCJ9KSxcbiAgaGVhZGVyLFxuICBjb250ZW50U3BhY2VcbilcblxuYm9keS5yZXBsYWNlQ2hpbGRyZW4ocGFnZSlcblxuc2V0UmFuZFNlZWQoMjQpXG5cbmV4cG9ydCBsZXQgbW9kdWxlID0gcmFuZG9tTW9kdWxlKClcblxuZXhwb3J0IHR5cGUgSGlnaExpZ2h0ID0ge1xuICBwb2ludHM6IHtcbiAgICBudW1iZXI6IG51bWJlcixcbiAgICBsb2dvPyA6IHN0cmluZyxcbiAgfVtdLFxuICBjb2xvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgbGV0IGhpZ2h0TGlnaHRzID0gbWtXcml0YWJsZSA8SGlnaExpZ2h0W10+KCBbXSApXG5cblxuZnVuY3Rpb24gc2V0dGVyIChzdG9yZTogV3JpdGFibGU8bnVtYmVyPiApe1xuICBsZXQgaW5wID0gaW5wdXQoKVxuICBpbnAudHlwZSA9IFwibnVtYmVyXCJcbiAgaW5wLm9uY2hhbmdlID0gKCk9PntcbiAgICBsZXQgdmFsID0gcGFyc2VJbnQoaW5wLnZhbHVlKVxuICAgIGlmIChpc05hTih2YWwpKSByZXR1cm5cbiAgICBzdG9yZS5zZXQodmFsKVxuICB9XG4gIHN0b3JlLm9udXBkYXRlKHZhbD0+aW5wLnZhbHVlID0gdmFsLnRvU3RyaW5nKCkpXG5cbiAgcmV0dXJuIGlucFxufVxuXG5cbmZ1bmN0aW9uIG1rV2luZG93ICh0YWI6IG51bWJlciA9IDAgKSB7XG5cbiAgbGV0IHRhYkZpZWxkcyA9IFtcbiAgICBbJ21hcCcsIG1hcFZpZXcobW9kdWxlKV0sXG4gICAgLy8gWydyZXF1ZXN0cycsIHJlcXVlc3RWaWV3KG1vZHVsZS5yZXF1ZXN0cyldLFxuICAgIC8vIFsnc2NoZWR1bGUnLCBzY2hlZHVsZVZpZXcoKSBdLFxuICAgIFsncGxhbm5lcicsIHBsYW5uZXJWaWV3KG1vZHVsZSldLFxuICAgIC8vIFsnc2V0dGluZ3MnLCBkaXYoXG4gICAgLy8gICBzdHlsZSh7XG4gICAgLy8gICAgIHBhZGRpbmc6IFwiMWVtXCIsXG4gICAgLy8gICB9KSxcbiAgICAvLyAgIGgyKFwic2V0dGluZ3NcIiksXG5cblxuICAgIC8vICAgdGFibGUoXG4gICAgLy8gICAgIHRyKFxuICAgIC8vICAgICAgIHRkKFwiTEtXIGNvdW50XCIpLFxuICAgIC8vICAgICAgIHRkKHNldHRlcihMS1dfQ09VTlQpKVxuICAgIC8vICAgICApLFxuICAgIC8vICAgICB0cihcbiAgICAvLyAgICAgICB0ZChcIlJlcXVlc3QgY291bnRcIiksXG4gICAgLy8gICAgICAgdGQoc2V0dGVyKFJFUVVFU1RfQ09VTlQpKVxuICAgIC8vICAgICApLFxuICAgIC8vICAgICB0cihidXR0b24oXCJnZW5lcmF0ZVwiLCAoKT0+e1xuICAgIC8vICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKVxuICAgIC8vICAgICB9KSlcbiAgICAvLyAgIClcblxuICAgIC8vICldXG4gIF0gYXMgY29uc3RcblxuICBjb25zdCBlbCA9IGRpdihzdHlsZSh7XG4gICAgZmxleDogXCIxIDEgMFwiLFxuICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICBoZWlnaHQ6IFwiY2FsYygxMDB2aCAtIDFlbSlcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgfSkpXG5cbiAgZnVuY3Rpb24gb3BlblRhYih0YWI6IHR5cGVvZiB0YWJGaWVsZHNbbnVtYmVyXVswXSkge1xuICAgIGNvbnN0IHRhYnMgPSBwKFxuICAgICAgc3R5bGUoe1xuICAgICAgICBtYXJnaW46IFwiMFwiLFxuICAgICAgICBwYWRkaW5nOiBcIi40ZW1cIixcbiAgICAgICAgZmxleDogXCIwIDAgYXV0b1wiLFxuICAgICAgfSksXG4gICAgICB0YWJGaWVsZHMubWFwKChbbixlXSk9PlxuICAgICAgICBzcGFuKCBuLFxuICAgICAgICAgICgpPT5vcGVuVGFiKG4pLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjNlbVwiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIi4zZW1cIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiKyAobj09dGFiID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5KSxcbiAgICAgICAgICAgIGNvbG9yOiAobj09dGFiKSA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuXG4gICAgY29uc3QgY29udGVudCA9IGRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgZmxleDogXCIxIDEgYXV0b1wiLFxuICAgICAgICBtaW5IZWlnaHQ6IFwiMFwiLFxuICAgICAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgICB9KSxcbiAgICAgIHRhYkZpZWxkcy5maW5kKChbbixdKT0+bj09dGFiKSFbMV1cbiAgICApXG5cbiAgICBlbC5yZXBsYWNlQ2hpbGRyZW4oXG4gICAgICB0YWJzLFxuICAgICAgY29udGVudFxuICAgIClcbiAgfVxuXG5cbiAgb3BlblRhYih0YWJGaWVsZHNbdGFiXSFbMF0pXG5cbiAgcmV0dXJuIGVsXG59XG5cbmNvbnRlbnRTcGFjZS5yZXBsYWNlQ2hpbGRyZW4obWtXaW5kb3coMSApLCBta1dpbmRvdygpKVxuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQUVPLElBQU0sT0FBTyxTQUFTO0FBRTdCLElBQU0sZUFBZTtBQUFBLEVBQ25CLE9BQU07QUFBQSxJQUNKLE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNuQixLQUFtQjtBQUFBLElBQ25CLE9BQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsTUFBSztBQUFBLElBQ0gsT0FBbUI7QUFBQSxJQUNuQixZ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LFlBQVksUUFBUSxLQUFLLFNBQVMsT0FBTSxDQUFDLENBQUM7QUFFdkgsSUFBSSxlQUFlLElBQUksTUFBTTtBQUFBLEVBQzNCLFNBQVE7QUFBQSxFQUNSLGVBQWM7QUFBQSxFQUNkLE9BQU87QUFBQSxFQUNQLFFBQVE7QUFBQSxFQUNSLFVBQVU7QUFDWixDQUFDLENBQUM7QUFFRixJQUFJLE9BQU8sSUFDVCxNQUFNLEVBQUMsU0FBUSxRQUFRLGVBQWMsVUFBVSxRQUFRLE9BQU0sQ0FBQyxHQUM5RCxRQUNBLFlBQ0Y7QUFFQSxLQUFLLGdCQUFnQixJQUFJO0FBRXpCLFlBQVksRUFBRTtBQUVQLElBQUksU0FBUyxhQUFhO0FBVTFCLElBQUksY0FBYyxXQUEwQixDQUFDLENBQUU7QUFpQnRELFNBQVMsUUFBUyxDQUFDLE1BQWMsR0FBSTtBQUFBLEVBRW5DLElBQUksWUFBWTtBQUFBLElBQ2QsQ0FBQyxPQUFPLFFBQVEsTUFBTSxDQUFDO0FBQUEsSUFHdkIsQ0FBQyxXQUFXLFlBQVksTUFBTSxDQUFDO0FBQUEsRUF1QmpDO0FBQUEsRUFFQSxNQUFNLEtBQUssSUFBSSxNQUFNO0FBQUEsSUFDbkIsTUFBTTtBQUFBLElBQ04sVUFBVTtBQUFBLElBQ1YsUUFBUTtBQUFBLElBQ1IsUUFBUSxlQUFhLE1BQU07QUFBQSxJQUMzQixVQUFVO0FBQUEsSUFDVixTQUFTO0FBQUEsSUFDVCxlQUFlO0FBQUEsRUFDakIsQ0FBQyxDQUFDO0FBQUEsRUFFRixTQUFTLE9BQU8sQ0FBQyxNQUFrQztBQUFBLElBQ2pELE1BQU0sT0FBTyxFQUNYLE1BQU07QUFBQSxNQUNKLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxNQUNULE1BQU07QUFBQSxJQUNSLENBQUMsR0FDRCxVQUFVLElBQUksRUFBRSxHQUFFLE9BQ2hCLEtBQU0sR0FDSixNQUFJLFFBQVEsQ0FBQyxHQUNiLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFFBQVEsZ0JBQWUsS0FBRyxPQUFNLE1BQU0sUUFBUSxNQUFNO0FBQUEsTUFDcEQsT0FBUSxLQUFHLE9BQU8sTUFBTSxRQUFRLE1BQU07QUFBQSxJQUN4QyxDQUFDLENBQ0gsQ0FDRixDQUNGO0FBQUEsSUFFQSxNQUFNLFVBQVUsSUFDZCxNQUFNO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixXQUFXO0FBQUEsTUFDWCxVQUFVO0FBQUEsSUFDWixDQUFDLEdBQ0QsVUFBVSxLQUFLLEVBQUUsT0FBTSxLQUFHLElBQUcsRUFBRyxFQUNsQztBQUFBLElBRUEsR0FBRyxnQkFDRCxNQUNBLE9BQ0Y7QUFBQTtBQUFBLEVBSUYsUUFBUSxVQUFVLEtBQU0sRUFBRTtBQUFBLEVBRTFCLE9BQU87QUFBQTtBQUdULGFBQWEsZ0JBQWdCLFNBQVMsQ0FBRSxHQUFHLFNBQVMsQ0FBQzsiLAogICJkZWJ1Z0lkIjogIjAwODE0RjM0QkM3REM0QTQ2NDc1NkUyMTY0NzU2RTIxIiwKICAibmFtZXMiOiBbXQp9
