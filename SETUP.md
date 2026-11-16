# Remote setup (fresh machine)

These commands install the DSH host, the TUI bundle, and the friedikitty
packages from GitHub. `dsh` and `dsh-tui` come from npm; the MCP manager and
the search guard come from GitHub tags.

## Prerequisites

- **Node.js >= 24.9.0** (`dsh@0.2.2-rc.1` engine requirement). Example with
  nvm-windows: `nvm install 24.13.0 && nvm use 24.13.0`.
- **pnpm** on `PATH`: `npm install -g pnpm@10`.
- Model credentials for DSH: either run the TUI once and finish onboarding, or
  put the credentials in `~/.dsh/.credentials.yaml` (same layout as an existing
  machine).

## 1. Install dsh and the TUI

```powershell
npm install -g @deepseek-ai/dsh@0.2.2-rc.1
npm install -g @deepseek-harness-tui/dsh-tui@0.20.1
```

## 2. Create the profile and add the bundles

Use the profile name `dsh-tui` if you want the `dsh-tui` launcher to find it.
The order is base → TUI → manager → guard; `dsh plugin` initializes the profile
with `@deepseek-ai/dsh-base` on first use.

```powershell
dsh plugin --profile dsh-tui add @deepseek-harness-tui/dsh-tui@0.20.1
dsh plugin --profile dsh-tui add github:friedikitty/dsh-project-mcp-manager#v0.13.0-keepraw
dsh plugin --profile dsh-tui add github:friedikitty/dsh-search-guard#v0.1.0
```

If the profile already exists, run only the last two commands.

## 3. Pin your main checkout's raw MCP server names

Append this to `~/.dsh/profiles/dsh-tui/cordis.patch.yml`, replacing the path
with the project root that contains your `.git` directory:

```yaml
- id: mcp-project
  config:
    keepRawNamesFor:
      - /absolute/path/to/main/checkout
```

Without this block the manager keeps its default naming: any project row whose
`serverName` collides with another known workspace gets the `p<hash>_` prefix.

## 4. Start and verify

```powershell
dsh-tui
# or, for any profile name:
dsh --profile dsh-tui

# inspect the composed tree
dsh --profile dsh-tui --dump-config | Select-String 'mcp-project|keepRawNamesFor|search-guard'
```

`--dump-config` may print `tool-ralph` / `tool-subagent-list-agents` “entry not
found” warnings from the TUI bundle; they are harmless and do not prevent boot.

## Optional: Orca-managed Claude hooks

If `~/.dsh/cordis.patch.yml` inserts `@deepseek-ai/dsh-hooks-claude-code` (Orca
writes this block), also install the hook and its protocol package:

```powershell
dsh plugin --profile dsh-tui add @deepseek-ai/dsh-hooks-claude-code@0.2.2-rc.1
dsh plugin --profile dsh-tui add @deepseek-ai/dsh-hook-protocol@0.2.2-rc.1
```

The hook imports the host's `@deepseek-ai` peer packages. If it still reports
`Cannot find package '@deepseek-ai/...'`, link the host packages into the
profile's `node_modules/@deepseek-ai` (Windows junction example):

```powershell
$host = 'D:\NodeJS\Global\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai'
$profile = "$HOME\.dsh\profiles\dsh-tui\node_modules\@deepseek-ai"
foreach ($name in 'cordis','dsh-llm','dsh-agent','dsh-tools','dsh-session','dsh-subagent','dsh-working-directory','dsh-shell') {
  New-Item -ItemType Junction -Path (Join-Path $profile $name) -Target (Join-Path $host $name) -ErrorAction SilentlyContinue
}
```

On a machine without Orca, skip this section; the profile works without the
hook.

## What comes from where

| Package | Source |
|---|---|
| `@deepseek-ai/dsh` | npm, `0.2.2-rc.1` |
| `@deepseek-harness-tui/dsh-tui` | npm, `0.20.1` |
| `dsh-project-mcp-manager` | GitHub `friedikitty/dsh-project-mcp-manager#v0.13.0-keepraw` |
| `dsh-project-mcp-ui` | npm `0.13.0` (installed as the manager's dependency) |
| `dsh-search-guard` | GitHub `friedikitty/dsh-search-guard#v0.1.0` |
| Orca hook packages | npm, `0.2.2-rc.1` (optional) |
