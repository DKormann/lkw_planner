import { baselineAnnealing } from "../src/planners/annealing_baseline";
import { constructiveAnnealing } from "../src/planners/annealing_constructive";
import { improvedAnnealing } from "../src/planners/annealing_improved";
import { localAnnealing } from "../src/planners/annealing_local";
import { polishedAnnealing } from "../src/planners/annealing_polish";
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
  constructiveScore: number;
  constructiveAssigned: number;
  constructiveMs: number;
  localScore: number;
  localAssigned: number;
  localMs: number;
  polishedScore: number;
  polishedAssigned: number;
  polishedMs: number;
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

  setRandSeed(seed + 1000);
  const constructive = constructiveAnnealing(mod, steps);

  setRandSeed(seed + 1000);
  const local = localAnnealing(mod, steps);

  setRandSeed(seed + 1000);
  const polished = polishedAnnealing(mod, steps);

  return {
    seed,
    baselineScore: baseline.totalScore,
    baselineAssigned: assignedCount(baseline.unassigned),
    baselineMs: baseline.elapsedMs,
    improvedScore: improved.totalScore,
    improvedAssigned: assignedCount(improved.unassigned),
    improvedMs: improved.elapsedMs,
    constructiveScore: constructive.totalScore,
    constructiveAssigned: assignedCount(constructive.unassigned),
    constructiveMs: constructive.elapsedMs,
    localScore: local.totalScore,
    localAssigned: assignedCount(local.unassigned),
    localMs: local.elapsedMs,
    polishedScore: polished.totalScore,
    polishedAssigned: assignedCount(polished.unassigned),
    polishedMs: polished.elapsedMs,
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
    acc.constructiveScore += row.constructiveScore;
    acc.constructiveAssigned += row.constructiveAssigned;
    acc.constructiveMs += row.constructiveMs;
    acc.localScore += row.localScore;
    acc.localAssigned += row.localAssigned;
    acc.localMs += row.localMs;
    acc.polishedScore += row.polishedScore;
    acc.polishedAssigned += row.polishedAssigned;
    acc.polishedMs += row.polishedMs;
    return acc;
  },
  {
    baselineScore: 0,
    baselineAssigned: 0,
    baselineMs: 0,
    improvedScore: 0,
    improvedAssigned: 0,
    improvedMs: 0,
    constructiveScore: 0,
    constructiveAssigned: 0,
    constructiveMs: 0,
    localScore: 0,
    localAssigned: 0,
    localMs: 0,
    polishedScore: 0,
    polishedAssigned: 0,
    polishedMs: 0,
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
    constructiveScore: Math.round(summary.constructiveScore / n),
    constructiveAssigned: Number((summary.constructiveAssigned / n).toFixed(1)),
    constructiveMs: Math.round(summary.constructiveMs / n),
    localScore: Math.round(summary.localScore / n),
    localAssigned: Number((summary.localAssigned / n).toFixed(1)),
    localMs: Math.round(summary.localMs / n),
    polishedScore: Math.round(summary.polishedScore / n),
    polishedAssigned: Number((summary.polishedAssigned / n).toFixed(1)),
    polishedMs: Math.round(summary.polishedMs / n),
  },
}));
