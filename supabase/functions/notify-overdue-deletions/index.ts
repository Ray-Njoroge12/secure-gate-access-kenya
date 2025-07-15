import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

async function sendEmail(to: string[], subject: string, html: string) {
  if (!SENDGRID_API_KEY || !FROM_EMAIL) return;
  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: to.map(email => ({ email })) }],
      from: { email: FROM_EMAIL },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
}

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Find overdue deletions
  const { data: overdue } = await supabase.rpc("find_overdue_deletions");
  if (!overdue || overdue.length === 0) {
    return new Response("No overdue deletions.");
  }

  // Fetch admin emails
  const { data: admins } = await supabase.from("profiles").select("email").eq("role", "admin");
  const adminEmails = admins?.map(a => a.email).filter(Boolean) || [];

  // Compose email
  const html = `<h2>Overdue Deletions Alert</h2><p>The following users have overdue deletion requests:</p><ul>${overdue.map(u => `<li>${u.email} (requested: ${u.deletion_requested_at})</li>`).join("")}</ul>`;
  await sendEmail(adminEmails, "Overdue Deletions Alert", html);

  // Log notification
  await supabase.from("audit_logs").insert({
    event_type: "overdue_deletion_notification",
    payload: { count: overdue.length, emails: adminEmails, timestamp: new Date().toISOString() },
    created_at: new Date().toISOString(),
  });

  return new Response("Notification sent.");
});