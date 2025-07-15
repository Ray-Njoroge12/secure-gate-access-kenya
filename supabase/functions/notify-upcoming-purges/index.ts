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
  const retention_days = 30;
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days before deletion

  // Find regular visitors (more than 1 visit) whose data will be deleted in 3 days
  const { data: regulars } = await supabase.rpc("find_regular_visitors_for_purge", { notify_date: soon.toISOString() });
  for (const v of regulars || []) {
    await sendEmail([v.email], "Upcoming Data Deletion", `<p>Your visitor data will be deleted in 3 days due to privacy policy.</p>`);
    await supabase.from("audit_logs").insert({
      event_type: "visitor_purge_notification",
      payload: { email: v.email, timestamp: new Date().toISOString() },
      created_at: new Date().toISOString(),
    });
  }

  // Find residents with scheduled deletion in 3 days
  const { data: residents } = await supabase.from("residents").select("email, deletion_requested_at").not("deletion_requested_at", "is", null);
  for (const r of residents || []) {
    const delDate = new Date(r.deletion_requested_at);
    if (delDate.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime() < 3 * 24 * 60 * 60 * 1000) {
      await sendEmail([r.email], "Upcoming Account Deletion", `<p>Your account is scheduled for deletion in 3 days.</p>`);
      await supabase.from("audit_logs").insert({
        event_type: "resident_purge_notification",
        payload: { email: r.email, timestamp: new Date().toISOString() },
        created_at: new Date().toISOString(),
      });
    }
  }

  // Notify admin of all upcoming purges
  const { data: admins } = await supabase.from("profiles").select("email").eq("role", "admin");
  const adminEmails = admins?.map(a => a.email).filter(Boolean) || [];
  await sendEmail(adminEmails, "Upcoming Data Purges", `<p>Upcoming data purges for residents and regular visitors in 3 days.</p>`);
  await supabase.from("audit_logs").insert({
    event_type: "admin_purge_notification",
    payload: { count_regulars: (regulars || []).length, count_residents: (residents || []).length, timestamp: new Date().toISOString() },
    created_at: new Date().toISOString(),
  });

  return new Response("Notifications sent.");
});