import type { Location, Request, Schedule, ScheduleItem, UUID } from "./module";
import { getPoint, randChoice, requests, roadMap } from "./view/main";



const DECKCAPACITY = 3
const DIST_COST = 1
const UNLOADCOST = 0.1
const PICKUPCOST = 0.1

export function pairId(a: UUID, b: UUID): string{
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

const CostMatrix = new Map<string, number>()

export function findPath(start: UUID, end: UUID): {path: Location[], cost: number}{

  let startPoint = getPoint(start)!
  let endPoint = getPoint(end)!

  let visited = new Map<string, {cost: number, path: Location[]}>()
  visited.set(startPoint.id, {cost: 0, path: [startPoint]})
  let queue = [startPoint]

  while (queue.length > 0){
    let current = queue.shift()!
    if (current.id == endPoint.id){ break}
  
    for (let [nextId, dist] of roadMap.roads.get(current.id) ?? []){
      let next = roadMap.points.get(nextId)!
      let cost = visited.get(current.id)!.cost + dist.dist
      if (!visited.has(next.id) || cost < visited.get(next.id)!.cost){
        visited.set(next.id, {cost, path: [...visited.get(current.id)!.path, next]})
        queue.push(next)
      }
    }
  }

  let path = visited.get(endPoint.id)
  if (!path) throw new Error(`No path found from ${startPoint.id} to ${endPoint.id}`)

  CostMatrix.set(pairId(startPoint.id, endPoint.id), path.cost)

  return path
}


export function getCost(start: UUID, end: UUID): number{
  let id = pairId(start, end)
  if (!CostMatrix.has(id)) findPath(start, end)
  return CostMatrix.get(id)!
}

export function getCostN(...points: UUID[]): number{
  let cost = 0
  for (let i = 0; i < points.length - 1; i++){
    cost += getCost(points[i]!, points[i+1]!)
  }
  return cost
}


export let optDur = 0

export function optimizeSchedule(requests: Request[], schedule: Schedule):Schedule {

  let st = Date.now()

  for (let req of requests){

    let request = req.id
    let sched = randChoice(schedule)
    sched.steps = sched.steps.concat(
      {$:"pickup", val: { request, pos: req.startPoint, deck: Math.random() > .5 ? 1 : 0}},
      {$:"deliver", val: { request: req.id, pos: req.endPoint, }},
    )
  }

  for (let i = 0; i< 1000; i++){
    permute(schedule)
  }

  optDur = Date.now() - st 
  return schedule
}


function randint (n:number){ return Math.floor(Math.random()*n)}

function swap<T> (s:T[], a: number, b:number){
  let t= s[a]!
  s[a] = s[b]!;
  s[b] = t
}

function permute (schedule: Schedule){
  let rating = rateSchedule(schedule)
  schedule.forEach((x,i)=>{
    let a = 1 + randint(x.steps.length-1);
    let b = 1 + randint(x.steps.length-1);
    swap(x.steps, a,b)
    let newrate = rateSchedule(schedule)
    if (newrate <= rating) swap(x.steps, a, b)
    
    if (Math.random() > 0.5) {
      let c = x.steps[1 + randint(x.steps.length-1)];
      if (c?.$ == "pickup"){
        c.val.deck = c.val.deck == 0 ? 1 : 0
        let newrate = rateSchedule(schedule)
        if (newrate <= rating) c.val.deck = c.val.deck == 0 ? 1 : 0
      }
    }
    
  })
}



export function rateSchedule(schedule: Schedule) : number {
  let res = 0
  let dist = 0

  let decks: [UUID[], UUID[]]
  for (let item of schedule){

    decks =  [[], []]

    function unload(reqid: UUID, deck: 0 | 1 ){
      let idx = decks[deck].indexOf(reqid)
      if (idx == -1) return false
      let after = decks[deck].slice(idx+1)
      decks[deck] = decks[deck].slice(0, idx).concat(after)
      res -= UNLOADCOST
      res -= after.length * (UNLOADCOST + PICKUPCOST)
      return true
    }


    if (item.steps[0]?.$ != "start") return - Infinity
    for (let step of item.steps.slice(1)){
      if (step.$ == "pickup") {
        decks[step.val.deck].push(step.val.request)
        if (decks[step.val.deck].length > DECKCAPACITY) return - Infinity
      }
      else if (step.$ == "deliver") {

        let reqid = step.val.request
        let req = requests.find(x=>reqid == x.id)
        if (!req) throw new Error("not found request: "+step.val.request)
        if (!decks.flat().includes(reqid)) return - Infinity
        if (!unload(reqid, 0) && !unload(reqid, 1)) return - Infinity
        res += req.value

      }
      else return - Infinity
    };
    
    dist += getCostN(...item.steps.map(x=>x.val.pos))
  }

  return res - dist * DIST_COST
}
