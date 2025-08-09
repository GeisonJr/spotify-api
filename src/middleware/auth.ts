import { NextFunction, Request, Response } from 'express'

/**
 * Middleware to redirect to frontend login page when credentials are missing
 */
export const redirectIfNotAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.access_token
  const refreshToken = req.cookies.refresh_token
  const userId = req.cookies.user_id

  // If tokens are missing, redirect to frontend login
  if (!accessToken || !refreshToken || !userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to continue'
    })
  }

  // If authenticated, continue
  next()
}
