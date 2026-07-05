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
  return Math.floor(random() * (max - min + 1)) + min;
}
function randChoice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// src/schema.ts
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
var COST_PER_H = 5;
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
  return table(style({ borderCollapse: "collapse" }), tr(["request", "start", "end", "distanz", "preis", "frist"].map((h) => cell(h)), style({ fontWeight: "bold" })), requests3.map((r, i) => {
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
  }));
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
    onupdate: (listener) => {
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
    });
    tabview.replaceChildren(table(["transporter", "steps"].map((h) => cell(h)), style({ fontWeight: "bold" }), sched.map((s, rown) => {
      let allPoints = s.steps.map((step) => ({ location: step.val.pos, logo: stepLogo(step) }));
      let transport = span(transporterString(s.transporter));
      transport.onmouseenter = () => hightLights.set([{ points: allPoints, color: "#ffc988" }]);
      stepEls.push(s.steps.map((step, i) => {
        if (i > 0) {
          let prev = s.steps[i - 1];
          let dist = getCost(prev.val.pos, step.val.pos);
          times[rown].push(add(times[rown][i - 1], dist));
          console.log("DECK", rown, i, decks[rown][i - 1]);
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
var LKW_COUNT = 3;
var REQUEST_COUNT = 20;
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
var requests2 = Array.from({ length: REQUEST_COUNT }, (_, i) => ({
  id: randomUUID(),
  startPoint: randChoice(roadMap.points),
  endPoint: randChoice(roadMap.points),
  value: uconst(Math.floor(random() * 1000), "eur"),
  deadline: uconst(Math.floor(random() * 60 * 60 * 24 * 7), "seconds")
}));
var schedule = mkWritable(Array.from({ length: LKW_COUNT }, (_, i) => ({
  transporter: randomUUID(),
  steps: [{ $: "start", val: { pos: randChoice(roadMap.points) } }]
})));
configurePlanner({ requests: requests2, roadMap });
schedule.update((sched) => optimizeSchedule(requests2, sched));
var hightLights = mkWritable([]);
function mkWindow(tab = 0) {
  let tabFields = [
    ["map", mapView(roadMap)],
    ["requests", requestView(requests2, schedule.get())],
    ["schedule", scheduleView()]
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

//# debugId=2DB057E264C1520364756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvcmFuZG9tLnRzIiwgInNyYy9zY2hlbWEudHMiLCAic3JjL3R5cGVzLnRzIiwgInNyYy9wbGFubmVyLnRzIiwgInNyYy92aWV3L21hcFZpZXcudHMiLCAic3JjL3JhbmRvbU1hcC50cyIsICJzcmMvdmlldy9yZXF1ZXN0Vmlldy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy92aWV3L3NjaGVkdWxlVmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSgpe1xuICBsZXQgeCA9IE1hdGguc2luKFJBTkRTRUVEKyspICogMTAwMDA7XG4gIHJldHVybiB4IC0gTWF0aC5mbG9vcih4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRJbnQobWluOiBudW1iZXIsIG1heDogbnVtYmVyKXtcbiAgcmV0dXJuIE1hdGguZmxvb3IocmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoLTEpXSFcbn1cblxuXG4iLAogICAgImltcG9ydCB7IHZhbGlkYXRlSnNvblNjaGVtYSB9IGZyb20gXCIuL2pzb25zY2hlbWFcIlxuXG5cbmV4cG9ydCB0eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25EYXRhIH1cblxuXG5leHBvcnQgdHlwZSBKc29uRGF0YSA9IHN0cmluZyB8IG51bGwgfCBudW1iZXIgfCBib29sZWFuIHwgeyBba2V5IGluIHN0cmluZ106IEpzb25EYXRhIH0gfCBKc29uRGF0YVtdXG5cbmV4cG9ydCB0eXBlIFNjaGVtYTxUPiA9IHsganNvbjogSlNPTlNjaGVtYSB9XG5cbmV4cG9ydCB0eXBlIEluZmVyPFM+ID0gUyBleHRlbmRzIFNjaGVtYTxpbmZlciBUPiA/IFQgOiBuZXZlclxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGUgPSA8VD4gKHNjaGVtYTogU2NoZW1hPFQ+LCBkYXRhOnVua25vd24pIDogVCA9PiB7XG4gIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4oc2NoZW1hLmpzb24sIGRhdGEpXG59XG5cbmV4cG9ydCBjb25zdCBzdHJpbmdpZnkgPSAoZGF0YTogSnNvbkRhdGEpOiBzdHJpbmcgPT4gSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMilcblxuXG5leHBvcnQgY29uc3QgZmlsbFNjaGVtYSA9IDxUPihzY2hlbWE6IFNjaGVtYTxUPikgOiBUID0+e1xuICBsZXQganNvbiA9IHNjaGVtYS5qc29uXG4gIGlmIChqc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwiXCIgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVtYmVyXCIpIHJldHVybiAwIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcImJvb2xlYW5cIikgcmV0dXJuIGZhbHNlIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIG51bGwgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYXJyYXlcIikgcmV0dXJuIFtdIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm9iamVjdFwiICYmIGpzb24ucHJvcGVydGllcyl7XG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fVxuICAgIGxldCByZXF1aXJlZCA9IEFycmF5LmlzQXJyYXkoanNvbi5yZXF1aXJlZCkgPyBqc29uLnJlcXVpcmVkIGFzIHN0cmluZ1tdIDogW11cbiAgICBmb3IgKGxldCByZXEgb2YgcmVxdWlyZWQpXG4gICAgICByZXN1bHRbcmVxXSA9IGZpbGxTY2hlbWEoe2pzb246IChqc29uLnByb3BlcnRpZXMgYXMgYW55KVtyZXFdfSlcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBqc29uKSByZXR1cm4ganNvbi5jb25zdCBhcyBUXG4gIGlmIChcImFueU9mXCIgaW4ganNvbiAmJiBBcnJheS5pc0FycmF5KGpzb24uYW55T2YpKSByZXR1cm4gZmlsbFNjaGVtYSh7anNvbjoganNvbi5hbnlPZlswXSBhcyBKU09OU2NoZW1hfSkgYXMgVFxuICByZXR1cm4gbnVsbCBhcyBUXG59XG5cbmV4cG9ydCBjb25zdCBmcm9tSnNvblNjaGVtYSA9IDxUPiAoanNvbjogSlNPTlNjaGVtYSk6IFNjaGVtYTxUPiA9PiAoe2pzb259KVxuXG5leHBvcnQgY29uc3Qgc3RyaW5nOiBTY2hlbWE8c3RyaW5nPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcInN0cmluZ1wifSlcbmV4cG9ydCBjb25zdCBudW1iZXI6IFNjaGVtYTxudW1iZXI+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVtYmVyXCJ9KVxuZXhwb3J0IGNvbnN0IGJvb2xlYW46IFNjaGVtYTxib29sZWFuPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImJvb2xlYW5cIn0pXG5leHBvcnQgY29uc3QgbnVsbFNjaGVtYSA6IFNjaGVtYTxudWxsPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm51bGxcIn0pXG5leHBvcnQgY29uc3QgYW55OiBTY2hlbWE8YW55PiA9IGZyb21Kc29uU2NoZW1hKHt9KVxuZXhwb3J0IGNvbnN0IG9wdGlvbmFsID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFNjaGVtYTxUIHwgbnVsbD4gPT4gZnJvbUpzb25TY2hlbWEoe2FueU9mOiBbe3R5cGU6IFwibnVsbFwifSwgc2NoZW1hLmpzb25dfSlcbmV4cG9ydCBjb25zdCBhcnJheSA9IDxUPihpdGVtU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8VFtdPiA9PiBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJhcnJheVwiLCBpdGVtczogaXRlbVNjaGVtYS5qc29ufSlcbmV4cG9ydCBjb25zdCBjb25zdGFudCA9IDxUIGV4dGVuZHMgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbj4odmFsdWU6IFQpOiBTY2hlbWE8VD4gPT4gZnJvbUpzb25TY2hlbWEoe2NvbnN0OiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBvYmplY3QgPSA8UyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIFNjaGVtYTxhbnk+Pj4gKHNoYXBlOiBTKTogU2NoZW1hPHtbSyBpbiBrZXlvZiBTXTogSW5mZXI8U1tLXT59PiA9PiBmcm9tSnNvblNjaGVtYSh7XG4gIHR5cGU6IFwib2JqZWN0XCIsXG4gIHByb3BlcnRpZXM6IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyhzaGFwZSkubWFwKChba2V5LCBmaWVsZF0pPT4gW2tleSwgZmllbGQuanNvbl0pKSxcbiAgcmVxdWlyZWQ6IE9iamVjdC5rZXlzKHNoYXBlKVxufSlcblxuZXhwb3J0IGNvbnN0IHJlY29yZCA9IDxUPih2YWx1ZVNjaGVtYTogU2NoZW1hPFQ+KTogU2NoZW1hPFJlY29yZDxzdHJpbmcsIFQ+PiA9PiBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJvYmplY3RcIiwgYWRkaXRpb25hbFByb3BlcnRpZXM6IHZhbHVlU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IHNjaGVtYVNjaGVtYSA6IFNjaGVtYTxKU09OU2NoZW1hPiA9IHJlY29yZChhbnkpXG5cbmV4cG9ydCBjb25zdCB1bmlvbiA9IDxTIGV4dGVuZHMgU2NoZW1hPGFueT5bXT4oLi4uc2NoZW1hczogUyk6IFNjaGVtYTxJbmZlcjxTW251bWJlcl0+PiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IHNjaGVtYXMubWFwKHM9PiBzLmpzb24pfSlcblxuZXhwb3J0IGZ1bmN0aW9uIHRhZ2dlZCA8UyBleHRlbmRzIHtba2V5IDogc3RyaW5nXTogU2NoZW1hPGFueT59PiAoZmllbGRzOiBTKSA6IFNjaGVtYTx7W2tleSBpbiBrZXlvZiBTXTogeyQ6IGtleSwgdmFsOkluZmVyPFNba2V5XT59IH1ba2V5b2YgU10+IHtcbiAgcmV0dXJuIHVuaW9uKC4uLk9iamVjdC5lbnRyaWVzKGZpZWxkcykubWFwKChbJCx2YWxdKT0+b2JqZWN0KHskOmNvbnN0YW50KCQpLHZhbH0pKSlcbn1cblxuXG5cblxuZXhwb3J0IGNvbnN0IGludGVyc2VjdGlvbiA9IDxTIGV4dGVuZHMgU2NoZW1hPGFueT5bXT4oLi4uc2NoZW1hczogUyk6IFNjaGVtYTxJbmZlcjxTW251bWJlcl0+PiA9PiBmcm9tSnNvblNjaGVtYSh7YWxsT2Y6IHNjaGVtYXMubWFwKHM9PiBzLmpzb24pfSlcblxuZXhwb3J0IGNvbnN0IGFzVHlwZVZpZXcgPSAoc2NoZW1hOiBTY2hlbWE8YW55Pik6IHN0cmluZyA9PiB7XG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBcInN0cmluZ1wiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwibnVtYmVyXCIpIHJldHVybiBcIm51bWJlclwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gXCJib29sZWFuXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudWxsXCIpIHJldHVybiBcIm51bGxcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcImFycmF5XCIgJiYgc2NoZW1hLmpzb24uaXRlbXMpIHJldHVybiBgJHthc1R5cGVWaWV3KHtqc29uOiBzY2hlbWEuanNvbi5pdGVtcyBhcyBKU09OU2NoZW1hfSl9W11gXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYgc2NoZW1hLmpzb24ucHJvcGVydGllcyl7XG4gICAgbGV0IHByb3BzID0gT2JqZWN0LmVudHJpZXMoc2NoZW1hLmpzb24ucHJvcGVydGllcykubWFwKChba2V5LCBwcm9wXSk9PiBgJHtrZXl9OiAke2FzVHlwZVZpZXcoe2pzb246IHByb3AgYXMgSlNPTlNjaGVtYX0pfWApXG4gICAgcmV0dXJuIGB7XFxuICAke3Byb3BzLmpvaW4oXCIsXFxuXCIpLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCJcXG4gIFwiKX1cXG59YFxuICB9XG4gIGlmIChcImNvbnN0XCIgaW4gc2NoZW1hLmpzb24pIHJldHVybiBKU09OLnN0cmluZ2lmeShzY2hlbWEuanNvbi5jb25zdClcbiAgaWYgKFwiYW55T2ZcIiBpbiBzY2hlbWEuanNvbiAmJiBBcnJheS5pc0FycmF5KHNjaGVtYS5qc29uLmFueU9mKSkgcmV0dXJuIHNjaGVtYS5qc29uLmFueU9mLm1hcChzPT4gYXNUeXBlVmlldyh7anNvbjogcyBhcyBKU09OU2NoZW1hfSkpLmpvaW4oXCIgfCBcIilcbiAgcmV0dXJuIFwiYW55XCJcbn1cblxuXG5cbmV4cG9ydCBjbGFzcyBMb2NhbFN0b3JlZCA8VCBleHRlbmRzIEpzb25EYXRhPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBrZXk6IHN0cmluZywgcHVibGljIHNjaGVtYTogU2NoZW1hPFQ+LCBwdWJsaWMgZGVmYXVsdFZhbHVlOiBUKXt9XG5cbiAgZ2V0KCk6VCB7XG4gICAgbGV0IHJhdyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMua2V5KVxuICAgIHRyeXtcbiAgICAgIHJldHVybiB2YWxpZGF0ZSh0aGlzLnNjaGVtYSwgSlNPTi5wYXJzZShyYXchKSlcbiAgICB9Y2F0Y2goZSl7XG4gICAgICByZXR1cm4gdGhpcy5kZWZhdWx0VmFsdWVcbiAgICB9XG4gIH1cbiAgc2V0KHZhbHVlOiBUKXtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLmtleSwgSlNPTi5zdHJpbmdpZnkodmFsaWRhdGUodGhpcy5zY2hlbWEsIHZhbHVlKSkpXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cblxuZXhwb3J0IHR5cGUgVVVJRCA9IGB1JHtzdHJpbmd9LSR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBVVUlEIDogU2NoZW1hPFVVSUQ+ID0gc3RyaW5nXG5cblxuZXhwb3J0IHR5cGUgVW5pdCA8cyBleHRlbmRzIHN0cmluZz4gPSB7dmFsdWU6IG51bWJlciwgdW5pdDogc31cbmV4cG9ydCBjb25zdCBVbml0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHVuaXQ6IHMpID0+IG9iamVjdCh7dmFsdWU6IG51bWJlciwgdW5pdDogY29uc3RhbnQodW5pdCl9KVxuXG5leHBvcnQgY29uc3QgdWNvbnN0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHZhbHVlOiBudW1iZXIsIHVuaXQ6IHMpIDogVW5pdDxzPiA9PiAoe3ZhbHVlLCB1bml0fSlcbmV4cG9ydCBjb25zdCBhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgOiBVbml0PHM+ID0+ICh7dmFsdWU6IGEudmFsdWUgKyBiLnZhbHVlLCB1bml0OiBhLnVuaXR9KVxuZXhwb3J0IGNvbnN0IGlhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgPT4ge2EudmFsdWUgKz0gYi52YWx1ZX1cblxuZXhwb3J0IGNvbnN0IHN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA6IFVuaXQ8cz4gPT4gKHt2YWx1ZTogYS52YWx1ZSAtIGIudmFsdWUsIHVuaXQ6IGEudW5pdH0pXG5leHBvcnQgY29uc3QgaXN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA9PiB7YS52YWx1ZSAtPSBiLnZhbHVlfVxuZXhwb3J0IGNvbnN0IG11bCA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBudW1iZXIpIDogVW5pdDxzPiA9PiAoe3ZhbHVlOiBhLnZhbHVlICogYiwgdW5pdDogYS51bml0fSlcblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5leHBvcnQgY29uc3QgUHJpY2UgPSBVbml0KFwiZXVyXCIpXG5leHBvcnQgY29uc3QgVGltZSA9IFVuaXQoXCJzZWNvbmRzXCIpXG5leHBvcnQgdHlwZSBQcmljZSA9IFVuaXQ8XCJldXJcIj5cbmV4cG9ydCB0eXBlIFRpbWUgPSBVbml0PFwic2Vjb25kc1wiPlxuXG5cbmV4cG9ydCB0eXBlIExvY2F0aW9uID0gYGxvYyR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBMb2NhdGlvbiA6IFNjaGVtYTxMb2NhdGlvbj4gPSBzdHJpbmdcblxuZXhwb3J0IGNvbnN0IFJlcXVlc3QgPSBvYmplY3Qoe1xuICBpZDogVVVJRCxcbiAgc3RhcnRQb2ludDogTG9jYXRpb24sXG4gIGVuZFBvaW50OiBMb2NhdGlvbixcbiAgdmFsdWU6IFByaWNlLFxuICBkZWFkbGluZTogVGltZSxcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IExvY2F0aW9uLCBkZWNrOiB1bmlvbihjb25zdGFudCgwKSwgY29uc3RhbnQoMSkpfSksXG4gIGRlbGl2ZXI6IG9iamVjdCh7cmVxdWVzdDogVVVJRCwgcG9zOiBMb2NhdGlvbn0pLFxuICBzdGFydDogb2JqZWN0KHtwb3M6IExvY2F0aW9ufSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cbmV4cG9ydCBjb25zdCBNb2R1bGUgPSBvYmplY3Qoe1xuXG4gIHJlcXVlc3RzOiBhcnJheShSZXF1ZXN0KSxcbiAgdHJhbnNwb3J0ZXJzOiBhcnJheShUcmFuc3BvcnRlciksXG4gIHNjaGVkdWxlOiBTY2hlZHVsZSxcblxufSlcblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG4iLAogICAgImltcG9ydCB7IFRpbWUsIGFkZCwgaWFkZCwgaXN1YiwgbXVsLCB1Y29uc3QsIHR5cGUgTG9jYXRpb24sIHR5cGUgUmVxdWVzdCwgdHlwZSBTY2hlZHVsZSwgdHlwZSBTY2hlZHVsZUl0ZW0sIHR5cGUgU2NoZWR1bGVTdGVwLCB0eXBlIFVVSUQgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBSb2FkTWFwIH0gZnJvbSBcIi4vcmFuZG9tTWFwXCI7XG5cbmNvbnN0IERFQ0tDQVBBQ0lUWSA9IDM7XG5jb25zdCBVTkxPQURDT1NUID0gdWNvbnN0KDEwLCBcImV1clwiKTtcbmNvbnN0IFBJQ0tVUENPU1QgPSB1Y29uc3QoNSwgXCJldXJcIik7XG5jb25zdCBDT1NUX1BFUl9IID0gNTtcbmNvbnN0IENPU1RfUEVSX1NFQ09ORCA9IENPU1RfUEVSX0ggLyAzNjAwO1xuXG50eXBlIFBsYW5uZXJDb250ZXh0ID0ge1xuICByZXF1ZXN0czogUmVxdWVzdFtdO1xuICByb2FkTWFwOiBSb2FkTWFwO1xufTtcblxudHlwZSBJbnNlcnRpb25DYW5kaWRhdGUgPSB7XG4gIGl0ZW1JbmRleDogbnVtYmVyO1xuICBwaWNrSW5kZXg6IG51bWJlcjtcbiAgZHJvcEluZGV4OiBudW1iZXI7XG4gIGRlY2s6IDAgfCAxO1xuICBzY29yZURlbHRhOiBudW1iZXI7XG59O1xuXG5sZXQgcGxhbm5lckNvbnRleHQ6IFBsYW5uZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmVQbGFubmVyKGNvbnRleHQ6IFBsYW5uZXJDb250ZXh0KSB7XG4gIHBsYW5uZXJDb250ZXh0ID0gY29udGV4dDtcbiAgQ29zdE1hdHJpeC5jbGVhcigpO1xufVxuXG5mdW5jdGlvbiBnZXRQbGFubmVyQ29udGV4dCgpOiBQbGFubmVyQ29udGV4dCB7XG4gIGlmICghcGxhbm5lckNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbGFubmVyIGNvbnRleHQgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gIH1cbiAgcmV0dXJuIHBsYW5uZXJDb250ZXh0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFpcklkKGE6IHN0cmluZywgYjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGEgPCBiID8gYCR7YX0tJHtifWAgOiBgJHtifS0ke2F9YDtcbn1cblxuY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBNYXA8c3RyaW5nLCBUaW1lPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhdGgoc3RhcnQ6IExvY2F0aW9uLCBlbmQ6IExvY2F0aW9uKTogeyBwYXRoOiBMb2NhdGlvbltdOyBkaXN0OiBUaW1lIH0ge1xuICBjb25zdCB7IHJvYWRNYXAgfSA9IGdldFBsYW5uZXJDb250ZXh0KCk7XG4gIGNvbnN0IGlkID0gcGFpcklkKHN0YXJ0LCBlbmQpO1xuXG4gIGlmIChzdGFydCA9PT0gZW5kKSB7XG4gICAgY29uc3QgZGlzdCA9IHVjb25zdCgwLCBcInNlY29uZHNcIik7XG4gICAgQ29zdE1hdHJpeC5zZXQoaWQsIGRpc3QpO1xuICAgIHJldHVybiB7IHBhdGg6IFtzdGFydF0sIGRpc3QgfTtcbiAgfVxuXG4gIGNvbnN0IGRpc3QgPSBuZXcgTWFwPExvY2F0aW9uLCBUaW1lPigpO1xuICBjb25zdCBwcmV2ID0gbmV3IE1hcDxMb2NhdGlvbiwgTG9jYXRpb24gfCBudWxsPigpO1xuICBjb25zdCB1bnZpc2l0ZWQgPSBuZXcgU2V0PExvY2F0aW9uPihyb2FkTWFwLnBvaW50cyk7XG5cbiAgZm9yIChjb25zdCBwb2ludCBvZiByb2FkTWFwLnBvaW50cykge1xuICAgIGRpc3Quc2V0KHBvaW50LCB1Y29uc3QoSW5maW5pdHksIFwic2Vjb25kc1wiKSk7XG4gICAgcHJldi5zZXQocG9pbnQsIG51bGwpO1xuICB9XG5cbiAgZGlzdC5zZXQoc3RhcnQsIHVjb25zdCgwLCBcInNlY29uZHNcIikpO1xuXG4gIHdoaWxlICh1bnZpc2l0ZWQuc2l6ZSA+IDApIHtcbiAgICBsZXQgY3VycmVudDogTG9jYXRpb24gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgY3VycmVudERpc3QgPSBJbmZpbml0eTtcblxuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgdW52aXNpdGVkKSB7XG4gICAgICBjb25zdCBwb2ludERpc3QgPSBkaXN0LmdldChwb2ludCkhLnZhbHVlO1xuICAgICAgaWYgKHBvaW50RGlzdCA8IGN1cnJlbnREaXN0KSB7XG4gICAgICAgIGN1cnJlbnQgPSBwb2ludDtcbiAgICAgICAgY3VycmVudERpc3QgPSBwb2ludERpc3Q7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT0gbnVsbCB8fCBjdXJyZW50RGlzdCA9PT0gSW5maW5pdHkpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHVudmlzaXRlZC5kZWxldGUoY3VycmVudCk7XG5cbiAgICBpZiAoY3VycmVudCA9PT0gZW5kKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtuZXh0LCBzZWdtZW50XSBvZiByb2FkTWFwLnJvYWRzLmdldChjdXJyZW50KSA/PyBbXSkge1xuICAgICAgaWYgKCF1bnZpc2l0ZWQuaGFzKG5leHQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgY2FuZGlkYXRlID0gYWRkKGRpc3QuZ2V0KGN1cnJlbnQpISwgc2VnbWVudCk7XG4gICAgICBpZiAoY2FuZGlkYXRlLnZhbHVlIDwgZGlzdC5nZXQobmV4dCkhLnZhbHVlKSB7XG4gICAgICAgIGRpc3Quc2V0KG5leHQsIGNhbmRpZGF0ZSk7XG4gICAgICAgIHByZXYuc2V0KG5leHQsIGN1cnJlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRvdGFsRGlzdCA9IGRpc3QuZ2V0KGVuZCk7XG4gIGlmICghdG90YWxEaXN0IHx8IHRvdGFsRGlzdC52YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhdGggZm91bmQgZnJvbSAke3N0YXJ0fSB0byAke2VuZH1gKTtcbiAgfVxuXG4gIGNvbnN0IHBhdGg6IExvY2F0aW9uW10gPSBbXTtcbiAgbGV0IGN1cnNvcjogTG9jYXRpb24gfCBudWxsID0gZW5kO1xuICB3aGlsZSAoY3Vyc29yICE9IG51bGwpIHtcbiAgICBwYXRoLnB1c2goY3Vyc29yKTtcbiAgICBjdXJzb3IgPSBwcmV2LmdldChjdXJzb3IpID8/IG51bGw7XG4gIH1cbiAgcGF0aC5yZXZlcnNlKCk7XG5cbiAgQ29zdE1hdHJpeC5zZXQoaWQsIHRvdGFsRGlzdCk7XG4gIHJldHVybiB7IHBhdGgsIGRpc3Q6IHRvdGFsRGlzdCB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29zdChzdGFydDogTG9jYXRpb24sIGVuZDogTG9jYXRpb24pOiBUaW1lIHtcbiAgY29uc3QgaWQgPSBwYWlySWQoc3RhcnQsIGVuZCk7XG4gIGlmICghQ29zdE1hdHJpeC5oYXMoaWQpKSB7XG4gICAgZmluZFBhdGgoc3RhcnQsIGVuZCk7XG4gIH1cbiAgcmV0dXJuIENvc3RNYXRyaXguZ2V0KGlkKSE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IExvY2F0aW9uW10pOiBUaW1lIHtcbiAgY29uc3QgY29zdCA9IHVjb25zdCgwLCBcInNlY29uZHNcIik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGlhZGQoY29zdCwgZ2V0Q29zdChwb2ludHNbaV0hLCBwb2ludHNbaSArIDFdISkpO1xuICB9XG4gIHJldHVybiBjb3N0O1xufVxuXG5leHBvcnQgbGV0IG9wdER1ciA9IDA7XG5cbmZ1bmN0aW9uIHJlcXVlc3RNYXAocmVxdWVzdHM6IFJlcXVlc3RbXSk6IE1hcDxVVUlELCBSZXF1ZXN0PiB7XG4gIHJldHVybiBuZXcgTWFwKHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gW3JlcXVlc3QuaWQsIHJlcXVlc3RdKSk7XG59XG5cbmZ1bmN0aW9uIHJvdXRlU2NvcmUoaXRlbTogU2NoZWR1bGVJdGVtLCByZXF1ZXN0c0J5SWQ6IE1hcDxVVUlELCBSZXF1ZXN0Pik6IG51bWJlciB7XG4gIGlmIChpdGVtLnN0ZXBzWzBdPy4kICE9PSBcInN0YXJ0XCIpIHtcbiAgICByZXR1cm4gLUluZmluaXR5O1xuICB9XG5cbiAgY29uc3QgcmV3YXJkID0gdWNvbnN0KDAsIFwiZXVyXCIpO1xuICBjb25zdCBkdXJhdGlvbiA9IHVjb25zdCgwLCBcInNlY29uZHNcIik7XG4gIGNvbnN0IGRlY2tzOiBbVVVJRFtdLCBVVUlEW11dID0gW1tdLCBbXV07XG5cbiAgZnVuY3Rpb24gdW5sb2FkKHJlcUlkOiBVVUlELCBkZWNrOiAwIHwgMSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlkeCA9IGRlY2tzW2RlY2tdLmluZGV4T2YocmVxSWQpO1xuICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGFmdGVyID0gZGVja3NbZGVja10uc2xpY2UoaWR4ICsgMSk7XG4gICAgZGVja3NbZGVja10gPSBkZWNrc1tkZWNrXS5zbGljZSgwLCBpZHgpLmNvbmNhdChhZnRlcik7XG4gICAgaXN1YihyZXdhcmQsIFVOTE9BRENPU1QpO1xuICAgIGlzdWIocmV3YXJkLCBtdWwoYWRkKFVOTE9BRENPU1QsIFBJQ0tVUENPU1QpLCBhZnRlci5sZW5ndGgpKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgaXRlbS5zdGVwcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByZXYgPSBpdGVtLnN0ZXBzW2kgLSAxXSE7XG4gICAgY29uc3Qgc3RlcCA9IGl0ZW0uc3RlcHNbaV0hO1xuXG4gICAgaWFkZChkdXJhdGlvbiwgZ2V0Q29zdChwcmV2LnZhbC5wb3MsIHN0ZXAudmFsLnBvcykpO1xuXG4gICAgaWYgKHN0ZXAuJCA9PT0gXCJwaWNrdXBcIikge1xuICAgICAgZGVja3Nbc3RlcC52YWwuZGVja10ucHVzaChzdGVwLnZhbC5yZXF1ZXN0KTtcbiAgICAgIGlmIChkZWNrc1tzdGVwLnZhbC5kZWNrXS5sZW5ndGggPiBERUNLQ0FQQUNJVFkpIHtcbiAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChzdGVwLiQgPT09IFwiZGVsaXZlclwiKSB7XG4gICAgICBjb25zdCByZXEgPSByZXF1ZXN0c0J5SWQuZ2V0KHN0ZXAudmFsLnJlcXVlc3QpO1xuICAgICAgaWYgKCFyZXEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBub3QgZm91bmQgcmVxdWVzdDogJHtzdGVwLnZhbC5yZXF1ZXN0fWApO1xuICAgICAgfVxuICAgICAgaWYgKCF1bmxvYWQoc3RlcC52YWwucmVxdWVzdCwgMCkgJiYgIXVubG9hZChzdGVwLnZhbC5yZXF1ZXN0LCAxKSkge1xuICAgICAgICByZXR1cm4gLUluZmluaXR5O1xuICAgICAgfVxuICAgICAgaWYgKGR1cmF0aW9uLnZhbHVlIDw9IHJlcS5kZWFkbGluZS52YWx1ZSkge1xuICAgICAgICBpYWRkKHJld2FyZCwgcmVxLnZhbHVlKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJldHVybiAtSW5maW5pdHk7XG4gIH1cblxuICByZXR1cm4gcmV3YXJkLnZhbHVlIC0gZHVyYXRpb24udmFsdWUgKiBDT1NUX1BFUl9TRUNPTkQ7XG59XG5cbmZ1bmN0aW9uIHNhZmVSb3V0ZVNjb3JlKGl0ZW06IFNjaGVkdWxlSXRlbSwgcmVxdWVzdHNCeUlkOiBNYXA8VVVJRCwgUmVxdWVzdD4pOiBudW1iZXIge1xuICB0cnkge1xuICAgIHJldHVybiByb3V0ZVNjb3JlKGl0ZW0sIHJlcXVlc3RzQnlJZCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiAtSW5maW5pdHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zZXJ0UmVxdWVzdEludG9JdGVtKFxuICBpdGVtOiBTY2hlZHVsZUl0ZW0sXG4gIHJlcXVlc3Q6IFJlcXVlc3QsXG4gIHBpY2tJbmRleDogbnVtYmVyLFxuICBkcm9wSW5kZXg6IG51bWJlcixcbiAgZGVjazogMCB8IDEsXG4pOiBTY2hlZHVsZUl0ZW0ge1xuICBjb25zdCBwaWNrdXA6IFNjaGVkdWxlU3RlcCA9IHtcbiAgICAkOiBcInBpY2t1cFwiLFxuICAgIHZhbDogeyByZXF1ZXN0OiByZXF1ZXN0LmlkLCBwb3M6IHJlcXVlc3Quc3RhcnRQb2ludCwgZGVjayB9LFxuICB9O1xuICBjb25zdCBkZWxpdmVyOiBTY2hlZHVsZVN0ZXAgPSB7XG4gICAgJDogXCJkZWxpdmVyXCIsXG4gICAgdmFsOiB7IHJlcXVlc3Q6IHJlcXVlc3QuaWQsIHBvczogcmVxdWVzdC5lbmRQb2ludCB9LFxuICB9O1xuXG4gIGNvbnN0IHN0ZXBzID0gWy4uLml0ZW0uc3RlcHNdO1xuICBzdGVwcy5zcGxpY2UocGlja0luZGV4LCAwLCBwaWNrdXApO1xuICBzdGVwcy5zcGxpY2UoZHJvcEluZGV4LCAwLCBkZWxpdmVyKTtcbiAgcmV0dXJuIHsgLi4uaXRlbSwgc3RlcHMgfTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmVxdWVzdEZyb21TY2hlZHVsZShzY2hlZHVsZTogU2NoZWR1bGUsIHJlcXVlc3RJZDogVVVJRCk6IFNjaGVkdWxlIHtcbiAgcmV0dXJuIHNjaGVkdWxlLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAuLi5pdGVtLFxuICAgIHN0ZXBzOiBpdGVtLnN0ZXBzLmZpbHRlcigoc3RlcCkgPT4gc3RlcC4kID09PSBcInN0YXJ0XCIgfHwgc3RlcC52YWwucmVxdWVzdCAhPT0gcmVxdWVzdElkKSxcbiAgfSkpO1xufVxuXG5mdW5jdGlvbiBhc3NpZ25lZFJlcXVlc3RJZHMoc2NoZWR1bGU6IFNjaGVkdWxlKTogU2V0PFVVSUQ+IHtcbiAgY29uc3QgaWRzID0gbmV3IFNldDxVVUlEPigpO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2NoZWR1bGUpIHtcbiAgICBmb3IgKGNvbnN0IHN0ZXAgb2YgaXRlbS5zdGVwcykge1xuICAgICAgaWYgKHN0ZXAuJCA9PT0gXCJwaWNrdXBcIikge1xuICAgICAgICBpZHMuYWRkKHN0ZXAudmFsLnJlcXVlc3QpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaWRzO1xufVxuXG5mdW5jdGlvbiByZXF1ZXN0UHJpb3JpdHkocmVxdWVzdDogUmVxdWVzdCk6IG51bWJlciB7XG4gIHRyeSB7XG4gICAgY29uc3QgZGlyZWN0VHJhdmVsID0gZ2V0Q29zdChyZXF1ZXN0LnN0YXJ0UG9pbnQsIHJlcXVlc3QuZW5kUG9pbnQpLnZhbHVlICogQ09TVF9QRVJfU0VDT05EO1xuICAgIHJldHVybiByZXF1ZXN0LnZhbHVlLnZhbHVlIC0gZGlyZWN0VHJhdmVsIC0gUElDS1VQQ09TVC52YWx1ZSAtIFVOTE9BRENPU1QudmFsdWU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiAtSW5maW5pdHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYmVzdEluc2VydGlvbihzY2hlZHVsZTogU2NoZWR1bGUsIHJlcXVlc3Q6IFJlcXVlc3QsIHJlcXVlc3RzQnlJZDogTWFwPFVVSUQsIFJlcXVlc3Q+KTogSW5zZXJ0aW9uQ2FuZGlkYXRlIHwgbnVsbCB7XG4gIGxldCBiZXN0OiBJbnNlcnRpb25DYW5kaWRhdGUgfCBudWxsID0gbnVsbDtcblxuICBmb3IgKGxldCBpdGVtSW5kZXggPSAwOyBpdGVtSW5kZXggPCBzY2hlZHVsZS5sZW5ndGg7IGl0ZW1JbmRleCsrKSB7XG4gICAgY29uc3QgaXRlbSA9IHNjaGVkdWxlW2l0ZW1JbmRleF0hO1xuICAgIGNvbnN0IGN1cnJlbnRTY29yZSA9IHNhZmVSb3V0ZVNjb3JlKGl0ZW0sIHJlcXVlc3RzQnlJZCk7XG5cbiAgICBmb3IgKGNvbnN0IGRlY2sgb2YgWzAsIDFdIGFzIGNvbnN0KSB7XG4gICAgICBmb3IgKGxldCBwaWNrSW5kZXggPSAxOyBwaWNrSW5kZXggPD0gaXRlbS5zdGVwcy5sZW5ndGg7IHBpY2tJbmRleCsrKSB7XG4gICAgICAgIGZvciAobGV0IGRyb3BJbmRleCA9IHBpY2tJbmRleCArIDE7IGRyb3BJbmRleCA8PSBpdGVtLnN0ZXBzLmxlbmd0aCArIDE7IGRyb3BJbmRleCsrKSB7XG4gICAgICAgICAgY29uc3QgY2FuZGlkYXRlID0gaW5zZXJ0UmVxdWVzdEludG9JdGVtKGl0ZW0sIHJlcXVlc3QsIHBpY2tJbmRleCwgZHJvcEluZGV4LCBkZWNrKTtcbiAgICAgICAgICBjb25zdCBjYW5kaWRhdGVTY29yZSA9IHNhZmVSb3V0ZVNjb3JlKGNhbmRpZGF0ZSwgcmVxdWVzdHNCeUlkKTtcbiAgICAgICAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShjYW5kaWRhdGVTY29yZSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHNjb3JlRGVsdGEgPSBjYW5kaWRhdGVTY29yZSAtIGN1cnJlbnRTY29yZTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhYmVzdCB8fFxuICAgICAgICAgICAgc2NvcmVEZWx0YSA+IGJlc3Quc2NvcmVEZWx0YSB8fFxuICAgICAgICAgICAgKHNjb3JlRGVsdGEgPT09IGJlc3Quc2NvcmVEZWx0YSAmJiBpdGVtSW5kZXggPCBiZXN0Lml0ZW1JbmRleClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGJlc3QgPSB7IGl0ZW1JbmRleCwgcGlja0luZGV4LCBkcm9wSW5kZXgsIGRlY2ssIHNjb3JlRGVsdGEgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gYmVzdDtcbn1cblxuZnVuY3Rpb24gYXBwbHlJbnNlcnRpb24oc2NoZWR1bGU6IFNjaGVkdWxlLCByZXF1ZXN0OiBSZXF1ZXN0LCBjYW5kaWRhdGU6IEluc2VydGlvbkNhbmRpZGF0ZSk6IFNjaGVkdWxlIHtcbiAgcmV0dXJuIHNjaGVkdWxlLm1hcCgoaXRlbSwgaXRlbUluZGV4KSA9PlxuICAgIGl0ZW1JbmRleCA9PT0gY2FuZGlkYXRlLml0ZW1JbmRleFxuICAgICAgPyBpbnNlcnRSZXF1ZXN0SW50b0l0ZW0oaXRlbSwgcmVxdWVzdCwgY2FuZGlkYXRlLnBpY2tJbmRleCwgY2FuZGlkYXRlLmRyb3BJbmRleCwgY2FuZGlkYXRlLmRlY2spXG4gICAgICA6IGl0ZW0sXG4gICk7XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVCeVJlbG9jYXRpb24oc2NoZWR1bGU6IFNjaGVkdWxlLCByZXF1ZXN0c0J5SWQ6IE1hcDxVVUlELCBSZXF1ZXN0Pik6IFNjaGVkdWxlIHtcbiAgbGV0IGN1cnJlbnQgPSBzY2hlZHVsZTtcbiAgbGV0IGN1cnJlbnRTY29yZSA9IHJhdGVTY2hlZHVsZShjdXJyZW50KTtcbiAgY29uc3QgYXNzaWduZWQgPSBBcnJheS5mcm9tKGFzc2lnbmVkUmVxdWVzdElkcyhjdXJyZW50KSk7XG5cbiAgZm9yIChjb25zdCByZXF1ZXN0SWQgb2YgYXNzaWduZWQpIHtcbiAgICBjb25zdCByZXF1ZXN0ID0gcmVxdWVzdHNCeUlkLmdldChyZXF1ZXN0SWQpO1xuICAgIGlmICghcmVxdWVzdCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcmVkdWNlZCA9IHJlbW92ZVJlcXVlc3RGcm9tU2NoZWR1bGUoY3VycmVudCwgcmVxdWVzdElkKTtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBiZXN0SW5zZXJ0aW9uKHJlZHVjZWQsIHJlcXVlc3QsIHJlcXVlc3RzQnlJZCk7XG4gICAgaWYgKCFjYW5kaWRhdGUgfHwgY2FuZGlkYXRlLnNjb3JlRGVsdGEgPD0gMCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dCA9IGFwcGx5SW5zZXJ0aW9uKHJlZHVjZWQsIHJlcXVlc3QsIGNhbmRpZGF0ZSk7XG4gICAgY29uc3QgbmV4dFNjb3JlID0gcmF0ZVNjaGVkdWxlKG5leHQpO1xuICAgIGlmIChuZXh0U2NvcmUgPiBjdXJyZW50U2NvcmUpIHtcbiAgICAgIGN1cnJlbnQgPSBuZXh0O1xuICAgICAgY3VycmVudFNjb3JlID0gbmV4dFNjb3JlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb3B0aW1pemVTY2hlZHVsZShyZXF1ZXN0czogUmVxdWVzdFtdLCBzY2hlZHVsZTogU2NoZWR1bGUpOiBTY2hlZHVsZSB7XG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGNvbnN0IHJlcXVlc3RzQnlJZCA9IHJlcXVlc3RNYXAocmVxdWVzdHMpO1xuICBjb25zdCBhc3NpZ25lZCA9IGFzc2lnbmVkUmVxdWVzdElkcyhzY2hlZHVsZSk7XG5cbiAgbGV0IGN1cnJlbnQgPSBzY2hlZHVsZS5tYXAoKGl0ZW0pID0+ICh7IC4uLml0ZW0sIHN0ZXBzOiBbLi4uaXRlbS5zdGVwc10gfSkpO1xuXG4gIGNvbnN0IGZyZWVSZXF1ZXN0cyA9IHJlcXVlc3RzXG4gICAgLmZpbHRlcigocmVxdWVzdCkgPT4gIWFzc2lnbmVkLmhhcyhyZXF1ZXN0LmlkKSlcbiAgICAuc29ydCgoYSwgYikgPT4gcmVxdWVzdFByaW9yaXR5KGIpIC0gcmVxdWVzdFByaW9yaXR5KGEpKTtcblxuICBmb3IgKGNvbnN0IHJlcXVlc3Qgb2YgZnJlZVJlcXVlc3RzKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gYmVzdEluc2VydGlvbihjdXJyZW50LCByZXF1ZXN0LCByZXF1ZXN0c0J5SWQpO1xuICAgIGlmIChjYW5kaWRhdGUgJiYgY2FuZGlkYXRlLnNjb3JlRGVsdGEgPiAwKSB7XG4gICAgICBjdXJyZW50ID0gYXBwbHlJbnNlcnRpb24oY3VycmVudCwgcmVxdWVzdCwgY2FuZGlkYXRlKTtcbiAgICB9XG4gIH1cblxuICBjdXJyZW50ID0gaW1wcm92ZUJ5UmVsb2NhdGlvbihjdXJyZW50LCByZXF1ZXN0c0J5SWQpO1xuICBjdXJyZW50ID0gaW1wcm92ZUJ5UmVsb2NhdGlvbihjdXJyZW50LCByZXF1ZXN0c0J5SWQpO1xuXG4gIG9wdER1ciA9IERhdGUubm93KCkgLSBzdGFydGVkQXQ7XG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmF0ZVNjaGVkdWxlKHNjaGVkdWxlOiBTY2hlZHVsZSk6IG51bWJlciB7XG4gIGNvbnN0IHsgcmVxdWVzdHMgfSA9IGdldFBsYW5uZXJDb250ZXh0KCk7XG4gIGNvbnN0IHJlcXVlc3RzQnlJZCA9IHJlcXVlc3RNYXAocmVxdWVzdHMpO1xuXG4gIGxldCB0b3RhbCA9IDA7XG4gIGZvciAoY29uc3QgaXRlbSBvZiBzY2hlZHVsZSkge1xuICAgIGNvbnN0IGl0ZW1TY29yZSA9IHNhZmVSb3V0ZVNjb3JlKGl0ZW0sIHJlcXVlc3RzQnlJZCk7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoaXRlbVNjb3JlKSkge1xuICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICB9XG4gICAgdG90YWwgKz0gaXRlbVNjb3JlO1xuICB9XG4gIHJldHVybiB0b3RhbDtcbn1cbiIsCiAgICAiXG5pbXBvcnQgdHlwZSB7IExvY2F0aW9uLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBmaW5kUGF0aCwgcGFpcklkIH0gZnJvbSBcIi4uL3BsYW5uZXJcIjtcbmltcG9ydCB7ICB0eXBlIFJvYWRNYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyBkaXYsIHAsIHN0eWxlIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMsIHJlcXVlc3RzLCB0eXBlIEhpZ2hMaWdodCB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInlcIiwgeTEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuXG4gICAgXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIwLjAzXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4geyBlbCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+eyBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yKSB9IH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHRhZ1wiKVxufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcFZpZXcgKHJvYWRtYXA6IFJvYWRNYXAgKSA6IEhUTUxFbGVtZW50IHtcblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCBbaWQxLCByb2Fkc10gb2Ygcm9hZG1hcC5yb2Fkcyl7XG4gICAgZm9yIChsZXQgW2lkMiwgZGlzdF0gb2Ygcm9hZHMpe1xuICAgICAgbGV0IGEgPSByb2FkbWFwLmdlb2xvY2F0aW9uKCBpZDEpIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLmdlb2xvY2F0aW9uKCBpZDIpIVxuICAgICAgbGV0IGxpbmUgPSBta1N2ZyhcImxpbmVcIiwgYS54LCBhLnksIGIueCwgYi55KS5lbFxuICAgICAgbGV0IGlkID0gcGFpcklkKGlkMSwgaWQyKVxuICAgICAgZWxlbWVudHMuc2V0KGlkLCBsaW5lKVxuICAgICAgc291cmNlcy5zZXQobGluZSwgaWQpXG4gICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxpbmUpXG4gICAgfVxuICB9XG4gIFxuICBmb3IgKGxldCBwb2ludCBvZiByb2FkbWFwLnJvYWRzLmtleXMoKSl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAuZ2VvbG9jYXRpb24ocG9pbnQpXG4gICAgbGV0IGNpcmNsZSA9IG1rU3ZnKFwiY2lyY2xlXCIsIGxvYy54LCBsb2MueSkuZWxcbiAgICBlbGVtZW50cy5zZXQocG9pbnQsIGNpcmNsZSlcbiAgICBzb3VyY2VzLnNldChjaXJjbGUsIHBvaW50KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogTG9jYXRpb24gfCBudWxsID0gbnVsbFxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGxldCBuZXh0ID0gcC5sb2NhdGlvblxuICAgICAgICBpZiAobGFzdCl7XG4gICAgICAgICAgbGV0IHBhdGggPSBmaW5kUGF0aChsYXN0LCBuZXh0KS5wYXRoXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKyl7XG4gICAgICAgICAgICBsZXQgQSA9IHJvYWRtYXAuZ2VvbG9jYXRpb24ocGF0aFtpXSEpIVxuICAgICAgICAgICAgbGV0IEIgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHBhdGhbaSsxXSEpIVxuICAgICAgICAgICAgbGV0IGxpbmUgPSBta1N2ZyhcImxpbmVcIiwgQS54LCBBLnksIEIueCwgQi55KVxuICAgICAgICAgICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHAubG9jYXRpb24pXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LCBwb3MueSwgcC5sb2dvKVxuICAgICAgICAgIGVsLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDAwXCIpXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChlbC5lbClcbiAgICAgICAgICBoaW50cy5wdXNoKGVsLmVsKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGxldCBkdiA9IGRpdihzdHlsZSh7d2lkdGg6XCIxMDAlXCIsIGRpc3BsYXk6XCJmbGV4XCIsIGp1c3RpZnlDb250ZW50OlwiY2VudGVyXCIsIHBhZGRpbmc6IFwiMWVtXCJ9KSlcbiAgZHYuYXBwZW5kKGVsZW1lbnQpXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5pbXBvcnQgeyBMb2NhdGlvbiwgcmFuZG9tVVVJRCwgVGltZSwgdWNvbnN0LCBVVUlEIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRvbSB9IGZyb20gXCIuL3JhbmRvbVwiO1xuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbU1hcCAoKXtcblxuICBsZXQgcG9pbnRzIDpMb2NhdGlvbltdID0gW11cblxuICBsZXQgcm9hZHMgPSBuZXcgTWFwPExvY2F0aW9uLCBNYXA8TG9jYXRpb24sIFRpbWU+PiAoKVxuICBsZXQgZ2VvbG9jYXRpb24gPSBuZXcgTWFwPExvY2F0aW9uLCB7eDogbnVtYmVyLCB5OiBudW1iZXJ9PigpXG4gIGxldCBnZW9jb2RlcyA9IG5ldyBNYXA8TG9jYXRpb24sIHN0cmluZz4oKVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspe1xuXG4gICAgbGV0IHBvaW50OiBMb2NhdGlvbiA9IGBsb2Mke3JhbmRvbVVVSUQoKX1gXG4gICAgcG9pbnRzLnB1c2gocG9pbnQpXG4gICAgZ2VvbG9jYXRpb24uc2V0KHBvaW50ICwge3g6IHJhbmRvbSgpLCB5OiByYW5kb20oKX0pXG4gICAgZ2VvY29kZXMuc2V0KHBvaW50LCBgREUgJHtnZW9sb2NhdGlvbi5zaXplLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgXCIwXCIpfWApXG4gICAgcm9hZHMuc2V0KHBvaW50LCBuZXcgTWFwKCkpXG4gIH1cblxuICBmb3IgKGxldCBbSUQsIHBdIG9mIGdlb2xvY2F0aW9uLmVudHJpZXMoKSl7XG4gICAgZ2VvbG9jYXRpb24uZW50cmllcygpLnRvQXJyYXkoKS5zb3J0KChbYSxBXSxbYixCXSk9PiBNYXRoLmh5cG90KEEueCAtIHAueCwgQS55IC0gcC55KSAtIE1hdGguaHlwb3QoQi54IC0gcC54LCBCLnkgLSBwLnkpKVxuICAgIC5zbGljZSgxLDQpLmZvckVhY2goKFtpZCwgbG9jXSk9PntcbiAgICAgIGxldCBkaXN0ID0gdWNvbnN0KE1hdGguaHlwb3QobG9jLnggLSBwLngsIGxvYy55IC0gcC55KSAqIDEwICogNjAgKiA2MCwgXCJzZWNvbmRzXCIpXG4gICAgICByb2Fkcy5nZXQoSUQpIS5zZXQoaWQsIGRpc3QpXG4gICAgICByb2Fkcy5nZXQoaWQpIS5zZXQoSUQsIGRpc3QpXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcm9hZHMsXG4gICAgcG9pbnRzLFxuICAgIGdlb2xvY2F0aW9uKGxvYzogTG9jYXRpb24pe1xuICAgICAgbGV0IGdlbyA9IGdlb2xvY2F0aW9uLmdldChsb2MpXG4gICAgICBpZiAoIWdlbykgdGhyb3cgbmV3IEVycm9yKGBMb2NhdGlvbiAke2xvY30gbm90IGZvdW5kYClcbiAgICAgIHJldHVybiBnZW9cbiAgICB9LFxuICAgIGdlb0NvZGUobG9jOiBMb2NhdGlvbil7XG4gICAgICAgIGxldCBjb2RlID0gZ2VvY29kZXMuZ2V0KGxvYylcbiAgICAgICAgaWYgKCFjb2RlKSB0aHJvdyBuZXcgRXJyb3IoYExvY2F0aW9uICR7bG9jfSBub3QgZm91bmRgKVxuICAgICAgICByZXR1cm4gY29kZVxuICAgICAgfVxuICAgIH1cbn1cblxuXG5leHBvcnQgdHlwZSBSb2FkTWFwID0gdHlwZW9mIHJhbmRvbU1hcCBleHRlbmRzICgpID0+IGluZmVyIFQgPyBUIDogbmV2ZXJcbiIsCiAgICAiaW1wb3J0IHsgTG9jYXRpb24sIFByaWNlLCBSZXF1ZXN0LCBUaW1lLCBVVUlELCB0eXBlIFNjaGVkdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgdHlwZSB7IFJvYWRNYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgdHlwZSB7IEluZmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgYm9yZGVyLCBjb2xvciwgaDMsIGh0bWwsIHBhZGRpbmcsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRyLCB0eXBlIEhUTUxHZW5lcmF0b3IgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cywgcmVxdWVzdHMsIHJvYWRNYXAsIHNjaGVkdWxlIH0gZnJvbSBcIi4vbWFpblwiO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NTdHJpbmcgKGxvYzogSW5mZXI8dHlwZW9mIExvY2F0aW9uPikge1xuICByZXR1cm4gYPCfk40gJHtyb2FkTWFwLmdlb0NvZGUobG9jKSA/PyBcIlVOS1wifWBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zcG9ydGVyU3RyaW5nICh0cmFuOiBVVUlEKSB7XG4gIHJldHVybiBg8J+amyAke3NjaGVkdWxlLmdldCgpLmZpbmRJbmRleChzPT5zLnRyYW5zcG9ydGVyID09IHRyYW4pLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKX1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lU3RyaW5nICh0aW1lOiBUaW1lKXtcbiAgLy8gcmV0dXJuIGAkeygodGltZS52YWx1ZS82MC82MCkudG9GaXhlZCgyKSl9IGhgXG4gIHJldHVybiBgJHtNYXRoLmZsb29yKHRpbWUudmFsdWUvNjAvNjApLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtNYXRoLmZsb29yKCh0aW1lLnZhbHVlLzYwKSU2MCkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWhgXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmljZVN0cmluZyAocHJpY2U6IFByaWNlKXtcbiAgcmV0dXJuIGAke3ByaWNlLnZhbHVlLnRvRml4ZWQoMCl9IOKCrGBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcXVlc3RTdHJpbmcgKGlkOiBVVUlEKSB7XG4gIGxldCByZXEgPSByZXF1ZXN0cy5maW5kKHI9PnIuaWQgPT0gaWQpXG4gIGlmICghcmVxKSByZXR1cm4gXCJVTktcIlxuICByZXR1cm4gYPCfk6YgJHtyZXF1ZXN0cy5maW5kSW5kZXgoeD0+eC5pZCA9PSBpZCkudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpfWBcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0VmlldyAocmVxdWVzdHM6IFJlcXVlc3RbXSwgc2NoZWR1bGU6IFNjaGVkdWxlKTogSFRNTEVsZW1lbnR7XG5cbiAgbGV0IGNlbGwgPSAoKC4uLngpID0+IHRkKHN0eWxlKHtcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICBjdXJzb3I6XCJwb2ludGVyXCIsXG4gICAgd2hpdGVTcGFjZTogXCJub3dyYXBcIixcbiAgfSksIC4uLngpKSBhcyBIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiBcblxuICByZXR1cm4gdGFibGUoXG4gICAgc3R5bGUoeyBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLCB9KSxcblxuICAgIHRyKFtcInJlcXVlc3RcIiwgXCJzdGFydFwiLCBcImVuZFwiLCBcImRpc3RhbnpcIiwgXCJwcmVpc1wiLCBcImZyaXN0XCIgXS5tYXAoaD0+IGNlbGwoaCksICksIHN0eWxlKHtmb250V2VpZ2h0OiBcImJvbGRcIn0pKSxcbiAgICByZXF1ZXN0cy5tYXAoKHIsIGkpPT57XG5cbiAgICAgIGxldCBwYXRoID0gZmluZFBhdGgoci5zdGFydFBvaW50LCByLmVuZFBvaW50KVxuXG4gICAgICBsZXQgcm93PSB0cihcbiAgICAgICAgY2VsbChyZXF1ZXN0U3RyaW5nKHIuaWQpKSxcbiAgICAgICAgY2VsbChsb2NTdHJpbmcoci5zdGFydFBvaW50KSksXG4gICAgICAgIGNlbGwobG9jU3RyaW5nKHIuZW5kUG9pbnQpKSxcbiAgICAgICAgY2VsbChzcGFuKCB0aW1lU3RyaW5nKHBhdGguZGlzdCksIHN0eWxlKHtmbG9hdDogXCJyaWdodFwifSkpKSxcbiAgICAgICAgY2VsbChzcGFuKHByaWNlU3RyaW5nKHIudmFsdWUpLCBzdHlsZSh7ZmxvYXQ6IFwicmlnaHRcIn0pKSksXG4gICAgICAgIGNlbGwoc3Bhbih0aW1lU3RyaW5nKHIuZGVhZGxpbmUpLCBzdHlsZSh7ZmxvYXQ6IFwicmlnaHRcIn0pKSksXG4gICAgICApXG4gICAgICByb3cub25tb3VzZWVudGVyID0gKCk9PntcbiAgICAgICAgcm93LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmdyYXksXG4gICAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHM6IFtcbiAgICAgICAgICB7IGxvY2F0aW9uOiByLnN0YXJ0UG9pbnQsIGxvZ286IFwi8J+TplwiIH0sXG4gICAgICAgICAgeyBsb2NhdGlvbjogci5lbmRQb2ludCwgbG9nbzogXCLwn4+gXCIgfVxuICAgICAgICBdfV0pXG5cbiAgICAgIH1cbiAgICAgIHJvdy5vbm1vdXNlbGVhdmUgPSAoKT0+e1xuICAgICAgICByb3cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJcIlxuICAgICAgfVxuICAgICAgcmV0dXJuIHJvd1xuICAgIH0pXG5cbiAgKVxuXG59IiwKICAgICJpbXBvcnQgdHlwZSB7IEpzb25EYXRhIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5leHBvcnQgZnVuY3Rpb24gbWtXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ICh2YWx1ZTogVCkge1xuXG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQpID0+IHtcbiAgICAgIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgdWNvbnN0LCBpYWRkLCB0eXBlIFNjaGVkdWxlSXRlbSwgdHlwZSBVVUlELCBTY2hlZHVsZVN0ZXAsIFRpbWUsIGFkZCwgUmVxdWVzdCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZ2V0Q29zdCwgb3B0RHVyLCBvcHRpbWl6ZVNjaGVkdWxlLCByYXRlU2NoZWR1bGUgfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgbWtXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IGJhY2tncm91bmQsIGJvZHksIGJvcmRlclJhZGl1cywgYnV0dG9uLCBjb2xvciwgZGl2LCBoMiwgaHRtbCwgcCwgcGFkZGluZywgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdHIsIHdpZHRoIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMsIHJlcXVlc3RzLCByb2FkTWFwLCBzY2hlZHVsZSB9IGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IGxvY1N0cmluZywgcHJpY2VTdHJpbmcsIHJlcXVlc3RTdHJpbmcsIHRpbWVTdHJpbmcsIHRyYW5zcG9ydGVyU3RyaW5nIH0gZnJvbSBcIi4vcmVxdWVzdFZpZXdcIjtcblxuXG5mdW5jdGlvbiBzdGVwTG9nbyAoc3RlcDogU2NoZWR1bGVTdGVwKXtcbiAgaWYgKHN0ZXAuJCA9PSBcInN0YXJ0XCIpIHJldHVybiAn8J+amydcbiAgaWYgKHN0ZXAuJCA9PSBcInBpY2t1cFwiKSByZXR1cm4gJ/Cfk6YnXG4gIGlmIChzdGVwLiQgPT0gXCJkZWxpdmVyXCIpIHJldHVybiAn8J+PoCdcbiAgdGhyb3cgbmV3IEVycm9yKFwidW5leHBlY3RlZCB0YWc6XCIsIHN0ZXApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXF1ZXN0KGlkOiBVVUlEKXtcbiAgbGV0IHJlcSA9IHJlcXVlc3RzLmZpbmQocj0+ci5pZCA9PSBpZClcbiAgaWYgKCFyZXEpIHRocm93IG5ldyBFcnJvcihgbm90IGZvdW5kIHJlcXVlc3QgJHtpZH1gKVxuICByZXR1cm4gcmVxXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGVwUmVxdWVzdChzdGVwOiBTY2hlZHVsZVN0ZXApe1xuICBpZiAoc3RlcC4kID09IFwic3RhcnRcIikgcmV0dXJuIHVuZGVmaW5lZFxuICByZXR1cm4gZ2V0UmVxdWVzdChzdGVwLnZhbC5yZXF1ZXN0KVxufVxuXG5mdW5jdGlvbiBzdGVwU3RyaW5nIChzdGVwOiBTY2hlZHVsZVN0ZXApe1xuXG4gIGlmIChzdGVwLiQgPT0gXCJzdGFydFwiKSByZXR1cm4gYHN0YXJ0YFxuICBsZXQgcmVxID0gZ2V0UmVxdWVzdChzdGVwLnZhbC5yZXF1ZXN0KVxuICByZXR1cm4gYCR7c3RlcC4kfSAke3JlcXVlc3RTdHJpbmcoc3RlcC52YWwucmVxdWVzdCl9OiAke3ByaWNlU3RyaW5nKHJlcS52YWx1ZSl9IGRlYWRsaW5lICR7dGltZVN0cmluZyhyZXEuZGVhZGxpbmUpfWBcbn1cblxubGV0IGN1cnNvciA9IG1rV3JpdGFibGUoe3JvdzogMSwgY29sOiAxfSlcblxuYm9keS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBlPT57XG4gIGN1cnNvci51cGRhdGUoKGN1cnNvcikgPT57XG4gICAgaWYgKGN1cnNvci5jb2wgPT0gLTEpIHJldHVyblxuICAgIGlmIChlLmtleSA9PSBcIkFycm93TGVmdFwiKSAgICAgICAgIGN1cnNvci5jb2wgLT0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dSaWdodFwiKSAgIGN1cnNvci5jb2wgKz0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dVcFwiKSAgICAgIGN1cnNvci5yb3cgLT0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dEb3duXCIpICAgIGN1cnNvci5yb3cgKz0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiRXNjYXBlXCIpICAgICAgIGN1cnNvciA9IHtyb3c6IC0xLCBjb2w6IC0xfVxuICAgIGVsc2UgcmV0dXJuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY3Vyc29yLnJvdyA9IE1hdGgubWF4KDAsIE1hdGgubWluKCBzY2hlZHVsZS5nZXQoKS5sZW5ndGgtMSwgY3Vyc29yLnJvdykpXG4gICAgY3Vyc29yLmNvbCA9IE1hdGgubWF4KDAsIE1hdGgubWluKCBzY2hlZHVsZS5nZXQoKVtjdXJzb3Iucm93XSEuc3RlcHMubGVuZ3RoLTEsIGN1cnNvci5jb2wpKVxuICB9KVxuXG59KVxuXG5cblxuZXhwb3J0IGNvbnN0IHNjaGVkdWxlVmlldyA9ICgpID0+IHtcblxuICBsZXQgY2VsbCA9ICgoLi4ueCkgPT4gdGQoc3R5bGUoe1xuICAgIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZ3JheSlcIixcbiAgICBtYXJnaW46IFwiMFwiLFxuICAgIHBhZGRpbmc6IFwiLjNlbSAuNWVtXCIsXG4gICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICB3aGl0ZVNwYWNlOiBcIm5vd3JhcFwiLFxuICB9KSwgLi4ueCkpIGFzIHR5cGVvZiB0ZDtcblxuICBjb25zdCB0YWJ2aWV3ID0gZGl2KClcbiAgY29uc3QgcmVqZWN0VmlldyA9IGRpdigpXG4gIGNvbnN0IHN0ZXB2aWV3ID0gZGl2KClcbiAgbGV0IHN0ZXBFbHMgPSBbXSBhcyBIVE1MU3BhbkVsZW1lbnRbXVtdXG4gIGxldCByb3dFbHMgPSBbXSBhcyBIVE1MVGFibGVSb3dFbGVtZW50W11cblxuICBsZXQgdGltZXMgOiBUaW1lW11bXSA9IFtdXG5cbiAgbGV0IGRlY2tzIDogW1JlcXVlc3RbXSwgUmVxdWVzdFtdXSBbXSBbXSAgPSBbXVxuXG4gIFxuICBzY2hlZHVsZS5vbnVwZGF0ZShzY2hlZCA9PiB7XG5cbiAgICB0aW1lcyA9IHNjaGVkLm1hcChzPT4gW3Vjb25zdCgwLCBcInNlY29uZHNcIildKVxuICAgIGRlY2tzID0gc2NoZWQubWFwKHM9PiBbW1tdLCBbXV1dKVxuXG5cbiAgICBjdXJzb3Iub251cGRhdGUoY3Vyc29yPT57XG5cbiAgICAgIGxldCB7cm93LCBjb2w6IG59ID0gY3Vyc29yXG5cbiAgICAgIGxldCBzdGVwcyA9IHNjaGVkW3Jvd10hLnN0ZXBzXG4gICAgICBsZXQgc3RlcCA9IHN0ZXBzW25dXG4gICAgICBpZiAoIXN0ZXApIHJldHVyblxuXG4gICAgICBsZXQgcmVxdWVzdCA9IHN0ZXAuJCA9PSBcInN0YXJ0XCIgPyB1bmRlZmluZWQgOiBzdGVwLnZhbC5yZXF1ZXN0XG5cbiAgICAgIHN0ZXBFbHMuZm9yRWFjaCgocm93RWxzLCByb3duKT0+e1xuICAgICAgICByb3dFbHMuZm9yRWFjaCgoZWwsaSk9PntcblxuXG5cbiAgICAgICAgICBsZXQgc3RlcCA9IHNjaGVkW3Jvd25dIS5zdGVwc1tpXVxuICAgICAgICAgIGlmICghc3RlcCkgcmV0dXJuXG4gICAgICAgICAgbGV0IGJvcmRlciA9IGNvbG9yLmJhY2tncm91bmRcbiAgICAgICAgICBpZiAoaSA9PSBuICYmIHJvdyA9PSByb3duKSB7XG4gICAgICAgICAgICBib3JkZXIgPSBjb2xvci5ibHVlIFxuICAgICAgICAgICAgdmlld1N0ZXAocm93LCBuLCBzdGVwdmlldywgdGltZXNbcm93XSFbbl0hLCB0aW1lc1tyb3ddIVt0aW1lc1tyb3ddIS5sZW5ndGgtMV0hLCBkZWNrc1tyb3ddIVtuXSEpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHN0ZXAuJCAhPSBcInN0YXJ0XCIgJiYgc3RlcC52YWwucmVxdWVzdCA9PSByZXF1ZXN0KSBib3JkZXIgPSBjb2xvci5ncmF5XG4gICAgICAgICAgZWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBib3JkZXJcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIGxldCBsb2dvID0gc3RlcExvZ28oc3RlcClcblxuICAgICAgaGlnaHRMaWdodHMuc2V0KFtcbiAgICAgICAgeyBwb2ludHM6IHN0ZXBzLnNsaWNlKG4sbisyKS5tYXAoKHAsaSk9Pih7bG9jYXRpb246IHAudmFsLnBvc30pKSwgY29sb3I6IFwiI2ZmYzk4OFwiIH0sXG4gICAgICAgIHsgcG9pbnRzOiBbe2xvY2F0aW9uOnN0ZXAudmFsLnBvcywgbG9nb31dIH1cbiAgICAgIF0pXG4gICAgfSlcblxuXG5cblxuICAgIHRhYnZpZXcucmVwbGFjZUNoaWxkcmVuKHRhYmxlKFxuICAgICAgW1widHJhbnNwb3J0ZXJcIiwgXCJzdGVwc1wiXS5tYXAoaD0+IGNlbGwoaCksICksIHN0eWxlKHtmb250V2VpZ2h0OiBcImJvbGRcIn0pLFxuICAgICAgc2NoZWQubWFwKChzLCByb3duKT0+e1xuXG4gICAgICAgIGxldCBhbGxQb2ludHMgPSBzLnN0ZXBzLm1hcChzdGVwPT4gKHsgbG9jYXRpb246IHN0ZXAudmFsLnBvcywgbG9nbzogc3RlcExvZ28oc3RlcCkgfSkpXG4gICAgICAgIGxldCB0cmFuc3BvcnQgPSBzcGFuKHRyYW5zcG9ydGVyU3RyaW5nKHMudHJhbnNwb3J0ZXIpKVxuICAgICAgICB0cmFuc3BvcnQub25tb3VzZWVudGVyID0gKCk9PmhpZ2h0TGlnaHRzLnNldChbe3BvaW50czogYWxsUG9pbnRzLCBjb2xvcjogXCIjZmZjOTg4XCIsfV0pXG5cbiAgICAgICAgc3RlcEVscy5wdXNoKCBzLnN0ZXBzLm1hcCgoc3RlcCxpKT0+e1xuICAgICAgICAgIGlmIChpPjApe1xuICAgICAgICAgICAgbGV0IHByZXYgPSBzLnN0ZXBzW2ktMV0hXG4gICAgICAgICAgICBsZXQgZGlzdCA9IGdldENvc3QocHJldi52YWwucG9zLCBzdGVwLnZhbC5wb3MpXG4gICAgICAgICAgICB0aW1lc1tyb3duXSEucHVzaChhZGQodGltZXNbcm93bl0hW2ktMV0hLCBkaXN0KSlcblxuXG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiREVDS1wiLCByb3duLCBpLCBkZWNrc1tyb3duXSFbaS0xXSEpXG4gICAgICAgICAgICBsZXQgZGVjayA9IFsuLi5kZWNrc1tyb3duXSFbaS0xXSFdIGFzIFtSZXF1ZXN0W10sIFJlcXVlc3RbXV1cblxuICAgICAgICAgICAgaWYgKHN0ZXAuJCA9PSBcInBpY2t1cFwiKSBkZWNrW3N0ZXAudmFsLmRlY2tdISA9IFsuLi5kZWNrW3N0ZXAudmFsLmRlY2tdISwgZ2V0UmVxdWVzdChzdGVwLnZhbC5yZXF1ZXN0KV1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0ZXAuJCA9PSBcImRlbGl2ZXJcIikgZGVjayA9IGRlY2subWFwKChkLCBqKT0+IGQuZmlsdGVyKHI9PnIuaWQgIT0gc3RlcC52YWwucmVxdWVzdCkgKSBhcyBbUmVxdWVzdFtdLCBSZXF1ZXN0W11dXG4gICAgICAgICAgICBkZWNrc1tyb3duXSEucHVzaChkZWNrKVxuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRpbWUgPSB0aW1lc1tyb3duXSFbaV0hXG5cbiAgICAgICAgICBsZXQgcmVxID0gc3RlcFJlcXVlc3Qoc3RlcClcblxuICAgICAgICAgIGxldCBsb2dvID0gc3RlcExvZ28oc3RlcClcbiAgICAgICAgICBsZXQgcmVzID0gc3Bhbihsb2dvLCBzdHlsZSh7cGFkZGluZzogXCIuMWVtIC4xZW1cIixcbiAgICAgICAgICAgIGJhY2tncm91bmQ6cmVxICYmIHJlcS5kZWFkbGluZS52YWx1ZSA8IHRpbWUudmFsdWUgPyBjb2xvci5yZWQgOiBcIlwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjAuMmVtIHNvbGlkIFwiICsgY29sb3IuYmFja2dyb3VuZCxcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogXCIwLjNlbVwiLFxuICAgICAgICAgICAgXG4gICAgICAgICAgfSkpXG5cbiAgICAgICAgICByZXMub25jbGljayA9ICgpPT57XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNMSUNLXCIsIHJvd24sIGkpXG4gICAgICAgICAgICBjdXJzb3Iuc2V0KHtyb3c6IHJvd24sIGNvbDogaX0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXNcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbGV0IHJvdz0gdHIoY2VsbCh0cmFuc3BvcnQpLCBjZWxsKHN0ZXBFbHNbcm93bl0hKSlcbiAgICAgICAgcm93RWxzLnB1c2gocm93KVxuICAgICAgICByZXR1cm4gcm93XG4gICAgICB9KSxcbiAgICAgIHN0eWxlKHsgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIiwgfSksXG4gICAgKSk7XG4gICAgbGV0IHJlamVjdHMgPSByZXF1ZXN0cy5maWx0ZXIocj0+IXNjaGVkLmZsYXRNYXAocz0+cy5zdGVwcykuc29tZShzdGVwPT5zdGVwLiQgIT0gXCJzdGFydFwiICYmIHN0ZXAudmFsLnJlcXVlc3QgPT0gci5pZCkpXG5cbiAgICByZWplY3RWaWV3LnJlcGxhY2VDaGlsZHJlbihcblxuICAgICAgcmVqZWN0cy5sZW5ndGggPT0gMCA/IHNwYW4oKSA6IGRpdihcbiAgICAgICAgZGl2KFxuICAgICAgICAgIHAoXCJvcGVuIHJlcXVlc3RzXCIsIHN0eWxlKHtmb250V2VpZ2h0OiBcImJvbGRcIiwgcGFkZGluZzogXCIuM2VtXCIsIG1hcmdpbjogXCIuM2VtXCJ9KSksXG4gICAgICAgICAgcmVqZWN0cy5tYXAocj0+c3BhbihyZXF1ZXN0U3RyaW5nKHIuaWQpLCBzdHlsZSh7cGFkZGluZzogXCIuM2VtXCIsIG1hcmdpbjogXCIuM2VtXCIsIHdoaXRlU3BhY2U6IFwibm93cmFwXCJ9KSkpLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIGRpc3BsYXk6IFwicm93XCIsXG4gICAgICAgICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgICAgICAgcGFkZGluZzogXCIuNWVtXCIsXG4gICAgICAgICAgICBtYXJnaW5Ub3A6IFwiLjVlbVwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG4gIH0pXG5cbiAgbGV0IHZhbHVlID0gc3BhbigpXG4gIHNjaGVkdWxlLm9udXBkYXRlKHNjaD0+dmFsdWUudGV4dENvbnRlbnQgPSByYXRlU2NoZWR1bGUoc2NoKS50b0ZpeGVkKDIpKVxuXG5cbiAgbGV0IHNjaGVkdWxlRWwgPSBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgd2lkdGg6IFwiY2FsYygxMDAlIC0gMmVtKVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIG92ZXJmbG93OiBcImF1dG9cIixcbiAgICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICAgIHBhZGRpbmc6IFwiLjVlbVwiLFxuICAgIH0pLFxuICAgIHRhYnZpZXcsXG4gICAgcmVqZWN0VmlldyxcbiAgICBwKFwiVmFsdWU6IFwiLCB2YWx1ZSksXG4gICAgcChcInNlYXJjaCB0aW1lOlwiLCBvcHREdXIpLFxuICAgIHN0ZXB2aWV3LFxuICApXG4gIHJldHVybiBzY2hlZHVsZUVsXG59XG5cblxuXG5mdW5jdGlvbiB2aWV3U3RlcChyb3c6IG51bWJlciwgbjogbnVtYmVyLCBwYXJlbnQ6IEhUTUxFbGVtZW50LCBkaXN0OiBUaW1lLCB0b3RhbDogVGltZSwgZGVja3M6IFtSZXF1ZXN0W10sIFJlcXVlc3RbXV0pe1xuICBsZXQgc3RlcHMgPSBzY2hlZHVsZS5nZXQoKVtyb3ddXG4gIGlmICghc3RlcHMpIHJldHVyblxuICBsZXQgc3RlcCA9IHN0ZXBzLnN0ZXBzW25dXG4gIGlmICghc3RlcCkgcmV0dXJuXG5cbiAgLy8gbGV0IGRlY2tzID0gW1tdLFtdXSBhcyBbVVVJRFtdLCBVVUlEW11dXG5cbiAgbGV0IHZpc3VhbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpXG4gIHZpc3VhbC5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblxuICB2aXN1YWwuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIi0wLjEgLTAuMSAxLjIgMS4yXCIpXG4gIHZpc3VhbC5zZXRBdHRyaWJ1dGUoXCJwcmVzZXJ2ZUFzcGVjdFJhdGlvXCIsIFwieE1pZFlNaWQgbWVldFwiKVxuXG4gIGxldCB0cmFuc3BvcnRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicG9seWdvblwiKVxuICBsZXQgcG9pbnRzID0gWyBbLjIsIDBdLCBbLjAsIC4yXSwgWy4wLCAuNF0sIFsuMiwgLjRdLCBbLjgsIC40XSwgWy44LCAuMzddLCBbLjIsIC4zN10sIFsuMiwgLjJdLCBbLjgsIC4yXSwgWy44LCAuMTddLCBbLjIsIC4xN10sXVxuICB0cmFuc3BvcnRlci5zZXRBdHRyaWJ1dGUoXCJwb2ludHNcIiwgcG9pbnRzLm1hcChwPT5wLmpvaW4oXCIsXCIpKS5qb2luKFwiIFwiKSlcbiAgdHJhbnNwb3J0ZXIuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5ibHVlKVxuXG4gIHZpc3VhbC5hcHBlbmRDaGlsZCh0cmFuc3BvcnRlcilcblxuICBkZWNrcy5mb3JFYWNoKChkZWNrLCBpKT0+e1xuICAgIGRlY2suZm9yRWFjaCgocmVxLCBqKT0+e1xuICAgICAgbGV0IGNhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicmVjdFwiKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcInhcIiwgKDAuMjI1ICsgLjIgKiBqKS50b1N0cmluZygpKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcInlcIiwgKDAuMjUgLSAwLjIgICogaSkudG9TdHJpbmcoKSlcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIi4xNVwiKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjAuMTJcIilcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmdyYXkpXG4gICAgICB2aXN1YWwuYXBwZW5kQ2hpbGQoY2FyKVxuXG4gICAgICBsZXQgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwidGV4dFwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ4XCIsICgwLjIyNSArIC4yICogaiArIDAuMDc1KS50b1N0cmluZygpKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ5XCIsICgwLjI3IC0gMC4yICogaSArIDAuMDUpLnRvU3RyaW5nKCkpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImZvbnQtc2l6ZVwiLCBcIi4wNFwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmNvbG9yKVxuICAgICAgdGV4dC50ZXh0Q29udGVudCA9IGAke3JlcXVlc3RTdHJpbmcocmVxLmlkKX1gXG4gICAgICB2aXN1YWwuYXBwZW5kQ2hpbGQodGV4dClcbiAgICAgIFxuICAgIH0pXG4gIH0pXG5cbiAgZm9yIChsZXQgeCBvZiBbMC4yLCAwLjZdKXtcbiAgICBsZXQgdGlyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwiY2lyY2xlXCIpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4LnRvU3RyaW5nKCkpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJjeVwiLCBcIjAuNVwiKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDdcIilcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuYmx1ZSlcbiAgICB2aXN1YWwuYXBwZW5kQ2hpbGQodGlyZSlcbiAgfVxuXG5cblxuICBsZXQgZGVhZCA9IHN0ZXAuJCAhPSBcInN0YXJ0XCIgJiYgZ2V0UmVxdWVzdChzdGVwLnZhbC5yZXF1ZXN0KS5kZWFkbGluZS52YWx1ZSA8IGRpc3QudmFsdWVcblxuICBsZXQgcmVzID0gZGl2KFxuICAgIGgyKHRyYW5zcG9ydGVyU3RyaW5nKHN0ZXBzLnRyYW5zcG9ydGVyKSksXG4gICAgcChgJHt0aW1lU3RyaW5nKGRpc3QpfSAvICR7dGltZVN0cmluZyh0b3RhbCl9YCksXG4gICAgcChzdGVwU3RyaW5nKHN0ZXApLCBzdHlsZSh7Y29sb3I6IGRlYWQgPyBjb2xvci5yZWQgOiBjb2xvci5jb2xvcn0pKSxcbiAgICBzdHlsZSh7XG4gICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgICBtYXJnaW46IFwiMFwiLFxuICAgICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICAgIG1pbkhlaWdodDogXCIyZW1cIixcbiAgICB9KVxuICApXG5cbiAgcmVzLmFwcGVuZCh2aXN1YWwpXG4gIHBhcmVudC5yZXBsYWNlQ2hpbGRyZW4ocmVzKVxufVxuIiwKICAgICJpbXBvcnQgeyBoYXNoIH0gZnJvbSBcIi4uL2hhc2hcIjtcbmltcG9ydCB7IGJvZHksIGJ1dHRvbiwgY29sb3IsIGRpdiwgZXJyb3Jwb3B1cCwgaDEsIGgyLCBoMywgaW5wdXQsIG1hcmdpbiwgcCwgcGFkZGluZywgcG9wdXAsIHByZSwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB3aWR0aCwgdGV4dGFyZWEsIGEsIGJvcmRlciwgaHRtbCwgdGgsIHRyLCB0ZCwgYm9yZGVyUmFkaXVzLCBwYW5lbExpc3QsIGRpc3BsYXksIGJhY2tncm91bmQgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBtYXBWaWV3IH0gZnJvbSBcIi4vbWFwVmlld1wiO1xuaW1wb3J0IHsgcmFuZG9tTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgTG9jYXRpb24sIHJhbmRvbVVVSUQsIFJlcXVlc3QsIFNjaGVkdWxlLCB1Y29uc3QsIFVVSUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IHJlcXVlc3RWaWV3IH0gZnJvbSBcIi4vcmVxdWVzdFZpZXdcIjtcbmltcG9ydCB7IHNjaGVkdWxlVmlldyB9IGZyb20gXCIuL3NjaGVkdWxlVmlld1wiO1xuaW1wb3J0IHsgbWtXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IGNvbmZpZ3VyZVBsYW5uZXIsIG9wdGltaXplU2NoZWR1bGUgfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZG9tLCBzZXRSYW5kU2VlZCB9IGZyb20gXCIuLi9yYW5kb21cIjtcblxuXG5jb25zdCBMS1dfQ09VTlQgPSAzO1xuY29uc3QgUkVRVUVTVF9DT1VOVCA9IDIwO1xuXG5ib2R5LnN0eWxlLm1hcmdpbiA9IFwiMFwiXG5cbmxldCBoZWFkZXIgPSBoMShcInJvdXRlIHBsYW5uZXJcIiwgc3R5bGUoe2JhY2tncm91bmQ6IGNvbG9yLmJsdWUsIGNvbG9yOiBjb2xvci5iYWNrZ3JvdW5kLCBtYXJnaW46IFwiMFwiLCBwYWRkaW5nOiBcIi42ZW1cIn0pKVxuXG5sZXQgY29udGVudFNwYWNlID0gZGl2KHN0eWxlKHtcbiAgZGlzcGxheTpcImZsZXhcIixcbiAgZmxleERpcmVjdGlvbjpcInJvd1wiLFxuICB3aWR0aDogXCIxMDAlXCIsXG4gIGhlaWdodDogXCJjYWxjKDEwMCUgLSAyLjVlbSlcIixcbiAgbWluV2lkdGg6IFwiMFwiLFxufSkpXG5cbmxldCBwYWdlID0gZGl2KFxuICBzdHlsZSh7ZGlzcGxheTpcImZsZXhcIiwgZmxleERpcmVjdGlvbjpcImNvbHVtblwiLCBoZWlnaHQ6IFwiMTAwJVwifSksXG4gIGhlYWRlcixcbiAgY29udGVudFNwYWNlXG4pXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKHBhZ2UpXG5cblxuc2V0UmFuZFNlZWQoMjUpXG5cblxuZXhwb3J0IGxldCByb2FkTWFwID0gcmFuZG9tTWFwKClcblxuZXhwb3J0IGxldCByZXF1ZXN0czogUmVxdWVzdFtdID0gQXJyYXkuZnJvbSh7bGVuZ3RoOlJFUVVFU1RfQ09VTlR9LCAoXyxpKT0+KHtcbiAgaWQ6IHJhbmRvbVVVSUQoKSxcbiAgc3RhcnRQb2ludDogcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyksXG4gIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRNYXAucG9pbnRzKSxcbiAgdmFsdWU6IHVjb25zdChNYXRoLmZsb29yKHJhbmRvbSgpKjEwMDApLCBcImV1clwiKSxcbiAgZGVhZGxpbmU6IHVjb25zdChNYXRoLmZsb29yKHJhbmRvbSgpKjYwKjYwKjI0KjcpLCBcInNlY29uZHNcIiksXG59KSlcblxuXG5leHBvcnQgbGV0IHNjaGVkdWxlID0gbWtXcml0YWJsZTxTY2hlZHVsZT4gKEFycmF5LmZyb20oe2xlbmd0aDogTEtXX0NPVU5UfSwgKF8saSk9Pih7XG4gIHRyYW5zcG9ydGVyOiByYW5kb21VVUlEKCksXG4gIHN0ZXBzOiBbeyAkOlwic3RhcnRcIiwgdmFsOiB7XCJwb3NcIjogIHJhbmRDaG9pY2Uocm9hZE1hcC5wb2ludHMpfX1dXG59KSkpXG5cbmNvbmZpZ3VyZVBsYW5uZXIoeyByZXF1ZXN0cywgcm9hZE1hcCB9KVxuXG5zY2hlZHVsZS51cGRhdGUoc2NoZWQ9Pm9wdGltaXplU2NoZWR1bGUocmVxdWVzdHMsIHNjaGVkKSlcblxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIGxvY2F0aW9uOiBMb2NhdGlvbixcbiAgICBsb2dvPyA6IHN0cmluZyxcbiAgfVtdLFxuICBjb2xvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgbGV0IGhpZ2h0TGlnaHRzID0gbWtXcml0YWJsZSA8SGlnaExpZ2h0W10+KCBbXSApXG5cblxuZnVuY3Rpb24gbWtXaW5kb3cgKHRhYjogbnVtYmVyID0gMCApIHtcblxuICBsZXQgdGFiRmllbGRzID0gW1xuICAgIFsnbWFwJywgbWFwVmlldyhyb2FkTWFwKV0sXG4gICAgWydyZXF1ZXN0cycsIHJlcXVlc3RWaWV3KHJlcXVlc3RzLCBzY2hlZHVsZS5nZXQoKSldLFxuICAgIFsnc2NoZWR1bGUnLCBzY2hlZHVsZVZpZXcoKSBdLFxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgcCh0YWJGaWVsZHMubWFwKChbbixlXSk9PlxuICAgICAgICBzcGFuKCBuLFxuICAgICAgICAgICgpPT5vcGVuVGFiKG4pLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjNlbVwiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIi4zZW1cIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiKyAobj09dGFiID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5KSxcbiAgICAgICAgICAgIGNvbG9yOiAobj09dGFiKSA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApKSxcbiAgICAgIHRhYkZpZWxkcy5maW5kKChbbixdKT0+bj09dGFiKSFbMV1cbiAgICApXG4gIH1cblxuXG4gIG9wZW5UYWIodGFiRmllbGRzW3RhYl0hWzBdKVxuXG4gIHJldHVybiBlbFxufVxuXG5jb250ZW50U3BhY2UucmVwbGFjZUNoaWxkcmVuKG1rV2luZG93KDIgKSwgbWtXaW5kb3coKSlcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFFTyxJQUFNLE9BQU8sU0FBUztBQUU3QixJQUFNLGVBQWU7QUFBQSxFQUNuQixPQUFNO0FBQUEsSUFDSixPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsRUFDckI7QUFBQSxFQUNBLE1BQUs7QUFBQSxJQUNILE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNuQixLQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxFQUNyQjtBQUNGO0FBRU8sSUFBTSxRQUFRO0FBQUEsRUFDbkIsT0FBTztBQUFBLEVBQ1AsWUFBWTtBQUFBLEVBQ1osTUFBTTtBQUFBLEVBQ04sV0FBVztBQUFBLEVBQ1gsS0FBSztBQUFBLEVBQ0wsT0FBTztBQUFBLEVBQ1AsTUFBTTtBQUFBLEVBQ04sV0FBVztBQUNiO0FBR0EsSUFBSSxPQUFPLFNBQVMsY0FBYyxP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LFVBQVU7QUFBQSxFQUNaLENBQUMsQ0FBQztBQUFBLEVBRUYsU0FBUyxPQUFPLENBQUMsTUFBa0M7QUFBQSxJQUNqRCxHQUFHLGdCQUNELEVBQUUsVUFBVSxJQUFJLEVBQUUsR0FBRSxPQUNsQixLQUFNLEdBQ0osTUFBSSxRQUFRLENBQUMsR0FDYixNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixRQUFRLGdCQUFlLEtBQUcsT0FBTSxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ3BELE9BQVEsS0FBRyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQUEsSUFDeEMsQ0FBQyxDQUNILENBQ0YsQ0FBQyxHQUNELFVBQVUsS0FBSyxFQUFFLE9BQU0sS0FBRyxJQUFHLEVBQUcsRUFDbEM7QUFBQTtBQUFBLEVBSUYsUUFBUSxVQUFVLEtBQU0sRUFBRTtBQUFBLEVBRTFCLE9BQU87QUFBQTtBQUdULGFBQWEsZ0JBQWdCLFNBQVMsQ0FBRSxHQUFHLFNBQVMsQ0FBQzsiLAogICJkZWJ1Z0lkIjogIjJEQjA1N0UyNjRDMTUyMDM2NDc1NkUyMTY0NzU2RTIxIiwKICAibmFtZXMiOiBbXQp9
