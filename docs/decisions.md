# Decisions

Short log of what the user agreed. Newest first.

- 2026-10-18: Feature-Sliced Design is used only inside `apps/web`; the npm
  packages keep their own simple structure.
- 2026-10-18: The package list from the planning step is approved (Zod, React
  Hook Form, Radix UI, dnd-kit, Monaco, zustand + zundo, Next.js, Tailwind CSS,
  shadcn/ui, next-intl, Drizzle, Better Auth, TanStack Table, Recharts, ExcelJS,
  papaparse, react-day-picker, libphonenumber-js, react-colorful,
  signature_pad, react-easy-crop, Tiptap). Exact versions are fixed after
  reading their current docs.
- 2026-10-18: Visual direction: sidebar dashboard shell, palette
  `#5f0f40 #9a031e #fb8b24 #e36414 #0f4c5c`, Geist + Vazirmatn. The hosted form
  page is being chosen from four variants (`docs/mockups/png/06a`–`06d`).
- 2026-10-18: Node 24 LTS; npm account and scope are decided at the end.
- 2026-10-18: graphify is used with the AST pass only (see `CLAUDE.md`).
