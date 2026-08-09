import { botLog } from "./logger.server";

const APP_URL =
  process.env["PUBLIC_APP_URL"] ??
  "https://project--8458c9ea-6160-4ab3-994b-990da916b84a-dev.lovable.app";

/* ---------------------------------------------------------------- telegram */

export async function tg(method: string, body: unknown) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!res.ok || payload.ok === false) {
    botLog.error("telegram_api_failed", new Error(payload.description ?? "unknown"), {
      method,
      status: res.status,
    });
  }
  return payload;
}

const send = (chatId: number, text: string, extra: Record<string, unknown> = {}) =>
  tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });

/* ---------------------------------------------------------------- settings */

export const SETTING_DEFAULTS: Record<string, string> = {
  bot_welcome:
    "🎮 <b>PUBG MARKET</b>\n\nAkkaunt sotib olish yoki sotish uchun quyidagi tugmalardan foydalaning.",
  bot_about: "Bizda har bir kelishuv admin kafolati ostida amalga oshiriladi. 🔒",
  bot_price: "Xizmat haqi: 5% (kelishuv summasidan)",
  bot_orders_empty: "Sizda hozircha buyurtma yo'q. Magazindan akkaunt tanlang 👇",
  bot_support: "@admin",
  bot_admin_ids: "",
};

export const EDITABLE: { key: string; label: string }[] = [
  { key: "bot_welcome", label: "👋 Salomlashish matni" },
  { key: "bot_about", label: "ℹ️ Biz haqimizda" },
  { key: "bot_price", label: "💰 Narx / xizmat haqi" },
  { key: "bot_orders_empty", label: "🧾 Buyurtma bo'sh matni" },
  { key: "bot_support", label: "📞 Aloqa (admin username)" },
  { key: "bot_admin_ids", label: "👑 Admin ID lar (vergul bilan)" },
];

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function getSetting(key: string): Promise<string> {
  try {
    const client = await db();
    const { data, error } = await client
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data?.value ?? SETTING_DEFAULTS[key] ?? "";
  } catch (error) {
    botLog.error("setting_read_failed", error, { key });
    return SETTING_DEFAULTS[key] ?? "";
  }
}

export async function setSetting(key: string, value: string) {
  const client = await db();
  const { error } = await client
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
  botLog.info("setting_updated", { key });
}

async function isAdmin(userId: number): Promise<boolean> {
  const fromEnv = (process.env["BOT_ADMIN_IDS"] ?? "").split(",");
  const fromDb = (await getSetting("bot_admin_ids")).split(",");
  return [...fromEnv, ...fromDb].map((s) => s.trim()).includes(String(userId));
}

/* ------------------------------------------------------------- edit states */

const stateKey = (chatId: number) => `bot_state:${chatId}`;

async function setPendingEdit(chatId: number, key: string | null) {
  try {
    await setSetting(stateKey(chatId), key ?? "");
  } catch (error) {
    botLog.error("pending_edit_failed", error, { chatId });
  }
}

async function getPendingEdit(chatId: number): Promise<string> {
  return (await getSetting(stateKey(chatId))).trim();
}

/* ---------------------------------------------------------------- keyboards */

const BTN = {
  home: "🏠 Bosh menyu",
  profile: "👤 Profil",
  orders: "🧾 Buyurtmalar",
  shop: "🛒 Magazin",
  about: "ℹ️ Ma'lumot",
  contact: "📞 Aloqa",
  admin: "🛠 Admin panel",
};

function mainKeyboard(admin: boolean) {
  return {
    keyboard: [
      [{ text: BTN.shop, web_app: { url: APP_URL } }, { text: BTN.profile }],
      [{ text: BTN.orders }, { text: BTN.about }],
      [{ text: BTN.contact }, { text: BTN.home }],
      ...(admin ? [[{ text: BTN.admin }]] : []),
    ],
    resize_keyboard: true,
  };
}

function adminKeyboard() {
  return {
    inline_keyboard: [
      ...EDITABLE.map((item) => [{ text: item.label, callback_data: `edit:${item.key}` }]),
      [{ text: "📊 Statistika", callback_data: "stats" }],
      [{ text: "✖️ Yopish", callback_data: "close" }],
    ],
  };
}

const shopButton = { inline_keyboard: [[{ text: "🛒 Magazinni ochish", web_app: { url: APP_URL } }]] };

/* ------------------------------------------------------------------ screens */

async function showMain(chatId: number, userId: number, name: string) {
  let welcome = SETTING_DEFAULTS["bot_welcome"]!;
  let admin = false;
  try {
    welcome = await getSetting("bot_welcome");
    admin = await isAdmin(userId);
  } catch (error) {
    botLog.error("main_menu_settings_failed", error, { chatId });
  }
  await send(chatId, `${welcome}\n\nSalom, <b>${escapeHtml(name)}</b>!`, {
    reply_markup: mainKeyboard(admin),
  });
  await send(chatId, "Magazinni shu yerdan oching 👇", { reply_markup: shopButton });
}

async function showProfile(chatId: number, userId: number, name: string, username?: string) {
  const admin = await isAdmin(userId);
  await send(
    chatId,
    [
      "👤 <b>Profil</b>",
      `Ism: ${escapeHtml(name)}`,
      username ? `Username: @${escapeHtml(username)}` : "Username: —",
      `Telegram ID: <code>${userId}</code>`,
      `Maqom: ${admin ? "👑 Admin" : "🎮 Foydalanuvchi"}`,
    ].join("\n"),
  );
}

