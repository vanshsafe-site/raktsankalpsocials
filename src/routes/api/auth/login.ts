import { createFileRoute } from "@tanstack/react-router";
import { createSessionValue, sessionCookie } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as { adminId?: string; password?: string };
        const valid = body.adminId === process.env["ADMIN_ID"] && body.password === process.env["ADMIN_PASSWORD"];
        if (!valid) return Response.json({ error: "Invalid credentials" }, { status: 401 });
        return Response.json({ authenticated: true }, { headers: { "set-cookie": sessionCookie(createSessionValue()) } });
      },
    },
  },
});
