import { Request, Response, NextFunction } from 'express'

export function requireAgeVerified(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.isAgeVerified) {
    res.status(403).json({ error: 'Age verification required' })
    return
  }
  next()
}
