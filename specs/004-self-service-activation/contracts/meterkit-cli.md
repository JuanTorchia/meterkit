# Contract: `meterkit` CLI

All commands support `--help`, `--version` and schema-versioned `--json` output.
Human output is concise; machine output never includes private keys, full proofs,
bearer credentials or database URLs. Exit codes are 0 pass/success, 1 check
failed, 2 invalid input/configuration, 3 environment/network unavailable, and 4
payment refused or failed.

## `meterkit check <url>`

Sends an unpaid request, requires a decodable x402 challenge and displays the
network, mint, atomic amount, recipient and resource. A valid challenge exits 0;
an ordinary success response does not count as a check pass.

## `meterkit doctor [--project <path>] [--url <url>]`

Checks Node version, installed/configured project, public recipient, RPC devnet
identity, endpoint, challenge policy, facilitator reachability, recipient token
account/readiness and active durability mode. Findings use only
`passed|failed|unavailable|unknown`, have stable codes and remediation, and never
fund wallets, create accounts or mutate configuration.

## `meterkit verify <url>`

Requires expected recipient, maximum atomic amount, network and mint from flags
or a versioned config. It applies the existing SSRF protections; localhost
requires explicit opt-in. It correlates challenge, protected response,
settlement and replay result without signing.

## `meterkit pay <url> --keypair <path>`

Requires expected recipient, maximum amount, network and mint plus bounded
per-request/session spending. The keypair is read locally and its filesystem
permissions validated where supported. Interactive mode displays exact terms and
requires confirmation; CI needs `--yes`. `--replay` submits the same proof a
second time within the process and asserts rejection with no second protected
response or accepted settlement.

No private key or payment header is accepted in argv/env/output. If a later
workflow needs cross-process replay, `--save-session <path>` must be explicit,
write mode 0600 where supported, and pair with an explicit deletion command.
