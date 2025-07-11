import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ENCRYPTION_KEY = Deno.env.get("APP_ENCRYPTION_KEY");

async function decrypt(encryptedBase64Data: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key is not set.");
  }

  // Convert Base64 string to Uint8Array
  const encryptedData = new Uint8Array(atob(encryptedBase64Data).split('').map(char => char.charCodeAt(0)));

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ENCRYPTION_KEY),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const iv = encryptedData.slice(0, 12);
  const data = encryptedData.slice(12);

  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return new TextDecoder().decode(decryptedData);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { encryptedFullName, encryptedIdNumber, encryptedPhoneNumber, encryptedVisitorEmail } = await req.json();

    const decryptedFullName = encryptedFullName ? await decrypt(encryptedFullName) : undefined;
    const decryptedIdNumber = encryptedIdNumber ? await decrypt(encryptedIdNumber) : undefined;
    const decryptedPhoneNumber = encryptedPhoneNumber ? await decrypt(encryptedPhoneNumber) : undefined;
    const decryptedVisitorEmail = encryptedVisitorEmail ? await decrypt(encryptedVisitorEmail) : undefined;

    return new Response(
      JSON.stringify({
        decryptedFullName,
        decryptedIdNumber,
        decryptedPhoneNumber,
        decryptedVisitorEmail,
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