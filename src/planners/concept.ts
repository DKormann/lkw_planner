/**
 * An intentionally tiny preview of an imperative authoring layer for the WASM
 * DSL. Running the builder records statements; expression objects remain lazy
 * values. Constructing an expression records its evaluation point, so assigning
 * it to a normal JS variable gives it snapshot semantics.
 *
 * This file is standalone and is not used by the planner yet.
 */

type Expr = {
  kind: "literal" | "local" | "binary"
  id?: number
  value?: number
  name?: string
  op?: string
  left?: Expr
  right?: Expr
  add(right: ExprLike): Expr
  sub(right: ExprLike): Expr
  mul(right: ExprLike): Expr
  lt(right: ExprLike): Expr
}

type ExprLike = Expr | number

type Mutable = Expr & {
  set(value: ExprLike): void
  addAssign(value: ExprLike): void
}

type Statement =
  | { kind: "compute", target: Expr }
  | { kind: "declare", target: Mutable, value: Expr }
  | { kind: "assign", target: Mutable, value: Expr }
  | { kind: "expression", value: Expr }
  | { kind: "if", condition: Expr, then: Statement[], else: Statement[] }
  | { kind: "while", condition: Expr, body: Statement[] }
  | { kind: "return", value?: Expr }

type FunctionIR = {
  name: string
  parameters: Mutable[]
  body: Statement[]
}

const expressionMethods = {
  add(this: Expr, right: ExprLike) { return binary("+", this, right) },
  sub(this: Expr, right: ExprLike) { return binary("-", this, right) },
  mul(this: Expr, right: ExprLike) { return binary("*", this, right) },
  lt(this: Expr, right: ExprLike) { return binary("<", this, right) },
}

const expression = (node: Omit<Expr, keyof typeof expressionMethods>): Expr =>
  Object.assign(node, expressionMethods) as Expr

const literal = (value: number): Expr => expression({ kind: "literal", value })
const asExpr = (value: ExprLike): Expr => typeof value === "number" ? literal(value) : value
const binary = (op: string, left: ExprLike, right: ExprLike): Expr => {
  const shouldRecord = recordExpressions && recordingStack.length > 0
  const result = expression({ kind: "binary", id: shouldRecord ? nextExpression++ : undefined, op, left: asExpr(left), right: asExpr(right) })
  if (shouldRecord) emit({ kind: "compute", target: result })
  return result
}

const recordingStack: Statement[][] = []
let nextLocal = 0
let nextExpression = 0
let recordExpressions = true

const emit = (statement: Statement): void => {
  const body = recordingStack.at(-1)
  if (!body) throw new Error("WASM statement emitted outside a function or control-flow body")
  body.push(statement)
}

const capture = (build: () => void): Statement[] => {
  const body: Statement[] = []
  recordingStack.push(body)
  try {
    build()
    return body
  } finally {
    recordingStack.pop()
  }
}

const mutable = (name: string): Mutable => {
  const value = expression({ kind: "local", name }) as Mutable
  value.set = input => emit({ kind: "assign", target: value, value: asExpr(input) })
  value.addAssign = input => value.set(value.add(input))
  return value
}

/** Create a mutable WASM local and initialize it at this point in the flow. */
const variable = (initial: ExprLike, hint = "v"): Mutable => {
  const value = mutable(`${hint}${nextLocal++}`)
  emit({ kind: "declare", target: value, value: asExpr(initial) })
  return value
}

const if_ = (condition: ExprLike, then: () => void, else_: () => void = () => {}): void =>
  emit({ kind: "if", condition: asExpr(condition), then: capture(then), else: capture(else_) })

// A loop condition must remain a recipe evaluated on every runtime iteration.
// The callback also makes that distinction visible in ordinary JS syntax.
const live = (build: () => Expr): Expr => {
  const previous = recordExpressions
  recordExpressions = false
  try {
    return build()
  } finally {
    recordExpressions = previous
  }
}

const while_ = (condition: () => Expr, body: () => void): void =>
  emit({ kind: "while", condition: live(condition), body: capture(body) })

const for_ = (start: ExprLike, end: ExprLike, body: (index: Mutable) => void): void => {
  const index = variable(start, "i")
  while_(() => index.lt(end), () => {
    body(index)
    index.addAssign(1)
  })
}

const return_ = (value?: ExprLike): void =>
  emit({ kind: "return", value: value === undefined ? undefined : asExpr(value) })

const fn = (name: string, parameterNames: string[], build: (...parameters: Mutable[]) => void): FunctionIR => {
  const parameters = parameterNames.map(mutable)
  return { name, parameters, body: capture(() => build(...parameters)) }
}

const renderExpr = (value: Expr, expand = false): string => {
  switch (value.kind) {
    case "literal": return String(value.value)
    case "local": return value.name!
    case "binary": return expand || value.id === undefined
      ? `(${renderExpr(value.left!)} ${value.op} ${renderExpr(value.right!)})`
      : `e${value.id}`
  }
}

const indent = (depth: number) => "  ".repeat(depth)

const renderStatements = (statements: Statement[], depth: number): string[] =>
  statements.flatMap(statement => {
    const pad = indent(depth)
    switch (statement.kind) {
      case "compute": return [`${pad}i32 e${statement.target.id} = ${renderExpr(statement.target, true)};`]
      case "declare": return [`${pad}i32 ${statement.target.name} = ${renderExpr(statement.value)};`]
      case "assign": return [`${pad}${statement.target.name} = ${renderExpr(statement.value)};`]
      case "expression": return [`${pad}${renderExpr(statement.value)};`]
      case "return": return [`${pad}return${statement.value ? ` ${renderExpr(statement.value)}` : ""};`]
      case "if": return [
        `${pad}if (${renderExpr(statement.condition)}) {`,
        ...renderStatements(statement.then, depth + 1),
        ...(statement.else.length ? [
          `${pad}} else {`,
          ...renderStatements(statement.else, depth + 1),
        ] : []),
        `${pad}}`,
      ]
      case "while": return [
        `${pad}while (${renderExpr(statement.condition)}) {`,
        ...renderStatements(statement.body, depth + 1),
        `${pad}}`,
      ]
    }
  })

export const renderFunction = (func: FunctionIR): string => [
  `i32 ${func.name}(${func.parameters.map(parameter => `i32 ${parameter.name}`).join(", ")}) {`,
  ...renderStatements(func.body, 1),
  `}`,
].join("\n")


function bind (fn : (v: Mutable)=> Expr){

  return fn (mutable("x")) 

}


bind(x=>
  x.add(x)
)

export const preview = fn("preview", ["limit"], limit => {
  const sum = variable(0, "sum")

  // Constructing this expression records its value here, just like assigning a
  // number to a normal JS variable. It remains the old value after sum changes.
  const doubled = sum.mul(2)
  sum.set(3)
  const oldDoubledPlusNewSum = doubled.add(sum)

  for_(0, limit, i => {
    if_(i.lt(3),
      () => sum.addAssign(i),
      () => sum.addAssign(1),
    )
  })

  return_(oldDoubledPlusNewSum.add(sum))
})

export const previewC = renderFunction(preview)

if ((import.meta as ImportMeta & { main?: boolean }).main) console.log(previewC)
