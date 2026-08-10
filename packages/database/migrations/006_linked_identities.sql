CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_wallets (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet text NOT NULL UNIQUE,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, wallet)
);

CREATE TABLE IF NOT EXISTS linked_identities (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('github')),
  provider_subject text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_subject),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS oauth_link_states (
  state_hash text PRIMARY KEY CHECK (state_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('github')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS oauth_link_states_expiry_idx
  ON oauth_link_states (expires_at);
