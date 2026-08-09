import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Kirish — PUBG Market" },
      {
        name: "description",
        content: "PUBG Market akkaunt magaziniga Gmail, email yoki telefon raqam orqali kiring.",
      },
      { property: "og:title", content: "Kirish — PUBG Market" },
      { property: "og:description", content: "E'lon joylash uchun tizimga kiring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useSession();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+998");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(t("welcome"));
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else if (!data.session) toast.success(t("check_email"));
    else toast.success(t("account_created"));
  }

  // Gmail: avval Supabase'ning o'z OAuth oqimi, u ishlamasa Lovable oqimi.
  async function google() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (!error) return;
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/`,
      });
      if (result.error) toast.error(t("google_error"));
    } catch {
      toast.error(t("google_error"));
    } finally {
      setBusy(false);
    }
  }

  function phoneEmail(raw: string) {
    const digits = raw.replace(/\D/g, "");
    return `p${digits}@pubgmarket.app`;
  }

  // Telefon raqam + parol (SMS provayder talab qilinmaydi).
  async function phoneAuth(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      toast.error("Telefon raqamni to'liq kiriting");
      return;
    }
    if (code.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lsin");
      return;
    }
    setBusy(true);
    const synthetic = phoneEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({
      email: synthetic,
      password: code,
    });
    if (!error) {
      setBusy(false);
      toast.success(t("welcome"));
      return;
    }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: synthetic,
      password: code,
      options: { data: { phone: `+${digits}` } },
    });
    setBusy(false);
    if (signUpError) toast.error(signUpError.message);
    else if (!data.session) toast.error("Hisob yaratildi, lekin tasdiqlash kerak. Admin bilan bog'laning.");
    else toast.success(t("account_created"));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold">
          PUBG<span className="text-grad">MARKET</span>
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">{t("auth_subtitle")}</p>

        <div className="panel p-5">
          <Button
            className="w-full font-bold"
            disabled={busy}
            onClick={google}
            aria-label={t("continue_google")}
          >
            <Mail className="mr-2 size-4" /> {t("continue_google")}
          </Button>

          <div className="my-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
            {t("or")}
          </div>

          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="in">{t("sign_in")}</TabsTrigger>
              <TabsTrigger value="up">{t("sign_up")}</TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="mr-1 size-3" /> Nomer
              </TabsTrigger>
            </TabsList>

            {(["in", "up"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <form onSubmit={tab === "in" ? signIn : signUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`email-${tab}`}>{t("email")}</Label>
                    <Input
                      id={`email-${tab}`}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="siz@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`pass-${tab}`}>{t("password")}</Label>
                    <Input
                      id={`pass-${tab}`}
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full font-bold">
                    {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    {tab === "in" ? t("sign_in") : t("create_account")}
                  </Button>
                </form>
              </TabsContent>
            ))}

            <TabsContent value="phone" className="mt-4">
              <form onSubmit={phoneAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon raqam</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998901234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-pass">Parol</Label>
                  <Input
                    id="phone-pass"
                    type="password"
                    required
                    minLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="••••••"
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full font-bold">
                  {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Kirish / Ro'yxatdan o'tish
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Birinchi marta kirsangiz hisob avtomatik yaratiladi.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
