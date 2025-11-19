const API_BASE = (import.meta.env?.VITE_API_BASE as string | undefined) || '/api'
const DEFAULT_TIMEOUT_MS = 20_000

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const trimmedBase = API_BASE.replace(/\/$/, '')
  const trimmedPath = path.startsWith('/') ? path : `/${path}`
  return `${trimmedBase}${trimmedPath}`
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(
      message || `API request failed with status ${response.status}`,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...fetchOptions } = options
  const controller = new AbortController()
  let didTimeout = false
  const timeoutId = window.setTimeout(() => {
    didTimeout = true
    controller.abort()
  }, timeoutMs)

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  try {
    const response = await fetch(buildUrl(path), {
      ...fetchOptions,
      signal: controller.signal,
    })
    return handleResponse<T>(response)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError' && didTimeout) {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return request<T>(path, {
    headers: {
      Accept: 'application/json',
    },
  })
}

export async function apiPost<T = unknown>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function apiPatch<T = unknown>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}
