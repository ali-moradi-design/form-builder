---
"@formcanvas/engine": patch
---

Harden validation against hostile input: text built by expressions (`concat`) is capped at `MAX_TEXT_LENGTH` (10,000 characters), so chained calculated fields can no longer exhaust memory, and the URL check (and email detection in `infer`) now runs in linear time on long values.
