



const binops = ["add", "sub", "mul", "div", "and", "or", "xor", "shl", "shr", "rotl", "rotr"] as const
type binop = typeof binops[number]

const cmpops = ["eq", "ne", "lt", "gt", "le", "ge"] as const
type cmpop = typeof cmpops[number]

const DSIZES = [8, 16, 32, 64] as const

const DKINDS = ["i", "u", "f"] as const

type DTYPE = `${typeof DKINDS[number]}${typeof DSIZES[number]}`

const DTYPES = DKINDS.flatMap(k=>DSIZES.map(s=>`${k}${s}`)) as DTYPE[]


type CmpExpr <T extends DTYPE> = {
  $: "cmp",
  op: cmpop,
  a: Expr<T>,
  b: Expr<T>,
}


type Const <T extends DTYPE> = {
    $: "const",
    val: number,
    dtype: T
  }

type ExCore <T extends DTYPE> =
  Const<T> | {
    $: "local",
    index: number,
    dtype: T
  } | {
    $: "binop",
    op: binop,
    a: Expr<T>,
    b: Expr<T>
  } | {
    $: "cast",
    dtype: T,
    x: Expr<any>,
  } | (T extends "i32" ? CmpExpr<any> : never)

type Expr <T extends DTYPE> = ExCore<T> & HasBin<T> & HasCmp

type Term = number | Expr<any>



type HasBin <DT extends DTYPE> = {
  [K in binop] : (other: Term) => Expr<DT>
}

type HasCmp = {
  [K in cmpop] : (other: Term) => Expr<"i32">
}

type Dispatcher <DT extends DTYPE> = {
  [K in binop] : (a:Term, b: Term) => Expr<DT>
} & {
  [K in cmpop] : (a:Term, b: Term) => Expr<"i32">
}

const dispatchers = Object.fromEntries(DTYPES.map(t=>
  [
    t,
    Object.fromEntries(binops.map(op=>[op, (a:Term, b:Term)=>({$:"binop", op, a: typeof a === "number" ? num[t](a) : a, b: typeof b === "number" ? num[t](b) : b})])) as Dispatcher<typeof t>
  ]
)) as {[K in DTYPE]: Dispatcher<K>}



function addDispatch<D extends DTYPE>(dtype: D, core: ExCore<D>) {
  let self = {...core,
    ...Object.fromEntries(
      Object.entries(dispatchers[dtype]).map(([op, fn])=>[op, (other: Term)=>fn(self, other)])
    ) as {[K in binop]: (other: Term) => Expr<D>} ,
  } as Expr<D>
  return self
}


const num = Object.fromEntries(DTYPES.map(t=>
  [
    t,
    (val:number) =>  addDispatch(t, ({$:"const", val, dtype:t}))
  ])) as {[K in DTYPE]: (val:number)=> Expr<K>}