import { array, boundsCheck, compile, formatModule, func, i32, ifElse, local, log, ret, struct, trap } from "../src/wasm"
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

  async function explicitTrap() {
    const fail = func([], "void", () => trap("deliberate test trap"))
    const { fail: run } = await compile({ fail })
    let error: unknown
    try { run() } catch (caught) { error = caught }
    assert(error instanceof Error && error.message === "deliberate test trap", "trap should report its message")
  },

  async function javascriptLogger() {
    const write = func(["i32"], "void", value => log("logged value", value))
    const { write: run } = await compile({ write })
    const original = console.log
    let received: unknown[] = []
    console.log = (...values) => { received = values }
    try { run(42) } finally { console.log = original }
    assert(received[0] === "logged value" && received[1] === 42, "logger should pass its string and value to JavaScript")
  },

  function formatsExpandedAst() {
    const values = array("i32", 2)
    const helper = func(["i32"], "void", value => values.at(0).set(value))
    const run = func(["i32"], "void", value => [
      helper.call(value),
      ifElse(value.lt(0), trap("negative value")),
    ])
    const text = formatModule({ run, values })
    assert(text.includes("void run(i32 p0)"), "formatter should print exported signatures")
    assert(text.includes("store_i32(values"), "formatter should print helper memory stores")
    assert(text.includes('trap(\"negative value\")'), "formatter should print trap messages")
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

  async function structFunctionResults() {
    const Pair = struct({ left: "u16", right: ["i16", 10] })
    const pairs = array(Pair, 1)
    const write = func([], "void", () => pairs.at(0).set({ left: 40, right: -3 }))
    const get = func([], Pair, () => pairs.at(0))
    const make = func([], Pair, () => {
      const pair = local(Pair)
      return [pair.set({ left: 9, right: -2 }), ret(pair)]
    })
    const sum = func([], "i32", () => {
      const pair = get.call()
      return pair.left.add(pair.right)
    })
    const mod = await compile({ write, get, make, sum, pairs })
    mod.write()
    assert(mod.sum() === 37, "struct-returning WASM calls should expose typed fields internally")
    const pair = mod.get()
    assert(pair.left === 40 && pair.right === -3, "exported struct results should decode to JavaScript objects")
    assert(mod.make().left === 9 && mod.make().right === -2, "ret should accept struct values")
  },

  async function packedBitFields() {
    const Bits = struct({ low: ["i16", 6], high: ["i16", 10] })
    const values = array(Bits, 1)
    const write = func([], "i32", () => {
      const value = values.at(0)
      return [value.low.set(17), value.high.set(-5), ret(value.low.add(value.high))]
    })
    const mod = await compile({ values, write })

    assert(Bits.size === 2, "16 bits should use u16 storage")
    assert(Bits.layout.high.bitOffset === 6, "bitfields should be packed consecutively")
    assert(mod.write() === 12, "signed bitfield should be sign-extended on read")
    assert(mod.values[0] === 0xfed1, "writing one bitfield should preserve its neighbor")
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
    const read = func(["i32"], "i32", i => [boundsCheck(items, i), ret(items.at(i).value)])
    const { read: run } = await compile({ read })
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
