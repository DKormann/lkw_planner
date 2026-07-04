
type Person = {
  name: string,
  age: number
}

type Pair <T> = [T, T]

let ss : Pair<string>
let nn : Pair<number>

let peter : Person = {
  name: "peter",
  age: 30
}


function getage(p: Person){
  return p.age
}


function make_pair <T> (a:T) : [T, T] {
  return [a, a]
}


make_pair(1)



make_pair("hello")



