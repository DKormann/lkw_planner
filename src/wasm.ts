const magic = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]
const numTypes = ["i32", "i64", "f32", "f64"] as const
const binOps = ["add", "sub", "mul", "div"] as const
const cmpOps = ["eq", "lt", "gt"] as const

export type NumType = "i32" | "i64" | "f32" | "f64"
export type BinOp = "add" | "sub" | "mul" | "div"
export type CmpOp = "eq" | "lt" | "gt"
type Value<T extends NumType> = T extends "i64" ? bigint : number
type TypedArrayFor<T extends NumType> =
  T extends "i32" ? Int32Array :
  T extends "i64" ? BigInt64Array :
  T extends "f32" ? Float32Array :
  Float64Array

export type FuncSig<Args extends readonly NumType[], Ret extends NumType> = { params: Args, result: Ret }
type ArgsExpr<Args extends readonly NumType[]> = { [K in keyof Args]: Args[K] extends NumType ? Expr<Args[K]> : never }
type ArgsVal<Args extends readonly NumType[]> = { [K in keyof Args]: Args[K] extends NumType ? Value<Args[K]> : never }

type CoreExpr<T extends NumType> =
  | { kind: "const", type: T, value: Value<T> }
  | { kind: "local.get", type: T, local: number }
  | { kind: "bin", type: T, op: BinOp, left: Expr<T>, right: Expr<T> }
  | { kind: "call", type: T, target: number, args: Expr<NumType>[] }
  | { kind: "if", type: T, cond: Expr<"i32">, then: Expr<T>, else: Expr<T> }
  | { kind: "load", type: T, array: number, index: Expr<"i32"> }
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

export type Stmt =
  | { kind: "local.set", local: number, type: NumType, value: Expr<NumType> }
  | { kind: "array.store", array: number, type: NumType, index: Expr<"i32">, value: Expr<NumType> }
  | { kind: "if", cond: Expr<"i32">, then: Stmt[], else: Stmt[] }
  | { kind: "block", control: number, body: Stmt[] }
  | { kind: "loop", control: number, cond: Expr<"i32">, body: Stmt[] }
  | { kind: "break", target: number | null }
  | { kind: "continue", target: number | null }
  | { kind: "return", value: Expr<NumType> }
  | { kind: "expr", expr: Expr<NumType> }

export type BlockHandle = { kind: "block", id: number }
export type LoopHandle = { kind: "loop", id: number }
type ControlHandle = BlockHandle | LoopHandle

export type LocalVar<T extends NumType> = {
  id: number
  type: T
  get(): Expr<T>
  set(value: ExprLike<T>): Stmt
  add(right: ExprLike<T>): Expr<T>
  sub(right: ExprLike<T>): Expr<T>
  mul(right: ExprLike<T>): Expr<T>
  div(right: ExprLike<T>): Expr<T>
  eq(right: ExprLike<T>): Expr<"i32">
  lt(right: ExprLike<T>): Expr<"i32">
  gt(right: ExprLike<T>): Expr<"i32">
  iadd(right: ExprLike<T>): Stmt
  isub(right: ExprLike<T>): Stmt
  imul(right: ExprLike<T>): Stmt
  idiv(right: ExprLike<T>): Stmt
}

export type ArrayHandle<T extends NumType> = {
  kind: "array"
  id: number
  type: T
  length: number
  load(index: ExprLike<"i32">): Expr<T>
  store(index: ExprLike<"i32">, value: ExprLike<T>): Stmt
}

type ExprLike<T extends NumType> = Expr<T> | Value<T> | LocalVar<T>
type StmtBody = Stmt | Stmt[]
type ControlBody<H extends ControlHandle> = StmtBody | ((self: H) => StmtBody)
type FuncBody<R extends NumType> = Expr<R> | Stmt | Stmt[]

export type FuncHandle<A extends readonly NumType[], R extends NumType> = FuncSig<A, R> & {
  kind: "func"
  id: number
  build?: (...args: readonly Expr<NumType>[]) => FuncBody<R>
  call: (...args: ArgsExpr<A>) => Expr<R>
}

type AnyFunc = {
  kind: "func"
  id: number
  params: readonly NumType[]
  result: NumType
  build?: (...args: readonly Expr<NumType>[]) => FuncBody<NumType>
  call: (...args: any[]) => Expr<NumType>
}

type AnyArray = {
  kind: "array"
  id: number
  type: NumType
  length: number
  load(index: ExprLike<"i32">): Expr<NumType>
  store(index: ExprLike<"i32">, value: ExprLike<NumType>): Stmt
}

