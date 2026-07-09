import { validateJsonSchema } from "./jsonschema"


export type JSONSchema = { [key: string]: JsonData }


export type JsonData = string | null | number | boolean | { [key in string]: JsonData } | JsonData[]

export type Schema<T> = { json: JSONSchema }

export type Infer<S> = S extends Schema<infer T> ? T : never

export const validate = <T> (schema: Schema<T>, data:unknown) : T => {
  return validateJsonSchema<T>(schema.json, data)
}

export const stringify = (data: JsonData): string => JSON.stringify(data, null, 2)


export const fillSchema = <T>(schema: Schema<T>) : T =>{
  let json = schema.json
  if (json.type == "string") return "" as T
  if (json.type == "number") return 0 as T
  if (json.type == "boolean") return false as T
  if (json.type == "null") return null as T
  if (json.type == "array") return [] as T
  if (json.type == "object" && json.properties){
    const result: any = {}
    let required = Array.isArray(json.required) ? json.required as string[] : []
    for (let req of required)
      result[req] = fillSchema({json: (json.properties as any)[req]})
    return result
  }
  if ("const" in json) return json.const as T
  if ("anyOf" in json && Array.isArray(json.anyOf)) return fillSchema({json: json.anyOf[0] as JSONSchema}) as T
  return null as T
}

export const fromJsonSchema = <T> (json: JSONSchema): Schema<T> => ({json})

export const string: Schema<string> = fromJsonSchema({type: "string"})
export const number: Schema<number> = fromJsonSchema({type: "number"})
export const boolean: Schema<boolean> = fromJsonSchema({type: "boolean"})
export const nullSchema : Schema<null> = fromJsonSchema({type: "null"})
export const any: Schema<any> = fromJsonSchema({})
export const optional = <T>(schema: Schema<T>) : Schema<T | null> => fromJsonSchema({anyOf: [{type: "null"}, schema.json]})
export const array = <T>(itemSchema: Schema<T>): Schema<T[]> => fromJsonSchema({type: "array", items: itemSchema.json})
export const constant = <T extends string | number | boolean>(value: T): Schema<T> => fromJsonSchema({const: value})

export const object = <S extends Record<string, Schema<any>>> (shape: S): Schema<{[K in keyof S]: Infer<S[K]>}> => fromJsonSchema({
  type: "object",
  properties: Object.fromEntries(Object.entries(shape).map(([key, field])=> [key, field.json])),
  required: Object.keys(shape)
})

export const record = <T>(valueSchema: Schema<T>): Schema<Record<string, T>> => fromJsonSchema({type: "object", additionalProperties: valueSchema.json})
export const schemaSchema : Schema<JSONSchema> = record(any)

export const union = <S extends Schema<any>[]>(...schemas: S): Schema<Infer<S[number]>> => fromJsonSchema({anyOf: schemas.map(s=> s.json)})

export function tagged <S extends {[key : string]: Schema<any>}> (fields: S) : Schema<{[key in keyof S]: {$: key, val:Infer<S[key]>} }[keyof S]> {
  return union(...Object.entries(fields).map(([$,val])=>object({$:constant($),val})))
}




export const intersection = <S extends Schema<any>[]>(...schemas: S): Schema<Infer<S[number]>> => fromJsonSchema({allOf: schemas.map(s=> s.json)})

export const asTypeView = (schema: Schema<any>): string => {
  if (schema.json.type == "string") return "string"
  if (schema.json.type == "number") return "number"
  if (schema.json.type == "boolean") return "boolean"
  if (schema.json.type == "null") return "null"
  if (schema.json.type == "array" && schema.json.items) return `${asTypeView({json: schema.json.items as JSONSchema})}[]`
  if (schema.json.type == "object" && schema.json.properties){
    let props = Object.entries(schema.json.properties).map(([key, prop])=> `${key}: ${asTypeView({json: prop as JSONSchema})}`)
    return `{\n  ${props.join(",\n").replaceAll("\n", "\n  ")}\n}`
  }
  if ("const" in schema.json) return JSON.stringify(schema.json.const)
  if ("anyOf" in schema.json && Array.isArray(schema.json.anyOf)) return schema.json.anyOf.map(s=> asTypeView({json: s as JSONSchema})).join(" | ")
  return "any"
}


