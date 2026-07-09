

import { randInt, random } from "../random"
import { borderRadius, color, display, div, p, popup, pre, span, style, table, td, th, tr } from "../view/html"
import type { Module } from "../types"
import { hightLights } from "../view/main"


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



const KM_COST = .5
const AVG_SPEED_KMH = 60
const REORG_COST_EUR = 100

export function simpleAnnealing(mod: Module){

  const {NREQS, requests, startpositions, NTRANS, roadmap} = mod
  const TSIZE = Math.floor(NREQS * 2.5 + 10)

  const reqPickupLocations   = new Uint16Array(requests.map(r=>r.startPoint))
  const reqDeliveryLocations = new Uint16Array(requests.map(r=>r.endPoint))
  const reqDeadlines =         new Uint32Array(requests.map(r=>r.deadline_h * AVG_SPEED_KMH)) // deadline in km
  const reqValues =            new Uint32Array(requests.map(r=>r.value_eur/ KM_COST)) // value in km
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
        if (idx == -1) throw new Error("car not found")
        duration += (deck.length-idx-1) * REORG_COST_EUR / KM_COST
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

  let start_temp = 100
  let temp = start_temp

  function accept(prev_rating:number, next_rating: number){
    return random() < Math.exp((next_rating-prev_rating) / temp)
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
    if (accept(scheduleRatings[tran]!, newrating)){
      scheduleRatings[tran] =newrating
      unassigned[req] = 0
    }else{
      removeStops(tran, a, b+1)
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
    if (accept(scheduleRatings[tran]!, newrating)){
      scheduleRatings[tran] = newrating
      unassigned[req] = 1
    }else{
      insertStops(tran,a,b-1, getDeck(item) as 0|1, req)
    }

  }

  let st = Date.now()

  let NSTEPS = 400000

  for (let i = 0; i < NSTEPS; i++){
    temp = (1-((i)/NSTEPS)) * start_temp
    tryUnassign()
    tryAssign()
  }

  time = Date.now() - st

  return {
    schedule, scheduleSizes, tranStart, TSIZE, scheduleRatings, unassigned
  }

}


let time = 0

let annealer : ReturnType<typeof simpleAnnealing> | null = null




export function plannerView(mod: Module):HTMLElement{
  const outerBorder = "1px solid " + color.gray
  const innerBorder = "1px solid " + color.lightgray
  const cellPadding = ".35em .5em"
  const scheduleCellMinHeight = "2.1em"

  function itemButton (item:number){
    let req = mod.requests[item]!

    let sp = span(item.toString().padStart(3,' '),
      style({cursor:"pointer", border: "2px solid transparent", borderRadius:".2em", whiteSpace: "pre", fontFamily:"monospace"}),
      function(){
        popup(
          p("no: ", item),
          p("value: ", req.value_eur + "€"),
          p("dist: ", mod.roadmap.getCostN(req.startPoint, req.endPoint) + "km")
        )
    })

    sp.onmouseenter = e=>{

      sp.style.borderColor = color.green
      hightLights.set([
        {
          points: [{
            number: req.startPoint,
            logo: "📦"
          }, {
            number: req.endPoint,
            logo: "🏠"
          }],
        }
      ])
    }

    sp.onmouseleave = e=> {sp.style.borderColor = "transparent"}
    return sp
  }

  if (annealer == null) annealer = simpleAnnealing(mod)


  let tab = table(
    style({
      borderCollapse: "collapse",
      width: "100%",
    }),

    tr(
      th("transporter", style({border: outerBorder, padding: cellPadding, textAlign: "left"})),
      th("value", style({border: outerBorder, padding: cellPadding, textAlign: "left"})),
      th("steps", style({border: outerBorder, padding: cellPadding, textAlign: "left"}))
    ),
    mod.startpositions.map((start, tran)=>{
      return tr(

        td(tran, style({border: outerBorder, padding: cellPadding, verticalAlign: "top"})),
        td(annealer?.scheduleRatings[tran]!, style({border: outerBorder, padding: cellPadding, verticalAlign: "top"})),
        table(
          style({
            borderCollapse: "collapse",
          }),

          [0,1].map(deck=>tr(
            Array.from({length: annealer!.scheduleSizes[tran]!}, (_,i)=>{
              let step = annealer?.schedule[tran* annealer.TSIZE + i]!
              return td(
                (getDeck(step) == deck) ? itemButton(getReq(step)) : "",
                style({
                  color: isload(step) ? color.blue : color.green,
                  border: innerBorder,
                  padding: ".2em .3em",
                  minWidth: "2.6em",
                  height: scheduleCellMinHeight,
                  boxSizing: "border-box",
                })
              )
            })
          ))
        ),
        style({
          border: outerBorder,
          padding: ".25em",
          verticalAlign: "top",
        })
      )
    })
  )

  
  return div(
    style({
      padding: "1em",
      overflowY: "auto",
      overflowX: "hidden",
      height: "100%",
      boxSizing: "border-box",
      minHeight: "0",
    }),
    div(
      style({
        overflowX: "auto",
        overflowY: "hidden",
        maxWidth: "100%",
      }),
      tab
    ),
    p("unassigned: ", Array.from(annealer.unassigned).map((x,i)=>({x,i})).filter(x=>x.x).map(x=>span(" ", itemButton(x.i)))),
    p("search time: ", time, "ms"),
    p("score:", annealer.scheduleRatings.reduce((x,y)=>x+y))
  )
}
