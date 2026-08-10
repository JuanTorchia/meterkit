# Contract: Pilot CLI

## Commands

```text
meterkit-pilot init [directory]
meterkit-pilot diagnose --config <path> [--out <path>]
meterkit-pilot verify --config <path> [--out <path>]
meterkit-pilot evidence --config <path> --receipt <path> --out <path>
```

- `init` creates a complete example config without overwriting existing files.
- `diagnose` performs no payment and checks runtime/configuration/challenge inputs.
- `verify` retains the current safe challenge-readiness behavior.
- `evidence` validates an externally produced sanitized receipt and replay result;
  it never accepts wallet secrets or performs signing.

Every command supports human-readable stderr, machine-readable JSON stdout, stable
exit codes, bounded network operations, and exclusive output creation. Evidence
states whether it proves readiness, settlement, or external activation.

## Exit codes

- `0`: requested checks passed;
- `1`: checks ran and at least one failed;
- `2`: invalid command or configuration;
- `3`: unsafe input or secret-like content detected;
- `4`: dependency unavailable and result unknown.
