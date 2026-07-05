
import { Location, randomUUID, Time, uconst, UUID } from "./types";
import { randChoice, random } from "./random";



export function randomMap (){

  let points :Location[] = []

  let roads = new Map<Location, Map<Location, Time>> ()
  let geolocation = new Map<Location, {x: number, y: number}>()
  let geocodes = new Map<Location, string>()

  for (let i = 0; i < 100; i++){

    let point: Location = `loc${randomUUID()}`
    points.push(point)
    geolocation.set(point , {x: random(), y: random()})
    geocodes.set(point, `DE ${geolocation.size.toString().padStart(4, "0")}`)
    roads.set(point, new Map())
  }

  for (let [ID, p] of geolocation.entries()){
    geolocation.entries().toArray().sort(([a,A],[b,B])=> Math.hypot(A.x - p.x, A.y - p.y) - Math.hypot(B.x - p.x, B.y - p.y))
    .slice(1,4).forEach(([id, loc])=>{
      let dist = uconst(Math.hypot(loc.x - p.x, loc.y - p.y) * 10 * 60 * 60, "seconds")
      roads.get(ID)!.set(id, dist)
      roads.get(id)!.set(ID, dist)
    })
  }

  return {
    roads,
    points,
    geolocation(loc: Location){
      let geo = geolocation.get(loc)
      if (!geo) throw new Error(`Location ${loc} not found`)
      return geo
    },
    geoCode(loc: Location){
        let code = geocodes.get(loc)
        if (!code) throw new Error(`Location ${loc} not found`)
        return code
      }
    }
}


export type RoadMap = typeof randomMap extends () => infer T ? T : never
