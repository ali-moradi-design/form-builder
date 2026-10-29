# formcanvas

formcanvas (repo `form-builder`): a schema-driven form engine with a visual builder. The plan and all product
decisions are in `docs/brief.md`; read it before starting new work.

## Working rules

- Files in the repo are in English. Explain to the user in Persian (see their
  personal preferences).
- Design first: UI mockups live in `docs/mockups` (`pnpm render` there). No app
  code for a screen before the user approves its mockup.
- Small PRs: branch → PR → CI → squash merge. The user says when to move on.
- Never copy code from other form libraries; `docs/research/similar-packages.md`
  lists what to learn from them and which mistakes to avoid.

## Commands

Node 24, pnpm 12. From the repo root: `pnpm install`, `pnpm build`,
`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:package`, `pnpm size`,
`pnpm format`. CI runs all of them (`.github/workflows/ci.yml`). Add a
changeset (`pnpm changeset`) for changes to published packages.

## graphify (keep token use low)

A code graph is kept in `graphify-out/` (git-ignored). It is built with the
AST pass only, so building it costs no LLM tokens.

- Before reading many files to answer a question about structure ("where is X
  used", "what depends on Y"), run `graphify query "<question>" --budget 1500`
  and open only the files it names. For one known file, just read it.
- After changing code, refresh the graph with `graphify update .` (no LLM).
- Do not run semantic extraction (`/graphify` on docs, papers or images) unless
  the user asks; the docs here are short enough to read directly.
- If `graphify-out/` is missing (fresh clone), run `graphify update .` once.
