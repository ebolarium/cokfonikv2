const RESEND_API_URL = "https://api.resend.com/emails";

const getResendConfig = () => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM || process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  if (!fromEmail) {
    throw new Error("RESEND_FROM (or EMAIL_FROM) is missing.");
  }

  return { apiKey, fromEmail };
};

const sendWithResend = async ({ to, subject, html, text }) => {
  const { apiKey, fromEmail } = getResendConfig();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || data?.error || "Resend request failed.";
      throw new Error(`Resend ${response.status}: ${message}`);
    }

    return { success: true, messageId: data.id };
  } finally {
    clearTimeout(timeout);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    if (!process.env.FRONTEND_URL) {
      throw new Error("FRONTEND_URL is missing.");
    }

    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const subject = "Sifre Sifirlama Talebi - Cokfonik";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
          <h1>Cokfonik Koro</h1>
        </div>

        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2>Merhaba ${userName || ""},</h2>
          <p>Hesabiniz icin sifre sifirlama talebinde bulundunuz.</p>
          <p>Asagidaki baglantiya tiklayarak sifrenizi sifirlayabilirsiniz:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}"
               style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Sifremi Sifirla
            </a>
          </div>

          <p><strong>Onemli:</strong> Bu baglanti sadece 1 saat gecerlidir.</p>
          <p>Eger bu talebi siz yapmadiysaniz bu e-postayi gormezden gelebilirsiniz.</p>
        </div>
      </div>
    `;
    const text = `
Merhaba ${userName || ""},

Hesabiniz icin sifre sifirlama talebinde bulundunuz.
Sifrenizi sifirlamak icin su baglantiyi kullanin:
${resetURL}

Bu baglanti 1 saat gecerlidir.
`;

    const result = await sendWithResend({
      to: email,
      subject,
      html,
      text,
    });

    console.log("Password reset email sent via Resend:", result.messageId);
    return result;
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};

// Send test email
const sendTestEmail = async (email) => {
  try {
    const result = await sendWithResend({
      to: email,
      subject: "Cokfonik - Email Test",
      html: "<h1>Email sistemi calisiyor!</h1><p>Bu bir test e-postasidir.</p>",
      text: "Email sistemi calisiyor! Bu bir test e-postasidir.",
    });

    return result;
  } catch (error) {
    console.error("Test email error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendTestEmail,
};
