'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GENRES = [
  { value: 'horror', label: 'Kinh Dị' },
  { value: 'fantasy', label: 'Huyền Huyễn' },
  { value: 'martial_arts', label: 'Kiếm Hiệp' },
  { value: 'romance', label: 'Ngôn Tình' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function NewStoryPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'ONGOING' | 'COMPLETED'>('ONGOING')
  const [genres, setGenres] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    setSlug(slugify(val))
  }

  const toggleGenre = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, description, status, genres }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Tạo truyện thất bại')
      }
      const story = await res.json()
      router.push(`/admin/stories/${story.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/stories" className="text-gray-400 text-sm hover:text-white">← Danh sách truyện</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Thêm truyện mới</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-deep rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm mb-1" htmlFor="title">Tiêu đề *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
              placeholder="Tên truyện"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1" htmlFor="slug">Slug *</label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent font-mono"
              placeholder="ten-truyen"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1" htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent resize-none"
              placeholder="Giới thiệu ngắn về truyện..."
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Thể loại</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => toggleGenre(g.value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    genres.includes(g.value)
                      ? 'bg-accent border-accent text-white'
                      : 'bg-deep border-deep text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1" htmlFor="status">Trạng thái</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ONGOING' | 'COMPLETED')}
              className="bg-deep border border-deep rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
            >
              <option value="ONGOING">Đang ra</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Đang tạo...' : 'Tạo truyện'}
            </button>
            <Link
              href="/admin/stories"
              className="bg-deep border border-deep text-gray-300 px-6 py-2.5 rounded-lg font-semibold text-sm hover:text-white transition-colors"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
