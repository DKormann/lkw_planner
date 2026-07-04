import { unit_const, unit_iadd, type ScheduleItem, type UUID } from "../types";
import { getCost, optDur, optimizeSchedule, rateSchedule } from "../planner";
import { mkWritable } from "../writeable";
import { body, button, color, div, h2, html, p, padding, span, style, table, td, tr, width } from "./html";
import { hightLights, requests, roadMap, schedule } from "./main";
import { locString, timeString, transporterString } from "./requestView";


function stepLogo (step: ScheduleItem['steps'][number]){
  if (step.$ == "start") return '🚛'
  if (step.$ == "pickup") return '📦'
  if (step.$ == "deliver") return '🏠'
  throw new Error("unexpected tag:", step)
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

  let tabview = div()
  let stepview = div()
  let stepEls = [] as HTMLSpanElement[][]
  let rowEls = [] as HTMLTableRowElement[]

  schedule.onupdate(sched => {


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
          let background = ''
          if (i == n && row == rown) {
            background = color.green  
            viewStep(row, n, stepview)
          }
          else if (step.$ != "start" && step.val.request == request) background = color.gray
          el.style.background = background
        })
      })

      let logo = stepLogo(step)

      hightLights.set([
        { points: steps.slice(n,n+2).map((p,i)=>({location: p.val.pos})), color: "#ffc988" },
        { points: [{location:step.val.pos, logo}] }
      ])
    })


    tabview.replaceChildren(table(
      ["transporter", "steps"].map(h=> cell(h), ), style({fontWeight: "bold"}),
      sched.map((s, rown)=>{

        let allPoints = s.steps.map(step=> ({ location: step.val.pos, logo: stepLogo(step) }))
        let transport = span(transporterString(s.transporter))
        transport.onmouseenter = ()=>hightLights.set([{points: allPoints, color: "#ffc988",}])

        stepEls.push( s.steps.map((step,i)=>{
          let logo = stepLogo(step)
          let res = span(logo, style({padding: ".3em .3em",}))

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
    ))



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
    p("Value: ", value),
    p("search time:", optDur),
    stepview,
  )
  return scheduleEl
}



function viewStep(row: number, n: number, parent: HTMLElement){
  let steps = schedule.get()[row]
  if (!steps) return
  let step = steps.steps[n]
  if (!step) return

  let totalDist = unit_const(0, "seconds")
  let dist = unit_const(0,"seconds")

  let decks = [[],[]] as [UUID[], UUID[]]

  for (let i = 1; i < steps.steps.length; i++){
    if (i <= n) {
      let step = steps.steps[i]!
      if (step.$ == "pickup") decks[step.val.deck].push(step.val.request)
      if (step.$ == "deliver") decks = decks.map(d=>d.filter(r=>r != step.val.request)) as [UUID[], UUID[]]
    }

    unit_iadd(totalDist, getCost(steps.steps[i-1]!.val.pos, steps.steps[i]!.val.pos))
    if (i == n) dist.value = totalDist.value
  }



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
      text.setAttribute("font-size", ".06")
      text.setAttribute("fill", color.color)
      text.textContent = `${requests.findIndex(r=>r.id == req).toString().padStart(4, '0')}`
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
  let res = div(
    h2(transporterString(steps.transporter)),
    p(`distance: ${timeString(dist)} / ${timeString(totalDist)}`),
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
