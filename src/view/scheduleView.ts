import { uconst, iadd, type ScheduleItem, type UUID, ScheduleStep, Time, add, Request } from "../types";
import { getCost, optDur, optimizeSchedule, rateSchedule } from "../planner";
import { mkWritable } from "../writeable";
import { background, body, borderRadius, button, color, div, h2, html, p, padding, span, style, table, td, tr, width } from "./html";
import { hightLights, requests, roadMap, schedule } from "./main";
import { locString, priceString, requestString, timeString, transporterString } from "./requestView";


function stepLogo (step: ScheduleStep){
  if (step.$ == "start") return '🚛'
  if (step.$ == "pickup") return '📦'
  if (step.$ == "deliver") return '🏠'
  throw new Error("unexpected tag:", step)
}

export function getRequest(id: UUID){
  let req = requests.find(r=>r.id == id)
  if (!req) throw new Error(`not found request ${id}`)
  return req
}

export function stepRequest(step: ScheduleStep){
  if (step.$ == "start") return undefined
  return getRequest(step.val.request)
}

function stepString (step: ScheduleStep){

  if (step.$ == "start") return `start`
  let req = getRequest(step.val.request)
  return `${step.$} ${requestString(step.val.request)}: ${priceString(req.value)} deadline ${timeString(req.deadline)}`
}

let cursor = mkWritable({row: 1, col: 1})

body.addEventListener("keydown", e=>{
  cursor.update((cursor) =>{
    if (cursor.col == -1) return
    if (e.key == "ArrowLeft")         cursor.col -= 1
    else if (e.key == "ArrowRight")   cursor.col += 1
    else if (e.key == "ArrowUp")      cursor.row -= 1
    else if (e.key == "ArrowDown")    cursor.row += 1
    else if (e.key == "Escape")       cursor = {row: -1, col: -1}
    else return
    e.preventDefault()
    cursor.row = Math.max(0, Math.min( schedule.get().length-1, cursor.row))
    cursor.col = Math.max(0, Math.min( schedule.get()[cursor.row]!.steps.length-1, cursor.col))
  })

})



export const scheduleView = () => {

  let cell = ((...x) => td(style({
    border: "1px solid var(--gray)",
    margin: "0",
    padding: ".3em .5em",
    cursor: "pointer",
    whiteSpace: "nowrap",
  }), ...x)) as typeof td;

  const tabview = div()
  const rejectView = div()
  const stepview = div()
  let stepEls = [] as HTMLSpanElement[][]
  let rowEls = [] as HTMLTableRowElement[]

  let times : Time[][] = []

  let decks : [Request[], Request[]] [] []  = []

  
  schedule.onupdate(sched => {

    times = sched.map(s=> [uconst(0, "seconds")])
    decks = sched.map(s=> [[[], []]])


    cursor.onupdate(cursor=>{

      let {row, col: n} = cursor

      let steps = sched[row]!.steps
      let step = steps[n]
      if (!step) return

      let request = step.$ == "start" ? undefined : step.val.request

      stepEls.forEach((rowEls, rown)=>{
        rowEls.forEach((el,i)=>{

          let step = sched[rown]!.steps[i]
          if (!step) return
          let border = color.background
          if (i == n && row == rown) {
            border = color.blue 
            viewStep(row, n, stepview, times[row]![n]!, times[row]![times[row]!.length-1]!, decks[row]![n]!)
          }
          else if (step.$ != "start" && step.val.request == request) border = color.gray
          el.style.borderColor = border
        })
      })

      let logo = stepLogo(step)

      hightLights.set([
        { points: steps.slice(n,n+2).map((p,i)=>({location: p.val.pos})), color: "#ffc988" },
        { points: [{location:step.val.pos, logo}] }
      ])
    }, true)




    tabview.replaceChildren(table(
      ["transporter", "steps"].map(h=> cell(h), ), style({fontWeight: "bold"}),
      sched.map((s, rown)=>{

        let allPoints = s.steps.map(step=> ({ location: step.val.pos, logo: stepLogo(step) }))
        let transport = span(transporterString(s.transporter))
        transport.onmouseenter = ()=>hightLights.set([{points: allPoints, color: "#ffc988",}])

        stepEls.push( s.steps.map((step,i)=>{
          if (i>0){
            let prev = s.steps[i-1]!
            let dist = getCost(prev.val.pos, step.val.pos)
            times[rown]!.push(add(times[rown]![i-1]!, dist))

            // console.log("DECK", rown, i, decks[rown]![i-1]!)
            let deck = [...decks[rown]![i-1]!] as [Request[], Request[]]

            if (step.$ == "pickup") deck[step.val.deck]! = [...deck[step.val.deck]!, getRequest(step.val.request)]
            else if (step.$ == "deliver") deck = deck.map((d, j)=> d.filter(r=>r.id != step.val.request) ) as [Request[], Request[]]
            decks[rown]!.push(deck)

          }

          let time = times[rown]![i]!

          let req = stepRequest(step)

          let logo = stepLogo(step)
          let res = span(logo, style({padding: ".1em .1em",
            background:req && req.deadline.value < time.value ? color.red : "",
            border: "0.2em solid " + color.background,
            borderRadius: "0.3em",
            
          }))

          res.onclick = ()=>{
            console.log("CLICK", rown, i)
            cursor.set({row: rown, col: i})
          }
          return res
        }))

        let row= tr(cell(transport), cell(stepEls[rown]!))
        rowEls.push(row)
        return row
      }),
      style({ borderCollapse: "collapse", }),
    ));
    let rejects = requests.filter(r=>!sched.flatMap(s=>s.steps).some(step=>step.$ != "start" && step.val.request == r.id))

    rejectView.replaceChildren(

      rejects.length == 0 ? span() : div(
        div(
          p("open requests", style({fontWeight: "bold", padding: ".3em", margin: ".3em"})),
          rejects.map(r=>span(requestString(r.id), style({padding: ".3em", margin: ".3em", whiteSpace: "nowrap"}))),
          style({
            display: "row",
            flexDirection: "column",
            padding: ".5em",
            marginTop: ".5em",
            border: "1px solid "+color.gray,
          })
        )
      )
    )
  })

  let value = span()
  schedule.onupdate(sch=>value.textContent = rateSchedule(sch).toFixed(2))


  let scheduleEl = div(
    style({
      width: "calc(100% - 2em)",
      height: "100%",
      overflow: "auto",
      minWidth: "0",
      padding: ".5em",
    }),
    tabview,
    rejectView,
    p("Value: ", value),
    p("search time:", optDur),
    stepview,
  )
  return scheduleEl
}



