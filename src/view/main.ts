import { array, compile, func, i32, local, ret, whileLoop } from "../wasm";
import { body, h2, p } from "./html";

const xs = array("i32", 1024)
const ys = array("i32", 1024)
const out = array("i32", 1024)

const u = array("i32", 10)

const sumInto = func(["i32"], "i32", n => {
  const i = local.i32()
  return [
    i.set(0),
    whileLoop(i.lt(n), [
      out.store(i, xs.load(i).add(ys.load(i))),
      i.iadd(1),
    ]),
    ret(0),
  ]
})


const mod = await compile({
  sumInto,
  xs,
  ys,
  out,
})

let n= 8

for (let i = 0; i < n; i++) {
  mod.xs[i] = i
  mod.ys[i] = i * 10
}

const st = performance.now()
mod.sumInto(n)
const ms = performance.now() - st

body.append(
  h2("wasm arrays"),
  p(`sumInto(${n}) in ${ms.toFixed(3)} ms`),
  p(`out = ${Array.from(mod.out.slice(0, n)).join(", ")}`),

)




