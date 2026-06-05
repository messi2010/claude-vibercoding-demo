'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CompleteProfilePage() {
  const { update } = useSession()
  const router = useRouter()
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!dob) {
      setError('Vui lòng nhập ngày sinh.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Cập nhật thất bại.')
        return
      }

      // Refresh session so JWT gets new isAgeVerified value
      await update()
      router.push('/')
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            📖 TruyệnHay
          </Link>
          <p className="text-gray-400 mt-2">Hoàn thiện hồ sơ</p>
        </div>

        <div className="bg-surface border border-deep rounded-2xl p-8">
          <p className="text-gray-300 text-sm mb-6">
            Để tiếp tục sử dụng dịch vụ, vui lòng cung cấp ngày sinh của bạn. Thông tin này giúp
            xác minh độ tuổi cho nội dung 18+.
          </p>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1" htmlFor="dob">
                Ngày sinh <span className="text-accent">*</span>
              </label>
              <input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm"
              />
              <p className="text-gray-500 text-xs mt-1">
                ⚠ Bạn cần đủ 18 tuổi để xem nội dung 18+
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
