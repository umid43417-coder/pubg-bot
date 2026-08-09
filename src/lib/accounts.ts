import { supabase } from "@/integrations/supabase/client";

export type GameAccount = {
  id: string;
  user_id: string;
  title: string;
  price: number;
  currency: string;
  level: number | null;
  rp: string | null;
  clothes: string | null;
  gun_skins: string | null;
  parachute_skins: string | null;
  backpack_skins: string | null;
  achievements: string | null;
  titles: string | null;
  upgrade: string | null;
  kill_chat: string | null;
  extra: string | null;
  description: string | null;
  contact: string | null;
  images: string[];
  videos: string[];
  sold: boolean;
  created_at: string;
};

export const SPEC_FIELDS: { key: keyof GameAccount; icon: string; label: string }[] = [
  { key: "level", icon: "📈", label: "LVL" },
  { key: "rp", icon: "🛎", label: "RP" },
  { key: "clothes", icon: "🦹‍♂️", label: "Kiyimlar" },
  { key: "gun_skins", icon: "🔫", label: "Avtomatga skin" },
  { key: "parachute_skins", icon: "🎈", label: "Parashutga skin" },
  { key: "backpack_skins", icon: "🎒", label: "Papkaga skin" },
  { key: "achievements", icon: "🔱", label: "Dostajeniya" },
  { key: "titles", icon: "⚜️", label: "Titullar" },
  { key: "upgrade", icon: "⚡️", label: "Prokachka" },
  { key: "kill_chat", icon: "➡️", label: "Kill chat" },
  { key: "extra", icon: "🔥", label: "Qo'shimcha" },
];

export function formatPrice(price: number, currency: string) {
  return `${new Intl.NumberFormat("uz-UZ").format(price)} ${currency}`;
}

export async function fetchAccounts() {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as GameAccount[];
}

export async function fetchAccount(id: string) {
  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as GameAccount | null;
}

export async function signMedia(paths: string[]) {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage
    .from("account-media")
    .createSignedUrls(paths, 60 * 60 * 6);
  if (error) throw error;
  return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
}
