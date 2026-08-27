import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, revokeRecord, getRecordKeyId } from "@/lib/db";
import { normalizeHex, verifyRevokeSignature } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await ctx.params;
    const body = (await req.json()) as { key_id?: string; signature?: string };
    if (!body.key_id || !body.signature) {
      return NextResponse.json({ error: "missing_signature" }, { status: 400 });
    }
    if (!verifyRevokeSignature(id, body.key_id, body.signature)) {
      return NextResponse.json({ error: "invalid_device_signature" }, { status: 401 });
    }
    const storedKey = await getRecordKeyId(id);
    if (!storedKey) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (normalizeHex(storedKey) !== normalizeHex(body.key_id)) {
      return NextResponse.json({ error: "device_id_mismatch" }, { status: 403 });
    }
    const found = await revokeRecord(id);
    if (!found) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      record_id: id,
      status: "revoked",
      note: "Record will not appear on subsequent GET /api/v1/cover queries.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "revoke_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
