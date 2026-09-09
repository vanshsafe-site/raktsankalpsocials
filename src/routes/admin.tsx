import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AdminCalendarPage, AdminGate, CalendarData } from "@/components/tracker-ui";
import { parseDateKey } from "@/lib/date-utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const [month, setMonth] = useState(() => parseDateKey(new Date().toISOString().slice(0, 10)));
  return (
    <AdminGate>
      <CalendarData month={month}>
        {({ posts, loading, error, refresh }) =>
          loading ? (
            <div className="loading-screen">Loading workspace...</div>
          ) : error ? (
            <div className="error-panel">
              <strong>Workspace unavailable.</strong>
              <span>{error}</span>
              <button onClick={refresh}>Try again</button>
            </div>
          ) : (
            <AdminCalendarPage
              month={month}
              posts={posts}
              onMonthChange={setMonth}
              onRefresh={refresh}
            />
          )
        }
      </CalendarData>
    </AdminGate>
  );
}
