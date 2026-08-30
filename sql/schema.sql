CREATE TABLE IF NOT EXISTS cover_records (
  record_id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  recorded_controller_name TEXT NOT NULL,
  onboarding_complete BOOLEAN NOT NULL DEFAULT true,
  cover_status TEXT NOT NULL,
  cover_purchasable BOOLEAN NOT NULL DEFAULT true,
  limit_band_usd INTEGER,
  policy_reference TEXT,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  key_id TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cover_records_device_id ON cover_records (device_id);
CREATE INDEX IF NOT EXISTS cover_records_agent_id ON cover_records (agent_id);

CREATE TABLE IF NOT EXISTS mvp_binds (
  mvp_bind_id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  agent_id TEXT,
  purchaser_lde_wallet_key_id TEXT NOT NULL,
  band_id TEXT NOT NULL,
  limit_usd INTEGER NOT NULL,
  premium_usd TEXT NOT NULL,
  asset TEXT NOT NULL,
  rail TEXT NOT NULL,
  not_genius_usd BOOLEAN NOT NULL DEFAULT true,
  insured_event TEXT NOT NULL,
  cover_starts_at TIMESTAMPTZ NOT NULL,
  cover_ends_at TIMESTAMPTZ NOT NULL,
  claims_until TIMESTAMPTZ NOT NULL,
  menu_id TEXT,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mvp_binds_device_id ON mvp_binds (device_id);
