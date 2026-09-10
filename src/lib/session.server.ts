import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "raktsankalp_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function secret() {
  return process.env["SESSION_SECRET"] ?? "";
}

export function createSessionValue() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `admin.${expiresAt}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function isValidSessionValue(value: string | undefined) {
  if (!value || !secret()) return false;
  const [role, expires, signature] = value.split(".");
  if (role !== "admin" || !expires || !signature || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", secret()).update(`${role}.${expires}`).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function readCookie(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  return cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
}

// Updated: accept either the existing cookie-based session OR a Supabase JWT in
// Authorization: Bearer <token>. The JWT is verified server-side using the
// service-role client and must match ADMIN_EMAIL or ADMIN_UID (set in env).
export async function requireAdmin(request: Request) {
  // 1) existing cookie-based session
  if (isValidSessionValue(readCookie(request))) return;

  // 2) Authorization header with Supabase access token
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (token) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data?.user) {
        console.error("[requireAdmin] supabase getUser failed:", error ?? "no user");
        throw new Response("Unauthorized", { status: 401 });
      }

      const adminEmail = process.env["ADMIN_EMAIL"] ?? "";
      const adminUid = process.env["ADMIN_UID"] ?? "";

      if (adminEmail && data.user.email === adminEmail) return;
      if (adminUid && data.user.id === adminUid) return;

      console.error("[requireAdmin] user is not admin:", { email: data.user.email, id: data.user.id });
      throw new Response("Unauthorized", { status: 401 });
    } catch (err) {
      console.error("[requireAdmin] token verification error:", err);
      throw new Response("Unauthorized", { status: 401 });
    }
  }

  // 3) no valid cookie or token
  throw new Response("Unauthorized", { status: 401 });
}

export function sessionCookie(value: string) {
  return `${COOKIE_NAME}=${value}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${process.env["NODE_ENV"] === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${process.env["NODE_ENV"] === "production" ? "; Secure" : ""}`;
}
