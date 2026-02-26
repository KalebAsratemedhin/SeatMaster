import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Contact Us</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Have questions or feedback? We would love to hear from you.
        </p>
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          <strong>Email:</strong> support@seatmaster.com
        </p>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          We typically respond within 1 to 2 business days.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
