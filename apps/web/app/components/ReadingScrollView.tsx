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

type FontSize   = 'small' | 'medium' | 'large' | 'xlarge'
type Theme      = 'dark' | 'sepia' | 'light'
type FontFamily = 'sans' | 'serif'

const FONT_CLASSES: Record<FontSize, string> = {
  small:  'text-sm',
  medium: 'text-base',
  large:  'text-lg',
  xlarge: 'text-xl',
}

const THEME_CLASSES: Record<Theme, { page: string; text: string }> = {
  dark:  { page: 'bg-background', text: 'text-gray-200' },
  sepia: { page: 'bg-[#f5f0e8]',  text: 'text-[#2c2018]' },
  light: { page: 'bg-gray-50',    text: 'text-gray-800' },
}

const LS_SIZE_KEY   = 'reading-font-size'
const LS_THEME_KEY  = 'reading-theme'
const LS_FAMILY_KEY = 'reading-font-family'
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

  // Reader settings
  const [fontSize,   setFontSize]   = useState<FontSize>('medium')
  const [theme,      setTheme]      = useState<Theme>('dark')
  const [fontFamily, setFontFamily] = useState<FontFamily>('sans')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // UI state
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [saveStatus,   setSaveStatus]   = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [barsVisible,  setBarsVisible]  = useState(true)

  const saveTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollYRef    = useRef(0)
  const contentRef        = useRef<HTMLDivElement>(null)
  const activeChapterRef  = useRef<HTMLAnchorElement>(null)

  const prevChapter = chapters.find((c) => c.number === chapter.number - 1) ?? null
  const nextChapter = chapters.find((c) => c.number === chapter.number + 1) ?? null

  // ── Persist settings ────────────────────────────────────────────────────
  useEffect(() => {
    const sz = localStorage.getItem(LS_SIZE_KEY)   as FontSize   | null
    const th = localStorage.getItem(LS_THEME_KEY)  as Theme      | null
    const ff = localStorage.getItem(LS_FAMILY_KEY) as FontFamily | null
    if (sz && sz in FONT_CLASSES) setFontSize(sz)
    if (th && th in THEME_CLASSES) setTheme(th)
    if (ff === 'sans' || ff === 'serif') setFontFamily(ff)
  }, [])

  const updateFontSize = (s: FontSize) => { setFontSize(s);   localStorage.setItem(LS_SIZE_KEY,   s) }
  const updateTheme    = (t: Theme)    => { setTheme(t);      localStorage.setItem(LS_THEME_KEY,  t) }
  const updateFamily   = (f: FontFamily) => { setFontFamily(f); localStorage.setItem(LS_FAMILY_KEY, f) }

  // ── Sidebar autoscroll ───────────────────────────────────────────────────
  useEffect(() => {
    if (sidebarOpen && activeChapterRef.current)
      activeChapterRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [sidebarOpen])

  // ── Bar auto-hide ────────────────────────────────────────────────────────
  const showBars = useCallback(() => {
    setBarsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setBarsVisible(false), BAR_HIDE_DELAY)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const scrollY   = window.scrollY
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        const pct       = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0
        setScrollProgress(pct)

        if (scrollY < lastScrollYRef.current) showBars()
        else {
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

  // ── Progress save ────────────────────────────────────────────────────────
  const saveProgress = useCallback(
    (pageNumber: number) => {
      if (!session) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveStatus('saving')
      saveTimerRef.current = setTimeout(() => {
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId: story.id, chapterId: chapter.id, pageNumber }),
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
            const p = parseInt((entry.target as HTMLElement).dataset.page ?? '0', 10)
            if (p > 0) saveProgress(p)
          }
        }
      },
      { threshold: 0.5 },
    )
    const sections = contentRef.current.querySelectorAll('section[data-page]')
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [session, saveProgress])

  // ── Keyboard nav ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft'  && prevChapter) router.push(`/stories/${slug}/chapters/${prevChapter.number}`)
      if (e.key === 'ArrowRight' && nextChapter) router.push(`/stories/${slug}/chapters/${nextChapter.number}`)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [router, slug, prevChapter, nextChapter])

  // ── Swipe nav ────────────────────────────────────────────────────────────
  useEffect(() => {
    let startX = 0
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX }
    const onEnd   = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) < 60) return
      if (dx > 0 && prevChapter) router.push(`/stories/${slug}/chapters/${prevChapter.number}`)
      if (dx < 0 && nextChapter) router.push(`/stories/${slug}/chapters/${nextChapter.number}`)
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend',   onEnd)
    }
  }, [router, slug, prevChapter, nextChapter])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const tc = THEME_CLASSES[theme]

  return (
    <div className={`min-h-screen flex flex-col ${tc.page}`}>

      {/* Progress strip */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-accent z-50 transition-[width] duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top bar */}
      <header
        className={`bg-surface border-b border-deep sticky top-0 z-40 transform transition-transform duration-300 ${
          barsVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-3xl mx-auto px-3 h-12 flex items-center gap-2">
          {/* Breadcrumb: Home › Story › Chapter */}
          <nav className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
            {/* Home icon — one tap to home page */}
            <Link
              href="/"
              title="Trang chủ"
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded hover:bg-deep text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <span className="text-gray-600 shrink-0">›</span>
            {/* Story title — hidden on very small screens */}
            <Link
              href={`/stories/${slug}`}
              className="text-gray-400 hover:text-white text-sm truncate hidden sm:block transition-colors"
            >
              {story.title}
            </Link>
            <span className="text-gray-600 shrink-0 hidden sm:block">›</span>
            {/* Chapter — always visible */}
            <span className="text-gray-200 text-sm truncate">
              Ch.{chapter.number}{chapter.title ? ` – ${chapter.title}` : ''}
            </span>
          </nav>

          {/* Settings button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              title="Cài đặt đọc"
              className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
                settingsOpen ? 'bg-accent text-white' : 'bg-deep text-gray-400 hover:text-white'
              }`}
            >
              ⚙
            </button>
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

      {/* Settings panel — bottom sheet */}
      {settingsOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-deep rounded-t-2xl shadow-2xl px-5 pt-4 pb-8">
            <div className="flex items-center justify-between mb-5">
              <span className="text-white font-semibold text-sm">Cài đặt đọc</span>
              <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
            </div>

            {/* Font size */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Cỡ chữ</p>
              <div className="flex gap-2">
                {(['small','medium','large','xlarge'] as FontSize[]).map((sz, i) => {
                  const labels = ['S', 'M', 'L', 'XL']
                  return (
                    <button
                      key={sz}
                      onClick={() => updateFontSize(sz)}
                      className={`flex-1 h-9 rounded text-sm font-medium transition-colors ${
                        fontSize === sz ? 'bg-accent text-white' : 'bg-deep text-gray-400 hover:text-white'
                      }`}
                    >
                      {labels[i]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Theme */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Giao diện</p>
              <div className="flex gap-2">
                {([
                  { value: 'dark',  label: 'Tối',  bg: '#111827', text: '#e5e7eb' },
                  { value: 'sepia', label: 'Kem',  bg: '#f5f0e8', text: '#2c2018' },
                  { value: 'light', label: 'Sáng', bg: '#f9fafb', text: '#1f2937' },
                ] as { value: Theme; label: string; bg: string; text: string }[]).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => updateTheme(t.value)}
                    style={{ backgroundColor: t.bg, color: t.text }}
                    className={`flex-1 h-9 rounded text-xs font-semibold border-2 transition-colors ${
                      theme === t.value ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font family */}
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Font chữ</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateFamily('sans')}
                  className={`flex-1 h-9 rounded text-sm transition-colors font-sans ${
                    fontFamily === 'sans' ? 'bg-accent text-white' : 'bg-deep text-gray-400 hover:text-white'
                  }`}
                >
                  Sans
                </button>
                <button
                  onClick={() => updateFamily('serif')}
                  className={`flex-1 h-9 rounded text-sm transition-colors font-serif ${
                    fontFamily === 'serif' ? 'bg-accent text-white' : 'bg-deep text-gray-400 hover:text-white'
                  }`}
                >
                  Serif
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">✕</button>
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
              <button type="submit" className="bg-accent text-white text-xs px-2 py-1 rounded hover:opacity-90">→</button>
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

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Reading content */}
        <main
          className="flex-1 max-w-3xl mx-auto px-4 py-8"
          ref={contentRef}
          onClick={showBars}
        >
          {pages.map((page, i) => (
            <section key={page.id} data-page={page.number}>
              <div
                className={`leading-relaxed ${FONT_CLASSES[fontSize]} ${tc.text} ${
                  fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {page.content}
              </div>
              {i < pages.length - 1 && <hr className="my-8 border-deep" />}
            </section>
          ))}
        </main>
      </div>

      {/* Bottom bar */}
      <footer
        className={`bg-surface border-t border-deep sticky bottom-0 z-40 transform transition-transform duration-300 ${
          barsVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          {prevChapter ? (
            <button
              onClick={() => router.push(`/stories/${slug}/chapters/${prevChapter.number}`)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 bg-deep text-gray-300 hover:text-white px-3 rounded text-sm active:scale-95 transition-transform"
            >
              <span>←</span>
              <span className="hidden sm:inline">Ch.Trước</span>
            </button>
          ) : (
            <div className="min-w-[44px] min-h-[44px]" />
          )}

          <div className="flex-1 flex items-center justify-center gap-3">
            {session && saveStatus === 'saved'  && <span className="text-green-500 text-xs">✓ Đã lưu</span>}
            {session && saveStatus === 'saving' && <span className="text-gray-500 text-xs">...</span>}
            {session && saveStatus === 'error'  && <span className="text-red-500 text-xs">✗</span>}
            <button
              onClick={scrollToTop}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-deep"
            >
              ↑ Đầu trang
            </button>
          </div>

          {nextChapter ? (
            <button
              onClick={() => router.push(`/stories/${slug}/chapters/${nextChapter.number}`)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 bg-accent text-white px-3 rounded text-sm hover:opacity-90 active:scale-95 transition-transform"
            >
              <span className="hidden sm:inline">Ch.Tiếp</span>
              <span>→</span>
            </button>
          ) : (
            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 text-sm">Hết</div>
          )}
        </div>
      </footer>
    </div>
  )
}
