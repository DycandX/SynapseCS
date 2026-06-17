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
  ToggleLeft,
  ToggleRight,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { users } from "@/lib/dummy-data";

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
    <div className="space-y-6">
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
          <div className="border rounded-xl bg-card p-6 space-y-6">
            <div>
              <h3 className="font-semibold">Notifikasi Email</h3>
              <p className="text-sm text-muted-foreground">
                Kelola kapan email notifikasi dikirim. Free tier: maks 100
                email/hari.
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
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className="cursor-pointer"
                  aria-label={`Toggle ${item.label}`}
                >
                  {notifications[item.key] ? (
                    <ToggleRight className="h-7 w-7 text-primary" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Team tab (admin only) */}
        {isAdmin && (
          <TabsContent value="team" className="space-y-4">
            <div className="border rounded-xl bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">Manajemen Tim</h3>
                  <p className="text-sm text-muted-foreground">
                    Kelola agen customer service.
                  </p>
                </div>
                <Button className="gap-2 cursor-pointer" disabled>
                  <UserPlus className="h-4 w-4" />
                  Tambah Agen
                </Button>
              </div>

              <div className="divide-y">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
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
          <div className="border rounded-xl bg-card p-6 space-y-6">
            <div>
              <h3 className="font-semibold">Informasi Akun</h3>
              <p className="text-sm text-muted-foreground">
                Detail akun Anda saat ini.
              </p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input value={user?.name ?? ""} readOnly className="h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email ?? ""} readOnly className="h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peran</label>
                <Input
                  value={user?.role === "admin" ? "Administrator" : "Agen CS"}
                  readOnly
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ID Pengguna</label>
                <Input
                  value={user?.id ?? ""}
                  readOnly
                  className="h-10 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
