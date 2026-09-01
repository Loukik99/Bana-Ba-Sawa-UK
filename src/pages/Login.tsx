import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthFormLayout from "../components/AuthFormLayout";
import Button from "../components/Button";
import FormField from "../components/FormField";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { ROUTES } from "../lib/routes";
import type { FieldErrors } from "../lib/types";
import { validateLogin } from "../lib/validation";
import loginImage from "../assets/images/community-support.jpg";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return ROUTES.portal;
  return value;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextFields = validateLogin(email, password);
    setFields(nextFields);
    setError("");
    if (Object.keys(nextFields).length > 0) return;

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(safeNextPath(searchParams.get("next")), { replace: true });
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
      title="Welcome Back"
      description="Sign in to open the membership portal, view your account details and keep your profile up to date."
      image={loginImage}
      imageAlt="Members of Bana Ba Sawa UK gathered together in community"
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        {error ? <FormStatus tone="error" message={error} /> : null}
        {!error && resetSuccess ? (
          <FormStatus
            tone="success"
            message="Your password has been updated. Please sign in with your new password."
          />
        ) : null}
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
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={fields.password}
          required
        />
        <div className="flex justify-end">
          <Link
            to={ROUTES.forgotPassword}
            className="text-sm font-semibold text-forest-900 hover:text-gold-dark"
          >
            Forgot Password?
          </Link>
        </div>
        <Button type="submit" variant="primary" className="w-full rounded-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </Button>
        <p className="text-sm text-ink-soft">
          New to the association?{" "}
          <Link to={ROUTES.register} className="font-semibold text-forest-900 hover:text-gold-dark">
            Create a member account
          </Link>
        </p>
      </form>
    </AuthFormLayout>
  );
}
