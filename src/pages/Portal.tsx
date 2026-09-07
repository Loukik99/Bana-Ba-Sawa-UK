import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { ROUTES } from "../lib/routes";
import type { MembershipStatus } from "../lib/types";
import heroImage from "../assets/images/community-hero.jpg";

const STATUS_COPY: Record<MembershipStatus, { label: string; detail: string }> = {
  pending: {
    label: "Awaiting recognition",
    detail:
      "Your online account is open. Recognition as an active member follows eligibility, attendance at a general meeting, and the required declaration.",
  },
  active: {
    label: "Active member",
    detail: "You are recognised as an active member. Please keep your details current and take part in association life.",
  },
  rejected: {
    label: "Not approved",
    detail: "This application was not approved. Please contact the association if you believe this needs review.",
  },
  suspended: {
    label: "Suspended",
    detail: "This account is currently suspended. Please contact the association if you wish to return to active membership.",
  },
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function displayValue(value: string): string {
  return value.trim() ? value : "Not provided";
}

export default function Portal() {
  const { member, resendVerification } = useAuth();
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [resending, setResending] = useState(false);
  if (!member) return null;

  const status = STATUS_COPY[member.membershipStatus];
  const fullName = `${member.firstName} ${member.lastName}`.trim();
  const emailVerified = Boolean(member.emailVerifiedAt);

  async function onResend() {
    setResendMessage("");
    setResendError("");
    setResending(true);
    try {
      const message = await resendVerification();
      setResendMessage(message);
    } catch (caught) {
      setResendError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden bg-forest-950" aria-label="Membership portal">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[72%_42%]"
            width={1024}
            height={681}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(96deg, rgb(12, 31, 19) 0%, rgba(12, 31, 19, 0.94) 32%, rgba(12, 31, 19, 0.72) 48%, rgba(12, 31, 19, 0.28) 72%, transparent 100%)",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex min-h-[22rem] max-w-[72rem] flex-col justify-center px-5 py-16 sm:min-h-[24rem] sm:px-8 sm:py-20">
            <Reveal immediate className="max-w-[34rem]">
              <p className="eyebrow text-gold-light">Membership Portal</p>
              <h1 className="mt-4 font-display text-[2.35rem] font-semibold leading-[1.08] text-ivory sm:text-[3rem]">
                Welcome, {member.firstName}
              </h1>
              <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ivory/82">
                Review your membership details, keep your profile current, and stay connected with Bana Ba Sawa UK.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8 sm:py-16 lg:py-20" aria-labelledby="account-heading">
          <div className="mx-auto max-w-[72rem]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-gold-dark">Your Account</p>
                <h2 id="account-heading" className="mt-3 font-display text-[2rem] text-forest-950">
                  Membership information
                </h2>
              </div>
              <div className="flex gap-3">
                <Button to={ROUTES.profile} variant="primary" className="rounded-full px-5 py-2.5">
                  Edit Profile
                </Button>
              </div>
            </div>

            {!emailVerified ? (
              <div className="mt-8 space-y-3">
                {resendError ? <FormStatus tone="error" message={resendError} /> : null}
                {resendMessage ? <FormStatus tone="success" message={resendMessage} /> : null}
                <article className="rounded-[4px] border border-gold-dark/25 bg-cream p-6">
                  <p className="eyebrow text-gold-dark">Email confirmation</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    Your account is open, but your email address has not been confirmed yet. You can sign in and
                    update your profile. Event notices are sent only to verified, active members.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    className="mt-4 rounded-full px-5 py-2.5"
                    disabled={resending}
                    onClick={() => void onResend()}
                  >
                    {resending ? "Sending..." : "Resend confirmation email"}
                  </Button>
                </article>
              </div>
            ) : null}

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-[4px] border border-forest-900/8 bg-cream p-6 shadow-[0_8px_24px_rgba(18,52,32,0.04)]">
                <p className="eyebrow text-gold-dark">Membership number</p>
                <p className="mt-4 font-display text-[1.65rem] text-forest-950">{member.membershipNumber}</p>
                <p className="mt-2 text-sm text-ink-soft">Member since {formatDate(member.createdAt)}</p>
              </article>
              <article className="rounded-[4px] border border-forest-900/8 bg-cream p-6 shadow-[0_8px_24px_rgba(18,52,32,0.04)] md:col-span-2">
                <p className="eyebrow text-gold-dark">Status</p>
                <p className="mt-4 font-display text-[1.65rem] text-forest-950">{status.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{status.detail}</p>
              </article>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <article className="rounded-[4px] border border-forest-900/8 bg-cream p-6 sm:p-8">
                <p className="eyebrow text-gold-dark">Profile</p>
                <dl className="mt-6 space-y-4 text-sm">
                  <div>
                    <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Name</dt>
                    <dd className="mt-1 text-ink-soft">{fullName}</dd>
                  </div>
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
                    <dd className="mt-1 text-ink-soft">
                      {member.city || member.postcode
                        ? [member.city, member.postcode].filter(Boolean).join(", ")
                        : "Not provided"}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-[4px] border border-forest-900/8 bg-cream p-6 sm:p-8">
                <p className="eyebrow text-gold-dark">Membership notes</p>
                <p className="mt-6 text-sm leading-relaxed text-ink-soft">
                  {member.heritageNotes.trim()
                    ? member.heritageNotes
                    : "No heritage note has been added yet. You can include a short note on your Sawa connection in your profile."}
                </p>
                <p className="mt-6 text-sm leading-relaxed text-ink-soft">
                  Annual dues and joining contributions are set according to the association's rules. Online
                  registration does not replace attendance at a general meeting or the membership declaration.
                </p>
                <Link to={ROUTES.membership} className="mt-5 inline-block text-sm text-forest-900 hover:text-gold-dark">
                  Review membership guidance
                </Link>
              </article>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
