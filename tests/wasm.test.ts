import { array, boundsCheck, compile, exp, f32, fn, for_, formatModule, global, i32, ifElse, log, return_, struct, trap, variable, when, while_ } from "../src/wasm"
import { annealingWasm } from "../src/planners/annealing_wasm"
import { initAnnealingState, insertStops, getReq, isLoad, KM_COST_CENTS, scoreRoute, type AnnealingState } from "../src/planners/annealing_shared"
import { randomModule } from "../src/types"
import { assert, runTests } from "./tests"

await runTests(
  async function recordedImperativeFlow() {
    const preview = fn(["i32"], "i32", limit => {
      const sum = variable(0)
      const doubled = sum.mul(2)
      sum.set(3)
      const oldDoubledPlusNewSum = doubled.add(sum)
      for_(0, limit, i => when(i.lt(3), () => sum.iadd(i), () => sum.iadd(1)))
      return oldDoubledPlusNewSum.add(sum)
    })
    const mod = await compile({ preview })
    assert(mod.preview(4) === 10, "JS expression variables should snapshot recorded values")
  },

  async function mutableGlobals() {
    const state = global("i32", 3)
    const advance = fn([], "i32", () => {
      state.iadd(2)
      return state
    })
    const mod = await compile({ advance })
    assert(mod.advance() === 5 && mod.advance() === 7, "mutable globals should persist across calls")
  },

  async function approximateExp() {
    const evaluate = fn(["f32"], "f32", x => exp(x))
    const mod = await compile({ evaluate })
    for (const x of [-10, -5, -2, -1, 0, 1, 2])
      assert(Math.abs(mod.evaluate(x) / Math.exp(x) - 1) < .05, `exp approximation should be close at ${x}`)
  },

  async function integerExpressions() {
    const xorSelf = fn(["i32"], "i32", x => x.xor(x))
    const mod = await compile({ xorSelf })
    assert(mod.xorSelf(33) === 0, "xor with self should be zero")
  },

  async function voidFunctions() {
    const values = array("i32", 1)
    const write = fn(["i32"], "void", value => { values.at(0).set(value) })
    const run = fn(["i32"], "void", value => { write.call(value) })
    const read = fn([], "i32", () => values.at(0))
    const mod = await compile({ run, read, values })
    assert(mod.run(42) === undefined, "void WASM export should return undefined")
    assert(mod.read() === 42, "void helper call should execute")
  },

  async function explicitTrap() {
    const fail = fn([], "void", () => { trap("deliberate test trap") })
    const mod = await compile({ fail })
    let error: unknown
    try { mod.fail() } catch (caught) { error = caught }
    assert(error instanceof Error && error.message === "deliberate test trap", "trap should report its message")
  },

  async function javascriptLogger() {
    const write = fn(["i32"], "void", value => { log("logged value", value) })
    const mod = await compile({ write })
    const original = console.log
    let received: unknown[] = []
    console.log = (...values) => { received = values }
    try { mod.write(42) } finally { console.log = original }
    assert(received[0] === "logged value" && received[1] === 42, "logger should pass values to JavaScript")
  },

  function formatsExpandedAst() {
    const values = array("i32", 2)
    const helper = fn(["i32"], "void", value => { values.at(0).set(value) })
    const run = fn(["i32"], "void", value => {
      helper.call(value)
      when(value.lt(0), () => trap("negative value"))
    })
    const text = formatModule({ run, values })
    assert(text.includes("void run(i32 p0)"), "formatter should print exported signatures")
    assert(text.includes("store_i32(values"), "formatter should print helper memory stores")
    assert(text.includes('trap("negative value")'), "formatter should print trap messages")
  },

  async function conditionalExpressionsAndStatements() {
    const values = array("i32", 1)
    const choose = fn(["i32"], "i32", condition => ifElse(condition, i32(10), i32(20)))
    const write = fn(["i32"], "void", condition => {
      when(condition, () => values.at(0).set(30), () => values.at(0).set(40))
    })
    const read = fn([], "i32", () => values.at(0))
    const mod = await compile({ choose, write, read, values })
    assert(mod.choose(1) === 10 && mod.choose(0) === 20, "ifElse should produce expression values")
    mod.write(1)
    assert(mod.read() === 30, "when should record its true branch")
    mod.write(0)
    assert(mod.read() === 40, "when should record its false branch")
  },

  async function structArrayFields() {
    const Item = struct({ score: "i32", small: "u16", flag: "u8" })
    const items = array(Item, 3)
    const write = fn(["i32"], "i32", i => {
      const item = items.at(i)
      item.small.set(513)
      item.score.set(-7)
      item.flag.set(3)
      return item.small.add(item.score)
    })
    const mod = await compile({ items, write })
    assert(Item.layout.small.bitOffset === 32, "u16 should follow the i32 field")
    assert(Item.size === 8, `struct should have one i64 representation, got ${Item.size}`)
    assert(mod.write(1) === 506, "struct fields should load their stored values")
    assert(mod.items.byteLength === Item.size * 3, "struct export should cover the complete array")
  },

  async function structLocals() {
    const Pair = struct({ left: "i32", right: "u16" })
    const pairs = array(Pair, 1)
    const sum = fn(["i32", "i32"], "i32", (a, b) => {
      const pair = variable(Pair)
      const source = pairs.at(0)
      source.set({ left: a, right: b })
      pair.set(source)
      source.left.set(0)
      return pair.left.add(pair.right)
    })
    const mod = await compile({ sum })
    assert(mod.sum(20, 22) === 42, "whole-struct set should snapshot into a variable")
  },

  async function scopedStructSnapshotsStayInsideLoops() {
    const Item = struct({ value: "i32", tag: "u8" })
    const items = array(Item, 2)
    const sum = fn([], "i32", () => {
      const total = variable(0), i = variable(0)
      while_(() => i.lt(2), () => {
        const item = variable(items.at(i))
        total.iadd(item.value.add(item.tag))
        i.iadd(1)
      })
      return total
    })
    const mod = await compile({ items, sum })
    ;(mod.items as BigUint64Array).set([3n | 4n << 32n, 5n | 6n << 32n])
    assert(mod.sum() === 18, "scoped packed values should be initialized inside each loop iteration")
  },

  async function structFunctionResults() {
    const Pair = struct({ left: "u16", right: ["i16", 10] })
    const pairs = array(Pair, 1)
    const write = fn([], "void", () => { pairs.at(0).set({ left: 40, right: -3 }) })
    const get = fn([], Pair, () => pairs.at(0))
    const make = fn([], Pair, () => {
      const pair = variable(Pair, { left: 9, right: -2 })
      return pair
    })
    const sum = fn([], "i32", () => {
      const pair = get.call()
      return pair.left.add(pair.right)
    })
    const mod = await compile({ write, get, make, sum })
    mod.write()
    const pair = mod.get()
    assert(mod.sum() === 37, "struct-returning calls should expose typed fields")
    assert(pair.left === 40 && pair.right === -3, "exported struct results should decode")
    assert(mod.make().left === 9 && mod.make().right === -2, "functions should return struct values")
  },

  async function packedBitFields() {
    const Bits = struct({ low: ["i16", 6], high: ["i16", 10] })
    const values = array(Bits, 1)
    const write = fn([], "i32", () => {
      const value = values.at(0)
      value.low.set(17)
      value.high.set(-5)
      return value.low.add(value.high)
    })
    const mod = await compile({ values, write })
    assert(mod.write() === 12, "signed bit fields should round-trip")
  },

  async function structArrayMove() {
    const Item = struct({ value: "i32", tag: "u8" })
    const items = array(Item, 3)
    const seedAndMove = fn([], "i32", () => {
      items.at(0).set({ value: 81, tag: 5 })
      items.move(1, 0, 1)
      items.at(0).set({ value: 0, tag: 0 })
      return items.at(1).value.add(items.at(1).tag)
    })
    const mod = await compile({ seedAndMove })
    assert(mod.seedAndMove() === 86, "memory.copy should move complete structs")
  },

  async function runtimeStructBoundsCheck() {
    const Item = struct({ value: "i32" })
    const items = array(Item, 2)
    const read = fn(["i32"], "i32", i => {
      boundsCheck(items, i)
      return items.at(i).value
    })
    const mod = await compile({ read })
    let trapped = false
    try { mod.read(2) } catch { trapped = true }
    assert(trapped, "dynamic out-of-bounds struct access should trap")
  },

  async function wasmTransporterRatingMatchesJs() {
    const mod = randomModule(20, 5, 20, 100, 22)
    const result = await annealingWasm(mod, { steps: 10_000 })
    const schedule = new Uint32Array(result.schedule)
    for (let tran = 0; tran < mod.NTRANS; tran++) {
      for (let i = 0; i < result.scheduleSizes[tran]!; i++) {
        const at = tran * result.TSIZE + i, step = schedule[at]!, request = mod.requests[getReq(step)]!
        schedule[at] = step | (isLoad(step) ? request.startPoint : request.endPoint) << 16
      }
    }
    const state: AnnealingState = {
      mod, NREQS: mod.NREQS, NTRANS: mod.NTRANS, TSIZE: result.TSIZE,
      reqPickupLocations: new Uint16Array(mod.requests.map(request => request.startPoint)),
      reqDeliveryLocations: new Uint16Array(mod.requests.map(request => request.endPoint)),
      reqDeadlines: new Uint32Array(mod.requests.map(request => Math.floor(request.deadline_h * 60))),
      reqValues: new Uint32Array(mod.requests.map(request => Math.round(request.value_eur * 100))),
      unassigned: result.unassigned, tranStart: result.tranStart, schedule,
      scheduleSizes: result.scheduleSizes, scheduleRatings: result.scheduleRatings,
    }
    for (let tran = 0; tran < mod.NTRANS; tran++)
      assert(result.scheduleRatings[tran] === scoreRoute(state, tran), `transporter ${tran} rating should match JS`)
  },

  function annealingScoresInCents() {
    const mod = randomModule(1, 1, 5, 100, 22)
    const request = mod.requests[0]!
    request.value_eur = 123
    request.deadline_h = 10_000
    const state = initAnnealingState(mod)
    insertStops(state, 0, 0, 0, 0, 0)
    const distance = mod.roadmap.getCostN(mod.startpositions[0]!, request.startPoint, request.endPoint)
    assert(scoreRoute(state, 0) === 12_300 - distance * KM_COST_CENTS, "route score should be reward cents minus travel cents")
  },

  async function rejectsStructsOver64Bits() {
    let rejected = false
    try { struct({ a: "i64", b: "u8" }) } catch { rejected = true }
    assert(rejected, "struct definitions larger than one i64 should be rejected")
  },
)
