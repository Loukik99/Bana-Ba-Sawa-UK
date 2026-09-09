import type { AppDatabase } from "./db-types.js";
import {
  createVerificationToken,
  hashVerificationToken,
  publicAppUrl,
  verificationTokenExpiryDate,
  verificationTokenTtlHours,
} from "./auth.js";
import { logInternalError } from "./http.js";
import type { Mailer } from "./mail.js";
import type { UserRecord } from "./types.js";

export interface RegistrationEmailResult {
  welcomeEmailSent: boolean;
  verificationEmailSent: boolean;
}

export async function sendWelcomeEmailOnce(
  db: AppDatabase,
  mailer: Mailer,
  user: UserRecord,
): Promise<boolean> {
  if (user.welcomeEmailSentAt) return false;

  try {
    await mailer.sendWelcomeEmail({
      to: user.email,
      firstName: user.firstName,
    });
    await db.markWelcomeEmailSent(user.id);
    return true;
  } catch (error) {
    logInternalError("welcome-email", error);
    return false;
  }
}

export async function issueVerificationEmail(
  db: AppDatabase,
  mailer: Mailer,
  user: UserRecord,
): Promise<boolean> {
  if (user.emailVerifiedAt) return false;

  try {
    await db.invalidateEmailVerificationTokensForUser(user.id);
    const token = createVerificationToken();
    await db.insertEmailVerificationToken({
      userId: user.id,
      tokenHash: hashVerificationToken(token),
      expiresAt: verificationTokenExpiryDate(),
    });

    await mailer.sendVerificationEmail({
      to: user.email,
      firstName: user.firstName,
      verifyUrl: `${publicAppUrl()}/verify-email?token=${token}`,
      expiresHours: verificationTokenTtlHours(),
    });
    return true;
  } catch (error) {
    logInternalError("verification-email", error);
    return false;
  }
}

export async function sendRegistrationEmails(
  db: AppDatabase,
  mailer: Mailer,
  user: UserRecord,
): Promise<RegistrationEmailResult> {
  const welcomeEmailSent = await sendWelcomeEmailOnce(db, mailer, user);
  const verificationEmailSent = await issueVerificationEmail(db, mailer, user);
  return { welcomeEmailSent, verificationEmailSent };
}
