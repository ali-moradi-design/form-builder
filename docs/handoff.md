# Handoff (2026-10-19, end of day)

Where the build stands, for a new working session. Read `CLAUDE.md`,
`docs/brief.md` and `docs/roadmap.md` first.

## Next session: plan agreed with the user

1. **Walk the user through the code from the start, step by step** (in
   Persian, one layer at a time, wait for questions before moving on). The
   order is in "Code walkthrough" below. The user is a React developer.
2. **Then do the npm work** (see "Remaining", item 1).

### Saving tokens with graphify

`graphify-out/` is git-ignored, so a fresh clone has no graph. Build it once
(AST only, no LLM tokens, about a minute):

```sh
graphify update .
```

Then, before opening files to answer a structure question, ask the graph and
open only the files it names:

```sh
graphify query "how does a submission get validated on the server" --budget 1500
```

For one known file, read it directly. Do not run semantic extraction
(`/graphify` on docs) unless the user asks. Refresh with `graphify update .`
after code changes.

### Code walkthrough (suggested order)

| Step | Topic                                                                         | Start here                                                                               |
| ---- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1    | The idea: two layers (engine + builder), one JSON document                    | `docs/brief.md`, `docs/architecture.md`                                                  |
| 2    | Monorepo and tooling: pnpm, Turborepo, CI                                     | `package.json`, `turbo.json`, `.github/workflows/ci.yml`                                 |
| 3    | The form document and its meta-schema                                         | `packages/schema/src/types.ts`, `meta.ts`                                                |
| 4    | Logic as data: the expression interpreter                                     | `packages/engine/src/expr.ts`                                                            |
| 5    | Field registry and field types                                                | `packages/engine/src/registry.ts`, `fields/`                                             |
| 6    | Compile, evaluate, validate, calculate                                        | `packages/engine/src/compile.ts`, `evaluate.ts`, `validate.ts`, `calculate.ts`           |
| 7    | i18n, Persian digits, RTL; inferring from sample JSON                         | `packages/engine/src/i18n.ts`, `infer.ts`                                                |
| 8    | React renderer: `<Form>`, store, renderers, layouts                           | `packages/react/src/Form.tsx`, `store.ts`, `fields/`                                     |
| 9    | Remote form and the embed script                                              | `packages/react/src/remote.tsx`, `apps/web/public/embed.js`                              |
| 10   | Web app structure (Feature-Sliced Design)                                     | `apps/web/src` (`shared` → `entities` → `features` → `widgets` → `views`), `app/` routes |
| 11   | Database and auth                                                             | `apps/web/src/shared/db/`, `shared/auth/`                                                |
| 12   | Builder: store, commands, undo/redo, drag and drop, JSON editor, logic editor | `apps/web/src/features/edit-form/`, `entities/form/model/`                               |
| 13   | Publishing, hosted form, public API, uploads                                  | `features/publish-form/`, `views/hosted-form/`, `app/api/forms/`                         |
| 14   | Responses, analytics, export, webhooks                                        | `entities/response/`, `views/form-responses/`, `shared/webhooks/`                        |
| 15   | Templates, demo account and its nightly reset                                 | `shared/config/gallery.ts`, `features/session/api/`                                      |
| 16   | Security: what protects what                                                  | `docs/security.md`                                                                       |
| 17   | Tests: unit, e2e, accessibility, budgets                                      | `*.test.ts`, `apps/web/e2e/`                                                             |

## Done

- 0.1–0.6 are merged (engine, renderer, builder, publish, responses, every
  0.6 field type, logic editor, calculated fields, repeaters, uploads,
  address, dynamic options).
- 0.7: the embed script, `@formweave/react/remote` (`<Form formId>`),
  link/embed/React snippets in the publish dialog, forms from a sample JSON
  record (`@formweave/engine/infer`), and the template gallery (`/templates`,
  five templates, filter, search, live preview; #35).
- 1.0 so far:
  - Accessibility audit: axe on every page in en/fa, light/dark, plus a
    keyboard pass (#36).
  - Page weight budgets for the hosted form and `embed.js` (#37).
  - Nightly demo reset: `POST /api/demo/reset` with `DEMO_RESET_TOKEN` (#38).
- Security review (`docs/security.md`, #39–#42):
  - Engine: text built by expressions is capped (`MAX_TEXT_LENGTH`), URL
    and email patterns are linear (two ways to freeze or exhaust the server).
  - Web: client address only from the proxy, streamed body limits, upload
    quotas (2 GB, 200 MB pending per form), 10,000 responses per form.
  - Public sign-up is off (`PUBLIC_SIGN_UP`); demo forms show a warning and
    are `noindex`.
  - CSP, HSTS and other headers; webhooks check addresses at connect time
    (no DNS rebinding); patched dependencies; `pnpm audit` in CI;
    `SECURITY.md`.

## Remaining

1. **npm publishing** (0.7, next after the walkthrough). Needs the user:
   - an npm account with two-factor authentication;
   - the `@formweave` scope (package names were free on 2026-10-19);
   - a granular token for that scope, saved as the `NPM_TOKEN` repository
     secret.
     Then add a release workflow (Changesets "Version packages" PR, publish
     with provenance). An earlier attempt to add the workflow was blocked by
     the session's permission check, so walk the user through it and get an
     explicit yes before adding or running anything that publishes. 23
     changesets are waiting; the first release will be 0.1.0 of each package.
2. **Deploy pipeline** (1.0): Docker image built in CI, pushed to ghcr.io,
   pulled on the VPS (see the roadmap repo's decisions); subdomain
   `form-builder.ali-moradi-develop.com`. Server setup must follow the
   checklist in `docs/security.md` and `docs/operations.md` (Nginx
   `X-Real-IP`, port on `127.0.0.1`, container memory limits, cron entry for
   the demo reset).
3. **Docs site** (1.0): the TypeDoc output (`pnpm docs:api` → `docs-site/`)
   needs a host; ask the user.
4. Possible later work (not promised): load only the renderers a form uses
   (hosted page JS, see `docs/decisions.md`); bundle Monaco instead of
   jsDelivr and use CSP nonces (`docs/security.md`, "Known limits").

## Notes from this session

- GitHub Actions had an outage on 2026-10-19; #36–#42 were merged on full
  local checks at the user's request (all green locally, including e2e).
- Force-pushing to an old branch is blocked; use a fresh `claude/*` branch
  per PR.
- The backup branch `claude/formweave-1.0-work` is no longer needed.

## How the work is done

- Mockup first for any new screen (`docs/mockups`, `pnpm render`).
- One small PR per feature on a fresh `claude/*` branch from `origin/main`.
  Before pushing run every check: `pnpm format:check`, `pnpm build`,
  `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:package`,
  `pnpm size`, `node scripts/check-treeshake.mjs`, `pnpm docs:api`,
  `pnpm audit --prod`, and the Playwright tests in `apps/web` with
  `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`. Merge with a squash.
- The user prefers merging on local checks instead of waiting for CI.
- Add a changeset for changes to published packages. Log budget changes in
  `docs/decisions.md`.
