ALTER TABLE public_payment_receipts ADD COLUMN IF NOT EXISTS product_uid uuid;

UPDATE public_payment_receipts receipt
SET product_uid = product.uid
FROM products product
WHERE receipt.product_uid IS NULL
  AND receipt.product_id = product.id
  AND NOT EXISTS (
    SELECT 1 FROM products duplicate
    WHERE duplicate.id = receipt.product_id AND duplicate.uid <> product.uid
  );

ALTER TABLE public_payment_receipts
  DROP CONSTRAINT IF EXISTS public_payment_receipts_product_uid_fkey;
ALTER TABLE public_payment_receipts
  ADD CONSTRAINT public_payment_receipts_product_uid_fkey
  FOREIGN KEY (product_uid) REFERENCES products(uid) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS public_payment_receipts_product_uid_updated_idx
  ON public_payment_receipts (product_uid, updated_at DESC, receipt_id DESC);

CREATE TABLE IF NOT EXISTS pilot_engagements (
  engagement_id uuid PRIMARY KEY,
  owner_wallet text NOT NULL,
  product_uid uuid REFERENCES products(uid) ON DELETE SET NULL,
  schema_version integer NOT NULL CHECK (schema_version = 2),
  participant_class text NOT NULL CHECK (participant_class IN
    ('internal_maintainer','synthetic','external_independent','external_compensated','external_other')),
  offer_version text NOT NULL,
  disclosed_price jsonb,
  surface text NOT NULL CHECK (surface IN ('express','next-route','hono','mcp')),
  source text NOT NULL,
  assistance_mode text NOT NULL CHECK (assistance_mode IN ('none','docs_only','maintainer_guided')),
  operational_outcome text NOT NULL CHECK (operational_outcome IN
    ('active','blocked','abandoned','withdrawn','invalid','completed')),
  started_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (updated_at >= created_at),
  CHECK (disclosed_price IS NULL OR octet_length(disclosed_price::text) <= 4096)
);

CREATE INDEX IF NOT EXISTS pilot_engagements_owner_updated_idx
  ON pilot_engagements (owner_wallet, updated_at DESC);

CREATE TABLE IF NOT EXISTS pilot_activation_events (
  event_id uuid PRIMARY KEY,
  engagement_id uuid NOT NULL REFERENCES pilot_engagements(engagement_id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN
    ('install_complete','server_started','challenge_received','policy_verified','payment_submitted',
     'settlement_finalized','protected_response','replay_rejected','completion_reviewed')),
  outcome text NOT NULL CHECK (outcome IN ('passed','failed','unknown')),
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  evidence_reference text,
  intervention_id uuid,
  UNIQUE (engagement_id, stage, occurred_at)
);

CREATE INDEX IF NOT EXISTS pilot_activation_events_engagement_idx
  ON pilot_activation_events (engagement_id, occurred_at ASC);

CREATE TABLE IF NOT EXISTS pilot_support_interventions (
  intervention_id uuid PRIMARY KEY,
  engagement_id uuid NOT NULL REFERENCES pilot_engagements(engagement_id) ON DELETE CASCADE,
  stage text NOT NULL,
  kind text NOT NULL,
  reason_code text NOT NULL,
  actor_class text NOT NULL,
  began_at timestamptz NOT NULL,
  ended_at timestamptz,
  CHECK (ended_at IS NULL OR ended_at >= began_at)
);

ALTER TABLE pilot_activation_events
  DROP CONSTRAINT IF EXISTS pilot_activation_events_intervention_id_fkey;
ALTER TABLE pilot_activation_events
  ADD CONSTRAINT pilot_activation_events_intervention_id_fkey
  FOREIGN KEY (intervention_id) REFERENCES pilot_support_interventions(intervention_id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS pilot_consents (
  consent_id uuid PRIMARY KEY,
  engagement_id uuid NOT NULL REFERENCES pilot_engagements(engagement_id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN
    ('technical_participation','private_evidence_retention','day7_followup','aggregate_reporting',
     'public_attribution','testimonial_quote','case_study')),
  status text NOT NULL CHECK (status IN ('granted','denied','withdrawn')),
  terms_version text NOT NULL,
  captured_at timestamptz NOT NULL,
  withdrawn_at timestamptz,
  source_reference text,
  CHECK ((status = 'withdrawn') = (withdrawn_at IS NOT NULL)),
  UNIQUE (engagement_id, scope)
);

CREATE TABLE IF NOT EXISTS pilot_retention_observations (
  observation_id uuid PRIMARY KEY,
  engagement_id uuid NOT NULL REFERENCES pilot_engagements(engagement_id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  observed_at timestamptz,
  outcome text NOT NULL CHECK (outcome IN ('retained','removed','unknown','ineligible')),
  evidence_type text CHECK (evidence_type IN ('participant_response','verifiable_valid_use')),
  valid_payment_count integer CHECK (valid_payment_count IS NULL OR valid_payment_count >= 0),
  CHECK (outcome <> 'retained' OR (observed_at IS NOT NULL AND observed_at >= due_at))
);

CREATE TABLE IF NOT EXISTS pilot_willingness_to_pay (
  response_id uuid PRIMARY KEY,
  engagement_id uuid NOT NULL REFERENCES pilot_engagements(engagement_id) ON DELETE CASCADE,
  asked_at timestamptz NOT NULL,
  responded_at timestamptz,
  response text NOT NULL CHECK (response IN
    ('yes_at_stated_price','yes_different_price','maybe','no','declined','unknown')),
  offer_version text NOT NULL,
  amount text NOT NULL CHECK (amount ~ '^[0-9]+(?:\.[0-9]{1,6})?$'),
  currency text NOT NULL,
  unit text NOT NULL,
  reason_code text
);

CREATE TABLE IF NOT EXISTS commercial_payments (
  payment_id uuid PRIMARY KEY,
  engagement_id uuid NOT NULL REFERENCES pilot_engagements(engagement_id) ON DELETE RESTRICT,
  currency text NOT NULL,
  gross_amount numeric(20,6) NOT NULL CHECK (gross_amount >= 0),
  refunded_amount numeric(20,6) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  net_amount numeric(20,6) NOT NULL CHECK (net_amount = gross_amount - refunded_amount),
  status text NOT NULL CHECK (status IN
    ('pending','received_verified','partially_refunded','refunded','chargeback')),
  received_at timestamptz,
  private_evidence_reference text NOT NULL
);

CREATE TABLE IF NOT EXISTS funding_awards (
  award_id uuid PRIMARY KEY,
  provider text NOT NULL,
  source_category text NOT NULL CHECK (source_category = 'grant'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_tranches (
  tranche_id uuid PRIMARY KEY,
  award_id uuid NOT NULL REFERENCES funding_awards(award_id) ON DELETE CASCADE,
  amount numeric(20,6) NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  state text NOT NULL CHECK (state IN
    ('not_due','eligible','submitted','approved','payment_pending','received_verified','rejected')),
  private_evidence_reference text,
  public_safe_status text NOT NULL
);
