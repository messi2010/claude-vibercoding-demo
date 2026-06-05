# UI/UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add story card chapter count, genre filter chips on the home page, and auto-hiding reader bars with a scroll progress bar.

**Architecture:** Three independent frontend-only changes — a one-line addition to `StoryCard`, a new `HomeStories` client component that wraps the existing `FeaturedGrid`/`RecentUpdates`, and scroll event logic added to `ReadingScrollView`. No API or DB changes.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS 3, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/app/components/StoryCard.tsx` | Modify | Show `Ch.N` below genre tags |
| `apps/web/app/components/HomeStories.tsx` | Create | Genre chips + filtered story sections client component |
| `apps/web/app/page.tsx` | Modify | Replace FeaturedGrid + RecentUpdates with `<HomeStories>` |
| `apps/web/app/components/ReadingScrollView.tsx` | Modify | Progress bar + auto-hide bars on scroll |

---

## Task 1: Story card chapter count

**Files:**
- Modify: `apps/web/app/components/StoryCard.tsx`

- [ ] **Step 1: Add chapter count below genre tags**

In `apps/web/app/components/StoryCard.tsx`, find the info `<div className="p-3">` block. After the genre tags `<div>`, add a chapter count line so the block looks like:

```tsx
{/* Info */}
<div className="p-3">
  <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-accent transition-colors">
    {story.title}
  </h3>
  <div className="flex flex-wrap gap-1 mt-2">
    {story.genres.slice(0, 2).map((g) => (
      <span
        key={g}
        className={`text-xs px-2 py-0.5 rounded-full ${GENRE_COLORS[g] ?? 'bg-gray-700 text-gray-300'}`}
      >
        {GENRE_LABELS[g] ?? g}
      </span>
    ))}
  </div>
  {story.latestChapterNumber != null && (
    <p className="text-xs text-gray-500 mt-1">Ch.{story.latestChapterNumber}</p>
  )}
</div>
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/StoryCard.tsx
git commit -m "feat(web): show chapter count on story cards"
```

---

## Task 2: Genre filter chips on home page

**Files:**
- Create: `apps/web/app/components/HomeStories.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Create `HomeStories.tsx`**

Create `apps/web/app/components/HomeStories.tsx`:

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
  { value: 'adult', label: '18+' },
]

interface HomeStoriesProps {
  stories: StoryResponse[]
  progress: ReadingProgress[] | null
}

