import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiGet, apiPost } from './api'

const mockFetch = (implementation: Parameters<typeof vi.fn>[0]) => {
  const fetchMock = vi.fn(implementation) as unknown as typeof fetch
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('api client', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('throws a helpful error on non-2xx responses', async () => {
    const response = {
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server exploded'),
    } as Response

    mockFetch(() => Promise.resolve(response))

    await expect(apiGet('/bad')).rejects.toThrow(/Server exploded/)
    await expect(apiPost('/bad', {})).rejects.toThrow(/Server exploded|500/)
  })

  it('aborts the request when it times out', async () => {
    vi.useFakeTimers()

    mockFetch((_, options) => {
      return new Promise((_resolve, reject) => {
        const signal = options?.signal as AbortSignal | undefined
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    const promise = apiGet('/slow')
    const expectation = expect(promise).rejects.toThrow(/Request timed out/i)

    await vi.advanceTimersByTimeAsync(20_000)
    await expectation
  })
})
