# Contract: Public Documentation

## Information architecture

1. Start: install, choose a surface, first challenge, first payment.
2. Concepts: x402 lifecycle, direct settlement, receipts, finality and replay.
3. Agent budgets: authorization, limits, inspection and revocation.
4. Integrations: Express, Next route, Hono and MCP maturity/version matrix.
5. Operations: diagnostics, errors, outages, observability and rollback.
6. Reference: public exports, schemas, CLI and compatibility.
7. Trust: security, provenance, benchmarks, governance and limitations.

## Navigation and language

- English is canonical for package/API identifiers; Spanish preserves the same
  technical and security meaning.
- A developer reaches the recommended integration, compatibility matrix or
  troubleshooting category in at most three navigation actions.
- Search is keyboard accessible, locale aware and returns maintained pages ahead
  of deprecated content.
- Every page declares applicable product versions and last review date.
- Broken internal links, orphaned maintained pages and claim-key mismatches fail
  CI.

## Content states

Loading, no-results, unavailable-index, outdated-version and not-found states
must provide an accessible recovery action. Reduced motion, mobile layout,
heading hierarchy, focus visibility and contrast are release gates.
