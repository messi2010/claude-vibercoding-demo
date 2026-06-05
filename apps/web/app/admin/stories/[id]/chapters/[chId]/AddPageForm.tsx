'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AddPageFormProps {
  chapterId: string
  nextPageNum: number
}

export function AddPageForm({ chapterId, nextPageNum }: AddPageFormProps) {
  const router = useRouter()
  const [number, setNumber] = useState(nextPageNum)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, content }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Thêm trang thất bại')
      }
      setContent('')
      setNumber((n) => n + 1)
      router.refresh()
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

      <div>
        <label className="block text-gray-300 text-sm mb-1">Số trang</label>
        <input
          type="number"
          min={1}
          value={number}
          onChange={(e) => setNumber(Number(e.target.value))}
          required
          className="w-24 bg-deep border border-deep rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-1">Nội dung trang *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent resize-y font-mono leading-relaxed"
          placeholder="Nội dung trang..."
        />
      </div>

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Đang thêm...' : '+ Thêm trang'}
      </button>
    </form>
  )
}
