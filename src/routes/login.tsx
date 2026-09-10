import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, LogIn } from "lucide-react";

import { BrandMark } from "@/components/tracker-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAdmin } from "@/lib/api";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginAdmin(adminId, password);
      navigate({ to: "/admin" });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  if (showForgot) {
    return <ForgotPasswordView onBack={() => setShowForgot(false)} />;
  }

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
        <h1>Welcome back.</h1>
        <p>Sign in to update the daily social activity records.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Administrator ID
            <Input
              required
              autoComplete="username"
              value={adminId}
              onChange={(event) => setAdminId(event.target.value)}
            />
          </label>
          <label>
            Password
            <Input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && (
            <span className="login-error" role="alert">
              {error}
            </span>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <LogIn size={16} /> Sign in
              </>
            )}
          </Button>
        </form>
        <div className="login-footer">
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="forgot-link"
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
              font: "inherit",
            }}
          >
            Forgot password?
          </button>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link to="/">
              <ArrowLeft size={13} /> Back to tracker
            </Link>
            <span>Private workspace</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "sent" | "error">(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("Forgot password error", json);
        setStatus("error");
      } else {
        setStatus("sent");
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

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
        <h1>Reset password</h1>
        <p>Enter your email to receive a password reset link.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email Address
            <Input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
            />
          </label>
          {status === "sent" && (
            <span className="login-success" role="status">
              ✓ Check your inbox for a reset link.
            </span>
          )}
          {status === "error" && (
            <span className="login-error" role="alert">
              Unable to send reset email. Try again later.
            </span>
          )}
          <Button type="submit" disabled={loading || status === "sent"}>
            {loading ? "Sending…" : "Send reset email"}
          </Button>
        </form>
        <div className="login-footer">
          <button
            type="button"
            onClick={onBack}
            className="forgot-link"
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
              font: "inherit",
            }}
          >
            <ArrowLeft size={13} /> Back to login
          </button>
          <span>Private workspace</span>
        </div>
      </section>
    </main>
  );
}
