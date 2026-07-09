import { Request, UUID, type Schedule } from "../types";
import type { RoadMap } from "../randomMap";
import type { Infer } from "../schema";
import { border, color, div, h3, html, padding, span, style, table, td, tr, type HTMLGenerator } from "./html";


export function locString (loc: number) {
  return `📍 ${roadMap.points[loc] ?? "UNK"}`
}

export function transporterString (tran: UUID) {
  return `🚛 ${schedule_store.get().findIndex(s=>s.transporter == tran).toString().padStart(4, '0')}`
}

export function timeString (secs: number){
  // return `${((number.value/60/60).toFixed(2))} h`
  return `${Math.floor(secs/60/60).toString().padStart(2, '0')}:${Math.floor((secs/60)%60).toString().padStart(2, '0')}h`
}

export function costString (val: number){
  return `${val.toFixed(0)} €`
}

export function requestString (id: UUID) {
  let req = requests.find(r=>r.id == id)
  if (!req) return "UNK"
  return `📦 ${requests.findIndex(x=>x.id == id).toString().padStart(4, '0')}`
}
export function distanceString (dist: number){
  return `${dist.toFixed(2)} km`
}


export function requestView (requests: Request[]): HTMLElement{

  let cell = ((...x) => td(style({
    border: "1px solid var(--gray)",
    padding: ".3em .5em",
    cursor:"pointer",
    whiteSpace: "nowrap",
  }), ...x)) as HTMLGenerator<HTMLTableCellElement> 

  return div(
    style({
      overflow: "auto",
      maxHeight: "80%",
    }),
    table(
      style({ borderCollapse: "collapse"}),

      tr(["request", "start", "end", "distanz", "preis", "frist" ].map(h=> cell(h), ), style({fontWeight: "bold"})),
      requests.map((r, i)=>{

        // let path = findPath(r.startPoint, r.endPoint)
        let dist = getCostN(r.startPoint, r.endPoint)

        let row= tr(
          cell(requestString(r.id)),
          cell(locString(r.startPoint)),
          cell(locString(r.endPoint)),
          cell(span(distanceString(dist), style({float: "right"}))),
          cell(span(costString(r.value_eur), style({float: "right"}))),
          cell(span(timeString(r.deadline_h), style({float: "right"}))),
        )
        row.onmouseenter = ()=>{
          row.style.backgroundColor = color.gray,
          hightLights.set([{ points: [
            { number: r.startPoint, logo: "📦" },
            { number: r.endPoint, logo: "🏠" }
          ]}])

        }
        row.onmouseleave = ()=>{
          row.style.backgroundColor = ""
        }
        return row
      })

    )
  )

}