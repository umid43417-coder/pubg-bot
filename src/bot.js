import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { addListing, findListing, getDb, nextId, save, userListings, activeListings } from "./db.js";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 8787603995);
const WEBAPP_URL = process.env.WEBAPP_URL || "";

export const bot = new Bot(TOKEN);

const sessions = new Map();
const S = (id) => {
  if (!sessions.has(id)) sessions.set(id, {});
  return sessions.get(id);
};

const FIELDS = [
  { key: "lvl", q: "📈 <b>LVL</b> ni kiriting (masalan: 76)" },
  { key: "rp", q: "🛎 <b>RP</b> ni kiriting (masalan: 60 yoki 'videoda')" },
  { key: "kiyim", q: "🦹‍♂️ <b>Kiyimlar</b> soni (masalan: 400+)" },
  { key: "avto", q: "🔫 <b>Avtomatga skin</b> soni (masalan: 200+)" },
  { key: "parashut", q: "🎈 <b>Parashutga skin</b> soni (masalan: 30+)" },
  { key: "papka", q: "🎒 <b>Papkaga skin</b> soni (masalan: 30)" },
  { key: "dost", q: "🔱 <b>Dostijeniya</b> (masalan: 7800)" },
  { key: "titul", q: "⚜️ <b>Titullar</b> (masalan: videoda)" },
  { key: "prokachka", q: "⚡️ <b>Prokachka</b> (masalan: 48)" },
  { key: "killchat", q: "➡️ <b>Kill chat</b> (masalan: 15)" },
  { key: "extra", q: "🔥 <b>Qo'shimcha</b> ma'lumot (yo'q bo'lsa: -)" },
  { key: "price", q: "💰 <b>Narxi</b>ni yozing (masalan: 1 500 000 so'm)" },
];

export function mainMenu() {
  const kb = new Keyboard()
    .text("🛒 Magazin").text("➕ Akkaunt sotish").row()
    .text("📦 Mening e'lonlarim").text("💬 Admin").row()
    .text("ℹ️ Qoidalar").resized();
  return kb;
}

function webAppKb() {
  const kb = new InlineKeyboard();
  if (WEBAPP_URL) kb.webApp("🎮 MAGAZINNI OCHISH", WEBAPP_URL);
  return kb;
}

export function listingText(l) {
  return (
    `🎮 <b>PUBG AKKAUNT #${l.id}</b>\n\n` +
    `📈 LVL: <b>${l.lvl}</b>\n` +
    `🛎 RP: <b>${l.rp}</b>\n` +
    `🦹‍♂️ Kiyimlar: <b>${l.kiyim}</b>\n` +
    `🔫 Avtomatga skin: <b>${l.avto}</b>\n` +
    `🎈 Parashutga skin: <b>${l.parashut}</b>\n` +
    `🎒 Papkaga skin: <b>${l.papka}</b>\n` +
    `🔱 Dostijeniya: <b>${l.dost}</b>\n` +
    `⚜️ Titullar: <b>${l.titul}</b>\n` +
    `⚡️ Prokachka: <b>${l.prokachka}</b>\n` +
    `➡️ Kill chat: <b>${l.killchat}</b>\n` +
    `🔥 Qo'shimcha: <b>${l.extra}</b>\n\n` +
    `💰 Narxi: <b>${l.price}</b>\n` +
    `👤 Sotuvchi: ${l.sellerUsername ? "@" + l.sellerUsername : l.sellerName}`
  );
}

bot.command("start", async (ctx) => {
  sessions.delete(ctx.from.id);
  const db = getDb();
  db.users[ctx.from.id] = { name: ctx.from.first_name, username: ctx.from.username };
  save();
  await ctx.reply(
    `👋 Salom, <b>${ctx.from.first_name}</b>!\n\n` +
      `🎮 <b>PUBG AKKAUNT MAGAZINI</b>ga xush kelibsiz.\n\n` +
      `• Akkauntingizni video/rasm bilan sotuvga qo'ying\n` +
      `• Boshqalarning akkauntlarini ko'ring\n` +
      `• Savdo <b>admin (garant)</b> orqali xavfsiz o'tadi 🛡\n\n` +
      `Pastdagi tugmalardan foydalaning 👇`,
    { parse_mode: "HTML", reply_markup: mainMenu() }
  );
  if (WEBAPP_URL) await ctx.reply("🕹 Magazin mini-app:", { reply_markup: webAppKb() });
});

