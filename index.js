// src/wasm.ts
var magic = [0, 97, 115, 109, 1, 0, 0, 0];
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
  }
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
var die = (x) => {
  throw new Error(`Unexpected value: ${String(x)}`);
};
var flatMap = (xs, fn) => xs.flatMap(fn);
var expr = (node) => {
  const e = node;
  e.add = (r) => bin("add", e, r);
  e.sub = (r) => bin("sub", e, r);
  e.mul = (r) => bin("mul", e, r);
  e.div = (r) => bin("div", e, r);
  e.eq = (r) => cmp("eq", e, r);
  e.lt = (r) => cmp("lt", e, r);
  e.gt = (r) => cmp("gt", e, r);
  return e;
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
var bin = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var cmp = (op, left, right) => expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) });
var i32 = (n) => expr({ kind: "const", type: "i32", value: n });
var nextFuncId = 0;
var nextLocalId = 0;
var localExpr = (type, local) => expr({ kind: "local.get", type, local });
var mkHandle = (params, result, build) => {
  const id = nextFuncId++;
  return {
    id,
    params,
    result,
    build,
    call: (...args) => expr({ kind: "call", type: result, target: id, args })
  };
};
var func = (params, result, build) => mkHandle(params, result, build);
var mkLocal = (type) => {
  const id = nextLocalId++;
  return {
    id,
    type,
    get: () => localExpr(type, id),
    set: (value) => ({ kind: "local.set", local: id, type, value: lit(type, value) })
  };
};
var local = {
  i32: () => mkLocal("i32"),
  i64: () => mkLocal("i64"),
  f32: () => mkLocal("f32"),
  f64: () => mkLocal("f64")
};
var asRetExpr = (value) => lit(typeof value === "object" && value !== null && "type" in value ? value.type : "i32", value);
var ret = (value) => ({
  kind: "return",
  value: asRetExpr(value)
});
var ifStmt = (cond, then, else_ = []) => ({ kind: "if", cond, then, else: else_ });
var whileLoop = (cond, body) => ({ kind: "while", cond, body });
var collectLocalsExpr = (e, out) => {
  switch (e.kind) {
    case "const":
      return;
    case "local.get":
      out.set(e.local, e.type);
      return;
    case "bin":
      collectLocalsExpr(e.left, out);
      collectLocalsExpr(e.right, out);
      return;
    case "cmp":
      collectLocalsExpr(e.left, out);
      collectLocalsExpr(e.right, out);
      return;
    case "call":
      e.args.forEach((arg) => collectLocalsExpr(arg, out));
      return;
    case "if":
      collectLocalsExpr(e.cond, out);
      collectLocalsExpr(e.then, out);
      collectLocalsExpr(e.else, out);
      return;
    default:
      return die(e);
  }
};
var collectLocalsStmt = (s, out) => {
  switch (s.kind) {
    case "local.set":
      out.set(s.local, s.type);
      collectLocalsExpr(s.value, out);
      return;
    case "if":
      collectLocalsExpr(s.cond, out);
      s.then.forEach((x) => collectLocalsStmt(x, out));
      s.else.forEach((x) => collectLocalsStmt(x, out));
      return;
    case "while":
      collectLocalsExpr(s.cond, out);
      s.body.forEach((x) => collectLocalsStmt(x, out));
      return;
    case "return":
      collectLocalsExpr(s.value, out);
      return;
    case "expr":
      collectLocalsExpr(s.expr, out);
      return;
    default:
      return die(s);
  }
};
var compileExpr = (e, ix) => {
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
      return [32, ...u32(ix[e.local])];
    case "bin":
      return [...compileExpr(e.left, ix), ...compileExpr(e.right, ix), codes.bin[e.op][e.type]];
    case "cmp":
      return [...compileExpr(e.left, ix), ...compileExpr(e.right, ix), codes.cmp[e.op][e.inputType]];
    case "call":
      if (ix[e.target] == null)
        throw new Error(`Unknown function ${e.target}`);
      return [...e.args.flatMap((arg) => compileExpr(arg, ix)), 16, ...u32(ix[e.target])];
    case "if":
      return [...compileExpr(e.cond, ix), 4, codes.type[e.type], ...compileExpr(e.then, ix), 5, ...compileExpr(e.else, ix), 11];
    default:
      return die(e);
  }
};
var compileStmt = (s, ix) => {
  switch (s.kind) {
    case "local.set":
      return [...compileExpr(s.value, ix), 33, ...u32(ix[s.local])];
    case "if":
      return [...compileExpr(s.cond, ix), 4, 64, ...flatMap(s.then, (x) => compileStmt(x, ix)), ...s.else.length ? [5, ...flatMap(s.else, (x) => compileStmt(x, ix))] : [], 11];
    case "while":
      return [2, 64, 3, 64, ...compileExpr(s.cond, ix), 69, 13, ...u32(1), ...flatMap(s.body, (x) => compileStmt(x, ix)), 12, ...u32(0), 11, 11];
    case "return":
      return [...compileExpr(s.value, ix), 15];
    case "expr":
      return [...compileExpr(s.expr, ix), 26];
    default:
      return die(s);
  }
};
var compileModule = (defs) => {
  const entries = Object.entries(defs);
  const fx = Object.fromEntries(entries.map(([, def], i) => [def.id, i]));
  return new Uint8Array([
    ...magic,
    ...section(1, [...u32(entries.length), ...entries.flatMap(([, f]) => [96, ...u32(f.params.length), ...f.params.map((t) => codes.type[t]), 1, codes.type[f.result]])]),
    ...section(3, [...u32(entries.length), ...entries.flatMap((_, i) => u32(i))]),
    ...section(7, [...u32(entries.length), ...entries.flatMap(([name], i) => [...str(name), 0, ...u32(i)])]),
    ...section(10, [...u32(entries.length), ...entries.flatMap(([, f]) => {
      if (!f.build)
        throw new Error(`Function ${f.id} has no implementation`);
      const params = f.params.map((type) => localExpr(type, nextLocalId++));
      const paramIds = params.map((p) => p.kind === "local.get" ? p.local : -1);
      const built = f.build(...params);
      const locals = new Map;
      Array.isArray(built) ? built.forEach((s) => collectLocalsStmt(s, locals)) : collectLocalsExpr(built, locals);
      paramIds.forEach((id) => locals.delete(id));
      const localEntries = [...locals.entries()];
      const lx = Object.fromEntries([...paramIds.map((id, i) => [id, i]), ...localEntries.map(([id], i) => [id, f.params.length + i])]);
      const decls = [...flatMap(localEntries, ([, type]) => [...u32(1), codes.type[type]])];
      const code = Array.isArray(built) ? flatMap(built, (s) => compileStmt(s, lx)) : compileExpr(built, lx);
      const body = [...u32(localEntries.length), ...decls, ...code, 11];
      return [...u32(body.length), ...body];
    })])
  ]);
};
var compile = async (defs) => (await WebAssembly.instantiate(await WebAssembly.compile(Uint8Array.from(compileModule(defs)).buffer))).exports;

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
var fib = func(["i32"], "i32", (n) => {
  const a2 = local.i32();
  const b = local.i32();
  const i = local.i32();
  const next = local.i32();
  return [
    ifStmt(n.lt(2), [ret(i32(1))]),
    a2.set(1),
    b.set(1),
    i.set(2),
    whileLoop(i.get().lt(n.add(1)), [
      next.set(a2.get().add(b.get())),
      a2.set(b),
      b.set(next),
      i.set(i.get().add(1))
    ]),
    ret(b)
  ];
});
var was = await compile({ fib });
var n = 4;
var res = was.fib(n);
body.append(h2("wasm"), p(`fib ${n} = ${String(res)}`));

