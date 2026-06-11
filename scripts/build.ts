await Bun.$`rm -rf dist`

const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  target: "bun",
  outdir: "./dist",
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

export {}
