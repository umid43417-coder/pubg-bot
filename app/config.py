"""Loyiha sozlamalari — barcha qiymatlar environment (.env yoki Railway Variables) dan olinadi."""
import os

from dotenv import load_dotenv

load_dotenv()


def _int_list(raw: str) -> list[int]:
    out: list[int] = []
    for part in (raw or "").replace(" ", "").split(","):
        if part.lstrip("-").isdigit():
            out.append(int(part))
    return out


BOT_TOKEN: str = os.getenv("BOT_TOKEN", "").strip().strip('"').strip("'")

# Asosiy admin (siz). Qo'shimcha adminlarni ADMIN_IDS ga vergul bilan qo'shing.
DEFAULT_ADMIN_ID = 8787603995
ADMIN_IDS: list[int] = _int_list(os.getenv("ADMIN_IDS", str(DEFAULT_ADMIN_ID))) or [DEFAULT_ADMIN_ID]


def _public_url() -> str:
    """WEBAPP_URL berilmasa Railway bergan domendan avtomat aniqlaydi."""
    raw = os.getenv("WEBAPP_URL", "").strip()
    if not raw:
        for key in ("RAILWAY_PUBLIC_DOMAIN", "RAILWAY_STATIC_URL", "RENDER_EXTERNAL_URL"):
            candidate = os.getenv(key, "").strip()
            if candidate:
                raw = candidate
                break
    if not raw:
        return ""
    if not raw.startswith("http"):
        raw = "https://" + raw
    return raw.rstrip("/")


WEBAPP_URL: str = _public_url()
USE_WEBHOOK: bool = os.getenv("USE_WEBHOOK", "1") == "1" and WEBAPP_URL.startswith("https://")
WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "pubg-market-secret")
WEBHOOK_PATH: str = "/tg/webhook"

PORT: int = int(os.getenv("PORT", "8080"))
CURRENCY: str = os.getenv("CURRENCY", "so'm")
CHANNEL_ID: str = os.getenv("CHANNEL_ID", "").strip()


def _db_url() -> str:
    raw = os.getenv("DATABASE_URL", "").strip()
    if not raw:
        # Railway Volume ulangan bo'lsa — doimiy saqlanadi, aks holda konteyner ichida (deploy'da o'chadi)
        base = os.getenv("RAILWAY_VOLUME_MOUNT_PATH", "").strip() or "data"
        os.makedirs(base, exist_ok=True)
        return f"sqlite+aiosqlite:///{base}/pubg.db"
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw.startswith("postgresql://"):
        raw = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    # asyncpg SSL parametrlarini URL'da qabul qilmaydi
    if "postgresql+asyncpg://" in raw and "?" in raw:
        raw = raw.split("?", 1)[0]
    return raw


DATABASE_URL: str = _db_url()

if DATABASE_URL.startswith("sqlite"):
    os.makedirs(os.path.dirname(DATABASE_URL.split("///", 1)[1]) or ".", exist_ok=True)


def is_admin(user_id: int | None) -> bool:
    return user_id is not None and int(user_id) in ADMIN_IDS


def assert_config() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN environment o'zgaruvchisi yo'q. Railway > Variables ga qo'shing.")
    if ":" not in BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN noto'g'ri formatda. @BotFather bergan to'liq tokenni qo'ying.")
