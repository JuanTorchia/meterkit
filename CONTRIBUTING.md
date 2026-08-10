# Contributing to MeterKit

Thank you for helping make non-custodial payments for APIs and AI agents easier
to use on Solana.

MeterKit is currently **devnet only**. Do not use mainnet funds, paste wallet
secrets into issues, or commit `.env` files or keypairs.

## Before you start

- Read the [architecture](docs/architecture.md) and
  [security model](docs/security.md).
- Search existing issues and discussions before opening a new one.
- For a substantial change, open a proposal issue before writing code.
- Security vulnerabilities must follow [SECURITY.md](SECURITY.md), not a public
  issue.

Issues labelled [`good first issue`](https://github.com/JuanTorchia/meterkit/labels/good%20first%20issue)
are deliberately bounded for new contributors.

## Local setup

Requirements: Node.js 22+, pnpm 11+, Docker and Git.

```bash
git clone https://github.com/JuanTorchia/meterkit.git
cd meterkit
corepack enable
pnpm install --frozen-lockfile
docker compose up -d
cp .env.example .env
```

Keep `SOLANA_NETWORK=devnet`. Set only public test addresses unless a command
explicitly requires a disposable local devnet signer.

Run the standard checks:

```bash
pnpm lint
pnpm typecheck
DATABASE_TEST_URL=postgresql://meterkit:meterkit@localhost:5432/meterkit pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
```

## Making a change

1. Fork the repository and create a focused branch.
2. Add or update tests for behavior changes.
3. Update documentation when public behavior, configuration or security
   assumptions change.
4. Run the standard checks.
5. Open a pull request using the repository template.

Keep pull requests small enough to review. Do not combine refactors, dependency
updates and product behavior in one pull request unless they are inseparable.

## Engineering expectations

- TypeScript remains strict; avoid `any` unless a boundary requires it and the
  reason is documented.
- Validate network, mint, amount, recipient and resource scope at trust
  boundaries.
- Treat payment proofs, challenges and idempotency keys as replay-sensitive.
- Preserve direct client-to-provider settlement.
- Never add custody, hidden fees or server-side storage of user private keys.
- Use environment variables for secrets and redact tokens, signatures and
  personal data from logs.
- Pin GitHub Actions by full commit SHA.
- New runtime dependencies require a documented reason and license review.

## Commit and pull request style

Use a Conventional Commits-style pull request title. The squash merge copies
this title into `main`:

```text
fix(sdk): reject encoded resource path escapes
docs: document external pilot evidence
deps: patch vulnerable transitive dependency
```

Allowed types are `feat`, `fix`, `docs`, `chore`, `ci`, `deps`, `build`,
`refactor`, `perf`, `test` and `revert`. A breaking change may add `!` before the
colon. CI rejects titles outside this format.

The pull request description must explain the problem, approach, verification,
security impact and any compatibility change. UI changes require screenshots.
Solana behavior changes require reproducible devnet or local-validator evidence.

## Review and merging

`main` is protected. CI, CodeQL, dependency review and the pull request policy
must pass, and conversations must be resolved. While MeterKit has one maintainer,
an independent approval is recommended but not required. Maintainers squash
merge, so the pull request title becomes part of the permanent history.

Maintainers may close changes that expand scope without a demonstrated user
need, weaken non-custodial guarantees, introduce financial promotion, or cannot
be safely reproduced.

## Recognition

Accepted code, documentation, design, testing and issue-triage contributions are
credited through Git history and release notes. See [GOVERNANCE.md](GOVERNANCE.md)
for how project decisions and maintainer responsibilities work.
