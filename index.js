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
var lit = (type, value) => typeof value === "object" && value !== null && ("kind" in value) ? value : expr({ kind: "const", type, value });
var bin = (op, left, right) => expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) });
var cmp = (op, left, right) => expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) });
var ifElse = (cond, then, else_) => expr({ kind: "if", type: then.type, cond, then, else: else_ });
var i32 = (n) => expr({ kind: "const", type: "i32", value: n });
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
      return [32, ...u32(e.index)];
    case "bin":
      return [...compileExpr(e.left, ix), ...compileExpr(e.right, ix), codes.bin[e.op][e.type]];
    case "cmp":
      return [...compileExpr(e.left, ix), ...compileExpr(e.right, ix), codes.cmp[e.op][e.inputType]];
    case "call":
      if (ix[e.name] == null)
        throw new Error(`Unknown function ${e.name}`);
      return [...e.args.flatMap((arg) => compileExpr(arg, ix)), 16, ...u32(ix[e.name])];
    case "if":
      return [...compileExpr(e.cond, ix), 4, codes.type[e.type], ...compileExpr(e.then, ix), 5, ...compileExpr(e.else, ix), 11];
    default:
      return die(e);
  }
};
var compileModule = (functions) => {
  const entries = Object.entries(functions);
  const ix = Object.fromEntries(entries.map(([name], i) => [name, i]));
  return new Uint8Array([
    ...magic,
    ...section(1, [...u32(entries.length), ...entries.flatMap(([, f]) => [96, ...u32(f.params.length), ...f.params.map((t) => codes.type[t]), 1, codes.type[f.result]])]),
    ...section(3, [...u32(entries.length), ...entries.flatMap((_, i) => u32(i))]),
    ...section(7, [...u32(entries.length), ...entries.flatMap(([name], i) => [...str(name), 0, ...u32(i)])]),
    ...section(10, [...u32(entries.length), ...entries.flatMap(([, f]) => {
      const body = [0, ...compileExpr(f.body, ix), 11];
      return [...u32(body.length), ...body];
    })])
  ]);
};
var instantiateModule = async (mod) => (await WebAssembly.instantiate(await WebAssembly.compile(Uint8Array.from(compileModule(mod)).buffer))).exports;
async function mkModule(build) {
  const builder = new Proxy({
    func(params, result, fn) {
      return { __fn: true, params, result, build: fn };
    }
  }, {
    get(target, prop, receiver) {
      if (prop in target)
        return Reflect.get(target, prop, receiver);
      return (...args) => expr({ kind: "call", type: sigs[prop].result, name: prop, args });
    }
  });
  const decls = build(builder);
  const sigs = Object.fromEntries(Object.entries(decls).map(([name, def]) => {
    return [name, { params: def.params, result: def.result }];
  }));
  const impl = Object.fromEntries(Object.entries(decls).map(([name, def]) => {
    const locals = def.params.map((type, index) => expr({ kind: "local.get", type, index }));
    return [name, { params: def.params, result: def.result, body: def.build(...locals) }];
  }));
  return instantiateModule(impl);
}
var mod = await mkModule((m) => ({
  add: m.func(["i32", "i32"], "i32", (x, y) => x.add(y)),
  isEven: m.func(["i32"], "i32", (n) => ifElse(n.eq(0), i32(1), m.isOdd(n.sub(1)))),
  isOdd: m.func(["i32"], "i32", (n) => ifElse(n.eq(0), i32(0), m.isEven(n.sub(1))))
}));
var instance = mod;

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
var res = instance.add(2, 3);
var even = instance.isEven(8);
var odd = instance.isOdd(9);
body.append(h2("wasm baseline: ", String(res), " even(8): ", String(even), " odd(9): ", String(odd)));

