import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, lookupCover, upsertRecord } from "@/lib/db";
import { normalizeHex, verifyPublishSignature } from "@/lib/auth";
import type { CoverRecord } from "@/lib/types";
import { getOffer, ensureOfferSchema } from "@/lib/offers";

export const dynamic = "force-dynamic";

function present(record: CoverRecord) {
  const cover_in_force = record.cover_status === "active";
  return {
    record_id: record.record_id,
    device_id: record.device_id,
    agent_id: record.agent_id,
    recorded_controller_name: record.recorded_controller_name,
    onboarding_complete: record.onboarding_complete,
    cover_status: record.cover_status,
    cover_in_force,
    cover_purchasable: record.cover_purchasable && record.onboarding_complete && record.cover_status !== "cancelled",
    limit_band_usd: record.limit_band_usd ?? null,
    policy_reference: record.policy_reference ?? null,
    issued_at: record.issued_at,
    expires_at: record.expires_at,
    note: "This is not a Bind and not a policy.",
  };
}

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const device_id = searchParams.get("device_id") || undefined;
    const agent_id = searchParams.get("agent_id") || undefined;
    const accept_id = searchParams.get("accept_id") || searchParams.get("offer_id") || undefined;
    const open = process.env.OPEN_COVER_QUERIES === "true";
    if (!device_id && !agent_id) {
      return NextResponse.json({ error: "device_id_or_agent_id_required" }, { status: 400 });
    }
    if (!open) {
      await ensureOfferSchema();
      if (!accept_id) {
        return NextResponse.json(
          {
            error: "contract_required",
            form_id: "FS-QF-1.2",
            offer: "POST /api/v1/cover/offer",
            accept: "POST /api/v1/cover/accept",
            note: "Confirmation is released only after the Enquirer returns a signed FS-QF-1.2 acceptance.",
          },
          { status: 403 }
        );
      }
      const offer = await getOffer(accept_id);
      if (!offer || offer.status !== "accepted") {
        return NextResponse.json({ error: "accept_required" }, { status: 403 });
      }
      const wantDev = device_id ? normalizeHex(device_id) : null;
      if (wantDev && offer.device_id && offer.device_id !== wantDev) {
        return NextResponse.json({ error: "offer_device_mismatch" }, { status: 403 });
      }
      if (agent_id && offer.agent_id && offer.agent_id !== agent_id) {
        return NextResponse.json({ error: "offer_agent_mismatch" }, { status: 403 });
      }
    }
    const record = await lookupCover({
      device_id: device_id ? normalizeHex(device_id) : undefined,
      agent_id,
    });
    if (!record) {
      return NextResponse.json({
        found: false,
        recorded_controller_name: null,
        cover_status: "none",
        cover_in_force: false,
        cover_purchasable: false,
        note: "No live LDI record for this Authenticating Device or agent.",
      });
    }
    return NextResponse.json({ found: true, ...present(record) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "query_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = (await req.json()) as CoverRecord;
    const required = [
      "record_id",
      "device_id",
      "agent_id",
      "recorded_controller_name",
      "cover_status",
      "issued_at",
      "expires_at",
      "key_id",
      "signature",
    ];
    for (const key of required) {
      if ((body as Record<string, unknown>)[key] == null) {
        return NextResponse.json({ error: `missing_${key}` }, { status: 400 });
      }
    }
    const allowed = ["none", "active", "suspended", "cancelled", "expired"];
    if (!allowed.includes(body.cover_status)) {
      return NextResponse.json({ error: "invalid_cover_status" }, { status: 400 });
    }
    body.device_id = normalizeHex(body.device_id);
    body.key_id = normalizeHex(body.key_id);
    if (body.onboarding_complete == null) body.onboarding_complete = true;
    if (body.cover_purchasable == null) body.cover_purchasable = true;
    if (!verifyPublishSignature(body)) {
      return NextResponse.json({ error: "invalid_device_signature" }, { status: 401 });
    }
    const saved = await upsertRecord({ ...body, status: "active" });
    return NextResponse.json({ ok: true, record: present(saved) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "publish_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
