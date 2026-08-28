import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function ensureOfferSchema(): Promise<void> {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS query_offers (
      offer_id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      form_hash TEXT NOT NULL,
      device_id TEXT,
      agent_id TEXT,
      enquirer_key_id TEXT NOT NULL,
      fee_amount TEXT NOT NULL,
      fee_currency TEXT NOT NULL,
      fee_account TEXT NOT NULL,
      quote_expires_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'offered',
      oracle_statement TEXT NOT NULL,
      oracle_signature TEXT NOT NULL,
      accept_statement TEXT,
      accept_signature TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export type OfferRow = {
  offer_id: string;
  form_id: string;
  form_hash: string;
  device_id: string | null;
  agent_id: string | null;
  enquirer_key_id: string;
  fee_amount: string;
  fee_currency: string;
  fee_account: string;
  quote_expires_at: string;
  status: string;
  oracle_statement: string;
  oracle_signature: string;
  accept_statement: string | null;
  accept_signature: string | null;
};

function row(r: Record<string, unknown>): OfferRow {
  return {
    offer_id: String(r.offer_id),
    form_id: String(r.form_id),
    form_hash: String(r.form_hash),
    device_id: r.device_id ? String(r.device_id) : null,
    agent_id: r.agent_id ? String(r.agent_id) : null,
    enquirer_key_id: String(r.enquirer_key_id),
    fee_amount: String(r.fee_amount),
    fee_currency: String(r.fee_currency),
    fee_account: String(r.fee_account),
    quote_expires_at: new Date(String(r.quote_expires_at)).toISOString(),
    status: String(r.status),
    oracle_statement: String(r.oracle_statement),
    oracle_signature: String(r.oracle_signature),
    accept_statement: r.accept_statement ? String(r.accept_statement) : null,
    accept_signature: r.accept_signature ? String(r.accept_signature) : null,
  };
}

export async function insertOffer(o: OfferRow): Promise<OfferRow> {
  const db = sql();
  const rows = await db`
    INSERT INTO query_offers (
      offer_id, form_id, form_hash, device_id, agent_id, enquirer_key_id,
      fee_amount, fee_currency, fee_account, quote_expires_at, status,
      oracle_statement, oracle_signature
    ) VALUES (
      ${o.offer_id}, ${o.form_id}, ${o.form_hash}, ${o.device_id}, ${o.agent_id},
      ${o.enquirer_key_id}, ${o.fee_amount}, ${o.fee_currency}, ${o.fee_account},
      ${o.quote_expires_at}::timestamptz, ${o.status},
      ${o.oracle_statement}, ${o.oracle_signature}
    )
    RETURNING *
  `;
  return row(rows[0] as Record<string, unknown>);
}

export async function getOffer(offer_id: string): Promise<OfferRow | null> {
  const db = sql();
  const rows = await db`SELECT * FROM query_offers WHERE offer_id = ${offer_id} LIMIT 1`;
  if (!rows.length) return null;
  return row(rows[0] as Record<string, unknown>);
}

export async function markAccepted(
  offer_id: string,
  accept_statement: string,
  accept_signature: string
): Promise<OfferRow | null> {
  const db = sql();
  const rows = await db`
    UPDATE query_offers
    SET status = 'accepted',
        accept_statement = ${accept_statement},
        accept_signature = ${accept_signature},
        updated_at = now()
    WHERE offer_id = ${offer_id}
    RETURNING *
  `;
  if (!rows.length) return null;
  return row(rows[0] as Record<string, unknown>);
}
