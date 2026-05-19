import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Bell, Building2, MessageCircle, Shield, User } from "lucide-react";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — The Reading Lodge" },
      { name: "description", content: "Configure your lodge and notification preferences." },
    ],
  }),
  component: Settings,
});

const tabs = [
  { key: "profile", label: "Profile", icon: User },
  { key: "lodge", label: "Lodge", icon: Building2 },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
] as const;

function Settings() {
  const [tab, setTab] = useState<typeof tabs[number]["key"]>("profile");

  return (
    <Shell title="Settings" subtitle="Personalise your reading lodge.">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl glass p-1 lg:flex-col lg:overflow-visible">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {active && <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-xl bg-white/10" />}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <motion.section
          key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {tab === "profile" && (
            <Card title="Profile" desc="Update your personal information.">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-lg font-semibold text-white glow-violet">RK</div>
                <div>
                  <div className="font-display text-base font-semibold">Rahul Kapoor</div>
                  <div className="text-xs text-muted-foreground">Owner · The Reading Lodge</div>
                </div>
                <button className="ml-auto rounded-lg glass px-3 py-1.5 text-xs hover:bg-white/5">Change photo</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name" value="Rahul Kapoor" />
                <Field label="Email" value="owner@readinglodge.in" />
                <Field label="Phone" value="+91 98765 43210" />
                <Field label="Role" value="Owner" />
              </div>
            </Card>
          )}

          {tab === "lodge" && (
            <Card title="Lodge details" desc="Configuration shown on receipts & member portal.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Lodge name" value="The Reading Lodge — Vasant Vihar" />
                <Field label="Capacity" value="24 cabins" />
                <Field label="Opening time" value="06:00 AM" />
                <Field label="Closing time" value="11:00 PM" />
              </div>
            </Card>
          )}

          {tab === "notifications" && (
            <Card title="Notifications" desc="Choose how you and members get alerted.">
              <Toggle title="WhatsApp reminders" desc="Send 3-day & 1-day renewal reminders." defaultOn />
              <Toggle title="Daily digest" desc="Morning summary of yesterday's activity." />
              <Toggle title="Renewal alerts" desc="Get notified when a membership is about to expire." defaultOn />
              <button className="mt-2 inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-sm hover:bg-white/5">
                <MessageCircle className="h-4 w-4 text-[oklch(0.78_0.18_155)]" /> Test WhatsApp template
              </button>
            </Card>
          )}


          {tab === "security" && (
            <Card title="Security" desc="Keep your account locked down.">
              <Toggle title="Two-factor authentication" desc="Require a 6-digit code on login." defaultOn />
              <Toggle title="Login alerts" desc="Email me on new device sign-ins." defaultOn />
              <button className="mt-2 inline-flex rounded-xl glass px-3 py-2 text-sm hover:bg-white/5">Change password</button>
            </Card>
          )}
        </motion.section>
      </div>
    </Shell>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass p-6">
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="rounded-xl glass px-3.5 py-2.5">
        <input defaultValue={value} className="w-full bg-transparent text-sm outline-none" />
      </div>
    </label>
  );
}

function Toggle({ title, desc, defaultOn = false }: { title: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between rounded-xl glass p-4">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        onClick={() => setOn(v => !v)}
        className={`relative h-6 w-11 rounded-full transition ${on ? "gradient-primary glow-violet" : "bg-white/10"}`}
      >
        <motion.span
          layout
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
          animate={{ left: on ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
