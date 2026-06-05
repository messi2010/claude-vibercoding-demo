import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '../../../lib/auth'
import { apiCall } from '../../../lib/api'
import { Navbar } from '../../components/Navbar'
import type { StoryResponse } from '@truyen/types'

interface AdminStory extends StoryResponse {
  _count?: { chapters: number }
  chapters?: { id: string }[]
}

const GENRE_LABELS: Record<string, string> = {
  horror: 'Kinh Dị',
  fantasy: 'Huyền Huyễn',
  martial_arts: 'Kiếm Hiệp',
  romance: 'Ngôn Tình',
  adult: '18+',
}

export default async function AdminStoriesPage() {
  const session = await getSession()
  if (!session?.accessToken || (session.user as { role?: string })?.role !== 'ADMIN') {
    redirect('/')
  }

  let stories: AdminStory[] = []
  try {
    stories = await apiCall<AdminStory[]>('/admin/stories', { userToken: session.accessToken })
  } catch {
    // non-fatal: render empty
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-gray-400 text-sm hover:text-white">← Quản trị</Link>
            <h1 className="text-2xl font-bold text-white mt-1">Danh sách truyện</h1>
          </div>
          <Link
            href="/admin/stories/new"
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Thêm truyện mới
          </Link>
        </div>

        <div className="bg-surface border border-deep rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-deep text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Tiêu đề</th>
                <th className="px-4 py-3 font-medium">Thể loại</th>
                <th className="px-4 py-3 font-medium">18+</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Chương</th>
                <th className="px-4 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deep">
              {stories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Chưa có truyện nào.
                  </td>
                </tr>
              ) : (
                stories.map((story) => (
                  <tr key={story.id} className="hover:bg-deep transition-colors">
                    <td className="px-4 py-3 text-white font-medium max-w-xs">
                      <span className="truncate block">{story.title}</span>
                      <span className="text-gray-500 text-xs">{story.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {story.genres.map((g) => (
                          <span key={g} className="text-xs px-1.5 py-0.5 rounded bg-deep text-gray-300">
                            {GENRE_LABELS[g] ?? g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {story.isAdult ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-900 text-red-300 font-bold">18+</span>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        story.status === 'COMPLETED'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-green-900 text-green-300'
                      }`}>
                        {story.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang ra'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {story._count?.chapters ?? story.chapters?.length ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/stories/${story.id}`}
                        className="text-accent hover:underline text-xs"
                      >
                        Chỉnh sửa
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
