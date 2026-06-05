import { Router, IRouter, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import type { UpdateProfileBody } from '@truyen/types'

export const profileRouter: IRouter = Router()

profileRouter.use(requireAuth)

function omitPassword<T extends { password?: string | null }>(user: T): Omit<T, 'password'> {
  const { password: _pw, ...rest } = user
  return rest
}

// GET /profile
profileRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.sub

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json(omitPassword(user))
})

// PATCH /profile
profileRouter.patch('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.sub
  const { name, avatar, dob } = req.body as UpdateProfileBody

  const updateData: {
    name?: string
    avatar?: string
    dob?: Date
    isAgeVerified?: boolean
  } = {}

  if (name !== undefined) updateData.name = name
  if (avatar !== undefined) updateData.avatar = avatar

  if (dob !== undefined) {
    const parsedDob = new Date(dob)
    if (isNaN(parsedDob.getTime())) {
      res.status(400).json({ error: 'Invalid dob date' })
      return
    }
    const age = Math.floor((Date.now() - parsedDob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    updateData.dob = parsedDob
    updateData.isAgeVerified = age >= 18
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  res.json(omitPassword(user))
})
