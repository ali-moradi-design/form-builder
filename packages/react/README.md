# @formcanvas/react

Render forms from a JSON document in React. Conditions, calculated fields,
multi-step pages, validation, right-to-left languages and accessibility are
handled for you; you write the form once as data and get a working,
accessible form.

```bash
npm install @formcanvas/react @formcanvas/engine @formcanvas/schema react react-dom react-hook-form zod
```

- **Forms as data.** A form is one JSON document. Store it in a database,
  send it over an API, edit it in the formcanvas builder, or write it by hand.
- **Logic without code.** Show, hide, require or disable fields with
  expressions that are plain data, so a stored form can never run code.
- **Same rules everywhere.** The engine that checks answers in the browser
  checks them again on your server.
- **Fast.** Typing in one field re-renders only that field.
- **Small.** Import only the field types you use; the rest is never bundled.
- **Many languages.** Text per locale, Persian and Arabic digits, right to
  left layout, English and Persian messages built in.
- **Accessible.** Labels, help text and errors are wired with ARIA; focus
  moves to the first error.
- **Typed.** Written in TypeScript; every export is documented.

## Contents

- [Packages](#packages)
- [Install](#install)
- [Quick start](#quick-start)
- [The form document](#the-form-document)
- [Field types](#field-types)
- [Conditions and logic](#conditions-and-logic)
- [Calculated fields](#calculated-fields)
- [Multi-step forms](#multi-step-forms)
- [Layouts](#layouts)
- [Languages and right-to-left](#languages-and-right-to-left)
- [Error messages](#error-messages)
- [Styling and themes](#styling-and-themes)
- [Starting values and live forms](#starting-values-and-live-forms)
- [Repeaters](#repeaters)
- [File uploads](#file-uploads)
- [Validate on the server](#validate-on-the-server)
- [Load a published form](#load-a-published-form)
- [Custom field types](#custom-field-types)
- [Custom layouts](#custom-layouts)
- [Keeping the bundle small](#keeping-the-bundle-small)
- [API summary](#api-summary)
- [Requirements](#requirements)

## Packages

| Package              | What it does                                                                  |
| -------------------- | ----------------------------------------------------------------------------- |
| `@formcanvas/schema` | Types of the form document and a validator for untrusted documents.           |
| `@formcanvas/engine` | Framework-free logic: compile, evaluate conditions, validate, field types.    |
| `@formcanvas/react`  | This package: the `<Form>` component, field renderers and the default styles. |

The engine has no React code, so you can use it on a server (Node, Deno, Bun,
edge functions) to validate submissions.

## Install

```bash
npm install @formcanvas/react @formcanvas/engine @formcanvas/schema react react-dom react-hook-form zod
```

```bash
pnpm add @formcanvas/react @formcanvas/engine @formcanvas/schema react react-dom react-hook-form zod
```

`react` (19+), `react-hook-form` (7.60+) and `zod` (4.6+) are peer
dependencies, so your app keeps a single copy of each. The packages are
ESM only.

## Quick start

```tsx
import { createRegistry } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import { Form, createRenderers } from "@formcanvas/react";
import { allRenderers } from "@formcanvas/react/fields";
import type { FormDocument } from "@formcanvas/schema";
import "@formcanvas/react/styles.css";

// Create these once, outside your components.
const registry = createRegistry(allFields);
const renderers = createRenderers(allRenderers);

const contactForm: FormDocument = {
  schemaVersion: 1,
  id: "contact",
  title: "Contact us",
  locales: { default: "en" },
  steps: [
    {
      key: "main",
      fields: [
        { type: "shortText", key: "name", label: "Your name", required: true },
        { type: "email", key: "email", label: "Email", required: true },
        {
          type: "select",
          key: "topic",
          label: "Topic",
          settings: {
            options: [
              { value: "sales", label: "Sales" },
              { value: "support", label: "Support" },
            ],
          },
        },
        { type: "longText", key: "message", label: "Message", required: true },
      ],
    },
  ],
};

export function ContactPage() {
  return (
    <Form
      schema={contactForm}
      registry={registry}
      renderers={renderers}
      onSubmit={async (data) => {
        // data: { name, email, topic?, message }, already validated
        await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }}
    />
  );
}
```

`onSubmit` runs only when every visible field is valid. It gets the values of
visible, non-empty fields; hidden fields are left out.

`registry` decides which field types the document may use and how they are
validated. `renderers` decides how each type is drawn. Both are plain maps,
so you can add your own types (see [Custom field types](#custom-field-types)).

## The form document

A form is a `FormDocument`:

```json
{
  "schemaVersion": 1,
  "id": "job-application",
  "title": { "en": "Job application", "fa": "درخواست همکاری" },
  "description": "It takes about three minutes.",
  "locales": { "default": "en", "supported": ["en", "fa"] },
  "steps": [
    {
      "key": "about",
      "title": "About you",
      "fields": [
        { "type": "shortText", "key": "full_name", "label": "Full name", "required": true },
        { "type": "email", "key": "email", "label": "Email", "required": true, "width": "half" },
        { "type": "phone", "key": "phone", "label": "Phone", "width": "half" }
      ]
    }
  ]
}
```

Every field has these properties:

| Property       | Type                 | Meaning                                                         |
| -------------- | -------------------- | --------------------------------------------------------------- |
| `type`         | `string`             | Field type, for example `"shortText"`. Must be in the registry. |
| `key`          | `string`             | Name of the value. Unique in the form; letters, digits and `_`. |
| `label`        | text                 | Question shown above the field.                                 |
| `help`         | text                 | Guidance shown under the field.                                 |
| `placeholder`  | text                 | Text inside an empty input.                                     |
| `required`     | `boolean`            | An answer is needed.                                            |
| `visibleWhen`  | expression           | Show the field only while this is true.                         |
| `requiredWhen` | expression           | Require the field while this is true.                           |
| `disabledWhen` | expression           | Make the field read-only while this is true.                    |
| `calculate`    | expression           | Compute the value from other fields.                            |
| `width`        | `"full"` \| `"half"` | Width on wide screens. Narrow screens always use the full row.  |
| `settings`     | `object`             | Options of the field type (see below).                          |
| `fields`       | `FieldNode[]`        | Child fields, for `group` and `repeater`.                       |

"Text" is either one string or one string per locale:
`{ "en": "Name", "fa": "نام" }`.

Documents that come from outside your code (an API, a database, a text
editor) should be checked first:

```ts
import { parseFormDocument } from "@formcanvas/schema/meta";

const result = parseFormDocument(JSON.parse(text));
if (!result.success) {
  console.table(result.issues); // [{ path: ["steps", 0, "fields", 2, "key"], message: "…" }]
} else {
  render(result.data);
}
```

A JSON Schema of the document is shipped as `@formcanvas/schema/schema.json`,
for editor autocompletion:

```json
{ "$schema": "./node_modules/@formcanvas/schema/dist/form-document.schema.json" }
```

## Field types

`@formcanvas/engine/fields/all` registers every type below.
`@formcanvas/react/fields` has a renderer for each one.

| Type          | Value                        | Main settings                                               |
| ------------- | ---------------------------- | ----------------------------------------------------------- |
| `shortText`   | `string`                     | `minLength`, `maxLength` (default 500)                      |
| `longText`    | `string`                     | `minLength`, `maxLength` (default 5000)                     |
| `email`       | `string`                     |                                                             |
| `url`         | `string`                     |                                                             |
| `phone`       | `string` (with country code) |                                                             |
| `number`      | `number`                     | `min`, `max`, `integer`                                     |
| `currency`    | `number` (major units)       | `currency` (ISO code such as `"USD"`), `min`, `max`         |
| `select`      | `string`                     | `options`, `optionsBy`, `optionsUrl`                        |
| `radio`       | `string`                     | `options`, `optionsBy`, `optionsUrl`                        |
| `checkboxes`  | `string[]`                   | `options`, `minSelected`, `maxSelected`                     |
| `combobox`    | `string`                     | `options` (searchable list)                                 |
| `multiSelect` | `string[]`                   | `options`, `minSelected`, `maxSelected`                     |
| `tags`        | `string[]`                   | `maxTags`, `maxLength`, `suggestions`                       |
| `ranking`     | `string[]`                   | `options` (every option put in order)                       |
| `imageChoice` | `string` or `string[]`       | `options` (each with `image`), `multiple`                   |
| `matrix`      | `{ [row]: column }`          | `rows`, `columns`, `everyRow`                               |
| `switch`      | `boolean`                    |                                                             |
| `date`        | `"YYYY-MM-DD"`               | `min`, `max`                                                |
| `time`        | `"HH:MM"`                    |                                                             |
| `dateTime`    | ISO date and time            |                                                             |
| `dateRange`   | `{ from, to }` dates         | `min`, `max`                                                |
| `rating`      | `number` (1 to `max`)        | `max` (3–10, default 5)                                     |
| `nps`         | `number` (0–10)              | `lowLabel`, `highLabel`                                     |
| `slider`      | `number`                     | `min`, `max`, `step`                                        |
| `rangeSlider` | `{ from, to }` numbers       | `min`, `max`, `step`                                        |
| `color`       | hex colour                   | `swatches`                                                  |
| `colorSet`    | hex colours                  | `swatches`, `minColors`, `maxColors`                        |
| `address`     | address object               | `parts`, `requiredParts`                                    |
| `file`        | file references              | `accept`, `maxFiles` (default 1), `maxSize` (default 10 MB) |
| `imageUpload` | file references              | images only                                                 |
| `signature`   | file reference               |                                                             |
| `calculated`  | number, text or yes/no       | `format` (`number`, `currency`, `percent`), `decimals`      |
| `hidden`      | `string`                     | `fromUrl` (query parameter to read)                         |
| `group`       | none (holds `fields`)        |                                                             |
| `repeater`    | list of rows                 | `minRows`, `maxRows` (default 10), `rowLabel`               |
| `heading`     | none (text only)             |                                                             |
| `paragraph`   | none (text only)             |                                                             |
| `divider`     | none                         |                                                             |

The full settings of each type are in its TypeScript types, for example
`TextSettings`, `NumberSettings` or `FileSettings` from
`@formcanvas/engine/fields`.

### Choices

```json
{
  "type": "radio",
  "key": "plan",
  "label": "Plan",
  "required": true,
  "settings": {
    "options": [
      { "value": "solo", "label": { "en": "Solo", "fa": "تکی" } },
      { "value": "team", "label": { "en": "Team", "fa": "تیمی" } }
    ]
  }
}
```

Options can depend on another answer (cities by country):

```json
{
  "type": "select",
  "key": "city",
  "label": "City",
  "settings": {
    "optionsBy": {
      "field": "country",
      "options": {
        "ir": [
          { "value": "teh", "label": "Tehran" },
          { "value": "isf", "label": "Isfahan" }
        ],
        "de": [{ "value": "ber", "label": "Berlin" }]
      }
    }
  }
}
```

An answer that is not in the current list fails with `invalidOption`, in the
browser and on the server.

## Conditions and logic

Logic is stored as data, never as code. An expression is one of:

- a literal: `"team"`, `3`, `true`, `null`;
- a field value: `{ "var": "plan" }`;
- an operator call: `{ "op": "eq", "args": [{ "var": "plan" }, "team"] }`.

| Group          | Operators                                                |
| -------------- | -------------------------------------------------------- |
| Logic          | `and`, `or`, `not`, `if` (`[condition, then, else]`)     |
| Comparison     | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`              |
| Presence       | `empty`, `notEmpty`                                      |
| Math           | `add`, `sub`, `mul`, `div`, `mod`, `min`, `max`, `round` |
| Text and lists | `concat`, `len`                                          |

`in` checks whether its first argument is one of the others
(`{ "op": "in", "args": [{ "var": "plan" }, "team", "business"] }`). With two
arguments, the second may be a list (a `checkboxes` answer) or a text to
search in.

Show the number of seats only for the team plan, and require it for more
than five people:

```json
{
  "type": "number",
  "key": "seats",
  "label": "Seats",
  "settings": { "min": 1, "integer": true },
  "visibleWhen": { "op": "eq", "args": [{ "var": "plan" }, "team"] },
  "requiredWhen": { "op": "gt", "args": [{ "var": "team_size" }, 5] }
}
```

Ask for a company name when the person is employed or self-employed:

```json
{
  "type": "shortText",
  "key": "company",
  "label": "Company",
  "visibleWhen": {
    "op": "in",
    "args": [{ "var": "employment" }, "employed", "self_employed"]
  }
}
```

Hidden fields are not validated and not submitted. Steps take `visibleWhen`
too, so a whole page can be skipped.

The engine only re-checks conditions that read the changed field, so a large
form stays fast while typing.

## Calculated fields

A `calculated` field (or any field with `calculate`) is read-only and always
holds the result of its expression:

```json
[
  { "type": "number", "key": "quantity", "label": "Quantity", "settings": { "min": 1 } },
  { "type": "currency", "key": "price", "label": "Unit price", "settings": { "currency": "EUR" } },
  {
    "type": "calculated",
    "key": "total",
    "label": "Total",
    "settings": { "format": "currency", "currency": "EUR" },
    "calculate": { "op": "mul", "args": [{ "var": "quantity" }, { "var": "price" }] }
  }
]
```

The result is part of the submitted data. On the server the engine computes it
again and ignores any value the browser sent.

## Multi-step forms

Add more steps. The form shows one step at a time with **Back** and **Next**
buttons; **Next** checks only the fields of the current step.

```ts
const signup: FormDocument = {
  schemaVersion: 1,
  id: "signup",
  title: "Sign up",
  locales: { default: "en" },
  steps: [
    {
      key: "account",
      title: "Account",
      fields: [
        { type: "email", key: "email", label: "Email", required: true },
        {
          type: "radio",
          key: "account_type",
          label: "Account type",
          required: true,
          settings: {
            options: [
              { value: "personal", label: "Personal" },
              { value: "business", label: "Business" },
            ],
          },
        },
      ],
    },
    {
      key: "company",
      title: "Your company",
      visibleWhen: { op: "eq", args: [{ var: "account_type" }, "business"] },
      fields: [{ type: "shortText", key: "company_name", label: "Company", required: true }],
    },
    {
      key: "done",
      title: "Almost there",
      fields: [{ type: "switch", key: "newsletter", label: "Send me product news" }],
    },
  ],
};
```

## Layouts

```tsx
<Form schema={doc} registry={registry} renderers={renderers} layout="focus" onSubmit={save} />
```

- `"classic"` (default): one step per page, all its fields at once.
- `"focus"`: one question per page with a progress bar; Enter confirms the
  answer. Good for surveys and phones.

## Languages and right-to-left

Write text per locale and pick the reader's locale with `locale`:

```tsx
<Form schema={doc} registry={registry} renderers={renderers} locale="fa" onSubmit={save} />
```

- Missing translations fall back to the document's default locale.
- `fa`, `ar`, `he`, `ur` and other right-to-left locales set `dir="rtl"` on
  the form. The styles use logical properties, so the layout mirrors itself.
- Numbers and messages use the locale's digits (`۱۲۳` in Persian). Pass
  `digits="latin"` to always show `123`. Persian and Arabic digits typed by
  people are understood either way.
- Button text comes in English and Persian. Change it with `labels`:

```tsx
<Form
  schema={doc}
  registry={registry}
  renderers={renderers}
  labels={{ submit: "Send application", next: "Continue" }}
  onSubmit={save}
/>
```

## Error messages

Validators report codes such as `required`, `tooShort` or `invalidEmail`.
The form turns them into text with a message catalog: English by default,
Persian for `fa`. Pass your own catalog for other languages or another tone:

```tsx
import { en } from "@formcanvas/engine/messages";

const messages = {
  ...en,
  required: "Please answer this question.",
  tooShort: "Please write at least {min} characters.",
};

<Form schema={doc} registry={registry} renderers={renderers} messages={messages} onSubmit={save} />;
```

`{min}` and `{max}` are replaced with the limits of the failed check. The
full list of codes is in `en` from `@formcanvas/engine/messages`.

## Styling and themes

Import the default stylesheet once:

```ts
import "@formcanvas/react/styles.css";
```

Every rule sits in the `formcanvas` cascade layer, so your own CSS wins
without `!important`. Change the look with CSS variables:

```css
.fc-form {
  --fc-primary: #4f46e5; /* buttons, focus ring, selected options */
  --fc-primary-text: #ffffff;
  --fc-radius: 6px;
  --fc-gap: 16px; /* space between fields */
  --fc-control-height: 44px;
  --fc-font: "Inter", system-ui, sans-serif;
}
```

Other variables: `--fc-text`, `--fc-muted`, `--fc-faint`, `--fc-surface`,
`--fc-surface-2`, `--fc-line`, `--fc-primary-soft`, `--fc-accent`,
`--fc-danger`, `--fc-danger-soft`.

Dark mode follows, in order: the `theme` prop (`"light"`, `"dark"` or
`"system"`), the nearest `data-theme="light"` or `data-theme="dark"` on an
ancestor (for example `<html data-theme="dark">`), and finally the operating
system.

```tsx
<Form schema={doc} registry={registry} renderers={renderers} theme="dark" onSubmit={save} />
```

Add your own classes to the `<form>` with `className`. Not using the default
styles at all? Leave out the import and style the `fc-*` classes yourself, or
write your own renderers.

## Starting values and live forms

`defaultValues` fills fields when the form first renders, for example to
edit a saved answer:

```tsx
<Form
  schema={doc}
  registry={registry}
  renderers={renderers}
  defaultValues={{ name: user.name, email: user.email }}
  onSubmit={save}
/>
```

`defaultValues` is read once per document. To reset the form, give it a new
React `key`.

For a settings panel that saves as people type, listen to `onChange` and hide
the buttons:

```tsx
<Form
  schema={settingsForm}
  registry={registry}
  renderers={renderers}
  defaultValues={settings}
  actions={false}
  onChange={(values, changedKey) => {
    saveDraft(values);
  }}
/>
```

`onChange` gets every value, including hidden fields, and is not validated.

## Repeaters

A repeater collects a list of rows with the same fields:

```json
{
  "type": "repeater",
  "key": "people",
  "label": "Who is coming?",
  "settings": { "minRows": 1, "maxRows": 5, "rowLabel": "Guest" },
  "fields": [
    { "type": "shortText", "key": "name", "label": "Name", "required": true, "width": "half" },
    { "type": "email", "key": "email", "label": "Email", "width": "half" }
  ]
}
```

Submitted value:

```json
{ "people": [{ "name": "Sara", "email": "sara@example.com" }, { "name": "Reza" }] }
```

Rows can be added, removed and reordered. Errors inside a row have keys such
as `people.1.name`.

## File uploads

`file`, `imageUpload` and `signature` fields need an `upload` function that
stores the file and returns a reference. Without it they show that uploads
are not available.

```tsx
import type { UploadFile } from "@formcanvas/react";

const upload: UploadFile = async (file, { field, onProgress }) => {
  const body = new FormData();
  body.append("file", file, file.name ?? "file");
  const res = await fetch(`/api/uploads?field=${encodeURIComponent(field)}`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error("Upload failed");
  onProgress?.(1);
  // Must return { id, name, size, type }; `url` is optional, for previews.
  return (await res.json()) as {
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
  };
};

<Form schema={doc} registry={registry} renderers={renderers} upload={upload} onSubmit={save} />;
```

The submitted value holds only the references (`{ id, name, size, type }`).
On your server, check that each `id` is a file that was uploaded for that
field before you trust it.

## Validate on the server

Never trust the browser. Validate the same document on the server with the
engine; the result matches the browser's exactly.

```ts
// app/api/contact/route.ts (any server works: Express, Hono, Fastify, …)
import { compile, createRegistry, validate } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import { contactForm } from "@/forms/contact";

// Compile once and reuse; the compiled form is frozen and safe to share.
const form = compile(contactForm, { registry: createRegistry(allFields) });

export async function POST(request: Request) {
  const result = validate(form, await request.json());
  if (!result.success) {
    // [{ key: "email", code: "invalidEmail" }, …]
    return Response.json({ issues: result.issues }, { status: 422 });
  }
  await db.insert(messages).values(result.data); // only visible, valid fields
  return new Response(null, { status: 201 });
}
```

To show server errors in the reader's language, use `formatIssue` from
`@formcanvas/engine/messages`.

## Load a published form

If you use the formcanvas app, a published form can be loaded by its link
name. The `remote` entry loads the document, renders it with every field
type, uploads files and sends the answers to the app, which validates them
again.

```tsx
import { Form } from "@formcanvas/react/remote";
import "@formcanvas/react/styles.css";

export function Feedback() {
  return (
    <Form
      formId="product-feedback"
      endpoint="https://forms.example.com"
      locale="en"
      onSubmitted={({ id }) => console.log("Saved response", id)}
      done={<p>Thanks! We read every answer.</p>}
    />
  );
}
```

It takes the same display props as the local form (`locale`, `digits`,
`layout`, `theme`, `labels`, `messages`, `className`, `defaultValues`), plus
`formId`, `endpoint`, `onSubmitted`, `loading` and `done`. Leave out
`endpoint` when the app runs on the same site.

## Custom field types

A field type has two parts: a definition in the engine (settings, default
value, validation) and a renderer in React.

```ts
// postcode.ts — works in the browser and on the server
import { defineField } from "@formcanvas/engine";
import * as z from "zod/mini";

export const postcode = defineField({
  type: "postcode",
  settings: z.object({ digits: z._default(z.number(), 10) }),
  defaultValue: () => undefined,
  // Report problems with an issue code, not a sentence.
  validator: ({ settings }) =>
    z.string().check(z.regex(new RegExp(`^\\d{${settings.digits}}$`), "invalidPostcode")),
});
```

```tsx
// postcode-renderer.tsx
import { defineRenderer } from "@formcanvas/react";
import { FieldShell, controlProps } from "@formcanvas/react/fields";
import type { Ref } from "react";

export const postcodeRenderer = defineRenderer("postcode", (p) => (
  <FieldShell props={p}>
    <input
      {...controlProps(p)}
      ref={p.inputRef as Ref<HTMLInputElement>}
      className="fc-input"
      inputMode="numeric"
      autoComplete="postal-code"
      value={typeof p.value === "string" ? p.value : ""}
      onChange={(e) => p.onChange(e.target.value)}
    />
  </FieldShell>
));
```

```tsx
import { createRegistry } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import { en } from "@formcanvas/engine/messages";
import { createRenderers } from "@formcanvas/react";
import { allRenderers } from "@formcanvas/react/fields";

const registry = createRegistry([...allFields, postcode]);
const renderers = createRenderers([...allRenderers, postcodeRenderer]);
const messages = { ...en, invalidPostcode: "Enter a 10-digit postcode." };
```

Now `{ "type": "postcode", "key": "zip", "settings": { "digits": 5 } }` works
in documents. `FieldShell` draws the label, required mark, help and error
like the built-in fields; `controlProps` adds `id`, `name`, `disabled`,
`onBlur` and the ARIA attributes. You can also replace a built-in renderer:
a later renderer for the same type wins.

## Custom layouts

Inside `<Form>`, place fields yourself with `<Field fieldKey="…" />`, and read
a field's state with `useFieldState`:

```tsx
import { Field, useFieldState } from "@formcanvas/react";

function SeatsHint() {
  const seats = useFieldState("seats");
  return seats?.visible ? <p>Teams get a 10% discount.</p> : null;
}
```

`<Field>` renders nothing while the field is hidden and re-renders only when
its own value or state changes.

## Keeping the bundle small

`allFields` and `allRenderers` are the easy start. When you know which types
your forms use, import just those:

```ts
import { createRegistry } from "@formcanvas/engine";
import { email, longText, select, shortText } from "@formcanvas/engine/fields";
import { createRenderers } from "@formcanvas/react";
import {
  emailRenderer,
  longTextRenderer,
  selectRenderer,
  shortTextRenderer,
} from "@formcanvas/react/fields";

const registry = createRegistry([shortText, email, select, longText]);
const renderers = createRenderers([
  shortTextRenderer,
  emailRenderer,
  selectRenderer,
  longTextRenderer,
]);
```

`basicRenderers` holds the common types (`shortText`, `longText`, `email`,
`number`, `select`, `radio`, `checkboxes`, `switch`, `date`, `group`);
`richRenderers` holds the rest.

Size budgets checked on every change (minified and compressed):

| Import                            | Budget |
| --------------------------------- | ------ |
| `Form` + `createRenderers` + core | 8 kB   |
| One renderer                      | 1 kB   |
| `basicRenderers`                  | 3 kB   |
| `allRenderers`                    | 12 kB  |
| Remote `Form` with every type     | 28 kB  |

## API summary

`@formcanvas/react`

| Export                                                       | What it is                                              |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| `Form`                                                       | Renders a form document.                                |
| `Field`                                                      | Renders one field inside `Form`, for custom layouts.    |
| `useFieldState(key)`                                         | `{ visible, required, disabled, options? }` of a field. |
| `createRenderers(list)`                                      | Builds the `renderers` map.                             |
| `defineRenderer(type, component)`                            | Connects a field type to a component.                   |
| `FormProps`, `FieldRendererProps`, `UploadFile`, `Values`, … | Types.                                                  |

`Form` props:

| Prop            | Type                                            | Default                   |
| --------------- | ----------------------------------------------- | ------------------------- |
| `schema`        | `FormDocument`                                  | required                  |
| `registry`      | `FieldRegistry`                                 | required                  |
| `renderers`     | `RendererMap`                                   | required                  |
| `onSubmit`      | `(data) => void \| Promise<void>`               |                           |
| `onChange`      | `(values, changedKey) => void`                  |                           |
| `locale`        | `string`                                        | the document's default    |
| `digits`        | `"native" \| "latin"`                           | `"native"`                |
| `messages`      | `MessageCatalog`                                | English, Persian for `fa` |
| `labels`        | `{ next, back, submit, ok, question }` (any of) | English or Persian        |
| `defaultValues` | `Record<string, unknown>`                       |                           |
| `layout`        | `"classic" \| "focus"`                          | `"classic"`               |
| `theme`         | `"light" \| "dark" \| "system"`                 | from the page             |
| `actions`       | `boolean`                                       | `true`                    |
| `className`     | `string`                                        |                           |
| `upload`        | `UploadFile`                                    |                           |

`@formcanvas/react/fields`: one renderer per type (`shortTextRenderer`,
`selectRenderer`, …), the lists `basicRenderers`, `richRenderers` and
`allRenderers`, and `FieldShell` and `controlProps` for custom renderers.

`@formcanvas/react/remote`: a `Form` that loads a published form by `formId`.

`@formcanvas/react/styles.css`: the default styles.

## Requirements

- React 19 or newer, React Hook Form 7.60 or newer, Zod 4.6 or newer.
- An ESM-aware bundler or runtime (Vite, Next.js, webpack 5, Node 20+).
- TypeScript is optional; types ship with the package.

## License

MIT © Ali Moradi