export type ModuleDef = Record<string, AnyFunc | AnyArray>
type FuncDefs<T extends ModuleDef> = { [K in keyof T as T[K] extends AnyFunc ? K : never]: Extract<T[K], AnyFunc> }
type ArrayDefs<T extends ModuleDef> = { [K in keyof T as T[K] extends AnyArray ? K : never]: Extract<T[K], AnyArray> }
export type CompileResult<T extends ModuleDef> = {
  [K in keyof T]:
    T[K] extends AnyFunc ? (...args: ArgsVal<T[K]["params"]>) => Value<T[K]["result"]>
    : T[K] extends AnyArray ? TypedArrayFor<T[K]["type"]>
    : never
} & {
  mod: WebAssembly.Module
  memory: WebAssembly.Memory
}

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
  load: { i32: 0x28, i64: 0x29, f32: 0x2a, f64: 0x2b } as Record<NumType, number>,
  store: { i32: 0x36, i64: 0x37, f32: 0x38, f64: 0x39 } as Record<NumType, number>,
  bytes: { i32: 4, i64: 8, f32: 4, f64: 8 } as Record<NumType, number>,
  align: { i32: 2, i64: 3, f32: 2, f64: 3 } as Record<NumType, number>,
}

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
const flatMap = <T, R>(xs: T[], fn: (x: T) => R[]) => xs.flatMap(fn)
const die = (x: unknown): never => { throw new Error(`Unexpected value: ${String(x)}`) }

let nextFuncId = 0
let nextLocalId = 0
let nextArrayId = 0
let nextControlId = 0
const arrayRegistry = new Map<number, AnyArray>()

const inferType = <T extends NumType>(value: ExprLike<T>) =>
  (typeof value === "object" && value !== null && "type" in value ? value.type : "i32") as T

const addExprOps = <T extends NumType>(e: Expr<T>) => {
  for (const op of binOps) e[op] = r => bin(op, e, r) as Expr<T>
  for (const op of cmpOps) e[op] = r => cmp(op, e, r) as Expr<"i32">
  return e
}

const expr = <T extends NumType>(node: CoreExpr<T>): Expr<T> => {
  return addExprOps(node as Expr<T>)
}

const lit = <T extends NumType>(type: T, value: ExprLike<T>): Expr<T> => {
  if (typeof value === "object" && value !== null) {
    if ("kind" in value) return value as Expr<T>
    if ("get" in value) return value.get()
  }
  return expr({ kind: "const", type, value: value as Value<T> })
}

const isStmt = (x: unknown): x is Stmt =>
  !!x && typeof x === "object" && "kind" in x && (
    (x as Stmt).kind === "local.set" ||
    (x as Stmt).kind === "array.store" ||
    (x as Stmt).kind === "block" ||
    (x as Stmt).kind === "loop" ||
    (x as Stmt).kind === "break" ||
    (x as Stmt).kind === "continue" ||
    (x as Stmt).kind === "return" ||
    (x as Stmt).kind === "expr" ||
    ((x as Stmt).kind === "if" && Array.isArray((x as { then?: unknown }).then))
  )

const stmtList = (body: StmtBody) => Array.isArray(body) ? body : [body]
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

const bin = <T extends NumType>(op: BinOp, left: Expr<T>, right: ExprLike<T>) =>
  expr({ kind: "bin", type: left.type, op, left, right: lit(left.type, right) })

const cmp = <T extends NumType>(op: CmpOp, left: Expr<T>, right: ExprLike<T>) =>
  expr({ kind: "cmp", type: "i32", inputType: left.type, op, left, right: lit(left.type, right) })

const localExpr = <T extends NumType>(type: T, local: number) => expr({ kind: "local.get", type, local })

const mkLocal = <T extends NumType>(type: T): LocalVar<T> => {
  const id = nextLocalId++
  const get = () => localExpr(type, id)
  const set = (value: ExprLike<T>): Stmt => ({ kind: "local.set", local: id, type, value: lit(type, value) as Expr<NumType> })
  const out: LocalVar<T> = {
    id, type, get, set,
    add: right => get().add(right), sub: right => get().sub(right), mul: right => get().mul(right), div: right => get().div(right),
    eq: right => get().eq(right), lt: right => get().lt(right), gt: right => get().gt(right),
    iadd: right => set(get().add(right)), isub: right => set(get().sub(right)), imul: right => set(get().mul(right)), idiv: right => set(get().div(right)),
  }
  return out
}

