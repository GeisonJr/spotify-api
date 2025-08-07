import crypto from 'crypto'
import express from 'express'
import { api } from '../../functions/api'
import { TokenResponse } from '../../types'

const router = express.Router()

/**
 * Check if the user is authenticated
 */
router.get('/is-authenticated', (req, res) => {
  try {
    const accessToken = req.cookies.access_token
    const refreshToken = req.cookies.refresh_token

    if (accessToken && refreshToken) {
      return res.status(200).json({
        authenticated: true
      })
    }

    res.status(401).json({
      authenticated: false
    })
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to check authentication',
        message: error.message
      })
  }
})

/**
 * Retrieve the login URL for Spotify authentication
 * @see https://developer.spotify.com/documentation/web-api/tutorials/code-flow/#request-user-authorization
 */
router.get('/login', async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex')

    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-private',
      'playlist-modify-public'
    ]

    const url = new URL('https://accounts.spotify.com/authorize')
    url.searchParams.append('response_type', 'code')
    url.searchParams.append('client_id', process.env.SPOTIFY_CLIENT_ID || '')
    url.searchParams.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URI || '')
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
router.post('/logout', (_req, res) => {
  try {
    // Clear the access token and refresh token cookies with same options used when setting
    res.clearCookie('access_token', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    res.clearCookie('refresh_token', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // Redirect to the home page or login page
    res.json({
      message: 'Logged out successfully'
    })
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to logout',
        message: error.message
      })
  }
})

/**
 * Handle Spotify authentication callback
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

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI as string
    const frontendUrl = process.env.FRONTEND_URL as string

    // Exchange the authorization code for an access token
    const authentication = await api.post('https://accounts.spotify.com/api/token', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }
    })

    if (!authentication.ok) {
      return res.status(authentication.status).json({
        error: 'Failed to authenticate',
        message: `Authentication failed: ${authentication.statusText}`
      })
    }

    const data = await authentication.json() as TokenResponse

    // Set the access token in cookies
    res.cookie('access_token', data.access_token, {
      httpOnly: false, // Allow frontend JavaScript to access the cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.expires_in * 1000
    })

    // Set the refresh token in cookies
    res.cookie('refresh_token', data.refresh_token, {
      httpOnly: false, // Allow frontend JavaScript to access the cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.expires_in * 1000
    })

    console.log(res)

    console.log(frontendUrl)

    res.redirect(frontendUrl)
  } catch (error) {
    if (error instanceof Error)
      res.status(500).json({
        error: 'Failed to handle callback',
        message: error.message
      })
  }
})

export default router
