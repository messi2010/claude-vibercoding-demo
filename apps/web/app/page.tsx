import { getSession } from '../lib/auth'
import { apiCall } from '../lib/api'
import type { PaginatedResponse, StoryResponse, ReadingProgress } from '@truyen/types'
import { Navbar } from './components/Navbar'
import { HomeStories } from './components/HomeStories'

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
        <HomeStories stories={stories} progress={progress} />
      </main>
    </>
  )
}
