import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "uz" | "ru" | "en";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const dict = {
  // nav / shell
  nav_shop: { uz: "Magazin", ru: "Магазин", en: "Shop" },
  nav_sell: { uz: "Sotish", ru: "Продать", en: "Sell" },
  nav_mine: { uz: "Mening", ru: "Мои", en: "Mine" },
  nav_admin: { uz: "Admin", ru: "Админ", en: "Admin" },
  sign_in: { uz: "Kirish", ru: "Войти", en: "Sign in" },
  sign_out: { uz: "Chiqish", ru: "Выйти", en: "Sign out" },
  language: { uz: "Til", ru: "Язык", en: "Language" },

  // home
  hero_kicker: { uz: "Akkaunt magazin", ru: "Магазин аккаунтов", en: "Account market" },
  hero_title_a: { uz: "PUBG akkauntini", ru: "PUBG аккаунт", en: "Sell or buy a" },
  hero_sell: { uz: "sot", ru: "продай", en: "sell" },
  hero_or: { uz: "yoki", ru: "или", en: "or" },
  hero_buy: { uz: "sotib ol", ru: "купи", en: "buy" },
  hero_text: {
    uz: "Har kim o'z akkauntini rasm, video, narx va tavsif bilan joylaydi. Kelishuv admin orqali — o'rtada admin turadi.",
    ru: "Каждый выкладывает свой аккаунт с фото, видео, ценой и описанием. Сделка идёт через админа — админ гарант.",
    en: "Anyone can list an account with photos, video, price and description. Deals go through the admin as an escrow.",
  },
  post_listing: { uz: "E'lon joylash", ru: "Разместить объявление", en: "Post a listing" },
  admin_guarantee: { uz: "Admin kafolati", ru: "Гарантия админа", en: "Admin guarantee" },
  listings_title: { uz: "Sotuvdagi akkauntlar", ru: "Аккаунты в продаже", en: "Accounts for sale" },
  listings_count: { uz: "ta e'lon", ru: "объявл.", en: "listings" },
  no_listings: {
    uz: "Hozircha e'lon yo'q. Birinchi bo'lib akkauntingizni joylang!",
    ru: "Пока объявлений нет. Разместите свой аккаунт первым!",
    en: "No listings yet. Be the first to post your account!",
  },

  // auth
  auth_subtitle: {
    uz: "E'lon joylash uchun hisobingizga kiring",
    ru: "Войдите, чтобы размещать объявления",
    en: "Sign in to post listings",
  },
  sign_up: { uz: "Ro'yxatdan o'tish", ru: "Регистрация", en: "Sign up" },
  create_account: { uz: "Hisob yaratish", ru: "Создать аккаунт", en: "Create account" },
  email: { uz: "Email", ru: "Email", en: "Email" },
  password: { uz: "Parol", ru: "Пароль", en: "Password" },
  or: { uz: "yoki", ru: "или", en: "or" },
  continue_google: {
    uz: "Google bilan davom etish",
    ru: "Продолжить с Google",
    en: "Continue with Google",
  },
  welcome: { uz: "Xush kelibsiz!", ru: "С возвращением!", en: "Welcome!" },
  check_email: {
    uz: "Emailingizga tasdiqlash xati yuborildi.",
    ru: "Письмо для подтверждения отправлено на email.",
    en: "A confirmation email has been sent.",
  },
  account_created: { uz: "Hisob yaratildi!", ru: "Аккаунт создан!", en: "Account created!" },
  google_error: {
    uz: "Google bilan kirish xatosi",
    ru: "Ошибка входа через Google",
    en: "Google sign-in failed",
  },

  // sell
  sell_title: { uz: "Akkaunt sotish", ru: "Продажа аккаунта", en: "Sell an account" },
  sell_text: {
    uz: "Rasm va videolarni yuklang, statistikani to'ldiring. E'lon hammaga ko'rinadi.",
    ru: "Загрузите фото и видео, заполните статистику. Объявление увидят все.",
    en: "Upload photos and videos, fill in the stats. Everyone will see the listing.",
  },
  main_section: { uz: "Asosiy", ru: "Основное", en: "Main" },
  stats_section: { uz: "Statistika", ru: "Статистика", en: "Stats" },
  media_section: { uz: "Media", ru: "Медиа", en: "Media" },
  f_title: { uz: "Sarlavha", ru: "Заголовок", en: "Title" },
  f_price: { uz: "Narx", ru: "Цена", en: "Price" },
  f_currency: { uz: "Valyuta", ru: "Валюта", en: "Currency" },
  f_contact: { uz: "Telegram username", ru: "Telegram username", en: "Telegram username" },
  f_extra: { uz: "Qo'shimcha", ru: "Дополнительно", en: "Extra" },
  f_description: { uz: "Tavsif", ru: "Описание", en: "Description" },
  desc_ph: {
    uz: "Akkaunt haqida batafsil yozing...",
    ru: "Подробно опишите аккаунт...",
    en: "Describe the account in detail...",
  },
  photos: { uz: "Suratlar", ru: "Фото", en: "Photos" },
  videos: { uz: "Videolar", ru: "Видео", en: "Videos" },
  photos_selected: { uz: "ta surat tanlandi", ru: "фото выбрано", en: "photos selected" },
  videos_selected: { uz: "ta video tanlandi", ru: "видео выбрано", en: "videos selected" },
  publish: { uz: "E'lonni joylash", ru: "Опубликовать", en: "Publish" },
  cancel: { uz: "Bekor qilish", ru: "Отмена", en: "Cancel" },
  published: { uz: "E'lon joylandi!", ru: "Объявление размещено!", en: "Listing published!" },
  error_generic: { uz: "Xatolik yuz berdi", ru: "Произошла ошибка", en: "Something went wrong" },

  // detail
  back_to_shop: { uz: "Magazinga qaytish", ru: "Назад в магазин", en: "Back to shop" },
  not_found: { uz: "E'lon topilmadi.", ru: "Объявление не найдено.", en: "Listing not found." },
  no_media: { uz: "Media yo'q", ru: "Нет медиа", en: "No media" },
  buy_via_admin: {
    uz: "Xarid admin orqali",
    ru: "Покупка через админа",
    en: "Purchase via admin",
  },
  escrow_text: {
    uz: "Pulni to'g'ridan-to'g'ri sotuvchiga yubormang. Admin o'rtada turadi va akkauntni xavfsiz topshiradi.",
    ru: "Не отправляйте деньги напрямую продавцу. Админ выступает гарантом и передаёт аккаунт безопасно.",
    en: "Never send money directly to the seller. The admin acts as escrow and hands over the account safely.",
  },
  contact_admin: {
    uz: "Admin bilan bog'lanish",
    ru: "Связаться с админом",
    en: "Contact the admin",
  },
  seller: { uz: "Sotuvchi", ru: "Продавец", en: "Seller" },
  sold: { uz: "Sotilgan", ru: "Продано", en: "Sold" },
  video: { uz: "Video", ru: "Видео", en: "Video" },

  // mine / admin
  my_listings: { uz: "Mening e'lonlarim", ru: "Мои объявления", en: "My listings" },
  no_my_listings: {
    uz: "Sizda hali e'lon yo'q.",
    ru: "У вас ещё нет объявлений.",
    en: "You have no listings yet.",
  },
  mark_sold: { uz: "Sotilgan", ru: "Продано", en: "Mark sold" },
  back_to_sale: { uz: "Sotuvga qaytar", ru: "Вернуть в продажу", en: "Back on sale" },
  deleted: { uz: "E'lon o'chirildi", ru: "Объявление удалено", en: "Listing deleted" },
  delete: { uz: "O'chirish", ru: "Удалить", en: "Delete" },
  admin_panel: { uz: "Admin panel", ru: "Админ панель", en: "Admin panel" },
  admin_text: {
    uz: "Barcha e'lonlarni boshqarish: sotilgan deb belgilash yoki o'chirish.",
    ru: "Управление всеми объявлениями: отметить продано или удалить.",
    en: "Manage every listing: mark as sold or delete.",
  },
  admin_only: {
    uz: "Bu sahifa faqat adminlar uchun.",
    ru: "Эта страница только для админов.",
    en: "This page is for admins only.",
  },
  total_listings: { uz: "Jami e'lon", ru: "Всего объявлений", en: "Total listings" },
  active: { uz: "Sotuvda", ru: "В продаже", en: "Active" },

  // search & filters
  search_ph: {
    uz: "Qidirish: sarlavha, tavsif...",
    ru: "Поиск: заголовок, описание...",
    en: "Search: title, description...",
  },
  price_from: { uz: "Narx (dan)", ru: "Цена (от)", en: "Price (from)" },
  price_to: { uz: "Narx (gacha)", ru: "Цена (до)", en: "Price (to)" },
  sort_label: { uz: "Saralash", ru: "Сортировка", en: "Sort" },
  sort_new: { uz: "Yangi", ru: "Новые", en: "Newest" },
  sort_cheap: { uz: "Arzon", ru: "Дешевле", en: "Cheapest" },
  sort_expensive: { uz: "Qimmat", ru: "Дороже", en: "Most expensive" },
  sort_level: { uz: "LVL bo'yicha", ru: "По LVL", en: "By level" },
  hide_sold: { uz: "Sotilganlarni yashir", ru: "Скрыть проданные", en: "Hide sold" },
  reset_filters: { uz: "Tozalash", ru: "Сбросить", en: "Reset" },
  no_results: {
    uz: "Filtrga mos e'lon topilmadi.",
    ru: "По фильтру ничего не найдено.",
    en: "No listings match the filters.",
  },

  // chat
  chat_title: { uz: "Sotuvchi bilan chat", ru: "Чат с продавцом", en: "Chat with the seller" },
  chat_ph: { uz: "Xabar yozing...", ru: "Напишите сообщение...", en: "Write a message..." },
  chat_send: { uz: "Yuborish", ru: "Отправить", en: "Send" },
  chat_signin: {
    uz: "Sotuvchiga yozish uchun hisobingizga kiring.",
    ru: "Войдите, чтобы написать продавцу.",
    en: "Sign in to message the seller.",
  },
  chat_empty: { uz: "Xabarlar yo'q.", ru: "Сообщений нет.", en: "No messages yet." },
  chat_buyer: { uz: "Xaridor", ru: "Покупатель", en: "Buyer" },

  // settings
  settings_section: { uz: "Sozlamalar", ru: "Настройки", en: "Settings" },
  admin_telegram_label: {
    uz: "Admin Telegram username",
    ru: "Telegram username админа",
    en: "Admin Telegram username",
  },
  save: { uz: "Saqlash", ru: "Сохранить", en: "Save" },
  saved: { uz: "Saqlandi", ru: "Сохранено", en: "Saved" },
} satisfies Record<string, Record<Lang, string>>;

export type TKey = keyof typeof dict;

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "uz",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("uz");

  useEffect(() => {
    const stored = window.localStorage.getItem("lang") as Lang | null;
    if (stored && LANGS.some((l) => l.code === stored)) setLang(stored);
  }, []);

  function update(l: Lang) {
    setLang(l);
    window.localStorage.setItem("lang", l);
  }

  return <LangContext.Provider value={{ lang, setLang: update }}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const { lang, setLang } = useContext(LangContext);
  return { lang, setLang, t: (key: TKey) => dict[key][lang] };
}
