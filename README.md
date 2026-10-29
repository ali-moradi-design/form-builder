<p align="center"><img src="docs/brand/formcanvas-logo.svg" alt="formcanvas" height="56"></p>

A schema-driven form engine with a visual builder. Forms are saved, served
through an API, rendered anywhere (hosted link, embed, or the npm package), and
their responses are collected, analysed and exported.

Work in progress.

## What is in the repo

A pnpm monorepo:

| Path              | What it is                                                                    |
| ----------------- | ----------------------------------------------------------------------------- |
| `packages/schema` | `@formcanvas/schema`: form document types and their validation (Zod).         |
| `packages/engine` | `@formcanvas/engine`: the framework-free form engine (values, rules, checks). |
| `packages/react`  | `@formcanvas/react`: React components that render a form.                     |
| `apps/web`        | The app (Next.js): builder, hosted forms, responses, REST API.                |
| `apps/playground` | A small Vite app for trying the packages.                                     |
| `docs/mockups`    | UI mockups (`pnpm render` there).                                             |

## Setup

You need Node 24 and pnpm 12. With Corepack (ships with Node) the right pnpm
version is picked from `package.json`:

```bash
corepack enable
```

Install, then build the packages once (the apps use their `dist` folders):

```bash
pnpm install
pnpm --filter "./packages/*" build
```

pnpm warns that build scripts of `esbuild`, `@swc/core` and `@parcel/watcher`
were ignored. That is on purpose (see `pnpm-workspace.yaml`); nothing needs
them.

### Run the app

```bash
pnpm --filter @formcanvas/web dev
```

Open http://localhost:3000 and choose "Try the demo account" on the sign-in page. The
demo account is created with sample forms and responses.

- No database server is needed: without `DATABASE_URL` the app uses an
  embedded Postgres (PGlite) in `apps/web/.data/pglite`. Delete that folder to
  start over.
- No environment variables are needed in development. To silence the Better
  Auth base URL warning, or to allow sign-up, create `apps/web/.env.local`:

  ```bash
  BETTER_AUTH_URL=http://localhost:3000
  PUBLIC_SIGN_UP=on
  ```

- After changing a package, build it again so the app picks it up.

All environment variables are listed in `docs/operations.md`.

### Run the playground

```bash
pnpm --filter @formcanvas/playground dev
```

## Checks

From the repo root (CI runs all of them):

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm check:package
pnpm size
pnpm e2e
```

Add a changeset (`pnpm changeset`) for changes to published packages.

## Docs

- `docs/brief.md`: the product plan
- `docs/architecture.md`: how the packages fit together
- `docs/roadmap.md`: versions
- `docs/decisions.md`: decisions made so far
- `docs/operations.md`: running the app on a server
- `docs/mockups/png`: approved UI mockups

Made with ♥ by Ali Moradi.
