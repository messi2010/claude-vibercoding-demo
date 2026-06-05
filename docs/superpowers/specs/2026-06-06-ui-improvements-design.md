# UI/UX Improvements — Design Spec

**Date:** 2026-06-06  
**Status:** Approved

---

## Scope

Three independent improvements researched against TruyenFull, WebNovel, and RoyalRoad:

1. **Auto-hide reader bars + scroll progress** — `ReadingScrollView`
2. **Story card metadata** — `StoryCard`
3. **Genre filter chips on home page** — new `HomeStories` client component

---

## Feature 1: Auto-hide bars + reading progress bar

**File:** `apps/web/app/components/ReadingScrollView.tsx`

### Progress bar
A `h-0.5 bg-accent` strip fixed at the very top of the viewport (above the sticky header, `z-50`). Width driven by `scrollProgress` state (0–100%). Updated via a scroll event listener using `requestAnimationFrame` to avoid layout thrash.

```
scrollProgress = scrollY / (scrollHeight - innerHeight) * 100
```

### Auto-hide bars
- `barsVisible: boolean` state, default `true`.
- On any scroll event: set a 3-second debounce timer. When timer fires → `barsVisible = false`.
- On scroll upward (scrollY decreasing) → cancel timer, `barsVisible = true` immediately.
- Tapping the content `<main>` area → `barsVisible = true` and reset timer.
- Header and footer use `transition-transform duration-300`:
  - Visible: `translate-y-0`
  - Hidden: header → `-translate-y-full`, footer → `translate-y-full`

### Scroll direction detection
Track `lastScrollY` in a ref. On each scroll event, compare with `window.scrollY`:
- `scrollY < lastScrollY` → scrolling up → show bars
- `scrollY > lastScrollY` → scrolling down → start/reset hide timer

---

## Feature 2: Story card metadata

**File:** `apps/web/app/components/StoryCard.tsx`

`StoryResponse` already carries `latestChapterNumber?: number | null`. No API or schema changes needed.

Add a metadata row inside the info `<div>`, below the genre tags:

```
Ch.12        (latestChapterNumber, hidden if null)
```

Implementation: a small `text-xs text-gray-500` line below the genre tags:
```tsx
{story.latestChapterNumber != null && (
  <p className="text-xs text-gray-500 mt-1">Ch.{story.latestChapterNumber}</p>
)}
```

No view count — the `Story` model has no `viewCount` field and adding one requires a DB migration outside this scope.

---

## Feature 3: Genre filter chips on home page

**Files:**
- Create: `apps/web/app/components/HomeStories.tsx` — new client component
- Modify: `apps/web/app/page.tsx` — replace `<FeaturedGrid>` + `<RecentUpdates>` with `<HomeStories>`

### Architecture
Home `page.tsx` stays a server component. It passes the pre-fetched `stories` array to a new `HomeStories` client component that owns filtering state.

`HomeStories` renders:
1. Horizontal-scroll chip bar: **Tất cả** + one chip per genre present in `stories`
2. `FeaturedGrid` with the filtered slice
3. `RecentUpdates` with the filtered list

Active genre state is local (`useState`). Filtering is client-side (no new API call) — fine for the current 20-story page size.

### Chip design
```tsx
<div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
  {chips.map(chip => (
    <button
      key={chip.value}
      onClick={() => setActiveGenre(chip.value)}
      className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        activeGenre === chip.value
          ? 'bg-accent text-white'
          : 'bg-surface border border-deep text-gray-400 hover:text-white'
      }`}
    >
      {chip.label}
    </button>
  ))}
</div>
```

Chips are derived from the constant `GENRES` list (not computed from story data) so the full set always appears even if a genre has 0 stories in the current page.

### Filtered data
```ts
const filtered = activeGenre === 'all'
  ? stories
  : stories.filter(s => s.genres.includes(activeGenre))
```

`FeaturedGrid` and `RecentUpdates` already accept `stories: StoryResponse[]` — no prop changes needed.

---

## File Changes

| File | Action |
|------|--------|
| `apps/web/app/components/ReadingScrollView.tsx` | Modify — add progress bar + auto-hide |
| `apps/web/app/components/StoryCard.tsx` | Modify — add chapter count line |
| `apps/web/app/components/HomeStories.tsx` | Create — genre chips + filtered story sections |
| `apps/web/app/page.tsx` | Modify — use HomeStories instead of FeaturedGrid + RecentUpdates |

No API, DB, or type changes required.
