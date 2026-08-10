CREATE TABLE IF NOT EXISTS public_payment_receipts (
  receipt_id uuid PRIMARY KEY,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  product_id text NOT NULL,
  network text NOT NULL CHECK (network = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'),
  asset_mint text NOT NULL,
  amount_atomic numeric(20, 0) NOT NULL CHECK (amount_atomic > 0),
  recipient text NOT NULL,
  payer text,
  resource_url text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('accepted', 'rejected', 'unknown', 'failed')),
  settlement text NOT NULL CHECK (settlement IN ('not_started', 'pending', 'confirmed', 'finalized', 'unknown', 'failed')),
  signature_fingerprint text,
  explorer_url text,
  policy_decisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  reason_code text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (updated_at >= created_at),
  CHECK (octet_length(policy_decisions::text) <= 65536)
);

CREATE INDEX IF NOT EXISTS public_payment_receipts_product_updated_idx
  ON public_payment_receipts (product_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS public_payment_receipts_settlement_updated_idx
  ON public_payment_receipts (settlement, updated_at ASC);

CREATE TABLE IF NOT EXISTS pilot_activation_attempts (
  attempt_id uuid PRIMARY KEY,
  participant_alias text,
  consented_at timestamptz,
  assistance text NOT NULL CHECK (assistance IN ('none', 'docs_only', 'maintainer_guided')),
  outcome text NOT NULL CHECK (outcome IN ('active', 'abandoned', 'blocked', 'invalid')),
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  friction_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (octet_length(stages::text) <= 32768),
  CHECK (octet_length(friction_codes::text) <= 8192),
  CHECK (octet_length(evidence::text) <= 32768)
);

CREATE INDEX IF NOT EXISTS pilot_activation_attempts_outcome_updated_idx
  ON pilot_activation_attempts (outcome, updated_at DESC);
