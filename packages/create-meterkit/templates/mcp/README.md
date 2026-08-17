# MeterKit paid MCP tool — experimental devnet surface

MCP currently uses stdio, not an HTTP URL. Its unpaid probe prints native x402
payment requirements and must not be reported as an HTTP 402 activation.

```bash
{{INSTALL_COMMAND}}
{{CHECK_COMMAND}}
```

Expected: JSON containing `accepts` with exact Solana devnet, test-USDC, amount
`10000` and your recipient. To run the stdio server afterward:

```bash
{{DEV_COMMAND}}
```

This experimental template keeps replay state only in memory. Do not use it for
paid deployment until a dedicated MCP verification contract and durable store
pass the full payment/replay lifecycle.

The HTTP-only `meterkit verify` and `meterkit pay` commands do not apply to this
stdio surface. Do not reinterpret `check:unpaid` as payment or settlement proof.

If it fails, inspect `.env`, rerun installation and treat upstream outages as
unknown. Reset by stopping the process and removing `node_modules`. Never commit
`.env`, signing material, payment headers or full proofs.
Run `{{DOCTOR_COMMAND}}` for non-mutating configuration and devnet diagnostics. For
unresolved failures, share only sanitized output at
https://github.com/JuanTorchia/meterkit/issues.