//# debugId=061656DDBFC9DF4C64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3dhc20udHMiLCAic3JjL3ZpZXcvaHRtbC50cyIsICJzcmMvdmlldy9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgImNvbnN0IG1hZ2ljID0gWzB4MDAsIDB4NjEsIDB4NzMsIDB4NmQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4MDBdXG5cblxuXG5cbmV4cG9ydCB0eXBlIE51bVR5cGUgPSBcImkzMlwiIHwgXCJpNjRcIiB8IFwiZjMyXCIgfCBcImY2NFwiXG5leHBvcnQgdHlwZSBCaW5PcCA9IFwiYWRkXCIgfCBcInN1YlwiIHwgXCJtdWxcIiB8IFwiZGl2XCJcbmV4cG9ydCB0eXBlIENtcE9wID0gXCJlcVwiIHwgXCJsdFwiIHwgXCJndFwiXG50eXBlIFZhbHVlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IFQgZXh0ZW5kcyBcImk2NFwiID8gYmlnaW50IDogbnVtYmVyXG5cbmV4cG9ydCB0eXBlIEZ1bmNTaWc8QXJncyBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUmV0IGV4dGVuZHMgTnVtVHlwZT4gPSB7IHBhcmFtczogQXJncywgcmVzdWx0OiBSZXQgfVxudHlwZSBTaWdzID0gUmVjb3JkPHN0cmluZywgRnVuY1NpZzxyZWFkb25seSBOdW1UeXBlW10sIE51bVR5cGU+PlxudHlwZSBBcmdzRXhwcjxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gRXhwcjxBcmdzW0tdPiA6IG5ldmVyIH1cbnR5cGUgQXJnc1ZhbDxBcmdzIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdPiA9IHsgW0sgaW4ga2V5b2YgQXJnc106IEFyZ3NbS10gZXh0ZW5kcyBOdW1UeXBlID8gVmFsdWU8QXJnc1tLXT4gOiBuZXZlciB9XG50eXBlIEV4cHJMaWtlPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IEV4cHI8VD4gfCBWYWx1ZTxUPlxuXG50eXBlIENvcmVFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9XG4gIHwgeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFQsIHZhbHVlOiBWYWx1ZTxUPiB9XG4gIHwgeyBraW5kOiBcImxvY2FsLmdldFwiLCB0eXBlOiBULCBpbmRleDogbnVtYmVyIH1cbiAgfCB7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IFQsIG9wOiBCaW5PcCwgbGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHI8VD4gfVxuICB8IHsga2luZDogXCJjYWxsXCIsIHR5cGU6IFQsIG5hbWU6IHN0cmluZywgYXJnczogRXhwcjxOdW1UeXBlPltdIH1cbiAgfCB7IGtpbmQ6IFwiaWZcIiwgdHlwZTogVCwgY29uZDogRXhwcjxcImkzMlwiPiwgdGhlbjogRXhwcjxUPiwgZWxzZTogRXhwcjxUPiB9XG4gIHwgKFQgZXh0ZW5kcyBcImkzMlwiID8geyBraW5kOiBcImNtcFwiLCB0eXBlOiBcImkzMlwiLCBpbnB1dFR5cGU6IE51bVR5cGUsIG9wOiBDbXBPcCwgbGVmdDogRXhwcjxOdW1UeXBlPiwgcmlnaHQ6IEV4cHI8TnVtVHlwZT4gfSA6IG5ldmVyKVxuXG5leHBvcnQgdHlwZSBFeHByPFQgZXh0ZW5kcyBOdW1UeXBlPiA9IENvcmVFeHByPFQ+ICYge1xuICBhZGQocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBzdWIocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBtdWwocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBkaXYocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxUPlxuICBlcShyaWdodDogRXhwckxpa2U8VD4pOiBFeHByPFwiaTMyXCI+XG4gIGx0KHJpZ2h0OiBFeHByTGlrZTxUPik6IEV4cHI8XCJpMzJcIj5cbiAgZ3QocmlnaHQ6IEV4cHJMaWtlPFQ+KTogRXhwcjxcImkzMlwiPlxufVxuXG50eXBlIEZ1bmNJbXBsPFMgZXh0ZW5kcyBGdW5jU2lnPHJlYWRvbmx5IE51bVR5cGVbXSwgTnVtVHlwZT4+ID0geyBwYXJhbXM6IFNbXCJwYXJhbXNcIl0sIHJlc3VsdDogU1tcInJlc3VsdFwiXSwgYm9keTogRXhwcjxTW1wicmVzdWx0XCJdPiB9XG50eXBlIE1vZHVsZUltcGw8VCBleHRlbmRzIFNpZ3M+ID0geyBbSyBpbiBrZXlvZiBUXTogRnVuY0ltcGw8VFtLXT4gfVxuZXhwb3J0IHR5cGUgRXhwb3J0QnVuZGxlPFQgZXh0ZW5kcyBTaWdzPiA9IHsgW0sgaW4ga2V5b2YgVF0tPzogKC4uLmFyZ3M6IEFyZ3NWYWw8VFtLXVtcInBhcmFtc1wiXT4pID0+IFZhbHVlPFRbS11bXCJyZXN1bHRcIl0+IH1cbnR5cGUgRnVuY0ZhY3Rvcnk8QSBleHRlbmRzIHJlYWRvbmx5IE51bVR5cGVbXSwgUiBleHRlbmRzIE51bVR5cGU+ID0geyBfX2ZuOiB0cnVlLCBwYXJhbXM6IEEsIHJlc3VsdDogUiwgYnVpbGQ6ICguLi5hcmdzOiByZWFkb25seSBFeHByPE51bVR5cGU+W10pID0+IEV4cHI8Uj4gfVxudHlwZSBNb2R1bGVEZWNsPFQgZXh0ZW5kcyBTaWdzPiA9IHsgW0sgaW4ga2V5b2YgVF0tPzogRnVuY0ZhY3Rvcnk8VFtLXVtcInBhcmFtc1wiXSwgVFtLXVtcInJlc3VsdFwiXT4gfVxudHlwZSBNb2R1bGVCdWlsZGVyPFQgZXh0ZW5kcyBTaWdzPiA9IHsgZnVuYzxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4oYTogQSwgcjogUiwgZm46ICguLi54OiBBcmdzRXhwcjxBPikgPT4gRXhwcjxSPik6IEZ1bmNGYWN0b3J5PEEsIFI+IH0gJiB7IFtLIGluIGtleW9mIFRdLT86ICguLi5hcmdzOiBBcmdzRXhwcjxUW0tdW1wicGFyYW1zXCJdPikgPT4gRXhwcjxUW0tdW1wicmVzdWx0XCJdPiB9XG5cbmNvbnN0IGNvZGVzID0ge1xuICB0eXBlOiB7IGkzMjogMHg3ZiwgaTY0OiAweDdlLCBmMzI6IDB4N2QsIGY2NDogMHg3YyB9IGFzIFJlY29yZDxOdW1UeXBlLCBudW1iZXI+LFxuICBiaW46IHtcbiAgICBhZGQ6IHsgaTMyOiAweDZhLCBpNjQ6IDB4N2MsIGYzMjogMHg5MiwgZjY0OiAweGEwIH0sXG4gICAgc3ViOiB7IGkzMjogMHg2YiwgaTY0OiAweDdkLCBmMzI6IDB4OTMsIGY2NDogMHhhMSB9LFxuICAgIG11bDogeyBpMzI6IDB4NmMsIGk2NDogMHg3ZSwgZjMyOiAweDk0LCBmNjQ6IDB4YTIgfSxcbiAgICBkaXY6IHsgaTMyOiAweDZkLCBpNjQ6IDB4N2YsIGYzMjogMHg5NSwgZjY0OiAweGEzIH0sXG4gIH0gYXMgUmVjb3JkPEJpbk9wLCBSZWNvcmQ8TnVtVHlwZSwgbnVtYmVyPj4sXG4gIGNtcDoge1xuICAgIGVxOiB7IGkzMjogMHg0NiwgaTY0OiAweDUxLCBmMzI6IDB4NWIsIGY2NDogMHg2MSB9LFxuICAgIGx0OiB7IGkzMjogMHg0OCwgaTY0OiAweDUzLCBmMzI6IDB4NWQsIGY2NDogMHg2MyB9LFxuICAgIGd0OiB7IGkzMjogMHg0YSwgaTY0OiAweDU1LCBmMzI6IDB4NWUsIGY2NDogMHg2NCB9LFxuICB9IGFzIFJlY29yZDxDbXBPcCwgUmVjb3JkPE51bVR5cGUsIG51bWJlcj4+LFxufVxuXG5jb25zdCBiaW5zID0gW1wiYWRkXCIsIFwic3ViXCIsIFwibXVsXCIsIFwiZGl2XCJdIGFzIGNvbnN0IHNhdGlzZmllcyByZWFkb25seSBCaW5PcFtdXG5jb25zdCBjbXBzID0gW1wiZXFcIiwgXCJsdFwiLCBcImd0XCJdIGFzIGNvbnN0IHNhdGlzZmllcyByZWFkb25seSBDbXBPcFtdXG5cbmNvbnN0IHUzMiA9IChuOiBudW1iZXIpID0+IHtcbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKG4pIHx8IG4gPCAwKSB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHVuc2lnbmVkIGludGVnZXIsIGdvdCAke259YClcbiAgY29uc3Qgb3V0OiBudW1iZXJbXSA9IFtdXG4gIGRvIHtcbiAgICBsZXQgYnl0ZSA9IG4gJiAweDdmXG4gICAgbiA+Pj49IDdcbiAgICBpZiAobikgYnl0ZSB8PSAweDgwXG4gICAgb3V0LnB1c2goYnl0ZSlcbiAgfSB3aGlsZSAobilcbiAgcmV0dXJuIG91dFxufVxuXG5jb25zdCBzTiA9ICh2YWx1ZTogbnVtYmVyIHwgYmlnaW50LCBiaXRzOiAzMiB8IDY0KSA9PiB7XG4gIGNvbnN0IG91dDogbnVtYmVyW10gPSBbXVxuICBsZXQgbiA9IGJpdHMgPT09IDMyID8gQmlnSW50KCh2YWx1ZSBhcyBudW1iZXIpIHwgMCkgOiBCaWdJbnQuYXNJbnROKDY0LCB2YWx1ZSBhcyBiaWdpbnQpXG4gIGZvciAoOzspIHtcbiAgICBsZXQgYnl0ZSA9IE51bWJlcihuICYgMHg3Zm4pXG4gICAgbiA+Pj0gN25cbiAgICBjb25zdCBkb25lID0gKG4gPT09IDBuICYmIChieXRlICYgMHg0MCkgPT09IDApIHx8IChuID09PSAtMW4gJiYgKGJ5dGUgJiAweDQwKSAhPT0gMClcbiAgICBpZiAoIWRvbmUpIGJ5dGUgfD0gMHg4MFxuICAgIG91dC5wdXNoKGJ5dGUpXG4gICAgaWYgKGRvbmUpIHJldHVybiBvdXRcbiAgfVxufVxuXG5jb25zdCBmTiA9ICh2YWx1ZTogbnVtYmVyLCBieXRlczogNCB8IDgpID0+IHtcbiAgY29uc3Qgb3V0ID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMpXG4gIGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcob3V0LmJ1ZmZlcilcbiAgYnl0ZXMgPT09IDQgPyB2aWV3LnNldEZsb2F0MzIoMCwgdmFsdWUsIHRydWUpIDogdmlldy5zZXRGbG9hdDY0KDAsIHZhbHVlLCB0cnVlKVxuICByZXR1cm4gWy4uLm91dF1cbn1cblxuY29uc3Qgc3RyID0gKHM6IHN0cmluZykgPT4ge1xuICBjb25zdCBieXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzKVxuICByZXR1cm4gWy4uLnUzMihieXRlcy5sZW5ndGgpLCAuLi5ieXRlc11cbn1cblxuY29uc3Qgc2VjdGlvbiA9IChpZDogbnVtYmVyLCBwYXlsb2FkOiBudW1iZXJbXSkgPT4gW2lkLCAuLi51MzIocGF5bG9hZC5sZW5ndGgpLCAuLi5wYXlsb2FkXVxuY29uc3QgZGllID0gKHg6IHVua25vd24pOiBuZXZlciA9PiB7IHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB2YWx1ZTogJHtTdHJpbmcoeCl9YCkgfVxuXG5jb25zdCBleHByID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihub2RlOiBDb3JlRXhwcjxUPik6IEV4cHI8VD4gPT4ge1xuICBjb25zdCBlID0gbm9kZSBhcyBFeHByPFQ+XG4gIGUuYWRkID0gciA9PiBiaW4oXCJhZGRcIiwgZSwgcikgYXMgRXhwcjxUPlxuICBlLnN1YiA9IHIgPT4gYmluKFwic3ViXCIsIGUsIHIpIGFzIEV4cHI8VD5cbiAgZS5tdWwgPSByID0+IGJpbihcIm11bFwiLCBlLCByKSBhcyBFeHByPFQ+XG4gIGUuZGl2ID0gciA9PiBiaW4oXCJkaXZcIiwgZSwgcikgYXMgRXhwcjxUPlxuICBlLmVxID0gciA9PiBjbXAoXCJlcVwiLCBlLCByKSBhcyBFeHByPFwiaTMyXCI+XG4gIGUubHQgPSByID0+IGNtcChcImx0XCIsIGUsIHIpIGFzIEV4cHI8XCJpMzJcIj5cbiAgZS5ndCA9IHIgPT4gY21wKFwiZ3RcIiwgZSwgcikgYXMgRXhwcjxcImkzMlwiPlxuICByZXR1cm4gZVxufVxuXG5jb25zdCBsaXQgPSA8VCBleHRlbmRzIE51bVR5cGU+KHR5cGU6IFQsIHZhbHVlOiBFeHByTGlrZTxUPik6IEV4cHI8VD4gPT5cbiAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIFwia2luZFwiIGluIHZhbHVlXG4gICAgPyB2YWx1ZSBhcyBFeHByPFQ+XG4gICAgOiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlLCB2YWx1ZTogdmFsdWUgYXMgVmFsdWU8VD4gfSlcblxuY29uc3QgYmluID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQmluT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT5cbiAgZXhwcih7IGtpbmQ6IFwiYmluXCIsIHR5cGU6IGxlZnQudHlwZSwgb3AsIGxlZnQsIHJpZ2h0OiBsaXQobGVmdC50eXBlLCByaWdodCkgfSlcblxuY29uc3QgY21wID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihvcDogQ21wT3AsIGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT5cbiAgZXhwcih7IGtpbmQ6IFwiY21wXCIsIHR5cGU6IFwiaTMyXCIsIGlucHV0VHlwZTogbGVmdC50eXBlLCBvcCwgbGVmdCwgcmlnaHQ6IGxpdChsZWZ0LnR5cGUsIHJpZ2h0KSB9KVxuXG5leHBvcnQgY29uc3QgaWZFbHNlID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihjb25kOiBFeHByPFwiaTMyXCI+LCB0aGVuOiBFeHByPFQ+LCBlbHNlXzogRXhwcjxUPikgPT5cbiAgZXhwcih7IGtpbmQ6IFwiaWZcIiwgdHlwZTogdGhlbi50eXBlLCBjb25kLCB0aGVuLCBlbHNlOiBlbHNlXyB9KVxuXG5leHBvcnQgY29uc3QgYWRkID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihcImFkZFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBzdWIgPSA8VCBleHRlbmRzIE51bVR5cGU+KGxlZnQ6IEV4cHI8VD4sIHJpZ2h0OiBFeHByTGlrZTxUPikgPT4gYmluKFwic3ViXCIsIGxlZnQsIHJpZ2h0KVxuZXhwb3J0IGNvbnN0IG11bCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBiaW4oXCJtdWxcIiwgbGVmdCwgcmlnaHQpXG5leHBvcnQgY29uc3QgZGl2ID0gPFQgZXh0ZW5kcyBOdW1UeXBlPihsZWZ0OiBFeHByPFQ+LCByaWdodDogRXhwckxpa2U8VD4pID0+IGJpbihcImRpdlwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBlcSA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJlcVwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBsdCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJsdFwiLCBsZWZ0LCByaWdodClcbmV4cG9ydCBjb25zdCBndCA9IDxUIGV4dGVuZHMgTnVtVHlwZT4obGVmdDogRXhwcjxUPiwgcmlnaHQ6IEV4cHJMaWtlPFQ+KSA9PiBjbXAoXCJndFwiLCBsZWZ0LCByaWdodClcblxuZXhwb3J0IGNvbnN0IGkzMiA9IChuOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFwiaTMyXCIsIHZhbHVlOiBuIH0pXG5leHBvcnQgY29uc3QgaTY0ID0gKG46IGJpZ2ludCkgPT4gZXhwcih7IGtpbmQ6IFwiY29uc3RcIiwgdHlwZTogXCJpNjRcIiwgdmFsdWU6IG4gfSlcbmV4cG9ydCBjb25zdCBmMzIgPSAobjogbnVtYmVyKSA9PiBleHByKHsga2luZDogXCJjb25zdFwiLCB0eXBlOiBcImYzMlwiLCB2YWx1ZTogbiB9KVxuZXhwb3J0IGNvbnN0IGY2NCA9IChuOiBudW1iZXIpID0+IGV4cHIoeyBraW5kOiBcImNvbnN0XCIsIHR5cGU6IFwiZjY0XCIsIHZhbHVlOiBuIH0pXG5cblxuY29uc3QgY29tcGlsZUV4cHIgPSAoZTogRXhwcjxOdW1UeXBlPiwgaXg6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4pOiBudW1iZXJbXSA9PiB7XG4gIHN3aXRjaCAoZS5raW5kKSB7XG4gICAgY2FzZSBcImNvbnN0XCI6XG4gICAgICBpZiAoZS50eXBlID09PSBcImkzMlwiKSByZXR1cm4gWzB4NDEsIC4uLnNOKGUudmFsdWUgYXMgbnVtYmVyLCAzMildXG4gICAgICBpZiAoZS50eXBlID09PSBcImk2NFwiKSByZXR1cm4gWzB4NDIsIC4uLnNOKGUudmFsdWUsIDY0KV1cbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZjMyXCIpIHJldHVybiBbMHg0MywgLi4uZk4oZS52YWx1ZSBhcyBudW1iZXIsIDQpXVxuICAgICAgaWYgKGUudHlwZSA9PT0gXCJmNjRcIikgcmV0dXJuIFsweDQ0LCAuLi5mTihlLnZhbHVlIGFzIG51bWJlciwgOCldXG4gICAgICByZXR1cm4gZGllKGUpXG4gICAgY2FzZSBcImxvY2FsLmdldFwiOiByZXR1cm4gWzB4MjAsIC4uLnUzMihlLmluZGV4KV1cbiAgICBjYXNlIFwiYmluXCI6IHJldHVybiBbLi4uY29tcGlsZUV4cHIoZS5sZWZ0LCBpeCksIC4uLmNvbXBpbGVFeHByKGUucmlnaHQsIGl4KSwgY29kZXMuYmluW2Uub3BdW2UudHlwZV1dXG4gICAgY2FzZSBcImNtcFwiOiByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUubGVmdCwgaXgpLCAuLi5jb21waWxlRXhwcihlLnJpZ2h0LCBpeCksIGNvZGVzLmNtcFtlLm9wXVtlLmlucHV0VHlwZV1dXG4gICAgY2FzZSBcImNhbGxcIjpcbiAgICAgIGlmIChpeFtlLm5hbWVdID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBmdW5jdGlvbiAke2UubmFtZX1gKVxuICAgICAgcmV0dXJuIFsuLi5lLmFyZ3MuZmxhdE1hcChhcmcgPT4gY29tcGlsZUV4cHIoYXJnLCBpeCkpLCAweDEwLCAuLi51MzIoaXhbZS5uYW1lXSEpXVxuICAgIGNhc2UgXCJpZlwiOiByZXR1cm4gWy4uLmNvbXBpbGVFeHByKGUuY29uZCwgaXgpLCAweDA0LCBjb2Rlcy50eXBlW2UudHlwZV0sIC4uLmNvbXBpbGVFeHByKGUudGhlbiwgaXgpLCAweDA1LCAuLi5jb21waWxlRXhwcihlLmVsc2UsIGl4KSwgMHgwYl1cbiAgICBkZWZhdWx0OiByZXR1cm4gZGllKGUpXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbXBpbGVNb2R1bGUgPSA8VCBleHRlbmRzIFNpZ3M+KGZ1bmN0aW9uczogTW9kdWxlSW1wbDxUPikgPT4ge1xuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZnVuY3Rpb25zKSBhcyBba2V5b2YgVCAmIHN0cmluZywgTW9kdWxlSW1wbDxUPltrZXlvZiBUXV1bXVxuICBjb25zdCBpeCA9IE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzLm1hcCgoW25hbWVdLCBpKSA9PiBbbmFtZSwgaV0pKSBhcyBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+XG4gIHJldHVybiBuZXcgVWludDhBcnJheShbXG4gICAgLi4ubWFnaWMsXG4gICAgLi4uc2VjdGlvbigweDAxLCBbLi4udTMyKGVudHJpZXMubGVuZ3RoKSwgLi4uZW50cmllcy5mbGF0TWFwKChbLCBmXSkgPT4gWzB4NjAsIC4uLnUzMihmLnBhcmFtcy5sZW5ndGgpLCAuLi5mLnBhcmFtcy5tYXAodCA9PiBjb2Rlcy50eXBlW3RdKSwgMHgwMSwgY29kZXMudHlwZVtmLnJlc3VsdF1dKV0pLFxuICAgIC4uLnNlY3Rpb24oMHgwMywgWy4uLnUzMihlbnRyaWVzLmxlbmd0aCksIC4uLmVudHJpZXMuZmxhdE1hcCgoXywgaSkgPT4gdTMyKGkpKV0pLFxuICAgIC4uLnNlY3Rpb24oMHgwNywgWy4uLnUzMihlbnRyaWVzLmxlbmd0aCksIC4uLmVudHJpZXMuZmxhdE1hcCgoW25hbWVdLCBpKSA9PiBbLi4uc3RyKG5hbWUpLCAweDAwLCAuLi51MzIoaSldKV0pLFxuICAgIC4uLnNlY3Rpb24oMHgwYSwgWy4uLnUzMihlbnRyaWVzLmxlbmd0aCksIC4uLmVudHJpZXMuZmxhdE1hcCgoWywgZl0pID0+IHsgY29uc3QgYm9keSA9IFsweDAwLCAuLi5jb21waWxlRXhwcihmLmJvZHkgYXMgRXhwcjxOdW1UeXBlPiwgaXgpLCAweDBiXTsgcmV0dXJuIFsuLi51MzIoYm9keS5sZW5ndGgpLCAuLi5ib2R5XSB9KV0pLFxuICBdKVxufVxuXG5leHBvcnQgY29uc3QgaW5zdGFudGlhdGVNb2R1bGUgPSBhc3luYyA8VCBleHRlbmRzIFNpZ3M+KG1vZDogTW9kdWxlSW1wbDxUPikgPT5cbiAgKGF3YWl0IFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlKGF3YWl0IFdlYkFzc2VtYmx5LmNvbXBpbGUoVWludDhBcnJheS5mcm9tKGNvbXBpbGVNb2R1bGUobW9kKSkuYnVmZmVyKSkpLmV4cG9ydHMgYXMgRXhwb3J0QnVuZGxlPFQ+XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBta01vZHVsZTxUIGV4dGVuZHMgU2lncz4oYnVpbGQ6IChtOiBNb2R1bGVCdWlsZGVyPFQ+KSA9PiBNb2R1bGVEZWNsPFQ+KTogUHJvbWlzZTxFeHBvcnRCdW5kbGU8VD4+IHtcbiAgY29uc3QgYnVpbGRlciA9IG5ldyBQcm94eSh7XG4gICAgZnVuYzxBIGV4dGVuZHMgcmVhZG9ubHkgTnVtVHlwZVtdLCBSIGV4dGVuZHMgTnVtVHlwZT4ocGFyYW1zOiBBLCByZXN1bHQ6IFIsIGZuOiAoLi4uYXJnczogQXJnc0V4cHI8QT4pID0+IEV4cHI8Uj4pIHtcbiAgICAgIHJldHVybiB7IF9fZm46IHRydWUgYXMgY29uc3QsIHBhcmFtcywgcmVzdWx0LCBidWlsZDogZm4gYXMgKC4uLmFyZ3M6IHJlYWRvbmx5IEV4cHI8TnVtVHlwZT5bXSkgPT4gRXhwcjxSPiB9XG4gICAgfSxcbiAgfSwge1xuICAgIGdldCh0YXJnZXQsIHByb3AsIHJlY2VpdmVyKSB7XG4gICAgICBpZiAocHJvcCBpbiB0YXJnZXQpIHJldHVybiBSZWZsZWN0LmdldCh0YXJnZXQsIHByb3AsIHJlY2VpdmVyKVxuICAgICAgcmV0dXJuICguLi5hcmdzOiBFeHByPE51bVR5cGU+W10pID0+IGV4cHIoeyBraW5kOiBcImNhbGxcIiwgdHlwZTogc2lnc1twcm9wIGFzIHN0cmluZ10hLnJlc3VsdCwgbmFtZTogcHJvcCBhcyBzdHJpbmcsIGFyZ3MgfSkgYXMgRXhwcjxOdW1UeXBlPlxuICAgIH0sXG4gIH0pIGFzIE1vZHVsZUJ1aWxkZXI8VD5cblxuICBjb25zdCBkZWNscyA9IGJ1aWxkKGJ1aWxkZXIpXG4gIGNvbnN0IHNpZ3MgPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgT2JqZWN0LmVudHJpZXMoZGVjbHMpLm1hcCgoW25hbWUsIGRlZl0pID0+IHtcbiAgICAgIHJldHVybiBbbmFtZSwgeyBwYXJhbXM6IGRlZi5wYXJhbXMsIHJlc3VsdDogZGVmLnJlc3VsdCB9XVxuICAgIH0pLFxuICApIGFzIFRcblxuICBjb25zdCBpbXBsID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgIE9iamVjdC5lbnRyaWVzKGRlY2xzKS5tYXAoKFtuYW1lLCBkZWZdKSA9PiB7XG4gICAgICBjb25zdCBsb2NhbHMgPSBkZWYucGFyYW1zLm1hcCgodHlwZTogTnVtVHlwZSwgaW5kZXg6IG51bWJlcikgPT4gZXhwcih7IGtpbmQ6IFwibG9jYWwuZ2V0XCIsIHR5cGUsIGluZGV4IH0pKSBhcyB1bmtub3duIGFzIEFyZ3NFeHByPHR5cGVvZiBkZWYucGFyYW1zPlxuICAgICAgcmV0dXJuIFtuYW1lLCB7IHBhcmFtczogZGVmLnBhcmFtcywgcmVzdWx0OiBkZWYucmVzdWx0LCBib2R5OiBkZWYuYnVpbGQoLi4ubG9jYWxzIGFzIHVua25vd24gYXMgRXhwcjxOdW1UeXBlPltdKSB9XVxuICAgIH0pLFxuICApIGFzIE1vZHVsZUltcGw8VD5cblxuICByZXR1cm4gaW5zdGFudGlhdGVNb2R1bGUoaW1wbClcbn1cblxuY29uc3QgbW9kID0gYXdhaXQgbWtNb2R1bGUobSA9PiAoe1xuICBhZGQ6IG0uZnVuYyhbJ2kzMicsICdpMzInXSBhcyBjb25zdCwgJ2kzMicsICh4LCB5KSA9PiB4LmFkZCh5KSksXG4gIGlzRXZlbjogbS5mdW5jKFsnaTMyJ10gYXMgY29uc3QsICdpMzInLCBuID0+XG4gICAgaWZFbHNlKG4uZXEoMCksIGkzMigxKSwgbS5pc09kZCEobi5zdWIoMSkpKVxuICApLFxuICBpc09kZDogbS5mdW5jKFsnaTMyJ10gYXMgY29uc3QsICdpMzInLCBuID0+XG4gICAgaWZFbHNlKG4uZXEoMCksIGkzMigwKSwgbS5pc0V2ZW4hKG4uc3ViKDEpKSlcbiAgKSxcblxufSkpXG5cbmV4cG9ydCBjb25zdCBpbnN0YW5jZSA9IG1vZFxuIiwKICAgICJcbmltcG9ydCB0eXBlIHsgSnNvbkRhdGEgfSBmcm9tIFwiLi4vc2NoZW1hXCI7XG5leHBvcnQgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbmNvbnN0IGNvbG9yUGFsZXR0ZSA9IHtcbiAgbGlnaHQ6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiMwMDBcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjZmZmXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDI0MiwgNTUsIDU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYig1NywgMjE0LCAzOSlcIixcbiAgICBibHVlOiAgICAgICAgICAgICAgXCJyZ2IoNSwgMjgsIDE0MSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoMjEsIDEzNywgMjM5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM4ODhcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjZTVlNWU1XCIsXG4gIH0sXG4gIGRhcms6e1xuICAgIGNvbG9yOiAgICAgICAgICAgICBcIiNmZmZcIixcbiAgICBiYWNrZ3JvdW5kOiAgICAgICAgXCIjMjIyXCIsXG4gICAgcmVkOiAgICAgICAgICAgICAgIFwicmdiKDE5OCwgMjAsIDApXCIsXG4gICAgYmx1ZTogICAgICAgICAgICAgIFwicmdiKDk1LCAxNTksIDI1NSlcIixcbiAgICBsaWdodGJsdWU6ICAgICAgICAgXCJyZ2IoOTUsIDEwMCwgMjU1KVwiLFxuICAgIGdyZWVuOiAgICAgICAgICAgICBcInJnYigwLCAxODUsIDE5KVwiLFxuICAgIGdyYXk6ICAgICAgICAgICAgICBcIiM1NjU2NTZcIixcbiAgICBsaWdodGdyYXk6ICAgICAgICAgXCIjNDE0MTQxXCIsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNvbG9yID0ge1xuICBjb2xvcjogXCJ2YXIoLS1jb2xvcilcIixcbiAgYmFja2dyb3VuZDogXCJ2YXIoLS1iYWNrZ3JvdW5kKVwiLFxuICBibHVlOiBcInZhcigtLWJsdWUpXCIsXG4gIGxpZ2h0Qmx1ZTogXCJ2YXIoLS1saWdodGJsdWUpXCIsXG4gIHJlZDogXCJ2YXIoLS1yZWQpXCIsXG4gIGdyZWVuOiBcInZhcigtLWdyZWVuKVwiLFxuICBncmF5OiBcInZhcigtLWdyYXkpXCIsXG4gIGxpZ2h0Z3JheTogXCJ2YXIoLS1saWdodGdyYXkpXCJcbn1cblxuXG5sZXQgc3R5bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKVxuc3R5bC5pbm5lckhUTUwgPSBgXG46cm9vdCB7XG4gIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmRhcmsuY29sb3J9O1xuICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmFja2dyb3VuZH07XG4gIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5kYXJrLnJlZH07XG4gIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmRhcmsuZ3JlZW59O1xuICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmRhcmsuYmx1ZX07XG4gIC0tZ3JheTogJHtjb2xvclBhbGV0dGUuZGFyay5ncmF5fTtcbiAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmRhcmsubGlnaHRncmF5fTtcbiAgY29sb3I6IHZhcigtLWNvbG9yKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZCk7XG4gIGZvbnQtZmFtaWx5OiBzYW5zLXNlcmlmO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgOnJvb3Qge1xuICAgIC0tY29sb3I6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmNvbG9yfTtcbiAgICAtLWJhY2tncm91bmQ6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJhY2tncm91bmR9O1xuICAgIC0tcmVkOiAke2NvbG9yUGFsZXR0ZS5saWdodC5yZWR9O1xuICAgIC0tZ3JlZW46ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmdyZWVufTtcbiAgICAtLWJsdWU6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmJsdWV9O1xuICAgIC0tZ3JheTogJHtjb2xvclBhbGV0dGUubGlnaHQuZ3JheX07XG4gICAgLS1saWdodGdyYXk6ICR7Y29sb3JQYWxldHRlLmxpZ2h0LmxpZ2h0Z3JheX07XG4gIH1cbn1cbmBcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bClcblxuZXhwb3J0IHR5cGUgaHRtbEtleSA9ICdpbm5lclRleHQnfCdvbmNsaWNrJyB8ICdvbmlucHV0JyB8ICdvbmtleWRvd24nIHwgJ29ubW91c2VlbnRlcicgfCAnb25tb3VzZW92ZXInIHwgJ29ubW91c2VleGl0JyB8J2NoaWxkcmVuJ3wnY2xhc3MnfCdpZCd8J2NvbnRlbnRFZGl0YWJsZSd8J2V2ZW50TGlzdGVuZXJzJ3wnY29sb3InfCdiYWNrZ3JvdW5kJyB8ICdzdHlsZScgfCAncGxhY2Vob2xkZXInIHwgJ3RhYkluZGV4JyB8ICdjb2xTcGFuJyB8ICd0eXBlJ1xuZXhwb3J0IGNvbnN0IGh0bWxFbGVtZW50ID0gKHRhZzpzdHJpbmcsIHRleHQ6c3RyaW5nLCBhcmdzPzpQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+Pik6SFRNTEVsZW1lbnQgPT57XG5cbiAgY29uc3QgX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcbiAgX2VsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG4gIGxldCBzdCA9IF9lbGVtZW50LnN0eWxlXG4gIGlmICh0YWcgPT0gXCJidXR0b25cIil7XG4gICAgX2VsZW1lbnQuaW5uZXJUZXh0ID0gdGV4dFxuICAgIHN0LmNvbG9yID0gY29sb3IuY29sb3JcbiAgICBzdC5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvci5saWdodGdyYXlcbiAgICBzdC5ib3JkZXIgPSBcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5XG4gICAgc3QuYm9yZGVyUmFkaXVzID0gXCIuMmVtXCJcbiAgICBzdC5wYWRkaW5nID0gXCIuMWVtIC40ZW1cIlxuICAgIHN0Lm1hcmdpbiA9IFwiLjJlbVwiXG4gIH1cbiAgaWYgKGFyZ3MpIE9iamVjdC5lbnRyaWVzKGFyZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSk9PntcbiAgICBpZiAoa2V5ID09PSAncGFyZW50Jyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnQpLmFwcGVuZENoaWxkKF9lbGVtZW50KVxuICAgIH1cbiAgICBpZiAoa2V5PT09J2NoaWxkcmVuJyl7XG4gICAgICAodmFsdWUgYXMgSFRNTEVsZW1lbnRbXSkuZm9yRWFjaChjPT5fZWxlbWVudC5hcHBlbmRDaGlsZChjKSlcbiAgICB9ZWxzZSBpZiAoa2V5PT09J2V2ZW50TGlzdGVuZXJzJyl7XG4gICAgICBPYmplY3QuZW50cmllcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCAoZTpFdmVudCk9PnZvaWQ+KS5mb3JFYWNoKChbZXZlbnQsIGxpc3RlbmVyXSk9PntcbiAgICAgICAgX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpXG4gICAgICB9KVxuICAgIH1lbHNlIGlmIChrZXkgPT09ICdzdHlsZScpe1xuICAgICAgT2JqZWN0LmFzc2lnbihfZWxlbWVudC5zdHlsZSwgdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilcbiAgICB9ZWxzZXtcbiAgICAgIF9lbGVtZW50WyhrZXkgYXMgJ2lubmVyVGV4dCcgfCAnb25jbGljaycgfCAnb25pbnB1dCcgfCAnaWQnIHwgJ2NvbnRlbnRFZGl0YWJsZScpXSA9IHZhbHVlXG4gICAgfVxuICB9KVxuICByZXR1cm4gX2VsZW1lbnRcbn1cblxuZXhwb3J0IHR5cGUgSFRNTEFyZyA9IHN0cmluZyB8IG51bWJlciB8IEhUTUxFbGVtZW50IHwgUGFydGlhbDxSZWNvcmQ8aHRtbEtleSwgYW55Pj4gIHwgUHJvbWlzZTxIVE1MQXJnPiB8IEhUTUxBcmdbXSB8IEZ1bmN0aW9uXG5leHBvcnQgY29uc3QgaHRtbCA9ICh0YWc6c3RyaW5nLCAuLi5jczpIVE1MQXJnW10pOkhUTUxFbGVtZW50PT57XG4gIGxldCBjaGlsZHJlbjogSFRNTEVsZW1lbnRbXSA9IFtdXG4gIGxldCBhcmdzOiBQYXJ0aWFsPFJlY29yZDxodG1sS2V5LCBhbnk+PiA9IHt9XG5cbiAgY29uc3QgYWRkX2FyZyA9IChhcmc6SFRNTEFyZyk9PntcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZykpXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIGNoaWxkcmVuLnB1c2goaHRtbEVsZW1lbnQoXCJzcGFuXCIsIGFyZy50b1N0cmluZygpKSlcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBQcm9taXNlKXtcbiAgICAgIGNvbnN0IGVsID0gc3BhbihcIi4uLlwiKVxuICAgICAgYXJnLnRoZW4oKHZhbHVlKT0+e1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKHNwYW4odmFsdWUpKVxuICAgICAgfSlcbiAgICAgIGNoaWxkcmVuLnB1c2goZWwpXG4gICAgfVxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSBjaGlsZHJlbi5wdXNoKGFyZylcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIGFyZy5mb3JFYWNoKHg9PmFkZF9hcmcoeCkpXG4gICAgLy8gZWxzZSBpZiAoJ2dldCcgaW4gYXJnICYmIHR5cGVvZiBhcmcuZ2V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gICBjb25zdCBlbCA9IHNwYW4oKVxuICAgIC8vICAgY2hpbGRyZW4ucHVzaChlbClcbiAgICAvLyAgIGlmICgnb251cGRhdGUnIGluIGFyZyAmJiB0eXBlb2YgYXJnLm9udXBkYXRlID09PSAnZnVuY3Rpb24nKSBhcmcub251cGRhdGUoeD0+ZWwucmVwbGFjZUNoaWxkcmVuKHgpKVxuICAgIC8vIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09IFwiZnVuY3Rpb25cIil7XG4gICAgICBpZiAoYXJnLm5hbWUgPT0gXCJvbmlucHV0XCIpIGFyZ3Mub25pbnB1dCA9IGFyZ1xuICAgICAgZWxzZSBpZiAoYXJnLm5hbWUgPT0gXCJvbmNsaWNrXCIgfHwgYXJnLmxlbmd0aCA8IDIpIGFyZ3Mub25jbGljayA9IGFyZ1xuICAgICAgZWxzZSBjb25zb2xlLndhcm4oXCJGdW5jdGlvbiBhcmd1bWVudCB3aXRob3V0IG5hbWUgb3Igd2l0aCBtb3JlIHRoYW4gb25lIHBhcmFtZXRlciBpcyBpZ25vcmVkIGluIGh0bWwgZ2VuZXJhdG9yXCIpXG4gICAgfVxuICAgIGVsc2UgYXJncyA9IHsuLi5hcmdzLCAuLi5hcmd9XG4gIH1cbiAgY3MuZm9yRWFjaChhZGRfYXJnKVxuICByZXR1cm4gaHRtbEVsZW1lbnQodGFnLCBcIlwiLCB7Li4uYXJncywgY2hpbGRyZW59KVxufVxuXG5leHBvcnQgdHlwZSBIVE1MR2VuZXJhdG9yPFQgZXh0ZW5kcyBIVE1MRWxlbWVudCA9IEhUTUxFbGVtZW50PiA9ICguLi5jczpIVE1MQXJnW10pID0+IFRcbmNvbnN0IG5ld0h0bWxHZW5lcmF0b3IgPSA8VCBleHRlbmRzIEhUTUxFbGVtZW50Pih0YWc6c3RyaW5nKT0+KC4uLmNzOkhUTUxBcmdbXSk6VD0+aHRtbCh0YWcsIC4uLmNzKSBhcyBUXG5cbmV4cG9ydCBjb25zdCBwOkhUTUxHZW5lcmF0b3I8SFRNTFBhcmFncmFwaEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInBcIilcbmV4cG9ydCBjb25zdCBhOkhUTUxHZW5lcmF0b3I8SFRNTEFuY2hvckVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcImFcIilcbmV4cG9ydCBjb25zdCBoMTpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDFcIilcbmV4cG9ydCBjb25zdCBoMjpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDJcIilcbmV4cG9ydCBjb25zdCBoMzpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDNcIilcbmV4cG9ydCBjb25zdCBoNDpIVE1MR2VuZXJhdG9yPEhUTUxIZWFkaW5nRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiaDRcIilcblxuZXhwb3J0IGNvbnN0IGRpdjpIVE1MR2VuZXJhdG9yPEhUTUxEaXZFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJkaXZcIilcbmV4cG9ydCBjb25zdCBwcmU6SFRNTEdlbmVyYXRvcjxIVE1MUHJlRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwicHJlXCIpXG5leHBvcnQgY29uc3Qgc3BhbjpIVE1MR2VuZXJhdG9yPEhUTUxTcGFuRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwic3BhblwiKVxuZXhwb3J0IGNvbnN0IHRleHRhcmVhOkhUTUxHZW5lcmF0b3I8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGV4dGFyZWFcIilcblxuZXhwb3J0IGNvbnN0IGJ1dHRvbjpIVE1MR2VuZXJhdG9yPEhUTUxCdXR0b25FbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJidXR0b25cIilcbi8vIGV4cG9ydCBjb25zdCB0YWJsZSA9IChyb3dzOiBIVE1MQXJnW11bXSwgLi4uYXJnczogSFRNTEFyZ1tdKSA9PiBuZXdIdG1sR2VuZXJhdG9yKFwidGFibGVcIikoIHN0eWxlKHtib3JkZXJTcGFjaW5nOiBcIjFlbSAuNGVtXCJ9KSAsIHJvd3MubWFwKGNlbGxzPT50cihjZWxscy5tYXAoY2VsbD0+dGQoY2VsbCkpKSksIC4uLmFyZ3MpXG5leHBvcnQgY29uc3QgdGFibGU6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0YWJsZVwiKVxuXG5leHBvcnQgY29uc3QgdHI6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVSb3dFbGVtZW50PiA9IG5ld0h0bWxHZW5lcmF0b3IoXCJ0clwiKVxuZXhwb3J0IGNvbnN0IHRkOkhUTUxHZW5lcmF0b3I8SFRNTFRhYmxlQ2VsbEVsZW1lbnQ+ID0gbmV3SHRtbEdlbmVyYXRvcihcInRkXCIpXG5leHBvcnQgY29uc3QgdGg6SFRNTEdlbmVyYXRvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwidGhcIilcbmV4cG9ydCBjb25zdCBjYW52YXM6SFRNTEdlbmVyYXRvcjxIVE1MQ2FudmFzRWxlbWVudD4gPSBuZXdIdG1sR2VuZXJhdG9yKFwiY2FudmFzXCIpXG5cbmV4cG9ydCBjb25zdCBzdHlsZSA9ICguLi5ydWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPltdKSA9PiAoe3N0eWxlOiBPYmplY3QuYXNzaWduKHt9LCAuLi5ydWxlcyl9KVxuZXhwb3J0IGNvbnN0IG1hcmdpbiA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7bWFyZ2luOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgcGFkZGluZyA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7cGFkZGluZzogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGJvcmRlciA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7Ym9yZGVyOiB2YWx1ZX0pXG5leHBvcnQgY29uc3QgYm9yZGVyUmFkaXVzID0gKHZhbHVlOiBzdHJpbmcpID0+IHN0eWxlKHtib3JkZXJSYWRpdXM6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCB3aWR0aCA9ICh2YWx1ZTogc3RyaW5nKSA9PiBzdHlsZSh7d2lkdGg6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBoZWlnaHQgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2hlaWdodDogdmFsdWV9KVxuZXhwb3J0IGNvbnN0IGRpc3BsYXkgPSAodmFsdWU6IHN0cmluZykgPT4gc3R5bGUoe2Rpc3BsYXk6IHZhbHVlfSlcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kID0gKHZhbHVlOiBzdHJpbmcgPSBcInZhcigtLWJhY2tncm91bmQpXCIpID0+IHN0eWxlKHtiYWNrZ3JvdW5kOiB2YWx1ZX0pXG5cbmV4cG9ydCBjb25zdCBpbnB1dDpIVE1MR2VuZXJhdG9yPEhUTUxJbnB1dEVsZW1lbnQ+ID0gKC4uLmNzKT0+e1xuICBjb25zdCBjb250ZW50ID0gY3MuZmlsdGVyKGM9PnR5cGVvZiBjID09ICdzdHJpbmcnKS5qb2luKCcgJylcbiAgY29uc3QgZWwgPSBodG1sKFwiaW5wdXRcIiwgLi4uY3MpIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgZWwudmFsdWUgPSBjb250ZW50XG4gIHJldHVybiBlbFxufVxuXG5cbmV4cG9ydCBjb25zdCBwb3B1cCA9ICguLi5jczpIVE1MQXJnW10pPT57XG4gIGNvbnN0IGRpYWxvZ2ZpZWxkID0gZGl2KHtcbiAgICBzdHlsZToge1xuICAgICAgYmFja2dyb3VuZDogY29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGNvbG9yOiBjb2xvci5jb2xvcixcbiAgICAgIHBhZGRpbmc6IFwiMWVtIDRlbVwiLFxuICAgICAgcGFkZGluZ0JvdHRvbTogXCIyZW1cIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIxZW1cIixcbiAgICAgIHpJbmRleDogXCIyMDAwXCIsXG4gICAgICBvdmVyZmxvd1k6IFwic2Nyb2xsXCIsXG4gICAgICBtaW5XaWR0aDogXCIyMHZ3XCIsXG4gICAgICBtYXhIZWlnaHQ6IFwiODB2aFwiLFxuICAgIH19LFxuICAgIC4uLmNzKVxuXG4gIGNvbnN0IHBvcHVwYmFja2dyb3VuZCA9IGRpdihcbiAgICB7c3R5bGU6e1xuICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgIHRvcDogXCIwXCIsXG4gICAgICBsZWZ0OiBcIjBcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMTY2LCAxNjYsIDE2NiwgMC41KVwiLFxuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB6SW5kZXg6IFwiMjAwMFwiLFxuICAgIH19XG4gIClcblxuICBwb3B1cGJhY2tncm91bmQuYXBwZW5kQ2hpbGQoZGlhbG9nZmllbGQpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcHVwYmFja2dyb3VuZCk7XG4gIHBvcHVwYmFja2dyb3VuZC5vbmNsaWNrID0gKCkgPT4ge3BvcHVwYmFja2dyb3VuZC5yZW1vdmUoKTsgfVxuICBkaWFsb2dmaWVsZC5vbmNsaWNrID0gKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHJldHVybiBwb3B1cGJhY2tncm91bmRcblxufVxuXG5leHBvcnQgY29uc3QgZXJyb3Jwb3B1cCA9IChlOkVycm9yIHwgc3RyaW5nKSA9PntcbiAgcG9wdXAoZGl2KFxuICAgIHN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6Y29sb3IuYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjpcIjFweCBzb2xpZCBcIitjb2xvci5ncmF5LFxuICAgICAgcGFkZGluZzpcIjFlbVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOlwiLjRlbVwiLFxuICAgICAgY29sb3I6Y29sb3IucmVkLFxuICAgIH0pLFxuICAgIGgyKFwiRXJyb3JcIiksXG4gICAgcChTdHJpbmcoZSkpXG4gICkpXG4gIHRocm93IChlIGluc3RhbmNlb2YgRXJyb3IpID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYW5lbExpc3QoaXRlbXM6IHt0aXRsZTogSFRNTEFyZywgY29udGVudDogSFRNTEFyZ31bXSl7XG4gIHJldHVybiBkaXYoXG4gICAgc3R5bGUoe1xuICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLFxuICAgICAgZ2FwOiBcIjFlbVwiLFxuICAgIH0pLFxuICAgIC4uLml0ZW1zLm1hcChmPT5kaXYoXG4gICAgICBzdHlsZSh7XG4gICAgICAgIGJvcmRlcjogXCIxcHggc29saWQgXCIrY29sb3IuZ3JheSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIi40ZW1cIixcbiAgICAgICAgcGFkZGluZzogXCIuNWVtIDFlbVwiLFxuICAgICAgfSksXG4gICAgICBkaXYoXG4gICAgICAgIHN0eWxlKHtcbiAgICAgICAgICBmb250V2VpZ2h0OiBcImJvbGRcIixcbiAgICAgICAgICBjdXJzb3I6IFwicG9pbnRlclwiLFxuICAgICAgICB9KSxcbiAgICAgICAgZi50aXRsZVxuICAgICAgKSxcbiAgICAgIGRpdihcbiAgICAgICAgc3R5bGUoe1xuICAgICAgICAgIG1hcmdpblRvcDogXCIuNWVtXCIsXG4gICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0pLFxuICAgICAgICBmLmNvbnRlbnRcbiAgICAgIClcbiAgICApKVxuICApXG59XG5cblxuXG5cbiIsCiAgICAiaW1wb3J0IHsgaW5zdGFuY2UgfSBmcm9tIFwiLi4vd2FzbVwiO1xuaW1wb3J0IHsgYm9keSwgaDIgfSBmcm9tIFwiLi9odG1sXCI7XG5cblxuXG5sZXQgcmVzID0gaW5zdGFuY2UuYWRkISgyLDMpXG5sZXQgZXZlbiA9IGluc3RhbmNlLmlzRXZlbiEoOClcbmxldCBvZGQgPSBpbnN0YW5jZS5pc09kZCEoOSlcblxuXG5ib2R5LmFwcGVuZChcbiAgaDIoXG4gICAgXCJ3YXNtIGJhc2VsaW5lOiBcIiwgU3RyaW5nKHJlcyksIFwiIGV2ZW4oOCk6IFwiLCBTdHJpbmcoZXZlbiksIFwiIG9kZCg5KTogXCIsIFN0cmluZyhvZGQpXG4gIClcbilcbiIKICBdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxJQUFNLFFBQVEsQ0FBQyxHQUFNLElBQU0sS0FBTSxLQUFNLEdBQU0sR0FBTSxHQUFNLENBQUk7QUF5QzdELElBQU0sUUFBUTtBQUFBLEVBQ1osTUFBTSxFQUFFLEtBQUssS0FBTSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssSUFBSztBQUFBLEVBQ25ELEtBQUs7QUFBQSxJQUNILEtBQUssRUFBRSxLQUFLLEtBQU0sS0FBSyxLQUFNLEtBQUssS0FBTSxLQUFLLElBQUs7QUFB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USxHQUFHO0FBQUEsTUFBRyxJQUFJLFFBQVEsT0FBRyxRQUFRLENBQUMsQ0FBQztBQUFBLElBTWpELFNBQUksT0FBTyxPQUFPLFlBQVc7QUFBQSxNQUNoQyxJQUFJLElBQUksUUFBUTtBQUFBLFFBQVcsS0FBSyxVQUFVO0FBQUEsTUFDckMsU0FBSSxJQUFJLFFBQVEsYUFBYSxJQUFJLFNBQVM7QUFBQSxRQUFHLEtBQUssVUFBVTtBQUFBLE1BQzVEO0FBQUEsZ0JBQVEsS0FBSyw2RkFBNkY7QUFBQSxJQUNqSCxFQUNLO0FBQUEsYUFBTyxLQUFJLFNBQVMsSUFBRztBQUFBO0FBQUEsRUFFOUIsR0FBRyxRQUFRLE9BQU87QUFBQSxFQUNsQixPQUFPLFlBQVksS0FBSyxJQUFJLEtBQUksTUFBTSxTQUFRLENBQUM7QUFBQTtBQUlqRCxJQUFNLG1CQUFtQixDQUF3QixRQUFhLElBQUksT0FBaUIsS0FBSyxLQUFLLEdBQUcsRUFBRTtBQUUzRixJQUFNLElBQXdDLGlCQUFpQixHQUFHO0FBQ2xFLElBQU0sSUFBcUMsaUJBQWlCLEdBQUc7QUFDL0QsSUFBTSxLQUF1QyxpQkFBaUIsSUFBSTtBQUNsRSxJQUFNLEtBQXVDLGlCQUFpQixJQUFJO0FBQ2xFLElBQU0sS0FBdUMsaUJBQWlCLElBQUk7QUFDbEUsSUFBTSxLQUF1QyxpQkFBaUIsSUFBSTtBQUVsRSxJQUFNLE1BQW9DLGlCQUFpQixLQUFLO0FBQ2hFLElBQU0sTUFBb0MsaUJBQWlCLEtBQUs7QUFDaEUsSUFBTSxPQUFzQyxpQkFBaUIsTUFBTTtBQUNuRSxJQUFNLFdBQThDLGlCQUFpQixVQUFVO0FBRS9FLElBQU0sU0FBMEMsaUJBQWlCLFFBQVE7QUFFekUsSUFBTSxRQUF3QyxpQkFBaUIsT0FBTztBQUV0RSxJQUFNLEtBQXdDLGlCQUFpQixJQUFJO0FBQ25FLElBQU0sS0FBeUMsaUJBQWlCLElBQUk7QUFDcEUsSUFBTSxLQUF5QyxpQkFBaUIsSUFBSTtBQUNwRSxJQUFNLFNBQTBDLGlCQUFpQixRQUFROzs7QUN4SmhGLElBQUksTUFBTSxTQUFTLElBQUssR0FBRSxDQUFDO0FBQzNCLElBQUksT0FBTyxTQUFTLE9BQVEsQ0FBQztBQUM3QixJQUFJLE1BQU0sU0FBUyxNQUFPLENBQUM7QUFHM0IsS0FBSyxPQUNILEdBQ0UsbUJBQW1CLE9BQU8sR0FBRyxHQUFHLGNBQWMsT0FBTyxJQUFJLEdBQUcsYUFBYSxPQUFPLEdBQUcsQ0FDckYsQ0FDRjsiLAogICJkZWJ1Z0lkIjogIjA2MTY1NkREQkZDOURGNEM2NDc1NkUyMTY0NzU2RTIxIiwKICAibmFtZXMiOiBbXQp9
