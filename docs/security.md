# Security

Last review: 2026-10-19. Form documents and answers are treated as hostile:
anyone can open the demo, and published forms take answers from anyone.

## What protects what

| Threat                                   | Protection                                                                                                                                                               | Test                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Code in a form document                  | Logic is data run by a small interpreter: no `eval`, `Function` or HTML; operators are own properties only; depth ≤ 64                                                   | `engine/src/expr.test.ts`, `security.test.ts` |
| Memory blow-up through calculated fields | Text built by expressions stops at `MAX_TEXT_LENGTH` (10,000)                                                                                                            | `engine/src/security.test.ts`                 |
| Regex denial of service                  | No pattern comes from documents; built-in patterns are linear and long values never reach them                                                                           | `engine/src/security.test.ts`                 |
| Prototype pollution                      | Validated data holds only the form's keys; field keys must start with a letter                                                                                           | `engine/src/security.test.ts`                 |
| XSS                                      | React escapes all text; no raw HTML anywhere; picture URLs are `https:` or same-site paths                                                                               | a11y and e2e runs                             |
| SQL injection                            | Every query goes through Drizzle with parameters; answers are stored as JSONB data                                                                                       | —                                             |
| Malicious uploads                        | Type checked against the file's bytes and name; only plain images open inline, everything else downloads with `nosniff` and a sandbox policy; owner-only                 | `upload.test.ts`, `uploads.spec.ts`           |
| Spreadsheet formulas in exports          | Cells starting with `= + - @` are escaped                                                                                                                                | `export.test.ts`                              |
| Flooding a public form                   | Rate limits per address and form (address from Nginx, not the client); body caps read as a stream; 2 GB upload quota, 200 MB pending per form; 10,000 responses per form | `limits.test.ts`, `read-body.test.ts`         |
| Spam                                     | Honeypot field; server-side validation with the same engine                                                                                                              | `accept.test.ts`                              |
| Webhooks to internal hosts (SSRF)        | `https` only, no redirects, private addresses refused when saving and again in the socket's own DNS lookup (no DNS rebinding)                                            | `webhooks.test.ts`                            |
| Phishing pages on our domain             | Public sign-up is off; demo forms show a warning, are `noindex` and are wiped every night                                                                                | `auth.spec.ts`, `sign-up.test.ts`             |
| Clickjacking                             | Only `/f/…` may be framed; CSP `frame-ancestors`, `X-Frame-Options`                                                                                                      | —                                             |
| Other browser attacks                    | CSP, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (`next.config.ts`)                                                                                         | —                                             |
| Vulnerable dependencies                  | `pnpm audit --prod` in CI; overrides in `pnpm-workspace.yaml`; the npm packages have no runtime dependencies besides peers                                               | CI                                            |
| Data of other accounts                   | Every query filters by owner                                                                                                                                             | `forms.test.ts`                               |

## Known limits

- The CSP allows `'unsafe-inline'` scripts (Next.js inline data) and jsDelivr
  (the JSON editor loads Monaco from it). Moving to nonces and a bundled
  Monaco would tighten it.
- Rate limits live in memory, so they reset on restart and are per process.
  That fits one server.

## Server checklist (VPS)

- Nginx in front; the app's port published only on `127.0.0.1`.
- Nginx sets `X-Real-IP $remote_addr` and `client_max_body_size 51m`; add
  `limit_req` for `/api/` as a second layer.
- Containers with memory and CPU limits and `restart: unless-stopped`, so a
  bad request can't take the whole VPS down; run as a non-root user.
- Postgres only on the compose network, no published port; daily backups
  copied off the server.
- `ufw`, `fail2ban`, unattended upgrades, SSH keys only.
- Secrets (`BETTER_AUTH_SECRET`, `DEMO_RESET_TOKEN`, database URL) only in
  `.env` on the server; `PUBLIC_SIGN_UP` unset.

## Publishing to npm

- npm account with two-factor authentication for publishing.
- A granular access token limited to the `@formweave` scope, stored only as
  the `NPM_TOKEN` repository secret.
- Publish from GitHub Actions with provenance (`npm publish --provenance`),
  never from a laptop.
- Check every release with `pnpm check:package` and review the tarball
  contents (`files` in each `package.json`).
