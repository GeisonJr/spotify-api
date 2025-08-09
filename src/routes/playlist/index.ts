import express from 'express'
import { spotify } from '../../functions/spotify'
import { redirectIfNotAuthenticated } from '../../middleware/auth'
import type { PlaylistResponse } from '../../types'

const router = express.Router()

/**
 * Retrieve artist's albums
 * @see https://developer.spotify.com/documentation/web-api/reference/get-an-artists-albums
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
        limit,
        offset
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
      data
    })
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to get user playlists',
        message: error.message
      })
  }
})

export default router
