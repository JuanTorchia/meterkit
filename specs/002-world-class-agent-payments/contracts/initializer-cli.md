# Contract: MeterKit Project Initializer

## Command surface

```text
create-meterkit <directory>
  --surface <express|next-route|hono|mcp>
  --package-manager <pnpm|npm|yarn|bun>
  --dry-run
  --json
  --yes
```

The phase MAY narrow package-manager support based on clean-environment evidence,
but unsupported choices must fail before writes with a stable diagnostic.

## Behavioral contract

- Default network is Solana devnet; no mainnet shortcut is generated.
- The CLI never asks for, generates, reads or writes a private key or seed.
- Recipient and RPC values are explicit placeholders or environment-variable
  names, never embedded secrets.
- `--dry-run --json` emits an `InitializerPlan` and performs no writes.
- Non-empty targets fail unless every existing path is explicitly recognized as
  safe and unchanged; there is no broad force-overwrite option.
- Every generated surface contains install, diagnostic, unpaid challenge and
  full paid-journey commands.
- Exit codes are stable: `0` success, `2` invalid input, `3` unsafe filesystem,
  `4` unsupported environment, `5` generation verification failure.

## Adversarial cases

Reject absolute template paths, traversal, symlink escapes, device paths,
control characters, unsupported network values, secret-like CLI values,
dependency-version injection and concurrent writes to the same target.
