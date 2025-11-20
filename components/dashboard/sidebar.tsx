"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useClasses } from "@/lib/hooks/useClasses";

interface DashboardSidebarProps {
  role: "admin" | "ustad" | "orangtua";
}

const menuItems = {
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    {
      href: "/dashboard/santri/semua",
      label: "Semua Santri",
      icon: GraduationCap,
    },
    { href: "/dashboard/orangtua", label: "Orang Tua", icon: BookOpen },
    { href: "/dashboard/ustad", label: "Ustad", icon: BookOpen },
    { href: "/dashboard/approvals", label: "Persetujuan", icon: UserCheck },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ],
  ustad: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    {
      href: "/dashboard/santri/semua",
      label: "Semua Santri",
      icon: GraduationCap,
    },
    { href: "/dashboard/kelas-ustad", label: "Kelas Saya", icon: BookOpen },
    { href: "/dashboard/konsultasi", label: "Konsultasi", icon: BookOpen },
    { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ],
  orangtua: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/santri/orangtua", label: "Data Santri", icon: Users },
    { href: "/dashboard/anak", label: "Anak", icon: Users },
    { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ],
};

const roleLabels = {
  admin: "Administrator",
  ustad: "Ustadz",
  orangtua: "Orang Tua",
};

const roleIcons = {
  admin: Shield,
  ustad: BookOpen,
  orangtua: Users,
};

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isClassesExpanded, setIsClassesExpanded] = useState(false);
  const RoleIcon = roleIcons[role];

  // Fetch ustad's classes if role is ustad
  const { classes: ustadClasses, loading: classesLoading } = useClasses(
    role === "ustad" && session?.user?.id
      ? { ustadId: session.user.id }
      : undefined
  );

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <RoleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Konsultasi App</h1>
            <p className="text-sm text-gray-500">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      <nav className="px-4 pb-4">
        {menuItems[role].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // Special handling for "Kelas Saya" menu item
          if (role === "ustad" && item.href === "/dashboard/kelas-ustad") {
            return (
              <div key={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start mb-1",
                    pathname.startsWith("/dashboard/kelas-ustad") &&
                      "bg-primary text-white hover:bg-primary/90"
                  )}
                  onClick={() => setIsClassesExpanded(!isClassesExpanded)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                  {isClassesExpanded ? (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Button>

                {isClassesExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {classesLoading ? (
                      <div className="text-sm text-gray-500 py-2">
                        Memuat...
                      </div>
                    ) : ustadClasses && ustadClasses.length > 0 ? (
                      ustadClasses.map((classItem) => (
                        <Link
                          key={classItem.id}
                          href={`/dashboard/kelas-ustad/${classItem.id}`}
                        >
                          <Button
                            variant={
                              pathname ===
                              `/dashboard/kelas-ustad/${classItem.id}`
                                ? "secondary"
                                : "ghost"
                            }
                            className={cn(
                              "w-full justify-start text-sm h-8",
                              pathname ===
                                `/dashboard/kelas-ustad/${classItem.id}` &&
                                "bg-secondary"
                            )}
                          >
                            {classItem.name}
                          </Button>
                        </Link>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 py-2">
                        Tidak ada kelas
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  isActive && "bg-primary text-white hover:bg-primary/90"
                )}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2">
              <Avatar className="w-8 h-8 mr-3">
                <AvatarFallback>
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
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
