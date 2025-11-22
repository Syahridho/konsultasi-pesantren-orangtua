"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, memo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  BookOpen,
  GraduationCap,
  Shield,
  MessageCircle,
  FileText,
  X,
  School,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface DashboardSidebarProps {
  role: "admin" | "ustad" | "orangtua";
}

// Pre-computed menu items with frozen objects for better performance
const menuItems = Object.freeze({
  admin: Object.freeze([
    Object.freeze({ href: "/dashboard", label: "Dashboard", icon: Home }),
    Object.freeze({
      href: "/dashboard/santri",
      label: "Data Santri",
      icon: GraduationCap,
    }),
    Object.freeze({
      href: "/dashboard/ustad",
      label: "Data Ustad",
      icon: BookOpen,
    }),
    Object.freeze({
      href: "/dashboard/kelas",
      label: "Data Kelas",
      icon: School,
    }),
    Object.freeze({
      href: "/dashboard/orangtua",
      label: "Data Orang Tua",
      icon: Users,
    }),
    Object.freeze({
      href: "/dashboard/ustad/laporan",
      label: "Daftar Laporan",
      icon: FileText,
    }),
    Object.freeze({
      href: "/dashboard/chat",
      label: "Chat",
      icon: MessageCircle,
    }),
    Object.freeze({
      href: "/dashboard/admin/settings",
      label: "Pengaturan",
      icon: Settings,
    }),
  ]),
  ustad: Object.freeze([
    Object.freeze({ href: "/dashboard", label: "Dashboard", icon: Home }),
    Object.freeze({
      href: "/dashboard/santri",
      label: "Data Santri",
      icon: GraduationCap,
    }),
    Object.freeze({
      href: "/dashboard/kelas-ustad",
      label: "Data Kelas",
      icon: School,
    }),
    Object.freeze({
      href: "/dashboard/ustad/lapor",
      label: "Input Laporan",
      icon: FileText,
    }),
    Object.freeze({
      href: "/dashboard/ustad/laporan",
      label: "Daftar Laporan",
      icon: BookOpen,
    }),
    Object.freeze({
      href: "/dashboard/chat",
      label: "Chat",
      icon: MessageCircle,
    }),
  ]),
  orangtua: Object.freeze([
    Object.freeze({ href: "/dashboard", label: "Dashboard", icon: Home }),
    Object.freeze({ href: "/home", label: "Home", icon: Home }),
    Object.freeze({
      href: "/dashboard/santri/orangtua",
      label: "Data Santri",
      icon: Users,
    }),
    Object.freeze({ href: "/dashboard/anak", label: "Anak", icon: Users }),
    Object.freeze({
      href: "/dashboard/orangtua/laporan",
      label: "Laporan Santri",
      icon: FileText,
    }),
    Object.freeze({ href: "/chat", label: "Chat", icon: MessageCircle }),
  ]),
});

const roleLabels = Object.freeze({
  admin: "Administrator",
  ustad: "Ustadz",
  orangtua: "Orang Tua",
});

const roleIcons = Object.freeze({
  admin: Shield,
  ustad: BookOpen,
  orangtua: Users,
});

// Memoized MenuItem component for performance
const MenuItem = memo(
  ({
    item,
    isActive,
    onClick,
  }: {
    item: { href: string; label: string; icon: any };
    isActive: boolean;
    onClick?: () => void;
  }) => {
    const Icon = item.icon;

    return (
      <Link href={item.href} onClick={onClick}>
        <Button
          variant={isActive ? "default" : "ghost"}
          className={cn(
            "w-full justify-start mb-1 transition-colors",
            isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Icon className="w-4 h-4 mr-3" />
          {item.label}
        </Button>
      </Link>
    );
  }
);

MenuItem.displayName = "MenuItem";

// Sidebar content component (moved outside to avoid recreation on render)
const SidebarContent = memo(
  ({
    role,
    pathname,
    session,
    onItemClick,
  }: {
    role: "admin" | "ustad" | "orangtua";
    pathname: string;
    session: any;
    onItemClick?: () => void;
  }) => {
    // Memoize icon lookup
    const RoleIcon = useMemo(() => roleIcons[role], [role]);

    // Memoize menu items for current role
    const currentMenuItems = useMemo(() => menuItems[role], [role]);

    // Memoize user initial
    const userInitial = useMemo(
      () => session?.user?.name?.charAt(0).toUpperCase() || "U",
      [session?.user?.name]
    );

    const handleSignOut = () => {
      signOut({ callbackUrl: "/login" });
    };

    return (
      <>
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <RoleIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Konsultasi App
              </h1>
              <p className="text-sm text-muted-foreground">
                {roleLabels[role]}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 pb-4 overflow-y-auto">
          {currentMenuItems.map((item) => (
            <MenuItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              onClick={onItemClick}
            />
          ))}
        </nav>

        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 hover:bg-accent/30"
                suppressHydrationWarning
              >
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    );
  }
);

SidebarContent.displayName = "SidebarContent";

function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Memoize icon lookup
  const RoleIcon = useMemo(() => roleIcons[role], [role]);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <RoleIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Konsultasi App</h1>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" suppressHydrationWarning>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 p-0"
              suppressHydrationWarning
            >
              <div className="h-full flex flex-col bg-white">
                <SidebarContent
                  role={role}
                  pathname={pathname}
                  session={session}
                  onItemClick={() => setMobileOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white shadow-lg h-screen flex-col">
        <SidebarContent role={role} pathname={pathname} session={session} />
      </div>
    </>
  );
}

// Export memoized version for better performance
export default memo(DashboardSidebar);
