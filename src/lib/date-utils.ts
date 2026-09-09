import { format, getDaysInMonth, isValid, parseISO, startOfMonth } from "date-fns";

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
}

export function monthKey(date: Date) {
  return format(date, "yyyy-MM");
}

export function monthBounds(date: Date) {
  const start = startOfMonth(date);
  const end = new Date(start.getFullYear(), start.getMonth(), getDaysInMonth(start));
  return { from: toDateKey(start), to: toDateKey(end) };
}

export function formatLongDate(value: string) {
  return format(parseDateKey(value), "EEEE, MMMM d, yyyy");
}
