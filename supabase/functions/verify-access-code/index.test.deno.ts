import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { handler } from "./index.ts";

Deno.env.set("SUPABASE_URL", "https://your-project.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
Deno.env.set("RS256_PUBLIC_KEY", "dummy-public-key");

const originalFetch = globalThis.fetch;

function mockFetch(scenario: "valid" | "used" | "expired" | "notfound" | "decryptError") {
  globalThis.fetch = async (input, init) => {
    // Mock Supabase access_codes lookup
    if (typeof input === "string" && input.includes("/access_codes")) {
      if (scenario === "valid") {
        return new Response(JSON.stringify({
          data: {
            id: "code-1",
            used_at: null,
            expires_at: new Date(Date.now() + 10000).toISOString(),
            pin_hash: "$argon2id$v=19$m=4096,t=3,p=1$...",
            qr_token: "valid.jwt.token",
            visitors: {
              full_name_encrypted: "encrypted",
              id_number_encrypted: "encrypted",
              phone_encrypted: "encrypted"
            }
          },
          error: null
        }), { status: 200 });
      }
      if (scenario === "used") {
        return new Response(JSON.stringify({
          data: { id: "code-1", used_at: new Date().toISOString(), expires_at: new Date(Date.now() + 10000).toISOString() },
          error: null
        }), { status: 200 });
      }
      if (scenario === "expired") {
        return new Response(JSON.stringify({
          data: { id: "code-1", used_at: null, expires_at: new Date(Date.now() - 10000).toISOString() },
          error: null
        }), { status: 200 });
      }
      if (scenario === "notfound") {
        return new Response(JSON.stringify({ data: null, error: { message: "Not found" } }), { status: 200 });
      }
    }
    // Mock decryption function
    if (typeof input === "string" && input.includes("/decrypt-visitor-data")) {
      if (scenario === "decryptError") {
        return new Response(JSON.stringify({ error: "Decryption failed" }), { status: 400 });
      }
      return new Response(JSON.stringify({
        decryptedFullName: "John Doe",
        decryptedIdNumber: "12345678",
        decryptedPhoneNumber: "+254700000000"
      }), { status: 200 });
    }
    // Default
    return new Response(JSON.stringify({}), { status: 200 });
  };
}

Deno.test("should return 200 and visitor info for valid code", async () => {
  mockFetch("valid");
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ code: "valid.jwt.token" }),
    headers: { "Content-Type": "application/json" }
  });
  const resp = await handler(req);
  assertEquals(resp.status, 200);
  const body = await resp.json();
  assertEquals(body.access_code.visitors.full_name, "John Doe");
});

Deno.test("should return 400 for used code", async () => {
  mockFetch("used");
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ code: "valid.jwt.token" }),
    headers: { "Content-Type": "application/json" }
  });
  const resp = await handler(req);
  assertEquals(resp.status, 400);
  const body = await resp.json();
  // Should mention already used
  console.log(body);
});

Deno.test("should return 400 for expired code", async () => {
  mockFetch("expired");
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ code: "valid.jwt.token" }),
    headers: { "Content-Type": "application/json" }
  });
  const resp = await handler(req);
  assertEquals(resp.status, 400);
  const body = await resp.json();
  // Should mention expired
  console.log(body);
});

Deno.test("should return 400 for not found code", async () => {
  mockFetch("notfound");
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ code: "invalid.jwt.token" }),
    headers: { "Content-Type": "application/json" }
  });
  const resp = await handler(req);
  assertEquals(resp.status, 400);
  const body = await resp.json();
  // Should mention not found
  console.log(body);
});

Deno.test("should return 400 for decryption error", async () => {
  mockFetch("decryptError");
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ code: "valid.jwt.token" }),
    headers: { "Content-Type": "application/json" }
  });
  const resp = await handler(req);
  assertEquals(resp.status, 400);
  const body = await resp.json();
  // Should mention decryption error
  console.log(body);
});

Deno.test({
  name: "cleanup",
  fn() {
    globalThis.fetch = originalFetch;
  },
  sanitizeResources: false,
  sanitizeOps: false,
});