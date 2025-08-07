import type { Express } from 'express'
import artistRoutes from './artist'
import authRoutes from './auth'
import playlistRoutes from './playlist'
import userRoutes from './user'

export default (app: Express) => {
  app.use('/auth', authRoutes)
  app.use('/user', userRoutes)
  app.use('/artist', artistRoutes)
  app.use('/playlist', playlistRoutes)
}
