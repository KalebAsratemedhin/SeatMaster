"use client";

import { useState } from "react";
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
import {
  LogOut,
  User,
  Settings,
  Menu,
  LayoutDashboard,
  Calendar,
  Mail,
  Compass,
  Search,
  X,
} from "lucide-react";

export function HeaderSearch({
  placeholder = "Search events...",
  className = "",
}: {
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const [query, setQuery] = useState("");
  const discoverPath = token ? "/events/discover" : "/discover";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `${discoverPath}?q=${encodeURIComponent(q)}` : discoverPath);
  };

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <div className="flex min-w-0 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500/50">
        <Search className="size-4 shrink-0 text-slate-400 ml-3" aria-hidden />
        <input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-2 pr-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          aria-label="Search events"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 flex items-center justify-center size-7 rounded-full mr-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 dark:hover:text-slate-300 dark:hover:bg-slate-700/80 transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        )}
      </div>
    </form>
  );
}

export function SiteHeader() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!token;
  const isLanding = pathname === "/";

  const appNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/invitations", label: "Invitations", icon: Mail },
    { href: "/events/discover", label: "Discover", icon: Compass },
    { href: "/profile", label: "Profile", icon: User },
  ] as const;

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  const rightContent = (
    <div className="flex items-center justify-end gap-4 shrink-0 min-w-0">
      {!isLanding && (
        <Link
          href="/"
          className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#044b36] dark:hover:text-emerald-400 transition-colors"
        >
          Home
        </Link>
      )}
      {isLanding && isLoggedIn && (
        <nav className="hidden md:flex items-center gap-8" aria-label="Main">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-slate-600 dark:text-emerald-100/70 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
          >
            Dashboard
          </Link>
        </nav>
      )}
      {isLoggedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full py-1.5 pl-1 pr-3 focus-visible:ring-0 focus-visible:ring-offset-0"
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
          <DropdownMenuContent align="end" className="z-[9999] w-48">
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
  );

  return (
    <header
      className={`sticky top-0 z-[500] border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#022c22] px-6 md:px-20 py-4 ${
        !isLanding ? "grid grid-cols-[1fr_auto_1fr] items-center gap-4 lg:flex lg:justify-between" : "flex items-center justify-between gap-4"
      }`}
    >
      {isLanding ? (
        <>
          <Link href="/" className="shrink-0" aria-label="SeatMaster home">
            <Logo />
          </Link>
          <div className="flex flex-1 justify-center min-w-0 max-w-xl mx-auto">
            <HeaderSearch placeholder="Search events..." className="w-full" />
          </div>
          {rightContent}
        </>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-2 justify-start lg:flex-1">
            <HeaderSearch placeholder="Search events..." className="flex-1 min-w-[140px] max-w-[70%]" />
            {isLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden focus-visible:ring-0 focus-visible:ring-offset-0 shrink-0"
                    aria-label="Open menu"
                  >
                    <Menu className="size-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="bottom" className="z-[9999] w-56">
                  {appNavItems.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link
                        href={href}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Icon className="size-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <Link
            href="/"
            className="flex justify-center lg:hidden"
            aria-label="SeatMaster home"
          >
            <Logo />
          </Link>
          {rightContent}
        </>
      )}
    </header>
  );
}