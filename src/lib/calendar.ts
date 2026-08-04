export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
}

function toIcsDate(date: string): string {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(text: string): string {
  return text.replace(/([\\;,])/g, "\\$1").replace(/[\r\n]+/g, "\\n");
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(event.startDate)}/${toIcsDate(event.endDate)}`,
    details: event.description || "",
  });
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(event: CalendarEvent): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MUST IPT//IPT Portal//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@ipt.herpydevs.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsDate(event.startDate)}`,
    `DTEND:${toIcsDate(event.endDate)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "",
    event.location ? `LOCATION:${escapeIcs(event.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function buildIcsApiUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    start: event.startDate,
    end: event.endDate,
  });
  return `/api/calendar/ics?${params.toString()}`;
}
