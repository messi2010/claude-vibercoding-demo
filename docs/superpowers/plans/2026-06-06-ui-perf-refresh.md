# UI/UX Refresh + Performance Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce SSR page load time by eliminating redundant API calls and sequential blocking fetches, while upgrading typography (Inter font), visual polish (card depth, hover effects), layout spacing, and micro-animations across all three critical pages.

**Architecture:** A new `cached-api.ts` module wraps `apiCall` with React's `cache()` to deduplicate same-request fetches (fixing the 4-call-per-ChapterPage problem). Page components are refactored to fetch session and story data in parallel. UI changes are CSS-only using Tailwind utilities — no new runtime dependencies.

**Tech Stack:** Next.js 14 App Router, React `cache()`, `next/font/google` (Inter), TailwindCSS v3, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/lib/api.ts` | Modify | Add `next` option forwarding to fetch |
| `apps/web/lib/cached-api.ts` | Create | React `cache()` wrappers + shared types |
| `apps/web/app/layout.tsx` | Modify | Inter font via `next/font`, apply to `<body>` |
| `apps/web/tailwind.config.ts` | Modify | `fontFamily.sans`, `animate-fade-in` keyframes |
| `apps/web/app/globals.css` | Modify | Body gradient, `@keyframes` removed (moved to Tailwind) |
| `apps/web/app/loading.tsx` | Create | Skeleton grid for home page SSR blank-screen prevention |
| `apps/web/app/page.tsx` | Modify | Parallel fetch with `cached-api` |
| `apps/web/app/stories/[slug]/page.tsx` | Modify | Parallel fetch, description card, `animate-fade-in` |
| `apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx` | Modify | Use `cached-api`, fix 4-call → 2-call |
| `apps/web/app/components/Navbar.tsx` | Modify | SVG icons replace emoji, styled text logo |
| `apps/web/app/components/StoryCard.tsx` | Modify | Gradient overlay, hover shadow, `ease-out` |
| `apps/web/app/components/HomeStories.tsx` | Modify | Filter bar grouping, section separator, chip press effect |
| `apps/web/app/components/FeaturedGrid.tsx` | Modify | Section bottom margin `mb-8 → mb-12` |
| `apps/web/app/components/ReadingScrollView.tsx` | Modify | `leading-[1.85]`, `text-[17px]` medium, `animate-fade-in` |
| `apps/web/app/stories/[slug]/ChapterList.tsx` | Modify | `min-h-[44px]`, left accent border on hover |

---

## Task 1: Extend `apiCall` with `next` option

**Files:**
- Modify: `apps/web/lib/api.ts`

- [ ] **Step 1: Update the file**

Replace the entire contents of `apps/web/lib/api.ts` with:

```ts
// Server-side only — attaches INTERNAL_API_SECRET to all Express API calls
// Never use this from client components

const API_URL = process.env.API_URL || 'http://localhost:4000'
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || ''

interface NextConfig {
  revalidate?: number | false
  tags?: string[]
}

interface FetchOptions extends RequestInit {
  userToken?: string
  next?: NextConfig
}

