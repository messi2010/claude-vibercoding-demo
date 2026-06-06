// Enums (matching Prisma enums)
export type Role = 'USER' | 'ADMIN'
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK'
export type StoryStatus = 'ONGOING' | 'COMPLETED'

// Genre values used throughout the app (not DB-enforced — stored as plain strings)
export type GenreValue = 'horror' | 'fantasy' | 'martial_arts' | 'romance'

// Core entities
export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  dob: Date | null
  provider: AuthProvider
  isAgeVerified: boolean
  role: Role
  createdAt: Date
  updatedAt: Date
  // password omitted from public type
}

// The Prisma StoryGenre join record
export interface StoryGenre {
  storyId: string
  genre: string
}

// Base Story as stored (genres comes as a relation — use StoryResponse for API responses)
export interface Story {
  id: string
  title: string
  slug: string
  description: string | null
  coverImage: string | null
  status: StoryStatus
  isAdult: boolean
  createdAt: Date
  updatedAt: Date
}

// Story as returned from API (with genres flattened to string[])
export interface StoryResponse extends Story {
  genres: string[]
  latestChapterNumber?: number | null
}

export interface Chapter {
  id: string
  storyId: string
  number: number
  title: string | null
  createdAt: Date
}

export interface Page {
  id: string
  chapterId: string
  number: number
  content: string
}

export interface ReadingProgress {
  id: string
  userId: string
  storyId: string
  chapterId: string
  pageNumber: number
  updatedAt: Date
  story?: Pick<StoryResponse, 'id' | 'title' | 'slug' | 'coverImage'>
  chapter?: { number: number }
}

// API response wrapper
export interface ApiResponse<T> {
  data: T
  error?: string
}

// Request body types
export interface UpsertProgressBody {
  storyId: string
  chapterId: string
  pageNumber: number
}

export interface UpdateProfileBody {
  name?: string
  avatar?: string
  dob?: string // ISO date string
}

export interface CreateStoryBody {
  title: string
  slug: string
  description?: string
  isAdult?: boolean
  status?: StoryStatus
  genres?: GenreValue[]
}

export interface CreateChapterBody {
  number: number
  title?: string
}

export interface CreatePageBody {
  number: number
  content: string
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
