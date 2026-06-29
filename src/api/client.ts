// ---------------------------------------------------------------------------
// GLPI High-Level REST API client.
// Requests are sent to the `/glpi` path which the Vite dev server proxies to the
// real GLPI host (see vite.config.ts) — this avoids CORS in the browser.
// Secrets are hard-coded on purpose: this is a throwaway prototype.
// ---------------------------------------------------------------------------

const BASE = '/glpi'
const API = `${BASE}/api.php/v2.3.0`

const CREDENTIALS = {
  client_id: '38fda81ce125cb6f51cfb0a9d1d390ef0c23497cc1c3aa1f6f79c0fc6229be46',
  client_secret: 'b3c3b97ee8ccb64e59c6f435ddd2546381becb6b3ad7ac68200aa7f08c270a51',
  username: 'admin',
  password: 'Test@123',
  scope: 'api',
}

type TokenCache = { access_token: string; expires_at: number }
const TOKEN_KEY = 'glpi_token'

function loadToken(): TokenCache | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as TokenCache) : null
  } catch {
    return null
  }
}

// In-memory copy of the cached token (source of truth is localStorage). Seeded
// once on module load so we don't re-read/parse storage on every request.
let memo: TokenCache | null = loadToken()
// Ensures only ONE token request is ever in flight: concurrent callers (React
// Query fires many at once on first paint) all await the same promise.
let inflight: Promise<string> | null = null

function isValid(t: TokenCache | null): t is TokenCache {
  return !!t && Date.now() < t.expires_at
}

function clearToken() {
  memo = null
  localStorage.removeItem(TOKEN_KEY)
}

async function requestToken(): Promise<string> {
  const body = new URLSearchParams({ grant_type: 'password', ...CREDENTIALS })
  const res = await fetch(`${BASE}/api.php/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Auth failed (${res.status})`)
  const data = await res.json()
  if (!data.access_token) throw new Error('Auth failed: no token')
  memo = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(memo))
  return memo.access_token
}

// Fetch a fresh token, deduplicating concurrent callers via the in-flight guard.
function fetchToken(): Promise<string> {
  if (!inflight) {
    inflight = requestToken().finally(() => {
      inflight = null
    })
  }
  return inflight
}

// Return a valid token: reuse the cached one until it expires, otherwise mint
// one (and only one) new token.
async function getToken(): Promise<string> {
  if (isValid(memo)) return memo.access_token
  return fetchToken()
}

export class ApiError extends Error {
  status: number
  detail?: string
  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const send = async (token: string) => {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    const init: RequestInit = { method, headers }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
    return fetch(`${API}${path}`, init)
  }

  let token = await getToken()
  let res = await send(token)
  if (res.status === 401) {
    // Token was revoked/expired server-side — drop it and mint exactly one new one.
    clearToken()
    token = await fetchToken()
    res = await send(token)
  }

  const text = await res.text()
  const json = text ? safeParse(text) : null
  if (!res.ok) {
    const title = json?.title || json?.detail || res.statusText
    throw new ApiError(res.status, title, json?.detail ?? text)
  }
  return json as T
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const api = {
  list: <T>(endpoint: string, range = '0-999') =>
    request<T[]>('GET', `${endpoint}?range=${range}`),
  get: <T>(endpoint: string, id: number | string) =>
    request<T>('GET', `${endpoint}/${id}`),
  create: <T>(endpoint: string, body: unknown) =>
    request<T>('POST', endpoint, body),
  update: <T>(endpoint: string, id: number | string, body: unknown) =>
    request<T>('PATCH', `${endpoint}/${id}`, body),
  remove: (endpoint: string, id: number | string) =>
    request<unknown>('DELETE', `${endpoint}/${id}?force=true`),
}
