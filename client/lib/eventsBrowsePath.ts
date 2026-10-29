/** Authenticated browse uses the app Events page; guests use public /discover. */
export function eventsBrowsePath(token: string | null | undefined): string {
  return token ? "/events/discover" : "/discover";
}
