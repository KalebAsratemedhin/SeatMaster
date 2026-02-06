import Link from "next/link";
import { Share2, Globe } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const FOOTER_LINKS = {
  Product: [
    { href: "#", label: "Features" },
    { href: "#", label: "Integrations" },
    { href: "#", label: "Pricing" },
    { href: "#", label: "Updates" },
  ],
  Company: [
    { href: "#", label: "About Us" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Partners" },
    { href: "#", label: "Contact" },
  ],
  Legal: [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Cookie Policy" },
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
          <div className="flex gap-4">
            <a
              href="#"
              className="size-10 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-slate-600 dark:text-emerald-100/60 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
            >
              <Share2 className="size-5" />
            </a>
            <a
              href="#"
              className="size-10 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-slate-600 dark:text-emerald-100/60 hover:text-[#044b36] dark:hover:text-[#D4AF37] transition-colors"
            >
              <Globe className="size-5" />
            </a>
          </div>
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
      <div className="mt-16 pt-8 border-t border-slate-100 dark:border-emerald-800/50 flex flex-col md:flex-row justify-between gap-4 text-xs text-slate-400 dark:text-emerald-100/20 font-medium">
        <p>© 2024 SeatMaster Event Solutions Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-[#044b36] dark:hover:text-[#D4AF37]">Status</Link>
          <Link href="#" className="hover:text-[#044b36] dark:hover:text-[#D4AF37]">Security</Link>
        </div>
      </div>
    </footer>
  );
}