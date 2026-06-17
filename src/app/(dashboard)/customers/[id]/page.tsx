"use client";

import { use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Flame,
  Minus,
  Smile,
  Clock,
  CheckCircle2,
  CircleDot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCustomerById,
  getConversationsByCustomerId,
  getAgentById,
  getMessagesByConversationId,
  type Sentiment,
  type ConversationStatus,
} from "@/lib/dummy-data";

const sentimentConfig: Record<Sentiment, { label: string; icon: typeof Flame; color: string; bg: string }> = {
  marah: { label: "Marah", icon: Flame, color: "text-sentiment-angry", bg: "bg-sentiment-angry/10" },
  netral: { label: "Netral", icon: Minus, color: "text-sentiment-neutral", bg: "bg-sentiment-neutral/10" },
  puas: { label: "Puas", icon: Smile, color: "text-sentiment-happy", bg: "bg-sentiment-happy/10" },
};

const statusConfig: Record<ConversationStatus, { label: string; icon: typeof CircleDot; color: string; bg: string }> = {
  open: { label: "Terbuka", icon: CircleDot, color: "text-info", bg: "bg-info/10" },
  pending: { label: "Tertunda", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  closed: { label: "Selesai", icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customer = getCustomerById(id);
  const conversations = customer ? getConversationsByCustomerId(customer.id) : [];

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in">
        <h2 className="text-lg font-semibold">Pelanggan tidak ditemukan</h2>
        <Link
          href="/customers"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          aria-label="Kembali"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">Detail pelanggan</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="border rounded-xl bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0 ring-4 ring-background">
            {customer.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="text-xl font-semibold">{customer.name}</h2>
              <p className="text-sm text-muted-foreground">ID: {customer.id}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2.5 text-sm bg-muted/50 rounded-lg px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                {customer.email}
              </div>
              <div className="flex items-center gap-2.5 text-sm bg-muted/50 rounded-lg px-3 py-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-2.5 text-sm bg-muted/50 rounded-lg px-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                Bergabung {formatDate(customer.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation history */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Riwayat Percakapan ({conversations.length})
        </h3>

        {conversations.length === 0 ? (
          <div className="border rounded-xl p-10 text-center bg-card">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Belum ada percakapan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const agent = conv.agentId ? getAgentById(conv.agentId) : null;
              const msgs = getMessagesByConversationId(conv.id);
              const lastMsg = msgs[msgs.length - 1];
              const sentCfg = sentimentConfig[conv.sentiment];
              const statCfg = statusConfig[conv.status];
              const SentIcon = sentCfg.icon;
              const StatIcon = statCfg.icon;

              return (
                <Link
                  key={conv.id}
                  href={`/inbox/${conv.id}`}
                  className="block p-4 rounded-xl border bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-sm hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md", statCfg.bg, statCfg.color)}>
                        <StatIcon className="h-3 w-3" />
                        {statCfg.label}
                      </span>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md", sentCfg.bg, sentCfg.color)}>
                        <SentIcon className="h-3 w-3" />
                        {sentCfg.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatShortDate(conv.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{lastMsg?.content}</p>
                  <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {agent?.name ?? <span className="text-destructive">Belum ditugaskan</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {msgs.length} pesan
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
