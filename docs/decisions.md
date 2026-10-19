# Decisions

Short log of what the user agreed. Newest first.

- 2026-10-19: The default stylesheet budget is 2.5 KB gzip (was 2 KB): the
  0.6 fields (stars, NPS scale, slider, headings) need about 330 bytes more.
  JavaScript budgets are unchanged; `allRenderers` has its own 4 KB budget.

- 2026-10-19: Database: Postgres with Drizzle in production (`DATABASE_URL`).
  Without `DATABASE_URL` the app uses an embedded PGlite database, so local
  development and tests need no server. Migrations live in `apps/web/drizzle`
  and run when the app opens the database.
- 2026-10-19: New dependencies are pinned to releases at least two weeks old.
- 2026-10-19: The JSON editor loads Monaco on demand from the jsDelivr CDN, so
  it adds nothing to the app bundle.

- 2026-10-18: Accessibility fix found by axe: the faint text color of the
  mockups (`#8b9396`) fails 4.5:1 on white. The renderer uses `#666f72` (light)
  and `#93a2a5` (dark), and a darker accent `#c44f0d` for small orange text.
  The web app must use the same values.

- 2026-10-18: Product name is **formweave**; npm packages are planned as
  `@formweave/schema`, `@formweave/engine` and `@formweave/react` (scope to be
  registered when the npm account exists). Logo files are in `docs/brand`;
  the wordmark uses Comic Neue Bold.
- 2026-10-18: Every app and hosted form shows the credit "Made with ♥ by Ali
  Moradi" (Persian: «ساخته‌شده با ♥ توسط علی مرادی»).

- 2026-10-18: Package architecture in `docs/architecture.md` is approved.
  Bundle size and performance are top priorities: full tree-shaking, size
  budgets in CI, and TSDoc on every exported symbol and property.
- 2026-10-18: Hosted form design: focus mode, one question per screen
  (`06-hosted-form.png`), with the palette-strip color picker
  (`06b-hosted-form-colors.png`); mobile in `07-hosted-form-mobile-dark.png`.
- 2026-10-18: Feature-Sliced Design is used only inside `apps/web`; the npm
  packages keep their own simple structure.
- 2026-10-18: The package list from the planning step is approved (Zod, React
  Hook Form, Radix UI, dnd-kit, Monaco, zustand + zundo, Next.js, Tailwind CSS,
  shadcn/ui, next-intl, Drizzle, Better Auth, TanStack Table, Recharts, ExcelJS,
  papaparse, react-day-picker, libphonenumber-js, react-colorful,
  signature_pad, react-easy-crop, Tiptap). Exact versions are fixed after
  reading their current docs.
- 2026-10-18: Visual direction: sidebar dashboard shell, palette
  `#5f0f40 #9a031e #fb8b24 #e36414 #0f4c5c`, Geist + Vazirmatn.
- 2026-10-18: Node 24 LTS; npm account and scope are decided at the end.
- 2026-10-18: graphify is used with the AST pass only (see `CLAUDE.md`).
