interface Options extends RequestInit {
  params?: Record<string, string>
}

async function fetcher(url: string, accessToken: string, options?: Options) {

  const spotifyUrl = new URL('https://api.spotify.com')
  spotifyUrl.pathname = `/v1/${url.replace(/^\//, '')}`

  const params = options?.params
  if (params) {
    const searchParams = new URLSearchParams(params)
    spotifyUrl.search = searchParams.toString()
  }

  return await fetch(spotifyUrl, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    }
  })
}

function get(url: string, accessToken: string, options?: Omit<Options, 'method'>) {
  return fetcher(url, accessToken, {
    ...options,
    method: 'GET'
  })
}

function post(url: string, accessToken: string, options?: Omit<Options, 'method'>) {
  return fetcher(url, accessToken, {
    ...options,
    method: 'POST'
  })
}

export const spotify = {
  get,
  post
}
