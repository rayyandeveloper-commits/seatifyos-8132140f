import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, Download, Check, AlertCircle, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCabins, useStudents, useCabinHistory } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/imports")({
  head: () => ({ meta: [{ title: "Imports & Exports — Study Lounge OS" }] }),
  component: Imports,
});

type ParsedRow = Record<string, string>;
type Mode = "students" | "cabins";

function readFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.toLowerCase().split(".").pop();
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    if (ext === "csv") {
      reader.onload = () => {
        const res = Papa.parse(String(reader.result), { header: true, skipEmptyLines: true });
        resolve(res.data as ParsedRow[]);
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const wb = XLSX.read(reader.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws) as ParsedRow[]);
      };
      reader.readAsArrayBuffer(file);
    }
  });
}

function get(row: ParsedRow, keys: string[]): string {
  for (const k of keys) {
    const v = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function Imports() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: cabins = [] } = useCabins();
  const { data: students = [] } = useStudents();
  const { data: history = [] } = useCabinHistory();
  const [mode, setMode] = useState<Mode>("students");
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");

  const onFile = async (f: File) => {
    try {
      const rows = await readFile(f);
      setPreview(rows);
      toast.success(`Parsed ${rows.length} rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read");
    }
  };

  const fromSheet = async () => {
    const m = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) return toast.error("Paste a Google Sheets URL");
    const id = m[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
    try {
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error("Sheet must be 'Anyone with link can view' to import.");
      const text = await res.text();
      const r = Papa.parse(text, { header: true, skipEmptyLines: true });
      setPreview(r.data as ParsedRow[]);
      toast.success(`Parsed ${(r.data as ParsedRow[]).length} rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const commit = async () => {
    if (!user || preview.length === 0) return;
    setBusy(true);
    let ok = 0, skipped = 0, failed = 0;
    try {
      if (mode === "cabins") {
        const existing = new Set(cabins.map((c) => c.name.toLowerCase()));
        for (const r of preview) {
          const name = get(r, ["name", "cabin", "cabin_name", "Cabin"]);
          if (!name) { skipped++; continue; }
          if (existing.has(name.toLowerCase())) { skipped++; continue; }
          const asNum = Number(name);
          const { error } = await supabase.from("cabins").insert({
            name, number: Number.isFinite(asNum) ? asNum : null, owner_id: user.id,
          });
          if (error) failed++; else { ok++; existing.add(name.toLowerCase()); }
        }
        qc.invalidateQueries({ queryKey: ["cabins"] });
      } else {
        const existingPhone = new Set(students.map((s) => s.phone));
        const cabinByName = new Map(cabins.map((c) => [c.name.toLowerCase(), c.id]));
        for (const r of preview) {
          const name = get(r, ["name", "full_name", "student", "Name"]);
          const phone = get(r, ["phone", "mobile", "contact", "Phone"]);
          if (!name || !phone) { skipped++; continue; }
          if (existingPhone.has(phone)) { skipped++; continue; }
          const whatsapp = get(r, ["whatsapp", "WhatsApp"]) || null;
          const cabinName = get(r, ["cabin", "cabin_name", "Cabin"]);
          const cabin_id = cabinName ? cabinByName.get(cabinName.toLowerCase()) ?? null : null;
          const assigned_date = get(r, ["assigned_date", "joining_date", "Joined", "JoiningDate"]) || null;
          const due_date = get(r, ["due_date", "DueDate"]) || null;
          const notes = get(r, ["notes", "Notes"]) || null;
          const { error } = await supabase.from("students").insert({
            name, phone, whatsapp, cabin_id, assigned_date, due_date, notes, owner_id: user.id,
          });
          if (error) failed++; else { ok++; existingPhone.add(phone); }
        }
        qc.invalidateQueries({ queryKey: ["students"] });
        qc.invalidateQueries({ queryKey: ["cabin_history"] });
      }
      toast.success(`Imported ${ok}, skipped ${skipped}, failed ${failed}`);
      setPreview([]);
    } finally {
      setBusy(false);
    }
  };

  const download = (rows: object[], filename: string, format: "csv" | "xlsx") => {
    if (format === "csv") {
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv" });
      triggerDownload(URL.createObjectURL(blob), filename);
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, filename);
    }
  };

  return (
    <Shell title="Imports & Exports" subtitle="Bulk migrate from spreadsheets in seconds.">
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl glass p-6">
          <h3 className="font-display text-base font-semibold">Import</h3>
          <p className="mt-1 text-xs text-muted-foreground">Excel (.xlsx), CSV, or a public Google Sheet URL.</p>

          <div className="mt-4 flex gap-1 rounded-xl glass p-1">
            {(["students", "cabins"] as Mode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); setPreview([]); }}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition ${mode === m ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "students" ? "Students" : "Cabins"}
              </button>
            ))}
          </div>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-10 text-center transition hover:bg-white/[0.04]">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium">Click or drop a file</div>
            <div className="text-[11px] text-muted-foreground">
              {mode === "students" ? "Headers: name, phone, whatsapp, cabin, assigned_date, due_date, notes" : "Headers: name"}
            </div>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>

          <div className="mt-4 flex items-center gap-2 rounded-xl glass px-3 py-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <button onClick={fromSheet} className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-white">Fetch</button>
          </div>

          {preview.length > 0 && (
            <div className="mt-4 rounded-xl glass p-3">
              <div className="text-xs text-muted-foreground">
                Preview · {preview.length} row{preview.length === 1 ? "" : "s"}
              </div>
              <div className="mt-2 max-h-44 overflow-auto rounded-lg bg-black/30 p-2 text-[11px] scrollbar-thin">
                <pre>{JSON.stringify(preview.slice(0, 5), null, 2)}</pre>
              </div>
              <button disabled={busy} onClick={commit}
                className="mt-3 w-full rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white glow-violet disabled:opacity-60">
                {busy ? "Importing…" : <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> Import {preview.length} rows</span>}
              </button>
            </div>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl glass p-6">
          <h3 className="font-display text-base font-semibold">Export</h3>
          <p className="mt-1 text-xs text-muted-foreground">Download a snapshot of your data.</p>

          <div className="mt-5 space-y-3">
            <ExportRow label="Students" count={students.length}
              onCsv={() => download(students.map(s => ({ name: s.name, phone: s.phone, whatsapp: s.whatsapp ?? "", cabin: cabins.find(c => c.id === s.cabin_id)?.name ?? "", assigned_date: s.assigned_date ?? "", due_date: s.due_date ?? "", notes: s.notes ?? "" })), "students.csv", "csv")}
              onXlsx={() => download(students.map(s => ({ name: s.name, phone: s.phone, whatsapp: s.whatsapp ?? "", cabin: cabins.find(c => c.id === s.cabin_id)?.name ?? "", assigned_date: s.assigned_date ?? "", due_date: s.due_date ?? "", notes: s.notes ?? "" })), "students.xlsx", "xlsx")}
            />
            <ExportRow label="Cabins" count={cabins.length}
              onCsv={() => download(cabins.map(c => ({ name: c.name })), "cabins.csv", "csv")}
              onXlsx={() => download(cabins.map(c => ({ name: c.name })), "cabins.xlsx", "xlsx")}
            />
            <ExportRow label="Cabin History" count={history.length}
              onCsv={() => download(history, "cabin-history.csv", "csv")}
              onXlsx={() => download(history, "cabin-history.xlsx", "xlsx")}
            />
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl glass p-3 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-[oklch(0.92_0.17_80)]" />
            Existing rows are skipped on import. Phone (students) and Name (cabins) are the dedupe keys.
          </div>
        </motion.section>
      </div>
    </Shell>
  );
}

function ExportRow({ label, count, onCsv, onXlsx }: { label: string; count: number; onCsv: () => void; onXlsx: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl glass p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary">
          <FileSpreadsheet className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-[11px] text-muted-foreground">{count} record{count === 1 ? "" : "s"}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCsv} className="inline-flex items-center gap-1.5 rounded-lg glass px-3 py-1.5 text-xs hover:bg-white/5">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
        <button onClick={onXlsx} className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-white">
          <Download className="h-3.5 w-3.5" /> XLSX
        </button>
      </div>
    </div>
  );
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
