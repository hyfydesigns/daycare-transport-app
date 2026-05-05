"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Bus, LayoutDashboard, Users, School, Truck, Route,
  CalendarCheck, FileBarChart, LogOut, Menu, X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/children", label: "Children", icon: Users },
  { href: "/schools", label: "Schools", icon: School },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

interface SidebarProps {
  userName: string;
  userRole: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Bus className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">DaycareTransApp</p>
          <p className="text-xs text-muted-foreground truncate">Sunshine Daycare</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href) && href !== "/dashboard"
                ? "bg-primary text-primary-foreground"
                : pathname === href && href === "/dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole.replace("_", " ").toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r bg-card h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <Bus className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">DaycareTransApp</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-card h-full shadow-xl">
            <button
              className="absolute right-4 top-4"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
