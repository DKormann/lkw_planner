import type { JsonData } from "./schema"


export function mkWritable<T extends JsonData> (value: T) {


  let listeners: ((newValue: T, oldValue: T)=>void)[] = []

  let res = {
    get: () => value,
    set: (newValue: T) => {

      if (JSON.stringify(newValue) === JSON.stringify(value)) return
      listeners.forEach((listener) => listener(newValue, value))
      value = newValue
    },
    onupdate: (listener: (newValue: T, oldValue :T)=>void) => {
      listener(value, value)
      listeners.push(listener)
    },
    update: (callback: (oldValue: T)=>T) => {
      let newValue = callback(value)
      res.set(newValue)
    }

  }

  return res

}


