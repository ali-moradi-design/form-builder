# formcanvas: brief

Decisions from 2026-10-18. Demo 2 in notes/demos.md (form builder), now a full
product with a database (the old "stage 1 static / stage 2 database" split is
merged into one plan). Built in the public repo `ali-moradi-design/formcanvas`
in its own sessions; this file is the handoff and is safe to make public.

## How the build session starts

1. Check the prerequisites (below) and report the results before writing code.
2. Copy this brief into the repo as `docs/brief.md`.
3. Design first: make UI mockups as images (HTML/CSS mockups rendered to PNG with
   Playwright) for the main screens, show them to the user and wait for approval.
   No app code before the user approves the look.
4. Split the scope into versions (releases) with the user.
5. Build step by step in small PRs (branch → PR → CI → squash merge), explaining
   each step. The user says when to move on.

Language rules: explain in Persian, every English term inside parentheses and
backticks, never start a line with an English word, repo files in English.
Do not copy any code from the user's former employer's form builder; only the
experience is reused, everything is written from scratch.

## Prerequisites to check first

- `git --version`, `node --version` (current LTS), `pnpm --version`,
  `docker --version` (Postgres runs in Docker locally).
- The folder is a clone of `ali-moradi-design/formcanvas` (`git remote -v`),
  on `main`, clean; report what is already in the repo before changing anything.
- GitHub fetch/push works.
- An npm account exists (needed later to publish the packages); check whether the
  npm scope to use is free (for example `@ali-moradi/...`); decide the scope with
  the user.
- Playwright can run locally (mockup screenshots and E2E tests).
- Before coding, read the current docs of Zod, React Hook Form and dnd-kit
  (APIs change between major versions).

## Concept: two layers

1. Form engine: takes a JSON schema and renders a working form (validation,
   conditions, repeaters). Audience: developers. Example: a dashboard builder
   where every widget's settings form comes from a JSON schema instead of
   hand-written forms.
2. Visual builder: non-developers build the form by drag and drop; its output is
   the same JSON. Like Google Forms or Typeform.

The builder is only an editor of the schema; the engine renders it. Keeping these
layers separate is the core architecture point.

One-sentence pitch: a schema-driven form engine with a visual builder: forms are
saved, served through an API, rendered anywhere (hosted link, embed, or the npm
package), and their responses are collected, analysed and exported.

## Product flow

1. Create a form in the builder (or from a gallery template, or by pasting sample
   JSON data).
2. Publish: creates an immutable version.
3. Use it anywhere:
   - hosted link (`/f/<slug>`),
   - embed snippet for any website,
   - the npm package in another React project (`<Form formId="..." />` loads the
     schema from the API and submits to it), or only the schema JSON with the
     renderer, without the API.
4. Collect responses: validated on the server with the same engine.
5. Analyse and export: responses table, per-field summaries and charts, export
   to CSV, Excel and JSON.

## Field types (as complete as possible)

- Text: short text, long text, rich text, email, URL, phone (with country code),
  password.
- Numbers: number, currency, slider, range slider, rating (stars), NPS scale (0-10).
- Choice: select, searchable combobox, multi-select, radio group, checkbox group,
  switch, tags input, ranking (drag to order), matrix / Likert grid,
  image choice (pick from pictures).
- Color: single color picker (hex/rgb/hsl, eyedropper where supported), and a
  multi-color field: pick several colors from swatches plus custom colors, with
  min/max count.
- Date and time: date, time, date-time, date range.
- Files: file upload (type and size limits, multiple files), image upload with
  crop, signature pad.
- Structure: group, repeater (array of rows, min/max rows, nested repeaters),
  section heading, paragraph (static text), divider, page/step (multi-step forms).
- Special: hidden field (prefilled from URL or the host app), calculated field
  (formula from other fields), address group.

## Engine features

- Validation generated from the schema as a Zod validator: required, min/max,
  length, pattern, custom messages; cross-field rules; async rules (for example a
  remote uniqueness check).
