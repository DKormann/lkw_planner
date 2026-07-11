// src/wasm.ts
var magic = [0, 97, 115, 109, 1, 0, 0, 0];
var numTypes = ["i32", "i64", "f32", "f64"];
var binOps = ["add", "sub", "mul", "div"];
var cmpOps = ["eq", "lt", "gt"];
var codes = {
  type: { i32: 127, i64: 126, f32: 125, f64: 124 },
  bin: {
    add: { i32: 106, i64: 124, f32: 146, f64: 160 },
    sub: { i32: 107, i64: 125, f32: 147, f64: 161 },
    mul: { i32: 108, i64: 126, f32: 148, f64: 162 },
    div: { i32: 109, i64: 127, f32: 149, f64: 163 }
  },
  cmp: {
    eq: { i32: 70, i64: 81, f32: 91, f64: 97 },
    lt: { i32: 72, i64: 83, f32: 93, f64: 99 },
    gt: { i32: 74, i64: 85, f32: 94, f64: 100 }
  },
  load: { i32: 40, i64: 41, f32: 42, f64: 43 },
  store: { i32: 54, i64: 55, f32: 56, f64: 57 },
  bytes: { i32: 4, i64: 8, f32: 4, f64: 8 },
  align: { i32: 2, i64: 3, f32: 2, f64: 3 }
};
var u32 = (n) => {
  if (!Number.isInteger(n) || n < 0)
    throw new Error(`Expected unsigned integer, got ${n}`);
  const out = [];
  do {
    let byte = n & 127;
    n >>>= 7;
    if (n)
      byte |= 128;
    out.push(byte);
  } while (n);
  return out;
};
var sN = (value, bits) => {
  const out = [];
  let n = bits === 32 ? BigInt(value | 0) : BigInt.asIntN(64, value);
  for (;; ) {
    let byte = Number(n & 0x7fn);
    n >>= 7n;
    const done = n === 0n && (byte & 64) === 0 || n === -1n && (byte & 64) !== 0;
    if (!done)
      byte |= 128;
    out.push(byte);
    if (done)
      return out;
  }
};
var fN = (value, bytes) => {
  const out = new Uint8Array(bytes);
  const view = new DataView(out.buffer);
  bytes === 4 ? view.setFloat32(0, value, true) : view.setFloat64(0, value, true);
  return [...out];
};
var str = (s) => {
  const bytes = new TextEncoder().encode(s);
  return [...u32(bytes.length), ...bytes];
};
var section = (id, payload) => [id, ...u32(payload.length), ...payload];
var flatMap = (xs, fn) => xs.flatMap(fn);
var die = (x) => {
  throw new Error(`Unexpected value: ${String(x)}`);
};
var nextFuncId = 0;
var nextLocalId = 0;
var nextArrayId = 0;
var nextControlId = 0;
var arrayRegistry = new Map;
var inferType = (value) => typeof value === "object" && value !== null && ("type" in value) ? value.type : "i32";
var addExprOps = (e) => {
  for (const op of binOps)
    e[op] = (r) => bin(op, e, r);
  for (const op of cmpOps)
    e[op] = (r) => cmp(op, e, r);
  return e;
};
var expr = (node) => {
  return addExprOps(node);
};
var lit = (type, value) => {
  if (typeof value === "object" && value !== null) {
    if ("kind" in value)
      return value;
    if ("get" in value)
      return value.get();
  }
  return expr({ kind: "const", type, value });
};
var isStmt = (x) => !!x && typeof x === "object" && ("kind" in x) && (x.kind === "local.set" || x.kind === "array.store" || x.kind === "block" || x.kind === "loop" || x.kind === "break" || x.kind === "continue" || x.kind === "return" || x.kind === "expr" || x.kind === "if" && Array.isArray(x.then));
var stmtList = (body) => Array.isArray(body) ? body : [body];
var bindStmts = (body, br, loop) => stmtList(body).map((s) => bindStmt(s, br, loop));
var bindStmt = (s, br, loop) => {
  switch (s.kind) {
    case "if":
      return { ...s, then: bindStmts(s.then, br, loop), else: bindStmts(s.else, br, loop) };
    case "break":
      return { ...s, target: s.target ?? br };
    case "continue":
      if (s.target != null)
        return s;
      if (loop == null)
        throw new Error("continueTo() used outside a loop");
      return { ...s, target: loop };
    default:
      return s;
  }
};
var controlBody = (self, body) => bindStmts(typeof body === "function" ? body(self) : body, self.id, self.kind === "loop" ? self.id : null);
var bin = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var cmp = (op, left, right) => expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) });
var localExpr = (type, local) => expr({ kind: "local.get", type, local });
var mkLocal = (type) => {
  const id = nextLocalId++;
  const get = () => localExpr(type, id);
  const set = (value) => ({ kind: "local.set", local: id, type, value: lit(type, value) });
  const out = {
    id,
    type,
    get,
    set,
    add: (right) => get().add(right),
    sub: (right) => get().sub(right),
    mul: (right) => get().mul(right),
    div: (right) => get().div(right),
    eq: (right) => get().eq(right),
    lt: (right) => get().lt(right),
    gt: (right) => get().gt(right),
    iadd: (right) => set(get().add(right)),
    isub: (right) => set(get().sub(right)),
    imul: (right) => set(get().mul(right)),
    idiv: (right) => set(get().div(right))
  };
  return out;
};
var mkHandle = (params, result, build) => {
  const id = nextFuncId++;
  return {
    kind: "func",
    id,
    params,
    result,
    build,
    call: (...args) => expr({ kind: "call", type: result, target: id, args })
  };
};
var mkArray = (type, length) => {
  if (!Number.isInteger(length) || length <= 0)
    throw new Error(`Invalid array length ${length}`);
  const id = nextArrayId++;
  const handle = {
    kind: "array",
    id,
    type,
    length,
    load: (index) => expr({ kind: "load", type, array: id, index: lit("i32", index) }),
    store: (index, value) => ({ kind: "array.store", array: id, type, index: lit("i32", index), value: lit(type, value) })
  };
  arrayRegistry.set(id, handle);
  return handle;
};
var func = (params, result, build) => mkHandle(params, result, build);
var array = (type, length) => mkArray(type, length);
var local = Object.fromEntries(numTypes.map((type) => [type, () => mkLocal(type)]));
var ret = (value) => ({
  kind: "return",
  value: lit(inferType(value), value)
});
var loop = (cond, body) => {
  const self = { kind: "loop", id: nextControlId++ };
  return { kind: "loop", control: self.id, cond, body: controlBody(self, body) };
};
var whileLoop = loop;
var walkExpr = (e, fns) => {
  switch (e.kind) {
    case "const":
      return;
    case "local.get":
      fns.local?.(e.local, e.type);
      return;
    case "bin":
    case "cmp":
      walkExpr(e.left, fns);
      walkExpr(e.right, fns);
      return;
    case "call":
      e.args.forEach((arg) => walkExpr(arg, fns));
      return;
    case "if":
      walkExpr(e.cond, fns);
      walkExpr(e.then, fns);
      walkExpr(e.else, fns);
      return;
    case "load":
      fns.array?.(e.array);
      walkExpr(e.index, fns);
      return;
    default:
      die(e);
  }
};
var walkStmt = (s, fns) => {
  switch (s.kind) {
    case "local.set":
      fns.local?.(s.local, s.type);
      walkExpr(s.value, fns);
      return;
    case "array.store":
      fns.array?.(s.array);
      walkExpr(s.index, fns);
      walkExpr(s.value, fns);
      return;
    case "if":
      walkExpr(s.cond, fns);
      s.then.forEach((x) => walkStmt(x, fns));
      s.else.forEach((x) => walkStmt(x, fns));
      return;
    case "block":
      s.body.forEach((x) => walkStmt(x, fns));
      return;
    case "loop":
      walkExpr(s.cond, fns);
      s.body.forEach((x) => walkStmt(x, fns));
      return;
    case "break":
    case "continue":
      return;
    case "return":
      walkExpr(s.value, fns);
      return;
    case "expr":
      walkExpr(s.expr, fns);
      return;
    default:
      die(s);
  }
};
var addr = (layout, index) => index.mul(codes.bytes[layout.type]).add(layout.offset);
var memarg = (type, offset = 0) => [...u32(codes.align[type]), ...u32(offset)];
var constI32 = (e) => e.kind === "const" ? e.value : null;
var checkArrayBounds = (layout, index) => {
  const n = constI32(index);
  if (n == null)
    return;
  if (!Number.isInteger(n) || n < 0 || n >= layout.length)
    throw new Error(`Array index ${n} out of bounds for length ${layout.length}`);
};
var compileExpr = (e, fix, lix, arrays) => {
  switch (e.kind) {
    case "const":
      if (e.type === "i32")
        return [65, ...sN(e.value, 32)];
      if (e.type === "i64")
        return [66, ...sN(e.value, 64)];
      if (e.type === "f32")
        return [67, ...fN(e.value, 4)];
      if (e.type === "f64")
        return [68, ...fN(e.value, 8)];
      return die(e);
    case "local.get":
      return [32, ...u32(lix[e.local])];
    case "bin":
      return [...compileExpr(e.left, fix, lix, arrays), ...compileExpr(e.right, fix, lix, arrays), codes.bin[e.op][e.type]];
    case "cmp":
      return [...compileExpr(e.left, fix, lix, arrays), ...compileExpr(e.right, fix, lix, arrays), codes.cmp[e.op][e.inputType]];
    case "call":
      if (fix[e.target] == null)
        throw new Error(`Unknown function ${e.target}`);
      return [...flatMap(e.args, (arg) => compileExpr(arg, fix, lix, arrays)), 16, ...u32(fix[e.target])];
    case "if":
      return [...compileExpr(e.cond, fix, lix, arrays), 4, codes.type[e.type], ...compileExpr(e.then, fix, lix, arrays), 5, ...compileExpr(e.else, fix, lix, arrays), 11];
    case "load": {
      const layout = arrays[e.array];
      if (!layout)
        throw new Error(`Unknown array ${e.array}`);
      checkArrayBounds(layout, e.index);
      return [...compileExpr(addr(layout, e.index), fix, lix, arrays), codes.load[e.type], ...memarg(e.type)];
    }
    default:
      return die(e);
  }
};
var depth = (stack, control, kind) => {
  const i = stack.findIndex((x) => x.control === control && x.kind === kind);
  if (i < 0)
    throw new Error(`Unknown ${kind} target ${control}`);
  return i;
};
var compileStmt = (s, fix, lix, arrays, stack = []) => {
  switch (s.kind) {
    case "local.set":
      return [...compileExpr(s.value, fix, lix, arrays), 33, ...u32(lix[s.local])];
    case "array.store": {
      const layout = arrays[s.array];
      if (!layout)
        throw new Error(`Unknown array ${s.array}`);
      checkArrayBounds(layout, s.index);
      return [...compileExpr(addr(layout, s.index), fix, lix, arrays), ...compileExpr(s.value, fix, lix, arrays), codes.store[s.type], ...memarg(s.type)];
    }
    case "if":
      return [...compileExpr(s.cond, fix, lix, arrays), 4, 64, ...flatMap(s.then, (x) => compileStmt(x, fix, lix, arrays, [{}, ...stack])), ...s.else.length ? [5, ...flatMap(s.else, (x) => compileStmt(x, fix, lix, arrays, [{}, ...stack]))] : [], 11];
    case "block":
      return [2, 64, ...flatMap(s.body, (x) => compileStmt(x, fix, lix, arrays, [{ control: s.control, kind: "break" }, ...stack])), 11];
    case "loop":
      return [2, 64, 3, 64, ...compileExpr(s.cond, fix, lix, arrays), 69, 13, ...u32(1), ...flatMap(s.body, (x) => compileStmt(x, fix, lix, arrays, [{ control: s.control, kind: "continue" }, { control: s.control, kind: "break" }, ...stack])), 12, ...u32(0), 11, 11];
    case "break":
      if (s.target == null)
        throw new Error("breakTo() used outside a block or loop");
      return [12, ...u32(depth(stack, s.target, "break"))];
    case "continue":
      if (s.target == null)
        throw new Error("continueTo() used outside a loop");
      return [12, ...u32(depth(stack, s.target, "continue"))];
    case "return":
      return [...compileExpr(s.value, fix, lix, arrays), 15];
    case "expr":
      return [...compileExpr(s.expr, fix, lix, arrays), 26];
    default:
      return die(s);
  }
};
var arrayLayouts = (defs) => {
  let offset = 0;
  const entries = Object.entries(defs);
  const out = {};
  for (const [, arr] of entries) {
    out[arr.id] = { type: arr.type, length: arr.length, offset };
    offset += arr.length * codes.bytes[arr.type];
  }
  return { layouts: out, bytes: offset, entries };
};
var moduleFuncs = (mod) => Object.fromEntries(Object.entries(mod).filter(([, v]) => v.kind === "func"));
var moduleArrays = (mod) => Object.fromEntries(Object.entries(mod).filter(([, v]) => v.kind === "array"));
var buildFunc = (func2) => {
  const params = func2.params.map((type) => localExpr(type, nextLocalId++));
  return {
    func: func2,
    paramIds: params.map((p) => p.kind === "local.get" ? p.local : -1),
    built: func2.build?.(...params) ?? die(`Function ${func2.id} has no implementation`)
  };
};
var discoveredArrays = (builtFuncs) => {
  const used = new Set;
  for (const { built } of builtFuncs) {
    const body = Array.isArray(built) ? built : isStmt(built) ? [built] : null;
    body ? body.forEach((s) => walkStmt(s, { array: (id) => used.add(id) })) : walkExpr(built, { array: (id) => used.add(id) });
  }
  return Object.fromEntries([...used].map((id) => {
    const arr = arrayRegistry.get(id);
    if (!arr)
      throw new Error(`Unknown array ${id}`);
    return [String(id), arr];
  }));
};
var analyzeModule = (mod) => {
  const funcs = moduleFuncs(mod);
  const arrays = moduleArrays(mod);
  const fEntries = Object.entries(funcs);
  const builtFuncs = fEntries.map(([, func2]) => buildFunc(func2));
  const fix = Object.fromEntries(fEntries.map(([, def], i) => [def.id, i]));
  const touchedArrays = discoveredArrays(builtFuncs);
  const allArrays = { ...touchedArrays, ...arrays };
  const { layouts, bytes } = arrayLayouts(allArrays);
  return { funcs, arrays, fEntries, builtFuncs, fix, layouts, pages: Math.max(1, Math.ceil(bytes / 65536)) };
};
var emitModule = ({ fEntries, builtFuncs, fix, layouts, pages }) => {
  const functionSection = fEntries.flatMap((_, i) => u32(i));
  const exportSection = fEntries.flatMap(([name], i) => [...str(name), 0, ...u32(i)]);
  return new Uint8Array([
    ...magic,
    ...section(1, [...u32(fEntries.length), ...flatMap(fEntries, ([, f]) => [96, ...u32(f.params.length), ...f.params.map((t) => codes.type[t]), 1, codes.type[f.result]])]),
    ...section(3, [...u32(fEntries.length), ...functionSection]),
    ...section(5, [1, 0, ...u32(pages)]),
    ...section(7, [
      ...u32(fEntries.length + 1),
      ...exportSection,
      ...str("__mem"),
      2,
      ...u32(0)
    ]),
    ...section(10, [
      ...u32(fEntries.length),
      ...flatMap(builtFuncs, ({ func: func2, paramIds, built }) => {
        const locals = new Map;
        const stmts = Array.isArray(built) ? built : isStmt(built) ? [built] : null;
        stmts ? stmts.forEach((s) => walkStmt(s, { local: (id, type) => locals.set(id, type) })) : walkExpr(built, { local: (id, type) => locals.set(id, type) });
        paramIds.forEach((id) => locals.delete(id));
        const localEntries = [...locals.entries()];
        const lix = Object.fromEntries([...paramIds.map((id, i) => [id, i]), ...localEntries.map(([id], i) => [id, func2.params.length + i])]);
        const decls = [...u32(localEntries.length), ...flatMap(localEntries, ([, type]) => [...u32(1), codes.type[type]])];
        const code = stmts ? flatMap(stmts, (s) => compileStmt(s, fix, lix, layouts)) : compileExpr(built, fix, lix, layouts);
        const body = [...decls, ...code, 11];
        return [...u32(body.length), ...body];
      })
    ])
  ]);
};
var typedArrayCtor = (type) => {
  switch (type) {
    case "i32":
      return Int32Array;
    case "i64":
      return BigInt64Array;
    case "f32":
      return Float32Array;
    case "f64":
      return Float64Array;
    default:
      return die(type);
  }
};
var compile = async (mod) => {
  const analysis = analyzeModule(mod);
  const { funcs, arrays, layouts } = analysis;
  const wasm = await WebAssembly.instantiate(await WebAssembly.compile(emitModule(analysis).buffer));
  const exports = wasm.exports;
  const jsFuncs = Object.fromEntries(Object.keys(funcs).map((name) => [name, exports[name]]));
  const jsArrays = Object.entries(arrays).map(([name, arr]) => {
    const layout = layouts[arr.id];
    const Ctor = typedArrayCtor(arr.type);
    return [name, new Ctor(exports.__mem.buffer, layout.offset, arr.length)];
  });
  return Object.fromEntries([
    ...Object.entries(jsFuncs),
    ...jsArrays
  ]);
};

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

// src/view/main.ts
var xs = array("i32", 1024);
var ys = array("i32", 1024);
var out = array("i32", 1024);
var u = array("i32", 10);
var sumInto = func(["i32"], "i32", (n) => {
  const i = local.i32();
  return [
    i.set(0),
    whileLoop(i.lt(n), [
      out.store(i, xs.load(i).add(ys.load(i))),
      i.iadd(1)
    ]),
    ret(0)
  ];
});
var mod = await compile({
  sumInto,
  xs,
  ys,
  out
});
var n = 8;
for (let i = 0;i < n; i++) {
  mod.xs[i] = i;
  mod.ys[i] = i * 10;
}
var st = performance.now();
mod.sumInto(n);
var ms = performance.now() - st;
body.append(h2("wasm arrays"), p(`sumInto(${n}) in ${ms.toFixed(3)} ms`), p(`out = ${Array.from(mod.out.slice(0, n)).join(", ")}`));

