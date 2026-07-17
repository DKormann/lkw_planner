import type { Module } from "../types"
import { array, compile, func, i32, ifElse, lit, local, log, loop, ret, struct, trap, umod, type AnyArray, type ArrayHandle, type DType, type Expr, type ExprLike, type Stmt, type StmtBody } from "../wasm"
import type { AnnealingResult } from "./annealing_baseline"

const NWORKERS = 4
const RANDSTRIDE = 16
const INF = 1 << 30
const REORG_COST = 200

let DEBUG = true

function debug (tag: string, value: ExprLike<"i32">){
  if (!DEBUG) return []
  return [ log(tag, value) ]
}

function checkedArray<T extends DType>(type: T, length: number): ArrayHandle<T> {
  const arr = array(type, length) as AnyArray
  if (!DEBUG) return arr as ArrayHandle<T>

  const {at, move} = arr
  const checkIdx = func(["i32", "i32"], "i32", (i,n)=> ifElse(
      i.lt(0).or(n.lt(0)).or (n.add(i).gt(arr.length)),
      trap( "array bounds exceeded"),
      ret(i)
    )
  );
  arr.at = index => at(checkIdx.call(index, 1))
  arr.move = (target, source, count) => move(
    checkIdx.call(target, count),
    checkIdx.call(source, count),
    count,
  )
  return arr as ArrayHandle<T>
}

function forN(n: number, body: (i: Expr<"i32">) => StmtBody): StmtBody {
  const i = local("i32")
  return loop( i.lt(n),[body(i), i.set(i.add(1))],)
}

