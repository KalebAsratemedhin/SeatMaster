"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

const PUBLIC_NAV_LINKS = [{ href: "/events/discover", label: "Discover" }];

export function SiteHeader() {
  const dispatch = useDispatch();
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!token;

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-emerald-900/10 dark:border-emerald-800/30 bg-white dark:bg-[#022c22] px-6 md:px-20 py-4">
      <Logo />
      <div className="flex flex-1 justify-end items-center gap-8">
        <nav className="hidden md:flex items-center gap-8">
          {isLoggedIn && (
            <>
              <Link
                href="/events"
                className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
              >
                Events
              </Link>
              <Link
                href="/invitations"
                className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
              >
                Invitations
              </Link>
            </>
          )}
          {PUBLIC_NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full p-0 h-9 w-9 focus-visible:ring-2 focus-visible:ring-ring"
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
      </div>
    </header>
  );
}