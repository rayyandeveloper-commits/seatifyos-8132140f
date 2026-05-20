
revoke execute on function public.sync_cabin_history() from public, anon, authenticated;
revoke execute on function public.expire_overdue_history() from public, anon, authenticated;
revoke execute on function public.generate_due_notifications() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
