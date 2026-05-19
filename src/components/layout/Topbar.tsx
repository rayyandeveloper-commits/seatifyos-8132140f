import { Bell, Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/lib/queries";

export function Topbar({ title, subtitle, onMenu }: { title: string; subtitle?: string; onMenu?: () => void }) {
  const { user } = useAuth();
  const { data: notifs = [] } = useNotifications();
  const unread = notifs.filter((n) => !n.read).length;
  const initials = (user?.email ?? "A")
    .split("@")[0]
    .split(/[.\-_]/)
    .map((p) => p[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 md:px-8 md:py-4">
        <button onClick={onMenu} className="grid h-9 w-9 place-items-center rounded-lg glass md:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground md:text-sm">{subtitle}</p>}
        </div>

        <Link to="/notifications" className="relative grid h-9 w-9 place-items-center rounded-lg glass">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--color-destructive)] px-1 text-[9px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 rounded-xl glass px-2 py-1.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg gradient-primary text-xs font-semibold text-white">{initials || "A"}</div>
          <div className="hidden max-w-[140px] text-left leading-tight md:block">
            <div className="truncate text-xs font-semibold">{user?.email ?? "Admin"}</div>
            <div className="text-[10px] text-muted-foreground">Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
