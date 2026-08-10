import { Link, useRouter } from "@tanstack/react-router";
import { Headphones, LogOut, MessageSquare, Plus, Scroll, Shield, ShieldCheck, Store, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { GamerBackdrop } from "@/components/GameFX";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  const tabs = [
    { to: "/", label: t("nav_shop"), icon: Store },
    { to: "/sotish", label: t("nav_sell"), icon: Plus },
    { to: "/mening", label: t("nav_mine"), icon: User },
    { to: "/qoidalar", label: "Qoidalar", icon: Scroll },
    ...(isAdmin ? [{ to: "/admin", label: t("nav_admin"), icon: Shield }] : []),
  ];

  return (
    <div className="app-shell pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <GamerBackdrop />
      <header className="sticky top-0 z-30 border-b border-primary/25 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-primary/70 bg-primary/10 font-display text-[10px] font-black tracking-tighter text-primary glow-red">
              PB
            </span>
            <span className="font-display text-base font-black leading-none tracking-[0.18em]">
              PUBG
              <span className="block text-[9px] font-bold tracking-[0.42em] text-primary">
                TRADE
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-2 text-muted-foreground hover:text-primary"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t("sign_out")}</span>
              </Button>
            ) : (
              <Button asChild size="sm" className="font-bold uppercase tracking-widest">
                <Link to="/auth">{t("sign_in")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-primary/25 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div
          className="mx-auto grid max-w-5xl"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group relative flex flex-col items-center gap-1 px-1 py-3 text-[10px] font-bold uppercase leading-tight tracking-wider text-muted-foreground transition-colors data-[status=active]:text-primary sm:text-[11px]"
            >
              <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary opacity-0 transition-opacity group-data-[status=active]:opacity-100" />
              <Icon className="size-5 shrink-0 transition-transform group-data-[status=active]:scale-110 group-data-[status=active]:drop-shadow-[0_0_10px_oklch(0.62_0.24_27_/_0.9)]" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Sahifa sarlavhasi — dizayndagi neon uslub. */
export function PageTitle({
  accent,
  rest,
  subtitle,
}: {
  accent: string;
  rest?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 text-center">
      <h1 className="font-display text-2xl font-black uppercase tracking-[0.06em] sm:text-3xl">
        <span className="text-neon">{accent}</span>
        {rest ? <span className="text-foreground"> {rest}</span> : null}
      </h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

/** Xavfsiz bitim bannerini ko'rsatadi (escrow dizayni). */
export function EscrowBanner({ text }: { text: string }) {
  return (
    <div className="panel-neon flex items-start gap-3 p-4">
      <ShieldCheck className="mt-0.5 size-6 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="font-display text-sm font-black uppercase tracking-widest text-primary">
          Xavfsiz bitim
        </p>
        <p className="font-display text-sm font-bold uppercase tracking-wider">
          Admin nazoratida
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/** Yordam tugmasi (dizayndagi headset ikonkasi). */
export function SupportButton({ telegram }: { telegram?: string | null }) {
  return (
    <a
      href={`https://t.me/${telegram ?? "admin"}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Qo'llab-quvvatlash"
      className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/60 bg-primary/10 text-primary transition-colors hover:bg-primary/20"
    >
      <Headphones className="size-5" />
    </a>
  );
}

export { MessageSquare };
