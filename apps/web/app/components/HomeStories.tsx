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
  const [search, setSearch] = useState('')

  // storyId → chapter number the user has read up to
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
      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm kiếm truyện..."
        className="w-full bg-surface border border-deep rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm mb-4"
      />

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