const mkHandle = <A extends readonly NumType[], R extends NumType>(
  params: A,
  result: R,
  build?: (...args: readonly Expr<NumType>[]) => FuncBody<R>,
): FuncHandle<A, R> => {
  const id = nextFuncId++
  return {
    kind: "func",
    id, params, result, build,
    call: (...args: ArgsExpr<A>) => expr({ kind: "call", type: result, target: id, args: args as Expr<NumType>[] }) as Expr<R>,
  }
}

const mkArray = <T extends NumType>(type: T, length: number): ArrayHandle<T> => {
  if (!Number.isInteger(length) || length <= 0) throw new Error(`Invalid array length ${length}`)
  const id = nextArrayId++
  const handle: ArrayHandle<T> = {
    kind: "array",
    id, type, length,
    load: index => expr({ kind: "load", type, array: id, index: lit("i32", index) }),
    store: (index, value) => ({ kind: "array.store", array: id, type, index: lit("i32", index), value: lit(type, value) as Expr<NumType> }),
  }
  arrayRegistry.set(id, handle as unknown as AnyArray)
  return handle
}

export const i32 = (n: number) => expr({ kind: "const", type: "i32", value: n })
export const i64 = (n: bigint) => expr({ kind: "const", type: "i64", value: n })
export const f32 = (n: number) => expr({ kind: "const", type: "f32", value: n })
export const f64 = (n: number) => expr({ kind: "const", type: "f64", value: n })

export const ifElse = <T extends NumType>(cond: Expr<"i32">, then: Expr<T>, else_: Expr<T>) =>
  expr({ kind: "if", type: then.type, cond, then, else: else_ })

export const add = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin("add", left, right)
export const sub = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin("sub", left, right)
export const mul = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin("mul", left, right)
export const div = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => bin("div", left, right)
export const eq = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => cmp("eq", left, right)
export const lt = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => cmp("lt", left, right)
export const gt = <T extends NumType>(left: Expr<T>, right: ExprLike<T>) => cmp("gt", left, right)

export const declare = <const A extends readonly NumType[], R extends NumType>(params: A, result: R) => mkHandle(params, result)
export const func = <const A extends readonly NumType[], R extends NumType>(params: A, result: R, build: (...args: ArgsExpr<A>) => FuncBody<R>) =>
  mkHandle(params, result, build as (...args: readonly Expr<NumType>[]) => FuncBody<R>)
export const array = <T extends NumType>(type: T, length: number) => mkArray(type, length)

export const local = Object.fromEntries(numTypes.map(type => [type, () => mkLocal(type)])) as { [T in NumType]: () => LocalVar<T> }

export const ret = <T extends NumType>(value: ExprLike<T>): Stmt => ({
  kind: "return",
  value: lit(inferType(value), value) as Expr<NumType>,
})
export const ifStmt = (cond: Expr<"i32">, then: Stmt[], else_: Stmt[] = []): Stmt => ({ kind: "if", cond, then, else: else_ })
export const block = (body: ControlBody<BlockHandle>): Stmt => {
  const self: BlockHandle = { kind: "block", id: nextControlId++ }
  return { kind: "block", control: self.id, body: controlBody(self, body) }
}
export const loop = (cond: Expr<"i32">, body: ControlBody<LoopHandle>): Stmt => {
  const self: LoopHandle = { kind: "loop", id: nextControlId++ }
  return { kind: "loop", control: self.id, cond, body: controlBody(self, body) }
}
export const whileLoop = loop
export const breakTo = (target?: ControlHandle): Stmt => ({ kind: "break", target: target?.id ?? null })
export const continueTo = (target?: LoopHandle): Stmt => ({ kind: "continue", target: target?.id ?? null })
export const exprStmt = <T extends NumType>(value: Expr<T>): Stmt => ({ kind: "expr", expr: value as Expr<NumType> })

type ArrayLayout = { type: NumType, length: number, offset: number }
type ModuleAnalysis<T extends ModuleDef> = {
  funcs: FuncDefs<T>
  arrays: ArrayDefs<T>
  fEntries: [keyof FuncDefs<T> & string, FuncDefs<T>[keyof FuncDefs<T>]][]
  builtFuncs: BuiltFunc[]
  fix: Record<number, number>
  layouts: Record<number, ArrayLayout>
  pages: number
}

type CompileOptions = {
  shared?: boolean
}

