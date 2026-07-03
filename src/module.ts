import { array, boolean, constant, number, object, string, tagged, union, type Infer, type Schema } from "./schema";


export type UUID = `u${string}-${string}`
export const UUID : Schema<UUID> = string


export function randomUUID() {return "u" + Math.random().toString(16).slice(2,10) + "-" + Math.random().toString(16).slice(2,10) as UUID}

export const Location = object({
  id: UUID,
  rep: string,
  location: object({ x: number, y: number })
})


export const Request = object({
  id: UUID,
  startPoint: UUID,
  endPoint: UUID,
  value: number,
  deadline: number,
})

export const Transporter = object({ id: UUID, position: UUID, })

export const ScheduleStep = tagged({
  pickup: object({request: UUID, pos: UUID, deck: union(constant(0), constant(1))}),
  deliver: object({request: UUID, pos: UUID}),
  start: object({pos:UUID})
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

export type Location = Infer<typeof Location>
export type Request = Infer<typeof Request>
export type Transporter = Infer<typeof Transporter>
export type ScheduleStep = Infer<typeof ScheduleStep>
export type ScheduleItem = Infer<typeof ScheduleItem>
export type Schedule = Infer<typeof Schedule>

