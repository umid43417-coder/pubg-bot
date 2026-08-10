import soldierRight from "@/assets/soldier-right.png";
import soldierLeft from "@/assets/soldier-left.png";

const bullets = [
  { top: "34%", left: "18%", distance: "220px", duration: "1.15s", delay: "0.05s" },
  { top: "38%", left: "18%", distance: "250px", duration: "1.35s", delay: "0.55s" },
  { top: "31%", right: "20%", distance: "-210px", duration: "1.25s", delay: "0.85s" },
  { top: "36%", right: "20%", distance: "-240px", duration: "1.45s", delay: "1.5s" },
];

/**
 * Jangovar sahna: ikki jangchi bir-biriga qarata otishadi —
 * qurol tepishi (recoil), o'q chaqnashi (muzzle flash) va uchayotgan o'qlar.
 */
export function BattleScene({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-40 select-none overflow-hidden sm:h-52 ${className}`}
      aria-hidden="true"
    >
      {/* chapdagi jangchi — o'ngga qarata otadi */}
      <div className="fx-recoil absolute bottom-0 left-2 origin-bottom sm:left-8">
        <div className="relative">
          <img
            src={soldierRight}
            alt=""
            width={768}
            height={768}
            loading="lazy"
            className="h-32 w-auto opacity-80 drop-shadow-[0_0_18px_oklch(0.78_0.17_62/0.35)] sm:h-44"
          />
          <span className="fx-muzzle absolute right-0 top-[34%] size-4 rounded-full bg-primary blur-[2px] sm:size-5" />
        </div>
      </div>

      {/* o'ngdagi jangchi — chapga qarata otadi */}
      <div className="fx-recoil-mirror absolute bottom-0 right-2 origin-bottom sm:right-8">
        <div className="relative">
          <img
            src={soldierLeft}
            alt=""
            width={768}
            height={768}
            loading="lazy"
            className="h-32 w-auto opacity-80 drop-shadow-[0_0_18px_oklch(0.78_0.17_62/0.35)] sm:h-44"
          />
          <span className="fx-muzzle absolute left-0 top-[30%] size-4 rounded-full bg-accent blur-[2px] sm:size-5" />
        </div>
      </div>

      {/* uchayotgan o'qlar */}
      {bullets.map((b, i) => (
        <span
          key={i}
          className="fx-bullet absolute h-[2px] w-8 rounded-full bg-gradient-to-r from-transparent via-primary to-accent"
          style={{
            top: b.top,
            ...(b.left ? { left: b.left } : { right: b.right }),
            ["--fx-bullet-distance" as string]: b.distance,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
