# Mobile-First + Continuous Scroll Reading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the paginated reading view with a continuous-scroll chapter view and add a mobile hamburger menu to the Navbar.

**Architecture:** A new Next.js App Router route at `/stories/[slug]/chapters/[chapter]` fetches all pages for a chapter in one API call and renders a new `ReadingScrollView` client component. The old `/pages/[page]` route redirects to the new URL. The Navbar gains a collapsible mobile menu panel below `md:` breakpoint.

**Tech Stack:** Next.js 14 (App Router), React 18, Tailwind CSS 3, TypeScript, `@truyen/types`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/app/components/Navbar.tsx` | Modify | Add `mobileOpen` state + hamburger button + slide-down mobile menu panel |
| `apps/web/app/components/ReadingScrollView.tsx` | Create | All-pages scroll view with IntersectionObserver progress tracking |
| `apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx` | Create | Server component — fetch story + full chapter, render ReadingScrollView |
| `apps/web/app/stories/[slug]/chapters/[chapter]/pages/[page]/page.tsx` | Modify | Replace body with a `redirect()` to the chapter URL |
| `apps/web/app/stories/[slug]/page.tsx` | Modify | Update "Đọc ngay" and "Đọc tiếp" links to point directly to chapter URLs |

---

## Task 1: Navbar — mobile hamburger menu

**Files:**
- Modify: `apps/web/app/components/Navbar.tsx`

- [ ] **Step 1: Add `mobileOpen` state and hamburger button**

Replace the contents of `apps/web/app/components/Navbar.tsx` with:

```tsx
'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

const GENRES = [
  { value: 'horror', label: 'Kinh Dị' },
  { value: 'fantasy', label: 'Huyền Huyễn' },
  { value: 'martial_arts', label: 'Kiếm Hiệp' },
  { value: 'romance', label: 'Ngôn Tình' },
  { value: 'adult', label: '18+' },
]

