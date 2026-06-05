import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '../../lib/auth'
import { apiCall } from '../../lib/api'
import { Navbar } from '../components/Navbar'
import { EditProfileForm } from './EditProfileForm'
import type { User, ReadingProgress } from '@truyen/types'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session?.accessToken) {
    redirect('/auth/login')
  }

  let profile: User | null = null
  let progressList: ReadingProgress[] = []

  try {
    profile = await apiCall<User>('/profile', { userToken: session.accessToken })
  } catch {
    // non-fatal: render with session fallback
  }

  try {
    progressList = await apiCall<ReadingProgress[]>('/progress', { userToken: session.accessToken })
  } catch {
    // non-fatal
  }

  const displayName = profile?.name ?? session.user?.name ?? session.user?.email ?? 'Người dùng'
  const email = profile?.email ?? session.user?.email ?? ''
  const avatar = profile?.avatar ?? ''
  const isAgeVerified = profile?.isAgeVerified ?? (session.user as { isAgeVerified?: boolean })?.isAgeVerified ?? false
  const initial = displayName[0]?.toUpperCase() ?? 'U'

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-surface border border-deep rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              {avatar ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden">
                  <Image src={avatar} alt={displayName} fill className="object-cover" sizes="80px" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white text-3xl font-bold">
                  {initial}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white mb-1">{displayName}</h1>
              <p className="text-gray-400 text-sm mb-3">{email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                {isAgeVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-900 text-green-300 font-medium">
                    ✓ Đã xác minh tuổi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-900 text-yellow-300 font-medium">
                    ⚠ Chưa xác minh tuổi
                  </span>
                )}
              </div>
              <EditProfileForm initialName={displayName} initialAvatar={avatar} />
            </div>
          </div>
        </div>

        {/* Reading History */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Lịch sử đọc</h2>
          {progressList.length === 0 ? (
            <div className="bg-surface border border-deep rounded-xl p-8 text-center text-gray-500">
              Chưa có lịch sử đọc.{' '}
              <Link href="/" className="text-accent hover:underline">
                Khám phá truyện
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {progressList.map((progress) => {
                const story = progress.story
                if (!story) return null
                const readLink = `/stories/${story.slug}/chapters/${progress.chapterId}/pages/${progress.pageNumber}`
                return (
                  <div
                    key={progress.id}
                    className="bg-surface border border-deep rounded-xl p-4 flex items-center gap-4"
                  >
                    {/* Cover thumbnail */}
                    <div className="shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-deep flex items-center justify-center">
                      {story.coverImage ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={story.coverImage}
                            alt={story.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <span className="text-xl">📖</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{story.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Trang {progress.pageNumber}
                      </p>
                      {/* Progress bar — rough estimate: pageNumber out of 20 total assumed */}
                      <div className="mt-2 h-1 bg-deep rounded-full overflow-hidden w-full max-w-48">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${Math.min(100, (progress.pageNumber / 20) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href={readLink}
                      className="shrink-0 bg-accent text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      Đọc tiếp
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
