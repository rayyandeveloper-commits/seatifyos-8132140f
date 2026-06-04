import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { Crown, Clock, TrendingUp, PieChart as PieIcon } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { StatCard } from "@/components/ui-blocks/StatCard";
import { SkeletonStatCard } from "@/components/ui-blocks/SkeletonCard";
import { useCabinHistory, useCabins, useStudents } from "@/lib/queries";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Study Lounge OS" }] }),
  component: Analytics,
});

const TOOLTIP_STYLE = {
  background: "oklch(0.18 0.03 270)",
  border: "1px solid oklch(1 0 0 / 0.08)",
  borderRadius: 12,
  fontSize: 12,
};

function Analytics() {
  const { data: history = [], isLoading: hLoad } = useCabinHistory();
  const { data: cabins = [], isLoading: cLoad } = useCabins();
  const { data: students = [], isLoading: sLoad } = useStudents();
  const loading = hLoad || cLoad || sLoad;

  const { perCabin, longest, monthly, utilization } = useMemo(() => {
    const perCabin = new Map<string, { name: string; sessions: number; days: number }>();
    let longest: { name: string; days: number } = { name: "—", days: 0 };
    for (const h of history) {
      const start = h.assigned_date ? new Date(h.assigned_date) : null;
      const end = h.vacated_date ? new Date(h.vacated_date) : new Date();
      const days = start ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000)) : 0;
      const prev = perCabin.get(h.cabin_name) ?? { name: h.cabin_name, sessions: 0, days: 0 };
      prev.sessions += 1;
      prev.days += days;
      perCabin.set(h.cabin_name, prev);
      if (days > longest.days) longest = { name: h.cabin_name, days };
    }
    const monthly = new Map<string, number>();
    for (const h of history) {
      const d = h.assigned_date ? new Date(h.assigned_date) : new Date(h.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthly.set(k, (monthly.get(k) ?? 0) + 1);
    }
    const utilization = cabins.length
      ? Math.round((students.filter((s) => s.cabin_id).length / cabins.length) * 100)
      : 0;
    return { perCabin, longest, monthly, utilization };
  }, [history, cabins, students]);

  const topCabins = [...perCabin.values()].sort((a, b) => b.sessions - a.sessions).slice(0, 8);
  const monthlyData = [...monthly.entries()].sort().map(([k, v]) => ({ month: k.slice(2), assignments: v }));
  const statusBreak = useMemo(() => {
    const c = { active: 0, completed: 0, transferred: 0, expired: 0 };
    for (const h of history) {
      const key = h.status as keyof typeof c;
      if (key in c) c[key] = (c[key] ?? 0) + 1;
    }
    return [
      { name: "Active", value: c.active, fill: "oklch(0.75 0.16 200)" },
      { name: "Completed", value: c.completed, fill: "oklch(0.72 0.18 155)" },
      { name: "Transferred", value: c.transferred, fill: "oklch(0.70 0.20 295)" },
      { name: "Expired", value: c.expired, fill: "oklch(0.65 0.24 25)" },
    ].filter((d) => d.value > 0);
  }, [history]);

  const top = topCabins[0];

  return (
    <Shell title="Analytics" subtitle="Occupancy, utilization & history insights">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Most-used cabin" value={top?.name ?? "—"} icon={Crown} accent="violet" index={0} />
            <StatCard label="Longest occupancy" value={`${longest.days}d`} icon={Clock} accent="cyan" index={1} />
            <StatCard label="Utilization" value={`${utilization}%`} icon={TrendingUp} accent="success" index={2} />
            <StatCard label="Total records" value={history.length} icon={PieIcon} accent="warning" index={3} />
          </>
        )}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl glass p-6">
            <div className="h-4 w-48 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-72 animate-pulse rounded-xl bg-white/5" />
          </div>
          <div className="rounded-2xl glass p-6">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-72 animate-pulse rounded-full bg-white/5" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="lg:col-span-2 rounded-2xl glass p-6">
              <h3 className="font-display text-base font-semibold">Top cabins by assignments</h3>
              {topCabins.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                  No data yet — cabin assignments will appear here.
                </div>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCabins}>
                      <CartesianGrid stroke="oklch(1 0 0 / 0.05)" />
                      <XAxis dataKey="name" stroke="oklch(0.70 0.03 270)" fontSize={11} />
                      <YAxis stroke="oklch(0.70 0.03 270)" fontSize={11} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="sessions" radius={[8, 8, 0, 0]}>
                        {topCabins.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "oklch(0.70 0.22 295)" : "oklch(0.55 0.18 230)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
              className="rounded-2xl glass p-6">
              <h3 className="font-display text-base font-semibold">Status breakdown</h3>
              {statusBreak.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">No data yet.</div>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusBreak} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88}
                        stroke="oklch(0.18 0.03 270)" strokeWidth={3} />
                      <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.70 0.03 270)" }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-4 rounded-2xl glass p-6">
            <h3 className="font-display text-base font-semibold">Monthly assignment trend</h3>
            {monthlyData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Monthly trends appear once you have cabin assignment history.
              </div>
            ) : (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid stroke="oklch(1 0 0 / 0.05)" />
                    <XAxis dataKey="month" stroke="oklch(0.70 0.03 270)" fontSize={11} />
                    <YAxis stroke="oklch(0.70 0.03 270)" fontSize={11} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="assignments" fill="oklch(0.75 0.16 200)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </>
      )}
    </Shell>
  );
}
