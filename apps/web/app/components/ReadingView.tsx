'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { StoryResponse, Chapter } from '@truyen/types'
import type { Session } from 'next-auth'

interface PageData {
  id: string
  number: number
  content: string
  totalPages: number
  prevPageNumber: number | null
  nextPageNumber: number | null
}

interface ReadingViewProps {
  story: StoryResponse
  chapter: Chapter
  page: PageData
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

export function ReadingView({ story, chapter, page, chapters, slug, session }: ReadingViewProps) {
  const router = useRouter()
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Restore font preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LS_FONT_KEY) as FontSize | null
    if (stored && stored in FONT_CLASSES) setFontSize(stored)
  }, [])

  const updateFontSize = (size: FontSize) => {
    setFontSize(size)
    localStorage.setItem(LS_FONT_KEY, size)
  }

  // Save reading progress
  useEffect(() => {
    if (!session) return
    setSaveStatus('saving')
    const timer = setTimeout(() => {
      fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: story.id,
          chapterId: chapter.id,
          pageNumber: page.number,
        }),
      })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'))
    }, 1000) // debounce 1s

    return () => clearTimeout(timer)
  }, [story.id, chapter.id, page.number, session])

  const prevUrl =
    page.prevPageNumber !== null
      ? `/stories/${slug}/chapters/${chapter.number}/pages/${page.prevPageNumber}`
      : null

  const nextUrl =
    page.nextPageNumber !== null
      ? `/stories/${slug}/chapters/${chapter.number}/pages/${page.nextPageNumber}`
      : chapters.find((c) => c.number === chapter.number + 1)
      ? `/stories/${slug}/chapters/${chapter.number + 1}/pages/1`
      : null

  const progressPercent = Math.round((page.number / page.totalPages) * 100)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TopBar */}
      <header className="bg-surface border-b border-deep sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-3 h-12 flex items-center gap-2">
          <Link href="/" className="text-accent font-bold text-base shrink-0 min-w-[36px] text-center">
            📖
          </Link>
          <nav className="flex items-center gap-1 text-xs text-gray-400 flex-1 min-w-0">
            <Link href={`/stories/${slug}`} className="hover:text-white truncate hidden sm:block">
              {story.title}
            </Link>
            <span className="mx-1 hidden sm:block">›</span>
            <span className="text-gray-300 truncate">
              Ch.{chapter.number}{chapter.title ? ` – ${chapter.title}` : ''}
            </span>
          </nav>

          {/* Font size controls — visible sm+ */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {([['small', 'a'], ['medium', 'A'], ['large', 'A']] as [FontSize, string][]).map(([sz, label]) => (
              <button
                key={sz}
                onClick={() => updateFontSize(sz)}
                title={sz}
                className={`w-7 h-7 flex items-center justify-center rounded leading-none ${
                  sz === 'small' ? 'text-xs' : sz === 'medium' ? 'text-sm' : 'text-base'
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

          {/* Sidebar toggle — always visible */}
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
                href={`/stories/${slug}/chapters/${ch.number}/pages/1`}
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

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 max-w-3xl mx-auto px-4 py-8">
          <div
            className={`text-gray-200 leading-relaxed ${FONT_CLASSES[fontSize]}`}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {page.content}
          </div>
        </main>
      </div>

      {/* BottomBar */}
      <footer className="bg-surface border-t border-deep sticky bottom-0 z-40">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          {/* Prev */}
          {prevUrl ? (
            <button
              onClick={() => router.push(prevUrl)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 bg-deep text-gray-300 hover:text-white px-3 rounded text-sm active:scale-95 transition-transform"
            >
              <span>←</span>
              <span className="hidden sm:inline">Trước</span>
            </button>
          ) : (
            <div className="min-w-[44px] min-h-[44px]" />
          )}

          {/* Progress center */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-1">
              <span>{page.number} / {page.totalPages}</span>
              {session && saveStatus === 'saved' && <span className="text-green-500">✓</span>}
              {session && saveStatus === 'saving' && <span className="text-gray-500">...</span>}
              {session && saveStatus === 'error' && <span className="text-red-500">✗</span>}
            </div>
            <div className="w-full h-1.5 bg-deep rounded-full">
              <div
                className="h-1.5 bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Next */}
          {nextUrl ? (
            <button
              onClick={() => router.push(nextUrl)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 bg-accent text-white px-3 rounded text-sm hover:opacity-90 active:scale-95 transition-transform"
            >
              <span className="hidden sm:inline">Tiếp</span>
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
