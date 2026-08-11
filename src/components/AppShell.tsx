import { Link, useRouter } from "@tanstack/react-router";
import { Bell, Headphones, Home, LogOut, MessageSquare, Plus, Search, Shield, ShieldCheck, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { GamerBackdrop } from "@/components/GameFX";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  const left = [
    { to: "/", label: "Bosh sahifa", icon: Home, exact: true },
    { to: "/mening", label: "E'lonlarim", icon: Search, exact: false },
  ];
  const right = [
    { to: "/qoidalar", label: "Yordam", icon: Headphones, exact: false },
    ...(isAdmin
      ? [{ to: "/admin", label: "Admin", icon: Shield, exact: false }]
      : [{ to: "/auth", label: "Profil", icon: User, exact: false }]),
  ];

  return (
    <div className="app-shell pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      <GamerBackdrop />
      <header className="sticky top-0 z-30 border-b border-primary/20 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-14 shrink-0 place-items-center rounded-[6px] border-2 border-primary font-display text-[13px] font-black tracking-tighter text-primary glow-red">
              PUBG
            </span>
            <span className="font-display text-base font-black leading-none tracking-[0.16em] text-foreground">
              TRADE
              <span className="mt-1 block text-[9px] font-bold tracking-[0.5em] text-primary">
                INFERNO
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <span className="relative grid size-9 place-items-center text-primary">
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary fx-blink" />
            </span>
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                aria-label="Chiqish"
                className="text-muted-foreground hover:text-primary"
              >
                <LogOut className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-primary/20 bg-[oklch(0.08_0.01_20)]/98 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="relative mx-auto grid max-w-5xl grid-cols-5 items-end">
          {left.map((tab) => (
            <NavTab key={tab.to} {...tab} />
          ))}

          <div className="flex justify-center">
            <Link
              to="/sotish"
              aria-label="E'lon berish"
              className="relative -mt-7 flex size-16 flex-col items-center justify-center border-2 border-primary bg-[oklch(0.14_0.05_25)] text-primary glow-red transition-transform active:scale-95"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              <Plus className="size-7" strokeWidth={3} />
            </Link>
          </div>

          {right.map((tab) => (
            <NavTab key={tab.to} {...tab} />
          ))}
          <span className="pointer-events-none absolute bottom-0 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-foreground/25" />
        </div>
        <p className="pb-1 pt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.3em] text-primary/70">
          E'lon berish
        </p>
      </nav>
    </div>
  );
}

function NavTab({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  exact: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="group relative flex flex-col items-center gap-1 px-1 py-3 text-[10px] font-bold uppercase leading-tight tracking-wider text-muted-foreground transition-colors data-[status=active]:text-primary"
    >
      <Icon className="size-5 shrink-0 transition-transform group-data-[status=active]:scale-110 group-data-[status=active]:drop-shadow-[0_0_10px_oklch(0.62_0.24_27_/_0.9)]" />
      <span className="max-w-full truncate">{label}</span>
      <span className="absolute inset-x-6 bottom-1 h-0.5 rounded-full bg-primary opacity-0 transition-opacity group-data-[status=active]:opacity-100" />
    </Link>
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
      <span className="mx-auto mt-2 block h-0.5 w-24 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
      {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
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
