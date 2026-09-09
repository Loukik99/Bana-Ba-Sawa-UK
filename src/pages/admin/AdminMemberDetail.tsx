import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/Button";
import FormStatus from "../../components/FormStatus";
import MembershipStatusBadge from "../../components/admin/MembershipStatusBadge";
import { ApiError, getAdminMember, updateAdminMemberStatus } from "../../lib/api";
import {
  displayValue,
  formatDate,
  memberName,
  MEMBERSHIP_STATUS_LABELS,
  USER_ROLE_LABELS,
} from "../../lib/membership";
import { ROUTES } from "../../lib/routes";
import { MEMBERSHIP_STATUSES, type Member, type MembershipStatus } from "../../lib/types";

export default function AdminMemberDetail() {
  const { id } = useParams();
  const memberId = Number(id);
  const validId = Number.isInteger(memberId) && memberId >= 1;
  const [member, setMember] = useState<Member | null>(null);
  const [status, setStatus] = useState<MembershipStatus>("pending");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(validId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!validId) return;

    let active = true;
    setLoading(true);
    setError("");
    setSuccess("");

    getAdminMember(memberId)
      .then((result) => {
        if (!active) return;
        setMember(result.member);
        setStatus(result.member.membershipStatus);
      })
      .catch((caught) => {
        if (!active) return;
        setMember(null);
        setError(caught instanceof ApiError ? caught.message : "Unable to load this member.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [memberId, validId]);

  async function onStatusSubmit(event: FormEvent) {
    event.preventDefault();
    if (!member || status === member.membershipStatus) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await updateAdminMemberStatus(member.id, status);
      setMember(result.member);
      setStatus(result.member.membershipStatus);
      setSuccess("Membership status has been updated.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to update membership status.");
    } finally {
      setSaving(false);
    }
  }

  if (!validId) {
    return (
      <div className="space-y-5">
        <FormStatus tone="error" message="Member not found." />
        <Link to={ROUTES.adminMembers} className="text-sm font-semibold text-forest-900 hover:text-gold-dark">
          Back to members
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading member details...</p>;
  }

  if (!member) {
    return (
      <div className="space-y-5">
        <FormStatus tone="error" message={error || "Member not found."} />
        <Link to={ROUTES.adminMembers} className="text-sm font-semibold text-forest-900 hover:text-gold-dark">
          Back to members
        </Link>
      </div>
    );
  }

  const location = [member.city, member.postcode].filter((value) => value.trim()).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <Link to={ROUTES.adminMembers} className="text-sm font-semibold text-forest-900 hover:text-gold-dark">
          Back to members
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-[1.85rem] text-forest-950">{memberName(member)}</h2>
            <p className="mt-1 text-sm text-ink-soft">{member.membershipNumber}</p>
          </div>
          <MembershipStatusBadge status={member.membershipStatus} />
        </div>
      </div>

      {error ? <FormStatus tone="error" message={error} /> : null}
      {success ? <FormStatus tone="success" message={success} /> : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-[4px] border border-forest-900/8 bg-cream p-6">
          <p className="eyebrow text-gold-dark">Profile</p>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Email</dt>
              <dd className="mt-1 text-ink-soft">{member.email}</dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Phone</dt>
              <dd className="mt-1 text-ink-soft">{displayValue(member.phone)}</dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Location</dt>
              <dd className="mt-1 text-ink-soft">{location || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Role</dt>
              <dd className="mt-1 text-ink-soft">{USER_ROLE_LABELS[member.role]}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[4px] border border-forest-900/8 bg-cream p-6">
          <p className="eyebrow text-gold-dark">Membership</p>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Status</dt>
              <dd className="mt-1 text-ink-soft">{MEMBERSHIP_STATUS_LABELS[member.membershipStatus]}</dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
                Email confirmed
              </dt>
              <dd className="mt-1 text-ink-soft">
                {member.emailVerifiedAt ? `Yes · ${formatDate(member.emailVerifiedAt)}` : "Not yet"}
              </dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
                Eligibility confirmed
              </dt>
              <dd className="mt-1 text-ink-soft">{member.eligibilityConfirmed ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Registered</dt>
              <dd className="mt-1 text-ink-soft">{formatDate(member.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Last updated</dt>
              <dd className="mt-1 text-ink-soft">{formatDate(member.updatedAt)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <article className="rounded-[4px] border border-forest-900/8 bg-cream p-6">
        <p className="eyebrow text-gold-dark">Sawa connection</p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          {member.heritageNotes.trim() ? member.heritageNotes : "No heritage note has been added."}
        </p>
      </article>

      <form
        className="rounded-[4px] border border-forest-900/8 bg-cream p-6"
        onSubmit={(event) => void onStatusSubmit(event)}
      >
        <p className="eyebrow text-gold-dark">Change membership status</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Update this member's recognition status. The change is saved immediately to the membership record.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-64">
            <label htmlFor="membership-status" className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
              Status
            </label>
            <select
              id="membership-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as MembershipStatus)}
              className="mt-2 w-full rounded-[3px] border border-forest-900/15 bg-ivory px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold"
            >
              {MEMBERSHIP_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {MEMBERSHIP_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="rounded-full px-5 py-3"
            disabled={saving || status === member.membershipStatus}
          >
            {saving ? "Saving..." : "Update status"}
          </Button>
        </div>
      </form>
    </div>
  );
}
