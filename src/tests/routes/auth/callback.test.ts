import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { api } from '../../../functions/api'
import { spotify } from '../../../functions/spotify'
import authRouter from '../../../routes/auth'
import { mockTokenResponse, mockUserResponse } from '../../mocks'

// Mock the api module
jest.mock('../../../functions/api')
const mockApi = api as jest.Mocked<typeof api>

// Mock the spotify module
jest.mock('../../../functions/spotify')
const mockSpotify = spotify as jest.Mocked<typeof spotify>

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', authRouter)
  return app
}

describe('Routes /auth/callback', () => {
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

  describe('GET /auth/callback', () => {
    it('should return 400 when authorization fails', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({
          error: 'access_denied'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Authorization failed')
    })

    it('should return 400 when code is missing', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({
          state: 'test_state'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid callback')
    })

    it('should return 400 when state is missing', async () => {
      const response = await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_code'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid callback')
    })

    it('should return error when Spotify token exchange API returns an error', async () => {

      // Mock failed token exchange
      mockApi.post.mockResolvedValue({
        ok: false,
        status: 500
      } as any)

      const response = await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_code',
          state: 'test_state'
        })

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to authenticate')
    })

    it('should return error when Spotify user profile API returns an error', async () => {

      // Mock successful token exchange
      mockApi.post.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTokenResponse)
      } as any)

      // Mock failed user profile fetch
      mockSpotify.get.mockResolvedValue({
        ok: false,
        status: 500
      } as any)

      const response = await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_code',
          state: 'test_state'
        })

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to get user profile')
    })

    it('should make correct API calls', async () => {

      // Mock successful token exchange
      mockApi.post.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTokenResponse)
      } as any)

      // Mock successful user profile fetch
      mockSpotify.get.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUserResponse)
      } as any)

      await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_auth_code',
          state: 'test_state'
        })

      // Check token exchange call
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

      // Check user profile call
      expect(mockSpotify.get).toHaveBeenCalledWith(
        '/me',
        'mock_access_token'
      )
    })

    it('should redirect to frontend URL with cookies set on successful authentication', async () => {

      // Mock successful token exchange
      mockApi.post.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTokenResponse)
      } as any)

      // Mock successful user profile fetch
      mockSpotify.get.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUserResponse)
      } as any)

      const response = await request(app)
        .get('/auth/callback')
        .query({
          code: 'test_auth_code',
          state: 'test_state'
        })

      const FRONTEND_URL = process.env.FRONTEND_URL
      const url = new URL('/home', FRONTEND_URL)

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe(url.toString())

      // Check that cookies are set
      const cookies = response.headers['set-cookie']
      expect(cookies).toContainEqual(expect.stringContaining('access_token=mock_access_token'))
      expect(cookies).toContainEqual(expect.stringContaining('refresh_token=mock_refresh_token'))
      expect(cookies).toContainEqual(expect.stringContaining('user_id=mock_user_id'))
    })
  })
})
