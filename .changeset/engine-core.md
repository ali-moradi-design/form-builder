---
"@formweave/engine": minor
---

Add the engine core: `defineField` and `createRegistry` for field types, `compile` (field index, defaults, dependency graph, `SchemaError`) and `evaluate` (visible, required and disabled state, with incremental updates that reuse unchanged objects). Add the first field types in `@formweave/engine/fields`: shortText, longText, email, number, select, radio, checkboxes, switch, date and group, plus `allFields` in `@formweave/engine/fields/all`.
