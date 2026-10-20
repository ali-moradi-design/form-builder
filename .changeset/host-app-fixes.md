---
"@formweave/engine": patch
"@formweave/react": minor
---

Fixes for host apps: `className` now adds to `fw-form` instead of replacing it (#44); a new `theme` prop (`"light" | "dark" | "system"`), and without it the stylesheet follows an ancestor's `data-theme` before the operating system (#45); choice fields accept numbers and `true`/`false` as their option text, show them as selected and no longer clear them, and a required select with an answer drops the empty choice (#46).
