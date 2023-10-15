// this code is ass i wrote this in like 5 minutes lol

import { Readable } from "node:stream"
import path from "node:path"
import fastify from "fastify"
import fastifyStatic from "@fastify/static"

let files = []

// populate with frames
for (let i = 0; i < 598; i++) {
	files.push( Bun.file(path.join(__dirname,`/curlFrames/${(i+1).toString().padStart(3, "0")}.txt`)) )
}

const clearCode = "\033[2J\033[3J\033[H"

function mkStream() {
	let stream = new Readable({ read() {} })
	let frameNumber = 0;

	let intvl = setInterval(async () => {
		frameNumber += 1
		stream.push(clearCode)
		stream.push(Buffer.from(await files[frameNumber].arrayBuffer()))
		if (frameNumber >= 597) {
			clearInterval(intvl);
			stream.push(null)
		}
	},1000/30)

	return stream
}

const app = fastify()

/* funny term version */

app.register( fastifyStatic, {
	root: path.join(__dirname,"/www/assets"),
	prefix: "/assets/"
})

let idx = Bun.file(path.join(__dirname,"/www/index.html"))

app.get("/", async function(req, res) {
	if (req.headers["user-agent"].includes("curl")) {
		res.send(mkStream())
	} else {
		res.type("text/html").send(await idx.text())
	}
})

app.listen({ port:3000 })
