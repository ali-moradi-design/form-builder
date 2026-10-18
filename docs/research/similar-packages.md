# Similar packages: what exists, what is missing

Research date: 2026-10-18. Sources: npm registry metadata (version, weekly
downloads, license, unpacked size) and a shallow clone of each repository's
default branch. Nothing from these projects is copied; this file only records
design observations so our engine and builder avoid known problems.

## Candidates

| Package | Kind | Weekly downloads | License | Last release | Notes |
|---|---|---|---|---|---|
| `@rjsf/core` (react-jsonschema-form) | JSON Schema renderer | ~692k | Apache-2.0 | 2026-09 | Most used. Themes for MUI, antd, shadcn, Mantine and more. No builder. |
| `survey-core` + `survey-creator-core` (SurveyJS) | Engine + builder | ~184k / ~83k | MIT / **commercial** | 2026-10 | Closest to our product. Creator needs a paid license. |
| `@jsonforms/core` + `@jsonforms/react` | JSON Schema + UI schema renderer | ~164k / ~124k | MIT | 2026-06 | Rule system, schema generator from data. No builder. |
| `@formio/js` + `@formio/react` | Engine + builder + hosted platform | ~26k / ~16k | MIT (platform parts paid) | 2026-10 | Full product like ours, very heavy. |
| `@autoform/react` | Zod schema → form | ~21k | MIT | 2026-07 | Schema lives in code, not JSON. |
| `@formily/react` (Alibaba) | Schema renderer | ~13k | MIT | 2025-05 | Slowing down; expressions run with `new Function`. |
| `@data-driven-forms/react-form-renderer` | Schema renderer | ~9k | Apache-2.0 | 2026-07 | Good condition model (and/or/not, set values). |
| `@react-form-builder/core` + `designer` (FormEngine) | Engine + builder | ~2.6k / ~1.7k | MIT / **commercial EULA** | 2026-10 | MobX based; designer is paid. |
| `@coltorapps/builder` | Headless builder toolkit | ~2.5k | MIT | 2025-07 | Zero deps, full-stack validation; no ready UI. |
| `@ginkgo-bioworks/react-json-schema-form-builder` | Builder for rjsf | ~2k | Apache-2.0 | 2026-09 | MUI only, small field set. |

## Observations per package

### react-jsonschema-form (rjsf)
- Strengths: standard JSON Schema, many UI themes (including shadcn), pluggable
  validators (ajv8, ata, cfworker), so the same schema validates on a server.
- Weaknesses seen in code: `Form` is a class component that keeps the whole form
  state and recomputes it (`getStateFromProps`) on every change, so large forms
  re-render as a whole. Conditional logic only through JSON Schema
  `if/then/else` and `dependencies`, which is hard for non-developers and has no
  "set value" or "disable" effects. No calculated fields, no repeater min/max UI
  beyond array keywords, no builder, no response storage.
- Lesson: JSON Schema alone is a poor authoring format for business logic. Keep
  our own form schema and *generate* a Zod (and optionally JSON Schema) validator
  from it.

### SurveyJS
- Strengths: the richest field set (matrix, ranking, signature, image picker,
  dynamic panels, rating, slider, expression question), its own expression
  language (no `eval`), Persian translation, RTL, a large test suite
  (functional, visual regression, accessibility).
- Weaknesses: the creator (builder) is commercial; `survey-core` is 64 MB
  unpacked and `survey-creator-core` 95 MB; mutable class models
  (`Question`, `PanelModel`) rather than plain data; its own JSON format that is
  not typed with TypeScript for the author; no backend (responses, export,
  analytics are separate paid products or your own job).
- Lesson: copy the *breadth* of field types and the safe expression language
  idea; stay open source end to end, keep the schema plain typed data, and keep
  the bundle small and tree-shakeable.

### JSON Forms
- Strengths: clean separation of data schema and UI schema, rules with
  `SHOW/HIDE/ENABLE/DISABLE` and `AND/OR` composition, `Generate.jsonSchema(data)`
  infers a schema from sample data.
- Weaknesses: rule effects cannot require a field or set a value; no calculated
  fields; the data generator only maps `typeof` (string/number/boolean/object)
  and does not detect dates, colors, emails or arrays of objects as repeaters;
  depends on `lodash` and `ajv`; no builder.
- Lesson: our "infer from sample data" must detect ISO dates, hex colors,
  emails, URLs and arrays of objects; our rules need `require` and `setValue`.

### Form.io
- Strengths: the most complete product (builder, renderer, API server,
  wizard, data grids, signature).
- Weaknesses seen in code: 35 runtime dependencies (`moment`, `lodash`,
  `bootstrap`, `quill`, `dragula`, `core-js`, polyfills), 24 MB unpacked;
  custom logic and templates are JavaScript strings evaluated at runtime
  (`_.template`, an `Evaluator` that can be swapped, `noeval` is opt-in), which
  is a stored-XSS risk when a form schema comes from another user; Bootstrap
  styling by default; builder uses `dragula`, which is not accessible by
  keyboard.
