import { neon } from "@neondatabase/serverless";
import type { MvpBind } from "./mvp-settle";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function ensureMvpBindSchema(): Promise<void> {
  const db = sql();
  await db`
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
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS mvp_binds_device_id ON mvp_binds (device_id)`;
}

function rowToBind(row: Record<string, unknown>): MvpBind {
  return {
    mvp_bind_id: String(row.mvp_bind_id),
    settlement_id: String(row.settlement_id),
    device_id: String(row.device_id),
    agent_id: row.agent_id ? String(row.agent_id) : null,
    purchaser_lde_wallet_key_id: String(row.purchaser_lde_wallet_key_id),
    band_id: String(row.band_id),
    limit_usd: Number(row.limit_usd),
    premium_usd: String(row.premium_usd),
    asset: String(row.asset),
    rail: String(row.rail),
    not_genius_usd: true,
    insured_event: String(row.insured_event),
    cover_starts_at: new Date(String(row.cover_starts_at)).toISOString(),
    cover_ends_at: new Date(String(row.cover_ends_at)).toISOString(),
    claims_until: new Date(String(row.claims_until)).toISOString(),
    menu_id: row.menu_id ? String(row.menu_id) : null,
    signature: String(row.signature),
    created_at: new Date(String(row.created_at)).toISOString(),
  };
}

export async function insertMvpBind(bind: MvpBind): Promise<MvpBind> {
  const db = sql();
  const rows = await db`
    INSERT INTO mvp_binds (
      mvp_bind_id, settlement_id, device_id, agent_id, purchaser_lde_wallet_key_id,
      band_id, limit_usd, premium_usd, asset, rail, not_genius_usd, insured_event,
      cover_starts_at, cover_ends_at, claims_until, menu_id, signature, created_at
    ) VALUES (
      ${bind.mvp_bind_id}, ${bind.settlement_id}, ${bind.device_id}, ${bind.agent_id},
      ${bind.purchaser_lde_wallet_key_id}, ${bind.band_id}, ${bind.limit_usd},
      ${bind.premium_usd}, ${bind.asset}, ${bind.rail}, true, ${bind.insured_event},
      ${bind.cover_starts_at}::timestamptz, ${bind.cover_ends_at}::timestamptz,
      ${bind.claims_until}::timestamptz, ${bind.menu_id}, ${bind.signature},
      ${bind.created_at}::timestamptz
    )
    RETURNING *
  `;
  return rowToBind(rows[0] as Record<string, unknown>);
}

export async function getMvpBind(filters: {
  mvp_bind_id?: string;
  settlement_id?: string;
}): Promise<MvpBind | null> {
  const db = sql();
  const id = filters.mvp_bind_id ?? null;
  const setl = filters.settlement_id ?? null;
  const rows = await db`
    SELECT * FROM mvp_binds
    WHERE (${id}::text IS NOT NULL AND mvp_bind_id = ${id})
       OR (${setl}::text IS NOT NULL AND settlement_id = ${setl})
    LIMIT 1
  `;
  if (!rows.length) return null;
  return rowToBind(rows[0] as Record<string, unknown>);
}
