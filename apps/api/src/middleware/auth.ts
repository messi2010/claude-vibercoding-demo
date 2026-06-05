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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-internal-secret']
  if (secret !== process.env.INTERNAL_API_SECRET) {
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

// Optional auth — doesn't fail if no token, just sets req.user if present
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const secret = req.headers['x-internal-secret']
  if (secret !== process.env.INTERNAL_API_SECRET) {
    next() // No secret = treat as unauthenticated public call
    return
  }

  const authHeader = req.headers['x-user-token']
  if (!authHeader || typeof authHeader !== 'string') {
    next()
    return
  }

  try {
    const payload = jwt.verify(authHeader, process.env.NEXTAUTH_SECRET!) as JwtPayload
    req.user = payload
  } catch {
    // Invalid token — treat as unauthenticated
  }
  next()
}
