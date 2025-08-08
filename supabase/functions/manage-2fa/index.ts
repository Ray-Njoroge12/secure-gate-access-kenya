import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// TOTP library for generating secrets and verifying codes
import { TOTP } from "https://deno.land/x/otpauth@v9.0.2/dist/otpauth.esm.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const encryptionKey = Deno.env.get("APP_ENCRYPTION_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Encryption utilities
async function encrypt(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(encryptionKey),
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

  return btoa(String.fromCharCode(...result));
}

async function decrypt(encryptedBase64Data: string): Promise<string> {
  const encryptedData = new Uint8Array(
    atob(encryptedBase64Data).split('').map(char => char.charCodeAt(0))
  );

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(encryptionKey),
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

// Generate secure backup codes
function generateBackupCodes(count = 10): string[] {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, token, code, userId } = await req.json();
    
    // Verify JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const userIp = req.headers.get("x-forwarded-for") || 
                   req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    switch (action) {
      case "setup": {
        // Check rate limiting
        const { data: rateLimitOk } = await supabase
          .rpc("check_2fa_rate_limit", { 
            user_uuid: user.id, 
            attempt_type_param: "setup" 
          });

        if (!rateLimitOk) {
          throw new Error("Too many setup attempts. Please try again later.");
        }

        // Generate TOTP secret
        const totp = new TOTP({
          issuer: "SecureGate Kenya",
          label: user.email,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
        });

        const secret = totp.secret.base32;
        const backupCodes = generateBackupCodes();

        // Encrypt secret and backup codes
        const encryptedSecret = await encrypt(secret);
        const encryptedBackupCodes = await Promise.all(
          backupCodes.map(code => encrypt(code))
        );

        // Store in database (not enabled yet)
        const { error: dbError } = await supabase
          .from("user_2fa_settings")
          .upsert({
            user_id: user.id,
            secret_key_encrypted: encryptedSecret,
            backup_codes_encrypted: encryptedBackupCodes,
            enabled: false, // Will be enabled after verification
          });

        if (dbError) throw dbError;

        // Generate QR code URL
        const otpUrl = totp.toString();

        return new Response(
          JSON.stringify({
            qrCodeUrl: otpUrl,
            secret: secret,
            backupCodes: backupCodes, // Return for user to save
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "enable": {
        if (!code) {
          throw new Error("Verification code is required");
        }

        // Get user's 2FA settings
        const { data: settings, error: settingsError } = await supabase
          .from("user_2fa_settings")
          .select("secret_key_encrypted")
          .eq("user_id", user.id)
          .single();

        if (settingsError || !settings) {
          throw new Error("2FA setup not found. Please start setup again.");
        }

        // Decrypt secret
        const secret = await decrypt(settings.secret_key_encrypted);

        // Verify TOTP code
        const totp = new TOTP({
          secret: secret,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
        });

        const isValid = totp.validate({ token: code, window: 1 }) !== null;

        // Log attempt
        await supabase.rpc("log_2fa_attempt", {
          user_uuid: user.id,
          attempt_type_param: "setup",
          success_param: isValid,
          ip_param: userIp,
          user_agent_param: userAgent,
        });

        if (!isValid) {
          throw new Error("Invalid verification code");
        }

        // Enable 2FA
        const { error: enableError } = await supabase
          .from("user_2fa_settings")
          .update({ 
            enabled: true, 
            setup_completed_at: new Date().toISOString(),
            last_used_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        if (enableError) throw enableError;

        return new Response(
          JSON.stringify({ message: "2FA enabled successfully" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "verify": {
        if (!code) {
          throw new Error("Verification code is required");
        }

        // Check rate limiting
        const { data: rateLimitOk } = await supabase
          .rpc("check_2fa_rate_limit", { 
            user_uuid: user.id, 
            attempt_type_param: "login" 
          });

        if (!rateLimitOk) {
          throw new Error("Too many verification attempts. Please try again later.");
        }

        // Get user's 2FA settings
        const { data: settings, error: settingsError } = await supabase
          .from("user_2fa_settings")
          .select("secret_key_encrypted, backup_codes_encrypted")
          .eq("user_id", user.id)
          .eq("enabled", true)
          .single();

        if (settingsError || !settings) {
          throw new Error("2FA not enabled for this account");
        }

        let isValid = false;
        let isBackupCode = false;

        // First try TOTP verification
        const secret = await decrypt(settings.secret_key_encrypted);
        const totp = new TOTP({
          secret: secret,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
        });

        isValid = totp.validate({ token: code, window: 1 }) !== null;

        // If TOTP fails, try backup codes
        if (!isValid && settings.backup_codes_encrypted) {
          const backupCodes = await Promise.all(
            settings.backup_codes_encrypted.map(encryptedCode => decrypt(encryptedCode))
          );

          const codeIndex = backupCodes.findIndex(backupCode => backupCode === code.toUpperCase());
          
          if (codeIndex !== -1) {
            isValid = true;
            isBackupCode = true;

            // Remove used backup code
            const updatedBackupCodes = backupCodes.filter((_, index) => index !== codeIndex);
            const encryptedUpdatedCodes = await Promise.all(
              updatedBackupCodes.map(code => encrypt(code))
            );

            await supabase
              .from("user_2fa_settings")
              .update({ backup_codes_encrypted: encryptedUpdatedCodes })
              .eq("user_id", user.id);
          }
        }

        // Log attempt
        await supabase.rpc("log_2fa_attempt", {
          user_uuid: user.id,
          attempt_type_param: isBackupCode ? "backup" : "login",
          success_param: isValid,
          ip_param: userIp,
          user_agent_param: userAgent,
        });

        if (!isValid) {
          throw new Error("Invalid verification code");
        }

        // Update last used timestamp
        await supabase
          .from("user_2fa_settings")
          .update({ last_used_at: new Date().toISOString() })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ 
            message: "2FA verification successful",
            usedBackupCode: isBackupCode
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      case "disable": {
        if (!code) {
          throw new Error("Verification code is required");
        }

        // Verify current code before disabling
        const { data: settings, error: settingsError } = await supabase
          .from("user_2fa_settings")
          .select("secret_key_encrypted")
          .eq("user_id", user.id)
          .eq("enabled", true)
          .single();

        if (settingsError || !settings) {
          throw new Error("2FA not enabled for this account");
        }

        const secret = await decrypt(settings.secret_key_encrypted);
        const totp = new TOTP({
          secret: secret,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
        });

        const isValid = totp.validate({ token: code, window: 1 }) !== null;

        if (!isValid) {
          throw new Error("Invalid verification code");
        }

        // Disable 2FA
        const { error: disableError } = await supabase
          .from("user_2fa_settings")
          .update({ enabled: false })
          .eq("user_id", user.id);

        if (disableError) throw disableError;

        return new Response(
          JSON.stringify({ message: "2FA disabled successfully" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("2FA operation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});