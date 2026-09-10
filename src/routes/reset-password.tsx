import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { BrandMark } from "@/components/tracker-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase sign-in happens automatically via the email link.
    // The access token is in the URL hash.
    setLoading(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        console.error("[reset] updateUser error:", updateError);
        setStatus("error");
        setError(updateError.message || "Unable to update password.");
      } else {
        setStatus("success");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("An unexpected error occurred.");
    }
  }

  if (loading)
    return (
      <main className="login-page">
        <section className="login-card">
          <div>Loading…</div>
        </section>
      </main>
    );

  return (
    <main className="login-page">
      <section className="login-card">
        <Link to="/" className="brand-lockup">
          <BrandMark />
          <span>
            <strong>Raktsankalp</strong>
            <small>Socials tracker</small>
          </span>
        </Link>
        <h1>Reset your password</h1>
        <p>Enter a new password to regain access to your account.</p>

        {status === "success" ? (
          <div className="login-form">
            <span
              className="login-success"
              role="status"
              style={{
                display: "block",
                padding: "1rem",
                backgroundColor: "#dcfce7",
                color: "#166534",
                borderRadius: "0.375rem",
                marginBottom: "1rem",
              }}
            >
              ✓ Password updated successfully! You can now sign in with your new
              password.
            </span>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Go to login
            </Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              New Password
              <Input
                required
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>
            <label>
              Confirm Password
              <Input
                required
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
            </label>
            {error && (
              <span className="login-error" role="alert">
                {error}
              </span>
            )}
            {status === "error" && (
              <span className="login-error" role="alert">
                Unable to update password. Please try again or contact support.
              </span>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Updating…" : "Set new password"}
            </Button>
          </form>
        )}

        <div className="login-footer">
          <Link to="/">
            <ArrowLeft size={13} /> Back to tracker
          </Link>
          <span>Private workspace</span>
        </div>
      </section>
    </main>
  );
}
