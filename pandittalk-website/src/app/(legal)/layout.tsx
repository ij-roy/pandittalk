import LegalShell from "@/components/legal/LegalShell";
import type { ReactNode } from "react";
import "../(public)/about/information.css";

export default function LegalGroupLayout({ children }: { children: ReactNode }) {
  return <LegalShell>{children}</LegalShell>;
}
