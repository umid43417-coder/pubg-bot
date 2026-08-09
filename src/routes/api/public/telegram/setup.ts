import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhookni ro'yxatdan o'tkazish uchun yordamchi endpoint.
 *
 *   GET /api/public/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>
 *
 * Joriy domenni Telegram'ga webhook sifatida yozadi va holatni qaytaradi.
 */
export const Route = createFileRoute("/api/public/telegram/setup")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { tg, webhookSecret, isValidSecret } = await import("@/lib/bot/bot.server");
        const secret = webhookSecret();
        const url = new URL(request.url);
        const key = url.searchParams.get("key") ?? "";
        if (!secret || !isValidSecret(key)) {
          return new Response("Unauthorized", { status: 401 });
        }

        // Proksi orqasida url.origin "http" bo'lishi mumkin — Telegram faqat HTTPS qabul qiladi.
        const { appUrl } = await import("@/lib/bot/bot.server");
        const origin = appUrl() ?? url.origin.replace(/^http:/, "https:");
        const webhookUrl = `${origin.replace(/^http:/, "https:")}/api/public/telegram/webhook`;

        const set = await tg("setWebhook", {
          url: webhookUrl,
          secret_token: secret,
          allowed_updates: ["message", "edited_message", "callback_query"],
          drop_pending_updates: false,
        });
        const info = await tg("getWebhookInfo", {});

        return Response.json({ webhookUrl, set, info });
      },
    },
  },
});
