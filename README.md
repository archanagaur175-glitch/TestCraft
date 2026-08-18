# TestCraft

A curriculum-aware, compliance-safe practice-test generator. Pick a board, scope
chapters and sub-topics, then sit an adaptive practice paper with instant review,
a per-question tutor, analytics and print/PDF export.

## Highlights

- **6 curricula**: CBSE, ICSE, JEE, NEET, SAT, UNIVERSITY — each with full subject /
  chapter / sub-topic trees and real exam-structure metadata.
- **Deterministic local generation** plus an optional server-side LLM lane
  (`/api/generate`, gated by `LLM_KEY`; graceful template fallback everywhere).
- **Compliance by design**: two content lanes only — synthetic (wholly
  generated in-house) and verified public-domain — each item tagged with
  `sourceType` and a provenance record. No scraped/paywalled content, ever.
- **Review**: score ring, subject breakdowns, weak spots, step-by-step
  explanations, distractor rationales and a scoped tutor chat.
- **PDF export** (jsPDF): question paper, correct-answers sheet, and full answer
  key with explanations — selectable text, page numbers, repeating headers.
- **Analytics**: readiness percentile/band, streaks, mastered-vs-weak sub-topics,
  and an auto-generated study plan.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
zustand (persisted client stores) · jsPDF + jspdf-autotable · lucide-react ·
next-themes.

## Getting started

```bash
npm install
cp .env.example .env.local   # LLM_KEY/LLM_ENDPOINT/LLM_MODEL are optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Local dev server (Turbopack) |
| `npm run build` | Production build + typecheck |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## How a paper is built

1. Scope selection → `TestDraft` (curriculum + chapters + sub-topics) persisted
   in `localStorage`.
2. `preparePaper()` mixes a seeded question bank (respecting the chosen source
   lane and difficulty mix) with generated top-ups — round-robining across every
   selected sub-topic so coverage stays uniform.
3. Generation runs through `/api/generate` (LLM with a deterministic template
   fallback), so offline/dev/limit cases never break the flow.
4. Answers are graded locally on submit, recorded into the profile store, and
   reviewed on the results page.

## Environment

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `LLM_KEY` | no | Enables the AI generation/tutor lane. Without it everything runs on the deterministic engine. |
| `LLM_ENDPOINT` | no | Chat-completions-style endpoint (default OpenAI). |
| `LLM_MODEL` | no | Model id (default `gpt-4o-mini`). |

Keys are read only in route handlers — there are no `NEXT_PUBLIC_LLM_*` values.

## Compliance

See the in-app **Sourcing & Compliance** page. In short: every question carries a
`sourceType` and an auditable provenance record; the generator receives only
topic metadata and format conventions, and reproduces no third-party text.

## Deployment (Vercel)

Works out of the box — standard Next.js server build (Route Handlers need a
Node runtime, so `output` stays unset). The repo ships a GitHub Actions workflow
(`.github/workflows/deploy.yml`) that installs the Vercel CLI, pulls the project
settings, runs a production build and deploys a prebuilt output. The deploy job
is gated on `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` being
present as repo secrets. `LLM_KEY` can be added later without any changes.