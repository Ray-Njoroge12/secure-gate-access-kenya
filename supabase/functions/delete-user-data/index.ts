import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_API_KEY || !FROM_EMAIL) return;
  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: "SecureGate Kenya" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const userId = user.id;

    let body: any = {};
    try { body = await req.json(); } catch {}

    // If admin, allow cancel for another user
    let targetUserId = userId;
    if (body.userId && body.userId !== userId) {
      // Check if requester is admin
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
      if (profile && profile.role === "admin") {
        targetUserId = body.userId;
      } else {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
      }
    }
    // Fetch user email from residents
    let userEmail = null;
    const { data: resident } = await supabase.from("residents").select("email").eq("id", targetUserId).single();
    if (resident && resident.email) userEmail = resident.email;

    if (body.cancel) {
      // Cancel deletion request
      await supabase.from("residents").update({ deletion_requested_at: null }).eq("id", targetUserId);
      await supabase.from("visitors").update({ deletion_requested_at: null }).eq("id", targetUserId);
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: userId === targetUserId ? "cancel_delete_user_data" : "admin_cancel_delete_user_data",
        entity_type: "user",
        entity_id: targetUserId,
        details: { message: userId === targetUserId ? "User canceled data deletion request" : `Admin canceled deletion request for user ${targetUserId}` },
      });
      // Send email notification
      if (userEmail) {
        await sendEmail(
          userEmail,
          "Account Deletion Request Canceled",
          `<p>Your account deletion request has been <b>canceled</b>. Your data will not be deleted.</p>`
        );
      }
      return new Response(JSON.stringify({ message: "Account deletion request canceled." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Soft-delete: set deletion_requested_at=NOW()
      await supabase.from("residents").update({ deletion_requested_at: new Date().toISOString() }).eq("id", targetUserId);
      await supabase.from("visitors").update({ deletion_requested_at: new Date().toISOString() }).eq("id", targetUserId);
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: userId === targetUserId ? "request_delete_user_data" : "admin_request_delete_user_data",
        entity_type: "user",
        entity_id: targetUserId,
        details: { message: userId === targetUserId ? "User requested data deletion (soft-delete)" : `Admin requested deletion for user ${targetUserId}` },
      });
      // Send email notification
      if (userEmail) {
        const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await sendEmail(
          userEmail,
          "Account Deletion Scheduled",
          `<p>Your account deletion request has been received. Your data is scheduled for deletion on <b>${deletionDate.toLocaleString()}</b>.<br>If you wish to cancel this request, please log in and cancel before this date.</p>`
        );
      }
      return new Response(JSON.stringify({ message: "User data deletion requested. Data will be deleted after the grace period." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});