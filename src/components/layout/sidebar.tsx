"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BotMessageSquare,
  Inbox,
  Users,
  BookOpen,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { conversations } from "@/lib/dummy-data";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Inbox",
    href: "/inbox",
    icon: Inbox,
    badge: conversations.filter((c) => c.unread).length,
  },
  { label: "Pelanggan", href: "/customers", icon: Users },
  { label: "Basis Pengetahuan", href: "/knowledge", icon: BookOpen },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

function NavItem({
  item,
  collapsed,
  isActive,
  onClick,
}: {
  item: typeof navItems[number];
  collapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}) {
  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative group",
        collapsed ? "justify-center p-2.5 w-11 h-11 mx-auto" : "px-3 py-2.5",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <div className="relative">
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" />
        )}
      </div>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <Badge
              variant="destructive"
              className="h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger className="w-full flex justify-center">
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            <p>{item.label}</p>
            {item.badge ? (
              <span className="text-xs text-muted-foreground"> ({item.badge})</span>
            ) : null}
          </TooltipContent>
        </Tooltip>
      );
    }

  return <div key={item.href}>{content}</div>;
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onItemClick,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 shrink-0 border-b border-sidebar-border",
        collapsed ? "justify-center px-2" : "gap-3 px-4"
      )}>
        <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shrink-0">
          <BotMessageSquare className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight leading-none">SynapseCS</h1>
            <p className="text-[10px] text-muted-foreground">AI Customer Support</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              isActive={isActive}
              onClick={onItemClick}
            />
          );
        })}

        {/* Collapse toggle */}
        {onToggleCollapse && (
          <div className={cn("pt-2", collapsed && "flex justify-center")}>
            <button
              onClick={onToggleCollapse}
              className={cn(
                "flex items-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer",
                collapsed ? "justify-center p-2.5 w-11 h-11 mx-auto" : "px-3 py-2.5 w-full"
              )}
              aria-label={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronsLeft className="h-4 w-4" />
                  <span>Perkecil</span>
                </>
              )}
            </button>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className={cn(
        "border-t border-sidebar-border p-3",
        collapsed && "flex flex-col items-center gap-2"
      )}>
        {user && (
          <div className={cn(
            "flex items-center gap-3",
            collapsed ? "flex-col" : ""
          )}>
            <div className={cn(
              "rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-primary shrink-0",
              collapsed ? "h-9 w-9 text-xs" : "h-8 w-8 text-xs"
            )}>
              {user.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  "shrink-0 inline-flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer",
                  collapsed ? "h-9 w-9" : "h-8 w-8"
                )}
                onClick={logout}
                aria-label="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Keluar</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent collapsed={false} onItemClick={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
