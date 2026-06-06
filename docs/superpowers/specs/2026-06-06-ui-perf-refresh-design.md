# UI/UX Refresh + Performance Optimization

**Date:** 2026-06-06  
**Scope:** Home page, Story detail page, Chapter reader  
**Target:** Page load under 1s on localhost; improved typography, visual polish, layout, and micro-interactions

---

## 1. Performance Layer

### 1.1 React `cache()` for API deduplication

Create `apps/web/lib/cached-api.ts` exporting cached wrappers:

```ts
import { cache } from 'react'
import { apiCall } from './api'

export const getStories = cache(() =>
  apiCall<PaginatedResponse<StoryResponse>>('/stories?page=1', {
    next: { revalidate: 30 },
  })
)

export const getStory = cache((slug: string, userToken?: string) =>
  apiCall<StoryWithChapters>(`/stories/${slug}`, {
    userToken,
    next: { revalidate: 30 },
  })
)

export const getChapter = cache((slug: string, chapterNum: number, userToken?: string) =>
  apiCall<ChapterWithPages>(`/stories/${slug}/chapters/${chapterNum}`, {
    userToken,
    next: { revalidate: 30 },
  })
)

export const getProgress = cache((userToken: string) =>
  apiCall<ReadingProgress[]>('/progress', { userToken })
)
```

`cache()` memoizes per-request: `generateMetadata` and the page component calling `getStory(slug)` with the same args share one network call.

### 1.2 Parallel session + data fetch

Replace the sequential `await getSession()` → `await apiCall(...)` pattern in all three page components:

Story/chapter data is public — no token needed for the main fetch. Only `getProgress` needs a token. Run session + story + chapter in parallel; use session result only for the progress call:

```ts
// After (parallel — session does not block story/chapter fetch)
const [session, story, chapterData] = await Promise.all([
  getSession(),
  getStory(params.slug),
  getChapter(params.slug, chapterNum),
])

// Progress is user-specific — only fetch if logged in
const progress = session?.accessToken
  ? await getProgress(session.accessToken).catch(() => null)
  : null
```

### 1.3 Fix `generateMetadata` double-fetch in ChapterPage

Currently `generateMetadata` and the page component each call `/stories/:slug` and `/stories/:slug/chapters/:n` independently (4 HTTP calls total). With `cache()` wrappers, both share the same memoized result — 0 extra network calls.

### 1.4 `next: { revalidate: 30 }` on read-only fetches

All GET calls to `/stories` and `/stories/:slug` pass `next: { revalidate: 30 }` so Next.js caches the fetch response for 30 seconds. Progress and auth calls are excluded (user-specific, must be fresh).

---

## 2. Typography

### 2.1 Inter font

Add to `apps/web/app/layout.tsx`:

```ts
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' })
```

Apply `className={inter.variable}` on `<html>`. Update `tailwind.config.ts` to set `fontFamily.sans = ['var(--font-sans)', ...defaultTheme.fontFamily.sans]`.

### 2.2 Reader typography

In `ReadingScrollView`, apply to the content column:
- `text-[17px] leading-[1.85]` — comfortable Vietnamese long-form reading
- `max-w-[68ch] mx-auto` — optimal line measure (60–70 chars)

### 2.3 Heading refinement

Story detail `<h1>`: add `tracking-tight` to tighten letter-spacing on large sizes.

---

## 3. Visual Polish

### 3.1 Story card gradient overlay

In `StoryCard`, add an overlay div inside the cover container:

```tsx
<div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
```

Placed above the image, below the status badge.

### 3.2 Card hover shadow

Add `hover:shadow-lg hover:shadow-black/30` alongside existing `hover:border-accent transition-colors`. Include `transition-shadow` in the transition set.

### 3.3 CTA button glow

Primary `bg-accent` buttons: add `shadow-md shadow-accent/25`.

### 3.4 Genre badges

- Detail page badges: `px-2.5 py-1 rounded-md` (from `px-2 py-0.5 rounded-full`)
- Homepage filter chips: keep `rounded-full`

