import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Shield, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { AccountCard } from "@/components/AccountCard";
import { BotSettingsPanel } from "@/components/BotSettingsPanel";
import { fetchAccounts } from "@/lib/accounts";
import { fetchAdminTelegram, saveAdminTelegram } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyAdminPin } from "@/lib/admin-pin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — PUBG Market" },
      {
        name: "description",
        content:
          "PUBG Market admin paneli: barcha e'lonlarni boshqarish, sotilgan deb belgilash yoki o'chirish.",
      },
      { property: "og:title", content: "Admin panel — PUBG Market" },
      { property: "og:description", content: "Barcha akkaunt e'lonlarini boshqarish paneli." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useSession();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  const { data } = useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts });
  const all = data ?? [];

  const [tg, setTg] = useState("");
  const { data: adminTelegram } = useQuery({
    queryKey: ["admin-telegram"],
    queryFn: fetchAdminTelegram,
  });

  useEffect(() => {
    if (adminTelegram) setTg(adminTelegram);
  }, [adminTelegram]);

  const saveTg = useMutation({
    mutationFn: (value: string) => saveAdminTelegram(value),
    onSuccess: () => {
      toast.success(t("saved"));
      queryClient.invalidateQueries({ queryKey: ["admin-telegram"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("deleted"));
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleSold = useMutation({
    mutationFn: async ({ id, sold }: { id: string; sold: boolean }) => {
      const { error } = await supabase.from("accounts").update({ sold }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const [pinOk, setPinOk] = useState(false);
  const [pin, setPin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("pubgmarket:admin_pin") === "1") {
      setPinOk(true);
    }
  }, []);

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    const res = await verifyAdminPin({ data: { pin } });
    if (!res.ok) {
      toast.error("Parol noto'g'ri");
      return;
    }
    sessionStorage.setItem("pubgmarket:admin_pin", "1");
    setPinOk(true);
  }

  if (!roleLoading && user && !isAdmin) {
    return (
      <AppShell>
        <div className="panel p-10 text-center text-muted-foreground">{t("admin_only")}</div>
      </AppShell>
    );
  }

  if (user && isAdmin && !pinOk) {
    return (
      <AppShell>
        <form onSubmit={submitPin} className="panel mx-auto max-w-sm space-y-4 p-6">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <Shield className="size-5 text-primary" /> Admin parol
          </h1>
          <p className="text-sm text-muted-foreground">
            Panelga kirish uchun admin parolini kiriting.
          </p>
          <Input
            type="password"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••"
            required
          />
          <Button type="submit" className="w-full font-bold">
            Kirish
          </Button>
        </form>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
        <Shield className="size-6 text-primary" /> {t("admin_panel")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("admin_text")}</p>

      <section className="panel mb-6 space-y-3 p-5">
        <h2 className="text-base font-bold">{t("settings_section")}</h2>
        <Label htmlFor="admin_tg">{t("admin_telegram_label")}</Label>
        <div className="flex gap-2">
          <Input
            id="admin_tg"
            value={tg}
            onChange={(e) => setTg(e.target.value)}
            placeholder="@username"
          />
          <Button disabled={saveTg.isPending} onClick={() => saveTg.mutate(tg)}>
            {t("save")}
          </Button>
        </div>
      </section>

      <BotSettingsPanel />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t("total_listings")}
          </p>
          <p className="text-2xl font-bold">{all.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("active")}</p>
          <p className="text-2xl font-bold text-primary">{all.filter((a) => !a.sold).length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("sold")}</p>
          <p className="text-2xl font-bold text-accent">{all.filter((a) => a.sold).length}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((a) => (
          <div key={a.id} className="space-y-2">
            <AccountCard account={a} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
                onClick={() => toggleSold.mutate({ id: a.id, sold: !a.sold })}
              >
                <CheckCircle2 className="size-4" />
                {a.sold ? t("back_to_sale") : t("mark_sold")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => remove.mutate(a.id)}
                aria-label={t("delete")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
