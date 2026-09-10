import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Many Supabase flows will sign the user in on password-reset redirect.
    // If the session is already present (or the URL contains an access token),
    // you can update the user password directly.
    // This effect simply finishes loading so the form shows.
    setLoading(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error("[reset] updateUser error:", error);
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  if (loading) return <div>Loading…</div>;
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Reset password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">New password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 block w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded">Set new password</button>
        {status === "success" && <p className="text-sm text-green-600">Password updated — you can now sign in.</p>}
        {status === "error" && <p className="text-sm text-red-600">Unable to update password.</p>}
      </form>
    </div>
  );
}
