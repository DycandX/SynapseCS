"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  conversations,
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
  const now = new Date("2026-06-17T12:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export default function InboxPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredConversations = useMemo(() => {
    let result = [...conversations];
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const customer = getCustomerById(c.customerId);
        return customer?.name.toLowerCase().includes(q);
      });
    }
    result.sort((a, b) => {
      const sentimentOrder: Record<Sentiment, number> = { marah: 0, netral: 1, puas: 2 };
      const sa = sentimentOrder[a.sentiment];
      const sb = sentimentOrder[b.sentiment];
      if (sa !== sb) return sa - sb;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return result;
  }, [search, statusFilter]);

  const counts = useMemo(() => ({
    all: conversations.length,
    open: conversations.filter((c) => c.status === "open").length,
    pending: conversations.filter((c) => c.status === "pending").length,
    closed: conversations.filter((c) => c.status === "closed").length,
  }), []);

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
          <span>{conversations.length} total percakapan</span>
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

      {/* Conversation list */}
      {filteredConversations.length === 0 ? (
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
            const customer = getCustomerById(conv.customerId);
            const agent = conv.agentId ? getAgentById(conv.agentId) : null;
            const msgs = getMessagesByConversationId(conv.id);
            const lastMsg = msgs[msgs.length - 1];
            const sentimentCfg = sentimentConfig[conv.sentiment];
            const statusCfg = statusConfig[conv.status];
            const SentimentIcon = sentimentCfg.icon;
            const StatusIcon = statusCfg.icon;

            return (
              <Link
                key={conv.id}
                href={`/inbox/${conv.id}`}
                className={cn(
                  "group block p-4 rounded-xl border bg-card transition-all duration-200 relative overflow-hidden",
                  "hover:border-primary/25 hover:shadow-xs hover:-translate-y-0.5",
                  conv.unread
                    ? "border-primary/20 bg-primary/[0.01]"
                    : "border-border/85"
                )}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Vertical active highlight bar */}
                {conv.unread && (
                  <span className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar with status indicator */}
                  <div className="relative shrink-0">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold ring-2 ring-background shadow-xs",
                      sentimentCfg.bg,
                      sentimentCfg.color
                    )}>
                      {customer?.name.split(" ").map((n) => n[0]).join("") ?? "?"}
                    </div>
                    {conv.unread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-card animate-pulse" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm truncate",
                          conv.unread ? "font-bold text-foreground" : "font-semibold text-foreground/90"
                        )}>
                          {customer?.name}
                        </span>
                        
                        {/* Sentiment Badge */}
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
                        {timeAgo(conv.updatedAt)}
                      </span>
                    </div>

                    <p className={cn(
                      "text-sm truncate mb-3 leading-relaxed",
                      conv.unread ? "text-foreground/80 font-medium" : "text-muted-foreground"
                    )}>
                      {lastMsg?.content}
                    </p>

                    <div className="flex items-center gap-2.5 flex-wrap text-[11px] font-medium">
                      {/* Status Badge */}
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border",
                        statusCfg.bg,
                        statusCfg.color,
                        statusCfg.border
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </span>

                      {/* Agent Badge */}
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

                      {/* AI Assisted marker */}
                      {conv.aiSummary && (
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
