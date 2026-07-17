import {
  type AnyArray, type AnyExpr, type AnyFunc, type ArithmeticOp, type BitOp, type CmpOp, type Expr,
  type ModuleDef, type NumType, type RemainderOp, type Stmt, type StorageType, asStmts,
} from "./wasm_ast"
import { type ArrayLayout, type ModuleAnalysis } from "./wasm_analyze"

const magic = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]
const resultType = (result: AnyFunc["result"]) =>
  typeof result === "object" ? result.storage === "i64" ? "i64" : "i32" : result

const numberBase = { i32: 0x6a, i64: 0x7c, f32: 0x92, f64: 0xa0 } as Record<NumType, number>
const opcode = (op: ArithmeticOp | BitOp | RemainderOp | CmpOp, type: NumType) => {
  const arithmetic = ["add", "sub", "mul", "div"].indexOf(op)
  if (arithmetic >= 0) return numberBase[type] + arithmetic
  const integer = ["mod", "umod", "and", "or", "xor", "shl", "", "shr"].indexOf(op)
  if (integer >= 0) return numberBase[type] + 5 + integer
  return ({ i32: 0x46, i64: 0x51, f32: 0x5b, f64: 0x61 } as Record<NumType, number>)[type]
    + (op === "eq" ? 0 : op === "lt" ? 2 : type[0] === "i" ? 4 : 3)
}

