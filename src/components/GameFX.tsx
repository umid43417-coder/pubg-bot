import ak47 from "@/assets/ak47.png";

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

const floaters = ["🔫", "🎒", "🎈", "🔱", "💥", "⚜️", "🪖", "⚡️"];

/** Slowly drifting gamer emojis in the page background. */
export function FloatingLoot() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-25"
      aria-hidden="true"
    >
      {floaters.map((emoji, i) => (
        <span
          key={emoji}
          className="fx-gun absolute text-2xl sm:text-3xl"
          style={{
            left: `${(i * 12 + 5) % 95}%`,
            top: `${(i * 23 + 8) % 90}%`,
            animationDuration: `${5 + (i % 4) * 1.7}s`,
            animationDelay: `${i * 0.6}s`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
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