const walkExpr = (e: Expr<NumType>, fns: {
  local?: (id: number, type: NumType) => void
  array?: (id: number) => void
}) => {
  switch (e.kind) {
    case "const": return
    case "local.get": fns.local?.(e.local, e.type); return
    case "bin":
    case "cmp":
      walkExpr(e.left, fns); walkExpr(e.right, fns); return
    case "call":
      e.args.forEach(arg => walkExpr(arg, fns)); return
    case "if":
      walkExpr(e.cond, fns); walkExpr(e.then, fns); walkExpr(e.else, fns); return
    case "load":
      fns.array?.(e.array); walkExpr(e.index, fns); return
    default: die(e)
  }
}

const walkStmt = (s: Stmt, fns: {
  local?: (id: number, type: NumType) => void
  array?: (id: number) => void
}) => {
  switch (s.kind) {
    case "local.set": fns.local?.(s.local, s.type); walkExpr(s.value, fns); return
    case "array.store": fns.array?.(s.array); walkExpr(s.index, fns); walkExpr(s.value, fns); return
    case "if": walkExpr(s.cond, fns); s.then.forEach(x => walkStmt(x, fns)); s.else.forEach(x => walkStmt(x, fns)); return
    case "block": s.body.forEach(x => walkStmt(x, fns)); return
    case "loop": walkExpr(s.cond, fns); s.body.forEach(x => walkStmt(x, fns)); return
    case "break":
    case "continue":
      return
    case "return": walkExpr(s.value, fns); return
    case "expr": walkExpr(s.expr, fns); return
    default: die(s)
  }
}

const addr = (layout: ArrayLayout, index: Expr<"i32">) => index.mul(codes.bytes[layout.type]).add(layout.offset)
const memarg = (type: NumType, offset = 0) => [...u32(codes.align[type]), ...u32(offset)]
const constI32 = (e: Expr<"i32">) => e.kind === "const" ? e.value : null
const checkArrayBounds = (layout: ArrayLayout, index: Expr<"i32">) => {
  const n = constI32(index)
  if (n == null) return
  if (!Number.isInteger(n) || n < 0 || n >= layout.length) throw new Error(`Array index ${n} out of bounds for length ${layout.length}`)
}

const compileExpr = (e: Expr<NumType>, fix: Record<number, number>, lix: Record<number, number>, arrays: Record<number, ArrayLayout>): number[] => {
  switch (e.kind) {
    case "const":
      if (e.type === "i32") return [0x41, ...sN(e.value as number, 32)]
      if (e.type === "i64") return [0x42, ...sN(e.value, 64)]
      if (e.type === "f32") return [0x43, ...fN(e.value as number, 4)]
      if (e.type === "f64") return [0x44, ...fN(e.value as number, 8)]
      return die(e)
    case "local.get":
      return [0x20, ...u32(lix[e.local]!)]
    case "bin":
      return [...compileExpr(e.left, fix, lix, arrays), ...compileExpr(e.right, fix, lix, arrays), codes.bin[e.op][e.type]]
    case "cmp":
      return [...compileExpr(e.left, fix, lix, arrays), ...compileExpr(e.right, fix, lix, arrays), codes.cmp[e.op][e.inputType]]
    case "call":
      if (fix[e.target] == null) throw new Error(`Unknown function ${e.target}`)
      return [...flatMap(e.args, arg => compileExpr(arg, fix, lix, arrays)), 0x10, ...u32(fix[e.target]!)]
    case "if":
      return [...compileExpr(e.cond, fix, lix, arrays), 0x04, codes.type[e.type], ...compileExpr(e.then, fix, lix, arrays), 0x05, ...compileExpr(e.else, fix, lix, arrays), 0x0b]
    case "load": {
      const layout = arrays[e.array]
      if (!layout) throw new Error(`Unknown array ${e.array}`)
      checkArrayBounds(layout, e.index)
      return [...compileExpr(addr(layout, e.index), fix, lix, arrays), codes.load[e.type], ...memarg(e.type)]
    }
    default:
      return die(e)
  }
}

type LabelFrame = { control?: number, kind?: "break" | "continue" }
const depth = (stack: LabelFrame[], control: number, kind: NonNullable<LabelFrame["kind"]>) => {
  const i = stack.findIndex(x => x.control === control && x.kind === kind)
  if (i < 0) throw new Error(`Unknown ${kind} target ${control}`)
  return i
}

