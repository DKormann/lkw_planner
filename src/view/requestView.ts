import { Request, UUID, type Schedule } from "../module";
import { findPath } from "../planner";
import type { RoadMap } from "../randomMap";
import { border, color, h3, html, padding, span, style, table, td, tr, type HTMLGenerator } from "./html";
import { hightLights, requests, roadMap, schedule } from "./main";


export function locString (id: UUID) {
  return `📍 ${roadMap.points.get(id)?.rep??"UNK"}`
}

export function transporString (id: UUID) {
  return `🚛 ${schedule.get().findIndex(s=>s.transporter == id).toString().padStart(4, '0')}`
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
  }), ...x)) as HTMLGenerator<HTMLTableCellElement> 

  return table(
    style({ borderCollapse: "collapse", }),

    tr(["request", "start", "end", "distanz", "preis", "frist" ].map(h=> cell(h), ), style({fontWeight: "bold"})),
    requests.map((r, i)=>{

      let path = findPath(r.startPoint, r.endPoint)
      let date = new Date(r.deadline)
      let row= tr(
        cell(requestString(r.id)),
        cell(locString(r.startPoint)),
        cell(locString(r.endPoint)),
        cell(span(path.cost.toFixed(2), style({float: "right"}))),
        cell(span(r.value.toString() + "€", style({float: "right"}))),
        cell(date.getDate().toString().padStart(2, "0") + "." + (date.getMonth()+1).toString().padStart(2, "0") + "." + date.getFullYear()),
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