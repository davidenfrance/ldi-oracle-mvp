import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { normalizeHex } from "@/lib/auth";
import {
  FORM_ID,
  formHash,
  loadFormText,
  feeFromEnv,
  canonicalOffer,
  signOracleMessage,
} from "@/lib/contract";
import { ensureOfferSchema, insertOffer } from "@/lib/offers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureOfferSchema();
    const body = (await req.json()) as {
      device_id?: string;
      agent_id?: string;
      enquirer_key_id?: string;
    };
    if (!body.enquirer_key_id) {
      return NextResponse.json({ error: "enquirer_key_id_required" }, { status: 400 });
    }
    if (!body.device_id && !body.agent_id) {
      return NextResponse.json({ error: "device_id_or_agent_id_required" }, { status: 400 });
    }
    const enquirer_key_id = normalizeHex(body.enquirer_key_id);
    if (enquirer_key_id.length !== 64) {
      return NextResponse.json({ error: "enquirer_key_id_must_be_ed25519_hex" }, { status: 400 });
    }
    const fee = feeFromEnv();
    const offer_id = "off-" + randomUUID();
    const form_hash = formHash();
    const quote_expires_at = new Date(Date.now() + 120 * 1000).toISOString();
    const device_id = body.device_id ? normalizeHex(body.device_id) : null;
    const agent_id = body.agent_id || null;
    const statement = canonicalOffer({
      offer_id,
      form_id: FORM_ID,
      form_hash,
      device_id,
      agent_id,
      enquirer_key_id,
      fee_amount: fee.fee_amount,
      fee_currency: fee.fee_currency,
      fee_account: fee.fee_account,
      quote_expires_at,
    });
    const oracle_signature = signOracleMessage(statement);
    await insertOffer({
      offer_id,
      form_id: FORM_ID,
      form_hash,
      device_id,
      agent_id,
      enquirer_key_id,
      fee_amount: fee.fee_amount,
      fee_currency: fee.fee_currency,
      fee_account: fee.fee_account,
      quote_expires_at,
      status: "offered",
      oracle_statement: statement,
      oracle_signature,
      accept_statement: null,
      accept_signature: null,
    });
    return NextResponse.json({
      offer_id,
      form_id: FORM_ID,
      form_hash,
      form_text: loadFormText(),
      device_id,
      agent_id,
      enquirer_key_id,
      fee_amount: fee.fee_amount,
      fee_currency: fee.fee_currency,
      fee_account: fee.fee_account,
      quote_expires_at,
      will_return: [
        "recorded_controller_name",
        "cover_status",
        "cover_in_force",
        "cover_purchasable",
        "limit_band_usd",
        "policy_reference",
      ],
      oracle_statement: statement,
      oracle_signature,
      note: "Offer under FS-QF-1.2. Fee is in this Offer. Confirmation is released only after POST /api/v1/cover/accept with the Enquirer signature.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "offer_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
