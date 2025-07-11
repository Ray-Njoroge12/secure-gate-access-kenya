
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";
import * as argon2 from "https://deno.land/x/argon2@v1.1.0/mod.ts";

const RS256_PUBLIC_KEY = Deno.env.get("RS256_PUBLIC_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { code } = await req.json();

    let accessCode;
    let verification_status = "failed";
    let audit_details: any = { code_provided: code };

    try {
      // Check if the code is a JWT (QR code)
      if (code.split(".").length === 3) {
        if (!RS256_PUBLIC_KEY) {
          throw new Error("RS256_PUBLIC_KEY is not set.");
        }
        const publicKey = await crypto.subtle.importKey(
          "spki",
          new TextEncoder().encode(RS256_PUBLIC_KEY.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '')),
          {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
          },
          false,
          ["verify"]
        );

        const { payload } = await jwtVerify(code, publicKey, {
          algorithms: ["RS256"],
        });

        // Check for replay attack using jti and fetch full details
        const { data: fetchedAccessCode, error: fetchError } = await supabase
          .from("access_codes")
          .select("*, visitors(*), residents(*, communities(*))")
          .eq("qr_token", code)
          .single();

        if (fetchError || !fetchedAccessCode) {
          throw new Error("QR code not found or invalid.");
        }

        if (fetchedAccessCode.used_at) {
          throw new Error("This QR code has already been used.");
        }

        if (new Date(fetchedAccessCode.expires_at) < new Date()) {
          throw new Error("This QR code has expired.");
        }

        accessCode = fetchedAccessCode;
        audit_details.type = "QR_CODE";
        audit_details.payload = payload;

      } else {
        // Assume the code is a PIN
        // Hash the provided PIN to compare with stored hashes
        let pin_hash_to_check;
        try {
          pin_hash_to_check = await argon2.hash(code); // Hash the input PIN
        } catch (hashError) {
          throw new Error(`Failed to hash PIN: ${hashError.message}`);
        }

        const { data: fetchedAccessCode, error: fetchError } = await supabase
          .from("access_codes")
          .select("*, visitors(*), residents(*, communities(*))")
          .eq("pin_hash", pin_hash_to_check) // Query directly by hashed PIN
          .single();

        if (fetchError || !fetchedAccessCode) {
          throw new Error("Invalid PIN.");
        }

        if (fetchedAccessCode.used_at) {
          throw new Error("This PIN has already been used.");
        }

        if (new Date(fetchedAccessCode.expires_at) < new Date()) {
          throw new Error("This PIN has expired.");
        }

        accessCode = fetchedAccessCode;
        audit_details.type = "PIN";
      }

      // Mark the access code as used
      const { error: updateError } = await supabase
        .from("access_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", accessCode.id);

      if (updateError) {
        throw updateError;
      }
      verification_status = "success";

    } finally {
      // Log access attempt
      const { error: auditError } = await supabase
        .from("audit_logs")
        .insert({
          event_type: "ACCESS_VERIFICATION",
          entity_id: accessCode?.id || null,
          entity_type: "access_code",
          user_id: null, // Guard ID would go here
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("client-ip"),
          user_agent: req.headers.get("user-agent"),
          details: { ...audit_details, status: verification_status },
        });

      if (auditError) {
        console.error("Error logging audit event:", auditError);
      }
    }

    // Decrypt visitor data
    const { data: decryptedData, error: decryptionError } = await supabase.functions.invoke(
      "decrypt-visitor-data",
      {
        body: {
          encryptedFullName: accessCode.visitors.full_name_encrypted,
          encryptedIdNumber: accessCode.visitors.id_number_encrypted,
          encryptedPhoneNumber: accessCode.visitors.phone_encrypted,
        },
      }
    );

    if (decryptionError) {
      throw decryptionError;
    }

    accessCode.visitors.full_name = decryptedData.decryptedFullName;
    accessCode.visitors.id_number = decryptedData.decryptedIdNumber;
    accessCode.visitors.phone_number = decryptedData.decryptedPhoneNumber;

    return new Response(JSON.stringify({ access_code: accessCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
