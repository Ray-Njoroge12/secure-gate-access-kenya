import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";
import { jwtVerify, importSPKI } from "https://deno.land/x/jose@v5.2.0/index.ts";

const RS256_PUBLIC_KEY = Deno.env.get("RS256_PUBLIC_KEY") ?? "";
const ENCRYPTION_KEY = Deno.env.get("APP_ENCRYPTION_KEY") ?? "";

interface AuditDetails {
  code_provided: string;
  type?: string;
  payload?: Record<string, unknown>; // Define a more specific type if payload structure is known
  status?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { code, method, community_id } = await req.json();

    let accessCode;
    let verification_status = "failed";
    const audit_details: AuditDetails = { code_provided: code };
    const guard_id: string | null = null; // Placeholder for guard ID
    let effectiveCommunity: string | null = community_id ?? null;
    let resolvedMethod: 'qr' | 'pin' = 'pin';

    // In a real scenario, guard_id would be extracted from the request's authentication context (e.g., JWT)
    // For now, we'll assume it's null or passed in the request body for testing purposes if needed.
    // const authHeader = req.headers.get("Authorization");
    // if (authHeader && authHeader.startsWith("Bearer ")) {
    //   const token = authHeader.substring(7);
    //   // Decode JWT to get guard_id (sub claim)
    //   // This requires verifying the guard's JWT with their public key
    //   // For simplicity, assuming guard_id is available from auth.uid() if using Supabase Auth directly
    //   const { data: { user } } = await supabase.auth.getUser(token);
    //   if (user) {
    //     guard_id = user.id;
    //   }
    // }

    try {
      // Determine method if not provided
      const inferredIsQR = code && code.split(".").length === 3;
      resolvedMethod = (method === 'qr' || method === 'pin') ? method : (inferredIsQR ? 'qr' : 'pin');

      // QR flow
      if (resolvedMethod === 'qr') {
        if (!RS256_PUBLIC_KEY) {
          throw new Error("RS256_PUBLIC_KEY is not set.");
        }
        const publicKey = await importSPKI(RS256_PUBLIC_KEY, "RS256");

        const { payload } = await jwtVerify(code, publicKey, {
          algorithms: ["RS256"],
        });

        // Check for replay attack using jti and fetch full details
        effectiveCommunity = community_id ?? (payload as any)?.community_id ?? null;
        let query = supabase
          .from("access_codes")
          .select("*, visitors(*), residents(*, communities(*))")
          .eq("qr_token", code);
        if (effectiveCommunity) {
          query = query.eq('community_id', effectiveCommunity);
        }
        const { data: fetchedAccessCode, error: fetchError } = await query.single();

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
        // PIN flow
        const nowIso = new Date().toISOString();
        let pinQuery = supabase
          .from("access_codes")
          .select("*, visitors(*), residents(*, communities(*))")
          .is("used_at", null) // Only consider unused codes
          .gte("expires_at", nowIso); // Only consider unexpired codes
        if (community_id) {
          pinQuery = pinQuery.eq('community_id', community_id);
        }
        // Ensure effectiveCommunity is set for logging
        effectiveCommunity = community_id ?? null;
        const { data: candidates, error: fetchError } = await pinQuery;

        if (fetchError || !candidates || candidates.length === 0) {
          throw new Error("Invalid PIN or PIN not found.");
        }

        // Helper: compute SHA-256 hex of provided PIN
        const sha256Hex = async (value: string): Promise<string> => {
          const enc = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(value));
          const bytes = new Uint8Array(hashBuffer);
          return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
        };

        const pinSha = await sha256Hex(code);

        // Try to dynamically import argon2, but continue if unavailable
        let argon2Verify: ((hash: string, pwd: string | Uint8Array) => Promise<boolean>) | null = null;
        try {
          const mod = await import("https://deno.land/x/argon2@v0.30.2/mod.ts");
          if (mod && typeof mod.verify === "function") {
            argon2Verify = mod.verify as (h: string, p: string | Uint8Array) => Promise<boolean>;
          }
        } catch (_) {
          argon2Verify = null;
        }

        // Find matching hash within tenant-scoped candidates
        for (const candidate of candidates) {
          if (!candidate.pin_hash) continue;

          let matched = false;
          if (argon2Verify) {
            try {
              matched = await argon2Verify(candidate.pin_hash, code);
            } catch (_) {
              matched = false;
            }
          }

          // Fallback: plain SHA-256 comparison for test/backward-compat
          if (!matched && typeof candidate.pin_hash === "string") {
            if (candidate.pin_hash === pinSha) matched = true;
          }

          if (matched) {
            accessCode = candidate;
            break;
          }
        }
        if (!accessCode) {
          throw new Error("Invalid PIN.");
        }

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
      // Log access attempt (tenant-scoped)
      const logCommunityId = effectiveCommunity ?? accessCode?.community_id ?? null;
      if (logCommunityId) {
        const { error: auditError } = await supabase
          .from("access_logs")
          .insert({
            community_id: logCommunityId,
            access_code_id: accessCode?.id || null,
            guard_id,
            user_id: null,
            access_method: resolvedMethod,
            status: verification_status,
            notes: {
              ...audit_details,
              ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("client-ip"),
              ua: req.headers.get("user-agent"),
            },
          });

        if (auditError) {
          console.error("Error logging access_log event:", auditError);
        }
      } else {
        console.warn("Skipping access_logs insert due to missing community_id");
      }
    }

    // Decrypt visitor data via function, with local fallback
    let decryptedFullName: string | undefined;
    let decryptedIdNumber: string | undefined;
    let decryptedPhoneNumber: string | undefined;

    try {
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
      if (decryptionError) throw decryptionError;
      decryptedFullName = decryptedData.decryptedFullName;
      decryptedIdNumber = decryptedData.decryptedIdNumber;
      decryptedPhoneNumber = decryptedData.decryptedPhoneNumber;
    } catch (_) {
      // Local AES-GCM fallback if function invocation fails
      const decryptLocal = async (encryptedData: string): Promise<string> => {
        if (!ENCRYPTION_KEY) throw new Error("Encryption key is not set.");
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(ENCRYPTION_KEY),
          { name: "AES-GCM" },
          false,
          ["decrypt"]
        );
        // Expect Base64-encoded string (IV + data)
        const binaryString = atob(String(encryptedData));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const iv = bytes.slice(0, 12);
        const data = bytes.slice(12);
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
        return new TextDecoder().decode(decrypted);
      };

      try {
        decryptedFullName = await decryptLocal(accessCode.visitors.full_name_encrypted);
        decryptedIdNumber = await decryptLocal(accessCode.visitors.id_number_encrypted);
        decryptedPhoneNumber = await decryptLocal(accessCode.visitors.phone_encrypted);
      } catch (_) {
        // As last resort, populate placeholders to avoid leaking PII
        decryptedFullName = "Hidden";
        decryptedIdNumber = "Hidden";
        decryptedPhoneNumber = "Hidden";
      }
    }

    accessCode.visitors.full_name = decryptedFullName;
    accessCode.visitors.id_number = decryptedIdNumber;
    accessCode.visitors.phone_number = decryptedPhoneNumber;

    return new Response(JSON.stringify({ access_code: accessCode, valid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, valid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});