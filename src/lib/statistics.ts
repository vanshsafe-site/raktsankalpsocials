import { eachDayOfInterval, endOfMonth, format, isAfter, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { PLATFORMS, type PlatformKey, type SocialPost } from "./platforms";
import { toDateKey } from "./date-utils";

export type DaySummary = { date: string; completed: number; total: number; posts: SocialPost[] };

export function groupPosts(posts: SocialPost[]) {
  return posts.reduce<Record<string, SocialPost[]>>((result, post) => {
    result[post.date] = [...(result[post.date] ?? []), post];
    return result;
  }, {});
}

export function getDaySummary(date: string, grouped: Record<string, SocialPost[]>): DaySummary {
  const dayPosts = grouped[date] ?? [];
  return { date, completed: dayPosts.filter((post) => post.posted).length, total: PLATFORMS.length, posts: dayPosts };
}

export function calculateStats(posts: SocialPost[], month: Date) {
  const grouped = groupPosts(posts);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const completedDays = days.filter((day) => getDaySummary(toDateKey(day), grouped).completed === PLATFORMS.length).length;
  const platformCounts = Object.fromEntries(PLATFORMS.map(({ key }) => [key, posts.filter((post) => post.platform === key && post.posted).length])) as Record<PlatformKey, number>;
  const today = startOfDay(new Date());
  let streak = 0;
  let cursor = today;
  while (!isAfter(startOfMonth(month), cursor) && cursor >= startOfMonth(month)) {
    const summary = getDaySummary(toDateKey(cursor), grouped);
    if (summary.completed !== PLATFORMS.length) break;
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  const completedPlatforms = posts.filter((post) => post.posted).length;
  return { completedDays, platformCounts, completedPlatforms, rate: Math.round((completedDays / days.length) * 100), streak, daysInMonth: days.length };
}

export function isTodayKey(value: string) {
  return isSameDay(parseDate(value), new Date());
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

export function formatMonthTitle(date: Date) {
  return format(date, "MMMM yyyy");
}
