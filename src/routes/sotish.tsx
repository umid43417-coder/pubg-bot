import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  async function upload(files: File[], userId: string) {
    const paths: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("account-media").upload(path, file);
      if (error) throw error;
      paths.push(path);
    }
    return paths;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const [imagePaths, videoPaths] = await Promise.all([
        upload(images, user.id),
        upload(videos, user.id),
      ]);
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
      });
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

        <section className="panel space-y-4 p-5">
          <h2 className="text-base font-bold">{t("media_section")}</h2>
          <div className="space-y-2">
            <Label htmlFor="images" className="flex items-center gap-2">
              <ImagePlus className="size-4" /> {t("photos")}
            </Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            />
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
              onChange={(e) => setVideos(Array.from(e.target.files ?? []))}
            />
            <p className="text-xs text-muted-foreground">
              {videos.length} {t("videos_selected")}
            </p>
          </div>
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
