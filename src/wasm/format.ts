import { analyzeModule, type BuiltFunc } from "./analyze"
import { asStmts, type AnyArray, type AnyExpr, type AnyFunc, type ModuleDef, type Stmt } from "./ast"

const binary: Record<string, string> = {
  add: "+", sub: "-", mul: "*", div: "/", mod: "%", umod: "%u",
  and: "&", or: "|", xor: "^", shl: "<<", shr: ">>>",
  eq: "==", lt: "<", gt: ">",
}

export const formatModule = <T extends ModuleDef>(module: T) => {
  const analysis = analyzeModule(module)
  const funcNames = new Map<AnyFunc, string>()
  analysis.fEntries.forEach(([name, func]) => funcNames.set(func, name))
  analysis.builtFuncs.forEach(({ func }, i) => {
    if (!funcNames.has(func)) funcNames.set(func, `fn${i}`)
  })

  const arrayNames = new Map<AnyArray, string>()
  Object.entries(analysis.arrays).forEach(([name, array]) => arrayNames.set(array as AnyArray, name))
  ;[...analysis.layouts.keys()].forEach((array, i) => {
    if (!arrayNames.has(array)) arrayNames.set(array, `array${i}`)
  })

  const arrays = [...analysis.layouts].map(([array, layout]) =>
    `${typeof array.type === "string" ? array.type : `struct${array.type.size * 8}`} ${arrayNames.get(array)}[${array.length}]; // memory +${layout.offset}`,
  )
  const functions = analysis.builtFuncs.map(func => formatFunction(func, funcNames, arrayNames))
  return [...arrays, "", ...functions].join("\n")
}

const formatFunction = (
  built: BuiltFunc,
  functions: Map<AnyFunc, string>,
  arrays: Map<AnyArray, string>,
) => {
  const { func } = built
  const locals = new Map<number, string>()
  const params = Object.entries(built.localIndexes).map(([id, index]) => [Number(id), index] as const)
    .filter(([, index]) => index < func.params.length)
    .sort((a, b) => a[1] - b[1])
  params.forEach(([id], i) => locals.set(id, `p${i}`))
  built.locals.forEach(([id], i) => locals.set(id, `v${i}`))

  const expr = (value: AnyExpr): string => {
    switch (value.kind) {
      case "const": return typeof value.value === "bigint" ? `${value.value}n` : String(value.value)
      case "local.get": return locals.get(value.local)!
      case "global.get": return "global"
      case "bin": return `(${expr(value.left)} ${binary[value.op]} ${expr(value.right)})`
      case "cmp": return `(${expr(value.left)} ${binary[value.op]} ${expr(value.right)})`
      case "call": return `${functions.get(value.target)}(${value.args.map(expr).join(", ")})`
      case "cast": return `${value.unsigned ? `${value.type}u` : value.type}(${expr(value.value)})`
      case "if": return `(${expr(value.cond)} ? ${expr(value.then)} : ${expr(value.else)})`
      case "load": return `load_${value.storage}(${arrays.get(value.array)}, ${address(value, expr)})`
      default: throw new Error(`Cannot format expression ${String(value.kind)}`)
    }
  }

  const lines = (body: Stmt[], indent = "  "): string[] => body.flatMap(statement => {
    const nested = (items: Stmt[]) => lines(items, indent + "  ")
    switch (statement.kind) {
      case "local.set": return [`${indent}${locals.get(statement.local)} = ${expr(statement.value)};`]
      case "global.set": return [`${indent}global = ${expr(statement.value)};`]
      case "array.store": return [`${indent}store_${statement.type}(${arrays.get(statement.array)}, ${address(statement, expr)}, ${expr(statement.value)});`]
      case "array.move": return [`${indent}memory_copy(${arrays.get(statement.array)}, ${expr(statement.target)}, ${expr(statement.source)}, ${expr(statement.count)});`]
      case "if": return [
        `${indent}if (${expr(statement.cond)}) {`, ...nested(statement.then),
        ...(statement.else.length ? [`${indent}} else {`, ...nested(statement.else)] : []),
        `${indent}}`,
      ]
      case "block": return [`${indent}block${statement.control}: {`, ...nested(statement.body), `${indent}}`]
      case "loop": return [`${indent}while (${expr(statement.cond)}) {`, ...nested(statement.body), `${indent}}`]
      case "break": return [`${indent}break${statement.target == null ? "" : ` block${statement.target}`};`]
      case "continue": return [`${indent}continue${statement.target == null ? "" : ` block${statement.target}`};`]
      case "return": return [`${indent}return${statement.value ? ` ${expr(statement.value)}` : ""};`]
      case "call.void": return [`${indent}${functions.get(statement.target)}(${statement.args.map(expr).join(", ")});`]
      case "trap": return [`${indent}trap(${JSON.stringify(statement.message)});`]
      case "log": return [`${indent}log(${JSON.stringify(statement.message)}, ${expr(statement.value)});`]
      case "expr": return [`${indent}${expr(statement.expr)};`]
    }
  })

  const result = typeof func.result === "object" ? `struct${func.result.size * 8}` : func.result
  const signature = `${result} ${functions.get(func)}(${func.params.map((type, i) => `${type} p${i}`).join(", ")})`
  const declarations = built.locals.map(([, type], i) => `  ${type} v${i};`)
  const body = asStmts(built.built)
  const statements = body ? lines(body) : [`  return ${expr(built.built)};`]
  return [signature + " {", ...declarations, ...statements, "}"].join("\n")
}

const address = (value: { index: AnyExpr, stride: number, offset: number }, expr: (value: AnyExpr) => string) =>
  value.offset ? `(${expr(value.index)} * ${value.stride} + ${value.offset})` :
  value.stride === 1 ? expr(value.index) : `(${expr(value.index)} * ${value.stride})`
