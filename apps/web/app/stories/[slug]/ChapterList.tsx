'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Chapter } from '@truyen/types'

interface ChapterListProps {
  chapters: Chapter[]
  slug: string
  currentChapterId?: string
  currentChapterNum: number | null
}

export function ChapterList({ chapters, slug, currentChapterId, currentChapterNum }: ChapterListProps) {
  const [descending, setDescending] = useState(false)
  const sorted = descending ? [...chapters].reverse() : chapters

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">
          Danh sách chương ({chapters.length})
        </h2>
        <button
          onClick={() => setDescending((v) => !v)}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-deep transition-colors"
          title={descending ? 'Sắp xếp tăng dần' : 'Sắp xếp giảm dần'}
        >
          {descending ? '↑ Cũ nhất' : '↓ Mới nhất'}
        </button>
      </div>
      <div className="bg-surface rounded-xl border border-deep divide-y divide-deep max-h-80 overflow-y-auto">
        {sorted.map((ch) => {
          const isCurrent = ch.id === currentChapterId
          const isRead = currentChapterNum !== null && ch.number < currentChapterNum
          return (
            <Link
              key={ch.id}
              href={`/stories/${slug}/chapters/${ch.number}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-deep transition-colors ${isCurrent ? 'bg-deep' : ''}`}
            >
              <span className={`text-sm w-12 shrink-0 ${isCurrent ? 'text-accent font-semibold' : 'text-gray-500'}`}>
                Ch.{ch.number}
              </span>
              <span className={`text-sm flex-1 ${isCurrent ? 'text-accent font-semibold' : 'text-gray-300'}`}>
                {ch.title ?? `Chương ${ch.number}`}
              </span>
              {isRead && <span className="text-green-500 text-xs shrink-0">✓</span>}
              {isCurrent && <span className="text-accent text-xs shrink-0">●</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
