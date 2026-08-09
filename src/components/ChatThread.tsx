import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessagesSquare, Send } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/lib/i18n";
import { fetchThread, sendMessage, type Message } from "@/lib/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatThread({ accountId, sellerId }: { accountId: string; sellerId: string }) {
  const { user } = useSession();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: messages } = useQuery({
    queryKey: ["messages", accountId],
    queryFn: () => fetchThread(accountId),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const send = useMutation({
    mutationFn: (vars: { recipientId: string; body: string }) =>
      sendMessage({
        accountId,
        senderId: user!.id,
        recipientId: vars.recipientId,
        body: vars.body,
      }),
    onSuccess: (_d, vars) => {
      setDrafts((prev) => ({ ...prev, [vars.recipientId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["messages", accountId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <div className="panel space-y-3 p-5">
        <p className="flex items-center gap-2 text-sm font-bold">
          <MessagesSquare className="size-4 text-primary" /> {t("chat_title")}
        </p>
        <p className="text-sm text-muted-foreground">{t("chat_signin")}</p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/auth">{t("sign_in")}</Link>
        </Button>
      </div>
    );
  }

  const isSeller = user.id === sellerId;
  const all = messages ?? [];
  const threads: { counterpart: string; items: Message[] }[] = isSeller
    ? Object.entries(
        all.reduce<Record<string, Message[]>>((acc, m) => {
          const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
          acc[other] = [...(acc[other] ?? []), m];
          return acc;
        }, {}),
      ).map(([counterpart, items]) => ({ counterpart, items }))
    : [{ counterpart: sellerId, items: all }];

  return (
    <div className="panel space-y-4 p-5">
      <p className="flex items-center gap-2 text-sm font-bold">
        <MessagesSquare className="size-4 text-primary" /> {t("chat_title")}
      </p>

      {threads.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("chat_empty")}</p>
      ) : null}

      {threads.map(({ counterpart, items }) => (
        <div key={counterpart} className="space-y-3">
          {isSeller ? (
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("chat_buyer")} · {counterpart.slice(0, 8)}
            </p>
          ) : null}
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("chat_empty")}</p>
            ) : null}
            {items.map((m) => (
              <div
                key={m.id}
                className={
                  m.sender_id === user.id
                    ? "ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary/15 px-3 py-2 text-sm"
                    : "mr-auto max-w-[85%] rounded-lg rounded-bl-sm bg-muted px-3 py-2 text-sm"
                }
              >
                <p className="whitespace-pre-line">{m.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={drafts[counterpart] ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [counterpart]: e.target.value }))}
              placeholder={t("chat_ph")}
              aria-label={t("chat_ph")}
            />
            <Button
              size="icon"
              disabled={send.isPending || !(drafts[counterpart] ?? "").trim()}
              onClick={() =>
                send.mutate({
                  recipientId: counterpart,
                  body: (drafts[counterpart] ?? "").trim().slice(0, 2000),
                })
              }
              aria-label={t("chat_send")}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
