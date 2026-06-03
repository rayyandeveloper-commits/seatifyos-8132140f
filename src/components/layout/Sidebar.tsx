import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, DoorOpen, Users, BellRing, Settings, BookOpen, LogOut, Inbox,
  BarChart3, Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCabins, useStudents, useNotifications } from "@/lib/queries";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cabins", label: "Cabins", icon: DoorOpen },
  { to: "/students", label: "Students", icon: Users },
  { to: "/renewals", label: "Renewals", icon: BellRing },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/imports", label: "Imports", icon: Upload },
  { to: "/notifications", label: "Notifications", icon: Inbox },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: cabins = [] } = useCabins();
  const { data: students = [] } = useStudents();
  const { data: notifs = [] } = useNotifications();
  const cap = cabins.length || 0;
  const used = students.filter((s) => s.cabin_id).length;
  const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  const unread = notifs.filter((n) => !n.read).length;

  const logout = async () => {
    await signOut();
    onNavigate?.();
    navigate({ to: "/", replace: true });
  };

  return (
    <aside className="flex h-full w-64 flex-col gap-2 p-4">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-2 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary glow-violet">
          <BookOpen className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-semibold tracking-tight">Study Lounge OS</div>
          <div className="text-[11px] text-muted-foreground">Admin Suite</div>
        </div>
      </Link>

      <nav className="mt-2 flex flex-col gap-1">
        {nav.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          const badge = item.to === "/notifications" && unread > 0 ? unread : null;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 -z-0 rounded-xl glass-strong glow-violet"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={`relative z-10 h-4.5 w-4.5 ${active ? "text-primary" : ""}`} />
              <span className="relative z-10 flex-1 font-medium">{item.label}</span>
              {badge && (
                <span className="relative z-10 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--color-destructive)] px-1 text-[9px] font-semibold text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Capacity</div>
          <div className="mt-1 font-display text-sm font-semibold">{used} / {cap} cabins in use</div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
