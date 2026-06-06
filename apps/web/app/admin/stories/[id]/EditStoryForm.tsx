'use client'

import { useState } from 'react'
import type { StoryResponse } from '@truyen/types'

const GENRES = [
  { value: 'horror', label: 'Kinh Dị' },
  { value: 'fantasy', label: 'Huyền Huyễn' },
  { value: 'martial_arts', label: 'Kiếm Hiệp' },
  { value: 'romance', label: 'Ngôn Tình' },
]

interface EditStoryFormProps {
  story: StoryResponse
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function EditStoryForm({ story }: EditStoryFormProps) {
  const [title, setTitle] = useState(story.title)
  const [description, setDescription] = useState(story.description ?? '')
  const [storyStatus, setStoryStatus] = useState(story.status)
  const [genres, setGenres] = useState<string[]>(story.genres)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const toggleGenre = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')
    setError('')
    try {
      const res = await fetch(`/api/admin/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status: storyStatus, genres }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Cập nhật thất bại')
      }
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
      setStatus('error')
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
        <label className="block text-gray-300 text-sm mb-1">Tiêu đề</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-1">Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent resize-none"
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

      <div className="flex flex-wrap gap-6 items-center">
        <div>
          <label className="block text-gray-300 text-sm mb-1">Trạng thái</label>
          <select
            value={storyStatus}
            onChange={(e) => setStoryStatus(e.target.value as 'ONGOING' | 'COMPLETED')}
            className="bg-deep border border-deep rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
          >
            <option value="ONGOING">Đang ra</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
        </div>

      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {status === 'saving' ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
        {status === 'saved' && <span className="text-green-400 text-sm">Đã lưu!</span>}
      </div>
    </form>
  )
}
