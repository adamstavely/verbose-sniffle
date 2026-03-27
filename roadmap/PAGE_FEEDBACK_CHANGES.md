# Page feedback: integration notes for recent UI changes

This document describes **two related changes** to the “Was this page helpful?” block (`PageFeedback.astro`) and how it is included from the layout. Use it when **merging these updates into an existing Astro codebase** that already has `PageFeedback` and `BaseLayout` (or your equivalent).

---

## Change 1 — Right-align the feedback block

**Goal:** The question, thumbs, optional “What could we improve?” form, and thank-you/error messages align to the **right** of the main column instead of the left.

**File:** `src/components/PageFeedback.astro` (path inside your app may differ).

### What to update

1. **Question + buttons row** (`#page-feedback-buttons`)

   - Ensure the row spans the content width and pushes the group to the end:

   - Add Tailwind classes: `w-full`, `justify-end` (keep existing `flex`, `flex-wrap`, `items-center`, `gap-3`).

2. **“What could we improve?” block** (`#page-feedback-message-wrap`)

   - Add: `ml-auto`, `w-full`, `max-w-md` so the form sits on the right with a sensible max width.

3. **Thanks and error lines** (`#page-feedback-thanks`, `#page-feedback-error`)

   - Add: `w-full`, `text-right` (keep existing margin and color classes).

No JavaScript changes are required for alignment.

---

## Change 2 — Show feedback only on selected routes

**Goal:** Render `PageFeedback` only on **About**, **User Guide**, and **Developer Guide** pages—not on the homepage, roadmap, status area, releases, or other routes.

**File:** `src/layouts/BaseLayout.astro` (or wherever you render `<PageFeedback />`).

### What to update

1. **Remove** a blanket `showFeedback` prop (if you had one defaulting to `true`) unless you still need an explicit override for special pages.

2. **After** reading `Astro.props`, compute the current path and whether feedback should show:

   - Normalize the pathname: strip a trailing slash except for root (e.g. `/about/` → `/about`, `/` stays `/`).
   - Define the allowlist of paths where feedback appears (adjust to your URLs):

     - `/about`
     - `/user-guide`
     - `/developer-guide`

   - Example logic:

```ts
const path = Astro.url.pathname.replace(/\/$/, '') || '/';
const showPageFeedback = new Set(['/about', '/user-guide', '/developer-guide']).has(path);
```

3. **Conditionally render** the component:

```astro
{showPageFeedback && <PageFeedback pagePath={Astro.url.pathname} />}
```

### Customizing the allowlist

- Add or remove strings in the `Set` to match your real routes (e.g. localized paths or nested docs).
- If you use a **base path** (`site` / `base` in Astro config), ensure the strings you compare against match **pathname** as Astro exposes it (including or excluding the base, depending on your setup).

---

## Files touched in this repository

| File | Role |
|------|------|
| [`src/components/PageFeedback.astro`](src/components/PageFeedback.astro) | Change 1 — layout classes |
| [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro) | Change 2 — route allowlist + conditional render |

---

## Related documentation

- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) — overall merge steps for the roadmap/status app
- [`src/actions/index.ts`](src/actions/index.ts) — `feedback` action backing the form (unchanged by these two UI changes)
