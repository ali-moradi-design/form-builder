# Package architecture

Status: approved 2026-10-18. Decisions already agreed are in `docs/decisions.md`.

## Goals

- The schema is plain, serializable JSON. Nothing in it is executable.
- One engine runs everywhere: browser, Next.js route handlers, Node, edge
  runtimes. The same code validates on the client and on the server.
- Only what a field depends on re-runs when a value changes.
- Packages are small, tree-shakeable, typed, and work without Tailwind.
- New field types are added by registering a plugin, never by editing the core.

## Packages and their direction of dependency

```
form-schema  ←  form-engine  ←  form-react  ←  apps/web
 (types,         (pure TS,       (React         (Next.js,
  meta-schema)    no React)       adapter)        FSD inside)
```

Arrows point to what a package imports. Nothing imports "up". `form-engine`
never imports React; `form-schema` imports only Zod.

### `form-schema`

- TypeScript types and the Zod "meta-schema" that validates a form document.
- Exports the meta-schema as JSON Schema too, so the Monaco editor in the
  builder can validate and autocomplete.
- Every document carries `schemaVersion`. Old versions stay in the package as
  frozen types so migrations can be typed end to end.
- Conditions and formulas are stored as a small expression AST, for example
  `{ "op": "and", "args": [{ "op": "eq", "field": "plan", "value": "team" }, …] }`.
  The builder may show a text formula, but it is parsed into this AST before
  saving.

### `form-engine` (framework-free core)

Functional core: pure functions over plain data, so it is easy to test and runs
on any runtime.

- `compile(schema, registry)` → a compiled form: field index, defaults, and a
  **dependency graph** (which field reads which). Computed once per version
  and cached on the server.
- `evaluate(compiled, values, changedKeys?)` → derived state (visible,
  required, disabled, computed values, options). With `changedKeys` it walks
  only the affected part of the graph in topological order, the same idea as
  signals, without a reactive runtime.
- `toValidator(compiled, { visibleOnly })` → a Zod schema built from the
  current derived state, also exposed through the **Standard Schema** interface
  so any library that accepts Standard Schema can use it.
- `expr`: a tiny interpreter for the expression AST (comparison, logic, math,
  a fixed list of safe functions). No `eval`, no `new Function`, works under a
  strict CSP. Property-based tests check it never throws on random input.
- `migrate(doc)` → latest `schemaVersion`, as a chain of pure steps.
- `infer(sample)` → a draft schema from sample JSON (ISO date, hex color,
  email, URL, nested object → group, array of objects → repeater).
- `i18n`: picks the label for a locale with fallback, formats Persian digits.
- **Field registry**: `defineField({ type, settings, defaultValue, toZod,
dependsOn })`, where `settings` is itself a Zod schema. The builder renders a
  field's settings panel from that schema with the engine itself
  (dogfooding).
- Types: `InferValues<typeof schema>` gives the TypeScript type of the
  submitted values when the schema is written as a literal (`as const` or
  `satisfies FormDocument`).

### `form-react`

Thin adapter: state lives in React Hook Form, logic lives in the engine.

- `<Form>` creates `useForm` with a resolver built from `toValidator`.
- Each field subscribes only to the values it depends on (`useWatch` on the
  keys from the dependency graph), so typing in one field does not re-render
  the whole form.
- Two layers:
  - headless: hooks (`useField`, `useStep`, `useRepeater`) and unstyled
    components that expose `data-*` state attributes;
  - styled: an optional stylesheet built on CSS variables inside a cascade
    layer (`@layer form-builder`), so host styles always win. Logical
    properties only, so RTL works with `dir="rtl"`.
- Renderer registry: `defineRenderer("rating", Component)`. Host apps add or
  replace renderers; slots let them replace parts (label, error, help).
- `<Form formId="…" />` loads a published version from the API and posts to
  it; `<Form schema={…} />` works fully offline.
- Client boundary only where needed (`"use client"` on interactive
  components), so Next.js Server Components can import the package safely.

### `apps/web` (Feature-Sliced Design)

`app/` holds only Next.js routes and route handlers. Code lives in
`src/{shared,entities,features,widgets,views}`; the FSD `pages` layer is named
`views` to avoid a clash with Next.js. Builder state (commands, undo/redo with
patches) starts as a feature here and moves into a package only if another app
needs it. Layer rules are checked with Steiger in CI.

