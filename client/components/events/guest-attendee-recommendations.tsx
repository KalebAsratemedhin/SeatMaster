"use client";

import { useEffect, useState } from "react";
import { useGetAttendeeRecommendationsQuery } from "@/lib/api/eventsApi";
import { useSearchUsersQuery } from "@/lib/api/usersApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitialsFromEmail, getInitialsFromName } from "@/lib/user-display";
import { Loader2, Search, UserPlus } from "lucide-react";

const PAGE_SIZE = 8;

type GuestAttendeeRecommendationsProps = {
  excludeEventId: string;
  /** Draft queue emails (not yet sent). */
  alreadyQueued: Set<string>;
  /** Email → invite status for people already on this event. */
  invitedByEmail?: Map<string, string>;
  onAddEmails: (emails: string[]) => void;
};

type SourceTab = "past" | "users";

type PersonRow = {
  key: string;
  email: string;
  title: string;
  subtitle: string;
};

function normalize(email: string) {
  return email.trim().toLowerCase();
}

export function GuestAttendeeRecommendations({
  excludeEventId,
  alreadyQueued,
  invitedByEmail,
  onAddEmails,
}: GuestAttendeeRecommendationsProps) {
  const [tab, setTab] = useState<SourceTab>("past");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(search.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setSearch("");
    setDebounced("");
    setOffset(0);
  }, [tab]);

  const pastQuery = useGetAttendeeRecommendationsQuery(
    {
      search: debounced || undefined,
      limit: PAGE_SIZE,
      offset,
      exclude_event_id: excludeEventId,
    },
    { skip: tab !== "past" }
  );

  const usersQuery = useSearchUsersQuery(
    { q: debounced, limit: PAGE_SIZE, offset },
    { skip: tab !== "users" || debounced.length < 2 }
  );

  const pastItems = pastQuery.data?.items ?? [];
  const pastTotal = pastQuery.data?.total ?? 0;
  const pastRows: PersonRow[] = pastItems.map((item) => ({
    key: item.email,
    email: item.email,
    title: item.display_name?.trim() || item.email,
    subtitle: [item.email, item.last_event_name].filter(Boolean).join(" · "),
  }));

  const userItems = usersQuery.data?.items ?? [];
  const userTotal = usersQuery.data?.total ?? 0;
  const userRows: PersonRow[] = userItems.map((u) => {
    const name =
      u.display_name?.trim() ||
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.email;
    return {
      key: u.id,
      email: u.email,
      title: name,
      subtitle: u.email,
    };
  });

  const usersUnavailable =
    tab === "users" &&
    usersQuery.isError &&
    typeof usersQuery.error === "object" &&
    usersQuery.error &&
    "status" in usersQuery.error &&
    (usersQuery.error as { status?: number }).status === 404;

  const isFetching = tab === "past" ? pastQuery.isFetching : usersQuery.isFetching;
  const total = tab === "past" ? pastTotal : userTotal;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const showPager =
    (tab === "past" && pastTotal > PAGE_SIZE) ||
    (tab === "users" && !usersUnavailable && userTotal > PAGE_SIZE);

  const rowState = (email: string) => {
    const key = normalize(email);
    const inviteStatus = invitedByEmail?.get(key);
    if (inviteStatus) return { kind: "invited" as const, status: inviteStatus };
    if (alreadyQueued.has(key)) return { kind: "queued" as const, status: "queued" };
    return { kind: "available" as const, status: null };
  };

  return (
    <section className="space-y-4 border-t border-border pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-foreground">People</h3>
        <div role="tablist" aria-label="People source" className="flex gap-1 text-sm">
          {(
            [
              ["past", "Past guests"],
              ["users", "Directory"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-lg px-3 py-1.5 transition ${
                tab === id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "past" ? "Filter past guests…" : "Search by name or email…"}
          className="h-10 rounded-xl border-border bg-card pl-9 shadow-none"
          aria-label={tab === "past" ? "Filter past guests" : "Search directory"}
        />
      </div>

      {tab === "past" && pastQuery.isError && (
        <p className="text-sm text-destructive">Could not load past guests.</p>
      )}

      {tab === "users" && usersUnavailable && (
        <p className="text-sm text-muted-foreground">
          Directory search isn&apos;t available yet. Paste emails or import a spreadsheet instead.
        </p>
      )}

      {tab === "users" && !usersUnavailable && usersQuery.isError && debounced.length >= 2 && (
        <p className="text-sm text-destructive">Could not search the directory.</p>
      )}

      {tab === "users" && debounced.length < 2 && !usersUnavailable && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Type at least 2 characters to search SeatMaster users.
        </p>
      )}

      {tab === "past" &&
        (isFetching && pastItems.length === 0 ? (
          <LoadingBlock />
        ) : pastTotal === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No past guests yet. Import a spreadsheet, paste emails, or try the directory.
          </p>
        ) : pastRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No past guests match that filter.
          </p>
        ) : (
          <PersonList rows={pastRows} rowState={rowState} onAdd={onAddEmails} />
        ))}

      {tab === "users" &&
        debounced.length >= 2 &&
        !usersUnavailable &&
        (isFetching && userItems.length === 0 ? (
          <LoadingBlock />
        ) : userRows.length === 0 && !usersQuery.isError ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No users matched.</p>
        ) : userRows.length > 0 ? (
          <PersonList rows={userRows} rowState={rowState} onAdd={onAddEmails} />
        ) : null)}

      {showPager && (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={offset <= 0 || isFetching}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
            {isFetching ? "…" : ""}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={offset + PAGE_SIZE >= total || isFetching}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}

function LoadingBlock() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function PersonList({
  rows,
  rowState,
  onAdd,
}: {
  rows: PersonRow[];
  rowState: (email: string) => {
    kind: "available" | "queued" | "invited";
    status: string | null;
  };
  onAdd: (emails: string[]) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => {
        const state = rowState(row.email);
        const initials = row.title.includes("@")
          ? getInitialsFromEmail(row.email)
          : getInitialsFromName(row.title);
        return (
          <li
            key={row.key}
            className={`flex items-center gap-3 py-3 ${
              state.kind !== "available" ? "opacity-80" : ""
            }`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
              <p className="truncate text-xs text-muted-foreground">{row.subtitle}</p>
            </div>
            {state.kind === "invited" ? (
              <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {state.status === "confirmed"
                  ? "Confirmed"
                  : state.status === "declined"
                    ? "Declined"
                    : "Invited"}
              </span>
            ) : state.kind === "queued" ? (
              <span className="shrink-0 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                In queue
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 rounded-lg"
                onClick={() => onAdd([row.email])}
              >
                <UserPlus className="mr-1.5 size-3.5" />
                Add
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
