# ReportGen

**AI business reports from your own data — in plain English.**

Upload a CSV or Excel export and ReportGen computes the real numbers first, then writes a readable narrative report around them: headline metrics, charts, insights, and forecasts. Ask follow-up questions in plain English, and export everything to PDF or Word.

The core design principle: **the AI never does arithmetic.** Every statistic is computed deterministically in code from your rows; the language model only narrates those pre-computed facts. Every chat answer also shows the exact computation behind it.

## Features

- **Datasets** — Upload CSV/XLSX (≤ 25 MB) with automatic column-type detection and data-quality warnings. Confirm or adjust detected types before saving.
- **AI reports** — Pick a focus (sales overview, monthly summary, or a custom prompt) and get a narrative report with headline metrics and auto-selected charts.
- **Chat with your data** — Plain-English questions answered through a safe, whitelisted set of aggregations (sums, averages, group-bys, trends). No arbitrary code execution. Each answer includes the computation that produced it.
- **Forecasting** — Choose a numeric metric, a date column, and a horizon; get a linear-trend projection with a confidence band and a plain-language summary.
- **Reports library** — Every report is saved and searchable; export any report to PDF or DOCX.
- **Workspace isolation** — All data is scoped per organization and every backend function is auth-checked.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Framer Motion |
| Backend & database | Convex (queries, mutations, actions), Convex Auth (email OTP + guest) |
| AI narration | LLM completion action — narrates pre-computed facts only |
| Parsing & export | PapaParse (CSV), SheetJS (XLSX), client-side PDF/DOCX generation |
| Tests | `bun test` — deterministic analytics engine suite (`tests/analytics.test.ts`) |

## Getting started

```bash
bun install

# run the Convex backend (requires a Convex account; creates a dev deployment)
bun convex dev --once

# start the frontend dev server
bun run dev
```

Environment variables:

- `VITE_CONVEX_URL` — the Convex deployment URL the frontend connects to (set at build time)
- Convex server env: `VLY_APP_NAME`, `VLY_INTEGRATION_KEY`, `VLY_INTEGRATION_BASE_URL` (AI narration)

## Testing

```bash
bun test tests/analytics.test.ts   # 27 tests covering the analytics engine
bun tsc -b --noEmit                # typecheck
bunx eslint .                      # lint
```

The analytics suite covers type coercion, statistics helpers, linear regression, outlier detection, grouping/monthly bucketing, result formatting, and the chat question → computation pipeline — the code path that guarantees reported numbers come from your data, not the model.

## Project structure

```
src/
  convex/
    analytics.ts        # deterministic stats engine (no LLM involvement)
    reportActions.ts    # report generation: compute facts → LLM narrates
    chatActions.ts      # chat: parse question → compute → LLM phrases
    forecastActions.ts  # linear-trend forecasting with confidence bands
    datasets.ts         # dataset CRUD with org scoping
    reports.ts          # report library queries/mutations
    schema.ts           # database schema (orgs, datasets, reports, chat, forecasts)
  lib/
    parse.ts            # CSV/XLSX parsing + type inference (client-side)
    export.ts           # PDF/DOCX export builders
  pages/                # Landing, Auth, Dashboard, Upload, DatasetDetail,
                        # NewReport, ReportView, ReportsLibrary, Chat
  components/           # AppShell (sidebar layout), shared UI
```

## Deployment

1. `bun convex deploy` — pushes backend functions to a production Convex deployment
2. Host the static frontend build (`bun run build` → `dist/`) on any static host (Render, Vercel, Netlify, GitHub Pages), with `VITE_CONVEX_URL` set to the production deployment URL and SPA routing configured (all paths → `index.html`)
3. Copy the Convex server env vars listed above to the production deployment (`bun convex env set ...`)
