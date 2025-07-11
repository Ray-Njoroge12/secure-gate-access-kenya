
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ENCRYPTION_KEY = Deno.env.get("APP_ENCRYPTION_KEY");

async function decrypt(encryptedData: Uint8Array): Promise<string> {
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
    const { encryptedEmail } = await req.json();

    const decryptedEmail = await decrypt(new Uint8Array(encryptedEmail));

    return new Response(
      JSON.stringify({
        decryptedEmail,
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
