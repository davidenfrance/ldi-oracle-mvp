import { createHash } from "crypto";

export const BIND_10K_FORM_ID = "FS-BIND-10K-1.0";

export function bind10kFormText(): string {
  return [
    "FS-BIND-10K-1.0",
    "Identity cover up to 10,000 GENIUS USD for a purchaser that does not hold an LDE wallet.",
    "",
    "Insurer (programme name for this form): London Digital Insurance Limited,",
    "The Engine Room, Battersea Power Station, 18 The Power Station, London SW11 8BZ.",
    "Queries@LondonDigitalInsurance.com",
    "",
    "1. This form is an invitation to treat until the Enquirer signs it with the private key",
    "corresponding to enquirer_key_id and the stated premium is settled. Signature plus",
    "public key is sufficient to form this contract at this limit. It is not sufficient",
    "to obtain payment of a claim.",
    "",
    "2. Cover, once bound, indemnifies the Enquirer against recorded_controller_mismatch",
    "on the named Authenticating Device, up to 10,000 GENIUS USD, for the cover life",
    "stated in the Bind. This is not a Bind until premium is collected and a bind_id issued.",
    "",
    "3. The Enquirer need not hold an LDE wallet to purchase this band. Bands above",
    "10,000 GENIUS USD are not available under this form.",
    "",
    "4. No claim is payable until the Enquirer or its principal produces customer due",
    "diligence and anti-money laundering documents sufficient to identify the principal",
    "and any payee, and until sanctions screening of those persons is clear. The 10,000",
    "limit is a product cap. It is not a statutory UK exemption from sanctions, POCA,
    "or insurer permissions.",
    "",
    "5. English law. Courts of England and Wales.",
  ].join("\n");
}

export function bind10kFormHash(): string {
  return createHash("sha256").update(bind10kFormText(), "utf8").digest("hex");
}
