"""Admin handlerlari: moderatsiya, statistika, broadcast, kelishuvlar."""
from __future__ import annotations

import asyncio

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from sqlalchemy import func, select

from .config import CHANNEL_ID, is_admin
from .db import Deal, Listing, SessionLocal, User
from .keyboards import admin_panel_kb, cancel_kb, main_menu, moderation_kb

router = Router()


class Broadcast(StatesGroup):
    text = State()


class Reject(StatesGroup):
    reason = State()


def _caption(listing: Listing) -> str:
    from .handlers import listing_caption

    return listing_caption(listing)


@router.message(Command("admin"))
@router.message(F.text == "🛠 Admin panel")
async def admin_panel(message: Message):
    if not is_admin(message.from_user.id):
        return
    await message.answer("🛠 <b>Admin panel</b>", reply_markup=admin_panel_kb())


@router.callback_query(F.data == "adm:stats")
async def adm_stats(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return
    async with SessionLocal() as session:
        users = (await session.execute(select(func.count(User.id)))).scalar() or 0
        total = (await session.execute(select(func.count(Listing.id)))).scalar() or 0
        pending = (await session.execute(select(func.count(Listing.id)).where(Listing.status == "pending"))).scalar() or 0
        active = (await session.execute(select(func.count(Listing.id)).where(Listing.status == "active"))).scalar() or 0
        sold = (await session.execute(select(func.count(Listing.id)).where(Listing.status == "sold"))).scalar() or 0
        deals = (await session.execute(select(func.count(Deal.id)))).scalar() or 0
    await call.message.answer(
        "📊 <b>Statistika</b>\n\n"
        f"👥 Foydalanuvchilar: <b>{users}</b>\n"
        f"📦 Jami e'lonlar: <b>{total}</b>\n"
        f"🕓 Tekshiruvda: <b>{pending}</b>\n"
        f"🟢 Sotuvda: <b>{active}</b>\n"
        f"🔴 Sotilgan: <b>{sold}</b>\n"
        f"🤝 Kelishuvlar: <b>{deals}</b>"
    )
    await call.answer()


@router.callback_query(F.data == "adm:pending")
async def adm_pending(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        return
    async with SessionLocal() as session:
        res = await session.execute(select(Listing).where(Listing.status == "pending").order_by(Listing.id).limit(10))
        items = list(res.scalars())
    if not items:
        await call.answer("Kutilayotgan e'lon yo'q.", show_alert=True)
        return
    for item in items:
        text = _caption(item)
        if item.photo_list:
            await call.message.answer_photo(item.photo_list[0], caption=text, reply_markup=moderation_kb(item.id))
        else:
            await call.message.answer(text, reply_markup=moderation_kb(item.id))
    await call.answer()


@router.callback_query(F.data.startswith("mod:"))
async def moderate(call: CallbackQuery, state: FSMContext):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q.", show_alert=True)
        return
    _, action, raw_id = call.data.split(":")
    listing_id = int(raw_id)

    async with SessionLocal() as session:
        listing = await session.get(Listing, listing_id)
        if not listing:
            await call.answer("E'lon topilmadi.", show_alert=True)
            return
        if action == "approve":
            listing.status = "active"
            await session.commit()
            seller_id = listing.seller_id
            title = listing.title
            caption = _caption(listing)
            photo = listing.photo_list[0] if listing.photo_list else None
        else:
            listing.status = "rejected"
            await session.commit()
            seller_id = listing.seller_id
            title = listing.title
            caption = photo = None

    try:
        await call.message.edit_reply_markup(reply_markup=None)
    except Exception:  # noqa: BLE001
        pass

    if action == "approve":
        await call.answer("✅ Tasdiqlandi")
        try:
            await call.bot.send_message(seller_id, f"✅ «{title}» e'loningiz tasdiqlandi va magazinda paydo bo'ldi!")
        except Exception:  # noqa: BLE001
            pass
        if CHANNEL_ID:
            try:
                if photo:
                    await call.bot.send_photo(CHANNEL_ID, photo, caption=caption)
                else:
                    await call.bot.send_message(CHANNEL_ID, caption or title)
            except Exception:  # noqa: BLE001
                pass
    else:
        await call.answer("❌ Rad etildi")
        try:
            await call.bot.send_message(seller_id, f"❌ «{title}» e'loningiz rad etildi. Qoidalarni tekshirib qayta joylang.")
        except Exception:  # noqa: BLE001
            pass


# ------------------------- KELISHUVLAR -------------------------


@router.callback_query(F.data.startswith("deal:"))
async def deal_actions(call: CallbackQuery):
    if not is_admin(call.from_user.id):
        await call.answer("Ruxsat yo'q.", show_alert=True)
        return
    _, action, raw_id = call.data.split(":")
    deal_id = int(raw_id)

    async with SessionLocal() as session:
        deal = await session.get(Deal, deal_id)
        if not deal:
            await call.answer("Topilmadi.", show_alert=True)
            return
        listing = await session.get(Listing, deal.listing_id)
        if action == "start":
            deal.status = "in_progress"
            note = "🤝 Admin kelishuvni boshladi. Tez orada siz bilan bog'lanadi."
        elif action == "done":
            deal.status = "done"
            if listing:
                listing.status = "sold"
            note = "✅ Kelishuv muvaffaqiyatli yakunlandi. Xaridingiz bilan tabriklaymiz!"
        else:
            deal.status = "cancelled"
            note = "🚫 Kelishuv bekor qilindi."
        await session.commit()
        buyer_id, seller_id = deal.buyer_id, (listing.seller_id if listing else None)

    for uid in {buyer_id, seller_id}:
        if uid:
            try:
                await call.bot.send_message(uid, note)
            except Exception:  # noqa: BLE001
                pass
    await call.answer("Bajarildi")


# ------------------------- BROADCAST -------------------------


@router.callback_query(F.data == "adm:broadcast")
async def adm_broadcast(call: CallbackQuery, state: FSMContext):
    if not is_admin(call.from_user.id):
        return
    await state.set_state(Broadcast.text)
    await call.message.answer("📣 Yuboriladigan xabar matnini kiriting:", reply_markup=cancel_kb())
    await call.answer()


@router.message(Broadcast.text, F.text)
async def do_broadcast(message: Message, state: FSMContext):
    await state.clear()
    async with SessionLocal() as session:
        ids = list((await session.execute(select(User.id).where(User.is_banned.is_(False)))).scalars())

    sent = failed = 0
    for uid in ids:
        try:
            await message.bot.send_message(uid, message.text)
            sent += 1
        except Exception:  # noqa: BLE001
            failed += 1
        await asyncio.sleep(0.05)

    await message.answer(
        f"📣 Yuborildi: <b>{sent}</b>, xato: <b>{failed}</b>", reply_markup=main_menu(True)
    )


# ------------------------- BAN / UNBAN -------------------------


@router.message(Command("ban"))
async def ban_user(message: Message):
    if not is_admin(message.from_user.id):
        return
    parts = (message.text or "").split()
    if len(parts) < 2 or not parts[1].lstrip("-").isdigit():
        await message.answer("Foydalanish: <code>/ban 123456789</code>")
        return
    async with SessionLocal() as session:
        user = await session.get(User, int(parts[1]))
        if not user:
            await message.answer("Foydalanuvchi topilmadi.")
            return
        user.is_banned = True
        await session.commit()
    await message.answer("⛔️ Bloklandi.")


@router.message(Command("unban"))
async def unban_user(message: Message):
    if not is_admin(message.from_user.id):
        return
    parts = (message.text or "").split()
    if len(parts) < 2 or not parts[1].lstrip("-").isdigit():
        await message.answer("Foydalanish: <code>/unban 123456789</code>")
        return
    async with SessionLocal() as session:
        user = await session.get(User, int(parts[1]))
        if not user:
            await message.answer("Foydalanuvchi topilmadi.")
            return
        user.is_banned = False
        await session.commit()
    await message.answer("✅ Blokdan chiqarildi.")
