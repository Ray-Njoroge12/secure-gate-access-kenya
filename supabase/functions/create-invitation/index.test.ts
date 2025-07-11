import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client and Deno environment variables
const mockFunctionsInvoke = vi.fn((functionName, options) => {
  if (functionName === "encrypt-pii") {
    return Promise.resolve({ data: { encryptedFullName: "encrypted_full_name", encryptedPhoneNumber: "encrypted_phone_number", encryptedVisitorEmail: "encrypted_email" } });
  }
  if (functionName === "send-invitation-email") {
    return Promise.resolve({ data: { success: true } });
  }
  return Promise.resolve({ data: {} });
});

const mockFromInsertSelect = vi.fn(() => Promise.resolve({ data: [{ id: "test-invitation-id" }], error: null }));
const mockFromInsert = vi.fn(() => ({
  select: mockFromInsertSelect,
}));
const mockFrom = vi.fn(() => ({
  insert: mockFromInsert,
}));

const mockSupabaseClient = vi.fn(() => ({
  functions: {
    invoke: mockFunctionsInvoke,
  },
  from: mockFrom,
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "test-resident-id" } } }))
  }
}));

vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: mockSupabaseClient,
}));

const mockDenoEnv = {
  get: vi.fn((key) => {
    if (key === "SUPABASE_URL") return "mock_supabase_url";
    if (key === "SUPABASE_ANON_KEY") return "mock_supabase_anon_key";
    if (key === "SUPABASE_SERVICE_ROLE_KEY") return "mock_supabase_service_role_key";
    return undefined;
  }),
};

// Mock the serve function from Deno
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: vi.fn(), // No need to return handler here, we'll call it directly
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'mock-uuid'),
});

// Import the actual handler function from handler.ts
import { handleCreateInvitationRequest, resetRateLimiter, lastRequestMap } from './handler.ts';

describe('create-invitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter(); // Reset rate limiter before each test
    // Reset mocks for each test
    mockFunctionsInvoke.mockClear();
    mockFromInsertSelect.mockClear();
    mockFromInsert.mockClear();
    mockFrom.mockClear();
    mockSupabaseClient.mockClear();
    mockDenoEnv.get.mockClear();
  });

  it('should create an invitation and send an email', async () => {
    const mockRequest = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer mock-token" },
      body: JSON.stringify({
        resident_id: "test-resident-id",
        visitor_full_name: "John Doe",
        visitor_email: "john.doe@example.com",
        visitor_phone_number: "+1234567890",
        visit_date: "2025-12-25",
      }),
    });

    const response = await handleCreateInvitationRequest(mockRequest, mockSupabaseClient(), mockDenoEnv);
    const responseBody = await response.json();

    expect(response.status).toBe(201);
    expect(responseBody.invitation).toBeDefined();
    expect(mockSupabaseClient).toHaveBeenCalled();
    expect(mockFunctionsInvoke).toHaveBeenCalledWith("encrypt-pii", expect.any(Object));
    expect(mockFunctionsInvoke).toHaveBeenCalledWith("send-invitation-email", expect.any(Object));
    expect(mockFrom).toHaveBeenCalledWith("visit_invitations");
    expect(mockFromInsert).toHaveBeenCalled();
    expect(mockFromInsertSelect).toHaveBeenCalled();
    expect(mockFromInsert).toHaveBeenCalledWith(expect.objectContaining({
      resident_id: "test-resident-id",
      visitor_full_name_encrypted: "encrypted_full_name",
    }));
  });

  it('should return 429 for too many requests', async () => {
    const residentId = "test-resident-id";
    const now = Date.now();
    lastRequestMap.set(residentId, now - 1000); // Set last request to 1 second ago

    const mockRequest = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer mock-token" },
      body: JSON.stringify({
        resident_id: residentId,
        visitor_full_name: "John Doe",
        visitor_email: "john.doe@example.com",
        visitor_phone_number: "+1234567890",
        visit_date: "2025-12-25",
      }),
    });

    const response = await handleCreateInvitationRequest(mockRequest, mockSupabaseClient(), mockDenoEnv);
    const responseBody = await response.json();

    expect(response.status).toBe(429);
    expect(responseBody.error).toBe("Too many requests. Please try again later.");
  });

  it('should handle encryption errors', async () => {
    mockFunctionsInvoke.mockImplementationOnce((functionName, options) => {
      if (functionName === "encrypt-pii") {
        return Promise.resolve({ data: null, error: new Error("Encryption failed") });
      }
      return Promise.resolve({ data: {} });
    });

    const mockRequest = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer mock-token" },
      body: JSON.stringify({
        resident_id: "test-resident-id",
        visitor_full_name: "John Doe",
        visitor_email: "john.doe@example.com",
        visitor_phone_number: "+1234567890",
        visit_date: "2025-12-25",
      }),
    });

    const response = await handleCreateInvitationRequest(mockRequest, mockSupabaseClient(), mockDenoEnv);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toBe("Encryption failed");
  });
});