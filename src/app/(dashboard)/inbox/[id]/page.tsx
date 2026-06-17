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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold">Percakapan tidak ditemukan</h2>
        <p className="text-muted-foreground text-sm mt-1">
          ID percakapan &quot;{id}&quot; tidak valid.
        </p>
        <Link
          href="/inbox"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/80"
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
    setAiDraftText(
      aiDraftResponses[conversation.id] ??
        "Maaf, AI tidak dapat membuat draf untuk percakapan ini."
    );
    setAiDraftLoading(false);
  };

  const handleAiSummary = async () => {
    setAiSummaryLoading(true);
    setShowAiSummary(true);
    await new Promise((r) => setTimeout(r, 1500));
    setAiSummaryPoints(
      aiSummaryResponses[conversation.id] ?? ["Tidak ada ringkasan tersedia."]
    );
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
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7.5rem)]">
      {/* Left: Chat area */}
      <div className="flex-1 flex flex-col min-w-0 border rounded-xl bg-card overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
          <Link
            href="/inbox"
            aria-label="Kembali ke inbox"
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {customer?.name
              .split(" ")
              .map((n: string) => n[0])
              .join("") ?? "?"}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">
              {customer?.name}
            </h2>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 gap-0.5 border",
                  sentimentCfg.className
                )}
              >
                <SentimentIcon className="h-2.5 w-2.5" />
                {sentimentCfg.label}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 gap-0.5 border",
                  statusCfg.className
                )}
              >
                <StatusIcon className="h-2.5 w-2.5" />
                {statusCfg.label}
              </Badge>
            </div>
          </div>

          {/* AI action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger
                className="h-8 gap-1.5 text-xs cursor-pointer inline-flex items-center px-2.5 rounded-lg border hover:bg-muted font-medium disabled:opacity-50"
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
              className="h-8 gap-1.5 text-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Draft</span>
            </Button>
          </div>
        </div>

        {/* AI Summary panel */}
        {showAiSummary && (
          <div className="px-4 py-3 border-b bg-info/5 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-info">
                <ListChecks className="h-4 w-4" />
                Ringkasan AI
              </div>
              <button
                className="h-6 w-6 cursor-pointer inline-flex items-center justify-center rounded hover:bg-muted"
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
              <ol className="list-decimal list-inside space-y-1 text-sm text-foreground/80">
                {aiSummaryPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Date header */}
            <div className="flex items-center gap-3 justify-center mb-2">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
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
          <div className="px-4 py-3 border-t bg-primary/5 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Draf AI
              </div>
              <button
                className="h-6 w-6 cursor-pointer inline-flex items-center justify-center rounded hover:bg-muted"
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
                <div className="text-sm whitespace-pre-wrap bg-card p-3 rounded-lg border mb-2 max-h-40 overflow-y-auto">
                  {aiDraftText}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleUseDraft}
                    className="h-7 text-xs gap-1.5 cursor-pointer"
                  >
                    <Check className="h-3 w-3" />
                    Gunakan Draf
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDraft}
                    className="h-7 text-xs gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Salin
                      </>
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
                className="h-9 w-9 shrink-0 cursor-pointer inline-flex items-center justify-center rounded-lg hover:bg-muted"
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
      <div className="w-full lg:w-80 shrink-0 border rounded-xl bg-card overflow-hidden">
        <div className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Profil Pelanggan
          </h3>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mb-3">
              {customer?.name
                .split(" ")
                .map((n: string) => n[0])
                .join("") ?? "?"}
            </div>
            <h4 className="font-semibold">{customer?.name}</h4>
            <p className="text-xs text-muted-foreground">{customer?.email}</p>
          </div>

          <Separator className="mb-4" />

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{customer?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{customer?.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                Bergabung {customer ? formatDate(customer.createdAt) : "-"}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Detail Tiket
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Tiket</span>
                <span className="font-mono text-xs">{conversation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
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
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sentimen</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 gap-1 border",
                    sentimentCfg.className
                  )}
                >
                  <SentimentIcon className="h-3 w-3" />
                  {sentimentCfg.label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agen</span>
                <span className="text-xs">
                  {agent?.name ?? (
                    <span className="text-destructive">Belum ditugaskan</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span className="text-xs">
                  {formatDate(conversation.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {conversation.aiSummary && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Ringkasan Sebelumnya
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
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

// ──────── Message Bubble Component ────────

function MessageBubble({
  msg,
}: {
  msg: { senderType: SenderType; content: string; createdAt: string };
}) {
  if (msg.senderType === "ai_system") {
    return (
      <div className="flex justify-center">
        <div className="flex items-start gap-2 max-w-md bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border/50">
          <Bot className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
          <span>{msg.content}</span>
        </div>
      </div>
    );
  }

  const isAgent = msg.senderType === "agent";

  return (
    <div
      className={cn("flex gap-2", isAgent ? "justify-end" : "justify-start")}
    >
      {!isAgent && (
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isAgent
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p
          className={cn(
            "text-[10px] mt-1.5",
            isAgent ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {formatTime(msg.createdAt)}
        </p>
      </div>

      {isAgent && (
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
    </div>
  );
}
