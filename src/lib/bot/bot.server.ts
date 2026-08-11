import { botLog } from "./logger.server";
import { claimUpdate, recentLogs, storeCount, storeGet, storeSet } from "./store.server";
import { createHash } from "node:crypto";
import {
  filledFields,
  filledSections,
  formatValue,
  isFilled,
  sectionById,
  type AccountDetails,
} from "@/lib/pubg-spec";

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
    "https://pubg-bot-production-21d9.up.railway.app"
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
    signal: AbortSignal.timeout(8_000),
  });
  const payload = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
    result?: unknown;
  };
  if (!res.ok || payload.ok === false) {
    botLog.error("telegram_api_failed", new Error(payload.description ?? "unknown"), {
      method,
      status: res.status,
    });
  }
  return payload;
}

export function derivedSecret() {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return null;
  return createHash("sha256").update(`telegram-webhook:${token}`).digest("base64url");
}

/** Webhook uchun yaroqli kalitlar: sozlangan + tokendan hosil qilingan. */
export function validSecrets(): string[] {
  const configured = process.env["TELEGRAM_WEBHOOK_SECRET"]?.trim();
  const derived = derivedSecret();
  return [configured, derived].filter(Boolean) as string[];
}

export function isValidSecret(candidate: string | null | undefined) {
  const value = (candidate ?? "").trim();
  if (!value) return false;
  return validSecrets().includes(value);
}

export function webhookSecret() {
  const configured = process.env["TELEGRAM_WEBHOOK_SECRET"]?.trim();
  if (configured) return configured;
  return derivedSecret();
}

async function send(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  const payload = await tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...extra,
  });
  if (payload.ok === false && extra["reply_markup"]) {
    await tg("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
  }
  return payload;
}

/* --------------------------------------------------------------- defaults */

const RULES_DEFAULT = [
  "📜 <b>PUBG SAVDO — QOIDALAR</b>",
  "━━━━━━━━━━━━━━━━━━",
  "",
  "🎯 <b>1. UMUMIY</b>",
  "• Bu yerda faqat <b>PUBG Mobile</b> va o'yin xizmatlari savdosi.",
  "• Har bir kelishuv <b>admin kafolati (garant)</b> ostida o'tadi.",
  "• Aldov, spam va soxta e'lon — <b>bir umrlik ban</b> 🚫",
  "",
  "🛒 <b>2. XARIDOR UCHUN</b>",
  "• Avval akkauntning <b>video va rasmlarini</b> to'liq ko'ring.",
  "• Pulni faqat <b>admin orqali</b> o'tkazing.",
  "• Akkaunt qabul qilingach, <b>mail va parolni darhol almashtiring</b> 🔐",
  "",
  "💰 <b>3. SOTUVCHI UCHUN</b>",
  "• E'londa <b>haqiqiy</b> LVL, skin, RP va statistikani ko'rsating.",
  "• Sotilgan akkauntni qaytarishga urinish — ban + qora ro'yxat ⚠️",
  "",
  "🤝 <b>4. SAVDO TARTIBI</b>",
  "1️⃣ Xaridor adminga yozadi",
  "2️⃣ Admin sotuvchi bilan bog'lanadi",
  "3️⃣ Pul admin qo'lida turadi (garant)",
  "4️⃣ Akkaunt topshiriladi va tekshiriladi",
  "5️⃣ Pul sotuvchiga o'tkaziladi ✅",
  "",
  "⏱ <b>5. MUHIM</b>",
  "• Tekshiruv muddati: <b>24 soat</b>.",
  "• Qoidani buzgan tomon pulni qaytaradi.",
  "",
  "🔥 <b>GG WP — halol savdo, tinch o'yin!</b>",
].join("\n");

export const SETTING_DEFAULTS: Record<string, string> = {
  bot_welcome:
    "🎮 <b>PUBG AKKAUNT MARKET</b> 🎮\n━━━━━━━━━━━━━━━━━━\n⚔️ PUBG akkauntlarni <b>xavfsiz</b>, tez va qulay sotib oling yoki soting.\n🛡 Admin o'rtada turadi — <b>100% kafolat (escrow)</b>.\n⚡️ Tez • Ishonchli • Arzon",
  bot_about:
    "ℹ️ <b>BIZ HAQIMIZDA</b>\n━━━━━━━━━━━━━━━━━━\n🏆 PUBG AKKAUNT MARKET — o'yinchilar uchun garant platforma.\n🛡 Har bir kelishuv admin nazoratida.\n⏱ 24/7 qo'llab-quvvatlash.\n💎 Minglab mamnun mijozlar.",
  bot_price: "💰 <b>Xizmat haqi:</b> 5% (kelishuv summasidan)",
  bot_orders_empty: "🧾 Hozircha e'lon yo'q. Magazindan tanlang 👇",
  bot_support: "@PUBG_SAVDO_ORG_ADMIN",
  bot_channel: "https://t.me/PUBG_SAVDO_CHANNEL",
  bot_reviews: "https://t.me/PUBG_SAVDO_CHANNEL",
  bot_force_sub: "on",
  bot_rules: RULES_DEFAULT,
  bot_admin_ids: "",
  bot_guarantee: [
    "🛡 <b>KAFOLAT (ESKROU) TIZIMI</b>",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "1️⃣ Xaridor akkauntni tanlaydi va sotib oladi",
    "2️⃣ Pul <b>botga (adminga)</b> keladi — kafolatga qo'yiladi",
    "3️⃣ Sotuvchi akkaunt ma'lumotlarini topshiradi",
    "4️⃣ Xaridor akkauntni tekshiradi (12–24 soat)",
    "5️⃣ Tasdiqlansa → pul sotuvchiga o'tadi ✅",
    "",
    "🔐 Firibgarlik bo'lsa — pul <b>to'liq qaytariladi</b>.",
    "⚠️ Adminni chetlab o'tib to'lov qilmang!",
  ].join("\n"),
  bot_payments: [
    "💳 <b>TO'LOV USULLARI</b>",
    "━━━━━━━━━━━━━━━━━━",
    "🟢 Click",
    "🔵 Payme",
    "🟣 Uzum Bank",
    "🟡 Humo / Uzcard",
    "🟠 USDT (TRC20)",
    "⚪️ Visa / MasterCard (tez orada)",
    "",
    "💡 To'lov faqat <b>admin</b> orqali — kafolat shu bilan ishlaydi.",
  ].join("\n"),
  bot_bonus: [
    "🎁 <b>BONUSLAR & AKSIYALAR</b>",
    "━━━━━━━━━━━━━━━━━━",
    "🔥 Har 5-xaridga <b>5% cashback</b>",
    "🤝 Do'st taklif qiling → <b>10 000 so'm</b> bonus",
    "⭐️ TOP sotuvchilarga komissiya <b>3%</b>",
    "",
    "🎟 Promokodlar kanalimizda e'lon qilinadi.",
  ].join("\n"),
  bot_news: [
    "📢 <b>E'LONLAR / YANGILIKLAR</b>",
    "━━━━━━━━━━━━━━━━━━",
    "🆕 Yangi akkauntlar har kuni qo'shilmoqda.",
    "⚡️ Mini App yangilandi — filtr va qidiruv ishlaydi.",
    "🎁 Yangi bonus tizimi ishga tushdi.",
  ].join("\n"),
};

