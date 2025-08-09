import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { api } from '../../../functions/api'
import authRouter from '../../../routes/auth'
import { mockTokenResponse } from '../../mocks'

// Mock the api module
jest.mock('../../../functions/api')
const mockApi = api as jest.Mocked<typeof api>

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/auth', authRouter)
  return app
}

describe('Routes /auth/refresh', () => {
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

  describe('POST /auth/refresh', () => {
    it('should return 400 when refresh token cookie is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh')

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('No refresh token provided')
    })

    it('should return error when Spotify token exchange API returns an error', async () => {

      // Mock failed token exchange
      mockApi.post.mockResolvedValue({
        ok: false,
        status: 500
      } as Response)

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [
          'refresh_token=invalid_refresh_token'
        ])

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to refresh token')
    })

    it('should make correct API calls', async () => {

      // Mock successful token exchange
      mockApi.post.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTokenResponse)
      } as Response)

      await request(app)
        .post('/auth/refresh')
        .set('Cookie', [
          'refresh_token=old_refresh_token'
        ])

      // Check token exchange call
      expect(mockApi.post).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
            'Content-Type': 'application/x-www-form-urlencoded'
          }),
          params: expect.objectContaining({
            refresh_token: 'old_refresh_token',
            grant_type: 'refresh_token'
          })
        })
      )
    })

    it('should return 204 and set new tokens in cookies on successful refresh', async () => {

      // Mock successful token exchange
      mockApi.post.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTokenResponse)
      } as Response)

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [
          'refresh_token=old_refresh_token'
        ])

      expect(response.status).toBe(204)

      // Check that new access token is set in cookies
      const cookies = response.headers['set-cookie']
      expect(cookies).toContainEqual(expect.stringContaining('access_token=mock_access_token'))
      expect(cookies).toContainEqual(expect.stringContaining('refresh_token=mock_refresh_token'))
    })
  })
})
