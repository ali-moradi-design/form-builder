---
"@formcanvas/engine": minor
---

Add the safe expression interpreter (`@formcanvas/engine/expr`): `evalExpression`, `readsFields` and `truthy`. It never throws, never runs code, short-circuits `and`/`or`/`if`, stops at a depth limit, and only accepts operators from the allow-list (including names like `constructor`).
