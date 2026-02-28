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
    <footer className="bg-white dark:bg-[#022c22] border-t border-emerald-900/10 dark:border-emerald-800 px-6 md:px-20 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
        <div className="col-span-2 lg:col-span-2 flex flex-col gap-6">
          <Logo />
          <p className="text-sm text-slate-500 dark:text-emerald-100/40 max-w-[300px]">
            The leading platform for high-end event management. Helping you create memorable experiences through technology.
          </p>
        </div>
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading} className="flex flex-col gap-4">
            <h4 className="font-bold text-emerald-950 dark:text-white">{heading}</h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-emerald-100/40">
              {links.map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-16 pt-8 border-t border-slate-100 dark:border-emerald-800/50 text-xs text-slate-400 dark:text-emerald-100/20 font-medium">
        <p>© {new Date().getFullYear()} SeatMaster. All rights reserved.</p>
      </div>
    </footer>
  );
}