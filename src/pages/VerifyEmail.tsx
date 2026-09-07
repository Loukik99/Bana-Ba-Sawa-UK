import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthFormLayout from "../components/AuthFormLayout";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";
import { ApiError, validateVerificationTokenRequest, verifyEmailRequest } from "../lib/api";
import { ROUTES } from "../lib/routes";
import loginImage from "../assets/images/community-support.jpg";

export default function VerifyEmail() {
  const { refresh } = useAuth();
  const refreshRef = useRef(refresh);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [checking, setChecking] = useState(Boolean(token));
  const [error, setError] = useState(token ? "" : "This verification link is invalid or has expired.");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!token) return;
    let active = true;

    validateVerificationTokenRequest(token)
      .then(() => verifyEmailRequest(token))
      .then(async (result) => {
        if (!active) return;
        setSuccess(result.message);
        try {
          await refreshRef.current();
        } catch {
          // Signed-out visitors can still confirm the address.
        }
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught instanceof ApiError ? caught.message : "This verification link is invalid or has expired.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <AuthFormLayout
      eyebrow="Member Access"
      title="Confirm Your Email"
      description="Use the link from your verification email to confirm the address on your Bana Ba Sawa UK account."
      image={loginImage}
      imageAlt="Members of Bana Ba Sawa UK gathered together in community"
    >
      {checking ? (
        <p className="text-sm text-ink-soft">Confirming your email address...</p>
      ) : success ? (
        <div className="space-y-5">
          <FormStatus tone="success" message={success} />
          <Link to={ROUTES.portal} className="font-semibold text-forest-900 hover:text-gold-dark">
            Continue to the membership portal
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {error ? <FormStatus tone="error" message={error} /> : null}
          <Link to={ROUTES.login} className="font-semibold text-forest-900 hover:text-gold-dark">
            Sign in to request a new confirmation link
          </Link>
        </div>
      )}
    </AuthFormLayout>
  );
}
