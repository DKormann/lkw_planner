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
var controlBody = (self2, body) => bindStmts(typeof body === "function" ? body(self2) : body, self2.id, self2.kind === "loop" ? self2.id : null);
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
  const self2 = { kind: "loop", id: nextControlId++ };
  return { kind: "loop", control: self2.id, cond, body: controlBody(self2, body) };
};
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
var emitModule = ({ fEntries, builtFuncs, fix, layouts, pages }, { shared = false } = {}) => {
  const functionSection = fEntries.flatMap((_, i) => u32(i));
  const exportSection = fEntries.flatMap(([name], i) => [...str(name), 0, ...u32(i)]);
  return new Uint8Array([
    ...magic,
    ...section(1, [...u32(fEntries.length), ...flatMap(fEntries, ([, f]) => [96, ...u32(f.params.length), ...f.params.map((t) => codes.type[t]), 1, codes.type[f.result]])]),
    ...section(2, [
      1,
      ...str("env"),
      ...str("memory"),
      2,
      shared ? 3 : 1,
      ...u32(pages),
      ...u32(pages)
    ]),
    ...section(3, [...u32(fEntries.length), ...functionSection]),
    ...section(7, [...u32(fEntries.length), ...exportSection]),
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
var compile = async (mod, opts = {}) => {
  const analysis = analyzeModule(mod);
  const { funcs, arrays, layouts } = analysis;
  const memory = new WebAssembly.Memory({ initial: analysis.pages, maximum: analysis.pages, shared: !!opts.shared });
  let compiled = await WebAssembly.compile(emitModule(analysis, opts).buffer);
  const wasm = await WebAssembly.instantiate(compiled, { env: { memory } });
  const exports = wasm.exports;
  const jsFuncs = Object.fromEntries(Object.keys(funcs).map((name) => [name, exports[name]]));
  const jsArrays = Object.entries(arrays).map(([name, arr]) => {
    const layout = layouts[arr.id];
    const Ctor = typedArrayCtor(arr.type);
    return [name, new Ctor(memory.buffer, layout.offset, arr.length)];
  });
  return Object.fromEntries([
    ...Object.entries(jsFuncs),
    ...jsArrays,
    ["mod", compiled],
    ["memory", memory]
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

// src/view/planner.ts
var arr = array("i32", 1024);
var mod = await compile({
  foo: func([], "i32", () => [
    ret(22)
  ]),
  fill: func(["i32"], "i32", (n) => {
    let x = local.i32();
    return [
      loop(x.lt(n), [
        arr.store(x, x),
        x.iadd(1)
      ]),
      ret(n)
    ];
  }),
  arr
}, { shared: true });
var WokerBundleMain = () => {
  let funcs = {};
  onmessage = async (e) => {
    let msg = e.data;
    if (msg.tag == "module") {
      let instance = await WebAssembly.instantiate(msg.mod, { env: { memory: msg.memory } });
      funcs = Object.fromEntries(Object.entries(instance.exports).filter(([, v]) => typeof v === "function"));
      postMessage({ tag: "result", result: 0 });
    }
    if (msg.tag == "call") {
      let func2 = funcs[msg.func];
      if (!func2)
        return postMessage({ tag: "error", error: `Function ${msg.func} not found` });
      try {
        let res = func2(...msg.args);
        postMessage({ tag: "result", result: res });
      } catch (e2) {
        postMessage({ tag: "error", error: String(e2) });
      }
    }
  };
};
var url = URL.createObjectURL(new Blob([`(${WokerBundleMain.toString()})()`], { type: "application/javascript" }));
async function mkWorker() {
  if (mod.memory.buffer instanceof SharedArrayBuffer && !self.crossOriginIsolated) {
    throw new Error("Shared wasm workers require crossOriginIsolated. Serve the page with Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp.");
  }
  let worker = new Worker(url);
  function post(msg) {
    worker.postMessage(msg);
  }
  let resolver = null;
  worker.onmessage = (e) => {
    let msg = e.data;
    if (msg.tag == "result") {
      if (!resolver)
        throw new Error("No resolver set");
      resolver(msg.result);
      resolver = null;
    }
    if (msg.tag == "error")
      throw new Error(msg.error);
  };
  let call = (func2, args) => {
    if (resolver)
      throw new Error("Already waiting for a result");
    return new Promise((resolve) => {
      resolver = resolve;
      post({ tag: "call", func: func2, args });
    });
  };
  await new Promise((res) => {
    resolver = (x) => res();
    post({ tag: "module", mod: mod.mod, memory: mod.memory });
  });
  return Object.fromEntries(Object.entries(mod).filter(([k, v]) => typeof v == "function").map(([k, v]) => [k, (...args) => call(k, args)]));
}

// src/view/main.ts
var xs = array("i32", 1024);
var ys = array("i32", 1024);
var out = array("i32", 1024);
var w = await mkWorker();
w.fill(8);
var res = Array.from(mod.arr.slice(0, 10));
body.replaceChildren(h2("wasm worker"), p(res.join(", ")));

//# debugId=5A042BB0D08403B764756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3dhc20udHMiLCAic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9wbGFubmVyLnRzIiwgInNyYy92aWV3L21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiY29uc3QgbWFnaWMgPSBbMHgwMCwgMHg2MSwgMHg3MywgMHg2ZCwgMHgwMSwgMHgwMCwgMHgwMCwgMHgwMF1cbmNvbnN0IG51bVR5cGVzID0gW1wiaTMyXCIsIFwiaTY0XCIsIFwiZjMyXCIsIFwiZjY0XCJdIGFzIGNvbnN0XG5jb25zdCBiaW5PcHMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0gYXMgY29uc3RcbmNvbnN0IGNtcE9wcyA9IFtcImVxXCIsIFwibHRcIiwgXCJndFwiXSBhcyBjb25zdFxuXG5leHBvcnQgdHlwZSBOdW1UeXBlID0gXCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIlxuZXhwb3J0IHR5cGUgQmluT3AgPSBcImFkZFwiIHwgXCJzdWJcIiB8IFwibXVsXCIgfCBcImRpdlwiXG5leHBvcnQgdHlwZSBDbXBPcCA9IFwiZXFcIiB8IFwibHRcIiB8IFwiZ3RcIlxudHlwZSBWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBUIGV4dGVuZHMgXCJpNjRcIiA/IGJpZ2ludCA6IG51bWJlclxudHlwZSBUeXBlZEFycmF5Rm9yPFQgZXh0ZW5kcyBOdW1UeXBlPiA9XG4gIFQgZXh0ZW5kcyBcImkzMlwiID8gSW50MzJBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImk2NFwiID8gQmlnSW50NjRBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImYzMlwiID8gRmxvYXQzMkFycmF5IDpcbiAgRmxvYXQ2NEFycmF5XG5cbmV4cG9ydCB0eXBlIEZ1bmNTaWc8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUmV0IGV4dGVuZHMgTnVtVHlwZT4gPSB7IHBhcmFtczogQXJncywgcmVzdWx0OiBSZXQgfVxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPiA6IG5ldmVyIH1cbnR5cGUgQXJnc1ZhbDxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8QXJnc1tLXT4gOiBuZXZlciB9XG5cbnR5cGUgQ29yZUV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID1cbiAgfCB7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogVCwgdmFsdWU6IFZhbHVlPFQ+IH1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGU6IFQsIGxvY2FsOiBudW1iZXIgfVxuICB8IHsga2luZDogXCJiaW5cIiwgdHlwZTogVCwgb3A6IEJpbk9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImNhbGxcIiwgdHlwZTogVCwgdGFyZ2V0OiBudW1iZXIsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcImlmXCIsIHR5cGU6IFQsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2U6IEV4cHI8VD4gfVxuICB8IHsga2luZDogXCJsb2FkXCIsIHR5cGU6IFQsIGFycmF5OiBudW1iZXIsIGluZGV4OiBFeHByPFwiaTMyXCI+IH1cbiAgfCAoVCBleHRlbmRzIFwiaTMyXCIgPyB7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogTnVtVHlwZSwgb3A6IENtcE9wLCBsZWZ0OiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwcjxOdW1UeXBlPiB9IDogbmV2ZXIpXG5cbmV4cG9ydCB0eXBlIEV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID0gQ29yZUV4cHI8VD4gJiB7XG4gIGFkZChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIHN1YihyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIG11bChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIGRpdihyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIGVxKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbiAgbHQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxuICBndChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG59XG5cbmV4cG9ydCB0eXBlIFN0bXQgPVxuICB8IHsga2luZDogXCJsb2NhbC5zZXRcIiwgbG9jYWw6IG51bWJlciwgdHlwZTogTnVtVHlwZSwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheTogbnVtYmVyLCB0eXBlOiBOdW1UeXBlLCBpbmRleDogRXhwcjxcImkzMlwiPiwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJpZlwiLCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10W10sIGVsc2U6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IG51bWJlciwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwibG9vcFwiLCBjb250cm9sOiBudW1iZXIsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImV4cHJcIiwgZXhwcjogRXhwcjxOdW1UeXBlPiB9XG5cbmV4cG9ydCB0eXBlIEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBudW1iZXIgfVxudHlwZSBDb250cm9sSGFuZGxlID0gQmxvY2tIYW5kbGUgfCBMb29wSGFuZGxlXG5cbmV4cG9ydCB0eXBlIExvY2FsVmFyPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHtcbiAgaWQ6IG51bWJlclxuICB0eXBlOiBUXG4gIGdldCgpOiBFeHByPFQ+XG4gIHNldCh2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10XG4gIGFkZChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIHN1YihyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIG11bChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIGRpdihyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIGVxKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbiAgbHQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxuICBndChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG4gIGlhZGQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogU3RtdFxuICBpc3ViKHJpZ2h0OiBFeHByTGlrZTxUPik6IFN0bXRcbiAgaW11bChyaWdodDogRXhwckxpa2U8VD4pOiBTdG10XG4gIGlkaXYocmlnaHQ6IEV4cHJMaWtlPFQ+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBBcnJheUhhbmRsZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICBpZDogbnVtYmVyXG4gIHR5cGU6IFRcbiAgbGVuZ3RoOiBudW1iZXJcbiAgbG9hZChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBFeHByPFQ+XG4gIHN0b3JlKGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgdmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdFxufVxuXG50eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPiB8IExvY2FsVmFyPFQ+XG50eXBlIFN0bXRCb2R5ID0gU3RtdCB8IFN0bXRbXVxudHlwZSBDb250cm9sQm9keTxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4gPSBTdG10Qm9keSB8ICgoc2VsZjogSCkgPT4gU3RtdEJvZHkpXG50eXBlIEZ1bmNCb2R5PFIgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8Uj4gfCBTdG10IHwgU3RtdFtdXG5cbmV4cG9ydCB0eXBlIEZ1bmNIYW5kbGU8QSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIE51bVR5cGU+ID0gRnVuY1NpZzxBLCBSPiAmIHtcbiAga2luZDogXCJmdW5jXCJcbiAgaWQ6IG51bWJlclxuICBidWlsZD86ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+XG4gIGNhbGw6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gRXhwcjxSPlxufVxuXG50eXBlIEFueUZ1bmMgPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIGlkOiBudW1iZXJcbiAgcGFyYW1zOiByZWFkb25seSBOdW1UeXBlW11cbiAgcmVzdWx0OiBOdW1UeXBlXG4gIGJ1aWxkPzogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8TnVtVHlwZT5cbiAgY2FsbDogKC4uLmFyZ3M6IGFueVtdKSA9PiBFeHByPE51bVR5cGU+XG59XG5cbnR5cGUgQW55QXJyYXkgPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICBpZDogbnVtYmVyXG4gIHR5cGU6IE51bVR5cGVcbiAgbGVuZ3RoOiBudW1iZXJcbiAgbG9hZChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBFeHByPE51bVR5cGU+XG4gIHN0b3JlKGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgdmFsdWU6IEV4cHJMaWtlPE51bVR5cGU+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBNb2R1bGVEZWYgPSBSZWNvcmQ8c3RyaW5nLCBBbnlGdW5jIHwgQW55QXJyYXk+XG50eXBlIEZ1bmNEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gSyA6IG5ldmVyXTogRXh0cmFjdDxUW0tdLCBBbnlGdW5jPiB9XG50eXBlIEFycmF5RGVmczxUIGV4dGVuZHMgTW9kdWxlRGVmPiA9IHsgW0sgaW4ga2V5b2YgVCBhcyBUW0tdIGV4dGVuZHMgQW55QXJyYXkgPyBLIDogbmV2ZXJdOiBFeHRyYWN0PFRbS10sIEFueUFycmF5PiB9XG5leHBvcnQgdHlwZSBDb21waWxlUmVzdWx0PFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBbSyBpbiBrZXlvZiBUXTpcbiAgICBUW0tdIGV4dGVuZHMgQW55RnVuYyA/ICguLi5hcmdzOiBBcmdzVmFsPFRbS11bXCJwYXJhbXNcIl0+KSA9PiBWYWx1ZTxUW0tdW1wicmVzdWx0XCJdPlxuICAgIDogVFtLXSBleHRlbmRzIEFueUFycmF5ID8gVHlwZWRBcnJheUZvcjxUW0tdW1widHlwZVwiXT5cbiAgICA6IG5ldmVyXG59ICYge1xuICBtb2Q6IFdlYkFzc2VtYmx5Lk1vZHVsZVxuICBtZW1vcnk6IFdlYkFzc2VtYmx5Lk1lbW9yeVxufVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgYmluOiB7XG4gICAgYWRkOiB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9LFxuICAgIHN1YjogeyBpMzI6IDB4NmIsIGk2NDogMHg3ZCwgZjMyOiAweDkzLCBmNjQ6IDB4YTEgfSxcbiAgICBtdWw6IHsgaTMyOiAweDZjLCBpNjQ6IDB4N2UsIGYzMjogMHg5NCwgZjY0OiAweGEyIH0sXG4gICAgZGl2OiB7IGkzMjogMHg2ZCwgaTY0OiAweDdmLCBmMzI6IDB4OTUsIGY2NDogMHhhMyB9LFxuICB9IGFzIFJlY29yZDxCaW5PcCwgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4+LFxuICBjbXA6IHtcbiAgICBlcTogeyBpMzI6IDB4NDYsIGk2NDogMHg1MSwgZjMyOiAweDViLCBmNjQ6IDB4NjEgfSxcbiAgICBsdDogeyBpMzI6IDB4NDgsIGk2NDogMHg1MywgZjMyOiAweDVkLCBmNjQ6IDB4NjMgfSxcbiAgICBndDogeyBpMzI6IDB4NGEsIGk2NDogMHg1NSwgZjMyOiAweDVlLCBmNjQ6IDB4NjQgfSxcbiAgfSBhcyBSZWNvcmQ8Q21wT3AsIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+PixcbiAgbG9hZDogeyBpMzI6IDB4MjgsIGk2NDogMHgyOSwgZjMyOiAweDJhLCBmNjQ6IDB4MmIgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgc3RvcmU6IHsgaTMyOiAweDM2LCBpNjQ6IDB4MzcsIGYzMjogMHgzOCwgZjY0OiAweDM5IH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4sXG4gIGJ5dGVzOiB7IGkzMjogNCwgaTY0OiA4LCBmMzI6IDQsIGY2NDogOCB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICBhbGlnbjogeyBpMzI6IDIsIGk2NDogMywgZjMyOiAyLCBmNjQ6IDMgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbn1cblxuY29uc3QgdTMyID0gKG46IG51bWJlcikgPT4ge1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDApIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdW5zaWduZWQgaW50ZWdlciwgZ290ICR7bn1gKVxuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgZG8ge1xuICAgIGxldCBieXRlID0gbiAmIDB4N2ZcbiAgICBuID4+Pj0gN1xuICAgIGlmIChuKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICB9IHdoaWxlIChuKVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IHNOID0gKHZhbHVlOiBudW1iZXIgfCBiaWdpbnQsIGJpdHM6IDMyIHwgNjQpID0+IHtcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGxldCBuID0gYml0cyA9PT0gMzIgPyBCaWdJbnQoKHZhbHVlIGFzIG51bWJlcikgfCAwKSA6IEJpZ0ludC5hc0ludE4oNjQsIHZhbHVlIGFzIGJpZ2ludClcbiAgZm9yICg7Oykge1xuICAgIGxldCBieXRlID0gTnVtYmVyKG4gJiAweDdmbilcbiAgICBuID4+PSA3blxuICAgIGNvbnN0IGRvbmUgPSAobiA9PT0gMG4gJiYgKGJ5dGUgJiAweDQwKSA9PT0gMCkgfHwgKG4gPT09IC0xbiAmJiAoYnl0ZSAmIDB4NDApICE9PSAwKVxuICAgIGlmICghZG9uZSkgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgICBpZiAoZG9uZSkgcmV0dXJuIG91dFxuICB9XG59XG5cbmNvbnN0IGZOID0gKHZhbHVlOiBudW1iZXIsIGJ5dGVzOiA0IHwgOCkgPT4ge1xuICBjb25zdCBvdXQgPSBuZXcgVWludDhBcnJheShieXRlcylcbiAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhvdXQuYnVmZmVyKVxuICBieXRlcyA9PT0gNCA/IHZpZXcuc2V0RmxvYXQzMigwLCB2YWx1ZSwgdHJ1ZSkgOiB2aWV3LnNldEZsb2F0NjQoMCwgdmFsdWUsIHRydWUpXG4gIHJldHVybiBbLi4ub3V0XVxufVxuXG5jb25zdCBzdHIgPSAoczogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHMpXG4gIHJldHVybiBbLi4udTMyKGJ5dGVzLmxlbmd0aCksIC4uLmJ5dGVzXVxufVxuXG5jb25zdCBzZWN0aW9uID0gKGlkOiBudW1iZXIsIHBheWxvYWQ6IG51bWJlcltdKSA9PiBbaWQsIC4uLnUzMihwYXlsb2FkLmxlbmd0aCksIC4uLnBheWxvYWRdXG5jb25zdCBmbGF0TWFwID0gPFQsIFI+KHhzOiBUW10sIGZuOiAoeDogVCkgPT4gUltdKSA9PiB4cy5mbGF0TWFwKGZuKVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5sZXQgbmV4dEZ1bmNJZCA9IDBcbmxldCBuZXh0TG9jYWxJZCA9IDBcbmxldCBuZXh0QXJyYXlJZCA9IDBcbmxldCBuZXh0Q29udHJvbElkID0gMFxuY29uc3QgYXJyYXlSZWdpc3RyeSA9IG5ldyBNYXA8bnVtYmVyLCBBbnlBcnJheT4oKVxuXG5jb25zdCBpbmZlclR5cGUgPSA8VCBleHRlbmRzIE51bVR5cGU+KHZhbHVlOiBFeHByTGlrZTxUPikgPT5cbiAgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCAmJiBcInR5cGVcIiBpbiB2YWx1ZSA/IHZhbHVlLnR5cGUgOiBcImkzMlwiKSBhcyBUXG5cbmNvbnN0IGFkZEV4cHJPcHMgPSA8VCBleHRlbmRzIE51bVR5cGU+KGU6IEV4cHI8VD4pID0+IHtcbiAgZm9yIChjb25zdCBvcCBvZiBiaW5PcHMpIGVbb3BdID0gciA9PiBiaW4ob3AsIGUsIHIpIGFzIEV4cHI8VD5cbiAgZm9yIChjb25zdCBvcCBvZiBjbXBPcHMpIGVbb3BdID0gciA9PiBjbXAob3AsIGUsIHIpIGFzIEV4cHI8XCJpMzJcIj5cbiAgcmV0dXJuIGVcbn1cblxuY29uc3QgZXhwciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obm9kZTogQ29yZUV4cHI8VD4pOiBFeHByPFQ+ID0+IHtcbiAgcmV0dXJuIGFkZEV4cHJPcHMobm9kZSBhcyBFeHByPFQ+KVxufVxuXG5jb25zdCBsaXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT4ge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKFwia2luZFwiIGluIHZhbHVlKSByZXR1cm4gdmFsdWUgYXMgRXhwcjxUPlxuICAgIGlmIChcImdldFwiIGluIHZhbHVlKSByZXR1cm4gdmFsdWUuZ2V0KClcbiAgfVxuICByZXR1cm4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZSwgdmFsdWU6IHZhbHVlIGFzIFZhbHVlPFQ+IH0pXG59XG5cbmNvbnN0IGlzU3RtdCA9ICh4OiB1bmtub3duKTogeCBpcyBTdG10ID0+XG4gICEheCAmJiB0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiAmJiBcImtpbmRcIiBpbiB4ICYmIChcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImxvY2FsLnNldFwiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJhcnJheS5zdG9yZVwiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJibG9ja1wiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJsb29wXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImJyZWFrXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcImNvbnRpbnVlXCIgfHxcbiAgICAoeCBhcyBTdG10KS5raW5kID09PSBcInJldHVyblwiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJleHByXCIgfHxcbiAgICAoKHggYXMgU3RtdCkua2luZCA9PT0gXCJpZlwiICYmIEFycmF5LmlzQXJyYXkoKHggYXMgeyB0aGVuPzogdW5rbm93biB9KS50aGVuKSlcbiAgKVxuXG5jb25zdCBzdG10TGlzdCA9IChib2R5OiBTdG10Qm9keSkgPT4gQXJyYXkuaXNBcnJheShib2R5KSA/IGJvZHkgOiBbYm9keV1cbmNvbnN0IGJpbmRTdG10cyA9IChib2R5OiBTdG10Qm9keSwgYnI6IG51bWJlciwgbG9vcDogbnVtYmVyIHwgbnVsbCk6IFN0bXRbXSA9PlxuICBzdG10TGlzdChib2R5KS5tYXAocyA9PiBiaW5kU3RtdChzLCBiciwgbG9vcCkpXG5cbmNvbnN0IGJpbmRTdG10ID0gKHM6IFN0bXQsIGJyOiBudW1iZXIsIGxvb3A6IG51bWJlciB8IG51bGwpOiBTdG10ID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIHsgLi4ucywgdGhlbjogYmluZFN0bXRzKHMudGhlbiwgYnIsIGxvb3ApLCBlbHNlOiBiaW5kU3RtdHMocy5lbHNlLCBiciwgbG9vcCkgfVxuICAgIGNhc2UgXCJicmVha1wiOiByZXR1cm4geyAuLi5zLCB0YXJnZXQ6IHMudGFyZ2V0ID8/IGJyIH1cbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIGlmIChzLnRhcmdldCAhPSBudWxsKSByZXR1cm4gc1xuICAgICAgaWYgKGxvb3AgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiB7IC4uLnMsIHRhcmdldDogbG9vcCB9XG4gICAgZGVmYXVsdDogcmV0dXJuIHNcbiAgfVxufVxuXG5jb25zdCBjb250cm9sQm9keSA9IDxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4oc2VsZjogSCwgYm9keTogQ29udHJvbEJvZHk8SD4pID0+XG4gIGJpbmRTdG10cyh0eXBlb2YgYm9keSA9PT0gXCJmdW5jdGlvblwiID8gYm9keShzZWxmKSA6IGJvZHksIHNlbGYuaWQsIHNlbGYua2luZCA9PT0gXCJsb29wXCIgPyBzZWxmLmlkIDogbnVsbClcblxuY29uc3QgYmluID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQmluT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT5cbiAgZXhwcih7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQobGVmdC50eXBlLCByaWdodCkgfSlcblxuY29uc3QgY21wID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQ21wT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT5cbiAgZXhwcih7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdChsZWZ0LnR5cGUsIHJpZ2h0KSB9KVxuXG5jb25zdCBsb2NhbEV4cHIgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIGxvY2FsOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbCB9KVxuXG5jb25zdCBta0xvY2FsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBUKTogTG9jYWxWYXI8VD4gPT4ge1xuICBjb25zdCBpZCA9IG5leHRMb2NhbElkKytcbiAgY29uc3QgZ2V0ID0gKCkgPT4gbG9jYWxFeHByKHR5cGUsIGlkKVxuICBjb25zdCBzZXQgPSAodmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdCA9PiAoeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbDogaWQsIHR5cGUsIHZhbHVlOiBsaXQodHlwZSwgdmFsdWUpIGFzIEV4cHI8TnVtVHlwZT4gfSlcbiAgY29uc3Qgb3V0OiBMb2NhbFZhcjxUPiA9IHtcbiAgICBpZCwgdHlwZSwgZ2V0LCBzZXQsXG4gICAgYWRkOiByaWdodCA9PiBnZXQoKS5hZGQocmlnaHQpLCBzdWI6IHJpZ2h0ID0+IGdldCgpLnN1YihyaWdodCksIG11bDogcmlnaHQgPT4gZ2V0KCkubXVsKHJpZ2h0KSwgZGl2OiByaWdodCA9PiBnZXQoKS5kaXYocmlnaHQpLFxuICAgIGVxOiByaWdodCA9PiBnZXQoKS5lcShyaWdodCksIGx0OiByaWdodCA9PiBnZXQoKS5sdChyaWdodCksIGd0OiByaWdodCA9PiBnZXQoKS5ndChyaWdodCksXG4gICAgaWFkZDogcmlnaHQgPT4gc2V0KGdldCgpLmFkZChyaWdodCkpLCBpc3ViOiByaWdodCA9PiBzZXQoZ2V0KCkuc3ViKHJpZ2h0KSksIGltdWw6IHJpZ2h0ID0+IHNldChnZXQoKS5tdWwocmlnaHQpKSwgaWRpdjogcmlnaHQgPT4gc2V0KGdldCgpLmRpdihyaWdodCkpLFxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuY29uc3QgbWtIYW5kbGUgPSA8QSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIE51bVR5cGU+KFxuICBwYXJhbXM6IEEsXG4gIHJlc3VsdDogUixcbiAgYnVpbGQ/OiAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPixcbik6IEZ1bmNIYW5kbGU8QSwgUj4gPT4ge1xuICBjb25zdCBpZCA9IG5leHRGdW5jSWQrK1xuICByZXR1cm4ge1xuICAgIGtpbmQ6IFwiZnVuY1wiLFxuICAgIGlkLCBwYXJhbXMsIHJlc3VsdCwgYnVpbGQsXG4gICAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NFeHByPEE+KSA9PiBleHByKHsga2luZDogXCJjYWxsXCIsIHR5cGU6IHJlc3VsdCwgdGFyZ2V0OiBpZCwgYXJnczogYXJncyBhcyBFeHByPE51bVR5cGU+W10gfSkgYXMgRXhwcjxSPixcbiAgfVxufVxuXG5jb25zdCBta0FycmF5ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCBsZW5ndGg6IG51bWJlcik6IEFycmF5SGFuZGxlPFQ+ID0+IHtcbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGxlbmd0aCkgfHwgbGVuZ3RoIDw9IDApIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBhcnJheSBsZW5ndGggJHtsZW5ndGh9YClcbiAgY29uc3QgaWQgPSBuZXh0QXJyYXlJZCsrXG4gIGNvbnN0IGhhbmRsZTogQXJyYXlIYW5kbGU8VD4gPSB7XG4gICAga2luZDogXCJhcnJheVwiLFxuICAgIGlkLCB0eXBlLCBsZW5ndGgsXG4gICAgbG9hZDogaW5kZXggPT4gZXhwcih7IGtpbmQ6IFwibG9hZFwiLCB0eXBlLCBhcnJheTogaWQsIGluZGV4OiBsaXQoXCJpMzJcIiwgaW5kZXgpIH0pLFxuICAgIHN0b3JlOiAoaW5kZXgsIHZhbHVlKSA9PiAoeyBraW5kOiBcImFycmF5LnN0b3JlXCIsIGFycmF5OiBpZCwgdHlwZSwgaW5kZXg6IGxpdChcImkzMlwiLCBpbmRleCksIHZhbHVlOiBsaXQodHlwZSwgdmFsdWUpIGFzIEV4cHI8TnVtVHlwZT4gfSksXG4gIH1cbiAgYXJyYXlSZWdpc3RyeS5zZXQoaWQsIGhhbmRsZSBhcyB1bmtub3duIGFzIEFueUFycmF5KVxuICByZXR1cm4gaGFuZGxlXG59XG5cbmV4cG9ydCBjb25zdCBpMzIgPSAobjogbnVtYmVyKSA9PiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBcImkzMlwiLCB2YWx1ZTogbiB9KVxuZXhwb3J0IGNvbnN0IGk2NCA9IChuOiBiaWdpbnQpID0+IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFwiaTY0XCIsIHZhbHVlOiBuIH0pXG5leHBvcnQgY29uc3QgZjMyID0gKG46IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJmMzJcIiwgdmFsdWU6IG4gfSlcbmV4cG9ydCBjb25zdCBmNjQgPSAobjogbnVtYmVyKSA9PiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBcImY2NFwiLCB2YWx1ZTogbiB9KVxuXG5leHBvcnQgY29uc3QgaWZFbHNlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlXzogRXhwcjxUPikgPT5cbiAgZXhwcih7IGtpbmQ6IFwiaWZcIiwgdHlwZTogdGhlbi50eXBlLCBjb25kLCB0aGVuLCBlbHNlOiBlbHNlXyB9KVxuXG5leHBvcnQgY29uc3QgYWRkID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihcImFkZFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBzdWIgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKFwic3ViXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IG11bCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4oXCJtdWxcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3QgZGl2ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihcImRpdlwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBlcSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJlcVwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBsdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJsdFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBndCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJndFwiLCBsZWZ0LCByaWdodClcblxuZXhwb3J0IGNvbnN0IGRlY2xhcmUgPSA8Y29uc3QgQSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIE51bVR5cGU+KHBhcmFtczogQSwgcmVzdWx0OiBSKSA9PiBta0hhbmRsZShwYXJhbXMsIHJlc3VsdClcbmV4cG9ydCBjb25zdCBmdW5jID0gPGNvbnN0IEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBOdW1UeXBlPihwYXJhbXM6IEEsIHJlc3VsdDogUiwgYnVpbGQ6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gRnVuY0JvZHk8Uj4pID0+XG4gIG1rSGFuZGxlKHBhcmFtcywgcmVzdWx0LCBidWlsZCBhcyAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPilcbmV4cG9ydCBjb25zdCBhcnJheSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgbGVuZ3RoOiBudW1iZXIpID0+IG1rQXJyYXkodHlwZSwgbGVuZ3RoKVxuXG5leHBvcnQgY29uc3QgbG9jYWwgPSBPYmplY3QuZnJvbUVudHJpZXMobnVtVHlwZXMubWFwKHR5cGUgPT4gW3R5cGUsICgpID0+IG1rTG9jYWwodHlwZSldKSkgYXMgeyBbVCBpbiBOdW1UeXBlXTogKCkgPT4gTG9jYWxWYXI8VD4gfVxuXG5leHBvcnQgY29uc3QgcmV0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10ID0+ICh7XG4gIGtpbmQ6IFwicmV0dXJuXCIsXG4gIHZhbHVlOiBsaXQoaW5mZXJUeXBlKHZhbHVlKSwgdmFsdWUpIGFzIEV4cHI8TnVtVHlwZT4sXG59KVxuZXhwb3J0IGNvbnN0IGlmU3RtdCA9IChjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10W10sIGVsc2VfOiBTdG10W10gPSBbXSk6IFN0bXQgPT4gKHsga2luZDogXCJpZlwiLCBjb25kLCB0aGVuLCBlbHNlOiBlbHNlXyB9KVxuZXhwb3J0IGNvbnN0IGJsb2NrID0gKGJvZHk6IENvbnRyb2xCb2R5PEJsb2NrSGFuZGxlPik6IFN0bXQgPT4ge1xuICBjb25zdCBzZWxmOiBCbG9ja0hhbmRsZSA9IHsga2luZDogXCJibG9ja1wiLCBpZDogbmV4dENvbnRyb2xJZCsrIH1cbiAgcmV0dXJuIHsga2luZDogXCJibG9ja1wiLCBjb250cm9sOiBzZWxmLmlkLCBib2R5OiBjb250cm9sQm9keShzZWxmLCBib2R5KSB9XG59XG5leHBvcnQgY29uc3QgbG9vcCA9IChjb25kOiBFeHByPFwiaTMyXCI+LCBib2R5OiBDb250cm9sQm9keTxMb29wSGFuZGxlPik6IFN0bXQgPT4ge1xuICBjb25zdCBzZWxmOiBMb29wSGFuZGxlID0geyBraW5kOiBcImxvb3BcIiwgaWQ6IG5leHRDb250cm9sSWQrKyB9XG4gIHJldHVybiB7IGtpbmQ6IFwibG9vcFwiLCBjb250cm9sOiBzZWxmLmlkLCBjb25kLCBib2R5OiBjb250cm9sQm9keShzZWxmLCBib2R5KSB9XG59XG5leHBvcnQgY29uc3Qgd2hpbGVMb29wID0gbG9vcFxuZXhwb3J0IGNvbnN0IGJyZWFrVG8gPSAodGFyZ2V0PzogQ29udHJvbEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJicmVha1wiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGNvbnRpbnVlVG8gPSAodGFyZ2V0PzogTG9vcEhhbmRsZSk6IFN0bXQgPT4gKHsga2luZDogXCJjb250aW51ZVwiLCB0YXJnZXQ6IHRhcmdldD8uaWQgPz8gbnVsbCB9KVxuZXhwb3J0IGNvbnN0IGV4cHJTdG10ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwcjxUPik6IFN0bXQgPT4gKHsga2luZDogXCJleHByXCIsIGV4cHI6IHZhbHVlIGFzIEV4cHI8TnVtVHlwZT4gfSlcblxudHlwZSBBcnJheUxheW91dCA9IHsgdHlwZTogTnVtVHlwZSwgbGVuZ3RoOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cbnR5cGUgTW9kdWxlQW5hbHlzaXM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7XG4gIGZ1bmNzOiBGdW5jRGVmczxUPlxuICBhcnJheXM6IEFycmF5RGVmczxUPlxuICBmRW50cmllczogW2tleW9mIEZ1bmNEZWZzPFQ+ICYgc3RyaW5nLCBGdW5jRGVmczxUPltrZXlvZiBGdW5jRGVmczxUPl1dW11cbiAgYnVpbHRGdW5jczogQnVpbHRGdW5jW11cbiAgZml4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+XG4gIGxheW91dHM6IFJlY29yZDxudW1iZXIsIEFycmF5TGF5b3V0PlxuICBwYWdlczogbnVtYmVyXG59XG5cbnR5cGUgQ29tcGlsZU9wdGlvbnMgPSB7XG4gIHNoYXJlZD86IGJvb2xlYW5cbn1cblxuY29uc3Qgd2Fsa0V4cHIgPSAoZTogRXhwcjxOdW1UeXBlPiwgZm5zOiB7XG4gIGxvY2FsPzogKGlkOiBudW1iZXIsIHR5cGU6IE51bVR5cGUpID0+IHZvaWRcbiAgYXJyYXk/OiAoaWQ6IG51bWJlcikgPT4gdm9pZFxufSkgPT4ge1xuICBzd2l0Y2ggKGUua2luZCkge1xuICAgIGNhc2UgXCJjb25zdFwiOiByZXR1cm5cbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6IGZucy5sb2NhbD8uKGUubG9jYWwsIGUudHlwZSk7IHJldHVyblxuICAgIGNhc2UgXCJiaW5cIjpcbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICB3YWxrRXhwcihlLmxlZnQsIGZucyk7IHdhbGtFeHByKGUucmlnaHQsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICBlLmFyZ3MuZm9yRWFjaChhcmcgPT4gd2Fsa0V4cHIoYXJnLCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImlmXCI6XG4gICAgICB3YWxrRXhwcihlLmNvbmQsIGZucyk7IHdhbGtFeHByKGUudGhlbiwgZm5zKTsgd2Fsa0V4cHIoZS5lbHNlLCBmbnMpOyByZXR1cm5cbiAgICBjYXNlIFwibG9hZFwiOlxuICAgICAgZm5zLmFycmF5Py4oZS5hcnJheSk7IHdhbGtFeHByKGUuaW5kZXgsIGZucyk7IHJldHVyblxuICAgIGRlZmF1bHQ6IGRpZShlKVxuICB9XG59XG5cbmNvbnN0IHdhbGtTdG10ID0gKHM6IFN0bXQsIGZuczoge1xuICBsb2NhbD86IChpZDogbnVtYmVyLCB0eXBlOiBOdW1UeXBlKSA9PiB2b2lkXG4gIGFycmF5PzogKGlkOiBudW1iZXIpID0+IHZvaWRcbn0pID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6IGZucy5sb2NhbD8uKHMubG9jYWwsIHMudHlwZSk7IHdhbGtFeHByKHMudmFsdWUsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJhcnJheS5zdG9yZVwiOiBmbnMuYXJyYXk/LihzLmFycmF5KTsgd2Fsa0V4cHIocy5pbmRleCwgZm5zKTsgd2Fsa0V4cHIocy52YWx1ZSwgZm5zKTsgcmV0dXJuXG4gICAgY2FzZSBcImlmXCI6IHdhbGtFeHByKHMuY29uZCwgZm5zKTsgcy50aGVuLmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcy5lbHNlLmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImJsb2NrXCI6IHMuYm9keS5mb3JFYWNoKHggPT4gd2Fsa1N0bXQoeCwgZm5zKSk7IHJldHVyblxuICAgIGNhc2UgXCJsb29wXCI6IHdhbGtFeHByKHMuY29uZCwgZm5zKTsgcy5ib2R5LmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICByZXR1cm5cbiAgICBjYXNlIFwicmV0dXJuXCI6IHdhbGtFeHByKHMudmFsdWUsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJleHByXCI6IHdhbGtFeHByKHMuZXhwciwgZm5zKTsgcmV0dXJuXG4gICAgZGVmYXVsdDogZGllKHMpXG4gIH1cbn1cblxuY29uc3QgYWRkciA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPikgPT4gaW5kZXgubXVsKGNvZGVzLmJ5dGVzW2xheW91dC50eXBlXSkuYWRkKGxheW91dC5vZmZzZXQpXG5jb25zdCBtZW1hcmcgPSAodHlwZTogTnVtVHlwZSwgb2Zmc2V0ID0gMCkgPT4gWy4uLnUzMihjb2Rlcy5hbGlnblt0eXBlXSksIC4uLnUzMihvZmZzZXQpXVxuY29uc3QgY29uc3RJMzIgPSAoZTogRXhwcjxcImkzMlwiPikgPT4gZS5raW5kID09PSBcImNvbnN0XCIgPyBlLnZhbHVlIDogbnVsbFxuY29uc3QgY2hlY2tBcnJheUJvdW5kcyA9IChsYXlvdXQ6IEFycmF5TGF5b3V0LCBpbmRleDogRXhwcjxcImkzMlwiPikgPT4ge1xuICBjb25zdCBuID0gY29uc3RJMzIoaW5kZXgpXG4gIGlmIChuID09IG51bGwpIHJldHVyblxuICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDAgfHwgbiA+PSBsYXlvdXQubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYEFycmF5IGluZGV4ICR7bn0gb3V0IG9mIGJvdW5kcyBmb3IgbGVuZ3RoICR7bGF5b3V0Lmxlbmd0aH1gKVxufVxuXG5jb25zdCBjb21waWxlRXhwciA9IChlOiBFeHByPE51bVR5cGU+LCBmaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj4sIGxpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPiwgYXJyYXlzOiBSZWNvcmQ8bnVtYmVyLCBBcnJheUxheW91dD4pOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAoZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6XG4gICAgICBpZiAoZS50eXBlID09PSBcImkzMlwiKSByZXR1cm4gWzB4NDEsIC4uLnNOKGUudmFsdWUgYXMgbnVtYmVyLCAzMildXG4gICAgICBpZiAoZS50eXBlID09PSBcImk2NFwiKSByZXR1cm4gWzB4NDIsIC4uLnNOKGUudmFsdWUsIDY0KV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZjMyXCIpIHJldHVybiBbMHg0MywgLi4uZk4oZS52YWx1ZSBhcyBudW1iZXIsIDQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmNjRcIikgcmV0dXJuIFsweDQ0LCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgOCldXG4gICAgICByZXR1cm4gZGllKGUpXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOlxuICAgICAgcmV0dXJuIFsweDIwLCAuLi51MzIobGl4W2UubG9jYWxdISldXG4gICAgY2FzZSBcImJpblwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQsIGZpeCwgbGl4LCBhcnJheXMpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0LCBmaXgsIGxpeCwgYXJyYXlzKSwgY29kZXMuYmluW2Uub3BdW2UudHlwZV1dXG4gICAgY2FzZSBcImNtcFwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQsIGZpeCwgbGl4LCBhcnJheXMpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0LCBmaXgsIGxpeCwgYXJyYXlzKSwgY29kZXMuY21wW2Uub3BdW2UuaW5wdXRUeXBlXV1cbiAgICBjYXNlIFwiY2FsbFwiOlxuICAgICAgaWYgKGZpeFtlLnRhcmdldF0gPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGZ1bmN0aW9uICR7ZS50YXJnZXR9YClcbiAgICAgIHJldHVybiBbLi4uZmxhdE1hcChlLmFyZ3MsIGFyZyA9PiBjb21waWxlRXhwcihhcmcsIGZpeCwgbGl4LCBhcnJheXMpKSwgMHgxMCwgLi4udTMyKGZpeFtlLnRhcmdldF0hKV1cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5jb25kLCBmaXgsIGxpeCwgYXJyYXlzKSwgMHgwNCwgY29kZXMudHlwZVtlLnR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4sIGZpeCwgbGl4LCBhcnJheXMpLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UsIGZpeCwgbGl4LCBhcnJheXMpLCAweDBiXVxuICAgIGNhc2UgXCJsb2FkXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5c1tlLmFycmF5XVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke2UuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBlLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgZS5pbmRleCksIGZpeCwgbGl4LCBhcnJheXMpLCBjb2Rlcy5sb2FkW2UudHlwZV0sIC4uLm1lbWFyZyhlLnR5cGUpXVxuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGRpZShlKVxuICB9XG59XG5cbnR5cGUgTGFiZWxGcmFtZSA9IHsgY29udHJvbD86IG51bWJlciwga2luZD86IFwiYnJlYWtcIiB8IFwiY29udGludWVcIiB9XG5jb25zdCBkZXB0aCA9IChzdGFjazogTGFiZWxGcmFtZVtdLCBjb250cm9sOiBudW1iZXIsIGtpbmQ6IE5vbk51bGxhYmxlPExhYmVsRnJhbWVbXCJraW5kXCJdPikgPT4ge1xuICBjb25zdCBpID0gc3RhY2suZmluZEluZGV4KHggPT4geC5jb250cm9sID09PSBjb250cm9sICYmIHgua2luZCA9PT0ga2luZClcbiAgaWYgKGkgPCAwKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gJHtraW5kfSB0YXJnZXQgJHtjb250cm9sfWApXG4gIHJldHVybiBpXG59XG5cbmNvbnN0IGNvbXBpbGVTdG10ID0gKFxuICBzOiBTdG10LFxuICBmaXg6IFJlY29yZDxudW1iZXIsIG51bWJlcj4sXG4gIGxpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPixcbiAgYXJyYXlzOiBSZWNvcmQ8bnVtYmVyLCBBcnJheUxheW91dD4sXG4gIHN0YWNrOiBMYWJlbEZyYW1lW10gPSBbXSxcbik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMudmFsdWUsIGZpeCwgbGl4LCBhcnJheXMpLCAweDIxLCAuLi51MzIobGl4W3MubG9jYWxdISldXG4gICAgY2FzZSBcImFycmF5LnN0b3JlXCI6IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGFycmF5c1tzLmFycmF5XVxuICAgICAgaWYgKCFsYXlvdXQpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke3MuYXJyYXl9YClcbiAgICAgIGNoZWNrQXJyYXlCb3VuZHMobGF5b3V0LCBzLmluZGV4KVxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihhZGRyKGxheW91dCwgcy5pbmRleCksIGZpeCwgbGl4LCBhcnJheXMpLCAuLi5jb21waWxlRXhwcihzLnZhbHVlLCBmaXgsIGxpeCwgYXJyYXlzKSwgY29kZXMuc3RvcmVbcy50eXBlXSwgLi4ubWVtYXJnKHMudHlwZSldXG4gICAgfVxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmNvbmQsIGZpeCwgbGl4LCBhcnJheXMpLCAweDA0LCAweDQwLCAuLi5mbGF0TWFwKHMudGhlbiwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBbe30sIC4uLnN0YWNrXSkpLCAuLi4ocy5lbHNlLmxlbmd0aCA/IFsweDA1LCAuLi5mbGF0TWFwKHMuZWxzZSwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBbe30sIC4uLnN0YWNrXSkpXSA6IFtdKSwgMHgwYl1cbiAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgLi4uZmxhdE1hcChzLmJvZHksIHggPT4gY29tcGlsZVN0bXQoeCwgZml4LCBsaXgsIGFycmF5cywgW3sgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGJdXG4gICAgY2FzZSBcImxvb3BcIjpcbiAgICAgIHJldHVybiBbMHgwMiwgMHg0MCwgMHgwMywgMHg0MCwgLi4uY29tcGlsZUV4cHIocy5jb25kLCBmaXgsIGxpeCwgYXJyYXlzKSwgMHg0NSwgMHgwZCwgLi4udTMyKDEpLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiY29udGludWVcIiB9LCB7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJicmVha1wiIH0sIC4uLnN0YWNrXSkpLCAweDBjLCAuLi51MzIoMCksIDB4MGIsIDB4MGJdXG4gICAgY2FzZSBcImJyZWFrXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiYnJlYWtUbygpIHVzZWQgb3V0c2lkZSBhIGJsb2NrIG9yIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJicmVha1wiKSldXG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiY29udGludWVUbygpIHVzZWQgb3V0c2lkZSBhIGxvb3BcIilcbiAgICAgIHJldHVybiBbMHgwYywgLi4udTMyKGRlcHRoKHN0YWNrLCBzLnRhcmdldCwgXCJjb250aW51ZVwiKSldXG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlLCBmaXgsIGxpeCwgYXJyYXlzKSwgMHgwZl1cbiAgICBjYXNlIFwiZXhwclwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLmV4cHIsIGZpeCwgbGl4LCBhcnJheXMpLCAweDFhXVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKHMpXG4gIH1cbn1cblxuY29uc3QgYXJyYXlMYXlvdXRzID0gKGRlZnM6IFJlY29yZDxzdHJpbmcsIEFueUFycmF5PikgPT4ge1xuICBsZXQgb2Zmc2V0ID0gMFxuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZGVmcykgYXMgW3N0cmluZywgQW55QXJyYXldW11cbiAgY29uc3Qgb3V0OiBSZWNvcmQ8bnVtYmVyLCBBcnJheUxheW91dD4gPSB7fVxuICBmb3IgKGNvbnN0IFssIGFycl0gb2YgZW50cmllcykge1xuICAgIG91dFthcnIuaWRdID0geyB0eXBlOiBhcnIudHlwZSwgbGVuZ3RoOiBhcnIubGVuZ3RoLCBvZmZzZXQgfVxuICAgIG9mZnNldCArPSBhcnIubGVuZ3RoICogY29kZXMuYnl0ZXNbYXJyLnR5cGVdXG4gIH1cbiAgcmV0dXJuIHsgbGF5b3V0czogb3V0LCBieXRlczogb2Zmc2V0LCBlbnRyaWVzIH1cbn1cblxuY29uc3QgbW9kdWxlRnVuY3MgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PlxuICBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMobW9kKS5maWx0ZXIoKFssIHZdKSA9PiB2LmtpbmQgPT09IFwiZnVuY1wiKSkgYXMgRnVuY0RlZnM8VD5cblxuY29uc3QgbW9kdWxlQXJyYXlzID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KG1vZDogVCkgPT5cbiAgT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKG1vZCkuZmlsdGVyKChbLCB2XSkgPT4gdi5raW5kID09PSBcImFycmF5XCIpKSBhcyBBcnJheURlZnM8VD5cblxudHlwZSBCdWlsdEZ1bmMgPSB7XG4gIGZ1bmM6IEFueUZ1bmNcbiAgcGFyYW1JZHM6IG51bWJlcltdXG4gIGJ1aWx0OiBGdW5jQm9keTxOdW1UeXBlPlxufVxuXG5jb25zdCBidWlsZEZ1bmMgPSAoZnVuYzogQW55RnVuYyk6IEJ1aWx0RnVuYyA9PiB7XG4gIGNvbnN0IHBhcmFtcyA9IGZ1bmMucGFyYW1zLm1hcCh0eXBlID0+IGxvY2FsRXhwcih0eXBlLCBuZXh0TG9jYWxJZCsrKSkgYXMgRXhwcjxOdW1UeXBlPltdXG4gIHJldHVybiB7XG4gICAgZnVuYyxcbiAgICBwYXJhbUlkczogcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSksXG4gICAgYnVpbHQ6IGZ1bmMuYnVpbGQ/LiguLi5wYXJhbXMpID8/IGRpZShgRnVuY3Rpb24gJHtmdW5jLmlkfSBoYXMgbm8gaW1wbGVtZW50YXRpb25gKSxcbiAgfVxufVxuXG5jb25zdCBkaXNjb3ZlcmVkQXJyYXlzID0gKGJ1aWx0RnVuY3M6IEJ1aWx0RnVuY1tdKSA9PiB7XG4gIGNvbnN0IHVzZWQgPSBuZXcgU2V0PG51bWJlcj4oKVxuICBmb3IgKGNvbnN0IHsgYnVpbHQgfSBvZiBidWlsdEZ1bmNzKSB7XG4gICAgY29uc3QgYm9keSA9IEFycmF5LmlzQXJyYXkoYnVpbHQpID8gYnVpbHQgOiBpc1N0bXQoYnVpbHQpID8gW2J1aWx0XSA6IG51bGxcbiAgICBib2R5ID8gYm9keS5mb3JFYWNoKHMgPT4gd2Fsa1N0bXQocywgeyBhcnJheTogaWQgPT4gdXNlZC5hZGQoaWQpIH0pKSA6IHdhbGtFeHByKGJ1aWx0IGFzIEV4cHI8TnVtVHlwZT4sIHsgYXJyYXk6IGlkID0+IHVzZWQuYWRkKGlkKSB9KVxuICB9XG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoWy4uLnVzZWRdLm1hcChpZCA9PiB7XG4gICAgY29uc3QgYXJyID0gYXJyYXlSZWdpc3RyeS5nZXQoaWQpXG4gICAgaWYgKCFhcnIpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhcnJheSAke2lkfWApXG4gICAgcmV0dXJuIFtTdHJpbmcoaWQpLCBhcnJdXG4gIH0pKSBhcyBSZWNvcmQ8c3RyaW5nLCBBbnlBcnJheT5cbn1cblxuY29uc3QgYW5hbHl6ZU1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQpID0+IHtcbiAgY29uc3QgZnVuY3MgPSBtb2R1bGVGdW5jcyhtb2QpXG4gIGNvbnN0IGFycmF5cyA9IG1vZHVsZUFycmF5cyhtb2QpXG4gIGNvbnN0IGZFbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZnVuY3MpIGFzIFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGNvbnN0IGJ1aWx0RnVuY3MgPSBmRW50cmllcy5tYXAoKFssIGZ1bmNdKSA9PiBidWlsZEZ1bmMoZnVuYykpXG4gIGNvbnN0IGZpeCA9IE9iamVjdC5mcm9tRW50cmllcyhmRW50cmllcy5tYXAoKFssIGRlZl0sIGkpID0+IFtkZWYuaWQsIGldKSkgYXMgUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICBjb25zdCB0b3VjaGVkQXJyYXlzID0gZGlzY292ZXJlZEFycmF5cyhidWlsdEZ1bmNzKVxuICBjb25zdCBhbGxBcnJheXMgPSB7IC4uLnRvdWNoZWRBcnJheXMsIC4uLmFycmF5cyB9IGFzIFJlY29yZDxzdHJpbmcsIEFueUFycmF5PlxuICBjb25zdCB7IGxheW91dHMsIGJ5dGVzIH0gPSBhcnJheUxheW91dHMoYWxsQXJyYXlzKVxuICByZXR1cm4geyBmdW5jcywgYXJyYXlzLCBmRW50cmllcywgYnVpbHRGdW5jcywgZml4LCBsYXlvdXRzLCBwYWdlczogTWF0aC5tYXgoMSwgTWF0aC5jZWlsKGJ5dGVzIC8gNjU1MzYpKSB9IGFzIE1vZHVsZUFuYWx5c2lzPFQ+XG59XG5cbmNvbnN0IGVtaXRNb2R1bGUgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4oeyBmRW50cmllcywgYnVpbHRGdW5jcywgZml4LCBsYXlvdXRzLCBwYWdlcyB9OiBNb2R1bGVBbmFseXNpczxUPiwgeyBzaGFyZWQgPSBmYWxzZSB9OiBDb21waWxlT3B0aW9ucyA9IHt9KSA9PiB7XG4gIGNvbnN0IGZ1bmN0aW9uU2VjdGlvbiA9IGZFbnRyaWVzLmZsYXRNYXAoKF8sIGkpID0+IHUzMihpKSlcbiAgY29uc3QgZXhwb3J0U2VjdGlvbiA9IGZFbnRyaWVzLmZsYXRNYXAoKFtuYW1lXSwgaSkgPT4gWy4uLnN0cihuYW1lKSwgMHgwMCwgLi4udTMyKGkpXSlcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFtcbiAgICAuLi5tYWdpYyxcbiAgICAuLi5zZWN0aW9uKDB4MDEsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZmxhdE1hcChmRW50cmllcywgKFssIGZdKSA9PiBbMHg2MCwgLi4udTMyKGYucGFyYW1zLmxlbmd0aCksIC4uLmYucGFyYW1zLm1hcCh0ID0+IGNvZGVzLnR5cGVbdF0pLCAweDAxLCBjb2Rlcy50eXBlW2YucmVzdWx0XV0pXSksXG4gICAgLi4uc2VjdGlvbigweDAyLCBbXG4gICAgICAweDAxLFxuICAgICAgLi4uc3RyKFwiZW52XCIpLFxuICAgICAgLi4uc3RyKFwibWVtb3J5XCIpLFxuICAgICAgMHgwMixcbiAgICAgIHNoYXJlZCA/IDB4MDMgOiAweDAxLFxuICAgICAgLi4udTMyKHBhZ2VzKSxcbiAgICAgIC4uLnUzMihwYWdlcyksXG4gICAgXSksXG4gICAgLi4uc2VjdGlvbigweDAzLCBbLi4udTMyKGZFbnRyaWVzLmxlbmd0aCksIC4uLmZ1bmN0aW9uU2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwNywgWy4uLnUzMihmRW50cmllcy5sZW5ndGgpLCAuLi5leHBvcnRTZWN0aW9uXSksXG4gICAgLi4uc2VjdGlvbigweDBhLCBbXG4gICAgICAuLi51MzIoZkVudHJpZXMubGVuZ3RoKSxcbiAgICAgIC4uLmZsYXRNYXAoYnVpbHRGdW5jcywgKHsgZnVuYywgcGFyYW1JZHMsIGJ1aWx0IH0pID0+IHtcbiAgICAgICAgY29uc3QgbG9jYWxzID0gbmV3IE1hcDxudW1iZXIsIE51bVR5cGU+KClcbiAgICAgICAgY29uc3Qgc3RtdHMgPSBBcnJheS5pc0FycmF5KGJ1aWx0KSA/IGJ1aWx0IDogaXNTdG10KGJ1aWx0KSA/IFtidWlsdF0gOiBudWxsXG4gICAgICAgIHN0bXRzID8gc3RtdHMuZm9yRWFjaChzID0+IHdhbGtTdG10KHMsIHsgbG9jYWw6IChpZCwgdHlwZSkgPT4gbG9jYWxzLnNldChpZCwgdHlwZSkgfSkpIDogd2Fsa0V4cHIoYnVpbHQgYXMgRXhwcjxOdW1UeXBlPiwgeyBsb2NhbDogKGlkLCB0eXBlKSA9PiBsb2NhbHMuc2V0KGlkLCB0eXBlKSB9KVxuICAgICAgICBwYXJhbUlkcy5mb3JFYWNoKGlkID0+IGxvY2Fscy5kZWxldGUoaWQpKVxuICAgICAgICBjb25zdCBsb2NhbEVudHJpZXMgPSBbLi4ubG9jYWxzLmVudHJpZXMoKV1cbiAgICAgICAgY29uc3QgbGl4ID0gT2JqZWN0LmZyb21FbnRyaWVzKFsuLi5wYXJhbUlkcy5tYXAoKGlkLCBpKSA9PiBbaWQsIGldKSwgLi4ubG9jYWxFbnRyaWVzLm1hcCgoW2lkXSwgaSkgPT4gW2lkLCBmdW5jLnBhcmFtcy5sZW5ndGggKyBpXSldKSBhcyBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+XG4gICAgICAgIGNvbnN0IGRlY2xzID0gWy4uLnUzMihsb2NhbEVudHJpZXMubGVuZ3RoKSwgLi4uZmxhdE1hcChsb2NhbEVudHJpZXMsIChbLCB0eXBlXSkgPT4gWy4uLnUzMigxKSwgY29kZXMudHlwZVt0eXBlXV0pXVxuICAgICAgICBjb25zdCBjb2RlID0gc3RtdHMgPyBmbGF0TWFwKHN0bXRzLCBzID0+IGNvbXBpbGVTdG10KHMsIGZpeCwgbGl4LCBsYXlvdXRzKSkgOiBjb21waWxlRXhwcihidWlsdCBhcyBFeHByPE51bVR5cGU+LCBmaXgsIGxpeCwgbGF5b3V0cylcbiAgICAgICAgY29uc3QgYm9keSA9IFsuLi5kZWNscywgLi4uY29kZSwgMHgwYl1cbiAgICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgICAgfSksXG4gICAgXSksXG4gIF0pXG59XG5cbmV4cG9ydCBjb25zdCBjb21waWxlTW9kdWxlID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KG1vZDogVCwgb3B0cz86IENvbXBpbGVPcHRpb25zKSA9PiBlbWl0TW9kdWxlKGFuYWx5emVNb2R1bGUobW9kKSwgb3B0cylcblxuY29uc3QgdHlwZWRBcnJheUN0b3IgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQpOiB7IG5ldyhidWZmZXI6IEFycmF5QnVmZmVyTGlrZSwgYnl0ZU9mZnNldDogbnVtYmVyLCBsZW5ndGg6IG51bWJlcik6IFR5cGVkQXJyYXlGb3I8VD4gfSA9PiB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgXCJpMzJcIjogcmV0dXJuIEludDMyQXJyYXkgYXMgYW55XG4gICAgY2FzZSBcImk2NFwiOiByZXR1cm4gQmlnSW50NjRBcnJheSBhcyBhbnlcbiAgICBjYXNlIFwiZjMyXCI6IHJldHVybiBGbG9hdDMyQXJyYXkgYXMgYW55XG4gICAgY2FzZSBcImY2NFwiOiByZXR1cm4gRmxvYXQ2NEFycmF5IGFzIGFueVxuICAgIGRlZmF1bHQ6IHJldHVybiBkaWUodHlwZSlcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZSA9IGFzeW5jIDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQsIG9wdHM6IENvbXBpbGVPcHRpb25zID0ge30pOiBQcm9taXNlPENvbXBpbGVSZXN1bHQ8VD4+ID0+IHtcbiAgY29uc3QgYW5hbHlzaXMgPSBhbmFseXplTW9kdWxlKG1vZClcbiAgY29uc3QgeyBmdW5jcywgYXJyYXlzLCBsYXlvdXRzIH0gPSBhbmFseXNpc1xuICBjb25zdCBtZW1vcnkgPSBuZXcgV2ViQXNzZW1ibHkuTWVtb3J5KHsgaW5pdGlhbDogYW5hbHlzaXMucGFnZXMsIG1heGltdW06IGFuYWx5c2lzLnBhZ2VzLCBzaGFyZWQ6ICEhb3B0cy5zaGFyZWQgfSlcbiAgbGV0IGNvbXBpbGVkID0gYXdhaXQgV2ViQXNzZW1ibHkuY29tcGlsZShlbWl0TW9kdWxlKGFuYWx5c2lzLCBvcHRzKS5idWZmZXIpXG4gIGNvbnN0IHdhc20gPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShjb21waWxlZCwgeyBlbnY6IHsgbWVtb3J5IH0gfSlcbiAgY29uc3QgZXhwb3J0cyA9IHdhc20uZXhwb3J0cyBhcyBXZWJBc3NlbWJseS5FeHBvcnRzXG4gIGNvbnN0IGpzRnVuY3MgPSBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmtleXMoZnVuY3MpLm1hcChuYW1lID0+IFtuYW1lLCBleHBvcnRzW25hbWVdXSkpXG4gIGNvbnN0IGpzQXJyYXlzID0gKE9iamVjdC5lbnRyaWVzKGFycmF5cykgYXMgW3N0cmluZywgQW55QXJyYXldW10pLm1hcCgoW25hbWUsIGFycl0pID0+IHtcbiAgICBjb25zdCBsYXlvdXQgPSBsYXlvdXRzW2Fyci5pZF0hXG4gICAgY29uc3QgQ3RvciA9IHR5cGVkQXJyYXlDdG9yKGFyci50eXBlKVxuICAgIHJldHVybiBbbmFtZSwgbmV3IEN0b3IobWVtb3J5LmJ1ZmZlciwgbGF5b3V0Lm9mZnNldCwgYXJyLmxlbmd0aCldIGFzIGNvbnN0XG4gIH0pXG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoW1xuICAgIC4uLk9iamVjdC5lbnRyaWVzKGpzRnVuY3MpLFxuICAgIC4uLmpzQXJyYXlzLFxuICAgIFtcIm1vZFwiLCBjb21waWxlZF0sXG4gICAgW1wibWVtb3J5XCIsIG1lbW9yeV0sXG4gIF0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiXG5pbXBvcnQgdHlwZSB7IEpzb25EYXRhIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuZXhwb3J0IGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG5jb25zdCBjb2xvclBhbGV0dGUgPSB7XG4gIGxpZ2h0OntcbiAgICBjb2xvcjogICAgICAgICAgICAgXCIjMDAwXCIsXG4gICAgYmFja2dyb3VuZDogICAgICAgIFwiI2ZmZlwiLFxuICAgIHJlZDogICAgICAgICAgICAgICBcInJnYigyNDIsIDU1LCA1NSlcIixcbiAgICBncmVlbjogICAgICAgICAgICAgXCJyZ2IoNTcsIDIxNCwgMzkpXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDUsIDI4LCAxNDEpXCIsXG4gICAgbGlnaHRibHVlOiAgICAgICAgIFwicmdiKDIxLCAxMzcsIDIzOSlcIixcbiAgICBncmF5OiAgICAgICAgICAgICAgXCIjODg4XCIsXG4gICAgbGlnaHRncmF5OiAgICAgICAgIFwiI2U1ZTVlNVwiLFxuICB9LFxuICBkYXJrOntcbiAgICBjb2xvcjogICAgICAgICAgICAgXCIjZmZmXCIsXG4gICAgYmFja2dyb3VuZDogICAgICAgIFwiIzIyMlwiLFxuICAgIHJlZDogICAgICAgICAgICAgICBcInJnYigxOTgsIDIwLCAwKVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig5NSwgMTU5LCAyNTUpXCIsXG4gICAgbGlnaHRibHVlOiAgICAgICAgIFwicmdiKDk1LCAxMDAsIDI1NSlcIixcbiAgICBncmVlbjogICAgICAgICAgICAgXCJyZ2IoMCwgMTg1LCAxOSlcIixcbiAgICBncmF5OiAgICAgICAgICAgICAgXCIjNTY1NjU2XCIsXG4gICAgbGlnaHRncmF5OiAgICAgICAgIFwiIzQxNDE0MVwiLFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb2xvciA9IHtcbiAgY29sb3I6IFwidmFyKC0tY29sb3IpXCIsXG4gIGJhY2tncm91bmQ6IFwidmFyKC0tYmFja2dyb3VuZClcIixcbiAgYmx1ZTogXCJ2YXIoLS1ibHVlKVwiLFxuICBsaWdodEJsdWU6IFwidmFyKC0tbGlnaHRibHVlKVwiLFxuICByZWQ6IFwidmFyKC0tcmVkKVwiLFxuICBncmVlbjogXCJ2YXIoLS1ncmVlbilcIixcbiAgZ3JheTogXCJ2YXIoLS1ncmF5KVwiLFxuICBsaWdodGdyYXk6IFwidmFyKC0tbGlnaHRncmF5KVwiXG59XG5cblxubGV0IHN0eWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIilcbnN0eWwuaW5uZXJIVE1MID0gYFxuOnJvb3Qge1xuICAtLWNvbG9yOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmNvbG9yfTtcbiAgLS1iYWNrZ3JvdW5kOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmJhY2tncm91bmR9O1xuICAtLXJlZDogJHtjb2xvclBhbGV0dGUuZGFyay5yZWR9O1xuICAtLWdyZWVuOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyZWVufTtcbiAgLS1ibHVlOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmJsdWV9O1xuICAtLWdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JheX07XG4gIC0tbGlnaHRncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmxpZ2h0Z3JheX07XG4gIGNvbG9yOiB2YXIoLS1jb2xvcik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQpO1xuICBmb250LWZhbWlseTogc2Fucy1zZXJpZjtcbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIDpyb290IHtcbiAgICAtLWNvbG9yOiAke2NvbG9yUGFsZXR0ZS5saWdodC5jb2xvcn07XG4gICAgLS1iYWNrZ3JvdW5kOiAke2NvbG9yUGFsZXR0ZS5saWdodC5iYWNrZ3JvdW5kfTtcbiAgICAtLXJlZDogJHtjb2xvclBhbGV0dGUubGlnaHQucmVkfTtcbiAgICAtLWdyZWVuOiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmVlbn07XG4gICAgLS1ibHVlOiAke2NvbG9yUGFsZXR0ZS5saWdodC5ibHVlfTtcbiAgICAtLWdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyYXl9O1xuICAgIC0tbGlnaHRncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5saWdodGdyYXl9O1xuICB9XG59XG5gXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWwpXG5cbmV4cG9ydCB0eXBlIGh0bWxLZXkgPSAnaW5uZXJUZXh0J3wnb25jbGljaycgfCAnb25pbnB1dCcgfCAnb25rZXlkb3duJyB8ICdvbm1vdXNlZW50ZXInIHwgJ29ubW91c2VvdmVyJyB8ICdvbm1vdXNlZXhpdCcgfCdjaGlsZHJlbid8J2NsYXNzJ3wnaWQnfCdjb250ZW50RWRpdGFibGUnfCdldmVudExpc3RlbmVycyd8J2NvbG9yJ3wnYmFja2dyb3VuZCcgfCAnc3R5bGUnIHwgJ3BsYWNlaG9sZGVyJyB8ICd0YWJJbmRleCcgfCAnY29sU3BhbicgfCAndHlwZSdcbmV4cG9ydCBjb25zdCBodG1sRWxlbWVudCA9ICh0YWc6c3RyaW5nLCB0ZXh0OnN0cmluZywgYXJncz86UGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4pOkhUTUxFbGVtZW50ID0+e1xuXG4gIGNvbnN0IF9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpXG4gIF9lbGVtZW50LnRleHRDb250ZW50ID0gdGV4dFxuICBsZXQgc3QgPSBfZWxlbWVudC5zdHlsZVxuICBpZiAodGFnID09IFwiYnV0dG9uXCIpe1xuICAgIF9lbGVtZW50LmlubmVyVGV4dCA9IHRleHRcbiAgICBzdC5jb2xvciA9IGNvbG9yLmNvbG9yXG4gICAgc3QuYmFja2dyb3VuZENvbG9yID0gY29sb3IubGlnaHRncmF5XG4gICAgc3QuYm9yZGVyID0gXCIxcHggc29saWQgXCIrY29sb3IuZ3JheVxuICAgIHN0LmJvcmRlclJhZGl1cyA9IFwiLjJlbVwiXG4gICAgc3QucGFkZGluZyA9IFwiLjFlbSAuNGVtXCJcbiAgICBzdC5tYXJnaW4gPSBcIi4yZW1cIlxuICB9XG4gIGlmIChhcmdzKSBPYmplY3QuZW50cmllcyhhcmdzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pPT57XG4gICAgaWYgKGtleSA9PT0gJ3BhcmVudCcpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChfZWxlbWVudClcbiAgICB9XG4gICAgaWYgKGtleT09PSdjaGlsZHJlbicpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50W10pLmZvckVhY2goYz0+X2VsZW1lbnQuYXBwZW5kQ2hpbGQoYykpXG4gICAgfWVsc2UgaWYgKGtleT09PSdldmVudExpc3RlbmVycycpe1xuICAgICAgT2JqZWN0LmVudHJpZXModmFsdWUgYXMgUmVjb3JkPHN0cmluZywgKGU6RXZlbnQpPT52b2lkPikuZm9yRWFjaCgoW2V2ZW50LCBsaXN0ZW5lcl0pPT57XG4gICAgICAgIF9lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxuICAgICAgfSlcbiAgICB9ZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKXtcbiAgICAgIE9iamVjdC5hc3NpZ24oX2VsZW1lbnQuc3R5bGUsIHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pXG4gICAgfWVsc2V7XG4gICAgICBfZWxlbWVudFsoa2V5IGFzICdpbm5lclRleHQnIHwgJ29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ2lkJyB8ICdjb250ZW50RWRpdGFibGUnKV0gPSB2YWx1ZVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIF9lbGVtZW50XG59XG5cbmV4cG9ydCB0eXBlIEhUTUxBcmcgPSBzdHJpbmcgfCBudW1iZXIgfCBIVE1MRWxlbWVudCB8IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ICB8IFByb21pc2U8SFRNTEFyZz4gfCBIVE1MQXJnW10gfCBGdW5jdGlvblxuZXhwb3J0IGNvbnN0IGh0bWwgPSAodGFnOnN0cmluZywgLi4uY3M6SFRNTEFyZ1tdKTpIVE1MRWxlbWVudD0+e1xuICBsZXQgY2hpbGRyZW46IEhUTUxFbGVtZW50W10gPSBbXVxuICBsZXQgYXJnczogUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gPSB7fVxuXG4gIGNvbnN0IGFkZF9hcmcgPSAoYXJnOkhUTUxBcmcpPT57XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcpKVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcudG9TdHJpbmcoKSkpXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgUHJvbWlzZSl7XG4gICAgICBjb25zdCBlbCA9IHNwYW4oXCIuLi5cIilcbiAgICAgIGFyZy50aGVuKCh2YWx1ZSk9PntcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKHZhbHVlKSlcbiAgICAgIH0pXG4gICAgICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIH1cbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgY2hpbGRyZW4ucHVzaChhcmcpXG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSBhcmcuZm9yRWFjaCh4PT5hZGRfYXJnKHgpKVxuICAgIC8vIGVsc2UgaWYgKCdnZXQnIGluIGFyZyAmJiB0eXBlb2YgYXJnLmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vICAgY29uc3QgZWwgPSBzcGFuKClcbiAgICAvLyAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgLy8gICBpZiAoJ29udXBkYXRlJyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5vbnVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykgYXJnLm9udXBkYXRlKHg9PmVsLnJlcGxhY2VDaGlsZHJlbih4KSlcbiAgICAvLyB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PSBcImZ1bmN0aW9uXCIpe1xuICAgICAgaWYgKGFyZy5uYW1lID09IFwib25pbnB1dFwiKSBhcmdzLm9uaW5wdXQgPSBhcmdcbiAgICAgIGVsc2UgaWYgKGFyZy5uYW1lID09IFwib25jbGlja1wiIHx8IGFyZy5sZW5ndGggPCAyKSBhcmdzLm9uY2xpY2sgPSBhcmdcbiAgICAgIGVsc2UgY29uc29sZS53YXJuKFwiRnVuY3Rpb24gYXJndW1lbnQgd2l0aG91dCBuYW1lIG9yIHdpdGggbW9yZSB0aGFuIG9uZSBwYXJhbWV0ZXIgaXMgaWdub3JlZCBpbiBodG1sIGdlbmVyYXRvclwiKVxuICAgIH1cbiAgICBlbHNlIGFyZ3MgPSB7Li4uYXJncywgLi4uYXJnfVxuICB9XG4gIGNzLmZvckVhY2goYWRkX2FyZylcbiAgcmV0dXJuIGh0bWxFbGVtZW50KHRhZywgXCJcIiwgey4uLmFyZ3MsIGNoaWxkcmVufSlcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEdlbmVyYXRvcjxUIGV4dGVuZHMgSFRNTEVsZW1lbnQgPSBIVE1MRWxlbWVudD4gPSAoLi4uY3M6SFRNTEFyZ1tdKSA9PiBUXG5jb25zdCBuZXdIdG1sR2VuZXJhdG9yID0gPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4odGFnOnN0cmluZyk9PiguLi5jczpIVE1MQXJnW10pOlQ9Pmh0bWwodGFnLCAuLi5jcykgYXMgVFxuXG5leHBvcnQgY29uc3QgcDpIVE1MR2VuZXJhdG9yPEhUTUxQYXJhZ3JhcGhFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwXCIpXG5leHBvcnQgY29uc3QgYTpIVE1MR2VuZXJhdG9yPEhUTUxBbmNob3JFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJhXCIpXG5leHBvcnQgY29uc3QgaDE6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgxXCIpXG5leHBvcnQgY29uc3QgaDI6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgyXCIpXG5leHBvcnQgY29uc3QgaDM6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgzXCIpXG5leHBvcnQgY29uc3QgaDQ6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImg0XCIpXG5cbmV4cG9ydCBjb25zdCBkaXY6SFRNTEdlbmVyYXRvcjxIVE1MRGl2RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiZGl2XCIpXG5leHBvcnQgY29uc3QgcHJlOkhUTUxHZW5lcmF0b3I8SFRNTFByZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInByZVwiKVxuZXhwb3J0IGNvbnN0IHNwYW46SFRNTEdlbmVyYXRvcjxIVE1MU3BhbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInNwYW5cIilcbmV4cG9ydCBjb25zdCB0ZXh0YXJlYTpIVE1MR2VuZXJhdG9yPEhUTUxUZXh0QXJlYUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRleHRhcmVhXCIpXG5cbmV4cG9ydCBjb25zdCBidXR0b246SFRNTEdlbmVyYXRvcjxIVE1MQnV0dG9uRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYnV0dG9uXCIpXG4vLyBleHBvcnQgY29uc3QgdGFibGUgPSAocm93czogSFRNTEFyZ1tdW10sIC4uLmFyZ3M6IEhUTUxBcmdbXSkgPT4gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpKCBzdHlsZSh7Ym9yZGVyU3BhY2luZzogXCIxZW0gLjRlbVwifSkgLCByb3dzLm1hcChjZWxscz0+dHIoY2VsbHMubWFwKGNlbGw9PnRkKGNlbGwpKSkpLCAuLi5hcmdzKVxuZXhwb3J0IGNvbnN0IHRhYmxlOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIilcblxuZXhwb3J0IGNvbnN0IHRyOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlUm93RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidHJcIilcbmV4cG9ydCBjb25zdCB0ZDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZFwiKVxuZXhwb3J0IGNvbnN0IHRoOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRoXCIpXG5leHBvcnQgY29uc3QgY2FudmFzOkhUTUxHZW5lcmF0b3I8SFRNTENhbnZhc0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImNhbnZhc1wiKVxuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSAoLi4ucnVsZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5bXSkgPT4gKHtzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgLi4ucnVsZXMpfSlcbmV4cG9ydCBjb25zdCBtYXJnaW4gPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe21hcmdpbjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHBhZGRpbmcgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3BhZGRpbmc6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXIgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlcjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlclJhZGl1cyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyUmFkaXVzOiB2YWx1ZX0pXG5leHBvcnQgY29uc3Qgd2lkdGggPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3dpZHRoOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgaGVpZ2h0ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtoZWlnaHQ6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBkaXNwbGF5ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtkaXNwbGF5OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYmFja2dyb3VuZCA9ICh2YWx1ZTogc3RyaW5nID0gXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiKSA9PiBzdHlsZSh7YmFja2dyb3VuZDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3QgaW5wdXQ6SFRNTEdlbmVyYXRvcjxIVE1MSW5wdXRFbGVtZW50PiA9ICguLi5jcyk9PntcbiAgY29uc3QgY29udGVudCA9IGNzLmZpbHRlcihjPT50eXBlb2YgYyA9PSAnc3RyaW5nJykuam9pbignICcpXG4gIGNvbnN0IGVsID0gaHRtbChcImlucHV0XCIsIC4uLmNzKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gIGVsLnZhbHVlID0gY29udGVudFxuICByZXR1cm4gZWxcbn1cblxuXG5leHBvcnQgY29uc3QgcG9wdXAgPSAoLi4uY3M6SFRNTEFyZ1tdKT0+e1xuICBjb25zdCBkaWFsb2dmaWVsZCA9IGRpdih7XG4gICAgc3R5bGU6IHtcbiAgICAgIGJhY2tncm91bmQ6IGNvbG9yLmJhY2tncm91bmQsXG4gICAgICBjb2xvcjogY29sb3IuY29sb3IsXG4gICAgICBwYWRkaW5nOiBcIjFlbSA0ZW1cIixcbiAgICAgIHBhZGRpbmdCb3R0b206IFwiMmVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMWVtXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgICAgb3ZlcmZsb3dZOiBcInNjcm9sbFwiLFxuICAgICAgbWluV2lkdGg6IFwiMjB2d1wiLFxuICAgICAgbWF4SGVpZ2h0OiBcIjgwdmhcIixcbiAgICB9fSxcbiAgICAuLi5jcylcblxuICBjb25zdCBwb3B1cGJhY2tncm91bmQgPSBkaXYoXG4gICAge3N0eWxlOntcbiAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICB0b3A6IFwiMFwiLFxuICAgICAgbGVmdDogXCIwXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJyZ2JhKDE2NiwgMTY2LCAxNjYsIDAuNSlcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICB9fVxuICApXG5cbiAgcG9wdXBiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKGRpYWxvZ2ZpZWxkKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwb3B1cGJhY2tncm91bmQpO1xuICBwb3B1cGJhY2tncm91bmQub25jbGljayA9ICgpID0+IHtwb3B1cGJhY2tncm91bmQucmVtb3ZlKCk7IH1cbiAgZGlhbG9nZmllbGQub25jbGljayA9IChlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICByZXR1cm4gcG9wdXBiYWNrZ3JvdW5kXG5cbn1cblxuZXhwb3J0IGNvbnN0IGVycm9ycG9wdXAgPSAoZTpFcnJvciB8IHN0cmluZykgPT57XG4gIHBvcHVwKGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOmNvbG9yLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6XCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgIHBhZGRpbmc6XCIxZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czpcIi40ZW1cIixcbiAgICAgIGNvbG9yOmNvbG9yLnJlZCxcbiAgICB9KSxcbiAgICBoMihcIkVycm9yXCIpLFxuICAgIHAoU3RyaW5nKGUpKVxuICApKVxuICB0aHJvdyAoZSBpbnN0YW5jZW9mIEVycm9yKSA/IGUgOiBuZXcgRXJyb3IoU3RyaW5nKGUpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFuZWxMaXN0KGl0ZW1zOiB7dGl0bGU6IEhUTUxBcmcsIGNvbnRlbnQ6IEhUTUxBcmd9W10pe1xuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgIGdhcDogXCIxZW1cIixcbiAgICB9KSxcbiAgICAuLi5pdGVtcy5tYXAoZj0+ZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuNGVtXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjVlbSAxZW1cIixcbiAgICAgIH0pLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgZm9udFdlaWdodDogXCJib2xkXCIsXG4gICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYudGl0bGVcbiAgICAgICksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBtYXJnaW5Ub3A6IFwiLjVlbVwiLFxuICAgICAgICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi5jb250ZW50XG4gICAgICApXG4gICAgKSlcbiAgKVxufVxuXG5cblxuXG4iLAogICAgIlxuaW1wb3J0IHsgY29tcGlsZSwgZnVuYywgcmV0LCBhcnJheSwgd2hpbGVMb29wLCBsb2NhbCwgbG9vcCB9IGZyb20gXCIuLi93YXNtXCI7XG5pbXBvcnQgeyBib2R5LCBwIH0gZnJvbSBcIi4vaHRtbFwiO1xuXG5cbmxldCBhcnIgPSBhcnJheShcImkzMlwiLCAxMDI0KVxuXG5leHBvcnQgY29uc3QgbW9kID0gYXdhaXQgY29tcGlsZSh7XG4gIGZvbyA6IGZ1bmMoW10sIFwiaTMyXCIsICgpPT5bXG4gICAgcmV0KDIyKVxuICBdKSxcbiAgZmlsbDogZnVuYyhbXCJpMzJcIl0sIFwiaTMyXCIsIG49PntcbiAgICBsZXQgeCA9IGxvY2FsLmkzMigpXG4gICAgcmV0dXJuIFtcbiAgICAgIGxvb3AoeC5sdChuKSwgW1xuICAgICAgICBhcnIuc3RvcmUoeCx4KSxcbiAgICAgICAgeC5pYWRkKDEpXG4gICAgICBdKSxcbiAgICAgIHJldChuKVxuICAgIF1cbiAgfSksXG4gIGFyclxufSwgeyBzaGFyZWQ6IHRydWUgfSlcblxuXG5cbnR5cGUgQXN5bmNGIDxGIGV4dGVuZHMgRnVuY3Rpb24+ID0gRiBleHRlbmRzICguLi5hcmdzOiBpbmZlciBBKT0+aW5mZXIgUiA/ICguLi5hcmdzOiBBKT0+UHJvbWlzZTxSPiA6IG5ldmVyXG50eXBlIE1vZEZ1bmNzID0ge1trZXkgaW4ga2V5b2YgdHlwZW9mIG1vZF0gOiB0eXBlb2YgbW9kW2tleV0gZXh0ZW5kcyBGdW5jdGlvbiA/IEFzeW5jRjx0eXBlb2YgbW9kW2tleV0+IDogbmV2ZXJ9XG5cbnR5cGUgV29ya2VyTWVzc2FnZSA9IHtcbiAgdGFnOiBcIm1vZHVsZVwiLFxuICBtb2Q6IFdlYkFzc2VtYmx5Lk1vZHVsZSxcbiAgbWVtb3J5OiBXZWJBc3NlbWJseS5NZW1vcnksXG59IHwge1xuICB0YWc6IFwiY2FsbFwiLFxuICBmdW5jOiBzdHJpbmcsXG4gIGFyZ3M6IGFueVtdLFxufVxuXG50eXBlIFJlc3BvbnNlTWVzc2FnZSA9IHtcbiAgdGFnOiBcInJlc3VsdFwiLFxuICByZXN1bHQ6IGFueVxufSB8IHtcbiAgdGFnOiBcImVycm9yXCIsXG4gIGVycm9yOiBzdHJpbmdcbn1cblxubGV0IFdva2VyQnVuZGxlTWFpbiA9ICgpID0+IHtcbiAgbGV0IGZ1bmNzIDogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKT0+YW55PiA9IHt9XG4gIG9ubWVzc2FnZSA9IGFzeW5jIChlKT0+e1xuICAgIGxldCBtc2cgPSBlLmRhdGEgYXMgV29ya2VyTWVzc2FnZVxuICAgIGlmIChtc2cudGFnID09IFwibW9kdWxlXCIpe1xuICAgICAgbGV0IGluc3RhbmNlID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUobXNnLm1vZCwgeyBlbnY6IHsgbWVtb3J5OiBtc2cubWVtb3J5IH0gfSlcbiAgICAgIGZ1bmNzID0gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKGluc3RhbmNlLmV4cG9ydHMpLmZpbHRlcigoWywgdl0pID0+IHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIpKSBhcyBSZWNvcmQ8c3RyaW5nLCAoLi4uYXJnczogYW55W10pPT5hbnk+XG4gICAgICBwb3N0TWVzc2FnZSh7dGFnOiBcInJlc3VsdFwiLCByZXN1bHQ6IDB9KVxuICAgIH1cbiAgICBpZiAobXNnLnRhZyA9PSBcImNhbGxcIil7XG4gICAgICBsZXQgZnVuYyA9IGZ1bmNzW21zZy5mdW5jXVxuICAgICAgaWYgKCFmdW5jKSByZXR1cm4gcG9zdE1lc3NhZ2Uoe3RhZzogXCJlcnJvclwiLCBlcnJvcjogYEZ1bmN0aW9uICR7bXNnLmZ1bmN9IG5vdCBmb3VuZGB9KVxuICAgICAgdHJ5e1xuICAgICAgICBsZXQgcmVzID0gZnVuYyguLi5tc2cuYXJncylcbiAgICAgICAgcG9zdE1lc3NhZ2Uoe3RhZzogXCJyZXN1bHRcIiwgcmVzdWx0OiByZXN9KVxuICAgICAgfWNhdGNoKGUpe1xuICAgICAgICBwb3N0TWVzc2FnZSh7dGFnOiBcImVycm9yXCIsIGVycm9yOiBTdHJpbmcoZSl9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5sZXQgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbYCgke1dva2VyQnVuZGxlTWFpbi50b1N0cmluZygpfSkoKWBdLCB7dHlwZTogXCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0XCJ9KSlcblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWtXb3JrZXIoKXtcbiAgaWYgKG1vZC5tZW1vcnkuYnVmZmVyIGluc3RhbmNlb2YgU2hhcmVkQXJyYXlCdWZmZXIgJiYgIXNlbGYuY3Jvc3NPcmlnaW5Jc29sYXRlZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiU2hhcmVkIHdhc20gd29ya2VycyByZXF1aXJlIGNyb3NzT3JpZ2luSXNvbGF0ZWQuIFNlcnZlIHRoZSBwYWdlIHdpdGggQ3Jvc3MtT3JpZ2luLU9wZW5lci1Qb2xpY3k6IHNhbWUtb3JpZ2luIGFuZCBDcm9zcy1PcmlnaW4tRW1iZWRkZXItUG9saWN5OiByZXF1aXJlLWNvcnAuXCJcbiAgICApXG4gIH1cblxuICBsZXQgd29ya2VyID0gbmV3IFdvcmtlcih1cmwpXG5cbiAgZnVuY3Rpb24gcG9zdChtc2c6IFdvcmtlck1lc3NhZ2Upe1xuICAgIHdvcmtlci5wb3N0TWVzc2FnZShtc2cpXG4gIH1cblxuICBsZXQgcmVzb2x2ZXIgOiAoKHg6bnVtYmVyKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXG5cbiAgd29ya2VyLm9ubWVzc2FnZSA9IChlKT0+e1xuICAgIGxldCBtc2cgPSBlLmRhdGEgYXMgUmVzcG9uc2VNZXNzYWdlXG4gICAgaWYgKG1zZy50YWcgPT0gXCJyZXN1bHRcIil7XG4gICAgICBpZiAoIXJlc29sdmVyKSB0aHJvdyBuZXcgRXJyb3IoXCJObyByZXNvbHZlciBzZXRcIilcbiAgICAgIHJlc29sdmVyKG1zZy5yZXN1bHQpXG4gICAgICByZXNvbHZlciA9IG51bGxcbiAgICB9XG4gICAgaWYgKG1zZy50YWcgPT0gXCJlcnJvclwiKSB0aHJvdyBuZXcgRXJyb3IobXNnLmVycm9yKVxuICB9XG5cbiAgbGV0IGNhbGwgPSAoZnVuYzogc3RyaW5nLCBhcmdzOiBhbnlbXSkgPT4ge1xuICAgIGlmIChyZXNvbHZlcikgdGhyb3cgbmV3IEVycm9yKFwiQWxyZWFkeSB3YWl0aW5nIGZvciBhIHJlc3VsdFwiKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxudW1iZXI+KChyZXNvbHZlKT0+e1xuICAgICAgcmVzb2x2ZXIgPSByZXNvbHZlXG4gICAgICBwb3N0KHt0YWc6IFwiY2FsbFwiLCBmdW5jLCBhcmdzfSlcbiAgICB9KVxuICB9XG5cbiAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlcyk9PntcbiAgICByZXNvbHZlciA9ICh4KT0+cmVzKClcbiAgICBwb3N0KHt0YWc6IFwibW9kdWxlXCIsIG1vZDogbW9kLm1vZCwgbWVtb3J5OiBtb2QubWVtb3J5fSlcbiAgfSlcblxuICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKE9iamVjdC5lbnRyaWVzKG1vZClcbiAgLmZpbHRlcigoW2ssdl0pPT4gdHlwZW9mIHYgPT0gXCJmdW5jdGlvblwiKVxuICAubWFwKChbayx2XSk9PltrLCAoLi4uYXJnczogYW55W10pPT5jYWxsKGssIGFyZ3MpXSkpIGFzIE1vZEZ1bmNzXG5cbn1cbiIsCiAgICAiaW1wb3J0IHsgYXJyYXksIGNvbXBpbGUsIGZ1bmMsIGkzMiwgbG9jYWwsIHJldCwgd2hpbGVMb29wIH0gZnJvbSBcIi4uL3dhc21cIjtcbmltcG9ydCB7IGJvZHksIGgyLCBwIH0gZnJvbSBcIi4vaHRtbFwiO1xuaW1wb3J0IHsgbWtXb3JrZXIsIG1vZCB9IGZyb20gXCIuL3BsYW5uZXJcIjtcblxuXG5jb25zdCB4cyA9IGFycmF5KFwiaTMyXCIsIDEwMjQpXG5jb25zdCB5cyA9IGFycmF5KFwiaTMyXCIsIDEwMjQpXG5jb25zdCBvdXQgPSBhcnJheShcImkzMlwiLCAxMDI0KVxuXG4vLyBjb25zdCBzdW1JbnRvID0gZnVuYyhbXCJpMzJcIl0sIFwiaTMyXCIsIG4gPT4ge1xuLy8gICBjb25zdCBpID0gbG9jYWwuaTMyKClcbi8vICAgcmV0dXJuIFtcbi8vICAgICBpLnNldCgwKSxcbi8vICAgICB3aGlsZUxvb3AoaS5sdChuKSwgW1xuLy8gICAgICAgb3V0LnN0b3JlKGksIHhzLmxvYWQoaSkuYWRkKHlzLmxvYWQoaSkpKSxcbi8vICAgICAgIGkuaWFkZCgxKSxcbi8vICAgICBdKSxcbi8vICAgICByZXQoMCksXG4vLyAgIF1cbi8vIH0pXG5cbi8vIGNvbnN0IG1vZCA9IGF3YWl0IGNvbXBpbGUoe1xuLy8gICBzdW1JbnRvLFxuLy8gICB4cyxcbi8vICAgeXMsXG4vLyAgIG91dCxcbi8vIH0pXG5cbi8vIGxldCBuPSA4XG5cbi8vIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4vLyAgIG1vZC54c1tpXSA9IGlcbi8vICAgbW9kLnlzW2ldID0gaSAqIDEwXG4vLyB9XG5cbi8vIGNvbnN0IHN0ID0gcGVyZm9ybWFuY2Uubm93KClcbi8vIG1vZC5zdW1JbnRvKG4pXG4vLyBjb25zdCBtcyA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RcblxuLy8gYm9keS5hcHBlbmQoXG4vLyAgIGgyKFwid2FzbSBhcnJheXNcIiksXG4vLyAgIHAoYHN1bUludG8oJHtufSkgaW4gJHttcy50b0ZpeGVkKDMpfSBtc2ApLFxuLy8gICBwKGBvdXQgPSAke0FycmF5LmZyb20obW9kLm91dC5zbGljZSgwLCBuKSkuam9pbihcIiwgXCIpfWApLFxuXG4vLyApXG5cblxubGV0IHcgPSBhd2FpdCBta1dvcmtlcigpXG5cbi8vIGNvbnNvbGUubG9nKGF3YWl0IHcuZm9vKCkpXG5cblxudy5maWxsKDgpXG5cbmxldCByZXMgPSBBcnJheS5mcm9tKG1vZC5hcnIuc2xpY2UoMCwxMCkpXG5cbmJvZHkucmVwbGFjZUNoaWxkcmVuKFxuICBoMihcIndhc20gd29ya2VyXCIpLFxuXG4gIHAocmVzLmpvaW4oXCIsIFwiKSksXG5cbilcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxJQUFNLFFBQVEsQ0FBQyxHQUFNLElBQU0sS0FBTSxLQUFNLEdBQU0sR0FBTSxHQUFNLENBQUk7QUFDN0QsSUFBTSxXQUFXLENBQUMsT0FBTyxPQUFPLE9BQU8sS0FBSztBQUM1QyxJQUFNLFNBQVMsQ0FBQyxPQUFPLE9BQU8sT0FBTyxLQUFLO0FBQzFDLElBQU0sU0FBUyxDQUFDLE1BQU0sTUFBTSxJQUFJO0FBd0hoQyxJQUFNLFFBQVE7QUFBQSxFQUNaLE1BQU0sRUFBRSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLElBQUs7QUFBQSxFQUNuRCxLQUFLO0FBQUEsSUFDSCxLQUFLLEVBQUUsS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxJQUFLO0FBQUEsSUFDbEQsS0FBSyxFQUFFLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssSUFBSztBQUFBLElBQ2xELEtBQUssRUFBRSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLElBQUs7QUFBQSxJQUNsRCxLQUFLLEVBQUUsS0FBSyxLQUFNLEtBQUssS0FB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
