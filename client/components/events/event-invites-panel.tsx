"use client";

import { useMemo, useRef, useState } from "react";
import {
  useBulkInviteToEventMutation,
  useGetEventInvitesQuery,
} from "@/lib/api/eventsApi";
import {
  mergeGuestEmails,
  parseEmailsFromSpreadsheet,
  splitEmailCandidates,
} from "@/lib/parseGuestEmails";
import { GuestAttendeeRecommendations } from "@/components/events/guest-attendee-recommendations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { rememberInviteJob } from "@/lib/inviteJobStore";
import { getInitialsFromEmail } from "@/lib/user-display";
import { FileSpreadsheet, Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

type EventInvitesPanelProps = {
  eventId: string;
  seatIdToLabel: Record<string, string>;
};

function apiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    typeof (error as { data?: { error?: string } }).data?.error === "string"
  ) {
    return (error as { data: { error: string } }).data.error;
  }
  return fallback;
}

export function EventInvitesPanel({ eventId, seatIdToLabel }: EventInvitesPanelProps) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data: invitesData, refetch } = useGetEventInvitesQuery({
    eventId,
    limit: pageSize,
    offset: page * pageSize,
  });
  const { data: inviteStatusData } = useGetEventInvitesQuery({
    eventId,
    limit: 500,
    offset: 0,
  });
  const [bulkInvite] = useBulkInviteToEventMutation();

  const invites = invitesData?.items ?? [];
  const total = invitesData?.total ?? 0;
  const invitedByEmail = useMemo(() => {
    const m = new Map<string, string>();
    for (const inv of inviteStatusData?.items ?? []) {
      m.set(inv.email.toLowerCase(), inv.status);
    }
    return m;
  }, [inviteStatusData?.items]);
  const invitedEmails = useMemo(() => new Set(invitedByEmail.keys()), [invitedByEmail]);

  const addEmails = (candidates: string[]) => {
    setError(null);
    const { added, skippedInvalid, skippedDuplicate } = mergeGuestEmails(
      pending,
      candidates,
      invitedEmails
    );
    if (added.length === 0) {
      if (skippedInvalid > 0 && skippedDuplicate === 0) {
        setError("No valid email addresses found.");
      } else if (skippedDuplicate > 0) {
        setError("Those emails are already invited or queued.");
      }
      return false;
    }
    setPending((prev) => [...prev, ...added]);
    const notes = [`Added ${added.length}`];
    if (skippedInvalid) notes.push(`${skippedInvalid} invalid skipped`);
    if (skippedDuplicate) notes.push(`${skippedDuplicate} duplicates skipped`);
    toast.success(notes.join(" · "));
    return true;
  };

  const addFromDraft = () => {
    const candidates = splitEmailCandidates(draft);
    if (!candidates.length) {
      setError("No valid email addresses found.");
      return;
    }
    if (addEmails(candidates)) {
      setDraft("");
      setPasteOpen(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      addEmails(await parseEmailsFromSpreadsheet(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read spreadsheet");
    } finally {
      setImporting(false);
    }
  };

  const handleQueue = async () => {
    if (pending.length === 0) return;
    setQueuing(true);
    setError(null);
    try {
      const queued = await bulkInvite({ eventId, emails: pending }).unwrap();
      rememberInviteJob(eventId, queued.job_id);
      setPending([]);
      toast.success(
        `Queued ${queued.queued} invitation${queued.queued === 1 ? "" : "s"} — sending in the background.`
      );
      void refetch();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to queue invitations"));
    } finally {
      setQueuing(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Guests &amp; invites
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Build a queue, then send — emails go out in the background.
        </p>
      </header>

      <section className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-10 rounded-xl px-5"
            onClick={() => {
              setError(null);
              setPasteOpen(true);
            }}
          >
            <UserPlus className="mr-2 size-4" />
            Add emails
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl px-5"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 size-4" />
            )}
            Import Excel/CSV
          </Button>
        </div>
        {error && !pasteOpen && <p className="text-sm text-destructive">{error}</p>}

        <Dialog
          open={pasteOpen}
          onOpenChange={(open) => {
            setPasteOpen(open);
            if (!open) {
              setDraft("");
              setError(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add guest emails</DialogTitle>
              <DialogDescription>
                Paste many at once — comma, space, or new line.
              </DialogDescription>
            </DialogHeader>
            <textarea
              id="event-invite-emails"
              rows={6}
              autoFocus
              placeholder={"guest@example.com\nfriend@example.com"}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              className="flex min-h-[140px] w-full rounded-xl border border-border bg-card px-3 py-2.5 text-base text-foreground shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setPasteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                disabled={!draft.trim()}
                onClick={addFromDraft}
              >
                <UserPlus className="mr-2 size-4" />
                Add to queue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <GuestAttendeeRecommendations
          excludeEventId={eventId}
          alreadyQueued={new Set(pending.map((e) => e.toLowerCase()))}
          invitedByEmail={invitedByEmail}
          onAddEmails={addEmails}
        />

        {pending.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                Ready to invite · {pending.length}
              </p>
              <Button
                type="button"
                className="rounded-xl"
                disabled={queuing}
                onClick={() => void handleQueue()}
              >
                {queuing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Queuing…
                  </>
                ) : (
                  <>Queue {pending.length} invite{pending.length === 1 ? "" : "s"}</>
                )}
              </Button>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
              {pending.map((email) => (
                <li key={email} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {getInitialsFromEmail(email)}
                    </div>
                    <span className="truncate text-sm">{email}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPending((prev) => prev.filter((e) => e !== email))}
                    aria-label={`Remove ${email}`}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Invited · {total}
        </h3>
        <div className="overflow-hidden rounded-2xl ring-1 ring-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Guest
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                  Seat
                </th>
                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Invited
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No guests invited yet.
                  </td>
                </tr>
              ) : (
                invites.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                          {getInitialsFromEmail(inv.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {inv.email.split("@")[0]}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{inv.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{inv.status}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {inv.seat_id != null
                        ? seatIdToLabel[inv.seat_id] ?? `Seat #${inv.seat_id}`
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <Pagination
            total={total}
            pageSize={pageSize}
            page={page}
            onPageChange={setPage}
            onPageSizeChange={(v) => {
              setPageSize(v);
              setPage(0);
            }}
          />
        )}
      </section>
    </div>
  );
}
