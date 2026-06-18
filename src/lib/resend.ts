import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY || "re_placeholder_key_for_builds_only";
const resend = new Resend(resendKey);

const alertEmail = process.env.ADMIN_ALERT_EMAIL || "";

if (!process.env.RESEND_API_KEY) {
  if (typeof window === "undefined") {
    console.warn("⚠️ Peringatan: Variabel lingkungan RESEND_API_KEY belum disetel di .env.local.");
  }
}

/**
 * Mengirim notifikasi email untuk tiket darurat (sentimen marah).
 */
export async function sendUrgentAlertEmail(
  customerName: string,
  messageContent: string,
  conversationId: string
): Promise<boolean> {
  if (!resendKey || !alertEmail) {
    console.warn(
      `Notifikasi email dilewati (simulasi): Tiket marah dari ${customerName}. Setel RESEND_API_KEY & ADMIN_ALERT_EMAIL.`
    );
    return false;
  }

  try {
    const dashboardLink = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/inbox/${conversationId}`;

    const { data, error } = await resend.emails.send({
      from: "SynapseCS Alerts <onboarding@resend.dev>",
      to: alertEmail,
      subject: `⚠️ ESKALASI DARURAT: Tiket Marah dari ${customerName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 12px;">
          <h2 style="color: #e11d48; margin-top: 0;">⚠️ Peringatan Sentimen Negatif Terdeteksi</h2>
          <p>Pelanggan berikut baru saja mengirim pesan dengan sentimen <strong>MARAH / KECEWA</strong> dan membutuhkan bantuan segera:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Pelanggan:</td>
              <td style="padding: 8px 0;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">ID Percakapan:</td>
              <td style="padding: 8px 0; font-family: monospace;">${conversationId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Pesan Terakhir:</td>
              <td style="padding: 8px 0; font-style: italic; background: #fff1f2; padding: 10px; border-radius: 6px; border-left: 4px solid #e11d48;">
                "${messageContent}"
              </td>
            </tr>
          </table>
          
          <div style="margin-top: 25px; text-align: center;">
            <a href="${dashboardLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Buka Tiket di Dasbor
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />
          <p style="font-size: 11px; color: #888; text-align: center;">
            Dikirim secara otomatis oleh Sistem Agen AI SynapseCS.<br/>
            Free Tier limits: Resend membatasi 100 email per hari.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error.message);
      return false;
    }

    console.log(`Notifikasi email darurat berhasil dikirim ke ${alertEmail} untuk tiket ${conversationId}`);
    return true;
  } catch (error) {
    console.error("Failed to send urgent email via Resend:", error);
    return false;
  }
}
