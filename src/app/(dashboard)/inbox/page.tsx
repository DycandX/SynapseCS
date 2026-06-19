"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Flame,
  Minus,
  Smile,
  Clock,
  CheckCircle2,
  CircleDot,
  User,
  MessageSquare,
  Inbox,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  conversations as dummyConversations,
  getCustomerById,
  getAgentById,
  getMessagesByConversationId,
  type ConversationStatus,
  type Sentiment,
} from "@/lib/dummy-data";

const sentimentConfig: Record<Sentiment, { label: string; icon: typeof Flame; color: string; bg: string; border: string }> = {
  marah: {
    label: "Marah",
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
    label: "Puas",
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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return `baru saja`;
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export default function InboxPage() {
  const { isUsingSupabase } = useAuth();
  
  const [conversationsList, setConversationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch conversations function
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          status,
          sentiment,
          ai_summary,
          created_at,
          updated_at,
          customers (id, name, email, phone),
          profiles (id, name, role),
          messages (id, sender_type, content, created_at)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversationsList(data || []);
    } catch (err: any) {
      console.error("Failed to load conversations from Supabase:", err?.message || err?.details || err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Load
  useEffect(() => {
    if (isUsingSupabase) {
      fetchConversations();
    } else {
      // Dummy data mapping
      const mapped = dummyConversations.map((c) => {
        const customer = getCustomerById(c.customerId);
        const agent = c.agentId ? getAgentById(c.agentId) : null;
        const dummyMsgs = getMessagesByConversationId(c.id).map((m) => ({
          id: m.id,
          sender_type: m.senderType,
          content: m.content,
          created_at: m.createdAt,
        }));
        return {
          id: c.id,
          status: c.status,
          sentiment: c.sentiment,
          ai_summary: c.aiSummary,
          created_at: c.createdAt,
          updated_at: c.updatedAt,
          unread: c.unread,
          customers: customer ? { name: customer.name, email: customer.email } : null,
          profiles: agent ? { name: agent.name } : null,
          messages: dummyMsgs,
        };
      });
      setConversationsList(mapped);
      setLoading(false);
    }
  }, [isUsingSupabase]);

  // 2. Real-time Subscription (Supabase only)
  useEffect(() => {
    if (!isUsingSupabase) return;

    // Refresh list on any changes in conversation or message insertions
    const channel = supabase
      .channel("inbox-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUsingSupabase]);

  // 3. Filtered conversations compilation
  const filteredConversations = useMemo(() => {
    let result = [...conversationsList];
    
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const customerName = c.customers?.name || "";
        return customerName.toLowerCase().includes(q);
      });
    }

    // Sort: marah (angry) sentiment first, then by updatedAt descending
    result.sort((a, b) => {
      const sentimentOrder: Record<Sentiment, number> = { marah: 0, netral: 1, puas: 2 };
      const sa = sentimentOrder[a.sentiment as Sentiment] ?? 1;
      const sb = sentimentOrder[b.sentiment as Sentiment] ?? 1;
      if (sa !== sb) return sa - sb;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return result;
  }, [conversationsList, search, statusFilter]);

  // 4. Tab badge counts
  const counts = useMemo(() => {
    return {
      all: conversationsList.length,
      open: conversationsList.filter((c) => c.status === "open").length,
      pending: conversationsList.filter((c) => c.status === "pending").length,
      closed: conversationsList.filter((c) => c.status === "closed").length,
    };
  }, [conversationsList]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Inbox Percakapan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola obrolan pelanggan, tinjau sentimen cerdas, dan eskalasikan tiket.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-card border border-border/80 px-3.5 py-2 rounded-xl shadow-xs self-start sm:self-center">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span>{conversationsList.length} total percakapan</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10.5 rounded-xl border-border/80 focus-visible:ring-primary/30"
            aria-label="Cari pelanggan"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
          <TabsList className="h-10.5 w-full md:w-auto p-1 bg-muted/60 rounded-xl border border-border/40">
            <TabsTrigger value="all" className="cursor-pointer text-xs sm:text-sm gap-1.5 px-4 rounded-lg">
              Semua
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-background/50 font-semibold text-muted-foreground">{counts.all}</span>
            </TabsTrigger>
            <TabsTrigger value="open" className="cursor-pointer text-xs sm:text-sm gap-1.5 px-4 rounded-lg">
              Terbuka
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-info/10 font-semibold text-info">{counts.open}</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="cursor-pointer text-xs sm:text-sm gap-1.5 px-4 rounded-lg">
              Tertunda
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-warning/10 font-semibold text-warning">{counts.pending}</span>
            </TabsTrigger>
            <TabsTrigger value="closed" className="cursor-pointer text-xs sm:text-sm gap-1.5 px-4 rounded-lg">
              Selesai
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-success/10 font-semibold text-success">{counts.closed}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Skeletons Loading */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border/80 rounded-2xl p-8 shadow-xs">
          <div className="p-5 rounded-2xl bg-muted/50 mb-4 text-muted-foreground">
            <Inbox className="h-9 w-9" />
          </div>
          <h3 className="text-base font-semibold">Tidak ada percakapan</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            {search
              ? "Coba ubah kata kunci pencarian Anda."
              : "Belum ada percakapan dengan kriteria filter saat ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv, idx) => {
            const customer = conv.customers;
            const agent = conv.profiles;
            const msgs = conv.messages || [];
            
            // Sort messages to get the last one
            const sortedMsgs = [...msgs].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            const lastMsg = sortedMsgs[sortedMsgs.length - 1];
            
            const sentimentCfg = sentimentConfig[conv.sentiment as Sentiment] || sentimentConfig.netral;
            const statusCfg = statusConfig[conv.status as ConversationStatus] || statusConfig.open;
            const SentimentIcon = sentimentCfg.icon;
            const StatusIcon = statusCfg.icon;

            // Check unread condition (either local unread flag, or if last message is sent by customer and convo not closed)
            const isUnread = conv.unread || (lastMsg && lastMsg.sender_type === "customer" && conv.status !== "closed");

            return (
              <Link
                key={conv.id}
                href={`/inbox/${conv.id}`}
                className={cn(
                  "group block p-4 rounded-xl border bg-card transition-all duration-200 relative overflow-hidden",
                  "hover:border-primary/25 hover:shadow-xs hover:-translate-y-0.5",
                  isUnread
                    ? "border-primary/20 bg-primary/[0.01]"
                    : "border-border/85"
                )}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Vertical active highlight bar */}
                {isUnread && (
                  <span className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold ring-2 ring-background shadow-xs",
                      sentimentCfg.bg,
                      sentimentCfg.color
                    )}>
                      {customer?.name?.split(" ").map((n: string) => n[0]).join("") ?? "?"}
                    </div>
                    {isUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-card animate-pulse" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm truncate",
                          isUnread ? "font-bold text-foreground" : "font-semibold text-foreground/90"
                        )}>
                          {customer?.name || "Pelanggan Anonim"}
                        </span>
                        
                        {/* Sentiment */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                            sentimentCfg.bg,
                            sentimentCfg.color,
                            sentimentCfg.border
                          )}
                        >
                          <SentimentIcon className="h-3 w-3" />
                          {sentimentCfg.label}
                        </Badge>
                      </div>
                      
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 font-medium">
                        {timeAgo(conv.updated_at)}
                      </span>
                    </div>

                    <p className={cn(
                      "text-sm truncate mb-3 leading-relaxed",
                      isUnread ? "text-foreground/80 font-medium" : "text-muted-foreground"
                    )}>
                      {lastMsg?.content || "Belum ada pesan."}
                    </p>

                    <div className="flex items-center gap-2.5 flex-wrap text-[11px] font-medium">
                      {/* Status */}
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border",
                        statusCfg.bg,
                        statusCfg.color,
                        statusCfg.border
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </span>

                      {/* Agent */}
                      {agent ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-md border border-border/40">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {agent.name}
                        </span>
                      ) : (
                        <span className="text-xs text-destructive flex items-center gap-1.5 bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20 font-semibold animate-pulse-soft">
                          <User className="h-3.5 w-3.5" />
                          Belum ditugaskan
                        </span>
                      )}

                      {/* Summary indicator */}
                      {conv.ai_summary && (
                        <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI Diringkas
                        </span>
                      )}

                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/85" />
                        <span>{msgs.length} pesan</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
