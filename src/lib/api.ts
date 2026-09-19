import type { SocialPost } from "./platforms";

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : fallback;
    throw new Error(message);
  }
  return payload as T;
}

async function requestAuth(path: string, body: Record<string, string>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseResponse<unknown>(response, "Authentication request failed.");
}

export async function loginAdmin(email: string, password: string) {
  return requestAuth("/api/auth/login", { email, password });
}

export async function signupAdmin(email: string, password: string) {
  return requestAuth("/api/auth/signup", { email, password });
}

export async function logoutAdmin() {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  return parseResponse<unknown>(response, "We couldn't log you out.");
}

export async function fetchSession() {
  const response = await fetch("/api/auth/session");
  if (!response.ok) return false;
  const payload = (await response.json().catch(() => null)) as { authenticated?: boolean } | null;
  return payload?.authenticated === true;
}

export async function fetchMonthPosts(from: string, to: string) {
  const response = await fetch(`/api/posts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return parseResponse<{ posts: SocialPost[] }>(response, "We couldn't load posting activity.");
}

export async function fetchDayPosts(date: string) {
  return fetchMonthPosts(date, date);
}

export async function fetchReportPosts() {
  // The posts endpoint requires a range. This broad range includes the complete tracker history.
  const response = await fetch("/api/posts?from=2000-01-01&to=2100-12-31");
  return parseResponse<{ posts: SocialPost[] }>(response, "We couldn't load posts for the report.");
}

type SavePostInput = {
  date: string;
  platform: SocialPost["platform"];
  posted: boolean;
  postUrl: string;
  notes: string;
  screenshot: File | null;
  removeScreenshot: boolean;
};

export async function savePost(input: SavePostInput) {
  const form = new FormData();
  form.set("date", input.date);
  form.set("platform", input.platform);
  form.set("posted", String(input.posted));
  form.set("postUrl", input.postUrl);
  form.set("notes", input.notes);
  form.set("removeScreenshot", String(input.removeScreenshot));
  if (input.screenshot) form.set("screenshot", input.screenshot);

  const response = await fetch("/api/posts", { method: "POST", body: form });
  return parseResponse<{ post: SocialPost }>(response, "The post could not be saved.");
}
