import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '../../../../../../lib/auth'
import { apiCall } from '../../../../../../lib/api'
import { Navbar } from '../../../../../components/Navbar'
import { AddPageForm } from './AddPageForm'
import type { Chapter, Page } from '@truyen/types'

interface ChapterDetail extends Chapter {
  pages: Page[]
}

export default async function AdminChapterDetailPage({
  params,
}: {
  params: { id: string; chId: string }
}) {
  const session = await getSession()
  if (!session?.accessToken || (session.user as { role?: string })?.role !== 'ADMIN') {
    redirect('/')
  }

  let chapter: ChapterDetail
  try {
    chapter = await apiCall<ChapterDetail>(`/admin/chapters/${params.chId}`, {
      userToken: session.accessToken,
    })
  } catch {
    notFound()
  }

  const lastPageNum = chapter.pages.length > 0
    ? Math.max(...chapter.pages.map((p) => p.number))
    : 0

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/admin/stories/${params.id}`} className="text-gray-400 text-sm hover:text-white">
            ← Quay lại truyện
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">
            Chương {chapter.number}{chapter.title ? `: ${chapter.title}` : ''}
          </h1>
        </div>

        {/* Page list */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Danh sách trang ({chapter.pages.length})
          </h2>
          {chapter.pages.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa có trang nào.</p>
          ) : (
            <div className="bg-surface border border-deep rounded-xl divide-y divide-deep">
              {chapter.pages.map((page) => (
                <div key={page.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-gray-500 text-sm w-12 shrink-0">Tr.{page.number}</span>
                  <p className="text-gray-400 text-sm line-clamp-2 flex-1">
                    {page.content.slice(0, 100)}{page.content.length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add page form */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Thêm trang</h2>
          <AddPageForm chapterId={params.chId} nextPageNum={lastPageNum + 1} />
        </div>
      </main>
    </>
  )
}
