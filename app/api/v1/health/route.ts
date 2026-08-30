import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ldi-oracle-mvp",
    stores: ["cover_records", "revocation", "mvp_binds"],
    answers: ["recorded_controller_name", "cover_status", "cover_in_force", "cover_purchasable"],
    auth: {
      wallet_allow_list: false,
      cover_records: "signed_with_device_key_id_bound_on_record",
      oracle_authenticity: "wallet_verifies_oracle_identity_with_burned_locator_oracle_public_key",
      settle_mvp: "purchaser_lde_wallet_signs_canonical_intent",
    },
    burned_into_wallet: ["locator", "oracle_public_key", "device_id_public_key"],
    not_on_this_host: ["locator", "discovery_index", "wallet_private_keys", "genius_usd_settlement"],
    settle_mvp: {
      path: "/api/v1/cover/bind/settle-mvp",
      asset: "GENIUS_USD_MVP",
      rail: "lde_mvp_settlement",
      not_genius_usd: true,
    },
    note: "A live cover_status is not a Bind. Cover for a deal is a separate paid contract. settle-mvp is not GENIUS USD.",
    currency: "GENIUS_USD",
  });
}
