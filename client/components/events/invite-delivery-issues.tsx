"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useBulkInviteToEventMutation,
  useLazyGetInviteJobQuery,
  type InviteJobStatusResponse,
} from "@/lib/api/eventsApi";
import {
  forgetInviteJob,
  INVITE_JOBS_CHANGED,
  listInviteJobs,
  rememberInviteJob,
} from "@/lib/inviteJobStore";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type InviteDeliveryIssuesProps = {
  eventId: string;
  /** Bump when a new job is queued so we re-read localStorage. */
  refreshKey?: number;
};

type FailureRow = {
  jobId: string;
  email: string;
  error: string;
};

export function InviteDeliveryIssues({ eventId, refreshKey = 0 }: InviteDeliveryIssuesProps) {
  const [fetchJob] = useLazyGetInviteJobQuery();
  const [bulkInvite, { isLoading: retrying }] = useBulkInviteToEventMutation();
  const [jobs, setJobs] = useState<InviteJobStatusResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const stored = listInviteJobs(eventId);
      if (stored.length === 0) {
        if (!cancelled) setJobs([]);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(
          stored.map(async (s) => {
            try {
              return await fetchJob({ eventId, jobId: s.jobId }).unwrap();
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        setJobs(results.filter((j): j is InviteJobStatusResponse => Boolean(j)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    const t = window.setInterval(() => void run(), 8000);
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ eventId?: string }>).detail;
      if (!detail?.eventId || detail.eventId === eventId) void run();
    };
    window.addEventListener(INVITE_JOBS_CHANGED, onChanged);
    return () => {
      cancelled = true;
      window.clearInterval(t);
      window.removeEventListener(INVITE_JOBS_CHANGED, onChanged);
    };
  }, [eventId, fetchJob, refreshKey]);

  const failures = useMemo(() => {
    const rows: FailureRow[] = [];
    for (const job of jobs) {
      for (const err of job.errors ?? []) {
        if (!err.email) continue;
        rows.push({ jobId: job.job_id, email: err.email, error: err.error || "Send failed" });
      }
    }
    // Dedupe by email — keep latest error text
    const byEmail = new Map<string, FailureRow>();
    for (const row of rows) {
      byEmail.set(row.email.toLowerCase(), row);
    }
    return [...byEmail.values()];
  }, [jobs]);

  const inFlight = jobs.some((j) => j.status === "queued" || j.status === "running");

  if (!loading && failures.length === 0 && !inFlight) return null;

  const retryAll = async () => {
    const emails = failures.map((f) => f.email);
    if (emails.length === 0) return;
    try {
      const queued = await bulkInvite({ eventId, emails }).unwrap();
      rememberInviteJob(eventId, queued.job_id);
      for (const f of failures) forgetInviteJob(eventId, f.jobId);
      toast.success(`Re-queued ${emails.length} failed invite${emails.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Could not re-queue failed invites");
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {failures.length > 0
                ? `${failures.length} invite${failures.length === 1 ? "" : "s"} failed to send`
                : "Invites are still sending…"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {failures.length > 0
                ? "These addresses never received email. You can retry them."
                : "Delivery continues in the background — this clears when jobs finish."}
            </p>
          </div>
        </div>
        {failures.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={retrying}
            onClick={() => void retryAll()}
          >
            {retrying ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 size-3.5" />
            )}
            Retry failed
          </Button>
        )}
      </div>
      {failures.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto text-sm">
          {failures.map((f) => (
            <li
              key={`${f.jobId}-${f.email}`}
              className="flex flex-wrap items-baseline justify-between gap-2 text-muted-foreground"
            >
              <span className="truncate font-medium text-foreground">{f.email}</span>
              <span className="truncate text-xs">{f.error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
