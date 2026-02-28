import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const FOOTER_LINKS = {
  Product: [
    { href: "/events", label: "My Events" },
    { href: "/discover", label: "Discover Events" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="bg-white dark:bg-[var(--brand-navy)] border-t border-slate-200 dark:border-slate-700/50 px-6 md:px-20 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
        <div className="col-span-2 lg:col-span-2 flex flex-col gap-5">
          <Logo />
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[300px] leading-relaxed">
            The leading platform for high-end event management. Helping you create memorable experiences through technology.
          </p>
        </div>
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading} className="flex flex-col gap-4">
            <h4 className="font-display font-semibold text-[var(--brand-navy)] dark:text-white">{heading}</h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
              {links.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="hover:text-[var(--brand-navy)] dark:hover:text-[var(--brand-amber)] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-700/50 text-xs text-slate-400 dark:text-slate-500 font-medium">
        <p>© {new Date().getFullYear()} SeatMaster. All rights reserved.</p>
      </div>
    </footer>
  );
}
