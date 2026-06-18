"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
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
  const { isUsingSupabase } = useAuth();
  
  const [customer, setCustomer] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load customer and history
  useEffect(() => {
    const loadCustomerData = async () => {
      setLoading(true);
      if (isUsingSupabase) {
        try {
          // Fetch customer profile
          const { data: cust, error: custError } = await supabase
            .from("customers")
            .select("*")
            .eq("id", id)
            .single();

          if (custError) throw custError;
          setCustomer(cust);

          // Fetch customer conversation history
          const { data: convs } = await supabase
            .from("conversations")
            .select(`
              id,
              status,
              sentiment,
              created_at,
              profiles(id, name),
              messages(id, content, sender_type, created_at)
            `)
            .eq("customer_id", id)
            .order("updated_at", { ascending: false });

          setConversations(convs || []);
        } catch (error) {
          console.error("Error loading customer data from Supabase:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Dummy loading
        const dummyCustomer = getCustomerById(id);
        if (dummyCustomer) {
          setCustomer({
            id: dummyCustomer.id,
            name: dummyCustomer.name,
            email: dummyCustomer.email,
            phone: dummyCustomer.phone,
            created_at: dummyCustomer.createdAt,
          });

          const dummyConvs = getConversationsByCustomerId(id).map((c) => {
            const agent = c.agentId ? getAgentById(c.agentId) : null;
            const msgs = getMessagesByConversationId(c.id);
            return {
              id: c.id,
              status: c.status,
              sentiment: c.sentiment,
              created_at: c.createdAt,
              profiles: agent ? { name: agent.name } : null,
              messages: msgs.map((m) => ({ content: m.content, sender_type: m.senderType })),
            };
          });
          setConversations(dummyConvs);
        }
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [id, isUsingSupabase]);

  if (loading) {
    return (
      <div className="space-y-4 p-6 animate-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in">
        <h2 className="text-lg font-semibold text-foreground">Pelanggan tidak ditemukan</h2>
        <Link
          href="/customers"
          className={cn(buttonVariants({ variant: "default" }), "mt-5 cursor-pointer rounded-xl")}
        >
          Kembali ke Pelanggan
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
          className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg hover:bg-muted border border-border/40 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.name}</h1>
          <p className="text-muted-foreground text-xs">Detail profil pelanggan</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="border border-border/85 rounded-xl bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-2xl font-bold text-primary shrink-0 ring-1 ring-border/80 shadow-xs">
            {customer.name.split(" ").map((n: any) => n[0]).join("")}
          </div>
          <div className="space-y-4 flex-1 min-w-0">
            <div>
              <h2 className="text-xl font-bold text-foreground">{customer.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {customer.id}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-2.5 bg-muted/40 border border-border/40 rounded-lg px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-muted/40 border border-border/40 rounded-lg px-3 py-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-muted/40 border border-border/40 rounded-lg px-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Bergabung {formatDate(customer.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation history */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4">
          Riwayat Percakapan ({conversations.length})
        </h3>

        {conversations.length === 0 ? (
          <div className="border border-border/80 rounded-xl p-10 text-center bg-card shadow-xs">
            <MessageSquare className="h-8 w-8 text-muted-foreground/80 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm font-medium">Belum ada riwayat percakapan untuk pelanggan ini.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {conversations.map((conv) => {
              const agent = conv.profiles;
              const msgs = conv.messages || [];
              const sorted = [...msgs].sort(
                (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
              );
              const lastMsg = sorted[sorted.length - 1];
              
              const sentCfg = sentimentConfig[conv.sentiment as Sentiment] || sentimentConfig.netral;
              const statCfg = statusConfig[conv.status as ConversationStatus] || statusConfig.open;
              const SentIcon = sentCfg.icon;
              const StatIcon = statCfg.icon;

              return (
                <Link
                  key={conv.id}
                  href={`/inbox/${conv.id}`}
                  className="block p-4 rounded-xl border border-border/85 bg-card transition-all duration-200 hover:border-primary/25 hover:shadow-xs hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border", statCfg.bg, statCfg.color, statCfg.border)}>
                        <StatIcon className="h-3 w-3" />
                        {statCfg.label}
                      </Badge>
                      <Badge variant="outline" className={cn("inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border", sentCfg.bg, sentCfg.color, sentCfg.border)}>
                        <SentIcon className="h-3 w-3" />
                        {sentCfg.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{formatShortDate(conv.created_at)}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate leading-relaxed">
                    {lastMsg?.content || "Belum ada pesan."}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3 text-[11px] font-semibold text-muted-foreground border-t border-border/30 pt-2.5">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {agent?.name ?? <span className="text-destructive font-semibold">Belum ditugaskan</span>}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
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