bot.hears("🛒 Magazin", async (ctx) => {
  const n = activeListings().length;
  await ctx.reply(`🛒 Hozir sotuvda <b>${n}</b> ta akkaunt bor.`, {
    parse_mode: "HTML",
    reply_markup: webAppKb(),
  });
});

bot.hears("ℹ️ Qoidalar", async (ctx) => {
  await ctx.reply(
    `📜 <b>QOIDALAR</b>\n\n` +
      `1️⃣ Faqat o'zingizga tegishli akkauntni soting.\n` +
      `2️⃣ Video/rasm haqiqiy bo'lishi shart.\n` +
      `3️⃣ To'lov <b>admin (garant)</b> orqali amalga oshadi.\n` +
      `4️⃣ Aldash aniqlansa — bloklanadi 🚫\n` +
      `5️⃣ Har bir e'lon admin tomonidan tekshiriladi ✅`,
    { parse_mode: "HTML" }
  );
});

bot.hears("💬 Admin", async (ctx) => {
  await ctx.reply("💬 Admin bilan bog'lanish uchun yozing: <b>garant / savol / shikoyat</b>", {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().url("👨‍💻 Adminga yozish", `tg://user?id=${ADMIN_ID}`),
  });
});

bot.hears("📦 Mening e'lonlarim", async (ctx) => {
  const list = userListings(ctx.from.id);
  if (!list.length) return ctx.reply("📭 Sizda hali e'lon yo'q. ➕ Akkaunt sotish tugmasini bosing.");
  for (const l of list) {
    const status =
      l.status === "active" ? "✅ Sotuvda" : l.status === "pending" ? "⏳ Tekshiruvda" : l.status === "sold" ? "💸 Sotildi" : "❌ Rad etilgan";
    await ctx.reply(`${listingText(l)}\n\n📌 Holat: <b>${status}</b>`, { parse_mode: "HTML" });
  }
});

bot.hears("➕ Akkaunt sotish", async (ctx) => {
  const s = S(ctx.from.id);
  s.step = "media";
  s.media = [];
  s.data = {};
  await ctx.reply(
    `📹 Avval akkauntingizning <b>video</b>si va/yoki <b>rasm</b>larini yuboring (10 tagacha).\n\n` +
      `Tugatgach <b>✅ Tayyor</b> tugmasini bosing.`,
    {
      parse_mode: "HTML",
      reply_markup: new Keyboard().text("✅ Tayyor").text("❌ Bekor qilish").resized(),
    }
  );
});

bot.hears("❌ Bekor qilish", async (ctx) => {
  sessions.delete(ctx.from.id);
  await ctx.reply("❌ Bekor qilindi.", { reply_markup: mainMenu() });
});

bot.on(["message:photo", "message:video"], async (ctx) => {
  const s = S(ctx.from.id);
  if (s.step !== "media") return;
  if (s.media.length >= 10) return ctx.reply("⚠️ Maksimum 10 ta fayl.");
  if (ctx.message.photo) {
    const p = ctx.message.photo[ctx.message.photo.length - 1];
    s.media.push({ type: "photo", file_id: p.file_id });
  } else {
    s.media.push({ type: "video", file_id: ctx.message.video.file_id });
  }
  await ctx.reply(`📎 Qabul qilindi (${s.media.length}). Yana yuboring yoki ✅ Tayyor.`);
});

