
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ENCRYPTION_KEY = Deno.env.get("APP_ENCRYPTION_KEY");

async function decrypt(encryptedData: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key is not set.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ENCRYPTION_KEY),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Convert Base64 string back to Uint8Array
  const binaryString = atob(encryptedData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);

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
    const { encryptedFullName, encryptedIdNumber, encryptedPhoneNumber } = await req.json();

    const [decryptedFullName, decryptedIdNumber, decryptedPhoneNumber] = await Promise.all([
      decrypt(encryptedFullName),
      decrypt(encryptedIdNumber),
      decrypt(encryptedPhoneNumber),
    ]);

    return new Response(
      JSON.stringify({
        decryptedFullName,
        decryptedIdNumber,
        decryptedPhoneNumber,
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
