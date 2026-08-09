import ak47 from "@/assets/ak47.png";
import gamerBg from "@/assets/gamer-bg.jpg";

/** Floating neon AK-47 with pulsing crosshair ring — hero decoration. */
export function FloatingGun({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="relative">
        <img
          src={ak47}
          alt=""
          width={1024}
          height={512}
          loading="lazy"
          className="fx-gun w-56 sm:w-80"
        />
        <span className="fx-ring absolute -right-2 top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary" />
      </div>
    </div>
  );
}

const tracers = [
  { top: "18%", duration: "5.5s", delay: "0s", width: "70px" },
  { top: "42%", duration: "7s", delay: "1.4s", width: "110px" },
  { top: "66%", duration: "4.5s", delay: "2.6s", width: "50px" },
  { top: "84%", duration: "8s", delay: "0.8s", width: "90px" },
];

/** Bullet tracers streaking across a container. */
export function BulletTracers() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {tracers.map((tr, i) => (
        <span
          key={i}
          className="fx-tracer absolute h-[2px] rounded-full bg-gradient-to-r from-transparent via-primary to-accent"
          style={{
            top: tr.top,
            width: tr.width,
            animationDuration: tr.duration,
            animationDelay: tr.delay,
          }}
        />
      ))}
      <span className="fx-scanline absolute left-0 h-px w-full bg-accent/30" />
    </div>
  );
}

const sparks = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 4) % 96}%`,
  size: 3 + (i % 4),
  duration: `${9 + (i % 5) * 2.5}s`,
  delay: `${i * 0.9}s`,
}));

/** Animated gamer battlefield backdrop: slow ken-burns image + rising sparks. */
export function GamerBackdrop() {
  return (
    <div className="fx-backdrop overflow-hidden" aria-hidden="true">
      <img
        src={gamerBg}
        alt=""
        width={1600}
        height={1008}
        className="fx-kenburns absolute inset-0 size-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
      <div className="fx-pulse-glow absolute inset-0 bg-grad-hero opacity-10" />
      {sparks.map((spark, i) => (
        <span
          key={i}
          className="fx-spark absolute bottom-0 rounded-full bg-primary/70"
          style={{
            left: spark.left,
            width: spark.size,
            height: spark.size,
            animationDuration: spark.duration,
            animationDelay: spark.delay,
          }}
        />
      ))}
      <span className="fx-scanline absolute left-0 h-px w-full bg-accent/25" />
    </div>
  );
}

/** Eski emoji fon — endi backdrop ustidagi yengil qatlam sifatida ishlatiladi. */
export function FloatingLoot() {
  return <GamerBackdrop />;
}

/** Rotating neon crosshair badge. */
export function SpinningCrosshair({ className = "" }: { className?: string }) {
  return (
    <span
      className={`fx-spin inline-flex size-10 items-center justify-center rounded-full border-2 border-dashed border-primary/70 text-primary ${className}`}
      aria-hidden="true"
    >
      ◎
    </span>
  );
}
