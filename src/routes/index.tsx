import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Calendar, CalendarData, PageShell, TodayWidget } from "@/components/tracker-ui";
import { parseDateKey } from "@/lib/date-utils";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [month, setMonth] = useState(() => parseDateKey(new Date().toISOString().slice(0, 10)));

  return (
    <CalendarData month={month}>
      {({ posts, loading, error, refresh }) => (
        <PageShell>
          <main className="page-main">
            <div className="page-intro">
              <div>
                <span className="eyebrow">Public tracker</span>
                <h1>Every post, accounted for.</h1>
                <p>Follow Raktsankalp&apos;s daily social presence across every channel.</p>
              </div>
            </div>
            <TodayWidget posts={posts} />
            {loading ? (
              <div className="loading-screen">
                <span className="spin">Loading activity...</span>
              </div>
            ) : error ? (
              <div className="error-panel">
                <strong>Activity is unavailable.</strong>
                <span>{error}</span>
                <button onClick={refresh}>Try again</button>
              </div>
            ) : (
              <Calendar month={month} posts={posts} onMonthChange={setMonth} />
            )}
          </main>
        </PageShell>
      )}
    </CalendarData>
  );
}
