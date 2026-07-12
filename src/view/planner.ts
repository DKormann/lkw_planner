
import { compile, func, ret, array, whileLoop, local, loop } from "../wasm";
import { body, p } from "./html";


let arr = array("i32", 1024)

export const mod = await compile({
  foo : func([], "i32", ()=>[
    ret(22)
  ]),
  fill: func(["i32"], "i32", n=>{
    let x = local.i32()
    return [
      loop(x.lt(n), [
        arr.store(x,x),
        x.iadd(1)
      ]),
      ret(n)
    ]
  }),
  arr
}, { shared: true })



type AsyncF <F extends Function> = F extends (...args: infer A)=>infer R ? (...args: A)=>Promise<R> : never
type ModFuncs = {[key in keyof typeof mod] : typeof mod[key] extends Function ? AsyncF<typeof mod[key]> : never}

type WorkerMessage = {
  tag: "module",
  mod: WebAssembly.Module,
  memory: WebAssembly.Memory,
} | {
  tag: "call",
  func: string,
  args: any[],
}

type ResponseMessage = {
  tag: "result",
  result: any
} | {
  tag: "error",
  error: string
}

let WokerBundleMain = () => {
  let funcs : Record<string, (...args: any[])=>any> = {}
  onmessage = async (e)=>{
    let msg = e.data as WorkerMessage
    if (msg.tag == "module"){
      let instance = await WebAssembly.instantiate(msg.mod, { env: { memory: msg.memory } })
      funcs = Object.fromEntries(Object.entries(instance.exports).filter(([, v]) => typeof v === "function")) as Record<string, (...args: any[])=>any>
      postMessage({tag: "result", result: 0})
    }
    if (msg.tag == "call"){
      let func = funcs[msg.func]
      if (!func) return postMessage({tag: "error", error: `Function ${msg.func} not found`})
      try{
        let res = func(...msg.args)
        postMessage({tag: "result", result: res})
      }catch(e){
        postMessage({tag: "error", error: String(e)})
      }
    }
  }
}

let url = URL.createObjectURL(new Blob([`(${WokerBundleMain.toString()})()`], {type: "application/javascript"}))


export async function mkWorker(){
  if (mod.memory.buffer instanceof SharedArrayBuffer && !self.crossOriginIsolated) {
    throw new Error(
      "Shared wasm workers require crossOriginIsolated. Serve the page with Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp."
    )
  }

  let worker = new Worker(url)

  function post(msg: WorkerMessage){
    worker.postMessage(msg)
  }

  let resolver : ((x:number) => void) | null = null

  worker.onmessage = (e)=>{
    let msg = e.data as ResponseMessage
    if (msg.tag == "result"){
      if (!resolver) throw new Error("No resolver set")
      resolver(msg.result)
      resolver = null
    }
    if (msg.tag == "error") throw new Error(msg.error)
  }

  let call = (func: string, args: any[]) => {
    if (resolver) throw new Error("Already waiting for a result")
    return new Promise<number>((resolve)=>{
      resolver = resolve
      post({tag: "call", func, args})
    })
  }

  await new Promise<void>((res)=>{
    resolver = (x)=>res()
    post({tag: "module", mod: mod.mod, memory: mod.memory})
  })

  return Object.fromEntries(Object.entries(mod)
  .filter(([k,v])=> typeof v == "function")
  .map(([k,v])=>[k, (...args: any[])=>call(k, args)])) as ModFuncs

}
