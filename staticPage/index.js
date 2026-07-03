// src/view/html.ts
var body = document.body;
var colorPalette = {
  light: {
    color: "#000",
    background: "#fff",
    red: "rgb(242, 55, 55)",
    green: "rgb(57, 214, 39)",
    blue: "rgb(5, 28, 141)",
    gray: "#888",
    lightgray: "#e5e5e5"
  },
  dark: {
    color: "#fff",
    background: "#222",
    red: "rgb(198, 20, 0)",
    blue: "rgb(95, 100, 255)",
    green: "rgb(0, 185, 19)",
    gray: "#565656",
    lightgray: "#414141"
  }
};
var color = {
  color: "var(--color)",
  background: "var(--background)",
  blue: "var(--blue)",
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

// src/planner.ts
var DECKCAPACITY = 3;
var DIST_COST = 1;
var UNLOADCOST = 0.1;
var PICKUPCOST = 0.1;
function pairId(a2, b) {
  return a2 < b ? `${a2}-${b}` : `${b}-${a2}`;
}
var CostMatrix = new Map;
function findPath(start, end) {
  let startPoint = getPoint(start);
  let endPoint = getPoint(end);
  let visited = new Map;
  visited.set(startPoint.id, { cost: 0, path: [startPoint] });
  let queue = [startPoint];
  while (queue.length > 0) {
    let current = queue.shift();
    if (current.id == endPoint.id) {
      break;
    }
    for (let [nextId, dist] of roadMap.roads.get(current.id) ?? []) {
      let next = roadMap.points.get(nextId);
      let cost = visited.get(current.id).cost + dist.dist;
      if (!visited.has(next.id) || cost < visited.get(next.id).cost) {
        visited.set(next.id, { cost, path: [...visited.get(current.id).path, next] });
        queue.push(next);
      }
    }
  }
  let path = visited.get(endPoint.id);
  if (!path)
    throw new Error(`No path found from ${startPoint.id} to ${endPoint.id}`);
  CostMatrix.set(pairId(startPoint.id, endPoint.id), path.cost);
  return path;
}
function getCost(start, end) {
  let id = pairId(start, end);
  if (!CostMatrix.has(id))
    findPath(start, end);
  return CostMatrix.get(id);
}
function getCostN(...points) {
  let cost = 0;
  for (let i = 0;i < points.length - 1; i++) {
    cost += getCost(points[i], points[i + 1]);
  }
  return cost;
}
var optDur = 0;
function optimizeSchedule(requests2, schedule) {
  let st = Date.now();
  for (let req of requests2) {
    let request = req.id;
    let sched = randChoice(schedule);
    sched.steps = sched.steps.concat({ $: "pickup", val: { request, pos: req.startPoint, deck: Math.random() > 0.5 ? 1 : 0 } }, { $: "deliver", val: { request: req.id, pos: req.endPoint } });
  }
  for (let i = 0;i < 1000; i++) {
    permute(schedule);
  }
  optDur = Date.now() - st;
  return schedule;
}
function randint(n) {
  return Math.floor(Math.random() * n);
}
function swap(s, a2, b) {
  let t = s[a2];
  s[a2] = s[b];
  s[b] = t;
}
function permute(schedule) {
  let rating = rateSchedule(schedule);
  schedule.forEach((x, i) => {
    let a2 = 1 + randint(x.steps.length - 1);
    let b = 1 + randint(x.steps.length - 1);
    swap(x.steps, a2, b);
    let newrate = rateSchedule(schedule);
    if (newrate <= rating)
      swap(x.steps, a2, b);
    if (Math.random() > 0.5) {
      let c = x.steps[1 + randint(x.steps.length - 1)];
      if (c?.$ == "pickup") {
        c.val.deck = c.val.deck == 0 ? 1 : 0;
        let newrate2 = rateSchedule(schedule);
        if (newrate2 <= rating)
          c.val.deck = c.val.deck == 0 ? 1 : 0;
      }
    }
  });
}
function rateSchedule(schedule) {
  let res = 0;
  let dist = 0;
  let decks;
  for (let item of schedule) {
    let unload = function(reqid, deck) {
      let idx = decks[deck].indexOf(reqid);
      if (idx == -1)
        return false;
      let after = decks[deck].slice(idx + 1);
      decks[deck] = decks[deck].slice(0, idx).concat(after);
      res -= UNLOADCOST;
      res -= after.length * (UNLOADCOST + PICKUPCOST);
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
        if (!decks.flat().includes(reqid))
          return -Infinity;
        if (!unload(reqid, 0) && !unload(reqid, 1))
          return -Infinity;
        res += req.value;
      } else
        return -Infinity;
    }
    dist += getCostN(...item.steps.map((x) => x.val.pos));
  }
  return res - dist * DIST_COST;
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
    return {
      el,
      setColor: (color2) => {
        el.setAttribute("fill", color2);
      }
    };
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
      let a2 = getPoint(id1);
      let b = getPoint(id2);
      let line = mkSvg("line", a2.location.x, a2.location.y, b.location.x, b.location.y).el;
      let id = pairId(a2.id, b.id);
      elements.set(id, line);
      sources.set(line, id);
      element.appendChild(line);
    }
  }
  for (let point of roadmap.points.values()) {
    let circle = mkSvg("circle", point.location.x, point.location.y).el;
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
          let path = findPath(last, next).path.map((l) => l.location);
          for (let i = 0;i < path.length - 1; i++) {
            let line = mkSvg("line", path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
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
        let pos = getPoint(p3.location).location;
        if (p3.logo) {
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

// src/module.ts
var UUID = string;
function randomUUID() {
  return "u" + Math.random().toString(16).slice(2, 10) + "-" + Math.random().toString(16).slice(2, 10);
}
var Location = object({
  id: UUID,
  rep: string,
  location: object({ x: number, y: number })
});
var Request = object({
  id: UUID,
  startPoint: UUID,
  endPoint: UUID,
  value: number,
  deadline: number
});
var Transporter = object({ id: UUID, position: UUID });
var ScheduleStep = tagged({
  pickup: object({ request: UUID, pos: UUID, deck: union(constant(0), constant(1)) }),
  deliver: object({ request: UUID, pos: UUID }),
  start: object({ pos: UUID })
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

// src/randomMap.ts
function randomMap(seed = 2) {
  function random() {
    let x = Math.sin(seed++) * 1e4;
    return x - Math.floor(x);
  }
  seed = random() * 1e4;
  let points = new Map;
  let roads = new Map;
  function pureDistance(a2, b) {
    return Math.hypot(a2.location.x - b.location.x, a2.location.y - b.location.y);
  }
  for (let i = 0;i < 100; i++) {
    let id = randomUUID();
    points.set(id, {
      id,
      rep: "DE " + i.toString().padStart(5, "0"),
      location: { x: random(), y: random() }
    });
  }
  points.values().forEach((p3) => {
    roads.set(p3.id, new Map);
  });
  for (let p3 of points.values()) {
    let nearest = points.values().toArray().sort((a2, b) => pureDistance(p3, a2) - pureDistance(p3, b)).slice(1, 1 + 3);
    for (let n of nearest) {
      let dist = pureDistance(p3, n);
      roads.get(p3.id).set(n.id, { dist });
      roads.get(n.id).set(p3.id, { dist });
    }
  }
  return {
    points,
    roads
  };
}

// src/view/requestView.ts
function locString(id) {
  return `\uD83D\uDCCD ${roadMap.points.get(id)?.rep ?? "UNK"}`;
}
function transporString(id) {
  return `\uD83D\uDE9B ${schedule.get().findIndex((s) => s.transporter == id).toString().padStart(4, "0")}`;
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
    cursor: "pointer"
  }), ...x);
  return table(style({ borderCollapse: "collapse" }), tr(["request", "start", "end", "distanz", "preis", "frist"].map((h) => cell(h)), style({ fontWeight: "bold" })), requests3.map((r, i) => {
    let path = findPath(r.startPoint, r.endPoint);
    let date = new Date(r.deadline);
    let row = tr(cell(requestString(r.id)), cell(locString(r.startPoint)), cell(locString(r.endPoint)), cell(span(path.cost.toFixed(2), style({ float: "right" }))), cell(span(r.value.toString() + "€", style({ float: "right" }))), cell(date.getDate().toString().padStart(2, "0") + "." + (date.getMonth() + 1).toString().padStart(2, "0") + "." + date.getFullYear()));
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
var scheduleView = () => {
  let cell = (...x) => td(style({
    border: "1px solid var(--gray)",
    margin: "0",
    padding: ".3em .5em",
    cursor: "pointer",
    whiteSpace: "nowrap"
  }), ...x);
  let tabview = div();
  let stepview = div();
  let stepEls = [];
  let rowEls = [];
  schedule.onupdate((sched) => {
    let cursor = { row: 1, col: 1 };
    function view(row, n) {
      console.log("VIEW");
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
          let background = "";
          if (i == n && row == rown) {
            background = color.green;
            viewStep(row, n, stepview);
          } else if (step2.$ != "start" && step2.val.request == request)
            background = color.gray;
          el.style.background = background;
        });
      });
      let logo = stepLogo(step);
      hightLights.set([
        { points: steps.slice(n, n + 2).map((p3, i) => ({ location: p3.val.pos })), color: "#ffc988" },
        { points: [{ location: step.val.pos, logo }] }
      ]);
    }
    tabview.replaceChildren(table(["transporter", "steps"].map((h) => cell(h)), style({ fontWeight: "bold" }), sched.map((s, rown) => {
      let allPoints = s.steps.map((step) => ({ location: step.val.pos, logo: stepLogo(step) }));
      let transport = span(transporString(s.transporter));
      transport.onmouseenter = () => hightLights.set([{ points: allPoints, color: "#ffc988" }]);
      stepEls.push(s.steps.map((step, i) => {
        let logo = stepLogo(step);
        let res = span(logo, style({ padding: ".3em .3em" }));
        res.onclick = () => {
          console.log("CLICK", rown, i);
          cursor = { row: rown, col: i };
          view(rown, i);
        };
        return res;
      }));
      let row = tr(cell(transport), cell(stepEls[rown]));
      rowEls.push(row);
      return row;
    }), style({ borderCollapse: "collapse" })));
    body.addEventListener("keydown", (e) => {
      if (cursor.col == -1)
        return;
      if (e.key == "ArrowLeft")
        cursor.col -= 1;
      else if (e.key == "ArrowRight")
        cursor.col += 1;
      else if (e.key == "ArrowUp")
        cursor.row -= 1;
      else if (e.key == "ArrowDown")
        cursor.row += 1;
      else if (e.key == "Escape")
        cursor = { row: -1, col: -1 };
      else
        return;
      e.preventDefault();
      cursor.row = Math.max(0, Math.min(sched.length - 1, cursor.row));
      cursor.col = Math.max(0, Math.min(sched[cursor.row].steps.length - 1, cursor.col));
      view(cursor.row, cursor.col);
    });
    view(cursor.row, cursor.col);
  });
  let value = span();
  schedule.onupdate((sch) => value.textContent = rateSchedule(sch).toFixed(2));
  let scheduleEl = div(style({
    width: "calc(100% - 2em)",
    height: "100%",
    overflow: "auto",
    minWidth: "0",
    padding: ".5em"
  }), tabview, p("Value: ", value), p("search time:", optDur), stepview);
  return scheduleEl;
};
function viewStep(row, n, parent) {
  let steps = schedule.get()[row];
  if (!steps)
    return;
  let step = steps.steps[n];
  if (!step)
    return;
  let totalDist = 0;
  let dist = 0;
  let decks = [[], []];
  for (let i = 1;i < steps.steps.length; i++) {
    if (i <= n) {
      let step2 = steps.steps[i];
      if (step2.$ == "pickup")
        decks[step2.val.deck].push(step2.val.request);
      if (step2.$ == "deliver")
        decks = decks.map((d) => d.filter((r) => r != step2.val.request));
    }
    totalDist += getCost(steps.steps[i - 1].val.pos, steps.steps[i].val.pos);
    if (i == n)
      dist = totalDist;
  }
  let visual = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  visual.setAttribute("width", "100%");
  visual.setAttribute("viewBox", "-0.1 -0.1 1.2 1.2");
  visual.setAttribute("preserveAspectRatio", "xMidYMid meet");
  let transporter = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  let points = [[0.2, 0], [0, 0.2], [0, 0.4], [0.2, 0.4], [0.8, 0.4], [0.8, 0.37], [0.2, 0.37], [0.2, 0.2], [0.8, 0.2], [0.8, 0.17], [0.2, 0.17]];
  transporter.setAttribute("points", points.map((p3) => p3.join(",")).join(" "));
  transporter.setAttribute("fill", color.blue);
  visual.appendChild(transporter);
  console.log(`decks
` + decks.map((d) => d.map((r) => "<>").join(" ")).join(`
`));
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
  let res = div(h2(transporString(steps.transporter)), p(`distance: ${dist.toFixed(2)} / ${totalDist.toFixed(2)}`), style({
    border: "1px solid var(--gray)",
    margin: "0",
    padding: ".3em .5em",
    minHeight: "2em"
  }));
  res.append(visual);
  parent.replaceChildren(res);
}

// src/writeable.ts
function mkWritable(value) {
  let listeners = [];
  let res = {
    get: () => value,
    set: (newValue) => {
      if (JSON.stringify(newValue) === JSON.stringify(value))
        return;
      listeners.forEach((listener) => listener(newValue, value));
      value = newValue;
    },
    onupdate: (listener) => {
      listener(value, value);
      listeners.push(listener);
    },
    update: (callback) => {
      let newValue = callback(value);
      res.set(newValue);
    }
  };
  return res;
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
function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
var roadMap = randomMap(1);
function getPoint(id) {
  let point = roadMap.points.get(id);
  if (!point)
    throw new Error(`Point ${id} not found`);
  return point;
}
var requests = Array.from({ length: 20 }, (_, i) => ({
  id: randomUUID(),
  startPoint: randChoice(Array.from(roadMap.points.keys())),
  endPoint: randChoice(Array.from(roadMap.points.keys())),
  value: Math.floor(Math.random() * 100),
  deadline: Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
}));
var schedule = mkWritable(Array.from({ length: 3 }, (_, i) => ({
  transporter: randomUUID(),
  steps: [{ $: "start", val: { pos: randChoice(roadMap.points.values().toArray().map((x) => x.id)) } }]
})));
schedule.update((x) => optimizeSchedule(requests, x));
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
  randChoice,
  hightLights,
  getPoint
};

//# debugId=B3D8F1AD5338CA5764756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvcGxhbm5lci50cyIsICJzcmMvdmlldy9tYXBWaWV3LnRzIiwgInNyYy9zY2hlbWEudHMiLCAic3JjL21vZHVsZS50cyIsICJzcmMvcmFuZG9tTWFwLnRzIiwgInNyYy92aWV3L3JlcXVlc3RWaWV3LnRzIiwgInNyYy92aWV3L3NjaGVkdWxlVmlldy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy92aWV3L21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiXG5pbXBvcnQgdHlwZSB7IEpzb25EYXRhIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuZXhwb3J0IGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG5jb25zdCBjb2xvclBhbGV0dGUgPSB7XG4gIGxpZ2h0OntcbiAgICBjb2xvcjogICAgICAgICAgICAgXCIjMDAwXCIsXG4gICAgYmFja2dyb3VuZDogICAgICAgIFwiI2ZmZlwiLFxuICAgIHJlZDogICAgICAgICAgICAgICBcInJnYigyNDIsIDU1LCA1NSlcIixcbiAgICBncmVlbjogICAgICAgICAgICAgXCJyZ2IoNTcsIDIxNCwgMzkpXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDUsIDI4LCAxNDEpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDEwMCwgMjU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYigwLCAxODUsIDE5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM1NjU2NTZcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjNDE0MTQxXCIsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbG9yID0ge1xuICBjb2xvcjogXCJ2YXIoLS1jb2xvcilcIixcbiAgYmFja2dyb3VuZDogXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiLFxuICBibHVlOiBcInZhcigtLWJsdWUpXCIsXG4gIHJlZDogXCJ2YXIoLS1yZWQpXCIsXG4gIGdyZWVuOiBcInZhcigtLWdyZWVuKVwiLFxuICBncmF5OiBcInZhcigtLWdyYXkpXCIsXG4gIGxpZ2h0Z3JheTogXCJ2YXIoLS1saWdodGdyYXkpXCJcbn1cblxuXG5sZXQgc3R5bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKVxuc3R5bC5pbm5lckhUTUwgPSBgXG46cm9vdCB7XG4gIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmRhcmsuY29sb3J9O1xuICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmFja2dyb3VuZH07XG4gIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5kYXJrLnJlZH07XG4gIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JlZW59O1xuICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmx1ZX07XG4gIC0tZ3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5ncmF5fTtcbiAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsubGlnaHRncmF5fTtcbiAgY29sb3I6IHZhcigtLWNvbG9yKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZCk7XG4gIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgOnJvb3Qge1xuICAgIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmNvbG9yfTtcbiAgICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJhY2tncm91bmR9O1xuICAgIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5saWdodC5yZWR9O1xuICAgIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyZWVufTtcbiAgICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJsdWV9O1xuICAgIC0tZ3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JheX07XG4gICAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmxpZ2h0Z3JheX07XG4gIH1cbn1cbmBcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bClcblxuZXhwb3J0IHR5cGUgaHRtbEtleSA9ICdpbm5lclRleHQnfCdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdvbmtleWRvd24nIHwgJ29ubW91c2VvdmVyJyB8ICdvbm1vdXNlZXhpdCcgfCdjaGlsZHJlbid8J2NsYXNzJ3wnaWQnfCdjb250ZW50RWRpdGFibGUnfCdldmVudExpc3RlbmVycyd8J2NvbG9yJ3wnYmFja2dyb3VuZCcgfCAnc3R5bGUnIHwgJ3BsYWNlaG9sZGVyJyB8ICd0YWJJbmRleCcgfCAnY29sU3BhbicgfCAndHlwZSdcbmV4cG9ydCBjb25zdCBodG1sRWxlbWVudCA9ICh0YWc6c3RyaW5nLCB0ZXh0OnN0cmluZywgYXJncz86UGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4pOkhUTUxFbGVtZW50ID0+e1xuXG4gIGNvbnN0IF9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpXG4gIF9lbGVtZW50LnRleHRDb250ZW50ID0gdGV4dFxuICBsZXQgc3QgPSBfZWxlbWVudC5zdHlsZVxuICBpZiAodGFnID09IFwiYnV0dG9uXCIpe1xuICAgIF9lbGVtZW50LmlubmVyVGV4dCA9IHRleHRcbiAgICBzdC5jb2xvciA9IGNvbG9yLmNvbG9yXG4gICAgc3QuYmFja2dyb3VuZENvbG9yID0gY29sb3IubGlnaHRncmF5XG4gICAgc3QuYm9yZGVyID0gXCIxcHggc29saWQgXCIrY29sb3IuZ3JheVxuICAgIHN0LmJvcmRlclJhZGl1cyA9IFwiLjJlbVwiXG4gICAgc3QucGFkZGluZyA9IFwiLjFlbSAuNGVtXCJcbiAgICBzdC5tYXJnaW4gPSBcIi4yZW1cIlxuICB9XG4gIGlmIChhcmdzKSBPYmplY3QuZW50cmllcyhhcmdzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pPT57XG4gICAgaWYgKGtleSA9PT0gJ3BhcmVudCcpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChfZWxlbWVudClcbiAgICB9XG4gICAgaWYgKGtleT09PSdjaGlsZHJlbicpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50W10pLmZvckVhY2goYz0+X2VsZW1lbnQuYXBwZW5kQ2hpbGQoYykpXG4gICAgfWVsc2UgaWYgKGtleT09PSdldmVudExpc3RlbmVycycpe1xuICAgICAgT2JqZWN0LmVudHJpZXModmFsdWUgYXMgUmVjb3JkPHN0cmluZywgKGU6RXZlbnQpPT52b2lkPikuZm9yRWFjaCgoW2V2ZW50LCBsaXN0ZW5lcl0pPT57XG4gICAgICAgIF9lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxuICAgICAgfSlcbiAgICB9ZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKXtcbiAgICAgIE9iamVjdC5hc3NpZ24oX2VsZW1lbnQuc3R5bGUsIHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pXG4gICAgfWVsc2V7XG4gICAgICBfZWxlbWVudFsoa2V5IGFzICdpbm5lclRleHQnIHwgJ29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ2lkJyB8ICdjb250ZW50RWRpdGFibGUnKV0gPSB2YWx1ZVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIF9lbGVtZW50XG59XG5cbmV4cG9ydCB0eXBlIEhUTUxBcmcgPSBzdHJpbmcgfCBudW1iZXIgfCBIVE1MRWxlbWVudCB8IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ICB8IFByb21pc2U8SFRNTEFyZz4gfCBIVE1MQXJnW10gfCBGdW5jdGlvblxuZXhwb3J0IGNvbnN0IGh0bWwgPSAodGFnOnN0cmluZywgLi4uY3M6SFRNTEFyZ1tdKTpIVE1MRWxlbWVudD0+e1xuICBsZXQgY2hpbGRyZW46IEhUTUxFbGVtZW50W10gPSBbXVxuICBsZXQgYXJnczogUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gPSB7fVxuXG4gIGNvbnN0IGFkZF9hcmcgPSAoYXJnOkhUTUxBcmcpPT57XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcpKVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcudG9TdHJpbmcoKSkpXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgUHJvbWlzZSl7XG4gICAgICBjb25zdCBlbCA9IHNwYW4oXCIuLi5cIilcbiAgICAgIGFyZy50aGVuKCh2YWx1ZSk9PntcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKHZhbHVlKSlcbiAgICAgIH0pXG4gICAgICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIH1cbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgY2hpbGRyZW4ucHVzaChhcmcpXG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSBhcmcuZm9yRWFjaCh4PT5hZGRfYXJnKHgpKVxuICAgIC8vIGVsc2UgaWYgKCdnZXQnIGluIGFyZyAmJiB0eXBlb2YgYXJnLmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vICAgY29uc3QgZWwgPSBzcGFuKClcbiAgICAvLyAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgLy8gICBpZiAoJ29udXBkYXRlJyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5vbnVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykgYXJnLm9udXBkYXRlKHg9PmVsLnJlcGxhY2VDaGlsZHJlbih4KSlcbiAgICAvLyB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PSBcImZ1bmN0aW9uXCIpe1xuICAgICAgaWYgKGFyZy5uYW1lID09IFwib25pbnB1dFwiKSBhcmdzLm9uaW5wdXQgPSBhcmdcbiAgICAgIGVsc2UgaWYgKGFyZy5uYW1lID09IFwib25jbGlja1wiIHx8IGFyZy5sZW5ndGggPCAyKSBhcmdzLm9uY2xpY2sgPSBhcmdcbiAgICAgIGVsc2UgY29uc29sZS53YXJuKFwiRnVuY3Rpb24gYXJndW1lbnQgd2l0aG91dCBuYW1lIG9yIHdpdGggbW9yZSB0aGFuIG9uZSBwYXJhbWV0ZXIgaXMgaWdub3JlZCBpbiBodG1sIGdlbmVyYXRvclwiKVxuICAgIH1cbiAgICBlbHNlIGFyZ3MgPSB7Li4uYXJncywgLi4uYXJnfVxuICB9XG4gIGNzLmZvckVhY2goYWRkX2FyZylcbiAgcmV0dXJuIGh0bWxFbGVtZW50KHRhZywgXCJcIiwgey4uLmFyZ3MsIGNoaWxkcmVufSlcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEdlbmVyYXRvcjxUIGV4dGVuZHMgSFRNTEVsZW1lbnQgPSBIVE1MRWxlbWVudD4gPSAoLi4uY3M6SFRNTEFyZ1tdKSA9PiBUXG5jb25zdCBuZXdIdG1sR2VuZXJhdG9yID0gPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4odGFnOnN0cmluZyk9PiguLi5jczpIVE1MQXJnW10pOlQ9Pmh0bWwodGFnLCAuLi5jcykgYXMgVFxuXG5leHBvcnQgY29uc3QgcDpIVE1MR2VuZXJhdG9yPEhUTUxQYXJhZ3JhcGhFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwXCIpXG5leHBvcnQgY29uc3QgYTpIVE1MR2VuZXJhdG9yPEhUTUxBbmNob3JFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJhXCIpXG5leHBvcnQgY29uc3QgaDE6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgxXCIpXG5leHBvcnQgY29uc3QgaDI6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgyXCIpXG5leHBvcnQgY29uc3QgaDM6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgzXCIpXG5leHBvcnQgY29uc3QgaDQ6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImg0XCIpXG5cbmV4cG9ydCBjb25zdCBkaXY6SFRNTEdlbmVyYXRvcjxIVE1MRGl2RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiZGl2XCIpXG5leHBvcnQgY29uc3QgcHJlOkhUTUxHZW5lcmF0b3I8SFRNTFByZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInByZVwiKVxuZXhwb3J0IGNvbnN0IHNwYW46SFRNTEdlbmVyYXRvcjxIVE1MU3BhbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInNwYW5cIilcbmV4cG9ydCBjb25zdCB0ZXh0YXJlYTpIVE1MR2VuZXJhdG9yPEhUTUxUZXh0QXJlYUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRleHRhcmVhXCIpXG5cbmV4cG9ydCBjb25zdCBidXR0b246SFRNTEdlbmVyYXRvcjxIVE1MQnV0dG9uRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYnV0dG9uXCIpXG4vLyBleHBvcnQgY29uc3QgdGFibGUgPSAocm93czogSFRNTEFyZ1tdW10sIC4uLmFyZ3M6IEhUTUxBcmdbXSkgPT4gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpKCBzdHlsZSh7Ym9yZGVyU3BhY2luZzogXCIxZW0gLjRlbVwifSkgLCByb3dzLm1hcChjZWxscz0+dHIoY2VsbHMubWFwKGNlbGw9PnRkKGNlbGwpKSkpLCAuLi5hcmdzKVxuZXhwb3J0IGNvbnN0IHRhYmxlOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIilcblxuZXhwb3J0IGNvbnN0IHRyOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlUm93RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidHJcIilcbmV4cG9ydCBjb25zdCB0ZDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZFwiKVxuZXhwb3J0IGNvbnN0IHRoOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRoXCIpXG5leHBvcnQgY29uc3QgY2FudmFzOkhUTUxHZW5lcmF0b3I8SFRNTENhbnZhc0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImNhbnZhc1wiKVxuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSAoLi4ucnVsZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5bXSkgPT4gKHtzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgLi4ucnVsZXMpfSlcbmV4cG9ydCBjb25zdCBtYXJnaW4gPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe21hcmdpbjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHBhZGRpbmcgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3BhZGRpbmc6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXIgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlcjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlclJhZGl1cyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyUmFkaXVzOiB2YWx1ZX0pXG5leHBvcnQgY29uc3Qgd2lkdGggPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3dpZHRoOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgaGVpZ2h0ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtoZWlnaHQ6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBkaXNwbGF5ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtkaXNwbGF5OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYmFja2dyb3VuZCA9ICh2YWx1ZTogc3RyaW5nID0gXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiKSA9PiBzdHlsZSh7YmFja2dyb3VuZDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3QgaW5wdXQ6SFRNTEdlbmVyYXRvcjxIVE1MSW5wdXRFbGVtZW50PiA9ICguLi5jcyk9PntcbiAgY29uc3QgY29udGVudCA9IGNzLmZpbHRlcihjPT50eXBlb2YgYyA9PSAnc3RyaW5nJykuam9pbignICcpXG4gIGNvbnN0IGVsID0gaHRtbChcImlucHV0XCIsIC4uLmNzKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gIGVsLnZhbHVlID0gY29udGVudFxuICByZXR1cm4gZWxcbn1cblxuXG5leHBvcnQgY29uc3QgcG9wdXAgPSAoLi4uY3M6SFRNTEFyZ1tdKT0+e1xuICBjb25zdCBkaWFsb2dmaWVsZCA9IGRpdih7XG4gICAgc3R5bGU6IHtcbiAgICAgIGJhY2tncm91bmQ6IGNvbG9yLmJhY2tncm91bmQsXG4gICAgICBjb2xvcjogY29sb3IuY29sb3IsXG4gICAgICBwYWRkaW5nOiBcIjFlbSA0ZW1cIixcbiAgICAgIHBhZGRpbmdCb3R0b206IFwiMmVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMWVtXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgICAgb3ZlcmZsb3dZOiBcInNjcm9sbFwiLFxuICAgICAgbWluV2lkdGg6IFwiMjB2d1wiLFxuICAgICAgbWF4SGVpZ2h0OiBcIjgwdmhcIixcbiAgICB9fSxcbiAgICAuLi5jcylcblxuICBjb25zdCBwb3B1cGJhY2tncm91bmQgPSBkaXYoXG4gICAge3N0eWxlOntcbiAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICB0b3A6IFwiMFwiLFxuICAgICAgbGVmdDogXCIwXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJyZ2JhKDE2NiwgMTY2LCAxNjYsIDAuNSlcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICB9fVxuICApXG5cbiAgcG9wdXBiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKGRpYWxvZ2ZpZWxkKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwb3B1cGJhY2tncm91bmQpO1xuICBwb3B1cGJhY2tncm91bmQub25jbGljayA9ICgpID0+IHtwb3B1cGJhY2tncm91bmQucmVtb3ZlKCk7IH1cbiAgZGlhbG9nZmllbGQub25jbGljayA9IChlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICByZXR1cm4gcG9wdXBiYWNrZ3JvdW5kXG5cbn1cblxuZXhwb3J0IGNvbnN0IGVycm9ycG9wdXAgPSAoZTpFcnJvciB8IHN0cmluZykgPT57XG4gIHBvcHVwKGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOmNvbG9yLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6XCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgIHBhZGRpbmc6XCIxZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czpcIi40ZW1cIixcbiAgICAgIGNvbG9yOmNvbG9yLnJlZCxcbiAgICB9KSxcbiAgICBoMihcIkVycm9yXCIpLFxuICAgIHAoU3RyaW5nKGUpKVxuICApKVxuICB0aHJvdyAoZSBpbnN0YW5jZW9mIEVycm9yKSA/IGUgOiBuZXcgRXJyb3IoU3RyaW5nKGUpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFuZWxMaXN0KGl0ZW1zOiB7dGl0bGU6IEhUTUxBcmcsIGNvbnRlbnQ6IEhUTUxBcmd9W10pe1xuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgIGdhcDogXCIxZW1cIixcbiAgICB9KSxcbiAgICAuLi5pdGVtcy5tYXAoZj0+ZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuNGVtXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjVlbSAxZW1cIixcbiAgICAgIH0pLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgZm9udFdlaWdodDogXCJib2xkXCIsXG4gICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYudGl0bGVcbiAgICAgICksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBtYXJnaW5Ub3A6IFwiLjVlbVwiLFxuICAgICAgICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi5jb250ZW50XG4gICAgICApXG4gICAgKSlcbiAgKVxufVxuXG5cblxuXG4iLAogICAgImltcG9ydCB0eXBlIHsgTG9jYXRpb24sIFJlcXVlc3QsIFNjaGVkdWxlLCBTY2hlZHVsZUl0ZW0sIFVVSUQgfSBmcm9tIFwiLi9tb2R1bGVcIjtcbmltcG9ydCB7IGdldFBvaW50LCByYW5kQ2hvaWNlLCByZXF1ZXN0cywgcm9hZE1hcCB9IGZyb20gXCIuL3ZpZXcvbWFpblwiO1xuXG5cblxuY29uc3QgREVDS0NBUEFDSVRZID0gM1xuY29uc3QgRElTVF9DT1NUID0gMVxuY29uc3QgVU5MT0FEQ09TVCA9IDAuMVxuY29uc3QgUElDS1VQQ09TVCA9IDAuMVxuXG5leHBvcnQgZnVuY3Rpb24gcGFpcklkKGE6IFVVSUQsIGI6IFVVSUQpOiBzdHJpbmd7XG4gIHJldHVybiBhIDwgYiA/IGAke2F9LSR7Yn1gIDogYCR7Yn0tJHthfWBcbn1cblxuY29uc3QgQ29zdE1hdHJpeCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KClcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRQYXRoKHN0YXJ0OiBVVUlELCBlbmQ6IFVVSUQpOiB7cGF0aDogTG9jYXRpb25bXSwgY29zdDogbnVtYmVyfXtcblxuICBsZXQgc3RhcnRQb2ludCA9IGdldFBvaW50KHN0YXJ0KSFcbiAgbGV0IGVuZFBvaW50ID0gZ2V0UG9pbnQoZW5kKSFcblxuICBsZXQgdmlzaXRlZCA9IG5ldyBNYXA8c3RyaW5nLCB7Y29zdDogbnVtYmVyLCBwYXRoOiBMb2NhdGlvbltdfT4oKVxuICB2aXNpdGVkLnNldChzdGFydFBvaW50LmlkLCB7Y29zdDogMCwgcGF0aDogW3N0YXJ0UG9pbnRdfSlcbiAgbGV0IHF1ZXVlID0gW3N0YXJ0UG9pbnRdXG5cbiAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDApe1xuICAgIGxldCBjdXJyZW50ID0gcXVldWUuc2hpZnQoKSFcbiAgICBpZiAoY3VycmVudC5pZCA9PSBlbmRQb2ludC5pZCl7IGJyZWFrfVxuICBcbiAgICBmb3IgKGxldCBbbmV4dElkLCBkaXN0XSBvZiByb2FkTWFwLnJvYWRzLmdldChjdXJyZW50LmlkKSA/PyBbXSl7XG4gICAgICBsZXQgbmV4dCA9IHJvYWRNYXAucG9pbnRzLmdldChuZXh0SWQpIVxuICAgICAgbGV0IGNvc3QgPSB2aXNpdGVkLmdldChjdXJyZW50LmlkKSEuY29zdCArIGRpc3QuZGlzdFxuICAgICAgaWYgKCF2aXNpdGVkLmhhcyhuZXh0LmlkKSB8fCBjb3N0IDwgdmlzaXRlZC5nZXQobmV4dC5pZCkhLmNvc3Qpe1xuICAgICAgICB2aXNpdGVkLnNldChuZXh0LmlkLCB7Y29zdCwgcGF0aDogWy4uLnZpc2l0ZWQuZ2V0KGN1cnJlbnQuaWQpIS5wYXRoLCBuZXh0XX0pXG4gICAgICAgIHF1ZXVlLnB1c2gobmV4dClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgcGF0aCA9IHZpc2l0ZWQuZ2V0KGVuZFBvaW50LmlkKVxuICBpZiAoIXBhdGgpIHRocm93IG5ldyBFcnJvcihgTm8gcGF0aCBmb3VuZCBmcm9tICR7c3RhcnRQb2ludC5pZH0gdG8gJHtlbmRQb2ludC5pZH1gKVxuXG4gIENvc3RNYXRyaXguc2V0KHBhaXJJZChzdGFydFBvaW50LmlkLCBlbmRQb2ludC5pZCksIHBhdGguY29zdClcblxuICByZXR1cm4gcGF0aFxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb3N0KHN0YXJ0OiBVVUlELCBlbmQ6IFVVSUQpOiBudW1iZXJ7XG4gIGxldCBpZCA9IHBhaXJJZChzdGFydCwgZW5kKVxuICBpZiAoIUNvc3RNYXRyaXguaGFzKGlkKSkgZmluZFBhdGgoc3RhcnQsIGVuZClcbiAgcmV0dXJuIENvc3RNYXRyaXguZ2V0KGlkKSFcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvc3ROKC4uLnBvaW50czogVVVJRFtdKTogbnVtYmVye1xuICBsZXQgY29zdCA9IDBcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICBjb3N0ICs9IGdldENvc3QocG9pbnRzW2ldISwgcG9pbnRzW2krMV0hKVxuICB9XG4gIHJldHVybiBjb3N0XG59XG5cblxuZXhwb3J0IGxldCBvcHREdXIgPSAwXG5cbmV4cG9ydCBmdW5jdGlvbiBvcHRpbWl6ZVNjaGVkdWxlKHJlcXVlc3RzOiBSZXF1ZXN0W10sIHNjaGVkdWxlOiBTY2hlZHVsZSk6U2NoZWR1bGUge1xuXG4gIGxldCBzdCA9IERhdGUubm93KClcblxuICBmb3IgKGxldCByZXEgb2YgcmVxdWVzdHMpe1xuXG4gICAgbGV0IHJlcXVlc3QgPSByZXEuaWRcbiAgICBsZXQgc2NoZWQgPSByYW5kQ2hvaWNlKHNjaGVkdWxlKVxuICAgIHNjaGVkLnN0ZXBzID0gc2NoZWQuc3RlcHMuY29uY2F0KFxuICAgICAgeyQ6XCJwaWNrdXBcIiwgdmFsOiB7IHJlcXVlc3QsIHBvczogcmVxLnN0YXJ0UG9pbnQsIGRlY2s6IE1hdGgucmFuZG9tKCkgPiAuNSA/IDEgOiAwfX0sXG4gICAgICB7JDpcImRlbGl2ZXJcIiwgdmFsOiB7IHJlcXVlc3Q6IHJlcS5pZCwgcG9zOiByZXEuZW5kUG9pbnQsIH19LFxuICAgIClcbiAgfVxuXG4gIGZvciAobGV0IGkgPSAwOyBpPCAxMDAwOyBpKyspe1xuICAgIHBlcm11dGUoc2NoZWR1bGUpXG4gIH1cblxuICBvcHREdXIgPSBEYXRlLm5vdygpIC0gc3QgXG4gIHJldHVybiBzY2hlZHVsZVxufVxuXG5cbmZ1bmN0aW9uIHJhbmRpbnQgKG46bnVtYmVyKXsgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpuKX1cblxuZnVuY3Rpb24gc3dhcDxUPiAoczpUW10sIGE6IG51bWJlciwgYjpudW1iZXIpe1xuICBsZXQgdD0gc1thXSFcbiAgc1thXSA9IHNbYl0hO1xuICBzW2JdID0gdFxufVxuXG5mdW5jdGlvbiBwZXJtdXRlIChzY2hlZHVsZTogU2NoZWR1bGUpe1xuICBsZXQgcmF0aW5nID0gcmF0ZVNjaGVkdWxlKHNjaGVkdWxlKVxuICBzY2hlZHVsZS5mb3JFYWNoKCh4LGkpPT57XG4gICAgbGV0IGEgPSAxICsgcmFuZGludCh4LnN0ZXBzLmxlbmd0aC0xKTtcbiAgICBsZXQgYiA9IDEgKyByYW5kaW50KHguc3RlcHMubGVuZ3RoLTEpO1xuICAgIHN3YXAoeC5zdGVwcywgYSxiKVxuICAgIGxldCBuZXdyYXRlID0gcmF0ZVNjaGVkdWxlKHNjaGVkdWxlKVxuICAgIGlmIChuZXdyYXRlIDw9IHJhdGluZykgc3dhcCh4LnN0ZXBzLCBhLCBiKVxuICAgIFxuICAgIGlmIChNYXRoLnJhbmRvbSgpID4gMC41KSB7XG4gICAgICBsZXQgYyA9IHguc3RlcHNbMSArIHJhbmRpbnQoeC5zdGVwcy5sZW5ndGgtMSldO1xuICAgICAgaWYgKGM/LiQgPT0gXCJwaWNrdXBcIil7XG4gICAgICAgIGMudmFsLmRlY2sgPSBjLnZhbC5kZWNrID09IDAgPyAxIDogMFxuICAgICAgICBsZXQgbmV3cmF0ZSA9IHJhdGVTY2hlZHVsZShzY2hlZHVsZSlcbiAgICAgICAgaWYgKG5ld3JhdGUgPD0gcmF0aW5nKSBjLnZhbC5kZWNrID0gYy52YWwuZGVjayA9PSAwID8gMSA6IDBcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gIH0pXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gcmF0ZVNjaGVkdWxlKHNjaGVkdWxlOiBTY2hlZHVsZSkgOiBudW1iZXIge1xuICBsZXQgcmVzID0gMFxuICBsZXQgZGlzdCA9IDBcblxuICBsZXQgZGVja3M6IFtVVUlEW10sIFVVSURbXV1cbiAgZm9yIChsZXQgaXRlbSBvZiBzY2hlZHVsZSl7XG5cbiAgICBkZWNrcyA9ICBbW10sIFtdXVxuXG4gICAgZnVuY3Rpb24gdW5sb2FkKHJlcWlkOiBVVUlELCBkZWNrOiAwIHwgMSApe1xuICAgICAgbGV0IGlkeCA9IGRlY2tzW2RlY2tdLmluZGV4T2YocmVxaWQpXG4gICAgICBpZiAoaWR4ID09IC0xKSByZXR1cm4gZmFsc2VcbiAgICAgIGxldCBhZnRlciA9IGRlY2tzW2RlY2tdLnNsaWNlKGlkeCsxKVxuICAgICAgZGVja3NbZGVja10gPSBkZWNrc1tkZWNrXS5zbGljZSgwLCBpZHgpLmNvbmNhdChhZnRlcilcbiAgICAgIHJlcyAtPSBVTkxPQURDT1NUXG4gICAgICByZXMgLT0gYWZ0ZXIubGVuZ3RoICogKFVOTE9BRENPU1QgKyBQSUNLVVBDT1NUKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cblxuICAgIGlmIChpdGVtLnN0ZXBzWzBdPy4kICE9IFwic3RhcnRcIikgcmV0dXJuIC0gSW5maW5pdHlcbiAgICBmb3IgKGxldCBzdGVwIG9mIGl0ZW0uc3RlcHMuc2xpY2UoMSkpe1xuICAgICAgaWYgKHN0ZXAuJCA9PSBcInBpY2t1cFwiKSB7XG4gICAgICAgIGRlY2tzW3N0ZXAudmFsLmRlY2tdLnB1c2goc3RlcC52YWwucmVxdWVzdClcbiAgICAgICAgaWYgKGRlY2tzW3N0ZXAudmFsLmRlY2tdLmxlbmd0aCA+IERFQ0tDQVBBQ0lUWSkgcmV0dXJuIC0gSW5maW5pdHlcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHN0ZXAuJCA9PSBcImRlbGl2ZXJcIikge1xuXG4gICAgICAgIGxldCByZXFpZCA9IHN0ZXAudmFsLnJlcXVlc3RcbiAgICAgICAgbGV0IHJlcSA9IHJlcXVlc3RzLmZpbmQoeD0+cmVxaWQgPT0geC5pZClcbiAgICAgICAgaWYgKCFyZXEpIHRocm93IG5ldyBFcnJvcihcIm5vdCBmb3VuZCByZXF1ZXN0OiBcIitzdGVwLnZhbC5yZXF1ZXN0KVxuICAgICAgICBpZiAoIWRlY2tzLmZsYXQoKS5pbmNsdWRlcyhyZXFpZCkpIHJldHVybiAtIEluZmluaXR5XG4gICAgICAgIGlmICghdW5sb2FkKHJlcWlkLCAwKSAmJiAhdW5sb2FkKHJlcWlkLCAxKSkgcmV0dXJuIC0gSW5maW5pdHlcbiAgICAgICAgcmVzICs9IHJlcS52YWx1ZVxuXG4gICAgICB9XG4gICAgICBlbHNlIHJldHVybiAtIEluZmluaXR5XG4gICAgfTtcbiAgICBcbiAgICBkaXN0ICs9IGdldENvc3ROKC4uLml0ZW0uc3RlcHMubWFwKHg9PngudmFsLnBvcykpXG4gIH1cblxuICByZXR1cm4gcmVzIC0gZGlzdCAqIERJU1RfQ09TVFxufVxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgVVVJRCB9IGZyb20gXCIuLi9tb2R1bGVcIjtcbmltcG9ydCB7IGZpbmRQYXRoLCBwYWlySWQgfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgIHR5cGUgUm9hZE1hcCB9IGZyb20gXCIuLi9yYW5kb21NYXBcIjtcbmltcG9ydCB7IGRpdiwgcCwgc3R5bGUgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBnZXRQb2ludCwgaGlnaHRMaWdodHMsIHJlcXVlc3RzLCB0eXBlIEhpZ2hMaWdodCB9IGZyb20gXCIuL21haW5cIjtcblxuXG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImNpcmNsZVwiLCB4OiBudW1iZXIsIHk6IG51bWJlcikgOiB7ZWw6IFNWR0NpcmNsZUVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5mdW5jdGlvbiBta1N2ZyAodGFnOiBcImxpbmVcIiwgeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikgOiB7ZWw6IFNWR0xpbmVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJ0ZXh0XCIsIHg6IG51bWJlciwgeTogbnVtYmVyLCBzOiBzdHJpbmcpIDoge2VsOiBTVkdUZXh0RWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiB8IFwibGluZVwiIHwgXCJ0ZXh0XCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyPzogbnVtYmVyIHwgc3RyaW5nLCB5Mj86IG51bWJlcil7XG4gIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIHRhZylcbiAgaWYgKHRhZyA9PSBcImNpcmNsZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImN5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiclwiLCBcIjAuMDFcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIFwiZ3JheVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodGFnID09IFwibGluZVwiKXtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDJcIiwgeDIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwieTJcIiwgeTIhLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIFwiZ3JheVwiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDA1XCIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVsLFxuICAgICAgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+e1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcInRleHRcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieFwiLCB4MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInlcIiwgeTEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuXG4gICAgXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICBlbC50ZXh0Q29udGVudCA9IFN0cmluZyh4MilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJmb250LXNpemVcIiwgXCIwLjAzXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4ge1xuICAgICAgZWwsXG4gICAgICBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdGFnXCIpXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gbWFwVmlldyAocm9hZG1hcDogUm9hZE1hcCApIDogSFRNTEVsZW1lbnQge1xuXG5cbiAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKVxuXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCI4MCVcIilcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCI4MCVcIilcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiMCAwIDEgMVwiKVxuXG4gIGxldCBlbGVtZW50cyA9IG5ldyBNYXA8YW55LCBTVkdFbGVtZW50PigpXG4gIGxldCBzb3VyY2VzID0gbmV3IE1hcDxTVkdFbGVtZW50LCBhbnk+KClcbiAgXG4gIGZvciAobGV0IFtpZDEsIHJvYWRzXSBvZiByb2FkbWFwLnJvYWRzKXtcbiAgICBmb3IgKGxldCBbaWQyLCBkaXN0XSBvZiByb2Fkcyl7XG4gICAgICBsZXQgYSA9IGdldFBvaW50KGlkMSkhXG4gICAgICBsZXQgYiA9IGdldFBvaW50KGlkMikhXG4gICAgICBsZXQgbGluZSA9IG1rU3ZnKFwibGluZVwiLCBhLmxvY2F0aW9uLngsIGEubG9jYXRpb24ueSwgYi5sb2NhdGlvbi54LCBiLmxvY2F0aW9uLnkpLmVsXG4gICAgICBsZXQgaWQgPSBwYWlySWQoYS5pZCwgYi5pZClcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgcG9pbnQgb2Ygcm9hZG1hcC5wb2ludHMudmFsdWVzKCkpe1xuXG4gICAgbGV0IGNpcmNsZSA9IG1rU3ZnKFwiY2lyY2xlXCIsIHBvaW50LmxvY2F0aW9uLngsIHBvaW50LmxvY2F0aW9uLnkpLmVsXG4gICAgZWxlbWVudHMuc2V0KHBvaW50LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCBwb2ludClcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNpcmNsZSlcbiAgfVxuXG4gIGxldCBoaW50czoge3JlbW92ZTooKT0+dm9pZH1bXSA9IFtdXG5cbiAgaGlnaHRMaWdodHMub251cGRhdGUoKG5ILG8pPT57XG4gICAgaGludHMuZm9yRWFjaChlbD0+ZWwucmVtb3ZlKCkpXG4gICAgZm9yIChsZXQgbiBvZiBuSCl7XG4gICAgICBsZXQgbGFzdCA6IFVVSUQgfCBudWxsID0gbnVsbFxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGxldCBuZXh0ID0gcC5sb2NhdGlvblxuICAgICAgICBpZiAobGFzdCl7XG4gICAgICAgICAgbGV0IHBhdGggPSBmaW5kUGF0aChsYXN0LCBuZXh0KS5wYXRoLm1hcChsPT5sLmxvY2F0aW9uKVxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGggLSAxOyBpKyspe1xuICAgICAgICAgICAgbGV0IGxpbmUgPSBta1N2ZyhcImxpbmVcIiwgcGF0aFtpXSEueCwgcGF0aFtpXSEueSwgcGF0aFtpKzFdIS54LCBwYXRoW2krMV0hLnkpXG4gICAgICAgICAgICBsaW5lLnNldENvbG9yKG4uY29sb3IgPz8gXCIjZmZjOTg4XCIpXG4gICAgICAgICAgICBsaW5lLmVsLnNldEF0dHJpYnV0ZShcInN0cm9rZS13aWR0aFwiLCBcIjAuMDFcIilcbiAgICAgICAgICAgIGxpbmUuZWwuc2V0QXR0cmlidXRlKFwiei1pbmRleFwiLCBcIjEwMFwiKVxuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lLmVsKVxuICAgICAgICAgICAgaGludHMucHVzaCh7cmVtb3ZlOiAoKT0+bGluZS5lbC5yZW1vdmUoKX0pXG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICAgbGFzdCA9IG5leHRcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGxldCBwb3MgPSBnZXRQb2ludChwLmxvY2F0aW9uKS5sb2NhdGlvblxuICAgICAgICBpZiAocC5sb2dvKSB7XG4gICAgICAgICAgbGV0IGVsID0gbWtTdmcoXCJ0ZXh0XCIsIHBvcy54LCBwb3MueSwgcC5sb2dvKVxuICAgICAgICAgIGVsLmVsLnNldEF0dHJpYnV0ZShcInotaW5kZXhcIiwgXCIxMDAwXCIpXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChlbC5lbClcbiAgICAgICAgICBoaW50cy5wdXNoKGVsLmVsKVxuXG4gICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgfVxuICB9KVxuXG4gIGxldCBkdiA9IGRpdihzdHlsZSh7d2lkdGg6XCIxMDAlXCIsIGRpc3BsYXk6XCJmbGV4XCIsIGp1c3RpZnlDb250ZW50OlwiY2VudGVyXCIsIHBhZGRpbmc6IFwiMWVtXCJ9KSlcbiAgZHYuYXBwZW5kKGVsZW1lbnQpXG4gIHJldHVybiBkdlxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cblxuZXhwb3J0IGNsYXNzIExvY2FsU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IHtcbiAgY29uc3RydWN0b3IocHVibGljIGtleTogc3RyaW5nLCBwdWJsaWMgc2NoZW1hOiBTY2hlbWE8VD4sIHB1YmxpYyBkZWZhdWx0VmFsdWU6IFQpe31cblxuICBnZXQoKTpUIHtcbiAgICBsZXQgcmF3ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5rZXkpXG4gICAgdHJ5e1xuICAgICAgcmV0dXJuIHZhbGlkYXRlKHRoaXMuc2NoZW1hLCBKU09OLnBhcnNlKHJhdyEpKVxuICAgIH1jYXRjaChlKXtcbiAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRWYWx1ZVxuICAgIH1cbiAgfVxuICBzZXQodmFsdWU6IFQpe1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMua2V5LCBKU09OLnN0cmluZ2lmeSh2YWxpZGF0ZSh0aGlzLnNjaGVtYSwgdmFsdWUpKSlcbiAgfVxufVxuIiwKICAgICJpbXBvcnQgeyBhcnJheSwgYm9vbGVhbiwgY29uc3RhbnQsIG51bWJlciwgb2JqZWN0LCBzdHJpbmcsIHRhZ2dlZCwgdW5pb24sIHR5cGUgSW5mZXIsIHR5cGUgU2NoZW1hIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5cblxuZXhwb3J0IHR5cGUgVVVJRCA9IGB1JHtzdHJpbmd9LSR7c3RyaW5nfWBcbmV4cG9ydCBjb25zdCBVVUlEIDogU2NoZW1hPFVVSUQ+ID0gc3RyaW5nXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbVVVSUQoKSB7cmV0dXJuIFwidVwiICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMiwxMCkgKyBcIi1cIiArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIsMTApIGFzIFVVSUR9XG5cbmV4cG9ydCBjb25zdCBMb2NhdGlvbiA9IG9iamVjdCh7XG4gIGlkOiBVVUlELFxuICByZXA6IHN0cmluZyxcbiAgbG9jYXRpb246IG9iamVjdCh7IHg6IG51bWJlciwgeTogbnVtYmVyIH0pXG59KVxuXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0ID0gb2JqZWN0KHtcbiAgaWQ6IFVVSUQsXG4gIHN0YXJ0UG9pbnQ6IFVVSUQsXG4gIGVuZFBvaW50OiBVVUlELFxuICB2YWx1ZTogbnVtYmVyLFxuICBkZWFkbGluZTogbnVtYmVyLFxufSlcblxuZXhwb3J0IGNvbnN0IFRyYW5zcG9ydGVyID0gb2JqZWN0KHsgaWQ6IFVVSUQsIHBvc2l0aW9uOiBVVUlELCB9KVxuXG5leHBvcnQgY29uc3QgU2NoZWR1bGVTdGVwID0gdGFnZ2VkKHtcbiAgcGlja3VwOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogVVVJRCwgZGVjazogdW5pb24oY29uc3RhbnQoMCksIGNvbnN0YW50KDEpKX0pLFxuICBkZWxpdmVyOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogVVVJRH0pLFxuICBzdGFydDogb2JqZWN0KHtwb3M6VVVJRH0pXG59KVxuZXhwb3J0IGNvbnN0IFNjaGVkdWxlSXRlbSA9IG9iamVjdCh7XG4gIHRyYW5zcG9ydGVyOiBVVUlELFxuICBzdGVwczogYXJyYXkoU2NoZWR1bGVTdGVwKSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGUgPSBhcnJheShTY2hlZHVsZUl0ZW0pXG5cbmV4cG9ydCBjb25zdCBNb2R1bGUgPSBvYmplY3Qoe1xuXG4gIHJlcXVlc3RzOiBhcnJheShSZXF1ZXN0KSxcbiAgdHJhbnNwb3J0ZXJzOiBhcnJheShUcmFuc3BvcnRlciksXG4gIHNjaGVkdWxlOiBTY2hlZHVsZSxcblxufSlcblxuZXhwb3J0IHR5cGUgTG9jYXRpb24gPSBJbmZlcjx0eXBlb2YgTG9jYXRpb24+XG5leHBvcnQgdHlwZSBSZXF1ZXN0ID0gSW5mZXI8dHlwZW9mIFJlcXVlc3Q+XG5leHBvcnQgdHlwZSBUcmFuc3BvcnRlciA9IEluZmVyPHR5cGVvZiBUcmFuc3BvcnRlcj5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlU3RlcCA9IEluZmVyPHR5cGVvZiBTY2hlZHVsZVN0ZXA+XG5leHBvcnQgdHlwZSBTY2hlZHVsZUl0ZW0gPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVJdGVtPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGUgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGU+XG5cbiIsCiAgICAiaW1wb3J0IHR5cGUgeyBJbmZlciB9IGZyb20gXCIuL3NjaGVtYVwiO1xuaW1wb3J0IHsgTG9jYXRpb24sIHJhbmRvbVVVSUQsIFVVSUQgfSBmcm9tIFwiLi9tb2R1bGVcIjtcblxuXG5cblxuXG5cblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tTWFwICggc2VlZDogbnVtYmVyID0gMil7XG5cbiAgZnVuY3Rpb24gcmFuZG9tKCl7XG4gICAgbGV0IHggPSBNYXRoLnNpbihzZWVkKyspICogMTAwMDA7XG4gICAgcmV0dXJuIHggLSBNYXRoLmZsb29yKHgpO1xuICB9XG5cbiAgc2VlZCA9IHJhbmRvbSgpICogMTAwMDBcblxuICBsZXQgcG9pbnRzID0gbmV3IE1hcDxVVUlELCBMb2NhdGlvbj4oKVxuICBsZXQgcm9hZHMgPSBuZXcgTWFwPFVVSUQsIE1hcDxVVUlELCB7ZGlzdDogbnVtYmVyfT4+ICgpXG5cbiAgZnVuY3Rpb24gcHVyZURpc3RhbmNlIChhOiBMb2NhdGlvbiwgYjogTG9jYXRpb24pe1xuICAgIHJldHVybiBNYXRoLmh5cG90KGEubG9jYXRpb24ueCAtIGIubG9jYXRpb24ueCwgYS5sb2NhdGlvbi55IC0gYi5sb2NhdGlvbi55KVxuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKyl7XG5cblxuICAgIGxldCBpZCA9IHJhbmRvbVVVSUQoKVxuICAgIHBvaW50cy5zZXQoaWQsIHtcbiAgICAgIGlkLFxuICAgICAgcmVwOiBcIkRFIFwiICsgaS50b1N0cmluZygpLnBhZFN0YXJ0KDUsIFwiMFwiKSxcbiAgICAgIGxvY2F0aW9uOiB7eDogcmFuZG9tKCksIHk6IHJhbmRvbSgpfVxuICAgIH1cbiAgKX1cblxuXG4gIHBvaW50cy52YWx1ZXMoKS5mb3JFYWNoKHA9PntcbiAgICByb2Fkcy5zZXQocC5pZCwgbmV3IE1hcCgpKVxuICB9KVxuXG4gIGZvciAobGV0IHAgb2YgcG9pbnRzLnZhbHVlcygpKXtcblxuICAgIGxldCBuZWFyZXN0ID0gcG9pbnRzLnZhbHVlcygpLnRvQXJyYXkoKS5zb3J0KChhLGIpPT4gcHVyZURpc3RhbmNlKHAsYSkgLSBwdXJlRGlzdGFuY2UocCxiKSkuc2xpY2UoMSwxKzMpXG4gICAgZm9yIChsZXQgbiBvZiBuZWFyZXN0KXtcbiAgICAgIGxldCBkaXN0ID0gcHVyZURpc3RhbmNlKHAsbilcbiAgICAgIHJvYWRzLmdldChwLmlkKSEuc2V0KG4uaWQsIHtkaXN0fSlcbiAgICAgIHJvYWRzLmdldChuLmlkKSEuc2V0KHAuaWQsIHtkaXN0fSlcbiAgICB9XG4gIH1cblxuXG4gIHJldHVybiB7XG4gICAgcG9pbnRzLFxuICAgIHJvYWRzLFxuICB9XG59XG5cblxuZXhwb3J0IHR5cGUgUm9hZE1hcCA9IHR5cGVvZiByYW5kb21NYXAgZXh0ZW5kcyAoKSA9PiBpbmZlciBUID8gVCA6IG5ldmVyXG4iLAogICAgImltcG9ydCB7IFJlcXVlc3QsIFVVSUQsIHR5cGUgU2NoZWR1bGUgfSBmcm9tIFwiLi4vbW9kdWxlXCI7XG5pbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgdHlwZSB7IFJvYWRNYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyBib3JkZXIsIGNvbG9yLCBoMywgaHRtbCwgcGFkZGluZywgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdHIsIHR5cGUgSFRNTEdlbmVyYXRvciB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzLCByZXF1ZXN0cywgcm9hZE1hcCwgc2NoZWR1bGUgfSBmcm9tIFwiLi9tYWluXCI7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGxvY1N0cmluZyAoaWQ6IFVVSUQpIHtcbiAgcmV0dXJuIGDwn5ONICR7cm9hZE1hcC5wb2ludHMuZ2V0KGlkKT8ucmVwPz9cIlVOS1wifWBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zcG9yU3RyaW5nIChpZDogVVVJRCkge1xuICByZXR1cm4gYPCfmpsgJHtzY2hlZHVsZS5nZXQoKS5maW5kSW5kZXgocz0+cy50cmFuc3BvcnRlciA9PSBpZCkudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpfWBcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0U3RyaW5nIChpZDogVVVJRCkge1xuICBsZXQgcmVxID0gcmVxdWVzdHMuZmluZChyPT5yLmlkID09IGlkKVxuICBpZiAoIXJlcSkgcmV0dXJuIFwiVU5LXCJcbiAgcmV0dXJuIGDwn5OmICR7cmVxdWVzdHMuZmluZEluZGV4KHg9PnguaWQgPT0gaWQpLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKX1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0VmlldyAocmVxdWVzdHM6IFJlcXVlc3RbXSwgc2NoZWR1bGU6IFNjaGVkdWxlKTogSFRNTEVsZW1lbnR7XG5cbiAgbGV0IGNlbGwgPSAoKC4uLngpID0+IHRkKHN0eWxlKHtcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICBjdXJzb3I6XCJwb2ludGVyXCIsXG4gIH0pLCAuLi54KSkgYXMgSFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gXG5cbiAgcmV0dXJuIHRhYmxlKFxuICAgIHN0eWxlKHsgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIiwgfSksXG5cbiAgICB0cihbXCJyZXF1ZXN0XCIsIFwic3RhcnRcIiwgXCJlbmRcIiwgXCJkaXN0YW56XCIsIFwicHJlaXNcIiwgXCJmcmlzdFwiIF0ubWFwKGg9PiBjZWxsKGgpLCApLCBzdHlsZSh7Zm9udFdlaWdodDogXCJib2xkXCJ9KSksXG4gICAgcmVxdWVzdHMubWFwKChyLCBpKT0+e1xuXG4gICAgICBsZXQgcGF0aCA9IGZpbmRQYXRoKHIuc3RhcnRQb2ludCwgci5lbmRQb2ludClcbiAgICAgIGxldCBkYXRlID0gbmV3IERhdGUoci5kZWFkbGluZSlcbiAgICAgIGxldCByb3c9IHRyKFxuICAgICAgICBjZWxsKHJlcXVlc3RTdHJpbmcoci5pZCkpLFxuICAgICAgICBjZWxsKGxvY1N0cmluZyhyLnN0YXJ0UG9pbnQpKSxcbiAgICAgICAgY2VsbChsb2NTdHJpbmcoci5lbmRQb2ludCkpLFxuICAgICAgICBjZWxsKHNwYW4ocGF0aC5jb3N0LnRvRml4ZWQoMiksIHN0eWxlKHtmbG9hdDogXCJyaWdodFwifSkpKSxcbiAgICAgICAgY2VsbChzcGFuKHIudmFsdWUudG9TdHJpbmcoKSArIFwi4oKsXCIsIHN0eWxlKHtmbG9hdDogXCJyaWdodFwifSkpKSxcbiAgICAgICAgY2VsbChkYXRlLmdldERhdGUoKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKSArIFwiLlwiICsgKGRhdGUuZ2V0TW9udGgoKSsxKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKSArIFwiLlwiICsgZGF0ZS5nZXRGdWxsWWVhcigpKSxcbiAgICAgIClcbiAgICAgIHJvdy5vbm1vdXNlZW50ZXIgPSAoKT0+e1xuICAgICAgICByb3cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3IuZ3JheSxcbiAgICAgICAgaGlnaHRMaWdodHMuc2V0KFt7IHBvaW50czogW1xuICAgICAgICAgIHsgbG9jYXRpb246IHIuc3RhcnRQb2ludCwgbG9nbzogXCLwn5OmXCIgfSxcbiAgICAgICAgICB7IGxvY2F0aW9uOiByLmVuZFBvaW50LCBsb2dvOiBcIvCfj6BcIiB9XG4gICAgICAgIF19XSlcblxuICAgICAgfVxuICAgICAgcm93Lm9ubW91c2VsZWF2ZSA9ICgpPT57XG4gICAgICAgIHJvdy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIlwiXG4gICAgICB9XG4gICAgICByZXR1cm4gcm93XG4gICAgfSlcblxuICApXG5cbn0iLAogICAgImltcG9ydCB0eXBlIHsgU2NoZWR1bGVJdGVtLCBVVUlEIH0gZnJvbSBcIi4uL21vZHVsZVwiO1xuaW1wb3J0IHsgZ2V0Q29zdCwgb3B0RHVyLCBvcHRpbWl6ZVNjaGVkdWxlLCByYXRlU2NoZWR1bGUgfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBoMiwgaHRtbCwgcCwgcGFkZGluZywgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdHIsIHdpZHRoIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMsIHJlcXVlc3RzLCByb2FkTWFwLCBzY2hlZHVsZSB9IGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IGxvY1N0cmluZywgdHJhbnNwb3JTdHJpbmcgfSBmcm9tIFwiLi9yZXF1ZXN0Vmlld1wiO1xuXG5cbmZ1bmN0aW9uIHN0ZXBMb2dvIChzdGVwOiBTY2hlZHVsZUl0ZW1bJ3N0ZXBzJ11bbnVtYmVyXSl7XG4gIGlmIChzdGVwLiQgPT0gXCJzdGFydFwiKSByZXR1cm4gJ/CfmpsnXG4gIGlmIChzdGVwLiQgPT0gXCJwaWNrdXBcIikgcmV0dXJuICfwn5OmJ1xuICBpZiAoc3RlcC4kID09IFwiZGVsaXZlclwiKSByZXR1cm4gJ/Cfj6AnXG4gIHRocm93IG5ldyBFcnJvcihcInVuZXhwZWN0ZWQgdGFnOlwiLCBzdGVwKVxufVxuXG5leHBvcnQgY29uc3Qgc2NoZWR1bGVWaWV3ID0gKCkgPT4ge1xuXG4gIGxldCBjZWxsID0gKCguLi54KSA9PiB0ZChzdHlsZSh7XG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1ncmF5KVwiLFxuICAgIG1hcmdpbjogXCIwXCIsXG4gICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgIHdoaXRlU3BhY2U6IFwibm93cmFwXCIsXG4gIH0pLCAuLi54KSkgYXMgdHlwZW9mIHRkO1xuXG4gIGxldCB0YWJ2aWV3ID0gZGl2KClcbiAgbGV0IHN0ZXB2aWV3ID0gZGl2KClcbiAgbGV0IHN0ZXBFbHMgPSBbXSBhcyBIVE1MU3BhbkVsZW1lbnRbXVtdXG4gIGxldCByb3dFbHMgPSBbXSBhcyBIVE1MVGFibGVSb3dFbGVtZW50W11cblxuICBzY2hlZHVsZS5vbnVwZGF0ZShzY2hlZCA9PiB7XG5cbiAgICBsZXQgY3Vyc29yID0ge3JvdzogMSwgY29sOiAxfVxuXG4gICAgZnVuY3Rpb24gdmlldyhyb3c6IG51bWJlciwgbjpudW1iZXIpe1xuXG4gICAgICBjb25zb2xlLmxvZyhcIlZJRVdcIilcbiAgICAgIGxldCBzdGVwcyA9IHNjaGVkW3Jvd10hLnN0ZXBzXG4gICAgICBsZXQgc3RlcCA9IHN0ZXBzW25dXG4gICAgICBpZiAoIXN0ZXApIHJldHVyblxuXG4gICAgICBsZXQgcmVxdWVzdCA9IHN0ZXAuJCA9PSBcInN0YXJ0XCIgPyB1bmRlZmluZWQgOiBzdGVwLnZhbC5yZXF1ZXN0XG5cbiAgICAgIHN0ZXBFbHMuZm9yRWFjaCgocm93RWxzLCByb3duKT0+e1xuICAgICAgICByb3dFbHMuZm9yRWFjaCgoZWwsaSk9PntcbiAgICAgICAgICBsZXQgc3RlcCA9IHNjaGVkW3Jvd25dIS5zdGVwc1tpXVxuICAgICAgICAgIGlmICghc3RlcCkgcmV0dXJuXG4gICAgICAgICAgbGV0IGJhY2tncm91bmQgPSAnJ1xuICAgICAgICAgIGlmIChpID09IG4gJiYgcm93ID09IHJvd24pIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQgPSBjb2xvci5ncmVlbiAgXG4gICAgICAgICAgICB2aWV3U3RlcChyb3csIG4sIHN0ZXB2aWV3KVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzdGVwLiQgIT0gXCJzdGFydFwiICYmIHN0ZXAudmFsLnJlcXVlc3QgPT0gcmVxdWVzdCkgYmFja2dyb3VuZCA9IGNvbG9yLmdyYXlcbiAgICAgICAgICBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gYmFja2dyb3VuZFxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgbGV0IGxvZ28gPSBzdGVwTG9nbyhzdGVwKVxuXG4gICAgICBoaWdodExpZ2h0cy5zZXQoW1xuICAgICAgICB7IHBvaW50czogc3RlcHMuc2xpY2UobixuKzIpLm1hcCgocCxpKT0+KHtcImxvY2F0aW9uXCI6IHAudmFsLnBvc30pKSwgY29sb3I6IFwiI2ZmYzk4OFwiIH0sXG4gICAgICAgIHsgcG9pbnRzOiBbe2xvY2F0aW9uOnN0ZXAudmFsLnBvcywgbG9nb31dIH1cbiAgICAgIF0pXG4gICAgfVxuXG5cbiAgICB0YWJ2aWV3LnJlcGxhY2VDaGlsZHJlbih0YWJsZShcbiAgICAgIFtcInRyYW5zcG9ydGVyXCIsIFwic3RlcHNcIl0ubWFwKGg9PiBjZWxsKGgpLCApLCBzdHlsZSh7Zm9udFdlaWdodDogXCJib2xkXCJ9KSxcbiAgICAgIHNjaGVkLm1hcCgocywgcm93bik9PntcblxuICAgICAgICBsZXQgYWxsUG9pbnRzID0gcy5zdGVwcy5tYXAoc3RlcD0+ICh7IGxvY2F0aW9uOiBzdGVwLnZhbC5wb3MsIGxvZ286IHN0ZXBMb2dvKHN0ZXApIH0pKVxuICAgICAgICBsZXQgdHJhbnNwb3J0ID0gc3Bhbih0cmFuc3BvclN0cmluZyhzLnRyYW5zcG9ydGVyKSlcbiAgICAgICAgdHJhbnNwb3J0Lm9ubW91c2VlbnRlciA9ICgpPT5oaWdodExpZ2h0cy5zZXQoW3twb2ludHM6IGFsbFBvaW50cywgY29sb3I6IFwiI2ZmYzk4OFwiLH1dKVxuXG4gICAgICAgIHN0ZXBFbHMucHVzaCggcy5zdGVwcy5tYXAoKHN0ZXAsaSk9PntcbiAgICAgICAgICBsZXQgbG9nbyA9IHN0ZXBMb2dvKHN0ZXApXG4gICAgICAgICAgbGV0IHJlcyA9IHNwYW4obG9nbywgc3R5bGUoe3BhZGRpbmc6IFwiLjNlbSAuM2VtXCIsfSkpXG5cbiAgICAgICAgICByZXMub25jbGljayA9ICgpPT57XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNMSUNLXCIsIHJvd24sIGkpXG4gICAgICAgICAgICBjdXJzb3IgPSB7cm93OiByb3duLCBjb2w6IGl9XG4gICAgICAgICAgICB2aWV3KHJvd24sIGkpXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXNcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbGV0IHJvdz0gdHIoY2VsbCh0cmFuc3BvcnQpLCBjZWxsKHN0ZXBFbHNbcm93bl0hKSlcbiAgICAgICAgcm93RWxzLnB1c2gocm93KVxuICAgICAgICByZXR1cm4gcm93XG4gICAgICB9KSxcbiAgICAgIHN0eWxlKHsgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIiwgfSksXG4gICAgKSlcblxuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZT0+e1xuICAgICAgaWYgKGN1cnNvci5jb2wgPT0gLTEpIHJldHVyblxuICAgICAgaWYgKGUua2V5ID09IFwiQXJyb3dMZWZ0XCIpIGN1cnNvci5jb2wgLT0gMVxuICAgICAgZWxzZSBpZiAoZS5rZXkgPT0gXCJBcnJvd1JpZ2h0XCIpIGN1cnNvci5jb2wgKz0gMVxuICAgICAgZWxzZSBpZiAoZS5rZXkgPT0gXCJBcnJvd1VwXCIpIGN1cnNvci5yb3cgLT0gMVxuICAgICAgZWxzZSBpZiAoZS5rZXkgPT0gXCJBcnJvd0Rvd25cIikgY3Vyc29yLnJvdyArPSAxXG4gICAgICBlbHNlIGlmIChlLmtleSA9PSBcIkVzY2FwZVwiKSBjdXJzb3IgPSB7cm93OiAtMSwgY29sOiAtMX1cbiAgICAgIGVsc2UgcmV0dXJuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGN1cnNvci5yb3cgPSBNYXRoLm1heCgwLCBNYXRoLm1pbiggc2NoZWQubGVuZ3RoLTEsIGN1cnNvci5yb3cpKVxuICAgICAgY3Vyc29yLmNvbCA9IE1hdGgubWF4KDAsIE1hdGgubWluKCBzY2hlZFtjdXJzb3Iucm93XSEuc3RlcHMubGVuZ3RoLTEsIGN1cnNvci5jb2wpKVxuICAgICAgdmlldyhjdXJzb3Iucm93LCBjdXJzb3IuY29sKVxuICAgIH0pXG5cbiAgICB2aWV3KGN1cnNvci5yb3csIGN1cnNvci5jb2wpXG5cblxuICB9KVxuXG4gIGxldCB2YWx1ZSA9IHNwYW4oKVxuICBzY2hlZHVsZS5vbnVwZGF0ZShzY2g9PnZhbHVlLnRleHRDb250ZW50ID0gcmF0ZVNjaGVkdWxlKHNjaCkudG9GaXhlZCgyKSlcblxuXG4gIGxldCBzY2hlZHVsZUVsID0gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIHdpZHRoOiBcImNhbGMoMTAwJSAtIDJlbSlcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBvdmVyZmxvdzogXCJhdXRvXCIsXG4gICAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgICBwYWRkaW5nOiBcIi41ZW1cIixcbiAgICB9KSxcbiAgICB0YWJ2aWV3LFxuICAgIHAoXCJWYWx1ZTogXCIsIHZhbHVlKSxcbiAgICBwKFwic2VhcmNoIHRpbWU6XCIsIG9wdER1ciksXG4gICAgc3RlcHZpZXcsXG4gIClcbiAgcmV0dXJuIHNjaGVkdWxlRWxcbn1cblxuXG5cbmZ1bmN0aW9uIHZpZXdTdGVwKHJvdzogbnVtYmVyLCBuOiBudW1iZXIsIHBhcmVudDogSFRNTEVsZW1lbnQpe1xuICBsZXQgc3RlcHMgPSBzY2hlZHVsZS5nZXQoKVtyb3ddXG4gIGlmICghc3RlcHMpIHJldHVyblxuICBsZXQgc3RlcCA9IHN0ZXBzLnN0ZXBzW25dXG4gIGlmICghc3RlcCkgcmV0dXJuXG5cbiAgbGV0IHRvdGFsRGlzdCA9IDBcbiAgbGV0IGRpc3QgPSAwXG5cbiAgbGV0IGRlY2tzID0gW1tdLFtdXSBhcyBbVVVJRFtdLCBVVUlEW11dXG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBzdGVwcy5zdGVwcy5sZW5ndGg7IGkrKyl7XG4gICAgaWYgKGkgPD0gbikge1xuICAgICAgbGV0IHN0ZXAgPSBzdGVwcy5zdGVwc1tpXSFcbiAgICAgIGlmIChzdGVwLiQgPT0gXCJwaWNrdXBcIikgZGVja3Nbc3RlcC52YWwuZGVja10ucHVzaChzdGVwLnZhbC5yZXF1ZXN0KVxuICAgICAgaWYgKHN0ZXAuJCA9PSBcImRlbGl2ZXJcIikgZGVja3MgPSBkZWNrcy5tYXAoZD0+ZC5maWx0ZXIocj0+ciAhPSBzdGVwLnZhbC5yZXF1ZXN0KSkgYXMgW1VVSURbXSwgVVVJRFtdXVxuICAgIH1cblxuICAgIHRvdGFsRGlzdCArPSBnZXRDb3N0KHN0ZXBzLnN0ZXBzW2ktMV0hLnZhbC5wb3MsIHN0ZXBzLnN0ZXBzW2ldIS52YWwucG9zKVxuICAgIGlmIChpID09IG4pIGRpc3QgPSB0b3RhbERpc3RcbiAgfVxuXG5cblxuICBsZXQgdmlzdWFsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJzdmdcIilcbiAgdmlzdWFsLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiMTAwJVwiKVxuXG4gIHZpc3VhbC5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIFwiLTAuMSAtMC4xIDEuMiAxLjJcIilcbiAgdmlzdWFsLnNldEF0dHJpYnV0ZShcInByZXNlcnZlQXNwZWN0UmF0aW9cIiwgXCJ4TWlkWU1pZCBtZWV0XCIpXG5cbiAgbGV0IHRyYW5zcG9ydGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJwb2x5Z29uXCIpXG4gIGxldCBwb2ludHMgPSBbIFsuMiwgMF0sIFsuMCwgLjJdLCBbLjAsIC40XSwgWy4yLCAuNF0sIFsuOCwgLjRdLCBbLjgsIC4zN10sIFsuMiwgLjM3XSwgWy4yLCAuMl0sIFsuOCwgLjJdLCBbLjgsIC4xN10sIFsuMiwgLjE3XSxdXG4gIHRyYW5zcG9ydGVyLnNldEF0dHJpYnV0ZShcInBvaW50c1wiLCBwb2ludHMubWFwKHA9PnAuam9pbihcIixcIikpLmpvaW4oXCIgXCIpKVxuICB0cmFuc3BvcnRlci5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmJsdWUpXG5cbiAgdmlzdWFsLmFwcGVuZENoaWxkKHRyYW5zcG9ydGVyKVxuXG5cbiAgY29uc29sZS5sb2coXCJkZWNrc1xcblwiKyBkZWNrcy5tYXAoZD0+ZC5tYXAocj0+XCI8PlwiKS5qb2luKFwiIFwiKSkuam9pbihcIlxcblwiKSlcblxuICBkZWNrcy5mb3JFYWNoKChkZWNrLCBpKT0+e1xuICAgIGRlY2suZm9yRWFjaCgocmVxLCBqKT0+e1xuICAgICAgbGV0IGNhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicmVjdFwiKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcInhcIiwgKDAuMjI1ICsgLjIgKiBqKS50b1N0cmluZygpKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcInlcIiwgKDAuMjUgLSAwLjIgICogaSkudG9TdHJpbmcoKSlcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIi4xNVwiKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjAuMTJcIilcbiAgICAgIGNhci5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmdyYXkpXG4gICAgICB2aXN1YWwuYXBwZW5kQ2hpbGQoY2FyKVxuXG4gICAgICBsZXQgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwidGV4dFwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ4XCIsICgwLjIyNSArIC4yICogaiArIDAuMDc1KS50b1N0cmluZygpKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJ5XCIsICgwLjI3IC0gMC4yICogaSArIDAuMDUpLnRvU3RyaW5nKCkpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImZvbnQtc2l6ZVwiLCBcIi4wNlwiKVxuICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmNvbG9yKVxuICAgICAgdGV4dC50ZXh0Q29udGVudCA9IGAke3JlcXVlc3RzLmZpbmRJbmRleChyPT5yLmlkID09IHJlcSkudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpfWBcbiAgICAgIHZpc3VhbC5hcHBlbmRDaGlsZCh0ZXh0KVxuICAgICAgXG4gICAgfSlcbiAgfSlcblxuICBmb3IgKGxldCB4IG9mIFswLjIsIDAuNl0pe1xuICAgIGxldCB0aXJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJjaXJjbGVcIilcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcImN4XCIsIHgudG9TdHJpbmcoKSlcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcImN5XCIsIFwiMC41XCIpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJyXCIsIFwiMC4wN1wiKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvci5ibHVlKVxuICAgIHZpc3VhbC5hcHBlbmRDaGlsZCh0aXJlKVxuICB9XG4gIGxldCByZXMgPSBkaXYoXG4gICAgaDIodHJhbnNwb3JTdHJpbmcoc3RlcHMudHJhbnNwb3J0ZXIpKSxcbiAgICBwKGBkaXN0YW5jZTogJHtkaXN0LnRvRml4ZWQoMil9IC8gJHt0b3RhbERpc3QudG9GaXhlZCgyKX1gKSxcbiAgICBzdHlsZSh7XG4gICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgICBtYXJnaW46IFwiMFwiLFxuICAgICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICAgIG1pbkhlaWdodDogXCIyZW1cIixcbiAgICB9KVxuICApXG5cbiAgcmVzLmFwcGVuZCh2aXN1YWwpXG4gIHBhcmVudC5yZXBsYWNlQ2hpbGRyZW4ocmVzKVxufVxuIiwKICAgICJpbXBvcnQgdHlwZSB7IEpzb25EYXRhIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5leHBvcnQgZnVuY3Rpb24gbWtXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ICh2YWx1ZTogVCkge1xuXG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cblxuICBsZXQgcmVzID0ge1xuICAgIGdldDogKCkgPT4gdmFsdWUsXG4gICAgc2V0OiAobmV3VmFsdWU6IFQpID0+IHtcblxuICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKSA9PT0gSlNPTi5zdHJpbmdpZnkodmFsdWUpKSByZXR1cm5cbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIobmV3VmFsdWUsIHZhbHVlKSlcbiAgICAgIHZhbHVlID0gbmV3VmFsdWVcbiAgICB9LFxuICAgIG9udXBkYXRlOiAobGlzdGVuZXI6IChuZXdWYWx1ZTogVCwgb2xkVmFsdWUgOlQpPT52b2lkKSA9PiB7XG4gICAgICBsaXN0ZW5lcih2YWx1ZSwgdmFsdWUpXG4gICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcilcbiAgICB9LFxuICAgIHVwZGF0ZTogKGNhbGxiYWNrOiAob2xkVmFsdWU6IFQpPT5UKSA9PiB7XG4gICAgICBsZXQgbmV3VmFsdWUgPSBjYWxsYmFjayh2YWx1ZSlcbiAgICAgIHJlcy5zZXQobmV3VmFsdWUpXG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gcmVzXG5cbn1cblxuXG4iLAogICAgImltcG9ydCB7IGhhc2ggfSBmcm9tIFwiLi4vaGFzaFwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBlcnJvcnBvcHVwLCBoMSwgaDIsIGgzLCBpbnB1dCwgbWFyZ2luLCBwLCBwYWRkaW5nLCBwb3B1cCwgcHJlLCBzcGFuLCBzdHlsZSwgdGFibGUsIHdpZHRoLCB0ZXh0YXJlYSwgYSwgYm9yZGVyLCBodG1sLCB0aCwgdHIsIHRkLCBib3JkZXJSYWRpdXMsIHBhbmVsTGlzdCwgZGlzcGxheSwgYmFja2dyb3VuZCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1hcFZpZXcgfSBmcm9tIFwiLi9tYXBWaWV3XCI7XG5pbXBvcnQgeyByYW5kb21NYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgeyByYW5kb21VVUlELCBSZXF1ZXN0LCBTY2hlZHVsZSwgVVVJRCB9IGZyb20gXCIuLi9tb2R1bGVcIjtcbmltcG9ydCB7IHJlcXVlc3RWaWV3IH0gZnJvbSBcIi4vcmVxdWVzdFZpZXdcIjtcbmltcG9ydCB7IHNjaGVkdWxlVmlldyB9IGZyb20gXCIuL3NjaGVkdWxlVmlld1wiO1xuaW1wb3J0IHsgbWtXcml0YWJsZSB9IGZyb20gXCIuLi93cml0ZWFibGVcIjtcbmltcG9ydCB7IG9wdGltaXplU2NoZWR1bGUgfSBmcm9tIFwiLi4vcGxhbm5lclwiO1xuXG5ib2R5LnN0eWxlLm1hcmdpbiA9IFwiMFwiXG5cbmxldCBoZWFkZXIgPSBoMShcInJvdXRlIHBsYW5uZXJcIiwgc3R5bGUoe2JhY2tncm91bmQ6IGNvbG9yLmJsdWUsIGNvbG9yOiBjb2xvci5iYWNrZ3JvdW5kLCBtYXJnaW46IFwiMFwiLCBwYWRkaW5nOiBcIi42ZW1cIn0pKVxuXG5sZXQgY29udGVudFNwYWNlID0gZGl2KHN0eWxlKHtcbiAgZGlzcGxheTpcImZsZXhcIixcbiAgZmxleERpcmVjdGlvbjpcInJvd1wiLFxuICB3aWR0aDogXCIxMDAlXCIsXG4gIGhlaWdodDogXCJjYWxjKDEwMCUgLSAyLjVlbSlcIixcbiAgbWluV2lkdGg6IFwiMFwiLFxufSkpXG5cbmxldCBwYWdlID0gZGl2KFxuICBzdHlsZSh7ZGlzcGxheTpcImZsZXhcIiwgZmxleERpcmVjdGlvbjpcImNvbHVtblwiLCBoZWlnaHQ6IFwiMTAwJVwifSksXG4gIGhlYWRlcixcbiAgY29udGVudFNwYWNlXG4pXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKHBhZ2UpXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRDaG9pY2U8VD4oYXJyOlRbXSk6VHtcbiAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqYXJyLmxlbmd0aCldIVxufVxuXG5leHBvcnQgbGV0IHJvYWRNYXAgPSByYW5kb21NYXAoMSlcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvaW50KGlkOiBVVUlEKXtcbiAgbGV0IHBvaW50ID0gcm9hZE1hcC5wb2ludHMuZ2V0KGlkKVxuICBpZiAoIXBvaW50KSB0aHJvdyBuZXcgRXJyb3IoYFBvaW50ICR7aWR9IG5vdCBmb3VuZGApXG4gIHJldHVybiBwb2ludFxufVxuXG5leHBvcnQgbGV0IHJlcXVlc3RzOiBSZXF1ZXN0W10gPSBBcnJheS5mcm9tKHtsZW5ndGg6MjB9LCAoXyxpKT0+KHtcbiAgaWQ6IHJhbmRvbVVVSUQoKSxcbiAgc3RhcnRQb2ludDogcmFuZENob2ljZShBcnJheS5mcm9tKHJvYWRNYXAucG9pbnRzLmtleXMoKSkpLFxuICBlbmRQb2ludDogcmFuZENob2ljZShBcnJheS5mcm9tKHJvYWRNYXAucG9pbnRzLmtleXMoKSkpLFxuICB2YWx1ZTogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwMCksXG4gIGRlYWRsaW5lOiBEYXRlLm5vdygpICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjMwKSAqIDI0ICogNjAgKiA2MCAqIDEwMDAsXG59KSlcblxuXG5leHBvcnQgbGV0IHNjaGVkdWxlID0gbWtXcml0YWJsZTxTY2hlZHVsZT4gKEFycmF5LmZyb20oe2xlbmd0aDogM30sIChfLGkpPT4oe1xuICB0cmFuc3BvcnRlcjogcmFuZG9tVVVJRCgpLFxuICBzdGVwczogW3skOlwic3RhcnRcIiwgdmFsOiB7cG9zOiByYW5kQ2hvaWNlKHJvYWRNYXAucG9pbnRzLnZhbHVlcygpLnRvQXJyYXkoKS5tYXAoeD0+eC5pZCkpfX1dXG59KSkpXG5cblxuc2NoZWR1bGUudXBkYXRlKHg9Pm9wdGltaXplU2NoZWR1bGUocmVxdWVzdHMseCkpXG5cbmV4cG9ydCB0eXBlIEhpZ2hMaWdodCA9IHtcbiAgcG9pbnRzOiB7XG4gICAgbG9jYXRpb246IFVVSUQsXG4gICAgbG9nbz8gOiBzdHJpbmcsXG4gIH1bXSxcbiAgY29sb3I/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGxldCBoaWdodExpZ2h0cyA9IG1rV3JpdGFibGUgPEhpZ2hMaWdodFtdPiggW10gKVxuXG5cbmZ1bmN0aW9uIG1rV2luZG93ICh0YWI6IG51bWJlciA9IDAgKSB7XG5cbiAgbGV0IHRhYkZpZWxkcyA9IFtcbiAgICBbJ21hcCcsIG1hcFZpZXcocm9hZE1hcCldLFxuICAgIFsncmVxdWVzdHMnLCByZXF1ZXN0VmlldyhyZXF1ZXN0cywgc2NoZWR1bGUuZ2V0KCkpXSxcbiAgICBbJ3NjaGVkdWxlJywgc2NoZWR1bGVWaWV3KCkgXSxcbiAgXSBhcyBjb25zdFxuXG4gIGNvbnN0IGVsID0gZGl2KHN0eWxlKHtcbiAgICBmbGV4OiBcIjEgMSAwXCIsXG4gICAgbWluV2lkdGg6IFwiMFwiLFxuICAgIGhlaWdodDogXCJjYWxjKDEwMHZoIC0gMWVtKVwiLFxuICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICBvdmVyZmxvdzogXCJoaWRkZW5cIixcbiAgfSkpXG5cbiAgZnVuY3Rpb24gb3BlblRhYih0YWI6IHR5cGVvZiB0YWJGaWVsZHNbbnVtYmVyXVswXSkge1xuICAgIGVsLnJlcGxhY2VDaGlsZHJlbihcbiAgICAgIHAodGFiRmllbGRzLm1hcCgoW24sZV0pPT5cbiAgICAgICAgc3BhbiggbixcbiAgICAgICAgICAoKT0+b3BlblRhYihuKSxcbiAgICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIi4zZW1cIixcbiAgICAgICAgICAgIG1hcmdpbjogXCIuM2VtXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIisgKG49PXRhYiA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSksXG4gICAgICAgICAgICBjb2xvcjogKG49PXRhYikgPyBjb2xvci5jb2xvciA6IGNvbG9yLmdyYXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKSksXG4gICAgICB0YWJGaWVsZHMuZmluZCgoW24sXSk9Pm49PXRhYikhWzFdXG4gICAgKVxuICB9XG5cblxuICBvcGVuVGFiKHRhYkZpZWxkc1t0YWJdIVswXSlcblxuICByZXR1cm4gZWxcbn1cblxuY29udGVudFNwYWNlLnJlcGxhY2VDaGlsZHJlbihta1dpbmRvdygyKSwgbWtXaW5kb3coKSlcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFFTyxJQUFNLE9BQU8sU0FBUztBQUU3QixJQUFNLGVBQWU7QUFBQSxFQUNuQixPQUFNO0FBQUEsSUFDSixPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFDQSxNQUFLO0FBQUEsSUFDSCxPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLE9BQW1CO0FBQUEsSUFDbkIsTUFBbUI7QUFBQSxJQUNuQixXQUFtQjtBQUFBLEVBQ3JCO0FBQ0Y7QUFFTyxJQUFNLFFBQVE7QUFBQSxFQUNuQixPQUFPO0FBQUEsRUFDUCxZQUFZO0FBQUEsRUFDWixNQUFNO0FBQUEsRUFDTixLQUFLO0FBQUEsRUFDTCxPQUFPO0FBQUEsRUFDUCxNQUFNO0FBQUEsRUFDTixXQUFXO0FBQ2I7QUFHQSxJQUFJLE9BQU8sU0FBUyxjQUFjLE9BQU87QUFDekMsS0FBSyxZQUFZO0FBQUE7QUFBQSxhQUVKLGFBQWEsS0FBSztBQUFBLGtCQUNiLGFBQWEsS0FBSztBQUFBLFdBQ3pCLGFBQWEsS0FBSztBQUFBLGFBQ2hCLGFBQWEsS0FBSztBQUFBLFlBQ25CLGFBQWEsS0FBSztBQUFBLFlBQ2xCLGFBQWEsS0FBSztBQUFBLGlCQUNiLGFBQWEsS0FBSztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBT3BCLGFBQWEsTUFBTTtBQUFBLG9CQUNkLGFBQWEsTUFB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LE9BQU8sSUFBRSxHQUFHO0FBQUEsRUFDbkMsVUFBVSxLQUFLLElBQUksSUFBSSxLQUFLLE1BQU0sS0FBSyxPQUFPLElBQUUsRUFBRSxJQUFJLEtBQUssS0FBSyxLQUFLO0FBQ3ZFLEVBQUU7QUFHSyxJQUFJLFdBQVcsV0FBc0IsTUFBTSxLQUFLLEVBQUMsUUFBUSxFQUFDLEdBQUcsQ0FBQyxHQUFFLE9BQUs7QUFBQSxFQUMxRSxhQUFhLFdBQVc7QUFBQSxFQUN4QixPQUFPLENBQUMsRUFBQyxHQUFFLFNBQVMsS0FBSyxFQUFDLEtBQUssV0FBVyxRQUFRLE9BQU8sT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLE9BQUcsRUFBRSxFQUFFLENBQUMsRUFBQyxFQUFDLENBQUM7QUFDN0YsRUFBRSxDQUFDO0FBR0gsU0FBUyxPQUFPLE9BQUcsaUJBQWlCLFVBQVMsQ0FBQyxDQUFDO0FBVXhDLElBQUksY0FBYyxXQUEwQixDQUFDLENBQUU7QUFHdEQsU0FBUyxRQUFTLENBQUMsTUFBYyxHQUFJO0FBQUEsRUFFbkMsSUFBSSxZQUFZO0FBQUEsSUFDZCxDQUFDLE9BQU8sUUFBUSxPQUFPLENBQUM7QUFBQSxJQUN4QixDQUFDLFlBQVksWUFBWSxVQUFVLFNBQVMsSUFBSSxDQUFDLENBQUM7QUFBQSxJQUNsRCxDQUFDLFlBQVksYUFBYSxDQUFFO0FBQUEsRUFDOUI7QUFBQSxFQUVBLE1BQU0sS0FBSyxJQUFJLE1BQU07QUFBQSxJQUNuQixNQUFNO0FBQUEsSUFDTixVQUFVO0FBQUEsSUFDVixRQUFRO0FBQUEsSUFDUixRQUFRLGVBQWEsTUFBTTtBQUFBLElBQzNCLFVBQVU7QUFBQSxFQUNaLENBQUMsQ0FBQztBQUFBLEVBRUYsU0FBUyxPQUFPLENBQUMsTUFBa0M7QUFBQSxJQUNqRCxHQUFHLGdCQUNELEVBQUUsVUFBVSxJQUFJLEVBQUUsR0FBRSxPQUNsQixLQUFNLEdBQ0osTUFBSSxRQUFRLENBQUMsR0FDYixNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixRQUFRLGdCQUFlLEtBQUcsT0FBTSxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ3BELE9BQVEsS0FBRyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQUEsSUFDeEMsQ0FBQyxDQUNILENBQ0YsQ0FBQyxHQUNELFVBQVUsS0FBSyxFQUFFLE9BQU0sS0FBRyxJQUFHLEVBQUcsRUFDbEM7QUFBQTtBQUFBLEVBSUYsUUFBUSxVQUFVLEtBQU0sRUFBRTtBQUFBLEVBRTFCLE9BQU87QUFBQTtBQUdULGFBQWEsZ0JBQWdCLFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQzsiLAogICJkZWJ1Z0lkIjogIkIzRDhGMUFENTMzOENBNTc2NDc1NkUyMTY0NzU2RTIxIiwKICAibmFtZXMiOiBbXQp9
