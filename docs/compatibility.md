# Compatibility matrix

Generated contract: `pnpm compatibility:verify`.

| Surface | Supported path | Contract |
|---|---|---|
| Express 5 | `protect()` | Canonical and recommended |
| Next.js 16 App Router | official `@x402/next` plus `createMeterKitResourceServer()` | Maintained example |
| MCP SDK | official `@x402/mcp` plus MeterKit settlement validator | Maintained Scout example |

The current matrix is devnet-only, Node 22+, x402 2.20.0 and Solana Kit 5.5.1.
Compatibility means challenge and settlement contracts are maintained; it does
not imply mainnet readiness. CI regenerates the JSON report and fails when a
maintained example no longer builds.
