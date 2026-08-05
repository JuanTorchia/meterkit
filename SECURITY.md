# Security policy

MeterKit processes payment authorization data and must be treated as
security-sensitive software. The public deployment and repository are currently
**devnet only**.

## Supported versions

| Version                                  | Supported |
| ---------------------------------------- | --------- |
| `main` and the latest tagged pre-release | Yes       |
| Older commits and unmaintained forks     | No        |

No release is approved for mainnet unless its release notes explicitly say so.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

Use GitHub's **Report a vulnerability** flow in the Security tab:

<https://github.com/JuanTorchia/meterkit/security/advisories/new>

Include:

- affected commit or version;
- component and configuration;
- impact and required preconditions;
- minimal reproduction using local validator or devnet test assets;
- suggested remediation, if known.

Never include a private key, seed phrase, bearer token, full payment proof,
production endpoint secret or personal information. Do not test against systems
or wallets you do not control.

We aim to acknowledge a complete report within three business days, provide an
initial assessment within seven days and coordinate disclosure after a fix is
available. These are targets, not a paid bug-bounty promise.

## Scope

In scope:

- payment validation and replay protection;
- wallet authentication and tenant isolation;
- resource-scope enforcement;
- Solana finality and receipt reconciliation;
- allowance and subscription safety;
- SSRF, CORS, rate limiting and secret exposure;
- official MeterKit containers and deployment configuration.

Out of scope:

- phishing or social engineering;
- denial-of-service traffic against the public demo;
- vulnerabilities exclusively in unsupported forks;
- faucet, wallet, RPC or Solana network behavior outside MeterKit's control;
- reports requiring mainnet funds or access to third-party systems.

The detailed threat model and residual risks live in
[docs/security.md](docs/security.md).
