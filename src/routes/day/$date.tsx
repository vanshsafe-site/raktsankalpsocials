import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DayEditorPage } from "@/components/tracker-ui";
import { fetchDayPosts } from "@/lib/api";
import { parseDateKey } from "@/lib/date-utils";

export const Route = createFileRoute("/day/$date")({ component: DayPage });

function DayPage() {
  const { date } = Route.useParams();
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  const [posts, setPosts] = useState<Awaited<ReturnType<typeof fetchDayPosts>>["posts"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!validDate) {
      setError("That date is not valid.");
      setLoading(false);
      return;
    }
    void fetchDayPosts(validDate)
      .then((result) => setPosts(result.posts))
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "Unable to load this day."),
      )
      .finally(() => setLoading(false));
    void fetch("/api/auth/session")
      .then((response) => response.json())
      .then((session) => setAdmin(session.authenticated === true));
  }, [validDate]);

  if (loading) return <div className="loading-screen">Loading day...</div>;
  if (error)
    return (
      <div className="error-panel">
        <strong>Day unavailable.</strong>
        <span>{error}</span>
      </div>
    );
  return (
    <DayEditorPage
      date={parseDateKey(validDate) ? validDate : ""}
      initialPosts={posts}
      admin={admin}
    />
  );
}
