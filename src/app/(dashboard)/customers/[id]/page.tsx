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

const sentimentConfig: Record<Sentiment, { label: string; icon: typeof Flame; className: string }> = {
  marah: { label: "Marah", icon: Flame, className: "bg-sentiment-angry/15 text-sentiment-angry border-sentiment-angry/30" },
  netral: { label: "Netral", icon: Minus, className: "bg-sentiment-neutral/15 text-sentiment-neutral border-sentiment-neutral/30" },
  puas: { label: "Puas", icon: Smile, className: "bg-sentiment-happy/15 text-sentiment-happy border-sentiment-happy/30" },
};

const statusConfig: Record<ConversationStatus, { label: string; icon: typeof CircleDot; className: string }> = {
  open: { label: "Terbuka", icon: CircleDot, className: "bg-info/15 text-info border-info/30" },
  pending: { label: "Tertunda", icon: Clock, className: "bg-warning/15 text-warning border-warning/30" },
  closed: { label: "Selesai", icon: CheckCircle2, className: "bg-success/15 text-success border-success/30" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
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
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold">Pelanggan tidak ditemukan</h2>
        <Link
          href="/customers"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/80"
        >
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          aria-label="Kembali ke daftar pelanggan"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">Detail pelanggan</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="border rounded-xl bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {customer.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <h2 className="text-xl font-semibold">{customer.name}</h2>
              <p className="text-sm text-muted-foreground">ID: {customer.id}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {customer.email}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
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
          <div className="border rounded-xl p-8 text-center">
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
                  className="block p-4 rounded-xl border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 gap-1 border", statCfg.className)}>
                        <StatIcon className="h-3 w-3" />
                        {statCfg.label}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 gap-1 border", sentCfg.className)}>
                        <SentIcon className="h-3 w-3" />
                        {sentCfg.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(conv.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{lastMsg?.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {agent?.name ?? "Belum ditugaskan"}
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
