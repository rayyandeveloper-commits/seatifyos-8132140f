import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Cabin = {
  id: string;
  number: number;
  owner_id: string;
  created_at: string;
};

export type Student = {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
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
  if (diff <= 3) return "due_soon";
  return "occupied";
}

export function useCabins() {
  return useQuery({
    queryKey: ["cabins"],
    queryFn: async (): Promise<Cabin[]> => {
      const { data, error } = await supabase.from("cabins").select("*").order("number");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<Student[]> => {
      const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
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
      const { error } = await supabase
        .from("app_settings")
        .update(patch)
        .eq("owner_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useAddCabin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (number: number) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("cabins").insert({ number, owner_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cabins"] }),
  });
}

export function useUpdateCabin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, number }: { id: string; number: number }) => {
      const { error } = await supabase.from("cabins").update({ number }).eq("id", id);
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
        const { error } = await supabase
          .from("students")
          .insert({ ...input, owner_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["cabins"] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
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

export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
