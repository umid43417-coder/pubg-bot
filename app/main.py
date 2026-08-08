"""Kirish nuqtasi: FastAPI (Mini App + API) + aiogram bot (webhook yoki polling).

Railway: `python -m app.main`
"""
from __future__ import annotations

import asyncio
import contextlib
import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from aiogram.types import BotCommand, MenuButtonWebApp, Update, WebAppInfo
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api import router as api_router
from .bot_instance import get_bot, get_dispatcher
from .config import (
    DATABASE_URL,
    PORT,
    USE_WEBHOOK,
    WEBAPP_URL,
    WEBHOOK_PATH,
    WEBHOOK_SECRET,
    assert_config,
)
from .db import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
log = logging.getLogger("pubg-market")

WEBAPP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "webapp")

_polling_task: asyncio.Task | None = None


async def _setup_bot() -> None:
    bot = get_bot()
    me = await bot.get_me()  # token to'g'riligini tekshiradi
    log.info("Bot ulandi: @%s (id=%s)", me.username, me.id)

    with contextlib.suppress(Exception):
        await bot.set_my_commands(
            [
                BotCommand(command="start", description="Botni ishga tushirish"),
                BotCommand(command="sell", description="Akkaunt sotish"),
                BotCommand(command="my", description="Mening e'lonlarim"),
                BotCommand(command="help", description="Yordam"),
                BotCommand(command="admin", description="Admin panel"),
            ]
        )
    if WEBAPP_URL.startswith("https://"):
        with contextlib.suppress(Exception):
            await bot.set_chat_menu_button(
                menu_button=MenuButtonWebApp(text="🛒 Magazin", web_app=WebAppInfo(url=WEBAPP_URL))
            )


async def _start_polling() -> None:
    global _polling_task
    bot, dp = get_bot(), get_dispatcher()
    with contextlib.suppress(Exception):
        await bot.delete_webhook(drop_pending_updates=True)
    _polling_task = asyncio.create_task(dp.start_polling(bot, handle_signals=False))
    log.info("Polling rejimida ishlayapti")


@asynccontextmanager
async def lifespan(app: FastAPI):
    assert_config()
    log.info("DB: %s", DATABASE_URL.split("@")[-1])
    await init_db()
    await _setup_bot()

    bot, dp = get_bot(), get_dispatcher()
    if USE_WEBHOOK:
        try:
            await bot.set_webhook(
                url=f"{WEBAPP_URL}{WEBHOOK_PATH}",
                secret_token=WEBHOOK_SECRET,
                drop_pending_updates=True,
                allowed_updates=dp.resolve_used_update_types(),
            )
            log.info("Webhook o'rnatildi: %s%s", WEBAPP_URL, WEBHOOK_PATH)
        except Exception as exc:  # noqa: BLE001 — webhook bo'lmasa ham bot ishlashi kerak
            log.error("Webhook o'rnatilmadi (%s) — polling rejimiga o'tildi", exc)
            await _start_polling()
    else:
        log.warning("WEBAPP_URL yo'q yoki USE_WEBHOOK=0 — polling ishlatiladi")
        await _start_polling()

    yield

    if _polling_task:
        _polling_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await _polling_task
    with contextlib.suppress(Exception):
        await bot.session.close()


app = FastAPI(title="PUBG Market Mini App", lifespan=lifespan, docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)


@app.post(WEBHOOK_PATH)
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    if x_telegram_bot_api_secret_token != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    update = Update.model_validate(await request.json(), context={"bot": get_bot()})
    try:
        await get_dispatcher().feed_update(get_bot(), update)
    except Exception:  # noqa: BLE001 — Telegram qayta yubormasligi uchun 200 qaytaramiz
        log.exception("Update ishlanmadi")
    return {"ok": True}


@app.get("/health")
async def health():
    return {"status": "ok"}


app.mount("/static", StaticFiles(directory=WEBAPP_DIR), name="static")


@app.get("/")
async def index():
    return FileResponse(os.path.join(WEBAPP_DIR, "index.html"))


def run() -> None:
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")


if __name__ == "__main__":
    run()
