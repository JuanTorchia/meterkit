# MeterKit paid MCP tool

Run `pnpm install && cp .env.example .env && pnpm check:unpaid` to inspect the HTTP 402-compatible payment requirement before wiring the tool transport. Use only test assets on devnet for a paid invocation and repeat the receipt to verify replay rejection. Never expose a private key or seed phrase to the server.