- Lesson: never execute author-written code. Conditions and formulas must be
  data (an AST) interpreted by a small safe evaluator. Keyboard-accessible drag
  and drop (dnd-kit) from the start.

### AutoForm
- Strengths: tiny (`@autoform/core` 30 KB), Zod first, shadcn theme.
- Weaknesses: the schema is a Zod object in source code, so it cannot be stored
  in a database, edited by a builder or sent over an API; field type inference
  covers only basic Zod types; conditions are limited.
- Lesson: our source of truth is serializable JSON; Zod is *generated* from it.

### Formily
- Strengths: fine-grained reactivity, good performance on large forms.
- Weaknesses seen in code: schema expressions (`{{ ... }}`) are compiled with
  `new Function('$root', 'with($root) { return (...) }')`, unsafe with
  untrusted schemas and blocked by strict CSP; last release 2025-05; docs mostly
  Chinese.
- Lesson: per-field subscriptions (React Hook Form `useWatch`/`useController`)
  for performance, and a CSP-safe engine (no `eval`, no `new Function`).

### Data Driven Forms
- Strengths: the best condition model in this group: nested `and`/`or`/`not`,
  many operators, and `then`/`else` actions that can show/hide and *set values*;
  many UI mappers.
- Weaknesses: built on `final-form` (less active than React Hook Form) and
  `lodash`; `set` actions may also be JavaScript functions (not serializable);
  no builder, no backend.
- Lesson: adopt a similar condition shape, but data-only so it survives JSON.

### FormEngine (optimajet)
- Strengths: engine plus visual designer, many UI kits, Persian (`fa-IR`)
  translation, repeaters, localization through Fluent.
- Weaknesses seen in code: calculated properties are JavaScript source compiled
  with `new Function('form', source)`; designer is closed under a commercial
  EULA; MobX and RSuite are required peers; 189 KB gzip core with MUI.
- Lesson: an open-source builder is a real differentiator.

### @coltorapps/builder
- Strengths: the closest *architecture* to ours: entities with attributes
  validated by Zod, a framework-free core, the same schema validated on the
  server, zero dependencies.
- Weaknesses: headless toolkit only (no field set, no UI, no drag and drop, no
  responses); low activity since 2025-07; version 0.x.
- Lesson: confirms the registry idea (each field = settings schema + validator
  + renderer). We go further by shipping the fields, the builder UI and the
  backend.

### Ginkgo react-json-schema-form-builder
- A builder on top of rjsf, MUI only, few field types, no logic editor. Shows
  the limits of building a visual editor directly on raw JSON Schema.

## Gaps none of them fill together

1. **Open source engine + builder + backend** (responses, analytics, CSV/Excel
   export, webhooks, hosted link, embed) in one MIT project. SurveyJS, Form.io
   and FormEngine split the builder or backend into paid parts.
2. **Safe logic as data**: conditions with `require`/`setValue`/`disable`,
   nested AND/OR/NOT, and formulas, all as JSON ASTs, no `eval`, CSP-safe, so a
   schema from an untrusted user is harmless.
3. **One validator on client and server**: schema → Zod, reused by the API
   route that receives responses.
4. **Typed, plain-data schema** with `schemaVersion` and migrations. Only rjsf
   and JSON Forms have some migration code; none version stored forms with
   responses tied to the version.
5. **Infer a form from sample JSON** with smart detection (ISO date, hex color,
   email, URL, arrays of objects → repeater). Only JSON Forms infers, and only
   by `typeof`.
6. **Color fields done well**: everyone offers at most a native
   `<input type="color">`; nobody has a multi-color field with swatches and
   min/max count.
7. **Persian and RTL as first-class**: logical CSS, native digits with a
   Latin-digit option, bilingual labels inside the schema.
8. **Small, framework-free core**: `form-engine` with no React and no heavy
   dependencies; renderer with React Hook Form per-field subscriptions;
   themeable CSS variables, usable without Tailwind.
9. **Accessible builder**: keyboard drag and drop (dnd-kit), screen-reader
   announcements, unlike `dragula`-based builders.
10. **Responses tied to versions** so export columns always match.

## Mistakes to avoid (checklist for our code)

- [ ] No `eval`, `new Function`, `with`, or string templates executed at
      runtime; a CSP test in E2E.
- [ ] No whole-form re-render on each keystroke; measure with a 200-field form.
- [ ] No heavy runtime dependencies (`lodash`, `moment`, UI kits) in packages.
- [ ] No JavaScript functions inside the schema; everything serializable.
- [ ] No paid-only parts.
- [ ] Bundle size budget checked in CI (for example `size-limit`).
- [ ] Accessibility tests (axe) for the renderer and the builder.
