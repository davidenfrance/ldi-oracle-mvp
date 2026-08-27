import { NextResponse } from "next/server";
import { signOracleIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const issued_at = new Date().toISOString();
    const signed = signOracleIdentity({
      oracle_id: process.env.ORACLE_ID || "ldi-oracle-mvp",
      service: "ldi-oracle-mvp",
      issued_at,
    });
    return NextResponse.json({
      oracle_id: process.env.ORACLE_ID || "ldi-oracle-mvp",
      service: "ldi-oracle-mvp",
      issued_at,
      statement: signed.statement,
      signature: signed.signature,
      oracle_public_key_hex: signed.public_key_hint || null,
      note: "Verify signature with the oracle public key burned into the wallet with the locator. Do not trust a counterparty URL.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "oracle_identity_unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
