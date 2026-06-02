export type EngramSession = {
  id: string
  project: string
  directory?: string
  started_at?: string
  ended_at?: string | null
  summary?: string | null
  status?: string
}

export type EngramObservation = {
  id: number
  session_id?: string | null
  type: string
  title: string
  content?: string
  project: string
  scope?: string
  topic_key?: string | null
  created_at?: string
  updated_at?: string
}

export type EngramProject = {
  project: string
  project_source?: string
  project_path?: string
  cwd?: string
  available_projects?: string[] | null
}

export type EngramClientOptions = {
  baseUrl?: string
  timeoutMs?: number
}

type RecentSessionsResponse = EngramSession[] | { sessions?: EngramSession[]; items?: EngramSession[]; result?: unknown }
type RecentObservationsResponse =
  | EngramObservation[]
  | { observations?: EngramObservation[]; items?: EngramObservation[]; result?: unknown }

const DEFAULT_BASE_URL = "http://127.0.0.1:7437"

export class EngramClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(options: EngramClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "")
    this.timeoutMs = options.timeoutMs ?? 2500
  }

  async health(): Promise<boolean> {
    try {
      await this.get<{ status?: string }>("/health")
      return true
    } catch {
      return false
    }
  }

  async currentProject(cwd?: string): Promise<EngramProject | null> {
    const query = cwd ? `?cwd=${encodeURIComponent(cwd)}` : ""
    try {
      const response = await this.get<EngramProject>(`/project/current${query}`)
      return response.project ? response : null
    } catch {
      return null
    }
  }

  async session(id: string): Promise<EngramSession | null> {
    if (!id) return null
    try {
      return await this.get<EngramSession>(`/sessions/${encodeURIComponent(id)}`)
    } catch {
      return null
    }
  }

  async recentSessions(project: string, limit = 5): Promise<EngramSession[]> {
    const response = await this.get<RecentSessionsResponse>(
      `/sessions/recent?project=${encodeURIComponent(project)}&limit=${limit}`,
    )

    if (Array.isArray(response)) return response
    if (Array.isArray(response.sessions)) return response.sessions
    if (Array.isArray(response.items)) return response.items
    if (Array.isArray(response.result)) return response.result as EngramSession[]
    return []
  }

  async recentObservations(project: string, limit = 100): Promise<EngramObservation[]> {
    const response = await this.get<RecentObservationsResponse>(
      `/observations/recent?project=${encodeURIComponent(project)}&limit=${limit}`,
    )

    if (Array.isArray(response)) return response
    if (Array.isArray(response.observations)) return response.observations
    if (Array.isArray(response.items)) return response.items
    if (Array.isArray(response.result)) return response.result as EngramObservation[]
    return []
  }

  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Engram HTTP ${response.status} for ${path}`)
      }

      return (await response.json()) as T
    } finally {
      clearTimeout(timeout)
    }
  }
}
