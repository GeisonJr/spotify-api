import type { ArtistResponse, TokenResponse, UserResponse } from '../types'

export const mockTokenResponse: TokenResponse = {
  access_token: 'mock_access_token',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'mock_refresh_token',
  scope: 'user-read-private user-read-email'
}

export const mockUserResponse: UserResponse = {
  country: 'US',
  display_name: 'Mock User',
  email: 'mock_user_id@example.com',
  explicit_content: {
    filter_enabled: false,
    filter_locked: false
  },
  external_urls: {
    spotify: 'https://open.spotify.com/user/mock_user_id'
  },
  followers: {
    href: null,
    total: 10
  },
  href: 'https://api.spotify.com/v1/users/mock_user_id',
  id: 'mock_user_id',
  images: [
    {
      url: 'https://cdn.spotify.com/images/mock_user_id.jpg',
      height: 123,
      width: 123
    }
  ],
  product: 'premium',
  type: 'user',
  uri: 'spotify:user:mock_user_id'
}

export const mockTopArtistsResponse: ArtistResponse = {
  href: 'https://api.spotify.com/v1/me/top/artists',
  limit: 5,
  next: null,
  offset: 0,
  previous: null,
  total: 0,
  items: []
}

export const mockAlbumsResponse: ArtistResponse = {
  href: 'https://api.spotify.com/v1/artists/mock_artist_id/albums',
  limit: 5,
  next: null,
  offset: 0,
  previous: null,
  total: 0,
  items: []
}
