export type BindBand = {
  band_id: string;
  limit_usd: number;
  premium_usd: string;
  quote_life_ms: number;
  cover_life_ms: number;
  claims_window_ms: number;
  insured_event: string;
  requires_hsm_presence: boolean;
  purchaser_must_have_lde_wallet: boolean;
  claims_require_full_cdd: boolean;
  form_id: string;
};

export type BindMenu = {
  menu_id: string;
  device_id: string | null;
  agent_id: string | null;
  form_id: string;
  menu_expires_at: string;
  currency: "GENIUS_USD";
  bind_available: boolean;
  note: string;
  bands: BindBand[];
};

export const ALL_BANDS: BindBand[] = [
  {
    band_id: "b-10k",
    limit_usd: 10_000,
    premium_usd: "2.00",
    quote_life_ms: 120_000,
    cover_life_ms: 86_400_000,
    claims_window_ms: 7_776_000_000,
    insured_event: "recorded_controller_mismatch",
    requires_hsm_presence: false,
    purchaser_must_have_lde_wallet: false,
    claims_require_full_cdd: true,
    form_id: "FS-BIND-10K-1.0",
  },
  {
    band_id: "b-50k",
    limit_usd: 50_000,
    premium_usd: "8.00",
    quote_life_ms: 120_000,
    cover_life_ms: 86_400_000,
    claims_window_ms: 7_776_000_000,
    insured_event: "recorded_controller_mismatch",
    requires_hsm_presence: false,
    purchaser_must_have_lde_wallet: true,
    claims_require_full_cdd: true,
    form_id: "FS-BIND-50K-1.0",
  },
  {
    band_id: "b-250k",
    limit_usd: 250_000,
    premium_usd: "35.00",
    quote_life_ms: 120_000,
    cover_life_ms: 86_400_000,
    claims_window_ms: 7_776_000_000,
    insured_event: "recorded_controller_mismatch",
    requires_hsm_presence: false,
    purchaser_must_have_lde_wallet: true,
    claims_require_full_cdd: true,
    form_id: "FS-BIND-250K-1.0",
  },
  {
    band_id: "b-1m",
    limit_usd: 1_000_000,
    premium_usd: "120.00",
    quote_life_ms: 120_000,
    cover_life_ms: 86_400_000,
    claims_window_ms: 7_776_000_000,
    insured_event: "recorded_controller_mismatch",
    requires_hsm_presence: false,
    purchaser_must_have_lde_wallet: true,
    claims_require_full_cdd: true,
    form_id: "FS-BIND-1M-1.0",
  },
  {
    band_id: "b-5m",
    limit_usd: 5_000_000,
    premium_usd: "450.00",
    quote_life_ms: 120_000,
    cover_life_ms: 86_400_000,
    claims_window_ms: 7_776_000_000,
    insured_event: "recorded_controller_mismatch",
    requires_hsm_presence: true,
    purchaser_must_have_lde_wallet: true,
    claims_require_full_cdd: true,
    form_id: "FS-BIND-5M-1.0",
  },
  {
    band_id: "b-20m",
    limit_usd: 20_000_000,
    premium_usd: "1400.00",
    quote_life_ms: 120_000,
    cover_life_ms: 86_400_000,
    claims_window_ms: 7_776_000_000,
    insured_event: "recorded_controller_mismatch",
    requires_hsm_presence: true,
    purchaser_must_have_lde_wallet: true,
    claims_require_full_cdd: true,
    form_id: "FS-BIND-20M-1.0",
  },
];

export function hsmRequiredAboveUsd(): number {
  const flagged = ALL_BANDS.filter((b) => b.requires_hsm_presence).map((b) => b.limit_usd);
  return flagged.length ? Math.min(...flagged) - 1 : 20_000_000;
}

export function buildBindMenu(opts: {
  device_id?: string | null;
  agent_id?: string | null;
  cover_purchasable?: boolean;
  standing_limit_usd?: number | null;
}): BindMenu {
  const cap = opts.standing_limit_usd && opts.standing_limit_usd > 0 ? opts.standing_limit_usd : 20_000_000;
  const bands = ALL_BANDS.filter((b) => b.limit_usd <= cap);
  const available = Boolean(opts.cover_purchasable);
  const menu_id = `bm-${(opts.device_id || opts.agent_id || "none").slice(0, 16)}-${Date.now().toString(16)}`;
  return {
    menu_id,
    device_id: opts.device_id || null,
    agent_id: opts.agent_id || null,
    form_id: "FS-BIND-1.0",
    menu_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    currency: "GENIUS_USD",
    bind_available: available,
    note: available
      ? "Invitation to treat. MVP testing settles every band on settle-mvp in GENIUS_USD_MVP. Use presence to decide HSM bands."
      : "Bands shown for planning. Bind is not available on this device until cover_purchasable is true.",
    bands,
  };
}

export function findBand(band_id: string): BindBand | undefined {
  return ALL_BANDS.find((b) => b.band_id === band_id);
}
