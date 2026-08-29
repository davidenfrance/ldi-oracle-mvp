import { NextRequest, NextResponse } from "next/server";
import { normalizeHex } from "@/lib/auth";
import { lookupCover, ensureSchema } from "@/lib/db";
import { FORM_ID, formHash, canonicalAccept, verifyEnquirerSignature } from "@/lib/contract";
import { ensureOfferSchema, getOffer, markAccepted } from "@/lib/offers";
import { buildBindMenu } from "@/lib/bind-menu";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureOfferSchema();
    await ensureSchema();
    const body = (await req.json()) as {
      offer_id?: string;
      enquirer_key_id?: string;
      signature?: string;
    };
    if (!body.offer_id || !body.enquirer_key_id || !body.signature) {
      return NextResponse.json({ error: "offer_id_enquirer_key_id_signature_required" }, { status: 400 });
    }
    const offer = await getOffer(body.offer_id);
    if (!offer) return NextResponse.json({ error: "offer_not_found" }, { status: 404 });
    if (offer.status === "accepted") {
      return NextResponse.json({ error: "offer_already_accepted" }, { status: 409 });
    }
    if (new Date(offer.quote_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "offer_expired" }, { status: 410 });
    }
    if (normalizeHex(offer.enquirer_key_id) !== normalizeHex(body.enquirer_key_id)) {
      return NextResponse.json({ error: "enquirer_key_mismatch" }, { status: 403 });
    }
    if (offer.form_id !== FORM_ID || offer.form_hash !== formHash()) {
      return NextResponse.json({ error: "form_hash_mismatch" }, { status: 409 });
    }
    const statement = canonicalAccept({
      offer_id: offer.offer_id,
      form_id: offer.form_id,
      form_hash: offer.form_hash,
      device_id: offer.device_id,
      agent_id: offer.agent_id,
      enquirer_key_id: offer.enquirer_key_id,
      fee_amount: offer.fee_amount,
      fee_currency: offer.fee_currency,
    });
    if (!verifyEnquirerSignature(statement, body.enquirer_key_id, body.signature)) {
      return NextResponse.json({ error: "invalid_enquirer_signature" }, { status: 401 });
    }
    await markAccepted(offer.offer_id, statement, body.signature);
    const record = await lookupCover({
      device_id: offer.device_id || undefined,
      agent_id: offer.agent_id || undefined,
    });
    if (!record) {
      return NextResponse.json({
        accepted: true,
        offer_id: offer.offer_id,
        form_id: FORM_ID,
        found: false,
        recorded_controller_name: null,
        cover_status: "none",
        cover_in_force: false,
        cover_purchasable: false,
        bind_menu: buildBindMenu({
          device_id: offer.device_id,
          agent_id: offer.agent_id,
          cover_purchasable: false,
        }),
        note: "Contract accepted. No live LDI record for this Authenticating Device or agent.",
      });
    }
    const cover_in_force = record.cover_status === "active";
    const cover_purchasable =
      record.cover_purchasable && record.onboarding_complete && record.cover_status !== "cancelled";
    return NextResponse.json({
      accepted: true,
      offer_id: offer.offer_id,
      form_id: FORM_ID,
      found: true,
      record_id: record.record_id,
      device_id: record.device_id,
      agent_id: record.agent_id,
      recorded_controller_name: record.recorded_controller_name,
      cover_status: record.cover_status,
      cover_in_force,
      cover_purchasable,
      limit_band_usd: record.limit_band_usd ?? null,
      policy_reference: record.policy_reference ?? null,
      issued_at: record.issued_at,
      expires_at: record.expires_at,
      bind_menu: buildBindMenu({
        device_id: record.device_id,
        agent_id: record.agent_id,
        cover_purchasable,
        standing_limit_usd: record.limit_band_usd,
      }),
      note: "Released after signed FS-QF-1.2 acceptance. This is not a Bind. Use bind_menu.bands when the session requires cover.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "accept_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
