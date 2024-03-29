import type { BunFile, Serve } from "bun"

const framerate = 12
const multiplier = 2.5
const clearCode = "\033[2J\033[3J\033[H"
const files: string[] = await Promise.all(
	Array.from(
		{ length: 603 },
		(_, i) => `${__dirname}/curlFrames/${(i + 1).toString().padStart(3, "0")}.txt`
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
				if (frameNumber >= 603 || abort.aborted) {
					controller.close()
					return clearInterval(interval)
				}
				controller.enqueue(clearCode)
				controller.enqueue(files[Math.floor(frameNumber)])
				frameNumber += multiplier
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
		if (path === "/") return new Response(Bun.file(`${__dirname}/www/index.html`))
		return new Response(Bun.file(`${__dirname}/www${path}`))
	},
	port: process.env.PORT ?? 1026,
} satisfies Serve
