import {stat, readdir, writeFile, mkdir} from "fs/promises"

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

let port = 3030
argv.forEach((arg, i)=>{
  if (arg == "--port" && argv[i+1]) port = Number(argv[i+1])
})

const isolationHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
}



Bun.serve({
  port,
  async fetch(req){
    let path = req.url.split("/").filter(x=>x.length>0).slice(2)
    if (path[0] == "report" && req.method == "POST") {
      const report = await req.json()
      await mkdir("./reports", {recursive: true})
      const stamp = new Date().toISOString().replaceAll(":", "-")
      const solver = String((report as any).solver ?? "solver").replaceAll(/[^a-z0-9_-]/gi, "_")
      const file = `${stamp}-${solver}-${crypto.randomUUID().slice(0, 8)}.json`
      await writeFile(`./reports/${file}`, JSON.stringify(report, null, 2))
      return Response.json({file}, {headers: isolationHeaders})
    }
    if (path[0] == "version") return new Response(String(devVersion), {headers: isolationHeaders})
    if (path.length == 0) return new Response(await Bun.file("./index.html").bytes(), {headers: {...isolationHeaders, "Content-Type": "text/html"}})
    return new Response(await Bun.file("./index.js").bytes(), {headers: {...isolationHeaders, "Content-Type": "application/javascript"}})
  }

})


console.log(`Server running at http://localhost:${port}`)