export async function annealingWasm(planner: Module): Promise<AnnealingResult> {
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

  const randState      = checkedArray("i32", NWORKERS * RANDSTRIDE)
  const dists          = checkedArray("i32", planner.RSIZE)
  const requests       = checkedArray(REQ, planner.NREQS)
  const assigned       = checkedArray("u8", planner.NREQS)
  const schedule       = checkedArray(STOP, planner.NTRANS * TSIZE)
  const sched_size     = checkedArray("i16", planner.NTRANS)
  const tran_positions = checkedArray("i16", planner.NTRANS)

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

  const roadCost = func(["i32", "i32"], "i32", (from, to) => {
    const a = local("i32"), b = local("i32"), tmp = local("i32"), index = local("i32")
    return [
      a.set(from), b.set(to),
      ifElse(a.lt(b), [tmp.set(a), a.set(b), b.set(tmp)]),
      index.set(a.add(b.mul(NPOINTS))),
      ifElse(index.gt(planner.RSIZE), index.set(i32(NPOINTS ** 2).sub(index))),
      ret(dists.at(index)),
    ]
  })

  const tryAssign = func([], "void", () => {
    const tran = local("i32")
    const req_id = local("i32")
    const A = local("i32")
    const B = local("i32")
    const tmp = local("i32")
    const tsize = local("i32")
    const toffset = local("i32")
    const previousScore = local("i32")
    const nextScore = local("i32")

    const schedView = {
      move: (target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32">): StmtBody =>
        schedule.move(toffset.add(target), toffset.add(source), count),
      at: (index: Expr<"i32">) => schedule.at(toffset.add(index)),
    }

    return [
      tran.set(randint.call(0, planner.NTRANS)),
      req_id.set(randint.call(0, planner.NREQS)),
      ifElse(assigned.at(req_id).eq(1), ret()),
      toffset.set(tran.mul(TSIZE)),
      tsize.set(sched_size.at(tran)),
      ifElse(tsize.gt(TSIZE - 2), trap("schedule capacity exceeded")),
      previousScore.set(rateTran.call(tran)),
      A.set(randint.call(0, tsize.add(1))),
      B.set(randint.call(0, tsize.add(1))),
      ifElse(A.gt(B), [tmp.set(A), A.set(B), B.set(tmp)]),
      schedView.move(B.add(2), B, tsize.sub(B)),
      schedView.move(A.add(1), A, B.sub(A)),
      tmp.set(randint.call(0, 2)),
      schedView.at(A).set({ req_id, is_load: 1, deck: tmp }),
      schedView.at(B.add(1)).set({ req_id, is_load: 0, deck: tmp }),
      sched_size.at(tran).set(tsize.add(2)),
      nextScore.set(rateTran.call(tran)),
      ifElse(nextScore.gt(previousScore),
        assigned.at(req_id).set(1),
        [
          schedView.move(A, A.add(1), B.sub(A)),
          schedView.move(B, B.add(2), tsize.sub(B)),
          sched_size.at(tran).set(tsize),
        ],
      ),
    ]
  })

  const rateTran = func(["i32"], "i32", tran => {
    const reward = local("i32"), duration = local("i32"), pos = local("i32")
    const offset = local("i32"), size = local("i32"), i = local("i32")
    const deck0 = local("i32"), deck1 = local("i32"), deckSize0 = local("i32"), deckSize1 = local("i32")
    const deck = local("i32"), deckSize = local("i32"), req = local("i32"), nextPos = local("i32")
    const found = local("i32"), shift = local("i32"), lowerMask = local("i32")
    const step = local(STOP), request = local(REQ)
    return [
      pos.set(tran_positions.at(tran)),
      offset.set(tran.mul(TSIZE)),
      size.set(sched_size.at(tran)),
      loop(i.lt(size), [
        step.set(schedule.at(offset.add(i))),
        req.set(step.req_id),
        request.set(requests.at(req)),
        nextPos.set(ifElse(step.is_load, request.start, request.end)),
        duration.iadd(roadCost.call(pos, nextPos)),
        pos.set(nextPos),
        deck.set(ifElse(step.deck, deck1, deck0)),
        deckSize.set(ifElse(step.deck, deckSize1, deckSize0)),
        ifElse(step.is_load, [
          ifElse(deckSize.gt(2), ret(-INF)),
          deck.set(deck.or(req.shl(deckSize.mul(10)))),
          deckSize.iadd(1),
        ], [
          found.set(-1),
          ifElse(deckSize.gt(0).and(deck.and(1023).eq(req)), found.set(0)),
          ifElse(found.eq(-1).and(deckSize.gt(1)).and(deck.shr(10).and(1023).eq(req)), found.set(1)),
          ifElse(found.eq(-1).and(deckSize.gt(2)).and(deck.shr(20).and(1023).eq(req)), found.set(2)),
          ifElse(found.eq(-1), ret(-INF)),
          duration.iadd(deckSize.sub(found).sub(1).mul(REORG_COST)),
          shift.set(found.mul(10)),
          lowerMask.set(i32(1).shl(shift).sub(1)),
          deck.set(deck.and(lowerMask).or(deck.shr(shift.add(10)).shl(shift))),
          deckSize.isub(1),
          ifElse(duration.gt(request.deadline), [], reward.iadd(request.value)),
        ]),
        ifElse(step.deck,
          [deck1.set(deck), deckSize1.set(deckSize)],
          [deck0.set(deck), deckSize0.set(deckSize)],
        ),
        i.iadd(1),
      ]),
      ret(reward.sub(duration)),
    ]
  })



  const addRequest = func(["i32", "i32", "i32", "i32", "i32"], "void",
    (reqn, start, end, value, deadline) =>
      requests.at(reqn).set({ start, end, value, deadline }),
  )

  const search = func([], "void", () => [
    debug("debugger on.", 0),
    forN(100, i=> tryAssign.call())
  ])
  const getStop = func(["i32", "i32"], STOP,
    (tran, index) => schedule.at(tran.mul(TSIZE).add(index)),
  )

  const wasm = await compile({
    addRequest,
    assigned,
    dists,
    getStop,
    rateTran,
    randState,
    schedule,
    search,
    sched_size,
    tran_positions,
  })

  wasm.dists.set(planner.roadmap.CostMatrix)
  wasm.randState.set(Array.from({ length: NWORKERS * 2 }, (_, i) => i + 1))
  wasm.tran_positions.set(planner.startpositions)
  planner.requests.forEach((request, i) =>
    wasm.addRequest(i, request.startPoint, request.endPoint, Math.trunc(request.value_eur / 0.5), Math.trunc(request.deadline_h * 60)),
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
  const scheduleRatings = new Int32Array(Array.from({ length: planner.NTRANS }, (_, tran) => wasm.rateTran(tran)))

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
