import type { DiagnosticFinding } from "@usemeterkit/core";

const ACTIONS: Record<string, string> = {
  NODE_UNSUPPORTED:
    "Install Node.js 22 LTS or newer, then rerun meterkit doctor.",
  ENV_MISSING: "Create the generated .env (or .env.local) from .env.example.",
  RECIPIENT_INVALID:
    "Set MERCHANT_WALLET to a disposable Solana devnet public address.",
  DURABILITY_INVALID: "Set DURABILITY_MODE explicitly to memory or postgres.",
  DATABASE_URL_MISSING:
    "Set DATABASE_URL before starting with DURABILITY_MODE=postgres.",
  ENDPOINT_FAILED:
    "Start the generated service and rerun doctor with --url and --allow-localhost when appropriate.",
  RPC_UNAVAILABLE:
    "Retry the devnet RPC or select another trusted devnet endpoint; do not assume settlement failed.",
  RPC_WRONG_NETWORK:
    "Use a Solana devnet RPC endpoint and rerun doctor before paying.",
  TOKEN_ACCOUNT_MISSING:
    "Create/fund a disposable devnet test-USDC token account, then rerun doctor.",
  FACILITATOR_UNAVAILABLE:
    "Retry later or configure another trusted x402 facilitator; keep payment state unknown.",
  DATABASE_UNAVAILABLE:
    "Restore PostgreSQL connectivity and migrations; never fall back to memory for paid traffic.",
  DEPENDENCIES_MISSING:
    "Run the install command for the package manager selected by the initializer, then rerun doctor.",
  POLICY_MISMATCH:
    "Correct the generated recipient, mint, amount or network and restart before paying.",
  PAYER_ASSETS_MISSING:
    "Fund only the disposable devnet payer with test SOL and test-USDC, then rerun doctor.",
  PAYMENT_RESULT_MISSING:
    "Run the generated pay:test command with --json evidence, then pass its sanitized output to doctor.",
  SETTLEMENT_UNKNOWN:
    "Do not retry blindly; inspect the sanitized pay result and devnet RPC before deciding settlement state.",
  REPLAY_UNKNOWN:
    "Run pay with --replay and preserve only its sanitized JSON result.",
  SETTLEMENT_SOURCE_CONFLICT:
    "Treat settlement as unknown and retry bounded RPC confirmation; Explorer is supporting evidence, not authority.",
};

export function withRemediation(
  finding: Omit<DiagnosticFinding, "remediation">,
): DiagnosticFinding {
  const remediation = ACTIONS[finding.code];
  return remediation ? { ...finding, remediation } : finding;
}
