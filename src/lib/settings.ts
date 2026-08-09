import { supabase } from "@/integrations/supabase/client";

export const ADMIN_TELEGRAM_KEY = "admin_telegram";

/** Bot matnlari va konfiguratsiyalari — admin panelidan tahrirlanadi. */
export const BOT_SETTINGS: { key: string; label: string; multiline?: boolean; hint?: string }[] = [
  { key: "bot_support", label: "Admin ssilkasi", hint: "@PUBG_SAVDO_ORG_ADMIN" },
  { key: "bot_channel", label: "Majburiy obuna kanali", hint: "https://t.me/PUBG_SAVDO_CHANNEL" },
  { key: "bot_reviews", label: "Otzivlar havolasi", hint: "https://t.me/..." },
  { key: "bot_force_sub", label: "Majburiy obuna (on/off)", hint: "on yoki off" },
  { key: "bot_rules", label: "Qoidalar matni", multiline: true },
  { key: "bot_welcome", label: "Salomlashish matni", multiline: true },
  { key: "bot_about", label: "Biz haqimizda", multiline: true },
  { key: "bot_price", label: "Narx / xizmat haqi" },
  { key: "bot_orders_empty", label: "Buyurtma bo'sh matni", multiline: true },
  { key: "bot_admin_ids", label: "Bot adminlari (Telegram ID, vergul bilan)", hint: "12345,67890" },
];

export async function fetchSettings(keys: string[]) {
  const { data, error } = await supabase.from("app_settings").select("key, value").in("key", keys);
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function saveSetting(key: string, value: string) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

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
  await saveSetting(ADMIN_TELEGRAM_KEY, clean);
  return clean;
}
