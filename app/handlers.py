"""Foydalanuvchi handlerlari: /start, e'lon joylash (FSM), mening e'lonlarim."""
from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InputMediaPhoto, Message

from .config import ADMIN_IDS, CURRENCY, is_admin
from .db import Listing, SessionLocal, get_or_create_user
from .keyboards import (
    cancel_kb,
    main_menu,
    moderation_kb,
    my_listing_kb,
    photos_done_kb,
    skip_kb,
)
from .texts import HELP_TEXT, WELCOME

router = Router()

MAX_PHOTOS = 6


class Sell(StatesGroup):
    title = State()
    level = State()
    price = State()
    description = State()
    photos = State()
    video = State()
    contact = State()


def fmt_price(value: int) -> str:
    return f"{value:,}".replace(",", " ") + f" {CURRENCY}"


def listing_caption(listing: Listing, seller_username: str | None = None) -> str:
    lines = [
        f"🎮 <b>{listing.title}</b>",
        f"🏅 Daraja (LVL): <b>{listing.level or '—'}</b>",
        f"💵 Narx: <b>{fmt_price(listing.price)}</b>",
    ]
    if listing.description:
        lines.append(f"\n📝 {listing.description}")
    if listing.contact:
        lines.append(f"\n📞 Aloqa: {listing.contact}")
    if seller_username:
        lines.append(f"👤 Sotuvchi: @{seller_username}")
    status_map = {"pending": "🕓 Tekshiruvda", "active": "🟢 Sotuvda", "sold": "🔴 Sotilgan", "rejected": "⛔️ Rad etilgan"}
    lines.append(f"\nHolat: {status_map.get(listing.status, listing.status)}  •  ID: #{listing.id}")
    return "\n".join(lines)


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    async with SessionLocal() as session:
        await get_or_create_user(session, message.from_user)
    await message.answer(WELCOME, reply_markup=main_menu(is_admin(message.from_user.id)))


@router.message(Command("help"))
@router.message(F.text == "ℹ️ Yordam")
async def cmd_help(message: Message):
    await message.answer(HELP_TEXT)


@router.message(F.text == "❌ Bekor qilish")
async def cancel_any(message: Message, state: FSMContext):
    await state.clear()
    await message.answer("Bekor qilindi.", reply_markup=main_menu(is_admin(message.from_user.id)))


# ------------------------- E'LON JOYLASH (FSM) -------------------------


@router.message(Command("sell"))
@router.message(F.text == "➕ Akkaunt sotish")
async def sell_start(message: Message, state: FSMContext):
    async with SessionLocal() as session:
        user = await get_or_create_user(session, message.from_user)
        if user.is_banned:
            await message.answer("⛔️ Siz bloklangansiz.")
            return
    await state.set_state(Sell.title)
    await message.answer(
        "1/7 — Akkaunt sarlavhasi (masalan: <i>Conqueror akkaunt, M416 Glacier</i>):",
        reply_markup=cancel_kb(),
    )


@router.message(Sell.title, F.text)
async def sell_title(message: Message, state: FSMContext):
    title = message.text.strip()
    if len(title) < 3 or len(title) > 120:
        await message.answer("Sarlavha 3–120 belgidan iborat bo'lsin.")
        return
    await state.update_data(title=title)
    await state.set_state(Sell.level)
    await message.answer("2/7 — Akkaunt darajasi (LVL), faqat raqam:")


@router.message(Sell.level, F.text)
async def sell_level(message: Message, state: FSMContext):
    raw = message.text.strip()
    if not raw.isdigit() or not (1 <= int(raw) <= 100):
        await message.answer("1 dan 100 gacha raqam kiriting.")
        return
    await state.update_data(level=int(raw))
    await state.set_state(Sell.price)
    await message.answer(f"3/7 — Narxi ({CURRENCY}), faqat raqam:")


@router.message(Sell.price, F.text)
async def sell_price(message: Message, state: FSMContext):
    raw = message.text.replace(" ", "").replace(".", "")
    if not raw.isdigit() or int(raw) <= 0:
        await message.answer("Narxni raqamda kiriting. Masalan: 350000")
        return
    await state.update_data(price=int(raw))
    await state.set_state(Sell.description)
    await message.answer("4/7 — Tavsif: skinlar, UC, bog'langan pochta va h.k.", reply_markup=skip_kb())


@router.message(Sell.description, F.text)
async def sell_description(message: Message, state: FSMContext):
    text = "" if message.text == "⏭ O'tkazib yuborish" else message.text.strip()[:2000]
    await state.update_data(description=text, photos=[])
    await state.set_state(Sell.photos)
    await message.answer(
        f"5/7 — Akkaunt rasmlarini yuboring (1–{MAX_PHOTOS} ta). Tugatgach «✅ Tayyor» bosing.",
        reply_markup=photos_done_kb(),
    )


