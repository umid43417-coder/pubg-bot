"""Telegram Mini App initData imzosini tekshirish."""
from __future__ import annotations

import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl


def parse_init_data(init_data: str, bot_token: str, max_age: int = 86400) -> dict | None:
    """initData ni tekshiradi. To'g'ri bo'lsa dict qaytaradi, aks holda None."""
    if not init_data or not bot_token:
        return None
    try:
        pairs = dict(parse_qsl(init_data, strict_parsing=True))
    except ValueError:
        return None

    received_hash = pairs.pop("hash", None)
    if not received_hash:
        return None

    data_check_string = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calc_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calc_hash, received_hash):
        return None

    auth_date = int(pairs.get("auth_date", "0") or 0)
    if max_age and auth_date and time.time() - auth_date > max_age:
        return None

    user_raw = pairs.get("user")
    if user_raw:
        try:
            pairs["user"] = json.loads(user_raw)
        except json.JSONDecodeError:
            return None
    return pairs


def user_from_init_data(init_data: str, bot_token: str) -> dict | None:
    data = parse_init_data(init_data, bot_token)
    if not data:
        return None
    user = data.get("user")
    return user if isinstance(user, dict) else None
