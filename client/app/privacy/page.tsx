import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Privacy Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: February 2025</p>
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-slate-600 dark:text-slate-400">
          <p>
            SeatMaster (&quot;we&quot;) respects your privacy. This policy describes how we collect, use, and
            protect your information when you use our event management platform.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-6">Information we collect</h2>
          <p>
            We collect account information (email, name), event and guest data you provide, and usage data
            necessary to operate the service.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-6">How we use it</h2>
          <p>
            We use your data to provide and improve our services, send transactional emails (e.g. invitations),
            and comply with legal obligations.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-6">Data sharing</h2>
          <p>
            We do not sell your personal information. We may share data with service providers that help us
            run the platform, under strict confidentiality terms.
          </p>
        </div>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
