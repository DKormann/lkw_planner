import { validate, type JsonData, type Schema } from "./schema"



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
    onupdate: (listener: (newValue: T, oldValue :T)=>void, deferred = false) => {
      if (!deferred) listener(value, value)
      listeners.push(listener)
    },
    update: (callback: (oldValue: T)=>T | undefined) => {
      let newValue = callback(value) ?? value
      res.set(newValue)
    }

  }

  return res

}

export type Writable<T extends JsonData> = ReturnType<typeof mkWritable<T>>

export function mkStored <T extends JsonData> (key: string, schema: Schema<T>, defaultValue: T) {
  let val = defaultValue
  try{
    val = validate(schema, JSON.parse(localStorage.getItem(key)!))
  }catch{}

  let res = mkWritable<T>(val)
  
  res.onupdate((newValue)=>{
    localStorage.setItem(key, JSON.stringify(newValue))
  })

  return res
}

