// Server-side only — attaches INTERNAL_API_SECRET to all Express API calls
// Never use this from client components

const API_URL = process.env.API_URL || 'http://localhost:4000'
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || ''

interface FetchOptions extends RequestInit {
  userToken?: string
}

export async function apiCall<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { userToken, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-secret': INTERNAL_API_SECRET,
    ...(fetchOptions.headers as Record<string, string> || {}),
  }

  if (userToken) {
    headers['x-user-token'] = userToken
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error ${res.status}`)
  }

  return res.json() as Promise<T>
}
