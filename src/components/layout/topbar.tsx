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

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-card/80 backdrop-blur-sm flex items-center gap-3 px-4 shrink-0 sticky top-0 z-30">
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
            className="h-9 w-9 relative cursor-pointer inline-flex items-center justify-center rounded-lg hover:bg-muted"
            aria-label="Notifikasi"
          >
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground border-2 border-card">
              3
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Notifikasi</TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger
            className="h-9 w-9 cursor-pointer inline-flex items-center justify-center rounded-lg hover:bg-muted"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Beralih ke mode terang"
                : "Beralih ke mode gelap"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
          </TooltipContent>
        </Tooltip>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-9 gap-2 px-2 cursor-pointer inline-flex items-center rounded-lg hover:bg-muted"
            aria-label="Menu pengguna"
          >
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {user?.name
                .split(" ")
                .map((n: string) => n[0])
                .join("") ?? "?"}
            </div>
            <span className="text-sm font-medium hidden sm:inline">
              {user?.name}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
