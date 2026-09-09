import type { PlatformKey, SocialPost } from "./platforms";

export async function fetchMonthPosts(from: string, to: string) {
  const response = await fetch(`/api/posts?from=${from}&to=${to}`);
  if (!response.ok) throw new Error("We couldn't load posting activity.");
  return (await response.json()) as { posts: SocialPost[] };
}

export async function fetchDayPosts(date: string) {
  const response = await fetch(`/api/posts?date=${date}`);
  if (!response.ok) throw new Error("We couldn't load this day's activity.");
  return (await response.json()) as { posts: SocialPost[] };
}

export async function fetchSession() {
  const response = await fetch("/api/auth/session");
  return response.ok && (await response.json()).authenticated === true;
}

export async function loginAdmin(adminId: string, password: string) {
  const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ adminId, password }) });
  if (!response.ok) throw new Error("Login failed. Check your administrator ID and password.");
}

export async function logoutAdmin() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function savePost(payload: { date: string; platform: PlatformKey; posted: boolean; postUrl?: string; notes?: string; screenshot?: File | null; removeScreenshot?: boolean }) {
  const formData = new FormData();
  formData.append("date", payload.date);
  formData.append("platform", payload.platform);
  formData.append("posted", String(payload.posted));
  formData.append("postUrl", payload.postUrl ?? "");
  formData.append("notes", payload.notes ?? "");
  formData.append("removeScreenshot", String(payload.removeScreenshot ?? false));
  if (payload.screenshot) formData.append("screenshot", payload.screenshot);
  const response = await fetch("/api/posts", { method: "POST", body: formData });
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(data?.error ?? "We couldn't save this post.");
  }
  return (await response.json()) as { post: SocialPost };
}
