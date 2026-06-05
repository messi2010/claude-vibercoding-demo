'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AddChapterFormProps {
  storyId: string
  nextChapterNum: number
}

export function AddChapterForm({ storyId, nextChapterNum }: AddChapterFormProps) {
  const router = useRouter()
  const [number, setNumber] = useState(nextChapterNum)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stories/${storyId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, title: title || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Thêm chương thất bại')
      }
      const chapter = await res.json()
      router.push(`/admin/stories/${storyId}/chapters/${chapter.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-deep rounded-xl p-5 space-y-4">
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-gray-300 text-sm mb-1">Số chương</label>
          <input
            type="number"
            min={1}
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
            required
            className="w-24 bg-deep border border-deep rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex-1 min-w-48">
          <label className="block text-gray-300 text-sm mb-1">Tiêu đề chương (tùy chọn)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-deep border border-deep rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-accent"
            placeholder="Tiêu đề chương..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Đang thêm...' : '+ Thêm chương'}
      </button>
    </form>
  )
}
