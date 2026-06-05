import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '../../../lib/auth'
import { apiCall } from '../../../lib/api'
import type { StoryResponse, Chapter, ReadingProgress } from '@truyen/types'
import { Navbar } from '../../components/Navbar'
import { AgeGate } from '../../components/AgeGate'

interface StoryWithChapters extends StoryResponse {
  chapters: Chapter[]
}

interface StoryPageProps {
  params: { slug: string }
}

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

export default async function StoryPage({ params }: StoryPageProps) {
  const session = await getSession()

  let story: StoryWithChapters
  try {
    story = await apiCall<StoryWithChapters>(`/stories/${params.slug}`, {
      userToken: session?.accessToken,
    })
  } catch {
    notFound()
  }

  // Adult gate — show only if logged-in but not age-verified
  if (story.isAdult && (!session || !(session.user as { isAgeVerified?: boolean })?.isAgeVerified)) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <AgeGate loggedIn={!!session} />
        </main>
      </>
    )
  }

  // Fetch reading progress for this story
  let currentProgress: ReadingProgress | null = null
  if (session?.accessToken) {
    try {
      const progressList = await apiCall<ReadingProgress[]>('/progress', {
        userToken: session.accessToken,
      })
      currentProgress = progressList.find((p) => p.storyId === story.id) ?? null
    } catch {
      // progress fetch failure is non-fatal
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="w-full md:w-1/3 shrink-0">
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-deep">
              {story.coverImage ? (
                <Image
                  src={story.coverImage}
                  alt={story.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-6xl">📖</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">{story.title}</h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {story.genres.map((g) => (
                <Link
                  key={g}
                  href={`/genres/${g}`}
                  className={`text-sm px-3 py-1 rounded-full ${GENRE_COLORS[g] ?? 'bg-gray-700 text-gray-300'}`}
                >
                  {GENRE_LABELS[g] ?? g}
                </Link>
              ))}
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  story.status === 'COMPLETED'
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-green-800 text-green-100'
                }`}
              >
                {story.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang ra'}
              </span>
              {story.isAdult && (
                <span className="text-sm px-3 py-1 rounded-full bg-red-700 text-red-100 font-bold">
                  18+
                </span>
              )}
            </div>

            {/* Description */}
            {story.description && (
              <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">
                {story.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              {story.chapters.length > 0 && (
                <Link
                  href={`/stories/${story.slug}/chapters/${story.chapters[0].number}`}
                  className="bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Đọc ngay
                </Link>
              )}
              {currentProgress && (() => {
                const resumeChapter = story.chapters.find(c => c.id === currentProgress.chapterId)
                return resumeChapter ? (
                  <Link
                    href={`/stories/${story.slug}/chapters/${resumeChapter.number}`}
                    className="bg-deep border border-accent text-accent px-6 py-3 rounded-lg font-semibold hover:bg-accent hover:text-white transition-colors"
                  >
                    Đọc tiếp Ch.{resumeChapter.number} Trang {currentProgress.pageNumber}
                  </Link>
                ) : null
              })()}
            </div>

            {/* Chapter List */}
            {story.chapters.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-3">
                  Danh sách chương ({story.chapters.length})
                </h2>
                <div className="bg-surface rounded-xl border border-deep divide-y divide-deep max-h-80 overflow-y-auto">
                  {story.chapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/stories/${story.slug}/chapters/${ch.number}/pages/1`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-deep transition-colors"
                    >
                      <span className="text-gray-500 text-sm w-12 shrink-0">Ch.{ch.number}</span>
                      <span className="text-gray-300 text-sm hover:text-white">
                        {ch.title ?? `Chương ${ch.number}`}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
