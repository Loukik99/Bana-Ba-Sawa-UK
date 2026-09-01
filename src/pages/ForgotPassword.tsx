import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthFormLayout from "../components/AuthFormLayout";
import Button from "../components/Button";
import FormField from "../components/FormField";
import FormStatus from "../components/FormStatus";
import { ApiError, forgotPasswordRequest } from "../lib/api";
import { ROUTES } from "../lib/routes";
import type { FieldErrors } from "../lib/types";
import { validateForgotPassword } from "../lib/validation";
import loginImage from "../assets/images/community-support.jpg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextFields = validateForgotPassword(email);
    setFields(nextFields);
    setError("");
    setSuccess("");
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      const data = await forgotPasswordRequest(email);
      setSuccess(data.message);
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
      eyebrow="Member Access"
      title="Forgot Password"
      description="Enter the email for your member account and we will send a reset link if an account exists."
      image={loginImage}
      imageAlt="Members of Bana Ba Sawa UK gathered together in community"
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        {error ? <FormStatus tone="error" message={error} /> : null}
        {success ? <FormStatus tone="success" message={success} /> : null}
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
        <Button type="submit" variant="primary" className="w-full rounded-full" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset link"}
        </Button>
        <p className="text-sm text-ink-soft">
          Remembered your password?{" "}
          <Link to={ROUTES.login} className="font-semibold text-forest-900 hover:text-gold-dark">
            Sign in
          </Link>
        </p>
      </form>
    </AuthFormLayout>
  );
}
