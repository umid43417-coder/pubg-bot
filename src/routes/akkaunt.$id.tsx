import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChatThread } from "@/components/ChatThread";
import { fetchAccount, formatPrice, signMedia, SPEC_FIELDS } from "@/lib/accounts";
import { fetchAdminTelegram } from "@/lib/settings";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { filledFields, filledSections, formatValue, type AccountDetails } from "@/lib/pubg-spec";

export const Route = createFileRoute("/akkaunt/$id")({
  head: () => ({
    meta: [
      { title: "Akkaunt tafsilotlari — PUBG Market" },
      {
        name: "description",
        content:
          "PUBG akkaunt e'loni: rasm va videolar, LVL, skinlar, dostijeniya, narx va sotuvchi bilan aloqa.",
      },
      { property: "og:title", content: "Akkaunt tafsilotlari — PUBG Market" },
      { property: "og:description", content: "Akkaunt statistikasi, media va narxi." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { data: account, isLoading } = useQuery({
    queryKey: ["account", id],
    queryFn: () => fetchAccount(id),
  });
  const { data: media } = useQuery({
    queryKey: ["account-media", id],
    queryFn: () => signMedia([...(account?.images ?? []), ...(account?.videos ?? [])]),
    enabled: !!account,
    staleTime: 60 * 60 * 1000,
  });
  const { data: adminTelegram } = useQuery({
    queryKey: ["admin-telegram"],
    queryFn: fetchAdminTelegram,
    staleTime: 10 * 60 * 1000,
  });

  const imageCount = account?.images.length ?? 0;
  const imageUrls = (media ?? []).slice(0, imageCount);
  const videoUrls = (media ?? []).slice(imageCount);

  return (
    <AppShell>
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-2">
        <Link to="/">
          <ArrowLeft className="size-4" /> {t("back_to_shop")}
        </Link>
      </Button>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !account ? (
        <div className="panel p-10 text-center text-muted-foreground">{t("not_found")}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            {imageUrls.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`${account.title} — ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="w-full rounded-xl border border-border object-cover"
              />
            ))}
            {videoUrls.map((url) => (
              <video
                key={url}
                src={url}
                controls
                className="w-full rounded-xl border border-border"
              />
            ))}
            {imageUrls.length + videoUrls.length === 0 ? (
              <div className="panel grid h-64 place-items-center text-muted-foreground">
                {t("no_media")}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="panel space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                {account.sold ? <Badge variant="destructive">{t("sold")}</Badge> : null}
                {account.level ? <Badge variant="secondary">LVL {account.level}</Badge> : null}
              </div>
              <h1 className="text-2xl font-bold">{account.title}</h1>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(account.price, account.currency)}
              </p>
              {account.description ? (
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {account.description}
                </p>
              ) : null}
            </div>

            <div className="panel divide-y divide-border p-1">
              {SPEC_FIELDS.map(({ key, icon, label }) => {
                const value = account[key];
                if (!value) return null;
                return (
                  <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {icon} {label}
                    </span>
                    <span className="text-sm font-bold">{String(value)}</span>
                  </div>
                );
              })}
            </div>

            <PubgDetails details={(account as { details?: AccountDetails }).details ?? null} />

            <div className="panel space-y-3 p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-accent">
                <ShieldCheck className="size-4" /> {t("buy_via_admin")}
              </p>
              <p className="text-sm text-muted-foreground">{t("escrow_text")}</p>
              <Button asChild className="w-full font-bold">
                <a
                  href={`https://t.me/${adminTelegram ?? "admin"}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send className="mr-2 size-4" /> {t("contact_admin")}
                </a>
              </Button>
              {account.contact ? (
                <p className="text-center text-xs text-muted-foreground">
                  {t("seller")}: {account.contact}
                </p>
              ) : null}
            </div>

            <ChatThread accountId={account.id} sellerId={account.user_id} />
          </div>
        </div>
      )}
    </AppShell>
  );
}

/** To'liq PUBG ma'lumotlari — ixcham, mobil uchun ochiladigan bo'limlar. */
function PubgDetails({ details }: { details?: AccountDetails | null }) {
  const sections = filledSections(details ?? {});
  if (!sections.length) return null;

  return (
    <div className="panel space-y-2 p-3">
      <h2 className="px-1 text-sm font-bold">🎮 To'liq ma'lumotlar</h2>
      {sections.map((section) => {
        const items = filledFields(section, details ?? {});
        return (
          <details key={section.id} className="rounded-xl border border-border/70 bg-card/40 px-3 py-2">
            <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm font-bold">
              <span className="min-w-0 truncate">
                {section.icon} {section.title}
              </span>
              <Badge className="shrink-0">{items.length}</Badge>
            </summary>
            <dl className="mt-2 divide-y divide-border/60">
              {items.map(({ field, value }) => (
                <div
                  key={field.key}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2"
                >
                  <dt className="min-w-0 truncate text-xs text-muted-foreground">
                    {field.icon} {field.label}
                  </dt>
                  <dd className="shrink-0 text-xs font-bold">{formatValue(field, value)}</dd>
                </div>
              ))}
            </dl>
          </details>
        );
      })}
    </div>
  );
}
