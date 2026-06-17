"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Mail,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { users } from "@/lib/dummy-data";

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

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [notifications, setNotifications] = useState({
    urgentTickets: true,
    newMessages: true,
    dailySummary: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola pengaturan akun dan sistem.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2 cursor-pointer">
            <Bell className="h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="team" className="gap-2 cursor-pointer">
              <Users className="h-4 w-4" />
              Tim
            </TabsTrigger>
          )}
          <TabsTrigger value="account" className="gap-2 cursor-pointer">
            <Shield className="h-4 w-4" />
            Akun
          </TabsTrigger>
        </TabsList>

        {/* Notifications tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="border rounded-xl bg-card p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notifikasi Email
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola kapan email notifikasi dikirim. Free tier: maks 100 email/hari.
              </p>
            </div>

            <Separator />

            {[
              {
                key: "urgentTickets" as const,
                label: "Tiket Darurat",
                desc: "Kirim email saat ada tiket dengan sentimen 'Marah' masuk",
                icon: Mail,
              },
              {
                key: "newMessages" as const,
                label: "Pesan Baru",
                desc: "Kirim email saat ada pesan baru dari pelanggan",
                icon: Bell,
              },
              {
                key: "dailySummary" as const,
                label: "Ringkasan Harian",
                desc: "Kirim ringkasan tiket harian setiap pukul 08:00",
                icon: SettingsIcon,
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-muted shrink-0">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
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
            <div className="border rounded-xl bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Manajemen Tim
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kelola agen customer service.
                  </p>
                </div>
                <Button className="gap-2 cursor-pointer shadow-sm" disabled>
                  <UserPlus className="h-4 w-4" />
                  Tambah Agen
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant={u.role === "admin" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Account tab */}
        <TabsContent value="account" className="space-y-4">
          <div className="border rounded-xl bg-card p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Informasi Akun
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Detail akun Anda saat ini.
              </p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input value={user?.name ?? ""} readOnly className="h-10 bg-muted/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email ?? ""} readOnly className="h-10 bg-muted/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peran</label>
                <Input
                  value={user?.role === "admin" ? "Administrator" : "Agen CS"}
                  readOnly
                  className="h-10 bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ID Pengguna</label>
                <Input
                  value={user?.id ?? ""}
                  readOnly
                  className="h-10 font-mono text-xs bg-muted/50"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
