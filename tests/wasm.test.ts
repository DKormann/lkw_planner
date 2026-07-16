import { array, compile, func, i32, ifElse, local, ret, struct } from "../src/wasm"
import { assert, runTests } from "./tests"

await runTests(
  async function integerExpressions() {
    const { xorSelf } = await compile({
      xorSelf: func(["i32"], "i32", x => x.xor(x)),
    })
    assert(xorSelf(33) === 0, "xor with self should be zero")
  },

  async function voidFunctions() {
    const values = array("i32", 1)
    const write = func(["i32"], "void", value => [values.at(0).set(value)])
    const run = func(["i32"], "void", value => [write.call(value)])
    const read = func([], "i32", () => values.at(0))
    const mod = await compile({ run, read, values })

    assert(mod.run(42) === undefined, "void WASM export should return undefined")
    assert(mod.read() === 42, "void helper call should execute its statements")
  },

  async function conditionalExpressionsAndStatements() {
    const values = array("i32", 1)
    const choose = func(["i32"], "i32", condition => ifElse(condition, i32(10), i32(20)))
    const write = func(["i32"], "void", condition =>
      ifElse(condition, values.at(0).set(30), [[values.at(0).set(40)]]))
    const read = func([], "i32", () => values.at(0))
    const mod = await compile({ choose, write, read, values })

    assert(mod.choose(1) === 10 && mod.choose(0) === 20, "ifElse should produce expression values")
    mod.write(1)
    assert(mod.read() === 30, "ifElse should accept a single statement")
    mod.write(0)
    assert(mod.read() === 40, "ifElse should flatten nested statement arrays")
  },

  async function structArrayFields() {
    const Item = struct({ score: "i32", small: "u16", flag: "u8" })
    const items = array(Item, 3)
    const write = func(["i32"], "i32", i => {
      const item = items.at(i)
      return [item.small.set(513), item.score.set(-7), item.flag.set(3), ret(item.small.add(item.score))]
    })
    const mod = await compile({ items, write })

    assert(Item.layout.score.bitOffset === 0, "first field should start at bit zero")
    assert(Item.layout.small.bitOffset === 32, "u16 should follow the i32 field")
    assert(Item.size === 8, `all structs should have one i64 representation, got ${Item.size}`)
    assert(mod.write(1) === 506, "struct fields should load their stored values")
    assert(mod.items.byteLength === Item.size * 3, "struct export should cover the complete array")
  },

  async function structLocals() {
    const Pair = struct({ left: "i32", right: "u16" })
    const pairs = array(Pair, 1)
    const sum = func(["i32", "i32"], "i32", (a, b) => {
      const pair = local(Pair)
      const source = pairs.at(0)
      return [source.set({ left: a, right: b }), pair.set(source), source.left.set(0), ret(pair.left.add(pair.right))]
    })
    const { sum: run } = await compile({ sum, pairs })
    assert(run(20, 22) === 42, "whole-struct set should snapshot one i64 into the local")
  },

  async function packedBitFields() {
    const Bits = struct({ low: ["i16", 6], high: ["i16", 10] })
    const values = array(Bits, 1)
    const write = func([], "i32", () => {
      const value = values.at(0)
      return [value.low.set(17), value.high.set(-5), ret(value.low.add(value.high))]
    })
    const mod = await compile({ values, write })

    assert(Bits.size === 8, "packed struct should still use one canonical i64")
    assert(Bits.layout.high.bitOffset === 6, "bitfields should be packed consecutively")
    assert(mod.write() === 12, "signed bitfield should be sign-extended on read")
    assert(mod.values[0] === 0xd1 && mod.values[1] === 0xfe, "writing one bitfield should preserve its neighbor")
  },

  async function structArrayMove() {
    const Item = struct({ value: "i32", tag: "u8" })
    const items = array(Item, 3)
    const seedAndMove = func([], "i32", () => [
      items.at(0).value.set(77),
      items.at(0).tag.set(9),
      items.move(1, 0, 1),
      ret(items.at(1).value.add(items.at(1).tag)),
    ])
    const { seedAndMove: run } = await compile({ seedAndMove, items })
    assert(run() === 86, "memory.copy should move the complete struct element")
  },

  async function runtimeStructBoundsCheck() {
    const Item = struct({ value: "i32" })
    const items = array(Item, 2)
    const read = func(["i32"], "i32", i => items.at(i).value)
    const { read: run } = await compile({ read }, { runtimeBoundsChecks: true })
    let trapped = false
    try { run(2) } catch { trapped = true }
    assert(trapped, "dynamic out-of-bounds struct access should trap")
  },

  async function rejectsStructsOver64Bits() {
    let rejected = false
    try { struct({ a: "i64", b: "u8" }) } catch { rejected = true }
    assert(rejected, "struct definitions larger than one i64 should be rejected")
  },
)
