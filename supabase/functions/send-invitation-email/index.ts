
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { visitor_email, invitation_token } = await req.json();

    if (!SENDGRID_API_KEY || !FROM_EMAIL) {
      throw new Error("Missing SendGrid configuration.");
    }

    const registration_url = `https://<YOUR_APP_URL>/visitor-registration?token=${invitation_token}`;

    const msg = {
      personalizations: [{ to: [{ email: visitor_email }] }],
      from: { email: FROM_EMAIL, name: "SecureGate Kenya" },
      subject: "Your Invitation to Visit",
      content: [
        {
          type: "text/html",
          value: `
            <p>Hello,</p>
            <p>You have been invited to visit our community.</p>
            <p>Please click the link below to complete your registration and receive your secure access code. This link will expire in 24 hours.</p>
            <p><a href="${registration_url}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Register Now</a></p>
            <p>If you cannot click the link, please copy and paste this URL into your browser:</p>
            <p>${registration_url}</p>
            <p>Thank you,<br>The SecureGate Team</p>
          `,
        },
      ],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(msg),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(JSON.stringify(errorBody));
    }

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
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
