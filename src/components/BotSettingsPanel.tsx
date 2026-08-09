import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bot, Save } from "lucide-react";
import { BOT_SETTINGS, fetchSettings, saveSetting } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const KEYS = BOT_SETTINGS.map((s) => s.key);

/** Bot matnlari va sozlamalarini repodan tashqarida o'zgartirish paneli. */
export function BotSettingsPanel() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["bot-settings"], queryFn: () => fetchSettings(KEYS) });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setValues((prev) => ({ ...data, ...prev }));
  }, [data]);

  const save = useMutation({
    mutationFn: async (key: string) => saveSetting(key, values[key] ?? ""),
    onSuccess: () => {
      toast.success("Saqlandi");
      queryClient.invalidateQueries({ queryKey: ["bot-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="panel mb-6 space-y-5 p-5">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <Bot className="size-5 text-primary" /> Bot sozlamalari
      </h2>
      <p className="text-sm text-muted-foreground">
        Bu yerdagi matnlar Telegram botda darhol qo'llanadi — kodni o'zgartirish shart emas.
      </p>

      {BOT_SETTINGS.map((setting) => (
        <div key={setting.key} className="space-y-2">
          <Label htmlFor={setting.key}>{setting.label}</Label>
          <div className="flex gap-2">
            {setting.multiline ? (
              <Textarea
                id={setting.key}
                rows={3}
                value={values[setting.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [setting.key]: e.target.value }))}
              />
            ) : (
              <Input
                id={setting.key}
                placeholder={setting.hint ?? ""}
                value={values[setting.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [setting.key]: e.target.value }))}
              />
            )}
            <Button
              variant="outline"
              disabled={save.isPending}
              onClick={() => save.mutate(setting.key)}
              aria-label={`${setting.label} — saqlash`}
            >
              <Save className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
