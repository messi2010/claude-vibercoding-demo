import Link from 'next/link'
import Image from 'next/image'
import type { StoryResponse } from '@truyen/types'
import { GenreCover } from './GenreCover'

const GENRE_LABELS: Record<string, string> = {
  horror: 'Kinh Dị',
  fantasy: 'Huyền Huyễn',
  martial_arts: 'Kiếm Hiệp',
  romance: 'Ngôn Tình',
  adult: '18+',
}

const GENRE_COLORS: Record<string, string> = {
  horror: 'bg-red-900 text-red-200',
  fantasy: 'bg-purple-900 text-purple-200',
  martial_arts: 'bg-yellow-900 text-yellow-200',
  romance: 'bg-pink-900 text-pink-200',
  adult: 'bg-red-800 text-red-100',
}

interface StoryCardProps {
  story: StoryResponse
  readChapter?: number
}

export function StoryCard({ story, readChapter }: StoryCardProps) {
  const total = story.latestChapterNumber ?? 0
  const readPct = readChapter && total > 0 ? Math.min((readChapter / total) * 100, 100) : 0
  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <div className="bg-surface rounded-xl overflow-hidden border border-deep hover:border-accent transition-colors">
        {/* Cover */}
        <div className="relative w-full aspect-[2/3] bg-deep overflow-hidden">
          {story.coverImage ? (
            <Image
              src={story.coverImage}
              alt={story.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
              <GenreCover title={story.title} genres={story.genres} id={story.slug} />
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                story.status === 'COMPLETED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-green-700 text-white'
              }`}
            >
              {story.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang ra'}
            </span>
          </div>
          {story.isAdult && (
            <div className="absolute top-2 left-2">
              <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white font-bold">18+</span>
            </div>
          )}
          {/* Reading progress stripe */}
          {readPct > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
              <div
                className="h-full bg-accent"
                style={{ width: `${readPct}%` }}
              />
            </div>
          )}
        </div>

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
      </div>
    </Link>
  )
}
