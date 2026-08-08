"""Ma'lumotlar bazasi: SQLAlchemy 2.0 async (SQLite yoki Postgres)."""
from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from .config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)  # telegram user id
    username: Mapped[Optional[str]] = mapped_column(String(64))
    full_name: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[Optional[str]] = mapped_column(String(32))
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    listings: Mapped[list["Listing"]] = relationship(back_populates="seller")


class Listing(Base):
    """PUBG akkaunt e'loni."""

    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    seller_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[int] = mapped_column(BigInteger, default=0)
    level: Mapped[int] = mapped_column(Integer, default=0)
    photos: Mapped[str] = mapped_column(Text, default="")  # telegram file_id lar, vergul bilan
    video: Mapped[Optional[str]] = mapped_column(Text)
    contact: Mapped[Optional[str]] = mapped_column(String(120))
    # pending | active | sold | rejected
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    views: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    seller: Mapped[User] = relationship(back_populates="listings")

    @property
    def photo_list(self) -> list[str]:
        return [p for p in (self.photos or "").split(",") if p]

    def as_dict(self) -> dict:
        return {
            "id": self.id,
            "seller_id": self.seller_id,
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "level": self.level,
            "photos": self.photo_list,
            "video": self.video,
            "contact": self.contact,
            "status": self.status,
            "views": self.views,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Deal(Base):
    """Sotib olish so'rovi — admin o'rtada turadi."""

    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    listing_id: Mapped[int] = mapped_column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    buyer_id: Mapped[int] = mapped_column(BigInteger, index=True)
    # new | in_progress | done | cancelled
    status: Mapped[str] = mapped_column(String(16), default="new")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_or_create_user(session: AsyncSession, tg_user) -> User:
    user = await session.get(User, tg_user.id)
    if user is None:
        user = User(
            id=tg_user.id,
            username=tg_user.username,
            full_name=(tg_user.full_name if hasattr(tg_user, "full_name") else "") or "",
        )
        session.add(user)
        await session.commit()
    else:
        changed = False
        if user.username != tg_user.username:
            user.username = tg_user.username
            changed = True
        if changed:
            await session.commit()
    return user


async def active_listings(session: AsyncSession) -> list[Listing]:
    res = await session.execute(select(Listing).where(Listing.status.in_(["active", "sold"])).order_by(Listing.id.desc()))
    return list(res.scalars())
