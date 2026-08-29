import { NextRequest, NextResponse } from "next/server";
import { findBand } from "@/lib/bind-menu";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      menu_id?: string;
      band_id?: string;
      offer_id?: string;
      device_id?: string;
      enquirer_key_id?: string;
      purchaser_lde_wallet_key_id?: string;
    };
    if (!body.band_id || !body.enquirer_key_id) {
      return NextResponse.json({ error: "band_id_and_enquirer_key_id_required" }, { status: 400 });
    }
    const band = findBand(body.band_id);
    if (!band) {
      return NextResponse.json({ error: "unknown_band_id" }, { status: 400 });
    }
    if (!body.purchaser_lde_wallet_key_id) {
      return NextResponse.json(
        {
          bound: false,
          error: "lde_wallet_required",
          note: "Query is allowed without an LDE wallet. Bind is not.",
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        bound: false,
        error: "settlement_not_implemented",
        form_id: "FS-BIND-1.0",
        menu_id: body.menu_id || null,
        offer_id: body.offer_id || null,
        device_id: body.device_id || null,
        band,
        bind_preview: {
          limit_usd: band.limit_usd,
          premium_usd: band.premium_usd,
          currency: "GENIUS_USD",
          cover_life_ms: band.cover_life_ms,
          claims_window_ms: band.claims_window_ms,
          insured_event: band.insured_event,
          requires_hsm_presence: band.requires_hsm_presence,
        },
        note: "Band accepted as a preview. Premium collection and bind_id issuance are not on this host.",
      },
      { status: 501 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "bind_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
