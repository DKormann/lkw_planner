import { compile, func, ret, type CompileResult, type FuncHandle, type ModuleDef } from "../wasm";
import { body, p } from "./html";



let mod = await compile({
    foo : func([], "i32", ()=>[
    ret(33)
  ]),
})


type AsyncF <F extends Function> = F extends (...args: infer A)=>infer R ? (...args: A)=>Promise<R> : never


type ModFuncs = {[key in keyof typeof mod] : typeof mod[key] extends Function ? AsyncF<typeof mod[key]> : never}



type WorkerMessage = {
  tag: "module",
  mod: WebAssembly.Module
} | {
  tag: "call",
  func: string,
  args: any[],
} | {
  tag: "result",
  result: any
}

let WokerBundleMain = () => {
  let funcs : Record<string, (...args: any[])=>any> = {}

  onmessage = async (e)=>{

    let msg = e.data as WorkerMessage
    if (msg.tag == "module"){
      let instance = await WebAssembly.instantiate(msg.mod)
      funcs = instance.exports as Record<string, (...args: any[])=>any>

      postMessage({tag: "result", result: 0})
    }

    if (msg.tag == "call"){
      let res = funcs[msg.func]!(...msg.args)
    }
  }
}

let url = URL.createObjectURL(new Blob([`(${WokerBundleMain.toString()})()`], {type: "application/javascript"}))


export async function mkWorker(){
  let worker = new Worker(url)

  function post(msg: WorkerMessage){
    worker.postMessage(msg)
  }

  let resolver : ((x:number) => void) | null = null

  worker.onmessage = (e)=>{
    let msg = e.data as WorkerMessage
    if (msg.tag == "result"){
      if (!resolver) throw new Error("No resolver set")
      resolver(msg.result)
      resolver = null
    }
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
    post({tag: "module", mod: mod.mod})
  })

  return Object.fromEntries(Object.entries(mod)
  .filter(([k,v])=> typeof v == "function")
  .map(([k,v])=>[k, (...args: any[])=>call(k, args)])) as ModFuncs

}