export const EDITABLE: { key: string; label: string }[] = [
  { key: "bot_support", label: "👑 Admin ssilkasi" },
  { key: "bot_channel", label: "📣 Majburiy obuna kanali" },
  { key: "bot_reviews", label: "💬 Otzivlar havolasi" },
  { key: "bot_welcome", label: "👋 Salomlashish matni" },
  { key: "bot_rules", label: "📜 Qoidalar matni" },
  { key: "bot_guarantee", label: "🛡 Kafolat matni" },
  { key: "bot_payments", label: "💳 To'lov usullari" },
  { key: "bot_bonus", label: "🎁 Bonuslar & aksiyalar" },
  { key: "bot_news", label: "📢 Yangiliklar" },
  { key: "bot_about", label: "ℹ️ Biz haqimizda" },
  { key: "bot_price", label: "💰 Narx / xizmat haqi" },
  { key: "bot_orders_empty", label: "🧾 Bo'sh e'lon matni" },
  { key: "bot_admin_ids", label: "🛠 Admin ID lar (vergul bilan)" },
];


export async function getSetting(key: string): Promise<string> {
  const value = await storeGet(key);
  return (value ?? "").trim() || (SETTING_DEFAULTS[key] ?? "");
}

export async function setSetting(key: string, value: string) {
  await storeSet(key, value);
  botLog.info("setting_updated", { key });
}

function adminIdList(env: string, db: string) {
  return [...env.split(","), ...db.split(",")].map((s) => s.trim()).filter(Boolean);
}

async function isAdmin(userId: number): Promise<boolean> {
  const fromEnv = process.env["BOT_ADMIN_IDS"] ?? "";
  const fromDb = await getSetting("bot_admin_ids");
  const ids = adminIdList(fromEnv, fromDb);
  return ids.includes(String(userId));
}



/* ------------------------------------------------------ links & normalizers */

function tgLink(raw: string) {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("http")) return value;
  return `https://t.me/${value.replace(/^@/, "")}`;
}

function channelUsername(raw: string) {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const match = value.match(/t\.me\/(?:s\/)?([A-Za-z0-9_]+)/);
  const name = match?.[1] ?? value.replace(/^@/, "");
  return /^[A-Za-z0-9_]{4,}$/.test(name) ? `@${name}` : null;
}

/* ------------------------------------------------------------- edit states */

const COMPLAINT_STATE = "__complaint__";
const stateKey = (chatId: number) => `bot_state:${chatId}`;
const setPendingEdit = (chatId: number, key: string | null) => storeSet(stateKey(chatId), key ?? "");
const getPendingEdit = async (chatId: number) => (await storeGet(stateKey(chatId))) ?? "";

/* --------------------------------------------------------------- keyboards */

const BTN = {
  sell: "🛒 Sotish",
  accounts: "🔍 Bozor",
  guarantee: "🛡 Kafolat",
  profile: "👤 Profil",
  orders: "📋 Buyurtma",
  contact: "🎧 Admin",
  payments: "💳 To'lov",
  bonus: "🎁 Bonus",
  top: "🏆 Top",
  news: "📢 Yangilik",
  rules: "📜 Qoida",
  complaint: "🚨 Shikoyat",
  home: "🏠 Menyu",
  admin: "🛠 Panel",
};

function replyKeyboard(admin: boolean) {
  return {
    keyboard: [
      [{ text: BTN.accounts }, { text: BTN.sell }, { text: BTN.profile }],
      [{ text: BTN.guarantee }, { text: BTN.contact }, { text: BTN.home }],
      ...(admin ? [[{ text: BTN.admin }]] : []),
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "🎮 Menyudan tanlang",
  };
}

type Row = { text: string; web_app?: { url: string }; url?: string; callback_data?: string }[];

/** Asosiy menyu — telefonda ham ixcham (qisqa nomlar, 3 tagacha ustun). */
async function mainInline(admin: boolean): Promise<{ inline_keyboard: Row[] }> {
  const rows: Row[] = [
    [
      { text: "🔍 Bozor", callback_data: "accounts" },
      { text: "🛒 Sotish", callback_data: "sell" },
      { text: "👤 Profil", callback_data: "profile" },
    ],
    [
      { text: "🛡 Kafolat", callback_data: "guarantee" },
      { text: "🎧 Admin", callback_data: "contact" },
      { text: "➕ Ko'proq", callback_data: "more" },
    ],
  ];

  if (admin) rows.push([{ text: "🛠 Admin panel", callback_data: "admin" }]);
  return { inline_keyboard: rows };
}

/** «Ko'proq» — qolgan bo'limlar alohida ixcham panelda. */
function moreInline(): { inline_keyboard: Row[] } {
  return {
    inline_keyboard: [
      [
        { text: "💳 To'lov", callback_data: "payments" },
        { text: "🎁 Bonus", callback_data: "bonus" },
        { text: "🏆 Top", callback_data: "top" },
      ],
      [
        { text: "📋 Buyurtma", callback_data: "orders" },
        { text: "📢 Yangilik", callback_data: "news" },
        { text: "📜 Qoida", callback_data: "rules" },
      ],
      [
        { text: "🚨 Shikoyat", callback_data: "complaint" },
        { text: "⌨️ Tez menyu", callback_data: "kb" },
        { text: "🏠 Menyu", callback_data: "home" },
      ],
    ],
  };
}


function adminKeyboard() {
  return {
    inline_keyboard: [
      ...EDITABLE.map((item) => [{ text: item.label, callback_data: `edit:${item.key}` }]),
      [
        { text: "📊 Statistika", callback_data: "stats" },
        { text: "📋 Loglar", callback_data: "logs" },
        { text: "🔁 Webhook", callback_data: "rewebhook" },
      ],
      [{ text: "✖️ Yopish", callback_data: "close" }],
    ],
  };
}

async function shopInline(_label = "") {
  return {
    inline_keyboard: [
      [{ text: "🛡 Adminga so'rov (garant)", callback_data: "req:help" }],
      [{ text: "🏠 Bosh menyu", callback_data: "home" }],
    ],
  };
}

/* ------------------------------------------------------- majburiy obuna */

async function subscriptionGate(chatId: number, userId: number): Promise<boolean> {
  if ((await getSetting("bot_force_sub")).toLowerCase() !== "on") return true;
  const raw = await getSetting("bot_channel");
  const username = channelUsername(raw);
  const link = tgLink(raw);
  if (!username || !link) {
    botLog.warn("subscription_config_invalid", { channel: raw });
    return true;
  }

  try {
    const res = (await tg("getChatMember", { chat_id: username, user_id: userId })) as {
      ok?: boolean;
      result?: { status?: string };
    };
    if (res.ok === false) {
      botLog.warn("subscription_check_unavailable", { userId, channel: username });
      return true; // bot kanalda admin emas — botni to'xtatmaymiz
    }
    const status = res.result?.status ?? "left";
    if (["creator", "administrator", "member", "restricted"].includes(status)) return true;
  } catch (error) {
    botLog.warn("subscription_check_failed", { userId, channel: username, error: String(error) });
    return true;
  }

  await send(
    chatId,
    [
      "🔐 <b>MAJBURIY OBUNA</b>",
      "━━━━━━━━━━━━━━━━━━",
      "",
      "🚀 Botdan foydalanish uchun avval kanalimizga obuna bo'ling.",
      "🎁 Kanalda: chegirmalar, yangi akkauntlar va konkurslar!",
      "",
      "👇 Obuna bo'lgach «Tekshirish» tugmasini bosing.",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📣 Kanalga obuna bo'lish", url: link }],
          [{ text: "✅ Tekshirish", callback_data: "checksub" }],
        ],
      },
    },
  );
  return false;
}

