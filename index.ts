import type { BunFile, Serve } from "bun"

const framerate = 12
const clearCode = "\033[2J\033[3J\033[H"
const files: string[] = await Promise.all(
	Array.from(
		{ length: 603 },
		(_, i) => `./curlFrames/${(i + 1).toString().padStart(3, "0")}.txt`
	)
		.map((path) => Bun.file(path))
		.map((file) => file.text())
)

function stream(abort: AbortSignal) {
	let interval: ReturnType<typeof setInterval>
	let frameNumber = 0
	return new ReadableStream({
		start(controller) {
			interval = setInterval(() => {
				if (frameNumber >= 603 || abort.aborted) return clearInterval(interval)
				console.log("Frame", frameNumber)
				controller.enqueue(clearCode)
				controller.enqueue(files[Math.floor(frameNumber)])
				frameNumber++
			}, 1000 / framerate)
		},
		cancel: () => clearInterval(interval),
	})
}

export default {
	fetch(request) {
		if (request.headers.get("user-agent")?.includes("curl"))
			return new Response(stream(request.signal))
		const path = new URL(request.url).pathname
		if (path === "/") return new Response(Bun.file("./www/index.html"))
		return new Response(Bun.file("./www" + path))
	},
	port: process.env.PORT ?? 1026,
} satisfies Serve
