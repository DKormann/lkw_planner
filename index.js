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
var input = (...cs) => {
  const content = cs.filter((c) => typeof c == "string").join(" ");
  const el = html("input", ...cs);
  el.value = content;
  return el;
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
    el.setAttribute("font-size", "0.03");
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
        if (last !== null) {
          let path = roadmap.findPath(last, next);
          for (let i = 0;i < path.length - 1; i++) {
            let A = roadmap.points[path[i]];
            let B = roadmap.points[path[i + 1]];
            let line = mkSvg("line", A.x, A.y, B.x, B.y);
            line.setColor(n.color ?? "#ffc988");
            line.el.setAttribute("stroke-width", "0.01");
            line.el.setAttribute("z-index", "100");
            element.appendChild(line.el);
            hints.push({ remove: () => line.el.remove() });
          }
        }
        last = next;
      }
      for (let p3 of n.points) {
        if (p3.logo) {
          let pos = roadmap.points[p3.number];
          let el = mkSvg("text", pos.x, pos.y, p3.logo);
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
  let rods = [];
  function setroad(a2, b, dist) {
    rods.push({ a: a2, b, dist });
    if (a2 == b)
      throw new Error("Cannot set road from a point to itself");
    roads[roadIDX(a2, b)] = dist;
  }
  let range = Array.from({ length: NPOINTS }, (_, i) => i);
  let points = range.map(() => ({ x: randInt(0, MAPSIZE), y: randInt(0, MAPSIZE) }));
  let neighs = points.map((ps, i) => points.map((p22, i2) => ({ d: Math.floor(Math.hypot(ps.x - p22.x, ps.y - p22.y)), i: i2 })).filter((x) => x.i != i).sort((a2, b) => a2.d - b.d));
  let found = new Set([0]);
  function find(x) {
    if (found.has(x))
      return;
    found.add(x);
    range.forEach((p3, i) => {
      if (i != x && getroad(i, x) != 0)
        find(i);
    });
  }
  for (let x = 0;x < NPOINTS; x++) {
    for (let i = 0;i < 4; i++) {
      let x2 = randInt(0, NPOINTS);
      let nx = neighs[x2]?.[i];
      setroad(x2, nx.i, nx.d);
      if (found.has(x2))
        find(nx.i);
      if (found.has(nx.i))
        find(x2);
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
var Module = object({
  requests: array(Request),
  transporters: array(Transporter),
  schedule: Schedule
});
function randomModule(NREQS = 40, NTRANS = 10, NPOINTS = 100, MAPSIZE = 400, seed = 22) {
  const roadmap = randomMap(NPOINTS, MAPSIZE);
  return {
    NTRANS,
    NREQS,
    MAPSIZE,
    RSIZE: NPOINTS * NPOINTS / 2,
    roadmap,
    requests: Array.from({ length: NREQS }, (_, i) => ({
      id: randomUUID(),
      deadline_h: randInt(0, Math.floor(random() * MAPSIZE * 4)),
      startPoint: randChoice(roadmap.range),
      endPoint: randChoice(roadmap.range),
      value_eur: randInt(0, 1000)
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
var KM_COST = 0.2;
var AVG_SPEED_KMH = 70;
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
          return -INF;
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
    if (newrating < scheduleRatings[tran]) {
      removeStops(tran, a2, b + 1);
    } else {
      scheduleRatings[tran] = newrating;
      unassigned[req] = 0;
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
    if (newrating < scheduleRatings[tran]) {
      insertStops(tran, a2, b - 1, getDeck(item), req);
    } else {
      scheduleRatings[tran] = newrating;
      unassigned[req] = 1;
    }
  }
  for (let i = 0;i < 100; i++) {
    tryAssign();
  }
  return {
    schedule,
    scheduleSizes,
    tranStart
  };
}
var annealer = null;
function plannerView(mod) {
  if (annealer == null)
    annealer = simpleAnnealing(mod);
  let el = div(style({ display: "flex", flexDirection: "row", maxWidth: "50vw", overflow: "auto" }), mod.startpositions.map((start, tran) => {
    return div(style({
      padding: ".3em",
      border: `1px solid ${color.color}`
    }), start, Array.from({ length: annealer.scheduleSizes[tran] }, (_, i) => {
      let step = annealer?.schedule[i];
      return p(isload(step), ":", getReq(step));
    }));
  }));
  return el;
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
function setter(store) {
  let inp = input();
  inp.type = "number";
  inp.onchange = () => {
    let val = parseInt(inp.value);
    if (isNaN(val))
      return;
    store.set(val);
  };
  store.onupdate((val) => inp.value = val.toString());
  return inp;
}
function mkWindow(tab = 0) {
  let tabFields = [
    ["map", mapView(module)],
    ["planner", plannerView(module)],
    ["settings", div(style({
      padding: "1em"
    }), h2("settings"), table(tr(td("LKW count"), td(setter(LKW_COUNT))), tr(td("Request count"), td(setter(REQUEST_COUNT))), tr(button("generate", () => {
      window.location.reload();
    }))))]
  ];
  const el = div(style({
    flex: "1 1 0",
    minWidth: "0",
    height: "calc(100vh - 1em)",
    border: "1px solid " + color.gray,
    overflow: "hidden"
  }));
  function openTab(tab2) {
    el.replaceChildren(p(tabFields.map(([n, e]) => span(n, () => openTab(n), style({
      padding: ".3em",
      margin: ".3em",
      cursor: "pointer",
      border: "1px solid " + (n == tab2 ? color.color : color.gray),
      color: n == tab2 ? color.color : color.gray
    })))), tabFields.find(([n]) => n == tab2)[1]);
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

//# debugId=858D525A9AB3DE6464756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JhbmRvbU1hcC50cyIsICJzcmMvanNvbnNjaGVtYS50cyIsICJzcmMvc2NoZW1hLnRzIiwgInNyYy90eXBlcy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmcudHMiLCAic3JjL3ZpZXcvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsKICAgICJcbmltcG9ydCB0eXBlIHsgSnNvbkRhdGEgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5leHBvcnQgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbmNvbnN0IGNvbG9yUGFsZXR0ZSA9IHtcbiAgbGlnaHQ6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiMwMDBcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjZmZmXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDI0MiwgNTUsIDU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYig1NywgMjE0LCAzOSlcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoNSwgMjgsIDE0MSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoMjEsIDEzNywgMjM5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM4ODhcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjZTVlNWU1XCIsXG4gIH0sXG4gIGRhcms6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiNmZmZcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjMjIyXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDE5OCwgMjAsIDApXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDk1LCAxNTksIDI1NSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoOTUsIDEwMCwgMjU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYigwLCAxODUsIDE5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM1NjU2NTZcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjNDE0MTQxXCIsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbG9yID0ge1xuICBjb2xvcjogXCJ2YXIoLS1jb2xvcilcIixcbiAgYmFja2dyb3VuZDogXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiLFxuICBibHVlOiBcInZhcigtLWJsdWUpXCIsXG4gIGxpZ2h0Qmx1ZTogXCJ2YXIoLS1saWdodGJsdWUpXCIsXG4gIHJlZDogXCJ2YXIoLS1yZWQpXCIsXG4gIGdyZWVuOiBcInZhcigtLWdyZWVuKVwiLFxuICBncmF5OiBcInZhcigtLWdyYXkpXCIsXG4gIGxpZ2h0Z3JheTogXCJ2YXIoLS1saWdodGdyYXkpXCJcbn1cblxuXG5sZXQgc3R5bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKVxuc3R5bC5pbm5lckhUTUwgPSBgXG46cm9vdCB7XG4gIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmRhcmsuY29sb3J9O1xuICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmFja2dyb3VuZH07XG4gIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5kYXJrLnJlZH07XG4gIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JlZW59O1xuICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmx1ZX07XG4gIC0tZ3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5ncmF5fTtcbiAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsubGlnaHRncmF5fTtcbiAgY29sb3I6IHZhcigtLWNvbG9yKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZCk7XG4gIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgOnJvb3Qge1xuICAgIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmNvbG9yfTtcbiAgICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJhY2tncm91bmR9O1xuICAgIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5saWdodC5yZWR9O1xuICAgIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyZWVufTtcbiAgICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJsdWV9O1xuICAgIC0tZ3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JheX07XG4gICAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmxpZ2h0Z3JheX07XG4gIH1cbn1cbmBcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bClcblxuZXhwb3J0IHR5cGUgaHRtbEtleSA9ICdpbm5lclRleHQnfCdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdvbmtleWRvd24nIHwgJ29ubW91c2VvdmVyJyB8ICdvbm1vdXNlZXhpdCcgfCdjaGlsZHJlbid8J2NsYXNzJ3wnaWQnfCdjb250ZW50RWRpdGFibGUnfCdldmVudExpc3RlbmVycyd8J2NvbG9yJ3wnYmFja2dyb3VuZCcgfCAnc3R5bGUnIHwgJ3BsYWNlaG9sZGVyJyB8ICd0YWJJbmRleCcgfCAnY29sU3BhbicgfCAndHlwZSdcbmV4cG9ydCBjb25zdCBodG1sRWxlbWVudCA9ICh0YWc6c3RyaW5nLCB0ZXh0OnN0cmluZywgYXJncz86UGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4pOkhUTUxFbGVtZW50ID0+e1xuXG4gIGNvbnN0IF9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpXG4gIF9lbGVtZW50LnRleHRDb250ZW50ID0gdGV4dFxuICBsZXQgc3QgPSBfZWxlbWVudC5zdHlsZVxuICBpZiAodGFnID09IFwiYnV0dG9uXCIpe1xuICAgIF9lbGVtZW50LmlubmVyVGV4dCA9IHRleHRcbiAgICBzdC5jb2xvciA9IGNvbG9yLmNvbG9yXG4gICAgc3QuYmFja2dyb3VuZENvbG9yID0gY29sb3IubGlnaHRncmF5XG4gICAgc3QuYm9yZGVyID0gXCIxcHggc29saWQgXCIrY29sb3IuZ3JheVxuICAgIHN0LmJvcmRlclJhZGl1cyA9IFwiLjJlbVwiXG4gICAgc3QucGFkZGluZyA9IFwiLjFlbSAuNGVtXCJcbiAgICBzdC5tYXJnaW4gPSBcIi4yZW1cIlxuICB9XG4gIGlmIChhcmdzKSBPYmplY3QuZW50cmllcyhhcmdzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pPT57XG4gICAgaWYgKGtleSA9PT0gJ3BhcmVudCcpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChfZWxlbWVudClcbiAgICB9XG4gICAgaWYgKGtleT09PSdjaGlsZHJlbicpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50W10pLmZvckVhY2goYz0+X2VsZW1lbnQuYXBwZW5kQ2hpbGQoYykpXG4gICAgfWVsc2UgaWYgKGtleT09PSdldmVudExpc3RlbmVycycpe1xuICAgICAgT2JqZWN0LmVudHJpZXModmFsdWUgYXMgUmVjb3JkPHN0cmluZywgKGU6RXZlbnQpPT52b2lkPikuZm9yRWFjaCgoW2V2ZW50LCBsaXN0ZW5lcl0pPT57XG4gICAgICAgIF9lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxuICAgICAgfSlcbiAgICB9ZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKXtcbiAgICAgIE9iamVjdC5hc3NpZ24oX2VsZW1lbnQuc3R5bGUsIHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pXG4gICAgfWVsc2V7XG4gICAgICBfZWxlbWVudFsoa2V5IGFzICdpbm5lclRleHQnIHwgJ29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ2lkJyB8ICdjb250ZW50RWRpdGFibGUnKV0gPSB2YWx1ZVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIF9lbGVtZW50XG59XG5cbmV4cG9ydCB0eXBlIEhUTUxBcmcgPSBzdHJpbmcgfCBudW1iZXIgfCBIVE1MRWxlbWVudCB8IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ICB8IFByb21pc2U8SFRNTEFyZz4gfCBIVE1MQXJnW10gfCBGdW5jdGlvblxuZXhwb3J0IGNvbnN0IGh0bWwgPSAodGFnOnN0cmluZywgLi4uY3M6SFRNTEFyZ1tdKTpIVE1MRWxlbWVudD0+e1xuICBsZXQgY2hpbGRyZW46IEhUTUxFbGVtZW50W10gPSBbXVxuICBsZXQgYXJnczogUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gPSB7fVxuXG4gIGNvbnN0IGFkZF9hcmcgPSAoYXJnOkhUTUxBcmcpPT57XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcpKVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcudG9TdHJpbmcoKSkpXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgUHJvbWlzZSl7XG4gICAgICBjb25zdCBlbCA9IHNwYW4oXCIuLi5cIilcbiAgICAgIGFyZy50aGVuKCh2YWx1ZSk9PntcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKHZhbHVlKSlcbiAgICAgIH0pXG4gICAgICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIH1cbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgY2hpbGRyZW4ucHVzaChhcmcpXG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSBhcmcuZm9yRWFjaCh4PT5hZGRfYXJnKHgpKVxuICAgIC8vIGVsc2UgaWYgKCdnZXQnIGluIGFyZyAmJiB0eXBlb2YgYXJnLmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vICAgY29uc3QgZWwgPSBzcGFuKClcbiAgICAvLyAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgLy8gICBpZiAoJ29udXBkYXRlJyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5vbnVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykgYXJnLm9udXBkYXRlKHg9PmVsLnJlcGxhY2VDaGlsZHJlbih4KSlcbiAgICAvLyB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PSBcImZ1bmN0aW9uXCIpe1xuICAgICAgaWYgKGFyZy5uYW1lID09IFwib25pbnB1dFwiKSBhcmdzLm9uaW5wdXQgPSBhcmdcbiAgICAgIGVsc2UgaWYgKGFyZy5uYW1lID09IFwib25jbGlja1wiIHx8IGFyZy5sZW5ndGggPCAyKSBhcmdzLm9uY2xpY2sgPSBhcmdcbiAgICAgIGVsc2UgY29uc29sZS53YXJuKFwiRnVuY3Rpb24gYXJndW1lbnQgd2l0aG91dCBuYW1lIG9yIHdpdGggbW9yZSB0aGFuIG9uZSBwYXJhbWV0ZXIgaXMgaWdub3JlZCBpbiBodG1sIGdlbmVyYXRvclwiKVxuICAgIH1cbiAgICBlbHNlIGFyZ3MgPSB7Li4uYXJncywgLi4uYXJnfVxuICB9XG4gIGNzLmZvckVhY2goYWRkX2FyZylcbiAgcmV0dXJuIGh0bWxFbGVtZW50KHRhZywgXCJcIiwgey4uLmFyZ3MsIGNoaWxkcmVufSlcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEdlbmVyYXRvcjxUIGV4dGVuZHMgSFRNTEVsZW1lbnQgPSBIVE1MRWxlbWVudD4gPSAoLi4uY3M6SFRNTEFyZ1tdKSA9PiBUXG5jb25zdCBuZXdIdG1sR2VuZXJhdG9yID0gPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4odGFnOnN0cmluZyk9PiguLi5jczpIVE1MQXJnW10pOlQ9Pmh0bWwodGFnLCAuLi5jcykgYXMgVFxuXG5leHBvcnQgY29uc3QgcDpIVE1MR2VuZXJhdG9yPEhUTUxQYXJhZ3JhcGhFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwXCIpXG5leHBvcnQgY29uc3QgYTpIVE1MR2VuZXJhdG9yPEhUTUxBbmNob3JFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJhXCIpXG5leHBvcnQgY29uc3QgaDE6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgxXCIpXG5leHBvcnQgY29uc3QgaDI6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgyXCIpXG5leHBvcnQgY29uc3QgaDM6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgzXCIpXG5leHBvcnQgY29uc3QgaDQ6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImg0XCIpXG5cbmV4cG9ydCBjb25zdCBkaXY6SFRNTEdlbmVyYXRvcjxIVE1MRGl2RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiZGl2XCIpXG5leHBvcnQgY29uc3QgcHJlOkhUTUxHZW5lcmF0b3I8SFRNTFByZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInByZVwiKVxuZXhwb3J0IGNvbnN0IHNwYW46SFRNTEdlbmVyYXRvcjxIVE1MU3BhbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInNwYW5cIilcbmV4cG9ydCBjb25zdCB0ZXh0YXJlYTpIVE1MR2VuZXJhdG9yPEhUTUxUZXh0QXJlYUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRleHRhcmVhXCIpXG5cbmV4cG9ydCBjb25zdCBidXR0b246SFRNTEdlbmVyYXRvcjxIVE1MQnV0dG9uRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYnV0dG9uXCIpXG4vLyBleHBvcnQgY29uc3QgdGFibGUgPSAocm93czogSFRNTEFyZ1tdW10sIC4uLmFyZ3M6IEhUTUxBcmdbXSkgPT4gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpKCBzdHlsZSh7Ym9yZGVyU3BhY2luZzogXCIxZW0gLjRlbVwifSkgLCByb3dzLm1hcChjZWxscz0+dHIoY2VsbHMubWFwKGNlbGw9PnRkKGNlbGwpKSkpLCAuLi5hcmdzKVxuZXhwb3J0IGNvbnN0IHRhYmxlOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIilcblxuZXhwb3J0IGNvbnN0IHRyOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlUm93RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidHJcIilcbmV4cG9ydCBjb25zdCB0ZDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZFwiKVxuZXhwb3J0IGNvbnN0IHRoOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRoXCIpXG5leHBvcnQgY29uc3QgY2FudmFzOkhUTUxHZW5lcmF0b3I8SFRNTENhbnZhc0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImNhbnZhc1wiKVxuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSAoLi4ucnVsZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5bXSkgPT4gKHtzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgLi4ucnVsZXMpfSlcbmV4cG9ydCBjb25zdCBtYXJnaW4gPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe21hcmdpbjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHBhZGRpbmcgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3BhZGRpbmc6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXIgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlcjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlclJhZGl1cyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyUmFkaXVzOiB2YWx1ZX0pXG5leHBvcnQgY29uc3Qgd2lkdGggPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3dpZHRoOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgaGVpZ2h0ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtoZWlnaHQ6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBkaXNwbGF5ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtkaXNwbGF5OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYmFja2dyb3VuZCA9ICh2YWx1ZTogc3RyaW5nID0gXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiKSA9PiBzdHlsZSh7YmFja2dyb3VuZDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3QgaW5wdXQ6SFRNTEdlbmVyYXRvcjxIVE1MSW5wdXRFbGVtZW50PiA9ICguLi5jcyk9PntcbiAgY29uc3QgY29udGVudCA9IGNzLmZpbHRlcihjPT50eXBlb2YgYyA9PSAnc3RyaW5nJykuam9pbignICcpXG4gIGNvbnN0IGVsID0gaHRtbChcImlucHV0XCIsIC4uLmNzKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gIGVsLnZhbHVlID0gY29udGVudFxuICByZXR1cm4gZWxcbn1cblxuXG5leHBvcnQgY29uc3QgcG9wdXAgPSAoLi4uY3M6SFRNTEFyZ1tdKT0+e1xuICBjb25zdCBkaWFsb2dmaWVsZCA9IGRpdih7XG4gICAgc3R5bGU6IHtcbiAgICAgIGJhY2tncm91bmQ6IGNvbG9yLmJhY2tncm91bmQsXG4gICAgICBjb2xvcjogY29sb3IuY29sb3IsXG4gICAgICBwYWRkaW5nOiBcIjFlbSA0ZW1cIixcbiAgICAgIHBhZGRpbmdCb3R0b206IFwiMmVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMWVtXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgICAgb3ZlcmZsb3dZOiBcInNjcm9sbFwiLFxuICAgICAgbWluV2lkdGg6IFwiMjB2d1wiLFxuICAgICAgbWF4SGVpZ2h0OiBcIjgwdmhcIixcbiAgICB9fSxcbiAgICAuLi5jcylcblxuICBjb25zdCBwb3B1cGJhY2tncm91bmQgPSBkaXYoXG4gICAge3N0eWxlOntcbiAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICB0b3A6IFwiMFwiLFxuICAgICAgbGVmdDogXCIwXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJyZ2JhKDE2NiwgMTY2LCAxNjYsIDAuNSlcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICB9fVxuICApXG5cbiAgcG9wdXBiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKGRpYWxvZ2ZpZWxkKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwb3B1cGJhY2tncm91bmQpO1xuICBwb3B1cGJhY2tncm91bmQub25jbGljayA9ICgpID0+IHtwb3B1cGJhY2tncm91bmQucmVtb3ZlKCk7IH1cbiAgZGlhbG9nZmllbGQub25jbGljayA9IChlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICByZXR1cm4gcG9wdXBiYWNrZ3JvdW5kXG5cbn1cblxuZXhwb3J0IGNvbnN0IGVycm9ycG9wdXAgPSAoZTpFcnJvciB8IHN0cmluZykgPT57XG4gIHBvcHVwKGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOmNvbG9yLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6XCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgIHBhZGRpbmc6XCIxZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czpcIi40ZW1cIixcbiAgICAgIGNvbG9yOmNvbG9yLnJlZCxcbiAgICB9KSxcbiAgICBoMihcIkVycm9yXCIpLFxuICAgIHAoU3RyaW5nKGUpKVxuICApKVxuICB0aHJvdyAoZSBpbnN0YW5jZW9mIEVycm9yKSA/IGUgOiBuZXcgRXJyb3IoU3RyaW5nKGUpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFuZWxMaXN0KGl0ZW1zOiB7dGl0bGU6IEhUTUxBcmcsIGNvbnRlbnQ6IEhUTUxBcmd9W10pe1xuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgIGdhcDogXCIxZW1cIixcbiAgICB9KSxcbiAgICAuLi5pdGVtcy5tYXAoZj0+ZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuNGVtXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjVlbSAxZW1cIixcbiAgICAgIH0pLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgZm9udFdlaWdodDogXCJib2xkXCIsXG4gICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYudGl0bGVcbiAgICAgICksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBtYXJnaW5Ub3A6IFwiLjVlbVwiLFxuICAgICAgICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi5jb250ZW50XG4gICAgICApXG4gICAgKSlcbiAgKVxufVxuXG5cblxuXG4iLAogICAgIlxuaW1wb3J0IHR5cGUgeyBNb2R1bGUsIFVVSUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbi8vIGltcG9ydCB7IGZpbmRQYXRoIH0gZnJvbSBcIi4uL3BsYW5uZXJcIjtcbmltcG9ydCB7ICB0eXBlIFJvYWRNYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyBkaXYsIHAsIHN0eWxlIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMgfSBmcm9tIFwiLi9tYWluXCI7XG5cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiwgeDogbnVtYmVyLCB5OiBudW1iZXIpIDoge2VsOiBTVkdDaXJjbGVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJsaW5lXCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIpIDoge2VsOiBTVkdMaW5lRWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwidGV4dFwiLCB4OiBudW1iZXIsIHk6IG51bWJlciwgczogc3RyaW5nKSA6IHtlbDogU1ZHVGV4dEVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwiY2lyY2xlXCIgfCBcImxpbmVcIiB8IFwidGV4dFwiLCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4Mj86IG51bWJlciB8IHN0cmluZywgeTI/OiBudW1iZXIpe1xuICBsZXQgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCB0YWcpXG4gIGlmICh0YWcgPT0gXCJjaXJjbGVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiY3hcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAxXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4ge1xuICAgICAgZWwsXG4gICAgICBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcImxpbmVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDFcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5MVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcIngyXCIsIHgyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkyXCIsIHkyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZVwiLCBcImdyYXlcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAwNVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0YWcgPT0gXCJ0ZXh0XCIpe1xuICAgIGVsLnNldEF0dHJpYnV0ZShcInhcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcblxuICAgIFxuICAgIGVsLnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgZWwudGV4dENvbnRlbnQgPSBTdHJpbmcoeDIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiMC4wM1wiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgXCJncmF5XCIpXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3ICggbW9kOiBNb2R1bGUgKSA6IEhUTUxFbGVtZW50IHtcblxuICBsZXQge3JvYWRtYXAsIE1BUFNJWkV9ID0gbW9kXG5cblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCB4ID0wIDsgeCA8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICBmb3IgKGxldCB5ID0gMDsgeTwgcm9hZG1hcC5wb2ludHMubGVuZ3RoOyB5Kyspe1xuICAgICAgaWYgKHggPT0geSkgY29udGludWVcbiAgICAgIGxldCBsZW4gPSByb2FkbWFwLmdldHJvYWQoeCx5KVxuICAgICAgaWYgKGxlbiA9PSAwIHx8IGxlbiA9PSB1bmRlZmluZWQpIGNvbnRpbnVlICBcblxuXG4gICAgICBsZXQgYSA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLnBvaW50c1t5XSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueC9NQVBTSVpFLCBhLnkvTUFQU0laRSwgYi54L01BUFNJWkUsIGIueS9NQVBTSVpFKS5lbFxuICAgICAgbGV0IGlkID0gXCJyb2FkXCIrcm9hZG1hcC5yb2FkSURYKHgseSlcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgeCA9MDsgeDxyb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAucG9pbnRzW3hdIVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueC9NQVBTSVpFLCBsb2MueS9NQVBTSVpFKS5lbFxuICAgIGVsZW1lbnRzLnNldCh4LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCB4KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubnVtYmVyXG4gICAgICAgIGlmIChsYXN0ICE9PSBudWxsKXtcbiAgICAgICAgICBsZXQgcGF0aCA9IHJvYWRtYXAuZmluZFBhdGgobGFzdCwgbmV4dClcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICAgICAgICAgIGxldCBBID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpXSFdIVxuICAgICAgICAgICAgbGV0IEIgPSByb2FkbWFwLnBvaW50c1twYXRoW2krMV0hXSFcbiAgICAgICAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueCwgQS55LCBCLngsIEIueSlcbiAgICAgICAgICAgIGxpbmUuc2V0Q29sb3Iobi5jb2xvciA/PyBcIiNmZmM5ODhcIilcbiAgICAgICAgICAgIGxpbmUuZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMVwiKVxuICAgICAgICAgICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwXCIpXG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxpbmUuZWwpXG4gICAgICAgICAgICBoaW50cy5wdXNoKHtyZW1vdmU6ICgpPT5saW5lLmVsLnJlbW92ZSgpfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGFzdCA9IG5leHRcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGlmIChwLmxvZ28pIHtcbiAgICAgICAgICBsZXQgcG9zID0gcm9hZG1hcC5wb2ludHNbcC5udW1iZXJdIVxuICAgICAgICAgIGxldCBlbCA9IG1rU3ZnKFwidGV4dFwiLCBwb3MueCwgcG9zLnksIHAubG9nbylcbiAgICAgICAgICBlbC5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwMFwiKVxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZWwuZWwpXG4gICAgICAgICAgaGludHMucHVzaChlbC5lbClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBsZXQgZHYgPSBkaXYoc3R5bGUoe3dpZHRoOlwiMTAwJVwiLCBkaXNwbGF5OlwiZmxleFwiLCBqdXN0aWZ5Q29udGVudDpcImNlbnRlclwiLCBwYWRkaW5nOiBcIjFlbVwifSkpXG4gIGR2LmFwcGVuZChlbGVtZW50KVxuXG5cbiAgcmV0dXJuIGR2XG59XG5cblxuIiwKICAgICJcblxuXG5sZXQgUkFORFNFRUQgPSAwXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRSYW5kU2VlZChzZWVkOiBudW1iZXIpe1xuICBSQU5EU0VFRCA9IHNlZWRcbiAgUkFORFNFRUQgPSByYW5kSW50KDAsIDEwMDAwKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhwb3J0U3RhdGUgKCkge3JldHVybiBSQU5EU0VFRH1cbmV4cG9ydCBmdW5jdGlvbiBsb2FkU3RhdGUgKHNlZWQ6IG51bWJlcikge1JBTkRTRUVEID0gc2VlZH1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSgpe1xuICBsZXQgeCA9IE1hdGguc2luKFJBTkRTRUVEKyspICogMTAwMDA7XG4gIHJldHVybiB4IC0gTWF0aC5mbG9vcih4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRJbnQobWluOiBudW1iZXIsIG1heDogbnVtYmVyKXtcbiAgcmV0dXJuIE1hdGguZmxvb3IocmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRDaG9pY2U8VD4oYXJyOiBUW10pOiBUIHtcbiAgcmV0dXJuIGFycltyYW5kSW50KDAsIGFyci5sZW5ndGgpXSFcbn1cblxuIiwKICAgICJpbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcblxuXG5leHBvcnQgdHlwZSBQb3MgPSB7eDpudW1iZXIsIHk6IG51bWJlcn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tTWFwIChOUE9JTlRTOm51bWJlciwgTUFQU0laRTpudW1iZXIpe1xuXG4gIGxldCBIUE9JTlQgPSBOUE9JTlRTLzJcbiAgbGV0IFJTSVpFID0gTlBPSU5UUyAqIEhQT0lOVFxuXG5cbiAgbGV0IHJvYWRzID0gbmV3IFVpbnQxNkFycmF5KFJTSVpFKVxuXG4gIGZ1bmN0aW9uIHJvYWRJRFggIChhOm51bWJlciwgYjpudW1iZXIpe1xuICAgIGlmIChhPGIpIFthLGJdID0gW2IsYV1cbiAgICBsZXQgaWR4ID0gYSArIE5QT0lOVFMgKiBiXG4gICAgaWYgKGlkeD5SU0laRSkgaWR4ID0gTlBPSU5UUyoqMiAtIGlkeFxuXG4gICAgcmV0dXJuIGlkeCBcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldHJvYWQgKGE6IG51bWJlciwgYjogbnVtYmVyKSB7XG4gICAgaWYgKGE9PWIpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBnZXQgcm9hZCBmcm9tIGEgcG9pbnQgdG8gaXRzZWxmXCIpXG4gICAgcmV0dXJuIHJvYWRzW3JvYWRJRFgoYSxiKV0hXG4gIH1cblxuICBsZXQgcm9kczoge2E6bnVtYmVyLGI6bnVtYmVyLCBkaXN0Om51bWJlcn1bXSA9IFtdXG5cbiAgZnVuY3Rpb24gc2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIsIGRpc3Q6IG51bWJlcikge1xuXG4gICAgcm9kcy5wdXNoKHthLGIsZGlzdH0pXG4gICAgaWYgKGE9PWIpIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzZXQgcm9hZCBmcm9tIGEgcG9pbnQgdG8gaXRzZWxmXCIpXG4gICAgcm9hZHNbcm9hZElEWChhLGIpXSA9IGRpc3RcbiAgfVxuXG4gIGxldCByYW5nZSA9IEFycmF5LmZyb20oe2xlbmd0aDogTlBPSU5UU30sIChfLGkpPT4gaSlcbiAgbGV0IHBvaW50cyA6IFBvc1tdID0gcmFuZ2UubWFwKCgpPT4oe3g6IHJhbmRJbnQoMCxNQVBTSVpFKSwgeTogcmFuZEludCgwLE1BUFNJWkUpfSkpXG4gIGxldCBuZWlnaHMgPSBwb2ludHMubWFwKChwcyxpKT0+XG4gICAgcG9pbnRzLm1hcCgocDIsIGkyKT0+ICAoe2Q6IE1hdGguZmxvb3IoTWF0aC5oeXBvdChwcy54IC0gcDIueCwgcHMueSAtIHAyLnkpKSwgaTogaTJ9KSlcbiAgICAuZmlsdGVyKHggPT4geC5pICE9IGkpIC5zb3J0KChhLGIpPT4gYS5kIC0gYi5kKSApXG5cblxuICBsZXQgZm91bmQgPSBuZXcgU2V0PG51bWJlcj4oWzBdKVxuICBmdW5jdGlvbiBmaW5kKHg6bnVtYmVyKXtcblxuICAgIGlmIChmb3VuZC5oYXMoeCkpIHJldHVyblxuICAgIGZvdW5kLmFkZCh4KVxuICAgIHJhbmdlLmZvckVhY2goKHAsaSk9PntcbiAgICAgIGlmICggaSE9eCAmJiBnZXRyb2FkKGksIHgpICE9IDApIGZpbmQoaSlcbiAgICB9KVxuICB9XG5cbiAgZm9yIChsZXQgeCA9IDA7IHggPCBOUE9JTlRTOyB4Kyspe1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKXtcbiAgICAgIGxldCB4ID0gcmFuZEludCgwLCBOUE9JTlRTKVxuICAgICAgbGV0IG54ID0gbmVpZ2hzW3hdPy5baV0hXG4gICAgICBzZXRyb2FkKHgsIG54LmksIG54LmQpXG4gICAgICBpZiAoZm91bmQuaGFzKHgpKSBmaW5kKG54LmkpXG4gICAgICBpZiAoZm91bmQuaGFzKG54LmkpKSBmaW5kKHgpXG4gICAgfVxuICB9XG5cblxuXG5cbiAgY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBVaW50MzJBcnJheShSU0laRSk7XG5cbiAge1xuICBcbiAgICBjb25zdCBwb2ludENvdW50ID0gcG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBJTkYgPSAweGZmZmY7XG4gIFxuICAgIENvc3RNYXRyaXguZmlsbChJTkYpO1xuICBcbiAgICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgICAgY29uc3QgZGlzdCA9IG5ldyBVaW50MzJBcnJheShwb2ludENvdW50KTtcbiAgICAgIGNvbnN0IHZpc2l0ZWQgPSBuZXcgVWludDhBcnJheShwb2ludENvdW50KTtcbiAgICAgIGRpc3QuZmlsbChJTkYpO1xuICAgICAgZGlzdFtzdGFydF0gPSAwO1xuICBcbiAgICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICAgIGxldCBjdXJyZW50ID0gLTE7XG4gICAgICAgIGxldCBiZXN0ID0gSU5GO1xuICBcbiAgICAgICAgZm9yIChsZXQgbm9kZSA9IDA7IG5vZGUgPCBwb2ludENvdW50OyBub2RlKyspIHtcbiAgICAgICAgICBpZiAodmlzaXRlZFtub2RlXSA9PT0gMCAmJiBkaXN0W25vZGVdISA8IGJlc3QpIHtcbiAgICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICBcbiAgICAgICAgaWYgKGN1cnJlbnQgPT09IC0xKSBicmVhaztcbiAgICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG4gIFxuICAgICAgICBmb3IgKGxldCBuZXh0ID0gMDsgbmV4dCA8IHBvaW50Q291bnQ7IG5leHQrKykge1xuICAgICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCByb2FkID0gZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgICBpZiAocm9hZCA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgY29uc3QgbmV4dENvc3QgPSBkaXN0W2N1cnJlbnRdISArIHJvYWQ7XG4gICAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICAgIGRpc3RbbmV4dF0gPSBuZXh0Q29zdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgICBpZiAoZW5kID09PSBzdGFydCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGlkeCA9IHJvYWRJRFgoc3RhcnQsIGVuZCk7XG4gICAgICAgIENvc3RNYXRyaXhbaWR4XSA9IE1hdGgubWluKGRpc3RbZW5kXSEsIElORik7XG4gICAgICB9XG4gICAgfVxuICBcbiAgfVxuXG5cblxuICBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuXG4gICAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgICBsZXQgY29zdCA9IENvc3RNYXRyaXhbcm9hZElEWChzdGFydCxlbmQpXVxuICAgIHdoaWxlIChzdGFydCAhPSBlbmQpe1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBwb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgICAgICBpZiAoeCA9PSBzdGFydCkgY29udGludWVcbiAgICAgICAgbGV0IHJvYWQgPSBnZXRyb2FkKHN0YXJ0LHgpXG4gICAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICAgIGxldCByZXN0Y29zdCA9IENvc3RNYXRyaXhbcm9hZElEWCh4LGVuZCldIVxuICAgICAgICBpZiAocm9hZCsgcmVzdGNvc3QgPT0gY29zdCl7XG4gICAgICAgICAgY29zdCA9IHJlc3Rjb3N0XG4gICAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgICAgcGF0aC5wdXNoKHgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aFxuICB9XG4gIFxuICBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgXG4gICAgbGV0IGNvc3QgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgY29zdCArPSBDb3N0TWF0cml4W3JvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gICAgfVxuICAgIHJldHVybiBjb3N0O1xuICB9XG5cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlLCBDb3N0TWF0cml4LCBmaW5kUGF0aCwgZ2V0Q29zdE59XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG5cbiIsCiAgICAidHlwZSBKc29uVmFsdWUgPVxuICB8IHN0cmluZ1xuICB8IG51bWJlclxuICB8IGJvb2xlYW5cbiAgfCBudWxsXG4gIHwgeyBba2V5OiBzdHJpbmddOiBKc29uVmFsdWUgfVxuICB8IEpzb25WYWx1ZVtdXG5cbnR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cblxuY29uc3QgdHlwZU5hbWUgPSAodmFsdWU6IHVua25vd24pOiBzdHJpbmcgPT4ge1xuICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiBcIm51bGxcIlxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiBcImFycmF5XCJcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZVxufVxuXG5jb25zdCBwYXRoTGFiZWwgPSAocGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHBhdGggfHwgXCIkXCJcblxuY29uc3QgZmFpbCA9IChwYXRoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyk6IG5ldmVyID0+IHtcbiAgdGhyb3cgbmV3IEVycm9yKGBWYWxpZGF0aW9uIGVycm9yIGF0ICR7cGF0aExhYmVsKHBhdGgpfTogJHttZXNzYWdlfWApXG59XG5cbmNvbnN0IGlzUGxhaW5PYmplY3QgPSAodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9PlxuICB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpXG5cbmNvbnN0IGRlZXBFcXVhbCA9IChsZWZ0OiB1bmtub3duLCByaWdodDogdW5rbm93bik6IGJvb2xlYW4gPT4ge1xuICBpZiAoT2JqZWN0LmlzKGxlZnQsIHJpZ2h0KSkgcmV0dXJuIHRydWVcbiAgaWYgKEFycmF5LmlzQXJyYXkobGVmdCkgJiYgQXJyYXkuaXNBcnJheShyaWdodCkpIHtcbiAgICByZXR1cm4gbGVmdC5sZW5ndGggPT09IHJpZ2h0Lmxlbmd0aCAmJiBsZWZ0LmV2ZXJ5KCh2YWx1ZSwgaW5kZXgpID0+IGRlZXBFcXVhbCh2YWx1ZSwgcmlnaHRbaW5kZXhdKSlcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdChsZWZ0KSAmJiBpc1BsYWluT2JqZWN0KHJpZ2h0KSkge1xuICAgIGNvbnN0IGxlZnRLZXlzID0gT2JqZWN0LmtleXMobGVmdClcbiAgICBjb25zdCByaWdodEtleXMgPSBPYmplY3Qua2V5cyhyaWdodClcbiAgICByZXR1cm4gbGVmdEtleXMubGVuZ3RoID09PSByaWdodEtleXMubGVuZ3RoXG4gICAgICAmJiBsZWZ0S2V5cy5ldmVyeShrZXkgPT4ga2V5IGluIHJpZ2h0ICYmIGRlZXBFcXVhbChsZWZ0W2tleV0sIHJpZ2h0W2tleV0pKVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5jb25zdCBhcHBlbmRQYXRoID0gKHBhdGg6IHN0cmluZywgcGFydDogc3RyaW5nKTogc3RyaW5nID0+XG4gIHBhdGggPyBgJHtwYXRofSR7cGFydH1gIDogYCQke3BhcnR9YFxuXG5jb25zdCB2YWxpZGF0ZU9iamVjdCA9IChzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgb2JqZWN0LCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgY29uc3Qgb2JqZWN0VmFsdWUgPSB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuXG4gIGNvbnN0IHByb3BlcnRpZXMgPSBpc1BsYWluT2JqZWN0KHNjaGVtYS5wcm9wZXJ0aWVzKSA/IHNjaGVtYS5wcm9wZXJ0aWVzIDoge31cbiAgY29uc3QgcmVxdWlyZWQgPSBBcnJheS5pc0FycmF5KHNjaGVtYS5yZXF1aXJlZCkgPyBzY2hlbWEucmVxdWlyZWQgOiBbXVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIHJlcXVpcmVkKSB7XG4gICAgaWYgKHR5cGVvZiBrZXkgIT09IFwic3RyaW5nXCIpIGNvbnRpbnVlXG4gICAgaWYgKCEoa2V5IGluIG9iamVjdFZhbHVlKSkgZmFpbChhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCksIFwiaXMgcmVxdWlyZWRcIilcbiAgfVxuXG4gIGZvciAoY29uc3QgW2tleSwgcHJvcGVydHlTY2hlbWFdIG9mIE9iamVjdC5lbnRyaWVzKHByb3BlcnRpZXMpKSB7XG4gICAgaWYgKCEoa2V5IGluIG9iamVjdFZhbHVlKSkgY29udGludWVcbiAgICBpZiAoIWlzUGxhaW5PYmplY3QocHJvcGVydHlTY2hlbWEpKSBjb250aW51ZVxuICAgIHZhbGlkYXRlSnNvblNjaGVtYShwcm9wZXJ0eVNjaGVtYSBhcyBKU09OU2NoZW1hLCBvYmplY3RWYWx1ZVtrZXldLCBhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCkpXG4gIH1cblxuICBjb25zdCBleHRyYUtleXMgPSBPYmplY3Qua2V5cyhvYmplY3RWYWx1ZSkuZmlsdGVyKGtleSA9PiAhKGtleSBpbiBwcm9wZXJ0aWVzKSlcbiAgY29uc3QgYWRkaXRpb25hbCA9IHNjaGVtYS5hZGRpdGlvbmFsUHJvcGVydGllc1xuICBpZiAoYWRkaXRpb25hbCA9PT0gZmFsc2UpIHtcbiAgICBpZiAoZXh0cmFLZXlzLmxlbmd0aCA+IDApIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7ZXh0cmFLZXlzWzBdfWApLCBcImFkZGl0aW9uYWwgcHJvcGVydGllcyBhcmUgbm90IGFsbG93ZWRcIilcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmIChpc1BsYWluT2JqZWN0KGFkZGl0aW9uYWwpKSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgZXh0cmFLZXlzKSB7XG4gICAgICB2YWxpZGF0ZUpzb25TY2hlbWEoYWRkaXRpb25hbCBhcyBKU09OU2NoZW1hLCBvYmplY3RWYWx1ZVtrZXldLCBhcHBlbmRQYXRoKHBhdGgsIGAuJHtrZXl9YCkpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IHZhbGlkYXRlQXJyYXkgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIGFycmF5LCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgY29uc3QgYXJyYXlWYWx1ZSA9IHZhbHVlIGFzIHVua25vd25bXVxuICBpZiAoIWlzUGxhaW5PYmplY3Qoc2NoZW1hLml0ZW1zKSkgcmV0dXJuXG4gIGFycmF5VmFsdWUuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHZhbGlkYXRlSnNvblNjaGVtYShzY2hlbWEuaXRlbXMgYXMgSlNPTlNjaGVtYSwgaXRlbSwgYXBwZW5kUGF0aChwYXRoLCBgWyR7aW5kZXh9XWApKSlcbn1cblxuY29uc3QgdmFsaWRhdGVCeVR5cGUgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIHN3aXRjaCAoc2NoZW1hLnR5cGUpIHtcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBzdHJpbmcsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJudW1iZXJcIiB8fCBOdW1iZXIuaXNOYU4odmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudW1iZXIsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwiYm9vbGVhblwiKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBib29sZWFuLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudWxsXCI6XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG51bGwsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImFycmF5XCI6XG4gICAgICB2YWxpZGF0ZUFycmF5KHNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICB2YWxpZGF0ZU9iamVjdChzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICByZXR1cm5cbiAgICBkZWZhdWx0OlxuICAgICAgZmFpbChwYXRoLCBgdW5zdXBwb3J0ZWQgc2NoZW1hIHR5cGUgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEudHlwZSl9YClcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGVKc29uU2NoZW1hID0gPFQ+KHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGggPSBcIlwiKTogVCA9PiB7XG4gIGlmIChcImNvbnN0XCIgaW4gc2NoZW1hICYmICFkZWVwRXF1YWwodmFsdWUsIHNjaGVtYS5jb25zdCkpIHtcbiAgICBmYWlsKHBhdGgsIGBleHBlY3RlZCBjb25zdGFudCAke0pTT04uc3RyaW5naWZ5KHNjaGVtYS5jb25zdCl9YClcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbnlPZikpIHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW11cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzY2hlbWEuYW55T2YpIHtcbiAgICAgIGlmICghaXNQbGFpbk9iamVjdChvcHRpb24pKSBjb250aW51ZVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpXG4gICAgICB9XG4gICAgfVxuICAgIGZhaWwocGF0aCwgZXJyb3JzWzBdID8/IFwiZGlkIG5vdCBtYXRjaCBhbnkgYWxsb3dlZCBzY2hlbWFcIilcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYS5hbGxPZikpIHtcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzY2hlbWEuYWxsT2YpIHtcbiAgICAgIGlmICghaXNQbGFpbk9iamVjdChvcHRpb24pKSBjb250aW51ZVxuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKG9wdGlvbiBhcyBKU09OU2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICB9XG4gIH1cblxuICB2YWxpZGF0ZUJ5VHlwZShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICByZXR1cm4gdmFsdWUgYXMgVFxufVxuIiwKICAgICJpbXBvcnQgeyB2YWxpZGF0ZUpzb25TY2hlbWEgfSBmcm9tIFwiLi9qc29uc2NoZW1hXCJcblxuXG5leHBvcnQgdHlwZSBKU09OU2NoZW1hID0geyBba2V5OiBzdHJpbmddOiBKc29uRGF0YSB9XG5cblxuZXhwb3J0IHR5cGUgSnNvbkRhdGEgPSBzdHJpbmcgfCBudWxsIHwgbnVtYmVyIHwgYm9vbGVhbiB8IHsgW2tleSBpbiBzdHJpbmddOiBKc29uRGF0YSB9IHwgSnNvbkRhdGFbXVxuXG5leHBvcnQgdHlwZSBTY2hlbWE8VD4gPSB7IGpzb246IEpTT05TY2hlbWEgfVxuXG5leHBvcnQgdHlwZSBJbmZlcjxTPiA9IFMgZXh0ZW5kcyBTY2hlbWE8aW5mZXIgVD4gPyBUIDogbmV2ZXJcblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlID0gPFQ+IChzY2hlbWE6IFNjaGVtYTxUPiwgZGF0YTp1bmtub3duKSA6IFQgPT4ge1xuICByZXR1cm4gdmFsaWRhdGVKc29uU2NoZW1hPFQ+KHNjaGVtYS5qc29uLCBkYXRhKVxufVxuXG5leHBvcnQgY29uc3Qgc3RyaW5naWZ5ID0gKGRhdGE6IEpzb25EYXRhKTogc3RyaW5nID0+IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpXG5cblxuZXhwb3J0IGNvbnN0IGZpbGxTY2hlbWEgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogVCA9PntcbiAgbGV0IGpzb24gPSBzY2hlbWEuanNvblxuICBpZiAoanNvbi50eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBcIlwiIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm51bWJlclwiKSByZXR1cm4gMCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBmYWxzZSBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudWxsXCIpIHJldHVybiBudWxsIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcImFycmF5XCIpIHJldHVybiBbXSBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBqc29uLnByb3BlcnRpZXMpe1xuICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge31cbiAgICBsZXQgcmVxdWlyZWQgPSBBcnJheS5pc0FycmF5KGpzb24ucmVxdWlyZWQpID8ganNvbi5yZXF1aXJlZCBhcyBzdHJpbmdbXSA6IFtdXG4gICAgZm9yIChsZXQgcmVxIG9mIHJlcXVpcmVkKVxuICAgICAgcmVzdWx0W3JlcV0gPSBmaWxsU2NoZW1hKHtqc29uOiAoanNvbi5wcm9wZXJ0aWVzIGFzIGFueSlbcmVxXX0pXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG4gIGlmIChcImNvbnN0XCIgaW4ganNvbikgcmV0dXJuIGpzb24uY29uc3QgYXMgVFxuICBpZiAoXCJhbnlPZlwiIGluIGpzb24gJiYgQXJyYXkuaXNBcnJheShqc29uLmFueU9mKSkgcmV0dXJuIGZpbGxTY2hlbWEoe2pzb246IGpzb24uYW55T2ZbMF0gYXMgSlNPTlNjaGVtYX0pIGFzIFRcbiAgcmV0dXJuIG51bGwgYXMgVFxufVxuXG5leHBvcnQgY29uc3QgZnJvbUpzb25TY2hlbWEgPSA8VD4gKGpzb246IEpTT05TY2hlbWEpOiBTY2hlbWE8VD4gPT4gKHtqc29ufSlcblxuZXhwb3J0IGNvbnN0IHN0cmluZzogU2NoZW1hPHN0cmluZz4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJzdHJpbmdcIn0pXG5leHBvcnQgY29uc3QgbnVtYmVyOiBTY2hlbWE8bnVtYmVyPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm51bWJlclwifSlcbmV4cG9ydCBjb25zdCBib29sZWFuOiBTY2hlbWE8Ym9vbGVhbj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJib29sZWFuXCJ9KVxuZXhwb3J0IGNvbnN0IG51bGxTY2hlbWEgOiBTY2hlbWE8bnVsbD4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudWxsXCJ9KVxuZXhwb3J0IGNvbnN0IGFueTogU2NoZW1hPGFueT4gPSBmcm9tSnNvblNjaGVtYSh7fSlcbmV4cG9ydCBjb25zdCBvcHRpb25hbCA9IDxUPihzY2hlbWE6IFNjaGVtYTxUPikgOiBTY2hlbWE8VCB8IG51bGw+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogW3t0eXBlOiBcIm51bGxcIn0sIHNjaGVtYS5qc29uXX0pXG5leHBvcnQgY29uc3QgYXJyYXkgPSA8VD4oaXRlbVNjaGVtYTogU2NoZW1hPFQ+KTogU2NoZW1hPFRbXT4gPT4gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYXJyYXlcIiwgaXRlbXM6IGl0ZW1TY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3QgY29uc3RhbnQgPSA8VCBleHRlbmRzIHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4+KHZhbHVlOiBUKTogU2NoZW1hPFQ+ID0+IGZyb21Kc29uU2NoZW1hKHtjb25zdDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3Qgb2JqZWN0ID0gPFMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBTY2hlbWE8YW55Pj4+IChzaGFwZTogUyk6IFNjaGVtYTx7W0sgaW4ga2V5b2YgU106IEluZmVyPFNbS10+fT4gPT4gZnJvbUpzb25TY2hlbWEoe1xuICB0eXBlOiBcIm9iamVjdFwiLFxuICBwcm9wZXJ0aWVzOiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMoc2hhcGUpLm1hcCgoW2tleSwgZmllbGRdKT0+IFtrZXksIGZpZWxkLmpzb25dKSksXG4gIHJlcXVpcmVkOiBPYmplY3Qua2V5cyhzaGFwZSlcbn0pXG5cbmV4cG9ydCBjb25zdCByZWNvcmQgPSA8VD4odmFsdWVTY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxSZWNvcmQ8c3RyaW5nLCBUPj4gPT4gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwib2JqZWN0XCIsIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB2YWx1ZVNjaGVtYS5qc29ufSlcbmV4cG9ydCBjb25zdCBzY2hlbWFTY2hlbWEgOiBTY2hlbWE8SlNPTlNjaGVtYT4gPSByZWNvcmQoYW55KVxuXG5leHBvcnQgY29uc3QgdW5pb24gPSA8UyBleHRlbmRzIFNjaGVtYTxhbnk+W10+KC4uLnNjaGVtYXM6IFMpOiBTY2hlbWE8SW5mZXI8U1tudW1iZXJdPj4gPT4gZnJvbUpzb25TY2hlbWEoe2FueU9mOiBzY2hlbWFzLm1hcChzPT4gcy5qc29uKX0pXG5cbmV4cG9ydCBmdW5jdGlvbiB0YWdnZWQgPFMgZXh0ZW5kcyB7W2tleSA6IHN0cmluZ106IFNjaGVtYTxhbnk+fT4gKGZpZWxkczogUykgOiBTY2hlbWE8e1trZXkgaW4ga2V5b2YgU106IHskOiBrZXksIHZhbDpJbmZlcjxTW2tleV0+fSB9W2tleW9mIFNdPiB7XG4gIHJldHVybiB1bmlvbiguLi5PYmplY3QuZW50cmllcyhmaWVsZHMpLm1hcCgoWyQsdmFsXSk9Pm9iamVjdCh7JDpjb25zdGFudCgkKSx2YWx9KSkpXG59XG5cblxuXG5cbmV4cG9ydCBjb25zdCBpbnRlcnNlY3Rpb24gPSA8UyBleHRlbmRzIFNjaGVtYTxhbnk+W10+KC4uLnNjaGVtYXM6IFMpOiBTY2hlbWE8SW5mZXI8U1tudW1iZXJdPj4gPT4gZnJvbUpzb25TY2hlbWEoe2FsbE9mOiBzY2hlbWFzLm1hcChzPT4gcy5qc29uKX0pXG5cbmV4cG9ydCBjb25zdCBhc1R5cGVWaWV3ID0gKHNjaGVtYTogU2NoZW1hPGFueT4pOiBzdHJpbmcgPT4ge1xuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJzdHJpbmdcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bWJlclwiKSByZXR1cm4gXCJudW1iZXJcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcImJvb2xlYW5cIikgcmV0dXJuIFwiYm9vbGVhblwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJhcnJheVwiICYmIHNjaGVtYS5qc29uLml0ZW1zKSByZXR1cm4gYCR7YXNUeXBlVmlldyh7anNvbjogc2NoZW1hLmpzb24uaXRlbXMgYXMgSlNPTlNjaGVtYX0pfVtdYFxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm9iamVjdFwiICYmIHNjaGVtYS5qc29uLnByb3BlcnRpZXMpe1xuICAgIGxldCBwcm9wcyA9IE9iamVjdC5lbnRyaWVzKHNjaGVtYS5qc29uLnByb3BlcnRpZXMpLm1hcCgoW2tleSwgcHJvcF0pPT4gYCR7a2V5fTogJHthc1R5cGVWaWV3KHtqc29uOiBwcm9wIGFzIEpTT05TY2hlbWF9KX1gKVxuICAgIHJldHVybiBge1xcbiAgJHtwcm9wcy5qb2luKFwiLFxcblwiKS5yZXBsYWNlQWxsKFwiXFxuXCIsIFwiXFxuICBcIil9XFxufWBcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYS5qc29uKSByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc2NoZW1hLmpzb24uY29uc3QpXG4gIGlmIChcImFueU9mXCIgaW4gc2NoZW1hLmpzb24gJiYgQXJyYXkuaXNBcnJheShzY2hlbWEuanNvbi5hbnlPZikpIHJldHVybiBzY2hlbWEuanNvbi5hbnlPZi5tYXAocz0+IGFzVHlwZVZpZXcoe2pzb246IHMgYXMgSlNPTlNjaGVtYX0pKS5qb2luKFwiIHwgXCIpXG4gIHJldHVybiBcImFueVwiXG59XG5cblxuIiwKICAgICJpbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgYXJyYXksIGJvb2xlYW4sIGNvbnN0YW50LCBudW1iZXIsIG9iamVjdCwgc3RyaW5nLCB0YWdnZWQsIHVuaW9uLCB0eXBlIEluZmVyLCB0eXBlIFNjaGVtYSB9IGZyb20gXCIuL3NjaGVtYVwiO1xuXG5leHBvcnQgdHlwZSBVVUlEID0gYHUke3N0cmluZ30tJHtzdHJpbmd9YFxuZXhwb3J0IGNvbnN0IFVVSUQgOiBTY2hlbWE8VVVJRD4gPSBzdHJpbmdcblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbVVVSUQoKSB7cmV0dXJuIFwidVwiICsgcmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIsMTApICsgXCItXCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgYXMgVVVJRH1cblxuXG5leHBvcnQgY29uc3QgUmVxdWVzdCA9IG9iamVjdCh7XG4gIGlkOiBVVUlELFxuICBzdGFydFBvaW50OiBudW1iZXIsXG4gIGVuZFBvaW50OiBudW1iZXIsXG4gIHZhbHVlX2V1cjogbnVtYmVyLFxuICBkZWFkbGluZV9oOiBudW1iZXIsXG59KVxuXG5leHBvcnQgY29uc3QgVHJhbnNwb3J0ZXIgPSBvYmplY3QoeyBpZDogVVVJRCwgcG9zaXRpb246IFVVSUQsIH0pXG5cbmV4cG9ydCBjb25zdCBTY2hlZHVsZVN0ZXAgPSB0YWdnZWQoe1xuICBwaWNrdXA6IG9iamVjdCh7cmVxdWVzdDogVVVJRCwgcG9zOiBudW1iZXIsIGRlY2s6IHVuaW9uKGNvbnN0YW50KDApLCBjb25zdGFudCgxKSl9KSxcbiAgZGVsaXZlcjogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlcn0pLFxuICBzdGFydDogb2JqZWN0KHtwb3M6IG51bWJlcn0pLFxufSlcbmV4cG9ydCBjb25zdCBTY2hlZHVsZUl0ZW0gPSBvYmplY3Qoe1xuICB0cmFuc3BvcnRlcjogVVVJRCxcbiAgc3RlcHM6IGFycmF5KFNjaGVkdWxlU3RlcCksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlID0gYXJyYXkoU2NoZWR1bGVJdGVtKVxuXG5leHBvcnQgY29uc3QgTW9kdWxlID0gb2JqZWN0KHtcblxuICByZXF1ZXN0czogYXJyYXkoUmVxdWVzdCksXG4gIHRyYW5zcG9ydGVyczogYXJyYXkoVHJhbnNwb3J0ZXIpLFxuICBzY2hlZHVsZTogU2NoZWR1bGUsXG5cbn0pXG5cbmV4cG9ydCB0eXBlIFJlcXVlc3QgPSBJbmZlcjx0eXBlb2YgUmVxdWVzdD5cbmV4cG9ydCB0eXBlIFRyYW5zcG9ydGVyID0gSW5mZXI8dHlwZW9mIFRyYW5zcG9ydGVyPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVTdGVwID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlU3RlcD5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlSXRlbSA9IEluZmVyPHR5cGVvZiBTY2hlZHVsZUl0ZW0+XG5leHBvcnQgdHlwZSBTY2hlZHVsZSA9IEluZmVyPHR5cGVvZiBTY2hlZHVsZT5cblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tTW9kdWxlIChcbiAgTlJFUVMgPSA0MCxcbiAgTlRSQU5TID0gMTAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgXCJkZWFkbGluZV9oXCIgOiByYW5kSW50KDAsIE1hdGguZmxvb3IoIHJhbmRvbSgpKiBNQVBTSVpFKjQpKSxcbiAgICAgIFwic3RhcnRQb2ludFwiOiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIFwiZW5kUG9pbnRcIjogcmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIsXG4gICAgICBcInZhbHVlX2V1clwiOiByYW5kSW50KDAsIDEwMDApLFxuICAgIH0pIGFzIFJlcXVlc3QpLFxuICAgIHN0YXJ0cG9zaXRpb25zOiBBcnJheS5mcm9tKHtsZW5ndGg6TlRSQU5TfSwgKF8saSk9PnJhbmRDaG9pY2Uocm9hZG1hcC5yYW5nZSkgYXMgbnVtYmVyKSxcbiAgfVxufVxuXG5cbmV4cG9ydCB0eXBlIE1vZHVsZSA9IHR5cGVvZiByYW5kb21Nb2R1bGUgZXh0ZW5kcyAoLi4ueDphbnkpID0+IChpbmZlciBUKSA/IFQgOiBuZXZlclxuXG4iLAogICAgImltcG9ydCB7IHZhbGlkYXRlLCB0eXBlIEpzb25EYXRhLCB0eXBlIFNjaGVtYSB9IGZyb20gXCIuL3NjaGVtYVwiXG5cblxuXG5leHBvcnQgZnVuY3Rpb24gbWtXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ICh2YWx1ZTogVCkge1xuXG4gIGxldCBsaXN0ZW5lcnM6ICgobmV3VmFsdWU6IFQsIG9sZFZhbHVlOiBUKT0+dm9pZClbXSA9IFtdXG4gIGxldCByZXAgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcblxuICBsZXQgcmVzID0ge1xuICAgIGdldDogKCkgPT4gdmFsdWUsXG4gICAgc2V0OiAobmV3VmFsdWU6IFQpID0+IHtcbiAgICAgIGxldCBuZXdSZXAgPSBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSlcbiAgICAgIGlmIChuZXdSZXAgPT09IHJlcCkgcmV0dXJuXG4gICAgICByZXAgPSBuZXdSZXBcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIobmV3VmFsdWUsIHZhbHVlKSlcbiAgICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICB9LFxuICAgIG9udXBkYXRlOiAobGlzdGVuZXI6IChuZXdWYWx1ZTogVCwgb2xkVmFsdWUgOlQpPT52b2lkLCBkZWZlcnJlZCA9IGZhbHNlKSA9PiB7XG4gICAgICBpZiAoIWRlZmVycmVkKSBsaXN0ZW5lcih2YWx1ZSwgdmFsdWUpXG4gICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcilcbiAgICB9LFxuICAgIHVwZGF0ZTogKGNhbGxiYWNrOiAob2xkVmFsdWU6IFQpPT5UIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgICBsZXQgbmV3VmFsdWUgPSBjYWxsYmFjayh2YWx1ZSkgPz8gdmFsdWVcbiAgICAgIHJlcy5zZXQobmV3VmFsdWUpXG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gcmVzXG5cbn1cblxuZXhwb3J0IHR5cGUgV3JpdGFibGU8VCBleHRlbmRzIEpzb25EYXRhPiA9IFJldHVyblR5cGU8dHlwZW9mIG1rV3JpdGFibGU8VD4+XG5cbmV4cG9ydCBmdW5jdGlvbiBta1N0b3JlZCA8VCBleHRlbmRzIEpzb25EYXRhPiAoa2V5OiBzdHJpbmcsIHNjaGVtYTogU2NoZW1hPFQ+LCBkZWZhdWx0VmFsdWU6IFQpIHtcbiAgbGV0IHZhbCA9IGRlZmF1bHRWYWx1ZVxuICB0cnl7XG4gICAgdmFsID0gdmFsaWRhdGUoc2NoZW1hLCBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkhKSlcbiAgfWNhdGNoe31cblxuICBsZXQgcmVzID0gbWtXcml0YWJsZTxUPih2YWwpXG4gIFxuICByZXMub251cGRhdGUoKG5ld1ZhbHVlKT0+e1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkobmV3VmFsdWUpKVxuICB9KVxuXG4gIHJldHVybiByZXNcbn1cblxuIiwKICAgICJpbXBvcnQgeyBBcHBsaWNhdGlvbiB9IGZyb20gXCJub3N0ci10b29scy9raW5kc1wiXG5cbmltcG9ydCB7IHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb21cIlxuaW1wb3J0IHsgY29sb3IsIGRpc3BsYXksIGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi4vdmlldy9odG1sXCJcbmltcG9ydCB0eXBlIHsgTW9kdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCJcblxuXG5mdW5jdGlvbiBpc2xvYWQoeDpudW1iZXIpe1xuICByZXR1cm4geCAmIDFcbn1cblxuZnVuY3Rpb24gZ2V0RGVjayh4Om51bWJlcil7XG4gIHJldHVybiAoeCAmIDIpID4+IDFcbn1cblxuZnVuY3Rpb24gZ2V0UmVxKHg6bnVtYmVyKXtcbiAgcmV0dXJuICh4ICYgMHhGRkZGKSA+PiAyXG59XG5cbmZ1bmN0aW9uIGdldFBvcyh4Om51bWJlcil7XG4gIHJldHVybiB4Pj4xNlxufVxuXG5cblxuY29uc3QgS01fQ09TVCA9IDAuMlxuY29uc3QgQVZHX1NQRUVEX0tNSCA9IDcwIFxuXG5leHBvcnQgZnVuY3Rpb24gc2ltcGxlQW5uZWFsaW5nKG1vZDogTW9kdWxlKXtcblxuICBjb25zdCB7TlJFUVMsIHJlcXVlc3RzLCBzdGFydHBvc2l0aW9ucywgTlRSQU5TLCByb2FkbWFwfSA9IG1vZFxuICBjb25zdCBUU0laRSA9IE1hdGguZmxvb3IoTlJFUVMgKiAyLjUgKyAxMClcblxuICBjb25zdCByZXFQaWNrdXBMb2NhdGlvbnMgICA9IG5ldyBVaW50MTZBcnJheShyZXF1ZXN0cy5tYXAocj0+ci5zdGFydFBvaW50KSlcbiAgY29uc3QgcmVxRGVsaXZlcnlMb2NhdGlvbnMgPSBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKHI9PnIuZW5kUG9pbnQpKVxuICBjb25zdCByZXFEZWFkbGluZXMgPSAgICAgICAgIG5ldyBVaW50MzJBcnJheShyZXF1ZXN0cy5tYXAocj0+ci5kZWFkbGluZV9oICogQVZHX1NQRUVEX0tNSCkpXG4gIGNvbnN0IHJlcVZhbHVlcyA9ICAgICAgICAgICAgbmV3IFVpbnQzMkFycmF5KHJlcXVlc3RzLm1hcChyPT5yLnZhbHVlX2V1ci8gS01fQ09TVCkpXG4gIGNvbnN0IHVuYXNzaWduZWQgPSBuZXcgSW50OEFycmF5KHJlcXVlc3RzLm1hcChyPT4xKSlcblxuICBjb25zdCB0cmFuU3RhcnQgPSBuZXcgVWludDE2QXJyYXkoc3RhcnRwb3NpdGlvbnMpXG4gIGNvbnN0IHNjaGVkdWxlID0gbmV3IFVpbnQzMkFycmF5KFRTSVpFICogTlRSQU5TKVxuICBjb25zdCBzY2hlZHVsZVNpemVzID0gbmV3IFVpbnQxNkFycmF5KE5UUkFOUylcblxuXG4gIGxldCBJTkYgPSAxPDwxNVxuXG4gIGZ1bmN0aW9uIHNjb3JlKHRyYW46bnVtYmVyKXtcbiAgICBsZXQgcmV3YXJkID0gMFxuICAgIGxldCBkdXJhdGlvbiA9IDBcbiAgICBsZXQgZGVja3M6IFtudW1iZXJbXSwgbnVtYmVyW11dID0gW1tdLCBbXV1cbiAgICBsZXQgcG9zID0gdHJhblN0YXJ0W3RyYW5dIVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZWR1bGVTaXplc1t0cmFuXSE7IGkrKyl7XG4gICAgICBsZXQgc3RlcCA9IHNjaGVkdWxlW3RyYW4gKiBUU0laRSArIGldIVxuICAgICAgY29uc3QgbG9hZCA9IGlzbG9hZChzdGVwKVxuICAgICAgY29uc3QgcmVxID0gZ2V0UmVxKHN0ZXApXG4gICAgICBjb25zdCBuZXh0cG9zID0gZ2V0UG9zKHN0ZXApXG4gICAgICBkdXJhdGlvbiArPSByb2FkbWFwLmdldENvc3ROKHBvcywgbmV4dHBvcylcbiAgICAgIHBvcyA9IG5leHRwb3NcbiAgICAgIGlmIChsb2FkKXtcbiAgICAgICAgbGV0IGRlY2sgPSBkZWNrc1tnZXREZWNrKHN0ZXApXSFcbiAgICAgICAgZGVjay5wdXNoKHJlcSlcbiAgICAgICAgaWYgKGRlY2subGVuZ3RoID4gMykgcmV0dXJuIC1JTkZcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hXG4gICAgICAgIGxldCBpZHggPSBkZWNrLmluZGV4T2YocmVxKVxuICAgICAgICBpZiAoaWR4ID09IC0xKSByZXR1cm4gLUlORlxuICAgICAgICBkZWNrLnNwbGljZShpZHgsIDEpXG4gICAgICAgIGlmIChkdXJhdGlvbiA8PSByZXFEZWFkbGluZXNbcmVxXSEpIHJld2FyZCArPSByZXFWYWx1ZXNbcmVxXSFcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmV3YXJkIC0gZHVyYXRpb25cbiAgfVxuXG4gIGNvbnN0IHNjaGVkdWxlUmF0aW5ncyA9IEludDMyQXJyYXkuZnJvbSh7bGVuZ3RoOiBOVFJBTlN9LCAoXywgaSk9PnNjb3JlKGkpKVxuXG4gIGZ1bmN0aW9uIHNldFJlcSh0cmFuOiBudW1iZXIsIGlkeDogbnVtYmVyLCBpc2xvYWQ6IDF8MCwgZGVjazogMXwwLCByZXE6IG51bWJlciwgcG9zOm51bWJlcil7XG4gICAgc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSA9IChpc2xvYWQgPDwgMCkgfCAoZGVjayA8PCAxKSB8IChyZXEgPDwgMikgfCAocG9zIDw8IDE2KVxuICB9XG5cblxuICBmdW5jdGlvbiBpbnNlcnRTdG9wcyh0cmFuOm51bWJlciwgc3RhcnQ6bnVtYmVyLCBlbmQ6IG51bWJlciwgZGVjazogMHwxLCByZXE6bnVtYmVyKXtcblxuICAgIGNvbnN0IG9mZnNldCA9IHRyYW4gKiBUU0laRVxuICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dIVxuICAgIHNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMlxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kICsgMiwgb2Zmc2V0ICsgZW5kLCBvZmZzZXQgKyBzaXplKVxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgZW5kICsgMSlcbiAgICBzZXRSZXEodHJhbiwgc3RhcnQsIDEsIGRlY2ssIHJlcSwgcmVxUGlja3VwTG9jYXRpb25zW3JlcV0hKVxuICAgIHNldFJlcSh0cmFuLCBlbmQgKyAxLCAwLCBkZWNrLCByZXEsIHJlcURlbGl2ZXJ5TG9jYXRpb25zW3JlcV0hKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlU3RvcHModHJhbjpudW1iZXIsIHN0YXJ0Om51bWJlciwgZW5kOiBudW1iZXIpe1xuICAgIGNvbnN0IG9mZnNldCA9IHRyYW4gKiBUU0laRVxuICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dIVxuICAgIHNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMlxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgZW5kKVxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kIC0gMSwgb2Zmc2V0ICsgZW5kICsgMSwgb2Zmc2V0ICsgc2l6ZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeUFzc2lnbigpe1xuICAgIGxldCB0cmFuID0gcmFuZEludCgwLCBOVFJBTlMpXG4gICAgbGV0IHNjaGVkc2l6ZSA9IHNjaGVkdWxlU2l6ZXNbdHJhbl0hXG5cbiAgICBsZXQgYSA9IHJhbmRJbnQoMCxzY2hlZHNpemUrMSlcbiAgICBsZXQgYiA9IE1hdGgubWluKHNjaGVkc2l6ZSwgcmFuZEludCgwLDQpICsgYSlcblxuICAgIGxldCByZXEgPSByYW5kSW50KDAsIE5SRVFTKVxuICAgIGlmICghdW5hc3NpZ25lZFtyZXFdKSByZXR1cm5cbiAgXG4gICAgaW5zZXJ0U3RvcHModHJhbiwgYSwgYiwgcmFuZG9tKCkgPiAuNSA/IDEgOiAwICwgcmVxKVxuICAgIGxldCBuZXdyYXRpbmcgPSBzY29yZSh0cmFuKVxuICAgIGlmIChuZXdyYXRpbmcgPCBzY2hlZHVsZVJhdGluZ3NbdHJhbl0hKXtcbiAgICAgIHJlbW92ZVN0b3BzKHRyYW4sIGEsIGIrMSlcbiAgICB9ZWxzZXtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld3JhdGluZ1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyeVVuYXNzaWduKCl7XG4gICAgbGV0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUylcbiAgICBsZXQgc2NoZWRzaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSFcbiAgICBpZiAoc2NoZWRzaXplIDwgMikgcmV0dXJuXG4gICAgbGV0IGlkeCA9IHJhbmRJbnQoMCwgc2NoZWRzaXplKVxuICAgIGxldCBpdGVtID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaWR4XSFcbiAgICBsZXQgcmVxID0gZ2V0UmVxKGl0ZW0pXG5cbiAgICBsZXQgYWIgOm51bWJlcltdID0gW11cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZWRzaXplOyBpKyspe1xuICAgICAgaWYgKGdldFJlcShzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSEpID09IHJlcSkgYWIucHVzaChpKVxuICAgIH1cblxuICAgIGxldCBbYSxiXSA9IGFiIGFzIFtudW1iZXIsIG51bWJlcl1cblxuICAgIHJlbW92ZVN0b3BzKHRyYW4sIGEsYilcbiAgICBsZXQgbmV3cmF0aW5nID0gc2NvcmUodHJhbilcbiAgICBpZiAobmV3cmF0aW5nIDwgc2NoZWR1bGVSYXRpbmdzW3RyYW5dISl7XG4gICAgICBpbnNlcnRTdG9wcyh0cmFuLCBhLCBiIC0gMSwgZ2V0RGVjayhpdGVtKSBhcyAwfDEsIHJlcSlcbiAgICB9ZWxzZXtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld3JhdGluZ1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMVxuICAgIH1cbiAgfVxuXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKyl7XG4gICAgdHJ5QXNzaWduKClcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2NoZWR1bGUsIHNjaGVkdWxlU2l6ZXMsIHRyYW5TdGFydFxuICB9XG5cbn1cblxuXG5sZXQgYW5uZWFsZXIgOiBSZXR1cm5UeXBlPHR5cGVvZiBzaW1wbGVBbm5lYWxpbmc+IHwgbnVsbCA9IG51bGxcblxuXG5leHBvcnQgZnVuY3Rpb24gcGxhbm5lclZpZXcobW9kOiBNb2R1bGUpOkhUTUxFbGVtZW50e1xuXG4gIGlmIChhbm5lYWxlciA9PSBudWxsKSBhbm5lYWxlciA9IHNpbXBsZUFubmVhbGluZyhtb2QpXG5cbiAgbGV0IGVsID0gZGl2KFxuXG4gICAgc3R5bGUoeyBkaXNwbGF5OiBcImZsZXhcIiwgZmxleERpcmVjdGlvbjogXCJyb3dcIiwgIG1heFdpZHRoOiBcIjUwdndcIiwgb3ZlcmZsb3c6IFwiYXV0b1wifSksXG5cbiAgICBtb2Quc3RhcnRwb3NpdGlvbnMubWFwKChzdGFydCwgdHJhbik9PntcbiAgICAgIHJldHVybiBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICBib3JkZXI6IGAxcHggc29saWQgJHtjb2xvci5jb2xvcn1gXG4gICAgICAgIH0pLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgQXJyYXkuZnJvbSh7bGVuZ3RoOiBhbm5lYWxlciEuc2NoZWR1bGVTaXplc1t0cmFuXSF9LCAoXyxpKT0+IHtcblxuICAgICAgICAgIGxldCBzdGVwID0gYW5uZWFsZXI/LnNjaGVkdWxlW2ldIVxuICAgICAgICAgIHJldHVybiBwKGlzbG9hZChzdGVwKSwgXCI6XCIsIGdldFJlcShzdGVwKSlcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICB9KVxuXG4gIClcbiAgXG5cbiAgcmV0dXJuIGVsXG5cblxufSIsCiAgICAiaW1wb3J0IHsgaGFzaCB9IGZyb20gXCIuLi9oYXNoXCI7XG5pbXBvcnQgeyBib2R5LCBidXR0b24sIGNvbG9yLCBkaXYsIGVycm9ycG9wdXAsIGgxLCBoMiwgaDMsIGlucHV0LCBtYXJnaW4sIHAsIHBhZGRpbmcsIHBvcHVwLCBwcmUsIHNwYW4sIHN0eWxlLCB0YWJsZSwgd2lkdGgsIHRleHRhcmVhLCBhLCBib3JkZXIsIGh0bWwsIHRoLCB0ciwgdGQsIGJvcmRlclJhZGl1cywgcGFuZWxMaXN0LCBkaXNwbGF5LCBiYWNrZ3JvdW5kIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgbWFwVmlldyB9IGZyb20gXCIuL21hcFZpZXdcIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuLi9yYW5kb21NYXBcIjtcbmltcG9ydCB7IHJhbmRvbU1vZHVsZSwgcmFuZG9tVVVJRCwgUmVxdWVzdCwgU2NoZWR1bGUsIFVVSUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IG1rU3RvcmVkLCBta1dyaXRhYmxlLCB0eXBlIFdyaXRhYmxlIH0gZnJvbSBcIi4uL3dyaXRlYWJsZVwiO1xuaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZG9tLCBzZXRSYW5kU2VlZCB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB7IG51bWJlciB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmltcG9ydCB7IHBsYW5uZXJWaWV3IH0gZnJvbSBcIi4uL3BsYW5uZXJzL2FubmVhbGluZ1wiO1xuXG5cbmV4cG9ydCBsZXQgTEtXX0NPVU5UID0gbWtTdG9yZWQoXCJMS1dfQ09VTlRcIiwgbnVtYmVyLCAgNSlcbmxldCBSRVFVRVNUX0NPVU5UID0gbWtTdG9yZWQoXCJSRVFVRVNUX0NPVU5UXCIsICBudW1iZXIsIDIwKVxuXG5ib2R5LnN0eWxlLm1hcmdpbiA9IFwiMFwiXG5cbmxldCBoZWFkZXIgPSBoMShcInJvdXRlIHBsYW5uZXJcIiwgc3R5bGUoe2JhY2tncm91bmQ6IGNvbG9yLmJsdWUsIGNvbG9yOiBjb2xvci5iYWNrZ3JvdW5kLCBtYXJnaW46IFwiMFwiLCBwYWRkaW5nOiBcIi42ZW1cIn0pKVxuXG5sZXQgY29udGVudFNwYWNlID0gZGl2KHN0eWxlKHtcbiAgZGlzcGxheTpcImZsZXhcIixcbiAgZmxleERpcmVjdGlvbjpcInJvd1wiLFxuICB3aWR0aDogXCIxMDAlXCIsXG4gIGhlaWdodDogXCJjYWxjKDEwMCUgLSAyLjVlbSlcIixcbiAgbWluV2lkdGg6IFwiMFwiLFxufSkpXG5cbmxldCBwYWdlID0gZGl2KFxuICBzdHlsZSh7ZGlzcGxheTpcImZsZXhcIiwgZmxleERpcmVjdGlvbjpcImNvbHVtblwiLCBoZWlnaHQ6IFwiMTAwJVwifSksXG4gIGhlYWRlcixcbiAgY29udGVudFNwYWNlXG4pXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKHBhZ2UpXG5cbnNldFJhbmRTZWVkKDI0KVxuXG5leHBvcnQgbGV0IG1vZHVsZSA9IHJhbmRvbU1vZHVsZSgpXG5cbmV4cG9ydCB0eXBlIEhpZ2hMaWdodCA9IHtcbiAgcG9pbnRzOiB7XG4gICAgbnVtYmVyOiBudW1iZXIsXG4gICAgbG9nbz8gOiBzdHJpbmcsXG4gIH1bXSxcbiAgY29sb3I/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGxldCBoaWdodExpZ2h0cyA9IG1rV3JpdGFibGUgPEhpZ2hMaWdodFtdPiggW10gKVxuXG5cbmZ1bmN0aW9uIHNldHRlciAoc3RvcmU6IFdyaXRhYmxlPG51bWJlcj4gKXtcbiAgbGV0IGlucCA9IGlucHV0KClcbiAgaW5wLnR5cGUgPSBcIm51bWJlclwiXG4gIGlucC5vbmNoYW5nZSA9ICgpPT57XG4gICAgbGV0IHZhbCA9IHBhcnNlSW50KGlucC52YWx1ZSlcbiAgICBpZiAoaXNOYU4odmFsKSkgcmV0dXJuXG4gICAgc3RvcmUuc2V0KHZhbClcbiAgfVxuICBzdG9yZS5vbnVwZGF0ZSh2YWw9PmlucC52YWx1ZSA9IHZhbC50b1N0cmluZygpKVxuXG4gIHJldHVybiBpbnBcbn1cblxuXG5mdW5jdGlvbiBta1dpbmRvdyAodGFiOiBudW1iZXIgPSAwICkge1xuXG4gIGxldCB0YWJGaWVsZHMgPSBbXG4gICAgWydtYXAnLCBtYXBWaWV3KG1vZHVsZSldLFxuICAgIC8vIFsncmVxdWVzdHMnLCByZXF1ZXN0Vmlldyhtb2R1bGUucmVxdWVzdHMpXSxcbiAgICAvLyBbJ3NjaGVkdWxlJywgc2NoZWR1bGVWaWV3KCkgXSxcbiAgICBbJ3BsYW5uZXInLCBwbGFubmVyVmlldyhtb2R1bGUpXSxcbiAgICBbJ3NldHRpbmdzJywgZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBwYWRkaW5nOiBcIjFlbVwiLFxuICAgICAgfSksXG4gICAgICBoMihcInNldHRpbmdzXCIpLFxuXG5cbiAgICAgIHRhYmxlKFxuICAgICAgICB0cihcbiAgICAgICAgICB0ZChcIkxLVyBjb3VudFwiKSxcbiAgICAgICAgICB0ZChzZXR0ZXIoTEtXX0NPVU5UKSlcbiAgICAgICAgKSxcbiAgICAgICAgdHIoXG4gICAgICAgICAgdGQoXCJSZXF1ZXN0IGNvdW50XCIpLFxuICAgICAgICAgIHRkKHNldHRlcihSRVFVRVNUX0NPVU5UKSlcbiAgICAgICAgKSxcbiAgICAgICAgdHIoYnV0dG9uKFwiZ2VuZXJhdGVcIiwgKCk9PntcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKClcbiAgICAgICAgfSkpXG4gICAgICApXG5cbiAgICApXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgcCh0YWJGaWVsZHMubWFwKChbbixlXSk9PlxuICAgICAgICBzcGFuKCBuLFxuICAgICAgICAgICgpPT5vcGVuVGFiKG4pLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjNlbVwiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIi4zZW1cIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiKyAobj09dGFiID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5KSxcbiAgICAgICAgICAgIGNvbG9yOiAobj09dGFiKSA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApKSxcbiAgICAgIHRhYkZpZWxkcy5maW5kKChbbixdKT0+bj09dGFiKSFbMV1cbiAgICApXG4gIH1cblxuXG4gIG9wZW5UYWIodGFiRmllbGRzW3RhYl0hWzBdKVxuXG4gIHJldHVybiBlbFxufVxuXG5jb250ZW50U3BhY2UucmVw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S0FBSztBQUFBLElBQzVCLElBQUksTUFBTSxHQUFHO0FBQUEsTUFBRztBQUFBLElBQ2hCLE1BQU0sSUFBSSxHQUFHO0FBQUE7QUFBQSxFQUVmLE1BQU0sU0FBUyxTQUFLLElBQUksUUFBUSxJQUFJLFNBQVMsQ0FBQztBQUFBLEVBRTlDLE9BQU87QUFBQTtBQUlULFNBQVMsUUFBUyxDQUFDLE1BQWMsR0FBSTtBQUFBLEVBRW5DLElBQUksWUFBWTtBQUFBLElBQ2QsQ0FBQyxPQUFPLFFBQVEsTUFBTSxDQUFDO0FBQUEsSUFHdkIsQ0FBQyxXQUFXLFlBQVksTUFBTSxDQUFDO0FBQUEsSUFDL0IsQ0FBQyxZQUFZLElBQ1gsTUFBTTtBQUFBLE1BQ0osU0FBUztBQUFBLElBQ1gsQ0FBQyxHQUNELEdBQUcsVUFBVSxHQUdiLE1BQ0UsR0FDRSxHQUFHLFdBQVcsR0FDZCxHQUFHLE9BQU8sU0FBUyxDQUFDLENBQ3RCLEdBQ0EsR0FDRSxHQUFHLGVBQWUsR0FDbEIsR0FBRyxPQUFPLGFBQWEsQ0FBQyxDQUMxQixHQUNBLEdBQUcsT0FBTyxZQUFZLE1BQUk7QUFBQSxNQUN4QixPQUFPLFNBQVMsT0FBTztBQUFBLEtBQ3hCLENBQUMsQ0FDSixDQUVGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxNQUFNLEtBQUssSUFBSSxNQUFNO0FBQUEsSUFDbkIsTUFBTTtBQUFBLElBQ04sVUFBVTtBQUFBLElBQ1YsUUFBUTtBQUFBLElBQ1IsUUFBUSxlQUFhLE1BQU07QUFBQSxJQUMzQixVQUFVO0FBQUEsRUFDWixDQUFDLENBQUM7QUFBQSxFQUVGLFNBQVMsT0FBTyxDQUFDLE1BQWtDO0FBQUEsSUFDakQsR0FBRyxnQkFDRCxFQUFFLFVBQVUsSUFBSSxFQUFFLEdBQUUsT0FDbEIsS0FBTSxHQUNKLE1BQUksUUFBUSxDQUFDLEdBQ2IsTUFBTTtBQUFBLE1BQ0osU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLE1BQ1IsUUFBUSxnQkFBZSxLQUFHLE9BQU0sTUFBTSxRQUFRLE1BQU07QUFBQSxNQUNwRCxPQUFRLEtBQUcsT0FBTyxNQUFNLFFBQVEsTUFBTTtBQUFBLElBQ3hDLENBQUMsQ0FDSCxDQUNGLENBQUMsR0FDRCxVQUFVLEtBQUssRUFBRSxPQUFNLEtBQUcsSUFBRyxFQUFHLEVBQ2xDO0FBQUE7QUFBQSxFQUlGLFFBQVEsVUFBVSxLQUFNLEVBQUU7QUFBQSxFQUUxQixPQUFPO0FBQUE7QUFHVCxhQUFhLGdCQUFnQixTQUFTLENBQUUsR0FBRyxTQUFTLENBQUM7IiwKICAiZGVidWdJZCI6ICI4NThENTI1QTlBQjNERTY0NjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
