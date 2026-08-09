# PUBG Market — akkaunt savdo mini app

PUBG Mobile akkauntlarini sotish/sotib olish uchun mini app. Hamma o'z akkauntini surat + video bilan joylaydi, hamma bir-birining e'lonini ko'radi, xarid **admin (o'rtada admin)** orqali bo'ladi.

**Tillar:** 🇺🇿 O'zbek · 🇷🇺 Русский · 🇬🇧 English
**Stack:** TanStack Start (React 19) + Vite + Tailwind + Lovable Cloud (Postgres, Auth, Storage)

---

## 1. Nima bor (funksiyalar)

- **Ro'yxatdan o'tish / kirish:** Email + parol yoki **Google** orqali.
- **Sotish (`/sotish`):** sarlavha, narx (UZS), tavsif, kontakt + surat va video yuklash. Maydonlar:
  📈 LVL · 🛎 RP · 🦹‍♂️ Kiyimlar · 🔫 Avtomatga skin · 🎈 Parashutga skin · 🎒 Papkaga skin · 🔱 Dostajeniya · ⚜️ Titullar · ⚡️ Prokachka · ➡️ Kill chat · 🔥 Qo'shimcha
- **Magazin (bosh sahifa):** qidiruv, narx filtri, saralash (yangi / arzon / qimmat), "sotilganlarni yashirish".
- **Akkaunt sahifasi (`/akkaunt/$id`):** media galereya, to'liq statistika, narx, **"Admin bilan bog'lanish"** tugmasi va sotuvchi bilan ichki **chat**.
- **Mening e'lonlarim (`/mening`):** o'z e'lonini "sotildi" qilish yoki o'chirish.
- **Admin panel (`/admin`):** statistika (jami / sotuvda / sotilgan), har qanday e'lonni sotilgan qilish yoki o'chirish, **admin Telegram username**ni o'zgartirish.
- **Gamer dizayn:** neon AK-47, uchib o'tuvchi o'q izlari, aylanuvchi crosshair, fon bo'ylab qimirlab yuruvchi 🔫🎒🎈🔱💥 ikonkalar.

## 2. Admin kim bo'ladi?

Eng **birinchi ro'yxatdan o'tgan hisob** avtomatik `admin` rolini oladi — ya'ni bot egasi siz. Rollar alohida `user_roles` jadvalida saqlanadi (xavfsiz, `has_role()` funksiyasi orqali tekshiriladi).

Admin panelda **"Admin Telegram username"** maydoniga o'zingizni yozing (masalan `@alimardonov`). Shundan keyin har bir akkaunt sahifasidagi **"Admin bilan bog'lanish"** tugmasi to'g'ri sizga olib boradi.

## 3. Lokal ishga tushirish

```bash
npm install
npm run dev
```

`.env` fayl (repoda yo'q, o'zingiz yaratasiz):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

---

## 4. Railway'ga deploy (to'liq, qadam-baqadam)

> **Muhim:** eski xato `error: Node.js 18.x has reached End-Of-Life and has been removed` — bu Railway Node 18 ni ishlatgani uchun bo'lgan. Endi repoda `nixpacks.toml`, `.nvmrc` va `package.json > engines` orqali **Node 22** qadab qo'yilgan, shu xato qaytmaydi.

1. Railway → **New Project → Deploy from GitHub repo** → `alimardonov112-web/pubg-savdo-bot`.
2. **Variables** bo'limiga quyidagilarni qo'shing (Raw Editor'ga shuni to'liq tashlash mumkin):

```env
NITRO_PRESET=node_server
NODE_VERSION=22
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

3. Build/Start buyruqlari `nixpacks.toml` va `railway.json` da yozilgan — qo'lda kiritish shart emas:
   - Build: `NITRO_PRESET=node_server npm run build`
   - Start: `npm start`
4. **Settings → Networking → Generate Domain** bosing, shunda public link chiqadi.
5. **Deploy**. `PORT` ni Railway o'zi beradi.

Agar deploy qizil bo'lsa: **Deploy Logs** ni ochib, oxirgi 20 qatorni menga yuboring.

---

## 5. Telegram bot bilan bog'lash uchun kerak bo'ladigan ma'lumotlar

Mini app'ni Telegram bot ichida ochish uchun mendan so'rashingiz kifoya, lekin avval shu 3 narsa kerak:

| Nima | Qayerdan olinadi | Namuna |
| --- | --- | --- |
| **BOT TOKEN** | Telegram'da [@BotFather](https://t.me/BotFather) → `/newbot` → nom va username bering → token beradi | `8123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| **ADMIN ID** (sizning raqamli ID) | [@userinfobot](https://t.me/userinfobot) ga `/start` yozing | `123456789` |
| **ADMIN USERNAME** | O'zingizning Telegram username | `@alimardonov` |

Keyin BotFather'da: `/mybots` → botni tanlang → **Bot Settings → Menu Button → Configure menu button** → Railway domeningizni qo'ying, matn: `🎮 Magazin`.

> Bot token **maxfiy** — uni GitHub'ga yozmang. Loyihada u secret sifatida saqlanadi.

---

## 6. Menga (chatga) yozib buyurishingiz mumkin bo'lgan buyruqlar

Shulardan birini nusxalab yozsangiz — men qilib beraman:

1. `admin telegram username'im @X, admin id 123456789` — admin kontaktini qadab qo'yaman.
2. `telegram botni ulab ber, token bor` — bot orqali xabar yuborish + mini app menyusi.
3. `yangi e'lon chiqsa menga telegramga xabar kelsin` — admin bildirishnomasi.
4. `to'lov / garant tizimi qo'sh` — buyurtma statuslari (kutilmoqda → to'landi → topshirildi).
5. `e'lonni admin tasdiqlagandan keyin ko'rinsin` — moderatsiya.
6. `reyting va sharh qo'sh` — sotuvchiga baho.
7. `Railway logi qizil, mana xato: ...` — deploy xatosini tuzataman.
8. `dizaynni yana jonlantir` — qo'shimcha animatsiya/effektlar.

---

## 7. Loyiha tuzilishi

```
src/
  routes/            # sahifalar: index (magazin), sotish, akkaunt.$id, mening, admin, auth
  components/        # AppShell, AccountCard, ChatThread, GameFX (AK-47 va animatsiyalar), LanguageSwitcher
  lib/               # accounts.ts, messages.ts, settings.ts, i18n.tsx
  integrations/      # backend (Postgres, Auth, Storage) klientlari
nixpacks.toml        # Railway uchun Node 22 + build/start
railway.json         # Railway deploy sozlamalari
```

Ma'lumotlar bazasi jadvallari: `profiles`, `accounts`, `messages`, `app_settings`, `user_roles`. Media `account-media` private bucket'da, faqat vaqtinchalik signed URL orqali ko'rsatiladi.
