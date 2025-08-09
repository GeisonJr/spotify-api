import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import routes from './routes'

const FRONTEND_URL = process.env.FRONTEND_URL as string

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}))

// Health check endpoint
app.get('/status', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  })
})

// Routes
routes(app)

// Catch-all route for 404 errors
app.use((req, res) => {
  console.error(`404 Not Found: ${req.originalUrl}`)
  res.status(404).json({
    error: 'Not Found',
    message: `The requested URL ${req.originalUrl} was not found on this server.`
  })
})

// Global error handler
interface ErrorWithStack extends Error {
  stack?: string
}

app.use((err: ErrorWithStack, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred.'
  })
})

const server = app.listen(3000, () =>
  console.log(`Server is running on http://127.0.0.1:${3000}`),
)

export default server
