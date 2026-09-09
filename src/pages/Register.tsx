import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFormLayout from "../components/AuthFormLayout";
import Button from "../components/Button";
import FormField, { CheckboxField, FormTextarea } from "../components/FormField";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { ROUTES } from "../lib/routes";
import type { FieldErrors } from "../lib/types";
import { validateRegister } from "../lib/validation";
import registerImage from "../assets/images/acc-pic.webp";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [heritageNotes, setHeritageNotes] = useState("");
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      phone,
      city,
      postcode,
      heritageNotes,
      eligibilityConfirmed,
    };
    const nextFields = validateRegister(payload);
    setFields(nextFields);
    setError("");
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        phone,
        city,
        postcode,
        heritageNotes,
        eligibilityConfirmed,
      });
      navigate(ROUTES.portal, { replace: true });
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
    <AuthFormLayout
      eyebrow="Membership"
      title="Create Your Account"
      description="Open an online member account to follow your membership status and keep your details with the association."
      image={registerImage}
      imageAlt="Three members of Bana Ba Sawa UK standing together and smiling at a community gathering"
      imageClassName="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
      imageWidth={684}
      imageHeight={1186}
      imagePriority
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        {error ? <FormStatus tone="error" message={error} /> : null}
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
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            error={fields.password}
            required
          />
          <FormField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={fields.confirmPassword}
            required
          />
        </div>
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
          label="Sawa connection (optional)"
          value={heritageNotes}
          onChange={setHeritageNotes}
          error={fields.heritageNotes}
          maxLength={500}
          placeholder="A short note on your Sawa heritage or Douala connection, if you wish to share one."
        />
        <CheckboxField
          id="eligibilityConfirmed"
          checked={eligibilityConfirmed}
          onChange={setEligibilityConfirmed}
          error={fields.eligibilityConfirmed}
        >
          I confirm that I am of coastal Sawa descent, speak or understand Douala, and share the
          association's values of fraternity, solidarity and cultural connection.
        </CheckboxField>
        <Button type="submit" variant="primary" className="w-full rounded-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </Button>
        <p className="text-sm text-ink-soft">
          Already have an account?{" "}
          <Link to={ROUTES.login} className="font-semibold text-forest-900 hover:text-gold-dark">
            Sign in
          </Link>
        </p>
      </form>
    </AuthFormLayout>
  );
}
