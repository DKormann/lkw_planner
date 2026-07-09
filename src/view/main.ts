import { hash } from "../hash";
import { body, button, color, div, errorpopup, h1, h2, h3, input, margin, p, padding, popup, pre, span, style, table, width, textarea, a, border, html, th, tr, td, borderRadius, panelList, display, background } from "./html";
import { mapView } from "./mapView";
import { randomMap } from "../randomMap";
import { randomUUID, Request, Schedule, UUID } from "../types";
import { requestView } from "./requestView";
import { scheduleView } from "./scheduleView";
import { mkStored, mkWritable, type Writable } from "../writeable";
import { configurePlanner, optimizeSchedule } from "../planner";
import { randChoice, random, setRandSeed } from "../random";
import { number } from "../schema";
import { plannerView } from "../planners/annealing";


export let LKW_COUNT = mkStored("LKW_COUNT", number,  5)
let REQUEST_COUNT = mkStored("REQUEST_COUNT",  number, 20)

body.style.margin = "0"

let header = h1("route planner", style({background: color.blue, color: color.background, margin: "0", padding: ".6em"}))

let contentSpace = div(style({
  display:"flex",
  flexDirection:"row",
  width: "100%",
  height: "calc(100% - 2.5em)",
  minWidth: "0",
}))

let page = div(
  style({display:"flex", flexDirection:"column", height: "100%"}),
  header,
  contentSpace
)

body.replaceChildren(page)


setRandSeed(24)


export let roadMap = randomMap()

export let requests: Request[] = Array.from({length:REQUEST_COUNT.get()}, (_,i)=>({
  id: randomUUID(),
  startPoint: randChoice(roadMap.range),
  endPoint: randChoice(roadMap.range),
  // value: uconst(Math.floor(random()*1000), "eur"),
  // deadline: uconst(Math.floor(random()*60*60*24*7), "seconds"),
  value_eur: Math.floor(random()*1000),
  deadline_km: Math.floor(random()*60*60*24*7),
}))


// export let schedule = mkWritable<Schedule> (Array.from({length: LKW_COUNT.get()}, (_,i)=>({
//   transporter: randomUUID(),
//   steps: [{ $:"start", val: {"pos":  randChoice(roadMap.points)}}]
// })))

export let schedule = mkWritable<Schedule> (Array.from({length: LKW_COUNT.get()}, (_,i)=>({
  transporter: randomUUID(),
  steps: [{ $:"start", val: {"pos":  randChoice(roadMap.range)}}]
})))



configurePlanner({ requests, roadMap })

// schedule.update(sched=>optimizeSchedule(requests, sched))


export type HighLight = {
  points: {
    number: number,
    logo? : string,
  }[],
  color?: string
}

export let hightLights = mkWritable <HighLight[]>( [] )


function setter (store: Writable<number> ){
  let inp = input()
  inp.type = "number"
  inp.onchange = ()=>{
    let val = parseInt(inp.value)
    if (isNaN(val)) return
    store.set(val)
  }
  store.onupdate(val=>inp.value = val.toString())

  return inp
}


function mkWindow (tab: number = 0 ) {

  let tabFields = [
    ['map', mapView(roadMap)],
    ['requests', requestView(requests, schedule.get())],
    ['schedule', scheduleView() ],
    ['settings', div(
      style({
        padding: "1em",
      }),
      h2("settings"),


      table(
        tr(
          td("LKW count"),
          td(setter(LKW_COUNT))
        ),
        tr(
          td("Request count"),
          td(setter(REQUEST_COUNT))
        ),
        tr(button("generate", ()=>{
          window.location.reload()
        }))
      )

    )]
  ] as const

  const el = div(style({
    flex: "1 1 0",
    minWidth: "0",
    height: "calc(100vh - 1em)",
    border: "1px solid "+color.gray,
    overflow: "hidden",
  }))

  function openTab(tab: typeof tabFields[number][0]) {
    el.replaceChildren(
      p(tabFields.map(([n,e])=>
        span( n,
          ()=>openTab(n),
          style({
            padding: ".3em",
            margin: ".3em",
            cursor: "pointer",
            border: "1px solid "+ (n==tab ? color.color : color.gray),
            color: (n==tab) ? color.color : color.gray,
          })
        )
      )),
      tabFields.find(([n,])=>n==tab)![1]
    )
  }


  openTab(tabFields[tab]![0])

  return el
}

// contentSpace.replaceChildren(mkWindow(2 ), mkWindow())

contentSpace.replaceChildren(plannerView())
