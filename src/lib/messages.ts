import { supabase } from "@/integrations/supabase/client";

export type Message = {
  id: string;
  account_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

export async function fetchThread(accountId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, account_id, sender_id, recipient_id, body, created_at")
    .eq("account_id", accountId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(input: {
  accountId: string;
  senderId: string;
  recipientId: string;
  body: string;
}) {
  const { error } = await supabase.from("messages").insert({
    account_id: input.accountId,
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    body: input.body,
  });
  if (error) throw error;
}