export function Navbar() {
  const { data: session } = useSession()
  const [genreOpen, setGenreOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-surface border-b border-deep sticky top-0 z-50">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white shrink-0">
          📖 TruyệnHay
        </Link>

        {/* Desktop: Genre Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setGenreOpen((v) => !v)}
            className="text-gray-300 hover:text-white flex items-center gap-1 text-sm"
          >
            Thể loại
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {genreOpen && (
            <div className="absolute top-full left-0 mt-1 bg-surface border border-deep rounded-lg shadow-lg py-1 w-40 z-50">
              {GENRES.map((g) => (
                <Link
                  key={g.value}
                  href={`/genres/${g.value}`}
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-deep hover:text-white"
                  onClick={() => setGenreOpen(false)}
                >
                  {g.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop: Auth */}
        <div className="hidden md:flex items-center">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
              >
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                  {(session.user?.name ?? session.user?.email ?? 'U')[0].toUpperCase()}
                </div>
                <span>{session.user?.name ?? session.user?.email}</span>
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-1 bg-surface border border-deep rounded-lg shadow-lg py-1 w-44 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-deep hover:text-white"
                    onClick={() => setUserOpen(false)}
                  >
                    Trang cá nhân
                  </Link>
                  {(session.user as { role?: string })?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-deep hover:text-white"
                      onClick={() => setUserOpen(false)}
                    >
                      Quản trị
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left px-4 py-2 text-sm text-accent hover:bg-deep"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-accent text-white px-4 py-1.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <button
          className="md:hidden ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-300 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-deep px-4 py-2 flex flex-col">
          {GENRES.map((g) => (
            <Link
              key={g.value}
              href={`/genres/${g.value}`}
              className="flex items-center min-h-[44px] px-2 text-gray-300 hover:text-white text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {g.label}
            </Link>
          ))}
          <div className="border-t border-deep mt-1 pt-1">
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center min-h-[44px] px-2 text-gray-300 hover:text-white text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  Trang cá nhân
                </Link>
                {(session.user as { role?: string })?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center min-h-[44px] px-2 text-gray-300 hover:text-white text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Quản trị
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center min-h-[44px] px-2 w-full text-left text-accent text-sm"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="py-2">
                <Link
                  href="/auth/login"
                  className="block text-center bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors related to `Navbar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/Navbar.tsx
git commit -m "feat(web): mobile hamburger menu in Navbar"
```

---

## Task 2: Create `ReadingScrollView` component

**Files:**
- Create: `apps/web/app/components/ReadingScrollView.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/app/components/ReadingScrollView.tsx`:

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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(LS_FONT_KEY) as FontSize | null
    if (stored && stored in FONT_CLASSES) setFontSize(stored)
  }, [])

  const updateFontSize = (size: FontSize) => {
    setFontSize(size)
    localStorage.setItem(LS_FONT_KEY, size)
  }

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
      {/* TopBar */}
      <header className="bg-surface border-b border-deep sticky top-0 z-40">
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

          {/* Font size controls — always visible */}
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

        {/* Scrollable content */}
        <main className="flex-1 max-w-3xl mx-auto px-4 py-8" ref={contentRef}>
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
      <footer className="bg-surface border-t border-deep sticky bottom-0 z-40">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          {/* Prev chapter */}
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

          {/* Center: save status + scroll to top */}
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

          {/* Next chapter */}
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

Expected: no errors in `ReadingScrollView.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/ReadingScrollView.tsx
git commit -m "feat(web): add ReadingScrollView component for continuous scroll reading"
```

---

## Task 3: Create the chapter scroll route

**Files:**
- Create: `apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx`

The existing directory `apps/web/app/stories/[slug]/chapters/[chapter]/` only contains `pages/`. Add `page.tsx` directly inside it.

- [ ] **Step 1: Create the route file**

Create `apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getSession } from '../../../../../lib/auth'
import { apiCall } from '../../../../../lib/api'
import type { StoryResponse, Chapter } from '@truyen/types'
import { ReadingScrollView } from '../../../../components/ReadingScrollView'

interface StoryWithChapters extends StoryResponse {
  chapters: Chapter[]
}

interface ChapterWithPages {
  id: string
  storyId: string
  number: number
  title: string | null
  createdAt: string
  pages: Array<{ id: string; number: number; content: string }>
}

interface ChapterPageProps {
  params: {
    slug: string
    chapter: string
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const session = await getSession()
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) notFound()

  let story: StoryWithChapters
  let chapterData: ChapterWithPages

  try {
    ;[story, chapterData] = await Promise.all([
      apiCall<StoryWithChapters>(`/stories/${params.slug}`, {
        userToken: session?.accessToken,
      }),
      apiCall<ChapterWithPages>(
        `/stories/${params.slug}/chapters/${chapterNum}`,
        { userToken: session?.accessToken },
      ),
    ])
  } catch {
    notFound()
  }

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

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/stories/[slug]/chapters/[chapter]/page.tsx"
git commit -m "feat(web): add chapter scroll route /stories/[slug]/chapters/[chapter]"
```

---

## Task 4: Redirect old `/pages/[page]` route + update story page links

**Files:**
- Modify: `apps/web/app/stories/[slug]/chapters/[chapter]/pages/[page]/page.tsx`
- Modify: `apps/web/app/stories/[slug]/page.tsx`

- [ ] **Step 1: Replace paginated reading page with a redirect**

Replace the entire contents of `apps/web/app/stories/[slug]/chapters/[chapter]/pages/[page]/page.tsx` with:

```tsx
import { notFound, redirect } from 'next/navigation'

interface ReadingPageProps {
  params: {
    slug: string
    chapter: string
    page: string
  }
}

export default function ReadingPage({ params }: ReadingPageProps) {
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) notFound()
  redirect(`/stories/${params.slug}/chapters/${chapterNum}`)
}
```

- [ ] **Step 2: Update story page links to point directly to chapter URLs**

In `apps/web/app/stories/[slug]/page.tsx`, find and replace the two link hrefs that include `/pages/`:

Change line ~136:
```tsx
href={`/stories/${story.slug}/chapters/${story.chapters[0].number}/pages/1`}
```
to:
```tsx
href={`/stories/${story.slug}/chapters/${story.chapters[0].number}`}
```

Change line ~148:
```tsx
href={`/stories/${story.slug}/chapters/${resumeChapter.number}/pages/${currentProgress.pageNumber}`}
```
to:
```tsx
href={`/stories/${story.slug}/chapters/${resumeChapter.number}`}
```

- [ ] **Step 3: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors. The old `ReadingView` component and the `PageData` interface in the old pages route are no longer referenced — that's fine, they remain in the codebase unused.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/app/stories/[slug]/chapters/[chapter]/pages/[page]/page.tsx" \
        "apps/web/app/stories/[slug]/page.tsx"
git commit -m "feat(web): redirect paginated reading URLs to chapter scroll view"
```

---

## Task 5: Manual smoke test

- [ ] **Step 1: Start the dev stack**

In one terminal:
```bash
cd apps/api && npm run dev
```

In another:
```bash
cd apps/web && npm run dev
```

- [ ] **Step 2: Verify scroll reading**

1. Open `http://localhost:3000` in a browser.
2. Click any story → click "Đọc ngay" — should land on `/stories/[slug]/chapters/1` (not `/pages/1`).
3. Confirm all pages appear as one scrollable column separated by horizontal rules.
4. Confirm the sticky top bar shows breadcrumb + font size buttons.
5. Confirm the sticky bottom bar shows "Ch.Trước" and "Ch.Tiếp" (or "Hết" on the last chapter).
6. Click "Ch.Tiếp" — should navigate to the next chapter's scroll view.

- [ ] **Step 3: Verify redirect**

Navigate directly to `http://localhost:3000/stories/[any-slug]/chapters/1/pages/3` — should redirect to `/stories/[slug]/chapters/1`.

- [ ] **Step 4: Verify mobile navbar**

Resize browser to < 768px (or use DevTools mobile emulation).
1. Confirm only the logo and ☰ button are visible in the nav bar.
2. Tap ☰ — genre list and auth links should appear in a slide-down panel.
3. Tap any genre link — menu closes and navigates correctly.

- [ ] **Step 5: Verify font size persistence**

1. Change font size in the reading view.
2. Navigate to a different chapter.
3. Confirm the previously-selected font size is restored.
