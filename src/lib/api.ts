import type { SocialPost } from "./platforms";

async function requestAuth(path: string, body: Record<string, string>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Authentication request failed.";
    throw new Error(message);
  }

  return payload;
}

export async function loginAdmin(email: string, password: string) {
  return requestAuth("/api/auth/login", { email, password });
}

export async function signupAdmin(email: string, password: string) {
  return requestAuth("/api/auth/signup", { email, password });
}

export async function fetchReportPosts() {
  // The posts endpoint requires a range. This broad range includes the complete tracker history.
  const response = await fetch("/api/posts?from=2000-01-01&to=2100-12-31");
  if (!response.ok) throw new Error("We couldn't load posts for the report.");
  return (await response.json()) as { posts: SocialPost[] };
}
