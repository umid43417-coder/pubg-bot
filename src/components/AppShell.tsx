import { Link, useRouter } from "@tanstack/react-router";
import { Crosshair, LogOut, Plus, Shield, Store, User } from "lucide-react";
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
    ...(isAdmin ? [{ to: "/admin", label: t("nav_admin"), icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen pb-24">
      <GamerBackdrop />
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-grad-hero text-primary-foreground">
              <Crosshair className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-widest">
              PUBG<span className="text-grad">MARKET</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="size-4" /> {t("sign_out")}
              </Button>
            ) : (
              <Button asChild size="sm" className="font-semibold">
                <Link to="/auth">{t("sign_in")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-xl">
        <div
          className="mx-auto grid max-w-5xl"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-3 text-xs font-semibold text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
