
import type { UUID } from "../module";
import { findPath, pairId } from "../planner";
import {  type RoadMap } from "../randomMap";
import { div, p, style } from "./html";
import { getPoint, hightLights, requests, type HighLight } from "./main";


function mkSvg (tag: "circle", x: number, y: number) : {el: SVGCircleElement, setColor: (color: string)=>void}
function mkSvg (tag: "line", x1: number, y1: number, x2: number, y2: number) : {el: SVGLineElement, setColor: (color: string)=>void}
function mkSvg (tag: "text", x: number, y: number, s: string) : {el: SVGTextElement, setColor: (color: string)=>void}

function mkSvg (tag: "circle" | "line" | "text", x1: number, y1: number, x2?: number | string, y2?: number){
  let el = document.createElementNS("http://www.w3.org/2000/svg", tag)
  if (tag == "circle"){
    el.setAttribute("cx", x1.toString())
    el.setAttribute("cy", y1.toString())
    el.setAttribute("r", "0.01")
    el.setAttribute("fill", "gray")
    return {
      el,
      setColor: (color: string)=>{
        el.setAttribute("fill", color)
      }
    }
  }
  else if (tag == "line"){
    el.setAttribute("x1", x1.toString())
    el.setAttribute("y1", y1.toString())
    el.setAttribute("x2", x2!.toString())
    el.setAttribute("y2", y2!.toString())
    el.setAttribute("stroke", "gray")
    el.setAttribute("stroke-width", "0.005")
    return {
      el,
      setColor: (color: string)=>{
        el.setAttribute("stroke", color)
      }
    }
  }
  else if (tag == "text"){
    el.setAttribute("x", x1.toString())
    el.setAttribute("y", y1.toString())
    el.setAttribute("text-anchor", "middle")

    
    el.setAttribute("dominant-baseline", "middle")
    el.textContent = String(x2)
    el.setAttribute("font-size", "0.03")
    el.setAttribute("fill", "gray")
    return {
      el,
      setColor: (color: string)=>{
        el.setAttribute("fill", color)
      }
    }
  }
  throw new Error("Invalid tag")
}



export function mapView (roadmap: RoadMap ) : HTMLElement {


  let element = document.createElementNS("http://www.w3.org/2000/svg", "svg")

  element.setAttribute("width", "80%")
  element.setAttribute("height", "80%")
  element.setAttribute("viewBox", "0 0 1 1")

  let elements = new Map<any, SVGElement>()
  let sources = new Map<SVGElement, any>()
  
  for (let [id1, roads] of roadmap.roads){
    for (let [id2, dist] of roads){
      let a = getPoint(id1)!
      let b = getPoint(id2)!
      let line = mkSvg("line", a.location.x, a.location.y, b.location.x, b.location.y).el
      let id = pairId(a.id, b.id)
      elements.set(id, line)
      sources.set(line, id)
      element.appendChild(line)
    }
  }
  
  for (let point of roadmap.points.values()){

    let circle = mkSvg("circle", point.location.x, point.location.y).el
    elements.set(point, circle)
    sources.set(circle, point)
    element.appendChild(circle)
  }

  let hints: {remove:()=>void}[] = []

  hightLights.onupdate((nH,o)=>{
    hints.forEach(el=>el.remove())
    for (let n of nH){
      let last : UUID | null = null
      for (let p of n.points){
        let next = p.location
        if (last){
          let path = findPath(last, next).path.map(l=>l.location)
          for (let i = 0; i < path.length - 1; i++){
            let line = mkSvg("line", path[i]!.x, path[i]!.y, path[i+1]!.x, path[i+1]!.y)
            line.setColor(n.color ?? "#ffc988")
            line.el.setAttribute("stroke-width", "0.01")
            line.el.setAttribute("z-index", "100")
            element.appendChild(line.el)
            hints.push({remove: ()=>line.el.remove()})
          }

        }
        last = next
      }

      for (let p of n.points){
        let pos = getPoint(p.location).location
        if (p.logo) {
          let el = mkSvg("text", pos.x, pos.y, p.logo)
          el.el.setAttribute("z-index", "1000")
          element.appendChild(el.el)
          hints.push(el.el)

        }

      }

    }
  })

  let dv = div(style({width:"100%", display:"flex", justifyContent:"center", padding: "1em"}))
  dv.append(element)
  return dv
}


