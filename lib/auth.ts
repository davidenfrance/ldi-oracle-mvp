import {
  createPublicKey,
  createPrivateKey,
  verify,
  generateKeyPairSync,
  sign,
} from "crypto";
import type { CoverRecord } from "./types";

export function normalizeHex(value: string): string {
  return value.trim().toLowerCase().replace(/^0x/, "");
}

export function normalizePem(raw: string): string {
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  s = s.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
  if (!s.endsWith("\n")) s += "\n";
  return s;
}

function publicKeyFromHex(pubHex: string) {
  const raw = Buffer.from(normalizeHex(pubHex), "hex");
  if (raw.length !== 32) {
    throw new Error("public_key_must_be_32_byte_ed25519_hex");
  }
  return createPublicKey({
    key: { kty: "OKP", crv: "Ed25519", x: raw.toString("base64url") },
    format: "jwk",
  });
}

export function verifyKeySignature(message: string, publicKeyHex: string, signatureHex: string): boolean {
  try {
    const key = publicKeyFromHex(publicKeyHex);
    const sig = Buffer.from(normalizeHex(signatureHex), "hex");
    return verify(null, Buffer.from(message, "utf8"), key, sig);
  } catch {
    return false;
  }
}

function verifyEd25519(message: string, publicKeyHex: string, signatureHex: string): boolean {
  return verifyKeySignature(message, publicKeyHex, signatureHex);
}

export function canonicalPublishPayload(record: CoverRecord): string {
  const body = {
    record_id: record.record_id,
    device_id: normalizeHex(record.device_id),
    agent_id: record.agent_id,
    recorded_controller_name: record.recorded_controller_name,
    onboarding_complete: record.onboarding_complete,
    cover_status: record.cover_status,
    cover_purchasable: record.cover_purchasable,
    limit_band_usd: record.limit_band_usd ?? null,
    policy_reference: record.policy_reference ?? null,
    issued_at: record.issued_at,
    expires_at: record.expires_at,
    key_id: normalizeHex(record.key_id),
  };
  return JSON.stringify(body);
}

export function canonicalRevokePayload(record_id: string, key_id: string): string {
  return JSON.stringify({
    action: "revoke",
    record_id,
    key_id: normalizeHex(key_id),
  });
}

export function verifyPublishSignature(record: CoverRecord): boolean {
  if (!record.signature || !record.key_id) return false;
  const keyId = normalizeHex(record.key_id);
  if (keyId.length !== 64) return false;
  return verifyEd25519(canonicalPublishPayload(record), keyId, record.signature);
}

export function verifyRevokeSignature(
  record_id: string,
  key_id: string,
  signature: string
): boolean {
  if (!signature || !key_id) return false;
  const keyId = normalizeHex(key_id);
  if (keyId.length !== 64) return false;
  return verifyEd25519(canonicalRevokePayload(record_id, keyId), keyId, signature);
}

export function canonicalOracleIdentity(payload: {
  oracle_id: string;
  service: string;
  issued_at: string;
}): string {
  return JSON.stringify({
    oracle_id: payload.oracle_id,
    service: payload.service,
    issued_at: payload.issued_at,
  });
}

export function signOracleIdentity(payload: {
  oracle_id: string;
  service: string;
  issued_at: string;
}): { statement: string; signature: string; public_key_hint?: string } {
  const raw = process.env.ORACLE_PRIVATE_KEY_PEM;
  if (!raw) throw new Error("ORACLE_PRIVATE_KEY_PEM is not set");
  const pem = normalizePem(raw);
  const statement = canonicalOracleIdentity(payload);
  const key = createPrivateKey(pem);
  const signature = sign(null, Buffer.from(statement, "utf8"), key).toString("hex");
  return {
    statement,
    signature,
    public_key_hint: process.env.ORACLE_PUBLIC_KEY_HEX || undefined,
  };
}

export function generateWalletKeypair(): { address: string; privateKeyPkcs8Pem: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const jwk = publicKey.export({ format: "jwk" }) as { x?: string };
  const address = Buffer.from(jwk.x || "", "base64url").toString("hex");
  return {
    address,
    privateKeyPkcs8Pem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

export function signWithPem(message: string, privateKeyPem: string): string {
  const key = createPrivateKey(normalizePem(privateKeyPem));
  return sign(null, Buffer.from(message, "utf8"), key).toString("hex");
}
