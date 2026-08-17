# Contract: `create-meterkit`

## Interactive invocation

`npm create meterkit@<verified-version>` in a TTY prompts for:

1. directory, default `meterkit-app`;
2. surface: Express, Next Route, Hono or MCP;
3. package manager, detected from `npm_config_user_agent`;
4. public disposable devnet recipient;
5. dependency installation, default yes.

It never asks for or generates signing material.

## Non-interactive invocation

```text
npm create meterkit@<version> -- <directory> \
  --surface <express|next|hono|mcp> \
  --package-manager <npm|pnpm> \
  --recipient <public-key> \
  [--install|--no-install] [--yes] [--json]
```

Non-TTY execution never waits for prompts. Missing required values exit 2 with
the exact correction. `--yes` selects documented defaults and installs; it does
not bypass directory or recipient validation. `--dry-run` emits the plan without
writing.

## Filesystem behavior

- Refuse a non-empty destination before writing.
- Write scaffold files atomically enough that validation errors leave no project.
- If dependency installation fails, preserve the generated project and report
  the exact manager-specific recovery command.
- Generated `.env` or `.env.local` contains public configuration only and is
  permission-restricted where supported.
- Generated commands, lockfile behavior and README match the selected manager.
- Express, Hono and MCP explicitly load their documented env file; Next uses its
  documented native env behavior.

## Result

Human output shows directory, active surface, durability warning and the next
commands. JSON output is schema-versioned and contains state
`ready | written_install_failed`, paths and commands, but no credentials.

Exit codes: 0 success, 1 generation/install failure, 2 invalid input, 3
unsupported environment.
