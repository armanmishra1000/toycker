const { spawn } = require("child_process")

// Ensure Medusa binds to the environment-provided host/port (Railway injects PORT)
const port = process.env.PORT ?? "9000"
const host = process.env.HOST ?? "0.0.0.0"
const extraArgs = process.argv.slice(2)

const child = spawn(
  "medusa",
  ["start", "--host", host, "--port", port, ...extraArgs],
  {
    stdio: "inherit",
    shell: true,
    env: process.env,
  }
)

child.on("close", (code) => {
  process.exit(code ?? 0)
})

child.on("error", (error) => {
  console.error("Failed to start Medusa server:", error)
  process.exit(1)
})