/* ----------------------------------------------------------------- screens */

/** Menyu tugmasini (input yonidagi) Mini App qilib qo'yamiz — bir marta. */
let menuButtonSet = false;
async function ensureMenuButton() {
  if (menuButtonSet) return;
  menuButtonSet = true;
  await tg("setChatMenuButton", {
    menu_button: { type: "web_app", text: "🎮 Magazin", web_app: { url: appUrl() } },
  }).catch(() => {});
  await tg("setMyCommands", {
    commands: [
      { command: "start", description: "🎮 Bosh menyu" },
      { command: "bozor", description: "🔍 Akkauntlar bozori" },
      { command: "sotish", description: "🛒 Akkaunt sotish" },
      { command: "menyu", description: "⌨️ Tugmalar menyusi" },
      { command: "qoidalar", description: "📜 Qoidalar" },
      { command: "id", description: "🆔 Telegram ID" },
    ],
  }).catch(() => {});
}

/** /start — FAQAT BITTA xabar: rasm + matn + ixcham menyu. */
async function showMain(chatId: number, userId: number, name: string) {
  const welcome = await getSetting("bot_welcome");
  const admin = await isAdmin(userId);
  await ensureMenuButton();

  const caption = [
    welcome,
    "",
    `👋 Salom, <b>${escapeHtml(name)}</b>! Omad tilaymiz — <b>GG</b> 🔥`,
    "",
    "⬇️ Kerakli bo'limni tanlang:",
  ].join("\n");

  const reply_markup = await mainInline(admin);
  const photo = `${appUrl()}/pubg-hero.jpg`;

  const res = await tg("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML",
    reply_markup,
  });
  if (res.ok === false) {
    await send(chatId, caption, { reply_markup });
  }
}

/** Pastdagi (tashqi) tugmalar menyusi */
async function showKeyboard(chatId: number, admin: boolean) {
  await send(chatId, "⌨️ <b>Tez menyu yoqildi</b> — pastdagi tugmalardan foydalaning 👇", {
    reply_markup: replyKeyboard(admin),
  });
}


async function showRules(chatId: number) {
  const rules = await getSetting("bot_rules");
  await send(chatId, rules, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛡 Adminga so'rov (garant)", callback_data: "req:help" }],
        [{ text: "🏠 Bosh menyu", callback_data: "home" }],
      ],
    },
  });
}

async function showSell(chatId: number) {
  await send(
    chatId,
    [
      "🛒 <b>1. AKKAUNT SOTISH</b>",
      "━━━━━━━━━━━━━━━━━━",
      "O'z PUBG akkauntingizni sotuvga qo'ying:",
      "",
      "1️⃣ Ma'lumot kiritish (LVL, server, rank)",
      "2️⃣ Rasm / video qo'shish",
      "3️⃣ Narx belgilash",
      "4️⃣ E'lon joylash",
      "5️⃣ Xaridor topiladi ✅",
      "",
      "🛡 Savdo kafolat (eskrou) ostida o'tadi.",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📝 E'lon joylash", web_app: { url: `${appUrl()}/sotish` } }],
          [{ text: "🧾 Mening e'lonlarim", web_app: { url: `${appUrl()}/mening` } }],
          [{ text: "🏠 Bosh menyu", callback_data: "home" }],
        ],
      },
    },
  );
}

type AccountRow = {
  id: string;
  title: string;
  price: number;
  currency: string;
  level: number | null;
  sold: boolean;
  description?: string | null;
  contact?: string | null;
  images?: string[] | null;
  videos?: string[] | null;
  details?: AccountDetails | null;
};

async function loadAccounts(limit = 10): Promise<AccountRow[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("*")
    .eq("sold", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as AccountRow[];
}

async function loadAccount(id: string): Promise<AccountRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("accounts").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as unknown as AccountRow | null;
}

function money(price: number, currency: string) {
  return `${Number(price).toLocaleString("ru-RU")} ${currency === "UZS" ? "so'm" : currency}`;
}

function maskId(value: unknown) {
  const raw = String(value ?? "").replace(/\D/g, "");
  if (raw.length < 4) return "****";
  return `****${raw.slice(-4)}`;
}

function pick(details: AccountDetails | null | undefined, section: string, key: string) {
  const value = details?.[section]?.[key];
  return isFilled(value) ? value : null;
}

