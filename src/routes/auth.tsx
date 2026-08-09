import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
        content: "PUBG Market akkaunt magaziniga kirish yoki ro'yxatdan o'tish.",
      },
      { property: "og:title", content: "Kirish — PUBG Market" },
      { property: "og:description", content: "E'lon joylash uchun tizimga kiring." },
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

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(t("google_error"));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold">
          PUBG<span className="text-grad">MARKET</span>
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">{t("auth_subtitle")}</p>

        <div className="panel p-5">
          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in">{t("sign_in")}</TabsTrigger>
              <TabsTrigger value="up">{t("sign_up")}</TabsTrigger>
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
                      placeholder="siz@mail.com"
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
          </Tabs>

          <div className="my-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
            {t("or")}
          </div>
          <Button variant="outline" className="w-full font-semibold" onClick={google}>
            {t("continue_google")}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
