import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { AppShell, PageTitle } from "@/components/AppShell";
import { AccountCard } from "@/components/AccountCard";
import { fetchAccounts } from "@/lib/accounts";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mening")({
  head: () => ({
    meta: [
      { title: "Mening e'lonlarim — PUBG Market" },
      {
        name: "description",
        content: "O'zingiz joylagan PUBG akkaunt e'lonlarini boshqaring: sotilgan deb belgilang yoki o'chiring.",
      },
      { property: "og:title", content: "Mening e'lonlarim — PUBG Market" },
      { property: "og:description", content: "E'lonlaringizni boshqarish paneli." },
    ],
  }),
  component: MyPage,
});

function MyPage() {
  const { user, loading } = useSession();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  const { data } = useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts });
  const mine = (data ?? []).filter((a) => a.user_id === user?.id);

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

  return (
    <AppShell>
      <PageTitle accent="MENING" rest={t("my_listings")} />
      {mine.length === 0 ? (
        <div className="panel space-y-4 p-10 text-center">
          <p className="text-muted-foreground">{t("no_my_listings")}</p>
          <Button asChild className="font-bold">
            <Link to="/sotish">{t("post_listing")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((a) => (
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
      )}
    </AppShell>
  );
}
