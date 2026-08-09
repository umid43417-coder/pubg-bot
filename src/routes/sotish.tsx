import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Video, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PUBG_SECTIONS } from "@/lib/pubg-spec";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/sotish")({
  head: () => ({
    meta: [
      { title: "Akkaunt sotish — e'lon joylash | PUBG Market" },
      {
        name: "description",
        content:
          "PUBG akkauntingizni sotish uchun rasm va video yuklang, narx, LVL, skinlar va tavsifni yozing.",
      },
      { property: "og:title", content: "Akkaunt sotish — PUBG Market" },
      {
        property: "og:description",
        content: "Rasm, video, narx va to'liq statistika bilan e'lon joylang.",
      },
    ],
  }),
  component: SellPage,
});

const specInputs = [
  { name: "level", label: "📈 LVL", placeholder: "76", type: "number" },
  { name: "rp", label: "🛎 RP", placeholder: "videoda" },
  { name: "clothes", label: "🦹‍♂️ Kiyimlar", placeholder: "400+" },
  { name: "gun_skins", label: "🔫 Avtomatga skin", placeholder: "200+" },
  { name: "parachute_skins", label: "🎈 Parashutga skin", placeholder: "30+" },
  { name: "backpack_skins", label: "🎒 Papkaga skin", placeholder: "30" },
  { name: "achievements", label: "🔱 Dostajeniya", placeholder: "7800" },
  { name: "titles", label: "⚜️ Titullar", placeholder: "videoda" },
  { name: "upgrade", label: "⚡️ Prokachka", placeholder: "48" },
  { name: "kill_chat", label: "➡️ Kill chat", placeholder: "15" },
] as const;

