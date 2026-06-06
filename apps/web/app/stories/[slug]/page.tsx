import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '../../../lib/auth'
import { apiCall } from '../../../lib/api'
import type { StoryResponse, Chapter, ReadingProgress } from '@truyen/types'
import { Navbar } from '../../components/Navbar'
import { AgeGate } from '../../components/AgeGate'
import { ChapterList } from './ChapterList'
import { ExpandableDescription } from './ExpandableDescription'
import { GenreCover } from '../../components/GenreCover'

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

export async function generateMetadata({ params }: StoryPageProps) {
  try {
    const story = await apiCall<StoryWithChapters>(`/stories/${params.slug}`)
    return { title: `${story.title} | TruyệnHay` }
  } catch {
    return {}
  }
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

  const currentChapterNum = currentProgress
    ? (story.chapters.find((c) => c.id === currentProgress!.chapterId)?.number ?? null)
    : null

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Always two columns: cover left, info right — no vertical stack on mobile */}
        <div className="flex gap-4 md:gap-8 mb-6">
          {/* Cover — compact on mobile, 1/3 on md+ */}
          <div className="w-2/5 sm:w-1/3 shrink-0">
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-deep">
              {story.coverImage ? (
                <Image
                  src={story.coverImage}
                  alt={story.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 40vw, 33vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0">
                  <GenreCover title={story.title} genres={story.genres} id={story.slug} />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3 leading-tight">
              {story.title}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
              {story.genres.map((g) => (
                <Link
                  key={g}
                  href={`/genres/${g}`}
                  className={`text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full ${GENRE_COLORS[g] ?? 'bg-gray-700 text-gray-300'}`}
                >
                  {GENRE_LABELS[g] ?? g}
                </Link>
              ))}
              <span
                className={`text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium ${
                  story.status === 'COMPLETED'
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-green-800 text-green-100'
                }`}
              >
                {story.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang ra'}
              </span>
              {story.isAdult && (
                <span className="text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-red-700 text-red-100 font-bold">
                  18+
                </span>
              )}
            </div>

            {/* Description — hidden on mobile to save space, visible sm+ */}
            {story.description && (
              <div className="hidden sm:block mb-4">
                <ExpandableDescription text={story.description} />
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3">
              {story.chapters.length > 0 && (
                <Link
                  href={`/stories/${story.slug}/chapters/${story.chapters[0].number}`}
                  className="bg-accent text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm md:text-base text-center"
                >
                  {currentProgress ? 'Đọc từ đầu' : 'Đọc ngay'}
                </Link>
              )}
              {currentProgress && (() => {
                const resumeChapter = story.chapters.find(c => c.id === currentProgress.chapterId)
                return resumeChapter ? (
                  <Link
                    href={`/stories/${story.slug}/chapters/${resumeChapter.number}`}
                    className="bg-deep border border-accent text-accent px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-accent hover:text-white transition-colors text-sm md:text-base text-center"
                  >
                    Đọc tiếp Ch.{resumeChapter.number}
                  </Link>
                ) : null
              })()}
            </div>
          </div>
        </div>

        {/* Description on mobile — below the two-column row */}
        {story.description && (
          <div className="sm:hidden mb-4">
            <ExpandableDescription text={story.description} />
          </div>
        )}

        {/* Chapter List — full width below both columns */}
        {story.chapters.length > 0 && (
          <ChapterList
            chapters={story.chapters}
            slug={story.slug}
            currentChapterId={currentProgress?.chapterId}
            currentChapterNum={currentChapterNum}
          />
        )}
      </main>
    </>
  )
}
