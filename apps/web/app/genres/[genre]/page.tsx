import Link from 'next/link'
import { apiCall } from '../../../lib/api'
import { getSession } from '../../../lib/auth'
import type { PaginatedResponse, StoryResponse } from '@truyen/types'
import { Navbar } from '../../components/Navbar'
import { StoryCard } from '../../components/StoryCard'

interface GenrePageProps {
  params: { genre: string }
}

const GENRES = [
  { value: 'horror', label: 'Kinh Dị' },
  { value: 'fantasy', label: 'Huyền Huyễn' },
  { value: 'martial_arts', label: 'Kiếm Hiệp' },
  { value: 'romance', label: 'Ngôn Tình' },
  { value: 'adult', label: '18+' },
]

export default async function GenrePage({ params }: GenrePageProps) {
  const session = await getSession()
  const currentGenre = params.genre

  let stories: StoryResponse[] = []
  try {
    const result = await apiCall<PaginatedResponse<StoryResponse>>(
      `/stories?genre=${encodeURIComponent(currentGenre)}&page=1`,
      { userToken: session?.accessToken }
    )
    stories = result.items
  } catch {
    // genre fetch failure — show empty
  }

  const currentGenreLabel = GENRES.find((g) => g.value === currentGenre)?.label ?? currentGenre

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Genre pill tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {GENRES.map((g) => (
            <Link
              key={g.value}
              href={`/genres/${g.value}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                g.value === currentGenre
                  ? 'bg-accent text-white'
                  : 'bg-surface text-gray-300 border border-deep hover:border-accent hover:text-white'
              }`}
            >
              {g.label}
            </Link>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-white mb-6">
          Truyện {currentGenreLabel}
          <span className="text-gray-400 text-base font-normal ml-2">({stories.length} truyện)</span>
        </h1>

        {stories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">📚</p>
            <p>Chưa có truyện nào trong thể loại này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
