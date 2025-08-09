import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { spotify } from '../../../functions/spotify'
import artistRouter from '../../../routes/artist'
import { mockAlbumsResponse } from '../../mocks'

// Mock the spotify module
jest.mock('../../../functions/spotify')
const mockSpotify = spotify as jest.Mocked<typeof spotify>

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use('/artist', artistRouter)
  return app
}

describe('Routes /artist/:artistId/albums', () => {
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

  describe('GET /artist/:artistId/albums', () => {
    it('should return 401 when authorization fails', async () => {

      const response = await request(app)
        .get('/artist/mock_artist_id/albums')

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
        .get('/artist/mock_artist_id/albums')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to get artist albums')
    })

    it('should make correct API calls', async () => {

      // Mock successful
      mockSpotify.get.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAlbumsResponse)
      } as any)

      await request(app)
        .get('/artist/mock_artist_id/albums')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      // Check token exchange call
      expect(mockSpotify.get).toHaveBeenCalledWith(
        '/artists/mock_artist_id/albums',
        'mock_access_token',
        expect.objectContaining({
          params: expect.objectContaining({
            limit: expect.any(Number),
            offset: expect.any(Number),
            include_groups: expect.any(String)
          })
        })
      )
    })

    it('should return artist albums successfully', async () => {

      // Mock successful
      mockSpotify.get.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAlbumsResponse)
      } as any)

      const response = await request(app)
        .get('/artist/mock_artist_id/albums')
        .set('Cookie', [
          'access_token=mock_access_token',
          'refresh_token=mock_refresh_token',
          'user_id=mock_user_id'
        ])

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Artist albums retrieved successfully')
      expect(response.body.data.items).toEqual([])
    })
  })
})
