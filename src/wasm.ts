const magic = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]




export type NumType = "i32" | "i64" | "f32" | "f64"
export type BinOp = "add" | "sub" | "mul" | "div"
export type CmpOp = "eq" | "lt" | "gt"
type Value<T extends NumType> = T extends "i64" ? bigint : number

export type FuncSig<Args extends readonly NumType[], Ret extends NumType> = { params: Args, result: Ret }
type ArgsExpr<Args extends readonly NumType[]> = { [K in keyof Args]: Args[K] extends NumType ? Expr<Args[K]> : never }
type ArgsVal<Args extends readonly NumType[]> = { [K in keyof Args]: Args[K] extends NumType ? Value<Args[K]> : never }
type ExprLike<T extends NumType> = Expr<T> | Value<T>

type CoreExpr<T extends NumType> =
  | { kind: "const", type: T, value: Value<T> }
  | { kind: "local.get", type: T, index: number }
  | { kind: "bin", type: T, op: BinOp, left: Expr<T>, right: Expr<T> }
  | { kind: "call", type: T, target: number, args: Expr<NumType>[] }
  | { kind: "if", type: T, cond: Expr<"i32">, then: Expr<T>, else: Expr<T> }
  | (T extends "i32" ? { kind: "cmp", type: "i32", inputType: NumType, op: CmpOp, left: Expr<NumType>, right: Expr<NumType> } : never)

export type Expr<T extends NumType> = CoreExpr<T> & {
  add(right: ExprLike<T>): Expr<T>
  sub(right: ExprLike<T>): Expr<T>
  mul(right: ExprLike<T>): Expr<T>
  div(right: ExprLike<T>): Expr<T>
  eq(right: ExprLike<T>): Expr<"i32">
  lt(right: ExprLike<T>): Expr<"i32">
  gt(right: ExprLike<T>): Expr<"i32">
}

type FuncImpl<S extends FuncSig<readonly NumType[], NumType>> = { params: S["params"], result: S["result"], body: Expr<S["result"]> }
export type FuncHandle<A extends readonly NumType[], R extends NumType> = FuncSig<A, R> & {
  id: number
  build?: (...args: readonly Expr<NumType>[]) => Expr<R>
  call: (...args: ArgsExpr<A>) => Expr<R>
}
type AnyFunc = {
  id: number
  params: readonly NumType[]
  result: NumType
  build?: (...args: readonly Expr<NumType>[]) => Expr<NumType>
  call: (...args: any[]) => Expr<NumType>
}
type ModuleDefs = Record<string, AnyFunc>
type SigOf<F extends AnyFunc> = FuncSig<F["params"], F["result"]>
type ModuleSigs<T extends ModuleDefs> = { [K in keyof T]: SigOf<T[K]> }
type ModuleImpl<T extends ModuleDefs> = { [K in keyof T]: FuncImpl<SigOf<T[K]>> }
export type ExportBundle<T extends ModuleDefs> = { [K in keyof T]-?: (...args: ArgsVal<T[K]["params"]>) => Value<T[K]["result"]> }

const codes = {
  type: { i32: 0x7f, i64: 0x7e, f32: 0x7d, f64: 0x7c } as Record<NumType, number>,
  bin: {
    add: { i32: 0x6a, i64: 0x7c, f32: 0x92, f64: 0xa0 },
    sub: { i32: 0x6b, i64: 0x7d, f32: 0x93, f64: 0xa1 },
    mul: { i32: 0x6c, i64: 0x7e, f32: 0x94, f64: 0xa2 },
    div: { i32: 0x6d, i64: 0x7f, f32: 0x95, f64: 0xa3 },
  } as Record<BinOp, Record<NumType, number>>,
  cmp: {
    eq: { i32: 0x46, i64: 0x51, f32: 0x5b, f64: 0x61 },
    lt: { i32: 0x48, i64: 0x53, f32: 0x5d, f64: 0x63 },
    gt: { i32: 0x4a, i64: 0x55, f32: 0x5e, f64: 0x64 },
  } as Record<CmpOp, Record<NumType, number>>,
}

const bins = ["add", "sub", "mul", "div"] as const satisfies readonly BinOp[]
const cmps = ["eq", "lt", "gt"] as const satisfies readonly CmpOp[]

const u32 = (n: number) => {
  if (!Number.isInteger(n) || n < 0) throw new Error(`Expected unsigned integer, got ${n}`)
  const out: number[] = []
  do {
    let byte = n & 0x7f
    n >>>= 7
    if (n) byte |= 0x80
    out.push(byte)
  } while (n)
  return out
}

const sN = (value: number | bigint, bits: 32 | 64) => {
  const out: number[] = []
  let n = bits === 32 ? BigInt((value as number) | 0) : BigInt.asIntN(64, value as bigint)
  for (;;) {
    let byte = Number(n & 0x7fn)
    n >>= 7n
    const done = (n === 0n && (byte & 0x40) === 0) || (n === -1n && (byte & 0x40) !== 0)
    if (!done) byte |= 0x80
    out.push(byte)
    if (done) return out
  }
}

const fN = (value: number, bytes: 4 | 8) => {
  const out = new Uint8Array(bytes)
  const view = new DataView(out.buffer)
  bytes === 4 ? view.setFloat32(0, value, true) : view.setFloat64(0, value, true)
  return [...out]
}

const str = (s: string) => {
  const bytes = new TextEncoder().encode(s)
  return [...u32(bytes.length), ...bytes]
}

const section = (id: number, payload: number[]) => [id, ...u32(payload.length), ...payload]
const die = (x: unknown): never => { throw new Error(`Unexpected value: ${String(x)}`) }

