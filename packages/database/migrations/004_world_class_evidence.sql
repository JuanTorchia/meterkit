CREATE TABLE IF NOT EXISTS release_manifests (
  version text PRIMARY KEY,
  source_commit text NOT NULL CHECK (source_commit ~ '^[0-9a-f]{40}$'),
  manifest jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (octet_length(manifest::text) <= 1048576)
);

CREATE INDEX IF NOT EXISTS release_manifests_source_commit_idx
  ON release_manifests (source_commit, created_at DESC);

CREATE TABLE IF NOT EXISTS benchmark_runs (
  run_id uuid PRIMARY KEY,
  source_commit text NOT NULL CHECK (source_commit ~ '^[0-9a-f]{40}$'),
  scenario text NOT NULL CHECK (scenario IN ('unpaid', 'policy', 'paid-retry', 'replay', 'dependency-outage')),
  evidence jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (octet_length(evidence::text) <= 1048576)
);

CREATE INDEX IF NOT EXISTS benchmark_runs_commit_created_idx
  ON benchmark_runs (source_commit, created_at DESC);

CREATE TABLE IF NOT EXISTS hosted_metadata_requests (
  request_id uuid PRIMARY KEY,
  owner_wallet text NOT NULL,
  request_kind text NOT NULL CHECK (request_kind IN ('export', 'delete')),
  status text NOT NULL CHECK (status IN ('queued', 'completed', 'failed')) DEFAULT 'queued',
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (expires_at > requested_at)
);

CREATE INDEX IF NOT EXISTS hosted_metadata_requests_owner_requested_idx
  ON hosted_metadata_requests (owner_wallet, requested_at DESC);

CREATE INDEX IF NOT EXISTS hosted_metadata_requests_expiry_idx
  ON hosted_metadata_requests (expires_at ASC);
