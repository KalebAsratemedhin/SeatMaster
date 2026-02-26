import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Terms of Service</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: February 2025</p>
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-slate-600 dark:text-slate-400">
          <p>
            By using SeatMaster, you agree to these terms. Our platform provides event management tools
            including invitations, RSVPs, and seating arrangements.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-6">Acceptable use</h2>
          <p>
            You agree to use the service only for lawful purposes and to not misuse, abuse, or attempt to
            compromise the security or availability of the platform.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-6">Your content</h2>
          <p>
            You retain ownership of the content you upload. You grant us a limited license to store, display,
            and process it as needed to provide the service.
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
