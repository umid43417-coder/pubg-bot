import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ImageOff, PlayCircle, ShieldCheck } from "lucide-react";
import { formatPrice, signMedia, type GameAccount } from "@/lib/accounts";
import { useI18n } from "@/lib/i18n";

export function AccountCard({ account }: { account: GameAccount }) {
  const { t } = useI18n();
  const cover = account.images[0];
  const { data } = useQuery({
    queryKey: ["media", cover],
    queryFn: () => signMedia([cover!]),
    enabled: !!cover,
    staleTime: 60 * 60 * 1000,
  });

  return (
    <Link
      to="/akkaunt/$id"
      params={{ id: account.id }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card/70 transition-all hover:border-primary/60 hover:shadow-glow"
    >
      <div className="flex gap-3 p-3">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-primary/30 bg-muted">
          {data?.[0] ? (
            <img
              src={data[0]}
              alt={account.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <ImageOff className="size-7" />
            </div>
          )}
          <span className="absolute bottom-1 left-1 rounded border border-primary/60 bg-background/80 px-1.5 py-0.5 font-display text-[9px] font-black tracking-widest text-primary">
            PUBG
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              #{account.id.slice(0, 6).toUpperCase()}
            </p>
            {account.sold ? (
              <span className="rounded-md border border-destructive/60 bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                {t("sold")}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="size-3" /> Kafolat
              </span>
            )}
          </div>

          <h3 className="mt-0.5 line-clamp-1 font-display text-sm font-black uppercase tracking-wide">
            {account.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted-foreground">
            {account.level ? (
              <span className="flex items-center gap-1">
                <span
                  className="grid size-5 place-items-center bg-primary/20 text-[9px] font-black text-primary"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  {account.level}
                </span>
                LVL
              </span>
            ) : null}
            {account.videos.length > 0 ? (
              <span className="flex items-center gap-1 text-primary">
                <PlayCircle className="size-3.5" /> {t("video")}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2">
            <span className="font-display text-lg font-black text-neon">
              {formatPrice(account.price, account.currency)}
            </span>
            <ChevronRight className="size-5 text-primary" />
          </div>
        </div>
      </div>
    </Link>
  );
}
