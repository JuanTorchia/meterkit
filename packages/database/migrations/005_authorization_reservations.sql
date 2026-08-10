ALTER TABLE agent_allowances
  ADD COLUMN IF NOT EXISTS per_request_atomic numeric(20, 0),
  ADD COLUMN IF NOT EXISTS spent_atomic numeric(20, 0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved_atomic numeric(20, 0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS recipient_scope text,
  ADD COLUMN IF NOT EXISTS resource_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS observed_commitment text NOT NULL DEFAULT 'finalized',
  ADD COLUMN IF NOT EXISTS observed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS revocation_signature text;

UPDATE agent_allowances SET per_request_atomic=max_atomic
  WHERE per_request_atomic IS NULL;

ALTER TABLE agent_allowances
  ALTER COLUMN per_request_atomic SET NOT NULL;

ALTER TABLE agent_allowances DROP CONSTRAINT IF EXISTS agent_allowances_amounts_check;
ALTER TABLE agent_allowances ADD CONSTRAINT agent_allowances_amounts_check CHECK (
  max_atomic > 0 AND per_request_atomic > 0 AND per_request_atomic <= max_atomic AND
  spent_atomic >= 0 AND reserved_atomic >= 0 AND
  spent_atomic + reserved_atomic <= max_atomic
);

ALTER TABLE agent_allowances DROP CONSTRAINT IF EXISTS agent_allowances_status_check;
ALTER TABLE agent_allowances ADD CONSTRAINT agent_allowances_status_check CHECK (
  status IN ('pending', 'active', 'exhausted', 'expired', 'revocation_pending', 'revoked', 'unknown', 'failed')
);

ALTER TABLE agent_allowances DROP CONSTRAINT IF EXISTS agent_allowances_commitment_check;
ALTER TABLE agent_allowances ADD CONSTRAINT agent_allowances_commitment_check CHECK (
  observed_commitment IN ('processed','confirmed','finalized','unknown')
);

ALTER TABLE agent_allowances DROP CONSTRAINT IF EXISTS agent_allowances_scopes_size_check;
ALTER TABLE agent_allowances ADD CONSTRAINT agent_allowances_scopes_size_check CHECK (
  jsonb_typeof(resource_scopes)='array' AND octet_length(resource_scopes::text) <= 32768
);

CREATE TABLE IF NOT EXISTS allowance_spend_reservations (
  reservation_id uuid PRIMARY KEY,
  allowance_address text NOT NULL REFERENCES agent_allowances(address) ON DELETE CASCADE,
  payment_key text NOT NULL UNIQUE,
  amount_atomic numeric(20, 0) NOT NULL CHECK (amount_atomic > 0),
  status text NOT NULL CHECK (status IN ('reserved', 'consumed', 'released')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS allowance_reservations_expiry_idx
  ON allowance_spend_reservations (expires_at) WHERE status='reserved';
CREATE INDEX IF NOT EXISTS allowance_reservations_allowance_idx
  ON allowance_spend_reservations (allowance_address, created_at DESC);
