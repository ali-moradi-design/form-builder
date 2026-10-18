# Library notes (read 2026-10-18)

Current state of the main libraries, read from their docs and the npm registry
before writing code. Re-check when a version changes.

## TypeScript

- Latest is 7.0 (the native compiler). `typescript-eslint` 8.71 supports
  TypeScript `<6.1` and TypeDoc 0.28 supports up to 6.0, so the repo pins
  **TypeScript 6.0.3**. Move to 7 when the lint and docs tools support it.
- `isolatedDeclarations` is on for package sources: every export needs an
  explicit type, which keeps declaration builds fast and the public API
  explicit.

## Build: tsdown instead of tsup

- tsdown 0.23 (Rolldown based, the Rolldown team's library bundler) builds ESM
  and `.d.ts` files fast and is the successor most of the ecosystem moved to.
  tsup 9.0 was released only days ago. The architecture doc said "tsup or
  similar"; tsdown is the choice, revisited if it causes trouble.

## Zod 4.6

- `zod/mini` is the tree-shakable functional API: about 2 KB vs 6 KB gzip for
  a tiny schema, 4 KB vs 13 KB for a small object. Checks go through
  `.check(z.minLength(5), …)`; error messages need a locale loaded with
  `z.config(…)`.
- `z.toJSONSchema()` converts to JSON Schema (used for the Monaco editor);
  `z.fromJSONSchema()` exists but is experimental.
- Decision pending (engine PR): generate validators with `zod/mini` to keep the
  engine small, and compare real bundle sizes in that PR.

## React Hook Form

- Stable 7.90; 8.0 is in beta with no published breaking-change list yet.
  Use v7.
- `@hookform/resolvers` 5.9 has `standardSchemaResolver`
  (`@hookform/resolvers/standard-schema`) and `zodResolver` for Zod 4.

## dnd-kit

- New API: `@dnd-kit/react` 0.5 (`DragDropProvider`, `useDraggable`,
  `useDroppable`, `useSortable`, helpers in `@dnd-kit/helpers`), built on the
  framework-free `@dnd-kit/dom`. Still 0.x.
- Legacy `@dnd-kit/core` 6.3 has had no release since 2024-12.
- Decide in the builder version (0.3); first check its keyboard and screen
  reader support.

## Tooling versions pinned in this repo

turbo 2.11.9, vitest 5.0.5, eslint 10.13 + typescript-eslint 8.71.2 +
eslint-plugin-jsdoc 65, prettier 3.9.10, changesets 3.0.3, size-limit 14.2,
publint 0.3.25, @arethetypeswrong/cli 0.18.5.
