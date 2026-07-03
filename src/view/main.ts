import { hash } from "../hash";
import { body, button, color, div, errorpopup, h1, h2, h3, input, margin, p, padding, popup, pre, span, style, table, width, textarea, a, border, html, th, tr, td, borderRadius, panelList, display, background } from "./html";
import { mapView } from "./mapView";
import { randomMap } from "../randomMap";
import { randomUUID, Request, Schedule, UUID } from "../module";
import { requestView } from "./requestView";
import { scheduleView } from "./scheduleView";
import { mkWritable } from "../writeable";
import { optimizeSchedule } from "../planner";

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


export function randChoice<T>(arr:T[]):T{
  return arr[Math.floor(Math.random()*arr.length)]!
}

export let roadMap = randomMap(1)

export function getPoint(id: UUID){
  let point = roadMap.points.get(id)
  if (!point) throw new Error(`Point ${id} not found`)
  return point
}

export let requests: Request[] = Array.from({length:20}, (_,i)=>({
  id: randomUUID(),
  startPoint: randChoice(Array.from(roadMap.points.keys())),
  endPoint: randChoice(Array.from(roadMap.points.keys())),
  value: Math.floor(Math.random()*100),
  deadline: Date.now() + Math.floor(Math.random()*30) * 24 * 60 * 60 * 1000,
}))


export let schedule = mkWritable<Schedule> (Array.from({length: 3}, (_,i)=>({
  transporter: randomUUID(),
  steps: [{$:"start", val: {pos: randChoice(roadMap.points.values().toArray().map(x=>x.id))}}]
})))


schedule.update(x=>optimizeSchedule(requests,x))

export type HighLight = {
  points: {
    location: UUID,
    logo? : string,
  }[],
  color?: string
}

export let hightLights = mkWritable <HighLight[]>( [] )


function mkWindow (tab: number = 0 ) {

  let tabFields = [
    ['map', mapView(roadMap)],
    ['requests', requestView(requests, schedule.get())],
    ['schedule', scheduleView() ],
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

contentSpace.replaceChildren(mkWindow(2), mkWindow())
