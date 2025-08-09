import express from 'express'
import { spotify } from '../../functions/spotify'
import { redirectIfNotAuthenticated } from '../../middleware/auth'
import type { AlbumsResponse, ArtistResponse } from '../../types'

const router = express.Router()

/**
 * Retrieve the user's top artists
 * @see https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
 */
router.get('/me/top-artists', redirectIfNotAuthenticated, async (req, res) => {
  try {
    const accessToken = req.cookies['access_token']

    // 0-50
    const limit = 5

    // 0 or greater
    const parsedOffset = parseInt(req.query.offset as string) || 0
    const offset = Math.max(parsedOffset, 0)

    /**
     * Accepted values for time_range:
     * - short_term
     * - medium_term
     * - long_term
     */
    const timeRange = 'medium_term'

    const response = await spotify.get('/me/top/artists', accessToken, {
      params: {
        limit,
        offset,
        time_range: timeRange
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get top artists',
        message: response.statusText
      })
    }

    const data = await response.json() as ArtistResponse

    res.json({
      message: 'Top artists retrieved successfully',
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
        error: 'Failed to get top artists',
        message: error.message
      })
  }
})

/**
 * Retrieve artist's albums
 * @see https://developer.spotify.com/documentation/web-api/reference/get-an-artists-albums
 */
router.get('/:artistId/albums', redirectIfNotAuthenticated, async (req, res) => {
  try {
    const { artistId } = req.params

    const accessToken = req.cookies['access_token']

    // 0-50
    const limit = 5

    // 0 or greater
    const parsedOffset = parseInt(req.query.offset as string) || 0
    const offset = Math.max(parsedOffset, 0)

    /**
     * Acepted values for include_groups:
     * - album
     * - single
     * - appears_on
     * - compilation
     */
    const includeGroups = 'album,single'

    const response = await spotify.get(`/artists/${artistId}/albums`, accessToken, {
      params: {
        limit,
        offset,
        include_groups: includeGroups
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get artist albums',
        message: response.statusText
      })
    }

    const data = await response.json() as AlbumsResponse

    res.json({
      message: 'Artist albums retrieved successfully',
      data
    })
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to get artist albums',
        message: error.message
      })
  }
})

export default router
