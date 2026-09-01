import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import FormField, { FormTextarea } from "../components/FormField";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { ROUTES } from "../lib/routes";
import type { FieldErrors } from "../lib/types";
import { validateProfile } from "../lib/validation";

export default function Profile() {
  const { member, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [city, setCity] = useState(member?.city ?? "");
  const [postcode, setPostcode] = useState(member?.postcode ?? "");
  const [heritageNotes, setHeritageNotes] = useState(member?.heritageNotes ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!member) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      firstName,
      lastName,
      email,
      phone,
      city,
      postcode,
      heritageNotes,
      currentPassword,
      newPassword,
      confirmPassword,
    };
    const nextFields = validateProfile(payload);
    setFields(nextFields);
    setError("");
    setSuccess("");
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        email,
        phone,
        city,
        postcode,
        heritageNotes,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Your profile has been updated.");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFields(caught.fields ?? {});
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main id="main-content" className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[42rem]">
          <p className="eyebrow text-gold-dark">Membership Portal</p>
          <h1 className="mt-4 font-display text-[2.15rem] font-semibold text-forest-950 sm:text-[2.45rem]">
            Edit your profile
          </h1>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
            Keep your contact details current so the association can stay in touch. Membership number
            and status are set by the association and cannot be changed here.
          </p>

          <form
            className="mt-10 space-y-5 rounded-[4px] border border-forest-900/8 bg-cream p-6 shadow-[0_12px_32px_rgba(18,52,32,0.05)] sm:p-8"
            onSubmit={onSubmit}
            noValidate
          >
            {error ? <FormStatus tone="error" message={error} /> : null}
            {success ? <FormStatus tone="success" message={success} /> : null}

            <div className="grid gap-4 rounded-[3px] border border-forest-900/8 bg-ivory px-4 py-4 sm:grid-cols-2">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
                  Membership number
                </p>
                <p className="mt-1 text-sm text-ink-soft">{member.membershipNumber}</p>
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">Status</p>
                <p className="mt-1 text-sm capitalize text-ink-soft">{member.membershipStatus}</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="firstName"
                label="First name"
                autoComplete="given-name"
                value={firstName}
                onChange={setFirstName}
                error={fields.firstName}
                required
              />
              <FormField
                id="lastName"
                label="Last name"
                autoComplete="family-name"
                value={lastName}
                onChange={setLastName}
                error={fields.lastName}
                required
              />
            </div>
            <FormField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              error={fields.email}
              required
            />
            <FormField
              id="phone"
              label="Phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={setPhone}
              error={fields.phone}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="city"
                label="City"
                autoComplete="address-level2"
                value={city}
                onChange={setCity}
                error={fields.city}
              />
              <FormField
                id="postcode"
                label="Postcode"
                autoComplete="postal-code"
                value={postcode}
                onChange={setPostcode}
                error={fields.postcode}
              />
            </div>
            <FormTextarea
              id="heritageNotes"
              label="Sawa connection"
              value={heritageNotes}
              onChange={setHeritageNotes}
              error={fields.heritageNotes}
              maxLength={500}
            />

            <div className="border-t border-forest-900/8 pt-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
                Change password
              </p>
              <p className="mt-2 text-sm text-ink-soft">Leave blank to keep your current password.</p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <FormField
                  id="currentPassword"
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  error={fields.currentPassword}
                />
                <div className="hidden sm:block" />
                <FormField
                  id="newPassword"
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={setNewPassword}
                  error={fields.newPassword}
                />
                <FormField
                  id="confirmPassword"
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={fields.confirmPassword}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" variant="primary" className="rounded-full" disabled={submitting}>
                {submitting ? "Saving..." : "Save changes"}
              </Button>
              <Link
                to={ROUTES.portal}
                className="inline-flex items-center justify-center px-2 py-3 text-sm font-semibold text-forest-900 hover:text-gold-dark"
              >
                Back to portal
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
