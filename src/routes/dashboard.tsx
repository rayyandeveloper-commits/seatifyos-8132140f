import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { DoorOpen, DoorClosed, BellRing, Users, UserPlus, AlertTriangle, TrendingUp, UserX } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { StatCard } from "@/components/ui-blocks/StatCard";
import { useCabins, useStudents, useNotifications, cabinStatusOf } from "@/lib/queries";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Study Lounge OS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: cabins = [] } = useCabins();
  const { data: students = [] } = useStudents();
  const { data: notifs = [] } = useNotifications();

  const occupiedCabinIds = new Set(students.filter((s) => s.cabin_id).map((s) => s.cabin_id!));
  const total = cabins.length;
  const occupied = occupiedCabinIds.size;
  const available = Math.max(0, total - occupied);
  const dueSoon = students.filter((s) => cabinStatusOf(s.due_date) === "due_soon").length;
  const overdue = students.filter((s) => cabinStatusOf(s.due_date) === "overdue").length;
  const totalStudents = students.length;
  const occupancyPct = total > 0 ? Math.min(100, Math.round((occupied / total) * 100)) : 0;

  const recent = students.slice(0, 6);
  const recentNotifs = notifs.slice(0, 6);

  return (
    <Shell title="Dashboard" subtitle="Live overview of cabins, students, and renewals.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Cabins" value={total} icon={DoorClosed} accent="violet" index={0} />
        <StatCard label="Occupied" value={occupied} icon={Users} accent="cyan" index={1} />
        <StatCard label="Available" value={available} icon={DoorOpen} accent="success" index={2} />
        <StatCard label="Due Soon" value={dueSoon} icon={BellRing} accent="warning" index={3} />
        <StatCard label="Overdue" value={overdue} icon={UserX} accent="warning" index={4} />
        <StatCard label="Occupancy" value={`${occupancyPct}%`} icon={TrendingUp} accent="violet" index={5} />
      </div>
      <div className="mt-2 grid gap-4 sm:grid-cols-1 xl:grid-cols-1">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
          className="flex items-center gap-4 rounded-2xl glass px-6 py-3">
          <Users className="h-5 w-5 text-[color:var(--color-cyan)]" />
          <div className="text-sm"><span className="font-semibold">{totalStudents}</span> total students enrolled</div>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="lg:col-span-2 rounded-2xl glass p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Active students</h3>
            <Link to="/students" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-white glow-violet">
              <UserPlus className="h-3.5 w-3.5" /> Manage
            </Link>
          </div>
          <div className="mt-4 divide-y divide-white/5">
            {recent.length === 0 && <EmptyState title="No students yet" body="Add your first member from the Students page." />}
            {recent.map((s) => {
              const cabin = cabins.find((c) => c.id === s.cabin_id);
              return (
                <div key={s.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-xs font-semibold text-white">
                    {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {cabin ? `Cabin ${cabin.number}` : "Unassigned"} · {s.phone}
                    </div>
                  </div>
                  <span className="hidden rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">
                    {s.due_date ? `Due ${s.due_date}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl glass p-6">
          <h3 className="font-display text-base font-semibold">Recent activity</h3>
          <ol className="relative mt-4 space-y-4 border-l border-white/10 pl-4">
            {recentNotifs.length === 0 && <li className="text-sm text-muted-foreground">No notifications yet.</li>}
            {recentNotifs.map((n) => (
              <li key={n.id} className="relative">
                <span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${n.type === "overdue" ? "bg-[oklch(0.85_0.20_25)]" : "gradient-primary"}`} />
                <div className="text-sm">{n.message}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>

      {total === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-6 flex items-center gap-3 rounded-2xl glass p-5 text-sm">
          <AlertTriangle className="h-5 w-5 text-[oklch(0.92_0.17_80)]" />
          <span>You haven't added any cabins yet.</span>
          <Link to="/cabins" className="ml-auto rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-white glow-violet">Add cabins</Link>
        </motion.div>
      )}
    </Shell>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-10 text-center">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{body}</div>
    </div>
  );
}
