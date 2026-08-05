# Automatic deployment

Pushes to `main` that change `apps/web/**`, `packages/subscriptions/**`,
`Dockerfile.web`, or `pnpm-lock.yaml` trigger the MeterKit web deployment in
Coolify through a signed GitHub webhook. The webhook uses Coolify's manual
GitHub endpoint because this public repository is cloned without credentials.

The gateway has an independent deployment with its own watch paths, so web-only
changes do not rebuild the API.
