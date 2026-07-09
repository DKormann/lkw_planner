
import type { Module, UUID } from "../types";
// import { findPath } from "../planner";
import {  type RoadMap } from "../randomMap";
import { div, p, style } from "./html";
import { hightLights } from "./main";


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
    el.setAttribute("x",x1.toString())
    el.setAttribute("y", y1.toString())
    el.setAttribute("text-anchor", "middle")
    el.setAttribute("dominant-baseline", "middle")
    el.textContent = String(x2)
    el.setAttribute("font-size", ".07")
    el.setAttribute("fill", "gray")

    return { el, setColor: (color: string)=>{ el.setAttribute("fill", color) } }
  }
  throw new Error("Invalid tag")
}



export function mapView ( mod: Module ) : HTMLElement {

  let {roadmap, MAPSIZE} = mod



  let element = document.createElementNS("http://www.w3.org/2000/svg", "svg")

  element.setAttribute("width", "80%")
  element.setAttribute("height", "80%")
  element.setAttribute("viewBox", "0 0 1 1")

  let elements = new Map<any, SVGElement>()
  let sources = new Map<SVGElement, any>()
  
  for (let x =0 ; x < roadmap.points.length; x++){
    for (let y = 0; y< roadmap.points.length; y++){
      if (x == y) continue
      let len = roadmap.getroad(x,y)
      if (len == 0 || len == undefined) continue  


      let a = roadmap.points[x]!
      let b = roadmap.points[y]!
      let line = mkSvg("line", a.x/MAPSIZE, a.y/MAPSIZE, b.x/MAPSIZE, b.y/MAPSIZE).el
      let id = "road"+roadmap.roadIDX(x,y)
      elements.set(id, line)
      sources.set(line, id)
      element.appendChild(line)
    }
  }
  
  for (let x =0; x<roadmap.points.length; x++){
    let loc = roadmap.points[x]!
    let circle = mkSvg("circle", loc.x/MAPSIZE, loc.y/MAPSIZE).el
    elements.set(x, circle)
    sources.set(circle, x)
    element.appendChild(circle)
  }

  let hints: {remove:()=>void}[] = []

  hightLights.onupdate((nH,o)=>{
    hints.forEach(el=>el.remove())
    for (let n of nH){
      let last : number | null = null
      for (let p of n.points){
        let next = p.number
        if (last !== null){
          // let path = roadmap.findPath(last, next)
          // for (let i = 0; i < path.length - 1; i++){
          //   let A = roadmap.points[path[i]!]!
          //   let B = roadmap.points[path[i+1]!]!
          //   let line = mkSvg("line", A.x/MAPSIZE, A.y/MAPSIZE, B.x/MAPSIZE, B.y/MAPSIZE)
          //   line.setColor(n.color ?? "#ffc988")
          //   line.el.setAttribute("stroke-width", "0.01")
          //   line.el.setAttribute("z-index", "100")
          //   element.appendChild(line.el)
          //   hints.push({remove: ()=>line.el.remove()})
          // }
        }
        last = next
      }

      for (let p of n.points){
        if (p.logo) {
          let pos = roadmap.points[p.number]!
          let el = mkSvg("text", pos.x/ MAPSIZE, pos.y/MAPSIZE, p.logo)
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