export async function apiCall<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { userToken, next, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-secret': INTERNAL_API_SECRET,
    ...(fetchOptions.headers as Record<string, string> || {}),
  }

  if (userToken) {
    headers['x-user-token'] = userToken
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    ...(next ? { next } : {}),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error ${res.status}`)
  }

  return res.json() as Promise<T>
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to `api.ts`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/api.ts
git commit -m "perf(api): add next option forwarding to apiCall"
```

---

## Task 2: Create `cached-api.ts`

**Files:**
- Create: `apps/web/lib/cached-api.ts`

- [ ] **Step 1: Create the file**

```ts
import { cache } from 'react'
import { apiCall } from './api'
import type { PaginatedResponse, StoryResponse, Chapter, ReadingProgress } from '@truyen/types'

export interface StoryWithChapters extends StoryResponse {
  chapters: Chapter[]
}

export interface ChapterWithPages {
  id: string
  storyId: string
  number: number
  title: string | null
  createdAt: string
  pages: Array<{ id: string; number: number; content: string }>
}

// Memoized per-request: multiple callers (generateMetadata + page component)
// sharing the same slug get one network call.
export const getStories = cache(() =>
  apiCall<PaginatedResponse<StoryResponse>>('/stories?page=1', {
    next: { revalidate: 30 },
  })
)

export const getStory = cache((slug: string) =>
  apiCall<StoryWithChapters>(`/stories/${slug}`, {
    next: { revalidate: 30 },
  })
)

export const getChapter = cache((slug: string, chapterNum: number) =>
  apiCall<ChapterWithPages>(`/stories/${slug}/chapters/${chapterNum}`, {
    next: { revalidate: 30 },
  })
)

export const getProgress = cache((userToken: string) =>
  apiCall<ReadingProgress[]>('/progress', { userToken })
)
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/cached-api.ts
git commit -m "perf(api): add React cache() wrappers for deduped server fetches"
```

---

## Task 3: Refactor `HomePage` to parallel fetch

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Replace the file**

```tsx
import { getSession } from '../lib/auth'
import { getStories, getProgress } from '../lib/cached-api'
import { Navbar } from './components/Navbar'
import { HomeStories } from './components/HomeStories'
import type { ReadingProgress } from '@truyen/types'

export default async function Home() {
  // Session and stories fetched in parallel — stories are public, no token needed
  const [session, storiesResult] = await Promise.all([
    getSession(),
    getStories().catch(() => null),
  ])

  const stories = storiesResult?.items ?? []

  const progress: ReadingProgress[] | null = session?.accessToken
    ? await getProgress(session.accessToken).catch(() => null)
    : null

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <HomeStories stories={stories} progress={progress} />
      </main>
    </>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "perf(home): parallel session+stories fetch, use cached-api"
```

---

## Task 4: Refactor `StoryPage` to parallel fetch

**Files:**
- Modify: `apps/web/app/stories/[slug]/page.tsx`

- [ ] **Step 1: Replace the file**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '../../../lib/auth'
import { getStory, getProgress } from '../../../lib/cached-api'
import type { ReadingProgress } from '@truyen/types'
import { Navbar } from '../../components/Navbar'
import { ChapterList } from './ChapterList'
import { ExpandableDescription } from './ExpandableDescription'
import { GenreCover } from '../../components/GenreCover'

interface StoryPageProps {
  params: { slug: string }
}

const GENRE_LABELS: Record<string, string> = {
  horror: 'Kinh Dị',
  fantasy: 'Huyền Huyễn',
  martial_arts: 'Kiếm Hiệp',
  romance: 'Ngôn Tình',
}

const GENRE_COLORS: Record<string, string> = {
  horror: 'bg-red-900 text-red-200',
  fantasy: 'bg-purple-900 text-purple-200',
  martial_arts: 'bg-yellow-900 text-yellow-200',
  romance: 'bg-pink-900 text-pink-200',
}

export async function generateMetadata({ params }: StoryPageProps) {
  try {
    const story = await getStory(params.slug)
    return { title: `${story.title} | TruyệnHay` }
  } catch {
    return {}
  }
}

export default async function StoryPage({ params }: StoryPageProps) {
  // Session and story fetched in parallel — story is public data
  const [session, story] = await Promise.all([
    getSession(),
    getStory(params.slug).catch(() => null),
  ])

  if (!story) notFound()

  const progressList: ReadingProgress[] | null = session?.accessToken
    ? await getProgress(session.accessToken).catch(() => null)
    : null

  const currentProgress = progressList?.find((p) => p.storyId === story.id) ?? null

  const currentChapterNum = currentProgress
    ? (story.chapters.find((c) => c.id === currentProgress.chapterId)?.number ?? null)
    : null

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        {/* Always two columns: cover left, info right */}
        <div className="flex gap-4 md:gap-8 mb-6">
          {/* Cover */}
          <div className="w-2/5 sm:w-1/3 shrink-0">
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-deep">
              {story.coverImage ? (
                <Image
                  src={story.coverImage}
                  alt={story.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 40vw, 33vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0">
                  <GenreCover title={story.title} genres={story.genres} id={story.slug} />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3 leading-tight tracking-tight">
              {story.title}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
              {story.genres.map((g) => (
                <Link
                  key={g}
                  href={`/genres/${g}`}
                  className={`text-xs md:text-sm px-2.5 md:px-3 py-1 rounded-md ${GENRE_COLORS[g] ?? 'bg-gray-700 text-gray-300'}`}
                >
                  {GENRE_LABELS[g] ?? g}
                </Link>
              ))}
              <span
                className={`text-xs md:text-sm px-2.5 md:px-3 py-1 rounded-md font-medium ${
                  story.status === 'COMPLETED'
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-green-800 text-green-100'
                }`}
              >
                {story.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang ra'}
              </span>
            </div>

            {/* Description — hidden on mobile */}
            {story.description && (
              <div className="hidden sm:block mb-4 bg-surface/60 rounded-lg p-4">
                <ExpandableDescription text={story.description} />
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3">
              {story.chapters.length > 0 && (
                <Link
                  href={`/stories/${story.slug}/chapters/${story.chapters[0].number}`}
                  className="bg-accent text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm md:text-base text-center shadow-md shadow-accent/25"
                >
                  {currentProgress ? 'Đọc từ đầu' : 'Đọc ngay'}
                </Link>
              )}
              {currentProgress && (() => {
                const resumeChapter = story.chapters.find(c => c.id === currentProgress.chapterId)
                return resumeChapter ? (
                  <Link
                    href={`/stories/${story.slug}/chapters/${resumeChapter.number}`}
                    className="bg-deep border border-accent text-accent px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-accent hover:text-white transition-colors text-sm md:text-base text-center"
                  >
                    Đọc tiếp Ch.{resumeChapter.number}
                  </Link>
                ) : null
              })()}
            </div>
          </div>
        </div>

        {/* Description on mobile */}
        {story.description && (
          <div className="sm:hidden mb-4 bg-surface/60 rounded-lg p-4">
            <ExpandableDescription text={story.description} />
          </div>
        )}

        {/* Chapter List */}
        {story.chapters.length > 0 && (
          <ChapterList
            chapters={story.chapters}
            slug={story.slug}
            currentChapterId={currentProgress?.chapterId}
            currentChapterNum={currentChapterNum}
          />
        )}
      </main>
    </>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/stories/[slug]/page.tsx
git commit -m "perf(story): parallel fetch + cached-api, polish badges and description card"
```

---

## Task 5: Refactor `ChapterPage` to fix double-fetch

**Files:**
- Modify: `apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx`

- [ ] **Step 1: Replace the file**

```tsx
import { notFound } from 'next/navigation'
import { getSession } from '../../../../../lib/auth'
import { getStory, getChapter } from '../../../../../lib/cached-api'
import { ReadingScrollView } from '../../../../components/ReadingScrollView'

interface ChapterPageProps {
  params: {
    slug: string
    chapter: string
  }
}

export async function generateMetadata({ params }: ChapterPageProps) {
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) return {}
  try {
    // Both calls are memoized — the page component calling the same fns
    // gets zero extra network requests.
    const [story, chapterData] = await Promise.all([
      getStory(params.slug),
      getChapter(params.slug, chapterNum),
    ])
    const suffix = chapterData.title ? ` – ${chapterData.title}` : ''
    return { title: `Ch.${chapterNum}${suffix} | ${story.title} | TruyệnHay` }
  } catch {
    return {}
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) notFound()

  // All three fetched in parallel; getStory/getChapter deduplicated with generateMetadata
  const [session, story, chapterData] = await Promise.all([
    getSession(),
    getStory(params.slug).catch(() => null),
    getChapter(params.slug, chapterNum).catch(() => null),
  ])

  if (!story || !chapterData) notFound()

  const chapter = story.chapters.find((c) => c.number === chapterNum)
  if (!chapter) notFound()

  return (
    <ReadingScrollView
      story={story}
      chapter={chapter}
      pages={chapterData.pages}
      chapters={story.chapters}
      slug={params.slug}
      session={session}
    />
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx"
git commit -m "perf(chapter): fix 4-call → 2-call via cached-api, parallel session fetch"
```

---

## Task 6: Add Inter font and update Tailwind config

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Update `layout.tsx`**

```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./components/Providers"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TruyệnHay - Đọc Truyện Online",
  description: "Vietnamese novel reading website",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1a2e',
        surface: '#16213e',
        deep: '#0f3460',
        accent: '#e94560',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out both',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/tailwind.config.ts
git commit -m "feat(ui): Inter font via next/font, fade-in animation in Tailwind"
```

---

## Task 7: Update `globals.css` with body gradient

**Files:**
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Replace the file**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: radial-gradient(ellipse at top, #1e1e3f 0%, #1a1a2e 60%);
  min-height: 100vh;
  color: #e0e0e0;
}

.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 2: Verify dev server renders the gradient**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:3000` in browser. Expected: subtle gradient visible at top of page (slightly blueish-purple tint fading to the dark base color). No layout shift.

Stop the dev server (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat(ui): radial gradient body background for visual depth"
```

---

## Task 8: Add home page skeleton loader

**Files:**
- Create: `apps/web/app/loading.tsx`

- [ ] **Step 1: Create the file**

```tsx
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Filter bar skeleton */}
      <div className="bg-surface/50 rounded-xl p-4 mb-8 animate-pulse">
        <div className="h-9 bg-deep rounded-lg mb-3" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-deep rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Section heading */}
      <div className="h-6 w-40 bg-deep rounded mb-4 animate-pulse" />

      {/* Featured grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-deep rounded-xl mb-2" />
            <div className="h-4 bg-deep rounded w-3/4 mb-1" />
            <div className="h-3 bg-deep rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/loading.tsx
git commit -m "feat(ui): skeleton loader for home page SSR blank-screen"
```

---

## Task 9: Update `Navbar.tsx` — SVG icons, styled text logo

**Files:**
- Modify: `apps/web/app/components/Navbar.tsx`

- [ ] **Step 1: Replace the logo and hamburger/close buttons**

In `apps/web/app/components/Navbar.tsx`, make these three targeted changes:

**Change 1 — Logo** (find `📖 TruyệnHay`):

```tsx
// Before
<Link href="/" className="text-xl font-bold text-white shrink-0">
  📖 TruyệnHay
</Link>

// After
<Link href="/" className="text-xl font-bold text-white shrink-0">
  Truyện<span className="text-accent">Hay</span>
</Link>
```

**Change 2 — Hamburger button** (find `{mobileOpen ? '✕' : '☰'}`):

```tsx
// Before
<button
  className="md:hidden ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-300 hover:text-white"
  onClick={() => setMobileOpen((v) => !v)}
  aria-label="Menu"
>
  {mobileOpen ? '✕' : '☰'}
</button>

// After
<button
  className="md:hidden ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-300 hover:text-white"
  onClick={() => setMobileOpen((v) => !v)}
  aria-label="Menu"
>
  {mobileOpen ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )}
</button>
```

**Change 3 — Mobile menu close button** (find `{mobileOpen && (` → close button inside):

```tsx
// Before (inside mobile panel, there is no explicit close button — the hamburger toggles it)
// No change needed here; the hamburger button above handles open/close.
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/Navbar.tsx
git commit -m "feat(ui): replace emoji logo/icons with SVG in Navbar"
```

---

## Task 10: Update `StoryCard.tsx` — gradient overlay, hover shadow, ease-out

**Files:**
- Modify: `apps/web/app/components/StoryCard.tsx`

- [ ] **Step 1: Apply three targeted changes**

**Change 1 — Card container:** add `hover:shadow-lg hover:shadow-black/30`, change `transition-colors` → `transition`:

```tsx
// Before
<div className="bg-surface rounded-xl overflow-hidden border border-deep hover:border-accent transition-colors">

// After
<div className="bg-surface rounded-xl overflow-hidden border border-deep hover:border-accent hover:shadow-lg hover:shadow-black/30 transition">
```

**Change 2 — Image zoom easing:** add `ease-out`:

```tsx
// Before
className="object-cover transition-transform duration-300 group-hover:scale-105"

// After
className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
```

Also add `ease-out` on the GenreCover wrapper:

```tsx
// Before
<div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">

// After
<div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105">
```

**Change 3 — Gradient overlay:** add after the `<Image>` or `<GenreCover>` block, before the status badge div. The full cover container becomes:

```tsx
<div className="relative w-full aspect-[2/3] bg-deep overflow-hidden">
  {story.coverImage ? (
    <Image
      src={story.coverImage}
      alt={story.title}
      fill
      className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      sizes="(max-width: 768px) 50vw, 25vw"
    />
  ) : (
    <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105">
      <GenreCover title={story.title} genres={story.genres} id={story.slug} />
    </div>
  )}
  {/* Gradient overlay for depth */}
  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
  {/* Status badge */}
  <div className="absolute top-2 right-2">
    <span
      className={`text-xs px-2 py-0.5 rounded font-medium ${
        story.status === 'COMPLETED'
          ? 'bg-blue-600 text-white'
          : 'bg-green-700 text-white'
      }`}
    >
      {story.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang ra'}
    </span>
  </div>
  {/* Reading progress stripe */}
  {readPct > 0 && (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
      <div
        className="h-full bg-accent"
        style={{ width: `${readPct}%` }}
      />
    </div>
  )}
</div>
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/StoryCard.tsx
git commit -m "feat(ui): story card gradient overlay, hover shadow, ease-out zoom"
```

---

## Task 11: Update `HomeStories.tsx` and `FeaturedGrid.tsx`

**Files:**
- Modify: `apps/web/app/components/HomeStories.tsx`
- Modify: `apps/web/app/components/FeaturedGrid.tsx`

- [ ] **Step 1: Replace `HomeStories.tsx`**

```tsx
'use client'
import { useState } from 'react'
import type { StoryResponse, ReadingProgress } from '@truyen/types'
import { FeaturedGrid } from './FeaturedGrid'
import { RecentUpdates } from './RecentUpdates'
import { ContinueReading } from './ContinueReading'

const GENRES = [
  { value: 'horror', label: 'Kinh Dị' },
  { value: 'fantasy', label: 'Huyền Huyễn' },
  { value: 'martial_arts', label: 'Kiếm Hiệp' },
  { value: 'romance', label: 'Ngôn Tình' },
]

interface HomeStoriesProps {
  stories: StoryResponse[]
  progress: ReadingProgress[] | null
}

export function HomeStories({ stories, progress }: HomeStoriesProps) {
  const [activeGenre, setActiveGenre] = useState<string>('all')
  const [search, setSearch] = useState('')

  const progressMap: Record<string, number> = {}
  if (progress) {
    for (const p of progress) {
      if (p.chapter?.number) progressMap[p.storyId] = p.chapter.number
    }
  }

  const filtered = stories.filter((s) => {
    const matchesGenre = activeGenre === 'all' || s.genres.includes(activeGenre)
    const matchesSearch = search === '' || s.title.toLowerCase().includes(search.toLowerCase())
    return matchesGenre && matchesSearch
  })

  return (
    <>
      {/* Filter bar */}
      <div className="bg-surface/50 rounded-xl p-4 mb-8">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm truyện..."
          className="w-full bg-surface border border-deep rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm mb-3"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveGenre('all')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition active:scale-95 ${
              activeGenre === 'all'
                ? 'bg-accent text-white'
                : 'bg-surface border border-deep text-gray-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          {GENRES.map((g) => (
            <button
              key={g.value}
              onClick={() => setActiveGenre(g.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition active:scale-95 ${
                activeGenre === g.value
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-deep text-gray-400 hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Chưa có truyện thể loại này
        </div>
      ) : (
        <>
          <FeaturedGrid stories={filtered} progressMap={progressMap} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentUpdates stories={filtered} />
            </div>
            {progress && progress.length > 0 && (
              <div>
                <ContinueReading progress={progress} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
```

- [ ] **Step 2: Update `FeaturedGrid.tsx`** — change `mb-8` to `mb-12`

```tsx
// In FeaturedGrid.tsx, change:
<section className="mb-8">
// to:
<section className="mb-12">
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/components/HomeStories.tsx apps/web/app/components/FeaturedGrid.tsx
git commit -m "feat(ui): filter bar grouping, chip press effect, section spacing"
```

---

## Task 12: Update `ReadingScrollView.tsx` — reader typography

**Files:**
- Modify: `apps/web/app/components/ReadingScrollView.tsx`

- [ ] **Step 1: Update `FONT_CLASSES` medium to `text-[17px]`**

```tsx
// Before
const FONT_CLASSES: Record<FontSize, string> = {
  small:  'text-sm',
  medium: 'text-base',
  large:  'text-lg',
  xlarge: 'text-xl',
}

// After
const FONT_CLASSES: Record<FontSize, string> = {
  small:  'text-sm',
  medium: 'text-[17px]',
  large:  'text-lg',
  xlarge: 'text-xl',
}
```

- [ ] **Step 2: Update reading content div — `leading-relaxed` → `leading-[1.85]`**

```tsx
// Before
className={`leading-relaxed ${FONT_CLASSES[fontSize]} ${tc.text} ${
  fontFamily === 'serif' ? 'font-serif' : 'font-sans'
}`}

// After
className={`leading-[1.85] ${FONT_CLASSES[fontSize]} ${tc.text} ${
  fontFamily === 'serif' ? 'font-serif' : 'font-sans'
}`}
```

- [ ] **Step 3: Add `animate-fade-in` to reading content `<main>`**

```tsx
// Before
<main
  className="flex-1 max-w-3xl mx-auto px-4 py-8"
  ref={contentRef}
  onClick={showBars}
>

// After
<main
  className="flex-1 max-w-3xl mx-auto px-4 py-8 animate-fade-in"
  ref={contentRef}
  onClick={showBars}
>
```

- [ ] **Step 4: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/components/ReadingScrollView.tsx
git commit -m "feat(ui): reader typography — 17px medium, 1.85 line-height, fade-in"
```

---

## Task 13: Update `ChapterList.tsx` — touch targets and hover accent line

**Files:**
- Modify: `apps/web/app/stories/[slug]/ChapterList.tsx`

- [ ] **Step 1: Replace the Link className inside the map**

```tsx
// Before
<Link
  key={ch.id}
  href={`/stories/${slug}/chapters/${ch.number}`}
  className={`flex items-center gap-3 px-4 py-3 hover:bg-deep transition-colors ${isCurrent ? 'bg-deep' : ''}`}
>

// After
<Link
  key={ch.id}
  href={`/stories/${slug}/chapters/${ch.number}`}
  className={`flex items-center gap-3 px-4 py-3 min-h-[44px] border-l-2 transition-colors ${
    isCurrent
      ? 'bg-deep border-accent'
      : 'border-transparent hover:bg-deep hover:border-accent'
  }`}
>
```

- [ ] **Step 2: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/stories/[slug]/ChapterList.tsx"
git commit -m "feat(ui): chapter list 44px touch targets, left accent hover border"
```

---

## Final Verification

- [ ] **Start dev server and verify all three critical pages**

```bash
cd apps/web && pnpm dev
```

Check each page:

1. **Home** (`http://localhost:3000`): Inter font loads, filter bar has card grouping, cards show gradient overlay and hover shadow, body has subtle gradient at top.

2. **Story detail** (`http://localhost:3000/stories/<any-slug>`): Badge corners are `rounded-md`, description has background card, CTA button has subtle glow, `animate-fade-in` plays on load.

3. **Chapter reader** (`http://localhost:3000/stories/<slug>/chapters/1`): Text uses 17px medium size, line-height is visibly more spacious than before, page fades in on load. Nav logo shows "TruyệnHay" without emoji.

- [ ] **Check browser Network tab on Home page load**

In DevTools → Network: the total number of fetch requests from the server should be 2 (stories + optional progress), not 3+. SSR response time (TTFB) should be noticeably faster than before the parallel fetch changes.

- [ ] **Check browser Network tab on Chapter page load**

Total API calls from server should be 2 (story + chapter), not 4. `generateMetadata` and the page component should share cached results.

---

## Success Criteria

- [ ] All 13 tasks committed cleanly with no TypeScript errors
- [ ] Home, Story, and Chapter pages load with `animate-fade-in`
- [ ] Inter font renders correctly for Vietnamese text
- [ ] ChapterPage API call count: 2 (was 4)
- [ ] HomePage: session fetch no longer blocks stories fetch
- [ ] StoryCard shows gradient overlay and shadow on hover
- [ ] Filter chips respond with `active:scale-95` on tap
- [ ] ChapterList rows have `min-h-[44px]` and accent left border on hover
- [ ] No regressions in auth, admin, or progress-tracking flows
