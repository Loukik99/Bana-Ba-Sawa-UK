import type { Router } from "express";
import { requireAdmin, requireAuth, type AuthLocals } from "../auth.js";
import type { AppDatabase } from "../db-types.js";
import { toAdminMember } from "../db-shared.js";
import { jsonError, pagination, parseIdParam } from "../http.js";
import { fieldErrors, memberRoleSchema, membershipStatusSchema } from "../validation.js";
import { MEMBERSHIP_STATUSES, type MembershipStatus } from "../types.js";

export function registerAdminMemberRoutes(api: Router, db: AppDatabase): void {
  api.get("/admin/members", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const statusValue = typeof req.query.status === "string" ? req.query.status : "";
      const status = (MEMBERSHIP_STATUSES as readonly string[]).includes(statusValue)
        ? (statusValue as MembershipStatus)
        : undefined;
      const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const paging = pagination(req.query);
      const result = await db.listMembers({
        status,
        search: search || undefined,
        page: paging.page,
        pageSize: paging.pageSize,
        offset: paging.offset,
      });

      res.json({
        members: result.items.map(toAdminMember),
        page: paging.page,
        pageSize: paging.pageSize,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  });

  api.get("/admin/members/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Member not found.");
        return;
      }

      const user = await db.findUserById(id);
      if (!user) {
        jsonError(res, 404, "Member not found.");
        return;
      }

      res.json({ member: toAdminMember(user) });
    } catch (error) {
      next(error);
    }
  });

  api.patch("/admin/members/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Member not found.");
        return;
      }

      const parsed = membershipStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const user = await db.findUserById(id);
      if (!user) {
        jsonError(res, 404, "Member not found.");
        return;
      }

      const updated = await db.updateUserMembershipStatus(id, parsed.data.status);
      res.json({ member: toAdminMember(updated) });
    } catch (error) {
      next(error);
    }
  });

  api.patch("/admin/members/:id/role", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const locals = res.locals as AuthLocals;
      const id = parseIdParam(req.params.id);
      if (!id) {
        jsonError(res, 404, "Member not found.");
        return;
      }

      const parsed = memberRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        jsonError(res, 400, "Please check the highlighted fields.", fieldErrors(parsed.error));
        return;
      }

      const user = await db.findUserById(id);
      if (!user) {
        jsonError(res, 404, "Member not found.");
        return;
      }

      if (user.role === "admin" && parsed.data.role === "member") {
        if (locals.member?.id === user.id) {
          jsonError(res, 400, "You cannot remove your own admin access.");
          return;
        }
        const adminCount = await db.countUsersByRole("admin");
        if (adminCount <= 1) {
          jsonError(res, 400, "The association must keep at least one admin.");
          return;
        }
      }

      const updated = await db.updateUserRole(id, parsed.data.role);
      res.json({ member: toAdminMember(updated) });
    } catch (error) {
      next(error);
    }
  });
}
