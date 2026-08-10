# Operations and recovery

Target service levels for the hosted devnet preview are 99% monthly availability
and a p95 unpaid challenge latency below 500 ms, excluding upstream outages.
These are targets, not historical claims.

Dependency semantics:

- RPC timeout/null: settlement remains `unknown`; retry with bounded backoff and
  the configured alternate RPC. Never rewrite it to failed without onchain proof.
- Onchain transaction error or validated transfer mismatch: `failed`.
- facilitator unavailable: no protected handler execution; return a sanitized
  dependency error.
- receipt conflict: reject replay atomically.
- event sink failure: isolate it from settlement; alert from sanitized metrics.

Health checks verify process, database and configured devnet. They do not claim
Solana finality. Deploy only an exact commit whose required CI is green. Rollback
by selecting the previous known-good image/commit in Coolify, applying no reverse
migration unless its runbook explicitly proves safety, and rerunning public
health/challenge/replay smoke tests.

## Load and dependency validation

`pnpm benchmark` exercises the documented 1/25/100-concurrency local envelope
and a 25-concurrent paid-retry accounting workload. Set
`BENCHMARK_TARGET_URL` only to a controlled devnet endpoint. The report separates
MeterKit-local latency from external HTTP latency and refuses duplicate
protected-execution evidence. See [performance.md](performance.md) for measured
results and limitations.

Hosted boundaries return standard `RateLimit` and `Retry-After` headers. HTTP
429 bodies contain a stable `rate_limit_exceeded` code and retry guidance.
`X-Request-Id` accepts only a bounded safe character set; malformed or
secret-like values are replaced with a random correlation identifier.

Finality reconciliation records only dependency class, outcome, attempt count,
fallback use and duration. RPC URLs and credentials are not evidence fields.
If every RPC is unavailable, the receipt remains recoverable and the poller
retries later; only a real onchain error becomes `failed`.
