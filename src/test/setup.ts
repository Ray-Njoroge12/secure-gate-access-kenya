import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      then: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null }))
    },
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        download: vi.fn(() => Promise.resolve({ data: null, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
        list: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }
  }
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => 
      React.createElement('a', { href: to }, children)
  }
})

// Mock window APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

// Mock crypto API for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-12345',
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
})

// Setup test environment
beforeAll(() => {
  // Global test setup
  process.env.NODE_ENV = 'test'
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321'
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
})

afterAll(() => {
  // Global test cleanup
  vi.clearAllMocks()
})

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  cleanup()
  vi.resetAllMocks()
})

// Custom matchers and utilities
expect.extend({
  toBeAccessible: function (received) {
    // Custom accessibility matcher
    const hasAriaLabel = received.getAttribute('aria-label')
    const hasRole = received.getAttribute('role')
    
    if (hasAriaLabel || hasRole) {
      return {
        message: () => `expected element to be accessible`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected element to have aria-label or role attribute`,
        pass: false,
      }
    }
  },
})

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockVisitor = (overrides = {}) => ({
  id: 'visitor-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone_number: '+254712345678',
  purpose_of_visit: 'Meeting',
  host_name: 'Jane Smith',
  check_in_time: '2024-01-01T09:00:00Z',
  check_out_time: null,
  status: 'checked_in',
  ...overrides
})

export const createMockInvitation = (overrides = {}) => ({
  id: 'invitation-123',
  visitor_email: 'guest@example.com',
  host_name: 'Host User',
  scheduled_date: '2024-01-02',
  scheduled_time: '10:00',
  purpose: 'Business Meeting',
  status: 'pending',
  access_code: 'ABC123',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
})

// Test utilities
export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  // Add custom render function with providers if needed
  const { render } = require('@testing-library/react')
  return render(ui, options)
}

export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved, screen } = require('@testing-library/react')
  
  try {
    await waitForElementToBeRemoved(
      () => screen.queryByText(/loading/i),
      { timeout: 3000 }
    )
  } catch (error) {
    // Loading element might not exist, which is fine
  }
}

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  const { axe } = require('@axe-core/react')
  const results = await axe(container)
  return results
}
