


let RANDSEED = 0

export function setRandSeed(seed: number){
  RANDSEED = seed
  RANDSEED = randInt(0, 10000)
}

export function exportState () {return RANDSEED}
export function loadState (seed: number) {RANDSEED = seed}

export function random(){
  let x = Math.sin(RANDSEED++) * 10000;
  return x - Math.floor(x);
}

export function randInt(min: number, max: number){
  return Math.floor(random() * (max - min)) + min
}

export function randChoice<T>(arr: T[]): T {
  return arr[randInt(0, arr.length)]!
}

