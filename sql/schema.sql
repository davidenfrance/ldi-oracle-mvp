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
