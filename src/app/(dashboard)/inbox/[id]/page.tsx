"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import {
  getAIDraftAction,
  getAISummaryAction,
  sendMessageAction,
  claimConversationAction,
  updateConversationStatusAction,
} from "@/app/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Sparkles,
  ListChecks,
  Send,
  Paperclip,
  Phone,
  Mail,
  Calendar,
  Flame,
  Minus,
  Smile,
  Clock,
  CheckCircle2,
  CircleDot,
  Bot,
  User,
  Copy,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getConversationWithDetails,
  aiDraftResponses,
  aiSummaryResponses,
  type Sentiment,
  type ConversationStatus,
  type SenderType,
  type Message as DummyMessage,
} from "@/lib/dummy-data";

// Unified message type supporting both dummy and Supabase structure
interface ChatMessage {
  id: string;
  sender_type: SenderType;
  content: string;
  attachment_url?: string | null;
  created_at: string;
}

const sentimentConfig: Record<Sentiment, { label: string; icon: typeof Flame; color: string; bg: string; border: string }> = {
  marah: {
    label: "Marah / Kecewa",
    icon: Flame,
    color: "text-sentiment-angry",
    bg: "bg-sentiment-angry/10",
    border: "border-sentiment-angry/20",
  },
  netral: {
    label: "Netral",
    icon: Minus,
    color: "text-sentiment-neutral",
    bg: "bg-sentiment-neutral/10",
    border: "border-sentiment-neutral/20",
  },
  puas: {
    label: "Puas / Senang",
    icon: Smile,
    color: "text-sentiment-happy",
    bg: "bg-sentiment-happy/10",
    border: "border-sentiment-happy/20",
  },
};

