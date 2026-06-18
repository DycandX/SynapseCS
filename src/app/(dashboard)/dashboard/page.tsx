"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { getDashboardStatsAction } from "@/app/actions";
import {
  Inbox,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Smile,
  Flame,
  Minus,
  ArrowRight,
  BookOpen,
  Settings,
  MessageSquare,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  conversations as dummyConversations,
  users as dummyUsers,
  getCustomerById,
  getMessagesByConversationId,
  type Sentiment,
  type ConversationStatus,
} from "@/lib/dummy-data";

const sentimentConfig: Record<Sentiment, { label: string; icon: typeof Flame; color: string; bg: string; fill: string }> = {
  marah: {
    label: "Marah / Kecewa",
    icon: Flame,
    color: "text-sentiment-angry",
    bg: "bg-sentiment-angry/10",
    fill: "bg-sentiment-angry",
  },
  netral: {
    label: "Netral",
    icon: Minus,
    color: "text-sentiment-neutral",
    bg: "bg-sentiment-neutral/10",
    fill: "bg-sentiment-neutral",
  },
  puas: {
    label: "Puas / Senang",
    icon: Smile,
    color: "text-sentiment-happy",
    bg: "bg-sentiment-happy/10",
    fill: "bg-sentiment-happy",
  },
};

