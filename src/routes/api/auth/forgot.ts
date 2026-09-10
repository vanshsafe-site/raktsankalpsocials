import { createFileRoute } from "@tanstack/react-router";

// POST { email: string }
// Sends a password reset email using Supabase's reset flow.
export const Route = createFileRoute("/api/auth/forgot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as { email?: string };
        const email = String(body.email ?? "").trim();
        if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) throw new Error("Cloud connection is not available.");

        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(url, key, { auth: { persistSession: false } });

        try {
          const redirectTo = process.env["PASSWORD_RESET_REDIRECT"] ?? undefined;
          const { data, error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
          if (error) {
            console.error("[forgot] resetPasswordForEmail error:", error);
            return Response.json({ error: "Unable to send reset email" }, { status: 500 });
          }
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[forgot] unexpected error:", err);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
