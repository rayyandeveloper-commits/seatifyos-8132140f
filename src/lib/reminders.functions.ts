import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

async function twilioSend(to: string, from: string, body: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

  const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${JSON.stringify(data)}`);
  return data as { sid: string };
}

function toWa(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `whatsapp:+${digits}`;
}

export const sendReminderNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        studentId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: student, error } = await supabase
      .from("students")
      .select("*, cabins(name)")
      .eq("id", data.studentId)
      .single();
    if (error || !student) throw new Error(error?.message ?? "Student not found");

    const { data: settings } = await supabase
      .from("app_settings")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    const from = settings?.twilio_from?.trim();
    if (!from) throw new Error("Set a Twilio 'From' number in Settings first.");

    const tpl =
      settings?.reminder_template ??
      "Hello {name}, your subscription is ending soon. Please renew before {when}.";
    const msg = tpl
      .replace(/\{name\}/g, student.name)
      .replace(/\{when\}/g, student.due_date ?? "soon")
      .replace(/\{cabin\}/g, (student.cabins as { name?: string } | null)?.name ?? "—");

    const toRaw = student.whatsapp ?? student.phone;
    try {
      const sent = await twilioSend(toWa(toRaw), from.startsWith("whatsapp:") ? from : `whatsapp:${from}`, msg);
      await supabase.from("reminder_logs").insert({
        owner_id: userId,
        student_id: student.id,
        channel: "whatsapp",
        status: "sent",
        provider_sid: sent.sid,
        message: msg,
      });
      return { ok: true as const, sid: sent.sid };
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      await supabase.from("reminder_logs").insert({
        owner_id: userId,
        student_id: student.id,
        channel: "whatsapp",
        status: "failed",
        error: err,
        message: msg,
      });
      throw new Error(err);
    }
  });
