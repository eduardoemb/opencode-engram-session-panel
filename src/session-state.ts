import { createSignal, onCleanup } from "solid-js"
import { EngramClient, type EngramObservation, type EngramSession } from "./engram"
import { resolveProject } from "./project"

export type SessionStateOptions = {
  baseUrl?: string
  project?: string
  cwd?: string
  sessionId?: string
  refreshMs?: number
}

export type SessionSnapshot = {
  connected: boolean
  loading: boolean
  error: string | null
  project: string | null
  currentSession: EngramSession | null
  memories: EngramObservation[]
  refreshedAt: Date | null
}

const initialSnapshot: SessionSnapshot = {
  connected: false,
  loading: true,
  error: null,
  project: null,
  currentSession: null,
  memories: [],
  refreshedAt: null,
}

export function createEngramSessionState(options: SessionStateOptions) {
  const client = new EngramClient({ baseUrl: options.baseUrl })
  const refreshMs = options.refreshMs ?? 15_000
  const [snapshot, setSnapshot] = createSignal<SessionSnapshot>(initialSnapshot)

  async function refresh() {
    setSnapshot((current) => ({ ...current, loading: true }))

    try {
      setSnapshot(await loadEngramSessionSnapshot(options))
    } catch (error) {
      setSnapshot((current) => ({
        ...current,
        connected: false,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown Engram error",
        refreshedAt: new Date(),
      }))
    }
  }

  void refresh()
  const timer = setInterval(() => void refresh(), refreshMs)
  onCleanup(() => clearInterval(timer))

  return { snapshot, refresh }
}

export async function loadEngramSessionSnapshot(options: SessionStateOptions): Promise<SessionSnapshot> {
  const client = new EngramClient({ baseUrl: options.baseUrl })
  const connected = await client.health()

  if (!connected) {
    return {
      connected: false,
      loading: false,
      error: "Engram is not reachable",
      project: options.project ?? null,
      currentSession: null,
      memories: [],
      refreshedAt: new Date(),
    }
  }

  const project = await resolveProject(client, options.project, options.cwd)
  if (!project) {
    return {
      connected: true,
      loading: false,
      error: "Project could not be resolved",
      project: null,
      currentSession: null,
      memories: [],
      refreshedAt: new Date(),
    }
  }

  const currentSession = await resolveCurrentSession(client, project, options.sessionId)
  const observations = await client.recentObservations(project, 100)
  const memories = currentSession ? observations.filter((item) => item.session_id === currentSession.id) : []

  return {
    connected: true,
    loading: false,
    error: null,
    project,
    currentSession,
    memories,
    refreshedAt: new Date(),
  }
}

async function resolveCurrentSession(client: EngramClient, project: string, opencodeSessionId?: string) {
  const exact = opencodeSessionId ? await client.session(opencodeSessionId) : null
  if (exact?.project === project) return exact

  const recent = await client.recentSessions(project, 5)
  return recent.find((session) => !session.ended_at) ?? recent[0] ?? null
}

export function sessionDisplayName(session: EngramSession | null, memories: EngramObservation[]) {
  if (!session) return "No session"

  const summary = session.summary?.trim()
  if (summary && summary.length <= 60) return summary

  const sessionSummary = memories.find((item) => item.type === "summary" || item.type === "session_summary")
  if (sessionSummary?.title) return sessionSummary.title

  const firstMemory = memories[0]
  if (firstMemory?.title) return firstMemory.title

  return shortenId(session.id)
}

export function shortenId(id: string, maxLength = 28) {
  if (id.length <= maxLength) return id
  return `${id.slice(0, maxLength - 1)}…`
}
