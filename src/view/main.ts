import { compile, func, i32, ifStmt, local, ret, whileLoop } from "../wasm";
import { body, h2, p } from "./html";

const fib = func(["i32"], "i32", n => {
  const a = local.i32()
  const b = local.i32()
  const i = local.i32()
  const next = local.i32()
  return [
    ifStmt(n.lt(2), [ret(i32(1))]),
    a.set(1),
    b.set(1),
    i.set(2),
    whileLoop(i.get().lt(n.add(1)), [
      next.set(a.get().add(b.get())),
      a.set(b),
      b.set(next),
      i.set(i.get().add(1)),
    ]),
    ret(b),
  ]
})

const was = await compile({ fib })
const n = 4

const res = was.fib(n)

body.append(
  h2("wasm"),
  p(`fib ${n} = ${String(res)}`),
)
