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
