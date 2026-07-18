import { annealingWasmImproved } from "../src/planners/annealing_wasm_improved"
import { randomModule } from "../src/types"

const modules = Array.from({ length: 6 }, () => randomModule())
const seeds = [1, 2]
const steps = [0, 50_000, 100_000, 200_000, 400_000, 800_000, 1_600_000, 3_200_000, 6_400_000, 12_800_000, 25_600_000]
const results = []

for (const count of steps) {
  const runs = []
  for (const rngSeed of seeds) for (const mod of modules) {
    const result = await annealingWasmImproved(mod, { steps: count, rngSeed })
    runs.push({ score: result.totalScore / 100, ms: result.elapsedMs })
  }
  results.push({
    steps: count,
    score: runs.reduce((sum, run) => sum + run.score, 0) / runs.length,
    ms: runs.reduce((sum, run) => sum + run.ms, 0) / runs.length,
    minScore: Math.min(...runs.map(run => run.score)),
    maxScore: Math.max(...runs.map(run => run.score)),
    samples: runs.length,
  })
}

console.log(JSON.stringify(results, null, 2))
