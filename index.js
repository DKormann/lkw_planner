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
  return Math.floor(random() * (max - min + 1)) + min;
}
function randChoice(arr) {
  return arr[randInt(0, arr.length - 1)];
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
var Unit = (unit) => object({ value: number, unit: constant(unit) });
var uconst = (value, unit) => ({ value, unit });
var add = (a2, b) => ({ value: a2.value + b.value, unit: a2.unit });
var iadd = (a2, b) => {
  a2.value += b.value;
};
var isub = (a2, b) => {
  a2.value -= b.value;
};
var mul = (a2, b) => ({ value: a2.value * b, unit: a2.unit });
function randomUUID() {
  return "u" + random().toString(16).slice(2, 10) + "-" + random().toString(16).slice(2, 10);
}
var Price = Unit("eur");
var Time = Unit("seconds");
var Location = string;
var Request = object({
  id: UUID,
  startPoint: Location,
  endPoint: Location,
  value: Price,
  deadline: Time
});
var Transporter = object({ id: UUID, position: UUID });
var ScheduleStep = tagged({
  pickup: object({ request: UUID, pos: Location, deck: union(constant(0), constant(1)) }),
  deliver: object({ request: UUID, pos: Location }),
  start: object({ pos: Location })
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

// src/planner.ts
var DECKCAPACITY = 3;
var UNLOADCOST = uconst(10, "eur");
var PICKUPCOST = uconst(5, "eur");
var COST_PER_H = 20;
var COST_PER_SECOND = COST_PER_H / 3600;
var plannerContext = null;
function configurePlanner(context) {
  plannerContext = context;
  CostMatrix.clear();
}
function getPlannerContext() {
  if (!plannerContext) {
    throw new Error("Planner context is not configured");
  }
  return plannerContext;
}
function pairId(a2, b) {
  return a2 < b ? `${a2}-${b}` : `${b}-${a2}`;
}
var CostMatrix = new Map;
function findPath(start, end) {
  const { roadMap } = getPlannerContext();
  const id = pairId(start, end);
  if (start === end) {
    const dist2 = uconst(0, "seconds");
    CostMatrix.set(id, dist2);
    return { path: [start], dist: dist2 };
  }
  const dist = new Map;
  const prev = new Map;
  const unvisited = new Set(roadMap.points);
  for (const point of roadMap.points) {
    dist.set(point, uconst(Infinity, "seconds"));
    prev.set(point, null);
  }
  dist.set(start, uconst(0, "seconds"));
  while (unvisited.size > 0) {
    let current = null;
    let currentDist = Infinity;
    for (const point of unvisited) {
      const pointDist = dist.get(point).value;
      if (pointDist < currentDist) {
        current = point;
        currentDist = pointDist;
      }
    }
    if (current == null || currentDist === Infinity) {
      break;
    }
    unvisited.delete(current);
    if (current === end) {
      break;
    }
    for (const [next, segment] of roadMap.roads.get(current) ?? []) {
      if (!unvisited.has(next)) {
        continue;
      }
      const candidate = add(dist.get(current), segment);
      if (candidate.value < dist.get(next).value) {
        dist.set(next, candidate);
        prev.set(next, current);
      }
    }
  }
  const totalDist = dist.get(end);
  if (!totalDist || totalDist.value === Infinity) {
    throw new Error(`No path found from ${start} to ${end}`);
  }
  const path = [];
  let cursor = end;
  while (cursor != null) {
    path.push(cursor);
    cursor = prev.get(cursor) ?? null;
  }
  path.reverse();
  CostMatrix.set(id, totalDist);
  return { path, dist: totalDist };
}
function getCost(start, end) {
  const id = pairId(start, end);
  if (!CostMatrix.has(id)) {
    findPath(start, end);
  }
  return CostMatrix.get(id);
}
var optDur = 0;
function requestMap(requests) {
  return new Map(requests.map((request) => [request.id, request]));
}
function routeScore(item, requestsById) {
  if (item.steps[0]?.$ !== "start") {
    return -Infinity;
  }
  const reward = uconst(0, "eur");
  const duration = uconst(0, "seconds");
  const decks = [[], []];
  function unload(reqId, deck) {
    const idx = decks[deck].indexOf(reqId);
    if (idx === -1) {
      return false;
    }
    const after = decks[deck].slice(idx + 1);
    decks[deck] = decks[deck].slice(0, idx).concat(after);
    isub(reward, UNLOADCOST);
    isub(reward, mul(add(UNLOADCOST, PICKUPCOST), after.length));
    return true;
  }
  for (let i = 1;i < item.steps.length; i++) {
    const prev = item.steps[i - 1];
    const step = item.steps[i];
    iadd(duration, getCost(prev.val.pos, step.val.pos));
    if (step.$ === "pickup") {
      decks[step.val.deck].push(step.val.request);
      if (decks[step.val.deck].length > DECKCAPACITY) {
        return -Infinity;
      }
      continue;
    }
    if (step.$ === "deliver") {
      const req = requestsById.get(step.val.request);
      if (!req) {
        throw new Error(`not found request: ${step.val.request}`);
      }
      if (!unload(step.val.request, 0) && !unload(step.val.request, 1)) {
        return -Infinity;
      }
      if (duration.value <= req.deadline.value) {
        iadd(reward, req.value);
      }
      continue;
    }
    return -Infinity;
  }
  return reward.value - duration.value * COST_PER_SECOND;
}
function safeRouteScore(item, requestsById) {
  try {
    return routeScore(item, requestsById);
  } catch {
    return -Infinity;
  }
}
function insertRequestIntoItem(item, request, pickIndex, dropIndex, deck) {
  const pickup = {
    $: "pickup",
    val: { request: request.id, pos: request.startPoint, deck }
  };
  const deliver = {
    $: "deliver",
    val: { request: request.id, pos: request.endPoint }
  };
  const steps = [...item.steps];
  steps.splice(pickIndex, 0, pickup);
  steps.splice(dropIndex, 0, deliver);
  return { ...item, steps };
}
function removeRequestFromSchedule(schedule, requestId) {
  return schedule.map((item) => ({
    ...item,
    steps: item.steps.filter((step) => step.$ === "start" || step.val.request !== requestId)
  }));
}
function assignedRequestIds(schedule) {
  const ids = new Set;
  for (const item of schedule) {
    for (const step of item.steps) {
      if (step.$ === "pickup") {
        ids.add(step.val.request);
      }
    }
  }
  return ids;
}
function requestPriority(request) {
  try {
    const directTravel = getCost(request.startPoint, request.endPoint).value * COST_PER_SECOND;
    return request.value.value - directTravel - PICKUPCOST.value - UNLOADCOST.value;
  } catch {
    return -Infinity;
  }
}
function bestInsertion(schedule, request, requestsById) {
  let best = null;
  for (let itemIndex = 0;itemIndex < schedule.length; itemIndex++) {
    const item = schedule[itemIndex];
    const currentScore = safeRouteScore(item, requestsById);
    for (const deck of [0, 1]) {
      for (let pickIndex = 1;pickIndex <= item.steps.length; pickIndex++) {
        for (let dropIndex = pickIndex + 1;dropIndex <= item.steps.length + 1; dropIndex++) {
          const candidate = insertRequestIntoItem(item, request, pickIndex, dropIndex, deck);
          const candidateScore = safeRouteScore(candidate, requestsById);
          if (!Number.isFinite(candidateScore)) {
            continue;
          }
          const scoreDelta = candidateScore - currentScore;
          if (!best || scoreDelta > best.scoreDelta || scoreDelta === best.scoreDelta && itemIndex < best.itemIndex) {
            best = { itemIndex, pickIndex, dropIndex, deck, scoreDelta };
          }
        }
      }
    }
  }
  return best;
}
function applyInsertion(schedule, request, candidate) {
  return schedule.map((item, itemIndex) => itemIndex === candidate.itemIndex ? insertRequestIntoItem(item, request, candidate.pickIndex, candidate.dropIndex, candidate.deck) : item);
}
function improveByRelocation(schedule, requestsById) {
  let current = schedule;
  let currentScore = rateSchedule(current);
  const assigned = Array.from(assignedRequestIds(current));
  for (const requestId of assigned) {
    const request = requestsById.get(requestId);
    if (!request) {
      continue;
    }
    const reduced = removeRequestFromSchedule(current, requestId);
    const candidate = bestInsertion(reduced, request, requestsById);
    if (!candidate || candidate.scoreDelta <= 0) {
      continue;
    }
    const next = applyInsertion(reduced, request, candidate);
    const nextScore = rateSchedule(next);
    if (nextScore > currentScore) {
      current = next;
      currentScore = nextScore;
    }
  }
  return current;
}
function optimizeSchedule(requests, schedule) {
  const startedAt = Date.now();
  const requestsById = requestMap(requests);
  const assigned = assignedRequestIds(schedule);
  let current = schedule.map((item) => ({ ...item, steps: [...item.steps] }));
  const freeRequests = requests.filter((request) => !assigned.has(request.id)).sort((a2, b) => requestPriority(b) - requestPriority(a2));
  for (const request of freeRequests) {
    const candidate = bestInsertion(current, request, requestsById);
    if (candidate && candidate.scoreDelta > 0) {
      current = applyInsertion(current, request, candidate);
    }
  }
  current = improveByRelocation(current, requestsById);
  current = improveByRelocation(current, requestsById);
  optDur = Date.now() - startedAt;
  return current;
}
function rateSchedule(schedule) {
  const { requests } = getPlannerContext();
  const requestsById = requestMap(requests);
  let total = 0;
  for (const item of schedule) {
    const itemScore = safeRouteScore(item, requestsById);
    if (!Number.isFinite(itemScore)) {
      return -Infinity;
    }
    total += itemScore;
  }
  return total;
}

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
function mapView(roadmap) {
  let element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  element.setAttribute("width", "80%");
  element.setAttribute("height", "80%");
  element.setAttribute("viewBox", "0 0 1 1");
  let elements = new Map;
  let sources = new Map;
  for (let [id1, roads] of roadmap.roads) {
    for (let [id2, dist] of roads) {
      let a2 = roadmap.geolocation(id1);
      let b = roadmap.geolocation(id2);
      let line = mkSvg("line", a2.x, a2.y, b.x, b.y).el;
      let id = pairId(id1, id2);
      elements.set(id, line);
      sources.set(line, id);
      element.appendChild(line);
    }
  }
  for (let point of roadmap.roads.keys()) {
    let loc = roadmap.geolocation(point);
    let circle = mkSvg("circle", loc.x, loc.y).el;
    elements.set(point, circle);
    sources.set(circle, point);
    element.appendChild(circle);
  }
  let hints = [];
  hightLights.onupdate((nH, o) => {
    hints.forEach((el) => el.remove());
    for (let n of nH) {
      let last = null;
      for (let p3 of n.points) {
        let next = p3.location;
        if (last) {
          let path = findPath(last, next).path;
          for (let i = 0;i < path.length - 1; i++) {
            let A = roadmap.geolocation(path[i]);
            let B = roadmap.geolocation(path[i + 1]);
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
          let pos = roadmap.geolocation(p3.location);
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

// src/randomMap.ts
function randomMap() {
  let points = [];
  let roads = new Map;
  let geolocation = new Map;
  let geocodes = new Map;
  for (let i = 0;i < 100; i++) {
    let point = `loc${randomUUID()}`;
    points.push(point);
    geolocation.set(point, { x: random(), y: random() });
    geocodes.set(point, `DE ${geolocation.size.toString().padStart(4, "0")}`);
    roads.set(point, new Map);
  }
  for (let [ID, p3] of geolocation.entries()) {
    geolocation.entries().toArray().sort(([a2, A], [b, B]) => Math.hypot(A.x - p3.x, A.y - p3.y) - Math.hypot(B.x - p3.x, B.y - p3.y)).slice(1, 4).forEach(([id, loc]) => {
      let dist = uconst(Math.hypot(loc.x - p3.x, loc.y - p3.y) * 10 * 60 * 60, "seconds");
      roads.get(ID).set(id, dist);
      roads.get(id).set(ID, dist);
    });
  }
  return {
    roads,
    points,
    geolocation(loc) {
      let geo = geolocation.get(loc);
      if (!geo)
        throw new Error(`Location ${loc} not found`);
      return geo;
    },
    geoCode(loc) {
      let code = geocodes.get(loc);
      if (!code)
        throw new Error(`Location ${loc} not found`);
      return code;
    }
  };
}

// src/view/requestView.ts
function locString(loc) {
  return `\uD83D\uDCCD ${roadMap.geoCode(loc) ?? "UNK"}`;
}
function transporterString(tran) {
  return `\uD83D\uDE9B ${schedule.get().findIndex((s) => s.transporter == tran).toString().padStart(4, "0")}`;
}
function timeString(time) {
  return `${Math.floor(time.value / 60 / 60).toString().padStart(2, "0")}:${Math.floor(time.value / 60 % 60).toString().padStart(2, "0")}h`;
}
function priceString(price) {
  return `${price.value.toFixed(0)} €`;
}
function requestString(id) {
  let req = requests2.find((r) => r.id == id);
  if (!req)
    return "UNK";
  return `\uD83D\uDCE6 ${requests2.findIndex((x) => x.id == id).toString().padStart(4, "0")}`;
}
function requestView(requests3, schedule2) {
  let cell = (...x) => td(style({
    border: "1px solid var(--gray)",
    padding: ".3em .5em",
    cursor: "pointer",
    whiteSpace: "nowrap"
  }), ...x);
  return div(style({
    overflow: "auto",
    maxHeight: "80%"
  }), table(style({ borderCollapse: "collapse" }), tr(["request", "start", "end", "distanz", "preis", "frist"].map((h) => cell(h)), style({ fontWeight: "bold" })), requests3.map((r, i) => {
    let path = findPath(r.startPoint, r.endPoint);
    let row = tr(cell(requestString(r.id)), cell(locString(r.startPoint)), cell(locString(r.endPoint)), cell(span(timeString(path.dist), style({ float: "right" }))), cell(span(priceString(r.value), style({ float: "right" }))), cell(span(timeString(r.deadline), style({ float: "right" }))));
    row.onmouseenter = () => {
      row.style.backgroundColor = color.gray, hightLights.set([{ points: [
        { location: r.startPoint, logo: "\uD83D\uDCE6" },
        { location: r.endPoint, logo: "\uD83C\uDFE0" }
      ] }]);
    };
    row.onmouseleave = () => {
      row.style.backgroundColor = "";
    };
    return row;
  })));
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

// src/view/scheduleView.ts
function stepLogo(step) {
  if (step.$ == "start")
    return "\uD83D\uDE9B";
  if (step.$ == "pickup")
    return "\uD83D\uDCE6";
  if (step.$ == "deliver")
    return "\uD83C\uDFE0";
  throw new Error("unexpected tag:", step);
}
function getRequest(id) {
  let req = requests2.find((r) => r.id == id);
  if (!req)
    throw new Error(`not found request ${id}`);
  return req;
}
function stepRequest(step) {
  if (step.$ == "start")
    return;
  return getRequest(step.val.request);
}
function stepString(step) {
  if (step.$ == "start")
    return `start`;
  let req = getRequest(step.val.request);
  return `${step.$} ${requestString(step.val.request)}: ${priceString(req.value)} deadline ${timeString(req.deadline)}`;
}
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
var scheduleView = () => {
  let cell = (...x) => td(style({
    border: "1px solid var(--gray)",
    margin: "0",
    padding: ".3em .5em",
    cursor: "pointer",
    whiteSpace: "nowrap"
  }), ...x);
  const tabview = div();
  const rejectView = div();
  const stepview = div();
  let stepEls = [];
  let rowEls = [];
  let times = [];
  let decks = [];
  schedule.onupdate((sched) => {
    times = sched.map((s) => [uconst(0, "seconds")]);
    decks = sched.map((s) => [[[], []]]);
    cursor.onupdate((cursor2) => {
      let { row, col: n } = cursor2;
      let steps = sched[row].steps;
      let step = steps[n];
      if (!step)
        return;
      let request = step.$ == "start" ? undefined : step.val.request;
      stepEls.forEach((rowEls2, rown) => {
        rowEls2.forEach((el, i) => {
          let step2 = sched[rown].steps[i];
          if (!step2)
            return;
          let border2 = color.background;
          if (i == n && row == rown) {
            border2 = color.blue;
            viewStep(row, n, stepview, times[row][n], times[row][times[row].length - 1], decks[row][n]);
          } else if (step2.$ != "start" && step2.val.request == request)
            border2 = color.gray;
          el.style.borderColor = border2;
        });
      });
      let logo = stepLogo(step);
      hightLights.set([
        { points: steps.slice(n, n + 2).map((p3, i) => ({ location: p3.val.pos })), color: "#ffc988" },
        { points: [{ location: step.val.pos, logo }] }
      ]);
    }, true);
    tabview.replaceChildren(table(["transporter", "steps"].map((h) => cell(h)), style({ fontWeight: "bold" }), sched.map((s, rown) => {
      let allPoints = s.steps.map((step) => ({ location: step.val.pos, logo: stepLogo(step) }));
      let transport = span(transporterString(s.transporter));
      transport.onmouseenter = () => hightLights.set([{ points: allPoints, color: "#ffc988" }]);
      stepEls.push(s.steps.map((step, i) => {
        if (i > 0) {
          let prev = s.steps[i - 1];
          let dist = getCost(prev.val.pos, step.val.pos);
          times[rown].push(add(times[rown][i - 1], dist));
          let deck = [...decks[rown][i - 1]];
          if (step.$ == "pickup")
            deck[step.val.deck] = [...deck[step.val.deck], getRequest(step.val.request)];
          else if (step.$ == "deliver")
            deck = deck.map((d, j) => d.filter((r) => r.id != step.val.request));
          decks[rown].push(deck);
        }
        let time = times[rown][i];
        let req = stepRequest(step);
        let logo = stepLogo(step);
        let res = span(logo, style({
          padding: ".1em .1em",
          background: req && req.deadline.value < time.value ? color.red : "",
          border: "0.2em solid " + color.background,
          borderRadius: "0.3em"
        }));
        res.onclick = () => {
          console.log("CLICK", rown, i);
          cursor.set({ row: rown, col: i });
        };
        return res;
      }));
      let row = tr(cell(transport), cell(stepEls[rown]));
      rowEls.push(row);
      return row;
    }), style({ borderCollapse: "collapse" })));
    let rejects = requests2.filter((r) => !sched.flatMap((s) => s.steps).some((step) => step.$ != "start" && step.val.request == r.id));
    rejectView.replaceChildren(rejects.length == 0 ? span() : div(div(p("open requests", style({ fontWeight: "bold", padding: ".3em", margin: ".3em" })), rejects.map((r) => span(requestString(r.id), style({ padding: ".3em", margin: ".3em", whiteSpace: "nowrap" }))), style({
      display: "row",
      flexDirection: "column",
      padding: ".5em",
      marginTop: ".5em",
      border: "1px solid " + color.gray
    }))));
  });
  let value = span();
  schedule.onupdate((sch) => value.textContent = rateSchedule(sch).toFixed(2));
  let scheduleEl = div(style({
    width: "calc(100% - 2em)",
    height: "100%",
    overflow: "auto",
    minWidth: "0",
    padding: ".5em"
  }), tabview, rejectView, p("Value: ", value), p("search time:", optDur), stepview);
  return scheduleEl;
};
function viewStep(row, n, parent, dist, total, decks) {
  let steps = schedule.get()[row];
  if (!steps)
    return;
  let step = steps.steps[n];
  if (!step)
    return;
  let visual = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  visual.setAttribute("width", "100%");
  visual.setAttribute("viewBox", "-0.1 -0.1 1.2 1.2");
  visual.setAttribute("preserveAspectRatio", "xMidYMid meet");
  let transporter = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  let points = [[0.2, 0], [0, 0.2], [0, 0.4], [0.2, 0.4], [0.8, 0.4], [0.8, 0.37], [0.2, 0.37], [0.2, 0.2], [0.8, 0.2], [0.8, 0.17], [0.2, 0.17]];
  transporter.setAttribute("points", points.map((p3) => p3.join(",")).join(" "));
  transporter.setAttribute("fill", color.blue);
  visual.appendChild(transporter);
  decks.forEach((deck, i) => {
    deck.forEach((req, j) => {
      let car = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      car.setAttribute("x", (0.225 + 0.2 * j).toString());
      car.setAttribute("y", (0.25 - 0.2 * i).toString());
      car.setAttribute("width", ".15");
      car.setAttribute("height", "0.12");
      car.setAttribute("fill", color.gray);
      visual.appendChild(car);
      let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", (0.225 + 0.2 * j + 0.075).toString());
      text.setAttribute("y", (0.27 - 0.2 * i + 0.05).toString());
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", ".04");
      text.setAttribute("fill", color.color);
      text.textContent = `${requestString(req.id)}`;
      visual.appendChild(text);
    });
  });
  for (let x of [0.2, 0.6]) {
    let tire = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    tire.setAttribute("cx", x.toString());
    tire.setAttribute("cy", "0.5");
    tire.setAttribute("r", "0.07");
    tire.setAttribute("fill", color.blue);
    visual.appendChild(tire);
  }
  let dead = step.$ != "start" && getRequest(step.val.request).deadline.value < dist.value;
  let res = div(h2(transporterString(steps.transporter)), p(`${timeString(dist)} / ${timeString(total)}`), p(stepString(step), style({ color: dead ? color.red : color.color })), style({
    border: "1px solid var(--gray)",
    margin: "0",
    padding: ".3em .5em",
    minHeight: "2em"
  }));
  res.append(visual);
  parent.replaceChildren(res);
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
setRandSeed(25);
var roadMap = randomMap();
var requests2 = Array.from({ length: REQUEST_COUNT.get() }, (_, i) => ({
  id: randomUUID(),
  startPoint: randChoice(roadMap.points),
  endPoint: randChoice(roadMap.points),
  value: uconst(Math.floor(random() * 1000), "eur"),
  deadline: uconst(Math.floor(random() * 60 * 60 * 24 * 7), "seconds")
}));
var schedule = mkWritable(Array.from({ length: LKW_COUNT.get() }, (_, i) => ({
  transporter: randomUUID(),
  steps: [{ $: "start", val: { pos: randChoice(roadMap.points) } }]
})));
configurePlanner({ requests: requests2, roadMap });
schedule.update((sched) => optimizeSchedule(requests2, sched));
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
    ["map", mapView(roadMap)],
    ["requests", requestView(requests2, schedule.get())],
    ["schedule", scheduleView()],
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
contentSpace.replaceChildren(mkWindow(2), mkWindow());
export {
  schedule,
  roadMap,
  requests2 as requests,
  hightLights
};

//# debugId=2B859380A5C9A5C864756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvcmFuZG9tLnRzIiwgInNyYy9qc29uc2NoZW1hLnRzIiwgInNyYy9zY2hlbWEudHMiLCAic3JjL3R5cGVzLnRzIiwgInNyYy9wbGFubmVyLnRzIiwgInNyYy92aWV3L21hcFZpZXcudHMiLCAic3JjL3JhbmRvbU1hcC50cyIsICJzcmMvdmlldy9yZXF1ZXN0Vmlldy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy92aWV3L3NjaGVkdWxlVmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSgpe1xuICBsZXQgeCA9IE1hdGguc2luKFJBTkRTRUVEKyspICogMTAwMDA7XG4gIHJldHVybiB4IC0gTWF0aC5mbG9vcih4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRJbnQobWluOiBudW1iZXIsIG1heDogbnVtYmVyKXtcbiAgcmV0dXJuIE1hdGguZmxvb3IocmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoLTEpXSFcbn1cblxuXG4iLAogICAgInR5cGUgSnNvblZhbHVlID1cbiAgfCBzdHJpbmdcbiAgfCBudW1iZXJcbiAgfCBib29sZWFuXG4gIHwgbnVsbFxuICB8IHsgW2tleTogc3RyaW5nXTogSnNvblZhbHVlIH1cbiAgfCBKc29uVmFsdWVbXVxuXG50eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25WYWx1ZSB9XG5cbmNvbnN0IHR5cGVOYW1lID0gKHZhbHVlOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuY29uc3QgcGF0aExhYmVsID0gKHBhdGg6IHN0cmluZyk6IHN0cmluZyA9PiBwYXRoIHx8IFwiJFwiXG5cbmNvbnN0IGZhaWwgPSAocGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpOiBuZXZlciA9PiB7XG4gIHRocm93IG5ldyBFcnJvcihgVmFsaWRhdGlvbiBlcnJvciBhdCAke3BhdGhMYWJlbChwYXRoKX06ICR7bWVzc2FnZX1gKVxufVxuXG5jb25zdCBpc1BsYWluT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKVxuXG5jb25zdCBkZWVwRXF1YWwgPSAobGVmdDogdW5rbm93biwgcmlnaHQ6IHVua25vd24pOiBib29sZWFuID0+IHtcbiAgaWYgKE9iamVjdC5pcyhsZWZ0LCByaWdodCkpIHJldHVybiB0cnVlXG4gIGlmIChBcnJheS5pc0FycmF5KGxlZnQpICYmIEFycmF5LmlzQXJyYXkocmlnaHQpKSB7XG4gICAgcmV0dXJuIGxlZnQubGVuZ3RoID09PSByaWdodC5sZW5ndGggJiYgbGVmdC5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiBkZWVwRXF1YWwodmFsdWUsIHJpZ2h0W2luZGV4XSkpXG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QobGVmdCkgJiYgaXNQbGFpbk9iamVjdChyaWdodCkpIHtcbiAgICBjb25zdCBsZWZ0S2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpXG4gICAgY29uc3QgcmlnaHRLZXlzID0gT2JqZWN0LmtleXMocmlnaHQpXG4gICAgcmV0dXJuIGxlZnRLZXlzLmxlbmd0aCA9PT0gcmlnaHRLZXlzLmxlbmd0aFxuICAgICAgJiYgbGVmdEtleXMuZXZlcnkoa2V5ID0+IGtleSBpbiByaWdodCAmJiBkZWVwRXF1YWwobGVmdFtrZXldLCByaWdodFtrZXldKSlcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgYXBwZW5kUGF0aCA9IChwYXRoOiBzdHJpbmcsIHBhcnQ6IHN0cmluZyk6IHN0cmluZyA9PlxuICBwYXRoID8gYCR7cGF0aH0ke3BhcnR9YCA6IGAkJHtwYXJ0fWBcblxuY29uc3QgdmFsaWRhdGVPYmplY3QgPSAoc2NoZW1hOiBKU09OU2NoZW1hLCB2YWx1ZTogdW5rbm93biwgcGF0aDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIGlmICghaXNQbGFpbk9iamVjdCh2YWx1ZSkpIGZhaWwocGF0aCwgYGV4cGVjdGVkIG9iamVjdCwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IG9iamVjdFZhbHVlID0gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cblxuICBjb25zdCBwcm9wZXJ0aWVzID0gaXNQbGFpbk9iamVjdChzY2hlbWEucHJvcGVydGllcykgPyBzY2hlbWEucHJvcGVydGllcyA6IHt9XG4gIGNvbnN0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShzY2hlbWEucmVxdWlyZWQpID8gc2NoZW1hLnJlcXVpcmVkIDogW11cblxuICBmb3IgKGNvbnN0IGtleSBvZiByZXF1aXJlZCkge1xuICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSBjb250aW51ZVxuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGZhaWwoYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApLCBcImlzIHJlcXVpcmVkXCIpXG4gIH1cblxuICBmb3IgKGNvbnN0IFtrZXksIHByb3BlcnR5U2NoZW1hXSBvZiBPYmplY3QuZW50cmllcyhwcm9wZXJ0aWVzKSkge1xuICAgIGlmICghKGtleSBpbiBvYmplY3RWYWx1ZSkpIGNvbnRpbnVlXG4gICAgaWYgKCFpc1BsYWluT2JqZWN0KHByb3BlcnR5U2NoZW1hKSkgY29udGludWVcbiAgICB2YWxpZGF0ZUpzb25TY2hlbWEocHJvcGVydHlTY2hlbWEgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICB9XG5cbiAgY29uc3QgZXh0cmFLZXlzID0gT2JqZWN0LmtleXMob2JqZWN0VmFsdWUpLmZpbHRlcihrZXkgPT4gIShrZXkgaW4gcHJvcGVydGllcykpXG4gIGNvbnN0IGFkZGl0aW9uYWwgPSBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXNcbiAgaWYgKGFkZGl0aW9uYWwgPT09IGZhbHNlKSB7XG4gICAgaWYgKGV4dHJhS2V5cy5sZW5ndGggPiAwKSBmYWlsKGFwcGVuZFBhdGgocGF0aCwgYC4ke2V4dHJhS2V5c1swXX1gKSwgXCJhZGRpdGlvbmFsIHByb3BlcnRpZXMgYXJlIG5vdCBhbGxvd2VkXCIpXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoaXNQbGFpbk9iamVjdChhZGRpdGlvbmFsKSkge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIGV4dHJhS2V5cykge1xuICAgICAgdmFsaWRhdGVKc29uU2NoZW1hKGFkZGl0aW9uYWwgYXMgSlNPTlNjaGVtYSwgb2JqZWN0VmFsdWVba2V5XSwgYXBwZW5kUGF0aChwYXRoLCBgLiR7a2V5fWApKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2YWxpZGF0ZUFycmF5ID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBhcnJheSwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gIGNvbnN0IGFycmF5VmFsdWUgPSB2YWx1ZSBhcyB1bmtub3duW11cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjaGVtYS5pdGVtcykpIHJldHVyblxuICBhcnJheVZhbHVlLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB2YWxpZGF0ZUpzb25TY2hlbWEoc2NoZW1hLml0ZW1zIGFzIEpTT05TY2hlbWEsIGl0ZW0sIGFwcGVuZFBhdGgocGF0aCwgYFske2luZGV4fV1gKSkpXG59XG5cbmNvbnN0IHZhbGlkYXRlQnlUeXBlID0gKHNjaGVtYTogSlNPTlNjaGVtYSwgdmFsdWU6IHVua25vd24sIHBhdGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBzd2l0Y2ggKHNjaGVtYS50eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgc3RyaW5nLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwibnVtYmVyXCIgfHwgTnVtYmVyLmlzTmFOKHZhbHVlKSkgZmFpbChwYXRoLCBgZXhwZWN0ZWQgbnVtYmVyLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcImJvb2xlYW5cIikgZmFpbChwYXRoLCBgZXhwZWN0ZWQgYm9vbGVhbiwgZ290ICR7dHlwZU5hbWUodmFsdWUpfWApXG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwibnVsbFwiOlxuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSBmYWlsKHBhdGgsIGBleHBlY3RlZCBudWxsLCBnb3QgJHt0eXBlTmFtZSh2YWx1ZSl9YClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJhcnJheVwiOlxuICAgICAgdmFsaWRhdGVBcnJheShzY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgdmFsaWRhdGVPYmplY3Qoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgICAgIHJldHVyblxuICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIGZhaWwocGF0aCwgYHVuc3VwcG9ydGVkIHNjaGVtYSB0eXBlICR7SlNPTi5zdHJpbmdpZnkoc2NoZW1hLnR5cGUpfWApXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHZhbGlkYXRlSnNvblNjaGVtYSA9IDxUPihzY2hlbWE6IEpTT05TY2hlbWEsIHZhbHVlOiB1bmtub3duLCBwYXRoID0gXCJcIik6IFQgPT4ge1xuICBpZiAoXCJjb25zdFwiIGluIHNjaGVtYSAmJiAhZGVlcEVxdWFsKHZhbHVlLCBzY2hlbWEuY29uc3QpKSB7XG4gICAgZmFpbChwYXRoLCBgZXhwZWN0ZWQgY29uc3RhbnQgJHtKU09OLnN0cmluZ2lmeShzY2hlbWEuY29uc3QpfWApXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYW55T2YpKSB7XG4gICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFueU9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4ob3B0aW9uIGFzIEpTT05TY2hlbWEsIHZhbHVlLCBwYXRoKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKVxuICAgICAgfVxuICAgIH1cbiAgICBmYWlsKHBhdGgsIGVycm9yc1swXSA/PyBcImRpZCBub3QgbWF0Y2ggYW55IGFsbG93ZWQgc2NoZW1hXCIpXG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWEuYWxsT2YpKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2NoZW1hLmFsbE9mKSB7XG4gICAgICBpZiAoIWlzUGxhaW5PYmplY3Qob3B0aW9uKSkgY29udGludWVcbiAgICAgIHZhbGlkYXRlSnNvblNjaGVtYShvcHRpb24gYXMgSlNPTlNjaGVtYSwgdmFsdWUsIHBhdGgpXG4gICAgfVxuICB9XG5cbiAgdmFsaWRhdGVCeVR5cGUoc2NoZW1hLCB2YWx1ZSwgcGF0aClcbiAgcmV0dXJuIHZhbHVlIGFzIFRcbn1cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cblxuZXhwb3J0IHR5cGUgVVVJRCA9IGB1JHtzdHJpbmd9LSR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBVVUlEIDogU2NoZW1hPFVVSUQ+ID0gc3RyaW5nXG5cblxuZXhwb3J0IHR5cGUgVW5pdCA8cyBleHRlbmRzIHN0cmluZz4gPSB7dmFsdWU6IG51bWJlciwgdW5pdDogc31cbmV4cG9ydCBjb25zdCBVbml0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHVuaXQ6IHMpID0+IG9iamVjdCh7dmFsdWU6IG51bWJlciwgdW5pdDogY29uc3RhbnQodW5pdCl9KVxuXG5leHBvcnQgY29uc3QgdWNvbnN0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHZhbHVlOiBudW1iZXIsIHVuaXQ6IHMpIDogVW5pdDxzPiA9PiAoe3ZhbHVlLCB1bml0fSlcbmV4cG9ydCBjb25zdCBhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgOiBVbml0PHM+ID0+ICh7dmFsdWU6IGEudmFsdWUgKyBiLnZhbHVlLCB1bml0OiBhLnVuaXR9KVxuZXhwb3J0IGNvbnN0IGlhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgPT4ge2EudmFsdWUgKz0gYi52YWx1ZX1cblxuZXhwb3J0IGNvbnN0IHN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA6IFVuaXQ8cz4gPT4gKHt2YWx1ZTogYS52YWx1ZSAtIGIudmFsdWUsIHVuaXQ6IGEudW5pdH0pXG5leHBvcnQgY29uc3QgaXN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA9PiB7YS52YWx1ZSAtPSBiLnZhbHVlfVxuZXhwb3J0IGNvbnN0IG11bCA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBudW1iZXIpIDogVW5pdDxzPiA9PiAoe3ZhbHVlOiBhLnZhbHVlICogYiwgdW5pdDogYS51bml0fSlcblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5leHBvcnQgY29uc3QgUHJpY2UgPSBVbml0KFwiZXVyXCIpXG5leHBvcnQgY29uc3QgVGltZSA9IFVuaXQoXCJzZWNvbmRzXCIpXG5leHBvcnQgdHlwZSBQcmljZSA9IFVuaXQ8XCJldXJcIj5cbmV4cG9ydCB0eXBlIFRpbWUgPSBVbml0PFwic2Vjb25kc1wiPlxuXG5cbmV4cG9ydCB0eXBlIExvY2F0aW9uID0gYGxvYyR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBMb2NhdGlvbiA6IFNjaGVtYTxMb2NhdGlvbj4gPSBzdHJpbmdcblxuZXhwb3J0IGNvbnN0IFJlcXVlc3QgPSBvYmplY3Qoe1xuICBpZDogVVVJRCxcbiAgc3RhcnRQb2ludDogTG9jYXRpb24sXG4gIGVuZFBvaW50OiBMb2NhdGlvbixcbiAgdmFsdWU6IFByaWNlLFxuICBkZWFkbGluZTogVGltZSxcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IExvY2F0aW9uLCBkZWNrOiB1bmlvbihjb25zdGFudCgwKSwgY29uc3RhbnQoMSkpfSksXG4gIGRlbGl2ZXI6IG9iamVjdCh7cmVxdWVzdDogVVVJRCwgcG9zOiBMb2NhdGlvbn0pLFxuICBzdGFydDogb2JqZWN0KHtwb3M6IExvY2F0aW9ufSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cbmV4cG9ydCBjb25zdCBNb2R1bGUgPSBvYmplY3Qoe1xuXG4gIHJlcXVlc3RzOiBhcnJheShSZXF1ZXN0KSxcbiAgdHJhbnNwb3J0ZXJzOiBhcnJheShUcmFuc3BvcnRlciksXG4gIHNjaGVkdWxlOiBTY2hlZHVsZSxcblxufSlcblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG4iLAogICAgImltcG9ydCB7IFRpbWUsIGFkZCwgaWFkZCwgaXN1YiwgbXVsLCB1Y29uc3QsIHR5cGUgTG9jYXRpb24sIHR5cGUgUmVxdWVzdCwgdHlwZSBTY2hlZHVsZSwgdHlwZSBTY2hlZHVsZUl0ZW0sIHR5cGUgU2NoZWR1bGVTdGVwLCB0eXBlIFVVSUQgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBSb2FkTWFwIH0gZnJvbSBcIi4vcmFuZG9tTWFwXCI7XG5cbmNvbnN0IERFQ0tDQVBBQ0lUWSA9IDM7XG5jb25zdCBVTkxPQURDT1NUID0gdWNvbnN0KDEwLCBcImV1clwiKTtcbmNvbnN0IFBJQ0tVUENPU1QgPSB1Y29uc3QoNSwgXCJldXJcIik7XG5jb25zdCBDT1NUX1BFUl9IID0gMjA7XG5jb25zdCBDT1NUX1BFUl9TRUNPTkQgPSBDT1NUX1BFUl9IIC8gMzYwMDtcblxudHlwZSBQbGFubmVyQ29udGV4dCA9IHtcbiAgcmVxdWVzdHM6IFJlcXVlc3RbXTtcbiAgcm9hZE1hcDogUm9hZE1hcDtcbn07XG5cbnR5cGUgSW5zZXJ0aW9uQ2FuZGlkYXRlID0ge1xuICBpdGVtSW5kZXg6IG51bWJlcjtcbiAgcGlja0luZGV4OiBudW1iZXI7XG4gIGRyb3BJbmRleDogbnVtYmVyO1xuICBkZWNrOiAwIHwgMTtcbiAgc2NvcmVEZWx0YTogbnVtYmVyO1xufTtcblxubGV0IHBsYW5uZXJDb250ZXh0OiBQbGFubmVyQ29udGV4dCB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlUGxhbm5lcihjb250ZXh0OiBQbGFubmVyQ29udGV4dCkge1xuICBwbGFubmVyQ29udGV4dCA9IGNvbnRleHQ7XG4gIENvc3RNYXRyaXguY2xlYXIoKTtcbn1cblxuZnVuY3Rpb24gZ2V0UGxhbm5lckNvbnRleHQoKTogUGxhbm5lckNvbnRleHQge1xuICBpZiAoIXBsYW5uZXJDb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUGxhbm5lciBjb250ZXh0IGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICB9XG4gIHJldHVybiBwbGFubmVyQ29udGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhaXJJZChhOiBzdHJpbmcsIGI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBhIDwgYiA/IGAke2F9LSR7Yn1gIDogYCR7Yn0tJHthfWA7XG59XG5cbmNvbnN0IENvc3RNYXRyaXggPSBuZXcgTWFwPHN0cmluZywgVGltZT4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRQYXRoKHN0YXJ0OiBMb2NhdGlvbiwgZW5kOiBMb2NhdGlvbik6IHsgcGF0aDogTG9jYXRpb25bXTsgZGlzdDogVGltZSB9IHtcbiAgY29uc3QgeyByb2FkTWFwIH0gPSBnZXRQbGFubmVyQ29udGV4dCgpO1xuICBjb25zdCBpZCA9IHBhaXJJZChzdGFydCwgZW5kKTtcblxuICBpZiAoc3RhcnQgPT09IGVuZCkge1xuICAgIGNvbnN0IGRpc3QgPSB1Y29uc3QoMCwgXCJzZWNvbmRzXCIpO1xuICAgIENvc3RNYXRyaXguc2V0KGlkLCBkaXN0KTtcbiAgICByZXR1cm4geyBwYXRoOiBbc3RhcnRdLCBkaXN0IH07XG4gIH1cblxuICBjb25zdCBkaXN0ID0gbmV3IE1hcDxMb2NhdGlvbiwgVGltZT4oKTtcbiAgY29uc3QgcHJldiA9IG5ldyBNYXA8TG9jYXRpb24sIExvY2F0aW9uIHwgbnVsbD4oKTtcbiAgY29uc3QgdW52aXNpdGVkID0gbmV3IFNldDxMb2NhdGlvbj4ocm9hZE1hcC5wb2ludHMpO1xuXG4gIGZvciAoY29uc3QgcG9pbnQgb2Ygcm9hZE1hcC5wb2ludHMpIHtcbiAgICBkaXN0LnNldChwb2ludCwgdWNvbnN0KEluZmluaXR5LCBcInNlY29uZHNcIikpO1xuICAgIHByZXYuc2V0KHBvaW50LCBudWxsKTtcbiAgfVxuXG4gIGRpc3Quc2V0KHN0YXJ0LCB1Y29uc3QoMCwgXCJzZWNvbmRzXCIpKTtcblxuICB3aGlsZSAodW52aXNpdGVkLnNpemUgPiAwKSB7XG4gICAgbGV0IGN1cnJlbnQ6IExvY2F0aW9uIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGN1cnJlbnREaXN0ID0gSW5maW5pdHk7XG5cbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIHVudmlzaXRlZCkge1xuICAgICAgY29uc3QgcG9pbnREaXN0ID0gZGlzdC5nZXQocG9pbnQpIS52YWx1ZTtcbiAgICAgIGlmIChwb2ludERpc3QgPCBjdXJyZW50RGlzdCkge1xuICAgICAgICBjdXJyZW50ID0gcG9pbnQ7XG4gICAgICAgIGN1cnJlbnREaXN0ID0gcG9pbnREaXN0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjdXJyZW50ID09IG51bGwgfHwgY3VycmVudERpc3QgPT09IEluZmluaXR5KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB1bnZpc2l0ZWQuZGVsZXRlKGN1cnJlbnQpO1xuXG4gICAgaWYgKGN1cnJlbnQgPT09IGVuZCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBbbmV4dCwgc2VnbWVudF0gb2Ygcm9hZE1hcC5yb2Fkcy5nZXQoY3VycmVudCkgPz8gW10pIHtcbiAgICAgIGlmICghdW52aXNpdGVkLmhhcyhuZXh0KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGFkZChkaXN0LmdldChjdXJyZW50KSEsIHNlZ21lbnQpO1xuICAgICAgaWYgKGNhbmRpZGF0ZS52YWx1ZSA8IGRpc3QuZ2V0KG5leHQpIS52YWx1ZSkge1xuICAgICAgICBkaXN0LnNldChuZXh0LCBjYW5kaWRhdGUpO1xuICAgICAgICBwcmV2LnNldChuZXh0LCBjdXJyZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCB0b3RhbERpc3QgPSBkaXN0LmdldChlbmQpO1xuICBpZiAoIXRvdGFsRGlzdCB8fCB0b3RhbERpc3QudmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyBwYXRoIGZvdW5kIGZyb20gJHtzdGFydH0gdG8gJHtlbmR9YCk7XG4gIH1cblxuICBjb25zdCBwYXRoOiBMb2NhdGlvbltdID0gW107XG4gIGxldCBjdXJzb3I6IExvY2F0aW9uIHwgbnVsbCA9IGVuZDtcbiAgd2hpbGUgKGN1cnNvciAhPSBudWxsKSB7XG4gICAgcGF0aC5wdXNoKGN1cnNvcik7XG4gICAgY3Vyc29yID0gcHJldi5nZXQoY3Vyc29yKSA/PyBudWxsO1xuICB9XG4gIHBhdGgucmV2ZXJzZSgpO1xuXG4gIENvc3RNYXRyaXguc2V0KGlkLCB0b3RhbERpc3QpO1xuICByZXR1cm4geyBwYXRoLCBkaXN0OiB0b3RhbERpc3QgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvc3Qoc3RhcnQ6IExvY2F0aW9uLCBlbmQ6IExvY2F0aW9uKTogVGltZSB7XG4gIGNvbnN0IGlkID0gcGFpcklkKHN0YXJ0LCBlbmQpO1xuICBpZiAoIUNvc3RNYXRyaXguaGFzKGlkKSkge1xuICAgIGZpbmRQYXRoKHN0YXJ0LCBlbmQpO1xuICB9XG4gIHJldHVybiBDb3N0TWF0cml4LmdldChpZCkhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29zdE4oLi4ucG9pbnRzOiBMb2NhdGlvbltdKTogVGltZSB7XG4gIGNvbnN0IGNvc3QgPSB1Y29uc3QoMCwgXCJzZWNvbmRzXCIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBpYWRkKGNvc3QsIGdldENvc3QocG9pbnRzW2ldISwgcG9pbnRzW2kgKyAxXSEpKTtcbiAgfVxuICByZXR1cm4gY29zdDtcbn1cblxuZXhwb3J0IGxldCBvcHREdXIgPSAwO1xuXG5mdW5jdGlvbiByZXF1ZXN0TWFwKHJlcXVlc3RzOiBSZXF1ZXN0W10pOiBNYXA8VVVJRCwgUmVxdWVzdD4ge1xuICByZXR1cm4gbmV3IE1hcChyZXF1ZXN0cy5tYXAoKHJlcXVlc3QpID0+IFtyZXF1ZXN0LmlkLCByZXF1ZXN0XSkpO1xufVxuXG5mdW5jdGlvbiByb3V0ZVNjb3JlKGl0ZW06IFNjaGVkdWxlSXRlbSwgcmVxdWVzdHNCeUlkOiBNYXA8VVVJRCwgUmVxdWVzdD4pOiBudW1iZXIge1xuICBpZiAoaXRlbS5zdGVwc1swXT8uJCAhPT0gXCJzdGFydFwiKSB7XG4gICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgfVxuXG4gIGNvbnN0IHJld2FyZCA9IHVjb25zdCgwLCBcImV1clwiKTtcbiAgY29uc3QgZHVyYXRpb24gPSB1Y29uc3QoMCwgXCJzZWNvbmRzXCIpO1xuICBjb25zdCBkZWNrczogW1VVSURbXSwgVVVJRFtdXSA9IFtbXSwgW11dO1xuXG4gIGZ1bmN0aW9uIHVubG9hZChyZXFJZDogVVVJRCwgZGVjazogMCB8IDEpOiBib29sZWFuIHtcbiAgICBjb25zdCBpZHggPSBkZWNrc1tkZWNrXS5pbmRleE9mKHJlcUlkKTtcbiAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBhZnRlciA9IGRlY2tzW2RlY2tdLnNsaWNlKGlkeCArIDEpO1xuICAgIGRlY2tzW2RlY2tdID0gZGVja3NbZGVja10uc2xpY2UoMCwgaWR4KS5jb25jYXQoYWZ0ZXIpO1xuICAgIGlzdWIocmV3YXJkLCBVTkxPQURDT1NUKTtcbiAgICBpc3ViKHJld2FyZCwgbXVsKGFkZChVTkxPQURDT1NULCBQSUNLVVBDT1NUKSwgYWZ0ZXIubGVuZ3RoKSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmb3IgKGxldCBpID0gMTsgaSA8IGl0ZW0uc3RlcHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcmV2ID0gaXRlbS5zdGVwc1tpIC0gMV0hO1xuICAgIGNvbnN0IHN0ZXAgPSBpdGVtLnN0ZXBzW2ldITtcblxuICAgIGlhZGQoZHVyYXRpb24sIGdldENvc3QocHJldi52YWwucG9zLCBzdGVwLnZhbC5wb3MpKTtcblxuICAgIGlmIChzdGVwLiQgPT09IFwicGlja3VwXCIpIHtcbiAgICAgIGRlY2tzW3N0ZXAudmFsLmRlY2tdLnB1c2goc3RlcC52YWwucmVxdWVzdCk7XG4gICAgICBpZiAoZGVja3Nbc3RlcC52YWwuZGVja10ubGVuZ3RoID4gREVDS0NBUEFDSVRZKSB7XG4gICAgICAgIHJldHVybiAtSW5maW5pdHk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc3RlcC4kID09PSBcImRlbGl2ZXJcIikge1xuICAgICAgY29uc3QgcmVxID0gcmVxdWVzdHNCeUlkLmdldChzdGVwLnZhbC5yZXF1ZXN0KTtcbiAgICAgIGlmICghcmVxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgbm90IGZvdW5kIHJlcXVlc3Q6ICR7c3RlcC52YWwucmVxdWVzdH1gKTtcbiAgICAgIH1cbiAgICAgIGlmICghdW5sb2FkKHN0ZXAudmFsLnJlcXVlc3QsIDApICYmICF1bmxvYWQoc3RlcC52YWwucmVxdWVzdCwgMSkpIHtcbiAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICAgIH1cbiAgICAgIGlmIChkdXJhdGlvbi52YWx1ZSA8PSByZXEuZGVhZGxpbmUudmFsdWUpIHtcbiAgICAgICAgaWFkZChyZXdhcmQsIHJlcS52YWx1ZSk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gLUluZmluaXR5O1xuICB9XG5cbiAgcmV0dXJuIHJld2FyZC52YWx1ZSAtIGR1cmF0aW9uLnZhbHVlICogQ09TVF9QRVJfU0VDT05EO1xufVxuXG5mdW5jdGlvbiBzYWZlUm91dGVTY29yZShpdGVtOiBTY2hlZHVsZUl0ZW0sIHJlcXVlc3RzQnlJZDogTWFwPFVVSUQsIFJlcXVlc3Q+KTogbnVtYmVyIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcm91dGVTY29yZShpdGVtLCByZXF1ZXN0c0J5SWQpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gLUluZmluaXR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGluc2VydFJlcXVlc3RJbnRvSXRlbShcbiAgaXRlbTogU2NoZWR1bGVJdGVtLFxuICByZXF1ZXN0OiBSZXF1ZXN0LFxuICBwaWNrSW5kZXg6IG51bWJlcixcbiAgZHJvcEluZGV4OiBudW1iZXIsXG4gIGRlY2s6IDAgfCAxLFxuKTogU2NoZWR1bGVJdGVtIHtcbiAgY29uc3QgcGlja3VwOiBTY2hlZHVsZVN0ZXAgPSB7XG4gICAgJDogXCJwaWNrdXBcIixcbiAgICB2YWw6IHsgcmVxdWVzdDogcmVxdWVzdC5pZCwgcG9zOiByZXF1ZXN0LnN0YXJ0UG9pbnQsIGRlY2sgfSxcbiAgfTtcbiAgY29uc3QgZGVsaXZlcjogU2NoZWR1bGVTdGVwID0ge1xuICAgICQ6IFwiZGVsaXZlclwiLFxuICAgIHZhbDogeyByZXF1ZXN0OiByZXF1ZXN0LmlkLCBwb3M6IHJlcXVlc3QuZW5kUG9pbnQgfSxcbiAgfTtcblxuICBjb25zdCBzdGVwcyA9IFsuLi5pdGVtLnN0ZXBzXTtcbiAgc3RlcHMuc3BsaWNlKHBpY2tJbmRleCwgMCwgcGlja3VwKTtcbiAgc3RlcHMuc3BsaWNlKGRyb3BJbmRleCwgMCwgZGVsaXZlcik7XG4gIHJldHVybiB7IC4uLml0ZW0sIHN0ZXBzIH07XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJlcXVlc3RGcm9tU2NoZWR1bGUoc2NoZWR1bGU6IFNjaGVkdWxlLCByZXF1ZXN0SWQ6IFVVSUQpOiBTY2hlZHVsZSB7XG4gIHJldHVybiBzY2hlZHVsZS5tYXAoKGl0ZW0pID0+ICh7XG4gICAgLi4uaXRlbSxcbiAgICBzdGVwczogaXRlbS5zdGVwcy5maWx0ZXIoKHN0ZXApID0+IHN0ZXAuJCA9PT0gXCJzdGFydFwiIHx8IHN0ZXAudmFsLnJlcXVlc3QgIT09IHJlcXVlc3RJZCksXG4gIH0pKTtcbn1cblxuZnVuY3Rpb24gYXNzaWduZWRSZXF1ZXN0SWRzKHNjaGVkdWxlOiBTY2hlZHVsZSk6IFNldDxVVUlEPiB7XG4gIGNvbnN0IGlkcyA9IG5ldyBTZXQ8VVVJRD4oKTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIHNjaGVkdWxlKSB7XG4gICAgZm9yIChjb25zdCBzdGVwIG9mIGl0ZW0uc3RlcHMpIHtcbiAgICAgIGlmIChzdGVwLiQgPT09IFwicGlja3VwXCIpIHtcbiAgICAgICAgaWRzLmFkZChzdGVwLnZhbC5yZXF1ZXN0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGlkcztcbn1cblxuZnVuY3Rpb24gcmVxdWVzdFByaW9yaXR5KHJlcXVlc3Q6IFJlcXVlc3QpOiBudW1iZXIge1xuICB0cnkge1xuICAgIGNvbnN0IGRpcmVjdFRyYXZlbCA9IGdldENvc3QocmVxdWVzdC5zdGFydFBvaW50LCByZXF1ZXN0LmVuZFBvaW50KS52YWx1ZSAqIENPU1RfUEVSX1NFQ09ORDtcbiAgICByZXR1cm4gcmVxdWVzdC52YWx1ZS52YWx1ZSAtIGRpcmVjdFRyYXZlbCAtIFBJQ0tVUENPU1QudmFsdWUgLSBVTkxPQURDT1NULnZhbHVlO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gLUluZmluaXR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGJlc3RJbnNlcnRpb24oc2NoZWR1bGU6IFNjaGVkdWxlLCByZXF1ZXN0OiBSZXF1ZXN0LCByZXF1ZXN0c0J5SWQ6IE1hcDxVVUlELCBSZXF1ZXN0Pik6IEluc2VydGlvbkNhbmRpZGF0ZSB8IG51bGwge1xuICBsZXQgYmVzdDogSW5zZXJ0aW9uQ2FuZGlkYXRlIHwgbnVsbCA9IG51bGw7XG5cbiAgZm9yIChsZXQgaXRlbUluZGV4ID0gMDsgaXRlbUluZGV4IDwgc2NoZWR1bGUubGVuZ3RoOyBpdGVtSW5kZXgrKykge1xuICAgIGNvbnN0IGl0ZW0gPSBzY2hlZHVsZVtpdGVtSW5kZXhdITtcbiAgICBjb25zdCBjdXJyZW50U2NvcmUgPSBzYWZlUm91dGVTY29yZShpdGVtLCByZXF1ZXN0c0J5SWQpO1xuXG4gICAgZm9yIChjb25zdCBkZWNrIG9mIFswLCAxXSBhcyBjb25zdCkge1xuICAgICAgZm9yIChsZXQgcGlja0luZGV4ID0gMTsgcGlja0luZGV4IDw9IGl0ZW0uc3RlcHMubGVuZ3RoOyBwaWNrSW5kZXgrKykge1xuICAgICAgICBmb3IgKGxldCBkcm9wSW5kZXggPSBwaWNrSW5kZXggKyAxOyBkcm9wSW5kZXggPD0gaXRlbS5zdGVwcy5sZW5ndGggKyAxOyBkcm9wSW5kZXgrKykge1xuICAgICAgICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGluc2VydFJlcXVlc3RJbnRvSXRlbShpdGVtLCByZXF1ZXN0LCBwaWNrSW5kZXgsIGRyb3BJbmRleCwgZGVjayk7XG4gICAgICAgICAgY29uc3QgY2FuZGlkYXRlU2NvcmUgPSBzYWZlUm91dGVTY29yZShjYW5kaWRhdGUsIHJlcXVlc3RzQnlJZCk7XG4gICAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoY2FuZGlkYXRlU2NvcmUpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzY29yZURlbHRhID0gY2FuZGlkYXRlU2NvcmUgLSBjdXJyZW50U2NvcmU7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWJlc3QgfHxcbiAgICAgICAgICAgIHNjb3JlRGVsdGEgPiBiZXN0LnNjb3JlRGVsdGEgfHxcbiAgICAgICAgICAgIChzY29yZURlbHRhID09PSBiZXN0LnNjb3JlRGVsdGEgJiYgaXRlbUluZGV4IDwgYmVzdC5pdGVtSW5kZXgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBiZXN0ID0geyBpdGVtSW5kZXgsIHBpY2tJbmRleCwgZHJvcEluZGV4LCBkZWNrLCBzY29yZURlbHRhIH07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJlc3Q7XG59XG5cbmZ1bmN0aW9uIGFwcGx5SW5zZXJ0aW9uKHNjaGVkdWxlOiBTY2hlZHVsZSwgcmVxdWVzdDogUmVxdWVzdCwgY2FuZGlkYXRlOiBJbnNlcnRpb25DYW5kaWRhdGUpOiBTY2hlZHVsZSB7XG4gIHJldHVybiBzY2hlZHVsZS5tYXAoKGl0ZW0sIGl0ZW1JbmRleCkgPT5cbiAgICBpdGVtSW5kZXggPT09IGNhbmRpZGF0ZS5pdGVtSW5kZXhcbiAgICAgID8gaW5zZXJ0UmVxdWVzdEludG9JdGVtKGl0ZW0sIHJlcXVlc3QsIGNhbmRpZGF0ZS5waWNrSW5kZXgsIGNhbmRpZGF0ZS5kcm9wSW5kZXgsIGNhbmRpZGF0ZS5kZWNrKVxuICAgICAgOiBpdGVtLFxuICApO1xufVxuXG5mdW5jdGlvbiBpbXByb3ZlQnlSZWxvY2F0aW9uKHNjaGVkdWxlOiBTY2hlZHVsZSwgcmVxdWVzdHNCeUlkOiBNYXA8VVVJRCwgUmVxdWVzdD4pOiBTY2hlZHVsZSB7XG4gIGxldCBjdXJyZW50ID0gc2NoZWR1bGU7XG4gIGxldCBjdXJyZW50U2NvcmUgPSByYXRlU2NoZWR1bGUoY3VycmVudCk7XG4gIGNvbnN0IGFzc2lnbmVkID0gQXJyYXkuZnJvbShhc3NpZ25lZFJlcXVlc3RJZHMoY3VycmVudCkpO1xuXG4gIGZvciAoY29uc3QgcmVxdWVzdElkIG9mIGFzc2lnbmVkKSB7XG4gICAgY29uc3QgcmVxdWVzdCA9IHJlcXVlc3RzQnlJZC5nZXQocmVxdWVzdElkKTtcbiAgICBpZiAoIXJlcXVlc3QpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHJlZHVjZWQgPSByZW1vdmVSZXF1ZXN0RnJvbVNjaGVkdWxlKGN1cnJlbnQsIHJlcXVlc3RJZCk7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gYmVzdEluc2VydGlvbihyZWR1Y2VkLCByZXF1ZXN0LCByZXF1ZXN0c0J5SWQpO1xuICAgIGlmICghY2FuZGlkYXRlIHx8IGNhbmRpZGF0ZS5zY29yZURlbHRhIDw9IDApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IG5leHQgPSBhcHBseUluc2VydGlvbihyZWR1Y2VkLCByZXF1ZXN0LCBjYW5kaWRhdGUpO1xuICAgIGNvbnN0IG5leHRTY29yZSA9IHJhdGVTY2hlZHVsZShuZXh0KTtcbiAgICBpZiAobmV4dFNjb3JlID4gY3VycmVudFNjb3JlKSB7XG4gICAgICBjdXJyZW50ID0gbmV4dDtcbiAgICAgIGN1cnJlbnRTY29yZSA9IG5leHRTY29yZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3VycmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9wdGltaXplU2NoZWR1bGUocmVxdWVzdHM6IFJlcXVlc3RbXSwgc2NoZWR1bGU6IFNjaGVkdWxlKTogU2NoZWR1bGUge1xuICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICBjb25zdCByZXF1ZXN0c0J5SWQgPSByZXF1ZXN0TWFwKHJlcXVlc3RzKTtcbiAgY29uc3QgYXNzaWduZWQgPSBhc3NpZ25lZFJlcXVlc3RJZHMoc2NoZWR1bGUpO1xuXG4gIGxldCBjdXJyZW50ID0gc2NoZWR1bGUubWFwKChpdGVtKSA9PiAoeyAuLi5pdGVtLCBzdGVwczogWy4uLml0ZW0uc3RlcHNdIH0pKTtcblxuICBjb25zdCBmcmVlUmVxdWVzdHMgPSByZXF1ZXN0c1xuICAgIC5maWx0ZXIoKHJlcXVlc3QpID0+ICFhc3NpZ25lZC5oYXMocmVxdWVzdC5pZCkpXG4gICAgLnNvcnQoKGEsIGIpID0+IHJlcXVlc3RQcmlvcml0eShiKSAtIHJlcXVlc3RQcmlvcml0eShhKSk7XG5cbiAgZm9yIChjb25zdCByZXF1ZXN0IG9mIGZyZWVSZXF1ZXN0cykge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGJlc3RJbnNlcnRpb24oY3VycmVudCwgcmVxdWVzdCwgcmVxdWVzdHNCeUlkKTtcbiAgICBpZiAoY2FuZGlkYXRlICYmIGNhbmRpZGF0ZS5zY29yZURlbHRhID4gMCkge1xuICAgICAgY3VycmVudCA9IGFwcGx5SW5zZXJ0aW9uKGN1cnJlbnQsIHJlcXVlc3QsIGNhbmRpZGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgY3VycmVudCA9IGltcHJvdmVCeVJlbG9jYXRpb24oY3VycmVudCwgcmVxdWVzdHNCeUlkKTtcbiAgY3VycmVudCA9IGltcHJvdmVCeVJlbG9jYXRpb24oY3VycmVudCwgcmVxdWVzdHNCeUlkKTtcblxuICBvcHREdXIgPSBEYXRlLm5vdygpIC0gc3RhcnRlZEF0O1xuICByZXR1cm4gY3VycmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhdGVTY2hlZHVsZShzY2hlZHVsZTogU2NoZWR1bGUpOiBudW1iZXIge1xuICBjb25zdCB7IHJlcXVlc3RzIH0gPSBnZXRQbGFubmVyQ29udGV4dCgpO1xuICBjb25zdCByZXF1ZXN0c0J5SWQgPSByZXF1ZXN0TWFwKHJlcXVlc3RzKTtcblxuICBsZXQgdG90YWwgPSAwO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2NoZWR1bGUpIHtcbiAgICBjb25zdCBpdGVtU2NvcmUgPSBzYWZlUm91dGVTY29yZShpdGVtLCByZXF1ZXN0c0J5SWQpO1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKGl0ZW1TY29yZSkpIHtcbiAgICAgIHJldHVybiAtSW5maW5pdHk7XG4gICAgfVxuICAgIHRvdGFsICs9IGl0ZW1TY29yZTtcbiAgfVxuICByZXR1cm4gdG90YWw7XG59XG4iLAogICAgIlxuaW1wb3J0IHR5cGUgeyBMb2NhdGlvbiwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZmluZFBhdGgsIHBhaXJJZCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgZGl2LCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzLCByZXF1ZXN0cywgdHlwZSBIaWdoTGlnaHQgfSBmcm9tIFwiLi9tYWluXCI7XG5cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiwgeDogbnVtYmVyLCB5OiBudW1iZXIpIDoge2VsOiBTVkdDaXJjbGVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJsaW5lXCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIpIDoge2VsOiBTVkdMaW5lRWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwidGV4dFwiLCB4OiBudW1iZXIsIHk6IG51bWJlciwgczogc3RyaW5nKSA6IHtlbDogU1ZHVGV4dEVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwiY2lyY2xlXCIgfCBcImxpbmVcIiB8IFwidGV4dFwiLCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4Mj86IG51bWJlciB8IHN0cmluZywgeTI/OiBudW1iZXIpe1xuICBsZXQgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCB0YWcpXG4gIGlmICh0YWcgPT0gXCJjaXJjbGVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiY3hcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAxXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4ge1xuICAgICAgZWwsXG4gICAgICBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcImxpbmVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDFcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5MVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcIngyXCIsIHgyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkyXCIsIHkyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZVwiLCBcImdyYXlcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAwNVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0YWcgPT0gXCJ0ZXh0XCIpe1xuICAgIGVsLnNldEF0dHJpYnV0ZShcInhcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcblxuICAgIFxuICAgIGVsLnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgZWwudGV4dENvbnRlbnQgPSBTdHJpbmcoeDIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiMC4wM1wiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgXCJncmF5XCIpXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3IChyb2FkbWFwOiBSb2FkTWFwICkgOiBIVE1MRWxlbWVudCB7XG5cblxuICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpXG5cbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCIwIDAgMSAxXCIpXG5cbiAgbGV0IGVsZW1lbnRzID0gbmV3IE1hcDxhbnksIFNWR0VsZW1lbnQ+KClcbiAgbGV0IHNvdXJjZXMgPSBuZXcgTWFwPFNWR0VsZW1lbnQsIGFueT4oKVxuICBcbiAgZm9yIChsZXQgW2lkMSwgcm9hZHNdIG9mIHJvYWRtYXAucm9hZHMpe1xuICAgIGZvciAobGV0IFtpZDIsIGRpc3RdIG9mIHJvYWRzKXtcbiAgICAgIGxldCBhID0gcm9hZG1hcC5nZW9sb2NhdGlvbiggaWQxKSFcbiAgICAgIGxldCBiID0gcm9hZG1hcC5nZW9sb2NhdGlvbiggaWQyKSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueCwgYS55LCBiLngsIGIueSkuZWxcbiAgICAgIGxldCBpZCA9IHBhaXJJZChpZDEsIGlkMilcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgcG9pbnQgb2Ygcm9hZG1hcC5yb2Fkcy5rZXlzKCkpe1xuICAgIGxldCBsb2MgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHBvaW50KVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueCwgbG9jLnkpLmVsXG4gICAgZWxlbWVudHMuc2V0KHBvaW50LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCBwb2ludClcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNpcmNsZSlcbiAgfVxuXG4gIGxldCBoaW50czoge3JlbW92ZTooKT0+dm9pZH1bXSA9IFtdXG5cbiAgaGlnaHRMaWdodHMub251cGRhdGUoKG5ILG8pPT57XG4gICAgaGludHMuZm9yRWFjaChlbD0+ZWwucmVtb3ZlKCkpXG4gICAgZm9yIChsZXQgbiBvZiBuSCl7XG4gICAgICBsZXQgbGFzdCA6IExvY2F0aW9uIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubG9jYXRpb25cbiAgICAgICAgaWYgKGxhc3Qpe1xuICAgICAgICAgIGxldCBwYXRoID0gZmluZFBhdGgobGFzdCwgbmV4dCkucGF0aFxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGggLSAxOyBpKyspe1xuICAgICAgICAgICAgbGV0IEEgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHBhdGhbaV0hKSFcbiAgICAgICAgICAgIGxldCBCID0gcm9hZG1hcC5nZW9sb2NhdGlvbihwYXRoW2krMV0hKSFcbiAgICAgICAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueCwgQS55LCBCLngsIEIueSlcbiAgICAgICAgICAgIGxpbmUuc2V0Q29sb3Iobi5jb2xvciA/PyBcIiNmZmM5ODhcIilcbiAgICAgICAgICAgIGxpbmUuZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMVwiKVxuICAgICAgICAgICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwXCIpXG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxpbmUuZWwpXG4gICAgICAgICAgICBoaW50cy5wdXNoKHtyZW1vdmU6ICgpPT5saW5lLmVsLnJlbW92ZSgpfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGFzdCA9IG5leHRcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGlmIChwLmxvZ28pIHtcbiAgICAgICAgICBsZXQgcG9zID0gcm9hZG1hcC5nZW9sb2NhdGlvbihwLmxvY2F0aW9uKVxuICAgICAgICAgIGxldCBlbCA9IG1rU3ZnKFwidGV4dFwiLCBwb3MueCwgcG9zLnksIHAubG9nbylcbiAgICAgICAgICBlbC5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwMFwiKVxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZWwuZWwpXG4gICAgICAgICAgaGludHMucHVzaChlbC5lbClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBsZXQgZHYgPSBkaXYoc3R5bGUoe3dpZHRoOlwiMTAwJVwiLCBkaXNwbGF5OlwiZmxleFwiLCBqdXN0aWZ5Q29udGVudDpcImNlbnRlclwiLCBwYWRkaW5nOiBcIjFlbVwifSkpXG4gIGR2LmFwcGVuZChlbGVtZW50KVxuICByZXR1cm4gZHZcbn1cblxuXG4iLAogICAgIlxuaW1wb3J0IHsgTG9jYXRpb24sIHJhbmRvbVVVSUQsIFRpbWUsIHVjb25zdCwgVVVJRCB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKCl7XG5cbiAgbGV0IHBvaW50cyA6TG9jYXRpb25bXSA9IFtdXG5cbiAgbGV0IHJvYWRzID0gbmV3IE1hcDxMb2NhdGlvbiwgTWFwPExvY2F0aW9uLCBUaW1lPj4gKClcbiAgbGV0IGdlb2xvY2F0aW9uID0gbmV3IE1hcDxMb2NhdGlvbiwge3g6IG51bWJlciwgeTogbnVtYmVyfT4oKVxuICBsZXQgZ2VvY29kZXMgPSBuZXcgTWFwPExvY2F0aW9uLCBzdHJpbmc+KClcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDsgaSsrKXtcblxuICAgIGxldCBwb2ludDogTG9jYXRpb24gPSBgbG9jJHtyYW5kb21VVUlEKCl9YFxuICAgIHBvaW50cy5wdXNoKHBvaW50KVxuICAgIGdlb2xvY2F0aW9uLnNldChwb2ludCAsIHt4OiByYW5kb20oKSwgeTogcmFuZG9tKCl9KVxuICAgIGdlb2NvZGVzLnNldChwb2ludCwgYERFICR7Z2VvbG9jYXRpb24uc2l6ZS50b1N0cmluZygpLnBhZFN0YXJ0KDQsIFwiMFwiKX1gKVxuICAgIHJvYWRzLnNldChwb2ludCwgbmV3IE1hcCgpKVxuICB9XG5cbiAgZm9yIChsZXQgW0lELCBwXSBvZiBnZW9sb2NhdGlvbi5lbnRyaWVzKCkpe1xuICAgIGdlb2xvY2F0aW9uLmVudHJpZXMoKS50b0FycmF5KCkuc29ydCgoW2EsQV0sW2IsQl0pPT4gTWF0aC5oeXBvdChBLnggLSBwLngsIEEueSAtIHAueSkgLSBNYXRoLmh5cG90KEIueCAtIHAueCwgQi55IC0gcC55KSlcbiAgICAuc2xpY2UoMSw0KS5mb3JFYWNoKChbaWQsIGxvY10pPT57XG4gICAgICBsZXQgZGlzdCA9IHVjb25zdChNYXRoLmh5cG90KGxvYy54IC0gcC54LCBsb2MueSAtIHAueSkgKiAxMCAqIDYwICogNjAsIFwic2Vjb25kc1wiKVxuICAgICAgcm9hZHMuZ2V0KElEKSEuc2V0KGlkLCBkaXN0KVxuICAgICAgcm9hZHMuZ2V0KGlkKSEuc2V0KElELCBkaXN0KVxuICAgIH0pXG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJvYWRzLFxuICAgIHBvaW50cyxcbiAgICBnZW9sb2NhdGlvbihsb2M6IExvY2F0aW9uKXtcbiAgICAgIGxldCBnZW8gPSBnZW9sb2NhdGlvbi5nZXQobG9jKVxuICAgICAgaWYgKCFnZW8pIHRocm93IG5ldyBFcnJvcihgTG9jYXRpb24gJHtsb2N9IG5vdCBmb3VuZGApXG4gICAgICByZXR1cm4gZ2VvXG4gICAgfSxcbiAgICBnZW9Db2RlKGxvYzogTG9jYXRpb24pe1xuICAgICAgICBsZXQgY29kZSA9IGdlb2NvZGVzLmdldChsb2MpXG4gICAgICAgIGlmICghY29kZSkgdGhyb3cgbmV3IEVycm9yKGBMb2NhdGlvbiAke2xvY30gbm90IGZvdW5kYClcbiAgICAgICAgcmV0dXJuIGNvZGVcbiAgICAgIH1cbiAgICB9XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoKSA9PiBpbmZlciBUID8gVCA6IG5ldmVyXG4iLAogICAgImltcG9ydCB7IExvY2F0aW9uLCBQcmljZSwgUmVxdWVzdCwgVGltZSwgVVVJRCwgdHlwZSBTY2hlZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZmluZFBhdGggfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHR5cGUgeyBSb2FkTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHR5cGUgeyBJbmZlciB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmltcG9ydCB7IGJvcmRlciwgY29sb3IsIGRpdiwgaDMsIGh0bWwsIHBhZGRpbmcsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRyLCB0eXBlIEhUTUxHZW5lcmF0b3IgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cywgcmVxdWVzdHMsIHJvYWRNYXAsIHNjaGVkdWxlIH0gZnJvbSBcIi4vbWFpblwiO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NTdHJpbmcgKGxvYzogSW5mZXI8dHlwZW9mIExvY2F0aW9uPikge1xuICByZXR1cm4gYPCfk40gJHtyb2FkTWFwLmdlb0NvZGUobG9jKSA/PyBcIlVOS1wifWBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zcG9ydGVyU3RyaW5nICh0cmFuOiBVVUlEKSB7XG4gIHJldHVybiBg8J+amyAke3NjaGVkdWxlLmdldCgpLmZpbmRJbmRleChzPT5zLnRyYW5zcG9ydGVyID09IHRyYW4pLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKX1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lU3RyaW5nICh0aW1lOiBUaW1lKXtcbiAgLy8gcmV0dXJuIGAkeygodGltZS52YWx1ZS82MC82MCkudG9GaXhlZCgyKSl9IGhgXG4gIHJldHVybiBgJHtNYXRoLmZsb29yKHRpbWUudmFsdWUvNjAvNjApLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtNYXRoLmZsb29yKCh0aW1lLnZhbHVlLzYwKSU2MCkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWhgXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmljZVN0cmluZyAocHJpY2U6IFByaWNlKXtcbiAgcmV0dXJuIGAke3ByaWNlLnZhbHVlLnRvRml4ZWQoMCl9IOKCrGBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcXVlc3RTdHJpbmcgKGlkOiBVVUlEKSB7XG4gIGxldCByZXEgPSByZXF1ZXN0cy5maW5kKHI9PnIuaWQgPT0gaWQpXG4gIGlmICghcmVxKSByZXR1cm4gXCJVTktcIlxuICByZXR1cm4gYPCfk6YgJHtyZXF1ZXN0cy5maW5kSW5kZXgoeD0+eC5pZCA9PSBpZCkudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpfWBcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0VmlldyAocmVxdWVzdHM6IFJlcXVlc3RbXSwgc2NoZWR1bGU6IFNjaGVkdWxlKTogSFRNTEVsZW1lbnR7XG5cbiAgbGV0IGNlbGwgPSAoKC4uLngpID0+IHRkKHN0eWxlKHtcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICBjdXJzb3I6XCJwb2ludGVyXCIsXG4gICAgd2hpdGVTcGFjZTogXCJub3dyYXBcIixcbiAgfSksIC4uLngpKSBhcyBIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiBcblxuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIG92ZXJmbG93OiBcImF1dG9cIixcbiAgICAgIG1heEhlaWdodDogXCI4MCVcIixcbiAgICB9KSxcbiAgICB0YWJsZShcbiAgICAgIHN0eWxlKHsgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIn0pLFxuXG4gICAgICB0cihbXCJyZXF1ZXN0XCIsIFwic3RhcnRcIiwgXCJlbmRcIiwgXCJkaXN0YW56XCIsIFwicHJlaXNcIiwgXCJmcmlzdFwiIF0ubWFwKGg9PiBjZWxsKGgpLCApLCBzdHlsZSh7Zm9udFdlaWdodDogXCJib2xkXCJ9KSksXG4gICAgICByZXF1ZXN0cy5tYXAoKHIsIGkpPT57XG5cbiAgICAgICAgbGV0IHBhdGggPSBmaW5kUGF0aChyLnN0YXJ0UG9pbnQsIHIuZW5kUG9pbnQpXG5cbiAgICAgICAgbGV0IHJvdz0gdHIoXG4gICAgICAgICAgY2VsbChyZXF1ZXN0U3RyaW5nKHIuaWQpKSxcbiAgICAgICAgICBjZWxsKGxvY1N0cmluZyhyLnN0YXJ0UG9pbnQpKSxcbiAgICAgICAgICBjZWxsKGxvY1N0cmluZyhyLmVuZFBvaW50KSksXG4gICAgICAgICAgY2VsbChzcGFuKCB0aW1lU3RyaW5nKHBhdGguZGlzdCksIHN0eWxlKHtmbG9hdDogXCJyaWdodFwifSkpKSxcbiAgICAgICAgICBjZWxsKHNwYW4ocHJpY2VTdHJpbmcoci52YWx1ZSksIHN0eWxlKHtmbG9hdDogXCJyaWdodFwifSkpKSxcbiAgICAgICAgICBjZWxsKHNwYW4odGltZVN0cmluZyhyLmRlYWRsaW5lKSwgc3R5bGUoe2Zsb2F0OiBcInJpZ2h0XCJ9KSkpLFxuICAgICAgICApXG4gICAgICAgIHJvdy5vbm1vdXNlZW50ZXIgPSAoKT0+e1xuICAgICAgICAgIHJvdy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5ncmF5LFxuICAgICAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHM6IFtcbiAgICAgICAgICAgIHsgbG9jYXRpb246IHIuc3RhcnRQb2ludCwgbG9nbzogXCLwn5OmXCIgfSxcbiAgICAgICAgICAgIHsgbG9jYXRpb246IHIuZW5kUG9pbnQsIGxvZ286IFwi8J+PoFwiIH1cbiAgICAgICAgICBdfV0pXG5cbiAgICAgICAgfVxuICAgICAgICByb3cub25tb3VzZWxlYXZlID0gKCk9PntcbiAgICAgICAgICByb3cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJcIlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByb3dcbiAgICAgIH0pXG5cbiAgICApXG4gIClcblxufSIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGUsIHR5cGUgSnNvbkRhdGEsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBta1dyaXRhYmxlPFQgZXh0ZW5kcyBKc29uRGF0YT4gKHZhbHVlOiBUKSB7XG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQsIGRlZmVycmVkID0gZmFsc2UpID0+IHtcbiAgICAgIGlmICghZGVmZXJyZWQpIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5leHBvcnQgdHlwZSBXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ID0gUmV0dXJuVHlwZTx0eXBlb2YgbWtXcml0YWJsZTxUPj5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IChrZXk6IHN0cmluZywgc2NoZW1hOiBTY2hlbWE8VD4sIGRlZmF1bHRWYWx1ZTogVCkge1xuICBsZXQgdmFsID0gZGVmYXVsdFZhbHVlXG4gIHRyeXtcbiAgICB2YWwgPSB2YWxpZGF0ZShzY2hlbWEsIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSEpKVxuICB9Y2F0Y2h7fVxuXG4gIGxldCByZXMgPSBta1dyaXRhYmxlPFQ+KHZhbClcbiAgXG4gIHJlcy5vbnVwZGF0ZSgobmV3VmFsdWUpPT57XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSkpXG4gIH0pXG5cbiAgcmV0dXJuIHJlc1xufVxuXG4iLAogICAgImltcG9ydCB7IHVjb25zdCwgaWFkZCwgdHlwZSBTY2hlZHVsZUl0ZW0sIHR5cGUgVVVJRCwgU2NoZWR1bGVTdGVwLCBUaW1lLCBhZGQsIFJlcXVlc3QgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGdldENvc3QsIG9wdER1ciwgb3B0aW1pemVTY2hlZHVsZSwgcmF0ZVNjaGVkdWxlIH0gZnJvbSBcIi4uL3BsYW5uZXJcIjtcbmltcG9ydCB7IG1rV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyBiYWNrZ3JvdW5kLCBib2R5LCBib3JkZXJSYWRpdXMsIGJ1dHRvbiwgY29sb3IsIGRpdiwgaDIsIGh0bWwsIHAsIHBhZGRpbmcsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRyLCB3aWR0aCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzLCByZXF1ZXN0cywgcm9hZE1hcCwgc2NoZWR1bGUgfSBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBsb2NTdHJpbmcsIHByaWNlU3RyaW5nLCByZXF1ZXN0U3RyaW5nLCB0aW1lU3RyaW5nLCB0cmFuc3BvcnRlclN0cmluZyB9IGZyb20gXCIuL3JlcXVlc3RWaWV3XCI7XG5cblxuZnVuY3Rpb24gc3RlcExvZ28gKHN0ZXA6IFNjaGVkdWxlU3RlcCl7XG4gIGlmIChzdGVwLiQgPT0gXCJzdGFydFwiKSByZXR1cm4gJ/CfmpsnXG4gIGlmIChzdGVwLiQgPT0gXCJwaWNrdXBcIikgcmV0dXJuICfwn5OmJ1xuICBpZiAoc3RlcC4kID09IFwiZGVsaXZlclwiKSByZXR1cm4gJ/Cfj6AnXG4gIHRocm93IG5ldyBFcnJvcihcInVuZXhwZWN0ZWQgdGFnOlwiLCBzdGVwKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVxdWVzdChpZDogVVVJRCl7XG4gIGxldCByZXEgPSByZXF1ZXN0cy5maW5kKHI9PnIuaWQgPT0gaWQpXG4gIGlmICghcmVxKSB0aHJvdyBuZXcgRXJyb3IoYG5vdCBmb3VuZCByZXF1ZXN0ICR7aWR9YClcbiAgcmV0dXJuIHJlcVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RlcFJlcXVlc3Qoc3RlcDogU2NoZWR1bGVTdGVwKXtcbiAgaWYgKHN0ZXAuJCA9PSBcInN0YXJ0XCIpIHJldHVybiB1bmRlZmluZWRcbiAgcmV0dXJuIGdldFJlcXVlc3Qoc3RlcC52YWwucmVxdWVzdClcbn1cblxuZnVuY3Rpb24gc3RlcFN0cmluZyAoc3RlcDogU2NoZWR1bGVTdGVwKXtcblxuICBpZiAoc3RlcC4kID09IFwic3RhcnRcIikgcmV0dXJuIGBzdGFydGBcbiAgbGV0IHJlcSA9IGdldFJlcXVlc3Qoc3RlcC52YWwucmVxdWVzdClcbiAgcmV0dXJuIGAke3N0ZXAuJH0gJHtyZXF1ZXN0U3RyaW5nKHN0ZXAudmFsLnJlcXVlc3QpfTogJHtwcmljZVN0cmluZyhyZXEudmFsdWUpfSBkZWFkbGluZSAke3RpbWVTdHJpbmcocmVxLmRlYWRsaW5lKX1gXG59XG5cbmxldCBjdXJzb3IgPSBta1dyaXRhYmxlKHtyb3c6IDEsIGNvbDogMX0pXG5cbmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZT0+e1xuICBjdXJzb3IudXBkYXRlKChjdXJzb3IpID0+e1xuICAgIGlmIChjdXJzb3IuY29sID09IC0xKSByZXR1cm5cbiAgICBpZiAoZS5rZXkgPT0gXCJBcnJvd0xlZnRcIikgICAgICAgICBjdXJzb3IuY29sIC09IDFcbiAgICBlbHNlIGlmIChlLmtleSA9PSBcIkFycm93UmlnaHRcIikgICBjdXJzb3IuY29sICs9IDFcbiAgICBlbHNlIGlmIChlLmtleSA9PSBcIkFycm93VXBcIikgICAgICBjdXJzb3Iucm93IC09IDFcbiAgICBlbHNlIGlmIChlLmtleSA9PSBcIkFycm93RG93blwiKSAgICBjdXJzb3Iucm93ICs9IDFcbiAgICBlbHNlIGlmIChlLmtleSA9PSBcIkVzY2FwZVwiKSAgICAgICBjdXJzb3IgPSB7cm93OiAtMSwgY29sOiAtMX1cbiAgICBlbHNlIHJldHVyblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGN1cnNvci5yb3cgPSBNYXRoLm1heCgwLCBNYXRoLm1pbiggc2NoZWR1bGUuZ2V0KCkubGVuZ3RoLTEsIGN1cnNvci5yb3cpKVxuICAgIGN1cnNvci5jb2wgPSBNYXRoLm1heCgwLCBNYXRoLm1pbiggc2NoZWR1bGUuZ2V0KClbY3Vyc29yLnJvd10hLnN0ZXBzLmxlbmd0aC0xLCBjdXJzb3IuY29sKSlcbiAgfSlcblxufSlcblxuXG5cbmV4cG9ydCBjb25zdCBzY2hlZHVsZVZpZXcgPSAoKSA9PiB7XG5cbiAgbGV0IGNlbGwgPSAoKC4uLngpID0+IHRkKHN0eWxlKHtcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgbWFyZ2luOiBcIjBcIixcbiAgICBwYWRkaW5nOiBcIi4zZW0gLjVlbVwiLFxuICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgd2hpdGVTcGFjZTogXCJub3dyYXBcIixcbiAgfSksIC4uLngpKSBhcyB0eXBlb2YgdGQ7XG5cbiAgY29uc3QgdGFidmlldyA9IGRpdigpXG4gIGNvbnN0IHJlamVjdFZpZXcgPSBkaXYoKVxuICBjb25zdCBzdGVwdmlldyA9IGRpdigpXG4gIGxldCBzdGVwRWxzID0gW10gYXMgSFRNTFNwYW5FbGVtZW50W11bXVxuICBsZXQgcm93RWxzID0gW10gYXMgSFRNTFRhYmxlUm93RWxlbWVudFtdXG5cbiAgbGV0IHRpbWVzIDogVGltZVtdW10gPSBbXVxuXG4gIGxldCBkZWNrcyA6IFtSZXF1ZXN0W10sIFJlcXVlc3RbXV0gW10gW10gID0gW11cblxuICBcbiAgc2NoZWR1bGUub251cGRhdGUoc2NoZWQgPT4ge1xuXG4gICAgdGltZXMgPSBzY2hlZC5tYXAocz0+IFt1Y29uc3QoMCwgXCJzZWNvbmRzXCIpXSlcbiAgICBkZWNrcyA9IHNjaGVkLm1hcChzPT4gW1tbXSwgW11dXSlcblxuXG4gICAgY3Vyc29yLm9udXBkYXRlKGN1cnNvcj0+e1xuXG4gICAgICBsZXQge3JvdywgY29sOiBufSA9IGN1cnNvclxuXG4gICAgICBsZXQgc3RlcHMgPSBzY2hlZFtyb3ddIS5zdGVwc1xuICAgICAgbGV0IHN0ZXAgPSBzdGVwc1tuXVxuICAgICAgaWYgKCFzdGVwKSByZXR1cm5cblxuICAgICAgbGV0IHJlcXVlc3QgPSBzdGVwLiQgPT0gXCJzdGFydFwiID8gdW5kZWZpbmVkIDogc3RlcC52YWwucmVxdWVzdFxuXG4gICAgICBzdGVwRWxzLmZvckVhY2goKHJvd0Vscywgcm93bik9PntcbiAgICAgICAgcm93RWxzLmZvckVhY2goKGVsLGkpPT57XG5cbiAgICAgICAgICBsZXQgc3RlcCA9IHNjaGVkW3Jvd25dIS5zdGVwc1tpXVxuICAgICAgICAgIGlmICghc3RlcCkgcmV0dXJuXG4gICAgICAgICAgbGV0IGJvcmRlciA9IGNvbG9yLmJhY2tncm91bmRcbiAgICAgICAgICBpZiAoaSA9PSBuICYmIHJvdyA9PSByb3duKSB7XG4gICAgICAgICAgICBib3JkZXIgPSBjb2xvci5ibHVlIFxuICAgICAgICAgICAgdmlld1N0ZXAocm93LCBuLCBzdGVwdmlldywgdGltZXNbcm93XSFbbl0hLCB0aW1lc1tyb3ddIVt0aW1lc1tyb3ddIS5sZW5ndGgtMV0hLCBkZWNrc1tyb3ddIVtuXSEpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHN0ZXAuJCAhPSBcInN0YXJ0XCIgJiYgc3RlcC52YWwucmVxdWVzdCA9PSByZXF1ZXN0KSBib3JkZXIgPSBjb2xvci5ncmF5XG4gICAgICAgICAgZWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBib3JkZXJcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIGxldCBsb2dvID0gc3RlcExvZ28oc3RlcClcblxuICAgICAgaGlnaHRMaWdodHMuc2V0KFtcbiAgICAgICAgeyBwb2ludHM6IHN0ZXBzLnNsaWNlKG4sbisyKS5tYXAoKHAsaSk9Pih7bG9jYXRpb246IHAudmFsLnBvc30pKSwgY29sb3I6IFwiI2ZmYzk4OFwiIH0sXG4gICAgICAgIHsgcG9pbnRzOiBbe2xvY2F0aW9uOnN0ZXAudmFsLnBvcywgbG9nb31dIH1cbiAgICAgIF0pXG4gICAgfSwgdHJ1ZSlcblxuXG5cblxuICAgIHRhYnZpZXcucmVwbGFjZUNoaWxkcmVuKHRhYmxlKFxuICAgICAgW1widHJhbnNwb3J0ZXJcIiwgXCJzdGVwc1wiXS5tYXAoaD0+IGNlbGwoaCksICksIHN0eWxlKHtmb250V2VpZ2h0OiBcImJvbGRcIn0pLFxuICAgICAgc2NoZWQubWFwKChzLCByb3duKT0+e1xuXG4gICAgICAgIGxldCBhbGxQb2ludHMgPSBzLnN0ZXBzLm1hcChzdGVwPT4gKHsgbG9jYXRpb246IHN0ZXAudmFsLnBvcywgbG9nbzogc3RlcExvZ28oc3RlcCkgfSkpXG4gICAgICAgIGxldCB0cmFuc3BvcnQgPSBzcGFuKHRyYW5zcG9ydGVyU3RyaW5nKHMudHJhbnNwb3J0ZXIpKVxuICAgICAgICB0cmFuc3BvcnQub25tb3VzZWVudGVyID0gKCk9PmhpZ2h0TGlnaHRzLnNldChbe3BvaW50czogYWxsUG9pbnRzLCBjb2xvcjogXCIjZmZjOTg4XCIsfV0pXG5cbiAgICAgICAgc3RlcEVscy5wdXNoKCBzLnN0ZXBzLm1hcCgoc3RlcCxpKT0+e1xuICAgICAgICAgIGlmIChpPjApe1xuICAgICAgICAgICAgbGV0IHByZXYgPSBzLnN0ZXBzW2ktMV0hXG4gICAgICAgICAgICBsZXQgZGlzdCA9IGdldENvc3QocHJldi52YWwucG9zLCBzdGVwLnZhbC5wb3MpXG4gICAgICAgICAgICB0aW1lc1tyb3duXSEucHVzaChhZGQodGltZXNbcm93bl0hW2ktMV0hLCBkaXN0KSlcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJERUNLXCIsIHJvd24sIGksIGRlY2tzW3Jvd25dIVtpLTFdISlcbiAgICAgICAgICAgIGxldCBkZWNrID0gWy4uLmRlY2tzW3Jvd25dIVtpLTFdIV0gYXMgW1JlcXVlc3RbXSwgUmVxdWVzdFtdXVxuXG4gICAgICAgICAgICBpZiAoc3RlcC4kID09IFwicGlja3VwXCIpIGRlY2tbc3RlcC52YWwuZGVja10hID0gWy4uLmRlY2tbc3RlcC52YWwuZGVja10hLCBnZXRSZXF1ZXN0KHN0ZXAudmFsLnJlcXVlc3QpXVxuICAgICAgICAgICAgZWxzZSBpZiAoc3RlcC4kID09IFwiZGVsaXZlclwiKSBkZWNrID0gZGVjay5tYXAoKGQsIGopPT4gZC5maWx0ZXIocj0+ci5pZCAhPSBzdGVwLnZhbC5yZXF1ZXN0KSApIGFzIFtSZXF1ZXN0W10sIFJlcXVlc3RbXV1cbiAgICAgICAgICAgIGRlY2tzW3Jvd25dIS5wdXNoKGRlY2spXG5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdGltZSA9IHRpbWVzW3Jvd25dIVtpXSFcblxuICAgICAgICAgIGxldCByZXEgPSBzdGVwUmVxdWVzdChzdGVwKVxuXG4gICAgICAgICAgbGV0IGxvZ28gPSBzdGVwTG9nbyhzdGVwKVxuICAgICAgICAgIGxldCByZXMgPSBzcGFuKGxvZ28sIHN0eWxlKHtwYWRkaW5nOiBcIi4xZW0gLjFlbVwiLFxuICAgICAgICAgICAgYmFja2dyb3VuZDpyZXEgJiYgcmVxLmRlYWRsaW5lLnZhbHVlIDwgdGltZS52YWx1ZSA/IGNvbG9yLnJlZCA6IFwiXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMC4yZW0gc29saWQgXCIgKyBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjAuM2VtXCIsXG4gICAgICAgICAgICBcbiAgICAgICAgICB9KSlcblxuICAgICAgICAgIHJlcy5vbmNsaWNrID0gKCk9PntcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ0xJQ0tcIiwgcm93biwgaSlcbiAgICAgICAgICAgIGN1cnNvci5zZXQoe3Jvdzogcm93biwgY29sOiBpfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgICB9KSlcblxuICAgICAgICBsZXQgcm93PSB0cihjZWxsKHRyYW5zcG9ydCksIGNlbGwoc3RlcEVsc1tyb3duXSEpKVxuICAgICAgICByb3dFbHMucHVzaChyb3cpXG4gICAgICAgIHJldHVybiByb3dcbiAgICAgIH0pLFxuICAgICAgc3R5bGUoeyBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLCB9KSxcbiAgICApKTtcbiAgICBsZXQgcmVqZWN0cyA9IHJlcXVlc3RzLmZpbHRlcihyPT4hc2NoZWQuZmxhdE1hcChzPT5zLnN0ZXBzKS5zb21lKHN0ZXA9PnN0ZXAuJCAhPSBcInN0YXJ0XCIgJiYgc3RlcC52YWwucmVxdWVzdCA9PSByLmlkKSlcblxuICAgIHJlamVjdFZpZXcucmVwbGFjZUNoaWxkcmVuKFxuXG4gICAgICByZWplY3RzLmxlbmd0aCA9PSAwID8gc3BhbigpIDogZGl2KFxuICAgICAgICBkaXYoXG4gICAgICAgICAgcChcIm9wZW4gcmVxdWVzdHNcIiwgc3R5bGUoe2ZvbnRXZWlnaHQ6IFwiYm9sZFwiLCBwYWRkaW5nOiBcIi4zZW1cIiwgbWFyZ2luOiBcIi4zZW1cIn0pKSxcbiAgICAgICAgICByZWplY3RzLm1hcChyPT5zcGFuKHJlcXVlc3RTdHJpbmcoci5pZCksIHN0eWxlKHtwYWRkaW5nOiBcIi4zZW1cIiwgbWFyZ2luOiBcIi4zZW1cIiwgd2hpdGVTcGFjZTogXCJub3dyYXBcIn0pKSksXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgZGlzcGxheTogXCJyb3dcIixcbiAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICAgICAgICBwYWRkaW5nOiBcIi41ZW1cIixcbiAgICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcbiAgfSlcblxuICBsZXQgdmFsdWUgPSBzcGFuKClcbiAgc2NoZWR1bGUub251cGRhdGUoc2NoPT52YWx1ZS50ZXh0Q29udGVudCA9IHJhdGVTY2hlZHVsZShzY2gpLnRvRml4ZWQoMikpXG5cblxuICBsZXQgc2NoZWR1bGVFbCA9IGRpdihcbiAgICBzdHlsZSh7XG4gICAgICB3aWR0aDogXCJjYWxjKDEwMCUgLSAyZW0pXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgb3ZlcmZsb3c6IFwiYXV0b1wiLFxuICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgcGFkZGluZzogXCIuNWVtXCIsXG4gICAgfSksXG4gICAgdGFidmlldyxcbiAgICByZWplY3RWaWV3LFxuICAgIHAoXCJWYWx1ZTogXCIsIHZhbHVlKSxcbiAgICBwKFwic2VhcmNoIHRpbWU6XCIsIG9wdER1ciksXG4gICAgc3RlcHZpZXcsXG4gIClcbiAgcmV0dXJuIHNjaGVkdWxlRWxcbn1cblxuXG5cbmZ1bmN0aW9uIHZpZXdTdGVwKHJvdzogbnVtYmVyLCBuOiBudW1iZXIsIHBhcmVudDogSFRNTEVsZW1lbnQsIGRpc3Q6IFRpbWUsIHRvdGFsOiBUaW1lLCBkZWNrczogW1JlcXVlc3RbXSwgUmVxdWVzdFtdXSl7XG4gIGxldCBzdGVwcyA9IHNjaGVkdWxlLmdldCgpW3Jvd11cbiAgaWYgKCFzdGVwcykgcmV0dXJuXG4gIGxldCBzdGVwID0gc3RlcHMuc3RlcHNbbl1cbiAgaWYgKCFzdGVwKSByZXR1cm5cblxuICAvLyBsZXQgZGVja3MgPSBbW10sW11dIGFzIFtVVUlEW10sIFVVSURbXV1cblxuICBsZXQgdmlzdWFsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcbiAgdmlzdWFsLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiMTAwJVwiKVxuXG4gIHZpc3VhbC5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiLTAuMSAtMC4xIDEuMiAxLjJcIilcbiAgdmlzdWFsLnNldEF0dHJpYnV0ZShcInByZXNlcnZlQXNwZWN0UmF0aW9cIiwgXCJ4TWlkWU1pZCBtZWV0XCIpXG5cbiAgbGV0IHRyYW5zcG9ydGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJwb2x5Z29uXCIpXG4gIGxldCBwb2ludHMgPSBbIFsuMiwgMF0sIFsuMCwgLjJdLCBbLjAsIC40XSwgWy4yLCAuNF0sIFsuOCwgLjRdLCBbLjgsIC4zN10sIFsuMiwgLjM3XSwgWy4yLCAuMl0sIFsuOCwgLjJdLCBbLjgsIC4xN10sIFsuMiwgLjE3XSxdXG4gIHRyYW5zcG9ydGVyLnNldEF0dHJpYnV0ZShcInBvaW50c1wiLCBwb2ludHMubWFwKHA9PnAuam9pbihcIixcIikpLmpvaW4oXCIgXCIpKVxuICB0cmFuc3BvcnRlci5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmJsdWUpXG5cbiAgdmlzdWFsLmFwcGVuZENoaWxkKHRyYW5zcG9ydGVyKVxuXG4gIGRlY2tzLmZvckVhY2goKGRlY2ssIGkpPT57XG4gICAgZGVjay5mb3JFYWNoKChyZXEsIGopPT57XG4gICAgICBsZXQgY2FyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJyZWN0XCIpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwieFwiLCAoMC4yMjUgKyAuMiAqIGopLnRvU3RyaW5nKCkpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwieVwiLCAoMC4yNSAtIDAuMiAgKiBpKS50b1N0cmluZygpKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiLjE1XCIpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiMC4xMlwiKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuZ3JheSlcbiAgICAgIHZpc3VhbC5hcHBlbmRDaGlsZChjYXIpXG5cbiAgICAgIGxldCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJ0ZXh0XCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcInhcIiwgKDAuMjI1ICsgLjIgKiBqICsgMC4wNzUpLnRvU3RyaW5nKCkpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcInlcIiwgKDAuMjcgLSAwLjIgKiBpICsgMC4wNSkudG9TdHJpbmcoKSlcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiLjA0XCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuY29sb3IpXG4gICAgICB0ZXh0LnRleHRDb250ZW50ID0gYCR7cmVxdWVzdFN0cmluZyhyZXEuaWQpfWBcbiAgICAgIHZpc3VhbC5hcHBlbmRDaGlsZCh0ZXh0KVxuICAgICAgXG4gICAgfSlcbiAgfSlcblxuICBmb3IgKGxldCB4IG9mIFswLjIsIDAuNl0pe1xuICAgIGxldCB0aXJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJjaXJjbGVcIilcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcImN4XCIsIHgudG9TdHJpbmcoKSlcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcImN5XCIsIFwiMC41XCIpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJyXCIsIFwiMC4wN1wiKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5ibHVlKVxuICAgIHZpc3VhbC5hcHBlbmRDaGlsZCh0aXJlKVxuICB9XG5cblxuXG4gIGxldCBkZWFkID0gc3RlcC4kICE9IFwic3RhcnRcIiAmJiBnZXRSZXF1ZXN0KHN0ZXAudmFsLnJlcXVlc3QpLmRlYWRsaW5lLnZhbHVlIDwgZGlzdC52YWx1ZVxuXG4gIGxldCByZXMgPSBkaXYoXG4gICAgaDIodHJhbnNwb3J0ZXJTdHJpbmcoc3RlcHMudHJhbnNwb3J0ZXIpKSxcbiAgICBwKGAke3RpbWVTdHJpbmcoZGlzdCl9IC8gJHt0aW1lU3RyaW5nKHRvdGFsKX1gKSxcbiAgICBwKHN0ZXBTdHJpbmcoc3RlcCksIHN0eWxlKHtjb2xvcjogZGVhZCA/IGNvbG9yLnJlZCA6IGNvbG9yLmNvbG9yfSkpLFxuICAgIHN0eWxlKHtcbiAgICAgIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZ3JheSlcIixcbiAgICAgIG1hcmdpbjogXCIwXCIsXG4gICAgICBwYWRkaW5nOiBcIi4zZW0gLjVlbVwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjJlbVwiLFxuICAgIH0pXG4gIClcblxuICByZXMuYXBwZW5kKHZpc3VhbClcbiAgcGFyZW50LnJlcGxhY2VDaGlsZHJlbihyZXMpXG59XG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyBMb2NhdGlvbiwgcmFuZG9tVVVJRCwgUmVxdWVzdCwgU2NoZWR1bGUsIHVjb25zdCwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgcmVxdWVzdFZpZXcgfSBmcm9tIFwiLi9yZXF1ZXN0Vmlld1wiO1xuaW1wb3J0IHsgc2NoZWR1bGVWaWV3IH0gZnJvbSBcIi4vc2NoZWR1bGVWaWV3XCI7XG5pbXBvcnQgeyBta1N0b3JlZCwgbWtXcml0YWJsZSwgdHlwZSBXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IGNvbmZpZ3VyZVBsYW5uZXIsIG9wdGltaXplU2NoZWR1bGUgfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZG9tLCBzZXRSYW5kU2VlZCB9IGZyb20gXCIuLi9yYW5kb21cIjtcbmltcG9ydCB7IG51bWJlciB9IGZyb20gXCIuLi9zY2hlbWFcIjtcblxuXG5sZXQgTEtXX0NPVU5UID0gbWtTdG9yZWQoXCJMS1dfQ09VTlRcIiwgbnVtYmVyLCAgNSlcbmxldCBSRVFVRVNUX0NPVU5UID0gbWtTdG9yZWQoXCJSRVFVRVNUX0NPVU5UXCIsICBudW1iZXIsIDIwKVxuXG5ib2R5LnN0eWxlLm1hcmdpbiA9IFwiMFwiXG5cbmxldCBoZWFkZXIgPSBoMShcInJvdXRlIHBsYW5uZXJcIiwgc3R5bGUoe2JhY2tncm91bmQ6IGNvbG9yLmJsdWUsIGNvbG9yOiBjb2xvci5iYWNrZ3JvdW5kLCBtYXJnaW46IFwiMFwiLCBwYWRkaW5nOiBcIi42ZW1cIn0pKVxuXG5sZXQgY29udGVudFNwYWNlID0gZGl2KHN0eWxlKHtcbiAgZGlzcGxheTpcImZsZXhcIixcbiAgZmxleERpcmVjdGlvbjpcInJvd1wiLFxuICB3aWR0aDogXCIxMDAlXCIsXG4gIGhlaWdodDogXCJjYWxjKDEwMCUgLSAyLjVlbSlcIixcbiAgbWluV2lkdGg6IFwiMFwiLFxufSkpXG5cbmxldCBwYWdlID0gZGl2KFxuICBzdHlsZSh7ZGlzcGxheTpcImZsZXhcIiwgZmxleERpcmVjdGlvbjpcImNvbHVtblwiLCBoZWlnaHQ6IFwiMTAwJVwifSksXG4gIGhlYWRlcixcbiAgY29udGVudFNwYWNlXG4pXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKHBhZ2UpXG5cblxuc2V0UmFuZFNlZWQoMjUpXG5cblxuZXhwb3J0IGxldCByb2FkTWFwID0gcmFuZG9tTWFwKClcblxuZXhwb3J0IGxldCByZXF1ZXN0czogUmVxdWVzdFtdID0gQXJyYXkuZnJvbSh7bGVuZ3RoOlJFUVVFU1RfQ09VTlQuZ2V0KCl9LCAoXyxpKT0+KHtcbiAgaWQ6IHJhbmRvbVVVSUQoKSxcbiAgc3RhcnRQb2ludDogcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyksXG4gIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRNYXAucG9pbnRzKSxcbiAgdmFsdWU6IHVjb25zdChNYXRoLmZsb29yKHJhbmRvbSgpKjEwMDApLCBcImV1clwiKSxcbiAgZGVhZGxpbmU6IHVjb25zdChNYXRoLmZsb29yKHJhbmRvbSgpKjYwKjYwKjI0KjcpLCBcInNlY29uZHNcIiksXG59KSlcblxuXG5leHBvcnQgbGV0IHNjaGVkdWxlID0gbWtXcml0YWJsZTxTY2hlZHVsZT4gKEFycmF5LmZyb20oe2xlbmd0aDogTEtXX0NPVU5ULmdldCgpfSwgKF8saSk9Pih7XG4gIHRyYW5zcG9ydGVyOiByYW5kb21VVUlEKCksXG4gIHN0ZXBzOiBbeyAkOlwic3RhcnRcIiwgdmFsOiB7XCJwb3NcIjogIHJhbmRDaG9pY2Uocm9hZE1hcC5wb2ludHMpfX1dXG59KSkpXG5cbmNvbmZpZ3VyZVBsYW5uZXIoeyByZXF1ZXN0cywgcm9hZE1hcCB9KVxuXG5zY2hlZHVsZS51cGRhdGUoc2NoZWQ9Pm9wdGltaXplU2NoZWR1bGUocmVxdWVzdHMsIHNjaGVkKSlcblxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIGxvY2F0aW9uOiBMb2NhdGlvbixcbiAgICBsb2dvPyA6IHN0cmluZyxcbiAgfVtdLFxuICBjb2xvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgbGV0IGhpZ2h0TGlnaHRzID0gbWtXcml0YWJsZSA8SGlnaExpZ2h0W10+KCBbXSApXG5cblxuZnVuY3Rpb24gc2V0dGVyIChzdG9yZTogV3JpdGFibGU8bnVtYmVyPiApe1xuICBsZXQgaW5wID0gaW5wdXQoKVxuICBpbnAudHlwZSA9IFwibnVtYmVyXCJcbiAgaW5wLm9uY2hhbmdlID0gKCk9PntcbiAgICBsZXQgdmFsID0gcGFyc2VJbnQoaW5wLnZhbHVlKVxuICAgIGlmIChpc05hTih2YWwpKSByZXR1cm5cbiAgICBzdG9yZS5zZXQodmFsKVxuICB9XG4gIHN0b3JlLm9udXBkYXRlKHZhbD0+aW5wLnZhbHVlID0gdmFsLnRvU3RyaW5nKCkpXG5cbiAgcmV0dXJuIGlucFxufVxuXG5cbmZ1bmN0aW9uIG1rV2luZG93ICh0YWI6IG51bWJlciA9IDAgKSB7XG5cbiAgbGV0IHRhYkZpZWxkcyA9IFtcbiAgICBbJ21hcCcsIG1hcFZpZXcocm9hZE1hcCldLFxuICAgIFsncmVxdWVzdHMnLCByZXF1ZXN0VmlldyhyZXF1ZXN0cywgc2NoZWR1bGUuZ2V0KCkpXSxcbiAgICBbJ3NjaGVkdWxlJywgc2NoZWR1bGVWaWV3KCkgXSxcbiAgICBbJ3NldHRpbmdzJywgZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBwYWRkaW5nOiBcIjFlbVwiLFxuICAgICAgfSksXG4gICAgICBoMihcInNldHRpbmdzXCIpLFxuXG5cbiAgICAgIHRhYmxlKFxuICAgICAgICB0cihcbiAgICAgICAgICB0ZChcIkxLVyBjb3VudFwiKSxcbiAgICAgICAgICB0ZChzZXR0ZXIoTEtXX0NPVU5UKSlcbiAgICAgICAgKSxcbiAgICAgICAgdHIoXG4gICAgICAgICAgdGQoXCJSZXF1ZXN0IGNvdW50XCIpLFxuICAgICAgICAgIHRkKHNldHRlcihSRVFVRVNUX0NPVU5UKSlcbiAgICAgICAgKSxcbiAgICAgICAgdHIoYnV0dG9uKFwiZ2VuZXJhdGVcIiwgKCk9PntcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKClcbiAgICAgICAgfSkpXG4gICAgICApXG5cbiAgICApXVxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgcCh0YWJGaWVsZHMubWFwKChbbixlXSk9PlxuICAgICAgICBzcGFuKCBuLFxuICAgICAgICAgICgpPT5vcGVuVGFiKG4pLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjNlbVwiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIi4zZW1cIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiKyAobj09dGFiID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5KSxcbiAgICAgICAgICAgIGNvbG9yOiAobj09dGFiKSA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApKSxcbiAgICAgIHRhYkZpZWxkcy5maW5kKChbbixdKT0+bj09dGFiKSFbMV1cbiAgICApXG4gIH1cblxuXG4gIG9wZW5UYWIodGFiRmllbGRzW3RhYl0hWzBdKVxuXG4gIHJldHVybiBlbFxufVxuXG5jb250ZW50U3BhY2UucmVwbGFjZUNoaWxkcmVuKG1rV2luZG93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SUFBSSxNQUFNLEdBQUc7QUFBQSxNQUFHO0FBQUEsSUFDaEIsTUFBTSxJQUFJLEdBQUc7QUFBQTtBQUFBLEVBRWYsTUFBTSxTQUFTLFNBQUssSUFBSSxRQUFRLElBQUksU0FBUyxDQUFDO0FBQUEsRUFFOUMsT0FBTztBQUFBO0FBSVQsU0FBUyxRQUFTLENBQUMsTUFBYyxHQUFJO0FBQUEsRUFFbkMsSUFBSSxZQUFZO0FBQUEsSUFDZCxDQUFDLE9BQU8sUUFBUSxPQUFPLENBQUM7QUFBQSxJQUN4QixDQUFDLFlBQVksWUFBWSxXQUFVLFNBQVMsSUFBSSxDQUFDLENBQUM7QUFBQSxJQUNsRCxDQUFDLFlBQVksYUFBYSxDQUFFO0FBQUEsSUFDNUIsQ0FBQyxZQUFZLElBQ1gsTUFBTTtBQUFBLE1BQ0osU0FBUztBQUFBLElBQ1gsQ0FBQyxHQUNELEdBQUcsVUFBVSxHQUdiLE1BQ0UsR0FDRSxHQUFHLFdBQVcsR0FDZCxHQUFHLE9BQU8sU0FBUyxDQUFDLENBQ3RCLEdBQ0EsR0FDRSxHQUFHLGVBQWUsR0FDbEIsR0FBRyxPQUFPLGFBQWEsQ0FBQyxDQUMxQixHQUNBLEdBQUcsT0FBTyxZQUFZLE1BQUk7QUFBQSxNQUN4QixPQUFPLFNBQVMsT0FBTztBQUFBLEtBQ3hCLENBQUMsQ0FDSixDQUVGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFFQSxNQUFNLEtBQUssSUFBSSxNQUFNO0FBQUEsSUFDbkIsTUFBTTtBQUFBLElBQ04sVUFBVTtBQUFBLElBQ1YsUUFBUTtBQUFBLElBQ1IsUUFBUSxlQUFhLE1BQU07QUFBQSxJQUMzQixVQUFVO0FBQUEsRUFDWixDQUFDLENBQUM7QUFBQSxFQUVGLFNBQVMsT0FBTyxDQUFDLE1BQWtDO0FBQUEsSUFDakQsR0FBRyxnQkFDRCxFQUFFLFVBQVUsSUFBSSxFQUFFLEdBQUUsT0FDbEIsS0FBTSxHQUNKLE1BQUksUUFBUSxDQUFDLEdBQ2IsTUFBTTtBQUFBLE1BQ0osU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLE1BQ1IsUUFBUSxnQkFBZSxLQUFHLE9BQU0sTUFBTSxRQUFRLE1BQU07QUFBQSxNQUNwRCxPQUFRLEtBQUcsT0FBTyxNQUFNLFFBQVEsTUFBTTtBQUFBLElBQ3hDLENBQUMsQ0FDSCxDQUNGLENBQUMsR0FDRCxVQUFVLEtBQUssRUFBRSxPQUFNLEtBQUcsSUFBRyxFQUFHLEVBQ2xDO0FBQUE7QUFBQSxFQUlGLFFBQVEsVUFBVSxLQUFNLEVBQUU7QUFBQSxFQUUxQixPQUFPO0FBQUE7QUFHVCxhQUFhLGdCQUFnQixTQUFTLENBQUUsR0FBRyxTQUFTLENBQUM7IiwKICAiZGVidWdJZCI6ICIyQjg1OTM4MEE1QzlBNUM4NjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
