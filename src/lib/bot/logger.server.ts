// Structured logging for the Telegram bot. Every line lands in Railway logs.

type Level = "info" | "warn" | "error";

function emit(level: Level, event: string, data?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    scope: "tg-bot",
    event,
    ...(data ?? {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  void persist(level, event, data);
}

async function persist(level: Level, event: string, data?: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const message = typeof data?.["message"] === "string" ? data["message"] : null;
    const metadata = Object.fromEntries(
      Object.entries(data ?? {}).filter(([key, value]) => key !== "stack" && value !== undefined),
    );
    const { error } = await supabaseAdmin.from("bot_logs").insert({
      level,
      event,
      message,
      metadata,
    });
    if (error && error.code !== "42P01") console.error(`[tg-bot] log persistence failed: ${error.message}`);
  } catch {
    // Railway stdout remains the guaranteed fallback when the database is unavailable.
  }
}

export const botLog = {
  info: (event: string, data?: Record<string, unknown>) => emit("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => emit("warn", event, data),
  error: (event: string, error: unknown, data?: Record<string, unknown>) =>
    emit("error", event, {
      ...(data ?? {}),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }),
};
