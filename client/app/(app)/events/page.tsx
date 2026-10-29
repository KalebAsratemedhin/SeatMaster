import { redirect } from "next/navigation";

/** Former My Events list — folded into Discover with `?mine=1`. */
export default function EventsPage() {
  redirect("/events/discover?mine=1");
}