export default function DashboardPage() {
  const { user: currentUser, isUsingSupabase } = useAuth();
  
  // Dashboard states
  const [stats, setStats] = useState<any>({
    total: 0,
    open: 0,
    pending: 0,
    closed: 0,
    totalCustomers: 0,
    csatPercent: 90,
    sentimentBreakdown: { marah: 0, netral: 0, puas: 0 },
  });
  const [urgentEscalations, setUrgentEscalations] = useState<any[]>([]);
  const [agentWorkloads, setAgentWorkloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current date string in Indonesian format
  const currentDateStr = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  // 1. Fetch dashboard data (Supabase or Dummy fallback)
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      if (isUsingSupabase) {
        try {
          // Fetch statistics
          const statsData = await getDashboardStatsAction();
          if (statsData) {
            setStats(statsData);
          }

          // Fetch urgent escalations (open/pending and angry sentiment)
          const { data: urgents } = await supabase
            .from("conversations")
            .select("id, status, sentiment, updated_at, customer_id, customers(name)")
            .neq("status", "closed")
            .eq("sentiment", "marah")
            .order("updated_at", { ascending: false });

          const mappedUrgents = [];
          if (urgents) {
            for (const convo of urgents) {
              const { data: lastMsg } = await supabase
                .from("messages")
                .select("content")
                .eq("conversation_id", convo.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
              
              mappedUrgents.push({
                id: convo.id,
                sentiment: convo.sentiment,
                updatedAt: convo.updated_at,
                customer: convo.customers,
                lastMessage: lastMsg?.content || "Tidak ada pesan",
                messageCount: 1, // simplified representation
              });
            }
          }
          setUrgentEscalations(mappedUrgents);

          // Fetch agent active workloads
          const { data: profiles } = await supabase
            .from("profiles")
            .select("*");

          if (profiles) {
            const mappedAgents = [];
            for (const u of profiles) {
              const { count: activeCount } = await supabase
                .from("conversations")
                .select("*", { count: "exact", head: true })
                .eq("agent_id", u.id)
                .neq("status", "closed");

              const { count: closedCount } = await supabase
                .from("conversations")
                .select("*", { count: "exact", head: true })
                .eq("agent_id", u.id)
                .eq("status", "closed");
              
              mappedAgents.push({
                id: u.id,
                name: u.name,
                role: u.role,
                activeChats: activeCount || 0,
                closedChats: closedCount || 0,
                status: u.role === "admin" ? "online" : (activeCount && activeCount > 2 ? "busy" : "online"),
              });
            }
            setAgentWorkloads(mappedAgents);
          }
        } catch (error) {
          console.error("Failed to load dashboard statistics:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Fallback to dummy data
        const total = dummyConversations.length;
        const open = dummyConversations.filter((c) => c.status === "open").length;
        const pending = dummyConversations.filter((c) => c.status === "pending").length;
        const closed = dummyConversations.filter((c) => c.status === "closed").length;
        
        const rated = dummyConversations.filter((c) => c.status === "closed");
        const satisfied = rated.filter((c) => c.sentiment === "puas").length;
        const csatPercent = rated.length > 0 ? Math.round((satisfied / rated.length) * 100) : 92;

        const angryCount = dummyConversations.filter((c) => c.sentiment === "marah").length;
        const neutralCount = dummyConversations.filter((c) => c.sentiment === "netral").length;
        const happyCount = dummyConversations.filter((c) => c.sentiment === "puas").length;

        setStats({
          total,
          open,
          pending,
          closed,
          totalCustomers: 6,
          csatPercent,
          sentimentBreakdown: { marah: angryCount, netral: neutralCount, puas: happyCount },
        });

        // Urgent dummy escalations
        const dummyUrgents = dummyConversations
          .filter((c) => c.status !== "closed" && c.sentiment === "marah")
          .map((c) => {
            const customer = getCustomerById(c.customerId);
            const msgs = getMessagesByConversationId(c.id);
            const lastMsg = msgs[msgs.length - 1];
            return {
              id: c.id,
              sentiment: c.sentiment,
              updatedAt: c.updatedAt,
              customer,
              lastMessage: lastMsg?.content ?? "Tidak ada pesan",
              messageCount: msgs.length,
            };
          });
        setUrgentEscalations(dummyUrgents);

        // Dummy agent workloads
        const dummyAgents = dummyUsers.map((u) => {
          const activeChats = dummyConversations.filter(
            (c) => c.agentId === u.id && c.status !== "closed"
          ).length;
          const closedChats = dummyConversations.filter(
            (c) => c.agentId === u.id && c.status === "closed"
          ).length;
          
          let status: "online" | "offline" | "busy" = "online";
          if (u.id === "u1") status = "online";
          else if (activeChats > 2) status = "busy";
          
          return {
            id: u.id,
            name: u.name,
            role: u.role,
            activeChats,
            closedChats,
            status,
          };
        });
        setAgentWorkloads(dummyAgents);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isUsingSupabase]);

  // Real-time updates subscription for statistics (Supabase only)
  useEffect(() => {
    if (!isUsingSupabase) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        // Reload dashboard details on conversation state updates
        const reloadData = async () => {
          const statsData = await getDashboardStatsAction();
          if (statsData) setStats(statsData);
        };
        reloadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUsingSupabase]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Selamat Pagi, {currentUser?.name || "Agen"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Berikut ringkasan performa dukungan pelanggan hari ini • <span className="font-medium text-foreground/80">{currentDateStr}</span>
          </p>
        </div>
        
        {/* Quick status pill */}
        <div className="flex items-center gap-2 self-start md:self-center bg-card border border-border/80 rounded-xl px-4 py-2 shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
          </span>
          <span className="text-xs font-semibold">Sistem Aktif & AI Siaga</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Conversations */}
        <Card className="glass hover:border-primary/25 hover:shadow-xs transition-all duration-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium flex items-center justify-between">
              Total Tiket
              <Inbox className="h-4 w-4 text-primary/75" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Semua percakapan masuk</p>
          </CardContent>
        </Card>

        {/* Open Tiket */}
        <Card className="glass hover:border-info/25 hover:shadow-xs transition-all duration-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium flex items-center justify-between">
              Terbuka
              <AlertCircle className="h-4 w-4 text-info/75" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-info">{stats.open}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Butuh respon segera</p>
          </CardContent>
        </Card>

        {/* Pending Tiket */}
        <Card className="glass hover:border-warning/25 hover:shadow-xs transition-all duration-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium flex items-center justify-between">
              Tertunda
              <Clock className="h-4 w-4 text-warning/75" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Menunggu info pelanggan</p>
          </CardContent>
        </Card>

        {/* Closed Tiket */}
        <Card className="glass hover:border-success/25 hover:shadow-xs transition-all duration-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium flex items-center justify-between">
              Selesai
              <CheckCircle2 className="h-4 w-4 text-success/75" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success">{stats.closed}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Terselesaikan penuh</p>
          </CardContent>
        </Card>

        {/* CSAT */}
        <Card className="glass hover:border-success/25 hover:shadow-xs transition-all duration-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium flex items-center justify-between">
              Kepuasan (CSAT)
              <Smile className="h-4 w-4 text-success/75" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-success">{stats.csatPercent}%</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> Target 90% terlampaui
            </p>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card className="glass hover:border-primary/25 hover:shadow-xs transition-all duration-200">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium flex items-center justify-between">
              Waktu Respon
              <Clock className="h-4 w-4 text-primary/75" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">8.2m</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Rata-rata kecepatan balas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Middle Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Escalations Panel */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sentiment-angry/10 text-sentiment-angry">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Eskalasi Mendesak</CardTitle>
                    <CardDescription className="text-xs">Tiket dengan sentimen marah/frustrasi yang aktif</CardDescription>
                  </div>
                </div>
                {urgentEscalations.length > 0 && (
                  <Badge variant="destructive" className="h-5 animate-pulse font-medium text-xs px-2">
                    {urgentEscalations.length} Butuh Penanganan
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : urgentEscalations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="p-3.5 rounded-full bg-success/10 text-success mb-3">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-semibold">Semua Aman!</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Tidak ada pelanggan dengan tingkat kekecewaan tinggi saat ini.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {urgentEscalations.map((esc) => {
                    return (
                      <div
                        key={esc.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{esc.customer?.name || "Pelanggan"}</span>
                            <Badge className="bg-sentiment-angry/10 text-sentiment-angry hover:bg-sentiment-angry/15 border-0 font-medium text-[10px] h-4.5 px-1.5 gap-0.5">
                              <Flame className="h-2.5 w-2.5" />
                              Marah
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[450px]">
                            {esc.lastMessage}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Diperbarui {new Date(esc.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                        <Link
                          href={`/inbox/${esc.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "self-start sm:self-center text-xs h-8.5 font-medium border-border/80 hover:bg-accent cursor-pointer gap-1.5"
                          )}
                        >
                          Bantu Sekarang
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sentiment Analysis Gauge Widget */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold">Analisis Sentimen Pelanggan</CardTitle>
              <CardDescription className="text-xs">Distribusi emosi dari seluruh percakapan terdaftar</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* sentiment horizontal stack bar */}
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full overflow-hidden bg-muted flex">
                  {/* Puas */}
                  <div
                    className="h-full bg-sentiment-happy transition-all"
                    style={{
                      width: `${stats.total > 0 ? (stats.sentimentBreakdown.puas / stats.total) * 100 : 0}%`,
                    }}
                    title={`Puas: ${stats.sentimentBreakdown.puas}`}
                  />
                  {/* Netral */}
                  <div
                    className="h-full bg-sentiment-neutral transition-all"
                    style={{
                      width: `${stats.total > 0 ? (stats.sentimentBreakdown.netral / stats.total) * 100 : 0}%`,
                    }}
                    title={`Netral: ${stats.sentimentBreakdown.netral}`}
                  />
                  {/* Marah */}
                  <div
                    className="h-full bg-sentiment-angry transition-all"
                    style={{
                      width: `${stats.total > 0 ? (stats.sentimentBreakdown.marah / stats.total) * 100 : 0}%`,
                    }}
                    title={`Marah: ${stats.sentimentBreakdown.marah}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Distribusi Sentimen (%)</span>
                  <span>{stats.total} Total Tiket</span>
                </div>
              </div>

              {/* Grid Legend with percentages & raw counts */}
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Puas */}
                <div className="p-3 rounded-xl bg-sentiment-happy/5 border border-sentiment-happy/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sentiment-happy shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground/90">Puas / Senang</p>
                      <p className="text-[10px] text-muted-foreground">{stats.sentimentBreakdown.puas} percakapan</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-sentiment-happy">
                    {stats.total > 0 ? Math.round((stats.sentimentBreakdown.puas / stats.total) * 100) : 0}%
                  </span>
                </div>

                {/* Netral */}
                <div className="p-3 rounded-xl bg-sentiment-neutral/5 border border-sentiment-neutral/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sentiment-neutral shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground/90">Netral</p>
                      <p className="text-[10px] text-muted-foreground">{stats.sentimentBreakdown.netral} percakapan</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-sentiment-neutral">
                    {stats.total > 0 ? Math.round((stats.sentimentBreakdown.netral / stats.total) * 100) : 0}%
                  </span>
                </div>

                {/* Marah */}
                <div className="p-3 rounded-xl bg-sentiment-angry/5 border border-sentiment-angry/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sentiment-angry shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground/90">Marah / Kecewa</p>
                      <p className="text-[10px] text-muted-foreground">{stats.sentimentBreakdown.marah} percakapan</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-sentiment-angry">
                    {stats.total > 0 ? Math.round((stats.sentimentBreakdown.marah / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold">Aksi Cepat</CardTitle>
              <CardDescription className="text-xs">Akses instan ke menu esensial</CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid gap-2">
              <Link
                href="/inbox"
                className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-accent hover:border-primary/25 transition-all text-sm font-medium group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Buka Inbox</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Balas pesan pelanggan</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/customers"
                className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-accent hover:border-primary/25 transition-all text-sm font-medium group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-info/10 text-info group-hover:bg-info/15 transition-colors">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Basis Data Pelanggan</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Lihat data & riwayat</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-info transition-colors" />
              </Link>

              <Link
                href="/knowledge"
                className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-accent hover:border-primary/25 transition-all text-sm font-medium group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-success/10 text-success group-hover:bg-success/15 transition-colors">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Kelola SOP</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Perbarui basis pengetahuan</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-success transition-colors" />
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-accent hover:border-primary/25 transition-all text-sm font-medium group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-muted/80 transition-colors">
                  <Settings className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-none">Pengaturan Sistem</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Konfigurasi tim & profil</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </CardContent>
          </Card>

          {/* Active Agents */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold">Status Keaktifan Tim</CardTitle>
              <CardDescription className="text-xs">Beban kerja aktif per agen terdaftar</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                agentWorkloads.map((agent) => {
                  const isOnline = agent.status === "online";
                  const isBusy = agent.status === "busy";
                  
                  return (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 hover:bg-muted/20 transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xs font-bold text-primary ring-1 ring-border">
                          {agent.name.split(" ").map((n: any) => n[0]).join("")}
                        </div>
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card",
                          isOnline ? "bg-success" : isBusy ? "bg-warning" : "bg-muted-foreground"
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize leading-none mt-0.5">{agent.role}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Tooltip>
                          <TooltipTrigger className="cursor-default">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">
                              {agent.activeChats} Aktif
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Beban obrolan aktif
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-[10px] text-muted-foreground">
                          {agent.closedChats} Selesai
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
