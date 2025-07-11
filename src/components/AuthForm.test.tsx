import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthForm } from "./AuthForm";
import { supabase } from "@/integrations/supabase/client";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import { useToast } from "@/hooks/use-toast";

// Mock the useToast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      getUser: vi.fn(() => ({ data: { user: { id: "test-user-id" } }, error: null })),
    },
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign-in form by default", () => {
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /visitor management/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("switches to sign-up form when 'Sign Up' tab is clicked", async () => {
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole("tab", { name: /sign up/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /visitor management/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/unit number/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });
  });

  it("handles successful sign-in", async () => {
    (supabase.auth.signInWithPassword as vi.Mock).mockResolvedValueOnce({
      data: { user: { id: "test-user-id" } },
      error: null,
    });

    const { toast } = useToast();

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(toast).toHaveBeenCalledWith({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    });
  });

  it("handles failed sign-in", async () => {
    (supabase.auth.signInWithPassword as vi.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid credentials" },
    });

    const { toast } = useToast();

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "wrongpassword",
      });
      expect(toast).toHaveBeenCalledWith({
        title: "Sign in failed",
        description: "Invalid credentials",
        variant: "destructive",
      });
    });
  });

  it("handles successful sign-up", async () => {
    (supabase.auth.signUp as vi.Mock).mockResolvedValueOnce({
      data: { user: { id: "new-user-id", email: "new@example.com" } },
      error: null,
    });
    (supabase.functions.invoke as vi.Mock).mockResolvedValueOnce({
      data: { encryptedPhoneNumber: "encrypted-phone" },
      error: null,
    });
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    (supabase.from as vi.Mock).mockReturnValue({ insert: mockInsert });

    const { toast } = useToast();

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("tab", { name: /sign up/i }));

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: "fullName", value: "New User" },
    });
    fireEvent.change(screen.getByLabelText(/unit number/i), {
      target: { name: "unitNumber", value: "101" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: "password", value: "newpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "newpassword",
        options: {
          data: {
            full_name: "New User",
            unit_number: "101",
            phone: "", // Phone is not directly in form data for signup, but handled by encryption
          },
        },
      });
      expect(toast).toHaveBeenCalledWith({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "encrypt-pii",
        expect.any(Object)
      );
      expect(supabase.from).toHaveBeenCalledWith("residents");
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        id: "new-user-id",
        email: "new@example.com",
        unit_number: "101",
        phone_encrypted: "encrypted-phone",
      }));
    });
  });

  it("handles failed sign-up", async () => {
    (supabase.auth.signUp as vi.Mock).mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already exists" },
    });

    const { toast } = useToast();

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("tab", { name: /sign up/i }));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { name: "email", value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: "password", value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.any(Object));
      expect(toast).toHaveBeenCalledWith({
        title: "Sign up failed",
        description: "User already exists",
        variant: "destructive",
      });
    });
  });
});
