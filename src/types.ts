import { randChoice, randInt, random } from "./random";
import { randomMap } from "./randomMap";
import { array, boolean, constant, number, object, string, tagged, union, type Infer, type Schema } from "./schema";

export type UUID = `u${string}-${string}`
export const UUID : Schema<UUID> = string

export function randomUUID() {return "u" + random().toString(16).slice(2,10) + "-" + random().toString(16).slice(2,10) as UUID}


export const Request = object({
  id: UUID,
  startPoint: number,
  endPoint: number,
  value_eur: number,
  deadline_h: number,
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


export function randomModule (
  NREQS = 40,
  NTRANS = 10,
  NPOINTS = 100,
  MAPSIZE = 400,
  seed = 22,
){

  const roadmap = randomMap(NPOINTS, MAPSIZE)

  return {
    NTRANS,
    NREQS,
    MAPSIZE,
    RSIZE: NPOINTS * NPOINTS / 2,
    roadmap,
    requests: Array.from({length:NREQS}, (_,i)=> ({
      id: randomUUID(),
      "deadline_h" : randInt(0, Math.floor( random()* MAPSIZE*4)),
      "startPoint": randChoice(roadmap.range) as number,
      "endPoint": randChoice(roadmap.range) as number,
      "value_eur": randInt(0, 1000),
    }) as Request),
    startpositions: Array.from({length:NTRANS}, (_,i)=>randChoice(roadmap.range) as number),
  }
}


export type Module = typeof randomModule extends (...x:any) => (infer T) ? T : never

