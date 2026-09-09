import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FormStatus from "../../components/FormStatus";
import MembershipStatusBadge from "../../components/admin/MembershipStatusBadge";
import { ApiError, fetchAdminMemberStats, listAdminMembers } from "../../lib/api";
import { formatDate, memberName, MEMBERSHIP_STATUS_LABELS } from "../../lib/membership";
import { adminMemberPath, ROUTES } from "../../lib/routes";
import type { AdminMemberStats, Member, MembershipStatus } from "../../lib/types";

const STAT_CARDS: Array<{
  key: keyof AdminMemberStats;
  label: string;
  status?: MembershipStatus;
  detail: string;
}> = [
  { key: "total", label: "Total members", detail: "Everyone currently recorded" },
  { key: "active", label: "Active members", status: "active", detail: MEMBERSHIP_STATUS_LABELS.active },
  { key: "pending", label: "Pending members", status: "pending", detail: "Awaiting recognition" },
  { key: "suspended", label: "Suspended members", status: "suspended", detail: MEMBERSHIP_STATUS_LABELS.suspended },
  { key: "rejected", label: "Rejected members", status: "rejected", detail: MEMBERSHIP_STATUS_LABELS.rejected },
];

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminMemberStats | null>(null);
  const [recent, setRecent] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([fetchAdminMemberStats(), listAdminMembers({ page: 1, pageSize: 5 })])
      .then(([nextStats, list]) => {
        if (!active) return;
        setStats(nextStats);
        setRecent(list.members);
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught instanceof ApiError ? caught.message : "Unable to load dashboard figures.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading dashboard figures...</p>;
  }

  if (error || !stats) {
    return <FormStatus tone="error" message={error || "Unable to load dashboard figures."} />;
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="admin-stats-heading">
        <h2 id="admin-stats-heading" className="font-display text-[1.65rem] text-forest-950">
          Dashboard overview
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Association membership figures from the current records. Open a card to manage those members.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {STAT_CARDS.map((card) => {
            const to = card.status ? `${ROUTES.adminMembers}?status=${card.status}` : ROUTES.adminMembers;
            return (
              <Link
                key={card.key}
                to={to}
                className="rounded-[4px] border border-forest-900/8 bg-cream p-5 shadow-[0_8px_24px_rgba(18,52,32,0.04)] transition-colors hover:border-gold/40"
              >
                <p className="eyebrow text-gold-dark">{card.label}</p>
                <p className="mt-3 font-display text-[2rem] text-forest-950">{stats[card.key]}</p>
                <p className="mt-1 text-sm text-ink-soft">{card.detail}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="admin-recent-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="admin-recent-heading" className="font-display text-[1.65rem] text-forest-950">
              Recent members
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">The most recently registered accounts.</p>
          </div>
          <Link to={ROUTES.adminMembers} className="text-sm font-semibold text-forest-900 hover:text-gold-dark">
            View all members
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="mt-6 rounded-[4px] border border-forest-900/8 bg-cream px-6 py-10 text-center">
            <p className="font-display text-2xl text-forest-950">No members yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              Members will appear here when people register for Bana Ba Sawa UK.
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-forest-900/8 overflow-hidden rounded-[4px] border border-forest-900/8 bg-cream">
            {recent.map((member) => (
              <li key={member.id}>
                <Link
                  to={adminMemberPath(member.id)}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-ivory sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-forest-950">{memberName(member)}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {member.membershipNumber} · {member.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <MembershipStatusBadge status={member.membershipStatus} />
                    <span className="text-sm text-ink-soft">{formatDate(member.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
