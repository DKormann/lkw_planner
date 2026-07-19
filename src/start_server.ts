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
    const url = new URL(req.url)
    let path = url.pathname.split("/").filter(x=>x.length>0)
    if (path[0] == "version") return new Response(String(devVersion), {headers: isolationHeaders})
    if (path.at(-1) == "real-roadmap.json") {
      const roadmap = Bun.file("./data/real-roadmap/germany-car-dealers-latest.json")
      if (!await roadmap.exists()) return new Response("Real roadmap cache has not been built", { status: 404, headers: isolationHeaders })
      return new Response(await roadmap.bytes(), {headers: {...isolationHeaders, "Content-Type": "application/json"}})
    }
    if (path.at(-1) == "route-geometry") {
      try {
        const from = Number(url.searchParams.get("from"))
        const to = Number(url.searchParams.get("to"))
        if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) {
          return new Response("Invalid dealer pair", { status: 400, headers: isolationHeaders })
        }
        const roadmap = await Bun.file("./data/real-roadmap/germany-car-dealers-latest.json").json() as {
          sites: { lon: number, lat: number }[]
        }
        if (!roadmap.sites[from] || !roadmap.sites[to]) {
          return new Response("Unknown dealer", { status: 404, headers: isolationHeaders })
        }
        const a = Math.min(from, to), b = Math.max(from, to)
        const cachePath = `./data/real-roadmap/routes/${a}-${b}.json`
        const cached = Bun.file(cachePath)
        let coordinates: number[][]
        if (await cached.exists()) {
          coordinates = (await cached.json() as { coordinates: number[][] }).coordinates
        } else {
          const key = process.env["ORS_API_KEY"]
          if (!key) return new Response("ORS_API_KEY is not configured", { status: 503, headers: isolationHeaders })
          const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-hgv/geojson", {
            method: "POST",
            headers: { authorization: key, "content-type": "application/json" },
            body: JSON.stringify({
              coordinates: [roadmap.sites[a]!, roadmap.sites[b]!].map(site => [site.lon, site.lat]),
              instructions: false,
            }),
          })
          if (!response.ok) return new Response("ORS could not route this dealer pair", { status: 502, headers: isolationHeaders })
          const result = await response.json() as { features?: { geometry?: { coordinates?: number[][] } }[] }
          coordinates = result.features?.[0]?.geometry?.coordinates ?? []
          if (coordinates.length < 2) return new Response("ORS returned no route geometry", { status: 502, headers: isolationHeaders })
          await mkdir("./data/real-roadmap/routes", { recursive: true })
          await writeFile(cachePath, JSON.stringify({ coordinates }))
        }
        const requestedCoordinates = from === a ? coordinates : [...coordinates].reverse()
        return Response.json({ coordinates: requestedCoordinates }, { headers: isolationHeaders })
      } catch (error) {
        console.error("route geometry failed", error)
        return new Response("Route geometry failed", { status: 500, headers: isolationHeaders })
      }
    }
    if (path.length == 0) return new Response(await Bun.file("./index.html").bytes(), {headers: {...isolationHeaders, "Content-Type": "text/html"}})
    return new Response(await Bun.file("./index.js").bytes(), {headers: {...isolationHeaders, "Content-Type": "application/javascript"}})
  }

})


console.log(`Server running at http://localhost:${port}`)
