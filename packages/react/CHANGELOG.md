# @formcanvas/react

## 0.1.0

### Minor Changes

- adb3a26: Add the `address` field and dynamic options. Choice fields take `optionsBy` (lists picked by another answer, checked on the server too) and `optionsUrl` (lists loaded by the browser). Field definitions can declare `reads` and `options`; `FieldState.options` holds the current list. Renderers clear answers that leave the list.
- d7bf3b0: Add calculated values. Any field can have a `calculate` expression; the engine works out calculated fields in dependency order (`CompiledForm.calculated`, `calculateValues`), rejects fields calculated from themselves, makes them read-only, lets conditions read them, and replaces sent values when validating. New `calculated` field type and renderer (number, currency or percent). Calculations inside repeater rows read the same row.
- 8d16a98: Add `combobox`, `multiSelect`, `tags`, `ranking`, `imageChoice` and `matrix` fields with renderers. New issue codes `incompleteRanking` and `incompleteRows`. Picture URLs must be `https://` or a same-site path.
- 4d8c03f: Add `color` and `colorSet` fields, with `normalizeHex` and `DEFAULT_SWATCHES`. The colour set keeps the chosen order, checks min/max counts and duplicates, and offers swatches and the browser eyedropper where it exists.
- 131bcc5: Add `layout="focus"`: one question per page with a progress bar and a localized question counter; Enter or OK confirms and validates only that question. Labels gain `ok` and `question`.
- d21ad2b: Fixes for host apps: `className` now adds to `fc-form` instead of replacing it (#44); a new `theme` prop (`"light" | "dark" | "system"`), and without it the stylesheet follows an ancestor's `data-theme` before the operating system (#45); choice fields accept numbers and `true`/`false` as their option text, show them as selected and no longer clear them, and a required select with an answer drops the empty choice (#46).
- 4cd4e9c: `<Form>` can be used as a live form: `onChange` reports every change, `actions={false}` hides the buttons, and `onSubmit` is now optional.
- 5745cb9: Add `dateRange`, `rangeSlider` and `currency` fields, with `currencyDigits` and the `Range` value type. New issue codes `incompleteRange`, `invalidRange` and `tooManyDecimals`; refinements can now pass `{min}`/`{max}` to messages.
- a0abec2: First release of the React renderer: `<Form>` (React Hook Form state, engine validation as resolver, conditions, steps with per-step checks, RTL and localized messages), `<Field>`, `useFieldState`, `defineRenderer` / `createRenderers`, renderers for every basic field type in `@formcanvas/react/fields`, and a themeable stylesheet in a `formcanvas` cascade layer (`@formcanvas/react/styles.css`).
- a2830f1: Add `@formcanvas/react/remote`: a `Form` that loads a published form by `formId` from a formcanvas app (`endpoint`), submits to its API and uploads files there.
- d5af76e: The packages are renamed from `@formweave/*` to `@formcanvas/*`. The stylesheet's classes and variables now start with `fc-` instead of `fw-` (for example `.fc-form` and `--fc-accent`).
- b925fcb: Add the `repeater` field: a list of rows made of its child fields, with `minRows`, `maxRows` and `rowLabel`. Each row is checked as a form of its own (conditions read the same row), issues inside rows use paths such as `people.0.name`, and repeaters can be nested. New `rows` flag on field definitions, `CompiledField.rows`, and the `RowsApi` prop for row renderers.
- db06fc0: New field types: `url`, `phone` (with `normalizePhone`), `time`, `dateTime`, `rating`, `nps`, `slider`, `hidden`, and the display-only `heading`, `paragraph` and `divider`. `allFields` includes them; `richRenderers` and `allRenderers` draw them. In the focus layout hidden fields and dividers get no page of their own.
- f9d885b: Add `file`, `imageUpload` and `signature` fields. Values are `FileRef`s; files are stored by the new `upload` prop of `<Form>` (`UploadFile`), with progress. Image uploads are cropped and scaled in the browser; signatures can be drawn or typed. New `acceptsFile` helper and issue codes `fileTooBig`, `fileType` and `fileMissing`.

### Patch Changes

- e1cf53a: Darken `--fc-accent-text` in the light theme (#b9490a) so the question counter keeps WCAG AA contrast on grey page backgrounds too.
- fdf19be: Raise the contrast of help text and the question counter to meet WCAG AA (new `--fc-accent-text` variable).
- e867b3d: `Field` is memoized, so a re-render of `<Form>` (new props, a step change) no longer re-renders every field. The colour fields' eyedropper button appears after hydration instead of during the first render, which fixes a hydration mismatch in server-rendered pages.
- a365ffa: In the focus layout a question uses the full width even when its field is set to half width.
- 82f798e: Each package has a README with examples, a license file and npm metadata (keywords, homepage, provenance). `createRegistry` now accepts single field types and custom types defined with `defineField` (before, only `allFields` type-checked); the new `AnyFieldDefinition` type names "any field definition".
- 237d689: The repository moved to `ali-moradi-design/formcanvas`. Package metadata and the JSON Schema `$id` now point there.
- Updated dependencies [adb3a26]
- Updated dependencies [d7bf3b0]
- Updated dependencies [8d16a98]
- Updated dependencies [4d8c03f]
- Updated dependencies [fe27c8d]
- Updated dependencies [0c94d7d]
- Updated dependencies [d21ad2b]
- Updated dependencies [cbf5b43]
- Updated dependencies [a2830f1]
- Updated dependencies [824dfad]
- Updated dependencies [82f798e]
- Updated dependencies [5745cb9]
- Updated dependencies [d5af76e]
- Updated dependencies [b925fcb]
- Updated dependencies [237d689]
- Updated dependencies [db06fc0]
- Updated dependencies [0a89ca0]
- Updated dependencies [2ee058a]
- Updated dependencies [f9d885b]
- Updated dependencies [b1b8a31]
  - @formcanvas/engine@0.1.0
  - @formcanvas/schema@0.1.0
