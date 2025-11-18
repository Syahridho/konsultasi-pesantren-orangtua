"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, memo } from "react";
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
    Object.freeze({ href: "/dashboard/ustad", label: "Data Ustad", icon: BookOpen }),
    Object.freeze({ href: "/dashboard/kelas", label: "Data Kelas", icon: Users }),
    Object.freeze({ href: "/dashboard/orangtua", label: "Data Orang Tua", icon: Users }),
    Object.freeze({ href: "/dashboard/chat", label: "Chat", icon: MessageCircle }),
  ]),
  ustad: Object.freeze([
    Object.freeze({ href: "/dashboard", label: "Dashboard", icon: Home }),
    Object.freeze({
      href: "/dashboard/santri",
      label: "Data Santri",
      icon: GraduationCap,
    }),
    Object.freeze({ href: "/dashboard/ustad/lapor", label: "Input Laporan", icon: FileText }),
    Object.freeze({ href: "/dashboard/chat", label: "Chat", icon: MessageCircle }),
    Object.freeze({ href: "/dashboard/settings", label: "Pengaturan", icon: Settings }),
  ]),
  orangtua: Object.freeze([
    Object.freeze({ href: "/dashboard", label: "Dashboard", icon: Home }),
    Object.freeze({ href: "/dashboard/santri/orangtua", label: "Data Santri", icon: Users }),
    Object.freeze({ href: "/dashboard/anak", label: "Anak", icon: Users }),
    Object.freeze({ href: "/chat", label: "Chat", icon: MessageCircle }),
    Object.freeze({ href: "/dashboard/settings", label: "Pengaturan", icon: Settings }),
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
const MenuItem = memo(({ 
  item, 
  isActive 
}: { 
  item: { href: string; label: string; icon: any }; 
  isActive: boolean 
}) => {
  const Icon = item.icon;
  
  return (
    <Link href={item.href}>
      <Button
        variant={isActive ? "default" : "ghost"}
        className={cn(
          "w-full justify-start mb-1",
          isActive && "bg-blue-600 text-white hover:bg-blue-700"
        )}
      >
        <Icon className="w-4 h-4 mr-3" />
        {item.label}
      </Button>
    </Link>
  );
});

MenuItem.displayName = "MenuItem";

function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
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
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <RoleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Konsultasi App</h1>
            <p className="text-sm text-gray-500">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-4 overflow-y-auto">
        {currentMenuItems.map((item) => (
          <MenuItem 
            key={item.href} 
            item={item} 
            isActive={pathname === item.href} 
          />
        ))}
      </nav>

      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2">
              <Avatar className="w-8 h-8 mr-3">
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
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
    </div>
  );
}

// Export memoized version for better performance
export default memo(DashboardSidebar);
