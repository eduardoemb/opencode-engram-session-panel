import type { EngramClient } from "./engram"

export async function resolveProject(client: EngramClient, configuredProject?: string, cwd?: string): Promise<string | null> {
  if (configuredProject?.trim()) return configuredProject.trim()

  const detected = await client.currentProject(cwd)
  return detected?.project ?? null
}