/** E'lon kartasi — foydalanuvchi so'ragan ko'rinish. */
function accountCaption(a: AccountRow) {
  const d = a.details ?? {};
  const line = (icon: string, label: string, value: unknown) =>
    isFilled(value) ? `${icon} ${label}: <b>${escapeHtml(String(value))}</b>` : null;

  const rows = [
    "🎮 <b>PUBG MOBILE ACCOUNT</b>",
    "━━━━━━━━━━━━━━━━━━",
    `🏷 <b>${escapeHtml(a.title)}</b>`,
    pick(d, "main", "pubg_id") ? `🆔 ID: <code>${maskId(pick(d, "main", "pubg_id"))}</code>` : null,
    line("👤", "Nick", pick(d, "main", "nick")),
    line("⭐", "Level", pick(d, "main", "level") ?? a.level),
    line("🌍", "Server", pick(d, "main", "server")),
    line("🏆", "Rank", pick(d, "main", "rank") ?? pick(d, "ranks", "highest_rank")),
    line("🎫", "RP", pick(d, "rp", "count") ?? pick(d, "rp", "current")),
    line("🔫", "Gun skin", pick(d, "inventory", "guns")),
    line("💎", "Mythic", pick(d, "mythic", "mythic")),
    line("👑", "X-Suit", pick(d, "mythic", "xsuit_count") ?? pick(d, "xsuit", "name")),
    line("🚗", "Vehicle", pick(d, "inventory", "vehicle")),
    line("🎒", "Backpack", pick(d, "inventory", "backpack")),
    line("💎", "UC", pick(d, "uc", "now")),
    line("🔥", "Popularity", pick(d, "main", "popularity")),
    line("❤️", "Like", pick(d, "main", "likes")),
    "",
    `💰 <b>${money(a.price, a.currency)}</b>`,
  ].filter(Boolean) as string[];

  const badges = [
    pick(d, "trust", "verified") ? "✅ Tekshirilgan" : null,
    pick(d, "trust", "garant") ? "🛡️ Garant" : null,
    pick(d, "trust", "trusted") ? "⭐ Ishonchli sotuvchi" : null,
    (a.videos?.length ?? 0) > 0 || pick(d, "trust", "video") ? "🎥 Video bor" : null,
  ].filter(Boolean);
  if (badges.length) rows.push("", badges.join(" · "));

  return rows.join("\n");
}

async function accountKeyboard(a: AccountRow) {
  const base = appUrl();
  const sections = filledSections((a.details ?? {}) as AccountDetails);
  const rows: Row[] = [];

  for (let i = 0; i < sections.length; i += 2) {
    rows.push(
      sections.slice(i, i + 2).map((s) => ({
        text: s.short,
        callback_data: `sec:${a.id.slice(0, 8)}:${s.id}`,
      })),
    );
  }

  const media: Row = [];
  if ((a.images?.length ?? 0) > 0) media.push({ text: "🖼 Rasmlar", callback_data: `img:${a.id.slice(0, 8)}` });
  if ((a.videos?.length ?? 0) > 0) media.push({ text: "🎥 Video", callback_data: `vid:${a.id.slice(0, 8)}` });
  if (media.length) rows.push(media);

  rows.push([
    { text: "❤️ Sevimli", callback_data: `fav:${a.id.slice(0, 8)}` },
    { text: "⚖️ Solishtirish", callback_data: `cmp:${a.id.slice(0, 8)}` },
  ]);
  rows.push([{ text: "🔎 To'liq ko'rish (Mini App)", web_app: { url: `${base}/akkaunt/${a.id}` } }]);
  rows.push([
    { text: "🛡️ Garant orqali olish", callback_data: `req:buy:${a.id.slice(0, 8)}` },
    { text: "💬 Sotuvchi bilan aloqa", callback_data: `req:ask:${a.id.slice(0, 8)}` },
  ]);
  rows.push([
    { text: "🚨 Shikoyat", callback_data: "complaint" },
    { text: "🔍 Bozor", callback_data: "accounts" },
    { text: "🏠 Menyu", callback_data: "home" },
  ]);
  return { inline_keyboard: rows };
}

const shortIds = new Map<string, string>();

async function resolveId(short: string) {
  const cached = shortIds.get(short);
  if (cached) return cached;
  const list = await loadAccounts(50);
  for (const a of list) shortIds.set(a.id.slice(0, 8), a.id);
  return shortIds.get(short) ?? null;
}

async function showAccountCard(chatId: number, short: string) {
  const id = await resolveId(short);
  const account = id ? await loadAccount(id) : null;
  if (!account) {
    await send(chatId, "❌ E'lon topilmadi yoki sotilgan.", { reply_markup: await shopInline() });
    return;
  }
  const caption = accountCaption(account);
  const reply_markup = await accountKeyboard(account);
  const cover = (await signedMedia(account.images ?? []))[0];
  if (cover) {
    const res = await tg("sendPhoto", {
      chat_id: chatId,
      photo: cover,
      caption,
      parse_mode: "HTML",
      reply_markup,
    });
    if (res.ok !== false) return;
  }
  await send(chatId, caption, { reply_markup });
}

async function signedMedia(paths: string[]) {
  if (!paths.length) return [];
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.storage
      .from("account-media")
      .createSignedUrls(paths.slice(0, 10), 60 * 60 * 6);
    return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
  } catch (error) {
    botLog.warn("sign_media_failed", { error: String(error) });
    return [];
  }
}

async function showAccountMedia(chatId: number, short: string, kind: "img" | "vid") {
  const id = await resolveId(short);
  const account = id ? await loadAccount(id) : null;
  if (!account) return;
  const paths = (kind === "img" ? account.images : account.videos) ?? [];
  const urls = await signedMedia(paths);
  if (!urls.length) {
    await send(chatId, kind === "img" ? "🖼 Rasm yo'q." : "🎥 Video yo'q.");
    return;
  }
  const media = urls.map((url, i) => ({
    type: kind === "img" ? "photo" : "video",
    media: url,
    ...(i === 0 ? { caption: `${kind === "img" ? "🖼" : "🎥"} ${escapeHtml(account.title)}`, parse_mode: "HTML" } : {}),
  }));
  const res = await tg("sendMediaGroup", { chat_id: chatId, media });
  if (res.ok === false) {
    for (const url of urls.slice(0, 3)) {
      await tg(kind === "img" ? "sendPhoto" : "sendVideo", {
        chat_id: chatId,
        [kind === "img" ? "photo" : "video"]: url,
      }).catch(() => {});
    }
  }
}

async function showAccountSection(chatId: number, short: string, sectionId: string) {
  const id = await resolveId(short);
  const account = id ? await loadAccount(id) : null;
  const section = sectionById(sectionId);
  if (!account || !section) return;
  const items = filledFields(section, (account.details ?? {}) as AccountDetails);
  const body = items
    .map(({ field, value }) => `${field.icon ?? "•"} ${field.label}: <b>${escapeHtml(formatValue(field, value))}</b>`)
    .join("\n");
  await send(
    chatId,
    [
      `${section.icon} <b>${section.title.toUpperCase()}</b>`,
      "━━━━━━━━━━━━━━━━━━",
      `🏷 ${escapeHtml(account.title)}`,
      "",
      body || "— ma'lumot yo'q —",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ E'longa qaytish", callback_data: `acc:${short}` }],
          [{ text: "🏠 Menyu", callback_data: "home" }],
        ],
      },
    },
  );
}

