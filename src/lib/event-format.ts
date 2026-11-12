// Small helpers shared by the planner, the My events pages and the emails.

// Turns a date/time field value like "2026-11-20T19:00" into
// "Friday, November 20, 2026 at 7:00 PM". The value has no time zone, so we
// format it exactly as typed instead of converting it.
export function formatEventTime(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    return value;
  }
  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

// "Sized for 12 guests at the library on Friday, November 20 at 7:00 PM"
export function describeEvent(details: {
  guests: number | null;
  venue: string | null;
  eventTime: string | null;
}) {
  const parts = [
    details.guests && `${details.guests} guests`,
    details.venue && `at ${details.venue}`,
    details.eventTime && `on ${formatEventTime(details.eventTime)}`,
  ].filter(Boolean);
  return parts.length ? `Planned for ${parts.join(" ")}` : "";
}
