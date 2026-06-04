import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Pencil, Trash2, Send, ChevronDown, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/layout/Shell";
import { Modal, useModal } from "@/components/ui-blocks/Modal";
import { SkeletonRow } from "@/components/ui-blocks/SkeletonCard";
import {
  useStudents, useCabins, useSaveStudent, useDeleteStudent, useSettings,
  cabinStatusOf, whatsappLink, fillTemplate, type Student, type StudentInput,
} from "@/lib/queries";
import { sendReminderNow } from "@/lib/reminders.functions";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students — Study Lounge OS" }] }),
  component: Students,
});

const statusConfig = {
  occupied: { label: "Active", cls: "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]" },
  due_soon: { label: "Due Soon", cls: "bg-[oklch(0.82_0.17_80/0.15)] text-[oklch(0.92_0.17_80)]" },
  overdue: { label: "Overdue", cls: "bg-[oklch(0.65_0.24_25/0.15)] text-[oklch(0.85_0.20_25)]" },
  available: { label: "Active", cls: "bg-[oklch(0.72_0.18_155/0.15)] text-[oklch(0.85_0.18_155)]" },
} as const;

function Students() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "due" | "overdue">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: students = [], isLoading: sLoad } = useStudents();
  const { data: cabins = [], isLoading: cLoad } = useCabins();
  const { data: settings } = useSettings();
  const save = useSaveStudent();
  const del = useDeleteStudent();
  const sendNow = useServerFn(sendReminderNow);
  const modal = useModal();
  const [editing, setEditing] = useState<Student | null>(null);
  const loading = sLoad || cLoad;

  const usedCabinIds = new Set(students.filter((s) => s.cabin_id && s.id !== editing?.id).map((s) => s.cabin_id!));
  const availableCabins = cabins.filter((c) => !usedCabinIds.has(c.id));

  const rows = useMemo(() => students.filter((s) => {
    const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.phone.includes(q);
    const st = cabinStatusOf(s.due_date);
    const matchF = filter === "all"
      || (filter === "active" && st === "occupied")
      || (filter === "due" && st === "due_soon")
      || (filter === "overdue" && st === "overdue");
    return matchQ && matchF;
  }), [students, q, filter]);

  const openAdd = () => { setEditing(null); modal.show(); };
  const openEdit = (s: Student) => { setEditing(s); modal.show(); };

  const counts = useMemo(() => ({
    all: students.length,
    active: students.filter((s) => cabinStatusOf(s.due_date) === "occupied").length,
    due: students.filter((s) => cabinStatusOf(s.due_date) === "due_soon").length,
    overdue: students.filter((s) => cabinStatusOf(s.due_date) === "overdue").length,
  }), [students]);

  return (
    <Shell title="Student Management" subtitle={`${students.length} active members`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl glass px-3 py-2 md:max-w-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl glass p-1">
          {(["all", "active", "due", "overdue"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`relative rounded-lg px-2.5 py-1 text-xs transition ${filter === f ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {filter === f && <motion.span layoutId="stu-filter" className="absolute inset-0 -z-0 rounded-lg bg-white/10" />}
              <span className="relative z-10 capitalize">
                {f === "all" ? `All (${counts.all})` : f === "active" ? `Active (${counts.active})` : f === "due" ? `Due soon (${counts.due})` : `Overdue (${counts.overdue})`}
              </span>
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="ml-auto inline-flex items-center gap-2 rounded-xl gradient-primary px-3 py-2 text-sm font-medium text-white glow-violet">
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="mt-6 overflow-hidden rounded-2xl glass">
        {loading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px] text-sm">
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
                  const sc = statusConfig[status];
                  const tpl = settings?.reminder_template ?? "Hello {name}, your seat is due {when}.";
                  const link = whatsappLink(
                    s.whatsapp ?? s.phone,
                    fillTemplate(tpl, { name: s.name, when: s.due_date ?? "soon", cabin: cabin?.name ?? "—" }),
                  );
                  const isExpanded = expanded === s.id;

                  return (
                    <React.Fragment key={s.id}>
                      <motion.tr initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.015 }}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-primary text-[11px] font-semibold text-white">
                              {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                            </div>
                            <div>
                              <div className="font-medium">{s.name}</div>
                              {s.notes && (
                                <button
                                  onClick={() => setExpanded(isExpanded ? null : s.id)}
                                  className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition"
                                >
                                  <StickyNote className="h-2.5 w-2.5" />
                                  Notes
                                  <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{cabin ? cabin.name : "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{s.phone}</td>
                        <td className="px-5 py-3 text-muted-foreground">{s.assigned_date ?? "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{s.due_date ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${sc.cls}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={async () => {
                                const tid = toast.loading("Sending WhatsApp…");
                                try {
                                  const r = await sendNow({ data: { studentId: s.id } });
                                  toast.success(`Sent (${r.sid.slice(0, 8)}…)`, { id: tid });
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Failed", { id: tid });
                                }
                              }}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg glass px-2.5 text-xs hover:bg-white/5 transition"
                            >
                              <Send className="h-3.5 w-3.5 text-[oklch(0.78_0.18_155)]" /> Send
                            </button>
                            <a href={link} target="_blank" rel="noreferrer"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg glass px-2.5 text-xs hover:bg-white/5 transition">
                              <MessageCircle className="h-3.5 w-3.5 text-[oklch(0.78_0.18_155)]" /> Chat
                            </a>
                            <button onClick={() => openEdit(s)} className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/5 transition">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={async () => {
                              if (!confirm(`Delete ${s.name}? History is preserved.`)) return;
                              await del.mutateAsync(s.id);
                              toast.success("Student deleted");
                            }} className="grid h-8 w-8 place-items-center rounded-lg glass hover:bg-white/5 transition">
                              <Trash2 className="h-3.5 w-3.5 text-[oklch(0.85_0.20_25)]" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                      {isExpanded && s.notes && (
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <td colSpan={7} className="px-5 py-3">
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[oklch(0.92_0.17_80)]" />
                              <p className="whitespace-pre-wrap leading-relaxed">{s.notes}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="text-sm font-medium">No students match your filters</div>
                      <div className="mt-1 text-xs text-muted-foreground">Try adjusting the search or status filter.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <Modal open={modal.open} onClose={modal.hide} title={editing ? "Edit student" : "Add student"}>
        <StudentForm
          key={editing?.id ?? "new"}
          initial={editing}
          availableCabins={availableCabins}
          currentCabinId={editing?.cabin_id ?? null}
          allCabins={cabins}
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
  initial, availableCabins, allCabins, currentCabinId, onSubmit, busy,
}: {
  initial: Student | null;
  availableCabins: { id: string; name: string }[];
  allCabins: { id: string; name: string }[];
  currentCabinId: string | null;
  onSubmit: (i: StudentInput) => void;
  busy: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [cabinId, setCabinId] = useState<string>(initial?.cabin_id ?? "");
  const [assigned, setAssigned] = useState(initial?.assigned_date ?? new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState(initial?.due_date ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const cabinOptions = [...availableCabins];
  if (currentCabinId && !cabinOptions.find((c) => c.id === currentCabinId)) {
    const cur = allCabins.find((c) => c.id === currentCabinId);
    if (cur) cabinOptions.unshift(cur);
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { toast.error("Name and phone required"); return; }
    onSubmit({
      name: name.trim(), phone: phone.trim(),
      whatsapp: whatsapp.trim() || null,
      cabin_id: cabinId || null,
      assigned_date: assigned || null,
      due_date: due || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Full name">
        <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
      </Field>
      <Field label="Phone">
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" className="w-full bg-transparent text-sm outline-none" />
      </Field>
      <Field label="WhatsApp (optional)">
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91…" className="w-full bg-transparent text-sm outline-none" />
      </Field>
      <Field label="Cabin">
        <select value={cabinId} onChange={(e) => setCabinId(e.target.value)} className="w-full bg-transparent text-sm outline-none">
          <option value="" className="bg-[oklch(0.20_0.03_270)]">— Unassigned —</option>
          {cabinOptions.map((c) => (
            <option key={c.id} value={c.id} className="bg-[oklch(0.20_0.03_270)]">Cabin {c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Assigned date">
        <input type="date" value={assigned} onChange={(e) => setAssigned(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
      </Field>
      <Field label="Due date">
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes (optional)">
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this student…"
            className="w-full bg-transparent text-sm outline-none resize-none" />
        </Field>
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
