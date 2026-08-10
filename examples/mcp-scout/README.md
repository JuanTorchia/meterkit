# Solana Project Scout MCP

A useful MCP tool that produces a dated, source-linked factual report about a
public Solana GitHub project. One preview per installation is free; full reports
cost 0.02 test USDC through official x402 MCP on Solana devnet.

The preview and payment replay guards are durable across process restarts. Paid
settlement is independently revalidated through Solana RPC, then a canonical
sanitized MeterKit receipt is stored with an Explorer link. GitHub access is
bounded by timeout/response limits; `GITHUB_TOKEN` is optional and server-only.

```bash
MERCHANT_WALLET=<devnet-provider-wallet> pnpm dev
```

See the root README for the disposable devnet paying client. Reports always show
sources and consultation time and never provide investment advice.
