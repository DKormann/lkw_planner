import { compile, func, ret } from "../wasm";
import { body, p } from "./html";







let {foo} = await compile({
    foo : func([], "i32", ()=>[
    ret(33)
  ]),
})

body.replaceChildren(
  p(foo())
)


