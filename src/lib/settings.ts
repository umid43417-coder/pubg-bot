import { supabase } from "@/integrations/supabase/client";

export const ADMIN_TELEGRAM_KEY = "admin_telegram";

export async function fetchAdminTelegram() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", ADMIN_TELEGRAM_KEY)
    .maybeSingle();
  if (error) throw error;
  return (data?.value ?? "admin").replace("@", "");
}

export async function saveAdminTelegram(value: string) {
  const clean = value.trim().replace("@", "");
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: ADMIN_TELEGRAM_KEY, value: clean, updated_at: new Date().toISOString() });
  if (error) throw error;
  return clean;
}
