interface Options extends RequestInit {
  params?: Record<string, any>
}

async function fetcher(url: string, accessToken: string, options?: Options) {

  const spotifyUrl = new URL('https://api.spotify.com/v1')
  spotifyUrl.pathname = url

  const params = options?.params
  if (params) {
    const searchParams = new URLSearchParams(params)
    spotifyUrl.search = searchParams.toString()
  }

  return await fetch(spotifyUrl, {
    credentials: 'include',
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
