/** @jsxImportSource @opentui/solid */
import { For, Show } from "solid-js"
import { createEngramSessionState, sessionDisplayName } from "./session-state"

export type EngramRouteProps = {
  sessionId?: string
  baseUrl?: string
  project?: string
  cwd?: string
}

export function EngramSessionRoute(props: EngramRouteProps) {
  const state = createEngramSessionState(props)
  const snapshot = state.snapshot

  return (
    <box flexDirection="column" padding={1} gap={1}>
      <text>Engram Session</text>
      <text>{snapshot().connected ? "Connected" : "Disconnected"}</text>
      <text>Session: {sessionDisplayName(snapshot().currentSession, snapshot().memories)}</text>
      <text>ID: {snapshot().currentSession?.id ?? "—"}</text>
      <text>Project: {snapshot().project ?? "—"}</text>
      <text>Started: {snapshot().currentSession?.started_at ?? "—"}</text>
      <text>Ended: {snapshot().currentSession?.ended_at ?? "active"}</text>
      <text>Memories: {snapshot().memories.length}</text>
      <Show when={snapshot().error}>
        <text fg="yellow">{snapshot().error}</text>
      </Show>
    </box>
  )
}

export function EngramMemoriesRoute(props: EngramRouteProps) {
  const state = createEngramSessionState(props)
  const snapshot = state.snapshot

  return (
    <box flexDirection="column" padding={1} gap={1}>
      <text>Engram Memories</text>
      <text>{sessionDisplayName(snapshot().currentSession, snapshot().memories)}</text>
      <Show when={snapshot().memories.length > 0} fallback={<text fg="gray">No memories found for this session</text>}>
        <For each={snapshot().memories}>
          {(memory) => <text>[{memory.type}] {memory.title}</text>}
        </For>
      </Show>
    </box>
  )
}
