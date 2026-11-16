import type { LegalDocument } from "./types";
import { organizationName, supportEmail } from "../siteIdentity";

export const termsDocument: LegalDocument = {
  slug: "terms-and-conditions",
  title: "Terms & Conditions",
  shortTitle: "Terms",
  version: "2.0",
  effectiveDate: "31 July 2026",
  summary:
    "The rules that govern your use of the PanditTalk mobile application, website, coin wallet, consultations, and related services.",
  sections: [
    {
      id: "agreement",
      title: "1. Agreement",
      blocks: [
        {
          type: "p",
          text: `These Terms & Conditions ("Terms") govern use of the PanditTalk mobile application, website, and related services ("Services"), operated by ${organizationName}.`,
        },
        {
          type: "p",
          text: "By creating an account, completing OTP login, or using the Services, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Services.",
        },
      ],
    },
    {
      id: "eligibility",
      title: "2. Eligibility",
      blocks: [
        {
          type: "list",
          items: [
            "You must be at least 18 years old.",
            "You must be competent to contract under Indian law.",
            "You must provide accurate registration information (valid Indian mobile number).",
          ],
        },
        {
          type: "p",
          text: "We may suspend accounts used by or for persons under 18.",
        },
      ],
    },
    {
      id: "what-we-are",
      title: "3. What PanditTalk is",
      blocks: [
        {
          type: "p",
          text: "PanditTalk is a technology platform that helps users:",
        },
        {
          type: "list",
          items: [
            "Discover and book consultations with pandits/astrologers (chat, audio, or video)",
            "Use astrology-related tools (e.g. kundli/horoscope/matching, palm reading, related reports)",
            "Maintain an in-app coin wallet to pay for those services",
          ],
        },
        {
          type: "p",
          text: "Website bookings follow the app's timed booking model: the booking service supplies the available duration, format, total coin price, countdown, cancellation and refund terms. Website coin recharge may be unavailable in some account states; the website will show that state before any charge. Existing bookings and prior wallet balances keep their agreed terms.",
        },
        {
          type: "p",
          text: "PanditTalk facilitates access to consultants and tools. We do not guarantee outcomes of any reading or consultation. PanditTalk operates as a technology platform connecting users with independent consultants and tools.",
        },
      ],
    },
    {
      id: "account",
      title: "4. Account & login",
      blocks: [
        {
          type: "list",
          items: [
            "Login is via Indian mobile number + OTP.",
            "You are responsible for OTPs and activity on your account.",
            "Guest mode may allow limited browsing without login; bookings, wallet, and many tools require a logged-in account.",
            "We may suspend accounts for fraud, abuse, or illegal use.",
          ],
        },
      ],
    },
    {
      id: "consultants",
      title: "5. Consultants on the platform",
      blocks: [
        {
          type: "list",
          items: [
            "Pandits/astrologers listed on the platform are presented as service providers available through PanditTalk.",
            "Platform features may include verification/online/premium badges and session tooling (chat, audio/video, queue).",
            "Advice given in sessions is the consultant’s own. PanditTalk does not guarantee accuracy or results.",
          ],
        },
        {
          type: "p",
          text: "Users must not harass consultants or other users.",
        },
      ],
    },
    {
      id: "disclaimer",
      title: "6. Nature of services (important disclaimer)",
      blocks: [
        {
          type: "p",
          text: "Consultations, horoscopes, kundli, palm reading, vastu/spiritual guidance, and AI-assisted tool outputs are for personal / spiritual / informational guidance only.",
        },
        {
          type: "p",
          text: "They are not:",
        },
        {
          type: "list",
          items: [
            "Medical advice",
            "Mental-health treatment",
            "Legal advice",
            "Financial / investment / tax advice",
          ],
        },
        {
          type: "p",
          text: "For those matters, consult qualified licensed professionals. You alone are responsible for decisions you make.",
        },
      ],
    },
    {
      id: "coins",
      title: "7. PanditTalk Coins & payments",
      blocks: [
        {
          type: "subsection",
          title: "7.1 Coins",
          blocks: [
            {
              type: "list",
              items: [
                "The app uses PanditTalk Coins as prepaid in-app credits.",
                "Product display: 1 Coin = ₹1 for pricing convenience.",
                "Coins are for use on PanditTalk only.",
                "Coins are not bank money, are non-transferable, and generally cannot be withdrawn as cash.",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "7.2 Buying coins",
          blocks: [
            {
              type: "list",
              items: [
                "Coin packs are purchased through Razorpay (or other authorised gateways we enable).",
                "Coins are credited after successful payment verification / webhook confirmation.",
                "Card/UPI credentials are handled by the payment partner, not stored by us as card secrets.",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "7.3 Spending coins",
          blocks: [
            {
              type: "list",
              items: [
                "Coins are debited when a booking/tool charge is created (not only at session end).",
                "Scheduled sessions may use depth-based prices plus format adjustments for chat/audio/video.",
                "“Chat Now” may use a fixed coin price when a pandit is online (queue if busy) — this applies in the Android app where that flow is enabled.",
                "Tool charges (e.g. detailed reports) may also debit coins when paid unlock is enabled.",
                "On this website, scheduled bookings and Chat Now use the live booking service. If wallet recharge or a paid tool is unavailable, the website will say so before any charge is attempted.",
                "Prices are subject to change in-app.",
              ],
            },
          ],
        },
        {
          type: "subsection",
          title: "7.4 Refunds / credits",
          blocks: [
            {
              type: "p",
              text: "The product issues wallet coin refunds in supported cases, not automated bank refunds:",
            },
            {
              type: "list",
              items: [
                "Full coin refund if a session is cancelled under supported cancel paths / pandit unavailable / waiting timeout (about 10 minutes default) without start",
                "Early disconnect grace (about 90 seconds) can trigger full coin refund in supported cases",
                "Pandit-side disconnect mid-session can trigger partial coin refund",
                "Some tool failures refund the tool charge in coins",
              ],
            },
            {
              type: "p",
              text: "Purchased coin packs are otherwise non-refundable to bank/UPI except where Indian law requires otherwise or we approve a support exception.",
            },
          ],
        },
      ],
    },
    {
      id: "session-rules",
      title: "8. Session rules",
      blocks: [
        {
          type: "list",
          items: [
            "Be on time. Late join may reduce remaining session time.",
            "If you miss a session without a policy-covered cancel, coins may not be restored.",
            "Audio/video uses browser or native WebRTC; connectivity, device permissions, and network conditions on either side can affect quality.",
            "We may cancel/reschedule in exceptional cases and handle coin credit per policy.",
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "9. Acceptable use",
      blocks: [
        {
          type: "p",
          text: "You agree not to:",
        },
        {
          type: "list",
          items: [
            "Provide false identity/payment information",
            "Abuse OTP / create fake accounts",
            "Harass users or consultants",
            "Upload illegal or harmful content",
            "Reverse engineer, scrape, or attack the platform",
            "Use the Services for unlawful purposes",
          ],
        },
        {
          type: "p",
          text: "We may suspend or terminate accounts for violations. Remaining coin balances may be forfeited except where law prohibits.",
        },
      ],
    },
    {
      id: "ip",
      title: "10. Intellectual property",
      blocks: [
        {
          type: "p",
          text: "App branding, software, UI, and PanditTalk content are owned by or licensed to PanditTalk. You may not copy or redistribute without permission. Your submitted content (e.g. chat, uploads) may be processed as needed to provide the Services.",
        },
      ],
    },
    {
      id: "liability",
      title: "11. Limitation of liability",
      blocks: [
        {
          type: "p",
          text: "To the maximum extent allowed by law:",
        },
        {
          type: "list",
          items: [
            "We are not liable for decisions you make based on consultations or tool outputs",
            "We are not liable for consultant opinions",
            "We are not liable for indirect / consequential losses",
            "Our total liability for a claim is limited to the amount you paid for the specific paid service giving rise to that claim (typically the coins charged for that booking/tool)",
          ],
        },
        {
          type: "p",
          text: "Nothing in these Terms excludes liability that cannot be excluded under Indian law (including applicable consumer protections).",
        },
      ],
    },
    {
      id: "privacy",
      title: "12. Privacy",
      blocks: [
        {
          type: "p",
          text: "Personal data is handled as described in the Privacy Policy. Birth details, chat, and payment metadata are processed to provide the Services.",
        },
      ],
    },
    {
      id: "deletion",
      title: "13. Account deletion",
      blocks: [
        {
          type: "p",
          text: "You may request deletion from in-app settings. We deactivate the account and clear/anonymise core profile fields. Some booking, payment, chat, and report records may be retained for legal, fraud, accounting, or dispute reasons (see Privacy Policy).",
        },
      ],
    },
    {
      id: "changes",
      title: "14. Changes",
      blocks: [
        {
          type: "p",
          text: "We may update these Terms. Continued use after posting updates means acceptance, except where law requires fresh consent for material changes.",
        },
      ],
    },
    {
      id: "governing-law",
      title: "15. Governing law",
      blocks: [
        {
          type: "p",
          text: "These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of competent courts in India, unless mandatory law provides otherwise.",
        },
      ],
    },
    {
      id: "contact",
      title: "16. Contact",
      blocks: [
        {
          type: "list",
          items: [
            `Support: ${supportEmail}`,
            "Website: https://www.pandittalk.com",
          ],
        },
      ],
    },
  ],
};
