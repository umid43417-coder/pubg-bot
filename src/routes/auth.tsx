import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
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
        content: "PUBG Market akkaunt magaziniga login va parol orqali kiring yoki ro'yxatdan o'ting.",
      },
      { property: "og:title", content: "Kirish — PUBG Market" },
      { property: "og:description", content: "Login va parol bilan tez ro'yxatdan o'tish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const LOGIN_KEY = "pubgmarket:last_login";

/** Login (yoki telefon) -> Supabase uchun ichki email. */
function loginToEmail(raw: string) {
  const value = raw.trim().toLowerCase();
  if (value.includes("@")) return value;
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 9 && /^[+\d\s()-]+$/.test(value)) return `p${digits}@pubgmarket.app`;
  const safe = value.replace(/[^a-z0-9_.-]/g, "");
  return `${safe}@pubgmarket.app`;
}

function friendlyAuthError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("email rate limit")) return "Juda ko'p urinish bo'ldi. Bir necha daqiqadan keyin qayta urinib ko'ring.";
  if (value.includes("already registered")) return "Bu login avval ro'yxatdan o'tgan. «Kirish» bo'limidan foydalaning.";
  if (value.includes("invalid login")) return "Login yoki parol noto'g'ri.";
  if (value.includes("signup") && value.includes("disabled")) return "Yangi hisob ochish vaqtincha yopilgan. Admin bilan bog'laning.";
  return message;
}

function AuthPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LOGIN_KEY) : null;
    if (saved) setLogin(saved);
  }, []);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  function validate() {
    const value = login.trim();
    if (value.replace(/[^a-z0-9@._-]/gi, "").length < 3) {
      toast.error("Login kamida 3 ta belgidan iborat bo'lsin");
      return false;
    }
    if (password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lsin");
      return false;
    }
    return true;
  }

  function remember() {
    try {
      localStorage.setItem(LOGIN_KEY, login.trim());
    } catch {
      /* ignore */
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginToEmail(login),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("Login yoki parol xato. Ro'yxatdan o'tgan bo'lsangiz tekshirib qayting.");
      return;
    }
    remember();
    toast.success("Xush kelibsiz! 🎮");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const email = loginToEmail(login);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: login.trim() } },
    });
    if (error) {
      setBusy(false);
      toast.error(friendlyAuthError(error.message));
      return;
    }
    if (!data.session) {
      setBusy(false);
      toast.info("Hisob yaratildi. Tasdiqlash talab qilinsa, emailni tekshiring; keyin «Kirish»ni bosing.");
      remember();
      return;
    } else {
      setBusy(false);
    }
    remember();
    toast.success("Hisob yaratildi ✅");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold">
          PUBG<span className="text-grad">MARKET</span>
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          🔐 Login va parol orqali kiring — hisobingiz eslab qolinadi.
        </p>

        <div className="panel p-5">
          <Tabs defaultValue="in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in">
                <LogIn className="mr-1 size-3" /> Kirish
              </TabsTrigger>
              <TabsTrigger value="up">
                <UserPlus className="mr-1 size-3" /> Ro'yxatdan o'tish
              </TabsTrigger>
            </TabsList>

            {(["in", "up"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <form onSubmit={tab === "in" ? signIn : signUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`login-${tab}`}>Login yoki telefon</Label>
                    <Input
                      id={`login-${tab}`}
                      autoComplete="username"
                      required
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="pubgking yoki +998901234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`pass-${tab}`}>Parol</Label>
                    <Input
                      id={`pass-${tab}`}
                      type="password"
                      autoComplete={tab === "in" ? "current-password" : "new-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full font-bold">
                    {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    {tab === "in" ? "Kirish" : "Ro'yxatdan o'tish"}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3 text-accent" /> Ma'lumotlaringiz xavfsiz saqlanadi
          </p>
        </div>
      </div>
    </AppShell>
  );
}
