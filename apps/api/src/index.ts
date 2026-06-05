import 'dotenv/config'
import express, { Application } from 'express'
import cors from 'cors'
import { storiesRouter } from './routes/stories'
import { progressRouter } from './routes/progress'
import { profileRouter } from './routes/profile'
import { adminRouter } from './routes/admin'

const app: Application = express()
const PORT = parseInt(process.env.PORT || '4000')

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/stories', storiesRouter)
app.use('/progress', progressRouter)
app.use('/profile', profileRouter)
app.use('/admin', adminRouter)

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => console.log(`API running on port ${PORT}`))

export default app
