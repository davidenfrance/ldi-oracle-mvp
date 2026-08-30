import { NextRequest, NextResponse } from "next/server";
import { normalizeHex } from "@/lib/auth";
import { ensureSchema, lookupCover } from "@/lib/db";
import { ensureMvpBindSchema, insertMvpBind, getMvpBind } from "@/lib/mvp-bind-db";
import {
  MVP_ASSET,
  MVP_RAIL,
  buildSettleMvpIntent,
  canonicalSettleMvpIntent,
  newMvpBind,
  requireBand,
  verifySettleMvpSignature,
} from "@/lib/mvp-settle";

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
      band,
      intent,
      intent_canonical: intent ? canonicalSettleMvpIntent(intent) : null,
      note: "Sign intent_canonical with the purchaser LDE wallet private key. POST the signature. This is not GENIUS USD.",
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
      signature?: string;
    };
    if (!body.band_id || !body.device_id || !body.purchaser_lde_wallet_key_id || !body.signature) {
      return NextResponse.json(
        { error: "band_id_device_id_purchaser_lde_wallet_key_id_signature_required" },
        { status: 400 }
      );
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
    const device_id = normalizeHex(body.device_id);
    const subject = await lookupCover({ device_id });
    if (!subject || !subject.cover_purchasable || subject.cover_status !== "active") {
      return NextResponse.json(
        { bound: false, error: "subject_cover_not_purchasable" },
        { status: 409 }
      );
    }
    if (subject.limit_band_usd && band.limit_usd > subject.limit_band_usd) {
      return NextResponse.json({ bound: false, error: "band_exceeds_standing_limit" }, { status: 409 });
    }
    const intent = buildSettleMvpIntent({
      band,
      device_id,
      purchaser_lde_wallet_key_id: body.purchaser_lde_wallet_key_id,
    });
    if (!verifySettleMvpSignature(intent, body.signature)) {
      return NextResponse.json({ bound: false, error: "invalid_purchaser_signature" }, { status: 401 });
    }
    const bind = newMvpBind({
      band,
      device_id,
      agent_id: body.agent_id || subject.agent_id,
      purchaser_lde_wallet_key_id: body.purchaser_lde_wallet_key_id,
      menu_id: body.menu_id || null,
      signature: body.signature,
    });
    const saved = await insertMvpBind(bind);
    return NextResponse.json(
      {
        bound: true,
        settlement: "mvp",
        asset: MVP_ASSET,
        rail: MVP_RAIL,
        not_genius_usd: true,
        bind: saved,
        intent,
        note: "MVP Bind in force for cover_ends_at. Premium was not collected in GENIUS USD or USD.",
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "settle_mvp_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
