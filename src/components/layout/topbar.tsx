"use client";

import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Menu, Sun, Moon, Bell, LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isUsingSupabase } = useAuth();
  const [notifHover, setNotifHover] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isUsingSupabase) {
      setUnreadCount(3);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("status", "open");

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err: any) {
        console.error("Error fetching unread count in topbar:", err);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel("topbar-unread-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUsingSupabase]);

  return (
    <header className="h-14 border-b bg-card/80 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 sticky top-0 z-30">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 cursor-pointer"
        onClick={onMenuClick}
        aria-label="Buka menu navigasi"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger
            onMouseEnter={() => setNotifHover(true)}
            onMouseLeave={() => setNotifHover(false)}
            className="h-9 w-9 relative cursor-pointer inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Notifikasi"
          >
            <Bell className={cn("h-4 w-4 transition-transform duration-200", notifHover && "animate-bounce")} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground rounded-full border-2 border-card font-medium">
                {unreadCount}
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>Notifikasi ({unreadCount} tiket terbuka)</TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger
            className="h-9 w-9 cursor-pointer inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          >
            <div className="relative h-4 w-4">
              <Sun className={cn(
                "h-4 w-4 absolute inset-0 transition-all duration-300",
                theme === "dark" ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
              )} />
              <Moon className={cn(
                "h-4 w-4 absolute inset-0 transition-all duration-300",
                theme === "light" ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
              )} />
            </div>
          </TooltipTrigger>
          <TooltipContent>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</TooltipContent>
        </Tooltip>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-9 gap-2 px-2 cursor-pointer inline-flex items-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Menu pengguna"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary">
              {user?.name.split(" ").map((n: string) => n[0]).join("") ?? "?"}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{user?.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2">
              <User className="h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive cursor-pointer gap-2 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
