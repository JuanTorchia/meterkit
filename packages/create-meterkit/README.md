# create-meterkit

Public devnet-beta initializer for MeterKit 0.3.0. It creates Express, Next.js,
Hono or experimental MCP projects without cloning the monorepo.

Interactive:

```bash
npm create meterkit@0.3.0
```

Reproducible non-interactive Express path:

```bash
npm create meterkit@0.3.0 -- meterkit-app --surface express --package-manager npm --recipient <DEVNET_PUBLIC_WALLET> --yes
cd meterkit-app
npm run dev
```

In a second terminal, run `npm run check:unpaid`. The endpoint must return and
decode an x402 v2 HTTP 402 challenge. Only a public recipient address is stored;
the initializer never asks for a seed phrase or private key.

Node 22 is supported. npm and pnpm are supported package managers. Express,
Next Route and Hono are supported HTTP surfaces; MCP is experimental. Generated
projects use an in-memory replay store for the first-402 demo and print a
non-durable warning. Do not serve paid requests with memory storage.
