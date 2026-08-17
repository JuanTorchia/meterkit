CREATE TABLE IF NOT EXISTS meterkit_standalone_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meterkit_consumed_payments (
  network text NOT NULL,
  signature_hash text NOT NULL,
  signature_fingerprint text NOT NULL,
  product_id text NOT NULL,
  amount_atomic text NOT NULL,
  recipient text NOT NULL,
  accepted_at timestamptz NOT NULL,
  PRIMARY KEY (network, signature_hash),
  CHECK (char_length(signature_hash) = 64),
  CHECK (char_length(signature_fingerprint) <= 32),
  CHECK (char_length(product_id) <= 128),
  CHECK (char_length(amount_atomic) <= 64),
  CHECK (char_length(recipient) <= 128)
);

CREATE INDEX IF NOT EXISTS meterkit_consumed_payments_accepted_at_idx
  ON meterkit_consumed_payments (accepted_at DESC);
