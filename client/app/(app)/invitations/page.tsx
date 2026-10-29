"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useGetMyInvitationsQuery } from "@/lib/api/eventsApi";
import type { RootState } from "@/lib/store";
import { InvitationCard } from "@/components/events/invitation-card";
import { Pagination } from "@/components/ui/pagination";

export default function InvitationsPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useGetMyInvitationsQuery(
    { limit: pageSize, offset: page * pageSize },
    { skip: !token }
  );

  const invitations = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="w-full max-w-7xl mx-auto">
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
            href="/events/discover"
            className="mt-4 inline-block text-primary hover:underline font-medium"
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
          {total > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Pagination
                total={total}
                pageSize={pageSize}
                page={page}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(0);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
