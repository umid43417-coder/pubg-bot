import { createFileRoute } from "@tanstack/react-router";

/** Sozlamalar holatini tekshirish (maxfiy qiymatlar ko'rsatilmaydi). */
export const Route = createFileRoute("/api/public/diag")({
  server: {
    handlers: {
      GET: async () => {
        const has = (k: string) => Boolean(process.env[k]?.trim());
        let accounts: number | string = "n/a";
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { count, error } = await supabaseAdmin
            .from("accounts")
            .select("id", { count: "exact", head: true });
          accounts = error ? `error: ${error.message}` : (count ?? 0);
        } catch (error) {
          accounts = `error: ${String(error)}`;
        }
        return Response.json({
          ok: true,
          env: {
            TELEGRAM_BOT_TOKEN: has("TELEGRAM_BOT_TOKEN"),
            TELEGRAM_WEBHOOK_SECRET: has("TELEGRAM_WEBHOOK_SECRET"),
            SUPABASE_URL: has("SUPABASE_URL"),
            SUPABASE_PUBLISHABLE_KEY: has("SUPABASE_PUBLISHABLE_KEY"),
            SUPABASE_SERVICE_ROLE_KEY: has("SUPABASE_SERVICE_ROLE_KEY"),
            PUBLIC_APP_URL: has("PUBLIC_APP_URL"),
            BOT_ADMIN_IDS: has("BOT_ADMIN_IDS"),
          },
          accounts,
        });
      },
    },
  },
});