async function toggleFavourite(chatId: number, short: string) {
  const key = `bot_fav:${chatId}`;
  const raw = (await storeGet(key)) ?? "";
  const list = raw.split(",").filter(Boolean);
  const exists = list.includes(short);
  const next = exists ? list.filter((v) => v !== short) : [...list, short];
  await storeSet(key, next.join(","));
  await send(chatId, exists ? "💔 Sevimlilardan olib tashlandi." : "❤️ Sevimlilarga qo'shildi!", {
    reply_markup: { inline_keyboard: [[{ text: "⬅️ E'lon", callback_data: `acc:${short}` }]] },
  });
}

async function addToCompare(chatId: number, short: string) {
  const key = `bot_cmp:${chatId}`;
  const raw = (await storeGet(key)) ?? "";
  const list = [...new Set([...raw.split(",").filter(Boolean), short])].slice(-2);
  await storeSet(key, list.join(","));
  if (list.length < 2) {
    await send(chatId, "⚖️ Qo'shildi. Yana bitta e'lonni tanlang — solishtiramiz.", {
      reply_markup: { inline_keyboard: [[{ text: "🔍 Bozor", callback_data: "accounts" }]] },
    });
    return;
  }
  const rows: string[] = ["⚖️ <b>SOLISHTIRISH</b>", "━━━━━━━━━━━━━━━━━━"];
  for (const s of list) {
    const id = await resolveId(s);
    const a = id ? await loadAccount(id) : null;
    if (!a) continue;
    const d = (a.details ?? {}) as AccountDetails;
    rows.push(
      "",
      `🏷 <b>${escapeHtml(a.title)}</b>`,
      `💰 ${money(a.price, a.currency)}`,
      `⭐ LVL: ${escapeHtml(String(pick(d, "main", "level") ?? a.level ?? "—"))} · 🏆 ${escapeHtml(String(pick(d, "main", "rank") ?? "—"))}`,
      `🔫 Gun: ${escapeHtml(String(pick(d, "inventory", "guns") ?? "—"))} · 💎 Mythic: ${escapeHtml(String(pick(d, "mythic", "mythic") ?? "—"))} · 👑 X-Suit: ${escapeHtml(String(pick(d, "mythic", "xsuit_count") ?? "—"))}`,
    );
  }
  await storeSet(key, "");
  await send(chatId, rows.join("\n"), {
    reply_markup: { inline_keyboard: [[{ text: "🔍 Bozor", callback_data: "accounts" }], [{ text: "🏠 Menyu", callback_data: "home" }]] },
  });
}

async function showAccounts(chatId: number) {
  const base = appUrl();
  try {
    const list = await loadAccounts(8);
    for (const a of list) shortIds.set(a.id.slice(0, 8), a.id);

    if (!list.length) {
      await send(
        chatId,
        `🔍 <b>BOZOR</b>\n━━━━━━━━━━━━━━━━━━\n${await getSetting("bot_orders_empty")}`,
        { reply_markup: await shopInline() },
      );
      return;
    }

    const lines = list.map((a, i) => {
      const d = (a.details ?? {}) as AccountDetails;
      return `${i + 1}. 🎯 <b>${escapeHtml(a.title)}</b>\n   ⭐ LVL ${escapeHtml(String(pick(d, "main", "level") ?? a.level ?? "—"))} · 🏆 ${escapeHtml(String(pick(d, "main", "rank") ?? "—"))} · 💰 ${money(a.price, a.currency)}`;
    });

    const rows: Row[] = [];
    for (let i = 0; i < list.length; i += 3) {
      rows.push(
        list.slice(i, i + 3).map((a, j) => ({
          text: `${i + j + 1}️⃣`,
          callback_data: `acc:${a.id.slice(0, 8)}`,
        })),
      );
    }
    rows.push([
      { text: "💸 Arzon", web_app: { url: `${base}/?filtr=arzon` } },
      { text: "💎 Qimmat", web_app: { url: `${base}/?filtr=qimmat` } },
    ]);
    rows.push([{ text: "🏠 Menyu", callback_data: "home" }]);

    await send(
      chatId,
      `🔍 <b>BOZOR — TOP E'LONLAR</b>\n━━━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}\n\n👇 Raqamni bosing — to'liq karta chiqadi.`,
      { reply_markup: { inline_keyboard: rows } },
    );
  } catch (error) {
    botLog.error("accounts_failed", error, { chatId });
    await send(chatId, await getSetting("bot_orders_empty"), { reply_markup: await shopInline() });
  }
}


async function showGuarantee(chatId: number) {
  await send(chatId, await getSetting("bot_guarantee"), {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛡 Garant so'rovi yuborish", callback_data: "req:guarantee" }],
        [{ text: "🏠 Bosh menyu", callback_data: "home" }],
      ],
    },
  });
}

async function showProfile(chatId: number, userId: number, name: string, username?: string) {
  const admin = await isAdmin(userId);
  await send(
    chatId,
    [
      "👤 <b>4. MENING PROFILIM</b>",
      "━━━━━━━━━━━━━━━━━━",
      `🏷 Ism: <b>${escapeHtml(name)}</b>`,
      username ? `🔗 Username: @${escapeHtml(username)}` : "🔗 Username: —",
      `🆔 Telegram ID: <code>${userId}</code>`,
      `🎖 Maqom: ${admin ? "👑 Admin" : "🎮 Gamer"}`,
      "⭐️ Reyting: 5.0",
      "💰 Balans: 0 so'm",
      "",
      "💎 Profil, e'lonlar va sevimlilar — Mini App ichida.",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 Profilni ochish", web_app: { url: `${appUrl()}/mening` } }],
          [{ text: "🏠 Bosh menyu", callback_data: "home" }],
        ],
      },
    },
  );
}

async function showContact(chatId: number) {
  await send(
    chatId,
    [
      "🎧 <b>ADMIN BILAN ALOQA</b>",
      "━━━━━━━━━━━━━━━━━━",
      "🛡 Admin har doim <b>o'rtada (garant)</b> turadi.",
      "📨 Siz so'rov qoldirasiz — admin <b>o'zi</b> siz bilan bog'lanadi.",
      "⏱ Ish vaqti: 24/7 · O'rtacha javob: 5–15 daqiqa",
      "",
      "⚠️ Adminni chetlab o'tib to'lov qilmang!",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📨 So'rov yuborish", callback_data: "req:help" }],
          [{ text: "🏠 Bosh menyu", callback_data: "home" }],
        ],
      },
    },
  );
}

