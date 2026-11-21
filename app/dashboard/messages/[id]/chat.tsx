"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";

type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
};

export function Chat({
  conversationId,
  currentUserId,
  initialMessages,
  otherName,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  otherName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const endRef = useRef<HTMLDivElement>(null);

  const markRead = useCallback(() => {
    void apiRequest(`/api/conversations/${conversationId}/read`, { method: "POST" }).catch(() => undefined);
  }, [conversationId]);

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<ChatMessage[]>(`/api/conversations/${conversationId}/messages`);
      setMessages(data);
      markRead();
    } catch {
      // keep the current view if a refresh fails
    }
  }, [conversationId, markRead]);

  useEffect(() => {
    markRead();
    const source = new EventSource("/api/stream");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: string; conversationId?: string };
        if (payload.type === "message" && payload.conversationId === conversationId) void refresh();
      } catch {
        // ignore malformed frames
      }
    };
    return () => source.close();
  }, [conversationId, markRead, refresh]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(undefined);
    try {
      const created = await apiRequest<ChatMessage>(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body: { body },
      });
      setMessages((current) => [
        ...current,
        { ...created, createdAt: String(created.createdAt) },
      ]);
      setText("");
    } catch {
      setError("Your message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-80 flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-soft">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to {otherName}.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                    mine ? "bg-primary text-white" : "bg-sand-50 text-ink-700"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.body}</p>
                  {message.attachmentUrl ? (
                    <a
                      href={`/api/files/${message.attachmentUrl}`}
                      className={`mt-1 block text-xs underline ${mine ? "text-white/90" : "text-primary"}`}
                    >
                      {message.attachmentName ?? "Attachment"}
                    </a>
                  ) : null}
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error ? <p className="px-4 pb-1 text-xs text-destructive">{error}</p> : null}

      <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={2}
          maxLength={4000}
          placeholder={`Message ${otherName}…`}
          className="min-h-10 flex-1 resize-none rounded-xl border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(event);
            }
          }}
        />
        <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
