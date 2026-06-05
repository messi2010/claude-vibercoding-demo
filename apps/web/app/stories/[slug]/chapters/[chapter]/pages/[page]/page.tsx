import { notFound, redirect } from 'next/navigation'

interface ReadingPageProps {
  params: {
    slug: string
    chapter: string
    page: string
  }
}

export default function ReadingPage({ params }: ReadingPageProps) {
  const chapterNum = parseInt(params.chapter, 10)
  if (isNaN(chapterNum)) notFound()
  redirect(`/stories/${params.slug}/chapters/${chapterNum}`)
}
