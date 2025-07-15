import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { handler } from "./index.ts";

Deno.env.set("SUPABASE_URL", "https://your-project.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
Deno.env.set("RS256_PRIVATE_KEY", "dummy-private-key");
Deno.env.set("SENDGRID_API_KEY", "dummy");
Deno.env.set("FROM_EMAIL", "test@example.com");

const originalFetch = globalThis.fetch;

function mockFetch(scenario: "new" | "duplicate") {
  globalThis.fetch = async (input, init) => {
    // Mock Supabase access_codes lookup
    if (typeof input === "string" && input.includes("/access_codes")) {
      if (scenario === "duplicate") {
        return new Response(JSON.stringify({
          data: {
            id: "code-1",
            used_at: null,
            expires_at: new Date(Date.now() + 10000).toISOString(),
            pin_hash: "$argon2id$v=19$m=4096,t=3,p=1$...",
            qr_token: "valid.jwt.token"
          },
          error: null
        }), { status: 200 });
      }
      // For "new", simulate no existing code
      return new Response(JSON.stringify({ data: null, error: { code: "PGRST116" } }), { status: 200 });
    }
    // Mock Supabase insert
    if (typeof input === "string" && input.includes("insert")) {
      return new Response(JSON.stringify({ data: { id: "code-2" }, error: null }), { status: 200 });
    }
    // Mock SendGrid
    if (typeof input === "string" && input.includes("sendgrid.com")) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  };
}

Deno.test("should create a new access code if none exists", async () => {
  mockFetch("new");
  const body = {
    visitor_id: "test-visitor",
    resident_id: "test-resident",
    visitor_email: "visitor@example.com"
  };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
  const resp = await handler(req);
  assertEquals(resp.status, 201);
  const data = await resp.json();
  assertEquals(data.access_code.id, "code-2");
});

Deno.test("should return the existing code if one is already valid", async () => {
  mockFetch("duplicate");
  const body = {
    visitor_id: "test-visitor",
    resident_id: "test-resident",
    visitor_email: "visitor@example.com"
  };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
  const resp = await handler(req);
  assertEquals(resp.status, 200);
  const data = await resp.json();
  assertEquals(data.access_code.id, "code-1");
  assertEquals(data.message, "A valid access code already exists for this visitor.");
});

Deno.test({
  name: "cleanup",
  fn() {
    globalThis.fetch = originalFetch;
  },
  sanitizeResources: false,
  sanitizeOps: false,
});