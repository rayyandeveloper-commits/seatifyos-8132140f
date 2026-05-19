import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { Modal, useModal } from "@/components/ui-blocks/Modal";
import {
  useStudents, useCabins, useSaveStudent, useDeleteStudent, useSettings,
  cabinStatusOf, whatsappLink, fillTemplate, type Student, type StudentInput,
} from "@/lib/queries";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students — The Reading Lodge" }] }),
  component: Students,
});

function Students() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "due" | "overdue">("all");
  const { data: students = [] } = useStudents();
  const { data: cabins = [] } = useCabins();
  const { data: settings } = useSettings();
  const save = useSaveStudent();
  const del = useDeleteStudent();
  const modal = useModal();
  const [editing, setEditing] = useState<Student | null>(null);

  const usedCabinIds = new Set(students.filter((s) => s.cabin_id && s.id !== editing?.id).map((s) => s.cabin_id!));
  const availableCabins = cabins.filter((c) => !usedCabinIds.has(c.id));

  const rows = useMemo(() => students.filter((s) => {
    const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.phone.includes(q);
    const st = cabinStatusOf(s.due_date);
    const matchF = filter === "all" || (filter === "active" && st === "occupied") || (filter === "due" && st === "due_soon") || (filter === "overdue" && st === "overdue");
    return matchQ && matchF;
  }), [students, q, filter]);

  const openAdd = () => { setEditing(null); modal.show(); };
  const openEdit = (s: Student) => { setEditing(s); modal.show(); };

  return (
    <Shell title="Student Management" subtitle={`${students.length} active members`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl glass px-3 py-2 md:max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-xl glass px-3 py-2 text-sm outline-none">
          <option value="all" className="bg-[oklch(0.20_0.03_270)]">All statuses</option>
          <option value="active" className="bg-[oklch(0.20_0.03_270)]">Active</option>
          <option value="due" className="bg-[oklch(0.20_0.03_270)]">Due Soon</option>
          <option value="overdue" className="bg-[oklch(0.20_0.03_270)]">Overdue</option>
        </select>
        <button onClick={openAdd} className="ml-auto inline-flex items-center gap-2 rounded-xl gradient-primary px-3 py-2 text-sm font-medium text-white glow-violet">
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="mt-6 overflow-hidden rounded-2xl glass">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Cabin</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Assigned</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const cabin = cabins.find((c) => c.id === s.cabin_id);
                const status = cabinStatusOf(s.due_date);
                const tpl = settings?.reminder_template ?? "Hello {name}, your seat at The Reading Lodge is due {when}.";
                const link = whatsappLink(s.phone, fillTemplate(tpl, { name: s.name, when: s.due_date ?? "soon" }));
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.015 }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-[11px] font-semibold text-white">
                          {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{cabin ? `#${cabin.number}` : "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.phone}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.assigned_date ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.due_date ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${
                        status === "overdue" ? "bg-[oklch(0.65_0.24_25/0.15)] text-[oklch(0.85_0.20_25)]"
                        : status === "due_soon" ? "bg-[oklch(0.82_0.17_80/0.15)] text-[oklch(0.92_0.17_80)]"
                        : "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]"
                      }`}>{status === "occupied" ? "Active" : status === "due_soon" ? "Due Soon" : status === "overdue" ? "Overdue" : "Active"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <a href={link} target="_blank" rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg glass px-2.5 text-xs hover:bg-white/5">
                          <MessageCircle className="h-3.5 w-3.5 text-[oklch(0.78_0.18_155)]" /> WhatsApp
                        </a>
                        <button onClick={() => openEdit(s)} className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/5">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={async () => {
                          if (!confirm(`Delete ${s.name}?`)) return;
                          await del.mutateAsync(s.id);
                          toast.success("Student deleted");
                        }} className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/5">
                          <Trash2 className="h-3.5 w-3.5 text-[oklch(0.85_0.20_25)]" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No students match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal open={modal.open} onClose={modal.hide} title={editing ? "Edit student" : "Add student"}>
        <StudentForm
          key={editing?.id ?? "new"}
          initial={editing}
          availableCabins={availableCabins}
          currentCabinId={editing?.cabin_id ?? null}
          onSubmit={async (input) => {
            try {
              await save.mutateAsync({ id: editing?.id, input });
              toast.success(editing ? "Student updated" : "Student added");
              modal.hide();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
          busy={save.isPending}
        />
      </Modal>
    </Shell>
  );
}

function StudentForm({
  initial, availableCabins, currentCabinId, onSubmit, busy,
}: {
  initial: Student | null;
  availableCabins: { id: string; number: number }[];
  currentCabinId: string | null;
  onSubmit: (i: StudentInput) => void;
  busy: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [cabinId, setCabinId] = useState<string>(initial?.cabin_id ?? "");
  const [assigned, setAssigned] = useState(initial?.assigned_date ?? new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState(initial?.due_date ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const cabinOptions = [...availableCabins];
  if (currentCabinId && !cabinOptions.find((c) => c.id === currentCabinId)) {
    cabinOptions.unshift({ id: currentCabinId, number: 0 });
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { toast.error("Name and phone required"); return; }
    onSubmit({
      name: name.trim(), phone: phone.trim(),
      cabin_id: cabinId || null,
      assigned_date: assigned || null,
      due_date: due || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Full name"><input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-sm outline-none" /></Field>
      <Field label="Phone (with country code)"><input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" className="w-full bg-transparent text-sm outline-none" /></Field>
      <Field label="Cabin">
        <select value={cabinId} onChange={(e) => setCabinId(e.target.value)} className="w-full bg-transparent text-sm outline-none">
          <option value="" className="bg-[oklch(0.20_0.03_270)]">— Unassigned —</option>
          {cabinOptions.map((c) => (
            <option key={c.id} value={c.id} className="bg-[oklch(0.20_0.03_270)]">
              Cabin {c.number || initial?.cabin_id === c.id ? c.number || "(current)" : c.number}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Assigned date"><input type="date" value={assigned} onChange={(e) => setAssigned(e.target.value)} className="w-full bg-transparent text-sm outline-none" /></Field>
      <Field label="Due date"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full bg-transparent text-sm outline-none" /></Field>
      <div className="sm:col-span-2">
        <Field label="Notes"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-transparent text-sm outline-none" /></Field>
      </div>
      <button type="submit" disabled={busy}
        className="sm:col-span-2 mt-2 rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white glow-violet disabled:opacity-60">
        {busy ? "Saving…" : initial ? "Save changes" : "Add student"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="rounded-xl glass px-3.5 py-2.5">{children}</div>
    </label>
  );
}
