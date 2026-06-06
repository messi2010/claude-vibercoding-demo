import type { StoryResponse } from '@truyen/types'
import { StoryCard } from './StoryCard'

interface FeaturedGridProps {
  stories: StoryResponse[]
  progressMap?: Record<string, number>
}

export function FeaturedGrid({ stories, progressMap }: FeaturedGridProps) {
  if (stories.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Truyện Nổi Bật</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {stories.slice(0, 8).map((story) => (
          <StoryCard key={story.id} story={story} readChapter={progressMap?.[story.id]} />
        ))}
      </div>
    </section>
  )
}
