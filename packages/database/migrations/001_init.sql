CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  owner_wallet text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  resource_url text NOT NULL,
  network text NOT NULL CHECK (network = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'),
  asset_mint text NOT NULL,
  pay_to text NOT NULL,
  price_atomic numeric(20, 0) NOT NULL CHECK (price_atomic > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id),
  payer text NOT NULL,
  pay_to text NOT NULL,
  mint text NOT NULL,
  amount_atomic numeric(20, 0) NOT NULL CHECK (amount_atomic > 0),
  network text NOT NULL,
  signature text NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'finalized', 'failed')),
  settled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (network, signature)
);

CREATE INDEX IF NOT EXISTS payments_product_settled_idx
  ON payments (product_id, settled_at DESC);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('confirmed', 'finalized', 'failed'));

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  request_hash text NOT NULL,
  response_code integer,
  response_body jsonb,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_allowances (
  address text PRIMARY KEY,
  owner_wallet text NOT NULL,
  delegate_wallet text NOT NULL,
  mint text NOT NULL,
  max_atomic numeric(20, 0) NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
