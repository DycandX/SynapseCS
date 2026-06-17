"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { users } from "@/lib/dummy-data";
import {
  BotMessageSquare,
  LogIn,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const success = login(email);
    if (success) {
      router.push("/inbox");
    } else {
      setError("Email tidak ditemukan. Gunakan salah satu akun demo.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setError("");
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    login(userEmail);
    router.push("/inbox");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 items-center justify-center p-12">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/3 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 max-w-md text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <BotMessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SynapseCS</h1>
              <p className="text-sm text-primary-foreground/70">
                AI Customer Support
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold leading-tight mb-4 text-balance">
            Platform Cerdas untuk Agen Customer Service
          </h2>
          <p className="text-primary-foreground/80 mb-10 leading-relaxed">
            Kelola pesan pelanggan lebih cepat dan akurat dengan bantuan AI.
            Dari analisis sentimen hingga draf balasan otomatis.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Sparkles,
                title: "AI Draft Balasan",
                desc: "Buat balasan otomatis berdasarkan SOP",
              },
              {
                icon: Zap,
                title: "Ringkas Obrolan",
                desc: "Rangkum percakapan panjang dalam 3 poin",
              },
              {
                icon: Shield,
                title: "Analisis Sentimen",
                desc: "Deteksi otomatis emosi pelanggan",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm"
              >
                <feature.icon className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-primary-foreground/60">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground">
              <BotMessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SynapseCS</h1>
              <p className="text-xs text-muted-foreground">
                AI Customer Support
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Masuk ke Dashboard
            </h2>
            <p className="text-muted-foreground mt-1">
              Pilih akun demo atau masukkan email untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nama@synapsecs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                defaultValue="demo123"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Demo mode — password apapun diterima
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Masuk
                </span>
              )}
            </Button>
          </form>

          {/* Quick login */}
          <div>
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">
                  Akun Demo
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              {users.map((u) => (
                <Card
                  key={u.id}
                  className="cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-sm active:scale-[0.99]"
                  onClick={() => handleQuickLogin(u.email)}
                >
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
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
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                      {u.role}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
