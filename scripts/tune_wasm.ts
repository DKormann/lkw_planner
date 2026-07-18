import { annealingWasm, defaultWasmSearchParams, type WasmSearchParams } from "../src/planners/annealing_wasm"
import { randomModule } from "../src/types"

const confirm = process.argv.includes("--confirm")
const cases = confirm ? 12 : 6
const seeds = confirm ? [1, 2, 3] : [1]
const modules = Array.from({ length: cases }, () => randomModule())
const variants: Record<string, Partial<WasmSearchParams>> = {
  default: {},
  previousDefault: {
    startTemperature: 5_000, nudgeRadius: 3,
    assignWeight: 1, unassignWeight: 1, nudgeWeight: 1, relocateWeight: 1,
  },
  temp1500: { startTemperature: 1_500 },
  temp3500: { startTemperature: 3_500 },
  radius3: { nudgeRadius: 3 },
  radius5: { nudgeRadius: 5 },
  balancedMoves: { assignWeight: 1, unassignWeight: 1, nudgeWeight: 1, relocateWeight: 1 },
  moreNudge: { assignWeight: 2, unassignWeight: 1, nudgeWeight: 4, relocateWeight: 3 },
}

const results = []
for (const [name, options] of Object.entries(variants)) {
  const runs = []
  for (const rngSeed of seeds) for (let i = 0; i < cases; i++) {
    const result = await annealingWasm(modules[i]!, { ...options, rngSeed })
    runs.push({ score: result.totalScore / 100, ms: result.elapsedMs })
  }
  results.push({
    name,
    params: { ...defaultWasmSearchParams, ...options },
    score: runs.reduce((sum, run) => sum + run.score, 0) / runs.length,
    ms: runs.reduce((sum, run) => sum + run.ms, 0) / runs.length,
    samples: runs.length,
  })
}

console.log(JSON.stringify(results, null, 2))
