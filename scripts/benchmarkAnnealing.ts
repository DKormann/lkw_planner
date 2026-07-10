import { baselineAnnealing } from "../src/planners/annealing_baseline";
import { improvedAnnealing } from "../src/planners/annealing_improved";
import { setRandSeed } from "../src/random";
import { randomModule } from "../src/types";

type BenchRow = {
  seed: number;
  baselineScore: number;
  baselineAssigned: number;
  baselineMs: number;
  improvedScore: number;
  improvedAssigned: number;
  improvedMs: number;
};

function assignedCount(unassigned: Int8Array): number {
  let count = 0;
  for (let i = 0; i < unassigned.length; i++) {
    if (!unassigned[i]) count++;
  }
  return count;
}

function runCase(seed: number, steps = 400000): BenchRow {
  setRandSeed(seed);
  const mod = randomModule(200, 40, 100, 400, seed);

  setRandSeed(seed + 1000);
  const baseline = baselineAnnealing(mod, steps);

  setRandSeed(seed + 1000);
  const improved = improvedAnnealing(mod, steps);

  return {
    seed,
    baselineScore: baseline.totalScore,
    baselineAssigned: assignedCount(baseline.unassigned),
    baselineMs: baseline.elapsedMs,
    improvedScore: improved.totalScore,
    improvedAssigned: assignedCount(improved.unassigned),
    improvedMs: improved.elapsedMs,
  };
}

const steps = Number(process.argv[2] ?? "150000");
const seeds = [11, 22, 33, 44, 55];
const rows = seeds.map((seed) => runCase(seed, steps));

for (const row of rows) {
  console.log(JSON.stringify(row));
}

const summary = rows.reduce(
  (acc, row) => {
    acc.baselineScore += row.baselineScore;
    acc.baselineAssigned += row.baselineAssigned;
    acc.baselineMs += row.baselineMs;
    acc.improvedScore += row.improvedScore;
    acc.improvedAssigned += row.improvedAssigned;
    acc.improvedMs += row.improvedMs;
    return acc;
  },
  {
    baselineScore: 0,
    baselineAssigned: 0,
    baselineMs: 0,
    improvedScore: 0,
    improvedAssigned: 0,
    improvedMs: 0,
  },
);

const n = rows.length;
console.log(JSON.stringify({
  average: {
    baselineScore: Math.round(summary.baselineScore / n),
    baselineAssigned: Number((summary.baselineAssigned / n).toFixed(1)),
    baselineMs: Math.round(summary.baselineMs / n),
    improvedScore: Math.round(summary.improvedScore / n),
    improvedAssigned: Number((summary.improvedAssigned / n).toFixed(1)),
    improvedMs: Math.round(summary.improvedMs / n),
  },
}));
