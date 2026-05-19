import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { Modal, useModal } from "@/components/ui-blocks/Modal";
import {
  useCabins, useStudents, useAddCabin, useDeleteCabin, cabinStatusOf, type CabinStatus,
} from "@/lib/queries";

export const Route = createFileRoute("/cabins")({
  head: () => ({ meta: [{ title: "Cabins — The Reading Lodge" }] }),
  component: Cabins,
});

const filters: { key: "all" | CabinStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "occupied", label: "Occupied" },
  { key: "due_soon", label: "Due Soon" },
  { key: "overdue", label: "Overdue" },
];

const style: Record<CabinStatus, { dot: string; chip: string; label: string }> = {
  available: { dot: "bg-[oklch(0.72_0.18_155)]", chip: "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]", label: "Available" },
  occupied: { dot: "bg-[oklch(0.75_0.16_200)]", chip: "bg-[oklch(0.75_0.16_200/0.15)] text-[oklch(0.85_0.16_200)]", label: "Occupied" },
  due_soon: { dot: "bg-[oklch(0.82_0.17_80)]", chip: "bg-[oklch(0.82_0.17_80/0.15)] text-[oklch(0.92_0.17_80)]", label: "Due Soon" },
  overdue: { dot: "bg-[oklch(0.65_0.24_25)]", chip: "bg-[oklch(0.65_0.24_25/0.15)] text-[oklch(0.85_0.20_25)]", label: "Overdue" },
};

function Cabins() {
  const [active, setActive] = useState<"all" | CabinStatus>("all");
  const { data: cabins = [] } = useCabins();
  const { data: students = [] } = useStudents();
  const addCabin = useAddCabin();
  const delCabin = useDeleteCabin();
  const addModal = useModal();
  const [num, setNum] = useState("");

  const enriched = cabins.map((c) => {
    const student = students.find((s) => s.cabin_id === c.id);
    const status: CabinStatus = student ? cabinStatusOf(student.due_date) : "available";
    return { ...c, student, status };
  });
  const filtered = active === "all" ? enriched : enriched.filter((c) => c.status === active);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(num, 10);
    if (!n || n < 1) return toast.error("Enter a valid cabin number");
    try {
      await addCabin.mutateAsync(n);
      toast.success(`Cabin ${n} added`);
      setNum(""); addModal.hide();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <Shell title="Cabin Management" subtitle={`${cabins.length} cabins`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl glass p-1">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setActive(f.key)}
              className={`relative rounded-lg px-3 py-1.5 text-sm transition ${active === f.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {active === f.key && <motion.span layoutId="cabin-tab" className="absolute inset-0 -z-0 rounded-lg bg-white/10" />}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>
        <button onClick={addModal.show} className="inline-flex items-center gap-2 rounded-xl gradient-primary px-3 py-2 text-sm font-medium text-white glow-violet">
          <Plus className="h-4 w-4" /> Add Cabin
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-2xl glass p-10 text-center text-sm text-muted-foreground">
          {cabins.length === 0 ? "No cabins yet. Add your first cabin." : "No cabins match this filter."}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {filtered.map((c, i) => {
          const s = style[c.status];
          return (
            <motion.div key={c.id} initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25, delay: (i % 12) * 0.02 }} whileHover={{ y: -3 }}
              className="group relative overflow-hidden rounded-2xl glass p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cabin</div>
                  <div className="font-display text-2xl font-semibold">{c.number.toString().padStart(2, "0")}</div>
                </div>
                <span className={`h-2.5 w-2.5 rounded-full ${s.dot} shadow-[0_0_12px_currentColor]`} />
              </div>
              <div className={`mt-3 inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${s.chip}`}>{s.label}</div>
              <div className="mt-3 min-h-[2.5rem] text-xs text-muted-foreground">
                {c.student ? (
                  <>
                    <div className="truncate text-foreground">{c.student.name}</div>
                    {c.student.due_date && <div>Due {c.student.due_date}</div>}
                  </>
                ) : <div>Ready to assign</div>}
              </div>
              <button onClick={async () => {
                if (!confirm(`Delete Cabin ${c.number}?`)) return;
                await delCabin.mutateAsync(c.id);
                toast.success("Cabin deleted");
              }} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg glass opacity-0 transition-opacity hover:bg-white/5 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5 text-[oklch(0.85_0.20_25)]" />
              </button>
            </motion.div>
          );
        })}
      </div>

      <Modal open={addModal.open} onClose={addModal.hide} title="Add cabin">
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Cabin number</div>
            <input autoFocus type="number" min={1} value={num} onChange={(e) => setNum(e.target.value)}
              className="w-full rounded-xl glass px-3.5 py-2.5 text-sm outline-none" placeholder="e.g. 1" />
          </label>
          <button type="submit" disabled={addCabin.isPending}
            className="w-full rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white glow-violet disabled:opacity-60">
            {addCabin.isPending ? "Adding…" : "Add cabin"}
          </button>
        </form>
      </Modal>
    </Shell>
  );
}
