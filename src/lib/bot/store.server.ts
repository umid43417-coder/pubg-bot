import { botLog } from "./logger.server";

/**
 * Sozlamalar ombori.
 * Supabase mavjud bo'lsa — o'sha yerda saqlanadi.
 * Aks holda jarayon xotirasida ishlaydi, ya'ni bot hech qachon "o'lmaydi".
 */

const memory = new Map<string, string>();
let dbBroken = false;

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function storeGet(key: string): Promise<string | null> {
  if (memory.has(key)) return memory.get(key) ?? null;
  if (dbBroken) return null;
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
    dbBroken = true;
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
    dbBroken = false;
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
