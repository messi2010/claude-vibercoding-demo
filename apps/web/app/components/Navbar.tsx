'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

const GENRES = [
  { value: 'horror', label: 'Kinh Dị' },
  { value: 'fantasy', label: 'Huyền Huyễn' },
  { value: 'martial_arts', label: 'Kiếm Hiệp' },
  { value: 'romance', label: 'Ngôn Tình' },
  { value: 'adult', label: '18+' },
]

export function Navbar() {
  const { data: session } = useSession()
  const [genreOpen, setGenreOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-surface border-b border-deep sticky top-0 z-50">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white shrink-0">
          📖 TruyệnHay
        </Link>

        {/* Desktop: Genre Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setGenreOpen((v) => !v)}
            className="text-gray-300 hover:text-white flex items-center gap-1 text-sm"
          >
            Thể loại
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {genreOpen && (
            <div className="absolute top-full left-0 mt-1 bg-surface border border-deep rounded-lg shadow-lg py-1 w-40 z-50">
              {GENRES.map((g) => (
                <Link
                  key={g.value}
                  href={`/genres/${g.value}`}
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-deep hover:text-white"
                  onClick={() => setGenreOpen(false)}
                >
                  {g.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop: Auth */}
        <div className="hidden md:flex items-center">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
              >
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                  {(session.user?.name ?? session.user?.email ?? 'U')[0].toUpperCase()}
                </div>
                <span>{session.user?.name ?? session.user?.email}</span>
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-1 bg-surface border border-deep rounded-lg shadow-lg py-1 w-44 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-deep hover:text-white"
                    onClick={() => setUserOpen(false)}
                  >
                    Trang cá nhân
                  </Link>
                  {(session.user as { role?: string })?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-deep hover:text-white"
                      onClick={() => setUserOpen(false)}
                    >
                      Quản trị
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left px-4 py-2 text-sm text-accent hover:bg-deep"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-accent text-white px-4 py-1.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <button
          className="md:hidden ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-300 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-deep px-4 py-2 flex flex-col">
          {GENRES.map((g) => (
            <Link
              key={g.value}
              href={`/genres/${g.value}`}
              className="flex items-center min-h-[44px] px-2 text-gray-300 hover:text-white text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {g.label}
            </Link>
          ))}
          <div className="border-t border-deep mt-1 pt-1">
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center min-h-[44px] px-2 text-gray-300 hover:text-white text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  Trang cá nhân
                </Link>
                {(session.user as { role?: string })?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center min-h-[44px] px-2 text-gray-300 hover:text-white text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Quản trị
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center min-h-[44px] px-2 w-full text-left text-accent text-sm"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="py-2">
                <Link
                  href="/auth/login"
                  className="block text-center bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
