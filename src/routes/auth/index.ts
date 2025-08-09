import crypto from 'crypto'
import express from 'express'
import { api } from '../../functions/api'
import { spotify } from '../../functions/spotify'
import { TokenResponse, UserResponse } from '../../types'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const FRONTEND_URL = process.env.FRONTEND_URL ?? ''
const EXPIRES_IN = 30 * 24 * 60 * 60 * 1000 // 30 days

const router = express.Router()

/**
 * Request User Authorization
 * @see https://developer.spotify.com/documentation/web-api/tutorials/code-flow/#request-user-authorization
 */
router.get('/login', async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex')

    const scopes = [
      // Read access to user's subscription details (type of user account).
      'user-read-private',
      // Read access to user's email address.
      'user-read-email',
      // Read access to a user's top artists and tracks.
      'user-top-read',
      // Read access to user's private playlists.
      'playlist-read-private',
      // Include collaborative playlists when requesting a user's playlists.
      'playlist-read-collaborative',
      // Write access to a user's private playlists.
      'playlist-modify-private',
      // Write access to a user's public playlists.
      'playlist-modify-public'
    ]

    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? ''
    const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? ''

    const url = new URL('https://accounts.spotify.com/authorize')
    url.searchParams.append('response_type', 'code')
    url.searchParams.append('client_id', SPOTIFY_CLIENT_ID)
    url.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI)
    url.searchParams.append('scope', scopes.join(' '))
    url.searchParams.append('state', state)

    res.redirect(url.toString())
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to get login URL',
        message: error.message
      })
  }
})

/**
 * Logout the user
 */
router.get('/logout', (_req, res) => {
  try {
    // Clear the access token from cookies
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax'
    })

    // Clear the refresh token from cookies
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax'
    })

    // Clear the user ID from cookies
    res.clearCookie('user_id', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax'
    })

    const url = new URL('/', FRONTEND_URL)
    res.redirect(url.toString())
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to logout',
        message: error.message
      })
  }
})

/**
 * Request an access token
 * @see https://developer.spotify.com/documentation/web-api/tutorials/code-flow/#request-an-access-token
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, error, state } = req.query

    // Check if there was an error in the authorization
    if (error) {
      return res.status(400).json({
        error: 'Authorization failed',
        message: `Authorization failed: ${error}`
      })
    }

    // Check if code and state are present
    if (!code || !state) {
      return res.status(400).json({
        error: 'Invalid callback',
        message: 'Missing authorization code or state parameter'
      })
    }

    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? ''
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? ''
    const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? ''

    // Exchange the authorization code for an access token
    const tokenResponse = await api.post('https://accounts.spotify.com/api/token', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: SPOTIFY_REDIRECT_URI
      }
    })

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        error: 'Failed to authenticate',
        message: `Authentication failed: ${tokenResponse.statusText}`
      })
    }

    const tokens = await tokenResponse.json() as TokenResponse

    // Set the access token in cookies
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: tokens.expires_in * 1000
    })

    // Set the refresh token in cookies
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: EXPIRES_IN
    })

    const userResponse = await spotify.get('/me', tokens.access_token)

    if (!userResponse.ok) {
      return res.status(userResponse.status).json({
        error: 'Failed to get user profile',
        message: userResponse.statusText
      })
    }

    const user = await userResponse.json() as UserResponse

    // Set the user ID in cookies
    res.cookie('user_id', user.id, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: EXPIRES_IN
    })

    const url = new URL('/home', FRONTEND_URL)
    res.redirect(url.toString())
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to handle callback',
        message: error.message
      })
  }
})

/**
 * Refreshing tokens
 * @see https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies['refresh_token']

    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token provided',
        message: 'Refresh token is required to refresh access token'
      })
    }

    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? ''
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? ''

    const response = await api.post('https://accounts.spotify.com/api/token', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to refresh token',
        message: response.statusText
      })
    }

    const tokens = await response.json() as TokenResponse

    // Set the new access token in cookies
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: tokens.expires_in * 1000
    })

    if (tokens.refresh_token) {
      // Set the new refresh token in cookies if provided
      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        maxAge: EXPIRES_IN
      })
    }

    res.status(204).send()

  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to refresh token',
        message: error.message
      })
  }
})

export default router