export function HomeStories({ stories, progress }: HomeStoriesProps) {
  const [activeGenre, setActiveGenre] = useState<string>('all')

  const filtered =
    activeGenre === 'all'
      ? stories
      : stories.filter((s) => s.genres.includes(activeGenre))

  return (
    <>
      {/* Genre filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveGenre('all')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeGenre === g.value
                ? 'bg-accent text-white'
                : 'bg-surface border border-deep text-gray-400 hover:text-white'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <FeaturedGrid stories={filtered} />

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
  )
}
```

- [ ] **Step 2: Update `page.tsx` to use `HomeStories`**

Replace the entire contents of `apps/web/app/page.tsx` with:

```tsx
import { getSession } from '../lib/auth'
import { apiCall } from '../lib/api'
import type { PaginatedResponse, StoryResponse, ReadingProgress } from '@truyen/types'
import { Navbar } from './components/Navbar'
import { HomeStories } from './components/HomeStories'

export default async function Home() {
  const session = await getSession()

  const [storiesResult, progressResult] = await Promise.allSettled([
    apiCall<PaginatedResponse<StoryResponse>>('/stories?page=1'),
    session?.accessToken
      ? apiCall<ReadingProgress[]>('/progress', { userToken: session.accessToken })
      : Promise.resolve(null),
  ])

  const stories =
    storiesResult.status === 'fulfilled' ? storiesResult.value.items : []
  const progress =
    progressResult.status === 'fulfilled' && progressResult.value
      ? progressResult.value
      : null

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <HomeStories stories={stories} progress={progress} />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/components/HomeStories.tsx apps/web/app/page.tsx
git commit -m "feat(web): genre filter chips on home page"
```

---

## Task 3: Auto-hide bars + reading progress bar

**Files:**
- Modify: `apps/web/app/components/ReadingScrollView.tsx`

- [ ] **Step 1: Replace the full contents of `ReadingScrollView.tsx`**

Replace the entire file with:

```tsx
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { StoryResponse, Chapter } from '@truyen/types'
import type { Session } from 'next-auth'

interface ReadingScrollViewProps {
  story: StoryResponse
  chapter: Chapter
  pages: Array<{ id: string; number: number; content: string }>
  chapters: Chapter[]
  slug: string
  session: Session | null
}

type FontSize = 'small' | 'medium' | 'large'

const FONT_CLASSES: Record<FontSize, string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
}

const LS_FONT_KEY = 'reading-font-size'
const BAR_HIDE_DELAY = 3000

export function ReadingScrollView({
  story,
  chapter,
  pages,
  chapters,
  slug,
  session,
}: ReadingScrollViewProps) {
  const router = useRouter()
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [barsVisible, setBarsVisible] = useState(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollYRef = useRef(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(LS_FONT_KEY) as FontSize | null
    if (stored && stored in FONT_CLASSES) setFontSize(stored)
  }, [])

  const updateFontSize = (size: FontSize) => {
    setFontSize(size)
    localStorage.setItem(LS_FONT_KEY, size)
  }

  const showBars = useCallback(() => {
    setBarsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setBarsVisible(false), BAR_HIDE_DELAY)
  }, [])

  // Scroll listener: progress bar + auto-hide
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        setScrollProgress(maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0)

        if (scrollY < lastScrollYRef.current) {
          // scrolling up — show bars immediately
          showBars()
        } else {
          // scrolling down — reset hide timer
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          hideTimerRef.current = setTimeout(() => setBarsVisible(false), BAR_HIDE_DELAY)
        }
        lastScrollYRef.current = scrollY
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [showBars])

  const saveProgress = useCallback(
    (pageNumber: number) => {
      if (!session) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveStatus('saving')
      saveTimerRef.current = setTimeout(() => {
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storyId: story.id,
            chapterId: chapter.id,
            pageNumber,
          }),
        })
          .then(() => setSaveStatus('saved'))
          .catch(() => setSaveStatus('error'))
      }, 1000)
    },
    [session, story.id, chapter.id],
  )

  useEffect(() => {
    if (!session || !contentRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = parseInt(
              (entry.target as HTMLElement).dataset.page ?? '0',
              10,
            )
            if (pageNum > 0) saveProgress(pageNum)
          }
        }
      },
      { threshold: 0.5 },
    )
    const sections = contentRef.current.querySelectorAll('section[data-page]')
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [session, saveProgress])

  const prevChapter = chapters.find((c) => c.number === chapter.number - 1) ?? null
  const nextChapter = chapters.find((c) => c.number === chapter.number + 1) ?? null

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Reading progress bar — fixed above everything */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-accent z-50 transition-[width] duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* TopBar */}
      <header
        className={`bg-surface border-b border-deep sticky top-0 z-40 transform transition-transform duration-300 ${
          barsVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-3xl mx-auto px-3 h-12 flex items-center gap-2">
          <Link
            href="/"
            className="text-accent font-bold text-base shrink-0 min-w-[36px] text-center"
          >
            📖
          </Link>
          <nav className="flex items-center gap-1 text-xs text-gray-400 flex-1 min-w-0">
            <Link
              href={`/stories/${slug}`}
              className="hover:text-white truncate hidden sm:block"
            >
              {story.title}
            </Link>
            <span className="mx-1 hidden sm:block">›</span>
            <span className="text-gray-300 truncate">
              Ch.{chapter.number}
              {chapter.title ? ` – ${chapter.title}` : ''}
            </span>
          </nav>

          {/* Font size controls */}
          <div className="flex items-center gap-1 shrink-0">
            {(
              [
                ['small', 'a'],
                ['medium', 'A'],
                ['large', 'A'],
              ] as [FontSize, string][]
            ).map(([sz, label]) => (
              <button
                key={sz}
                onClick={() => updateFontSize(sz)}
                title={sz}
                className={`w-7 h-7 flex items-center justify-center rounded leading-none ${
                  sz === 'small'
                    ? 'text-xs'
                    : sz === 'medium'
                      ? 'text-sm'
                      : 'text-base'
                } ${
                  fontSize === sz
                    ? 'bg-accent text-white'
                    : 'bg-deep text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-deep lg:hidden"
            aria-label="Danh sách chương"
          >
            ☰
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 w-64 bg-surface border-r border-deep z-30 transform transition-transform
            lg:translate-x-0 lg:static lg:inset-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="p-4 border-b border-deep flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Danh sách chương</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto h-full pb-20">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/stories/${slug}/chapters/${ch.number}`}
                onClick={() => setSidebarOpen(false)}
                className={`block px-4 py-3 text-sm border-b border-deep transition-colors ${
                  ch.number === chapter.number
                    ? 'bg-deep text-accent font-semibold'
                    : 'text-gray-400 hover:bg-deep hover:text-white'
                }`}
              >
                Ch.{ch.number} {ch.title ?? ''}
              </Link>
            ))}
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Scrollable content — tap to show bars */}
        <main
          className="flex-1 max-w-3xl mx-auto px-4 py-8"
          ref={contentRef}
          onClick={showBars}
        >
          {pages.map((page, i) => (
            <section key={page.id} data-page={page.number}>
              <div
                className={`text-gray-200 leading-relaxed ${FONT_CLASSES[fontSize]}`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {page.content}
              </div>
              {i < pages.length - 1 && <hr className="my-8 border-deep" />}
            </section>
          ))}
        </main>
      </div>

      {/* BottomBar */}
      <footer
        className={`bg-surface border-t border-deep sticky bottom-0 z-40 transform transition-transform duration-300 ${
          barsVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          {prevChapter ? (
            <button
              onClick={() =>
                router.push(`/stories/${slug}/chapters/${prevChapter.number}`)
              }
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 bg-deep text-gray-300 hover:text-white px-3 rounded text-sm active:scale-95 transition-transform"
            >
              <span>←</span>
              <span className="hidden sm:inline">Ch.Trước</span>
            </button>
          ) : (
            <div className="min-w-[44px] min-h-[44px]" />
          )}

          <div className="flex-1 flex items-center justify-center gap-3">
            {session && saveStatus === 'saved' && (
              <span className="text-green-500 text-xs">✓ Đã lưu</span>
            )}
            {session && saveStatus === 'saving' && (
              <span className="text-gray-500 text-xs">...</span>
            )}
            {session && saveStatus === 'error' && (
              <span className="text-red-500 text-xs">✗</span>
            )}
            <button
              onClick={scrollToTop}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-deep"
            >
              ↑ Đầu trang
            </button>
          </div>

          {nextChapter ? (
            <button
              onClick={() =>
                router.push(`/stories/${slug}/chapters/${nextChapter.number}`)
              }
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 bg-accent text-white px-3 rounded text-sm hover:opacity-90 active:scale-95 transition-transform"
            >
              <span className="hidden sm:inline">Ch.Tiếp</span>
              <span>→</span>
            </button>
          ) : (
            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 text-sm">
              Hết
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/ReadingScrollView.tsx
git commit -m "feat(web): auto-hide reader bars and scroll progress bar"
```

---

## Task 4: Push

- [ ] **Step 1: Push to remote**

```bash
git push origin main
```
