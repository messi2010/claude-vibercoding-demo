import crypto from 'crypto'
import path from 'path'
import { Router, IRouter, Request, Response } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth'
import { adminOnly } from '../middleware/adminOnly'
import { prisma } from '../lib/prisma'
import type { CreateChapterBody, CreatePageBody, CreateStoryBody } from '@truyen/types'

export const adminRouter: IRouter = Router()

adminRouter.use(requireAuth, adminOnly)

// Multer: disk storage under apps/api/uploads/
const uploadsDir = path.resolve(__dirname, '../../uploads')

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const ALLOWED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_IMAGE_EXTS.has(ext)) {
      cb(new Error('Invalid file extension'), '')
      return
    }
    cb(null, `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

// POST /admin/stories
adminRouter.post('/stories', async (req: Request, res: Response): Promise<void> => {
  const { title, slug, description, isAdult, status, genres } = req.body as CreateStoryBody & { genres?: string[] }

  if (!title || !slug) {
    res.status(400).json({ error: 'title and slug are required' })
    return
  }

  const existing = await prisma.story.findUnique({ where: { slug } })
  if (existing) {
    res.status(409).json({ error: 'Slug already exists' })
    return
  }

  const story = await prisma.story.create({
    data: {
      title,
      slug,
      description,
      isAdult: isAdult ?? false,
      status: status ?? 'ONGOING',
      genres: genres?.length
        ? { create: genres.map((g) => ({ genre: g })) }
        : undefined,
    },
    include: { genres: true },
  })

  res.status(201).json({ ...story, genres: story.genres.map((g) => g.genre) })
})

// PATCH /admin/stories/:id
adminRouter.patch('/stories/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { title, slug, description, isAdult, status, genres } = req.body as Partial<CreateStoryBody> & { genres?: string[] }

  const existing = await prisma.story.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: 'Story not found' })
    return
  }

  if (slug && slug !== existing.slug) {
    const conflict = await prisma.story.findUnique({ where: { slug } })
    if (conflict) {
      res.status(409).json({ error: 'Slug already exists' })
      return
    }
  }

  // If genres provided, replace all existing StoryGenre records atomically
  if (genres !== undefined) {
    await prisma.$transaction([
      prisma.storyGenre.deleteMany({ where: { storyId: id } }),
      ...(genres.length > 0
        ? [prisma.storyGenre.createMany({ data: genres.map((g) => ({ storyId: id, genre: g })) })]
        : []),
    ])
  }

  const story = await prisma.story.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(isAdult !== undefined && { isAdult }),
      ...(status !== undefined && { status }),
    },
    include: { genres: true },
  })

  res.json({ ...story, genres: story.genres.map((g) => g.genre) })
})

// POST /admin/stories/:id/cover
adminRouter.post('/stories/:id/cover', upload.single('cover'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const story = await prisma.story.findUnique({ where: { id } })
  if (!story) {
    res.status(404).json({ error: 'Story not found' })
    return
  }

  const coverImage = `/uploads/${req.file.filename}`
  const updated = await prisma.story.update({
    where: { id },
    data: { coverImage },
    include: { genres: true },
  })

  res.json({ ...updated, genres: updated.genres.map((g) => g.genre) })
})

// POST /admin/stories/:id/chapters
adminRouter.post('/stories/:id/chapters', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { number, title } = req.body as CreateChapterBody

  if (number === undefined || number === null) {
    res.status(400).json({ error: 'number is required' })
    return
  }

  const story = await prisma.story.findUnique({ where: { id } })
  if (!story) {
    res.status(404).json({ error: 'Story not found' })
    return
  }

  const existing = await prisma.chapter.findUnique({
    where: { storyId_number: { storyId: id, number } },
  })
  if (existing) {
    res.status(409).json({ error: 'Chapter number already exists for this story' })
    return
  }

  const chapter = await prisma.chapter.create({
    data: { storyId: id, number, title },
  })

  res.status(201).json(chapter)
})

// POST /admin/chapters/:id/pages
adminRouter.post('/chapters/:id/pages', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { number, content } = req.body as CreatePageBody

  if (number === undefined || !content) {
    res.status(400).json({ error: 'number and content are required' })
    return
  }

  const chapter = await prisma.chapter.findUnique({ where: { id } })
  if (!chapter) {
    res.status(404).json({ error: 'Chapter not found' })
    return
  }

  const existing = await prisma.page.findUnique({
    where: { chapterId_number: { chapterId: id, number } },
  })
  if (existing) {
    res.status(409).json({ error: 'Page number already exists for this chapter' })
    return
  }

  const page = await prisma.page.create({
    data: { chapterId: id, number, content },
  })

  res.status(201).json(page)
})
