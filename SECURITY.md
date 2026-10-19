# Security policy

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private reporting instead:
**Security → Report a vulnerability** on this repository. You will get an
answer within a week. Fixes are released as patch versions of the affected
`@formweave/*` packages and noted in their changelogs.

## Supported versions

Only the latest minor version of each package gets security fixes.

## Scope

- `@formweave/schema`, `@formweave/engine`, `@formweave/react` (npm).
- The web app in `apps/web` and its public API.

How the code is hardened, what is tested and how the server must be set up
is in [`docs/security.md`](docs/security.md).
