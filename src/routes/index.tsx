import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Headphones, Search, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AccountCard } from "@/components/AccountCard";
import { fetchAccounts } from "@/lib/accounts";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import heroImg from "@/assets/hero.jpg";
import { BulletTracers, FloatingGun, SpinningCrosshair } from "@/components/GameFX";
import { BattleScene } from "@/components/BattleScene";

type SortKey = "new" | "cheap" | "expensive" | "level";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PUBG Market — akkaunt sotib olish va sotish" },
      {
        name: "description",
        content:
          "PUBG Mobile akkauntlari bozori: rasm va video bilan e'lon joylang, narx va tavsifni ko'ring, xarid admin kafolati ostida.",
      },
      { property: "og:title", content: "PUBG Market — akkaunt magazin" },
      {
        property: "og:description",
        content: "PUBG akkauntlarini xavfsiz sotib oling va soting. Admin o'rtada turadi.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts });
  const [q, setQ] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [hideSold, setHideSold] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const minPrice = min ? Number(min) : null;
    const maxPrice = max ? Number(max) : null;
    const filtered = (data ?? []).filter((a) => {
      if (hideSold && a.sold) return false;
      if (minPrice !== null && a.price < minPrice) return false;
      if (maxPrice !== null && a.price > maxPrice) return false;
      if (!needle) return true;
      return `${a.title} ${a.description ?? ""} ${a.extra ?? ""}`.toLowerCase().includes(needle);
    });
    const sorted = [...filtered];
    if (sort === "cheap") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "expensive") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "level") sorted.sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
    return sorted;
  }, [data, q, min, max, sort, hideSold]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "new", label: t("sort_new") },
    { key: "cheap", label: t("sort_cheap") },
    { key: "expensive", label: t("sort_expensive") },
    { key: "level", label: t("sort_level") },
  ];

  return (
    <AppShell>
      <section className="panel-neon relative mb-6 overflow-hidden">
        <img
          src={heroImg}
          alt="PUBG jangchi silueti"
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover opacity-40 fx-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <BulletTracers />
        <BattleScene />
        <FloatingGun className="absolute -right-6 top-4 z-10 hidden sm:block" />
        <div className="relative space-y-3 p-6 pb-40 text-center sm:p-10 sm:pb-52">
          <p className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            <Flame className="fx-blink size-4" /> Inferno Market
          </p>
          <h1 className="font-display text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl">
            XUSH KELIBSIZ!
          </h1>
          <p className="font-display text-lg font-black uppercase tracking-[0.12em] text-neon sm:text-2xl">
            PUBG INFERNO MARKET
          </p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            PUBG akkauntlarini <span className="text-primary">xavfsiz</span> va{" "}
            <span className="text-primary">ishonchli</span> tarzda xarid qiling va soting!
          </p>
          <Button
            asChild
            size="lg"
            className="h-14 w-full max-w-md font-display text-lg font-black uppercase tracking-[0.2em] glow-red"
          >
            <Link to="/sotish">
              <Sparkles className="mr-2 size-5" /> Boshlash
            </Link>
          </Button>
          <div className="mx-auto grid max-w-md grid-cols-3 gap-2 pt-2">
            {[
              { icon: ShieldCheck, t: "100% XAVFSIZ", d: "Hisobingiz biz uchun muhim" },
              { icon: Flame, t: "ENG YAXSHI NARX", d: "Bozordagi eng arzon takliflar" },
              { icon: Headphones, t: "24/7 YORDAM", d: "Istalgan vaqtda javob beramiz" },
            ].map(({ icon: Icon, t: title, d }) => (
              <div key={title} className="rounded-xl border border-border/70 bg-card/70 p-3">
                <Icon className="mx-auto size-6 text-primary" />
                <p className="mt-2 text-[10px] font-black uppercase tracking-wider">{title}</p>
                <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel mb-6 space-y-4 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_ph")}
            aria-label={t("search_ph")}
            className="pl-9"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="min">{t("price_from")}</Label>
            <Input
              id="min"
              type="number"
              min="0"
              inputMode="numeric"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max">{t("price_to")}</Label>
            <Input
              id="max"
              type="number"
              min="0"
              inputMode="numeric"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="5000000"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("sort_label")}
          </span>
          {sortOptions.map((o) => (
            <Button
              key={o.key}
              size="sm"
              variant={sort === o.key ? "default" : "outline"}
              onClick={() => setSort(o.key)}
            >
              {o.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={hideSold ? "default" : "outline"}
            onClick={() => setHideSold((v) => !v)}
          >
            {t("hide_sold")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setQ("");
              setMin("");
              setMax("");
              setSort("new");
              setHideSold(false);
            }}
          >
            {t("reset_filters")}
          </Button>
        </div>
      </section>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-bold">{t("listings_title")}</h2>
        <span className="text-sm text-muted-foreground">
          {list.length} {t("listings_count")}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
      ) : (
        <div className="panel p-10 text-center text-muted-foreground">
          {(data?.length ?? 0) > 0 ? t("no_results") : t("no_listings")}
        </div>
      )}
    </AppShell>
  );
}
