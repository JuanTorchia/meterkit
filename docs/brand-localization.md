# Brand and localization strategy

Reviewed on 2026-08-04. Domain availability and prices are snapshots, not reservations.

## Language priority

MeterKit targets developers, so English remains the default and the canonical language for
documentation, grants, SDK errors, and protocol contracts. The product UI supports:

1. **English (`en`)** — global Solana, x402, MCP, grant, and integration audience.
2. **Latin American Spanish (`es-419`)** — initial founder-led distribution in Argentina and
   Spanish-speaking Latin America.
3. **Brazilian Portuguese (`pt-BR`)** — the next regional market with its own developer and
   fintech ecosystem.

The UI persists an explicit user choice and updates the document language. Payment amounts keep
their exact atomic representation internally; only their display separator and dates are localized.
Protocol payloads, addresses, signatures, code, USDC, x402, and Solana terminology are never
translated.

Do not add more languages until traffic or pilot evidence justifies them. The next likely candidates
are French and Japanese, but supporting them now would create translation and QA cost without a
validated acquisition channel.

## Current name risk

“MeterKit” describes usage metering well, but it is not an empty brand:

- `meterkit.com` is an existing energy-metering product.
- “MeterKit” is also the name of an iOS measurement application.
- `meterkit.dev` and `meterkit.xyz` were unavailable when checked.

This is not a trademark clearance. Before charging mainnet customers, run a proper trademark and
company-name search in the intended jurisdictions. Until then, treat MeterKit as the working name.

## Domain shortlist

Availability checked through Vercel Domains on 2026-08-04:

| Domain            | Status    | First-year price | Recommendation                                                     |
| ----------------- | --------- | ---------------: | ------------------------------------------------------------------ |
| `getmeterkit.com` | Available |        USD 11.25 | Best low-cost bridge while the name is provisional                 |
| `usemeterkit.com` | Available |        USD 11.25 | Good alternative, slightly less natural verbally                   |
| `meterkit.app`    | Available |         USD 9.99 | Best short product URL if the brand is cleared                     |
| `meterkit.io`     | Available |        USD 37.99 | Familiar to developers, but expensive and does not solve name risk |
| `meterkit.tools`  | Available |        USD 17.99 | Descriptive for APIs/MCP, weaker for hosted infrastructure         |
| `meterkit.tech`   | Available |         USD 7.99 | Cheap, but less credible than `.com` or `.app`                     |

## Decision

Do not buy or migrate automatically. The recommended sequence is:

1. Keep `meterkit.juanchi.dev` during devnet validation and the current grant review.
2. If the grant or first external pilot needs an independent URL immediately, buy
   `getmeterkit.com` and redirect `www` to the application.
3. Before public mainnet launch, decide whether to retain or rename MeterKit after a basic legal
   clearance and five customer interviews.
4. Use stable subdomains: `app.<domain>`, `api.<domain>`, and `docs.<domain>`. Keep redirects from
   the old `juanchi.dev` URLs for receipts and demos.

DNS migration must not change signed x402 resource identifiers silently. Existing product resources
should remain valid or be versioned and migrated explicitly.
