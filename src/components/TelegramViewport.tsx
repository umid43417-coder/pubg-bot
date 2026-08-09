import { useEffect } from "react";

type TgWebApp = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  viewportStableHeight?: number;
  viewportHeight?: number;
  onEvent?: (e: string, cb: () => void) => void;
  initData?: string;
  initDataUnsafe?: { user?: { id: number; first_name?: string; username?: string } };
};

export function tgWebApp(): TgWebApp | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp ?? null;
}

/**
 * Telegram Mini App'da balandlikni barqarorlashtiradi ("kaltirash" muammosi)
 * va sahifani to'liq ekranga ochadi.
 */
export function TelegramViewport() {
  useEffect(() => {
    const apply = () => {
      const app = tgWebApp();
      const h = app?.viewportStableHeight || app?.viewportHeight || window.innerHeight;
      document.documentElement.style.setProperty("--tg-vh", `${h}px`);
    };

    const app = tgWebApp();
    if (app) {
      app.ready();
      app.expand();
      app.disableVerticalSwipes?.();
      app.setHeaderColor?.("#0b0f1a");
      app.setBackgroundColor?.("#0b0f1a");
      app.onEvent?.("viewportChanged", apply);
      document.documentElement.classList.add("in-telegram");
    }
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  return null;
}
