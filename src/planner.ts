import { Time, add, uconst, iadd, type Location, type Request, type Schedule, type ScheduleItem, type UUID, isub, mul } from "./types";
import { requests, roadMap } from "./view/main";
import { randChoice, random } from "./random";


const DECKCAPACITY = 3
const UNLOADCOST = uconst(10, "eur")
const PICKUPCOST = uconst(5, "eur")
const COST_PER_H = 50
const COST_PER_SECOND = COST_PER_H / 3600


export function pairId(a: string, b: string): string{
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

const CostMatrix = new Map<string, Time>()

export function findPath(start: Location, end: Location): {path: Location[], dist: Time}{


  let visited = new Map<Location, {dist: Time, path: Location[]}>()
  visited.set(start, {dist: uconst(0, "seconds"), path: [start]})
  let queue = [start]

  while (queue.length > 0){
    let current = queue.shift()!
    if (current == end){ break}
  
    for (let [next, dist] of roadMap.roads.get(current) ?? []){
      let cost = add(visited.get(current)!.dist, dist)
      if (!visited.has(next) || cost < visited.get(next)!.dist){
        visited.set(next, {dist: cost, path: [...visited.get(current)!.path, next]})
        queue.push(next)
      }
    }
  }

  let path = visited.get(end)
  if (!path) throw new Error(`No path found from ${start} to ${end}`)

  CostMatrix.set(pairId(start, end), path.dist)

  return path
}


export function getCost(start: Location, end: Location): Time{
  let id = pairId(start, end)
  if (!CostMatrix.has(id)) findPath(start, end)
  return CostMatrix.get(id)!
}

export function getCostN(...points: Location[]): Time{
  let cost = uconst(0, "seconds")
  for (let i = 0; i < points.length - 1; i++){
    iadd(cost, getCost(points[i]!, points[i+1]!))
  }
  return cost
}


export let optDur = 0

export function optimizeSchedule(requests: Request[], schedule: Schedule):Schedule {

  let free_requests = [...requests.filter(x=>!schedule.flatMap(y=>y.steps).some(z=>z.$ == "pickup" && z.val.request == x.id))]

  function permute (schedule: Schedule){
    let rating = rateSchedule(schedule)
    for (let schedItem of schedule){

      if (random() < 0.1){
        if (random() < 0.5){
          if (free_requests.length > 1){
            let req = free_requests.shift()!

            let oldsteps = schedItem.steps
            let itemrating = rateSchedule([schedItem])

            schedItem.steps = [...oldsteps,
              {$:"pickup", val: { request: req.id, pos: randChoice(roadMap.points), deck: random() > .5 ? 1 : 0}},
              {$:"deliver", val: { request: req.id, pos: randChoice(roadMap.points)}},
            ]

            let newrating = rateSchedule([schedItem])

            if (newrating < itemrating){
              schedItem.steps = oldsteps
              free_requests.push(req)
            }
            continue
          }
        }else{
          if (schedItem.steps.length > 3){

            let itemrating = rateSchedule([schedItem])
            let req = randChoice(schedItem.steps.filter(x=>x.$ == "pickup")!).val.request
            let oldsteps = schedItem.steps
            schedItem.steps = oldsteps.filter(x=>(x.$ == "start" || (x.val.request != req)))
            let newrating = rateSchedule([schedItem])
            if (newrating < itemrating) {
              schedItem.steps = oldsteps
            }
            else console.log("removed request ", req, " from schedule")
            continue
          }
        }
      }

      if (schedItem.steps.length <= 2) continue

      let a = 1 + randint(schedItem.steps.length-1);
      let b = 1 + randint(schedItem.steps.length-1);
      swap(schedItem.steps, a,b)
      let newrate = rateSchedule(schedule)
      if (newrate <= rating) swap(schedItem.steps, a, b)

      if (random() > 0.5) {
        let c = schedItem.steps[1 + randint(schedItem.steps.length-1)];
        if (c?.$ == "pickup"){
          c.val.deck = c.val.deck == 0 ? 1 : 0
          let newrate = rateSchedule(schedule)
          if (newrate <= rating) c.val.deck = c.val.deck == 0 ? 1 : 0
        }
      }
    }
  }

  let st = Date.now()

  for (let i = 0; i< 2000; i++){

    if (i == 0 || (i+1) % 1000 == 0){
      console.log("opt step: ", i+1)
    }
    permute(schedule)
  }

  optDur = Date.now() - st 
  return schedule
}


function randint (n:number){ return Math.floor(random()*n)}

function swap<T> (s:T[], a: number, b:number){
  let t= s[a]!;
  s[a] = s[b]!;
  s[b] = t
}

export function rateSchedule(schedule: Schedule) : number {
  let res = uconst(0, "eur")
  let duration = uconst(0,  "seconds")

  let decks: [UUID[], UUID[]]
  for (let item of schedule){

    decks =  [[], []]

    function unload(reqid: UUID, deck: 0 | 1 ){
      let idx = decks[deck].indexOf(reqid)
      if (idx == -1) return false
      let after = decks[deck].slice(idx+1)
      decks[deck] = decks[deck].slice(0, idx).concat(after)
      isub(res, UNLOADCOST)
      isub(res, mul(add(UNLOADCOST, PICKUPCOST), after.length))
      return true
    }

    if (item.steps[0]?.$ != "start") return - Infinity
    for (let step of item.steps.slice(1)){
      if (step.$ == "pickup") {
        decks[step.val.deck].push(step.val.request)
        if (decks[step.val.deck].length > DECKCAPACITY) return - Infinity
      } else if (step.$ == "deliver") {

        let reqid = step.val.request
        let req = requests.find(x=>reqid == x.id)

        if (!req) throw new Error("not found request: "+step.val.request)
        if (!unload(reqid, 0) && !unload(reqid, 1)) return - Infinity

        if (duration.value < req.deadline.value) iadd(res, req.value)

      }
      else return - Infinity
    };
    
    iadd(duration, getCostN(...item.steps.map(x=>x.val.pos)))
  }

  return res.value - duration.value * COST_PER_SECOND   
}
