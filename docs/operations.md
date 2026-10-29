# Operations

How the web app is run on a server.

## Deployment

Live at https://formcanvas.ali-moradi-develop.com (one VPS, Nginx on the host).

- `next build` makes a standalone server (`output: "standalone"`);
  `apps/web/scripts/standalone.mjs` adds `public/`, `.next/static` and the
  migrations (`drizzle/`). The image (`apps/web/Dockerfile`) holds only that
  folder and runs as `node`.
- `.github/workflows/docker.yml` runs after CI passed on `main`: it builds
  `ghcr.io/ali-moradi-design/formcanvas-web:<sha>`, then deploy-kit's
  `deploy-app.yml` makes the server pull it and restart
  (`docker compose up --wait`, rolled back when not healthy), and checks a few
  paths through Nginx.
- On the server: `/srv/apps/formcanvas/compose.yaml` (from `deploy/`) runs the
  web container on `127.0.0.1:3112` and its own Postgres (no published port,
  internal network). Uploaded files live in Postgres, so the database volume
  is the only state. Secrets are in `.env` next to it (`deploy/.env.example`).
- Nginx: `deploy/nginx.conf`, with a certificate from certbot.
- `GET /api/health` answers 200 when the database is reachable and migrated;
  the container healthcheck uses it.

## Environment variables

| Variable                 | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `DATABASE_URL`           | Postgres connection string. Without it the app uses PGlite on disk.         |
| `PGLITE_DIR`             | PGlite folder (default `.data/pglite`); `memory://` for tests.              |
| `BETTER_AUTH_SECRET`     | Secret for sessions (at least 32 characters).                               |
| `BETTER_AUTH_URL`        | Public URL of the app.                                                      |
| `PUBLIC_SIGN_UP`         | `on` lets anyone create an account. Off by default: only the demo account.  |
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
17 3 * * * cd /srv/apps/formcanvas && curl -fsS -X POST -H "Authorization: Bearer $(sed -n 's/^DEMO_RESET_TOKEN=//p' .env)" https://formcanvas.ali-moradi-develop.com/api/demo/reset 2>&1 | logger -t formcanvas-reset
```

The answer is `{ "reset": true }`, or `{ "reset": false }` when nobody has
opened the demo yet. A wrong or missing token gets `401`.
