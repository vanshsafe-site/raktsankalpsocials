import { createFileRoute } from "@tanstack/react-router";
import { createSessionValue, sessionCookie } from "@/lib/session.server";

// POST { email: string; password: string }
// Authenticates a user with Supabase and creates a session.
export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as { email?: string; password?: string };
        const email = String(body.email ?? "").trim();
        const password = String(body.password ?? "");

        if (!email || !password) {
          return Response.json({ error: "Email and password are required" }, { status: 400 });
        }

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) throw new Error("Cloud connection is not available.");

        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(url, key, { auth: { persistSession: false } });

        try {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error || !data?.user) {
            console.error("[login] signInWithPassword error:", error);
            return Response.json({ error: "Invalid email or password" }, { status: 401 });
          }

          // Verify the user is an admin (email or UID must match)
          const adminEmail = process.env["ADMIN_EMAIL"] ?? "";
          const adminUid = process.env["ADMIN_UID"] ?? "";

          const isAdmin = (adminEmail && data.user.email === adminEmail) || (adminUid && data.user.id === adminUid);
          if (!isAdmin) {
            console.error("[login] user is not admin:", { email: data.user.email, id: data.user.id });
            return Response.json({ error: "Unauthorized" }, { status: 403 });
          }

          // Create a session cookie
          return Response.json({ authenticated: true }, { headers: { "set-cookie": sessionCookie(createSessionValue()) } });
        } catch (err) {
          console.error("[login] unexpected error:", err);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
