import { hash } from "../hash";
import { body, button, color, div, errorpopup, h1, h2, h3, input, margin, p, padding, popup, pre, span, style, table, width, textarea, a, border, html, th, tr, td, borderRadius, panelList, display, background } from "./html";
import { mapView } from "./mapView";
import { randomMap } from "../roadmap";
import { randomModule, randomUUID, Request, Schedule, UUID } from "../types";
import { mkStored, mkWritable, type Writable } from "../writeable";
import { randChoice, random, setRandSeed } from "../random";
import { number } from "../schema";
import { plannerView } from "../planners/annealing";
import { setUpWasm, wasmView } from "./wasmview";


export let LKW_COUNT = mkStored("LKW_COUNT", number,  5)
let REQUEST_COUNT = mkStored("REQUEST_COUNT",  number, 20)

body.style.margin = "0"

let header = h1("route planner", style({background: color.blue, color: color.background, margin: "0", padding: ".6em"}))

let contentSpace = div(style({
  display:"flex",
  flexDirection:"row",
  width: "100%",
  height: "calc(100% - 2.5em)",
  minWidth: "0",
}))

let page = div(
  style({display:"flex", flexDirection:"column", height: "100%"}),
  header,
  contentSpace
)

body.replaceChildren(page)

setRandSeed(24)

export let module = randomModule()

export type HighLight = {
  points: {
    number: number,
    logo? : string,
  }[],
  color?: string
}

export let hightLights = mkWritable <HighLight[]>( [] )


function setter (store: Writable<number> ){
  let inp = input()
  inp.type = "number"
  inp.onchange = ()=>{
    let val = parseInt(inp.value)
    if (isNaN(val)) return
    store.set(val)
  }
  store.onupdate(val=>inp.value = val.toString())

  return inp
}


await setUpWasm(module)

function mkWindow (tab: number = 0 ) {

  let tabFields = [
    ['map', mapView(module)],
    ['planner', plannerView(module)],
    ['wasm', wasmView(module)]
  ] as const

  const el = div(style({
    flex: "1 1 0",
    minWidth: "0",
    height: "calc(100vh - 1em)",
    border: "1px solid "+color.gray,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  }))

  function openTab(tab: typeof tabFields[number][0]) {
    const tabs = p(
      style({
        margin: "0",
        padding: ".4em",
        flex: "0 0 auto",
      }),
      tabFields.map(([n,e])=>
        span( n,
          ()=>openTab(n),
          style({
            padding: ".3em",
            margin: ".3em",
            cursor: "pointer",
            border: "1px solid "+ (n==tab ? color.color : color.gray),
            color: (n==tab) ? color.color : color.gray,
          })
        )
      )
    )

    const content = div(
      style({
        flex: "1 1 auto",
        minHeight: "0",
        minWidth: "0",
      }),
      tabFields.find(([n,])=>n==tab)![1]
    )

    el.replaceChildren(
      tabs,
      content
    )
  }

  openTab(tabFields[tab]![0])

  return el
}

contentSpace.replaceChildren(mkWindow(2 ), mkWindow())