/* ------------------------------------------------- adminga so'rov (garant) */

const REQ_LABEL: Record<string, string> = {
  help: "🎧 Umumiy yordam",
  guarantee: "🛡 Garant xizmati",
  buy: "💰 Sotib olish (garant)",
  ask: "💬 Akkaunt haqida savol",
};

/**
 * Foydalanuvchi to'g'ridan-to'g'ri admin havolasiga o'tmaydi:
 * so'rov adminlarga yuboriladi, admin o'zi bog'lanadi (garant).
 */
async function sendAdminRequest(
  chatId: number,
  userId: number,
  name: string,
  kind: string,
  short?: string,
  username?: string,
) {
  const fromEnv = process.env["BOT_ADMIN_IDS"] ?? "";
  const fromDb = await getSetting("bot_admin_ids");
  const admins = adminIdList(fromEnv, fromDb);

  let accountLine = "";
  if (short) {
    const id = await resolveId(short);
    const account = id ? await loadAccount(id) : null;
    if (account) {
      accountLine = `\n🏷 E'lon: <b>${escapeHtml(account.title)}</b> — ${money(account.price, account.currency)}\n🔗 ${appUrl()}/akkaunt/${account.id}`;
    }
  }

  const body = [
    "📨 <b>YANGI SO'ROV</b>",
    "━━━━━━━━━━━━━━━━━━",
    `📌 Tur: <b>${REQ_LABEL[kind] ?? kind}</b>`,
    `👤 ${escapeHtml(name)}${username ? ` (@${escapeHtml(username)})` : ""}`,
    `🆔 <code>${userId}</code>${accountLine}`,
    "",
    "👇 Foydalanuvchi bilan o'zingiz bog'laning.",
  ].join("\n");

  const markup = {
    inline_keyboard: [
      [{ text: "✍️ Foydalanuvchiga yozish", url: `tg://user?id=${userId}` }],
      ...(username ? [[{ text: `@${username}`, url: `https://t.me/${username}` }]] : []),
    ],
  };

  let delivered = 0;
  for (const admin of admins) {
    const res = await tg("sendMessage", {
      chat_id: admin,
      text: body,
      parse_mode: "HTML",
      reply_markup: markup,
    }).catch(() => ({ ok: false }));
    if ((res as { ok?: boolean }).ok !== false) delivered += 1;
  }

  botLog.info("admin_request", { userId, kind, short, delivered, admins: admins.length });

  await send(
    chatId,
    [
      "✅ <b>SO'ROVINGIZ QABUL QILINDI</b>",
      "━━━━━━━━━━━━━━━━━━",
      `📌 ${REQ_LABEL[kind] ?? kind}`,
      "",
      "🛡 Admin <b>o'rtada garant</b> bo'lib turadi.",
      "📞 Admin tez orada <b>o'zi</b> siz bilan bog'lanadi.",
      "⏱ O'rtacha kutish: 5–15 daqiqa.",
      "",
      "⚠️ Hech kimga adminni chetlab o'tib pul o'tkazmang!",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔍 Bozor", callback_data: "accounts" }],
          [{ text: "🏠 Bosh menyu", callback_data: "home" }],
        ],
      },
    },
  );
}

async function showPayments(chatId: number) {
  await send(chatId, await getSetting("bot_payments"), { reply_markup: await shopInline() });
}

async function showBonus(chatId: number) {
  const channel = tgLink(await getSetting("bot_channel"));
  await send(chatId, await getSetting("bot_bonus"), {
    reply_markup: {
      inline_keyboard: [
        ...(channel ? [[{ text: "📣 Kanal (promokodlar)", url: channel }]] : []),
        [{ text: "🏠 Bosh menyu", callback_data: "home" }],
      ],
    },
  });
}

async function showTopSellers(chatId: number) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("accounts").select("user_id, sold").limit(1000);
    const tally = new Map<string, { total: number; sold: number }>();
    for (const row of data ?? []) {
      const key = String(row.user_id ?? "—");
      const entry = tally.get(key) ?? { total: 0, sold: 0 };
      entry.total += 1;
      if (row.sold) entry.sold += 1;
      tally.set(key, entry);
    }
    const top = [...tally.entries()].sort((a, b) => b[1].sold - a[1].sold || b[1].total - a[1].total).slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    const lines = top.map(
      ([id, v], i) =>
        `${medals[i] ?? `${i + 1}.`} <code>${escapeHtml(id.slice(0, 8))}</code> — ✅ ${v.sold} sotilgan · 🧾 ${v.total} e'lon`,
    );
    await send(
      chatId,
      `🏆 <b>9. TOP SOTUVCHILAR</b>\n━━━━━━━━━━━━━━━━━━\n${lines.join("\n") || "Hozircha sotuvchilar yo'q."}`,
      { reply_markup: await shopInline() },
    );
  } catch (error) {
    botLog.error("top_failed", error, { chatId });
    await send(chatId, "🏆 Hozircha statistika yo'q.", { reply_markup: await shopInline() });
  }
}

async function showNews(chatId: number) {
  const channel = tgLink(await getSetting("bot_channel"));
  await send(chatId, await getSetting("bot_news"), {
    reply_markup: {
      inline_keyboard: [
        ...(channel ? [[{ text: "📣 Kanalga o'tish", url: channel }]] : []),
        [{ text: "🏠 Bosh menyu", callback_data: "home" }],
      ],
    },
  });
}

async function askComplaint(chatId: number) {
  await setPendingEdit(chatId, COMPLAINT_STATE);
  await send(
    chatId,
    [
      "⚠️ <b>12. SHIKOYAT QILISH</b>",
      "━━━━━━━━━━━━━━━━━━",
      "Firibgarlik yoki muammo haqida yozing.",
      "📝 Xabaringizni shu yerga yuboring — admin darhol ko'radi.",
      "",
      `Bekor qilish: ${BTN.home}`,
    ].join("\n"),
  );
}

async function sendComplaint(chatId: number, userId: number, name: string, text: string, username?: string) {
  await setPendingEdit(chatId, null);
  const fromEnv = process.env["BOT_ADMIN_IDS"] ?? "";
  const fromDb = await getSetting("bot_admin_ids");
  const admins = adminIdList(fromEnv, fromDb);
  const body = [
    "🚨 <b>YANGI SHIKOYAT</b>",
    "━━━━━━━━━━━━━━━━━━",
    `👤 ${escapeHtml(name)}${username ? ` (@${escapeHtml(username)})` : ""}`,
    `🆔 <code>${userId}</code>`,
    "",
    escapeHtml(text),
  ].join("\n");
  for (const admin of admins) {
    await tg("sendMessage", { chat_id: admin, text: body, parse_mode: "HTML" }).catch(() => {});
  }
  botLog.info("complaint_received", { userId });
  await send(chatId, "✅ <b>Shikoyatingiz qabul qilindi!</b>\nAdmin tez orada bog'lanadi 🎧", {
    reply_markup: await shopInline(),
  });
}

