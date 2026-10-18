# UI mockups

Static HTML/CSS mockups of the main screens, rendered to PNG with Playwright.
They fix the look before any app code is written.

```sh
pnpm install
pnpm render              # all pages
pnpm render 02-builder   # one page
```

Pages live in `pages.mjs`, shared tokens in `styles.css` (light and dark,
English and Persian). Output: `png/` (committed) and `html/` (ignored).
