import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import authRouter from '../../../routes/auth'

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', authRouter)
  return app
}

describe('Routes /auth/logout', () => {
  let app: express.Application

  beforeEach(() => {
    app = createTestApp()
    jest.clearAllMocks()

    // Mock environment variables
    process.env.SPOTIFY_CLIENT_ID = 'test_client_id'
    process.env.SPOTIFY_CLIENT_SECRET = 'test_client_secret'
    process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:3000/auth/callback'
    process.env.FRONTEND_URL = 'http://localhost:3001'
  })

  describe('GET /auth/logout', () => {
    it('should clear auth cookies and redirect to the frontend homepage', async () => {
      const response = await request(app)
        .get('/auth/logout')
        .set('Cookie', [
          'access_token=test_token',
          'refresh_token=test_refresh',
          'user_id=test_user_id'
        ])

      const FRONTEND_URL = process.env.FRONTEND_URL
      const url = new URL('/', FRONTEND_URL)

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe(url.toString())

      // Check that cookies are cleared
      const cookies = response.headers['set-cookie']
      expect(cookies).toContainEqual(expect.stringContaining('access_token=;'))
      expect(cookies).toContainEqual(expect.stringContaining('refresh_token=;'))
      expect(cookies).toContainEqual(expect.stringContaining('user_id=;'))
    })
  })
})
