import { getSession } from '../lib/auth'
import { getStories, getProgress } from '../lib/cached-api'
import { Navbar } from './components/Navbar'
import { HomeStories } from './components/HomeStories'
import type { ReadingProgress } from '@truyen/types'

export default async function Home() {
  // Session and stories fetched in parallel — stories are public, no token needed
  const [session, storiesResult] = await Promise.all([
    getSession().catch(() => null),
    getStories().catch(() => null),
  ])

  const stories = storiesResult?.items ?? []

  const progress: ReadingProgress[] | null = session?.accessToken
    ? await getProgress(session.accessToken).catch(() => null)
    : null

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <HomeStories stories={stories} progress={progress} />
      </main>
    </>
  )
}
