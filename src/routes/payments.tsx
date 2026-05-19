import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell,
} from "recharts";
import { ArrowUpRight, Download, Wallet, CheckCircle2, Clock4 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { StatCard } from "@/components/ui-blocks/StatCard";
import { revenueData, students, transactions } from "@/lib/mock-data";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments — The Reading Lodge" },
      { name: "description", content: "Track revenue, paid members, and transaction history." },
    ],
  }),
  component: Payments,
});

function Payments() {
  const paid = students.filter(s => s.paid).length;
  const due = students.length - paid;

  return (
    <Shell title="Payments" subtitle="Revenue, receipts & outstanding balances">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="This Month" value="₹91,200" delta={12.4} icon={Wallet} accent="violet" index={0} />
        <StatCard label="Paid Members" value={paid} delta={6.1} icon={CheckCircle2} accent="success" index={1} />
        <StatCard label="Pending" value={due} delta={-3.4} icon={Clock4} accent="warning" index={2} />
        <StatCard label="Avg ARPU" value="₹1,650" delta={2.3} icon={ArrowUpRight} accent="cyan" index={3} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="lg:col-span-2 rounded-2xl glass p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Earnings</div>
              <div className="mt-1 font-display text-3xl font-semibold">₹91,200</div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg glass px-3 py-1.5 text-xs hover:bg-white/5">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="pay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.75 0.16 200)" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="oklch(0.75 0.16 200)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="m" stroke="oklch(0.7 0.03 270)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v)=>`₹${v/1000}k`} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.03 270 / 0.9)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
                <Area type="monotone" dataKey="v" stroke="oklch(0.82 0.15 200)" strokeWidth={2.5} fill="url(#pay)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl glass p-6"
        >
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Paid vs Pending</div>
          <div className="mt-2 h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: "Paid", v: paid }, { name: "Pending", v: due }]} dataKey="v" innerRadius={60} outerRadius={88} stroke="none" paddingAngle={3}>
                  <Cell fill="oklch(0.72 0.18 155)" />
                  <Cell fill="oklch(0.82 0.17 80)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <Legend color="oklch(0.72 0.18 155)" label="Paid" value={paid} />
            <Legend color="oklch(0.82 0.17 80)" label="Pending" value={due} />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-6 overflow-hidden rounded-2xl glass"
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-display text-base font-semibold">Transaction history</h3>
          <button className="text-xs text-muted-foreground hover:text-foreground">View all</button>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-6 py-3 font-medium">{t.student}</td>
                  <td className="px-6 py-3 text-muted-foreground">{t.method}</td>
                  <td className="px-6 py-3 text-muted-foreground">{t.date}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${
                      t.status === "paid" ? "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]" : "bg-[oklch(0.82_0.17_80/0.15)] text-[oklch(0.92_0.17_80)]"
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold">₹{t.amount.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </Shell>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
