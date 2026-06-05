import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '../../lib/auth'
import { apiCall } from '../../lib/api'
import { Navbar } from '../components/Navbar'
import type { StoryResponse } from '@truyen/types'

interface StoryWithChapterCount extends StoryResponse {
  _count?: { chapters: number }
  chapters?: { id: string }[]
}

export default async function AdminDashboard() {
  const session = await getSession()
  if (!session?.accessToken || (session.user as { role?: string })?.role !== 'ADMIN') {
    redirect('/')
  }

  let stories: StoryWithChapterCount[] = []
  try {
    stories = await apiCall<StoryWithChapterCount[]>('/admin/stories', { userToken: session.accessToken })
  } catch {
    // non-fatal
  }

  const totalStories = stories.length
  const totalChapters = stories.reduce((sum, s) => {
    return sum + (s._count?.chapters ?? s.chapters?.length ?? 0)
  }, 0)

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Quản trị</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface border border-deep rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-accent">{totalStories}</p>
            <p className="text-gray-400 mt-1 text-sm">Truyện</p>
          </div>
          <div className="bg-surface border border-deep rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-accent">{totalChapters}</p>
            <p className="text-gray-400 mt-1 text-sm">Chương</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-surface border border-deep rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Quản lý nội dung</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/stories"
              className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Danh sách truyện
            </Link>
            <Link
              href="/admin/stories/new"
              className="bg-deep border border-accent text-accent px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-white transition-colors"
            >
              Thêm truyện mới
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
