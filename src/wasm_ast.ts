
export type NumType = "i32" | "i64" | "f32" | "f64"
export type ResultType = NumType | "void" | StructType<any>
export type IntType = "i32" | "i64"
export type PackedType = "i8" | "u8" | "i16" | "u16"
export type StorageType = NumType | PackedType
export type LoadedType<T extends StorageType> = T extends PackedType ? "i32" : T
export type ArithmeticOp = "add" | "sub" | "mul" | "div"
export type BitOp = "xor" | "shl" | "shr" | "and" | "or"
export type RemainderOp = "mod" | "umod"
export type BinOp = ArithmeticOp | BitOp | RemainderOp
export type CmpOp = "eq" | "lt" | "gt"
const arithmeticOps = ["add", "sub", "mul", "div"] as const
const bitOps = ["and", "or", "xor", "shl", "shr"] as const
const remainderOps = ["mod", "umod"] as const
const cmpOps = ["eq", "lt", "gt"] as const
export type Value<T extends NumType> = T extends "i64" ? bigint : number
export type TypedArrayFor<T extends StorageType> =
  T extends "i8" ? Int8Array :
  T extends "u16" ? Uint16Array :
  T extends "i16" ? Int16Array :
  T extends "u8" ? Uint8Array :
  T extends "i32" ? Int32Array :
  T extends "i64" ? BigInt64Array :
  T extends "f32" ? Float32Array :
  T extends "f64" ? Float64Array : never

type ArgsExpr<Args extends readonly NumType[]> = { [K in keyof Args]: Args[K] extends NumType ? Expr<Args[K]>: never }
type ArgsLike<Args extends readonly NumType[]> = { [K in keyof Args]: Args[K] extends NumType ? ExprLike<Args[K]>: never }
export type ArgsVal<Args extends readonly NumType[]>  = { [K in keyof Args]: Args[K] extends NumType ? Value<Args[K]> : never }

type LocalNode<T extends NumType> = { kind: "local.get", type: T, local: number }
export type CoreExpr<T extends NumType> =
  | { kind: "const", type: T, value: Value<T> }
  | LocalNode<T>
  | { kind: "bin", type: T, op: BinOp, left: Expr<T>, right: Expr<T> }
  | { kind: "call", type: T, target: AnyFunc, args: Expr<NumType>[] }
  | { kind: "cast", type: T, inputType: NumType, unsigned: boolean, value: Expr<NumType> }
  | { kind: "if", type: T, cond: Expr<"i32">, then: Expr<T>, else: Expr<T> }
  | { kind: "load", type: T, array: AnyArray, index: Expr<"i32">, storage: StorageType, stride: number, offset: number }
  | (T extends "i32" ? { kind: "cmp", type: "i32", inputType: NumType, op: CmpOp, left: Expr<NumType>, right: Expr<NumType> } : never)

class ExprMethods<T extends NumType> {}
type ArithmeticMethods<T extends NumType> = { [Op in ArithmeticOp]: (right: ExprLike<T>) => Expr<T> }
type CompareMethods<T extends NumType> = { [Op in CmpOp]: (right: ExprLike<T>) => Expr<"i32"> }
type IntegerMethods<T extends IntType> = { [Op in BitOp | RemainderOp]: (right: ExprLike<T>) => Expr<T> }
export type Expr<T extends NumType> = CoreExpr<T> & ExprMethods<T> & ArithmeticMethods<T> & CompareMethods<T> & (T extends IntType ? IntegerMethods<T> : {})
export type AnyExpr = any


