"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard,
  Mail,
  Calendar,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match?: "exact" | "prefix";
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/invitations", label: "Invitations", icon: Mail, match: "exact" },
  { href: "/events/discover", label: "Events", icon: Calendar, match: "exact" },
  { href: "/settings", label: "Settings", icon: Settings, match: "exact" },
];

/** Returns the single item key that should be active (exact match wins, then best prefix match). */
function getActiveItemKey(pathname: string, items: NavItem[]): string | null {
  const key = (item: NavItem) => `${item.href}\n${item.label}`;
  const exact = items.find((i) => i.match === "exact" && pathname === i.href);
  if (exact) return key(exact);
  const prefixMatches = items.filter(
    (i) => i.match === "prefix" && (pathname === i.href || pathname.startsWith(i.href + "/"))
  );
  if (prefixMatches.length === 0) return null;
  const best = prefixMatches.reduce((a, b) => (a.href.length >= b.href.length ? a : b));
  return key(best);
}

function NavLinks({
  items,
  pathname,
  collapsed,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}) {
  const activeKey = getActiveItemKey(pathname, items);
  return (
    <ul className="space-y-1" role="list">
      {items.map(({ href, label, icon: Icon, match }) => {
        const itemKey = `${href}\n${label}`;
        const current = activeKey === itemKey;
        return (
          <li key={itemKey}>
            <Link
              href={href}
              title={collapsed ? label : undefined}
              className={`
                group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all duration-200 ease-out
                ${collapsed ? "justify-center px-2" : ""}
                ${
                  current
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                }
              `}
            >
              <span
                className={`
                  flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200
                  ${
                    current
                      ? "bg-primary-foreground/20 text-inherit"
                      : "bg-slate-100 dark:bg-slate-700/80 text-inherit group-hover:bg-slate-200 dark:group-hover:bg-slate-600/80"
                  }
                `}
              >
                <Icon className="size-5 shrink-0 text-inherit" aria-hidden />
              </span>
              {!collapsed && <span>{label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type AppSidebarProps = {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function AppSidebar({ collapsed = false, onToggleCollapsed }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-40 hidden shrink-0 flex-col
        border-r border-slate-200/80 dark:border-slate-700/50
        bg-white/95 dark:bg-[var(--brand-navy)]/98
        shadow-[4px_0_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-none
        backdrop-blur-sm
        transition-[width] duration-200 ease-out
        lg:flex
        ${collapsed ? "w-[4.5rem]" : "w-72"}
      `}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          className={`shrink-0 border-b border-slate-100 dark:border-slate-700/50 py-5 ${
            collapsed ? "px-2" : "px-5"
          }`}
        >
          {collapsed ? (
            <Link
              href="/"
              className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary"
              aria-label="SeatMaster home"
            >
              SM
            </Link>
          ) : (
            <Link
              href="/"
              className="block rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-amber)]/50 focus:ring-offset-2 dark:focus:ring-offset-[var(--brand-navy)]"
              aria-label="SeatMaster home"
            >
              <Logo />
            </Link>
          )}
        </div>
        <nav className={`flex-1 overflow-y-auto py-6 ${collapsed ? "px-2" : "px-4"}`} aria-label="Main navigation">
          {!collapsed && (
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menu
            </p>
          )}
          <NavLinks items={navItems} pathname={pathname} collapsed={collapsed} />
        </nav>
        {onToggleCollapsed && (
          <div className={`shrink-0 border-t border-slate-100 dark:border-slate-700/50 p-3 ${collapsed ? "px-2" : ""}`}>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                text-slate-600 transition hover:bg-slate-100 hover:text-slate-900
                dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white
                ${collapsed ? "justify-center px-2" : ""}
              `}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-5 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="size-5 shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
