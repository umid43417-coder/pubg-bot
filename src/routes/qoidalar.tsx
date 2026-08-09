import { createFileRoute, Link } from "@tanstack/react-router";
import { Crosshair, Handshake, ShieldCheck, Swords, Timer, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/qoidalar")({
  head: () => ({
    meta: [
      { title: "Qoidalar — PUBG Market" },
      {
        name: "description",
        content:
          "PUBG Market savdo qoidalari: garant tartibi, xaridor va sotuvchi majburiyatlari, ban sabablari.",
      },
      { property: "og:title", content: "Qoidalar — PUBG Market" },
      {
        property: "og:description",
        content: "Halol savdo uchun to'liq qoidalar: garant, tekshiruv va javobgarlik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RulesPage,
});

const SECTIONS = [
  {
    icon: Crosshair,
    emoji: "🎯",
    title: "Umumiy qoidalar",
    items: [
      "Bu yerda faqat PUBG Mobile akkauntlari oldi-sotdisi.",
      "Har bir kelishuv admin kafolati (garant) ostida o'tadi.",
      "Aldov, spam va soxta e'lon — bir umrlik ban 🚫",
    ],
  },
  {
    icon: ShieldCheck,
    emoji: "🛒",
    title: "Xaridor uchun",
    items: [
      "Avval akkauntning video va rasmlarini to'liq ko'ring.",
      "Pulni faqat admin orqali o'tkazing.",
      "Akkauntni olgach, mail va parolni darhol almashtiring 🔐",
    ],
  },
  {
    icon: Swords,
    emoji: "💰",
    title: "Sotuvchi uchun",
    items: [
      "E'londa haqiqiy LVL, skin, RP va statistikani ko'rsating.",
      "Rasm va video o'zingizniki bo'lsin.",
      "Sotilgan akkauntni qaytarib olishga urinish — ban + qora ro'yxat ⚠️",
    ],
  },
  {
    icon: Handshake,
    emoji: "🤝",
    title: "Savdo tartibi",
    items: [
      "1️⃣ Xaridor adminga yozadi",
      "2️⃣ Admin sotuvchi bilan bog'lanadi",
      "3️⃣ Pul admin qo'lida turadi (garant)",
      "4️⃣ Akkaunt topshiriladi va tekshiriladi",
      "5️⃣ Pul sotuvchiga o'tkaziladi ✅",
    ],
  },
  {
    icon: Timer,
    emoji: "⏱",
    title: "Tekshiruv va javobgarlik",
    items: [
      "Tekshiruv muddati: 24 soat.",
      "Muammo chiqsa, admin masalani hal qiladi.",
      "Qoidani buzgan tomon pulni qaytaradi.",
    ],
  },
];

function RulesPage() {
  return (
    <AppShell>
      <section className="panel mb-6 p-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
          <TriangleAlert className="size-4" /> Rules of the Battleground
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          📜 <span className="text-grad">QOIDALAR</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Halol savdo — tinch o'yin. Quyidagi qoidalar barcha gamerlar uchun majburiy.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, emoji, title, items }) => (
          <section key={title} className="panel space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-grad-hero text-primary-foreground">
                <Icon className="size-4" />
              </span>
              <span className="truncate">
                {emoji} {title}
              </span>
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="panel mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm font-bold">🔥 GG WP — halol savdo, tinch o'yin!</p>
        <Button asChild className="font-bold">
          <Link to="/">🛒 Magazinga qaytish</Link>
        </Button>
      </div>
    </AppShell>
  );
}
