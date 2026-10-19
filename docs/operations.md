# Operations

How the web app is run on a server. Deployment itself is still to be set up.

## Environment variables

| Variable                | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`          | Postgres connection string. Without it the app uses PGlite on disk.    |
| `PGLITE_DIR`            | PGlite folder (default `.data/pglite`); `memory://` for tests.         |
| `BETTER_AUTH_SECRET`    | Secret for sessions (at least 32 characters).                          |
| `BETTER_AUTH_URL`       | Public URL of the app.                                                 |
| `DEMO_RESET_TOKEN`      | Enables `POST /api/demo/reset`. Without it the route answers 404.      |
| `SUBMIT_RATE_LIMIT`     | Submissions per address and form per minute (default 10).              |
| `UPLOAD_RATE_LIMIT`     | Uploads per address and form per minute (default 30).                  |
| `AUTH_RATE_LIMIT`       | `off` turns off sign-in rate limits (tests only).                      |
| `WEBHOOK_ALLOW_PRIVATE` | `1` allows webhooks to private addresses (development and tests only). |

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
