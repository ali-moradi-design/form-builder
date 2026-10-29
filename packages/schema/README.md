# @formcanvas/schema

Types and the meta-schema of formcanvas form documents: the JSON that
describes a form, its fields, steps, languages and logic.

```bash
npm install @formcanvas/schema
```

Most apps use it through [`@formcanvas/react`](https://www.npmjs.com/package/@formcanvas/react)
and [`@formcanvas/engine`](https://www.npmjs.com/package/@formcanvas/engine). Install it on its
own when you only need the types, or to check documents (for example in an
API that stores forms).

## Types

```ts
import type { FormDocument } from "@formcanvas/schema";

const feedback: FormDocument = {
  schemaVersion: 1,
  id: "feedback",
  title: { en: "Product feedback", fa: "نظرسنجی محصول" },
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [
    {
      key: "main",
      fields: [
        {
          type: "rating",
          key: "score",
          label: { en: "How do you rate us?", fa: "چه امتیازی می‌دهید؟" },
          required: true,
        },
        {
          type: "longText",
          key: "why",
          label: { en: "What should we improve?", fa: "چه چیزی را بهتر کنیم؟" },
          visibleWhen: { op: "lte", args: [{ var: "score" }, 3] },
        },
      ],
    },
  ],
};
```

Exported types: `FormDocument`, `Step`, `FieldNode`, `FieldWidth`,
`FormLocales`, `Locale`, `LocalizedText`, `Expression`, `Call`, `VarRef`,
`Literal`, `Operator`. Constants: `SCHEMA_VERSION` and `OPERATORS`.

The main entry has no runtime code besides these two constants (under 300 B).

## Check a document

`@formcanvas/schema/meta` checks unknown input (needs `zod` 4.6+):

```ts
import { parseFormDocument } from "@formcanvas/schema/meta";

const result = parseFormDocument(JSON.parse(body));
if (!result.success) {
  return Response.json({ issues: result.issues }, { status: 400 });
}
const doc = result.data; // FormDocument
```

Besides the shape it checks rules that span the document:

- field keys are unique in the whole form, step keys within the form;
- every `{ "var": … }` in an expression names an existing field;
- the default locale is one of the supported locales;
- only known operators are used.

Whether a field `type` exists and its `settings` are valid is checked by
`compile` in `@formcanvas/engine`, because field types can be added.

The Zod schemas are exported too (`formDocumentSchema`, `fieldNodeSchema`,
`stepSchema`, `expressionSchema`, `localizedTextSchema`).

## JSON Schema

A JSON Schema of the document is included, for editors and other languages:

```ts
import schema from "@formcanvas/schema/schema.json" with { type: "json" };
```

In a JSON file, point `$schema` at it to get autocompletion:

```json
{
  "$schema": "./node_modules/@formcanvas/schema/dist/form-document.schema.json",
  "schemaVersion": 1
}
```

## License

MIT © Ali Moradi
