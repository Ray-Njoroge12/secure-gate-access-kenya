import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  visitorName: string;
  visitorEmail: string;
  residentName: string;
  residentUnit: string;
  visitDate: string;
  visitPurpose: string;
  invitationToken: string;
  registrationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      visitorName,
      visitorEmail,
      residentName,
      residentUnit,
      visitDate,
      visitPurpose,
      invitationToken,
      registrationUrl
    }: InvitationEmailRequest = await req.json();

    const formattedDate = new Date(visitDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailResponse = await resend.emails.send({
      from: "Visitor Management <invitations@resend.dev>",
      to: [visitorEmail],
      subject: `Invitation to Visit ${residentName} - ${residentUnit}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🏢 Visit Invitation</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Hello ${visitorName}!</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You have been invited to visit <strong>${residentName}</strong> at <strong>Unit ${residentUnit}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Visit Details</h3>
              <p><strong>Date & Time:</strong> ${formattedDate}</p>
              <p><strong>Purpose:</strong> ${visitPurpose}</p>
              <p><strong>Invitation Code:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${invitationToken}</code></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registrationUrl}?token=${invitationToken}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Complete Your Registration
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #856404;">📋 What You Need to Bring:</h4>
              <ul style="margin-bottom: 0;">
                <li>Valid government-issued ID</li>
                <li>Your phone to show the QR code</li>
                <li>This invitation email</li>
              </ul>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #0c5460;">📱 Next Steps:</h4>
              <ol style="margin-bottom: 0;">
                <li>Click the registration link above</li>
                <li>Fill in your details and upload your ID photo</li>
                <li>Receive your QR code for gate access</li>
                <li>Show your QR code to security when you arrive</li>
              </ol>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions, please contact ${residentName} directly. This invitation is valid for the scheduled visit date only.
            </p>
          </div>
          
          <div style="background: #343a40; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Secure Visitor Management System</p>
          </div>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);