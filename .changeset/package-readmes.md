---
"@formcanvas/schema": patch
"@formcanvas/engine": patch
"@formcanvas/react": patch
---

Each package has a README with examples, a license file and npm metadata (keywords, homepage, provenance). `createRegistry` now accepts single field types and custom types defined with `defineField` (before, only `allFields` type-checked); the new `AnyFieldDefinition` type names "any field definition".
