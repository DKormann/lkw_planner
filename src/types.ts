import { random } from "./random";
import { array, boolean, constant, number, object, string, tagged, union, type Infer, type Schema } from "./schema";


export type UUID = `u${string}-${string}`
export const UUID : Schema<UUID> = string


// export type Unit <s extends string> = {value: number, unit: s}
// export const Unit = <s extends string>(unit: s) => object({value: number, unit: constant(unit)})

// export const uconst = <s extends string>(value: number, unit: s) : Unit<s> => ({value, unit})
// export const add = <s extends string>(a: Unit<s>, b: Unit<s>) : Unit<s> => ({value: a.value + b.value, unit: a.unit})
// export const iadd = <s extends string>(a: Unit<s>, b: Unit<s>) => {a.value += b.value}

// export const sub = <s extends string>(a: Unit<s>, b: Unit<s>) : Unit<s> => ({value: a.value - b.value, unit: a.unit})
// export const isub = <s extends string>(a: Unit<s>, b: Unit<s>) => {a.value -= b.value}
// export const mul = <s extends string>(a: Unit<s>, b: number) : Unit<s> => ({value: a.value * b, unit: a.unit})


export function randomUUID() {return "u" + random().toString(16).slice(2,10) + "-" + random().toString(16).slice(2,10) as UUID}

// export const number = Unit("eur")
// export const number = Unit("seconds")
// export type number = Unit<"eur">
// export type number = Unit<"seconds">


// export type number = `loc${string}`
// export const number : Schema<number> = string

export const Request = object({
  id: UUID,
  startPoint: number,
  endPoint: number,
  value_eur: number,
  deadline_km: number,
})

export const Transporter = object({ id: UUID, position: UUID, })

export const ScheduleStep = tagged({
  pickup: object({request: UUID, pos: number, deck: union(constant(0), constant(1))}),
  deliver: object({request: UUID, pos: number}),
  start: object({pos: number}),
})
export const ScheduleItem = object({
  transporter: UUID,
  steps: array(ScheduleStep),
})
export const Schedule = array(ScheduleItem)

export const Module = object({

  requests: array(Request),
  transporters: array(Transporter),
  schedule: Schedule,

})

export type Request = Infer<typeof Request>
export type Transporter = Infer<typeof Transporter>
export type ScheduleStep = Infer<typeof ScheduleStep>
export type ScheduleItem = Infer<typeof ScheduleItem>
export type Schedule = Infer<typeof Schedule>

