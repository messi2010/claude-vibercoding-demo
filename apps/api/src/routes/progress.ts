import { Router, IRouter, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import type { UpsertProgressBody } from '@truyen/types'

export const progressRouter: IRouter = Router()

progressRouter.use(requireAuth)

// GET /progress
progressRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.sub

  const records = await prisma.readingProgress.findMany({
    where: { userId },
    include: {
      story: {
        select: { id: true, title: true, slug: true, coverImage: true },
      },
      chapter: {
        select: { number: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  res.json(records)
})

// PATCH /progress
progressRouter.patch('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.sub
  const { storyId, chapterId, pageNumber } = req.body as UpsertProgressBody

  if (!storyId || !chapterId || pageNumber === undefined) {
    res.status(400).json({ error: 'storyId, chapterId, and pageNumber are required' })
    return
  }

  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (!story) {
    res.status(404).json({ error: 'Story not found' })
    return
  }

  const record = await prisma.readingProgress.upsert({
    where: { userId_storyId: { userId, storyId } },
    create: { userId, storyId, chapterId, pageNumber },
    update: { chapterId, pageNumber },
  })

  res.json(record)
})
