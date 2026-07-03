import type { Infer } from "./schema";
import { Location, randomUUID, UUID } from "./module";








export function randomMap ( seed: number = 2){

  function random(){
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  seed = random() * 10000

  let points = new Map<UUID, Location>()
  let roads = new Map<UUID, Map<UUID, {dist: number}>> ()

  function pureDistance (a: Location, b: Location){
    return Math.hypot(a.location.x - b.location.x, a.location.y - b.location.y)
  }

  for (let i = 0; i < 100; i++){


    let id = randomUUID()
    points.set(id, {
      id,
      rep: "DE " + i.toString().padStart(5, "0"),
      location: {x: random(), y: random()}
    }
  )}


  points.values().forEach(p=>{
    roads.set(p.id, new Map())
  })

  for (let p of points.values()){

    let nearest = points.values().toArray().sort((a,b)=> pureDistance(p,a) - pureDistance(p,b)).slice(1,1+3)
    for (let n of nearest){
      let dist = pureDistance(p,n)
      roads.get(p.id)!.set(n.id, {dist})
      roads.get(n.id)!.set(p.id, {dist})
    }
  }


  return {
    points,
    roads,
  }
}


export type RoadMap = typeof randomMap extends () => infer T ? T : never
