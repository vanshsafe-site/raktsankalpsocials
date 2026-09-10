import { createFileRoute } from "@tanstack/react-router";
import { createSessionValue, sessionCookie } from "@/lib/session.server";

// POST { email: string; password: string }
// Registers a new admin user via Supabase.
export const Route = createFileRoute("/api/auth/signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as { email?: string; password?: string };
        const email = String(body.email ?? "").trim();
        const password = String(body.password ?? "");

        if (!email || !password) {
          return Response.json({ error: "Email and password are required" }, { status: 400 });
        }

        if (password.length < 8) {
          return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) throw new Error("Cloud connection is not available.");

        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(url, key, { auth: { persistSession: false } });

        try {
          // Check if this email is allowed to sign up (must match ADMIN_EMAIL)
          const adminEmail = process.env["ADMIN_EMAIL"] ?? "";
          if (!adminEmail || email !== adminEmail) {
            console.error("[signup] unauthorized signup attempt:", { email, allowedEmail: adminEmail });
            return Response.json({ error: "This email is not authorized to create an account" }, { status: 403 });
          }

          const { data, error } = await client.auth.signUp({ email, password });
          if (error) {
            console.error("[signup] signUp error:", error);
            return Response.json({ error: error.message || "Unable to create account" }, { status: 400 });
          }

          if (!data?.user) {
            return Response.json({ error: "Account creation failed" }, { status: 500 });
          }

          // Auto-sign in the newly created user and create a session
          const signInResponse = await client.auth.signInWithPassword({ email, password });
          if (signInResponse.error || !signInResponse.data?.user) {
            console.error("[signup] auto sign-in failed:", signInResponse.error);
            return Response.json(
              { ok: true, message: "Account created. Please sign in with your credentials." },
              { status: 201 }
            );
          }

          return Response.json({ ok: true }, { headers: { "set-cookie": sessionCookie(createSessionValue()) } });
        } catch (err) {
          console.error("[signup] unexpected error:", err);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
