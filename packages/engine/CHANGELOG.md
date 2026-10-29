# @formcanvas/engine

## 0.1.0

### Minor Changes

- adb3a26: Add the `address` field and dynamic options. Choice fields take `optionsBy` (lists picked by another answer, checked on the server too) and `optionsUrl` (lists loaded by the browser). Field definitions can declare `reads` and `options`; `FieldState.options` holds the current list. Renderers clear answers that leave the list.
- d7bf3b0: Add calculated values. Any field can have a `calculate` expression; the engine works out calculated fields in dependency order (`CompiledForm.calculated`, `calculateValues`), rejects fields calculated from themselves, makes them read-only, lets conditions read them, and replaces sent values when validating. New `calculated` field type and renderer (number, currency or percent). Calculations inside repeater rows read the same row.
- 8d16a98: Add `combobox`, `multiSelect`, `tags`, `ranking`, `imageChoice` and `matrix` fields with renderers. New issue codes `incompleteRanking` and `incompleteRows`. Picture URLs must be `https://` or a same-site path.
- 4d8c03f: Add `color` and `colorSet` fields, with `normalizeHex` and `DEFAULT_SWATCHES`. The colour set keeps the chosen order, checks min/max counts and duplicates, and offers swatches and the browser eyedropper where it exists.
- fe27c8d: Add the engine core: `defineField` and `createRegistry` for field types, `compile` (field index, defaults, dependency graph, `SchemaError`) and `evaluate` (visible, required and disabled state, with incremental updates that reuse unchanged objects). Add the first field types in `@formcanvas/engine/fields`: shortText, longText, email, number, select, radio, checkboxes, switch, date and group, plus `allFields` in `@formcanvas/engine/fields/all`.
- a2830f1: Add `@formcanvas/engine/infer`: `inferFields`, `inferForm` and `labelFromKey` build form fields from a sample JSON record (text, email, URL, phone, dates, colours, numbers, switches, groups, repeaters, tags and colour sets).
- 5745cb9: Add `dateRange`, `rangeSlider` and `currency` fields, with `currencyDigits` and the `Range` value type. New issue codes `incompleteRange`, `invalidRange` and `tooManyDecimals`; refinements can now pass `{min}`/`{max}` to messages.
- d5af76e: The packages are renamed from `@formweave/*` to `@formcanvas/*`. The stylesheet's classes and variables now start with `fc-` instead of `fw-` (for example `.fc-form` and `--fc-accent`).
- b925fcb: Add the `repeater` field: a list of rows made of its child fields, with `minRows`, `maxRows` and `rowLabel`. Each row is checked as a form of its own (conditions read the same row), issues inside rows use paths such as `people.0.name`, and repeaters can be nested. New `rows` flag on field definitions, `CompiledField.rows`, and the `RowsApi` prop for row renderers.
- db06fc0: New field types: `url`, `phone` (with `normalizePhone`), `time`, `dateTime`, `rating`, `nps`, `slider`, `hidden`, and the display-only `heading`, `paragraph` and `divider`. `allFields` includes them; `richRenderers` and `allRenderers` draw them. In the focus layout hidden fields and dividers get no page of their own.
- 0a89ca0: Add the safe expression interpreter (`@formcanvas/engine/expr`): `evalExpression`, `readsFields` and `truthy`. It never throws, never runs code, short-circuits `and`/`or`/`if`, stops at a depth limit, and only accepts operators from the allow-list (including names like `constructor`).
- f9d885b: Add `file`, `imageUpload` and `signature` fields. Values are `FileRef`s; files are stored by the new `upload` prop of `<Form>` (`UploadFile`), with progress. Image uploads are cropped and scaled in the browser; signatures can be drawn or typed. New `acceptsFile` helper and issue codes `fileTooBig`, `fileType` and `fileMissing`.
- b1b8a31: Add `validate` (same rules in the browser and on the server; hidden and empty optional fields are dropped, one coded issue per field, single-step checks) and `toStandardSchema` for libraries that accept Standard Schema. Add `@formcanvas/engine/i18n` (`resolveText`, `isRtl`, `formatNumber` with native or Latin digits, `localizeDigits`, `normalizeDigits`) and `@formcanvas/engine/messages` with English and Persian messages and `formatIssue`.

### Patch Changes

- d21ad2b: Fixes for host apps: `className` now adds to `fc-form` instead of replacing it (#44); a new `theme` prop (`"light" | "dark" | "system"`), and without it the stylesheet follows an ancestor's `data-theme` before the operating system (#45); choice fields accept numbers and `true`/`false` as their option text, show them as selected and no longer clear them, and a required select with an answer drops the empty choice (#46).
- cbf5b43: Harden validation against hostile input: text built by expressions (`concat`) is capped at `MAX_TEXT_LENGTH` (10,000 characters), so chained calculated fields can no longer exhaust memory, and the URL check (and email detection in `infer`) now runs in linear time on long values.
- 82f798e: Each package has a README with examples, a license file and npm metadata (keywords, homepage, provenance). `createRegistry` now accepts single field types and custom types defined with `defineField` (before, only `allFields` type-checked); the new `AnyFieldDefinition` type names "any field definition".
- 237d689: The repository moved to `ali-moradi-design/formcanvas`. Package metadata and the JSON Schema `$id` now point there.
- 2ee058a: Ship one output file per source module so bundlers drop unused field types; importing one field now costs about 230 B.
- Updated dependencies [d7bf3b0]
- Updated dependencies [0c94d7d]
- Updated dependencies [824dfad]
- Updated dependencies [82f798e]
- Updated dependencies [d5af76e]
- Updated dependencies [237d689]
- Updated dependencies [2ee058a]
  - @formcanvas/schema@0.1.0
