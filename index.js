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
  let compiled = await WebAssembly.compile(emitModule(analysis).buffer);
  const wasm = await WebAssembly.instantiate(compiled);
  const exports = wasm.exports;
  const jsFuncs = Object.fromEntries(Object.keys(funcs).map((name) => [name, exports[name]]));
  const jsArrays = Object.entries(arrays).map(([name, arr]) => {
    const layout = layouts[arr.id];
    const Ctor = typedArrayCtor(arr.type);
    return [name, new Ctor(exports.__mem.buffer, layout.offset, arr.length)];
  });
  return Object.fromEntries([
    ...Object.entries(jsFuncs),
    ...jsArrays,
    ["mod", compiled]
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
var mod = await compile({
  foo: func([], "i32", () => [
    ret(33)
  ])
});
var WokerBundleMain = () => {
  let funcs = {};
  onmessage = async (e) => {
    let msg = e.data;
    if (msg.tag == "module") {
      let instance = await WebAssembly.instantiate(msg.mod);
      funcs = instance.exports;
      postMessage({ tag: "result", result: 0 });
    }
    if (msg.tag == "call") {
      let res = funcs[msg.func](...msg.args);
    }
  };
};
var url = URL.createObjectURL(new Blob([`(${WokerBundleMain.toString()})()`], { type: "application/javascript" }));
async function mkWorker() {
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
    post({ tag: "module", mod: mod.mod });
  });
  return Object.fromEntries(Object.entries(mod).filter(([k, v]) => typeof v == "function").map(([k, v]) => [k, (...args) => call(k, args)]));
}

// src/view/main.ts
var xs = array("i32", 1024);
var ys = array("i32", 1024);
var out = array("i32", 1024);
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
var mod2 = await compile({
  sumInto,
  xs,
  ys,
  out
});
var n = 8;
for (let i = 0;i < n; i++) {
  mod2.xs[i] = i;
  mod2.ys[i] = i * 10;
}
var st = performance.now();
mod2.sumInto(n);
var ms = performance.now() - st;
body.append(h2("wasm arrays"), p(`sumInto(${n}) in ${ms.toFixed(3)} ms`), p(`out = ${Array.from(mod2.out.slice(0, n)).join(", ")}`));
var w = await mkWorker();

