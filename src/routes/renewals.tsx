import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BellRing, Clock, MessageCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { students } from "@/lib/mock-data";

export const Route = createFileRoute("/renewals")({
  head: () => ({
    meta: [
      { title: "Renewals — The Reading Lodge" },
      { name: "description", content: "Track renewals due today, this week, and overdue payments." },
    ],
  }),
  component: Renewals,
});

function Renewals() {
  const today = new Date();
  const within = (s: typeof students[number], days: number) => {
    const diff = Math.ceil((new Date(s.renewalAt).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= days;
  };
  const dueToday = students.filter(s => within(s, 0));
  const dueWeek = students.filter(s => within(s, 7));
  const pending = students.filter(s => !s.paid);
  const overdue = students.filter(s => new Date(s.renewalAt) < today);

  const alerts = [
    { icon: BellRing, tone: "violet", title: `${dueToday.length || 4} Renewals Due Today`, sub: "Send reminders before 8pm" },
    { icon: AlertTriangle, tone: "warning", title: `${pending.length} Payments Pending`, sub: "Outstanding ₹14,400 across members" },
    { icon: Clock, tone: "cyan", title: `${dueWeek.length} Renewals This Week`, sub: "Plan WhatsApp campaign for Friday" },
    { icon: CheckCircle2, tone: "success", title: `${students.length - pending.length} Members Paid`, sub: "Auto receipts sent on UPI" },
  ] as const;

  const toneMap = {
    violet: "from-[oklch(0.65_0.22_295)] to-[oklch(0.55_0.20_260)]",
    warning: "from-[oklch(0.82_0.17_80)] to-[oklch(0.70_0.20_45)]",
    cyan: "from-[oklch(0.75_0.16_200)] to-[oklch(0.55_0.18_230)]",
    success: "from-[oklch(0.72_0.18_155)] to-[oklch(0.55_0.16_185)]",
  };

  return (
    <Shell title="Renewal Alerts" subtitle="Stay ahead of every expiry and payment.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {alerts.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-2xl glass p-5"
          >
            <div className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${toneMap[a.tone]} opacity-25 blur-2xl`} />
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${toneMap[a.tone]} text-white`}>
              <a.icon className="h-4.5 w-4.5" />
            </div>
            <div className="mt-4 font-display text-xl font-semibold leading-tight">{a.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{a.sub}</div>
            <button className="mt-4 inline-flex items-center gap-2 rounded-lg glass px-3 py-1.5 text-xs hover:bg-white/5">
              <MessageCircle className="h-3.5 w-3.5 text-[oklch(0.78_0.18_155)]" /> Notify
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RenewalList title="Due in the next 7 days" rows={dueWeek.slice(0, 8)} />
        <RenewalList title="Overdue" rows={overdue.slice(0, 8)} tone="warn" />
      </div>
    </Shell>
  );
}

function RenewalList({ title, rows, tone = "default" }: { title: string; rows: typeof students; tone?: "default" | "warn" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="rounded-2xl glass p-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{rows.length} members</span>
      </div>
      <div className="mt-4 divide-y divide-white/5">
        {rows.map(s => (
          <div key={s.id} className="flex items-center gap-3 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-xs font-semibold text-white">{s.avatar}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{s.name}</div>
              <div className="truncate text-xs text-muted-foreground">Cabin {s.cabin} · {s.phone}</div>
            </div>
            <div className={`text-xs ${tone === "warn" ? "text-[oklch(0.85_0.20_25)]" : "text-[oklch(0.92_0.17_80)]"}`}>{s.renewalAt}</div>
            <button className="grid h-8 w-8 place-items-center rounded-lg glass">
              <MessageCircle className="h-3.5 w-3.5 text-[oklch(0.78_0.18_155)]" />
            </button>
          </div>
        ))}
        {rows.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">All clear ✨</div>}
      </div>
    </motion.div>
  );
}
