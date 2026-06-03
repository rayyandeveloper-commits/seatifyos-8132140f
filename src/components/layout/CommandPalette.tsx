import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, DoorOpen, Users, BellRing, BarChart3,
  Upload, Inbox, Settings, Search, ArrowRight,
} from "lucide-react";
import { useCabins, useStudents } from "@/lib/queries";

const pages = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { to: "/cabins", label: "Cabins", icon: DoorOpen, keywords: "rooms seats" },
  { to: "/students", label: "Students", icon: Users, keywords: "members people" },
  { to: "/renewals", label: "Renewals", icon: BellRing, keywords: "due overdue expiry" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, keywords: "charts stats reports" },
  { to: "/imports", label: "Imports & Exports", icon: Upload, keywords: "csv xlsx spreadsheet" },
  { to: "/notifications", label: "Notifications", icon: Inbox, keywords: "alerts logs" },
  { to: "/settings", label: "Settings", icon: Settings, keywords: "config twilio whatsapp" },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { data: students = [] } = useStudents();
  const { data: cabins = [] } = useCabins();

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const lower = q.toLowerCase();

  const filteredPages = pages.filter(
    (p) => !q || p.label.toLowerCase().includes(lower) || p.keywords.includes(lower),
  );

  const filteredStudents = q
    ? students
        .filter(
          (s) =>
            s.name.toLowerCase().includes(lower) || s.phone.includes(q),
        )
        .slice(0, 5)
    : [];

  const filteredCabins = q
    ? cabins.filter((c) => c.name.toLowerCase().includes(lower)).slice(0, 4)
    : [];

  const go = (to: string) => {
    navigate({ to: to as "/" });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed left-1/2 top-[12vh] z-50 w-[min(96vw,620px)] -translate-x-1/2 overflow-hidden rounded-2xl glass-strong shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search pages, students, cabins…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === "Escape" && onClose()}
              />
              <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
              {filteredPages.length > 0 && (
                <Section label="Pages">
                  {filteredPages.map((p) => {
                    const Icon = p.icon;
                    return (
                      <Item key={p.to} onClick={() => go(p.to)}>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="flex-1 text-sm font-medium">{p.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </Item>
                    );
                  })}
                </Section>
              )}

              {filteredStudents.length > 0 && (
                <Section label="Students">
                  {filteredStudents.map((s) => (
                    <Item key={s.id} onClick={() => go("/students")}>
                      <div className="grid h-7 w-7 place-items-center rounded-lg gradient-primary text-[10px] font-semibold text-white">
                        {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{s.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{s.phone}</div>
                      </div>
                    </Item>
                  ))}
                </Section>
              )}

              {filteredCabins.length > 0 && (
                <Section label="Cabins">
                  {filteredCabins.map((c) => (
                    <Item key={c.id} onClick={() => go("/cabins")}>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8">
                        <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="flex-1 text-sm font-medium">Cabin {c.name}</span>
                    </Item>
                  ))}
                </Section>
              )}

              {filteredPages.length === 0 && filteredStudents.length === 0 && filteredCabins.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{q}&rdquo;
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-white/8 px-4 py-2 text-[11px] text-muted-foreground">
              <span>↵ to select</span>
              <span>↑↓ to navigate</span>
              <span>ESC to close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Item({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/8 focus:bg-white/8 focus:outline-none"
    >
      {children}
    </button>
  );
}
