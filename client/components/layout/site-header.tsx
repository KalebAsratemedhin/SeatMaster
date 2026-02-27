"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/slices/authSlice";
import { getInitialsFromEmail } from "@/lib/user-display";
import type { RootState } from "@/lib/store";
import { LogOut, User, Settings } from "lucide-react";

const NAV_LINKS_LOGGED_IN = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/guest-dashboard", label: "Guest" },
  { href: "/events", label: "Events" },
  { href: "/invitations", label: "Invitations" },
];
const NAV_LINK_DISCOVER = { href: "/events/discover", label: "Discover" };

export function SiteHeader() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!token;
  const isLanding = pathname === "/";

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-[500] flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#022c22] px-6 md:px-20 py-4">
      {isLanding ? (
        <Link href="/" className="shrink-0" aria-label="SeatMaster home">
          <Logo />
        </Link>
      ) : (
        <div className="w-full" aria-hidden />
      )}
      <div className="flex items-center gap-8 shrink-0">
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
        >
          Home
        </Link>
        {isLanding && (
          <nav className="hidden md:flex items-center gap-8">
            {isLoggedIn && NAV_LINKS_LOGGED_IN.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
              >
                {label}
              </Link>
            ))}
            <Link
              href={NAV_LINK_DISCOVER.href}
              className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
            >
              {NAV_LINK_DISCOVER.label}
            </Link>
          </nav>
        )}
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full py-1.5 pl-1 pr-3 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Open account menu"
                >
                  <Avatar
                    size="default"
                    className="h-9 w-9 border border-border"
                  >
                    {user?.avatar_url ? (
                      <AvatarImage
                        src={user.avatar_url}
                        alt=""
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                        : getInitialsFromEmail(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200">
                    {user?.first_name || user?.last_name
                      ? [user?.first_name, user?.last_name].filter(Boolean).join(" ")
                      : user?.email ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                asChild
                className="bg-[#044b36] hover:bg-[#065f46] text-white shadow-lg shadow-[#044b36]/20"
              >
                <Link href="/auth?mode=signup">Get Started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="hidden sm:flex border-slate-200 dark:border-emerald-800/50 bg-slate-100 dark:bg-emerald-900/40"
              >
                <Link href="/auth?mode=signin">Login</Link>
              </Button>
            </>
          )}
      </div>
    </header>
  );
}