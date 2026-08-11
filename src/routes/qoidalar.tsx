import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileCheck2, Headphones, HelpCircle, Lightbulb, ShieldCheck } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { fetchAdminTelegram } from "@/lib/settings";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/qoidalar")({
  head: () => ({
    meta: [
      { title: "Yordam va qoidalar — PUBG Inferno Market" },
      {
        name: "description",
        content:
          "PUBG akkaunt savdosi qoidalari, xavfsizlik maslahatlari va ko'p beriladigan savollarga javoblar.",
      },
      { property: "og:title", content: "Yordam va qoidalar — PUBG Inferno Market" },
      {
        property: "og:description",
        content: "Xavfsiz savdo qoidalari, kafolat va admin bilan bog'lanish.",
      },
    ],
  }),
  component: Rules,
});

const CARDS = [
  {
    icon: ShieldCheck,
    title: "XAVFSIZLIK",
    text: "Hisoblaringiz xavfsizligi biz uchun ustuvor.",
  },
  {
    icon: FileCheck2,
    title: "QOIDALAR",
    text: "Platformadan foydalanish qoidalari bilan tanishing.",
  },
  {
    icon: Lightbulb,
    title: "MASLAHATLAR",
    text: "Xavfsiz savdo uchun foydali tavsiyalar.",
  },
];

const FAQ = [
  {
    q: "Hisob sotish yoki sotib olish xavfsizmi?",
    a: "Ha. Har bir bitim admin nazoratida o'tadi — pul admin qo'lida turadi va akkaunt to'liq topshirilgach sotuvchiga o'tkaziladi.",
  },
  {
    q: "Hisobimga kafolat beriladimi?",
    a: "Sotuvchi kafolat muddatini ko'rsatadi. Kafolat davomida muammo chiqsa admin bitimni qaytaradi.",
  },
  {
    q: "Savdodan keyin muammo yuzaga kelsa-chi?",
    a: "Darhol admin bilan bog'laning va bitim ID sini yuboring. Tekshiruvdan so'ng mablag' qaytariladi yoki muammo hal qilinadi.",
  },
  {
    q: "Qanday to'lov usullari mavjud?",
    a: "UZCARD/HUMO karta orqali admin hisobiga to'lov qilinadi. Boshqa usullar admin bilan kelishiladi.",
  },
  {
    q: "E'lon joylashtirish uchun to'lov bormi?",
    a: "Yo'q, e'lon joylashtirish bepul. Faqat muvaffaqiyatli bitimdan xizmat haqi olinadi.",
  },
  {
    q: "Hisob qaytarib olish holatlari qanday hal qilinadi?",
    a: "Sotuvchi akkauntni qaytarib olishga urinsa, u bloklanadi va xaridorga to'liq mablag' qaytariladi.",
  },
];

function Rules() {
  const { data: adminTelegram } = useQuery({
    queryKey: ["admin-telegram"],
    queryFn: fetchAdminTelegram,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <AppShell>
      <PageTitle accent="YORDAM" rest="VA QOIDALAR" />

      <div className="mb-6 grid grid-cols-3 gap-2">
        {CARDS.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="relative overflow-hidden rounded-2xl border border-border bg-card/70 p-3 text-center"
          >
            <Icon className="mx-auto size-8 text-primary" />
            <p className="mt-2 font-display text-[11px] font-black uppercase tracking-wider">
              {title}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{text}</p>
            <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-primary/70 blur-[1px]" />
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <HelpCircle className="size-6 text-primary" />
        <h2 className="font-display text-base font-black uppercase tracking-wider">
          Ko'p beriladigan savollar
        </h2>
      </div>

      <Accordion type="single" collapsible className="mb-6 space-y-2">
        {FAQ.map((item, i) => (
          <AccordionItem
            key={item.q}
            value={`q${i}`}
            className="rounded-xl border border-border bg-card/70 px-4"
          >
            <AccordionTrigger className="text-left text-sm font-bold hover:no-underline">
              <span>
                <span className="mr-2 font-display text-primary">{i + 1}.</span>
                {item.q}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <a
        href={`https://t.me/${adminTelegram ?? "admin"}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-3 rounded-2xl bg-primary px-4 py-4 text-primary-foreground glow-red transition-transform active:scale-[0.99]"
      >
        <Headphones className="size-8 shrink-0" />
        <span className="text-center">
          <span className="block font-display text-lg font-black uppercase tracking-wider">
            Admin bilan bog'lanish
          </span>
          <span className="block text-xs opacity-90">
            Savollaringiz bormi? Biz yordam berishga tayyormiz!
          </span>
        </span>
      </a>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4">
        <AlertTriangle className="mt-0.5 size-6 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Hisoblaringiz xavfsizligi uchun <span className="text-primary">hech qachon</span>{" "}
          login/parol ma'lumotlaringizni uchinchi shaxslarga bermang.
        </p>
      </div>
    </AppShell>
  );
}
