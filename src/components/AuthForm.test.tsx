import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthForm } from './AuthForm';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

// Mock useNavigate
const mockedUseNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as object,
    useNavigate: () => mockedUseNavigate,
  };
});

// Mock the API client
vi.mock('@/lib/apiClient', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders sign in and sign up tabs', () => {
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );
    expect(screen.getByRole('tab', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('allows typing in sign in form fields', () => {
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i, { selector: '#signin-password' }), { target: { value: 'password123' } });

    expect(screen.getByLabelText(/Email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/Password/i, { selector: '#signin-password' })).toHaveValue('password123');
  });

  test('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );
    const passwordInput = screen.getByLabelText(/Password/i, { selector: '#signin-password' });
    const toggleButton = screen.getByLabelText(/toggle password visibility/i);

    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('switches between sign in and sign up tabs', () => {
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    // Start on sign in tab
    expect(screen.getByRole('tab', { name: /Sign In/i })).toHaveAttribute('aria-selected', 'true');

    // Switch to sign up tab
    fireEvent.click(screen.getByRole('tab', { name: /Sign Up/i }));
    expect(screen.getByRole('tab', { name: /Sign Up/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Sign In/i })).toHaveAttribute('aria-selected', 'false');
  });

  test('renders sign up form fields when sign up tab is active', () => {
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('tab', { name: /Sign Up/i }));

    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 15B, 302, etc.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
  });
});
