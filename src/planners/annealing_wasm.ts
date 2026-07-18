import type { Module } from "../types"
import { array, compile, exp, f32, fn, for_, global, i32, i64u, ifElse, log, return_, struct, trap, variable, when, type AnyArray, type ArrayHandle, type DType, type Expr, type ExprLike } from "../wasm"
import type { AnnealingResult } from "./annealing_baseline"
import { INF, KM_COST_CENTS, REORG_COST_CENTS } from "./annealing_shared"

const TEMP_PHASES = 1_000
const END_TEMP_CENTS = 0

export type WasmSearchParams = {
  steps: number
  startTemperature: number
  nudgeRadius: number
  assignWeight: number
  unassignWeight: number
  nudgeWeight: number
  relocateWeight: number
  rngSeed: number
}

export const defaultWasmSearchParams: WasmSearchParams = {
  steps: 1_600_000, startTemperature: 2_500, nudgeRadius: 4,
  assignWeight: 3, unassignWeight: 1, nudgeWeight: 3, relocateWeight: 3,
  rngSeed: 1,
}

const DEBUG = false

const debug = (tag: string, value: ExprLike<"i32">): void => {
  if (DEBUG) log(tag, value)
}

function checkedArray<T extends DType>(type: T, length: number): ArrayHandle<T> {
  const arr = array(type, length) as AnyArray
  if (!DEBUG) return arr as ArrayHandle<T>

  const { at, move } = arr
  const checkIdx = fn(["i32", "i32"], "i32", (i, n) => {
    when(i.lt(0).or(n.lt(0)).or(n.add(i).gt(arr.length)), () => trap("array bounds exceeded"))
    return i
  })
  arr.at = index => at(checkIdx.call(index, 1))
  arr.move = (target, source, count) => {
    move(checkIdx.call(target, count), checkIdx.call(source, count), count)
  }
  return arr as ArrayHandle<T>
}

