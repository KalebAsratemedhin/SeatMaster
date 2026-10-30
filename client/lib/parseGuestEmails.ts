/** Split pasted/typed guest text into candidate emails (comma, semicolon, whitespace). */
export function splitEmailCandidates(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isValidGuestEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const EMAIL_HEADER = /^(e-?mail|email\s*address|mail)$/i;

function emailsFromRows(rows: string[][]): string[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((c) => c.trim());
  let col = header.findIndex((h) => EMAIL_HEADER.test(h));
  const start = col >= 0 ? 1 : 0;
  if (col < 0) {
    // No header — pick first column that looks like emails
    col = 0;
    for (let c = 0; c < (rows[0]?.length ?? 0); c++) {
      const sample = rows.slice(0, 8).map((r) => r[c]?.trim() ?? "");
      if (sample.filter(isValidGuestEmail).length >= Math.min(2, sample.filter(Boolean).length)) {
        col = c;
        break;
      }
    }
  }
  const out: string[] = [];
  for (let i = start; i < rows.length; i++) {
    const cell = (rows[i]?.[col] ?? "").trim().toLowerCase();
    if (cell) out.push(cell);
  }
  return out;
}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Extract emails from a .csv or .xlsx File (column `email` preferred). */
export async function parseEmailsFromSpreadsheet(file: File): Promise<string[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv" || file.type === "text/plain") {
    const text = await file.text();
    return emailsFromRows(parseCsvText(text));
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("sheet")) {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as string[][];
    return emailsFromRows(rows.map((r) => r.map((c) => String(c ?? ""))));
  }
  throw new Error("Use a .csv or .xlsx file with an email column.");
}

export type MergeEmailResult = {
  added: string[];
  skippedInvalid: number;
  skippedDuplicate: number;
};

/** Merge candidates into an existing pending list (case-insensitive dedupe). */
export function mergeGuestEmails(
  existing: string[],
  candidates: string[],
  alreadyInvited: Set<string>
): MergeEmailResult {
  const seen = new Set(existing.map((e) => e.toLowerCase()));
  const added: string[] = [];
  let skippedInvalid = 0;
  let skippedDuplicate = 0;
  for (const raw of candidates) {
    const email = raw.trim().toLowerCase();
    if (!email) continue;
    if (!isValidGuestEmail(email)) {
      skippedInvalid += 1;
      continue;
    }
    if (seen.has(email) || alreadyInvited.has(email)) {
      skippedDuplicate += 1;
      continue;
    }
    seen.add(email);
    added.push(email);
  }
  return { added, skippedInvalid, skippedDuplicate };
}
