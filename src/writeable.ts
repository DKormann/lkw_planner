import type { JsonData } from "./schema"


export function mkWritable<T extends JsonData> (value: T) {


  let listeners: ((newValue: T, oldValue: T)=>void)[] = []
  let rep = JSON.stringify(value)

  let res = {
    get: () => value,
    set: (newValue: T) => {
      let newRep = JSON.stringify(newValue)
      if (newRep === rep) return
      rep = newRep
      listeners.forEach((listener) => listener(newValue, value))
      value = newValue
    },
    onupdate: (listener: (newValue: T, oldValue :T)=>void) => {
      listener(value, value)
      listeners.push(listener)
    },
    update: (callback: (oldValue: T)=>T | undefined) => {
      let newValue = callback(value) ?? value
      res.set(newValue)
    }

  }

  return res

}


