/**
 * Single place for user display logic. Change behavior here to affect avatar, dropdown, etc.
 */

/** Number of characters used for initials (e.g. 2 = first two letters of email). */
export const USER_INITIALS_LENGTH = 2;

/**
 * Returns capitalized initials from email (e.g. "john@example.com" -> "Jo").
 * Uses first USER_INITIALS_LENGTH characters of the local part, capitalized.
 */
export function getInitialsFromEmail(
  email: string | null | undefined
): string {
  if (!email || !email.trim()) return "?";
  const local = email.split("@")[0]?.trim() || "";
  const take = local.slice(0, USER_INITIALS_LENGTH);
  return take
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase())
    .padEnd(USER_INITIALS_LENGTH, "?")
    .slice(0, USER_INITIALS_LENGTH);
}