async function showOrders(chatId: number) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select("title, price, currency, sold, level")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    if (!data || data.length === 0) {
      await send(chatId, await getSetting("bot_orders_empty"), {
        reply_markup: await shopInline(),
      });
      return;
    }
    const lines = data.map(
      (a) =>
        `${a.sold ? "❌ Sotilgan" : "✅ Faol"} · <b>${escapeHtml(a.title)}</b>\n   🎯 LVL ${a.level ?? "—"} · 💵 ${Number(
          a.price,
        ).toLocaleString("ru-RU")} ${a.currency}`,
    );
    await send(
      chatId,
      `📋 <b>5. BUYURTMALARIM</b>\n━━━━━━━━━━━━━━━━━━\n${lines.join("\n\n")}\n\n🧾 To'liq tarix — Mini App ichida.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🧾 Buyurtmalarim (Mini App)", web_app: { url: `${appUrl()}/mening` } }],
            [{ text: "🏠 Bosh menyu", callback_data: "home" }],
          ],
        },
      },
    );
  } catch (error) {
    botLog.error("orders_failed", error, { chatId });
    await send(chatId, await getSetting("bot_orders_empty"), { reply_markup: await shopInline() });
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
    from?: { id?: number; first_name?: string; username?: string };
    message?: { chat?: { id?: number } };
  };
};

export async function handleUpdate(update: Update) {
  try {
    if (!(await claimUpdate(update.update_id))) {
      botLog.info("duplicate_update_skipped", { updateId: update.update_id });
      return;
    }
    if (update.callback_query) return await handleCallback(update.callback_query);
    await handleMessage(update);
  } catch (error) {
    botLog.error("handle_update_failed", error);
    const chatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
    if (chatId) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "🎮 PUBG SAVDO ORG\n\nMenyu tayyor 👇",
        reply_markup: replyKeyboard(false),
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

  const admin = await isAdmin(userId);

  // Kutilayotgan holat: shikoyat yoki admin tahriri
  const pending = await getPendingEdit(chatId);
  if (pending === COMPLAINT_STATE && !text.startsWith("/") && text !== BTN.home) {
    await sendComplaint(chatId, userId, name, text, message?.from?.username);
    return;
  }
  if (pending && pending !== COMPLAINT_STATE && !text.startsWith("/") && text !== BTN.home && admin) {
    await setSetting(pending, text);
    await setPendingEdit(chatId, null);
    await send(chatId, "✅ <b>Saqlandi!</b>", { reply_markup: adminKeyboard() });
    return;
  }

  if (command === "/start" || command === "/restart" || command === "/menu") {
    await setPendingEdit(chatId, null);
    if (!admin && !(await subscriptionGate(chatId, userId))) return;
    await showMain(chatId, userId, name);
    return;
  }
  if (command === "/bozor" || command === "/market") {
    await showAccounts(chatId);
    return;
  }
  if (command === "/sotish") {
    await showSell(chatId);
    return;
  }
  if (command === "/menyu" || command === "/keyboard") {
    await showKeyboard(chatId, admin);
    return;
  }
  if (command === "/id") {
    await send(chatId, `🆔 Sizning Telegram ID: <code>${userId}</code>`);
    return;
  }
  if (command === "/qoida" || command === "/qoidalar" || command === "/rules") {
    await showRules(chatId);
    return;
  }
  if (command === "/admin" || command === "/panel" || text === BTN.admin) {
    if (!(await isAdmin(userId))) {
      await send(chatId, "⛔️ Bu bo'lim faqat adminlar uchun.");
      return;
    }

    await send(
      chatId,
      "🛠 <b>ADMIN PANEL</b>\n━━━━━━━━━━━━━━━━━━\nO'zgartirmoqchi bo'lgan bandni tanlang:",
      { reply_markup: adminKeyboard() },
    );
    return;
  }

  if (!admin && !(await subscriptionGate(chatId, userId))) return;

  switch (text) {
    case BTN.home:
      await setPendingEdit(chatId, null);
      await showMain(chatId, userId, name);
      return;
    case BTN.sell:
      await showSell(chatId);
      return;
    case BTN.accounts:
      await showAccounts(chatId);
      return;
    case BTN.guarantee:
      await showGuarantee(chatId);
      return;
    case BTN.profile:
      await showProfile(chatId, userId, name, message?.from?.username);
      return;
    case BTN.orders:
      await showOrders(chatId);
      return;
    case BTN.contact:
      await showContact(chatId);
      return;
    case BTN.payments:
      await showPayments(chatId);
      return;
    case BTN.bonus:
      await showBonus(chatId);
      return;
    case BTN.top:
      await showTopSellers(chatId);
      return;
    case BTN.news:
      await showNews(chatId);
      return;
    case BTN.rules:
      await showRules(chatId);
      return;
    case BTN.complaint:
      await askComplaint(chatId);
      return;
    default:
      await send(chatId, "🎮 Quyidagi menyudan foydalaning 👇", {
        reply_markup: await mainInline(admin),
      });
  }
}


async function handleCallback(cb: NonNullable<Update["callback_query"]>) {
  const chatId = cb.message?.chat?.id;
  const userId = cb.from?.id;
  const data = cb.data ?? "";
  await tg("answerCallbackQuery", { callback_query_id: cb.id });
  if (!chatId || !userId) return;

  const admin = await isAdmin(userId);
  const name = cb.from?.first_name ?? "gamer";

  if (data === "checksub") {
    if (await subscriptionGate(chatId, userId)) {
      await send(chatId, "✅ <b>Rahmat!</b> Obuna tasdiqlandi 🎉");
      await showMain(chatId, userId, name);
    }
    return;
  }
  if (data === "kb") {
    await showKeyboard(chatId, admin);
    return;
  }
  if (data === "more") {
    await send(chatId, "➕ <b>QO'SHIMCHA BO'LIMLAR</b>\n━━━━━━━━━━━━━━━━━━\nKerakli bandni tanlang 👇", {
      reply_markup: moreInline(),
    });
    return;
  }
  if (data.startsWith("req:")) {
    const [, kind, short] = data.split(":");
    await sendAdminRequest(chatId, userId, name, kind ?? "help", short, cb.from?.username);
    return;
  }
  if (data.startsWith("acc:")) {
    await showAccountCard(chatId, data.slice(4));
    return;
  }
  if (data.startsWith("sec:")) {
    const [, short, sectionId] = data.split(":");
    if (short && sectionId) await showAccountSection(chatId, short, sectionId);
    return;
  }
  if (data.startsWith("img:")) {
    await showAccountMedia(chatId, data.slice(4), "img");
    return;
  }
  if (data.startsWith("vid:")) {
    await showAccountMedia(chatId, data.slice(4), "vid");
    return;
  }
  if (data.startsWith("fav:")) {
    await toggleFavourite(chatId, data.slice(4));
    return;
  }
  if (data.startsWith("cmp:")) {
    await addToCompare(chatId, data.slice(4));
    return;
  }
  if (data === "home") {
    await setPendingEdit(chatId, null);
    await showMain(chatId, userId, name);
    return;
  }
  if (data === "rules") {
    await showRules(chatId);
    return;
  }
  if (data === "profile") {
    await showProfile(chatId, userId, name, cb.from?.username);
    return;
  }
  if (data === "contact") {
    await showContact(chatId);
    return;
  }
  if (data === "sell") {
    await showSell(chatId);
    return;
  }
  if (data === "accounts") {
    await showAccounts(chatId);
    return;
  }
  if (data === "guarantee") {
    await showGuarantee(chatId);
    return;
  }
  if (data === "orders") {
    await showOrders(chatId);
    return;
  }
  if (data === "payments") {
    await showPayments(chatId);
    return;
  }
  if (data === "bonus") {
    await showBonus(chatId);
    return;
  }
  if (data === "top") {
    await showTopSellers(chatId);
    return;
  }
  if (data === "news") {
    await showNews(chatId);
    return;
  }
  if (data === "complaint") {
    await askComplaint(chatId);
    return;
  }


  if (!admin) {
    botLog.warn("admin_callback_denied", { userId, data });
    await send(chatId, "⛔️ Ruxsat yo'q.");
    return;
  }

  if (data === "admin") {
    await send(chatId, "🛠 <b>ADMIN PANEL</b>\n━━━━━━━━━━━━━━━━━━\nBandni tanlang:", {
      reply_markup: adminKeyboard(),
    });
    return;
  }

  if (data === "close") {
    await setPendingEdit(chatId, null);
    await send(chatId, "✖️ Yopildi.", { reply_markup: replyKeyboard(true) });
    return;
  }

  if (data === "rewebhook") {
    webhookEnsured = false;
    await ensureWebhook();
    const info = (await tg("getWebhookInfo", {})) as { result?: { url?: string } };
    await send(chatId, `🔁 Webhook: <code>${escapeHtml(info.result?.url ?? "—")}</code>`, {
      reply_markup: adminKeyboard(),
    });
    return;
  }

  if (data === "stats") {
    const total = await storeCount("accounts");
    const sold = await storeCount("accounts", { column: "sold", value: true });
    await send(
      chatId,
      [
        "📊 <b>STATISTIKA</b>",
        "━━━━━━━━━━━━━━━━━━",
        `🧾 Jami e'lonlar: <b>${total}</b>`,
        `✅ Sotilgan: <b>${sold}</b>`,
        `🌐 Sayt: <code>${escapeHtml(appUrl())}</code>`,
      ].join("\n"),
      { reply_markup: adminKeyboard() },
    );
    return;
  }

  if (data === "logs") {
    const logs = await recentLogs();
    const lines = logs.map((log) => {
      const icon = log.level === "error" ? "🔴" : log.level === "warn" ? "🟠" : "🟢";
      const time = new Date(log.created_at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
      return `${icon} <code>${escapeHtml(time)}</code> · <b>${escapeHtml(log.event)}</b>${log.message ? `\n${escapeHtml(log.message)}` : ""}`;
    });
    await send(chatId, `📋 <b>SO'NGGI BOT LOGLARI</b>\n━━━━━━━━━━━━━━━━━━\n${lines.join("\n\n") || "Loglar hali yo'q."}`, {
      reply_markup: adminKeyboard(),
    });
    return;
  }

  if (data.startsWith("edit:")) {
    const key = data.slice(5);
    const item = EDITABLE.find((entry) => entry.key === key);
    if (!item) return;
    await setPendingEdit(chatId, key);
    const current = await getSetting(key);
    await send(
      chatId,
      [
        `✏️ <b>${escapeHtml(item.label)}</b>`,
        "━━━━━━━━━━━━━━━━━━",
        "Hozirgi qiymat:",
        `<code>${escapeHtml(current || "—")}</code>`,
        "",
        `Yangi qiymatni yuboring. Bekor qilish: ${BTN.home}`,
      ].join("\n"),
    );
  }
}

