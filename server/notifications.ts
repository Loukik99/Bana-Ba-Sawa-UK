import type { AppDatabase } from "./db-types.js";
import { publicAppUrl } from "./config.js";
import { logInternalError } from "./http.js";
import type { EventNotificationEmail, Mailer } from "./mail.js";
import type { EventRecord } from "./types.js";

export interface NotifyResult {
  attempted: number;
  sent: number;
  failed: number;
  inserted: number;
}

function eventDetailsUrl(event: EventRecord): string {
  const configured = event.eventUrl.trim();
  if (configured) return configured;
  return `${publicAppUrl()}/events/${encodeURIComponent(event.slug)}`;
}

export async function notifyEventMembers(
  db: AppDatabase,
  mailer: Mailer,
  event: EventRecord,
  options: { retryFailed?: boolean } = {},
): Promise<NotifyResult> {
  if (options.retryFailed) {
    await db.resetFailedEventNotifications(event.id);
  }

  const recipients = await db.listEligibleNotificationRecipients();
  const inserted = await db.insertEventNotifications(
    recipients.map((user) => ({
      eventId: event.id,
      userId: user.id,
      email: user.email,
    })),
  );

  await db.markEventNotified(event.id);

  const pending = await db.listPendingEventNotifications(event.id);
  const usersById = new Map(recipients.map((user) => [user.id, user]));
  let sent = 0;
  let failed = 0;

  for (const record of pending) {
    const user = usersById.get(record.userId) ?? (await db.findUserById(record.userId));
    const payload: EventNotificationEmail = {
      to: record.email,
      firstName: user?.firstName ?? "",
      eventTitle: event.title,
      eventDate: event.eventDate,
      startTime: event.startTime,
      location: event.location,
      detailsUrl: eventDetailsUrl(event),
    };

    try {
      await mailer.sendEventNotificationEmail(payload);
      await db.markNotificationSent(record.id);
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      logInternalError("event-notification", error);
      await db.markNotificationFailed(record.id, message);
    }
  }

  return {
    attempted: pending.length,
    sent,
    failed,
    inserted,
  };
}
