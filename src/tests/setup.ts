import 'dotenv/config'

process.env.SPOTIFY_CLIENT_ID = 'test_client_id'
process.env.SPOTIFY_CLIENT_SECRET = 'test_client_secret'
process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:3000/auth/callback'
process.env.FRONTEND_URL = 'http://localhost:3001'

jest.setTimeout(10000)
