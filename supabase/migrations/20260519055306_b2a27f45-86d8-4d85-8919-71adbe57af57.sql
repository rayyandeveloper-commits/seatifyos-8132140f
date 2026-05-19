
alter function public.touch_updated_at() set search_path = public;
revoke execute on function public.generate_due_notifications() from public, anon, authenticated;
