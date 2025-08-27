import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { LoginForm } from '../LoginForm'
import apiClient from '../../integrations/supabase/client'

// Mock the supabase client
vi.mock('../../integrations/supabase/client')

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <LoginForm />
    </BrowserRouter>
  )
}

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form component', () => {
    const { container } = renderLoginForm()
    expect(container).toBeTruthy()
  })

  it('renders with proper structure', () => {
    const { container, getByRole } = renderLoginForm()
    
    // Check for form elements - form exists in the DOM
    const form = container.querySelector('form')
    expect(form).toBeTruthy()
    
    // Check for heading
    const heading = getByRole('heading', { name: /resident login/i })
    expect(heading).toBeTruthy()
  })

  it('has email input field', () => {
    const { container } = renderLoginForm()
    const emailInput = container.querySelector('input[type="email"]')
    expect(emailInput).toBeTruthy()
  })

  it('has password input field', () => {
    const { container } = renderLoginForm()
    const passwordInput = container.querySelector('input[type="password"]')
    expect(passwordInput).toBeTruthy()
  })

  it('has submit button', () => {
    const { container } = renderLoginForm()
    const submitButton = container.querySelector('button[type="submit"]')
    expect(submitButton).toBeTruthy()
  })

  it('component mounts without crashing', () => {
    expect(() => renderLoginForm()).not.toThrow()
  })
})
