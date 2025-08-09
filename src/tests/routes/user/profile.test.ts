import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { spotify } from '../../../functions/spotify'
import userRouter from '../../../routes/user'
import { mockUserResponse } from '../../mocks'

// Mock the spotify module
jest.mock('../../../functions/spotify')
const mockSpotify = spotify as jest.Mocked<typeof spotify>

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/user', userRouter)
  return app
}

describe('Routes /user/profile', () => {
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

  describe('GET /user/profile', () => {
    it('should return 401 when authorization fails', async () => {

      const response = await request(app)
        .get('/user/profile')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Authentication required')
    })

    it('should return error when Spotify API fails', async () => {

      // Mock failed
      mockSpotify.get.mockResolvedValue({
        ok: false,
        status: 500
      } as Response)

      const response = await request(app)
        .get('/user/profile')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to get user profile')
    })

    it('should make correct API calls', async () => {

      // Mock successful
      mockSpotify.get.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUserResponse)
      } as Response)

      await request(app)
        .get('/user/profile')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      // Check token exchange call
      expect(mockSpotify.get).toHaveBeenCalledWith(
        '/me',
        'mock_access_token'
      )
    })

    it('should return user playlists successfully', async () => {

      // Mock successful
      mockSpotify.get.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUserResponse)
      } as Response)

      const response = await request(app)
        .get('/user/profile')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User profile retrieved successfully')
      expect(response.body.data).toEqual(mockUserResponse)
    })
  })
})
