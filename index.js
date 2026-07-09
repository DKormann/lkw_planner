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
var NPOINTS = 100;
var HPOINT = NPOINTS / 2;
var RSIZE = NPOINTS * HPOINT;
var MAPSIZE = 1000;
function randomMap() {
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
  let neighs = points.map((ps, i) => points.map((p2, i2) => ({ d: Math.floor(Math.hypot(ps.x - p2.x, ps.y - p2.y)), i: i2 })).filter((x) => x.i != i).sort((a2, b) => a2.d - b.d));
  let found = new Set([0]);
  function find(x) {
    if (found.has(x))
      return;
    found.add(x);
    range.forEach((p2, i) => {
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
  return { getroad, roadIDX, points, range };
}

// src/planner.ts
var COST_PER_H = 20;
var COST_PER_SECOND = COST_PER_H / 3600;
var plannerContext = null;
var costMatrixReady = false;
function configurePlanner(context) {
  plannerContext = context;
  CostMatrix.fill(0);
  costMatrixReady = false;
  buildCostMatrix();
}
function getPlannerContext() {
  if (!plannerContext) {
    throw new Error("Planner context is not configured");
  }
  return plannerContext;
}
var CostMatrix = new Uint32Array(RSIZE);
function buildCostMatrix() {
  const { roadMap } = getPlannerContext();
  const pointCount = roadMap.points.length;
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
        const road = roadMap.getroad(current, next);
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
      const idx = roadMap.roadIDX(start, end);
      CostMatrix[idx] = Math.min(dist[end], INF);
    }
  }
  costMatrixReady = true;
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
  deadline_km: number
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

// src/view/scheduleView.ts
var cursor = mkWritable({ row: 1, col: 1 });
body.addEventListener("keydown", (e) => {
  cursor.update((cursor2) => {
    if (cursor2.col == -1)
      return;
    if (e.key == "ArrowLeft")
      cursor2.col -= 1;
    else if (e.key == "ArrowRight")
      cursor2.col += 1;
    else if (e.key == "ArrowUp")
      cursor2.row -= 1;
    else if (e.key == "ArrowDown")
      cursor2.row += 1;
    else if (e.key == "Escape")
      cursor2 = { row: -1, col: -1 };
    else
      return;
    e.preventDefault();
    cursor2.row = Math.max(0, Math.min(schedule.get().length - 1, cursor2.row));
    cursor2.col = Math.max(0, Math.min(schedule.get()[cursor2.row].steps.length - 1, cursor2.col));
  });
});

// src/planners/annealing.ts
function getCost(a2, b) {
  console.log("getCost", a2, b);
  let idx = roadMap.roadIDX(a2, b);
  return CostMatrix[idx];
}
function plannerView() {
  let el = div(Array.from(requests).slice(1).map((_, r) => p(`request ${r} cost to 0: ${getCost(0, r)}`)));
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
var roadMap = randomMap();
var requests = Array.from({ length: REQUEST_COUNT.get() }, (_, i) => ({
  id: randomUUID(),
  startPoint: randChoice(roadMap.range),
  endPoint: randChoice(roadMap.range),
  value_eur: Math.floor(random() * 1000),
  deadline_km: Math.floor(random() * 60 * 60 * 24 * 7)
}));
var schedule = mkWritable(Array.from({ length: LKW_COUNT.get() }, (_, i) => ({
  transporter: randomUUID(),
  steps: [{ $: "start", val: { pos: randChoice(roadMap.range) } }]
})));
configurePlanner({ requests, roadMap });
var hightLights = mkWritable([]);
contentSpace.replaceChildren(plannerView());
export {
  schedule,
  roadMap,
  requests,
  hightLights,
  LKW_COUNT
};

//# debugId=DF8BC9F87B8511DC64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvcmFuZG9tLnRzIiwgInNyYy9yYW5kb21NYXAudHMiLCAic3JjL3BsYW5uZXIudHMiLCAic3JjL2pzb25zY2hlbWEudHMiLCAic3JjL3NjaGVtYS50cyIsICJzcmMvdHlwZXMudHMiLCAic3JjL3dyaXRlYWJsZS50cyIsICJzcmMvdmlldy9zY2hlZHVsZVZpZXcudHMiLCAic3JjL3BsYW5uZXJzL2FubmVhbGluZy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydFN0YXRlICgpIHtyZXR1cm4gUkFORFNFRUR9XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN0YXRlIChzZWVkOiBudW1iZXIpIHtSQU5EU0VFRCA9IHNlZWR9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb20oKXtcbiAgbGV0IHggPSBNYXRoLnNpbihSQU5EU0VFRCsrKSAqIDEwMDAwO1xuICByZXR1cm4geCAtIE1hdGguZmxvb3IoeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcil7XG4gIHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoKV0hXG59XG5cblxuIiwKICAgICJpbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kSW50LCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcblxuZXhwb3J0IGxldCBOUE9JTlRTID0gMTAwXG5sZXQgSFBPSU5UID0gTlBPSU5UUy8yXG5leHBvcnQgbGV0IFJTSVpFID0gTlBPSU5UUyAqIEhQT0lOVFxuZXhwb3J0IHR5cGUgUG9zID0ge3g6bnVtYmVyLCB5OiBudW1iZXJ9XG5cbmV4cG9ydCBjb25zdCBNQVBTSVpFID0gMTAwMFxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tTWFwICgpe1xuXG4gIGxldCByb2FkcyA9IG5ldyBVaW50MTZBcnJheShSU0laRSlcblxuICBmdW5jdGlvbiByb2FkSURYICAoYTpudW1iZXIsIGI6bnVtYmVyKXtcbiAgICBpZiAoYTxiKSBbYSxiXSA9IFtiLGFdXG4gICAgbGV0IGlkeCA9IGEgKyBOUE9JTlRTICogYlxuICAgIGlmIChpZHg+UlNJWkUpIGlkeCA9IE5QT0lOVFMqKjIgLSBpZHhcbiAgICByZXR1cm4gaWR4IFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0cm9hZCAoYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGdldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByZXR1cm4gcm9hZHNbcm9hZElEWChhLGIpXSFcbiAgfVxuXG4gIGxldCByb2RzOiB7YTpudW1iZXIsYjpudW1iZXIsIGRpc3Q6bnVtYmVyfVtdID0gW11cblxuICBmdW5jdGlvbiBzZXRyb2FkIChhOiBudW1iZXIsIGI6IG51bWJlciwgZGlzdDogbnVtYmVyKSB7XG5cbiAgICByb2RzLnB1c2goe2EsYixkaXN0fSlcbiAgICBpZiAoYT09YikgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHNldCByb2FkIGZyb20gYSBwb2ludCB0byBpdHNlbGZcIilcbiAgICByb2Fkc1tyb2FkSURYKGEsYildID0gZGlzdFxuICB9XG5cbiAgbGV0IHJhbmdlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBOUE9JTlRTfSwgKF8saSk9PiBpKVxuICBsZXQgcG9pbnRzIDogUG9zW10gPSByYW5nZS5tYXAoKCk9Pih7eDogcmFuZEludCgwLE1BUFNJWkUpLCB5OiByYW5kSW50KDAsTUFQU0laRSl9KSlcbiAgbGV0IG5laWdocyA9IHBvaW50cy5tYXAoKHBzLGkpPT5cbiAgICBwb2ludHMubWFwKChwMiwgaTIpPT4gICh7ZDogTWF0aC5mbG9vcihNYXRoLmh5cG90KHBzLnggLSBwMi54LCBwcy55IC0gcDIueSkpLCBpOiBpMn0pKVxuICAgIC5maWx0ZXIoeCA9PiB4LmkgIT0gaSkgLnNvcnQoKGEsYik9PiBhLmQgLSBiLmQpIClcblxuXG4gIGxldCBmb3VuZCA9IG5ldyBTZXQ8bnVtYmVyPihbMF0pXG4gIGZ1bmN0aW9uIGZpbmQoeDpudW1iZXIpe1xuXG4gICAgaWYgKGZvdW5kLmhhcyh4KSkgcmV0dXJuXG4gICAgZm91bmQuYWRkKHgpXG4gICAgcmFuZ2UuZm9yRWFjaCgocCxpKT0+e1xuICAgICAgaWYgKCBpIT14ICYmIGdldHJvYWQoaSwgeCkgIT0gMCkgZmluZChpKVxuICAgIH0pXG4gIH1cblxuICBmb3IgKGxldCB4ID0gMDsgeCA8IE5QT0lOVFM7IHgrKyl7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspe1xuICAgICAgbGV0IHggPSByYW5kSW50KDAsIE5QT0lOVFMpXG4gICAgICBsZXQgbnggPSBuZWlnaHNbeF0/LltpXSFcbiAgICAgIHNldHJvYWQoeCwgbnguaSwgbnguZClcbiAgICAgIGlmIChmb3VuZC5oYXMoeCkpIGZpbmQobnguaSlcbiAgICAgIGlmIChmb3VuZC5oYXMobnguaSkpIGZpbmQoeClcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBnZXRyb2FkLCByb2FkSURYLCBwb2ludHMsIHJhbmdlIH1cbn1cblxuXG5leHBvcnQgdHlwZSBSb2FkTWFwID0gdHlwZW9mIHJhbmRvbU1hcCBleHRlbmRzICgpID0+IGluZmVyIFQgPyBUIDogbmV2ZXJcblxuXG4iLAogICAgImltcG9ydCB7IHR5cGUgUmVxdWVzdCwgdHlwZSBTY2hlZHVsZSwgdHlwZSBTY2hlZHVsZUl0ZW0sIHR5cGUgU2NoZWR1bGVTdGVwLCB0eXBlIFVVSUQgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgUlNJWkUsIHR5cGUgUm9hZE1hcCB9IGZyb20gXCIuL3JhbmRvbU1hcFwiO1xuXG5jb25zdCBERUNLQ0FQQUNJVFkgPSAzO1xuY29uc3QgVU5MT0FEQ09TVCA9IDEwXG5jb25zdCBQSUNLVVBDT1NUID0gNVxuY29uc3QgQ09TVF9QRVJfSCA9IDIwO1xuY29uc3QgQ09TVF9QRVJfU0VDT05EID0gQ09TVF9QRVJfSCAvIDM2MDA7XG5cbnR5cGUgUGxhbm5lckNvbnRleHQgPSB7XG4gIHJlcXVlc3RzOiBSZXF1ZXN0W107XG4gIHJvYWRNYXA6IFJvYWRNYXA7XG59O1xuXG50eXBlIEluc2VydGlvbkNhbmRpZGF0ZSA9IHtcbiAgaXRlbUluZGV4OiBudW1iZXI7XG4gIHBpY2tJbmRleDogbnVtYmVyO1xuICBkcm9wSW5kZXg6IG51bWJlcjtcbiAgZGVjazogMCB8IDE7XG4gIHNjb3JlRGVsdGE6IG51bWJlcjtcbn07XG5cbmxldCBwbGFubmVyQ29udGV4dDogUGxhbm5lckNvbnRleHQgfCBudWxsID0gbnVsbDtcbmxldCBjb3N0TWF0cml4UmVhZHkgPSBmYWxzZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZVBsYW5uZXIoY29udGV4dDogUGxhbm5lckNvbnRleHQpIHtcbiAgcGxhbm5lckNvbnRleHQgPSBjb250ZXh0O1xuICBDb3N0TWF0cml4LmZpbGwoMCk7XG4gIGNvc3RNYXRyaXhSZWFkeSA9IGZhbHNlO1xuICBidWlsZENvc3RNYXRyaXgoKTtcbn1cblxuZnVuY3Rpb24gZ2V0UGxhbm5lckNvbnRleHQoKTogUGxhbm5lckNvbnRleHQge1xuICBpZiAoIXBsYW5uZXJDb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUGxhbm5lciBjb250ZXh0IGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICB9XG4gIHJldHVybiBwbGFubmVyQ29udGV4dDtcbn1cblxuZXhwb3J0IGNvbnN0IENvc3RNYXRyaXggPSBuZXcgVWludDMyQXJyYXkoUlNJWkUpO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRDb3N0TWF0cml4KCk6IHZvaWQge1xuICBjb25zdCB7IHJvYWRNYXAgfSA9IGdldFBsYW5uZXJDb250ZXh0KCk7XG4gIGNvbnN0IHBvaW50Q291bnQgPSByb2FkTWFwLnBvaW50cy5sZW5ndGg7XG4gIGNvbnN0IElORiA9IDB4ZmZmZjtcblxuICBDb3N0TWF0cml4LmZpbGwoSU5GKTtcblxuICBmb3IgKGxldCBzdGFydCA9IDA7IHN0YXJ0IDwgcG9pbnRDb3VudDsgc3RhcnQrKykge1xuICAgIGNvbnN0IGRpc3QgPSBuZXcgVWludDMyQXJyYXkocG9pbnRDb3VudCk7XG4gICAgY29uc3QgdmlzaXRlZCA9IG5ldyBVaW50OEFycmF5KHBvaW50Q291bnQpO1xuICAgIGRpc3QuZmlsbChJTkYpO1xuICAgIGRpc3Rbc3RhcnRdID0gMDtcblxuICAgIGZvciAobGV0IHN0ZXAgPSAwOyBzdGVwIDwgcG9pbnRDb3VudDsgc3RlcCsrKSB7XG4gICAgICBsZXQgY3VycmVudCA9IC0xO1xuICAgICAgbGV0IGJlc3QgPSBJTkY7XG5cbiAgICAgIGZvciAobGV0IG5vZGUgPSAwOyBub2RlIDwgcG9pbnRDb3VudDsgbm9kZSsrKSB7XG4gICAgICAgIGlmICh2aXNpdGVkW25vZGVdID09PSAwICYmIGRpc3Rbbm9kZV0hIDwgYmVzdCkge1xuICAgICAgICAgIGJlc3QgPSBkaXN0W25vZGVdITtcbiAgICAgICAgICBjdXJyZW50ID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY3VycmVudCA9PT0gLTEpIGJyZWFrO1xuICAgICAgdmlzaXRlZFtjdXJyZW50XSA9IDE7XG5cbiAgICAgIGZvciAobGV0IG5leHQgPSAwOyBuZXh0IDwgcG9pbnRDb3VudDsgbmV4dCsrKSB7XG4gICAgICAgIGlmIChuZXh0ID09PSBjdXJyZW50KSBjb250aW51ZTtcbiAgICAgICAgY29uc3Qgcm9hZCA9IHJvYWRNYXAuZ2V0cm9hZChjdXJyZW50LCBuZXh0KTtcbiAgICAgICAgaWYgKHJvYWQgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBuZXh0Q29zdCA9IGRpc3RbY3VycmVudF0hICsgcm9hZDtcbiAgICAgICAgaWYgKG5leHRDb3N0IDwgZGlzdFtuZXh0XSEpIHtcbiAgICAgICAgICBkaXN0W25leHRdID0gbmV4dENvc3Q7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBlbmQgPSAwOyBlbmQgPCBwb2ludENvdW50OyBlbmQrKykge1xuICAgICAgaWYgKGVuZCA9PT0gc3RhcnQpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgaWR4ID0gcm9hZE1hcC5yb2FkSURYKHN0YXJ0LCBlbmQpO1xuICAgICAgQ29zdE1hdHJpeFtpZHhdID0gTWF0aC5taW4oZGlzdFtlbmRdISwgSU5GKTtcbiAgICB9XG4gIH1cblxuICBjb3N0TWF0cml4UmVhZHkgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVDb3N0TWF0cml4KCk6IHZvaWQge1xuICBpZiAoIWNvc3RNYXRyaXhSZWFkeSkge1xuICAgIGJ1aWxkQ29zdE1hdHJpeCgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUGF0aChzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6bnVtYmVyW10ge1xuICBjb25zdCB7IHJvYWRNYXAgfSA9IGdldFBsYW5uZXJDb250ZXh0KCk7XG4gIGVuc3VyZUNvc3RNYXRyaXgoKTtcbiAgbGV0IHBhdGggOiBudW1iZXJbXSA9IFtzdGFydF1cbiAgbGV0IGNvc3QgPSBDb3N0TWF0cml4W3JvYWRNYXAucm9hZElEWChzdGFydCxlbmQpXVxuICB3aGlsZSAoc3RhcnQgIT0gZW5kKXtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHJvYWRNYXAucG9pbnRzLmxlbmd0aDsgeCsrKXtcbiAgICAgIGlmICh4ID09IHN0YXJ0KSBjb250aW51ZVxuICAgICAgbGV0IHJvYWQgPSByb2FkTWFwLmdldHJvYWQoc3RhcnQseClcbiAgICAgIGlmIChyb2FkID09IDApIGNvbnRpbnVlXG4gICAgICBsZXQgcmVzdGNvc3QgPSBDb3N0TWF0cml4W3JvYWRNYXAucm9hZElEWCh4LGVuZCldIVxuICAgICAgaWYgKHJvYWQrIHJlc3Rjb3N0ID09IGNvc3Qpe1xuICAgICAgICBjb3N0ID0gcmVzdGNvc3RcbiAgICAgICAgc3RhcnQgPSB4XG4gICAgICAgIHBhdGgucHVzaCh4KVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcGF0aFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29zdE4oLi4ucG9pbnRzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gIGNvbnN0IHsgcm9hZE1hcCB9ID0gZ2V0UGxhbm5lckNvbnRleHQoKTtcbiAgZW5zdXJlQ29zdE1hdHJpeCgpO1xuICBsZXQgY29zdCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGNvc3QgKz0gQ29zdE1hdHJpeFtyb2FkTWFwLnJvYWRJRFgocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpXSE7XG4gIH1cbiAgcmV0dXJuIGNvc3Q7XG59XG5cbmV4cG9ydCBsZXQgb3B0RHVyID0gMDtcblxuZnVuY3Rpb24gcmVxdWVzdE1hcChyZXF1ZXN0czogUmVxdWVzdFtdKTogTWFwPFVVSUQsIFJlcXVlc3Q+IHtcbiAgcmV0dXJuIG5ldyBNYXAocmVxdWVzdHMubWFwKChyZXF1ZXN0KSA9PiBbcmVxdWVzdC5pZCwgcmVxdWVzdF0pKTtcbn1cblxuZnVuY3Rpb24gcm91dGVTY29yZShpdGVtOiBTY2hlZHVsZUl0ZW0sIHJlcXVlc3RzQnlJZDogTWFwPFVVSUQsIFJlcXVlc3Q+KTogbnVtYmVyIHtcbiAgaWYgKGl0ZW0uc3RlcHNbMF0/LiQgIT09IFwic3RhcnRcIikge1xuICAgIHJldHVybiAtSW5maW5pdHk7XG4gIH1cblxuICBsZXQgcmV3YXJkX2V1ciA9IDBcbiAgbGV0IGR1cmF0aW9uX3NlYyA9IDBcbiAgbGV0IGRlY2tzOiBbVVVJRFtdLCBVVUlEW11dID0gW1tdLCBbXV07XG5cbiAgZnVuY3Rpb24gdW5sb2FkKHJlcUlkOiBVVUlELCBkZWNrOiAwIHwgMSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlkeCA9IGRlY2tzW2RlY2tdLmluZGV4T2YocmVxSWQpO1xuICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGFmdGVyID0gZGVja3NbZGVja10uc2xpY2UoaWR4ICsgMSk7XG4gICAgZGVja3NbZGVja10gPSBkZWNrc1tkZWNrXS5zbGljZSgwLCBpZHgpLmNvbmNhdChhZnRlcik7XG4gICAgcmV3YXJkX2V1ciAtPSBVTkxPQURDT1NUICsgKFVOTE9BRENPU1QgKyBQSUNLVVBDT1NUKSAqIGFmdGVyLmxlbmd0aDtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBpdGVtLnN0ZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcHJldiA9IGl0ZW0uc3RlcHNbaSAtIDFdITtcbiAgICBjb25zdCBzdGVwID0gaXRlbS5zdGVwc1tpXSE7XG5cbiAgICBkdXJhdGlvbl9zZWMrPSAgZ2V0Q29zdE4ocHJldi52YWwucG9zLCBzdGVwLnZhbC5wb3MpO1xuXG4gICAgaWYgKHN0ZXAuJCA9PT0gXCJwaWNrdXBcIikge1xuICAgICAgZGVja3Nbc3RlcC52YWwuZGVja10ucHVzaChzdGVwLnZhbC5yZXF1ZXN0KTtcbiAgICAgIGlmIChkZWNrc1tzdGVwLnZhbC5kZWNrXS5sZW5ndGggPiBERUNLQ0FQQUNJVFkpIHtcbiAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChzdGVwLiQgPT09IFwiZGVsaXZlclwiKSB7XG4gICAgICBjb25zdCByZXEgPSByZXF1ZXN0c0J5SWQuZ2V0KHN0ZXAudmFsLnJlcXVlc3QpO1xuICAgICAgaWYgKCFyZXEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBub3QgZm91bmQgcmVxdWVzdDogJHtzdGVwLnZhbC5yZXF1ZXN0fWApO1xuICAgICAgfVxuICAgICAgaWYgKCF1bmxvYWQoc3RlcC52YWwucmVxdWVzdCwgMCkgJiYgIXVubG9hZChzdGVwLnZhbC5yZXF1ZXN0LCAxKSkge1xuICAgICAgICByZXR1cm4gLUluZmluaXR5O1xuICAgICAgfVxuICAgICAgaWYgKGR1cmF0aW9uX3NlYyA8PSByZXEuZGVhZGxpbmVfa20pIHtcbiAgICAgICAgcmV3YXJkX2V1cisgcmVxLnZhbHVlX2V1cjtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJldHVybiAtSW5maW5pdHk7XG4gIH1cblxuICByZXR1cm4gcmV3YXJkX2V1ciAtIGR1cmF0aW9uX3NlYyAqIENPU1RfUEVSX1NFQ09ORDtcbn1cblxuZnVuY3Rpb24gc2FmZVJvdXRlU2NvcmUoaXRlbTogU2NoZWR1bGVJdGVtLCByZXF1ZXN0c0J5SWQ6IE1hcDxVVUlELCBSZXF1ZXN0Pik6IG51bWJlciB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHJvdXRlU2NvcmUoaXRlbSwgcmVxdWVzdHNCeUlkKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnNlcnRSZXF1ZXN0SW50b0l0ZW0oXG4gIGl0ZW06IFNjaGVkdWxlSXRlbSxcbiAgcmVxdWVzdDogUmVxdWVzdCxcbiAgcGlja0luZGV4OiBudW1iZXIsXG4gIGRyb3BJbmRleDogbnVtYmVyLFxuICBkZWNrOiAwIHwgMSxcbik6IFNjaGVkdWxlSXRlbSB7XG4gIGNvbnN0IHBpY2t1cDogU2NoZWR1bGVTdGVwID0ge1xuICAgICQ6IFwicGlja3VwXCIsXG4gICAgdmFsOiB7IHJlcXVlc3Q6IHJlcXVlc3QuaWQsIHBvczogcmVxdWVzdC5zdGFydFBvaW50LCBkZWNrIH0sXG4gIH07XG4gIGNvbnN0IGRlbGl2ZXI6IFNjaGVkdWxlU3RlcCA9IHtcbiAgICAkOiBcImRlbGl2ZXJcIixcbiAgICB2YWw6IHsgcmVxdWVzdDogcmVxdWVzdC5pZCwgcG9zOiByZXF1ZXN0LmVuZFBvaW50IH0sXG4gIH07XG5cbiAgY29uc3Qgc3RlcHMgPSBbLi4uaXRlbS5zdGVwc107XG4gIHN0ZXBzLnNwbGljZShwaWNrSW5kZXgsIDAsIHBpY2t1cCk7XG4gIHN0ZXBzLnNwbGljZShkcm9wSW5kZXgsIDAsIGRlbGl2ZXIpO1xuICByZXR1cm4geyAuLi5pdGVtLCBzdGVwcyB9O1xufVxuXG5mdW5jdGlvbiByZW1vdmVSZXF1ZXN0RnJvbVNjaGVkdWxlKHNjaGVkdWxlOiBTY2hlZHVsZSwgcmVxdWVzdElkOiBVVUlEKTogU2NoZWR1bGUge1xuICByZXR1cm4gc2NoZWR1bGUubWFwKChpdGVtKSA9PiAoe1xuICAgIC4uLml0ZW0sXG4gICAgc3RlcHM6IGl0ZW0uc3RlcHMuZmlsdGVyKChzdGVwKSA9PiBzdGVwLiQgPT09IFwic3RhcnRcIiB8fCBzdGVwLnZhbC5yZXF1ZXN0ICE9PSByZXF1ZXN0SWQpLFxuICB9KSk7XG59XG5cbmZ1bmN0aW9uIGFzc2lnbmVkUmVxdWVzdElkcyhzY2hlZHVsZTogU2NoZWR1bGUpOiBTZXQ8VVVJRD4ge1xuICBjb25zdCBpZHMgPSBuZXcgU2V0PFVVSUQ+KCk7XG4gIGZvciAoY29uc3QgaXRlbSBvZiBzY2hlZHVsZSkge1xuICAgIGZvciAoY29uc3Qgc3RlcCBvZiBpdGVtLnN0ZXBzKSB7XG4gICAgICBpZiAoc3RlcC4kID09PSBcInBpY2t1cFwiKSB7XG4gICAgICAgIGlkcy5hZGQoc3RlcC52YWwucmVxdWVzdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBpZHM7XG59XG5cbmZ1bmN0aW9uIHJlcXVlc3RQcmlvcml0eShyZXF1ZXN0OiBSZXF1ZXN0KTogbnVtYmVyIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBkaXJlY3RUcmF2ZWwgPSBnZXRDb3N0TihyZXF1ZXN0LnN0YXJ0UG9pbnQsIHJlcXVlc3QuZW5kUG9pbnQpICogQ09TVF9QRVJfU0VDT05EO1xuICAgIHJldHVybiByZXF1ZXN0LnZhbHVlX2V1ciAtIGRpcmVjdFRyYXZlbCAtIFBJQ0tVUENPU1QgLSBVTkxPQURDT1NUO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gLUluZmluaXR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGJlc3RJbnNlcnRpb24oc2NoZWR1bGU6IFNjaGVkdWxlLCByZXF1ZXN0OiBSZXF1ZXN0LCByZXF1ZXN0c0J5SWQ6IE1hcDxVVUlELCBSZXF1ZXN0Pik6IEluc2VydGlvbkNhbmRpZGF0ZSB8IG51bGwge1xuICBsZXQgYmVzdDogSW5zZXJ0aW9uQ2FuZGlkYXRlIHwgbnVsbCA9IG51bGw7XG5cbiAgZm9yIChsZXQgaXRlbUluZGV4ID0gMDsgaXRlbUluZGV4IDwgc2NoZWR1bGUubGVuZ3RoOyBpdGVtSW5kZXgrKykge1xuICAgIGNvbnN0IGl0ZW0gPSBzY2hlZHVsZVtpdGVtSW5kZXhdITtcbiAgICBjb25zdCBjdXJyZW50U2NvcmUgPSBzYWZlUm91dGVTY29yZShpdGVtLCByZXF1ZXN0c0J5SWQpO1xuXG4gICAgZm9yIChjb25zdCBkZWNrIG9mIFswLCAxXSBhcyBjb25zdCkge1xuICAgICAgZm9yIChsZXQgcGlja0luZGV4ID0gMTsgcGlja0luZGV4IDw9IGl0ZW0uc3RlcHMubGVuZ3RoOyBwaWNrSW5kZXgrKykge1xuICAgICAgICBmb3IgKGxldCBkcm9wSW5kZXggPSBwaWNrSW5kZXggKyAxOyBkcm9wSW5kZXggPD0gaXRlbS5zdGVwcy5sZW5ndGggKyAxOyBkcm9wSW5kZXgrKykge1xuICAgICAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGluc2VydFJlcXVlc3RJbnRvSXRlbShpdGVtLCByZXF1ZXN0LCBwaWNrSW5kZXgsIGRyb3BJbmRleCwgZGVjayk7XG4gICAgICAgICAgY29uc3QgY2FuZGlkYXRlU2NvcmUgPSBzYWZlUm91dGVTY29yZShjYW5kaWRhdGUsIHJlcXVlc3RzQnlJZCk7XG4gICAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoY2FuZGlkYXRlU2NvcmUpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzY29yZURlbHRhID0gY2FuZGlkYXRlU2NvcmUgLSBjdXJyZW50U2NvcmU7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWJlc3QgfHxcbiAgICAgICAgICAgIHNjb3JlRGVsdGEgPiBiZXN0LnNjb3JlRGVsdGEgfHxcbiAgICAgICAgICAgIChzY29yZURlbHRhID09PSBiZXN0LnNjb3JlRGVsdGEgJiYgaXRlbUluZGV4IDwgYmVzdC5pdGVtSW5kZXgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBiZXN0ID0geyBpdGVtSW5kZXgsIHBpY2tJbmRleCwgZHJvcEluZGV4LCBkZWNrLCBzY29yZURlbHRhIH07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJlc3Q7XG59XG5cbmZ1bmN0aW9uIGFwcGx5SW5zZXJ0aW9uKHNjaGVkdWxlOiBTY2hlZHVsZSwgcmVxdWVzdDogUmVxdWVzdCwgY2FuZGlkYXRlOiBJbnNlcnRpb25DYW5kaWRhdGUpOiBTY2hlZHVsZSB7XG4gIHJldHVybiBzY2hlZHVsZS5tYXAoKGl0ZW0sIGl0ZW1JbmRleCkgPT5cbiAgICBpdGVtSW5kZXggPT09IGNhbmRpZGF0ZS5pdGVtSW5kZXhcbiAgICAgID8gaW5zZXJ0UmVxdWVzdEludG9JdGVtKGl0ZW0sIHJlcXVlc3QsIGNhbmRpZGF0ZS5waWNrSW5kZXgsIGNhbmRpZGF0ZS5kcm9wSW5kZXgsIGNhbmRpZGF0ZS5kZWNrKVxuICAgICAgOiBpdGVtLFxuICApO1xufVxuXG5mdW5jdGlvbiBpbXByb3ZlQnlSZW51bWJlcihzY2hlZHVsZTogU2NoZWR1bGUsIHJlcXVlc3RzQnlJZDogTWFwPFVVSUQsIFJlcXVlc3Q+KTogU2NoZWR1bGUge1xuICBsZXQgY3VycmVudCA9IHNjaGVkdWxlO1xuICBsZXQgY3VycmVudFNjb3JlID0gcmF0ZVNjaGVkdWxlKGN1cnJlbnQpO1xuICBjb25zdCBhc3NpZ25lZCA9IEFycmF5LmZyb20oYXNzaWduZWRSZXF1ZXN0SWRzKGN1cnJlbnQpKTtcblxuICBmb3IgKGNvbnN0IHJlcXVlc3RJZCBvZiBhc3NpZ25lZCkge1xuICAgIGNvbnN0IHJlcXVlc3QgPSByZXF1ZXN0c0J5SWQuZ2V0KHJlcXVlc3RJZCk7XG4gICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCByZWR1Y2VkID0gcmVtb3ZlUmVxdWVzdEZyb21TY2hlZHVsZShjdXJyZW50LCByZXF1ZXN0SWQpO1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGJlc3RJbnNlcnRpb24ocmVkdWNlZCwgcmVxdWVzdCwgcmVxdWVzdHNCeUlkKTtcbiAgICBpZiAoIWNhbmRpZGF0ZSB8fCBjYW5kaWRhdGUuc2NvcmVEZWx0YSA8PSAwKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXh0ID0gYXBwbHlJbnNlcnRpb24ocmVkdWNlZCwgcmVxdWVzdCwgY2FuZGlkYXRlKTtcbiAgICBjb25zdCBuZXh0U2NvcmUgPSByYXRlU2NoZWR1bGUobmV4dCk7XG4gICAgaWYgKG5leHRTY29yZSA+IGN1cnJlbnRTY29yZSkge1xuICAgICAgY3VycmVudCA9IG5leHQ7XG4gICAgICBjdXJyZW50U2NvcmUgPSBuZXh0U2NvcmU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGN1cnJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcHRpbWl6ZVNjaGVkdWxlKHJlcXVlc3RzOiBSZXF1ZXN0W10sIHNjaGVkdWxlOiBTY2hlZHVsZSk6IFNjaGVkdWxlIHtcbiAgY29uc3Qgc3RhcnRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgY29uc3QgcmVxdWVzdHNCeUlkID0gcmVxdWVzdE1hcChyZXF1ZXN0cyk7XG4gIGNvbnN0IGFzc2lnbmVkID0gYXNzaWduZWRSZXF1ZXN0SWRzKHNjaGVkdWxlKTtcblxuICBsZXQgY3VycmVudCA9IHNjaGVkdWxlLm1hcCgoaXRlbSkgPT4gKHsgLi4uaXRlbSwgc3RlcHM6IFsuLi5pdGVtLnN0ZXBzXSB9KSk7XG5cbiAgY29uc3QgZnJlZVJlcXVlc3RzID0gcmVxdWVzdHNcbiAgICAuZmlsdGVyKChyZXF1ZXN0KSA9PiAhYXNzaWduZWQuaGFzKHJlcXVlc3QuaWQpKVxuICAgIC5zb3J0KChhLCBiKSA9PiByZXF1ZXN0UHJpb3JpdHkoYikgLSByZXF1ZXN0UHJpb3JpdHkoYSkpO1xuXG4gIGZvciAoY29uc3QgcmVxdWVzdCBvZiBmcmVlUmVxdWVzdHMpIHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBiZXN0SW5zZXJ0aW9uKGN1cnJlbnQsIHJlcXVlc3QsIHJlcXVlc3RzQnlJZCk7XG4gICAgaWYgKGNhbmRpZGF0ZSAmJiBjYW5kaWRhdGUuc2NvcmVEZWx0YSA+IDApIHtcbiAgICAgIGN1cnJlbnQgPSBhcHBseUluc2VydGlvbihjdXJyZW50LCByZXF1ZXN0LCBjYW5kaWRhdGUpO1xuICAgIH1cbiAgfVxuXG4gIGN1cnJlbnQgPSBpbXByb3ZlQnlSZW51bWJlcihjdXJyZW50LCByZXF1ZXN0c0J5SWQpO1xuICBjdXJyZW50ID0gaW1wcm92ZUJ5UmVudW1iZXIoY3VycmVudCwgcmVxdWVzdHNCeUlkKTtcblxuICBvcHREdXIgPSBEYXRlLm5vdygpIC0gc3RhcnRlZEF0O1xuICByZXR1cm4gY3VycmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhdGVTY2hlZHVsZShzY2hlZHVsZTogU2NoZWR1bGUpOiBudW1iZXIge1xuICBjb25zdCB7IHJlcXVlc3RzIH0gPSBnZXRQbGFubmVyQ29udGV4dCgpO1xuICBjb25zdCByZXF1ZXN0c0J5SWQgPSByZXF1ZXN0TWFwKHJlcXVlc3RzKTtcblxuICBsZXQgdG90YWwgPSAwO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2NoZWR1bGUpIHtcbiAgICBjb25zdCBpdGVtU2NvcmUgPSBzYWZlUm91dGVTY29yZShpdGVtLCByZXF1ZXN0c0J5SWQpO1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKGl0ZW1TY29yZSkpIHtcbiAgICAgIHJldHVybiAtSW5maW5pdHk7XG4gICAgfVxuICAgIHRvdGFsICs9IGl0ZW1TY29yZTtcbiAgfVxuICByZXR1cm4gdG90YWw7XG59XG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cblxuZXhwb3J0IHR5cGUgVVVJRCA9IGB1JHtzdHJpbmd9LSR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBVVUlEIDogU2NoZW1hPFVVSUQ+ID0gc3RyaW5nXG5cblxuLy8gZXhwb3J0IHR5cGUgVW5pdCA8cyBleHRlbmRzIHN0cmluZz4gPSB7dmFsdWU6IG51bWJlciwgdW5pdDogc31cbi8vIGV4cG9ydCBjb25zdCBVbml0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHVuaXQ6IHMpID0+IG9iamVjdCh7dmFsdWU6IG51bWJlciwgdW5pdDogY29uc3RhbnQodW5pdCl9KVxuXG4vLyBleHBvcnQgY29uc3QgdWNvbnN0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHZhbHVlOiBudW1iZXIsIHVuaXQ6IHMpIDogVW5pdDxzPiA9PiAoe3ZhbHVlLCB1bml0fSlcbi8vIGV4cG9ydCBjb25zdCBhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgOiBVbml0PHM+ID0+ICh7dmFsdWU6IGEudmFsdWUgKyBiLnZhbHVlLCB1bml0OiBhLnVuaXR9KVxuLy8gZXhwb3J0IGNvbnN0IGlhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgPT4ge2EudmFsdWUgKz0gYi52YWx1ZX1cblxuLy8gZXhwb3J0IGNvbnN0IHN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA6IFVuaXQ8cz4gPT4gKHt2YWx1ZTogYS52YWx1ZSAtIGIudmFsdWUsIHVuaXQ6IGEudW5pdH0pXG4vLyBleHBvcnQgY29uc3QgaXN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA9PiB7YS52YWx1ZSAtPSBiLnZhbHVlfVxuLy8gZXhwb3J0IGNvbnN0IG11bCA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBudW1iZXIpIDogVW5pdDxzPiA9PiAoe3ZhbHVlOiBhLnZhbHVlICogYiwgdW5pdDogYS51bml0fSlcblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG4vLyBleHBvcnQgY29uc3QgbnVtYmVyID0gVW5pdChcImV1clwiKVxuLy8gZXhwb3J0IGNvbnN0IG51bWJlciA9IFVuaXQoXCJzZWNvbmRzXCIpXG4vLyBleHBvcnQgdHlwZSBudW1iZXIgPSBVbml0PFwiZXVyXCI+XG4vLyBleHBvcnQgdHlwZSBudW1iZXIgPSBVbml0PFwic2Vjb25kc1wiPlxuXG5cbi8vIGV4cG9ydCB0eXBlIG51bWJlciA9IGBsb2Mke3N0cmluZ31gXG4vLyBleHBvcnQgY29uc3QgbnVtYmVyIDogU2NoZW1hPG51bWJlcj4gPSBzdHJpbmdcblxuZXhwb3J0IGNvbnN0IFJlcXVlc3QgPSBvYmplY3Qoe1xuICBpZDogVVVJRCxcbiAgc3RhcnRQb2ludDogbnVtYmVyLFxuICBlbmRQb2ludDogbnVtYmVyLFxuICB2YWx1ZV9ldXI6IG51bWJlcixcbiAgZGVhZGxpbmVfa206IG51bWJlcixcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IG51bWJlciwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogbnVtYmVyfSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogbnVtYmVyfSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cbmV4cG9ydCBjb25zdCBNb2R1bGUgPSBvYmplY3Qoe1xuXG4gIHJlcXVlc3RzOiBhcnJheShSZXF1ZXN0KSxcbiAgdHJhbnNwb3J0ZXJzOiBhcnJheShUcmFuc3BvcnRlciksXG4gIHNjaGVkdWxlOiBTY2hlZHVsZSxcblxufSlcblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG4iLAogICAgImltcG9ydCB7IHZhbGlkYXRlLCB0eXBlIEpzb25EYXRhLCB0eXBlIFNjaGVtYSB9IGZyb20gXCIuL3NjaGVtYVwiXG5cblxuXG5leHBvcnQgZnVuY3Rpb24gbWtXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ICh2YWx1ZTogVCkge1xuXG4gIGxldCBsaXN0ZW5lcnM6ICgobmV3VmFsdWU6IFQsIG9sZFZhbHVlOiBUKT0+dm9pZClbXSA9IFtdXG4gIGxldCByZXAgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcblxuICBsZXQgcmVzID0ge1xuICAgIGdldDogKCkgPT4gdmFsdWUsXG4gICAgc2V0OiAobmV3VmFsdWU6IFQpID0+IHtcbiAgICAgIGxldCBuZXdSZXAgPSBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSlcbiAgICAgIGlmIChuZXdSZXAgPT09IHJlcCkgcmV0dXJuXG4gICAgICByZXAgPSBuZXdSZXBcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIobmV3VmFsdWUsIHZhbHVlKSlcbiAgICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICB9LFxuICAgIG9udXBkYXRlOiAobGlzdGVuZXI6IChuZXdWYWx1ZTogVCwgb2xkVmFsdWUgOlQpPT52b2lkLCBkZWZlcnJlZCA9IGZhbHNlKSA9PiB7XG4gICAgICBpZiAoIWRlZmVycmVkKSBsaXN0ZW5lcih2YWx1ZSwgdmFsdWUpXG4gICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcilcbiAgICB9LFxuICAgIHVwZGF0ZTogKGNhbGxiYWNrOiAob2xkVmFsdWU6IFQpPT5UIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgICBsZXQgbmV3VmFsdWUgPSBjYWxsYmFjayh2YWx1ZSkgPz8gdmFsdWVcbiAgICAgIHJlcy5zZXQobmV3VmFsdWUpXG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gcmVzXG5cbn1cblxuZXhwb3J0IHR5cGUgV3JpdGFibGU8VCBleHRlbmRzIEpzb25EYXRhPiA9IFJldHVyblR5cGU8dHlwZW9mIG1rV3JpdGFibGU8VD4+XG5cbmV4cG9ydCBmdW5jdGlvbiBta1N0b3JlZCA8VCBleHRlbmRzIEpzb25EYXRhPiAoa2V5OiBzdHJpbmcsIHNjaGVtYTogU2NoZW1hPFQ+LCBkZWZhdWx0VmFsdWU6IFQpIHtcbiAgbGV0IHZhbCA9IGRlZmF1bHRWYWx1ZVxuICB0cnl7XG4gICAgdmFsID0gdmFsaWRhdGUoc2NoZW1hLCBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkhKSlcbiAgfWNhdGNoe31cblxuICBsZXQgcmVzID0gbWtXcml0YWJsZTxUPih2YWwpXG4gIFxuICByZXMub251cGRhdGUoKG5ld1ZhbHVlKT0+e1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkobmV3VmFsdWUpKVxuICB9KVxuXG4gIHJldHVybiByZXNcbn1cblxuIiwKICAgICJpbXBvcnQgeyB0eXBlIFNjaGVkdWxlSXRlbSwgdHlwZSBVVUlELCBTY2hlZHVsZVN0ZXAsIFJlcXVlc3QgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGdldENvc3ROLCBvcHREdXIsIG9wdGltaXplU2NoZWR1bGUsIHJhdGVTY2hlZHVsZSB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyBta1dyaXRhYmxlIH0gZnJvbSBcIi4uL3dyaXRlYWJsZVwiO1xuaW1wb3J0IHsgYmFja2dyb3VuZCwgYm9keSwgYm9yZGVyUmFkaXVzLCBidXR0b24sIGNvbG9yLCBkaXYsIGgyLCBodG1sLCBwLCBwYWRkaW5nLCBzcGFuLCBzdHlsZSwgdGFibGUsIHRkLCB0ciwgd2lkdGggfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cywgcmVxdWVzdHMsIHJvYWRNYXAsIHNjaGVkdWxlIH0gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHsgY29zdFN0cmluZywgZGlzdGFuY2VTdHJpbmcsIGxvY1N0cmluZywgcmVxdWVzdFN0cmluZywgdGltZVN0cmluZywgdHJhbnNwb3J0ZXJTdHJpbmcgfSBmcm9tIFwiLi9yZXF1ZXN0Vmlld1wiO1xuXG5cbmZ1bmN0aW9uIHN0ZXBMb2dvIChzdGVwOiBTY2hlZHVsZVN0ZXApe1xuICBpZiAoc3RlcC4kID09IFwic3RhcnRcIikgcmV0dXJuICfwn5qbJ1xuICBpZiAoc3RlcC4kID09IFwicGlja3VwXCIpIHJldHVybiAn8J+TpidcbiAgaWYgKHN0ZXAuJCA9PSBcImRlbGl2ZXJcIikgcmV0dXJuICfwn4+gJ1xuICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmV4cGVjdGVkIHRhZzpcIiwgc3RlcClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlcXVlc3QoaWQ6IFVVSUQpe1xuICBsZXQgcmVxID0gcmVxdWVzdHMuZmluZChyPT5yLmlkID09IGlkKVxuICBpZiAoIXJlcSkgdGhyb3cgbmV3IEVycm9yKGBub3QgZm91bmQgcmVxdWVzdCAke2lkfWApXG4gIHJldHVybiByZXFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0ZXBSZXF1ZXN0KHN0ZXA6IFNjaGVkdWxlU3RlcCl7XG4gIGlmIChzdGVwLiQgPT0gXCJzdGFydFwiKSByZXR1cm4gdW5kZWZpbmVkXG4gIHJldHVybiBnZXRSZXF1ZXN0KHN0ZXAudmFsLnJlcXVlc3QpXG59XG5cbmZ1bmN0aW9uIHN0ZXBTdHJpbmcgKHN0ZXA6IFNjaGVkdWxlU3RlcCl7XG5cbiAgaWYgKHN0ZXAuJCA9PSBcInN0YXJ0XCIpIHJldHVybiBgc3RhcnRgXG4gIGxldCByZXEgPSBnZXRSZXF1ZXN0KHN0ZXAudmFsLnJlcXVlc3QpXG4gIHJldHVybiBgJHtzdGVwLiR9ICR7cmVxdWVzdFN0cmluZyhzdGVwLnZhbC5yZXF1ZXN0KX06ICR7Y29zdFN0cmluZyhyZXEudmFsdWVfZXVyKX0gZGVhZGxpbmUgJHt0aW1lU3RyaW5nKHJlcS5kZWFkbGluZV9rbSl9YFxufVxuXG5sZXQgY3Vyc29yID0gbWtXcml0YWJsZSh7cm93OiAxLCBjb2w6IDF9KVxuXG5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGU9PntcbiAgY3Vyc29yLnVwZGF0ZSgoY3Vyc29yKSA9PntcbiAgICBpZiAoY3Vyc29yLmNvbCA9PSAtMSkgcmV0dXJuXG4gICAgaWYgKGUua2V5ID09IFwiQXJyb3dMZWZ0XCIpICAgICAgICAgY3Vyc29yLmNvbCAtPSAxXG4gICAgZWxzZSBpZiAoZS5rZXkgPT0gXCJBcnJvd1JpZ2h0XCIpICAgY3Vyc29yLmNvbCArPSAxXG4gICAgZWxzZSBpZiAoZS5rZXkgPT0gXCJBcnJvd1VwXCIpICAgICAgY3Vyc29yLnJvdyAtPSAxXG4gICAgZWxzZSBpZiAoZS5rZXkgPT0gXCJBcnJvd0Rvd25cIikgICAgY3Vyc29yLnJvdyArPSAxXG4gICAgZWxzZSBpZiAoZS5rZXkgPT0gXCJFc2NhcGVcIikgICAgICAgY3Vyc29yID0ge3JvdzogLTEsIGNvbDogLTF9XG4gICAgZWxzZSByZXR1cm5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjdXJzb3Iucm93ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oIHNjaGVkdWxlLmdldCgpLmxlbmd0aC0xLCBjdXJzb3Iucm93KSlcbiAgICBjdXJzb3IuY29sID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oIHNjaGVkdWxlLmdldCgpW2N1cnNvci5yb3ddIS5zdGVwcy5sZW5ndGgtMSwgY3Vyc29yLmNvbCkpXG4gIH0pXG5cbn0pXG5cblxuXG5leHBvcnQgY29uc3Qgc2NoZWR1bGVWaWV3ID0gKCkgPT4ge1xuXG4gIGxldCBjZWxsID0gKCguLi54KSA9PiB0ZChzdHlsZSh7XG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1ncmF5KVwiLFxuICAgIG1hcmdpbjogXCIwXCIsXG4gICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgIHdoaXRlU3BhY2U6IFwibm93cmFwXCIsXG4gIH0pLCAuLi54KSkgYXMgdHlwZW9mIHRkO1xuXG4gIGNvbnN0IHRhYnZpZXcgPSBkaXYoKVxuICBjb25zdCByZWplY3RWaWV3ID0gZGl2KClcbiAgY29uc3Qgc3RlcHZpZXcgPSBkaXYoKVxuICBsZXQgc3RlcEVscyA9IFtdIGFzIEhUTUxTcGFuRWxlbWVudFtdW11cbiAgbGV0IHJvd0VscyA9IFtdIGFzIEhUTUxUYWJsZVJvd0VsZW1lbnRbXVxuXG4gIGxldCB0aW1lcyA6IG51bWJlcltdW10gPSBbXVxuXG4gIGxldCBkZWNrcyA6IFtSZXF1ZXN0W10sIFJlcXVlc3RbXV0gW10gW10gID0gW11cblxuICBcbiAgc2NoZWR1bGUub251cGRhdGUoc2NoZWQgPT4ge1xuXG4gICAgdGltZXMgPSBzY2hlZC5tYXAocz0+IFswXSlcbiAgICBkZWNrcyA9IHNjaGVkLm1hcChzPT4gW1tbXSwgW11dXSlcblxuXG4gICAgY3Vyc29yLm9udXBkYXRlKGN1cnNvcj0+e1xuXG4gICAgICBsZXQge3JvdywgY29sOiBufSA9IGN1cnNvclxuXG4gICAgICBsZXQgc3RlcHMgPSBzY2hlZFtyb3ddIS5zdGVwc1xuICAgICAgbGV0IHN0ZXAgPSBzdGVwc1tuXVxuICAgICAgaWYgKCFzdGVwKSByZXR1cm5cblxuICAgICAgbGV0IHJlcXVlc3QgPSBzdGVwLiQgPT0gXCJzdGFydFwiID8gdW5kZWZpbmVkIDogc3RlcC52YWwucmVxdWVzdFxuXG4gICAgICBzdGVwRWxzLmZvckVhY2goKHJvd0Vscywgcm93bik9PntcbiAgICAgICAgcm93RWxzLmZvckVhY2goKGVsLGkpPT57XG5cbiAgICAgICAgICBsZXQgc3RlcCA9IHNjaGVkW3Jvd25dIS5zdGVwc1tpXVxuICAgICAgICAgIGlmICghc3RlcCkgcmV0dXJuXG4gICAgICAgICAgbGV0IGJvcmRlciA9IGNvbG9yLmJhY2tncm91bmRcbiAgICAgICAgICBpZiAoaSA9PSBuICYmIHJvdyA9PSByb3duKSB7XG4gICAgICAgICAgICBib3JkZXIgPSBjb2xvci5ibHVlIFxuICAgICAgICAgICAgdmlld1N0ZXAocm93LCBuLCBzdGVwdmlldywgdGltZXNbcm93XSFbbl0hLCB0aW1lc1tyb3ddIVt0aW1lc1tyb3ddIS5sZW5ndGgtMV0hLCBkZWNrc1tyb3ddIVtuXSEpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHN0ZXAuJCAhPSBcInN0YXJ0XCIgJiYgc3RlcC52YWwucmVxdWVzdCA9PSByZXF1ZXN0KSBib3JkZXIgPSBjb2xvci5ncmF5XG4gICAgICAgICAgZWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBib3JkZXJcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIGxldCBsb2dvID0gc3RlcExvZ28oc3RlcClcblxuICAgICAgaGlnaHRMaWdodHMuc2V0KFtcbiAgICAgICAgeyBwb2ludHM6IHN0ZXBzLnNsaWNlKG4sbisyKS5tYXAoKHAsaSk9Pih7bnVtYmVyOiBwLnZhbC5wb3N9KSksIGNvbG9yOiBcIiNmZmM5ODhcIiB9LFxuICAgICAgICB7IHBvaW50czogW3tudW1iZXI6c3RlcC52YWwucG9zLCBsb2dvfV0gfVxuICAgICAgXSlcbiAgICB9LCB0cnVlKVxuXG5cblxuXG4gICAgdGFidmlldy5yZXBsYWNlQ2hpbGRyZW4odGFibGUoXG4gICAgICBbXCJ0cmFuc3BvcnRlclwiLCBcInN0ZXBzXCJdLm1hcChoPT4gY2VsbChoKSwgKSwgc3R5bGUoe2ZvbnRXZWlnaHQ6IFwiYm9sZFwifSksXG4gICAgICBzY2hlZC5tYXAoKHMsIHJvd24pPT57XG5cbiAgICAgICAgbGV0IGFsbFBvaW50cyA9IHMuc3RlcHMubWFwKHN0ZXA9PiAoeyBudW1iZXI6IHN0ZXAudmFsLnBvcywgbG9nbzogc3RlcExvZ28oc3RlcCkgfSkpXG4gICAgICAgIGxldCB0cmFuc3BvcnQgPSBzcGFuKHRyYW5zcG9ydGVyU3RyaW5nKHMudHJhbnNwb3J0ZXIpKVxuICAgICAgICB0cmFuc3BvcnQub25tb3VzZWVudGVyID0gKCk9PmhpZ2h0TGlnaHRzLnNldChbe3BvaW50czogYWxsUG9pbnRzLCBjb2xvcjogXCIjZmZjOTg4XCIsfV0pXG5cbiAgICAgICAgc3RlcEVscy5wdXNoKCBzLnN0ZXBzLm1hcCgoc3RlcCxpKT0+e1xuICAgICAgICAgIGlmIChpPjApe1xuICAgICAgICAgICAgbGV0IHByZXYgPSBzLnN0ZXBzW2ktMV0hXG4gICAgICAgICAgICBsZXQgZGlzdCA9IGdldENvc3ROKHByZXYudmFsLnBvcywgc3RlcC52YWwucG9zKVxuICAgICAgICAgICAgdGltZXNbcm93bl0hLnB1c2godGltZXNbcm93bl0hW2ktMV0hKyBkaXN0KVxuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkRFQ0tcIiwgcm93biwgaSwgZGVja3Nbcm93bl0hW2ktMV0hKVxuICAgICAgICAgICAgbGV0IGRlY2sgPSBbLi4uZGVja3Nbcm93bl0hW2ktMV0hXSBhcyBbUmVxdWVzdFtdLCBSZXF1ZXN0W11dXG5cbiAgICAgICAgICAgIGlmIChzdGVwLiQgPT0gXCJwaWNrdXBcIikgZGVja1tzdGVwLnZhbC5kZWNrXSEgPSBbLi4uZGVja1tzdGVwLnZhbC5kZWNrXSEsIGdldFJlcXVlc3Qoc3RlcC52YWwucmVxdWVzdCldXG4gICAgICAgICAgICBlbHNlIGlmIChzdGVwLiQgPT0gXCJkZWxpdmVyXCIpIGRlY2sgPSBkZWNrLm1hcCgoZCwgaik9PiBkLmZpbHRlcihyPT5yLmlkICE9IHN0ZXAudmFsLnJlcXVlc3QpICkgYXMgW1JlcXVlc3RbXSwgUmVxdWVzdFtdXVxuICAgICAgICAgICAgZGVja3Nbcm93bl0hLnB1c2goZGVjaylcblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB0aW1lID0gdGltZXNbcm93bl0hW2ldIVxuXG4gICAgICAgICAgbGV0IHJlcSA9IHN0ZXBSZXF1ZXN0KHN0ZXApXG5cbiAgICAgICAgICBsZXQgbG9nbyA9IHN0ZXBMb2dvKHN0ZXApXG4gICAgICAgICAgbGV0IHJlcyA9IHNwYW4obG9nbywgc3R5bGUoe3BhZGRpbmc6IFwiLjFlbSAuMWVtXCIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOnJlcSAmJiByZXEuZGVhZGxpbmVfa20gPCB0aW1lID8gY29sb3IucmVkIDogXCJcIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIwLjJlbSBzb2xpZCBcIiArIGNvbG9yLmJhY2tncm91bmQsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiMC4zZW1cIixcbiAgICAgICAgICAgIFxuICAgICAgICAgIH0pKVxuXG4gICAgICAgICAgcmVzLm9uY2xpY2sgPSAoKT0+e1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDTElDS1wiLCByb3duLCBpKVxuICAgICAgICAgICAgY3Vyc29yLnNldCh7cm93OiByb3duLCBjb2w6IGl9KVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxldCByb3c9IHRyKGNlbGwodHJhbnNwb3J0KSwgY2VsbChzdGVwRWxzW3Jvd25dISkpXG4gICAgICAgIHJvd0Vscy5wdXNoKHJvdylcbiAgICAgICAgcmV0dXJuIHJvd1xuICAgICAgfSksXG4gICAgICBzdHlsZSh7IGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsIH0pLFxuICAgICkpO1xuICAgIGxldCByZWplY3RzID0gcmVxdWVzdHMuZmlsdGVyKHI9PiFzY2hlZC5mbGF0TWFwKHM9PnMuc3RlcHMpLnNvbWUoc3RlcD0+c3RlcC4kICE9IFwic3RhcnRcIiAmJiBzdGVwLnZhbC5yZXF1ZXN0ID09IHIuaWQpKVxuXG4gICAgcmVqZWN0Vmlldy5yZXBsYWNlQ2hpbGRyZW4oXG5cbiAgICAgIHJlamVjdHMubGVuZ3RoID09IDAgPyBzcGFuKCkgOiBkaXYoXG4gICAgICAgIGRpdihcbiAgICAgICAgICBwKFwib3BlbiByZXF1ZXN0c1wiLCBzdHlsZSh7Zm9udFdlaWdodDogXCJib2xkXCIsIHBhZGRpbmc6IFwiLjNlbVwiLCBtYXJnaW46IFwiLjNlbVwifSkpLFxuICAgICAgICAgIHJlamVjdHMubWFwKHI9PnNwYW4ocmVxdWVzdFN0cmluZyhyLmlkKSwgc3R5bGUoe3BhZGRpbmc6IFwiLjNlbVwiLCBtYXJnaW46IFwiLjNlbVwiLCB3aGl0ZVNwYWNlOiBcIm5vd3JhcFwifSkpKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBkaXNwbGF5OiBcInJvd1wiLFxuICAgICAgICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjVlbVwiLFxuICAgICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuICB9KVxuXG4gIGxldCB2YWx1ZSA9IHNwYW4oKVxuICBzY2hlZHVsZS5vbnVwZGF0ZShzY2g9PnZhbHVlLnRleHRDb250ZW50ID0gcmF0ZVNjaGVkdWxlKHNjaCkudG9GaXhlZCgyKSlcblxuXG4gIGxldCBzY2hlZHVsZUVsID0gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIHdpZHRoOiBcImNhbGMoMTAwJSAtIDJlbSlcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBvdmVyZmxvdzogXCJhdXRvXCIsXG4gICAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgICBwYWRkaW5nOiBcIi41ZW1cIixcbiAgICB9KSxcbiAgICB0YWJ2aWV3LFxuICAgIHJlamVjdFZpZXcsXG4gICAgcChcIlZhbHVlOiBcIiwgdmFsdWUpLFxuICAgIHAoXCJzZWFyY2ggbnVtYmVyOlwiLCBvcHREdXIpLFxuICAgIHN0ZXB2aWV3LFxuICApXG4gIHJldHVybiBzY2hlZHVsZUVsXG59XG5cblxuXG5mdW5jdGlvbiB2aWV3U3RlcChyb3c6IG51bWJlciwgbjogbnVtYmVyLCBwYXJlbnQ6IEhUTUxFbGVtZW50LCBkaXN0OiBudW1iZXIsIHRvdGFsOiBudW1iZXIsIGRlY2tzOiBbUmVxdWVzdFtdLCBSZXF1ZXN0W11dKXtcbiAgbGV0IHN0ZXBzID0gc2NoZWR1bGUuZ2V0KClbcm93XVxuICBpZiAoIXN0ZXBzKSByZXR1cm5cbiAgbGV0IHN0ZXAgPSBzdGVwcy5zdGVwc1tuXVxuICBpZiAoIXN0ZXApIHJldHVyblxuXG4gIC8vIGxldCBkZWNrcyA9IFtbXSxbXV0gYXMgW1VVSURbXSwgVVVJRFtdXVxuXG4gIGxldCB2aXN1YWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKVxuICB2aXN1YWwuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxMDAlXCIpXG5cbiAgdmlzdWFsLnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCItMC4xIC0wLjEgMS4yIDEuMlwiKVxuICB2aXN1YWwuc2V0QXR0cmlidXRlKFwicHJlc2VydmVBc3BlY3RSYXRpb1wiLCBcInhNaWRZTWlkIG1lZXRcIilcblxuICBsZXQgdHJhbnNwb3J0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInBvbHlnb25cIilcbiAgbGV0IHBvaW50cyA9IFsgWy4yLCAwXSwgWy4wLCAuMl0sIFsuMCwgLjRdLCBbLjIsIC40XSwgWy44LCAuNF0sIFsuOCwgLjM3XSwgWy4yLCAuMzddLCBbLjIsIC4yXSwgWy44LCAuMl0sIFsuOCwgLjE3XSwgWy4yLCAuMTddLF1cbiAgdHJhbnNwb3J0ZXIuc2V0QXR0cmlidXRlKFwicG9pbnRzXCIsIHBvaW50cy5tYXAocD0+cC5qb2luKFwiLFwiKSkuam9pbihcIiBcIikpXG4gIHRyYW5zcG9ydGVyLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuYmx1ZSlcblxuICB2aXN1YWwuYXBwZW5kQ2hpbGQodHJhbnNwb3J0ZXIpXG5cbiAgZGVja3MuZm9yRWFjaCgoZGVjaywgaSk9PntcbiAgICBkZWNrLmZvckVhY2goKHJlcSwgaik9PntcbiAgICAgIGxldCBjYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInJlY3RcIilcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJ4XCIsICgwLjIyNSArIC4yICogaikudG9TdHJpbmcoKSlcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJ5XCIsICgwLjI1IC0gMC4yICAqIGkpLnRvU3RyaW5nKCkpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIuMTVcIilcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCIwLjEyXCIpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5ncmF5KVxuICAgICAgdmlzdWFsLmFwcGVuZENoaWxkKGNhcilcblxuICAgICAgbGV0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInRleHRcIilcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwieFwiLCAoMC4yMjUgKyAuMiAqIGogKyAwLjA3NSkudG9TdHJpbmcoKSlcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwieVwiLCAoMC4yNyAtIDAuMiAqIGkgKyAwLjA1KS50b1N0cmluZygpKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJkb21pbmFudC1iYXNlbGluZVwiLCBcIm1pZGRsZVwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDRcIilcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5jb2xvcilcbiAgICAgIHRleHQudGV4dENvbnRlbnQgPSBgJHtyZXF1ZXN0U3RyaW5nKHJlcS5pZCl9YFxuICAgICAgdmlzdWFsLmFwcGVuZENoaWxkKHRleHQpXG4gICAgICBcbiAgICB9KVxuICB9KVxuXG4gIGZvciAobGV0IHggb2YgWzAuMiwgMC42XSl7XG4gICAgbGV0IHRpcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcImNpcmNsZVwiKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiY3hcIiwgeC50b1N0cmluZygpKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiY3lcIiwgXCIwLjVcIilcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjA3XCIpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmJsdWUpXG4gICAgdmlzdWFsLmFwcGVuZENoaWxkKHRpcmUpXG4gIH1cblxuXG5cbiAgbGV0IGRlYWQgPSBzdGVwLiQgIT0gXCJzdGFydFwiICYmIGdldFJlcXVlc3Qoc3RlcC52YWwucmVxdWVzdCkuZGVhZGxpbmVfa20gPCBkaXN0XG5cbiAgbGV0IHJlcyA9IGRpdihcbiAgICBoMih0cmFuc3BvcnRlclN0cmluZyhzdGVwcy50cmFuc3BvcnRlcikpLFxuICAgIHAoYCR7ZGlzdGFuY2VTdHJpbmcoZGlzdCl9IC8gJHtkaXN0YW5jZVN0cmluZyh0b3RhbCl9YCksXG4gICAgcChzdGVwU3RyaW5nKHN0ZXApLCBzdHlsZSh7Y29sb3I6IGRlYWQgPyBjb2xvci5yZWQgOiBjb2xvci5jb2xvcn0pKSxcbiAgICBzdHlsZSh7XG4gICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgICBtYXJnaW46IFwiMFwiLFxuICAgICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICAgIG1pbkhlaWdodDogXCIyZW1cIixcbiAgICB9KVxuICApXG5cbiAgcmVzLmFwcGVuZCh2aXN1YWwpXG4gIHBhcmVudC5yZXBsYWNlQ2hpbGRyZW4ocmVzKVxufVxuIiwKICAgICJpbXBvcnQgeyBidWlsZENvc3RNYXRyaXgsIENvc3RNYXRyaXggfSBmcm9tIFwiLi4vcGxhbm5lclwiXG5pbXBvcnQgeyBkaXYsIHAgfSBmcm9tIFwiLi4vdmlldy9odG1sXCJcbmltcG9ydCB7IExLV19DT1VOVCwgcmVxdWVzdHMsIHJvYWRNYXAgfSBmcm9tIFwiLi4vdmlldy9tYWluXCJcblxuXG5mdW5jdGlvbiBnZXRDb3N0IChhOiBudW1iZXIsIGI6bnVtYmVyKXtcbiAgY29uc29sZS5sb2coXCJnZXRDb3N0XCIsIGEsYilcbiAgbGV0IGlkeCA9IHJvYWRNYXAucm9hZElEWChhLGIpXG4gIHJldHVybiBDb3N0TWF0cml4W2lkeF0hXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNpbXBsZUFubmVhbGluZygpe1xuICBidWlsZENvc3RNYXRyaXgoKVxuICBjb25zdCBOVFJBTlMgPSBMS1dfQ09VTlQuZ2V0KClcbiAgY29uc3QgTlJFUVMgPSByZXF1ZXN0cy5sZW5ndGhcbiAgY29uc3QgVFNJWkUgPSBNYXRoLmZsb29yKE5SRVFTICogMi41ICsgMTApXG5cbiAgY29uc3QgcmVxUGlja3VwTG9jYXRpb25zICAgPSBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKHI9PnIuc3RhcnRQb2ludCkpXG4gIGNvbnN0IHJlcURlbGl2ZXJ5TG9jYXRpb25zID0gbmV3IFVpbnQxNkFycmF5KHJlcXVlc3RzLm1hcChyPT5yLmVuZFBvaW50KSlcbiAgY29uc3QgcmVxRGVhZGxpbmVzID0gICAgICAgICBuZXcgVWludDMyQXJyYXkocmVxdWVzdHMubWFwKHI9PnIuZGVhZGxpbmVfa20pKVxuICBjb25zdCByZXFWYWx1ZXMgPSAgICAgICAgICAgIG5ldyBVaW50MzJBcnJheShyZXF1ZXN0cy5tYXAocj0+ci52YWx1ZV9ldXIpKVxuICBjb25zdCB1bmFzc2lnbmVkID0gbmV3IEludDhBcnJheShyZXF1ZXN0cy5tYXAocj0+MSkpXG5cbiAgY29uc3QgdHJhblN0YXJ0ID0gICBuZXcgVWludDE2QXJyYXkocmVxdWVzdHMubWFwKHg9Pnguc3RhcnRQb2ludCkpXG4gIGNvbnN0IHNjaGVkdWxlID0gbmV3IFVpbnQxNkFycmF5KFRTSVpFICogTlRSQU5TKVxuXG4gIGZ1bmN0aW9uIGlzRW1wdHkoeDpudW1iZXIpe1xuICAgIHJldHVybiB4ICYgMVxuICB9XG5cbiAgZnVuY3Rpb24gaXNsb2FkKHg6bnVtYmVyKXtcbiAgICByZXR1cm4geCAmIDJcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldERlY2soeDpudW1iZXIpe1xuICAgIHJldHVybiB4ICYgNFxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVxKHg6bnVtYmVyKXtcbiAgICByZXR1cm4geCA+PiAzXG4gIH1cblxuICBmdW5jdGlvbiBzZXRSZXEodHJhbjogbnVtYmVyLCBpc2xvYWQ6IDF8MCwgZGVjazogMXwwLCByZXE6IG51bWJlcil7XG4gICAgc2NoZWR1bGVbdHJhbiAqIFRTSVpFXSA9IDEgfCAoaXNsb2FkPDwxKSB8IChkZWNrIDw8IDIpIHwgKHJlcSA8PCAzKVxuICB9XG5cbiAgbGV0IElORiA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSXG5cbiAgZnVuY3Rpb24gc2NvcmUodHJhbjpudW1iZXIpe1xuICAgIGxldCByZXdhcmQgPSAwXG4gICAgbGV0IGR1cmF0aW9uID0gMFxuICAgIGxldCBkZWNrczogW251bWJlcltdLCBudW1iZXJbXV0gPSBbW10sIFtdXVxuICAgIGxldCBwb3MgPSB0cmFuU3RhcnRbdHJhbl0hXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBUU0laRTsgaSsrKXtcbiAgICAgIGxldCBzdGVwID0gc2NoZWR1bGVbdHJhbiAqIFRTSVpFICsgaV0hXG4gICAgICBpZiAoc3RlcCA9PSAwKSBicmVha1xuICAgICAgY29uc3QgbG9hZCA9IGlzbG9hZChzdGVwKVxuICAgICAgY29uc3QgcmVxID0gZ2V0UmVxKHN0ZXApXG4gICAgICBjb25zdCBuZXh0cG9zID0gbG9hZCA/IHJlcVBpY2t1cExvY2F0aW9uc1tyZXFdISA6IHJlcURlbGl2ZXJ5TG9jYXRpb25zW3JlcV0hXG4gICAgICBkdXJhdGlvbiArPSBnZXRDb3N0KHBvcywgbmV4dHBvcylcbiAgICAgIHBvcyA9IG5leHRwb3NcbiAgICAgIGlmIChsb2FkKXtcbiAgICAgICAgbGV0IGRlY2sgPSBkZWNrc1tnZXREZWNrKHN0ZXApXSFcbiAgICAgICAgZGVjay5wdXNoKHJlcSlcbiAgICAgICAgaWYgKGRlY2subGVuZ3RoID4gMykgcmV0dXJuIC1JTkZcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBkZWNrID0gZGVja3NbZ2V0RGVjayhzdGVwKV0hXG4gICAgICAgIGxldCBpZHggPSBkZWNrLmluZGV4T2YocmVxKVxuICAgICAgICBpZiAoaWR4ID09IC0xKSByZXR1cm4gLUlORlxuICAgICAgICBkZWNrLnNwbGljZShpZHgsIDEpXG4gICAgICAgIGlmIChkdXJhdGlvbiA8PSByZXFEZWFkbGluZXNbcmVxXSEpIHJld2FyZCArPSByZXFWYWx1ZXNbcmVxXSFcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlBc3NpZ24oKXtcblxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5VW5hc3NpZ24oKXtcblxuICB9XG5cbiAgZnVuY3Rpb24gdHJ5U3dhcCgpe1xuXG4gIH1cbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBwbGFubmVyVmlldygpOkhUTUxFbGVtZW50e1xuXG4gIFxuXG4gIGxldCBlbCA9IGRpdihcbiAgICBBcnJheS5mcm9tKHJlcXVlc3RzKS5zbGljZSgxKS5tYXAoKF8scik9PnAoYHJlcXVlc3QgJHtyfSBjb3N0IHRvIDA6ICR7Z2V0Q29zdCgwLHIpfWApKSxcbiAgKVxuICBcblxuICByZXR1cm4gZWxcblxuXG59IiwKICAgICJpbXBvcnQgeyBoYXNoIH0gZnJvbSBcIi4uL2hhc2hcIjtcbmltcG9ydCB7IGJvZHksIGJ1dHRvbiwgY29sb3IsIGRpdiwgZXJyb3Jwb3B1cCwgaDEsIGgyLCBoMywgaW5wdXQsIG1hcmdpbiwgcCwgcGFkZGluZywgcG9wdXAsIHByZSwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB3aWR0aCwgdGV4dGFyZWEsIGEsIGJvcmRlciwgaHRtbCwgdGgsIHRyLCB0ZCwgYm9yZGVyUmFkaXVzLCBwYW5lbExpc3QsIGRpc3BsYXksIGJhY2tncm91bmQgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBtYXBWaWV3IH0gZnJvbSBcIi4vbWFwVmlld1wiO1xuaW1wb3J0IHsgcmFuZG9tTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgcmFuZG9tVVVJRCwgUmVxdWVzdCwgU2NoZWR1bGUsIFVVSUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IHJlcXVlc3RWaWV3IH0gZnJvbSBcIi4vcmVxdWVzdFZpZXdcIjtcbmltcG9ydCB7IHNjaGVkdWxlVmlldyB9IGZyb20gXCIuL3NjaGVkdWxlVmlld1wiO1xuaW1wb3J0IHsgbWtTdG9yZWQsIG1rV3JpdGFibGUsIHR5cGUgV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyBjb25maWd1cmVQbGFubmVyLCBvcHRpbWl6ZVNjaGVkdWxlIH0gZnJvbSBcIi4uL3BsYW5uZXJcIjtcbmltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRvbSwgc2V0UmFuZFNlZWQgfSBmcm9tIFwiLi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBudW1iZXIgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5pbXBvcnQgeyBwbGFubmVyVmlldyB9IGZyb20gXCIuLi9wbGFubmVycy9hbm5lYWxpbmdcIjtcblxuXG5leHBvcnQgbGV0IExLV19DT1VOVCA9IG1rU3RvcmVkKFwiTEtXX0NPVU5UXCIsIG51bWJlciwgIDUpXG5sZXQgUkVRVUVTVF9DT1VOVCA9IG1rU3RvcmVkKFwiUkVRVUVTVF9DT1VOVFwiLCAgbnVtYmVyLCAyMClcblxuYm9keS5zdHlsZS5tYXJnaW4gPSBcIjBcIlxuXG5sZXQgaGVhZGVyID0gaDEoXCJyb3V0ZSBwbGFubmVyXCIsIHN0eWxlKHtiYWNrZ3JvdW5kOiBjb2xvci5ibHVlLCBjb2xvcjogY29sb3IuYmFja2dyb3VuZCwgbWFyZ2luOiBcIjBcIiwgcGFkZGluZzogXCIuNmVtXCJ9KSlcblxubGV0IGNvbnRlbnRTcGFjZSA9IGRpdihzdHlsZSh7XG4gIGRpc3BsYXk6XCJmbGV4XCIsXG4gIGZsZXhEaXJlY3Rpb246XCJyb3dcIixcbiAgd2lkdGg6IFwiMTAwJVwiLFxuICBoZWlnaHQ6IFwiY2FsYygxMDAlIC0gMi41ZW0pXCIsXG4gIG1pbldpZHRoOiBcIjBcIixcbn0pKVxuXG5sZXQgcGFnZSA9IGRpdihcbiAgc3R5bGUoe2Rpc3BsYXk6XCJmbGV4XCIsIGZsZXhEaXJlY3Rpb246XCJjb2x1bW5cIiwgaGVpZ2h0OiBcIjEwMCVcIn0pLFxuICBoZWFkZXIsXG4gIGNvbnRlbnRTcGFjZVxuKVxuXG5ib2R5LnJlcGxhY2VDaGlsZHJlbihwYWdlKVxuXG5cbnNldFJhbmRTZWVkKDI0KVxuXG5cbmV4cG9ydCBsZXQgcm9hZE1hcCA9IHJhbmRvbU1hcCgpXG5cbmV4cG9ydCBsZXQgcmVxdWVzdHM6IFJlcXVlc3RbXSA9IEFycmF5LmZyb20oe2xlbmd0aDpSRVFVRVNUX0NPVU5ULmdldCgpfSwgKF8saSk9Pih7XG4gIGlkOiByYW5kb21VVUlEKCksXG4gIHN0YXJ0UG9pbnQ6IHJhbmRDaG9pY2Uocm9hZE1hcC5yYW5nZSksXG4gIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRNYXAucmFuZ2UpLFxuICAvLyB2YWx1ZTogdWNvbnN0KE1hdGguZmxvb3IocmFuZG9tKCkqMTAwMCksIFwiZXVyXCIpLFxuICAvLyBkZWFkbGluZTogdWNvbnN0KE1hdGguZmxvb3IocmFuZG9tKCkqNjAqNjAqMjQqNyksIFwic2Vjb25kc1wiKSxcbiAgdmFsdWVfZXVyOiBNYXRoLmZsb29yKHJhbmRvbSgpKjEwMDApLFxuICBkZWFkbGluZV9rbTogTWF0aC5mbG9vcihyYW5kb20oKSo2MCo2MCoyNCo3KSxcbn0pKVxuXG5cbi8vIGV4cG9ydCBsZXQgc2NoZWR1bGUgPSBta1dyaXRhYmxlPFNjaGVkdWxlPiAoQXJyYXkuZnJvbSh7bGVuZ3RoOiBMS1dfQ09VTlQuZ2V0KCl9LCAoXyxpKT0+KHtcbi8vICAgdHJhbnNwb3J0ZXI6IHJhbmRvbVVVSUQoKSxcbi8vICAgc3RlcHM6IFt7ICQ6XCJzdGFydFwiLCB2YWw6IHtcInBvc1wiOiAgcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyl9fV1cbi8vIH0pKSlcblxuZXhwb3J0IGxldCBzY2hlZHVsZSA9IG1rV3JpdGFibGU8U2NoZWR1bGU+IChBcnJheS5mcm9tKHtsZW5ndGg6IExLV19DT1VOVC5nZXQoKX0sIChfLGkpPT4oe1xuICB0cmFuc3BvcnRlcjogcmFuZG9tVVVJRCgpLFxuICBzdGVwczogW3sgJDpcInN0YXJ0XCIsIHZhbDoge1wicG9zXCI6ICByYW5kQ2hvaWNlKHJvYWRNYXAucmFuZ2UpfX1dXG59KSkpXG5cblxuXG5jb25maWd1cmVQbGFubmVyKHsgcmVxdWVzdHMsIHJvYWRNYXAgfSlcblxuLy8gc2NoZWR1bGUudXBkYXRlKHNjaGVkPT5vcHRpbWl6ZVNjaGVkdWxlKHJlcXVlc3RzLCBzY2hlZCkpXG5cblxuZXhwb3J0IHR5cGUgSGlnaExpZ2h0ID0ge1xuICBwb2ludHM6IHtcbiAgICBudW1iZXI6IG51bWJlcixcbiAgICBsb2dvPyA6IHN0cmluZyxcbiAgfVtdLFxuICBjb2xvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgbGV0IGhpZ2h0TGlnaHRzID0gbWtXcml0YWJsZSA8SGlnaExpZ2h0W10+KCBbXSApXG5cblxuZnVuY3Rpb24gc2V0dGVyIChzdG9yZTogV3JpdGFibGU8bnVtYmVyPiApe1xuICBsZXQgaW5wID0gaW5wdXQoKVxuICBpbnAudHlwZSA9IFwibnVtYmVyXCJcbiAgaW5wLm9uY2hhbmdlID0gKCk9PntcbiAgICBsZXQgdmFsID0gcGFyc2VJbnQoaW5wLnZhbHVlKVxuICAgIGlmIChpc05hTih2YWwpKSByZXR1cm5cbiAgICBzdG9yZS5zZXQodmFsKVxuICB9XG4gIHN0b3JlLm9udXBkYXRlKHZhbD0+aW5wLnZhbHVlID0gdmFsLnRvU3RyaW5nKCkpXG5cbiAgcmV0dXJuIGlucFxufVxuXG5cbmZ1bmN0aW9uIG1rV2luZG93ICh0YWI6IG51bWJlciA9IDAgKSB7XG5cbiAgbGV0IHRhYkZpZWxkcyA9IFtcbiAgICBbJ21hcCcsIG1hcFZpZXcocm9hZE1hcCldLFxuICAgIFsncmVxdWVzdHMnLCByZXF1ZXN0VmlldyhyZXF1ZXN0cywgc2NoZWR1bGUuZ2V0KCkpXSxcbiAgICBbJ3NjaGVkdWxlJywgc2NoZWR1bGVWaWV3KCkgXSxcbiAgICBbJ3NldHRpbmdzJywgZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBwYWRkaW5nOiBcIjFlbVwiLFxuICAgICAgfSksXG4gICAgICBoMihcInNldHRpbmdzXCIpLFxuXG5cbiAgICAgIHRhYmxlKFxuICAgICAgICB0cihcbiAgICAgICAgICB0ZChcIkxLVyBjb3VudFwiKSxcbiAgICAgICAgICB0ZChzZXR0ZXIoTEtXX0NPVU5UKSlcbiAgICAgICAgKSxcbiAgICAgICAgdHIoXG4gICAgICAgICAgdGQoXCJSZXF1ZXN0IGNvdW50XCIpLFxuICAgICAgICAgIHRkKHNldHRlcihSRVFVRVNUX0NPVU5UKSlcbiAgICAgICAgKSxcbiAgICAgICAgdHIoYnV0dG9uKFwiZ2VuZXJhdGVcIiwgKCk9PntcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKClcbiAgICAgICAgfSkpXG4gICAgICApXG5cbiAgICApXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgcCh0YWJGaWVsZHMubWFwKChbbixlXSk9PlxuICAgICAgICBzcGFuKCBuLFxuICAgICAgICAgICgpPT5vcGVuVGFiKG4pLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjNlbVwiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIi4zZW1cIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiKyAobj09dGFiID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5KSxcbiAgICAgICAgICAgIGNvbG9yOiAobj09dGFiKSA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApKSxcbiAgICAgIHRhYkZpZWxkcy5maW5kKChbbixdKT0+bj09dGFiKSFbMV1cbiAgICApXG4gIH1cblxuXG4gIG9wZW5UYWIodGFiRmllbGRzW3RhYl0hWzBdKVxuXG4gIHJldHVybiBlbFxufVxuXG4vLyBjb250ZW50U3BhY2UucmVwbGFjZUNoaWxkcmVuKG1rV2luZG93KDIgKSwgbWtXaW5kb3coKSlcblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbihwbGFubmVyVmlldygpKVxuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQUVPLElBQU0sT0FBTyxTQUFTO0FBRTdCLElBQU0sZUFBZTtBQUFBLEVBQ25CLE9BQU07QUFBQSxJQUNKLE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNuQixLQUFtQjtBQUFBLElBQ25CLE9BQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsTUFBSztB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
