/** @jsxImportSource @opentui/solid */
import { For, Show } from "solid-js"
import { createEngramSessionState, sessionDisplayName, shortenId } from "../session-state"

export type EngramSessionPanelProps = {
  sessionId?: string
  baseUrl?: string
  project?: string
  cwd?: string
}

export function EngramSessionPanel(props: EngramSessionPanelProps) {
  const state = createEngramSessionState({
    baseUrl: props.baseUrl,
    project: props.project,
    cwd: props.cwd,
    sessionId: props.sessionId,
  })

  const snapshot = state.snapshot

  return (
    <box flexDirection="column" gap={1} paddingTop={1} paddingBottom={1}>
      <box flexDirection="column">
        <text>Engram Session</text>
        <text fg={snapshot().connected ? "green" : "red"}>
          {snapshot().connected ? "● connected" : "● disconnected"}
        </text>
      </box>

      <Show when={snapshot().error}>
        <text fg="yellow">{snapshot().error}</text>
      </Show>

      <Show when={snapshot().connected}>
        <box flexDirection="column">
          <text>Project  {snapshot().project ?? "—"}</text>
          <text>Session  {sessionDisplayName(snapshot().currentSession, snapshot().memories)}</text>
          <text>ID       {snapshot().currentSession ? shortenId(snapshot().currentSession!.id) : "—"}</text>
          <text>Memory   {snapshot().memories.length} saved</text>
        </box>

        <box flexDirection="column" paddingTop={1}>
          <text>Latest</text>
          <Show when={snapshot().memories.length > 0} fallback={<text fg="gray">No memories for this session</text>}>
            <For each={snapshot().memories.slice(0, 3)}>
              {(memory) => <text>• {memory.title}</text>}
            </For>
          </Show>
        </box>
      </Show>
    </box>
  )
}
