# opencode-session-id

OpenCode TUI plugin that adds one command: copy the current OpenCode session ID to your clipboard.

## Command

Use `/opencode-copy-session-id` from OpenCode.

The command copies the active OpenCode session ID. If OpenCode has not selected a session yet, it shows a warning instead.

## Install from npm

Add the published package to your global OpenCode TUI config at `~/.config/opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "opencode-session-id"
  ]
}
```

Restart OpenCode after changing `tui.json`; TUI plugins are loaded at startup.

## Build

```bash
npm install
npm run build
```

## Local development config

When developing from a local checkout, build the package and point OpenCode to the generated file:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "file:///absolute/path/to/opencode-session-id/dist/index.js"
  ]
}
```