export async function annealingWasm(planner: Module, options: Partial<WasmSearchParams> = {}): Promise<AnnealingResult> {
  const params = { ...defaultWasmSearchParams, ...options }
  const stepsPerPhase = Math.floor(params.steps / TEMP_PHASES)
  const assignEnd = params.assignWeight
  const unassignEnd = assignEnd + params.unassignWeight
  const nudgeEnd = unassignEnd + params.nudgeWeight
  const totalWeight = nudgeEnd + params.relocateWeight
  const TSIZE = Math.floor(planner.NREQS / planner.NTRANS * 2.5 * 2 + 10)
  const NPOINTS = planner.roadmap.points.length
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

  const randState = global("i32", params.rngSeed || 1)
  const dists = checkedArray("i32", planner.RSIZE)
  const requests = checkedArray(REQ, planner.NREQS)
  const assigned = checkedArray("u8", planner.NREQS)
  const schedule = checkedArray(STOP, planner.NTRANS * TSIZE)
  const sched_size = checkedArray("i16", planner.NTRANS)
  const ratings = checkedArray("i32", planner.NTRANS)
  const tran_positions = checkedArray("i16", planner.NTRANS)

  const randNext = fn([], "i32", () => {
    randState.set(randState.xor(randState.shl(13)))
    randState.set(randState.xor(randState.shr(17)))
    randState.set(randState.xor(randState.shl(5)))
    return randState
  })

  const randint = fn(["i32"], "i32", max =>
    i32(i64u(randNext.call()).mul(i64u(max)).shr(32n)))

  const acceptAnneal = fn(["i32", "i32", "i32"], "i32", (previous, next, temperature) => {
    when(previous.gt(next), () => {
      return_(randint.call(1_000_000).lt(i32(exp(
        f32(next.sub(previous)).div(f32(temperature)),
      ).mul(1_000_000))))
    })
    return i32(1)
  })

  const roadCost = fn(["i32", "i32"], "i32", (from, to) => {
    const lo = variable(to.add(from.sub(to).mul(from.lt(to))))
    const index = variable(from.add(to).sub(lo).add(lo.mul(NPOINTS)))
    index.set(index.add(index.gt(planner.RSIZE).mul(i32(NPOINTS ** 2).sub(index.mul(2)))))
    return dists.at(index).mul(from.eq(to).eq(0))
  })

  const rateTran = fn(["i32"], "i32", tran => {
    const reward = variable(0), cost = variable(0), elapsedMinutes = variable(0)
    const pos = variable(tran_positions.at(tran))
    const offset = tran.mul(TSIZE), size = variable(sched_size.at(tran))
    const deck0 = variable(0), deck1 = variable(0), deckSize0 = variable(0), deckSize1 = variable(0)

    for_(0, size, i => {
      const step = variable(STOP, schedule.at(offset.add(i)))
      const req = variable(step.req_id)
      const request = variable(REQ, requests.at(req))
      const nextPos = variable(ifElse(step.is_load, request.start, request.end))
      const distance = variable(roadCost.call(pos, nextPos))
      cost.iadd(distance.mul(KM_COST_CENTS))
      elapsedMinutes.iadd(distance)
      pos.set(nextPos)
      const deck = variable(ifElse(step.deck, deck1, deck0))
      const deckSize = variable(ifElse(step.deck, deckSize1, deckSize0))

      when(step.is_load, () => {
        when(deckSize.gt(2), () => return_(-INF))
        deck.set(deck.or(req.shl(deckSize.mul(10))))
        deckSize.iadd(1)
      }, () => {
        const found = variable(-1)
        when(deckSize.gt(0).and(deck.and(1023).eq(req)), () => found.set(0))
        when(found.eq(-1).and(deckSize.gt(1)).and(deck.shr(10).and(1023).eq(req)), () => found.set(1))
        when(found.eq(-1).and(deckSize.gt(2)).and(deck.shr(20).and(1023).eq(req)), () => found.set(2))
        when(found.eq(-1), () => return_(-INF))
        cost.iadd(deckSize.sub(found).sub(1).mul(REORG_COST_CENTS))
        const shift = found.mul(10)
        const lowerMask = i32(1).shl(shift).sub(1)
        deck.set(deck.and(lowerMask).or(deck.shr(shift.add(10)).shl(shift)))
        deckSize.isub(1)
        when(elapsedMinutes.gt(request.deadline).eq(0), () => reward.iadd(request.value))
      })

      when(step.deck,
        () => { deck1.set(deck); deckSize1.set(deckSize) },
        () => { deck0.set(deck); deckSize0.set(deckSize) },
      )
    })
    return reward.sub(cost)
  })

  const tryAssign = fn(["i32"], "void", temperature => {
    const tran = randint.call(planner.NTRANS)
    const req_id = randint.call(planner.NREQS)
    const schedView = {
      move: (target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32">) =>
        schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index: Expr<"i32">) => schedule.at(toffset.add(index)),
    }

    when(assigned.at(req_id).eq(1), () => return_())
    const toffset = tran.mul(TSIZE)
    const tsize = variable(sched_size.at(tran))
    when(tsize.gt(TSIZE - 2), () => return_())
    const previousScore = variable(ratings.at(tran))
    const A = randint.call(tsize.add(1))
    const B = variable(A.add(randint.call(4)))
    when(B.gt(tsize), () => B.set(tsize))
    schedView.move(B.add(2), B, tsize.sub(B))
    schedView.move(A.add(1), A, B.sub(A))
    const tmp = randint.call(2)
    schedView.at(A).set({ req_id, is_load: 1, deck: tmp })
    schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp })
    sched_size.at(tran).set(tsize.add(2))
    const nextScore = rateTran.call(tran)
    when(acceptAnneal.call(previousScore, nextScore, temperature), () => {
      assigned.at(req_id).set(1)
      ratings.at(tran).set(nextScore)
    }, () => {
      schedView.move(A, A.add(1), B.sub(A))
      schedView.move(B, B.add(2), tsize.sub(B))
      sched_size.at(tran).set(tsize)
    })
  })

  const tryUnassign = fn(["i32"], "void", temperature => {
    const tran = randint.call(planner.NTRANS)
    const A = variable(-1), B = variable(-1)
    const tsize = variable(sched_size.at(tran))
    const schedView = {
      move: (target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32">) =>
        schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index: Expr<"i32">) => schedule.at(toffset.add(index)),
    }

    when(tsize.lt(2), () => return_())
    const toffset = tran.mul(TSIZE)
    const selected = variable(STOP, schedView.at(randint.call(tsize)))
    const req = variable(selected.req_id)
    const deck = variable(selected.deck)
    for_(0, tsize, i => {
      const step = variable(STOP, schedView.at(i))
      when(step.req_id.eq(req), () => when(A.eq(-1), () => A.set(i), () => B.set(i)))
    })
    when(A.eq(-1).or(B.eq(-1)), () => return_())
    const previousScore = variable(ratings.at(tran))
    schedView.move(A, A.add(1), B.sub(A).sub(1))
    schedView.move(B.sub(1), B.add(1), tsize.sub(B).sub(1))
    sched_size.at(tran).set(tsize.sub(2))
    const nextScore = rateTran.call(tran)
    when(acceptAnneal.call(previousScore, nextScore, temperature), () => {
      assigned.at(req).set(0)
      ratings.at(tran).set(nextScore)
    }, () => {
      schedView.move(B.add(1), B.sub(1), tsize.sub(B).sub(1))
      schedView.move(A.add(1), A, B.sub(A).sub(1))
      schedView.at(A).set({ req_id: req, is_load: 1, deck })
      schedView.at(B).set({ req_id: req, is_load: 0, deck })
      sched_size.at(tran).set(tsize)
    })
  })

  const tryRelocate = fn(["i32"], "void", temperature => {
    const src = randint.call(planner.NTRANS), dst = randint.call(planner.NTRANS)
    const A = variable(-1), B = variable(-1)
    const srcView = {
      move: (target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32">) =>
        schedule.move(srcOffset.add(target), srcOffset.add(source), count),
      at: (index: Expr<"i32">) => schedule.at(srcOffset.add(index)),
    }
    const dstView = {
      move: (target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32">) =>
        schedule.move(dstOffset.add(target), dstOffset.add(source), count),
      at: (index: Expr<"i32">) => schedule.at(dstOffset.add(index)),
    }

    when(src.eq(dst), () => return_())
    const srcSize = variable(sched_size.at(src))
    const dstSize = variable(sched_size.at(dst))
    when(srcSize.lt(2).or(dstSize.gt(TSIZE - 2)), () => return_())
    const srcOffset = src.mul(TSIZE)
    const dstOffset = dst.mul(TSIZE)
    const selected = variable(STOP, srcView.at(randint.call(srcSize)))
    const req = variable(selected.req_id)
    const deck = variable(selected.deck)
    for_(0, srcSize, i => {
      const step = variable(STOP, srcView.at(i))
      when(step.req_id.eq(req), () => when(A.eq(-1), () => A.set(i), () => B.set(i)))
    })
    when(A.eq(-1).or(B.eq(-1)), () => return_())
    const previousScore = ratings.at(src).add(ratings.at(dst))
    srcView.move(A, A.add(1), B.sub(A).sub(1))
    srcView.move(B.sub(1), B.add(1), srcSize.sub(B).sub(1))
    sched_size.at(src).set(srcSize.sub(2))
    const C = randint.call(dstSize.add(1))
    const D = variable(C.add(randint.call(4)))
    when(D.gt(dstSize), () => D.set(dstSize))
    dstView.move(D.add(2), D, dstSize.sub(D))
    dstView.move(C.add(1), C, D.sub(C))
    dstView.at(C).set({ req_id: req, is_load: 1, deck })
    dstView.at(D.add(1)).set({ req_id: req, is_load: 0, deck })
    sched_size.at(dst).set(dstSize.add(2))
    const nextSrc = rateTran.call(src)
    const nextDst = rateTran.call(dst)
    when(acceptAnneal.call(previousScore, nextSrc.add(nextDst), temperature), () => {
      ratings.at(src).set(nextSrc)
      ratings.at(dst).set(nextDst)
    }, () => {
      dstView.move(C, C.add(1), D.sub(C))
      dstView.move(D, D.add(2), dstSize.sub(D))
      sched_size.at(dst).set(dstSize)
      srcView.move(B.add(1), B.sub(1), srcSize.sub(B).sub(1))
      srcView.move(A.add(1), A, B.sub(A).sub(1))
      srcView.at(A).set({ req_id: req, is_load: 1, deck })
      srcView.at(B).set({ req_id: req, is_load: 0, deck })
      sched_size.at(src).set(srcSize)
    })
  })

  const tryNudgeStop = fn(["i32"], "void", temperature => {
    const tran = randint.call(planner.NTRANS), size = variable(sched_size.at(tran))
    const first = variable(0), end = variable(0)

    when(size.lt(2), () => return_())
    const offset = tran.mul(TSIZE)
    const from = randint.call(size)
    const selected = variable(STOP, schedule.at(offset.add(from)))
    const roll = randint.call(params.nudgeRadius * 2)
    const target = variable(from.add(ifElse(roll.lt(params.nudgeRadius), roll.sub(params.nudgeRadius), roll.sub(params.nudgeRadius - 1))))
    when(target.lt(0), () => target.set(0))
    when(target.gt(size.sub(1)), () => target.set(size.sub(1)))
    when(target.eq(from), () => return_())
    when(target.lt(from),
      () => { first.set(target); end.set(from) },
      () => { first.set(from.add(1)); end.set(target.add(1)) },
    )
    for_(first, end, i => {
      const crossed = variable(STOP, schedule.at(offset.add(i)))
      when(crossed.req_id.eq(selected.req_id), () => return_())
    })
    const previousScore = variable(ratings.at(tran))
    when(target.lt(from),
      () => schedule.move(offset.add(target.add(1)), offset.add(target), from.sub(target)),
      () => schedule.move(offset.add(from), offset.add(from.add(1)), target.sub(from)),
    )
    schedule.at(offset.add(target)).set(selected)
    const nextScore = rateTran.call(tran)
    when(acceptAnneal.call(previousScore, nextScore, temperature), () => {
      ratings.at(tran).set(nextScore)
    }, () => {
      when(target.lt(from),
        () => schedule.move(offset.add(target), offset.add(target.add(1)), from.sub(target)),
        () => schedule.move(offset.add(from.add(1)), offset.add(from), target.sub(from)),
      )
      schedule.at(offset.add(from)).set(selected)
    })
  })

  const addRequest = fn(["i32", "i32", "i32", "i32", "i32"], "void", (reqn, start, end, value, deadline) => {
    requests.at(reqn).set({ start, end, value, deadline })
  })

  const bootstrap = fn([], "void", () => {
    for_(0, planner.NTRANS, tran => {
      const offset = tran.mul(TSIZE)
      const bestReq = variable(-1), bestScore = variable(-INF), score = variable(0)
      for_(0, planner.NREQS, req => {
        when(assigned.at(req).eq(0), () => {
          schedule.at(offset).set({ req_id: req, is_load: 1, deck: 0 })
          schedule.at(offset.add(1)).set({ req_id: req, is_load: 0, deck: 0 })
          sched_size.at(tran).set(2)
          score.set(rateTran.call(tran))
          when(score.gt(bestScore), () => { bestScore.set(score); bestReq.set(req) })
          sched_size.at(tran).set(0)
        })
      })
      when(bestReq.gt(-1).and(bestScore.gt(-12_001)), () => {
        schedule.at(offset).set({ req_id: bestReq, is_load: 1, deck: 0 })
        schedule.at(offset.add(1)).set({ req_id: bestReq, is_load: 0, deck: 0 })
        sched_size.at(tran).set(2)
        assigned.at(bestReq).set(1)
        ratings.at(tran).set(bestScore)
      })
    })
  })

  const search = fn([], "void", () => {
    debug("debugger on.", 0)
    for_(0, TEMP_PHASES, phase => {
      const temperature = i32(params.startTemperature).sub(
        phase.mul(params.startTemperature - END_TEMP_CENTS).div(TEMP_PHASES - 1),
      )
      for_(0, stepsPerPhase, () => {
        const move = randint.call(totalWeight)
        when(move.lt(assignEnd), () => tryAssign.call(temperature), () => {
          when(move.lt(unassignEnd), () => tryUnassign.call(temperature), () => {
            when(move.lt(nudgeEnd), () => tryNudgeStop.call(temperature), () => tryRelocate.call(temperature))
          })
        })
      })
    })
  })

  const getStop = fn(["i32", "i32"], STOP,
    (tran, index) => schedule.at(tran.mul(TSIZE).add(index)))

  const wasm = await compile({
    addRequest,
    assigned,
    bootstrap,
    dists,
    getStop,
    rateTran,
    ratings,
    schedule,
    search,
    sched_size,
    tran_positions,
  })

  wasm.dists.set(planner.roadmap.CostMatrix)
  wasm.tran_positions.set(planner.startpositions)
  planner.requests.forEach((request, i) =>
    wasm.addRequest(i, request.startPoint, request.endPoint, Math.round(request.value_eur * 100), Math.floor(request.deadline_h * 60)),
  )

  wasm.bootstrap()
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
  const scheduleRatings = new Int32Array(wasm.ratings)

  return {
    schedule: resultSchedule,
    scheduleSizes: new Uint16Array(wasm.sched_size),
    tranStart: new Uint16Array(planner.startpositions),
    TSIZE,
    scheduleRatings,
    unassigned,
    elapsedMs,
    totalScore: scheduleRatings.reduce((sum, score) => sum + score, 0),
  }
}