function viewStep(row: number, n: number, parent: HTMLElement, dist: Time, total: Time, decks: [Request[], Request[]]){
  let steps = schedule.get()[row]
  if (!steps) return
  let step = steps.steps[n]
  if (!step) return

  // let decks = [[],[]] as [UUID[], UUID[]]

  let visual = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  visual.setAttribute("width", "100%")

  visual.setAttribute("viewBox", "-0.1 -0.1 1.2 1.2")
  visual.setAttribute("preserveAspectRatio", "xMidYMid meet")

  let transporter = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
  let points = [ [.2, 0], [.0, .2], [.0, .4], [.2, .4], [.8, .4], [.8, .37], [.2, .37], [.2, .2], [.8, .2], [.8, .17], [.2, .17],]
  transporter.setAttribute("points", points.map(p=>p.join(",")).join(" "))
  transporter.setAttribute("fill", color.blue)

  visual.appendChild(transporter)

  decks.forEach((deck, i)=>{
    deck.forEach((req, j)=>{
      let car = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      car.setAttribute("x", (0.225 + .2 * j).toString())
      car.setAttribute("y", (0.25 - 0.2  * i).toString())
      car.setAttribute("width", ".15")
      car.setAttribute("height", "0.12")
      car.setAttribute("fill", color.gray)
      visual.appendChild(car)

      let text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", (0.225 + .2 * j + 0.075).toString())
      text.setAttribute("y", (0.27 - 0.2 * i + 0.05).toString())
      text.setAttribute("text-anchor", "middle")
      text.setAttribute("dominant-baseline", "middle")
      text.setAttribute("font-size", ".04")
      text.setAttribute("fill", color.color)
      text.textContent = `${requestString(req.id)}`
      visual.appendChild(text)
      
    })
  })

  for (let x of [0.2, 0.6]){
    let tire = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    tire.setAttribute("cx", x.toString())
    tire.setAttribute("cy", "0.5")
    tire.setAttribute("r", "0.07")
    tire.setAttribute("fill", color.blue)
    visual.appendChild(tire)
  }



  let dead = step.$ != "start" && getRequest(step.val.request).deadline.value < dist.value

  let res = div(
    h2(transporterString(steps.transporter)),
    p(`${timeString(dist)} / ${timeString(total)}`),
    p(stepString(step), style({color: dead ? color.red : color.color})),
    style({
      border: "1px solid var(--gray)",
      margin: "0",
      padding: ".3em .5em",
      minHeight: "2em",
    })
  )

  res.append(visual)
  parent.replaceChildren(res)
}