const compileStmt = (
  s: Stmt,
  fix: Record<number, number>,
  lix: Record<number, number>,
  arrays: Record<number, ArrayLayout>,
  stack: LabelFrame[] = [],
): number[] => {
  switch (s.kind) {
    case "local.set":
      return [...compileExpr(s.value, fix, lix, arrays), 0x21, ...u32(lix[s.local]!)]
    case "array.store": {
      const layout = arrays[s.array]
      if (!layout) throw new Error(`Unknown array ${s.array}`)
      checkArrayBounds(layout, s.index)
      return [...compileExpr(addr(layout, s.index), fix, lix, arrays), ...compileExpr(s.value, fix, lix, arrays), codes.store[s.type], ...memarg(s.type)]
    }
    case "if":
      return [...compileExpr(s.cond, fix, lix, arrays), 0x04, 0x40, ...flatMap(s.then, x => compileStmt(x, fix, lix, arrays, [{}, ...stack])), ...(s.else.length ? [0x05, ...flatMap(s.else, x => compileStmt(x, fix, lix, arrays, [{}, ...stack]))] : []), 0x0b]
    case "block":
      return [0x02, 0x40, ...flatMap(s.body, x => compileStmt(x, fix, lix, arrays, [{ control: s.control, kind: "break" }, ...stack])), 0x0b]
    case "loop":
      return [0x02, 0x40, 0x03, 0x40, ...compileExpr(s.cond, fix, lix, arrays), 0x45, 0x0d, ...u32(1), ...flatMap(s.body, x => compileStmt(x, fix, lix, arrays, [{ control: s.control, kind: "continue" }, { control: s.control, kind: "break" }, ...stack])), 0x0c, ...u32(0), 0x0b, 0x0b]
    case "break":
      if (s.target == null) throw new Error("breakTo() used outside a block or loop")
      return [0x0c, ...u32(depth(stack, s.target, "break"))]
    case "continue":
      if (s.target == null) throw new Error("continueTo() used outside a loop")
      return [0x0c, ...u32(depth(stack, s.target, "continue"))]
    case "return":
      return [...compileExpr(s.value, fix, lix, arrays), 0x0f]
    case "expr":
      return [...compileExpr(s.expr, fix, lix, arrays), 0x1a]
    default:
      return die(s)
  }
}

const arrayLayouts = (defs: Record<string, AnyArray>) => {
  let offset = 0
  const entries = Object.entries(defs) as [string, AnyArray][]
  const out: Record<number, ArrayLayout> = {}
  for (const [, arr] of entries) {
    out[arr.id] = { type: arr.type, length: arr.length, offset }
    offset += arr.length * codes.bytes[arr.type]
  }
  return { layouts: out, bytes: offset, entries }
}

const moduleFuncs = <T extends ModuleDef>(mod: T) =>
  Object.fromEntries(Object.entries(mod).filter(([, v]) => v.kind === "func")) as FuncDefs<T>

const moduleArrays = <T extends ModuleDef>(mod: T) =>
  Object.fromEntries(Object.entries(mod).filter(([, v]) => v.kind === "array")) as ArrayDefs<T>

type BuiltFunc = {
  func: AnyFunc
  paramIds: number[]
  built: FuncBody<NumType>
}

const buildFunc = (func: AnyFunc): BuiltFunc => {
  const params = func.params.map(type => localExpr(type, nextLocalId++)) as Expr<NumType>[]
  return {
    func,
    paramIds: params.map(p => p.kind === "local.get" ? p.local : -1),
    built: func.build?.(...params) ?? die(`Function ${func.id} has no implementation`),
  }
}

const discoveredArrays = (builtFuncs: BuiltFunc[]) => {
  const used = new Set<number>()
  for (const { built } of builtFuncs) {
    const body = Array.isArray(built) ? built : isStmt(built) ? [built] : null
    body ? body.forEach(s => walkStmt(s, { array: id => used.add(id) })) : walkExpr(built as Expr<NumType>, { array: id => used.add(id) })
  }
  return Object.fromEntries([...used].map(id => {
    const arr = arrayRegistry.get(id)
    if (!arr) throw new Error(`Unknown array ${id}`)
    return [String(id), arr]
  })) as Record<string, AnyArray>
}

