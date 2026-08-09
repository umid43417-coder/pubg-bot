import { botLog } from "./logger.server";

/**
 * Sozlamalar ombori.
 * Supabase mavjud bo'lsa — o'sha yerda saqlanadi.
 * Aks holda jarayon xotirasida ishlaydi, ya'ni bot hech qachon "o'lmaydi".
 */

const memory = new Map<string, string>();

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function storeGet(key: string): Promise<string | null> {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    const client = await db();
    const { data, error } = await client
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    const value = (data?.value ?? "").trim();
    if (value) memory.set(key, value);
    return value || null;
  } catch (error) {
    botLog.warn("store_read_fallback", { key, error: String(error) });
    return null;
  }
}

export async function storeSet(key: string, value: string) {
  memory.set(key, value);
  try {
    const client = await db();
    const { error } = await client
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  } catch (error) {
    botLog.warn("store_write_fallback", { key, error: String(error) });
  }
}

export async function storeCount(
  table: "accounts" | "app_settings" | "messages" | "profiles",
  filter?: { column: string; value: unknown },
) {
  try {
    const client = await db();
    let query = client.from(table).select("id", { count: "exact", head: true });
    if (filter) query = query.eq(filter.column as never, filter.value as never);
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function claimUpdate(updateId?: number): Promise<boolean> {
  if (typeof updateId !== "number") return true;
  const key = `update:${updateId}`;
  if (memory.has(key)) return false;
  memory.set(key, "1");

  try {
    const client = await db();
    const { error } = await client.from("bot_updates").insert({ update_id: updateId });
    if (!error) return true;
    if (error.code === "23505") return false;
    if (error.code !== "42P01") botLog.warn("update_dedupe_failed", { updateId, error: error.message });
  } catch (error) {
    botLog.warn("update_dedupe_fallback", { updateId, error: String(error) });
  }
  return true;
}

export async function recentLogs(limit = 12) {
  try {
    const client = await db();
    const { data, error } = await client
      .from("bot_logs")
      .select("level,event,message,created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 30));
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    botLog.warn("logs_read_failed", { error: String(error) });
    return [];
  }
}
