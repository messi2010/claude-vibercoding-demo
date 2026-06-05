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
  const activeChapterRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (sidebarOpen && activeChapterRef.current) {
      activeChapterRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [sidebarOpen])

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

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft' && prevChapter) router.push(`/stories/${slug}/chapters/${prevChapter.number}`)
      if (e.key === 'ArrowRight' && nextChapter) router.push(`/stories/${slug}/chapters/${nextChapter.number}`)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router, slug, prevChapter, nextChapter])

  // Swipe navigation
  useEffect(() => {
    let touchStartX = 0
    const onStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX }
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX
      if (Math.abs(dx) < 60) return
      if (dx > 0 && prevChapter) router.push(`/stories/${slug}/chapters/${prevChapter.number}`)
      if (dx < 0 && nextChapter) router.push(`/stories/${slug}/chapters/${nextChapter.number}`)
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [router, slug, prevChapter, nextChapter])

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
            href={`/stories/${slug}`}
            className="text-accent font-bold text-base shrink-0 min-w-[36px] text-center"
            aria-label={`Quay lại ${story.title}`}
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
          <div className="p-2 border-b border-deep">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const val = parseInt((e.currentTarget.elements.namedItem('jump') as HTMLInputElement).value, 10)
                if (!isNaN(val) && chapters.some((c) => c.number === val)) {
                  router.push(`/stories/${slug}/chapters/${val}`)
                  setSidebarOpen(false)
                }
              }}
              className="flex gap-1"
            >
              <input
                name="jump"
                type="number"
                min={1}
                placeholder="Tới chương..."
                className="flex-1 bg-deep border border-deep rounded px-2 py-1 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="bg-accent text-white text-xs px-2 py-1 rounded hover:opacity-90"
              >
                →
              </button>
            </form>
          </div>
          <div className="overflow-y-auto h-full pb-20">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                ref={ch.number === chapter.number ? activeChapterRef : null}
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
