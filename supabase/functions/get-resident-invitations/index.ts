
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated.");
    }

    const { data: invitations, error } = await supabase
      .from("visit_invitations")
      .select(`
        *,
        visitors(full_name_encrypted, id_number_encrypted, phone_encrypted),
        access_codes(qr_token)
      `)
      .eq("resident_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const decryptedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        if (invitation.visitors && invitation.visitors.full_name_encrypted) {
          const { data: decryptedData, error: decryptionError } = await supabase.functions.invoke(
            "decrypt-visitor-data",
            {
              body: {
                encryptedFullName: invitation.visitors.full_name_encrypted,
                encryptedIdNumber: invitation.visitors.id_number_encrypted,
                encryptedPhoneNumber: invitation.visitors.phone_encrypted,
              },
            }
          );

          if (decryptionError) {
            console.error("Error decrypting visitor data:", decryptionError);
            return { ...invitation, visitors: { full_name: "Decryption Error" } };
          }

          return {
            ...invitation,
            visitors: {
              full_name: decryptedData.decryptedFullName,
              id_number: decryptedData.decryptedIdNumber,
              phone_number: decryptedData.decryptedPhoneNumber,
            },
          };
        }
        return invitation;
      })
    );

    return new Response(JSON.stringify(decryptedInvitations), {
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
