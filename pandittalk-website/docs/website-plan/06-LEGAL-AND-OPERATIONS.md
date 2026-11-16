# Legal, privacy, support and operating requirements

This specifies content and operational work. It is not final legal text or certification of compliance. Existing documents are useful inputs, not proof that all current practices or legal obligations have been verified.

## Existing documents and facts to preserve

`src/content/legal/terms.ts` and `privacy.ts` are version 2.0, dated 31 July 2026. They cover the mobile app and website, adults with Indian phone numbers, coins, consultations, tools and account deletion. Privacy currently states that live audio/video media is not recorded by the product. Terms distinguish coin refunds from bank/UPI refunds. Do not change those facts accidentally while redesigning pages.

The privacy text identifies `support@pandittalk.com` and `grievance@pandittalk.com`. Confirm these are staffed and the named responsible entity/officer is accurate before launch. Current deletion removes/anonymizes core profile information while some operational records may remain; never promise instant deletion of every record.

## Required page contents

- **Terms, existing route:** service/entity identity; adult eligibility; account/social login; user and practitioner responsibilities; timed session scope/completion/rejoin/refund rules and legacy-booking differences; coins; paid reports; acceptable use; suspension; intellectual property; limitation and mandatory consumer rights; changes and contact.
- **Privacy, existing route:** data by feature, purpose and lawful basis/consent; processors; birth/palm data; chat and meeting metadata; cookies; payment data boundaries; international processing; security; retention; access/correction/deletion/grievance workflow; children; effective version. Do not describe all data as anonymous or all communication as end-to-end encrypted without proof.
- **Refund/cancellation:** separate recharge payment failure, duplicate charge, booked-session cancellation, Pandit unavailable, waiting timeout, early grace disconnect, mid-session disconnect, tool failure and discretionary dispute. State eligibility, coin versus original-payment destination, processing expectations and escalation. Reconcile each branch with backend code before publication.
- **Pricing policy:** coin use, paid/bonus balance treatment, expiry if any, taxes, timed service scope, approved format pricing, paid tool deliverables, changes and no automatic bank cash-out claim. Catalogue values appear on `/pricing`.
- **Disclaimer:** traditional/spiritual/informational guidance, uncertainty, customer decisions and automated tools; no guaranteed outcomes or substitute for medical, legal or financial professional care. Integrate concise contextual notices into relevant flows rather than relying solely on a footer.
- **Cookie policy:** inventory actual cookies/storage/vendors, purpose and lifetime. Necessary auth is separate from optional marketing/analytics. Build consent controls appropriate to the deployed stack and applicable jurisdiction; do not show a cosmetic cookie banner while all optional trackers load immediately.
- **Grievance redressal:** actual responsible contact, process, reference ID, escalation and legally reviewed response timelines.
- **Delete account:** authenticated path, reauthentication/confirmation, impact on active bookings and balance, retained categories and request status. Public instructions support users who cannot sign in.

## Current legal research anchors

MeitY lists final DPDP Rules 2025, the December 2025 corrigendum and an enforcement timeline. Implementation is phased; counsel must map each applicable obligation to the actual launch date. Do not use draft-rule dates as final deadlines. [MeitY final rules and timeline](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa).

India's consumer-affairs materials identify the E-Commerce Rules 2020 and dark-pattern guidelines. Have counsel confirm how the marketplace model is classified and which disclosures/processes apply. Product defaults should avoid false urgency, hidden charges and coercive choice architecture. [Consumer protection rules](https://consumeraffairs.gov.in/index.php/pages/consumer-protection-acts), [PIB announcement of dark-pattern guidelines](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1983994).

## Data handling requirements

Maintain a processing register for account/phone/avatar; birth inputs; both compatibility subjects; palm images; consultation notes and chat; session metadata; wallet/payment records; reports; notifications/preferences; support tickets; applications and analytics. For each record identify owner, purpose, location/provider, retention/deletion action and access roles. Obtain permission to use another person's birth details; do not default to collecting children's data under an adult-only service.

Version consent notices and record required acceptance server-side. Allow optional consent to be declined. Reauthentication protects destructive account actions. Export/deletion/support requests must be authorized and auditable. No sessions or palm data in replay analytics; mask personal forms and exclude private routes from session replay entirely.

## Service operations that make the brand believable

Support owns queues for payment pending/duplicate, booking conflict, failed connection, missing report, practitioner conduct, access recovery and privacy requests. Every durable request receives an ID and status. Define escalation authority and refund permissions in the existing dashboard/backend; web developers must not create a browser-only refund approval button.

Practitioner conduct: listen respectfully, acknowledge uncertainty, do not threaten harm or demand purchases to avoid it, protect confidentiality, respect agreed conversation scope and customer end choice and accept reports of misconduct. Product/editorial owners must define verification and enforcement before publishing “verified.” Paid promotional placement, if introduced, must be distinguishable from organic recommendation.

Health, finance and legal-related categories need contextual boundaries. Users describing emergencies need an appropriate locally reviewed help message, not a paid astrology upsell. Avoid presenting astrology tools as diagnosis, investment signals or legal advice.

## Publication gate

Latest-review reconciliation: define the timed scheduled and Chat Now offers around clear scope, server-provided duration, transparent totals and a customer-chosen next step, without guaranteeing an external outcome. Ensure pricing, completion, interruption/refund, fair-use and follow-up terms match backend behavior. Existing bookings retain their agreed terms. Add saved-context purpose, customer sharing controls, practitioner access and deletion/retention details to privacy notices. Do not imply that a Pandit automatically remembers or receives every past conversation.

Owner/legal review supplies entity/address, actual policy values, tax treatment, retention schedule, support hours, grievance responsibility and final wording. Publish versioned documents with dates and accessible anchors. A reviewed matrix must reconcile UI promises, policies and server behavior. Do not erase existing published documents until approved replacements exist.
