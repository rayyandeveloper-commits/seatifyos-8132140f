import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BellRing, Clock, MessageCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import {
  useStudents, useCabins, useSettings, cabinStatusOf, whatsappLink, fillTemplate, type Student,
} from "@/lib/queries";

export const Route = createFileRoute("/renewals")({
  head: () => ({ meta: [{ title: "Renewals — Study Lounge OS" }] }),
  component: Renewals,
});

function Renewals() {
  const { data: students = [] } = useStudents();
  const { data: cabins = [] } = useCabins();
  const { data: settings } = useSettings();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysFromToday = (d: string | null) => {
    if (!d) return Infinity;
    const x = new Date(d); x.setHours(0, 0, 0, 0);
    return Math.round((x.getTime() - today.getTime()) / 86400000);
  };

  const dueToday = students.filter((s) => daysFromToday(s.due_date) === 0);
  const dueWeek = students.filter((s) => { const d = daysFromToday(s.due_date); return d >= 0 && d <= 7; });
  const overdue = students.filter((s) => daysFromToday(s.due_date) < 0);
  const active = students.filter((s) => cabinStatusOf(s.due_date) === "occupied");

  const alerts = [
    { icon: BellRing, tone: "violet" as const, title: `${dueToday.length} Due Today`, sub: "Send reminders now" },
    { icon: AlertTriangle, tone: "warning" as const, title: `${overdue.length} Overdue`, sub: "Members past renewal date" },
    { icon: Clock, tone: "cyan" as const, title: `${dueWeek.length} This Week`, sub: "Plan reminders ahead" },
    { icon: CheckCircle2, tone: "success" as const, title: `${active.length} Active`, sub: "Memberships up to date" },
  ];
  const toneMap = {
    violet: "from-[oklch(0.65_0.22_295)] to-[oklch(0.55_0.20_260)]",
    warning: "from-[oklch(0.82_0.17_80)] to-[oklch(0.70_0.20_45)]",
    cyan: "from-[oklch(0.75_0.16_200)] to-[oklch(0.55_0.18_230)]",
    success: "from-[oklch(0.72_0.18_155)] to-[oklch(0.55_0.16_185)]",
  };

  return (
    <Shell title="Renewal Alerts" subtitle="Stay ahead of every expiry.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {alerts.map((a, i) => (
          <motion.div key={a.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }} whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-2xl glass p-5">
            <div className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${toneMap[a.tone]} opacity-25 blur-2xl`} />
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${toneMap[a.tone]} text-white`}>
              <a.icon className="h-4.5 w-4.5" />
            </div>
            <div className="mt-4 font-display text-xl font-semibold leading-tight">{a.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{a.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RenewalList title="Due in the next 7 days" rows={dueWeek} cabins={cabins} settings={settings} />
        <RenewalList title="Overdue" rows={overdue} cabins={cabins} settings={settings} tone="warn" />
      </div>
    </Shell>
  );
}

function RenewalList({
  title, rows, cabins, settings, tone = "default",
}: {
  title: string; rows: Student[]; cabins: { id: string; name: string }[];
  settings: { reminder_template: string } | null | undefined; tone?: "default" | "warn";
}) {
  const tpl = settings?.reminder_template ?? "Hello {name}, your seat is due {when}.";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-2xl glass p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{rows.length} members</span>
      </div>
      <div className="mt-4 divide-y divide-white/5">
        {rows.map((s) => {
          const cabin = cabins.find((c) => c.id === s.cabin_id);
          const link = whatsappLink(s.whatsapp ?? s.phone, fillTemplate(tpl, { name: s.name, when: s.due_date ?? "soon", cabin: cabin?.name ?? "—" }));
          return (
            <div key={s.id} className="flex items-center gap-3 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-xs font-semibold text-white">
                {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{s.name}</div>
                <div className="truncate text-xs text-muted-foreground">{cabin ? `Cabin ${cabin.name}` : "—"} · {s.phone}</div>
              </div>
              <div className={`text-xs ${tone === "warn" ? "text-[oklch(0.85_0.20_25)]" : "text-[oklch(0.92_0.17_80)]"}`}>{s.due_date ?? "—"}</div>
              <a href={link} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/5">
                <MessageCircle className="h-3.5 w-3.5 text-[oklch(0.78_0.18_155)]" />
              </a>
            </div>
          );
        })}
        {rows.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">All clear ✨</div>}
      </div>
    </motion.div>
  );
}
