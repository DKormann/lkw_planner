import type { Module } from "../types";
import { array, breakTo, compile, func, i32, i64, ifElse, local, loop, ret, shl, shr, struct, umod, xor, type Expr, type LocalVar, type NumType, type StmtBody } from "../wasm";
import { div, h2, p, style } from "./html";


let wasmModule = null as Awaited<ReturnType<typeof mkWasm>> | null;

export async function setUpWasm(planner: Module) {
  wasmModule = await mkWasm(planner)
}

function forLoop(n: number| Expr<"i32" >, body: (i: Expr<"i32">) => StmtBody){
  let i = local("i32")
  return loop(i.lt(n), [
    body(i),
    i.iadd(1),
  ])
}

const NWORKERS = 4

async function mkWasm(planner: Module){

  const RANDSTRIDE = 16
  const randState = array("i32", NWORKERS*RANDSTRIDE)

  let randNext = func(["i32"], "i32", (gid)=>{
    let a = local("i32")
    let A = local("i64")

    return [
      a.set(randState.at(gid.mul(RANDSTRIDE))),
      a.set(a.xor(a.shl(13))),
      a.set(a.xor(a.shr(17))),
      a.set(a.xor(a.shl(5))),
      randState.at(gid.mul(RANDSTRIDE)).set(a),
      ret(a)
    ]
  })

  const randint = func(["i32", "i32"], "i32", (gid, max)=> umod(randNext.call(gid), max))
  const dists = array("i32", planner.RSIZE)
  const TSIZE = Math.floor(planner.NREQS / planner.NTRANS * 2.5 * 2 + 10)


  const STOP = struct({
    req_id: ["i16", 10],
    is_load: ["u8", 1],
    deck: ["u8", 1],
  })

  const REQ = struct({
    start: "u16",
    end: "u16",
    value: "u16",
    deadline: "u16",
  })

  let requests = array(REQ, planner.NREQS)
  let unassigned = array("u8", planner.NREQS)

  let schedule = array(STOP, planner.NTRANS * TSIZE)
  let sched_size = array("i16", planner.NTRANS)

  let tran_positions = array("i16", NWORKERS)

  const tryAssign = func(["i32"], "void", (reqid)=>{

    let tran = local("i32")
    let A = local("i32")
    let B = local("i32")
    let tmp = local("i32")
    let tsize = local("i32")
    let toffset = local("i32")

    let sched_view = {
      move (target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32">): StmtBody {
        return schedule.move(toffset.add(target), toffset.add(source), count)
      },
      at (index: Expr<"i32">) {
        return schedule.at(toffset.add(index))
      }
    }

    return [

      tran.set(randint.call(0, planner.NTRANS)),
      toffset.set(tran.mul(TSIZE)),

      tsize.set(sched_size.at(tran)),
      A.set(randint.call(0, tsize.add(1))),
      B.set(randint.call(0, tsize.add(1))),
      ifElse(A.gt(B), [
        tmp.set(A),
        A.set(B),
        B.set(tmp)
      ], []),

      sched_view.move(B.add(2), B, tsize.sub(B)),
      sched_view.move(A.add(1), A, B.sub(A)),

      tmp.set(randint.call(0, 2)),

      sched_view.at(A).set({ req_id: reqid, is_load: 1, deck: tmp }),
      sched_view.at(B.add(1)).set({ req_id: reqid, is_load: 0, deck: tmp }),
      
      sched_size.at(tran).set(tsize.add(2)),
    ]
    
  })

  const addRequest = func(["i32", "i32", "i32", "i32", "i32", ], "void",
    (reqn, start, end, value, deadline)=>  
      requests.at(reqn).set({start, end, value, deadline})
  )

  let mod = await compile({
    addRequest,
    dists,
    randState,
    requests,
    schedule,
    sched_size,
    unassigned,
    tran_positions,
  }, { runtimeBoundsChecks: true })

  mod.dists.set(planner.roadmap.CostMatrix)
  mod.randState.set(Array.from({length: NWORKERS*2}, (_,i)=>i+1))

  planner.requests.forEach((item, i)=>mod.addRequest(i, item.startPoint, item.endPoint, item.value_eur, item.deadline_h))


  return mod
}


export function wasmView(planner: Module) {

  if (wasmModule === null) throw new Error("wasm module not set up yet. call setUpWasm first")
  
  return div(
    style({padding: "1em"}),
    h2("wasm view"),

  )
}
