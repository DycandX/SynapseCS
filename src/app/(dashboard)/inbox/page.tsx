"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Filter,
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

const sentimentConfig: Record<
  Sentiment,
  { label: string; icon: typeof Flame; className: string }
> = {
  marah: {
    label: "Marah",
    icon: Flame,
    className: "bg-sentiment-angry/15 text-sentiment-angry border-sentiment-angry/30",
  },
  netral: {
    label: "Netral",
    icon: Minus,
    className: "bg-sentiment-neutral/15 text-sentiment-neutral border-sentiment-neutral/30",
  },
  puas: {
    label: "Puas",
    icon: Smile,
    className: "bg-sentiment-happy/15 text-sentiment-happy border-sentiment-happy/30",
  },
};

const statusConfig: Record<
  ConversationStatus,
  { label: string; icon: typeof CircleDot; className: string }
> = {
  open: {
    label: "Terbuka",
    icon: CircleDot,
    className: "bg-info/15 text-info border-info/30",
  },
  pending: {
    label: "Tertunda",
    icon: Clock,
    className: "bg-warning/15 text-warning border-warning/30",
  },
  closed: {
    label: "Selesai",
    icon: CheckCircle2,
    className: "bg-success/15 text-success border-success/30",
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

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Search by customer name
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const customer = getCustomerById(c.customerId);
        return customer?.name.toLowerCase().includes(q);
      });
    }

    // Sort: marah first, then by updatedAt desc
    result.sort((a, b) => {
      const sentimentOrder: Record<Sentiment, number> = {
        marah: 0,
        netral: 1,
        puas: 2,
      };
      const sa = sentimentOrder[a.sentiment];
      const sb = sentimentOrder[b.sentiment];
      if (sa !== sb) return sa - sb;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [search, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: conversations.length,
      open: conversations.filter((c) => c.status === "open").length,
      pending: conversations.filter((c) => c.status === "pending").length,
      closed: conversations.filter((c) => c.status === "closed").length,
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola semua percakapan pelanggan dari satu tempat.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
            aria-label="Cari pelanggan"
          />
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-10">
            <TabsTrigger value="all" className="cursor-pointer text-xs sm:text-sm">
              Semua ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="open" className="cursor-pointer text-xs sm:text-sm">
              Terbuka ({counts.open})
            </TabsTrigger>
            <TabsTrigger value="pending" className="cursor-pointer text-xs sm:text-sm">
              Tertunda ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="closed" className="cursor-pointer text-xs sm:text-sm">
              Selesai ({counts.closed})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation list */}
      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Tidak ada percakapan</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {search
              ? "Coba ubah kata kunci pencarian."
              : "Belum ada percakapan dengan filter ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => {
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
                  "block p-4 rounded-xl border transition-all duration-200",
                  "hover:border-primary/30 hover:shadow-sm hover:bg-accent/50",
                  "active:scale-[0.995]",
                  conv.unread
                    ? "bg-primary/[0.03] border-primary/20"
                    : "bg-card border-border"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {customer?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("") ?? "?"}
                    </div>
                    {conv.unread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "font-semibold text-sm truncate",
                            conv.unread && "text-foreground"
                          )}
                        >
                          {customer?.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-5 gap-1 shrink-0 border",
                            sentimentCfg.className
                          )}
                        >
                          <SentimentIcon className="h-3 w-3" />
                          {sentimentCfg.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {timeAgo(conv.updatedAt)}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "text-sm truncate mb-2",
                        conv.unread
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {lastMsg?.content}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-5 gap-1 border",
                          statusCfg.className
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </Badge>

                      {agent ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {agent.name}
                        </span>
                      ) : (
                        <span className="text-xs text-destructive font-medium flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Belum ditugaskan
                        </span>
                      )}

                      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                        <MessageSquare className="h-3 w-3" />
                        {msgs.length}
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
