import { createHash, createPrivateKey, createPublicKey, sign, verify } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { normalizeHex, normalizePem } from "./auth";

export const FORM_ID = "FS-QF-1.2";

export function loadFormText(): string {
  return readFileSync(join(process.cwd(), "lib/forms/FS-QF-1.2.txt"), "utf8");
}

export function formHash(text?: string): string {
  return createHash("sha256").update(text ?? loadFormText(), "utf8").digest("hex");
}

export function feeFromEnv() {
  return {
    fee_amount: process.env.QUERY_FEE_AMOUNT || "0.10",
    fee_currency: process.env.QUERY_FEE_CURRENCY || "GENIUS_USD",
    fee_account: process.env.QUERY_FEE_ACCOUNT || "ldi-query-fee",
  };
}

export function canonicalOffer(o: {
  offer_id: string;
  form_id: string;
  form_hash: string;
  device_id: string | null;
  agent_id: string | null;
  enquirer_key_id: string;
  fee_amount: string;
  fee_currency: string;
  fee_account: string;
  quote_expires_at: string;
}): string {
  return JSON.stringify({
    action: "offer",
    offer_id: o.offer_id,
    form_id: o.form_id,
    form_hash: o.form_hash,
    device_id: o.device_id,
    agent_id: o.agent_id,
    enquirer_key_id: normalizeHex(o.enquirer_key_id),
    fee_amount: o.fee_amount,
    fee_currency: o.fee_currency,
    fee_account: o.fee_account,
    quote_expires_at: o.quote_expires_at,
  });
}

export function canonicalAccept(o: {
  offer_id: string;
  form_id: string;
  form_hash: string;
  device_id: string | null;
  agent_id: string | null;
  enquirer_key_id: string;
  fee_amount: string;
  fee_currency: string;
}): string {
  return JSON.stringify({
    action: "accept",
    offer_id: o.offer_id,
    form_id: o.form_id,
    form_hash: o.form_hash,
    device_id: o.device_id,
    agent_id: o.agent_id,
    enquirer_key_id: normalizeHex(o.enquirer_key_id),
    fee_amount: o.fee_amount,
    fee_currency: o.fee_currency,
  });
}

export function signOracleMessage(message: string): string {
  const raw = process.env.ORACLE_PRIVATE_KEY_PEM;
  if (!raw) throw new Error("ORACLE_PRIVATE_KEY_PEM is not set");
  const key = createPrivateKey(normalizePem(raw));
  return sign(null, Buffer.from(message, "utf8"), key).toString("hex");
}

export function verifyEnquirerSignature(
  message: string,
  enquirer_key_id: string,
  signature: string
): boolean {
  try {
    const raw = Buffer.from(normalizeHex(enquirer_key_id), "hex");
    if (raw.length !== 32) return false;
    const key = createPublicKey({
      key: { kty: "OKP", crv: "Ed25519", x: raw.toString("base64url") },
      format: "jwk",
    });
    return verify(null, Buffer.from(message, "utf8"), key, Buffer.from(normalizeHex(signature), "hex"));
  } catch {
    return false;
  }
}
