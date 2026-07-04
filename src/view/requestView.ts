import { Location, Price, Request, Time, UUID, type Schedule } from "../types";
import { findPath } from "../planner";
import type { RoadMap } from "../randomMap";
import type { Infer } from "../schema";
import { border, color, h3, html, padding, span, style, table, td, tr, type HTMLGenerator } from "./html";
import { hightLights, requests, roadMap, schedule } from "./main";


export function locString (loc: Infer<typeof Location>) {
  return `📍 ${roadMap.geoCode(loc) ?? "UNK"}`
}

export function transporterString (tran: UUID) {
  return `🚛 ${schedule.get().findIndex(s=>s.transporter == tran).toString().padStart(4, '0')}`
}

export function timeString (time: Time){
  return `${((time.value/60 / 60).toFixed(0))} h`
}

export function priceString (price: Price){
  return `${price.value.toFixed(2)} €`
}





export function requestString (id: UUID) {
  let req = requests.find(r=>r.id == id)
  if (!req) return "UNK"
  return `📦 ${requests.findIndex(x=>x.id == id).toString().padStart(4, '0')}`
}

export function requestView (requests: Request[], schedule: Schedule): HTMLElement{

  let cell = ((...x) => td(style({
    border: "1px solid var(--gray)",
    padding: ".3em .5em",
    cursor:"pointer",
    whiteSpace: "nowrap",
  }), ...x)) as HTMLGenerator<HTMLTableCellElement> 

  return table(
    style({ borderCollapse: "collapse", }),

    tr(["request", "start", "end", "distanz", "preis", "frist" ].map(h=> cell(h), ), style({fontWeight: "bold"})),
    requests.map((r, i)=>{

      let path = findPath(r.startPoint, r.endPoint)

      let row= tr(
        cell(requestString(r.id)),
        cell(locString(r.startPoint)),
        cell(locString(r.endPoint)),
        cell(span( timeString(path.dist), style({float: "right"}))),
        cell(span(priceString(r.value), style({float: "right"}))),
        cell(span(timeString(r.deadline), style({float: "right"}))),
      )
      row.onmouseenter = ()=>{
        row.style.backgroundColor = color.gray,
        hightLights.set([{ points: [
          { location: r.startPoint, logo: "📦" },
          { location: r.endPoint, logo: "🏠" }
        ]}])

      }
      row.onmouseleave = ()=>{
        row.style.backgroundColor = ""
      }
      return row
    })

  )

}