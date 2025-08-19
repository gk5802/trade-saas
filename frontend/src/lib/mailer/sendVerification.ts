// ====================================================
// File FE-1: src/lib/mailer/sendVerification.ts
// Purpose: Send verification email with serial+token
// Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, APP_URL
// ====================================================
import nodemailer from "nodemailer"

export async function sendVerificationEmail(to: string, serial: string, token: string) {
  const verifyUrl = `${process.env.APP_URL}/api/auth/verify?serial=${encodeURIComponent(serial)}&token=${encodeURIComponent(token)}`

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  })

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#0b1220;color:#e6edf6">
    <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:12px;overflow:hidden">
      <div style="padding:24px;border-bottom:1px solid #1f2937;background:#0f172a">
        <h2 style="margin:0;font-size:20px;color:#93c5fd">Welcome to WKT3 Secure</h2>
        <p style="margin:8px 0 0;color:#9ca3af">Let’s verify your email to activate your account.</p>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 16px">Click the button below to verify your account:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">
          ✅ Verify my account
        </a>
        <p style="margin:16px 0 0;color:#9ca3af">If the button doesn't work, copy & paste this link:</p>
        <p style="word-break:break-all;color:#60a5fa">${verifyUrl}</p>
      </div>
      <div style="padding:16px;background:#0f172a;color:#6b7280;font-size:12px">
        <div>Token: <code>${token}</code></div>
        <div>Serial: <code>${serial}</code></div>
      </div>
    </div>
    <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:16px">
      You received this because someone signed up at <strong>wkt3.com</strong> with your email.
    </p>
  </div>
  `

  await transporter.sendMail({
    from: `"WKT3 Secure" <${process.env.SMTP_USER}>`,
    to,
    subject: "Verify your WKT3 account",
    html,
  })
}
