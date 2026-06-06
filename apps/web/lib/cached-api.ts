import { cache } from 'react'
import { apiCall } from './api'
import type { PaginatedResponse, StoryResponse, Chapter, ReadingProgress } from '@truyen/types'

export interface StoryWithChapters extends StoryResponse {
  chapters: Chapter[]
}

export interface ChapterWithPages {
  id: string
  storyId: string
  number: number
  title: string | null
  createdAt: string
  pages: Array<{ id: string; number: number; content: string }>
}

// Memoized per-request: multiple callers (generateMetadata + page component)
// sharing the same slug get one network call.
export const getStories = cache(() =>
  apiCall<PaginatedResponse<StoryResponse>>('/stories?page=1', {
    next: { revalidate: 30 },
  })
)

export const getStory = cache((slug: string) =>
  apiCall<StoryWithChapters>(`/stories/${slug}`, {
    next: { revalidate: 30 },
  })
)

export const getChapter = cache((slug: string, chapterNum: number) =>
  apiCall<ChapterWithPages>(`/stories/${slug}/chapters/${chapterNum}`, {
    next: { revalidate: 30 },
  })
)

export const getProgress = cache((userToken: string) =>
  apiCall<ReadingProgress[]>('/progress', { userToken })
)
