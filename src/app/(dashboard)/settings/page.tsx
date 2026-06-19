"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getProfilesAction,
  getActivityLogsAction,
} from "@/app/actions";
import {
  Users,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Mail,
  UserPlus,
  Clock,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { users as dummyUsers } from "@/lib/dummy-data";

function ToggleSwitch({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
        enabled ? "bg-primary" : "bg-muted-foreground/25"
      )}
      aria-label={label}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " " + date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const actionBadgeConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CLAIM_TICKET: {
    label: "Klaim Tiket",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-900/30",
  },
  SEND_MESSAGE: {
    label: "Pesan",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/30",
  },
  ADD_SOP: {
    label: "Update SOP",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200 dark:border-green-900/30",
  },
  AI_SUMMARY: {
    label: "Ringkasan AI",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-900/30",
  },
  SYSTEM_ESCALATION: {
    label: "Eskalasi",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-900/30",
  },
  SYSTEM_ERROR: {
    label: "Error",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/30",
  },
};

export default function SettingsPage() {
  const { user, isUsingSupabase } = useAuth();
  const isAdmin = user?.role === "admin";

  const [notifications, setNotifications] = useState({
    urgentTickets: true,
    newMessages: true,
    dailySummary: false,
  });

  // Dynamic states
  const [teamList, setTeamList] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // 1. Fetch team profiles
  useEffect(() => {
    const fetchTeam = async () => {
      setTeamLoading(true);
      if (isUsingSupabase) {
        const data = await getProfilesAction();
        setTeamList(data);
      } else {
        setTeamList(dummyUsers);
      }
      setTeamLoading(false);
    };
    fetchTeam();
  }, [isUsingSupabase]);

  // 2. Fetch activity logs (Admin only)
  useEffect(() => {
    if (!isAdmin) return;
    const fetchLogs = async () => {
      setLogsLoading(true);
      if (isUsingSupabase) {
        const data = await getActivityLogsAction();
        setActivityLogs(data);
      } else {
        // Dummy mock logs fallback
        setActivityLogs([
          {
            id: "log1",
            action: "CLAIM_TICKET",
            description: "Budi Santoso telah mengklaim tiket obrolan #conv1",
            created_at: new Date(Date.now() - 1200000).toISOString(),
            profiles: { name: "Budi Santoso", role: "agent" },
          },
          {
            id: "log2",
            action: "SEND_MESSAGE",
            description: "Budi Santoso mengirim balasan ke tiket #conv1",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            profiles: { name: "Budi Santoso", role: "agent" },
          },
          {
            id: "log3",
            action: "ADD_SOP",
            description: "Admin Rina Agustina menambahkan dokumen SOP baru: \"SOP Reset Password Pelanggan\"",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            profiles: { name: "Rina Agustina", role: "admin" },
          },
        ]);
      }
      setLogsLoading(false);
    };
    fetchLogs();
  }, [isAdmin, isUsingSupabase]);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola konfigurasi tim, notifikasi email, audit log, dan detail akun Anda.
          </p>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="flex overflow-x-auto scrollbar-none [scrollbar-width:none]">
          <TabsTrigger value="notifications" className="gap-2 cursor-pointer shrink-0">
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="team" className="gap-2 cursor-pointer shrink-0">
              <Users className="h-4 w-4" />
              Tim CS
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="activity" className="gap-2 cursor-pointer shrink-0">
              <Activity className="h-4 w-4" />
              Log Aktivitas
            </TabsTrigger>
          )}
          <TabsTrigger value="account" className="gap-2 cursor-pointer shrink-0">
            <Shield className="h-4 w-4" />
            Akun Saya
          </TabsTrigger>
        </TabsList>

        {/* Notifications tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="border border-border/80 rounded-xl bg-card p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notifikasi Email
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola kapan email notifikasi darurat dikirim ke administrator.
              </p>
            </div>

            <Separator className="bg-border/60" />

            {[
              {
                key: "urgentTickets" as const,
                label: "Tiket Darurat (Sentimen Marah)",
                desc: "Kirim email darurat otomatis via Resend saat pelanggan terdeteksi MARAH",
                icon: Mail,
              },
              {
                key: "newMessages" as const,
                label: "Pesan Masuk Baru",
                desc: "Kirim ringkasan notifikasi email untuk obrolan masuk baru",
                icon: Bell,
              },
              {
                key: "dailySummary" as const,
                label: "Ringkasan Kinerja Harian",
                desc: "Kirim email laporan statistik performa CSAT setiap pagi pukul 08:00",
                icon: SettingsIcon,
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0 border border-border/40">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/90">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={notifications[item.key]}
                  onChange={() => toggleNotification(item.key)}
                  label={item.label}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Team tab (admin only) */}
        {isAdmin && (
          <TabsContent value="team" className="space-y-4">
            <div className="border border-border/80 rounded-xl bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Manajemen Tim CS
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Daftar seluruh staf agen dan administrator yang terdaftar di sistem.
                  </p>
                </div>
                <Button className="gap-2 cursor-not-allowed shadow-xs rounded-xl" disabled variant="outline">
                  <UserPlus className="h-4 w-4" />
                  Tambah Agen
                </Button>
              </div>

              {teamLoading ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ) : (
                <div className="divide-y rounded-xl border border-border/80 overflow-hidden bg-background">
                  {teamList.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-sm font-bold text-primary border shadow-xs shrink-0">
                          {u.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground/90">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className="capitalize font-semibold text-xs px-2.5 py-0.5 rounded-md border"
                      >
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Activity Logs tab (admin only) */}
        {isAdmin && (
          <TabsContent value="activity" className="space-y-4">
            <div className="border border-border/80 rounded-xl bg-card p-6 shadow-xs">
              <div className="mb-5">
                <h3 className="font-semibold flex items-center gap-2 text-foreground">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Audit Log Aktivitas Tim
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Pantau riwayat tindakan agen, pengiriman pesan, pembaruan SOP, eskalasi darurat, dan log sistem.
                </p>
              </div>

              {logsLoading ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl bg-background">
                  <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-semibold">Belum ada catatan aktivitas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/80 bg-background">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40 font-bold text-muted-foreground/95">
                        <th className="p-3.5">Waktu</th>
                        <th className="p-3.5">Pelaku (Agen)</th>
                        <th className="p-3.5">Kategori</th>
                        <th className="p-3.5">Rincian Aktivitas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {activityLogs.map((log) => {
                        const actor = log.profiles?.name || "System AI";
                        const isSystem = !log.profiles;
                        const role = log.profiles?.role || "system";
                        
                        const badgeCfg = actionBadgeConfig[log.action] || {
                          label: log.action,
                          color: "text-muted-foreground",
                          bg: "bg-muted",
                          border: "border-border",
                        };

                        return (
                          <tr key={log.id} className="hover:bg-muted/15 transition-colors font-medium">
                            <td className="p-3.5 text-muted-foreground whitespace-nowrap flex items-center gap-1.5 font-medium">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                              {formatDateTime(log.created_at)}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground/90">{actor}</span>
                                <Badge variant="outline" className={cn("text-[9px] px-1 py-0.5 rounded font-bold uppercase", isSystem ? "bg-primary/5 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border/50")}>
                                  {role}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border", badgeCfg.bg, badgeCfg.color, badgeCfg.border)}>
                                {badgeCfg.label}
                              </span>
                            </td>
                            <td className="p-3.5 text-foreground/80 leading-relaxed font-sans font-medium">
                              {log.description}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Account tab */}
        <TabsContent value="account" className="space-y-4">
          <div className="border border-border/80 rounded-xl bg-card p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Informasi Akun
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Detail profil dan kredensial akun agen Anda saat ini.
              </p>
            </div>

            <Separator className="bg-border/60" />

            <div className="grid gap-4 sm:grid-cols-2 font-medium">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Nama Staf</label>
                <Input value={user?.name ?? ""} readOnly className="h-10 bg-muted/40 font-semibold border-border/85" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Alamat Email</label>
                <Input value={user?.email ?? ""} readOnly className="h-10 bg-muted/40 font-semibold border-border/85" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Peran Hak Akses</label>
                <Input
                  value={user?.role === "admin" ? "Administrator Utama" : "Agen Customer Service"}
                  readOnly
                  className="h-10 bg-muted/40 font-semibold border-border/85"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">ID Pengguna Supabase</label>
                <Input
                  value={user?.id ?? ""}
                  readOnly
                  className="h-10 font-mono text-[11px] bg-muted/40 border-border/85 text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
