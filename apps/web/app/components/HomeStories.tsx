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

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Chưa có truyện thể loại này
        </div>
      ) : (
        <>
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
      )}
    </>
  )
}
