import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart,
} from "recharts";
import { DoorOpen, DoorClosed, BellRing, Wallet, Users, ArrowUpRight, MessageCircle } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { StatCard } from "@/components/ui-blocks/StatCard";
import { activity, occupancyData, revenueData, stats, students } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — The Reading Lodge" },
      { name: "description", content: "Live overview of cabins, renewals, and revenue." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <Shell title="Dashboard" subtitle="Good evening, Rahul — here's what's happening today.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Cabins" value={stats.totalCabins} delta={0} icon={DoorClosed} accent="violet" index={0} />
        <StatCard label="Occupied" value={stats.occupied} delta={4.2} icon={Users} accent="cyan" index={1} />
        <StatCard label="Available" value={stats.available} delta={-2.1} icon={DoorOpen} accent="success" index={2} />
        <StatCard label="Renewals Due" value={stats.renewalsDue} delta={8.7} icon={BellRing} accent="warning" index={3} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl glass p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Revenue</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="font-display text-3xl font-semibold">₹{stats.monthlyRevenue.toLocaleString("en-IN")}</div>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-[oklch(0.72_0.18_155/0.15)] px-1.5 py-0.5 text-xs font-medium text-[oklch(0.85_0.18_155)]">
                  <ArrowUpRight className="h-3 w-3" /> {stats.monthlyRevenueDelta}%
                </span>
              </div>
            </div>
            <div className="flex gap-1 rounded-lg glass p-1 text-xs">
              {["1M","3M","6M","1Y"].map((t,i)=>(
                <button key={t} className={`rounded-md px-2.5 py-1 ${i===3?"bg-white/10 text-foreground":"text-muted-foreground hover:text-foreground"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.70 0.20 295)" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="oklch(0.70 0.20 295)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="m" stroke="oklch(0.7 0.03 270)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v)=>`₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.22 0.03 270 / 0.9)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, backdropFilter: "blur(12px)" }}
                  labelStyle={{ color: "oklch(0.97 0.01 270)" }}
                  formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="v" stroke="oklch(0.78 0.20 295)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl glass p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Weekly Occupancy</div>
              <div className="mt-1 font-display text-2xl font-semibold">21 / 24</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.75_0.16_200)] to-[oklch(0.55_0.18_230)] text-white">
              <Wallet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer>
              <BarChart data={occupancyData}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="d" stroke="oklch(0.7 0.03 270)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                  contentStyle={{ background: "oklch(0.22 0.03 270 / 0.9)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }}
                />
                <Bar dataKey="o" fill="oklch(0.75 0.16 200)" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl glass p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Recent students</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground">View all</button>
          </div>
          <div className="mt-4 divide-y divide-white/5">
            {students.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-xs font-semibold text-white">{s.avatar}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="truncate text-xs text-muted-foreground">Cabin {s.cabin} · joined {s.joinedAt}</div>
                </div>
                <span className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${
                  s.paid ? "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]" : "bg-[oklch(0.82_0.17_80/0.15)] text-[oklch(0.90_0.17_80)]"
                }`}>{s.paid ? "Paid" : "Due"}</span>
                <button className="grid h-8 w-8 place-items-center rounded-lg glass text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl glass p-6"
        >
          <h3 className="font-display text-base font-semibold">Activity</h3>
          <ol className="relative mt-4 space-y-4 border-l border-white/10 pl-4">
            {activity.map((a, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full gradient-primary glow-violet" />
                <div className="text-sm"><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span></div>
                <div className="text-[11px] text-muted-foreground">{a.when}</div>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </Shell>
  );
}
