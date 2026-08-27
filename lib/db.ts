import { neon } from "@neondatabase/serverless";
import type { CoverRecord } from "./types";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function ensureSchema(): Promise<void> {
  const db = sql();
  await db`
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
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS cover_records_device_id ON cover_records (device_id)`;
  await db`CREATE INDEX IF NOT EXISTS cover_records_agent_id ON cover_records (agent_id)`;
}

function rowToRecord(row: Record<string, unknown>): CoverRecord {
  return {
    record_id: String(row.record_id),
    device_id: String(row.device_id),
    agent_id: String(row.agent_id),
    recorded_controller_name: String(row.recorded_controller_name),
    onboarding_complete: Boolean(row.onboarding_complete),
    cover_status: row.cover_status as CoverRecord["cover_status"],
    cover_purchasable: Boolean(row.cover_purchasable),
    limit_band_usd: row.limit_band_usd == null ? null : Number(row.limit_band_usd),
    policy_reference: row.policy_reference ? String(row.policy_reference) : null,
    issued_at: new Date(String(row.issued_at)).toISOString(),
    expires_at: new Date(String(row.expires_at)).toISOString(),
    status: row.status as CoverRecord["status"],
    key_id: String(row.key_id),
    signature: String(row.signature),
  };
}

export async function lookupCover(filters: {
  device_id?: string;
  agent_id?: string;
}): Promise<CoverRecord | null> {
  const db = sql();
  const now = new Date().toISOString();
  const device = filters.device_id ?? null;
  const agent = filters.agent_id ?? null;
  const rows = await db`
    SELECT * FROM cover_records
    WHERE status = 'active'
      AND expires_at > ${now}::timestamptz
      AND (
        (${device}::text IS NOT NULL AND device_id = ${device})
        OR (${agent}::text IS NOT NULL AND agent_id = ${agent})
      )
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  if (!rows.length) return null;
  return rowToRecord(rows[0] as Record<string, unknown>);
}

export async function upsertRecord(record: CoverRecord): Promise<CoverRecord> {
  const db = sql();
  const rows = await db`
    INSERT INTO cover_records (
      record_id, device_id, agent_id, recorded_controller_name,
      onboarding_complete, cover_status, cover_purchasable, limit_band_usd,
      policy_reference, issued_at, expires_at, status, key_id, signature, updated_at
    ) VALUES (
      ${record.record_id}, ${record.device_id}, ${record.agent_id},
      ${record.recorded_controller_name}, ${record.onboarding_complete},
      ${record.cover_status}, ${record.cover_purchasable},
      ${record.limit_band_usd ?? null}, ${record.policy_reference ?? null},
      ${record.issued_at}::timestamptz, ${record.expires_at}::timestamptz,
      ${record.status}, ${record.key_id}, ${record.signature}, now()
    )
    ON CONFLICT (record_id) DO UPDATE SET
      device_id = EXCLUDED.device_id,
      agent_id = EXCLUDED.agent_id,
      recorded_controller_name = EXCLUDED.recorded_controller_name,
      onboarding_complete = EXCLUDED.onboarding_complete,
      cover_status = EXCLUDED.cover_status,
      cover_purchasable = EXCLUDED.cover_purchasable,
      limit_band_usd = EXCLUDED.limit_band_usd,
      policy_reference = EXCLUDED.policy_reference,
      issued_at = EXCLUDED.issued_at,
      expires_at = EXCLUDED.expires_at,
      status = EXCLUDED.status,
      key_id = EXCLUDED.key_id,
      signature = EXCLUDED.signature,
      updated_at = now()
    RETURNING *
  `;
  return rowToRecord(rows[0] as Record<string, unknown>);
}

export async function revokeRecord(record_id: string): Promise<boolean> {
  const db = sql();
  const rows = await db`
    UPDATE cover_records
    SET status = 'revoked', updated_at = now()
    WHERE record_id = ${record_id}
    RETURNING record_id
  `;
  return rows.length > 0;
}

export async function getRecordKeyId(record_id: string): Promise<string | null> {
  const db = sql();
  const rows = await db`
    SELECT key_id FROM cover_records WHERE record_id = ${record_id} LIMIT 1
  `;
  if (!rows.length) return null;
  return String((rows[0] as Record<string, unknown>).key_id);
}
