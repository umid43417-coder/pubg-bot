"""Klaviaturalar."""
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from . import config


def main_menu(is_admin_user: bool = False) -> ReplyKeyboardMarkup:
    rows: list[list[KeyboardButton]] = []
    # Mini App tugmasi faqat https domen mavjud bo'lsa qo'shiladi (aks holda Telegram xato beradi)
    if config.WEBAPP_URL.startswith("https://"):
        rows.append([KeyboardButton(text="🛒 Magazin", web_app=WebAppInfo(url=config.WEBAPP_URL))])
    rows += [
        [KeyboardButton(text="➕ Akkaunt sotish"), KeyboardButton(text="📦 Mening e'lonlarim")],
        [KeyboardButton(text="ℹ️ Yordam")],
    ]
    if is_admin_user:
        rows.append([KeyboardButton(text="🛠 Admin panel")])
    return ReplyKeyboardMarkup(keyboard=rows, resize_keyboard=True)


def cancel_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="❌ Bekor qilish")]], resize_keyboard=True)


def skip_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="⏭ O'tkazib yuborish")], [KeyboardButton(text="❌ Bekor qilish")]],
        resize_keyboard=True,
    )


def photos_done_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="✅ Tayyor")], [KeyboardButton(text="❌ Bekor qilish")]],
        resize_keyboard=True,
    )


def moderation_kb(listing_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Tasdiqlash", callback_data=f"mod:approve:{listing_id}"),
                InlineKeyboardButton(text="❌ Rad etish", callback_data=f"mod:reject:{listing_id}"),
            ]
        ]
    )


def my_listing_kb(listing_id: int, status: str) -> InlineKeyboardMarkup:
    rows = []
    if status == "active":
        rows.append([InlineKeyboardButton(text="💰 Sotildi deb belgilash", callback_data=f"own:sold:{listing_id}")])
    rows.append([InlineKeyboardButton(text="🗑 O'chirish", callback_data=f"own:del:{listing_id}")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def deal_admin_kb(deal_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🤝 Kelishuvni boshlash", callback_data=f"deal:start:{deal_id}"),
                InlineKeyboardButton(text="✅ Yakunlash", callback_data=f"deal:done:{deal_id}"),
            ],
            [InlineKeyboardButton(text="🚫 Bekor qilish", callback_data=f"deal:cancel:{deal_id}")],
        ]
    )


def admin_panel_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="📊 Statistika", callback_data="adm:stats")],
            [InlineKeyboardButton(text="🕓 Kutilayotgan e'lonlar", callback_data="adm:pending")],
            [InlineKeyboardButton(text="📣 Broadcast", callback_data="adm:broadcast")],
        ]
    )
