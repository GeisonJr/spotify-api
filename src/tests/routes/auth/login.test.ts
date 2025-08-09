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

describe('Routes /auth/login', () => {
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

  describe('GET /auth/login', () => {
    it('should redirect to Spotify authorization endpoint with correct parameters', async () => {
      const response = await request(app)
        .get('/auth/login')

      expect(response.status).toBe(302)
      expect(response.headers.location).toContain('https://accounts.spotify.com/authorize')
      expect(response.headers.location).toContain('response_type=code')
      expect(response.headers.location).toContain('client_id=test_client_id')
      expect(response.headers.location).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback')
      expect(response.headers.location).toContain('state=')
    })

    it('should include all required scopes in the authorization URL', async () => {
      const response = await request(app)
        .get('/auth/login')

      expect(response.headers.location).toContain('scope=')
      expect(decodeURIComponent(response.headers.location)).toContain('user-read-private')
      expect(decodeURIComponent(response.headers.location)).toContain('user-read-email')
      expect(decodeURIComponent(response.headers.location)).toContain('user-top-read')
      expect(decodeURIComponent(response.headers.location)).toContain('playlist-read-private')
      expect(decodeURIComponent(response.headers.location)).toContain('playlist-read-collaborative')
      expect(decodeURIComponent(response.headers.location)).toContain('playlist-modify-private')
      expect(decodeURIComponent(response.headers.location)).toContain('playlist-modify-public')
    })

    it('should generate a unique random state parameter per request', async () => {
      const response1 = await request(app).get('/auth/login')
      const response2 = await request(app).get('/auth/login')

      const state1 = new URL(response1.headers.location).searchParams.get('state')
      const state2 = new URL(response2.headers.location).searchParams.get('state')

      expect(state1).toBeTruthy()
      expect(state2).toBeTruthy()
      expect(state1).not.toBe(state2)
    })
  })
})