const statusConfig: Record<ConversationStatus, { label: string; icon: typeof CircleDot; color: string; bg: string; border: string }> = {
  open: {
    label: "Terbuka",
    icon: CircleDot,
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/20",
  },
  pending: {
    label: "Tertunda",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
  closed: {
    label: "Selesai",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.sender_type === "ai_system") {
    const isAngry = msg.content.includes("MARAH");
    return (
      <div className="flex justify-center animate-in my-2">
        <div className={cn(
          "flex items-start gap-2 max-w-md rounded-xl px-4 py-2.5 text-xs border",
          isAngry
            ? "bg-sentiment-angry/5 text-sentiment-angry border-sentiment-angry/20"
            : "bg-primary/5 text-primary border-primary/10"
        )}>
          {isAngry ? (
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <Bot className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{msg.content}</span>
        </div>
      </div>
    );
  }

  const isAgent = msg.sender_type === "agent";

  return (
    <div className={cn("flex gap-3 animate-in my-1.5", isAgent ? "justify-end" : "justify-start")}>
      {!isAgent && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1 ring-2 ring-background shadow-xs">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className={cn("max-w-[75%]", isAgent ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs",
            isAgent
              ? "bg-primary text-primary-foreground rounded-br-xs"
              : "bg-muted text-foreground rounded-bl-xs"
          )}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        <p className={cn("text-[9px] mt-1 px-1 font-medium", isAgent ? "text-right text-muted-foreground" : "text-left text-muted-foreground")}>
          {formatTime(msg.created_at)}
        </p>
      </div>

      {isAgent && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 ring-2 ring-background shadow-xs">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser, isUsingSupabase } = useAuth();
  
  // States
  const [conversation, setConversation] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [agent, setAgent] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [replyText, setReplyText] = useState("");
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiDraftText, setAiDraftText] = useState("");
  const [aiSummaryPoints, setAiSummaryPoints] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch data based on Auth provider mode (Supabase or Dummy)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (isUsingSupabase) {
        try {
          // Fetch conversation
          const { data: convo } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", id)
            .single();

          if (!convo) {
            setLoading(false);
            return;
          }
          setConversation(convo);

          // Fetch customer
          const { data: cust } = await supabase
            .from("customers")
            .select("*")
            .eq("id", convo.customer_id)
            .single();
          setCustomer(cust);

          // Fetch agent
          if (convo.agent_id) {
            const { data: agt } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", convo.agent_id)
              .single();
            setAgent(agt);
          } else {
            setAgent(null);
          }

          // Fetch messages
          const { data: msgs } = await supabase
            .from("messages")
            .select("id, sender_type, content, attachment_url, created_at")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true });
          setMessages(msgs || []);
        } catch (error: any) {
          console.error("Error loading chat details from Supabase:", error?.message || error);
        } finally {
          setLoading(false);
        }
      } else {
        // Dummy data fallback
        const dummyDetails = getConversationWithDetails(id);
        if (dummyDetails) {
          setConversation(dummyDetails.conversation);
          setCustomer(dummyDetails.customer);
          setAgent(dummyDetails.agent);
          
          // Map dummy model keys to backend keys
          const mappedMsgs = dummyDetails.messages.map((m) => ({
            id: m.id,
            sender_type: m.senderType,
            content: m.content,
            attachment_url: m.attachmentUrl,
            created_at: m.createdAt,
          }));
          setMessages(mappedMsgs);
        }
        setLoading(false);
      }
    };

    loadData();
  }, [id, isUsingSupabase]);

  // 2. Real-time Message synchronization via WebSockets (Supabase only)
  useEffect(() => {
    if (!isUsingSupabase || !id) return;

    // Listen for new messages inserted
    const uniqueChannelName = `room-${id}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                sender_type: newMsg.sender_type,
                content: newMsg.content,
                attachment_url: newMsg.attachment_url,
                created_at: newMsg.created_at,
              },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updatedConvo = payload.new as any;
          setConversation((prev: any) => ({
            ...prev,
            sentiment: updatedConvo.sentiment,
            status: updatedConvo.status,
            ai_summary: updatedConvo.ai_summary,
            agent_id: updatedConvo.agent_id,
          }));

          // Fetch agent profile if changed
          if (updatedConvo.agent_id) {
            supabase
              .from("profiles")
              .select("*")
              .eq("id", updatedConvo.agent_id)
              .single()
              .then(({ data }) => {
                if (data) setAgent(data);
              });
          } else {
            setAgent(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, isUsingSupabase]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle claiming ticket
  const handleClaimTicket = async () => {
    if (!currentUser || !id) return;
    setClaiming(true);
    const success = await claimConversationAction(id, currentUser.id);
    if (success) {
      setAgent({
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      setConversation((prev: any) => ({ ...prev, agent_id: currentUser.id }));
    } else {
      alert("Gagal mengklaim tiket obrolan.");
    }
    setClaiming(false);
  };

  // Handle updating ticket status
  const handleUpdateStatus = async (newStatus: "open" | "pending" | "closed") => {
    if (!id) return;
    const prevStatus = conversation?.status;

    // Optimistic update
    setConversation((prev: any) => prev ? { ...prev, status: newStatus } : null);

    if (isUsingSupabase) {
      const success = await updateConversationStatusAction(id, newStatus);
      if (!success) {
        // Rollback on failure
        setConversation((prev: any) => prev ? { ...prev, status: prevStatus } : null);
        alert("Gagal memperbarui status tiket.");
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6 animate-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Separator />
        <div className="space-y-3 max-w-2xl">
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-12 w-1/2 rounded-2xl self-end ml-auto" />
          <Skeleton className="h-20 w-5/6 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in">
        <h2 className="text-lg font-semibold">Percakapan tidak ditemukan</h2>
        <p className="text-muted-foreground text-sm mt-1">ID percakapan &quot;{id}&quot; tidak valid.</p>
        <Link
          href="/inbox"
          className={cn(buttonVariants({ variant: "default" }), "mt-5 cursor-pointer rounded-xl")}
        >
          Kembali ke Inbox
        </Link>
      </div>
    );
  }

  const sentimentCfg = sentimentConfig[conversation.sentiment as Sentiment] || sentimentConfig.netral;
  const statusCfg = statusConfig[conversation.status as ConversationStatus] || statusConfig.open;
  const SentimentIcon = sentimentCfg.icon;
  const StatusIcon = statusCfg.icon;

  // AI draft handler (Real or Dummy)
  const handleAiDraft = async () => {
    setAiDraftLoading(true);
    setShowAiDraft(true);
    
    if (isUsingSupabase) {
      const lastMsg = messages.filter((m) => m.sender_type === "customer").pop();
      const draft = await getAIDraftAction(id, lastMsg?.content || "");
      setAiDraftText(draft);
    } else {
      await new Promise((r) => setTimeout(r, 1200));
      setAiDraftText(aiDraftResponses[id] ?? "Halo! Ada yang bisa kami bantu?");
    }
    
    setAiDraftLoading(false);
  };

  // AI Summary handler (Real or Dummy)
  const handleAiSummary = async () => {
    setAiSummaryLoading(true);
    setShowAiSummary(true);

    if (isUsingSupabase) {
      const summary = await getAISummaryAction(id);
      setAiSummaryPoints(summary);
    } else {
      await new Promise((r) => setTimeout(r, 1000));
      setAiSummaryPoints(aiSummaryResponses[id] ?? ["Pelanggan menanyakan informasi.", "Kebutuhan terjawab."]);
    }

    setAiSummaryLoading(false);
  };

  const handleUseDraft = () => {
    setReplyText(aiDraftText);
    setShowAiDraft(false);
  };

  const handleCopyDraft = async () => {
    await navigator.clipboard.writeText(aiDraftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Message Send handler
  const handleSendMessage = async () => {
    if (!replyText.trim()) return;

    const textToSend = replyText;
    setReplyText("");

    if (isUsingSupabase) {
      const result = await sendMessageAction(id, textToSend, "agent");
      if (!result.success) {
        alert("Gagal mengirim pesan: " + result.error);
      }
    } else {
      // Dummy mode append locally
      const mockMsg: ChatMessage = {
        id: `m-dummy-${Date.now()}`,
        sender_type: "agent",
        content: textToSend,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, mockMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Shared Customer Profile content renderer
  function CustomerProfileContent() {
    return (
      <div className="p-5">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Profil Pelanggan
        </h3>

        <div className="flex flex-col items-center text-center mb-5">
          <div className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold mb-3 ring-4 ring-background shadow-xs",
            sentimentCfg.bg, sentimentCfg.color
          )}>
            {customer?.name.split(" ").map((n: string) => n[0]).join("") ?? "?"}
          </div>
          <h4 className="font-bold text-sm text-foreground">{customer?.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{customer?.email}</p>
        </div>

        <Separator className="mb-4 bg-border/60" />

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground border border-border/40 shrink-0">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <span className="truncate">{customer?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground border border-border/40 shrink-0">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <span>{customer?.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground border border-border/40 shrink-0">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <span>Bergabung {customer ? formatDate(customer.created_at || customer.createdAt) : "-"}</span>
          </div>
        </div>

        <Separator className="my-4 bg-border/60" />

        <div>
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Rincian Tiket
          </h4>
          <div className="space-y-2.5 text-xs font-medium text-foreground/90">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ID Tiket</span>
              <span className="font-mono text-[10px] text-foreground/70 truncate max-w-[140px]" title={conversation.id}>
                {conversation.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "h-6 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200",
                    statusCfg.bg, statusCfg.color, statusCfg.border
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("open")}
                    className="flex items-center gap-2 cursor-pointer text-xs focus:bg-info/10 focus:text-info"
                  >
                    <span className="h-2 w-2 rounded-full bg-info" />
                    Terbuka
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("pending")}
                    className="flex items-center gap-2 cursor-pointer text-xs focus:bg-warning/10 focus:text-warning"
                  >
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    Tertunda
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("closed")}
                    className="flex items-center gap-2 cursor-pointer text-xs focus:bg-success/10 focus:text-success"
                  >
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Selesai
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Sentimen</span>
              <Badge
                variant="outline"
                className={cn(
                  "inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border",
                  sentimentCfg.bg, sentimentCfg.color, sentimentCfg.border
                )}
              >
                <SentimentIcon className="h-3 w-3" />
                {sentimentCfg.label}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Agen CS</span>
              <div className="text-xs font-semibold">
                {agent?.name ? (
                  <span className="font-bold">{agent.name}</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-destructive animate-pulse-soft font-semibold text-[11px]">Belum ditugaskan</span>
                    {isUsingSupabase && currentUser && (
                      <button
                        onClick={handleClaimTicket}
                        disabled={claiming}
                        className="text-[9px] text-primary hover:underline font-bold cursor-pointer bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20"
                      >
                        {claiming ? "Klaim..." : "Klaim"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {conversation.ai_summary && (
          <>
            <Separator className="my-4 bg-border/60" />
            <div>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
                Ringkasan Sebelumnya (AI)
              </h4>
              <p className="text-xs text-foreground/80 leading-relaxed bg-muted/40 rounded-xl p-3 border border-border/40 font-medium">
                {conversation.ai_summary}
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100dvh-7.5rem)] animate-in">
      {/* Left: Chat area */}
      <div className="flex-1 flex flex-col min-w-0 border border-border/80 rounded-2xl bg-card shadow-xs overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
          <Link
            href="/inbox"
            aria-label="Kembali ke inbox"
            className="h-11 w-11 sm:h-8.5 sm:w-8.5 shrink-0 inline-flex items-center justify-center rounded-lg hover:bg-muted border border-border/40 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ring-1 ring-border/85 shadow-xs",
            sentimentCfg.bg, sentimentCfg.color
          )}>
            {customer?.name.split(" ").map((n: string) => n[0]).join("") ?? "?"}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate text-foreground">{customer?.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="outline"
                className={cn(
                  "inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border",
                  sentimentCfg.bg, sentimentCfg.color, sentimentCfg.border
                )}
              >
                <SentimentIcon className="h-2.5 w-2.5" />
                <span className="hidden xs:inline">{sentimentCfg.label}</span>
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "h-5 inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0 rounded-md border cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200",
                    statusCfg.bg, statusCfg.color, statusCfg.border
                  )}
                >
                  <StatusIcon className="h-2.5 w-2.5" />
                  <span>{statusCfg.label}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("open")}
                    className="flex items-center gap-2 cursor-pointer text-xs focus:bg-info/10 focus:text-info"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-info" />
                    Terbuka
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("pending")}
                    className="flex items-center gap-2 cursor-pointer text-xs focus:bg-warning/10 focus:text-warning"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                    Tertunda
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleUpdateStatus("closed")}
                    className="flex items-center gap-2 cursor-pointer text-xs focus:bg-success/10 focus:text-success"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-success" />
                    Selesai
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Customer profile trigger on mobile/tablet */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 sm:h-8.5 sm:w-8.5 lg:hidden cursor-pointer rounded-xl border border-border/80 shrink-0"
                    aria-label="Info Pelanggan"
                  />
                }
              >
                <User className="h-4 w-4 text-muted-foreground" />
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-85 p-0 overflow-y-auto bg-card border-l">
                <SheetHeader className="sr-only">
                  <SheetTitle>Profil Pelanggan</SheetTitle>
                </SheetHeader>
                <CustomerProfileContent />
              </SheetContent>
            </Sheet>

            {/* AI Summary */}
            <Tooltip>
              <TooltipTrigger
                className="h-11 sm:h-8.5 gap-1.5 text-[11px] font-semibold cursor-pointer inline-flex items-center px-2.5 sm:px-3 rounded-xl border border-border/80 hover:bg-accent transition-colors disabled:opacity-50 shrink-0"
                onClick={handleAiSummary}
                disabled={aiSummaryLoading}
              >
                <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Ringkas Obrolan</span>
              </TooltipTrigger>
              <TooltipContent side="top">Gunakan Gemini untuk meringkas chat</TooltipContent>
            </Tooltip>

            {/* AI Draft */}
            <Button
              size="sm"
              onClick={handleAiDraft}
              disabled={aiDraftLoading}
              className="h-11 sm:h-8.5 gap-1.5 text-[11px] font-semibold cursor-pointer rounded-xl shadow-xs px-2.5 sm:px-3 shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Draft</span>
            </Button>
          </div>
        </div>

        {/* AI Summary Panel */}
        {showAiSummary && (
          <div className="px-4 py-3 border-b bg-info/5 shrink-0 animate-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-info uppercase tracking-wider">
                <div className="p-1 rounded-md bg-info/15">
                  <ListChecks className="h-3.5 w-3.5" />
                </div>
                Ringkasan AI (OpenRouter)
              </div>
              <button
                className="h-6 w-6 cursor-pointer inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
                onClick={() => setShowAiSummary(false)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {aiSummaryLoading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
            ) : (
              <ul className="space-y-1.5 text-xs text-foreground/80 leading-relaxed font-medium">
                {aiSummaryPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-info mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Message Thread (Native scroll responsive container) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scroll-smooth bg-card [scrollbar-gutter:stable] -webkit-overflow-scrolling-touch">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 justify-center mb-4">
              <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/40">
                {formatDate(messages[0]?.created_at || conversation.created_at)}
              </span>
            </div>

            {messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10 font-medium">Belum ada obrolan dalam tiket ini.</p>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* AI Draft Panel */}
        {showAiDraft && (
          <div className="px-4 py-3.5 border-t border-border/60 bg-primary/5 shrink-0 animate-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <div className="p-1 rounded-md bg-primary/15">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                Draf AI (RAG & OpenRouter)
              </div>
              <button
                className="h-6 w-6 cursor-pointer inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
                onClick={() => setShowAiDraft(false)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {aiDraftLoading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            ) : (
              <>
                <div className="text-xs font-medium whitespace-pre-wrap bg-card p-4 rounded-xl border border-border/75 shadow-xs mb-3 max-h-40 overflow-y-auto leading-relaxed text-foreground/80">
                  {aiDraftText}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleUseDraft} className="h-8 text-[11px] font-semibold gap-1.5 cursor-pointer rounded-lg">
                    <Check className="h-3 w-3" />
                    Gunakan Draf
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyDraft} className="h-8 text-[11px] font-semibold gap-1.5 cursor-pointer rounded-lg">
                    {copied ? (
                      <><Check className="h-3 w-3" />Tersalin</>
                    ) : (
                      <><Copy className="h-3 w-3" />Salin Draf</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Input box */}
        <div className="p-3 border-t border-border/80 bg-card shrink-0">
          <div className="flex items-end gap-2">
            <Tooltip>
              <TooltipTrigger
                className="h-10 w-10 shrink-0 cursor-pointer inline-flex items-center justify-center rounded-xl border border-border/80 hover:bg-accent transition-colors"
                aria-label="Lampirkan file"
              >
                <Paperclip className="h-4.5 w-4.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Lampirkan file (maks 2MB)</TooltipContent>
            </Tooltip>

            <Textarea
              placeholder="Tulis balasan agen..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[2.5rem] max-h-32 resize-none rounded-xl border-border/80 focus-visible:ring-primary/30 py-2.5 text-sm"
              rows={1}
              aria-label="Tulis balasan"
            />

            <Button
              size="icon"
              className="h-10 w-10 shrink-0 cursor-pointer rounded-xl shadow-xs"
              disabled={!replyText.trim()}
              onClick={handleSendMessage}
              aria-label="Kirim balasan"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Customer Profile panel (Desktop Sidebar) */}
      <div className="hidden lg:block lg:w-80 shrink-0 border border-border/80 rounded-2xl bg-card shadow-xs overflow-y-auto scrollbar-thin">
        <CustomerProfileContent />
      </div>
    </div>
  );
}
