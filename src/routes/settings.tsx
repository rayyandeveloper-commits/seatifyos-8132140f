import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Building2, Bell, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { useSettings, useSaveSettings } from "@/lib/queries";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Study Lounge OS" }] }),
  component: Settings,
});

const tabs = [
  { key: "lodge", label: "Lodge", icon: Building2 },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "twilio", label: "WhatsApp", icon: Phone },
] as const;

function Settings() {
  const [tab, setTab] = useState<typeof tabs[number]["key"]>("lodge");
  const { data: s } = useSettings();
  const save = useSaveSettings();

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [open, setOpen] = useState("");
  const [close, setClose] = useState("");
  const [template, setTemplate] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");
  const [reminderHour, setReminderHour] = useState(9);

  useEffect(() => {
    if (!s) return;
    setName(s.library_name ?? "");
    setWhatsapp(s.whatsapp_number ?? "");
    setOpen(s.opening_time ?? "");
    setClose(s.closing_time ?? "");
    setTemplate(s.reminder_template ?? "");
    setTwilioFrom(s.twilio_from ?? "");
    setReminderHour(s.reminder_hour ?? 9);
  }, [s]);

  const persist = async (patch: Record<string, unknown>) => {
    try { await save.mutateAsync(patch); toast.success("Saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <Shell title="Settings" subtitle="Personalise your study lounge.">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl glass p-1 lg:flex-col lg:overflow-visible">
          {tabs.map((t) => {
            const Icon = t.icon; const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`relative inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {active && <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-xl bg-white/10" />}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </nav>

        <motion.section key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
          className="space-y-6">
          {tab === "lodge" && (
            <Card title="Lodge details" desc="Shown on receipts & member messages.">
              <Field label="Business name"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-sm outline-none" /></Field>
              <Field label="WhatsApp number"><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91…" className="w-full bg-transparent text-sm outline-none" /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Opening time"><input value={open} onChange={(e) => setOpen(e.target.value)} placeholder="06:00" className="w-full bg-transparent text-sm outline-none" /></Field>
                <Field label="Closing time"><input value={close} onChange={(e) => setClose(e.target.value)} placeholder="23:00" className="w-full bg-transparent text-sm outline-none" /></Field>
              </div>
              <SaveBtn onClick={() => persist({ library_name: name, whatsapp_number: whatsapp, opening_time: open, closing_time: close })} busy={save.isPending} />
            </Card>
          )}

          {tab === "reminders" && (
            <Card title="Reminder template" desc="Used for automatic & manual WhatsApp sends. Placeholders: {name}, {when}, {cabin}.">
              <Field label="Message">
                <textarea rows={5} value={template} onChange={(e) => setTemplate(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
              </Field>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-[oklch(0.78_0.18_155)]" /> The daily 9 AM cron sends reminders for everyone due in the next 7 days.
              </div>
              <SaveBtn onClick={() => persist({ reminder_template: template, reminder_hour: reminderHour })} busy={save.isPending} />
            </Card>
          )}

          {tab === "twilio" && (
            <Card title="Twilio WhatsApp sender" desc="Required for automatic reminders. Add your Twilio Account SID and Auth Token as secrets in Replit, then set your sender number below.">
              <Field label="Sender number (From)">
                <input value={twilioFrom} onChange={(e) => setTwilioFrom(e.target.value)}
                  placeholder="whatsapp:+14155238886"
                  className="w-full bg-transparent text-sm outline-none" />
              </Field>
              <div className="text-xs text-muted-foreground">
                Use the Twilio sandbox number <span className="font-mono">whatsapp:+14155238886</span> for testing, or your approved business number for production. Set <span className="font-mono">TWILIO_ACCOUNT_SID</span> and <span className="font-mono">TWILIO_AUTH_TOKEN</span> in your Replit Secrets tab to enable sending.
              </div>
              <SaveBtn onClick={() => persist({ twilio_from: twilioFrom })} busy={save.isPending} />
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="rounded-xl glass px-3.5 py-2.5">{children}</div>
    </label>
  );
}
function SaveBtn({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white glow-violet disabled:opacity-60">
      {busy ? "Saving…" : "Save changes"}
    </button>
  );
}
