---
"@formweave/schema": minor
"@formweave/engine": minor
"@formweave/react": minor
---

Add calculated values. Any field can have a `calculate` expression; the engine works out calculated fields in dependency order (`CompiledForm.calculated`, `calculateValues`), rejects fields calculated from themselves, makes them read-only, lets conditions read them, and replaces sent values when validating. New `calculated` field type and renderer (number, currency or percent). Calculations inside repeater rows read the same row.
