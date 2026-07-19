import { decodeStruct, type ArgsVal, type AnyFunc, type CompileResult, type ModuleDef, type Value } from "./wasm";

type WorkerRequestPayload = {
  tag: "module"
  mod: WebAssembly.Module
  memory: WebAssembly.Memory
  trapMessages: string[]
  logMessages: string[]
} | {
  tag: "call"
  func: string
  args: unknown[]
}
type WorkerRequest = WorkerRequestPayload & { id: number }

type WorkerResponse = {
  id: number
  tag: "result"
  result: unknown
} | {
  id: number
  tag: "error"
  error: string
}


const workerBundleMain = () => {
  let funcs: Record<string, (...args: any[]) => any> = {}

  onmessage = async (event) => {
    const msg = event.data as WorkerRequest
    try {
      if (msg.tag === "module") {
        const trap = (id: number): never => { throw new Error(msg.trapMessages[id] ?? `Unknown WASM trap ${id}`) }
        const log = (id: number, value: number) => console.log(msg.logMessages[id] ?? `WASM log ${id}`, value)
        const instance = await WebAssembly.instantiate(msg.mod, { env: { memory: msg.memory, trap, log } })
        funcs = Object.fromEntries(
          Object.entries(instance.exports).filter((entry): entry is [string, (...args: any[]) => any] => typeof entry[1] === "function"),
        )
        postMessage({ id: msg.id, tag: "result", result: null } satisfies WorkerResponse)
        return
      }

      const fn = funcs[msg.func]
      if (!fn) throw new Error(`Function ${msg.func} not found`)
      postMessage({ id: msg.id, tag: "result", result: fn(...msg.args) } satisfies WorkerResponse)
    } catch (error) {
      postMessage({ id: msg.id, tag: "error", error: String(error) } satisfies WorkerResponse)
    }
  }
}

const workerUrl = URL.createObjectURL(
  new Blob([`(${workerBundleMain.toString()})()`], { type: "application/javascript" }),
)

type FuncResult<F extends AnyFunc> = F["result"] extends import("./wasm").NumType ? Value<F["result"]> : void
export type WorkerProxy<T extends ModuleDef> = {
  [K in keyof T as T[K] extends AnyFunc ? K : never]:
    T[K] extends AnyFunc ? (...args: ArgsVal<T[K]["params"]>) => Promise<FuncResult<T[K]>> : never
} & {
  terminate(): void
}

export async function mkWorker<T extends ModuleDef>(mod: CompileResult<T>): Promise<WorkerProxy<T>> {
  if (!self.crossOriginIsolated) {
    throw new Error(
      "Shared wasm workers require crossOriginIsolated. Serve the page with Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp.",
    )
  }

  const worker = new Worker(workerUrl)
  let nextId = 1
  let terminated = false
  const pending = new Map<number, { resolve(value: unknown): void, reject(error: Error): void }>()

  const rejectAll = (error: Error) => {
    for (const request of pending.values()) request.reject(error)
    pending.clear()
  }

  worker.onmessage = (event) => {
    const msg = event.data as WorkerResponse
    const request = pending.get(msg.id)
    if (!request) return
    pending.delete(msg.id)
    if (msg.tag === "result") request.resolve(msg.result)
    else request.reject(new Error(msg.error))
  }
  worker.onerror = (event) => rejectAll(new Error(event.message || "WASM worker failed"))
  worker.onmessageerror = () => rejectAll(new Error("Could not deserialize a WASM worker response"))

  const request = <R>(msg: WorkerRequestPayload): Promise<R> => {
    if (terminated) return Promise.reject(new Error("WASM worker has been terminated"))
    const id = nextId++
    return new Promise<R>((resolve, reject) => {
      pending.set(id, { resolve: value => resolve(value as R), reject })
      try {
        worker.postMessage({ ...msg, id } as WorkerRequest)
      } catch (error) {
        pending.delete(id)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  try {
    await request<void>({ tag: "module", mod: mod.mod, memory: mod.memory, trapMessages: mod.trapMessages, logMessages: mod.logMessages })
  } catch (error) {
    terminated = true
    worker.terminate()
    rejectAll(error instanceof Error ? error : new Error(String(error)))
    throw error
  }

  const funcs = Object.fromEntries(
    Object.keys(mod)
      .filter(key => typeof mod[key] === "function")
      .map(key => [key, (...args: unknown[]) =>
        request({ tag: "call", func: key, args }).then(value => {
          const struct = mod.resultStructs[key]
          return struct ? decodeStruct(struct, value as number | bigint) : value
        })]),
  )

  return Object.assign(funcs, {
    terminate() {
      if (terminated) return
      terminated = true
      worker.terminate()
      rejectAll(new Error("WASM worker has been terminated"))
    },
  }) as WorkerProxy<T>
}
