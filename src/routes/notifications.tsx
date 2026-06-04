import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Inbox, CheckCheck, Send, AlertCircle, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { SkeletonCard } from "@/components/ui-blocks/SkeletonCard";
import {
  useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useReminderLogs,
} from "@/lib/queries";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Study Lounge OS" }] }),
  component: Notifications,
});

function Notifications() {
  const [tab, setTab] = useState<"alerts" | "reminders">("alerts");
  const { data: notifs = [], isLoading } = useNotifications();
  const { data: logs = [], isLoading: lLoad } = useReminderLogs();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = notifs.filter((n) => !n.read).length;

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all read");
    }
  };

  return (
    <Shell title="Notifications" subtitle="System alerts & WhatsApp delivery logs.">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-1 rounded-xl glass p-1">
          {(["alerts", "reminders"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative rounded-lg px-3 py-1.5 text-sm transition ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {tab === t && (
                <motion.span layoutId="notif-tab" className="absolute inset-0 -z-0 rounded-lg bg-white/10" />
              )}
              <span className="relative z-10 capitalize">
                {t === "alerts" ? "System alerts" : "Reminder logs"}
              </span>
              {t === "alerts" && unread > 0 && (
                <span className="relative z-10 ml-1.5 rounded-full bg-[color:var(--color-destructive)] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "alerts" && unread > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markAll.isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl glass px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="rounded-2xl glass p-6">
        {tab === "alerts" ? (
          <>
            {isLoading && <SkeletonCard lines={6} />}
            {!isLoading && notifs.length === 0 && (
              <div className="py-14 text-center">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
                <div className="mt-3 text-sm font-medium">No notifications yet</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  The daily 8 AM check logs due/overdue members here.
                </div>
              </div>
            )}
            {!isLoading && notifs.length > 0 && (
              <ol className="divide-y divide-white/5">
                {notifs.map((n, i) => (
                  <motion.li key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.01 }}
                    className="flex items-start gap-3 py-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.type === "overdue" ? "bg-[oklch(0.85_0.20_25)]"
                      : n.type === "due_today" ? "bg-[oklch(0.92_0.17_80)]"
                      : "gradient-primary"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                        {n.message}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()} · {n.type}
                      </div>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg glass px-2.5 text-xs hover:bg-white/5 transition"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Mark read
                      </button>
                    )}
                  </motion.li>
                ))}
              </ol>
            )}
          </>
        ) : (
          <>
            {lLoad && <SkeletonCard lines={6} />}
            {!lLoad && logs.length === 0 && (
              <div className="py-14 text-center">
                <Send className="mx-auto h-10 w-10 text-muted-foreground" />
                <div className="mt-3 text-sm font-medium">No reminders sent yet</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Daily 9 AM cron sends WhatsApp reminders for upcoming due dates.
                </div>
              </div>
            )}
            {!lLoad && logs.length > 0 && (
              <ol className="divide-y divide-white/5">
                {logs.map((l, i) => (
                  <motion.li key={l.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.01 }}
                    className="flex items-start gap-3 py-3">
                    <span className={`mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                      l.status === "sent"
                        ? "bg-[oklch(0.72_0.18_155/0.2)] text-[oklch(0.85_0.18_155)]"
                        : "bg-[oklch(0.65_0.24_25/0.2)] text-[oklch(0.85_0.20_25)]"
                    }`}>
                      {l.status === "sent"
                        ? <CheckCheck className="h-3 w-3" />
                        : <AlertCircle className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">{l.message ?? "—"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(l.sent_at).toLocaleString()} · {l.channel} · {l.status}
                        {l.error && (
                          <span className="text-[oklch(0.85_0.20_25)]"> · {l.error}</span>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