async function showOrders(chatId: number) {
  try {
    const client = await db();
    const { data, error } = await client
      .from("accounts")
      .select("title, price, currency, sold")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    if (!data || data.length === 0) {
      await send(chatId, await getSetting("bot_orders_empty"), { reply_markup: shopButton });
      return;
    }
    const lines = data.map(
      (a) =>
        `• <b>${escapeHtml(a.title)}</b> — ${Number(a.price).toLocaleString("ru-RU")} ${a.currency}${
          a.sold ? " (sotilgan)" : ""
        }`,
    );
    await send(chatId, `🧾 <b>So'nggi e'lonlar</b>\n\n${lines.join("\n")}`, {
      reply_markup: shopButton,
    });
  } catch (error) {
    botLog.error("orders_failed", error, { chatId });
    await send(chatId, "⚠️ Buyurtmalarni olishda xatolik. Keyinroq urinib ko'ring.");
  }
}

/* ------------------------------------------------------------- update entry */

type Update = {
  update_id?: number;
  message?: {
    chat?: { id?: number };
    from?: { id?: number; first_name?: string; username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    from?: { id?: number; first_name?: string };
    message?: { chat?: { id?: number } };
  };
};

export async function handleUpdate(update: Update) {
  if (update.callback_query) return handleCallback(update.callback_query);

  const message = update.message;
  const chatId = message?.chat?.id;
  const userId = message?.from?.id;
  if (!chatId || !userId) return;

  const text = (message?.text ?? "").trim();
  // "/start ref123" kabi argumentli buyruqlarni ham tushunadi
  const command = text.split(/\s+/)[0]?.toLowerCase() ?? "";
  const name = message?.from?.first_name ?? "gamer";
  botLog.info("message", { chatId, userId, text: text.slice(0, 64) });

  // pending admin edit takes priority
  const pending = await getPendingEdit(chatId);
  if (pending && !text.startsWith("/") && text !== BTN.home) {
    if (!(await isAdmin(userId))) {
      await setPendingEdit(chatId, null);
      await send(chatId, "⛔️ Ruxsat yo'q.");
      return;
    }
    await setSetting(pending, text);
    await setPendingEdit(chatId, null);
    await send(chatId, "✅ Saqlandi.", { reply_markup: adminKeyboard() });
    return;
  }

  if (command === "/start" || command === "/menu" || command === "/help") {
    await showMain(chatId, userId, name);
    return;
  }

  switch (text) {
    case BTN.home:
      await showMain(chatId, userId, name);
      return;
    case BTN.profile:
      await showProfile(chatId, userId, name, message?.from?.username);
      return;
    case BTN.orders:
      await showOrders(chatId);
      return;
    case BTN.about:
      await send(chatId, `${await getSetting("bot_about")}\n\n${await getSetting("bot_price")}`);
      return;
    case BTN.contact:
      await send(chatId, `📞 Aloqa: ${escapeHtml(await getSetting("bot_support"))}`);
      return;
    case BTN.shop:
      await send(chatId, "🛒 Magazin:", { reply_markup: shopButton });
      return;
    case BTN.admin:
    case "/admin":
    case "/panel":
      if (!(await isAdmin(userId))) {
        botLog.warn("admin_denied", { userId });
        await send(chatId, "⛔️ Bu bo'lim faqat adminlar uchun.");
        return;
      }
      await send(chatId, "🛠 <b>Admin panel</b>\nO'zgartirmoqchi bo'lgan bandni tanlang:", {
        reply_markup: adminKeyboard(),
      });
      return;
    default:
      await send(chatId, "Quyidagi tugmalardan foydalaning 👇", {
        reply_markup: mainKeyboard(await isAdmin(userId)),
      });
  }
}

async function handleCallback(cb: NonNullable<Update["callback_query"]>) {
  const chatId = cb.message?.chat?.id;
  const userId = cb.from?.id;
  const data = cb.data ?? "";
  await tg("answerCallbackQuery", { callback_query_id: cb.id });
  if (!chatId || !userId) return;

  if (!(await isAdmin(userId))) {
    botLog.warn("admin_callback_denied", { userId, data });
    await send(chatId, "⛔️ Ruxsat yo'q.");
    return;
  }

  if (data === "close") {
    await setPendingEdit(chatId, null);
    await send(chatId, "Yopildi.", { reply_markup: mainKeyboard(true) });
    return;
  }

  if (data === "stats") {
    try {
      const client = await db();
      const [{ count: total }, { count: sold }] = await Promise.all([
        client.from("accounts").select("id", { count: "exact", head: true }),
        client.from("accounts").select("id", { count: "exact", head: true }).eq("sold", true),
      ]);
      await send(
        chatId,
        `📊 <b>Statistika</b>\nJami e'lonlar: ${total ?? 0}\nSotilgan: ${sold ?? 0}`,
        { reply_markup: adminKeyboard() },
      );
    } catch (error) {
      botLog.error("stats_failed", error);
      await send(chatId, "⚠️ Statistikani olishda xatolik.");
    }
    return;
  }

  if (data.startsWith("edit:")) {
    const key = data.slice(5);
    if (!EDITABLE.some((item) => item.key === key)) return;
    await setPendingEdit(chatId, key);
    const current = await getSetting(key);
    await send(
      chatId,
      `✏️ Hozirgi qiymat:\n<code>${escapeHtml(current || "—")}</code>\n\nYangi matnni yuboring. Bekor qilish: ${BTN.home}`,
    );
  }
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
