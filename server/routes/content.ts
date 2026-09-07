import type { Router } from "express";
import { requireAdmin, requireAuth, type AuthLocals } from "../auth.js";
import type { AppDatabase } from "../db-types.js";
import { isUniqueConstraintError, toAdminEvent, toAdminNews, toAdminNotification, toPublicEvent, toPublicNews } from "../db-shared.js";
import { jsonError, pagination, parseIdParam } from "../http.js";
import { notifyEventMembers } from "../notifications.js";
import { uniqueSlug } from "../slug.js";
import type { Mailer } from "../mail.js";
import { CONTENT_STATUSES, NEWS_KINDS, type ContentStatus, type NewsKind } from "../types.js";
import { eventInputSchema, fieldErrors, newsInputSchema } from "../validation.js";

function queryStatus(value: unknown): ContentStatus | undefined {
  return typeof value === "string" && (CONTENT_STATUSES as readonly string[]).includes(value)
    ? (value as ContentStatus)
    : undefined;
}

function queryKind(value: unknown): NewsKind | undefined {
  return typeof value === "string" && (NEWS_KINDS as readonly string[]).includes(value)
    ? (value as NewsKind)
    : undefined;
}

export function registerContentRoutes(api: Router, db: AppDatabase, mailer: Mailer): void {
  api.get("/events", async (req, res, next) => {
    try {
      const paging = pagination(req.query);
      const result = await db.listPublishedEvents({
        page: paging.page,
        pageSize: paging.pageSize,
        offset: paging.offset,
      });
      res.json({
        events: result.items.map(toPublicEvent),
        page: paging.page,
        pageSize: paging.pageSize,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  });

  api.get("/events/:slug", async (req, res, next) => {
    try {
      const event = await db.findEventBySlug(req.params.slug ?? "");
      if (!event || event.status !== "published") {
        jsonError(res, 404, "Event not found.");
        return;
      }
      res.json({ event: toPublicEvent(event) });
    } catch (error) {
      next(error);
    }
  });

  api.get("/news", async (req, res, next) => {
    try {
      const paging = pagination(req.query);
      const result = await db.listPublishedNews({
        kind: queryKind(req.query.kind),
        page: paging.page,
        pageSize: paging.pageSize,
        offset: paging.offset,
      });
      res.json({
        items: result.items.map(toPublicNews),
        page: paging.page,
        pageSize: paging.pageSize,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  });

  api.get("/news/:slug", async (req, res, next) => {
    try {
      const item = await db.findNewsBySlug(req.params.slug ?? "");
      if (!item || item.status !== "published") {
        jsonError(res, 404, "News item not found.");
        return;
      }
      res.json({ item: toPublicNews(item) });
    } catch (error) {
      next(error);
    }
  });

  api.get("/admin/events", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const paging = pagination(req.query);
      const result = await db.listAdminEvents({
        status: queryStatus(req.query.status),
        page: paging.page,
        pageSize: paging.pageSize,
        offset: paging.offset,
      });
      res.json({
        events: result.items.map(toAdminEvent),
        page: paging.page,
        pageSize: paging.pageSize,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  });

  api.post("/admin/events", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const locals = res.locals as AuthLocals;
      const parsed = eventInputSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }
      if (!locals.member) {
        jsonError(res, 401, "Please sign in to continue.");
        return;
      }

      const data = parsed.data;
      const slug = await uniqueSlug(data.slug || data.title, (value) => db.eventSlugExists(value));
      const event = await db.insertEvent({
        title: data.title,
        slug,
        description: data.description,
        eventDate: data.eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        eventUrl: data.eventUrl,
        createdBy: locals.member.id,
      });
      res.status(201).json({ event: toAdminEvent(event) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        jsonError(res, 409, "An event with this slug already exists.");
        return;
      }
      next(error);
    }
  });

  api.get("/admin/events/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      const event = await db.findEventById(id);
      if (!event) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      res.json({ event: toAdminEvent(event) });
    } catch (error) {
      next(error);
    }
  });

  api.patch("/admin/events/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      const existing = await db.findEventById(id);
      if (!existing) {
        jsonError(res, 404, "Event not found.");
        return;
      }

      const parsed = eventInputSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const data = parsed.data;
      const slug = data.slug
        ? await uniqueSlug(data.slug, (value) => db.eventSlugExists(value, id))
        : existing.slug;
      const event = await db.updateEvent(id, {
        title: data.title,
        slug,
        description: data.description,
        eventDate: data.eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        eventUrl: data.eventUrl,
      });
      res.json({ event: toAdminEvent(event) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        jsonError(res, 409, "An event with this slug already exists.");
        return;
      }
      next(error);
    }
  });

  api.post("/admin/events/:id/publish", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      const existing = await db.findEventById(id);
      if (!existing) {
        jsonError(res, 404, "Event not found.");
        return;
      }

      const firstPublish = !existing.publishedAt;
      const event = await db.publishEvent(id);
      const notified = firstPublish ? await notifyEventMembers(db, mailer, event) : undefined;
      res.json({
        event: toAdminEvent(event),
        notified: notified ?? null,
      });
    } catch (error) {
      next(error);
    }
  });

  api.post("/admin/events/:id/archive", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      const existing = await db.findEventById(id);
      if (!existing) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      const event = await db.archiveEvent(id);
      res.json({ event: toAdminEvent(event) });
    } catch (error) {
      next(error);
    }
  });

  api.post("/admin/events/:id/notify", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      const event = await db.findEventById(id);
      if (!event) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      if (event.status !== "published") {
        jsonError(res, 400, "Only published events can notify members.");
        return;
      }
      const notified = await notifyEventMembers(db, mailer, event, { retryFailed: true });
      const updated = await db.findEventById(id);
      res.json({
        event: updated ? toAdminEvent(updated) : toAdminEvent(event),
        notified,
      });
    } catch (error) {
      next(error);
    }
  });

  api.get("/admin/events/:id/notifications", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      const event = await db.findEventById(id);
      if (!event) {
        jsonError(res, 404, "Event not found.");
        return;
      }
      const notifications = await db.listEventNotifications(id);
      res.json({ notifications: notifications.map(toAdminNotification) });
    } catch (error) {
      next(error);
    }
  });

  api.get("/admin/news", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const paging = pagination(req.query);
      const result = await db.listAdminNews({
        kind: queryKind(req.query.kind),
        status: queryStatus(req.query.status),
        page: paging.page,
        pageSize: paging.pageSize,
        offset: paging.offset,
      });
      res.json({
        items: result.items.map(toAdminNews),
        page: paging.page,
        pageSize: paging.pageSize,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  });

  api.post("/admin/news", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const locals = res.locals as AuthLocals;
      const parsed = newsInputSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }
      if (!locals.member) {
        jsonError(res, 401, "Please sign in to continue.");
        return;
      }

      const data = parsed.data;
      const slug = await uniqueSlug(data.slug || data.title, (value) => db.newsSlugExists(value));
      const item = await db.insertNews({
        kind: data.kind,
        title: data.title,
        slug,
        summary: data.summary,
        content: data.content,
        createdBy: locals.member.id,
      });
      res.status(201).json({ item: toAdminNews(item) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        jsonError(res, 409, "A news item with this slug already exists.");
        return;
      }
      next(error);
    }
  });

  api.get("/admin/news/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "News item not found.");
        return;
      }
      const item = await db.findNewsById(id);
      if (!item) {
        jsonError(res, 404, "News item not found.");
        return;
      }
      res.json({ item: toAdminNews(item) });
    } catch (error) {
      next(error);
    }
  });

  api.patch("/admin/news/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "News item not found.");
        return;
      }
      const existing = await db.findNewsById(id);
      if (!existing) {
        jsonError(res, 404, "News item not found.");
        return;
      }

      const parsed = newsInputSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const data = parsed.data;
      const slug = data.slug
        ? await uniqueSlug(data.slug, (value) => db.newsSlugExists(value, id))
        : existing.slug;
      const item = await db.updateNews(id, {
        kind: data.kind,
        title: data.title,
        slug,
        summary: data.summary,
        content: data.content,
      });
      res.json({ item: toAdminNews(item) });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        jsonError(res, 409, "A news item with this slug already exists.");
        return;
      }
      next(error);
    }
  });

  api.post("/admin/news/:id/publish", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "News item not found.");
        return;
      }
      const existing = await db.findNewsById(id);
      if (!existing) {
        jsonError(res, 404, "News item not found.");
        return;
      }
      const item = await db.publishNews(id);
      res.json({ item: toAdminNews(item) });
    } catch (error) {
      next(error);
    }
  });

  api.post("/admin/news/:id/archive", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "News item not found.");
        return;
      }
      const existing = await db.findNewsById(id);
      if (!existing) {
        jsonError(res, 404, "News item not found.");
        return;
      }
      const item = await db.archiveNews(id);
      res.json({ item: toAdminNews(item) });
    } catch (error) {
      next(error);
    }
  });
}
