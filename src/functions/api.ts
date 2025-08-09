interface Options extends RequestInit {
  params?: Record<string, string>
}

async function fetcher(url: string, options?: Options) {

  const apiUrl = new URL(url)

  const params = options?.params
  if (params) {
    const searchParams = new URLSearchParams(params)
    apiUrl.search = searchParams.toString()
  }

  return await fetch(apiUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    }
  })
}

function get(url: string, options?: Omit<Options, 'method'>) {
  return fetcher(url, {
    ...options,
    method: 'GET'
  })
}

function post(url: string, options?: Omit<Options, 'method'>) {
  return fetcher(url, {
    ...options,
    method: 'POST'
  })
}

export const api = {
  get,
  post
}
