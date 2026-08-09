import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { botLog } = await import("@/lib/bot/logger.server");
        try {
          const secret = process.env["TELEGRAM_WEBHOOK_SECRET"];
          if (secret && request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) {
            botLog.warn("webhook_unauthorized");
            return new Response("Unauthorized", { status: 401 });
          }

          const update = await request.json();
          const { handleUpdate } = await import("@/lib/bot/bot.server");
          await handleUpdate(update);
          return Response.json({ ok: true });
        } catch (error) {
          botLog.error("webhook_failed", error);
          // Always 200 so Telegram does not retry-storm the endpoint.
          return Response.json({ ok: true, handled: false });
        }
      },
      GET: async () => Response.json({ ok: true, service: "telegram-webhook" }),
    },
  },
});
