import solidPlugin from "@opentui/solid/bun-plugin"

await Bun.$`rm -rf dist`

const result = await Bun.build({
  entrypoints: ["./src/index.tsx"],
  target: "bun",
  outdir: "./dist",
  plugins: [solidPlugin],
  external: ["solid-js", "@opentui/solid"],
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}