export type Stmt =
  | { kind: "local.set", local: number, type: NumType, value: Expr<NumType> }
  | { kind: "array.store", array: AnyArray, type: StorageType, index: Expr<"i32">, stride: number, offset: number, value: Expr<NumType> }
  | { kind: "array.move", array: AnyArray, target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32"> }
  | { kind: "if", cond: Expr<"i32">, then: Stmt[], else: Stmt[] }
  | { kind: "block", control: number, body: Stmt[] }
  | { kind: "loop", control: number, cond: Expr<"i32">, body: Stmt[] }
  | { kind: "break", target: number | null }
  | { kind: "continue", target: number | null }
  | { kind: "return", value?: Expr<NumType> }
  | { kind: "call.void", target: AnyFunc, args: Expr<NumType>[] }
  | { kind: "trap", message: string }
  | { kind: "log", message: string, value: Expr<"i32"> }
  | { kind: "expr", expr: Expr<NumType> }

export type BlockHandle = { kind: "block", id: number }
export type LoopHandle = { kind: "loop", id: number }
type ControlHandle = BlockHandle | LoopHandle

class MutableMethods<T extends NumType> extends ExprMethods<T> {
  declare type: T
  declare write: (value: Expr<T>) => Stmt
  set(value: ExprLike<T>) { return this.write(lit(this.type, value)) }
}
type MutableArithmetic<T extends NumType> = { [Op in ArithmeticOp as `i${Op}`]: (right: ExprLike<T>) => Stmt }
type MutableInteger<T extends IntType> = { [Op in "and" | "or" | "xor" as `i${Op}`]: (right: ExprLike<T>) => Stmt }
export type MutableValue<T extends NumType> = Expr<T> & { set(value: ExprLike<T>): Stmt } & MutableArithmetic<T> & (T extends IntType ? MutableInteger<T> : {})
export type LocalVar<T extends NumType> = MutableValue<T> & LocalNode<T>

export type ArrayHandle<T extends StorageType> = {
  kind: "array"
  type: T
  length: number
  elementSize: number
  at(index: ExprLike<"i32">): MutableValue<LoadedType<T>>
  move(target: ExprLike<"i32">, source: ExprLike<"i32">, count: ExprLike<"i32">): Stmt
}

export type BitStorageType = "i8" | "u8" | "i16" | "u16" | "i32"
export type BitField = readonly [BitStorageType, number]
export type StructStorageType = PackedType | IntType
export type FieldType = StructStorageType | BitField
export type StructFields = Record<string, FieldType>
export type FieldStorage<T extends FieldType> = T extends readonly [infer S extends BitStorageType, number] ? S : Extract<T, StorageType>
export type FieldValue<T extends FieldType> = LoadedType<FieldStorage<T>>
export type FieldLayout = { storage: StructStorageType, bitOffset: number, bits: number }
export type StructType<F extends StructFields> = {
  kind: "struct"
  fields: F
  layout: { [K in keyof F]: FieldLayout }
  size: number
  storage: "u8" | "u16" | IntType
}
type StructMembers<F extends StructFields> = {
  [K in keyof F]: Expr<FieldValue<F[K]>>
}
type MutableStructMembers<F extends StructFields> = {
  [K in keyof F]: MutableValue<FieldValue<F[K]>>
}
export type StructInit<F extends StructFields> = { [K in keyof F]: ExprLike<FieldValue<F[K]>> }
export type JSStruct<F extends StructFields> = { [K in keyof F]: Value<FieldValue<F[K]>> }
export type StructValue<F extends StructFields> = StructMembers<F> & { packed: AnyExpr }
export type MutableStruct<F extends StructFields> = StructValue<F> & MutableStructMembers<F> & {
  set(value: MutableStruct<F> | StructInit<F>): Stmt
}
export type StructArrayHandle<F extends StructFields> = {
  kind: "array"
  type: StructType<F>
  length: number
  elementSize: number
  at(index: ExprLike<"i32">): MutableStruct<F>
  move(target: ExprLike<"i32">, source: ExprLike<"i32">, count: ExprLike<"i32">): Stmt
}

export type ExprLike<T extends NumType> = Expr<T> | Value<T>
export type StmtBody = Stmt | StmtBody[]
type ControlBody<H extends ControlHandle> = StmtBody | ((self: H) => StmtBody)
export type FuncBody<R extends ResultType> =
  R extends NumType ? Expr<R> | StmtBody :
  R extends StructType<infer F> ? StructValue<F> | StmtBody :
  StmtBody
export type FuncHandle<A extends readonly NumType[], R extends ResultType> = {
  kind: "func"
  params: A
  result: R
  build: (...args: readonly Expr<NumType>[]) => FuncBody<R>
  call: (...args: ArgsLike<A>) =>
    R extends NumType ? Expr<R> :
    R extends StructType<infer F> ? StructValue<F> :
    Stmt
}

export type AnyFunc = {
  kind: "func"
  params: readonly NumType[]
  result: ResultType
  build: (...args: readonly AnyExpr[]) => any
  call: (...args: any[]) => AnyExpr
}

export type AnyArray = {
  kind: "array"
  type: StorageType | StructType<any>
  length: number
  elementSize: number
  at(...args: any[]): any
  move(...args: any[]): Stmt
}

export type ModuleDef = Record<string, AnyFunc | AnyArray>
export type FuncDefs<T extends ModuleDef> = { [K in keyof T as T[K] extends AnyFunc ? K : never]: Extract<T[K], AnyFunc> }
export type ArrayDefs<T extends ModuleDef> = { [K in keyof T as T[K] extends AnyArray ? K : never]: Extract<T[K], AnyArray> }
export type CompileResult<T extends ModuleDef> = {
  [K in keyof T]:
    T[K] extends AnyFunc ? (...args: ArgsVal<T[K]["params"]>) =>
      T[K]["result"] extends NumType ? Value<T[K]["result"]> :
      T[K]["result"] extends StructType<infer F> ? JSStruct<F> :
      void
    : T[K] extends ArrayHandle<infer S> ? TypedArrayFor<S>
    : T[K] extends StructArrayHandle<any> ? Uint8Array | Uint16Array | Uint32Array | BigUint64Array
    : never
} & {
  mod: WebAssembly.Module
  memory: WebAssembly.Memory
  trapMessages: string[]
  logMessages: string[]
  resultStructs: Record<string, StructType<any>>
}


let nextLocalId = 0
let nextControlId = 0

const inferType = <T extends NumType>(value: ExprLike<T>) =>
  (typeof value === "object" && value !== null && "type" in value ? value.type : "i32") as T

const expr = <T extends NumType>(node: CoreExpr<T>): Expr<T> => {
  return Object.setPrototypeOf(node, ExprMethods.prototype) as Expr<T>
}

export const lit = <T extends NumType>(type: T, value: ExprLike<T>): Expr<T> => {
  if (typeof value === "object" && value !== null) {
    if ("kind" in value) return value as Expr<T>
  }
  return expr({ kind: "const", type, value: value as Value<T> })
}
const mutable = <T extends NumType>(node: CoreExpr<T>, write: (value: Expr<T>) => Stmt) =>
  Object.assign(Object.setPrototypeOf(node, MutableMethods.prototype), { write }) as MutableValue<T>

const isStmt = (x: unknown): x is Stmt =>
  !!x && typeof x === "object" && "kind" in x && (
    (x as Stmt).kind === "if" ? Array.isArray((x as { then?: unknown }).then) :
    !["const", "local.get", "bin", "call", "cast", "load", "cmp"].includes((x as { kind: string }).kind)
  )

const stmtList = (body: StmtBody): Stmt[] => Array.isArray(body) ? body.flatMap(stmtList) : [body]
export const asStmts = <R extends ResultType>(body: FuncBody<R>) => isStmt(body) ? [body] : Array.isArray(body) ? stmtList(body) : null
const bindStmts = (body: StmtBody, br: number, loop: number | null): Stmt[] =>
  stmtList(body).map(s => bindStmt(s, br, loop))

const bindStmt = (s: Stmt, br: number, loop: number | null): Stmt => {
  switch (s.kind) {
    case "if": return { ...s, then: bindStmts(s.then, br, loop), else: bindStmts(s.else, br, loop) }
    case "break": return { ...s, target: s.target ?? br }
    case "continue":
      if (s.target != null) return s
      if (loop == null) throw new Error("continueTo() used outside a loop")
      return { ...s, target: loop }
    default: return s
  }
}

const controlBody = <H extends ControlHandle>(self: H, body: ControlBody<H>) =>
  bindStmts(typeof body === "function" ? body(self) : body, self.id, self.kind === "loop" ? self.id : null)

const bin = <T extends NumType>(op: ArithmeticOp, left: Expr<T>, right: ExprLike<T>): Expr<T> =>
  expr<T>({ kind: "bin", type: left.type, op, left, right: lit<T>(left.type as T, right) as unknown as Expr<T> } as CoreExpr<T>)

const bit = <T extends IntType>(op: BitOp, left: Expr<T>, right: ExprLike<T>): Expr<T> =>
  expr<T>({ kind: "bin", type: left.type, op, left, right: lit<T>(left.type as T, right) as unknown as Expr<T> } as CoreExpr<T>)

const remainder = <T extends IntType>(op: RemainderOp, left: Expr<T>, right: ExprLike<T>) =>
  expr<T>({ kind: "bin", type: left.type, op, left, right: lit<T>(left.type as T, right) as unknown as Expr<T> } as CoreExpr<T>)

const cmp = <T extends NumType>(op: CmpOp, left: Expr<T>, right: ExprLike<T>): Expr<"i32"> =>
  expr<"i32">({ kind: "cmp", type: "i32", inputType: left.type, op, left: left as unknown as Expr<NumType>, right: lit<T>(left.type as T, right) as unknown as Expr<NumType> } as CoreExpr<"i32">)

export const allocateLocal = <T extends NumType>(type: T) => expr({ kind: "local.get", type, local: nextLocalId++ })

const mkLocal = <T extends NumType>(type: T): LocalVar<T> => {
  const local = nextLocalId++
  return mutable({ kind: "local.get", type, local }, value => ({ kind: "local.set", local, type, value: value as Expr<NumType> })) as LocalVar<T>
}

const mkHandle = <A extends readonly NumType[], R extends ResultType>(
  params: A,
  result: R,
  build: (...args: readonly Expr<NumType>[]) => FuncBody<R>,
): FuncHandle<A, R> => {
  let handle!: FuncHandle<A, R>
  handle = {
    kind: "func",
    params, result, build,
    call: (...args: ArgsLike<A>) => {
      const callArgs = params.map((type, i) => lit(type, args[i] as ExprLike<typeof type>)) as Expr<NumType>[]
      if (result === "void") return { kind: "call.void", target: handle, args: callArgs }
      const type = (typeof result === "string" ? result : result.storage === "i64" ? "i64" : "i32") as NumType
      const call = expr({ kind: "call", type, target: handle, args: callArgs })
      return typeof result === "string" ? call : readStruct(result, call)
    },
  } as FuncHandle<A, R>
  return handle
}

const loadedType = <T extends StorageType>(type: T) =>
  (type === "i8" || type === "u8" || type === "i16" || type === "u16" ? "i32" : type) as LoadedType<T>

const storageSize: Record<StorageType, number> = { i8: 1, u8: 1, i16: 2, u16: 2, i32: 4, f32: 4, i64: 8, f64: 8 }
const memoryValue = <T extends StorageType>(array: AnyArray, index: ExprLike<"i32">, storage: T, stride: number, offset = 0) => {
  const at = lit("i32", index)
  return mutable({ kind: "load", type: loadedType(storage), array, index: at, storage, stride, offset }, value =>
    ({ kind: "array.store", array, type: storage, index: at, stride, offset, value: value as Expr<NumType> }))
}

type StructBacking = any
type InternalStruct<F extends StructFields> = MutableStruct<F> & { packed: StructBacking }

const readField = (backing: AnyExpr, field: FieldLayout) => {
  const { bits } = field
  if (field.storage === "i64") return backing
  if (backing.type === "i64") {
    const bitOffset = BigInt(field.bitOffset), mask = (1n << BigInt(bits)) - 1n
    const raw = i32(backing.shr(bitOffset).and(mask))
    return field.storage.startsWith("i") && bits < 32
      ? ifElse(raw.and(2 ** (bits - 1)), raw.sub(2 ** bits), raw)
      : raw
  }
  if (field.storage === "i32" && field.bitOffset === 0) return backing
  const mask = 2 ** bits - 1
  const raw = backing.shr(field.bitOffset).and(mask)
  return field.storage.startsWith("i") && bits < 32
    ? ifElse(raw.and(2 ** (bits - 1)), raw.sub(2 ** bits), raw)
    : raw
}

const packedFieldValue = (backing: StructBacking, field: FieldLayout) => {
  const value = readField(backing, field)
  if (field.storage === "i64") return backing
  if (backing.type === "i64") {
    const bitOffset = BigInt(field.bitOffset), mask = (1n << BigInt(field.bits)) - 1n
    const fieldMask = mask << bitOffset
    return mutable<"i32">(value as Expr<"i32">, input => backing.set(backing.and(~fieldMask).or(i64u(input).and(mask).shl(bitOffset))))
  }
  if (field.storage === "i32" && field.bitOffset === 0) return backing
  const mask = 2 ** field.bits - 1, fieldMask = mask << field.bitOffset
  return mutable<"i32">(value, input => backing.set(backing.and(~fieldMask).or(input.and(mask).shl(field.bitOffset))))
}

const readStruct = <F extends StructFields>(type: StructType<F>, packed: AnyExpr): StructValue<F> =>
  Object.assign(Object.fromEntries(Object.keys(type.fields).map(name => [name, readField(packed, type.layout[name]!)])), { packed }) as StructValue<F>

const structValue = <F extends StructFields>(type: StructType<F>, packed: StructBacking): MutableStruct<F> => {
  const fields = Object.fromEntries(Object.keys(type.fields).map(name => [name, packedFieldValue(packed, type.layout[name]!)]))
  return Object.assign(fields, { packed, set: (value: MutableStruct<F> | StructInit<F>) =>
    packed.set("packed" in value ? (value as InternalStruct<F>).packed : packStruct(type, value)) }) as InternalStruct<F>
}

const packStruct = <F extends StructFields>(type: StructType<F>, values: StructInit<F>): AnyExpr => {
  if (type.storage !== "i64") return Object.keys(type.fields).reduce((packed, name) => {
    const field = type.layout[name]!, value = values[name]!
    const mask = 2 ** field.bits - 1
    return packed.or(lit("i32", value as ExprLike<"i32">).and(mask).shl(field.bitOffset))
  }, i32(0))
  return Object.keys(type.fields).reduce((packed, name) => {
    const field = type.layout[name]!, value = values[name]!
    if (field.storage === "i64") return lit("i64", value as ExprLike<"i64">)
    const mask = (1n << BigInt(field.bits)) - 1n
    return packed.or(i64u(lit("i32", value as ExprLike<"i32">)).and(mask).shl(BigInt(field.bitOffset)))
  }, i64(0n))
}

export const struct = <const F extends StructFields>(fields: F): StructType<F> => {
  if ("set" in fields || "packed" in fields) throw new Error("Struct fields cannot be named set or packed")
  let used = 0
  const layout: Partial<Record<keyof F, FieldLayout>> = {}
  for (const name of Object.keys(fields) as (keyof F)[]) {
    const field = fields[name]!
    const storage = (Array.isArray(field) ? field[0] : field) as StructStorageType
    const bits = Array.isArray(field) ? field[1] : storageSize[storage] * 8
    if (!Number.isInteger(bits) || bits < 1 || bits > storageSize[storage] * 8) throw new Error(`Invalid ${storage} bit-field width ${bits}`)
    if (used + bits > 64) throw new Error(`Struct requires ${used + bits} bits; maximum is 64`)
    layout[name] = { storage, bitOffset: used, bits }
    used += bits
  }
  const storage = used <= 8 ? "u8" : used <= 16 ? "u16" : used <= 32 ? "i32" : "i64"
  return { kind: "struct", fields, layout: layout as { [K in keyof F]: FieldLayout }, storage, size: storageSize[storage] }
}

const cast = <T extends NumType>(type: T, value: Expr<NumType>, unsigned = false): Expr<T> =>
  value.type === type ? value as unknown as Expr<T> : expr<T>({ kind: "cast", type, inputType: value.type, unsigned, value } as CoreExpr<T>)
const number = <T extends NumType>(type: T, value: unknown): Expr<T> =>
  typeof value === (type === "i64" ? "bigint" : "number")
    ? expr({ kind: "const", type, value } as CoreExpr<T>)
    : cast(type, value as Expr<NumType>)

export function i32(value: number): Expr<"i32">
export function i32<T extends IntType>(value: Expr<T>): Expr<"i32">
export function i32(value: unknown) { return number("i32", value) }

export function i64(value: bigint): Expr<"i64">
export function i64<T extends IntType>(value: Expr<T>): Expr<"i64">
export function i64(value: unknown) { return number("i64", value) }
export const i64u = (value: Expr<"i32">) => cast("i64", value as unknown as Expr<NumType>, true)

type F32Input = number | Expr<"i32" | "i64" | "f32" | "f64">
export function f32(value: number): Expr<"f32">
export function f32<T extends NumType>(value: Expr<T>): Expr<"f32">
export function f32(value: F32Input) { return number("f32", value) }

export function f64(value: number): Expr<"f64">
export function f64<T extends NumType>(value: Expr<T>): Expr<"f64">
export function f64(value: F32Input) { return number("f64", value) }

export function ifElse<T extends NumType>(cond: Expr<"i32">, then: Expr<T>, else_: Expr<T>): Expr<T>
export function ifElse(cond: Expr<"i32">, then: StmtBody, else_?: StmtBody): Stmt
export function ifElse<T extends NumType>(cond: Expr<"i32">, then: Expr<T> | StmtBody, else_?: Expr<T> | StmtBody): Expr<T> | Stmt {
  return isStmt(then) || Array.isArray(then)
    ? { kind: "if", cond, then: stmtList(then as StmtBody), else: else_ === undefined ? [] : stmtList(else_ as StmtBody) }
    : expr<T>({ kind: "if", type: then.type, cond, then, else: else_ as Expr<T> } as CoreExpr<T>)
}

const arithmetic = Object.fromEntries(arithmeticOps.map(op => [op,
  <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin(op, left, right),
])) as { [Op in ArithmeticOp]: <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => Expr<T> }
const bits = Object.fromEntries(bitOps.map(op => [op,
  <T extends IntType>(left: Expr<T>, right: ExprLike<T>) => bit(op, left, right),
])) as { [Op in BitOp]: <T extends IntType>(left: Expr<T>, right: ExprLike<T>) => Expr<T> }
const remainders = Object.fromEntries(remainderOps.map(op => [op,
  <T extends IntType>(left: Expr<T>, right: ExprLike<T>) => remainder(op, left, right),
])) as { [Op in RemainderOp]: <T extends IntType>(left: Expr<T>, right: ExprLike<T>) => Expr<T> }
const comparisons = Object.fromEntries(cmpOps.map(op => [op,
  <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => cmp(op, left, right),
])) as { [Op in CmpOp]: <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => Expr<"i32"> }

for (const op of arithmeticOps) Object.defineProperty(ExprMethods.prototype, op, {
  value(this: Expr<NumType>, right: ExprLike<NumType>) { return arithmetic[op](this, right) },
})
for (const op of bitOps) Object.defineProperty(ExprMethods.prototype, op, {
  value(this: Expr<IntType>, right: ExprLike<IntType>) { return bits[op](this, right) },
})
for (const op of remainderOps) Object.defineProperty(ExprMethods.prototype, op, {
  value(this: Expr<IntType>, right: ExprLike<IntType>) { return remainders[op](this, right) },
})
for (const op of cmpOps) Object.defineProperty(ExprMethods.prototype, op, {
  value(this: Expr<NumType>, right: ExprLike<NumType>) { return comparisons[op](this, right) },
})
for (const op of [...arithmeticOps, "and", "or", "xor"] as const) Object.defineProperty(MutableMethods.prototype, `i${op}`, {
  value(this: MutableValue<any>, right: any) { return this.set((this as any)[op](right)) },
})

export const { add, sub, mul, div } = arithmetic
export const { and, or, xor, shl, shr } = bits
export const { mod, umod } = remainders
export const { eq, lt, gt } = comparisons

export const func = <const A extends readonly NumType[], R extends ResultType>(params: A, result: R, build: (...args: ArgsExpr<A>) => FuncBody<R>) =>
  mkHandle(params, result, build as (...args: readonly Expr<NumType>[]) => FuncBody<R>)
export function array<T extends StorageType>(type: T, length: number): ArrayHandle<T>
export function array<F extends StructFields>(type: StructType<F>, length: number): StructArrayHandle<F>
export function array(type: StorageType | StructType<any>, length: number) {
  if (!Number.isInteger(length) || length <= 0) throw new Error(`Invalid array length ${length}`)
  const storage = typeof type === "string" ? type : type.storage
  const elementSize = typeof type === "string" ? storageSize[type] : type.size
  let handle: AnyArray
  handle = {
    kind: "array", type, length, elementSize,
    at: index => {
      const value = memoryValue(handle, index, storage, elementSize)
      return typeof type === "string" ? value : structValue(type, value)
    },
    move: (target, source, count) => ({ kind: "array.move", array: handle, target: lit("i32", target), source: lit("i32", source), count: lit("i32", count) }),
  }
  return handle
}

const mkStructLocal = <F extends StructFields>(type: StructType<F>) =>
  structValue(type, mkLocal(type.storage === "i64" ? "i64" : "i32"))

type LocalFactory = {
  <T extends NumType>(type: T): LocalVar<T>
  <F extends StructFields>(type: StructType<F>): MutableStruct<F>
}

export const local = (<T extends NumType, F extends StructFields>(type: T | StructType<F>) =>
  typeof type === "string" ? mkLocal(type) : mkStructLocal(type)) as LocalFactory

export function ret(): Stmt
export function ret<T extends NumType>(value: ExprLike<T>): Stmt
export function ret(value: { packed: AnyExpr }): Stmt
export function ret<T extends NumType>(value?: ExprLike<T> | { packed: AnyExpr }): Stmt {
  if (value === undefined) return { kind: "return" }
  if (typeof value === "object" && "packed" in value) return { kind: "return", value: value.packed }
  return { kind: "return", value: lit(inferType(value), value) as Expr<NumType> }
}
export const trap = (message: string): Stmt => ({ kind: "trap", message })
export const boundsCheck = (array: AnyArray, index: ExprLike<"i32">, count: ExprLike<"i32"> = 1): Stmt => {
  const i = lit("i32", index), n = lit("i32", count)
  return ifElse(i.lt(0).or(n.lt(0)).or(n.gt(array.length)).or(i.gt(i32(array.length).sub(n))), trap("array bounds exceeded"))
}
export const log = (message: string, value: ExprLike<"i32">): Stmt => ({ kind: "log", message, value: lit("i32", value) })
export const block = (body: ControlBody<BlockHandle>): Stmt => {
  const self: BlockHandle = { kind: "block", id: nextControlId++ }
  return { kind: "block", control: self.id, body: controlBody(self, body) }
}
export const loop = (cond: Expr<"i32">, body: ControlBody<LoopHandle>): Stmt => {
  const self: LoopHandle = { kind: "loop", id: nextControlId++ }
  return { kind: "loop", control: self.id, cond, body: controlBody(self, body) }
}

export const breakTo = (target?: ControlHandle): Stmt => ({ kind: "break", target: target?.id ?? null })
export const continueTo = (target?: LoopHandle): Stmt => ({ kind: "continue", target: target?.id ?? null })
export const exprStmt = <T extends NumType>(value: Expr<T>): Stmt => ({ kind: "expr", expr: value as Expr<NumType> })
