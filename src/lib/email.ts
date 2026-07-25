import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOutreachEmail(
  to: string,
  subject: string,
  body: string,
  fromEmail: string = "noreply@revora.io"
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("📧 Email simulado (Resend API no configurada):", { to, subject });
    return { success: true, id: `simulated-${Date.now()}` };
  }

  try {
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
              Enviado por <strong>Revora</strong> — Revenue OS para Agencias
            </p>
          </div>
        </div>
      `,
    });
    return result;
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    throw error;
  }
}
