import { randChoice, randInt, random } from "./random";

export let NPOINTS = 100
let HPOINT = NPOINTS/2
export let RSIZE = NPOINTS * HPOINT
export type Pos = {x:number, y: number}

export const MAPSIZE = 1000

export function randomMap (){

  let roads = new Uint16Array(RSIZE)

  function roadIDX  (a:number, b:number){
    if (a<b) [a,b] = [b,a]
    let idx = a + NPOINTS * b
    if (idx>RSIZE) idx = NPOINTS**2 - idx
    return idx 
  }

  function getroad (a: number, b: number) {
    if (a==b) throw new Error("Cannot get road from a point to itself")
    return roads[roadIDX(a,b)]!
  }

  let rods: {a:number,b:number, dist:number}[] = []

  function setroad (a: number, b: number, dist: number) {

    rods.push({a,b,dist})
    if (a==b) throw new Error("Cannot set road from a point to itself")
    roads[roadIDX(a,b)] = dist
  }

  let range = Array.from({length: NPOINTS}, (_,i)=> i)
  let points : Pos[] = range.map(()=>({x: randInt(0,MAPSIZE), y: randInt(0,MAPSIZE)}))
  let neighs = points.map((ps,i)=>
    points.map((p2, i2)=>  ({d: Math.floor(Math.hypot(ps.x - p2.x, ps.y - p2.y)), i: i2}))
    .filter(x => x.i != i) .sort((a,b)=> a.d - b.d) )


  let found = new Set<number>([0])
  function find(x:number){

    if (found.has(x)) return
    found.add(x)
    range.forEach((p,i)=>{
      if ( i!=x && getroad(i, x) != 0) find(i)
    })
  }

  for (let x = 0; x < NPOINTS; x++){
    for (let i = 0; i < 4; i++){
      let x = randInt(0, NPOINTS)
      let nx = neighs[x]?.[i]!
      setroad(x, nx.i, nx.d)
      if (found.has(x)) find(nx.i)
      if (found.has(nx.i)) find(x)
    }
  }

  return { getroad, roadIDX, points, range }
}


export type RoadMap = typeof randomMap extends () => infer T ? T : never


