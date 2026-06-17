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

const sentimentConfig: Record<Sentiment, { label: string; icon: typeof Flame; color: string; bg: string }> = {
  marah: {
    label: "Marah",
    icon: Flame,
    color: "text-sentiment-angry",
    bg: "bg-sentiment-angry/10",
  },
  netral: {
    label: "Netral",
    icon: Minus,
    color: "text-sentiment-neutral",
    bg: "bg-sentiment-neutral/10",
  },
  puas: {
    label: "Puas",
    icon: Smile,
    color: "text-sentiment-happy",
    bg: "bg-sentiment-happy/10",
  },
};

const statusConfig: Record<ConversationStatus, { label: string; icon: typeof CircleDot; color: string; bg: string }> = {
  open: {
    label: "Terbuka",
    icon: CircleDot,
    color: "text-info",
    bg: "bg-info/10",
  },
  pending: {
    label: "Tertunda",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  closed: {
    label: "Selesai",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola semua percakapan pelanggan dari satu tempat.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
          <MessageSquare className="h-3.5 w-3.5" />
          {conversations.length} total percakapan
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
            aria-label="Cari pelanggan"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="h-10 w-full sm:w-auto">
            <TabsTrigger value="all" className="cursor-pointer text-xs sm:text-sm gap-1.5">
              Semua
              <span className="text-xs text-muted-foreground">{counts.all}</span>
            </TabsTrigger>
            <TabsTrigger value="open" className="cursor-pointer text-xs sm:text-sm gap-1.5">
              Terbuka
              <span className="text-xs text-muted-foreground">{counts.open}</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="cursor-pointer text-xs sm:text-sm gap-1.5">
              Tertunda
              <span className="text-xs text-muted-foreground">{counts.pending}</span>
            </TabsTrigger>
            <TabsTrigger value="closed" className="cursor-pointer text-xs sm:text-sm gap-1.5">
              Selesai
              <span className="text-xs text-muted-foreground">{counts.closed}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation list */}
      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-5 rounded-2xl bg-muted mb-5">
            <Inbox className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Tidak ada percakapan</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            {search
              ? "Coba ubah kata kunci pencarian."
              : "Belum ada percakapan dengan filter ini."}
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
                  "group block p-4 rounded-xl border transition-all duration-200",
                  "hover:border-primary/25 hover:shadow-sm hover:-translate-y-0.5",
                  conv.unread
                    ? "bg-primary/[0.02] border-primary/15"
                    : "bg-card border-border"
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar with status indicator */}
                  <div className="relative shrink-0">
                    <div className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold",
                      sentimentCfg.bg,
                      sentimentCfg.color
                    )}>
                      {customer?.name.split(" ").map((n) => n[0]).join("") ?? "?"}
                    </div>
                    {conv.unread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          "text-sm truncate",
                          conv.unread ? "font-semibold text-foreground" : "font-medium text-foreground/90"
                        )}>
                          {customer?.name}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                          sentimentCfg.bg,
                          sentimentCfg.color
                        )}>
                          <SentimentIcon className="h-3 w-3" />
                          {sentimentCfg.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {timeAgo(conv.updatedAt)}
                      </span>
                    </div>

                    <p className={cn(
                      "text-sm truncate mb-2.5",
                      conv.unread ? "text-foreground/80" : "text-muted-foreground"
                    )}>
                      {lastMsg?.content}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                        statusCfg.bg,
                        statusCfg.color
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </span>

                      {agent ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {agent.name}
                        </span>
                      ) : (
                        <span className="text-xs text-destructive/80 font-medium flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Belum ditugaskan
                        </span>
                      )}

                      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <MessageSquare className="h-3 w-3" />
                        {msgs.length} pesan
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
