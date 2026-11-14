export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "note"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "subsection"; title: string; blocks: LegalBlock[] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  slug: "privacy" | "terms-and-conditions";
  title: string;
  shortTitle: string;
  version: string;
  effectiveDate: string;
  summary: string;
  sections: LegalSection[];
};
