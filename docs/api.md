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
…); translate them with `formatIssue` from `@formweave/engine/messages`.

### Spam protection

- **Rate limit**: 10 submissions per minute per client address and form
  (`SUBMIT_RATE_LIMIT` changes it). The limit lives in the server's memory,
  so with several server instances each counts on its own.
- **Honeypot**: a request that sets `"_hp"` to anything gets `201` with
  `{ "id": null, "version": null }` and nothing is stored. The hosted page
  has a hidden field for this that people never see.
