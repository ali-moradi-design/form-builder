# Handoff (2026-10-19)

Where the build stands, for a new working session. Read `CLAUDE.md`,
`docs/brief.md` and `docs/roadmap.md` first.

## Done

- 0.1–0.6 are merged (engine, renderer, builder, publish, responses, every
  0.6 field type, logic editor, calculated fields, repeaters, uploads,
  address, dynamic options).
- 0.7 so far: the embed script, `@formweave/react/remote` (`<Form formId>`),
  link/embed/React snippets in the publish dialog, and creating a form from
  a sample JSON record (`@formweave/engine/infer` + "From sample JSON"),
  and the template gallery (`/templates`: five templates with filter,
  search and a live preview; data in `apps/web/src/shared/config/gallery.ts`).

- 1.0 so far: the accessibility audit (see `docs/decisions.md`).

## Open

- Nothing open.

## Next

1. 0.7: npm publishing with Changesets. Needs an npm account and token from
   the user (`NPM_TOKEN` secret); ask before publishing.
2. 1.0: performance against budgets, docs site
   (TypeDoc), nightly demo reset, deploy pipeline (ask the user where it
   will be hosted).

## How the work is done

- Mockup first for any new screen (`docs/mockups`, `pnpm render`).
- One small PR per feature on `claude/practical-turing-eo65ee`: reset it to
  `origin/main`, commit, run every check (`pnpm format:check`, `pnpm build`,
  `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:package`,
  `pnpm size`, `node scripts/check-treeshake.mjs`, `pnpm docs:api`, and the
  Playwright tests in `apps/web` with
  `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`), push, open the PR, merge
  with a squash when CI is green.
- Add a changeset for changes to published packages. Log budget changes in
  `docs/decisions.md`.
