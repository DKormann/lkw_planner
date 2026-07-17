import type { AnnealingResult } from "../planners/annealing_baseline"
import { annealingWasm } from "../planners/annealing_wasm"
import type { Module } from "../types"
import { div, h2, p, style } from "./html"

let result: AnnealingResult

export async function setUpWasm(planner: Module) {
  result = await annealingWasm(planner)
}

export function wasmView(_planner: Module) {
  if (!result ) throw new Error("WASM planner is not set up")
  return div(
    style({ padding: "1em" }),
    h2("WASM planner"),
    p("assigned: ", result.unassigned.length - result.unassigned.reduce((sum, value) => sum + value, 0)),
    p("schedule steps: ", result.scheduleSizes.reduce((sum, value) => sum + value, 0)),
    p("search time: ", result.elapsedMs.toFixed(2), "ms"),
  )
}

