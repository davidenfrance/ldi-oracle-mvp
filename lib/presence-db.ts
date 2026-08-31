import { neon } from "@neondatabase/serverless";
import type { PresenceRow } from "./presence";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function ensurePresenceSchema(): Promise<void> {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS device_presence (
      presence_id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      state TEXT NOT NULL,
      human_eta_ms INTEGER,
      eta_expires_at TIMESTAMPTZ,
      present_until TIMESTAMPTZ,
      issued_at TIMESTAMPTZ NOT NULL,
      signature TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS device_presence_device_id ON device_presence (device_id, created_at DESC)`;
}

function rowToPresence(row: Record<string, unknown>): PresenceRow {
  return {
    presence_id: String(row.presence_id),
    device_id: String(row.device_id),
    state: row.state as PresenceRow["state"],
    human_eta_ms: row.human_eta_ms == null ? null : Number(row.human_eta_ms),
    eta_expires_at: row.eta_expires_at ? new Date(String(row.eta_expires_at)).toISOString() : null,
    present_until: row.present_until ? new Date(String(row.present_until)).toISOString() : null,
    issued_at: new Date(String(row.issued_at)).toISOString(),
    signature: String(row.signature),
  };
}

export async function latestPresence(device_id: string): Promise<PresenceRow | null> {
  const db = sql();
  const rows = await db`
    SELECT * FROM device_presence
    WHERE device_id = ${device_id}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!rows.length) return null;
  return rowToPresence(rows[0] as Record<string, unknown>);
}

export async function insertPresence(row: PresenceRow): Promise<PresenceRow> {
  const db = sql();
  const saved = await db`
    INSERT INTO device_presence (
      presence_id, device_id, state, human_eta_ms, eta_expires_at, present_until, issued_at, signature
    ) VALUES (
      ${row.presence_id}, ${row.device_id}, ${row.state}, ${row.human_eta_ms},
      ${row.eta_expires_at}::timestamptz, ${row.present_until}::timestamptz,
      ${row.issued_at}::timestamptz, ${row.signature}
    )
    RETURNING *
  `;
  return rowToPresence(saved[0] as Record<string, unknown>);
}
