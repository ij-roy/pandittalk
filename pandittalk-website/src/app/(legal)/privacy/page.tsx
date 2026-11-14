import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { privacyDocument } from "@/content/legal/privacy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Pandit Talk collects, uses, shares, and protects your personal data under the DPDP Act and applicable Indian law.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy · Pandit Talk",
    description:
      "How Pandit Talk collects, uses, shares, and protects your personal data.",
    url: "/privacy",
    type: "website",
  },
};

export default function PrivacyPage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
