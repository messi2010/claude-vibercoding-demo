# Mobile-First + Continuous Scroll Reading — Design Spec

**Date:** 2026-06-06  
**Status:** Approved

---

## Overview

Convert the reading experience from a paginated model (one page per URL, prev/next buttons) to a continuous scroll model (all pages of a chapter loaded at once). Simultaneously apply mobile-first layout improvements across the Navbar and reading header.

---

## Goals

1. Readers can scroll through a full chapter without clicking next/prev.
2. Reading progress is still saved (by visible page via IntersectionObserver).
3. Navbar works cleanly on mobile (hamburger menu instead of inline items).
4. Font size controls are accessible on all screen sizes.

---

## Architecture

### New route: `/stories/[slug]/chapters/[chapter]`

File: `apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx`

- Server component: fetches story + full chapter (all pages) in parallel using the existing `GET /stories/:slug/chapters/:chapterNumber` API endpoint (already returns `pages[]`).
- Passes `pages: Array<{id, number, content}>` to a new client component `ReadingScrollView`.
- Old `/pages/[page]` route component: issues a `redirect()` to the chapter URL — no content change, just a 301.

### New component: `ReadingScrollView`

File: `apps/web/app/components/ReadingScrollView.tsx`

Replaces `ReadingView` for the new scroll route. Shares no state with `ReadingView` (which stays intact for backward compatibility until old URLs fully retire).

**Layout (mobile-first):**

```
┌─────────────────────────────┐
│  Sticky TopBar (h-12)       │  ← breadcrumb, chapter menu icon, font controls
├─────────────────────────────┤
│                             │
│  Scrollable content         │  ← all pages, separated by dividers
│                             │
├─────────────────────────────┤
│  Sticky BottomBar           │  ← Ch.Trước | scroll-to-top | Ch.Tiếp
└─────────────────────────────┘
```

**Content rendering:**

Each page is a `<section data-page={page.number}>` block. Between pages: a thin `<hr>` divider. No hard breaks or pagination UI.

**Progress tracking:**

- `IntersectionObserver` watches each `<section data-page>` with `threshold: 0.5`.
- When a section crosses 50% visibility, record its page number.
- Debounce 1 second then `PATCH /api/progress` with `{ storyId, chapterId, pageNumber }`.
- Same logic as the current `ReadingView`.

**Chapter sidebar:**

Identical to `ReadingView` — slide-in drawer on mobile, visible on `lg:` screens.

**Font size:**

- Controls always visible in top bar (remove `hidden sm:flex` restriction).
- Persisted to `localStorage` under same key (`reading-font-size`).

### Navbar mobile improvements

File: `apps/web/app/components/Navbar.tsx`

- Add hamburger state (`mobileOpen`).
- On `md:` and larger: current layout unchanged.
- Below `md:`: show logo + hamburger only in the top bar; genre links and auth move into a slide-down mobile menu panel.
- Touch targets: all interactive items `min-h-[44px]`.

---

## File Changes

| File | Change |
|------|--------|
| `apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx` | New — scroll reading server page |
| `apps/web/app/components/ReadingScrollView.tsx` | New — scroll reading client component |
| `apps/web/app/stories/[slug]/chapters/[chapter]/pages/[page]/page.tsx` | Modified — add redirect to chapter URL |
| `apps/web/app/components/Navbar.tsx` | Modified — mobile hamburger menu |

No API or database changes required.

---

## Progress Tracking Behaviour

| State | Behaviour |
|-------|-----------|
| Not logged in | `IntersectionObserver` still runs but skips the `fetch` |
| Logged in | Debounced PATCH on each newly-visible page section |
| Chapter end | Final page triggers save, bottom bar shows "Hết chương" |

---

## Out of Scope

- Lazy-loading pages on scroll (all pages load upfront; chapters are short enough that this is fine)
- Remembering scroll position within a chapter (resume goes to page number, not pixel offset)
- Dark/light mode toggle
- Search
