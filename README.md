# opencode-engram-session-panel

OpenCode TUI plugin that shows the active or most recent Engram session in the sidebar, plus the memories saved for that session.

## MVP behavior

- Reads Engram local HTTP API at `http://127.0.0.1:7437`.
- Detects the project through `GET /project/current` unless `project` is configured.
- Uses the OpenCode TUI `sidebar_content` slot.
- Tries to match the OpenCode `session_id` to an Engram session ID.
- Falls back to the latest active Engram session for the same project.
- Shows the latest 3 memories for that session.
- Adds slash commands:
  - `/engram-session`
  - `/engram-memories`
  - `/engram-copy-session-id`

The plugin is read-only. It does not create sessions or write memories.

## Requirements

Run Engram locally before using the panel:

```bash
engram serve
```

Recommended: install the official Engram OpenCode integration too, so session creation, prompt capture, and compaction recovery are handled by Engram itself:

```bash
engram setup opencode
```

## Build

```bash
npm install
npm run build
```

## OpenCode TUI config

Add the plugin to OpenCode's TUI plugin list after building or publishing it.
For local development, use `~/.config/opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "file:///absolute/path/to/opencode-engram-session-panel/dist/index.js"
  ]
}
```

Restart OpenCode after changing `tui.json`; TUI plugins are loaded at startup.

Optional configuration:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    [
      "file:///absolute/path/to/opencode-engram-session-panel/dist/index.js",
      {
        "baseUrl": "http://127.0.0.1:7437",
        "project": "opencode-plugin"
      }
    ]
  ]
}
```
