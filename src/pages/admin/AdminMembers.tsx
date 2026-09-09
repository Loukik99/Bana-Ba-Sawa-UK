import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../components/Button";
import FormStatus from "../../components/FormStatus";
import MembershipStatusBadge from "../../components/admin/MembershipStatusBadge";
import { ApiError, listAdminMembers } from "../../lib/api";
import { formatDate, memberName, MEMBERSHIP_STATUS_LABELS } from "../../lib/membership";
import { adminMemberPath } from "../../lib/routes";
import { MEMBERSHIP_STATUSES, type Member, type MembershipStatus } from "../../lib/types";

function parseStatus(value: string | null): MembershipStatus | undefined {
  if (value && (MEMBERSHIP_STATUSES as readonly string[]).includes(value)) {
    return value as MembershipStatus;
  }
  return undefined;
}

export default function AdminMembers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = parseStatus(searchParams.get("status"));
  const query = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [searchInput, setSearchInput] = useState(query);
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    listAdminMembers({ status, q: query, page, pageSize: 20 })
      .then((result) => {
        if (!active) return;
        setMembers(result.members);
        setTotal(result.total);
        setPageSize(result.pageSize);
      })
      .catch((caught) => {
        if (!active) return;
        setMembers([]);
        setTotal(0);
        setError(caught instanceof ApiError ? caught.message : "Unable to load members.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, query, page]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(status || query.trim());
  const range = useMemo(() => {
    if (total === 0) return { from: 0, to: 0 };
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return { from, to };
  }, [page, pageSize, total]);

  function updateParams(next: { q?: string; status?: string; page?: number }) {
    const params = new URLSearchParams();
    const nextQuery = next.q !== undefined ? next.q : query;
    const nextStatus = next.status !== undefined ? next.status : status ?? "";
    const nextPage = next.page ?? 1;
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    updateParams({ q: searchInput, page: 1 });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm leading-relaxed text-ink-soft">
          Search by name, email or membership number, and filter by membership status.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 rounded-[4px] border border-forest-900/8 bg-cream p-4 sm:flex-row sm:items-end sm:p-5"
        onSubmit={onSearch}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="member-search" className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
            Search
          </label>
          <input
            id="member-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Name, email or membership number"
            className="mt-2 w-full rounded-[3px] border border-forest-900/15 bg-ivory px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="member-status" className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
            Status
          </label>
          <select
            id="member-status"
            value={status ?? ""}
            onChange={(event) => updateParams({ status: event.target.value, page: 1 })}
            className="mt-2 w-full rounded-[3px] border border-forest-900/15 bg-ivory px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
          >
            <option value="">All statuses</option>
            {MEMBERSHIP_STATUSES.map((value) => (
              <option key={value} value={value}>
                {MEMBERSHIP_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="primary" className="rounded-full px-5 py-3 sm:w-auto">
          Search
        </Button>
      </form>

      {error ? <FormStatus tone="error" message={error} /> : null}

      {loading ? (
        <p className="text-sm text-ink-soft">Loading members...</p>
      ) : error ? null : total === 0 ? (
        <div className="rounded-[4px] border border-forest-900/8 bg-cream px-6 py-12 text-center">
          <p className="font-display text-2xl text-forest-950">
            {hasFilters ? "No matching members" : "No members yet"}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            {hasFilters
              ? "Try a different search or status filter."
              : "Members will appear here when people register for Bana Ba Sawa UK."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-soft" aria-live="polite">
            Showing {range.from}–{range.to} of {total}
          </p>

          <div className="space-y-3 md:hidden">
            {members.map((member) => (
              <Link
                key={member.id}
                to={adminMemberPath(member.id)}
                className="block rounded-[4px] border border-forest-900/8 bg-cream p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-forest-950">{memberName(member)}</p>
                    <p className="mt-1 text-sm text-ink-soft">{member.email}</p>
                  </div>
                  <MembershipStatusBadge status={member.membershipStatus} />
                </div>
                <p className="mt-3 text-sm text-ink-soft">
                  {member.membershipNumber} · Registered {formatDate(member.createdAt)}
                </p>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-[4px] border border-forest-900/8 bg-cream md:block">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Association members</caption>
              <thead className="border-b border-forest-900/8 bg-ivory text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Membership no.
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Registered
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-forest-900/8 last:border-b-0">
                    <td className="px-5 py-4 font-semibold text-forest-950">{memberName(member)}</td>
                    <td className="px-5 py-4 text-ink-soft">{member.email}</td>
                    <td className="px-5 py-4 text-ink-soft">{member.membershipNumber}</td>
                    <td className="px-5 py-4">
                      <MembershipStatusBadge status={member.membershipStatus} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-ink-soft">{formatDate(member.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to={adminMemberPath(member.id)} className="font-semibold text-forest-900 hover:text-gold-dark">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost-light"
                className="rounded-full px-5 py-2.5"
                disabled={page <= 1}
                onClick={() => updateParams({ page: page - 1 })}
              >
                Previous
              </Button>
              <p className="text-sm text-ink-soft">
                Page {page} of {pageCount}
              </p>
              <Button
                type="button"
                variant="ghost-light"
                className="rounded-full px-5 py-2.5"
                disabled={page >= pageCount}
                onClick={() => updateParams({ page: page + 1 })}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
