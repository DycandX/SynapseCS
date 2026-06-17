"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getConversationWithDetails,
  aiDraftResponses,
  aiSummaryResponses,
  type Sentiment,
  type ConversationStatus,
  type SenderType,
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function MessageBubble({ msg }: { msg: { senderType: SenderType; content: string; createdAt: string } }) {
  if (msg.senderType === "ai_system") {
    return (
      <div className="flex justify-center animate-in">
        <div className="flex items-start gap-2 max-w-md bg-gradient-to-r from-primary/5 to-primary/[0.02] rounded-xl px-4 py-2.5 text-xs text-muted-foreground border border-primary/10">
          <Bot className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
          <span className="italic">{msg.content}</span>
        </div>
      </div>
    );
  }

  const isAgent = msg.senderType === "agent";

  return (
    <div className={cn("flex gap-3 animate-in", isAgent ? "justify-end" : "justify-start")}>
      {!isAgent && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1 ring-2 ring-background">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className={cn("max-w-[75%]", isAgent ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
            isAgent
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        <p className={cn("text-[10px] mt-1 px-1", isAgent ? "text-right text-primary-foreground/50" : "text-left text-muted-foreground")}>
          {formatTime(msg.createdAt)}
        </p>
      </div>

      {isAgent && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 mt-1 ring-2 ring-background">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const data = getConversationWithDetails(id);
  const [replyText, setReplyText] = useState("");
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiDraftText, setAiDraftText] = useState("");
  const [aiSummaryPoints, setAiSummaryPoints] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in">
        <h2 className="text-lg font-semibold">Percakapan tidak ditemukan</h2>
        <p className="text-muted-foreground text-sm mt-1">ID percakapan &quot;{id}&quot; tidak valid.</p>
        <Link
          href="/inbox"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          Kembali ke Inbox
        </Link>
      </div>
    );
  }

  const { conversation, customer, agent, messages } = data;
  const sentimentCfg = sentimentConfig[conversation.sentiment];
  const statusCfg = statusConfig[conversation.status];
  const SentimentIcon = sentimentCfg.icon;
  const StatusIcon = statusCfg.icon;

  const handleAiDraft = async () => {
    setAiDraftLoading(true);
    setShowAiDraft(true);
    await new Promise((r) => setTimeout(r, 1800));
    setAiDraftText(aiDraftResponses[conversation.id] ?? "Maaf, AI tidak dapat membuat draf untuk percakapan ini.");
    setAiDraftLoading(false);
  };

  const handleAiSummary = async () => {
    setAiSummaryLoading(true);
    setShowAiSummary(true);
    await new Promise((r) => setTimeout(r, 1500));
    setAiSummaryPoints(aiSummaryResponses[conversation.id] ?? ["Tidak ada ringkasan tersedia."]);
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

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7.5rem)] animate-in">
      {/* Left: Chat area */}
      <div className="flex-1 flex flex-col min-w-0 border rounded-xl bg-card shadow-sm overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
          <Link
            href="/inbox"
            aria-label="Kembali ke inbox"
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
            sentimentCfg.bg, sentimentCfg.color
          )}>
            {customer?.name.split(" ").map((n: string) => n[0]).join("") ?? "?"}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{customer?.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                sentimentCfg.bg, sentimentCfg.color
              )}>
                <SentimentIcon className="h-2.5 w-2.5" />
                {sentimentCfg.label}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                statusCfg.bg, statusCfg.color
              )}>
                <StatusIcon className="h-2.5 w-2.5" />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* AI action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Tooltip>
              <TooltipTrigger
                className="h-8 gap-1.5 text-xs cursor-pointer inline-flex items-center px-2.5 rounded-lg border hover:bg-muted font-medium transition-colors disabled:opacity-50"
                onClick={handleAiSummary}
                disabled={aiSummaryLoading}
              >
                <ListChecks className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ringkas</span>
              </TooltipTrigger>
              <TooltipContent>Ringkas obrolan dengan AI</TooltipContent>
            </Tooltip>

            <Button
              size="sm"
              onClick={handleAiDraft}
              disabled={aiDraftLoading}
              className="h-8 gap-1.5 text-xs cursor-pointer shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Draft</span>
            </Button>
          </div>
        </div>

        {/* AI Summary panel */}
        {showAiSummary && (
          <div className="px-4 py-3 border-b bg-info/[0.03] shrink-0 animate-in">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-sm font-medium text-info">
                <div className="p-1 rounded-md bg-info/10">
                  <ListChecks className="h-3.5 w-3.5" />
                </div>
                Ringkasan AI
              </div>
              <button
                className="h-6 w-6 cursor-pointer inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                onClick={() => setShowAiSummary(false)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {aiSummaryLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              <ul className="space-y-1.5 text-sm text-foreground/80">
                {aiSummaryPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-info/50 mt-2 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4 scrollbar-thin">
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 justify-center mb-4">
              <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {formatDate(messages[0]?.createdAt ?? conversation.createdAt)}
              </span>
            </div>

            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* AI Draft panel */}
        {showAiDraft && (
          <div className="px-4 py-3 border-t bg-primary/[0.02] shrink-0 animate-in">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <div className="p-1 rounded-md bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                Draf AI
              </div>
              <button
                className="h-6 w-6 cursor-pointer inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                onClick={() => setShowAiDraft(false)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {aiDraftLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="text-sm whitespace-pre-wrap bg-card p-4 rounded-xl border shadow-sm mb-3 max-h-40 overflow-y-auto leading-relaxed">
                  {aiDraftText}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleUseDraft} className="h-8 text-xs gap-1.5 cursor-pointer">
                    <Check className="h-3 w-3" />
                    Gunakan Draf
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyDraft} className="h-8 text-xs gap-1.5 cursor-pointer">
                    {copied ? (
                      <><Check className="h-3 w-3" />Tersalin</>
                    ) : (
                      <><Copy className="h-3 w-3" />Salin</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Reply input */}
        <div className="p-3 border-t bg-card shrink-0">
          <div className="flex items-end gap-2">
            <Tooltip>
              <TooltipTrigger
                className="h-9 w-9 shrink-0 cursor-pointer inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                aria-label="Lampirkan file"
              >
                <Paperclip className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Lampirkan file (maks 2MB)</TooltipContent>
            </Tooltip>

            <Textarea
              placeholder="Tulis balasan..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[2.75rem] max-h-32 resize-none"
              rows={1}
              aria-label="Tulis balasan"
            />

            <Button
              size="icon"
              className="h-9 w-9 shrink-0 cursor-pointer"
              disabled={!replyText.trim()}
              aria-label="Kirim balasan"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Customer profile */}
      <div className="w-full lg:w-80 shrink-0 border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Profil Pelanggan
          </h3>

          <div className="flex flex-col items-center text-center mb-5">
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold mb-3 ring-4 ring-background",
              sentimentCfg.bg, sentimentCfg.color
            )}>
              {customer?.name.split(" ").map((n: string) => n[0]).join("") ?? "?"}
            </div>
            <h4 className="font-semibold">{customer?.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{customer?.email}</p>
          </div>

          <Separator className="mb-4" />

          <div className="space-y-3.5">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-1.5 rounded-md bg-muted">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="truncate text-sm">{customer?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-1.5 rounded-md bg-muted">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span>{customer?.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-1.5 rounded-md bg-muted">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span>Bergabung {customer ? formatDate(customer.createdAt) : "-"}</span>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Detail Tiket
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ID Tiket</span>
                <span className="font-mono text-xs text-foreground/70">{conversation.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                  statusCfg.bg, statusCfg.color
                )}>
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sentimen</span>
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                  sentimentCfg.bg, sentimentCfg.color
                )}>
                  <SentimentIcon className="h-3 w-3" />
                  {sentimentCfg.label}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Agen</span>
                <span className="text-xs font-medium">
                  {agent?.name ?? <span className="text-destructive">Belum ditugaskan</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dibuat</span>
                <span className="text-xs">{formatDate(conversation.createdAt)}</span>
              </div>
            </div>
          </div>

          {conversation.aiSummary && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Ringkasan Sebelumnya
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed bg-muted/50 rounded-xl p-3">
                  {conversation.aiSummary}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
