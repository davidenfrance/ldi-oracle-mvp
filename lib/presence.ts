import { randomUUID } from "crypto";
import { normalizeHex, verifyKeySignature } from "./auth";
import { ALL_BANDS, hsmRequiredAboveUsd } from "./bind-menu";

export type PresenceState = "unknown" | "eta" | "present" | "declined" | "timeout";

export type PresenceRow = {
  presence_id: string;
  device_id: string;
  state: Exclude<PresenceState, "unknown" | "timeout">;
  human_eta_ms: number | null;
  eta_expires_at: string | null;
  present_until: string | null;
  issued_at: string;
  signature: string;
};

export type PresenceView = {
  subject_device_id: string | null;
  hsm_required_above_usd: number;
  state: PresenceState;
  human_eta_ms: number | null;
  eta_expires_at: string | null;
  present_until: string | null;
  presence_id: string | null;
  not_a_real_hsm: true;
  selectable_without_hsm: string[];
  selectable_if_present: string[];
};

export function canonicalPresence(body: {
  action: "hsm-presence-mvp";
  device_id: string;
  state: string;
  human_eta_ms: number | null;
  issued_at: string;
}): string {
  return JSON.stringify({
    action: "hsm-presence-mvp",
    device_id: normalizeHex(body.device_id),
    state: body.state,
    human_eta_ms: body.human_eta_ms,
    issued_at: body.issued_at,
  });
}

export function verifyPresenceSignature(row: {
  device_id: string;
  state: string;
  human_eta_ms: number | null;
  issued_at: string;
  signature: string;
}): boolean {
  const key = normalizeHex(row.device_id);
  if (key.length !== 64 || !row.signature) return false;
  return verifyKeySignature(
    canonicalPresence({
      action: "hsm-presence-mvp",
      device_id: key,
      state: row.state,
      human_eta_ms: row.human_eta_ms,
      issued_at: row.issued_at,
    }),
    key,
    row.signature
  );
}

export function viewPresence(device_id: string | null, row: PresenceRow | null): PresenceView {
  const without = ALL_BANDS.filter((b) => !b.requires_hsm_presence).map((b) => b.band_id);
  const withHsm = ALL_BANDS.filter((b) => b.requires_hsm_presence).map((b) => b.band_id);
  const now = Date.now();
  let state: PresenceState = "unknown";
  if (row) {
    if (row.state === "declined") state = "declined";
    else if (row.state === "present") {
      state = row.present_until && Date.parse(row.present_until) > now ? "present" : "timeout";
    } else if (row.state === "eta") {
      state = row.eta_expires_at && Date.parse(row.eta_expires_at) > now ? "eta" : "timeout";
    }
  }
  return {
    subject_device_id: device_id,
    hsm_required_above_usd: hsmRequiredAboveUsd(),
    state,
    human_eta_ms: state === "eta" ? row?.human_eta_ms ?? null : null,
    eta_expires_at: state === "eta" ? row?.eta_expires_at ?? null : null,
    present_until: state === "present" ? row?.present_until ?? null : null,
    presence_id: row && (state === "present" || state === "eta") ? row.presence_id : null,
    not_a_real_hsm: true,
    selectable_without_hsm: without,
    selectable_if_present: withHsm,
  };
}

export function newPresenceRow(opts: {
  device_id: string;
  state: "eta" | "present" | "declined";
  human_eta_ms?: number | null;
  issued_at: string;
  signature: string;
}): PresenceRow {
  const issued = Date.parse(opts.issued_at);
  const etaMs = opts.human_eta_ms ?? null;
  return {
    presence_id: `pres-${randomUUID()}`,
    device_id: normalizeHex(opts.device_id),
    state: opts.state,
    human_eta_ms: opts.state === "eta" ? etaMs : null,
    eta_expires_at:
      opts.state === "eta" && etaMs != null ? new Date(issued + Math.max(etaMs, 1000) + 15_000).toISOString() : null,
    present_until: opts.state === "present" ? new Date(issued + 120_000).toISOString() : null,
    issued_at: opts.issued_at,
    signature: opts.signature,
  };
}
