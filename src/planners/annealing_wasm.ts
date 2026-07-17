import type { Module } from "../types"
import { array, compile, func, ifElse, local, ret, struct, trap, umod, type Expr, type StmtBody } from "../wasm"
import type { AnnealingResult } from "./annealing_baseline"

const NWORKERS = 4
const RANDSTRIDE = 16

export async function annealingWasm(planner: Module): Promise<AnnealingResult> {
  const TSIZE = Math.floor(planner.NREQS / planner.NTRANS * 2.5 * 2 + 10)
  const STOP = struct({
    req_id: ["u16", 10],
    is_load: ["u8", 1],
    deck: ["u8", 1],
  })
  const REQ = struct({
    start: "u16",
    end: "u16",
    value: "u16",
    deadline: "u16",
  })

  const randState = array("i32", NWORKERS * RANDSTRIDE)
  const dists = array("i32", planner.RSIZE)
  const requests = array(REQ, planner.NREQS)
  const assigned = array("u8", planner.NREQS)
  const schedule = array(STOP, planner.NTRANS * TSIZE)
  const sched_size = array("i16", planner.NTRANS)
  const tran_positions = array("i16", planner.NTRANS)

  const randNext = func(["i32"], "i32", gid => {
    const value = local("i32")
    return [
      value.set(randState.at(gid.mul(RANDSTRIDE))),
      value.set(value.xor(value.shl(13))),
      value.set(value.xor(value.shr(17))),
      value.set(value.xor(value.shl(5))),
      randState.at(gid.mul(RANDSTRIDE)).set(value),
      ret(value),
    ]
  })
  const randint = func(["i32", "i32"], "i32", (gid, max) => umod(randNext.call(gid), max))

  const tryAssign = func([], "void", () => {
    const tran = local("i32")
    const req_id = local("i32")
    const A = local("i32")
    const B = local("i32")
    const tmp = local("i32")
    const tsize = local("i32")
    const toffset = local("i32")
    const schedView = {
      move: (target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32">): StmtBody =>
        schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index: Expr<"i32">) => schedule.at(toffset.add(index)),
    }

    return [
      tran.set(randint.call(0, planner.NTRANS)),
      req_id.set(randint.call(0, planner.NREQS)),
      ifElse(assigned.at(req_id).eq(1), ret(), assigned.at(req_id).set(1)),
      toffset.set(tran.mul(TSIZE)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.gt(TSIZE - 2), trap("schedule capacity exceeded")),
      A.set(randint.call(0, tsize.add(1))),
      B.set(randint.call(0, tsize.add(1))),
      ifElse(A.gt(B), [tmp.set(A), A.set(B), B.set(tmp)]),
      schedView.move(B.add(2), B, tsize.sub(B)),
      schedView.move(A.add(1), A, B.sub(A)),
      tmp.set(randint.call(0, 2)),
      schedView.at(A).set({ req_id, is_load: 1, deck: tmp }),
      schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp }),
      sched_size.at(tran).set(tsize.add(2)),
    ]
  })

  const addRequest = func(["i32", "i32", "i32", "i32", "i32"], "void",
    (reqn, start, end, value, deadline) =>
      requests.at(reqn).set({ start, end, value, deadline }),
  )
  const search = func([], "void", () => [
    tryAssign.call(),
    tryAssign.call(),
    tryAssign.call(),
  ])
  const getStop = func(["i32", "i32"], STOP,
    (tran, index) => schedule.at(tran.mul(TSIZE).add(index)),
  )

  const wasm = await compile({
    addRequest,
    assigned,
    dists,
    getStop,
    randState,
    schedule,
    search,
    sched_size,
    tran_positions,
  }, { runtimeBoundsChecks: true })

  wasm.dists.set(planner.roadmap.CostMatrix)
  wasm.randState.set(Array.from({ length: NWORKERS * 2 }, (_, i) => i + 1))
  wasm.tran_positions.set(planner.startpositions)
  planner.requests.forEach((request, i) =>
    wasm.addRequest(i, request.startPoint, request.endPoint, request.value_eur, request.deadline_h),
  )

  const startedAt = performance.now()
  wasm.search()
  const elapsedMs = performance.now() - startedAt
  const resultSchedule = new Uint32Array(planner.NTRANS * TSIZE)
  for (let tran = 0; tran < planner.NTRANS; tran++) {
    for (let i = 0; i < wasm.sched_size[tran]!; i++) {
      const stop = wasm.getStop(tran, i)
      resultSchedule[tran * TSIZE + i] = stop.is_load | stop.deck << 1 | stop.req_id << 2
    }
  }
  const unassigned = new Int8Array(planner.NREQS)
  for (let i = 0; i < unassigned.length; i++) unassigned[i] = wasm.assigned[i] ? 0 : 1
  const scheduleRatings = new Int32Array(planner.NTRANS)

  return {
    schedule: resultSchedule,
    scheduleSizes: new Uint16Array(wasm.sched_size),
    tranStart: new Uint16Array(planner.startpositions),
    TSIZE,
    scheduleRatings,
    unassigned,
    elapsedMs,
    totalScore: 0,
  }
}
