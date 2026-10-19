---
"@formweave/engine": minor
"@formweave/react": minor
---

Add the `address` field and dynamic options. Choice fields take `optionsBy` (lists picked by another answer, checked on the server too) and `optionsUrl` (lists loaded by the browser). Field definitions can declare `reads` and `options`; `FieldState.options` holds the current list. Renderers clear answers that leave the list.
