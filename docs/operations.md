# Operations

How the web app is run on a server. Deployment itself is still to be set up.

## Environment variables

| Variable                 | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `DATABASE_URL`           | Postgres connection string. Without it the app uses PGlite on disk.         |
| `PGLITE_DIR`             | PGlite folder (default `.data/pglite`); `memory://` for tests.              |
| `BETTER_AUTH_SECRET`     | Secret for sessions (at least 32 characters).                               |
| `BETTER_AUTH_URL`        | Public URL of the app.                                                      |
| `DEMO_RESET_TOKEN`       | Enables `POST /api/demo/reset`. Without it the route answers 404.           |
| `SUBMIT_RATE_LIMIT`      | Submissions per address and form per minute (default 10).                   |
| `UPLOAD_RATE_LIMIT`      | Uploads per address and form per minute (default 30).                       |
| `UPLOAD_QUOTA_MB`        | All stored files together (default 2048). Uploads get 507 beyond it.        |
| `UPLOAD_PENDING_MB`      | Files not yet part of a response, per form (default 200).                   |
| `MAX_RESPONSES_PER_FORM` | Responses one form may hold (default 10000). Submissions get 507 beyond it. |
| `AUTH_RATE_LIMIT`        | `off` turns off sign-in rate limits (tests only).                           |
| `WEBHOOK_ALLOW_PRIVATE`  | `1` allows webhooks to private addresses (development and tests only).      |

## Behind Nginx

Rate limits use the visitor's address. The app trusts `X-Real-IP` first and
otherwise the last `X-Forwarded-For` entry, so Nginx must overwrite the
header with the connecting address, and the app's port must be published
only on `127.0.0.1` (nobody may reach it without Nginx):

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
client_max_body_size 51m;
```

## Nightly demo reset

The demo account is shared, so its content is put back every night:
every form of the demo account is deleted (with its versions, responses,
uploads and webhooks), every demo session is signed out, and the account
gets its starting content again: the product feedback form, published with
24 sample responses, and drafts of the job application and event
registration templates.

The app has no scheduler of its own. The server calls the route once a
night, for example from cron (03:17 UTC):

```cron
17 3 * * * curl -fsS -X POST -H "Authorization: Bearer $DEMO_RESET_TOKEN" https://form-builder.ali-moradi-develop.com/api/demo/reset
```

The answer is `{ "reset": true }`, or `{ "reset": false }` when nobody has
opened the demo yet. A wrong or missing token gets `401`.
