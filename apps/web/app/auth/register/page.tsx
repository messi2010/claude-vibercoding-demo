'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    dob: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (form.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (!form.dob) {
      setError('Vui lòng nhập ngày sinh.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name || undefined,
          dob: form.dob,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Đăng ký thất bại.')
        return
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (result?.error) {
        setError('Đăng ký thành công! Vui lòng đăng nhập.')
        router.push('/auth/login')
      } else {
        router.push('/')
      }
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            📖 TruyệnHay
          </Link>
          <p className="text-gray-400 mt-2">Tạo tài khoản mới</p>
        </div>

        <div className="bg-surface border border-deep rounded-2xl p-8">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1" htmlFor="email">
                Email <span className="text-accent">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1" htmlFor="name">
                Tên hiển thị
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                placeholder="Tùy chọn"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1" htmlFor="dob">
                Ngày sinh <span className="text-accent">*</span>
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
              />
              <p className="text-gray-500 text-xs mt-1">
                ⚠ Bạn cần đủ 18 tuổi để xem nội dung 18+
              </p>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1" htmlFor="password">
                Mật khẩu <span className="text-accent">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                placeholder="Tối thiểu 8 ký tự"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1" htmlFor="confirmPassword">
                Xác nhận mật khẩu <span className="text-accent">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-deep border border-deep rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="text-accent hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
