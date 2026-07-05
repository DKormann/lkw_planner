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
  schedule.onupdate((sched) => {
    times = sched.map((s) => [uconst(0, "seconds")]);
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
            viewStep(row, n, stepview, times[row][n], times[row][times[row].length - 1]);
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
function viewStep(row, n, parent, dist, total) {
  let steps = schedule.get()[row];
  if (!steps)
    return;
  let step = steps.steps[n];
  if (!step)
    return;
  let decks = [[], []];
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
      text.setAttribute("font-size", ".06");
      text.setAttribute("fill", color.color);
      text.textContent = `${requests2.findIndex((r) => r.id == req).toString().padStart(4, "0")}`;
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
var requests2 = Array.from({ length: 20 }, (_, i) => ({
  id: randomUUID(),
  startPoint: randChoice(roadMap.points),
  endPoint: randChoice(roadMap.points),
  value: uconst(Math.floor(random() * 1000), "eur"),
  deadline: uconst(Math.floor(random() * 60 * 60 * 24 * 7), "seconds")
}));
var schedule = mkWritable(Array.from({ length: 3 }, (_, i) => ({
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

//# debugId=FEB89ED3330110F464756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvcmFuZG9tLnRzIiwgInNyYy9zY2hlbWEudHMiLCAic3JjL3R5cGVzLnRzIiwgInNyYy9wbGFubmVyLnRzIiwgInNyYy92aWV3L21hcFZpZXcudHMiLCAic3JjL3JhbmRvbU1hcC50cyIsICJzcmMvdmlldy9yZXF1ZXN0Vmlldy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy92aWV3L3NjaGVkdWxlVmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSgpe1xuICBsZXQgeCA9IE1hdGguc2luKFJBTkRTRUVEKyspICogMTAwMDA7XG4gIHJldHVybiB4IC0gTWF0aC5mbG9vcih4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRJbnQobWluOiBudW1iZXIsIG1heDogbnVtYmVyKXtcbiAgcmV0dXJuIE1hdGguZmxvb3IocmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoLTEpXSFcbn1cblxuXG4iLAogICAgImltcG9ydCB7IHZhbGlkYXRlSnNvblNjaGVtYSB9IGZyb20gXCIuL2pzb25zY2hlbWFcIlxuXG5cbmV4cG9ydCB0eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25EYXRhIH1cblxuXG5leHBvcnQgdHlwZSBKc29uRGF0YSA9IHN0cmluZyB8IG51bGwgfCBudW1iZXIgfCBib29sZWFuIHwgeyBba2V5IGluIHN0cmluZ106IEpzb25EYXRhIH0gfCBKc29uRGF0YVtdXG5cbmV4cG9ydCB0eXBlIFNjaGVtYTxUPiA9IHsganNvbjogSlNPTlNjaGVtYSB9XG5cbmV4cG9ydCB0eXBlIEluZmVyPFM+ID0gUyBleHRlbmRzIFNjaGVtYTxpbmZlciBUPiA/IFQgOiBuZXZlclxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGUgPSA8VD4gKHNjaGVtYTogU2NoZW1hPFQ+LCBkYXRhOnVua25vd24pIDogVCA9PiB7XG4gIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4oc2NoZW1hLmpzb24sIGRhdGEpXG59XG5cbmV4cG9ydCBjb25zdCBzdHJpbmdpZnkgPSAoZGF0YTogSnNvbkRhdGEpOiBzdHJpbmcgPT4gSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMilcblxuXG5leHBvcnQgY29uc3QgZmlsbFNjaGVtYSA9IDxUPihzY2hlbWE6IFNjaGVtYTxUPikgOiBUID0+e1xuICBsZXQganNvbiA9IHNjaGVtYS5qc29uXG4gIGlmIChqc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwiXCIgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVtYmVyXCIpIHJldHVybiAwIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcImJvb2xlYW5cIikgcmV0dXJuIGZhbHNlIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIG51bGwgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYXJyYXlcIikgcmV0dXJuIFtdIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm9iamVjdFwiICYmIGpzb24ucHJvcGVydGllcyl7XG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fVxuICAgIGxldCByZXF1aXJlZCA9IEFycmF5LmlzQXJyYXkoanNvbi5yZXF1aXJlZCkgPyBqc29uLnJlcXVpcmVkIGFzIHN0cmluZ1tdIDogW11cbiAgICBmb3IgKGxldCByZXEgb2YgcmVxdWlyZWQpXG4gICAgICByZXN1bHRbcmVxXSA9IGZpbGxTY2hlbWEoe2pzb246IChqc29uLnByb3BlcnRpZXMgYXMgYW55KVtyZXFdfSlcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBqc29uKSByZXR1cm4ganNvbi5jb25zdCBhcyBUXG4gIGlmIChcImFueU9mXCIgaW4ganNvbiAmJiBBcnJheS5pc0FycmF5KGpzb24uYW55T2YpKSByZXR1cm4gZmlsbFNjaGVtYSh7anNvbjoganNvbi5hbnlPZlswXSBhcyBKU09OU2NoZW1hfSkgYXMgVFxuICByZXR1cm4gbnVsbCBhcyBUXG59XG5cbmV4cG9ydCBjb25zdCBmcm9tSnNvblNjaGVtYSA9IDxUPiAoanNvbjogSlNPTlNjaGVtYSk6IFNjaGVtYTxUPiA9PiAoe2pzb259KVxuXG5leHBvcnQgY29uc3Qgc3RyaW5nOiBTY2hlbWE8c3RyaW5nPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcInN0cmluZ1wifSlcbmV4cG9ydCBjb25zdCBudW1iZXI6IFNjaGVtYTxudW1iZXI+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVtYmVyXCJ9KVxuZXhwb3J0IGNvbnN0IGJvb2xlYW46IFNjaGVtYTxib29sZWFuPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImJvb2xlYW5cIn0pXG5leHBvcnQgY29uc3QgbnVsbFNjaGVtYSA6IFNjaGVtYTxudWxsPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm51bGxcIn0pXG5leHBvcnQgY29uc3QgYW55OiBTY2hlbWE8YW55PiA9IGZyb21Kc29uU2NoZW1hKHt9KVxuZXhwb3J0IGNvbnN0IG9wdGlvbmFsID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFNjaGVtYTxUIHwgbnVsbD4gPT4gZnJvbUpzb25TY2hlbWEoe2FueU9mOiBbe3R5cGU6IFwibnVsbFwifSwgc2NoZW1hLmpzb25dfSlcbmV4cG9ydCBjb25zdCBhcnJheSA9IDxUPihpdGVtU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8VFtdPiA9PiBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJhcnJheVwiLCBpdGVtczogaXRlbVNjaGVtYS5qc29ufSlcbmV4cG9ydCBjb25zdCBjb25zdGFudCA9IDxUIGV4dGVuZHMgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbj4odmFsdWU6IFQpOiBTY2hlbWE8VD4gPT4gZnJvbUpzb25TY2hlbWEoe2NvbnN0OiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBvYmplY3QgPSA8UyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIFNjaGVtYTxhbnk+Pj4gKHNoYXBlOiBTKTogU2NoZW1hPHtbSyBpbiBrZXlvZiBTXTogSW5mZXI8U1tLXT59PiA9PiBmcm9tSnNvblNjaGVtYSh7XG4gIHR5cGU6IFwib2JqZWN0XCIsXG4gIHByb3BlcnRpZXM6IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyhzaGFwZSkubWFwKChba2V5LCBmaWVsZF0pPT4gW2tleSwgZmllbGQuanNvbl0pKSxcbiAgcmVxdWlyZWQ6IE9iamVjdC5rZXlzKHNoYXBlKVxufSlcblxuZXhwb3J0IGNvbnN0IHJlY29yZCA9IDxUPih2YWx1ZVNjaGVtYTogU2NoZW1hPFQ+KTogU2NoZW1hPFJlY29yZDxzdHJpbmcsIFQ+PiA9PiBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJvYmplY3RcIiwgYWRkaXRpb25hbFByb3BlcnRpZXM6IHZhbHVlU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IHNjaGVtYVNjaGVtYSA6IFNjaGVtYTxKU09OU2NoZW1hPiA9IHJlY29yZChhbnkpXG5cbmV4cG9ydCBjb25zdCB1bmlvbiA9IDxTIGV4dGVuZHMgU2NoZW1hPGFueT5bXT4oLi4uc2NoZW1hczogUyk6IFNjaGVtYTxJbmZlcjxTW251bWJlcl0+PiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IHNjaGVtYXMubWFwKHM9PiBzLmpzb24pfSlcblxuZXhwb3J0IGZ1bmN0aW9uIHRhZ2dlZCA8UyBleHRlbmRzIHtba2V5IDogc3RyaW5nXTogU2NoZW1hPGFueT59PiAoZmllbGRzOiBTKSA6IFNjaGVtYTx7W2tleSBpbiBrZXlvZiBTXTogeyQ6IGtleSwgdmFsOkluZmVyPFNba2V5XT59IH1ba2V5b2YgU10+IHtcbiAgcmV0dXJuIHVuaW9uKC4uLk9iamVjdC5lbnRyaWVzKGZpZWxkcykubWFwKChbJCx2YWxdKT0+b2JqZWN0KHskOmNvbnN0YW50KCQpLHZhbH0pKSlcbn1cblxuXG5cblxuZXhwb3J0IGNvbnN0IGludGVyc2VjdGlvbiA9IDxTIGV4dGVuZHMgU2NoZW1hPGFueT5bXT4oLi4uc2NoZW1hczogUyk6IFNjaGVtYTxJbmZlcjxTW251bWJlcl0+PiA9PiBmcm9tSnNvblNjaGVtYSh7YWxsT2Y6IHNjaGVtYXMubWFwKHM9PiBzLmpzb24pfSlcblxuZXhwb3J0IGNvbnN0IGFzVHlwZVZpZXcgPSAoc2NoZW1hOiBTY2hlbWE8YW55Pik6IHN0cmluZyA9PiB7XG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBcInN0cmluZ1wiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwibnVtYmVyXCIpIHJldHVybiBcIm51bWJlclwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gXCJib29sZWFuXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudWxsXCIpIHJldHVybiBcIm51bGxcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcImFycmF5XCIgJiYgc2NoZW1hLmpzb24uaXRlbXMpIHJldHVybiBgJHthc1R5cGVWaWV3KHtqc29uOiBzY2hlbWEuanNvbi5pdGVtcyBhcyBKU09OU2NoZW1hfSl9W11gXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYgc2NoZW1hLmpzb24ucHJvcGVydGllcyl7XG4gICAgbGV0IHByb3BzID0gT2JqZWN0LmVudHJpZXMoc2NoZW1hLmpzb24ucHJvcGVydGllcykubWFwKChba2V5LCBwcm9wXSk9PiBgJHtrZXl9OiAke2FzVHlwZVZpZXcoe2pzb246IHByb3AgYXMgSlNPTlNjaGVtYX0pfWApXG4gICAgcmV0dXJuIGB7XFxuICAke3Byb3BzLmpvaW4oXCIsXFxuXCIpLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCJcXG4gIFwiKX1cXG59YFxuICB9XG4gIGlmIChcImNvbnN0XCIgaW4gc2NoZW1hLmpzb24pIHJldHVybiBKU09OLnN0cmluZ2lmeShzY2hlbWEuanNvbi5jb25zdClcbiAgaWYgKFwiYW55T2ZcIiBpbiBzY2hlbWEuanNvbiAmJiBBcnJheS5pc0FycmF5KHNjaGVtYS5qc29uLmFueU9mKSkgcmV0dXJuIHNjaGVtYS5qc29uLmFueU9mLm1hcChzPT4gYXNUeXBlVmlldyh7anNvbjogcyBhcyBKU09OU2NoZW1hfSkpLmpvaW4oXCIgfCBcIilcbiAgcmV0dXJuIFwiYW55XCJcbn1cblxuXG5cbmV4cG9ydCBjbGFzcyBMb2NhbFN0b3JlZCA8VCBleHRlbmRzIEpzb25EYXRhPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBrZXk6IHN0cmluZywgcHVibGljIHNjaGVtYTogU2NoZW1hPFQ+LCBwdWJsaWMgZGVmYXVsdFZhbHVlOiBUKXt9XG5cbiAgZ2V0KCk6VCB7XG4gICAgbGV0IHJhdyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMua2V5KVxuICAgIHRyeXtcbiAgICAgIHJldHVybiB2YWxpZGF0ZSh0aGlzLnNjaGVtYSwgSlNPTi5wYXJzZShyYXchKSlcbiAgICB9Y2F0Y2goZSl7XG4gICAgICByZXR1cm4gdGhpcy5kZWZhdWx0VmFsdWVcbiAgICB9XG4gIH1cbiAgc2V0KHZhbHVlOiBUKXtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLmtleSwgSlNPTi5zdHJpbmdpZnkodmFsaWRhdGUodGhpcy5zY2hlbWEsIHZhbHVlKSkpXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cblxuZXhwb3J0IHR5cGUgVVVJRCA9IGB1JHtzdHJpbmd9LSR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBVVUlEIDogU2NoZW1hPFVVSUQ+ID0gc3RyaW5nXG5cblxuZXhwb3J0IHR5cGUgVW5pdCA8cyBleHRlbmRzIHN0cmluZz4gPSB7dmFsdWU6IG51bWJlciwgdW5pdDogc31cbmV4cG9ydCBjb25zdCBVbml0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHVuaXQ6IHMpID0+IG9iamVjdCh7dmFsdWU6IG51bWJlciwgdW5pdDogY29uc3RhbnQodW5pdCl9KVxuXG5leHBvcnQgY29uc3QgdWNvbnN0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHZhbHVlOiBudW1iZXIsIHVuaXQ6IHMpIDogVW5pdDxzPiA9PiAoe3ZhbHVlLCB1bml0fSlcbmV4cG9ydCBjb25zdCBhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgOiBVbml0PHM+ID0+ICh7dmFsdWU6IGEudmFsdWUgKyBiLnZhbHVlLCB1bml0OiBhLnVuaXR9KVxuZXhwb3J0IGNvbnN0IGlhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgPT4ge2EudmFsdWUgKz0gYi52YWx1ZX1cblxuZXhwb3J0IGNvbnN0IHN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA6IFVuaXQ8cz4gPT4gKHt2YWx1ZTogYS52YWx1ZSAtIGIudmFsdWUsIHVuaXQ6IGEudW5pdH0pXG5leHBvcnQgY29uc3QgaXN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA9PiB7YS52YWx1ZSAtPSBiLnZhbHVlfVxuZXhwb3J0IGNvbnN0IG11bCA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBudW1iZXIpIDogVW5pdDxzPiA9PiAoe3ZhbHVlOiBhLnZhbHVlICogYiwgdW5pdDogYS51bml0fSlcblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5leHBvcnQgY29uc3QgUHJpY2UgPSBVbml0KFwiZXVyXCIpXG5leHBvcnQgY29uc3QgVGltZSA9IFVuaXQoXCJzZWNvbmRzXCIpXG5leHBvcnQgdHlwZSBQcmljZSA9IFVuaXQ8XCJldXJcIj5cbmV4cG9ydCB0eXBlIFRpbWUgPSBVbml0PFwic2Vjb25kc1wiPlxuXG5cbmV4cG9ydCB0eXBlIExvY2F0aW9uID0gYGxvYyR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBMb2NhdGlvbiA6IFNjaGVtYTxMb2NhdGlvbj4gPSBzdHJpbmdcblxuZXhwb3J0IGNvbnN0IFJlcXVlc3QgPSBvYmplY3Qoe1xuICBpZDogVVVJRCxcbiAgc3RhcnRQb2ludDogTG9jYXRpb24sXG4gIGVuZFBvaW50OiBMb2NhdGlvbixcbiAgdmFsdWU6IFByaWNlLFxuICBkZWFkbGluZTogVGltZSxcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IExvY2F0aW9uLCBkZWNrOiB1bmlvbihjb25zdGFudCgwKSwgY29uc3RhbnQoMSkpfSksXG4gIGRlbGl2ZXI6IG9iamVjdCh7cmVxdWVzdDogVVVJRCwgcG9zOiBMb2NhdGlvbn0pLFxuICBzdGFydDogb2JqZWN0KHtwb3M6IExvY2F0aW9ufSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cbmV4cG9ydCBjb25zdCBNb2R1bGUgPSBvYmplY3Qoe1xuXG4gIHJlcXVlc3RzOiBhcnJheShSZXF1ZXN0KSxcbiAgdHJhbnNwb3J0ZXJzOiBhcnJheShUcmFuc3BvcnRlciksXG4gIHNjaGVkdWxlOiBTY2hlZHVsZSxcblxufSlcblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG4iLAogICAgImltcG9ydCB7IFRpbWUsIGFkZCwgaWFkZCwgaXN1YiwgbXVsLCB1Y29uc3QsIHR5cGUgTG9jYXRpb24sIHR5cGUgUmVxdWVzdCwgdHlwZSBTY2hlZHVsZSwgdHlwZSBTY2hlZHVsZUl0ZW0sIHR5cGUgU2NoZWR1bGVTdGVwLCB0eXBlIFVVSUQgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBSb2FkTWFwIH0gZnJvbSBcIi4vcmFuZG9tTWFwXCI7XG5cbmNvbnN0IERFQ0tDQVBBQ0lUWSA9IDM7XG5jb25zdCBVTkxPQURDT1NUID0gdWNvbnN0KDEwLCBcImV1clwiKTtcbmNvbnN0IFBJQ0tVUENPU1QgPSB1Y29uc3QoNSwgXCJldXJcIik7XG5jb25zdCBDT1NUX1BFUl9IID0gNTtcbmNvbnN0IENPU1RfUEVSX1NFQ09ORCA9IENPU1RfUEVSX0ggLyAzNjAwO1xuXG50eXBlIFBsYW5uZXJDb250ZXh0ID0ge1xuICByZXF1ZXN0czogUmVxdWVzdFtdO1xuICByb2FkTWFwOiBSb2FkTWFwO1xufTtcblxudHlwZSBJbnNlcnRpb25DYW5kaWRhdGUgPSB7XG4gIGl0ZW1JbmRleDogbnVtYmVyO1xuICBwaWNrSW5kZXg6IG51bWJlcjtcbiAgZHJvcEluZGV4OiBudW1iZXI7XG4gIGRlY2s6IDAgfCAxO1xuICBzY29yZURlbHRhOiBudW1iZXI7XG59O1xuXG5sZXQgcGxhbm5lckNvbnRleHQ6IFBsYW5uZXJDb250ZXh0IHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmVQbGFubmVyKGNvbnRleHQ6IFBsYW5uZXJDb250ZXh0KSB7XG4gIHBsYW5uZXJDb250ZXh0ID0gY29udGV4dDtcbiAgQ29zdE1hdHJpeC5jbGVhcigpO1xufVxuXG5mdW5jdGlvbiBnZXRQbGFubmVyQ29udGV4dCgpOiBQbGFubmVyQ29udGV4dCB7XG4gIGlmICghcGxhbm5lckNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbGFubmVyIGNvbnRleHQgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gIH1cbiAgcmV0dXJuIHBsYW5uZXJDb250ZXh0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFpcklkKGE6IHN0cmluZywgYjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGEgPCBiID8gYCR7YX0tJHtifWAgOiBgJHtifS0ke2F9YDtcbn1cblxuY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBNYXA8c3RyaW5nLCBUaW1lPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhdGgoc3RhcnQ6IExvY2F0aW9uLCBlbmQ6IExvY2F0aW9uKTogeyBwYXRoOiBMb2NhdGlvbltdOyBkaXN0OiBUaW1lIH0ge1xuICBjb25zdCB7IHJvYWRNYXAgfSA9IGdldFBsYW5uZXJDb250ZXh0KCk7XG4gIGNvbnN0IGlkID0gcGFpcklkKHN0YXJ0LCBlbmQpO1xuXG4gIGlmIChzdGFydCA9PT0gZW5kKSB7XG4gICAgY29uc3QgZGlzdCA9IHVjb25zdCgwLCBcInNlY29uZHNcIik7XG4gICAgQ29zdE1hdHJpeC5zZXQoaWQsIGRpc3QpO1xuICAgIHJldHVybiB7IHBhdGg6IFtzdGFydF0sIGRpc3QgfTtcbiAgfVxuXG4gIGNvbnN0IGRpc3QgPSBuZXcgTWFwPExvY2F0aW9uLCBUaW1lPigpO1xuICBjb25zdCBwcmV2ID0gbmV3IE1hcDxMb2NhdGlvbiwgTG9jYXRpb24gfCBudWxsPigpO1xuICBjb25zdCB1bnZpc2l0ZWQgPSBuZXcgU2V0PExvY2F0aW9uPihyb2FkTWFwLnBvaW50cyk7XG5cbiAgZm9yIChjb25zdCBwb2ludCBvZiByb2FkTWFwLnBvaW50cykge1xuICAgIGRpc3Quc2V0KHBvaW50LCB1Y29uc3QoSW5maW5pdHksIFwic2Vjb25kc1wiKSk7XG4gICAgcHJldi5zZXQocG9pbnQsIG51bGwpO1xuICB9XG5cbiAgZGlzdC5zZXQoc3RhcnQsIHVjb25zdCgwLCBcInNlY29uZHNcIikpO1xuXG4gIHdoaWxlICh1bnZpc2l0ZWQuc2l6ZSA+IDApIHtcbiAgICBsZXQgY3VycmVudDogTG9jYXRpb24gfCBudWxsID0gbnVsbDtcbiAgICBsZXQgY3VycmVudERpc3QgPSBJbmZpbml0eTtcblxuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgdW52aXNpdGVkKSB7XG4gICAgICBjb25zdCBwb2ludERpc3QgPSBkaXN0LmdldChwb2ludCkhLnZhbHVlO1xuICAgICAgaWYgKHBvaW50RGlzdCA8IGN1cnJlbnREaXN0KSB7XG4gICAgICAgIGN1cnJlbnQgPSBwb2ludDtcbiAgICAgICAgY3VycmVudERpc3QgPSBwb2ludERpc3Q7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT0gbnVsbCB8fCBjdXJyZW50RGlzdCA9PT0gSW5maW5pdHkpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHVudmlzaXRlZC5kZWxldGUoY3VycmVudCk7XG5cbiAgICBpZiAoY3VycmVudCA9PT0gZW5kKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtuZXh0LCBzZWdtZW50XSBvZiByb2FkTWFwLnJvYWRzLmdldChjdXJyZW50KSA/PyBbXSkge1xuICAgICAgaWYgKCF1bnZpc2l0ZWQuaGFzKG5leHQpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgY2FuZGlkYXRlID0gYWRkKGRpc3QuZ2V0KGN1cnJlbnQpISwgc2VnbWVudCk7XG4gICAgICBpZiAoY2FuZGlkYXRlLnZhbHVlIDwgZGlzdC5nZXQobmV4dCkhLnZhbHVlKSB7XG4gICAgICAgIGRpc3Quc2V0KG5leHQsIGNhbmRpZGF0ZSk7XG4gICAgICAgIHByZXYuc2V0KG5leHQsIGN1cnJlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRvdGFsRGlzdCA9IGRpc3QuZ2V0KGVuZCk7XG4gIGlmICghdG90YWxEaXN0IHx8IHRvdGFsRGlzdC52YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHBhdGggZm91bmQgZnJvbSAke3N0YXJ0fSB0byAke2VuZH1gKTtcbiAgfVxuXG4gIGNvbnN0IHBhdGg6IExvY2F0aW9uW10gPSBbXTtcbiAgbGV0IGN1cnNvcjogTG9jYXRpb24gfCBudWxsID0gZW5kO1xuICB3aGlsZSAoY3Vyc29yICE9IG51bGwpIHtcbiAgICBwYXRoLnB1c2goY3Vyc29yKTtcbiAgICBjdXJzb3IgPSBwcmV2LmdldChjdXJzb3IpID8/IG51bGw7XG4gIH1cbiAgcGF0aC5yZXZlcnNlKCk7XG5cbiAgQ29zdE1hdHJpeC5zZXQoaWQsIHRvdGFsRGlzdCk7XG4gIHJldHVybiB7IHBhdGgsIGRpc3Q6IHRvdGFsRGlzdCB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29zdChzdGFydDogTG9jYXRpb24sIGVuZDogTG9jYXRpb24pOiBUaW1lIHtcbiAgY29uc3QgaWQgPSBwYWlySWQoc3RhcnQsIGVuZCk7XG4gIGlmICghQ29zdE1hdHJpeC5oYXMoaWQpKSB7XG4gICAgZmluZFBhdGgoc3RhcnQsIGVuZCk7XG4gIH1cbiAgcmV0dXJuIENvc3RNYXRyaXguZ2V0KGlkKSE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IExvY2F0aW9uW10pOiBUaW1lIHtcbiAgY29uc3QgY29zdCA9IHVjb25zdCgwLCBcInNlY29uZHNcIik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIGlhZGQoY29zdCwgZ2V0Q29zdChwb2ludHNbaV0hLCBwb2ludHNbaSArIDFdISkpO1xuICB9XG4gIHJldHVybiBjb3N0O1xufVxuXG5leHBvcnQgbGV0IG9wdER1ciA9IDA7XG5cbmZ1bmN0aW9uIHJlcXVlc3RNYXAocmVxdWVzdHM6IFJlcXVlc3RbXSk6IE1hcDxVVUlELCBSZXF1ZXN0PiB7XG4gIHJldHVybiBuZXcgTWFwKHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gW3JlcXVlc3QuaWQsIHJlcXVlc3RdKSk7XG59XG5cbmZ1bmN0aW9uIHJvdXRlU2NvcmUoaXRlbTogU2NoZWR1bGVJdGVtLCByZXF1ZXN0c0J5SWQ6IE1hcDxVVUlELCBSZXF1ZXN0Pik6IG51bWJlciB7XG4gIGlmIChpdGVtLnN0ZXBzWzBdPy4kICE9PSBcInN0YXJ0XCIpIHtcbiAgICByZXR1cm4gLUluZmluaXR5O1xuICB9XG5cbiAgY29uc3QgcmV3YXJkID0gdWNvbnN0KDAsIFwiZXVyXCIpO1xuICBjb25zdCBkdXJhdGlvbiA9IHVjb25zdCgwLCBcInNlY29uZHNcIik7XG4gIGNvbnN0IGRlY2tzOiBbVVVJRFtdLCBVVUlEW11dID0gW1tdLCBbXV07XG5cbiAgZnVuY3Rpb24gdW5sb2FkKHJlcUlkOiBVVUlELCBkZWNrOiAwIHwgMSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlkeCA9IGRlY2tzW2RlY2tdLmluZGV4T2YocmVxSWQpO1xuICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGFmdGVyID0gZGVja3NbZGVja10uc2xpY2UoaWR4ICsgMSk7XG4gICAgZGVja3NbZGVja10gPSBkZWNrc1tkZWNrXS5zbGljZSgwLCBpZHgpLmNvbmNhdChhZnRlcik7XG4gICAgaXN1YihyZXdhcmQsIFVOTE9BRENPU1QpO1xuICAgIGlzdWIocmV3YXJkLCBtdWwoYWRkKFVOTE9BRENPU1QsIFBJQ0tVUENPU1QpLCBhZnRlci5sZW5ndGgpKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgaXRlbS5zdGVwcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByZXYgPSBpdGVtLnN0ZXBzW2kgLSAxXSE7XG4gICAgY29uc3Qgc3RlcCA9IGl0ZW0uc3RlcHNbaV0hO1xuXG4gICAgaWFkZChkdXJhdGlvbiwgZ2V0Q29zdChwcmV2LnZhbC5wb3MsIHN0ZXAudmFsLnBvcykpO1xuXG4gICAgaWYgKHN0ZXAuJCA9PT0gXCJwaWNrdXBcIikge1xuICAgICAgZGVja3Nbc3RlcC52YWwuZGVja10ucHVzaChzdGVwLnZhbC5yZXF1ZXN0KTtcbiAgICAgIGlmIChkZWNrc1tzdGVwLnZhbC5kZWNrXS5sZW5ndGggPiBERUNLQ0FQQUNJVFkpIHtcbiAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChzdGVwLiQgPT09IFwiZGVsaXZlclwiKSB7XG4gICAgICBjb25zdCByZXEgPSByZXF1ZXN0c0J5SWQuZ2V0KHN0ZXAudmFsLnJlcXVlc3QpO1xuICAgICAgaWYgKCFyZXEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBub3QgZm91bmQgcmVxdWVzdDogJHtzdGVwLnZhbC5yZXF1ZXN0fWApO1xuICAgICAgfVxuICAgICAgaWYgKCF1bmxvYWQoc3RlcC52YWwucmVxdWVzdCwgMCkgJiYgIXVubG9hZChzdGVwLnZhbC5yZXF1ZXN0LCAxKSkge1xuICAgICAgICByZXR1cm4gLUluZmluaXR5O1xuICAgICAgfVxuICAgICAgaWYgKGR1cmF0aW9uLnZhbHVlIDw9IHJlcS5kZWFkbGluZS52YWx1ZSkge1xuICAgICAgICBpYWRkKHJld2FyZCwgcmVxLnZhbHVlKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJldHVybiAtSW5maW5pdHk7XG4gIH1cblxuICByZXR1cm4gcmV3YXJkLnZhbHVlIC0gZHVyYXRpb24udmFsdWUgKiBDT1NUX1BFUl9TRUNPTkQ7XG59XG5cbmZ1bmN0aW9uIHNhZmVSb3V0ZVNjb3JlKGl0ZW06IFNjaGVkdWxlSXRlbSwgcmVxdWVzdHNCeUlkOiBNYXA8VVVJRCwgUmVxdWVzdD4pOiBudW1iZXIge1xuICB0cnkge1xuICAgIHJldHVybiByb3V0ZVNjb3JlKGl0ZW0sIHJlcXVlc3RzQnlJZCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiAtSW5maW5pdHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zZXJ0UmVxdWVzdEludG9JdGVtKFxuICBpdGVtOiBTY2hlZHVsZUl0ZW0sXG4gIHJlcXVlc3Q6IFJlcXVlc3QsXG4gIHBpY2tJbmRleDogbnVtYmVyLFxuICBkcm9wSW5kZXg6IG51bWJlcixcbiAgZGVjazogMCB8IDEsXG4pOiBTY2hlZHVsZUl0ZW0ge1xuICBjb25zdCBwaWNrdXA6IFNjaGVkdWxlU3RlcCA9IHtcbiAgICAkOiBcInBpY2t1cFwiLFxuICAgIHZhbDogeyByZXF1ZXN0OiByZXF1ZXN0LmlkLCBwb3M6IHJlcXVlc3Quc3RhcnRQb2ludCwgZGVjayB9LFxuICB9O1xuICBjb25zdCBkZWxpdmVyOiBTY2hlZHVsZVN0ZXAgPSB7XG4gICAgJDogXCJkZWxpdmVyXCIsXG4gICAgdmFsOiB7IHJlcXVlc3Q6IHJlcXVlc3QuaWQsIHBvczogcmVxdWVzdC5lbmRQb2ludCB9LFxuICB9O1xuXG4gIGNvbnN0IHN0ZXBzID0gWy4uLml0ZW0uc3RlcHNdO1xuICBzdGVwcy5zcGxpY2UocGlja0luZGV4LCAwLCBwaWNrdXApO1xuICBzdGVwcy5zcGxpY2UoZHJvcEluZGV4LCAwLCBkZWxpdmVyKTtcbiAgcmV0dXJuIHsgLi4uaXRlbSwgc3RlcHMgfTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmVxdWVzdEZyb21TY2hlZHVsZShzY2hlZHVsZTogU2NoZWR1bGUsIHJlcXVlc3RJZDogVVVJRCk6IFNjaGVkdWxlIHtcbiAgcmV0dXJuIHNjaGVkdWxlLm1hcCgoaXRlbSkgPT4gKHtcbiAgICAuLi5pdGVtLFxuICAgIHN0ZXBzOiBpdGVtLnN0ZXBzLmZpbHRlcigoc3RlcCkgPT4gc3RlcC4kID09PSBcInN0YXJ0XCIgfHwgc3RlcC52YWwucmVxdWVzdCAhPT0gcmVxdWVzdElkKSxcbiAgfSkpO1xufVxuXG5mdW5jdGlvbiBhc3NpZ25lZFJlcXVlc3RJZHMoc2NoZWR1bGU6IFNjaGVkdWxlKTogU2V0PFVVSUQ+IHtcbiAgY29uc3QgaWRzID0gbmV3IFNldDxVVUlEPigpO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2NoZWR1bGUpIHtcbiAgICBmb3IgKGNvbnN0IHN0ZXAgb2YgaXRlbS5zdGVwcykge1xuICAgICAgaWYgKHN0ZXAuJCA9PT0gXCJwaWNrdXBcIikge1xuICAgICAgICBpZHMuYWRkKHN0ZXAudmFsLnJlcXVlc3QpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaWRzO1xufVxuXG5mdW5jdGlvbiByZXF1ZXN0UHJpb3JpdHkocmVxdWVzdDogUmVxdWVzdCk6IG51bWJlciB7XG4gIHRyeSB7XG4gICAgY29uc3QgZGlyZWN0VHJhdmVsID0gZ2V0Q29zdChyZXF1ZXN0LnN0YXJ0UG9pbnQsIHJlcXVlc3QuZW5kUG9pbnQpLnZhbHVlICogQ09TVF9QRVJfU0VDT05EO1xuICAgIHJldHVybiByZXF1ZXN0LnZhbHVlLnZhbHVlIC0gZGlyZWN0VHJhdmVsIC0gUElDS1VQQ09TVC52YWx1ZSAtIFVOTE9BRENPU1QudmFsdWU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiAtSW5maW5pdHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYmVzdEluc2VydGlvbihzY2hlZHVsZTogU2NoZWR1bGUsIHJlcXVlc3Q6IFJlcXVlc3QsIHJlcXVlc3RzQnlJZDogTWFwPFVVSUQsIFJlcXVlc3Q+KTogSW5zZXJ0aW9uQ2FuZGlkYXRlIHwgbnVsbCB7XG4gIGxldCBiZXN0OiBJbnNlcnRpb25DYW5kaWRhdGUgfCBudWxsID0gbnVsbDtcblxuICBmb3IgKGxldCBpdGVtSW5kZXggPSAwOyBpdGVtSW5kZXggPCBzY2hlZHVsZS5sZW5ndGg7IGl0ZW1JbmRleCsrKSB7XG4gICAgY29uc3QgaXRlbSA9IHNjaGVkdWxlW2l0ZW1JbmRleF0hO1xuICAgIGNvbnN0IGN1cnJlbnRTY29yZSA9IHNhZmVSb3V0ZVNjb3JlKGl0ZW0sIHJlcXVlc3RzQnlJZCk7XG5cbiAgICBmb3IgKGNvbnN0IGRlY2sgb2YgWzAsIDFdIGFzIGNvbnN0KSB7XG4gICAgICBmb3IgKGxldCBwaWNrSW5kZXggPSAxOyBwaWNrSW5kZXggPD0gaXRlbS5zdGVwcy5sZW5ndGg7IHBpY2tJbmRleCsrKSB7XG4gICAgICAgIGZvciAobGV0IGRyb3BJbmRleCA9IHBpY2tJbmRleCArIDE7IGRyb3BJbmRleCA8PSBpdGVtLnN0ZXBzLmxlbmd0aCArIDE7IGRyb3BJbmRleCsrKSB7XG4gICAgICAgICAgY29uc3QgY2FuZGlkYXRlID0gaW5zZXJ0UmVxdWVzdEludG9JdGVtKGl0ZW0sIHJlcXVlc3QsIHBpY2tJbmRleCwgZHJvcEluZGV4LCBkZWNrKTtcbiAgICAgICAgICBjb25zdCBjYW5kaWRhdGVTY29yZSA9IHNhZmVSb3V0ZVNjb3JlKGNhbmRpZGF0ZSwgcmVxdWVzdHNCeUlkKTtcbiAgICAgICAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShjYW5kaWRhdGVTY29yZSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHNjb3JlRGVsdGEgPSBjYW5kaWRhdGVTY29yZSAtIGN1cnJlbnRTY29yZTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhYmVzdCB8fFxuICAgICAgICAgICAgc2NvcmVEZWx0YSA+IGJlc3Quc2NvcmVEZWx0YSB8fFxuICAgICAgICAgICAgKHNjb3JlRGVsdGEgPT09IGJlc3Quc2NvcmVEZWx0YSAmJiBpdGVtSW5kZXggPCBiZXN0Lml0ZW1JbmRleClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGJlc3QgPSB7IGl0ZW1JbmRleCwgcGlja0luZGV4LCBkcm9wSW5kZXgsIGRlY2ssIHNjb3JlRGVsdGEgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gYmVzdDtcbn1cblxuZnVuY3Rpb24gYXBwbHlJbnNlcnRpb24oc2NoZWR1bGU6IFNjaGVkdWxlLCByZXF1ZXN0OiBSZXF1ZXN0LCBjYW5kaWRhdGU6IEluc2VydGlvbkNhbmRpZGF0ZSk6IFNjaGVkdWxlIHtcbiAgcmV0dXJuIHNjaGVkdWxlLm1hcCgoaXRlbSwgaXRlbUluZGV4KSA9PlxuICAgIGl0ZW1JbmRleCA9PT0gY2FuZGlkYXRlLml0ZW1JbmRleFxuICAgICAgPyBpbnNlcnRSZXF1ZXN0SW50b0l0ZW0oaXRlbSwgcmVxdWVzdCwgY2FuZGlkYXRlLnBpY2tJbmRleCwgY2FuZGlkYXRlLmRyb3BJbmRleCwgY2FuZGlkYXRlLmRlY2spXG4gICAgICA6IGl0ZW0sXG4gICk7XG59XG5cbmZ1bmN0aW9uIGltcHJvdmVCeVJlbG9jYXRpb24oc2NoZWR1bGU6IFNjaGVkdWxlLCByZXF1ZXN0c0J5SWQ6IE1hcDxVVUlELCBSZXF1ZXN0Pik6IFNjaGVkdWxlIHtcbiAgbGV0IGN1cnJlbnQgPSBzY2hlZHVsZTtcbiAgbGV0IGN1cnJlbnRTY29yZSA9IHJhdGVTY2hlZHVsZShjdXJyZW50KTtcbiAgY29uc3QgYXNzaWduZWQgPSBBcnJheS5mcm9tKGFzc2lnbmVkUmVxdWVzdElkcyhjdXJyZW50KSk7XG5cbiAgZm9yIChjb25zdCByZXF1ZXN0SWQgb2YgYXNzaWduZWQpIHtcbiAgICBjb25zdCByZXF1ZXN0ID0gcmVxdWVzdHNCeUlkLmdldChyZXF1ZXN0SWQpO1xuICAgIGlmICghcmVxdWVzdCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcmVkdWNlZCA9IHJlbW92ZVJlcXVlc3RGcm9tU2NoZWR1bGUoY3VycmVudCwgcmVxdWVzdElkKTtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBiZXN0SW5zZXJ0aW9uKHJlZHVjZWQsIHJlcXVlc3QsIHJlcXVlc3RzQnlJZCk7XG4gICAgaWYgKCFjYW5kaWRhdGUgfHwgY2FuZGlkYXRlLnNjb3JlRGVsdGEgPD0gMCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgbmV4dCA9IGFwcGx5SW5zZXJ0aW9uKHJlZHVjZWQsIHJlcXVlc3QsIGNhbmRpZGF0ZSk7XG4gICAgY29uc3QgbmV4dFNjb3JlID0gcmF0ZVNjaGVkdWxlKG5leHQpO1xuICAgIGlmIChuZXh0U2NvcmUgPiBjdXJyZW50U2NvcmUpIHtcbiAgICAgIGN1cnJlbnQgPSBuZXh0O1xuICAgICAgY3VycmVudFNjb3JlID0gbmV4dFNjb3JlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb3B0aW1pemVTY2hlZHVsZShyZXF1ZXN0czogUmVxdWVzdFtdLCBzY2hlZHVsZTogU2NoZWR1bGUpOiBTY2hlZHVsZSB7XG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGNvbnN0IHJlcXVlc3RzQnlJZCA9IHJlcXVlc3RNYXAocmVxdWVzdHMpO1xuICBjb25zdCBhc3NpZ25lZCA9IGFzc2lnbmVkUmVxdWVzdElkcyhzY2hlZHVsZSk7XG5cbiAgbGV0IGN1cnJlbnQgPSBzY2hlZHVsZS5tYXAoKGl0ZW0pID0+ICh7IC4uLml0ZW0sIHN0ZXBzOiBbLi4uaXRlbS5zdGVwc10gfSkpO1xuXG4gIGNvbnN0IGZyZWVSZXF1ZXN0cyA9IHJlcXVlc3RzXG4gICAgLmZpbHRlcigocmVxdWVzdCkgPT4gIWFzc2lnbmVkLmhhcyhyZXF1ZXN0LmlkKSlcbiAgICAuc29ydCgoYSwgYikgPT4gcmVxdWVzdFByaW9yaXR5KGIpIC0gcmVxdWVzdFByaW9yaXR5KGEpKTtcblxuICBmb3IgKGNvbnN0IHJlcXVlc3Qgb2YgZnJlZVJlcXVlc3RzKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gYmVzdEluc2VydGlvbihjdXJyZW50LCByZXF1ZXN0LCByZXF1ZXN0c0J5SWQpO1xuICAgIGlmIChjYW5kaWRhdGUgJiYgY2FuZGlkYXRlLnNjb3JlRGVsdGEgPiAwKSB7XG4gICAgICBjdXJyZW50ID0gYXBwbHlJbnNlcnRpb24oY3VycmVudCwgcmVxdWVzdCwgY2FuZGlkYXRlKTtcbiAgICB9XG4gIH1cblxuICBjdXJyZW50ID0gaW1wcm92ZUJ5UmVsb2NhdGlvbihjdXJyZW50LCByZXF1ZXN0c0J5SWQpO1xuICBjdXJyZW50ID0gaW1wcm92ZUJ5UmVsb2NhdGlvbihjdXJyZW50LCByZXF1ZXN0c0J5SWQpO1xuXG4gIG9wdER1ciA9IERhdGUubm93KCkgLSBzdGFydGVkQXQ7XG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmF0ZVNjaGVkdWxlKHNjaGVkdWxlOiBTY2hlZHVsZSk6IG51bWJlciB7XG4gIGNvbnN0IHsgcmVxdWVzdHMgfSA9IGdldFBsYW5uZXJDb250ZXh0KCk7XG4gIGNvbnN0IHJlcXVlc3RzQnlJZCA9IHJlcXVlc3RNYXAocmVxdWVzdHMpO1xuXG4gIGxldCB0b3RhbCA9IDA7XG4gIGZvciAoY29uc3QgaXRlbSBvZiBzY2hlZHVsZSkge1xuICAgIGNvbnN0IGl0ZW1TY29yZSA9IHNhZmVSb3V0ZVNjb3JlKGl0ZW0sIHJlcXVlc3RzQnlJZCk7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoaXRlbVNjb3JlKSkge1xuICAgICAgcmV0dXJuIC1JbmZpbml0eTtcbiAgICB9XG4gICAgdG90YWwgKz0gaXRlbVNjb3JlO1xuICB9XG4gIHJldHVybiB0b3RhbDtcbn1cbiIsCiAgICAiXG5pbXBvcnQgdHlwZSB7IExvY2F0aW9uLCBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBmaW5kUGF0aCwgcGFpcklkIH0gZnJvbSBcIi4uL3BsYW5uZXJcIjtcbmltcG9ydCB7ICB0eXBlIFJvYWRNYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyBkaXYsIHAsIHN0eWxlIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMsIHJlcXVlc3RzLCB0eXBlIEhpZ2hMaWdodCB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInlcIiwgeTEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuXG4gICAgXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIwLjAzXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4geyBlbCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+eyBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yKSB9IH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHRhZ1wiKVxufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcFZpZXcgKHJvYWRtYXA6IFJvYWRNYXAgKSA6IEhUTUxFbGVtZW50IHtcblxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcblxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiODAlXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIjAgMCAxIDFcIilcblxuICBsZXQgZWxlbWVudHMgPSBuZXcgTWFwPGFueSwgU1ZHRWxlbWVudD4oKVxuICBsZXQgc291cmNlcyA9IG5ldyBNYXA8U1ZHRWxlbWVudCwgYW55PigpXG4gIFxuICBmb3IgKGxldCBbaWQxLCByb2Fkc10gb2Ygcm9hZG1hcC5yb2Fkcyl7XG4gICAgZm9yIChsZXQgW2lkMiwgZGlzdF0gb2Ygcm9hZHMpe1xuICAgICAgbGV0IGEgPSByb2FkbWFwLmdlb2xvY2F0aW9uKCBpZDEpIVxuICAgICAgbGV0IGIgPSByb2FkbWFwLmdlb2xvY2F0aW9uKCBpZDIpIVxuICAgICAgbGV0IGxpbmUgPSBta1N2ZyhcImxpbmVcIiwgYS54LCBhLnksIGIueCwgYi55KS5lbFxuICAgICAgbGV0IGlkID0gcGFpcklkKGlkMSwgaWQyKVxuICAgICAgZWxlbWVudHMuc2V0KGlkLCBsaW5lKVxuICAgICAgc291cmNlcy5zZXQobGluZSwgaWQpXG4gICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxpbmUpXG4gICAgfVxuICB9XG4gIFxuICBmb3IgKGxldCBwb2ludCBvZiByb2FkbWFwLnJvYWRzLmtleXMoKSl7XG4gICAgbGV0IGxvYyA9IHJvYWRtYXAuZ2VvbG9jYXRpb24ocG9pbnQpXG4gICAgbGV0IGNpcmNsZSA9IG1rU3ZnKFwiY2lyY2xlXCIsIGxvYy54LCBsb2MueSkuZWxcbiAgICBlbGVtZW50cy5zZXQocG9pbnQsIGNpcmNsZSlcbiAgICBzb3VyY2VzLnNldChjaXJjbGUsIHBvaW50KVxuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2lyY2xlKVxuICB9XG5cbiAgbGV0IGhpbnRzOiB7cmVtb3ZlOigpPT52b2lkfVtdID0gW11cblxuICBoaWdodExpZ2h0cy5vbnVwZGF0ZSgobkgsbyk9PntcbiAgICBoaW50cy5mb3JFYWNoKGVsPT5lbC5yZW1vdmUoKSlcbiAgICBmb3IgKGxldCBuIG9mIG5IKXtcbiAgICAgIGxldCBsYXN0IDogTG9jYXRpb24gfCBudWxsID0gbnVsbFxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGxldCBuZXh0ID0gcC5sb2NhdGlvblxuICAgICAgICBpZiAobGFzdCl7XG4gICAgICAgICAgbGV0IHBhdGggPSBmaW5kUGF0aChsYXN0LCBuZXh0KS5wYXRoXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKyl7XG4gICAgICAgICAgICBsZXQgQSA9IHJvYWRtYXAuZ2VvbG9jYXRpb24ocGF0aFtpXSEpIVxuICAgICAgICAgICAgbGV0IEIgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHBhdGhbaSsxXSEpIVxuICAgICAgICAgICAgbGV0IGxpbmUgPSBta1N2ZyhcImxpbmVcIiwgQS54LCBBLnksIEIueCwgQi55KVxuICAgICAgICAgICAgbGluZS5zZXRDb2xvcihuLmNvbG9yID8/IFwiI2ZmYzk4OFwiKVxuICAgICAgICAgICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAxXCIpXG4gICAgICAgICAgICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDBcIilcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQobGluZS5lbClcbiAgICAgICAgICAgIGhpbnRzLnB1c2goe3JlbW92ZTogKCk9PmxpbmUuZWwucmVtb3ZlKCl9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gbmV4dFxuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBwIG9mIG4ucG9pbnRzKXtcbiAgICAgICAgaWYgKHAubG9nbykge1xuICAgICAgICAgIGxldCBwb3MgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHAubG9jYXRpb24pXG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LCBwb3MueSwgcC5sb2dvKVxuICAgICAgICAgIGVsLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDAwXCIpXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChlbC5lbClcbiAgICAgICAgICBoaW50cy5wdXNoKGVsLmVsKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGxldCBkdiA9IGRpdihzdHlsZSh7d2lkdGg6XCIxMDAlXCIsIGRpc3BsYXk6XCJmbGV4XCIsIGp1c3RpZnlDb250ZW50OlwiY2VudGVyXCIsIHBhZGRpbmc6IFwiMWVtXCJ9KSlcbiAgZHYuYXBwZW5kKGVsZW1lbnQpXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiXG5pbXBvcnQgeyBMb2NhdGlvbiwgcmFuZG9tVVVJRCwgVGltZSwgdWNvbnN0LCBVVUlEIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IHJhbmRDaG9pY2UsIHJhbmRvbSB9IGZyb20gXCIuL3JhbmRvbVwiO1xuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbU1hcCAoKXtcblxuICBsZXQgcG9pbnRzIDpMb2NhdGlvbltdID0gW11cblxuICBsZXQgcm9hZHMgPSBuZXcgTWFwPExvY2F0aW9uLCBNYXA8TG9jYXRpb24sIFRpbWU+PiAoKVxuICBsZXQgZ2VvbG9jYXRpb24gPSBuZXcgTWFwPExvY2F0aW9uLCB7eDogbnVtYmVyLCB5OiBudW1iZXJ9PigpXG4gIGxldCBnZW9jb2RlcyA9IG5ldyBNYXA8TG9jYXRpb24sIHN0cmluZz4oKVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspe1xuXG4gICAgbGV0IHBvaW50OiBMb2NhdGlvbiA9IGBsb2Mke3JhbmRvbVVVSUQoKX1gXG4gICAgcG9pbnRzLnB1c2gocG9pbnQpXG4gICAgZ2VvbG9jYXRpb24uc2V0KHBvaW50ICwge3g6IHJhbmRvbSgpLCB5OiByYW5kb20oKX0pXG4gICAgZ2VvY29kZXMuc2V0KHBvaW50LCBgREUgJHtnZW9sb2NhdGlvbi5zaXplLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgXCIwXCIpfWApXG4gICAgcm9hZHMuc2V0KHBvaW50LCBuZXcgTWFwKCkpXG4gIH1cblxuICBmb3IgKGxldCBbSUQsIHBdIG9mIGdlb2xvY2F0aW9uLmVudHJpZXMoKSl7XG4gICAgZ2VvbG9jYXRpb24uZW50cmllcygpLnRvQXJyYXkoKS5zb3J0KChbYSxBXSxbYixCXSk9PiBNYXRoLmh5cG90KEEueCAtIHAueCwgQS55IC0gcC55KSAtIE1hdGguaHlwb3QoQi54IC0gcC54LCBCLnkgLSBwLnkpKVxuICAgIC5zbGljZSgxLDQpLmZvckVhY2goKFtpZCwgbG9jXSk9PntcbiAgICAgIGxldCBkaXN0ID0gdWNvbnN0KE1hdGguaHlwb3QobG9jLnggLSBwLngsIGxvYy55IC0gcC55KSAqIDEwICogNjAgKiA2MCwgXCJzZWNvbmRzXCIpXG4gICAgICByb2Fkcy5nZXQoSUQpIS5zZXQoaWQsIGRpc3QpXG4gICAgICByb2Fkcy5nZXQoaWQpIS5zZXQoSUQsIGRpc3QpXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcm9hZHMsXG4gICAgcG9pbnRzLFxuICAgIGdlb2xvY2F0aW9uKGxvYzogTG9jYXRpb24pe1xuICAgICAgbGV0IGdlbyA9IGdlb2xvY2F0aW9uLmdldChsb2MpXG4gICAgICBpZiAoIWdlbykgdGhyb3cgbmV3IEVycm9yKGBMb2NhdGlvbiAke2xvY30gbm90IGZvdW5kYClcbiAgICAgIHJldHVybiBnZW9cbiAgICB9LFxuICAgIGdlb0NvZGUobG9jOiBMb2NhdGlvbil7XG4gICAgICAgIGxldCBjb2RlID0gZ2VvY29kZXMuZ2V0KGxvYylcbiAgICAgICAgaWYgKCFjb2RlKSB0aHJvdyBuZXcgRXJyb3IoYExvY2F0aW9uICR7bG9jfSBub3QgZm91bmRgKVxuICAgICAgICByZXR1cm4gY29kZVxuICAgICAgfVxuICAgIH1cbn1cblxuXG5leHBvcnQgdHlwZSBSb2FkTWFwID0gdHlwZW9mIHJhbmRvbU1hcCBleHRlbmRzICgpID0+IGluZmVyIFQgPyBUIDogbmV2ZXJcbiIsCiAgICAiaW1wb3J0IHsgTG9jYXRpb24sIFByaWNlLCBSZXF1ZXN0LCBUaW1lLCBVVUlELCB0eXBlIFNjaGVkdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgdHlwZSB7IFJvYWRNYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgdHlwZSB7IEluZmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgYm9yZGVyLCBjb2xvciwgaDMsIGh0bWwsIHBhZGRpbmcsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRyLCB0eXBlIEhUTUxHZW5lcmF0b3IgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cywgcmVxdWVzdHMsIHJvYWRNYXAsIHNjaGVkdWxlIH0gZnJvbSBcIi4vbWFpblwiO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NTdHJpbmcgKGxvYzogSW5mZXI8dHlwZW9mIExvY2F0aW9uPikge1xuICByZXR1cm4gYPCfk40gJHtyb2FkTWFwLmdlb0NvZGUobG9jKSA/PyBcIlVOS1wifWBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zcG9ydGVyU3RyaW5nICh0cmFuOiBVVUlEKSB7XG4gIHJldHVybiBg8J+amyAke3NjaGVkdWxlLmdldCgpLmZpbmRJbmRleChzPT5zLnRyYW5zcG9ydGVyID09IHRyYW4pLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKX1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lU3RyaW5nICh0aW1lOiBUaW1lKXtcbiAgLy8gcmV0dXJuIGAkeygodGltZS52YWx1ZS82MC82MCkudG9GaXhlZCgyKSl9IGhgXG4gIHJldHVybiBgJHtNYXRoLmZsb29yKHRpbWUudmFsdWUvNjAvNjApLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtNYXRoLmZsb29yKCh0aW1lLnZhbHVlLzYwKSU2MCkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfWhgXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcmljZVN0cmluZyAocHJpY2U6IFByaWNlKXtcbiAgcmV0dXJuIGAke3ByaWNlLnZhbHVlLnRvRml4ZWQoMCl9IOKCrGBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcXVlc3RTdHJpbmcgKGlkOiBVVUlEKSB7XG4gIGxldCByZXEgPSByZXF1ZXN0cy5maW5kKHI9PnIuaWQgPT0gaWQpXG4gIGlmICghcmVxKSByZXR1cm4gXCJVTktcIlxuICByZXR1cm4gYPCfk6YgJHtyZXF1ZXN0cy5maW5kSW5kZXgoeD0+eC5pZCA9PSBpZCkudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpfWBcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0VmlldyAocmVxdWVzdHM6IFJlcXVlc3RbXSwgc2NoZWR1bGU6IFNjaGVkdWxlKTogSFRNTEVsZW1lbnR7XG5cbiAgbGV0IGNlbGwgPSAoKC4uLngpID0+IHRkKHN0eWxlKHtcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICBjdXJzb3I6XCJwb2ludGVyXCIsXG4gICAgd2hpdGVTcGFjZTogXCJub3dyYXBcIixcbiAgfSksIC4uLngpKSBhcyBIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiBcblxuICByZXR1cm4gdGFibGUoXG4gICAgc3R5bGUoeyBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLCB9KSxcblxuICAgIHRyKFtcInJlcXVlc3RcIiwgXCJzdGFydFwiLCBcImVuZFwiLCBcImRpc3RhbnpcIiwgXCJwcmVpc1wiLCBcImZyaXN0XCIgXS5tYXAoaD0+IGNlbGwoaCksICksIHN0eWxlKHtmb250V2VpZ2h0OiBcImJvbGRcIn0pKSxcbiAgICByZXF1ZXN0cy5tYXAoKHIsIGkpPT57XG5cbiAgICAgIGxldCBwYXRoID0gZmluZFBhdGgoci5zdGFydFBvaW50LCByLmVuZFBvaW50KVxuXG4gICAgICBsZXQgcm93PSB0cihcbiAgICAgICAgY2VsbChyZXF1ZXN0U3RyaW5nKHIuaWQpKSxcbiAgICAgICAgY2VsbChsb2NTdHJpbmcoci5zdGFydFBvaW50KSksXG4gICAgICAgIGNlbGwobG9jU3RyaW5nKHIuZW5kUG9pbnQpKSxcbiAgICAgICAgY2VsbChzcGFuKCB0aW1lU3RyaW5nKHBhdGguZGlzdCksIHN0eWxlKHtmbG9hdDogXCJyaWdodFwifSkpKSxcbiAgICAgICAgY2VsbChzcGFuKHByaWNlU3RyaW5nKHIudmFsdWUpLCBzdHlsZSh7ZmxvYXQ6IFwicmlnaHRcIn0pKSksXG4gICAgICAgIGNlbGwoc3Bhbih0aW1lU3RyaW5nKHIuZGVhZGxpbmUpLCBzdHlsZSh7ZmxvYXQ6IFwicmlnaHRcIn0pKSksXG4gICAgICApXG4gICAgICByb3cub25tb3VzZWVudGVyID0gKCk9PntcbiAgICAgICAgcm93LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmdyYXksXG4gICAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHM6IFtcbiAgICAgICAgICB7IGxvY2F0aW9uOiByLnN0YXJ0UG9pbnQsIGxvZ286IFwi8J+TplwiIH0sXG4gICAgICAgICAgeyBsb2NhdGlvbjogci5lbmRQb2ludCwgbG9nbzogXCLwn4+gXCIgfVxuICAgICAgICBdfV0pXG5cbiAgICAgIH1cbiAgICAgIHJvdy5vbm1vdXNlbGVhdmUgPSAoKT0+e1xuICAgICAgICByb3cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJcIlxuICAgICAgfVxuICAgICAgcmV0dXJuIHJvd1xuICAgIH0pXG5cbiAgKVxuXG59IiwKICAgICJpbXBvcnQgdHlwZSB7IEpzb25EYXRhIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5leHBvcnQgZnVuY3Rpb24gbWtXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ICh2YWx1ZTogVCkge1xuXG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQpID0+IHtcbiAgICAgIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgdWNvbnN0LCBpYWRkLCB0eXBlIFNjaGVkdWxlSXRlbSwgdHlwZSBVVUlELCBTY2hlZHVsZVN0ZXAsIFRpbWUsIGFkZCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZ2V0Q29zdCwgb3B0RHVyLCBvcHRpbWl6ZVNjaGVkdWxlLCByYXRlU2NoZWR1bGUgfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgbWtXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IGJhY2tncm91bmQsIGJvZHksIGJvcmRlclJhZGl1cywgYnV0dG9uLCBjb2xvciwgZGl2LCBoMiwgaHRtbCwgcCwgcGFkZGluZywgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdHIsIHdpZHRoIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMsIHJlcXVlc3RzLCByb2FkTWFwLCBzY2hlZHVsZSB9IGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IGxvY1N0cmluZywgcHJpY2VTdHJpbmcsIHJlcXVlc3RTdHJpbmcsIHRpbWVTdHJpbmcsIHRyYW5zcG9ydGVyU3RyaW5nIH0gZnJvbSBcIi4vcmVxdWVzdFZpZXdcIjtcblxuXG5mdW5jdGlvbiBzdGVwTG9nbyAoc3RlcDogU2NoZWR1bGVTdGVwKXtcbiAgaWYgKHN0ZXAuJCA9PSBcInN0YXJ0XCIpIHJldHVybiAn8J+amydcbiAgaWYgKHN0ZXAuJCA9PSBcInBpY2t1cFwiKSByZXR1cm4gJ/Cfk6YnXG4gIGlmIChzdGVwLiQgPT0gXCJkZWxpdmVyXCIpIHJldHVybiAn8J+PoCdcbiAgdGhyb3cgbmV3IEVycm9yKFwidW5leHBlY3RlZCB0YWc6XCIsIHN0ZXApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXF1ZXN0KGlkOiBVVUlEKXtcbiAgbGV0IHJlcSA9IHJlcXVlc3RzLmZpbmQocj0+ci5pZCA9PSBpZClcbiAgaWYgKCFyZXEpIHRocm93IG5ldyBFcnJvcihgbm90IGZvdW5kIHJlcXVlc3QgJHtpZH1gKVxuICByZXR1cm4gcmVxXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGVwUmVxdWVzdChzdGVwOiBTY2hlZHVsZVN0ZXApe1xuICBpZiAoc3RlcC4kID09IFwic3RhcnRcIikgcmV0dXJuIHVuZGVmaW5lZFxuICByZXR1cm4gZ2V0UmVxdWVzdChzdGVwLnZhbC5yZXF1ZXN0KVxufVxuXG5mdW5jdGlvbiBzdGVwU3RyaW5nIChzdGVwOiBTY2hlZHVsZVN0ZXApe1xuXG4gIGlmIChzdGVwLiQgPT0gXCJzdGFydFwiKSByZXR1cm4gYHN0YXJ0YFxuICBsZXQgcmVxID0gZ2V0UmVxdWVzdChzdGVwLnZhbC5yZXF1ZXN0KVxuICByZXR1cm4gYCR7c3RlcC4kfSAke3JlcXVlc3RTdHJpbmcoc3RlcC52YWwucmVxdWVzdCl9OiAke3ByaWNlU3RyaW5nKHJlcS52YWx1ZSl9IGRlYWRsaW5lICR7dGltZVN0cmluZyhyZXEuZGVhZGxpbmUpfWBcbn1cblxubGV0IGN1cnNvciA9IG1rV3JpdGFibGUoe3JvdzogMSwgY29sOiAxfSlcblxuYm9keS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBlPT57XG4gIGN1cnNvci51cGRhdGUoKGN1cnNvcikgPT57XG4gICAgaWYgKGN1cnNvci5jb2wgPT0gLTEpIHJldHVyblxuICAgIGlmIChlLmtleSA9PSBcIkFycm93TGVmdFwiKSAgICAgICAgIGN1cnNvci5jb2wgLT0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dSaWdodFwiKSAgIGN1cnNvci5jb2wgKz0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dVcFwiKSAgICAgIGN1cnNvci5yb3cgLT0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dEb3duXCIpICAgIGN1cnNvci5yb3cgKz0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiRXNjYXBlXCIpICAgICAgIGN1cnNvciA9IHtyb3c6IC0xLCBjb2w6IC0xfVxuICAgIGVsc2UgcmV0dXJuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY3Vyc29yLnJvdyA9IE1hdGgubWF4KDAsIE1hdGgubWluKCBzY2hlZHVsZS5nZXQoKS5sZW5ndGgtMSwgY3Vyc29yLnJvdykpXG4gICAgY3Vyc29yLmNvbCA9IE1hdGgubWF4KDAsIE1hdGgubWluKCBzY2hlZHVsZS5nZXQoKVtjdXJzb3Iucm93XSEuc3RlcHMubGVuZ3RoLTEsIGN1cnNvci5jb2wpKVxuICB9KVxuXG59KVxuXG5cblxuZXhwb3J0IGNvbnN0IHNjaGVkdWxlVmlldyA9ICgpID0+IHtcblxuICBsZXQgY2VsbCA9ICgoLi4ueCkgPT4gdGQoc3R5bGUoe1xuICAgIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZ3JheSlcIixcbiAgICBtYXJnaW46IFwiMFwiLFxuICAgIHBhZGRpbmc6IFwiLjNlbSAuNWVtXCIsXG4gICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICB3aGl0ZVNwYWNlOiBcIm5vd3JhcFwiLFxuICB9KSwgLi4ueCkpIGFzIHR5cGVvZiB0ZDtcblxuICBjb25zdCB0YWJ2aWV3ID0gZGl2KClcbiAgY29uc3QgcmVqZWN0VmlldyA9IGRpdigpXG4gIGNvbnN0IHN0ZXB2aWV3ID0gZGl2KClcbiAgbGV0IHN0ZXBFbHMgPSBbXSBhcyBIVE1MU3BhbkVsZW1lbnRbXVtdXG4gIGxldCByb3dFbHMgPSBbXSBhcyBIVE1MVGFibGVSb3dFbGVtZW50W11cblxuICBsZXQgdGltZXMgOiBUaW1lW11bXSA9IFtdXG5cbiAgXG4gIHNjaGVkdWxlLm9udXBkYXRlKHNjaGVkID0+IHtcblxuICAgIHRpbWVzID0gc2NoZWQubWFwKHM9Plt1Y29uc3QoMCwgXCJzZWNvbmRzXCIpXSlcblxuXG4gICAgY3Vyc29yLm9udXBkYXRlKGN1cnNvcj0+e1xuXG4gICAgICBsZXQge3JvdywgY29sOiBufSA9IGN1cnNvclxuXG4gICAgICBsZXQgc3RlcHMgPSBzY2hlZFtyb3ddIS5zdGVwc1xuICAgICAgbGV0IHN0ZXAgPSBzdGVwc1tuXVxuICAgICAgaWYgKCFzdGVwKSByZXR1cm5cblxuICAgICAgbGV0IHJlcXVlc3QgPSBzdGVwLiQgPT0gXCJzdGFydFwiID8gdW5kZWZpbmVkIDogc3RlcC52YWwucmVxdWVzdFxuXG4gICAgICBzdGVwRWxzLmZvckVhY2goKHJvd0Vscywgcm93bik9PntcbiAgICAgICAgcm93RWxzLmZvckVhY2goKGVsLGkpPT57XG4gICAgICAgICAgbGV0IHN0ZXAgPSBzY2hlZFtyb3duXSEuc3RlcHNbaV1cbiAgICAgICAgICBpZiAoIXN0ZXApIHJldHVyblxuICAgICAgICAgIGxldCBib3JkZXIgPSBjb2xvci5iYWNrZ3JvdW5kXG4gICAgICAgICAgaWYgKGkgPT0gbiAmJiByb3cgPT0gcm93bikge1xuICAgICAgICAgICAgYm9yZGVyID0gY29sb3IuYmx1ZSBcbiAgICAgICAgICAgIHZpZXdTdGVwKHJvdywgbiwgc3RlcHZpZXcsIHRpbWVzW3Jvd10hW25dISwgdGltZXNbcm93XSFbdGltZXNbcm93XSEubGVuZ3RoLTFdISlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoc3RlcC4kICE9IFwic3RhcnRcIiAmJiBzdGVwLnZhbC5yZXF1ZXN0ID09IHJlcXVlc3QpIGJvcmRlciA9IGNvbG9yLmdyYXlcbiAgICAgICAgICBlbC5zdHlsZS5ib3JkZXJDb2xvciA9IGJvcmRlclxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgbGV0IGxvZ28gPSBzdGVwTG9nbyhzdGVwKVxuXG4gICAgICBoaWdodExpZ2h0cy5zZXQoW1xuICAgICAgICB7IHBvaW50czogc3RlcHMuc2xpY2UobixuKzIpLm1hcCgocCxpKT0+KHtsb2NhdGlvbjogcC52YWwucG9zfSkpLCBjb2xvcjogXCIjZmZjOTg4XCIgfSxcbiAgICAgICAgeyBwb2ludHM6IFt7bG9jYXRpb246c3RlcC52YWwucG9zLCBsb2dvfV0gfVxuICAgICAgXSlcbiAgICB9KVxuXG5cblxuXG4gICAgdGFidmlldy5yZXBsYWNlQ2hpbGRyZW4odGFibGUoXG4gICAgICBbXCJ0cmFuc3BvcnRlclwiLCBcInN0ZXBzXCJdLm1hcChoPT4gY2VsbChoKSwgKSwgc3R5bGUoe2ZvbnRXZWlnaHQ6IFwiYm9sZFwifSksXG4gICAgICBzY2hlZC5tYXAoKHMsIHJvd24pPT57XG5cbiAgICAgICAgbGV0IGFsbFBvaW50cyA9IHMuc3RlcHMubWFwKHN0ZXA9PiAoeyBsb2NhdGlvbjogc3RlcC52YWwucG9zLCBsb2dvOiBzdGVwTG9nbyhzdGVwKSB9KSlcbiAgICAgICAgbGV0IHRyYW5zcG9ydCA9IHNwYW4odHJhbnNwb3J0ZXJTdHJpbmcocy50cmFuc3BvcnRlcikpXG4gICAgICAgIHRyYW5zcG9ydC5vbm1vdXNlZW50ZXIgPSAoKT0+aGlnaHRMaWdodHMuc2V0KFt7cG9pbnRzOiBhbGxQb2ludHMsIGNvbG9yOiBcIiNmZmM5ODhcIix9XSlcblxuICAgICAgICBzdGVwRWxzLnB1c2goIHMuc3RlcHMubWFwKChzdGVwLGkpPT57XG4gICAgICAgICAgaWYgKGk+MCl7XG4gICAgICAgICAgICBsZXQgcHJldiA9IHMuc3RlcHNbaS0xXSFcbiAgICAgICAgICAgIGxldCBkaXN0ID0gZ2V0Q29zdChwcmV2LnZhbC5wb3MsIHN0ZXAudmFsLnBvcylcbiAgICAgICAgICAgIHRpbWVzW3Jvd25dIS5wdXNoKGFkZCh0aW1lc1tyb3duXSFbaS0xXSEsIGRpc3QpKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB0aW1lID0gdGltZXNbcm93bl0hW2ldIVxuXG4gICAgICAgICAgbGV0IHJlcSA9IHN0ZXBSZXF1ZXN0KHN0ZXApXG5cbiAgICAgICAgICBsZXQgbG9nbyA9IHN0ZXBMb2dvKHN0ZXApXG4gICAgICAgICAgbGV0IHJlcyA9IHNwYW4obG9nbywgc3R5bGUoe3BhZGRpbmc6IFwiLjFlbSAuMWVtXCIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOnJlcSAmJiByZXEuZGVhZGxpbmUudmFsdWUgPCB0aW1lLnZhbHVlID8gY29sb3IucmVkIDogXCJcIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIwLjJlbSBzb2xpZCBcIiArIGNvbG9yLmJhY2tncm91bmQsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiMC4zZW1cIixcbiAgICAgICAgICAgIFxuICAgICAgICAgIH0pKVxuXG4gICAgICAgICAgcmVzLm9uY2xpY2sgPSAoKT0+e1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDTElDS1wiLCByb3duLCBpKVxuICAgICAgICAgICAgY3Vyc29yLnNldCh7cm93OiByb3duLCBjb2w6IGl9KVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxldCByb3c9IHRyKGNlbGwodHJhbnNwb3J0KSwgY2VsbChzdGVwRWxzW3Jvd25dISkpXG4gICAgICAgIHJvd0Vscy5wdXNoKHJvdylcbiAgICAgICAgcmV0dXJuIHJvd1xuICAgICAgfSksXG4gICAgICBzdHlsZSh7IGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsIH0pLFxuICAgICkpO1xuICAgIGxldCByZWplY3RzID0gcmVxdWVzdHMuZmlsdGVyKHI9PiFzY2hlZC5mbGF0TWFwKHM9PnMuc3RlcHMpLnNvbWUoc3RlcD0+c3RlcC4kICE9IFwic3RhcnRcIiAmJiBzdGVwLnZhbC5yZXF1ZXN0ID09IHIuaWQpKVxuXG4gICAgcmVqZWN0Vmlldy5yZXBsYWNlQ2hpbGRyZW4oXG5cbiAgICAgIHJlamVjdHMubGVuZ3RoID09IDAgPyBzcGFuKCkgOiBkaXYoXG4gICAgICAgIGRpdihcbiAgICAgICAgICBwKFwib3BlbiByZXF1ZXN0c1wiLCBzdHlsZSh7Zm9udFdlaWdodDogXCJib2xkXCIsIHBhZGRpbmc6IFwiLjNlbVwiLCBtYXJnaW46IFwiLjNlbVwifSkpLFxuICAgICAgICAgIHJlamVjdHMubWFwKHI9PnNwYW4ocmVxdWVzdFN0cmluZyhyLmlkKSwgc3R5bGUoe3BhZGRpbmc6IFwiLjNlbVwiLCBtYXJnaW46IFwiLjNlbVwiLCB3aGl0ZVNwYWNlOiBcIm5vd3JhcFwifSkpKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBkaXNwbGF5OiBcInJvd1wiLFxuICAgICAgICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjVlbVwiLFxuICAgICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuICB9KVxuXG4gIGxldCB2YWx1ZSA9IHNwYW4oKVxuICBzY2hlZHVsZS5vbnVwZGF0ZShzY2g9PnZhbHVlLnRleHRDb250ZW50ID0gcmF0ZVNjaGVkdWxlKHNjaCkudG9GaXhlZCgyKSlcblxuXG4gIGxldCBzY2hlZHVsZUVsID0gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIHdpZHRoOiBcImNhbGMoMTAwJSAtIDJlbSlcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBvdmVyZmxvdzogXCJhdXRvXCIsXG4gICAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgICBwYWRkaW5nOiBcIi41ZW1cIixcbiAgICB9KSxcbiAgICB0YWJ2aWV3LFxuICAgIHJlamVjdFZpZXcsXG4gICAgcChcIlZhbHVlOiBcIiwgdmFsdWUpLFxuICAgIHAoXCJzZWFyY2ggdGltZTpcIiwgb3B0RHVyKSxcbiAgICBzdGVwdmlldyxcbiAgKVxuICByZXR1cm4gc2NoZWR1bGVFbFxufVxuXG5cblxuZnVuY3Rpb24gdmlld1N0ZXAocm93OiBudW1iZXIsIG46IG51bWJlciwgcGFyZW50OiBIVE1MRWxlbWVudCwgZGlzdDogVGltZSwgdG90YWw6IFRpbWUpe1xuICBsZXQgc3RlcHMgPSBzY2hlZHVsZS5nZXQoKVtyb3ddXG4gIGlmICghc3RlcHMpIHJldHVyblxuICBsZXQgc3RlcCA9IHN0ZXBzLnN0ZXBzW25dXG4gIGlmICghc3RlcCkgcmV0dXJuXG5cbiAgbGV0IGRlY2tzID0gW1tdLFtdXSBhcyBbVVVJRFtdLCBVVUlEW11dXG5cbiAgbGV0IHZpc3VhbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpXG4gIHZpc3VhbC5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblxuICB2aXN1YWwuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCBcIi0wLjEgLTAuMSAxLjIgMS4yXCIpXG4gIHZpc3VhbC5zZXRBdHRyaWJ1dGUoXCJwcmVzZXJ2ZUFzcGVjdFJhdGlvXCIsIFwieE1pZFlNaWQgbWVldFwiKVxuXG4gIGxldCB0cmFuc3BvcnRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicG9seWdvblwiKVxuICBsZXQgcG9pbnRzID0gWyBbLjIsIDBdLCBbLjAsIC4yXSwgWy4wLCAuNF0sIFsuMiwgLjRdLCBbLjgsIC40XSwgWy44LCAuMzddLCBbLjIsIC4zN10sIFsuMiwgLjJdLCBbLjgsIC4yXSwgWy44LCAuMTddLCBbLjIsIC4xN10sXVxuICB0cmFuc3BvcnRlci5zZXRBdHRyaWJ1dGUoXCJwb2ludHNcIiwgcG9pbnRzLm1hcChwPT5wLmpvaW4oXCIsXCIpKS5qb2luKFwiIFwiKSlcbiAgdHJhbnNwb3J0ZXIuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5ibHVlKVxuXG4gIHZpc3VhbC5hcHBlbmRDaGlsZCh0cmFuc3BvcnRlcilcblxuICBkZWNrcy5mb3JFYWNoKChkZWNrLCBpKT0+e1xuICAgIGRlY2suZm9yRWFjaCgocmVxLCBqKT0+e1xuICAgICAgbGV0IGNhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicmVjdFwiKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcInhcIiwgKDAuMjI1ICsgLjIgKiBqKS50b1N0cmluZygpKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcInlcIiwgKDAuMjUgLSAwLjIgICogaSkudG9TdHJpbmcoKSlcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIi4xNVwiKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjAuMTJcIilcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmdyYXkpXG4gICAgICB2aXN1YWwuYXBwZW5kQ2hpbGQoY2FyKVxuXG4gICAgICBsZXQgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwidGV4dFwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ4XCIsICgwLjIyNSArIC4yICogaiArIDAuMDc1KS50b1N0cmluZygpKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ5XCIsICgwLjI3IC0gMC4yICogaSArIDAuMDUpLnRvU3RyaW5nKCkpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImZvbnQtc2l6ZVwiLCBcIi4wNlwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmNvbG9yKVxuICAgICAgdGV4dC50ZXh0Q29udGVudCA9IGAke3JlcXVlc3RzLmZpbmRJbmRleChyPT5yLmlkID09IHJlcSkudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpfWBcbiAgICAgIHZpc3VhbC5hcHBlbmRDaGlsZCh0ZXh0KVxuICAgICAgXG4gICAgfSlcbiAgfSlcblxuICBmb3IgKGxldCB4IG9mIFswLjIsIDAuNl0pe1xuICAgIGxldCB0aXJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJjaXJjbGVcIilcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcImN4XCIsIHgudG9TdHJpbmcoKSlcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcImN5XCIsIFwiMC41XCIpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJyXCIsIFwiMC4wN1wiKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5ibHVlKVxuICAgIHZpc3VhbC5hcHBlbmRDaGlsZCh0aXJlKVxuICB9XG5cblxuXG4gIGxldCBkZWFkID0gc3RlcC4kICE9IFwic3RhcnRcIiAmJiBnZXRSZXF1ZXN0KHN0ZXAudmFsLnJlcXVlc3QpLmRlYWRsaW5lLnZhbHVlIDwgZGlzdC52YWx1ZVxuXG4gIGxldCByZXMgPSBkaXYoXG4gICAgaDIodHJhbnNwb3J0ZXJTdHJpbmcoc3RlcHMudHJhbnNwb3J0ZXIpKSxcbiAgICBwKGAke3RpbWVTdHJpbmcoZGlzdCl9IC8gJHt0aW1lU3RyaW5nKHRvdGFsKX1gKSxcbiAgICBwKHN0ZXBTdHJpbmcoc3RlcCksIHN0eWxlKHtjb2xvcjogZGVhZCA/IGNvbG9yLnJlZCA6IGNvbG9yLmNvbG9yfSkpLFxuICAgIHN0eWxlKHtcbiAgICAgIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZ3JheSlcIixcbiAgICAgIG1hcmdpbjogXCIwXCIsXG4gICAgICBwYWRkaW5nOiBcIi4zZW0gLjVlbVwiLFxuICAgICAgbWluSGVpZ2h0OiBcIjJlbVwiLFxuICAgIH0pXG4gIClcblxuICByZXMuYXBwZW5kKHZpc3VhbClcbiAgcGFyZW50LnJlcGxhY2VDaGlsZHJlbihyZXMpXG59XG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyBMb2NhdGlvbiwgcmFuZG9tVVVJRCwgUmVxdWVzdCwgU2NoZWR1bGUsIHVjb25zdCwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgcmVxdWVzdFZpZXcgfSBmcm9tIFwiLi9yZXF1ZXN0Vmlld1wiO1xuaW1wb3J0IHsgc2NoZWR1bGVWaWV3IH0gZnJvbSBcIi4vc2NoZWR1bGVWaWV3XCI7XG5pbXBvcnQgeyBta1dyaXRhYmxlIH0gZnJvbSBcIi4uL3dyaXRlYWJsZVwiO1xuaW1wb3J0IHsgY29uZmlndXJlUGxhbm5lciwgb3B0aW1pemVTY2hlZHVsZSB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kb20sIHNldFJhbmRTZWVkIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuXG5cbmJvZHkuc3R5bGUubWFyZ2luID0gXCIwXCJcblxubGV0IGhlYWRlciA9IGgxKFwicm91dGUgcGxhbm5lclwiLCBzdHlsZSh7YmFja2dyb3VuZDogY29sb3IuYmx1ZSwgY29sb3I6IGNvbG9yLmJhY2tncm91bmQsIG1hcmdpbjogXCIwXCIsIHBhZGRpbmc6IFwiLjZlbVwifSkpXG5cbmxldCBjb250ZW50U3BhY2UgPSBkaXYoc3R5bGUoe1xuICBkaXNwbGF5OlwiZmxleFwiLFxuICBmbGV4RGlyZWN0aW9uOlwicm93XCIsXG4gIHdpZHRoOiBcIjEwMCVcIixcbiAgaGVpZ2h0OiBcImNhbGMoMTAwJSAtIDIuNWVtKVwiLFxuICBtaW5XaWR0aDogXCIwXCIsXG59KSlcblxubGV0IHBhZ2UgPSBkaXYoXG4gIHN0eWxlKHtkaXNwbGF5OlwiZmxleFwiLCBmbGV4RGlyZWN0aW9uOlwiY29sdW1uXCIsIGhlaWdodDogXCIxMDAlXCJ9KSxcbiAgaGVhZGVyLFxuICBjb250ZW50U3BhY2VcbilcblxuYm9keS5yZXBsYWNlQ2hpbGRyZW4ocGFnZSlcblxuXG5zZXRSYW5kU2VlZCgyNSlcblxuXG5leHBvcnQgbGV0IHJvYWRNYXAgPSByYW5kb21NYXAoKVxuXG5leHBvcnQgbGV0IHJlcXVlc3RzOiBSZXF1ZXN0W10gPSBBcnJheS5mcm9tKHtsZW5ndGg6MjB9LCAoXyxpKT0+KHtcbiAgaWQ6IHJhbmRvbVVVSUQoKSxcbiAgc3RhcnRQb2ludDogcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyksXG4gIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRNYXAucG9pbnRzKSxcbiAgdmFsdWU6IHVjb25zdChNYXRoLmZsb29yKHJhbmRvbSgpKjEwMDApLCBcImV1clwiKSxcbiAgZGVhZGxpbmU6IHVjb25zdChNYXRoLmZsb29yKHJhbmRvbSgpKjYwKjYwKjI0KjcpLCBcInNlY29uZHNcIiksXG59KSlcblxuXG5leHBvcnQgbGV0IHNjaGVkdWxlID0gbWtXcml0YWJsZTxTY2hlZHVsZT4gKEFycmF5LmZyb20oe2xlbmd0aDogM30sIChfLGkpPT4oe1xuICB0cmFuc3BvcnRlcjogcmFuZG9tVVVJRCgpLFxuICBzdGVwczogW3sgJDpcInN0YXJ0XCIsIHZhbDoge1wicG9zXCI6ICByYW5kQ2hvaWNlKHJvYWRNYXAucG9pbnRzKX19XVxufSkpKVxuXG5jb25maWd1cmVQbGFubmVyKHsgcmVxdWVzdHMsIHJvYWRNYXAgfSlcblxuc2NoZWR1bGUudXBkYXRlKHNjaGVkPT5vcHRpbWl6ZVNjaGVkdWxlKHJlcXVlc3RzLCBzY2hlZCkpXG5cblxuZXhwb3J0IHR5cGUgSGlnaExpZ2h0ID0ge1xuICBwb2ludHM6IHtcbiAgICBsb2NhdGlvbjogTG9jYXRpb24sXG4gICAgbG9nbz8gOiBzdHJpbmcsXG4gIH1bXSxcbiAgY29sb3I/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGxldCBoaWdodExpZ2h0cyA9IG1rV3JpdGFibGUgPEhpZ2hMaWdodFtdPiggW10gKVxuXG5cbmZ1bmN0aW9uIG1rV2luZG93ICh0YWI6IG51bWJlciA9IDAgKSB7XG5cbiAgbGV0IHRhYkZpZWxkcyA9IFtcbiAgICBbJ21hcCcsIG1hcFZpZXcocm9hZE1hcCldLFxuICAgIFsncmVxdWVzdHMnLCByZXF1ZXN0VmlldyhyZXF1ZXN0cywgc2NoZWR1bGUuZ2V0KCkpXSxcbiAgICBbJ3NjaGVkdWxlJywgc2NoZWR1bGVWaWV3KCkgXSxcbiAgXSBhcyBjb25zdFxuXG4gIGNvbnN0IGVsID0gZGl2KHN0eWxlKHtcbiAgICBmbGV4OiBcIjEgMSAwXCIsXG4gICAgbWluV2lkdGg6IFwiMFwiLFxuICAgIGhlaWdodDogXCJjYWxjKDEwMHZoIC0gMWVtKVwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICBvdmVyZmxvdzogXCJoaWRkZW5cIixcbiAgfSkpXG5cbiAgZnVuY3Rpb24gb3BlblRhYih0YWI6IHR5cGVvZiB0YWJGaWVsZHNbbnVtYmVyXVswXSkge1xuICAgIGVsLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIHAodGFiRmllbGRzLm1hcCgoW24sZV0pPT5cbiAgICAgICAgc3BhbiggbixcbiAgICAgICAgICAoKT0+b3BlblRhYihuKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIuM2VtXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIisgKG49PXRhYiA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSksXG4gICAgICAgICAgICBjb2xvcjogKG49PXRhYikgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKSksXG4gICAgICB0YWJGaWVsZHMuZmluZCgoW24sXSk9Pm49PXRhYikhWzFdXG4gICAgKVxuICB9XG5cblxuICBvcGVuVGFiKHRhYkZpZWxkc1t0YWJdIVswXSlcblxuICByZXR1cm4gZWxcbn1cblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbihta1dpbmRvdygyICksIG1rV2luZG93KCkpXG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBRU8sSUFBTSxPQUFPLFNBQVM7QUFFN0IsSUFBTSxlQUFlO0FBQUEsRUFDbkIsT0FBTTtBQUFBLElBQ0osT0FBbUI7QUFBQSxJQUNuQixZQUFtQjtBQUFBLElBQ25CLEtBQW1CO0FBQUEsSUFDbkIsT0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFDQSxNQUFLO0FBQUEsSUFDSCxPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIs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QUFBQSxFQUNyQyxVQUFVLFdBQVcsUUFBUSxNQUFNO0FBQUEsRUFDbkMsT0FBTyxPQUFPLEtBQUssTUFBTSxPQUFPLElBQUUsSUFBSSxHQUFHLEtBQUs7QUFBQSxFQUM5QyxVQUFVLE9BQU8sS0FBSyxNQUFNLE9BQU8sSUFBRSxLQUFHLEtBQUcsS0FBRyxDQUFDLEdBQUcsU0FBUztBQUM3RCxFQUFFO0FBR0ssSUFBSSxXQUFXLFdBQXNCLE1BQU0sS0FBSyxFQUFDLFFBQVEsRUFBQyxHQUFHLENBQUMsR0FBRSxPQUFLO0FBQUEsRUFDMUUsYUFBYSxXQUFXO0FBQUEsRUFDeEIsT0FBTyxDQUFDLEVBQUUsR0FBRSxTQUFTLEtBQUssRUFBQyxLQUFRLFdBQVcsUUFBUSxNQUFNLEVBQUMsRUFBQyxDQUFDO0FBQ2pFLEVBQUUsQ0FBQztBQUVILGlCQUFpQixFQUFFLHFCQUFVLFFBQVEsQ0FBQztBQUV0QyxTQUFTLE9BQU8sV0FBTyxpQkFBaUIsV0FBVSxLQUFLLENBQUM7QUFXakQsSUFBSSxjQUFjLFdBQTBCLENBQUMsQ0FBRTtBQUd0RCxTQUFTLFFBQVMsQ0FBQyxNQUFjLEdBQUk7QUFBQSxFQUVuQyxJQUFJLFlBQVk7QUFBQSxJQUNkLENBQUMsT0FBTyxRQUFRLE9BQU8sQ0FBQztBQUFBLElBQ3hCLENBQUMsWUFBWSxZQUFZLFdBQVUsU0FBUyxJQUFJLENBQUMsQ0FBQztBQUFBLElBQ2xELENBQUMsWUFBWSxhQUFhLENBQUU7QUFBQSxFQUM5QjtBQUFBLEVBRUEsTUFBTSxLQUFLLElBQUksTUFBTTtBQUFBLElBQ25CLE1BQU07QUFBQSxJQUNOLFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLFFBQVEsZUFBYSxNQUFNO0FBQUEsSUFDM0IsVUFBVTtBQUFBLEVBQ1osQ0FBQyxDQUFDO0FBQUEsRUFFRixTQUFTLE9BQU8sQ0FBQyxNQUFrQztBQUFBLElBQ2pELEdBQUcsZ0JBQ0QsRUFBRSxVQUFVLElBQUksRUFBRSxHQUFFLE9BQ2xCLEtBQU0sR0FDSixNQUFJLFFBQVEsQ0FBQyxHQUNiLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFFBQVEsZ0JBQWUsS0FBRyxPQUFNLE1BQU0sUUFBUSxNQUFNO0FBQUEsTUFDcEQsT0FBUSxLQUFHLE9BQU8sTUFBTSxRQUFRLE1BQU07QUFBQSxJQUN4QyxDQUFDLENBQ0gsQ0FDRixDQUFDLEdBQ0QsVUFBVSxLQUFLLEVBQUUsT0FBTSxLQUFHLElBQUcsRUFBRyxFQUNsQztBQUFBO0FBQUEsRUFJRixRQUFRLFVBQVUsS0FBTSxFQUFFO0FBQUEsRUFFMUIsT0FBTztBQUFBO0FBR1QsYUFBYSxnQkFBZ0IsU0FBUyxDQUFFLEdBQUcsU0FBUyxDQUFDOyIsCiAgImRlYnVnSWQiOiAiRkVCODlFRDMzMzAxMTBGNDY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
