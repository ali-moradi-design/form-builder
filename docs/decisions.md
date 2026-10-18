# Decisions

Short log of what the user agreed. Newest first.

- 2026-10-18: Product name is **formweave**; npm packages are planned as
  `@formweave/schema`, `@formweave/engine` and `@formweave/react` (scope to be
  registered when the npm account exists). Logo files are in `docs/brand`.
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
