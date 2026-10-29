# @formcanvas/schema

## 0.1.0

### Minor Changes

- d7bf3b0: Add calculated values. Any field can have a `calculate` expression; the engine works out calculated fields in dependency order (`CompiledForm.calculated`, `calculateValues`), rejects fields calculated from themselves, makes them read-only, lets conditions read them, and replaces sent values when validating. New `calculated` field type and renderer (number, currency or percent). Calculations inside repeater rows read the same row.
- 0c94d7d: Add the form document format: `FormDocument`, `Step`, `FieldNode`, `LocalizedText` and the `Expression` AST with an operator allow-list. `@formcanvas/schema/meta` adds the Zod (`zod/mini`) meta-schema and `parseFormDocument`, which also checks unique keys, unknown field references and locales.
- 824dfad: Ship the JSON Schema of a form document as `@formcanvas/schema/schema.json`, for editors such as Monaco or VS Code.
- d5af76e: The packages are renamed from `@formweave/*` to `@formcanvas/*`. The stylesheet's classes and variables now start with `fc-` instead of `fw-` (for example `.fc-form` and `--fc-accent`).

### Patch Changes

- 82f798e: Each package has a README with examples, a license file and npm metadata (keywords, homepage, provenance). `createRegistry` now accepts single field types and custom types defined with `defineField` (before, only `allFields` type-checked); the new `AnyFieldDefinition` type names "any field definition".
- 237d689: The repository moved to `ali-moradi-design/formcanvas`. Package metadata and the JSON Schema `$id` now point there.
- 2ee058a: Ship one output file per source module so bundlers drop unused field types; importing one field now costs about 230 B.
