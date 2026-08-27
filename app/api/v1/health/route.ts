import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ldi-oracle-mvp",
    stores: ["cover_records", "revocation"],
    answers: ["recorded_controller_name", "cover_status", "cover_in_force", "cover_purchasable"],
    auth: {
      wallet_allow_list: false,
      cover_records: "signed_with_device_key_id_bound_on_record",
      oracle_authenticity: "wallet_verifies_oracle_identity_with_burned_locator_oracle_public_key"
    },
    burned_into_wallet: ["locator", "oracle_public_key", "device_id_public_key"],
    not_on_this_host: ["locator", "discovery_index", "wallet_private_keys", "bind_contracts"],
    note: "A live cover_status is not a Bind. Cover for a deal is a separate paid contract.",
    currency: "GENIUS_USD"
  });
}
