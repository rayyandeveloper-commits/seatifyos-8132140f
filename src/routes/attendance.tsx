import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { LogIn, LogOut, Users, Clock, CalendarCheck, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { SkeletonCard } from "@/components/ui-blocks/SkeletonCard";
import {
  useStudents, useTodayAttendance, useCheckIn, useCheckOut,
} from "@/lib/queries";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Study Lounge OS" }] }),
  component: Attendance,
});

function Attendance() {
  const { data: students = [], isLoading: sLoad } = useStudents();
  const { data: logs = [], isLoading: lLoad, isError } = useTodayAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [q, setQ] = useState("");

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const todayStr = new Date().toISOString().slice(0, 10);

  const studentLogMap = useMemo(() => {
    const map = new Map<string, typeof logs[0]>();
    for (const l of logs) map.set(l.student_id, l);
    return map;
  }, [logs]);

  const present = logs.filter((l) => l.check_in && !l.check_out).length;
  const checkedOut = logs.filter((l) => l.check_in && l.check_out).length;
  const notIn = students.length - logs.length;

  const filtered = useMemo(() => students.filter((s) =>
    !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.phone.includes(q),
  ), [students, q]);

  const fmtTime = (ts: string | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  if (isError) {
    return (
      <Shell title="Attendance" subtitle="Daily student check-in / check-out.">
        <div className="rounded-2xl border border-[oklch(0.82_0.17_80/0.3)] bg-[oklch(0.82_0.17_80/0.06)] p-6 text-sm">
          <div className="font-semibold">Database setup required</div>
          <div className="mt-1 text-muted-foreground">
            Run the migration SQL from the <strong>Payments</strong> page (or from <code>supabase/migrations/v2_upgrade.sql</code>) in Supabase SQL Editor first.
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Attendance" subtitle={`Daily check-in & check-out · ${today}`}>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Currently Inside", value: present, icon: Users, color: "from-[oklch(0.72_0.18_155)] to-[oklch(0.55_0.16_185)]" },
          { label: "Checked Out", value: checkedOut, icon: CheckCircle2, color: "from-[oklch(0.75_0.16_200)] to-[oklch(0.55_0.18_230)]" },
          { label: "Not Arrived", value: Math.max(0, notIn), icon: Clock, color: "from-[oklch(0.82_0.17_80)] to-[oklch(0.70_0.20_45)]" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl glass p-5">
              <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${s.color} opacity-20 blur-2xl`} />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="mt-2 font-display text-3xl font-semibold">{s.value}</div>
                </div>
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <div className="mt-6 flex items-center gap-2 rounded-xl glass px-3 py-2 md:max-w-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>

      {/* Student attendance list */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="mt-4 overflow-hidden rounded-2xl glass">
        {sLoad || lLoad ? (
          <SkeletonCard lines={8} />
        ) : (
          <div className="divide-y divide-white/5">
            <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="flex-1">Student</span>
              <span className="w-24 text-center">Check in</span>
              <span className="w-24 text-center">Check out</span>
              <span className="w-28 text-right">Action</span>
            </div>
            {filtered.map((s, i) => {
              const log = studentLogMap.get(s.id);
              const checkedIn = !!log?.check_in;
              const checkedOutDone = !!log?.check_out;

              return (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.18, delay: i * 0.01 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
                  <div className="flex flex-1 items-center gap-3">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-semibold text-white ${checkedIn && !checkedOutDone ? "bg-[oklch(0.72_0.18_155)]" : checkedOutDone ? "bg-white/20" : "gradient-primary"}`}>
                      {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.phone}</div>
                    </div>
                  </div>
                  <div className="w-24 text-center text-sm text-muted-foreground font-mono">
                    {fmtTime(log?.check_in ?? null)}
                  </div>
                  <div className="w-24 text-center text-sm text-muted-foreground font-mono">
                    {fmtTime(log?.check_out ?? null)}
                  </div>
                  <div className="flex w-28 justify-end gap-1.5">
                    {!checkedIn && (
                      <button
                        onClick={async () => {
                          try {
                            await checkIn.mutateAsync(s.id);
                            toast.success(`${s.name} checked in`);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                        disabled={checkIn.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-2.5 py-1.5 text-[11px] font-medium text-white disabled:opacity-60"
                      >
                        <LogIn className="h-3 w-3" /> Check In
                      </button>
                    )}
                    {checkedIn && !checkedOutDone && (
                      <button
                        onClick={async () => {
                          if (!log) return;
                          try {
                            await checkOut.mutateAsync(log.id);
                            toast.success(`${s.name} checked out`);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                        disabled={checkOut.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg glass px-2.5 py-1.5 text-[11px] hover:bg-white/8 disabled:opacity-60"
                      >
                        <LogOut className="h-3 w-3" /> Check Out
                      </button>
                    )}
                    {checkedOutDone && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[oklch(0.72_0.18_155/0.15)] px-2.5 py-1.5 text-[11px] text-[oklch(0.85_0.18_155)]">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No students found.
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Today's log summary */}
      {logs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-4 rounded-2xl glass p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="h-4 w-4 text-[oklch(0.78_0.18_155)]" />
            <h3 className="font-display text-sm font-semibold">Today's log · {todayStr}</h3>
            <span className="ml-auto text-xs text-muted-foreground">{logs.length} entries</span>
          </div>
          <div className="space-y-1.5">
            {logs.map((l) => {
              const stu = students.find((s) => s.id === l.student_id);
              return (
                <div key={l.id} className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs hover:bg-white/4">
                  <span className={`h-1.5 w-1.5 rounded-full ${l.check_out ? "bg-[oklch(0.70_0.03_270)]" : "bg-[oklch(0.72_0.18_155)]"}`} />
                  <span className="font-medium">{l.students?.name ?? stu?.name ?? "—"}</span>
                  <span className="text-muted-foreground">
                    In: {fmtTime(l.check_in)}
                    {l.check_out ? ` · Out: ${fmtTime(l.check_out)}` : " · Still inside"}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </Shell>
  );
}
