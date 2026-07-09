import { buildCostMatrix, CostMatrix } from "../planner"
import { div, p } from "../view/html"
import { LKW_COUNT, requests, roadMap } from "../view/main"


function getCost (a: number, b:number){
  console.log("getCost", a,b)
  let idx = roadMap.roadIDX(a,b)
  return CostMatrix[idx]!
}


export function simpleAnnealing(){
  buildCostMatrix()
  const NTRANS = LKW_COUNT.get()
  const NREQS = requests.length
  const TSIZE = Math.floor(NREQS * 2.5 + 10)

  const reqPickupLocations   = new Uint16Array(requests.map(r=>r.startPoint))
  const reqDeliveryLocations = new Uint16Array(requests.map(r=>r.endPoint))
  const reqDeadlines =         new Uint32Array(requests.map(r=>r.deadline_km))
  const reqValues =            new Uint32Array(requests.map(r=>r.value_eur))
  const unassigned = new Int8Array(requests.map(r=>1))

  const tranStart =   new Uint16Array(requests.map(x=>x.startPoint))
  const schedule = new Uint16Array(TSIZE * NTRANS)

  function isEmpty(x:number){
    return x & 1
  }

  function isload(x:number){
    return x & 2
  }

  function getDeck(x:number){
    return x & 4
  }

  function getReq(x:number){
    return x >> 3
  }

  function setReq(tran: number, isload: 1|0, deck: 1|0, req: number){
    schedule[tran * TSIZE] = 1 | (isload<<1) | (deck << 2) | (req << 3)
  }

  let INF = Number.MAX_SAFE_INTEGER

  function score(tran:number){
    let reward = 0
    let duration = 0
    let decks: [number[], number[]] = [[], []]
    let pos = tranStart[tran]!
    for (let i = 0; i < TSIZE; i++){
      let step = schedule[tran * TSIZE + i]!
      if (step == 0) break
      const load = isload(step)
      const req = getReq(step)
      const nextpos = load ? reqPickupLocations[req]! : reqDeliveryLocations[req]!
      duration += getCost(pos, nextpos)
      pos = nextpos
      if (load){
        let deck = decks[getDeck(step)]!
        deck.push(req)
        if (deck.length > 3) return -INF
      } else {
        let deck = decks[getDeck(step)]!
        let idx = deck.indexOf(req)
        if (idx == -1) return -INF
        deck.splice(idx, 1)
        if (duration <= reqDeadlines[req]!) reward += reqValues[req]!
      }
    }
  }

  function tryAssign(){

  }

  function tryUnassign(){

  }

  function trySwap(){

  }
}



export function plannerView():HTMLElement{

  

  let el = div(
    Array.from(requests).slice(1).map((_,r)=>p(`request ${r} cost to 0: ${getCost(0,r)}`)),
  )
  

  return el


}