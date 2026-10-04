// ---- Dates ------------------------------------------------------------------
// Relative to when the app loads, so the schedule always looks current. Jordan's
// session started at the top of the current half hour, so it's in progress
// whenever the demo is opened; the rest of today's schedule is spaced around it.

export const HOUR = 60 * 60_000;
export const LIVE_SLOT = Math.floor(Date.now() / (HOUR / 2)) * (HOUR / 2);

/** `days` from today, `hours` from the live session's start time. */
export function slot(days: number, hours = 0): string {
  const d = new Date(LIVE_SLOT + hours * HOUR);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** `days` from today at a local clock time, e.g. `at(1, '09:00')`. */
export function at(days: number, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

/** A local calendar date `days` from today, as yyyy-mm-dd. */
export function day(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDate(d);
}

export function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