//# debugId=9F28A8B97F7433C864756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3dhc20udHMiLCAic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9wbGFubmVyLnRzIiwgInNyYy92aWV3L21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiY29uc3QgbWFnaWMgPSBbMHgwMCwgMHg2MSwgMHg3MywgMHg2ZCwgMHgwMSwgMHgwMCwgMHgwMCwgMHgwMF1cbmNvbnN0IG51bVR5cGVzID0gW1wiaTMyXCIsIFwiaTY0XCIsIFwiZjMyXCIsIFwiZjY0XCJdIGFzIGNvbnN0XG5jb25zdCBiaW5PcHMgPSBbXCJhZGRcIiwgXCJzdWJcIiwgXCJtdWxcIiwgXCJkaXZcIl0gYXMgY29uc3RcbmNvbnN0IGNtcE9wcyA9IFtcImVxXCIsIFwibHRcIiwgXCJndFwiXSBhcyBjb25zdFxuXG5leHBvcnQgdHlwZSBOdW1UeXBlID0gXCJpMzJcIiB8IFwiaTY0XCIgfCBcImYzMlwiIHwgXCJmNjRcIlxuZXhwb3J0IHR5cGUgQmluT3AgPSBcImFkZFwiIHwgXCJzdWJcIiB8IFwibXVsXCIgfCBcImRpdlwiXG5leHBvcnQgdHlwZSBDbXBPcCA9IFwiZXFcIiB8IFwibHRcIiB8IFwiZ3RcIlxudHlwZSBWYWx1ZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBUIGV4dGVuZHMgXCJpNjRcIiA/IGJpZ2ludCA6IG51bWJlclxudHlwZSBUeXBlZEFycmF5Rm9yPFQgZXh0ZW5kcyBOdW1UeXBlPiA9XG4gIFQgZXh0ZW5kcyBcImkzMlwiID8gSW50MzJBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImk2NFwiID8gQmlnSW50NjRBcnJheSA6XG4gIFQgZXh0ZW5kcyBcImYzMlwiID8gRmxvYXQzMkFycmF5IDpcbiAgRmxvYXQ2NEFycmF5XG5cbmV4cG9ydCB0eXBlIEZ1bmNTaWc8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUmV0IGV4dGVuZHMgTnVtVHlwZT4gPSB7IHBhcmFtczogQXJncywgcmVzdWx0OiBSZXQgfVxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPiA6IG5ldmVyIH1cbnR5cGUgQXJnc1ZhbDxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8QXJnc1tLXT4gOiBuZXZlciB9XG5cbnR5cGUgQ29yZUV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID1cbiAgfCB7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogVCwgdmFsdWU6IFZhbHVlPFQ+IH1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGU6IFQsIGxvY2FsOiBudW1iZXIgfVxuICB8IHsga2luZDogXCJiaW5cIiwgdHlwZTogVCwgb3A6IEJpbk9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImNhbGxcIiwgdHlwZTogVCwgdGFyZ2V0OiBudW1iZXIsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcImlmXCIsIHR5cGU6IFQsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2U6IEV4cHI8VD4gfVxuICB8IHsga2luZDogXCJsb2FkXCIsIHR5cGU6IFQsIGFycmF5OiBudW1iZXIsIGluZGV4OiBFeHByPFwiaTMyXCI+IH1cbiAgfCAoVCBleHRlbmRzIFwiaTMyXCIgPyB7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogTnVtVHlwZSwgb3A6IENtcE9wLCBsZWZ0OiBFeHByPE51bVR5cGU+LCByaWdodDogRXhwcjxOdW1UeXBlPiB9IDogbmV2ZXIpXG5cbmV4cG9ydCB0eXBlIEV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID0gQ29yZUV4cHI8VD4gJiB7XG4gIGFkZChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIHN1YihyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIG11bChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIGRpdihyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIGVxKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbiAgbHQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxuICBndChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG59XG5cbmV4cG9ydCB0eXBlIFN0bXQgPVxuICB8IHsga2luZDogXCJsb2NhbC5zZXRcIiwgbG9jYWw6IG51bWJlciwgdHlwZTogTnVtVHlwZSwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheTogbnVtYmVyLCB0eXBlOiBOdW1UeXBlLCBpbmRleDogRXhwcjxcImkzMlwiPiwgdmFsdWU6IEV4cHI8TnVtVHlwZT4gfVxuICB8IHsga2luZDogXCJpZlwiLCBjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBTdG10W10sIGVsc2U6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImJsb2NrXCIsIGNvbnRyb2w6IG51bWJlciwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwibG9vcFwiLCBjb250cm9sOiBudW1iZXIsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIGJvZHk6IFN0bXRbXSB9XG4gIHwgeyBraW5kOiBcImJyZWFrXCIsIHRhcmdldDogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcImNvbnRpbnVlXCIsIHRhcmdldDogbnVtYmVyIHwgbnVsbCB9XG4gIHwgeyBraW5kOiBcInJldHVyblwiLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImV4cHJcIiwgZXhwcjogRXhwcjxOdW1UeXBlPiB9XG5cbmV4cG9ydCB0eXBlIEJsb2NrSGFuZGxlID0geyBraW5kOiBcImJsb2NrXCIsIGlkOiBudW1iZXIgfVxuZXhwb3J0IHR5cGUgTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBudW1iZXIgfVxudHlwZSBDb250cm9sSGFuZGxlID0gQmxvY2tIYW5kbGUgfCBMb29wSGFuZGxlXG5cbmV4cG9ydCB0eXBlIExvY2FsVmFyPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IHtcbiAgaWQ6IG51bWJlclxuICB0eXBlOiBUXG4gIGdldCgpOiBFeHByPFQ+XG4gIHNldCh2YWx1ZTogRXhwckxpa2U8VD4pOiBTdG10XG4gIGFkZChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIHN1YihyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIG11bChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIGRpdihyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFQ+XG4gIGVxKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbiAgbHQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxuICBndChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG4gIGlhZGQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogU3RtdFxuICBpc3ViKHJpZ2h0OiBFeHByTGlrZTxUPik6IFN0bXRcbiAgaW11bChyaWdodDogRXhwckxpa2U8VD4pOiBTdG10XG4gIGlkaXYocmlnaHQ6IEV4cHJMaWtlPFQ+KTogU3RtdFxufVxuXG5leHBvcnQgdHlwZSBBcnJheUhhbmRsZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICBpZDogbnVtYmVyXG4gIHR5cGU6IFRcbiAgbGVuZ3RoOiBudW1iZXJcbiAgbG9hZChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBFeHByPFQ+XG4gIHN0b3JlKGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgdmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdFxufVxuXG50eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPiB8IExvY2FsVmFyPFQ+XG50eXBlIFN0bXRCb2R5ID0gU3RtdCB8IFN0bXRbXVxudHlwZSBDb250cm9sQm9keTxIIGV4dGVuZHMgQ29udHJvbEhhbmRsZT4gPSBTdG10Qm9keSB8ICgoc2VsZjogSCkgPT4gU3RtdEJvZHkpXG50eXBlIEZ1bmNCb2R5PFIgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8Uj4gfCBTdG10IHwgU3RtdFtdXG5cbmV4cG9ydCB0eXBlIEZ1bmNIYW5kbGU8QSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIE51bVR5cGU+ID0gRnVuY1NpZzxBLCBSPiAmIHtcbiAga2luZDogXCJmdW5jXCJcbiAgaWQ6IG51bWJlclxuICBidWlsZD86ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+XG4gIGNhbGw6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gRXhwcjxSPlxufVxuXG50eXBlIEFueUZ1bmMgPSB7XG4gIGtpbmQ6IFwiZnVuY1wiXG4gIGlkOiBudW1iZXJcbiAgcGFyYW1zOiByZWFkb25seSBOdW1UeXBlW11cbiAgcmVzdWx0OiBOdW1UeXBlXG4gIGJ1aWxkPzogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8TnVtVHlwZT5cbiAgY2FsbDogKC4uLmFyZ3M6IGFueVtdKSA9PiBFeHByPE51bVR5cGU+XG59XG5cbnR5cGUgQW55QXJyYXkgPSB7XG4gIGtpbmQ6IFwiYXJyYXlcIlxuICBpZDogbnVtYmVyXG4gIHR5cGU6IE51bVR5cGVcbiAgbGVuZ3RoOiBudW1iZXJcbiAgbG9hZChpbmRleDogRXhwckxpa2U8XCJpMzJcIj4pOiBFeHByPE51bVR5cGU+XG4gIHN0b3JlKGluZGV4OiBFeHByTGlrZTxcImkzMlwiPiwgdmFsdWU6IEV4cHJMaWtlPE51bVR5cGU+KTogU3RtdFxufVxuXG50eXBlIE1vZHVsZURlZiA9IFJlY29yZDxzdHJpbmcsIEFueUZ1bmMgfCBBbnlBcnJheT5cbnR5cGUgRnVuY0RlZnM8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7IFtLIGluIGtleW9mIFQgYXMgVFtLXSBleHRlbmRzIEFueUZ1bmMgPyBLIDogbmV2ZXJdOiBFeHRyYWN0PFRbS10sIEFueUZ1bmM+IH1cbnR5cGUgQXJyYXlEZWZzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0geyBbSyBpbiBrZXlvZiBUIGFzIFRbS10gZXh0ZW5kcyBBbnlBcnJheSA/IEsgOiBuZXZlcl06IEV4dHJhY3Q8VFtLXSwgQW55QXJyYXk+IH1cbmV4cG9ydCB0eXBlIENvbXBpbGVSZXN1bHQ8VCBleHRlbmRzIE1vZHVsZURlZj4gPSB7XG4gIFtLIGluIGtleW9mIFRdOlxuICAgIFRbS10gZXh0ZW5kcyBBbnlGdW5jID8gKC4uLmFyZ3M6IEFyZ3NWYWw8VFtLXVtcInBhcmFtc1wiXT4pID0+IFZhbHVlPFRbS11bXCJyZXN1bHRcIl0+XG4gICAgOiBUW0tdIGV4dGVuZHMgQW55QXJyYXkgPyBUeXBlZEFycmF5Rm9yPFRbS11bXCJ0eXBlXCJdPlxuICAgIDogbmV2ZXJcbn0gJiB7XG4gIG1vZDogV2ViQXNzZW1ibHkuSW5zdGFuY2Vcbn1cblxuY29uc3QgY29kZXMgPSB7XG4gIHR5cGU6IHsgaTMyOiAweDdmLCBpNjQ6IDB4N2UsIGYzMjogMHg3ZCwgZjY0OiAweDdjIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4sXG4gIGJpbjoge1xuICAgIGFkZDogeyBpMzI6IDB4NmEsIGk2NDogMHg3YywgZjMyOiAweDkyLCBmNjQ6IDB4YTAgfSxcbiAgICBzdWI6IHsgaTMyOiAweDZiLCBpNjQ6IDB4N2QsIGYzMjogMHg5MywgZjY0OiAweGExIH0sXG4gICAgbXVsOiB7IGkzMjogMHg2YywgaTY0OiAweDdlLCBmMzI6IDB4OTQsIGY2NDogMHhhMiB9LFxuICAgIGRpdjogeyBpMzI6IDB4NmQsIGk2NDogMHg3ZiwgZjMyOiAweDk1LCBmNjQ6IDB4YTMgfSxcbiAgfSBhcyBSZWNvcmQ8QmluT3AsIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+PixcbiAgY21wOiB7XG4gICAgZXE6IHsgaTMyOiAweDQ2LCBpNjQ6IDB4NTEsIGYzMjogMHg1YiwgZjY0OiAweDYxIH0sXG4gICAgbHQ6IHsgaTMyOiAweDQ4LCBpNjQ6IDB4NTMsIGYzMjogMHg1ZCwgZjY0OiAweDYzIH0sXG4gICAgZ3Q6IHsgaTMyOiAweDRhLCBpNjQ6IDB4NTUsIGYzMjogMHg1ZSwgZjY0OiAweDY0IH0sXG4gIH0gYXMgUmVjb3JkPENtcE9wLCBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPj4sXG4gIGxvYWQ6IHsgaTMyOiAweDI4LCBpNjQ6IDB4MjksIGYzMjogMHgyYSwgZjY0OiAweDJiIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4sXG4gIHN0b3JlOiB7IGkzMjogMHgzNiwgaTY0OiAweDM3LCBmMzI6IDB4MzgsIGY2NDogMHgzOSB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICBieXRlczogeyBpMzI6IDQsIGk2NDogOCwgZjMyOiA0LCBmNjQ6IDggfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgYWxpZ246IHsgaTMyOiAyLCBpNjQ6IDMsIGYzMjogMiwgZjY0OiAzIH0gYXMgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4sXG59XG5cbmNvbnN0IHUzMiA9IChuOiBudW1iZXIpID0+IHtcbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pIHx8IG4gPCAwKSB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHVuc2lnbmVkIGludGVnZXIsIGdvdCAke259YClcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGRvIHtcbiAgICBsZXQgYnl0ZSA9IG4gJiAweDdmXG4gICAgbiA+Pj49IDdcbiAgICBpZiAobikgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgfSB3aGlsZSAobilcbiAgcmV0dXJuIG91dFxufVxuXG5jb25zdCBzTiA9ICh2YWx1ZTogbnVtYmVyIHwgYmlnaW50LCBiaXRzOiAzMiB8IDY0KSA9PiB7XG4gIGNvbnN0IG91dDogbnVtYmVyW10gPSBbXVxuICBsZXQgbiA9IGJpdHMgPT09IDMyID8gQmlnSW50KCh2YWx1ZSBhcyBudW1iZXIpIHwgMCkgOiBCaWdJbnQuYXNJbnROKDY0LCB2YWx1ZSBhcyBiaWdpbnQpXG4gIGZvciAoOzspIHtcbiAgICBsZXQgYnl0ZSA9IE51bWJlcihuICYgMHg3Zm4pXG4gICAgbiA+Pj0gN25cbiAgICBjb25zdCBkb25lID0gKG4gPT09IDBuICYmIChieXRlICYgMHg0MCkgPT09IDApIHx8IChuID09PSAtMW4gJiYgKGJ5dGUgJiAweDQwKSAhPT0gMClcbiAgICBpZiAoIWRvbmUpIGJ5dGUgfD0gMHg4MFxuICAgIG91dC5wdXNoKGJ5dGUpXG4gICAgaWYgKGRvbmUpIHJldHVybiBvdXRcbiAgfVxufVxuXG5jb25zdCBmTiA9ICh2YWx1ZTogbnVtYmVyLCBieXRlczogNCB8IDgpID0+IHtcbiAgY29uc3Qgb3V0ID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMpXG4gIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcob3V0LmJ1ZmZlcilcbiAgYnl0ZXMgPT09IDQgPyB2aWV3LnNldEZsb2F0MzIoMCwgdmFsdWUsIHRydWUpIDogdmlldy5zZXRGbG9hdDY0KDAsIHZhbHVlLCB0cnVlKVxuICByZXR1cm4gWy4uLm91dF1cbn1cblxuY29uc3Qgc3RyID0gKHM6IHN0cmluZykgPT4ge1xuICBjb25zdCBieXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzKVxuICByZXR1cm4gWy4uLnUzMihieXRlcy5sZW5ndGgpLCAuLi5ieXRlc11cbn1cblxuY29uc3Qgc2VjdGlvbiA9IChpZDogbnVtYmVyLCBwYXlsb2FkOiBudW1iZXJbXSkgPT4gW2lkLCAuLi51MzIocGF5bG9hZC5sZW5ndGgpLCAuLi5wYXlsb2FkXVxuY29uc3QgZmxhdE1hcCA9IDxULCBSPih4czogVFtdLCBmbjogKHg6IFQpID0+IFJbXSkgPT4geHMuZmxhdE1hcChmbilcbmNvbnN0IGRpZSA9ICh4OiB1bmtub3duKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdmFsdWU6ICR7U3RyaW5nKHgpfWApIH1cblxubGV0IG5leHRGdW5jSWQgPSAwXG5sZXQgbmV4dExvY2FsSWQgPSAwXG5sZXQgbmV4dEFycmF5SWQgPSAwXG5sZXQgbmV4dENvbnRyb2xJZCA9IDBcbmNvbnN0IGFycmF5UmVnaXN0cnkgPSBuZXcgTWFwPG51bWJlciwgQW55QXJyYXk+KClcblxuY29uc3QgaW5mZXJUeXBlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogRXhwckxpa2U8VD4pID0+XG4gICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgXCJ0eXBlXCIgaW4gdmFsdWUgPyB2YWx1ZS50eXBlIDogXCJpMzJcIikgYXMgVFxuXG5jb25zdCBhZGRFeHByT3BzID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihlOiBFeHByPFQ+KSA9PiB7XG4gIGZvciAoY29uc3Qgb3Agb2YgYmluT3BzKSBlW29wXSA9IHIgPT4gYmluKG9wLCBlLCByKSBhcyBFeHByPFQ+XG4gIGZvciAoY29uc3Qgb3Agb2YgY21wT3BzKSBlW29wXSA9IHIgPT4gY21wKG9wLCBlLCByKSBhcyBFeHByPFwiaTMyXCI+XG4gIHJldHVybiBlXG59XG5cbmNvbnN0IGV4cHIgPSA8VCBleHRlbmRzIE51bVR5cGU+KG5vZGU6IENvcmVFeHByPFQ+KTogRXhwcjxUPiA9PiB7XG4gIHJldHVybiBhZGRFeHByT3BzKG5vZGUgYXMgRXhwcjxUPilcbn1cblxuY29uc3QgbGl0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+IHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChcImtpbmRcIiBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlIGFzIEV4cHI8VD5cbiAgICBpZiAoXCJnZXRcIiBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlLmdldCgpXG4gIH1cbiAgcmV0dXJuIGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBWYWx1ZTxUPiB9KVxufVxuXG5jb25zdCBpc1N0bXQgPSAoeDogdW5rbm93bik6IHggaXMgU3RtdCA9PlxuICAhIXggJiYgdHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgXCJraW5kXCIgaW4geCAmJiAoXG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJsb2NhbC5zZXRcIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiYXJyYXkuc3RvcmVcIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiYmxvY2tcIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwibG9vcFwiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJicmVha1wiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJjb250aW51ZVwiIHx8XG4gICAgKHggYXMgU3RtdCkua2luZCA9PT0gXCJyZXR1cm5cIiB8fFxuICAgICh4IGFzIFN0bXQpLmtpbmQgPT09IFwiZXhwclwiIHx8XG4gICAgKCh4IGFzIFN0bXQpLmtpbmQgPT09IFwiaWZcIiAmJiBBcnJheS5pc0FycmF5KCh4IGFzIHsgdGhlbj86IHVua25vd24gfSkudGhlbikpXG4gIClcblxuY29uc3Qgc3RtdExpc3QgPSAoYm9keTogU3RtdEJvZHkpID0+IEFycmF5LmlzQXJyYXkoYm9keSkgPyBib2R5IDogW2JvZHldXG5jb25zdCBiaW5kU3RtdHMgPSAoYm9keTogU3RtdEJvZHksIGJyOiBudW1iZXIsIGxvb3A6IG51bWJlciB8IG51bGwpOiBTdG10W10gPT5cbiAgc3RtdExpc3QoYm9keSkubWFwKHMgPT4gYmluZFN0bXQocywgYnIsIGxvb3ApKVxuXG5jb25zdCBiaW5kU3RtdCA9IChzOiBTdG10LCBicjogbnVtYmVyLCBsb29wOiBudW1iZXIgfCBudWxsKTogU3RtdCA9PiB7XG4gIHN3aXRjaCAocy5raW5kKSB7XG4gICAgY2FzZSBcImlmXCI6IHJldHVybiB7IC4uLnMsIHRoZW46IGJpbmRTdG10cyhzLnRoZW4sIGJyLCBsb29wKSwgZWxzZTogYmluZFN0bXRzKHMuZWxzZSwgYnIsIGxvb3ApIH1cbiAgICBjYXNlIFwiYnJlYWtcIjogcmV0dXJuIHsgLi4ucywgdGFyZ2V0OiBzLnRhcmdldCA/PyBiciB9XG4gICAgY2FzZSBcImNvbnRpbnVlXCI6XG4gICAgICBpZiAocy50YXJnZXQgIT0gbnVsbCkgcmV0dXJuIHNcbiAgICAgIGlmIChsb29wID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcImNvbnRpbnVlVG8oKSB1c2VkIG91dHNpZGUgYSBsb29wXCIpXG4gICAgICByZXR1cm4geyAuLi5zLCB0YXJnZXQ6IGxvb3AgfVxuICAgIGRlZmF1bHQ6IHJldHVybiBzXG4gIH1cbn1cblxuY29uc3QgY29udHJvbEJvZHkgPSA8SCBleHRlbmRzIENvbnRyb2xIYW5kbGU+KHNlbGY6IEgsIGJvZHk6IENvbnRyb2xCb2R5PEg+KSA9PlxuICBiaW5kU3RtdHModHlwZW9mIGJvZHkgPT09IFwiZnVuY3Rpb25cIiA/IGJvZHkoc2VsZikgOiBib2R5LCBzZWxmLmlkLCBzZWxmLmtpbmQgPT09IFwibG9vcFwiID8gc2VsZi5pZCA6IG51bGwpXG5cbmNvbnN0IGJpbiA9IDxUIGV4dGVuZHMgTnVtVHlwZT4ob3A6IEJpbk9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHIoeyBraW5kOiBcImJpblwiLCB0eXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0KGxlZnQudHlwZSwgcmlnaHQpIH0pXG5cbmNvbnN0IGNtcCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4ob3A6IENtcE9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+XG4gIGV4cHIoeyBraW5kOiBcImNtcFwiLCB0eXBlOiBcImkzMlwiLCBpbnB1dFR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQobGVmdC50eXBlLCByaWdodCkgfSlcblxuY29uc3QgbG9jYWxFeHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCBsb2NhbDogbnVtYmVyKSA9PiBleHByKHsga2luZDogXCJsb2NhbC5nZXRcIiwgdHlwZSwgbG9jYWwgfSlcblxuY29uc3QgbWtMb2NhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IExvY2FsVmFyPFQ+ID0+IHtcbiAgY29uc3QgaWQgPSBuZXh0TG9jYWxJZCsrXG4gIGNvbnN0IGdldCA9ICgpID0+IGxvY2FsRXhwcih0eXBlLCBpZClcbiAgY29uc3Qgc2V0ID0gKHZhbHVlOiBFeHByTGlrZTxUPik6IFN0bXQgPT4gKHsga2luZDogXCJsb2NhbC5zZXRcIiwgbG9jYWw6IGlkLCB0eXBlLCB2YWx1ZTogbGl0KHR5cGUsIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+IH0pXG4gIGNvbnN0IG91dDogTG9jYWxWYXI8VD4gPSB7XG4gICAgaWQsIHR5cGUsIGdldCwgc2V0LFxuICAgIGFkZDogcmlnaHQgPT4gZ2V0KCkuYWRkKHJpZ2h0KSwgc3ViOiByaWdodCA9PiBnZXQoKS5zdWIocmlnaHQpLCBtdWw6IHJpZ2h0ID0+IGdldCgpLm11bChyaWdodCksIGRpdjogcmlnaHQgPT4gZ2V0KCkuZGl2KHJpZ2h0KSxcbiAgICBlcTogcmlnaHQgPT4gZ2V0KCkuZXEocmlnaHQpLCBsdDogcmlnaHQgPT4gZ2V0KCkubHQocmlnaHQpLCBndDogcmlnaHQgPT4gZ2V0KCkuZ3QocmlnaHQpLFxuICAgIGlhZGQ6IHJpZ2h0ID0+IHNldChnZXQoKS5hZGQocmlnaHQpKSwgaXN1YjogcmlnaHQgPT4gc2V0KGdldCgpLnN1YihyaWdodCkpLCBpbXVsOiByaWdodCA9PiBzZXQoZ2V0KCkubXVsKHJpZ2h0KSksIGlkaXY6IHJpZ2h0ID0+IHNldChnZXQoKS5kaXYocmlnaHQpKSxcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmNvbnN0IG1rSGFuZGxlID0gPEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBOdW1UeXBlPihcbiAgcGFyYW1zOiBBLFxuICByZXN1bHQ6IFIsXG4gIGJ1aWxkPzogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj4sXG4pOiBGdW5jSGFuZGxlPEEsIFI+ID0+IHtcbiAgY29uc3QgaWQgPSBuZXh0RnVuY0lkKytcbiAgcmV0dXJuIHtcbiAgICBraW5kOiBcImZ1bmNcIixcbiAgICBpZCwgcGFyYW1zLCByZXN1bHQsIGJ1aWxkLFxuICAgIGNhbGw6ICguLi5hcmdzOiBBcmdzRXhwcjxBPikgPT4gZXhwcih7IGtpbmQ6IFwiY2FsbFwiLCB0eXBlOiByZXN1bHQsIHRhcmdldDogaWQsIGFyZ3M6IGFyZ3MgYXMgRXhwcjxOdW1UeXBlPltdIH0pIGFzIEV4cHI8Uj4sXG4gIH1cbn1cblxuY29uc3QgbWtBcnJheSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCwgbGVuZ3RoOiBudW1iZXIpOiBBcnJheUhhbmRsZTxUPiA9PiB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihsZW5ndGgpIHx8IGxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXJyYXkgbGVuZ3RoICR7bGVuZ3RofWApXG4gIGNvbnN0IGlkID0gbmV4dEFycmF5SWQrK1xuICBjb25zdCBoYW5kbGU6IEFycmF5SGFuZGxlPFQ+ID0ge1xuICAgIGtpbmQ6IFwiYXJyYXlcIixcbiAgICBpZCwgdHlwZSwgbGVuZ3RoLFxuICAgIGxvYWQ6IGluZGV4ID0+IGV4cHIoeyBraW5kOiBcImxvYWRcIiwgdHlwZSwgYXJyYXk6IGlkLCBpbmRleDogbGl0KFwiaTMyXCIsIGluZGV4KSB9KSxcbiAgICBzdG9yZTogKGluZGV4LCB2YWx1ZSkgPT4gKHsga2luZDogXCJhcnJheS5zdG9yZVwiLCBhcnJheTogaWQsIHR5cGUsIGluZGV4OiBsaXQoXCJpMzJcIiwgaW5kZXgpLCB2YWx1ZTogbGl0KHR5cGUsIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+IH0pLFxuICB9XG4gIGFycmF5UmVnaXN0cnkuc2V0KGlkLCBoYW5kbGUgYXMgdW5rbm93biBhcyBBbnlBcnJheSlcbiAgcmV0dXJuIGhhbmRsZVxufVxuXG5leHBvcnQgY29uc3QgaTMyID0gKG46IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJpMzJcIiwgdmFsdWU6IG4gfSlcbmV4cG9ydCBjb25zdCBpNjQgPSAobjogYmlnaW50KSA9PiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBcImk2NFwiLCB2YWx1ZTogbiB9KVxuZXhwb3J0IGNvbnN0IGYzMiA9IChuOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFwiZjMyXCIsIHZhbHVlOiBuIH0pXG5leHBvcnQgY29uc3QgZjY0ID0gKG46IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJmNjRcIiwgdmFsdWU6IG4gfSlcblxuZXhwb3J0IGNvbnN0IGlmRWxzZSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4oY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZV86IEV4cHI8VD4pID0+XG4gIGV4cHIoeyBraW5kOiBcImlmXCIsIHR5cGU6IHRoZW4udHlwZSwgY29uZCwgdGhlbiwgZWxzZTogZWxzZV8gfSlcblxuZXhwb3J0IGNvbnN0IGFkZCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4oXCJhZGRcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3Qgc3ViID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihcInN1YlwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBtdWwgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKFwibXVsXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IGRpdiA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4oXCJkaXZcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3QgZXEgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gY21wKFwiZXFcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3QgbHQgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gY21wKFwibHRcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3QgZ3QgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gY21wKFwiZ3RcIiwgbGVmdCwgcmlnaHQpXG5cbmV4cG9ydCBjb25zdCBkZWNsYXJlID0gPGNvbnN0IEEgZXh0ZW5kcyByZWFkb25seSBOdW1UeXBlW10sIFIgZXh0ZW5kcyBOdW1UeXBlPihwYXJhbXM6IEEsIHJlc3VsdDogUikgPT4gbWtIYW5kbGUocGFyYW1zLCByZXN1bHQpXG5leHBvcnQgY29uc3QgZnVuYyA9IDxjb25zdCBBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4ocGFyYW1zOiBBLCByZXN1bHQ6IFIsIGJ1aWxkOiAoLi4uYXJnczogQXJnc0V4cHI8QT4pID0+IEZ1bmNCb2R5PFI+KSA9PlxuICBta0hhbmRsZShwYXJhbXMsIHJlc3VsdCwgYnVpbGQgYXMgKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj4pXG5leHBvcnQgY29uc3QgYXJyYXkgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyKSA9PiBta0FycmF5KHR5cGUsIGxlbmd0aClcblxuZXhwb3J0IGNvbnN0IGxvY2FsID0gT2JqZWN0LmZyb21FbnRyaWVzKG51bVR5cGVzLm1hcCh0eXBlID0+IFt0eXBlLCAoKSA9PiBta0xvY2FsKHR5cGUpXSkpIGFzIHsgW1QgaW4gTnVtVHlwZV06ICgpID0+IExvY2FsVmFyPFQ+IH1cblxuZXhwb3J0IGNvbnN0IHJldCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdCA9PiAoe1xuICBraW5kOiBcInJldHVyblwiLFxuICB2YWx1ZTogbGl0KGluZmVyVHlwZSh2YWx1ZSksIHZhbHVlKSBhcyBFeHByPE51bVR5cGU+LFxufSlcbmV4cG9ydCBjb25zdCBpZlN0bXQgPSAoY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdFtdLCBlbHNlXzogU3RtdFtdID0gW10pOiBTdG10ID0+ICh7IGtpbmQ6IFwiaWZcIiwgY29uZCwgdGhlbiwgZWxzZTogZWxzZV8gfSlcbmV4cG9ydCBjb25zdCBibG9jayA9IChib2R5OiBDb250cm9sQm9keTxCbG9ja0hhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogQmxvY2tIYW5kbGUgPSB7IGtpbmQ6IFwiYmxvY2tcIiwgaWQ6IG5leHRDb250cm9sSWQrKyB9XG4gIHJldHVybiB7IGtpbmQ6IFwiYmxvY2tcIiwgY29udHJvbDogc2VsZi5pZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuZXhwb3J0IGNvbnN0IGxvb3AgPSAoY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogQ29udHJvbEJvZHk8TG9vcEhhbmRsZT4pOiBTdG10ID0+IHtcbiAgY29uc3Qgc2VsZjogTG9vcEhhbmRsZSA9IHsga2luZDogXCJsb29wXCIsIGlkOiBuZXh0Q29udHJvbElkKysgfVxuICByZXR1cm4geyBraW5kOiBcImxvb3BcIiwgY29udHJvbDogc2VsZi5pZCwgY29uZCwgYm9keTogY29udHJvbEJvZHkoc2VsZiwgYm9keSkgfVxufVxuZXhwb3J0IGNvbnN0IHdoaWxlTG9vcCA9IGxvb3BcbmV4cG9ydCBjb25zdCBicmVha1RvID0gKHRhcmdldD86IENvbnRyb2xIYW5kbGUpOiBTdG10ID0+ICh7IGtpbmQ6IFwiYnJlYWtcIiwgdGFyZ2V0OiB0YXJnZXQ/LmlkID8/IG51bGwgfSlcbmV4cG9ydCBjb25zdCBjb250aW51ZVRvID0gKHRhcmdldD86IExvb3BIYW5kbGUpOiBTdG10ID0+ICh7IGtpbmQ6IFwiY29udGludWVcIiwgdGFyZ2V0OiB0YXJnZXQ/LmlkID8/IG51bGwgfSlcbmV4cG9ydCBjb25zdCBleHByU3RtdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBTdG10ID0+ICh7IGtpbmQ6IFwiZXhwclwiLCBleHByOiB2YWx1ZSBhcyBFeHByPE51bVR5cGU+IH0pXG5cbnR5cGUgQXJyYXlMYXlvdXQgPSB7IHR5cGU6IE51bVR5cGUsIGxlbmd0aDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciB9XG50eXBlIE1vZHVsZUFuYWx5c2lzPFQgZXh0ZW5kcyBNb2R1bGVEZWY+ID0ge1xuICBmdW5jczogRnVuY0RlZnM8VD5cbiAgYXJyYXlzOiBBcnJheURlZnM8VD5cbiAgZkVudHJpZXM6IFtrZXlvZiBGdW5jRGVmczxUPiAmIHN0cmluZywgRnVuY0RlZnM8VD5ba2V5b2YgRnVuY0RlZnM8VD5dXVtdXG4gIGJ1aWx0RnVuY3M6IEJ1aWx0RnVuY1tdXG4gIGZpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICBsYXlvdXRzOiBSZWNvcmQ8bnVtYmVyLCBBcnJheUxheW91dD5cbiAgcGFnZXM6IG51bWJlclxufVxuXG5jb25zdCB3YWxrRXhwciA9IChlOiBFeHByPE51bVR5cGU+LCBmbnM6IHtcbiAgbG9jYWw/OiAoaWQ6IG51bWJlciwgdHlwZTogTnVtVHlwZSkgPT4gdm9pZFxuICBhcnJheT86IChpZDogbnVtYmVyKSA9PiB2b2lkXG59KSA9PiB7XG4gIHN3aXRjaCAoZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6IHJldHVyblxuICAgIGNhc2UgXCJsb2NhbC5nZXRcIjogZm5zLmxvY2FsPy4oZS5sb2NhbCwgZS50eXBlKTsgcmV0dXJuXG4gICAgY2FzZSBcImJpblwiOlxuICAgIGNhc2UgXCJjbXBcIjpcbiAgICAgIHdhbGtFeHByKGUubGVmdCwgZm5zKTsgd2Fsa0V4cHIoZS5yaWdodCwgZm5zKTsgcmV0dXJuXG4gICAgY2FzZSBcImNhbGxcIjpcbiAgICAgIGUuYXJncy5mb3JFYWNoKGFyZyA9PiB3YWxrRXhwcihhcmcsIGZucykpOyByZXR1cm5cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHdhbGtFeHByKGUuY29uZCwgZm5zKTsgd2Fsa0V4cHIoZS50aGVuLCBmbnMpOyB3YWxrRXhwcihlLmVsc2UsIGZucyk7IHJldHVyblxuICAgIGNhc2UgXCJsb2FkXCI6XG4gICAgICBmbnMuYXJyYXk/LihlLmFycmF5KTsgd2Fsa0V4cHIoZS5pbmRleCwgZm5zKTsgcmV0dXJuXG4gICAgZGVmYXVsdDogZGllKGUpXG4gIH1cbn1cblxuY29uc3Qgd2Fsa1N0bXQgPSAoczogU3RtdCwgZm5zOiB7XG4gIGxvY2FsPzogKGlkOiBudW1iZXIsIHR5cGU6IE51bVR5cGUpID0+IHZvaWRcbiAgYXJyYXk/OiAoaWQ6IG51bWJlcikgPT4gdm9pZFxufSkgPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjogZm5zLmxvY2FsPy4ocy5sb2NhbCwgcy50eXBlKTsgd2Fsa0V4cHIocy52YWx1ZSwgZm5zKTsgcmV0dXJuXG4gICAgY2FzZSBcImFycmF5LnN0b3JlXCI6IGZucy5hcnJheT8uKHMuYXJyYXkpOyB3YWxrRXhwcihzLmluZGV4LCBmbnMpOyB3YWxrRXhwcihzLnZhbHVlLCBmbnMpOyByZXR1cm5cbiAgICBjYXNlIFwiaWZcIjogd2Fsa0V4cHIocy5jb25kLCBmbnMpOyBzLnRoZW4uZm9yRWFjaCh4ID0+IHdhbGtTdG10KHgsIGZucykpOyBzLmVsc2UuZm9yRWFjaCh4ID0+IHdhbGtTdG10KHgsIGZucykpOyByZXR1cm5cbiAgICBjYXNlIFwiYmxvY2tcIjogcy5ib2R5LmZvckVhY2goeCA9PiB3YWxrU3RtdCh4LCBmbnMpKTsgcmV0dXJuXG4gICAgY2FzZSBcImxvb3BcIjogd2Fsa0V4cHIocy5jb25kLCBmbnMpOyBzLmJvZHkuZm9yRWFjaCh4ID0+IHdhbGtTdG10KHgsIGZucykpOyByZXR1cm5cbiAgICBjYXNlIFwiYnJlYWtcIjpcbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJyZXR1cm5cIjogd2Fsa0V4cHIocy52YWx1ZSwgZm5zKTsgcmV0dXJuXG4gICAgY2FzZSBcImV4cHJcIjogd2Fsa0V4cHIocy5leHByLCBmbnMpOyByZXR1cm5cbiAgICBkZWZhdWx0OiBkaWUocylcbiAgfVxufVxuXG5jb25zdCBhZGRyID0gKGxheW91dDogQXJyYXlMYXlvdXQsIGluZGV4OiBFeHByPFwiaTMyXCI+KSA9PiBpbmRleC5tdWwoY29kZXMuYnl0ZXNbbGF5b3V0LnR5cGVdKS5hZGQobGF5b3V0Lm9mZnNldClcbmNvbnN0IG1lbWFyZyA9ICh0eXBlOiBOdW1UeXBlLCBvZmZzZXQgPSAwKSA9PiBbLi4udTMyKGNvZGVzLmFsaWduW3R5cGVdKSwgLi4udTMyKG9mZnNldCldXG5jb25zdCBjb25zdEkzMiA9IChlOiBFeHByPFwiaTMyXCI+KSA9PiBlLmtpbmQgPT09IFwiY29uc3RcIiA/IGUudmFsdWUgOiBudWxsXG5jb25zdCBjaGVja0FycmF5Qm91bmRzID0gKGxheW91dDogQXJyYXlMYXlvdXQsIGluZGV4OiBFeHByPFwiaTMyXCI+KSA9PiB7XG4gIGNvbnN0IG4gPSBjb25zdEkzMihpbmRleClcbiAgaWYgKG4gPT0gbnVsbCkgcmV0dXJuXG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCB8fCBuID49IGxheW91dC5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihgQXJyYXkgaW5kZXggJHtufSBvdXQgb2YgYm91bmRzIGZvciBsZW5ndGggJHtsYXlvdXQubGVuZ3RofWApXG59XG5cbmNvbnN0IGNvbXBpbGVFeHByID0gKGU6IEV4cHI8TnVtVHlwZT4sIGZpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPiwgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LCBhcnJheXM6IFJlY29yZDxudW1iZXIsIEFycmF5TGF5b3V0Pik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjpcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTMyXCIpIHJldHVybiBbMHg0MSwgLi4uc04oZS52YWx1ZSBhcyBudW1iZXIsIDMyKV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTY0XCIpIHJldHVybiBbMHg0MiwgLi4uc04oZS52YWx1ZSwgNjQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmMzJcIikgcmV0dXJuIFsweDQzLCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgNCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImY2NFwiKSByZXR1cm4gWzB4NDQsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA4KV1cbiAgICAgIHJldHVybiBkaWUoZSlcbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6XG4gICAgICByZXR1cm4gWzB4MjAsIC4uLnUzMihsaXhbZS5sb2NhbF0hKV1cbiAgICBjYXNlIFwiYmluXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCwgZml4LCBsaXgsIGFycmF5cyksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQsIGZpeCwgbGl4LCBhcnJheXMpLCBjb2Rlcy5iaW5bZS5vcF1bZS50eXBlXV1cbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCwgZml4LCBsaXgsIGFycmF5cyksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQsIGZpeCwgbGl4LCBhcnJheXMpLCBjb2Rlcy5jbXBbZS5vcF1bZS5pbnB1dFR5cGVdXVxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICBpZiAoZml4W2UudGFyZ2V0XSA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gZnVuY3Rpb24gJHtlLnRhcmdldH1gKVxuICAgICAgcmV0dXJuIFsuLi5mbGF0TWFwKGUuYXJncywgYXJnID0+IGNvbXBpbGVFeHByKGFyZywgZml4LCBsaXgsIGFycmF5cykpLCAweDEwLCAuLi51MzIoZml4W2UudGFyZ2V0XSEpXVxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmNvbmQsIGZpeCwgbGl4LCBhcnJheXMpLCAweDA0LCBjb2Rlcy50eXBlW2UudHlwZV0sIC4uLmNvbXBpbGVFeHByKGUudGhlbiwgZml4LCBsaXgsIGFycmF5cyksIDB4MDUsIC4uLmNvbXBpbGVFeHByKGUuZWxzZSwgZml4LCBsaXgsIGFycmF5cyksIDB4MGJdXG4gICAgY2FzZSBcImxvYWRcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzW2UuYXJyYXldXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7ZS5hcnJheX1gKVxuICAgICAgY2hlY2tBcnJheUJvdW5kcyhsYXlvdXQsIGUuaW5kZXgpXG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBlLmluZGV4KSwgZml4LCBsaXgsIGFycmF5cyksIGNvZGVzLmxvYWRbZS50eXBlXSwgLi4ubWVtYXJnKGUudHlwZSldXG4gICAgfVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGllKGUpXG4gIH1cbn1cblxudHlwZSBMYWJlbEZyYW1lID0geyBjb250cm9sPzogbnVtYmVyLCBraW5kPzogXCJicmVha1wiIHwgXCJjb250aW51ZVwiIH1cbmNvbnN0IGRlcHRoID0gKHN0YWNrOiBMYWJlbEZyYW1lW10sIGNvbnRyb2w6IG51bWJlciwga2luZDogTm9uTnVsbGFibGU8TGFiZWxGcmFtZVtcImtpbmRcIl0+KSA9PiB7XG4gIGNvbnN0IGkgPSBzdGFjay5maW5kSW5kZXgoeCA9PiB4LmNvbnRyb2wgPT09IGNvbnRyb2wgJiYgeC5raW5kID09PSBraW5kKVxuICBpZiAoaSA8IDApIHRocm93IG5ldyBFcnJvcihgVW5rbm93biAke2tpbmR9IHRhcmdldCAke2NvbnRyb2x9YClcbiAgcmV0dXJuIGlcbn1cblxuY29uc3QgY29tcGlsZVN0bXQgPSAoXG4gIHM6IFN0bXQsXG4gIGZpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPixcbiAgbGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+LFxuICBhcnJheXM6IFJlY29yZDxudW1iZXIsIEFycmF5TGF5b3V0PixcbiAgc3RhY2s6IExhYmVsRnJhbWVbXSA9IFtdLFxuKTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy52YWx1ZSwgZml4LCBsaXgsIGFycmF5cyksIDB4MjEsIC4uLnUzMihsaXhbcy5sb2NhbF0hKV1cbiAgICBjYXNlIFwiYXJyYXkuc3RvcmVcIjoge1xuICAgICAgY29uc3QgbGF5b3V0ID0gYXJyYXlzW3MuYXJyYXldXG4gICAgICBpZiAoIWxheW91dCkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7cy5hcnJheX1gKVxuICAgICAgY2hlY2tBcnJheUJvdW5kcyhsYXlvdXQsIHMuaW5kZXgpXG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGFkZHIobGF5b3V0LCBzLmluZGV4KSwgZml4LCBsaXgsIGFycmF5cyksIC4uLmNvbXBpbGVFeHByKHMudmFsdWUsIGZpeCwgbGl4LCBhcnJheXMpLCBjb2Rlcy5zdG9yZVtzLnR5cGVdLCAuLi5tZW1hcmcocy50eXBlKV1cbiAgICB9XG4gICAgY2FzZSBcImlmXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMuY29uZCwgZml4LCBsaXgsIGFycmF5cyksIDB4MDQsIDB4NDAsIC4uLmZsYXRNYXAocy50aGVuLCB4ID0+IGNvbXBpbGVTdG10KHgsIGZpeCwgbGl4LCBhcnJheXMsIFt7fSwgLi4uc3RhY2tdKSksIC4uLihzLmVsc2UubGVuZ3RoID8gWzB4MDUsIC4uLmZsYXRNYXAocy5lbHNlLCB4ID0+IGNvbXBpbGVTdG10KHgsIGZpeCwgbGl4LCBhcnJheXMsIFt7fSwgLi4uc3RhY2tdKSldIDogW10pLCAweDBiXVxuICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgcmV0dXJuIFsweDAyLCAweDQwLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBmaXgsIGxpeCwgYXJyYXlzLCBbeyBjb250cm9sOiBzLmNvbnRyb2wsIGtpbmQ6IFwiYnJlYWtcIiB9LCAuLi5zdGFja10pKSwgMHgwYl1cbiAgICBjYXNlIFwibG9vcFwiOlxuICAgICAgcmV0dXJuIFsweDAyLCAweDQwLCAweDAzLCAweDQwLCAuLi5jb21waWxlRXhwcihzLmNvbmQsIGZpeCwgbGl4LCBhcnJheXMpLCAweDQ1LCAweDBkLCAuLi51MzIoMSksIC4uLmZsYXRNYXAocy5ib2R5LCB4ID0+IGNvbXBpbGVTdG10KHgsIGZpeCwgbGl4LCBhcnJheXMsIFt7IGNvbnRyb2w6IHMuY29udHJvbCwga2luZDogXCJjb250aW51ZVwiIH0sIHsgY29udHJvbDogcy5jb250cm9sLCBraW5kOiBcImJyZWFrXCIgfSwgLi4uc3RhY2tdKSksIDB4MGMsIC4uLnUzMigwKSwgMHgwYiwgMHgwYl1cbiAgICBjYXNlIFwiYnJlYWtcIjpcbiAgICAgIGlmIChzLnRhcmdldCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJicmVha1RvKCkgdXNlZCBvdXRzaWRlIGEgYmxvY2sgb3IgbG9vcFwiKVxuICAgICAgcmV0dXJuIFsweDBjLCAuLi51MzIoZGVwdGgoc3RhY2ssIHMudGFyZ2V0LCBcImJyZWFrXCIpKV1cbiAgICBjYXNlIFwiY29udGludWVcIjpcbiAgICAgIGlmIChzLnRhcmdldCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJjb250aW51ZVRvKCkgdXNlZCBvdXRzaWRlIGEgbG9vcFwiKVxuICAgICAgcmV0dXJuIFsweDBjLCAuLi51MzIoZGVwdGgoc3RhY2ssIHMudGFyZ2V0LCBcImNvbnRpbnVlXCIpKV1cbiAgICBjYXNlIFwicmV0dXJuXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMudmFsdWUsIGZpeCwgbGl4LCBhcnJheXMpLCAweDBmXVxuICAgIGNhc2UgXCJleHByXCI6XG4gICAgICByZXR1cm4gWy4uLmNvbXBpbGVFeHByKHMuZXhwciwgZml4LCBsaXgsIGFycmF5cyksIDB4MWFdXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUocylcbiAgfVxufVxuXG5jb25zdCBhcnJheUxheW91dHMgPSAoZGVmczogUmVjb3JkPHN0cmluZywgQW55QXJyYXk+KSA9PiB7XG4gIGxldCBvZmZzZXQgPSAwXG4gIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyhkZWZzKSBhcyBbc3RyaW5nLCBBbnlBcnJheV1bXVxuICBjb25zdCBvdXQ6IFJlY29yZDxudW1iZXIsIEFycmF5TGF5b3V0PiA9IHt9XG4gIGZvciAoY29uc3QgWywgYXJyXSBvZiBlbnRyaWVzKSB7XG4gICAgb3V0W2Fyci5pZF0gPSB7IHR5cGU6IGFyci50eXBlLCBsZW5ndGg6IGFyci5sZW5ndGgsIG9mZnNldCB9XG4gICAgb2Zmc2V0ICs9IGFyci5sZW5ndGggKiBjb2Rlcy5ieXRlc1thcnIudHlwZV1cbiAgfVxuICByZXR1cm4geyBsYXlvdXRzOiBvdXQsIGJ5dGVzOiBvZmZzZXQsIGVudHJpZXMgfVxufVxuXG5jb25zdCBtb2R1bGVGdW5jcyA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQpID0+XG4gIE9iamVjdC5mcm9tRW50cmllcyhPYmplY3QuZW50cmllcyhtb2QpLmZpbHRlcigoWywgdl0pID0+IHYua2luZCA9PT0gXCJmdW5jXCIpKSBhcyBGdW5jRGVmczxUPlxuXG5jb25zdCBtb2R1bGVBcnJheXMgPSA8VCBleHRlbmRzIE1vZHVsZURlZj4obW9kOiBUKSA9PlxuICBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMobW9kKS5maWx0ZXIoKFssIHZdKSA9PiB2LmtpbmQgPT09IFwiYXJyYXlcIikpIGFzIEFycmF5RGVmczxUPlxuXG50eXBlIEJ1aWx0RnVuYyA9IHtcbiAgZnVuYzogQW55RnVuY1xuICBwYXJhbUlkczogbnVtYmVyW11cbiAgYnVpbHQ6IEZ1bmNCb2R5PE51bVR5cGU+XG59XG5cbmNvbnN0IGJ1aWxkRnVuYyA9IChmdW5jOiBBbnlGdW5jKTogQnVpbHRGdW5jID0+IHtcbiAgY29uc3QgcGFyYW1zID0gZnVuYy5wYXJhbXMubWFwKHR5cGUgPT4gbG9jYWxFeHByKHR5cGUsIG5leHRMb2NhbElkKyspKSBhcyBFeHByPE51bVR5cGU+W11cbiAgcmV0dXJuIHtcbiAgICBmdW5jLFxuICAgIHBhcmFtSWRzOiBwYXJhbXMubWFwKHAgPT4gcC5raW5kID09PSBcImxvY2FsLmdldFwiID8gcC5sb2NhbCA6IC0xKSxcbiAgICBidWlsdDogZnVuYy5idWlsZD8uKC4uLnBhcmFtcykgPz8gZGllKGBGdW5jdGlvbiAke2Z1bmMuaWR9IGhhcyBubyBpbXBsZW1lbnRhdGlvbmApLFxuICB9XG59XG5cbmNvbnN0IGRpc2NvdmVyZWRBcnJheXMgPSAoYnVpbHRGdW5jczogQnVpbHRGdW5jW10pID0+IHtcbiAgY29uc3QgdXNlZCA9IG5ldyBTZXQ8bnVtYmVyPigpXG4gIGZvciAoY29uc3QgeyBidWlsdCB9IG9mIGJ1aWx0RnVuY3MpIHtcbiAgICBjb25zdCBib2R5ID0gQXJyYXkuaXNBcnJheShidWlsdCkgPyBidWlsdCA6IGlzU3RtdChidWlsdCkgPyBbYnVpbHRdIDogbnVsbFxuICAgIGJvZHkgPyBib2R5LmZvckVhY2gocyA9PiB3YWxrU3RtdChzLCB7IGFycmF5OiBpZCA9PiB1c2VkLmFkZChpZCkgfSkpIDogd2Fsa0V4cHIoYnVpbHQgYXMgRXhwcjxOdW1UeXBlPiwgeyBhcnJheTogaWQgPT4gdXNlZC5hZGQoaWQpIH0pXG4gIH1cbiAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhbLi4udXNlZF0ubWFwKGlkID0+IHtcbiAgICBjb25zdCBhcnIgPSBhcnJheVJlZ2lzdHJ5LmdldChpZClcbiAgICBpZiAoIWFycikgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFycmF5ICR7aWR9YClcbiAgICByZXR1cm4gW1N0cmluZyhpZCksIGFycl1cbiAgfSkpIGFzIFJlY29yZDxzdHJpbmcsIEFueUFycmF5PlxufVxuXG5jb25zdCBhbmFseXplTW9kdWxlID0gPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KG1vZDogVCkgPT4ge1xuICBjb25zdCBmdW5jcyA9IG1vZHVsZUZ1bmNzKG1vZClcbiAgY29uc3QgYXJyYXlzID0gbW9kdWxlQXJyYXlzKG1vZClcbiAgY29uc3QgZkVudHJpZXMgPSBPYmplY3QuZW50cmllcyhmdW5jcykgYXMgW2tleW9mIEZ1bmNEZWZzPFQ+ICYgc3RyaW5nLCBGdW5jRGVmczxUPltrZXlvZiBGdW5jRGVmczxUPl1dW11cbiAgY29uc3QgYnVpbHRGdW5jcyA9IGZFbnRyaWVzLm1hcCgoWywgZnVuY10pID0+IGJ1aWxkRnVuYyhmdW5jKSlcbiAgY29uc3QgZml4ID0gT2JqZWN0LmZyb21FbnRyaWVzKGZFbnRyaWVzLm1hcCgoWywgZGVmXSwgaSkgPT4gW2RlZi5pZCwgaV0pKSBhcyBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+XG4gIGNvbnN0IHRvdWNoZWRBcnJheXMgPSBkaXNjb3ZlcmVkQXJyYXlzKGJ1aWx0RnVuY3MpXG4gIGNvbnN0IGFsbEFycmF5cyA9IHsgLi4udG91Y2hlZEFycmF5cywgLi4uYXJyYXlzIH0gYXMgUmVjb3JkPHN0cmluZywgQW55QXJyYXk+XG4gIGNvbnN0IHsgbGF5b3V0cywgYnl0ZXMgfSA9IGFycmF5TGF5b3V0cyhhbGxBcnJheXMpXG4gIHJldHVybiB7IGZ1bmNzLCBhcnJheXMsIGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIHBhZ2VzOiBNYXRoLm1heCgxLCBNYXRoLmNlaWwoYnl0ZXMgLyA2NTUzNikpIH0gYXMgTW9kdWxlQW5hbHlzaXM8VD5cbn1cblxuY29uc3QgZW1pdE1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPih7IGZFbnRyaWVzLCBidWlsdEZ1bmNzLCBmaXgsIGxheW91dHMsIHBhZ2VzIH06IE1vZHVsZUFuYWx5c2lzPFQ+KSA9PiB7XG4gIGNvbnN0IGZ1bmN0aW9uU2VjdGlvbiA9IGZFbnRyaWVzLmZsYXRNYXAoKF8sIGkpID0+IHUzMihpKSlcbiAgY29uc3QgZXhwb3J0U2VjdGlvbiA9IGZFbnRyaWVzLmZsYXRNYXAoKFtuYW1lXSwgaSkgPT4gWy4uLnN0cihuYW1lKSwgMHgwMCwgLi4udTMyKGkpXSlcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFtcbiAgICAuLi5tYWdpYyxcbiAgICAuLi5zZWN0aW9uKDB4MDEsIFsuLi51MzIoZkVudHJpZXMubGVuZ3RoKSwgLi4uZmxhdE1hcChmRW50cmllcywgKFssIGZdKSA9PiBbMHg2MCwgLi4udTMyKGYucGFyYW1zLmxlbmd0aCksIC4uLmYucGFyYW1zLm1hcCh0ID0+IGNvZGVzLnR5cGVbdF0pLCAweDAxLCBjb2Rlcy50eXBlW2YucmVzdWx0XV0pXSksXG4gICAgLi4uc2VjdGlvbigweDAzLCBbLi4udTMyKGZFbnRyaWVzLmxlbmd0aCksIC4uLmZ1bmN0aW9uU2VjdGlvbl0pLFxuICAgIC4uLnNlY3Rpb24oMHgwNSwgWzB4MDEsIDB4MDAsIC4uLnUzMihwYWdlcyldKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFtcbiAgICAgIC4uLnUzMihmRW50cmllcy5sZW5ndGggKyAxKSxcbiAgICAgIC4uLmV4cG9ydFNlY3Rpb24sXG4gICAgICAuLi5zdHIoXCJfX21lbVwiKSwgMHgwMiwgLi4udTMyKDApLFxuICAgIF0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgW1xuICAgICAgLi4udTMyKGZFbnRyaWVzLmxlbmd0aCksXG4gICAgICAuLi5mbGF0TWFwKGJ1aWx0RnVuY3MsICh7IGZ1bmMsIHBhcmFtSWRzLCBidWlsdCB9KSA9PiB7XG4gICAgICAgIGNvbnN0IGxvY2FscyA9IG5ldyBNYXA8bnVtYmVyLCBOdW1UeXBlPigpXG4gICAgICAgIGNvbnN0IHN0bXRzID0gQXJyYXkuaXNBcnJheShidWlsdCkgPyBidWlsdCA6IGlzU3RtdChidWlsdCkgPyBbYnVpbHRdIDogbnVsbFxuICAgICAgICBzdG10cyA/IHN0bXRzLmZvckVhY2gocyA9PiB3YWxrU3RtdChzLCB7IGxvY2FsOiAoaWQsIHR5cGUpID0+IGxvY2Fscy5zZXQoaWQsIHR5cGUpIH0pKSA6IHdhbGtFeHByKGJ1aWx0IGFzIEV4cHI8TnVtVHlwZT4sIHsgbG9jYWw6IChpZCwgdHlwZSkgPT4gbG9jYWxzLnNldChpZCwgdHlwZSkgfSlcbiAgICAgICAgcGFyYW1JZHMuZm9yRWFjaChpZCA9PiBsb2NhbHMuZGVsZXRlKGlkKSlcbiAgICAgICAgY29uc3QgbG9jYWxFbnRyaWVzID0gWy4uLmxvY2Fscy5lbnRyaWVzKCldXG4gICAgICAgIGNvbnN0IGxpeCA9IE9iamVjdC5mcm9tRW50cmllcyhbLi4ucGFyYW1JZHMubWFwKChpZCwgaSkgPT4gW2lkLCBpXSksIC4uLmxvY2FsRW50cmllcy5tYXAoKFtpZF0sIGkpID0+IFtpZCwgZnVuYy5wYXJhbXMubGVuZ3RoICsgaV0pXSkgYXMgUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICAgICAgICBjb25zdCBkZWNscyA9IFsuLi51MzIobG9jYWxFbnRyaWVzLmxlbmd0aCksIC4uLmZsYXRNYXAobG9jYWxFbnRyaWVzLCAoWywgdHlwZV0pID0+IFsuLi51MzIoMSksIGNvZGVzLnR5cGVbdHlwZV1dKV1cbiAgICAgICAgY29uc3QgY29kZSA9IHN0bXRzID8gZmxhdE1hcChzdG10cywgcyA9PiBjb21waWxlU3RtdChzLCBmaXgsIGxpeCwgbGF5b3V0cykpIDogY29tcGlsZUV4cHIoYnVpbHQgYXMgRXhwcjxOdW1UeXBlPiwgZml4LCBsaXgsIGxheW91dHMpXG4gICAgICAgIGNvbnN0IGJvZHkgPSBbLi4uZGVjbHMsIC4uLmNvZGUsIDB4MGJdXG4gICAgICAgIHJldHVybiBbLi4udTMyKGJvZHkubGVuZ3RoKSwgLi4uYm9keV1cbiAgICAgIH0pLFxuICAgIF0pLFxuICBdKVxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZU1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmPihtb2Q6IFQpID0+IGVtaXRNb2R1bGUoYW5hbHl6ZU1vZHVsZShtb2QpKVxuXG5jb25zdCB0eXBlZEFycmF5Q3RvciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IHsgbmV3KGJ1ZmZlcjogQXJyYXlCdWZmZXJMaWtlLCBieXRlT2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKTogVHlwZWRBcnJheUZvcjxUPiB9ID0+IHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBcImkzMlwiOiByZXR1cm4gSW50MzJBcnJheSBhcyBhbnlcbiAgICBjYXNlIFwiaTY0XCI6IHJldHVybiBCaWdJbnQ2NEFycmF5IGFzIGFueVxuICAgIGNhc2UgXCJmMzJcIjogcmV0dXJuIEZsb2F0MzJBcnJheSBhcyBhbnlcbiAgICBjYXNlIFwiZjY0XCI6IHJldHVybiBGbG9hdDY0QXJyYXkgYXMgYW55XG4gICAgZGVmYXVsdDogcmV0dXJuIGRpZSh0eXBlKVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb21waWxlID0gYXN5bmMgPFQgZXh0ZW5kcyBNb2R1bGVEZWY+KG1vZDogVCk6IFByb21pc2U8Q29tcGlsZVJlc3VsdDxUPj4gPT4ge1xuICBjb25zdCBhbmFseXNpcyA9IGFuYWx5emVNb2R1bGUobW9kKVxuICBjb25zdCB7IGZ1bmNzLCBhcnJheXMsIGxheW91dHMgfSA9IGFuYWx5c2lzXG4gIGxldCBjb21waWxlZCA9IGF3YWl0IFdlYkFzc2VtYmx5LmNvbXBpbGUoZW1pdE1vZHVsZShhbmFseXNpcykuYnVmZmVyKVxuICBjb25zdCB3YXNtID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoY29tcGlsZWQpXG4gIGNvbnN0IGV4cG9ydHMgPSB3YXNtLmV4cG9ydHMgYXMgV2ViQXNzZW1ibHkuRXhwb3J0cyAmIHsgX19tZW06IFdlYkFzc2VtYmx5Lk1lbW9yeSB9XG4gIGNvbnN0IGpzRnVuY3MgPSBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmtleXMoZnVuY3MpLm1hcChuYW1lID0+IFtuYW1lLCBleHBvcnRzW25hbWVdXSkpXG4gIGNvbnN0IGpzQXJyYXlzID0gKE9iamVjdC5lbnRyaWVzKGFycmF5cykgYXMgW3N0cmluZywgQW55QXJyYXldW10pLm1hcCgoW25hbWUsIGFycl0pID0+IHtcbiAgICBjb25zdCBsYXlvdXQgPSBsYXlvdXRzW2Fyci5pZF0hXG4gICAgY29uc3QgQ3RvciA9IHR5cGVkQXJyYXlDdG9yKGFyci50eXBlKVxuICAgIHJldHVybiBbbmFtZSwgbmV3IEN0b3IoZXhwb3J0cy5fX21lbS5idWZmZXIsIGxheW91dC5vZmZzZXQsIGFyci5sZW5ndGgpXSBhcyBjb25zdFxuICB9KVxuICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKFtcbiAgICAuLi5PYmplY3QuZW50cmllcyhqc0Z1bmNzKSxcbiAgICAuLi5qc0FycmF5cyxcbiAgICBbXCJtb2RcIiwgY29tcGlsZWRdXG4gIF0pIGFzIENvbXBpbGVSZXN1bHQ8VD5cbn1cbiIsCiAgICAiXG5pbXBvcnQgdHlwZSB7IEpzb25EYXRhIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuZXhwb3J0IGNvbnN0IGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG5jb25zdCBjb2xvclBhbGV0dGUgPSB7XG4gIGxpZ2h0OntcbiAgICBjb2xvcjogICAgICAgICAgICAgXCIjMDAwXCIsXG4gICAgYmFja2dyb3VuZDogICAgICAgIFwiI2ZmZlwiLFxuICAgIHJlZDogICAgICAgICAgICAgICBcInJnYigyNDIsIDU1LCA1NSlcIixcbiAgICBncmVlbjogICAgICAgICAgICAgXCJyZ2IoNTcsIDIxNCwgMzkpXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDUsIDI4LCAxNDEpXCIsXG4gICAgbGlnaHRibHVlOiAgICAgICAgIFwicmdiKDIxLCAxMzcsIDIzOSlcIixcbiAgICBncmF5OiAgICAgICAgICAgICAgXCIjODg4XCIsXG4gICAgbGlnaHRncmF5OiAgICAgICAgIFwiI2U1ZTVlNVwiLFxuICB9LFxuICBkYXJrOntcbiAgICBjb2xvcjogICAgICAgICAgICAgXCIjZmZmXCIsXG4gICAgYmFja2dyb3VuZDogICAgICAgIFwiIzIyMlwiLFxuICAgIHJlZDogICAgICAgICAgICAgICBcInJnYigxOTgsIDIwLCAwKVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig5NSwgMTU5LCAyNTUpXCIsXG4gICAgbGlnaHRibHVlOiAgICAgICAgIFwicmdiKDk1LCAxMDAsIDI1NSlcIixcbiAgICBncmVlbjogICAgICAgICAgICAgXCJyZ2IoMCwgMTg1LCAxOSlcIixcbiAgICBncmF5OiAgICAgICAgICAgICAgXCIjNTY1NjU2XCIsXG4gICAgbGlnaHRncmF5OiAgICAgICAgIFwiIzQxNDE0MVwiLFxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjb2xvciA9IHtcbiAgY29sb3I6IFwidmFyKC0tY29sb3IpXCIsXG4gIGJhY2tncm91bmQ6IFwidmFyKC0tYmFja2dyb3VuZClcIixcbiAgYmx1ZTogXCJ2YXIoLS1ibHVlKVwiLFxuICBsaWdodEJsdWU6IFwidmFyKC0tbGlnaHRibHVlKVwiLFxuICByZWQ6IFwidmFyKC0tcmVkKVwiLFxuICBncmVlbjogXCJ2YXIoLS1ncmVlbilcIixcbiAgZ3JheTogXCJ2YXIoLS1ncmF5KVwiLFxuICBsaWdodGdyYXk6IFwidmFyKC0tbGlnaHRncmF5KVwiXG59XG5cblxubGV0IHN0eWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIilcbnN0eWwuaW5uZXJIVE1MID0gYFxuOnJvb3Qge1xuICAtLWNvbG9yOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmNvbG9yfTtcbiAgLS1iYWNrZ3JvdW5kOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmJhY2tncm91bmR9O1xuICAtLXJlZDogJHtjb2xvclBhbGV0dGUuZGFyay5yZWR9O1xuICAtLWdyZWVuOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyZWVufTtcbiAgLS1ibHVlOiAke2NvbG9yUGFsZXR0ZS5kYXJrLmJsdWV9O1xuICAtLWdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JheX07XG4gIC0tbGlnaHRncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmxpZ2h0Z3JheX07XG4gIGNvbG9yOiB2YXIoLS1jb2xvcik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQpO1xuICBmb250LWZhbWlseTogc2Fucy1zZXJpZjtcbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIDpyb290IHtcbiAgICAtLWNvbG9yOiAke2NvbG9yUGFsZXR0ZS5saWdodC5jb2xvcn07XG4gICAgLS1iYWNrZ3JvdW5kOiAke2NvbG9yUGFsZXR0ZS5saWdodC5iYWNrZ3JvdW5kfTtcbiAgICAtLXJlZDogJHtjb2xvclBhbGV0dGUubGlnaHQucmVkfTtcbiAgICAtLWdyZWVuOiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmVlbn07XG4gICAgLS1ibHVlOiAke2NvbG9yUGFsZXR0ZS5saWdodC5ibHVlfTtcbiAgICAtLWdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyYXl9O1xuICAgIC0tbGlnaHRncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5saWdodGdyYXl9O1xuICB9XG59XG5gXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWwpXG5cbmV4cG9ydCB0eXBlIGh0bWxLZXkgPSAnaW5uZXJUZXh0J3wnb25jbGljaycgfCAnb25pbnB1dCcgfCAnb25rZXlkb3duJyB8ICdvbm1vdXNlZW50ZXInIHwgJ29ubW91c2VvdmVyJyB8ICdvbm1vdXNlZXhpdCcgfCdjaGlsZHJlbid8J2NsYXNzJ3wnaWQnfCdjb250ZW50RWRpdGFibGUnfCdldmVudExpc3RlbmVycyd8J2NvbG9yJ3wnYmFja2dyb3VuZCcgfCAnc3R5bGUnIHwgJ3BsYWNlaG9sZGVyJyB8ICd0YWJJbmRleCcgfCAnY29sU3BhbicgfCAndHlwZSdcbmV4cG9ydCBjb25zdCBodG1sRWxlbWVudCA9ICh0YWc6c3RyaW5nLCB0ZXh0OnN0cmluZywgYXJncz86UGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4pOkhUTUxFbGVtZW50ID0+e1xuXG4gIGNvbnN0IF9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpXG4gIF9lbGVtZW50LnRleHRDb250ZW50ID0gdGV4dFxuICBsZXQgc3QgPSBfZWxlbWVudC5zdHlsZVxuICBpZiAodGFnID09IFwiYnV0dG9uXCIpe1xuICAgIF9lbGVtZW50LmlubmVyVGV4dCA9IHRleHRcbiAgICBzdC5jb2xvciA9IGNvbG9yLmNvbG9yXG4gICAgc3QuYmFja2dyb3VuZENvbG9yID0gY29sb3IubGlnaHRncmF5XG4gICAgc3QuYm9yZGVyID0gXCIxcHggc29saWQgXCIrY29sb3IuZ3JheVxuICAgIHN0LmJvcmRlclJhZGl1cyA9IFwiLjJlbVwiXG4gICAgc3QucGFkZGluZyA9IFwiLjFlbSAuNGVtXCJcbiAgICBzdC5tYXJnaW4gPSBcIi4yZW1cIlxuICB9XG4gIGlmIChhcmdzKSBPYmplY3QuZW50cmllcyhhcmdzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pPT57XG4gICAgaWYgKGtleSA9PT0gJ3BhcmVudCcpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChfZWxlbWVudClcbiAgICB9XG4gICAgaWYgKGtleT09PSdjaGlsZHJlbicpe1xuICAgICAgKHZhbHVlIGFzIEhUTUxFbGVtZW50W10pLmZvckVhY2goYz0+X2VsZW1lbnQuYXBwZW5kQ2hpbGQoYykpXG4gICAgfWVsc2UgaWYgKGtleT09PSdldmVudExpc3RlbmVycycpe1xuICAgICAgT2JqZWN0LmVudHJpZXModmFsdWUgYXMgUmVjb3JkPHN0cmluZywgKGU6RXZlbnQpPT52b2lkPikuZm9yRWFjaCgoW2V2ZW50LCBsaXN0ZW5lcl0pPT57XG4gICAgICAgIF9lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKVxuICAgICAgfSlcbiAgICB9ZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKXtcbiAgICAgIE9iamVjdC5hc3NpZ24oX2VsZW1lbnQuc3R5bGUsIHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4pXG4gICAgfWVsc2V7XG4gICAgICBfZWxlbWVudFsoa2V5IGFzICdpbm5lclRleHQnIHwgJ29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ2lkJyB8ICdjb250ZW50RWRpdGFibGUnKV0gPSB2YWx1ZVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIF9lbGVtZW50XG59XG5cbmV4cG9ydCB0eXBlIEhUTUxBcmcgPSBzdHJpbmcgfCBudW1iZXIgfCBIVE1MRWxlbWVudCB8IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ICB8IFByb21pc2U8SFRNTEFyZz4gfCBIVE1MQXJnW10gfCBGdW5jdGlvblxuZXhwb3J0IGNvbnN0IGh0bWwgPSAodGFnOnN0cmluZywgLi4uY3M6SFRNTEFyZ1tdKTpIVE1MRWxlbWVudD0+e1xuICBsZXQgY2hpbGRyZW46IEhUTUxFbGVtZW50W10gPSBbXVxuICBsZXQgYXJnczogUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gPSB7fVxuXG4gIGNvbnN0IGFkZF9hcmcgPSAoYXJnOkhUTUxBcmcpPT57XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcpKVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSBjaGlsZHJlbi5wdXNoKGh0bWxFbGVtZW50KFwic3BhblwiLCBhcmcudG9TdHJpbmcoKSkpXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgUHJvbWlzZSl7XG4gICAgICBjb25zdCBlbCA9IHNwYW4oXCIuLi5cIilcbiAgICAgIGFyZy50aGVuKCh2YWx1ZSk9PntcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBlbC5hcHBlbmRDaGlsZChzcGFuKHZhbHVlKSlcbiAgICAgIH0pXG4gICAgICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIH1cbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgY2hpbGRyZW4ucHVzaChhcmcpXG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSBhcmcuZm9yRWFjaCh4PT5hZGRfYXJnKHgpKVxuICAgIC8vIGVsc2UgaWYgKCdnZXQnIGluIGFyZyAmJiB0eXBlb2YgYXJnLmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vICAgY29uc3QgZWwgPSBzcGFuKClcbiAgICAvLyAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgLy8gICBpZiAoJ29udXBkYXRlJyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5vbnVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJykgYXJnLm9udXBkYXRlKHg9PmVsLnJlcGxhY2VDaGlsZHJlbih4KSlcbiAgICAvLyB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PSBcImZ1bmN0aW9uXCIpe1xuICAgICAgaWYgKGFyZy5uYW1lID09IFwib25pbnB1dFwiKSBhcmdzLm9uaW5wdXQgPSBhcmdcbiAgICAgIGVsc2UgaWYgKGFyZy5uYW1lID09IFwib25jbGlja1wiIHx8IGFyZy5sZW5ndGggPCAyKSBhcmdzLm9uY2xpY2sgPSBhcmdcbiAgICAgIGVsc2UgY29uc29sZS53YXJuKFwiRnVuY3Rpb24gYXJndW1lbnQgd2l0aG91dCBuYW1lIG9yIHdpdGggbW9yZSB0aGFuIG9uZSBwYXJhbWV0ZXIgaXMgaWdub3JlZCBpbiBodG1sIGdlbmVyYXRvclwiKVxuICAgIH1cbiAgICBlbHNlIGFyZ3MgPSB7Li4uYXJncywgLi4uYXJnfVxuICB9XG4gIGNzLmZvckVhY2goYWRkX2FyZylcbiAgcmV0dXJuIGh0bWxFbGVtZW50KHRhZywgXCJcIiwgey4uLmFyZ3MsIGNoaWxkcmVufSlcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEdlbmVyYXRvcjxUIGV4dGVuZHMgSFRNTEVsZW1lbnQgPSBIVE1MRWxlbWVudD4gPSAoLi4uY3M6SFRNTEFyZ1tdKSA9PiBUXG5jb25zdCBuZXdIdG1sR2VuZXJhdG9yID0gPFQgZXh0ZW5kcyBIVE1MRWxlbWVudD4odGFnOnN0cmluZyk9PiguLi5jczpIVE1MQXJnW10pOlQ9Pmh0bWwodGFnLCAuLi5jcykgYXMgVFxuXG5leHBvcnQgY29uc3QgcDpIVE1MR2VuZXJhdG9yPEhUTUxQYXJhZ3JhcGhFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwXCIpXG5leHBvcnQgY29uc3QgYTpIVE1MR2VuZXJhdG9yPEhUTUxBbmNob3JFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJhXCIpXG5leHBvcnQgY29uc3QgaDE6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgxXCIpXG5leHBvcnQgY29uc3QgaDI6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgyXCIpXG5leHBvcnQgY29uc3QgaDM6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImgzXCIpXG5leHBvcnQgY29uc3QgaDQ6SFRNTEdlbmVyYXRvcjxIVE1MSGVhZGluZ0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImg0XCIpXG5cbmV4cG9ydCBjb25zdCBkaXY6SFRNTEdlbmVyYXRvcjxIVE1MRGl2RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiZGl2XCIpXG5leHBvcnQgY29uc3QgcHJlOkhUTUxHZW5lcmF0b3I8SFRNTFByZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInByZVwiKVxuZXhwb3J0IGNvbnN0IHNwYW46SFRNTEdlbmVyYXRvcjxIVE1MU3BhbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInNwYW5cIilcbmV4cG9ydCBjb25zdCB0ZXh0YXJlYTpIVE1MR2VuZXJhdG9yPEhUTUxUZXh0QXJlYUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRleHRhcmVhXCIpXG5cbmV4cG9ydCBjb25zdCBidXR0b246SFRNTEdlbmVyYXRvcjxIVE1MQnV0dG9uRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYnV0dG9uXCIpXG4vLyBleHBvcnQgY29uc3QgdGFibGUgPSAocm93czogSFRNTEFyZ1tdW10sIC4uLmFyZ3M6IEhUTUxBcmdbXSkgPT4gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpKCBzdHlsZSh7Ym9yZGVyU3BhY2luZzogXCIxZW0gLjRlbVwifSkgLCByb3dzLm1hcChjZWxscz0+dHIoY2VsbHMubWFwKGNlbGw9PnRkKGNlbGwpKSkpLCAuLi5hcmdzKVxuZXhwb3J0IGNvbnN0IHRhYmxlOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIilcblxuZXhwb3J0IGNvbnN0IHRyOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlUm93RWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidHJcIilcbmV4cG9ydCBjb25zdCB0ZDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZFwiKVxuZXhwb3J0IGNvbnN0IHRoOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRoXCIpXG5leHBvcnQgY29uc3QgY2FudmFzOkhUTUxHZW5lcmF0b3I8SFRNTENhbnZhc0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImNhbnZhc1wiKVxuXG5leHBvcnQgY29uc3Qgc3R5bGUgPSAoLi4ucnVsZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5bXSkgPT4gKHtzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgLi4ucnVsZXMpfSlcbmV4cG9ydCBjb25zdCBtYXJnaW4gPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe21hcmdpbjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHBhZGRpbmcgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3BhZGRpbmc6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXIgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlcjogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlclJhZGl1cyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyUmFkaXVzOiB2YWx1ZX0pXG5leHBvcnQgY29uc3Qgd2lkdGggPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe3dpZHRoOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgaGVpZ2h0ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtoZWlnaHQ6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBkaXNwbGF5ID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtkaXNwbGF5OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYmFja2dyb3VuZCA9ICh2YWx1ZTogc3RyaW5nID0gXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiKSA9PiBzdHlsZSh7YmFja2dyb3VuZDogdmFsdWV9KVxuXG5leHBvcnQgY29uc3QgaW5wdXQ6SFRNTEdlbmVyYXRvcjxIVE1MSW5wdXRFbGVtZW50PiA9ICguLi5jcyk9PntcbiAgY29uc3QgY29udGVudCA9IGNzLmZpbHRlcihjPT50eXBlb2YgYyA9PSAnc3RyaW5nJykuam9pbignICcpXG4gIGNvbnN0IGVsID0gaHRtbChcImlucHV0XCIsIC4uLmNzKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gIGVsLnZhbHVlID0gY29udGVudFxuICByZXR1cm4gZWxcbn1cblxuXG5leHBvcnQgY29uc3QgcG9wdXAgPSAoLi4uY3M6SFRNTEFyZ1tdKT0+e1xuICBjb25zdCBkaWFsb2dmaWVsZCA9IGRpdih7XG4gICAgc3R5bGU6IHtcbiAgICAgIGJhY2tncm91bmQ6IGNvbG9yLmJhY2tncm91bmQsXG4gICAgICBjb2xvcjogY29sb3IuY29sb3IsXG4gICAgICBwYWRkaW5nOiBcIjFlbSA0ZW1cIixcbiAgICAgIHBhZGRpbmdCb3R0b206IFwiMmVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMWVtXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgICAgb3ZlcmZsb3dZOiBcInNjcm9sbFwiLFxuICAgICAgbWluV2lkdGg6IFwiMjB2d1wiLFxuICAgICAgbWF4SGVpZ2h0OiBcIjgwdmhcIixcbiAgICB9fSxcbiAgICAuLi5jcylcblxuICBjb25zdCBwb3B1cGJhY2tncm91bmQgPSBkaXYoXG4gICAge3N0eWxlOntcbiAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICB0b3A6IFwiMFwiLFxuICAgICAgbGVmdDogXCIwXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogXCJyZ2JhKDE2NiwgMTY2LCAxNjYsIDAuNSlcIixcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICB9fVxuICApXG5cbiAgcG9wdXBiYWNrZ3JvdW5kLmFwcGVuZENoaWxkKGRpYWxvZ2ZpZWxkKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwb3B1cGJhY2tncm91bmQpO1xuICBwb3B1cGJhY2tncm91bmQub25jbGljayA9ICgpID0+IHtwb3B1cGJhY2tncm91bmQucmVtb3ZlKCk7IH1cbiAgZGlhbG9nZmllbGQub25jbGljayA9IChlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICByZXR1cm4gcG9wdXBiYWNrZ3JvdW5kXG5cbn1cblxuZXhwb3J0IGNvbnN0IGVycm9ycG9wdXAgPSAoZTpFcnJvciB8IHN0cmluZykgPT57XG4gIHBvcHVwKGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOmNvbG9yLmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6XCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgIHBhZGRpbmc6XCIxZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czpcIi40ZW1cIixcbiAgICAgIGNvbG9yOmNvbG9yLnJlZCxcbiAgICB9KSxcbiAgICBoMihcIkVycm9yXCIpLFxuICAgIHAoU3RyaW5nKGUpKVxuICApKVxuICB0aHJvdyAoZSBpbnN0YW5jZW9mIEVycm9yKSA/IGUgOiBuZXcgRXJyb3IoU3RyaW5nKGUpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFuZWxMaXN0KGl0ZW1zOiB7dGl0bGU6IEhUTUxBcmcsIGNvbnRlbnQ6IEhUTUxBcmd9W10pe1xuICByZXR1cm4gZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAgZmxleERpcmVjdGlvbjogXCJjb2x1bW5cIixcbiAgICAgIGdhcDogXCIxZW1cIixcbiAgICB9KSxcbiAgICAuLi5pdGVtcy5tYXAoZj0+ZGl2KFxuICAgICAgc3R5bGUoe1xuICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIuNGVtXCIsXG4gICAgICAgIHBhZGRpbmc6IFwiLjVlbSAxZW1cIixcbiAgICAgIH0pLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgZm9udFdlaWdodDogXCJib2xkXCIsXG4gICAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYudGl0bGVcbiAgICAgICksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBtYXJnaW5Ub3A6IFwiLjVlbVwiLFxuICAgICAgICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi5jb250ZW50XG4gICAgICApXG4gICAgKSlcbiAgKVxufVxuXG5cblxuXG4iLAogICAgImltcG9ydCB7IGNvbXBpbGUsIGZ1bmMsIHJldCwgdHlwZSBDb21waWxlUmVzdWx0LCB0eXBlIEZ1bmNIYW5kbGUsIHR5cGUgTW9kdWxlRGVmIH0gZnJvbSBcIi4uL3dhc21cIjtcbmltcG9ydCB7IGJvZHksIHAgfSBmcm9tIFwiLi9odG1sXCI7XG5cblxuXG5sZXQgbW9kID0gYXdhaXQgY29tcGlsZSh7XG4gICAgZm9vIDogZnVuYyhbXSwgXCJpMzJcIiwgKCk9PltcbiAgICByZXQoMzMpXG4gIF0pLFxufSlcblxuXG50eXBlIEFzeW5jRiA8RiBleHRlbmRzIEZ1bmN0aW9uPiA9IEYgZXh0ZW5kcyAoLi4uYXJnczogaW5mZXIgQSk9PmluZmVyIFIgPyAoLi4uYXJnczogQSk9PlByb21pc2U8Uj4gOiBuZXZlclxuXG5cbnR5cGUgTW9kRnVuY3MgPSB7W2tleSBpbiBrZXlvZiB0eXBlb2YgbW9kXSA6IHR5cGVvZiBtb2Rba2V5XSBleHRlbmRzIEZ1bmN0aW9uID8gQXN5bmNGPHR5cGVvZiBtb2Rba2V5XT4gOiBuZXZlcn1cblxuXG5cbnR5cGUgV29ya2VyTWVzc2FnZSA9IHtcbiAgdGFnOiBcIm1vZHVsZVwiLFxuICBtb2Q6IFdlYkFzc2VtYmx5Lk1vZHVsZVxufSB8IHtcbiAgdGFnOiBcImNhbGxcIixcbiAgZnVuYzogc3RyaW5nLFxuICBhcmdzOiBhbnlbXSxcbn0gfCB7XG4gIHRhZzogXCJyZXN1bHRcIixcbiAgcmVzdWx0OiBhbnlcbn1cblxubGV0IFdva2VyQnVuZGxlTWFpbiA9ICgpID0+IHtcbiAgbGV0IGZ1bmNzIDogUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKT0+YW55PiA9IHt9XG5cbiAgb25tZXNzYWdlID0gYXN5bmMgKGUpPT57XG5cbiAgICBsZXQgbXNnID0gZS5kYXRhIGFzIFdvcmtlck1lc3NhZ2VcbiAgICBpZiAobXNnLnRhZyA9PSBcIm1vZHVsZVwiKXtcbiAgICAgIGxldCBpbnN0YW5jZSA9IGF3YWl0IFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlKG1zZy5tb2QpXG4gICAgICBmdW5jcyA9IGluc3RhbmNlLmV4cG9ydHMgYXMgUmVjb3JkPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKT0+YW55PlxuXG4gICAgICBwb3N0TWVzc2FnZSh7dGFnOiBcInJlc3VsdFwiLCByZXN1bHQ6IDB9KVxuICAgIH1cblxuICAgIGlmIChtc2cudGFnID09IFwiY2FsbFwiKXtcbiAgICAgIGxldCByZXMgPSBmdW5jc1ttc2cuZnVuY10hKC4uLm1zZy5hcmdzKVxuICAgIH1cbiAgfVxufVxuXG5sZXQgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbYCgke1dva2VyQnVuZGxlTWFpbi50b1N0cmluZygpfSkoKWBdLCB7dHlwZTogXCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0XCJ9KSlcblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWtXb3JrZXIoKXtcbiAgbGV0IHdvcmtlciA9IG5ldyBXb3JrZXIodXJsKVxuXG4gIGZ1bmN0aW9uIHBvc3QobXNnOiBXb3JrZXJNZXNzYWdlKXtcbiAgICB3b3JrZXIucG9zdE1lc3NhZ2UobXNnKVxuICB9XG5cbiAgbGV0IHJlc29sdmVyIDogKCh4Om51bWJlcikgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuXG4gIHdvcmtlci5vbm1lc3NhZ2UgPSAoZSk9PntcbiAgICBsZXQgbXNnID0gZS5kYXRhIGFzIFdvcmtlck1lc3NhZ2VcbiAgICBpZiAobXNnLnRhZyA9PSBcInJlc3VsdFwiKXtcbiAgICAgIGlmICghcmVzb2x2ZXIpIHRocm93IG5ldyBFcnJvcihcIk5vIHJlc29sdmVyIHNldFwiKVxuICAgICAgcmVzb2x2ZXIobXNnLnJlc3VsdClcbiAgICAgIHJlc29sdmVyID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIGxldCBjYWxsID0gKGZ1bmM6IHN0cmluZywgYXJnczogYW55W10pID0+IHtcbiAgICBpZiAocmVzb2x2ZXIpIHRocm93IG5ldyBFcnJvcihcIkFscmVhZHkgd2FpdGluZyBmb3IgYSByZXN1bHRcIilcbiAgICByZXR1cm4gbmV3IFByb21pc2U8bnVtYmVyPigocmVzb2x2ZSk9PntcbiAgICAgIHJlc29sdmVyID0gcmVzb2x2ZVxuICAgICAgcG9zdCh7dGFnOiBcImNhbGxcIiwgZnVuYywgYXJnc30pXG4gICAgfSlcbiAgfVxuXG4gIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXMpPT57XG4gICAgcmVzb2x2ZXIgPSAoeCk9PnJlcygpXG4gICAgcG9zdCh7dGFnOiBcIm1vZHVsZVwiLCBtb2Q6IG1vZC5tb2R9KVxuICB9KVxuXG4gIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXMobW9kKVxuICAuZmlsdGVyKChbayx2XSk9PiB0eXBlb2YgdiA9PSBcImZ1bmN0aW9uXCIpXG4gIC5tYXAoKFtrLHZdKT0+W2ssICguLi5hcmdzOiBhbnlbXSk9PmNhbGwoaywgYXJncyldKSkgYXMgTW9kRnVuY3NcblxufVxuXG4iLAogICAgImltcG9ydCB7IGFycmF5LCBjb21waWxlLCBmdW5jLCBpMzIsIGxvY2FsLCByZXQsIHdoaWxlTG9vcCB9IGZyb20gXCIuLi93YXNtXCI7XG5pbXBvcnQgeyBib2R5LCBoMiwgcCB9IGZyb20gXCIuL2h0bWxcIjtcbmltcG9ydCB7IG1rV29ya2VyIH0gZnJvbSBcIi4vcGxhbm5lclwiO1xuXG5cbmNvbnN0IHhzID0gYXJyYXkoXCJpMzJcIiwgMTAyNClcbmNvbnN0IHlzID0gYXJyYXkoXCJpMzJcIiwgMTAyNClcbmNvbnN0IG91dCA9IGFycmF5KFwiaTMyXCIsIDEwMjQpXG5cbmNvbnN0IHN1bUludG8gPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgbiA9PiB7XG4gIGNvbnN0IGkgPSBsb2NhbC5pMzIoKVxuICByZXR1cm4gW1xuICAgIGkuc2V0KDApLFxuICAgIHdoaWxlTG9vcChpLmx0KG4pLCBbXG4gICAgICBvdXQuc3RvcmUoaSwgeHMubG9hZChpKS5hZGQoeXMubG9hZChpKSkpLFxuICAgICAgaS5pYWRkKDEpLFxuICAgIF0pLFxuICAgIHJldCgwKSxcbiAgXVxufSlcblxuY29uc3QgbW9kID0gYXdhaXQgY29tcGlsZSh7XG4gIHN1bUludG8sXG4gIHhzLFxuICB5cyxcbiAgb3V0LFxufSlcblxubGV0IG49IDhcblxuZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgbW9kLnhzW2ldID0gaVxuICBtb2QueXNbaV0gPSBpICogMTBcbn1cblxuY29uc3Qgc3QgPSBwZXJmb3JtYW5jZS5ub3coKVxubW9kLnN1bUludG8obilcbmNvbnN0IG1zID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdFxuXG5ib2R5LmFwcGVuZChcbiAgaDIoXCJ3YXNtIGFycmF5c1wiKSxcbiAgcChgc3VtSW50bygke259KSBpbiAke21zLnRvRml4ZWQoMyl9IG1zYCksXG4gIHAoYG91dCA9ICR7QXJyYXkuZnJvbShtb2Qub3V0LnNsaWNlKDAsIG4pKS5qb2luKFwiLCBcIil9YCksXG5cbilcblxuXG5sZXQgdyA9IGF3YWl0IG1rV29ya2VyKClcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxJQUFNLFFBQVEsQ0FBQyxHQUFNLElBQU0sS0FBTSxLQUFNLEdBQU0sR0FBTSxHQUFNLENBQUk7QUFDN0QsSUFBTSxXQUFXLENBQUMsT0FBTyxPQUFPLE9BQU8sS0FBSztBQUM1QyxJQUFNLFNBQVMsQ0FBQyxPQUFPLE9BQU8sT0FBTyxLQUFLO0FBQzFDLElBQU0sU0FBUyxDQUFDLE1BQU0sTUFBTSxJQUFJO0FBdUhoQyxJQUFNLFFBQVE7QUFBQSxFQUNaLE1BQU0sRUFBRSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLElBQUs7QUFBQSxFQUNuRCxLQUFLO0FBQUEsSUFDSCxLQUFLLEVBQUUsS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxJQUFLO0FBQUEsSUFDbEQsS0FBSyxFQUFFLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssSUFBSztBQUFBLElBQ2xE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QztBQUFBLElBQ1YsQ0FBQztBQUFBLElBQ0QsSUFBSSxDQUFDO0FBQUEsRUFDUDtBQUFBLENBQ0Q7QUFFRCxJQUFNLE9BQU0sTUFBTSxRQUFRO0FBQUEsRUFDeEI7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRixDQUFDO0FBRUQsSUFBSSxJQUFHO0FBRVAsU0FBUyxJQUFJLEVBQUcsSUFBSSxHQUFHLEtBQUs7QUFBQSxFQUMxQixLQUFJLEdBQUcsS0FBSztBQUFBLEVBQ1osS0FBSSxHQUFHLEtBQUssSUFBSTtBQUNsQjtBQUVBLElBQU0sS0FBSyxZQUFZLElBQUk7QUFDM0IsS0FBSSxRQUFRLENBQUM7QUFDYixJQUFNLEtBQUssWUFBWSxJQUFJLElBQUk7QUFFL0IsS0FBSyxPQUNILEdBQUcsYUFBYSxHQUNoQixFQUFFLFdBQVcsU0FBUyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQ3hDLEVBQUUsU0FBUyxNQUFNLEtBQUssS0FBSSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLElBQUksR0FBRyxDQUV6RDtBQUdBLElBQUksSUFBSSxNQUFNLFNBQVM7IiwKICAiZGVidWdJZCI6ICI5RjI4QThCOTdGNzQzM0M4NjQ3NTZFMjE2NDc1NkUyMSIsCiAgIm5hbWVzIjogW10KfQ==
