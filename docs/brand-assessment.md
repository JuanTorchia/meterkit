# MeterKit brand assessment

**Assessed:** 2026-08-10 UTC
**Decision:** retain `MeterKit` for the current release; reserve a future
`UseMeterKit`-style identity only after legal and availability review. Do not
purchase, rename or migrate from this document alone.

This is a product-confusion screen, not a trademark clearance or legal opinion.
Scores run from 0 (poor) to 5 (strong). Unknown availability scores at most 2;
it is never treated as available.

| Candidate   | Domain | Package | Repository | Search | Social | Trademark screen | Total / 30 | Decision           |
| ----------- | -----: | ------: | ---------: | -----: | -----: | ---------------: | ---------: | ------------------ |
| MeterKit    |      0 |       5 |          5 |      2 |      1 |                2 |         15 | Retain short-term  |
| UseMeterKit |      2 |       5 |          4 |      4 |      1 |                3 |         19 | Reserve for review |
| AgentMeter  |      2 |       0 |          2 |      3 |      1 |                2 |         10 | Reject             |
| Payrail     |      2 |       2 |          2 |      1 |      1 |                1 |          9 | Reject             |

## Findings

### MeterKit

- `meterkit.com` is an active utility-cost product, creating direct search and
  domain confusion even though its market differs from agent payments.
- `meterkit.dev` returned an existing RDAP record during this review; it is not
  treated as available.
- The unscoped npm name `meterkit` was not returned by the registry, but the
  project already has stronger continuity in the owned `@usemeterkit` scope.
- `@usemeterkit/core@0.1.0` and `@usemeterkit/sdk@0.1.0` are public immutable
  releases, and `JuanTorchia/meterkit` is the established repository. Renaming
  immediately would discard the only distribution continuity currently proved.
- General web results mix meters, utilities and software kits. The name explains
  metering but does not uniquely communicate Solana, x402 or agent budgets.

Decision: retain for the next compatible release and lead publicly with the
descriptor “bounded USDC payments for APIs and agents on Solana.” Do not invest
in the bare `meterkit.com` identity.

### UseMeterKit

`@usemeterkit` already anchors the package identity and has better search
specificity. Domain and social availability were not established reliably in
this review, so no availability claim or purchase recommendation is made.
`UseMeterKit` can remain a namespace/CTA without changing the product name.

Decision: reserve conceptually, then perform registrar, social-handle and
professional trademark checks before spending money or announcing a migration.

### Rejected candidates

`agentmeter` is already registered as an npm package. `Payrail` is generic in a
crowded payments category and has greater naming and trademark ambiguity. Neither
offers enough verified availability or continuity to justify migration.

## Migration threshold

A rename becomes rational only if at least one of these is evidenced:

1. developers repeatedly confuse MeterKit with the utility product;
2. a professional clearance identifies material legal risk;
3. a clearly superior name is simultaneously available across domain, package,
   repository and primary social identity;
4. three external pilots report that the current name materially impairs trust
   or comprehension.

Any migration must preserve `@usemeterkit/*` compatibility through deprecation,
redirect repository/docs URLs, publish a mapping and avoid republishing the
immutable 0.1.0 history.

## Evidence and limitations

- npm registry: [`@usemeterkit/core`](https://www.npmjs.com/package/@usemeterkit/core),
  [`@usemeterkit/sdk`](https://www.npmjs.com/package/@usemeterkit/sdk).
- Repository: [`JuanTorchia/meterkit`](https://github.com/JuanTorchia/meterkit).
- Conflicting product: [`meterkit.com`](https://meterkit.com/).
- Domain checks used public RDAP responses on 2026-08-10. A response is not a
  purchase right, and inconclusive responses remain unknown.
- npm name checks used current registry metadata on 2026-08-10.
- No reliable social-handle inventory or comprehensive national/international
  trademark search was completed. Professional clearance remains required.
