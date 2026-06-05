import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

if (!process.env.NEXTAUTH_SECRET) throw new Error('NEXTAUTH_SECRET is not set')
if (!process.env.INTERNAL_API_SECRET) throw new Error('INTERNAL_API_SECRET is not set')

import express, { Application } from 'express'
import cors from 'cors'
import multer from 'multer'
import { storiesRouter } from './routes/stories'
import { progressRouter } from './routes/progress'
import { profileRouter } from './routes/profile'
import { adminRouter } from './routes/admin'

const app: Application = express()
const PORT = parseInt(process.env.PORT || '4000', 10)

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }))
app.use(express.json())
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Content-Disposition', 'attachment')
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
    res.setHeader('X-Content-Type-Options', 'nosniff')
  },
}))

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/stories', storiesRouter)
app.use('/progress', progressRouter)
app.use('/profile', profileRouter)
app.use('/admin', adminRouter)

// Multer error handler (file too large, wrong type)
app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const uploadErrors = ['Only image files are allowed', 'Invalid file extension']
  if (err instanceof multer.MulterError || uploadErrors.includes(err.message)) {
    res.status(400).json({ error: err.message })
    return
  }
  next(err)
})

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => console.log(`API running on port ${PORT}`))

export default app
