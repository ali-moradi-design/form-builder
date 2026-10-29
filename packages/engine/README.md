# @formcanvas/engine

The framework-free core of formcanvas. It takes a form document (JSON) and
works out which fields are visible, required or disabled, computes calculated
values and validates answers. It has no UI code, so the same rules run in the
browser and on your server.

```bash
npm install @formcanvas/engine @formcanvas/schema zod
```

To render forms in React, use [`@formcanvas/react`](https://www.npmjs.com/package/@formcanvas/react),
which uses this package. Its README is the full guide to the form document.

## Quick start

```ts
import { compile, createRegistry, evaluate, validate } from "@formcanvas/engine";
import { email, number, radio, shortText } from "@formcanvas/engine/fields";
import type { FormDocument } from "@formcanvas/schema";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "order",
  title: "Order",
  locales: { default: "en" },
  steps: [
    {
      key: "main",
      fields: [
        { type: "shortText", key: "name", label: "Name", required: true },
        { type: "email", key: "email", label: "Email", required: true },
        {
          type: "radio",
          key: "plan",
          label: "Plan",
          required: true,
          settings: { options: [{ value: "solo" }, { value: "team" }] },
        },
        {
          type: "number",
          key: "seats",
          label: "Seats",
          settings: { min: 2, integer: true },
          visibleWhen: { op: "eq", args: [{ var: "plan" }, "team"] },
          requiredWhen: { op: "eq", args: [{ var: "plan" }, "team"] },
        },
      ],
    },
  ],
};

// 1. Compile once per document and reuse it.
const form = compile(doc, { registry: createRegistry([shortText, email, radio, number]) });

// 2. Work out the state for some values.
const state = evaluate(form, { plan: "team" });
state.fields.seats; // { visible: true, required: true, disabled: false }

// 3. Validate answers.
const result = validate(form, { name: "Sara", email: "sara@example", plan: "team" });
// {
//   success: false,
//   issues: [
//     { key: "email", code: "invalidEmail" },
//     { key: "seats", code: "required" },
//   ],
// }
```

## Validate submissions on the server

```ts
import { compile, createRegistry, validate } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import { formatIssue, en } from "@formcanvas/engine/messages";

const form = compile(doc, { registry: createRegistry(allFields) });

export async function POST(request: Request) {
  const result = validate(form, await request.json());
  if (!result.success) {
    const errors = result.issues.map((issue) => ({
      key: issue.key,
      message: formatIssue(issue, en, "en"),
    }));
    return Response.json({ errors }, { status: 422 });
  }
  // result.data holds only visible, non-empty, valid fields.
  // Calculated fields are computed again; values sent for them are ignored.
  await save(result.data);
  return new Response(null, { status: 201 });
}
```

`validate` also takes `{ step: "stepKey" }` to check one step of a multi-step
form, and `{ state }` to reuse a state from `evaluate`.

Documents from outside your code should be checked before `compile` with
`parseFormDocument` from `@formcanvas/schema/meta`. `compile` throws a
`SchemaError` (with a `path`) when a field type is unknown or its settings
are wrong.

## Entry points

| Import                          | What it has                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `@formcanvas/engine`            | `compile`, `evaluate`, `validate`, `calculateValues`, `createRegistry`, `defineField`, `evalExpression`, `toStandardSchema`, `SchemaError` |
| `@formcanvas/engine/fields`     | Every field type, one export each (`shortText`, `email`, `select`, …)                                                                      |
| `@formcanvas/engine/fields/all` | `allFields`: every field type in one list                                                                                                  |
| `@formcanvas/engine/messages`   | `en` and `fa` message catalogs, `formatIssue`                                                                                              |
| `@formcanvas/engine/i18n`       | `resolveText`, `isRtl`, `formatNumber`, `localizeDigits`, `normalizeDigits`                                                                |
| `@formcanvas/engine/expr`       | The expression interpreter on its own                                                                                                      |
| `@formcanvas/engine/infer`      | `inferForm`, `inferFields`: start a form from a sample JSON record                                                                         |

Import field types one by one to keep bundles small: a form that uses only
`shortText` and `email` does not carry the code of the other 36 types.

## Fast updates while typing

`evaluate` can update only what a change affects:

```ts
let state = evaluate(form, values);

values = { ...values, plan: "solo" };
state = evaluate(form, values, { previous: state, changed: ["plan"] });
```

Field states that did not change keep the same object, so `===` tells a UI
what to redraw.

## Expressions

Conditions (`visibleWhen`, `requiredWhen`, `disabledWhen`) and calculations
(`calculate`) are data, run by a small interpreter. There is no `eval` and no
way to call functions, so a stored form cannot run code.

```ts
import { evalExpression } from "@formcanvas/engine";

const values: Record<string, unknown> = { quantity: 3, price: 12.5 };
evalExpression({ op: "mul", args: [{ var: "quantity" }, { var: "price" }] }, (k) => values[k]);
// 37.5
```

Operators: `and`, `or`, `not`, `if`, `eq`, `neq`, `gt`, `gte`, `lt`, `lte`,
`in`, `empty`, `notEmpty`, `add`, `sub`, `mul`, `div`, `mod`, `min`, `max`,
`round`, `concat`, `len`. Nesting depth and text length are capped
(`MAX_EXPRESSION_DEPTH`, `MAX_TEXT_LENGTH`).

## Messages and languages

Validators return codes (`required`, `tooShort`, `invalidEmail`, …), never
sentences. Turn them into text in any language:

```ts
import { fa, formatIssue } from "@formcanvas/engine/messages";

formatIssue({ key: "name", code: "tooShort", params: { min: 2 } }, fa, "fa");
// "دست‌کم ۲ نویسه بنویسید."
```

```ts
import { resolveText, isRtl } from "@formcanvas/engine/i18n";

resolveText({ en: "Name", fa: "نام" }, "fa-IR", "en"); // "نام"
isRtl("fa"); // true
```

## Custom field types

```ts
import { createRegistry, defineField } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import * as z from "zod/mini";

const postcode = defineField({
  type: "postcode",
  settings: z.object({ digits: z._default(z.number(), 10) }),
  defaultValue: () => undefined,
  // Emptiness and `required` are handled by the engine.
  validator: ({ settings }) =>
    z.string().check(z.regex(new RegExp(`^\\d{${settings.digits}}$`), "invalidPostcode")),
});

const registry = createRegistry([...allFields, postcode]);
```

Use the same registry in the browser and on the server. In React, add a
renderer for the type too (see the `@formcanvas/react` README).

## Standard Schema

`toStandardSchema(form)` wraps `validate` in the
[Standard Schema](https://standardschema.dev) interface, so libraries that
accept Standard Schema can validate a formcanvas form.

## Start a form from data

```ts
import { inferForm } from "@formcanvas/engine/infer";

const doc = inferForm(
  { fullName: "Sara Ahmadi", email: "sara@example.com", age: 31, newsletter: true },
  "Sign up",
);
// fields: shortText "Full name", email "Email", number "Age", switch "Newsletter"
```

## License

MIT © Ali Moradi
