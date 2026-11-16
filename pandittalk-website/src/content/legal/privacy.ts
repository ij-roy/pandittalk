import type { LegalDocument } from "./types";
import { grievanceEmail, organizationName, privacyEmail, supportEmail } from "../siteIdentity";

export const privacyDocument: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  shortTitle: "Privacy",
  version: "2.0",
  effectiveDate: "31 July 2026",
  summary:
    "How PanditTalk collects, uses, shares, and protects your personal data under the Digital Personal Data Protection Act, 2023 and applicable Indian law.",
  sections: [
    {
      id: "who-we-are",
      title: "1. Who we are",
      blocks: [
        {
          type: "p",
          text: `PanditTalk is operated by ${organizationName} ("we", "us"). We provide a mobile app and related web services that connect users with pandits/astrologers for consultations and astrology tools.`,
        },
        {
          type: "list",
          items: [
            "App / site: https://www.pandittalk.com",
            "API: https://pandittalk-load-balancer.admininfo-6d6.workers.dev",
            `Support: ${supportEmail}`,
            `Privacy questions: ${privacyEmail}`,
            `Grievance Officer: ${grievanceEmail}`,
          ],
        },
        {
          type: "p",
          text: "This Privacy Policy explains how we process personal data under the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Indian law.",
        },
        {
          type: "p",
          text: "This notice is separate from our Terms & Conditions. Agreeing to Terms does not replace the need for clear privacy consent for data processing.",
        },
      ],
    },
    {
      id: "data-we-collect",
      title: "2. What personal data we collect",
      blocks: [
        {
          type: "p",
          text: "Based on how the product works today, we may process the following categories of personal data:",
        },
        {
          type: "subsection",
          title: "A. Account & identity",
          blocks: [
            {
              type: "list",
              items: [
                "Mobile number (required for OTP login; India +91 format)",
                "Name / first name / last name (profile)",
                "Email (optional)",
                "Gender, marital status (optional / profile)",
                "Profile photo (optional; stored on our media storage when uploaded)",
                "Account flags such as profile completed / active status",
                "Wallet coin balance (in-app credits)",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "B. Birth / astrology inputs",
          blocks: [
            {
              type: "list",
              items: [
                "Date of birth, time of birth, place of birth (profile and/or tool forms)",
                "Derived fields such as zodiac sign where generated",
                "Tool inputs for kundli / matching / horoscope (may include names and birth coordinates sent to astrology calculation providers)",
                "Saved report summaries / payloads you generate in-app",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "C. Palm / AI tool inputs",
          blocks: [
            {
              type: "list",
              items: [
                "Palm images you upload for palm reading (sent to an AI vision provider for analysis; not stored as a long-term palm gallery in our database today)",
                "Text prompts / readings for tools such as tarot or compatibility narratives",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "D. Consultations & communications",
          blocks: [
            {
              type: "list",
              items: [
                "Booking details (pandit, format chat/audio/video, timing, price in coins, status)",
                "Chat messages for consultation sessions (stored in our chat database)",
                "In-app notification records (booking / session / message related)",
                "We do not record or store voice/video call media in the product today (live sessions use browser or native WebRTC)",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "E. Payments",
          blocks: [
            {
              type: "list",
              items: [
                "Coin package purchases via Razorpay",
                "Payment/order identifiers, amounts, status, and wallet transaction history",
                "We do not store card numbers, UPI PINs, or bank passwords",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "F. Technical / security data",
          blocks: [
            {
              type: "list",
              items: [
                "OTP verification state (temporary, in cache)",
                "Auth session metadata (including IP address and user agent for refresh sessions on web)",
                "Rate-limit related request metadata (to prevent OTP abuse)",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "G. Guest browsing",
          blocks: [
            {
              type: "p",
              text: "You may browse some screens as a guest without creating an account. Booking, wallet, and many tools require login. Guest mode does not create a backend user by itself.",
            },
          ],
        },
        {
          type: "subsection",
          title: "H. What we do not currently collect",
          blocks: [
            {
              type: "list",
              items: [
                "Marketing email newsletters",
                "Server-side marketing push (device reminders today are largely local on-device)",
                "Call recordings",
                "Contacts list / precise always-on location tracking as a product feature",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "purposes",
      title: "3. Why we use your data",
      blocks: [
        {
          type: "table",
          headers: ["Purpose", "Examples"],
          rows: [
            [
              "Account & security",
              "OTP login, session management, fraud/abuse prevention",
            ],
            [
              "Profile & astrology services",
              "Kundli, horoscope, matching, palm/tarot tools",
            ],
            [
              "Consultations",
              "Match you with a pandit; chat / audio / video session",
            ],
            [
              "Payments & wallet",
              "Coin recharge, debit for bookings/tools, in-app refunds",
            ],
            [
              "Support & operations",
              "Respond to support requests; investigate failures",
            ],
            [
              "Legal compliance",
              "Retain transaction/booking records where required",
            ],
          ],
        },
        {
          type: "p",
          text: "We process data based on: your consent, performance of the service you request, and compliance with law.",
        },
      ],
    },
    {
      id: "sharing",
      title: "4. How we share data",
      blocks: [
        {
          type: "p",
          text: "We do not sell personal data. We use service providers to run the product:",
        },
        {
          type: "table",
          headers: ["Provider", "Role", "Typical data involved"],
          rows: [
            ["MSG91", "OTP SMS delivery", "Phone number, OTP"],
            [
              "Razorpay",
              "Payment processing",
              "Payment amount, order/payment IDs (card data handled by Razorpay)",
            ],
            [
              "AWS",
              "Hosting, database, file storage, chat storage, and live-session connectivity infrastructure",
              "Account/profile data, chat messages, avatars, live session connectivity",
            ],
            [
              "Prokerala",
              "Astrology calculations / charts",
              "Birth details and related calculation inputs",
            ],
            [
              "OpenAI",
              "AI analysis for selected tools (e.g. palm image analysis, narrative text)",
              "Images/text you submit for that tool",
            ],
            [
              "Redis / cache infrastructure",
              "Temporary OTP and operational caches",
              "Short-lived auth/ops data",
            ],
          ],
        },
        {
          type: "p",
          text: "Consultants (pandits) you book may see information needed for the session (for example relevant profile/booking context and chat during the consultation).",
        },
        {
          type: "p",
          text: "We may disclose data if required by law or lawful government request.",
        },
      ],
    },
    {
      id: "cookies",
      title: "5. Cookies / similar technology",
      blocks: [
        {
          type: "list",
          items: [
            "Dashboard / web: an httpOnly refresh-session cookie may be used to keep you signed in.",
            "We do not currently run a first-party analytics cookie suite as a core product feature.",
            "Mobile apps use secure on-device token storage rather than that web cookie.",
          ],
        },
      ],
    },
    {
      id: "retention",
      title: "6. Retention",
      blocks: [
        {
          type: "p",
          text: "We keep data only as long as needed for the purposes above, including:",
        },
        {
          type: "list",
          items: [
            "Active account data while your account is open",
            "Booking, wallet, and payment records for accounting, dispute, and fraud prevention",
            "Chat messages for the related consultation history",
            "Temporary OTP data for a short period (minutes)",
          ],
        },
        {
          type: "p",
          text: "When you delete your account in-app, we deactivate the account and remove/anonymise core profile fields (including replacing the phone number so it cannot be reused on that row). Some operational records (bookings, transactions, saved reports, chat history) may remain for legitimate/legal reasons.",
        },
      ],
    },
    {
      id: "security",
      title: "7. Security",
      blocks: [
        {
          type: "p",
          text: "We use reasonable technical and organisational measures appropriate to our stack (encrypted transport, authenticated APIs, hashed OTPs/sessions, cloud access controls). No method of transmission or storage is 100% secure.",
        },
      ],
    },
    {
      id: "rights",
      title: "8. Your rights (DPDP)",
      blocks: [
        {
          type: "p",
          text: "Subject to applicable law, you may:",
        },
        {
          type: "list",
          items: [
            "Access information about your personal data",
            "Correct / update inaccurate data (profile settings)",
            "Request erasure / account deletion (in-app: Settings → Delete Account)",
            "Withdraw consent (may limit features that need that data)",
            "Nominate another person to exercise rights where the law allows",
            "Raise a grievance with our Grievance Officer",
          ],
        },
        {
          type: "p",
          text: `Consent withdrawal / rights requests: email ${supportEmail} or the grievance contact below. Under DPDP Rules, withdrawal of consent should be as easy as giving it.`,
        },
        {
          type: "p",
          text: "You may also have the right to approach the Data Protection Board of India as provided under the Act/Rules.",
        },
      ],
    },
    {
      id: "children",
      title: "9. Children",
      blocks: [
        {
          type: "p",
          text: "PanditTalk is intended for users 18+. We do not knowingly offer accounts to children. If you believe a minor created an account, contact us and we will take steps to close it.",
        },
      ],
    },
    {
      id: "international",
      title: "10. International processing",
      blocks: [
        {
          type: "p",
          text: "Some providers (for example AI or cloud subprocessors) may process data on servers outside India. Where that happens, we rely on contractual/security arrangements consistent with applicable law.",
        },
      ],
    },
    {
      id: "grievance",
      title: "11. Grievance Officer",
      blocks: [
        {
          type: "p",
          text: "For privacy and data-protection grievances under applicable law:",
        },
        {
          type: "list",
          items: [
            `Email: ${grievanceEmail}`,
            `Privacy questions: ${privacyEmail}`,
            `Alternate support: ${supportEmail}`,
          ],
        },
        {
          type: "p",
          text: "We aim to acknowledge and resolve grievances within the timelines required under applicable law and rules.",
        },
      ],
    },
    {
      id: "changes",
      title: "12. Changes",
      blocks: [
        {
          type: "p",
          text: "We may update this Policy. Material changes will be shown in the app/website. Where required, we will ask for fresh consent.",
        },
      ],
    },
    {
      id: "contact",
      title: "13. Contact",
      blocks: [
        {
          type: "list",
          items: [
            `Privacy / data questions: ${privacyEmail}`,
            `Grievance Officer: ${grievanceEmail}`,
            `General support: ${supportEmail}`,
            "Website: https://www.pandittalk.com",
          ],
        },
      ],
    },
  ],
};
