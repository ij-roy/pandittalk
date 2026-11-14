import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { termsDocument } from "@/content/legal/terms";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms governing use of the Pandit Talk app, website, coin wallet, consultations, and related services.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
  openGraph: {
    title: "Terms & Conditions · Pandit Talk",
    description:
      "Terms governing use of the Pandit Talk app, website, coin wallet, and consultations.",
    url: "/terms-and-conditions",
    type: "website",
  },
};

export default function TermsPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
