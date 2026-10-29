# Public API

Every published form is served by a small JSON API. No key is needed; CORS
allows any origin, so embeds and other sites can use it.

## Read a form

`GET /api/forms/<slug>`

```json
{ "version": 3, "document": { "schemaVersion": 1, "id": "…", "title": "…", "steps": [] } }
```

The document is the live (newest published) version. Responses are cached
for 30 seconds. Unknown slugs return `404 { "error": "notFound" }`.

## Submit answers

`POST /api/forms/<slug>/responses` with `Content-Type: application/json`:

```json
{ "values": { "name": "Sara", "plan": "team", "seats": 4 }, "locale": "en" }
```

The server validates the values against the live version with the same
engine the browser uses. It stores only visible fields with valid values;
unknown keys are dropped. The response records its version and language.

| Status | Body                                                              | When                                                |
| ------ | ----------------------------------------------------------------- | --------------------------------------------------- |
| 201    | `{ "id": "…", "version": 3 }`                                     | Stored                                              |
| 400    | `{ "error": "invalidJson" }`                                      | Body is not JSON                                    |
| 404    | `{ "error": "notFound" }`                                         | No published form with this slug                    |
| 413    | `{ "error": "tooLarge" }`                                         | Body over 64 KB                                     |
| 415    | `{ "error": "unsupportedMediaType" }`                             | Not `application/json`                              |
| 422    | `{ "error": "invalid", "issues": [{ "key", "code", "params" }] }` | Validation failed                                   |
| 429    | `{ "error": "rateLimited" }` + `Retry-After`                      | Over 10 submissions per minute per address and form |

Issue codes are the engine's codes (`required`, `tooShort`, `invalidOption`,
…); translate them with `formatIssue` from `@formcanvas/engine/messages`.

### Spam protection

- **Rate limit**: 10 submissions per minute per client address and form
  (`SUBMIT_RATE_LIMIT` changes it). The limit lives in the server's memory,
  so with several server instances each counts on its own.
- **Honeypot**: a request that sets `"_hp"` to anything gets `201` with
  `{ "id": null, "version": null }` and nothing is stored. The hosted page
  has a hidden field for this that people never see.

## Embed on any website

```html
<script src="https://YOUR-APP/embed.js" data-form="SLUG" async></script>
```

The script adds a frame with the hosted form (`/f/<slug>?embed=1`, without
page chrome). The form sends its height to the page, so the frame grows
with it. After a submission the script tag fires a bubbling
`formcanvas:submitted` event. Only `/f/…` pages may be framed by other
sites; the rest of the app sends `frame-ancestors 'self'`.

## In a React app

```tsx
import { Form } from "@formcanvas/react/remote";
import "@formcanvas/react/styles.css";

<Form formId="SLUG" endpoint="https://YOUR-APP" onSubmitted={(r) => console.log(r.id)} />;
```

It loads the live version from `GET /api/forms/<slug>`, validates in the
browser, posts to the responses API (validated again on the server) and
uploads files to the upload API.

### Styling, theme and values

- `className` adds classes to the `<form>`; the `fc-form` class the
  stylesheet needs always stays.
- `theme="light" | "dark" | "system"` picks the colours. Without it the form
  follows an ancestor's `data-theme` (for example `<html data-theme="dark">`)
  and otherwise the operating system. Override any `--fc-*` variable to
  match your app.
- Choice values are text. A number or `true`/`false` in `defaultValues`
  selects the option with the same text (`2` selects `"2"`), and submitted
  data holds the text.

## Upload files

File, photo and signature fields hold references to stored files. Upload
each file first, then send its reference in the answers.

`POST /api/forms/<slug>/uploads?field=<key>` with `multipart/form-data` and
one `file` part. `key` is the field's key (also inside repeater rows).

| Status | Body                                         | When                                            |
| ------ | -------------------------------------------- | ----------------------------------------------- |
| 201    | `{ "id", "name", "size", "type" }`           | Stored, waiting for answers that name it        |
| 400    | `{ "error": "noFile" }`                      | No `file` part                                  |
| 404    | `{ "error": "notFound" }`                    | No published form, or no file field `key`       |
| 413    | `{ "error": "tooLarge" }`                    | Bigger than the field allows                    |
| 415    | `{ "error": "fileType" }`                    | A type the field refuses, or the bytes disagree |
| 429    | `{ "error": "rateLimited" }` + `Retry-After` | Over 30 uploads per minute per address and form |

The server checks size and type against the field. Images and PDFs are
recognised from their bytes, so a PNG named `talk.pdf` is refused. Put the
returned object in the answers, for example `"slides": [{ "id": "…", … }]`.
When the answers arrive, each reference must be a file uploaded for that
form and field and not used by another response; otherwise the issue code is
`fileMissing`. Name, size and type are taken from storage. Files never named
by a response are removed after a day. Owners download files from the
response's detail view; anything but plain images is sent as a download.

## Webhooks

Owners add up to five webhook URLs per form on the form's **Integrations**
page. After a response is stored, each enabled webhook gets a `POST` with
this JSON body:

```json
{
  "event": "response.created",
  "form": { "id": "…", "slug": "product-feedback", "version": 3 },
  "response": {
    "id": "…",
    "submittedAt": "2026-10-19T10:00:00.000Z",
    "locale": "en",
    "data": { "name": "Sara" }
  }
}
```

Headers:

- `X-Formcanvas-Event`: `response.created`, or `ping` for the test button.
- `X-Formcanvas-Timestamp`: Unix seconds.
- `X-Formcanvas-Signature`: `sha256=` + hex HMAC-SHA256 of
  `<timestamp>.<raw body>` with the webhook's secret (`whsec_…`).

Check the signature with a constant-time compare and reject timestamps older
than a few minutes. Any 2xx answer counts as delivered. Network errors, 429
and 5xx are retried after 1, 5 and 25 seconds; other answers are not. Every
attempt is listed on the Integrations page.

Only `https://` URLs whose host resolves to public addresses are accepted,
both when saving and before each delivery, and redirects are not followed.
`WEBHOOK_ALLOW_PRIVATE=1` lifts this for local development only.
