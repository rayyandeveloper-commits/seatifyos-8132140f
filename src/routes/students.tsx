import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Download, MessageCircle, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { students } from "@/lib/mock-data";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students — The Reading Lodge" },
      { name: "description", content: "Manage every student, cabin assignment, and renewal." },
    ],
  }),
  component: Students,
});

function Students() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "due">("all");

  const rows = useMemo(() => {
    return students.filter(s => {
      const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || String(s.cabin).includes(q);
      const matchF = filter === "all" || (filter === "paid" ? s.paid : !s.paid);
      return matchQ && matchF;
    });
  }, [q, filter]);

  return (
    <Shell title="Student Management" subtitle={`${students.length} active members`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl glass px-3 py-2 md:max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or cabin…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={filter} onChange={(e) => setFilter(e.target.value as "all" | "paid" | "due")}
          className="rounded-xl glass px-3 py-2 text-sm outline-none"
        >
          <option value="all" className="bg-[oklch(0.20_0.03_270)]">All payments</option>
          <option value="paid" className="bg-[oklch(0.20_0.03_270)]">Paid</option>
          <option value="due" className="bg-[oklch(0.20_0.03_270)]">Due</option>
        </select>
        <button className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-sm hover:bg-white/5">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
        <div className="ml-auto flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-sm hover:bg-white/5">
            <Download className="h-4 w-4" /> Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3 py-2 text-sm font-medium text-white glow-violet">
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="mt-6 overflow-hidden rounded-2xl glass"
      >
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Cabin</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Renewal</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-[11px] font-semibold text-white">{s.avatar}</div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">#{s.cabin.toString().padStart(2,"0")}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.phone}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.joinedAt}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.renewalAt}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${
                      s.paid ? "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]" : "bg-[oklch(0.82_0.17_80/0.15)] text-[oklch(0.92_0.17_80)]"
                    }`}>{s.paid ? "Paid" : "Due"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="inline-flex h-8 items-center gap-1.5 rounded-lg glass px-2.5 text-xs hover:bg-white/5">
                      <MessageCircle className="h-3.5 w-3.5 text-[oklch(0.78_0.18_155)]" /> WhatsApp
                    </button>
                  </td>
                </motion.tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No students match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </Shell>
  );
}