const expr = <T extends NumType>(node: CoreExpr<T>): Expr<T> => {
  const e = node as Expr<T>
  e.add = r => bin("add", e, r) as Expr<T>
  e.sub = r => bin("sub", e, r) as Expr<T>
  e.mul = r => bin("mul", e, r) as Expr<T>
  e.div = r => bin("div", e, r) as Expr<T>
  e.eq = r => cmp("eq", e, r) as Expr<"i32">
  e.lt = r => cmp("lt", e, r) as Expr<"i32">
  e.gt = r => cmp("gt", e, r) as Expr<"i32">
  return e
}

const lit = <T extends NumType>(type: T, value: ExprLike<T>): Expr<T> =>
  typeof value === "object" && value !== null && "kind" in value
    ? value as Expr<T>
    : expr({ kind: "const", type, value: value as Value<T> })

const bin = <T extends NumType>(op: BinOp, left: Expr<T>, right: ExprLike<T>) =>
  expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) })

const cmp = <T extends NumType>(op: CmpOp, left: Expr<T>, right: ExprLike<T>) =>
  expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) })

export const ifElse = <T extends NumType>(cond: Expr<"i32">, then: Expr<T>, else_: Expr<T>) =>
  expr({ kind: "if", type: then.type, cond, then, else: else_ })

export const add = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin("add", left, right)
export const sub = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin("sub", left, right)
export const mul = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin("mul", left, right)
export const div = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin("div", left, right)
export const eq = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => cmp("eq", left, right)
export const lt = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => cmp("lt", left, right)
export const gt = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => cmp("gt", left, right)

export const i32 = (n: number) => expr({ kind: "const", type: "i32", value: n })
export const i64 = (n: bigint) => expr({ kind: "const", type: "i64", value: n })
export const f32 = (n: number) => expr({ kind: "const", type: "f32", value: n })
export const f64 = (n: number) => expr({ kind: "const", type: "f64", value: n })

let nextFuncId = 0
const mkHandle = <A extends readonly NumType[], R extends NumType>(
  params: A,
  result: R,
  build?: (...args: readonly Expr<NumType>[]) => Expr<R>,
): FuncHandle<A, R> => {
  const id = nextFuncId++
  return {
    id,
    params,
    result,
    build,
    call: (...args: ArgsExpr<A>) => expr({ kind: "call", type: result, target: id, args: args as Expr<NumType>[] }) as Expr<R>,
  }
}

export const declare = <A extends readonly NumType[], R extends NumType>(params: A, result: R) =>
  mkHandle(params, result)

export const func = <const A extends readonly NumType[], R extends NumType>(
  params: A,
  result: R,
  build: (...args: ArgsExpr<A>) => Expr<R>,
) => mkHandle(params, result, build as (...args: readonly Expr<NumType>[]) => Expr<R>)


const compileExpr = (e: Expr<NumType>, ix: Record<number, number>): number[] => {
  switch (e.kind) {
    case "const":
      if (e.type === "i32") return [0x41, ...sN(e.value as number, 32)]
      if (e.type === "i64") return [0x42, ...sN(e.value, 64)]
      if (e.type === "f32") return [0x43, ...fN(e.value as number, 4)]
      if (e.type === "f64") return [0x44, ...fN(e.value as number, 8)]
      return die(e)
    case "local.get": return [0x20, ...u32(e.index)]
    case "bin": return [...compileExpr(e.left, ix), ...compileExpr(e.right, ix), codes.bin[e.op][e.type]]
    case "cmp": return [...compileExpr(e.left, ix), ...compileExpr(e.right, ix), codes.cmp[e.op][e.inputType]]
    case "call":
      if (ix[e.target] == null) throw new Error(`Unknown function ${e.target}`)
      return [...e.args.flatMap(arg => compileExpr(arg, ix)), 0x10, ...u32(ix[e.target]!)]
    case "if": return [...compileExpr(e.cond, ix), 0x04, codes.type[e.type], ...compileExpr(e.then, ix), 0x05, ...compileExpr(e.else, ix), 0x0b]
    default: return die(e)
  }
}

export const compileModule = <T extends ModuleDefs>(defs: T) => {
  const entries = Object.entries(defs) as [keyof T & string, T[keyof T]][]
  const ix = Object.fromEntries(entries.map(([, def], i) => [def.id, i])) as Record<number, number>
  return new Uint8Array([
    ...magic,
    ...section(0x01, [...u32(entries.length), ...entries.flatMap(([, f]) => [0x60, ...u32(f.params.length), ...f.params.map(t => codes.type[t]), 0x01, codes.type[f.result]])]),
    ...section(0x03, [...u32(entries.length), ...entries.flatMap((_, i) => u32(i))]),
    ...section(0x07, [...u32(entries.length), ...entries.flatMap(([name], i) => [...str(name), 0x00, ...u32(i)])]),
    ...section(0x0a, [...u32(entries.length), ...entries.flatMap(([, f]) => {
      if (!f.build) throw new Error(`Function ${f.id} has no implementation`)
      const locals = f.params.map((type, index) => expr({ kind: "local.get", type, index })) as Expr<NumType>[]
      const body = [0x00, ...compileExpr(f.build(...locals), ix), 0x0b]
      return [...u32(body.length), ...body]
    })]),
  ])
}

export const compile = async <T extends ModuleDefs>(defs: T) =>
  (await WebAssembly.instantiate(await WebAssembly.compile(Uint8Array.from(compileModule(defs)).buffer))).exports as ExportBundle<T>

