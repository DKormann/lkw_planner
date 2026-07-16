export * from "./wasm_ast"

import { analyzeModule } from "./wasm_analyze"
import { emitModule, type CompileOptions } from "./wasm_codegen"
import type {
  AnyArray, CompileResult, ModuleDef, StorageType, TypedArrayFor,
} from "./wasm_ast"

export type { CompileOptions } from "./wasm_codegen"

const typedArrayCtor = <T extends StorageType>(type: T): {
  new(buffer: ArrayBufferLike, byteOffset: number, length: number): TypedArrayFor<T>
} => ({
  i8: Int8Array, u8: Uint8Array, i16: Int16Array, u16: Uint16Array,
  i32: Int32Array, i64: BigInt64Array, f32: Float32Array, f64: Float64Array,
} as any)[type]

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
  const instance = await WebAssembly.instantiate(compiled, { env: { memory, trap } })
  const jsFuncs = Object.fromEntries(
    Object.keys(analysis.funcs).map(name => [name, instance.exports[name]]),
  )
  const jsArrays = (Object.entries(analysis.arrays) as [string, AnyArray][]).map(([name, arr]) => {
    const layout = analysis.layouts.get(arr)!
    if (typeof arr.type !== "string")
      return [name, new Uint8Array(memory.buffer, layout.offset, arr.length * arr.elementSize)] as const
    const Ctor = typedArrayCtor(arr.type)
    return [name, new Ctor(memory.buffer, layout.offset, arr.length)] as const
  })
  return Object.fromEntries([
    ...Object.entries(jsFuncs),
    ...jsArrays,
    ["mod", compiled],
    ["memory", memory],
    ["trapMessages", analysis.trapMessages],
  ]) as CompileResult<T>
}
