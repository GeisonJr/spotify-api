import express from 'express'
import { spotify } from '../../functions/spotify'
import { UserResponse } from '../../types'

const router = express.Router()

/**
 * Retrieve user profile
 * @see https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
 */
router.get('/profile', async (req, res) => {
  try {
    const accessToken = req.cookies['access_token']

    const response = await spotify.get('/me', accessToken)

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get user profile',
        message: response.statusText
      })
    }

    const data = await response.json() as UserResponse

    res.json({
      message: 'User profile retrieved successfully',
      data
    })
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to get user profile',
        message: error.message
      })
  }
})

export default router
