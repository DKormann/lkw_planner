import {stat, readdir, writeFile} from "fs/promises"

const argv = process.argv.slice(2)
let devVersion = 0

async function lastChange(path:string): Promise<number>{
  try{
    return Math.max(...(await Promise.all((await readdir(path)).map(f=>lastChange(path+"/"+f)))))
  }catch{
    return stat(path).then(s=>s.mtimeMs).catch(e=>0)
  }
}

async function devLoop(){
  let lastm = 0
  console.log("Starting server in dev mode")

  while(true){
    let m = await lastChange("./src")
    if (m > lastm){
      lastm = m
      console.log("Rebuilding...")
      let res = Bun.spawnSync({
        cmd: ["bun", "build", "src/view/main.ts", "--sourcemap=inline", "--outfile", "index.js"],
        stdout: "pipe",
        stderr: "pipe"
      })
      if (res.exitCode != 0){
        await writeFile("./index.js", `
          let errorMsg = ${JSON.stringify(res.stderr?.toString() || "Unknown error")}
          document.body.innerHTML = "<pre style='color:red; white-space: pre-wrap;'>" + errorMsg + "</pre>"
        `)
        console.error("Build failed:", res.stderr?.toString() || "Unknown error")
      }
      devVersion++
    }
    await new Promise(r=> setTimeout(r, 200))
  }
}


if (argv.includes("dev")) devLoop()

const port = 3030


Bun.serve({
  port,
  async fetch(req){
    let path = req.url.split("/").filter(x=>x.length>0).slice(2)
    if (path[0] == "version") return new Response(String(devVersion))
    if (path[0] == "index.js") return new Response(await Bun.file("./index.js").bytes(), {headers: {"Content-Type": "application/javascript"}})
    return new Response(await Bun.file("./index.html").bytes(), {headers: {"Content-Type": "text/html"}})
  }

})


console.log(`Server running at http://localhost:${port}`)
