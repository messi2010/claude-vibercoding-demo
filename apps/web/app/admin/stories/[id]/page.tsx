import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '../../../../lib/auth'
import { apiCall } from '../../../../lib/api'
import { Navbar } from '../../../components/Navbar'
import { EditStoryForm } from './EditStoryForm'
import { AddChapterForm } from './AddChapterForm'
import type { StoryResponse, Chapter } from '@truyen/types'

interface AdminStoryDetail extends StoryResponse {
  chapters: Chapter[]
}

export default async function AdminStoryDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.accessToken || (session.user as { role?: string })?.role !== 'ADMIN') {
    redirect('/')
  }

  let story: AdminStoryDetail
  try {
    story = await apiCall<AdminStoryDetail>(`/admin/stories/${params.id}`, {
      userToken: session.accessToken,
    })
  } catch {
    notFound()
  }

  const lastChapterNum = story.chapters.length > 0
    ? Math.max(...story.chapters.map((c) => c.number))
    : 0

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/stories" className="text-gray-400 text-sm hover:text-white">← Danh sách truyện</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{story.title}</h1>
          <p className="text-gray-500 text-sm font-mono">{story.slug}</p>
        </div>

        {/* Edit form */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Thông tin truyện</h2>
          <EditStoryForm story={story} />
        </div>

        {/* Chapter list */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Danh sách chương ({story.chapters.length})
          </h2>
          {story.chapters.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có chương nào.</p>
          ) : (
            <div className="bg-surface border border-deep rounded-xl divide-y divide-deep">
              {story.chapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/admin/stories/${params.id}/chapters/${ch.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-deep transition-colors"
                >
                  <span className="text-gray-500 text-sm w-12">Ch.{ch.number}</span>
                  <span className="text-gray-300 text-sm hover:text-white flex-1">
                    {ch.title ?? `Chương ${ch.number}`}
                  </span>
                  <span className="text-accent text-xs">Quản lý →</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Add chapter form */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Thêm chương</h2>
          <AddChapterForm storyId={params.id} nextChapterNum={lastChapterNum + 1} />
        </div>
      </main>
    </>
  )
}
