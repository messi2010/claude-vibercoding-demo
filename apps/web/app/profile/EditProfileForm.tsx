'use client'

import { useState } from 'react'

interface EditProfileFormProps {
  initialName: string
  initialAvatar: string
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function EditProfileForm({ initialName, initialAvatar }: EditProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [status, setStatus] = useState<Status>('idle')
  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-accent hover:underline"
      >
        Chỉnh sửa hồ sơ
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-surface border border-deep rounded-xl p-4 space-y-3 max-w-sm">
      <h3 className="text-white font-semibold text-sm">Chỉnh sửa hồ sơ</h3>
      <div>
        <label className="block text-gray-400 text-xs mb-1">Tên hiển thị</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-deep border border-deep rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
          placeholder="Tên của bạn"
        />
      </div>
      <div>
        <label className="block text-gray-400 text-xs mb-1">URL ảnh đại diện</label>
        <input
          type="url"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          className="w-full bg-deep border border-deep rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-accent text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {status === 'saving' ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 text-sm hover:text-white"
        >
          Hủy
        </button>
        {status === 'saved' && <span className="text-green-400 text-xs">Đã lưu!</span>}
        {status === 'error' && <span className="text-red-400 text-xs">Lỗi, thử lại.</span>}
      </div>
    </form>
  )
}
