import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  DoorOpen, DoorClosed, BellRing, Users, UserPlus, AlertTriangle,
  TrendingUp, UserX, ArrowRight, RefreshCw, Upload, IndianRupee, Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { StatCard } from "@/components/ui-blocks/StatCard";
import { SkeletonStatCard, SkeletonCard } from "@/components/ui-blocks/SkeletonCard";
import { useCabins, useStudents, useNotifications, usePayments, cabinStatusOf } from "@/lib/queries";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Study Lounge OS" }] }),
  component: Dashboard,
});

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function Dashboard() {
  const { data: cabins = [], isLoading: cLoad } = useCabins();
  const { data: students = [], isLoading: sLoad } = useStudents();
  const { data: notifs = [] } = useNotifications();
  const { data: payments = [], isError: payError } = usePayments();
  const loading = cLoad || sLoad;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

  const occupiedCabinIds = new Set(students.filter((s) => s.cabin_id).map((s) => s.cabin_id!));
  const total = cabins.length;
  const occupied = occupiedCabinIds.size;
  const available = Math.max(0, total - occupied);
  const dueSoon = students.filter((s) => cabinStatusOf(s.due_date) === "due_soon").length;
  const overdue = students.filter((s) => cabinStatusOf(s.due_date) === "overdue").length;
  const totalStudents = students.length;
  const occupancyPct = total > 0 ? Math.min(100, Math.round((occupied / total) * 100)) : 0;

  const payStats = useMemo(() => {
    if (payError || payments.length === 0) return { monthRevenue: 0, outstanding: 0 };
    const monthRevenue = payments
      .filter((p) => p.payment_date >= monthStart && p.status === "paid")
      .reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = payments
      .filter((p) => p.status === "partial" || p.status === "overdue")
      .reduce((s, p) => s + Number(p.amount), 0);
    return { monthRevenue, outstanding };
  }, [payments, payError, monthStart]);

  const recent = students.slice(0, 6);
  const recentNotifs = notifs.slice(0, 8);

  const quickActions = [
    { to: "/students",   label: "Add student",    icon: UserPlus,    color: "from-[oklch(0.65_0.22_295)] to-[oklch(0.55_0.20_260)]" },
    { to: "/payments",   label: "Record payment", icon: IndianRupee, color: "from-[oklch(0.72_0.18_155)] to-[oklch(0.55_0.16_185)]" },
    { to: "/renewals",   label: "View renewals",  icon: BellRing,    color: "from-[oklch(0.82_0.17_80)] to-[oklch(0.70_0.20_45)]" },
    { to: "/attendance", label: "Attendance",     icon: Users,       color: "from-[oklch(0.75_0.16_200)] to-[oklch(0.55_0.18_230)]" },
    { to: "/cabins",     label: "Manage cabins",  icon: DoorOpen,    color: "from-[oklch(0.70_0.20_295)] to-[oklch(0.55_0.18_260)]" },
    { to: "/imports",    label: "Import data",    icon: Upload,      color: "from-[oklch(0.65_0.20_230)] to-[oklch(0.55_0.18_200)]" },
  ] as const;

  return (
    <Shell title="Dashboard" subtitle="Live overview of cabins, students, and finances.">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Cabins"   value={total}           icon={DoorClosed}   accent="violet"  index={0} />
            <StatCard label="Occupied"       value={occupied}        icon={Users}        accent="cyan"    index={1} />
            <StatCard label="Available"      value={available}       icon={DoorOpen}     accent="success" index={2} />
            <StatCard label="Due Soon"       value={dueSoon}         icon={BellRing}     accent="warning" index={3} />
            <StatCard label="Overdue"        value={overdue}         icon={UserX}        accent="warning" index={4} />
            <StatCard label="Occupancy"      value={`${occupancyPct}%`} icon={TrendingUp} accent="violet" index={5} />
            <StatCard label="Monthly Revenue" value={fmt(payStats.monthRevenue)} icon={IndianRupee} accent="success" index={6} />
            <StatCard label="Outstanding"    value={fmt(payStats.outstanding)} icon={Wallet} accent="warning" index={7} />
          </>
        )}
      </div>

      {/* Occupancy bar */}
      {!loading && total > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-4 flex items-center gap-4 rounded-2xl glass px-6 py-3">
          <Users className="h-5 w-5 shrink-0 text-[color:var(--color-cyan)]" />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span><span className="font-semibold">{totalStudents}</span> students enrolled</span>
              <span className="text-muted-foreground">{occupancyPct}% capacity</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${occupancyPct}%` }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="mt-6">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div key={a.to} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }} whileHover={{ y: -3 }}>
                <Link to={a.to}
                  className="flex flex-col items-center gap-2.5 rounded-2xl glass px-3 py-4 text-center transition hover:bg-white/[0.06]">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${a.color}`}>
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="text-xs font-medium leading-tight">{a.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {loading ? (
          <>
            <div className="lg:col-span-2"><SkeletonCard lines={6} /></div>
            <SkeletonCard lines={5} />
          </>
        ) : (
          <>
            {/* Active students */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="lg:col-span-2 rounded-2xl glass p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold">Active students</h3>
                <Link to="/students" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-white glow-violet">
                  <UserPlus className="h-3.5 w-3.5" /> Manage
                </Link>
              </div>
              <div className="mt-4 divide-y divide-white/5">
                {recent.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="text-sm font-medium">No students yet</div>
                    <div className="mt-1 text-xs text-muted-foreground">Add your first member from the Students page.</div>
                  </div>
                ) : (
                  recent.map((s) => {
                    const cabin = cabins.find((c) => c.id === s.cabin_id);
                    const status = cabinStatusOf(s.due_date);
                    return (
                      <div key={s.id} className="flex items-center gap-3 py-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-xs font-semibold text-white">
                          {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{s.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {cabin ? `Cabin ${cabin.name}` : "Unassigned"} · {s.phone}
                          </div>
                        </div>
                        <span className={`hidden shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider sm:inline ${
                          status === "overdue" ? "bg-[oklch(0.65_0.24_25/0.15)] text-[oklch(0.85_0.20_25)]"
                          : status === "due_soon" ? "bg-[oklch(0.82_0.17_80/0.15)] text-[oklch(0.92_0.17_80)]"
                          : "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]"
                        }`}>
                          {s.due_date ? `Due ${s.due_date}` : "No due date"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              {students.length > 6 && (
                <Link to="/students" className="mt-3 flex items-center justify-center gap-1.5 rounded-xl glass py-2 text-xs text-muted-foreground hover:text-foreground transition">
                  View all {students.length} students <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </motion.div>

            {/* Activity feed */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-2xl glass p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold">Recent activity</h3>
                <Link to="/notifications" className="text-[11px] text-muted-foreground hover:text-foreground transition">View all</Link>
              </div>
              <ol className="relative mt-4 space-y-4 border-l border-white/10 pl-4">
                {recentNotifs.length === 0 && (
                  <li className="py-6 text-center text-sm text-muted-foreground">No activity yet.</li>
                )}
                {recentNotifs.map((n) => (
                  <li key={n.id} className="relative">
                    <span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${
                      n.type === "overdue" ? "bg-[oklch(0.85_0.20_25)]"
                      : n.type === "due_today" ? "bg-[oklch(0.92_0.17_80)]"
                      : "gradient-primary"
                    }`} />
                    <div className="text-sm leading-snug">{n.message}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            </motion.div>
          </>
        )}
      </div>

      {/* Alerts */}
      {!loading && total === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-6 flex items-center gap-3 rounded-2xl glass p-5 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[oklch(0.92_0.17_80)]" />
          <span>You haven't added any cabins yet. Add cabins to start tracking occupancy.</span>
          <Link to="/cabins" className="ml-auto shrink-0 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-white glow-violet">Add cabins</Link>
        </motion.div>
      )}

      {!loading && overdue > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-[oklch(0.65_0.24_25/0.3)] bg-[oklch(0.65_0.24_25/0.08)] p-5 text-sm">
          <RefreshCw className="h-5 w-5 shrink-0 text-[oklch(0.85_0.20_25)]" />
          <span><span className="font-semibold text-[oklch(0.85_0.20_25)]">{overdue} members</span> are overdue for renewal.</span>
          <Link to="/renewals" className="ml-auto shrink-0 rounded-lg bg-[oklch(0.65_0.24_25)] px-3 py-1.5 text-xs font-medium text-white">View overdue</Link>
        </motion.div>
      )}
    </Shell>
  );
}
