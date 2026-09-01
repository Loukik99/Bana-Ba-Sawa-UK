import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

export interface PasswordResetEmail {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresMinutes: number;
}

export interface Mailer {
  sendPasswordResetEmail(payload: PasswordResetEmail): Promise<void>;
}

function textBody(payload: PasswordResetEmail): string {
  const greeting = payload.firstName ? `Hello ${payload.firstName},` : "Hello,";
  return [
    greeting,
    "",
    "We received a request to reset the password for your Bana Ba Sawa UK member account.",
    `This link expires in ${payload.expiresMinutes} minutes and can be used only once:`,
    "",
    payload.resetUrl,
    "",
    "If you did not ask to reset your password, you can ignore this email. Your current password will stay the same.",
    "",
    "Bana Ba Sawa UK",
  ].join("\n");
}

function htmlBody(payload: PasswordResetEmail): string {
  const greeting = payload.firstName ? `Hello ${payload.firstName},` : "Hello,";
  const safeUrl = payload.resetUrl.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f7f3ea;font-family:Georgia,serif;color:#1c1c18;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f3ea;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fdfbf6;border:1px solid rgba(18,52,32,0.08);padding:32px;">
            <tr>
              <td>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#96702c;font-weight:600;">Bana Ba Sawa UK</p>
                <h1 style="margin:16px 0 0;font-size:28px;line-height:1.2;color:#0c1f13;">Reset your password</h1>
                <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#4a4a43;">${greeting}</p>
                <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#4a4a43;">
                  We received a request to reset the password for your member account. This link expires in ${payload.expiresMinutes} minutes and can be used only once.
                </p>
                <p style="margin:24px 0;">
                  <a href="${safeUrl}" style="display:inline-block;background:#123420;color:#f7f3ea;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;padding:14px 22px;">Reset Password</a>
                </p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#4a4a43;">
                  If the button does not work, copy this link into your browser:<br />
                  <a href="${safeUrl}" style="color:#123420;word-break:break-all;">${safeUrl}</a>
                </p>
                <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#4a4a43;">
                  If you did not ask to reset your password, you can ignore this email. Your current password will stay the same.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function writeDevPreview(payload: PasswordResetEmail): void {
  const dir = path.resolve("data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "last-reset-email.json"),
    `${JSON.stringify({ ...payload, sentAt: new Date().toISOString() }, null, 2)}\n`,
  );
  console.log("\n[dev mail] Password reset email (SMTP not configured)");
  console.log(`To: ${payload.to}`);
  console.log(`Reset link: ${payload.resetUrl}\n`);
}

export function createMailer(): Mailer {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_HOST is required in production to send password reset emails.");
    }
    return {
      async sendPasswordResetEmail(payload) {
        writeDevPreview(payload);
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  const from = process.env.SMTP_FROM || "Bana Ba Sawa UK <noreply@localhost>";

  return {
    async sendPasswordResetEmail(payload) {
      await transporter.sendMail({
        from,
        to: payload.to,
        subject: "Reset your Bana Ba Sawa UK password",
        text: textBody(payload),
        html: htmlBody(payload),
      });
    },
  };
}
