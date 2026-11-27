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
  Settings,
  Menu,
  LayoutDashboard,
  Mail,
  Calendar,
  Search,
  X,
} from "lucide-react";
import { eventsBrowsePath } from "@/lib/eventsBrowsePath";

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
  const browsePath = eventsBrowsePath(token);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `${browsePath}?q=${encodeURIComponent(q)}` : browsePath);
  };

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <div className="flex min-w-0 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 overflow-hidden focus-within:ring-2 focus-within:ring-[var(--brand-amber)]/30 focus-within:border-[var(--brand-amber)]/50">
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
            className="shrink-0 flex items-center justify-center size-7 rounded-full mr-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700/80 transition-colors"
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
    { href: "/invitations", label: "Invitations", icon: Mail },
    { href: "/events/discover", label: "Events", icon: Calendar },
    { href: "/settings", label: "Settings", icon: Settings },
  ] as const;

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  const rightContent = (
    <div className="ml-auto flex items-center justify-end gap-2 shrink-0 min-w-0 sm:gap-4 lg:ml-0">
      {!isLanding && (
        <Link
          href="/"
          className="hidden sm:inline text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[var(--brand-navy)] dark:hover:text-[var(--brand-amber)] transition-colors"
        >
          Home
        </Link>
      )}
      {isLanding && (
        <nav className="hidden md:flex items-center gap-6" aria-label="Main">
          <Link
            href={eventsBrowsePath(token)}
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[var(--brand-navy)] dark:hover:text-[var(--brand-amber)] transition-colors"
          >
            Events
          </Link>
          {isLoggedIn && (
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[var(--brand-navy)] dark:hover:text-[var(--brand-amber)] transition-colors"
            >
              Dashboard
            </Link>
          )}
        </nav>
      )}
      {isLoggedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
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
          <DropdownMenuContent align="end" className="z-[9999] w-48">
            {isLanding && (
              <>
                {appNavItems
                  .filter((i) => i.href !== "/settings")
                  .map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild className="md:hidden">
                      <Link href={href} className="cursor-pointer">
                        <Icon className="mr-2 size-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator className="md:hidden" />
              </>
            )}
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
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md sm:h-9 sm:px-4"
          >
            <Link href="/auth?mode=signup">Get Started</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="hidden sm:flex border-slate-200 dark:border-slate-600 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <Link href="/auth?mode=signin">Login</Link>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-[500] flex flex-wrap items-center gap-x-3 gap-y-3 border-b border-slate-200/80 dark:border-slate-700/50 bg-white/95 dark:bg-[var(--brand-navy)]/95 backdrop-blur-sm px-4 py-3 sm:px-6 ${
        isLanding ? "md:flex-nowrap md:gap-4 md:px-20 md:py-4" : "lg:flex-nowrap lg:justify-between lg:gap-4 lg:px-20 lg:py-4"
      }`}
    >
      {isLanding ? (
        <>
          <Link href="/" className="shrink-0" aria-label="SeatMaster home">
            <Logo />
          </Link>
          {/* Phones: search drops to its own full-width row under logo + actions. */}
          <div className="order-last w-full md:order-none md:mx-auto md:flex md:min-w-0 md:max-w-xl md:flex-1 md:justify-center">
            <HeaderSearch placeholder="Search events..." className="w-full" />
          </div>
          {rightContent}
        </>
      ) : (
        <>
          {isLoggedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2 lg:hidden focus-visible:ring-0 focus-visible:ring-offset-0 shrink-0"
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
          <Link
            href="/"
            className="flex shrink-0 lg:hidden"
            aria-label="SeatMaster home"
          >
            <Logo />
          </Link>
          <div className="order-last w-full lg:order-none lg:flex lg:min-w-0 lg:max-w-xl lg:flex-1">
            <HeaderSearch placeholder="Search events..." className="w-full" />
          </div>
          {rightContent}
        </>
      )}
    </header>
  );
}
