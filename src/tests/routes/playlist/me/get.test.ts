import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { spotify } from '../../../../functions/spotify'
import playlistRouter from '../../../../routes/playlist'
import { mockPlaylistsResponse } from '../../../mocks'

// Mock the spotify module
jest.mock('../../../../functions/spotify')
const mockSpotify = spotify as jest.Mocked<typeof spotify>

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/playlist', playlistRouter)
  return app
}

describe('Routes /playlist/me', () => {
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

  describe('GET /playlist/me', () => {
    it('should return 401 when authorization fails', async () => {

      const response = await request(app)
        .get('/playlist/me')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Authentication required')
    })

    it('should return error when Spotify API fails', async () => {

      // Mock failed
      mockSpotify.get.mockResolvedValue({
        ok: false,
        status: 500
      } as any)

      const response = await request(app)
        .get('/playlist/me')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to get user playlists')
    })

    it('should make correct API calls', async () => {

      // Mock successful
      mockSpotify.get.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPlaylistsResponse)
      } as any)

      await request(app)
        .get('/playlist/me')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      // Check token exchange call
      expect(mockSpotify.get).toHaveBeenCalledWith(
        '/me/playlists',
        'mock_access_token',
        expect.objectContaining({
          params: expect.objectContaining({
            limit: expect.any(Number),
            offset: expect.any(Number)
          })
        })
      )
    })

    it('should return user playlists successfully', async () => {

      // Mock successful
      mockSpotify.get.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPlaylistsResponse)
      } as any)

      const response = await request(app)
        .get('/playlist/me')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('User playlists retrieved successfully')
      expect(response.body.data.items).toEqual([])
    })
  })
})
