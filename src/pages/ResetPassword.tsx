import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthFormLayout from "../components/AuthFormLayout";
import Button from "../components/Button";
import FormField from "../components/FormField";
import FormStatus from "../components/FormStatus";
import { ApiError, resetPasswordRequest, validateResetTokenRequest } from "../lib/api";
import { ROUTES } from "../lib/routes";
import type { FieldErrors } from "../lib/types";
import { validateResetPassword } from "../lib/validation";
import loginImage from "../assets/images/community-support.jpg";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState(token ? "" : "This reset link is invalid or has expired.");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;

    validateResetTokenRequest(token)
      .then(() => {
        if (!active) return;
        setTokenValid(true);
      })
      .catch((caught) => {
        if (!active) return;
        setTokenValid(false);
        setError(caught instanceof ApiError ? caught.message : "This reset link is invalid or has expired.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextFields = validateResetPassword(password, confirmPassword);
    setFields(nextFields);
    setError("");
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      await resetPasswordRequest(token, password, confirmPassword);
      navigate(`${ROUTES.login}?reset=success`, { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFields(caught.fields ?? {});
        setError(caught.message);
        if (!caught.fields) {
          setTokenValid(false);
        }
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
      title="Reset Password"
      description="Choose a new password for your Bana Ba Sawa UK member account."
      image={loginImage}
      imageAlt="Members of Bana Ba Sawa UK gathered together in community"
    >
      {checking ? (
        <p className="text-sm text-ink-soft">Checking your reset link...</p>
      ) : !tokenValid ? (
        <div className="space-y-5">
          {error ? <FormStatus tone="error" message={error} /> : null}
          <Link to={ROUTES.forgotPassword} className="font-semibold text-forest-900 hover:text-gold-dark">
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          {error ? <FormStatus tone="error" message={error} /> : null}
          <FormField
            id="password"
            label="New password"
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
          <Button type="submit" variant="primary" className="w-full rounded-full" disabled={submitting}>
            {submitting ? "Updating..." : "Update password"}
          </Button>
          <p className="text-sm text-ink-soft">
            <Link to={ROUTES.login} className="font-semibold text-forest-900 hover:text-gold-dark">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthFormLayout>
  );
}
