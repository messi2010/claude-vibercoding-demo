import { notFound } from 'next/navigation'
import { getSession } from '../../../../../../../lib/auth'
import { apiCall } from '../../../../../../../lib/api'
import type { StoryResponse, Chapter } from '@truyen/types'
import { ReadingView } from '../../../../../../components/ReadingView'

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

interface PageData {
  id: string
  number: number
  content: string
  totalPages: number
  prevPageNumber: number | null
  nextPageNumber: number | null
}

interface ReadingPageProps {
  params: {
    slug: string
    chapter: string
    page: string
  }
}

export default async function ReadingPage({ params }: ReadingPageProps) {
  const session = await getSession()
  const chapterNum = parseInt(params.chapter, 10)
  const pageNum = parseInt(params.page, 10)

  if (isNaN(chapterNum) || isNaN(pageNum)) notFound()

  let story: StoryWithChapters
  let pageData: PageData

  try {
    ;[story, pageData] = await Promise.all([
      apiCall<StoryWithChapters>(`/stories/${params.slug}`, {
        userToken: session?.accessToken,
      }),
      apiCall<PageData>(
        `/stories/${params.slug}/chapters/${chapterNum}/pages/${pageNum}`,
        { userToken: session?.accessToken }
      ),
    ])
  } catch {
    notFound()
  }

  const chapter = story.chapters.find((c) => c.number === chapterNum)
  if (!chapter) notFound()

  return (
    <ReadingView
      story={story}
      chapter={chapter}
      page={pageData}
      chapters={story.chapters}
      slug={params.slug}
      session={session}
    />
  )
}
