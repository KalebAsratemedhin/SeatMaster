const PREFIX = "seatmaster:invite-jobs:";

export type StoredInviteJob = {
  jobId: string;
  queuedAt: string;
};

function key(eventId: string) {
  return `${PREFIX}${eventId}`;
}

export const INVITE_JOBS_CHANGED = "seatmaster:invite-jobs-changed";

export function rememberInviteJob(eventId: string, jobId: string) {
  if (typeof window === "undefined" || !eventId || !jobId) return;
  const existing = listInviteJobs(eventId).filter((j) => j.jobId !== jobId);
  const next: StoredInviteJob[] = [
    { jobId, queuedAt: new Date().toISOString() },
    ...existing,
  ].slice(0, 12);
  try {
    localStorage.setItem(key(eventId), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(INVITE_JOBS_CHANGED, { detail: { eventId } }));
  } catch {
    /* ignore quota */
  }
}

export function listInviteJobs(eventId: string): StoredInviteJob[] {
  if (typeof window === "undefined" || !eventId) return [];
  try {
    const raw = localStorage.getItem(key(eventId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredInviteJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function forgetInviteJob(eventId: string, jobId: string) {
  if (typeof window === "undefined" || !eventId) return;
  const next = listInviteJobs(eventId).filter((j) => j.jobId !== jobId);
  try {
    if (next.length === 0) localStorage.removeItem(key(eventId));
    else localStorage.setItem(key(eventId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
