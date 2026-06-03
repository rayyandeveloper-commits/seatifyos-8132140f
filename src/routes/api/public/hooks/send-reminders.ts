import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

function toWa(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `whatsapp:+${digits}`;
}

async function twilioSend(to: string, from: string, body: string) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured");
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${JSON.stringify(data)}`);
  return data as { sid: string };
}

export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        if (apiKey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }
        const admin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const horizon = new Date(today.getTime() + 7 * 86400000);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);

        const { data: students, error } = await admin
          .from("students")
          .select("id, owner_id, name, phone, whatsapp, due_date, cabin_id, cabins(name)")
          .gte("due_date", fmt(today))
          .lte("due_date", fmt(horizon));

        if (error) {
          console.error("send-reminders fetch", error);
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const owners = Array.from(new Set((students ?? []).map((s) => s.owner_id)));
        const settingsByOwner: Record<string, { template: string; from: string | null }> = {};
        if (owners.length) {
          const { data: settings } = await admin
            .from("app_settings")
            .select("owner_id, reminder_template, twilio_from")
            .in("owner_id", owners);
          for (const s of settings ?? []) {
            settingsByOwner[s.owner_id] = {
              template: s.reminder_template,
              from: s.twilio_from,
            };
          }
        }

        let sent = 0;
        let failed = 0;
        for (const s of students ?? []) {
          const cfg = settingsByOwner[s.owner_id];
          if (!cfg?.from) {
            await admin.from("reminder_logs").insert({
              owner_id: s.owner_id, student_id: s.id, channel: "whatsapp",
              status: "failed", error: "No Twilio 'From' configured", message: null,
            });
            failed++;
            continue;
          }
          const msg = (cfg.template ?? "Hello {name}, your subscription is ending soon.")
            .replace(/\{name\}/g, s.name)
            .replace(/\{when\}/g, s.due_date ?? "soon")
            .replace(/\{cabin\}/g, (s.cabins as { name?: string } | null)?.name ?? "—");
          const to = toWa(s.whatsapp ?? s.phone);
          const from = cfg.from.startsWith("whatsapp:") ? cfg.from : `whatsapp:${cfg.from}`;
          try {
            const r = await twilioSend(to, from, msg);
            await admin.from("reminder_logs").insert({
              owner_id: s.owner_id, student_id: s.id, channel: "whatsapp",
              status: "sent", provider_sid: r.sid, message: msg,
            });
            sent++;
          } catch (e) {
            const err = e instanceof Error ? e.message : String(e);
            await admin.from("reminder_logs").insert({
              owner_id: s.owner_id, student_id: s.id, channel: "whatsapp",
              status: "failed", error: err, message: msg,
            });
            failed++;
          }
        }
        return Response.json({ ok: true, considered: students?.length ?? 0, sent, failed });
      },
    },
  },
});
