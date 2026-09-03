import { NextRequest, NextResponse } from "next/server";
import { normalizeHex } from "@/lib/auth";
import { ensureSchema, lookupCover } from "@/lib/db";
import { ensureMvpBindSchema, insertMvpBind, getMvpBind } from "@/lib/mvp-bind-db";
import { issuedForm } from "@/lib/bind-issued-forms";
import {
  MVP_ASSET,
  MVP_RAIL,
  buildSettleMvpIntent,
  canonicalSettleMvpIntent,
  formForBand,
  newMvpBind,
  requireBand,
  verifySettleMvpSignature,
} from "@/lib/mvp-settle";
import { assessReceipt, type QueryReceipt } from "@/lib/receipt-verify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    await ensureMvpBindSchema();
    const { searchParams } = new URL(req.url);
    const mvp_bind_id = searchParams.get("mvp_bind_id");
    const settlement_id = searchParams.get("settlement_id");
    if (mvp_bind_id || settlement_id) {
      const row = await getMvpBind({
        mvp_bind_id: mvp_bind_id || undefined,
        settlement_id: settlement_id || undefined,
      });
      if (!row) return NextResponse.json({ found: false }, { status: 404 });
      return NextResponse.json({
        found: true,
        bound: true,
        settlement: "mvp",
        bind: row,
        note: "MVP Bind only. Premium was not collected in GENIUS USD or USD.",
      });
    }
    const band_id = searchParams.get("band_id") || "b-1m";
    const device_id = searchParams.get("device_id") || "";
    const purchaser = searchParams.get("purchaser_lde_wallet_key_id") || "";
    const band = requireBand(band_id);
    const form = formForBand(band);
    const intent =
      device_id && purchaser
        ? buildSettleMvpIntent({
            band,
            device_id,
            purchaser_lde_wallet_key_id: purchaser,
          })
        : null;
    return NextResponse.json({
      rail: MVP_RAIL,
      asset: MVP_ASSET,
      not_genius_usd: true,
      form_id: form?.form_id || band.form_id,
      form_hash: form?.form_hash || null,
      form_text: form?.form_text || null,
      band,
      intent,
      intent_canonical: intent ? canonicalSettleMvpIntent(intent) : null,
      note: "Read form_text. Sign intent_canonical, which includes form_id and form_hash. POST the signature. Optional body.receipt is an LDEDI query receipt. This is not GENIUS USD.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "settle_mvp_get_failed";
    const status = message === "unknown_band_id" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    await ensureMvpBindSchema();
    const body = (await req.json()) as {
      band_id?: string;
      device_id?: string;
      agent_id?: string;
      purchaser_lde_wallet_key_id?: string;
      menu_id?: string;
      form_id?: string;
      form_hash?: string;
      signature?: string;
      receipt?: QueryReceipt;
    };
    if (!body.band_id || !body.device_id || !body.purchaser_lde_wallet_key_id || !body.signature) {
      return NextResponse.json(
        { error: "band_id_device_id_purchaser_lde_wallet_key_id_signature_required" },
        { status: 400 }
      );
    }
    const receipt_view = assessReceipt(body.receipt, {
      subject_key_id: body.device_id,
      interrogator_key_id: body.purchaser_lde_wallet_key_id,
    });
    if (body.receipt && !receipt_view.ok) {
      return NextResponse.json({ bound: false, error: "invalid_query_receipt", receipt_view }, { status: 401 });
    }
    let band;
    try {
      band = requireBand(body.band_id);
    } catch {
      return NextResponse.json({ error: "unknown_band_id" }, { status: 400 });
    }
    if (band.purchaser_must_have_lde_wallet && !body.purchaser_lde_wallet_key_id) {
      return NextResponse.json({ error: "lde_wallet_required" }, { status: 403 });
    }
    const form = issuedForm(band.form_id);
    if (!form) {
      return NextResponse.json({ error: "form_not_issued" }, { status: 409 });
    }
    if (body.form_id && body.form_id !== form.form_id) {
      return NextResponse.json({ error: "form_id_mismatch" }, { status: 409 });
    }
    if (body.form_hash && body.form_hash !== form.form_hash) {
      return NextResponse.json({ error: "form_hash_mismatch" }, { status: 409 });
    }
    const device_id = normalizeHex(body.device_id);
    const subject = await lookupCover({ device_id });
    if (!subject || !subject.cover_purchasable || subject.cover_status !== "active") {
      return NextResponse.json(
        { bound: false, error: "subject_cover_not_purchasable", receipt_view },
        { status: 409 }
      );
    }
    if (subject.limit_band_usd && band.limit_usd > subject.limit_band_usd) {
      return NextResponse.json({ bound: false, error: "band_exceeds_standing_limit", receipt_view }, { status: 409 });
    }
    const intent = buildSettleMvpIntent({
      band,
      device_id,
      purchaser_lde_wallet_key_id: body.purchaser_lde_wallet_key_id,
    });
    if (!verifySettleMvpSignature(intent, body.signature)) {
      return NextResponse.json({ bound: false, error: "invalid_purchaser_signature", receipt_view }, { status: 401 });
    }
    const bind = newMvpBind({
      band,
      device_id,
      agent_id: body.agent_id || subject.agent_id,
      purchaser_lde_wallet_key_id: body.purchaser_lde_wallet_key_id,
      menu_id: body.menu_id || null,
      signature: body.signature,
    });
    const saved = await insertMvpBind(bind, receipt_view.presented ? receipt_view : null);
    return NextResponse.json(
      {
        bound: true,
        settlement: "mvp",
        asset: MVP_ASSET,
        rail: MVP_RAIL,
        not_genius_usd: true,
        form_id: intent.form_id,
        form_hash: intent.form_hash,
        bind: saved,
        intent,
        receipt_view,
        note: `${form.form_id} accepted on the MVP rail. Premium was not collected in GENIUS USD or USD.`,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "settle_mvp_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
