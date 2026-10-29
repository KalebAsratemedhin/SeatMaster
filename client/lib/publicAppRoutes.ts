/**
 * (app) routes that guests may view without signing in.
 * Submit actions (RSVP, comments, etc.) still require auth in the page/API.
 */
const PUBLIC_APP_PATHS: RegExp[] = [
  /^\/events\/discover\/?$/,
  /^\/events\/[^/]+\/?$/, // event detail
  /^\/events\/[^/]+\/rsvp\/?$/,
  /^\/invite\/[^/]+\/?$/, // guest invitation experience
];

export function isPublicAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PUBLIC_APP_PATHS.some((re) => re.test(pathname));
}
