import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import routes from './routes'

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(cors({
  origin: process.env.FRONTEND_URL,
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

const server = app.listen(3000, () =>
  console.log(`Server is running on http://127.0.0.1:${3000}`),
)

export default server
