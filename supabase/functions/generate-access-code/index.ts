import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { SignJWT } from "https://deno.land/x/jose@v5.2.0/index.ts";
import * as argon2 from "https://deno.land/x/argon2@v1.1.0/mod.ts";

const RS256_PRIVATE_KEY = Deno.env.get("RS256_PRIVATE_KEY") ?? "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { visitor_id, resident_id, visitor_email } = await req.json();

    // Check for existing unused, unexpired access code for this visitor
    const { data: existingCode, error: existingError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("visitor_id", visitor_id)
      .eq("used_at", null)
      .gte("expires_at", new Date().toISOString())
      .single();

    if (existingError && existingError.code !== "PGRST116") { // PGRST116: No rows found
      throw existingError;
    }

    if (existingCode) {
      // If a valid code exists, resend the PIN to the visitor
      // (Assume the PIN is not stored, so inform the resident to request a new code if lost)
      return new Response(JSON.stringify({ access_code: existingCode, message: "A valid access code already exists for this visitor." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 1. Generate a cryptographically secure 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Hash the PIN using Argon2id
    const pin_hash = await argon2.hash(pin);

    // 3. Generate a signed JWT for the QR code (RS256)
    if (!RS256_PRIVATE_KEY) {
      throw new Error("RS256_PRIVATE_KEY is not set.");
    }

    // Assuming RS256_PRIVATE_KEY is a valid PKCS8 PEM string
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      new TextEncoder().encode(RS256_PRIVATE_KEY),
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    const qr_token = await new SignJWT({ visitor_id, resident_id })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setExpirationTime('24h') // 24 hours expiration
      .setJti(crypto.randomUUID()) // Unique JWT ID for replay protection
      .sign(privateKey);

    // 4. Store the hashed PIN and JWT in the access_codes table
    const { data: access_code, error } = await supabase
      .from("access_codes")
      .insert({
        visitor_id,
        resident_id,
        pin_hash,
        qr_token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 5. Send the PIN to the visitor via email
    const msg = {
      personalizations: [{ to: [{ email: visitor_email }] }],
      from: { email: FROM_EMAIL, name: "SecureGate Kenya" },
      subject: "Your Secure Access Code",
      content: [
        {
          type: "text/html",
          value: `
            <p>Hello,</p>
            <p>Thank you for registering. Here is your one-time access PIN:</p>
            <h2 style="font-size: 24px; letter-spacing: 2px; text-align: center;">${pin}</h2>
            <p>This PIN is valid for 24 hours and can only be used once.</p>
            <p>You will also receive a QR code separately.</p>
            <p>Thank you,<br>The SecureGate Team</p>
          `,
        },
      ],
    };

    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(msg),
    });

    return new Response(JSON.stringify({ access_code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});