const analyzeModule = <T extends ModuleDef>(mod: T) => {
  const funcs = moduleFuncs(mod)
  const arrays = moduleArrays(mod)
  const fEntries = Object.entries(funcs) as [keyof FuncDefs<T> & string, FuncDefs<T>[keyof FuncDefs<T>]][]
  const builtFuncs = fEntries.map(([, func]) => buildFunc(func))
  const fix = Object.fromEntries(fEntries.map(([, def], i) => [def.id, i])) as Record<number, number>
  const touchedArrays = discoveredArrays(builtFuncs)
  const allArrays = { ...touchedArrays, ...arrays } as Record<string, AnyArray>
  const { layouts, bytes } = arrayLayouts(allArrays)
  return { funcs, arrays, fEntries, builtFuncs, fix, layouts, pages: Math.max(1, Math.ceil(bytes / 65536)) } as ModuleAnalysis<T>
}

const emitModule = <T extends ModuleDef>({ fEntries, builtFuncs, fix, layouts, pages }: ModuleAnalysis<T>, { shared = false }: CompileOptions = {}) => {
  const functionSection = fEntries.flatMap((_, i) => u32(i))
  const exportSection = fEntries.flatMap(([name], i) => [...str(name), 0x00, ...u32(i)])
  return new Uint8Array([
    ...magic,
    ...section(0x01, [...u32(fEntries.length), ...flatMap(fEntries, ([, f]) => [0x60, ...u32(f.params.length), ...f.params.map(t => codes.type[t]), 0x01, codes.type[f.result]])]),
    ...section(0x02, [
      0x01,
      ...str("env"),
      ...str("memory"),
      0x02,
      shared ? 0x03 : 0x01,
      ...u32(pages),
      ...u32(pages),
    ]),
    ...section(0x03, [...u32(fEntries.length), ...functionSection]),
    ...section(0x07, [...u32(fEntries.length), ...exportSection]),
    ...section(0x0a, [
      ...u32(fEntries.length),
      ...flatMap(builtFuncs, ({ func, paramIds, built }) => {
        const locals = new Map<number, NumType>()
        const stmts = Array.isArray(built) ? built : isStmt(built) ? [built] : null
        stmts ? stmts.forEach(s => walkStmt(s, { local: (id, type) => locals.set(id, type) })) : walkExpr(built as Expr<NumType>, { local: (id, type) => locals.set(id, type) })
        paramIds.forEach(id => locals.delete(id))
        const localEntries = [...locals.entries()]
        const lix = Object.fromEntries([...paramIds.map((id, i) => [id, i]), ...localEntries.map(([id], i) => [id, func.params.length + i])]) as Record<number, number>
        const decls = [...u32(localEntries.length), ...flatMap(localEntries, ([, type]) => [...u32(1), codes.type[type]])]
        const code = stmts ? flatMap(stmts, s => compileStmt(s, fix, lix, layouts)) : compileExpr(built as Expr<NumType>, fix, lix, layouts)
        const body = [...decls, ...code, 0x0b]
        return [...u32(body.length), ...body]
      }),
    ]),
  ])
}

export const compileModule = <T extends ModuleDef>(mod: T, opts?: CompileOptions) => emitModule(analyzeModule(mod), opts)

const typedArrayCtor = <T extends NumType>(type: T): { new(buffer: ArrayBufferLike, byteOffset: number, length: number): TypedArrayFor<T> } => {
  switch (type) {
    case "i32": return Int32Array as any
    case "i64": return BigInt64Array as any
    case "f32": return Float32Array as any
    case "f64": return Float64Array as any
    default: return die(type)
  }
}

export const compile = async <T extends ModuleDef>(mod: T, opts: CompileOptions = {}): Promise<CompileResult<T>> => {
  const analysis = analyzeModule(mod)
  const { funcs, arrays, layouts } = analysis
  const memory = new WebAssembly.Memory({ initial: analysis.pages, maximum: analysis.pages, shared: !!opts.shared })
  let compiled = await WebAssembly.compile(emitModule(analysis, opts).buffer)
  const wasm = await WebAssembly.instantiate(compiled, { env: { memory } })
  const exports = wasm.exports as WebAssembly.Exports
  const jsFuncs = Object.fromEntries(Object.keys(funcs).map(name => [name, exports[name]]))
  const jsArrays = (Object.entries(arrays) as [string, AnyArray][]).map(([name, arr]) => {
    const layout = layouts[arr.id]!
    const Ctor = typedArrayCtor(arr.type)
    return [name, new Ctor(memory.buffer, layout.offset, arr.length)] as const
  })
  return Object.fromEntries([
    ...Object.entries(jsFuncs),
    ...jsArrays,
    ["mod", compiled],
    ["memory", memory],
  ]) as CompileResult<T>
}