const codes = {
  type: { i32: 0x7f, i64: 0x7e, f32: 0x7d, f64: 0x7c } as Record<NumType, number>,
  load: { i32: 0x28, i64: 0x29, f32: 0x2a, f64: 0x2b, i8: 0x2c, u8: 0x2d, i16: 0x2e, u16: 0x2f } as Record<StorageType, number>,
  store: { i32: 0x36, i64: 0x37, f32: 0x38, f64: 0x39, i8: 0x3a, u8: 0x3a, i16: 0x3b, u16: 0x3b } as Record<StorageType, number>,
  align: { i8: 0, u8: 0, i16: 1, u16: 1, i32: 2, f32: 2, i64: 3, f64: 3 } as Record<StorageType, number>,
  zero: { i32: [0x41, 0], i64: [0x42, 0], f32: [0x43, 0, 0, 0, 0], f64: [0x44, 0, 0, 0, 0, 0, 0, 0, 0] } as Record<NumType, number[]>,
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


const addr = (layout: ArrayLayout, index: Expr<"i32">, stride = layout.elementSize, fieldOffset = 0) =>
  index.mul(stride).add(layout.offset + fieldOffset)
const memarg = (type: StorageType, offset = 0) => [...u32(codes.align[type]), ...u32(offset)]
const constI32 = (e: Expr<"i32">) => e.kind === "const" ? e.value : null
const checkArrayBounds = (layout: ArrayLayout, index: Expr<"i32">) => {
  const n = constI32(index)
  if (n == null) return
  if (!Number.isInteger(n) || n < 0 || n >= layout.length) throw new Error(`Array index ${n} out of bounds for length ${layout.length}`)
}
const checkMoveBounds = (layout: ArrayLayout, target: Expr<"i32">, source: Expr<"i32">, count: Expr<"i32">) => {
  const values = [constI32(target), constI32(source), constI32(count)]
  if (values.some(value => value == null)) return
  const [to, from, size] = values as number[]
  if (to! < 0 || from! < 0 || size! < 0 || to! + size! > layout.length || from! + size! > layout.length)
    throw new Error(`Array move (${to}, ${from}, ${size}) out of bounds for length ${layout.length}`)
}

const makeCompiler = (
  fix: Map<AnyFunc, number>, lix: Record<number, number>, arrays: Map<AnyArray, ArrayLayout>,
  traps: Map<string, number>, logs: Map<string, number>,
) => {
const compileExpr = (e: AnyExpr): number[] => {
  switch (e.kind) {
    case "const":
      if (e.type === "i32") return [0x41, ...sN(e.value as number, 32)]
      if (e.type === "i64") return [0x42, ...sN(e.value, 64)]
      if (e.type === "f32") return [0x43, ...fN(e.value as number, 4)]
      if (e.type === "f64") return [0x44, ...fN(e.value as number, 8)]
      return die(e)
    case "local.get":
      return [0x20, ...u32(lix[e.local]!)]
    case "bin": {
      return [...compileExpr(e.left), ...compileExpr(e.right), opcode(e.op, e.type)]
    }
    case "cmp":
      return [...compileExpr(e.left), ...compileExpr(e.right), opcode(e.op, e.inputType)]
    case "call":
      return [...flatMap(e.args, compileExpr), 0x10, ...u32(fix.get(e.target)! + 2)]
    case "cast": {
      const from = e.inputType as NumType
      const to = e.type as NumType
      let opcode: number | undefined
      if (to === "i32" && from === "i64") opcode = 0xa7
      if (to === "i64" && from === "i32") opcode = e.unsigned ? 0xad : 0xac
      if (to === "f32" && from === "i32") opcode = 0xb2
      if (to === "f32" && from === "i64") opcode = 0xb4
      if (to === "f32" && from === "f64") opcode = 0xb6
      if (to === "f64" && from === "i32") opcode = 0xb7
      if (to === "f64" && from === "i64") opcode = 0xb9
      if (to === "f64" && from === "f32") opcode = 0xbb
      if (opcode == null) throw new Error(`Unsupported cast ${from} -> ${to}`)
      return [...compileExpr(e.value), opcode]
    }
    case "if":
      return [...compileExpr(e.cond), 0x04, codes.type[e.type as NumType], ...compileExpr(e.then), 0x05, ...compileExpr(e.else), 0x0b]
    case "load": {
      const layout = arrays.get(e.array)
      if (!layout) throw new Error(`Unknown array ${e.array}`)
      checkArrayBounds(layout, e.index)
      return [...compileExpr(addr(layout, e.index, e.stride, e.offset)), codes.load[e.storage as StorageType], ...memarg(e.storage as StorageType)]
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

const compileStmt = (s: Stmt, stack: LabelFrame[] = []): number[] => {
  switch (s.kind) {
    case "local.set":
      return [...compileExpr(s.value), 0x21, ...u32(lix[s.local]!)]
    case "array.store": {
      const layout = arrays.get(s.array)
      if (!layout) throw new Error(`Unknown array ${s.array}`)
      checkArrayBounds(layout, s.index)
      return [...compileExpr(addr(layout, s.index, s.stride, s.offset)), ...compileExpr(s.value), codes.store[s.type], ...memarg(s.type)]
    }
    case "array.move": {
      const layout = arrays.get(s.array)
      if (!layout) throw new Error(`Unknown array ${s.array}`)
      checkMoveBounds(layout, s.target, s.source, s.count)
      return [
        ...compileExpr(addr(layout, s.target)),
        ...compileExpr(addr(layout, s.source)),
        ...compileExpr(s.count.mul(layout.elementSize)),
        0xfc, 0x0a, 0x00, 0x00,
      ]
    }
    case "if":
      return [...compileExpr(s.cond), 0x04, 0x40, ...flatMap(s.then, x => compileStmt(x, [{}, ...stack])), ...(s.else.length ? [0x05, ...flatMap(s.else, x => compileStmt(x, [{}, ...stack]))] : []), 0x0b]
    case "block":
      return [0x02, 0x40, ...flatMap(s.body, x => compileStmt(x, [{ control: s.control, kind: "break" }, ...stack])), 0x0b]
    case "loop":
      return [0x02, 0x40, 0x03, 0x40, ...compileExpr(s.cond), 0x45, 0x0d, ...u32(1), ...flatMap(s.body, x => compileStmt(x, [{ control: s.control, kind: "continue" }, { control: s.control, kind: "break" }, ...stack])), 0x0c, ...u32(0), 0x0b, 0x0b]
    case "break":
      if (s.target == null) throw new Error("breakTo() used outside a block or loop")
      return [0x0c, ...u32(depth(stack, s.target, "break"))]
    case "continue":
      if (s.target == null) throw new Error("continueTo() used outside a loop")
      return [0x0c, ...u32(depth(stack, s.target, "continue"))]
    case "return":
      return [...(s.value ? compileExpr(s.value) : []), 0x0f]
    case "trap":
      return [0x41, ...sN(traps.get(s.message)!, 32), 0x10, 0x00]
    case "log":
      return [0x41, ...sN(logs.get(s.message)!, 32), ...compileExpr(s.value), 0x10, 0x01]
    case "call.void":
      return [...flatMap(s.args, compileExpr), 0x10, ...u32(fix.get(s.target)! + 2)]
    case "expr":
      return [...compileExpr(s.expr), 0x1a]
    default:
      return die(s)
  }
}
return { expr: compileExpr, stmt: compileStmt }
}


export const emitModule = <T extends ModuleDef>({ fEntries, builtFuncs, fix, layouts, trapMessages, logMessages, pages }: ModuleAnalysis<T>) => {
  const traps = new Map(trapMessages.map((message, id) => [message, id]))
  const logs = new Map(logMessages.map((message, id) => [message, id]))
  const functionSection = builtFuncs.flatMap((_, i) => u32(i + 2))
  const exportSection = fEntries.flatMap(([name, func]) => [...str(name), 0x00, ...u32(fix.get(func)! + 2)])
  return new Uint8Array([
    ...magic,
    ...section(0x01, [...u32(builtFuncs.length + 2),
      0x60, 0x01, codes.type.i32, 0x00,
      0x60, 0x02, codes.type.i32, codes.type.i32, 0x00,
      ...flatMap(builtFuncs, ({ func }) => {
        const result = resultType(func.result)
        return [0x60, ...u32(func.params.length), ...func.params.map(t => codes.type[t]), ...(result === "void" ? [0x00] : [0x01, codes.type[result]])]
      })]),
    ...section(0x02, [
      0x03,
      ...str("env"),
      ...str("trap"),
      0x00,
      0x00,
      ...str("env"),
      ...str("log"),
      0x00,
      0x01,
      ...str("env"),
      ...str("memory"),
      0x02,
      0x03,
      ...u32(pages),
      ...u32(pages),
    ]),
    ...section(0x03, [...u32(builtFuncs.length), ...functionSection]),
    ...section(0x07, [...u32(fEntries.length), ...exportSection]),
    ...section(0x0a, [
      ...u32(builtFuncs.length),
      ...flatMap(builtFuncs, ({ func, built, locals, localIndexes }) => {
        const compiler = makeCompiler(fix, localIndexes, layouts, traps, logs)
        const stmts = asStmts(built)
        const decls = [...u32(locals.length), ...flatMap(locals, ([, type]) => [...u32(1), codes.type[type]])]
        const result = resultType(func.result)
        const code = stmts
          ? [...flatMap(stmts, s => compiler.stmt(s)), ...(result === "void" ? [] : codes.zero[result])]
          : compiler.expr(built as AnyExpr)
        const body = [...decls, ...code, 0x0b]
        return [...u32(body.length), ...body]
      }),
    ]),
  ])
}
