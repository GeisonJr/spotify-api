import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { api } from '../../functions/api'
import authRouter from '../../routes/auth'
import { mockTokenResponse } from '../mocks'

// Mock the api module
jest.mock('../../functions/api')
const mockApi = api as jest.Mocked<typeof api>

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', authRouter)
  return app
}

describe('Auth Routes', () => {
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

  describe('GET /auth/is-authenticated', () => {
    it('should return authenticated true when both tokens are present', async () => {
      const response = await request(app)
        .get('/auth/is-authenticated')
        .set('Cookie', [
          'access_token=test_access_token',
          'refresh_token=test_refresh_token'
        ])

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        authenticated: true
      })
    })

    it('should return authenticated false when access token is missing', async () => {
      const response = await request(app)
        .get('/auth/is-authenticated')
        .set('Cookie', [
          'refresh_token=test_refresh_token'
        ])

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        authenticated: false
      })
    })

    it('should return authenticated false when refresh token is missing', async () => {
      const response = await request(app)
        .get('/auth/is-authenticated')
        .set('Cookie', [
          'access_token=test_access_token'
        ])

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        authenticated: false
      })
    })

    it('should return authenticated false when no tokens are present', async () => {
      const response = await request(app)
        .get('/auth/is-authenticated')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        authenticated: false
      })
    })
  })

  describe('GET /auth/login', () => {
    it('should redirect to Spotify authorization URL', async () => {
      const response = await request(app)
        .get('/auth/login')

      expect(response.status).toBe(302)
      expect(response.headers.location).toContain('https://accounts.spotify.com/authorize')
      expect(response.headers.location).toContain('response_type=code')
      expect(response.headers.location).toContain('client_id=test_client_id')
      expect(response.headers.location).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback')
      expect(response.headers.location).toContain('state=')
    })

    it('should include correct scopes in authorization URL', async () => {
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

    it('should generate random state parameter', async () => {
      const response1 = await request(app).get('/auth/login')
      const response2 = await request(app).get('/auth/login')

      const state1 = new URL(response1.headers.location).searchParams.get('state')
      const state2 = new URL(response2.headers.location).searchParams.get('state')

      expect(state1).toBeTruthy()
      expect(state2).toBeTruthy()
      expect(state1).not.toBe(state2)
    })
  })

  describe('GET /auth/logout', () => {
    it('should clear authentication cookies and redirect', async () => {
      const response = await request(app)
        .get('/auth/logout')
        .set('Cookie', [
          'access_token=test_token',
          'refresh_token=test_refresh'
        ])

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe('http://localhost:3001')

      // Check that cookies are cleared
      const setCookieHeaders = response.headers['set-cookie']
      expect(setCookieHeaders).toContainEqual(expect.stringContaining('access_token=;'))
      expect(setCookieHeaders).toContainEqual(expect.stringContaining('refresh_token=;'))
    })

    it('should set secure cookies in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const response = await request(app)
        .get('/auth/logout')

      const setCookieHeaders = response.headers['set-cookie']
      expect(setCookieHeaders).toContainEqual(expect.stringContaining('Secure'))

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('GET /auth/callback', () => {
    it('should handle successful authorization callback', async () => {
      // Mock successful token exchange
      mockApi.post.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTokenResponse)
      } as any)

      const response = await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_auth_code',
          state: 'test_state'
        })

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe('http://localhost:3001')

      // Check that cookies are set
      const setCookieHeaders = response.headers['set-cookie']
      expect(setCookieHeaders).toContainEqual(expect.stringContaining('access_token=mock_access_token'))
      expect(setCookieHeaders).toContainEqual(expect.stringContaining('refresh_token=mock_refresh_token'))
    })

    it('should return error when authorization fails', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({
          error: 'access_denied',
          state: 'test_state'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Authorization failed')
    })

    it('should return error when code is missing', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({
          state: 'test_state'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid callback')
    })

    it('should return error when state is missing', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_code'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid callback')
    })

    it('should handle token exchange failure', async () => {
      // Mock failed token exchange
      mockApi.post.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as any)

      const response = await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_code',
          state: 'test_state'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Failed to authenticate')
    })

    it('should make correct API call for token exchange', async () => {
      mockApi.post.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTokenResponse)
      } as any)

      await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_auth_code',
          state: 'test_state'
        })

      expect(mockApi.post).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
            'Content-Type': 'application/x-www-form-urlencoded'
          }),
          params: expect.objectContaining({
            code: 'test_auth_code',
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:3000/auth/callback'
          })
        })
      )
    })

    it('should set httpOnly cookies with correct attributes', async () => {
      mockApi.post.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTokenResponse)
      } as any)

      const response = await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_code',
          state: 'test_state'
        })

      const setCookieHeaders = response.headers['set-cookie']

      // Check access token cookie
      expect(setCookieHeaders).toContainEqual(
        expect.stringMatching(/access_token=mock_access_token.*HttpOnly.*SameSite=Lax/)
      )

      // Check refresh token cookie
      expect(setCookieHeaders).toContainEqual(
        expect.stringMatching(/refresh_token=mock_refresh_token.*HttpOnly.*SameSite=Lax/)
      )
    })
  })
})
