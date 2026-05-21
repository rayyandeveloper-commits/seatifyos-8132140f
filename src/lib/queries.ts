import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Cabin = {
  id: string;
  name: string;
  number: number | null;
  owner_id: string;
  created_at: string;
};

export type Student = {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  cabin_id: string | null;
  assigned_date: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  owner_id: string;
  type: string;
  message: string;
  student_id: string | null;
  read: boolean;
  created_at: string;
};

export type AppSettings = {
  owner_id: string;
  library_name: string;
  whatsapp_number: string | null;
  reminder_template: string;
  opening_time: string | null;
  closing_time: string | null;
  twilio_from: string | null;
  reminder_hour: number;
};

export type CabinHistory = {
  id: string;
  owner_id: string;
  cabin_id: string | null;
  cabin_name: string;
  student_id: string | null;
  student_name: string;
  phone: string | null;
  whatsapp: string | null;
  assigned_date: string | null;
  due_date: string | null;
  vacated_date: string | null;
  status: "active" | "completed" | "transferred" | "expired";
  created_at: string;
  updated_at: string;
};

export type ReminderLog = {
  id: string;
  owner_id: string;
  student_id: string | null;
  cabin_history_id: string | null;
  channel: string;
  status: "sent" | "failed" | "queued";
  provider_sid: string | null;
  error: string | null;
  message: string | null;
  sent_at: string;
};

export type CabinStatus = "available" | "occupied" | "due_soon" | "overdue";

export function cabinStatusOf(due: string | null | undefined): CabinStatus {
  if (!due) return "available";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff <= 7) return "due_soon";
  return "occupied";
}

export function useCabins() {
  return useQuery({
    queryKey: ["cabins"],
    queryFn: async (): Promise<Cabin[]> => {
      const { data, error } = await supabase.from("cabins").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Cabin[];
    },
  });
}

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<Student[]> => {
      const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["settings", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppSettings | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created, error: insErr } = await supabase
          .from("app_settings")
          .insert({ owner_id: user.id })
          .select("*")
          .single();
        if (insErr) throw insErr;
        return created as AppSettings;
      }
      return data as AppSettings;
    },
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<AppSettings>) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("app_settings").update(patch).eq("owner_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useAddCabin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not signed in");
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Cabin name required");
      const asNum = Number(trimmed);
      const { error } = await supabase
        .from("cabins")
        .insert({ name: trimmed, number: Number.isFinite(asNum) ? asNum : null, owner_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cabins"] }),
  });
}

export function useUpdateCabin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const asNum = Number(name);
      const { error } = await supabase
        .from("cabins")
        .update({ name, number: Number.isFinite(asNum) ? asNum : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cabins"] }),
  });
}

export function useDeleteCabin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cabins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cabins"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export type StudentInput = {
  name: string;
  phone: string;
  whatsapp: string | null;
  cabin_id: string | null;
  assigned_date: string | null;
  due_date: string | null;
  notes: string | null;
};

export function useSaveStudent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: StudentInput }) => {
      if (!user) throw new Error("Not signed in");
      if (id) {
        const { error } = await supabase.from("students").update(input).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("students").insert({ ...input, owner_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["cabins"] });
      qc.invalidateQueries({ queryKey: ["cabin_history"] });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["cabin_history"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useCabinHistory(cabinId?: string) {
  return useQuery({
    queryKey: ["cabin_history", cabinId ?? "all"],
    queryFn: async (): Promise<CabinHistory[]> => {
      let q = supabase.from("cabin_history").select("*").order("created_at", { ascending: false });
      if (cabinId) q = q.eq("cabin_id", cabinId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CabinHistory[];
    },
  });
}

export function useReminderLogs() {
  return useQuery({
    queryKey: ["reminder_logs"],
    queryFn: async (): Promise<ReminderLog[]> => {
      const { data, error } = await supabase
        .from("reminder_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ReminderLog[];
    },
  });
}

export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
