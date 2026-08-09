import { createFileRoute } from "@tanstack/react-router";

const APP_URL =
  process.env["PUBLIC_APP_URL"] ??
  "https://project--8458c9ea-6160-4ab3-994b-990da916b84a-dev.lovable.app";

async function tg(method: string, body: unknown) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Telegram ${method} failed [${res.status}]: ${text}`);
  }
  return res;
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["TELEGRAM_WEBHOOK_SECRET"];
        if (
          secret &&
          request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret
        ) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as {
          message?: { chat?: { id?: number }; text?: string };
        };
        const chatId = update.message?.chat?.id;
        if (!chatId) return Response.json({ ok: true, ignored: true });

        await tg("sendMessage", {
          chat_id: chatId,
          text: "🎮 <b>PUBG Market</b>\n\nAkkaunt sotish yoki sotib olish uchun magazinni oching.",
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: "🛒 Magazinni ochish", web_app: { url: APP_URL } }]],
          },
        });

        return Response.json({ ok: true });
      },
    },
  },
});
