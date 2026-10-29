---
"@formcanvas/react": patch
---

`Field` is memoized, so a re-render of `<Form>` (new props, a step change) no longer re-renders every field. The colour fields' eyedropper button appears after hydration instead of during the first render, which fixes a hydration mismatch in server-rendered pages.
