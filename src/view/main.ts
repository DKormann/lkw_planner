import { instance } from "../wasm";
import { body, h2 } from "./html";



let adder = instance.instance.exports.add as (a:number, b:number)=>number

console.log(adder(2,3))


body.append(
  h2(
    "wasm baseline"
  )
)
