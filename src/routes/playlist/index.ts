import express from 'express'
import { spotify } from '../../functions/spotify'
import { redirectIfNotAuthenticated } from '../../middleware/auth'
import type { PlaylistCreateResponse, PlaylistResponse } from '../../types'

const router = express.Router()

/**
 * Get Current User's Playlists
 * @see https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists
 */
router.get('/me', redirectIfNotAuthenticated, async (req, res) => {
  try {
    const accessToken = req.cookies['access_token']

    // 0-50
    const limit = 5

    // 0 or greater
    const parsedOffset = parseInt(req.query.offset as string) || 0
    const offset = Math.max(parsedOffset, 0)

    const response = await spotify.get('/me/playlists', accessToken, {
      params: {
        limit: limit.toString(),
        offset: offset.toString()
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get user playlists',
        message: response.statusText
      })
    }

    const data = await response.json() as PlaylistResponse

    res.json({
      message: 'User playlists retrieved successfully',
      data,
      pagination: {
        hasNext: !!data.next,
        hasPrevious: !!data.previous,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(data.total / limit)
      }
    })
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to get user playlists',
        message: error.message
      })
  }
})

/**
 * Create Playlist
 * @see https://developer.spotify.com/documentation/web-api/reference/create-playlist
 */
router.post('/me', redirectIfNotAuthenticated, async (req, res) => {
  try {
    const accessToken = req.cookies['access_token']
    const userId = req.cookies['user_id']

    const { name } = req.body ?? {}

    if (!name) {
      return res.status(400).json({
        error: 'Name is required to create a playlist',
        message: 'Please provide a name for the playlist'
      })
    }

    const response = await spotify.post(`/users/${userId}/playlists`, accessToken, {
      body: JSON.stringify({
        name,
        description: 'Created via Spotify API',
        public: false
      })
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to create playlist',
        message: response.statusText
      })
    }

    const data = await response.json() as PlaylistCreateResponse

    if (data.id) {
      res.status(201).json({
        message: 'Playlist created successfully',
        data
      })
    }

  } catch (error) {
    if (error instanceof Error)
      return res.status(500).json({
        error: 'Failed to create playlist',
        message: error.message
      })
  }
})

export default router
