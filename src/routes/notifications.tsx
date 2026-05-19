import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Inbox, CheckCheck } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { useNotifications, useMarkNotificationRead } from "@/lib/queries";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — The Reading Lodge" }] }),
  component: Notifications,
});

function Notifications() {
  const { data: notifs = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <Shell title="Notifications" subtitle="Reminder logs & due alerts.">
      <div className="rounded-2xl glass p-6">
        {isLoading && <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && notifs.length === 0 && (
          <div className="py-14 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <div className="mt-3 text-sm font-medium">No notifications yet</div>
            <div className="mt-1 text-xs text-muted-foreground">The daily check runs at 8:00 AM and will log due/overdue members here.</div>
          </div>
        )}
        <ol className="divide-y divide-white/5">
          {notifs.map((n, i) => (
            <motion.li key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.01 }}
              className="flex items-start gap-3 py-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                n.type === "overdue" ? "bg-[oklch(0.85_0.20_25)]"
                : n.type === "due_today" ? "bg-[oklch(0.92_0.17_80)]"
                : "gradient-primary"
              }`} />
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.message}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()} · {n.type}</div>
              </div>
              {!n.read && (
                <button onClick={() => markRead.mutate(n.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg glass px-2.5 text-xs hover:bg-white/5">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark read
                </button>
              )}
            </motion.li>
          ))}
        </ol>
      </div>
    </Shell>
  );
}
