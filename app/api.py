"""Mini App uchun REST API (FastAPI)."""
from __future__ import annotations

import io

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select

from .config import ADMIN_IDS, BOT_TOKEN, CURRENCY
from .db import Deal, Listing, SessionLocal, User
from .keyboards import deal_admin_kb
from .webapp_auth import user_from_init_data

router = APIRouter(prefix="/api")


def _auth(init_data: str | None) -> dict:
    user = user_from_init_data(init_data or "", BOT_TOKEN)
    if not user:
        raise HTTPException(status_code=401, detail="Telegram imzosi noto'g'ri")
    return user


class BuyRequest(BaseModel):
    listing_id: int = Field(gt=0)


@router.get("/config")
async def api_config():
    return {"currency": CURRENCY}


@router.get("/listings")
async def api_listings(
    q: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    sort: str = Query("new", pattern="^(new|cheap|expensive|level)$"),
    hide_sold: bool = False,
):
    async with SessionLocal() as session:
        stmt = select(Listing).where(Listing.status.in_(["active", "sold"]))
        if hide_sold:
            stmt = stmt.where(Listing.status == "active")
        if min_price is not None:
            stmt = stmt.where(Listing.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Listing.price <= max_price)
        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(Listing.title.ilike(like) | Listing.description.ilike(like))
        if sort == "cheap":
            stmt = stmt.order_by(Listing.price.asc())
        elif sort == "expensive":
            stmt = stmt.order_by(Listing.price.desc())
        elif sort == "level":
            stmt = stmt.order_by(Listing.level.desc())
        else:
            stmt = stmt.order_by(Listing.id.desc())

        items = list((await session.execute(stmt.limit(200))).scalars())
        return {"items": [i.as_dict() for i in items]}


@router.get("/listings/{listing_id}")
async def api_listing(listing_id: int):
    async with SessionLocal() as session:
        listing = await session.get(Listing, listing_id)
        if not listing or listing.status not in ("active", "sold"):
            raise HTTPException(404, "E'lon topilmadi")
        listing.views += 1
        await session.commit()
        return listing.as_dict()


@router.get("/my")
async def api_my(x_init_data: str | None = Header(default=None, alias="X-Init-Data")):
    user = _auth(x_init_data)
    async with SessionLocal() as session:
        items = list(
            (
                await session.execute(
                    select(Listing).where(Listing.seller_id == int(user["id"])).order_by(Listing.id.desc())
                )
            ).scalars()
        )
        return {"items": [i.as_dict() for i in items], "is_admin": int(user["id"]) in ADMIN_IDS}


@router.post("/buy")
async def api_buy(payload: BuyRequest, x_init_data: str | None = Header(default=None, alias="X-Init-Data")):
    tg_user = _auth(x_init_data)
    buyer_id = int(tg_user["id"])

    from .bot_instance import get_bot

    async with SessionLocal() as session:
        listing = await session.get(Listing, payload.listing_id)
        if not listing or listing.status != "active":
            raise HTTPException(404, "E'lon mavjud emas yoki sotilgan")
        if listing.seller_id == buyer_id:
            raise HTTPException(400, "O'z e'loningizni sotib ololmaysiz")

        buyer = await session.get(User, buyer_id)
        if buyer is None:
            buyer = User(
                id=buyer_id,
                username=tg_user.get("username"),
                full_name=f"{tg_user.get('first_name','')} {tg_user.get('last_name','')}".strip(),
            )
            session.add(buyer)
        if buyer.is_banned:
            raise HTTPException(403, "Siz bloklangansiz")

        deal = Deal(listing_id=listing.id, buyer_id=buyer_id, status="new")
        session.add(deal)
        await session.commit()
        await session.refresh(deal)
        info = (deal.id, listing.id, listing.title, listing.price, listing.seller_id)

    deal_id, listing_id, title, price, seller_id = info
    bot = get_bot()
    uname = tg_user.get("username")
    buyer_link = f"@{uname}" if uname else f"<a href='tg://user?id={buyer_id}'>xaridor</a>"
    text = (
        "🛎 <b>Yangi sotib olish so'rovi</b>\n\n"
        f"📦 E'lon: <b>{title}</b> (#{listing_id})\n"
        f"💵 Narx: <b>{price:,}</b>".replace(",", " ") + f" {CURRENCY}\n"
        f"👤 Xaridor: {buyer_link} (<code>{buyer_id}</code>)\n"
        f"🧑‍💻 Sotuvchi: <code>{seller_id}</code>"
    )
    for admin_id in ADMIN_IDS:
        try:
            await bot.send_message(admin_id, text, reply_markup=deal_admin_kb(deal_id))
        except Exception:  # noqa: BLE001
            continue
    try:
        await bot.send_message(seller_id, f"🛎 «{title}» akkauntingizga xaridor chiqdi! Admin siz bilan bog'lanadi.")
    except Exception:  # noqa: BLE001
        pass

    return {"ok": True, "deal_id": deal_id}


@router.get("/photo/{file_id}")
async def api_photo(file_id: str):
    """Telegram file_id ni rasmga aylantirib beradi (Mini App uchun)."""
    import aiohttp  # noqa: PLC0415  (aiogram bilan birga keladi)

    async with aiohttp.ClientSession() as http:
        async with http.get(f"https://api.telegram.org/bot{BOT_TOKEN}/getFile", params={"file_id": file_id}) as resp:
            data = await resp.json()
        if not data.get("ok"):
            raise HTTPException(404, "Fayl topilmadi")
        path = data["result"]["file_path"]
        async with http.get(f"https://api.telegram.org/file/bot{BOT_TOKEN}/{path}") as file_resp:
            content = await file_resp.read()

    return StreamingResponse(
        io.BytesIO(content),
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )
