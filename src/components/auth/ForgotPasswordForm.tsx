import React, { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "sent" | "error">(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </label>

      <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? "Sending…" : "Send reset email"}
      </button>

      {status === "sent" && <p className="text-sm text-green-600">Check your inbox for a reset link.</p>}
      {status === "error" && <p className="text-sm text-red-600">Unable to send reset email. Try again later.</p>}
    </form>
  );
}
