# 🔫 PUBG MARKET — Telegram Bot + Mini App

PUBG akkauntlarini sotish/sotib olish uchun to'liq tayyor Telegram bot va Mini App (WebApp).
Har bir kelishuvda **admin o'rtada** turadi.

**Stack:** Python 3.11 · aiogram 3 · FastAPI · SQLAlchemy 2 (SQLite/Postgres) · Vanilla JS Mini App
**Deploy:** Railway (bir klik, webhook rejimi)

---

## ✨ Imkoniyatlar

**Foydalanuvchi**
- `/start` — asosiy menyu, Mini App tugmasi
- `➕ Akkaunt sotish` — 7 bosqichli e'lon joylash (sarlavha, LVL, narx, tavsif, 1–6 rasm, video, aloqa)
- `📦 Mening e'lonlarim` — sotildi deb belgilash / o'chirish
- Mini App: qidiruv, narx filtri, saralash (yangi / arzon / qimmat / LVL), sotilganlarni yashirish, batafsil sahifa, **«Sotib olish»**

**Admin** (`/admin`)
- E'lonlarni ✅ tasdiqlash / ❌ rad etish (avtomatik xabar sotuvchiga)
- Kelishuvlarni boshqarish: boshlash / yakunlash / bekor qilish
- 📊 Statistika (foydalanuvchilar, e'lonlar, kelishuvlar)
- 📣 Broadcast — hammaga xabar
- `/ban <id>` va `/unban <id>`
- Tasdiqlangan e'lonlar avtomatik kanalga yuboriladi (`CHANNEL_ID` bo'lsa)

**Xavfsizlik**
- Mini App so'rovlari `initData` HMAC-SHA256 imzosi bilan tekshiriladi
- Webhook `X-Telegram-Bot-Api-Secret-Token` bilan himoyalangan
- Bot token va admin ID kodda emas — faqat environment variables

---

## ⚙️ Environment variables

| Nomi | Majburiy | Izoh |
|---|---|---|
| `BOT_TOKEN` | ✅ | @BotFather dan olinadi |
| `ADMIN_IDS` | ✅ | `8787603995` (vergul bilan bir nechta bo'lishi mumkin) |
| `WEBAPP_URL` | ✅ | Railway public domain, masalan `https://pubg-bot-production.up.railway.app` |
| `DATABASE_URL` | ➖ | Bo'sh bo'lsa SQLite. Railway Postgres qo'shsangiz avtomat keladi |
| `USE_WEBHOOK` | ➖ | `1` = webhook (Railway), `0` = polling (lokal) |
| `WEBHOOK_SECRET` | ➖ | Ixtiyoriy maxfiy satr |
| `CHANNEL_ID` | ➖ | `@kanalim` yoki `-1001234567890` |
| `CURRENCY` | ➖ | Standart: `so'm` |

---

## 🚀 Railway ga deploy

1. **Botni yarating** — [@BotFather](https://t.me/BotFather) → `/newbot` → tokenni saqlang.
2. **Railway** → *New Project* → *Deploy from GitHub repo* → ushbu repo.
3. **Variables** bo'limiga qo'shing:
   ```
   BOT_TOKEN=<botfather_token>
   ADMIN_IDS=8787603995
   USE_WEBHOOK=1
   WEBHOOK_SECRET=<istalgan_maxfiy_satr>
   ```
4. **Settings → Networking → Generate Domain** → hosil bo'lgan URL ni nusxalang.
5. O'sha URL ni `WEBAPP_URL` sifatida Variables ga qo'shing (oxirida `/` bo'lmasin) → **Redeploy**.
6. (ixtiyoriy) *New → Database → PostgreSQL* qo'shsangiz, `DATABASE_URL` avtomat ulanadi.
7. **BotFather → /setmenubutton** (yoki bot avtomat o'rnatadi) → Mini App URL = `WEBAPP_URL`.

Tayyor. Botga `/start` yuboring.

---

## 💻 Lokal ishga tushirish

```bash
git clone https://github.com/umid43417-coder/pubg-bot.git
cd pubg-bot
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # BOT_TOKEN va ADMIN_IDS ni to'ldiring, USE_WEBHOOK=0
python -m app.main
```
Mini App ni lokal sinash uchun `ngrok http 8080` qilib, `WEBAPP_URL` ga ngrok linkini qo'ying.

---

## 📁 Struktura

```
app/
  main.py          FastAPI + webhook/polling ishga tushirish
  config.py        Environment sozlamalari
  db.py            SQLAlchemy modellar (User, Listing, Deal)
  bot_instance.py  Bot/Dispatcher singleton
  handlers.py      Foydalanuvchi handlerlari + e'lon joylash FSM
  admin.py         Moderatsiya, statistika, broadcast, kelishuvlar
  api.py           Mini App REST API
  keyboards.py     Reply/Inline klaviaturalar
  texts.py         O'zbekcha matnlar
  webapp_auth.py   Telegram initData imzo tekshiruvi
webapp/
  index.html  style.css  app.js     Mini App (dark PUBG dizayn)
```

## 🔌 API

| Metod | Yo'l | Izoh |
|---|---|---|
| GET | `/api/listings` | `q, min_price, max_price, sort, hide_sold` |
| GET | `/api/listings/{id}` | Bitta e'lon |
| GET | `/api/my` | O'z e'lonlarim (initData kerak) |
| POST | `/api/buy` | Sotib olish so'rovi (initData kerak) |
| GET | `/api/photo/{file_id}` | Telegram rasmini uzatish |
| GET | `/health` | Health check |

---

## ⚠️ Ogohlantirish
Foydalanuvchilarga har doim eslating: **adminsiz to'g'ridan-to'g'ri pul o'tkazmang.**
