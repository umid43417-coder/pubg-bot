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


BOT_TOKEN: str = os.getenv("BOT_TOKEN", "").strip()

# Asosiy admin (siz). Qo'shimcha adminlarni ADMIN_IDS ga vergul bilan qo'shing.
DEFAULT_ADMIN_ID = 8787603995
ADMIN_IDS: list[int] = _int_list(os.getenv("ADMIN_IDS", str(DEFAULT_ADMIN_ID))) or [DEFAULT_ADMIN_ID]

WEBAPP_URL: str = os.getenv("WEBAPP_URL", "").rstrip("/")
USE_WEBHOOK: bool = os.getenv("USE_WEBHOOK", "1") == "1"
WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "pubg-market-secret")
WEBHOOK_PATH: str = "/tg/webhook"

PORT: int = int(os.getenv("PORT", "8080"))
CURRENCY: str = os.getenv("CURRENCY", "so'm")
CHANNEL_ID: str = os.getenv("CHANNEL_ID", "").strip()

_raw_db = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/pubg.db")
if _raw_db.startswith("postgres://"):
    _raw_db = _raw_db.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw_db.startswith("postgresql://"):
    _raw_db = _raw_db.replace("postgresql://", "postgresql+asyncpg://", 1)
DATABASE_URL: str = _raw_db

if DATABASE_URL.startswith("sqlite"):
    os.makedirs("data", exist_ok=True)


def is_admin(user_id: int | None) -> bool:
    return user_id is not None and int(user_id) in ADMIN_IDS


def assert_config() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN environment o'zgaruvchisi yo'q. Railway > Variables ga qo'shing.")
