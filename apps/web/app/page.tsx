import { getSession } from '../lib/auth'
import { apiCall } from '../lib/api'
import type { PaginatedResponse, StoryResponse, ReadingProgress } from '@truyen/types'
import { Navbar } from './components/Navbar'
import { FeaturedGrid } from './components/FeaturedGrid'
import { RecentUpdates } from './components/RecentUpdates'
import { ContinueReading } from './components/ContinueReading'

export default async function Home() {
  const session = await getSession()

  const [storiesResult, progressResult] = await Promise.allSettled([
    apiCall<PaginatedResponse<StoryResponse>>('/stories?page=1'),
    session?.accessToken
      ? apiCall<ReadingProgress[]>('/progress', { userToken: session.accessToken })
      : Promise.resolve(null),
  ])

  const stories =
    storiesResult.status === 'fulfilled' ? storiesResult.value.items : []
  const progress =
    progressResult.status === 'fulfilled' && progressResult.value
      ? progressResult.value
      : null

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <FeaturedGrid stories={stories} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentUpdates stories={stories} />
          </div>
          {progress && progress.length > 0 && (
            <div>
              <ContinueReading progress={progress} />
            </div>
          )}
        </div>
      </main>
    </>
  )
}
