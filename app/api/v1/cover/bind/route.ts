import { NextRequest, NextResponse } from "next/server";
import { findBand } from "@/lib/bind-menu";
import { issuedForm } from "@/lib/bind-issued-forms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const band_id = searchParams.get("band_id") || "b-10k";
  const band = findBand(band_id);
  if (!band) {
    return NextResponse.json({ error: "unknown_band_id" }, { status: 400 });
  }
  const form = issuedForm(band.form_id);
  if (!form) {
    return NextResponse.json({
      form_id: band.form_id,
      band,
      note: "Form text for this band is not issued on this host yet.",
    });
  }
  return NextResponse.json({
    form_id: form.form_id,
    form_hash: form.form_hash,
    form_text: form.form_text,
    band,
    note: "Read this wording. During MVP testing sign form_hash on POST /api/v1/cover/bind/settle-mvp. GENIUS USD is not collected.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      band_id?: string;
      enquirer_key_id?: string;
      purchaser_lde_wallet_key_id?: string;
      form_id?: string;
      form_hash?: string;
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
    const form = issuedForm(band.form_id);
    if (form && body.form_id && body.form_id !== form.form_id) {
      return NextResponse.json({ error: "form_id_mismatch" }, { status: 409 });
    }
    if (form && body.form_hash && body.form_hash !== form.form_hash) {
      return NextResponse.json({ error: "form_hash_mismatch" }, { status: 409 });
    }
    return NextResponse.json(
      {
        bound: false,
        error: "use_settle_mvp",
        form_id: form?.form_id || band.form_id,
        form_hash: form?.form_hash || null,
        band,
        note: "GENIUS USD settlement is not on this host. For MVP testing sign the issued form via POST /api/v1/cover/bind/settle-mvp.",
      },
      { status: 501 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "bind_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
