import { NextRequest, NextResponse } from "next/server";
import { findBand } from "@/lib/bind-menu";
import { BIND_10K_FORM_ID, bind10kFormHash, bind10kFormText } from "@/lib/bind-10k-form";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const band_id = searchParams.get("band_id") || "b-10k";
  const band = findBand(band_id);
  if (!band) {
    return NextResponse.json({ error: "unknown_band_id" }, { status: 400 });
  }
  if (band.form_id === BIND_10K_FORM_ID) {
    return NextResponse.json({
      form_id: BIND_10K_FORM_ID,
      form_hash: bind10kFormHash(),
      form_text: bind10kFormText(),
      band,
      note: "The Enquirer must read this wording and sign it with its public key before Bind. This is not cover until Bind and premium settlement.",
    });
  }
  return NextResponse.json({
    form_id: band.form_id,
    band,
    note: "Higher bands use FS-BIND-1.0 and require an LDE wallet. Form text for those bands is issued with the Bind quote.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      menu_id?: string;
      band_id?: string;
      offer_id?: string;
      device_id?: string;
      enquirer_key_id?: string;
      purchaser_lde_wallet_key_id?: string;
      form_id?: string;
      form_hash?: string;
      signature?: string;
    };
    if (!body.band_id || !body.enquirer_key_id) {
      return NextResponse.json({ error: "band_id_and_enquirer_key_id_required" }, { status: 400 });
    }
    const band = findBand(body.band_id);
    if (!band) {
      return NextResponse.json({ error: "unknown_band_id" }, { status: 400 });
    }
    if (band.purchaser_must_have_lde_wallet && !body.purchaser_lde_wallet_key_id) {
      return NextResponse.json(
        {
          bound: false,
          error: "lde_wallet_required",
          note: "Bands above 10,000 GENIUS USD require an LDE wallet. Band b-10k does not.",
        },
        { status: 403 }
      );
    }
    if (band.form_id === BIND_10K_FORM_ID) {
      if (body.form_id && body.form_id !== BIND_10K_FORM_ID) {
        return NextResponse.json({ error: "form_id_mismatch" }, { status: 409 });
      }
      if (body.form_hash && body.form_hash !== bind10kFormHash()) {
        return NextResponse.json({ error: "form_hash_mismatch" }, { status: 409 });
      }
    }
    return NextResponse.json(
      {
        bound: false,
        error: "settlement_not_implemented",
        form_id: band.form_id,
        form_hash: band.form_id === BIND_10K_FORM_ID ? bind10kFormHash() : null,
        menu_id: body.menu_id || null,
        offer_id: body.offer_id || null,
        device_id: body.device_id || null,
        enquirer_key_id: body.enquirer_key_id,
        band,
        bind_preview: {
          limit_usd: band.limit_usd,
          premium_usd: band.premium_usd,
          currency: "GENIUS_USD",
          cover_life_ms: band.cover_life_ms,
          claims_window_ms: band.claims_window_ms,
          insured_event: band.insured_event,
          requires_hsm_presence: band.requires_hsm_presence,
          purchaser_must_have_lde_wallet: band.purchaser_must_have_lde_wallet,
          claims_require_full_cdd: band.claims_require_full_cdd,
        },
        note: "Band accepted as a preview. Premium collection and bind_id issuance are not on this host. For b-10k, no claim is payable until AML/KYC documents for the principal and payee are produced and sanctions screening clears.",
      },
      { status: 501 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "bind_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
