import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Phone, Calendar, History } from "lucide-react";
import { useCabinHistory, type CabinHistory } from "@/lib/queries";

const statusStyle: Record<CabinHistory["status"], { dot: string; chip: string; label: string }> = {
  active: { dot: "bg-[oklch(0.75_0.16_200)]", chip: "bg-[oklch(0.75_0.16_200/0.15)] text-[oklch(0.85_0.16_200)]", label: "Current" },
  completed: { dot: "bg-[oklch(0.72_0.18_155)]", chip: "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]", label: "Completed" },
  transferred: { dot: "bg-[oklch(0.70_0.20_295)]", chip: "bg-[oklch(0.70_0.20_295/0.15)] text-[oklch(0.85_0.18_295)]", label: "Transferred" },
  expired: { dot: "bg-[oklch(0.65_0.24_25)]", chip: "bg-[oklch(0.65_0.24_25/0.15)] text-[oklch(0.85_0.20_25)]", label: "Expired" },
};

function durationLabel(a: string | null, b: string | null) {
  if (!a) return "—";
  const start = new Date(a);
  const end = b ? new Date(b) : new Date();
  const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.round(days / 30);
  return `${months} mo`;
}

export function CabinHistoryModal({
  open,
  onClose,
  cabinId,
  cabinName,
}: {
  open: boolean;
  onClose: () => void;
  cabinId: string | null;
  cabinName: string | null;
}) {
  const { data: history = [], isLoading } = useCabinHistory(cabinId ?? undefined);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = [...history].sort((a, b) => (a.assigned_date ?? "").localeCompare(b.assigned_date ?? ""));
    if (!q) return list.reverse();
    return list
      .reverse()
      .filter((h) => h.student_name.toLowerCase().includes(q.toLowerCase()) || h.phone?.includes(q));
  }, [history, q]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(96vw,780px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl glass-strong shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary glow-violet">
                <History className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Cabin History</div>
                <div className="truncate font-display text-lg font-semibold tracking-tight">
                  {cabinName ? `Cabin ${cabinName}` : "All cabins"} · {rows.length} record{rows.length === 1 ? "" : "s"}
                </div>
              </div>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-white/5 px-6 py-3">
              <div className="flex items-center gap-2 rounded-xl glass px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search student or phone…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5 scrollbar-thin">
              {isLoading && <div className="py-12 text-center text-sm text-muted-foreground">Loading history…</div>}
              {!isLoading && rows.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No history yet for this cabin.</div>
              )}

              <ol className="relative border-l border-white/10 pl-6">
                {rows.map((h, i) => {
                  const s = statusStyle[h.status];
                  return (
                    <motion.li
                      key={h.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="relative mb-5"
                    >
                      <span className={`absolute -left-[31px] top-2 grid h-4 w-4 place-items-center rounded-full ${s.dot} shadow-[0_0_14px_currentColor]`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      <div className="rounded-2xl glass p-4 transition hover:bg-white/[0.04]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-xs font-semibold text-white">
                              {h.student_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{h.student_name}</div>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Phone className="h-3 w-3" /> {h.phone ?? "—"}
                              </div>
                            </div>
                          </div>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${s.chip}`}>
                            {s.label}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-[oklch(0.78_0.18_155)]" />
                            From {h.assigned_date ?? "—"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-[oklch(0.92_0.17_80)]" />
                            Due {h.due_date ?? "—"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-[oklch(0.85_0.20_25)]" />
                            Vacated {h.vacated_date ?? (h.status === "active" ? "—" : "—")}
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Duration: <span className="text-foreground">{durationLabel(h.assigned_date, h.vacated_date)}</span>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
