import View from "@/features/reports/Reports";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report",
  description: "Your saved Pandit Talk report. Reopening it does not charge coins.",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <View id={id} />;
}
