import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlayCircle, ImageOff } from "lucide-react";
import { formatPrice, signMedia, type GameAccount } from "@/lib/accounts";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

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
      className="panel group overflow-hidden border-primary/20 transition-all hover:border-primary/60 hover:shadow-glow"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {data?.[0] ? (
          <img
            src={data[0]}
            alt={account.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-background/95 to-transparent p-3">
          {account.level ? <Badge variant="secondary">LVL {account.level}</Badge> : null}
          {account.videos.length > 0 ? (
            <Badge variant="secondary" className="gap-1">
              <PlayCircle className="size-3" /> {t("video")}
            </Badge>
          ) : null}
          {account.sold ? <Badge variant="destructive">{t("sold")}</Badge> : null}
        </div>
      </div>
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-1 font-display text-sm font-black uppercase tracking-wide">
          {account.title}
        </h3>
        <p className="font-display text-lg font-black text-neon">
          {formatPrice(account.price, account.currency)}
        </p>
      </div>
    </Link>
  );
}
