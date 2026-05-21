import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Inbox, CheckCheck, Send, AlertCircle } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { useNotifications, useMarkNotificationRead, useReminderLogs } from "@/lib/queries";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Study Lounge OS" }] }),
  component: Notifications,
});

function Notifications() {
  const [tab, setTab] = useState<"alerts" | "reminders">("alerts");
  const { data: notifs = [], isLoading } = useNotifications();
  const { data: logs = [], isLoading: lLoad } = useReminderLogs();
  const markRead = useMarkNotificationRead();

  return (
    <Shell title="Notifications" subtitle="System alerts & WhatsApp delivery logs.">
      <div className="mb-4 flex gap-1 rounded-xl glass p-1 w-fit">
        {(["alerts", "reminders"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`relative rounded-lg px-3 py-1.5 text-sm transition ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === t && <motion.span layoutId="notif-tab" className="absolute inset-0 -z-0 rounded-lg bg-white/10" />}
            <span className="relative z-10 capitalize">{t === "alerts" ? "System alerts" : "Reminder logs"}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl glass p-6">
        {tab === "alerts" ? (
          <>
            {isLoading && <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>}
            {!isLoading && notifs.length === 0 && (
              <div className="py-14 text-center">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
                <div className="mt-3 text-sm font-medium">No notifications yet</div>
                <div className="mt-1 text-xs text-muted-foreground">The daily 8 AM check logs due/overdue members here.</div>
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
          </>
        ) : (
          <>
            {lLoad && <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>}
            {!lLoad && logs.length === 0 && (
              <div className="py-14 text-center">
                <Send className="mx-auto h-10 w-10 text-muted-foreground" />
                <div className="mt-3 text-sm font-medium">No reminders sent yet</div>
                <div className="mt-1 text-xs text-muted-foreground">Daily 9 AM cron sends WhatsApp reminders for upcoming due dates.</div>
              </div>
            )}
            <ol className="divide-y divide-white/5">
              {logs.map((l, i) => (
                <motion.li key={l.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.01 }}
                  className="flex items-start gap-3 py-3">
                  <span className={`mt-1.5 grid h-5 w-5 place-items-center rounded-full shrink-0 ${
                    l.status === "sent" ? "bg-[oklch(0.72_0.18_155/0.2)] text-[oklch(0.85_0.18_155)]" : "bg-[oklch(0.65_0.24_25/0.2)] text-[oklch(0.85_0.20_25)]"
                  }`}>{l.status === "sent" ? <CheckCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{l.message ?? "—"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(l.sent_at).toLocaleString()} · {l.channel} · {l.status}
                      {l.error && <span className="text-[oklch(0.85_0.20_25)]"> · {l.error}</span>}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ol>
          </>
        )}
      </div>
    </Shell>
  );
}
