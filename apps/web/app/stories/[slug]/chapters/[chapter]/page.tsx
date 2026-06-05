import { notFound } from 'next/navigation'
import { getSession } from '../../../../../lib/auth'
import { apiCall } from '../../../../../lib/api'
import type { StoryResponse, Chapter } from '@truyen/types'
import { ReadingScrollView } from '../../../../components/ReadingScrollView'

interface StoryWithChapters extends StoryResponse {
  chapters: Chapter[]
}

interface ChapterWithPages {
  id: string
  storyId: string
  number: number
  title: string | null
  createdAt: string
  pages: Array<{ id: string; number: number; content: string }>
}

interface ChapterPageProps {
  params: {
    slug: string
    chapter: string
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const session = await getSession()
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) notFound()

  let story: StoryWithChapters
  let chapterData: ChapterWithPages

  try {
    ;[story, chapterData] = await Promise.all([
      apiCall<StoryWithChapters>(`/stories/${params.slug}`, {
        userToken: session?.accessToken,
      }),
      apiCall<ChapterWithPages>(
        `/stories/${params.slug}/chapters/${chapterNum}`,
        { userToken: session?.accessToken },
      ),
    ])
  } catch {
    notFound()
  }

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
