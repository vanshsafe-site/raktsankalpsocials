import type { SocialPost } from "./platforms";

export async function fetchReportPosts() {
  // The posts endpoint requires a range. This broad range includes the complete tracker history.
  const response = await fetch("/api/posts?from=2000-01-01&to=2100-12-31");
  if (!response.ok) throw new Error("We couldn't load posts for the report.");
  return (await response.json()) as { posts: SocialPost[] };
}
