import { createFileRoute } from "@tanstack/react-router";

/**
 * Login + parol bilan ro'yxatdan o'tish.
 * Supabase'ning email yuborish/tasdiqlash cheklovlarini chetlab o'tish uchun
 * hisob service-role orqali darhol tasdiqlangan holda yaratiladi.
 */
function loginToEmail(raw: string) {
  const value = raw.trim().toLowerCase();
  if (value.includes("@")) return value;
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 9 && /^[+\d\s()-]+$/.test(value)) return `p${digits}@pubgmarket.app`;
  const safe = value.replace(/[^a-z0-9_.-]/g, "");
  return `${safe}@pubgmarket.app`;
}

export const Route = createFileRoute("/api/public/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let login = "";
        let password = "";
        try {
          const body = (await request.json()) as { login?: unknown; password?: unknown };
          login = typeof body.login === "string" ? body.login.trim() : "";
          password = typeof body.password === "string" ? body.password : "";
        } catch {
          return Response.json({ error: "bad_request" }, { status: 400 });
        }

        if (login.replace(/[^a-z0-9@._-]/gi, "").length < 3) {
          return Response.json({ error: "login_too_short" }, { status: 400 });
        }
        if (password.length < 6 || password.length > 72) {
          return Response.json({ error: "password_invalid" }, { status: 400 });
        }

        const email = loginToEmail(login);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const created = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username: login },
        });

        if (created.error) {
          if (/already|registered|exists/i.test(created.error.message)) {
            return Response.json({ error: "already_registered" }, { status: 409 });
          }
          return Response.json({ error: created.error.message }, { status: 500 });
        }

        return Response.json({ ok: true, email });
      },
    },
  },
});