//# debugId=3A13F52924B7AC1264756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3dhc20udHMiLCAic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgImNvbnN0IG1hZ2ljID0gWzB4MDAsIDB4NjEsIDB4NzMsIDB4NmQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4MDBdXG5jb25zdCBudW1UeXBlcyA9IFtcImkzMlwiLCBcImk2NFwiLCBcImYzMlwiLCBcImY2NFwiXSBhcyBjb25zdFxuY29uc3QgYmluT3BzID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdIGFzIGNvbnN0XG5jb25zdCBjbXBPcHMgPSBbXCJlcVwiLCBcImx0XCIsIFwiZ3RcIl0gYXMgY29uc3RcblxuZXhwb3J0IHR5cGUgTnVtVHlwZSA9IFwiaTMyXCIgfCBcImk2NFwiIHwgXCJmMzJcIiB8IFwiZjY0XCJcbmV4cG9ydCB0eXBlIEJpbk9wID0gXCJhZGRcIiB8IFwic3ViXCIgfCBcIm11bFwiIHwgXCJkaXZcIlxuZXhwb3J0IHR5cGUgQ21wT3AgPSBcImVxXCIgfCBcImx0XCIgfCBcImd0XCJcbnR5cGUgVmFsdWU8VCBleHRlbmRzIE51bVR5cGU+ID0gVCBleHRlbmRzIFwiaTY0XCIgPyBiaWdpbnQgOiBudW1iZXJcbnR5cGUgVHlwZWRBcnJheUZvcjxUIGV4dGVuZHMgTnVtVHlwZT4gPVxuICBUIGV4dGVuZHMgXCJpMzJcIiA/IEludDMyQXJyYXkgOlxuICBUIGV4dGVuZHMgXCJpNjRcIiA/IEJpZ0ludDY0QXJyYXkgOlxuICBUIGV4dGVuZHMgXCJmMzJcIiA/IEZsb2F0MzJBcnJheSA6XG4gIEZsb2F0NjRBcnJheVxuXG5leHBvcnQgdHlwZSBGdW5jU2lnPEFyZ3MgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFJldCBleHRlbmRzIE51bVR5cGU+ID0geyBwYXJhbXM6IEFyZ3MsIHJlc3VsdDogUmV0IH1cbnR5cGUgQXJnc0V4cHI8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IEV4cHI8QXJnc1tLXT4gOiBuZXZlciB9XG50eXBlIEFyZ3NWYWw8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXT4gPSB7IFtLIGluIGtleW9mIEFyZ3NdOiBBcmdzW0tdIGV4dGVuZHMgTnVtVHlwZSA/IFZhbHVlPEFyZ3NbS10+IDogbmV2ZXIgfVxuXG50eXBlIENvcmVFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9XG4gIHwgeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFQsIHZhbHVlOiBWYWx1ZTxUPiB9XG4gIHwgeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlOiBULCBsb2NhbDogbnVtYmVyIH1cbiAgfCB7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IFQsIG9wOiBCaW5PcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHI8VD4gfVxuICB8IHsga2luZDogXCJjYWxsXCIsIHR5cGU6IFQsIHRhcmdldDogbnVtYmVyLCBhcmdzOiBFeHByPE51bVR5cGU+W10gfVxuICB8IHsga2luZDogXCJpZlwiLCB0eXBlOiBULCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlOiBFeHByPFQ+IH1cbiAgfCB7IGtpbmQ6IFwibG9hZFwiLCB0eXBlOiBULCBhcnJheTogbnVtYmVyLCBpbmRleDogRXhwcjxcImkzMlwiPiB9XG4gIHwgKFQgZXh0ZW5kcyBcImkzMlwiID8geyBraW5kOiBcImNtcFwiLCB0eXBlOiBcImkzMlwiLCBpbnB1dFR5cGU6IE51bVR5cGUsIG9wOiBDbXBPcCwgbGVmdDogRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IEV4cHI8TnVtVHlwZT4gfSA6IG5ldmVyKVxuXG5leHBvcnQgdHlwZSBFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IENvcmVFeHByPFQ+ICYge1xuICBhZGQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBzdWIocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBtdWwocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBkaXYocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBlcShyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG4gIGx0KHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbiAgZ3QocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxufVxuXG5leHBvcnQgdHlwZSBTdG10ID1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBudW1iZXIsIHR5cGU6IE51bVR5cGUsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXk6IG51bWJlciwgdHlwZTogTnVtVHlwZSwgaW5kZXg6IEV4cHI8XCJpMzJcIj4sIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdFtdLCBlbHNlOiBTdG10W10gfVxuICB8IHsga2luZDogXCJibG9ja1wiLCBjb250cm9sOiBudW1iZXIsIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogbnVtYmVyLCBjb25kOiBFeHByPFwiaTMyXCI+LCBib2R5OiBTdG10W10gfVxuICB8IHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IG51bWJlciB8IG51bGwgfVxuICB8IHsga2luZDogXCJyZXR1cm5cIiwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJleHByXCIsIGV4cHI6IEV4cHI8TnVtVHlwZT4gfVxuXG5leHBvcnQgdHlwZSBCbG9ja0hhbmRsZSA9IHsga2luZDogXCJibG9ja1wiLCBpZDogbnVtYmVyIH1cbmV4cG9ydCB0eXBlIExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbnVtYmVyIH1cbnR5cGUgQ29udHJvbEhhbmRsZSA9IEJsb2NrSGFuZGxlIHwgTG9vcEhhbmRsZVxuXG5leHBvcnQgdHlwZSBMb2NhbFZhcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7XG4gIGlkOiBudW1iZXJcbiAgdHlwZTogVFxuICBnZXQoKTogRXhwcjxUPlxuICBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdFxuICBhZGQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBzdWIocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBtdWwocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBkaXYocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBlcShyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG4gIGx0KHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbiAgZ3QocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxuICBpYWRkKHJpZ2h0OiBFeHByTGlrZTxUPik6IFN0bXRcbiAgaXN1YihyaWdodDogRXhwckxpa2U8VD4pOiBTdG10XG4gIGltdWwocmlnaHQ6IEV4cHJMaWtlPFQ+KTogU3RtdFxuICBpZGl2KHJpZ2h0OiBFeHByTGlrZTxUPik6IFN0bXRcbn1cblxuZXhwb3J0IHR5cGUgQXJyYXlIYW5kbGU8VCBleHRlbmRzIE51bVR5cGU+ID0ge1xuICBraW5kOiBcImFycmF5XCJcbiAgaWQ6IG51bWJlclxuICB0eXBlOiBUXG4gIGxlbmd0aDogbnVtYmVyXG4gIGxvYWQoaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+KTogRXhwcjxUPlxuICBzdG9yZShpbmRleDogRXhwckxpa2U8XCJpMzJcIj4sIHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXRcbn1cblxudHlwZSBFeHByTGlrZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+IHwgVmFsdWU8VD4gfCBMb2NhbFZhcjxUPlxudHlwZSBTdG10Qm9keSA9IFN0bXQgfCBTdG10W11cbnR5cGUgQ29udHJvbEJvZHk8SCBleHRlbmRzIENvbnRyb2xIYW5kbGU+ID0gU3RtdEJvZHkgfCAoKHNlbGY6IEgpID0+IFN0bXRCb2R5KVxudHlwZSBGdW5jQm9keTxSIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFI+IHwgU3RtdCB8IFN0bXRbXVxuXG5leHBvcnQgdHlwZSBGdW5jSGFuZGxlPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBOdW1UeXBlPiA9IEZ1bmNTaWc8QSwgUj4gJiB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIGlkOiBudW1iZXJcbiAgYnVpbGQ/OiAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPlxuICBjYWxsOiAoLi4uYXJnczogQXJnc0V4cHI8QT4pID0+IEV4cHI8Uj5cbn1cblxudHlwZSBBbnlGdW5jID0ge1xuICBraW5kOiBcImZ1bmNcIlxuICBpZDogbnVtYmVyXG4gIHBhcmFtczogcmVhZG9ubHkgTnVtVHlwZVtdXG4gIHJlc3VsdDogTnVtVHlwZVxuICBidWlsZD86ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PE51bVR5cGU+XG4gIGNhbGw6ICguLi5hcmdzOiBhbnlbXSkgPT4gRXhwcjxOdW1UeXBlPlxufVxuXG50eXBlIEFueUFycmF5ID0ge1xuICBraW5kOiBcImFycmF5XCJcbiAgaWQ6IG51bWJlclxuICB0eXBlOiBOdW1UeXBlXG4gIGxlbmd0aDogbnVtYmVyXG4gIGxvYWQoaW5kZXg6IEV4cHJMaWtlPFwiaTMyXCI+KTogRXhwcjxOdW1UeXBlPlxuICBzdG9yZShpbmRleDogRXhwckxpa2U8XCJpMzJcIj4sIHZhbHVlOiBFeHByTGlrZTxOdW1UeXBlPik6IFN0bXRcbn1cblxudHlwZSBNb2R1bGVEZWYgPSBSZWNvcmQ8c3RyaW5nLCBBbnlGdW5jIHwgQW55QXJyYXk+XG50eXBlIEZ1bmNEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlGdW5jPiB9XG50eXBlIEFycmF5RGVmczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHsgW0sgaW4ga2V5b2YgVCBhcyBUW0tdIGV4dGVuZHMgQW55QXJyYXkgPyBLIDogbmV2ZXJdOiBFeHRyYWN0PFRbS10sIEFueUFycmF5PiB9XG5leHBvcnQgdHlwZSBDb21waWxlUmVzdWx0PFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBbSyBpbiBrZXlvZiBUXTpcbiAgICBUW0tdIGV4dGVuZHMgQW55RnVuYyA/ICguLi5hcmdzOiBBcmdzVmFsPFRbS11bXCJwYXJhbXNcIl0+KSA9PiBWYWx1ZTxUW0tdW1wicmVzdWx0XCJdPlxuICAgIDogVFtLXSBleHRlbmRzIEFueUFycmF5ID8gVHlwZWRBcnJheUZvcjxUW0tdW1widHlwZVwiXT5cbiAgICA6IG5ldmVyXG59XG5cbmNvbnN0IGNvZGVzID0ge1xuICB0eXBlOiB7IGkzMjogMHg3ZiwgaTY0OiAweDdlLCBmMzI6IDB4N2QsIGY2NDogMHg3YyB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICBiaW46IHtcbiAgICBhZGQ6IHsgaTMyOiAweDZhLCBpNjQ6IDB4N2MsIGYzMjogMHg5MiwgZjY0OiAweGEwIH0sXG4gICAgc3ViOiB7IGkzMjogMHg2YiwgaTY0OiAweDdkLCBmMzI6IDB4OTMsIGY2NDogMHhhMSB9LFxuICAgIG11bDogeyBpMzI6IDB4NmMsIGk2NDogMHg3ZSwgZjMyOiAweDk0LCBmNjQ6IDB4YTIgfSxcbiAgICBkaXY6IHsgaTMyOiAweDZkLCBpNjQ6IDB4N2YsIGYzMjogMHg5NSwgZjY0OiAweGEzIH0sXG4gIH0gYXMgUmVjb3JkPEJpbk9wLCBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPj4sXG4gIGNtcDoge1xuICAgIGVxOiB7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9LFxuICAgIGx0OiB7IGkzMjogMHg0OCwgaTY0OiAweDUzLCBmMzI6IDB4NWQsIGY2NDogMHg2MyB9LFxuICAgIGd0OiB7IGkzMjogMHg0YSwgaTY0OiAweDU1LCBmMzI6IDB4NWUsIGY2NDogMHg2NCB9LFxuICB9IGFzIFJlY29yZDxDbXBPcCwgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4+LFxuICBsb2FkOiB7IGkzMjogMHgyOCwgaTY0OiAweDI5LCBmMzI6IDB4MmEsIGY2NDogMHgyYiB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICBzdG9yZTogeyBpMzI6IDB4MzYsIGk2NDogMHgzNywgZjMyOiAweDM4LCBmNjQ6IDB4MzkgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgYnl0ZXM6IHsgaTMyOiA0LCBpNjQ6IDgsIGYzMjogNCwgZjY0OiA4IH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4sXG4gIGFsaWduOiB7IGkzMjogMiwgaTY0OiAzLCBmMzI6IDIsIGY2NDogMyB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxufVxuXG5jb25zdCB1MzIgPSAobjogbnVtYmVyKSA9PiB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCB1bnNpZ25lZCBpbnRlZ2VyLCBnb3QgJHtufWApXG4gIGNvbnN0IG91dDogbnVtYmVyW10gPSBbXVxuICBkbyB7XG4gICAgbGV0IGJ5dGUgPSBuICYgMHg3ZlxuICAgIG4gPj4+PSA3XG4gICAgaWYgKG4pIGJ5dGUgfD0gMHg4MFxuICAgIG91dC5wdXNoKGJ5dGUpXG4gIH0gd2hpbGUgKG4pXG4gIHJldHVybiBvdXRcbn1cblxuY29uc3Qgc04gPSAodmFsdWU6IG51bWJlciB8IGJpZ2ludCwgYml0czogMzIgfCA2NCkgPT4ge1xuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgbGV0IG4gPSBiaXRzID09PSAzMiA/IEJpZ0ludCgodmFsdWUgYXMgbnVtYmVyKSB8IDApIDogQmlnSW50LmFzSW50Tig2NCwgdmFsdWUgYXMgYmlnaW50KVxuICBmb3IgKDs7KSB7XG4gICAgbGV0IGJ5dGUgPSBOdW1iZXIobiAmIDB4N2ZuKVxuICAgIG4gPj49IDduXG4gICAgY29uc3QgZG9uZSA9IChuID09PSAwbiAmJiAoYnl0ZSAmIDB4NDApID09PSAwKSB8fCAobiA9PT0gLTFuICYmIChieXRlICYgMHg0MCkgIT09IDApXG4gICAgaWYgKCFkb25lKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICAgIGlmIChkb25lKSByZXR1cm4gb3V0XG4gIH1cbn1cblxuY29uc3QgZk4gPSAodmFsdWU6IG51bWJlciwgYnl0ZXM6IDQgfCA4KSA9PiB7XG4gIGNvbnN0IG91dCA9IG5ldyBVaW50OEFycmF5KGJ5dGVzKVxuICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KG91dC5idWZmZXIpXG4gIGJ5dGVzID09PSA0ID8gdmlldy5zZXRGbG9hdDMyKDAsIHZhbHVlLCB0cnVlKSA6IHZpZXcuc2V0RmxvYXQ2NCgwLCB2YWx1ZSwgdHJ1ZSlcbiAgcmV0dXJuIFsuLi5vdXRdXG59XG5cbmNvbnN0IHN0ciA9IChzOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUocylcbiAgcmV0dXJuIFsuLi51MzIoYnl0ZXMubGVuZ3RoKSwgLi4uYnl0ZXNdXG59XG5cbmNvbnN0IHNlY3Rpb24gPSAoaWQ6IG51bWJlciwgcGF5bG9hZDogbnVtYmVyW10pID0+IFtpZCwgLi4udTMyKHBheWxvYWQubGVuZ3RoKSwgLi4ucGF5bG9hZF1cbmNvbnN0IGZsYXRNYXAgPSA8VCwgUj4oeHM6IFRbXSwgZm46ICh4OiBUKSA9PiBSW10pID0+IHhzLmZsYXRNYXAoZm4pXG5jb25zdCBkaWUgPSAoeDogdW5rbm93bik6IG5ldmVyID0+IHsgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHZhbHVlOiAke1N0cmluZyh4KX1gKSB9XG5cbmxldCBuZXh0RnVuY0lkID0gMFxubGV0IG5leHRMb2NhbElkID0gMFxubGV0IG5leHRBcnJheUlkID0gMFxubGV0IG5leHRDb250cm9sSWQgPSAwXG5jb25zdCBhcnJheVJlZ2lzdHJ5ID0gbmV3IE1hcDxudW1iZXIsIEFueUFycmF5PigpXG5cbmNvbnN0IGluZmVyVHlwZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHJMaWtlPFQ+KSA9PlxuICAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIFwidHlwZVwiIGluIHZhbHVlID8gdmFsdWUudHlwZSA6IFwiaTMyXCIpIGFzIFRcblxuY29uc3QgYWRkRXhwck9wcyA9IDxUIGV4dGVuZHMgTnVtVHlwZT4oZTogRXhwcjxUPikgPT4ge1xuICBmb3IgKGNvbnN0IG9wIG9mIGJpbk9wcykgZVtvcF0gPSByID0+IGJpbihvcCwgZSwgcikgYXMgRXhwcjxUPlxuICBmb3IgKGNvbnN0IG9wIG9mIGNtcE9wcykgZVtvcF0gPSByID0+IGNtcChvcCwgZSwgcikgYXMgRXhwcjxcImkzMlwiPlxuICByZXR1cm4gZVxufVxuXG5jb25zdCBleHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPik6IEV4cHI8VD4gPT4ge1xuICByZXR1cm4gYWRkRXhwck9wcyhub2RlIGFzIEV4cHI8VD4pXG59XG5cbmNvbnN0IGxpdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgdmFsdWU6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPiA9PiB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoXCJraW5kXCIgaW4gdmFsdWUpIHJldHVybiB2YWx1ZSBhcyBFeHByPFQ+XG4gICAgaWYgKFwiZ2V0XCIgaW4gdmFsdWUpIHJldHVybiB2YWx1ZS5nZXQoKVxuICB9XG4gIHJldHVybiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlLCB2YWx1ZTogdmFsdWUgYXMgVmFsdWU8VD4gfSlcbn1cblxuY29uc3QgaXNTdG10ID0gKHg6IHVua25vd24pOiB4IGlzIFN0bXQgPT5cbiAgISF4ICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIFwia2luZFwiIGluIHggJiYgKFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwibG9jYWwuc2V0XCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImFycmF5LnN0b3JlXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImJsb2NrXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImxvb3BcIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiYnJlYWtcIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiY29udGludWVcIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwicmV0dXJuXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImV4cHJcIiB8fFxuICAgICgoeCBhcyBTdG10KS5raW5kID09PSBcImlmXCIgJiYgQXJyYXkuaXNBcnJheSgoeCBhcyB7IHRoZW4/OiB1bmtub3duIH0pLnRoZW4pKVxuICApXG5cbmNvbnN0IHN0bXRMaXN0ID0gKGJvZHk6IFN0bXRCb2R5KSA9PiBBcnJheS5pc0FycmF5KGJvZHkpID8gYm9keSA6IFtib2R5XVxuY29uc3QgYmluZFN0bXRzID0gKGJvZHk6IFN0bXRCb2R5LCBicjogbnVtYmVyLCBsb29wOiBudW1iZXIgfCBudWxsKTogU3RtdFtdID0+XG4gIHN0bXRMaXN0KGJvZHkpLm1hcChzID0+IGJpbmRTdG10KHMsIGJyLCBsb29wKSlcblxuY29uc3QgYmluZFN0bXQgPSAoczogU3RtdCwgYnI6IG51bWJlciwgbG9vcDogbnVtYmVyIHwgbnVsbCk6IFN0bXQgPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4geyAuLi5zLCB0aGVuOiBiaW5kU3RtdHMocy50aGVuLCBiciwgbG9vcCksIGVsc2U6IGJpbmRTdG10cyhzLmVsc2UsIGJyLCBsb29wKSB9XG4gICAgY2FzZSBcImJyZWFrXCI6IHJldHVybiB7IC4uLnMsIHRhcmdldDogcy50YXJnZXQgPz8gYnIgfVxuICAgIGNhc2UgXCJjb250aW51ZVwiOlxuICAgICAgaWYgKHMudGFyZ2V0ICE9IG51bGwpIHJldHVybiBzXG4gICAgICBpZiAobG9vcCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJjb250aW51ZVRvKCkgdXNlZCBvdXRzaWRlIGEgbG9vcFwiKVxuICAgICAgcmV0dXJuIHsgLi4ucywgdGFyZ2V0OiBsb29wIH1cbiAgICBkZWZhdWx0OiByZXR1cm4gc1xuICB9XG59XG5cbmNvbnN0IGNvbnRyb2xCb2R5ID0gPEggZXh0ZW5kcyBDb250cm9sSGFuZGxlPihzZWxmOiBILCBib2R5OiBDb250cm9sQm9keTxIPikgPT5cbiAgYmluZFN0bXRzKHR5cGVvZiBib2R5ID09PSBcImZ1bmN0aW9uXCIgPyBib2R5KHNlbGYpIDogYm9keSwgc2VsZi5pZCwgc2VsZi5raW5kID09PSBcImxvb3BcIiA/IHNlbGYuaWQgOiBudWxsKVxuXG5jb25zdCBiaW4gPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBCaW5PcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PlxuICBleHByKHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdChsZWZ0LnR5cGUsIHJpZ2h0KSB9KVxuXG5jb25zdCBjbXAgPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBDbXBPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PlxuICBleHByKHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0KGxlZnQudHlwZSwgcmlnaHQpIH0pXG5cbmNvbnN0IGxvY2FsRXhwciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgbG9jYWw6IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGUsIGxvY2FsIH0pXG5cbmNvbnN0IG1rTG9jYWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiBMb2NhbFZhcjxUPiA9PiB7XG4gIGNvbnN0IGlkID0gbmV4dExvY2FsSWQrK1xuICBjb25zdCBnZXQgPSAoKSA9PiBsb2NhbEV4cHIodHlwZSwgaWQpXG4gIGNvbnN0IHNldCA9ICh2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10ID0+ICh7IGtpbmQ6IFwibG9jYWwuc2V0XCIsIGxvY2FsOiBpZCwgdHlwZSwgdmFsdWU6IGxpdCh0eXBlLCB2YWx1ZSkgYXMgRXhwcjxOdW1UeXBlPiB9KVxuICBjb25zdCBvdXQ6IExvY2FsVmFyPFQ+ID0ge1xuICAgIGlkLCB0eXBlLCBnZXQsIHNldCxcbiAgICBhZGQ6IHJpZ2h0ID0+IGdldCgpLmFkZChyaWdodCksIHN1YjogcmlnaHQgPT4gZ2V0KCkuc3ViKHJpZ2h0KSwgbXVsOiByaWdodCA9PiBnZXQoKS5tdWwocmlnaHQpLCBkaXY6IHJpZ2h0ID0+IGdldCgpLmRpdihyaWdodCksXG4gICAgZXE6IHJpZ2h0ID0+IGdldCgpLmVxKHJpZ2h0KSwgbHQ6IHJpZ2h0ID0+IGdldCgpLmx0KHJpZ2h0KSwgZ3Q6IHJpZ2h0ID0+IGdldCgpLmd0KHJpZ2h0KSxcbiAgICBpYWRkOiByaWdodCA9PiBzZXQoZ2V0KCkuYWRkKHJpZ2h0KSksIGlzdWI6IHJpZ2h0ID0+IHNldChnZXQoKS5zdWIocmlnaHQpKSwgaW11bDogcmlnaHQgPT4gc2V0KGdldCgpLm11bChyaWdodCkpLCBpZGl2OiByaWdodCA9PiBzZXQoZ2V0KCkuZGl2KHJpZ2h0KSksXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5jb25zdCBta0hhbmRsZSA9IDxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4oXG4gIHBhcmFtczogQSxcbiAgcmVzdWx0OiBSLFxuICBidWlsZD86ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+LFxuKTogRnVuY0hhbmRsZTxBLCBSPiA9PiB7XG4gIGNvbnN0IGlkID0gbmV4dEZ1bmNJZCsrXG4gIHJldHVybiB7XG4gICAga2luZDogXCJmdW5jXCIsXG4gICAgaWQsIHBhcmFtcywgcmVzdWx0LCBidWlsZCxcbiAgICBjYWxsOiAoLi4uYXJnczogQXJnc0V4cHI8QT4pID0+IGV4cHIoeyBraW5kOiBcImNhbGxcIiwgdHlwZTogcmVzdWx0LCB0YXJnZXQ6IGlkLCBhcmdzOiBhcmdzIGFzIEV4cHI8TnVtVHlwZT5bXSB9KSBhcyBFeHByPFI+LFxuICB9XG59XG5cbmNvbnN0IG1rQXJyYXkgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKTogQXJyYXlIYW5kbGU8VD4gPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGVuZ3RoKSB8fCBsZW5ndGggPD0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFycmF5IGxlbmd0aCAke2xlbmd0aH1gKVxuICBjb25zdCBpZCA9IG5leHRBcnJheUlkKytcbiAgY29uc3QgaGFuZGxlOiBBcnJheUhhbmRsZTxUPiA9IHtcbiAgICBraW5kOiBcImFycmF5XCIsXG4gICAgaWQsIHR5cGUsIGxlbmd0aCxcbiAgICBsb2FkOiBpbmRleCA9PiBleHByKHsga2luZDogXCJsb2FkXCIsIHR5cGUsIGFycmF5OiBpZCwgaW5kZXg6IGxpdChcImkzMlwiLCBpbmRleCkgfSksXG4gICAgc3RvcmU6IChpbmRleCwgdmFsdWUpID0+ICh7IGtpbmQ6IFwiYXJyYXkuc3RvcmVcIiwgYXJyYXk6IGlkLCB0eXBlLCBpbmRleDogbGl0KFwiaTMyXCIsIGluZGV4KSwgdmFsdWU6IGxpdCh0eXBlLCB2YWx1ZSkgYXMgRXhwcjxOdW1UeXBlPiB9KSxcbiAgfVxuICBhcnJheVJlZ2lzdHJ5LnNldChpZCwgaGFuZGxlIGFzIHVua25vd24gYXMgQW55QXJyYXkpXG4gIHJldHVybiBoYW5kbGVcbn1cblxuZXhwb3J0IGNvbnN0IGkzMiA9IChuOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFwiaTMyXCIsIHZhbHVlOiBuIH0pXG5leHBvcnQgY29uc3QgaTY0ID0gKG46IGJpZ2ludCkgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJpNjRcIiwgdmFsdWU6IG4gfSlcbmV4cG9ydCBjb25zdCBmMzIgPSAobjogbnVtYmVyKSA9PiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBcImYzMlwiLCB2YWx1ZTogbiB9KVxuZXhwb3J0IGNvbnN0IGY2NCA9IChuOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFwiZjY0XCIsIHZhbHVlOiBuIH0pXG5cbmV4cG9ydCBjb25zdCBpZkVsc2UgPSA8VCBleHRlbmRzIE51bVR5cGU+KGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2VfOiBFeHByPFQ+KSA9PlxuICBleHByKHsga2luZDogXCJpZlwiLCB0eXBlOiB0aGVuLnR5cGUsIGNvbmQsIHRoZW4sIGVsc2U6IGVsc2VfIH0pXG5cbmV4cG9ydCBjb25zdCBhZGQgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKFwiYWRkXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IHN1YiA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4oXCJzdWJcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3QgbXVsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihcIm11bFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBkaXYgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKFwiZGl2XCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IGVxID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChcImVxXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IGx0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChcImx0XCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IGd0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChcImd0XCIsIGxlZnQsIHJpZ2h0KVxuXG5leHBvcnQgY29uc3QgZGVjbGFyZSA9IDxjb25zdCBBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4ocGFyYW1zOiBBLCByZXN1bHQ6IFIpID0+IG1rSGFuZGxlKHBhcmFtcywgcmVzdWx0KVxuZXhwb3J0IGNvbnN0IGZ1bmMgPSA8Y29uc3QgQSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIE51bVR5cGU+KHBhcmFtczogQSwgcmVzdWx0OiBSLCBidWlsZDogKC4uLmFyZ3M6IEFyZ3NFeHByPEE+KSA9PiBGdW5jQm9keTxSPikgPT5cbiAgbWtIYW5kbGUocGFyYW1zLCByZXN1bHQsIGJ1aWxkIGFzICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+KVxuZXhwb3J0IGNvbnN0IGFycmF5ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCBsZW5ndGg6IG51bWJlcikgPT4gbWtBcnJheSh0eXBlLCBsZW5ndGgpXG5cbmV4cG9ydCBjb25zdCBsb2NhbCA9IE9iamVjdC5mcm9tRW50cmllcyhudW1UeXBlcy5tYXAodHlwZSA9PiBbdHlwZSwgKCkgPT4gbWtMb2NhbCh0eXBlKV0pKSBhcyB7IFtUIGluIE51bVR5cGVdOiAoKSA9PiBMb2NhbFZhcjxUPiB9XG5cbmV4cG9ydCBjb25zdCByZXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXQgPT4gKHtcbiAga2luZDogXCJyZXR1cm5cIixcbiAgdmFsdWU6IGxpdChpbmZlclR5cGUodmFsdWUpLCB2YWx1ZSkgYXMgRXhwcjxOdW1UeXBlPixcbn0pXG5leHBvcnQgY29uc3QgaWZTdG10ID0gKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IFN0bXRbXSwgZWxzZV86IFN0bXRbXSA9IFtdKTogU3RtdCA9PiAoeyBraW5kOiBcImlmXCIsIGNvbmQsIHRoZW4sIGVsc2U6IGVsc2VfIH0pXG5leHBvcnQgY29uc3QgYmxvY2sgPSAoYm9keTogQ29udHJvbEJvZHk8QmxvY2tIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cbmV4cG9ydCBjb25zdCBsb29wID0gKGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IENvbnRyb2xCb2R5PExvb3BIYW5kbGU+KTogU3RtdCA9PiB7XG4gIGNvbnN0IHNlbGY6IExvb3BIYW5kbGUgPSB7IGtpbmQ6IFwibG9vcFwiLCBpZDogbmV4dENvbnRyb2xJZCsrIH1cbiAgcmV0dXJuIHsga2luZDogXCJsb29wXCIsIGNvbnRyb2w6IHNlbGYuaWQsIGNvbmQsIGJvZHk6IGNvbnRyb2xCb2R5KHNlbGYsIGJvZHkpIH1cbn1cbmV4cG9ydCBjb25zdCB3aGlsZUxvb3AgPSBsb29wXG5leHBvcnQgY29uc3QgYnJlYWtUbyA9ICh0YXJnZXQ/OiBDb250cm9sSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgY29udGludWVUbyA9ICh0YXJnZXQ/OiBMb29wSGFuZGxlKTogU3RtdCA9PiAoeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogdGFyZ2V0Py5pZCA/PyBudWxsIH0pXG5leHBvcnQgY29uc3QgZXhwclN0bXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByPFQ+KTogU3RtdCA9PiAoeyBraW5kOiBcImV4cHJcIiwgZXhwcjogdmFsdWUgYXMgRXhwcjxOdW1UeXBlPiB9KVxuXG50eXBlIEFycmF5TGF5b3V0ID0geyB0eXBlOiBOdW1UeXBlLCBsZW5ndGg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxudHlwZSBNb2R1bGVBbmFseXNpczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHtcbiAgZnVuY3M6IEZ1bmNEZWZzPFQ+XG4gIGFycmF5czogQXJyYXlEZWZzPFQ+XG4gIGZFbnRyaWVzOiBba2V5b2YgRnVuY0RlZnM8VD4gJiBzdHJpbmcsIEZ1bmNEZWZzPFQ+W2tleW9mIEZ1bmNEZWZzPFQ+XV1bXVxuICBidWlsdEZ1bmNzOiBCdWlsdEZ1bmNbXVxuICBmaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj5cbiAgbGF5b3V0czogUmVjb3JkPG51bWJlciwgQXJyYXlMYXlvdXQ+XG4gIHBhZ2VzOiBudW1iZXJcbn1cblxuY29uc3Qgd2Fsa0V4cHIgPSAoZTogRXhwcjxOdW1UeXBlPiwgZm5zOiB7XG4gIGxvY2FsPzogKGlkOiBudW1iZXIsIHR5cGU6IE51bVR5cGUpID0+IHZvaWRcbiAgYXJyYXk/OiAoaWQ6IG51bWJlcikgPT4gdm9pZFxufSkgPT4ge1xuICBzd2l0Y2ggKGUua2luZCkge1xuICAgIGNhc2UgXCJjb25zdFwiOiByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6IGZucy5sb2NhbD8uKGUubG9jYWwsIGUudHlwZSk7IHJldHVyblxuICAgIGNhc2UgXCJiaW5cIjpcbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICB3YWxrRXhwcihlLmxlZnQsIGZucyk7IHdhbGtFeHByKGUucmlnaHQsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICBlLmFyZ3MuZm9yRWFjaChhcmcgPT4gd2Fsa0V4cHIoYXJnLCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImlmXCI6XG4gICAgICB3YWxrRXhwcihlLmNvbmQsIGZucyk7IHdhbGtFeHByKGUudGhlbiwgZm5zKTsgd2Fsa0V4cHIoZS5lbHNlLCBmbnMpOyByZXR1cm5cbiAgICBjYXNlIFwibG9hZFwiOlxuICAgICAgZm5zLmFycmF5Py4oZS5hcnJheSk7IHdhbGtFeHByKGUuaW5kZXgsIGZucyk7IHJldHVyblxuICAgIGRlZmF1bHQ6IGRpZShlKVxuICB9XG59XG5cbmNvbnN0IHdhbGtTdG10ID0gKHM6IFN0bXQsIGZuczoge1xuICBsb2NhbD86IChpZDogbnVtYmVyLCB0eXBlOiBOdW1UeXBlKSA9PiB2b2lkXG4gIGFycmF5PzogKGlkOiBudW1iZXIpID0+IHZvaWRcbn0pID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6IGZucy5sb2NhbD8uKHMubG9jYWwsIHMudHlwZSk7IHdhbGtFeHByKHMudmFsdWUsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiBmbnMuYXJyYXk/LihzLmFycmF5KTsgd2Fsa0V4cHIocy5pbmRleCwgZm5zKTsgd2Fsa0V4cHIocy52YWx1ZSwgZm5zKTsgcmV0dXJuXG4gICAgY2FzZSBcImlmXCI6IHdhbGtFeHByKHMuY29uZCwgZm5zKTsgcy50aGVuLmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcy5lbHNlLmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImJsb2NrXCI6IHMuYm9keS5mb3JFYWNoKHggPT4gd2Fsa1N0bXQoeCwgZm5zKSk7IHJldHVyblxuICAgIGNhc2UgXCJsb29wXCI6IHdhbGtFeHByKHMuY29uZCwgZm5zKTsgcy5ib2R5LmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwicmV0dXJuXCI6IHdhbGtFeHByKHMudmFsdWUsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJleHByXCI6IHdhbGtFeHByKHMuZXhwciwgZm5zKTsgcmV0dXJuXG4gICAgZGVmYXVsdDogZGllKHMpXG4gIH1cbn1cblxuY29uc3QgYWRkciA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPikgPT4gaW5kZXgubXVsKGNvZGVzLmJ5dGVzW2xheW91dC50eXBlXSkuYWRkKGxheW91dC5vZmZzZXQpXG5jb25zdCBtZW1hcmcgPSAodHlwZTogTnVtVHlwZSwgb2Zmc2V0ID0gMCkgPT4gWy4uLnUzMihjb2Rlcy5hbGlnblt0eXBlXSksIC4uLnUzMihvZmZzZXQpXVxuY29uc3QgY29uc3RJMzIgPSAoZTogRXhwcjxcImkzMlwiPikgPT4gZS5raW5kID09PSBcImNvbnN0XCIgPyBlLnZhbHVlIDogbnVsbFxuY29uc3QgY2hlY2tBcnJheUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPikgPT4ge1xuICBjb25zdCBuID0gY29uc3RJMzIoaW5kZXgpXG4gIGlmIChuID09IG51bGwpIHJldHVyblxuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDAgfHwgbiA+PSBsYXlvdXQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IGluZGV4ICR7bn0gb3V0IG9mIGJvdW5kcyBmb3IgbGVuZ3RoICR7bGF5b3V0Lmxlbmd0aH1gKVxufVxuXG5jb25zdCBjb21waWxlRXhwciA9IChlOiBFeHByPE51bVR5cGU+LCBmaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj4sIGxpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPiwgYXJyYXlzOiBSZWNvcmQ8bnVtYmVyLCBBcnJheUxheW91dD4pOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAoZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6XG4gICAgICBpZiAoZS50eXBlID09PSBcImkzMlwiKSByZXR1cm4gWzB4NDEsIC4uLnNOKGUudmFsdWUgYXMgbnVtYmVyLCAzMildXG4gICAgICBpZiAoZS50eXBlID09PSBcImk2NFwiKSByZXR1cm4gWzB4NDIsIC4uLnNOKGUudmFsdWUsIDY0KV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZjMyXCIpIHJldHVybiBbMHg0MywgLi4uZk4oZS52YWx1ZSBhcyBudW1iZXIsIDQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmNjRcIikgcmV0dXJuIFsweDQ0LCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgOCldXG4gICAgICByZXR1cm4gZGllKGUpXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIwLCAuLi51MzIobGl4W2UubG9jYWxdISldXG4gICAgY2FzZSBcImJpblwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQsIGZpeCwgbGl4LCBhcnJheXMpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0LCBmaXgsIGxpeCwgYXJyYXlzKSwgY29kZXMuYmluW2Uub3BdW2UudHlwZV1dXG4gICAgY2FzZSBcImNtcFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQsIGZpeCwgbGl4LCBhcnJheXMpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0LCBmaXgsIGxpeCwgYXJyYXlzKSwgY29kZXMuY21wW2Uub3BdW2UuaW5wdXRUeXBlXV1cbiAgICBjYXNlIFwiY2FsbFwiOlxuICAgICAgaWYgKGZpeFtlLnRhcmdldF0gPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGZ1bmN0aW9uICR7ZS50YXJnZXR9YClcbiAgICAgIHJldHVybiBbLi4uZmxhdE1hcChlLmFyZ3MsIGFyZyA9PiBjb21waWxlRXhwcihhcmcsIGZpeCwgbGl4LCBhcnJheXMpKSwgMHgxMCwgLi4udTMyKGZpeFtlLnRhcmdldF0hKV1cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5jb25kLCBmaXgsIGxpeCwgYXJyYXlzKSwgMHgwNCwgY29kZXMudHlwZVtlLnR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4sIGZpeCwgbGl4LCBhcnJheXMpLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UsIGZpeCwgbGl4LCBhcnJheXMpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5c1tlLmFycmF5XVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke2UuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBlLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgZS5pbmRleCksIGZpeCwgbGl4LCBhcnJheXMpLCBjb2Rlcy5sb2FkW2UudHlwZV0sIC4uLm1lbWFyZyhlLnR5cGUpXVxuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGRpZShlKVxuICB9XG59XG5cbnR5cGUgTGFiZWxGcmFtZSA9IHsgY29udHJvbD86IG51bWJlciwga2luZD86IFwiYnJlYWtcIiB8IFwiY29udGludWVcIiB9XG5jb25zdCBkZXB0aCA9IChzdGFjazogTGFiZWxGcmFtZVtdLCBjb250cm9sOiBudW1iZXIsIGtpbmQ6IE5vbk51bGxhYmxlPExhYmVsRnJhbWVbXCJraW5kXCJdPikgPT4ge1xuICBjb25zdCBpID0gc3RhY2suZmluZEluZGV4KHggPT4geC5jb250cm9sID09PSBjb250cm9sICYmIHgua2luZCA9PT0ga2luZClcbiAgaWYgKGkgPCAwKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gJHtraW5kfSB0YXJnZXQgJHtjb250cm9sfWApXG4gIHJldHVybiBpXG59XG5cbmNvbnN0IGNvbXBpbGVTdG10ID0gKFxuICBzOiBTdG10LFxuICBmaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj4sXG4gIGxpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPixcbiAgYXJyYXlzOiBSZWNvcmQ8bnVtYmVyLCBBcnJheUxheW91dD4sXG4gIHN0YWNrOiBMYWJlbEZyYW1lW10gPSBbXSxcbik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMudmFsdWUsIGZpeCwgbGl4LCBhcnJheXMpLCAweDIxLCAuLi51MzIobGl4W3MubG9jYWxdISldXG4gICAgY2FzZSBcImFycmF5LnN0b3JlXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5c1tzLmFycmF5XVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBzLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5pbmRleCksIGZpeCwgbGl4LCBhcnJheXMpLCAuLi5jb21waWxlRXhwcihzLnZhbHVlLCBmaXgsIGxpeCwgYXJyYXlzKSwgY29kZXMuc3RvcmVbcy50eXBlXSwgLi4ubWVtYXJnKHMudHlwZSldXG4gICAgfVxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmNvbmQsIGZpeCwgbGl4LCBhcnJheXMpLCAweDA0LCAweDQwLCAuLi5mbGF0TWFwKHMudGhlbiwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBbe30sIC4uLnN0YWNrXSkpLCAuLi4ocy5lbHNlLmxlbmd0aCA/IFsweDA1LCAuLi5mbGF0TWFwKHMuZWxzZSwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBbe30sIC4uLnN0YWNrXSkpXSA6IFtdKSwgMHgwYl1cbiAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgLi4uZmxhdE1hcChzLmJvZHksIHggPT4gY29tcGlsZVN0bXQoeCwgZml4LCBsaXgsIGFycmF5cywgW3sgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGJdXG4gICAgY2FzZSBcImxvb3BcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgMHgwMywgMHg0MCwgLi4uY29tcGlsZUV4cHIocy5jb25kLCBmaXgsIGxpeCwgYXJyYXlzKSwgMHg0NSwgMHgwZCwgLi4udTMyKDEpLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiY29udGludWVcIiB9LCB7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJicmVha1wiIH0sIC4uLnN0YWNrXSkpLCAweDBjLCAuLi51MzIoMCksIDB4MGIsIDB4MGJdXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiYnJlYWtUbygpIHVzZWQgb3V0c2lkZSBhIGJsb2NrIG9yIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJicmVha1wiKSldXG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJjb250aW51ZVwiKSldXG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlLCBmaXgsIGxpeCwgYXJyYXlzKSwgMHgwZl1cbiAgICBjYXNlIFwiZXhwclwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmV4cHIsIGZpeCwgbGl4LCBhcnJheXMpLCAweDFhXVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKHMpXG4gIH1cbn1cblxuY29uc3QgYXJyYXlMYXlvdXRzID0gKGRlZnM6IFJlY29yZDxzdHJpbmcsIEFueUFycmF5PikgPT4ge1xuICBsZXQgb2Zmc2V0ID0gMFxuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZGVmcykgYXMgW3N0cmluZywgQW55QXJyYXldW11cbiAgY29uc3Qgb3V0OiBSZWNvcmQ8bnVtYmVyLCBBcnJheUxheW91dD4gPSB7fVxuICBmb3IgKGNvbnN0IFssIGFycl0gb2YgZW50cmllcykge1xuICAgIG91dFthcnIuaWRdID0geyB0eXBlOiBhcnIudHlwZSwgbGVuZ3RoOiBhcnIubGVuZ3RoLCBvZmZzZXQgfVxuICAgIG9mZnNldCArPSBhcnIubGVuZ3RoICogY29kZXMuYnl0ZXNbYXJyLnR5cGVdXG4gIH1cbiAgcmV0dXJuIHsgbGF5b3V0czogb3V0LCBieXRlczogb2Zmc2V0LCBlbnRyaWVzIH1cbn1cblxuY29uc3QgbW9kdWxlRnVuY3MgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PlxuICBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMobW9kKS5maWx0ZXIoKFssIHZdKSA9PiB2LmtpbmQgPT09IFwiZnVuY1wiKSkgYXMgRnVuY0RlZnM8VD5cblxuY29uc3QgbW9kdWxlQXJyYXlzID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KG1vZDogVCkgPT5cbiAgT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKG1vZCkuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImFycmF5XCIpKSBhcyBBcnJheURlZnM8VD5cblxudHlwZSBCdWlsdEZ1bmMgPSB7XG4gIGZ1bmM6IEFueUZ1bmNcbiAgcGFyYW1JZHM6IG51bWJlcltdXG4gIGJ1aWx0OiBGdW5jQm9keTxOdW1UeXBlPlxufVxuXG5jb25zdCBidWlsZEZ1bmMgPSAoZnVuYzogQW55RnVuYyk6IEJ1aWx0RnVuYyA9PiB7XG4gIGNvbnN0IHBhcmFtcyA9IGZ1bmMucGFyYW1zLm1hcCh0eXBlID0+IGxvY2FsRXhwcih0eXBlLCBuZXh0TG9jYWxJZCsrKSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gIHJldHVybiB7XG4gICAgZnVuYyxcbiAgICBwYXJhbUlkczogcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSksXG4gICAgYnVpbHQ6IGZ1bmMuYnVpbGQ/LiguLi5wYXJhbXMpID8/IGRpZShgRnVuY3Rpb24gJHtmdW5jLmlkfSBoYXMgbm8gaW1wbGVtZW50YXRpb25gKSxcbiAgfVxufVxuXG5jb25zdCBkaXNjb3ZlcmVkQXJyYXlzID0gKGJ1aWx0RnVuY3M6IEJ1aWx0RnVuY1tdKSA9PiB7XG4gIGNvbnN0IHVzZWQgPSBuZXcgU2V0PG51bWJlcj4oKVxuICBmb3IgKGNvbnN0IHsgYnVpbHQgfSBvZiBidWlsdEZ1bmNzKSB7XG4gICAgY29uc3QgYm9keSA9IEFycmF5LmlzQXJyYXkoYnVpbHQpID8gYnVpbHQgOiBpc1N0bXQoYnVpbHQpID8gW2J1aWx0XSA6IG51bGxcbiAgICBib2R5ID8gYm9keS5mb3JFYWNoKHMgPT4gd2Fsa1N0bXQocywgeyBhcnJheTogaWQgPT4gdXNlZC5hZGQoaWQpIH0pKSA6IHdhbGtFeHByKGJ1aWx0IGFzIEV4cHI8TnVtVHlwZT4sIHsgYXJyYXk6IGlkID0+IHVzZWQuYWRkKGlkKSB9KVxuICB9XG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoWy4uLnVzZWRdLm1hcChpZCA9PiB7XG4gICAgY29uc3QgYXJyID0gYXJyYXlSZWdpc3RyeS5nZXQoaWQpXG4gICAgaWYgKCFhcnIpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke2lkfWApXG4gICAgcmV0dXJuIFtTdHJpbmcoaWQpLCBhcnJdXG4gIH0pKSBhcyBSZWNvcmQ8c3RyaW5nLCBBbnlBcnJheT5cbn1cblxuY29uc3QgYW5hbHl6ZU1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQpID0+IHtcbiAgY29uc3QgZnVuY3MgPSBtb2R1bGVGdW5jcyhtb2QpXG4gIGNvbnN0IGFycmF5cyA9IG1vZHVsZUFycmF5cyhtb2QpXG4gIGNvbnN0IGZFbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZnVuY3MpIGFzIFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGNvbnN0IGJ1aWx0RnVuY3MgPSBmRW50cmllcy5tYXAoKFssIGZ1bmNdKSA9PiBidWlsZEZ1bmMoZnVuYykpXG4gIGNvbnN0IGZpeCA9IE9iamVjdC5mcm9tRW50cmllcyhmRW50cmllcy5tYXAoKFssIGRlZl0sIGkpID0+IFtkZWYuaWQsIGldKSkgYXMgUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICBjb25zdCB0b3VjaGVkQXJyYXlzID0gZGlzY292ZXJlZEFycmF5cyhidWlsdEZ1bmNzKVxuICBjb25zdCBhbGxBcnJheXMgPSB7IC4uLnRvdWNoZWRBcnJheXMsIC4uLmFycmF5cyB9IGFzIFJlY29yZDxzdHJpbmcsIEFueUFycmF5PlxuICBjb25zdCB7IGxheW91dHMsIGJ5dGVzIH0gPSBhcnJheUxheW91dHMoYWxsQXJyYXlzKVxuICByZXR1cm4geyBmdW5jcywgYXJyYXlzLCBmRW50cmllcywgYnVpbHRGdW5jcywgZml4LCBsYXlvdXRzLCBwYWdlczogTWF0aC5tYXgoMSwgTWF0aC5jZWlsKGJ5dGVzIC8gNjU1MzYpKSB9IGFzIE1vZHVsZUFuYWx5c2lzPFQ+XG59XG5cbmNvbnN0IGVtaXRNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4oeyBmRW50cmllcywgYnVpbHRGdW5jcywgZml4LCBsYXlvdXRzLCBwYWdlcyB9OiBNb2R1bGVBbmFseXNpczxUPikgPT4ge1xuICBjb25zdCBmdW5jdGlvblNlY3Rpb24gPSBmRW50cmllcy5mbGF0TWFwKChfLCBpKSA9PiB1MzIoaSkpXG4gIGNvbnN0IGV4cG9ydFNlY3Rpb24gPSBmRW50cmllcy5mbGF0TWFwKChbbmFtZV0sIGkpID0+IFsuLi5zdHIobmFtZSksIDB4MDAsIC4uLnUzMihpKV0pXG4gIHJldHVybiBuZXcgVWludDhBcnJheShbXG4gICAgLi4ubWFnaWMsXG4gICAgLi4uc2VjdGlvbigweDAxLCBbLi4udTMyKGZFbnRyaWVzLmxlbmd0aCksIC4uLmZsYXRNYXAoZkVudHJpZXMsIChbLCBmXSkgPT4gWzB4NjAsIC4uLnUzMihmLnBhcmFtcy5sZW5ndGgpLCAuLi5mLnBhcmFtcy5tYXAodCA9PiBjb2Rlcy50eXBlW3RdKSwgMHgwMSwgY29kZXMudHlwZVtmLnJlc3VsdF1dKV0pLFxuICAgIC4uLnNlY3Rpb24oMHgwMywgWy4uLnUzMihmRW50cmllcy5sZW5ndGgpLCAuLi5mdW5jdGlvblNlY3Rpb25dKSxcbiAgICAuLi5zZWN0aW9uKDB4MDUsIFsweDAxLCAweDAwLCAuLi51MzIocGFnZXMpXSksXG4gICAgLi4uc2VjdGlvbigweDA3LCBbXG4gICAgICAuLi51MzIoZkVudHJpZXMubGVuZ3RoICsgMSksXG4gICAgICAuLi5leHBvcnRTZWN0aW9uLFxuICAgICAgLi4uc3RyKFwiX19tZW1cIiksIDB4MDIsIC4uLnUzMigwKSxcbiAgICBdKSxcbiAgICAuLi5zZWN0aW9uKDB4MGEsIFtcbiAgICAgIC4uLnUzMihmRW50cmllcy5sZW5ndGgpLFxuICAgICAgLi4uZmxhdE1hcChidWlsdEZ1bmNzLCAoeyBmdW5jLCBwYXJhbUlkcywgYnVpbHQgfSkgPT4ge1xuICAgICAgICBjb25zdCBsb2NhbHMgPSBuZXcgTWFwPG51bWJlciwgTnVtVHlwZT4oKVxuICAgICAgICBjb25zdCBzdG10cyA9IEFycmF5LmlzQXJyYXkoYnVpbHQpID8gYnVpbHQgOiBpc1N0bXQoYnVpbHQpID8gW2J1aWx0XSA6IG51bGxcbiAgICAgICAgc3RtdHMgPyBzdG10cy5mb3JFYWNoKHMgPT4gd2Fsa1N0bXQocywgeyBsb2NhbDogKGlkLCB0eXBlKSA9PiBsb2NhbHMuc2V0KGlkLCB0eXBlKSB9KSkgOiB3YWxrRXhwcihidWlsdCBhcyBFeHByPE51bVR5cGU+LCB7IGxvY2FsOiAoaWQsIHR5cGUpID0+IGxvY2Fscy5zZXQoaWQsIHR5cGUpIH0pXG4gICAgICAgIHBhcmFtSWRzLmZvckVhY2goaWQgPT4gbG9jYWxzLmRlbGV0ZShpZCkpXG4gICAgICAgIGNvbnN0IGxvY2FsRW50cmllcyA9IFsuLi5sb2NhbHMuZW50cmllcygpXVxuICAgICAgICBjb25zdCBsaXggPSBPYmplY3QuZnJvbUVudHJpZXMoWy4uLnBhcmFtSWRzLm1hcCgoaWQsIGkpID0+IFtpZCwgaV0pLCAuLi5sb2NhbEVudHJpZXMubWFwKChbaWRdLCBpKSA9PiBbaWQsIGZ1bmMucGFyYW1zLmxlbmd0aCArIGldKV0pIGFzIFJlY29yZDxudW1iZXIsIG51bWJlcj5cbiAgICAgICAgY29uc3QgZGVjbHMgPSBbLi4udTMyKGxvY2FsRW50cmllcy5sZW5ndGgpLCAuLi5mbGF0TWFwKGxvY2FsRW50cmllcywgKFssIHR5cGVdKSA9PiBbLi4udTMyKDEpLCBjb2Rlcy50eXBlW3R5cGVdXSldXG4gICAgICAgIGNvbnN0IGNvZGUgPSBzdG10cyA/IGZsYXRNYXAoc3RtdHMsIHMgPT4gY29tcGlsZVN0bXQocywgZml4LCBsaXgsIGxheW91dHMpKSA6IGNvbXBpbGVFeHByKGJ1aWx0IGFzIEV4cHI8TnVtVHlwZT4sIGZpeCwgbGl4LCBsYXlvdXRzKVxuICAgICAgICBjb25zdCBib2R5ID0gWy4uLmRlY2xzLCAuLi5jb2RlLCAweDBiXVxuICAgICAgICByZXR1cm4gWy4uLnUzMihib2R5Lmxlbmd0aCksIC4uLmJvZHldXG4gICAgICB9KSxcbiAgICBdKSxcbiAgXSlcbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBpbGVNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PiBlbWl0TW9kdWxlKGFuYWx5emVNb2R1bGUobW9kKSlcblxuY29uc3QgdHlwZWRBcnJheUN0b3IgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiB7IG5ldyhidWZmZXI6IEFycmF5QnVmZmVyTGlrZSwgYnl0ZU9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcik6IFR5cGVkQXJyYXlGb3I8VD4gfSA9PiB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgXCJpMzJcIjogcmV0dXJuIEludDMyQXJyYXkgYXMgYW55XG4gICAgY2FzZSBcImk2NFwiOiByZXR1cm4gQmlnSW50NjRBcnJheSBhcyBhbnlcbiAgICBjYXNlIFwiZjMyXCI6IHJldHVybiBGbG9hdDMyQXJyYXkgYXMgYW55XG4gICAgY2FzZSBcImY2NFwiOiByZXR1cm4gRmxvYXQ2NEFycmF5IGFzIGFueVxuICAgIGRlZmF1bHQ6IHJldHVybiBkaWUodHlwZSlcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQpOiBQcm9taXNlPENvbXBpbGVSZXN1bHQ8VD4+ID0+IHtcbiAgY29uc3QgYW5hbHlzaXMgPSBhbmFseXplTW9kdWxlKG1vZClcbiAgY29uc3QgeyBmdW5jcywgYXJyYXlzLCBsYXlvdXRzIH0gPSBhbmFseXNpc1xuICBjb25zdCB3YXNtID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoYXdhaXQgV2ViQXNzZW1ibHkuY29tcGlsZShlbWl0TW9kdWxlKGFuYWx5c2lzKS5idWZmZXIpKVxuICBjb25zdCBleHBvcnRzID0gd2FzbS5leHBvcnRzIGFzIFdlYkFzc2VtYmx5LkV4cG9ydHMgJiB7IF9fbWVtOiBXZWJBc3NlbWJseS5NZW1vcnkgfVxuICBjb25zdCBqc0Z1bmNzID0gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5rZXlzKGZ1bmNzKS5tYXAobmFtZSA9PiBbbmFtZSwgZXhwb3J0c1tuYW1lXV0pKVxuICBjb25zdCBqc0FycmF5cyA9IChPYmplY3QuZW50cmllcyhhcnJheXMpIGFzIFtzdHJpbmcsIEFueUFycmF5XVtdKS5tYXAoKFtuYW1lLCBhcnJdKSA9PiB7XG4gICAgY29uc3QgbGF5b3V0ID0gbGF5b3V0c1thcnIuaWRdIVxuICAgIGNvbnN0IEN0b3IgPSB0eXBlZEFycmF5Q3RvcihhcnIudHlwZSlcbiAgICByZXR1cm4gW25hbWUsIG5ldyBDdG9yKGV4cG9ydHMuX19tZW0uYnVmZmVyLCBsYXlvdXQub2Zmc2V0LCBhcnIubGVuZ3RoKV0gYXMgY29uc3RcbiAgfSlcbiAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhbXG4gICAgLi4uT2JqZWN0LmVudHJpZXMoanNGdW5jcyksXG4gICAgLi4uanNBcnJheXMsXG4gIF0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiXG5pbXBvcnQgdHlwZSB7IEpzb25EYXRhIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuZXhwb3J0IGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG5jb25zdCBjb2xvclBhbGV0dGUgPSB7XG4gIGxpZ2h0OntcbiAgICBjb2xvcjogICAgICAgICAgICAgXCIjMDAwXCIsXG4gICAgYmFja2dyb3VuZDogICAgICAgIFwiI2ZmZlwiLFxuICAgIHJlZDogICAgICAgICAgICAgICBcInJnYigyNDIsIDU1LCA1NSlcIixcbiAgICBncmVlbjogICAgICAgICAgICAgXCJyZ2IoNTcsIDIxNCwgMzkpXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDUsIDI4LCAxNDEpXCIsXG4gICAgbGlnaHRibHVlOiAgICAgICAgIFwicmdiKDIxLCAxMzcsIDIzOSlcIixcbiAgICBncmF5OiAgICAgICAgICAgICAgXCIjODg4XCIsXG4gICAgbGlnaHRncmF5OiAgICAgICAgIFwiI2U1ZTVlNVwiLFxuICB9LFxuICBkYXJrOntcbiAgICBjb2xvcjogICAgICAgICAgICAgXCIjZmZmXCIsXG4gICAgYmFja2dyb3VuZDogICAgICAgIFwiIzIyMlwiLFxuICAgIHJlZDogICAgICAgICAgICAgICBcInJnYigxOTgsIDIwLCAwKVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig5NSwgMTU5LCAyNTUpXCIsXG4gICAgbGlnaHRibHVlOiAgICAgICAgIFwicmdiKDk1LCAxMDAsIDI1NSlcIixcbiAgICBncmVlbjogICAgICAgICAgICAgXCJyZ2IoMCwgMTg1LCAxOSlcIixcbiAgICBncmF5OiAgICAgICAgICAgICAgXCIjNTY1NjU2XCIsXG4gICAgbGlnaHRncmF5OiAgICAgICAgIFwiIzQxNDE0MVwiLFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb2xvciA9IHtcbiAgY29sb3I6IFwidmFyKC0tY29sb3IpXCIsXG4gIGJhY2tncm91bmQ6IFwidmFyKC0tYmFja2dyb3VuZClcIixcbiAgYmx1ZTogXCJ2YXIoLS1ibHVlKVwiLFxuICBsaWdodEJsdWU6IFwidmFyKC0tbGlnaHRibHVlKVwiLFxuICByZWQ6IFwidmFyKC0tcmVkKVwiLFxuICBncmVlbjogXCJ2YXIoLS1ncmVlbilcIixcbiAgZ3JheTogXCJ2YXIoLS1ncmF5KVwiLFxuICBsaWdodGdyYXk6IFwidmFyKC0tbGlnaHRncmF5KVwiXG59XG5cblxubGV0IHN0eWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIilcbnN0eWwuaW5uZXJIVE1MID0gYFxuOnJvb3Qge1xuICAtLWNvbG9yOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmNvbG9yfTtcbiAgLS1iYWNrZ3JvdW5kOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmJhY2tncm91bmR9O1xuICAtLXJlZDogJHtjb2xvclBhbGV0dGUuZGFyay5yZWR9O1xuICAtLWdyZWVuOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyZWVufTtcbiAgLS1ibHVlOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmJsdWV9O1xuICAtLWdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JheX07XG4gIC0tbGlnaHRncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmxpZ2h0Z3JheX07XG4gIGNvbG9yOiB2YXIoLS1jb2xvcik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQpO1xuICBmb250LWZhbWlseTogc2Fucy1zZXJpZjtcbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIDpyb290IHtcbiAgICAtLWNvbG9yOiAke2NvbG9yUGFsZXR0ZS5saWdodC5jb2xvcn07XG4gICAgLS1iYWNrZ3JvdW5kOiAke2NvbG9yUGFsZXR0ZS5saWdodC5iYWNrZ3JvdW5kfTtcbiAgICAtLXJlZDogJHtjb2xvclBhbGV0dGUubGlnaHQucmVkfTtcbiAgICAtLWdyZWVuOiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmVlbn07XG4gICAgLS1ibHVlOiAke2NvbG9yUGFsZXR0ZS5saWdodC5ibHVlfTtcbiAgICAtLWdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyYXl9O1xuICAgIC0tbGlnaHRncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5saWdodGdyYXl9O1xuICB9XG59XG5gXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWwpXG5cbmV4cG9ydCB0eXBlIGh0bWxLZXkgPSAnaW5uZXJUZXh0J3wnb25jbGljaycgfCAnb25pbnB1dCcgfCAnb25rZXlkb3duJyB8ICdvbm1vdXNlZW50ZXInIHwgJ29ubW91c2VvdmVyJyB8ICdvbm1vdXNlZXhpdCcgfCdjaGlsZHJlbid8J2NsYXNzJ3wnaWQnfCdjb250ZW50RWRpdGFibGUnfCdldmVudExpc3RlbmVycyd8J2NvbG9yJ3wnYmFja2dyb3VuZCcgfCAnc3R5bGUnIHwgJ3BsYWNlaG9sZGVyJyB8ICd0YWJJbmRleCcgfCAnY29sU3BhbicgfCAndHlwZSdcbmV4cG9ydCBjb25zdCBodG1sRWxlbWVudCA9ICh0YWc6c3RyaW5nLCB0ZXh0OnN0cmluZywgYXJncz86UGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4pOkhUTUxFbGVtZW50ID0+e1xuXG4gIGNvbnN0IF9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpXG4gIF9lbGVtZW50LnRleHRDb250ZW50ID0gdGV4dFxuICBsZXQgc3QgPSBfZWxlbWVudC5zdHlsZVxuICBpZiAodGFnID09IFwiYnV0dG9uXCIpe1xuICAgIF9lbGVtZW50LmlubmVyVGV4dCA9IHRleHRcbiAgICBzdC5jb2xvciA9IGNvbG9yLmNvbG9yXG4gICAgc3QuYmFja2dyb3VuZENvbG9yID0gY29sb3IubGlnaHRncmF5XG4gICAgc3QuYm9yZGVyID0gXCIxcHggc29saWQgXCIrY29sb3IuZ3JheVxuICAgIHN0LmJvcmRlclJhZGl1cyA9IFwiLjJlbVwiXG4gICAgc3QucGFkZGluZyA9IFwiLjFlbSAuNGVtXCJcbiAgICBzdC5tYXJnaW4gPSBcIi4yZW1cIlxuICB9XG4gIGlmIChhcmdzKSBPYmplY3QuZW50cmllcyhhcmdzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pPT57XG4gICAgaWYgKGtleSA9PT0gJ3BhcmVudCcpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChfZWxlbWVudClcbiAgICB9XG4gICAgaWYgKGtleT09PSdjaGlsZHJlbicpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50W10pLmZvckVhY2goYz0+X2VsZW1lbnQuYXBwZW5kQ2hpbGQoYykpXG4gICAgfWVsc2UgaWYgKGtleT09PSdldmVudExpc3RlbmVycycpe1xuICAgICAgT2JqZWN0LmVudHJpZXModmFsdWUgYXMgUmVjb3JkPHN0cmluZywgKGU6RXZlbnQpPT52b2lkPikuZm9yRWFjaCgoW2V2ZW50LCBsaXN0ZW5lcl0pPT57XG4gICAgICAgIF9lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxuICAgICAgfSlcbiAgICB9ZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKXtcbiAgICAgIE9iamVjdC5hc3NpZ24oX2VsZW1lbnQuc3R5bGUsIHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pXG4gICAgfWVsc2V7XG4gICAgICBfZWxlbWVudFsoa2V5IGFzICdpbm5lclRleHQnIHwgJ29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ2lkJyB8ICdjb250ZW50RWRpdGFibGUnKV0gPSB2YWx1ZVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIF9lbGVtZW50XG59XG5cbmV4cG9ydCB0eXBlIEhUTUxBcmcgPSBzdHJpbmcgfCBudW1iZXIgfCBIVE1MRWxlbWVudCB8IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ICB8IFByb21pc2U8SFRNTEFyZz4gfCBIVE1MQXJnW10gfCBGdW5jdGlvblxuZXhwb3J0IGNvbnN0IGh0bWwgPSAodGFnOnN0cmluZywgLi4uY3M6SFRNTEFyZ1tdKTpIVE1MRWxlbWVudD0+e1xuICBsZXQgY2hpbGRyZW46IEhUTUxFbGVtZW50W10gPSBbXVxuICBsZXQgYXJnczogUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gPSB7fVxuXG4gIGNvbnN0IGFkZF9hcmcgPSAoYXJnOkhUTUxBcmcpPT57XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcpKVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcudG9TdHJpbmcoKSkpXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgUHJvbWlzZSl7XG4gICAgICBjb25zdCBlbCA9IHNwYW4oXCIuLi5cIilcbiAgICAgIGFyZy50aGVuKCh2YWx1ZSk9PntcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKHZhbHVlKSlcbiAgICAgIH0pXG4gICAgICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIH1cbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgY2hpbGRyZW4ucHVzaChhcmcpXG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSBhcmcuZm9yRWFjaCh4PT5hZGRfYXJnKHgpKVxuICAgIC8vIGVsc2UgaWYgKCdnZXQnIGluIGFyZyAmJiB0eXBlb2YgYXJnLmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vICAgY29uc3QgZWwgPSBzcGFuKClcbiAgICAvLyAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgLy8gICBpZiAoJ29udXBkYXRlJyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5vbnVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykgYXJnLm9udXBkYXRlKHg9PmVsLnJlcGxhY2VDaGlsZHJlbih4KSlcbiAgICAvLyB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PSBcImZ1bmN0aW9uXCIpe1xuICAgICAgaWYgKGFyZy5uYW1lID09IFwib25pbnB1dFwiKSBhcmdzLm9uaW5wdXQgPSBhcmdcbiAgICAgIGVsc2UgaWYgKGFyZy5uYW1lID09IFwib25jbGlja1wiIHx8IGFyZy5sZW5ndGggPCAyKSBhcmdzLm9uY2xpY2sgPSBhcmdcbiAgICAgIGVsc2UgY29uc29sZS53YXJuKFwiRnVuY3Rpb24gYXJndW1lbnQgd2l0aG91dCBuYW1lIG9yIHdpdGggbW9yZSB0aGFuIG9uZSBwYXJhbWV0ZXIgaXMgaWdub3JlZCBpbiBodG1sIGdlbmVyYXRvclwiKVxuICAgIH1cbiAgICBlbHNlIGFyZ3MgPSB7Li4uYXJncywgLi4uYXJnfVxuICB9XG4gIGNzLmZvckVhY2goYWRkX2FyZylcbiAgcmV0dXJuIGh0bWxFbGVtZW50KHRhZywgXCJcIiwgey4uLmFyZ3MsIGNoaWxkcmVufSlcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEdlbmVyYXRvcjxUIGV4dGVuZHMgSFRNTEVsZW1lbnQgPSBIVE1MRWxlbWVudD4gPSAoLi4uY3M6SFRNTEFyZ1tdKSA9PiBUXG5jb25zdCBuZXdIdG1sR2VuZXJhdG9yID0gPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4odGFnOnN0cmluZyk9PiguLi5jczpIVE1MQXJnW10pOlQ9Pmh0bWwodGFnLCAuLi5jcykgYXMgVFxuXG5leHBvcnQgY29uc3QgcDpIVE1MR2VuZXJhdG9yPEhUTUxQYXJhZ3JhcGhFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwXCIpXG5leHBvcnQgY29uc3QgYTpIVE1MR2VuZXJhdG9yPEhUTUxBbmNob3JFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJhXCIpXG5leHBvcnQgY29uc3QgaDE6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgxXCIpXG5leHBvcnQgY29uc3QgaDI6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgyXCIpXG5leHBvcnQgY29uc3QgaDM6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgzXCIpXG5leHBvcnQgY29uc3QgaDQ6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImg0XCIpXG5cbmV4cG9ydCBjb25zdCBkaXY6SFRNTEdlbmVyYXRvcjxIVE1MRGl2RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiZGl2XCIpXG5leHBvcnQgY29uc3QgcHJlOkhUTUxHZW5lcmF0b3I8SFRNTFByZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInByZVwiKVxuZXhwb3J0IGNvbnN0IHNwYW46SFRNTEdlbmVyYXRvcjxIVE1MU3BhbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInNwYW5cIilcbmV4cG9ydCBjb25zdCB0ZXh0YXJlYTpIVE1MR2VuZXJhdG9yPEhUTUxUZXh0QXJlYUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRleHRhcmVhXCIpXG5cbmV4cG9ydCBjb25zdCBidXR0b246SFRNTEdlbmVyYXRvcjxIVE1MQnV0dG9uRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYnV0dG9uXCIpXG4vLyBleHBvcnQgY29uc3QgdGFibGUgPSAocm93czogSFRNTEFyZ1tdW10sIC4uLmFyZ3M6IEhUTUxBcmdbXSkgPT4gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpKCBzdHlsZSh7Ym9yZGVyU3BhY2luZzogXCIxZW0gLjRlbVwifSkgLCByb3dzLm1hcChjZWxscz0+dHIoY2VsbHMubWFwKGNlbGw9PnRkKGNlbGwpKSkpLCAuLi5hcmdzKVxuZXhwb3J0IGNvbnN0IHRhYmxlOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIilcblxuZXhwb3J0IGNvbnN0IHRyOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlUm93RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidHJcIilcbmV4cG9ydCBjb25zdCB0ZDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZFwiKVxuZXhwb3J0IGNvbnN0IHRoOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRoXCIpXG5leHBvcnQgY29uc3QgY2FudmFzOkhUTUxHZW5lcmF0b3I8SFRNTENhbnZhc0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImNhbnZhc1wiKVxuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSAoLi4ucnVsZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5bXSkgPT4gKHtzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgLi4ucnVsZXMpfSlcbmV4cG9ydCBjb25zdCBtYXJnaW4gPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe21hcmdpbjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHBhZGRpbmcgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3BhZGRpbmc6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXIgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlcjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlclJhZGl1cyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyUmFkaXVzOiB2YWx1ZX0pXG5leHBvcnQgY29uc3Qgd2lkdGggPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3dpZHRoOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgaGVpZ2h0ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtoZWlnaHQ6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBkaXNwbGF5ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtkaXNwbGF5OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYmFja2dyb3VuZCA9ICh2YWx1ZTogc3RyaW5nID0gXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiKSA9PiBzdHlsZSh7YmFja2dyb3VuZDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3QgaW5wdXQ6SFRNTEdlbmVyYXRvcjxIVE1MSW5wdXRFbGVtZW50PiA9ICguLi5jcyk9PntcbiAgY29uc3QgY29udGVudCA9IGNzLmZpbHRlcihjPT50eXBlb2YgYyA9PSAnc3RyaW5nJykuam9pbignICcpXG4gIGNvbnN0IGVsID0gaHRtbChcImlucHV0XCIsIC4uLmNzKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gIGVsLnZhbHVlID0gY29udGVudFxuICByZXR1cm4gZWxcbn1cblxuXG5leHBvcnQgY29uc3QgcG9wdXAgPSAoLi4uY3M6SFRNTEFyZ1tdKT0+e1xuICBjb25zdCBkaWFsb2dmaWVsZCA9IGRpdih7XG4gICAgc3R5bGU6IHtcbiAgICAgIGJhY2tncm91bmQ6IGNvbG9yLmJhY2tncm91bmQsXG4gICAgICBjb2xvcjogY29sb3IuY29sb3IsXG4gICAgICBwYWRkaW5nOiBcIjFlbSA0ZW1cIixcbiAgICAgIHBhZGRpbmdCb3R0b206IFwiMmVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMWVtXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgICAgb3ZlcmZsb3dZOiBcInNjcm9sbFwiLFxuICAgICAgbWluV2lkdGg6IFwiMjB2d1wiLFxuICAgICAgbWF4SGVpZ2h0OiBcIjgwdmhcIixcbiAgICB9fSxcbiAgICAuLi5jcylcblxuICBjb25zdCBwb3B1cGJhY2tncm91bmQgPSBkaXYoXG4gICAge3N0eWxlOntcbiAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICB0b3A6IFwiMFwiLFxuICAgICAgbGVmdDogXCIwXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJyZ2JhKDE2NiwgMTY2LCAxNjYsIDAuNSlcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICB9fVxuICApXG5cbiAgcG9wdXBiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKGRpYWxvZ2ZpZWxkKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwb3B1cGJhY2tncm91bmQpO1xuICBwb3B1cGJhY2tncm91bmQub25jbGljayA9ICgpID0+IHtwb3B1cGJhY2tncm91bmQucmVtb3ZlKCk7IH1cbiAgZGlhbG9nZmllbGQub25jbGljayA9IChlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICByZXR1cm4gcG9wdXBiYWNrZ3JvdW5kXG5cbn1cblxuZXhwb3J0IGNvbnN0IGVycm9ycG9wdXAgPSAoZTpFcnJvciB8IHN0cmluZykgPT57XG4gIHBvcHVwKGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOmNvbG9yLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6XCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgIHBhZGRpbmc6XCIxZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czpcIi40ZW1cIixcbiAgICAgIGNvbG9yOmNvbG9yLnJlZCxcbiAgICB9KSxcbiAgICBoMihcIkVycm9yXCIpLFxuICAgIHAoU3RyaW5nKGUpKVxuICApKVxuICB0aHJvdyAoZSBpbnN0YW5jZW9mIEVycm9yKSA/IGUgOiBuZXcgRXJyb3IoU3RyaW5nKGUpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFuZWxMaXN0KGl0ZW1zOiB7dGl0bGU6IEhUTUxBcmcsIGNvbnRlbnQ6IEhUTUxBcmd9W10pe1xuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgIGdhcDogXCIxZW1cIixcbiAgICB9KSxcbiAgICAuLi5pdGVtcy5tYXAoZj0+ZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuNGVtXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjVlbSAxZW1cIixcbiAgICAgIH0pLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgZm9udFdlaWdodDogXCJib2xkXCIsXG4gICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYudGl0bGVcbiAgICAgICksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBtYXJnaW5Ub3A6IFwiLjVlbVwiLFxuICAgICAgICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi5jb250ZW50XG4gICAgICApXG4gICAgKSlcbiAgKVxufVxuXG5cblxuXG4iLAogICAgImltcG9ydCB7IGFycmF5LCBjb21waWxlLCBmdW5jLCBpMzIsIGxvY2FsLCByZXQsIHdoaWxlTG9vcCB9IGZyb20gXCIuLi93YXNtXCI7XG5pbXBvcnQgeyBib2R5LCBoMiwgcCB9IGZyb20gXCIuL2h0bWxcIjtcblxuY29uc3QgeHMgPSBhcnJheShcImkzMlwiLCAxMDI0KVxuY29uc3QgeXMgPSBhcnJheShcImkzMlwiLCAxMDI0KVxuY29uc3Qgb3V0ID0gYXJyYXkoXCJpMzJcIiwgMTAyNClcblxuY29uc3QgdSA9IGFycmF5KFwiaTMyXCIsIDEwKVxuXG5jb25zdCBzdW1JbnRvID0gZnVuYyhbXCJpMzJcIl0sIFwiaTMyXCIsIG4gPT4ge1xuICBjb25zdCBpID0gbG9jYWwuaTMyKClcbiAgcmV0dXJuIFtcbiAgICBpLnNldCgwKSxcbiAgICB3aGlsZUxvb3AoaS5sdChuKSwgW1xuICAgICAgb3V0LnN0b3JlKGksIHhzLmxvYWQoaSkuYWRkKHlzLmxvYWQoaSkpKSxcbiAgICAgIGkuaWFkZCgxKSxcbiAgICBdKSxcbiAgICByZXQoMCksXG4gIF1cbn0pXG5cblxuY29uc3QgbW9kID0gYXdhaXQgY29tcGlsZSh7XG4gIHN1bUludG8sXG4gIHhzLFxuICB5cyxcbiAgb3V0LFxufSlcblxubGV0IG49IDhcblxuZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgbW9kLnhzW2ldID0gaVxuICBtb2QueXNbaV0gPSBpICogMTBcbn1cblxuY29uc3Qgc3QgPSBwZXJmb3JtYW5jZS5ub3coKVxubW9kLnN1bUludG8obilcbmNvbnN0IG1zID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdFxuXG5ib2R5LmFwcGVuZChcbiAgaDIoXCJ3YXNtIGFycmF5c1wiKSxcbiAgcChgc3VtSW50bygke259KSBpbiAke21zLnRvRml4ZWQoMyl9IG1zYCksXG4gIHAoYG91dCA9ICR7QXJyYXkuZnJvbShtb2Qub3V0LnNsaWNlKDAsIG4pKS5qb2luKFwiLCBcIil9YCksXG5cbilcblxuXG5cblxuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLElBQU0sUUFBUSxDQUFDLEdBQU0sSUFBTSxLQUFNLEtBQU0sR0FBTSxHQUFNLEdBQU0sQ0FBSTtBQUM3RCxJQUFNLFdBQVcsQ0FBQyxPQUFPLE9BQU8sT0FBTyxLQUFLO0FBQzVDLElBQU0sU0FBUyxDQUFDLE9BQU8sT0FBTyxPQUFPLEtBQUs7QUFDMUMsSUFBTSxTQUFTLENBQUMsTUFBTSxNQUFNLElBQUk7QUFxSGhDLElBQU0sUUFBUTtBQUFBLEVBQ1osTUFBTSxFQUFFLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssSUFBSztBQUFBLEVBQ25ELEtBQUs7QUFBQSxJQUNILEtBQUssRUFBRSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLElBQUs7QUFBQSxJQUNsRCxLQUFLLEVBQUUsS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxJQUFLO0FBQUEsSUFDbEQsS0FBSyxFQUFFLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssSUFBSztBQUFBLElBQ2xELEtBQUssRUFBRSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLElBQUs7QUFBQSxFQUNwRDtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gsSUFBSSxFQUFFLEtBQUssSUFBTSxLQUFLLElBQU0sS0FBSyxJQUFNLEtBQUssR0FBSztBQUFBLElBQ2pELElBQUksRUFBRSxLQUFLLElBQU0sS0FBSyxJQUFNLEtBQUssSUFBTSxLQUFLLEdBQUs7QUFBQSxJQUNqRCxJQUFJLEVBQUUsS0FBSyxJQUFNLEtBQUssSUFBTSxLQUFLLElBQU0sS0FBSyxJQUFLO0FBQUEsRUFDbkQ7QUFBQSxFQUNBLE1BQU0sRUFBRSxLQUFLLElBQU0sS0FBSyxJQUFNLEtBQUssSUFBTSxLQUFLLEdBQUs7QUFBQSxFQUNuRCxPQUFPLEVBQUUsS0FBSyxJQUFNLEtBQUssSUFBTSxLQUFLLElBQU0sS0FBSyxHQUFLO0FBQUEsRUFDcEQsT0FBTyxFQUFFLEtBQUssR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssRUFBRTtBQUFBLEVBQ3hDLE9BQU8sRUFBRSxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEVBQUU7QUFDMUM7QUFFQSxJQUFNLE1BQU0sQ0FBQyxNQUFjO0FBQUEsRUFDekIsSUFBSSxDQUFDLE9BQU8sVUFBVSxDQUFDLEtBQUssSUFBSTtBQUFBLElBQUcsTUFBTSxJQUFJLE1BQU0sa0NBQWtDLEdBQUc7QUFBQSxFQUN4RixNQUFNLE1BQWdCLENBQUM7QUFBQSxFQUN2QixHQUFHO0FBQUEsSUFDRCxJQUFJLE9BQU8sSUFBSTtBQUFBLElBQ2YsT0FBTztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQUcsUUFBUTtBQUFBLElBQ2YsSUFBSSxLQUFLLElBQUk7QUFBQSxFQUNmLFNBQVM7QUFBQSxFQUNULE9BQU87QUFBQTtBQUdULElBQU0sS0FBSyxDQUFDLE9BQXdCLFNBQWtCO0FBQUEsRUFDcEQsTUFBTSxNQUFnQixDQUFDO0FBQUEsRUFDdkIsSUFBSSxJQUFJLFNBQVMsS0FBSyxPQUFRLFFBQW1CLENBQUMsSUFBSSxPQUFPLE9BQU8sSUFBSSxLQUFlO0FBQUEsRUFDdkYsVUFBUztBQUFBLElBQ1AsSUFBSSxPQUFPLE9BQU8sSUFBSSxLQUFLO0FBQUEsSUFDM0IsTUFBTTtBQUFBLElBQ04sTUFBTSxPQUFRLE1BQU0sT0FBTyxPQUFPLFFBQVUsS0FBTyxNQUFNLENBQUMsT0FBTyxPQUFPLFFBQVU7QUFBQSxJQUNsRixJQUFJLENBQUM7QUFBQSxNQUFNLFFBQVE7QUFBQSxJQUNuQixJQUFJLEtBQUssSUFBSTtBQUFBLElBQ2IsSUFBSTtBQUFBLE1BQU0sT0FBTztBQUFBLEVBQ25CO0FBQUE7QUFHRixJQUFNLEtBQUssQ0FBQyxPQUFlLFVBQWlCO0FBQUEsRUFDMUMsTUFBTSxNQUFNLElBQUksV0FBVyxLQUFLO0FBQUEsRUFDaEMsTUFBTSxPQUFPLElBQUksU0FBUyxJQUFJLE1BQU07QUFBQSxFQUNwQyxVQUFVLElBQUksS0FBSyxXQUFXLEdBQUcsT0FBTyxJQUFJLElBQUksS0FBSyxXQUFXLEdBQUcsT0FBTyxJQUFJO0FBQUEsRUFDOUUsT0FBTyxDQUFDLEdBQUcsR0FBRztBQUFBO0FBR2hCLElBQU0sTUFBTSxDQUFDLE1BQWM7QUFBQSxFQUN6QixNQUFNLFFBQVEsSUFBSSxZQUFZLEVBQUUsT0FBTyxDQUFDO0FBQUEsRUFDeEMsT0FBTyxDQUFDLEdBQUcsSUFBSSxNQUFNLE1BQU0sR0FBRyxHQUFHLEtBQUs7QUFBQTtBQUd4QyxJQUFNLFVBQVUsQ0FBQyxJQUFZLFlBQXNCLENBQUMsSUFBSSxHQUFHLElBQUksUUFBUSxNQUFNLEdBQUcsR0FBRyxPQUFPO0FBQzFGLElBQU0sVUFBVSxDQUFPLElBQVMsT0FBc0IsR0FBRyxRQUFRLEVBQUU7QUFDbkUsSUFBTSxNQUFNLENBQUMsTUFBc0I7QUFBQSxFQUFFLE1BQU0sSUFBSSxNQUFNLHFCQUFxQixPQUFPLENBQUMsR0FBRztBQUFBO0FBRXJGLElBQUksYUFBYTtBQUNqQixJQUFJLGNBQWM7QUFDbEIsSUFBSSxjQUFjO0FBQ2xCLElBQUksZ0JBQWdCO0FBQ3BCLElBQU0sZ0JBQWdCLElBQUk7QUFFMUIsSUFBTSxZQUFZLENBQW9CLFVBQ25DLE9BQU8sVUFBVSxZQUFZLFVBQVUsU0FBUSxVQUFVLFNBQVEsTUFBTSxPQUFPO0FBRWpGLElBQU0sYUFBYSxDQUFvQixNQUFlO0FBQUEsRUFDcEQsV0FBVyxNQUFNO0FBQUEsSUFBUSxFQUFFLE1BQU0sT0FBSyxJQUFJLElBQUksR0FBRyxDQUFDO0FBQUEsRUFDbEQsV0FBVyxNQUFNO0FBQUEsSUFBUSxFQUFFLE1BQU0sT0FBSyxJQUFJLElBQUksR0FBRyxDQUFDO0FBQUEsRUFDbEQsT0FBTztBQUFBO0FBR1QsSUFBTSxPQUFPLENBQW9CLFNBQStCO0FBQUEsRUFDOUQsT0FBTyxXQUFXLElBQWU7QUFBQTtBQUduQyxJQUFNLE1BQU0sQ0FBb0IsTUFBUyxVQUFnQztBQUFBLEVBQ3ZFLElBQUksT0FBTyxVQUFVLFlBQVksVUFBVSxNQUFNO0FBQUEsSUFDL0MsSUFBSSxVQUFVO0FBQUEsTUFBTyxPQUFPO0FBQUEsSUFDNUIsSUFBSSxTQUFTO0FBQUEsTUFBTyxPQUFPLE1BQU0sSUFBSTtBQUFBLEVBQ3ZDO0FBQUEsRUFDQSxPQUFPLEtBQUssRUFBRSxNQUFNLFNBQVMsTUFBTSxNQUF5QixDQUFDO0FBQUE7QUFHL0QsSUFBTSxTQUFTLENBQUMsTUFDZCxDQUFDLENBQUMsS0FBSyxPQUFPLE1BQU0sYUFBWSxVQUFVLE9BQ3ZDLEVBQVcsU0FBUyxlQUNwQixFQUFXLFNBQVMsaUJBQ3BCLEVBQVcsU0FBUyxXQUNwQixFQUFXLFNBQVMsVUFDcEIsRUFBVyxTQUFTLFdBQ3BCLEVBQVcsU0FBUyxjQUNwQixFQUFXLFNBQVMsWUFDcEIsRUFBVyxTQUFTLFVBQ25CLEVBQVcsU0FBUyxRQUFRLE1BQU0sUUFBUyxFQUF5QixJQUFJO0FBRzlFLElBQU0sV0FBVyxDQUFDLFNBQW1CLE1BQU0sUUFBUSxJQUFJLElBQUksT0FBTyxDQUFDLElBQUk7QUFDdkUsSUFBTSxZQUFZLENBQUMsTUFBZ0IsSUFBWSxTQUM3QyxTQUFTLElBQUksRUFBRSxJQUFJLE9BQUssU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDO0FBRS9DLElBQU0sV0FBVyxDQUFDLEdBQVMsSUFBWSxTQUE4QjtBQUFBLEVBQ25FLFFBQVEsRUFBRTtBQUFBLFNBQ0g7QUFBQSxNQUFNLE9BQU8sS0FBSyxHQUFHLE1BQU0sVUFBVSxFQUFFLE1BQU0sSUFBSSxJQUFJLEdBQUcsTUFBTSxVQUFVLEVBQUUsTUFBTSxJQUFJLElBQUksRUFBRTtBQUFBLFNBQzFGO0FBQUEsTUFBUyxPQUFPLEtBQUssR0FBRyxRQUFRLEVBQUUsVUFBVSxHQUFHO0FBQUEsU0FDL0M7QUFBQSxNQUNILElBQUksRUFBRSxVQUFVO0FBQUEsUUFBTSxPQUFPO0FBQUEsTUFDN0IsSUFBSSxRQUFRO0FBQUEsUUFBTSxNQUFNLElBQUksTUFBTSxrQ0FBa0M7QUFBQSxNQUNwRSxPQUFPLEtBQUssR0FBRyxRQUFRLEtBQUs7QUFBQTtBQUFBLE1BQ3JCLE9BQU87QUFBQTtBQUFBO0FBSXBCLElBQU0sY0FBYyxDQUEwQixNQUFTLFNBQ3JELFVBQVUsT0FBTyxTQUFTLGFBQWEsS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLElBQUksS0FBSyxTQUFTLFNBQVMsS0FBSyxLQUFLLElBQUk7QUFFMUcsSUFBTSxNQUFNLENBQW9CLElBQVcsTUFBZSxVQUN4RCxLQUFLLEVBQUUsTUFBTSxPQUFPLE1BQU0sS0FBSyxNQUFNLElBQUksTUFBTSxPQUFPLElBQUksS0FBSyxNQUFNLEtBQUssRUFBRSxDQUFDO0FBRS9FLElBQU0sTUFBTSxDQUFvQixJQUFXLE1BQWUsVUFDeEQsS0FBSyxFQUFFLE1BQU0sT0FBTyxNQUFNLE9BQU8sV0FBVyxLQUFLLE1BQU0sSUFBSSxNQUFNLE9BQU8sSUFBSSxLQUFLLE1BQU0sS0FBSyxFQUFFLENBQUM7QUFFakcsSUFBTSxZQUFZLENBQW9CLE1BQVMsVUFBa0IsS0FBSyxFQUFFLE1BQU0sYUFBYSxNQUFNLE1BQU0sQ0FBQztBQUV4RyxJQUFNLFVBQVUsQ0FBb0IsU0FBeUI7QUFBQSxFQUMzRCxNQUFNLEtBQUs7QUFBQSxFQUNYLE1BQU0sTUFBTSxNQUFNLFVBQVUsTUFBTSxFQUFFO0FBQUEsRUFDcEMsTUFBTSxNQUFNLENBQUMsV0FBOEIsRUFBRSxNQUFNLGFBQWEsT0FBTyxJQUFJLE1BQU0sT0FBTyxJQUFJLE1BQU0sS0FBSyxFQUFtQjtBQUFBLEVBQzFILE1BQU0sTUFBbUI7QUFBQSxJQUN2QjtBQUFBLElBQUk7QUFBQSxJQUFNO0FBQUEsSUFBSztBQUFBLElBQ2YsS0FBSyxXQUFTLElBQUksRUFBRSxJQUFJLEtBQUs7QUFBQSxJQUFHLEtBQUssV0FBUyxJQUFJLEVBQUUsSUFBSSxLQUFLO0FBQUEsSUFBRyxLQUFLLFdBQVMsSUFBSSxFQUFFLElBQUksS0FBSztBQUFBLElBQUcsS0FBSyxXQUFTLElBQUksRUFBRSxJQUFJLEtBQUs7QUFBQSxJQUM3SCxJQUFJLFdBQVMsSUFBSSxFQUFFLEdBQUcsS0FBSztBQUFBLElBQUcsSUFBSSxXQUFTLElBQUksRUFBRSxHQUFHLEtBQUs7QUFBQSxJQUFHLElBQUksV0FBUyxJQUFJLEVBQUUsR0FBRyxLQUFLO0FBQUEsSUFDdkYsTUFBTSxXQUFTLElBQUksSUFBSSxFQUFFLElBQUksS0FBSyxDQUFDO0FBQUEsSUFBRyxNQUFNLFdBQVMsSUFBSSxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUM7QUFBQSxJQUFHLE1BQU0sV0FBUyxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQztBQUFBLElBQUcsTUFBTSxXQUFTLElBQUksSUFBSSxFQUFFLElBQUksS0FBSyxDQUFDO0FBQUEsRUFDdko7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUdULElBQU0sV0FBVyxDQUNmLFFBQ0EsUUFDQSxVQUNxQjtBQUFBLEVBQ3JCLE1BQU0sS0FBSztBQUFBLEVBQ1gsT0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ047QUFBQSxJQUFJO0FBQUEsSUFBUTtBQUFBLElBQVE7QUFBQSxJQUNwQixNQUFNLElBQUksU0FBc0IsS0FBSyxFQUFFLE1BQU0sUUFBUSxNQUFNLFFBQVEsUUFBUSxJQUFJLEtBQThCLENBQUM7QUFBQSxFQUNoSDtBQUFBO0FBR0YsSUFBTSxVQUFVLENBQW9CLE1BQVMsV0FBbUM7QUFBQSxFQUM5RSxJQUFJLENBQUMsT0FBTyxVQUFVLE1BQU0sS0FBSyxVQUFVO0FBQUEsSUFBRyxNQUFNLElBQUksTUFBTSx3QkFBd0IsUUFBUTtBQUFBLEVBQzlGLE1BQU0sS0FBSztBQUFBLEVBQ1gsTUFBTSxTQUF5QjtBQUFBLElBQzdCLE1BQU07QUFBQSxJQUNOO0FBQUEsSUFBSTtBQUFBLElBQU07QUFBQSxJQUNWLE1BQU0sV0FBUyxLQUFLLEVBQUUsTUFBTSxRQUFRLE1BQU0sT0FBTyxJQUFJLE9BQU8sSUFBSSxPQUFPLEtBQUssRUFBRSxDQUFDO0FBQUEsSUFDL0UsT0FBTyxDQUFDLE9BQU8sV0FBVyxFQUFFLE1BQU0sZUFBZSxPQUFPLElBQUksTUFBTSxPQUFPLElBQUksT0FBTyxLQUFLLEdBQUcsT0FBTyxJQUFJLE1BQU0sS0FBSyxFQUFtQjtBQUFBLEVBQ3ZJO0FBQUEsRUFDQSxjQUFjLElBQUksSUFBSSxNQUE2QjtBQUFBLEVBQ25ELE9BQU87QUFBQTtBQW9CRixJQUFNLE9BQU8sQ0FBd0QsUUFBVyxRQUFXLFVBQ2hHLFNBQVMsUUFBUSxRQUFRLEtBQTJEO0FBQy9FLElBQU0sUUFBUSxDQUFvQixNQUFTLFdBQW1CLFFBQVEsTUFBTSxNQUFNO0FBRWxGLElBQU0sUUFBUSxPQUFPLFlBQVksU0FBUyxJQUFJLFVBQVEsQ0FBQyxNQUFNLE1BQU0sUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBRWxGLElBQU0sTUFBTSxDQUFvQixXQUE4QjtBQUFBLEVBQ25FLE1BQU07QUFBQSxFQUNOLE9BQU8sSUFBSSxVQUFVLEtBQUssR0FBRyxLQUFLO0FBQ3BDO0FBTU8sSUFBTSxPQUFPLENBQUMsTUFBbUIsU0FBd0M7QUFBQSxFQUM5RSxNQUFNLE9BQW1CLEVBQUUsTUFBTSxRQUFRLElBQUksZ0JBQWdCO0FBQUEsRUFDN0QsT0FBTyxFQUFFLE1BQU0sUUFBUSxTQUFTLEtBQUssSUFBSSxNQUFNLE1BQU0sWUFBWSxNQUFNLElBQUksRUFBRTtBQUFBO0FBRXhFLElBQU0sWUFBWTtBQWdCekIsSUFBTSxXQUFXLENBQUMsR0FBa0IsUUFHOUI7QUFBQSxFQUNKLFFBQVEsRUFBRTtBQUFBLFNBQ0g7QUFBQSxNQUFTO0FBQUEsU0FDVDtBQUFBLE1BQWEsSUFBSSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUk7QUFBQSxNQUFHO0FBQUEsU0FDM0M7QUFBQSxTQUNBO0FBQUEsTUFDSCxTQUFTLEVBQUUsTUFBTSxHQUFHO0FBQUEsTUFBRyxTQUFTLEVBQUUsT0FBTyxHQUFHO0FBQUEsTUFBRztBQUFBLFNBQzVDO0FBQUEsTUFDSCxFQUFFLEtBQUssUUFBUSxTQUFPLFNBQVMsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUFHO0FBQUEsU0FDeEM7QUFBQSxNQUNILFNBQVMsRUFBRSxNQUFNLEdBQUc7QUFBQSxNQUFHLFNBQVMsRUFBRSxNQUFNLEdBQUc7QUFBQSxNQUFHLFNBQVMsRUFBRSxNQUFNLEdBQUc7QUFBQSxNQUFHO0FBQUEsU0FDbEU7QUFBQSxNQUNILElBQUksUUFBUSxFQUFFLEtBQUs7QUFBQSxNQUFHLFNBQVMsRUFBRSxPQUFPLEdBQUc7QUFBQSxNQUFHO0FBQUE7QUFBQSxNQUN2QyxJQUFJLENBQUM7QUFBQTtBQUFBO0FBSWxCLElBQU0sV0FBVyxDQUFDLEdBQVMsUUFHckI7QUFBQSxFQUNKLFFBQVEsRUFBRTtBQUFBLFNBQ0g7QUFBQSxNQUFhLElBQUksUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJO0FBQUEsTUFBRyxTQUFTLEVBQUUsT0FBTyxHQUFHO0FBQUEsTUFBRztBQUFBLFNBQ25FO0FBQUEsTUFBZSxJQUFJLFFBQVEsRUFBRSxLQUFLO0FBQUEsTUFBRyxTQUFTLEVBQUUsT0FBTyxHQUFHO0FBQUEsTUFBRyxTQUFTLEVBQUUsT0FBTyxHQUFHO0FBQUEsTUFBRztBQUFBLFNBQ3JGO0FBQUEsTUFBTSxTQUFTLEVBQUUsTUFBTSxHQUFHO0FBQUEsTUFBRyxFQUFFLEtBQUssUUFBUSxPQUFLLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFBQSxNQUFHLEVBQUUsS0FBSyxRQUFRLE9BQUssU0FBUyxHQUFHLEdBQUcsQ0FBQztBQUFBLE1BQUc7QUFBQSxTQUMzRztBQUFBLE1BQVMsRUFBRSxLQUFLLFFBQVEsT0FBSyxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBQUEsTUFBRztBQUFBLFNBQ2hEO0FBQUEsTUFBUSxTQUFTLEVBQUUsTUFBTSxHQUFHO0FBQUEsTUFBRyxFQUFFLEtBQUssUUFBUSxPQUFLLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFBQSxNQUFHO0FBQUEsU0FDdEU7QUFBQSxTQUNBO0FBQUEsTUFDSDtBQUFBLFNBQ0c7QUFBQSxNQUFVLFNBQVMsRUFBRSxPQUFPLEdBQUc7QUFBQSxNQUFHO0FBQUEsU0FDbEM7QUFBQSxNQUFRLFNBQVMsRUFBRSxNQUFNLEdBQUc7QUFBQSxNQUFHO0FBQUE7QUFBQSxNQUMzQixJQUFJLENBQUM7QUFBQTtBQUFBO0FBSWxCLElBQU0sT0FBTyxDQUFDLFFBQXFCLFVBQXVCLE1BQU0sSUFBSSxNQUFNLE1BQU0sT0FBTyxLQUFLLEVBQUUsSUFBSSxPQUFPLE1BQU07QUFDL0csSUFBTSxTQUFTLENBQUMsTUFBZSxTQUFTLE1BQU0sQ0FBQyxHQUFHLElBQUksTUFBTSxNQUFNLEtBQUssR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDO0FBQ3hGLElBQU0sV0FBVyxDQUFDLE1BQW1CLEVBQUUsU0FBUyxVQUFVLEVBQUUsUUFBUTtBQUNwRSxJQUFNLG1CQUFtQixDQUFDLFFBQXFCLFVBQXVCO0FBQUEsRUFDcEUsTUFBTSxJQUFJLFNBQVMsS0FBSztBQUFBLEVBQ3hCLElBQUksS0FBSztBQUFBLElBQU07QUFBQSxFQUNmLElBQUksQ0FBQyxPQUFPLFVBQVUsQ0FBQyxLQUFLLElBQUksS0FBSyxLQUFLLE9BQU87QUFBQSxJQUFRLE1BQU0sSUFBSSxNQUFNLGVBQWUsOEJBQThCLE9BQU8sUUFBUTtBQUFBO0FBR3ZJLElBQU0sY0FBYyxDQUFDLEdBQWtCLEtBQTZCLEtBQTZCLFdBQWtEO0FBQUEsRUFDakosUUFBUSxFQUFFO0FBQUEsU0FDSDtBQUFBLE1BQ0gsSUFBSSxFQUFFLFNBQVM7QUFBQSxRQUFPLE9BQU8sQ0FBQyxJQUFNLEdBQUcsR0FBRyxFQUFFLE9BQWlCLEVBQUUsQ0FBQztBQUFBLE1BQ2hFLElBQUksRUFBRSxTQUFTO0FBQUEsUUFBTyxPQUFPLENBQUMsSUFBTSxHQUFHLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUFBLE1BQ3RELElBQUksRUFBRSxTQUFTO0FBQUEsUUFBTyxPQUFPLENBQUMsSUFBTSxHQUFHLEdBQUcsRUFBRSxPQUFpQixDQUFDLENBQUM7QUFBQSxNQUMvRCxJQUFJLEVBQUUsU0FBUztBQUFBLFFBQU8sT0FBTyxDQUFDLElBQU0sR0FBRyxHQUFHLEVBQUUsT0FBaUIsQ0FBQyxDQUFDO0FBQUEsTUFDL0QsT0FBTyxJQUFJLENBQUM7QUFBQSxTQUNUO0FBQUEsTUFDSCxPQUFPLENBQUMsSUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLE1BQU8sQ0FBQztBQUFBLFNBQ2hDO0FBQUEsTUFDSCxPQUFPLENBQUMsR0FBRyxZQUFZLEVBQUUsTUFBTSxLQUFLLEtBQUssTUFBTSxHQUFHLEdBQUcsWUFBWSxFQUFFLE9BQU8sS0FBSyxLQUFLLE1BQU0sR0FBRyxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSztBQUFBLFNBQ2pIO0FBQUEsTUFDSCxPQUFPLENBQUMsR0FBRyxZQUFZLEVBQUUsTUFBTSxLQUFLLEtBQUssTUFBTSxHQUFHLEdBQUcsWUFBWSxFQUFFLE9BQU8sS0FBSyxLQUFLLE1BQU0sR0FBRyxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVTtBQUFBLFNBQ3RIO0FBQUEsTUFDSCxJQUFJLElBQUksRUFBRSxXQUFXO0FBQUEsUUFBTSxNQUFNLElBQUksTUFBTSxvQkFBb0IsRUFBRSxRQUFRO0FBQUEsTUFDekUsT0FBTyxDQUFDLEdBQUcsUUFBUSxFQUFFLE1BQU0sU0FBTyxZQUFZLEtBQUssS0FBSyxLQUFLLE1BQU0sQ0FBQyxHQUFHLElBQU0sR0FBRyxJQUFJLElBQUksRUFBRSxPQUFRLENBQUM7QUFBQSxTQUNoRztBQUFBLE1BQ0gsT0FBTyxDQUFDLEdBQUcsWUFBWSxFQUFFLE1BQU0sS0FBSyxLQUFLLE1BQU0sR0FBRyxHQUFNLE1BQU0sS0FBSyxFQUFFLE9BQU8sR0FBRyxZQUFZLEVBQUUsTUFBTSxLQUFLLEtBQUssTUFBTSxHQUFHLEdBQU0sR0FBRyxZQUFZLEVBQUUsTUFBTSxLQUFLLEtBQUssTUFBTSxHQUFHLEVBQUk7QUFBQSxTQUN2SyxRQUFRO0FBQUEsTUFDWCxNQUFNLFNBQVMsT0FBTyxFQUFFO0FBQUEsTUFDeEIsSUFBSSxDQUFDO0FBQUEsUUFBUSxNQUFNLElBQUksTUFBTSxpQkFBaUIsRUFBRSxPQUFPO0FBQUEsTUFDdkQsaUJBQWlCLFFBQVEsRUFBRSxLQUFLO0FBQUEsTUFDaEMsT0FBTyxDQUFDLEdBQUcsWUFBWSxLQUFLLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxLQUFLLE1BQU0sR0FBRyxNQUFNLEtBQUssRUFBRSxPQUFPLEdBQUcsT0FBTyxFQUFFLElBQUksQ0FBQztBQUFBLElBQ3hHO0FBQUE7QUFBQSxNQUVFLE9BQU8sSUFBSSxDQUFDO0FBQUE7QUFBQTtBQUtsQixJQUFNLFFBQVEsQ0FBQyxPQUFxQixTQUFpQixTQUEwQztBQUFBLEVBQzdGLE1BQU0sSUFBSSxNQUFNLFVBQVUsT0FBSyxFQUFFLFlBQVksV0FBVyxFQUFFLFNBQVMsSUFBSTtBQUFBLEVBQ3ZFLElBQUksSUFBSTtBQUFBLElBQUcsTUFBTSxJQUFJLE1BQU0sV0FBVyxlQUFlLFNBQVM7QUFBQSxFQUM5RCxPQUFPO0FBQUE7QUFHVCxJQUFNLGNBQWMsQ0FDbEIsR0FDQSxLQUNBLEtBQ0EsUUFDQSxRQUFzQixDQUFDLE1BQ1Y7QUFBQSxFQUNiLFFBQVEsRUFBRTtBQUFBLFNBQ0g7QUFBQSxNQUNILE9BQU8sQ0FBQyxHQUFHLFlBQVksRUFBRSxPQUFPLEtBQUssS0FBSyxNQUFNLEdBQUcsSUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLE1BQU8sQ0FBQztBQUFBLFNBQzNFLGVBQWU7QUFBQSxNQUNsQixNQUFNLFNBQVMsT0FBTyxFQUFFO0FBQUEsTUFDeEIsSUFBSSxDQUFDO0FBQUEsUUFBUSxNQUFNLElBQUksTUFBTSxpQkFBaUIsRUFBRSxPQUFPO0FBQUEsTUFDdkQsaUJBQWlCLFFBQVEsRUFBRSxLQUFLO0FBQUEsTUFDaEMsT0FBTyxDQUFDLEdBQUcsWUFBWSxLQUFLLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxLQUFLLE1BQU0sR0FBRyxHQUFHLFlBQVksRUFBRSxPQUFPLEtBQUssS0FBSyxNQUFNLEdBQUcsTUFBTSxNQUFNLEVBQUUsT0FBTyxHQUFHLE9BQU8sRUFBRSxJQUFJLENBQUM7QUFBQSxJQUNwSjtBQUFBLFNBQ0s7QUFBQSxNQUNILE9BQU8sQ0FBQyxHQUFHLFlBQVksRUFBRSxNQUFNLEtBQUssS0FBSyxNQUFNLEdBQUcsR0FBTSxJQUFNLEdBQUcsUUFBUSxFQUFFLE1BQU0sT0FBSyxZQUFZLEdBQUcsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUksRUFBRSxLQUFLLFNBQVMsQ0FBQyxHQUFNLEdBQUcsUUFBUSxFQUFFLE1BQU0sT0FBSyxZQUFZLEdBQUcsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFJLEVBQUk7QUFBQSxTQUN2UDtBQUFBLE1BQ0gsT0FBTyxDQUFDLEdBQU0sSUFBTSxHQUFHLFFBQVEsRUFBRSxNQUFNLE9BQUssWUFBWSxHQUFHLEtBQUssS0FBSyxRQUFRLENBQUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxNQUFNLFFBQVEsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBSTtBQUFBLFNBQ25JO0FBQUEsTUFDSCxPQUFPLENBQUMsR0FBTSxJQUFNLEdBQU0sSUFBTSxHQUFHLFlBQVksRUFBRSxNQUFNLEtBQUssS0FBSyxNQUFNLEdBQUcsSUFBTSxJQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxRQUFRLEVBQUUsTUFBTSxPQUFLLFlBQVksR0FBRyxLQUFLLEtBQUssUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLFNBQVMsTUFBTSxXQUFXLEdBQUcsRUFBRSxTQUFTLEVBQUUsU0FBUyxNQUFNLFFBQVEsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLElBQU0sRUFBSTtBQUFBLFNBQ2pSO0FBQUEsTUFDSCxJQUFJLEVBQUUsVUFBVTtBQUFBLFFBQU0sTUFBTSxJQUFJLE1BQU0sd0NBQXdDO0FBQUEsTUFDOUUsT0FBTyxDQUFDLElBQU0sR0FBRyxJQUFJLE1BQU0sT0FBTyxFQUFFLFFBQVEsT0FBTyxDQUFDLENBQUM7QUFBQSxTQUNsRDtBQUFBLE1BQ0gsSUFBSSxFQUFFLFVBQVU7QUFBQSxRQUFNLE1BQU0sSUFBSSxNQUFNLGtDQUFrQztBQUFBLE1BQ3hFLE9BQU8sQ0FBQyxJQUFNLEdBQUcsSUFBSSxNQUFNLE9BQU8sRUFBRSxRQUFRLFVBQVUsQ0FBQyxDQUFDO0FBQUEsU0FDckQ7QUFBQSxNQUNILE9BQU8sQ0FBQyxHQUFHLFlBQVksRUFBRSxPQUFPLEtBQUssS0FBSyxNQUFNLEdBQUcsRUFBSTtBQUFBLFNBQ3BEO0FBQUEsTUFDSCxPQUFPLENBQUMsR0FBRyxZQUFZLEVBQUUsTUFBTSxLQUFLLEtBQUssTUFBTSxHQUFHLEVBQUk7QUFBQTtBQUFBLE1BRXRELE9BQU8sSUFBSSxDQUFDO0FBQUE7QUFBQTtBQUlsQixJQUFNLGVBQWUsQ0FBQyxTQUFtQztBQUFBLEVBQ3ZELElBQUksU0FBUztBQUFBLEVBQ2IsTUFBTSxVQUFVLE9BQU8sUUFBUSxJQUFJO0FBQUEsRUFDbkMsTUFBTSxNQUFtQyxDQUFDO0FBQUEsRUFDMUMsY0FBYyxRQUFRLFNBQVM7QUFBQSxJQUM3QixJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0sSUFBSSxNQUFNLFFBQVEsSUFBSSxRQUFRLE9BQU87QUFBQSxJQUMzRCxVQUFVLElBQUksU0FBUyxNQUFNLE1BQU0sSUFBSTtBQUFBLEVBQ3pDO0FBQUEsRUFDQSxPQUFPLEVBQUUsU0FBUyxLQUFLLE9BQU8sUUFBUSxRQUFRO0FBQUE7QUFHaEQsSUFBTSxjQUFjLENBQXNCLFFBQ3hDLE9BQU8sWUFBWSxPQUFPLFFBQVEsR0FBRyxFQUFFLE9BQU8sSUFBSSxPQUFPLEVBQUUsU0FBUyxNQUFNLENBQUM7QUFFN0UsSUFBTSxlQUFlLENBQXNCLFFBQ3pDLE9BQU8sWUFBWSxPQUFPLFFBQVEsR0FBRyxFQUFFLE9BQU8sSUFBSSxPQUFPLEVBQUUsU0FBUyxPQUFPLENBQUM7QUFROUUsSUFBTSxZQUFZLENBQUMsVUFBNkI7QUFBQSxFQUM5QyxNQUFNLFNBQVMsTUFBSyxPQUFPLElBQUksVUFBUSxVQUFVLE1BQU0sYUFBYSxDQUFDO0FBQUEsRUFDckUsT0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBLFVBQVUsT0FBTyxJQUFJLE9BQUssRUFBRSxTQUFTLGNBQWMsRUFBRSxRQUFRLEVBQUU7QUFBQSxJQUMvRCxPQUFPLE1BQUssUUFBUSxHQUFHLE1BQU0sS0FBSyxJQUFJLFlBQVksTUFBSywwQkFBMEI7QUFBQSxFQUNuRjtBQUFBO0FBR0YsSUFBTSxtQkFBbUIsQ0FBQyxlQUE0QjtBQUFBLEVBQ3BELE1BQU0sT0FBTyxJQUFJO0FBQUEsRUFDakIsYUFBYSxXQUFXLFlBQVk7QUFBQSxJQUNsQyxNQUFNLE9BQU8sTUFBTSxRQUFRLEtBQUssSUFBSSxRQUFRLE9BQU8sS0FBSyxJQUFJLENBQUMsS0FBSyxJQUFJO0FBQUEsSUFDdEUsT0FBTyxLQUFLLFFBQVEsT0FBSyxTQUFTLEdBQUcsRUFBRSxPQUFPLFFBQU0sS0FBSyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxTQUFTLE9BQXdCLEVBQUUsT0FBTyxRQUFNLEtBQUssSUFBSSxFQUFFLEVBQUUsQ0FBQztBQUFBLEVBQ3ZJO0FBQUEsRUFDQSxPQUFPLE9BQU8sWUFBWSxDQUFDLEdBQUcsSUFBSSxFQUFFLElBQUksUUFBTTtBQUFBLElBQzVDLE1BQU0sTUFBTSxjQUFjLElBQUksRUFBRTtBQUFBLElBQ2hDLElBQUksQ0FBQztBQUFBLE1BQUssTUFBTSxJQUFJLE1BQU0saUJBQWlCLElBQUk7QUFBQSxJQUMvQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsR0FBRztBQUFBLEdBQ3hCLENBQUM7QUFBQTtBQUdKLElBQU0sZ0JBQWdCLENBQXNCLFFBQVc7QUFBQSxFQUNyRCxNQUFNLFFBQVEsWUFBWSxHQUFHO0FBQUEsRUFDN0IsTUFBTSxTQUFTLGFBQWEsR0FBRztBQUFBLEVBQy9CLE1BQU0sV0FBVyxPQUFPLFFBQVEsS0FBSztBQUFBLEVBQ3JDLE1BQU0sYUFBYSxTQUFTLElBQUksSUFBSSxXQUFVLFVBQVUsS0FBSSxDQUFDO0FBQUEsRUFDN0QsTUFBTSxNQUFNLE9BQU8sWUFBWSxTQUFTLElBQUksSUFBSSxNQUFNLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7QUFBQSxFQUN4RSxNQUFNLGdCQUFnQixpQkFBaUIsVUFBVTtBQUFBLEVBQ2pELE1BQU0sWUFBWSxLQUFLLGtCQUFrQixPQUFPO0FBQUEsRUFDaEQsUUFBUSxTQUFTLFVBQVUsYUFBYSxTQUFTO0FBQUEsRUFDakQsT0FBTyxFQUFFLE9BQU8sUUFBUSxVQUFVLFlBQVksS0FBSyxTQUFTLE9BQU8sS0FBSyxJQUFJLEdBQUcsS0FBSyxLQUFLLFFBQVEsS0FBSyxDQUFDLEVBQUU7QUFBQTtBQUczRyxJQUFNLGFBQWEsR0FBd0IsVUFBVSxZQUFZLEtBQUssU0FBUyxZQUErQjtBQUFBLEVBQzVHLE1BQU0sa0JBQWtCLFNBQVMsUUFBUSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQztBQUFBLEVBQ3pELE1BQU0sZ0JBQWdCLFNBQVMsUUFBUSxFQUFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFBQSxFQUNyRixPQUFPLElBQUksV0FBVztBQUFBLElBQ3BCLEdBQUc7QUFBQSxJQUNILEdBQUcsUUFBUSxHQUFNLENBQUMsR0FBRyxJQUFJLFNBQVMsTUFBTSxHQUFHLEdBQUcsUUFBUSxVQUFVLElBQUksT0FBTyxDQUFDLElBQU0sR0FBRyxJQUFJLEVBQUUsT0FBTyxNQUFNLEdBQUcsR0FBRyxFQUFFLE9BQU8sSUFBSSxPQUFLLE1BQU0sS0FBSyxFQUFFLEdBQUcsR0FBTSxNQUFNLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQUEsSUFDN0ssR0FBRyxRQUFRLEdBQU0sQ0FBQyxHQUFHLElBQUksU0FBUyxNQUFNLEdBQUcsR0FBRyxlQUFlLENBQUM7QUFBQSxJQUM5RCxHQUFHLFFBQVEsR0FBTSxDQUFDLEdBQU0sR0FBTSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUM7QUFBQSxJQUM1QyxHQUFHLFFBQVEsR0FBTTtBQUFBLE1BQ2YsR0FBRyxJQUFJLFNBQVMsU0FBUyxDQUFDO0FBQUEsTUFDMUIsR0FBRztBQUFBLE1BQ0gsR0FBRyxJQUFJLE9BQU87QUFBQSxNQUFHO0FBQUEsTUFBTSxHQUFHLElBQUksQ0FBQztBQUFBLElBQ2pDLENBQUM7QUFBQSxJQUNELEdBQUcsUUFBUSxJQUFNO0FBQUEsTUFDZixHQUFHLElBQUksU0FBUyxNQUFNO0FBQUEsTUFDdEIsR0FBRyxRQUFRLFlBQVksR0FBRyxhQUFNLFVBQVUsWUFBWTtBQUFBLFFBQ3BELE1BQU0sU0FBUyxJQUFJO0FBQUEsUUFDbkIsTUFBTSxRQUFRLE1BQU0sUUFBUSxLQUFLLElBQUksUUFBUSxPQUFPLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSTtBQUFBLFFBQ3ZFLFFBQVEsTUFBTSxRQUFRLE9BQUssU0FBUyxHQUFHLEVBQUUsT0FBTyxDQUFDLElBQUksU0FBUyxPQUFPLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksU0FBUyxPQUF3QixFQUFFLE9BQU8sQ0FBQyxJQUFJLFNBQVMsT0FBTyxJQUFJLElBQUksSUFBSSxFQUFFLENBQUM7QUFBQSxRQUN2SyxTQUFTLFFBQVEsUUFBTSxPQUFPLE9BQU8sRUFBRSxDQUFDO0FBQUEsUUFDeEMsTUFBTSxlQUFlLENBQUMsR0FBRyxPQUFPLFFBQVEsQ0FBQztBQUFBLFFBQ3pDLE1BQU0sTUFBTSxPQUFPLFlBQVksQ0FBQyxHQUFHLFNBQVMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxhQUFhLElBQUksRUFBRSxLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxRQUNwSSxNQUFNLFFBQVEsQ0FBQyxHQUFHLElBQUksYUFBYSxNQUFNLEdBQUcsR0FBRyxRQUFRLGNBQWMsSUFBSSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUM7QUFBQSxRQUNqSCxNQUFNLE9BQU8sUUFBUSxRQUFRLE9BQU8sT0FBSyxZQUFZLEdBQUcsS0FBSyxLQUFLLE9BQU8sQ0FBQyxJQUFJLFlBQVksT0FBd0IsS0FBSyxLQUFLLE9BQU87QUFBQSxRQUNuSSxNQUFNLE9BQU8sQ0FBQyxHQUFHLE9BQU8sR0FBRyxNQUFNLEVBQUk7QUFBQSxRQUNyQyxPQUFPLENBQUMsR0FBRyxJQUFJLEtBQUssTUFBTSxHQUFHLEdBQUcsSUFBSTtBQUFBLE9BQ3JDO0FBQUEsSUFDSCxDQUFDO0FBQUEsRUFDSCxDQUFDO0FBQUE7QUFLSCxJQUFNLGlCQUFpQixDQUFvQixTQUFvRztBQUFBLEVBQzdJLFFBQVE7QUFBQSxTQUNEO0FBQUEsTUFBTyxPQUFPO0FBQUEsU0FDZDtBQUFBLE1BQU8sT0FBTztBQUFBLFNBQ2Q7QUFBQSxNQUFPLE9BQU87QUFBQSxTQUNkO0FBQUEsTUFBTyxPQUFPO0FBQUE7QUFBQSxNQUNWLE9BQU8sSUFBSSxJQUFJO0FBQUE7QUFBQTtBQUlyQixJQUFNLFVBQVUsT0FBNEIsUUFBc0M7QUFBQSxFQUN2RixNQUFNLFdBQVcsY0FBYyxHQUFHO0FBQUEsRUFDbEMsUUFBUSxPQUFPLFFBQVEsWUFBWTtBQUFBLEVBQ25DLE1BQU0sT0FBTyxNQUFNLFlBQVksWUFBWSxNQUFNLFlBQVksUUFBUSxXQUFXLFFBQVEsRUFBRSxNQUFNLENBQUM7QUFBQSxFQUNqRyxNQUFNLFVBQVUsS0FBSztBQUFBLEVBQ3JCLE1BQU0sVUFBVSxPQUFPLFlBQVksT0FBTyxLQUFLLEtBQUssRUFBRSxJQUFJLFVBQVEsQ0FBQyxNQUFNLFFBQVEsS0FBSyxDQUFDLENBQUM7QUFBQSxFQUN4RixNQUFNLFdBQVksT0FBTyxRQUFRLE1BQU0sRUFBMkIsSUFBSSxFQUFFLE1BQU0sU0FBUztBQUFBLElBQ3JGLE1BQU0sU0FBUyxRQUFRLElBQUk7QUFBQSxJQUMzQixNQUFNLE9BQU8sZUFBZSxJQUFJLElBQUk7QUFBQSxJQUNwQyxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUssUUFBUSxNQUFNLFFBQVEsT0FBTyxRQUFRLElBQUksTUFBTSxDQUFDO0FBQUEsR0FDeEU7QUFBQSxFQUNELE9BQU8sT0FBTyxZQUFZO0FBQUEsSUFDeEIsR0FBRyxPQUFPLFFBQVEsT0FBTztBQUFBLElBQ3pCLEdBQUc7QUFBQSxFQUNMLENBQUM7QUFBQTs7O0FDNWpCSSxJQUFNLE9BQU8sU0FBUztBQUU3QixJQUFNLGVBQWU7QUFBQSxFQUNuQixPQUFNO0FBQUEsSUFDSixPQUFtQjtBQUFBLElBQ25CLFlBQW1CO0FBQUEsSUFDbkIsS0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixNQUFtQjtBQUFBLElBQ25CLFdBQW1CO0FBQUEsRUFDckI7QUFBQSxFQUNBLE1BQUs7QUFBQSxJQUNILE9BQW1CO0FBQUEsSUFDbkIsWUFBbUI7QUFBQSxJQUNuQixLQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxJQUNuQixPQUFtQjtBQUFBLElBQ25CLE1BQW1CO0FBQUEsSUFDbkIsV0FBbUI7QUFBQSxFQUNyQjtBQUNGO0FBRU8sSUFBTSxRQUFRO0FBQUEsRUFDbkIsT0FBTztBQUFBLEVBQ1AsWUFBWTtBQUFBLEVBQ1osTUFBTTtBQUFBLEVBQ04sV0FBVztBQUFBLEVBQ1gsS0FBSztBQUFBLEVBQ0wsT0FBTztBQUFBLEVBQ1AsTUFBTTtBQUFBLEVBQ04sV0FBVztBQUNiO0FBR0EsSUFBSSxPQUFPLFNBQVMsY0FBYyxPQUFPO0FBQ3pDLEtBQUssWUFBWTtBQUFBO0FBQUEsYUFFSixhQUFhLEtBQUs7QUFBQSxrQkFDYixhQUFhLEtBQUs7QUFBQSxXQUN6QixhQUFhLEtBQUs7QUFBQSxhQUNoQixhQUFhLEtBQUs7QUFBQSxZQUNuQixhQUFhLEtBQUs7QUFBQSxZQUNsQixhQUFhLEtBQUs7QUFBQSxpQkFDYixhQUFhLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQU9wQixhQUFhLE1BQU07QUFBQSxvQkFDZCxhQUFhLE1BQU07QUFBQSxhQUMxQixhQUFhLE1BQU07QUFBQSxlQUNqQixhQUFhLE1BQU07QUFBQSxjQUNwQixhQUFhLE1BQU07QUFBQSxjQUNuQixhQUFhLE1BQU07QUFBQSxtQkFDZCxhQUFhLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFJdEMsU0FBUyxLQUFLLFlBQVksSUFBSTtBQUd2QixJQUFNLGNBQWMsQ0FBQyxLQUFZLE1BQWEsU0FBbUQ7QUFBQSxFQUV0RyxNQUFNLFdBQVcsU0FBUyxjQUFjLEdBQUc7QUFBQSxFQUMzQyxTQUFTLGNBQWM7QUFBQSxFQUN2QixJQUFJLEtBQUssU0FBUztBQUFBLEVBQ2xCLElBQUksT0FBTyxVQUFTO0FBQUEsSUFDbEIsU0FBUyxZQUFZO0FBQUEsSUFDckIsR0FBRyxRQUFRLE1BQU07QUFBQSxJQUNqQixHQUFHLGtCQUFrQixNQUFNO0FBQUEsSUFDM0IsR0FBRyxTQUFTLGVBQWEsTUFBTTtBQUFBLElBQy9CLEdBQUcsZUFBZTtBQUFBLElBQ2xCLEdBQUcsVUFBVTtBQUFBLElBQ2IsR0FBRyxTQUFTO0FBQUEsRUFDZDtBQUFBLEVBQ0EsSUFBSTtBQUFBLElBQU0sT0FBTyxRQUFRLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxXQUFTO0FBQUEsTUFDckQsSUFBSSxRQUFRLFVBQVM7QUFBQSxRQUNsQixNQUFzQixZQUFZLFFBQVE7QUFBQSxNQUM3QztBQUFBLE1BQ0EsSUFBSSxRQUFNLFlBQVc7QUFBQSxRQUNsQixNQUF3QixRQUFRLE9BQUcsU0FBUyxZQUFZLENBQUMsQ0FBQztBQUFBLE1BQzdELEVBQU0sU0FBSSxRQUFNLGtCQUFpQjtBQUFBLFFBQy9CLE9BQU8sUUFBUSxLQUF3QyxFQUFFLFFBQVEsRUFBRSxPQUFPLGNBQVk7QUFBQSxVQUNwRixTQUFTLGlCQUFpQixPQUFPLFFBQVE7QUFBQSxTQUMxQztBQUFBLE1BQ0gsRUFBTSxTQUFJLFFBQVEsU0FBUTtBQUFBLFFBQ3hCLE9BQU8sT0FBTyxTQUFTLE9BQU8sS0FBK0I7QUFBQSxNQUMvRCxFQUFLO0FBQUEsUUFDSCxTQUFVLE9BQTBFO0FBQUE7QUFBQSxLQUV2RjtBQUFBLEVBQ0QsT0FBTztBQUFBO0FBSUYsSUFBTSxPQUFPLENBQUMsUUFBZSxPQUEyQjtBQUFBLEVBQzdELElBQUksV0FBMEIsQ0FBQztBQUFBLEVBQy9CLElBQUksT0FBc0MsQ0FBQztBQUFBLEVBRTNDLE1BQU0sVUFBVSxDQUFDLFFBQWM7QUFBQSxJQUM3QixJQUFJLE9BQU8sUUFBUTtBQUFBLE1BQVUsU0FBUyxLQUFLLFlBQVksUUFBUSxHQUFHLENBQUM7QUFBQSxJQUM5RCxTQUFJLE9BQU8sUUFBUTtBQUFBLE1BQVUsU0FBUyxLQUFLLFlBQVksUUFBUSxJQUFJLFNBQVMsQ0FBQyxDQUFDO0FBQUEsSUFDOUUsU0FBSSxlQUFlLFNBQVE7QUFBQSxNQUM5QixNQUFNLEtBQUssS0FBSyxLQUFLO0FBQUEsTUFDckIsSUFBSSxLQUFLLENBQUMsVUFBUTtBQUFBLFFBQ2hCLEdBQUcsWUFBWTtBQUFBLFFBQ2YsR0FBRyxZQUFZLEtBQUssS0FBSyxDQUFDO0FBQUEsT0FDM0I7QUFBQSxNQUNELFNBQVMsS0FBSyxFQUFFO0FBQUEsSUFDbEIsRUFDSyxTQUFJLGVBQWU7QUFBQSxNQUFhLFNBQVMsS0FBSyxHQUFHO0FBQUEsSUFDakQsU0FBSSxNQUFNLFFBQVEsR0FBRztBQUFBLE1BQUcsSUFBSSxRQUFRLE9BQUcsUUFBUSxDQUFDLENBQUM7QUFBQSxJQU1qRCxTQUFJLE9BQU8sT0FBTyxZQUFXO0FBQUEsTUFDaEMsSUFBSSxJQUFJLFFBQVE7QUFBQSxRQUFXLEtBQUssVUFBVTtBQUFBLE1BQ3JDLFNBQUksSUFBSSxRQUFRLGFBQWEsSUFBSSxTQUFTO0FBQUEsUUFBRyxLQUFLLFVBQVU7QUFBQSxNQUM1RDtBQUFBLGdCQUFRLEtBQUssNkZBQTZGO0FBQUEsSUFDakgsRUFDSztBQUFBLGFBQU8sS0FBSSxTQUFTLElBQUc7QUFBQTtBQUFBLEVBRTlCLEdBQUcsUUFBUSxPQUFPO0FBQUEsRUFDbEIsT0FBTyxZQUFZLEtBQUssSUFBSSxLQUFJLE1BQU0sU0FBUSxDQUFDO0FBQUE7QUFJakQsSUFBTSxtQkFBbUIsQ0FBd0IsUUFBYSxJQUFJLE9BQWlCLEtBQUssS0FBSyxHQUFHLEVBQUU7QUFFM0YsSUFBTSxJQUF3QyxpQkFBaUIsR0FBRztBQUNsRSxJQUFNLElBQXFDLGlCQUFpQixHQUFHO0FBQy9ELElBQU0sS0FBdUMsaUJBQWlCLElBQUk7QUFDbEUsSUFBTSxLQUF1QyxpQkFBaUIsSUFBSTtBQUNsRSxJQUFNLEtBQXVDLGlCQUFpQixJQUFJO0FBQ2xFLElBQU0sS0FBdUMsaUJBQWlCLElBQUk7QUFFbEUsSUFBTSxNQUFvQyxpQkFBaUIsS0FBSztBQUNoRSxJQUFNLE1BQW9DLGlCQUFpQixLQUFLO0FBQ2hFLElBQU0sT0FBc0MsaUJBQWlCLE1BQU07QUFDbkUsSUFBTSxXQUE4QyxpQkFBaUIsVUFBVTtBQUUvRSxJQUFNLFNBQTBDLGlCQUFpQixRQUFRO0FBRXpFLElBQU0sUUFBd0MsaUJBQWlCLE9BQU87QUFFdEUsSUFBTSxLQUF3QyxpQkFBaUIsSUFBSTtBQUNuRSxJQUFNLEtBQXlDLGlCQUFpQixJQUFJO0FBQ3BFLElBQU0sS0FBeUMsaUJBQWlCLElBQUk7QUFDcEUsSUFBTSxTQUEwQyxpQkFBaUIsUUFBUTs7O0FDMUpoRixJQUFNLEtBQUssTUFBTSxPQUFPLElBQUk7QUFDNUIsSUFBTSxLQUFLLE1BQU0sT0FBTyxJQUFJO0FBQzVCLElBQU0sTUFBTSxNQUFNLE9BQU8sSUFBSTtBQUU3QixJQUFNLElBQUksTUFBTSxPQUFPLEVBQUU7QUFFekIsSUFBTSxVQUFVLEtBQUssQ0FBQyxLQUFLLEdBQUcsT0FBTyxPQUFLO0FBQUEsRUFDeEMsTUFBTSxJQUFJLE1BQU0sSUFBSTtBQUFBLEVBQ3BCLE9BQU87QUFBQSxJQUNMLEVBQUUsSUFBSSxDQUFDO0FBQUEsSUFDUCxVQUFVLEVBQUUsR0FBRyxDQUFDLEdBQUc7QUFBQSxNQUNqQixJQUFJLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxFQUFFLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQUEsTUFDdkMsRUFBRSxLQUFLLENBQUM7QUFBQSxJQUNWLENBQUM7QUFBQSxJQUNELElBQUksQ0FBQztBQUFBLEVBQ1A7QUFBQSxDQUNEO0FBR0QsSUFBTSxNQUFNLE1BQU0sUUFBUTtBQUFBLEVBQ3hCO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0YsQ0FBQztBQUVELElBQUksSUFBRztBQUVQLFNBQVMsSUFBSSxFQUFHLElBQUksR0FBRyxLQUFLO0FBQUEsRUFDMUIsSUFBSSxHQUFHLEtBQUs7QUFBQSxFQUNaLElBQUksR0FBRyxLQUFLLElBQUk7QUFDbEI7QUFFQSxJQUFNLEtBQUssWUFBWSxJQUFJO0FBQzNCLElBQUksUUFBUSxDQUFDO0FBQ2IsSUFBTSxLQUFLLFlBQVksSUFBSSxJQUFJO0FBRS9CLEtBQUssT0FDSCxHQUFHLGFBQWEsR0FDaEIsRUFBRSxXQUFXLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUN4QyxFQUFFLFNBQVMsTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJLEdBQUcsQ0FFekQ7IiwKICAiZGVidWdJZCI6ICIzQTEzRjUyOTI0QjdBQzEyNjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
