export * from "./wasm_ast"
export { formatModule } from "./wasm_format"

import { analyzeModule } from "./wasm_analyze"
import { emitModule, type CompileOptions } from "./wasm_codegen"
import type {
  AnyArray, AnyFunc, CompileResult, JSStruct, ModuleDef, StorageType, StructFields, StructType, TypedArrayFor,
} from "./wasm_ast"

export type { CompileOptions } from "./wasm_codegen"

const typedArrayCtor = <T extends StorageType>(type: T): {
  new(buffer: ArrayBufferLike, byteOffset: number, length: number): TypedArrayFor<T>
} => ({
  i8: Int8Array, u8: Uint8Array, i16: Int16Array, u16: Uint16Array,
  i32: Int32Array, i64: BigInt64Array, f32: Float32Array, f64: Float64Array,
} as any)[type]

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
  options: CompileOptions = {},
): Promise<CompileResult<T>> => {
  const analysis = analyzeModule(mod)
  const memory = new WebAssembly.Memory({
    initial: analysis.pages,
    maximum: analysis.pages,
    shared: true,
  })
  const compiled = await WebAssembly.compile(emitModule(analysis, options).buffer)
  const trap = (id: number): never => { throw new Error(analysis.trapMessages[id] ?? `Unknown WASM trap ${id}`) }
  const log = (id: number, value: number) => console.log(analysis.logMessages[id] ?? `WASM log ${id}`, value)
  const instance = await WebAssembly.instantiate(compiled, { env: { memory, trap, log } })
  const funcEntries = Object.entries(analysis.funcs) as [string, AnyFunc][]
  const resultStructs = Object.fromEntries(
    funcEntries.flatMap(([name, func]) =>
      typeof func.result === "object" ? [[name, func.result]] : []),
  )
  const jsFuncs = Object.fromEntries(funcEntries.map(([name, func]) => {
    const wasmFunc = instance.exports[name] as (...args: unknown[]) => number | bigint
    if (typeof func.result !== "object") return [name, wasmFunc]
    const result = func.result
    return [name, (...args: unknown[]) => decodeStruct(result, wasmFunc(...args))]
  }))
  const jsArrays = (Object.entries(analysis.arrays) as [string, AnyArray][]).map(([name, arr]) => {
    const layout = analysis.layouts.get(arr)!
    if (typeof arr.type !== "string") {
      const Ctor = {
        u8: Uint8Array, u16: Uint16Array, i32: Uint32Array, i64: BigUint64Array,
      }[arr.type.storage]
      return [name, new Ctor(memory.buffer, layout.offset, arr.length)] as const
    }
    const Ctor = typedArrayCtor(arr.type)
    return [name, new Ctor(memory.buffer, layout.offset, arr.length)] as const
  })
  return Object.fromEntries([
    ...Object.entries(jsFuncs),
    ...jsArrays,
    ["mod", compiled],
    ["memory", memory],
    ["trapMessages", analysis.trapMessages],
    ["logMessages", analysis.logMessages],
    ["resultStructs", resultStructs],
  ]) as CompileResult<T>
}
