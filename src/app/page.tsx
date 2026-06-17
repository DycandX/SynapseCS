"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { users } from "@/lib/dummy-data";
import {
  BotMessageSquare,
  LogIn,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
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
    <div className="min-h-screen flex bg-background">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 items-center justify-center p-12">
        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />

        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-violet-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[150px]" />

        <div className="relative z-10 max-w-md">
          {/* Brand */}
          <div className={`flex items-center gap-3 mb-10 transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg">
              <BotMessageSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">SynapseCS</h1>
              <p className="text-sm text-white/60">AI Customer Support</p>
            </div>
          </div>

          {/* Headline */}
          <div className={`transition-all duration-700 delay-150 mb-10 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <h2 className="text-3xl font-semibold leading-tight text-balance text-white mb-4">
              Platform Cerdas untuk{" "}
              <span className="text-transparent bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text">Agen Customer Service</span>
          </h2>
            <p className="text-white/70 leading-relaxed text-lg">
              Kelola pesan pelanggan lebih cepat dan akurat dengan bantuan AI.
              Dari analisis sentimen hingga draf balasan otomatis.
            </p>
          </div>

          {/* Feature list */}
          <div className={`space-y-3 transition-all duration-700 delay-300 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            {[
              { icon: Sparkles, title: "AI Draft Balasan", desc: "Buat balasan otomatis berdasarkan SOP" },
              { icon: Zap, title: "Ringkas Obrolan", desc: "Rangkum percakapan panjang dalam 3 poin" },
              { icon: Shield, title: "Analisis Sentimen", desc: "Deteksi otomatis emosi pelanggan" },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.08] transition-all duration-300 group cursor-default"
              >
                <div className="p-2 rounded-lg bg-white/10 shrink-0 group-hover:bg-white/15 transition-colors">
                  <feature.icon className="h-4 w-4 text-indigo-300" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white/90">{feature.title}</p>
                  <p className="text-xs text-white/50">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-dot opacity-[0.03]" />

        <div className={`w-full max-w-md relative transition-all duration-700 delay-150 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg">
              <BotMessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SynapseCS</h1>
              <p className="text-xs text-muted-foreground">AI Customer Support</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Masuk ke Dashboard</h2>
            <p className="text-muted-foreground mt-1.5">
              Pilih akun demo atau masukkan email untuk melanjutkan.
            </p>
          </div>

          {/* Login form */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">
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
                <label htmlFor="password" className="text-sm font-medium leading-none">
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
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg animate-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 cursor-pointer gap-2"
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
          </div>

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
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u.email)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 active:scale-[0.99] group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                      {u.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                      {u.role}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
