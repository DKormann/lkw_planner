
import type { Module, UUID } from "../types";
// import { findPath } from "../planner";
import { div, p, style } from "./html";
import { hightLights } from "./main";
import germanyOutline from "./germany_outline.json";


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
  const realMap = "DurationMatrix" in roadmap
  const xs = roadmap.points.map(point => point.x)
  const ys = roadmap.points.map(point => point.y)
  const minX = realMap ? 5.5 : 0
  const maxX = realMap ? 15.5 : MAPSIZE
  const minY = realMap ? 47.2 : 0
  const maxY = realMap ? 55.1 : MAPSIZE
  // At Germany's latitude, one degree of longitude is only about 63% of one degree
  // of latitude. Keep that geographic aspect ratio instead of stretching both axes.
  const projectX = (x: number) => realMap
    ? .135 + .73 * (x - minX) / Math.max(maxX - minX, 1e-9)
    : x / MAPSIZE
  const projectY = (y: number) => realMap
    ? .96 - .92 * (y - minY) / Math.max(maxY - minY, 1e-9)
    : y / MAPSIZE



  let element = document.createElementNS("http://www.w3.org/2000/svg", "svg")

  element.setAttribute("width", "80%")
  element.setAttribute("height", "80%")
  element.setAttribute("viewBox", "0 0 1 1")

  let elements = new Map<any, SVGElement>()
  let sources = new Map<SVGElement, any>()

  if (realMap) {
    const outline = document.createElementNS("http://www.w3.org/2000/svg", "path")
    outline.setAttribute("d", germanyOutline.map(polygon =>
      polygon.map(ring => ring.map(([lon, lat], index) =>
        `${index === 0 ? "M" : "L"}${projectX(lon!)} ${projectY(lat!)}`
      ).join(" ") + " Z").join(" ")
    ).join(" "))
    outline.setAttribute("fill", "#f1f4f0")
    outline.setAttribute("fill-rule", "evenodd")
    outline.setAttribute("stroke", "#829087")
    outline.setAttribute("stroke-width", "0.003")
    outline.setAttribute("vector-effect", "non-scaling-stroke")
    outline.style.pointerEvents = "none"
    element.appendChild(outline)
  }
  
  // A real roadmap's matrix is complete, so drawing every matrix pair would create
  // tens of thousands of lines. Synthetic maps still show their generated roads.
  for (let x =0 ; !realMap && x < roadmap.points.length; x++){
    for (let y = 0; y< roadmap.points.length; y++){
      if (x == y) continue
      let len = roadmap.getroad(x,y)
      if (len == 0 || len == undefined) continue  


      let a = roadmap.points[x]!
      let b = roadmap.points[y]!
      let line = mkSvg("line", projectX(a.x), projectY(a.y), projectX(b.x), projectY(b.y)).el
      let id = "road"+roadmap.roadIDX(x,y)
      elements.set(id, line)
      sources.set(line, id)
      element.appendChild(line)
    }
  }
  
  for (let x =0; x<roadmap.points.length; x++){
    let loc = roadmap.points[x]!
    let circle = mkSvg("circle", projectX(loc.x), projectY(loc.y)).el
    if (realMap) circle.setAttribute("r", "0.004")
    elements.set(x, circle)
    sources.set(circle, x)
    element.appendChild(circle)
  }

  let hints: {remove:()=>void}[] = []
  let highlightVersion = 0
  const geometryCache = new Map<string, Promise<number[][] | null>>()

  function routeGeometry(from: number, to: number) {
    const a = Math.min(from, to), b = Math.max(from, to)
    const key = `${a}-${b}`
    let geometry = geometryCache.get(key)
    if (!geometry) {
      geometry = fetch(`./route-geometry?from=${a}&to=${b}`)
        .then(async response => response.ok ? (await response.json() as {coordinates: number[][]}).coordinates : null)
        .catch(() => null)
      geometryCache.set(key, geometry)
    }
    return geometry.then(coordinates => coordinates && from > to ? [...coordinates].reverse() : coordinates)
  }

  function routePath(coordinates: number[][], color: string) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", coordinates.map(([lon, lat], index) =>
      `${index === 0 ? "M" : "L"}${projectX(lon!)} ${projectY(lat!)}`
    ).join(" "))
    path.setAttribute("fill", "none")
    path.setAttribute("stroke", color)
    path.setAttribute("stroke-width", ".006")
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")
    element.appendChild(path)
    return { remove: () => path.remove() }
  }

  hightLights.onupdate((nH,o)=>{
    const version = ++highlightVersion
    hints.forEach(el=>el.remove())
    hints = []
    for (let n of nH){
      let last : number | null = null
      for (let p of n.points){
        let next = p.number
        if (last !== null){
          let A = roadmap.points[last]!
          let B = roadmap.points[next]!
          let line = mkSvg("line", projectX(A.x), projectY(A.y), projectX(B.x), projectY(B.y))
          line.setColor(n.color ?? "#ffc988")
          line.el.setAttribute("stroke-width", "0.01")
          element.appendChild(line.el)
          const fallback = {remove: ()=>line.el.remove()}
          hints.push(fallback)
          if (realMap && last !== next) {
            void routeGeometry(last, next).then(coordinates => {
              if (version !== highlightVersion || !coordinates) return
              fallback.remove()
              hints = hints.filter(hint => hint !== fallback)
              hints.push(routePath(coordinates, n.color ?? "#ffc988"))
            })
          }
        }
        last = next
      }

      for (let p of n.points){
        if (p.logo) {
          let pos = roadmap.points[p.number]!
          let el = mkSvg("text", projectX(pos.x), projectY(pos.y), p.logo)
          if (realMap) el.el.setAttribute("font-size", ".035")
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
