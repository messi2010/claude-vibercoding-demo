import { Router, IRouter, Request, Response } from 'express'
import { optionalAuth } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import type { PaginatedResponse, StoryResponse } from '@truyen/types'

export const storiesRouter: IRouter = Router()

storiesRouter.use(optionalAuth)

// GET /stories
storiesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { genre, page = '1', pageSize = '20' } = req.query as Record<string, string>
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  const skip = (pageNum - 1) * pageSizeNum

  const userIsAgeVerified = req.user?.isAgeVerified ?? false
  const adultFilter = userIsAgeVerified ? undefined : false

  const where = {
    isAdult: adultFilter,
    ...(genre ? { genres: { some: { genre } } } : {}),
  }

  const [stories, total] = await Promise.all([
    prisma.story.findMany({
      where,
      include: {
        genres: true,
        chapters: { orderBy: { number: 'desc' }, take: 1, select: { number: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSizeNum,
    }),
    prisma.story.count({ where }),
  ])

  const items: StoryResponse[] = stories.map((s) => ({
    ...s,
    genres: s.genres.map((g) => g.genre),
    latestChapterNumber: s.chapters[0]?.number ?? null,
  }))

  const result: PaginatedResponse<StoryResponse> = {
    items,
    total,
    page: pageNum,
    pageSize: pageSizeNum,
    totalPages: Math.ceil(total / pageSizeNum),
  }

  res.json(result)
})

// GET /stories/:slug
storiesRouter.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params
  const userIsAgeVerified = req.user?.isAgeVerified ?? false

  const story = await prisma.story.findUnique({
    where: { slug },
    include: {
      genres: true,
      chapters: { orderBy: { number: 'asc' } },
    },
  })

  if (!story) {
    res.status(404).json({ error: 'Story not found' })
    return
  }

  if (story.isAdult && !userIsAgeVerified) {
    res.status(403).json({ error: 'Age verification required' })
    return
  }

  res.json({
    ...story,
    genres: story.genres.map((g) => g.genre),
  })
})

// GET /stories/:slug/chapters/:chapterNumber
storiesRouter.get('/:slug/chapters/:chapterNumber', async (req: Request, res: Response): Promise<void> => {
  const { slug, chapterNumber } = req.params
  const chNum = parseInt(chapterNumber, 10)
  const userIsAgeVerified = req.user?.isAgeVerified ?? false

  if (isNaN(chNum)) {
    res.status(400).json({ error: 'Invalid chapter number' })
    return
  }

  const story = await prisma.story.findUnique({ where: { slug } })

  if (!story) {
    res.status(404).json({ error: 'Story not found' })
    return
  }

  if (story.isAdult && !userIsAgeVerified) {
    res.status(403).json({ error: 'Age verification required' })
    return
  }

  const chapter = await prisma.chapter.findUnique({
    where: { storyId_number: { storyId: story.id, number: chNum } },
    include: { pages: { orderBy: { number: 'asc' } } },
  })

  if (!chapter) {
    res.status(404).json({ error: 'Chapter not found' })
    return
  }

  res.json(chapter)
})

// GET /stories/:slug/chapters/:chapterNumber/pages/:pageNumber
storiesRouter.get('/:slug/chapters/:chapterNumber/pages/:pageNumber', async (req: Request, res: Response): Promise<void> => {
  const { slug, chapterNumber, pageNumber } = req.params
  const chNum = parseInt(chapterNumber, 10)
  const pgNum = parseInt(pageNumber, 10)
  const userIsAgeVerified = req.user?.isAgeVerified ?? false

  if (isNaN(chNum) || isNaN(pgNum)) {
    res.status(400).json({ error: 'Invalid chapter or page number' })
    return
  }

  const story = await prisma.story.findUnique({ where: { slug } })

  if (!story) {
    res.status(404).json({ error: 'Story not found' })
    return
  }

  if (story.isAdult && !userIsAgeVerified) {
    res.status(403).json({ error: 'Age verification required' })
    return
  }

  const chapter = await prisma.chapter.findUnique({
    where: { storyId_number: { storyId: story.id, number: chNum } },
    include: { pages: { orderBy: { number: 'asc' } } },
  })

  if (!chapter) {
    res.status(404).json({ error: 'Chapter not found' })
    return
  }

  const page = chapter.pages.find((p) => p.number === pgNum)

  if (!page) {
    res.status(404).json({ error: 'Page not found' })
    return
  }

  const totalPages = chapter.pages.length
  const prevPage = chapter.pages.find((p) => p.number === pgNum - 1) ?? null
  const nextPage = chapter.pages.find((p) => p.number === pgNum + 1) ?? null

  res.json({
    ...page,
    totalPages,
    prevPageNumber: prevPage?.number ?? null,
    nextPageNumber: nextPage?.number ?? null,
  })
})
