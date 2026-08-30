import { createHash } from "crypto";

export const BIND_1M_FORM_ID = "FS-BIND-1M-1.0";

export function bind1mFormText(): string {
  return `FS-BIND-1M-1.0

Binding contract of identity insurance

Limit: 1,000,000 GENIUS USD. The purchaser must hold an LDE wallet. Claims require full due diligence.

London Digital Insurance Limited (the Company)

The Engine Room, Battersea Power Station, 18 The Power Station, London SW11 8BZ

Queries@LondonDigitalInsurance.com

Governing law: England and Wales. Form date: 30 August 2026. This form is intended to be read and, if necessary, construed by a solicitor and counsel in England and Wales.

A. Purpose of this form

This form is a contract of identity insurance for band b-1m. It is not form FS-QF-1.2 and it is not form FS-BIND-10K-1.0. Payment of a query or gate fee does not buy this cover. This form is sent to the Enquirer before the Enquirer signs. No Bind exists until the Enquirer has signed this form with the private key of its LDE wallet (purchaser_lde_wallet_key_id), the Company has verified that signature against form_id and form_hash, and premium settlement has been accepted on the rail named in the Bind offer.

B. Defined terms

Authenticating Device: the device or system under a person's exclusive control that can authenticate an instruction given by that person or by software acting for that person.

Recorded Controller: the person recorded as entitled to exclusive legal control of the Authenticating Device (including the right to authorise or revoke software that gives instructions through it). Physical possession may be with that person or with a custodian they appointed. Ownership of underlying assets is a separate question.

Subject Device: the Authenticating Device named in the Bind offer, identified by its device public key (device_id).

Confirmation: the Company's signed statement, issued after FS-QF-1.2 acceptance, of what its records then showed about the Subject Device.

Enquirer: the person (including a person acting through software) who signs this form through an LDE wallet.

LDE wallet: an Authenticating Device issued under the London Digital Escrow verification process, whose controller is a Recorded Controller.

Bind: the Company's acceptance of this form, recorded as a bind_id or, on the MVP rail only, an mvp_bind_id.

Cover Period: the period beginning at bound_at or cover_starts_at and ending at cover_ends_at. Unless the Bind states a shorter period, that period is 24 hours.

Claims Window: unless the Bind states otherwise, 90 days from reliance_at.

Insured Event: recorded_controller_mismatch, as defined in clause D.

Limit: 1,000,000 GENIUS USD in the aggregate for this Bind.

Premium: the amount stated in the Bind offer for band b-1m. It is not printed as a fixed figure in this form so that the Company may change the price by issuing a new offer under the same form number.

MVP rail: lde_mvp_settlement using asset GENIUS_USD_MVP. That rail is not a payment of GENIUS USD and is not a payment of United States dollars. An mvp_bind_id issued after a signed acceptance on the MVP rail is an MVP Bind only.

C. Parties and how the contract is made

The parties are the Company and the Enquirer. The Recorded Controller of the Subject Device is not a party. A listing on LDEDI is not a party.

The contract is made only when all of the following have happened:

the Company has offered band b-1m under this form, stating premium, currency or MVP asset, Subject Device, quote expiry, Cover Period and Claims Window;

the Enquirer has been given the full text of this form (form_text) and its hash (form_hash);

the Enquirer has signed a durable electronic acceptance that refers to this form_id, that form_hash, the Subject Device, purchaser_lde_wallet_key_id, premium and limit, using the private key of that LDE wallet;

the Company has verified that signature against that public key and has verified that form_hash matches this wording; and

either the Premium has been received in cleared GENIUS USD, or the Company has accepted an MVP settlement receipt under rail lde_mvp_settlement.

If any of those steps fails, there is no Bind and no cover. A signature without accepted settlement is not cover. An unsigned menu of bands is an invitation to treat only.

D. What is covered

Subject to the Limit, the exclusions, and the conditions precedent, the Company will indemnify the Enquirer for Proven Loss caused by an Insured Event that occurs during the Cover Period.

The Insured Event is recorded_controller_mismatch. That event occurs only if all of the following are true:

during the Cover Period the Enquirer relied on a Confirmation issued by the Company for the Subject Device;

that Confirmation stated that the Subject Device was linked to a named Recorded Controller, or stated other verified identity attributes that the protocol permitted;

at the time of that reliance, the person who in fact had exclusive legal control of the Subject Device was not the Recorded Controller stated in the Confirmation, or the stated attribute was false in a material respect; and

the Enquirer can prove that mismatch by evidence a court in England and Wales would admit.

Proven Loss means only consideration in GENIUS USD actually paid by the Enquirer to a third party in a transaction entered because of that reliance, and irrecoverable legal costs reasonably incurred in England and Wales to establish the mismatch, less any sum recovered from any other person. Proven Loss does not include expected profit, lost opportunity, reputational harm, or the cost of the Premium or the query fee.

An MVP Bind does not create a duty to pay United States dollars. Any indemnity on an MVP Bind, if payable at all, is determined as if the Premium had been GENIUS USD, and remains subject to clause G.

E. What is not covered

This contract does not cover a listing that was never the subject of a Confirmation; a Confirmation that stated cover_status none or found false; a mismatch the Enquirer already knew or ought reasonably to have known; a change in Recorded Controller after the Cover Period; the quality of any professional service listed on LDEDI; failure to pay or insolvency of a counterparty; loss of keys or hardware; a payment sent to the wrong address; protocol or chain failure; foreign exchange; any amount above 1,000,000 GENIUS USD; any band other than b-1m; fraud or illegality by the Enquirer; sanctions or criminal property; a claim notified after the Claims Window; or a claim where clause G documents are not produced.

F. Conditions precedent to cover

This form was signed as set out in clause C and settlement was accepted before reliance. Reliance occurred during the Cover Period on a Confirmation that was still current. The Enquirer kept the Confirmation, this form, form_hash, the signature record and a reconstructable transaction log. Notice of circumstances was given inside the Claims Window to Queries@LondonDigitalInsurance.com.

G. Conditions precedent to payment of a claim

No sum is payable until the Enquirer or its principal has produced full legal identity of the principal, government-issued identification or constitutional documents, authority of the Enquirer software, identity of every proposed payee, a source-of-funds explanation for Proven Loss, and a clear sanctions screen of the principal and every proposed payee. The Company may refuse payment if those documents are not produced or if payment would be unlawful.

H. Premium and other insurance

The Premium is earned when settlement is accepted. The Limit is 1,000,000 GENIUS USD for this Bind. If other insurance also responds, this Bind is excess of that other insurance unless that other insurance is written as excess of this Bind.

I. Law and jurisdiction

This form is governed by the law of England and Wales. The courts of England and Wales have exclusive jurisdiction, except that the Company may take enforcement proceedings wherever the Enquirer or a payee can be found.

J. Entire agreement

This form, the Bind offer, the signed acceptance, the settlement receipt, and the Confirmation relied upon are the entire contract for band b-1m. FS-QF-1.2 is not this contract. FS-BIND-10K-1.0 is not this contract. A LAN listing is not this contract.

K. Signing block (machine)

The Enquirer signs by returning a signature over the canonical accept body that includes: form_id FS-BIND-1M-1.0; form_hash of this wording; band_id b-1m; device_id of the Subject Device; purchaser_lde_wallet_key_id; premium_usd; limit_usd; asset; rail; not_genius_usd where the MVP rail is used. The Company treats that signature as the Enquirer's execution of every clause above.`;
}

export function bind1mFormHash(): string {
  return createHash("sha256").update(bind1mFormText(), "utf8").digest("hex");
}
