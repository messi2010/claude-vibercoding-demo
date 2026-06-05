import Link from 'next/link'
import type { StoryResponse } from '@truyen/types'

interface RecentUpdatesProps {
  stories: StoryResponse[]
}

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

export function RecentUpdates({ stories }: RecentUpdatesProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4">Mới Cập Nhật</h2>
      <div className="bg-surface rounded-xl border border-deep divide-y divide-deep">
        {stories.map((story) => (
          <div key={story.id} className="flex items-center gap-3 p-3 hover:bg-deep transition-colors">
            <div className="flex-1 min-w-0">
              <Link
                href={`/stories/${story.slug}`}
                className="text-white font-medium text-sm hover:text-accent transition-colors line-clamp-1"
              >
                {story.title}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">Chương mới nhất</span>
              </div>
            </div>
            <span className="text-xs text-gray-500 shrink-0">{timeAgo(story.updatedAt)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
