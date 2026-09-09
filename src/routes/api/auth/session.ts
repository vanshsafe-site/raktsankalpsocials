import { createFileRoute } from "@tanstack/react-router";
import { isValidSessionValue, readCookie } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/session")({
  server: { handlers: { GET: async ({ request }) => Response.json({ authenticated: isValidSessionValue(readCookie(request)) }) } },
});
