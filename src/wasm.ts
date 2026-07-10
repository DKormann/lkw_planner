
const magic = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]

const local = {
  get: (index: number) => [0x20, index],
  set: (index: number) => [0x21, index],
  tee: (index: number) => [0x22, index],
}

const op = {
  add: (type: NumType) => {
    switch(type){
      case "i32": return 0x6a
      case "i64": return 0x7c
      case "f32": return 0x92
      case "f64": return 0xa0
    }
  }
}

const exampleBytes = new Uint8Array([
  ...magic,

  // Type section:
  // one function type: (i32, i32) -> i32
  0x01, 0x07,
  0x01,
  0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f,

  // Function section:
  // one function using type 0
  0x03, 0x02,
  0x01,
  0x00,

  // Export section:
  // export function 0 as "add"
  0x07, 0x07,
  0x01,
  0x03, 0x61, 0x64, 0x64,
  0x00,
  0x00,

  // Code section:
  // local.get 0
  // local.get 1
  // i32.add
  // end
  0x0a, 0x09,
  0x01,
  0x07,
  0x00,
  ...local.get(0),
  ...local.get(1),
  op.add("i32"),
  0x0b,
]);

export const instance = await WebAssembly.instantiate(exampleBytes)


export type NumType = "i32" | "i64" | "f32" | "f64"
export type BinOp = "add" | "sub" | "mul" | "div" | "rem" | "and" | "or" | "xor" | "shl" | "shr" | "rotl" | "rotr" | "eq"

export type FunType = {op: "func", ret: WType, args: WType[]}

type WType = NumType | FunType

type Num <T extends NumType> = {
  type: T,
  op: "const",
  val: number
}

type Fun <T extends FunType> = {
  type: T,
  op: "func",
  body: Expr<T["ret"]>[],
  args: Expr<T["args"][number]>[]
}

type Bin <T extends NumType> = {
  type: T,
  op: BinOp,
  srcs: Expr<NumType>[]
}

type Expr <T extends WType> =
 T extends NumType ? (Num<T> | Bin<T>)
 : T extends FunType ? (Fun<T>)
 : never


function mkConst <T extends NumType> (type: T ) {
  return function (val: number): Num<T>{ return {op: "const", type, val}}
}


const I32 = mkConst("i32")
const I64 = mkConst("i64")


function add <const T extends NumType> (a: Expr<T>, b: Expr<T>): Bin<T>{
  let type = a.type as T
  return {
    type,
    op: "add",
    srcs: [a, b],
  }
}

function eq <T extends NumType> (a: Expr<T>, b: Expr<T>): Bin<"i32">{
  return {
    type: "i32",
    op: "eq",
    srcs: [a, b],
  }
}

export type Val <T> = {
  bytes: number[],
}


type FType <R extends Val<any>, Args extends Val<any>[]> = {
  ret: R,
  args: Args
}




export type FuncDef <T extends (...args: any[])=>any> = number[]

export function WasmInstantiate <F extends {[key: string]: FuncDef<any>}> (fs:F){



}






