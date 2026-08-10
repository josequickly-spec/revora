import { Resend } from "resend";

export async function sendOutreachEmail(
  to: string,
  subject: string,
  body: string,
  fromEmail: string = process.env.RESEND_FROM_EMAIL || "noreply@ecoscalepartner.com"
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured; no email was sent.");
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            ${body.replace(/\n/g, "<br>")}
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              Sent by <strong>EcoScale Partner</strong> — Commerce Intelligence Platform
            </p>
          </div>
        </div>
      `,
    });
    return result;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}
