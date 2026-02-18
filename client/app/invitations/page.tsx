"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useGetMyInvitationsQuery } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { SiteHeader } from "@/components/layout/site-header";
import { InvitationCard } from "@/components/events/invitation-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 12;

export default function InvitationsPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useGetMyInvitationsQuery(
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
    { skip: !token }
  );

  const invitations = data?.items ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (typeof token === "string" && !token) {
      router.replace("/auth?mode=signin");
    }
  }, [token, router]);

  if (typeof window !== "undefined" && !token) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf9] dark:bg-[#022c22] text-slate-900 dark:text-slate-100">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Events you&apos;ve been invited to. Respond or view details.
          </p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : invitations.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              You have no event invitations.
            </p>
            <Link
              href="/events"
              className="mt-4 inline-block text-[#044b36] dark:text-[#D4AF37] hover:underline font-medium"
            >
              Back to Events
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations.map((inv) => (
                <InvitationCard key={inv.invite.id} invitation={inv} />
              ))}
            </div>
            {total > PAGE_SIZE && (
              <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {page * PAGE_SIZE + 1} to{" "}
                  {Math.min((page + 1) * PAGE_SIZE, total)} of {total} invitations
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * PAGE_SIZE >= total}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
