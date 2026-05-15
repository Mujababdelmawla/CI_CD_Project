import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import App from './App'

// Mock the global fetch so tests never hit a real server
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper — makes fetch return a resolved response with given JSON
function mockResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ── Rendering ────────────────────────────────────────────────────────────────

describe('App rendering', () => {
  it('shows the page title', async () => {
    // ARRANGE
    mockFetch.mockReturnValue(mockResponse([]))
    // ACT
    render(<App />)
    // ASSERT
    expect(screen.getByText('Task Manager')).toBeInTheDocument()
  })

  it('shows empty state message when no tasks', async () => {
    // ARRANGE
    mockFetch.mockReturnValue(mockResponse([]))
    // ACT
    render(<App />)
    // ASSERT
    await waitFor(() =>
      expect(screen.getByText('No tasks yet. Add one above!')).toBeInTheDocument()
    )
  })

  it('renders tasks returned from the API', async () => {
    // ARRANGE
    const fakeTasks = [
      { id: 1, title: 'Buy groceries', done: false },
      { id: 2, title: 'Walk the dog', done: false },
    ]
    mockFetch.mockReturnValue(mockResponse(fakeTasks))
    // ACT
    render(<App />)
    // ASSERT
    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument()
      expect(screen.getByText('Walk the dog')).toBeInTheDocument()
    })
  })
})

// ── Adding tasks ─────────────────────────────────────────────────────────────

describe('Adding tasks', () => {
  it('adds a task when Add button is clicked', async () => {
    // ARRANGE
    mockFetch
      .mockReturnValueOnce(mockResponse([]))                                   // initial fetch
      .mockReturnValueOnce(mockResponse({ id: 1, title: 'Learn Jenkins', done: false }, 201)) // POST
    render(<App />)
    await waitFor(() => screen.getByText('No tasks yet. Add one above!'))
    // ACT
    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Learn Jenkins' },
    })
    fireEvent.click(screen.getByText('Add'))
    // ASSERT
    await waitFor(() =>
      expect(screen.getByText('Learn Jenkins')).toBeInTheDocument()
    )
  })

  it('shows error when trying to add empty task', async () => {
    // ARRANGE
    mockFetch.mockReturnValue(mockResponse([]))
    render(<App />)
    await waitFor(() => screen.getByText('No tasks yet. Add one above!'))
    // ACT — click Add with empty input
    fireEvent.click(screen.getByText('Add'))
    // ASSERT
    expect(screen.getByText('Task title cannot be empty.')).toBeInTheDocument()
  })
})

// ── Deleting tasks ───────────────────────────────────────────────────────────

describe('Deleting tasks', () => {
  it('removes a task when delete button is clicked', async () => {
    // ARRANGE
    mockFetch
      .mockReturnValueOnce(mockResponse([{ id: 1, title: 'Delete me', done: false }]))
      .mockReturnValueOnce(mockResponse({ message: 'task deleted' }))
    render(<App />)
    await waitFor(() => screen.getByText('Delete me'))
    // ACT
    fireEvent.click(screen.getByTitle('Delete task'))
    // ASSERT
    await waitFor(() =>
      expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
    )
  })
})

// ── Marking done ─────────────────────────────────────────────────────────────

describe('Marking tasks done', () => {
  it('toggles task to done when check button clicked', async () => {
    // ARRANGE
    mockFetch
      .mockReturnValueOnce(mockResponse([{ id: 1, title: 'Finish CI/CD', done: false }]))
      .mockReturnValueOnce(mockResponse({ id: 1, title: 'Finish CI/CD', done: true }))
    render(<App />)
    await waitFor(() => screen.getByText('Finish CI/CD'))
    // ACT
    fireEvent.click(screen.getByTitle('Mark done'))
    // ASSERT
    await waitFor(() =>
      expect(screen.getByTitle('Mark undone')).toBeInTheDocument()
    )
  })
})