/** @jsxImportSource @opentui/solid */
import { spawn } from "node:child_process"
import type { JSX } from "@opentui/solid"
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { EngramSessionPanel } from "./components/EngramSessionPanel"
import { EngramMemoriesRoute, EngramSessionRoute } from "./routes"
import { loadEngramSessionSnapshot } from "./session-state"

type PluginOptions = {
  baseUrl?: string
  project?: string
  cwd?: string
}

const tui: TuiPlugin = async (api, rawOptions) => {
  const options = (rawOptions ?? {}) as PluginOptions
  const cwd = options.cwd ?? safeCwd()
  let latestSessionId: string | undefined

  api.slots.register({
    order: 210,
    slots: {
      sidebar_content(_ctx, props) {
        latestSessionId = props.session_id
        return (
          <EngramSessionPanel
            sessionId={props.session_id}
            baseUrl={options.baseUrl}
            project={options.project}
            cwd={cwd}
          />
        )
      },
    },
  })

  const navigateSession = () => api.route.navigate("engram-session", { session_id: currentSessionId(api.route.current, latestSessionId) })
  const navigateMemories = () => api.route.navigate("engram-memories", { session_id: currentSessionId(api.route.current, latestSessionId) })
  const copySessionId = async () => {
    const sessionId = currentSessionId(api.route.current, latestSessionId)
    const snapshot = await loadEngramSessionSnapshot({
      baseUrl: options.baseUrl,
      project: options.project,
      cwd,
      sessionId,
    })
    const id = snapshot.currentSession?.id ?? sessionId

    if (!id) {
      api.ui.toast({ variant: "warning", message: "No Engram session ID available yet" })
      return
    }

    try {
      await copyToClipboard(id)
      api.ui.toast({ variant: "success", message: "Engram session ID copied" })
    } catch {
      api.ui.toast({ variant: "info", message: `Engram session ID: ${id}` })
    }
  }

  const disposeKeymap = api.keymap.registerLayer({
    commands: [
      {
        name: "engram.session.open",
        title: "Engram Session",
        category: "Plugin",
        namespace: "palette",
        slashName: "engram-session",
        run() {
          navigateSession()
        },
      },
      {
        name: "engram.memories.open",
        title: "Engram Memories",
        category: "Plugin",
        namespace: "palette",
        slashName: "engram-memories",
        run() {
          navigateMemories()
        },
      },
      {
        name: "engram.session.copy-id",
        title: "Copy Engram Session ID",
        category: "Plugin",
        namespace: "palette",
        slashName: "engram-copy-session-id",
        run() {
          void copySessionId()
        },
      },
    ],
  })

  const disposeRoutes = api.route.register([
    {
      name: "engram-session",
      render: ({ params }) => (
        <EngramSessionRoute
          sessionId={routeSessionId(params, latestSessionId)}
          baseUrl={options.baseUrl}
          project={options.project}
          cwd={cwd}
        />
      ),
    },
    {
      name: "engram-memories",
      render: ({ params }) => (
        <EngramMemoriesRoute
          sessionId={routeSessionId(params, latestSessionId)}
          baseUrl={options.baseUrl}
          project={options.project}
          cwd={cwd}
        />
      ),
    },
  ])

  api.lifecycle.onDispose(() => {
    disposeKeymap()
    disposeRoutes()
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "gentle.engram-session-panel",
  tui,
}

export default plugin

function safeCwd() {
  try {
    return process.cwd()
  } catch {
    return undefined
  }
}

function routeSessionId(params: Record<string, unknown> | undefined, fallback?: string) {
  return typeof params?.session_id === "string" ? params.session_id : fallback
}

function currentSessionId(route: { name: string; params?: Record<string, unknown> }, fallback?: string) {
  if (route.name === "session" && typeof route.params?.sessionID === "string") return route.params.sessionID
  return fallback
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