### 3.5 Navbar cleanup

- Replace `📖` emoji logo with styled text: `<span className="text-xl font-bold"><span className="text-accent">Truyện</span>Hay</span>`
- Replace `☰` / `✕` with inline SVG hamburger/close icons

### 3.6 Background depth

In `globals.css`, replace flat `background-color` with:

```css
body {
  background: radial-gradient(ellipse at top, #1e1e3f 0%, #1a1a2e 60%);
  min-height: 100vh;
  color: #e0e0e0;
}
```

---

## 4. Layout / Spacing

### 4.1 Home page — section separation

- `FeaturedGrid` bottom margin: `mb-8 → mb-12`
- Add `<hr className="border-deep my-8" />` between Featured and Recent sections

### 4.2 Home page — filter bar grouping

Wrap search input + genre chips in:

```tsx
<div className="bg-surface/50 rounded-xl p-4 mb-8">
  {/* search input */}
  {/* genre chips */}
</div>
```

### 4.3 Story detail — description card

Wrap `ExpandableDescription` in `<div className="bg-surface/60 rounded-lg p-4">`.

### 4.4 Reader — content padding

Ensure content column has `py-8` top padding so text doesn't start directly below the navbar.

### 4.5 Chapter list — touch targets

Each chapter row: ensure `min-h-[44px]` and `py-3` padding for comfortable mobile tapping.

---

## 5. Micro-interactions

### 5.1 Page fade-in

Add to `globals.css`:

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Add to `tailwind.config.ts`:

```ts
animation: {
  'fade-in': 'fade-in 150ms ease-out both',
}
```

Apply `animate-fade-in` on `<main>` of Home, Story detail, and Chapter reader pages.

### 5.2 Genre filter chips — press feedback

Add `active:scale-95 transition-transform` to each chip button.

### 5.3 Card image zoom — easing

Change `transition-transform duration-300` → `transition-transform duration-300 ease-out`.

### 5.4 Chapter list — hover accent line

Each chapter `<li>` or row div: add `border-l-2 border-transparent hover:border-accent transition-colors pl-3`.

### 5.5 Home page skeleton loader

Add `apps/web/app/loading.tsx` with an `animate-pulse` skeleton grid matching the FeaturedGrid layout (8 card placeholders) to prevent blank screen during SSR data fetch.

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/lib/cached-api.ts` | New — React `cache()` wrappers |
| `apps/web/lib/api.ts` | Add `next` option support to `apiCall` |
| `apps/web/app/layout.tsx` | Inter font, `--font-sans` variable |
| `apps/web/app/loading.tsx` | New — skeleton grid for home |
| `apps/web/app/page.tsx` | Parallel fetch, use cached-api |
| `apps/web/app/globals.css` | Body gradient, `@keyframes fade-in` |
| `apps/web/tailwind.config.ts` | Font family, `animate-fade-in` |
| `apps/web/app/components/Navbar.tsx` | SVG icons, text logo |
| `apps/web/app/components/StoryCard.tsx` | Gradient overlay, hover shadow, ease-out |
| `apps/web/app/components/HomeStories.tsx` | Filter bar grouping, section spacing |
| `apps/web/app/components/FeaturedGrid.tsx` | Section margin |
| `apps/web/app/stories/[slug]/page.tsx` | Parallel fetch, description card, `animate-fade-in` |
| `apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx` | Cached API, `animate-fade-in` |
| `apps/web/app/components/ReadingScrollView.tsx` | Reader typography, content padding |
| `apps/web/app/stories/[slug]/ChapterList.tsx` | Touch targets, hover accent line |

---

## Success Criteria

- Home page: SSR response time drops ≥40% (parallel fetch + cache)
- ChapterPage: API calls reduced from 4 → 2 per request (React cache dedup)
- Inter font loads with zero FOUT (next/font optimization)
- All three pages have `animate-fade-in` on content mount
- No existing functionality broken (auth, progress tracking, admin)
