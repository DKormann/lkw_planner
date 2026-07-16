import { string } from "../src/schema"


export function assert (t: boolean, msg: string){
  if (!t) throw new Error(msg)
}


export async function runTests(...fn: (()=> any)[]){
  let errors : string[] = []
  for (let f of fn){
    try {
      await f()
    }catch(e){
      errors.push(`failed :${f.name}n${String(e)}`)
    }
  }
  console.log(errors.join("\n"))
  console.log(`${errors.length} failed.`)
}
