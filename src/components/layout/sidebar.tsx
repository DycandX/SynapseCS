"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shrink-0">
          <BotMessageSquare className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight leading-none">
              SynapseCS
            </h1>
            <p className="text-[10px] text-muted-foreground">
              AI Customer Support
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            const linkContent = (
              <Link
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:bg-accent",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5 shrink-0", isActive && "text-primary")}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <Badge
                        variant="destructive"
                        className="h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </>
                )}
                {collapsed && item.badge ? (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                ) : null}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger className="w-full">
                    <div className="relative">{linkContent}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    <p>{item.label}</p>
                    {item.badge ? (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        ({item.badge})
                      </span>
                    ) : null}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User section */}
      <div className="p-3 space-y-2">
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn(
              "w-full cursor-pointer",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 mr-2" />
                Perkecil
              </>
            )}
          </Button>
        )}

        {user && (
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center"
            )}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
              {user.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  "h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg hover:bg-muted cursor-pointer",
                  collapsed && "hidden"
                )}
                onClick={logout}
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
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out shrink-0",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent collapsed={false} onItemClick={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
