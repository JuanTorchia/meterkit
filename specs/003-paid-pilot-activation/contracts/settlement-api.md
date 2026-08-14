# Contract: Provider Settlements and Exports

All routes require the existing wallet-backed provider session. The server
derives the owner; callers cannot select another owner.

## List settlements

```text
GET /v1/settlements
  ?from=<RFC3339 inclusive>
  &to=<RFC3339 exclusive>
  &product=<owner-scoped slug>
  &status=<comma-separated allowlist>
  &limit=<1..200>
  &cursor=<opaque>
```

Response contains `schemaVersion`, `asOf`, normalized filters, records, exact
summary and optional next cursor. Each record includes receipt ID, product,
decision, settlement state, atomic amount string, asset, network, timestamps,
signature fingerprint and optional Explorer URL. Full payment proofs and
unnecessary payer information are excluded.

Errors: `401 wallet_session_required`, `422 invalid_filter`, `422 range_too_wide`
and `409 cursor_filter_mismatch`. Unknown or pending is returned literally.

## Export settlements

```text
GET /v1/settlements/export?format=json|csv&from=...&to=...&product=...&status=...
```

- Maximum 90-day interval and 10,000 records.
- JSON is the canonical `SettlementExport` envelope.
- CSV has a fixed documented header and `row_type` values `manifest`,
  `settlement`, `summary` so empty exports remain self-describing.
- Both formats arise from the same repeatable snapshot and exact totals.
- Amounts are integer strings in base units; timestamps are UTC RFC3339.
- CSV prefixes formula-dangerous text and correctly quotes comma, quote, CR/LF.
- Headers include private/no-store caching, `nosniff` and a server-generated
  attachment filename.
- Oversized results return `422 export_too_large` with narrower-range guidance.

## Security and state invariants

- Every query begins at authenticated owner and joins through immutable product
  UID; a product slug alone never establishes ownership.
- Cursor contents are authenticated/validated and bound to normalized filters.
- State transitions reject stale updates and cannot regress terminal finality.
- Records and summary share `updatedAt <= asOf`.
- Cross-tenant product, cursor and receipt probes reveal no provider data.
