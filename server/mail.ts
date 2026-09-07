import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { allowDevMailPreview, isPublicRuntime } from "./config.js";

export interface PasswordResetEmail {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresMinutes: number;
}

export interface WelcomeEmail {
  to: string;
  firstName: string;
}

export interface VerificationEmail {
  to: string;
  firstName: string;
  verifyUrl: string;
  expiresHours: number;
}

export interface EventNotificationEmail {
  to: string;
  firstName: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  location: string;
  detailsUrl: string;
}

export interface Mailer {
  sendPasswordResetEmail(payload: PasswordResetEmail): Promise<void>;
  sendWelcomeEmail(payload: WelcomeEmail): Promise<void>;
  sendVerificationEmail(payload: VerificationEmail): Promise<void>;
  sendEventNotificationEmail(payload: EventNotificationEmail): Promise<void>;
}

export const noopMailer: Mailer = {
  async sendPasswordResetEmail() {},
  async sendWelcomeEmail() {},
  async sendVerificationEmail() {},
  async sendEventNotificationEmail() {},
};

export class MailDeliveryError extends Error {
  constructor(message = "The email could not be sent.") {
    super(message);
    this.name = "MailDeliveryError";
  }
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapHtml(title: string, inner: string): string {
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
                <h1 style="margin:16px 0 0;font-size:28px;line-height:1.2;color:#0c1f13;">${escapeHtml(title)}</h1>
                ${inner}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function greetingText(firstName: string): string {
  return firstName ? `Hello ${firstName},` : "Hello,";
}

function greetingHtml(firstName: string): string {
  return firstName ? `Hello ${escapeHtml(firstName)},` : "Hello,";
}

function paragraph(text: string): string {
  return `<p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#4a4a43;">${text}</p>`;
}

function button(href: string, label: string): string {
  const safeUrl = escapeHtml(href);
  return `<p style="margin:24px 0;">
                  <a href="${safeUrl}" style="display:inline-block;background:#123420;color:#f7f3ea;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;padding:14px 22px;">${escapeHtml(label)}</a>
                </p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#4a4a43;">
                  If the button does not work, copy this link into your browser:<br />
                  <a href="${safeUrl}" style="color:#123420;word-break:break-all;">${safeUrl}</a>
                </p>`;
}

export function resetTextBody(payload: PasswordResetEmail): string {
  return [
    greetingText(payload.firstName),
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

export function htmlBody(payload: PasswordResetEmail): string {
  return wrapHtml(
    "Reset your password",
    `${paragraph(greetingHtml(payload.firstName))}
                ${paragraph(`We received a request to reset the password for your member account. This link expires in ${String(payload.expiresMinutes)} minutes and can be used only once.`)}
                ${button(payload.resetUrl, "Reset Password")}
                ${paragraph("If you did not ask to reset your password, you can ignore this email. Your current password will stay the same.")}`,
  );
}

export function welcomeTextBody(payload: WelcomeEmail): string {
  return [
    greetingText(payload.firstName),
    "",
    "Welcome to Bana Ba Sawa UK. Your member account has been created.",
    "Your membership starts as pending until the association recognises you as an active member.",
    "Please confirm your email address using the verification message we have also sent.",
    "",
    "Bana Ba Sawa UK",
  ].join("\n");
}

export function welcomeHtmlBody(payload: WelcomeEmail): string {
  return wrapHtml(
    "Welcome to Bana Ba Sawa UK",
    `${paragraph(greetingHtml(payload.firstName))}
                ${paragraph("Your member account has been created. Your membership starts as pending until the association recognises you as an active member.")}
                ${paragraph("Please confirm your email address using the verification message we have also sent.")}`,
  );
}

export function verificationTextBody(payload: VerificationEmail): string {
  return [
    greetingText(payload.firstName),
    "",
    "Please confirm the email address for your Bana Ba Sawa UK member account.",
    `This link expires in ${payload.expiresHours} hours and can be used only once:`,
    "",
    payload.verifyUrl,
    "",
    "If you did not create this account, you can ignore this email.",
    "",
    "Bana Ba Sawa UK",
  ].join("\n");
}

export function verificationHtmlBody(payload: VerificationEmail): string {
  return wrapHtml(
    "Confirm your email",
    `${paragraph(greetingHtml(payload.firstName))}
                ${paragraph(`Please confirm the email address for your member account. This link expires in ${String(payload.expiresHours)} hours and can be used only once.`)}
                ${button(payload.verifyUrl, "Confirm Email")}
                ${paragraph("If you did not create this account, you can ignore this email.")}`,
  );
}

export function eventNotificationTextBody(payload: EventNotificationEmail): string {
  return [
    greetingText(payload.firstName),
    "",
    `A new Bana Ba Sawa UK event has been published: ${payload.eventTitle}.`,
    `Date: ${payload.eventDate}`,
    `Time: ${payload.startTime}`,
    payload.location ? `Location: ${payload.location}` : "",
    "",
    payload.detailsUrl,
    "",
    "Bana Ba Sawa UK",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function eventNotificationHtmlBody(payload: EventNotificationEmail): string {
  const location = payload.location
    ? paragraph(`Location: ${escapeHtml(payload.location)}`)
    : "";
  return wrapHtml(
    "New event",
    `${paragraph(greetingHtml(payload.firstName))}
                ${paragraph(`A new event has been published: <strong>${escapeHtml(payload.eventTitle)}</strong>.`)}
                ${paragraph(`Date: ${escapeHtml(payload.eventDate)}`)}
                ${paragraph(`Time: ${escapeHtml(payload.startTime)}`)}
                ${location}
                ${button(payload.detailsUrl, "View Event")}`,
  );
}

function writeDevPreview(filename: string, payload: unknown, logLines: string[]): void {
  const dir = path.resolve("data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, filename), `${JSON.stringify({ payload, sentAt: new Date().toISOString() }, null, 2)}\n`);
  console.log(`\n[dev mail] ${logLines.join("\n")}\n`);
}

function logMailFailure(message: string): void {
  console.error(`[mail] ${message}`);
}

interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function createMailer(env: NodeJS.ProcessEnv = process.env): Mailer {
  const host = env.SMTP_HOST?.trim();
  const configuredFrom = env.SMTP_FROM?.trim();
  const publicRuntime = isPublicRuntime(env);
  const from = configuredFrom || (publicRuntime ? "" : "Bana Ba Sawa UK <noreply@localhost>");

  if (!host && publicRuntime) {
    logMailFailure("SMTP_HOST is not configured. Transactional emails will not be sent until SMTP is set.");
  } else if (host && publicRuntime && !from) {
    logMailFailure("SMTP_FROM is not configured. Transactional emails will not be sent until SMTP_FROM is set.");
  }

  let transporter: nodemailer.Transporter | undefined;
  if (host && (!publicRuntime || from)) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port: Number(env.SMTP_PORT) || 587,
        secure: env.SMTP_SECURE === "true",
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
      });
    } catch {
      logMailFailure("SMTP transport could not be created. Transactional emails will fail until SMTP is repaired.");
    }
  }

  if (host && !transporter) {
    return {
      async sendPasswordResetEmail() {
        throw new MailDeliveryError("SMTP transport is not available.");
      },
      async sendWelcomeEmail() {
        throw new MailDeliveryError("SMTP transport is not available.");
      },
      async sendVerificationEmail() {
        throw new MailDeliveryError("SMTP transport is not available.");
      },
      async sendEventNotificationEmail() {
        throw new MailDeliveryError("SMTP transport is not available.");
      },
    };
  }

  async function sendOrPreview(kind: string, mail: OutgoingMail, previewFile: string, previewLines: string[]): Promise<void> {
    if (!host) {
      if (!allowDevMailPreview(env)) {
        throw new MailDeliveryError("SMTP is not configured.");
      }
      writeDevPreview(previewFile, mail, previewLines);
      return;
    }

    if (!transporter || (publicRuntime && !from)) {
      throw new MailDeliveryError("SMTP is not configured.");
    }

    try {
      await transporter.sendMail({
        from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    } catch {
      logMailFailure(`Failed to send a ${kind} email.`);
      throw new MailDeliveryError(`The ${kind} email could not be sent.`);
    }
  }

  return {
    async sendPasswordResetEmail(payload) {
      await sendOrPreview(
        "password reset",
        {
          to: payload.to,
          subject: "Reset your Bana Ba Sawa UK password",
          text: resetTextBody(payload),
          html: htmlBody(payload),
        },
        "last-reset-email.json",
        ["Password reset email (SMTP not configured)", `To: ${payload.to}`, `Reset link: ${payload.resetUrl}`],
      );
    },
    async sendWelcomeEmail(payload) {
      await sendOrPreview(
        "welcome",
        {
          to: payload.to,
          subject: "Welcome to Bana Ba Sawa UK",
          text: welcomeTextBody(payload),
          html: welcomeHtmlBody(payload),
        },
        "last-welcome-email.json",
        ["Welcome email (SMTP not configured)", `To: ${payload.to}`],
      );
    },
    async sendVerificationEmail(payload) {
      await sendOrPreview(
        "verification",
        {
          to: payload.to,
          subject: "Confirm your Bana Ba Sawa UK email",
          text: verificationTextBody(payload),
          html: verificationHtmlBody(payload),
        },
        "last-verification-email.json",
        ["Verification email (SMTP not configured)", `To: ${payload.to}`, `Verify link: ${payload.verifyUrl}`],
      );
    },
    async sendEventNotificationEmail(payload) {
      await sendOrPreview(
        "event notification",
        {
          to: payload.to,
          subject: `New event: ${payload.eventTitle}`,
          text: eventNotificationTextBody(payload),
          html: eventNotificationHtmlBody(payload),
        },
        "last-event-notification-email.json",
        ["Event notification email (SMTP not configured)", `To: ${payload.to}`, `Event: ${payload.eventTitle}`],
      );
    },
  };
}
