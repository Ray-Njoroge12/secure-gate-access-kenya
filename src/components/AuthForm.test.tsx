import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AuthForm } from './AuthForm';
import { BrowserRouter } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from './ProtectedRoute';

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

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

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
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'new@example.com' } },
      error: null,
    });
    mockInvoke.mockResolvedValueOnce({
      data: { encryptedPhoneNumber: 'encrypted-phone' },
      error: null,
    });
    mockInsert.mockResolvedValueOnce({ data: null, error: null });

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    // Always click the Sign Up tab before querying fields
    const signUpTab = await screen.findByRole('tab', { name: /Sign Up/i });
    fireEvent.click(signUpTab);
    // Wait for the sign-up tabpanel to be visible
    const signUpPanel = await screen.findByTestId('signup-tab-content');
    // Query inputs within the visible tabpanel only
    const fullNameInput = within(signUpPanel).getByPlaceholderText('Enter your full name');
    const unitNumberInput = within(signUpPanel).getByPlaceholderText('e.g., 15B, 302, etc.');
    const emailInput = within(signUpPanel).getByPlaceholderText('Enter your email');
    const passwordInput = within(signUpPanel).getByPlaceholderText('Create a password');

    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(unitNumberInput, { target: { value: '101' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    fireEvent.click(within(signUpPanel).getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword',
        options: {
          data: {
            full_name: 'John Doe',
            unit_number: '101',
            phone: '', // phone is empty in formData initially
          },
        },
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
      expect(mockInvoke).toHaveBeenCalledWith('encrypt-pii', {
        body: { phoneNumber: '' },
      });
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'new@example.example.com',
        unit_number: '101',
        phone_encrypted: 'encrypted-phone',
        community_id: 'default-community-id',
      });
    });
  }, 10000);

  test('handles failed sign up', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'User already exists' },
    });

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    // Always click the Sign Up tab before querying fields
    const signUpTab = await screen.findByRole('tab', { name: /Sign Up/i });
    fireEvent.click(signUpTab);
    // Wait for the sign-up tabpanel to be visible
    const signUpPanel = await screen.findByTestId('signup-tab-content');
    // Query inputs within the visible tabpanel only
    const fullNameInput = within(signUpPanel).getByPlaceholderText('Enter your full name');
    const unitNumberInput = within(signUpPanel).getByPlaceholderText('e.g., 15B, 302, etc.');
    const emailInput = within(signUpPanel).getByPlaceholderText('Enter your email');
    const passwordInput = within(signUpPanel).getByPlaceholderText('Create a password');

    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(unitNumberInput, { target: { value: '101' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    fireEvent.click(within(signUpPanel).getByRole('button', { name: /Create Account/i }));

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

describe('ProtectedRoute', () => {
  it('redirects to /login if not authenticated', async () => {
    // Mock no session
    supabase.auth.getSession = vi.fn().mockResolvedValue({ data: { session: null } });
    render(
      <BrowserRouter>
        <ProtectedRoute requiredRole="admin"><div>Admin Content</div></ProtectedRoute>
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('redirects to /unauthorized if role does not match', async () => {
    // Mock session and wrong role
    supabase.auth.getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    supabase.from = vi.fn(() => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'resident' }, error: null }) }) }) }));
    render(
      <BrowserRouter>
        <ProtectedRoute requiredRole="admin"><div>Admin Content</div></ProtectedRoute>
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  it('renders children if role matches', async () => {
    // Mock session and correct role
    supabase.auth.getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-2' } } } });
    supabase.from = vi.fn(() => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'admin' }, error: null }) }) }) }));
    render(
      <BrowserRouter>
        <ProtectedRoute requiredRole="admin"><div>Admin Content</div></ProtectedRoute>
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });
});