//# debugId=138AAD2F7958C11264756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3dhc20udHMiLCAic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgImNvbnN0IG1hZ2ljID0gWzB4MDAsIDB4NjEsIDB4NzMsIDB4NmQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4MDBdXG5cblxuXG5cbmV4cG9ydCB0eXBlIE51bVR5cGUgPSBcImkzMlwiIHwgXCJpNjRcIiB8IFwiZjMyXCIgfCBcImY2NFwiXG5leHBvcnQgdHlwZSBCaW5PcCA9IFwiYWRkXCIgfCBcInN1YlwiIHwgXCJtdWxcIiB8IFwiZGl2XCJcbmV4cG9ydCB0eXBlIENtcE9wID0gXCJlcVwiIHwgXCJsdFwiIHwgXCJndFwiXG50eXBlIFZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IFQgZXh0ZW5kcyBcImk2NFwiID8gYmlnaW50IDogbnVtYmVyXG5cbmV4cG9ydCB0eXBlIEZ1bmNTaWc8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUmV0IGV4dGVuZHMgTnVtVHlwZT4gPSB7IHBhcmFtczogQXJncywgcmVzdWx0OiBSZXQgfVxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPiA6IG5ldmVyIH1cbnR5cGUgQXJnc1ZhbDxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8QXJnc1tLXT4gOiBuZXZlciB9XG5leHBvcnQgdHlwZSBMb2NhbFZhcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSB7XG4gIGlkOiBudW1iZXJcbiAgdHlwZTogVFxuICBnZXQoKTogRXhwcjxUPlxuICBzZXQodmFsdWU6IEV4cHJMaWtlPFQ+KTogU3RtdFxufVxudHlwZSBFeHByTGlrZTxUIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFQ+IHwgVmFsdWU8VD4gfCBMb2NhbFZhcjxUPlxudHlwZSBGdW5jQm9keTxSIGV4dGVuZHMgTnVtVHlwZT4gPSBFeHByPFI+IHwgU3RtdFtdXG5cbnR5cGUgQ29yZUV4cHI8VCBleHRlbmRzIE51bVR5cGU+ID1cbiAgfCB7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogVCwgdmFsdWU6IFZhbHVlPFQ+IH1cbiAgfCB7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGU6IFQsIGxvY2FsOiBudW1iZXIgfVxuICB8IHsga2luZDogXCJiaW5cIiwgdHlwZTogVCwgb3A6IEJpbk9wLCBsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwcjxUPiB9XG4gIHwgeyBraW5kOiBcImNhbGxcIiwgdHlwZTogVCwgdGFyZ2V0OiBudW1iZXIsIGFyZ3M6IEV4cHI8TnVtVHlwZT5bXSB9XG4gIHwgeyBraW5kOiBcImlmXCIsIHR5cGU6IFQsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2U6IEV4cHI8VD4gfVxuICB8IChUIGV4dGVuZHMgXCJpMzJcIiA/IHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBOdW1UeXBlLCBvcDogQ21wT3AsIGxlZnQ6IEV4cHI8TnVtVHlwZT4sIHJpZ2h0OiBFeHByPE51bVR5cGU+IH0gOiBuZXZlcilcblxuZXhwb3J0IHR5cGUgRXhwcjxUIGV4dGVuZHMgTnVtVHlwZT4gPSBDb3JlRXhwcjxUPiAmIHtcbiAgYWRkKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD5cbiAgc3ViKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD5cbiAgbXVsKHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD5cbiAgZGl2KHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8VD5cbiAgZXEocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxuICBsdChyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG4gIGd0KHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbn1cblxuZXhwb3J0IHR5cGUgU3RtdCA9XG4gIHwgeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbDogbnVtYmVyLCB0eXBlOiBOdW1UeXBlLCB2YWx1ZTogRXhwcjxOdW1UeXBlPiB9XG4gIHwgeyBraW5kOiBcImlmXCIsIGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IFN0bXRbXSwgZWxzZTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwid2hpbGVcIiwgY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogU3RtdFtdIH1cbiAgfCB7IGtpbmQ6IFwicmV0dXJuXCIsIHZhbHVlOiBFeHByPE51bVR5cGU+IH1cbiAgfCB7IGtpbmQ6IFwiZXhwclwiLCBleHByOiBFeHByPE51bVR5cGU+IH1cblxudHlwZSBGdW5jSW1wbDxTIGV4dGVuZHMgRnVuY1NpZzxyZWFkb25seSBOdW1UeXBlW10sIE51bVR5cGU+PiA9IHsgcGFyYW1zOiBTW1wicGFyYW1zXCJdLCByZXN1bHQ6IFNbXCJyZXN1bHRcIl0sIGJvZHk6IEV4cHI8U1tcInJlc3VsdFwiXT4gfVxuZXhwb3J0IHR5cGUgRnVuY0hhbmRsZTxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4gPSBGdW5jU2lnPEEsIFI+ICYge1xuICBpZDogbnVtYmVyXG4gIGJ1aWxkPzogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8Uj5cbiAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NFeHByPEE+KSA9PiBFeHByPFI+XG59XG50eXBlIEFueUZ1bmMgPSB7XG4gIGlkOiBudW1iZXJcbiAgcGFyYW1zOiByZWFkb25seSBOdW1UeXBlW11cbiAgcmVzdWx0OiBOdW1UeXBlXG4gIGJ1aWxkPzogKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRnVuY0JvZHk8TnVtVHlwZT5cbiAgY2FsbDogKC4uLmFyZ3M6IGFueVtdKSA9PiBFeHByPE51bVR5cGU+XG59XG50eXBlIE1vZHVsZURlZnMgPSBSZWNvcmQ8c3RyaW5nLCBBbnlGdW5jPlxudHlwZSBTaWdPZjxGIGV4dGVuZHMgQW55RnVuYz4gPSBGdW5jU2lnPEZbXCJwYXJhbXNcIl0sIEZbXCJyZXN1bHRcIl0+XG50eXBlIE1vZHVsZVNpZ3M8VCBleHRlbmRzIE1vZHVsZURlZnM+ID0geyBbSyBpbiBrZXlvZiBUXTogU2lnT2Y8VFtLXT4gfVxudHlwZSBNb2R1bGVJbXBsPFQgZXh0ZW5kcyBNb2R1bGVEZWZzPiA9IHsgW0sgaW4ga2V5b2YgVF06IEZ1bmNJbXBsPFNpZ09mPFRbS10+PiB9XG5leHBvcnQgdHlwZSBFeHBvcnRCdW5kbGU8VCBleHRlbmRzIE1vZHVsZURlZnM+ID0geyBbSyBpbiBrZXlvZiBUXS0/OiAoLi4uYXJnczogQXJnc1ZhbDxUW0tdW1wicGFyYW1zXCJdPikgPT4gVmFsdWU8VFtLXVtcInJlc3VsdFwiXT4gfVxuXG5jb25zdCBjb2RlcyA9IHtcbiAgdHlwZTogeyBpMzI6IDB4N2YsIGk2NDogMHg3ZSwgZjMyOiAweDdkLCBmNjQ6IDB4N2MgfSBhcyBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPixcbiAgYmluOiB7XG4gICAgYWRkOiB7IGkzMjogMHg2YSwgaTY0OiAweDdjLCBmMzI6IDB4OTIsIGY2NDogMHhhMCB9LFxuICAgIHN1YjogeyBpMzI6IDB4NmIsIGk2NDogMHg3ZCwgZjMyOiAweDkzLCBmNjQ6IDB4YTEgfSxcbiAgICBtdWw6IHsgaTMyOiAweDZjLCBpNjQ6IDB4N2UsIGYzMjogMHg5NCwgZjY0OiAweGEyIH0sXG4gICAgZGl2OiB7IGkzMjogMHg2ZCwgaTY0OiAweDdmLCBmMzI6IDB4OTUsIGY2NDogMHhhMyB9LFxuICB9IGFzIFJlY29yZDxCaW5PcCwgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4+LFxuICBjbXA6IHtcbiAgICBlcTogeyBpMzI6IDB4NDYsIGk2NDogMHg1MSwgZjMyOiAweDViLCBmNjQ6IDB4NjEgfSxcbiAgICBsdDogeyBpMzI6IDB4NDgsIGk2NDogMHg1MywgZjMyOiAweDVkLCBmNjQ6IDB4NjMgfSxcbiAgICBndDogeyBpMzI6IDB4NGEsIGk2NDogMHg1NSwgZjMyOiAweDVlLCBmNjQ6IDB4NjQgfSxcbiAgfSBhcyBSZWNvcmQ8Q21wT3AsIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+Pixcbn1cblxuY29uc3QgYmlucyA9IFtcImFkZFwiLCBcInN1YlwiLCBcIm11bFwiLCBcImRpdlwiXSBhcyBjb25zdCBzYXRpc2ZpZXMgcmVhZG9ubHkgQmluT3BbXVxuY29uc3QgY21wcyA9IFtcImVxXCIsIFwibHRcIiwgXCJndFwiXSBhcyBjb25zdCBzYXRpc2ZpZXMgcmVhZG9ubHkgQ21wT3BbXVxuXG5jb25zdCB1MzIgPSAobjogbnVtYmVyKSA9PiB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCkgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCB1bnNpZ25lZCBpbnRlZ2VyLCBnb3QgJHtufWApXG4gIGNvbnN0IG91dDogbnVtYmVyW10gPSBbXVxuICBkbyB7XG4gICAgbGV0IGJ5dGUgPSBuICYgMHg3ZlxuICAgIG4gPj4+PSA3XG4gICAgaWYgKG4pIGJ5dGUgfD0gMHg4MFxuICAgIG91dC5wdXNoKGJ5dGUpXG4gIH0gd2hpbGUgKG4pXG4gIHJldHVybiBvdXRcbn1cblxuY29uc3Qgc04gPSAodmFsdWU6IG51bWJlciB8IGJpZ2ludCwgYml0czogMzIgfCA2NCkgPT4ge1xuICBjb25zdCBvdXQ6IG51bWJlcltdID0gW11cbiAgbGV0IG4gPSBiaXRzID09PSAzMiA/IEJpZ0ludCgodmFsdWUgYXMgbnVtYmVyKSB8IDApIDogQmlnSW50LmFzSW50Tig2NCwgdmFsdWUgYXMgYmlnaW50KVxuICBmb3IgKDs7KSB7XG4gICAgbGV0IGJ5dGUgPSBOdW1iZXIobiAmIDB4N2ZuKVxuICAgIG4gPj49IDduXG4gICAgY29uc3QgZG9uZSA9IChuID09PSAwbiAmJiAoYnl0ZSAmIDB4NDApID09PSAwKSB8fCAobiA9PT0gLTFuICYmIChieXRlICYgMHg0MCkgIT09IDApXG4gICAgaWYgKCFkb25lKSBieXRlIHw9IDB4ODBcbiAgICBvdXQucHVzaChieXRlKVxuICAgIGlmIChkb25lKSByZXR1cm4gb3V0XG4gIH1cbn1cblxuY29uc3QgZk4gPSAodmFsdWU6IG51bWJlciwgYnl0ZXM6IDQgfCA4KSA9PiB7XG4gIGNvbnN0IG91dCA9IG5ldyBVaW50OEFycmF5KGJ5dGVzKVxuICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KG91dC5idWZmZXIpXG4gIGJ5dGVzID09PSA0ID8gdmlldy5zZXRGbG9hdDMyKDAsIHZhbHVlLCB0cnVlKSA6IHZpZXcuc2V0RmxvYXQ2NCgwLCB2YWx1ZSwgdHJ1ZSlcbiAgcmV0dXJuIFsuLi5vdXRdXG59XG5cbmNvbnN0IHN0ciA9IChzOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgYnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUocylcbiAgcmV0dXJuIFsuLi51MzIoYnl0ZXMubGVuZ3RoKSwgLi4uYnl0ZXNdXG59XG5cbmNvbnN0IHNlY3Rpb24gPSAoaWQ6IG51bWJlciwgcGF5bG9hZDogbnVtYmVyW10pID0+IFtpZCwgLi4udTMyKHBheWxvYWQubGVuZ3RoKSwgLi4ucGF5bG9hZF1cbmNvbnN0IGRpZSA9ICh4OiB1bmtub3duKTogbmV2ZXIgPT4geyB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdmFsdWU6ICR7U3RyaW5nKHgpfWApIH1cbmNvbnN0IGZsYXRNYXAgPSA8VCwgUj4oeHM6IFRbXSwgZm46ICh4OiBUKSA9PiBSW10pOiBSW10gPT4geHMuZmxhdE1hcChmbilcblxuY29uc3QgZXhwciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obm9kZTogQ29yZUV4cHI8VD4pOiBFeHByPFQ+ID0+IHtcbiAgY29uc3QgZSA9IG5vZGUgYXMgRXhwcjxUPlxuICBlLmFkZCA9IHIgPT4gYmluKFwiYWRkXCIsIGUsIHIpIGFzIEV4cHI8VD5cbiAgZS5zdWIgPSByID0+IGJpbihcInN1YlwiLCBlLCByKSBhcyBFeHByPFQ+XG4gIGUubXVsID0gciA9PiBiaW4oXCJtdWxcIiwgZSwgcikgYXMgRXhwcjxUPlxuICBlLmRpdiA9IHIgPT4gYmluKFwiZGl2XCIsIGUsIHIpIGFzIEV4cHI8VD5cbiAgZS5lcSA9IHIgPT4gY21wKFwiZXFcIiwgZSwgcikgYXMgRXhwcjxcImkzMlwiPlxuICBlLmx0ID0gciA9PiBjbXAoXCJsdFwiLCBlLCByKSBhcyBFeHByPFwiaTMyXCI+XG4gIGUuZ3QgPSByID0+IGNtcChcImd0XCIsIGUsIHIpIGFzIEV4cHI8XCJpMzJcIj5cbiAgcmV0dXJuIGVcbn1cblxuY29uc3QgbGl0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih0eXBlOiBULCB2YWx1ZTogRXhwckxpa2U8VD4pOiBFeHByPFQ+ID0+IHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChcImtpbmRcIiBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlIGFzIEV4cHI8VD5cbiAgICBpZiAoXCJnZXRcIiBpbiB2YWx1ZSkgcmV0dXJuIHZhbHVlLmdldCgpXG4gIH1cbiAgcmV0dXJuIGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGUsIHZhbHVlOiB2YWx1ZSBhcyBWYWx1ZTxUPiB9KVxufVxuXG5jb25zdCBiaW4gPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBCaW5PcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PlxuICBleHByKHsga2luZDogXCJiaW5cIiwgdHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdChsZWZ0LnR5cGUsIHJpZ2h0KSB9KVxuXG5jb25zdCBjbXAgPSA8VCBleHRlbmRzIE51bVR5cGU+KG9wOiBDbXBPcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PlxuICBleHByKHsga2luZDogXCJjbXBcIiwgdHlwZTogXCJpMzJcIiwgaW5wdXRUeXBlOiBsZWZ0LnR5cGUsIG9wLCBsZWZ0LCByaWdodDogbGl0KGxlZnQudHlwZSwgcmlnaHQpIH0pXG5cbmV4cG9ydCBjb25zdCBpZkVsc2UgPSA8VCBleHRlbmRzIE51bVR5cGU+KGNvbmQ6IEV4cHI8XCJpMzJcIj4sIHRoZW46IEV4cHI8VD4sIGVsc2VfOiBFeHByPFQ+KSA9PlxuICBleHByKHsga2luZDogXCJpZlwiLCB0eXBlOiB0aGVuLnR5cGUsIGNvbmQsIHRoZW4sIGVsc2U6IGVsc2VfIH0pXG5cbmV4cG9ydCBjb25zdCBhZGQgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKFwiYWRkXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IHN1YiA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4oXCJzdWJcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3QgbXVsID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihcIm11bFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBkaXYgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKFwiZGl2XCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IGVxID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChcImVxXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IGx0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChcImx0XCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IGd0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGNtcChcImd0XCIsIGxlZnQsIHJpZ2h0KVxuXG5leHBvcnQgY29uc3QgaTMyID0gKG46IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJpMzJcIiwgdmFsdWU6IG4gfSlcbmV4cG9ydCBjb25zdCBpNjQgPSAobjogYmlnaW50KSA9PiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBcImk2NFwiLCB2YWx1ZTogbiB9KVxuZXhwb3J0IGNvbnN0IGYzMiA9IChuOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFwiZjMyXCIsIHZhbHVlOiBuIH0pXG5leHBvcnQgY29uc3QgZjY0ID0gKG46IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJmNjRcIiwgdmFsdWU6IG4gfSlcblxubGV0IG5leHRGdW5jSWQgPSAwXG5sZXQgbmV4dExvY2FsSWQgPSAwXG5jb25zdCBsb2NhbEV4cHIgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIGxvY2FsOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlLCBsb2NhbCB9KVxuY29uc3QgbWtIYW5kbGUgPSA8QSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIE51bVR5cGU+KFxuICBwYXJhbXM6IEEsXG4gIHJlc3VsdDogUixcbiAgYnVpbGQ/OiAoLi4uYXJnczogcmVhZG9ubHkgRXhwcjxOdW1UeXBlPltdKSA9PiBGdW5jQm9keTxSPixcbik6IEZ1bmNIYW5kbGU8QSwgUj4gPT4ge1xuICBjb25zdCBpZCA9IG5leHRGdW5jSWQrK1xuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIHBhcmFtcyxcbiAgICByZXN1bHQsXG4gICAgYnVpbGQsXG4gICAgY2FsbDogKC4uLmFyZ3M6IEFyZ3NFeHByPEE+KSA9PiBleHByKHsga2luZDogXCJjYWxsXCIsIHR5cGU6IHJlc3VsdCwgdGFyZ2V0OiBpZCwgYXJnczogYXJncyBhcyBFeHByPE51bVR5cGU+W10gfSkgYXMgRXhwcjxSPixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZGVjbGFyZSA9IDxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4ocGFyYW1zOiBBLCByZXN1bHQ6IFIpID0+XG4gIG1rSGFuZGxlKHBhcmFtcywgcmVzdWx0KVxuXG5leHBvcnQgY29uc3QgZnVuYyA9IDxjb25zdCBBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4oXG4gIHBhcmFtczogQSxcbiAgcmVzdWx0OiBSLFxuICBidWlsZDogKC4uLmFyZ3M6IEFyZ3NFeHByPEE+KSA9PiBGdW5jQm9keTxSPixcbikgPT4gbWtIYW5kbGUocGFyYW1zLCByZXN1bHQsIGJ1aWxkIGFzICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEZ1bmNCb2R5PFI+KVxuXG50eXBlIFJldExpa2U8VCBleHRlbmRzIE51bVR5cGU+ID0gRXhwckxpa2U8VD5cblxuY29uc3QgbWtMb2NhbCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odHlwZTogVCk6IExvY2FsVmFyPFQ+ID0+IHtcbiAgY29uc3QgaWQgPSBuZXh0TG9jYWxJZCsrXG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgdHlwZSxcbiAgICBnZXQ6ICgpID0+IGxvY2FsRXhwcih0eXBlLCBpZCksXG4gICAgc2V0OiB2YWx1ZSA9PiAoeyBraW5kOiBcImxvY2FsLnNldFwiLCBsb2NhbDogaWQsIHR5cGUsIHZhbHVlOiBsaXQodHlwZSwgdmFsdWUpIGFzIEV4cHI8TnVtVHlwZT4gfSksXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGxvY2FsID0ge1xuICBpMzI6ICgpID0+IG1rTG9jYWwoXCJpMzJcIiksXG4gIGk2NDogKCkgPT4gbWtMb2NhbChcImk2NFwiKSxcbiAgZjMyOiAoKSA9PiBta0xvY2FsKFwiZjMyXCIpLFxuICBmNjQ6ICgpID0+IG1rTG9jYWwoXCJmNjRcIiksXG59XG5cbmNvbnN0IGFzUmV0RXhwciA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IFJldExpa2U8VD4pOiBFeHByPFQ+ID0+XG4gIGxpdCh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgXCJ0eXBlXCIgaW4gdmFsdWUgPyB2YWx1ZS50eXBlIGFzIFQgOiBcImkzMlwiIGFzIFQsIHZhbHVlKVxuXG5leHBvcnQgY29uc3QgcmV0ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPih2YWx1ZTogUmV0TGlrZTxUPik6IFN0bXQgPT4gKHtcbiAga2luZDogXCJyZXR1cm5cIixcbiAgdmFsdWU6IGFzUmV0RXhwcih2YWx1ZSkgYXMgRXhwcjxOdW1UeXBlPixcbn0pXG5cbmV4cG9ydCBjb25zdCBpZlN0bXQgPSAoY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogU3RtdFtdLCBlbHNlXzogU3RtdFtdID0gW10pOiBTdG10ID0+ICh7IGtpbmQ6IFwiaWZcIiwgY29uZCwgdGhlbiwgZWxzZTogZWxzZV8gfSlcbmV4cG9ydCBjb25zdCB3aGlsZUxvb3AgPSAoY29uZDogRXhwcjxcImkzMlwiPiwgYm9keTogU3RtdFtdKTogU3RtdCA9PiAoeyBraW5kOiBcIndoaWxlXCIsIGNvbmQsIGJvZHkgfSlcbmV4cG9ydCBjb25zdCBleHByU3RtdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4odmFsdWU6IEV4cHI8VD4pOiBTdG10ID0+ICh7IGtpbmQ6IFwiZXhwclwiLCBleHByOiB2YWx1ZSBhcyBFeHByPE51bVR5cGU+IH0pXG5cbmNvbnN0IGNvbGxlY3RMb2NhbHNFeHByID0gKGU6IEV4cHI8TnVtVHlwZT4sIG91dDogTWFwPG51bWJlciwgTnVtVHlwZT4pID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjpcbiAgICAgIHJldHVyblxuICAgIGNhc2UgXCJsb2NhbC5nZXRcIjpcbiAgICAgIG91dC5zZXQoZS5sb2NhbCwgZS50eXBlKVxuICAgICAgcmV0dXJuXG4gICAgY2FzZSBcImJpblwiOlxuICAgICAgY29sbGVjdExvY2Fsc0V4cHIoZS5sZWZ0LCBvdXQpOyBjb2xsZWN0TG9jYWxzRXhwcihlLnJpZ2h0LCBvdXQpOyByZXR1cm5cbiAgICBjYXNlIFwiY21wXCI6XG4gICAgICBjb2xsZWN0TG9jYWxzRXhwcihlLmxlZnQsIG91dCk7IGNvbGxlY3RMb2NhbHNFeHByKGUucmlnaHQsIG91dCk7IHJldHVyblxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICBlLmFyZ3MuZm9yRWFjaChhcmcgPT4gY29sbGVjdExvY2Fsc0V4cHIoYXJnLCBvdXQpKTsgcmV0dXJuXG4gICAgY2FzZSBcImlmXCI6XG4gICAgICBjb2xsZWN0TG9jYWxzRXhwcihlLmNvbmQsIG91dCk7IGNvbGxlY3RMb2NhbHNFeHByKGUudGhlbiwgb3V0KTsgY29sbGVjdExvY2Fsc0V4cHIoZS5lbHNlLCBvdXQpOyByZXR1cm5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGRpZShlKVxuICB9XG59XG5cbmNvbnN0IGNvbGxlY3RMb2NhbHNTdG10ID0gKHM6IFN0bXQsIG91dDogTWFwPG51bWJlciwgTnVtVHlwZT4pID0+IHtcbiAgc3dpdGNoIChzLmtpbmQpIHtcbiAgICBjYXNlIFwibG9jYWwuc2V0XCI6XG4gICAgICBvdXQuc2V0KHMubG9jYWwsIHMudHlwZSk7IGNvbGxlY3RMb2NhbHNFeHByKHMudmFsdWUsIG91dCk7IHJldHVyblxuICAgIGNhc2UgXCJpZlwiOlxuICAgICAgY29sbGVjdExvY2Fsc0V4cHIocy5jb25kLCBvdXQpOyBzLnRoZW4uZm9yRWFjaCh4ID0+IGNvbGxlY3RMb2NhbHNTdG10KHgsIG91dCkpOyBzLmVsc2UuZm9yRWFjaCh4ID0+IGNvbGxlY3RMb2NhbHNTdG10KHgsIG91dCkpOyByZXR1cm5cbiAgICBjYXNlIFwid2hpbGVcIjpcbiAgICAgIGNvbGxlY3RMb2NhbHNFeHByKHMuY29uZCwgb3V0KTsgcy5ib2R5LmZvckVhY2goeCA9PiBjb2xsZWN0TG9jYWxzU3RtdCh4LCBvdXQpKTsgcmV0dXJuXG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgY29sbGVjdExvY2Fsc0V4cHIocy52YWx1ZSwgb3V0KTsgcmV0dXJuXG4gICAgY2FzZSBcImV4cHJcIjpcbiAgICAgIGNvbGxlY3RMb2NhbHNFeHByKHMuZXhwciwgb3V0KTsgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUocylcbiAgfVxufVxuXG5jb25zdCBjb21waWxlRXhwciA9IChlOiBFeHByPE51bVR5cGU+LCBpeDogUmVjb3JkPG51bWJlciwgbnVtYmVyPik6IG51bWJlcltdID0+IHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlIFwiY29uc3RcIjpcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTMyXCIpIHJldHVybiBbMHg0MSwgLi4uc04oZS52YWx1ZSBhcyBudW1iZXIsIDMyKV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiaTY0XCIpIHJldHVybiBbMHg0MiwgLi4uc04oZS52YWx1ZSwgNjQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmMzJcIikgcmV0dXJuIFsweDQzLCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgNCldXG4gICAgICBpZiAoZS50eXBlID09PSBcImY2NFwiKSByZXR1cm4gWzB4NDQsIC4uLmZOKGUudmFsdWUgYXMgbnVtYmVyLCA4KV1cbiAgICAgIHJldHVybiBkaWUoZSlcbiAgICBjYXNlIFwibG9jYWwuZ2V0XCI6IHJldHVybiBbMHgyMCwgLi4udTMyKGl4W2UubG9jYWxdISldXG4gICAgY2FzZSBcImJpblwiOiByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCwgaXgpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0LCBpeCksIGNvZGVzLmJpbltlLm9wXVtlLnR5cGVdXVxuICAgIGNhc2UgXCJjbXBcIjogcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmxlZnQsIGl4KSwgLi4uY29tcGlsZUV4cHIoZS5yaWdodCwgaXgpLCBjb2Rlcy5jbXBbZS5vcF1bZS5pbnB1dFR5cGVdXVxuICAgIGNhc2UgXCJjYWxsXCI6XG4gICAgICBpZiAoaXhbZS50YXJnZXRdID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBmdW5jdGlvbiAke2UudGFyZ2V0fWApXG4gICAgICByZXR1cm4gWy4uLmUuYXJncy5mbGF0TWFwKGFyZyA9PiBjb21waWxlRXhwcihhcmcsIGl4KSksIDB4MTAsIC4uLnUzMihpeFtlLnRhcmdldF0hKV1cbiAgICBjYXNlIFwiaWZcIjogcmV0dXJuIFsuLi5jb21waWxlRXhwcihlLmNvbmQsIGl4KSwgMHgwNCwgY29kZXMudHlwZVtlLnR5cGVdLCAuLi5jb21waWxlRXhwcihlLnRoZW4sIGl4KSwgMHgwNSwgLi4uY29tcGlsZUV4cHIoZS5lbHNlLCBpeCksIDB4MGJdXG4gICAgZGVmYXVsdDogcmV0dXJuIGRpZShlKVxuICB9XG59XG5cbmNvbnN0IGNvbXBpbGVTdG10ID0gKHM6IFN0bXQsIGl4OiBSZWNvcmQ8bnVtYmVyLCBudW1iZXI+KTogbnVtYmVyW10gPT4ge1xuICBzd2l0Y2ggKHMua2luZCkge1xuICAgIGNhc2UgXCJsb2NhbC5zZXRcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy52YWx1ZSwgaXgpLCAweDIxLCAuLi51MzIoaXhbcy5sb2NhbF0hKV1cbiAgICBjYXNlIFwiaWZcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy5jb25kLCBpeCksIDB4MDQsIDB4NDAsIC4uLmZsYXRNYXAocy50aGVuLCB4ID0+IGNvbXBpbGVTdG10KHgsIGl4KSksIC4uLihzLmVsc2UubGVuZ3RoID8gWzB4MDUsIC4uLmZsYXRNYXAocy5lbHNlLCB4ID0+IGNvbXBpbGVTdG10KHgsIGl4KSldIDogW10pLCAweDBiXVxuICAgIGNhc2UgXCJ3aGlsZVwiOlxuICAgICAgcmV0dXJuIFsweDAyLCAweDQwLCAweDAzLCAweDQwLCAuLi5jb21waWxlRXhwcihzLmNvbmQsIGl4KSwgMHg0NSwgMHgwZCwgLi4udTMyKDEpLCAuLi5mbGF0TWFwKHMuYm9keSwgeCA9PiBjb21waWxlU3RtdCh4LCBpeCkpLCAweDBjLCAuLi51MzIoMCksIDB4MGIsIDB4MGJdXG4gICAgY2FzZSBcInJldHVyblwiOlxuICAgICAgcmV0dXJuIFsuLi5jb21waWxlRXhwcihzLnZhbHVlLCBpeCksIDB4MGZdXG4gICAgY2FzZSBcImV4cHJcIjpcbiAgICAgIHJldHVybiBbLi4uY29tcGlsZUV4cHIocy5leHByLCBpeCksIDB4MWFdXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkaWUocylcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29tcGlsZU1vZHVsZSA9IDxUIGV4dGVuZHMgTW9kdWxlRGVmcz4oZGVmczogVCkgPT4ge1xuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZGVmcykgYXMgW2tleW9mIFQgJiBzdHJpbmcsIFRba2V5b2YgVF1dW11cbiAgY29uc3QgZnggPSBPYmplY3QuZnJvbUVudHJpZXMoZW50cmllcy5tYXAoKFssIGRlZl0sIGkpID0+IFtkZWYuaWQsIGldKSkgYXMgUmVjb3JkPG51bWJlciwgbnVtYmVyPlxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW1xuICAgIC4uLm1hZ2ljLFxuICAgIC4uLnNlY3Rpb24oMHgwMSwgWy4uLnUzMihlbnRyaWVzLmxlbmd0aCksIC4uLmVudHJpZXMuZmxhdE1hcCgoWywgZl0pID0+IFsweDYwLCAuLi51MzIoZi5wYXJhbXMubGVuZ3RoKSwgLi4uZi5wYXJhbXMubWFwKHQgPT4gY29kZXMudHlwZVt0XSksIDB4MDEsIGNvZGVzLnR5cGVbZi5yZXN1bHRdXSldKSxcbiAgICAuLi5zZWN0aW9uKDB4MDMsIFsuLi51MzIoZW50cmllcy5sZW5ndGgpLCAuLi5lbnRyaWVzLmZsYXRNYXAoKF8sIGkpID0+IHUzMihpKSldKSxcbiAgICAuLi5zZWN0aW9uKDB4MDcsIFsuLi51MzIoZW50cmllcy5sZW5ndGgpLCAuLi5lbnRyaWVzLmZsYXRNYXAoKFtuYW1lXSwgaSkgPT4gWy4uLnN0cihuYW1lKSwgMHgwMCwgLi4udTMyKGkpXSldKSxcbiAgICAuLi5zZWN0aW9uKDB4MGEsIFsuLi51MzIoZW50cmllcy5sZW5ndGgpLCAuLi5lbnRyaWVzLmZsYXRNYXAoKFssIGZdKSA9PiB7XG4gICAgICBpZiAoIWYuYnVpbGQpIHRocm93IG5ldyBFcnJvcihgRnVuY3Rpb24gJHtmLmlkfSBoYXMgbm8gaW1wbGVtZW50YXRpb25gKVxuICAgICAgY29uc3QgcGFyYW1zID0gZi5wYXJhbXMubWFwKHR5cGUgPT4gbG9jYWxFeHByKHR5cGUsIG5leHRMb2NhbElkKyspKSBhcyBFeHByPE51bVR5cGU+W11cbiAgICAgIGNvbnN0IHBhcmFtSWRzID0gcGFyYW1zLm1hcChwID0+IHAua2luZCA9PT0gXCJsb2NhbC5nZXRcIiA/IHAubG9jYWwgOiAtMSlcbiAgICAgIGNvbnN0IGJ1aWx0ID0gZi5idWlsZCguLi5wYXJhbXMpXG4gICAgICBjb25zdCBsb2NhbHMgPSBuZXcgTWFwPG51bWJlciwgTnVtVHlwZT4oKVxuICAgICAgQXJyYXkuaXNBcnJheShidWlsdCkgPyBidWlsdC5mb3JFYWNoKHMgPT4gY29sbGVjdExvY2Fsc1N0bXQocywgbG9jYWxzKSkgOiBjb2xsZWN0TG9jYWxzRXhwcihidWlsdCwgbG9jYWxzKVxuICAgICAgcGFyYW1JZHMuZm9yRWFjaChpZCA9PiBsb2NhbHMuZGVsZXRlKGlkKSlcbiAgICAgIGNvbnN0IGxvY2FsRW50cmllcyA9IFsuLi5sb2NhbHMuZW50cmllcygpXVxuICAgICAgY29uc3QgbHggPSBPYmplY3QuZnJvbUVudHJpZXMoWy4uLnBhcmFtSWRzLm1hcCgoaWQsIGkpID0+IFtpZCwgaV0pLCAuLi5sb2NhbEVudHJpZXMubWFwKChbaWRdLCBpKSA9PiBbaWQsIGYucGFyYW1zLmxlbmd0aCArIGldKV0pIGFzIFJlY29yZDxudW1iZXIsIG51bWJlcj5cbiAgICAgIGNvbnN0IGRlY2xzID0gWyAuLi5mbGF0TWFwKGxvY2FsRW50cmllcywgKFssIHR5cGVdKSA9PiBbLi4udTMyKDEpLCBjb2Rlcy50eXBlW3R5cGVdXSkgXVxuICAgICAgY29uc3QgY29kZSA9IEFycmF5LmlzQXJyYXkoYnVpbHQpID8gZmxhdE1hcChidWlsdCwgcyA9PiBjb21waWxlU3RtdChzLCBseCkpIDogY29tcGlsZUV4cHIoYnVpbHQsIGx4KVxuICAgICAgY29uc3QgYm9keSA9IFsuLi51MzIobG9jYWxFbnRyaWVzLmxlbmd0aCksIC4uLmRlY2xzLCAuLi5jb2RlLCAweDBiXVxuICAgICAgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XVxuICAgIH0pXSksXG4gIF0pXG59XG5cbmV4cG9ydCBjb25zdCBjb21waWxlID0gYXN5bmMgPFQgZXh0ZW5kcyBNb2R1bGVEZWZzPihkZWZzOiBUKSA9PlxuICAoYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUoYXdhaXQgV2ViQXNzZW1ibHkuY29tcGlsZShVaW50OEFycmF5LmZyb20oY29tcGlsZU1vZHVsZShkZWZzKSkuYnVmZmVyKSkpLmV4cG9ydHMgYXMgRXhwb3J0QnVuZGxlPFQ+XG4iLAogICAgIlxuaW1wb3J0IHR5cGUgeyBKc29uRGF0YSB9IGZyb20gXCIuLi9zY2hlbWFcIjtcbmV4cG9ydCBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuY29uc3QgY29sb3JQYWxldHRlID0ge1xuICBsaWdodDp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiIzAwMFwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiNmZmZcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMjQyLCA1NSwgNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDU3LCAyMTQsIDM5KVwiLFxuICAgIGJsdWU6ICAgICAgICAgICAgICBcInJnYig1LCAyOCwgMTQxKVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYigyMSwgMTM3LCAyMzkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzg4OFwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiNlNWU1ZTVcIixcbiAgfSxcbiAgZGFyazp7XG4gICAgY29sb3I6ICAgICAgICAgICAgIFwiI2ZmZlwiLFxuICAgIGJhY2tncm91bmQ6ICAgICAgICBcIiMyMjJcIixcbiAgICByZWQ6ICAgICAgICAgICAgICAgXCJyZ2IoMTk4LCAyMCwgMClcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoOTUsIDE1OSwgMjU1KVwiLFxuICAgIGxpZ2h0Ymx1ZTogICAgICAgICBcInJnYig5NSwgMTAwLCAyNTUpXCIsXG4gICAgZ3JlZW46ICAgICAgICAgICAgIFwicmdiKDAsIDE4NSwgMTkpXCIsXG4gICAgZ3JheTogICAgICAgICAgICAgIFwiIzU2NTY1NlwiLFxuICAgIGxpZ2h0Z3JheTogICAgICAgICBcIiM0MTQxNDFcIixcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgY29sb3IgPSB7XG4gIGNvbG9yOiBcInZhcigtLWNvbG9yKVwiLFxuICBiYWNrZ3JvdW5kOiBcInZhcigtLWJhY2tncm91bmQpXCIsXG4gIGJsdWU6IFwidmFyKC0tYmx1ZSlcIixcbiAgbGlnaHRCbHVlOiBcInZhcigtLWxpZ2h0Ymx1ZSlcIixcbiAgcmVkOiBcInZhcigtLXJlZClcIixcbiAgZ3JlZW46IFwidmFyKC0tZ3JlZW4pXCIsXG4gIGdyYXk6IFwidmFyKC0tZ3JheSlcIixcbiAgbGlnaHRncmF5OiBcInZhcigtLWxpZ2h0Z3JheSlcIlxufVxuXG5cbmxldCBzdHlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5zdHlsLmlubmVySFRNTCA9IGBcbjpyb290IHtcbiAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUuZGFyay5jb2xvcn07XG4gIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUuZGFyay5iYWNrZ3JvdW5kfTtcbiAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmRhcmsucmVkfTtcbiAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUuZGFyay5ncmVlbn07XG4gIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUuZGFyay5ibHVlfTtcbiAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5kYXJrLmdyYXl9O1xuICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5saWdodGdyYXl9O1xuICBjb2xvcjogdmFyKC0tY29sb3IpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kKTtcbiAgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICA6cm9vdCB7XG4gICAgLS1jb2xvcjogJHtjb2xvclBhbGV0dGUubGlnaHQuY29sb3J9O1xuICAgIC0tYmFja2dyb3VuZDogJHtjb2xvclBhbGV0dGUubGlnaHQuYmFja2dyb3VuZH07XG4gICAgLS1yZWQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LnJlZH07XG4gICAgLS1ncmVlbjogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JlZW59O1xuICAgIC0tYmx1ZTogJHtjb2xvclBhbGV0dGUubGlnaHQuYmx1ZX07XG4gICAgLS1ncmF5OiAke2NvbG9yUGFsZXR0ZS5saWdodC5ncmF5fTtcbiAgICAtLWxpZ2h0Z3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQubGlnaHRncmF5fTtcbiAgfVxufVxuYFxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsKVxuXG5leHBvcnQgdHlwZSBodG1sS2V5ID0gJ2lubmVyVGV4dCd8J29uY2xpY2snIHwgJ29uaW5wdXQnIHwgJ29ua2V5ZG93bicgfCAnb25tb3VzZWVudGVyJyB8ICdvbm1vdXNlb3ZlcicgfCAnb25tb3VzZWV4aXQnIHwnY2hpbGRyZW4nfCdjbGFzcyd8J2lkJ3wnY29udGVudEVkaXRhYmxlJ3wnZXZlbnRMaXN0ZW5lcnMnfCdjb2xvcid8J2JhY2tncm91bmQnIHwgJ3N0eWxlJyB8ICdwbGFjZWhvbGRlcicgfCAndGFiSW5kZXgnIHwgJ2NvbFNwYW4nIHwgJ3R5cGUnXG5leHBvcnQgY29uc3QgaHRtbEVsZW1lbnQgPSAodGFnOnN0cmluZywgdGV4dDpzdHJpbmcsIGFyZ3M/OlBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+KTpIVE1MRWxlbWVudCA9PntcblxuICBjb25zdCBfZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKVxuICBfZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgbGV0IHN0ID0gX2VsZW1lbnQuc3R5bGVcbiAgaWYgKHRhZyA9PSBcImJ1dHRvblwiKXtcbiAgICBfZWxlbWVudC5pbm5lclRleHQgPSB0ZXh0XG4gICAgc3QuY29sb3IgPSBjb2xvci5jb2xvclxuICAgIHN0LmJhY2tncm91bmRDb2xvciA9IGNvbG9yLmxpZ2h0Z3JheVxuICAgIHN0LmJvcmRlciA9IFwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXlcbiAgICBzdC5ib3JkZXJSYWRpdXMgPSBcIi4yZW1cIlxuICAgIHN0LnBhZGRpbmcgPSBcIi4xZW0gLjRlbVwiXG4gICAgc3QubWFyZ2luID0gXCIuMmVtXCJcbiAgfVxuICBpZiAoYXJncykgT2JqZWN0LmVudHJpZXMoYXJncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKT0+e1xuICAgIGlmIChrZXkgPT09ICdwYXJlbnQnKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudCkuYXBwZW5kQ2hpbGQoX2VsZW1lbnQpXG4gICAgfVxuICAgIGlmIChrZXk9PT0nY2hpbGRyZW4nKXtcbiAgICAgICh2YWx1ZSBhcyBIVE1MRWxlbWVudFtdKS5mb3JFYWNoKGM9Pl9lbGVtZW50LmFwcGVuZENoaWxkKGMpKVxuICAgIH1lbHNlIGlmIChrZXk9PT0nZXZlbnRMaXN0ZW5lcnMnKXtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIChlOkV2ZW50KT0+dm9pZD4pLmZvckVhY2goKFtldmVudCwgbGlzdGVuZXJdKT0+e1xuICAgICAgICBfZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcilcbiAgICAgIH0pXG4gICAgfWVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJyl7XG4gICAgICBPYmplY3QuYXNzaWduKF9lbGVtZW50LnN0eWxlLCB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVxuICAgIH1lbHNle1xuICAgICAgX2VsZW1lbnRbKGtleSBhcyAnaW5uZXJUZXh0JyB8ICdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdpZCcgfCAnY29udGVudEVkaXRhYmxlJyldID0gdmFsdWVcbiAgICB9XG4gIH0pXG4gIHJldHVybiBfZWxlbWVudFxufVxuXG5leHBvcnQgdHlwZSBIVE1MQXJnID0gc3RyaW5nIHwgbnVtYmVyIHwgSFRNTEVsZW1lbnQgfCBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiAgfCBQcm9taXNlPEhUTUxBcmc+IHwgSFRNTEFyZ1tdIHwgRnVuY3Rpb25cbmV4cG9ydCBjb25zdCBodG1sID0gKHRhZzpzdHJpbmcsIC4uLmNzOkhUTUxBcmdbXSk6SFRNTEVsZW1lbnQ9PntcbiAgbGV0IGNoaWxkcmVuOiBIVE1MRWxlbWVudFtdID0gW11cbiAgbGV0IGFyZ3M6IFBhcnRpYWw8UmVjb3JkPGh0bWxLZXksIGFueT4+ID0ge31cblxuICBjb25zdCBhZGRfYXJnID0gKGFyZzpIVE1MQXJnKT0+e1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnKSlcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykgY2hpbGRyZW4ucHVzaChodG1sRWxlbWVudChcInNwYW5cIiwgYXJnLnRvU3RyaW5nKCkpKVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIFByb21pc2Upe1xuICAgICAgY29uc3QgZWwgPSBzcGFuKFwiLi4uXCIpXG4gICAgICBhcmcudGhlbigodmFsdWUpPT57XG4gICAgICAgIGVsLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoc3Bhbih2YWx1ZSkpXG4gICAgICB9KVxuICAgICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICB9XG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIGNoaWxkcmVuLnB1c2goYXJnKVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkgYXJnLmZvckVhY2goeD0+YWRkX2FyZyh4KSlcbiAgICAvLyBlbHNlIGlmICgnZ2V0JyBpbiBhcmcgJiYgdHlwZW9mIGFyZy5nZXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyAgIGNvbnN0IGVsID0gc3BhbigpXG4gICAgLy8gICBjaGlsZHJlbi5wdXNoKGVsKVxuICAgIC8vICAgaWYgKCdvbnVwZGF0ZScgaW4gYXJnICYmIHR5cGVvZiBhcmcub251cGRhdGUgPT09ICdmdW5jdGlvbicpIGFyZy5vbnVwZGF0ZSh4PT5lbC5yZXBsYWNlQ2hpbGRyZW4oeCkpXG4gICAgLy8gfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgIGlmIChhcmcubmFtZSA9PSBcIm9uaW5wdXRcIikgYXJncy5vbmlucHV0ID0gYXJnXG4gICAgICBlbHNlIGlmIChhcmcubmFtZSA9PSBcIm9uY2xpY2tcIiB8fCBhcmcubGVuZ3RoIDwgMikgYXJncy5vbmNsaWNrID0gYXJnXG4gICAgICBlbHNlIGNvbnNvbGUud2FybihcIkZ1bmN0aW9uIGFyZ3VtZW50IHdpdGhvdXQgbmFtZSBvciB3aXRoIG1vcmUgdGhhbiBvbmUgcGFyYW1ldGVyIGlzIGlnbm9yZWQgaW4gaHRtbCBnZW5lcmF0b3JcIilcbiAgICB9XG4gICAgZWxzZSBhcmdzID0gey4uLmFyZ3MsIC4uLmFyZ31cbiAgfVxuICBjcy5mb3JFYWNoKGFkZF9hcmcpXG4gIHJldHVybiBodG1sRWxlbWVudCh0YWcsIFwiXCIsIHsuLi5hcmdzLCBjaGlsZHJlbn0pXG59XG5cbmV4cG9ydCB0eXBlIEhUTUxHZW5lcmF0b3I8VCBleHRlbmRzIEhUTUxFbGVtZW50ID0gSFRNTEVsZW1lbnQ+ID0gKC4uLmNzOkhUTUxBcmdbXSkgPT4gVFxuY29uc3QgbmV3SHRtbEdlbmVyYXRvciA9IDxUIGV4dGVuZHMgSFRNTEVsZW1lbnQ+KHRhZzpzdHJpbmcpPT4oLi4uY3M6SFRNTEFyZ1tdKTpUPT5odG1sKHRhZywgLi4uY3MpIGFzIFRcblxuZXhwb3J0IGNvbnN0IHA6SFRNTEdlbmVyYXRvcjxIVE1MUGFyYWdyYXBoRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicFwiKVxuZXhwb3J0IGNvbnN0IGE6SFRNTEdlbmVyYXRvcjxIVE1MQW5jaG9yRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiYVwiKVxuZXhwb3J0IGNvbnN0IGgxOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMVwiKVxuZXhwb3J0IGNvbnN0IGgyOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoMlwiKVxuZXhwb3J0IGNvbnN0IGgzOkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoM1wiKVxuZXhwb3J0IGNvbnN0IGg0OkhUTUxHZW5lcmF0b3I8SFRNTEhlYWRpbmdFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJoNFwiKVxuXG5leHBvcnQgY29uc3QgZGl2OkhUTUxHZW5lcmF0b3I8SFRNTERpdkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImRpdlwiKVxuZXhwb3J0IGNvbnN0IHByZTpIVE1MR2VuZXJhdG9yPEhUTUxQcmVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJwcmVcIilcbmV4cG9ydCBjb25zdCBzcGFuOkhUTUxHZW5lcmF0b3I8SFRNTFNwYW5FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJzcGFuXCIpXG5leHBvcnQgY29uc3QgdGV4dGFyZWE6SFRNTEdlbmVyYXRvcjxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0ZXh0YXJlYVwiKVxuXG5leHBvcnQgY29uc3QgYnV0dG9uOkhUTUxHZW5lcmF0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImJ1dHRvblwiKVxuLy8gZXhwb3J0IGNvbnN0IHRhYmxlID0gKHJvd3M6IEhUTUxBcmdbXVtdLCAuLi5hcmdzOiBIVE1MQXJnW10pID0+IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKSggc3R5bGUoe2JvcmRlclNwYWNpbmc6IFwiMWVtIC40ZW1cIn0pICwgcm93cy5tYXAoY2VsbHM9PnRyKGNlbGxzLm1hcChjZWxsPT50ZChjZWxsKSkpKSwgLi4uYXJncylcbmV4cG9ydCBjb25zdCB0YWJsZTpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRhYmxlXCIpXG5cbmV4cG9ydCBjb25zdCB0cjpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZVJvd0VsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRyXCIpXG5leHBvcnQgY29uc3QgdGQ6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGRcIilcbmV4cG9ydCBjb25zdCB0aDpIVE1MR2VuZXJhdG9yPEhUTUxUYWJsZUNlbGxFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0aFwiKVxuZXhwb3J0IGNvbnN0IGNhbnZhczpIVE1MR2VuZXJhdG9yPEhUTUxDYW52YXNFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJjYW52YXNcIilcblxuZXhwb3J0IGNvbnN0IHN0eWxlID0gKC4uLnJ1bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+W10pID0+ICh7c3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIC4uLnJ1bGVzKX0pXG5leHBvcnQgY29uc3QgbWFyZ2luID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHttYXJnaW46IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBwYWRkaW5nID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtwYWRkaW5nOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXI6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBib3JkZXJSYWRpdXMgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2JvcmRlclJhZGl1czogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IHdpZHRoID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHt3aWR0aDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGhlaWdodCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7aGVpZ2h0OiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgZGlzcGxheSA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7ZGlzcGxheTogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJhY2tncm91bmQgPSAodmFsdWU6IHN0cmluZyA9IFwidmFyKC0tYmFja2dyb3VuZClcIikgPT4gc3R5bGUoe2JhY2tncm91bmQ6IHZhbHVlfSlcblxuZXhwb3J0IGNvbnN0IGlucHV0OkhUTUxHZW5lcmF0b3I8SFRNTElucHV0RWxlbWVudD4gPSAoLi4uY3MpPT57XG4gIGNvbnN0IGNvbnRlbnQgPSBjcy5maWx0ZXIoYz0+dHlwZW9mIGMgPT0gJ3N0cmluZycpLmpvaW4oJyAnKVxuICBjb25zdCBlbCA9IGh0bWwoXCJpbnB1dFwiLCAuLi5jcykgYXMgSFRNTElucHV0RWxlbWVudFxuICBlbC52YWx1ZSA9IGNvbnRlbnRcbiAgcmV0dXJuIGVsXG59XG5cblxuZXhwb3J0IGNvbnN0IHBvcHVwID0gKC4uLmNzOkhUTUxBcmdbXSk9PntcbiAgY29uc3QgZGlhbG9nZmllbGQgPSBkaXYoe1xuICAgIHN0eWxlOiB7XG4gICAgICBiYWNrZ3JvdW5kOiBjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgY29sb3I6IGNvbG9yLmNvbG9yLFxuICAgICAgcGFkZGluZzogXCIxZW0gNGVtXCIsXG4gICAgICBwYWRkaW5nQm90dG9tOiBcIjJlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjFlbVwiLFxuICAgICAgekluZGV4OiBcIjIwMDBcIixcbiAgICAgIG92ZXJmbG93WTogXCJzY3JvbGxcIixcbiAgICAgIG1pbldpZHRoOiBcIjIwdndcIixcbiAgICAgIG1heEhlaWdodDogXCI4MHZoXCIsXG4gICAgfX0sXG4gICAgLi4uY3MpXG5cbiAgY29uc3QgcG9wdXBiYWNrZ3JvdW5kID0gZGl2KFxuICAgIHtzdHlsZTp7XG4gICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgdG9wOiBcIjBcIixcbiAgICAgIGxlZnQ6IFwiMFwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IFwicmdiYSgxNjYsIDE2NiwgMTY2LCAwLjUpXCIsXG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgfX1cbiAgKVxuXG4gIHBvcHVwYmFja2dyb3VuZC5hcHBlbmRDaGlsZChkaWFsb2dmaWVsZCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocG9wdXBiYWNrZ3JvdW5kKTtcbiAgcG9wdXBiYWNrZ3JvdW5kLm9uY2xpY2sgPSAoKSA9PiB7cG9wdXBiYWNrZ3JvdW5kLnJlbW92ZSgpOyB9XG4gIGRpYWxvZ2ZpZWxkLm9uY2xpY2sgPSAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgcmV0dXJuIHBvcHVwYmFja2dyb3VuZFxuXG59XG5cbmV4cG9ydCBjb25zdCBlcnJvcnBvcHVwID0gKGU6RXJyb3IgfCBzdHJpbmcpID0+e1xuICBwb3B1cChkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDpjb2xvci5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOlwiMXB4IHNvbGlkIFwiK2NvbG9yLmdyYXksXG4gICAgICBwYWRkaW5nOlwiMWVtXCIsXG4gICAgICBib3JkZXJSYWRpdXM6XCIuNGVtXCIsXG4gICAgICBjb2xvcjpjb2xvci5yZWQsXG4gICAgfSksXG4gICAgaDIoXCJFcnJvclwiKSxcbiAgICBwKFN0cmluZyhlKSlcbiAgKSlcbiAgdGhyb3cgKGUgaW5zdGFuY2VvZiBFcnJvcikgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbmVsTGlzdChpdGVtczoge3RpdGxlOiBIVE1MQXJnLCBjb250ZW50OiBIVE1MQXJnfVtdKXtcbiAgcmV0dXJuIGRpdihcbiAgICBzdHlsZSh7XG4gICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgIGZsZXhEaXJlY3Rpb246IFwiY29sdW1uXCIsXG4gICAgICBnYXA6IFwiMWVtXCIsXG4gICAgfSksXG4gICAgLi4uaXRlbXMubWFwKGY9PmRpdihcbiAgICAgIHN0eWxlKHtcbiAgICAgICAgYm9yZGVyOiBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiLjRlbVwiLFxuICAgICAgICBwYWRkaW5nOiBcIi41ZW0gMWVtXCIsXG4gICAgICB9KSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICAgICAgICAgIGN1cnNvcjogXCJwb2ludGVyXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLnRpdGxlXG4gICAgICApLFxuICAgICAgZGl2KFxuICAgICAgICBzdHlsZSh7XG4gICAgICAgICAgbWFyZ2luVG9wOiBcIi41ZW1cIixcbiAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSksXG4gICAgICAgIGYuY29udGVudFxuICAgICAgKVxuICAgICkpXG4gIClcbn1cblxuXG5cblxuIiwKICAgICJpbXBvcnQgeyBjb21waWxlLCBmdW5jLCBpMzIsIGlmU3RtdCwgbG9jYWwsIHJldCwgd2hpbGVMb29wIH0gZnJvbSBcIi4uL3dhc21cIjtcbmltcG9ydCB7IGJvZHksIGgyLCBwIH0gZnJvbSBcIi4vaHRtbFwiO1xuXG5jb25zdCBmaWIgPSBmdW5jKFtcImkzMlwiXSwgXCJpMzJcIiwgbiA9PiB7XG4gIGNvbnN0IGEgPSBsb2NhbC5pMzIoKVxuICBjb25zdCBiID0gbG9jYWwuaTMyKClcbiAgY29uc3QgaSA9IGxvY2FsLmkzMigpXG4gIGNvbnN0IG5leHQgPSBsb2NhbC5pMzIoKVxuICByZXR1cm4gW1xuICAgIGlmU3RtdChuLmx0KDIpLCBbcmV0KGkzMigxKSldKSxcbiAgICBhLnNldCgxKSxcbiAgICBiLnNldCgxKSxcbiAgICBpLnNldCgyKSxcbiAgICB3aGlsZUxvb3AoaS5nZXQoKS5sdChuLmFkZCgxKSksIFtcbiAgICAgIG5leHQuc2V0KGEuZ2V0KCkuYWRkKGIuZ2V0KCkpKSxcbiAgICAgIGEuc2V0KGIpLFxuICAgICAgYi5zZXQobmV4dCksXG4gICAgICBpLnNldChpLmdldCgpLmFkZCgxKSksXG4gICAgXSksXG4gICAgcmV0KGIpLFxuICBdXG59KVxuXG5jb25zdCB3YXMgPSBhd2FpdCBjb21waWxlKHsgZmliIH0pXG5jb25zdCBuID0gNFxuXG5jb25zdCByZXMgPSB3YXMuZmliKG4pXG5cbmJvZHkuYXBwZW5kKFxuICBoMihcIndhc21cIiksXG4gIHAoYGZpYiAke259ID0gJHtTdHJpbmcocmVzKX1gKSxcbilcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxJQUFNLFFBQVEsQ0FBQyxHQUFNLElBQU0sS0FBTSxLQUFNLEdBQU0sR0FBTSxHQUFNLENBQUk7QUFrRTdELElBQU0sUUFBUTtBQUFBLEVBQ1osTUFBTSxFQUFFLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssSUFBSztBQUFBLEVBQ25ELEtBQUs7QUFBQSxJQUNILEtBQUssRUFBRSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLElBQUs7QUFBQSxJQUNsRCxLQUFLLEVB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QUM7QUFBQSxJQUNQLEVBQUUsSUFBSSxDQUFDO0FBQUEsSUFDUCxFQUFFLElBQUksQ0FBQztBQUFBLElBQ1AsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRztBQUFBLE1BQzlCLEtBQUssSUFBSSxHQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFBQSxNQUM3QixHQUFFLElBQUksQ0FBQztBQUFBLE1BQ1AsRUFBRSxJQUFJLElBQUk7QUFBQSxNQUNWLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUFBLElBQ3RCLENBQUM7QUFBQSxJQUNELElBQUksQ0FBQztBQUFBLEVBQ1A7QUFBQSxDQUNEO0FBRUQsSUFBTSxNQUFNLE1BQU0sUUFBUSxFQUFFLElBQUksQ0FBQztBQUNqQyxJQUFNLElBQUk7QUFFVixJQUFNLE1BQU0sSUFBSSxJQUFJLENBQUM7QUFFckIsS0FBSyxPQUNILEdBQUcsTUFBTSxHQUNULEVBQUUsT0FBTyxPQUFPLE9BQU8sR0FBRyxHQUFHLENBQy9COyIsCiAgImRlYnVnSWQiOiAiMTM4QUFEMkY3OTU4QzExMjY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
