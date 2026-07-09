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
  function itemButton(item) {
    let req = mod.requests[item];
    let sp = span(item.toString().padStart(3, " "), style({ cursor: "pointer", border: "2px solid transparent", borderRadius: ".2em", whiteSpace: "pre", fontFamily: "monospace" }), function() {
      popup(p("no: ", item), p("value: ", req.value_eur + "€"), p("dist: ", mod.roadmap.getCostN(req.startPoint, req.endPoint) + "km"));
    });
    sp.onmouseenter = (e) => {
      sp.style.borderColor = color.green;
      hightLights.set([
        {
          points: [{
            number: req.startPoint,
            logo: "\uD83D\uDCE6"
          }, {
            number: req.endPoint,
            logo: "\uD83C\uDFE0"
          }]
        }
      ]);
    };
    sp.onmouseleave = (e) => {
      sp.style.borderColor = "transparent";
    };
    return sp;
  }
  if (annealer == null)
    annealer = simpleAnnealing(mod);
  let tab = table(style({
    borderCollapse: "collapse",
    width: "100%"
  }), tr(th("transporter", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("value", style({ border: outerBorder, padding: cellPadding, textAlign: "left" })), th("steps", style({ border: outerBorder, padding: cellPadding, textAlign: "left" }))), mod.startpositions.map((start, tran) => {
    return tr(td(tran, style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })), td(annealer?.scheduleRatings[tran], style({ border: outerBorder, padding: cellPadding, verticalAlign: "top" })), table(style({
      borderCollapse: "collapse"
    }), [0, 1].map((deck) => tr(Array.from({ length: annealer.scheduleSizes[tran] }, (_, i) => {
      let step = annealer?.schedule[tran * annealer.TSIZE + i];
      return td(getDeck(step) == deck ? itemButton(getReq(step)) : "", style({
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
  }), tab), p("unassigned: ", Array.from(annealer.unassigned).map((x, i) => ({ x, i })).filter((x) => x.x).map((x) => span(" ", itemButton(x.i)))), p("search time: ", time, "ms"), p("score:", annealer.scheduleRatings.reduce((x, y) => x + y)));
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

//# debugId=F30419182AFB8E2F64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9yYW5kb20udHMiLCAic3JjL3JhbmRvbU1hcC50cyIsICJzcmMvanNvbnNjaGVtYS50cyIsICJzcmMvc2NoZW1hLnRzIiwgInNyYy90eXBlcy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy9wbGFubmVycy9hbm5lYWxpbmcudHMiLCAic3JjL3ZpZXcvbWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsKICAgICJcbmltcG9ydCB0eXBlIHsgSnNvbkRhdGEgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5leHBvcnQgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbmNvbnN0IGNvbG9yUGFsZXR0ZSA9IHtcbiAgbGlnaHQ6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiMwMDBcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjZmZmXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDI0MiwgNTUsIDU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYig1NywgMjE0LCAzOSlcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoNSwgMjgsIDE0MSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoMjEsIDEzNywgMjM5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM4ODhcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjZTVlNWU1XCIsXG4gIH0sXG4gIGRhcms6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiNmZmZcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjMjIyXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDE5OCwgMjAsIDApXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDk1LCAxNTksIDI1NSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoOTUsIDEwMCwgMjU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYigwLCAxODUsIDE5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM1NjU2NTZcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjNDE0MTQxXCIsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbG9yID0ge1xuICBjb2xvcjogXCJ2YXIoLS1jb2xvcilcIixcbiAgYmFja2dyb3VuZDogXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiLFxuICBibHVlOiBcInZhcigtLWJsdWUpXCIsXG4gIGxpZ2h0Qmx1ZTogXCJ2YXIoLS1saWdodGJsdWUpXCIsXG4gIHJlZDogXCJ2YXIoLS1yZWQpXCIsXG4gIGdyZWVuOiBcInZhcigtLWdyZWVuKVwiLFxuICBncmF5OiBcInZhcigtLWdyYXkpXCIsXG4gIGxpZ2h0Z3JheTogXCJ2YXIoLS1saWdodGdyYXkpXCJcbn1cblxuXG5sZXQgc3R5bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKVxuc3R5bC5pbm5lckhUTUwgPSBgXG46cm9vdCB7XG4gIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmRhcmsuY29sb3J9O1xuICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmFja2dyb3VuZH07XG4gIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5kYXJrLnJlZH07XG4gIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JlZW59O1xuICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmx1ZX07XG4gIC0tZ3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5ncmF5fTtcbiAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsubGlnaHRncmF5fTtcbiAgY29sb3I6IHZhcigtLWNvbG9yKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZCk7XG4gIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgOnJvb3Qge1xuICAgIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmNvbG9yfTtcbiAgICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJhY2tncm91bmR9O1xuICAgIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5saWdodC5yZWR9O1xuICAgIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyZWVufTtcbiAgICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJsdWV9O1xuICAgIC0tZ3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JheX07XG4gICAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmxpZ2h0Z3JheX07XG4gIH1cbn1cbmBcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bClcblxuZXhwb3J0IHR5cGUgaHRtbEtleSA9ICdpbm5lclRleHQnfCdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdvbmtleWRvd24nIHwgJ29ubW91c2VvdmVyJyB8ICdvbm1vdXNlZXhpdCcgfCdjaGlsZHJlbid8J2NsYXNzJ3wnaWQnfCdjb250ZW50RWRpdGFibGUnfCdldmVudExpc3RlbmVycyd8J2NvbG9yJ3wnYmFja2dyb3VuZCcgfCAnc3R5bGUnIHwgJ3BsYWNlaG9sZGVyJyB8ICd0YWJJbmRleCcgfCAnY29sU3BhbicgfCAndHlwZSdcbmV4cG9ydCBjb25zdCBodG1sRWxlbWVudCA9ICh0YWc6c3RyaW5nLCB0ZXh0OnN0cmluZywgYXJncz86UGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4pOkhUTUxFbGVtZW50ID0+e1xuXG4gIGNvbnN0IF9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpXG4gIF9lbGVtZW50LnRleHRDb250ZW50ID0gdGV4dFxuICBsZXQgc3QgPSBfZWxlbWVudC5zdHlsZVxuICBpZiAodGFnID09IFwiYnV0dG9uXCIpe1xuICAgIF9lbGVtZW50LmlubmVyVGV4dCA9IHRleHRcbiAgICBzdC5jb2xvciA9IGNvbG9yLmNvbG9yXG4gICAgc3QuYmFja2dyb3VuZENvbG9yID0gY29sb3IubGlnaHRncmF5XG4gICAgc3QuYm9yZGVyID0gXCIxcHggc29saWQgXCIrY29sb3IuZ3JheVxuICAgIHN0LmJvcmRlclJhZGl1cyA9IFwiLjJlbVwiXG4gICAgc3QucGFkZGluZyA9IFwiLjFlbSAuNGVtXCJcbiAgICBzdC5tYXJnaW4gPSBcIi4yZW1cIlxuICB9XG4gIGlmIChhcmdzKSBPYmplY3QuZW50cmllcyhhcmdzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pPT57XG4gICAgaWYgKGtleSA9PT0gJ3BhcmVudCcpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChfZWxlbWVudClcbiAgICB9XG4gICAgaWYgKGtleT09PSdjaGlsZHJlbicpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50W10pLmZvckVhY2goYz0+X2VsZW1lbnQuYXBwZW5kQ2hpbGQoYykpXG4gICAgfWVsc2UgaWYgKGtleT09PSdldmVudExpc3RlbmVycycpe1xuICAgICAgT2JqZWN0LmVudHJpZXModmFsdWUgYXMgUmVjb3JkPHN0cmluZywgKGU6RXZlbnQpPT52b2lkPikuZm9yRWFjaCgoW2V2ZW50LCBsaXN0ZW5lcl0pPT57XG4gICAgICAgIF9lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxuICAgICAgfSlcbiAgICB9ZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKXtcbiAgICAgIE9iamVjdC5hc3NpZ24oX2VsZW1lbnQuc3R5bGUsIHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pXG4gICAgfWVsc2V7XG4gICAgICBfZWxlbWVudFsoa2V5IGFzICdpbm5lclRleHQnIHwgJ29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ2lkJyB8ICdjb250ZW50RWRpdGFibGUnKV0gPSB2YWx1ZVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIF9lbGVtZW50XG59XG5cbmV4cG9ydCB0eXBlIEhUTUxBcmcgPSBzdHJpbmcgfCBudW1iZXIgfCBIVE1MRWxlbWVudCB8IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ICB8IFByb21pc2U8SFRNTEFyZz4gfCBIVE1MQXJnW10gfCBGdW5jdGlvblxuZXhwb3J0IGNvbnN0IGh0bWwgPSAodGFnOnN0cmluZywgLi4uY3M6SFRNTEFyZ1tdKTpIVE1MRWxlbWVudD0+e1xuICBsZXQgY2hpbGRyZW46IEhUTUxFbGVtZW50W10gPSBbXVxuICBsZXQgYXJnczogUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gPSB7fVxuXG4gIGNvbnN0IGFkZF9hcmcgPSAoYXJnOkhUTUxBcmcpPT57XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcpKVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcudG9TdHJpbmcoKSkpXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgUHJvbWlzZSl7XG4gICAgICBjb25zdCBlbCA9IHNwYW4oXCIuLi5cIilcbiAgICAgIGFyZy50aGVuKCh2YWx1ZSk9PntcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKHZhbHVlKSlcbiAgICAgIH0pXG4gICAgICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIH1cbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgY2hpbGRyZW4ucHVzaChhcmcpXG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSBhcmcuZm9yRWFjaCh4PT5hZGRfYXJnKHgpKVxuICAgIC8vIGVsc2UgaWYgKCdnZXQnIGluIGFyZyAmJiB0eXBlb2YgYXJnLmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vICAgY29uc3QgZWwgPSBzcGFuKClcbiAgICAvLyAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgLy8gICBpZiAoJ29udXBkYXRlJyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5vbnVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykgYXJnLm9udXBkYXRlKHg9PmVsLnJlcGxhY2VDaGlsZHJlbih4KSlcbiAgICAvLyB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PSBcImZ1bmN0aW9uXCIpe1xuICAgICAgaWYgKGFyZy5uYW1lID09IFwib25pbnB1dFwiKSBhcmdzLm9uaW5wdXQgPSBhcmdcbiAgICAgIGVsc2UgaWYgKGFyZy5uYW1lID09IFwib25jbGlja1wiIHx8IGFyZy5sZW5ndGggPCAyKSBhcmdzLm9uY2xpY2sgPSBhcmdcbiAgICAgIGVsc2UgY29uc29sZS53YXJuKFwiRnVuY3Rpb24gYXJndW1lbnQgd2l0aG91dCBuYW1lIG9yIHdpdGggbW9yZSB0aGFuIG9uZSBwYXJhbWV0ZXIgaXMgaWdub3JlZCBpbiBodG1sIGdlbmVyYXRvclwiKVxuICAgIH1cbiAgICBlbHNlIGFyZ3MgPSB7Li4uYXJncywgLi4uYXJnfVxuICB9XG4gIGNzLmZvckVhY2goYWRkX2FyZylcbiAgcmV0dXJuIGh0bWxFbGVtZW50KHRhZywgXCJcIiwgey4uLmFyZ3MsIGNoaWxkcmVufSlcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEdlbmVyYXRvcjxUIGV4dGVuZHMgSFRNTEVsZW1lbnQgPSBIVE1MRWxlbWVudD4gPSAoLi4uY3M6SFRNTEFyZ1tdKSA9PiBUXG5jb25zdCBuZXdIdG1sR2VuZXJhdG9yID0gPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4odGFnOnN0cmluZyk9PiguLi5jczpIVE1MQXJnW10pOlQ9Pmh0bWwodGFnLCAuLi5jcykgYXMgVFxuXG5leHBvcnQgY29uc3QgcDpIVE1MR2VuZXJhdG9yPEhUTUxQYXJhZ3JhcGhFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwXCIpXG5leHBvcnQgY29uc3QgYTpIVE1MR2VuZXJhdG9yPEhUTUxBbmNob3JFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJhXCIpXG5leHBvcnQgY29uc3QgaDE6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgxXCIpXG5leHBvcnQgY29uc3QgaDI6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgyXCIpXG5leHBvcnQgY29uc3QgaDM6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgzXCIpXG5leHBvcnQgY29uc3QgaDQ6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImg0XCIpXG5cbmV4cG9ydCBjb25zdCBkaXY6SFRNTEdlbmVyYXRvcjxIVE1MRGl2RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiZGl2XCIpXG5leHBvcnQgY29uc3QgcHJlOkhUTUxHZW5lcmF0b3I8SFRNTFByZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInByZVwiKVxuZXhwb3J0IGNvbnN0IHNwYW46SFRNTEdlbmVyYXRvcjxIVE1MU3BhbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInNwYW5cIilcbmV4cG9ydCBjb25zdCB0ZXh0YXJlYTpIVE1MR2VuZXJhdG9yPEhUTUxUZXh0QXJlYUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRleHRhcmVhXCIpXG5cbmV4cG9ydCBjb25zdCBidXR0b246SFRNTEdlbmVyYXRvcjxIVE1MQnV0dG9uRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYnV0dG9uXCIpXG4vLyBleHBvcnQgY29uc3QgdGFibGUgPSAocm93czogSFRNTEFyZ1tdW10sIC4uLmFyZ3M6IEhUTUxBcmdbXSkgPT4gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpKCBzdHlsZSh7Ym9yZGVyU3BhY2luZzogXCIxZW0gLjRlbVwifSkgLCByb3dzLm1hcChjZWxscz0+dHIoY2VsbHMubWFwKGNlbGw9PnRkKGNlbGwpKSkpLCAuLi5hcmdzKVxuZXhwb3J0IGNvbnN0IHRhYmxlOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIilcblxuZXhwb3J0IGNvbnN0IHRyOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlUm93RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidHJcIilcbmV4cG9ydCBjb25zdCB0ZDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZFwiKVxuZXhwb3J0IGNvbnN0IHRoOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRoXCIpXG5leHBvcnQgY29uc3QgY2FudmFzOkhUTUxHZW5lcmF0b3I8SFRNTENhbnZhc0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImNhbnZhc1wiKVxuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSAoLi4ucnVsZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5bXSkgPT4gKHtzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgLi4ucnVsZXMpfSlcbmV4cG9ydCBjb25zdCBtYXJnaW4gPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe21hcmdpbjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHBhZGRpbmcgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3BhZGRpbmc6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXIgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlcjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlclJhZGl1cyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyUmFkaXVzOiB2YWx1ZX0pXG5leHBvcnQgY29uc3Qgd2lkdGggPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3dpZHRoOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgaGVpZ2h0ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtoZWlnaHQ6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBkaXNwbGF5ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtkaXNwbGF5OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYmFja2dyb3VuZCA9ICh2YWx1ZTogc3RyaW5nID0gXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiKSA9PiBzdHlsZSh7YmFja2dyb3VuZDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3QgaW5wdXQ6SFRNTEdlbmVyYXRvcjxIVE1MSW5wdXRFbGVtZW50PiA9ICguLi5jcyk9PntcbiAgY29uc3QgY29udGVudCA9IGNzLmZpbHRlcihjPT50eXBlb2YgYyA9PSAnc3RyaW5nJykuam9pbignICcpXG4gIGNvbnN0IGVsID0gaHRtbChcImlucHV0XCIsIC4uLmNzKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gIGVsLnZhbHVlID0gY29udGVudFxuICByZXR1cm4gZWxcbn1cblxuXG5leHBvcnQgY29uc3QgcG9wdXAgPSAoLi4uY3M6SFRNTEFyZ1tdKT0+e1xuICBjb25zdCBkaWFsb2dmaWVsZCA9IGRpdih7XG4gICAgc3R5bGU6IHtcbiAgICAgIGJhY2tncm91bmQ6IGNvbG9yLmJhY2tncm91bmQsXG4gICAgICBjb2xvcjogY29sb3IuY29sb3IsXG4gICAgICBwYWRkaW5nOiBcIjFlbSA0ZW1cIixcbiAgICAgIHBhZGRpbmdCb3R0b206IFwiMmVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMWVtXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgICAgb3ZlcmZsb3dZOiBcInNjcm9sbFwiLFxuICAgICAgbWluV2lkdGg6IFwiMjB2d1wiLFxuICAgICAgbWF4SGVpZ2h0OiBcIjgwdmhcIixcbiAgICB9fSxcbiAgICAuLi5jcylcblxuICBjb25zdCBwb3B1cGJhY2tncm91bmQgPSBkaXYoXG4gICAge3N0eWxlOntcbiAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICB0b3A6IFwiMFwiLFxuICAgICAgbGVmdDogXCIwXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJyZ2JhKDE2NiwgMTY2LCAxNjYsIDAuNSlcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICB9fVxuICApXG5cbiAgcG9wdXBiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKGRpYWxvZ2ZpZWxkKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwb3B1cGJhY2tncm91bmQpO1xuICBwb3B1cGJhY2tncm91bmQub25jbGljayA9ICgpID0+IHtwb3B1cGJhY2tncm91bmQucmVtb3ZlKCk7IH1cbiAgZGlhbG9nZmllbGQub25jbGljayA9IChlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICByZXR1cm4gcG9wdXBiYWNrZ3JvdW5kXG5cbn1cblxuZXhwb3J0IGNvbnN0IGVycm9ycG9wdXAgPSAoZTpFcnJvciB8IHN0cmluZykgPT57XG4gIHBvcHVwKGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOmNvbG9yLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6XCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgIHBhZGRpbmc6XCIxZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czpcIi40ZW1cIixcbiAgICAgIGNvbG9yOmNvbG9yLnJlZCxcbiAgICB9KSxcbiAgICBoMihcIkVycm9yXCIpLFxuICAgIHAoU3RyaW5nKGUpKVxuICApKVxuICB0aHJvdyAoZSBpbnN0YW5jZW9mIEVycm9yKSA/IGUgOiBuZXcgRXJyb3IoU3RyaW5nKGUpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFuZWxMaXN0KGl0ZW1zOiB7dGl0bGU6IEhUTUxBcmcsIGNvbnRlbnQ6IEhUTUxBcmd9W10pe1xuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgIGdhcDogXCIxZW1cIixcbiAgICB9KSxcbiAgICAuLi5pdGVtcy5tYXAoZj0+ZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuNGVtXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjVlbSAxZW1cIixcbiAgICAgIH0pLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgZm9udFdlaWdodDogXCJib2xkXCIsXG4gICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYudGl0bGVcbiAgICAgICksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBtYXJnaW5Ub3A6IFwiLjVlbVwiLFxuICAgICAgICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi5jb250ZW50XG4gICAgICApXG4gICAgKSlcbiAgKVxufVxuXG5cblxuXG4iLAogICAgIlxuaW1wb3J0IHR5cGUgeyBNb2R1bGUsIFVVSUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbi8vIGltcG9ydCB7IGZpbmRQYXRoIH0gZnJvbSBcIi4uL3BsYW5uZXJcIjtcbmltcG9ydCB7ICB0eXBlIFJvYWRNYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyBkaXYsIHAsIHN0eWxlIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMgfSBmcm9tIFwiLi9tYWluXCI7XG5cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiwgeDogbnVtYmVyLCB5OiBudW1iZXIpIDoge2VsOiBTVkdDaXJjbGVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJsaW5lXCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIpIDoge2VsOiBTVkdMaW5lRWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwidGV4dFwiLCB4OiBudW1iZXIsIHk6IG51bWJlciwgczogc3RyaW5nKSA6IHtlbDogU1ZHVGV4dEVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwiY2lyY2xlXCIgfCBcImxpbmVcIiB8IFwidGV4dFwiLCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4Mj86IG51bWJlciB8IHN0cmluZywgeTI/OiBudW1iZXIpe1xuICBsZXQgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCB0YWcpXG4gIGlmICh0YWcgPT0gXCJjaXJjbGVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiY3hcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAxXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4ge1xuICAgICAgZWwsXG4gICAgICBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcImxpbmVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDFcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5MVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcIngyXCIsIHgyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkyXCIsIHkyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZVwiLCBcImdyYXlcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAwNVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0YWcgPT0gXCJ0ZXh0XCIpe1xuICAgIGVsLnNldEF0dHJpYnV0ZShcInhcIix4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInlcIiwgeTEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgZWwudGV4dENvbnRlbnQgPSBTdHJpbmcoeDIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiLjA3XCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcblxuICAgIHJldHVybiB7IGVsLCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57IGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpIH0gfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdGFnXCIpXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gbWFwVmlldyAoIG1vZDogTW9kdWxlICkgOiBIVE1MRWxlbWVudCB7XG5cbiAgbGV0IHtyb2FkbWFwLCBNQVBTSVpFfSA9IG1vZFxuXG5cblxuICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpXG5cbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCIwIDAgMSAxXCIpXG5cbiAgbGV0IGVsZW1lbnRzID0gbmV3IE1hcDxhbnksIFNWR0VsZW1lbnQ+KClcbiAgbGV0IHNvdXJjZXMgPSBuZXcgTWFwPFNWR0VsZW1lbnQsIGFueT4oKVxuICBcbiAgZm9yIChsZXQgeCA9MCA7IHggPCByb2FkbWFwLnBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgZm9yIChsZXQgeSA9IDA7IHk8IHJvYWRtYXAucG9pbnRzLmxlbmd0aDsgeSsrKXtcbiAgICAgIGlmICh4ID09IHkpIGNvbnRpbnVlXG4gICAgICBsZXQgbGVuID0gcm9hZG1hcC5nZXRyb2FkKHgseSlcbiAgICAgIGlmIChsZW4gPT0gMCB8fCBsZW4gPT0gdW5kZWZpbmVkKSBjb250aW51ZSAgXG5cblxuICAgICAgbGV0IGEgPSByb2FkbWFwLnBvaW50c1t4XSFcbiAgICAgIGxldCBiID0gcm9hZG1hcC5wb2ludHNbeV0hXG4gICAgICBsZXQgbGluZSA9IG1rU3ZnKFwibGluZVwiLCBhLngvTUFQU0laRSwgYS55L01BUFNJWkUsIGIueC9NQVBTSVpFLCBiLnkvTUFQU0laRSkuZWxcbiAgICAgIGxldCBpZCA9IFwicm9hZFwiK3JvYWRtYXAucm9hZElEWCh4LHkpXG4gICAgICBlbGVtZW50cy5zZXQoaWQsIGxpbmUpXG4gICAgICBzb3VyY2VzLnNldChsaW5lLCBpZClcbiAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZSlcbiAgICB9XG4gIH1cbiAgXG4gIGZvciAobGV0IHggPTA7IHg8cm9hZG1hcC5wb2ludHMubGVuZ3RoOyB4Kyspe1xuICAgIGxldCBsb2MgPSByb2FkbWFwLnBvaW50c1t4XSFcbiAgICBsZXQgY2lyY2xlID0gbWtTdmcoXCJjaXJjbGVcIiwgbG9jLngvTUFQU0laRSwgbG9jLnkvTUFQU0laRSkuZWxcbiAgICBlbGVtZW50cy5zZXQoeCwgY2lyY2xlKVxuICAgIHNvdXJjZXMuc2V0KGNpcmNsZSwgeClcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNpcmNsZSlcbiAgfVxuXG4gIGxldCBoaW50czoge3JlbW92ZTooKT0+dm9pZH1bXSA9IFtdXG5cbiAgaGlnaHRMaWdodHMub251cGRhdGUoKG5ILG8pPT57XG4gICAgaGludHMuZm9yRWFjaChlbD0+ZWwucmVtb3ZlKCkpXG4gICAgZm9yIChsZXQgbiBvZiBuSCl7XG4gICAgICBsZXQgbGFzdCA6IG51bWJlciB8IG51bGwgPSBudWxsXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgbGV0IG5leHQgPSBwLm51bWJlclxuICAgICAgICBpZiAobGFzdCAhPT0gbnVsbCl7XG4gICAgICAgICAgLy8gbGV0IHBhdGggPSByb2FkbWFwLmZpbmRQYXRoKGxhc3QsIG5leHQpXG4gICAgICAgICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKyl7XG4gICAgICAgICAgLy8gICBsZXQgQSA9IHJvYWRtYXAucG9pbnRzW3BhdGhbaV0hXSFcbiAgICAgICAgICAvLyAgIGxldCBCID0gcm9hZG1hcC5wb2ludHNbcGF0aFtpKzFdIV0hXG4gICAgICAgICAgLy8gICBsZXQgbGluZSA9IG1rU3ZnKFwibGluZVwiLCBBLngvTUFQU0laRSwgQS55L01BUFNJWkUsIEIueC9NQVBTSVpFLCBCLnkvTUFQU0laRSlcbiAgICAgICAgICAvLyAgIGxpbmUuc2V0Q29sb3Iobi5jb2xvciA/PyBcIiNmZmM5ODhcIilcbiAgICAgICAgICAvLyAgIGxpbmUuZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMVwiKVxuICAgICAgICAgIC8vICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwXCIpXG4gICAgICAgICAgLy8gICBlbGVtZW50LmFwcGVuZENoaWxkKGxpbmUuZWwpXG4gICAgICAgICAgLy8gICBoaW50cy5wdXNoKHtyZW1vdmU6ICgpPT5saW5lLmVsLnJlbW92ZSgpfSlcbiAgICAgICAgICAvLyB9XG4gICAgICAgIH1cbiAgICAgICAgbGFzdCA9IG5leHRcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGlmIChwLmxvZ28pIHtcbiAgICAgICAgICBsZXQgcG9zID0gcm9hZG1hcC5wb2ludHNbcC5udW1iZXJdIVxuICAgICAgICAgIGxldCBlbCA9IG1rU3ZnKFwidGV4dFwiLCBwb3MueC8gTUFQU0laRSwgcG9zLnkvTUFQU0laRSwgcC5sb2dvKVxuICAgICAgICAgIGVsLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDAwXCIpXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChlbC5lbClcbiAgICAgICAgICBoaW50cy5wdXNoKGVsLmVsKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGxldCBkdiA9IGRpdihzdHlsZSh7d2lkdGg6XCIxMDAlXCIsIGRpc3BsYXk6XCJmbGV4XCIsIGp1c3RpZnlDb250ZW50OlwiY2VudGVyXCIsIHBhZGRpbmc6IFwiMWVtXCJ9KSlcbiAgZHYuYXBwZW5kKGVsZW1lbnQpXG5cblxuICByZXR1cm4gZHZcbn1cblxuXG4iLAogICAgIlxuXG5cbmxldCBSQU5EU0VFRCA9IDBcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFJhbmRTZWVkKHNlZWQ6IG51bWJlcil7XG4gIFJBTkRTRUVEID0gc2VlZFxuICBSQU5EU0VFRCA9IHJhbmRJbnQoMCwgMTAwMDApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRTdGF0ZSAoKSB7cmV0dXJuIFJBTkRTRUVEfVxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTdGF0ZSAoc2VlZDogbnVtYmVyKSB7UkFORFNFRUQgPSBzZWVkfVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tKCl7XG4gIGxldCB4ID0gTWF0aC5zaW4oUkFORFNFRUQrKykgKiAxMDAwMDtcbiAgcmV0dXJuIHggLSBNYXRoLmZsb29yKHgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZEludChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpe1xuICByZXR1cm4gTWF0aC5mbG9vcihyYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pblxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZENob2ljZTxUPihhcnI6IFRbXSk6IFQge1xuICByZXR1cm4gYXJyW3JhbmRJbnQoMCwgYXJyLmxlbmd0aCldIVxufVxuXG4iLAogICAgImltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuL3JhbmRvbVwiO1xuXG5cbmV4cG9ydCB0eXBlIFBvcyA9IHt4Om51bWJlciwgeTogbnVtYmVyfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKE5QT0lOVFM6bnVtYmVyLCBNQVBTSVpFOm51bWJlcil7XG5cbiAgbGV0IEhQT0lOVCA9IE5QT0lOVFMvMlxuICBsZXQgUlNJWkUgPSBOUE9JTlRTICogSFBPSU5UXG5cblxuICBsZXQgcm9hZHMgPSBuZXcgVWludDE2QXJyYXkoUlNJWkUpXG5cbiAgZnVuY3Rpb24gcm9hZElEWCAgKGE6bnVtYmVyLCBiOm51bWJlcil7XG4gICAgaWYgKGE8YikgW2EsYl0gPSBbYixhXVxuICAgIGxldCBpZHggPSBhICsgTlBPSU5UUyAqIGJcbiAgICBpZiAoaWR4PlJTSVpFKSBpZHggPSBOUE9JTlRTKioyIC0gaWR4XG5cbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGxldCByb2RzOiB7YTpudW1iZXIsYjpudW1iZXIsIGRpc3Q6bnVtYmVyfVtdID0gW11cblxuICBmdW5jdGlvbiBzZXRyb2FkIChhOiBudW1iZXIsIGI6IG51bWJlciwgZGlzdDogbnVtYmVyKSB7XG5cbiAgICByb2RzLnB1c2goe2EsYixkaXN0fSlcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuXG4gIGxldCBmb3VuZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIGZ1bmN0aW9uIGZpbmQoeDpudW1iZXIpe1xuXG4gICAgaWYgKGZvdW5kLmhhcyh4KSkgcmV0dXJuXG4gICAgZm91bmQuYWRkKHgpXG4gICAgcmFuZ2UuZm9yRWFjaCgocCxpKT0+e1xuICAgICAgaWYgKCBpIT14ICYmIGdldHJvYWQoaSwgeCkgIT0gMCkgZmluZChpKVxuICAgIH0pXG4gIH1cblxuICBmb3IgKGxldCB4ID0gMDsgeCA8IE5QT0lOVFM7IHgrKyl7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspe1xuICAgICAgbGV0IHggPSByYW5kSW50KDAsIE5QT0lOVFMpXG4gICAgICBsZXQgbnggPSBuZWlnaHNbeF0/LltpXSFcbiAgICAgIHNldHJvYWQoeCwgbnguaSwgbnguZClcbiAgICAgIGlmIChmb3VuZC5oYXMoeCkpIGZpbmQobnguaSlcbiAgICAgIGlmIChmb3VuZC5oYXMobnguaSkpIGZpbmQoeClcbiAgICB9XG4gIH1cblxuXG5cblxuICBjb25zdCBDb3N0TWF0cml4ID0gbmV3IFVpbnQzMkFycmF5KFJTSVpFKTtcblxuICB7XG4gIFxuICAgIGNvbnN0IHBvaW50Q291bnQgPSBwb2ludHMubGVuZ3RoO1xuICAgIGNvbnN0IElORiA9IDB4ZmZmZjtcbiAgXG4gICAgQ29zdE1hdHJpeC5maWxsKElORik7XG4gIFxuICAgIGZvciAobGV0IHN0YXJ0ID0gMDsgc3RhcnQgPCBwb2ludENvdW50OyBzdGFydCsrKSB7XG4gICAgICBjb25zdCBkaXN0ID0gbmV3IFVpbnQzMkFycmF5KHBvaW50Q291bnQpO1xuICAgICAgY29uc3QgdmlzaXRlZCA9IG5ldyBVaW50OEFycmF5KHBvaW50Q291bnQpO1xuICAgICAgZGlzdC5maWxsKElORik7XG4gICAgICBkaXN0W3N0YXJ0XSA9IDA7XG4gIFxuICAgICAgZm9yIChsZXQgc3RlcCA9IDA7IHN0ZXAgPCBwb2ludENvdW50OyBzdGVwKyspIHtcbiAgICAgICAgbGV0IGN1cnJlbnQgPSAtMTtcbiAgICAgICAgbGV0IGJlc3QgPSBJTkY7XG4gIFxuICAgICAgICBmb3IgKGxldCBub2RlID0gMDsgbm9kZSA8IHBvaW50Q291bnQ7IG5vZGUrKykge1xuICAgICAgICAgIGlmICh2aXNpdGVkW25vZGVdID09PSAwICYmIGRpc3Rbbm9kZV0hIDwgYmVzdCkge1xuICAgICAgICAgICAgYmVzdCA9IGRpc3Rbbm9kZV0hO1xuICAgICAgICAgICAgY3VycmVudCA9IG5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gIFxuICAgICAgICBpZiAoY3VycmVudCA9PT0gLTEpIGJyZWFrO1xuICAgICAgICB2aXNpdGVkW2N1cnJlbnRdID0gMTtcbiAgXG4gICAgICAgIGZvciAobGV0IG5leHQgPSAwOyBuZXh0IDwgcG9pbnRDb3VudDsgbmV4dCsrKSB7XG4gICAgICAgICAgaWYgKG5leHQgPT09IGN1cnJlbnQpIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IHJvYWQgPSBnZXRyb2FkKGN1cnJlbnQsIG5leHQpO1xuICAgICAgICAgIGlmIChyb2FkID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCBuZXh0Q29zdCA9IGRpc3RbY3VycmVudF0hICsgcm9hZDtcbiAgICAgICAgICBpZiAobmV4dENvc3QgPCBkaXN0W25leHRdISkge1xuICAgICAgICAgICAgZGlzdFtuZXh0XSA9IG5leHRDb3N0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICBcbiAgICAgIGZvciAobGV0IGVuZCA9IDA7IGVuZCA8IHBvaW50Q291bnQ7IGVuZCsrKSB7XG4gICAgICAgIGlmIChlbmQgPT09IHN0YXJ0KSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgaWR4ID0gcm9hZElEWChzdGFydCwgZW5kKTtcbiAgICAgICAgQ29zdE1hdHJpeFtpZHhdID0gTWF0aC5taW4oZGlzdFtlbmRdISwgSU5GKTtcbiAgICAgIH1cbiAgICB9XG4gIFxuICB9XG5cblxuXG4gIGZ1bmN0aW9uIGZpbmRQYXRoKHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTpudW1iZXJbXSB7XG5cbiAgICBsZXQgcGF0aCA6IG51bWJlcltdID0gW3N0YXJ0XVxuICAgIGxldCBjb3N0ID0gQ29zdE1hdHJpeFtyb2FkSURYKHN0YXJ0LGVuZCldXG4gICAgd2hpbGUgKHN0YXJ0ICE9IGVuZCl7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHBvaW50cy5sZW5ndGg7IHgrKyl7XG4gICAgICAgIGlmICh4ID09IHN0YXJ0KSBjb250aW51ZVxuICAgICAgICBsZXQgcm9hZCA9IGdldHJvYWQoc3RhcnQseClcbiAgICAgICAgaWYgKHJvYWQgPT0gMCkgY29udGludWVcbiAgICAgICAgbGV0IHJlc3Rjb3N0ID0gQ29zdE1hdHJpeFtyb2FkSURYKHgsZW5kKV0hXG4gICAgICAgIGlmIChyb2FkKyByZXN0Y29zdCA9PSBjb3N0KXtcbiAgICAgICAgICBjb3N0ID0gcmVzdGNvc3RcbiAgICAgICAgICBzdGFydCA9IHhcbiAgICAgICAgICBwYXRoLnB1c2goeClcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXRoXG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGdldENvc3ROKC4uLnBvaW50czogbnVtYmVyW10pOiBudW1iZXIge1xuICBcbiAgICBsZXQgY29zdCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICBjb3N0ICs9IENvc3RNYXRyaXhbcm9hZElEWChwb2ludHNbaV0hLCBwb2ludHNbaSArIDFdISldITtcbiAgICB9XG4gICAgcmV0dXJuIGNvc3Q7XG4gIH1cblxuXG4gIHJldHVybiB7IGdldHJvYWQsIHJvYWRJRFgsIHBvaW50cywgcmFuZ2UsIENvc3RNYXRyaXgsIGZpbmRQYXRoLCBnZXRDb3N0Tn1cbn1cblxuXG5leHBvcnQgdHlwZSBSb2FkTWFwID0gdHlwZW9mIHJhbmRvbU1hcCBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cblxuIiwKICAgICJ0eXBlIEpzb25WYWx1ZSA9XG4gIHwgc3RyaW5nXG4gIHwgbnVtYmVyXG4gIHwgYm9vbGVhblxuICB8IG51bGxcbiAgfCB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG4gIHwgSnNvblZhbHVlW11cblxudHlwZSBKU09OU2NoZW1hID0geyBba2V5OiBzdHJpbmddOiBKc29uVmFsdWUgfVxuXG5jb25zdCB0eXBlTmFtZSA9ICh2YWx1ZTogdW5rbm93bik6IHN0cmluZyA9PiB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkgcmV0dXJuIFwiYXJyYXlcIlxuICByZXR1cm4gdHlwZW9mIHZhbHVlXG59XG5cbmNvbnN0IHBhdGhMYWJlbCA9IChwYXRoOiBzdHJpbmcpOiBzdHJpbmcgPT4gcGF0aCB8fCBcIiRcIlxuXG5jb25zdCBmYWlsID0gKHBhdGg6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKTogbmV2ZXIgPT4ge1xuICB0aHJvdyBuZXcgRXJyb3IoYFZhbGlkYXRpb24gZXJyb3IgYXQgJHtwYXRoTGFiZWwocGF0aCl9OiAke21lc3NhZ2V9YClcbn1cblxuY29uc3QgaXNQbGFpbk9iamVjdCA9ICh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+XG4gIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSlcblxuY29uc3QgZGVlcEVxdWFsID0gKGxlZnQ6IHVua25vd24sIHJpZ2h0OiB1bmtub3duKTogYm9vbGVhbiA9PiB7XG4gIGlmIChPYmplY3QuaXMobGVmdCwgcmlnaHQpKSByZXR1cm4gdHJ1ZVxuICBpZiAoQXJyYXkuaXNBcnJheShsZWZ0KSAmJiBBcnJheS5pc0FycmF5KHJpZ2h0KSkge1xuICAgIHJldHVybiBsZWZ0Lmxlbmd0aCA9PT0gcmlnaHQubGVuZ3RoICYmIGxlZnQuZXZlcnkoKHZhbHVlLCBpbmRleCkgPT4gZGVlcEVxdWFsKHZhbHVlLCByaWdodFtpbmRleF0pKVxuICB9XG4gIGlmIChpc1BsYWluT2JqZWN0KGxlZnQpICYmIGlzUGxhaW5PYmplY3QocmlnaHQpKSB7XG4gICAgY29uc3QgbGVmdEtleXMgPSBPYmplY3Qua2V5cyhsZWZ0KVxuICAgIGNvbnN0IHJpZ2h0S2V5cyA9IE9iamVjdC5rZXlzKHJpZ2h0KVxuICAgIHJldHVybiBsZWZ0S2V5cy5sZW5ndGggPT09IHJpZ2h0S2V5cy5sZW5ndGhcbiAgICAgICYmIGxlZnRLZXlzLmV2ZXJ5KGtleSA9PiBrZXkgaW4gcmlnaHQgJiYgZGVlcEVxdWFsKGxlZnRba2V5XSwgcmlnaHRba2V5XSkpXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmNvbnN0IGFwcGVuZFBhdGggPSAocGF0aDogc3RyaW5nLCBwYXJ0OiBzdHJpbmcpOiBzdHJpbmcgPT5cbiAgcGF0aCA/IGAke3BhdGh9JHtwYXJ0fWAgOiBgJCR7cGFydH1gXG5cbmNvbnN0IHZhbGlkYXRlT2JqZWN0ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIWlzUGxhaW5PYmplY3QodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBvYmplY3QsIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICBjb25zdCBvYmplY3RWYWx1ZSA9IHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+XG5cbiAgY29uc3QgcHJvcGVydGllcyA9IGlzUGxhaW5PYmplY3Qoc2NoZW1hLnByb3BlcnRpZXMpID8gc2NoZW1hLnByb3BlcnRpZXMgOiB7fVxuICBjb25zdCByZXF1aXJlZCA9IEFycmF5LmlzQXJyYXkoc2NoZW1hLnJlcXVpcmVkKSA/IHNjaGVtYS5yZXF1aXJlZCA6IFtdXG5cbiAgZm9yIChjb25zdCBrZXkgb2YgcmVxdWlyZWQpIHtcbiAgICBpZiAodHlwZW9mIGtleSAhPT0gXCJzdHJpbmdcIikgY29udGludWVcbiAgICBpZiAoIShrZXkgaW4gb2JqZWN0VmFsdWUpKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2tleX1gKSwgXCJpcyByZXF1aXJlZFwiKVxuICB9XG5cbiAgZm9yIChjb25zdCBba2V5LCBwcm9wZXJ0eVNjaGVtYV0gb2YgT2JqZWN0LmVudHJpZXMocHJvcGVydGllcykpIHtcbiAgICBpZiAoIShrZXkgaW4gb2JqZWN0VmFsdWUpKSBjb250aW51ZVxuICAgIGlmICghaXNQbGFpbk9iamVjdChwcm9wZXJ0eVNjaGVtYSkpIGNvbnRpbnVlXG4gICAgdmFsaWRhdGVKc29uU2NoZW1hKHByb3BlcnR5U2NoZW1hIGFzIEpTT05TY2hlbWEsIG9iamVjdFZhbHVlW2tleV0sIGFwcGVuZFBhdGgocGF0aCwgYC4ke2tleX1gKSlcbiAgfVxuXG4gIGNvbnN0IGV4dHJhS2V5cyA9IE9iamVjdC5rZXlzKG9iamVjdFZhbHVlKS5maWx0ZXIoa2V5ID0+ICEoa2V5IGluIHByb3BlcnRpZXMpKVxuICBjb25zdCBhZGRpdGlvbmFsID0gc2NoZW1hLmFkZGl0aW9uYWxQcm9wZXJ0aWVzXG4gIGlmIChhZGRpdGlvbmFsID09PSBmYWxzZSkge1xuICAgIGlmIChleHRyYUtleXMubGVuZ3RoID4gMCkgZmFpbChhcHBlbmRQYXRoKHBhdGgsIGAuJHtleHRyYUtleXNbMF19YCksIFwiYWRkaXRpb25hbCBwcm9wZXJ0aWVzIGFyZSBub3QgYWxsb3dlZFwiKVxuICAgIHJldHVyblxuICB9XG5cbiAgaWYgKGlzUGxhaW5PYmplY3QoYWRkaXRpb25hbCkpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBleHRyYUtleXMpIHtcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShhZGRpdGlvbmFsIGFzIEpTT05TY2hlbWEsIG9iamVjdFZhbHVlW2tleV0sIGFwcGVuZFBhdGgocGF0aCwgYC4ke2tleX1gKSlcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgdmFsaWRhdGVBcnJheSA9IChzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYXJyYXksIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICBjb25zdCBhcnJheVZhbHVlID0gdmFsdWUgYXMgdW5rbm93bltdXG4gIGlmICghaXNQbGFpbk9iamVjdChzY2hlbWEuaXRlbXMpKSByZXR1cm5cbiAgYXJyYXlWYWx1ZS5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4gdmFsaWRhdGVKc29uU2NoZW1hKHNjaGVtYS5pdGVtcyBhcyBKU09OU2NoZW1hLCBpdGVtLCBhcHBlbmRQYXRoKHBhdGgsIGBbJHtpbmRleH1dYCkpKVxufVxuXG5jb25zdCB2YWxpZGF0ZUJ5VHlwZSA9IChzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgc3dpdGNoIChzY2hlbWEudHlwZSkge1xuICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIGZhaWwocGF0aCwgYGV4cGVjdGVkIHN0cmluZywgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm51bWJlclwiIHx8IE51bWJlci5pc05hTih2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG51bWJlciwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJib29sZWFuXCIpIGZhaWwocGF0aCwgYGV4cGVjdGVkIGJvb2xlYW4sIGdvdCAke3R5cGVOYW1lKHZhbHVlKX1gKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm51bGxcIjpcbiAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVsbCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwiYXJyYXlcIjpcbiAgICAgIHZhbGlkYXRlQXJyYXkoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgIHZhbGlkYXRlT2JqZWN0KHNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgICByZXR1cm5cbiAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgIHJldHVyblxuICAgIGRlZmF1bHQ6XG4gICAgICBmYWlsKHBhdGgsIGB1bnN1cHBvcnRlZCBzY2hlbWEgdHlwZSAke0pTT04uc3RyaW5naWZ5KHNjaGVtYS50eXBlKX1gKVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZUpzb25TY2hlbWEgPSA8VD4oc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aCA9IFwiXCIpOiBUID0+IHtcbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEgJiYgIWRlZXBFcXVhbCh2YWx1ZSwgc2NoZW1hLmNvbnN0KSkge1xuICAgIGZhaWwocGF0aCwgYGV4cGVjdGVkIGNvbnN0YW50ICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLmNvbnN0KX1gKVxuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFueU9mKSkge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXVxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHNjaGVtYS5hbnlPZikge1xuICAgICAgaWYgKCFpc1BsYWluT2JqZWN0KG9wdGlvbikpIGNvbnRpbnVlXG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gdmFsaWRhdGVKc29uU2NoZW1hPFQ+KG9wdGlvbiBhcyBKU09OU2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSlcbiAgICAgIH1cbiAgICB9XG4gICAgZmFpbChwYXRoLCBlcnJvcnNbMF0gPz8gXCJkaWQgbm90IG1hdGNoIGFueSBhbGxvd2VkIHNjaGVtYVwiKVxuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hLmFsbE9mKSkge1xuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHNjaGVtYS5hbGxPZikge1xuICAgICAgaWYgKCFpc1BsYWluT2JqZWN0KG9wdGlvbikpIGNvbnRpbnVlXG4gICAgICB2YWxpZGF0ZUpzb25TY2hlbWEob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgIH1cbiAgfVxuXG4gIHZhbGlkYXRlQnlUeXBlKHNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gIHJldHVybiB2YWx1ZSBhcyBUXG59XG4iLAogICAgImltcG9ydCB7IHZhbGlkYXRlSnNvblNjaGVtYSB9IGZyb20gXCIuL2pzb25zY2hlbWFcIlxuXG5cbmV4cG9ydCB0eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25EYXRhIH1cblxuXG5leHBvcnQgdHlwZSBKc29uRGF0YSA9IHN0cmluZyB8IG51bGwgfCBudW1iZXIgfCBib29sZWFuIHwgeyBba2V5IGluIHN0cmluZ106IEpzb25EYXRhIH0gfCBKc29uRGF0YVtdXG5cbmV4cG9ydCB0eXBlIFNjaGVtYTxUPiA9IHsganNvbjogSlNPTlNjaGVtYSB9XG5cbmV4cG9ydCB0eXBlIEluZmVyPFM+ID0gUyBleHRlbmRzIFNjaGVtYTxpbmZlciBUPiA/IFQgOiBuZXZlclxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGUgPSA8VD4gKHNjaGVtYTogU2NoZW1hPFQ+LCBkYXRhOnVua25vd24pIDogVCA9PiB7XG4gIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4oc2NoZW1hLmpzb24sIGRhdGEpXG59XG5cbmV4cG9ydCBjb25zdCBzdHJpbmdpZnkgPSAoZGF0YTogSnNvbkRhdGEpOiBzdHJpbmcgPT4gSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMilcblxuXG5leHBvcnQgY29uc3QgZmlsbFNjaGVtYSA9IDxUPihzY2hlbWE6IFNjaGVtYTxUPikgOiBUID0+e1xuICBsZXQganNvbiA9IHNjaGVtYS5qc29uXG4gIGlmIChqc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwiXCIgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVtYmVyXCIpIHJldHVybiAwIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcImJvb2xlYW5cIikgcmV0dXJuIGZhbHNlIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIG51bGwgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYXJyYXlcIikgcmV0dXJuIFtdIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm9iamVjdFwiICYmIGpzb24ucHJvcGVydGllcyl7XG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fVxuICAgIGxldCByZXF1aXJlZCA9IEFycmF5LmlzQXJyYXkoanNvbi5yZXF1aXJlZCkgPyBqc29uLnJlcXVpcmVkIGFzIHN0cmluZ1tdIDogW11cbiAgICBmb3IgKGxldCByZXEgb2YgcmVxdWlyZWQpXG4gICAgICByZXN1bHRbcmVxXSA9IGZpbGxTY2hlbWEoe2pzb246IChqc29uLnByb3BlcnRpZXMgYXMgYW55KVtyZXFdfSlcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBqc29uKSByZXR1cm4ganNvbi5jb25zdCBhcyBUXG4gIGlmIChcImFueU9mXCIgaW4ganNvbiAmJiBBcnJheS5pc0FycmF5KGpzb24uYW55T2YpKSByZXR1cm4gZmlsbFNjaGVtYSh7anNvbjoganNvbi5hbnlPZlswXSBhcyBKU09OU2NoZW1hfSkgYXMgVFxuICByZXR1cm4gbnVsbCBhcyBUXG59XG5cbmV4cG9ydCBjb25zdCBmcm9tSnNvblNjaGVtYSA9IDxUPiAoanNvbjogSlNPTlNjaGVtYSk6IFNjaGVtYTxUPiA9PiAoe2pzb259KVxuXG5leHBvcnQgY29uc3Qgc3RyaW5nOiBTY2hlbWE8c3RyaW5nPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcInN0cmluZ1wifSlcbmV4cG9ydCBjb25zdCBudW1iZXI6IFNjaGVtYTxudW1iZXI+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVtYmVyXCJ9KVxuZXhwb3J0IGNvbnN0IGJvb2xlYW46IFNjaGVtYTxib29sZWFuPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImJvb2xlYW5cIn0pXG5leHBvcnQgY29uc3QgbnVsbFNjaGVtYSA6IFNjaGVtYTxudWxsPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm51bGxcIn0pXG5leHBvcnQgY29uc3QgYW55OiBTY2hlbWE8YW55PiA9IGZyb21Kc29uU2NoZW1hKHt9KVxuZXhwb3J0IGNvbnN0IG9wdGlvbmFsID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFNjaGVtYTxUIHwgbnVsbD4gPT4gZnJvbUpzb25TY2hlbWEoe2FueU9mOiBbe3R5cGU6IFwibnVsbFwifSwgc2NoZW1hLmpzb25dfSlcbmV4cG9ydCBjb25zdCBhcnJheSA9IDxUPihpdGVtU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8VFtdPiA9PiBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJhcnJheVwiLCBpdGVtczogaXRlbVNjaGVtYS5qc29ufSlcbmV4cG9ydCBjb25zdCBjb25zdGFudCA9IDxUIGV4dGVuZHMgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbj4odmFsdWU6IFQpOiBTY2hlbWE8VD4gPT4gZnJvbUpzb25TY2hlbWEoe2NvbnN0OiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBvYmplY3QgPSA8UyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIFNjaGVtYTxhbnk+Pj4gKHNoYXBlOiBTKTogU2NoZW1hPHtbSyBpbiBrZXlvZiBTXTogSW5mZXI8U1tLXT59PiA9PiBmcm9tSnNvblNjaGVtYSh7XG4gIHR5cGU6IFwib2JqZWN0XCIsXG4gIHByb3BlcnRpZXM6IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyhzaGFwZSkubWFwKChba2V5LCBmaWVsZF0pPT4gW2tleSwgZmllbGQuanNvbl0pKSxcbiAgcmVxdWlyZWQ6IE9iamVjdC5rZXlzKHNoYXBlKVxufSlcblxuZXhwb3J0IGNvbnN0IHJlY29yZCA9IDxUPih2YWx1ZVNjaGVtYTogU2NoZW1hPFQ+KTogU2NoZW1hPFJlY29yZDxzdHJpbmcsIFQ+PiA9PiBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJvYmplY3RcIiwgYWRkaXRpb25hbFByb3BlcnRpZXM6IHZhbHVlU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IHNjaGVtYVNjaGVtYSA6IFNjaGVtYTxKU09OU2NoZW1hPiA9IHJlY29yZChhbnkpXG5cbmV4cG9ydCBjb25zdCB1bmlvbiA9IDxTIGV4dGVuZHMgU2NoZW1hPGFueT5bXT4oLi4uc2NoZW1hczogUyk6IFNjaGVtYTxJbmZlcjxTW251bWJlcl0+PiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IHNjaGVtYXMubWFwKHM9PiBzLmpzb24pfSlcblxuZXhwb3J0IGZ1bmN0aW9uIHRhZ2dlZCA8UyBleHRlbmRzIHtba2V5IDogc3RyaW5nXTogU2NoZW1hPGFueT59PiAoZmllbGRzOiBTKSA6IFNjaGVtYTx7W2tleSBpbiBrZXlvZiBTXTogeyQ6IGtleSwgdmFsOkluZmVyPFNba2V5XT59IH1ba2V5b2YgU10+IHtcbiAgcmV0dXJuIHVuaW9uKC4uLk9iamVjdC5lbnRyaWVzKGZpZWxkcykubWFwKChbJCx2YWxdKT0+b2JqZWN0KHskOmNvbnN0YW50KCQpLHZhbH0pKSlcbn1cblxuXG5cblxuZXhwb3J0IGNvbnN0IGludGVyc2VjdGlvbiA9IDxTIGV4dGVuZHMgU2NoZW1hPGFueT5bXT4oLi4uc2NoZW1hczogUyk6IFNjaGVtYTxJbmZlcjxTW251bWJlcl0+PiA9PiBmcm9tSnNvblNjaGVtYSh7YWxsT2Y6IHNjaGVtYXMubWFwKHM9PiBzLmpzb24pfSlcblxuZXhwb3J0IGNvbnN0IGFzVHlwZVZpZXcgPSAoc2NoZW1hOiBTY2hlbWE8YW55Pik6IHN0cmluZyA9PiB7XG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBcInN0cmluZ1wiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwibnVtYmVyXCIpIHJldHVybiBcIm51bWJlclwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gXCJib29sZWFuXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudWxsXCIpIHJldHVybiBcIm51bGxcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcImFycmF5XCIgJiYgc2NoZW1hLmpzb24uaXRlbXMpIHJldHVybiBgJHthc1R5cGVWaWV3KHtqc29uOiBzY2hlbWEuanNvbi5pdGVtcyBhcyBKU09OU2NoZW1hfSl9W11gXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYgc2NoZW1hLmpzb24ucHJvcGVydGllcyl7XG4gICAgbGV0IHByb3BzID0gT2JqZWN0LmVudHJpZXMoc2NoZW1hLmpzb24ucHJvcGVydGllcykubWFwKChba2V5LCBwcm9wXSk9PiBgJHtrZXl9OiAke2FzVHlwZVZpZXcoe2pzb246IHByb3AgYXMgSlNPTlNjaGVtYX0pfWApXG4gICAgcmV0dXJuIGB7XFxuICAke3Byb3BzLmpvaW4oXCIsXFxuXCIpLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCJcXG4gIFwiKX1cXG59YFxuICB9XG4gIGlmIChcImNvbnN0XCIgaW4gc2NoZW1hLmpzb24pIHJldHVybiBKU09OLnN0cmluZ2lmeShzY2hlbWEuanNvbi5jb25zdClcbiAgaWYgKFwiYW55T2ZcIiBpbiBzY2hlbWEuanNvbiAmJiBBcnJheS5pc0FycmF5KHNjaGVtYS5qc29uLmFueU9mKSkgcmV0dXJuIHNjaGVtYS5qc29uLmFueU9mLm1hcChzPT4gYXNUeXBlVmlldyh7anNvbjogcyBhcyBKU09OU2NoZW1hfSkpLmpvaW4oXCIgfCBcIilcbiAgcmV0dXJuIFwiYW55XCJcbn1cblxuXG4iLAogICAgImltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRJbnQsIHJhbmRvbSB9IGZyb20gXCIuL3JhbmRvbVwiO1xuaW1wb3J0IHsgcmFuZG9tTWFwIH0gZnJvbSBcIi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cbmV4cG9ydCB0eXBlIFVVSUQgPSBgdSR7c3RyaW5nfS0ke3N0cmluZ31gXG5leHBvcnQgY29uc3QgVVVJRCA6IFNjaGVtYTxVVUlEPiA9IHN0cmluZ1xuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IG51bWJlcixcbiAgZW5kUG9pbnQ6IG51bWJlcixcbiAgdmFsdWVfZXVyOiBudW1iZXIsXG4gIGRlYWRsaW5lX2g6IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21Nb2R1bGUgKFxuICBOUkVRUyA9IDIwMCxcbiAgTlRSQU5TID0gNDAsXG4gIE5QT0lOVFMgPSAxMDAsXG4gIE1BUFNJWkUgPSA0MDAsXG4gIHNlZWQgPSAyMixcbil7XG5cbiAgY29uc3Qgcm9hZG1hcCA9IHJhbmRvbU1hcChOUE9JTlRTLCBNQVBTSVpFKVxuXG4gIHJldHVybiB7XG4gICAgTlRSQU5TLFxuICAgIE5SRVFTLFxuICAgIE1BUFNJWkUsXG4gICAgUlNJWkU6IE5QT0lOVFMgKiBOUE9JTlRTIC8gMixcbiAgICByb2FkbWFwLFxuICAgIHJlcXVlc3RzOiBBcnJheS5mcm9tKHtsZW5ndGg6TlJFUVN9LCAoXyxpKT0+ICh7XG4gICAgICBpZDogcmFuZG9tVVVJRCgpLFxuICAgICAgZGVhZGxpbmVfaDogKDErcmFuZG9tKCkpICogNDAsXG4gICAgICBzdGFydFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRtYXAucmFuZ2UpIGFzIG51bWJlcixcbiAgICAgIHZhbHVlX2V1cjogcmFuZEludCgxMDAsIDQwMCksXG4gICAgfSkgYXMgUmVxdWVzdCksXG4gICAgc3RhcnRwb3NpdGlvbnM6IEFycmF5LmZyb20oe2xlbmd0aDpOVFJBTlN9LCAoXyxpKT0+cmFuZENob2ljZShyb2FkbWFwLnJhbmdlKSBhcyBudW1iZXIpLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgTW9kdWxlID0gdHlwZW9mIHJhbmRvbU1vZHVsZSBleHRlbmRzICguLi54OmFueSkgPT4gKGluZmVyIFQpID8gVCA6IG5ldmVyXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgIlxuXG5pbXBvcnQgeyByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi4vcmFuZG9tXCJcbmltcG9ydCB7IGJvcmRlclJhZGl1cywgY29sb3IsIGRpc3BsYXksIGRpdiwgcCwgcG9wdXAsIHByZSwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdGgsIHRyIH0gZnJvbSBcIi4uL3ZpZXcvaHRtbFwiXG5pbXBvcnQgdHlwZSB7IE1vZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiXG5pbXBvcnQgeyBoaWdodExpZ2h0cyB9IGZyb20gXCIuLi92aWV3L21haW5cIlxuXG5cbmZ1bmN0aW9uIGlzbG9hZCh4Om51bWJlcil7XG4gIHJldHVybiB4ICYgMVxufVxuXG5mdW5jdGlvbiBnZXREZWNrKHg6bnVtYmVyKXtcbiAgcmV0dXJuICh4ICYgMikgPj4gMVxufVxuXG5mdW5jdGlvbiBnZXRSZXEoeDpudW1iZXIpe1xuICByZXR1cm4gKHggJiAweEZGRkYpID4+IDJcbn1cblxuZnVuY3Rpb24gZ2V0UG9zKHg6bnVtYmVyKXtcbiAgcmV0dXJuIHg+PjE2XG59XG5cblxuXG5jb25zdCBLTV9DT1NUID0gLjVcbmNvbnN0IEFWR19TUEVFRF9LTUggPSA2MFxuY29uc3QgUkVPUkdfQ09TVF9FVVIgPSAxMDBcblxuZXhwb3J0IGZ1bmN0aW9uIHNpbXBsZUFubmVhbGluZyhtb2Q6IE1vZHVsZSl7XG5cbiAgY29uc3Qge05SRVFTLCByZXF1ZXN0cywgc3RhcnRwb3NpdGlvbnMsIE5UUkFOUywgcm9hZG1hcH0gPSBtb2RcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKE5SRVFTICogMi41ICsgMTApXG5cbiAgY29uc3QgcmVxUGlja3VwTG9jYXRpb25zICAgPSBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKHI9PnIuc3RhcnRQb2ludCkpXG4gIGNvbnN0IHJlcURlbGl2ZXJ5TG9jYXRpb25zID0gbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcChyPT5yLmVuZFBvaW50KSlcbiAgY29uc3QgcmVxRGVhZGxpbmVzID0gICAgICAgICBuZXcgVWludDMyQXJyYXkocmVxdWVzdHMubWFwKHI9PnIuZGVhZGxpbmVfaCAqIEFWR19TUEVFRF9LTUgpKSAvLyBkZWFkbGluZSBpbiBrbVxuICBjb25zdCByZXFWYWx1ZXMgPSAgICAgICAgICAgIG5ldyBVaW50MzJBcnJheShyZXF1ZXN0cy5tYXAocj0+ci52YWx1ZV9ldXIvIEtNX0NPU1QpKSAvLyB2YWx1ZSBpbiBrbVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShyZXF1ZXN0cy5tYXAocj0+MSkpXG5cbiAgY29uc3QgdHJhblN0YXJ0ID0gbmV3IFVpbnQxNkFycmF5KHN0YXJ0cG9zaXRpb25zKVxuICBjb25zdCBzY2hlZHVsZSA9IG5ldyBVaW50MzJBcnJheShUU0laRSAqIE5UUkFOUylcbiAgY29uc3Qgc2NoZWR1bGVTaXplcyA9IG5ldyBVaW50MTZBcnJheShOVFJBTlMpXG5cblxuICBsZXQgSU5GID0gMTw8MTVcblxuICBmdW5jdGlvbiBzY29yZSh0cmFuOm51bWJlcil7XG4gICAgbGV0IHJld2FyZCA9IDBcbiAgICBsZXQgZHVyYXRpb24gPSAwXG4gICAgbGV0IGRlY2tzOiBbbnVtYmVyW10sIG51bWJlcltdXSA9IFtbXSwgW11dXG4gICAgbGV0IHBvcyA9IHRyYW5TdGFydFt0cmFuXSFcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaGVkdWxlU2l6ZXNbdHJhbl0hOyBpKyspe1xuICAgICAgbGV0IHN0ZXAgPSBzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpXSFcbiAgICAgIGNvbnN0IGxvYWQgPSBpc2xvYWQoc3RlcClcbiAgICAgIGNvbnN0IHJlcSA9IGdldFJlcShzdGVwKVxuICAgICAgY29uc3QgbmV4dHBvcyA9IGdldFBvcyhzdGVwKVxuICAgICAgZHVyYXRpb24gKz0gcm9hZG1hcC5nZXRDb3N0Tihwb3MsIG5leHRwb3MpXG4gICAgICBwb3MgPSBuZXh0cG9zXG4gICAgICBpZiAobG9hZCl7XG4gICAgICAgIGxldCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hXG4gICAgICAgIGRlY2sucHVzaChyZXEpXG4gICAgICAgIGlmIChkZWNrLmxlbmd0aCA+IDMpIHJldHVybiAtSU5GXG4gICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGRlY2sgPSBkZWNrc1tnZXREZWNrKHN0ZXApXSFcbiAgICAgICAgbGV0IGlkeCA9IGRlY2suaW5kZXhPZihyZXEpXG4gICAgICAgIGlmIChpZHggPT0gLTEpIHRocm93IG5ldyBFcnJvcihcImNhciBub3QgZm91bmRcIilcbiAgICAgICAgZHVyYXRpb24gKz0gKGRlY2subGVuZ3RoLWlkeC0xKSAqIFJFT1JHX0NPU1RfRVVSIC8gS01fQ09TVFxuICAgICAgICBkZWNrLnNwbGljZShpZHgsIDEpXG5cbiAgICAgICAgaWYgKGR1cmF0aW9uIDw9IHJlcURlYWRsaW5lc1tyZXFdISkgcmV3YXJkICs9IHJlcVZhbHVlc1tyZXFdIVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXdhcmQgLSBkdXJhdGlvblxuICB9XG5cbiAgY29uc3Qgc2NoZWR1bGVSYXRpbmdzID0gSW50MzJBcnJheS5mcm9tKHtsZW5ndGg6IE5UUkFOU30sIChfLCBpKT0+c2NvcmUoaSkpXG5cbiAgZnVuY3Rpb24gc2V0UmVxKHRyYW46IG51bWJlciwgaWR4OiBudW1iZXIsIGlzbG9hZDogMXwwLCBkZWNrOiAxfDAsIHJlcTogbnVtYmVyLCBwb3M6bnVtYmVyKXtcbiAgICBzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpZHhdID0gKGlzbG9hZCA8PCAwKSB8IChkZWNrIDw8IDEpIHwgKHJlcSA8PCAyKSB8IChwb3MgPDwgMTYpXG4gIH1cblxuICBmdW5jdGlvbiBpbnNlcnRTdG9wcyh0cmFuOm51bWJlciwgc3RhcnQ6bnVtYmVyLCBlbmQ6IG51bWJlciwgZGVjazogMHwxLCByZXE6bnVtYmVyKXtcblxuICAgIGNvbnN0IG9mZnNldCA9IHRyYW4gKiBUU0laRVxuICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dIVxuICAgIHNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplICsgMlxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kICsgMiwgb2Zmc2V0ICsgZW5kLCBvZmZzZXQgKyBzaXplKVxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQgKyAxLCBvZmZzZXQgKyBzdGFydCwgb2Zmc2V0ICsgZW5kICsgMSlcbiAgICBzZXRSZXEodHJhbiwgc3RhcnQsIDEsIGRlY2ssIHJlcSwgcmVxUGlja3VwTG9jYXRpb25zW3JlcV0hKVxuICAgIHNldFJlcSh0cmFuLCBlbmQgKyAxLCAwLCBkZWNrLCByZXEsIHJlcURlbGl2ZXJ5TG9jYXRpb25zW3JlcV0hKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlU3RvcHModHJhbjpudW1iZXIsIHN0YXJ0Om51bWJlciwgZW5kOiBudW1iZXIpe1xuICAgIGNvbnN0IG9mZnNldCA9IHRyYW4gKiBUU0laRVxuICAgIGNvbnN0IHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dIVxuICAgIHNjaGVkdWxlU2l6ZXNbdHJhbl0gPSBzaXplIC0gMlxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgc3RhcnQsIG9mZnNldCArIHN0YXJ0ICsgMSwgb2Zmc2V0ICsgZW5kKVxuICAgIHNjaGVkdWxlLmNvcHlXaXRoaW4ob2Zmc2V0ICsgZW5kIC0gMSwgb2Zmc2V0ICsgZW5kICsgMSwgb2Zmc2V0ICsgc2l6ZSlcbiAgfVxuXG4gIGxldCBzdGFydF90ZW1wID0gMTAwXG4gIGxldCB0ZW1wID0gc3RhcnRfdGVtcFxuXG4gIGZ1bmN0aW9uIGFjY2VwdChwcmV2X3JhdGluZzpudW1iZXIsIG5leHRfcmF0aW5nOiBudW1iZXIpe1xuICAgIHJldHVybiByYW5kb20oKSA8IE1hdGguZXhwKChuZXh0X3JhdGluZy1wcmV2X3JhdGluZykgLyB0ZW1wKVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5QXNzaWduKCl7XG4gICAgbGV0IHRyYW4gPSByYW5kSW50KDAsIE5UUkFOUylcbiAgICBsZXQgc2NoZWRzaXplID0gc2NoZWR1bGVTaXplc1t0cmFuXSFcblxuICAgIGxldCBhID0gcmFuZEludCgwLHNjaGVkc2l6ZSsxKVxuICAgIGxldCBiID0gTWF0aC5taW4oc2NoZWRzaXplLCByYW5kSW50KDAsNCkgKyBhKVxuXG4gICAgbGV0IHJlcSA9IHJhbmRJbnQoMCwgTlJFUVMpXG4gICAgaWYgKCF1bmFzc2lnbmVkW3JlcV0pIHJldHVyblxuICBcbiAgICBpbnNlcnRTdG9wcyh0cmFuLCBhLCBiLCByYW5kb20oKSA+IC41ID8gMSA6IDAgLCByZXEpXG4gICAgbGV0IG5ld3JhdGluZyA9IHNjb3JlKHRyYW4pXG4gICAgaWYgKGFjY2VwdChzY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBuZXdyYXRpbmcpKXtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9bmV3cmF0aW5nXG4gICAgICB1bmFzc2lnbmVkW3JlcV0gPSAwXG4gICAgfWVsc2V7XG4gICAgICByZW1vdmVTdG9wcyh0cmFuLCBhLCBiKzEpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKXtcbiAgICBsZXQgdHJhbiA9IHJhbmRJbnQoMCwgTlRSQU5TKVxuICAgIGxldCBzY2hlZHNpemUgPSBzY2hlZHVsZVNpemVzW3RyYW5dIVxuICAgIGlmIChzY2hlZHNpemUgPCAyKSByZXR1cm5cbiAgICBsZXQgaWR4ID0gcmFuZEludCgwLCBzY2hlZHNpemUpXG4gICAgbGV0IGl0ZW0gPSBzY2hlZHVsZVt0cmFuICogVFNJWkUgKyBpZHhdIVxuICAgIGxldCByZXEgPSBnZXRSZXEoaXRlbSlcblxuICAgIGxldCBhYiA6bnVtYmVyW10gPSBbXVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlZHNpemU7IGkrKyl7XG4gICAgICBpZiAoZ2V0UmVxKHNjaGVkdWxlW3RyYW4gKiBUU0laRSArIGldISkgPT0gcmVxKSBhYi5wdXNoKGkpXG4gICAgfVxuXG4gICAgbGV0IFthLGJdID0gYWIgYXMgW251bWJlciwgbnVtYmVyXVxuICAgIHJlbW92ZVN0b3BzKHRyYW4sIGEsYilcbiAgICBsZXQgbmV3cmF0aW5nID0gc2NvcmUodHJhbikgXG4gICAgaWYgKGFjY2VwdChzY2hlZHVsZVJhdGluZ3NbdHJhbl0hLCBuZXdyYXRpbmcpKXtcbiAgICAgIHNjaGVkdWxlUmF0aW5nc1t0cmFuXSA9IG5ld3JhdGluZ1xuICAgICAgdW5hc3NpZ25lZFtyZXFdID0gMVxuICAgIH1lbHNle1xuICAgICAgaW5zZXJ0U3RvcHModHJhbixhLGItMSwgZ2V0RGVjayhpdGVtKSBhcyAwfDEsIHJlcSlcbiAgICB9XG5cbiAgfVxuXG4gIGxldCBzdCA9IERhdGUubm93KClcblxuICBsZXQgTlNURVBTID0gNDAwMDAwXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBOU1RFUFM7IGkrKyl7XG4gICAgdGVtcCA9ICgxLSgoaSkvTlNURVBTKSkgKiBzdGFydF90ZW1wXG4gICAgdHJ5VW5hc3NpZ24oKVxuICAgIHRyeUFzc2lnbigpXG4gIH1cblxuICB0aW1lID0gRGF0ZS5ub3coKSAtIHN0XG5cbiAgcmV0dXJuIHtcbiAgICBzY2hlZHVsZSwgc2NoZWR1bGVTaXplcywgdHJhblN0YXJ0LCBUU0laRSwgc2NoZWR1bGVSYXRpbmdzLCB1bmFzc2lnbmVkXG4gIH1cblxufVxuXG5cbmxldCB0aW1lID0gMFxuXG5sZXQgYW5uZWFsZXIgOiBSZXR1cm5UeXBlPHR5cGVvZiBzaW1wbGVBbm5lYWxpbmc+IHwgbnVsbCA9IG51bGxcblxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHBsYW5uZXJWaWV3KG1vZDogTW9kdWxlKTpIVE1MRWxlbWVudHtcbiAgY29uc3Qgb3V0ZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmdyYXlcbiAgY29uc3QgaW5uZXJCb3JkZXIgPSBcIjFweCBzb2xpZCBcIiArIGNvbG9yLmxpZ2h0Z3JheVxuICBjb25zdCBjZWxsUGFkZGluZyA9IFwiLjM1ZW0gLjVlbVwiXG4gIGNvbnN0IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCA9IFwiMi4xZW1cIlxuXG4gIGZ1bmN0aW9uIGl0ZW1CdXR0b24gKGl0ZW06bnVtYmVyKXtcbiAgICBsZXQgcmVxID0gbW9kLnJlcXVlc3RzW2l0ZW1dIVxuXG4gICAgbGV0IHNwID0gc3BhbihpdGVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMywnICcpLFxuICAgICAgc3R5bGUoe2N1cnNvcjpcInBvaW50ZXJcIiwgYm9yZGVyOiBcIjJweCBzb2xpZCB0cmFuc3BhcmVudFwiLCBib3JkZXJSYWRpdXM6XCIuMmVtXCIsIHdoaXRlU3BhY2U6IFwicHJlXCIsIGZvbnRGYW1pbHk6XCJtb25vc3BhY2VcIn0pLFxuICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgcG9wdXAoXG4gICAgICAgICAgcChcIm5vOiBcIiwgaXRlbSksXG4gICAgICAgICAgcChcInZhbHVlOiBcIiwgcmVxLnZhbHVlX2V1ciArIFwi4oKsXCIpLFxuICAgICAgICAgIHAoXCJkaXN0OiBcIiwgbW9kLnJvYWRtYXAuZ2V0Q29zdE4ocmVxLnN0YXJ0UG9pbnQsIHJlcS5lbmRQb2ludCkgKyBcImttXCIpXG4gICAgICAgIClcbiAgICB9KVxuXG4gICAgc3Aub25tb3VzZWVudGVyID0gZT0+e1xuXG4gICAgICBzcC5zdHlsZS5ib3JkZXJDb2xvciA9IGNvbG9yLmdyZWVuXG4gICAgICBoaWdodExpZ2h0cy5zZXQoW1xuICAgICAgICB7XG4gICAgICAgICAgcG9pbnRzOiBbe1xuICAgICAgICAgICAgbnVtYmVyOiByZXEuc3RhcnRQb2ludCxcbiAgICAgICAgICAgIGxvZ286IFwi8J+TplwiXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbnVtYmVyOiByZXEuZW5kUG9pbnQsXG4gICAgICAgICAgICBsb2dvOiBcIvCfj6BcIlxuICAgICAgICAgIH1dLFxuICAgICAgICB9XG4gICAgICBdKVxuICAgIH1cblxuICAgIHNwLm9ubW91c2VsZWF2ZSA9IGU9PiB7c3Auc3R5bGUuYm9yZGVyQ29sb3IgPSBcInRyYW5zcGFyZW50XCJ9XG4gICAgcmV0dXJuIHNwXG4gIH1cblxuICBpZiAoYW5uZWFsZXIgPT0gbnVsbCkgYW5uZWFsZXIgPSBzaW1wbGVBbm5lYWxpbmcobW9kKVxuXG5cbiAgbGV0IHRhYiA9IHRhYmxlKFxuICAgIHN0eWxlKHtcbiAgICAgIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgfSksXG5cbiAgICB0cihcbiAgICAgIHRoKFwidHJhbnNwb3J0ZXJcIiwgc3R5bGUoe2JvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB0ZXh0QWxpZ246IFwibGVmdFwifSkpLFxuICAgICAgdGgoXCJ2YWx1ZVwiLCBzdHlsZSh7Ym9yZGVyOiBvdXRlckJvcmRlciwgcGFkZGluZzogY2VsbFBhZGRpbmcsIHRleHRBbGlnbjogXCJsZWZ0XCJ9KSksXG4gICAgICB0aChcInN0ZXBzXCIsIHN0eWxlKHtib3JkZXI6IG91dGVyQm9yZGVyLCBwYWRkaW5nOiBjZWxsUGFkZGluZywgdGV4dEFsaWduOiBcImxlZnRcIn0pKVxuICAgICksXG4gICAgbW9kLnN0YXJ0cG9zaXRpb25zLm1hcCgoc3RhcnQsIHRyYW4pPT57XG4gICAgICByZXR1cm4gdHIoXG5cbiAgICAgICAgdGQodHJhbiwgc3R5bGUoe2JvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwifSkpLFxuICAgICAgICB0ZChhbm5lYWxlcj8uc2NoZWR1bGVSYXRpbmdzW3RyYW5dISwgc3R5bGUoe2JvcmRlcjogb3V0ZXJCb3JkZXIsIHBhZGRpbmc6IGNlbGxQYWRkaW5nLCB2ZXJ0aWNhbEFsaWduOiBcInRvcFwifSkpLFxuICAgICAgICB0YWJsZShcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLFxuICAgICAgICAgIH0pLFxuXG4gICAgICAgICAgWzAsMV0ubWFwKGRlY2s9PnRyKFxuICAgICAgICAgICAgQXJyYXkuZnJvbSh7bGVuZ3RoOiBhbm5lYWxlciEuc2NoZWR1bGVTaXplc1t0cmFuXSF9LCAoXyxpKT0+e1xuICAgICAgICAgICAgICBsZXQgc3RlcCA9IGFubmVhbGVyPy5zY2hlZHVsZVt0cmFuKiBhbm5lYWxlci5UU0laRSArIGldIVxuICAgICAgICAgICAgICByZXR1cm4gdGQoXG4gICAgICAgICAgICAgICAgKGdldERlY2soc3RlcCkgPT0gZGVjaykgPyBpdGVtQnV0dG9uKGdldFJlcShzdGVwKSkgOiBcIlwiLFxuICAgICAgICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiBpc2xvYWQoc3RlcCkgPyBjb2xvci5ibHVlIDogY29sb3IuZ3JlZW4sXG4gICAgICAgICAgICAgICAgICBib3JkZXI6IGlubmVyQm9yZGVyLFxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogXCIuMmVtIC4zZW1cIixcbiAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiBcIjIuNmVtXCIsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6IHNjaGVkdWxlQ2VsbE1pbkhlaWdodCxcbiAgICAgICAgICAgICAgICAgIGJveFNpemluZzogXCJib3JkZXItYm94XCIsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApKVxuICAgICAgICApLFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgYm9yZGVyOiBvdXRlckJvcmRlcixcbiAgICAgICAgICBwYWRkaW5nOiBcIi4yNWVtXCIsXG4gICAgICAgICAgdmVydGljYWxBbGlnbjogXCJ0b3BcIixcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICB9KVxuICApXG5cbiAgXG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgcGFkZGluZzogXCIxZW1cIixcbiAgICAgIG92ZXJmbG93WTogXCJhdXRvXCIsXG4gICAgICBvdmVyZmxvd1g6IFwiaGlkZGVuXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm94U2l6aW5nOiBcImJvcmRlci1ib3hcIixcbiAgICAgIG1pbkhlaWdodDogXCIwXCIsXG4gICAgfSksXG4gICAgZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBvdmVyZmxvd1g6IFwiYXV0b1wiLFxuICAgICAgICBvdmVyZmxvd1k6IFwiaGlkZGVuXCIsXG4gICAgICAgIG1heFdpZHRoOiBcIjEwMCVcIixcbiAgICAgIH0pLFxuICAgICAgdGFiXG4gICAgKSxcbiAgICBwKFwidW5hc3NpZ25lZDogXCIsIEFycmF5LmZyb20oYW5uZWFsZXIudW5hc3NpZ25lZCkubWFwKCh4LGkpPT4oe3gsaX0pKS5maWx0ZXIoeD0+eC54KS5tYXAoeD0+c3BhbihcIiBcIiwgaXRlbUJ1dHRvbih4LmkpKSkpLFxuICAgIHAoXCJzZWFyY2ggdGltZTogXCIsIHRpbWUsIFwibXNcIiksXG4gICAgcChcInNjb3JlOlwiLCBhbm5lYWxlci5zY2hlZHVsZVJhdGluZ3MucmVkdWNlKCh4LHkpPT54K3kpKVxuICApXG59XG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyByYW5kb21Nb2R1bGUsIHJhbmRvbVVVSUQsIFJlcXVlc3QsIFNjaGVkdWxlLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBta1N0b3JlZCwgbWtXcml0YWJsZSwgdHlwZSBXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRvbSwgc2V0UmFuZFNlZWQgfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBudW1iZXIgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5pbXBvcnQgeyBwbGFubmVyVmlldyB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdcIjtcblxuXG5leHBvcnQgbGV0IExLV19DT1VOVCA9IG1rU3RvcmVkKFwiTEtXX0NPVU5UXCIsIG51bWJlciwgIDUpXG5sZXQgUkVRVUVTVF9DT1VOVCA9IG1rU3RvcmVkKFwiUkVRVUVTVF9DT1VOVFwiLCAgbnVtYmVyLCAyMClcblxuYm9keS5zdHlsZS5tYXJnaW4gPSBcIjBcIlxuXG5sZXQgaGVhZGVyID0gaDEoXCJyb3V0ZSBwbGFubmVyXCIsIHN0eWxlKHtiYWNrZ3JvdW5kOiBjb2xvci5ibHVlLCBjb2xvcjogY29sb3IuYmFja2dyb3VuZCwgbWFyZ2luOiBcIjBcIiwgcGFkZGluZzogXCIuNmVtXCJ9KSlcblxubGV0IGNvbnRlbnRTcGFjZSA9IGRpdihzdHlsZSh7XG4gIGRpc3BsYXk6XCJmbGV4XCIsXG4gIGZsZXhEaXJlY3Rpb246XCJyb3dcIixcbiAgd2lkdGg6IFwiMTAwJVwiLFxuICBoZWlnaHQ6IFwiY2FsYygxMDAlIC0gMi41ZW0pXCIsXG4gIG1pbldpZHRoOiBcIjBcIixcbn0pKVxuXG5sZXQgcGFnZSA9IGRpdihcbiAgc3R5bGUoe2Rpc3BsYXk6XCJmbGV4XCIsIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIiwgaGVpZ2h0OiBcIjEwMCVcIn0pLFxuICBoZWFkZXIsXG4gIGNvbnRlbnRTcGFjZVxuKVxuXG5ib2R5LnJlcGxhY2VDaGlsZHJlbihwYWdlKVxuXG5zZXRSYW5kU2VlZCgyNClcblxuZXhwb3J0IGxldCBtb2R1bGUgPSByYW5kb21Nb2R1bGUoKVxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIG51bWJlcjogbnVtYmVyLFxuICAgIGxvZ28/IDogc3RyaW5nLFxuICB9W10sXG4gIGNvbG9yPzogc3RyaW5nXG59XG5cbmV4cG9ydCBsZXQgaGlnaHRMaWdodHMgPSBta1dyaXRhYmxlIDxIaWdoTGlnaHRbXT4oIFtdIClcblxuXG5mdW5jdGlvbiBzZXR0ZXIgKHN0b3JlOiBXcml0YWJsZTxudW1iZXI+ICl7XG4gIGxldCBpbnAgPSBpbnB1dCgpXG4gIGlucC50eXBlID0gXCJudW1iZXJcIlxuICBpbnAub25jaGFuZ2UgPSAoKT0+e1xuICAgIGxldCB2YWwgPSBwYXJzZUludChpbnAudmFsdWUpXG4gICAgaWYgKGlzTmFOKHZhbCkpIHJldHVyblxuICAgIHN0b3JlLnNldCh2YWwpXG4gIH1cbiAgc3RvcmUub251cGRhdGUodmFsPT5pbnAudmFsdWUgPSB2YWwudG9TdHJpbmcoKSlcblxuICByZXR1cm4gaW5wXG59XG5cblxuZnVuY3Rpb24gbWtXaW5kb3cgKHRhYjogbnVtYmVyID0gMCApIHtcblxuICBsZXQgdGFiRmllbGRzID0gW1xuICAgIFsnbWFwJywgbWFwVmlldyhtb2R1bGUpXSxcbiAgICAvLyBbJ3JlcXVlc3RzJywgcmVxdWVzdFZpZXcobW9kdWxlLnJlcXVlc3RzKV0sXG4gICAgLy8gWydzY2hlZHVsZScsIHNjaGVkdWxlVmlldygpIF0sXG4gICAgWydwbGFubmVyJywgcGxhbm5lclZpZXcobW9kdWxlKV0sXG4gICAgLy8gWydzZXR0aW5ncycsIGRpdihcbiAgICAvLyAgIHN0eWxlKHtcbiAgICAvLyAgICAgcGFkZGluZzogXCIxZW1cIixcbiAgICAvLyAgIH0pLFxuICAgIC8vICAgaDIoXCJzZXR0aW5nc1wiKSxcblxuXG4gICAgLy8gICB0YWJsZShcbiAgICAvLyAgICAgdHIoXG4gICAgLy8gICAgICAgdGQoXCJMS1cgY291bnRcIiksXG4gICAgLy8gICAgICAgdGQoc2V0dGVyKExLV19DT1VOVCkpXG4gICAgLy8gICAgICksXG4gICAgLy8gICAgIHRyKFxuICAgIC8vICAgICAgIHRkKFwiUmVxdWVzdCBjb3VudFwiKSxcbiAgICAvLyAgICAgICB0ZChzZXR0ZXIoUkVRVUVTVF9DT1VOVCkpXG4gICAgLy8gICAgICksXG4gICAgLy8gICAgIHRyKGJ1dHRvbihcImdlbmVyYXRlXCIsICgpPT57XG4gICAgLy8gICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpXG4gICAgLy8gICAgIH0pKVxuICAgIC8vICAgKVxuXG4gICAgLy8gKV1cbiAgXSBhcyBjb25zdFxuXG4gIGNvbnN0IGVsID0gZGl2KHN0eWxlKHtcbiAgICBmbGV4OiBcIjEgMSAwXCIsXG4gICAgbWluV2lkdGg6IFwiMFwiLFxuICAgIGhlaWdodDogXCJjYWxjKDEwMHZoIC0gMWVtKVwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICBvdmVyZmxvdzogXCJoaWRkZW5cIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgY29uc3QgdGFicyA9IHAoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIG1hcmdpbjogXCIwXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjRlbVwiLFxuICAgICAgICBmbGV4OiBcIjAgMCBhdXRvXCIsXG4gICAgICB9KSxcbiAgICAgIHRhYkZpZWxkcy5tYXAoKFtuLGVdKT0+XG4gICAgICAgIHNwYW4oIG4sXG4gICAgICAgICAgKCk9Pm9wZW5UYWIobiksXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgcGFkZGluZzogXCIuM2VtXCIsXG4gICAgICAgICAgICBtYXJnaW46IFwiLjNlbVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrIChuPT10YWIgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXkpLFxuICAgICAgICAgICAgY29sb3I6IChuPT10YWIpID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5LFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG5cbiAgICBjb25zdCBjb250ZW50ID0gZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBmbGV4OiBcIjEgMSBhdXRvXCIsXG4gICAgICAgIG1pbkhlaWdodDogXCIwXCIsXG4gICAgICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICAgIH0pLFxuICAgICAgdGFiRmllbGRzLmZpbmQoKFtuLF0pPT5uPT10YWIpIVsxXVxuICAgIClcblxuICAgIGVsLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIHRhYnMsXG4gICAgICBjb250ZW50XG4gICAgKVxuICB9XG5cblxuICBvcGVuVGFiKHRhYkZpZWxkc1t0YWJdIVswXSlcblxuICByZXR1cm4gZWxcbn1cblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbihta1dpbmRvdygxICksIG1rV2luZG93KCkpXG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBRU8sSUFBTSxPQUFPLFNBQVM7QUFFN0IsSUFBTSxlQUFlO0FBQUEsRUFDbkIsT0FBTTtBQUFBLElBQ0osT0FBbUI7QUFBQSxJQUNuQixZQUFtQjtBQUFBLElBQ25CLEtBQW1CO0FBQUEsSUFDbkIsT0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFDQSxNQUFLO0FBQUEsSUFDSCxPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsSUFDbkIsT0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsRUFDckI7QUFDRjtBQUVPLElBQU0sUUFBUTtBQUFBLEVBQ25CLE9BQU87QUFBQSxFQUNQLFlBQVk7QUFBQSxFQUNaLE1BQU07QUFBQSxFQUNOLFdBQVc7QUFBQSxFQUNYLEtBQUs7QUFBQSxFQUNMLE9BQU87QUFBQSxFQUNQLE1BQU07QUFBQSxFQUNOLFdBQVc7QUFDYjtBQUdBLElBQUksT0FBTyxTQUFTLGNBQWMsT0FBTztBQUN6QyxLQUFLLFlBQVk7QUFBQTtBQUFBLGFBRUosYUFBYSxLQUFLO0FBQUEsa0JBQ2IsYUFBYSxLQUFLO0FBQUEsV0FDekIsYUFBYSxLQUFLO0FBQUEsYUFDaEIsYUFBYSxLQUFLO0FBQUEsWUFDbkIsYUFBYSxLQUFLO0FBQUEsWUFDbEIsYUFBYSxLQUFLO0FBQUEsaUJBQ2IsYUFBYSxLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFPcEIsYUFBYSxNQUFNO0FBQUEs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QUksZUFBZSxJQUFJLE1BQU07QUFBQSxFQUMzQixTQUFRO0FBQUEsRUFDUixlQUFjO0FBQUEsRUFDZCxPQUFPO0FBQUEsRUFDUCxRQUFRO0FBQUEsRUFDUixVQUFVO0FBQ1osQ0FBQyxDQUFDO0FBRUYsSUFBSSxPQUFPLElBQ1QsTUFBTSxFQUFDLFNBQVEsUUFBUSxlQUFjLFVBQVUsUUFBUSxPQUFNLENBQUMsR0FDOUQsUUFDQSxZQUNGO0FBRUEsS0FBSyxnQkFBZ0IsSUFBSTtBQUV6QixZQUFZLEVBQUU7QUFFUCxJQUFJLFNBQVMsYUFBYTtBQVUxQixJQUFJLGNBQWMsV0FBMEIsQ0FBQyxDQUFFO0FBaUJ0RCxTQUFTLFFBQVMsQ0FBQyxNQUFjLEdBQUk7QUFBQSxFQUVuQyxJQUFJLFlBQVk7QUFBQSxJQUNkLENBQUMsT0FBTyxRQUFRLE1BQU0sQ0FBQztBQUFBLElBR3ZCLENBQUMsV0FBVyxZQUFZLE1BQU0sQ0FBQztBQUFBLEVBdUJqQztBQUFBLEVBRUEsTUFBTSxLQUFLLElBQUksTUFBTTtBQUFBLElBQ25CLE1BQU07QUFBQSxJQUNOLFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLFFBQVEsZUFBYSxNQUFNO0FBQUEsSUFDM0IsVUFBVTtBQUFBLElBQ1YsU0FBUztBQUFBLElBQ1QsZUFBZTtBQUFBLEVBQ2pCLENBQUMsQ0FBQztBQUFBLEVBRUYsU0FBUyxPQUFPLENBQUMsTUFBa0M7QUFBQSxJQUNqRCxNQUFNLE9BQU8sRUFDWCxNQUFNO0FBQUEsTUFDSixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsTUFDVCxNQUFNO0FBQUEsSUFDUixDQUFDLEdBQ0QsVUFBVSxJQUFJLEVBQUUsR0FBRSxPQUNoQixLQUFNLEdBQ0osTUFBSSxRQUFRLENBQUMsR0FDYixNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixRQUFRLGdCQUFlLEtBQUcsT0FBTSxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ3BELE9BQVEsS0FBRyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQUEsSUFDeEMsQ0FBQyxDQUNILENBQ0YsQ0FDRjtBQUFBLElBRUEsTUFBTSxVQUFVLElBQ2QsTUFBTTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sV0FBVztBQUFBLE1BQ1gsVUFBVTtBQUFBLElBQ1osQ0FBQyxHQUNELFVBQVUsS0FBSyxFQUFFLE9BQU0sS0FBRyxJQUFHLEVBQUcsRUFDbEM7QUFBQSxJQUVBLEdBQUcsZ0JBQ0QsTUFDQSxPQUNGO0FBQUE7QUFBQSxFQUlGLFFBQVEsVUFBVSxLQUFNLEVBQUU7QUFBQSxFQUUxQixPQUFPO0FBQUE7QUFHVCxhQUFhLGdCQUFnQixTQUFTLENBQUUsR0FBRyxTQUFTLENBQUM7IiwKICAiZGVidWdJZCI6ICJGMzA0MTkxODJBRkI4RTJGNjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
