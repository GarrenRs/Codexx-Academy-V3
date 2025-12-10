import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, User } from "@shared/schema";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const QUICK_EMOJIS = ["😀", "😂", "❤️", "👍", "🎉", "🔥", "💯", "✨", "😍", "🚀", "👏", "😎"];

interface ChatMessage extends Message {
  sender?: User;
}

interface ChatBoxProps {
  targetType: "room" | "group";
  targetId: number;
  targetName: string;
  currentUser?: User | null;
}

export function ChatBox({
  targetType,
  targetId,
  targetName,
  currentUser,
}: ChatBoxProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [wsMessages, setWsMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const queryKey = targetType === "room" 
    ? ["/api/messages", { roomId: targetId }] 
    : ["/api/messages", { groupId: targetId }];

  const { data: initialMessages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetType === "room") {
        params.set("roomId", targetId.toString());
      } else {
        params.set("groupId", targetId.toString());
      }
      const response = await fetch(`/api/messages?${params}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  const allMessages = [...initialMessages, ...wsMessages].sort((a, b) => 
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  const connectWebSocket = useCallback(async () => {
    if (!currentUser) return;

    try {
      const tokenResponse = await apiRequest("POST", "/api/ws-token");
      const { token } = await tokenResponse.json();

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host || "localhost:5000";
      const wsUrl = `${protocol}//${host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "auth", token }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "auth_success") {
          const joinMessage: Record<string, unknown> = { type: "join" };
          if (targetType === "room") {
            joinMessage.roomId = targetId;
          } else {
            joinMessage.groupId = targetId;
          }
          ws.send(JSON.stringify(joinMessage));
        } else if (data.type === "join_success") {
          setIsConnected(true);
        } else if (data.type === "new_message") {
          setWsMessages((prev) => {
            // Check if message already exists in wsMessages
            const existsInWs = prev.some((m) => m.id === data.message.id);
            if (existsInWs) return prev;
            
            // Check if message already exists in initialMessages
            const existsInInitial = initialMessages.some((m) => m.id === data.message.id);
            if (existsInInitial) return prev;
            
            return [...prev, data.message];
          });
        } else if (data.type === "error") {
          console.error("WebSocket error:", data.message);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (currentUser) {
            connectWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  }, [currentUser, targetType, targetId]);

  useEffect(() => {
    // Clear temporary messages when switching chats
    setWsMessages([]);
    setIsConnected(false);

    // Close existing WebSocket connection
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent auto-reconnect
      wsRef.current.close();
      wsRef.current = null;
    }

    // Connect to new chat
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent auto-reconnect
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [targetType, targetId, connectWebSocket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending || !wsRef.current || !isConnected) return;

    setIsSending(true);
    const messageContent = message.trim();

    try {
      const msgPayload: Record<string, unknown> = {
        type: "message",
        content: messageContent,
      };
      if (targetType === "room") {
        msgPayload.roomId = targetId;
      } else {
        msgPayload.groupId = targetId;
      }
      wsRef.current.send(JSON.stringify(msgPayload));
      setMessage("");
      setShowEmojiPicker(false);
      inputRef.current?.focus();
      toast({ title: "✅ تم إرسال الرسالة", variant: "default" });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setMessage(messageContent);
      toast({ title: "❌ فشل إرسال الرسالة", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);

    try {
      const body: Record<string, unknown> = {
        content: message.trim(),
      };
      if (targetType === "room") {
        body.roomId = targetId;
      } else {
        body.groupId = targetId;
      }

      const response = await apiRequest("POST", "/api/messages", body);
      const newMessage = await response.json();
      setWsMessages((prev) => [...prev, { ...newMessage, sender: currentUser }]);
      setMessage("");
      setShowEmojiPicker(false);
      inputRef.current?.focus();
      toast({ title: "✅ تم إرسال الرسالة", variant: "default" });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({ title: "❌ فشل إرسال الرسالة", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-gradient-to-r from-emerald-50/30 to-red-50/30 dark:from-emerald-950/10 dark:to-red-950/10">
        <div>
          <h3 className="font-semibold">{targetName}</h3>
          <p className="text-xs text-muted-foreground">
            {targetType === "room" ? "غرفة" : "مجموعة"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? "متصل" : "غير متصل"}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">لا توجد رسائل بعد</p>
            <p className="text-xs">ابدأ المحادثة الآن</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allMessages.map((msg) => {
              const isOwn = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                  data-testid={`message-${msg.id}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={msg.sender?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {msg.sender?.firstName?.charAt(0) || "م"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {msg.sender?.firstName || "مستخدم"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {msg.createdAt && format(new Date(msg.createdAt), "HH:mm", { locale: ar })}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="border-t">
        {showEmojiPicker && (
          <div className="p-3 border-b bg-gradient-to-r from-emerald-50/30 to-red-50/30 dark:from-emerald-950/10 dark:to-red-950/10 flex flex-wrap gap-2">
            {QUICK_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => addEmoji(emoji)}
                className="text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
        <form onSubmit={isConnected ? handleSubmit : handleFallbackSubmit} className="flex gap-2 p-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="shrink-0"
            title="اختر رموز تعبيرية"
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            disabled={isSending}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || isSending}
            data-testid="button-send-message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}