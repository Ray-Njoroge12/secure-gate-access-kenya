
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// This is a placeholder for a real key management service (e.g., AWS KMS, Azure Key Vault)
const ENCRYPTION_KEY = Deno.env.get("APP_ENCRYPTION_KEY");

async function encrypt(data: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key is not set.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ENCRYPTION_KEY),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);

  // Convert Uint8Array to Base64 string
  return btoa(String.fromCharCode(...result));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fullName, idNumber, phoneNumber, visitorEmail } = await req.json();

    const encryptedFullName = fullName ? await encrypt(fullName) : undefined;
    const encryptedIdNumber = idNumber ? await encrypt(idNumber) : undefined;
    const encryptedPhoneNumber = phoneNumber ? await encrypt(phoneNumber) : undefined;
    const encryptedVisitorEmail = visitorEmail ? await encrypt(visitorEmail) : undefined;

    return new Response(
      JSON.stringify({
        encryptedFullName,
        encryptedIdNumber,
        encryptedPhoneNumber,
        encryptedVisitorEmail,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