## Size, tree-shaking and performance

Bundle size and runtime speed are first-class requirements, checked in CI.

Tree-shaking rules for every package:

- ESM only, `"sideEffects": false`, no code runs at import time.
- Plain functions and plain objects; no classes with large prototypes, no TS
  `enum` (string unions and `as const` objects instead).
- Nothing registers itself. Field types are imported and passed in explicitly:
  ```ts
  import { createRegistry } from "@formweave/form-engine";
  import { text, email, rating } from "@formweave/form-engine/fields";
  const registry = createRegistry([text, email, rating]);
  ```
  A convenience preset (`@formweave/form-engine/fields/all`) exists, but only apps
  that import it pay for it.
- Subpath exports for optional features: `/expr`, `/infer`, `/migrate`,
  `/i18n`, `/fields/*`, and the same per renderer in `form-react`.
- Heavy renderers (rich text, signature, image crop, color picker) are loaded
  with dynamic `import()` only when the form contains that field.
- A CI test bundles "one text field" with esbuild and fails if code for other
  fields or features ends up in the output.

Budgets (min + gzip, peers excluded; tightened once real numbers exist):

| Entry                                               | Budget |
| --------------------------------------------------- | ------ |
| `form-engine` core (compile, evaluate, validator)   | 6 KB   |
| `form-engine/expr`                                  | 2 KB   |
| one basic field definition                          | 0.5 KB |
| `form-react` core (`<Form>`, hooks, headless parts) | 8 KB   |
| one basic field renderer                            | 1 KB   |
| default stylesheet                                  | 6 KB   |

Zod is a peer dependency. Zod 4 ships a smaller functional build
(`zod/mini`); whether the engine targets it is decided after reading the
current Zod docs, with a size comparison in the PR.

Performance budgets, measured with `vitest bench` on a 500-field schema:

- `compile`: under 5 ms.
- `evaluate` after one change: under 0.5 ms (walks only dependants).
- One keystroke re-renders the edited field and its dependants only; a React
  Profiler test fails on any other render.

## Documented public API (TSDoc)

Every exported function, type, interface, option and prop is documented with
TSDoc, the way well-maintained packages do, so editors show full help on hover:

```ts
/**
 * Options for {@link compile}.
 */
export interface CompileOptions {
  /**
   * Field types that may appear in the schema. A field whose `type` is not in
   * the registry makes `compile` throw a {@link SchemaError}.
   */
  registry: FieldRegistry;
  /**
   * Run {@link migrate} first when `schemaVersion` is older than the current one.
   * @defaultValue `true`
   */
  migrate?: boolean;
}

/**
 * Turns a form document into a compiled form: field index, default values
 * and the dependency graph used by {@link evaluate}.
 *
 * @param schema - A form document; it is validated against the meta-schema.
 * @param options - See {@link CompileOptions}.
 * @returns A frozen compiled form. Safe to cache per published version.
 * @throws {@link SchemaError} when the document is invalid.
 * @example
 * const form = compile(doc, { registry });
 * const state = evaluate(form, { plan: "team" });
 * @since 0.1.0
 */
export function compile(schema: FormDocument, options: CompileOptions): CompiledForm;
```

Enforced, not hoped for:

- `eslint-plugin-jsdoc` requires a comment on every export and on every
  property of exported types.
- API Extractor writes an API report per package; CI fails on undocumented
  exports (`ae-undocumented`) and on unreviewed API changes.
- TypeDoc builds the reference docs site from the same comments.

## Build and publishing

- pnpm workspaces + Turborepo; TypeScript project references.
- ESM only, `exports` map per entry, `sideEffects: false`, types next to code;
  built with tsdown (see `docs/research/library-notes.md`).
- `react`, `react-hook-form` and `zod` are peer dependencies.
- Changesets for versions; publish from GitHub Actions with npm provenance.
- CI checks: lint, typecheck, unit tests (Vitest), type tests
  (`expectTypeOf`), `publint` and `@arethetypeswrong/cli` for package shape,
  `size-limit` budgets, Playwright E2E with axe.