- Conditional logic: show, hide, require, disable or set value based on other
  fields, with nested AND/OR conditions.
- Calculated values (for example total = quantity × price).
- Dynamic options: dependent selects (country → city) and options loaded from a URL.
- Layout: responsive column grid, sections, steps.
- Localized labels in the schema (English and Persian); RTL support.
- Schema versioning with a `schemaVersion` field and migrations.
- Infer a form from sample JSON data: string → text, number → number, ISO date →
  date, boolean → switch, nested object → group, array of objects → repeater,
  hex color → color field.
- Field registry: every field type is one self-contained entry (its settings
  schema, default value, renderer component, Zod conversion, builder settings
  panel). Adding a type means registering an entry, not changing the core
  (open/closed principle). Host apps can register their own field types.

## Builder features

- Drag and drop from a field palette onto the canvas; reorder, nest into groups
  and repeaters.
- Settings panel per field; the panel itself is rendered by the engine
  (dogfooding).
- Live preview (desktop and mobile widths, light/dark, English/Persian).
- Two-way JSON editor (Monaco) next to the builder, validated against the schema
  of the schema.
- Undo/redo, keyboard shortcuts, autosave.
- Logic editor for conditions; formula editor for calculated fields.
- Template gallery: chart widget settings (the dashboard builder use case), job
  application (multi-step, CV upload), customer onboarding (conditional fields,
  shareholder repeater), event registration, product feedback (rating, NPS).

## Responses

- Table of responses with filters (date, version, field values), detail view per
  response, uploaded files.
- Per-field summary: counts and charts for choice fields, average/min/max for
  numbers, color frequency for color fields.
- Export: CSV, Excel, JSON. Repeaters are exported as JSON columns or as extra
  rows (user's choice at export time).
- Responses are tied to the form version they were submitted with, so columns
  always match.
- Optional webhook on submit (send the response to another system).

## Architecture

```
packages/
  schema        types + the Zod schema that validates form JSON itself
  engine        pure TypeScript: schema → Zod, conditions, calculations,
                migrations, infer schema from sample data (no React)
  react         renderer: React Hook Form + field registry + default theme
apps/
  web           Next.js: builder, responses, hosted forms, REST API
```

- Packages are published to npm (ESM + type declarations, built with tsup or
  similar; versions with Changesets; publish from GitHub Actions).
  `react`, `react-hook-form` and `zod` are peer dependencies.
- The renderer must work in a host project that does not use Tailwind: ship
  compiled CSS based on CSS variables (themeable), plus an unstyled option.
  Decide the exact approach in the build session.
- `@formcanvas/engine` is framework-free and has the most unit tests.
- The web app: Next.js (App Router) with route handlers for the API. No separate
  service is needed (no cron or persistent connections in this project).
- Database: Postgres. Tables for users, forms, form versions (schema as JSONB),
  responses (data as JSONB, linked to a version), files, API keys. Uploaded files
  on a Docker volume.
- API:
  - Public: get a published form's schema; submit a response (server-side
    validation with the same engine).
  - Authenticated (session or API key): create/update forms, publish versions,
    list/export responses.
- Security: server-side validation always, rate limiting and a honeypot field
  against spam, CORS rules for embeds, file type/size checks, API keys hashed in
  the database.
- Auth: accounts for form owners plus a demo account; filling a form needs no
  login. Demo data is reset every night.
- Monorepo with Turborepo; CI: lint, typecheck, unit, build, E2E.
- Deploy: dynamic app (Docker image + Postgres), roadmap phase 8 pipeline.

## UI

- Mockups first (images), approved by the user before any code.
- Default look built on shadcn/ui and Tailwind in the web app; light and dark.
- Languages: English (default) and Persian (RTL). Logical CSS only. Persian shows
  native digits by default with a Latin-digit setting; Gregorian calendar.

## Repo

- `ali-moradi-design/formcanvas` (public), subdomain
  `formcanvas.ali-moradi-develop.com`.
- README: the two-layer idea, a schema example, how to use the npm package, how
  to embed, API overview, screenshots.