bot.hears("✅ Tayyor", async (ctx) => {
  const s = S(ctx.from.id);
  if (s.step !== "media") return;
  if (!s.media.length) return ctx.reply("⚠️ Kamida 1 ta video yoki rasm yuboring.");
  s.step = 0;
  await ctx.reply(FIELDS[0].q, { parse_mode: "HTML", reply_markup: { remove_keyboard: true } });
});

bot.on("message:text", async (ctx, next) => {
  const s = S(ctx.from.id);
  if (typeof s.step !== "number") return next();
  const f = FIELDS[s.step];
  s.data[f.key] = ctx.message.text.trim();
  s.step++;
  if (s.step < FIELDS.length) {
    return ctx.reply(FIELDS[s.step].q, { parse_mode: "HTML" });
  }
  const listing = {
    id: nextId(),
    sellerId: ctx.from.id,
    sellerName: ctx.from.first_name,
    sellerUsername: ctx.from.username || "",
    ...s.data,
    media: s.media,
    status: "pending",
    createdAt: Date.now(),
  };
  addListing(listing);
  sessions.delete(ctx.from.id);
  await ctx.reply(
    `✅ E'loningiz qabul qilindi!\n⏳ Admin tekshirgach magazinda paydo bo'ladi.`,
    { reply_markup: mainMenu() }
  );
  const kb = new InlineKeyboard()
    .text("✅ Tasdiqlash", `ok_${listing.id}`)
    .text("❌ Rad etish", `no_${listing.id}`);
  await bot.api.sendMessage(ADMIN_ID, `🆕 <b>YANGI E'LON</b>\n\n${listingText(listing)}`, {
    parse_mode: "HTML",
    reply_markup: kb,
  });
  for (const m of listing.media.slice(0, 10)) {
    try {
      if (m.type === "photo") await bot.api.sendPhoto(ADMIN_ID, m.file_id);
      else await bot.api.sendVideo(ADMIN_ID, m.file_id);
    } catch (e) {
      console.error(e);
    }
  }
});

bot.callbackQuery(/^(ok|no)_(\d+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCallbackQuery({ text: "⛔️ Faqat admin uchun" });
  const [, act, id] = ctx.match;
  const l = findListing(id);
  if (!l) return ctx.answerCallbackQuery({ text: "Topilmadi" });
  l.status = act === "ok" ? "active" : "rejected";
  save();
  await ctx.answerCallbackQuery({ text: act === "ok" ? "✅ Tasdiqlandi" : "❌ Rad etildi" });
  await ctx.editMessageReplyMarkup({ reply_markup: undefined });
  await bot.api.sendMessage(
    l.sellerId,
    act === "ok"
      ? `✅ E'loningiz #${l.id} tasdiqlandi va magazinda!`
      : `❌ E'loningiz #${l.id} rad etildi. Admin bilan bog'laning.`
  );
});

bot.callbackQuery(/^sold_(\d+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCallbackQuery({ text: "⛔️" });
  const l = findListing(ctx.match[1]);
  if (l) {
    l.status = "sold";
    save();
  }
  await ctx.answerCallbackQuery({ text: "💸 Sotildi deb belgilandi" });
});

export async function notifyBuy(listing, buyer) {
  const kb = new InlineKeyboard()
    .url("👤 Xaridor", `tg://user?id=${buyer.id}`)
    .url("👤 Sotuvchi", `tg://user?id=${listing.sellerId}`)
    .row()
    .text("💸 Sotildi", `sold_${listing.id}`);
  await bot.api.sendMessage(
    ADMIN_ID,
    `🛒 <b>SOTIB OLISH SO'ROVI</b>\n\n` +
      `Xaridor: ${buyer.username ? "@" + buyer.username : buyer.first_name} (<code>${buyer.id}</code>)\n\n` +
      listingText(listing),
    { parse_mode: "HTML", reply_markup: kb }
  );
  try {
    await bot.api.sendMessage(
      buyer.id,
      `✅ So'rovingiz adminga yuborildi (#${listing.id}).\n🛡 Savdo admin (garant) orqali amalga oshiriladi. Kuting.`
    );
  } catch {}
}

export { ADMIN_ID };
