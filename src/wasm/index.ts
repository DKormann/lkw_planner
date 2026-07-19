export {
  array, boundsCheck, exp, f32, f64, fn, for_, global, i32, i64, i64u,
  ifElse, log, return_, struct, trap, variable, when, while_,
} from "./ast"
export type {
  AnyArray, AnyFunc, ArgsVal, ArrayHandle, CompileResult, DType, Expr, ExprLike,
  GlobalValue, JSStruct, LocalVar, ModuleDef, MutableStruct, MutableValue,
  NumType, StructType, Value,
} from "./ast"
export { formatModule } from "./format"

import { analyzeModule } from "./analyze"
import { emitModule } from "./codegen"
import type {
  AnyArray, AnyFunc, CompileResult, JSStruct, ModuleDef, StructFields, StructType,
} from "./ast"

const arrayCtors = {
  i8: Int8Array, u8: Uint8Array, i16: Int16Array, u16: Uint16Array,
  i32: Int32Array, i64: BigInt64Array, f32: Float32Array, f64: Float64Array,
  su8: Uint8Array, su16: Uint16Array, si32: Uint32Array, si64: BigUint64Array,
}

export const decodeStruct = <F extends StructFields>(type: StructType<F>, raw: number | bigint): JSStruct<F> => {
  const packed = BigInt.asUintN(type.size * 8, BigInt(raw))
  return Object.fromEntries(Object.entries(type.layout).map(([name, field]) => {
    const mask = (1n << BigInt(field.bits)) - 1n
    let value = (packed >> BigInt(field.bitOffset)) & mask
    if (field.storage.startsWith("i") && value & (1n << BigInt(field.bits - 1)))
      value -= 1n << BigInt(field.bits)
    return [name, field.storage === "i64" ? value : Number(value)]
  })) as JSStruct<F>
}

export const compile = async <T extends ModuleDef>(
  mod: T,
): Promise<CompileResult<T>> => {
  const analysis = analyzeModule(mod)
  const memory = new WebAssembly.Memory({
    initial: analysis.pages,
    maximum: analysis.pages,
    shared: true,
  })
  const compiled = await WebAssembly.compile(emitModule(analysis).buffer)
  const trap = (id: number): never => { throw new Error(analysis.trapMessages[id] ?? `Unknown WASM trap ${id}`) }
  const log = (id: number, value: number) => console.log(analysis.logMessages[id] ?? `WASM log ${id}`, value)
  const instance = await WebAssembly.instantiate(compiled, { env: { memory, trap, log } })
  const funcEntries = Object.entries(analysis.funcs) as [string, AnyFunc][]
  const jsFuncs: Record<string, unknown> = {}, resultStructs: Record<string, StructType<any>> = {}
  for (const [name, func] of funcEntries) {
    const wasmFunc = instance.exports[name] as (...args: unknown[]) => number | bigint
    jsFuncs[name] = wasmFunc
    if (typeof func.result === "object") {
      resultStructs[name] = func.result
      jsFuncs[name] = (...args: unknown[]) => decodeStruct(func.result as StructType<any>, wasmFunc(...args))
    }
  }
  const jsArrays = (Object.entries(analysis.arrays) as [string, AnyArray][]).map(([name, arr]) => {
    const layout = analysis.layouts.get(arr)!
    const key = typeof arr.type === "string" ? arr.type : `s${arr.type.storage}`
    const Ctor = arrayCtors[key as keyof typeof arrayCtors]
    return [name, new Ctor(memory.buffer, layout.offset, arr.length)] as const
  })
  return Object.assign(jsFuncs, Object.fromEntries(jsArrays), {
    mod: compiled, memory, resultStructs,
    trapMessages: analysis.trapMessages, logMessages: analysis.logMessages,
  }) as CompileResult<T>
}
