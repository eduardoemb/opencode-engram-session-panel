import { spawn } from "node:child_process"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule, TuiRouteCurrent } from "@opencode-ai/plugin/tui"

type SessionSelectEvent = {
  properties?: {
    sessionID?: unknown
  }
}

export const id = "gentle.opencode-session-id"

export const tui: TuiPlugin = async (api) => {
  let lastSelectedSessionId: string | undefined

  const disposeSessionSelect = registerSessionSelectFallback(api, (sessionId) => {
    lastSelectedSessionId = sessionId
  })

  const disposeKeymap = api.keymap.registerLayer({
    commands: [
      {
        name: "opencode.session.copy-id",
        title: "Copy OpenCode Session ID",
        category: "Plugin",
        namespace: "palette",
        slashName: "opencode-copy-session-id",
        run() {
          void copyCurrentSessionId(api, lastSelectedSessionId)
        },
      },
    ],
  })

  api.lifecycle.onDispose(() => {
    disposeKeymap()
    disposeSessionSelect()
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin

async function copyCurrentSessionId(api: TuiPluginApi, fallback?: string) {
  const sessionId = currentSessionId(api.route.current, fallback)

  if (!sessionId) {
    api.ui.toast({ variant: "warning", message: "No OpenCode session ID is available yet" })
    return
  }

  try {
    await copyToClipboard(sessionId)
    api.ui.toast({ variant: "success", message: "OpenCode session ID copied" })
  } catch {
    api.ui.toast({ variant: "info", message: `OpenCode session ID: ${sessionId}` })
  }
}

function currentSessionId(route: TuiRouteCurrent, fallback?: string) {
  if (route.name === "session" && typeof route.params?.sessionID === "string") return route.params.sessionID
  return fallback
}

function registerSessionSelectFallback(api: TuiPluginApi, onSessionSelect: (sessionId: string) => void) {
  const eventApi = api.event as {
    on(type: "tui.session.select", handler: (event: SessionSelectEvent) => void): () => void
  }

  return eventApi.on("tui.session.select", (event) => {
    const sessionId = event.properties?.sessionID
    if (typeof sessionId === "string" && sessionId) onSessionSelect(sessionId)
  })
}

function copyToClipboard(value: string) {
  const command = clipboardCommand()
  if (!command) return Promise.reject(new Error("No clipboard command available"))

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command[0], command.slice(1))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Clipboard command exited with ${code}`))
    })
    child.stdin.end(value)
  })
}

function clipboardCommand() {
  if (process.platform === "darwin") return ["pbcopy"]
  if (process.platform === "win32") return ["clip"]
  return ["wl-copy"]
}
