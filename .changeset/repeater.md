---
"@formcanvas/engine": minor
"@formcanvas/react": minor
---

Add the `repeater` field: a list of rows made of its child fields, with `minRows`, `maxRows` and `rowLabel`. Each row is checked as a form of its own (conditions read the same row), issues inside rows use paths such as `people.0.name`, and repeaters can be nested. New `rows` flag on field definitions, `CompiledField.rows`, and the `RowsApi` prop for row renderers.
