# Compatibility matrix

Generated contract: `pnpm compatibility:verify`.

| Surface               | Supported path                                                    | Contract                                              |
| --------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Express 5             | `protect()`                                                       | Canonical and recommended                             |
| Next.js 16 App Router | official `@x402/next` plus `createMeterKitResourceServer()`       | Maintained example                                    |
| MCP SDK               | official `@x402/mcp` plus MeterKit settlement validator           | Maintained Scout example                              |
| Hono 4                | official `@x402/hono` candidate plus canonical MeterKit contracts | Experimental; not maintained until full parity passes |

The current matrix is devnet-only, Node 22+, x402 2.21.0 and Solana Kit 5.5.1.
Compatibility means challenge and settlement contracts are maintained; it does
not imply mainnet readiness. CI regenerates the JSON report and fails when a
maintained example no longer builds.

x402 2.21.0 was adopted as a coordinated set on 2026-08-10 only after Express,
Next, MCP and Hono challenge, settlement, receipt and replay fixtures passed
together. Package availability alone remains insufficient for future upgrades.
