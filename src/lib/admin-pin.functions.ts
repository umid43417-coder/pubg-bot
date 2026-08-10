import { createServerFn } from "@tanstack/react-start";

/** Admin panel uchun qo'shimcha PIN. Qiymat ADMIN_PANEL_PIN env orqali o'zgartiriladi. */
export const verifyAdminPin = createServerFn({ method: "POST" })
  .inputValidator((data: { pin: string }) => ({ pin: String(data?.pin ?? "") }))
  .handler(async ({ data }) => {
    const expected = (process.env["ADMIN_PANEL_PIN"] ?? "pubg2026").trim();
    return { ok: data.pin.trim() === expected };
  });
