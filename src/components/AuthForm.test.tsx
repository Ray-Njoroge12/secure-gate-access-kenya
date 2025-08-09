import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AuthForm } from './AuthForm';
import { BrowserRouter } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase functions
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockInvoke = vi.fn();
const mockInsert = vi.fn();

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
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

describe('AuthForm', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as vi.Mock).mockReturnValue({ toast: mockToast });
    supabase.auth.signInWithPassword = mockSignInWithPassword;
    supabase.auth.signUp = mockSignUp;
    supabase.functions.invoke = mockInvoke;
    supabase.from = vi.fn(() => ({
      insert: mockInsert,
    }));
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

  test('handles successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: '123' } },
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i, { selector: '#signin-password' }), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Welcome back!',
        description: 'You have been signed in successfully.',
      });
      expect(mockedUseNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles failed sign in', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: new Error('Invalid credentials'),
    });

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i, { selector: '#signin-password' }), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sign in failed',
        description: 'Invalid credentials',
        variant: 'destructive',
      });
      expect(mockedUseNavigate).not.toHaveBeenCalled();
    });
  });

  test('handles successful sign up', async () => {
    // Mock the community query
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'community-123' },
          error: null
        })
      })
    });
    
    const mockFromCommunities = vi.fn().mockReturnValue({
      select: mockSelect
    });
    
    const mockFromResidents = vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null })
    });
    
    // Setup supabase mocks
    supabase.from = vi.fn().mockImplementation((table) => {
      if (table === 'communities') return mockFromCommunities();
      if (table === 'residents') return mockFromResidents();
      return { insert: vi.fn() };
    });
    
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'new@example.com' } },
      error: null,
    });
    mockInvoke.mockResolvedValueOnce({
      data: { encryptedPhoneNumber: 'encrypted-phone' },
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    const signUpTab = screen.getByRole('tab', { name: /Sign Up/i });
    fireEvent.click(signUpTab);
    
    // Wait for the tab content to be visible
    await waitFor(() => {
      expect(signUpTab).toHaveAttribute('aria-selected', 'true');
    });
    
    const signUpTabContent = screen.getByTestId('signup-tab-content');
    const fullNameInput = within(signUpTabContent).getByPlaceholderText('Enter your full name');
    const unitNumberInput = within(signUpTabContent).getByPlaceholderText('e.g., 15B, 302, etc.');
    const phoneInput = within(signUpTabContent).getByPlaceholderText('Enter your phone number');
    const emailInput = within(signUpTabContent).getByPlaceholderText('Enter your email');
    const passwordInput = within(signUpTabContent).getByPlaceholderText('Create a password');
    const createAccountButton = within(signUpTabContent).getByRole('button', { name: /Create Account/i });

    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(unitNumberInput, { target: { value: '101' } });
    fireEvent.change(phoneInput, { target: { value: '+254700123456' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: 'John Doe',
            unit_number: '101',
            phone: '+254700123456',
          },
        },
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
    });
  }, 10000);

  test('handles failed sign up', async () => {
    const mockError = new Error('User already exists');
    mockSignUp.mockRejectedValueOnce(mockError);

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    const signUpTab = screen.getByRole('tab', { name: /Sign Up/i });
    fireEvent.click(signUpTab);
    
    // Wait for the tab content to be visible
    await waitFor(() => {
      expect(signUpTab).toHaveAttribute('aria-selected', 'true');
    });
    
    const signUpTabContent = screen.getByTestId('signup-tab-content');
    const fullNameInput = within(signUpTabContent).getByPlaceholderText('Enter your full name');
    const unitNumberInput = within(signUpTabContent).getByPlaceholderText('e.g., 15B, 302, etc.');
    const phoneInput = within(signUpTabContent).getByPlaceholderText('Enter your phone number');
    const emailInput = within(signUpTabContent).getByPlaceholderText('Enter your email');
    const passwordInput = within(signUpTabContent).getByPlaceholderText('Create a password');
    const createAccountButton = within(signUpTabContent).getByRole('button', { name: /Create Account/i });

    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(unitNumberInput, { target: { value: '101' } });
    fireEvent.change(phoneInput, { target: { value: '+254700123456' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(expect.any(Object));
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Sign up failed',
        description: 'User already exists',
        variant: 'destructive',
      });
      expect(mockedUseNavigate).not.toHaveBeenCalled();
    });
  }, 10000);
});
