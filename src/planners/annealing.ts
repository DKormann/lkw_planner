import { Application } from "nostr-tools/kinds"

import { randInt, random } from "../random"
import { color, display, div, p, style } from "../view/html"
import type { Module } from "../types"


function isload(x:number){
  return x & 1
}

function getDeck(x:number){
  return (x & 2) >> 1
}

function getReq(x:number){
  return (x & 0xFFFF) >> 2
}

function getPos(x:number){
  return x>>16
}



const KM_COST = 0.2
const AVG_SPEED_KMH = 70 

export function simpleAnnealing(mod: Module){

  const {NREQS, requests, startpositions, NTRANS, roadmap} = mod
  const TSIZE = Math.floor(NREQS * 2.5 + 10)

  const reqPickupLocations   = new Uint16Array(requests.map(r=>r.startPoint))
  const reqDeliveryLocations = new Uint16Array(requests.map(r=>r.endPoint))
  const reqDeadlines =         new Uint32Array(requests.map(r=>r.deadline_h * AVG_SPEED_KMH))
  const reqValues =            new Uint32Array(requests.map(r=>r.value_eur/ KM_COST))
  const unassigned = new Int8Array(requests.map(r=>1))

  const tranStart = new Uint16Array(startpositions)
  const schedule = new Uint32Array(TSIZE * NTRANS)
  const scheduleSizes = new Uint16Array(NTRANS)


  let INF = 1<<15

  function score(tran:number){
    let reward = 0
    let duration = 0
    let decks: [number[], number[]] = [[], []]
    let pos = tranStart[tran]!
    for (let i = 0; i < scheduleSizes[tran]!; i++){
      let step = schedule[tran * TSIZE + i]!
      const load = isload(step)
      const req = getReq(step)
      const nextpos = getPos(step)
      duration += roadmap.getCostN(pos, nextpos)
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

    return reward - duration
  }

  const scheduleRatings = Int32Array.from({length: NTRANS}, (_, i)=>score(i))

  function setReq(tran: number, idx: number, isload: 1|0, deck: 1|0, req: number, pos:number){
    schedule[tran * TSIZE + idx] = (isload << 0) | (deck << 1) | (req << 2) | (pos << 16)
  }


  function insertStops(tran:number, start:number, end: number, deck: 0|1, req:number){

    const offset = tran * TSIZE
    const size = scheduleSizes[tran]!
    scheduleSizes[tran] = size + 2
    schedule.copyWithin(offset + end + 2, offset + end, offset + size)
    schedule.copyWithin(offset + start + 1, offset + start, offset + end + 1)
    setReq(tran, start, 1, deck, req, reqPickupLocations[req]!)
    setReq(tran, end + 1, 0, deck, req, reqDeliveryLocations[req]!)
  }

  function removeStops(tran:number, start:number, end: number){
    const offset = tran * TSIZE
    const size = scheduleSizes[tran]!
    scheduleSizes[tran] = size - 2
    schedule.copyWithin(offset + start, offset + start + 1, offset + end)
    schedule.copyWithin(offset + end - 1, offset + end + 1, offset + size)
  }

  function tryAssign(){
    let tran = randInt(0, NTRANS)
    let schedsize = scheduleSizes[tran]!

    let a = randInt(0,schedsize+1)
    let b = Math.min(schedsize, randInt(0,4) + a)

    let req = randInt(0, NREQS)
    if (!unassigned[req]) return
  
    insertStops(tran, a, b, random() > .5 ? 1 : 0 , req)
    let newrating = score(tran)
    if (newrating < scheduleRatings[tran]!){
      removeStops(tran, a, b+1)
    }else{
      scheduleRatings[tran] = newrating
      unassigned[req] = 0
    }
  }

  function tryUnassign(){
    let tran = randInt(0, NTRANS)
    let schedsize = scheduleSizes[tran]!
    if (schedsize < 2) return
    let idx = randInt(0, schedsize)
    let item = schedule[tran * TSIZE + idx]!
    let req = getReq(item)

    let ab :number[] = []

    for (let i = 0; i < schedsize; i++){
      if (getReq(schedule[tran * TSIZE + i]!) == req) ab.push(i)
    }

    let [a,b] = ab as [number, number]

    removeStops(tran, a,b)
    let newrating = score(tran)
    if (newrating < scheduleRatings[tran]!){
      insertStops(tran, a, b - 1, getDeck(item) as 0|1, req)
    }else{
      scheduleRatings[tran] = newrating
      unassigned[req] = 1
    }
  }


  for (let i = 0; i < 100; i++){
    tryAssign()
  }

  return {
    schedule, scheduleSizes, tranStart
  }

}


let annealer : ReturnType<typeof simpleAnnealing> | null = null


export function plannerView(mod: Module):HTMLElement{

  if (annealer == null) annealer = simpleAnnealing(mod)

  let el = div(

    style({ display: "flex", flexDirection: "row",  maxWidth: "50vw", overflow: "auto"}),

    mod.startpositions.map((start, tran)=>{
      return div(
        style({
          padding: ".3em",
          border: `1px solid ${color.color}`
        }),
        start,
        Array.from({length: annealer!.scheduleSizes[tran]!}, (_,i)=> {

          let step = annealer?.schedule[i]!
          return p(isload(step), ":", getReq(step))
        })
      )
    })

  )
  

  return el


}