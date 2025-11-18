import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SetupWizard from './SetupWizard'
import type { PathEntry } from '../types'
import { apiGet, apiPost, apiPut } from '../api'

vi.mock('../api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

const mockPaths: PathEntry[] = [
  {
    name: 'Hot',
    full_path: '/mnt/ssd',
    total_bytes: 1000,
    used_bytes: 200,
    free_bytes: 800,
  },
]

const mockedGet = apiGet as unknown as ReturnType<typeof vi.fn>
const mockedPost = apiPost as unknown as ReturnType<typeof vi.fn>
const mockedPut = apiPut as unknown as ReturnType<typeof vi.fn>

describe('SetupWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGet.mockResolvedValue(mockPaths)
  })

  it('validates that hot and cold paths differ', async () => {
    const onComplete = vi.fn()
    render(<SetupWizard initialConfig={null} onComplete={onComplete} />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())

    const hotInput = screen.getByPlaceholderText(/ssd_pool/i)
    const coldInput = screen.getByPlaceholderText(/archive_pool/i)

    await userEvent.type(hotInput, '/mnt/duplicate')
    await userEvent.type(coldInput, '/mnt/duplicate')

    await userEvent.click(screen.getByRole('button', { name: /finish setup/i }))

    expect(await screen.findByText(/must be different/i)).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('surfaces scan failure if the initial scan request rejects', async () => {
    mockedPut.mockResolvedValue({})
    mockedPost.mockRejectedValue(new Error('scanner offline'))

    const onComplete = vi.fn()
    render(<SetupWizard initialConfig={null} onComplete={onComplete} />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())

    const hotInput = screen.getByPlaceholderText(/ssd_pool/i)
    const coldInput = screen.getByPlaceholderText(/archive_pool/i)

    await userEvent.type(hotInput, '/mnt/hot-1')
    await userEvent.type(coldInput, '/mnt/cold-1')

    await userEvent.click(screen.getByRole('button', { name: /finish setup/i }))

    await waitFor(() => expect(mockedPut).toHaveBeenCalled())
    expect(mockedPost).toHaveBeenCalled()

    expect(await screen.findByText(/initial library scan failed/i)).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })
})
