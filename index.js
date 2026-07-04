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
var unit_const = (value, unit) => ({ value, unit });
var unit_add = (a2, b) => ({ value: a2.value + b.value, unit: a2.unit });
var unit_iadd = (a2, b) => {
  a2.value += b.value;
};
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
var UNLOADCOST = unit_const(10, "eur");
var PICKUPCOST = unit_const(5, "eur");
var DIST_COST_EUR_PER_H = 20;
var DIST_COST = DIST_COST_EUR_PER_H / 3600;
function pairId(a2, b) {
  return a2 < b ? `${a2}-${b}` : `${b}-${a2}`;
}
var CostMatrix = new Map;
function findPath(start, end) {
  let visited = new Map;
  visited.set(start, { dist: unit_const(0, "seconds"), path: [start] });
  let queue = [start];
  while (queue.length > 0) {
    let current = queue.shift();
    if (current == end) {
      break;
    }
    for (let [next, dist] of roadMap.roads.get(current) ?? []) {
      let cost = unit_add(visited.get(current).dist, dist);
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
  let cost = unit_const(0, "seconds");
  for (let i = 0;i < points.length - 1; i++) {
    unit_iadd(cost, getCost(points[i], points[i + 1]));
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
            let req = free_requests.pop();
            schedItem.steps.push({ $: "pickup", val: { request: req.id, pos: randChoice(roadMap.points), deck: random() > 0.5 ? 1 : 0 } }, { $: "deliver", val: { request: req.id, pos: randChoice(roadMap.points) } });
            continue;
          }
        } else {
          if (schedItem.steps.length > 3) {
            let itemrating = rateSchedule([schedItem]);
            let req = randChoice(schedItem.steps.filter((x) => x.$ == "pickup")).val.request;
            let oldsteps = schedItem.steps;
            schedItem.steps = oldsteps.filter((x) => x.$ == "start" || x.val.request != req);
            let newrating = rateSchedule([schedItem]);
            if (newrating < itemrating)
              schedItem.steps = oldsteps;
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
  for (let i = 0;i < 1000; i++) {
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
  let res = unit_const(0, "eur");
  let dist = unit_const(0, "seconds");
  let decks;
  for (let item of schedule) {
    let unload = function(reqid, deck) {
      let idx = decks[deck].indexOf(reqid);
      if (idx == -1)
        return false;
      let after = decks[deck].slice(idx + 1);
      decks[deck] = decks[deck].slice(0, idx).concat(after);
      res.value -= UNLOADCOST.value;
      res.value -= after.length * (UNLOADCOST.value + PICKUPCOST.value);
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
        unit_iadd(res, req.value);
      } else
        return -Infinity;
    }
    unit_iadd(dist, getCostN(...item.steps.map((x) => x.val.pos)));
  }
  return res.value - dist.value * DIST_COST;
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
      let dist = unit_const(Math.hypot(loc.x - p3.x, loc.y - p3.y) * 10 * 60 * 60, "seconds");
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
  return `${(time.value / 60 / 60).toFixed(0)} h`;
}
function priceString(price) {
  return `${price.value.toFixed(2)} €`;
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
  let tabview = div();
  let stepview = div();
  let stepEls = [];
  let rowEls = [];
  schedule.onupdate((sched) => {
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
    });
    tabview.replaceChildren(table(["transporter", "steps"].map((h) => cell(h)), style({ fontWeight: "bold" }), sched.map((s, rown) => {
      let allPoints = s.steps.map((step) => ({ location: step.val.pos, logo: stepLogo(step) }));
      let transport = span(transporterString(s.transporter));
      transport.onmouseenter = () => hightLights.set([{ points: allPoints, color: "#ffc988" }]);
      stepEls.push(s.steps.map((step, i) => {
        let logo = stepLogo(step);
        let res = span(logo, style({ padding: ".3em .3em" }));
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
  let totalDist = unit_const(0, "seconds");
  let dist = unit_const(0, "seconds");
  let decks = [[], []];
  for (let i = 1;i < steps.steps.length; i++) {
    if (i <= n) {
      let step2 = steps.steps[i];
      if (step2.$ == "pickup")
        decks[step2.val.deck].push(step2.val.request);
      if (step2.$ == "deliver")
        decks = decks.map((d) => d.filter((r) => r != step2.val.request));
    }
    unit_iadd(totalDist, getCost(steps.steps[i - 1].val.pos, steps.steps[i].val.pos));
    if (i == n)
      dist.value = totalDist.value;
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
  let res = div(h2(transporterString(steps.transporter)), p(`distance: ${timeString(dist)} / ${timeString(totalDist)}`), style({
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
setRandSeed(24);
var roadMap = randomMap();
var requests = Array.from({ length: 20 }, (_, i) => ({
  id: randomUUID(),
  startPoint: randChoice(roadMap.points),
  endPoint: randChoice(roadMap.points),
  value: unit_const(Math.floor(random() * 1000), "eur"),
  deadline: unit_const(Math.floor(random() * 60 * 60 * 24 * 7), "seconds")
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

//# debugId=5B9AEFBADC4B33AE64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvcmFuZG9tLnRzIiwgInNyYy9zY2hlbWEudHMiLCAic3JjL3R5cGVzLnRzIiwgInNyYy9wbGFubmVyLnRzIiwgInNyYy92aWV3L21hcFZpZXcudHMiLCAic3JjL3JhbmRvbU1hcC50cyIsICJzcmMvdmlldy9yZXF1ZXN0Vmlldy50cyIsICJzcmMvd3JpdGVhYmxlLnRzIiwgInNyYy92aWV3L3NjaGVkdWxlVmlldy50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM4ODhcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjZTVlNWU1XCIsXG4gIH0sXG4gIGRhcms6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiNmZmZcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjMjIyXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDE5OCwgMjAsIDApXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDk1LCAxMDAsIDI1NSlcIixcbiAgICBncmVlbjogICAgICAgICAgICAgXCJyZ2IoMCwgMTg1LCAxOSlcIixcbiAgICBncmF5OiAgICAgICAgICAgICAgXCIjNTY1NjU2XCIsXG4gICAgbGlnaHRncmF5OiAgICAgICAgIFwiIzQxNDE0MVwiLFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb2xvciA9IHtcbiAgY29sb3I6IFwidmFyKC0tY29sb3IpXCIsXG4gIGJhY2tncm91bmQ6IFwidmFyKC0tYmFja2dyb3VuZClcIixcbiAgYmx1ZTogXCJ2YXIoLS1ibHVlKVwiLFxuICByZWQ6IFwidmFyKC0tcmVkKVwiLFxuICBncmVlbjogXCJ2YXIoLS1ncmVlbilcIixcbiAgZ3JheTogXCJ2YXIoLS1ncmF5KVwiLFxuICBsaWdodGdyYXk6IFwidmFyKC0tbGlnaHRncmF5KVwiXG59XG5cblxubGV0IHN0eWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIilcbnN0eWwuaW5uZXJIVE1MID0gYFxuOnJvb3Qge1xuICAtLWNvbG9yOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmNvbG9yfTtcbiAgLS1iYWNrZ3JvdW5kOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmJhY2tncm91bmR9O1xuICAtLXJlZDogJHtjb2xvclBhbGV0dGUuZGFyay5yZWR9O1xuICAtLWdyZWVuOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyZWVufTtcbiAgLS1ibHVlOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmJsdWV9O1xuICAtLWdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JheX07XG4gIC0tbGlnaHRncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmxpZ2h0Z3JheX07XG4gIGNvbG9yOiB2YXIoLS1jb2xvcik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQpO1xuICBmb250LWZhbWlseTogc2Fucy1zZXJpZjtcbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIDpyb290IHtcbiAgICAtLWNvbG9yOiAke2NvbG9yUGFsZXR0ZS5saWdodC5jb2xvcn07XG4gICAgLS1iYWNrZ3JvdW5kOiAke2NvbG9yUGFsZXR0ZS5saWdodC5iYWNrZ3JvdW5kfTtcbiAgICAtLXJlZDogJHtjb2xvclBhbGV0dGUubGlnaHQucmVkfTtcbiAgICAtLWdyZWVuOiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmVlbn07XG4gICAgLS1ibHVlOiAke2NvbG9yUGFsZXR0ZS5saWdodC5ibHVlfTtcbiAgICAtLWdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyYXl9O1xuICAgIC0tbGlnaHRncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5saWdodGdyYXl9O1xuICB9XG59XG5gXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWwpXG5cbmV4cG9ydCB0eXBlIGh0bWxLZXkgPSAnaW5uZXJUZXh0J3wnb25jbGljaycgfCAnb25pbnB1dCcgfCAnb25rZXlkb3duJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJcblxuXG5sZXQgUkFORFNFRUQgPSAwXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRSYW5kU2VlZChzZWVkOiBudW1iZXIpe1xuICBSQU5EU0VFRCA9IHNlZWRcbiAgUkFORFNFRUQgPSByYW5kSW50KDAsIDEwMDAwKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tKCl7XG4gIGxldCB4ID0gTWF0aC5zaW4oUkFORFNFRUQrKykgKiAxMDAwMDtcbiAgcmV0dXJuIHggLSBNYXRoLmZsb29yKHgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZEludChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpe1xuICByZXR1cm4gTWF0aC5mbG9vcihyYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRDaG9pY2U8VD4oYXJyOiBUW10pOiBUIHtcbiAgcmV0dXJuIGFycltyYW5kSW50KDAsIGFyci5sZW5ndGgtMSldIVxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgdmFsaWRhdGVKc29uU2NoZW1hIH0gZnJvbSBcIi4vanNvbnNjaGVtYVwiXG5cblxuZXhwb3J0IHR5cGUgSlNPTlNjaGVtYSA9IHsgW2tleTogc3RyaW5nXTogSnNvbkRhdGEgfVxuXG5cbmV4cG9ydCB0eXBlIEpzb25EYXRhID0gc3RyaW5nIHwgbnVsbCB8IG51bWJlciB8IGJvb2xlYW4gfCB7IFtrZXkgaW4gc3RyaW5nXTogSnNvbkRhdGEgfSB8IEpzb25EYXRhW11cblxuZXhwb3J0IHR5cGUgU2NoZW1hPFQ+ID0geyBqc29uOiBKU09OU2NoZW1hIH1cblxuZXhwb3J0IHR5cGUgSW5mZXI8Uz4gPSBTIGV4dGVuZHMgU2NoZW1hPGluZmVyIFQ+ID8gVCA6IG5ldmVyXG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0ZSA9IDxUPiAoc2NoZW1hOiBTY2hlbWE8VD4sIGRhdGE6dW5rbm93bikgOiBUID0+IHtcbiAgcmV0dXJuIHZhbGlkYXRlSnNvblNjaGVtYTxUPihzY2hlbWEuanNvbiwgZGF0YSlcbn1cblxuZXhwb3J0IGNvbnN0IHN0cmluZ2lmeSA9IChkYXRhOiBKc29uRGF0YSk6IHN0cmluZyA9PiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKVxuXG5cbmV4cG9ydCBjb25zdCBmaWxsU2NoZW1hID0gPFQ+KHNjaGVtYTogU2NoZW1hPFQ+KSA6IFQgPT57XG4gIGxldCBqc29uID0gc2NoZW1hLmpzb25cbiAgaWYgKGpzb24udHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gXCJcIiBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIDAgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwiYm9vbGVhblwiKSByZXR1cm4gZmFsc2UgYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwibnVsbFwiKSByZXR1cm4gbnVsbCBhcyBUXG4gIGlmIChqc29uLnR5cGUgPT0gXCJhcnJheVwiKSByZXR1cm4gW10gYXMgVFxuICBpZiAoanNvbi50eXBlID09IFwib2JqZWN0XCIgJiYganNvbi5wcm9wZXJ0aWVzKXtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IHt9XG4gICAgbGV0IHJlcXVpcmVkID0gQXJyYXkuaXNBcnJheShqc29uLnJlcXVpcmVkKSA/IGpzb24ucmVxdWlyZWQgYXMgc3RyaW5nW10gOiBbXVxuICAgIGZvciAobGV0IHJlcSBvZiByZXF1aXJlZClcbiAgICAgIHJlc3VsdFtyZXFdID0gZmlsbFNjaGVtYSh7anNvbjogKGpzb24ucHJvcGVydGllcyBhcyBhbnkpW3JlcV19KVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuICBpZiAoXCJjb25zdFwiIGluIGpzb24pIHJldHVybiBqc29uLmNvbnN0IGFzIFRcbiAgaWYgKFwiYW55T2ZcIiBpbiBqc29uICYmIEFycmF5LmlzQXJyYXkoanNvbi5hbnlPZikpIHJldHVybiBmaWxsU2NoZW1hKHtqc29uOiBqc29uLmFueU9mWzBdIGFzIEpTT05TY2hlbWF9KSBhcyBUXG4gIHJldHVybiBudWxsIGFzIFRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21Kc29uU2NoZW1hID0gPFQ+IChqc29uOiBKU09OU2NoZW1hKTogU2NoZW1hPFQ+ID0+ICh7anNvbn0pXG5cbmV4cG9ydCBjb25zdCBzdHJpbmc6IFNjaGVtYTxzdHJpbmc+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwic3RyaW5nXCJ9KVxuZXhwb3J0IGNvbnN0IG51bWJlcjogU2NoZW1hPG51bWJlcj4gPSBmcm9tSnNvblNjaGVtYSh7dHlwZTogXCJudW1iZXJcIn0pXG5leHBvcnQgY29uc3QgYm9vbGVhbjogU2NoZW1hPGJvb2xlYW4+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwiYm9vbGVhblwifSlcbmV4cG9ydCBjb25zdCBudWxsU2NoZW1hIDogU2NoZW1hPG51bGw+ID0gZnJvbUpzb25TY2hlbWEoe3R5cGU6IFwibnVsbFwifSlcbmV4cG9ydCBjb25zdCBhbnk6IFNjaGVtYTxhbnk+ID0gZnJvbUpzb25TY2hlbWEoe30pXG5leHBvcnQgY29uc3Qgb3B0aW9uYWwgPSA8VD4oc2NoZW1hOiBTY2hlbWE8VD4pIDogU2NoZW1hPFQgfCBudWxsPiA9PiBmcm9tSnNvblNjaGVtYSh7YW55T2Y6IFt7dHlwZTogXCJudWxsXCJ9LCBzY2hlbWEuanNvbl19KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQ+KGl0ZW1TY2hlbWE6IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcImFycmF5XCIsIGl0ZW1zOiBpdGVtU2NoZW1hLmpzb259KVxuZXhwb3J0IGNvbnN0IGNvbnN0YW50ID0gPFQgZXh0ZW5kcyBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuPih2YWx1ZTogVCk6IFNjaGVtYTxUPiA9PiBmcm9tSnNvblNjaGVtYSh7Y29uc3Q6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IG9iamVjdCA9IDxTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgU2NoZW1hPGFueT4+PiAoc2hhcGU6IFMpOiBTY2hlbWE8e1tLIGluIGtleW9mIFNdOiBJbmZlcjxTW0tdPn0+ID0+IGZyb21Kc29uU2NoZW1hKHtcbiAgdHlwZTogXCJvYmplY3RcIixcbiAgcHJvcGVydGllczogT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKHNoYXBlKS5tYXAoKFtrZXksIGZpZWxkXSk9PiBba2V5LCBmaWVsZC5qc29uXSkpLFxuICByZXF1aXJlZDogT2JqZWN0LmtleXMoc2hhcGUpXG59KVxuXG5leHBvcnQgY29uc3QgcmVjb3JkID0gPFQ+KHZhbHVlU2NoZW1hOiBTY2hlbWE8VD4pOiBTY2hlbWE8UmVjb3JkPHN0cmluZywgVD4+ID0+IGZyb21Kc29uU2NoZW1hKHt0eXBlOiBcIm9iamVjdFwiLCBhZGRpdGlvbmFsUHJvcGVydGllczogdmFsdWVTY2hlbWEuanNvbn0pXG5leHBvcnQgY29uc3Qgc2NoZW1hU2NoZW1hIDogU2NoZW1hPEpTT05TY2hlbWE+ID0gcmVjb3JkKGFueSlcblxuZXhwb3J0IGNvbnN0IHVuaW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbnlPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnZ2VkIDxTIGV4dGVuZHMge1trZXkgOiBzdHJpbmddOiBTY2hlbWE8YW55Pn0+IChmaWVsZHM6IFMpIDogU2NoZW1hPHtba2V5IGluIGtleW9mIFNdOiB7JDoga2V5LCB2YWw6SW5mZXI8U1trZXldPn0gfVtrZXlvZiBTXT4ge1xuICByZXR1cm4gdW5pb24oLi4uT2JqZWN0LmVudHJpZXMoZmllbGRzKS5tYXAoKFskLHZhbF0pPT5vYmplY3QoeyQ6Y29uc3RhbnQoJCksdmFsfSkpKVxufVxuXG5cblxuXG5leHBvcnQgY29uc3QgaW50ZXJzZWN0aW9uID0gPFMgZXh0ZW5kcyBTY2hlbWE8YW55PltdPiguLi5zY2hlbWFzOiBTKTogU2NoZW1hPEluZmVyPFNbbnVtYmVyXT4+ID0+IGZyb21Kc29uU2NoZW1hKHthbGxPZjogc2NoZW1hcy5tYXAocz0+IHMuanNvbil9KVxuXG5leHBvcnQgY29uc3QgYXNUeXBlVmlldyA9IChzY2hlbWE6IFNjaGVtYTxhbnk+KTogc3RyaW5nID0+IHtcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwic3RyaW5nXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJudW1iZXJcIikgcmV0dXJuIFwibnVtYmVyXCJcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJib29sZWFuXCIpIHJldHVybiBcImJvb2xlYW5cIlxuICBpZiAoc2NoZW1hLmpzb24udHlwZSA9PSBcIm51bGxcIikgcmV0dXJuIFwibnVsbFwiXG4gIGlmIChzY2hlbWEuanNvbi50eXBlID09IFwiYXJyYXlcIiAmJiBzY2hlbWEuanNvbi5pdGVtcykgcmV0dXJuIGAke2FzVHlwZVZpZXcoe2pzb246IHNjaGVtYS5qc29uLml0ZW1zIGFzIEpTT05TY2hlbWF9KX1bXWBcbiAgaWYgKHNjaGVtYS5qc29uLnR5cGUgPT0gXCJvYmplY3RcIiAmJiBzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKXtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuZW50cmllcyhzY2hlbWEuanNvbi5wcm9wZXJ0aWVzKS5tYXAoKFtrZXksIHByb3BdKT0+IGAke2tleX06ICR7YXNUeXBlVmlldyh7anNvbjogcHJvcCBhcyBKU09OU2NoZW1hfSl9YClcbiAgICByZXR1cm4gYHtcXG4gICR7cHJvcHMuam9pbihcIixcXG5cIikucmVwbGFjZUFsbChcIlxcblwiLCBcIlxcbiAgXCIpfVxcbn1gXG4gIH1cbiAgaWYgKFwiY29uc3RcIiBpbiBzY2hlbWEuanNvbikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNjaGVtYS5qc29uLmNvbnN0KVxuICBpZiAoXCJhbnlPZlwiIGluIHNjaGVtYS5qc29uICYmIEFycmF5LmlzQXJyYXkoc2NoZW1hLmpzb24uYW55T2YpKSByZXR1cm4gc2NoZW1hLmpzb24uYW55T2YubWFwKHM9PiBhc1R5cGVWaWV3KHtqc29uOiBzIGFzIEpTT05TY2hlbWF9KSkuam9pbihcIiB8IFwiKVxuICByZXR1cm4gXCJhbnlcIlxufVxuXG5cblxuZXhwb3J0IGNsYXNzIExvY2FsU3RvcmVkIDxUIGV4dGVuZHMgSnNvbkRhdGE+IHtcbiAgY29uc3RydWN0b3IocHVibGljIGtleTogc3RyaW5nLCBwdWJsaWMgc2NoZW1hOiBTY2hlbWE8VD4sIHB1YmxpYyBkZWZhdWx0VmFsdWU6IFQpe31cblxuICBnZXQoKTpUIHtcbiAgICBsZXQgcmF3ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5rZXkpXG4gICAgdHJ5e1xuICAgICAgcmV0dXJuIHZhbGlkYXRlKHRoaXMuc2NoZW1hLCBKU09OLnBhcnNlKHJhdyEpKVxuICAgIH1jYXRjaChlKXtcbiAgICAgIHJldHVybiB0aGlzLmRlZmF1bHRWYWx1ZVxuICAgIH1cbiAgfVxuICBzZXQodmFsdWU6IFQpe1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHRoaXMua2V5LCBKU09OLnN0cmluZ2lmeSh2YWxpZGF0ZSh0aGlzLnNjaGVtYSwgdmFsdWUpKSlcbiAgfVxufVxuIiwKICAgICJpbXBvcnQgeyByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcbmltcG9ydCB7IGFycmF5LCBib29sZWFuLCBjb25zdGFudCwgbnVtYmVyLCBvYmplY3QsIHN0cmluZywgdGFnZ2VkLCB1bmlvbiwgdHlwZSBJbmZlciwgdHlwZSBTY2hlbWEgfSBmcm9tIFwiLi9zY2hlbWFcIjtcblxuXG5leHBvcnQgdHlwZSBVVUlEID0gYHUke3N0cmluZ30tJHtzdHJpbmd9YFxuZXhwb3J0IGNvbnN0IFVVSUQgOiBTY2hlbWE8VVVJRD4gPSBzdHJpbmdcblxuXG5leHBvcnQgdHlwZSBVbml0IDxzIGV4dGVuZHMgc3RyaW5nPiA9IHt2YWx1ZTogbnVtYmVyLCB1bml0OiBzfVxuZXhwb3J0IGNvbnN0IFVuaXQgPSA8cyBleHRlbmRzIHN0cmluZz4odW5pdDogcykgPT4gb2JqZWN0KHt2YWx1ZTogbnVtYmVyLCB1bml0OiBjb25zdGFudCh1bml0KX0pXG5cbmV4cG9ydCBjb25zdCB1bml0X2NvbnN0ID0gPHMgZXh0ZW5kcyBzdHJpbmc+KHZhbHVlOiBudW1iZXIsIHVuaXQ6IHMpIDogVW5pdDxzPiA9PiAoe3ZhbHVlLCB1bml0fSlcbmV4cG9ydCBjb25zdCB1bml0X2FkZCA9IDxzIGV4dGVuZHMgc3RyaW5nPihhOiBVbml0PHM+LCBiOiBVbml0PHM+KSA6IFVuaXQ8cz4gPT4gKHt2YWx1ZTogYS52YWx1ZSArIGIudmFsdWUsIHVuaXQ6IGEudW5pdH0pXG5leHBvcnQgY29uc3QgdW5pdF9pYWRkID0gPHMgZXh0ZW5kcyBzdHJpbmc+KGE6IFVuaXQ8cz4sIGI6IFVuaXQ8cz4pID0+IHthLnZhbHVlICs9IGIudmFsdWV9XG5cbmV4cG9ydCBmdW5jdGlvbiByYW5kb21VVUlEKCkge3JldHVybiBcInVcIiArIHJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyLDEwKSArIFwiLVwiICsgcmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIsMTApIGFzIFVVSUR9XG5cbmV4cG9ydCBjb25zdCBQcmljZSA9IFVuaXQoXCJldXJcIilcbmV4cG9ydCBjb25zdCBUaW1lID0gVW5pdChcInNlY29uZHNcIilcbmV4cG9ydCB0eXBlIFByaWNlID0gVW5pdDxcImV1clwiPlxuZXhwb3J0IHR5cGUgVGltZSA9IFVuaXQ8XCJzZWNvbmRzXCI+XG5cblxuZXhwb3J0IHR5cGUgTG9jYXRpb24gPSBgbG9jJHtzdHJpbmd9YFxuZXhwb3J0IGNvbnN0IExvY2F0aW9uIDogU2NoZW1hPExvY2F0aW9uPiA9IHN0cmluZ1xuXG5leHBvcnQgY29uc3QgUmVxdWVzdCA9IG9iamVjdCh7XG4gIGlkOiBVVUlELFxuICBzdGFydFBvaW50OiBMb2NhdGlvbixcbiAgZW5kUG9pbnQ6IExvY2F0aW9uLFxuICB2YWx1ZTogUHJpY2UsXG4gIGRlYWRsaW5lOiBUaW1lLFxufSlcblxuZXhwb3J0IGNvbnN0IFRyYW5zcG9ydGVyID0gb2JqZWN0KHsgaWQ6IFVVSUQsIHBvc2l0aW9uOiBVVUlELCB9KVxuXG5leHBvcnQgY29uc3QgU2NoZWR1bGVTdGVwID0gdGFnZ2VkKHtcbiAgcGlja3VwOiBvYmplY3Qoe3JlcXVlc3Q6IFVVSUQsIHBvczogTG9jYXRpb24sIGRlY2s6IHVuaW9uKGNvbnN0YW50KDApLCBjb25zdGFudCgxKSl9KSxcbiAgZGVsaXZlcjogb2JqZWN0KHtyZXF1ZXN0OiBVVUlELCBwb3M6IExvY2F0aW9ufSksXG4gIHN0YXJ0OiBvYmplY3Qoe3BvczogTG9jYXRpb259KSxcbn0pXG5leHBvcnQgY29uc3QgU2NoZWR1bGVJdGVtID0gb2JqZWN0KHtcbiAgdHJhbnNwb3J0ZXI6IFVVSUQsXG4gIHN0ZXBzOiBhcnJheShTY2hlZHVsZVN0ZXApLFxufSlcbmV4cG9ydCBjb25zdCBTY2hlZHVsZSA9IGFycmF5KFNjaGVkdWxlSXRlbSlcblxuZXhwb3J0IGNvbnN0IE1vZHVsZSA9IG9iamVjdCh7XG5cbiAgcmVxdWVzdHM6IGFycmF5KFJlcXVlc3QpLFxuICB0cmFuc3BvcnRlcnM6IGFycmF5KFRyYW5zcG9ydGVyKSxcbiAgc2NoZWR1bGU6IFNjaGVkdWxlLFxuXG59KVxuXG5leHBvcnQgdHlwZSBSZXF1ZXN0ID0gSW5mZXI8dHlwZW9mIFJlcXVlc3Q+XG5leHBvcnQgdHlwZSBUcmFuc3BvcnRlciA9IEluZmVyPHR5cGVvZiBUcmFuc3BvcnRlcj5cbmV4cG9ydCB0eXBlIFNjaGVkdWxlU3RlcCA9IEluZmVyPHR5cGVvZiBTY2hlZHVsZVN0ZXA+XG5leHBvcnQgdHlwZSBTY2hlZHVsZUl0ZW0gPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGVJdGVtPlxuZXhwb3J0IHR5cGUgU2NoZWR1bGUgPSBJbmZlcjx0eXBlb2YgU2NoZWR1bGU+XG5cbiIsCiAgICAiaW1wb3J0IHsgVGltZSwgdW5pdF9hZGQsIHVuaXRfY29uc3QsIHVuaXRfaWFkZCwgdHlwZSBMb2NhdGlvbiwgdHlwZSBSZXF1ZXN0LCB0eXBlIFNjaGVkdWxlLCB0eXBlIFNjaGVkdWxlSXRlbSwgdHlwZSBVVUlEIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IHJlcXVlc3RzLCByb2FkTWFwIH0gZnJvbSBcIi4vdmlldy9tYWluXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kb20gfSBmcm9tIFwiLi9yYW5kb21cIjtcblxuXG5jb25zdCBERUNLQ0FQQUNJVFkgPSAzXG5jb25zdCBVTkxPQURDT1NUID0gdW5pdF9jb25zdCgxMCwgXCJldXJcIilcbmNvbnN0IFBJQ0tVUENPU1QgPSB1bml0X2NvbnN0KDUsIFwiZXVyXCIpXG5jb25zdCBESVNUX0NPU1RfRVVSX1BFUl9IID0gMjBcbmNvbnN0IERJU1RfQ09TVCA9IERJU1RfQ09TVF9FVVJfUEVSX0ggLyAzNjAwXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHBhaXJJZChhOiBzdHJpbmcsIGI6IHN0cmluZyk6IHN0cmluZ3tcbiAgcmV0dXJuIGEgPCBiID8gYCR7YX0tJHtifWAgOiBgJHtifS0ke2F9YFxufVxuXG5jb25zdCBDb3N0TWF0cml4ID0gbmV3IE1hcDxzdHJpbmcsIFRpbWU+KClcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRQYXRoKHN0YXJ0OiBMb2NhdGlvbiwgZW5kOiBMb2NhdGlvbik6IHtwYXRoOiBMb2NhdGlvbltdLCBkaXN0OiBUaW1lfXtcblxuXG4gIGxldCB2aXNpdGVkID0gbmV3IE1hcDxMb2NhdGlvbiwge2Rpc3Q6IFRpbWUsIHBhdGg6IExvY2F0aW9uW119PigpXG4gIHZpc2l0ZWQuc2V0KHN0YXJ0LCB7ZGlzdDogdW5pdF9jb25zdCgwLCBcInNlY29uZHNcIiksIHBhdGg6IFtzdGFydF19KVxuICBsZXQgcXVldWUgPSBbc3RhcnRdXG5cbiAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDApe1xuICAgIGxldCBjdXJyZW50ID0gcXVldWUuc2hpZnQoKSFcbiAgICBpZiAoY3VycmVudCA9PSBlbmQpeyBicmVha31cbiAgXG4gICAgZm9yIChsZXQgW25leHQsIGRpc3RdIG9mIHJvYWRNYXAucm9hZHMuZ2V0KGN1cnJlbnQpID8/IFtdKXtcbiAgICAgIGxldCBjb3N0ID0gdW5pdF9hZGQodmlzaXRlZC5nZXQoY3VycmVudCkhLmRpc3QsIGRpc3QpXG4gICAgICBpZiAoIXZpc2l0ZWQuaGFzKG5leHQpIHx8IGNvc3QgPCB2aXNpdGVkLmdldChuZXh0KSEuZGlzdCl7XG4gICAgICAgIHZpc2l0ZWQuc2V0KG5leHQsIHtkaXN0OiBjb3N0LCBwYXRoOiBbLi4udmlzaXRlZC5nZXQoY3VycmVudCkhLnBhdGgsIG5leHRdfSlcbiAgICAgICAgcXVldWUucHVzaChuZXh0KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBwYXRoID0gdmlzaXRlZC5nZXQoZW5kKVxuICBpZiAoIXBhdGgpIHRocm93IG5ldyBFcnJvcihgTm8gcGF0aCBmb3VuZCBmcm9tICR7c3RhcnR9IHRvICR7ZW5kfWApXG5cbiAgQ29zdE1hdHJpeC5zZXQocGFpcklkKHN0YXJ0LCBlbmQpLCBwYXRoLmRpc3QpXG5cbiAgcmV0dXJuIHBhdGhcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29zdChzdGFydDogTG9jYXRpb24sIGVuZDogTG9jYXRpb24pOiBUaW1le1xuICBsZXQgaWQgPSBwYWlySWQoc3RhcnQsIGVuZClcbiAgaWYgKCFDb3N0TWF0cml4LmhhcyhpZCkpIGZpbmRQYXRoKHN0YXJ0LCBlbmQpXG4gIHJldHVybiBDb3N0TWF0cml4LmdldChpZCkhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb3N0TiguLi5wb2ludHM6IExvY2F0aW9uW10pOiBUaW1le1xuICBsZXQgY29zdCA9IHVuaXRfY29uc3QoMCwgXCJzZWNvbmRzXCIpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcG9pbnRzLmxlbmd0aCAtIDE7IGkrKyl7XG4gICAgdW5pdF9pYWRkKGNvc3QsIGdldENvc3QocG9pbnRzW2ldISwgcG9pbnRzW2krMV0hKSlcbiAgfVxuICByZXR1cm4gY29zdFxufVxuXG5cbmV4cG9ydCBsZXQgb3B0RHVyID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gb3B0aW1pemVTY2hlZHVsZShyZXF1ZXN0czogUmVxdWVzdFtdLCBzY2hlZHVsZTogU2NoZWR1bGUpOlNjaGVkdWxlIHtcblxuICBsZXQgZnJlZV9yZXF1ZXN0cyA9IFsuLi5yZXF1ZXN0cy5maWx0ZXIoeD0+IXNjaGVkdWxlLmZsYXRNYXAoeT0+eS5zdGVwcykuc29tZSh6PT56LiQgPT0gXCJwaWNrdXBcIiAmJiB6LnZhbC5yZXF1ZXN0ID09IHguaWQpKV1cblxuICBmdW5jdGlvbiBwZXJtdXRlIChzY2hlZHVsZTogU2NoZWR1bGUpe1xuICAgIGxldCByYXRpbmcgPSByYXRlU2NoZWR1bGUoc2NoZWR1bGUpXG4gICAgZm9yIChsZXQgc2NoZWRJdGVtIG9mIHNjaGVkdWxlKXtcblxuICAgICAgaWYgKHJhbmRvbSgpIDwgMC4xKXtcbiAgICAgICAgaWYgKHJhbmRvbSgpIDwgMC41KXtcbiAgICAgICAgICBpZiAoZnJlZV9yZXF1ZXN0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgIGxldCByZXEgPSBmcmVlX3JlcXVlc3RzLnBvcCgpIVxuICAgICAgICAgICAgc2NoZWRJdGVtLnN0ZXBzLnB1c2goXG4gICAgICAgICAgICAgIHskOlwicGlja3VwXCIsIHZhbDogeyByZXF1ZXN0OiByZXEuaWQsIHBvczogcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyksIGRlY2s6IHJhbmRvbSgpID4gLjUgPyAxIDogMH19LFxuICAgICAgICAgICAgICB7JDpcImRlbGl2ZXJcIiwgdmFsOiB7IHJlcXVlc3Q6IHJlcS5pZCwgcG9zOiByYW5kQ2hvaWNlKHJvYWRNYXAucG9pbnRzKX19LFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIGlmIChzY2hlZEl0ZW0uc3RlcHMubGVuZ3RoID4gMyl7XG5cbiAgICAgICAgICAgIGxldCBpdGVtcmF0aW5nID0gcmF0ZVNjaGVkdWxlKFtzY2hlZEl0ZW1dKVxuICAgICAgICAgICAgbGV0IHJlcSA9IHJhbmRDaG9pY2Uoc2NoZWRJdGVtLnN0ZXBzLmZpbHRlcih4PT54LiQgPT0gXCJwaWNrdXBcIikhKS52YWwucmVxdWVzdFxuICAgICAgICAgICAgbGV0IG9sZHN0ZXBzID0gc2NoZWRJdGVtLnN0ZXBzXG4gICAgICAgICAgICBzY2hlZEl0ZW0uc3RlcHMgPSBvbGRzdGVwcy5maWx0ZXIoeD0+KHguJCA9PSBcInN0YXJ0XCIgfHwgKHgudmFsLnJlcXVlc3QgIT0gcmVxKSkpXG4gICAgICAgICAgICBsZXQgbmV3cmF0aW5nID0gcmF0ZVNjaGVkdWxlKFtzY2hlZEl0ZW1dKVxuICAgICAgICAgICAgaWYgKG5ld3JhdGluZyA8IGl0ZW1yYXRpbmcpIHNjaGVkSXRlbS5zdGVwcyA9IG9sZHN0ZXBzXG4gICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzY2hlZEl0ZW0uc3RlcHMubGVuZ3RoIDw9IDIpIGNvbnRpbnVlXG5cbiAgICAgIGxldCBhID0gMSArIHJhbmRpbnQoc2NoZWRJdGVtLnN0ZXBzLmxlbmd0aC0xKTtcbiAgICAgIGxldCBiID0gMSArIHJhbmRpbnQoc2NoZWRJdGVtLnN0ZXBzLmxlbmd0aC0xKTtcbiAgICAgIHN3YXAoc2NoZWRJdGVtLnN0ZXBzLCBhLGIpXG4gICAgICBsZXQgbmV3cmF0ZSA9IHJhdGVTY2hlZHVsZShzY2hlZHVsZSlcbiAgICAgIGlmIChuZXdyYXRlIDw9IHJhdGluZykgc3dhcChzY2hlZEl0ZW0uc3RlcHMsIGEsIGIpXG5cbiAgICAgIGlmIChyYW5kb20oKSA+IDAuNSkge1xuICAgICAgICBsZXQgYyA9IHNjaGVkSXRlbS5zdGVwc1sxICsgcmFuZGludChzY2hlZEl0ZW0uc3RlcHMubGVuZ3RoLTEpXTtcbiAgICAgICAgaWYgKGM/LiQgPT0gXCJwaWNrdXBcIil7XG4gICAgICAgICAgYy52YWwuZGVjayA9IGMudmFsLmRlY2sgPT0gMCA/IDEgOiAwXG4gICAgICAgICAgbGV0IG5ld3JhdGUgPSByYXRlU2NoZWR1bGUoc2NoZWR1bGUpXG4gICAgICAgICAgaWYgKG5ld3JhdGUgPD0gcmF0aW5nKSBjLnZhbC5kZWNrID0gYy52YWwuZGVjayA9PSAwID8gMSA6IDBcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBzdCA9IERhdGUubm93KClcblxuICBmb3IgKGxldCBpID0gMDsgaTwgMTAwMDsgaSsrKXtcbiAgICBwZXJtdXRlKHNjaGVkdWxlKVxuICB9XG5cbiAgb3B0RHVyID0gRGF0ZS5ub3coKSAtIHN0IFxuICByZXR1cm4gc2NoZWR1bGVcbn1cblxuXG5mdW5jdGlvbiByYW5kaW50IChuOm51bWJlcil7IHJldHVybiBNYXRoLmZsb29yKHJhbmRvbSgpKm4pfVxuXG5mdW5jdGlvbiBzd2FwPFQ+IChzOlRbXSwgYTogbnVtYmVyLCBiOm51bWJlcil7XG4gIGxldCB0PSBzW2FdIVxuICBzW2FdID0gc1tiXSE7XG4gIHNbYl0gPSB0XG59XG5cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiByYXRlU2NoZWR1bGUoc2NoZWR1bGU6IFNjaGVkdWxlKSA6IG51bWJlciB7XG4gIGxldCByZXMgPSB1bml0X2NvbnN0KDAsIFwiZXVyXCIpXG4gIGxldCBkaXN0ID0gdW5pdF9jb25zdCgwLCAgXCJzZWNvbmRzXCIpXG5cbiAgbGV0IGRlY2tzOiBbVVVJRFtdLCBVVUlEW11dXG4gIGZvciAobGV0IGl0ZW0gb2Ygc2NoZWR1bGUpe1xuXG4gICAgZGVja3MgPSAgW1tdLCBbXV1cblxuICAgIGZ1bmN0aW9uIHVubG9hZChyZXFpZDogVVVJRCwgZGVjazogMCB8IDEgKXtcbiAgICAgIGxldCBpZHggPSBkZWNrc1tkZWNrXS5pbmRleE9mKHJlcWlkKVxuICAgICAgaWYgKGlkeCA9PSAtMSkgcmV0dXJuIGZhbHNlXG4gICAgICBsZXQgYWZ0ZXIgPSBkZWNrc1tkZWNrXS5zbGljZShpZHgrMSlcbiAgICAgIGRlY2tzW2RlY2tdID0gZGVja3NbZGVja10uc2xpY2UoMCwgaWR4KS5jb25jYXQoYWZ0ZXIpXG4gICAgICByZXMudmFsdWUgLT0gVU5MT0FEQ09TVC52YWx1ZVxuICAgICAgcmVzLnZhbHVlIC09IGFmdGVyLmxlbmd0aCAqIChVTkxPQURDT1NULnZhbHVlICsgUElDS1VQQ09TVC52YWx1ZSlcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgaWYgKGl0ZW0uc3RlcHNbMF0/LiQgIT0gXCJzdGFydFwiKSByZXR1cm4gLSBJbmZpbml0eVxuICAgIGZvciAobGV0IHN0ZXAgb2YgaXRlbS5zdGVwcy5zbGljZSgxKSl7XG4gICAgICBpZiAoc3RlcC4kID09IFwicGlja3VwXCIpIHtcbiAgICAgICAgZGVja3Nbc3RlcC52YWwuZGVja10ucHVzaChzdGVwLnZhbC5yZXF1ZXN0KVxuICAgICAgICBpZiAoZGVja3Nbc3RlcC52YWwuZGVja10ubGVuZ3RoID4gREVDS0NBUEFDSVRZKSByZXR1cm4gLSBJbmZpbml0eVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoc3RlcC4kID09IFwiZGVsaXZlclwiKSB7XG5cbiAgICAgICAgbGV0IHJlcWlkID0gc3RlcC52YWwucmVxdWVzdFxuICAgICAgICBsZXQgcmVxID0gcmVxdWVzdHMuZmluZCh4PT5yZXFpZCA9PSB4LmlkKVxuICAgICAgICBpZiAoIXJlcSkgdGhyb3cgbmV3IEVycm9yKFwibm90IGZvdW5kIHJlcXVlc3Q6IFwiK3N0ZXAudmFsLnJlcXVlc3QpXG4gICAgICAgIGlmICghZGVja3MuZmxhdCgpLmluY2x1ZGVzKHJlcWlkKSkgcmV0dXJuIC0gSW5maW5pdHlcbiAgICAgICAgaWYgKCF1bmxvYWQocmVxaWQsIDApICYmICF1bmxvYWQocmVxaWQsIDEpKSByZXR1cm4gLSBJbmZpbml0eVxuICAgICAgICB1bml0X2lhZGQocmVzLCByZXEudmFsdWUpXG5cbiAgICAgIH1cbiAgICAgIGVsc2UgcmV0dXJuIC0gSW5maW5pdHlcbiAgICB9O1xuICAgIFxuICAgIHVuaXRfaWFkZChkaXN0LCBnZXRDb3N0TiguLi5pdGVtLnN0ZXBzLm1hcCh4PT54LnZhbC5wb3MpKSlcbiAgfVxuXG4gIHJldHVybiByZXMudmFsdWUgLSBkaXN0LnZhbHVlICogRElTVF9DT1NUICAgXG59XG4iLAogICAgIlxuaW1wb3J0IHR5cGUgeyBMb2NhdGlvbiwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZmluZFBhdGgsIHBhaXJJZCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyAgdHlwZSBSb2FkTWFwIH0gZnJvbSBcIi4uL3JhbmRvbU1hcFwiO1xuaW1wb3J0IHsgZGl2LCBwLCBzdHlsZSB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IGhpZ2h0TGlnaHRzLCByZXF1ZXN0cywgdHlwZSBIaWdoTGlnaHQgfSBmcm9tIFwiLi9tYWluXCI7XG5cblxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJjaXJjbGVcIiwgeDogbnVtYmVyLCB5OiBudW1iZXIpIDoge2VsOiBTVkdDaXJjbGVFbGVtZW50LCBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT52b2lkfVxuZnVuY3Rpb24gbWtTdmcgKHRhZzogXCJsaW5lXCIsIHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIpIDoge2VsOiBTVkdMaW5lRWxlbWVudCwgc2V0Q29sb3I6IChjb2xvcjogc3RyaW5nKT0+dm9pZH1cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwidGV4dFwiLCB4OiBudW1iZXIsIHk6IG51bWJlciwgczogc3RyaW5nKSA6IHtlbDogU1ZHVGV4dEVsZW1lbnQsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnZvaWR9XG5cbmZ1bmN0aW9uIG1rU3ZnICh0YWc6IFwiY2lyY2xlXCIgfCBcImxpbmVcIiB8IFwidGV4dFwiLCB4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4Mj86IG51bWJlciB8IHN0cmluZywgeTI/OiBudW1iZXIpe1xuICBsZXQgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCB0YWcpXG4gIGlmICh0YWcgPT0gXCJjaXJjbGVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiY3hcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjeVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjAxXCIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcImdyYXlcIilcbiAgICByZXR1cm4ge1xuICAgICAgZWwsXG4gICAgICBzZXRDb2xvcjogKGNvbG9yOiBzdHJpbmcpPT57XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHRhZyA9PSBcImxpbmVcIil7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwieDFcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5MVwiLCB5MS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcIngyXCIsIHgyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInkyXCIsIHkyIS50b1N0cmluZygpKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcInN0cm9rZVwiLCBcImdyYXlcIilcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJzdHJva2Utd2lkdGhcIiwgXCIwLjAwNVwiKVxuICAgIHJldHVybiB7XG4gICAgICBlbCxcbiAgICAgIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PntcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlXCIsIGNvbG9yKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIGlmICh0YWcgPT0gXCJ0ZXh0XCIpe1xuICAgIGVsLnNldEF0dHJpYnV0ZShcInhcIiwgeDEudG9TdHJpbmcoKSlcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJ5XCIsIHkxLnRvU3RyaW5nKCkpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcblxuICAgIFxuICAgIGVsLnNldEF0dHJpYnV0ZShcImRvbWluYW50LWJhc2VsaW5lXCIsIFwibWlkZGxlXCIpXG4gICAgZWwudGV4dENvbnRlbnQgPSBTdHJpbmcoeDIpXG4gICAgZWwuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiMC4wM1wiKVxuICAgIGVsLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgXCJncmF5XCIpXG4gICAgcmV0dXJuIHsgZWwsIHNldENvbG9yOiAoY29sb3I6IHN0cmluZyk9PnsgZWwuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBjb2xvcikgfSB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0YWdcIilcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBtYXBWaWV3IChyb2FkbWFwOiBSb2FkTWFwICkgOiBIVE1MRWxlbWVudCB7XG5cblxuICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpXG5cbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBcIjgwJVwiKVxuICBlbGVtZW50LnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCIwIDAgMSAxXCIpXG5cbiAgbGV0IGVsZW1lbnRzID0gbmV3IE1hcDxhbnksIFNWR0VsZW1lbnQ+KClcbiAgbGV0IHNvdXJjZXMgPSBuZXcgTWFwPFNWR0VsZW1lbnQsIGFueT4oKVxuICBcbiAgZm9yIChsZXQgW2lkMSwgcm9hZHNdIG9mIHJvYWRtYXAucm9hZHMpe1xuICAgIGZvciAobGV0IFtpZDIsIGRpc3RdIG9mIHJvYWRzKXtcbiAgICAgIGxldCBhID0gcm9hZG1hcC5nZW9sb2NhdGlvbiggaWQxKSFcbiAgICAgIGxldCBiID0gcm9hZG1hcC5nZW9sb2NhdGlvbiggaWQyKSFcbiAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIGEueCwgYS55LCBiLngsIGIueSkuZWxcbiAgICAgIGxldCBpZCA9IHBhaXJJZChpZDEsIGlkMilcbiAgICAgIGVsZW1lbnRzLnNldChpZCwgbGluZSlcbiAgICAgIHNvdXJjZXMuc2V0KGxpbmUsIGlkKVxuICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChsaW5lKVxuICAgIH1cbiAgfVxuICBcbiAgZm9yIChsZXQgcG9pbnQgb2Ygcm9hZG1hcC5yb2Fkcy5rZXlzKCkpe1xuICAgIGxldCBsb2MgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHBvaW50KVxuICAgIGxldCBjaXJjbGUgPSBta1N2ZyhcImNpcmNsZVwiLCBsb2MueCwgbG9jLnkpLmVsXG4gICAgZWxlbWVudHMuc2V0KHBvaW50LCBjaXJjbGUpXG4gICAgc291cmNlcy5zZXQoY2lyY2xlLCBwb2ludClcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNpcmNsZSlcbiAgfVxuXG4gIGxldCBoaW50czoge3JlbW92ZTooKT0+dm9pZH1bXSA9IFtdXG5cbiAgaGlnaHRMaWdodHMub251cGRhdGUoKG5ILG8pPT57XG4gICAgaGludHMuZm9yRWFjaChlbD0+ZWwucmVtb3ZlKCkpXG4gICAgZm9yIChsZXQgbiBvZiBuSCl7XG4gICAgICBsZXQgbGFzdCA6IExvY2F0aW9uIHwgbnVsbCA9IG51bGxcbiAgICAgIGZvciAobGV0IHAgb2Ygbi5wb2ludHMpe1xuICAgICAgICBsZXQgbmV4dCA9IHAubG9jYXRpb25cbiAgICAgICAgaWYgKGxhc3Qpe1xuICAgICAgICAgIGxldCBwYXRoID0gZmluZFBhdGgobGFzdCwgbmV4dCkucGF0aFxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGggLSAxOyBpKyspe1xuICAgICAgICAgICAgbGV0IEEgPSByb2FkbWFwLmdlb2xvY2F0aW9uKHBhdGhbaV0hKSFcbiAgICAgICAgICAgIGxldCBCID0gcm9hZG1hcC5nZW9sb2NhdGlvbihwYXRoW2krMV0hKSFcbiAgICAgICAgICAgIGxldCBsaW5lID0gbWtTdmcoXCJsaW5lXCIsIEEueCwgQS55LCBCLngsIEIueSlcbiAgICAgICAgICAgIGxpbmUuc2V0Q29sb3Iobi5jb2xvciA/PyBcIiNmZmM5ODhcIilcbiAgICAgICAgICAgIGxpbmUuZWwuc2V0QXR0cmlidXRlKFwic3Ryb2tlLXdpZHRoXCIsIFwiMC4wMVwiKVxuICAgICAgICAgICAgbGluZS5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwXCIpXG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxpbmUuZWwpXG4gICAgICAgICAgICBoaW50cy5wdXNoKHtyZW1vdmU6ICgpPT5saW5lLmVsLnJlbW92ZSgpfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGFzdCA9IG5leHRcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgcCBvZiBuLnBvaW50cyl7XG4gICAgICAgIGlmIChwLmxvZ28pIHtcbiAgICAgICAgICBsZXQgcG9zID0gcm9hZG1hcC5nZW9sb2NhdGlvbihwLmxvY2F0aW9uKVxuICAgICAgICAgIGxldCBlbCA9IG1rU3ZnKFwidGV4dFwiLCBwb3MueCwgcG9zLnksIHAubG9nbylcbiAgICAgICAgICBlbC5lbC5zZXRBdHRyaWJ1dGUoXCJ6LWluZGV4XCIsIFwiMTAwMFwiKVxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZWwuZWwpXG4gICAgICAgICAgaGludHMucHVzaChlbC5lbClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBsZXQgZHYgPSBkaXYoc3R5bGUoe3dpZHRoOlwiMTAwJVwiLCBkaXNwbGF5OlwiZmxleFwiLCBqdXN0aWZ5Q29udGVudDpcImNlbnRlclwiLCBwYWRkaW5nOiBcIjFlbVwifSkpXG4gIGR2LmFwcGVuZChlbGVtZW50KVxuICByZXR1cm4gZHZcbn1cblxuXG4iLAogICAgIlxuaW1wb3J0IHsgTG9jYXRpb24sIHJhbmRvbVVVSUQsIFRpbWUsIHVuaXRfY29uc3QsIFVVSUQgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgcmFuZENob2ljZSwgcmFuZG9tIH0gZnJvbSBcIi4vcmFuZG9tXCI7XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tTWFwICgpe1xuXG4gIGxldCBwb2ludHMgOkxvY2F0aW9uW10gPSBbXVxuXG4gIGxldCByb2FkcyA9IG5ldyBNYXA8TG9jYXRpb24sIE1hcDxMb2NhdGlvbiwgVGltZT4+ICgpXG4gIGxldCBnZW9sb2NhdGlvbiA9IG5ldyBNYXA8TG9jYXRpb24sIHt4OiBudW1iZXIsIHk6IG51bWJlcn0+KClcbiAgbGV0IGdlb2NvZGVzID0gbmV3IE1hcDxMb2NhdGlvbiwgc3RyaW5nPigpXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKyl7XG5cbiAgICBsZXQgcG9pbnQ6IExvY2F0aW9uID0gYGxvYyR7cmFuZG9tVVVJRCgpfWBcbiAgICBwb2ludHMucHVzaChwb2ludClcbiAgICBnZW9sb2NhdGlvbi5zZXQocG9pbnQgLCB7eDogcmFuZG9tKCksIHk6IHJhbmRvbSgpfSlcbiAgICBnZW9jb2Rlcy5zZXQocG9pbnQsIGBERSAke2dlb2xvY2F0aW9uLnNpemUudG9TdHJpbmcoKS5wYWRTdGFydCg0LCBcIjBcIil9YClcbiAgICByb2Fkcy5zZXQocG9pbnQsIG5ldyBNYXAoKSlcbiAgfVxuXG4gIGZvciAobGV0IFtJRCwgcF0gb2YgZ2VvbG9jYXRpb24uZW50cmllcygpKXtcbiAgICBnZW9sb2NhdGlvbi5lbnRyaWVzKCkudG9BcnJheSgpLnNvcnQoKFthLEFdLFtiLEJdKT0+IE1hdGguaHlwb3QoQS54IC0gcC54LCBBLnkgLSBwLnkpIC0gTWF0aC5oeXBvdChCLnggLSBwLngsIEIueSAtIHAueSkpXG4gICAgLnNsaWNlKDEsNCkuZm9yRWFjaCgoW2lkLCBsb2NdKT0+e1xuICAgICAgbGV0IGRpc3QgPSB1bml0X2NvbnN0KE1hdGguaHlwb3QobG9jLnggLSBwLngsIGxvYy55IC0gcC55KSAqIDEwICogNjAgKiA2MCwgXCJzZWNvbmRzXCIpXG4gICAgICByb2Fkcy5nZXQoSUQpIS5zZXQoaWQsIGRpc3QpXG4gICAgICByb2Fkcy5nZXQoaWQpIS5zZXQoSUQsIGRpc3QpXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcm9hZHMsXG4gICAgcG9pbnRzLFxuICAgIGdlb2xvY2F0aW9uKGxvYzogTG9jYXRpb24pe1xuICAgICAgbGV0IGdlbyA9IGdlb2xvY2F0aW9uLmdldChsb2MpXG4gICAgICBpZiAoIWdlbykgdGhyb3cgbmV3IEVycm9yKGBMb2NhdGlvbiAke2xvY30gbm90IGZvdW5kYClcbiAgICAgIHJldHVybiBnZW9cbiAgICB9LFxuICAgIGdlb0NvZGUobG9jOiBMb2NhdGlvbil7XG4gICAgICAgIGxldCBjb2RlID0gZ2VvY29kZXMuZ2V0KGxvYylcbiAgICAgICAgaWYgKCFjb2RlKSB0aHJvdyBuZXcgRXJyb3IoYExvY2F0aW9uICR7bG9jfSBub3QgZm91bmRgKVxuICAgICAgICByZXR1cm4gY29kZVxuICAgICAgfVxuICAgIH1cbn1cblxuXG5leHBvcnQgdHlwZSBSb2FkTWFwID0gdHlwZW9mIHJhbmRvbU1hcCBleHRlbmRzICgpID0+IGluZmVyIFQgPyBUIDogbmV2ZXJcbiIsCiAgICAiaW1wb3J0IHsgTG9jYXRpb24sIFByaWNlLCBSZXF1ZXN0LCBUaW1lLCBVVUlELCB0eXBlIFNjaGVkdWxlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBmaW5kUGF0aCB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgdHlwZSB7IFJvYWRNYXAgfSBmcm9tIFwiLi4vcmFuZG9tTWFwXCI7XG5pbXBvcnQgdHlwZSB7IEluZmVyIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHsgYm9yZGVyLCBjb2xvciwgaDMsIGh0bWwsIHBhZGRpbmcsIHNwYW4sIHN0eWxlLCB0YWJsZSwgdGQsIHRyLCB0eXBlIEhUTUxHZW5lcmF0b3IgfSBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQgeyBoaWdodExpZ2h0cywgcmVxdWVzdHMsIHJvYWRNYXAsIHNjaGVkdWxlIH0gZnJvbSBcIi4vbWFpblwiO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NTdHJpbmcgKGxvYzogSW5mZXI8dHlwZW9mIExvY2F0aW9uPikge1xuICByZXR1cm4gYPCfk40gJHtyb2FkTWFwLmdlb0NvZGUobG9jKSA/PyBcIlVOS1wifWBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zcG9ydGVyU3RyaW5nICh0cmFuOiBVVUlEKSB7XG4gIHJldHVybiBg8J+amyAke3NjaGVkdWxlLmdldCgpLmZpbmRJbmRleChzPT5zLnRyYW5zcG9ydGVyID09IHRyYW4pLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKX1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lU3RyaW5nICh0aW1lOiBUaW1lKXtcbiAgcmV0dXJuIGAkeygodGltZS52YWx1ZS82MCAvIDYwKS50b0ZpeGVkKDApKX0gaGBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByaWNlU3RyaW5nIChwcmljZTogUHJpY2Upe1xuICByZXR1cm4gYCR7cHJpY2UudmFsdWUudG9GaXhlZCgyKX0g4oKsYFxufVxuXG5cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0U3RyaW5nIChpZDogVVVJRCkge1xuICBsZXQgcmVxID0gcmVxdWVzdHMuZmluZChyPT5yLmlkID09IGlkKVxuICBpZiAoIXJlcSkgcmV0dXJuIFwiVU5LXCJcbiAgcmV0dXJuIGDwn5OmICR7cmVxdWVzdHMuZmluZEluZGV4KHg9PnguaWQgPT0gaWQpLnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKX1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0VmlldyAocmVxdWVzdHM6IFJlcXVlc3RbXSwgc2NoZWR1bGU6IFNjaGVkdWxlKTogSFRNTEVsZW1lbnR7XG5cbiAgbGV0IGNlbGwgPSAoKC4uLngpID0+IHRkKHN0eWxlKHtcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHZhcigtLWdyYXkpXCIsXG4gICAgcGFkZGluZzogXCIuM2VtIC41ZW1cIixcbiAgICBjdXJzb3I6XCJwb2ludGVyXCIsXG4gICAgd2hpdGVTcGFjZTogXCJub3dyYXBcIixcbiAgfSksIC4uLngpKSBhcyBIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiBcblxuICByZXR1cm4gdGFibGUoXG4gICAgc3R5bGUoeyBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLCB9KSxcblxuICAgIHRyKFtcInJlcXVlc3RcIiwgXCJzdGFydFwiLCBcImVuZFwiLCBcImRpc3RhbnpcIiwgXCJwcmVpc1wiLCBcImZyaXN0XCIgXS5tYXAoaD0+IGNlbGwoaCksICksIHN0eWxlKHtmb250V2VpZ2h0OiBcImJvbGRcIn0pKSxcbiAgICByZXF1ZXN0cy5tYXAoKHIsIGkpPT57XG5cbiAgICAgIGxldCBwYXRoID0gZmluZFBhdGgoci5zdGFydFBvaW50LCByLmVuZFBvaW50KVxuXG4gICAgICBsZXQgcm93PSB0cihcbiAgICAgICAgY2VsbChyZXF1ZXN0U3RyaW5nKHIuaWQpKSxcbiAgICAgICAgY2VsbChsb2NTdHJpbmcoci5zdGFydFBvaW50KSksXG4gICAgICAgIGNlbGwobG9jU3RyaW5nKHIuZW5kUG9pbnQpKSxcbiAgICAgICAgY2VsbChzcGFuKCB0aW1lU3RyaW5nKHBhdGguZGlzdCksIHN0eWxlKHtmbG9hdDogXCJyaWdodFwifSkpKSxcbiAgICAgICAgY2VsbChzcGFuKHByaWNlU3RyaW5nKHIudmFsdWUpLCBzdHlsZSh7ZmxvYXQ6IFwicmlnaHRcIn0pKSksXG4gICAgICAgIGNlbGwoc3Bhbih0aW1lU3RyaW5nKHIuZGVhZGxpbmUpLCBzdHlsZSh7ZmxvYXQ6IFwicmlnaHRcIn0pKSksXG4gICAgICApXG4gICAgICByb3cub25tb3VzZWVudGVyID0gKCk9PntcbiAgICAgICAgcm93LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmdyYXksXG4gICAgICAgIGhpZ2h0TGlnaHRzLnNldChbeyBwb2ludHM6IFtcbiAgICAgICAgICB7IGxvY2F0aW9uOiByLnN0YXJ0UG9pbnQsIGxvZ286IFwi8J+TplwiIH0sXG4gICAgICAgICAgeyBsb2NhdGlvbjogci5lbmRQb2ludCwgbG9nbzogXCLwn4+gXCIgfVxuICAgICAgICBdfV0pXG5cbiAgICAgIH1cbiAgICAgIHJvdy5vbm1vdXNlbGVhdmUgPSAoKT0+e1xuICAgICAgICByb3cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJcIlxuICAgICAgfVxuICAgICAgcmV0dXJuIHJvd1xuICAgIH0pXG5cbiAgKVxuXG59IiwKICAgICJpbXBvcnQgdHlwZSB7IEpzb25EYXRhIH0gZnJvbSBcIi4vc2NoZW1hXCJcblxuXG5leHBvcnQgZnVuY3Rpb24gbWtXcml0YWJsZTxUIGV4dGVuZHMgSnNvbkRhdGE+ICh2YWx1ZTogVCkge1xuXG5cbiAgbGV0IGxpc3RlbmVyczogKChuZXdWYWx1ZTogVCwgb2xkVmFsdWU6IFQpPT52b2lkKVtdID0gW11cbiAgbGV0IHJlcCA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXG4gIGxldCByZXMgPSB7XG4gICAgZ2V0OiAoKSA9PiB2YWx1ZSxcbiAgICBzZXQ6IChuZXdWYWx1ZTogVCkgPT4ge1xuICAgICAgbGV0IG5ld1JlcCA9IEpTT04uc3RyaW5naWZ5KG5ld1ZhbHVlKVxuICAgICAgaWYgKG5ld1JlcCA9PT0gcmVwKSByZXR1cm5cbiAgICAgIHJlcCA9IG5ld1JlcFxuICAgICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihuZXdWYWx1ZSwgdmFsdWUpKVxuICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuICAgIH0sXG4gICAgb251cGRhdGU6IChsaXN0ZW5lcjogKG5ld1ZhbHVlOiBULCBvbGRWYWx1ZSA6VCk9PnZvaWQpID0+IHtcbiAgICAgIGxpc3RlbmVyKHZhbHVlLCB2YWx1ZSlcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKVxuICAgIH0sXG4gICAgdXBkYXRlOiAoY2FsbGJhY2s6IChvbGRWYWx1ZTogVCk9PlQgfCB1bmRlZmluZWQpID0+IHtcbiAgICAgIGxldCBuZXdWYWx1ZSA9IGNhbGxiYWNrKHZhbHVlKSA/PyB2YWx1ZVxuICAgICAgcmVzLnNldChuZXdWYWx1ZSlcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiByZXNcblxufVxuXG5cbiIsCiAgICAiaW1wb3J0IHsgdW5pdF9jb25zdCwgdW5pdF9pYWRkLCB0eXBlIFNjaGVkdWxlSXRlbSwgdHlwZSBVVUlEIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBnZXRDb3N0LCBvcHREdXIsIG9wdGltaXplU2NoZWR1bGUsIHJhdGVTY2hlZHVsZSB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyBta1dyaXRhYmxlIH0gZnJvbSBcIi4uL3dyaXRlYWJsZVwiO1xuaW1wb3J0IHsgYm9keSwgYnV0dG9uLCBjb2xvciwgZGl2LCBoMiwgaHRtbCwgcCwgcGFkZGluZywgc3Bhbiwgc3R5bGUsIHRhYmxlLCB0ZCwgdHIsIHdpZHRoIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgaGlnaHRMaWdodHMsIHJlcXVlc3RzLCByb2FkTWFwLCBzY2hlZHVsZSB9IGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IGxvY1N0cmluZywgdGltZVN0cmluZywgdHJhbnNwb3J0ZXJTdHJpbmcgfSBmcm9tIFwiLi9yZXF1ZXN0Vmlld1wiO1xuXG5cbmZ1bmN0aW9uIHN0ZXBMb2dvIChzdGVwOiBTY2hlZHVsZUl0ZW1bJ3N0ZXBzJ11bbnVtYmVyXSl7XG4gIGlmIChzdGVwLiQgPT0gXCJzdGFydFwiKSByZXR1cm4gJ/CfmpsnXG4gIGlmIChzdGVwLiQgPT0gXCJwaWNrdXBcIikgcmV0dXJuICfwn5OmJ1xuICBpZiAoc3RlcC4kID09IFwiZGVsaXZlclwiKSByZXR1cm4gJ/Cfj6AnXG4gIHRocm93IG5ldyBFcnJvcihcInVuZXhwZWN0ZWQgdGFnOlwiLCBzdGVwKVxufVxuXG5cblxubGV0IGN1cnNvciA9IG1rV3JpdGFibGUoe3JvdzogMSwgY29sOiAxfSlcblxuYm9keS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBlPT57XG4gIGN1cnNvci51cGRhdGUoKGN1cnNvcikgPT57XG4gICAgaWYgKGN1cnNvci5jb2wgPT0gLTEpIHJldHVyblxuICAgIGlmIChlLmtleSA9PSBcIkFycm93TGVmdFwiKSAgICAgICAgIGN1cnNvci5jb2wgLT0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dSaWdodFwiKSAgIGN1cnNvci5jb2wgKz0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dVcFwiKSAgICAgIGN1cnNvci5yb3cgLT0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiQXJyb3dEb3duXCIpICAgIGN1cnNvci5yb3cgKz0gMVxuICAgIGVsc2UgaWYgKGUua2V5ID09IFwiRXNjYXBlXCIpICAgICAgIGN1cnNvciA9IHtyb3c6IC0xLCBjb2w6IC0xfVxuICAgIGVsc2UgcmV0dXJuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY3Vyc29yLnJvdyA9IE1hdGgubWF4KDAsIE1hdGgubWluKCBzY2hlZHVsZS5nZXQoKS5sZW5ndGgtMSwgY3Vyc29yLnJvdykpXG4gICAgY3Vyc29yLmNvbCA9IE1hdGgubWF4KDAsIE1hdGgubWluKCBzY2hlZHVsZS5nZXQoKVtjdXJzb3Iucm93XSEuc3RlcHMubGVuZ3RoLTEsIGN1cnNvci5jb2wpKVxuICB9KVxuXG59KVxuXG5cblxuZXhwb3J0IGNvbnN0IHNjaGVkdWxlVmlldyA9ICgpID0+IHtcblxuICBsZXQgY2VsbCA9ICgoLi4ueCkgPT4gdGQoc3R5bGUoe1xuICAgIGJvcmRlcjogXCIxcHggc29saWQgdmFyKC0tZ3JheSlcIixcbiAgICBtYXJnaW46IFwiMFwiLFxuICAgIHBhZGRpbmc6IFwiLjNlbSAuNWVtXCIsXG4gICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICB3aGl0ZVNwYWNlOiBcIm5vd3JhcFwiLFxuICB9KSwgLi4ueCkpIGFzIHR5cGVvZiB0ZDtcblxuICBsZXQgdGFidmlldyA9IGRpdigpXG4gIGxldCBzdGVwdmlldyA9IGRpdigpXG4gIGxldCBzdGVwRWxzID0gW10gYXMgSFRNTFNwYW5FbGVtZW50W11bXVxuICBsZXQgcm93RWxzID0gW10gYXMgSFRNTFRhYmxlUm93RWxlbWVudFtdXG5cbiAgc2NoZWR1bGUub251cGRhdGUoc2NoZWQgPT4ge1xuXG5cbiAgICBjdXJzb3Iub251cGRhdGUoY3Vyc29yPT57XG5cbiAgICAgIGxldCB7cm93LCBjb2w6IG59ID0gY3Vyc29yXG5cbiAgICAgIGxldCBzdGVwcyA9IHNjaGVkW3Jvd10hLnN0ZXBzXG4gICAgICBsZXQgc3RlcCA9IHN0ZXBzW25dXG4gICAgICBpZiAoIXN0ZXApIHJldHVyblxuXG4gICAgICBsZXQgcmVxdWVzdCA9IHN0ZXAuJCA9PSBcInN0YXJ0XCIgPyB1bmRlZmluZWQgOiBzdGVwLnZhbC5yZXF1ZXN0XG5cbiAgICAgIHN0ZXBFbHMuZm9yRWFjaCgocm93RWxzLCByb3duKT0+e1xuICAgICAgICByb3dFbHMuZm9yRWFjaCgoZWwsaSk9PntcbiAgICAgICAgICBsZXQgc3RlcCA9IHNjaGVkW3Jvd25dIS5zdGVwc1tpXVxuICAgICAgICAgIGlmICghc3RlcCkgcmV0dXJuXG4gICAgICAgICAgbGV0IGJhY2tncm91bmQgPSAnJ1xuICAgICAgICAgIGlmIChpID09IG4gJiYgcm93ID09IHJvd24pIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQgPSBjb2xvci5ncmVlbiAgXG4gICAgICAgICAgICB2aWV3U3RlcChyb3csIG4sIHN0ZXB2aWV3KVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChzdGVwLiQgIT0gXCJzdGFydFwiICYmIHN0ZXAudmFsLnJlcXVlc3QgPT0gcmVxdWVzdCkgYmFja2dyb3VuZCA9IGNvbG9yLmdyYXlcbiAgICAgICAgICBlbC5zdHlsZS5iYWNrZ3JvdW5kID0gYmFja2dyb3VuZFxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgbGV0IGxvZ28gPSBzdGVwTG9nbyhzdGVwKVxuXG4gICAgICBoaWdodExpZ2h0cy5zZXQoW1xuICAgICAgICB7IHBvaW50czogc3RlcHMuc2xpY2UobixuKzIpLm1hcCgocCxpKT0+KHtsb2NhdGlvbjogcC52YWwucG9zfSkpLCBjb2xvcjogXCIjZmZjOTg4XCIgfSxcbiAgICAgICAgeyBwb2ludHM6IFt7bG9jYXRpb246c3RlcC52YWwucG9zLCBsb2dvfV0gfVxuICAgICAgXSlcbiAgICB9KVxuXG5cbiAgICB0YWJ2aWV3LnJlcGxhY2VDaGlsZHJlbih0YWJsZShcbiAgICAgIFtcInRyYW5zcG9ydGVyXCIsIFwic3RlcHNcIl0ubWFwKGg9PiBjZWxsKGgpLCApLCBzdHlsZSh7Zm9udFdlaWdodDogXCJib2xkXCJ9KSxcbiAgICAgIHNjaGVkLm1hcCgocywgcm93bik9PntcblxuICAgICAgICBsZXQgYWxsUG9pbnRzID0gcy5zdGVwcy5tYXAoc3RlcD0+ICh7IGxvY2F0aW9uOiBzdGVwLnZhbC5wb3MsIGxvZ286IHN0ZXBMb2dvKHN0ZXApIH0pKVxuICAgICAgICBsZXQgdHJhbnNwb3J0ID0gc3Bhbih0cmFuc3BvcnRlclN0cmluZyhzLnRyYW5zcG9ydGVyKSlcbiAgICAgICAgdHJhbnNwb3J0Lm9ubW91c2VlbnRlciA9ICgpPT5oaWdodExpZ2h0cy5zZXQoW3twb2ludHM6IGFsbFBvaW50cywgY29sb3I6IFwiI2ZmYzk4OFwiLH1dKVxuXG4gICAgICAgIHN0ZXBFbHMucHVzaCggcy5zdGVwcy5tYXAoKHN0ZXAsaSk9PntcbiAgICAgICAgICBsZXQgbG9nbyA9IHN0ZXBMb2dvKHN0ZXApXG4gICAgICAgICAgbGV0IHJlcyA9IHNwYW4obG9nbywgc3R5bGUoe3BhZGRpbmc6IFwiLjNlbSAuM2VtXCIsfSkpXG5cbiAgICAgICAgICByZXMub25jbGljayA9ICgpPT57XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNMSUNLXCIsIHJvd24sIGkpXG4gICAgICAgICAgICBjdXJzb3Iuc2V0KHtyb3c6IHJvd24sIGNvbDogaX0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXNcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbGV0IHJvdz0gdHIoY2VsbCh0cmFuc3BvcnQpLCBjZWxsKHN0ZXBFbHNbcm93bl0hKSlcbiAgICAgICAgcm93RWxzLnB1c2gocm93KVxuICAgICAgICByZXR1cm4gcm93XG4gICAgICB9KSxcbiAgICAgIHN0eWxlKHsgYm9yZGVyQ29sbGFwc2U6IFwiY29sbGFwc2VcIiwgfSksXG4gICAgKSlcblxuXG5cbiAgfSlcblxuICBsZXQgdmFsdWUgPSBzcGFuKClcbiAgc2NoZWR1bGUub251cGRhdGUoc2NoPT52YWx1ZS50ZXh0Q29udGVudCA9IHJhdGVTY2hlZHVsZShzY2gpLnRvRml4ZWQoMikpXG5cblxuICBsZXQgc2NoZWR1bGVFbCA9IGRpdihcbiAgICBzdHlsZSh7XG4gICAgICB3aWR0aDogXCJjYWxjKDEwMCUgLSAyZW0pXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgb3ZlcmZsb3c6IFwiYXV0b1wiLFxuICAgICAgbWluV2lkdGg6IFwiMFwiLFxuICAgICAgcGFkZGluZzogXCIuNWVtXCIsXG4gICAgfSksXG4gICAgdGFidmlldyxcbiAgICBwKFwiVmFsdWU6IFwiLCB2YWx1ZSksXG4gICAgcChcInNlYXJjaCB0aW1lOlwiLCBvcHREdXIpLFxuICAgIHN0ZXB2aWV3LFxuICApXG4gIHJldHVybiBzY2hlZHVsZUVsXG59XG5cblxuXG5mdW5jdGlvbiB2aWV3U3RlcChyb3c6IG51bWJlciwgbjogbnVtYmVyLCBwYXJlbnQ6IEhUTUxFbGVtZW50KXtcbiAgbGV0IHN0ZXBzID0gc2NoZWR1bGUuZ2V0KClbcm93XVxuICBpZiAoIXN0ZXBzKSByZXR1cm5cbiAgbGV0IHN0ZXAgPSBzdGVwcy5zdGVwc1tuXVxuICBpZiAoIXN0ZXApIHJldHVyblxuXG4gIGxldCB0b3RhbERpc3QgPSB1bml0X2NvbnN0KDAsIFwic2Vjb25kc1wiKVxuICBsZXQgZGlzdCA9IHVuaXRfY29uc3QoMCxcInNlY29uZHNcIilcblxuICBsZXQgZGVja3MgPSBbW10sW11dIGFzIFtVVUlEW10sIFVVSURbXV1cblxuICBmb3IgKGxldCBpID0gMTsgaSA8IHN0ZXBzLnN0ZXBzLmxlbmd0aDsgaSsrKXtcbiAgICBpZiAoaSA8PSBuKSB7XG4gICAgICBsZXQgc3RlcCA9IHN0ZXBzLnN0ZXBzW2ldIVxuICAgICAgaWYgKHN0ZXAuJCA9PSBcInBpY2t1cFwiKSBkZWNrc1tzdGVwLnZhbC5kZWNrXS5wdXNoKHN0ZXAudmFsLnJlcXVlc3QpXG4gICAgICBpZiAoc3RlcC4kID09IFwiZGVsaXZlclwiKSBkZWNrcyA9IGRlY2tzLm1hcChkPT5kLmZpbHRlcihyPT5yICE9IHN0ZXAudmFsLnJlcXVlc3QpKSBhcyBbVVVJRFtdLCBVVUlEW11dXG4gICAgfVxuXG4gICAgdW5pdF9pYWRkKHRvdGFsRGlzdCwgZ2V0Q29zdChzdGVwcy5zdGVwc1tpLTFdIS52YWwucG9zLCBzdGVwcy5zdGVwc1tpXSEudmFsLnBvcykpXG4gICAgaWYgKGkgPT0gbikgZGlzdC52YWx1ZSA9IHRvdGFsRGlzdC52YWx1ZVxuICB9XG5cblxuXG4gIGxldCB2aXN1YWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKVxuICB2aXN1YWwuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxMDAlXCIpXG5cbiAgdmlzdWFsLnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgXCItMC4xIC0wLjEgMS4yIDEuMlwiKVxuICB2aXN1YWwuc2V0QXR0cmlidXRlKFwicHJlc2VydmVBc3BlY3RSYXRpb1wiLCBcInhNaWRZTWlkIG1lZXRcIilcblxuICBsZXQgdHJhbnNwb3J0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInBvbHlnb25cIilcbiAgbGV0IHBvaW50cyA9IFsgWy4yLCAwXSwgWy4wLCAuMl0sIFsuMCwgLjRdLCBbLjIsIC40XSwgWy44LCAuNF0sIFsuOCwgLjM3XSwgWy4yLCAuMzddLCBbLjIsIC4yXSwgWy44LCAuMl0sIFsuOCwgLjE3XSwgWy4yLCAuMTddLF1cbiAgdHJhbnNwb3J0ZXIuc2V0QXR0cmlidXRlKFwicG9pbnRzXCIsIHBvaW50cy5tYXAocD0+cC5qb2luKFwiLFwiKSkuam9pbihcIiBcIikpXG4gIHRyYW5zcG9ydGVyLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuYmx1ZSlcblxuICB2aXN1YWwuYXBwZW5kQ2hpbGQodHJhbnNwb3J0ZXIpXG5cblxuXG4gIGRlY2tzLmZvckVhY2goKGRlY2ssIGkpPT57XG4gICAgZGVjay5mb3JFYWNoKChyZXEsIGopPT57XG4gICAgICBsZXQgY2FyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJyZWN0XCIpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwieFwiLCAoMC4yMjUgKyAuMiAqIGopLnRvU3RyaW5nKCkpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwieVwiLCAoMC4yNSAtIDAuMiAgKiBpKS50b1N0cmluZygpKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiLjE1XCIpXG4gICAgICBjYXIuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiMC4xMlwiKVxuICAgICAgY2FyLnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuZ3JheSlcbiAgICAgIHZpc3VhbC5hcHBlbmRDaGlsZChjYXIpXG5cbiAgICAgIGxldCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJ0ZXh0XCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcInhcIiwgKDAuMjI1ICsgLjIgKiBqICsgMC4wNzUpLnRvU3RyaW5nKCkpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcInlcIiwgKDAuMjcgLSAwLjIgKiBpICsgMC4wNSkudG9TdHJpbmcoKSlcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwiZG9taW5hbnQtYmFzZWxpbmVcIiwgXCJtaWRkbGVcIilcbiAgICAgIHRleHQuc2V0QXR0cmlidXRlKFwiZm9udC1zaXplXCIsIFwiLjA2XCIpXG4gICAgICB0ZXh0LnNldEF0dHJpYnV0ZShcImZpbGxcIiwgY29sb3IuY29sb3IpXG4gICAgICB0ZXh0LnRleHRDb250ZW50ID0gYCR7cmVxdWVzdHMuZmluZEluZGV4KHI9PnIuaWQgPT0gcmVxKS50b1N0cmluZygpLnBhZFN0YXJ0KDQsICcwJyl9YFxuICAgICAgdmlzdWFsLmFwcGVuZENoaWxkKHRleHQpXG4gICAgICBcbiAgICB9KVxuICB9KVxuXG4gIGZvciAobGV0IHggb2YgWzAuMiwgMC42XSl7XG4gICAgbGV0IHRpcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcImNpcmNsZVwiKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiY3hcIiwgeC50b1N0cmluZygpKVxuICAgIHRpcmUuc2V0QXR0cmlidXRlKFwiY3lcIiwgXCIwLjVcIilcbiAgICB0aXJlLnNldEF0dHJpYnV0ZShcInJcIiwgXCIwLjA3XCIpXG4gICAgdGlyZS5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGNvbG9yLmJsdWUpXG4gICAgdmlzdWFsLmFwcGVuZENoaWxkKHRpcmUpXG4gIH1cbiAgbGV0IHJlcyA9IGRpdihcbiAgICBoMih0cmFuc3BvcnRlclN0cmluZyhzdGVwcy50cmFuc3BvcnRlcikpLFxuICAgIHAoYGRpc3RhbmNlOiAke3RpbWVTdHJpbmcoZGlzdCl9IC8gJHt0aW1lU3RyaW5nKHRvdGFsRGlzdCl9YCksXG4gICAgc3R5bGUoe1xuICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCB2YXIoLS1ncmF5KVwiLFxuICAgICAgbWFyZ2luOiBcIjBcIixcbiAgICAgIHBhZGRpbmc6IFwiLjNlbSAuNWVtXCIsXG4gICAgICBtaW5IZWlnaHQ6IFwiMmVtXCIsXG4gICAgfSlcbiAgKVxuXG4gIHJlcy5hcHBlbmQodmlzdWFsKVxuICBwYXJlbnQucmVwbGFjZUNoaWxkcmVuKHJlcylcbn1cbiIsCiAgICAiaW1wb3J0IHsgaGFzaCB9IGZyb20gXCIuLi9oYXNoXCI7XG5pbXBvcnQgeyBib2R5LCBidXR0b24sIGNvbG9yLCBkaXYsIGVycm9ycG9wdXAsIGgxLCBoMiwgaDMsIGlucHV0LCBtYXJnaW4sIHAsIHBhZGRpbmcsIHBvcHVwLCBwcmUsIHNwYW4sIHN0eWxlLCB0YWJsZSwgd2lkdGgsIHRleHRhcmVhLCBhLCBib3JkZXIsIGh0bWwsIHRoLCB0ciwgdGQsIGJvcmRlclJhZGl1cywgcGFuZWxMaXN0LCBkaXNwbGF5LCBiYWNrZ3JvdW5kIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgbWFwVmlldyB9IGZyb20gXCIuL21hcFZpZXdcIjtcbmltcG9ydCB7IHJhbmRvbU1hcCB9IGZyb20gXCIuLi9yYW5kb21NYXBcIjtcbmltcG9ydCB7IExvY2F0aW9uLCByYW5kb21VVUlELCBSZXF1ZXN0LCBTY2hlZHVsZSwgdW5pdF9jb25zdCwgVVVJRCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgcmVxdWVzdFZpZXcgfSBmcm9tIFwiLi9yZXF1ZXN0Vmlld1wiO1xuaW1wb3J0IHsgc2NoZWR1bGVWaWV3IH0gZnJvbSBcIi4vc2NoZWR1bGVWaWV3XCI7XG5pbXBvcnQgeyBta1dyaXRhYmxlIH0gZnJvbSBcIi4uL3dyaXRlYWJsZVwiO1xuaW1wb3J0IHsgb3B0aW1pemVTY2hlZHVsZSB9IGZyb20gXCIuLi9wbGFubmVyXCI7XG5pbXBvcnQgeyByYW5kQ2hvaWNlLCByYW5kb20sIHNldFJhbmRTZWVkIH0gZnJvbSBcIi4uL3JhbmRvbVwiO1xuXG5cbmJvZHkuc3R5bGUubWFyZ2luID0gXCIwXCJcblxubGV0IGhlYWRlciA9IGgxKFwicm91dGUgcGxhbm5lclwiLCBzdHlsZSh7YmFja2dyb3VuZDogY29sb3IuYmx1ZSwgY29sb3I6IGNvbG9yLmJhY2tncm91bmQsIG1hcmdpbjogXCIwXCIsIHBhZGRpbmc6IFwiLjZlbVwifSkpXG5cbmxldCBjb250ZW50U3BhY2UgPSBkaXYoc3R5bGUoe1xuICBkaXNwbGF5OlwiZmxleFwiLFxuICBmbGV4RGlyZWN0aW9uOlwicm93XCIsXG4gIHdpZHRoOiBcIjEwMCVcIixcbiAgaGVpZ2h0OiBcImNhbGMoMTAwJSAtIDIuNWVtKVwiLFxuICBtaW5XaWR0aDogXCIwXCIsXG59KSlcblxubGV0IHBhZ2UgPSBkaXYoXG4gIHN0eWxlKHtkaXNwbGF5OlwiZmxleFwiLCBmbGV4RGlyZWN0aW9uOlwiY29sdW1uXCIsIGhlaWdodDogXCIxMDAlXCJ9KSxcbiAgaGVhZGVyLFxuICBjb250ZW50U3BhY2VcbilcblxuYm9keS5yZXBsYWNlQ2hpbGRyZW4ocGFnZSlcblxuXG5zZXRSYW5kU2VlZCgyNClcblxuXG5leHBvcnQgbGV0IHJvYWRNYXAgPSByYW5kb21NYXAoKVxuXG5leHBvcnQgbGV0IHJlcXVlc3RzOiBSZXF1ZXN0W10gPSBBcnJheS5mcm9tKHtsZW5ndGg6MjB9LCAoXyxpKT0+KHtcbiAgaWQ6IHJhbmRvbVVVSUQoKSxcbiAgc3RhcnRQb2ludDogcmFuZENob2ljZShyb2FkTWFwLnBvaW50cyksXG4gIGVuZFBvaW50OiByYW5kQ2hvaWNlKHJvYWRNYXAucG9pbnRzKSxcbiAgdmFsdWU6IHVuaXRfY29uc3QoTWF0aC5mbG9vcihyYW5kb20oKSoxMDAwKSwgXCJldXJcIiksXG4gIGRlYWRsaW5lOiB1bml0X2NvbnN0KE1hdGguZmxvb3IocmFuZG9tKCkqNjAqNjAqMjQqNyksIFwic2Vjb25kc1wiKSxcbn0pKVxuXG5cbmV4cG9ydCBsZXQgc2NoZWR1bGUgPSBta1dyaXRhYmxlPFNjaGVkdWxlPiAoQXJyYXkuZnJvbSh7bGVuZ3RoOiAzfSwgKF8saSk9Pih7XG4gIHRyYW5zcG9ydGVyOiByYW5kb21VVUlEKCksXG4gIHN0ZXBzOiBbeyAkOlwic3RhcnRcIiwgdmFsOiB7XCJwb3NcIjogIHJhbmRDaG9pY2Uocm9hZE1hcC5wb2ludHMpfX1dXG59KSkpXG5cblxuXG5zY2hlZHVsZS51cGRhdGUoc2NoZWQ9Pm9wdGltaXplU2NoZWR1bGUocmVxdWVzdHMsIHNjaGVkKSlcblxuXG5leHBvcnQgdHlwZSBIaWdoTGlnaHQgPSB7XG4gIHBvaW50czoge1xuICAgIGxvY2F0aW9uOiBMb2NhdGlvbixcbiAgICBsb2dvPyA6IHN0cmluZyxcbiAgfVtdLFxuICBjb2xvcj86IHN0cmluZ1xufVxuXG5leHBvcnQgbGV0IGhpZ2h0TGlnaHRzID0gbWtXcml0YWJsZSA8SGlnaExpZ2h0W10+KCBbXSApXG5cblxuZnVuY3Rpb24gbWtXaW5kb3cgKHRhYjogbnVtYmVyID0gMCApIHtcblxuICBsZXQgdGFiRmllbGRzID0gW1xuICAgIFsnbWFwJywgbWFwVmlldyhyb2FkTWFwKV0sXG4gICAgWydyZXF1ZXN0cycsIHJlcXVlc3RWaWV3KHJlcXVlc3RzLCBzY2hlZHVsZS5nZXQoKSldLFxuICAgIFsnc2NoZWR1bGUnLCBzY2hlZHVsZVZpZXcoKSBdLFxuICBdIGFzIGNvbnN0XG5cbiAgY29uc3QgZWwgPSBkaXYoc3R5bGUoe1xuICAgIGZsZXg6IFwiMSAxIDBcIixcbiAgICBtaW5XaWR0aDogXCIwXCIsXG4gICAgaGVpZ2h0OiBcImNhbGMoMTAwdmggLSAxZW0pXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgIG92ZXJmbG93OiBcImhpZGRlblwiLFxuICB9KSlcblxuICBmdW5jdGlvbiBvcGVuVGFiKHRhYjogdHlwZW9mIHRhYkZpZWxkc1tudW1iZXJdWzBdKSB7XG4gICAgZWwucmVwbGFjZUNoaWxkcmVuKFxuICAgICAgcCh0YWJGaWVsZHMubWFwKChbbixlXSk9PlxuICAgICAgICBzcGFuKCBuLFxuICAgICAgICAgICgpPT5vcGVuVGFiKG4pLFxuICAgICAgICAgIHN0eWxlKHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiLjNlbVwiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIi4zZW1cIixcbiAgICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiKyAobj09dGFiID8gY29sb3IuY29sb3IgOiBjb2xvci5ncmF5KSxcbiAgICAgICAgICAgIGNvbG9yOiAobj09dGFiKSA/IGNvbG9yLmNvbG9yIDogY29sb3IuZ3JheSxcbiAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgICApKSxcbiAgICAgIHRhYkZpZWxkcy5maW5kKChbbixdKT0+bj09dGFiKSFbMV1cbiAgICApXG4gIH1cblxuXG4gIG9wZW5UYWIodGFiRmllbGRzW3RhYl0hWzBdKVxuXG4gIHJldHVybiBlbFxufVxuXG5jb250ZW50U3BhY2UucmVwbGFjZUNoaWxkcmVuKG1rV2luZG93KDIgKSwgbWtXaW5kb3coKSlcbiIK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LEVBQ3JDLFVBQVUsV0FBVyxRQUFRLE1BQU07QUFBQSxFQUNuQyxPQUFPLFdBQVcsS0FBSyxNQUFNLE9BQU8sSUFBRSxJQUFJLEdBQUcsS0FBSztBQUFBLEVBQ2xELFVBQVUsV0FBVyxLQUFLLE1BQU0sT0FBTyxJQUFFLEtBQUcsS0FBRyxLQUFHLENBQUMsR0FBRyxTQUFTO0FBQ2pFLEVBQUU7QUFHSyxJQUFJLFdBQVcsV0FBc0IsTUFBTSxLQUFLLEVBQUMsUUFBUSxFQUFDLEdBQUcsQ0FBQyxHQUFFLE9BQUs7QUFBQSxFQUMxRSxhQUFhLFdBQVc7QUFBQSxFQUN4QixPQUFPLENBQUMsRUFBRSxHQUFFLFNBQVMsS0FBSyxFQUFDLEtBQVEsV0FBVyxRQUFRLE1BQU0sRUFBQyxFQUFDLENBQUM7QUFDakUsRUFBRSxDQUFDO0FBSUgsU0FBUyxPQUFPLFdBQU8saUJBQWlCLFVBQVUsS0FBSyxDQUFDO0FBV2pELElBQUksY0FBYyxXQUEwQixDQUFDLENBQUU7QUFHdEQsU0FBUyxRQUFTLENBQUMsTUFBYyxHQUFJO0FBQUEsRUFFbkMsSUFBSSxZQUFZO0FBQUEsSUFDZCxDQUFDLE9BQU8sUUFBUSxPQUFPLENBQUM7QUFBQSxJQUN4QixDQUFDLFlBQVksWUFBWSxVQUFVLFNBQVMsSUFBSSxDQUFDLENBQUM7QUFBQSxJQUNsRCxDQUFDLFlBQVksYUFBYSxDQUFFO0FBQUEsRUFDOUI7QUFBQSxFQUVBLE1BQU0sS0FBSyxJQUFJLE1BQU07QUFBQSxJQUNuQixNQUFNO0FBQUEsSUFDTixVQUFVO0FBQUEsSUFDVixRQUFRO0FBQUEsSUFDUixRQUFRLGVBQWEsTUFBTTtBQUFBLElBQzNCLFVBQVU7QUFBQSxFQUNaLENBQUMsQ0FBQztBQUFBLEVBRUYsU0FBUyxPQUFPLENBQUMsTUFBa0M7QUFBQSxJQUNqRCxHQUFHLGdCQUNELEVBQUUsVUFBVSxJQUFJLEVBQUUsR0FBRSxPQUNsQixLQUFNLEdBQ0osTUFBSSxRQUFRLENBQUMsR0FDYixNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixRQUFRO0FBQUEsTUFDUixRQUFRLGdCQUFlLEtBQUcsT0FBTSxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ3BELE9BQVEsS0FBRyxPQUFPLE1BQU0sUUFBUSxNQUFNO0FBQUEsSUFDeEMsQ0FBQyxDQUNILENBQ0YsQ0FBQyxHQUNELFVBQVUsS0FBSyxFQUFFLE9BQU0sS0FBRyxJQUFHLEVBQUcsRUFDbEM7QUFBQTtBQUFBLEVBSUYsUUFBUSxVQUFVLEtBQU0sRUFBRTtBQUFBLEVBRTFCLE9BQU87QUFBQTtBQUdULGFBQWEsZ0JBQWdCLFNBQVMsQ0FBRSxHQUFHLFNBQVMsQ0FBQzsiLAogICJkZWJ1Z0lkIjogIjVCOUFFRkJBREM0QjMzQUU2NDc1NkUyMTY0NzU2RTIxIiwKICAibmFtZXMiOiBbXQp9
