import { NextRequest, NextResponse } from "next/server";
import { normalizeHex } from "@/lib/auth";
import { ensurePresenceSchema, insertPresence, latestPresence } from "@/lib/presence-db";
import {
  canonicalPresence,
  newPresenceRow,
  verifyPresenceSignature,
  viewPresence,
} from "@/lib/presence";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensurePresenceSchema();
  const device_id = req.nextUrl.searchParams.get("device_id");
  if (!device_id) {
    return NextResponse.json({ error: "device_id_required" }, { status: 400 });
  }
  const id = normalizeHex(device_id);
  const row = await latestPresence(id);
  return NextResponse.json({
    presence: viewPresence(id, row),
    sign: {
      action: "hsm-presence-mvp",
      note: "Subject device signs canonicalPresence. state is eta, present or declined.",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    await ensurePresenceSchema();
    const body = (await req.json()) as {
      device_id?: string;
      state?: string;
      human_eta_ms?: number | null;
      issued_at?: string;
      signature?: string;
    };
    if (!body.device_id || !body.state || !body.issued_at || !body.signature) {
      return NextResponse.json({ error: "device_id_state_issued_at_signature_required" }, { status: 400 });
    }
    if (body.state !== "eta" && body.state !== "present" && body.state !== "declined") {
      return NextResponse.json({ error: "invalid_state" }, { status: 400 });
    }
    if (Math.abs(Date.now() - Date.parse(body.issued_at)) > 60_000) {
      return NextResponse.json({ error: "issued_at_stale" }, { status: 409 });
    }
    const device_id = normalizeHex(body.device_id);
    const check = {
      device_id,
      state: body.state,
      human_eta_ms: body.state === "eta" ? body.human_eta_ms ?? null : null,
      issued_at: body.issued_at,
      signature: body.signature,
    };
    if (!verifyPresenceSignature(check)) {
      return NextResponse.json(
        {
          error: "invalid_device_signature",
          canonical: canonicalPresence({
            action: "hsm-presence-mvp",
            device_id,
            state: body.state,
            human_eta_ms: check.human_eta_ms,
            issued_at: body.issued_at,
          }),
        },
        { status: 401 }
      );
    }
    const row = await insertPresence(
      newPresenceRow({
        device_id,
        state: body.state,
        human_eta_ms: check.human_eta_ms,
        issued_at: body.issued_at,
        signature: body.signature,
      })
    );
    return NextResponse.json({ ok: true, presence: viewPresence(device_id, row) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "presence_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
