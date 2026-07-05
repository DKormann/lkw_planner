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
var COST_PER_H = 50;
var COST_PER_SECOND = COST_PER_H / 3600;
function pairId(a2, b) {
  return a2 < b ? `${a2}-${b}` : `${b}-${a2}`;
}
var CostMatrix = new Map;
function findPath(start, end) {
  let visited = new Map;
  visited.set(start, { dist: uconst(0, "seconds"), path: [start] });
  let queue = [start];
  while (queue.length > 0) {
    let current = queue.shift();
    if (current == end) {
      break;
    }
    for (let [next, dist] of roadMap.roads.get(current) ?? []) {
      let cost = add(visited.get(current).dist, dist);
      if (!visited.has(next) || cost < visited.get(next).dist) {
        visited.set(next, { dist: cost, path: [...visited.get(current).path, next] });
        queue.push(next);
      }
    }
  }
  let path = visited.get(end);
  if (!path)
    throw new Error(`No path found from ${start} to ${end}`);
  CostMatrix.set(pairId(start, end), path.dist);
  return path;
}
function getCost(start, end) {
  let id = pairId(start, end);
  if (!CostMatrix.has(id))
    findPath(start, end);
  return CostMatrix.get(id);
}
function getCostN(...points) {
  let cost = uconst(0, "seconds");
  for (let i = 0;i < points.length - 1; i++) {
    iadd(cost, getCost(points[i], points[i + 1]));
  }
  return cost;
}
var optDur = 0;
function optimizeSchedule(requests2, schedule) {
  let free_requests = [...requests2.filter((x) => !schedule.flatMap((y) => y.steps).some((z) => z.$ == "pickup" && z.val.request == x.id))];
  function permute(schedule2) {
    let rating = rateSchedule(schedule2);
    for (let schedItem of schedule2) {
      if (random() < 0.1) {
        if (random() < 0.5) {
          if (free_requests.length > 1) {
            let req = free_requests.shift();
            let oldsteps = schedItem.steps;
            let itemrating = rateSchedule([schedItem]);
            schedItem.steps = [
              ...oldsteps,
              { $: "pickup", val: { request: req.id, pos: randChoice(roadMap.points), deck: random() > 0.5 ? 1 : 0 } },
              { $: "deliver", val: { request: req.id, pos: randChoice(roadMap.points) } }
            ];
            let newrating = rateSchedule([schedItem]);
            if (newrating < itemrating) {
              schedItem.steps = oldsteps;
              free_requests.push(req);
            }
            continue;
          }
        } else {
          if (schedItem.steps.length > 3) {
            let itemrating = rateSchedule([schedItem]);
            let req = randChoice(schedItem.steps.filter((x) => x.$ == "pickup")).val.request;
            let oldsteps = schedItem.steps;
            schedItem.steps = oldsteps.filter((x) => x.$ == "start" || x.val.request != req);
            let newrating = rateSchedule([schedItem]);
            if (newrating < itemrating) {
              schedItem.steps = oldsteps;
            } else
              console.log("removed request ", req, " from schedule");
            continue;
          }
        }
      }
      if (schedItem.steps.length <= 2)
        continue;
      let a2 = 1 + randint(schedItem.steps.length - 1);
      let b = 1 + randint(schedItem.steps.length - 1);
      swap(schedItem.steps, a2, b);
      let newrate = rateSchedule(schedule2);
      if (newrate <= rating)
        swap(schedItem.steps, a2, b);
      if (random() > 0.5) {
        let c = schedItem.steps[1 + randint(schedItem.steps.length - 1)];
        if (c?.$ == "pickup") {
          c.val.deck = c.val.deck == 0 ? 1 : 0;
          let newrate2 = rateSchedule(schedule2);
          if (newrate2 <= rating)
            c.val.deck = c.val.deck == 0 ? 1 : 0;
        }
      }
    }
  }
  let st = Date.now();
  for (let i = 0;i < 2000; i++) {
    if (i == 0 || (i + 1) % 1000 == 0) {
      console.log("opt step: ", i + 1);
    }
    permute(schedule);
  }
  optDur = Date.now() - st;
  return schedule;
}
function randint(n) {
  return Math.floor(random() * n);
}
function swap(s, a2, b) {
  let t = s[a2];
  s[a2] = s[b];
  s[b] = t;
}
function rateSchedule(schedule) {
  let res = uconst(0, "eur");
  let duration = uconst(0, "seconds");
  let decks;
  for (let item of schedule) {
    let unload = function(reqid, deck) {
      let idx = decks[deck].indexOf(reqid);
      if (idx == -1)
        return false;
      let after = decks[deck].slice(idx + 1);
      decks[deck] = decks[deck].slice(0, idx).concat(after);
      isub(res, UNLOADCOST);
      isub(res, mul(add(UNLOADCOST, PICKUPCOST), after.length));
      return true;
    };
    decks = [[], []];
    if (item.steps[0]?.$ != "start")
      return -Infinity;
    for (let step of item.steps.slice(1)) {
      if (step.$ == "pickup") {
        decks[step.val.deck].push(step.val.request);
        if (decks[step.val.deck].length > DECKCAPACITY)
          return -Infinity;
      } else if (step.$ == "deliver") {
        let reqid = step.val.request;
        let req = requests.find((x) => reqid == x.id);
        if (!req)
          throw new Error("not found request: " + step.val.request);
        if (!unload(reqid, 0) && !unload(reqid, 1))
          return -Infinity;
        if (duration.value < req.deadline.value)
          iadd(res, req.value);
      } else
        return -Infinity;
    }
    iadd(duration, getCostN(...item.steps.map((x) => x.val.pos)));
  }
  return res.value - duration.value * COST_PER_SECOND;
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
  let req = requests.find((r) => r.id == id);
  if (!req)
    return "UNK";
  return `\uD83D\uDCE6 ${requests.findIndex((x) => x.id == id).toString().padStart(4, "0")}`;
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
  let req = requests.find((r) => r.id == id);
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
    let rejects = requests.filter((r) => !sched.flatMap((s) => s.steps).some((step) => step.$ != "start" && step.val.request == r.id));
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
      text.textContent = `${requests.findIndex((r) => r.id == req).toString().padStart(4, "0")}`;
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
var requests = Array.from({ length: 20 }, (_, i) => ({
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
schedule.update((sched) => optimizeSchedule(requests, sched));
var hightLights = mkWritable([]);
function mkWindow(tab = 0) {
  let tabFields = [
    ["map", mapView(roadMap)],
    ["requests", requestView(requests, schedule.get())],
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
  requests,
  hightLights
};

//# debugId=B271AAA1079B8BDF64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvcmFuZG9tLnRzIiwgInNyYy9zY2hlbWEudHMiLCAic3JjL3R5cGVzLnRzIiwgInNyYy9wbGFubmVyLnRzIiwgInNyYy92aWV3L21hcFZpZXcudHMiLCAic3JjL3JhbmRvbU1hcC50cyIsICJzcmMvdmlldy9yZXF1ZXN0Vmlldy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy92aWV3L3NjaGVkdWxlVmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiXG5cblxubGV0IFJBTkRTRUVEID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UmFuZFNlZWQoc2VlZDogbnVtYmVyKXtcbiAgUkFORFNFRUQgPSBzZWVkXG4gIFJBTkRTRUVEID0gcmFuZEludCgwLCAxMDAwMClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbSgpe1xuICBsZXQgeCA9IE1hdGguc2luKFJBTkRTRUVEKyspICogMTAwMDA7XG4gIHJldHVybiB4IC0gTWF0aC5mbG9vcih4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRJbnQobWluOiBudW1iZXIsIG1heDogbnVtYmVyKXtcbiAgcmV0dXJuIE1hdGguZmxvb3IocmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kQ2hvaWNlPFQ+KGFycjogVFtdKTogVCB7XG4gIHJldHVybiBhcnJbcmFuZEludCgwLCBhcnIubGVuZ3RoLTEpXSFcbn1cblxuXG4iLAogICAgImltcG9ydCB7IHZhbGlkYXRlSnNvblNjaGVtYSB9IGZyb20gXCIuL2pzb25zY2hlbWFcIlxuXG5cbmV4cG9ydCB0eXBlIEpTT05TY2hlbWEgPSB7IFtrZXk6IHN0cmluZ106IEpzb25EYXRhIH1cblxuXG5leHBvcnQgdHlwZSBKc29uRGF0YSA9IHN0cmluZyB8IG51bGwgfCBudW1iZXIgfCBib29sZWFuIHwgeyBba2V5IGluIHN0cmluZ106IEpzb25EYXRhIH0gfCBKc29uRGF0YVtdXG5cbmV4cG9ydCB0eXBlIFNjaGVtYTxUPiA9IHsganNvbjogSlNPTlNjaGVtYSB9XG5cbmV4cG9ydCB0eXBlIEluZmVyPFM+ID0gUyBleHRlbmRzIFNjaGVtYTxpbmZlciBUPiA/IFQgOiBuZXZlclxuXG5leHBvcnQgY29uc3QgdmFsaWRhdGUgPSA8VD4gKHNjaGVtYTogU2NoZW1hPFQ+LCBkYXRhOnVua25vd24pIDogVCA9PiB7XG4gIHJldHVybiB2YWxpZGF0ZUpzb25TY2hlbWE8VD4oc2NoZW1hLmpzb24sIGRhdGEpXG59XG5cbmV4cG9ydCBjb25zdCBzdHJpbmdpZnkgPSAoZGF0YTogSnNvbkRhdGEpOiBzdHJpbmcgPT4gSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMilcblxuXG5leHBvcnQgY29uc3QgZmlsbFNjaGVtYSA9IDxUPihzY2hlbWE6IFNjaGVtYTxUPikgOiBUID0+e1xuICBsZXQganNvbiA9IHNjaGVtYS5qc29uXG4gIGlmIChqc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwiXCIgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVtYmVyXCIpIHJldHVybiAwIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcImJvb2xlYW5cIikgcmV0dXJuIGZhbHNlIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIG51bGwgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYXJyYXlcIikgcmV0dXJuIFtdIGFzIFRcbiAgaWYgKGpzb24udHlwZSA9PSBcIm9iamVjdFwiICYmIGpzb24ucHJvcGVydGllcyl7XG4gICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7fVxuICAgIGxldCByZXF1aXJlZCA9IEFycmF5LmlzQXJyYXkoanNvbi5yZXF1aXJlZCkgPyBqc29uLnJlcXVpcmVkIGFzIHN0cmluZ1tdIDogW11cbiAgICBmb3IgKGxldCByZXEgb2YgcmVxdWlyZWQpXG4gICAgICByZXN1bHRbcmVxXSA9IGZpbGxTY2hlbWEoe2pzb246IChqc29uLnByb3BlcnRpZXMgYXMgYW55KVtyZXFdfSlcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBqc29uKSByZXR1cm4ganNvbi5jb25zdCBhcyBUXG4gIGlmIChcImFueU9mXCIgaW4ganNvbiAmJiBBcnJheS5pc0FycmF5KGpzb24uYW55T2YpKSByZXR1cm4gZmlsbFNjaGVtYSh7anNvbjoganNvbi5hbnlPZlswXSBhcyBKU09OU2NoZW1hfSkgYXMgVFxuICByZXR1cm4gbnVsbCBhcyBUXG59XG5cbmV4cG9ydCBjb25zdCBmcm9tSnNvblNjaGVtYSA9IDxUPiAoanNvbjogSlNPTlNjaGVtYSk6IFNjaGVtYTxUPiA9PiAoe2pzb259KVxuXG5leHBvcnQgY29uc3Qgc3RyaW5nOiBTY2hlbWE8c3RyaW5nPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcInN0cmluZ1wifSlcbmV4cG9ydCBjb25zdCBudW1iZXI6IFNjaGVtYTxudW1iZXI+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVtYmVyXCJ9KVxuZXhwb3J0IGNvbnN0IGJvb2xlYW46IFNjaGVtYTxib29sZWFuPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImJvb2xlYW5cIn0pXG5leHBvcnQgY29uc3QgbnVsbFNjaGVtYSA6IFNjaGVtYTxudWxsPiA9IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm51bGxcIn0pXG5leHBvcnQgY29uc3QgYW55OiBTY2hlbWE8YW55PiA9IGZyb21Kc29uU2NoZW1hKHt9KVxuZXhwb3J0IGNvbnN0IG9wdGlvbmFsID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFNjaGVtYTxUIHwgbnVsbD4gPT4gZnJvbUpzb25TY2hlbWEoe2FueU9mOiBbe3R5cGU6IFwibnVsbFwifSwgc2NoZW1hLmpzb25dfSlcbmV4cG9ydCBjb25zdCBhcnJheSA9IDxUPihpdGVtU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8VFtdPiA9PiBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJhcnJheVwiLCBpdGVtczogaXRlbVNjaGVtYS5qc29ufSlcbmV4cG9ydCBjb25zdCBjb25zdGFudCA9IDxUIGV4dGVuZHMgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbj4odmFsdWU6IFQpOiBTY2hlbWE8VD4gPT4gZnJvbUpzb25TY2hlbWEoe2NvbnN0OiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBvYmplY3QgPSA8UyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIFNjaGVtYTxhbnk+Pj4gKHNoYXBlOiBTKTogU2NoZW1hPHtbSyBpbiBrZXlvZiBTXTogSW5mZXI8U1tLXT59PiA9PiBmcm9tSnNvblNjaGVtYSh7XG4gIHR5cGU6IFwib2JqZWN0XCIsXG4gIHByb3BlcnRpZXM6IE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyhzaGFwZSkubWFwKChba2V5LCBmaWVsZF0pPT4gW2tleSwgZmllbGQuanNvbl0pKSxcbiAgcmVxdWlyZWQ6IE9iamVjdC5rZXlzKHNoYXBlKVxufSlcblxuZXhwb3J0IGNvbnN0IHJlY29yZCA9IDxUPih2YWx1ZVNjaGVtYTogU2NoZW1hPFQ+KTogU2NoZW1hPFJlY29yZDxzdHJpbmcsIFQ+PiA9PiBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJvYmplY3RcIiwgYWRkaXRpb25hbFByb3BlcnRpZXM6IHZhbHVlU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IHNjaGVtYVNjaGVtYSA6IFNjaGVtYTxKU09OU2NoZW1hPiA9IHJlY29yZChhbnkpXG5cbmV4cG9ydCBjb25zdCB1bmlvbiA9IDxTIGV4dGVuZHMgU2NoZW1hPGFueT5bXT4oLi4uc2NoZW1hczogUyk6IFNjaGVtYTxJbmZlcjxTW251bWJlcl0+PiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IHNjaGVtYXMubWFwKHM9PiBzLmpzb24pfSlcblxuZXhwb3J0IGZ1bmN0aW9uIHRhZ2dlZCA8UyBleHRlbmRzIHtba2V5IDogc3RyaW5nXTogU2NoZW1hPGFueT59PiAoZmllbGRzOiBTKSA6IFNjaGVtYTx7W2tleSBpbiBrZXlvZiBTXTogeyQ6IGtleSwgdmFsOkluZmVyPFNba2V5XT59IH1ba2V5b2YgU10+IHtcbiAgcmV0dXJuIHVuaW9uKC4uLk9iamVjdC5lbnRyaWVzKGZpZWxkcykubWFwKChbJCx2YWxdKT0+b2JqZWN0KHskOmNvbnN0YW50KCQpLHZhbH0pKSlcbn1cblxuXG5cblxuZXhwb3J0IGNvbnN0IGludGVyc2VjdGlvbiA9IDxTIGV4dGVuZHMgU2NoZW1hPGFueT5bXT4oLi4uc2NoZW1hczogUyk6IFNjaGVtYTxJbmZlcjxTW251bWJlcl0+PiA9PiBmcm9tSnNvblNjaGVtYSh7YWxsT2Y6IHNjaGVtYXMubWFwKHM9PiBzLmpzb24pfSlcblxuZXhwb3J0IGNvbnN0IGFzVHlwZVZpZXcgPSAoc2NoZW1hOiBTY2hlbWE8YW55Pik6IHN0cmluZyA9PiB7XG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwic3RyaW5nXCIpIHJldHVybiBcInN0cmluZ1wiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwibnVtYmVyXCIpIHJldHVybiBcIm51bWJlclwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gXCJib29sZWFuXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudWxsXCIpIHJldHVybiBcIm51bGxcIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcImFycmF5XCIgJiYgc2NoZW1hLmpzb24uaXRlbXMpIHJldHVybiBgJHthc1R5cGVWaWV3KHtqc29uOiBzY2hlbWEuanNvbi5pdGVtcyBhcyBKU09OU2NoZW1hfSl9W11gXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYgc2NoZW1hLmpzb24ucHJvcGVydGllcyl7XG4gICAgbGV0IHByb3BzID0gT2JqZWN0LmVudHJpZXMoc2NoZW1hLmpzb24ucHJvcGVydGllcykubWFwKChba2V5LCBwcm9wXSk9PiBgJHtrZXl9OiAke2FzVHlwZVZpZXcoe2pzb246IHByb3AgYXMgSlNPTlNjaGVtYX0pfWApXG4gICAgcmV0dXJuIGB7XFxuICAke3Byb3BzLmpvaW4oXCIsXFxuXCIpLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCJcXG4gIFwiKX1cXG59YFxuICB9XG4gIGlmIChcImNvbnN0XCIgaW4gc2NoZW1hLmpzb24pIHJldHVybiBKU09OLnN0cmluZ2lmeShzY2hlbWEuanNvbi5jb25zdClcbiAgaWYgKFwiYW55T2ZcIiBpbiBzY2hlbWEuanNvbiAmJiBBcnJheS5pc0FycmF5KHNjaGVtYS5qc29uLmFueU9mKSkgcmV0dXJuIHNjaGVtYS5qc29uLmFueU9mLm1hcChzPT4gYXNUeXBlVmlldyh7anNvbjogcyBhcyBKU09OU2NoZW1hfSkpLmpvaW4oXCIgfCBcIilcbiAgcmV0dXJuIFwiYW55XCJcbn1cblxuXG5cbmV4cG9ydCBjbGFzcyBMb2NhbFN0b3JlZCA8VCBleHRlbmRzIEpzb25EYXRhPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBrZXk6IHN0cmluZywgcHVibGljIHNjaGVtYTogU2NoZW1hPFQ+LCBwdWJsaWMgZGVmYXVsdFZhbHVlOiBUKXt9XG5cbiAgZ2V0KCk6VCB7XG4gICAgbGV0IHJhdyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMua2V5KVxuICAgIHRyeXtcbiAgICAgIHJldHVybiB2YWxpZGF0ZSh0aGlzLnNjaGVtYSwgSlNPTi5wYXJzZShyYXchKSlcbiAgICB9Y2F0Y2goZSl7XG4gICAgICByZXR1cm4gdGhpcy5kZWZhdWx0VmFsdWVcbiAgICB9XG4gIH1cbiAgc2V0KHZhbHVlOiBUKXtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLmtleSwgSlNPTi5zdHJpbmdpZnkodmFsaWRhdGUodGhpcy5zY2hlbWEsIHZhbHVlKSkpXG4gIH1cbn1cbiIsCiAgICAiaW1wb3J0IHsgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5pbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cblxuZXhwb3J0IHR5cGUgVVVJRCA9IGB1JHtzdHJpbmd9LSR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBVVUlEIDogU2NoZW1hPFVVSUQ+ID0gc3RyaW5nXG5cblxuZXhwb3J0IHR5cGUgVW5pdCA8cyBleHRlbmRzIHN0cmluZz4gPSB7dmFsdWU6IG51bWJlciwgdW5pdDogc31cbmV4cG9ydCBjb25zdCBVbml0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHVuaXQ6IHMpID0+IG9iamVjdCh7dmFsdWU6IG51bWJlciwgdW5pdDogY29uc3RhbnQodW5pdCl9KVxuXG5leHBvcnQgY29uc3QgdWNvbnN0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHZhbHVlOiBudW1iZXIsIHVuaXQ6IHMpIDogVW5pdDxzPiA9PiAoe3ZhbHVlLCB1bml0fSlcbmV4cG9ydCBjb25zdCBhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgOiBVbml0PHM+ID0+ICh7dmFsdWU6IGEudmFsdWUgKyBiLnZhbHVlLCB1bml0OiBhLnVuaXR9KVxuZXhwb3J0IGNvbnN0IGlhZGQgPSA8cyBleHRlbmRzIHN0cmluZz4oYTogVW5pdDxzPiwgYjogVW5pdDxzPikgPT4ge2EudmFsdWUgKz0gYi52YWx1ZX1cblxuZXhwb3J0IGNvbnN0IHN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA6IFVuaXQ8cz4gPT4gKHt2YWx1ZTogYS52YWx1ZSAtIGIudmFsdWUsIHVuaXQ6IGEudW5pdH0pXG5leHBvcnQgY29uc3QgaXN1YiA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA9PiB7YS52YWx1ZSAtPSBiLnZhbHVlfVxuZXhwb3J0IGNvbnN0IG11bCA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBudW1iZXIpIDogVW5pdDxzPiA9PiAoe3ZhbHVlOiBhLnZhbHVlICogYiwgdW5pdDogYS51bml0fSlcblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tVVVJRCgpIHtyZXR1cm4gXCJ1XCIgKyByYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSBhcyBVVUlEfVxuXG5leHBvcnQgY29uc3QgUHJpY2UgPSBVbml0KFwiZXVyXCIpXG5leHBvcnQgY29uc3QgVGltZSA9IFVuaXQoXCJzZWNvbmRzXCIpXG5leHBvcnQgdHlwZSBQcmljZSA9IFVuaXQ8XCJldXJcIj5cbmV4cG9ydCB0eXBlIFRpbWUgPSBVbml0PFwic2Vjb25kc1wiPlxuXG5cbmV4cG9ydCB0eXBlIExvY2F0aW9uID0gYGxvYyR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBMb2NhdGlvbiA6IFNjaGVtYTxMb2NhdGlvbj4gPSBzdHJpbmdcblxuZXhwb3J0IGNvbnN0IFJlcXVlc3QgPSBvYmplY3Qoe1xuICBpZDogVVVJRCxcbiAgc3RhcnRQb2ludDogTG9jYXRpb24sXG4gIGVuZFBvaW50OiBMb2NhdGlvbixcbiAgdmFsdWU6IFByaWNlLFxuICBkZWFkbGluZTogVGltZSxcbn0pXG5cbmV4cG9ydCBjb25zdCBUcmFuc3BvcnRlciA9IG9iamVjdCh7IGlkOiBVVUlELCBwb3NpdGlvbjogVVVJRCwgfSlcblxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlU3RlcCA9IHRhZ2dlZCh7XG4gIHBpY2t1cDogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IExvY2F0aW9uLCBkZWNrOiB1bmlvbihjb25zdGFudCgwKSwgY29uc3RhbnQoMSkpfSksXG4gIGRlbGl2ZXI6IG9iamVjdCh7cmVxdWVzdDogVVVJRCwgcG9zOiBMb2NhdGlvbn0pLFxuICBzdGFydDogb2JqZWN0KHtwb3M6IExvY2F0aW9ufSksXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cbmV4cG9ydCBjb25zdCBNb2R1bGUgPSBvYmplY3Qoe1xuXG4gIHJlcXVlc3RzOiBhcnJheShSZXF1ZXN0KSxcbiAgdHJhbnNwb3J0ZXJzOiBhcnJheShUcmFuc3BvcnRlciksXG4gIHNjaGVkdWxlOiBTY2hlZHVsZSxcblxufSlcblxuZXhwb3J0IHR5cGUgUmVxdWVzdCA9IEluZmVyPHR5cGVvZiBSZXF1ZXN0PlxuZXhwb3J0IHR5cGUgVHJhbnNwb3J0ZXIgPSBJbmZlcjx0eXBlb2YgVHJhbnNwb3J0ZXI+XG5leHBvcnQgdHlwZSBTY2hlZHVsZVN0ZXAgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVTdGVwPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGVJdGVtID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlSXRlbT5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlID0gSW5mZXI8dHlwZW9mIFNjaGVkdWxlPlxuXG4iLAogICAgImltcG9ydCB7IFRpbWUsIGFkZCwgdWNvbnN0LCBpYWRkLCB0eXBlIExvY2F0aW9uLCB0eXBlIFJlcXVlc3QsIHR5cGUgU2NoZWR1bGUsIHR5cGUgU2NoZWR1bGVJdGVtLCB0eXBlIFVVSUQsIGlzdWIsIG11bCB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyByZXF1ZXN0cywgcm9hZE1hcCB9IGZyb20gXCIuL3ZpZXcvbWFpblwiO1xuaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cblxuY29uc3QgREVDS0NBUEFDSVRZID0gM1xuY29uc3QgVU5MT0FEQ09TVCA9IHVjb25zdCgxMCwgXCJldXJcIilcbmNvbnN0IFBJQ0tVUENPU1QgPSB1Y29uc3QoNSwgXCJldXJcIilcbmNvbnN0IENPU1RfUEVSX0ggPSA1MFxuY29uc3QgQ09TVF9QRVJfU0VDT05EID0gQ09TVF9QRVJfSCAvIDM2MDBcblxuXG5leHBvcnQgZnVuY3Rpb24gcGFpcklkKGE6IHN0cmluZywgYjogc3RyaW5nKTogc3RyaW5ne1xuICByZXR1cm4gYSA8IGIgPyBgJHthfS0ke2J9YCA6IGAke2J9LSR7YX1gXG59XG5cbmNvbnN0IENvc3RNYXRyaXggPSBuZXcgTWFwPHN0cmluZywgVGltZT4oKVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhdGgoc3RhcnQ6IExvY2F0aW9uLCBlbmQ6IExvY2F0aW9uKToge3BhdGg6IExvY2F0aW9uW10sIGRpc3Q6IFRpbWV9e1xuXG5cbiAgbGV0IHZpc2l0ZWQgPSBuZXcgTWFwPExvY2F0aW9uLCB7ZGlzdDogVGltZSwgcGF0aDogTG9jYXRpb25bXX0+KClcbiAgdmlzaXRlZC5zZXQoc3RhcnQsIHtkaXN0OiB1Y29uc3QoMCwgXCJzZWNvbmRzXCIpLCBwYXRoOiBbc3RhcnRdfSlcbiAgbGV0IHF1ZXVlID0gW3N0YXJ0XVxuXG4gIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwKXtcbiAgICBsZXQgY3VycmVudCA9IHF1ZXVlLnNoaWZ0KCkhXG4gICAgaWYgKGN1cnJlbnQgPT0gZW5kKXsgYnJlYWt9XG4gIFxuICAgIGZvciAobGV0IFtuZXh0LCBkaXN0XSBvZiByb2FkTWFwLnJvYWRzLmdldChjdXJyZW50KSA/PyBbXSl7XG4gICAgICBsZXQgY29zdCA9IGFkZCh2aXNpdGVkLmdldChjdXJyZW50KSEuZGlzdCwgZGlzdClcbiAgICAgIGlmICghdmlzaXRlZC5oYXMobmV4dCkgfHwgY29zdCA8IHZpc2l0ZWQuZ2V0KG5leHQpIS5kaXN0KXtcbiAgICAgICAgdmlzaXRlZC5zZXQobmV4dCwge2Rpc3Q6IGNvc3QsIHBhdGg6IFsuLi52aXNpdGVkLmdldChjdXJyZW50KSEucGF0aCwgbmV4dF19KVxuICAgICAgICBxdWV1ZS5wdXNoKG5leHQpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbGV0IHBhdGggPSB2aXNpdGVkLmdldChlbmQpXG4gIGlmICghcGF0aCkgdGhyb3cgbmV3IEVycm9yKGBObyBwYXRoIGZvdW5kIGZyb20gJHtzdGFydH0gdG8gJHtlbmR9YClcblxuICBDb3N0TWF0cml4LnNldChwYWlySWQoc3RhcnQsIGVuZCksIHBhdGguZGlzdClcblxuICByZXR1cm4gcGF0aFxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb3N0KHN0YXJ0OiBMb2NhdGlvbiwgZW5kOiBMb2NhdGlvbik6IFRpbWV7XG4gIGxldCBpZCA9IHBhaXJJZChzdGFydCwgZW5kKVxuICBpZiAoIUNvc3RNYXRyaXguaGFzKGlkKSkgZmluZFBhdGgoc3RhcnQsIGVuZClcbiAgcmV0dXJuIENvc3RNYXRyaXguZ2V0KGlkKSFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvc3ROKC4uLnBvaW50czogTG9jYXRpb25bXSk6IFRpbWV7XG4gIGxldCBjb3N0ID0gdWNvbnN0KDAsIFwic2Vjb25kc1wiKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGggLSAxOyBpKyspe1xuICAgIGlhZGQoY29zdCwgZ2V0Q29zdChwb2ludHNbaV0hLCBwb2ludHNbaSsxXSEpKVxuICB9XG4gIHJldHVybiBjb3N0XG59XG5cblxuZXhwb3J0IGxldCBvcHREdXIgPSAwXG5cbmV4cG9ydCBmdW5jdGlvbiBvcHRpbWl6ZVNjaGVkdWxlKHJlcXVlc3RzOiBSZXF1ZXN0W10sIHNjaGVkdWxlOiBTY2hlZHVsZSk6U2NoZWR1bGUge1xuXG4gIGxldCBmcmVlX3JlcXVlc3RzID0gWy4uLnJlcXVlc3RzLmZpbHRlcih4PT4hc2NoZWR1bGUuZmxhdE1hcCh5PT55LnN0ZXBzKS5zb21lKHo9PnouJCA9PSBcInBpY2t1cFwiICYmIHoudmFsLnJlcXVlc3QgPT0geC5pZCkpXVxuXG4gIGZ1bmN0aW9uIHBlcm11dGUgKHNjaGVkdWxlOiBTY2hlZHVsZSl7XG4gICAgbGV0IHJhdGluZyA9IHJhdGVTY2hlZHVsZShzY2hlZHVsZSlcbiAgICBmb3IgKGxldCBzY2hlZEl0ZW0gb2Ygc2NoZWR1bGUpe1xuXG4gICAgICBpZiAocmFuZG9tKCkgPCAwLjEpe1xuICAgICAgICBpZiAocmFuZG9tKCkgPCAwLjUpe1xuICAgICAgICAgIGlmIChmcmVlX3JlcXVlc3RzLmxlbmd0aCA+IDEpe1xuICAgICAgICAgICAgbGV0IHJlcSA9IGZyZWVfcmVxdWVzdHMuc2hpZnQoKSFcblxuICAgICAgICAgICAgbGV0IG9sZHN0ZXBzID0gc2NoZWRJdGVtLnN0ZXBzXG4gICAgICAgICAgICBsZXQgaXRlbXJhdGluZyA9IHJhdGVTY2hlZHVsZShbc2NoZWRJdGVtXSlcblxuICAgICAgICAgICAgc2NoZWRJdGVtLnN0ZXBzID0gWy4uLm9sZHN0ZXBzLFxuICAgICAgICAgICAgICB7JDpcInBpY2t1cFwiLCB2YWw6IHsgcmVxdWVzdDogcmVxLmlkLCBwb3M6IHJhbmRDaG9pY2Uocm9hZE1hcC5wb2ludHMpLCBkZWNrOiByYW5kb20oKSA+IC41ID8gMSA6IDB9fSxcbiAgICAgICAgICAgICAgeyQ6XCJkZWxpdmVyXCIsIHZhbDogeyByZXF1ZXN0OiByZXEuaWQsIHBvczogcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyl9fSxcbiAgICAgICAgICAgIF1cblxuICAgICAgICAgICAgbGV0IG5ld3JhdGluZyA9IHJhdGVTY2hlZHVsZShbc2NoZWRJdGVtXSlcblxuICAgICAgICAgICAgaWYgKG5ld3JhdGluZyA8IGl0ZW1yYXRpbmcpe1xuICAgICAgICAgICAgICBzY2hlZEl0ZW0uc3RlcHMgPSBvbGRzdGVwc1xuICAgICAgICAgICAgICBmcmVlX3JlcXVlc3RzLnB1c2gocmVxKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIGlmIChzY2hlZEl0ZW0uc3RlcHMubGVuZ3RoID4gMyl7XG5cbiAgICAgICAgICAgIGxldCBpdGVtcmF0aW5nID0gcmF0ZVNjaGVkdWxlKFtzY2hlZEl0ZW1dKVxuICAgICAgICAgICAgbGV0IHJlcSA9IHJhbmRDaG9pY2Uoc2NoZWRJdGVtLnN0ZXBzLmZpbHRlcih4PT54LiQgPT0gXCJwaWNrdXBcIikhKS52YWwucmVxdWVzdFxuICAgICAgICAgICAgbGV0IG9sZHN0ZXBzID0gc2NoZWRJdGVtLnN0ZXBzXG4gICAgICAgICAgICBzY2hlZEl0ZW0uc3RlcHMgPSBvbGRzdGVwcy5maWx0ZXIoeD0+KHguJCA9PSBcInN0YXJ0XCIgfHwgKHgudmFsLnJlcXVlc3QgIT0gcmVxKSkpXG4gICAgICAgICAgICBsZXQgbmV3cmF0aW5nID0gcmF0ZVNjaGVkdWxlKFtzY2hlZEl0ZW1dKVxuICAgICAgICAgICAgaWYgKG5ld3JhdGluZyA8IGl0ZW1yYXRpbmcpIHtcbiAgICAgICAgICAgICAgc2NoZWRJdGVtLnN0ZXBzID0gb2xkc3RlcHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgY29uc29sZS5sb2coXCJyZW1vdmVkIHJlcXVlc3QgXCIsIHJlcSwgXCIgZnJvbSBzY2hlZHVsZVwiKVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNjaGVkSXRlbS5zdGVwcy5sZW5ndGggPD0gMikgY29udGludWVcblxuICAgICAgbGV0IGEgPSAxICsgcmFuZGludChzY2hlZEl0ZW0uc3RlcHMubGVuZ3RoLTEpO1xuICAgICAgbGV0IGIgPSAxICsgcmFuZGludChzY2hlZEl0ZW0uc3RlcHMubGVuZ3RoLTEpO1xuICAgICAgc3dhcChzY2hlZEl0ZW0uc3RlcHMsIGEsYilcbiAgICAgIGxldCBuZXdyYXRlID0gcmF0ZVNjaGVkdWxlKHNjaGVkdWxlKVxuICAgICAgaWYgKG5ld3JhdGUgPD0gcmF0aW5nKSBzd2FwKHNjaGVkSXRlbS5zdGVwcywgYSwgYilcblxuICAgICAgaWYgKHJhbmRvbSgpID4gMC41KSB7XG4gICAgICAgIGxldCBjID0gc2NoZWRJdGVtLnN0ZXBzWzEgKyByYW5kaW50KHNjaGVkSXRlbS5zdGVwcy5sZW5ndGgtMSldO1xuICAgICAgICBpZiAoYz8uJCA9PSBcInBpY2t1cFwiKXtcbiAgICAgICAgICBjLnZhbC5kZWNrID0gYy52YWwuZGVjayA9PSAwID8gMSA6IDBcbiAgICAgICAgICBsZXQgbmV3cmF0ZSA9IHJhdGVTY2hlZHVsZShzY2hlZHVsZSlcbiAgICAgICAgICBpZiAobmV3cmF0ZSA8PSByYXRpbmcpIGMudmFsLmRlY2sgPSBjLnZhbC5kZWNrID09IDAgPyAxIDogMFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbGV0IHN0ID0gRGF0ZS5ub3coKVxuXG4gIGZvciAobGV0IGkgPSAwOyBpPCAyMDAwOyBpKyspe1xuXG4gICAgaWYgKGkgPT0gMCB8fCAoaSsxKSAlIDEwMDAgPT0gMCl7XG4gICAgICBjb25zb2xlLmxvZyhcIm9wdCBzdGVwOiBcIiwgaSsxKVxuICAgIH1cbiAgICBwZXJtdXRlKHNjaGVkdWxlKVxuICB9XG5cbiAgb3B0RHVyID0gRGF0ZS5ub3coKSAtIHN0IFxuICByZXR1cm4gc2NoZWR1bGVcbn1cblxuXG5mdW5jdGlvbiByYW5kaW50IChuOm51bWJlcil7IHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpKm4pfVxuXG5mdW5jdGlvbiBzd2FwPFQ+IChzOlRbXSwgYTogbnVtYmVyLCBiOm51bWJlcil7XG4gIGxldCB0PSBzW2FdITtcbiAgc1thXSA9IHNbYl0hO1xuICBzW2JdID0gdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmF0ZVNjaGVkdWxlKHNjaGVkdWxlOiBTY2hlZHVsZSkgOiBudW1iZXIge1xuICBsZXQgcmVzID0gdWNvbnN0KDAsIFwiZXVyXCIpXG4gIGxldCBkdXJhdGlvbiA9IHVjb25zdCgwLCAgXCJzZWNvbmRzXCIpXG5cbiAgbGV0IGRlY2tzOiBbVVVJRFtdLCBVVUlEW11dXG4gIGZvciAobGV0IGl0ZW0gb2Ygc2NoZWR1bGUpe1xuXG4gICAgZGVja3MgPSAgW1tdLCBbXV1cblxuICAgIGZ1bmN0aW9uIHVubG9hZChyZXFpZDogVVVJRCwgZGVjazogMCB8IDEgKXtcbiAgICAgIGxldCBpZHggPSBkZWNrc1tkZWNrXS5pbmRleE9mKHJlcWlkKVxuICAgICAgaWYgKGlkeCA9PSAtMSkgcmV0dXJuIGZhbHNlXG4gICAgICBsZXQgYWZ0ZXIgPSBkZWNrc1tkZWNrXS5zbGljZShpZHgrMSlcbiAgICAgIGRlY2tzW2RlY2tdID0gZGVja3NbZGVja10uc2xpY2UoMCwgaWR4KS5jb25jYXQoYWZ0ZXIpXG4gICAgICBpc3ViKHJlcywgVU5MT0FEQ09TVClcbiAgICAgIGlzdWIocmVzLCBtdWwoYWRkKFVOTE9BRENPU1QsIFBJQ0tVUENPU1QpLCBhZnRlci5sZW5ndGgpKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICBpZiAoaXRlbS5zdGVwc1swXT8uJCAhPSBcInN0YXJ0XCIpIHJldHVybiAtIEluZmluaXR5XG4gICAgZm9yIChsZXQgc3RlcCBvZiBpdGVtLnN0ZXBzLnNsaWNlKDEpKXtcbiAgICAgIGlmIChzdGVwLiQgPT0gXCJwaWNrdXBcIikge1xuICAgICAgICBkZWNrc1tzdGVwLnZhbC5kZWNrXS5wdXNoKHN0ZXAudmFsLnJlcXVlc3QpXG4gICAgICAgIGlmIChkZWNrc1tzdGVwLnZhbC5kZWNrXS5sZW5ndGggPiBERUNLQ0FQQUNJVFkpIHJldHVybiAtIEluZmluaXR5XG4gICAgICB9IGVsc2UgaWYgKHN0ZXAuJCA9PSBcImRlbGl2ZXJcIikge1xuXG4gICAgICAgIGxldCByZXFpZCA9IHN0ZXAudmFsLnJlcXVlc3RcbiAgICAgICAgbGV0IHJlcSA9IHJlcXVlc3RzLmZpbmQoeD0+cmVxaWQgPT0geC5pZClcblxuICAgICAgICBpZiAoIXJlcSkgdGhyb3cgbmV3IEVycm9yKFwibm90IGZvdW5kIHJlcXVlc3Q6IFwiK3N0ZXAudmFsLnJlcXVlc3QpXG4gICAgICAgIGlmICghdW5sb2FkKHJlcWlkLCAwKSAmJiAhdW5sb2FkKHJlcWlkLCAxKSkgcmV0dXJuIC0gSW5maW5pdHlcblxuICAgICAgICBpZiAoZHVyYXRpb24udmFsdWUgPCByZXEuZGVhZGxpbmUudmFsdWUpIGlhZGQocmVzLCByZXEudmFsdWUpXG5cbiAgICAgIH1cbiAgICAgIGVsc2UgcmV0dXJuIC0gSW5maW5pdHlcbiAgICB9O1xuICAgIFxuICAgIGlhZGQoZHVyYXRpb24sIGdldENvc3ROKC4uLml0ZW0uc3RlcHMubWFwKHg9PngudmFsLnBvcykpKVxuICB9XG5cbiAgcmV0dXJuIHJlcy52YWx1ZSAtIGR1cmF0aW9uLnZhbHVlICogQ09TVF9QRVJfU0VDT05EICAgXG59XG4iLAogICAgIlxuaW1wb3J0IHR5cGUgeyBMb2NhdGlvbiwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZmluZFBhdGgsIHBhaXJJZCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgZGl2LCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzLCByZXF1ZXN0cywgdHlwZSBIaWdoTGlnaHQgfSBmcm9tIFwiLi9tYWluXCI7XG5cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiwgeDogbnVtYmVyLCB5OiBudW1iZXIpIDoge2VsOiBTVkdDaXJjbGVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJsaW5lXCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIpIDoge2VsOiBTVkdMaW5lRWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwidGV4dFwiLCB4OiBudW1iZXIsIHk6IG51bWJlciwgczogc3RyaW5nKSA6IHtlbDogU1ZHVGV4dEVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwiY2lyY2xlXCIgfCBcImxpbmVcIiB8IFwidGV4dFwiLCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4Mj86IG51bWJlciB8IHN0cmluZywgeTI/OiBudW1iZXIpe1xuICBsZXQgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCB0YWcpXG4gIGlmICh0YWcgPT0gXCJjaXJjbGVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiY3hcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAxXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4ge1xuICAgICAgZWwsXG4gICAgICBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcImxpbmVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDFcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5MVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcIngyXCIsIHgyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkyXCIsIHkyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZVwiLCBcImdyYXlcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAwNVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0YWcgPT0gXCJ0ZXh0XCIpe1xuICAgIGVsLnNldEF0dHJpYnV0ZShcInhcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcblxuICAgIFxuICAgIGVsLnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgZWwudGV4dENvbnRlbnQgPSBTdHJpbmcoeDIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiMC4wM1wiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgXCJncmF5XCIpXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3IChyb2FkbWFwOiBSb2FkTWFwICkgOiBIVE1MRWxlbWVudCB7XG5cblxuICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpXG5cbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCIwIDAgMSAxXCIpXG5cbiAgbGV0IGVsZW1lbnRzID0gbmV3IE1hcDxhbnksIFNWR0VsZW1lbnQ+KClcbiAgbGV0IHNvdXJjZXMgPSBuZXcgTWFwPFNWR0VsZW1lbnQsIGFueT4oKVxuICBcbiAgZm9yIChsZXQgW2lkMSwgcm9hZHNdIG9mIHJvYWRtYXAucm9hZHMpe1xuICAgIGZvciAobGV0IFtpZDIsIGRpc3RdIG9mIHJvYWRzKXtcbiAgICAgIGxldCBhID0gcm9hZG1hcC5nZW9sb2NhdGlvbiggaWQxKSFcbiAgICAgIGxldCBiID0gcm9hZG1hcC5nZW9sb2NhdGlvbiggaWQyKSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueCwgYS55LCBiLngsIGIueSkuZWxcbiAgICAgIGxldCBpZCA9IHBhaXJJZChpZDEsIGlkMilcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgcG9pbnQgb2Ygcm9hZG1hcC5yb2Fkcy5rZXlzKCkpe1xuICAgIGxldCBsb2MgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHBvaW50KVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueCwgbG9jLnkpLmVsXG4gICAgZWxlbWVudHMuc2V0KHBvaW50LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCBwb2ludClcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNpcmNsZSlcbiAgfVxuXG4gIGxldCBoaW50czoge3JlbW92ZTooKT0+dm9pZH1bXSA9IFtdXG5cbiAgaGlnaHRMaWdodHMub251cGRhdGUoKG5ILG8pPT57XG4gICAgaGludHMuZm9yRWFjaChlbD0+ZWwucmVtb3ZlKCkpXG4gICAgZm9yIChsZXQgbiBvZiBuSCl7XG4gICAgICBsZXQgbGFzdCA6IExvY2F0aW9uIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubG9jYXRpb25cbiAgICAgICAgaWYgKGxhc3Qpe1xuICAgICAgICAgIGxldCBwYXRoID0gZmluZFBhdGgobGFzdCwgbmV4dCkucGF0aFxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGggLSAxOyBpKyspe1xuICAgICAgICAgICAgbGV0IEEgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHBhdGhbaV0hKSFcbiAgICAgICAgICAgIGxldCBCID0gcm9hZG1hcC5nZW9sb2NhdGlvbihwYXRoW2krMV0hKSFcbiAgICAgICAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueCwgQS55LCBCLngsIEIueSlcbiAgICAgICAgICAgIGxpbmUuc2V0Q29sb3Iobi5jb2xvciA/PyBcIiNmZmM5ODhcIilcbiAgICAgICAgICAgIGxpbmUuZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMVwiKVxuICAgICAgICAgICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwXCIpXG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxpbmUuZWwpXG4gICAgICAgICAgICBoaW50cy5wdXNoKHtyZW1vdmU6ICgpPT5saW5lLmVsLnJlbW92ZSgpfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGFzdCA9IG5leHRcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGlmIChwLmxvZ28pIHtcbiAgICAgICAgICBsZXQgcG9zID0gcm9hZG1hcC5nZW9sb2NhdGlvbihwLmxvY2F0aW9uKVxuICAgICAgICAgIGxldCBlbCA9IG1rU3ZnKFwidGV4dFwiLCBwb3MueCwgcG9zLnksIHAubG9nbylcbiAgICAgICAgICBlbC5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwMFwiKVxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZWwuZWwpXG4gICAgICAgICAgaGludHMucHVzaChlbC5lbClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBsZXQgZHYgPSBkaXYoc3R5bGUoe3dpZHRoOlwiMTAwJVwiLCBkaXNwbGF5OlwiZmxleFwiLCBqdXN0aWZ5Q29udGVudDpcImNlbnRlclwiLCBwYWRkaW5nOiBcIjFlbVwifSkpXG4gIGR2LmFwcGVuZChlbGVtZW50KVxuICByZXR1cm4gZHZcbn1cblxuXG4iLAogICAgIlxuaW1wb3J0IHsgTG9jYXRpb24sIHJhbmRvbVVVSUQsIFRpbWUsIHVjb25zdCwgVVVJRCB9IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21NYXAgKCl7XG5cbiAgbGV0IHBvaW50cyA6TG9jYXRpb25bXSA9IFtdXG5cbiAgbGV0IHJvYWRzID0gbmV3IE1hcDxMb2NhdGlvbiwgTWFwPExvY2F0aW9uLCBUaW1lPj4gKClcbiAgbGV0IGdlb2xvY2F0aW9uID0gbmV3IE1hcDxMb2NhdGlvbiwge3g6IG51bWJlciwgeTogbnVtYmVyfT4oKVxuICBsZXQgZ2VvY29kZXMgPSBuZXcgTWFwPExvY2F0aW9uLCBzdHJpbmc+KClcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDsgaSsrKXtcblxuICAgIGxldCBwb2ludDogTG9jYXRpb24gPSBgbG9jJHtyYW5kb21VVUlEKCl9YFxuICAgIHBvaW50cy5wdXNoKHBvaW50KVxuICAgIGdlb2xvY2F0aW9uLnNldChwb2ludCAsIHt4OiByYW5kb20oKSwgeTogcmFuZG9tKCl9KVxuICAgIGdlb2NvZGVzLnNldChwb2ludCwgYERFICR7Z2VvbG9jYXRpb24uc2l6ZS50b1N0cmluZygpLnBhZFN0YXJ0KDQsIFwiMFwiKX1gKVxuICAgIHJvYWRzLnNldChwb2ludCwgbmV3IE1hcCgpKVxuICB9XG5cbiAgZm9yIChsZXQgW0lELCBwXSBvZiBnZW9sb2NhdGlvbi5lbnRyaWVzKCkpe1xuICAgIGdlb2xvY2F0aW9uLmVudHJpZXMoKS50b0FycmF5KCkuc29ydCgoW2EsQV0sW2IsQl0pPT4gTWF0aC5oeXBvdChBLnggLSBwLngsIEEueSAtIHAueSkgLSBNYXRoLmh5cG90KEIueCAtIHAueCwgQi55IC0gcC55KSlcbiAgICAuc2xpY2UoMSw0KS5mb3JFYWNoKChbaWQsIGxvY10pPT57XG4gICAgICBsZXQgZGlzdCA9IHVjb25zdChNYXRoLmh5cG90KGxvYy54IC0gcC54LCBsb2MueSAtIHAueSkgKiAxMCAqIDYwICogNjAsIFwic2Vjb25kc1wiKVxuICAgICAgcm9hZHMuZ2V0KElEKSEuc2V0KGlkLCBkaXN0KVxuICAgICAgcm9hZHMuZ2V0KGlkKSEuc2V0KElELCBkaXN0KVxuICAgIH0pXG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJvYWRzLFxuICAgIHBvaW50cyxcbiAgICBnZW9sb2NhdGlvbihsb2M6IExvY2F0aW9uKXtcbiAgICAgIGxldCBnZW8gPSBnZW9sb2NhdGlvbi5nZXQobG9jKVxuICAgICAgaWYgKCFnZW8pIHRocm93IG5ldyBFcnJvcihgTG9jYXRpb24gJHtsb2N9IG5vdCBmb3VuZGApXG4gICAgICByZXR1cm4gZ2VvXG4gICAgfSxcbiAgICBnZW9Db2RlKGxvYzogTG9jYXRpb24pe1xuICAgICAgICBsZXQgY29kZSA9IGdlb2NvZGVzLmdldChsb2MpXG4gICAgICAgIGlmICghY29kZSkgdGhyb3cgbmV3IEVycm9yKGBMb2NhdGlvbiAke2xvY30gbm90IGZvdW5kYClcbiAgICAgICAgcmV0dXJuIGNvZGVcbiAgICAgIH1cbiAgICB9XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoKSA9PiBpbmZlciBUID8gVCA6IG5ldmVyXG4iLAogICAgImltcG9ydCB7IExvY2F0aW9uLCBQcmljZSwgUmVxdWVzdCwgVGltZSwgVVVJRCwgdHlwZSBTY2hlZHVsZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZmluZFBhdGggfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHR5cGUgeyBSb2FkTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHR5cGUgeyBJbmZlciB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmltcG9ydCB7IGJvcmRlciwgY29sb3IsIGgzLCBodG1sLCBwYWRkaW5nLCBzcGFuLCBzdHlsZSwgdGFibGUsIHRkLCB0ciwgdHlwZSBIVE1MR2VuZXJhdG9yIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMsIHJlcXVlc3RzLCByb2FkTWFwLCBzY2hlZHVsZSB9IGZyb20gXCIuL21haW5cIjtcblxuXG5leHBvcnQgZnVuY3Rpb24gbG9jU3RyaW5nIChsb2M6IEluZmVyPHR5cGVvZiBMb2NhdGlvbj4pIHtcbiAgcmV0dXJuIGDwn5ONICR7cm9hZE1hcC5nZW9Db2RlKGxvYykgPz8gXCJVTktcIn1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc3BvcnRlclN0cmluZyAodHJhbjogVVVJRCkge1xuICByZXR1cm4gYPCfmpsgJHtzY2hlZHVsZS5nZXQoKS5maW5kSW5kZXgocz0+cy50cmFuc3BvcnRlciA9PSB0cmFuKS50b1N0cmluZygpLnBhZFN0YXJ0KDQsICcwJyl9YFxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGltZVN0cmluZyAodGltZTogVGltZSl7XG4gIC8vIHJldHVybiBgJHsoKHRpbWUudmFsdWUvNjAvNjApLnRvRml4ZWQoMikpfSBoYFxuICByZXR1cm4gYCR7TWF0aC5mbG9vcih0aW1lLnZhbHVlLzYwLzYwKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9OiR7TWF0aC5mbG9vcigodGltZS52YWx1ZS82MCklNjApLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1oYFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJpY2VTdHJpbmcgKHByaWNlOiBQcmljZSl7XG4gIHJldHVybiBgJHtwcmljZS52YWx1ZS50b0ZpeGVkKDApfSDigqxgXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0U3RyaW5nIChpZDogVVVJRCkge1xuICBsZXQgcmVxID0gcmVxdWVzdHMuZmluZChyPT5yLmlkID09IGlkKVxuICBpZiAoIXJlcSkgcmV0dXJuIFwiVU5LXCJcbiAgcmV0dXJuIGDwn5OmICR7cmVxdWVzdHMuZmluZEluZGV4KHg9PnguaWQgPT0gaWQpLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKX1gXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gcmVxdWVzdFZpZXcgKHJlcXVlc3RzOiBSZXF1ZXN0W10sIHNjaGVkdWxlOiBTY2hlZHVsZSk6IEhUTUxFbGVtZW50e1xuXG4gIGxldCBjZWxsID0gKCguLi54KSA9PiB0ZChzdHlsZSh7XG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1ncmF5KVwiLFxuICAgIHBhZGRpbmc6IFwiLjNlbSAuNWVtXCIsXG4gICAgY3Vyc29yOlwicG9pbnRlclwiLFxuICAgIHdoaXRlU3BhY2U6IFwibm93cmFwXCIsXG4gIH0pLCAuLi54KSkgYXMgSFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gXG5cbiAgcmV0dXJuIHRhYmxlKFxuICAgIHN0eWxlKHsgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIiwgfSksXG5cbiAgICB0cihbXCJyZXF1ZXN0XCIsIFwic3RhcnRcIiwgXCJlbmRcIiwgXCJkaXN0YW56XCIsIFwicHJlaXNcIiwgXCJmcmlzdFwiIF0ubWFwKGg9PiBjZWxsKGgpLCApLCBzdHlsZSh7Zm9udFdlaWdodDogXCJib2xkXCJ9KSksXG4gICAgcmVxdWVzdHMubWFwKChyLCBpKT0+e1xuXG4gICAgICBsZXQgcGF0aCA9IGZpbmRQYXRoKHIuc3RhcnRQb2ludCwgci5lbmRQb2ludClcblxuICAgICAgbGV0IHJvdz0gdHIoXG4gICAgICAgIGNlbGwocmVxdWVzdFN0cmluZyhyLmlkKSksXG4gICAgICAgIGNlbGwobG9jU3RyaW5nKHIuc3RhcnRQb2ludCkpLFxuICAgICAgICBjZWxsKGxvY1N0cmluZyhyLmVuZFBvaW50KSksXG4gICAgICAgIGNlbGwoc3BhbiggdGltZVN0cmluZyhwYXRoLmRpc3QpLCBzdHlsZSh7ZmxvYXQ6IFwicmlnaHRcIn0pKSksXG4gICAgICAgIGNlbGwoc3BhbihwcmljZVN0cmluZyhyLnZhbHVlKSwgc3R5bGUoe2Zsb2F0OiBcInJpZ2h0XCJ9KSkpLFxuICAgICAgICBjZWxsKHNwYW4odGltZVN0cmluZyhyLmRlYWRsaW5lKSwgc3R5bGUoe2Zsb2F0OiBcInJpZ2h0XCJ9KSkpLFxuICAgICAgKVxuICAgICAgcm93Lm9ubW91c2VlbnRlciA9ICgpPT57XG4gICAgICAgIHJvdy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5ncmF5LFxuICAgICAgICBoaWdodExpZ2h0cy5zZXQoW3sgcG9pbnRzOiBbXG4gICAgICAgICAgeyBsb2NhdGlvbjogci5zdGFydFBvaW50LCBsb2dvOiBcIvCfk6ZcIiB9LFxuICAgICAgICAgIHsgbG9jYXRpb246IHIuZW5kUG9pbnQsIGxvZ286IFwi8J+PoFwiIH1cbiAgICAgICAgXX1dKVxuXG4gICAgICB9XG4gICAgICByb3cub25tb3VzZWxlYXZlID0gKCk9PntcbiAgICAgICAgcm93LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiXCJcbiAgICAgIH1cbiAgICAgIHJldHVybiByb3dcbiAgICB9KVxuXG4gIClcblxufSIsCiAgICAiaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuL3NjaGVtYVwiXG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1rV3JpdGFibGU8VCBleHRlbmRzIEpzb25EYXRhPiAodmFsdWU6IFQpIHtcblxuXG4gIGxldCBsaXN0ZW5lcnM6ICgobmV3VmFsdWU6IFQsIG9sZFZhbHVlOiBUKT0+dm9pZClbXSA9IFtdXG4gIGxldCByZXAgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcblxuICBsZXQgcmVzID0ge1xuICAgIGdldDogKCkgPT4gdmFsdWUsXG4gICAgc2V0OiAobmV3VmFsdWU6IFQpID0+IHtcbiAgICAgIGxldCBuZXdSZXAgPSBKU09OLnN0cmluZ2lmeShuZXdWYWx1ZSlcbiAgICAgIGlmIChuZXdSZXAgPT09IHJlcCkgcmV0dXJuXG4gICAgICByZXAgPSBuZXdSZXBcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIobmV3VmFsdWUsIHZhbHVlKSlcbiAgICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICB9LFxuICAgIG9udXBkYXRlOiAobGlzdGVuZXI6IChuZXdWYWx1ZTogVCwgb2xkVmFsdWUgOlQpPT52b2lkKSA9PiB7XG4gICAgICBsaXN0ZW5lcih2YWx1ZSwgdmFsdWUpXG4gICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcilcbiAgICB9LFxuICAgIHVwZGF0ZTogKGNhbGxiYWNrOiAob2xkVmFsdWU6IFQpPT5UIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgICBsZXQgbmV3VmFsdWUgPSBjYWxsYmFjayh2YWx1ZSkgPz8gdmFsdWVcbiAgICAgIHJlcy5zZXQobmV3VmFsdWUpXG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gcmVzXG5cbn1cblxuXG4iLAogICAgImltcG9ydCB7IHVjb25zdCwgaWFkZCwgdHlwZSBTY2hlZHVsZUl0ZW0sIHR5cGUgVVVJRCwgU2NoZWR1bGVTdGVwLCBUaW1lLCBhZGQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGdldENvc3QsIG9wdER1ciwgb3B0aW1pemVTY2hlZHVsZSwgcmF0ZVNjaGVkdWxlIH0gZnJvbSBcIi4uL3BsYW5uZXJcIjtcbmltcG9ydCB7IG1rV3JpdGFibGUgfSBmcm9tIFwiLi4vd3JpdGVhYmxlXCI7XG5pbXBvcnQgeyBiYWNrZ3JvdW5kLCBib2R5LCBib3JkZXJSYWRpdXMsIGJ1dHRvbiwgY29sb3IsIGRpdiwgaDIsIGh0bWwsIHAsIHBhZGRpbmcsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRyLCB3aWR0aCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzLCByZXF1ZXN0cywgcm9hZE1hcCwgc2NoZWR1bGUgfSBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBsb2NTdHJpbmcsIHByaWNlU3RyaW5nLCByZXF1ZXN0U3RyaW5nLCB0aW1lU3RyaW5nLCB0cmFuc3BvcnRlclN0cmluZyB9IGZyb20gXCIuL3JlcXVlc3RWaWV3XCI7XG5cblxuZnVuY3Rpb24gc3RlcExvZ28gKHN0ZXA6IFNjaGVkdWxlU3RlcCl7XG4gIGlmIChzdGVwLiQgPT0gXCJzdGFydFwiKSByZXR1cm4gJ/CfmpsnXG4gIGlmIChzdGVwLiQgPT0gXCJwaWNrdXBcIikgcmV0dXJuICfwn5OmJ1xuICBpZiAoc3RlcC4kID09IFwiZGVsaXZlclwiKSByZXR1cm4gJ/Cfj6AnXG4gIHRocm93IG5ldyBFcnJvcihcInVuZXhwZWN0ZWQgdGFnOlwiLCBzdGVwKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVxdWVzdChpZDogVVVJRCl7XG4gIGxldCByZXEgPSByZXF1ZXN0cy5maW5kKHI9PnIuaWQgPT0gaWQpXG4gIGlmICghcmVxKSB0aHJvdyBuZXcgRXJyb3IoYG5vdCBmb3VuZCByZXF1ZXN0ICR7aWR9YClcbiAgcmV0dXJuIHJlcVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RlcFJlcXVlc3Qoc3RlcDogU2NoZWR1bGVTdGVwKXtcbiAgaWYgKHN0ZXAuJCA9PSBcInN0YXJ0XCIpIHJldHVybiB1bmRlZmluZWRcbiAgcmV0dXJuIGdldFJlcXVlc3Qoc3RlcC52YWwucmVxdWVzdClcbn1cblxuZnVuY3Rpb24gc3RlcFN0cmluZyAoc3RlcDogU2NoZWR1bGVTdGVwKXtcblxuICBpZiAoc3RlcC4kID09IFwic3RhcnRcIikgcmV0dXJuIGBzdGFydGBcbiAgbGV0IHJlcSA9IGdldFJlcXVlc3Qoc3RlcC52YWwucmVxdWVzdClcbiAgcmV0dXJuIGAke3N0ZXAuJH0gJHtyZXF1ZXN0U3RyaW5nKHN0ZXAudmFsLnJlcXVlc3QpfTogJHtwcmljZVN0cmluZyhyZXEudmFsdWUpfSBkZWFkbGluZSAke3RpbWVTdHJpbmcocmVxLmRlYWRsaW5lKX1gXG59XG5cbmxldCBjdXJzb3IgPSBta1dyaXRhYmxlKHtyb3c6IDEsIGNvbDogMX0pXG5cbmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZT0+e1xuICBjdXJzb3IudXBkYXRlKChjdXJzb3IpID0+e1xuICAgIGlmIChjdXJzb3IuY29sID09IC0xKSByZXR1cm5cbiAgICBpZiAoZS5rZXkgPT0gXCJBcnJvd0xlZnRcIikgICAgICAgICBjdXJzb3IuY29sIC09IDFcbiAgICBlbHNlIGlmIChlLmtleSA9PSBcIkFycm93UmlnaHRcIikgICBjdXJzb3IuY29sICs9IDFcbiAgICBlbHNlIGlmIChlLmtleSA9PSBcIkFycm93VXBcIikgICAgICBjdXJzb3Iucm93IC09IDFcbiAgICBlbHNlIGlmIChlLmtleSA9PSBcIkFycm93RG93blwiKSAgICBjdXJzb3Iucm93ICs9IDFcbiAgICBlbHNlIGlmIChlLmtleSA9PSBcIkVzY2FwZVwiKSAgICAgICBjdXJzb3IgPSB7cm93OiAtMSwgY29sOiAtMX1cbiAgICBlbHNlIHJldHVyblxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGN1cnNvci5yb3cgPSBNYXRoLm1heCgwLCBNYXRoLm1pbiggc2NoZWR1bGUuZ2V0KCkubGVuZ3RoLTEsIGN1cnNvci5yb3cpKVxuICAgIGN1cnNvci5jb2wgPSBNYXRoLm1heCgwLCBNYXRoLm1pbiggc2NoZWR1bGUuZ2V0KClbY3Vyc29yLnJvd10hLnN0ZXBzLmxlbmd0aC0xLCBjdXJzb3IuY29sKSlcbiAgfSlcblxufSlcblxuXG5cbmV4cG9ydCBjb25zdCBzY2hlZHVsZVZpZXcgPSAoKSA9PiB7XG5cbiAgbGV0IGNlbGwgPSAoKC4uLngpID0+IHRkKHN0eWxlKHtcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgbWFyZ2luOiBcIjBcIixcbiAgICBwYWRkaW5nOiBcIi4zZW0gLjVlbVwiLFxuICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgd2hpdGVTcGFjZTogXCJub3dyYXBcIixcbiAgfSksIC4uLngpKSBhcyB0eXBlb2YgdGQ7XG5cbiAgY29uc3QgdGFidmlldyA9IGRpdigpXG4gIGNvbnN0IHJlamVjdFZpZXcgPSBkaXYoKVxuICBjb25zdCBzdGVwdmlldyA9IGRpdigpXG4gIGxldCBzdGVwRWxzID0gW10gYXMgSFRNTFNwYW5FbGVtZW50W11bXVxuICBsZXQgcm93RWxzID0gW10gYXMgSFRNTFRhYmxlUm93RWxlbWVudFtdXG5cbiAgbGV0IHRpbWVzIDogVGltZVtdW10gPSBbXVxuXG4gIFxuICBzY2hlZHVsZS5vbnVwZGF0ZShzY2hlZCA9PiB7XG5cbiAgICB0aW1lcyA9IHNjaGVkLm1hcChzPT5bdWNvbnN0KDAsIFwic2Vjb25kc1wiKV0pXG5cblxuICAgIGN1cnNvci5vbnVwZGF0ZShjdXJzb3I9PntcblxuICAgICAgbGV0IHtyb3csIGNvbDogbn0gPSBjdXJzb3JcblxuICAgICAgbGV0IHN0ZXBzID0gc2NoZWRbcm93XSEuc3RlcHNcbiAgICAgIGxldCBzdGVwID0gc3RlcHNbbl1cbiAgICAgIGlmICghc3RlcCkgcmV0dXJuXG5cbiAgICAgIGxldCByZXF1ZXN0ID0gc3RlcC4kID09IFwic3RhcnRcIiA/IHVuZGVmaW5lZCA6IHN0ZXAudmFsLnJlcXVlc3RcblxuICAgICAgc3RlcEVscy5mb3JFYWNoKChyb3dFbHMsIHJvd24pPT57XG4gICAgICAgIHJvd0Vscy5mb3JFYWNoKChlbCxpKT0+e1xuICAgICAgICAgIGxldCBzdGVwID0gc2NoZWRbcm93bl0hLnN0ZXBzW2ldXG4gICAgICAgICAgaWYgKCFzdGVwKSByZXR1cm5cbiAgICAgICAgICBsZXQgYm9yZGVyID0gY29sb3IuYmFja2dyb3VuZFxuICAgICAgICAgIGlmIChpID09IG4gJiYgcm93ID09IHJvd24pIHtcbiAgICAgICAgICAgIGJvcmRlciA9IGNvbG9yLmJsdWUgXG4gICAgICAgICAgICB2aWV3U3RlcChyb3csIG4sIHN0ZXB2aWV3LCB0aW1lc1tyb3ddIVtuXSEsIHRpbWVzW3Jvd10hW3RpbWVzW3Jvd10hLmxlbmd0aC0xXSEpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKHN0ZXAuJCAhPSBcInN0YXJ0XCIgJiYgc3RlcC52YWwucmVxdWVzdCA9PSByZXF1ZXN0KSBib3JkZXIgPSBjb2xvci5ncmF5XG4gICAgICAgICAgZWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBib3JkZXJcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIGxldCBsb2dvID0gc3RlcExvZ28oc3RlcClcblxuICAgICAgaGlnaHRMaWdodHMuc2V0KFtcbiAgICAgICAgeyBwb2ludHM6IHN0ZXBzLnNsaWNlKG4sbisyKS5tYXAoKHAsaSk9Pih7bG9jYXRpb246IHAudmFsLnBvc30pKSwgY29sb3I6IFwiI2ZmYzk4OFwiIH0sXG4gICAgICAgIHsgcG9pbnRzOiBbe2xvY2F0aW9uOnN0ZXAudmFsLnBvcywgbG9nb31dIH1cbiAgICAgIF0pXG4gICAgfSlcblxuXG5cblxuICAgIHRhYnZpZXcucmVwbGFjZUNoaWxkcmVuKHRhYmxlKFxuICAgICAgW1widHJhbnNwb3J0ZXJcIiwgXCJzdGVwc1wiXS5tYXAoaD0+IGNlbGwoaCksICksIHN0eWxlKHtmb250V2VpZ2h0OiBcImJvbGRcIn0pLFxuICAgICAgc2NoZWQubWFwKChzLCByb3duKT0+e1xuXG4gICAgICAgIGxldCBhbGxQb2ludHMgPSBzLnN0ZXBzLm1hcChzdGVwPT4gKHsgbG9jYXRpb246IHN0ZXAudmFsLnBvcywgbG9nbzogc3RlcExvZ28oc3RlcCkgfSkpXG4gICAgICAgIGxldCB0cmFuc3BvcnQgPSBzcGFuKHRyYW5zcG9ydGVyU3RyaW5nKHMudHJhbnNwb3J0ZXIpKVxuICAgICAgICB0cmFuc3BvcnQub25tb3VzZWVudGVyID0gKCk9PmhpZ2h0TGlnaHRzLnNldChbe3BvaW50czogYWxsUG9pbnRzLCBjb2xvcjogXCIjZmZjOTg4XCIsfV0pXG5cbiAgICAgICAgc3RlcEVscy5wdXNoKCBzLnN0ZXBzLm1hcCgoc3RlcCxpKT0+e1xuICAgICAgICAgIGlmIChpPjApe1xuICAgICAgICAgICAgbGV0IHByZXYgPSBzLnN0ZXBzW2ktMV0hXG4gICAgICAgICAgICBsZXQgZGlzdCA9IGdldENvc3QocHJldi52YWwucG9zLCBzdGVwLnZhbC5wb3MpXG4gICAgICAgICAgICB0aW1lc1tyb3duXSEucHVzaChhZGQodGltZXNbcm93bl0hW2ktMV0hLCBkaXN0KSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdGltZSA9IHRpbWVzW3Jvd25dIVtpXSFcblxuICAgICAgICAgIGxldCByZXEgPSBzdGVwUmVxdWVzdChzdGVwKVxuXG4gICAgICAgICAgbGV0IGxvZ28gPSBzdGVwTG9nbyhzdGVwKVxuICAgICAgICAgIGxldCByZXMgPSBzcGFuKGxvZ28sIHN0eWxlKHtwYWRkaW5nOiBcIi4xZW0gLjFlbVwiLFxuICAgICAgICAgICAgYmFja2dyb3VuZDpyZXEgJiYgcmVxLmRlYWRsaW5lLnZhbHVlIDwgdGltZS52YWx1ZSA/IGNvbG9yLnJlZCA6IFwiXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMC4yZW0gc29saWQgXCIgKyBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjAuM2VtXCIsXG4gICAgICAgICAgICBcbiAgICAgICAgICB9KSlcblxuICAgICAgICAgIHJlcy5vbmNsaWNrID0gKCk9PntcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ0xJQ0tcIiwgcm93biwgaSlcbiAgICAgICAgICAgIGN1cnNvci5zZXQoe3Jvdzogcm93biwgY29sOiBpfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgICB9KSlcblxuICAgICAgICBsZXQgcm93PSB0cihjZWxsKHRyYW5zcG9ydCksIGNlbGwoc3RlcEVsc1tyb3duXSEpKVxuICAgICAgICByb3dFbHMucHVzaChyb3cpXG4gICAgICAgIHJldHVybiByb3dcbiAgICAgIH0pLFxuICAgICAgc3R5bGUoeyBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLCB9KSxcbiAgICApKTtcbiAgICBsZXQgcmVqZWN0cyA9IHJlcXVlc3RzLmZpbHRlcihyPT4hc2NoZWQuZmxhdE1hcChzPT5zLnN0ZXBzKS5zb21lKHN0ZXA9PnN0ZXAuJCAhPSBcInN0YXJ0XCIgJiYgc3RlcC52YWwucmVxdWVzdCA9PSByLmlkKSlcblxuICAgIHJlamVjdFZpZXcucmVwbGFjZUNoaWxkcmVuKFxuXG4gICAgICByZWplY3RzLmxlbmd0aCA9PSAwID8gc3BhbigpIDogZGl2KFxuICAgICAgICBkaXYoXG4gICAgICAgICAgcChcIm9wZW4gcmVxdWVzdHNcIiwgc3R5bGUoe2ZvbnRXZWlnaHQ6IFwiYm9sZFwiLCBwYWRkaW5nOiBcIi4zZW1cIiwgbWFyZ2luOiBcIi4zZW1cIn0pKSxcbiAgICAgICAgICByZWplY3RzLm1hcChyPT5zcGFuKHJlcXVlc3RTdHJpbmcoci5pZCksIHN0eWxlKHtwYWRkaW5nOiBcIi4zZW1cIiwgbWFyZ2luOiBcIi4zZW1cIiwgd2hpdGVTcGFjZTogXCJub3dyYXBcIn0pKSksXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgZGlzcGxheTogXCJyb3dcIixcbiAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICAgICAgICBwYWRkaW5nOiBcIi41ZW1cIixcbiAgICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIClcbiAgfSlcblxuICBsZXQgdmFsdWUgPSBzcGFuKClcbiAgc2NoZWR1bGUub251cGRhdGUoc2NoPT52YWx1ZS50ZXh0Q29udGVudCA9IHJhdGVTY2hlZHVsZShzY2gpLnRvRml4ZWQoMikpXG5cblxuICBsZXQgc2NoZWR1bGVFbCA9IGRpdihcbiAgICBzdHlsZSh7XG4gICAgICB3aWR0aDogXCJjYWxjKDEwMCUgLSAyZW0pXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgb3ZlcmZsb3c6IFwiYXV0b1wiLFxuICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgcGFkZGluZzogXCIuNWVtXCIsXG4gICAgfSksXG4gICAgdGFidmlldyxcbiAgICByZWplY3RWaWV3LFxuICAgIHAoXCJWYWx1ZTogXCIsIHZhbHVlKSxcbiAgICBwKFwic2VhcmNoIHRpbWU6XCIsIG9wdER1ciksXG4gICAgc3RlcHZpZXcsXG4gIClcbiAgcmV0dXJuIHNjaGVkdWxlRWxcbn1cblxuXG5cbmZ1bmN0aW9uIHZpZXdTdGVwKHJvdzogbnVtYmVyLCBuOiBudW1iZXIsIHBhcmVudDogSFRNTEVsZW1lbnQsIGRpc3Q6IFRpbWUsIHRvdGFsOiBUaW1lKXtcbiAgbGV0IHN0ZXBzID0gc2NoZWR1bGUuZ2V0KClbcm93XVxuICBpZiAoIXN0ZXBzKSByZXR1cm5cbiAgbGV0IHN0ZXAgPSBzdGVwcy5zdGVwc1tuXVxuICBpZiAoIXN0ZXApIHJldHVyblxuXG4gIGxldCBkZWNrcyA9IFtbXSxbXV0gYXMgW1VVSURbXSwgVVVJRFtdXVxuXG4gIGxldCB2aXN1YWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKVxuICB2aXN1YWwuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxMDAlXCIpXG5cbiAgdmlzdWFsLnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCItMC4xIC0wLjEgMS4yIDEuMlwiKVxuICB2aXN1YWwuc2V0QXR0cmlidXRlKFwicHJlc2VydmVBc3BlY3RSYXRpb1wiLCBcInhNaWRZTWlkIG1lZXRcIilcblxuICBsZXQgdHJhbnNwb3J0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInBvbHlnb25cIilcbiAgbGV0IHBvaW50cyA9IFsgWy4yLCAwXSwgWy4wLCAuMl0sIFsuMCwgLjRdLCBbLjIsIC40XSwgWy44LCAuNF0sIFsuOCwgLjM3XSwgWy4yLCAuMzddLCBbLjIsIC4yXSwgWy44LCAuMl0sIFsuOCwgLjE3XSwgWy4yLCAuMTddLF1cbiAgdHJhbnNwb3J0ZXIuc2V0QXR0cmlidXRlKFwicG9pbnRzXCIsIHBvaW50cy5tYXAocD0+cC5qb2luKFwiLFwiKSkuam9pbihcIiBcIikpXG4gIHRyYW5zcG9ydGVyLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuYmx1ZSlcblxuICB2aXN1YWwuYXBwZW5kQ2hpbGQodHJhbnNwb3J0ZXIpXG5cbiAgZGVja3MuZm9yRWFjaCgoZGVjaywgaSk9PntcbiAgICBkZWNrLmZvckVhY2goKHJlcSwgaik9PntcbiAgICAgIGxldCBjYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInJlY3RcIilcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJ4XCIsICgwLjIyNSArIC4yICogaikudG9TdHJpbmcoKSlcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJ5XCIsICgwLjI1IC0gMC4yICAqIGkpLnRvU3RyaW5nKCkpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIuMTVcIilcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCIwLjEyXCIpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5ncmF5KVxuICAgICAgdmlzdWFsLmFwcGVuZENoaWxkKGNhcilcblxuICAgICAgbGV0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInRleHRcIilcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwieFwiLCAoMC4yMjUgKyAuMiAqIGogKyAwLjA3NSkudG9TdHJpbmcoKSlcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwieVwiLCAoMC4yNyAtIDAuMiAqIGkgKyAwLjA1KS50b1N0cmluZygpKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJkb21pbmFudC1iYXNlbGluZVwiLCBcIm1pZGRsZVwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIuMDZcIilcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5jb2xvcilcbiAgICAgIHRleHQudGV4dENvbnRlbnQgPSBgJHtyZXF1ZXN0cy5maW5kSW5kZXgocj0+ci5pZCA9PSByZXEpLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKX1gXG4gICAgICB2aXN1YWwuYXBwZW5kQ2hpbGQodGV4dClcbiAgICAgIFxuICAgIH0pXG4gIH0pXG5cbiAgZm9yIChsZXQgeCBvZiBbMC4yLCAwLjZdKXtcbiAgICBsZXQgdGlyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwiY2lyY2xlXCIpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4LnRvU3RyaW5nKCkpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJjeVwiLCBcIjAuNVwiKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDdcIilcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuYmx1ZSlcbiAgICB2aXN1YWwuYXBwZW5kQ2hpbGQodGlyZSlcbiAgfVxuXG5cblxuICBsZXQgZGVhZCA9IHN0ZXAuJCAhPSBcInN0YXJ0XCIgJiYgZ2V0UmVxdWVzdChzdGVwLnZhbC5yZXF1ZXN0KS5kZWFkbGluZS52YWx1ZSA8IGRpc3QudmFsdWVcblxuICBsZXQgcmVzID0gZGl2KFxuICAgIGgyKHRyYW5zcG9ydGVyU3RyaW5nKHN0ZXBzLnRyYW5zcG9ydGVyKSksXG4gICAgcChgJHt0aW1lU3RyaW5nKGRpc3QpfSAvICR7dGltZVN0cmluZyh0b3RhbCl9YCksXG4gICAgcChzdGVwU3RyaW5nKHN0ZXApLCBzdHlsZSh7Y29sb3I6IGRlYWQgPyBjb2xvci5yZWQgOiBjb2xvci5jb2xvcn0pKSxcbiAgICBzdHlsZSh7XG4gICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgICBtYXJnaW46IFwiMFwiLFxuICAgICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICAgIG1pbkhlaWdodDogXCIyZW1cIixcbiAgICB9KVxuICApXG5cbiAgcmVzLmFwcGVuZCh2aXN1YWwpXG4gIHBhcmVudC5yZXBsYWNlQ2hpbGRyZW4ocmVzKVxufVxuIiwKICAgICJpbXBvcnQgeyBoYXNoIH0gZnJvbSBcIi4uL2hhc2hcIjtcbmltcG9ydCB7IGJvZHksIGJ1dHRvbiwgY29sb3IsIGRpdiwgZXJyb3Jwb3B1cCwgaDEsIGgyLCBoMywgaW5wdXQsIG1hcmdpbiwgcCwgcGFkZGluZywgcG9wdXAsIHByZSwgc3Bhbiwgc3R5bGUsIHRhYmxlLCB3aWR0aCwgdGV4dGFyZWEsIGEsIGJvcmRlciwgaHRtbCwgdGgsIHRyLCB0ZCwgYm9yZGVyUmFkaXVzLCBwYW5lbExpc3QsIGRpc3BsYXksIGJhY2tncm91bmQgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBtYXBWaWV3IH0gZnJvbSBcIi4vbWFwVmlld1wiO1xuaW1wb3J0IHsgcmFuZG9tTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgTG9jYXRpb24sIHJhbmRvbVVVSUQsIFJlcXVlc3QsIFNjaGVkdWxlLCB1Y29uc3QsIFVVSUQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IHJlcXVlc3RWaWV3IH0gZnJvbSBcIi4vcmVxdWVzdFZpZXdcIjtcbmltcG9ydCB7IHNjaGVkdWxlVmlldyB9IGZyb20gXCIuL3NjaGVkdWxlVmlld1wiO1xuaW1wb3J0IHsgbWtXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IG9wdGltaXplU2NoZWR1bGUgfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZG9tLCBzZXRSYW5kU2VlZCB9IGZyb20gXCIuLi9yYW5kb21cIjtcblxuXG5ib2R5LnN0eWxlLm1hcmdpbiA9IFwiMFwiXG5cbmxldCBoZWFkZXIgPSBoMShcInJvdXRlIHBsYW5uZXJcIiwgc3R5bGUoe2JhY2tncm91bmQ6IGNvbG9yLmJsdWUsIGNvbG9yOiBjb2xvci5iYWNrZ3JvdW5kLCBtYXJnaW46IFwiMFwiLCBwYWRkaW5nOiBcIi42ZW1cIn0pKVxuXG5sZXQgY29udGVudFNwYWNlID0gZGl2KHN0eWxlKHtcbiAgZGlzcGxheTpcImZsZXhcIixcbiAgZmxleERpcmVjdGlvbjpcInJvd1wiLFxuICB3aWR0aDogXCIxMDAlXCIsXG4gIGhlaWdodDogXCJjYWxjKDEwMCUgLSAyLjVlbSlcIixcbiAgbWluV2lkdGg6IFwiMFwiLFxufSkpXG5cbmxldCBwYWdlID0gZGl2KFxuICBzdHlsZSh7ZGlzcGxheTpcImZsZXhcIiwgZmxleERpcmVjdGlvbjpcImNvbHVtblwiLCBoZWlnaHQ6IFwiMTAwJVwifSksXG4gIGhlYWRlcixcbiAgY29udGVudFNwYWNlXG4pXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKHBhZ2UpXG5cblxuc2V0UmFuZFNlZWQoMjUpXG5cblxuZXhwb3J0IGxldCByb2FkTWFwID0gcmFuZG9tTWFwKClcblxuZXhwb3J0IGxldCByZXF1ZXN0czogUmVxdWVzdFtdID0gQXJyYXkuZnJvbSh7bGVuZ3RoOjIwfSwgKF8saSk9Pih7XG4gIGlkOiByYW5kb21VVUlEKCksXG4gIHN0YXJ0UG9pbnQ6IHJhbmRDaG9pY2Uocm9hZE1hcC5wb2ludHMpLFxuICBlbmRQb2ludDogcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyksXG4gIHZhbHVlOiB1Y29uc3QoTWF0aC5mbG9vcihyYW5kb20oKSoxMDAwKSwgXCJldXJcIiksXG4gIGRlYWRsaW5lOiB1Y29uc3QoTWF0aC5mbG9vcihyYW5kb20oKSo2MCo2MCoyNCo3KSwgXCJzZWNvbmRzXCIpLFxufSkpXG5cblxuZXhwb3J0IGxldCBzY2hlZHVsZSA9IG1rV3JpdGFibGU8U2NoZWR1bGU+IChBcnJheS5mcm9tKHtsZW5ndGg6IDN9LCAoXyxpKT0+KHtcbiAgdHJhbnNwb3J0ZXI6IHJhbmRvbVVVSUQoKSxcbiAgc3RlcHM6IFt7ICQ6XCJzdGFydFwiLCB2YWw6IHtcInBvc1wiOiAgcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyl9fV1cbn0pKSlcblxuXG5cbnNjaGVkdWxlLnVwZGF0ZShzY2hlZD0+b3B0aW1pemVTY2hlZHVsZShyZXF1ZXN0cywgc2NoZWQpKVxuXG5cbmV4cG9ydCB0eXBlIEhpZ2hMaWdodCA9IHtcbiAgcG9pbnRzOiB7XG4gICAgbG9jYXRpb246IExvY2F0aW9uLFxuICAgIGxvZ28/IDogc3RyaW5nLFxuICB9W10sXG4gIGNvbG9yPzogc3RyaW5nXG59XG5cbmV4cG9ydCBsZXQgaGlnaHRMaWdodHMgPSBta1dyaXRhYmxlIDxIaWdoTGlnaHRbXT4oIFtdIClcblxuXG5mdW5jdGlvbiBta1dpbmRvdyAodGFiOiBudW1iZXIgPSAwICkge1xuXG4gIGxldCB0YWJGaWVsZHMgPSBbXG4gICAgWydtYXAnLCBtYXBWaWV3KHJvYWRNYXApXSxcbiAgICBbJ3JlcXVlc3RzJywgcmVxdWVzdFZpZXcocmVxdWVzdHMsIHNjaGVkdWxlLmdldCgpKV0sXG4gICAgWydzY2hlZHVsZScsIHNjaGVkdWxlVmlldygpIF0sXG4gIF0gYXMgY29uc3RcblxuICBjb25zdCBlbCA9IGRpdihzdHlsZSh7XG4gICAgZmxleDogXCIxIDEgMFwiLFxuICAgIG1pbldpZHRoOiBcIjBcIixcbiAgICBoZWlnaHQ6IFwiY2FsYygxMDB2aCAtIDFlbSlcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG4gIH0pKVxuXG4gIGZ1bmN0aW9uIG9wZW5UYWIodGFiOiB0eXBlb2YgdGFiRmllbGRzW251bWJlcl1bMF0pIHtcbiAgICBlbC5yZXBsYWNlQ2hpbGRyZW4oXG4gICAgICBwKHRhYkZpZWxkcy5tYXAoKFtuLGVdKT0+XG4gICAgICAgIHNwYW4oIG4sXG4gICAgICAgICAgKCk9Pm9wZW5UYWIobiksXG4gICAgICAgICAgc3R5bGUoe1xuICAgICAgICAgICAgcGFkZGluZzogXCIuM2VtXCIsXG4gICAgICAgICAgICBtYXJnaW46IFwiLjNlbVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrIChuPT10YWIgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXkpLFxuICAgICAgICAgICAgY29sb3I6IChuPT10YWIpID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5LFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgICkpLFxuICAgICAgdGFiRmllbGRzLmZpbmQoKFtuLF0pPT5uPT10YWIpIVsxXVxuICAgIClcbiAgfVxuXG5cbiAgb3BlblRhYih0YWJGaWVsZHNbdGFiXSFbMF0pXG5cbiAgcmV0dXJuIGVsXG59XG5cbmNvbnRlbnRTcGFjZS5yZXBsYWNlQ2hpbGRyZW4obWtXaW5kb3coMiApLCBta1dpbmRvdygpKVxuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQUVPLElBQU0sT0FBTyxTQUFTO0FBRTdCLElBQU0sZUFBZTtBQUFBLEVBQ25CLE9BQU07QUFBQSxJQUNKLE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNu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QUFDN0QsRUFBRTtBQUdLLElBQUksV0FBVyxXQUFzQixNQUFNLEtBQUssRUFBQyxRQUFRLEVBQUMsR0FBRyxDQUFDLEdBQUUsT0FBSztBQUFBLEVBQzFFLGFBQWEsV0FBVztBQUFBLEVBQ3hCLE9BQU8sQ0FBQyxFQUFFLEdBQUUsU0FBUyxLQUFLLEVBQUMsS0FBUSxXQUFXLFFBQVEsTUFBTSxFQUFDLEVBQUMsQ0FBQztBQUNqRSxFQUFFLENBQUM7QUFJSCxTQUFTLE9BQU8sV0FBTyxpQkFBaUIsVUFBVSxLQUFLLENBQUM7QUFXakQsSUFBSSxjQUFjLFdBQTBCLENBQUMsQ0FBRTtBQUd0RCxTQUFTLFFBQVMsQ0FBQyxNQUFjLEdBQUk7QUFBQSxFQUVuQyxJQUFJLFlBQVk7QUFBQSxJQUNkLENBQUMsT0FBTyxRQUFRLE9BQU8sQ0FBQztBQUFBLElBQ3hCLENBQUMsWUFBWSxZQUFZLFVBQVUsU0FBUyxJQUFJLENBQUMsQ0FBQztBQUFBLElBQ2xELENBQUMsWUFBWSxhQUFhLENBQUU7QUFBQSxFQUM5QjtBQUFBLEVBRUEsTUFBTSxLQUFLLElBQUksTUFBTTtBQUFBLElBQ25CLE1BQU07QUFBQSxJQUNOLFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLFFBQVEsZUFBYSxNQUFNO0FBQUEsSUFDM0IsVUFBVTtBQUFBLEVBQ1osQ0FBQyxDQUFDO0FBQUEsRUFFRixTQUFTLE9BQU8sQ0FBQyxNQUFrQztBQUFBLElBQ2pELEdBQUcsZ0JBQ0QsRUFBRSxVQUFVLElBQUksRUFBRSxHQUFFLE9BQ2xCLEtBQU0sR0FDSixNQUFJLFFBQVEsQ0FBQyxHQUNiLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFFBQVEsZ0JBQWUsS0FBRyxPQUFNLE1BQU0sUUFBUSxNQUFNO0FBQUEsTUFDcEQsT0FBUSxLQUFHLE9BQU8sTUFBTSxRQUFRLE1BQU07QUFBQSxJQUN4QyxDQUFDLENBQ0gsQ0FDRixDQUFDLEdBQ0QsVUFBVSxLQUFLLEVBQUUsT0FBTSxLQUFHLElBQUcsRUFBRyxFQUNsQztBQUFBO0FBQUEsRUFJRixRQUFRLFVBQVUsS0FBTSxFQUFFO0FBQUEsRUFFMUIsT0FBTztBQUFBO0FBR1QsYUFBYSxnQkFBZ0IsU0FBUyxDQUFFLEdBQUcsU0FBUyxDQUFDOyIsCiAgImRlYnVnSWQiOiAiQjI3MUFBQTEwNzlCOEJERjY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