/* ------------------------------------------------------------ webhook setup */

let webhookEnsured = false;

/** Railway domenidan foydalanib webhookni avtomatik ro'yxatdan o'tkazadi. */
export async function ensureWebhook(origin?: string) {
  if (webhookEnsured) return true;
  webhookEnsured = true;
  try {
    if (!process.env["TELEGRAM_BOT_TOKEN"]) {
      webhookEnsured = false;
      botLog.error("webhook_token_missing", new Error("TELEGRAM_BOT_TOKEN is not configured"));
      return false;
    }
    const candidate = normalizeUrl(origin);
    const usable =
      candidate &&
      candidate.startsWith("https://") &&
      !candidate.includes("healthcheck.railway.app") &&
      !candidate.includes("localhost")
        ? candidate
        : null;
    // Configured public URL wins; request origin is only a fallback.
    const base = normalizeUrl(process.env["PUBLIC_APP_URL"]) ?? usable ?? appUrl();
    const url = `${base}/api/public/telegram/webhook`;
    const secret = webhookSecret();
    const info = (await tg("getWebhookInfo", {})) as { result?: { url?: string } };
    if (info.result?.url !== url) {
      await tg("setWebhook", {
        url,
        ...(secret ? { secret_token: secret } : {}),
        allowed_updates: ["message", "edited_message", "callback_query"],
        drop_pending_updates: false,
      });
      botLog.info("webhook_set", { url });
    }
    await tg("setMyCommands", {
      commands: [
        { command: "start", description: "🎮 Bosh menyu" },
        { command: "menu", description: "📋 Menyuni ochish" },
        { command: "qoidalar", description: "👑 Qoidalar" },
        { command: "id", description: "🆔 Telegram ID" },
      ],
    });
    await tg("setChatMenuButton", {
      menu_button: { type: "web_app", text: "🎮 MAGAZIN", web_app: { url: base } },
    });

    return true;
  } catch (error) {
    webhookEnsured = false;
    botLog.error("webhook_ensure_failed", error);
    return false;
  }
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
