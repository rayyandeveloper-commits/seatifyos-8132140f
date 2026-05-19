import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — The Reading Lodge" },
      { name: "description", content: "Sign in to The Reading Lodge — premium library & cabin management." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("owner@readinglodge.in");
  const [pw, setPw] = useState("demo1234");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-[color:var(--color-violet)] opacity-30 blur-[140px] animate-float-slow" />
        <div className="absolute right-[-10%] top-1/3 h-[28rem] w-[28rem] rounded-full bg-[color:var(--color-info)] opacity-25 blur-[160px] animate-float-slow" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-[-10%] left-1/2 h-80 w-80 rounded-full bg-[color:var(--color-cyan)] opacity-20 blur-[140px] animate-float-slow" style={{ animationDelay: "6s" }} />
      </div>

      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between p-12 lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary glow-violet">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold">The Reading Lodge</div>
            <div className="text-xs text-muted-foreground">Library OS</div>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-cyan)]" />
            Built for modern reading rooms
          </div>
          <h2 className="max-w-md font-display text-5xl font-semibold leading-tight tracking-tight">
            Run your library like a <span className="gradient-text">funded startup</span>.
          </h2>
          <p className="max-w-md text-base text-muted-foreground">
            Track every cabin, renewal, and rupee in one beautifully calm dashboard.
            Designed with the polish of Linear, Stripe, and Apple.
          </p>

          <div className="grid max-w-md grid-cols-3 gap-3 pt-4">
            {[
              { k: "24", v: "Cabins" },
              { k: "₹91k", v: "MRR" },
              { k: "98%", v: "Occupancy" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl glass p-4">
                <div className="font-display text-2xl font-semibold gradient-text">{s.k}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="text-xs text-muted-foreground">© 2026 The Reading Lodge. Demo build.</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-3xl glass-strong p-8 md:p-10 glow-violet"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="font-display text-lg font-semibold">The Reading Lodge</div>
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your reading lodge.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="you@studio.com"
              />
            </Field>
            <Field label="Password">
              <input
                type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="••••••••"
              />
            </Field>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-[color:var(--color-primary)]" />
                Remember me
              </label>
              <a className="text-muted-foreground hover:text-foreground" href="#">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] glow-violet"
            >
              Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="relative my-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="bg-transparent px-2">or</span>
            </div>

            <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl glass px-4 py-3 text-sm font-medium hover:bg-white/5">
              Continue with Google
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo build — any credentials work.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="rounded-xl glass px-3.5 py-3 focus-within:ring-2 focus-within:ring-[color:var(--color-primary)]">
        {children}
      </div>
    </label>
  );
}
