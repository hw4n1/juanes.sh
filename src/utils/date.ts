/**
 * pubDate/updatedDate are calendar dates (no time) that zod coerces to
 * midnight UTC. Without forcing timeZone: 'UTC' here, formatting on a
 * machine with a negative offset (local build, CI) shows the wrong day.
 */
export function formatDate(date: Date, lang: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(lang, { ...options, timeZone: 'UTC' }).format(date);
}
