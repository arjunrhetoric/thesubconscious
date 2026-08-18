const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface FetchOptions extends RequestInit {
  token?: string | null
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers = {}, ...rest } = options

  // Get token from parameter or localStorage
  let authToken = token
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('sb_token')
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  if (authToken) {
    reqHeaders['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: reqHeaders,
    ...rest,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`
    throw new Error(errorMsg)
  }

  return data
}
