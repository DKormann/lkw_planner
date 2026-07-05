import { configurePlanner, optDur, optimizeSchedule, rateSchedule } from "../src/planner";
import { randomMap } from "../src/randomMap";
import { randChoice, random, setRandSeed } from "../src/random";
import { randomUUID, uconst, type Request, type Schedule } from "../src/types";

function buildScenario(seed: number, requestCount = 20, transporterCount = 3) {
  for (let attempt = 0; attempt < 20; attempt++) {
    setRandSeed(seed + attempt);

    const roadMap = randomMap();
    const requests: Request[] = Array.from({ length: requestCount }, () => ({
      id: randomUUID(),
      startPoint: randChoice(roadMap.points),
      endPoint: randChoice(roadMap.points),
      value: uconst(Math.floor(random() * 1000), "eur"),
      deadline: uconst(Math.floor(random() * 60 * 60 * 24 * 7), "seconds"),
    }));

    const schedule: Schedule = Array.from({ length: transporterCount }, () => ({
      transporter: randomUUID(),
      steps: [{ $: "start", val: { pos: randChoice(roadMap.points) } }],
    }));

    try {
      configurePlanner({ roadMap, requests });
      optimizeSchedule(requests, schedule);
      return { roadMap, requests, schedule };
    } catch {
      continue;
    }
  }

  throw new Error(`Failed to build connected scenario for seed ${seed}`);
}

function assignedCount(schedule: Schedule): number {
  const ids = new Set<string>();
  for (const item of schedule) {
    for (const step of item.steps) {
      if (step.$ === "pickup") {
        ids.add(step.val.request);
      }
    }
  }
  return ids.size;
}

for (const seed of [5, 10, 25, 50, 75]) {
  const { roadMap, requests, schedule } = buildScenario(seed);
  configurePlanner({ roadMap, requests });

  const optimized = optimizeSchedule(requests, schedule);
  const score = rateSchedule(optimized);

  console.log(
    JSON.stringify({
      seed,
      score: Number(score.toFixed(2)),
      assigned: assignedCount(optimized),
      requests: requests.length,
      transporters: optimized.length,
      searchMs: optDur,
    }),
  );
}
