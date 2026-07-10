import { instance } from "../wasm";
import { body, h2 } from "./html";



let res = instance.add!(2,3)
let even = instance.isEven!(8)
let odd = instance.isOdd!(9)


body.append(
  h2(
    "wasm baseline: ", String(res), " even(8): ", String(even), " odd(9): ", String(odd)
  )
)
