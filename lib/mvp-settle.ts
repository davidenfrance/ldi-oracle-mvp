import { randomUUID } from "crypto";
import { findBand, type BindBand } from "./bind-menu";
import { normalizeHex, verifyKeySignature } from "./auth";
import { BIND_1M_FORM_ID, bind1mFormHash } from "./bind-1m-form";

export const MVP_ASSET = "GENIUS_USD_MVP";
export const MVP_RAIL = "lde_mvp_settlement";

export type SettleMvpIntent = {
  action: "settle-mvp";
  form_id: string;
  form_hash: string;
  asset: typeof MVP_ASSET;
  rail: typeof MVP_RAIL;
  band_id: string;
  device_id: string;
  purchaser_lde_wallet_key_id: string;
  premium_usd: string;
  limit_usd: number;
  not_genius_usd: true;
};

export type MvpBind = {
  mvp_bind_id: string;
  settlement_id: string;
  device_id: string;
  agent_id: string | null;
  purchaser_lde_wallet_key_id: string;
  band_id: string;
  limit_usd: number;
  premium_usd: string;
  asset: string;
  rail: string;
  not_genius_usd: true;
  insured_event: string;
  cover_starts_at: string;
  cover_ends_at: string;
  claims_until: string;
  menu_id: string | null;
  signature: string;
  created_at: string;
};

export function formForBand(band: BindBand): { form_id: string; form_hash: string } | null {
  if (band.form_id === BIND_1M_FORM_ID) {
    return { form_id: BIND_1M_FORM_ID, form_hash: bind1mFormHash() };
  }
  return null;
}

export function buildSettleMvpIntent(opts: {
  band: BindBand;
  device_id: string;
  purchaser_lde_wallet_key_id: string;
}): SettleMvpIntent {
  const form = formForBand(opts.band);
  return {
    action: "settle-mvp",
    form_id: form?.form_id || opts.band.form_id,
    form_hash: form?.form_hash || "",
    asset: MVP_ASSET,
    rail: MVP_RAIL,
    band_id: opts.band.band_id,
    device_id: normalizeHex(opts.device_id),
    purchaser_lde_wallet_key_id: normalizeHex(opts.purchaser_lde_wallet_key_id),
    premium_usd: opts.band.premium_usd,
    limit_usd: opts.band.limit_usd,
    not_genius_usd: true,
  };
}

export function canonicalSettleMvpIntent(intent: SettleMvpIntent): string {
  return JSON.stringify({
    action: "settle-mvp",
    form_id: intent.form_id,
    form_hash: intent.form_hash,
    asset: MVP_ASSET,
    rail: MVP_RAIL,
    band_id: intent.band_id,
    device_id: normalizeHex(intent.device_id),
    purchaser_lde_wallet_key_id: normalizeHex(intent.purchaser_lde_wallet_key_id),
    premium_usd: intent.premium_usd,
    limit_usd: intent.limit_usd,
    not_genius_usd: true,
  });
}

export function verifySettleMvpSignature(intent: SettleMvpIntent, signature: string): boolean {
  const keyId = normalizeHex(intent.purchaser_lde_wallet_key_id);
  if (keyId.length !== 64 || !signature) return false;
  return verifyKeySignature(canonicalSettleMvpIntent(intent), keyId, signature);
}

export function newMvpBind(opts: {
  band: BindBand;
  device_id: string;
  agent_id?: string | null;
  purchaser_lde_wallet_key_id: string;
  menu_id?: string | null;
  signature: string;
}): MvpBind {
  const now = Date.now();
  const starts = new Date(now).toISOString();
  const ends = new Date(now + opts.band.cover_life_ms).toISOString();
  const claims = new Date(now + opts.band.claims_window_ms).toISOString();
  return {
    mvp_bind_id: `mvp-bind-${randomUUID()}`,
    settlement_id: `mvp-set-${randomUUID()}`,
    device_id: normalizeHex(opts.device_id),
    agent_id: opts.agent_id || null,
    purchaser_lde_wallet_key_id: normalizeHex(opts.purchaser_lde_wallet_key_id),
    band_id: opts.band.band_id,
    limit_usd: opts.band.limit_usd,
    premium_usd: opts.band.premium_usd,
    asset: MVP_ASSET,
    rail: MVP_RAIL,
    not_genius_usd: true,
    insured_event: opts.band.insured_event,
    cover_starts_at: starts,
    cover_ends_at: ends,
    claims_until: claims,
    menu_id: opts.menu_id || null,
    signature: opts.signature,
    created_at: starts,
  };
}

export function requireBand(band_id: string): BindBand {
  const band = findBand(band_id);
  if (!band) throw new Error("unknown_band_id");
  return band;
}
