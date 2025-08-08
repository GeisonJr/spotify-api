import type { TokenResponse } from '../types'

export const mockTokenResponse: TokenResponse = {
  access_token: 'mock_access_token',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'mock_refresh_token',
  scope: 'user-read-private user-read-email'
}
