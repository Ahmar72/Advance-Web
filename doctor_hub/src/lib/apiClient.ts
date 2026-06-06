type ApiRequestOptions = {
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
  params?: Record<string, string>
  token?: string
}

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined
  return envUrl && envUrl.trim() ? envUrl : 'http://localhost:5050'
}

const buildUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(path, resolveApiBaseUrl())
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value)
      }
    })
  }
  return url.toString()
}

export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, params, token }: ApiRequestOptions = {},
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string' ? payload.error : 'Request failed.'
    throw new Error(message)
  }

  return payload as T
}
