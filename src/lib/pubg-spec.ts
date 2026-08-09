/**
 * PUBG Mobile e'loni uchun to'liq ma'lumot strukturasi.
 * Bu ro'yxatdan: e'lon joylash formasi, e'lon sahifasi va Telegram bot
 * bo'limlari avtomatik yasaladi (bir joyda tahrirlash uchun).
 */

export type SpecFieldType = "text" | "number" | "textarea" | "bool";

export type SpecField = {
  key: string;
  label: string;
  icon?: string;
  type?: SpecFieldType;
  ph?: string;
};

export type SpecSection = {
  id: string;
  icon: string;
  title: string;
  /** Telegram inline tugma uchun qisqa nom */
  short: string;
  fields: SpecField[];
};

export const PUBG_SECTIONS: SpecSection[] = [
  {
    id: "main",
    icon: "🎮",
    title: "Asosiy ma'lumotlar",
    short: "🎮 Asosiy",
    fields: [
      { key: "pubg_id", label: "PUBG ID", icon: "🆔", ph: "5123456789" },
      { key: "nick", label: "Nickname", icon: "👤", ph: "PlayerOne" },
      { key: "level", label: "Level", icon: "⭐", type: "number", ph: "75" },
      { key: "server", label: "Server", icon: "🌍", ph: "Global / Asia" },
      { key: "created", label: "Yaratilgan sana", icon: "📅", ph: "2018" },
      { key: "rating", label: "Reyting", icon: "🏆", ph: "5200" },
      { key: "rank", label: "Rank", icon: "🎖️", ph: "Conqueror" },
      { key: "season", label: "Season natijasi", icon: "🏅", ph: "C7S18 — Ace" },
      { key: "popularity", label: "Popularity", icon: "🔥", ph: "25K" },
      { key: "likes", label: "Like", icon: "❤️", ph: "8.2K" },
      { key: "clan", label: "Clan / Crew", icon: "👥", ph: "TARGET MG" },
      { key: "achievements", label: "Achievements", icon: "🏆", ph: "7800" },
    ],
  },
  {
    id: "ranks",
    icon: "🏆",
    title: "Ranklar",
    short: "🏆 Ranklar",
    fields: [
      { key: "solo", label: "Solo Rank", icon: "1️⃣", ph: "Ace" },
      { key: "duo", label: "Duo Rank", icon: "2️⃣", ph: "Crown V" },
      { key: "squad", label: "Squad Rank", icon: "4️⃣", ph: "Conqueror" },
      { key: "tpp", label: "TPP Rank", icon: "🎯", ph: "Ace Master" },
      { key: "fpp", label: "FPP Rank", icon: "🔭", ph: "Diamond I" },
      { key: "current_season", label: "Current Season", icon: "📆", ph: "C8S22" },
      { key: "highest_rank", label: "Highest Rank", icon: "👑", ph: "Ace Dominator" },
      { key: "highest_season", label: "Highest Season", icon: "🗓", ph: "C5S13" },
      { key: "conqueror", label: "Conqueror bo'lgan", icon: "🔥", type: "bool" },
      { key: "rank_note", label: "Qo'shimcha (Ace/Crown/Diamond...)", icon: "📝", type: "textarea" },
    ],
  },
  {
    id: "guns",
    icon: "🔫",
    title: "Qurol skinlari",
    short: "🔫 Qurollar",
    fields: [
      { key: "m416", label: "M416", icon: "🔥", ph: "Glacier / Mythic" },
      { key: "akm", label: "AKM", icon: "🔥", ph: "Gold Pharaoh" },
      { key: "scar", label: "SCAR-L", icon: "🔥" },
      { key: "aug", label: "AUG", icon: "🔥" },
      { key: "groza", label: "Groza", icon: "🔥" },
      { key: "ump45", label: "UMP45", icon: "🔥" },
      { key: "vector", label: "Vector", icon: "🔥" },
      { key: "thompson", label: "Thompson", icon: "🔥" },
      { key: "dp28", label: "DP-28", icon: "🔥" },
      { key: "m24", label: "M24", icon: "🔥" },
      { key: "awm", label: "AWM", icon: "🔥" },
      { key: "kar98k", label: "Kar98K", icon: "🔥" },
      { key: "amr", label: "AMR", icon: "🔥" },
      { key: "dbs", label: "DBS", icon: "🔥" },
      { key: "s12k", label: "S12K", icon: "🔥" },
      { key: "mg3", label: "MG3", icon: "🔥" },
      { key: "other_guns", label: "Boshqa qurol skinlari", icon: "🧰", type: "textarea" },
    ],
  },
  {
    id: "upgrade",
    icon: "⬆️",
    title: "Upgrade qurollar",
    short: "⬆️ Upgrade",
    fields: [
      {
        key: "list",
        label: "Upgradable qurollar (har birini yangi qatorda)",
        icon: "⚡️",
        type: "textarea",
        ph: "M416 Glacier — Lvl 5/7 · Finisher ✅ · Material ✅ · Kill effect ✅",
      },
      { key: "max_level", label: "Max level qurollar soni", icon: "🏁", type: "number" },
    ],
  },
  {
    id: "clothes",
    icon: "👕",
    title: "Kiyimlar",
    short: "👕 Kiyimlar",
    fields: [
      { key: "outfit", label: "Outfit", icon: "👕" },
      { key: "pants", label: "Pants", icon: "👖" },
      { key: "shoes", label: "Shoes", icon: "👟" },
      { key: "sets", label: "Sets", icon: "🧥" },
      { key: "hats", label: "Hats", icon: "🎩" },
      { key: "masks", label: "Masks", icon: "😷" },
      { key: "glasses", label: "Glasses", icon: "🕶️" },
      { key: "backpacks", label: "Backpacks", icon: "🎒" },
      { key: "helmets", label: "Helmets", icon: "🪖" },
      { key: "gloves", label: "Gloves", icon: "🧤" },
      { key: "parachutes", label: "Parachutes", icon: "🪂" },
    ],
  },
  {
    id: "inventory",
    icon: "🎒",
    title: "Inventory (sonlar)",
    short: "🎒 Inventar",
    fields: [
      { key: "outfit", label: "Outfit soni", icon: "👕", type: "number", ph: "185" },
      { key: "guns", label: "Gun skin soni", icon: "🔫", type: "number", ph: "247" },
      { key: "backpack", label: "Backpack", icon: "🎒", type: "number", ph: "38" },
      { key: "helmet", label: "Helmet", icon: "🪖", type: "number", ph: "31" },
      { key: "vehicle", label: "Vehicle skin", icon: "🚗", type: "number", ph: "24" },
      { key: "parachute", label: "Parachute", icon: "🪂", type: "number" },
      { key: "plane", label: "Plane skin", icon: "✈️", type: "number" },
      { key: "glider", label: "Glider / board", icon: "🛹", type: "number" },
      { key: "headgear", label: "Headgear", icon: "🧢", type: "number" },
      { key: "face", label: "Face items", icon: "😎", type: "number" },
    ],
  },
  {
    id: "mythic",
    icon: "💎",
    title: "Mythic / Legendary",
    short: "💎 Mythic",
    fields: [
      { key: "mythic", label: "Mythic outfit", icon: "💎", type: "number", ph: "17" },
      { key: "legendary", label: "Legendary outfit", icon: "🔥", type: "number", ph: "64" },
      { key: "xsuit_count", label: "X-Suit soni", icon: "👑", type: "number", ph: "2" },
      { key: "ultimate", label: "Ultimate Set", icon: "👑", type: "number" },
      { key: "special", label: "Special sets", icon: "💫", type: "textarea" },
    ],
  },
  {
    id: "xsuit",
    icon: "👑",
    title: "X-Suit",
    short: "👑 X-Suit",
    fields: [
      { key: "name", label: "X-Suit nomi", icon: "👑", ph: "Blood Raven / Pharaoh" },
      { key: "level", label: "Level", icon: "🔢", ph: "5" },
      { key: "upgrade", label: "Upgrade darajasi", icon: "⬆️", ph: "4/6" },
      { key: "max", label: "Max level", icon: "🏁", type: "bool" },
      { key: "effects", label: "Effectlar", icon: "✨", type: "textarea" },
    ],
  },
  {
    id: "vehicle",
    icon: "🚗",
    title: "Transport",
    short: "🚗 Transport",
    fields: [
      { key: "car", label: "Car skin", icon: "🚗" },
      { key: "moto", label: "Motorcycle", icon: "🏍️" },
      { key: "uaz", label: "UAZ", icon: "🛻" },
      { key: "dacia", label: "Dacia", icon: "🚙" },
      { key: "buggy", label: "Buggy", icon: "🚘" },
      { key: "bus", label: "Bus", icon: "🚌" },
      { key: "scooter", label: "Scooter", icon: "🛵" },
      { key: "boat", label: "Boat", icon: "🛶" },
      { key: "plane", label: "Plane", icon: "✈️" },
    ],
  },
  {
    id: "rp",
    icon: "🎫",
    title: "Royale Pass",
    short: "🎫 RP",
    fields: [
      { key: "current", label: "Current RP", icon: "🎫", ph: "A9 — 50 lvl" },
      { key: "highest", label: "Highest RP", icon: "🏆", ph: "100" },
      { key: "count", label: "RP soni", icon: "🔢", type: "number", ph: "12" },
      { key: "rewards", label: "RP rewardlar", icon: "🎁", type: "textarea" },
      { key: "skins", label: "RP skinlar", icon: "🎨", type: "textarea" },
      { key: "past", label: "Oldingi RP seasonlari", icon: "📚", type: "textarea" },
    ],
  },
  {
    id: "uc",
    icon: "💎",
    title: "UC",
    short: "💎 UC",
    fields: [
      { key: "now", label: "Hozirgi UC", icon: "💎", type: "number", ph: "5200" },
      { key: "max", label: "Eng ko'p bo'lgan UC", icon: "📈", type: "number" },
      { key: "spent", label: "Sarflangan UC", icon: "💸", type: "number" },
    ],
  },
  {
    id: "achv",
    icon: "🏆",
    title: "Achievements",
    short: "🏆 Achievement",
    fields: [
      { key: "count", label: "Achievement soni", icon: "🏆", type: "number" },
      { key: "rare", label: "Rare achievementlar", icon: "💠", type: "textarea" },
      { key: "titles", label: "Title'lar", icon: "🎖️", type: "textarea" },
      { key: "frames", label: "Frames", icon: "🖼️", type: "number" },
      { key: "badges", label: "Badges", icon: "🏵️", type: "number" },
      { key: "special", label: "Special achievements", icon: "✨", type: "textarea" },
    ],
  },
  {
    id: "titles",
    icon: "🎖️",
    title: "Titles",
    short: "🎖️ Titles",
    fields: [
      { key: "conqueror", label: "Conqueror", icon: "👑", type: "bool" },
      { key: "weapon_master", label: "Weapon Master", icon: "🏆", type: "bool" },
      { key: "deadeye", label: "Deadeye", icon: "🔥", type: "bool" },
      { key: "chicken_master", label: "Chicken Master", icon: "🎯", type: "bool" },
      { key: "pacifist", label: "Pacifist", icon: "💀", type: "bool" },
      { key: "other", label: "Boshqa titlelar", icon: "🎗️", type: "textarea" },
    ],
  },
  {
    id: "profile",
    icon: "🖼️",
    title: "Profil ko'rinishi",
    short: "🖼️ Profil",
    fields: [
      { key: "avatar", label: "Avatar", icon: "🧑‍🚀" },
      { key: "frame", label: "Frame", icon: "🖼️" },
      { key: "avatar_frame", label: "Avatar frame", icon: "🔲" },
      { key: "background", label: "Profile background", icon: "🌌" },
      { key: "title", label: "Title", icon: "🎖️" },
      { key: "clan", label: "Clan", icon: "👥" },
      { key: "popularity", label: "Popularity", icon: "🔥" },
      { key: "likes", label: "Like", icon: "❤️" },
    ],
  },
  {
    id: "clan",
    icon: "👥",
    title: "Clan",
    short: "👥 Clan",
    fields: [
      { key: "name", label: "Clan nomi", icon: "👥" },
      { key: "level", label: "Clan level", icon: "🔢", type: "number" },
      { key: "rank", label: "Clan rank", icon: "🏅" },
      { key: "achievements", label: "Clan achievements", icon: "🏆", type: "textarea" },
      { key: "benefits", label: "Clan benefits", icon: "🎁", type: "textarea" },
    ],
  },
  {
    id: "stats",
    icon: "📊",
    title: "Statistika",
    short: "📊 Statistika",
    fields: [
      { key: "matches", label: "Matches", icon: "🎮", type: "number" },
      { key: "wins", label: "Wins", icon: "🏆", type: "number" },
      { key: "top10", label: "Top 10", icon: "🔟", type: "number" },
      { key: "kills", label: "Kills", icon: "💀", type: "number" },
      { key: "kd", label: "K/D", icon: "⚖️", ph: "4.8" },
      { key: "winrate", label: "Win rate", icon: "📈", ph: "18%" },
      { key: "damage", label: "Average damage", icon: "💥", ph: "620" },
      { key: "headshots", label: "Headshots", icon: "🎯", ph: "42%" },
      { key: "survival", label: "Survival time", icon: "⏱", ph: "18:40" },
    ],
  },
  {
    id: "login",
    icon: "🔐",
    title: "Akkaunt ulanishi (login usullari)",
    short: "🔐 Ulanish",
    fields: [
      { key: "google", label: "Google", icon: "🟢", type: "bool" },
      { key: "facebook", label: "Facebook", icon: "🔵", type: "bool" },
      { key: "apple", label: "Apple", icon: "⚪️", type: "bool" },
      { key: "twitter", label: "X / Twitter", icon: "⚫️", type: "bool" },
      { key: "email", label: "Email", icon: "📧", type: "bool" },
      { key: "phone", label: "Telefon", icon: "📱", type: "bool" },
      { key: "other", label: "Boshqa platformalar", icon: "🔗", type: "textarea" },
    ],
  },
  {
    id: "trust",
    icon: "🛡️",
    title: "Ishonch holati",
    short: "🛡️ Ishonch",
    fields: [
      { key: "verified", label: "Ma'lumotlari tekshirilgan", icon: "✅", type: "bool" },
      { key: "garant", label: "Garant mavjud", icon: "🛡️", type: "bool" },
      { key: "trusted", label: "Ishonchli sotuvchi", icon: "⭐", type: "bool" },
      { key: "video", label: "Video mavjud", icon: "🎥", type: "bool" },
    ],
  },
];

export type AccountDetails = Record<string, Record<string, string | number | boolean>>;

export function sectionById(id: string) {
  return PUBG_SECTIONS.find((s) => s.id === id) ?? null;
}

export function fieldLabel(field: SpecField) {
  return `${field.icon ?? ""} ${field.label}`.trim();
}

export function isFilled(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  return String(value).trim().length > 0;
}

export function formatValue(field: SpecField, value: unknown) {
  if (field.type === "bool") return value ? "✅ Bor" : "—";
  return String(value);
}

/** Bo'limdagi to'ldirilgan maydonlar */
export function filledFields(section: SpecSection, details: AccountDetails) {
  const bag = details?.[section.id] ?? {};
  return section.fields.filter((f) => isFilled(bag[f.key])).map((f) => ({ field: f, value: bag[f.key] }));
}

/** To'ldirilgan bo'limlar (bot tugmalari uchun) */
export function filledSections(details: AccountDetails) {
  return PUBG_SECTIONS.filter((s) => filledFields(s, details).length > 0);
}