function SellPage() {
  const { user, loading } = useSession();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const total = images.length + videos.length;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  async function upload(files: File[], userId: string) {
    const paths: string[] = [];
    for (const file of files) {
      const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("account-media")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (error) throw error;
      paths.push(path);
      setDone((d) => d + 1);
    }
    return paths;
  }

  function addFiles(kind: "image" | "video", incoming: FileList | null) {
    const limitMb = kind === "image" ? 15 : 200;
    const picked = Array.from(incoming ?? []).filter((f) => {
      if (f.size > limitMb * 1024 * 1024) {
        toast.error(`${f.name} — ${limitMb}MB dan katta`);
        return false;
      }
      return true;
    });
    if (picked.length === 0) return;
    const setter = kind === "image" ? setImages : setVideos;
    setter((prev) => {
      const merged = [...prev];
      for (const file of picked) {
        if (!merged.some((f) => f.name === file.name && f.size === file.size)) merged.push(file);
      }
      return merged;
    });
  }

  function removeFile(kind: "image" | "video", index: number) {
    const setter = kind === "image" ? setImages : setVideos;
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setDone(0);
    try {
      const [imagePaths, videoPaths] = await Promise.all([
        upload(images, user.id),
        upload(videos, user.id),
      ]);
      // To'liq PUBG ma'lumotlari (d.<bo'lim>.<maydon>) -> details JSONB
      const details: Record<string, Record<string, string | number | boolean>> = {};
      for (const [rawKey, rawValue] of fd.entries()) {
        if (!rawKey.startsWith("d.")) continue;
        const [, section, key] = rawKey.split(".");
        if (!section || !key) continue;
        const value = typeof rawValue === "string" ? rawValue.trim() : "";
        if (!value) continue;
        details[section] ??= {};
        details[section][key] = value === "on" ? true : value;
      }

      const { error } = await supabase.from("accounts").insert({
        user_id: user.id,
        title: String(fd.get("title")),
        price: Number(fd.get("price")),
        currency: String(fd.get("currency") || "UZS"),
        level: fd.get("level") ? Number(fd.get("level")) : null,
        rp: String(fd.get("rp") || ""),
        clothes: String(fd.get("clothes") || ""),
        gun_skins: String(fd.get("gun_skins") || ""),
        parachute_skins: String(fd.get("parachute_skins") || ""),
        backpack_skins: String(fd.get("backpack_skins") || ""),
        achievements: String(fd.get("achievements") || ""),
        titles: String(fd.get("titles") || ""),
        upgrade: String(fd.get("upgrade") || ""),
        kill_chat: String(fd.get("kill_chat") || ""),
        extra: String(fd.get("extra") || ""),
        description: String(fd.get("description") || ""),
        contact: String(fd.get("contact") || ""),
        images: imagePaths,
        videos: videoPaths,
        details,
      } as never);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("E'lon joylandi!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">{t("sell_title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("sell_text")}</p>

      <form onSubmit={submit} className="space-y-6">
        <section className="panel space-y-4 p-5">
          <h2 className="text-base font-bold">{t("main_section")}</h2>
          <div className="space-y-2">
            <Label htmlFor="title">{t("f_title")}</Label>
            <Input id="title" name="title" required placeholder="LVL 76 topovoy akkaunt" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="price">{t("f_price")}</Label>
              <Input id="price" name="price" type="number" min="0" required placeholder="1500000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t("f_currency")}</Label>
              <Input id="currency" name="currency" defaultValue="UZS" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">{t("f_contact")}</Label>
            <Input id="contact" name="contact" placeholder="@username" />
          </div>
        </section>

        <section className="panel space-y-4 p-5">
          <h2 className="text-base font-bold">{t("stats_section")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {specInputs.map((f) => (
              <div key={f.name} className="space-y-2">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input
                  id={f.name}
                  name={f.name}
                  type={"type" in f ? f.type : "text"}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra">🔥 {t("f_extra")}</Label>
            <Input id="extra" name="extra" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("f_description")}</Label>
            <Textarea id="description" name="description" rows={5} placeholder={t("desc_ph")} />
          </div>
        </section>

        <section className="panel space-y-3 p-4">
          <h2 className="text-base font-bold">🎮 To'liq PUBG ma'lumotlari</h2>
          <p className="text-xs text-muted-foreground">
            Faqat bilganingizni to'ldiring — bo'sh maydonlar e'londa ko'rinmaydi.
          </p>
          <div className="space-y-2">
            {PUBG_SECTIONS.map((section) => (
              <details
                key={section.id}
                className="rounded-xl border border-border/70 bg-card/40 px-3 py-2"
              >
                <summary className="cursor-pointer list-none text-sm font-bold">
                  <span className="mr-1">{section.icon}</span>
                  {section.title}
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {section.fields.map((f) => {
                    const name = `d.${section.id}.${f.key}`;
                    if (f.type === "bool") {
                      return (
                        <label
                          key={f.key}
                          htmlFor={name}
                          className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs"
                        >
                          <Checkbox id={name} name={name} />
                          <span className="min-w-0 truncate">
                            {f.icon} {f.label}
                          </span>
                        </label>
                      );
                    }
                    return (
                      <div key={f.key} className="min-w-0 space-y-1">
                        <Label htmlFor={name} className="text-xs">
                          {f.icon} {f.label}
                        </Label>
                        {f.type === "textarea" ? (
                          <Textarea id={name} name={name} rows={3} placeholder={f.ph} />
                        ) : (
                          <Input
                            id={name}
                            name={name}
                            type={f.type === "number" ? "number" : "text"}
                            inputMode={f.type === "number" ? "numeric" : undefined}
                            placeholder={f.ph}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="panel space-y-4 p-5">
          <h2 className="text-base font-bold">📸 {t("media_section")}</h2>
          <p className="text-xs text-muted-foreground">
            Bir nechta rasm va videoni birdan tanlashingiz mumkin. Yana qo'shsangiz — eskilari
            o'chib ketmaydi. Rasm ≤ 15MB, video ≤ 200MB.
          </p>

          <div className="space-y-2">
            <Label htmlFor="images" className="flex items-center gap-2">
              <ImagePlus className="size-4" /> {t("photos")}
            </Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                addFiles("image", e.target.files);
                e.target.value = "";
              }}
            />
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="group relative overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Yuklanadigan rasm ${i + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Rasmni o'chirish"
                      onClick={() => removeFile("image", i)}
                      className="absolute right-1 top-1 grid size-6 place-items-center rounded-md bg-background/80 text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {images.length} {t("photos_selected")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videos" className="flex items-center gap-2">
              <Video className="size-4" /> {t("videos")}
            </Label>
            <Input
              id="videos"
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => {
                addFiles("video", e.target.files);
                e.target.value = "";
              }}
            />
            {videos.length > 0 ? (
              <ul className="space-y-2">
                {videos.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border p-2 text-xs"
                  >
                    <span className="min-w-0 truncate">
                      🎬 {file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                    <button
                      type="button"
                      aria-label="Videoni o'chirish"
                      onClick={() => removeFile("video", i)}
                      className="shrink-0 text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {videos.length} {t("videos_selected")}
            </p>
          </div>

          {busy && total > 0 ? (
            <p className="text-xs font-semibold text-primary">
              ⏫ Yuklanmoqda: {done}/{total}
            </p>
          ) : null}
        </section>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={busy} className="flex-1 font-bold">
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} {t("publish")}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/">{t("cancel")}</Link>
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
