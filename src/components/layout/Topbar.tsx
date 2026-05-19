import { Bell, Download, Menu, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar({ title, subtitle, onMenu }: { title: string; subtitle?: string; onMenu?: () => void }) {
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

        <div className="hidden items-center gap-2 rounded-xl glass px-3 py-2 md:flex md:w-72">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search students, cabins…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">⌘K</kbd>
        </div>

        <Button variant="ghost" size="sm" className="hidden gap-2 md:inline-flex">
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button size="sm" className="hidden gap-2 gradient-primary text-white glow-violet hover:opacity-90 md:inline-flex">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>

        <button className="relative grid h-9 w-9 place-items-center rounded-lg glass">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[color:var(--color-destructive)]" />
        </button>

        <div className="flex items-center gap-2 rounded-xl glass px-2 py-1.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg gradient-primary text-xs font-semibold text-white">RK</div>
          <div className="hidden text-left leading-tight md:block">
            <div className="text-xs font-semibold">Rahul K.</div>
            <div className="text-[10px] text-muted-foreground">Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
