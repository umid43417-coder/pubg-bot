import { createFileRoute } from "@tanstack/react-router";
import { createHmac, createHash } from "node:crypto";

/**
 * Telegram Mini App "bir bosishda kirish".
 * initData HMAC bilan tekshiriladi, so'ng foydalanuvchiga magic-link token beriladi.
 */
function verifyInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calc = createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (calc !== hash) return null;
  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
  try {
    return JSON.parse(params.get("user") ?? "null") as {
      id: number;
      first_name?: string;
      username?: string;
    } | null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/tg-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const botToken = process.env["TELEGRAM_BOT_TOKEN"];
        if (!botToken) return Response.json({ error: "bot_not_configured" }, { status: 500 });

        let initData = "";
        try {
          const body = (await request.json()) as { initData?: unknown };
          initData = typeof body.initData === "string" ? body.initData : "";
        } catch {
          return Response.json({ error: "bad_request" }, { status: 400 });
        }
        if (!initData) return Response.json({ error: "bad_request" }, { status: 400 });

        const tgUser = verifyInitData(initData, botToken);
        if (!tgUser?.id) return Response.json({ error: "invalid_init_data" }, { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = `tg${tgUser.id}@pubgmarket.app`;
        const password = createHash("sha256")
          .update(`${botToken}:${tgUser.id}`)
          .digest("hex")
          .slice(0, 32);

        const created = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            username: tgUser.username ?? tgUser.first_name ?? `tg${tgUser.id}`,
            telegram_id: tgUser.id,
          },
        });
        if (created.error && !/already/i.test(created.error.message)) {
          return Response.json({ error: created.error.message }, { status: 500 });
        }

        if (created.error) {
          // Mavjud hisob — parolni sinxronlaymiz.
          const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
          const existing = list?.users.find((u) => u.email === email);
          if (existing) {
            await supabaseAdmin.auth.admin.updateUserById(existing.id, {
              password,
              email_confirm: true,
            });
          }
        }

        return Response.json({ email, password });
      },
    },
  },
});
