import { randChoice, randInt, random } from "./random";

export type Pos = {x:number, y: number}


export function randomMap (NPOINTS:number, MAPSIZE:number){

  let HPOINT = NPOINTS/2
  let RSIZE = NPOINTS * HPOINT


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

  function setroad (a: number, b: number, dist: number) {
    if (a==b) throw new Error("Cannot set road from a point to itself")
    roads[roadIDX(a,b)] = dist
  }

  let range = Array.from({length: NPOINTS}, (_,i)=> i)
  let points : Pos[] = range.map(()=>({x: randInt(0,MAPSIZE), y: randInt(0,MAPSIZE)}))
  let neighs = points.map((ps,i)=>
    points.map((p2, i2)=>  ({d: Math.floor(Math.hypot(ps.x - p2.x, ps.y - p2.y)), i: i2}))
    .filter(x => x.i != i) .sort((a,b)=> a.d - b.d) )

  function connect(a: number, b: number, dist: number){
    if (a === b) return
    if (getroad(a, b) !== 0) return
    setroad(a, b, dist)
  }

  // Build a connected backbone by repeatedly attaching the nearest unconnected point.
  const connected = new Set<number>([0])
  while (connected.size < NPOINTS){
    let bestA = -1
    let bestB = -1
    let bestD = Infinity

    for (const a of connected){
      for (const nei of neighs[a] ?? []){
        if (connected.has(nei.i)) continue
        if (nei.d < bestD){
          bestA = a
          bestB = nei.i
          bestD = nei.d
        }
      }
    }

    if (bestA === -1 || bestB === -1) throw new Error("Failed to connect random map")
    connect(bestA, bestB, bestD)
    connected.add(bestB)
  }

  // Add a few extra local roads so the map is not just a tree.
  for (let x = 0; x < NPOINTS; x++){
    const extraEdges = 2 + randInt(0, 3)
    for (let i = 0; i < extraEdges; i++){
      const nx = neighs[x]?.[i]
      if (!nx) continue
      connect(x, nx.i, nx.d)
    }
  }




  const CostMatrix = new Uint32Array(RSIZE);

  {
  
    const pointCount = points.length;
    const INF = 0xffff;
  
    CostMatrix.fill(INF);
  
    for (let start = 0; start < pointCount; start++) {
      const dist = new Uint32Array(pointCount);
      const visited = new Uint8Array(pointCount);
      dist.fill(INF);
      dist[start] = 0;
  
      for (let step = 0; step < pointCount; step++) {
        let current = -1;
        let best = INF;
  
        for (let node = 0; node < pointCount; node++) {
          if (visited[node] === 0 && dist[node]! < best) {
            best = dist[node]!;
            current = node;
          }
        }
  
        if (current === -1) break;
        visited[current] = 1;
  
        for (let next = 0; next < pointCount; next++) {
          if (next === current) continue;
          const road = getroad(current, next);
          if (road === 0) continue;
          const nextCost = dist[current]! + road;
          if (nextCost < dist[next]!) {
            dist[next] = nextCost;
          }
        }
      }
  
      for (let end = 0; end < pointCount; end++) {
        if (end === start) continue;
        const idx = roadIDX(start, end);
        CostMatrix[idx] = Math.min(dist[end]!, INF);
      }
    }
  
  }



  function findPath(start: number, end: number):number[] {

    let path : number[] = [start]
    let cost = CostMatrix[roadIDX(start,end)]
    while (start != end){
      for (let x = 0; x < points.length; x++){
        if (x == start) continue
        let road = getroad(start,x)
        if (road == 0) continue
        let restcost = CostMatrix[roadIDX(x,end)]!
        if (road+ restcost == cost){
          cost = restcost
          start = x
          path.push(x)
          break
        }
      }
    }
    return path
  }
  
  function getCostN(...points: number[]): number {
  
    let cost = 0;
    for (let i = 0; i < points.length - 1; i++) {
      cost += CostMatrix[roadIDX(points[i]!, points[i + 1]!)]!;
    }
    return cost;
  }


  return { getroad, roadIDX, points, range, CostMatrix, findPath, getCostN}
}


export type RoadMap = typeof randomMap extends (...x:any) => (infer T) ? T : never

