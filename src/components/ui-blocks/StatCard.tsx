import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  accent?: "violet" | "cyan" | "success" | "warning";
  index?: number;
}

const accentMap = {
  violet: "from-[oklch(0.65_0.22_295)] to-[oklch(0.55_0.20_260)]",
  cyan: "from-[oklch(0.75_0.16_200)] to-[oklch(0.55_0.18_230)]",
  success: "from-[oklch(0.72_0.18_155)] to-[oklch(0.55_0.16_185)]",
  warning: "from-[oklch(0.82_0.17_80)] to-[oklch(0.70_0.20_45)]",
} as const;

export function StatCard({ label, value, delta, icon: Icon, accent = "violet", index = 0 }: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl glass p-5"
    >
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${accentMap[accent]} opacity-25 blur-2xl transition-opacity group-hover:opacity-40`} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accentMap[accent]} text-white shadow-lg`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${positive ? "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]" : "bg-[oklch(0.65_0.24_25/0.15)] text-[oklch(0.80_0.20_25)]"}`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
