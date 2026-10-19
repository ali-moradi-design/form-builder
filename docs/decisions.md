# Decisions

Short log of what the user agreed. Newest first.

- 2026-10-19: Page weight budgets (`apps/web/e2e/budgets.spec.ts`, compressed
  bytes from `next start`): the hosted form may load 240 KB of JavaScript,
  16 KB of CSS and 16 KB of HTML; `embed.js` stays under 2 KB. Measured
  today: 221 KB JS, 11 KB CSS, 11 KB HTML. About 60% of the JavaScript is
  React and Next.js; the rest is every field renderer (106 KB unpacked), Zod
  (75 KB) and the message formatter (39 KB). Next step if the budget gets
  tight: load only the renderers a form uses.
- 2026-10-19: Accessibility audit for 1.0: `e2e/a11y.spec.ts` scans every
  app page (sign-in, forms, templates, builder, publish dialog, preview,
  responses, analytics, integrations, hosted form and its embed mode, 404)
  with axe for WCAG 2.1 A/AA and best-practice rules, in English and
  Persian, light and dark, plus a keyboard-only pass of the gallery. Fixes:
  `--fw-accent-text` is #b9490a (4.8:1 on the grey frame), the preview page
  has an `h1`, the 404 page has a `main` landmark, and the web app turns off
  transitions for `prefers-reduced-motion`.
- 2026-10-19: The engine's `allFields` budget is 4 KB brotli (was 3 KB):
  the 0.6 field types (choices, uploads, address, dynamic options) took it
  just over. Single field definitions keep their 600 B budget.

- 2026-10-19: The default stylesheet budget is 4 KB gzip (was 3 KB). The
  choice fields (combobox, tags, ranking, image choice, matrix) took it to
  about 3.1 KB, and uploads, signature and address still need styles. One
  stylesheet stays simpler for users than several partial ones.

- 2026-10-19: The default stylesheet budget is 3 KB gzip (was 2.5 KB): the
  repeater's row cards and buttons need about 150 bytes, and the remaining
  0.6 fields (uploads, matrix, ranking) will need more.

- 2026-10-19: The `allRenderers` budget is 12 KB brotli (was 4, 6, then
  9 KB). It is the cost of every field type at once and grows with each one
  in 0.6 (choice fields about 1.5 KB, uploads about 2 KB); apps that care
  about size import single renderers, whose budgets stay as they are. To be
  looked at again for 1.0.

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
