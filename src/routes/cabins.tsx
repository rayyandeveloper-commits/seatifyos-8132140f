import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Trash2, History as HistoryIcon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { Modal, useModal } from "@/components/ui-blocks/Modal";
import {
  useCabins, useStudents, useAddCabin, useDeleteCabin, useUpdateCabin,
  cabinStatusOf, type CabinStatus,
} from "@/lib/queries";
import { CabinHistoryModal } from "@/components/cabin/CabinHistoryModal";

export const Route = createFileRoute("/cabins")({
  head: () => ({ meta: [{ title: "Cabins — Study Lounge OS" }] }),
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
  const updateCabin = useUpdateCabin();
  const delCabin = useDeleteCabin();
  const addModal = useModal();
  const editModal = useModal();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [historyCabin, setHistoryCabin] = useState<{ id: string; name: string } | null>(null);

  const enriched = cabins.map((c) => {
    const student = students.find((s) => s.cabin_id === c.id);
    const status: CabinStatus = student ? cabinStatusOf(student.due_date) : "available";
    return { ...c, student, status };
  });
  const filtered = active === "all" ? enriched : enriched.filter((c) => c.status === active);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter a cabin name (A12, VIP-01, 7, …)");
    try {
      await addCabin.mutateAsync(name);
      toast.success(`Cabin ${name} added`);
      setName(""); addModal.hide();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateCabin.mutateAsync({ id: editing.id, name: editing.name.trim() });
      toast.success("Cabin renamed");
      editModal.hide();
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
              transition={{ duration: 0.25, delay: (i % 12) * 0.02 }} whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl glass p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cabin</div>
                  <div className="font-display text-2xl font-semibold">{c.name}</div>
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
              <button
                onClick={() => setHistoryCabin({ id: c.id, name: c.name })}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg glass py-1.5 text-[11px] text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
                <HistoryIcon className="h-3 w-3" /> View History
              </button>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => { setEditing({ id: c.id, name: c.name }); editModal.show(); }}
                  className="grid h-7 w-7 place-items-center rounded-lg glass hover:bg-white/5">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={async () => {
                  if (!confirm(`Delete Cabin ${c.name}? History is preserved.`)) return;
                  await delCabin.mutateAsync(c.id);
                  toast.success("Cabin deleted");
                }} className="grid h-7 w-7 place-items-center rounded-lg glass hover:bg-white/5">
                  <Trash2 className="h-3.5 w-3.5 text-[oklch(0.85_0.20_25)]" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal open={addModal.open} onClose={addModal.hide} title="Add cabin">
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Cabin name</div>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl glass px-3.5 py-2.5 text-sm outline-none" placeholder="A12, VIP-01, 7…" />
          </label>
          <button type="submit" disabled={addCabin.isPending}
            className="w-full rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white glow-violet disabled:opacity-60">
            {addCabin.isPending ? "Adding…" : "Add cabin"}
          </button>
        </form>
      </Modal>

      <Modal open={editModal.open} onClose={editModal.hide} title="Rename cabin">
        <form onSubmit={submitEdit} className="space-y-4">
          <label className="block">
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Cabin name</div>
            <input autoFocus value={editing?.name ?? ""} onChange={(e) => setEditing((p) => p ? { ...p, name: e.target.value } : p)}
              className="w-full rounded-xl glass px-3.5 py-2.5 text-sm outline-none" />
          </label>
          <button type="submit" disabled={updateCabin.isPending}
            className="w-full rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white glow-violet disabled:opacity-60">
            {updateCabin.isPending ? "Saving…" : "Save"}
          </button>
        </form>
      </Modal>

      <CabinHistoryModal
        open={!!historyCabin}
        onClose={() => setHistoryCabin(null)}
        cabinId={historyCabin?.id ?? null}
        cabinName={historyCabin?.name ?? null}
      />
    </Shell>
  );
}
