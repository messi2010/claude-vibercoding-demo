// Enums (matching Prisma enums)
export type Role = 'USER' | 'ADMIN'
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK'
export type StoryStatus = 'ONGOING' | 'COMPLETED'
export type Genre = 'horror' | 'fantasy' | 'martial_arts' | 'romance' | 'adult'

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

export interface Story {
  id: string
  title: string
  slug: string
  description: string | null
  coverImage: string | null
  status: StoryStatus
  isAdult: boolean
  genres: string[]
  createdAt: Date
  updatedAt: Date
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
  story?: Pick<Story, 'id' | 'title' | 'slug' | 'coverImage'>
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
  genres?: string[]
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
