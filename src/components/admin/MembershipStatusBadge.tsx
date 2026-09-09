import { MEMBERSHIP_STATUS_LABELS } from "../../lib/membership";
import type { MembershipStatus } from "../../lib/types";

const STATUS_CLASSES: Record<MembershipStatus, string> = {
  pending: "border-gold-dark/25 bg-[#f7edd8] text-gold-dark",
  active: "border-forest-900/12 bg-forest-50 text-forest-800",
  rejected: "border-[#8f2d2d]/20 bg-[#f8ecec] text-[#8f2d2d]",
  suspended: "border-forest-900/10 bg-ivory-dark text-ink-soft",
};

export default function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${STATUS_CLASSES[status]}`}
    >
      {MEMBERSHIP_STATUS_LABELS[status]}
    </span>
  );
}
