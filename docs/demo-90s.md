# Automated demo — under 90 seconds

Generate the captioned video from the public devnet deployment:

```bash
pnpm demo:record
```

Output: `artifacts/meterkit-demo-90s.mp4`. The current verified render is 86.28
seconds, H.264, 1280×720, without audio.

## Storyboard

- MeterKit value proposition and non-custodial positioning.
- Three-line Node.js middleware integration.
- Live unpaid request returning HTTP 402.
- Exact devnet, USDC mint, amount and recipient policy.
- Agent validates and pays locally; protected JSON is returned.
- Recorded replay result: HTTP 402 and no second protected execution.
- Public dashboard with finalized receipts and Explorer links.
- Real transaction opened in Solana Explorer with `Finalized` confirmation.
- Spending caps, expiration and wallet-controlled revocation.
- Closing: open source, x402, subscriptions, MCP, no custody and no token.

## Evidence policy

The recorder fetches a fresh unpaid challenge and the current finalized public
receipt index. It does not hold a wallet key or make a new payment. Replay status
comes from the documented synthetic campaign because reproducing it in every
recording would require another paid request and temporarily retaining a payment
proof.

Captions state what is live and what is recorded. Synthetic agents are never
presented as external users. Never switch the recorder or demo deployment to
mainnet.
