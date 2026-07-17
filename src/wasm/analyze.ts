import {
  allocateLocal, asStmts,
  type AnyArray, type AnyFunc, type ArrayDefs, type Expr,
  type FuncBody, type FuncDefs, type ModuleDef, type NumType, type ResultType,
} from "./ast"

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
  logMessages: string[]
  pages: number
}

type Visitors = {
  local?: (id: number, type: NumType) => void
  array?: (array: AnyArray) => void
  func?: (func: AnyFunc) => void
  trap?: (message: string) => void
  log?: (message: string) => void
}
const walk = (node: any, fns: Visitors): void => {
  if (node == null) return
  if (Array.isArray(node)) return node.forEach(x => walk(x, fns))
  const children = (...values: any[]) => values.forEach(x => walk(x, fns))
  switch (node.kind) {
    case "const": case "break": case "continue": return
    case "local.get": fns.local?.(node.local, node.type); return
    case "local.set": fns.local?.(node.local, node.type); return walk(node.value, fns)
    case "bin": case "cmp": return children(node.left, node.right)
    case "call": case "call.void": fns.func?.(node.target); return walk(node.args, fns)
    case "cast": case "return": return walk(node.value, fns)
    case "if": return children(node.cond, node.then, node.else)
    case "load": fns.array?.(node.array); return walk(node.index, fns)
    case "array.store": fns.array?.(node.array); return children(node.index, node.value)
    case "array.move": fns.array?.(node.array); return children(node.target, node.source, node.count)
    case "block": return walk(node.body, fns)
    case "loop": return children(node.cond, node.body)
    case "trap": fns.trap?.(node.message); return
    case "log": fns.log?.(node.message); return walk(node.value, fns)
    case "expr": return walk(node.expr, fns)
    default: die(node)
  }
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

export type BuiltFunc = {
  func: AnyFunc
  built: FuncBody<ResultType>
  locals: [number, NumType][]
  localIndexes: Record<number, number>
  functions: AnyFunc[]
  arrays: AnyArray[]
  traps: string[]
  logs: string[]
}

const buildFunc = (func: AnyFunc): BuiltFunc => {
  const params = func.params.map(type => allocateLocal(type)) as Expr<NumType>[]
  const paramIds = params.map(p => p.kind === "local.get" ? p.local : -1)
  const result = func.build(...params)
  const built = typeof func.result === "object" && !asStmts(result) ? result.packed : result
  const found = new Map<number, NumType>()
  const functions = new Set<AnyFunc>(), arrays = new Set<AnyArray>(), traps = new Set<string>(), logs = new Set<string>()
  walk(built, {
    local: (id, type) => found.set(id, type), func: f => functions.add(f), array: a => arrays.add(a),
    trap: message => traps.add(message), log: message => logs.add(message),
  })
  paramIds.forEach(id => found.delete(id))
  const locals = [...found.entries()]
  const localIndexes = Object.fromEntries([
    ...paramIds.map((id, i) => [id, i]),
    ...locals.map(([id], i) => [id, func.params.length + i]),
  ])
  return { func, built, locals, localIndexes, functions: [...functions], arrays: [...arrays], traps: [...traps], logs: [...logs] }
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
  const entries = Object.entries(mod)
  const funcs = Object.fromEntries(entries.filter(([, v]) => v.kind === "func")) as FuncDefs<T>
  const arrays = Object.fromEntries(entries.filter(([, v]) => v.kind === "array")) as ArrayDefs<T>
  const fEntries = Object.entries(funcs) as [keyof FuncDefs<T> & string, FuncDefs<T>[keyof FuncDefs<T>]][]
  const builtFuncs = buildReferencedFunctions(fEntries.map(([, func]) => func))
  const fix = new Map(builtFuncs.map(({ func }, i) => [func, i]))
  const allArrays = [...new Set([...builtFuncs.flatMap(func => func.arrays), ...Object.values(arrays) as AnyArray[]])]
  const { layouts, bytes } = arrayLayouts(allArrays)
  const trapMessages = [...new Set(builtFuncs.flatMap(func => func.traps))]
  const logMessages = [...new Set(builtFuncs.flatMap(func => func.logs))]
  return { funcs, arrays, fEntries, builtFuncs, fix, layouts, trapMessages, logMessages, pages: Math.max(1, Math.ceil(bytes / 65536)) } as ModuleAnalysis<T>
}
