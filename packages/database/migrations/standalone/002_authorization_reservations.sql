CREATE TABLE IF NOT EXISTS meterkit_authorization_reservations (
  network text NOT NULL,
  proof_fingerprint text NOT NULL,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (network, proof_fingerprint),
  CHECK (char_length(proof_fingerprint) = 64)
);
