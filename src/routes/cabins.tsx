import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Filter } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { cabins, type CabinStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/cabins")({
  head: () => ({
    meta: [
      { title: "Cabins — The Reading Lodge" },
      { name: "description", content: "Visualise every cabin's occupancy and renewals at a glance." },
    ],
  }),
  component: Cabins,
});

const filters: { key: "all" | CabinStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "occupied", label: "Occupied" },
  { key: "renewal", label: "Renewal" },
];

const statusStyle: Record<CabinStatus, { dot: string; chip: string; bg: string; label: string }> = {
  available: {
    dot: "bg-[oklch(0.72_0.18_155)]",
    chip: "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)] border-[oklch(0.72_0.18_155/0.35)]",
    bg: "from-[oklch(0.72_0.18_155/0.10)] to-transparent",
    label: "Available",
  },
  occupied: {
    dot: "bg-[oklch(0.65_0.24_25)]",
    chip: "bg-[oklch(0.65_0.24_25/0.15)] text-[oklch(0.85_0.20_25)] border-[oklch(0.65_0.24_25/0.35)]",
    bg: "from-[oklch(0.65_0.24_25/0.10)] to-transparent",
    label: "Occupied",
  },
  renewal: {
    dot: "bg-[oklch(0.82_0.17_80)]",
    chip: "bg-[oklch(0.82_0.17_80/0.15)] text-[oklch(0.92_0.17_80)] border-[oklch(0.82_0.17_80/0.35)]",
    bg: "from-[oklch(0.82_0.17_80/0.12)] to-transparent",
    label: "Renewal Due",
  },
};

function Cabins() {
  const [active, setActive] = useState<"all" | CabinStatus>("all");
  const filtered = active === "all" ? cabins : cabins.filter(c => c.status === active);

  return (
    <Shell title="Cabin Management" subtitle="24 study cabins · live status">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl glass p-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`relative rounded-lg px-3 py-1.5 text-sm transition ${active === f.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {active === f.key && (
                <motion.span layoutId="cabin-tab" className="absolute inset-0 -z-0 rounded-lg bg-white/10" />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-sm hover:bg-white/5">
            <Filter className="h-4 w-4" /> Floor
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3 py-2 text-sm font-medium text-white glow-violet">
            <Plus className="h-4 w-4" /> Add Cabin
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {filtered.map((c, i) => {
          const s = statusStyle[c.status];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (i % 12) * 0.03 }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-2xl glass p-4 transition-shadow hover:glow-violet`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.bg}`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cabin</div>
                  <div className="font-display text-2xl font-semibold">{c.number.toString().padStart(2, "0")}</div>
                </div>
                <span className={`grid h-7 w-7 place-items-center rounded-full ${s.dot} shadow-[0_0_18px_currentColor] opacity-90`} />
              </div>
              <div className={`relative mt-3 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${s.chip}`}>{s.label}</div>
              <div className="relative mt-3 min-h-[2.5rem] text-xs text-muted-foreground">
                {c.student ? (
                  <>
                    <div className="truncate text-foreground">{c.student}</div>
                    {c.renewalIn && <div className="text-[oklch(0.92_0.17_80)]">Renewal {c.renewalIn}</div>}
                  </>
                ) : (
                  <div>Ready to assign</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Shell>
  );
}
