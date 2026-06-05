import { timingSafeEqual } from 'crypto'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  sub: string        // user id
  email: string
  role: string
  isAgeVerified: boolean
  dobSubmitted: boolean
  iat?: number
  exp?: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

function verifyInternalSecret(req: Request): boolean {
  const incoming = req.headers['x-internal-secret']
  if (!incoming || typeof incoming !== 'string') return false
  const expectedSecret = process.env.INTERNAL_API_SECRET!
  try {
    const a = Buffer.from(incoming)
    const b = Buffer.from(expectedSecret)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!verifyInternalSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const authHeader = req.headers['x-user-token']
  if (!authHeader || typeof authHeader !== 'string') {
    res.status(401).json({ error: 'No user token' })
    return
  }

  try {
    const payload = jwt.verify(authHeader, process.env.NEXTAUTH_SECRET!) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Optional auth — sets req.user if a valid secret + valid token are present.
// Rejects with 401 if a valid secret is paired with an invalid token (suspicious).
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  if (!verifyInternalSecret(req)) {
    return next() // No valid secret = unauthenticated public call
  }

  const authHeader = req.headers['x-user-token']
  if (!authHeader || typeof authHeader !== 'string') {
    return next() // No token = unauthenticated
  }

  try {
    const payload = jwt.verify(authHeader, process.env.NEXTAUTH_SECRET!) as JwtPayload
    req.user = payload
    next()
  } catch {
    // Valid secret + invalid token = suspicious, reject
    res.status(401).json({ error: 'Invalid user token' })
  }
}
