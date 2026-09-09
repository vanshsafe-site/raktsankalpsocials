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
          <Link to="/">
            <ArrowLeft size={13} /> Back to tracker
          </Link>
          <span>Private workspace</span>
        </div>
      </section>
    </main>
  );
}