@router.message(Sell.photos, F.photo)
async def sell_photos(message: Message, state: FSMContext):
    data = await state.get_data()
    photos: list[str] = list(data.get("photos", []))
    if len(photos) >= MAX_PHOTOS:
        await message.answer(f"Maksimum {MAX_PHOTOS} ta rasm. «✅ Tayyor» bosing.")
        return
    photos.append(message.photo[-1].file_id)
    await state.update_data(photos=photos)
    await message.answer(f"✅ Qabul qilindi ({len(photos)}/{MAX_PHOTOS}).")


@router.message(Sell.photos, F.text == "✅ Tayyor")
async def sell_photos_done(message: Message, state: FSMContext):
    data = await state.get_data()
    if not data.get("photos"):
        await message.answer("Kamida 1 ta rasm kerak.")
        return
    await state.set_state(Sell.video)
    await message.answer("6/7 — Video yuboring (ixtiyoriy).", reply_markup=skip_kb())


@router.message(Sell.video, F.video)
async def sell_video(message: Message, state: FSMContext):
    await state.update_data(video=message.video.file_id)
    await state.set_state(Sell.contact)
    await message.answer("7/7 — Aloqa (telefon yoki @username):", reply_markup=skip_kb())


@router.message(Sell.video, F.text)
async def sell_video_skip(message: Message, state: FSMContext):
    await state.update_data(video=None)
    await state.set_state(Sell.contact)
    await message.answer("7/7 — Aloqa (telefon yoki @username):", reply_markup=skip_kb())


@router.message(Sell.contact, F.text)
async def sell_contact(message: Message, state: FSMContext):
    contact = None if message.text == "⏭ O'tkazib yuborish" else message.text.strip()[:120]
    data = await state.get_data()
    await state.clear()

    async with SessionLocal() as session:
        await get_or_create_user(session, message.from_user)
        listing = Listing(
            seller_id=message.from_user.id,
            title=data["title"],
            description=data.get("description", ""),
            price=data["price"],
            level=data.get("level", 0),
            photos=",".join(data.get("photos", [])),
            video=data.get("video"),
            contact=contact or (f"@{message.from_user.username}" if message.from_user.username else None),
            status="pending",
        )
        session.add(listing)
        await session.commit()
        await session.refresh(listing)
        caption = listing_caption(listing, message.from_user.username)
        listing_id = listing.id
        photos = listing.photo_list

    await message.answer(
        f"✅ E'loningiz qabul qilindi (#{listing_id}). Admin tasdiqlagach magazinda ko'rinadi.",
        reply_markup=main_menu(is_admin(message.from_user.id)),
    )

    # Adminlarga moderatsiya uchun yuborish
    for admin_id in ADMIN_IDS:
        try:
            if len(photos) > 1:
                await message.bot.send_media_group(
                    admin_id,
                    [InputMediaPhoto(media=p) for p in photos[:MAX_PHOTOS]],
                )
                await message.bot.send_message(admin_id, caption, reply_markup=moderation_kb(listing_id))
            elif photos:
                await message.bot.send_photo(
                    admin_id, photos[0], caption=caption, reply_markup=moderation_kb(listing_id)
                )
            else:
                await message.bot.send_message(admin_id, caption, reply_markup=moderation_kb(listing_id))
        except Exception:  # noqa: BLE001 - admin bot bilan suhbat boshlamagan bo'lishi mumkin
            continue


# ------------------------- MENING E'LONLARIM -------------------------


@router.message(Command("my"))
@router.message(F.text == "📦 Mening e'lonlarim")
async def my_listings(message: Message):
    from sqlalchemy import select

    async with SessionLocal() as session:
        res = await session.execute(
            select(Listing).where(Listing.seller_id == message.from_user.id).order_by(Listing.id.desc()).limit(20)
        )
        items = list(res.scalars())

    if not items:
        await message.answer("Sizda hali e'lon yo'q. «➕ Akkaunt sotish» tugmasini bosing.")
        return

    for item in items:
        text = listing_caption(item)
        if item.photo_list:
            await message.answer_photo(item.photo_list[0], caption=text, reply_markup=my_listing_kb(item.id, item.status))
        else:
            await message.answer(text, reply_markup=my_listing_kb(item.id, item.status))


@router.callback_query(F.data.startswith("own:"))
async def own_actions(call: CallbackQuery):
    _, action, raw_id = call.data.split(":")
    listing_id = int(raw_id)
    async with SessionLocal() as session:
        listing = await session.get(Listing, listing_id)
        if not listing or listing.seller_id != call.from_user.id:
            await call.answer("Topilmadi.", show_alert=True)
            return
        if action == "sold":
            listing.status = "sold"
            await session.commit()
            await call.answer("Sotilgan deb belgilandi.")
        elif action == "del":
            await session.delete(listing)
            await session.commit()
            await call.answer("O'chirildi.")
    try:
        await call.message.edit_reply_markup(reply_markup=None)
    except Exception:  # noqa: BLE001
        pass
