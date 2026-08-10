# Performance and resilience evidence

MeterKit publishes measurements to make review reproducible, not to imply a
production SLA. Run `pnpm benchmark` from an exact revision. Each JSON artifact
records the commit, runtime, platform, workload, timeout, local and external
p50/p95/p99, outcome accounting, protected executions, duplicates and explicit
limitations.

## Supported validation envelope

The initial internal envelope is:

| Scenario         | Concurrency | Requests | What it validates                            |
| ---------------- | ----------: | -------: | -------------------------------------------- |
| unpaid challenge |           1 |       20 | baseline policy cost and HTTP 402 accounting |
| policy           |          25 |      100 | ordinary concurrent policy evaluation        |
| policy           |         100 |      300 | the declared high local policy load          |
| paid retry       |          25 |      100 | unique protected-execution accounting        |

The 2026-08-10 run completed all four local workloads with zero duplicate
protected executions. Local policy p99 stayed below 0.25 ms on this development
machine. External latency is recorded as zero when `BENCHMARK_TARGET_URL` is not
set; that means “not measured”, not “instantaneous”. Supply a controlled devnet
target to measure HTTP/network/dependency time separately.

These numbers are internal, machine-specific, produced from a dirty development
tree and are not an SLA or an independent benchmark. Before a release claim,
rerun on its clean exact commit and retain the generated artifacts. Public RPC,
facilitator and devnet variability must remain visible rather than folded into
MeterKit-local latency.

## Failure semantics

Fixtures under `scripts/fixtures/resilience/` define RPC, facilitator,
PostgreSQL and rate-limit failures. RPC absence remains recoverable `unknown`;
an alternate RPC may finalize it later. Facilitator or persistence failure
fails closed before protected execution. Rate limiting returns HTTP 429 with
bounded retry guidance and never changes payment validity. Every resilience run
must retain zero duplicate protected executions.
