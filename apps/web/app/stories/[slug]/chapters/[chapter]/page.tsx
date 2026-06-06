import { notFound } from 'next/navigation'
import { getSession } from '../../../../../lib/auth'
import { getStory, getChapter } from '../../../../../lib/cached-api'
import { ReadingScrollView } from '../../../../components/ReadingScrollView'

interface ChapterPageProps {
  params: {
    slug: string
    chapter: string
  }
}

export async function generateMetadata({ params }: ChapterPageProps) {
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) return {}
  try {
    // Both calls are memoized — the page component calling the same fns
    // gets zero extra network requests.
    const [story, chapterData] = await Promise.all([
      getStory(params.slug),
      getChapter(params.slug, chapterNum),
    ])
    const suffix = chapterData.title ? ` – ${chapterData.title}` : ''
    return { title: `Ch.${chapterNum}${suffix} | ${story.title} | TruyệnHay` }
  } catch {
    return {}
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) notFound()

  // All three fetched in parallel; getStory/getChapter deduplicated with generateMetadata
  const [session, story, chapterData] = await Promise.all([
    getSession().catch(() => null),
    getStory(params.slug).catch(() => null),
    getChapter(params.slug, chapterNum).catch(() => null),
  ])

  if (!story || !chapterData) notFound()

  const chapter = story.chapters.find((c) => c.number === chapterNum)
  if (!chapter) notFound()

  return (
    <ReadingScrollView
      story={story}
      chapter={chapter}
      pages={chapterData.pages}
      chapters={story.chapters}
      slug={params.slug}
      session={session}
    />
  )
}
