import {
  allocateLocal, asStmts,
  type AnyArray, type AnyExpr, type AnyFunc, type ArrayDefs, type Expr,
  type FuncBody, type FuncDefs, type ModuleDef, type NumType, type ResultType, type Stmt,
  type StorageType,
} from "./wasm_ast"

const die = (x: unknown): never => { throw new Error(`Unexpected value: ${String(x)}`) }
export type ArrayLayout = { length: number, offset: number, elementSize: number }
export type ModuleAnalysis<T extends ModuleDef> = {
  funcs: FuncDefs<T>
  arrays: ArrayDefs<T>
  fEntries: [keyof FuncDefs<T> & string, FuncDefs<T>[keyof FuncDefs<T>]][]
  builtFuncs: BuiltFunc[]
  fix: Map<AnyFunc, number>
  layouts: Map<AnyArray, ArrayLayout>
  trapMessages: string[]
  pages: number
}

type Visitors = {
  local?: (id: number, type: NumType) => void
  array?: (array: AnyArray) => void
  func?: (func: AnyFunc) => void
  trap?: (message: string) => void
}
const walkExpr = (e: AnyExpr, fns: Visitors) => {
  switch (e.kind) {
    case "const": return
    case "local.get": fns.local?.(e.local, e.type); return
    case "bin":
    case "cmp":
      walkExpr(e.left, fns); walkExpr(e.right, fns); return
    case "call":
      fns.func?.(e.target)
      e.args.forEach((arg: AnyExpr) => walkExpr(arg, fns)); return
    case "cast":
      walkExpr(e.value, fns); return
    case "if":
      walkExpr(e.cond, fns); walkExpr(e.then, fns); walkExpr(e.else, fns); return
    case "load":
      fns.array?.(e.array); walkExpr(e.index, fns); return
    default: die(e)
  }
}

const walkStmt = (s: Stmt, fns: Visitors) => {
  switch (s.kind) {
    case "local.set": fns.local?.(s.local, s.type); walkExpr(s.value, fns); return
    case "array.store": fns.array?.(s.array); walkExpr(s.index, fns); walkExpr(s.value, fns); return
    case "array.move": fns.array?.(s.array); walkExpr(s.target, fns); walkExpr(s.source, fns); walkExpr(s.count, fns); return
    case "if": walkExpr(s.cond, fns); s.then.forEach(x => walkStmt(x, fns)); s.else.forEach(x => walkStmt(x, fns)); return
    case "block": s.body.forEach(x => walkStmt(x, fns)); return
    case "loop": walkExpr(s.cond, fns); s.body.forEach(x => walkStmt(x, fns)); return
    case "break":
    case "continue":
      return
    case "trap": fns.trap?.(s.message); return
    case "return": if (s.value) walkExpr(s.value, fns); return
    case "call.void": fns.func?.(s.target); s.args.forEach(arg => walkExpr(arg, fns)); return
    case "expr": walkExpr(s.expr, fns); return
    default: die(s)
  }
}
const walkBody = (body: FuncBody<ResultType>, visitors: Visitors) => {
  const stmts = asStmts(body)
  stmts ? stmts.forEach(s => walkStmt(s, visitors)) : walkExpr(body, visitors)
}


const arrayLayouts = (arrays: AnyArray[]) => {
  let offset = 0
  const layouts = new Map<AnyArray, ArrayLayout>()
  for (const arr of arrays) {
    const align = Math.min(arr.elementSize, 8)
    offset = Math.ceil(offset / align) * align
    layouts.set(arr, { length: arr.length, offset, elementSize: arr.elementSize })
    offset += arr.length * arr.elementSize
  }
  return { layouts, bytes: offset }
}

const moduleFuncs = <T extends ModuleDef>(mod: T) =>
  Object.fromEntries(Object.entries(mod).filter(([, v]) => v.kind === "func")) as FuncDefs<T>

const moduleArrays = <T extends ModuleDef>(mod: T) =>
  Object.fromEntries(Object.entries(mod).filter(([, v]) => v.kind === "array")) as ArrayDefs<T>

export type BuiltFunc = {
  func: AnyFunc
  built: FuncBody<ResultType>
  locals: [number, NumType][]
  localIndexes: Record<number, number>
  functions: AnyFunc[]
  arrays: AnyArray[]
  traps: string[]
}

const buildFunc = (func: AnyFunc): BuiltFunc => {
  const params = func.params.map(type => allocateLocal(type)) as Expr<NumType>[]
  const paramIds = params.map(p => p.kind === "local.get" ? p.local : -1)
  const built = func.build(...params)
  const found = new Map<number, NumType>()
  const functions = new Set<AnyFunc>(), arrays = new Set<AnyArray>(), traps = new Set<string>()
  walkBody(built, { local: (id, type) => found.set(id, type), func: f => functions.add(f), array: a => arrays.add(a), trap: message => traps.add(message) })
  paramIds.forEach(id => found.delete(id))
  const locals = [...found.entries()]
  const localIndexes = Object.fromEntries([
    ...paramIds.map((id, i) => [id, i]),
    ...locals.map(([id], i) => [id, func.params.length + i]),
  ])
  return { func, built, locals, localIndexes, functions: [...functions], arrays: [...arrays], traps: [...traps] }
}

const buildReferencedFunctions = (roots: AnyFunc[]) => {
  const built = new Map<AnyFunc, BuiltFunc>()
  const visit = (func: AnyFunc) => {
    if (built.has(func)) return
    const entry = buildFunc(func)
    built.set(func, entry)
    entry.functions.forEach(visit)
  }
  roots.forEach(visit)
  return [...built.values()]
}

export const analyzeModule = <T extends ModuleDef>(mod: T) => {
  const funcs = moduleFuncs(mod)
  const arrays = moduleArrays(mod)
  const fEntries = Object.entries(funcs) as [keyof FuncDefs<T> & string, FuncDefs<T>[keyof FuncDefs<T>]][]
  const builtFuncs = buildReferencedFunctions(fEntries.map(([, func]) => func))
  const fix = new Map(builtFuncs.map(({ func }, i) => [func, i]))
  const allArrays = [...new Set([...builtFuncs.flatMap(func => func.arrays), ...Object.values(arrays) as AnyArray[]])]
  const { layouts, bytes } = arrayLayouts(allArrays)
  const trapMessages = [...new Set(builtFuncs.flatMap(func => func.traps))]
  return { funcs, arrays, fEntries, builtFuncs, fix, layouts, trapMessages, pages: Math.max(1, Math.ceil(bytes / 65536)) } as ModuleAnalysis<T>
}
