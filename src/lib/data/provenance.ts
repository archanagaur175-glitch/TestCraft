import type { Provenance } from "@/lib/types";

export const SYNTHETIC_PROVENANCE: Provenance = {
  source: "TestCraft curriculum-grounded generation engine",
  citation:
    "Generated in-house by the TestCraft template engine from topic/skill metadata. No third-party question text used as seed.",
  license: "TestCraft synthetic items — free for educational, non-commercial use",
  permittedUse:
    "Original, wholly generated items. May be freely reused for personal study and teaching.",
  reviewedAt: "2026-08-18",
  status: "generated-in-house",
};

export const PUBLIC_DOMAIN_ITEMS: Provenance[] = [
  {
    source: "Officially released classic problem patterns (mathematical facts)",
    citation:
      "Foundational mathematical problems whose formulations are standard/uncopyrightable facts (e.g., quadratic roots, Pythagoras applications), consistent with public-release practice.",
    license: "Public domain — mathematical facts and standard formulations",
    permittedUse:
      "Freely usable. Statement and solution reflect standard mathematical content with no creative third-party expression reproduced.",
    retrievedAt: "2026-08-01",
    reviewedAt: "2026-08-18",
    status: "verified-public",
  },
];

export const PUBLIC_DOMAIN_NOTE =
  "The public-domain lane contains only items whose public-release status and permitted use are confirmed and recorded per-item. Any item without verifiable provenance is excluded by policy.";

export const COMPLIANCE_FAQS = [
  {
    q: "Where do TestCraft questions come from?",
    a: "Two lanes only: (1) synthetic items wholly generated in-house from curriculum metadata and exemplar style — never seeded with copyrighted question text — and (2) public-domain / officially released items whose provenance and permitted-use are recorded per item. Scraped or copied proprietary question banks are prohibited.",
  },
  {
    q: "Do you ingest coaching-institute or publisher question banks?",
    a: "No. No paywalled, scraped, or proprietary test-prep content enters the system. The only external lane is officially released material with confirmed public-use status.",
  },
  {
    q: "How is compliance auditable?",
    a: "Every item carries a sourceType ('synthetic' or 'public-domain') and, where applicable, a provenance record: source, citation, license, retrieval date, review status. A per-item boundary is always inspectable in the data layer.",
  },
  {
    q: "How does the synthetic generator avoid reproducing copyrighted content?",
    a: "The generator receives only topic/skill descriptions, command-word styles and format conventions. It produces original stems, distractors with plausible-reasoning rationales, correct answers and step-by-step explanations from scratch. Verbatim third-party text is never used as seed.",
  },
];