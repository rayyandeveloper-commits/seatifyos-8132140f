import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-screen">
      {/* floating gradient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[color:var(--color-violet)] opacity-25 blur-[120px] animate-float-slow" />
        <div className="absolute right-[-10%] top-1/3 h-96 w-96 rounded-full bg-[color:var(--color-info)] opacity-20 blur-[140px] animate-float-slow" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-[-10%] left-1/3 h-80 w-80 rounded-full bg-[color:var(--color-cyan)] opacity-15 blur-[140px] animate-float-slow" style={{ animationDelay: "6s" }} />
      </div>

      <div className="mx-auto flex max-w-[1500px]">
        <div className="sticky top-0 hidden h-screen md:block">
          <Sidebar />
        </div>

        <main className="min-w-0 flex-1">
          <Topbar title={title} subtitle={subtitle} onMenu={() => setOpen(true)} />
          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="px-4 py-6 md:px-8 md:py-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 glass-strong md:hidden"
            >
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
