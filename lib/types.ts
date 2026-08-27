export type RecordStatus = "active" | "revoked";
export type CoverStatus = "none" | "active" | "suspended" | "cancelled" | "expired";

export type CoverRecord = {
  record_id: string;
  device_id: string;
  agent_id: string;
  recorded_controller_name: string;
  onboarding_complete: boolean;
  cover_status: CoverStatus;
  cover_purchasable: boolean;
  limit_band_usd?: number | null;
  policy_reference?: string | null;
  issued_at: string;
  expires_at: string;
  status: RecordStatus;
  key_id: string;
  signature: string;
};
