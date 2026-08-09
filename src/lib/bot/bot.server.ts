import { botLog } from "./logger.server";

/* ------------------------------------------------------------------ config */

function normalizeUrl(raw?: string | null) {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  const url = value.startsWith("http") ? value : `https://${value}`;
  return url.replace(/\/+$/, "");
}

export function appUrl() {
  return (
    normalizeUrl(process.env["PUBLIC_APP_URL"]) ??
    normalizeUrl(process.env["RAILWAY_PUBLIC_DOMAIN"]) ??
    "https://project--8458c9ea-6160-4ab3-994b-990da916b84a-dev.lovable.app"
  );
}

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

async function send(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  const payload = await tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
  // Agar klaviatura/web_app tufayli xato bo'lsa — matnni klaviatarasiz yuboramiz.
  if (payload.ok === false && extra['reply_markup']) {
    await tg("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }
  return payload;
}

/* ---------------------------------------------------------------- settings */

const RULES_DEFAULT = [
  "📜 <b>PUBG MARKET — QOIDALAR</b>",
  "",
  "🎯 <b>1. UMUMIY</b>",
  "• Bu yerda faqat <b>PUBG Mobile</b> akkauntlari oldi-sotdisi.",
  "• Har bir kelishuv <b>admin kafolati</b> ostida o'tadi. Adminsiz savdo = xavf.",
  "• Aldov, spam va soxta e'lon — <b>bir umrlik ban</b> 🚫",
  "",
  "🛒 <b>2. XARIDOR UCHUN</b>",
  "• Avval akkauntning <b>video va rasmlarini</b> to'liq ko'ring.",
  "• Pulni faqat <b>admin orqali</b> o'tkazing. To'g'ridan-to'g'ri o'tkazma — o'z javobgarligingizda.",
  "• Akkaunt qabul qilingach, <b>mail va parolni darhol almashtiring</b> 🔐",
  "",
  "💰 <b>3. SOTUVCHI UCHUN</b>",
  "• E'londa <b>haqiqiy</b> LVL, skin, RP va statistikani ko'rsating.",
  "• Rasm va video <b>o'zingizniki</b> bo'lsin, internetdan olingan bo'lmasin.",
  "• Sotilgan akkauntni <b>qayta tiklashga urinish</b> — ban + qora ro'yxat ⚠️",
  "",
  "🤝 <b>4. SAVDO TARTIBI</b>",
  "1️⃣ Xaridor adminga yozadi",
  "2️⃣ Admin sotuvchi bilan bog'lanadi",
  "3️⃣ Pul admin qo'lida turadi (garant)",
  "4️⃣ Akkaunt topshiriladi va tekshiriladi",
  "5️⃣ Pul sotuvchiga o'tkaziladi ✅",
  "",
  "⏱ <b>5. MUHIM</b>",
  "• Tekshiruv muddati: <b>24 soat</b>. Shu vaqt ichida muammo bo'lsa — admin hal qiladi.",
  "• Qoidalarni buzgan tomon pulni qaytaradi.",
  "",
  "🔥 <b>GG WP — halol savdo, tinch o'yin!</b>",
].join("\n");

export const SETTING_DEFAULTS: Record<string, string> = {
  bot_welcome:
    "🎮 <b>PUBG MARKET</b>\n\n⚔️ Akkaunt sotib olish yoki sotish uchun quyidagi menyudan foydalaning.\n🔒 Har bir savdo admin kafolati ostida.",
  bot_about:
    "ℹ️ <b>Biz haqimizda</b>\n\nPUBG MARKET — akkauntlarni xavfsiz oldi-sotdi qiladigan garant platforma. 🛡\nHar bir kelishuv admin nazoratida amalga oshiriladi.",
  bot_price: "💰 <b>Xizmat haqi:</b> 5% (kelishuv summasidan)",
  bot_orders_empty: "🧾 Sizda hozircha buyurtma yo'q. Magazindan akkaunt tanlang 👇",
  bot_support: "@admin",
  bot_rules: RULES_DEFAULT,
  bot_admin_ids: "",
};

export const EDITABLE: { key: string; label: string }[] = [
  { key: "bot_welcome", label: "👋 Salomlashish matni" },
  { key: "bot_rules", label: "📜 Qoidalar matni" },
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
    const value = (data?.value ?? "").trim();
    return value || SETTING_DEFAULTS[key] || "";
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
  try {
    const fromEnv = (process.env["BOT_ADMIN_IDS"] ?? "").split(",");
    const fromDb = (await getSetting("bot_admin_ids")).split(",");
    return [...fromEnv, ...fromDb].map((s) => s.trim()).includes(String(userId));
  } catch (error) {
    botLog.error("is_admin_failed", error, { userId });
    return (process.env["BOT_ADMIN_IDS"] ?? "")
      .split(",")
      .map((s) => s.trim())
      .includes(String(userId));
  }
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
  try {
    const client = await db();
    const { data } = await client
      .from("app_settings")
      .select("value")
      .eq("key", stateKey(chatId))
      .maybeSingle();
    return (data?.value ?? "").trim();
  } catch {
    return "";
  }
}

/* --------------------------------------------------------------- keyboards */

const BTN = {
  shop: "🛒 MAGAZIN",
  sell: "💰 Sotish",
  orders: "🧾 E'lonlar",
  rules: "📜 Qoidalar",
  profile: "👤 Profil",
  about: "ℹ️ Ma'lumot",
  contact: "📞 Aloqa",
  home: "🏠 Bosh menyu",
  admin: "🛠 Admin panel",
};

function mainKeyboard(admin: boolean) {
  const url = appUrl();
  return {
    keyboard: [
      [{ text: BTN.shop, web_app: { url } }],
      [{ text: BTN.sell }, { text: BTN.orders }],
      [{ text: BTN.rules }, { text: BTN.profile }],
      [{ text: BTN.about }, { text: BTN.contact }],
      ...(admin ? [[{ text: BTN.admin }]] : []),
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "Menyudan tanlang 🎮",
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

function shopInline(label = "🛒 Magazinni ochish") {
  return { inline_keyboard: [[{ text: label, web_app: { url: appUrl() } }]] };
}

/* ----------------------------------------------------------------- screens */

async function showMain(chatId: number, userId: number, name: string) {
  const welcome = await getSetting("bot_welcome");
  const admin = await isAdmin(userId);
  await send(
    chatId,
    `${welcome}\n\n👋 Salom, <b>${escapeHtml(name)}</b>! Omad tilaymiz — <b>GG</b> 🔥`,
    { reply_markup: mainKeyboard(admin) },
  );
  await send(
    chatId,
    "⚡️ <b>Nima qilamiz?</b>\n🛒 Akkaunt olish\n💰 Akkaunt sotish\n📜 Qoidalarni o'qish",
    { reply_markup: shopInline() },
  );
}

async function showRules(chatId: number) {
  const rules = await getSetting("bot_rules");
  await send(chatId, rules, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛒 Magazinni ochish", web_app: { url: appUrl() } }],
        [{ text: "📞 Admin bilan bog'lanish", callback_data: "contact" }],
      ],
    },
  });
}

async function showProfile(chatId: number, userId: number, name: string, username?: string) {
  const admin = await isAdmin(userId);
  await send(
    chatId,
    [
      "👤 <b>PROFIL</b>",
      "━━━━━━━━━━━━━━",
      `🏷 Ism: <b>${escapeHtml(name)}</b>`,
      username ? `🔗 Username: @${escapeHtml(username)}` : "🔗 Username: —",
      `🆔 Telegram ID: <code>${userId}</code>`,
      `🎖 Maqom: ${admin ? "👑 Admin" : "🎮 Gamer"}`,
    ].join("\n"),
    { reply_markup: shopInline("🛒 Magazin") },
  );
}

async function showOrders(chatId: number) {
  try {
    const client = await db();
    const { data, error } = await client
      .from("accounts")
      .select("title, price, currency, sold, level")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    if (!data || data.length === 0) {
      await send(chatId, await getSetting("bot_orders_empty"), { reply_markup: shopInline() });
      return;
    }
    const lines = data.map(
      (a) =>
        `${a.sold ? "❌" : "✅"} <b>${escapeHtml(a.title)}</b>\n   🎯 LVL ${a.level ?? "—"} · 💵 ${Number(
          a.price,
        ).toLocaleString("ru-RU")} ${a.currency}`,
    );
    await send(chatId, `🧾 <b>SO'NGGI E'LONLAR</b>\n━━━━━━━━━━━━━━\n${lines.join("\n\n")}`, {
      reply_markup: shopInline(),
    });
  } catch (error) {
    botLog.error("orders_failed", error, { chatId });
    await send(chatId, "⚠️ E'lonlarni olishda xatolik. Keyinroq urinib ko'ring.", {
      reply_markup: shopInline(),
    });
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
  try {
    if (update.callback_query) return await handleCallback(update.callback_query);
    await handleMessage(update);
  } catch (error) {
    botLog.error("handle_update_failed", error);
    const chatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
    if (chatId) {
      // Hech qachon jim qolmaydi — hech bo'lmasa menyuni qaytaramiz.
      await tg("sendMessage", {
        chat_id: chatId,
        text: "🎮 PUBG MARKET\n\nMenyu tayyor 👇",
        reply_markup: mainKeyboard(false),
      }).catch(() => {});
    }
  }
}

async function handleMessage(update: Update) {
  const message = update.message;
  const chatId = message?.chat?.id;
  const userId = message?.from?.id;
  if (!chatId || !userId) return;

  const text = (message?.text ?? "").trim();
  const command = (text.split(/\s+/)[0] ?? "").toLowerCase().split("@")[0] ?? "";
  const name = message?.from?.first_name ?? "gamer";
  botLog.info("message", { chatId, userId, text: text.slice(0, 64) });

  // /start hech narsaga bog'liq bo'lmasin: birinchi navbatda ishlaydi.
  if (command === "/start" || command === "/menu" || command === "/help") {
    await setPendingEdit(chatId, null);
    await showMain(chatId, userId, name);
    return;
  }
  if (command === "/qoida" || command === "/qoidalar" || command === "/rules") {
    await showRules(chatId);
    return;
  }

  // Admin uchun kutilayotgan tahrir
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
    case BTN.rules:
      await showRules(chatId);
      return;
    case BTN.about:
      await send(chatId, `${await getSetting("bot_about")}\n\n${await getSetting("bot_price")}`, {
        reply_markup: shopInline(),
      });
      return;
    case BTN.contact:
      await send(chatId, `📞 <b>Aloqa</b>\nAdmin: ${escapeHtml(await getSetting("bot_support"))}`);
      return;
    case BTN.shop:
      await send(chatId, "🛒 <b>Magazin</b> — pastdagi tugma orqali oching 👇", {
        reply_markup: shopInline(),
      });
      return;
    case BTN.sell:
      await send(
        chatId,
        "💰 <b>Akkaunt sotish</b>\n\n1️⃣ Magazinni oching\n2️⃣ «Sotish» bo'limiga o'ting\n3️⃣ Rasm va videolarni yuklang\n4️⃣ Narx va statistikani yozing ✅",
        { reply_markup: shopInline("💰 Sotishni boshlash") },
      );
      return;
    case BTN.admin:
    case "/admin":
    case "/panel":
      if (!(await isAdmin(userId))) {
        botLog.warn("admin_denied", { userId });
        await send(chatId, "⛔️ Bu bo'lim faqat adminlar uchun.");
        return;
      }
      await send(chatId, "🛠 <b>ADMIN PANEL</b>\nO'zgartirmoqchi bo'lgan bandni tanlang:", {
        reply_markup: adminKeyboard(),
      });
      return;
    default:
      await send(chatId, "🎮 Quyidagi menyudan foydalaning 👇", {
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

  if (data === "contact") {
    await send(chatId, `📞 <b>Aloqa</b>\nAdmin: ${escapeHtml(await getSetting("bot_support"))}`);
    return;
  }

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
        `📊 <b>Statistika</b>\n🧾 Jami e'lonlar: ${total ?? 0}\n✅ Sotilgan: ${sold ?? 0}`,
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

/* ------------------------------------------------------------ webhook setup */

let webhookEnsured = false;

/** Railway domenidan foydalanib webhookni avtomatik ro'yxatdan o'tkazadi. */
export async function ensureWebhook(origin?: string) {
  if (webhookEnsured) return;
  webhookEnsured = true;
  try {
    if (!process.env["TELEGRAM_BOT_TOKEN"]) return;
    const base = normalizeUrl(origin) ?? appUrl();
    const url = `${base}/api/public/telegram/webhook`;
    const info = (await tg("getWebhookInfo", {})) as { result?: { url?: string } };
    if (info.result?.url === url) {
      botLog.info("webhook_ok", { url });
      return;
    }
    const secret = process.env["TELEGRAM_WEBHOOK_SECRET"];
    await tg("setWebhook", {
      url,
      ...(secret ? { secret_token: secret } : {}),
      allowed_updates: ["message", "edited_message", "callback_query"],
      drop_pending_updates: false,
    });
    await tg("setMyCommands", {
      commands: [
        { command: "start", description: "🎮 Bosh menyu" },
        { command: "qoidalar", description: "📜 Qoidalar" },
        { command: "menu", description: "🏠 Menyuni ko'rsatish" },
        { command: "help", description: "ℹ️ Yordam" },
      ],
    });
    botLog.info("webhook_set", { url });
  } catch (error) {
    webhookEnsured = false;
    botLog.error("webhook_ensure_failed", error);
  }
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
